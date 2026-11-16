/* Derive one opt-in proof tile from the supplied Block_triple_shop scene. No baseline mutation. */
'use strict';const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const bundle=JSON.parse(fs.readFileSync(path.join(root,'examples/Block_triple_shop.room.json'),'utf8'));
const C=require('../source/core.js');
const p=bundle.project,n=p.routeNet,a=JSON.parse(fs.readFileSync(path.join(root,'characters/action_proof/runtime_assets.json'),'utf8'));
p.name='Action Playground · physical proof 0.1';p.id='action-proof-tile-01';
// Derived proof omits external library props; preserves native buildings, paving, river and bridge.
p.props=[]; // This standalone proof omits the source tile's unbundled library props; no hidden external-model dependency.
n.actors=[];n.lanes=[];n.nodes=[];n.zones=[];n.traffic=[];n.combat=undefined;
n.characters=a.characters;bundle.assets.push(...a.assets);n.vehicleLoop.runtime='world';Object.assign(n.vehicleLoop.config,{autoPopulate:false,autoSpawn:false,disableBraking:false,fixedStep:1/240,maxTracked:1});delete n.vehicleTraffic;
for(const sp of n.parking?.spaces||[]){sp.status='open';sp.occupantPropId=null;} // Keep access graph; no parked-actor adoptions in this one-car proof.
const prefix='proof01__';const vertex=(name,x,y,story=2)=>{const id=prefix+name;n.vertices.push({id,name,x,y,story});return id;};
const edge=(name,A,B,band=.75,more={})=>n.edges.push({id:prefix+name,a:A,b:B,band,name,...more});
// Preserve the original network and extend it with explicitly authored practice bands.
const grid={};for(const y of[15,17])for(const x of[-11,-7,-3,1,5,9,11])grid[x+','+y]=vertex('lane_'+x+'_'+y,x,y);
for(const y of[15,17]){const xs=[-11,-7,-3,1,5,9,11];for(let i=1;i<xs.length;i++)edge('along_'+y+'_'+i,grid[xs[i-1]+','+y],grid[xs[i]+','+y],1.05);}
for(const x of[-11,-7,-3,1,5,9,11])edge('across_'+x,grid[x+',15'],grid[x+',17'],.85);
const approach=vertex('platform_approach',-7,18.1),roof=vertex('platform_top',-7,19.1),road=vertex('road_landing',-7,22.9),far=vertex('far_return',9,28.6);
edge('to_launch',grid['-7,17'],approach,.9);edge('road_return',road,far,1.1);edge('road_west',vertex('road_west',-11,22.9),road,1.1);
const gate0=vertex('gate_south',9,15),gate1=vertex('gate_north',9,13.1);
edge('breach',gate0,gate1,.7,{physicalPiece:prefix+'barrier',requiresState:'broken'});
edge('return_to_start',approach,road,.6); // a road approach is valid but dangerous; car roof is acquired by a real landing, not an edge.
const bp=vertex('bridge_drop',0,13.25);edge('bridge_approach',grid['1,15'],bp,.65);
// Normal authored ROOM primitive, visible in editor and used as shared support/collision.
p.pillars.push({id:prefix+'launch',name:'Jump launch · 0.9 m',x:-7,y:19.05,width:3.6,depth:1.7,height:.9,story:2,surface:C.surface('#347e83','paint'),faces:{},gameplay:{tags:['proof','support']}});
const bayFloor=JSON.parse(JSON.stringify(p.floorSections.find(q=>q.id.includes('near_sidewalk'))));Object.assign(bayFloor,{id:prefix+'bay_floor',name:'Breach practice bay',x:7.15,y:9,width:3.7,length:5.2});bayFloor.floor.color='#626d70';p.floorSections.push(bayFloor);
const face=C.surface('#4c6164','concrete');for(const [name,axis,x,y,length] of[['bay_back','h',7.15,9,3.7],['bay_left','v',7.15,9,5.2],['bay_right','v',10.85,9,5.2]])p.partitions.push({id:prefix+name,name:'Practice bay',roomId:p.rooms[0].id,story:2,axis,x,y,length,height:2.5,free:true,faces:{A:face,B:face}});
const sid=prefix+'person_a',gid=prefix+'person_b';
n.settings.start={edge:prefix+'across_9',s:1.7,dir:-1};n.settings.seed=1977;Object.assign(n.settings.defaults,{debug:0,lookYaw:360,eye:1.62,charPixel:1,charHeads:0,fov:78});
n.physicalProof={schema:'room-physical-proof@0.1',tileId:'proof01',origin:[0,0,0],metricUnits:'metres',streetStory:2,streetElevation:0,carPortal:'vportal_west_e',
 boundaries:[{id:'proof01__west-walk',x:-13,y:15.5,z:0},{id:'proof01__east-walk',x:13,y:15.5,z:0},{id:'proof01__west-road',x:-12.8,y:21.25,z:0},{id:'proof01__east-road',x:12.8,y:21.25,z:0}],
 firstperson:a.firstperson,profiles:{standard:{height:1.8,radius:.29,mass:75,eye:1.62,maxHealth:2},broad:{height:1.9,radius:.34,mass:88,eye:1.7,maxHealth:2}},
 config:{gravity:18,jump:8.6,walk:3.8,sprint:5.6,carrySpeed:2.4,throwSpeed:12,throwUp:6.4,carSpeed:4.5,localLandingRadius:1.3,carRespawnDelay:1.2},
 carGeometry:{height:1.35,roofLength:2.2,roofWidth:1.35,bodyHeight:.85,provenance:'Calibrated native procedural sedan shell for this proof: body, cabin roof and wheels generated from these same explicit bounds. Not inferred from a flat sprite.'},
 definitions:{practice_barrier:{initialState:'whole',states:{whole:{label:'WHOLE',color:'#d3a03f',boxes:[{x0:-1.7,x1:1.7,y0:-.14,y1:.14,z0:0,z1:1.4}]},broken:{label:'BREACHED',color:'#687575',boxes:[{x0:-1.7,x1:-1.12,y0:-.2,y1:.2,z0:0,z1:.42},{x0:1.12,x1:1.7,y0:-.2,y1:.2,z0:0,z1:.42}]}},transitions:[{from:'whole',to:'broken',minSeverity:5}]}},
 pieces:[{id:prefix+'barrier',name:'Practice barricade',definition:'practice_barrier',state:'whole',x:9,y:14.2,z:0}],
 actors:[{id:sid,name:'You / tan body',appearance:'PLB',bodyProfile:'standard',x:9,y:17.25,z:0,yaw:0,story:2,controller:'human',equipment:{weaponId:null,rangedEnabled:false},testMode:'counter'},{id:gid,name:'Gray defender',appearance:'GNC',bodyProfile:'standard',x:9,y:15.75,z:0,yaw:180,story:2,controller:'test',equipment:{weaponId:'pistol',rangedEnabled:false},testMode:'counter'}],controlId:sid,
 presets:{
 practice:{title:'MELEE / CARRY',hint:'J punch · K kick · G grab/release · T throw. The defender counters at close range.',actors:[{x:9,y:17.25,z:0,yaw:0},{x:9,y:15.75,z:0,yaw:180}]},
 car:{title:'MOVING SUPPORT',hint:'On the teal launch block: time Space + W onto the approaching sedan. Release W before touchdown; Space + S jumps back off.',actors:[{x:-7,y:19.05,z:.9,yaw:180},{x:-9,y:16,z:0,yaw:180}]},
 barrier:{title:'THROW / BREACH',hint:'G grabs the guard; T throws him into the amber barricade. Then walk through the real opening.',actors:[{x:9,y:17.25,z:0,yaw:0},{x:9,y:15.75,z:0,yaw:180}]},
 drop:{title:'DROP / LANDING',hint:'G then T sends the guard over the bridge rail. You can also jump; hard landings injure either actor.',actors:[{x:0,y:16,z:0,yaw:0},{x:0,y:14.6,z:0,yaw:180}]},
 inspection:{title:'ACTOR INSPECTION',hint:'Same bodies, source-scale art. V changes the other skin. Q swaps control. Tab exposes physical bounds.',actors:[{x:9,y:17.6,z:0,yaw:0},{x:9,y:14.8,z:0,yaw:180}]}},
 standIns:a.standIns.concat(['Two-state barricade is an explicit native primitive stand-in','Sedan body/cabin/wheels are a calibrated native procedural presentation','Counter-only deterministic local test driver; no squad AI or Encounter history'])};
C.validateBundle(bundle);
const out=path.join(root,'examples/Action_Physical_Proof.room.json');fs.writeFileSync(out,JSON.stringify(bundle));console.log('Built',out,fs.statSync(out).size,'bytes');
