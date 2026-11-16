/* Room Creator 0.16 — Vehicle World: the one physical authority for vehicles (opt-in: routeNet.vehicleLoop.runtime === "world").
   Every vehicle — moving or parked — is one persistent object with a stable id (veh_000001 …), a canonical class
   (vehicle-classes.js), a real footprint and a position on the authored road graph (vehicle-graph.js).
   Driver behaviour is the unchanged Vehicle Loop v0.4 maths in route-traffic.js: delayed local perception, finite
   acceleration/braking, no invisible gap clamp. V2 adds an external driver-intent seam: controllers may request
   throttle / brake / reverse / lateral steer / next-junction branch, but Vehicle World alone converts that intent into
   speed and pose. V2.4 adds guided GO/HOLD road motion plus authored bay capture/release: longitudinal motion follows
   the same traffic perception automatically, while lateral intent chooses lanes/branches/bays. V2.5.1 adds ordered
   transit route legs and ROOM-authored live vehicle seat poses; service branches are consumed only after physical entry. V2.5.3 passes
   loop-seam context into the graph so nonzero lane offsets remain continuous when a guided/service route wraps. Authored traffic (vehicle-traffic.js) only requests spawns; signals (vehicle-signals.js) only supply
   control state. Actor identity and seat occupancy remain outside Vehicle World.

   Determinism: fixed step only (W.step() advances exactly one step); seeded generators; vehicles processed in id order;
   no Math.random / Date / performance. Everything that comes from outside — people's bodies, presentation hints,
   commands — is logged with the tick it applies from, so exportRun() + replay() reproduce a run exactly.

   Tick order (schema §81): 1 apply nothing new (inputs are applied when given, between steps) · 2 perceive (every
   senseInterval, delivered after each driver's reaction time) · 3 decide (route-traffic.decideTraffic + signal /
   exit-hold stop targets) · 4 integrate along the route · 5 same-route contacts (route-traffic.resolveContacts) ·
   6 exits · 7 pose · 8 footprint contacts (vehicle–vehicle, vehicle–person) · 9 signal violations / phase changes ·
   10 spawning (generic spawner or authored flows) · 11 events. */
(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCVehicleWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const SCHEMA='rc-vehicle-world@0.1',RUN_SCHEMA='rc-vehicle-run@0.1',DRIVER_INTENT_SCHEMA='rc-vehicle-driver-intent@0.1',GUIDED_INTENT_SCHEMA='rc-vehicle-guided-intent@0.1',INTERACTION_CUE_SCHEMA='rc-vehicle-interaction-cues@0.1',TRANSIT_SCHEMA='rc-vehicle-transit@0.1',MOBILE_INTERIOR_SCHEMA='rc-mobile-interior@0.1',SEAT_POSE_SCHEMA='rc-vehicle-seat-pose@0.1';
  const dep=(name,file)=>(root&&root[name])||(typeof require==='function'?require(file):null);
  const T=()=>dep('RCRouteTraffic','./route-traffic.js'),G=()=>dep('RCVehicleGraph','./vehicle-graph.js'),K=()=>dep('RCVehicleClasses','./vehicle-classes.js');
  const TR=()=>{try{return dep('RCVehicleTraffic','./vehicle-traffic.js');}catch(e){return null;}},SG=()=>{try{return dep('RCVehicleSignals','./vehicle-signals.js');}catch(e){return null;}};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),deep=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const wrap=a=>((a%360)+540)%360-180,norm=a=>((a%360)+360)%360;
  const basis=h=>{const r=h*Math.PI/180;return {fx:Math.sin(r),fy:-Math.cos(r),rx:Math.cos(r),ry:Math.sin(r)};};
  function mulberry(a){a>>>=0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function hash32(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
  const STATES=Object.freeze(['SPAWNED','DRIVING','TURNING','PARKING_APPROACH','MANEUVER_IN','PARKED','MANEUVER_OUT','STOPPED','PULLED_OVER','BLOCKED','COLLISION_RECOVERY','DISABLED','ABANDONED','OFFSTAGE','RETIRED']);
  const SPACE_STATES=Object.freeze(['OPEN','RESERVED','ENTRY_IN_PROGRESS','OCCUPIED','EXIT_IN_PROGRESS','SPACE_BLOCKED','CLOSED']);
  const WORLD_DEFAULTS=Object.freeze({maxTracked:12,exitViewDistance:25,entryViewDistance:25,handling:'legacy',laneDrift:.1,laneDriftSeconds:1.5,
    severityContact:1.5,severityLight:4,severityModerate:9,maxEvents:2000,maxLoggedEvents:50000,stopLineBuffer:.5,contactHoldSeconds:.30,pedestrianRadius:.34,
    disableBraking:false,autoPopulate:true,autoSpawn:true,boxClearSpeed:1.5,externalCoastDecel:.8,externalMaxSpeed:20,reverseMaxSpeed:4,
    externalSteerSpeed:1.2,externalSteerAccel:3.0,activationMaxLateral:4.5,parkingMergeLateralPerMeter:.65,
    guidedCruiseScale:1,parkingManeuverSpeed:2.2,parkingCaptureWindow:4.5,parkingCaptureSteerThreshold:.35,parkingCaptureMaxSpeed:12,parkingPathStopBuffer:.25,
    laneChangeSpeed:1.45,laneChangeAccel:3.2,laneChangeSafetyGap:3.0,laneBranchCommitDistance:30,transitDoorSeconds:.7,interiorWalkSpeed:1.55});

  function worldConfig(over={}){
    const out={...WORLD_DEFAULTS};
    for(const [k,v] of Object.entries(over||{}))if(Object.prototype.hasOwnProperty.call(WORLD_DEFAULTS,k)&&typeof v===typeof WORLD_DEFAULTS[k])out[k]=v;
    if(!['legacy','scaled'].includes(out.handling))out.handling='legacy';
    return out;
  }
  function severityOf(closing,wc){return closing<wc.severityContact?'CONTACT':closing<wc.severityLight?'LIGHT':closing<wc.severityModerate?'MODERATE':'HARD';}
  const NEUTRAL_INTENT=Object.freeze({throttle:0,brake:0,reverse:false,steer:0,branch:null});
  function normalizeIntent(i={}){const branch=['left','straight','right'].includes(i.branch)?i.branch:null,out={throttle:clamp(Number.isFinite(i.throttle)?i.throttle:0,0,1),brake:clamp(Number.isFinite(i.brake)?i.brake:0,0,1),reverse:!!i.reverse,steer:clamp(Number.isFinite(i.steer)?i.steer:0,-1,1),branch};if(['go','hold'].includes(i.motion))out.motion=i.motion;return out;}
  function sameIntent(a,b){return !!a&&a.throttle===b.throttle&&a.brake===b.brake&&a.reverse===b.reverse&&a.steer===b.steer&&a.branch===b.branch&&a.motion===b.motion;}
  function pathInfo(points){const pts=(points||[]).filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)).map(q=>({x:+q.x,y:+q.y,story:Number.isInteger(q.story)?q.story:0})),cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y));return {pts,cum,total:cum[cum.length-1]||0};}
  function pathPose(path,s){if(!path?.pts?.length)return null;if(path.pts.length===1)return {...path.pts[0],heading:0};s=clamp(s,0,path.total);let i=1;while(i<path.pts.length-1&&path.cum[i]<s)i++;const a=path.pts[i-1],b=path.pts[i],span=path.cum[i]-path.cum[i-1],t=span>1e-9?(s-path.cum[i-1])/span:0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,story:a.story,heading:norm(Math.atan2(b.x-a.x,-(b.y-a.y))*180/Math.PI)};}
  function pathNearest(path,p){let best=null;if(!path?.pts?.length)return null;for(let i=1;i<path.pts.length;i++){const a=path.pts[i-1],b=path.pts[i],dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy,L=Math.sqrt(L2)||1,t=L2?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L2,0,1):0,x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(p.x-x,p.y-y),ss=path.cum[i-1]+L*t;if(!best||d<best.dist)best={s:ss,dist:d};}return best;}
  /* rotated rectangle overlap (separating axes); returns null or {overlap, nx, ny} with the normal pointing from a to b */
  function rectOverlap(a,b){
    const dx=b.x-a.x,dy=b.y-a.y;let best=null;
    for(const [nx,ny] of [[a.fx,a.fy],[a.rx,a.ry],[b.fx,b.fy],[b.rx,b.ry]]){
      const d=dx*nx+dy*ny,ea=a.hl*Math.abs(a.fx*nx+a.fy*ny)+a.hw*Math.abs(a.rx*nx+a.ry*ny),eb=b.hl*Math.abs(b.fx*nx+b.fy*ny)+b.hw*Math.abs(b.rx*nx+b.ry*ny);
      const o=ea+eb-Math.abs(d);if(o<=0)return null;if(!best||o<best.overlap)best={overlap:o,nx:d<0?-nx:nx,ny:d<0?-ny:ny};}
    return best;
  }

  function create(opts={}){
    const RT=T(),GV=G(),KC=K();if(!RT||!GV||!KC)throw Error('Vehicle World needs route-traffic.js, vehicle-graph.js and vehicle-classes.js.');
    const routeNet=opts.routeNet||{},spec=routeNet.vehicleLoop||{},seed=((Number.isFinite(opts.seed)?opts.seed:(routeNet.settings?.seed||1977))>>>0);
    const configIn={...(spec.config||{}),...(opts.config||{})},cfg=RT.config(configIn),wc=worldConfig(configIn);
    const classes=opts.classes||KC.resolve(spec.classes),classProblems=KC.validate(classes);
    if(classProblems.length)throw Error('Vehicle classes: '+classProblems[0]);
    const graph=GV.fromRouteNet(routeNet),h=cfg.fixedStep,steadyBase=RT.DRIVER_STYLES[1];
    const W={tick:0,vehicles:[],byId:new Map(),offstage:[],serial:0,events:[],eventLog:[],droppedEvents:0,seq:0,inputs:[],
      bodies:[],bodiesKey:'[]',suppressedBodies:new Set(),hints:{watchedExits:[],visibleEntries:[]},hintsKey:'',contacts:new Set(),impactKeys:new Set(),spaces:new Map(),
      transit:new Map(),transitByVehicle:new Map(),interiorActors:new Map(),
      rng:mulberry((seed^0x51f15e)>>>0),nextSpawnAt:cfg.initialDelay,manualSpawns:0,signalPhase:new Map(),violations:0};
    const time=()=>W.tick*h;
    function emit(type,data={}){const e={seq:++W.seq,tick:W.tick,time:+time().toFixed(6),type,...data};W.events.push(e);if(W.events.length>wc.maxEvents)W.events.splice(0,W.events.length-wc.maxEvents);
      if(W.eventLog.length<wc.maxLoggedEvents)W.eventLog.push(e);else W.droppedEvents++;return e;}
    function logInput(kind,data){W.inputs.push({tick:W.tick,kind,data:deep(data)});}

    /* ---------------- authored traffic + signals (only when routeNet.vehicleTraffic.enabled === true) */
    const vt=routeNet.vehicleTraffic,trafficApi=TR(),signalsApi=SG();
    const trafficOn=!!(vt&&vt.enabled===true&&trafficApi);
    const signals=trafficOn&&signalsApi?signalsApi.compile(vt.signals||[],graph,{fixedStep:h,stopLineBuffer:wc.stopLineBuffer}):null;
    /* stop lines per route: each signal-controlled connector's line sits stopLineBuffer before the connector entry */
    const routeStops=new Map();
    function stopsFor(route){
      if(!signals)return [];if(routeStops.has(route.id))return routeStops.get(route.id);
      const out=[];for(const part of route.parts){const b=signals.byConnector.get(part.elementId);if(b)out.push({connectorId:part.elementId,signalId:b.signalId,groupId:b.groupId,stopRs:part.start-signals.stopLineBuffer});}
      routeStops.set(route.id,out);return out;
    }

    /* ---------------- vehicles */
    function cruiseFor(route,u){const el=graph.elements.get(route.elements[0]),sp=el?.speedPolicy||{},base=Number.isFinite(sp.cruise)?sp.cruise:8.5;
      const lo=Number.isFinite(sp.min)?sp.min:base*cfg.cruiseVariationMin,hi=Number.isFinite(sp.max)?sp.max:base*cfg.cruiseVariationMax;return lo+(hi-lo)*u;}
    function driverFor(serial,cls){let d=RT.driverFor((seed^0x51f15e)>>>0,serial);if(wc.handling==='scaled')d=KC.scaleDriver(d,cls.handlingProfileId,steadyBase);return d;}
    function makeVehicle(o){
      const cls=classes[o.classId],serial=++W.serial,id='veh_'+String(serial).padStart(6,'0'),fp=KC.footprint(cls),driver=driverFor(serial,cls);
      const pr=mulberry((seed^hash32(id))>>>0),driftRoom=o.route?Math.max(0,o.route.minHalfWidth-fp.halfWidth):0,drift=clamp(wc.laneDrift*(2*pr()-1),-driftRoom,driftRoom);
      const v={id,classId:o.classId,cls,state:o.state||'DRIVING',overlay:'NONE',lifecycle:{persistent:!!o.persistent,promoted:!!o.promoted,origin:o.origin},
        visual:o.visual||{kind:'card',propId:null,assetId:cls.visual?.defaultAsset||null},footprint:fp,halfLength:fp.halfLength,halfWidth:fp.halfWidth,
        route:o.route||null,rs:o.rs||0,lateral:Number.isFinite(o.lateral)?o.lateral:0,driftTarget:drift,x:0,y:0,story:2,heading:0,
        speed:o.speed||0,cruiseSpeed:o.speed||0,acceleration:0,targetSpeed:o.speed||0,braking:false,emergency:false,aiState:'cruising',responseTo:null,
        driver,laneId:o.route?o.route.id:null,observations:[],perception:null,nextSenseAt:time()+driver.phase,contactHold:0,contactCount:0,lastContactAt:null,lastSeverity:null,
        controller:{mode:['external','guided','service'].includes(o.controllerMode)?o.controllerMode:'ai'},intent:{...NEUTRAL_INTENT,...(['guided','service'].includes(o.controllerMode)?{motion:'hold'}:{})},driveDirection:1,lateralVelocity:0,reverseLimitLatched:false,loopLaps:0,
        laneIndex:Number.isInteger(o.laneIndex)?o.laneIndex:null,laneTarget:Number.isInteger(o.laneIndex)?o.laneIndex:null,laneChanging:false,steerLatch:0,laneRefusal:null,
        parking:{spaceId:o.spaceId||null,task:'NONE',path:null,pathS:0},traffic:o.traffic||{unitId:null,flowId:null},serviceId:o.serviceId||null,driverActorId:o.driverActorId||null,doorState:o.doorState||'CLOSED',signalLatch:null,signalNote:null,born:time()};
      if(o.pose){v.x=o.pose.x;v.y=o.pose.y;v.heading=o.pose.heading;v.story=o.pose.story??2;}else syncPose(v,true);
      W.vehicles.push(v);W.byId.set(id,v);return v;
    }
    const maneuvering=v=>v.state==='PARKING_APPROACH'||v.state==='MANEUVER_IN'||v.state==='MANEUVER_OUT'&&!!v.parking?.path;
    const moving=v=>v.state==='DRIVING'||v.state==='STOPPED'||v.state==='MANEUVER_OUT'||v.state==='PARKING_APPROACH'||v.state==='MANEUVER_IN';
    const roadMoving=v=>moving(v)&&!!v.route&&!maneuvering(v);
    const aiDriven=v=>roadMoving(v)&&v.controller.mode==='ai';
    const guidedDriven=v=>roadMoving(v)&&(v.controller.mode==='guided'||v.controller.mode==='service');
    function syncPose(v,snap=false){
      if(!v.route)return;const q=GV.poseOnRoute(graph,v.route,v.rs,v.lateral),prev=v.partIndex;v.x=q.x;v.y=q.y;v.story=q.story;v.elementId=q.elementId;v.elementS=q.s;v.partIndex=q.index;
      if(Number.isInteger(prev)&&q.index>prev){const el=graph.elements.get(q.elementId);if(el&&el.type!=='edge')emit('vehicle_entered_connector',{vehicleId:v.id,connectorId:el.id,intersectionId:el.intersectionId||null});}
      if(snap||!Number.isFinite(v.heading))v.heading=q.heading;else{const turn=120*h;v.heading=norm(v.heading+clamp(wrap(q.heading-v.heading),-turn,turn));}
    }
    function rect(v){const b=basis(v.heading);return {x:v.x,y:v.y,hl:v.halfLength,hw:v.halfWidth,...b};}

    /* adoption: every parked prop tied to a parking space becomes a PARKED vehicle (sorted by space id) */
    const propsById=new Map((opts.props||[]).map(p=>[p.id,p]));
    for(const sp of [...(routeNet.parking?.spaces||[])].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){
      W.spaces.set(sp.id,{spaceId:sp.id,state:'OPEN',occupantVehicleId:null,reservedByVehicleId:null,blockingReason:null,accessEnabled:sp.access?.enabled!==false});
      if(sp.status==='occupied'&&sp.occupantPropId){const bx=sp.vehicleBox||{},prop=propsById.get(sp.occupantPropId),requested=sp.vehicleClassId||prop?.gameplay?.props?.vehicleClassId||'sedan',classId=classes[requested]?requested:'sedan';
        const v=makeVehicle({classId,state:'PARKED',origin:'adopted_prop',spaceId:sp.id,visual:{kind:'prop',propId:sp.occupantPropId,assetId:prop?.asset||null},
          pose:{x:((bx.x0??0)+(bx.x1??0))/2,y:((bx.y0??0)+(bx.y1??0))/2,heading:Number.isFinite(sp.heading)?sp.heading:90,story:sp.story??2}});
        Object.assign(W.spaces.get(sp.id),{state:'OCCUPIED',occupantVehicleId:v.id});emit('vehicle_adopted',{vehicleId:v.id,spaceId:sp.id,propId:sp.occupantPropId});}}


    /* ---------------- V2.5 public transit + moving interiors ----------------
       ROOM owns the physical service state, bay/door interlocks and the local moving interior. The driverActorId is
       only a binding supplied by the host; ROOM does not invent the NPC or its motives. */
    const transitSpec=routeNet.vehicleTransit&&typeof routeNet.vehicleTransit==='object'?routeNet.vehicleTransit:null;
    function transitServiceForVehicle(v){return v?.serviceId?W.transit.get(v.serviceId)||null:W.transitByVehicle.get(v?.id)||null;}
    function serviceStopBySpace(svc,spaceId){return svc?.stops?.findIndex(st=>st.spaceId===spaceId)??-1;}
    function setTransitDoor(svc,state){if(!svc)return;state=String(state||'CLOSED').toUpperCase();if(svc.doorState===state)return;svc.doorState=state;const v=W.byId.get(svc.vehicleId);if(v)v.doorState=state;emit('transit_door_changed',{serviceId:svc.id,vehicleId:svc.vehicleId,state,spaceId:v?.parking?.spaceId||null});}
    function initTransit(){if(!transitSpec||!Array.isArray(transitSpec.services))return;for(const def of [...transitSpec.services].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
        const sp=parkingDef(def.initialSpaceId),live=sp&&W.spaces.get(sp.id),cls=classes[def.classId||'bus'];if(!sp||!live||!cls||live.state!=='OPEN')continue;const c=parkingCenter(sp),driverActorId=typeof def.initialDriverActorId==='string'&&def.initialDriverActorId?def.initialDriverActorId:null;
        const v=makeVehicle({classId:def.classId||'bus',state:'PARKED',origin:'transit_service',spaceId:sp.id,controllerMode:'service',serviceId:def.id,driverActorId,doorState:'OPEN',persistent:true,promoted:true,pose:{x:c.x,y:c.y,heading:Number.isFinite(sp.heading)?sp.heading:90,story:c.story},visual:{kind:'card',propId:null,assetId:cls.visual?.defaultAsset||null}});
        Object.assign(live,{state:'OCCUPIED',occupantVehicleId:v.id,reservedByVehicleId:null});const stopIndex=Math.max(0,(def.stops||[]).findIndex(st=>st.spaceId===sp.id));const svc={id:def.id,label:def.label||def.id,vehicleId:v.id,classId:v.classId,active:def.initialActive===true,driverRequired:def.driverRequired!==false,driverActorId,dwellSeconds:Number.isFinite(def.dwellSeconds)?Math.max(0,def.dwellSeconds):10,state:def.initialActive===true?'DWELLING':'INACTIVE_AT_BAY',doorState:'OPEN',dwellRemaining:def.initialActive===true?Math.max(0,def.dwellSeconds||0):null,doorRemaining:0,currentStopIndex:stopIndex,nextStopIndex:(stopIndex+1)%def.stops.length,stops:deep(def.stops),initialSpaceId:def.initialSpaceId,routeLegs:deep(def.routeLegs||[]),routeNotes:deep(def.routeNotes||{}),routeLegKey:null,routeLegCursor:0,routeLastElement:null,routeLegFault:null};
        W.transit.set(svc.id,svc);W.transitByVehicle.set(v.id,svc);emit('transit_service_staged',{serviceId:svc.id,vehicleId:v.id,spaceId:sp.id,active:svc.active,driverActorId:svc.driverActorId,doorState:'OPEN'});}}
    function onTransitParked(v,spaceId){const svc=transitServiceForVehicle(v);if(!svc)return;const i=serviceStopBySpace(svc,spaceId);if(i>=0){svc.currentStopIndex=i;svc.nextStopIndex=(i+1)%svc.stops.length;}resetTransitLeg(svc,null);svc.state=svc.active?'DWELLING':'INACTIVE_AT_BAY';svc.dwellRemaining=svc.active?svc.dwellSeconds:null;svc.doorRemaining=0;v.intent={...v.intent,motion:'hold',steer:0,branch:null};setTransitDoor(svc,'OPEN');emit('transit_arrived',{serviceId:svc.id,vehicleId:v.id,spaceId,stopId:i>=0?svc.stops[i].id:null,dwellSeconds:svc.active?svc.dwellSeconds:null});}
    function onTransitExitCompleted(v,spaceId){const svc=transitServiceForVehicle(v);if(!svc)return;resetTransitLeg(svc,v);svc.state='EN_ROUTE';svc.dwellRemaining=null;svc.doorRemaining=0;setTransitDoor(svc,'CLOSED');emit('transit_departed',{serviceId:svc.id,vehicleId:v.id,spaceId,targetStopId:svc.stops[svc.nextStopIndex]?.id||null,routeLegKey:svc.routeLegKey,branchSequence:transitLegSequence(svc)});}
    function transitTarget(svc){return svc?.stops?.[svc.nextStopIndex]||null;}
    function routePointAhead(v,elementId,s){if(!v?.route||!elementId||!Number.isFinite(s))return null;const L=GV.locate?.(graph,v.route,v.rs);if(!L)return null;for(let i=L.index;i<v.route.parts.length;i++){const p=v.route.parts[i];if(p.elementId!==elementId)continue;const at=clamp(s,p.enterS,p.exitS),rs=p.start+(at-p.enterS);if(rs+1e-6>=v.rs)return {rs,index:i,distance:Math.max(0,rs-v.rs)};}return null;}
    function transitLegKey(svc){const from=svc?.stops?.[svc.currentStopIndex],to=transitTarget(svc);return `${from?.id||svc?.currentStopIndex}->${to?.id||svc?.nextStopIndex}`;}
    function transitLeg(svc){if(!svc)return null;const key=transitLegKey(svc),from=svc.stops?.[svc.currentStopIndex],to=transitTarget(svc);return (svc.routeLegs||[]).find(q=>q&&((q.id&&q.id===key)||(q.fromStopId===from?.id&&q.toStopId===to?.id)))||null;}
    function transitLegSequence(svc){const leg=transitLeg(svc),seq=leg?.branchSequence;return Array.isArray(seq)?seq.filter(x=>typeof x==='string'&&x):[];}
    function resetTransitLeg(svc,v=null){if(!svc)return;svc.routeLegKey=transitLegKey(svc);svc.routeLegCursor=0;svc.routeLastElement=v?.elementId||null;svc.routeLegFault=null;}
    function syncTransitLegProgress(v,svc){if(!v||!svc)return;const now=v.elementId||null;if(!now||now===svc.routeLastElement)return;svc.routeLastElement=now;const seq=transitLegSequence(svc),expected=seq[svc.routeLegCursor]||null;if(expected&&now===expected){svc.routeLegCursor++;emit('transit_route_step_completed',{serviceId:svc.id,vehicleId:v.id,legKey:svc.routeLegKey||transitLegKey(svc),elementId:now,stepIndex:svc.routeLegCursor-1,remaining:Math.max(0,seq.length-svc.routeLegCursor)});}}
    function transitLegComplete(svc){const seq=transitLegSequence(svc);return !seq.length||svc.routeLegCursor>=seq.length;}
    function serviceExpectedConnector(svc){const seq=transitLegSequence(svc);return seq[svc.routeLegCursor]||null;}
    function serviceLegacyConnector(svc){if(!svc)return null;const from=svc.stops?.[svc.currentStopIndex],to=transitTarget(svc),legs=svc.routeNotes?.legs||{},key=`${from?.id||svc.currentStopIndex}->${to?.id||svc.nextStopIndex}`;if(typeof legs[key]==='string')return legs[key];if(svc.currentStopIndex===0&&svc.nextStopIndex===1&&typeof svc.routeNotes?.outboundFork==='string')return svc.routeNotes.outboundFork;if(svc.currentStopIndex===1&&svc.nextStopIndex===0&&typeof svc.routeNotes?.returnFork==='string')return svc.routeNotes.returnFork;return null;}
    function serviceReservedConnectors(svc){const out=new Set([svc?.routeNotes?.outboundFork,svc?.routeNotes?.returnFork,...Object.values(svc?.routeNotes?.legs||{})].filter(x=>typeof x==='string'));for(const leg of svc?.routeLegs||[])for(const id of leg?.branchSequence||[])if(typeof id==='string')out.add(id);return out;}
    function localBranchOption(b,svc){if(!b?.options?.length)return null;const reserved=serviceReservedConnectors(svc);return b.options.find(o=>!reserved.has(o.elementId))||b.options[0]||null;}
    function serviceDesiredLane(v,svc){if(!v?.route||!svc)return;syncTransitLegProgress(v,svc);const ce=currentElement(v),lm=ensureLaneState(v,ce?.el),target=transitTarget(svc),sp=target&&parkingDef(target.spaceId),access=sp&&graph.spaceAccess.get(sp.id),legDone=transitLegComplete(svc),targetAhead=legDone&&access&&routePointAhead(v,access.accessEdge,access.approachS),b=GV.nextBranch?.(graph,v.route,v.rs,null);let branchRs=null;if(b&&v.route.parts[b.index]){const p=v.route.parts[b.index];branchRs=p.start+(p.exitS-p.enterS);}
      const targetBeforeBranch=!!targetAhead&&(branchRs==null||targetAhead.rs<=branchRs+1e-6);if(targetBeforeBranch){if(lm){const required=Number.isInteger(sp?.access?.requiredLane)?sp.access.requiredLane:lm.parkingLane;if(Number.isInteger(required))requestLane(v,required,'transit-stop');}const local=localBranchOption(b,svc);v.intent.branch=local?.kind||null;return;}
      if(!b){v.intent.branch=null;return;}const expected=serviceExpectedConnector(svc),legacy=!transitLegSequence(svc).length?serviceLegacyConnector(svc):null,desired=(expected&&b.options.find(o=>o.elementId===expected))||(legacy&&b.options.find(o=>o.elementId===legacy))||localBranchOption(b,svc);if(!desired){v.intent.branch=null;return;}const from=graph.elements.get(b.elementId),required=from?.lanes?.branchLanes?.[desired.kind];if(lm&&Number.isInteger(required))requestLane(v,required,(expected&&desired.elementId===expected)||(legacy&&desired.elementId===legacy)?'transit-route':'transit-loop');v.intent.branch=desired.kind||null;}
    function maybeBeginTransitCapture(v){const svc=transitServiceForVehicle(v);if(!svc||!svc.active||svc.state!=='EN_ROUTE'||v.state!=='DRIVING')return false;const target=transitTarget(svc);if(!target)return false;serviceDesiredLane(v,svc);if(!transitLegComplete(svc))return false;for(const c of parkingCaptureCandidates(v))if(c.spaceId===target.spaceId){const sp=parkingDef(c.spaceId),r=beginParkingCapture(v,sp);if(r.ok){svc.state='PARKING';setTransitDoor(svc,'CLOSED');return true;}}return false;}
    function transitBeforeStep(){for(const svc of [...W.transit.values()].sort((a,b)=>a.id.localeCompare(b.id))){const v=W.byId.get(svc.vehicleId);if(!v)continue;v.driverActorId=svc.driverActorId;v.doorState=svc.doorState;if(!svc.active){if(v.state==='PARKED'){svc.state='INACTIVE_AT_BAY';setTransitDoor(svc,'OPEN');}v.intent={...v.intent,motion:'hold',steer:0,branch:null};continue;}
        if(svc.driverRequired&&!svc.driverActorId){svc.state=v.state==='PARKED'?'WAITING_FOR_DRIVER_AT_BAY':'WAITING_FOR_DRIVER';v.intent={...v.intent,motion:'hold',steer:0,branch:null};if(v.state==='PARKED')setTransitDoor(svc,'OPEN');continue;}
        if(svc.state==='DWELLING'){svc.dwellRemaining=Math.max(0,(svc.dwellRemaining??svc.dwellSeconds)-h);v.intent={...v.intent,motion:'hold',steer:0,branch:null};if(svc.dwellRemaining<=1e-9){svc.state='DOOR_CLOSING';svc.doorRemaining=wc.transitDoorSeconds;setTransitDoor(svc,'CLOSING');}continue;}
        if(svc.state==='DOOR_CLOSING'){svc.doorRemaining=Math.max(0,svc.doorRemaining-h);if(svc.doorRemaining<=1e-9){setTransitDoor(svc,'CLOSED');const r=beginParkingExit(v);if(r.ok){svc.state='DEPARTING';v.intent={...v.intent,motion:'go',steer:0,branch:'straight'};}else{svc.state='DWELLING';svc.dwellRemaining=1;setTransitDoor(svc,'OPEN');}}continue;}
        if(v.state==='PARKED'&&svc.state!=='PARKING'){onTransitParked(v,v.parking.spaceId);continue;}if(roadMoving(v)){svc.state='EN_ROUTE';v.intent={...v.intent,motion:'go'};serviceDesiredLane(v,svc);}}
    }
    function transitState(svc){if(!svc)return null;const v=W.byId.get(svc.vehicleId),target=transitTarget(svc),seq=transitLegSequence(svc);return {schema:TRANSIT_SCHEMA,serviceId:svc.id,label:svc.label,vehicleId:svc.vehicleId,classId:svc.classId,active:svc.active,state:svc.state,driverRequired:svc.driverRequired,driverActorId:svc.driverActorId,dwellSeconds:r3(svc.dwellSeconds),dwellRemaining:svc.dwellRemaining==null?null:r3(svc.dwellRemaining),doorState:svc.doorState,currentStopIndex:svc.currentStopIndex,nextStopIndex:svc.nextStopIndex,currentStop:svc.stops[svc.currentStopIndex]||null,targetStop:target||null,vehicleState:v?.state||null,spaceId:v?.parking?.spaceId||null,routeLeg:{key:svc.routeLegKey||transitLegKey(svc),branchSequence:[...seq],cursor:svc.routeLegCursor||0,complete:transitLegComplete(svc),expectedConnector:serviceExpectedConnector(svc),lastElement:svc.routeLastElement||null,fault:svc.routeLegFault||null}};}
    function setTransitDriverNow(serviceId,actorId){const svc=W.transit.get(serviceId);if(!svc)return {ok:false,reason:'unknown_service'};svc.driverActorId=actorId==null||actorId===''?null:String(actorId);const v=W.byId.get(svc.vehicleId);if(v)v.driverActorId=svc.driverActorId;emit('transit_driver_changed',{serviceId,vehicleId:svc.vehicleId,driverActorId:svc.driverActorId});return {ok:true,driverActorId:svc.driverActorId};}
    function setTransitActiveNow(serviceId,active=true){const svc=W.transit.get(serviceId);if(!svc)return {ok:false,reason:'unknown_service'};const yes=active!==false,v=W.byId.get(svc.vehicleId);if(yes&&svc.driverRequired&&!svc.driverActorId)return {ok:false,reason:'driver_required'};if(!yes&&v?.state!=='PARKED')return {ok:false,reason:'service_can_only_deactivate_at_bay'};svc.active=yes;if(!yes){svc.state='INACTIVE_AT_BAY';svc.dwellRemaining=null;setTransitDoor(svc,'OPEN');}
      else if(v?.state==='PARKED'){svc.state='DWELLING';svc.dwellRemaining=svc.dwellSeconds;setTransitDoor(svc,'OPEN');}emit(yes?'transit_service_activated':'transit_service_deactivated',{serviceId,vehicleId:svc.vehicleId,dwellSeconds:svc.dwellSeconds});return {ok:true,active:yes,state:svc.state};}
    function setTransitDwellNow(serviceId,seconds){const svc=W.transit.get(serviceId);if(!svc)return {ok:false,reason:'unknown_service'};if(!(Number.isFinite(seconds)&&seconds>=0))return {ok:false,reason:'bad_dwell'};svc.dwellSeconds=seconds;if(svc.state==='DWELLING')svc.dwellRemaining=seconds;emit('transit_dwell_changed',{serviceId,seconds});return {ok:true,dwellSeconds:seconds};}
    function localToWorld(v,x,z){const b=basis(v.heading);return {x:r3(v.x-b.rx*x+b.fx*z),y:r3(v.y-b.ry*x+b.fy*z),story:v.story,heading:r3(norm(v.heading))};}
    function interiorStateForVehicle(v){const mi=v?.cls?.mobileInterior;if(!v||!mi)return null;const actors=[];for(const a of W.interiorActors.values())if(a.vehicleId===v.id){const w=localToWorld(v,a.x,a.z);actors.push({actorId:a.actorId,vehicleId:v.id,local:{x:r3(a.x),z:r3(a.z),heading:r3(a.heading)},world:{...w,heading:r3(norm(v.heading+a.heading))},input:{...a.input}});}return {schema:MOBILE_INTERIOR_SCHEMA,vehicleId:v.id,classId:v.classId,doorState:v.doorState,bounds:deep(mi.bounds),entry:deep(mi.entry),nodes:deep(mi.nodes||[]),edges:deep(mi.edges||[]),positions:deep(mi.positions||[]),actors};}
    function boardTransitActorNow(actorId,vehicleId){actorId=actorId==null?'':String(actorId);const v=W.byId.get(vehicleId),svc=transitServiceForVehicle(v),mi=v?.cls?.mobileInterior;if(!actorId)return {ok:false,reason:'bad_actor_id'};if(!v||!svc||!mi)return {ok:false,reason:'not_boardable_transit'};const access=vehicleAccessStatus(v);if(!access.allowed)return {ok:false,reason:access.reason||'door_closed'};if(W.interiorActors.has(actorId))return {ok:false,reason:'actor_already_aboard'};const e=mi.entry||{x:0,z:0,heading:0};W.interiorActors.set(actorId,{actorId,vehicleId:v.id,x:e.x||0,z:e.z||0,heading:e.heading||0,input:{forward:0,side:0}});W.suppressedBodies.add(actorId);W.bodies=W.bodies.filter(b=>b.id!==actorId);W.bodiesKey=JSON.stringify(W.bodies);emit('transit_actor_boarded',{actorId,serviceId:svc.id,vehicleId:v.id,spaceId:v.parking.spaceId});return {ok:true,actorId,vehicleId:v.id};}
    function setInteriorInputNow(actorId,input={}){actorId=String(actorId||'');const a=W.interiorActors.get(actorId);if(!a)return {ok:false,reason:'actor_not_aboard'};a.input={forward:clamp(Number.isFinite(input.forward)?input.forward:0,-1,1),side:clamp(Number.isFinite(input.side)?input.side:0,-1,1)};return {ok:true,input:{...a.input}};}
    function alightTransitActorNow(actorId){actorId=String(actorId||'');const a=W.interiorActors.get(actorId),v=a&&W.byId.get(a.vehicleId);if(!a||!v)return {ok:false,reason:'actor_not_aboard'};const access=vehicleAccessStatus(v);if(!access.allowed)return {ok:false,reason:access.reason||'door_closed'};const door=vehicleAccessPoints(v).find(q=>q.accessKind==='interior_portal'||q.type==='passenger_door')||vehicleAccessPoints(v)[0];W.interiorActors.delete(actorId);W.suppressedBodies.delete(actorId);emit('transit_actor_alighted',{actorId,serviceId:v.serviceId,vehicleId:v.id,spaceId:v.parking.spaceId});return {ok:true,actorId,vehicleId:v.id,place:door?{x:door.x,y:door.y,story:door.story,heading:door.heading}:null};}
    function stepInteriorActors(){for(const a of W.interiorActors.values()){const v=W.byId.get(a.vehicleId),mi=v?.cls?.mobileInterior;if(!v||!mi)continue;const speed=Number.isFinite(mi.walkSpeed)?mi.walkSpeed:wc.interiorWalkSpeed,b=mi.bounds||{},dx=-(a.input?.side||0)*speed*h,dz=(a.input?.forward||0)*speed*h;a.x=clamp(a.x+dx,Number.isFinite(b.x0)?b.x0:-1,Number.isFinite(b.x1)?b.x1:1);a.z=clamp(a.z+dz,Number.isFinite(b.z0)?b.z0:-4,Number.isFinite(b.z1)?b.z1:4);if(Math.abs(dx)+Math.abs(dz)>.001)a.heading=norm(Math.atan2(-dx,dz)*180/Math.PI);}}
    initTransit();

    /* ---------------- spawning helpers */
    function routeVehicles(route){return W.vehicles.filter(o=>o.route===route&&moving(o));}
    /* runtime spawns keep the legacy spawn gap (minSpawnGap + speed difference); scene-start placement only needs
       physical room (2 m bumper to bumper), as the legacy seeding placed its closing pair 13.5 m apart. */
    function gapBlocked(route,rs,cls,speed,initial=false){
      const hl=cls.geometry.length/2;
      for(const o of routeVehicles(route)){const gap=Math.abs(o.rs-rs)-(o.halfLength+hl);if(gap<(initial?2:cfg.minSpawnGap+Math.abs(speed-o.speed)*2))return true;}
      const q=GV.poseOnRoute(graph,route,rs,0),b=basis(q.heading),me={x:q.x,y:q.y,hl,hw:cls.geometry.width/2,...b};
      for(const o of W.vehicles)if(o.route!==route&&o.story===q.story&&Math.hypot(o.x-q.x,o.y-q.y)<12&&rectOverlap(me,rect(o)))return true;
      return false;
    }
    function routeCheck(cls,portalId){
      const route=graph.routeFrom(portalId);if(!route||!route.parts.length)return {reason:'portal_not_eligible'};
      if(trafficApi){const r=trafficApi.routeEligibility(cls,graph,portalId);if(r)return {reason:r};}
      else if(!KC.fitsCorridor(cls,route.minHalfWidth))return {reason:'vehicle_too_wide'};
      return {route};
    }
    /* the single entry point for every runtime spawn (generic spawner, flows, manual unit spawn, debug command) */
    function tryPlace(classId,portalId,o={}){
      const cls=classes[classId];if(!cls)return {ok:false,reason:'unknown_class'};
      const rc=routeCheck(cls,portalId);if(rc.reason)return {ok:false,reason:rc.reason};const route=rc.route;
      if(!o.initial&&W.hints.visibleEntries.includes(portalId))return {ok:false,reason:'entry_in_view'};
      if(W.vehicles.filter(moving).length>=wc.maxTracked)return {ok:false,reason:'max_active'};
      const rs=Number.isFinite(o.rs)?o.rs:0,u=Number.isFinite(o.u)?o.u:mulberry((seed^hash32(`${W.tick}:${W.serial}:${portalId}`))>>>0)();
      const speed=Number.isFinite(o.speed)?o.speed:cruiseFor(route,u);
      if(gapBlocked(route,rs,cls,speed,!!o.initial))return {ok:false,reason:'spawn_gap_blocked'};
      const v=makeVehicle({classId,route,rs,speed,origin:o.origin||'spawned',traffic:o.traffic,persistent:o.persistent,promoted:o.promoted});
      if(o.seeded){v.lifecycle.origin='seeded';}
      return {ok:true,vehicleId:v.id,vehicle:v};
    }

    /* ---------------- initial population */
    let traffic=null;
    if(trafficOn){
      traffic=trafficApi.createController(vt,{graph,classes,seed,fixedStep:h,time,emit,
        tryPlace:(unitId,classId,portalId,prov,o)=>{const r=tryPlace(classId,portalId,{...o,origin:o.initial?'flow_initial':'flow',traffic:prov});return r.ok?{ok:true,vehicleId:r.vehicleId}:r;},
        flowActive:flowId=>W.vehicles.filter(v=>moving(v)&&v.traffic.flowId===flowId).length});
      traffic.init(wc.autoPopulate);
    }else if(wc.autoPopulate){
      /* generic seeding, as the legacy runtime: per lane family in traffic[] order, a closing pair on long routes, else evenly spread */
      const famOrder=(routeNet.traffic||[]).map(t=>t.id),rank=p=>{const i=famOrder.indexOf(graph.portals.get(p)?.laneFamily);return i<0?1e9:i;};
      [...graph.entryPortals].sort((a,b)=>rank(a)-rank(b)||(a<b?-1:a>b?1:0)).forEach((pid,li)=>{
        const route=graph.routeFrom(pid);if(!route||!route.parts.length)return;
        const fit=Math.max(1,Math.floor(route.total/Math.max(8,cfg.minSpawnGap))),count=Math.min(cfg.seedPerLane,fit),el=graph.elements.get(route.elements[0]),sp=el.speedPolicy||{},base=Number.isFinite(sp.cruise)?sp.cruise:8.5;
        if(count>=2&&route.total>60){const leadS=route.total*(.42+li*.08),spacing=Math.max(13.5,cfg.vehicleHalfLength*2+7.5),rearS=Math.max(1,leadS-spacing);
          for(const [rs,speed] of [[leadS,Math.max(sp.min||0,base*.82)],[rearS,Math.min(Number.isFinite(sp.max)?sp.max:Infinity,base*1.14)]]){const r=tryPlace('sedan',pid,{rs,speed,initial:true,origin:'seeded'});if(r.ok)emit('vehicle_seeded',{vehicleId:r.vehicleId,portalId:pid});}
          return;}
        for(let i=0;i<count;i++){const b=(i+1)/(count+1),jitter=(W.rng()-.5)*Math.min(.08,1/(count+2)),rs=clamp((b+jitter)*route.total,1,route.total-1);
          const r=tryPlace('sedan',pid,{rs,u:W.rng(),initial:true,origin:'seeded'});if(r.ok)emit('vehicle_seeded',{vehicleId:r.vehicleId,portalId:pid});}
      });
    }
    if(signals)for(const c of signals.controllers){const s=signals.stateAt(c.id,0);W.signalPhase.set(c.id,s.phaseIndex);}
    /* vehicles present at scene start have been driving: they already know what is around them (no reaction delay
       for the very first picture). Later perception is delayed as normal. */
    for(const v of W.vehicles)if(aiDriven(v)){v.perception=perceive(v);v.nextSenseAt=v.driver.phase;}

    /* ---------------- perception (never reads presentation hints) */
    function perceive(v){
      const route=v.route,front=v.rs+v.halfLength;let ahead=null,behind=null;
      const consider=(sight,ds)=>{if(ds>=0){if(sight.gap<cfg.forwardRange&&(!ahead||sight.gap<ahead.gap))ahead=sight;}else if(sight.gap<cfg.rearRange&&(!behind||sight.gap<behind.gap))behind=sight;};
      const lo=v.rs-cfg.rearRange-12,hi=v.rs+cfg.forwardRange+12;
      for(const o of W.vehicles){if(o===v||o.story!==v.story)continue;
        if(o.route===route&&moving(o)){if(Math.abs(o.lateral-v.lateral)>v.halfWidth+o.halfWidth+.22)continue;const ds=o.rs-v.rs;consider({id:o.id,kind:'vehicle',speed:Math.max(0,o.speed*(o.driveDirection||1)),gap:Math.abs(ds)-v.halfLength-o.halfLength},ds);continue;}
        if(Math.hypot(o.x-v.x,o.y-v.y)>cfg.forwardRange+o.halfLength+v.halfLength+4)continue;
        /* other route or parked: does any part of its actual footprint enter my corridor ahead? */
        const r=rect(o),pts=[];for(const a of [-1,0,1])for(const b of [-1,0,1])pts.push({x:r.x+r.fx*r.hl*a+r.rx*r.hw*b,y:r.y+r.fy*r.hl*a+r.ry*r.hw*b});
        let minS=Infinity;for(const p of pts){const q=GV.projectOnRoute(graph,route,p,Math.max(0,lo),hi);if(q&&Math.abs(q.lateral)<q.halfWidth&&q.rs>v.rs-v.halfLength)minS=Math.min(minS,q.rs);}
        if(minS<Infinity){const pose=GV.poseOnRoute(graph,route,Math.min(route.total,minS),0),of=basis(o.heading);
          consider({id:o.id,kind:'vehicle',speed:Math.max(0,(moving(o)?o.speed:0)*(of.fx*pose.fx+of.fy*pose.fy)),gap:minS-front},0);}
      }
      for(const b of W.bodies){if(b.story!==v.story||Math.hypot(b.x-v.x,b.y-v.y)>cfg.forwardRange+v.halfLength+4)continue;
        const q=GV.projectOnRoute(graph,route,b,Math.max(0,lo),hi);if(!q||Math.abs(q.lateral)>cfg.pedestrianSenseLateral)continue;
        const pose=GV.poseOnRoute(graph,route,q.rs,0),ds=q.rs-v.rs;
        consider({id:b.id,kind:'pedestrian',speed:Math.max(0,(b.vx||0)*pose.fx+(b.vy||0)*pose.fy),gap:Math.abs(ds)-v.halfLength-cfg.pedestrianHalfLength},ds);}
      let signal=null;
      if(signals)for(const st of stopsFor(route)){if(st.stopRs<front-1e-6)continue;if(st.stopRs-front>cfg.forwardRange)break;
        const cs=signals.connectorState(st.connectorId,W.tick);signal={...st,state:cs?cs.state:'OFF'};break;}
      /* "don't block the box": is there room beyond the next intersection connector? (seen like everything else, late) */
      let box=null;
      for(const part of route.parts){const el=graph.elements.get(part.elementId);if(el.type!=='connector'||!/^intersection/.test(el.kind))continue;
        const stopRs=part.start-wc.stopLineBuffer;if(stopRs<front-1e-6)continue;if(stopRs-front>cfg.forwardRange)break;
        const exitRs=part.start+(part.exitS-part.enterS),need=2*v.halfLength+v.driver.standstillGap+1;
        for(const o of W.vehicles)if(o!==v&&o.route===route&&moving(o)&&o.speed<wc.boxClearSpeed){const rear=o.rs-o.halfLength;if(rear>=part.start-1e-6&&rear<exitRs+need){box={connectorId:el.id,stopRs,by:o.id};break;}}
        break;}
      return {ahead,behind,signal,box};
    }

    /* ---------------- decide + integrate */
    function signalHazard(v){
      const sig=v.perception?.signal;v.signalNote=null;if(!sig)return null;
      const dFront=sig.stopRs-(v.rs+v.halfLength);
      if(v.signalLatch&&v.signalLatch.connectorId!==sig.connectorId)v.signalLatch=null;
      if(sig.state==='GREEN'||sig.state==='OFF'){v.signalLatch=null;v.signalNote={...sig,decision:'go',dFront};return null;}
      if(dFront<-.05){v.signalNote={...sig,decision:'committed',dFront};return null;}
      if(sig.state==='YELLOW'&&!v.signalLatch){const need=v.speed*v.speed/(2*Math.max(.1,v.driver.braking)),decision=dFront>=need?'stop':'go';
        v.signalLatch={connectorId:sig.connectorId,decision};emit('vehicle_signal_decision',{vehicleId:v.id,signalId:sig.signalId,groupId:sig.groupId,connectorId:sig.connectorId,decision,distance:+dFront.toFixed(3),speed:+v.speed.toFixed(3),stoppingDistance:+need.toFixed(3)});}
      if(v.signalLatch&&v.signalLatch.decision==='go'){v.signalNote={...sig,decision:'go',dFront};return null;}
      v.signalNote={...sig,decision:'stop',dFront};
      return {id:`signal:${sig.signalId}`,kind:'signal',speed:0,gap:dFront+v.driver.standstillGap};
    }
    function boxHazard(v){
      const bx=v.perception?.box;if(!bx)return null;const dFront=bx.stopRs-(v.rs+v.halfLength);if(dFront<-.05)return null;
      return {id:`box:${bx.connectorId}`,kind:'box',speed:0,gap:dFront+v.driver.standstillGap};
    }
    function exitHazard(v){
      const ex=v.route?.exitPortal;if(!ex||!W.hints.watchedExits.includes(ex))return null;
      return {id:'exit_hold',kind:'hold',speed:0,gap:v.route.total-(v.rs+v.halfLength)+v.driver.standstillGap};
    }
    function roadLimit(v){
      const L=GV.locate(graph,v.route,v.rs),el=graph.elements.get(L.elementId),p0=GV.poseOnRoute(graph,v.route,v.rs,0),p1=GV.poseOnRoute(graph,v.route,Math.min(v.route.total,v.rs+6),0),turn=Math.abs(wrap(p1.heading-p0.heading));
      let limit=turn>55?2.6:turn>25?4:Infinity;if(el?.speedPolicy&&Number.isFinite(el.speedPolicy.limit))limit=Math.min(limit,el.speedPolicy.limit);return limit;
    }
    function currentElement(v){if(!v.route)return null;const L=GV.locate(graph,v.route,v.rs);return {loc:L,el:graph.elements.get(L.elementId)};}
    function ensureLaneState(v,el=null){el=el||currentElement(v)?.el;const lm=el?.lanes;if(!lm){v.laneIndex=null;v.laneTarget=null;v.laneChanging=false;return null;}if(!Number.isInteger(v.laneIndex)||v.laneIndex<0||v.laneIndex>=lm.count)v.laneIndex=GV.laneIndexFor?.(el,v.lateral)??lm.defaultLane;if(!Number.isInteger(v.laneTarget)||v.laneTarget<0||v.laneTarget>=lm.count)v.laneTarget=v.laneIndex;return lm;}
    function targetLaneSafe(v,index,el=null){el=el||currentElement(v)?.el;const lm=el?.lanes;if(!lm||!Number.isInteger(index)||index<0||index>=lm.count)return false;const center=lm.centers[index],gap=wc.laneChangeSafetyGap;
      for(const o of W.vehicles){if(o===v||!roadMoving(o)||o.story!==v.story||o.elementId!==v.elementId)continue;const side=Math.abs(o.lateral-center),need=v.halfWidth+o.halfWidth+.18;if(side>need)continue;const along=Math.abs((o.elementS??o.rs)-(v.elementS??v.rs));if(along<v.halfLength+o.halfLength+gap)return false;}return true;}
    function requestLane(v,index,reason='driver'){const ce=currentElement(v),lm=ensureLaneState(v,ce?.el);if(!lm)return {ok:false,reason:'not_multi_lane'};index=clamp(Math.trunc(index),0,lm.count-1);if(index===v.laneTarget)return {ok:true,unchanged:true,laneIndex:index};if(lm.changeAllowed===false)return {ok:false,reason:'lane_change_not_allowed'};if(!targetLaneSafe(v,index,ce.el)){const key=`${v.elementId}:${index}`;if(v.laneRefusal!==key){v.laneRefusal=key;emit('vehicle_lane_change_refused',{vehicleId:v.id,elementId:v.elementId,fromLane:v.laneIndex,toLane:index,reason:'lane_occupied'});}return {ok:false,reason:'lane_occupied'};}v.laneRefusal=null;const from=v.laneIndex;v.laneTarget=index;v.laneChanging=index!==v.laneIndex;emit('vehicle_lane_change_started',{vehicleId:v.id,elementId:v.elementId,fromLane:from,toLane:index,reason});return {ok:true,laneIndex:index};}
    function advanceLaneChange(v,el=null){el=el||currentElement(v)?.el;const lm=ensureLaneState(v,el);if(!lm)return false;const target=lm.centers[v.laneTarget],desired=clamp((target-v.lateral)*2,-wc.laneChangeSpeed,wc.laneChangeSpeed);v.lateralVelocity+=clamp(desired-v.lateralVelocity,-wc.laneChangeAccel*h,wc.laneChangeAccel*h);const prev=v.lateral;v.lateral+=v.lateralVelocity*h;if((target-prev)*(target-v.lateral)<=0||Math.abs(target-v.lateral)<.015){v.lateral=target;v.lateralVelocity=0;const before=v.laneIndex;v.laneIndex=v.laneTarget;v.laneChanging=false;if(before!==v.laneIndex)emit('vehicle_lane_change_completed',{vehicleId:v.id,elementId:v.elementId,fromLane:before,toLane:v.laneIndex});}else v.laneChanging=true;return true;}
    function laneStatus(v){if(!v)return null;const ce=currentElement(v),lm=ensureLaneState(v,ce?.el);return {vehicleId:v.id,elementId:ce?.el?.id||null,multiLane:!!lm,laneIndex:lm?v.laneIndex:null,laneTarget:lm?v.laneTarget:null,laneLabel:lm?lm.labels[v.laneIndex]:null,targetLabel:lm?lm.labels[v.laneTarget]:null,lateral:r3(v.lateral),changing:!!v.laneChanging,centers:lm?[...lm.centers]:[],labels:lm?[...lm.labels]:[],parkingLane:lm?lm.parkingLane:null,branchLanes:lm?{...lm.branchLanes}:{}};}
    function branchPreferenceForLane(el,lateral,laneIndex=null,fallback='straight'){const lm=el?.lanes;if(!lm)return fallback;const lane=Number.isInteger(laneIndex)?laneIndex:(GV.laneIndexFor?.(el,lateral)??lm.defaultLane);for(const kind of ['left','straight','right'])if(lm.branchLanes?.[kind]===lane)return kind;return fallback;}
    function parkingDef(spaceId){return (routeNet.parking?.spaces||[]).find(x=>x?.id===spaceId)||null;}
    function parkingCenter(sp){const b=sp?.vehicleBox||{};return {x:((b.x0??0)+(b.x1??0))/2,y:((b.y0??0)+(b.y1??0))/2,story:sp?.story??0};}
    function parkingCaptureCandidates(v){if(!v?.route||!v.elementId||v.state!=='DRIVING')return [];const el=graph.elements.get(v.elementId);if(!el)return [];const out=[];
      for(const sp of routeNet.parking?.spaces||[]){const live=W.spaces.get(sp.id),access=graph.spaceAccess.get(sp.id),pin=sp.maneuver?.pullInPath||[];if(!live||live.state!=='OPEN'||pin.length<2||access?.accessEdge!==el.id||sp.access?.capture===false)continue;
        if(Array.isArray(sp.access?.allowedClasses)&&!sp.access.allowedClasses.includes(v.classId))continue;const lm=ensureLaneState(v,el),required=Number.isInteger(sp.access?.requiredLane)?sp.access.requiredLane:(lm?lm.parkingLane:null);if(lm&&Number.isInteger(required)&&(v.laneIndex!==required||v.laneChanging))continue;const approach=Number.isFinite(access?.approachS)?access.approachS:graph.project(el.id,pin[0])?.clampedS,current=Number.isFinite(v.elementS)?v.elementS:graph.project(el.id,{x:v.x,y:v.y})?.clampedS;if(!Number.isFinite(approach)||!Number.isFinite(current)||Math.abs(current-approach)>wc.parkingCaptureWindow)continue;
        const c=parkingCenter(sp),proj=graph.project(el.id,c),side=proj?.lateral>0?1:proj?.lateral<0?-1:0;if(!side)continue;out.push({spaceId:sp.id,side,distance:r3(Math.abs(current-approach)),accessEdge:el.id,open:true});}
      return out.sort((a,b)=>a.distance-b.distance||a.spaceId.localeCompare(b.spaceId));}
    function maneuverPath(v,points,spaceId,task){let pts=(points||[]).filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)).map(q=>({x:+q.x,y:+q.y,story:Number.isInteger(q.story)?q.story:v.story}));
      if(!pts.length)return null;if(Math.hypot(pts[0].x-v.x,pts[0].y-v.y)>.05)pts=[{x:v.x,y:v.y,story:v.story},...pts];const path=pathInfo(pts);if(!(path.total>.1))return null;return {spaceId,task,path,pathS:0};}
    function beginParkingCapture(v,sp){if(!v||!sp||v.state!=='DRIVING'||v.speed>wc.parkingCaptureMaxSpeed)return {ok:false,reason:'capture_unavailable'};const live=W.spaces.get(sp.id);if(!live||live.state!=='OPEN')return {ok:false,reason:'space_not_open'};const m=maneuverPath(v,sp.maneuver?.pullInPath,sp.id,'MANEUVER_IN');if(!m)return {ok:false,reason:'pull_in_path_missing'};
      live.state='ENTRY_IN_PROGRESS';live.reservedByVehicleId=v.id;v.parking={...v.parking,...m};v.route=null;v.laneId=null;v.state='PARKING_APPROACH';v.lateralVelocity=0;v.driveDirection=1;v.aiState='parking-capture';emit('vehicle_parking_capture_started',{vehicleId:v.id,spaceId:sp.id});return {ok:true,spaceId:sp.id};}
    function maybeBeginParkingCapture(v){if(v.controller.mode!=='guided'||v.intent?.motion!=='go'||Math.abs(v.intent?.steer||0)<wc.parkingCaptureSteerThreshold)return false;for(const c of parkingCaptureCandidates(v)){if(Math.sign(v.intent.steer)!==c.side)continue;const sp=parkingDef(c.spaceId);if(beginParkingCapture(v,sp).ok)return true;}return false;}
    function beginParkingExit(v){if(!v||v.state!=='PARKED')return {ok:false,reason:'vehicle_not_parked'};const sp=parkingDef(v.parking.spaceId),live=sp&&W.spaces.get(sp.id),access=sp&&graph.spaceAccess.get(sp.id),pout=sp?.maneuver?.pullOutPath||[];if(!sp)return {ok:false,reason:'parking_space_missing'};if(!access?.accessEdge||!graph.elements.get(access.accessEdge))return {ok:false,reason:'road_access_unavailable'};const m=maneuverPath(v,pout,sp.id,'MANEUVER_OUT');if(!m)return {ok:false,reason:'pull_out_path_missing'};
      if(live){live.state='EXIT_IN_PROGRESS';live.occupantVehicleId=v.id;live.reservedByVehicleId=v.id;}v.parking={...v.parking,...m,accessEdge:access.accessEdge};v.route=null;v.laneId=null;v.state='MANEUVER_OUT';v.speed=0;v.acceleration=0;v.lateralVelocity=0;v.driveDirection=1;v.aiState='guided-pullout';emit('vehicle_parking_exit_started',{vehicleId:v.id,spaceId:sp.id,accessEdge:access.accessEdge});return {ok:true,vehicleId:v.id,state:v.state,accessEdge:access.accessEdge};}
    function advanceParkingManeuver(v){const P=v.parking?.path;if(!P?.pts?.length)return 0;const remaining=Math.max(0,P.total-v.parking.pathS),cap=Math.min(wc.parkingManeuverSpeed,Math.sqrt(Math.max(0,2*v.driver.braking*Math.max(0,remaining-wc.parkingPathStopBuffer)))),target=remaining<=wc.parkingPathStopBuffer?0:Math.max(.25,cap),old=v.speed,requested=clamp((target-v.speed)*2,-v.driver.braking,v.driver.acceleration);v.acceleration+=clamp(requested-v.acceleration,-v.driver.jerk*h,v.driver.jerk*h);v.acceleration=clamp(v.acceleration,-v.driver.emergencyBraking,v.driver.acceleration);v.speed=Math.max(0,v.speed+v.acceleration*h);const travel=Math.min(remaining,(old+v.speed)*.5*h);v.parking.pathS=Math.min(P.total,v.parking.pathS+travel);const q=pathPose(P,v.parking.pathS);if(q){v.x=q.x;v.y=q.y;v.story=q.story;const turn=90*h;v.heading=norm(v.heading+clamp(wrap(q.heading-v.heading),-turn,turn));}v.aiState=v.parking.task==='MANEUVER_IN'?'auto-parking':'auto-pullout';v.targetSpeed=target;v.braking=v.acceleration<-.36;
      if(v.state==='PARKING_APPROACH'&&v.parking.pathS>.25)v.state='MANEUVER_IN';if(P.total-v.parking.pathS<=1e-6&&v.speed<=.08)finishParkingManeuver(v);return travel;}
    function finishParkingManeuver(v){const sp=parkingDef(v.parking.spaceId),live=sp&&W.spaces.get(sp.id),task=v.parking.task;v.speed=0;v.acceleration=0;v.braking=false;
      if(task==='MANEUVER_IN'){const c=parkingCenter(sp);v.x=c.x;v.y=c.y;v.story=c.story;v.heading=Number.isFinite(sp.heading)?norm(sp.heading):v.heading;v.route=null;v.laneId=null;v.state='PARKED';v.intent={...v.intent,motion:'hold',steer:0,branch:null};v.parking={spaceId:sp.id,task:'NONE',path:null,pathS:0};if(live){live.state='OCCUPIED';live.occupantVehicleId=v.id;live.reservedByVehicleId=null;}emit('vehicle_parking_completed',{vehicleId:v.id,spaceId:sp.id});onTransitParked(v,sp.id);return;}
      if(task==='MANEUVER_OUT'){const edgeId=v.parking.accessEdge||graph.spaceAccess.get(sp.id)?.accessEdge,el=edgeId&&graph.elements.get(edgeId),q=el&&graph.project(edgeId,{x:v.x,y:v.y}),s0=q?clamp(Number.isFinite(q.clampedS)?q.clampedS:q.s,0,el.len):null,route=s0!=null?GV.routeFromElement?.(graph,edgeId,s0,v.intent?.branch||branchPreferenceForLane(el,q?.lateral,null,'straight')):null;if(!route||!route.parts.length){v.state='PARKED';v.parking={spaceId:sp.id,task:'NONE',path:null,pathS:0};if(live){live.state='OCCUPIED';live.occupantVehicleId=v.id;live.reservedByVehicleId=null;}emit('vehicle_parking_exit_failed',{vehicleId:v.id,spaceId:sp.id,reason:'road_route_unavailable'});return;}
        v.route=route;v.rs=0;v.laneId=route.id;v.lateral=q?.lateral||0;v.driftTarget=0;v.lateralVelocity=0;v.laneIndex=null;v.laneTarget=null;if(!(v.cruiseSpeed>1))v.cruiseSpeed=cruiseFor(route,.5);v.targetSpeed=v.cruiseSpeed;v.state='DRIVING';v.parking={spaceId:sp.id,task:'NONE',path:null,pathS:0};syncPose(v,true);ensureLaneState(v);v.perception=perceive(v);v.nextSenseAt=time()+v.driver.phase;if(live){live.state='OPEN';live.occupantVehicleId=null;live.reservedByVehicleId=null;}emit('vehicle_parking_exit_completed',{vehicleId:v.id,spaceId:sp.id});onTransitExitCompleted(v,sp.id);}
    }
    function externalRoadCap(v){const ce=currentElement(v),sp=ce?.el?.speedPolicy||{};let cap=wc.externalMaxSpeed;
      if(Number.isFinite(sp.cruise))cap=Math.min(cap,Math.max(sp.cruise*1.35,sp.cruise+1));if(Number.isFinite(sp.max))cap=Math.min(cap,sp.max);if(Number.isFinite(sp.limit))cap=Math.min(cap,sp.limit);
      const curve=roadLimit(v);if(Number.isFinite(curve))cap=Math.min(cap,curve);return Math.max(.1,cap);}
    function replanExternalBranch(v){
      if(!['external','guided','service'].includes(v.controller.mode)||!v.route)return;const probe=GV.nextBranch?.(graph,v.route,v.rs,null),probeEl=probe&&graph.elements.get(probe.elementId),preference=v.intent.branch||branchPreferenceForLane(probeEl,v.lateral,v.laneTarget??v.laneIndex,'straight'),b=GV.nextBranch?.(graph,v.route,v.rs,preference);if(!b||!b.desired||b.desired===b.selected)return;
      const branchEl=graph.elements.get(b.elementId),desiredKind=GV.branchLabel?.(graph,branchEl,b.desired),lm=branchEl?.lanes,required=lm&&Number.isInteger(lm.branchLanes?.[desiredKind])?lm.branchLanes[desiredKind]:null;
      if(lm&&Number.isInteger(required)&&(v.laneIndex!==required||v.laneChanging)){const key=`${b.elementId}:${b.desired}:${required}`;if(v.branchLaneRefusal!==key){v.branchLaneRefusal=key;emit('vehicle_branch_lane_refused',{vehicleId:v.id,fromElement:b.elementId,toNext:b.desired,branch:desiredKind,requiredLane:required,currentLane:v.laneIndex});}return;}v.branchLaneRefusal=null;
      const L=GV.locate(graph,v.route,v.rs),r=GV.routeFromElement?.(graph,L.elementId,L.s,preference);if(!r||!r.parts.length)return;
      const from=b.selected;v.route=r;v.rs=0;v.laneId=r.id;v.observations=[];v.perception=null;v.signalLatch=null;syncPose(v,true);ensureLaneState(v);
      emit('vehicle_branch_selected',{vehicleId:v.id,preference,branch:desiredKind,requiredLane:required,fromElement:b.elementId,fromNext:from,toNext:b.desired});
    }
    function advanceExternal(v){
      const i=v.intent||NEUTRAL_INTENT;replanExternalBranch(v);
      let wantedDir=v.driveDirection||1,throttle=i.throttle,brake=i.brake;
      if(throttle>.001){const requested=i.reverse?-1:1;if(requested!==wantedDir){if(v.speed>.05){brake=1;throttle=0;}else{wantedDir=requested;v.driveDirection=requested;v.acceleration=0;v.speed=0;}}}
      if(v.state==='MANEUVER_OUT'&&wantedDir<0){brake=1;throttle=0;wantedDir=1;v.driveDirection=1;}
      const cap=wantedDir<0?wc.reverseMaxSpeed:externalRoadCap(v),oldSpeed=v.speed,d=v.driver;
      let requested=throttle*d.acceleration-brake*d.braking;if(throttle<=.001&&brake<=.001)requested=-wc.externalCoastDecel;
      if(v.speed>=cap-1e-6&&requested>0)requested=0;if(v.speed>cap+.02)requested=-Math.min(d.braking,Math.max(wc.externalCoastDecel,(v.speed-cap)*2));
      requested=clamp(requested,-d.emergencyBraking,d.acceleration);v.acceleration+=clamp(requested-v.acceleration,-d.jerk*h,d.jerk*h);v.acceleration=clamp(v.acceleration,-d.emergencyBraking,d.acceleration);
      v.speed=Math.max(0,v.speed+v.acceleration*h);if(v.speed===0&&v.acceleration<0)v.acceleration=0;v.targetSpeed=cap;v.aiState=v.state==='MANEUVER_OUT'?'external-pullout':'external';v.responseTo=null;v.emergency=false;v.braking=v.acceleration<-.36;
      return (oldSpeed+v.speed)*.5*h*(v.driveDirection||1);
    }
    function applyExternalSteer(v){
      if(!['external','guided','service'].includes(v.controller.mode)||!v.route||v.state==='MANEUVER_OUT')return;const ce=currentElement(v),lm=ensureLaneState(v,ce?.el);
      if(lm){const sign=v.controller.mode==='service'?0:Math.sign(v.intent?.steer||0);if(!sign)v.steerLatch=0;else if(sign!==v.steerLatch){v.steerLatch=sign;requestLane(v,(v.laneTarget??v.laneIndex)+sign,'driver');}advanceLaneChange(v,ce.el);return;}
      const room=Math.max(0,(ce?.el?.halfWidth||v.halfWidth)-v.halfWidth),speedFactor=clamp(v.speed/2,0,1),desired=(v.intent?.steer||0)*wc.externalSteerSpeed*speedFactor;
      v.lateralVelocity+=clamp(desired-v.lateralVelocity,-wc.externalSteerAccel*h,wc.externalSteerAccel*h);let next=v.lateral+v.lateralVelocity*h;
      if(next>room){next=room;if(v.lateralVelocity>0)v.lateralVelocity=0;}if(next<-room){next=-room;if(v.lateralVelocity<0)v.lateralVelocity=0;}v.lateral=next;
    }
    function continueExternalLoop(v,overflow=0){
      if(!['external','guided','service'].includes(v.controller.mode)||!v.route?.isLoop||!v.route.loopNextElement)return false;
      const old=v.route,nextEl=graph.elements.get(old.loopNextElement),preference=v.intent?.branch||branchPreferenceForLane(nextEl,v.lateral,v.laneTarget??v.laneIndex,'straight'),prevElement=old.parts?.[old.parts.length-1]?.elementId||null,r=GV.routeFromElement?.(graph,old.loopNextElement,0,preference,prevElement);if(!r||!r.parts.length)return false;
      const a=GV.poseOnRoute(graph,old,old.total,v.lateral),b=GV.poseOnRoute(graph,r,0,v.lateral);if(Math.hypot(a.x-b.x,a.y-b.y)>1e-4)return false;
      v.route=r;v.rs=clamp(Number.isFinite(overflow)?overflow:0,0,r.total);v.laneId=r.id;v.observations=[];v.perception=null;v.signalLatch=null;v.loopLaps=(v.loopLaps||0)+1;
      emit('vehicle_loop_lap',{vehicleId:v.id,lap:v.loopLaps,fromRoute:old.id,toRoute:r.id,nextElement:old.loopNextElement});return true;
    }
    function advanceGuided(v){replanExternalBranch(v);if(time()+1e-10>=v.nextSenseAt){const seen=perceive(v);v.observations.push({deliverAt:time()+v.driver.reaction,seen});if(v.observations.length>16)v.observations.splice(0,v.observations.length-16);v.nextSenseAt=time()+cfg.senseInterval;}while(v.observations.length&&v.observations[0].deliverAt<=time()+1e-10)v.perception=v.observations.shift().seen;
      if(v.intent?.motion!=='go'){const d={targetSpeed:0,state:'guided-hold',responseTo:'DRIVER_HOLD',emergency:false},m=RT.advanceDriver(v,d,h,roadLimit(v));return m.travel;}
      const obs={ahead:v.perception?.ahead||null,behind:v.perception?.behind||null};for(const hz of [signalHazard(v),boxHazard(v),exitHazard(v)])if(hz&&(!obs.ahead||hz.gap<obs.ahead.gap))obs.ahead=hz;const oldCruise=v.cruiseSpeed;v.cruiseSpeed=Math.max(.1,oldCruise*wc.guidedCruiseScale);const decision=RT.decideTraffic(v,obs,cfg);v.cruiseSpeed=oldCruise;const m=RT.advanceDriver(v,decision,h,roadLimit(v));v.aiState='guided-'+v.aiState;return m.travel;}
    function decideAndMove(v){
      if(v.contactHold>0){v.contactHold=Math.max(0,v.contactHold-h);v.speed=0;v.acceleration=0;v.targetSpeed=0;v.braking=true;v.aiState='contact';return 0;}
      if(v.controller.mode==='external')return advanceExternal(v);if(v.controller.mode==='guided'||v.controller.mode==='service')return advanceGuided(v);
      if(time()+1e-10>=v.nextSenseAt){const seen=perceive(v);v.observations.push({deliverAt:time()+v.driver.reaction,seen});if(v.observations.length>16)v.observations.splice(0,v.observations.length-16);v.nextSenseAt=time()+cfg.senseInterval;}
      while(v.observations.length&&v.observations[0].deliverAt<=time()+1e-10)v.perception=v.observations.shift().seen;
      const obs={ahead:v.perception?.ahead||null,behind:v.perception?.behind||null};
      for(const hz of [signalHazard(v),boxHazard(v),exitHazard(v)])if(hz&&(!obs.ahead||hz.gap<obs.ahead.gap))obs.ahead=hz;
      const decision=RT.decideTraffic(v,obs,cfg);
      if(wc.disableBraking){decision.targetSpeed=Math.max(decision.targetSpeed,v.cruiseSpeed);decision.emergency=false;}
      const motion=RT.advanceDriver(v,decision,h,roadLimit(v));
      if(v.emergency&&!v.wasEmergency)emit('vehicle_emergency_brake',{vehicleId:v.id,responseTo:v.responseTo,speed:+v.speed.toFixed(3)});v.wasEmergency=v.emergency;
      if(v.speed<.05&&obs.ahead?.kind==='signal')v.aiState='signal-stop';
      else if(v.speed<.05&&obs.ahead?.kind==='box')v.aiState='box-wait';
      return motion.travel;
    }

    /* ---------------- one fixed step */
    function step(){
      const t0=time();transitBeforeStep();
      /* 3–4: decide and integrate (moving vehicles, id order) */
      const crossing=[];
      for(const v of W.vehicles){if(!moving(v))continue;if(maneuvering(v)){advanceParkingManeuver(v);continue;}if(v.controller.mode==='service'&&maybeBeginTransitCapture(v)){advanceParkingManeuver(v);continue;}if(v.controller.mode==='guided'&&maybeBeginParkingCapture(v)){advanceParkingManeuver(v);continue;}if(!v.route)continue;const front0=v.rs+v.halfLength,travel=decideAndMove(v),nextRs=v.rs+travel;
        if(travel<0&&nextRs<=0){v.rs=0;v.speed=0;v.acceleration=0;v.braking=true;v.aiState='reverse-limit';if(!v.reverseLimitLatched){v.reverseLimitLatched=true;emit('vehicle_reverse_limit',{vehicleId:v.id});}}
        else if(travel>=0&&nextRs>=v.route.total-1e-9&&['external','guided','service'].includes(v.controller.mode)&&v.route.isLoop&&continueExternalLoop(v,Math.max(0,nextRs-v.route.total))){v.reverseLimitLatched=false;}
        else{v.rs=Math.min(v.route.total,Math.max(0,nextRs));if(travel>=0)v.reverseLimitLatched=false;}
        if(signals&&travel>0)for(const st of stopsFor(v.route))if(st.stopRs>front0+1e-9&&st.stopRs<=v.rs+v.halfLength+1e-9)crossing.push({v,st});
        if(v.state==='MANEUVER_OUT'){
          if(travel>0){const ce=currentElement(v),lm=ensureLaneState(v,ce?.el),room=Math.max(0,(ce?.el?.halfWidth||v.halfWidth)-v.halfWidth),target=lm?lm.centers[lm.parkingLane]:0,stepLat=Math.abs(travel)*wc.parkingMergeLateralPerMeter;
            v.lateral+=clamp(target-v.lateral,-stepLat,stepLat);if(Math.abs(v.lateral-target)<=Math.max(.02,room+1e-6)){v.lateral=lm?target:clamp(v.lateral,-room,room);if(lm){v.laneIndex=lm.parkingLane;v.laneTarget=lm.parkingLane;v.laneChanging=false;}v.state='DRIVING';v.parking.task='NONE';const sp=W.spaces.get(v.parking.spaceId);if(sp){sp.state='OPEN';sp.occupantVehicleId=null;sp.reservedByVehicleId=null;}emit('vehicle_parking_exit_completed',{vehicleId:v.id,spaceId:v.parking.spaceId});onTransitExitCompleted(v,v.parking.spaceId);}}
        }else if(['external','guided','service'].includes(v.controller.mode))applyExternalSteer(v);
        else{const ce=currentElement(v),lm=ensureLaneState(v,ce?.el);if(lm)advanceLaneChange(v,ce.el);else v.lateral+=(v.driftTarget-v.lateral)*Math.min(1,h/Math.max(.05,wc.laneDriftSeconds));}}
      /* 5: same-route bumper contacts — the unchanged Vehicle Loop maths, on route distance */
      const groups=new Map();for(const v of W.vehicles)if(aiDriven(v)){const ce=currentElement(v),lm=ensureLaneState(v,ce?.el),laneKey=lm?`${v.route.id}:lane:${v.laneIndex}`:v.route.id;if(!groups.has(laneKey))groups.set(laneKey,[]);groups.get(laneKey).push(v);}
      const adapters=[],speedBefore=new Map();for(const [laneKey,list] of groups)for(const v of list){speedBefore.set(v.id,v.speed);adapters.push({id:v.id,state:'drive',laneId:laneKey,s:v.rs,speed:v.speed,acceleration:v.acceleration,halfLength:v.halfLength,ref:v});}
      const rc=RT.resolveContacts(adapters,cfg,W.sameRouteContacts||new Set());W.sameRouteContacts=rc.active;
      for(const a of adapters){a.ref.rs=Math.min(a.ref.route.total,Math.max(0,a.s));a.ref.speed=a.speed;a.ref.acceleration=a.acceleration;}
      for(const ev of rc.events){const lead=W.byId.get(ev.lead),rear=W.byId.get(ev.rear),closing=Math.max(0,(speedBefore.get(ev.rear)||0)-(speedBefore.get(ev.lead)||0)),sev=severityOf(closing,wc);
        for(const x of [lead,rear])if(x){x.contactCount++;x.lastContactAt=t0;x.lastSeverity=sev;}
        emit('vehicle_contact',{a:ev.lead,b:ev.rear,severity:sev,closingSpeed:+closing.toFixed(3),x:+((lead.x+rear.x)/2).toFixed(2),y:+((lead.y+rear.y)/2).toFixed(2),sameLane:true});}
      /* 6: exits */
      for(const v of [...W.vehicles]){if(!roadMoving(v))continue;const watched=v.route.exitPortal&&W.hints.watchedExits.includes(v.route.exitPortal);
        if(v.rs>=v.route.total-1e-9){exitVehicle(v,watched?'exit_overrun':'route_end');continue;}
        if(watched&&v.speed<.05&&v.route.total-(v.rs+v.halfLength)<1.0){if(v.state!=='STOPPED'){v.state='STOPPED';}v.aiState='waiting-exit';}
        else if(v.state==='STOPPED'&&!watched)v.state='DRIVING';}
      /* 7: pose */
      for(const v of W.vehicles)if(roadMoving(v))syncPose(v);
      /* 8a: footprint contacts between vehicles not handled above (other route, parked, …) */
      const next=new Set(),list=W.vehicles;
      for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.story!==b.story)continue;
        if(!moving(a)&&!moving(b))continue;if(aiDriven(a)&&aiDriven(b)&&a.route===b.route){const ae=currentElement(a)?.el,be=currentElement(b)?.el,al=ensureLaneState(a,ae),bl=ensureLaneState(b,be);if((!al&&!bl)||(al&&bl&&a.laneIndex===b.laneIndex&&!a.laneChanging&&!b.laneChanging))continue;}
        const ra=Math.hypot(a.halfLength,a.halfWidth),rb=Math.hypot(b.halfLength,b.halfWidth);if(Math.hypot(a.x-b.x,a.y-b.y)>ra+rb)continue;
        const ov=rectOverlap(rect(a),rect(b));if(!ov)continue;const key=a.id+'|'+b.id;next.add(key);
        if(!W.contacts.has(key)){const fa=basis(a.heading),fb=basis(b.heading),va=moving(a)?a.speed:0,vb=moving(b)?b.speed:0;
          const closing=Math.max(0,(va*fa.fx-vb*fb.fx)*ov.nx+(va*fa.fy-vb*fb.fy)*ov.ny),sev=severityOf(closing,wc);
          for(const x of [a,b]){x.contactCount++;x.lastContactAt=t0;x.lastSeverity=sev;}
          emit('vehicle_contact',{a:a.id,b:b.id,severity:sev,closingSpeed:+closing.toFixed(3),x:+((a.x+b.x)/2).toFixed(2),y:+((a.y+b.y)/2).toFixed(2),sameLane:false});}
        for(const [m,o] of [[a,b],[b,a]])if(moving(m)){m.speed=0;m.acceleration=0;m.targetSpeed=0;m.braking=true;m.aiState='contact';m.contactHold=Math.max(m.contactHold,wc.contactHoldSeconds);
          if(m.route&&!maneuvering(m))for(let k=0;k<120&&rectOverlap(rect(m),rect(o));k++){m.rs=clamp(m.rs-.05*(m.driveDirection||1),0,m.route.total);syncPose(m,true);}}}
      W.contacts=next;
      /* 8b: vehicle–person contacts (same test and response as the legacy runtime, with the class footprint) */
      const imp=new Set(),r=wc.pedestrianRadius;
      for(const v of W.vehicles){if(!moving(v))continue;const f=basis(v.heading);
        for(const b of W.bodies){if(b.story!==v.story)continue;const dx=b.x-v.x,dy=b.y-v.y,along=dx*f.fx+dy*f.fy,lat=Math.abs(dx*f.rx+dy*f.ry);
          if(!(Math.abs(along)<=v.halfLength+r&&lat<=v.halfWidth+r))continue;const key=v.id+'/'+b.id;imp.add(key);
          if(!W.impactKeys.has(key)){v.contactCount++;v.lastContactAt=t0;const rel=Math.max(0,v.speed-((b.vx||0)*f.fx+(b.vy||0)*f.fy)),sev=severityOf(rel,wc);v.lastSeverity=sev;
            emit('vehicle_pedestrian_contact',{vehicleId:v.id,target:b.id,targetKind:b.kind,speed:+v.speed.toFixed(3),relativeSpeed:+rel.toFixed(3),severity:sev,x:+b.x.toFixed(2),y:+b.y.toFixed(2),story:b.story});}
          /* V2.2: a pedestrian may stop a moving vehicle, but may not push a vehicle that is already stationary.
             The legacy overlap recovery rewrites routeS; gating it on the same 0.05 m/s stop threshold prevents a
             newly restored/seated-exit pedestrian from teleporting a stopped car backward while preserving the
             existing moving-impact stop/separation response. */
          if(v.speed>.05){const q=v.route?GV.projectOnRoute(graph,v.route,b,0,v.route.total):null;if(q){if((v.driveDirection||1)>0&&q.rs>=v.rs-v.halfLength)v.rs=Math.min(v.rs,Math.max(0,q.rs-v.halfLength-.36));
              else if((v.driveDirection||1)<0&&q.rs<=v.rs+v.halfLength)v.rs=Math.max(v.rs,Math.min(v.route.total,q.rs+v.halfLength+.36));}
            v.speed=0;v.acceleration=0;v.targetSpeed=0;v.braking=true;v.aiState='contact';v.responseTo=b.id;v.contactHold=Math.max(v.contactHold,wc.contactHoldSeconds);syncPose(v,true);}}}
      W.impactKeys=imp;stepInteriorActors();
      /* 9: signal violations (physical crossing of a stop line on RED) and phase changes */
      for(const {v,st} of crossing){const cs=signals.connectorState(st.connectorId,W.tick);if(!cs||cs.state!=='RED')continue;W.violations++;
        const since=signals.stateSince(st.signalId,st.groupId,W.tick);
        emit('vehicle_signal_violation',{vehicleId:v.id,signalId:st.signalId,groupId:st.groupId,connectorId:st.connectorId,speed:+v.speed.toFixed(3),
          redForSeconds:+((W.tick-since)*h).toFixed(3),perceivedState:v.perception?.signal?.state||null,decision:v.signalLatch?.decision||v.signalNote?.decision||null});}
      W.tick++;
      if(signals)for(const c of signals.controllers){const s=signals.stateAt(c.id,W.tick);if(W.signalPhase.get(c.id)!==s.phaseIndex){W.signalPhase.set(c.id,s.phaseIndex);
        if(s.phaseIndex>=0)emit('signal_phase_changed',{signalId:c.id,phaseId:s.phaseId,phaseIndex:s.phaseIndex,groupStates:{...s.groupStates}});}}
      /* 10: spawning */
      if(wc.autoSpawn){if(traffic)traffic.step();else genericSpawn();}
    }
    function exitVehicle(v,why){
      const idx=W.vehicles.indexOf(v);if(idx>=0)W.vehicles.splice(idx,1);W.byId.delete(v.id);
      if(v.lifecycle.promoted){v.state='OFFSTAGE';v.speed=0;W.offstage.push(v);emit('vehicle_offstage',{vehicleId:v.id,portalId:v.route.exitPortal,why});}
      else{v.state='RETIRED';emit('vehicle_exit',{vehicleId:v.id,portalId:v.route.exitPortal,why,traffic:{...v.traffic}});}
    }
    function genericSpawn(){
      if(time()+1e-9<W.nextSpawnAt)return;let spawned=false;
      if(W.vehicles.filter(moving).length<wc.maxTracked&&graph.entryPortals.length){const n=graph.entryPortals.length,start=Math.floor(W.rng()*n);
        for(let k=0;k<n&&!spawned;k++){const pid=graph.entryPortals[(start+k)%n];if(W.hints.visibleEntries.includes(pid))continue;
          const route=graph.routeFrom(pid);if(!route)continue;const speed=cruiseFor(route,W.rng()),r=tryPlace('sedan',pid,{speed});
          if(r.ok){spawned=true;emit('vehicle_spawned',{vehicleId:r.vehicleId,portalId:pid});}}}
      W.nextSpawnAt=time()+(spawned?cfg.spawnIntervalMin+W.rng()*(cfg.spawnIntervalMax-cfg.spawnIntervalMin):.8);
    }

    function routeRestrictionReason(cls,route){const rr=cls.routeRestrictions||{};if(rr.mainStreetOnly&&!route.allMainStreet)return 'route_restricted';if(rr.turns===false&&route.hasTurn)return 'route_restricted';if(!KC.fitsCorridor(cls,route.minHalfWidth))return 'vehicle_too_wide';return null;}
    function activateVehicle(vehicleId){
      const v=W.byId.get(vehicleId);if(!v)return {ok:false,reason:'unknown_vehicle'};if(v.serviceId)return {ok:false,reason:'transit_service_managed'};if(v.state!=='PARKED')return {ok:false,reason:'vehicle_not_parked'};if(v.controller.mode==='guided')return beginParkingExit(v);
      const sp=(routeNet.parking?.spaces||[]).find(x=>x.id===v.parking.spaceId);if(!sp)return {ok:false,reason:'parking_space_missing'};const access=graph.spaceAccess.get(sp.id),edgeId=access?.accessEdge||sp.adjacentTrafficLane,el=edgeId&&graph.elements.get(edgeId);
      if(!el)return {ok:false,reason:'road_access_unavailable'};const q=graph.project(edgeId,{x:v.x,y:v.y}),s0=Number.isFinite(q?.clampedS)?q.clampedS:Number.isFinite(q?.s)?clamp(q.s,0,el.len):null;
      if(!q||s0===null||q.dist>wc.activationMaxLateral)return {ok:false,reason:'road_access_too_far'};const ph=graph.poseAt(edgeId,s0),angle=Math.abs(wrap(ph.heading-v.heading));if(angle>100)return {ok:false,reason:'road_heading_mismatch'};
      const route=GV.routeFromElement?.(graph,edgeId,s0,branchPreferenceForLane(el,q.lateral,null,'straight'));if(!route||!route.parts.length||(!route.exitPortal&&!route.isLoop))return {ok:false,reason:'road_route_unavailable'};const rr=routeRestrictionReason(v.cls,route);if(rr)return {ok:false,reason:rr};
      v.route=route;v.rs=0;v.laneId=route.id;v.lateral=q.lateral;v.driftTarget=0;v.lateralVelocity=0;v.driveDirection=1;v.speed=0;v.acceleration=0;if(!(v.cruiseSpeed>0))v.cruiseSpeed=cruiseFor(route,.5);v.targetSpeed=v.cruiseSpeed;v.observations=[];v.perception=v.controller.mode==='ai'?perceive(v):null;v.nextSenseAt=time()+v.driver.phase;v.state='MANEUVER_OUT';v.parking.task='MANEUVER_OUT';
      const live=W.spaces.get(sp.id);if(live){live.state='EXIT_IN_PROGRESS';live.occupantVehicleId=v.id;}syncPose(v,true);emit('vehicle_activated',{vehicleId:v.id,spaceId:sp.id,accessEdge:edgeId,lateral:+v.lateral.toFixed(3)});return {ok:true,vehicleId:v.id,state:v.state,accessEdge:edgeId};
    }
    function setControllerNow(vehicleId,mode){const v=W.byId.get(vehicleId);if(!v)return {ok:false,reason:'unknown_vehicle'};if(!['ai','external','guided','service'].includes(mode)||mode==='service'&&!v.serviceId)return {ok:false,reason:'bad_controller'};
      if(mode==='ai'&&v.driveDirection<0&&v.speed>.05)return {ok:false,reason:'vehicle_must_stop'};if(v.controller.mode===mode)return {ok:true,unchanged:true};v.controller.mode=mode;v.intent={...NEUTRAL_INTENT,...(['guided','service'].includes(mode)?{motion:'hold'}:{})};v.lateralVelocity=0;
      if(mode==='ai'||mode==='guided'||mode==='service'){v.driveDirection=1;if((mode==='guided'||mode==='service')&&v.route&&!(v.cruiseSpeed>1))v.cruiseSpeed=cruiseFor(v.route,.5);v.observations=[];v.perception=v.route?perceive(v):null;v.nextSenseAt=time()+v.driver.phase;}emit('vehicle_controller_changed',{vehicleId:v.id,mode});return {ok:true,mode};}
    function setDriverIntentNow(vehicleId,intent){const v=W.byId.get(vehicleId);if(!v)return {ok:false,reason:'unknown_vehicle'};if(!['external','guided'].includes(v.controller.mode))return {ok:false,reason:'controller_not_external'};const n=normalizeIntent(intent);if(v.controller.mode==='guided'){n.motion=n.motion||(v.intent?.motion||'hold');n.throttle=0;n.brake=0;n.reverse=false;}v.intent=n;
      if(v.controller.mode==='guided'&&v.state==='PARKED'&&n.motion==='go')beginParkingExit(v);return {ok:true,intent:{...n}};}

    /* ---------------- inputs (applied immediately between steps, logged with the tick they apply from) */
    function setBodies(list){
      const norm_=(list||[]).map(b=>({id:String(b.id),kind:b.kind||'npc',x:+b.x,y:+b.y,story:Number.isInteger(b.story)?b.story:0,vx:+b.vx||0,vy:+b.vy||0,radius:Number.isFinite(b.radius)?b.radius:wc.pedestrianRadius}))
        .filter(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&!W.suppressedBodies.has(b.id)).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
      const key=JSON.stringify(norm_);if(key===W.bodiesKey)return;W.bodiesKey=key;W.bodies=norm_;logInput('bodies',norm_);
    }
    function setBodySuppressedNow(bodyId,suppressed=true){
      const id=bodyId==null?'':String(bodyId);if(!id)return {ok:false,reason:'bad_body_id'};const yes=suppressed!==false,had=W.suppressedBodies.has(id);if(had===yes)return {ok:true,unchanged:true,bodyId:id,suppressed:yes};
      if(yes){W.suppressedBodies.add(id);W.bodies=W.bodies.filter(b=>b.id!==id);W.bodiesKey=JSON.stringify(W.bodies);}else W.suppressedBodies.delete(id);
      emit('body_suppression_changed',{bodyId:id,suppressed:yes});return {ok:true,bodyId:id,suppressed:yes};
    }
    function setHints(hints){
      const hn={watchedExits:[...new Set(hints?.watchedExits||[])].sort(),visibleEntries:[...new Set(hints?.visibleEntries||[])].sort()},key=JSON.stringify(hn);
      if(key===W.hintsKey)return;W.hintsKey=key;W.hints=hn;logInput('hints',hn);
    }
    function command(cmd){
      logInput('command',cmd);const c=cmd||{},r=applyCommand(c);
      if(!r.ok)emit('command_rejected',{command:c.type??null,reason:r.reason});return r;
    }
    function applyCommand(c){
      switch(c.type){
        case 'spawn':{const r=tryPlace(c.classId||'sedan',c.portalId,{speed:c.speed,origin:'command'});if(r.ok)emit('vehicle_spawned',{vehicleId:r.vehicleId,portalId:c.portalId,command:true});return r.ok?{ok:true,vehicleId:r.vehicleId}:r;}
        case 'promote':{const v=W.byId.get(c.vehicleId);if(!v)return {ok:false,reason:'unknown_vehicle'};v.lifecycle.promoted=true;v.lifecycle.persistent=true;emit('vehicle_promoted',{vehicleId:v.id});return {ok:true};}
        case 'setCruise':{const v=W.byId.get(c.vehicleId);if(!v||!moving(v))return {ok:false,reason:'unknown_vehicle'};if(!(Number.isFinite(c.speed)&&c.speed>=0))return {ok:false,reason:'bad_speed'};v.cruiseSpeed=c.speed;return {ok:true};}
        case 'setController':return setControllerNow(c.vehicleId,c.mode);
        case 'driverIntent':return setDriverIntentNow(c.vehicleId,c.intent);
        case 'activateVehicle':return activateVehicle(c.vehicleId);
        case 'setBodySuppressed':return setBodySuppressedNow(c.bodyId,c.suppressed);
        case 'setTransitDriver':return setTransitDriverNow(c.serviceId,c.actorId);
        case 'setTransitServiceActive':return setTransitActiveNow(c.serviceId,c.active);
        case 'setTransitDwellSeconds':return setTransitDwellNow(c.serviceId,c.seconds);
        case 'boardTransitActor':return boardTransitActorNow(c.actorId,c.vehicleId);
        case 'setInteriorActorInput':return setInteriorInputNow(c.actorId,c.input);
        case 'alightTransitActor':return alightTransitActorNow(c.actorId);
        case 'spawnTrafficUnit':return spawnUnit(c);
        case 'setTrafficMeter':{if(!traffic)return {ok:false,reason:'traffic_not_enabled'};const v=c.preset&&trafficApi.METER_PRESETS[c.preset]!==undefined?trafficApi.METER_PRESETS[c.preset]:c.value;
          if(!Number.isFinite(v))return {ok:false,reason:'bad_value'};const r=traffic.setMeter(clamp(v,0,1));emit('traffic_meter_changed',{before:r.before,after:r.after,preset:trafficApi.meterFor(r.after).preset});return {ok:true,value:r.after};}
        case 'setFlowEnabled':{if(!traffic)return {ok:false,reason:'traffic_not_enabled'};if(!traffic.hasFlow(c.flowId))return {ok:false,reason:'unknown_flow'};
          traffic.setFlowEnabled(c.flowId,!!c.enabled);emit(c.enabled?'traffic_flow_enabled':'traffic_flow_disabled',{flowId:c.flowId});return {ok:true};}
        default:return {ok:false,reason:'not_implemented'};
      }
    }
    /* manual single-unit spawn: honest rejection reasons, deterministic portal choice (sorted ids, rotation) */
    function spawnUnit(c){
      if(!trafficApi)return {ok:false,reason:'traffic_not_enabled'};
      const units=traffic?traffic.units:new Map((vt?.units||[]).map(u=>[u.id,u])),u=units.get(c.unitId);
      if(!u)return {ok:false,reason:'unknown_unit'};if(u.enabled===false)return {ok:false,reason:'unit_disabled'};
      const cls=classes[u.classId];if(!cls)return {ok:false,reason:'unknown_class'};
      const prov={unitId:u.id,flowId:null};
      const done=r=>{if(r.ok){emit('traffic_unit_spawned',{vehicleId:r.vehicleId,unitId:u.id,flowId:null,portalId:r.portalId});return {ok:true,vehicleId:r.vehicleId,portalId:r.portalId};}return r;};
      if(c.portalId){if(!graph.entryPortals.includes(c.portalId))return {ok:false,reason:'portal_not_eligible'};
        const r=tryPlace(u.classId,c.portalId,{traffic:prov,origin:'unit'});return done(r.ok?{...r,portalId:c.portalId}:r);}
      const reasons=[],order=graph.entryPortals,n=order.length;if(!n)return {ok:false,reason:'no_eligible_portal'};
      const start=W.manualSpawns++%n;
      for(let k=0;k<n;k++){const pid=order[(start+k)%n],r=tryPlace(u.classId,pid,{traffic:prov,origin:'unit'});if(r.ok)return done({...r,portalId:pid});reasons.push(r.reason);}
      const same=reasons.every(x=>x===reasons[0]);
      return {ok:false,reason:same&&['vehicle_too_wide','route_restricted','max_active','spawn_gap_blocked','entry_in_view'].includes(reasons[0])?reasons[0]:'no_eligible_portal',tried:order.map((p,i)=>({portalId:p,reason:reasons[(i-start+n)%n]}))};
    }

    /* ---------------- read-only views */
    const r3=x=>Number.isFinite(x)?+x.toFixed(3):x;
    function vehicleSeatPoses(v,seatId=null){
      if(!v)return [];const cls=v.cls||classes[v.classId]||{},poses=Array.isArray(cls.seatPoses)?cls.seatPoses:[],propId=v.visual?.propId,prop=propId?propsById.get(propId):null,raw=Array.isArray(prop?.scale)?prop.scale:[prop?.scale,prop?.scale,prop?.scale],sx=Number.isFinite(raw[0])?raw[0]:1,sy=Number.isFinite(raw[1])?raw[1]:1,sz=Number.isFinite(raw[2])?raw[2]:1,slots=new Map((cls.slots||[]).map(q=>[q.id,q]));
      return poses.filter(q=>!seatId||q.seatId===seatId).map(q=>{const lx=q.x*sx,ly=q.y*sy,lz=q.z*sz,w=localToWorld(v,lx,lz),slot=slots.get(q.seatId)||{};return {schema:SEAT_POSE_SCHEMA,vehicleId:v.id,classId:v.classId,seatId:q.seatId,role:q.role||slot.role||null,compartment:q.compartment||slot.compartment||null,label:q.label||q.seatId,local:{x:r3(lx),y:r3(ly),z:r3(lz),yaw:r3(q.yaw||0)},x:w.x,y:w.y,story:w.story,heading:r3(norm(v.heading+(q.yaw||0))),zOffset:r3((Number.isFinite(prop?.z)?prop.z:0)+ly),source:'class'};});
    }
    function vehicleSeatPose(v,seatId){return vehicleSeatPoses(v,seatId)[0]||null;}
    function vehicleAccessPoints(v,type=null){
      const propId=v?.visual?.propId,prop=propId?propsById.get(propId):null,cls=v?.cls||classes[v?.classId]||null,classBySeat=new Map((cls?.accessPoints||[]).map(q=>[q.seatId||q.type,q]));
      const raw=Array.isArray(prop?.scale)?prop.scale:[prop?.scale,prop?.scale,prop?.scale],sx=Number.isFinite(raw[0])?raw[0]:1,sy=Number.isFinite(raw[1])?raw[1]:1,sz=Number.isFinite(raw[2])?raw[2]:1,b=basis(v.heading),pts=[],used=new Set();
      const add=(input,source)=>{if(!input||input.enabled===false)return;const base=source==='prop'?classBySeat.get(input.seatId||input.type)||{}:{},pt={...base,...input},seatId=pt.seatId||pt.type||null;if(seatId&&used.has(seatId))return;const lx=(Number.isFinite(pt.x)?pt.x:0)*sx,lz=(Number.isFinite(pt.z)?pt.z:0)*sz,interactionRadius=Number.isFinite(pt.interactionRadius)&&pt.interactionRadius>0?pt.interactionRadius:1,highlightRadius=Number.isFinite(pt.highlightRadius)&&pt.highlightRadius>=interactionRadius?pt.highlightRadius:Math.max(2.4,interactionRadius),q={vehicleId:v.id,propId,pointId:pt.id||null,seatId,type:pt.type||seatId||'point',name:pt.name||null,cueLabel:pt.cueLabel||pt.name||seatId||'DOOR',side:pt.side||null,end:pt.end||null,marker:pt.marker||'door',accessKind:pt.accessKind||null,interiorNodeId:pt.interiorNodeId||null,doorState:v.doorState||'CLOSED',interactionRadius:r3(interactionRadius),highlightRadius:r3(highlightRadius),enabled:true,source,
          x:r3(v.x-b.rx*lx+b.fx*lz),y:r3(v.y-b.ry*lx+b.fy*lz),story:v.story,heading:r3(norm(v.heading-(Number.isFinite(pt.yaw)?pt.yaw:0))),zOffset:r3((Number.isFinite(prop?.z)?prop.z:0)+(Number.isFinite(pt.y)?pt.y:0)*sy)};pts.push(q);if(seatId)used.add(seatId);};
      for(const pt of prop?.points||[])add(pt,'prop');for(const pt of cls?.accessPoints||[])add(pt,'class');
      return pts.filter(pt=>!type||pt.type===type||pt.seatId===type);
    }
    function vehicleAccessStatus(v){const live=v?.parking?.spaceId?W.spaces.get(v.parking.spaceId):null,sp=v?.parking?.spaceId?parkingDef(v.parking.spaceId):null,svc=transitServiceForVehicle(v),kind=sp?.access?.kind||sp?.kind||null;let allowed=false,reason=null;if(!v)reason='unknown_vehicle';else if(v.state!=='PARKED')reason='vehicle_not_parked';else if(v.speed>.05)reason='vehicle_moving';else if(!live||live.state!=='OCCUPIED')reason='bay_not_occupied';else if(live.accessEnabled===false||sp?.access?.enabled===false)reason='bay_access_disabled';else if(svc&&kind!=='transit_bay')reason='transit_not_at_stop';else if(svc&&svc.doorState!=='OPEN')reason='transit_door_closed';else allowed=true;return {vehicleId:v?.id||null,allowed,reason:allowed?null:reason,spaceId:v?.parking?.spaceId||null,spaceKind:kind,state:v?.state||null,doorState:svc?.doorState||v?.doorState||null,serviceId:svc?.id||null};}
    // V2.4.1: ROOM owns the forgiving physical access zones and orientation facts. Hosts may draw them however they
    // like, but must not invent door positions/radii or front/back from presentation art.
    function vehicleAccessCandidates(v,p){if(!v||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return [];const status=vehicleAccessStatus(v),story=Number.isInteger(p.story)?p.story:v.story;let out=vehicleAccessPoints(v).filter(q=>q.story===story).map(q=>{const d=Math.hypot(q.x-p.x,q.y-p.y),inRange=d<=q.interactionRadius+1e-9,highlighted=d<=q.highlightRadius+1e-9;return {...q,distance:r3(d),inRange,highlighted,allowed:status.allowed,usable:status.allowed&&inRange,accessReason:status.reason};}).sort((a,b)=>a.distance-b.distance||String(a.seatId).localeCompare(String(b.seatId)));return out.map((q,i)=>({...q,nearest:i===0}));}
    function vehicleInteractionCues(v,p=null){if(!v)return null;const cls=v.cls||classes[v.classId]||{},leg=cls.visual?.legibility||{},b=basis(v.heading),fo=Number.isFinite(leg.front?.offset)?leg.front.offset:.55,ro=Number.isFinite(leg.rear?.offset)?leg.rear.offset:.4,frontD=v.halfLength+fo,rearD=v.halfLength+ro,front={x:r3(v.x+b.fx*frontD),y:r3(v.y+b.fy*frontD),story:v.story,heading:r3(v.heading),label:leg.front?.label||'FRONT',marker:leg.front?.marker||'chevron'},rear={x:r3(v.x-b.fx*rearD),y:r3(v.y-b.fy*rearD),story:v.story,heading:r3(norm(v.heading+180)),label:leg.rear?.label||'REAR',marker:leg.rear?.marker||'bar'},access=vehicleAccessPoints(v),candidates=p?vehicleAccessCandidates(v,p):[];return {schema:INTERACTION_CUE_SCHEMA,vehicleId:v.id,classId:v.classId,state:v.state,story:v.story,heading:r3(v.heading),forward:{x:r3(b.fx),y:r3(b.fy)},right:{x:r3(b.rx),y:r3(b.ry)},body:{x:r3(v.x),y:r3(v.y),halfLength:r3(v.halfLength),halfWidth:r3(v.halfWidth),profile:leg.profile||'vehicle'},front,rear,access,candidates,accessStatus:vehicleAccessStatus(v)};}
    function record(v){
      return {vehicleId:v.id,classId:v.classId,state:v.state,overlay:v.overlay,lifecycle:{...v.lifecycle},visual:{...v.visual},
        footprint:{...v.footprint},pose:{elementId:v.route?(v.elementId??null):null,s:v.route?r3(v.elementS):0,routeS:v.route?r3(v.rs):null,lateral:r3(v.lateral),x:r3(v.x),y:r3(v.y),story:v.story,heading:r3(v.heading),speed:r3(v.speed)},
        route:v.route?{entryPortal:v.route.entryPortal,exitPortal:v.route.exitPortal,elements:[...v.route.elements],index:v.partIndex??0,laneFamily:v.route.laneFamily}:null,
        driver:{style:v.driver.name,reaction:r3(v.driver.reaction)},ai:{state:v.aiState,targetSpeed:r3(v.targetSpeed),cruiseSpeed:r3(v.cruiseSpeed),braking:!!v.braking,emergency:!!v.emergency,responseTo:v.responseTo,
          signal:v.signalNote?{signalId:v.signalNote.signalId,groupId:v.signalNote.groupId,connectorId:v.signalNote.connectorId,perceived:v.signalNote.state,decision:v.signalNote.decision,distance:r3(v.signalNote.dFront)}:null},
        traffic:{...v.traffic},occupancy:{driverActorId:v.driverActorId||null,driverSeatPose:vehicleSeatPose(v,'driver'),slots:[...W.interiorActors.values()].filter(a=>a.vehicleId===v.id).map(a=>({actorId:a.actorId,kind:'interior'})).sort((a,b)=>a.actorId.localeCompare(b.actorId))},controller:{mode:v.controller.mode},intent:['external','guided','service'].includes(v.controller.mode)?{...v.intent}:null,
        motion:{direction:v.driveDirection<0?'reverse':'forward',signedSpeed:r3(v.speed*(v.driveDirection||1)),lateralVelocity:r3(v.lateralVelocity)},lane:laneStatus(v),parking:{spaceId:v.parking.spaceId,task:v.parking.task,access:vehicleAccessStatus(v)},transit:v.serviceId?transitState(transitServiceForVehicle(v)):null,interior:interiorStateForVehicle(v),enforcement:{pullover:null,pursuit:null},
        collision:{lastContactAt:v.lastContactAt,contactCount:v.contactCount,lastSeverity:v.lastSeverity},damage:{level:0}};
    }
    function signalStates(){return signals?signals.controllers.map(c=>{const s=signals.stateAt(c.id,W.tick);return {...s,phaseElapsed:r3(s.phaseElapsed),phaseRemaining:r3(s.phaseRemaining),label:c.label,intersectionId:c.intersectionId};}):[];}
    function snapshot(){
      const vs=[...W.vehicles].sort((a,b)=>a.id<b.id?-1:1).map(record);
      return deep({schema:SCHEMA,tick:W.tick,time:r3(time()),vehicles:vs,spaces:[...W.spaces.values()].map(s=>({...s})),offstage:W.offstage.map(record),
        counts:{moving:W.vehicles.filter(moving).length,parked:W.vehicles.filter(v=>v.state==='PARKED').length,offstage:W.offstage.length},
        traffic:traffic?{enabled:true,...traffic.state()}:{enabled:false},transit:[...W.transit.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(transitState),interiorActors:[...W.interiorActors.values()].sort((a,b)=>a.actorId.localeCompare(b.actorId)).map(a=>deep(interiorStateForVehicle(W.byId.get(a.vehicleId))?.actors.find(x=>x.actorId===a.actorId))),signals:signalStates(),violations:W.violations,hints:deep(W.hints),suppressedBodies:[...W.suppressedBodies].sort()});
    }
    function query(name,...a){
      switch(name){
        case 'getVehicleState':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(record(v)):null;}
        case 'getVehicleAccessPoints':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(vehicleAccessPoints(v,a[1]||null)):[];}
        case 'getVehicleSeatPoses':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(vehicleSeatPoses(v,a[1]||null)):[];}
        case 'getVehicleSeatPose':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(vehicleSeatPose(v,a[1])):null;}
        case 'getVehicleAccessStatus':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return deep(vehicleAccessStatus(v));}
        case 'getVehicleAccessCandidates':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(vehicleAccessCandidates(v,a[1]||null)):[];}
        case 'getVehicleInteractionCues':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(vehicleInteractionCues(v,a[1]||null)):null;}
        case 'getParkingCaptureCandidates':{const v=W.byId.get(a[0]);return v?deep(parkingCaptureCandidates(v)):[];}
        case 'getLaneStatus':{const v=W.byId.get(a[0])||W.offstage.find(x=>x.id===a[0]);return v?deep(laneStatus(v)):null;}
        case 'getTransitServiceState':return deep(transitState(W.transit.get(a[0])||transitServiceForVehicle(W.byId.get(a[0]))));
        case 'getTransitServices':return deep([...W.transit.values()].sort((x,y)=>x.id.localeCompare(y.id)).map(transitState));
        case 'getVehicleDoorState':{const v=W.byId.get(a[0]);return v?{vehicleId:v.id,serviceId:v.serviceId||null,doorState:v.doorState||'CLOSED'}:null;}
        case 'getVehicleInterior':{const v=W.byId.get(a[0]);return v?deep(interiorStateForVehicle(v)):null;}
        case 'getInteriorActorState':{const actorId=String(a[0]||''),ia=W.interiorActors.get(actorId),v=ia&&W.byId.get(ia.vehicleId),state=v&&interiorStateForVehicle(v);return deep(state?.actors.find(x=>x.actorId===actorId)||null);}
        case 'isBodySuppressed':return W.suppressedBodies.has(String(a[0]));
        case 'getVehicleRoute':{const v=W.byId.get(a[0]);return v&&v.route?deep({entryPortal:v.route.entryPortal,exitPortal:v.route.exitPortal,isLoop:!!v.route.isLoop,loopNextElement:v.route.loopNextElement||null,loopLaps:v.loopLaps||0,elements:v.route.elements,total:v.route.total,routeS:v.rs}):null;}
        case 'getNearbyVehicles':{const p=a[0]||{},rr=Number.isFinite(a[1])?a[1]:10;return W.vehicles.filter(v=>Math.hypot(v.x-p.x,v.y-p.y)<=rr).sort((x,y)=>x.id<y.id?-1:1).map(v=>v.id);}
        case 'getParkingSpaceState':{const s=W.spaces.get(a[0]);return s?{...s}:null;}
        case 'getTrafficCatalogue':return catalogue();
        case 'getTrafficFlowState':return traffic?deep(traffic.state().flows):[];
        case 'getTrafficMeter':return traffic?{value:traffic.meter,preset:trafficApi.meterFor(traffic.meter).preset}:null;
        case 'getSignalState':return signalStates().find(s=>s.signalId===a[0])||null;
        case 'getSignalStates':return signalStates();
        case 'getSignalHeads':return signals?deep(signals.heads()):[];
        case 'getEdgeOccupancy':return edgeOccupancy(a[0]);
        default:return undefined;
      }
    }
    /* physical queue capacity of one edge: usable length minus stopped/slow vehicle footprints and their standstill gaps
       (not a car count — a bus uses more room than a sedan). Basis for future spillback / saturation (incident steering). */
    function edgeOccupancy(edgeId){
      const el=graph.elements.get(edgeId);if(!el)return null;let occupied=0,stopped=0,present=0;
      for(const v of W.vehicles){if(!moving(v)||v.elementId!==edgeId)continue;present++;if(v.speed<wc.boxClearSpeed){stopped++;occupied+=2*v.halfLength+v.driver.standstillGap;}}
      return {edgeId,length:r3(el.len),occupiedLength:r3(occupied),freeLength:r3(Math.max(0,el.len-occupied)),occupancy:r3(Math.min(1,occupied/el.len)),stoppedVehicles:stopped,vehicles:present};
    }
    function catalogue(){
      const units=traffic?[...traffic.units.values()]:(vt?.units||[]);
      return deep(units.map(u=>{const c=classes[u.classId];return {unitId:u.id,label:u.label,classId:u.classId,classLabel:c?c.label:null,occupantCapacity:c?c.occupantCapacity:null,
        enabled:u.enabled!==false,role:u.role||'',classifications:u.classifications||[],tags:u.tags||[],capabilities:u.capabilities||[],abilities:u.abilities||[],
        portals:graph.entryPortals.map(p=>({portalId:p,eligible:c?!(trafficApi?trafficApi.routeEligibility(c,graph,p):(!KC.fitsCorridor(c,graph.routeFrom(p).minHalfWidth)&&'vehicle_too_wide')):false,
          reason:c?(trafficApi?trafficApi.routeEligibility(c,graph,p):null):'unknown_class'}))};}));
    }
    function exportRun(){
      return deep({schema:RUN_SCHEMA,world:SCHEMA,seed,config:{...configIn},classes,graphHash:hash32(JSON.stringify(routeNet.vehicleGraph||routeNet.traffic||null)),
        trafficHash:hash32(JSON.stringify(routeNet.vehicleTraffic||null)),transitHash:hash32(JSON.stringify(routeNet.vehicleTransit||null)),inputs:W.inputs,events:W.eventLog,droppedEvents:W.droppedEvents,final:snapshot()});
    }
    /* light read-only list for drawing (no deep copies of every record each frame) */
    function renderList(){
      return W.vehicles.map(v=>({id:v.id,classId:v.classId,state:v.state,visualKind:v.visual.kind,propId:v.visual.propId,x:v.x,y:v.y,story:v.story,heading:v.heading,speed:v.speed,
        routeS:v.rs,elementId:v.route?v.elementId:null,laneFamily:v.route?v.route.laneFamily:null,laneIndex:v.laneIndex,laneTarget:v.laneTarget,laneChanging:!!v.laneChanging,halfLength:v.halfLength,halfWidth:v.halfWidth,aiState:v.aiState,braking:!!v.braking,emergency:!!v.emergency,
        cruiseSpeed:v.cruiseSpeed,responseTo:v.responseTo,driverStyle:v.driver.name,controllerMode:v.controller.mode,driveDirection:v.driveDirection,loopLaps:v.loopLaps||0,intent:['external','guided','service'].includes(v.controller.mode)?{...v.intent}:null,traffic:{...v.traffic},contactCount:v.contactCount,serviceId:v.serviceId||null,driverActorId:v.driverActorId||null,doorState:v.doorState||'CLOSED',transit:v.serviceId?transitState(transitServiceForVehicle(v)):null,interiorActors:[...W.interiorActors.values()].filter(a=>a.vehicleId===v.id).map(a=>a.actorId).sort(),
        signal:v.signalNote?{signalId:v.signalNote.signalId,state:v.signalNote.state,decision:v.signalNote.decision}:null}));
    }
    function setController(vehicleId,mode){const v=W.byId.get(vehicleId);if(v?.controller.mode===mode)return {ok:true,unchanged:true};return command({type:'setController',vehicleId,mode});}
    function setDriverIntent(vehicleId,intent){const v=W.byId.get(vehicleId),raw=intent||{},n=normalizeIntent(raw);if(v?.controller.mode==='guided'&&!n.motion)n.motion=v.intent?.motion||'hold';if(['external','guided'].includes(v?.controller.mode)&&sameIntent(v.intent,n))return {ok:true,unchanged:true,intent:{...n}};return command({type:'driverIntent',vehicleId,intent:raw});}
    function setBodySuppressed(bodyId,suppressed=true){const id=bodyId==null?'':String(bodyId),yes=suppressed!==false;if(id&&W.suppressedBodies.has(id)===yes)return {ok:true,unchanged:true,bodyId:id,suppressed:yes};return command({type:'setBodySuppressed',bodyId:id,suppressed:yes});}
    const api={get tick(){return W.tick;},get time(){return time();},step,setBodies,setHints,setController,setDriverIntent,setBodySuppressed,activateVehicle:vehicleId=>command({type:'activateVehicle',vehicleId}),setTransitDriver:(serviceId,actorId)=>command({type:'setTransitDriver',serviceId,actorId}),setTransitServiceActive:(serviceId,active=true)=>command({type:'setTransitServiceActive',serviceId,active}),setTransitDwellSeconds:(serviceId,seconds)=>command({type:'setTransitDwellSeconds',serviceId,seconds}),boardTransitActor:(actorId,vehicleId)=>command({type:'boardTransitActor',actorId,vehicleId}),setInteriorActorInput:(actorId,input)=>command({type:'setInteriorActorInput',actorId,input}),alightTransitActor:actorId=>command({type:'alightTransitActor',actorId}),command,query,snapshot,renderList,events:(since=0)=>deep(W.events.filter(e=>e.seq>since)),
      lastSeq:()=>W.seq,
      exportRun,graph,classes,config:{...cfg,...wc},signals,trafficOn,
      _perceive:id=>{const v=W.byId.get(id);return v&&v.route?deep(perceive(v)):null;},_internal:W,
      /* TEST ONLY — places a vehicle anywhere on a route without spawn rules and without logging (not replayable) */
      _place:(classId,portalId,rs,speed,extra={})=>{const route=graph.routeFrom(portalId),v=makeVehicle({classId,route,rs,speed,origin:'test',...extra});v.cruiseSpeed=Number.isFinite(extra.cruise)?extra.cruise:speed;v.targetSpeed=speed;v.perception=perceive(v);return v.id;}};
    return api;
  }
  /* Rebuild a run from its export: same routeNet/props, same seed/config/classes, the logged inputs re-applied at their
     ticks in their original order, stepped to the final tick. */
  function replay(run,{routeNet,props}={}){
    const w=create({routeNet,props,seed:run.seed,config:run.config,classes:run.classes}),inputs=run.inputs||[];let i=0;
    const apply=()=>{while(i<inputs.length&&inputs[i].tick===w.tick){const x=inputs[i++];if(x.kind==='bodies')w.setBodies(x.data);else if(x.kind==='hints')w.setHints(x.data);else if(x.kind==='command')w.command(x.data);}};
    const end=run.final?.tick||0;while(w.tick<end){apply();w.step();}apply();return w;
  }
  return Object.freeze({SCHEMA,RUN_SCHEMA,DRIVER_INTENT_SCHEMA,GUIDED_INTENT_SCHEMA,INTERACTION_CUE_SCHEMA,TRANSIT_SCHEMA,MOBILE_INTERIOR_SCHEMA,SEAT_POSE_SCHEMA,STATES,SPACE_STATES,WORLD_DEFAULTS,create,replay,rectOverlap,worldConfig,normalizeIntent});
});
