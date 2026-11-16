// Combat Room v0.1 — builds examples/Combat_Test_Room.room.json with the shared floor-plan rules (core.js).
// Run after tools/build_combat_characters.py:   node tools/make_combat_room.cjs
// Layout (N = -y), authored after the Trapstar hallway / apartment mock-ups:
//   HALL      x 0..2.6,  y 0..12   narrow hallway, two recesses (cover), decorative doors, Apt. 305 door on the west side
//   LOBBY     x -4..10,  y -10..0  two-storey lobby: columns, crates, laundry recess, window, stairs up to a balcony, EXIT door
//   BALCONY   story 1 over the lobby's north and east sides (1.05 m gallery edge), window, back door
//   APARTMENT x -9..0,   y 5..12   open area with waist-high cover (couch, table, counter, TV stand), back door
// The player's feet stay on the authored movement network; cover is reached by sidestepping into "spots".
'use strict';
const fs=require('node:fs'),path=require('node:path');
const PKG=path.join(__dirname,'..');
const C=require(path.join(PKG,'source','core.js'));
const packs=JSON.parse(fs.readFileSync(path.join(PKG,'characters','combat','combat_characters.json'),'utf8'));
const dataUrl=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');

const p=C.newProject();p.name='Combat Test Room · v0.1';p.wallHeight=2.8;p.storyHeight=3.3;p.grid=.1;
const sur=(color,finish='paint',extra={})=>C.normalizeSurface({color,finish,textureId:null,tileSize:1,angle:0,offsetX:0,offsetY:0,textureOpacity:1,...extra});
const paint=(r,{floor,wall,ceiling,base,light})=>{if(floor)r.floor=sur(floor[0],floor[1],floor[2]||{});if(wall)r.wall=sur(wall[0],wall[1],{baseHeight:base?1:0,baseColor:base||'#444951',...(wall[2]||{})});if(ceiling)r.ceiling=sur(ceiling[0],ceiling[1]);if(light)Object.assign(r.light,light);};
const HALL_LOOK={floor:['#2f3236','tile',{tileSize:.6,secondary:'#1d1f22',jointWidth:.02,wear:.45}],wall:['#6b7276','paint',{wear:.5}],base:'#2f4a52',ceiling:['#3a3d41','paint'],light:{brightness:.82,tint:'#ffd9b0',tintStrength:.3}};
const LOBBY_LOOK={floor:['#33373c','concrete',{wear:.6}],wall:['#5c6266','paint',{wear:.55}],base:'#27404a',ceiling:['#2e3135','paint'],light:{brightness:.78,tint:'#e8c9ff',tintStrength:.28}};
const APT_LOOK={floor:['#4a2b45','carpet',{wear:.35}],wall:['#6e5b4b','wallpaper',{wear:.5}],base:'#3a2d25',ceiling:['#3d3733','paint'],light:{brightness:.74,tint:'#ffb37a',tintStrength:.34}};

// ---------------------------------------------------------------- rooms, story 0
const HALL=p.rooms[0];Object.assign(HALL,{name:'Hallway',x:0,y:0,width:2.6,length:12});paint(HALL,HALL_LOOK);
const ALC_W=C.addAdjoining(p,HALL.id,'W',2,2,2.8,'passage');ALC_W.name='Hallway recess · west';paint(ALC_W,HALL_LOOK);
const ALC_E=C.addAdjoining(p,HALL.id,'E',2,2,6.8,'passage');ALC_E.name='Hallway recess · east';paint(ALC_E,HALL_LOOK);
C.createOpening(p,ALC_W.id,'W',.5,'door',{name:'Utility · keep out',width:1,open:false,frameColor:'#2a2d30',panelColor:'#5a6168',doorStyle:'flush'});
C.createOpening(p,ALC_E.id,'E',.5,'door',{name:'Apt. 303',width:1,open:false,frameColor:'#2a2d30',panelColor:'#6b4a33'});
const LOBBY=C.addAdjoining(p,HALL.id,'N',14,10,-4,'solid');Object.assign(LOBBY,{name:'Lobby',openAbove:true});paint(LOBBY,LOBBY_LOOK);
const lobbyDoor=C.createOpening(p,HALL.id,'N',.8,'door',{name:'Lobby door',width:1,open:false,frameColor:'#2a2d30',panelColor:'#4a3b2f'});
const LAUNDRY=C.addAdjoining(p,LOBBY.id,'N',3,2,.5,'passage');LAUNDRY.name='Laundry recess';paint(LAUNDRY,LOBBY_LOOK);
C.createOpening(p,LOBBY.id,'N',9,'window',{name:'Lobby window',width:2.5,bottom:.9,height:1.4,glassColor:'#6a4f8a',glassOpacity:.25});
const EXITC=C.addAdjoining(p,LOBBY.id,'E',3,2.2,.2,'solid');EXITC.name='Exit corridor';paint(EXITC,LOBBY_LOOK);
const exitDoor=C.createOpening(p,LOBBY.id,'E',.6,'door',{name:'EXIT',width:1,open:false,frameColor:'#2a2d30',panelColor:'#3a4a3c',doorStyle:'flush'});
const APT=C.addAdjoining(p,HALL.id,'W',9,7,5,'solid');Object.assign(APT,{name:'Apartment 305'});paint(APT,APT_LOOK);
const aptDoor=C.createOpening(p,HALL.id,'W',9.6,'door',{name:'Apt. 305',width:1,open:false,frameColor:'#2a2d30',panelColor:'#6b4a33'});
const APT_BACK=C.addAdjoining(p,APT.id,'W',2,2,5,'solid');APT_BACK.name='Apartment back room';paint(APT_BACK,APT_LOOK);
const aptBackDoor=C.createOpening(p,APT.id,'W',5.5,'door',{name:'Back door',width:1,open:false,frameColor:'#2a2d30',panelColor:'#4a3b2f'});
C.createOpening(p,APT.id,'N',3,'window',{name:'Apartment window',width:2.2,bottom:.95,height:1.3,glassColor:'#7a4f8a',glassOpacity:.25});
// ---------------------------------------------------------------- story 1: the balcony over the lobby
const BALC_N=C.addRoomAbove(p,LOBBY.id,{offsetX:0,offsetY:0,width:11,length:3,name:'Balcony · north'});BALC_N.balconySides=['S'];paint(BALC_N,LOBBY_LOOK);
const BALC_E=C.addAdjoining(p,BALC_N.id,'E',3,7,0,'passage');Object.assign(BALC_E,{name:'Balcony · east',balconySides:['W','S']});paint(BALC_E,LOBBY_LOOK);
C.createOpening(p,BALC_N.id,'N',5,'window',{name:'Balcony window',width:2.5,bottom:.9,height:1.4,glassColor:'#6a4f8a',glassOpacity:.25});
const BALC_EXIT=C.addAdjoining(p,BALC_N.id,'N',2,2,8.2,'solid');BALC_EXIT.name='Stair exit';paint(BALC_EXIT,LOBBY_LOOK);
const balcDoor=C.createOpening(p,BALC_N.id,'N',8.7,'door',{name:'Stair exit',width:1,open:false,frameColor:'#2a2d30',panelColor:'#3a4a3c',doorStyle:'flush'});
const stairs=C.createStairs(p,{story:0,x:8.7,y:-7.5,width:1.2,length:4,dir:'N',rails:true,name:'Lobby stairs'});
// ---------------------------------------------------------------- solid cover (pillars are plain boxes with a height)
function box(id,name,story,x,y,w,d,h,color,finish='paint',extra={}){const q=C.createPillar(p,story,{x,y},{name,width:w,depth:d,height:h});q.id='pillar_'+id;q.surface=sur(color,finish,{wear:.35,...extra});return q;}
box('col1','Column',0,3.3,-4.3,.5,.5,3.3,'#8a8d90','concrete');box('col2','Column',0,6.5,-4.3,.5,.5,3.3,'#8a8d90','concrete');
box('crate1','Crate',0,6,-6.3,1.3,1,1.1,'#8a6a3c','wood');box('crate2','Crate',0,-1.2,-4.2,1.2,.9,1.1,'#7d5f36','wood');
box('wash1','Washing machine',0,-3,-11.4,.7,.7,1,'#c9ccd0','paint');box('wash2','Washing machine',0,-2.2,-11.4,.7,.7,1,'#c9ccd0','paint');box('wash3','Dryer',0,-1.2,-11.4,.7,.7,1,'#b9bcc0','paint');
box('radiator','Radiator',0,6.2,-9.75,2.2,.3,.8,'#8d8a83','paint');
box('couch','Couch',0,-4.5,8.2,2.2,.9,.85,'#5a2f4d','paint');box('table','Coffee table',0,-4.5,6.3,1.4,.8,.45,'#5a3d28','wood');
box('counter','Kitchen counter',0,-6.5,6.1,2.4,.65,.9,'#3b3a3c','tile',{tileSize:.3});box('tv','TV stand',0,-1.2,6.2,1.2,.5,.6,'#2b2a2c','wood');
box('fridge','Fridge',0,-8.55,5.5,.8,.8,1.9,'#d7d9d4','paint');
// ---------------------------------------------------------------- lights
const lamp=(room,x,y,color,r=3.2,i=.6)=>{const l=C.createLight(p,{x,y},room.id);Object.assign(l,{color,radius:r,intensity:i});return l;};
lamp(HALL,1.3,10.5,'#ffd4a0');lamp(HALL,1.3,5.5,'#ffd4a0');lamp(HALL,1.3,1.2,'#ff9fd0',2.6,.5);
lamp(LOBBY,1,-3,'#e6c6ff',4,.55);lamp(LOBBY,6.5,-7.5,'#ffd4a0',3.5,.5);lamp(LOBBY,-2,-8,'#8fd3ff',3,.45);lamp(BALC_N,2.3,-8.5,'#ffd4a0',3,.5);lamp(BALC_E,8,-6,'#ff9fd0',2.8,.45);
lamp(APT,-4.5,9.5,'#ffb37a',4,.55);lamp(APT,-6.5,6.5,'#8fd3ff',2.8,.4);lamp(EXITC,11.5,-8.5,'#ff5fa0',2,.6);
p.sky={...p.sky,mode:'gradient',top:'#070b18',horizon:'#3a2a5a',bottom:'#06070c',curve:.8};
// ---------------------------------------------------------------- movement network
const V=(id,name,x,y,story=0,extra={})=>({id,name,x,y,story,...extra}),E=(id,name,a,b,band=.6,door=null,extra={})=>({id,name,a,b,band,...(door?{door}:{}),...extra});
const doorNode=(id,name,x,y,door,vertex,side,story=0,facing=0)=>({id,name,x,y,story,facing,types:['door','approach','interact'],door,doorSide:side,vertex,radius:.78,reach:true});
const spot=(id,name,x,y,facing,types,story=0,extra={})=>({id,name,x,y,story,facing,types,radius:.55,...extra});
const vertices=[
  V('v_start','Hallway · south end',1.3,11.3),V('v_apt_app','Apt. 305 approach',1.3,10.1),V('v_h_mid','Hallway · middle',1.3,5.9),V('v_lobby_app','Lobby door approach',1.3,.9,0,{doorApproach:{door:lobbyDoor.id,side:'h-',role:'approach',sourceVertex:'v_h_mid'}}),
  V('v_lobby_thr','Lobby door threshold',1.3,.45,0,{doorApproach:{door:lobbyDoor.id,side:'h-',role:'threshold',sourceVertex:'v_h_mid'}}),V('v_lobby_in','Inside the lobby door',1.3,-.7),
  V('v_a','Lobby · south corridor west',-2.5,-3),V('v_b','Lobby · south corridor centre',1.3,-3),V('v_c','Lobby · south corridor east',8,-3),
  V('v_sb','Stairs · bottom',9.3,-3.05),V('v_st','Stairs · top',9.3,-7.95,1),
  V('v_d','Lobby · west corridor north',-2.5,-8.3),V('v_e','Lobby · north corridor centre',1.3,-8.3),V('v_f','Lobby · north corridor east',8,-8.3),
  V('v_exit_app','EXIT approach',9.1,-8.9,0,{doorApproach:{door:exitDoor.id,side:'v+',role:'approach',sourceVertex:'v_f'}}),V('v_exit_thr','EXIT threshold',9.65,-8.9,0,{doorApproach:{door:exitDoor.id,side:'v+',role:'threshold',sourceVertex:'v_f'}}),V('v_exit_in','Exit corridor',11,-8.9),
  V('v_b1','Balcony · stair landing',9.3,-8.9,1),V('v_b2','Balcony · centre',5.2,-8.9,1),V('v_b3','Balcony · west end',-2.5,-8.9,1),V('v_be1','Balcony east · north',7.9,-8.3,1),V('v_be2','Balcony east · south',7.9,-4,1),
  V('v_balc_app','Stair exit approach',5.2,-9.1,1,{doorApproach:{door:balcDoor.id,side:'h-',role:'approach',sourceVertex:'v_b2'}}),V('v_balc_thr','Stair exit threshold',5.2,-9.55,1,{doorApproach:{door:balcDoor.id,side:'h-',role:'threshold',sourceVertex:'v_b2'}}),
  V('v_apt_thr','Apt. 305 threshold',.45,10.1,0,{doorApproach:{door:aptDoor.id,side:'v-',role:'threshold',sourceVertex:'v_apt_app'}}),V('v_apt_in','Inside Apt. 305',-.8,10.1),
  V('v_ap1','Apartment · east',-2.5,10.1),V('v_ap2','Apartment · west',-6.5,10.1),V('v_ap3','Apartment · north-west',-6.5,7.2),V('v_ap4','Apartment · north-east',-2.5,7.2)];
const edges=[
  E('e_h1','Hallway',  'v_start','v_apt_app',.7),E('e_h2','Hallway','v_apt_app','v_h_mid',.7),E('e_h3','Hallway','v_h_mid','v_lobby_app',.7),
  E('e_lobby_gate','Lobby door · threshold','v_lobby_app','v_lobby_thr',.3,lobbyDoor.id,{doorApproach:{door:lobbyDoor.id,side:'h-',role:'gate'}}),E('e_lobby_door','Lobby doorway','v_lobby_thr','v_lobby_in',.3,lobbyDoor.id),
  E('e_l0','Lobby entry','v_lobby_in','v_b',.6),E('e_l1','Lobby · south corridor','v_a','v_b',.8),E('e_l2','Lobby · south corridor','v_b','v_c',.8),
  E('e_l3','Lobby · west corridor','v_a','v_d',.7),E('e_l4','Lobby · north corridor','v_d','v_e',.7),E('e_l5','Lobby · north corridor','v_e','v_f',.7),E('e_l6','Lobby · east corridor','v_c','v_f',.7),E('e_l7','Lobby · centre crossing','v_b','v_e',.6),
  E('e_stairs_in','To the stairs','v_c','v_sb',.4),E('e_stairs','Lobby stairs','v_sb','v_st',.35),E('e_land','Stair landing','v_st','v_b1',.4),
  E('e_exit_app','EXIT approach','v_f','v_exit_app',.4),E('e_exit_gate','EXIT · threshold','v_exit_app','v_exit_thr',.3,exitDoor.id,{doorApproach:{door:exitDoor.id,side:'v+',role:'gate'}}),E('e_exit_door','EXIT doorway','v_exit_thr','v_exit_in',.3,exitDoor.id),
  E('e_b1','Balcony · north gallery','v_b1','v_b2',.7),E('e_b2','Balcony · north gallery','v_b2','v_b3',.7),E('e_be1','Balcony · east gallery','v_b1','v_be1',.5),E('e_be2','Balcony · east gallery','v_be1','v_be2',.5),
  E('e_balc_app','Stair exit approach','v_b2','v_balc_app',.3,null,{doorApproach:{door:balcDoor.id,side:'h-',role:'link'}}),E('e_balc_gate','Stair exit · threshold','v_balc_app','v_balc_thr',.3,balcDoor.id,{doorApproach:{door:balcDoor.id,side:'h-',role:'gate'}}),
  E('e_apt_gate','Apt. 305 · threshold','v_apt_app','v_apt_thr',.3,aptDoor.id,{doorApproach:{door:aptDoor.id,side:'v-',role:'gate'}}),E('e_apt_door','Apt. 305 doorway','v_apt_thr','v_apt_in',.3,aptDoor.id),
  E('e_ap0','Apartment entry','v_apt_in','v_ap1',.6),E('e_ap1','Apartment · south side','v_ap1','v_ap2',.8),E('e_ap2','Apartment · west side','v_ap2','v_ap3',.7),E('e_ap3','Apartment · north side','v_ap3','v_ap4',.8),E('e_ap4','Apartment · east side','v_ap4','v_ap1',.7)];
const nodes=[
  doorNode('N_lobby_door','At the lobby door',1.3,.9,lobbyDoor.id,'v_lobby_app','h-',0,0),
  doorNode('N_exit_door','At the EXIT',9.1,-8.9,exitDoor.id,'v_exit_app','v+',0,90),
  doorNode('N_balc_door','At the stair exit',5.2,-9.1,balcDoor.id,'v_balc_app','h-',1,0),
  doorNode('N_apt_door','At Apt. 305',1.3,10.1,aptDoor.id,'v_apt_app','v-',0,270),
  // player cover spots: step sideways (A/D) into them; the thing named is between you and the enemy
  spot('S_recess_w','Hallway recess · west',-.5,3.8,0,['cover','hide']),spot('S_recess_e','Hallway recess · east',3.1,7.8,0,['cover','hide']),
  spot('S_doorway','Lobby doorway frame',.75,-.35,0,['cover']),spot('S_col1','Behind column 1',3.3,-3.6,0,['cover']),spot('S_col2','Behind column 2',6.5,-3.6,0,['cover']),spot('S_crate2','Behind the crate (west)',-1.2,-3.5,0,['cover','hide']),
  spot('S_stairfoot','Under the stairs',8.2,-4.2,0,['cover']),spot('S_rail','Balcony rail',3.3,-7.45,0,['cover'],1),spot('S_window','At the balcony window',2.3,-9.3,0,['loiter'],1),
  spot('S_couch','Behind the couch',-4.5,9.3,0,['cover']),spot('S_apt_frame','Apt. 305 doorframe',-1.3,9.3,270,['cover']),spot('S_fridge','Beside the fridge',-7.6,6.7,0,['cover'],0),
  // bot cover spots (facing = where the bot expects you from). A bot crouches here; only its head and shoulders show over the cover.
  spot('B_crate1','Behind crate 1',6,-7.1,180,['cover','bot'],0,{coverHeight:1.1}),spot('B_laundry','Laundry recess',-2.8,-10.6,180,['cover','bot'],0,{coverHeight:1.0}),
  spot('B_col1','North of column 1',3.3,-5.0,180,['cover','bot'],0,{coverHeight:3}),spot('B_col2','North of column 2',6.5,-5.0,180,['cover','bot'],0,{coverHeight:3}),spot('B_crate2','North of crate 2',-1.2,-5,180,['cover','bot'],0,{coverHeight:1.1}),
  spot('B_rail_e','Balcony east · over the rail',7.35,-5.6,250,['cover','bot'],1,{coverHeight:1.05}),spot('B_rail_n','Balcony north · over the rail',5.5,-7.35,180,['cover','bot'],1,{coverHeight:1.05}),
  spot('B_counter','Behind the kitchen counter',-6.5,5.45,180,['cover','bot'],0,{coverHeight:.9}),spot('B_tv','Behind the TV stand',-1.2,5.6,180,['cover','bot'],0,{coverHeight:.6}),spot('B_couch_n','North of the couch',-4.5,7.45,180,['cover','bot'],0,{coverHeight:.85}),
  // flee exits: a scared bot runs here, opens the door and is gone once you cannot see it
  spot('X_exit','EXIT door (bots)',9.3,-8.9,90,['exit','bot'],0,{door:exitDoor.id,beyond:{x:11.2,y:-8.9},via:[{x:8,y:-8.4},{x:8,y:-3.2}]}),
  spot('X_balc','Stair exit (bots)',5.2,-9.2,0,['exit','bot'],1,{door:balcDoor.id,beyond:{x:5.2,y:-10.9},via:[{x:5.2,y:-8.7},{x:7.9,y:-8.6}]}),
  spot('X_apt','Apartment back door (bots)',-8.3,11,270,['exit','bot'],0,{door:aptBackDoor.id,beyond:{x:-9.9,y:11},via:[{x:-6.5,y:11},{x:-6.5,y:7}]})];
const portals=[{id:'P_exit',name:'EXIT corridor',kind:'door',x:11.2,y:-8.9},{id:'P_balc',name:'Stair exit',kind:'door',x:5.2,y:-10.9,story:1},{id:'P_apt',name:'Apartment back door',kind:'door',x:-9.9,y:11}];
// ---------------------------------------------------------------- bots (Combat NPC standard v0.1)
const bot=(id,name,character,temper,node,story,extra={})=>({id,name,character,role:'bot',cls:'combatant',story,node,combat:{temper,hostileTo:['player'],...extra}});
const actors=[
  // stable ids; role / side / intent / target are separate fields (intent and target change during play, identity never does)
  bot('contact','Contact','buyer','fighter','B_crate1',0,{group:'lobby',side:'crew A',role:'gunman',hp:2,wake:'door:'+lobbyDoor.id}),
  bot('tracksuit','Tracksuit','tracksuit','skittish','B_laundry',0,{group:'lobby',side:'crew A',role:'lookout',hp:2,shotsBeforeFlee:2}),
  bot('broker','Broker','supplier','fighter','B_rail_e',1,{group:'lobby',side:'crew A',role:'boss',hp:2,fleeBelowHp:2}),
  bot('broker2','Broker (apartment)','supplier','fighter','B_counter',0,{group:'apartment',side:'crew B',role:'gunman',hp:2,wake:'door:'+aptDoor.id}),
  bot('tracksuit2','Tracksuit (apartment)','tracksuit','skittish','B_tv',0,{group:'apartment',side:'crew B',role:'lookout',hp:2,shotsBeforeFlee:1,wake:'door:'+aptDoor.id})];
const characters=Object.values(packs).map(x=>x.pack);
p.routeNet={version:1,movementSchema:'rc-movement-net@0.1',
  settings:{seed:3051,start:{edge:'e_h1',s:.2,dir:1},defaults:{debug:0,strafe:.8},note:'Combat Test Room v0.1 · hallway → closed lobby door → two-storey lobby with balcony and window → EXIT; Apt. 305 is an optional open-area ambush. Movement is the Encounter rail model: cover is reached by sidestepping into spots.'},
  vertices,edges,lanes:[],nodes,zones:[],portals,traffic:[],actors,characters,
  combat:{version:2,standard:'rc-combat-npc@0.1',lethality:'two consequential hits (owner direction, Nov 2 2026 kernel)',objective:{kind:'reach',node:'N_exit_door',door:exitDoor.id,doneEdge:'e_exit_door',label:'GET TO THE EXIT',sublabel:'Apt. 305 is optional'},
    sideObjective:{kind:'clearGroup',group:'apartment',door:aptDoor.id,label:'SURVIVE THE AMBUSH'},
    player:{life:2,magazine:6,reloadTime:1.6,fireInterval:.28,recoil:2.6,hitGrace:1.2,unsteadyAfterHit:.8},
    weapon:{atlas:'asset_pistol_strip',frames:14,frameW:180,frameH:180,columns:10,idle:[0,10,11,12,13,12,11,10],fire:[1,2,3,4,5,6,7,8,9],fireFps:24,idleFps:4},
    tempers:{fighter:{accuracy:.28,fireInterval:[1.3,2.0],burst:[1,2],magazine:6,reload:2.6,peek:[1.2,1.9],duck:[1.4,2.8],flinch:.6,aimTime:.6,notice:26,fleeBelowHp:0},
             skittish:{accuracy:.2,fireInterval:[1.5,2.3],burst:[1,2],magazine:6,reload:3,peek:[1.0,1.4],duck:[1.6,3],flinch:.8,aimTime:.5,notice:22,shotsBeforeFlee:2,fleeBelowHp:2,warningShotFlees:true},
             runner:{accuracy:0,fireInterval:[9,9],burst:[0,0],magazine:0,reload:9,peek:[0,0],duck:[9,9],flinch:.8,aimTime:9,notice:20,fleesOnSight:true}},
    hitbox:{head:'1 hit = down',body:'-1 hp (bots have 2)',legs:'disabled: drops, stops shooting, surrenders if it has the art',player:['head','chest','hips'],playerLife:'2 hits'},
    score:{bodyHit:100,headHit:300,legsDisable:150,surrender:200,flee:50,exit:500}}};
// ---------------------------------------------------------------- assets
const assets=Object.entries(packs).map(([cid,x])=>({id:x.pack.atlas,name:'Character pictures · '+x.pack.name+' (+ combat poses)',src:dataUrl(path.join(PKG,'characters','combat',x.atlas)),width:x.width,height:x.height,category:'character',view:'both'}));
assets.push({id:'asset_pistol_strip',name:'Pistol · first-person strip (14 frames)',src:dataUrl(path.join(PKG,'characters','combat','pistol_strip.png')),width:1800,height:360,category:'character',view:'both'});
const bundle=C.validateBundle({project:p,assets});
bundle.savedWith='Combat Room v0.1 generator';
const out=path.join(PKG,'examples','Combat_Test_Room.room.json');fs.writeFileSync(out,JSON.stringify(bundle));
console.log('wrote',out,(fs.statSync(out).size/1e6).toFixed(2),'MB ·',bundle.project.rooms.length,'rooms ·',bundle.project.openings.length,'openings ·',(bundle.project.pillars||[]).length,'boxes ·',vertices.length,'route points ·',edges.length,'route pieces ·',nodes.length,'spots ·',actors.length,'bots');
