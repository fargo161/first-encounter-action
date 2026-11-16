/* ROOM Transport Infrastructure Foundation 0.1.0
 * Optional cityStructure.transportInfrastructure: authored places and exact bindings.
 * No actor identities, scheduling, occupancy, reservations, fare decisions, or new movement graph.
 * All inspections are disposable projections of the existing ROOM data. No inspection mutates it.
 */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./city-structure.js'):root.RCCityStructure,
    node?require('./vehicle-graph.js'):root.RCVehicleGraph,
    node?require('./vehicle-classes.js'):root.RCVehicleClasses,
    node?require('./vehicle-signals.js'):root.RCVehicleSignals);
  if(node)module.exports=api;if(root)root.RCTransportInfrastructure=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(S,G,K,Signals){
'use strict';
const SCHEMA='rc-transport-infrastructure@0.1', VERSION='0.1.0';
const COLLECTIONS={curbs:'Shared curb locations',stoppingPlaces:'Stopping places'};
const USES=['parking','receiving','pickup','transit','layover','service','keep_clear'];
const STOP_KINDS=['transit_boarding','passenger_pickup','receiving','layover','service'];
const CONFIGURATIONS=['authored_bay','in_lane_proposal'];
const MANEUVERS=['forward_only','requires_reverse','articulated'];
const PRECISE_KINDS=['vehicleLane','signalController','signalGroup'];
const clone=x=>JSON.parse(JSON.stringify(x));
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const get=p=>p.cityStructure?.transportInfrastructure||null;
const supported=t=>object(t)&&t.schema===SCHEMA;
const fail=m=>{throw Error('Transport infrastructure: '+m);};
const text=(x,p,max=200,empty=false)=>{if(typeof x!=='string'||x.length>max||(!empty&&!x.trim()))fail(p+' must be '+(empty?'':'nonempty ')+'text (maximum '+max+' characters).');};
const array=(x,p)=>{if(!Array.isArray(x)||x.length>20000)fail(p+' must be an array (maximum 20,000 entries).');};
const number=(x,p,min=0,max=1e8,int=false)=>{if(!Number.isFinite(x)||x<min||x>max||(int&&!Number.isInteger(x)))fail(p+' must be a finite '+(int?'integer ':'')+'number in ['+min+', '+max+'].');};
const enumValue=(x,options,p)=>{if(!options.includes(x))fail(p+' has an unsupported value.');};
const runtimeFields=new Set(['actors','actorId','actorIds','employees','assignedActorId','initialDriverActorId','driverActorId','occupants','occupancy','schedules','schedule','timetable','timetables','currentStock','inventory','transactions','currentPrice','balance','runtime','permissionsGranted','reservations','ridership','fareTransactions']);
function noRuntime(x,path='transport',depth=0){
  if(depth>40)fail('extension nesting exceeds 40 levels.');
  if(!x||typeof x!=='object')return;
  for(const [key,value] of Object.entries(x)){if(runtimeFields.has(key))fail(path+'.'+key+' is runtime/ENCOUNTER state, not infrastructure authoring.');noRuntime(value,path+'.'+key,depth+1);}
}
function ref(r,path,kinds=null,nullable=true){
  if(nullable&&r===null)return;S.validatePhysicalRef(r,path);
  if(kinds&&!kinds.includes(r.kind))fail(path+' must reference '+kinds.join(' / ')+'.');
}
function refs(xs,path,kinds=null){array(xs,path);xs.forEach((r,i)=>ref(r,path+'['+i+']',kinds,false));}
function ids(xs,path){array(xs,path);xs.forEach((x,i)=>text(x,path+'['+i+']',100));}
function validateShape(t){
  if(!object(t))fail('optional extension must be an object.');text(t.schema,'schema',80);
  if(!t.schema.startsWith('rc-transport-infrastructure@'))fail('unsupported schema family.');
  if(!supported(t))return {supported:false};
  if(t.authority!=='authoring-only')fail('authority must be authoring-only.');
  if(t.units!=='m')fail('units must be m. Curb extents are metres along the authored road centerline.');
  number(t.revision,'revision',0,1e8,true);noRuntime(t);
  const seen=new Set();
  for(const col of Object.keys(COLLECTIONS)){
    array(t[col],col);
    for(const r of t[col]){
      if(!object(r))fail(col+' contains a non-object.');text(r.id,col+'.id',100);
      if(!/^[-a-zA-Z0-9_]+$/.test(r.id)||seen.has(r.id))fail('invalid or duplicate infrastructure ID '+r.id+'.');seen.add(r.id);
      text(r.name,r.id+'.name',180);text(r.notes,r.id+'.notes',5000,true);
      if(col==='curbs'){
        ref(r.roadRef,r.id+'.roadRef',['vehicleEdge','vehicleConnector']);ref(r.laneRef,r.id+'.laneRef',['vehicleLane']);
        enumValue(r.side,['left','right'],r.id+'.side');number(r.story,r.id+'.story',-100,100,true);
        number(r.startM,r.id+'.startM');number(r.endM,r.id+'.endM');
        array(r.uses,r.id+'.uses');r.uses.forEach(x=>enumValue(x,USES,r.id+'.uses'));
        refs(r.bayRefs,r.id+'.bayRefs',['vehicleBay']);refs(r.pedestrianRefs,r.id+'.pedestrianRefs',['routeVertex','routeEdge','routeNode','opening','usePoint']);
        refs(r.controlRefs,r.id+'.controlRefs',['signalController','signalGroup']);ids(r.premisesIds,r.id+'.premisesIds');
      }else{
        if(r.premisesId!==null)text(r.premisesId,r.id+'.premisesId',100);
        if(r.curbId!==null)text(r.curbId,r.id+'.curbId',100);
        enumValue(r.kind,STOP_KINDS,r.id+'.kind');enumValue(r.configuration,CONFIGURATIONS,r.id+'.configuration');
        enumValue(r.maneuverIntent,MANEUVERS,r.id+'.maneuverIntent');
        ref(r.bayRef,r.id+'.bayRef',['vehicleBay']);text(r.vehicleClassId,r.id+'.vehicleClassId',100);text(r.doorId,r.id+'.doorId',100,true);
        for(const key of ['approachRef','waitingRef','boardingRef','exitRef'])ref(r[key],r.id+'.'+key,['routeVertex']);
        refs(r.pathRefs,r.id+'.pathRefs',['routeEdge']);ids(r.stationIds,r.id+'.stationIds');
      }
    }
  }
  return {supported:true};
}
function empty(){return {schema:SCHEMA,authority:'authoring-only',units:'m',revision:0,curbs:[],stoppingPlaces:[]};}
function initialize(p){
  const s=clone(S.get(p)||S.empty());S.validateShape(s);if(!S.supported(s))fail('City Structure version is read-only.');
  if(s.transportInfrastructure){validateShape(s.transportInfrastructure);if(!supported(s.transportInfrastructure))fail('future infrastructure schema is read-only.');return s.transportInfrastructure;}
  s.transportInfrastructure=empty();s.revision++;p.cityStructure=s;return s.transportInfrastructure;
}
function draft(col,patch={}){
  if(!COLLECTIONS[col])fail('unknown collection.');
  const base={id:'ti_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9),name:col==='curbs'?'New shared curb':'New stopping place',notes:''};
  const defaults=col==='curbs'?{roadRef:null,laneRef:null,side:'right',story:0,startM:0,endM:10,uses:['transit'],bayRefs:[],pedestrianRefs:[],controlRefs:[],premisesIds:[]}:
    {premisesId:null,curbId:null,kind:'transit_boarding',configuration:'authored_bay',maneuverIntent:'forward_only',bayRef:null,vehicleClassId:'bus',doorId:'access_passenger_door',approachRef:null,waitingRef:null,boardingRef:null,exitRef:null,pathRefs:[],stationIds:[]};
  return {...base,...defaults,...clone(patch)};
}
function put(p,col,record){
  if(!COLLECTIONS[col])fail('unknown collection.');const trial={...p,cityStructure:clone(S.get(p)||S.empty())};initialize(trial);
  const s=trial.cityStructure,t=get(trial);if(!supported(t))fail('future infrastructure schema is read-only.');
  const i=t[col].findIndex(r=>r.id===record.id),r=i<0?draft(col,record):{...t[col][i],...clone(record)};
  if(i<0)t[col].push(r);else t[col][i]=r;t.revision++;s.revision++;S.validateShape(s);p.cityStructure=s;return r;
}
function dependencies(p,col,id){const t=get(p);if(!supported(t))return [];return col==='curbs'?t.stoppingPlaces.filter(r=>r.curbId===id).map(r=>({collection:'transport:stoppingPlaces',id:r.id,name:r.name})):[];}
function remove(p,col,id){
  if(!COLLECTIONS[col])fail('unknown collection.');const s=clone(S.get(p));S.validateShape(s);const t=s?.transportInfrastructure;
  if(!supported(t))fail('infrastructure is absent or read-only.');const used=dependencies(p,col,id);
  if(used.length)fail('record is referenced by '+used.map(x=>x.name).join(', ')+'. Rebind those stopping places first.');
  if(!t[col].some(r=>r.id===id))fail('record no longer exists.');t[col]=t[col].filter(r=>r.id!==id);t.revision++;s.revision++;p.cityStructure=s;
}
function cityDependencies(p,id){
  const t=get(p);if(!t)return [];
  if(!supported(t))return [{collection:'transport:curbs',id:null,name:'read-only future transport extension (dependencies cannot be safely interpreted)'}];
  return Object.keys(COLLECTIONS).flatMap(col=>t[col].filter(r=>col==='curbs'?r.premisesIds.includes(id):r.premisesId===id||r.stationIds.includes(id)).map(r=>({collection:'transport:'+col,id:r.id,name:r.name})));
}
function physicalRefs(col,r){return col==='curbs'?[r.roadRef,r.laneRef,...r.bayRefs,...r.pedestrianRefs,...r.controlRefs].filter(Boolean):[r.bayRef,r.approachRef,r.waitingRef,r.boardingRef,r.exitRef,...r.pathRefs].filter(Boolean);}
function parentElement(p,kind,id){const list=kind==='vehicleEdge'?p.routeNet?.vehicleGraph?.edges:kind==='vehicleConnector'?p.routeNet?.vehicleGraph?.connectors:[];const hits=(list||[]).filter(r=>r.id===id);return hits.length===1?hits[0]:null;}
function laneLayoutToken(p,kind,id){
  const r=parentElement(p,kind,id);if(!r)return null;
  return S.fingerprint({kind,id,story:r.story??0,path:r.centerPath||r.path||[],lanes:r.lanes||null,corridor:r.corridor||null,direction:r.direction||null,fromNode:r.fromNode||null,toNode:r.toNode||null,fromEdge:r.fromEdge||null,toEdge:r.toEdge||null});
}
function groupToken(group){return S.fingerprint({connectorIds:[...(group.connectorIds||[])].sort()});}
function preciseCatalog(p){
  const out=[];let graph=null;try{graph=G.fromRouteNet(p.routeNet||{});}catch(_){/* malformed physical geometry stays the physical validator's responsibility */}
  for(const [kind,list] of [['vehicleEdge',p.routeNet?.vehicleGraph?.edges],['vehicleConnector',p.routeNet?.vehicleGraph?.connectors]]){
    for(const r of list||[]){const lm=graph?.elements.get(r.id)?.lanes;if(!lm)continue;
      for(let i=0;i<lm.count;i++)out.push({ref:{kind:'vehicleLane',parentKind:kind,parentId:r.id,id:'lane:'+i,layoutToken:laneLayoutToken(p,kind,r.id)},name:(r.name||r.id)+' / '+lm.labels[i]+' ['+i+']',record:{id:'lane:'+i,index:i,center:lm.centers[i],label:lm.labels[i],story:r.story??0},parent:r});
    }
  }
  for(const ctl of p.routeNet?.vehicleTraffic?.signals||[]){
    out.push({ref:{kind:'signalController',id:ctl.id},name:ctl.label||ctl.id,record:ctl});
    for(const group of ctl.groups||[])out.push({ref:{kind:'signalGroup',parentId:ctl.id,id:group.id,layoutToken:groupToken(group)},name:(ctl.label||ctl.id)+' / '+(group.label||group.id),record:group,parent:ctl});
  }
  return out;
}
function laneRef(p,kind,id,index){const r=preciseCatalog(p).find(x=>x.ref.kind==='vehicleLane'&&x.ref.parentKind===kind&&x.ref.parentId===id&&x.record.index===index);if(!r)fail('that explicit vehicle lane does not exist.');return clone(r.ref);}
function signalGroupRef(p,controllerId,groupId){const r=preciseCatalog(p).find(x=>x.ref.kind==='signalGroup'&&x.ref.parentId===controllerId&&x.ref.id===groupId);if(!r)fail('that signal group does not exist.');return clone(r.ref);}
function refIssue(p,r,catalog=null){
  const items=catalog||S.physicalCatalog(p),hits=items.filter(x=>S.refKey(x.ref)===S.refKey(r));
  if(hits.length>1)return {code:'AMBIGUOUS_PHYSICAL_REFERENCE',message:r.kind+' '+r.id+' has duplicate identities.'};
  if(hits.length===1)return null;
  if(r.kind==='vehicleLane'&&parentElement(p,r.parentKind,r.parentId))return {code:'STALE_LANE_REFERENCE',message:'Lane '+r.id+' of '+r.parentId+' has changed layout or no longer exists. Select its current lane explicitly; no index is silently reused.'};
  if(r.kind==='signalGroup'){
    const ctl=(p.routeNet?.vehicleTraffic?.signals||[]).find(x=>x.id===r.parentId);
    if(ctl?.groups?.some(x=>x.id===r.id))return {code:'STALE_SIGNAL_GROUP',message:'Signal group '+r.parentId+' / '+r.id+' controls a different movement set. Review and explicitly rebind it.'};
  }
  return {code:'MISSING_PHYSICAL_REFERENCE',message:'Missing '+r.kind+' '+(r.parentId?r.parentId+' / ':'')+r.id+'. No nearby or similarly named substitute is used.'};
}
function referencePoint(p,r){
  const item=S.resolvePhysical(p,r);if(!item)return null;let graph;try{graph=G.fromRouteNet(p.routeNet||{});}catch(_){return null;}
  if(r.kind==='vehicleLane'){const el=graph.elements.get(r.parentId);if(!el)return null;const q=G.poseAt(el,el.len/2),l=item.record.center;return {x:q.x+q.rx*l,y:q.y+q.ry*l,story:q.story};}
  const groups=r.kind==='signalController'?item.record.groups:[item.record];
  for(const group of groups||[])for(const id of group.connectorIds||[]){const el=graph.elements.get(id);if(el)return G.poseAt(el,0);}
  return null;
}
function sourceStamp(p){return {structureRevision:p.cityStructure?.revision??null,infrastructureRevision:get(p)?.revision??null,structureFingerprint:S.fingerprint(p.cityStructure||null),physicalFingerprint:S.fingerprint(Object.fromEntries(['rooms','floorSections','floorCuts','ceilingCuts','ceilingPatches','pillars','partitions','openings','stairs','props','objects','viewpoints','rails','routeNet','objectLibrary','stories','storyHeight','wallHeight','units'].map(k=>[k,p[k]??null]))),fingerprintPurpose:'Change detection only; not cryptographic integrity.'};}
function isFresh(report,p){const now=sourceStamp(p);return report?.source?.structureFingerprint===now.structureFingerprint&&report?.source?.physicalFingerprint===now.physicalFingerprint;}
function curbPoints(p,r){
  if(!r.roadRef||refIssue(p,r.roadRef))return [];
  let graph;try{graph=G.fromRouteNet(p.routeNet||{});}catch(_){return [];}
  const el=graph.elements.get(r.roadRef.id);if(!el||r.endM<=r.startM||r.startM<0||r.endM>el.len+1e-6)return [];
  const cuts=[r.startM,...el.cum.filter(s=>s>r.startM&&s<r.endM),r.endM],side=r.side==='right'?1:-1;
  return cuts.map(s=>{const q=G.poseAt(el,s);return {x:q.x+q.rx*el.halfWidth*side,y:q.y+q.ry*el.halfWidth*side,story:el.story};});
}
function recordPoint(p,col,r){
  if(col==='curbs'){const pts=curbPoints(p,r);if(pts.length)return pts[Math.floor(pts.length/2)];}
  for(const q of physicalRefs(col,r)){const pos=S.referencePoint(p,q);if(pos)return pos;}return null;
}
function bayPose(bay){const b=bay?.vehicleBox;if(!b||![b.x0,b.x1,b.y0,b.y1,bay.heading].every(Number.isFinite))return null;return {x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2,heading:bay.heading,story:bay.story??0};}
function projectedDoor(p,stop){
  const bay=S.resolvePhysical(p,stop.bayRef)?.record,pose=bayPose(bay),classes=K.resolve(p.routeNet?.vehicleLoop?.classes),cls=classes[stop.vehicleClassId];
  const door=cls?.accessPoints?.find(x=>x.id===stop.doorId);if(!pose||!door)return null;
  const a=pose.heading*Math.PI/180,fx=Math.sin(a),fy=-Math.cos(a),rx=Math.cos(a),ry=Math.sin(a);
  return {x:pose.x-rx*door.x+fx*door.z,y:pose.y-ry*door.x+fy*door.z,story:pose.story,side:door.side,localX:door.x,interactionRadius:door.interactionRadius||1,pointId:door.id,source:'class-at-authored-bay-pose',classId:stop.vehicleClassId};
}
/* Bounded topological check ONLY. It uses explicitly selected canonical routeNet edges.
 * Edges are bidirectional in the current preview; unknown direction/vertical capabilities are NOT invented.
 * Gate=false and closed/missing doors block the projection. Access intent is conditional, not permission.
 */
function walkConnections(p,stop){
  const vertices=new Map((p.routeNet?.vertices||[]).map(x=>[x.id,x])),edges=new Map((p.routeNet?.edges||[]).map(x=>[x.id,x])),adj=new Map(),excluded=[],conditional=[];
  const chosen=[...new Set(stop.pathRefs.map(x=>x.id))];
  const add=(a,b,e)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push({to:b,edge:e});};
  for(const id of chosen){const e=edges.get(id);if(!e)continue;const a=vertices.get(e.a),b=vertices.get(e.b);if(!a||!b){excluded.push({id,reason:'missing_endpoint'});continue;}
    if((a.story??0)!==(b.story??0)){excluded.push({id,reason:'vertical_transition_unverified'});continue;}
    if(e.oneWay!==undefined||e.direction!==undefined||e.bidirectional===false){excluded.push({id,reason:'direction_semantics_unverified'});continue;}
    if(e.enabled===false||e.gate===false){excluded.push({id,reason:'blocked_edge'});continue;}
    if(Math.hypot(a.x-b.x,a.y-b.y)<1e-6){excluded.push({id,reason:'zero_length'});continue;}
    if(e.door){const d=(p.openings||[]).find(x=>x.id===e.door);if(!d||d.kind==='door'&&!d.open){excluded.push({id,reason:d?'closed_door':'missing_door'});continue;}}
    const access=(p.cityStructure?.accessPlans||[]).filter(x=>x.target&&((x.target.kind==='routeEdge'&&x.target.id===id)||(x.target.kind==='opening'&&x.target.id===e.door))&&x.category!=='public');
    if(access.length)conditional.push(...access.map(x=>({id,accessPlanId:x.id,category:x.category})));
    add(e.a,e.b,id);add(e.b,e.a,id);
  }
  const path=(from,to)=>{
    if(!from||!to||!vertices.has(from)||!vertices.has(to))return null;
    if(from===to)return [];
    const queue=[from],seen=new Set([from]),prev=new Map();
    for(let i=0;i<queue.length;i++){const n=queue[i];for(const next of adj.get(n)||[]){if(seen.has(next.to))continue;seen.add(next.to);prev.set(next.to,{from:n,edge:next.edge});if(next.to===to){const result=[];let v=to;while(v!==from){const x=prev.get(v);result.push(x.edge);v=x.from;}return result.reverse();}queue.push(next.to);}}
    return null;
  };
  const pairs=[['approach_to_waiting',stop.approachRef?.id,stop.waitingRef?.id],['waiting_to_boarding',stop.waitingRef?.id,stop.boardingRef?.id],['boarding_to_exit',stop.boardingRef?.id,stop.exitRef?.id]];
  if(!['transit_boarding','passenger_pickup'].includes(stop.kind))pairs.splice(0,pairs.length,['approach_to_exit',stop.approachRef?.id,stop.exitRef?.id]);
  return {status:'topology_only',pairs:pairs.map(([name,a,b])=>({name,from:a||null,to:b||null,edges:path(a,b)})),excluded,conditional,
    limitation:'Endpoint connectivity on selected ROOM edges, not a locomotion, clearance, accessibility or permission proof. Coincident coordinates never create a connection.'};
}
function inspect(p){
  const t=get(p),diagnostics=[],curbResults=[],stopResults=[],source=sourceStamp(p);
  const emit=(severity,code,message,col=null,id=null,extra={})=>diagnostics.push({severity,code,message,collection:col?'transport:'+col:null,id,...extra});
  const finish=status=>({schema:'rc-transport-inspection@0.1',version:VERSION,status,source,errors:diagnostics.filter(d=>d.severity==='error').length,warnings:diagnostics.filter(d=>d.severity==='warning').length,diagnostics,curbs:curbResults,stoppingPlaces:stopResults,
    verification:'Exact references, declared curb extents, selected-edge connectivity and class-door projection only. No swept-path, full collision, overhead-clearance, capacity, permissions or live-service certification.'});
  if(!t)return finish('not_enabled');
  try{validateShape(t);}catch(e){emit('error','INVALID_TRANSPORT_SHAPE',e.message);return finish('invalid');}
  if(!supported(t)){emit('warning','FUTURE_TRANSPORT_SCHEMA','Preserving '+t.schema+' read-only. Use a compatible editor to interpret it.');return finish('read_only');}
  let graph;try{graph=G.fromRouteNet(p.routeNet||{});}catch(e){emit('error','PHYSICAL_GRAPH_INVALID','Existing vehicle graph cannot be inspected: '+e.message);return finish('invalid');}
  const catalog=S.physicalCatalog(p),resolve=r=>r?S.resolvePhysical(p,r,catalog):null,cs=p.cityStructure||{},classes=K.resolve(p.routeNet?.vehicleLoop?.classes);
  const common=(col,r)=>{for(const rr of physicalRefs(col,r)){const problem=refIssue(p,rr,catalog);if(problem)emit('error',problem.code,r.name+': '+problem.message,col,r.id);else if(resolve(rr)?.record.enabled===false)emit('warning','DISABLED_PHYSICAL_REFERENCE',r.name+': '+rr.id+' is disabled.',col,r.id);}};
  for(const r of t.curbs){
    const col='curbs';common(col,r);const el=r.roadRef&&resolve(r.roadRef)?graph.elements.get(r.roadRef.id):null;
    if(!r.roadRef)emit('warning','CURB_ROAD_UNBOUND',r.name+': choose the actual road element.',col,r.id);
    if(r.endM<=r.startM)emit('error','CURB_EXTENT_INVALID',r.name+': end must exceed start, in metres along the road centerline.',col,r.id);
    if(el&&r.endM>el.len+1e-6)emit('error','CURB_EXTENT_OUT_OF_RANGE',r.name+': end '+r.endM+' m exceeds the '+el.len.toFixed(2)+' m road element.',col,r.id);
    if(el&&r.story!==el.story)emit('error','CURB_STORY_MISMATCH',r.name+': declared story does not match its physical road.',col,r.id);
    if(el?.lanes&&!r.laneRef)emit('warning','CURB_LANE_UNBOUND',r.name+': this road has explicit lanes; select the approach lane.',col,r.id);
    if(r.laneRef&&r.roadRef&&(r.laneRef.parentId!==r.roadRef.id||r.laneRef.parentKind!==r.roadRef.kind))emit('error','CURB_LANE_PARENT_MISMATCH',r.name+': lane belongs to a different road element.',col,r.id);
    if(!r.uses.length)emit('warning','CURB_USE_UNDECLARED',r.name+': declare at least one intended use.',col,r.id);
    if(new Set(r.uses).size!==r.uses.length)emit('warning','CURB_DUPLICATE_USE',r.name+': a use is repeated; this creates no extra capacity.',col,r.id);
    if(r.uses.length>1)emit(r.uses.includes('keep_clear')?'error':'warning',r.uses.includes('keep_clear')?'KEEP_CLEAR_CONFLICT':'SHARED_CURB_MULTI_USE',r.name+': '+r.uses.join(' / ')+' share one physical location. No schedule, reservation or simultaneous availability is implied.',col,r.id);
    if(!r.bayRefs.length&&!r.uses.includes('keep_clear'))emit('warning','CURB_WITHOUT_EXECUTABLE_BAY',r.name+': a curb declaration does not create a supported stopping/capture context.',col,r.id);
    for(const id of r.premisesIds)if(!(cs.premises||[]).some(x=>x.id===id))emit('error','MISSING_PREMISES',r.name+': missing served premises '+id+'.',col,r.id);
    for(const rr of r.bayRefs){const bay=resolve(rr)?.record;if(!bay)continue;
      if((bay.story??0)!==r.story)emit('error','BAY_STORY_MISMATCH',r.name+': '+rr.id+' is on another story.',col,r.id);
      const access=graph.spaceAccess.get(rr.id);
      if(el&&access?.accessEdge!==el.id)emit('error','BAY_ROAD_MISMATCH',r.name+': '+rr.id+' does not use the declared road access edge.',col,r.id);
      const center=bayPose(bay);if(el&&center){const pr=G.projectOn(el,center);
        if(pr.s<r.startM-1e-6||pr.s>r.endM+1e-6)emit('warning','BAY_OUTSIDE_CURB_EXTENT',r.name+': '+rr.id+' center projects outside the declared longitudinal extent.',col,r.id);
        if(pr.lateral*(r.side==='right'?1:-1)<-.05)emit('error','BAY_WRONG_CURB_SIDE',r.name+': '+rr.id+' is on the other side of the authored travel direction.',col,r.id);
      }
      if(r.laneRef&&resolve(r.laneRef)&&Number.isInteger(bay.access?.requiredLane)&&resolve(r.laneRef).record.index!==bay.access.requiredLane)emit('error','BAY_APPROACH_LANE_MISMATCH',r.name+': lane selection differs from '+rr.id+' requiredLane.',col,r.id);
    }
    for(const rr of r.controlRefs){const item=resolve(rr);if(!item)continue;const controller=rr.kind==='signalController'?item.record:item.parent;
      if(!p.routeNet?.vehicleTraffic?.enabled||controller.enabled===false)emit('warning','SIGNAL_INACTIVE',r.name+': its referenced control is not enabled in Vehicle World.',col,r.id);
      const groups=rr.kind==='signalGroup'?[item.record]:controller.groups||[];
      if(el&&!groups.some(g=>(g.connectorIds||[]).some(id=>{const c=graph.elements.get(id);return c?.id===el.id||c?.fromEdge===el.id||c?.toEdge===el.id;})))emit('warning','CONTROL_NOT_ADJACENT',r.name+': selected control has no movement adjoining this road element.',col,r.id);
    }
    curbResults.push({id:r.id,roadLengthM:el?.len??null,extentLengthM:r.endM-r.startM,uses:r.uses,geometryStatus:el?'declared_extent_only':'unbound',points:curbPoints(p,r)});
  }
  // Compare only the same exact road/side/story. This is not a geometric-overlap sweep across unrelated roads.
  for(let i=0;i<t.curbs.length;i++)for(let j=i+1;j<t.curbs.length;j++){
    const a=t.curbs[i],b=t.curbs[j];const shared=a.bayRefs.some(x=>b.bayRefs.some(y=>S.refKey(x)===S.refKey(y)));
    const overlap=a.roadRef&&b.roadRef&&S.refKey(a.roadRef)===S.refKey(b.roadRef)&&a.story===b.story&&a.side===b.side&&Math.min(a.endM,b.endM)>Math.max(a.startM,b.startM)+1e-6;
    if(shared||overlap){const code=shared?'BAY_DOUBLE_CLAIM':'CURB_EXTENT_OVERLAP';for(const r of [a,b])emit('error',code,r.name+': shares '+(shared?'an existing bay':'road-side extent')+' with '+(r===a?b.name:a.name)+'. Use one shared curb record; do not count independent resources.','curbs',r.id,{relatedIds:[a.id,b.id]});}
  }
  for(const r of t.stoppingPlaces){
    const col='stoppingPlaces';common(col,r);const passenger=['transit_boarding','passenger_pickup'].includes(r.kind),curb=t.curbs.find(x=>x.id===r.curbId),bay=resolve(r.bayRef)?.record,cls=classes[r.vehicleClassId];
    if(!r.premisesId)emit('warning','STOP_PREMISES_UNBOUND',r.name+': bind its existing transit, service or other premises.',col,r.id);
    else if(!(cs.premises||[]).some(x=>x.id===r.premisesId))emit('error','MISSING_PREMISES',r.name+': missing premises '+r.premisesId+'.',col,r.id);
    if(!r.curbId)emit('warning','STOP_CURB_UNBOUND',r.name+': bind one shared curb location.',col,r.id);
    else if(!curb)emit('error','MISSING_CURB',r.name+': missing curb '+r.curbId+'.',col,r.id);
    else {const use={transit_boarding:'transit',passenger_pickup:'pickup',receiving:'receiving',layover:'layover',service:'service'}[r.kind];
      if(!curb.uses.includes(use))emit('warning','STOP_USE_NOT_DECLARED',r.name+': '+use+' is not an intended use of its curb.',col,r.id);
      if(r.bayRef&&!curb.bayRefs.some(x=>S.refKey(x)===S.refKey(r.bayRef)))emit('error','STOP_BAY_NOT_ON_CURB',r.name+': selected bay is not declared by the shared curb.',col,r.id);
    }
    if(r.configuration==='in_lane_proposal')emit('warning','IN_LANE_STOP_UNSUPPORTED',r.name+': in-lane boarding is only a proposal here. No new road-stop door authorization is created.',col,r.id);
    if(r.maneuverIntent!=='forward_only')emit('warning','MANEUVER_CAPABILITY_UNSUPPORTED',r.name+': '+r.maneuverIntent+' is not proven by the current guided-driving system.',col,r.id);
    if(!r.bayRef)emit('warning','STOP_BAY_UNBOUND',r.name+': choose an actual authored stopping bay.',col,r.id);
    if(!cls)emit('error','MISSING_VEHICLE_CLASS',r.name+': unknown class '+r.vehicleClassId+'.',col,r.id);
    if(bay){
      if(bay.access?.enabled!==true||bay.access?.capture!==true)emit('error','BAY_ACCESS_DISABLED',r.name+': bay must opt into physical access and capture.',col,r.id);
      if(r.kind==='transit_boarding'&&bay.access?.kind!=='transit_bay')emit('error','NOT_AUTHORIZED_TRANSIT_BAY',r.name+': ordinary parking or a road hold does not authorize the transit door.',col,r.id);
      if(Array.isArray(bay.access?.allowedClasses)&&!bay.access.allowedClasses.includes(r.vehicleClassId))emit('error','BAY_CLASS_INCOMPATIBLE',r.name+': '+r.vehicleClassId+' is not an allowed bay class.',col,r.id);
      if(!graph.spaceAccess.has(bay.id))emit('error','BAY_PHYSICAL_ACCESS_MISSING',r.name+': no canonical Vehicle World space-access connection exists.',col,r.id);
      for(const key of ['pullInPath','pullOutPath'])if((bay.maneuver?.[key]?.length||0)<2)emit('error','BAY_MANEUVER_PATH_MISSING',r.name+': '+key+' is absent or incomplete.',col,r.id);
    }
    const required=passenger?['approachRef','waitingRef','boardingRef','exitRef']:['approachRef','exitRef'];
    for(const key of required)if(!r[key])emit('warning','STOP_PEDESTRIAN_BINDING_MISSING',r.name+': '+key.replace('Ref','')+' vertex is unbound. Proximity does not supply a path.',col,r.id,{field:key});
    if(!r.pathRefs.length)emit('warning','STOP_PATH_UNBOUND',r.name+': select actual pedestrian route edges.',col,r.id);
    if(r.waitingRef&&r.boardingRef&&S.refKey(r.waitingRef)===S.refKey(r.boardingRef))emit('warning','WAITING_AT_BOARDING_POINT',r.name+': waiting and boarding use one point. Queue/through-clearance is not established.',col,r.id);
    const walk=walkConnections(p,r);
    for(const pair of walk.pairs)if(pair.from&&pair.to&&pair.edges===null)emit('error','PEDESTRIAN_PATH_DISCONNECTED',r.name+': no selected-edge connection for '+pair.name.replaceAll('_',' ')+'.',col,r.id,{pair:pair.name});
    for(const e of walk.excluded)emit(e.reason.includes('unverified')?'warning':'error','PEDESTRIAN_EDGE_UNUSABLE',r.name+': '+e.id+' is '+e.reason.replaceAll('_',' ')+'.',col,r.id);
    if(walk.conditional.length)emit('warning','CONDITIONAL_ACCESS',r.name+': selected edges include non-public or unspecified access declarations. No actor permission is inferred.',col,r.id);
    for(const key of required){const vertex=resolve(r[key])?.record;if(vertex&&bay&&(vertex.story??0)!==(bay.story??0))emit('error','STOP_PEDESTRIAN_STORY_MISMATCH',r.name+': '+key+' is on another story; no vertical link is invented.',col,r.id);}
    for(const id of r.stationIds){const st=(cs.stations||[]).find(x=>x.id===id);if(!st)emit('error','MISSING_ACTIVITY_SOCKET',r.name+': missing existing activity socket '+id+'.',col,r.id);else if(r.premisesId&&st.premisesId!==r.premisesId)emit('warning','SHARED_ACTIVITY_SOCKET',r.name+': '+st.name+' is assigned to different premises; review sharing intent.',col,r.id);}
    let door=null;
    if(passenger){
      if(!r.doorId)emit('warning','STOP_DOOR_UNBOUND',r.name+': select a class-owned access point, not a copied world coordinate.',col,r.id);
      else if(cls&&!cls.accessPoints?.some(x=>x.id===r.doorId))emit('error','CLASS_DOOR_MISSING',r.name+': selected door does not exist on '+r.vehicleClassId+'.',col,r.id);
      else {
        const pt=cls?.accessPoints?.find(x=>x.id===r.doorId);
        if(r.kind==='transit_boarding'&&pt&&pt.accessKind!=='interior_portal')emit('error','NOT_A_TRANSIT_PORTAL',r.name+': selected access point is not a mobile-interior doorway.',col,r.id);
        door=projectedDoor(p,r);const board=resolve(r.boardingRef)?.record,pose=bayPose(bay);
        if(door&&board&&pose){const a=pose.heading*Math.PI/180,rx=Math.cos(a),ry=Math.sin(a),fx=Math.sin(a),fy=-Math.cos(a),dx=board.x-pose.x,dy=board.y-pose.y,lateral=dx*rx+dy*ry,forward=dx*fx+dy*fy;
          door.distanceM=Math.hypot(door.x-board.x,door.y-board.y);
          if(lateral*Math.sign(-door.localX)<0)emit('error','BOARDING_WRONG_SIDE',r.name+': boarding point is across the vehicle from the actual class door.',col,r.id);
          if(Math.abs(lateral)<cls.geometry.width/2&&Math.abs(forward)<cls.geometry.length/2)emit('error','BOARDING_INSIDE_VEHICLE',r.name+': boarding point falls inside the parked class footprint.',col,r.id);
          if(door.distanceM>door.interactionRadius+1e-6)emit('error','BOARDING_OUT_OF_REACH',r.name+': boarding point is '+door.distanceM.toFixed(2)+' m from the projected door; class interaction radius is '+door.interactionRadius+' m.',col,r.id);
        }else if(bay&&pt)emit('warning','DOOR_ALIGNMENT_UNVERIFIED',r.name+': bay pose or boarding vertex is incomplete.',col,r.id);
      }
      if(bay&&r.pathRefs.length&&!r.pathRefs.some(x=>(bay.access?.walkLoopEdges||[]).includes(x.id)))emit('warning','BAY_WALK_INTERFACE_UNBOUND',r.name+': selected walking edges do not include a bay-authored walk interface.',col,r.id);
    }
    stopResults.push({id:r.id,walk,door,physicalBayId:bay?.id||null,maneuver:'not_certified',runtime:'not_executed_by_inspector'});
  }
  // Single physical bay is finite even when several stopping-place labels point at it.
  const byBay=new Map();for(const s of t.stoppingPlaces)if(s.bayRef){const key=S.refKey(s.bayRef);if(!byBay.has(key))byBay.set(key,[]);byBay.get(key).push(s);}
  for(const users of byBay.values())if(users.length>1)for(const r of users)emit('warning','STOP_BAY_SHARED',r.name+': '+users.length+' stopping-place declarations share one bay. They are not independent capacity.','stoppingPlaces',r.id);
  const signalFindings=Signals.validateRefs(p.routeNet?.vehicleTraffic?.signals||[],graph);
  for(const d of signalFindings)emit(d.level,'SIGNAL_'+d.code.toUpperCase(),d.message,null,null,{physicalPath:d.path});
  emit('info','INSPECTION_SCOPE','This pass does not certify maneuver envelopes, signal movement conflicts, overhead clearance, platform capacity, accessibility, service availability or ENCOUNTER permission.');
  return finish(!t.curbs.length&&!t.stoppingPlaces.length?'empty':diagnostics.some(x=>x.severity==='error')?'invalid_bindings':diagnostics.some(x=>x.severity==='warning')?'draft':'bindings_checked');
}
function contract(p){const t=get(p);if(!t)fail('enable transport infrastructure before exporting.');validateShape(t);if(!supported(t))fail('future schema is read-only.');return {schema:'rc-transport-contract@0.1',authority:'authoring-only',source:sourceStamp(p),infrastructure:clone(t),inspection:inspect(p),notImplemented:['live service scheduler','actor assignment','reservations','fares','permission decisions','new vehicle executor','swept-path certification','signal movement conflict certification']};}
return {SCHEMA,VERSION,COLLECTIONS,USES,STOP_KINDS,CONFIGURATIONS,MANEUVERS,PRECISE_KINDS,get,supported,validateShape,empty,initialize,draft,put,remove,dependencies,cityDependencies,physicalRefs,preciseCatalog,laneLayoutToken,laneRef,signalGroupRef,refIssue,referencePoint,recordPoint,curbPoints,projectedDoor,walkConnections,sourceStamp,isFresh,inspect,contract};
});
