/* Room Creator 0.16 — canonical vehicle classes (First Encounter unified vehicle schema §12–§14, §60–§61, §84).
   Physical / capacity truth for every vehicle in the Vehicle World runtime. Traffic catalogue entries reference a class
   by id and never copy these values.
   - occupantCapacity: owner-confirmed table (schema §12 / §108); the driver occupies one of these places (§13.1).
   - geometry: PROVISIONAL. Sedan and coupe are measured from library v2 models; the rest are typical real-world sizes.
     Replace when the real vehicle art arrives (§60, §65.3) — sizes are stored here, never read live from art.
   - handling profiles: realistic limits used only when vehicleLoop.config.handling === "scaled" (default "legacy"
     keeps route-traffic.js driver values unchanged).
   - seatPoses: optional ROOM-authored vehicle-local occupant anchors; V2.5.1 requires one for mobile-interior drivers.
   Pure data + helpers: no DOM, no randomness. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCVehicleClasses=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA='rc-vehicle-classes@0.1';
  const deep=v=>JSON.parse(JSON.stringify(v));
  const freeze=o=>{if(o&&typeof o==='object'){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;};

  function slots(compartments){
    const out=[];
    for(const c of compartments){
      for(let i=1;i<=c.capacity;i++){
        const first=!out.length;
        out.push({id:first?'driver':`${c.id}_${i}`,compartment:c.id,role:first?'driver':'passenger'});
      }
    }
    return out;
  }
  const car4=[{id:'driver',compartment:'cabin',role:'driver'},{id:'front_passenger',compartment:'cabin',role:'passenger'},
    {id:'rear_left',compartment:'cabin',role:'passenger'},{id:'rear_right',compartment:'cabin',role:'passenger'}];
  const car2=[{id:'driver',compartment:'cabin',role:'driver'},{id:'passenger',compartment:'cabin',role:'passenger'}];
  const cab2=[{id:'driver',compartment:'cab',role:'driver'},{id:'passenger',compartment:'cab',role:'passenger'}];
  const light={curbParking:true,turns:true,mainStreetOnly:false};
  const heavy={curbParking:false,turns:false,mainStreetOnly:true};
  function cls(id,label,cap,compartments,slotList,geometry,handlingProfileId,routeRestrictions,defaultAsset=null,accessPoints=null,legibility=null,seatPoses=null){
    return {id,label,occupantCapacity:cap,compartments,slots:slotList||slots(compartments),accessPoints:accessPoints?deep(accessPoints):[],seatPoses:seatPoses?deep(seatPoses):[],
      geometry:{...geometry,provisional:true},handlingProfileId,routeRestrictions:{...routeRestrictions},visual:{defaultAsset,legibility:legibility?deep(legibility):null}};
  }
  // V2.4.1: interaction legibility stays vehicle-owned. A door is a forgiving physical interaction ZONE, not a
  // pixel-perfect point. Coordinates use the same local convention as prop Use Points (x = lateral, z = forward).
  // interactionRadius is the actual usable distance; highlightRadius is presentation-only advance notice. The bay still
  // decides only whether access is physically legal at the current parked state.
  // V2.5.1: occupant poses are vehicle-owned physical anchors, separate from exterior access points.
  // Coordinates use the same local convention: positive x = vehicle-left, positive z = forward, y = vertical anchor.
  const sedanSeatPoses=[
    {seatId:'driver',role:'driver',x:.55,y:.68,z:.65,yaw:0},
    {seatId:'front_passenger',role:'passenger',x:-.55,y:.68,z:.65,yaw:0},
    {seatId:'rear_left',role:'passenger',x:.55,y:.68,z:-.75,yaw:0},
    {seatId:'rear_right',role:'passenger',x:-.55,y:.68,z:-.75,yaw:0}
  ];
  const sedanAccess=[
    {id:'access_driver',seatId:'driver',type:'driver',name:'Driver door',cueLabel:'DRIVER',side:'left',end:'front',x:1.30,y:0,z:.40,yaw:90,interactionRadius:1.40,highlightRadius:3.20,marker:'door'},
    {id:'access_front_passenger',seatId:'front_passenger',type:'front_passenger',name:'Front passenger door',cueLabel:'FRONT PASSENGER',side:'right',end:'front',x:-1.30,y:0,z:.40,yaw:270,interactionRadius:1.40,highlightRadius:3.20,marker:'door'},
    {id:'access_rear_left',seatId:'rear_left',type:'rear_left',name:'Rear left door',cueLabel:'REAR LEFT',side:'left',end:'rear',x:1.30,y:0,z:-1.00,yaw:90,interactionRadius:1.40,highlightRadius:3.20,marker:'door'},
    {id:'access_rear_right',seatId:'rear_right',type:'rear_right',name:'Rear right door',cueLabel:'REAR RIGHT',side:'right',end:'rear',x:-1.30,y:0,z:-1.00,yaw:270,interactionRadius:1.40,highlightRadius:3.20,marker:'door'}
  ];
  const sedanLegibility={profile:'sedan',forwardAxis:'local_z',front:{label:'FRONT',marker:'chevron',offset:.55},rear:{label:'REAR',marker:'bar',offset:.40},doorMarker:'door-tab'};
  // V2.5 mobile social space: the bus has one NPC driver slot, a passenger cabin, one public door on its right
  // side, and an authored local interior network. The door is a portal into the moving interior rather than a
  // direct seat-selection point. Vehicle World owns its open/closed state; ENCOUNTER owns who the driver/passengers are.
  const busCompartments=[{id:'unspecified',kind:'unspecified',capacity:20}];
  const busSlots=[{id:'driver',compartment:'unspecified',role:'driver'},...Array.from({length:19},(_,i)=>({id:`passenger_${i+1}`,compartment:'unspecified',role:'passenger'}))];
  const busAccess=[{id:'access_passenger_door',seatId:'passenger_1',type:'passenger_door',name:'Passenger door',cueLabel:'PASSENGER DOOR',side:'right',end:'front',x:-1.55,y:0,z:3.60,yaw:270,interactionRadius:1.65,highlightRadius:4.20,marker:'door',accessKind:'interior_portal',interiorNodeId:'door_inside'}];
  const busSeatPoses=[{seatId:'driver',role:'driver',compartment:'unspecified',x:.72,y:1.05,z:4.72,yaw:0,label:'BUS DRIVER'}];
  const busLegibility={profile:'bus',forwardAxis:'local_z',front:{label:'FRONT',marker:'chevron',offset:.80},rear:{label:'REAR',marker:'bar',offset:.65},doorMarker:'door'};
  const busInterior={schema:'rc-mobile-interior@0.1',label:'Bus passenger interior',bounds:{x0:-1.02,x1:1.02,z0:-4.85,z1:4.35},walkSpeed:1.55,entry:{nodeId:'door_inside',x:-.82,z:3.55,heading:90},
    nodes:[{id:'door_inside',name:'Passenger doorway',x:-.82,z:3.55,kind:'door'},{id:'vestibule',name:'Front vestibule',x:0,z:3.10,kind:'standing'},{id:'aisle_front',name:'Front aisle',x:0,z:1.80,kind:'aisle'},{id:'aisle_mid',name:'Middle aisle',x:0,z:0,kind:'aisle'},{id:'aisle_rear',name:'Rear aisle',x:0,z:-2.35,kind:'aisle'},{id:'rear_standing',name:'Rear standing area',x:0,z:-4.05,kind:'standing'}],
    edges:[{id:'int_door_vestibule',a:'door_inside',b:'vestibule',band:.48},{id:'int_front',a:'vestibule',b:'aisle_front',band:.78},{id:'int_mid',a:'aisle_front',b:'aisle_mid',band:.82},{id:'int_rear',a:'aisle_mid',b:'aisle_rear',band:.82},{id:'int_rear_stand',a:'aisle_rear',b:'rear_standing',band:.92}],
    positions:[{id:'stand_front',kind:'standing',x:.55,z:2.65},{id:'stand_mid',kind:'standing',x:-.55,z:.35},{id:'stand_rear',kind:'standing',x:.55,z:-3.25},{id:'seat_front_left',kind:'seat',x:.78,z:1.35},{id:'seat_front_right',kind:'seat',x:-.78,z:1.35},{id:'seat_mid_left',kind:'seat',x:.78,z:-.55},{id:'seat_mid_right',kind:'seat',x:-.78,z:-.55},{id:'seat_rear',kind:'seat',x:0,z:-4.35}]};
  const DEFAULT_CLASSES=freeze({
    sedan:cls('sedan','Sedan',4,[{id:'cabin',kind:'passenger_cabin',capacity:4}],car4,
      {length:4.61,width:1.67,turnRadius:5.0,source:'library:car_kent_ford_crown_victoria'},'handling_car',light,'car_kent_ford_crown_victoria',sedanAccess,sedanLegibility,sedanSeatPoses),
    truck_suv:cls('truck_suv','Truck / SUV',4,[{id:'cabin',kind:'passenger_cabin',capacity:4}],car4,
      {length:4.80,width:1.90,turnRadius:5.5,source:'typical'},'handling_car',light),
    coupe:cls('coupe','Coupe',2,[{id:'cabin',kind:'passenger_cabin',capacity:2}],car2,
      {length:3.75,width:1.63,turnRadius:4.8,source:'library:car_kent_duster'},'handling_car',light,'car_kent_duster'),
    pickup:cls('pickup','Pickup',2,[{id:'cab',kind:'cab',capacity:2}],cab2,
      {length:5.70,width:2.00,turnRadius:6.5,source:'typical'},'handling_van',{curbParking:false,turns:true,mainStreetOnly:false}),
    bus:{...cls('bus','Bus',20,busCompartments,busSlots,
      {length:12.0,width:2.55,turnRadius:10.5,source:'typical'},'handling_heavy',{curbParking:false,turns:true,mainStreetOnly:true},null,busAccess,busLegibility,busSeatPoses),mobileInterior:deep(busInterior)},
    commercial_box_truck:cls('commercial_box_truck','Commercial / box truck',8,
      [{id:'cab',kind:'cab',capacity:2},{id:'rear',kind:'rear_compartment',capacity:6}],null,
      {length:7.50,width:2.50,turnRadius:8.0,source:'typical'},'handling_heavy',heavy),
    tractor_truck:cls('tractor_truck','Tractor truck',4,[{id:'cab',kind:'cab',capacity:4}],null,
      {length:6.00,width:2.50,turnRadius:7.0,source:'typical'},'handling_heavy',heavy),
    tractor_trailer:cls('tractor_trailer','Tractor trailer',20,[{id:'unspecified',kind:'unspecified',capacity:20}],null,
      {length:18.0,width:2.60,turnRadius:12.0,source:'typical'},'handling_heavy',heavy),
    police_official_van:cls('police_official_van','Police / official van',6,
      [{id:'cab',kind:'cab',capacity:2},{id:'rear',kind:'rear_compartment',capacity:4}],null,
      {length:5.80,width:2.05,turnRadius:6.5,source:'typical'},'handling_van',heavy)
  });
  /* m/s². Used only by handling "scaled": the Steady base style is scaled to exactly these values, Cautious/Brisk keep
     their ratios to Steady, and route-traffic.js driverFor still varies each driver by ±6 %. */
  const HANDLING=freeze({
    handling_car:{maxAccel:2.5,comfortBrake:3.5,emergencyBrake:8.0},
    handling_van:{maxAccel:2.0,comfortBrake:3.0,emergencyBrake:7.0},
    handling_heavy:{maxAccel:1.2,comfortBrake:2.5,emergencyBrake:6.0}
  });

  /* Scene override: vehicleLoop.classes = {sedan:{geometry:{length:4.7}}, my_class:{...full class...}}. Deep merge. */
  function merge(a,b){
    if(!b||typeof b!=='object'||Array.isArray(b))return deep(b);
    const out=a&&typeof a==='object'&&!Array.isArray(a)?deep(a):{};
    for(const [k,v] of Object.entries(b))out[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(out[k],v):deep(v);
    return out;
  }
  function resolve(overrides){
    const out=deep(DEFAULT_CLASSES);
    if(overrides&&typeof overrides==='object')for(const [id,o] of Object.entries(overrides)){out[id]=merge(out[id],o);if(out[id]&&!out[id].id)out[id].id=id;}
    return out;
  }
  function validate(classes){
    const problems=[];
    for(const [id,c] of Object.entries(classes||{})){
      const at=`class ${id}`;
      if(!c||typeof c!=='object'){problems.push(`${at}: not an object`);continue;}
      if(c.id!==id)problems.push(`${at}: id must be "${id}"`);
      if(!Number.isInteger(c.occupantCapacity)||c.occupantCapacity<1)problems.push(`${at}: occupantCapacity must be a whole number ≥ 1`);
      const comp=Array.isArray(c.compartments)?c.compartments:[];
      if(!comp.length)problems.push(`${at}: needs at least one compartment`);
      const sum=comp.reduce((n,x)=>n+(Number.isInteger(x?.capacity)?x.capacity:NaN),0);
      if(sum!==c.occupantCapacity)problems.push(`${at}: compartments hold ${sum}, occupantCapacity is ${c.occupantCapacity}`);
      const sl=Array.isArray(c.slots)?c.slots:[];
      if(sl.length!==c.occupantCapacity)problems.push(`${at}: ${sl.length} slots for capacity ${c.occupantCapacity}`);
      if(sl.filter(s=>s?.role==='driver').length!==1)problems.push(`${at}: needs exactly one driver slot`);
      if(new Set(sl.map(s=>s?.id)).size!==sl.length)problems.push(`${at}: slot ids must be unique`);
      const aps=Array.isArray(c.accessPoints)?c.accessPoints:[];const seatIds=new Set(sl.map(s=>s?.id)),apIds=new Set();
      for(const ap of aps){if(!ap||typeof ap.id!=='string'||!ap.id)problems.push(`${at}: access point needs an id`);else if(apIds.has(ap.id))problems.push(`${at}: access point id ${ap.id} is used twice`);else apIds.add(ap.id);
        if(typeof ap?.seatId!=='string'||!seatIds.has(ap.seatId))problems.push(`${at}: access point ${ap?.id||'?'} names unknown seat ${ap?.seatId}`);
        for(const k of ['x','y','z','yaw'])if(!Number.isFinite(ap?.[k]))problems.push(`${at}: access point ${ap?.id||'?'} ${k} must be numeric`);
        if(ap?.interactionRadius!==undefined&&!(Number.isFinite(ap.interactionRadius)&&ap.interactionRadius>0))problems.push(`${at}: access point ${ap?.id||'?'} interactionRadius must be positive`);
        if(ap?.highlightRadius!==undefined&&!(Number.isFinite(ap.highlightRadius)&&ap.highlightRadius>=(Number.isFinite(ap.interactionRadius)?ap.interactionRadius:0)))problems.push(`${at}: access point ${ap?.id||'?'} highlightRadius must be at least interactionRadius`);
        if(ap?.side!==undefined&&!['left','right','front','rear'].includes(ap.side))problems.push(`${at}: access point ${ap?.id||'?'} has unknown side ${ap.side}`);
        if(ap?.end!==undefined&&!['front','rear','middle'].includes(ap.end))problems.push(`${at}: access point ${ap?.id||'?'} has unknown end ${ap.end}`);}

      const poses=Array.isArray(c.seatPoses)?c.seatPoses:[],poseIds=new Set();for(const q of poses){const sid=q?.seatId;if(typeof sid!=='string'||!seatIds.has(sid))problems.push(`${at}: seat pose names unknown seat ${sid}`);else if(poseIds.has(sid))problems.push(`${at}: seat pose for ${sid} is used twice`);else poseIds.add(sid);for(const k of ['x','y','z','yaw'])if(!Number.isFinite(q?.[k]))problems.push(`${at}: seat pose ${sid||'?'} ${k} must be numeric`);}
      if(c.mobileInterior!==undefined&&!poses.some(q=>q?.seatId==='driver'))problems.push(`${at}: mobileInterior vehicle needs a published driver seat pose`);
      for(const s of sl)if(!comp.some(x=>x.id===s?.compartment))problems.push(`${at}: slot ${s?.id} names unknown compartment ${s?.compartment}`);
      const g=c.geometry||{};
      for(const k of ['length','width','turnRadius'])if(!(Number.isFinite(g[k])&&g[k]>0))problems.push(`${at}: geometry.${k} must be a positive number`);
      if(!HANDLING[c.handlingProfileId])problems.push(`${at}: unknown handlingProfileId ${c.handlingProfileId}`);
      if(c.mobileInterior!==undefined){const mi=c.mobileInterior,b=mi?.bounds;if(!mi||typeof mi!=='object')problems.push(`${at}: mobileInterior must be an object`);
        else{if(!b||![b.x0,b.x1,b.z0,b.z1].every(Number.isFinite)||!(b.x1>b.x0&&b.z1>b.z0))problems.push(`${at}: mobileInterior.bounds must be a valid local rectangle`);
          const ns=Array.isArray(mi.nodes)?mi.nodes:[],es=Array.isArray(mi.edges)?mi.edges:[],nids=new Set(ns.map(n=>n?.id));if(!ns.length)problems.push(`${at}: mobileInterior needs nodes`);
          for(const n of ns)if(!n?.id||!Number.isFinite(n.x)||!Number.isFinite(n.z))problems.push(`${at}: mobileInterior node needs id, x and z`);
          for(const e of es)if(!e?.id||!nids.has(e.a)||!nids.has(e.b))problems.push(`${at}: mobileInterior edge ${e?.id||'?'} names unknown nodes`);
          if(mi.entry&&!nids.has(mi.entry.nodeId))problems.push(`${at}: mobileInterior entry names unknown node ${mi.entry.nodeId}`);}}
    }
    return problems;
  }
  function get(classes,id){return classes&&Object.prototype.hasOwnProperty.call(classes,id)?classes[id]:null;}
  function footprint(c){return {halfLength:c.geometry.length/2,halfWidth:c.geometry.width/2,provisional:!!c.geometry.provisional};}
  /* Lane fit: the class is no wider than the lane (corridor). Equal counts as fitting (box truck 2.50 m in a 2.50 m lane). */
  function fitsCorridor(c,halfWidth){return c.geometry.width<=2*halfWidth+1e-9;}
  /* "scaled" handling: return a driver whose acceleration/braking values are rescaled to the class profile. */
  function scaleDriver(driver,profileId,steadyBase){
    const p=HANDLING[profileId];if(!p||!steadyBase)return driver;
    return Object.freeze({...driver,
      acceleration:driver.acceleration*p.maxAccel/steadyBase.acceleration,
      braking:driver.braking*p.comfortBrake/steadyBase.braking,
      emergencyBraking:driver.emergencyBraking*p.emergencyBrake/steadyBase.emergencyBraking});
  }
  return Object.freeze({SCHEMA,DEFAULT_CLASSES,HANDLING,resolve,validate,get,footprint,fitsCorridor,scaleDriver});
});
