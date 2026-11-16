/* First Encounter / Room Creator 0.15.2 — Block Composer v0.5 (layout revision 2: stairs, shops and walkways never collide;
   0.15.2: first texture pass — chunky CC0 textures on road, sidewalks, shop walls, park and the lower level)
   Pure block recipe -> ordinary Room Creator format-11 bundle.
   Main street runs east-west. Optional river or lower pedestrian tunnel runs
   north-south, one pedestrian level below the street, beneath the street bridge. */
(function(root,factory){
  const tex=root&&root.RCBlockTextures?root.RCBlockTextures:(typeof require==='function'?(()=>{try{return require('./block-textures.js');}catch(e){return null;}})():null);
  const api=factory(root&&root.RCCore ? root.RCCore : (typeof require==='function'?require('./core.js'):null),tex);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCBlocks=api;
})(typeof window!=='undefined'?window:null,function(C,TEX){
  'use strict';
  if(!C)throw Error('Room Creator core is required.');

  const W=26,D=60,INTERSECTION_W=10,WATER=0,LOWER=1,STREET=2;
  const ELEV={water:-4.2,lower:-3.4,street:0};
  const ROAD={nearParking:{y0:18,y1:20,center:19,width:2},eastDrive:{y0:20,y1:22.5,center:21.25,width:2.5},westDrive:{y0:22.5,y1:25,center:23.75,width:2.5},farParking:{y0:25,y1:27,center:26,width:2}};
  const STREET_Y={nearWalk:15.5,nearEast:14.5,nearWest:16.5,roadEast:ROAD.eastDrive.center,roadWest:ROAD.westDrive.center,farEast:29.4,farWest:31.0};
  const PARKING={schema:'rc-route-parking@0.1',spaceCenters:[4.5,13,21.5],vehicleLength:4.8,buffer:1.1,envelopeLength:7,laneWidth:2,nearHeading:90,farHeading:270};
  const CROSS_X={left:5.2,center:13,right:20.8};
  /* 0.15.1 layout rules.
     SHOP: shop fronts sit flush on the near sidewalk edge (y 12.5). Before, shops ended at y 12.0 and the sidewalk
     began at 12.5, leaving a strip with no floor in front of every door.
     STAIR: the two flights from the street down to a river or tunnel. The near flight rises south into the near
     sidewalk edge; the far flight rises north and opens onto the far sidewalk just clear of its walking lanes.
     River flights stand beside the riverwalk (not on it), tunnel flights against a tunnel wall, so neither blocks the
     lower walkway or its NPC lanes.
     FOOT: how far each element reaches east and west of its bay centre (metres, at full size).
     LAYOUT: if a stair would land in a shop, alley or far-side feature, the stair takes the other allowed spot; if both
     are taken, the elements on that side slide along the block (keeping their order) and, only when they still do not
     fit, narrow a little (shops to 80 %, far-side features to 85 %). */
  const SHOP={front:12.5,depth:9.4,width:6.7};
  const STAIR={width:1.2,run:4.4,nearY:8.1,farY:31.8,keep:.3};
  const FOOT={bar:[-3.35,3.35],store:[-3.35,3.35],office_lobby:[-3.35,3.35],civic_lobby:[-3.35,3.35],restaurant:[-3.35,3.35],alley:[-3.2,3.2],
    bus_stop:[-3.5,2.9],park:[-3.2,3.2],car_park:[-3.5,3.5],subway_stairs:[-2.8,2.5]};
  const LAYOUT={revision:2,gap:.4,left:.3,right:26-.3,minScale:{near:.8,far:.85},scales:[1,.95,.9,.85,.8]};
  const VERSION='feg-block-composer@0.5';
  const deep=v=>JSON.parse(JSON.stringify(v));
  const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const sid=(b,id)=>`${b.id}__${id}`;

  const BOUNDS={
    'lp_furniture_chairs_mesh_chair_wood_01':{min:[-0.1869,0,-0.2033],max:[0.1869,1.0724,0.2033]},
    'lp_furniture_chairs_mesh_chair_single_05':{min:[-0.25,0,-0.2298],max:[0.25,0.7263,0.2298]},
    'lp_furniture_chairs_mesh_chair_stool_01':{min:[-0.2831,0,-0.2755],max:[0.2831,0.3409,0.2755]},
    'lp_furniture_tables_mesh_table_wood_01':{min:[-0.4089,0,-0.4038],max:[0.4089,0.7562,0.4038]},
    'lp_furniture_tables_mesh_table_rectangle_01':{min:[-0.4,0,-0.75],max:[0.4,0.77,0.75]},
    'lp_technology_props_misc_tech_props_mesh_checkout_till_02':{min:[-0.1645,0,-0.2327],max:[0.1645,0.4388,0.2327]},
    'lp_technology_props_misc_tech_props_mesh_cardreader_01':{min:[-0.1062,0,-0.0555],max:[0.1062,0.0366,0.0555]},
    'lp_technology_props_audio_equipment_mesh_radio_02':{min:[-0.0617,0,-0.2552],max:[0.0617,0.3584,0.2552]},
    'lp_technology_props_monitors_mesh_monitor_02':{min:[-0.3155,0,-0.2997],max:[0.3155,0.5629,0.2997]},
    'lp_misc_props_mesh_paperstack_01':{min:[-0.1562,0,-0.1186],max:[0.1562,0.1388,0.1186]},
    'lp_furniture_shelves_shelf_05_mesh_shelf_05':{min:[-0.5556,0,-1.6844],max:[0.5556,2,1.6844]},
    'lp_furniture_shelves_shelf_04_mesh_shelf_04a':{min:[-0.3596,0,-0.7431],max:[0.3596,1.8,0.7431]},
    'lp_furniture_shelves_shelf_03_mesh_shelf_03_tall':{min:[-0.3273,0,-0.3291],max:[0.3273,1.9737,0.3291]},
    'lp_furniture_storage_crates_mesh_storagecrate_010':{min:[-0.2668,0,-0.3008],max:[0.2668,0.5141,0.3008]},
    'lp_dumpster_bins_mesh_dumpster_closed':{min:[-0.5988,0,-0.8992],max:[0.5988,1.4926,0.8992]},
    'lp_dumpster_bins_mesh_wheelie_bin_closed':{min:[-0.4685,0,-0.365],max:[0.4685,1.2762,0.365]},
    'car_kent_ford_crown_victoria':{min:[-0.8353,0,-2.3033],max:[0.8353,1.4153,2.3033]},
    'car_lp2_van':{min:[-1.0164,0,-2.6],max:[1.0164,2.0055,2.6]},
    'car_kent_food_truck':{min:[-1.4147,0,-2.1362],max:[1.4147,3.0409,2.1362]}
  };
  const ASSET={chair:'lp_furniture_chairs_mesh_chair_wood_01',officeChair:'lp_furniture_chairs_mesh_chair_single_05',stool:'lp_furniture_chairs_mesh_chair_stool_01',table:'lp_furniture_tables_mesh_table_wood_01',desk:'lp_furniture_tables_mesh_table_rectangle_01',register:'lp_technology_props_misc_tech_props_mesh_checkout_till_02',card:'lp_technology_props_misc_tech_props_mesh_cardreader_01',radio:'lp_technology_props_audio_equipment_mesh_radio_02',monitor:'lp_technology_props_monitors_mesh_monitor_02',papers:'lp_misc_props_mesh_paperstack_01',shelfLong:'lp_furniture_shelves_shelf_05_mesh_shelf_05',shelfMid:'lp_furniture_shelves_shelf_04_mesh_shelf_04a',shelfTall:'lp_furniture_shelves_shelf_03_mesh_shelf_03_tall',crate:'lp_furniture_storage_crates_mesh_storagecrate_010',dumpster:'lp_dumpster_bins_mesh_dumpster_closed',wheelie:'lp_dumpster_bins_mesh_wheelie_bin_closed',car:'car_kent_ford_crown_victoria',van:'car_lp2_van',foodTruck:'car_kent_food_truck'};
  const SETUPS={
    [ASSET.chair]:{frontTurn:180,note:'verified Room Creator asset-demo orientation'},
    [ASSET.officeChair]:{frontTurn:180,note:'verified Room Creator asset-demo orientation'},
    [ASSET.monitor]:{frontTurn:90,note:'verified Room Creator asset-demo orientation'},
    [ASSET.dumpster]:{frontTurn:90,note:'verified Room Creator asset-demo orientation'},
    [ASSET.car]:{note:'verified Room Creator asset-demo orientation'}
  };

  const ELEMENTS={
    bar:{label:'Bar',side:'near',kind:'business',roles:['Bartender','Patron'],keywords:['bar','drink','money']},
    bus_stop:{label:'Bus stop',side:'far',kind:'transit',roles:['Commuter','Bus Driver'],keywords:['bus_stop','transit']},
    store:{label:'Store',side:'near',kind:'business',roles:['Shop Owner','Employee','Customer'],keywords:['store','money','food']},
    park:{label:'Park',side:'far',kind:'public_space',roles:['Resident','Visitor','Homeless Resident'],keywords:['park','help']},
    alley:{label:'Alley',side:'near',kind:'service_space',roles:['Courier','Loiterer'],keywords:['alley','delivery']},
    office_lobby:{label:'Office lobby',side:'near',kind:'controlled_access',roles:['Receptionist','Office Worker','Security Guard'],keywords:['office','access']},
    subway_stairs:{label:'Subway stairs',side:'far',kind:'transit',roles:['Commuter','Transit Worker'],keywords:['subway','transit']},
    civic_lobby:{label:'Civic lobby',side:'near',kind:'institution',roles:['Civic Clerk','Security Guard','Visitor'],keywords:['civic_office','appointment','ID']},
    car_park:{label:'Car park',side:'far',kind:'vehicle_space',roles:['Driver','Delivery Driver'],keywords:['car','parking']},
    restaurant:{label:'Restaurant',side:'near',kind:'business',roles:['Server','Cook','Customer'],keywords:['restaurant','food','money']}
  };
  const PRESETS={
    bar_bus_stop:{label:'Bar + Bus stop',elements:['bar','bus_stop'],lower:'river',crossing:'center'},
    store_park:{label:'Store + Park',elements:['store','park'],lower:'river',crossing:'right'},
    alley_office:{label:'Alley + Office lobby',elements:['alley','office_lobby'],lower:'tunnel',crossing:'left'},
    subway_civic:{label:'Subway stairs + Civic lobby',elements:['subway_stairs','civic_lobby'],lower:'tunnel',crossing:'center'},
    carpark_restaurant:{label:'Car park + Restaurant',elements:['car_park','restaurant'],lower:'river',crossing:'left'},
    triple_shop:{label:'Store + Park + Bus stop',elements:['store','park','bus_stop'],lower:'river',crossing:'center'}
  };

  const DEFAULT_VEHICLE_LOOP={schema:'rc-route-vehicle-loop@0.1',enabled:true,source:{prototype:'Trapstar Vehicle Loop v0.4',adaptation:'Block Composer street traffic'},config:{fixedStep:1/240,maxTracked:12,seedPerLane:2,initialDelay:2.8,spawnIntervalMin:3.3,spawnIntervalMax:4.7},rules:{identity:'stable for a tracked vehicle lifetime',perception:'nearest physical same-lane hazard with delayed samples',reactions:['cruising','easing','braking','following','opening-gap','returning','road-limit','contact'],laneChanges:false,parkingManeuvers:'authored parking-space pull-in/pull-out paths are available in routeNet.parking; autonomous parking is not scheduled yet',offscreenSimulation:true,collision:'finite braking; physical contact remains possible'},encounter:{bindingStatus:'descriptor_only',eventHooks:['vehicle_spawn','vehicle_exit','vehicle_braking','vehicle_contact','vehicle_pedestrian_contact']}};

  function normalizeSpec(spec,index=0){
    const src=spec||{},els=[...new Set((src.elements||[]).filter(x=>ELEMENTS[x]))];
    if(els.length<1)throw Error('Choose at least one block element.');
    if(els.length>3)throw Error('A block can contain at most three elements.');
    let lower=['none','river','tunnel'].includes(src.lower)?src.lower:'none';
    if(els.includes('subway_stairs')&&lower==='none')lower='tunnel';
    const crossing=Object.hasOwn(CROSS_X,src.crossing)?src.crossing:'center';
    return {id:src.id||`block_${String(index+1).padStart(2,'0')}`,name:src.name||`Block ${index+1}`,elements:els,lower,crossing,mirror:!!src.mirror};
  }
  function slotCenters(n){return n===1?[13]:n===2?[7,19]:[4.3,13,21.7];}
  const r2=v=>Math.round(v*100)/100;
  // Where a stair flight may stand (local x of its west edge), best first.
  function stairCandidates(lower,cx){
    if(lower==='river')return [{x0:cx+5.2,bank:'east'},{x0:cx-5.2-STAIR.width,bank:'west'}].filter(c=>c.x0>=.2-1e-9&&c.x0+STAIR.width<=W-.2+1e-9).map(c=>({...c,x0:r2(c.x0)}));
    return [{x0:r2(cx+2.5-STAIR.width-.05),bank:'east'},{x0:r2(cx-2.5+.05),bank:'west'}];
  }
  // Pack items (in order) between L and R as close to their bay centres as possible; shrink only if needed.
  function packGroup(items,L,R,minScale){
    if(!items.length)return {x:[],scale:[],cost:0};
    for(const sc of LAYOUT.scales){if(sc<minScale-1e-9)break;const lo=items.map(o=>o.lo*sc),hi=items.map(o=>o.hi*sc);
      if(hi.reduce((a,h,i)=>a+h-lo[i],0)+LAYOUT.gap*(items.length-1)>R-L+1e-9)continue;
      const x=items.map((o,i)=>Math.min(Math.max(o.c,L-lo[i]),R-hi[i]));
      for(let i=1;i<x.length;i++)x[i]=Math.max(x[i],x[i-1]+hi[i-1]+LAYOUT.gap-lo[i]);
      for(let i=x.length-1;i>=0;i--){x[i]=Math.min(x[i],R-hi[i]);if(i<x.length-1)x[i]=Math.min(x[i],x[i+1]+lo[i+1]-LAYOUT.gap-hi[i]);}
      if(x.some((v,i)=>v+lo[i]<L-1e-9))continue;
      return {x,scale:items.map(()=>sc),cost:x.reduce((a,v,i)=>a+Math.abs(v-items[i].c),0)+(1-sc)*40};}
    return null;
  }
  // Keep every item of one side out of the keep-out span K=[a,b]; items may end up on either side of it.
  function packSide(items,K,minScale){
    if(items.every(o=>o.c+o.hi<=K[0]+1e-9||o.c+o.lo>=K[1]-1e-9))return {x:items.map(o=>o.c),scale:items.map(()=>1),cost:0};
    let best=null;
    for(let k=0;k<=items.length;k++){const A=packGroup(items.slice(0,k),LAYOUT.left,K[0],minScale),B=packGroup(items.slice(k),K[1],LAYOUT.right,minScale);
      if(!A||!B)continue;const cost=A.cost+B.cost;if(!best||cost<best.cost-1e-9)best={x:[...A.x,...B.x],scale:[...A.scale,...B.scale],cost};}
    return best;
  }
  // Decide where each element and each stair goes. Pure maths; nothing is built here.
  function planBlock(b){
    const centers=slotCenters(b.elements.length),out={centers:[...centers],scale:centers.map(()=>1),stairs:null,notes:[]};
    if(b.lower==='none')return out;
    const cx=CROSS_X[b.crossing],cands=stairCandidates(b.lower,cx),items=b.elements.map((k,i)=>({k,i,side:ELEMENTS[k].side,c:centers[i],lo:FOOT[k][0],hi:FOOT[k][1]}));
    const solve=(side,prefer)=>{const its=items.filter(o=>o.side===side),order=prefer?[...cands].sort((a,c)=>(a.bank===prefer?0:1)-(c.bank===prefer?0:1)):cands;let best=null;
      for(const cd of order){const res=packSide(its,[cd.x0-STAIR.keep,cd.x0+STAIR.width+STAIR.keep],LAYOUT.minScale[side]);if(res&&(!best||res.cost<best.res.cost-1e-9))best={cd,res,its};}
      if(!best)throw Error(`The ${b.lower} stairs do not fit beside these ${side}-side elements. Choose another crossing position or fewer elements.`);
      best.its.forEach((o,j)=>{out.centers[o.i]=r2(best.res.x[j]);out.scale[o.i]=best.res.scale[j];});return best.cd;};
    const near=solve('near',null),far=solve('far',b.lower==='river'?(near.bank==='east'?'west':'east'):near.bank),kind=b.lower==='river'?'river':'tunnel';
    out.stairs={near:{...near,y:STAIR.nearY,dir:'S'},far:{...far,y:STAIR.farY,dir:'N'}};
    b.elements.forEach((k,i)=>{const label=ELEMENTS[k].label,d=out.centers[i]-centers[i],w=+((FOOT[k][1]-FOOT[k][0])*out.scale[i]).toFixed(1);
      if(Math.abs(d)>.005)out.notes.push(`${b.name}: ${label} moved ${Math.abs(d).toFixed(1)} m ${(d>0)!==!!b.mirror?'east':'west'} to make room for the ${kind} stairs.`);
      if(out.scale[i]<1)out.notes.push(`${b.name}: ${label} narrowed to ${w} m to fit beside the ${kind} stairs.`);});
    return out;
  }
  // Pieces of [a,z] not covered by any of the spans (used to stop a rail where a shop front already closes the edge).
  function uncovered(a,z,spans){let out=[[a,z]];for(const [s0,s1] of spans){const next=[];for(const [u,v] of out){if(s1<=u||s0>=v){next.push([u,v]);continue;}if(s0>u)next.push([u,s0]);if(s1<v)next.push([s1,v]);}out=next;}return out.filter(([u,v])=>v-u>=.35);}
  function worldX(b,lx){return b.mirror?b.x+W-lx:b.x+lx;}
  function worldHeading(b,h){return C.norm(b.mirror?360-h:h);}
  function floor(p,b,story,id,lx,y,w,d,name,color,finish='concrete',tags=[],props={}){
    let x=worldX(b,lx);if(b.mirror)x-=w;
    const f={id:'floor_'+sid(b,id),name:`${b.name} · ${name}`,story,x,y,width:w,length:d,floor:C.surface(color,finish),underside:C.surface('#44484b','concrete'),gameplay:{tags:deep(tags),props:{...deep(props),blockId:b.id}}};
    f.floor.wear=.15;p.floorSections.push(f);return f;
  }
  function room(p,b,id,cx,y,w,d,name,palette='utility'){
    const wx=worldX(b,cx),x=wx-w/2,r=C.makeRoom(`${b.name} · ${name}`,x,y,w,d,STREET);r.id='room_'+sid(b,id);C.applyPalette(r,palette);r.openAbove=false;p.rooms.push(r);return r;
  }
  function frontRoom(p,b,id,cx,name,palette,width=SHOP.width){
    const w=r2(width),r=room(p,b,id,cx,SHOP.front-SHOP.depth,w,SHOP.depth,name,palette),doorWidth=1.35,doorCenter=worldX(b,cx),off=doorCenter-r.x-doorWidth/2;
    const o=C.createOpening(p,r.id,'S',off,'door',{name:`${b.name} · ${name} front door`,width:doorWidth,height:2.3,open:true});o.id='opening_'+sid(b,id+'_door');
    const winOff=b.mirror?(w>=SHOP.width-1e-9?w-2.05:w-1.9):.55;try{const w=C.createOpening(p,r.id,'S',winOff,'window',{name:`${b.name} · ${name} window`,width:1.35,bottom:.9,height:1.25});w.id='opening_'+sid(b,id+'_window');}catch(e){}
    return {room:r,door:o};
  }
  function freeWall(p,b,id,story,a,bp,height=null){const A={x:worldX(b,a[0]),y:a[1]},B={x:worldX(b,bp[0]),y:bp[1]},q=C.createFreeWall(p,story,A,B,{name:`${b.name} · ${id}`,height});q.id='partition_'+sid(b,id)+'_'+story;return q;}
  function pillar(p,b,id,story,lx,y,w=.18,d=.18,h=2.5){const q=C.createPillar(p,story,{x:worldX(b,lx),y},{name:`${b.name} · ${id}`,width:w,depth:d,height:h});q.id='pillar_'+sid(b,id)+'_'+story;return q;}
  function point(type,x=0,z=0,yaw=0,name=''){const q={id:'pending',type,x,y:0,z,yaw,enabled:true};if(name)q.name=name;return q;}
  function prop(p,b,id,asset,lx,y,rotation,name,tags=[],props={},z=0,points=[]){
    const q={id:'prop_'+sid(b,id),asset,name:`${b.name} · ${name}`,x:worldX(b,lx),y,story:STREET,z,rotation:worldHeading(b,rotation),scale:[1,1,1],enabled:true,locked:false,look:null,override:{},collision:{solid:true,shape:'auto'},gameplay:{tags:deep(tags),props:{...deep(props),blockId:b.id,encounterDescriptorOnly:true}},points:deep(points),bounds:deep(BOUNDS[asset]||{min:[-.25,0,-.25],max:[.25,.5,.25]})};
    q.points.forEach((pt,i)=>pt.id='pt_'+sid(b,id)+'_'+pt.type+'_'+(i+1));p.props.push(q);return q;
  }
  function parkedCarProp(p,b,id,lx,y,heading,spaceId){
    const q={id:'prop_'+sid(b,id),asset:ASSET.car,name:`${b.name} · parked car · ${spaceId}`,x:worldX(b,lx),y,story:STREET,z:0,rotation:heading,scale:[1,1,1],enabled:true,locked:false,look:null,override:{},collision:{solid:true,shape:'auto'},gameplay:{tags:['vehicle','parked','cover','parking_space'],props:{blockId:b.id,parkingSpaceId:spaceId,parked:true,encounterDescriptorOnly:true}},points:[point('driver',-1.3,.4,heading===90?90:270,'Driver door')],bounds:deep(BOUNDS[ASSET.car])};
    q.points.forEach((pt,i)=>pt.id='pt_'+sid(b,id)+'_'+pt.type+'_'+(i+1));p.props.push(q);return q;
  }
  function parkingAccessReservations(b,centers){const out=[];b.elements.forEach((key,i)=>{const cx=centers[i];if(key==='alley')out.push({side:'near',cx,reason:'alley_access'});if(key==='bus_stop')out.push({side:'far',cx,reason:'bus_stop_clear'});if(key==='car_park')out.push({side:'far',cx,reason:'car_park_driveway'});});return out;}
  function addStreetParking(p,r,b,centers){
    const reservations=parkingAccessReservations(b,centers),slots=[];
    const sides=[{side:'near',lane:ROAD.nearParking,drive:ROAD.eastDrive,heading:PARKING.nearHeading,traffic:'traffic_e'},{side:'far',lane:ROAD.farParking,drive:ROAD.westDrive,heading:PARKING.farHeading,traffic:'traffic_w'}];
    for(const sd of sides)for(let i=0;i<PARKING.spaceCenters.length;i++){
      const lx=PARKING.spaceCenters[i],spaceId=`parking_${b.id}_${sd.side}_${i+1}`,hit=reservations.find(x=>x.side===sd.side&&Math.abs(x.cx-lx)<=4.2),wx=worldX(b,lx),half=PARKING.vehicleLength/2,buf=PARKING.buffer,envHalf=half+buf;
      if(hit){floor(p,b,STREET,'clear_'+sd.side+'_'+(i+1),lx-envHalf,sd.lane.y0,PARKING.envelopeLength,sd.lane.width,`${sd.side} curb access · ${hit.reason}`,'#4b5053','concrete',['road_lane','parking_lane','no_parking','curb_access'],{side:sd.side,reason:hit.reason});r.parking.clearZones.push({id:spaceId+'_clear',blockId:b.id,side:sd.side,reason:hit.reason,bounds:{x0:wx-envHalf,x1:wx+envHalf,y0:sd.lane.y0,y1:sd.lane.y1}});continue;}
      const frontEast=sd.heading===90,carX0=wx-half,carX1=wx+half,left={x0:wx-envHalf,x1:carX0},right={x0:carX1,x1:wx+envHalf},rear=frontEast?left:right,front=frontEast?right:left;
      floor(p,b,STREET,'space_'+sd.side+'_'+(i+1),lx-envHalf,sd.lane.y0,PARKING.envelopeLength,sd.lane.width,`${sd.side} parallel parking envelope ${i+1}`,'#505558','concrete',['road_lane','parking_lane','parking_space','parking_space_envelope'],{parkingSpaceId:spaceId,side:sd.side,vehicleLength:PARKING.vehicleLength,maneuverBufferEachEnd:PARKING.buffer});
      const dir=sd.heading===90?1:-1,approach={x:wx-dir*3.1,y:sd.drive.center,story:STREET},mergeIn={x:wx-dir*1.35,y:(sd.drive.center+sd.lane.center)/2,story:STREET},park={x:wx,y:sd.lane.center,story:STREET},mergeOut={x:wx+dir*1.35,y:(sd.drive.center+sd.lane.center)/2,story:STREET},depart={x:wx+dir*3.1,y:sd.drive.center,story:STREET};
      const occupied=((b.index+i+(sd.side==='far'?1:0))%2===0),rec={id:spaceId,blockId:b.id,side:sd.side,status:occupied?'occupied':'open',story:STREET,heading:sd.heading,adjacentTrafficLane:sd.traffic,parkingLane:{y0:sd.lane.y0,y1:sd.lane.y1,center:sd.lane.center},vehicleBox:{x0:carX0,x1:carX1,y0:sd.lane.y0,y1:sd.lane.y1},maneuver:{rearBuffer:{...rear,y0:sd.lane.y0,y1:sd.lane.y1},frontBuffer:{...front,y0:sd.lane.y0,y1:sd.lane.y1},pullInPath:[approach,mergeIn,park],pullOutPath:[park,mergeOut,depart],clearanceEachEnd:buf},occupantPropId:null};
      if(occupied){const car=parkedCarProp(p,b,'parked_'+sd.side+'_'+(i+1),lx,sd.lane.center,sd.heading,spaceId);rec.occupantPropId=car.id;}
      r.parking.spaces.push(rec);slots.push(rec);
    }
    return slots;
  }
  function node(r,b,id,name,lx,y,types,facing=0,story=STREET,extra={}){const q={id:'node_'+sid(b,id),name,x:worldX(b,lx),y,story,facing:worldHeading(b,facing),types:deep(types),...deep(extra)};r.nodes.push(q);return q;}
  function zone(r,b,id,name,lx,y,w,d,slots=[],story=STREET){let x=worldX(b,lx);if(b.mirror)x-=w;const q={id:'zone_'+sid(b,id),name,x,y,width:w,length:d,story,slots:slots.map(s=>({x:worldX(b,s.x),y:s.y,facing:worldHeading(b,s.facing||0)}))};r.zones.push(q);return q;}
  function portal(r,b,id,name,kind,lx,y,story=STREET,extra={}){const q={id:'portal_'+sid(b,id),name,kind,x:worldX(b,lx),y,story,...deep(extra)};r.portals.push(q);return q;}

  function addStreetGround(p,b){
    floor(p,b,STREET,'near_sidewalk',0,12.5,W,5.5,'near sidewalk','#8d8d89');
    floor(p,b,STREET,'near_parking_lane',0,ROAD.nearParking.y0,W,ROAD.nearParking.width,'near-side parking lane','#474c4f','concrete',['road_lane','parking_lane'],{lane:'parking_near'});
    floor(p,b,STREET,'east_drive_lane',0,ROAD.eastDrive.y0,W,ROAD.eastDrive.width,'eastbound driving lane','#3f4245','concrete',['road_lane','driving_lane'],{lane:'traffic_e',direction:'east'});
    floor(p,b,STREET,'west_drive_lane',0,ROAD.westDrive.y0,W,ROAD.westDrive.width,'westbound driving lane','#3d4043','concrete',['road_lane','driving_lane'],{lane:'traffic_w',direction:'west'});
    floor(p,b,STREET,'far_parking_lane',0,ROAD.farParking.y0,W,ROAD.farParking.width,'far-side parking lane','#474c4f','concrete',['road_lane','parking_lane'],{lane:'parking_far'});
    floor(p,b,STREET,'lane_line_near',0,ROAD.eastDrive.y0-.10,W,.20,'near parking / drive line','#d7d9d6','paint',['road_marking']);
    floor(p,b,STREET,'center_line',0,ROAD.westDrive.y0-.10,W,.20,'center line','#d3b84b','paint',['road_marking','center_line']);
    floor(p,b,STREET,'lane_line_far',0,ROAD.farParking.y0-.10,W,.20,'far drive / parking line','#d7d9d6','paint',['road_marking']);
    floor(p,b,STREET,'far_sidewalk',0,27,W,9,'far sidewalk','#8b8b86');
  }
  function ensureServiceRoom(p,b){const r=room(p,b,'service_core',23.5,56.8,2.1,2.6,'block service core','utility');r.light.brightness=.55;return r;}

  function buildBar(p,r,b,cx,s=1){const q=frontRoom(p,b,'bar',cx,'bar','nightclub',SHOP.width*s);prop(p,b,'bar_counter',ASSET.desk,cx+1.6,5.7,90,'Bar counter',['commercial','interactable','cover'],{service:'bar'},0,[point('work',.7,0,270,'Bartender'),point('customer',-.7,0,90,'Order')]);prop(p,b,'bar_till',ASSET.register,cx+2.2,5.55,270,'Bar till',['commercial','interactable','evidence'],{cash:{min:80,max:400}},.78);prop(p,b,'bar_table',ASSET.table,cx-1.4,8.8,0,'Bar table',['cover'],{},0,[point('use',0,.65,180,'Stand at table')]);prop(p,b,'bar_chair',ASSET.chair,cx-2.1,8.8,90,'Bar chair',['seat'],{},0,[point('sit',0,0,180,'Sit')]);node(r,b,'bar_door','Bar doorway',cx,12.7,['door','loiter','listen'],0);zone(r,b,'bar_social','Bar social floor',cx-2.8*s,7.5,5.6*s,3.0,[{x:cx-1.4,y:8.5,facing:90},{x:cx+.7,y:8.5,facing:270}]);return q;}
  function buildStore(p,r,b,cx,s=1){const q=frontRoom(p,b,'store',cx,'store','clean',SHOP.width*s);prop(p,b,'store_shelf',ASSET.shelfMid,cx-1.7,5.0,0,'Store shelf',['container','commercial']);prop(p,b,'store_rack',ASSET.shelfTall,cx-.2,8.1,0,'Store rack',['commercial']);prop(p,b,'store_till',ASSET.register,cx+2.25,7.0,270,'Store register',['commercial','interactable'],{cash:{min:40,max:220},alarm:true},1,[point('customer',0,.85,180,'Customer pays'),point('work',0,-.9,0,'Cashier')]);prop(p,b,'store_cctv',ASSET.monitor,cx+2.2,4.5,90,'Security monitor',['interactable','evidence'],{evidence_source:'cctv'},1);node(r,b,'store_door','Store doorway',cx,12.7,['door','loiter','queue','listen'],0);zone(r,b,'store_queue','Store queue',cx-1.5,7.6,3.0,3.3,[{x:cx-.7,y:9,facing:270},{x:cx-1.2,y:10,facing:270}]);return q;}
  function buildOffice(p,r,b,cx,s=1){const q=frontRoom(p,b,'office',cx,'office lobby','clean',SHOP.width*s);prop(p,b,'office_desk',ASSET.desk,cx+1.0,6.1,90,'Reception desk',['interactable','cover'],{access_control:'lobby'},0,[point('work',.8,0,270,'Receptionist'),point('customer',-.9,0,90,'Visitor')]);prop(p,b,'office_monitor',ASSET.monitor,cx+1.0,6.1,0,'Reception monitor',['interactable','evidence'],{},.77);prop(p,b,'office_wait',ASSET.chair,cx-1.5,9.1,180,'Lobby chair',['seat'],{},0,[point('sit',0,0,180,'Wait')]);node(r,b,'office_door','Office lobby doorway',cx,12.7,['door','queue','listen','loiter'],0);zone(r,b,'office_wait_zone','Office waiting area',cx-2.5*s,8.1,5*s,2.7,[{x:cx-1.3,y:9.2,facing:0},{x:cx+.3,y:9.2,facing:0}]);return q;}
  function buildCivic(p,r,b,cx,s=1){const q=frontRoom(p,b,'civic',cx,'civic lobby','utility',SHOP.width*s);prop(p,b,'civic_desk',ASSET.desk,cx+1.0,6.1,90,'Civic desk',['interactable','cover'],{service:'civic'},0,[point('work',.8,0,270,'Clerk'),point('customer',-.9,0,90,'Visitor')]);prop(p,b,'civic_papers',ASSET.papers,cx+.4,6.7,0,'Civic forms',['pickup','evidence'],{kind:'forms'},.77);prop(p,b,'civic_wait',ASSET.chair,cx-1.5,9.1,180,'Civic waiting chair',['seat'],{},0,[point('sit',0,0,180,'Wait')]);node(r,b,'civic_door','Civic lobby doorway',cx,12.7,['door','queue','listen'],0);zone(r,b,'civic_wait_zone','Civic waiting area',cx-2.4*s,8.1,4.8*s,2.8,[{x:cx-1.2,y:9.2,facing:0},{x:cx+.4,y:9.2,facing:0}]);return q;}
  function buildRestaurant(p,r,b,cx,s=1){const q=frontRoom(p,b,'restaurant',cx,'restaurant','sunset',SHOP.width*s);prop(p,b,'rest_counter',ASSET.desk,cx+1.2,5.8,90,'Restaurant counter',['commercial','interactable','cover'],{service:'restaurant'},0,[point('work',.8,0,270,'Server'),point('customer',-.9,0,90,'Order')]);prop(p,b,'rest_till',ASSET.register,cx+2.1,5.7,270,'Restaurant till',['commercial','interactable'],{cash:{min:60,max:300}},.78);prop(p,b,'rest_table',ASSET.table,cx-1.4,8.7,0,'Restaurant table',['cover'],{},0,[point('use',0,.65,180,'Table')]);prop(p,b,'rest_chair',ASSET.chair,cx-2.1,8.7,90,'Restaurant chair',['seat'],{},0,[point('sit',0,0,180,'Sit')]);node(r,b,'restaurant_door','Restaurant doorway',cx,12.7,['door','queue','listen'],0);zone(r,b,'dining','Restaurant dining floor',cx-2.6*s,7.5,5.2*s,3.2,[{x:cx-1.3,y:8.7,facing:90},{x:cx+.8,y:8.7,facing:270}]);return q;}
  function buildBus(p,r,b,cx,s=1){freeWall(p,b,'bus_back_'+slug(cx),STREET,[cx-2.8*s,34.5],[cx+2.8*s,34.5],2.3);freeWall(p,b,'bus_w_'+slug(cx),STREET,[cx-2.8*s,31.5],[cx-2.8*s,34.5],2.3);freeWall(p,b,'bus_e_'+slug(cx),STREET,[cx+2.8*s,31.5],[cx+2.8*s,34.5],2.3);pillar(p,b,'bus_sign_'+slug(cx),STREET,cx-3.4*s,31.7);prop(p,b,'bus_seat_'+slug(cx),ASSET.officeChair,cx,33.6,180,'Bus stop seat',['seat'],{},0,[point('sit',0,0,180,'Wait')]);node(r,b,'bus_wait_'+slug(cx),'Bus stop',cx,31.8,['queue','loiter','listen','spy'],180);zone(r,b,'bus_zone_'+slug(cx),'Bus stop waiting area',cx-2.5*s,31.1,5*s,3.2,[{x:cx-1.3*s,y:32,facing:180},{x:cx+.5*s,y:32,facing:180}]);portal(r,b,'bus_portal_'+slug(cx),'Bus arrival / departure','transit',cx+3.1*s,34.0);}
  function buildPark(p,r,b,cx,s=1){const f=floor(p,b,STREET,'park_'+slug(cx),cx-3.2*s,30.6,6.4*s,5.0,'park apron','#72826e','terrazzo',['park','public_space']);prop(p,b,'park_table_'+slug(cx),ASSET.table,cx,33.2,0,'Park table',['cover'],{},0,[point('use',0,.65,180,'Use table')]);prop(p,b,'park_chair_'+slug(cx),ASSET.chair,cx-1.0*s,33.2,90,'Park chair',['seat'],{},0,[point('sit',0,0,180,'Sit')]);prop(p,b,'park_bin_'+slug(cx),ASSET.wheelie,cx+2.4*s,34.3,180,'Park bin',['container','search'],{},0,[point('search',0,.5,180,'Search')]);node(r,b,'park_hangout_'+slug(cx),'Park hangout',cx,31.6,['loiter','listen','view'],180);zone(r,b,'park_zone_'+slug(cx),'Park social area',cx-2.8*s,31.1,5.6*s,3.8,[{x:cx-1.4*s,y:32.3,facing:90},{x:cx+.8*s,y:32.3,facing:270}]);return f;}
  function buildAlley(p,r,b,cx,s=1){floor(p,b,STREET,'alley_'+slug(cx),cx-3.2*s,SHOP.front-SHOP.depth,6.4*s,SHOP.depth,'alley floor','#565756');freeWall(p,b,'alley_w_'+slug(cx),STREET,[cx-3.2*s,SHOP.front-SHOP.depth],[cx-3.2*s,SHOP.front],3);freeWall(p,b,'alley_e_'+slug(cx),STREET,[cx+3.2*s,SHOP.front-SHOP.depth],[cx+3.2*s,SHOP.front],3);prop(p,b,'alley_dumpster_'+slug(cx),ASSET.dumpster,cx-1.2,7.0,180,'Alley dumpster',['cover','hide','container'],{loot:'alley_junk'},0,[point('hide',0,1,180,'Hide'),point('search',0,.7,180,'Search')]);prop(p,b,'alley_crate_'+slug(cx),ASSET.crate,cx+1.5,9.0,0,'Alley crate',['container','movable','cover'],{},0,[point('search',0,.6,180,'Search crate')]);node(r,b,'alley_mouth_'+slug(cx),'Alley mouth',cx,12.7,['hide','spy','loiter','listen'],0);node(r,b,'alley_deep_'+slug(cx),'Deep alley',cx,7.8,['hide','cover','search','spy'],180);zone(r,b,'alley_zone_'+slug(cx),'Alley exchange area',cx-2.3*s,7.0,4.6*s,3.0,[{x:cx-1,y:8.2,facing:90},{x:cx+1,y:8.2,facing:270}]);}
  function buildCarPark(p,r,b,cx,s=1){floor(p,b,STREET,'carpark_'+slug(cx),cx-3.5*s,29.8,7*s,6.0,'car park','#555a5d','concrete',['car_park','vehicle_space']);prop(p,b,'park_car_'+slug(cx),ASSET.car,cx,32.8,270,'Parked Crown Vic',['vehicle','cover'],{parking_space:true},0,[point('driver',-1.3,.4,90,'Driver door')]);node(r,b,'parking_'+slug(cx),'Parking space',cx,29.7,['vehicle','cover','spy'],180);zone(r,b,'carpark_zone_'+slug(cx),'Car park waiting area',cx-3.2*s,29.3,6.4*s,5.8,[{x:cx-2*s,y:30.4,facing:180},{x:cx+2*s,y:30.4,facing:180}]);portal(r,b,'vehicle_exit_'+slug(cx),'Car park vehicle exit','vehicle',cx+3.3*s,35.0);}
  function buildSubway(p,r,b,cx,s=1){pillar(p,b,'subway_sign_'+slug(cx),STREET,cx-2.7*s,30.8);node(r,b,'subway_top_'+slug(cx),'Subway stair access',cx,30.4,['transit','queue','listen','loiter'],180,{lowerRequired:'tunnel'});zone(r,b,'subway_flow_'+slug(cx),'Subway entrance flow',cx-2.5*s,29.2,5*s,5.8,[{x:cx-1.3*s,y:30.2,facing:180},{x:cx+1.2*s,y:30.2,facing:180}]);portal(r,b,'subway_down_'+slug(cx),'Subway / lower tunnel','transit',cx,35.0,STREET,{transition:'lower_tunnel'});}

  const BUILD={bar:buildBar,bus_stop:buildBus,store:buildStore,park:buildPark,alley:buildAlley,office_lobby:buildOffice,subway_stairs:buildSubway,civic_lobby:buildCivic,car_park:buildCarPark,restaurant:buildRestaurant};

  function addBridgeMeta(p,b,cx,kind){
    // Street floors remain continuous: that continuous deck is the bridge over the lower crossing.
    for(const f of p.floorSections.filter(f=>f.story===STREET&&f.x<=cx&&f.x+f.width>=cx&&f.y<36&&f.y+f.length>12.5)){
      f.gameplay=f.gameplay||{tags:[],props:{}};f.gameplay.tags=f.gameplay.tags||[];if(!f.gameplay.tags.includes('street_bridge'))f.gameplay.tags.push('street_bridge');f.gameplay.props={...(f.gameplay.props||{}),bridgeOver:kind,blockId:b.id,crossingAxis:'north-south'};
    }
  }
  // One flight from the lower pedestrian level up to the street, with its two route points and the stair edge.
  function addStair(p,r,b,st,id){
    if(st.landing)floor(p,b,LOWER,'stair_landing_'+id,st.landing.x0,st.landing.y0,st.landing.x1-st.landing.x0,st.landing.y1-st.landing.y0,'lower stair landing','#666c69','concrete',['lower_access']);
    const x=worldX(b,st.x0+STAIR.width/2)-STAIR.width/2,s=C.createStairs(p,{story:LOWER,x,y:st.y,width:STAIR.width,length:STAIR.run,dir:st.dir,rails:true,cutCeiling:true,name:`${b.name} · ${id} stairs`});const oldId=s.id;s.id='stairs_'+sid(b,id);
    /* 0.15.1: the stair's floor hole, stairwell ceiling cut and guard rails point at the stair's id; keep them pointing at the renamed one */
    for(const arr of [p.floorCuts,p.ceilingCuts,p.partitions])for(const q of arr||[])if(q.stairId===oldId)q.stairId=s.id;const g=C.stairGeometry(p,s);
    const top='v_'+sid(b,id+'_top'),bottom='v_'+sid(b,id+'_bottom');r.vertices.push({id:top,name:`${b.name} · ${id} street landing`,x:g.exit.x,y:g.exit.y,story:STREET},{id:bottom,name:`${b.name} · ${id} lower landing`,x:g.entry.x,y:g.entry.y,story:LOWER});
    r.edges.push({id:'e_'+sid(b,id+'_stairs'),a:top,b:bottom,name:`${b.name} · stairs to lower crossing`,band:.48,kind:'stairs',stairId:s.id});
    return {st:s,g,top,bottom};
  }
  // The foot of a flight stands beside the walkway; a short step sideways reaches the walkway line, which then leads to its end.
  function joinStair(r,b,f,lineX,endId,id,name){
    const bend='v_'+sid(b,id+'_foot');r.vertices.push({id:bend,name:`${b.name} · ${name} foot`,x:worldX(b,lineX),y:f.g.entry.y,story:LOWER});
    r.edges.push({id:'e_'+sid(b,id+'_foot'),a:f.bottom,b:bend,name:`${b.name} · ${name} foot`,band:.5},{id:'e_'+sid(b,id+'_join'),a:bend,b:endId,name:`${b.name} · ${name} to walkway`,band:.55});
  }
  function stairSpec(st,river){
    const landing=river?{x0:st.x0-.2,x1:st.x0+STAIR.width+.2,y0:st.dir==='S'?st.y-1.1:st.y,y1:st.dir==='S'?st.y+STAIR.run:st.y+STAIR.run+1.1}:null;
    return {...st,landing};
  }
  function addRiver(p,r,b,cx,plan){
    floor(p,b,WATER,'river_water',cx-2.8,0,5.6,D,'perpendicular river','#315d71','tile',['river','water','nonpedestrian'],{axis:'north-south'});
    floor(p,b,LOWER,'riverwalk_w',cx-5.2,0,1.9,D,'west riverwalk','#707673','concrete',['lower_riverwalk','pedestrian'],{axis:'north-south'});
    floor(p,b,LOWER,'riverwalk_e',cx+3.3,0,1.9,D,'east riverwalk','#707673','concrete',['lower_riverwalk','pedestrian'],{axis:'north-south'});
    freeWall(p,b,'river_guard_w_n',LOWER,[cx-3.15,0.5],[cx-3.15,30],1.05);freeWall(p,b,'river_guard_w_s',LOWER,[cx-3.15,30],[cx-3.15,D-.5],1.05);freeWall(p,b,'river_guard_e_n',LOWER,[cx+3.15,0.5],[cx+3.15,30],1.05);freeWall(p,b,'river_guard_e_s',LOWER,[cx+3.15,30],[cx+3.15,D-.5],1.05);
    // bridge rail along the near deck edge, stopping where a shop or alley front already closes that edge
    const pieces=uncovered(cx-3.15,cx+3.15,plan.nearFronts||[]);pieces.forEach(([a,z],i)=>freeWall(p,b,pieces.length===1&&a===cx-3.15&&z===cx+3.15?'bridge_guard_near':'bridge_guard_near_'+(i+1),STREET,[a,SHOP.front],[z,SHOP.front],1.05));
    freeWall(p,b,'bridge_guard_far',STREET,[cx-3.15,36],[cx+3.15,36],1.05);
    addBridgeMeta(p,b,worldX(b,cx),'river');
    const eastX=cx+4.15,westX=cx-4.15;
    const na='v_'+sid(b,'river_e_n'),sa='v_'+sid(b,'river_e_s'),nw='v_'+sid(b,'river_w_n'),sw='v_'+sid(b,'river_w_s');
    r.vertices.push({id:na,name:'East-bank riverwalk north',x:worldX(b,eastX),y:.7,story:LOWER},{id:sa,name:'East-bank riverwalk south',x:worldX(b,eastX),y:D-.7,story:LOWER},{id:nw,name:'West-bank riverwalk north',x:worldX(b,westX),y:.7,story:LOWER},{id:sw,name:'West-bank riverwalk south',x:worldX(b,westX),y:D-.7,story:LOWER});
    r.edges.push({id:'e_'+sid(b,'river_e'),a:na,b:sa,name:'Perpendicular east-bank riverwalk',band:.7,kind:'lower_riverwalk'},{id:'e_'+sid(b,'river_w'),a:nw,b:sw,name:'Perpendicular west-bank riverwalk',band:.7,kind:'lower_riverwalk'});
    const ns=plan.stairs.near,fs=plan.stairs.far,line=bk=>bk==='west'?westX:eastX;
    // 0.15.1: riverwalk walkers, its ways in/out and the overlook go on the bank the near stairs reach (east unless the block edge forces west)
    const wb=ns.bank,wx=line(wb),wl=wb==='west'?'west':'east',w1=wb==='west'?'w':'e';
    r.lanes.push({id:'lane_'+sid(b,'river_'+w1+'_n'),name:`${b.name} · riverwalk ${wl}-bank northbound`,side:'lower',story:LOWER,offMin:-.2,offMax:.45,points:[{x:worldX(b,wx),y:D-.7,story:LOWER},{x:worldX(b,wx),y:.7,story:LOWER}]},{id:'lane_'+sid(b,'river_'+w1+'_s'),name:`${b.name} · riverwalk ${wl}-bank southbound`,side:'lower',story:LOWER,offMin:-.2,offMax:.45,points:[{x:worldX(b,wx),y:.7,story:LOWER},{x:worldX(b,wx),y:D-.7,story:LOWER}]});
    portal(r,b,'river_north','Riverwalk north boundary','lower_boundary',wx,.5,LOWER);portal(r,b,'river_south','Riverwalk south boundary','lower_boundary',wx,D-.5,LOWER);
    node(r,b,'river_view','Riverwalk overlook',wx,39,['loiter','listen','view','spy'],wb==='west'?90:270,LOWER);
    const s1=addStair(p,r,b,stairSpec(ns,true),'river_near'),s2=addStair(p,r,b,stairSpec(fs,true),'river_far');
    joinStair(r,b,s1,line(ns.bank),ns.bank==='west'?nw:na,'river_near','near stair');joinStair(r,b,s2,line(fs.bank),fs.bank==='west'?sw:sa,'river_far','far stair');
    return {type:'river',axis:'north-south',streetBridge:true,lowerStory:LOWER,waterStory:WATER,centerX:worldX(b,cx),stairBanks:{near:ns.bank,far:fs.bank}};
  }
  function tunnelRoom(p,b,id,cx,y,len,name){const x=worldX(b,cx)-2.5,r=C.makeRoom(`${b.name} · ${name}`,x,y,5,len,LOWER);r.id='room_'+sid(b,id);C.applyPalette(r,'noir');r.floor=C.surface('#484d50','concrete');r.wall=C.surface('#555b5e','concrete');r.ceiling=C.surface('#373b3e','concrete');r.light.brightness=.62;p.rooms.push(r);return r;}
  function addTunnel(p,r,b,cx,plan){
    const north=tunnelRoom(p,b,'tunnel_n',cx,.4,29.6,'north lower walkway tunnel'),south=tunnelRoom(p,b,'tunnel_s',cx,30,29.6,'south lower walkway tunnel');
    // Open north/south ends and the shared middle wall so the lower route is physically continuous.
    for(const [rr,side,nm] of [[north,'N','north portal'],[north,'S','middle passage north'],[south,'N','middle passage south'],[south,'S','south portal']]){try{const o=C.createOpening(p,rr.id,side,.5,'passage',{name:`${b.name} · ${nm}`,width:4,height:2.55,open:true,trim:false});o.id='opening_'+sid(b,slug(nm));}catch(e){}}
    addBridgeMeta(p,b,worldX(b,cx),'pedestrian_tunnel');
    const x=worldX(b,cx),n='v_'+sid(b,'tunnel_n'),s='v_'+sid(b,'tunnel_s');r.vertices.push({id:n,name:'Lower tunnel north',x,y:.8,story:LOWER},{id:s,name:'Lower tunnel south',x,y:D-.8,story:LOWER});r.edges.push({id:'e_'+sid(b,'tunnel'),a:n,b:s,name:'Perpendicular lower pedestrian tunnel',band:.62,kind:'tunnel'});
    r.lanes.push({id:'lane_'+sid(b,'tunnel_n'),name:`${b.name} · tunnel northbound`,side:'lower',story:LOWER,offMin:-.2,offMax:.45,points:[{x,y:D-.8,story:LOWER},{x,y:.8,story:LOWER}]},{id:'lane_'+sid(b,'tunnel_s'),name:`${b.name} · tunnel southbound`,side:'lower',story:LOWER,offMin:-.2,offMax:.45,points:[{x,y:.8,story:LOWER},{x,y:D-.8,story:LOWER}]});
    portal(r,b,'tunnel_north','Tunnel north boundary','lower_boundary',cx,.5,LOWER);portal(r,b,'tunnel_south','Tunnel south boundary','lower_boundary',cx,D-.5,LOWER);node(r,b,'tunnel_recess','Tunnel recess',cx,39,['loiter','hide','listen','spy'],0,LOWER);
    const s1=addStair(p,r,b,stairSpec(plan.stairs.near,false),'tunnel_near'),s2=addStair(p,r,b,stairSpec(plan.stairs.far,false),'tunnel_far');
    joinStair(r,b,s1,cx,n,'tunnel_near','near stair');joinStair(r,b,s2,cx,s,'tunnel_far','far stair');
    return {type:'tunnel',axis:'north-south',streetBridge:true,lowerStory:LOWER,centerX:x,stairSides:{near:plan.stairs.near.bank,far:plan.stairs.far.bank}};
  }

  function routeBase(characters=[],vehicleLoop=null,vehicleTraffic=null){return {...(vehicleTraffic&&typeof vehicleTraffic==='object'?{vehicleTraffic:deep(vehicleTraffic)}:{}),version:1,settings:{seed:1977,start:{edge:'e_main_0',s:1,dir:1},defaults:{debug:0,lookYaw:180},note:'Block Composer v0.5: four-lane main road (parking, east drive, west drive, parking), automatic four-way pedestrian intersections, and optional lower crossings under street bridges.'},vertices:[],edges:[],lanes:[],nodes:[],zones:[],portals:[],traffic:[],actors:[],characters:deep(characters||[]),vehicleLoop:deep(vehicleLoop||DEFAULT_VEHICLE_LOOP),parking:{schema:PARKING.schema,spaceLength:PARKING.vehicleLength,maneuverBuffer:PARKING.buffer,lanes:[{id:'parking_near',side:'near',y0:ROAD.nearParking.y0,y1:ROAD.nearParking.y1,center:ROAD.nearParking.center,adjacentTrafficLane:'traffic_e',direction:'east'},{id:'parking_far',side:'far',y0:ROAD.farParking.y0,y1:ROAD.farParking.y1,center:ROAD.farParking.center,adjacentTrafficLane:'traffic_w',direction:'west'}],spaces:[],clearZones:[],rules:{parallelToSidewalk:true,intersectionClear:true,eachSpaceRequiresFrontAndRearManeuverBuffer:true}},levels:[{id:'river_water',story:WATER,elevation:ELEV.water,walkable:false},{id:'lower_pedestrian',story:LOWER,elevation:ELEV.lower,walkable:true},{id:'street',story:STREET,elevation:ELEV.street,walkable:true}],blockComposer:{schema:VERSION,layoutRevision:LAYOUT.revision,moduleWidth:W,moduleDepth:D,intersectionWidth:INTERSECTION_W,maxElementsPerBlock:3,streetAxis:'east-west',lowerCrossingAxis:'north-south',roadProfile:{lanes:[{id:'parking_near',kind:'parking',side:'near',width:ROAD.nearParking.width},{id:'traffic_e',kind:'driving',direction:'east',width:ROAD.eastDrive.width},{id:'traffic_w',kind:'driving',direction:'west',width:ROAD.westDrive.width},{id:'parking_far',kind:'parking',side:'far',width:ROAD.farParking.width}]},intersections:[],stories:{water:WATER,lowerPedestrian:LOWER,street:STREET},authority:{roomCreator:'authored spatial authority',encounter:'persistent identity/action/consequence/observation authority',bridge:'descriptor_only'},recipe:[],instances:[]}};}

  function newProject(name){const p=C.newProject();p.name=name;p.storyHeight=3.4;p.wallHeight=3.0;p.stories=[{id:'story_0',index:0,name:'River Water',elevation:ELEV.water},{id:'story_1',index:1,name:'Lower Pedestrian',elevation:ELEV.lower},{id:'story_2',index:2,name:'Street Level',elevation:ELEV.street}];p.rooms=[];p.floorSections=[];p.ceilingCuts=[];p.ceilingPatches=[];p.pillars=[];p.partitions=[];p.openings=[];p.lights=[];p.objects=[];p.viewpoints=[];p.pairs=[];p.links=[];p.startViewId=null;p.props=[];p.objectLibrary={schema:1,looks:[],palettes:[],setups:deep(SETUPS),blockComposer:{schema:VERSION}};return p;}

  function addBlock(p,r,spec,index,xOverride=null){
    const b={...normalizeSpec(spec,index),index,x:Number.isFinite(xOverride)?xOverride:index*(W+INTERSECTION_W)};r.blockComposer.recipe.push({id:b.id,name:b.name,elements:deep(b.elements),lower:b.lower,crossing:b.crossing,mirror:b.mirror});r.blockComposer.instances.push({id:b.id,name:b.name,origin:{x:b.x,y:0},bounds:{width:W,depth:D},elements:deep(b.elements),elementCount:b.elements.length,lowerCrossing:b.lower,crossing:b.crossing,axis:{street:'east-west',lower:b.lower==='none'?null:'north-south'},encounterBindingStatus:'descriptor_only'});
    ensureServiceRoom(p,b);addStreetGround(p,b);
    const plan=planBlock(b),centers=plan.centers,parking=addStreetParking(p,r,b,centers),doors=[];
    plan.nearFronts=b.elements.map((k,i)=>ELEMENTS[k].side==='near'?[centers[i]+FOOT[k][0]*plan.scale[i],centers[i]+FOOT[k][1]*plan.scale[i]]:null).filter(Boolean);
    b.elements.forEach((key,i)=>{const cx=centers[i],before=r.nodes.length;BUILD[key](p,r,b,cx,plan.scale[i]);const made=r.nodes.slice(before).find(n=>Array.isArray(n.types)&&n.types.includes('door'));if(made)doors.push(made);});
    const mid='v_mid_'+b.id;r.vertices.push({id:mid,name:`${b.name} · main sidewalk`,x:b.x+W/2,y:STREET_Y.nearWalk,story:STREET});
    for(const d of doors){const v='v_door_'+d.id;r.vertices.push({id:v,name:d.name,x:d.x,y:d.y,story:STREET});r.edges.push({id:'e_door_'+d.id,a:mid,b:v,name:d.name+' branch',band:.45});}
    let lower=null;if(b.lower!=='none'){const cx=CROSS_X[b.crossing];lower=b.lower==='river'?addRiver(p,r,b,cx,plan):addTunnel(p,r,b,cx,plan);for(const st of p.stairs.filter(s=>String(s.id).includes(b.id))){const g=C.stairGeometry(p,st),top=r.vertices.find(v=>Math.hypot(v.x-g.exit.x,v.y-g.exit.y)<.03&&v.story===STREET);if(top)r.edges.push({id:'e_street_stair_'+top.id,a:mid,b:top.id,name:`${b.name} · street to lower stairs`,band:.55});}}
    const desc=b.elements.map(k=>ELEMENTS[k]);r.blockComposer.instances.at(-1).encounter={locationKinds:[...new Set(desc.map(d=>d.kind))],roles:[...new Set(desc.flatMap(d=>d.roles))],hardKeywords:[...new Set(desc.flatMap(d=>d.keywords))],eventHooks:['enter_block','leave_block','use_element','street_parking',...(lower?['enter_lower_level',lower.type==='river'?'riverwalk_encounter':'tunnel_encounter','street_bridge_crossing']:[])],observationPolicy:'Room Creator supplies candidate spatial/level context; Encounter owns actual receipt and persistence.',parkingSpaceIds:parking.map(x=>x.id)};
    r.blockComposer.instances.at(-1).layout={revision:LAYOUT.revision,elements:b.elements.map((k,i)=>({element:k,side:ELEMENTS[k].side,x:r2(worldX(b,centers[i])),width:r2((FOOT[k][1]-FOOT[k][0])*plan.scale[i]),scale:plan.scale[i]})),
      stairs:plan.stairs?{near:{bank:plan.stairs.near.bank,x:r2(worldX(b,plan.stairs.near.x0+STAIR.width/2))},far:{bank:plan.stairs.far.bank,x:r2(worldX(b,plan.stairs.far.x0+STAIR.width/2))}}:null,notes:plan.notes};
    return b;
  }

  function addIntersection(p,r,left,right,index){
    const x0=left.x+W,cx=x0+INTERSECTION_W/2,id=`intersection_${String(index+1).padStart(2,'0')}`;
    const meta={id,name:`${left.name} / ${right.name} intersection`,origin:{x:x0,y:0},center:{x:cx,y:STREET_Y.nearWalk},width:INTERSECTION_W,depth:D,axis:{main:'east-west',cross:'north-south'},vehiclePolicy:'main-street Vehicle Loop continues through; cross-street vehicle flow reserved for later signal/conflict logic'};
    r.blockComposer.intersections.push(meta);
    const mk=(suffix,x,y,w,d,name,color='#696b6c',finish='concrete',tags=[])=>{const f={id:`floor_${id}_${suffix}`,name:`${meta.name} · ${name}`,story:STREET,x,y,width:w,length:d,floor:C.surface(color,finish),underside:C.surface('#44484b','concrete'),gameplay:{tags:['intersection',...tags],props:{intersectionId:id}}};f.floor.wear=.18;p.floorSections.push(f);return f;};
    mk('near_walk',x0,12.5,INTERSECTION_W,5.5,'near sidewalk','#8d8d89');mk('near_parking_clear',x0,ROAD.nearParking.y0,INTERSECTION_W,ROAD.nearParking.width,'near curb lane · no parking through intersection','#474c4f','concrete',['road_lane','parking_lane','no_parking','intersection_clear']);mk('east_drive',x0,ROAD.eastDrive.y0,INTERSECTION_W,ROAD.eastDrive.width,'eastbound driving lane','#3f4245','concrete',['road_lane','driving_lane']);mk('west_drive',x0,ROAD.westDrive.y0,INTERSECTION_W,ROAD.westDrive.width,'westbound driving lane','#3d4043','concrete',['road_lane','driving_lane']);mk('far_parking_clear',x0,ROAD.farParking.y0,INTERSECTION_W,ROAD.farParking.width,'far curb lane · no parking through intersection','#474c4f','concrete',['road_lane','parking_lane','no_parking','intersection_clear']);mk('line_near',x0,ROAD.eastDrive.y0-.10,INTERSECTION_W,.20,'near lane line','#d7d9d6','paint',['road_marking']);mk('center_line',x0,ROAD.westDrive.y0-.10,INTERSECTION_W,.20,'center line','#d3b84b','paint',['road_marking','center_line']);mk('line_far',x0,ROAD.farParking.y0-.10,INTERSECTION_W,.20,'far lane line','#d7d9d6','paint',['road_marking']);mk('far_walk',x0,27,INTERSECTION_W,9,'far sidewalk','#8b8b86');
    mk('cross_road_n',x0+2.1,0,5.8,18,'north cross street','#3f4245');mk('cross_road_s',x0+2.1,36,5.8,D-36,'south cross street','#3f4245');
    mk('cross_walk_w_n',x0,0,2.1,12.5,'northwest cross-street sidewalk','#8d8d89');mk('cross_walk_e_n',x0+7.9,0,2.1,12.5,'northeast cross-street sidewalk','#8d8d89');
    mk('cross_walk_w_s',x0,36,2.1,D-36,'southwest cross-street sidewalk','#8d8d89');mk('cross_walk_e_s',x0+7.9,36,2.1,D-36,'southeast cross-street sidewalk','#8d8d89');
    mk('crosswalk',cx-1.65,18,3.3,9,'pedestrian crosswalk','#9a9b98','checker',['crosswalk','pedestrian']);
    const v=`v_${id}`,vn=`v_${id}_north`,vs=`v_${id}_south`;r.vertices.push({id:v,name:`${meta.name} · four-way`,x:cx,y:STREET_Y.nearWalk,story:STREET},{id:vn,name:`${meta.name} · north`,x:cx,y:.7,story:STREET},{id:vs,name:`${meta.name} · south`,x:cx,y:D-.7,story:STREET});
    r.edges.push({id:`e_${id}_north`,a:v,b:vn,name:`${meta.name} · north sidewalk`,band:.65,kind:'intersection_branch'},{id:`e_${id}_south`,a:v,b:vs,name:`${meta.name} · south crosswalk / sidewalk`,band:.65,kind:'intersection_branch'});
    r.lanes.push({id:`lane_${id}_north`,name:`${meta.name} · northbound pedestrian`,side:'cross',story:STREET,offMin:-.2,offMax:.5,points:[{x:cx-3.25,y:D-.6,story:STREET},{x:cx-3.25,y:.6,story:STREET}]},{id:`lane_${id}_south`,name:`${meta.name} · southbound pedestrian`,side:'cross',story:STREET,offMin:-.2,offMax:.5,points:[{x:cx+3.25,y:.6,story:STREET},{x:cx+3.25,y:D-.6,story:STREET}]});
    r.nodes.push({id:`node_${id}_corner_n`,name:`${meta.name} · north corner`,x:cx-3.2,y:14.0,story:STREET,facing:90,types:['intersection','wait','listen','loiter']},{id:`node_${id}_corner_s`,name:`${meta.name} · south corner`,x:cx+3.2,y:29.3,story:STREET,facing:270,types:['intersection','wait','listen','loiter']});
    r.zones.push({id:`zone_${id}_crosswalk`,name:`${meta.name} · crosswalk`,x:cx-1.7,y:18,width:3.4,length:9,story:STREET,slots:[{x:cx,y:19.2,facing:180},{x:cx,y:25.7,facing:0}]});
    r.portals.push({id:`portal_${id}_north`,name:`${meta.name} · north street connector`,kind:'intersection_connector',x:cx,y:.4,story:STREET,direction:'north'},{id:`portal_${id}_south`,name:`${meta.name} · south street connector`,kind:'intersection_connector',x:cx,y:D-.4,story:STREET,direction:'south'});
    return meta;
  }

  function finishRoutes(p,r,blocks){
    const minX=blocks[0].x,maxX=blocks.at(-1).x+W;r.vertices.unshift({id:'v_main_start',name:'Street west boundary',x:minX+.5,y:STREET_Y.nearWalk,story:STREET});let prev='v_main_start',n=0;
    for(let i=0;i<blocks.length;i++){const b=blocks[i],mid='v_mid_'+b.id;r.edges.push({id:'e_main_'+n++,a:prev,b:mid,name:'Main street sidewalk',band:.9});prev=mid;if(i<blocks.length-1){const ix=`v_intersection_${String(i+1).padStart(2,'0')}`;r.edges.push({id:'e_main_'+n++,a:prev,b:ix,name:'Main street through intersection',band:.9,kind:'intersection_main'});prev=ix;}}
    r.vertices.push({id:'v_main_end',name:'Street east boundary',x:maxX-.5,y:STREET_Y.nearWalk,story:STREET});r.edges.push({id:'e_main_'+n++,a:prev,b:'v_main_end',name:'Main street sidewalk',band:.9});r.settings.start={edge:'e_main_0',s:.5,dir:1};
    r.lanes.unshift({id:'near_e',name:'Near sidewalk eastbound',side:'near',story:STREET,offMin:-.15,offMax:.75,points:[{x:minX+.4,y:STREET_Y.nearEast,story:STREET},{x:maxX-.4,y:STREET_Y.nearEast,story:STREET}]},{id:'near_w',name:'Near sidewalk westbound',side:'near',story:STREET,offMin:-.15,offMax:.75,points:[{x:maxX-.4,y:STREET_Y.nearWest,story:STREET},{x:minX+.4,y:STREET_Y.nearWest,story:STREET}]},{id:'far_e',name:'Far sidewalk eastbound',side:'far',story:STREET,offMin:-.2,offMax:.7,points:[{x:minX+.4,y:STREET_Y.farEast,story:STREET},{x:maxX-.4,y:STREET_Y.farEast,story:STREET}]},{id:'far_w',name:'Far sidewalk westbound',side:'far',story:STREET,offMin:-.2,offMax:.7,points:[{x:maxX-.4,y:STREET_Y.farWest,story:STREET},{x:minX+.4,y:STREET_Y.farWest,story:STREET}]});
    r.traffic.push({id:'traffic_e',name:'Street traffic east',kind:'traffic',story:STREET,speed:8.5,cruiseMin:6.7,cruiseMax:10.1,gap:10,delay:2,points:[{x:minX+.2,y:STREET_Y.roadEast,story:STREET},{x:maxX-.2,y:STREET_Y.roadEast,story:STREET}]},{id:'traffic_w',name:'Street traffic west',kind:'traffic',story:STREET,speed:8.5,cruiseMin:6.7,cruiseMax:10.1,gap:10,delay:7,points:[{x:maxX-.2,y:STREET_Y.roadWest,story:STREET},{x:minX+.2,y:STREET_Y.roadWest,story:STREET}]});
    for(const l of r.parking.lanes){l.xMin=minX;l.xMax=maxX;}
    r.portals.push({id:'portal_world_west',name:'Street west spawn / despawn',kind:'corner',x:minX+.7,y:STREET_Y.nearWalk,story:STREET},{id:'portal_world_east',name:'Street east spawn / despawn',kind:'corner',x:maxX-.7,y:STREET_Y.nearWalk,story:STREET});
    const chars=new Set((r.characters||[]).map(c=>c.id));r.actors.push(chars.has('buyer')?{id:'buyer',name:'Buyer',character:'buyer',lane:'near_e',startS:Math.min(12,maxX*.2),speed:1.25,loiterChance:.45,respawn:5}:{id:'walker_a',name:'Walker A',lane:'near_e',startS:10,speed:1.25,respawn:6});r.actors.push(chars.has('supplier')?{id:'supplier',name:'Supplier',character:'supplier',lane:'far_w',startS:Math.min(30,maxX*.5),speed:1.15,loiterChance:.3,respawn:8}:{id:'walker_b',name:'Walker B',lane:'far_w',startS:24,speed:1.15,respawn:8});
    const lowerLane=r.lanes.find(l=>l.story===LOWER);if(lowerLane)r.actors.push(chars.has('tracksuit')?{id:'tracksuit',name:'Tracksuit',character:'tracksuit',lane:lowerLane.id,startS:8,speed:1.1,loiterChance:.35,respawn:7}:{id:'lower_walker',name:'Lower walker',lane:lowerLane.id,startS:8,speed:1.1,loiterChance:.35,respawn:7});
    addVehicleGraph(r,blocks);
  }

  /* 0.16 — Vehicle World road graph (routeNet.vehicleGraph, schema rc-vehicle-graph@0.1). Pure data added beside the
     existing traffic[] lines, which stay unchanged for the legacy runtime. One edge per block per driving direction, one
     straight connector per intersection per direction, entry/exit portals at the street ends, parking areas per block side.
     World coordinates throughout (mirrored blocks need nothing special). Turn connectors and cross streets come later. */
  const VEHICLE_GRAPH_SCHEMA='rc-vehicle-graph@0.1';
  function addVehicleGraph(r,blocks){
    const r3=v=>Math.round(v*1000)/1000,laneOf={traffic_e:ROAD.eastDrive,traffic_w:ROAD.westDrive};
    const g={schema:VEHICLE_GRAPH_SCHEMA,generatedBy:'block-composer',trafficSide:'left',edges:[],connectors:[],nodes:[],portals:[],parkingAreas:[],spaceAccess:[],pulloverCandidates:[]};
    const fams=r.traffic.filter(t=>laneOf[t.id]&&Array.isArray(t.points)&&t.points.length>=2);
    const ys=fams.map(t=>t.points[0].y),centre=ys.reduce((a,b)=>a+b,0)/Math.max(1,ys.length);
    for(const f of fams){
      const letter=f.id.replace(/^traffic_/,''),a=f.points[0],z=f.points[f.points.length-1],dir=z.x>=a.x?1:-1,y=a.y,story=Number.isInteger(f.story)?f.story:STREET;
      const lane=laneOf[f.id],cor={halfWidth:lane.width/2},speed={cruise:f.speed,min:f.cruiseMin,max:f.cruiseMax};
      /* left/right-hand traffic from data: a lane is on its driver's left when it lies on the -right side of the road centre */
      const rightY=dir>0?1:-1;if(fams.length>1)g.trafficSide=(y-centre)*rightY<0?'left':'right';
      const order=dir>0?[...blocks]:[...blocks].reverse();let k=0;const node=(kind,x)=>{const n={id:`vn_${letter}_${String(k++).padStart(2,'0')}`,kind,x:r3(x),y,story};g.nodes.push(n);return n;};
      let prevEdge=null,prevNode=node('area_entry',a.x);
      order.forEach((b,i)=>{
        const bx0=Math.max(b.x,Math.min(a.x,z.x)),bx1=Math.min(b.x+W,Math.max(a.x,z.x)),from=dir>0?bx0:bx1,to=dir>0?bx1:bx0;
        if(prevEdge){ /* the intersection between the previous block and this one */
          const left=dir>0?order[i-1]:b,ix=r.blockComposer.intersections.find(q=>Math.abs(q.origin.x-(left.x+W))<1e-6);
          const exitNode=node('intersection_exit',from),cid=`vc_${ix?ix.id:'gap_'+i}_${letter}_straight`;
          g.connectors.push({id:cid,kind:'intersection_straight',intersectionId:ix?ix.id:null,laneFamily:f.id,direction:dir>0?'east':'west',story,
            fromEdge:prevEdge.id,toEdge:`veh_${letter}_${b.id}`,fromNode:prevNode.id,toNode:exitNode.id,
            path:[{x:r3(prevNode.x),y},{x:r3(from),y}],corridor:{...cor},conflictZoneIds:ix?[`zone_${ix.id}_crosswalk`]:[],priority:'through',signalGroup:null,tags:['main_street','intersection']});
          prevNode=exitNode;}
        const last=i===order.length-1,endNode=node(last?'area_exit':'intersection_entry',to);
        const e={id:`veh_${letter}_${b.id}`,kind:'road_lane',laneFamily:f.id,direction:dir>0?'east':'west',story,blockId:b.id,
          centerPath:[{x:r3(prevNode.x),y},{x:r3(to),y}],corridor:{...cor},speedPolicy:{...speed},fromNode:prevNode.id,toNode:endNode.id,tags:['main_street']};
        g.edges.push(e);prevEdge=e;prevNode=endNode;});
      g.portals.push({id:`vportal_${dir>0?'west':'east'}_${letter}`,node:g.nodes.find(n=>n.id===`vn_${letter}_00`).id,role:'entry',kind:'street_end',laneFamily:f.id},
        {id:`vportal_${dir>0?'east':'west'}_${letter}`,node:prevNode.id,role:'exit',kind:'street_end',laneFamily:f.id});
    }
    /* parking: one area per block side; spaceAccess gives where each pull-in starts and pull-out ends along the drive edge */
    const areas=new Map();
    for(const sp of r.parking?.spaces||[]){
      const letter=String(sp.adjacentTrafficLane||'').replace(/^traffic_/,''),edge=g.edges.find(e=>e.id===`veh_${letter}_${sp.blockId}`);if(!edge)continue;
      const aid=`parea_${sp.blockId}_${sp.side}`;if(!areas.has(aid))areas.set(aid,{id:aid,blockId:sp.blockId,side:sp.side,accessEdge:edge.id,spaceIds:[]});areas.get(aid).spaceIds.push(sp.id);
      const P0=edge.centerPath[0],P1=edge.centerPath[1],L=Math.hypot(P1.x-P0.x,P1.y-P0.y),ux=(P1.x-P0.x)/L,uy=(P1.y-P0.y)/L,sOf=q=>r3((q.x-P0.x)*ux+(q.y-P0.y)*uy);
      const pin=sp.maneuver?.pullInPath||[],pout=sp.maneuver?.pullOutPath||[];
      g.spaceAccess.push({spaceId:sp.id,areaId:aid,accessEdge:edge.id,approachS:pin.length?sOf(pin[0]):null,departS:pout.length?sOf(pout[pout.length-1]):null});}
    g.parkingAreas=[...areas.values()].map(a=>({...a,spaceIds:a.spaceIds.sort()})).sort((a,b)=>a.id.localeCompare(b.id));
    g.spaceAccess.sort((a,b)=>a.spaceId.localeCompare(b.spaceId));
    r.vehicleGraph=g;return g;
  }

  /* 0.15.2 — first texture pass. Runs after the street is laid out and only changes surface looks, never sizes or routes,
     so `buildBundle(specs,{textures:false})` gives exactly the untextured street. Which surface gets which picture is decided
     by the tags and names the generator already writes (driving_lane, parking_lane, sidewalk, park, alley, lower walkway…).
     Pictures come from block-textures.js (CC0, chunky 128 px). Repeat sizes are real metres. */
  const TEX_ASSETS=new Map();
  function texAsset(key){const t=TEX&&TEX[key];if(!t)return null;if(!TEX_ASSETS.has(key))TEX_ASSETS.set(key,{id:t.id,name:t.name,src:t.src,width:t.width,height:t.height,category:'texture',view:'both',source:{note:t.source,licence:t.licence,madeBy:'Block Composer first texture pass (0.15.2)'}});return TEX_ASSETS.get(key);}
  function skinStreet(p,assets){
    const used=new Set();
    const apply=(s,key,extra={})=>{const t=TEX&&TEX[key];if(!s||!t)return;s.finish='image';s.textureId=t.id;s.tileSize=t.tile;s.tileSizeY=null;s.mapping='repeat';s.textureOpacity=1;s.filter='pixel';s.coordinateMode='local';Object.assign(s,t.tweak||{},extra);used.add(key);};
    for(const f of p.floorSections){const tags=f.gameplay?.tags||[],n=(f.name||'').toLowerCase(),id=f.id||'';
      if(tags.includes('road_marking')||tags.includes('crosswalk')||tags.includes('river'))continue;
      if(tags.includes('driving_lane')||/cross street/.test(n))apply(f.floor,'asphalt');
      else if(tags.includes('parking_lane'))apply(f.floor,'asphalt',{brightness:1.08});
      else if(tags.includes('car_park'))apply(f.floor,'asphalt',{brightness:1.04});
      else if(/sidewalk/.test(n))apply(f.floor,'paving');
      else if(tags.includes('park'))apply(f.floor,'grass');
      else if(/^floor_.*__alley_/.test(id)||tags.includes('lower_riverwalk')||tags.includes('lower_access')||f.story===LOWER)apply(f.floor,'concrete');}
    for(const r of p.rooms){
      if(r.story===LOWER){apply(r.wall,'concrete');apply(r.floor,'concrete',{brightness:.92});}
      /* street rooms: only the street-facing (south) wall gets brick. Room Creator draws a wall's inside and outside with the
         same look, so this keeps each shop's own colours on its other three walls. */
      else if(r.story===STREET){r.walls=r.walls||{};const front=deep(r.walls.S||r.wall);apply(front,'brick');r.walls.S=front;}}
    for(const key of used){const a=texAsset(key);if(a&&!assets.some(x=>x.id===a.id))assets.push(a);}
    if(p.routeNet?.blockComposer)p.routeNet.blockComposer.texturePass={version:1,textures:[...used].sort(),note:'0.15.2 first pass: chunky CC0 textures; turn off with buildBundle(specs,{textures:false})'};
    return [...used];
  }

  function buildBundle(specs,options={}){
    if(!Array.isArray(specs)||!specs.length)throw Error('Add at least one block recipe.');if(specs.length>6)throw Error('Block Composer v0.3 supports up to six blocks in one generated street.');
    const norm=specs.map(normalizeSpec),p=newProject(options.name||'First Encounter · Block Composer street'),r=routeBase(options.characters||[],options.vehicleLoop||null,options.vehicleTraffic||null),blocks=[],totalWidth=norm.length*W+Math.max(0,norm.length-1)*INTERSECTION_W,originX=-totalWidth/2;
    norm.forEach((s,i)=>blocks.push(addBlock(p,r,s,i,originX+i*(W+INTERSECTION_W))));for(let i=0;i<blocks.length-1;i++)addIntersection(p,r,blocks[i],blocks[i+1],i);finishRoutes(p,r,blocks);p.routeNet=r;
    const startX=blocks[0].x+2.5;const v=C.createViewpoint(p,{x:startX,y:STREET_Y.nearWalk},{x:startX+9.5,y:STREET_Y.nearWalk},'Block Composer route start',null,STREET);v.id='view_block_start';v.fov=78;v.eyeHeight=1.62;p.startViewId=v.id;
    for(const b of blocks)try{const q=C.createViewpoint(p,{x:b.x+W/2,y:17},{x:b.x+W/2,y:8},`${b.name} · street view`,null,STREET);q.id='view_'+b.id;q.fov=82;}catch(e){}
    const lower=r.lanes.find(l=>l.story===LOWER);if(lower)try{const a=lower.points[0],q=C.createViewpoint(p,{x:a.x,y:a.y},{x:a.x,y:a.y+(a.y<30?8:-8)},'Lower crossing view',null,LOWER);q.id='view_lower_crossing';q.fov=80;}catch(e){}
    const assets=deep(options.assets||[]);if(options.textures!==false&&TEX)skinStreet(p,assets);
    const bundle={project:p,assets,savedWith:'TRAPSTAR Room Creator v0.16.1 · Block Composer v0.5 · four-lane parking road'};return C.validateBundle(bundle);
  }

  return {VEHICLE_GRAPH_SCHEMA,addVehicleGraph,TEXTURES:TEX,skinStreet,VERSION,W,D,INTERSECTION_W,WATER,LOWER,STREET,ELEV,ROAD,STREET_Y,PARKING,CROSS_X,ELEMENTS,PRESETS,ASSET,BOUNDS,DEFAULT_VEHICLE_LOOP,normalizeSpec,buildBundle,SHOP,STAIR,FOOT,LAYOUT,planBlock,stairCandidates};
});
