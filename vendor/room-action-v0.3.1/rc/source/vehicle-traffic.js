/* Room Creator 0.16.1 — Traffic Catalogue, Traffic Flows and the Traffic Control Meter for the Vehicle World
   (routeNet.vehicleTraffic, schema rc-vehicle-traffic@0.1).
   Layers (kept separate on purpose):
     vehicle class (vehicle-classes.js)  = physical / capacity truth
     traffic unit (catalogue entry)      = an operational kind of traffic that REFERENCES a class (never copies it)
     traffic flow                        = how often / in what mixture / from which entry portals units appear
     traffic meter                       = author-facing pressure 0..1 that scales flows only (never driver physics)
   This module only schedules and requests spawns. Vehicle World owns the one physical vehicle list.
   Determinism: every flow has its own random streams seeded from (world seed, hash(flow id), seedOffset);
   no Math.random, no clock. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCVehicleTraffic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='rc-vehicle-traffic@0.1';
  const METER_PRESETS=Object.freeze({empty:0,light:.25,normal:.5,busy:.75,heavy:1});
  const PRESET_ORDER=Object.freeze(['empty','light','normal','busy','heavy','custom']);
  const PRESET_LABELS=Object.freeze({empty:'Empty',light:'Light',normal:'Normal',busy:'Busy',heavy:'Heavy',custom:'Custom'});
  const REJECT=Object.freeze(['unknown_unit','unit_disabled','unknown_class','no_eligible_portal','portal_not_eligible','route_restricted',
    'vehicle_too_wide','spawn_gap_blocked','max_active','not_world_runtime','entry_in_view','flow_max_active']);
  const deep=v=>JSON.parse(JSON.stringify(v));
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const byId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;

  /* FNV-1a 32-bit — stable string hash for per-flow seeds */
  function hashString(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
  /* same generator family as Route Walk's rwMulberry */
  function mulberry(a){a>>>=0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

  const unit=(id,label,classId,role,classifications,tags=[])=>({id,label,classId,enabled:true,role,classifications,tags,capabilities:[],abilities:[],notes:''});
  const DEFAULT_UNITS=Object.freeze([
    unit('unit_civilian_sedan','Civilian Sedan','sedan','civilian_traffic',['civilian','passenger'],['ordinary']),
    unit('unit_civilian_suv','Civilian SUV','truck_suv','civilian_traffic',['civilian','passenger'],['ordinary']),
    unit('unit_civilian_coupe','Civilian Coupe','coupe','civilian_traffic',['civilian','passenger'],['ordinary']),
    unit('unit_civilian_pickup','Civilian Pickup','pickup','civilian_traffic',['civilian'],['ordinary']),
    unit('unit_city_bus','City Bus','bus','transit_service',['transit']),
    unit('unit_commercial_box_truck','Commercial Box Truck','commercial_box_truck','commercial_delivery',['commercial']),
    unit('unit_tractor_truck','Tractor Truck','tractor_truck','commercial_haulage',['commercial']),
    unit('unit_tractor_trailer','Tractor Trailer','tractor_trailer','commercial_haulage',['commercial']),
    unit('unit_police_official_van','Police / Official Van','police_official_van','official_service',['police','government'])
  ].map(Object.freeze));
  const DEMO_MIX=[{unitId:'unit_civilian_sedan',weight:55},{unitId:'unit_civilian_suv',weight:25},{unitId:'unit_civilian_coupe',weight:15},{unitId:'unit_commercial_box_truck',weight:5}];

  function defaultFlow(id,label,portal,family){
    return {id,label,enabled:true,scope:{entryPortals:portal?[portal]:[],laneFamilies:family?[family]:[]},mix:deep(DEMO_MIX),
      spawn:{vehiclesPerMinute:8,jitter:.15,initialCount:2,maxActive:6,blockedRetrySeconds:.8,seedOffset:0},densityMultiplier:1};
  }
  /* A complete default sidecar for a graph: catalogue, one flow per entry portal, optional default signals. */
  function defaultTraffic(graph,{signals=true,signalsApi=null}={}){
    const flows=[];
    for(const pid of graph?.entryPortals||[]){const p=graph.portals.get(pid),fam=p?.laneFamily||null,dir=(graph.elements.get(graph.routeFrom(pid)?.elements?.[0])?.direction)||'';
      const id=fam==='traffic_e'?'flow_main_eastbound':fam==='traffic_w'?'flow_main_westbound':`flow_${pid}`;
      flows.push(defaultFlow(id,fam==='traffic_e'?'Main Street Eastbound':fam==='traffic_w'?'Main Street Westbound':`From ${pid}${dir?' ('+dir+')':''}`,pid,fam));}
    const S=signalsApi||(typeof globalThis!=='undefined'?globalThis.RCVehicleSignals:null)||(typeof require==='function'?(()=>{try{return require('./vehicle-signals.js');}catch(e){return null;}})():null);
    return {schema:SCHEMA,enabled:true,meter:{preset:'normal',value:METER_PRESETS.normal},units:DEFAULT_UNITS.map(deep),flows:flows.sort(byId),
      signals:signals&&S&&graph?S.defaultSignals(graph):[]};
  }

  function meterValue(meter){
    if(!meter||typeof meter!=='object')return METER_PRESETS.normal;
    if(meter.preset&&meter.preset!=='custom'&&Object.prototype.hasOwnProperty.call(METER_PRESETS,meter.preset))return METER_PRESETS[meter.preset];
    return Number.isFinite(meter.value)?clamp(meter.value,0,1):METER_PRESETS.normal;
  }
  /* the preset for a value: an exact preset value wins, anything else is custom */
  function meterFor(value){value=clamp(+value||0,0,1);for(const [k,v] of Object.entries(METER_PRESETS))if(Math.abs(v-value)<1e-9)return {preset:k,value:v};return {preset:'custom',value};}
  function effective(flow,meter){
    const m=typeof meter==='number'?clamp(meter,0,1):meterValue(meter),dm=Number.isFinite(flow?.densityMultiplier)?Math.max(0,flow.densityMultiplier):1,sp=flow?.spawn||{};
    const vpm=Number.isFinite(sp.vehiclesPerMinute)?Math.max(0,sp.vehiclesPerMinute):0;
    return {meter:m,vehiclesPerMinute:vpm*m*dm,initialCount:Math.round((Number.isInteger(sp.initialCount)?sp.initialCount:0)*m*dm),
      maxActive:Math.ceil((Number.isInteger(sp.maxActive)?sp.maxActive:0)*m*dm),jitter:clamp(Number.isFinite(sp.jitter)?sp.jitter:0,0,.95),
      blockedRetrySeconds:Number.isFinite(sp.blockedRetrySeconds)&&sp.blockedRetrySeconds>0?sp.blockedRetrySeconds:.8,seedOffset:Number.isInteger(sp.seedOffset)?sp.seedOffset:0};
  }

  /* Can a unit's class use this entry portal's route? Returns null when fine, else a rejection code. */
  function routeEligibility(cls,graph,portalId){
    const route=graph.routeFrom(portalId);if(!route||!route.parts?.length)return 'portal_not_eligible';
    const rr=cls.routeRestrictions||{};
    if(rr.mainStreetOnly&&!route.allMainStreet)return 'route_restricted';
    if(rr.turns===false&&route.hasTurn)return 'route_restricted';
    if(!(cls.geometry.width<=2*route.minHalfWidth+1e-9))return 'vehicle_too_wide';
    return null;
  }
  /* entry portals a flow may use: explicit portals are strongest; lane families restrict; empty = all entries */
  function scopePortals(flow,graph){
    const sc=flow?.scope||{},fams=Array.isArray(sc.laneFamilies)?sc.laneFamilies:[],ports=Array.isArray(sc.entryPortals)?sc.entryPortals:[];
    let list=ports.length?ports.filter(p=>graph.entryPortals.includes(p)):[...graph.entryPortals];
    if(fams.length)list=list.filter(p=>fams.includes(graph.portals.get(p)?.laneFamily));
    return [...new Set(list)].sort();
  }

  /* Reference findings. Structure (types, unique ids, timings) is checked in core.validateVehicleTraffic. */
  function validate(vt,{classes,graph,intersectionIds,signalsApi}={}){
    const out=[],units=new Map((vt?.units||[]).map(u=>[u.id,u]));
    const S=signalsApi||(typeof globalThis!=='undefined'?globalThis.RCVehicleSignals:null);
    for(const u of vt?.units||[])if(classes&&!Object.prototype.hasOwnProperty.call(classes,u.classId))out.push({level:'error',code:'unknown_class',path:`units.${u.id}`,message:`Unit "${u.id}" references unknown vehicle class "${u.classId}".`});
    for(const f of vt?.flows||[]){
      for(const m of f.mix||[]){const u=units.get(m.unitId);
        if(!u)out.push({level:'error',code:'unknown_unit',path:`flows.${f.id}.mix`,message:`Flow "${f.id}" mixes unknown unit "${m.unitId}" (left out when spawning).`});
        else if(u.enabled===false)out.push({level:'info',code:'unit_disabled',path:`flows.${f.id}.mix`,message:`Flow "${f.id}" mixes disabled unit "${m.unitId}" (left out while disabled).`});}
      if(graph){for(const p of f.scope?.entryPortals||[])if(!graph.entryPortals.includes(p))out.push({level:'error',code:'unknown_portal',path:`flows.${f.id}.scope`,message:`Flow "${f.id}" names unknown entry portal "${p}".`});
        for(const l of f.scope?.laneFamilies||[])if(!graph.laneFamilies.includes(l))out.push({level:'error',code:'unknown_lane_family',path:`flows.${f.id}.scope`,message:`Flow "${f.id}" names unknown lane family "${l}".`});
        if(classes){const ports=scopePortals(f,graph),usable=(f.mix||[]).filter(m=>{const u=units.get(m.unitId),c=u&&classes[u.classId];return u&&u.enabled!==false&&c&&ports.some(p=>!routeEligibility(c,graph,p));});
          if(!usable.length)out.push({level:'warning',code:'no_eligible_unit',path:`flows.${f.id}`,message:`Flow "${f.id}" has no unit that can use its entry portals — it will spawn nothing.`});
          for(const m of f.mix||[]){const u=units.get(m.unitId),c=u&&classes[u.classId];if(u&&c&&ports.length&&ports.every(p=>routeEligibility(c,graph,p)))out.push({level:'info',code:'unit_not_route_eligible',path:`flows.${f.id}.mix`,message:`"${u.label}" (${c.label}, ${c.geometry.width} m wide) cannot use this flow's routes: ${routeEligibility(c,graph,ports[0])}. It stays in the catalogue but is left out here.`});}}}}
    if(S)out.push(...S.validateRefs(vt?.signals||[],graph,intersectionIds));
    return out;
  }
  function dependents(vt,unitId){return (vt?.flows||[]).filter(f=>(f.mix||[]).some(m=>m.unitId===unitId)).map(f=>f.id).sort();}

  /* ---------------------------------------------------------------- runtime controller (driven by Vehicle World)
     ctx (supplied by the world): graph, classes, seed, fixedStep,
       time()                                -> world seconds
       tryPlace(unitId, classId, portalId, provenance, {rs, speed}) -> {ok, vehicleId} | {ok:false, reason}
       flowActive(flowId)                    -> moving vehicles that came from the flow
       emit(type, data)                      -> append a world event */
  function createController(vt,ctx){
    const units=new Map((vt.units||[]).map(u=>[u.id,deep(u)])),classes=ctx.classes,graph=ctx.graph;
    let meter=meterValue(vt.meter);
    const flows=[...(vt.flows||[])].sort(byId).map(f=>{
      const seed=((ctx.seed>>>0)^hashString(f.id)^Math.imul(effective(f,1).seedOffset|0,0x9e3779b1))>>>0;
      return {def:deep(f),id:f.id,enabled:f.enabled!==false,arrivalRng:mulberry(seed),pickRng:mulberry((seed^0x5bd1e995)>>>0),
        nextSpawnAt:Infinity,pending:null,blockedLogged:false,noUnitLogged:false,spawned:0,blockedCount:0};});
    const flowById=new Map(flows.map(f=>[f.id,f]));
    function eligibleMix(f){ /* built BEFORE any random draw, so invalid picks never consume randomness */
      const ports=scopePortals(f.def,graph),out=[];
      for(const m of f.def.mix||[]){const u=units.get(m.unitId);if(!u||u.enabled===false)continue;const c=classes[u.classId];if(!c)continue;
        const okPorts=ports.filter(p=>!routeEligibility(c,graph,p));if(okPorts.length&&Number.isFinite(m.weight)&&m.weight>0)out.push({unit:u,cls:c,weight:m.weight,ports:okPorts});}
      return out;
    }
    function rate(f){return f.enabled?effective(f.def,meter).vehiclesPerMinute:0;}
    function interval(f,r){const e=effective(f.def,meter),u=f.arrivalRng();return (60/r)*(1+e.jitter*(2*u-1));}
    function draw(f){
      const mix=eligibleMix(f);if(!mix.length)return null;
      const total=mix.reduce((n,m)=>n+m.weight,0);let x=f.pickRng()*total,pick=mix[mix.length-1];
      for(const m of mix){if(x<m.weight){pick=m;break;}x-=m.weight;}
      const port=pick.ports[Math.min(pick.ports.length-1,Math.floor(f.pickRng()*pick.ports.length))];
      return {unitId:pick.unit.id,classId:pick.cls.id,portalId:port};
    }
    function schedule(f,from){const r=rate(f);f.nextSpawnAt=r>0?from+interval(f,r):Infinity;}
    /* world initialisation: startup population replaces generic seeding */
    function init(populate=true){
      for(const f of flows){
        const e=effective(f.def,meter);
        if(populate&&f.enabled&&e.initialCount>0){
          const picks=[];for(let k=0;k<e.initialCount;k++){const d=draw(f);if(d)picks.push(d);}
          const byPortal=new Map();for(const p of picks){if(!byPortal.has(p.portalId))byPortal.set(p.portalId,[]);byPortal.get(p.portalId).push(p);}
          for(const [pid,list] of [...byPortal.entries()].sort((a,b)=>a[0]<b[0]?-1:1)){const route=graph.routeFrom(pid);
            list.forEach((p,i)=>{const rs=route.total*(i+1)/(list.length+1),res=ctx.tryPlace(p.unitId,p.classId,pid,{unitId:p.unitId,flowId:f.id},{rs,initial:true});
              if(res.ok){f.spawned++;ctx.emit('traffic_flow_spawned',{vehicleId:res.vehicleId,unitId:p.unitId,flowId:f.id,portalId:pid,initial:true});}
              else ctx.emit('traffic_flow_blocked',{flowId:f.id,unitId:p.unitId,portalId:pid,reason:res.reason,initial:true});});}
        }
        schedule(f,ctx.time());
      }
    }
    function step(){
      const now=ctx.time();
      for(const f of flows){
        if(!f.enabled||!(now+1e-9>=f.nextSpawnAt))continue;
        if(!f.pending){f.pending=draw(f);f.blockedLogged=false;
          if(!f.pending){if(!f.noUnitLogged){ctx.emit('traffic_flow_blocked',{flowId:f.id,reason:'no_eligible_unit'});f.noUnitLogged=true;}schedule(f,now);continue;}}
        const e=effective(f.def,meter);let reason=null;
        if(ctx.flowActive(f.id)>=e.maxActive)reason='flow_max_active';
        let res=null;if(!reason){res=ctx.tryPlace(f.pending.unitId,f.pending.classId,f.pending.portalId,{unitId:f.pending.unitId,flowId:f.id},{});if(!res.ok)reason=res.reason;}
        if(reason){f.blockedCount++;if(!f.blockedLogged){ctx.emit('traffic_flow_blocked',{flowId:f.id,unitId:f.pending.unitId,portalId:f.pending.portalId,reason});f.blockedLogged=true;}
          f.nextSpawnAt=now+e.blockedRetrySeconds;continue;}
        f.spawned++;ctx.emit('traffic_flow_spawned',{vehicleId:res.vehicleId,unitId:f.pending.unitId,flowId:f.id,portalId:f.pending.portalId});
        f.pending=null;schedule(f,Math.max(now,f.nextSpawnAt));
      }
    }
    function rescale(oldRates){ /* meter / enable changes keep the remaining wait proportional; a flow coming back from 0 draws a fresh interval */
      const now=ctx.time();
      flows.forEach((f,i)=>{const o=oldRates[i],n=rate(f);
        if(n<=0){f.nextSpawnAt=Infinity;f.pending=null;}
        else if(!(o>0)||!Number.isFinite(f.nextSpawnAt))schedule(f,now);
        else{const left=Math.max(0,f.nextSpawnAt-now);f.nextSpawnAt=now+left*o/n;}});
    }
    function setMeter(value){const old=flows.map(rate),before=meter;meter=clamp(+value,0,1);rescale(old);return {before,after:meter};}
    function setFlowEnabled(flowId,on){const f=flowById.get(flowId);if(!f)return false;const old=flows.map(rate);f.enabled=!!on;rescale(old);return true;}
    function state(){
      return {meter,meterPreset:meterFor(meter).preset,flows:flows.map(f=>{const e=effective(f.def,meter);return {flowId:f.id,label:f.def.label,enabled:f.enabled,
        active:ctx.flowActive(f.id),maxActive:e.maxActive,effectiveVehiclesPerMinute:+(f.enabled?e.vehiclesPerMinute:0).toFixed(3),
        nextSpawnAt:Number.isFinite(f.nextSpawnAt)?+f.nextSpawnAt.toFixed(4):null,pending:f.pending?{unitId:f.pending.unitId,portalId:f.pending.portalId}:null,
        spawned:f.spawned,blockedRetries:f.blockedCount};}),
        aggregateVehiclesPerMinute:+flows.reduce((n,f)=>n+(f.enabled?effective(f.def,meter).vehiclesPerMinute:0),0).toFixed(3)};
    }
    return {init,step,setMeter,setFlowEnabled,state,units,hasFlow:id=>flowById.has(id),get meter(){return meter;}};
  }

  return Object.freeze({SCHEMA,METER_PRESETS,PRESET_ORDER,PRESET_LABELS,REJECT,DEFAULT_UNITS,DEMO_MIX,defaultFlow,defaultTraffic,meterValue,meterFor,effective,
    routeEligibility,scopePortals,validate,dependents,createController,hashString,mulberry});
});
