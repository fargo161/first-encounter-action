/* First Encounter / Room Creator — route traffic helper v0.1.
 * Adapted from the delayed local-driver logic in Trapstar Vehicle Loop v0.4.
 * Room Creator uses metres and authored route-lane distance `s`, so the original
 * scene-unit tuning is scaled to the modular street's 8.5 m/s cruise reference.
 * Pure helper: no DOM, rendering, project mutation, Encounter mutation or lane changes.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCRouteTraffic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const SCALE=8.5/420; // Vehicle Loop gear-3 / Room Creator city-street cruise.
  const DEFAULT_CONFIG=Object.freeze({
    schema:'rc-route-vehicle-loop@0.1',fixedStep:1/240,
    graceSeconds:8,retireBuffer:300*SCALE,maxTracked:12,
    initialDelay:2.8,spawnIntervalMin:3.3,spawnIntervalMax:4.7,
    spawnMargin:90*SCALE,minSpawnGap:850*SCALE,minimumEncounterTime:3.5,
    senseInterval:.10,forwardRange:1750*SCALE,rearRange:850*SCALE,
    rearBoostFraction:.16,rearBoostCap:70*SCALE,frontBoostClearance:260*SCALE,
    vehicleHalfLength:2.15,vehicleHalfWidth:.92,pedestrianHalfLength:.32,
    pedestrianSenseLateral:1.18,contactEpsilon:.0001,seedPerLane:2,
    cruiseVariationMin:.82,cruiseVariationMax:1.16
  });
  const DRIVER_STYLES=Object.freeze([
    Object.freeze({name:'Cautious',reaction:.56,headway:.78,standstillGap:150*SCALE,
      acceleration:85*SCALE,braking:290*SCALE,emergencyBraking:530*SCALE,jerk:900*SCALE}),
    Object.freeze({name:'Steady',reaction:.43,headway:.64,standstillGap:130*SCALE,
      acceleration:105*SCALE,braking:330*SCALE,emergencyBraking:590*SCALE,jerk:1100*SCALE}),
    Object.freeze({name:'Brisk',reaction:.32,headway:.50,standstillGap:110*SCALE,
      acceleration:125*SCALE,braking:370*SCALE,emergencyBraking:650*SCALE,jerk:1350*SCALE})
  ]);
  function config(overrides={}){
    const out={...DEFAULT_CONFIG};
    if(overrides&&typeof overrides==='object')for(const [k,v] of Object.entries(overrides)){
      if(Object.hasOwn(out,k)&&typeof v===typeof out[k])out[k]=v;
    }
    out.fixedStep=clamp(out.fixedStep,1/1000,1/30);out.maxTracked=Math.max(1,Math.floor(out.maxTracked));
    out.seedPerLane=Math.max(0,Math.floor(out.seedPerLane));return out;
  }
  function driverFor(seed,serial){
    let h=Math.imul(((seed>>>0)^Math.imul(serial,0x9e3779b1))>>>0,0x85ebca6b)>>>0;h=(h^(h>>>13))>>>0;
    const style=DRIVER_STYLES[(serial-1+(seed>>>0)%DRIVER_STYLES.length)%DRIVER_STYLES.length];
    const variation=.94+((h>>>8)&255)/255*.12;
    return Object.freeze({...style,reaction:style.reaction*variation,headway:style.headway*variation,
      standstillGap:style.standstillGap*variation,acceleration:style.acceleration*variation,
      braking:style.braking*variation,emergencyBraking:style.emergencyBraking*variation,
      phase:((h>>>16)&255)/255*.10});
  }
  /* Delayed-observation policy. A front hazard always wins. Rear pressure is
     vehicle-only so a pedestrian behind a car never makes it accelerate. */
  function decideTraffic(car,observation,cfg=DEFAULT_CONFIG){
    const d=car.driver,v=car.speed,cruise=car.cruiseSpeed;
    let target=cruise,state='cruising',responseTo=null,emergency=false;
    const ahead=observation?.ahead,behind=observation?.behind;let frontLimit=Infinity;
    const desired=d.standstillGap+v*d.headway;
    if(ahead){
      const closing=v-ahead.speed;
      frontLimit=Math.max(0,ahead.speed+(ahead.gap-desired)/1.65-Math.max(0,closing)*.12);
      const ttc=closing>.05?ahead.gap/closing:Infinity;
      emergency=ahead.gap<d.standstillGap*.45||ttc<.95;
      if(emergency)frontLimit=Math.min(frontLimit,Math.max(0,ahead.speed-65*SCALE));
      if(frontLimit<target){target=frontLimit;responseTo=ahead.id;state=target<v-.16?(emergency?'braking':'easing'):'following';}
    }
    if(behind&&behind.kind==='vehicle'&&!emergency){
      const closing=behind.speed-v;
      const pressureGap=d.standstillGap+Math.max(v,behind.speed)*d.headway*.72+Math.max(0,closing)*(.9+d.reaction);
      const clearAhead=!ahead||ahead.gap>desired+cfg.frontBoostClearance+Math.max(0,v-ahead.speed)*1.5;
      if(clearAhead&&behind.gap<pressureGap&&(closing>.24||behind.gap<d.standstillGap*.8)){
        const urgency=clamp((pressureGap-behind.gap)/Math.max(.01,pressureGap*.65),0,1);
        const boost=Math.min(cfg.rearBoostCap,cruise*cfg.rearBoostFraction)*(.35+.65*urgency);
        const wanted=Math.min(cruise+boost,frontLimit);
        if(wanted>cruise+.04){target=wanted;state='opening-gap';responseTo=behind.id;}
      }
    }
    if(state==='cruising'&&Math.abs(v-cruise)>.20)state='returning';
    return {targetSpeed:clamp(target,0,cruise+Math.min(cfg.rearBoostCap,cruise*cfg.rearBoostFraction)),state,responseTo,emergency};
  }
  function observe(car,neighbors,cfg=DEFAULT_CONFIG){
    let ahead=null,behind=null;
    for(const other of neighbors){
      if(other.id===car.id||other.laneId!==car.laneId)continue;
      const ds=other.s-car.s,gap=Math.abs(ds)-(car.halfLength??cfg.vehicleHalfLength)-(other.halfLength??cfg.vehicleHalfLength);
      const sight={id:other.id,kind:other.kind||'vehicle',speed:Math.max(0,other.speed||0),gap};
      if(ds>=0&&gap<cfg.forwardRange&&(!ahead||gap<ahead.gap))ahead=sight;
      if(ds<0&&gap<cfg.rearRange&&(!behind||gap<behind.gap))behind=sight;
    }
    return {ahead,behind};
  }
  function advanceDriver(car,decision,dt,roadLimit=Infinity){
    car.targetSpeed=Math.min(decision.targetSpeed,roadLimit);car.aiState=decision.state;
    car.responseTo=decision.responseTo;car.emergency=decision.emergency;
    if(roadLimit<decision.targetSpeed-.05){car.aiState='road-limit';car.responseTo='ROAD';}
    const d=car.driver,oldSpeed=car.speed,brake=car.emergency?d.emergencyBraking:d.braking;
    const requested=clamp((car.targetSpeed-car.speed)*1.7,-brake,d.acceleration);
    car.acceleration+=clamp(requested-car.acceleration,-d.jerk*dt,d.jerk*dt);
    car.acceleration=clamp(car.acceleration,-d.emergencyBraking,d.acceleration);
    car.speed=Math.max(0,car.speed+car.acceleration*dt);if(car.speed===0&&car.acceleration<0)car.acceleration=0;
    car.braking=car.acceleration<-.36;return {oldSpeed,newSpeed:car.speed,travel:(oldSpeed+car.speed)*.5*dt};
  }
  function resolveContacts(cars,cfg=DEFAULT_CONFIG,activeContacts=new Set()){
    const active=new Set(),events=[];const lanes=new Map();
    for(const c of cars){if(c.state!=='drive')continue;const a=lanes.get(c.laneId)||[];a.push(c);lanes.set(c.laneId,a);}
    for(const laneCars of lanes.values()){
      laneCars.sort((a,b)=>b.s-a.s||a.id.localeCompare(b.id));
      for(let pass=0;pass<3;pass++)for(let i=1;i<laneCars.length;i++){
        const lead=laneCars[i-1],rear=laneCars[i],gap=lead.s-rear.s-(lead.halfLength??cfg.vehicleHalfLength)-(rear.halfLength??cfg.vehicleHalfLength);
        if(gap>cfg.contactEpsilon)continue;const key=lead.id+'/'+rear.id;active.add(key);
        if(!activeContacts.has(key)&&!events.some(e=>e.key===key))events.push({key,lead:lead.id,rear:rear.id,gap});
        if(gap<0){const correction=-gap*.5+1e-6;lead.s+=correction;rear.s-=correction;}
        if(rear.speed>lead.speed){const common=(rear.speed+lead.speed)*.5,split=(rear.speed-lead.speed)*.025;lead.speed=common+split;rear.speed=Math.max(0,common-split);lead.acceleration=rear.acceleration=0;}
      }
    }
    return {active,events};
  }
  return Object.freeze({SCALE,DEFAULT_CONFIG,DRIVER_STYLES,config,driverFor,decideTraffic,observe,advanceDriver,resolveContacts,clamp});
});
