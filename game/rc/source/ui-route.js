/* ===================== 0.16.1 R4 · ui-route.js — LEGACY ROUTE WALK + ENCOUNTER MOVEMENT PREVIEW + R4 AUTHORING FIXTURE =====================
   Tests Trapstar's route-based movement (design doc: "Routing, Player Movement, NPC Lanes…").
   - The player walks an authored route network: forward / back, a narrow strafe band, independent free look,
     90-degree movement-facing turns, branch choice at junctions from movement facing (never camera look), and
     branches that a closed door blocks.
   - NPCs walk parallel lanes, use shared nodes with strict occupancy, gather in a zone, and only appear or
     leave where the player cannot see (corners, doors, far route ends).
   - NPCs are placeholder cards: FRONT, 3/4 and BACK (SIDE only as a diagnostic) with "rubber-band"
     rotation toward the camera, hysteresis against flicker, and an independent head.
   - Every hidden decision is drawn by the debug overlay and counted in the stats panel.
   Nothing here edits the project: door changes made while walking are put back when you leave. */
const RW_DEFAULTS={strafe:.7,branchCone:40,lookYaw:180,lookUp:30,lookDown:35,turnTime:.4,walk:1.45,back:.9,strafeSpeed:1.1,sprint:2.6,stamina:3.5,fov:75,eye:1.62,crouchEye:1.05,
  rubber:25,tolerance:18,hysteresis:12,nearHyst:true,headMax:65,headRubber:35,distCheat:true,allowSide:false,allowBackQ:false,debug:2,bob:true,noticeDist:70,mouseSens:.12,
  charHeads:true,charShadow:true,charPixel:true,charLight:.92};
// R2 keeps the accepted R1.2.1 Encounter-style preview unchanged: the player expresses travel intent with gaze + W; the authored route graph stays the physical constraint.
const RW_ENCOUNTER_DEFAULTS={lookYaw:105,branchCone:110,turnTime:.18};
const RW_CLASS={background:{rubber:180,label:'background · billboard'},stationary:{rubber:45,label:'stationary · heavy cheat'},pedestrian:{rubber:null,label:'pedestrian'},combatant:{rubber:15,label:'combatant · careful'}};
const RW_VIEW_ANGLE={front:0,q:45,side:90,bq:135,back:180,F:0,Q:45,S:90,BQ:135,B:180};
const RW_VIEW_LABEL={front:'FRONT',q:'3/4',side:'SIDE',bq:'BACK 3/4',back:'BACK'};
const RW_VIEW_COLOR={front:'#52c27a',q:'#e2b43c',side:'#e05656',bq:'#a879e6',back:'#5b8fd9'};
const RW={on:false,control:'legacy',settings:{...RW_DEFAULTS},net:null,graph:null,pl:null,npcs:[],cars:[],nodes:[],lanes:new Map(),zones:[],t:0,raf:0,last:0,in:{},locked:false,drag:null,msg:null,msgT:0,
  doorsBefore:null,sight:null,stats:null,rng:Math.random,meshes:null,hud:null,panelT:0,paused:false,showMap:true,markSees:false,markWhy:'',
  /* vehicle-loop adaptation: separate deterministic clock/RNG so traffic density and driver variety do not perturb NPC behavior */
  vehicleLoop:false,vehicleCfg:null,carRng:Math.random,carSerial:0,carClock:0,carAcc:0,carNextSpawn:0,carContacts:new Set(),vehicleImpactKeys:new Set(),vehicleEvents:[]};
const rwWrap=a=>((a%360)+540)%360-180;
const RW_AIM_Y=.42; // the cross sits where the camera actually points (the level horizon line of this lens), not at the frame centre
function rwMulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const rwEase=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
const rwDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function rwSay(text,ms=2600){RW.msg=text;RW.msgT=performance.now()+ms;}

// ------------------------------------------------------------------ R4 built-in Encounter movement test room
// Opens by default in retrofit builds. The New button still creates the normal blank Room Creator project.
function rwEncounterTestProject(){
  const p=C.newProject(),r=p.rooms[0];p.name='Encounter movement test room · R4';Object.assign(r,{name:'Encounter seed room',x:0,y:0,width:10,length:8});
  // The permanent fixture mirrors the Encounter Lab proof, including the door lesson learned there:
  // normal route -> always-legal approach -> short gated doorway segment. A closed door never blocks the approach itself.
  const doorA=C.createOpening(p,r.id,'N',1.45,'door',{name:'Door A',width:1.1,height:2.2,open:false,frameColor:'#242a2d',panelColor:'#665143'});
  const doorB=C.createOpening(p,r.id,'N',7.45,'door',{name:'Door B',width:1.1,height:2.2,open:false,frameColor:'#242a2d',panelColor:'#665143'});
  const V=(id,name,x,y,extra={})=>({id,name,x,y,story:0,...extra}), E=(id,name,a,b,band=.6,door=null,extra={})=>({id,name,a,b,band,...(door?{door}: {}),...extra});
  const DN=(id,name,x,y,door,vertex,side)=>({id,name,x,y,story:0,facing:0,types:['door','approach','interact'],door,doorSide:side,vertex,radius:.78,reach:true});
  p.routeNet={version:1,movementSchema:'rc-movement-net@0.1',settings:{seed:2601,start:{edge:'e_c_s',s:1,dir:-1},defaults:{},note:'Built-in R4 Encounter movement fixture · 10×8 room · 3×3 route grid · two closed doors with always-legal approach anchors and short gated segments; topology validates clear.'},
    vertices:[V('v_doorA','Door A threshold',2,.6,{doorApproach:{door:doorA.id,side:'h+',role:'threshold',sourceVertex:'v_2_2'}}),V('v_doorB','Door B threshold',8,.6,{doorApproach:{door:doorB.id,side:'h+',role:'threshold',sourceVertex:'v_8_2'}}),V('v_doorA_approach','Door A approach',2,.9,{doorApproach:{door:doorA.id,side:'h+',role:'approach',sourceVertex:'v_2_2'}}),V('v_doorB_approach','Door B approach',8,.9,{doorApproach:{door:doorB.id,side:'h+',role:'approach',sourceVertex:'v_8_2'}}),V('v_2_2','NW',2,2),V('v_5_2','N centre',5,2),V('v_8_2','NE',8,2),V('v_2_4','W centre',2,4),V('v_5_4','Centre',5,4),V('v_8_4','E centre',8,4),V('v_2_6','SW',2,6),V('v_5_6','S centre',5,6),V('v_8_6','SE',8,6)],
    edges:[E('e_n_w','North row · west','v_2_2','v_5_2'),E('e_n_e','North row · east','v_5_2','v_8_2'),E('e_m_w','Middle row · west','v_2_4','v_5_4'),E('e_m_e','Middle row · east','v_5_4','v_8_4'),E('e_s_w','South row · west','v_2_6','v_5_6'),E('e_s_e','South row · east','v_5_6','v_8_6'),E('e_w_n','West column · north','v_2_2','v_2_4'),E('e_w_s','West column · south','v_2_4','v_2_6'),E('e_c_n','Centre column · north','v_5_2','v_5_4'),E('e_c_s','Centre column · south','v_5_4','v_5_6'),E('e_e_n','East column · north','v_8_2','v_8_4'),E('e_e_s','East column · south','v_8_4','v_8_6'),E('e_doorA_approach','Door A approach','v_2_2','v_doorA_approach',.3,null,{doorApproach:{door:doorA.id,side:'h+',role:'link'}}),E('e_doorA_gate','Door A gated threshold','v_doorA_approach','v_doorA',.3,doorA.id,{doorApproach:{door:doorA.id,side:'h+',role:'gate'}}),E('e_doorB_approach','Door B approach','v_8_2','v_doorB_approach',.3,null,{doorApproach:{door:doorB.id,side:'h+',role:'link'}}),E('e_doorB_gate','Door B gated threshold','v_doorB_approach','v_doorB',.3,doorB.id,{doorApproach:{door:doorB.id,side:'h+',role:'gate'}})],
    lanes:[],nodes:[DN('N_doorA','At Door A',2,.9,doorA.id,'v_doorA_approach','h+'),DN('N_doorB','At Door B',8,.9,doorB.id,'v_doorB_approach','h+')],zones:[],portals:[],traffic:[],actors:[]};
  return C.validateBundle({project:p,assets:[]}).project;
}
function rwLoadEncounterTestRoom(){
  const run=()=>{if(RW.on)rwStop();operation++;project=rwEncounterTestProject();catalog=new Map();R=new window.RCRenderer(catalog);GLE?.setLegacy(R);freeCam=null;stopRail();RR?.clearCaches();roomId=project.rooms[0].id;activeStory=0;viewId=null;active='iso';selection={kind:'room',id:roomId};pane='movement';panel='room';tool='select';pending=null;mode='build';walkId=null;history=[];redo=[];dirty=false;lastProbe=null;if(typeof MN!=='undefined'){MN.sel=null;MN.mode='select';MN.connectFrom=null;MN.drag=null;MN.doorSel=null;}fit();clearTimeout(saveTimer);$('saveStatus').textContent='Built-in Encounter movement test room R4 · New = blank project';document.title='TRAPSTAR · Room Creator v0.16.1 · Encounter retrofit R4';$('recovery').classList.add('hidden');refresh();};
  if(dirty)ask('Load the built-in Encounter test room?','Unsaved edits in the current working project will be replaced. Saved files remain unchanged.',run,'Load test room');else run();
}

// ------------------------------------------------------------------ route graph (player)
function rwBuildGraph(net){
  const verts=new Map();for(const v of net.vertices)verts.set(v.id,{...v,edges:[]});const edges=[];
  for(const e of net.edges){const A=verts.get(e.a),B=verts.get(e.b);if(!A||!B)continue;const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy);if(len<.05)continue;const hd=C.heading(A,B),b=C.basis(hd);
    const E={...e,A,B,len,hd,ux:dx/len,uy:dy/len,rx:b.rx,ry:b.ry};edges.push(E);A.edges.push(E);B.edges.push(E);}
  return {verts,edges,byId:new Map(edges.map(e=>[e.id,e]))};
}
function rwProject(e,p){const dx=p.x-e.A.x,dy=p.y-e.A.y;return {s:dx*e.ux+dy*e.uy,off:dx*e.rx+dy*e.ry};}
function rwRoutePlayerPos(){const P=RW.pl,e=P.edge,t=e.len>1e-9?C.clamp(P.s/e.len,0,1):0,sa=Number.isInteger(e.A.story)?e.A.story:0,sb=Number.isInteger(e.B.story)?e.B.story:sa,za=C.storyElevation(project,sa),zb=C.storyElevation(project,sb),story=t<.5?sa:sb;return {x:e.A.x+e.ux*P.s+e.rx*P.off,y:e.A.y+e.uy*P.s+e.ry*P.off,story,floorZ:za+(zb-za)*t,aboard:false};}
function rwPlayerAboard(){return RW.vehicleWorld?.query('getInteriorActorState','PLAYER')||null;}
function rwPlayerPos(){if(typeof AP!=='undefined'&&AP.on)return apWorldPos();const a=rwPlayerAboard();if(a?.world){const v=RW.vehicleWorld?.query('getVehicleState',a.vehicleId),story=Number.isInteger(a.world.story)?a.world.story:0;return {x:a.world.x,y:a.world.y,story,floorZ:C.storyElevation(project,story),heading:a.world.heading,vehicleHeading:v?.pose?.heading||0,vehicleId:a.vehicleId,local:a.local,aboard:true};}return rwRoutePlayerPos();}
function rwPlayerBaseYaw(){const p=rwPlayerPos();return p?.aboard&&Number.isFinite(p.vehicleHeading)?p.vehicleHeading:0;}
function rwPlayerMoveYaw(){return C.norm(rwPlayerBaseYaw()+(RW.pl?.bodyYaw||0));}
function rwPlayerLookYaw(){return C.norm(rwPlayerBaseYaw()+(RW.pl?.bodyYaw||0)+(RW.pl?.headYaw||0));}
function rwBand(e){return Math.max(0,Math.min(e.band??9,RW.settings.strafe));}
// The strafe band bulges out at "spots" (doorway, behind the car, shop window), so you can step into them
// sideways without leaving the route. side = +1 (the edge's right) or -1 (its left).
function rwBandSide(e,s,side){let b=rwBand(e);for(const nd of RW.nodes){if(nd.edge!==e||Math.sign(nd.off)!==side)continue;const w=Math.abs(s-nd.s),full=Math.abs(nd.off);if(w<.35)b=Math.max(b,full);else if(w<.95)b=Math.max(b,full+(rwBand(e)-full)*(w-.35)/.6);}return b;}
function rwAttachNodes(){for(const nd of RW.nodes){nd.edge=null;if(nd.reach===false)continue;const ns=Number.isInteger(nd.story)?nd.story:0;let best=null,bd=1.9;for(const e of RW.graph.edges){const sa=Number.isInteger(e.A.story)?e.A.story:0,sb=Number.isInteger(e.B.story)?e.B.story:sa;if(sa!==sb||sa!==ns)continue;const pr=rwProject(e,nd);if(pr.s<.3||pr.s>e.len-.3)continue;const a=Math.abs(pr.off);if(a<bd){bd=a;best={e,...pr};}}if(best){nd.edge=best.e;nd.s=best.s;nd.off=best.off;}}}
function rwDoor(id){return project.openings.find(o=>o.id===id)||null;}
function rwEdgeBlock(e){if(e.door){const o=rwDoor(e.door);if(o&&o.kind==='door'&&!o.open)return (o.name||'The door')+' is closed — press E to open it';}if(e.gate===false)return (e.name||'This way')+' is blocked';return null;}
function rwChooseExit(V,moveYaw){
  const cands=V.edges.map(e=>({e,out:e.A===V?e.hd:C.norm(e.hd+180)}));if(!cands.length)return null;
  let best=null,bd=Math.max(46,RW.settings.branchCone);for(const c of cands){const d=Math.abs(rwWrap(c.out-moveYaw));if(d<bd){bd=d;best=c;}}
  if(!best)return {none:true};
  return {edge:best.e,out:best.out,blocked:rwEdgeBlock(best.e)};
}
// junction choices are relative to MOVEMENT facing, never free look (legacy Route Walk)
function rwExitsAhead(){ // legacy labels are body-relative; Encounter preview labels the next junction relative to current LOOK
  const P=RW.pl,e=P.edge,towardB=RW.control==='encounter'?P.dir>0:Math.abs(rwWrap(e.hd-P.bodyYaw))<=Math.abs(rwWrap(C.norm(e.hd+180)-P.bodyYaw)),d=towardB?e.len-P.s:P.s;if(d>6)return null;const V=towardB?e.B:e.A;if(V.edges.length<2&&d>2)return null;const ref=RW.control==='encounter'?rwEncounterWorldLook():P.bodyYaw;
  const out=V.edges.map(x=>{const o=x.A===V?x.hd:C.norm(x.hd+180),rel=rwWrap(o-ref);return {name:x.name||'route',rel,blocked:rwEdgeBlock(x)};});
  return {dist:d,out,dead:!out.length};
}
function rwSwitchEdge(ne,V,forward){
  const P=RW.pl,pos=rwPlayerPos(),fromA=ne.A===V,pr=rwProject(ne,pos);P.edge=ne;P.s=pr.s;P.off=pr.off;
  const newDir=forward?(fromA?1:-1):(fromA?-1:1),newBody=newDir>0?ne.hd:C.norm(ne.hd+180),delta=rwWrap(newBody-P.bodyYaw);P.dir=newDir;
  P.viewHold=P.bodyYaw+P.headYaw;P.bodyTurn={from:P.bodyYaw,delta,t:0,dur:Math.max(.12,Math.abs(delta)/360*.9)};RW.stats.junctions++;
}
function rwMoveAlongLegacy(dist){
  const P=RW.pl,forward=dist>0;let rem=Math.abs(dist);
  for(let guard=0;guard<6&&rem>1e-7;guard++){
    const e=P.edge,desired=C.norm(P.bodyYaw+(forward?0:180)),dPos=Math.abs(rwWrap(e.hd-desired)),dNeg=Math.abs(rwWrap(C.norm(e.hd+180)-desired));
    let travel=dPos<=dNeg?1:-1,aligned=Math.min(dPos,dNeg)<=45;const atA=P.s<=1e-5,atB=P.s>=e.len-1e-5;
    // Away from a junction, the authored route must actually run in the movement-facing direction.
    // Free look is never consulted here.
    if(aligned&&!((atA&&travel<0)||(atB&&travel>0))){
      P.dir=forward?travel:-travel;const avail=travel>0?e.len-P.s:P.s,step=Math.min(rem,Math.max(0,avail));P.s+=travel*step;rem-=step;if(rem<=1e-7)return true;
    }
    const V=P.s<=1e-5?e.A:P.s>=e.len-1e-5?e.B:null;
    if(!V){P.stop='No route in movement-facing direction — Q turns left, R turns right';P.vAlong=0;return false;}
    if(V.edges.length>=3&&P.junctionLatch!==V.id){P.junctionLatch=V.id;P.junctionNeedsRelease=true;P.stop='Intersection — release W/S, use Q/R if turning, then move again';P.vAlong=0;return false;}
    if(P.junctionLatch===V.id&&P.junctionNeedsRelease){P.vAlong=0;return false;}
    const ch=rwChooseExit(V,desired);
    if(!ch){P.stop='End of route — use Q / R to change movement facing';P.vAlong=0;return false;}
    if(ch.none){P.stop='Intersection — Q/R sets movement facing; release and press W/S again';P.vAlong=0;return false;}
    if(ch.blocked){P.stop=ch.blocked;P.vAlong=0;return false;}
    rwSwitchEdge(ch.edge,V,forward);P.junctionLatch=null;P.junctionNeedsRelease=false;
  }
  return rem<=1e-7;
}
function rwEncounterWorldLook(){const P=RW.pl;return C.norm(P.bodyYaw+P.headYaw);}
function rwEncounterExit(V,desired,forward=true){
  const P=RW.pl,all=V.edges.map(e=>({e,out:e.A===V?e.hd:C.norm(e.hd+180)}));if(!all.length)return null;
  // Going forward normally should not U-turn back onto the edge just travelled when another continuation exists.
  // R1.2.1: at a true single-exit endpoint, however, the edge just travelled IS the only legal way out.
  // If the player's gaze is pointed generally back into that exit, W takes it immediately instead of making the
  // player fight a dead-end resolver. Looking outward still leaves the player at the authored endpoint (no bounce).
  let cands=forward?all.filter(c=>c.e!==P.edge):all;
  if(forward&&!cands.length){
    if(all.length===1){const only=all[0],d=Math.abs(rwWrap(only.out-desired)),cone=Math.max(46,RW.settings.branchCone);if(d<=cone)return {...only,blocked:rwEdgeBlock(only.e),singleExit:true};}
    return null;
  }
  if(!cands.length)cands=all;
  if(cands.length===1)return {...cands[0],blocked:rwEdgeBlock(cands[0].e)};
  cands.sort((a,b)=>Math.abs(rwWrap(a.out-desired))-Math.abs(rwWrap(b.out-desired))||String(a.e.id).localeCompare(String(b.e.id)));
  return {...cands[0],blocked:rwEdgeBlock(cands[0].e)};
}
function rwMoveAlongEncounter(dist){
  const P=RW.pl,forward=dist>0;let rem=Math.abs(dist);
  for(let guard=0;guard<8&&rem>1e-7;guard++){
    const e=P.edge,travel=forward?P.dir:-P.dir,avail=travel>0?e.len-P.s:P.s,step=Math.min(rem,Math.max(0,avail));P.s+=travel*step;rem-=step;if(rem<=1e-7)return true;
    const V=P.s<=1e-5?e.A:P.s>=e.len-1e-5?e.B:null;if(!V){P.vAlong=0;return false;}
    const desired=forward?rwEncounterWorldLook():C.norm((P.dir>0?e.hd:C.norm(e.hd+180))+180),ch=rwEncounterExit(V,desired,forward);
    if(!ch){const o=e.door?rwDoor(e.door):null;P.stop=o&&o.open?`${o.name||'Door'} doorway reached — this test network has no authored space beyond it`:'End of authored movement network';P.vAlong=0;return false;}
    if(ch.blocked){P.stop=ch.blocked;P.vAlong=0;return false;}
    rwSwitchEdge(ch.e,V,forward);P.stop=null;P.junctionLatch=null;P.junctionNeedsRelease=false;
  }
  return rem<=1e-7;
}
function rwMoveAlong(dist){return RW.control==='encounter'?rwMoveAlongEncounter(dist):rwMoveAlongLegacy(dist);}
function rwFaceMoveEncounter(yaw,label='Body turn'){
  const P=RW.pl;if(!P)return;const target=C.norm(yaw),delta=rwWrap(target-P.bodyYaw);if(Math.abs(delta)<1)return;
  P.bodyTurn={from:P.bodyYaw,delta,t:0,dur:Math.max(.10,Math.abs(delta)/90*RW.settings.turnTime),carryHead:true};P.vAlong=0;P.vSide=0;P.stop=null;RW.stats.movementQuarterTurns=(RW.stats.movementQuarterTurns||0)+Math.round(Math.abs(delta)/90);rwSay(label+' '+rwCardinalName(target)+' · '+Math.round(target)+'°',1200);rwUpdateHud();drawSoon();
}
function rwQuarterMoveEncounter(dir){const P=RW.pl;if(P)rwFaceMoveEncounter(C.norm(P.bodyYaw+(dir<0?-90:90)),dir<0?'Turn left':'Turn right');}
function rwSnapViewToBody(){const P=RW.pl;if(!P)return;P.headYaw=0;if(P.bodyTurn)P.viewHold=P.bodyYaw;rwSay('View recentered to body forward',1000);rwUpdateHud();drawSoon();}
// ------------------------------------------------------------------ sight lines (walls with see-through openings, solid boxes with heights)
function rwBuildSight(){
  const walls=[];
  for(const w of C.roomWalls(project)){const story=Number.isInteger(w.story)?w.story:0,base=C.storyElevation(project,story),cap=C.wallCap(project,w);if(cap<.5)continue;
    const holes=C.openingsForWall(project,w).filter(o=>o.kind==='passage'||o.kind==='window'||(o.kind==='door'&&o.open)).map(o=>{const l=C.openingLine(project,o),z0=o.kind==='passage'?base-.05:base+(o.bottom||0),z1=o.kind==='passage'?base+cap+.05:base+(o.bottom||0)+o.height;return {a:l.start,b:l.end,z0,z1};});
    walls.push({axis:w.axis,fixed:w.fixed,start:w.start,end:w.end,z0:base,z1:base+cap,holes,story});}
  // boxes in their own frame (centre, unit axis u, half sizes) so turned 3D objects work too
  const boxes=(project.pillars||[]).filter(q=>q.height>=.5).map(q=>{const z0=C.storyElevation(project,q.story||0);return {cx:q.x,cy:q.y,ux:1,uy:0,hu:q.width/2,hv:q.depth/2,z0,h:z0+q.height,name:q.name,story:q.story||0};});
  RW.propBoxes=[];
  for(const q of project.props||[]){if(q.enabled===false||q.collision?.solid===false)continue;const fz=C.propFloorZ(project,q),fp=C.propFootprint(q,(project.objectLibrary?.setups||{})[q.asset],null,fz);if(fp.z1-fp.z0<.3)continue;
    const name=q.name||window.RCAssets?.entry(q.asset)?.name||'object';let box;
    if(fp.shape==='cylinder'){const c=fp.poly.reduce((a,v)=>({x:a.x+v.x/fp.poly.length,y:a.y+v.y/fp.poly.length}),{x:0,y:0}),r=Math.max(...fp.poly.map(v=>Math.hypot(v.x-c.x,v.y-c.y)));box={cx:c.x,cy:c.y,ux:1,uy:0,hu:r,hv:r};}
    else{const [p0,p1,,p3]=fp.poly,lu=Math.hypot(p1.x-p0.x,p1.y-p0.y)||1e-6,lv=Math.hypot(p3.x-p0.x,p3.y-p0.y)||1e-6;box={cx:(p0.x+p1.x+fp.poly[2].x+p3.x)/4,cy:(p0.y+p1.y+fp.poly[2].y+p3.y)/4,ux:(p1.x-p0.x)/lu,uy:(p1.y-p0.y)/lu,hu:lu/2,hv:lv/2};}
    Object.assign(box,{z0:fp.z0,h:fp.z1,name,prop:q.id,poly:fp.poly,story:q.story||0});boxes.push(box);RW.propBoxes.push(box);}
  RW.sight={walls,boxes};
}
// Is the straight line from a (height za) to b (height zb) clear? Returns null when clear, or what blocks it.
function rwSightBlock(a,za,b,zb,{ignoreBoxesBelow=0}={}){
  const S=RW.sight;if(!S)return null;const dx=b.x-a.x,dy=b.y-a.y;
  for(const w of S.walls){const den=w.axis==='h'?dy:dx;if(Math.abs(den)<1e-9)continue;const t=((w.fixed-(w.axis==='h'?a.y:a.x))/den);if(t<=1e-4||t>=1-1e-4)continue;
    const pos=(w.axis==='h'?a.x+dx*t:a.y+dy*t);if(pos<w.start-1e-6||pos>w.end+1e-6)continue;const z=za+(zb-za)*t;if(z<w.z0||z>w.z1)continue;
    if(w.holes.some(o=>pos>=o.a&&pos<=o.b&&z>=o.z0&&z<=o.z1))continue;return 'wall';}
  for(const q of S.boxes){if(q.h-q.z0<ignoreBoxesBelow)continue;let t0=0,t1=1;const vx=-q.uy,vy=q.ux,ax=a.x-q.cx,ay=a.y-q.cy;
    for(const [p0,d,lo,hi] of [[ax*q.ux+ay*q.uy,dx*q.ux+dy*q.uy,-q.hu,q.hu],[ax*vx+ay*vy,dx*vx+dy*vy,-q.hv,q.hv]]){if(Math.abs(d)<1e-9){if(p0<lo||p0>hi){t0=2;break;}continue;}let u0=(lo-p0)/d,u1=(hi-p0)/d;if(u0>u1)[u0,u1]=[u1,u0];t0=Math.max(t0,u0);t1=Math.min(t1,u1);if(t0>t1)break;}
    if(t0<=t1&&t1>0&&t0<1){const zA=za+(zb-za)*Math.max(0,t0),zB=za+(zb-za)*Math.min(1,t1);if(Math.min(zA,zB)<q.h&&Math.max(zA,zB)>(q.z0||0))return q.name||'solid object';}}
  return null;
}
function rwCam(){const P=RW.pl,p=rwPlayerPos();return {x:p.x,y:p.y,story:p.story,floorZ:p.floorZ,z:p.floorZ+P.eye+P.bobZ,yaw:rwPlayerLookYaw()};}
// Could the player notice something at p right now? Used to forbid visible spawning and despawning.
// reach:true asks "could the player see it just by turning their head?" (body yaw ± look limit ± half the lens),
// which is the safe test for spawning and despawning: a spot merely outside this frame is not good enough.
function rwVisible(p,{notice=RW.settings.noticeDist,reach=true}={}){
  const c=rwCam(),d=rwDist(c,p);if(d<.5)return true;if(d>notice)return false;
  const S=RW.settings,ang=reach?Math.abs(rwWrap(C.heading(c,p)-rwPlayerMoveYaw())):Math.abs(rwWrap(C.heading(c,p)-c.yaw)),lim=reach?S.lookYaw+S.fov/2+10:S.fov/2+14;if(ang>lim)return false;
  const base=Number.isFinite(p.floorZ)?p.floorZ:C.storyElevation(project,Number.isInteger(p.story)?p.story:0);return !rwSightBlock(c,c.z,p,base+1.0,{ignoreBoxesBelow:1.8})||!rwSightBlock(c,c.z,p,base+1.7,{ignoreBoxesBelow:1.8});
}
// ------------------------------------------------------------------ lanes, nodes, zones
function rwLane(l){const story=Number.isInteger(l.story)?l.story:Number.isInteger(l.points?.[0]?.story)?l.points[0].story:0,pts=l.points.map(q=>({x:q.x,y:q.y,story:Number.isInteger(q.story)?q.story:story})),cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+rwDist(pts[i-1],pts[i]));return {...l,story,pts,cum,len:cum[cum.length-1]};}
function rwLanePose(l,s){s=C.clamp(s,0,l.len);let i=1;while(i<l.pts.length-1&&l.cum[i]<s)i++;const a=l.pts[i-1],b=l.pts[i],span=l.cum[i]-l.cum[i-1],t=span>1e-9?(s-l.cum[i-1])/span:0,hd=C.heading(a,b),bs=C.basis(hd);
  const sa=Number.isInteger(a.story)?a.story:(l.story||0),sb=Number.isInteger(b.story)?b.story:sa,story=t<.5?sa:sb,floorZ=C.storyElevation(project,sa)+(C.storyElevation(project,sb)-C.storyElevation(project,sa))*t;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,story,floorZ,hd,fx:bs.fx,fy:bs.fy,rx:bs.rx,ry:bs.ry};}
function rwLaneProject(l,p){let best={s:0,d:Infinity};for(let i=1;i<l.pts.length;i++){const a=l.pts[i-1],b=l.pts[i],dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy,t=L2?C.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L2,0,1):0,x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(p.x-x,p.y-y);if(d<best.d)best={s:l.cum[i-1]+Math.sqrt(L2)*t,d};}return best;}
function rwNode(id){return RW.nodes.find(n=>n.id===id)||null;}
function rwActorStory(n){if(Number.isInteger(n?.story))return n.story;if(Number.isInteger(n?.node?.story))return n.node.story;if(Number.isInteger(n?.lane?.story))return n.lane.story;return Number.isInteger(n?.actor?.story)?n.actor.story:0;}
function rwActorFloor(n){if(typeof AP!=='undefined'&&AP.on&&n.physical)return n.physical.z;return C.storyElevation(project,rwActorStory(n));}
// ------------------------------------------------------------------ NPCs and traffic
function rwMakeNpc(a){
  const cls=RW_CLASS[a.cls]?a.cls:'pedestrian';
  return {id:a.id,actor:a,name:a.name,role:a.role||'walker',cls,views:a.views||['front','q','back'],state:'hidden',lane:a.lane?RW.lanes.get(a.lane):null,s:0,off:0,offT:0,x:0,y:0,facing:0,
    baseSpeed:a.speed||1.25,speed:0,cycle:0,node:null,slot:null,timer:0,respawnAt:a.delay||0,divert:'',view:null,vsign:1,planeYaw:0,plane:0,resid:0,err:0,theta:0,band:'F',
    h:{view:null,vsign:1,planeYaw:0,plane:0},sh:{view:null,vsign:1},sets:Object.fromEntries(Object.keys(RW_SETS).map(k=>[k,{view:null,vsign:1}])),head:0,headT:0,attn:false,glanceT:0,flourish:0,flourishT:6+RW.rng()*6,onScreen:false,dist:99,switches:0,moving:false,lastAlong:null,scan:0,
    /* 0.15 characters: which character pack draws this NPC, and which lane it uses next time it comes back */
    charId:a.character||null,laneIdx:Math.max(0,(a.lanes||[]).indexOf(a.lane)),hitT:0,pose:null,phonePlan:null,tried:null};
}
function rwSpawnAtLaneStart(n){const l=n.lane;if(!l)return false;if(l.door&&!rwDoor(l.door)?.open)return false;const p=rwLanePose(l,0);if(rwVisible(p))return false;
  if(RW.npcs.some(m=>m!==n&&m.state!=='hidden'&&rwActorStory(m)===p.story&&rwDist(m,p)<2.4))return false;
  Object.assign(n,{state:'walk',s:0,off:0,offT:0,x:p.x,y:p.y,story:p.story,facing:p.hd,divert:'',node:null});if(rwVisible(p))RW.stats.spawnInView++;RW.stats.spawns++;return true;}
function rwDespawn(n,why){if(rwVisible(n))RW.stats.despawnInView++;RW.stats.despawns++;if(n.node){const nd=n.node;if(nd.occ===n.id)nd.occ=null;if(nd.res===n.id)nd.res=null;}
  Object.assign(n,{state:'hidden',node:null,respawnAt:RW.t+(n.actor.respawn??(5+RW.rng()*8)),divert:'',view:null,onScreen:false,loiterTried:false,insideNode:null,lastAlong:null});n.h.view=null;n.sh.view=null;for(const st of Object.values(n.sets))st.view=null;if(n.role==='mark'||n.charId){n.hit=false;}
  /* 0.15: a character with a list of lanes takes the next one each time it comes back, so three people can use the whole street */
  n.hitT=0;n.phonePlan=null;n.tried=null;const ls=n.actor.lanes;if(Array.isArray(ls)&&ls.length){n.laneIdx=(n.laneIdx+1)%ls.length;const L=RW.lanes.get(ls[n.laneIdx]);if(L&&!RW.cars.some(c=>c.lane===L))n.lane=L;}}
function rwRelease(n){if(n.node){if(n.node.occ===n.id)n.node.occ=null;if(n.node.res===n.id)n.node.res=null;}n.node=null;}
function rwReserve(n,node,why){node.res=n.id;n.node=node;n.divert=why;n.state='toNode';n.lastAlong=null;}
function rwPlayerAlong(n){ // how far ahead of the player the NPC is, along the player's travel direction
  const P=RW.pl,p=rwPlayerPos();if(rwActorStory(n)!==p.story)return {along:999,lat:999};const move=rwPlayerMoveYaw(),dir=C.basis(P.vAlong>=0?move:move+180);return {along:(n.x-p.x)*dir.fx+(n.y-p.y)*dir.fy,lat:Math.abs((n.x-p.x)*dir.rx+(n.y-p.y)*dir.ry)};}
function rwTryDivert(n,types,why,{ahead=[1.5,12],maxLane=1.8}={}){
  const l=n.lane;if(!l)return false;let best=null,bd=Infinity;
  for(const nd of RW.nodes){if((nd.story??0)!==l.story||nd.occ||nd.res||!nd.types.some(t=>types.includes(t)))continue;const pr=rwLaneProject(l,nd);if(pr.d>maxLane)continue;const da=pr.s-n.s;if(da<ahead[0]||da>ahead[1])continue;if(da<bd){bd=da;best=nd;}}
  if(!best)return false;rwReserve(n,best,why);return true;
}
function rwObstacles(n){const out=[],story=rwActorStory(n),p=rwPlayerPos();if(!p.aboard&&p.story===story)out.push({x:p.x,y:p.y,player:true,moving:Math.abs(RW.pl.vAlong)>.2});for(const m of RW.npcs)if(m!==n&&m.state!=='hidden'&&rwActorStory(m)===story)out.push({x:m.x,y:m.y,npc:m,moving:m.moving,speed:m.speed,facing:m.facing});return out;}
function rwStepToward(n,target,speed,dt){const d=rwDist(n,target);if(d<1e-3)return true;const st=Math.min(d,speed*dt);n.facing=C.norm(n.facing+C.clamp(rwWrap(C.heading(n,target)-n.facing),-300*dt,300*dt));n.x+=(target.x-n.x)/d*st;n.y+=(target.y-n.y)/d*st;n.cycle+=st;n.moving=true;n.speed=speed;return d-st<.02;}
function rwTurnTo(n,yaw,dt,rate=220){n.facing=C.norm(n.facing+C.clamp(rwWrap(yaw-n.facing),-rate*dt,rate*dt));}
function rwNpcStep(n,dt){
  n.moving=false;
  if(n.state==='hidden'){if(RW.t>=n.respawnAt){if(n.role==='loiter'){const z=RW.zones.find(z=>z.id===n.actor.zone),slot=z?.slots[n.actor.slot||0];if(slot&&!rwVisible(slot)){Object.assign(n,{state:'loiter',x:slot.x,y:slot.y,story:Number.isInteger(slot.story)?slot.story:(z.story||0),facing:slot.facing});RW.stats.spawns++;}else n.respawnAt=RW.t+1;}else if(!rwSpawnAtLaneStart(n))n.respawnAt=RW.t+.5;}return;}
  if(n.hitT>0){n.hitT-=dt;n.moving=false;n.speed=0;return;} /* 0.15: a shot character flinches on the spot first */
  if((n.role==='mark'||n.charId)&&n.hit&&n.state!=='walk'&&n.state!=='rejoin'&&n.state!=='inside'){rwRelease(n);n.state='rejoin';n.rejoinS=null;}
  switch(n.state){
    case 'walk':{const l=n.lane;
      // Same-direction passing should be rare: if the player is catching up, step into a free spot ahead or keep pace.
      if(l.side==='near'&&!n.hit){const P=RW.pl,pa=rwPlayerAlong(n),same=Math.abs(rwWrap(n.facing-(P.vAlong>=0?P.bodyYaw:P.bodyYaw+180)))<45;
        if(same&&P.vAlong>.4&&pa.along>.4&&pa.along<7&&pa.lat<3.2){if(!rwTryDivert(n,['loiter','door','hide','cover'],'overtake'))n.boost=Math.max(n.boost||0,RW.pl.vAlong+.12-n.baseSpeed);}
        else n.boost=Math.max(0,(n.boost||0)-dt*.5);
        if(n.state==='walk'&&pa.lat<1.9&&same&&Math.abs(P.vAlong)>.2){if(n.lastAlong!=null&&n.lastAlong>0&&pa.along<=0){RW.stats.overtakes++;}n.lastAlong=pa.along;}else n.lastAlong=null;}
      if(n.state!=='walk')break;
      if(n.actor.divertAt&&!n.hit){const nd=rwNode(n.actor.divertAt);if(nd&&(nd.story??0)===l.story&&!nd.occ&&!nd.res){const pr=rwLaneProject(l,nd);if(pr.s-n.s>0&&pr.s-n.s<1.2){rwReserve(n,nd,n.role==='mark'?'watch':'stop');break;}}}
      // 0.15: a walker may stop at any free hangout spot it passes (doorway, shop window), each spot rolled once per walk
      if(n.actor.loiterChance&&!n.hit){const tried=n.tried||(n.tried=new Set());let picked=null;
        for(const nd of RW.nodes){if((nd.story??0)!==l.story||tried.has(nd.id)||nd.occ||nd.res||!nd.types.includes('loiter'))continue;const pr=rwLaneProject(l,nd);if(pr.d>1.9)continue;const da=pr.s-n.s;if(da<1.5||da>5)continue;
          tried.add(nd.id);if(RW.rng()<n.actor.loiterChance){picked=nd;break;}}
        if(picked){rwReserve(n,picked,'stop');break;}}
      // Lane walking with a small sideways allowance to step round whoever is in the way.
      // The lane says how far each side its walkers may step (offMin/offMax, metres, + = walker's right),
      // so nobody steps through the newspaper boxes. After waiting 2.5 s they squeeze a little further.
      const lp=rwLanePose(l,n.s);let speed=n.baseSpeed+(n.boost||0)+(n.hit?1.6:0);
      const relax=(n.waitT||0)>2.5,LO=relax?-.9:(l.offMin??-.6),HI=relax?.9:(l.offMax??.6),obs=[];
      for(const o of rwObstacles(n)){const dx=o.x-lp.x,dy=o.y-lp.y,al=dx*lp.fx+dy*lp.fy,la=dx*lp.rx+dy*lp.ry;if(al<-.5||al>2.2||Math.abs(la)>1.8)continue;
        if(o.npc&&o.moving&&al>.05&&Math.abs(rwWrap(o.facing-lp.hd))<60){if(Math.abs(la-n.off)<.66)speed=Math.min(speed,Math.max(0,(o.speed||0)-.05));continue;}
        obs.push({la,al});}
      const clear=off=>obs.every(o=>Math.abs(off-o.la)>=.66);let target=0;
      if(!clear(0)){const c=obs.flatMap(o=>[o.la-.67,o.la+.67]).filter(x=>x>=LO&&x<=HI&&clear(x)).sort((a,b)=>(Math.abs(a)+.5*Math.abs(a-n.off))-(Math.abs(b)+.5*Math.abs(b-n.off)));target=c.length?c[0]:null;}
      if(target==null){speed=0;n.waitT=(n.waitT||0)+dt;target=n.off;}else n.waitT=Math.max(0,(n.waitT||0)-dt*.5);
      n.offT=target;n.off+=C.clamp(target-n.off,-1.1*dt,1.1*dt);
      if(obs.some(o=>o.al>.05&&o.al<.9&&Math.abs(n.off-o.la)<.6))speed=Math.min(speed,.25);
      n.s+=speed*dt;n.cycle+=speed*dt;n.speed=speed;n.moving=speed>.05;
      const q=rwLanePose(l,n.s);n.x=q.x+q.rx*n.off;n.y=q.y+q.ry*n.off;n.story=q.story;rwTurnTo(n,q.hd,dt);
      if(n.s>=l.len-1e-6){if(rwVisible(n))n.state='waitEnd';else rwDespawn(n,'end');}
      break;}
    case 'toNode':{const nd=n.node;if(!nd){n.state='rejoin';break;}if(nd.occ&&nd.occ!==n.id){rwRelease(n);n.state='rejoin';break;}
      if(rwStepToward(n,nd,n.baseSpeed,dt)){if(nd.occ&&nd.occ!==n.id){rwRelease(n);n.state='rejoin';break;}nd.occ=n.id;nd.res=null;n.state='atNode';n.timer=n.divert==='watch'?(n.actor.watch||35):n.divert==='stop'?(n.actor.stopTime||(5+RW.rng()*6)):n.role==='stoop'?(n.actor.stay||40):999;
        /* 0.15: a character that stops for a while may check its phone in the middle of the stop */
        n.phonePlan=n.charId&&n.divert==='stop'&&n.timer>4&&RW.rng()<.6?{start:n.timer*.75,end:n.timer*.25}:null;}
      break;}
    case 'atNode':{const nd=n.node;rwTurnTo(n,nd.facing,dt,160);n.timer-=dt;
      let leave=n.timer<=0;
      if(n.divert==='overtake'){const pa=rwPlayerAlong(n);if(pa.along<-2.5||rwDist(n,rwPlayerPos())>14||Math.abs(RW.pl.vAlong)<.05&&RW.t-(n.waitStart||(n.waitStart=RW.t))>8)leave=true;}
      if(leave){const doorOk=!nd.door||rwDoor(nd.door)?.open;if(nd.insidePath&&doorOk&&(n.divert==='overtake'||n.actor.useDoor)){n.state='inside';n.insideStep=0;n.insideNode=nd;}else{n.state='rejoin';n.rejoinS=null;}if(nd.occ===n.id)nd.occ=null;n.node=null;n.waitStart=null;}
      break;}
    case 'inside':{const path=n.insideNode?.insidePath||[],tgt=path[n.insideStep];   // through the door and out of sight
      if(!tgt){if(!rwVisible(n))rwDespawn(n,'inside');break;}if(rwStepToward(n,tgt,n.baseSpeed,dt))n.insideStep++;break;}
    case 'rejoin':{const l=n.lane;if(!l){rwDespawn(n,'lost');break;}if(n.rejoinS==null){n.rejoinS=Math.min(l.len,rwLaneProject(l,n).s+1.2);}const q=rwLanePose(l,n.rejoinS);
      if(rwStepToward(n,{x:q.x,y:q.y},n.baseSpeed+(n.hit?1.6:0),dt)){n.s=n.rejoinS;n.off=0;n.state='walk';n.rejoinS=null;}break;}
    case 'waitEnd':{if(!rwVisible(n))rwDespawn(n,'end');break;}
    case 'loiter':{n.timer-=dt;if(n.timer<=0){const z=RW.zones.find(z=>z.id===n.actor.zone),slot=z?.slots[n.actor.slot||0];n.facingT=C.norm((slot?.facing||0)+(RW.rng()-.5)*50);n.timer=8+RW.rng()*7;}
      if(n.facingT!=null)rwTurnTo(n,n.facingT,dt,60);
      if(n.actor.flourish){n.flourishT-=dt;if(n.flourish>0)n.flourish-=dt;else if(n.flourishT<=0&&n.dist<22){n.flourish=2.4;n.flourishT=7+RW.rng()*5;RW.stats.flourishes++;}}
      break;}
  }
}
// Head attention: the head turns toward the player before the whole body changes view.
function rwHeadStep(n,dt){
  const S=RW.settings,c=rwCam(),same=rwActorStory(n)===c.story,rel=rwWrap(C.heading(n,c)-n.facing),d=same?rwDist(n,c):Infinity;let want=0;n.attn=false;
  if(n.combat){if(n.combat.aware&&!n.combat.down){want=rel;n.attn=true;}else{n.scan+=dt;want=Math.sin(n.scan*.5)*40;}} /* Combat v0.1: an aware bot keeps its eyes on you */
  else if(n.role==='mark'){if(RW.markSees){want=rel;n.attn=true;}else{n.scan+=dt;want=Math.sin(n.scan*.7)*48;}}
  else if(n.role==='loiter'){n.glanceT-=dt;if(d<6||(n.glanceT>0&&d<22)){want=rel;n.attn=true;}else if(n.glanceT<-6-RW.rng()*4)n.glanceT=3;}
  else if(d<10&&Math.abs(rel)<115){want=rel;n.attn=true;}
  want=C.clamp(want,-S.headMax,S.headMax);n.head+=C.clamp(rwWrap(want-n.head),-150*dt,150*dt);
}
// Pick the body art for the camera position: keep the current view unless another one fits clearly better
// (hysteresis), rotate the card toward the camera by up to R (rubber band), and record what is left over.
function rwSelectView(st,facing,views,cam,pos,R,H,tol){
  const theta=rwWrap(C.heading(pos,cam)-facing),sign=theta>=0?1:-1;
  const cands=views.map(v=>{const base=RW_VIEW_ANGLE[v],a=(base===0||base===180)?base:base*sign;return {v,a,d:rwWrap(theta-a)};});
  let best=cands.reduce((m,c)=>Math.abs(c.d)<Math.abs(m.d)?c:m);
  const cur=cands.find(c=>c.v===st.view&&(c.a===0||c.a===180||Math.sign(c.a)===st.vsign));
  // Keep the current picture unless another is clearly better (hysteresis H). When the current one is
  // past the rubber band + leftover allowance it may switch sooner, but only to a picture that is actually
  // acceptable; otherwise two equally wrong pictures flicker (this happened in the 3/4-to-BACK gap).
  const gain=cur?Math.abs(cur.d)-Math.abs(best.d):0;
  if(cur&&!(gain>H)&&!(Math.abs(cur.d)>R+tol+H&&Math.abs(best.d)<=R+tol&&gain>2))best=cur;
  const vs=(best.a===0||best.a===180)?1:Math.sign(best.a);st.switched=st.view!=null&&(best.v!==st.view||vs!==st.vsign);
  st.view=best.v;st.vsign=vs;const cheat=C.clamp(best.d,-R,R);st.plane=cheat;st.resid=Math.abs(best.d)-Math.abs(cheat);st.err=Math.abs(best.d);st.theta=theta;st.planeYaw=C.norm(facing+best.a+cheat);
  const at=Math.abs(theta);st.band=at<22.5?'F':at<67.5?'Q':at<112.5?'S':at<157.5?'BQ':'B';return st;
}
function rwNpcViews(n){const ch=rwCharOf(n);if(ch){n.pose=rwCharPose(n,ch);return Object.keys(ch.states[n.pose]||ch.states.stand);} /* 0.15: a character offers the views its pictures have for what it is doing */
  const v=n.views.slice();if(v.length>=3){if(RW.settings.allowSide&&!v.includes('side'))v.push('side');if(RW.settings.allowBackQ&&!v.includes('bq'))v.push('bq');}return v;}
// The same NPC judged by four different art sets at once, so one walk compares them fairly.
const RW_SETS={'FRONT, 3/4, BACK':['front','q','back'],'+ SIDE':['front','q','side','back'],'+ BACK 3/4':['front','q','bq','back'],'+ SIDE + BACK 3/4':['front','q','side','bq','back']};
function rwRubber(n){const S=RW.settings,base=RW_CLASS[n.cls]?.rubber??S.rubber;return Math.min(180,base*(S.distCheat?1+C.clamp((n.dist-8)/25,0,1):1));}
function rwPresent(n){
  const S=RW.settings,c=rwCam();n.dist=rwDist(n,c);
  const Hn=S.hysteresis*(S.nearHyst?C.clamp(4/Math.max(.5,n.dist),1,2.5):1);n.hEff=Hn;
  const wasOn=n.onScreen;rwSelectView(n,n.facing,rwNpcViews(n),c,n,rwRubber(n),Hn,S.tolerance);if(n.switched&&wasOn)n.switches++;
  if(n.views.length>=3&&!n.views.includes('side'))rwSelectView(n.sh,n.facing,[...n.views,'side'],c,n,rwRubber(n),Hn,S.tolerance); // what a SIDE card would have done
  if(n.views.length>=3)for(const [k,vs] of Object.entries(RW_SETS)){const st=n.sets[k];rwSelectView(st,n.facing,vs,c,n,rwRubber(n),Hn,S.tolerance);if(st.switched&&wasOn)st.sw=(st.sw||0)+1;}
  const chH=rwCharOf(n),hv=chH?Object.keys(chH.heads):['F','Q','B'];if(!chH){if(S.allowSide)hv.push('S');if(S.allowBackQ)hv.push('BQ');}rwSelectView(n.h,C.norm(n.facing+n.head),hv,c,n,S.headRubber,8,S.tolerance);
  const ang=Math.abs(rwWrap(C.heading(c,n)-c.yaw)),nf=rwActorFloor(n);n.onScreen=n.dist<80&&ang<S.fov/2+Math.atan2(.35,Math.max(.3,n.dist))*57.3&&(!rwSightBlock(c,c.z,n,nf+1.2)||!rwSightBlock(c,c.z,n,nf+1.65));
}
function rwLegacyCarStep(car,dt){
  if(car.state==='hidden'){if(RW.t>=car.respawnAt){const p=rwLanePose(car.lane,0);if(!rwVisible(p,{notice:RW.settings.noticeDist+40})){Object.assign(car,{state:'drive',s:0,x:p.x,y:p.y,facing:p.hd,speed:car.lane.speed||8.5});RW.stats.carSpawns++;}else car.respawnAt=RW.t+.5;}return;}
  // A car that reaches the end of its lane while you can see that spot pulls over and parks until you look away.
  if(car.state==='parked'){if(!rwVisible(car,{notice:RW.settings.noticeDist+40})){car.state='hidden';car.respawnAt=RW.t+(car.lane.gap||6)+RW.rng()*6;}return;}
  const l=car.lane,p0=rwLanePose(l,car.s),turn=Math.abs(rwWrap(rwLanePose(l,car.s+6).hd-p0.hd));let target=turn>25?4:car.lane.speed||8.5;
  {const f=C.basis(car.facing),pp=rwPlayerPos();car.yieldTo=null;   // cars stop for people (and other cars) in front of them
    for(const o of [pp,...RW.npcs.filter(n=>n.state!=='hidden'&&rwActorStory(n)===(car.lane?.story||0)),...RW.cars.filter(c=>c!==car&&c.state!=='hidden'&&c.yieldTo!==car.id)]){if(o===pp&&pp.story!==(car.lane?.story||0))continue;const dx=o.x-car.x,dy=o.y-car.y,al=dx*f.fx+dy*f.fy,la=Math.abs(dx*f.rx+dy*f.ry),car2=RW.cars.includes(o);if(al>0&&al<(car2?9:7.5)&&la<(car2?2.2:1.7)){target=0;car.yielding=true;if(car2)car.yieldTo=o.id;}}if(target>0)car.yielding=false;}
  car.speed+=C.clamp(target-car.speed,-6*dt,3*dt);car.s+=car.speed*dt;
  const q=rwLanePose(l,car.s);car.x=q.x;car.y=q.y;car.facing=C.norm(car.facing+C.clamp(rwWrap(q.hd-car.facing),-120*dt,120*dt));
  if(car.s>=l.len){car.s=l.len;car.speed=0;if(rwVisible(car,{notice:RW.settings.noticeDist+40})){car.state='parked';RW.stats.carParked=(RW.stats.carParked||0)+1;}else{car.state='hidden';car.respawnAt=RW.t+(l.gap||6)+RW.rng()*6;}}
}
function rwCarPresent(car){const c=rwCam(),floor=C.storyElevation(project,car.lane?.story||0);car.dist=rwDist(car,c);rwSelectView(car,car.facing,['front','side','back'],c,car,35,10,RW.settings.tolerance);const ang=Math.abs(rwWrap(C.heading(c,car)-c.yaw));car.onScreen=car.state!=='hidden'&&ang<RW.settings.fov/2+12&&!rwSightBlock(c,c.z,car,floor+1.0);}
// ------------------------------------------------------------------ Vehicle Loop v0.4 logic adapted to authored Room Creator traffic lanes
function rwVehicleSpec(){return RW.net?.vehicleLoop&&RW.net.vehicleLoop.enabled!==false?RW.net.vehicleLoop:null;}
function rwVehicleLaneList(){return [...RW.lanes.values()].filter(l=>l.kind==='traffic');}
function rwVehicleBaseCruise(l){return Number.isFinite(l.cruiseSpeed)?l.cruiseSpeed:Number.isFinite(l.speed)?l.speed:8.5;}
function rwVehicleRandomCruise(l){const c=RW.vehicleCfg,base=rwVehicleBaseCruise(l),lo=Number.isFinite(l.cruiseMin)?l.cruiseMin:base*c.cruiseVariationMin,hi=Number.isFinite(l.cruiseMax)?l.cruiseMax:base*c.cruiseVariationMax;return lo+(hi-lo)*RW.carRng();}
function rwVehicleAdd(lane,s,speed,{seeded=false}={}){
  const T=globalThis.RCRouteTraffic,cfg=RW.vehicleCfg,serial=++RW.carSerial,id='T'+String(serial).padStart(2,'0'),driver=T.driverFor((RW.net.settings?.seed||1977)^0x51f15e,serial);
  const car={id:'car_'+id,label:id,name:'Traffic '+id,lane,laneId:lane.id,state:'drive',s:C.clamp(s,0,lane.len),speed,cruiseSpeed:speed,halfLength:cfg.vehicleHalfLength,
    acceleration:0,targetSpeed:speed,driver,aiState:'cruising',responseTo:null,observations:[],perception:null,nextSenseAt:RW.carClock+driver.phase,emergency:false,braking:false,
    facing:0,x:0,y:0,view:'side',vsign:1,planeYaw:0,switches:0,h:null,born:RW.carClock,offscreenFor:0,everVisible:false,seeded,contactCount:0,lastContactAt:-1,contactHold:0};
  Object.defineProperty(car,'cruiseSpeed',{value:speed,writable:false,enumerable:true,configurable:false});rwVehicleSyncPose(car,true);RW.cars.push(car);RW.stats.carSpawns++;return car;
}
function rwVehicleSyncPose(car,snap=false){const q=rwLanePose(car.lane,car.s);car.x=q.x;car.y=q.y;if(snap||!Number.isFinite(car.facing))car.facing=q.hd;else{const turn=120*(RW.vehicleCfg?.fixedStep||1/60);car.facing=C.norm(car.facing+C.clamp(rwWrap(q.hd-car.facing),-turn,turn));}}
function rwVehiclePlayerNeighbor(lane){const cfg=RW.vehicleCfg,p=rwPlayerPos();if((lane.story||0)!==p.story)return null;const pr=rwLaneProject(lane,p);if(pr.d>cfg.pedestrianSenseLateral)return null;const q=rwLanePose(lane,pr.s),P=RW.pl,e=P.edge,va=P.vAlong*P.dir,vs=P.vSide*P.dir,vx=e.ux*va+e.rx*vs,vy=e.uy*va+e.ry*vs;
  return {id:'PLAYER',kind:'pedestrian',laneId:lane.id,story:p.story,s:pr.s,speed:Math.max(0,vx*q.fx+vy*q.fy),halfLength:cfg.pedestrianHalfLength,x:p.x,y:p.y,source:null};}
function rwVehicleNpcNeighbor(lane,n){if((lane.story||0)!==rwActorStory(n))return null;const cfg=RW.vehicleCfg,pr=rwLaneProject(lane,n);if(pr.d>cfg.pedestrianSenseLateral)return null;const q=rwLanePose(lane,pr.s),f=C.basis(n.facing),speed=Math.max(0,(f.fx*q.fx+f.fy*q.fy)*(n.speed||0));return {id:n.id,kind:'pedestrian',laneId:lane.id,story:rwActorStory(n),s:pr.s,speed,halfLength:cfg.pedestrianHalfLength,x:n.x,y:n.y,source:n};}
function rwVehicleNeighborhood(lane){const out=RW.cars.filter(c=>c.state==='drive'&&c.lane===lane).map(c=>({id:c.id,kind:'vehicle',laneId:lane.id,s:c.s,speed:c.speed,halfLength:c.halfLength}));const p=rwVehiclePlayerNeighbor(lane);if(p)out.push(p);for(const n of RW.npcs)if(n.state!=='hidden'){const q=rwVehicleNpcNeighbor(lane,n);if(q)out.push(q);}return out;}
function rwVehicleRoadLimit(car){let limit=Infinity;const p0=rwLanePose(car.lane,car.s),p1=rwLanePose(car.lane,Math.min(car.lane.len,car.s+6)),turn=Math.abs(rwWrap(p1.hd-p0.hd));if(turn>55)limit=2.6;else if(turn>25)limit=4;
  if(RW.carExitVisible?.get(car.lane.id)){const remain=Math.max(0,car.lane.len-car.s-car.halfLength),stop=Math.sqrt(Math.max(0,2*car.driver.braking*remain));limit=Math.min(limit,stop);}return limit;}
function rwVehicleObserveAndAdvance(car,neighbors,dt){const T=globalThis.RCRouteTraffic,cfg=RW.vehicleCfg;if(car.contactHold>0){car.contactHold=Math.max(0,car.contactHold-dt);car.speed=0;car.acceleration=0;car.targetSpeed=0;car.braking=true;car.aiState='contact';return;}
  if(RW.carClock+1e-10>=car.nextSenseAt){const seen=T.observe(car,neighbors,cfg);car.observations.push({deliverAt:RW.carClock+car.driver.reaction,seen});if(car.observations.length>16)car.observations.splice(0,car.observations.length-16);car.nextSenseAt=RW.carClock+cfg.senseInterval;}
  while(car.observations.length&&car.observations[0].deliverAt<=RW.carClock+1e-10)car.perception=car.observations.shift().seen;
  const decision=T.decideTraffic(car,car.perception,cfg),motion=T.advanceDriver(car,decision,dt,rwVehicleRoadLimit(car));car.s+=motion.travel;if(car.emergency)RW.stats.carAIEmergency+=dt;
}
function rwVehicleResolveCars(){const T=globalThis.RCRouteTraffic,r=T.resolveContacts(RW.cars,RW.vehicleCfg,RW.carContacts);RW.carContacts=r.active;for(const ev of r.events){const a=RW.cars.find(c=>c.id===ev.lead),b=RW.cars.find(c=>c.id===ev.rear);RW.stats.trafficContacts++;if(a){a.contactCount++;a.lastContactAt=RW.carClock;}if(b){b.contactCount++;b.lastContactAt=RW.carClock;}RW.vehicleEvents.push({time:RW.carClock,type:'vehicle_contact',lead:ev.lead,rear:ev.rear});}if(RW.vehicleEvents.length>80)RW.vehicleEvents.splice(0,RW.vehicleEvents.length-80);}
function rwVehicleImpactTarget(car,t){const f=C.basis(car.facing),dx=t.x-car.x,dy=t.y-car.y,along=dx*f.fx+dy*f.fy,lat=Math.abs(dx*f.rx+dy*f.ry),r=.34;return Math.abs(along)<=car.halfLength+r&&lat<=RW.vehicleCfg.vehicleHalfWidth+r;}
function rwVehiclePedestrianContacts(){const next=new Set(),pp=rwPlayerPos(),targets=[{id:'PLAYER',x:pp.x,y:pp.y,story:pp.story,source:null},...RW.npcs.filter(n=>n.state!=='hidden').map(n=>({id:n.id,x:n.x,y:n.y,story:rwActorStory(n),source:n}))];
  for(const car of RW.cars){if(car.state!=='drive')continue;const story=car.lane?.story||0;for(const t of targets){if(t.story!==story||!rwVehicleImpactTarget(car,t))continue;const key=car.id+'/'+t.id;next.add(key);if(!RW.vehicleImpactKeys.has(key)){RW.stats.pedestrianContacts++;if(t.id==='PLAYER')RW.stats.playerVehicleContacts++;car.contactCount++;car.lastContactAt=RW.carClock;RW.vehicleEvents.push({time:RW.carClock,type:'vehicle_pedestrian_contact',car:car.id,target:t.id,speed:car.speed});if(t.id==='PLAYER')rwSay(`${car.label} made vehicle contact with you — no injury model is installed in this prototype.`,4200);}
      const pr=rwLaneProject(car.lane,t);if(pr.s>=car.s-car.halfLength)car.s=Math.min(car.s,Math.max(0,pr.s-car.halfLength-.36));car.speed=0;car.acceleration=0;car.targetSpeed=0;car.braking=true;car.aiState='contact';car.responseTo=t.id;car.contactHold=Math.max(car.contactHold,.30);rwVehicleSyncPose(car,true);}}
  RW.vehicleImpactKeys=next;if(RW.vehicleEvents.length>80)RW.vehicleEvents.splice(0,RW.vehicleEvents.length-80);
}
function rwVehicleRetire(car,why){const m=RW.meshes?.list?.get(car.id);if(m)m.visible=false;RW.stats.carRetired++;RW.vehicleEvents.push({time:RW.carClock,type:'vehicle_exit',car:car.id,lane:car.laneId,why});return false;}
function rwVehicleSpawn(){const cfg=RW.vehicleCfg;if(RW.cars.length>=cfg.maxTracked)return false;const lanes=rwVehicleLaneList();if(!lanes.length)return false;const start=Math.floor(RW.carRng()*lanes.length);
  for(let k=0;k<lanes.length;k++){const lane=lanes[(start+k)%lanes.length],p=rwLanePose(lane,0);if(rwVisible(p,{notice:RW.settings.noticeDist+40}))continue;const speed=rwVehicleRandomCruise(lane);let safe=true;for(const c of RW.cars)if(c.lane===lane&&c.state==='drive'){const gap=Math.abs(c.s)-(c.halfLength+cfg.vehicleHalfLength);if(gap<cfg.minSpawnGap+Math.abs(speed-c.speed)*2){safe=false;break;}}if(!safe)continue;rwVehicleAdd(lane,0,speed);return true;}return false;
}
function rwVehicleFixedStep(dt){RW.carClock+=dt;const laneNeighbors=new Map();for(const l of rwVehicleLaneList())laneNeighbors.set(l.id,rwVehicleNeighborhood(l));
  for(const car of RW.cars){if(car.state==='exit-wait')continue;rwVehicleObserveAndAdvance(car,laneNeighbors.get(car.laneId)||[],dt);}
  rwVehicleResolveCars();const keep=[];for(const car of RW.cars){if(car.state==='drive'&&car.s>=car.lane.len){car.s=car.lane.len;rwVehicleSyncPose(car,true);if(RW.carExitVisible?.get(car.laneId)){car.state='exit-wait';car.speed=0;car.acceleration=0;car.aiState='waiting-exit';keep.push(car);}else rwVehicleRetire(car,'lane_end');continue;}if(car.state==='exit-wait'&&!RW.carExitVisible?.get(car.laneId)){rwVehicleRetire(car,'exit_hidden');continue;}rwVehicleSyncPose(car);keep.push(car);}RW.cars=keep;rwVehiclePedestrianContacts();
  if(RW.carClock>=RW.carNextSpawn){const spawned=rwVehicleSpawn();RW.carNextSpawn=RW.carClock+(spawned?RW.vehicleCfg.spawnIntervalMin+RW.carRng()*(RW.vehicleCfg.spawnIntervalMax-RW.vehicleCfg.spawnIntervalMin):.8);}
}
function rwVehicleStep(dt){if(!RW.vehicleLoop)return;if(RW.vehicleWorld){rwWorldStep(dt);return;}RW.carExitVisible=new Map();for(const l of rwVehicleLaneList()){const p=rwLanePose(l,l.len);RW.carExitVisible.set(l.id,rwVisible(p,{notice:RW.settings.noticeDist+40}));}
  RW.carAcc+=Math.min(.1,dt);const h=RW.vehicleCfg.fixedStep;let steps=0;while(RW.carAcc+1e-12>=h&&steps<32){rwVehicleFixedStep(h);RW.carAcc-=h;steps++;}if(steps===32)RW.carAcc=0;
}
function rwVehicleInit(net){const T=globalThis.RCRouteTraffic,spec=rwVehicleSpec();RW.vehicleWorld=null;
  /* 0.16: opt-in Vehicle World (vehicle-world.js) — see ui-vehicle-world.js. The older runtime below is unchanged. */
  if(spec&&spec.runtime==='world'&&globalThis.RCVehicleWorld&&T){try{return rwWorldInit(net,spec);}catch(e){console.error(e);RW.vehicleWorld=null;toast('Vehicle World could not start ('+e.message+'); using the older traffic runtime.',7000);}}
  RW.vehicleLoop=!!(spec&&T);RW.cars=[];RW.carSerial=0;RW.carClock=0;RW.carAcc=0;RW.carContacts=new Set();RW.vehicleImpactKeys=new Set();RW.vehicleEvents=[];if(!RW.vehicleLoop)return false;
  RW.vehicleCfg=T.config(spec.config||{});RW.carRng=rwMulberry(((net.settings?.seed||1977)^0x51f15e)>>>0);RW.carNextSpawn=RW.vehicleCfg.initialDelay;const lanes=rwVehicleLaneList();
  for(let li=0;li<lanes.length;li++){const lane=lanes[li],fit=Math.max(1,Math.floor(lane.len/Math.max(8,RW.vehicleCfg.minSpawnGap))),count=Math.min(RW.vehicleCfg.seedPerLane,fit);
    if(count>=2&&lane.len>60){/* Like Vehicle Loop's pre-populated opening, start one safe but meaningful closing pair so the local reactions are visible without test-only injection. */const leadS=lane.len*(.42+li*.08),spacing=Math.max(13.5,RW.vehicleCfg.vehicleHalfLength*2+7.5),rearS=Math.max(1,leadS-spacing),base=rwVehicleBaseCruise(lane);rwVehicleAdd(lane,leadS,Math.max(lane.cruiseMin||0,base*.82),{seeded:true});rwVehicleAdd(lane,rearS,Math.min(lane.cruiseMax||Infinity,base*1.14),{seeded:true});continue;}
    for(let i=0;i<count;i++){const base=(i+1)/(count+1),jitter=(RW.carRng()-.5)*Math.min(.08,1/(count+2)),s=C.clamp((base+jitter)*lane.len,1,lane.len-1);rwVehicleAdd(lane,s,rwVehicleRandomCruise(lane),{seeded:true});}}
  RW.stats.carSpawns=0; /* initial population is scene state, not a runtime spawn */ return true;
}
function rwVehicleFrameLifetimes(dt){if(!RW.vehicleLoop)return;for(const car of RW.cars){if(car.onScreen){car.offscreenFor=0;car.everVisible=true;}else car.offscreenFor+=dt;}}
function rwVehicleSummary(){if(!RW.vehicleLoop)return null;if(RW.vehicleWorld)return rwWorldSummary();const cars=RW.cars;return {tracked:cars.length,visible:cars.filter(c=>c.onScreen).length,braking:cars.filter(c=>c.braking).length,following:cars.filter(c=>c.aiState==='following').length,easing:cars.filter(c=>c.aiState==='easing'||c.aiState==='braking').length,openingGap:cars.filter(c=>c.aiState==='opening-gap').length,contacts:RW.stats?.trafficContacts||0,pedestrianContacts:RW.stats?.pedestrianContacts||0};}
// ------------------------------------------------------------------ player
function rwPlayerStep(dt){
  const P=RW.pl,S=RW.settings,I=RW.in;
  if(P.bodyTurn){P.bodyTurn.t+=dt;const u=Math.min(1,P.bodyTurn.t/P.bodyTurn.dur);P.bodyYaw=C.norm(P.bodyTurn.from+P.bodyTurn.delta*rwEase(u));if(!P.bodyTurn.carryHead)P.headYaw=C.clamp(rwWrap(P.viewHold-P.bodyYaw),-S.lookYaw,S.lookYaw);if(u>=1)P.bodyTurn=null;}
  const lookX=(I.lookR?1:0)-(I.lookL?1:0),lookY=(I.lookU?1:0)-(I.lookD?1:0);
  if(lookX){P.headYaw+=lookX*110*dt;if(P.bodyTurn)P.viewHold+=lookX*110*dt;}if(lookY)P.pitch+=lookY*70*dt;
  P.headYaw=C.clamp(P.headYaw,-S.lookYaw,S.lookYaw);P.pitch=C.clamp(P.pitch,-S.lookDown,S.lookUp);
  const eyeT=P.crouch?S.crouchEye:S.eye;P.eye+=C.clamp(eyeT-P.eye,-2.5*dt,2.5*dt);
  const fwd=(I.fwd?1:0)-(I.back?1:0),side=(I.right?1:0)-(I.left?1:0);if(RW.control!=='encounter'&&P.junctionNeedsRelease&&!I.fwd&&!I.back)P.junctionNeedsRelease=false;
  const aboard=rwPlayerAboard();if(aboard){RW.vehicleWorld.setInteriorActorInput('PLAYER',{forward:fwd,side});P.stamina=Math.min(S.stamina,P.stamina+dt*.5);P.tired=false;P.crouch=false;const tA=fwd*S.walk,tS=side*S.strafeSpeed;P.vAlong+=C.clamp(tA-P.vAlong,-6*dt,6*dt);P.vSide+=C.clamp(tS-P.vSide,-8*dt,8*dt);P.stop=null;const moving=Math.abs(P.vAlong)>.1||Math.abs(P.vSide)>.1;if(moving)P.bobPhase+=dt*(Math.abs(P.vAlong)+.4)*5.4;P.bobZ=S.bob&&moving?Math.sin(P.bobPhase)*.022:P.bobZ*.9;return;}
  const sprinting=I.sprint&&fwd>0&&P.stamina>0&&!P.crouch&&!P.tired;if(sprinting){P.stamina=Math.max(0,P.stamina-dt);if(!P.stamina)P.tired=true;}else{P.stamina=Math.min(S.stamina,P.stamina+dt*.5);if(P.tired&&P.stamina>S.stamina*.5)P.tired=false;}
  let tA=((RW.control!=='encounter'&&P.bodyTurn)||(RW.control!=='encounter'&&P.junctionNeedsRelease))?0:fwd>0?(sprinting?S.sprint:S.walk):fwd<0?-S.back:0;if(P.crouch)tA*=.55;
  P.vAlong+=C.clamp(tA-P.vAlong,-6*dt,4*dt);const tS=P.bodyTurn?0:side*S.strafeSpeed*(P.crouch?.6:1);P.vSide+=C.clamp(tS-P.vSide,-8*dt,8*dt);
  if(Math.abs(fwd)>0)P.stop=null;
  const before={edge:P.edge,s:P.s,off:P.off,dir:P.dir,bodyYaw:P.bodyYaw,headYaw:P.headYaw,bodyTurn:P.bodyTurn,viewHold:P.viewHold};
  if(Math.abs(P.vAlong)>1e-4){rwMoveAlong(P.vAlong*dt);if(rwPlayerBlocked()){Object.assign(P,before);P.vAlong=0;P.blockedT=RW.t;RW.stats.playerBlocked+=dt;}}
  const bL=rwBandSide(P.edge,P.s,-1),bR=rwBandSide(P.edge,P.s,1);
  if(Math.abs(P.vSide)>1e-4){const o0=P.off,d=P.vSide*dt*P.dir;let n=P.off+d;if(d>0&&n>bR)n=Math.max(P.off,bR);if(d<0&&n<-bL)n=Math.min(P.off,-bL);P.off=n;if(rwPlayerBlocked()){P.off=o0;P.vSide=0;}}
  if(P.off>bR)P.off=Math.max(bR,P.off-1.4*dt);if(P.off<-bL)P.off=Math.min(-bL,P.off+1.4*dt);
  const moving=Math.abs(P.vAlong)>.1||Math.abs(P.vSide)>.1;if(moving)P.bobPhase+=dt*(Math.abs(P.vAlong)+.4)*5.4;P.bobZ=S.bob&&moving?Math.sin(P.bobPhase)*.022:P.bobZ*.9;
}
function rwPlayerBlocked(){const p=rwPlayerPos();if(RW.npcs.some(n=>n.state!=='hidden'&&!n.combat?.down&&rwActorStory(n)===p.story&&rwDist(n,p)<.52))return true; /* Combat v0.1: you can step past a downed bot */
  const head=p.floorZ+RW.pl.eye;if((RW.propBoxes||[]).some(b=>b.z0<head&&b.h>p.floorZ+.1&&(C.pointInPoly(p,b.poly)||b.poly.some((v,k)=>C.segDist(p,v,b.poly[(k+1)%b.poly.length])<.25))))return true; /* solid 3D objects stop you */return RW.nodes.some(nd=>(nd.story??0)===p.story&&nd.occ&&nd.occ!=='player'&&rwDist(nd,p)<nd.radius);}
function rwCardinalName(yaw){return ['N','E','S','W'][Math.round(C.norm(yaw)/90)%4];}
function rwFaceMove(yaw,label='Movement facing'){const P=RW.pl;if(!P)return;const target=C.norm(yaw),delta=rwWrap(target-P.bodyYaw);if(Math.abs(delta)<1)return;const view=C.norm(P.bodyYaw+P.headYaw);P.viewHold=view;P.bodyTurn={from:P.bodyYaw,delta,t:0,dur:Math.max(.12,Math.abs(delta)/90*RW.settings.turnTime)};P.vAlong=0;P.vSide=0;P.stop=null;RW.stats.movementQuarterTurns=(RW.stats.movementQuarterTurns||0)+Math.round(Math.abs(delta)/90);rwSay(label+' '+rwCardinalName(target)+' · '+Math.round(target)+'° · free look unchanged',1600);rwUpdateHud();drawSoon();}
function rwQuarterMove(dir){const P=RW.pl;if(!P)return;const target=C.norm(Math.round(P.bodyYaw/90)*90+(dir<0?-90:90));rwFaceMove(target,dir<0?'Turn left':'Turn right');}
function rwLegacyTurnKey(e){if(e.code==='KeyQ')rwQuarterMove(-1);else if(e.code==='KeyR')rwQuarterMove(1);}
function rwFaceView(yaw){const P=RW.pl;if(!P)return;const target=C.norm(yaw);if(RW.settings.lookYaw<180)RW.settings.lookYaw=180;P.headYaw=rwWrap(target-P.bodyYaw);if(P.bodyTurn)P.viewHold=target;rwSay('Free look '+rwCardinalName(target)+' · '+Math.round(target)+'°',1400);rwUpdateHud();drawSoon();}
function rwQuarterView(dir){const P=RW.pl;if(!P)return;const cur=C.norm(P.bodyYaw+P.headYaw),target=C.norm(Math.round(cur/90)*90+(dir<0?-90:90));rwFaceView(target);}
function rwNearestDoorNode(){
  const p=rwPlayerPos();let best=null,bd=Infinity;
  // R1.2: door interaction is anchored to an explicit near-door marker, not to the whole gated edge.
  // This is the same separation proven in Encounter Lab: you may reach the approach while closed; only the short threshold is gated.
  for(const nd of RW.nodes){if(!nd.door||(nd.story??0)!==p.story)continue;const reach=Math.max(.55,Math.min(1.0,nd.radius||.78)),d=rwDist(nd,p);if(d<=reach&&d<bd){bd=d;best=nd;}}
  return best;
}
function rwToggleDoor(){
  if(RW.vehicleWorld&&typeof rwWorldTransitInteract==='function'&&rwWorldTransitInteract())return;
  const nd=rwNearestDoorNode();if(!nd){rwSay('Move to the door approach point first.');return;}const o=rwDoor(nd.door);if(!o)return;
  if(o.open&&RW.pl?.edge?.door===o.id){rwSay('Step clear of the doorway before closing '+(o.name||'the door')+'.',2600);return;}
  o.open=!o.open;if(o.open&&RW.pl)RW.pl.stop=null;GLE?.invalidate();rwBuildSight();liveRev++;
  rwSay((o.name||'Door')+(o.open?' opened — keep W held to continue into the doorway':' closed'));rwUpdateHud();drawSoon();
}
// ------------------------------------------------------------------ the mark (spy / combat target)
function rwMarkStep(){
  const m=RW.npcs.find(n=>n.role==='mark'&&n.state!=='hidden');RW.markSees=false;RW.markWhy='not here';if(!m)return;
  const c=rwCam(),p=rwPlayerPos();if(rwActorStory(m)!==p.story){RW.markWhy='different level';return;}const d=rwDist(m,p),cone=Math.abs(rwWrap(C.heading(m,p)-(m.facing+m.head)));
  if(d>35){RW.markWhy='too far';return;}if(cone>62){RW.markWhy='looking elsewhere';return;}
  const mz=rwActorFloor(m)+1.65,blk=rwSightBlock({x:m.x,y:m.y},mz,p,c.z)&&rwSightBlock({x:m.x,y:m.y},mz,p,c.z-.25);if(blk){RW.markWhy='hidden: '+blk+' is in the way';return;}
  RW.markSees=true;RW.markWhy='can see you';RW.stats.markSeeTime+=0;
}
function rwShoot(){
  if(typeof AP!=='undefined'&&AP.on){apRequest('punch');return;}
  if(typeof cbShoot==='function'&&cbShoot())return; /* Combat v0.1: ammo, body zones, damage */
  const v=routeWalkView();if(!v)return;RW.stats.shots++;const cx=v.width/2,cy=v.height*RW_AIM_Y,c=rwCam();let best=null;
  for(const n of [...RW.npcs,...RW.cars]){if(n.state==='hidden'||!n.onScreen||n.cards)continue;const h=n.lane&&RW.cars.includes(n)?1.45:1.78,w=(RW.cars.includes(n)?(n.view==='side'?4.3:1.8):(n.view==='side'?.42:.62))/2;
    const nf=RW.cars.includes(n)?C.storyElevation(project,n.lane?.story||0):rwActorFloor(n),b=C.fpPoint(v,{x:n.x,y:n.y,floorZ:nf},0),t=C.fpPoint(v,{x:n.x,y:n.y,floorZ:nf},h);if(!b||!t)continue;const hw=w*b.scale;if(cx<b.x-hw||cx>b.x+hw||cy<t.y||cy>b.y)continue;if(!best||b.depth<best.depth)best={n,depth:b.depth};}
  // 0.15: character cards are hit only where the person is drawn (not the empty corners of the picture); heads count separately
  {const ray=rwAimRay();for(const n of RW.npcs){if(n.state==='hidden'||!n.onScreen||!n.cards)continue;const h=rwCardsHit(n,ray);if(h&&(!best||h.depth<best.depth))best={n,depth:h.depth,part:h.part,z:h.z};}}
  if(!best){rwSay('Miss — nothing under the crosshair.');return;}
  const n=best.n,nf=RW.cars.includes(n)?C.storyElevation(project,n.lane?.story||0):rwActorFloor(n),blk=rwSightBlock(c,c.z,n,best.z??(nf+1.25));if(blk){rwSay('Blocked by '+blk+' ('+n.dist.toFixed(1)+' m)');RW.stats.blockedShots++;return;}
  RW.stats.hits++;rwSay('HIT '+(n.name||'car')+(best.part==='head'?' (head)':'')+' at '+n.dist.toFixed(1)+' m');if(n.role==='mark'){n.hit=true;}
  if(n.charId&&RW.npcs.includes(n)){n.hit=true;n.hitT=.7;} /* flinch, then run off */
}
// ------------------------------------------------------------------ stats
function rwResetStats(){RW.stats={t:0,npcTime:0,byClass:{},band:{F:0,Q:0,S:0,BQ:0,B:0},bandMoving:{F:0,Q:0,S:0,BQ:0,B:0},err:{moving:{near:[0,0,0,0],mid:[0,0,0,0],far:[0,0,0,0]},standing:{near:[0,0,0,0],mid:[0,0,0,0],far:[0,0,0,0]}},
  sideNeeded:{near:0,mid:0,far:0},moonwalk:{near:0,mid:0,far:0},onScreenBand:{near:0,mid:0,far:0},carView:{front:0,side:0,back:0},carTime:0,switches:0,
  spawns:0,despawns:0,spawnInView:0,despawnInView:0,carSpawns:0,carDespawnInView:0,carRetired:0,trafficContacts:0,pedestrianContacts:0,playerVehicleContacts:0,carAIEmergency:0,nodeConflicts:0,overtakes:0,playerBlocked:0,playerNodeUses:0,junctions:0,turnArounds:0,movementQuarterTurns:0,shots:0,hits:0,blockedShots:0,markSeeTime:0,flourishes:0,maxHead:0,headAbsorb:0,byGroup:{},npcWait:0,npcSidestep:0,overlap:0,sets:{}};
  for(const n of RW.npcs){n.switches=0;for(const st of Object.values(n.sets||{}))st.sw=0;}}
function rwAccumulate(dt){
  const st=RW.stats;st.t+=dt;if(RW.markSees)st.markSeeTime+=dt;
  for(const n of RW.npcs){if(n.state==='hidden'||!n.onScreen)continue;st.npcTime+=dt;const db=n.dist<8?'near':n.dist<20?'mid':'far';st.onScreenBand[db]+=dt;
    const bc=st.byClass[n.cls]||(st.byClass[n.cls]={front:0,q:0,back:0,side:0,bq:0,time:0,sh:{front:0,q:0,back:0,side:0,bq:0,time:0}});bc[n.view]+=dt;bc.time+=dt;if(n.sh.view){bc.sh[n.sh.view]+=dt;bc.sh.time+=dt;}st.band[n.band]+=dt;if(n.moving)st.bandMoving[n.band]+=dt;
    const eb=n.err<15?0:n.err<30?1:n.err<45?2:3;st.err[n.moving?'moving':'standing'][db][eb]+=dt;if(n.resid>RW.settings.tolerance)st.sideNeeded[db]+=dt;if(n.moving&&n.err>30)st.moonwalk[db]+=dt;
    if(n.attn&&n.view===n.prevView&&Math.abs(n.head)>10)st.headAbsorb+=dt;st.maxHead=Math.max(st.maxHead,Math.abs(n.head));
    const gk=n.role==='walker'?(n.lane?.side||'walker'):n.role,G=st.byGroup[gk]||(st.byGroup[gk]={time:0,band:{F:0,Q:0,S:0,BQ:0,B:0},shown:{front:0,q:0,back:0,side:0,bq:0},sh:{front:0,q:0,back:0,side:0,bq:0},edgeOn:0,wrong30:0,moving:0});
    G.time+=dt;G.band[n.band]+=dt;G.shown[n.view]+=dt;if(n.sh.view)G.sh[n.sh.view]+=dt;if(n.resid>RW.settings.tolerance)G.edgeOn+=dt;if(n.moving){G.moving+=dt;if(n.err>30)G.wrong30+=dt;}}
  for(const n of RW.npcs){if(n.state==='hidden'||!n.onScreen||n.views.length<3)continue;for(const [k,ss] of Object.entries(n.sets)){const A=st.sets[k]||(st.sets[k]={time:0,moving:0,wrong30:0,errSum:0,errMax:0,share:{}});A.time+=dt;A.share[ss.view]=(A.share[ss.view]||0)+dt;if(n.moving){A.moving+=dt;A.errSum+=ss.err*dt;A.errMax=Math.max(A.errMax,ss.err);if(ss.err>30)A.wrong30+=dt;}}}
  for(const n of RW.npcs){if(n.state==='walk'){if(n.speed<.05)st.npcWait+=dt;if(Math.abs(n.off)>.2)st.npcSidestep+=dt;}}
  {const vis=RW.npcs.filter(n=>n.state!=='hidden'&&n.onScreen),pp=rwPlayerPos();for(let i=0;i<vis.length;i++){if(rwActorStory(vis[i])===pp.story&&rwDist(vis[i],pp)<.45)st.overlap+=dt;for(let j=i+1;j<vis.length;j++)if(rwActorStory(vis[i])===rwActorStory(vis[j])&&rwDist(vis[i],vis[j])<.45)st.overlap+=dt;}}
  for(const car of RW.cars)if(car.onScreen){st.carView[car.view]+=dt;st.carTime+=dt;}
  const p=rwPlayerPos();for(const nd of RW.nodes){if((nd.story??0)===p.story&&nd.occ&&nd.occ!=='player'&&rwDist(nd,p)<nd.radius*.8)st.nodeConflicts++;}
}
function rwStatsSummary(){
  const st=RW.stats,pc=(a,b)=>b>0?Math.round(1000*a/b)/10:0,cls={};
  for(const [k,v] of Object.entries(st.byClass))cls[k]={time:+v.time.toFixed(1),FRONT:pc(v.front,v.time),'3/4':pc(v.q,v.time),BACK:pc(v.back,v.time),SIDE:pc(v.side,v.time),'BACK 3/4':pc(v.bq,v.time),ifSideAllowed:v.sh.time?{FRONT:pc(v.sh.front,v.sh.time),'3/4':pc(v.sh.q,v.sh.time),BACK:pc(v.sh.back,v.sh.time),SIDE:pc(v.sh.side,v.sh.time)}:null};
  const band={};for(const [k,v] of Object.entries(st.band))band[k]=pc(v,st.npcTime);const bandM={},mt=Object.values(st.bandMoving).reduce((a,b)=>a+b,0);for(const [k,v] of Object.entries(st.bandMoving))bandM[k]=pc(v,mt);
  const side={},moon={};for(const k of ['near','mid','far']){side[k]=pc(st.sideNeeded[k],st.onScreenBand[k]);moon[k]=pc(st.moonwalk[k],st.onScreenBand[k]);}
  const switchesPerMin=st.npcTime>0?+(RW.npcs.reduce((a,n)=>a+n.switches,0)/(st.npcTime/60)).toFixed(1):0;
  return {seconds:+st.t.toFixed(1),npcOnScreenSeconds:+st.npcTime.toFixed(1),settings:{...RW.settings},bodyViewShareByClass:cls,trueAngleShare:{all:band,moving:bandM},
    cardWrongShare_residualOverTolerance:side,moonwalkShare_movingErrorOver30:moon,onScreenSecondsByDistance:Object.fromEntries(Object.entries(st.onScreenBand).map(([k,v])=>[k,+v.toFixed(1)])),
    viewSwitchesPerNpcMinute:switchesPerMin,carViewShare:{FRONT:pc(st.carView.front,st.carTime),SIDE:pc(st.carView.side,st.carTime),BACK:pc(st.carView.back,st.carTime)},
    trafficAI:RW.vehicleLoop?{...rwVehicleSummary(),spawned:st.carSpawns,retired:st.carRetired,emergencyBrakeSeconds:+st.carAIEmergency.toFixed(2),recentEvents:RW.vehicleEvents.slice(-12)}:null,
    rules:{spawns:st.spawns,despawns:st.despawns,spawnInView:st.spawnInView,despawnInView:st.despawnInView,carDespawnInView:st.carDespawnInView,carsParkedBecauseExitWasVisible:st.carParked||0,nodeConflicts:st.nodeConflicts,sameDirectionOvertakes:st.overtakes,playerBumpedIntoNpcSeconds:+st.playerBlocked.toFixed(1),playerNodeUses:st.playerNodeUses},
    player:{junctionsTaken:st.junctions,movementQuarterTurns:st.movementQuarterTurns||0,turnArounds:st.turnArounds,shots:st.shots,hits:st.hits,blockedShots:st.blockedShots,markCouldSeeYouSeconds:+st.markSeeTime.toFixed(1)},
    heads:{maxHeadTurn:Math.round(st.maxHead),secondsHeadHeldAttentionWithoutBodyChange:+st.headAbsorb.toFixed(1)},flourishes:st.flourishes,
    byGroup:Object.fromEntries(Object.entries(st.byGroup).map(([k,G])=>[k,{seconds:+G.time.toFixed(1),trueAngle:Object.fromEntries(Object.entries(G.band).map(([b,v])=>[b,pc(v,G.time)])),shown:{FRONT:pc(G.shown.front,G.time),'3/4':pc(G.shown.q,G.time),BACK:pc(G.shown.back,G.time),SIDE:pc(G.shown.side,G.time),'BACK 3/4':pc(G.shown.bq,G.time)},ifSideAllowed:{FRONT:pc(G.sh.front,G.time),'3/4':pc(G.sh.q,G.time),BACK:pc(G.sh.back,G.time),SIDE:pc(G.sh.side,G.time)},edgeOn:pc(G.edgeOn,G.time),walkingArtWrongOver30:pc(G.wrong30,G.moving)}])),
    artSets:Object.fromEntries(Object.entries(st.sets).map(([k,A])=>[k,{walkingArtWrongOver30:pc(A.wrong30,A.moving),meanErrorWhileWalking:A.moving?+(A.errSum/A.moving).toFixed(1):0,worstError:Math.round(A.errMax),switchesPerNpcMinute:A.time?+(RW.npcs.reduce((a,n)=>a+(n.sets[k]?.sw||0),0)/(A.time/60)).toFixed(1):0,share:Object.fromEntries(Object.entries(A.share).map(([v,x])=>[RW_VIEW_LABEL[v]||v,pc(x,A.time)]))}])),
    crowd:{npcWaitSeconds:+st.npcWait.toFixed(1),npcSidestepSeconds:+st.npcSidestep.toFixed(1),bodiesOverlappingSeconds:+st.overlap.toFixed(1)}};
}
// ------------------------------------------------------------------ main loop
function rwStep(dt){
  if(typeof AP!=='undefined'&&AP.on){apAdvance(dt);return;}
  RW.t+=dt;if(typeof cbPlayerPre==='function')cbPlayerPre(dt); /* Combat v0.1: W follows the look even mid-edge */
  rwPlayerStep(dt);
  for(const n of RW.npcs){n.prevView=n.view;if(n.combat&&typeof cbNpcStep==='function')cbNpcStep(n,dt);else rwNpcStep(n,dt);} /* Combat v0.1: combat bots have their own brain */
  rwMarkStep();
  for(const n of RW.npcs){if(n.state==='hidden'){n.onScreen=false;continue;}rwHeadStep(n,dt);rwPresent(n);}
  if(RW.vehicleLoop)rwVehicleStep(dt);
  for(const car of RW.cars){if(!RW.vehicleLoop)rwLegacyCarStep(car,dt);if(car.state!=='hidden')rwCarPresent(car);else car.onScreen=false;}
  rwVehicleFrameLifetimes(dt);
  // node occupancy by the player (the dormant outside Route Walk body is not an occupant while aboard transit)
  const p=rwPlayerPos();if(p.aboard){for(const nd of RW.nodes)if(nd.occ==='player')nd.occ=null;}else for(const nd of RW.nodes){if((nd.story??0)!==p.story){if(nd.occ==='player')nd.occ=null;continue;}const d=rwDist(nd,p);if(nd.occ==='player'&&d>nd.radius+.1)nd.occ=null;if(!nd.occ&&d<=nd.radius){if(nd.res){const n=RW.npcs.find(x=>x.id===nd.res);if(n){n.node=null;n.state='rejoin';n.rejoinS=null;}nd.res=null;}nd.occ='player';RW.stats.playerNodeUses++;}}
  rwAccumulate(dt);if(typeof cbStep==='function')cbStep(dt); /* Combat v0.1: shots, hits, timers, objective */
}
function rwLoop(now){
  RW.raf=0;if(!RW.on)return;const dt=Math.min(typeof AP!=='undefined'&&AP.on?.25:.1,(now-(RW.last||now))/1000)||1/60;RW.last=now;
  if(!RW.paused)rwStep(dt);rwSyncMeshes();draw();rwUpdateHud();if(now-RW.panelT>300){RW.panelT=now;rwUpdatePanels();}
  RW.raf=requestAnimationFrame(rwLoop);
}
// ------------------------------------------------------------------ 0.15 character cards (real art)
/* A character pack (routeNet.characters[]) is one atlas picture (a project image) plus a description:
   frames  : name -> {x,y,w,h, ax (feet anchor, px from the left), neck:[x,y] (where the head can be swapped),
             nohead: the same body with its head removed}
   states  : stand / walk / run / flinch / phone / alert -> view (front, q, side, bq, back) -> frame names
             ("name|m" = the same picture mirrored, used to alternate the legs of the front and back walk)
   heads   : F / Q / S / BQ / B -> head frame names, so the head can turn toward the player on its own.
   Turned pictures (q, side, bq) face the picture's right; the card is mirrored for the other side.
   Everything is measured in picture pixels; pxPerMetre turns pixels into metres. */
const RW_HEAD_OF={front:'F',q:'Q',side:'S',bq:'BQ',back:'B'};
const rwCharCache=new Map(); // character id -> {pack, img, canvas, alpha, ready, mats:Map}
function rwLoadCharacters(net){
  RW.chars=new Map();
  for(const pack of (Array.isArray(net.characters)?net.characters:[])){
    if(!pack||typeof pack!=='object'||!pack.id||!pack.frames||!pack.states)continue;
    const asset=catalog.get(pack.atlas),src=asset?.src||pack.atlasSrc;if(!src){toast('Character "'+(pack.name||pack.id)+'" has no picture in this project; placeholder cards are used.',6000);continue;}
    let rec=rwCharCache.get(pack.id);
    if(!rec||rec.src!==src){rec={pack,src,ready:false,mats:new Map(),alpha:null,canvas:null};rwCharCache.set(pack.id,rec);
      const img=new Image();img.onload=()=>{const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const g=cv.getContext('2d');g.drawImage(img,0,0);
        let alpha=null;try{const d=g.getImageData(0,0,cv.width,cv.height).data;alpha=new Uint8Array(cv.width*cv.height);for(let i=0;i<alpha.length;i++)alpha[i]=d[i*4+3];}catch(_){alpha=null;}
        rec.canvas=cv;rec.alpha=alpha;rec.ready=true;if(RW.on)renderLeft();drawSoon();};img.src=src;}
    rec.pack=pack;RW.chars.set(pack.id,rec);
  }
}
function rwCharOf(n){if(!n.charId)return null;const rec=RW.chars?.get(n.charId);return rec&&rec.ready?rec.pack:null;}
// What the character is doing decides which pictures it uses.
function rwCharPose(n,ch){
  const S=ch.states;let st='stand';
  if(n.combat&&typeof cbPose==='function'){const cp=cbPose(n,ch);if(cp&&S[cp])return cp;} /* Combat v0.1: guard / aim / surrender / flee */
  if(n.hitT>0)st='flinch';
  else if(n.moving&&n.speed>.05)st=n.speed>2.1?'run':'walk';
  else if(n.role==='mark'&&RW.markSees&&n.state==='atNode')st='alert';
  else if(n.state==='atNode'&&n.phonePlan&&n.timer<n.phonePlan.start&&n.timer>n.phonePlan.end)st='phone';
  if(!S[st])st=st==='run'&&S.walk?'walk':'stand';
  return S[st]?st:Object.keys(S)[0];
}
function rwCharFrameCanvas(rec,name){const f=rec.pack.frames[name];const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(rec.canvas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);return c;}
function rwCharMaterial(rec,name){
  const T3=window.THREE,px=!!RW.settings.charPixel,key=name+'|'+(px?'p':'s');let m=rec.mats.get(key);
  if(!m){const tex=new T3.CanvasTexture(rwCharFrameCanvas(rec,name));tex.magFilter=px?T3.NearestFilter:T3.LinearFilter;tex.minFilter=T3.LinearMipmapLinearFilter;tex.generateMipmaps=true;if('colorSpace' in tex)tex.colorSpace=T3.NoColorSpace; /* the renderer works in plain picture colours, like the room textures */
    m=new T3.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.5,side:T3.DoubleSide});rec.mats.set(key,m);}
  const L=C.clamp(RW.settings.charLight??.92,.2,1.6);m.color.setRGB(L,L,L);return m;
}
// Work out where the body card (and, when the head looks somewhere else, the head card) go this frame.
function rwCharCards(n,ch){
  const rec=RW.chars.get(n.charId),pose=n.pose||rwCharPose(n,ch),set=ch.states[pose]||ch.states.stand;
  const list=set[n.view]||set[Object.keys(set)[0]],stride=pose==='run'||pose==='flee'?1.05:.72;
  const idx=list.length>1&&n.moving?Math.floor((n.cycle||0)/stride)%list.length:0;let [fname,flag]=String(list[idx]).split('|');
  let fr=ch.frames[fname];if(!fr)return null;const mir=(n.vsign<0)!==(flag==='m'),ppm=fr.ppm||ch.pxPerMetre||110; /* Combat v0.1: a frame may carry its own pixels-per-metre (high-resolution poses) */
  const bob=(list.length===1&&n.moving&&(pose==='walk'||pose==='run'||pose==='flee')?Math.abs(Math.sin((n.cycle||0)/stride*Math.PI))*(pose==='run'||pose==='flee'?.05:.025):0)-(n.combatSink||0); /* combatSink: crouched behind cover, the card sinks into the floor */
  let head=null;
  // closer than 1.8 m the join at the neck would show, so the head stays on the body there
  if(RW.settings.charHeads&&fr.neck&&fr.nohead&&ch.frames[fr.nohead]&&n.h.view&&n.dist>1.8){
    const own=RW_HEAD_OF[n.view],hv=n.h.view,same=hv===own&&(own==='F'||own==='B'||n.h.vsign===n.vsign);
    const hf=ch.frames[ch.heads?.[hv]];
    if(!same&&hf&&hf.neck){head={name:ch.heads[hv],fr:hf,mir:n.h.vsign<0,yaw:n.h.planeYaw};}
  }
  const W=fr.w/ppm,H=fr.h/ppm,b=C.basis(n.planeYaw),Lx=-b.rx,Ly=-b.ry,s=mir?-1:1,off=s*W*(.5-fr.ax/fr.w);
  const body={name:head?fr.nohead:fname,fr,x:n.x+Lx*off,y:n.y+Ly*off,yaw:n.planeYaw,w:W,h:H,z:bob,mir};
  if(head){const nx=s*W*(fr.neck[0]/fr.w-.5),wx=body.x+Lx*nx,wy=body.y+Ly*nx,wz=bob+(fr.h-fr.neck[1])/ppm;
    const hf=head.fr,hpm=hf.ppm||ch.pxPerMetre||110,Wh=hf.w/hpm,Hh=hf.h/hpm,hb=C.basis(head.yaw),hLx=-hb.rx,hLy=-hb.ry,sh=head.mir?-1:1,hoff=sh*Wh*(hf.neck[0]/hf.w-.5);
    const cam=rwCam(),tw=C.basis(C.heading({x:wx,y:wy},cam));
    Object.assign(head,{x:wx-hLx*hoff+tw.fx*.05,y:wy-hLy*hoff+tw.fy*.05,w:Wh,h:Hh,z:wz-(hf.h-hf.neck[1])/ppm});}
  return {rec,body,head,pose,frame:fname};
}
// The crosshair ray (from the eye along where the player looks).
function rwAimRay(){const c=rwCam(),f=C.basis(c.yaw),t=Math.tan(C.rad(RW.pl.pitch||0));return {x:c.x,y:c.y,z:c.z,dx:f.fx,dy:f.fy,dz:t};}
function rwCardHit1(card,ray,rec,frName,floor=0){ /* Combat v0.1: floor = the character's story elevation, so cards on upper floors can be hit */
  const b=C.basis(card.yaw),den=ray.dx*b.fx+ray.dy*b.fy;if(Math.abs(den)<1e-6)return null;
  const t=((card.x-ray.x)*b.fx+(card.y-ray.y)*b.fy)/den;if(t<=.2)return null;
  const hx=ray.x+ray.dx*t,hy=ray.y+ray.dy*t,hz=ray.z+ray.dz*t,u=((hx-card.x)*(-b.rx)+(hy-card.y)*(-b.ry))/card.w*(card.mir?-1:1)+.5,v=1-(hz-(floor+card.z))/card.h;
  if(u<0||u>1||v<0||v>1)return null;const f=rec.pack.frames[frName];
  if(rec.alpha){const px=f.x+Math.min(f.w-1,Math.floor(u*f.w)),py=f.y+Math.min(f.h-1,Math.floor(v*f.h));if(rec.alpha[py*rec.canvas.width+px]<128)return null;}
  return {depth:t,z:hz};
}
function rwCardsHit(n,ray){const k=n.cards;if(!k)return null;let best=null;const floor=rwActorFloor(n);
  if(k.head){const h=rwCardHit1(k.head,ray,k.rec,k.head.name,floor);if(h)best={...h,part:'head'};}
  const b=rwCardHit1(k.body,ray,k.rec,k.body.name,floor);if(b&&(!best||b.depth<best.depth-.02))best={...b,part:k.body.fr.neck&&b.z>floor+k.body.z+(k.body.fr.h-k.body.fr.neck[1])/(k.body.fr.ppm||k.rec.pack.pxPerMetre||110)?'head':'body'};
  return best;}
let rwShadowTex=null;
function rwShadowMaterial(){const T3=window.THREE;if(RW.meshes.shadowMat)return RW.meshes.shadowMat;
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,2,32,32,31);gr.addColorStop(0,'rgba(0,0,0,0.62)');gr.addColorStop(.55,'rgba(0,0,0,0.38)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  rwShadowTex=new T3.CanvasTexture(c);RW.meshes.shadowMat=new T3.MeshBasicMaterial({map:rwShadowTex,transparent:true,depthWrite:false,color:0xffffff});return RW.meshes.shadowMat;}
function rwShadowMesh(id){let m=RW.meshes.list.get(id);if(!m){const T3=window.THREE;if(!RW.meshes.shadowGeo){RW.meshes.shadowGeo=new T3.PlaneGeometry(1,1);RW.meshes.shadowGeo.rotateX(-Math.PI/2);}
  m=new T3.Mesh(RW.meshes.shadowGeo,rwShadowMaterial());m.frustumCulled=false;m.renderOrder=1;GLE.dynamic.add(m);RW.meshes.list.set(id,m);}return m;}
// ------------------------------------------------------------------ placeholder cards (canvas art) and 3D meshes
const rwTexCache=new Map();
function rwCardCanvas(kind,view,leg=0,arm=0){
  const key=[kind,view,leg,arm].join('|');if(rwTexCache.has(key))return rwTexCache.get(key);const c=document.createElement('canvas');
  if(kind==='body'){c.width=128;c.height=256;const g=c.getContext('2d'),col=RW_VIEW_COLOR[view],W=128,H=256,dark='#16202a';g.lineJoin='round';
    const legs=(x1,x2,lift1,lift2,w)=>{g.fillStyle='#2b3440';g.fillRect(x1-w/2,140,w,108-lift1);g.fillRect(x2-w/2,140,w,108-lift2);g.fillStyle='#111';g.fillRect(x1-w/2-2,244-lift1,w+6,10);g.fillRect(x2-w/2-2,244-lift2,w+6,10);};
    const step=leg===1?[14,0]:leg===2?[0,14]:[0,0];
    if(view==='front'||view==='back'){legs(46,82,step[0],step[1],22);g.fillStyle=col;g.strokeStyle=dark;g.lineWidth=4;g.beginPath();g.moveTo(14,10);g.lineTo(114,10);g.lineTo(104,148);g.lineTo(24,148);g.closePath();g.fill();g.stroke();
      g.fillStyle=col;g.fillRect(2,16,14,100);g.fillRect(arm?96:112,arm?-6:16,14,arm?60:100);if(arm){g.fillStyle='#222';g.fillRect(92,-6,20,16);}
      if(view==='front'){g.fillStyle=dark;g.fillRect(62,20,4,120);}}
    else if(view==='q'){legs(52,84,step[0],step[1],20);g.fillStyle=col;g.strokeStyle=dark;g.lineWidth=4;g.beginPath();g.moveTo(22,12);g.lineTo(106,8);g.lineTo(98,148);g.lineTo(32,148);g.closePath();g.fill();g.stroke();
      g.fillStyle=col;g.fillRect(10,16,14,96);if(arm){g.fillRect(98,-6,14,60);g.fillStyle='#222';g.fillRect(94,-6,20,16);}g.fillStyle=dark;g.fillRect(80,20,4,118);
      g.fillStyle='#111';g.beginPath();g.moveTo(84,250);g.lineTo(100,256);g.lineTo(84,256);g.fill();}
    else if(view==='bq'){legs(48,80,step[0],step[1],20);g.fillStyle=col;g.strokeStyle=dark;g.lineWidth=4;g.beginPath();g.moveTo(20,10);g.lineTo(104,14);g.lineTo(96,148);g.lineTo(30,148);g.closePath();g.fill();g.stroke();
      g.fillStyle=col;g.fillRect(8,16,14,96);g.fillStyle='#0004';g.fillRect(84,18,14,126);g.fillStyle='#111';g.beginPath();g.moveTo(80,250);g.lineTo(96,256);g.lineTo(80,256);g.fill();}
    else{const sw=leg===1?18:leg===2?-18:0;g.fillStyle='#2b3440';g.save();g.translate(64,140);g.rotate(sw*Math.PI/180);g.fillRect(-11,0,22,108);g.fillStyle='#111';g.fillRect(-11,104,34,10);g.restore();g.save();g.translate(64,140);g.rotate(-sw*Math.PI/180);g.fillStyle='#3a4552';g.fillRect(-11,0,22,108);g.fillStyle='#111';g.fillRect(-11,104,34,10);g.restore();
      g.fillStyle=col;g.strokeStyle=dark;g.lineWidth=4;g.beginPath();g.moveTo(40,10);g.lineTo(90,10);g.lineTo(86,148);g.lineTo(44,148);g.closePath();g.fill();g.stroke();g.save();g.translate(64,22);g.rotate(-sw*Math.PI/180*1.2);g.fillStyle=col;g.strokeStyle=dark;g.fillRect(-7,0,14,96);g.strokeRect(-7,0,14,96);g.restore();}
    g.save();g.font='bold 26px Arial';g.textAlign='center';g.lineWidth=5;g.strokeStyle='#000';g.fillStyle='#fff';const lab=view==='bq'?'B3/4':RW_VIEW_LABEL[view];g.translate(64,86);if(view==='side'){g.rotate(-Math.PI/2);g.font='bold 22px Arial';}g.strokeText(lab,0,8);g.fillText(lab,0,8);g.restore();}
  else if(kind==='head'){c.width=64;c.height=64;const g=c.getContext('2d');g.fillStyle='#d9a77c';g.strokeStyle='#2a1c14';g.lineWidth=3;g.beginPath();g.arc(32,34,24,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#2a1c14';
    if(view==='B'){g.beginPath();g.arc(32,34,24,0,Math.PI*2);g.fill();}else if(view==='BQ'){g.beginPath();g.arc(32,34,24,0,Math.PI*2);g.fill();g.fillStyle='#d9a77c';g.beginPath();g.moveTo(50,22);g.quadraticCurveTo(60,34,52,52);g.lineTo(46,40);g.fill();}else{g.beginPath();g.arc(32,30,24,Math.PI*1.05,Math.PI*1.95);g.fill();
      const ex=view==='F'?[22,42]:view==='Q'?[30,46]:[48];for(const x of ex){g.fillRect(x-3,32,6,6);}g.beginPath();if(view==='F'){g.moveTo(32,38);g.lineTo(29,46);g.lineTo(35,46);}else if(view==='Q'){g.moveTo(42,38);g.lineTo(44,47);g.lineTo(38,47);}else{g.moveTo(54,36);g.lineTo(62,44);g.lineTo(54,46);}g.fill();}
    g.font='bold 13px Arial';g.fillStyle=view==='S'?'#ff6b6b':'#fff';g.strokeStyle='#000';g.lineWidth=3;g.strokeText(view==='Q'?'¾':view==='BQ'?'B¾':view,4,14);g.fillText(view==='Q'?'¾':view==='BQ'?'B¾':view,4,14);}
  else if(kind==='car'){const side=view==='side';c.width=side?256:128;c.height=96;const g=c.getContext('2d'),W=c.width;g.fillStyle='#2f6f78';g.strokeStyle='#0d1e22';g.lineWidth=4;
    if(side){g.beginPath();g.moveTo(8,70);g.lineTo(10,46);g.lineTo(60,40);g.lineTo(90,16);g.lineTo(170,16);g.lineTo(200,40);g.lineTo(248,46);g.lineTo(250,70);g.closePath();g.fill();g.stroke();g.fillStyle='#9fc6d6';g.fillRect(96,22,34,20);g.fillRect(136,22,32,20);
      g.fillStyle='#111';for(const x of [62,196]){g.beginPath();g.arc(x,72,15,0,Math.PI*2);g.fill();}g.fillStyle='#fff3c4';g.fillRect(238,48,10,9);g.fillStyle='#e33';g.fillRect(9,48,8,9);}
    else{g.beginPath();g.moveTo(8,74);g.lineTo(12,40);g.lineTo(30,14);g.lineTo(98,14);g.lineTo(116,40);g.lineTo(120,74);g.closePath();g.fill();g.stroke();g.fillStyle=view==='front'?'#9fc6d6':'#4a6a76';g.fillRect(30,20,68,22);
      g.fillStyle=view==='front'?'#fff3c4':'#e33';g.fillRect(14,48,20,10);g.fillRect(94,48,20,10);g.fillStyle='#111';g.fillRect(12,74,18,14);g.fillRect(98,74,18,14);}
    g.font='bold 14px Arial';g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=3;const lab='CAR '+(view==='side'?'SIDE':view.toUpperCase());g.strokeText(lab,W/2-28,92);g.fillText(lab,W/2-28,92);}
  else if(kind==='bus'){const side=view==='side';c.width=side?384:160;c.height=160;const g=c.getContext('2d'),W=c.width;g.fillStyle='#b8862c';g.strokeStyle='#1e170b';g.lineWidth=5;
    if(side){g.beginPath();g.roundRect(6,20,W-12,116,10);g.fill();g.stroke();g.fillStyle='#9fd0e2';for(let x=24;x<300;x+=45)g.fillRect(x,32,34,38);g.fillStyle='#26343a';g.fillRect(306,30,54,94);g.strokeStyle='#ffe26a';g.lineWidth=4;g.strokeRect(306,30,54,94);g.fillStyle='#111';for(const x of [64,316]){g.beginPath();g.arc(x,136,19,0,Math.PI*2);g.fill();}g.fillStyle='#e8f4ee';g.font='bold 13px Arial';g.textAlign='center';g.fillText('PASSENGER',333,78);g.fillText('DOOR',333,96);g.fillStyle='#16202a';g.fillRect(9,78,18,18);g.fillStyle='#fff3c4';g.fillRect(W-28,78,18,18);}
    else{g.beginPath();g.roundRect(20,8,120,132,10);g.fill();g.stroke();g.fillStyle=view==='front'?'#9fd0e2':'#50727e';g.fillRect(34,22,92,50);g.fillStyle=view==='front'?'#fff3c4':'#e33';g.fillRect(28,92,24,13);g.fillRect(108,92,24,13);g.fillStyle='#111';g.fillRect(25,135,25,18);g.fillRect(110,135,25,18);}
    g.font='bold 16px Arial';g.textAlign='center';g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=4;const lab='BUS '+(side?'SIDE':view.toUpperCase());g.strokeText(lab,W/2,154);g.fillText(lab,W/2,154);}
  rwTexCache.set(key,c);return c;
}
function rwMaterial(kind,view,leg,arm){
  const T3=window.THREE,key=[kind,view,leg,arm].join('|');RW.meshes.mats=RW.meshes.mats||new Map();let m=RW.meshes.mats.get(key);
  if(!m){const tex=new T3.CanvasTexture(rwCardCanvas(kind,view,leg,arm));tex.magFilter=T3.NearestFilter;tex.generateMipmaps=true;m=new T3.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.3,side:T3.DoubleSide,color:new T3.Color(.86,.86,.86)});RW.meshes.mats.set(key,m);}
  return m;
}
function rwEnsureMeshes(){
  if(!GLE||!window.THREE)return false;const T3=window.THREE;if(RW.meshes&&RW.meshes.engine===GLE)return true;rwDisposeMeshes();
  const geo=new T3.PlaneGeometry(1,1);geo.translate(0,.5,0);RW.meshes={engine:GLE,geo,list:new Map()};return true;
}
function rwMesh(id){let m=RW.meshes.list.get(id);if(!m){m=new window.THREE.Mesh(RW.meshes.geo,rwMaterial('body','front',0,0));m.frustumCulled=false;m.renderOrder=2;GLE.dynamic.add(m);RW.meshes.list.set(id,m);}return m;}
function rwDisposeMeshes(){if(typeof rwWorldDisposeHeads==='function')rwWorldDisposeHeads();if(!RW.meshes)return;for(const m of RW.meshes.list.values())RW.meshes.engine?.dynamic.remove(m);for(const m of (RW.meshes.mats||new Map()).values()){m.map?.dispose();m.dispose();}RW.meshes.geo?.dispose();
  RW.meshes.shadowGeo?.dispose();if(RW.meshes.shadowMat){RW.meshes.shadowMat.map?.dispose();RW.meshes.shadowMat.dispose();}RW.meshes=null;}
function rwPlace(m,x,y,yaw,w,h,z=0,mirror=false){const b=C.basis(yaw);m.position.set(x,z,y);m.rotation.set(0,Math.atan2(b.fx,b.fy),0);m.scale.set(mirror?-w:w,h,1);m.visible=true;}
function rwSyncMeshes(){
  if(typeof AP!=='undefined'&&AP.on){apSyncMeshes();return;}
  if(!rwEnsureMeshes())return;const c=rwCam();
  for(const n of RW.npcs){const body=rwMesh(n.id+':b'),head=rwMesh(n.id+':h'),shadow=rwShadowMesh(n.id+':s');if(n.state==='hidden'){body.visible=head.visible=shadow.visible=false;n.cards=null;continue;}const floor=rwActorFloor(n);
    // soft contact shadow on the authored story floor, so cards on the river/tunnel level do not float at street height
    shadow.visible=!!RW.settings.charShadow;if(shadow.visible){const sb=C.basis(n.planeYaw||n.facing);shadow.position.set(n.x,floor+.012,n.y);shadow.rotation.set(0,Math.atan2(sb.fx,sb.fy),0);shadow.scale.set(.78,1,.42);}
    const ch=rwCharOf(n);
    if(ch){const k=rwCharCards(n,ch);n.cards=k;if(k){
        body.material=rwCharMaterial(k.rec,k.body.name);rwPlace(body,k.body.x,k.body.y,k.body.yaw,k.body.w,k.body.h,floor+k.body.z,k.body.mir);
        if(k.head){head.material=rwCharMaterial(k.rec,k.head.name);rwPlace(head,k.head.x,k.head.y,k.head.yaw,k.head.w,k.head.h,floor+k.head.z,k.head.mir);}else head.visible=false;
        if(typeof cbMeshPost==='function')cbMeshPost(n,body,head,shadow); /* Combat v0.1: a downed bot's card tips over */
        continue;}}
    n.cards=null;
    const leg=n.moving?(Math.floor(n.cycle/.55)%4===1?1:Math.floor(n.cycle/.55)%4===3?2:0):0,arm=n.flourish>0?1:0,w=n.view==='side'?.42:n.view==='q'||n.view==='bq'?.56:.62;
    body.material=rwMaterial('body',n.view,leg,arm);const toward=C.basis(C.heading(n,c));
    rwPlace(body,n.x,n.y,n.planeYaw,w,1.47,floor,n.vsign<0);
    head.material=rwMaterial('head',n.h.view,0,0);rwPlace(head,n.x+toward.fx*.03,n.y+toward.fy*.03,n.h.planeYaw,.34,.34,floor+1.45,n.h.vsign<0);}
  const aboardVehicle=RW.vehicleWorld?.query('getInteriorActorState','PLAYER')?.vehicleId||null;
  for(const car of RW.cars){const m=rwMesh(car.id);if(car.state==='hidden'||aboardVehicle===car.vehicleId){m.visible=false;continue;}const floor=C.storyElevation(project,car.lane?.story||0),isBus=car.classId==='bus',kind=isBus?'bus':'car';m.material=rwMaterial(kind,car.view,0,0);rwPlace(m,car.x,car.y,car.planeYaw,car.view==='side'?(car.length||(isBus?12:4.3)):(car.width?car.width+.01:isBus?2.55:1.85),isBus?3.2:1.5,floor,car.vsign<0);}
  if(RW.vehicleWorld)rwWorldSyncHeads();
}
// ------------------------------------------------------------------ start / stop
function routeWalkView(){
  if(typeof AP!=='undefined'&&AP.on&&!AP.inspection){const a=apPlayer();return {id:null,name:'Action Playground',x:a.x,y:a.y,story:a.story,floorZ:a.z,facing:rwPlayerLookYaw(),fov:RW.settings.fov,eyeHeight:a.body.eye,horizon:.5,pitch:RW.pl.pitch,fps:true,width:1440,height:900,role:'movement'};}
  if(typeof AP!=='undefined'&&AP.on&&AP.inspection)return apCameraView();
  if(!RW.on||!RW.pl)return null;const P=RW.pl,p=rwPlayerPos(),S=RW.settings,W=1440,H=900,f=W/(2*Math.tan(C.rad(S.fov)/2)),hf=C.clamp(.42+f*Math.tan(C.rad(P.pitch))/H,.1,.9);
  return {id:null,name:p.aboard?'Bus interior':RW.control==='encounter'?'Encounter preview':'Route walk',x:p.x,y:p.y,story:p.story,floorZ:p.floorZ,facing:rwPlayerLookYaw(),fov:S.fov,eyeHeight:P.eye+P.bobZ,horizon:hf,width:W,height:H,role:'movement'};
}
function rwStart(control='legacy'){
  const net=project.routeNet;if(!net||!net.edges?.length){toast('This project has no movement network. Use Move to author one, or load the built-in Encounter test room.',7000);return false;}
  if(mode!=='build')return false;commitLive();freeCam=null;stopRail();
  RW.control=control==='encounter'?'encounter':'legacy';const bank=RW.control==='encounter'?(RW.encounterUserSettings||{}):(RW.userSettings||{});RW.net=net;RW.settings={...RW_DEFAULTS,...(net.settings?.defaults||{}),...(RW.control==='encounter'?RW_ENCOUNTER_DEFAULTS:{}),...bank};RW.rng=rwMulberry(net.settings?.seed||1977);RW.graph=rwBuildGraph(net);
  RW.lanes=new Map(net.lanes.map(l=>[l.id,rwLane(l)]));for(const t of net.traffic)RW.lanes.set(t.id,rwLane(t));
  RW.nodes=net.nodes.map(n=>({...n,types:n.types||[],radius:n.radius||.55,occ:null,res:null}));
  RW.zones=net.zones.map(z=>({...z,slots:z.slots||[]}));RW.doorsBefore=new Map(project.openings.map(o=>[o.id,o.open]));
  rwBuildSight();rwAttachNodes();rwResetStats();RW.t=0;
  const st=net.settings?.start||{},e=RW.graph.byId.get(st.edge)||RW.graph.edges[0];
  RW.pl={edge:e,s:st.s??1,off:0,dir:st.dir||1,bodyYaw:(st.dir||1)>0?e.hd:C.norm(e.hd+180),headYaw:0,pitch:0,eye:RW.settings.eye,bobZ:0,bobPhase:0,vAlong:0,vSide:0,stamina:RW.settings.stamina,crouch:false,turn:null,bodyTurn:null,stop:null,junctionLatch:null,junctionNeedsRelease:false};
  rwLoadCharacters(net);
  RW.npcs=net.actors.map(rwMakeNpc);if(!rwVehicleInit(net))RW.cars=net.traffic.map((t,i)=>({id:'car_'+t.id,label:t.id,lane:RW.lanes.get(t.id),state:'hidden',respawnAt:(t.delay??(2+i*7)),s:0,speed:t.speed||8.5,facing:0,x:0,y:0,view:'side',vsign:1,planeYaw:0,switches:0,h:null}));
  // starting crowd: actors with a start position are already in the scene when the walk begins
  for(const n of RW.npcs){const a=n.actor;
    if(n.role==='loiter'){const z=RW.zones.find(z=>z.id===a.zone),slot=z?.slots[a.slot||0];if(slot)Object.assign(n,{state:'loiter',x:slot.x,y:slot.y,story:Number.isInteger(slot.story)?slot.story:(z.story||0),facing:slot.facing,timer:3+RW.rng()*5});}
    else if(n.role==='stoop'&&a.node){const nd=RW.nodes.find(x=>x.id===a.node);if(nd){Object.assign(n,{state:'atNode',node:nd,x:nd.x,y:nd.y,story:nd.story||0,facing:nd.facing,divert:'stoop',timer:a.stay||40});nd.occ=n.id;}}
    else if(a.startS!=null&&n.lane){const q=rwLanePose(n.lane,a.startS);Object.assign(n,{state:'walk',s:a.startS,x:q.x,y:q.y,story:q.story,facing:q.hd});}}
  if(typeof cbStart==='function')cbStart(net);
  if(typeof apStart==='function')apStart(net); /* Combat v0.1: arm the combat bots, weapon and HUD when the scene has routeNet.combat */
  RW.on=true;RW.paused=false;mode='route';rememberMap();active='fp';tool='select';pending=null;selection=null;fit();
  rwEnsureHud();RW.last=0;RW.raf=requestAnimationFrame(rwLoop);refresh();rwSay(RW.control==='encounter'?'Encounter preview started. Look where you want to go and hold W. A/D strafe only; F recenters view.':'Legacy Route walk started. Q/R turn movement facing; mouse is free look and never steers your feet.',6000);return true;
}
function rwStop(){
  if(!RW.on)return;RW.on=false;cancelAnimationFrame(RW.raf);if(document.pointerLockElement)document.exitPointerLock?.();if(typeof cbStop==='function')cbStop();if(typeof apStop==='function')apStop();
  for(const o of project.openings)if(RW.doorsBefore?.has(o.id))o.open=RW.doorsBefore.get(o.id);GLE?.invalidate();liveRev++;rwDisposeMeshes();
  RW.hud?.classList.add('hidden');mode='build';active='iso';if(!restoreMap())fit();refresh();
}
function rwCenterMap(){zoom=Math.max(zoom,4);const g=geometry(),p=rwPlayerPos();activeStory=p.story;const q=C.isoPoint(project,p,p.floorZ);pan.x+=g.cw/2-(g.ox+q.x*g.scale);pan.y+=g.ch/2-(g.oy+q.y*g.scale);drawSoon();}
function rwEnsureHud(){if(RW.hud)return;const d=document.createElement('div');d.className='route-hud hidden';d.id='routeHud';wrap.append(d);RW.hud=d;}
// ------------------------------------------------------------------ HUD, panels
function rwUpdateHud(){
  if(typeof AP!=='undefined'&&AP.on){apUpdateHud();return;}
  const el=RW.hud;if(!el)return;const show=RW.on&&active==='fp';el.classList.toggle('hidden',!show);if(!show)return;const P=RW.pl,S=RW.settings,pos=rwPlayerPos(),aboard=pos.aboard?rwPlayerAboard():null,ex=aboard?null:rwExitsAhead(),door=aboard?null:rwNearestDoorNode(),occ=aboard?null:RW.nodes.find(n=>n.occ==='player');
  const arrow=r=>Math.abs(r)<30?'↑':r<-150||r>150?'↓':r<0?'←':'→';
  const junction=ex&&!ex.dead?`<div class="rh-row">Intersection in ${ex.dist.toFixed(1)} m: ${ex.out.map(o=>`<span class="${o.blocked?'blocked':''}">${arrow(o.rel)} ${esc(o.name)}${o.blocked?' (closed)':''}</span>`).join(' · ')} · <b>${RW.control==='encounter'?'W follows your LOOK':'Q/R choose movement facing'}</b></div>`:ex&&ex.dead&&ex.dist<1.5?`<div class="rh-row">${RW.control==='encounter'?'End of authored movement network':'End of route — Q / R changes movement facing'}</div>`:'';
  const dobj=door?rwDoor(door.door):null,moveYaw=rwPlayerMoveYaw(),lookYaw=rwPlayerLookYaw(),tag=aboard?`BUS INTERIOR · ${esc(aboard.vehicleId)}`:esc(P.edge.name||'route');
  const motion=aboard?`level ${esc(storyName(pos.story))} · MOVE ${rwCardinalName(moveYaw)} ${Math.round(moveYaw)}° · LOOK ${rwCardinalName(lookYaw)} ${Math.round(lookYaw)}° · interior x ${Number(aboard.local?.x||0).toFixed(2)} / z ${Number(aboard.local?.z||0).toFixed(2)} · walk ${Math.abs(P.vAlong).toFixed(1)} m/s · tilt ${Math.round(P.pitch)}°`:`level ${esc(storyName(pos.story))} · MOVE ${rwCardinalName(P.bodyYaw)} ${Math.round(moveYaw)}° · LOOK ${rwCardinalName(P.bodyYaw+P.headYaw)} ${Math.round(lookYaw)}° · speed ${Math.abs(P.vAlong).toFixed(1)} m/s · strafe ${P.off*P.dir>=0?'+':''}${(P.off*P.dir).toFixed(2)} / ±${rwBand(P.edge).toFixed(2)} m · tilt ${Math.round(P.pitch)}°`;
  const keys=aboard?'<b>W/S = move along the bus aisle · A/D = move across it · E = alight only while the automatic passenger door is open at a transit bay</b> · mouse/arrows = look':RW.control==='encounter'?'<b>W = go where you are looking · A/D = lateral only · S = back up · F = recenter view</b> · Q/R optional 90° body turns · mouse/arrows = look':'<b>Q left 90° · R right 90° = MOVEMENT FACING</b> · W/S move by movement facing · mouse/arrows = FREE LOOK · [ / ] quarter-turn free look';
  el.innerHTML=`<div class="rh-row"><b>${aboard?'PUBLIC TRANSIT PASSENGER':RW.control==='encounter'?'ENCOUNTER PREVIEW':'LEGACY ROUTE WALK'}</b> <span class="tag">${tag}</span> ${!aboard&&P.crouch?'<span class="tag warn">CROUCHED</span>':''}${!aboard&&P.tired?'<span class="tag warn">OUT OF BREATH</span>':''}</div>
    <div class="rh-row mono">${motion}</div>
    ${!aboard&&P.stop?`<div class="rh-row warn">${esc(P.stop)}</div>`:junction}${dobj?`<div class="rh-row">${esc(dobj.name)}: ${dobj.open?'open':'closed'} — <b>E</b> to ${dobj.open?'close':'open'}</div>`:''}
    ${occ?`<div class="rh-row">At spot: <b>${esc(occ.name)}</b> (${occ.types.join(', ')})</div>`:''}
    <div class="rh-row ${RW.markSees?'warn':''}">Mark: ${esc(RW.markWhy)}</div>
    ${RW.vehicleWorld?rwWorldHud():RW.vehicleLoop?(()=>{const q=rwVehicleSummary();return `<div class="rh-row">Traffic AI: <b>${q.tracked}</b> tracked · ${q.braking} braking · ${q.following} following · ${q.openingGap} opening gap · ${q.pedestrianContacts} person contacts</div>`;})():''}
    ${RW.msg&&performance.now()<RW.msgT?`<div class="rh-row msg">${esc(RW.msg)}</div>`:''}
    <div class="rh-keys">${keys}${aboard?'':' · C crouch · Shift sprint'} · Tab debug (${['off','labels','full'][S.debug]}) · Esc leave</div>`;
}
function rwSlider(label,key,min,max,step,unitTxt=''){const v=RW.settings[key];return `<div class="range-field"><label>${esc(label)}${unitTxt?' ('+unitTxt+')':''}</label><div class="range-controls"><input type="range" data-rw="${key}" min="${min}" max="${max}" step="${step}" value="${v}"><input type="number" data-rw="${key}" min="${min}" max="${max}" step="${step}" value="${v}"></div></div>`;}
function rwCheck(label,key){return `<label class="check"><input type="checkbox" data-rw="${key}" ${RW.settings[key]?'checked':''}>${esc(label)}</label>`;}
function rwLeftPanel(){
  const chars=[...(RW.chars?.values()||[])],charNote=chars.length?`<p>People on this street are <b>character cards</b>: ${chars.map(r=>esc(r.pack.name||r.pack.id)).join(', ')}${chars.some(r=>!r.ready)?' (loading…)':''}. Each one switches picture by your viewing angle, walks its lanes, and its head can turn toward you. NPCs without a character use the coloured placeholder cards.</p>`:'';
  return `<div class="section"><div class="row"><h2 class="grow">${RW.control==='encounter'?'Encounter movement preview':'Legacy Route walk'}</h2><span class="badge">${RW.control==='encounter'?'R2':'LEGACY'}</span></div>${charNote}<p>You are walking an authored route. Placeholder cards (NPCs without a character): <b style="color:${RW_VIEW_COLOR.front}">FRONT</b>, <b style="color:${RW_VIEW_COLOR.q}">3/4</b>, <b style="color:${RW_VIEW_COLOR.back}">BACK</b> and <b style="color:${RW_VIEW_COLOR.side}">SIDE</b> (diagnostic only). Change the sliders while walking.</p><button class="block" data-rw-act="stop">${RW.control==='encounter'?'Leave Encounter preview':'Leave legacy Route walk'} (Esc)</button></div>${RW.vehicleWorld&&typeof trafficPreviewPanel==='function'?trafficPreviewPanel():''}${RW.vehicleWorld&&typeof rwWorldTransitPanel==='function'?rwWorldTransitPanel():''}
    <div class="section"><h3>Player</h3>${RW.control==='encounter'?'<p><b>Encounter controls</b> — look where you want to travel and hold W. The movement network chooses the legal continuation at the junction. A/D only move you sideways inside the current movement band. F snaps the view back to body-forward. Q/R are optional exact 90° body turns; ordinary corners do not require them.</p>':'<p><b>Movement facing</b> — Q turns left 90°, R turns right 90°. W always follows this direction at an intersection, even while you are looking somewhere else.</p>'}<div class="button-row"><button data-rw-move-face="0">Move N ↑</button><button data-rw-move-face="90">Move E →</button><button data-rw-move-face="180">Move S ↓</button><button data-rw-move-face="270">Move W ←</button></div><p><b>Free look</b>${RW.control==='encounter'?' supplies W’s travel intent at junctions.':' — mouse/arrows do not steer your feet.'}</p><div class="button-row"><button data-rw-face="0">Look N ↑</button><button data-rw-face="90">Look E →</button><button data-rw-face="180">Look S ↓</button><button data-rw-face="270">Look W ←</button></div><p class="subtle">${RW.control==='encounter'?'F recenters LOOK to BODY. Q / R rotate BODY exactly 90° and carry the view with it.':'[ and ] rotate FREE LOOK by 90°. Q / R rotate MOVEMENT FACING by 90°.'}</p>${rwSlider('Strafe band, each side','strafe',0,1.5,.05,'m')}${rwSlider('Look left/right limit','lookYaw',30,180,1,'°')}${rwSlider('Look up limit','lookUp',0,60,1,'°')}${rwSlider('Look down limit','lookDown',0,60,1,'°')}${rwSlider('Turn-around time','turnTime',.1,1.2,.05,'s')}${rwSlider('Walking speed','walk',.8,2.5,.05,'m/s')}${rwSlider('Lens angle','fov',55,100,1,'°')}${rwCheck('Walking bob','bob')}</div>
    ${chars.length?`<div class="section"><h3>Character cards</h3>${rwCheck('Heads turn on their own (separate head card)','charHeads')}${rwCheck('Shadow under the feet','charShadow')}${rwCheck('Pixel look (sharp pixels up close)','charPixel')}${rwSlider('Character brightness','charLight',.4,1.4,.02)}</div>`:''}
    <div class="section"><h3>NPC sprite cheating</h3>${rwSlider('Rubber band (card turns toward you)','rubber',0,60,1,'°')}${rwSlider('Leftover angle allowed before switching','tolerance',0,45,1,'°')}${rwSlider('Hysteresis (resists flicker)','hysteresis',0,30,1,'°')}${rwSlider('Head turn limit','headMax',0,90,1,'°')}${rwCheck('Cheat more with distance','distCheat')}${rwCheck('More hysteresis up close','nearHyst')}${rwCheck('Allow a SIDE card (diagnostic)','allowSide')}${rwCheck('Allow a BACK 3/4 card (diagnostic)','allowBackQ')}
      <label>Debug overlay<select data-rw="debug"><option value="0" ${RW.settings.debug==0?'selected':''}>Off</option><option value="1" ${RW.settings.debug==1?'selected':''}>Labels</option><option value="2" ${RW.settings.debug==2?'selected':''}>Full</option></select></label>
      <p class="subtle"><b>The dial in each full label</b> is seen from above, with you at the white dot. Green arrow: where the NPC really faces. Dashed line: the angle its art was drawn for. Thick bar: the card itself. Pink: its head. Red text: the card is seen too edge-on.</p></div>
    <div class="section"><h3>Map colours</h3><p>Yellow: your route and strafe band (dotted = a spot you can step into). Cyan: NPC lanes. Orange dashes: traffic. Pink box: gathering zone. Circles: spots (green free, orange reserved, red taken, yellow you). ◆ purple: hidden way in/out, red when you can see it (nothing may appear there then). White diamond: junction.</p></div>`;
}
function rwRightPanel(){
  const s=rwStatsSummary(),cls=Object.entries(s.bodyViewShareByClass).map(([k,v])=>`<tr><td>${esc(RW_CLASS[k]?.label||k)}</td><td>${v.FRONT}</td><td>${v['3/4']}</td><td>${v.BACK}</td><td class="${v.SIDE?'warn':''}">${v.SIDE}</td></tr>`).join('');
  const b=s.trueAngleShare.all,bm=s.trueAngleShare.moving,r=s.rules;
  return `<section class="section"><span class="eyebrow">Live measurements · ${s.seconds}s walked · ${s.npcOnScreenSeconds}s of NPCs on screen</span>
    <h3>Body card shown (% of on-screen time)</h3><table class="rw-table"><tr><th></th><th>FRONT</th><th>3/4</th><th>BACK</th><th>SIDE</th></tr>${cls||'<tr><td colspan="5">No NPC on screen yet</td></tr>'}</table>
    <h3>If a SIDE card were allowed (% of time it would be picked)</h3><table class="rw-table"><tr><th></th><th>FRONT</th><th>3/4</th><th>BACK</th><th>SIDE</th></tr>${Object.entries(s.bodyViewShareByClass).filter(([k,v])=>v.ifSideAllowed).map(([k,v])=>`<tr><td>${esc(RW_CLASS[k]?.label||k)}</td><td>${v.ifSideAllowed.FRONT}</td><td>${v.ifSideAllowed['3/4']}</td><td>${v.ifSideAllowed.BACK}</td><td class="warn">${v.ifSideAllowed.SIDE}</td></tr>`).join('')||'<tr><td colspan="5">—</td></tr>'}</table>
    <h3>Art sets compared (walking NPCs)</h3><table class="rw-table"><tr><th></th><th>&gt;30° wrong %</th><th>avg °</th><th>worst °</th></tr>${Object.entries(s.artSets).map(([k,a])=>`<tr><td>${esc(k)}</td><td>${a.walkingArtWrongOver30}</td><td>${a.meanErrorWhileWalking}</td><td>${a.worstError}</td></tr>`).join('')||'<tr><td colspan="4">—</td></tr>'}</table>
    <h3>True viewing angle (% of on-screen time)</h3><table class="rw-table"><tr><th></th><th>front</th><th>3/4</th><th>side</th><th>back 3/4</th><th>back</th></tr><tr><td>all</td><td>${b.F}</td><td>${b.Q}</td><td class="warn">${b.S}</td><td>${b.BQ}</td><td>${b.B}</td></tr><tr><td>walking</td><td>${bm.F}</td><td>${bm.Q}</td><td class="warn">${bm.S}</td><td>${bm.BQ}</td><td>${bm.B}</td></tr></table>
    <h3>Where the cheat shows (% of on-screen time)</h3><table class="rw-table"><tr><th></th><th>near &lt;8 m</th><th>mid</th><th>far &gt;20 m</th></tr><tr><td>card seen edge-on</td><td>${s.cardWrongShare_residualOverTolerance.near}</td><td>${s.cardWrongShare_residualOverTolerance.mid}</td><td>${s.cardWrongShare_residualOverTolerance.far}</td></tr><tr><td>walking, art faces &gt;30° wrong</td><td>${s.moonwalkShare_movingErrorOver30.near}</td><td>${s.moonwalkShare_movingErrorOver30.mid}</td><td>${s.moonwalkShare_movingErrorOver30.far}</td></tr></table>
    <p class="subtle">View changes per NPC per minute on screen: <b>${s.viewSwitchesPerNpcMinute}</b> · traffic car: front ${s.carViewShare.FRONT}% / side ${s.carViewShare.SIDE}% / back ${s.carViewShare.BACK}%</p>
    <h3>Rules</h3><table class="rw-table"><tr><td>spawns / despawns</td><td>${r.spawns} / ${r.despawns}</td></tr><tr><td>appeared or vanished in view</td><td class="${r.spawnInView+r.despawnInView+r.carDespawnInView?'warn':''}">${r.spawnInView+r.despawnInView+r.carDespawnInView}</td></tr><tr><td>two characters on one spot</td><td class="${r.nodeConflicts?'warn':''}">${r.nodeConflicts}</td></tr><tr><td>same-direction overtakes</td><td>${r.sameDirectionOvertakes}</td></tr><tr><td>you bumped into an NPC (s)</td><td>${r.playerBumpedIntoNpcSeconds}</td></tr><tr><td>shots / hits / blocked</td><td>${s.player.shots} / ${s.player.hits} / ${s.player.blockedShots}</td></tr><tr><td>mark could see you</td><td>${s.player.markCouldSeeYouSeconds}s</td></tr></table>
    <div class="button-row"><button data-rw-act="reset">Reset counts</button><button data-rw-act="export">Download measurements</button></div></section>`;
}
function rwUpdatePanels(){
  if(typeof AP!=='undefined'&&AP.on)return;if(!RW.on)return;const el=$('inspector');if(el&&!el.matches(':hover'))el.innerHTML=rwRightPanel();}
HOOKS.leftRender.push(el=>{if(RW.on){el.innerHTML=rwLeftPanel();return;}
  if(pane==='rails'&&project.routeNet){const n=project.routeNet;el.insertAdjacentHTML('beforeend',`<div class="section"><h3>Route network · prototype</h3><p>${n.edges.length} player route pieces · ${n.lanes.length} NPC lanes · ${n.nodes.length} spots · ${n.zones.length} gathering zone · ${n.traffic.length} traffic lanes.</p><button class="primary block" data-rw-act="start">▶ Route walk</button><label class="check"><input type="checkbox" id="rwShowMap" ${RW.showMap?'checked':''}>Show the route network on the map</label></div>`);}});
HOOKS.inspectorRender.push(el=>{if(RW.on)el.innerHTML=rwRightPanel();});
HOOKS.click.push((e,b)=>{if(b.dataset.rwMoveFace!==undefined){(RW.control==='encounter'?rwFaceMoveEncounter:rwFaceMove)(Number(b.dataset.rwMoveFace));return true;}if(b.dataset.rwFace!==undefined){rwFaceView(Number(b.dataset.rwFace));return true;}const a=b.dataset.rwAct;if(!a)return false;
  if(a==='start')rwStart();else if(a==='stop')rwStop();else if(a==='reset'){rwResetStats();rwUpdatePanels();}
  else if(a==='export'){download(new Blob([JSON.stringify(rwStatsSummary(),null,1)],{type:'application/json'}),'route_walk_measurements.json');}
  return true;});
document.addEventListener('input',e=>{const el=e.target;if(!el.matches?.('[data-rw]'))return;const k=el.dataset.rw;let v=el.type==='checkbox'?el.checked:Number(el.value);if(el.type!=='checkbox'&&!Number.isFinite(v))return;RW.settings[k]=v;if(RW.control==='encounter')RW.encounterUserSettings={...(RW.encounterUserSettings||{}),[k]:v};else RW.userSettings={...(RW.userSettings||{}),[k]:v};document.querySelectorAll(`[data-rw="${k}"]`).forEach(o=>{if(o!==el&&o.type!=='checkbox')o.value=el.value;});drawSoon();});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='rwShowMap'){RW.showMap=el.checked;drawSoon();return;}if(el.matches?.('[data-rw]')&&(el.type==='checkbox'||el.tagName==='SELECT')){const k=el.dataset.rw;RW.settings[k]=el.type==='checkbox'?el.checked:Number(el.value);if(RW.control==='encounter')RW.encounterUserSettings={...(RW.encounterUserSettings||{}),[k]:RW.settings[k]};else RW.userSettings={...(RW.userSettings||{}),[k]:RW.settings[k]};drawSoon();}});
HOOKS.top.push(()=>{
  const b=$('routeBtn'),ep=$('encounterBtn');if(b){b.disabled=mode==='test'||!project.routeNet||(RW.on&&RW.control==='encounter');b.classList.toggle('active',RW.on&&RW.control==='legacy');b.textContent=RW.on&&RW.control==='legacy'?'Leave legacy route':'Legacy route';}if(ep){ep.disabled=mode==='test'||!project.routeNet||(RW.on&&RW.control==='legacy');ep.classList.toggle('active',RW.on&&RW.control==='encounter');ep.textContent=RW.on&&RW.control==='encounter'?'Leave Encounter preview':'Encounter preview';}
  if(RW.on){document.querySelectorAll('[data-tool]').forEach(x=>x.disabled=true);$('testBtn').disabled=true;$('viewSelect').disabled=true;if(RW.control==='encounter'){$('stageTitle').innerHTML='<b>Encounter movement preview</b><small>Mouse = look · W = travel intent · A/D = lateral only</small>';$('guideText').textContent='Encounter preview: look where you want to go and hold W. The movement network quietly chooses the legal continuation. A/D strafe only, S backs up, F recenters view, Q/R are optional body turns. At a closed door, walk to its approach marker; E opens it, then W continues through the short gated threshold.';}else{$('stageTitle').innerHTML='<b>Legacy Route walk</b><small>Movement facing and free look are independent · intersections use movement facing</small>';$('guideText').textContent='Legacy Route walk: Q/R set movement facing. W follows movement facing; mouse/arrows only free-look.';}}
  else $('testBtn').disabled=mode==='test'&&false;
  rwUpdateHud();
});
// ------------------------------------------------------------------ input
const RW_KEYS={KeyW:'fwd',ArrowUp:'fwd',KeyS:'back',ArrowDown:'back',KeyA:'left',KeyD:'right',ArrowLeft:'lookL',ArrowRight:'lookR',PageUp:'lookU',PageDown:'lookD'};
document.addEventListener('keydown',e=>{
  if(!RW.on)return;const editing=/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);if(editing&&e.key!=='Escape')return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(typeof AP!=='undefined'&&AP.on){AP.expectedUnlock=document.pointerLockElement===canvas;if(AP.expectedUnlock)document.exitPointerLock?.();apClearInput();AP.paused=true;AP.notice='Paused. P resumes; Enter resets this drill.';apUpdateHud();drawSoon();return;}rwStop();return;}
  const k=RW_KEYS[e.code];e.preventDefault();e.stopImmediatePropagation();
  if(typeof AP!=='undefined'&&AP.on){apKey(e);return;}
  if(k){RW.in[k]=true;return;}if(e.key==='Shift'){RW.in.sprint=true;return;}if(e.repeat)return;
  if(typeof cbKey==='function'&&cbKey(e))return; /* Combat v0.1: R reload, Enter restart (combat scenes only) */
  if(e.code==='BracketLeft')rwQuarterView(-1);else if(e.code==='BracketRight')rwQuarterView(1);else if((e.code==='KeyQ'||e.code==='KeyR')&&RW.control==='legacy')rwLegacyTurnKey(e);else if(e.code==='KeyQ')rwQuarterMoveEncounter(-1);else if(e.code==='KeyR')rwQuarterMoveEncounter(1);else if(e.code==='KeyF'&&RW.control==='encounter')rwSnapViewToBody();else if(e.code==='KeyC')RW.pl.crouch=!RW.pl.crouch;else if(e.code==='KeyE')rwToggleDoor();else if(e.code==='Space')rwShoot();
  else if(e.code==='Tab'){RW.settings.debug=(RW.settings.debug+1)%3;renderLeft();}else if(e.key==='1'){const rp=rwPlayerPos();activeStory=rp.story;active='iso';if(!restoreMap())fit();rwCenterMap();refresh();}else if(e.key==='3'||e.key==='2'){active='fp';fit();refresh();}
},true);
document.addEventListener('keyup',e=>{if(!RW.on)return;const k=RW_KEYS[e.code];if(k)RW.in[k]=false;if(e.key==='Shift')RW.in.sprint=false;},true);
window.addEventListener('blur',()=>{RW.in={};});
HOOKS.pointerDown.unshift((e,q)=>{if(!RW.on)return false;if(active!=='fp')return true;
  if(typeof AP!=='undefined'&&AP.on)return apPointerDown(e);
  if(document.pointerLockElement===canvas){rwShoot();return true;}RW.drag={x:e.clientX,y:e.clientY,moved:false,yaw:RW.pl.headYaw,pitch:RW.pl.pitch};return true;});
HOOKS.pointerMove.unshift(e=>{if(typeof AP!=='undefined'&&AP.on)return apPointerMove(e);if(!RW.on||!RW.drag)return false;const d=RW.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)<4)return true;d.moved=true;const S=RW.settings;
  RW.pl.headYaw=C.clamp(d.yaw-dx*S.mouseSens*1.6,-S.lookYaw,S.lookYaw);RW.pl.pitch=C.clamp(d.pitch+dy*S.mouseSens,-S.lookDown,S.lookUp);return true;});
HOOKS.pointerUp.unshift(e=>{if(typeof AP!=='undefined'&&AP.on)return apPointerUp(e);if(!RW.on)return false;const d=RW.drag;RW.drag=null;if(d&&!d.moved&&active==='fp'){try{const r=canvas.requestPointerLock?.();r?.catch?.(()=>{});}catch(_){}rwSay('Mouse captured: move to look, click to shoot. Esc frees the mouse.',3500);}return true;}); // the first click only captures the mouse
document.addEventListener('mousemove',e=>{if(!RW.on||document.pointerLockElement!==canvas)return;if(typeof AP!=='undefined'&&AP.on){apLook(e.movementX,e.movementY);return;}const S=RW.settings;RW.pl.headYaw=C.clamp(RW.pl.headYaw+e.movementX*S.mouseSens,-S.lookYaw,S.lookYaw);RW.pl.pitch=C.clamp(RW.pl.pitch-e.movementY*S.mouseSens,-S.lookDown,S.lookUp);});
HOOKS.wheel.unshift(()=>RW.on&&active==='fp');HOOKS.dblClick.unshift(()=>RW.on);
// ------------------------------------------------------------------ debug overlay: first person
function rwFP(v,p,h=0){const f=Number.isFinite(p.floorZ)?p.floorZ:C.storyElevation(project,Number.isInteger(p.story)?p.story:0);return C.fpPoint(v,{x:p.x,y:p.y,floorZ:f},h);}
function rwFPLine(g,v,pts,{color,width=2,dash=null,k}={}){
  // Straight ground lines stay straight in perspective, so only the part behind the camera needs cutting off.
  const f=C.basis(v.facing),dep=p=>(p.x-v.x)*f.fx+(p.y-v.y)*f.fy,NEAR=.4;
  g.save();g.strokeStyle=color;g.lineWidth=width*k;if(dash)g.setLineDash(dash.map(d=>d*k));g.beginPath();
  for(let i=1;i<pts.length;i++){let a=pts[i-1],b=pts[i];const da=dep(a),db=dep(b);if(da<NEAR&&db<NEAR)continue;
    if(da<NEAR){const t=(NEAR-da)/(db-da);a={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}else if(db<NEAR){const t=(NEAR-da)/(db-da);b={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
    const qa=rwFP(v,a),qb=rwFP(v,b);if(!qa||!qb)continue;g.moveTo(qa.x,qa.y);g.lineTo(qb.x,qb.y);}
  g.stroke();g.restore();
}
function rwCompass(g,cx,cy,r,n,k){const c=rwCam(),up=C.heading(c,n),pt=(h,rr)=>{const a=C.rad(h-up);return {x:cx+Math.sin(a)*rr,y:cy-Math.cos(a)*rr};},ln=(p,q,col,w,dash)=>{g.strokeStyle=col;g.lineWidth=w*k;g.setLineDash(dash?dash.map(d=>d*k):[]);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();};
  const o={x:cx,y:cy};g.save();g.strokeStyle='#ffffff38';g.lineWidth=k;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();
  const ideal=C.norm(n.planeYaw-n.plane);ln(o,pt(ideal,r),RW_VIEW_COLOR[n.view],1.2,[2,2]);
  ln(pt(n.planeYaw+90,r*.62),pt(n.planeYaw-90,r*.62),RW_VIEW_COLOR[n.view],3.2);ln(o,pt(n.planeYaw,r*.42),RW_VIEW_COLOR[n.view],1.6);
  ln(o,pt(n.facing,r*.95),'#7fe0a0',1.8);const t=pt(n.facing,r*.95),bk=pt(n.facing+180,0);g.fillStyle='#7fe0a0';g.beginPath();g.arc(t.x,t.y,2.2*k,0,Math.PI*2);g.fill();
  ln(o,pt(n.facing+n.head,r*.7),'#f08ad0',1.4);const cm=pt(up+180,r);g.fillStyle='#fff';g.beginPath();g.arc(cm.x,cm.y,2.6*k,0,Math.PI*2);g.fill();g.restore();}
function routeFPOverlay(g,v){
  if(typeof AP!=='undefined'&&AP.on){apOverlay(g,v,1/geometry().scale);return;}
  if(!RW.on||!v||!['Route walk','Encounter preview'].includes(v.name))return;const S=RW.settings,k=1/geometry().scale,W=v.width,H=v.height;
  if(S.debug>=2){
    for(const e of RW.graph.edges){rwFPLine(g,v,[e.A,e.B],{color:'#ffd27add',width:2.5,k});const bd=rwBand(e);if(bd>.01)for(const s of [-1,1])rwFPLine(g,v,[{x:e.A.x+e.rx*bd*s,y:e.A.y+e.ry*bd*s},{x:e.B.x+e.rx*bd*s,y:e.B.y+e.ry*bd*s}],{color:'#ffd27a88',width:1.2,dash:[6,5],k});}
    for(const l of RW.lanes.values())rwFPLine(g,v,l.pts,{color:l.kind==='traffic'?'#ff9a4a99':'#56d6e0aa',width:1.6,dash:l.kind==='traffic'?[10,8]:null,k});
    for(const z of RW.zones){const c=[{x:z.x,y:z.y},{x:z.x+z.width,y:z.y},{x:z.x+z.width,y:z.y+z.length},{x:z.x,y:z.y+z.length},{x:z.x,y:z.y}];rwFPLine(g,v,c,{color:'#e47cf0cc',width:2,k});}
    for(const vx of RW.graph.verts.values()){if(vx.edges.length<3)continue;const q=rwFP(v,vx);if(q&&q.depth>.4){const s=7*k;g.fillStyle='#ffffff';g.beginPath();g.moveTo(q.x,q.y-s);g.lineTo(q.x+s,q.y);g.lineTo(q.x,q.y+s);g.lineTo(q.x-s,q.y);g.fill();}}
    for(const pt of RW.net.portals){const q=rwFP(v,pt);if(q&&q.depth>.4){const vis=rwVisible(pt);g.fillStyle=vis?'#ff5d5d':'#b07cff';g.font=`bold ${9*k}px Segoe UI`;g.textAlign='center';g.fillText('◆ '+(pt.kind==='vehicle'?'car in/out':pt.kind+' in/out'),q.x,q.y);}}
  }
  if(S.debug>=2&&typeof propsRouteFP==='function')propsRouteFP(g,v,k);
  if(S.debug>=2)for(const nd of RW.nodes)if(nd.edge){const e=nd.edge;rwFPLine(g,v,[{x:e.A.x+e.ux*nd.s,y:e.A.y+e.uy*nd.s},nd],{color:'#ffd27aaa',width:1.4,dash:[3,4],k});}
  if(S.debug>=1)for(const nd of RW.nodes){const q=rwFP(v,nd);if(!q||q.depth<.4)continue;const r=Math.max(4*k,nd.radius*q.scale),col=nd.occ==='player'?'#ffd27a':nd.occ?'#ff6b6b':nd.res?'#ffb35c':'#7fe0a0';
    g.save();g.strokeStyle=col;g.lineWidth=2*k;g.beginPath();g.ellipse(q.x,q.y,r,r*.35,0,0,Math.PI*2);g.stroke();if(S.debug>=2||nd.occ||nd.res){g.font=`${9.5*k}px Segoe UI`;g.fillStyle=col;g.textAlign='center';g.fillText(`${nd.name}${nd.occ?' · '+(nd.occ==='player'?'YOU':'taken'):nd.res?' · reserved':''}`,q.x,q.y-6*k);}g.restore();}
  if(S.debug>=1){ // labels: nearest first; a label that would overlap another moves up, or is dropped
    const vis=RW.npcs.filter(n=>n.state!=='hidden'&&n.onScreen).sort((a,b)=>a.dist-b.dist),placed=[],sg=x=>(x>=0?'+':'')+Math.round(x);
    const fits=(x,y,w,h)=>!placed.some(r=>x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y);
    vis.forEach((n,i)=>{const top=rwFP(v,n,1.98),foot=rwFP(v,n,0);if(!top||top.depth<.4)return;
      const full=S.debug>=2&&(i<3||n.dist<12),bad=n.resid>S.tolerance,vl=RW_VIEW_LABEL[n.view]+(n.view==='q'||n.view==='side'||n.view==='bq'?(n.vsign>0?'R':'L'):'')+(n.cards?' · '+n.pose:'');
      const L=full?[`${n.name} · ${n.dist.toFixed(1)} m · ${n.state}${n.divert?' / '+n.divert:''}`,`body ${vl} · true angle ${Math.round(n.theta)}°`,`card turned ${sg(n.plane)}° · edge-on ${Math.round(n.resid)}°`,`head ${sg(n.head)}° → ${n.h.view}${n.attn?' · watching you':''}`]:[`${vl} ${Math.round(n.theta)}° · ${n.dist.toFixed(0)} m`];
      g.save();g.font=`${(full?10.5:10)*k}px Consolas, monospace`;const lh=12.5*k,cw=full?46*k:0,w=Math.max(...L.map(t=>g.measureText(t).width))+10*k+cw,h=Math.max(L.length*lh+6*k,full?44*k:0);
      let x=top.x-w/2,y=top.y-h-4*k,tries=0;while(!fits(x,y,w,h)&&tries<6){y-=h*.6+2*k;tries++;}if(!fits(x,y,w,h)||y<H*.13){g.restore();return;}placed.push({x,y,w,h});
      if(tries){g.strokeStyle='#ffffff55';g.lineWidth=k;g.beginPath();g.moveTo(top.x,y+h);g.lineTo(top.x,top.y);g.stroke();}
      g.fillStyle='#0c1823d8';g.fillRect(x,y,w,h);g.fillStyle=RW_VIEW_COLOR[n.view];g.fillRect(x,y,3*k,h);
      g.fillStyle=bad?'#ff8f7a':'#e8f4ee';g.textAlign='left';L.forEach((t,j)=>g.fillText(t,x+cw+7*k,y+(j+1)*lh));
      if(full)rwCompass(g,x+cw/2+3*k,y+h/2,17*k,n,k);g.restore();
      if(S.debug>=2&&foot){const f=C.basis(n.facing),tip=rwFP(v,{x:n.x+f.fx*1.1,y:n.y+f.fy*1.1},0);if(tip&&tip.depth>.4){g.save();g.strokeStyle='#7fe0a0';g.lineWidth=2.5*k;g.beginPath();g.moveTo(foot.x,foot.y);g.lineTo(tip.x,tip.y);g.stroke();g.restore();}}});
  }
  if(S.debug>=1)for(const car of RW.cars){if(car.state==='hidden'||!car.onScreen)continue;const top=rwFP(v,car,1.7);if(!top||top.depth<.4)continue;g.save();g.font=`${11*k}px Consolas, monospace`;g.fillStyle=car.braking?'#ff7f72':car.aiState==='opening-gap'?'#ffd27a':'#ffb98a';g.textAlign='center';const lab=RW.vehicleLoop?`${car.label} · ${car.aiState} · ${car.driver?.name||''} · ${car.speed.toFixed(1)} m/s`:`car ${car.view.toUpperCase()} · true ${Math.round(car.theta)}° · ${car.dist.toFixed(0)} m`;g.fillText(lab,top.x,top.y);g.restore();}
  if(RW.vehicleWorld)rwWorldFPOverlay(g,v,k);
  if(typeof cbOverlay==='function'&&cbOverlay(g,v,k))return; /* Combat v0.1: pistol, tracers, flashes, Trapstar HUD and its own crosshair */
  // crosshair
  g.save();g.strokeStyle='#ffffffcc';g.lineWidth=1.6*k;const cx=W/2,cy=H*RW_AIM_Y,s=9*k;g.beginPath();g.moveTo(cx-s,cy);g.lineTo(cx-3*k,cy);g.moveTo(cx+3*k,cy);g.lineTo(cx+s,cy);g.moveTo(cx,cy-s);g.lineTo(cx,cy-3*k);g.moveTo(cx,cy+3*k);g.lineTo(cx,cy+s);g.stroke();g.restore();
}
// ------------------------------------------------------------------ debug overlay: map (and the small map beside first person)
function rwMapLayers(g,k){
  const net=project.routeNet;if(!net||(!RW.showMap&&!RW.on))return;
  const focus=(active==='iso'&&Number.isInteger(activeStory))?activeStory:(RW.on?rwPlayerPos().story:0);
  const storyOf=(q,fallback=focus)=>Number.isInteger(q?.story)?q.story:fallback;
  const P=(q,story=storyOf(q))=>C.isoPoint(project,q,C.storyElevation(project,story));
  const line=(pts,col,w,dash,stories=null)=>{g.save();g.strokeStyle=col;g.lineWidth=w*k;if(dash)g.setLineDash(dash.map(d=>d*k));g.beginPath();pts.map((q,i)=>P(q,stories?stories[i]:storyOf(q))).forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();g.restore();};
  const graph=RW.on?RW.graph:rwBuildGraph(net),band=RW.on?RW.settings.strafe:(net.settings?.defaults?.strafe??RW_DEFAULTS.strafe);
  for(const l of [...net.lanes,...net.traffic]){const ls=storyOf(l,storyOf(l.points?.[0],0));if(ls!==focus)continue;const tr=net.traffic.includes(l);line(l.points,tr?'#ff9a4aaa':'#56d6e0cc',tr?1.4:1.8,tr?[8,6]:null,l.points.map(q=>storyOf(q,ls)));const a=l.points[l.points.length-2],b=l.points[l.points.length-1];if(a&&b){const A=P(a,storyOf(a,ls)),B=P(b,storyOf(b,ls)),ang=Math.atan2(B.y-A.y,B.x-A.x),s=6*k;g.fillStyle=tr?'#ff9a4a':'#56d6e0';g.beginPath();g.moveTo(B.x,B.y);g.lineTo(B.x-Math.cos(ang-.5)*s,B.y-Math.sin(ang-.5)*s);g.lineTo(B.x-Math.cos(ang+.5)*s,B.y-Math.sin(ang+.5)*s);g.fill();}}
  for(const e of graph.edges){const sa=storyOf(e.A,0),sb=storyOf(e.B,sa);if(sa!==focus&&sb!==focus)continue;const bd=Math.min(e.band??9,band),transition=sa!==sb;line([e.A,e.B],transition?'#f2b5ff':'#ffd27a',2.6,null,[sa,sb]);if(!transition&&bd>.01)for(const s of [-1,1])line([{x:e.A.x+e.rx*bd*s,y:e.A.y+e.ry*bd*s,story:sa},{x:e.B.x+e.rx*bd*s,y:e.B.y+e.ry*bd*s,story:sb}],'#ffd27a99',1,[4,4],[sa,sb]);if(e.door){const mid={x:(e.A.x+e.B.x)/2,y:(e.A.y+e.B.y)/2},m=P(mid,focus);g.fillStyle=rwEdgeBlock(e)?'#ff6b6b':'#7fe0a0';g.font=`bold ${9*k}px Segoe UI`;g.fillText(rwEdgeBlock(e)?'DOOR SHUT':'DOOR',m.x+4*k,m.y);}}
  for(const vx of graph.verts.values()){if(storyOf(vx,0)!==focus||vx.edges.length<3)continue;const q=P(vx,focus),s=6*k;g.fillStyle='#fff';g.beginPath();g.moveTo(q.x,q.y-s);g.lineTo(q.x+s,q.y);g.lineTo(q.x,q.y+s);g.lineTo(q.x-s,q.y);g.fill();}
  for(const zn of net.zones){const zs=storyOf(zn,0);if(zs!==focus)continue;R.polygon(g,[{x:zn.x,y:zn.y},{x:zn.x+zn.width,y:zn.y},{x:zn.x+zn.width,y:zn.y+zn.length},{x:zn.x,y:zn.y+zn.length}].map(q=>P(q,zs)),'#e47cf022','#e47cf0',1.6*k);}
  const nodes=RW.on?RW.nodes:net.nodes;if(RW.on)for(const nd of nodes)if(nd.edge&&storyOf(nd,0)===focus){const e=nd.edge;line([{x:e.A.x+e.ux*nd.s,y:e.A.y+e.uy*nd.s,story:focus},nd],'#ffd27a',1.4,[2,3],[focus,focus]);}
  for(const nd of nodes){const ns=storyOf(nd,0);if(ns!==focus)continue;const q=P(nd,ns),col=nd.occ==='player'?'#ffd27a':nd.occ?'#ff6b6b':nd.res?'#ffb35c':'#7fe0a0';g.save();g.strokeStyle=col;g.lineWidth=2*k;g.beginPath();g.arc(q.x,q.y,5.5*k,0,Math.PI*2);g.stroke();g.fillStyle=col;g.font=`${8.5*k}px Segoe UI`;g.fillText((nd.types||[]).map(t=>t[0].toUpperCase()).join(''),q.x+7*k,q.y+3*k);g.restore();}
  for(const pt of net.portals){const ps=storyOf(pt,0);if(ps!==focus)continue;const q=P(pt,ps);g.fillStyle=RW.on&&rwVisible(pt)?'#ff5d5d':'#b07cff';g.font=`bold ${9*k}px Segoe UI`;g.fillText('◆',q.x-3*k,q.y+3*k);}
  if(RW.on){for(const n of RW.npcs){if(n.state==='hidden'||rwActorStory(n)!==focus)continue;const q=P(n,focus),f=C.basis(n.facing),t=P({x:n.x+f.fx*.9,y:n.y+f.fy*.9},focus);g.save();g.fillStyle=RW_VIEW_COLOR[n.view];g.strokeStyle='#0c1823';g.lineWidth=1.5*k;g.beginPath();g.arc(q.x,q.y,4.5*k,0,Math.PI*2);g.fill();g.stroke();g.strokeStyle=RW_VIEW_COLOR[n.view];g.beginPath();g.moveTo(q.x,q.y);g.lineTo(t.x,t.y);g.stroke();g.restore();}
    if(RW.vehicleWorld)rwWorldMapLayer(g,k,P,focus);else for(const car of RW.cars){if(car.state==='hidden'||storyOf(car.lane,0)!==focus)continue;const q=P(car,focus);g.fillStyle='#ff9a4a';g.fillRect(q.x-5*k,q.y-3*k,10*k,6*k);}
    if(active==='iso')drawCamMarker(g,routeWalkView(),k,'#ffd27a','You');}
}
HOOKS.underGraph.push(rwMapLayers);
// ------------------------------------------------------------------ header button and safety
{const tb=$('testBtn');if(tb&&!$('routeBtn')){const b=document.createElement('button');b.id='routeBtn';b.textContent='Legacy route';b.title='Legacy Route Walk diagnostic: movement facing and free look are separate.';tb.parentNode.insertBefore(b,tb);b.onclick=()=>RW.on?rwStop():rwStart('legacy');}if(tb&&!$('encounterBtn')){const b=document.createElement('button');b.id='encounterBtn';b.className='outline';b.textContent='Encounter preview';b.title='Preview the authored movement network with the accepted Encounter-style controls: gaze + W steering, lateral A/D.';tb.parentNode.insertBefore(b,$('routeBtn')||tb);b.onclick=()=>RW.on?rwStop():rwStart('encounter');}}
HOOKS.action.push(name=>{if(RW.on&&name!=='close-modal'){return true;}return false;});
EXT.route={RW,buildSight:rwBuildSight,sightBlock:(a,za,b,zb)=>rwSightBlock(a,za,b,zb),select:rwSelectView,start:rwStart,startLegacy:()=>rwStart('legacy'),startEncounter:()=>rwStart('encounter'),loadEncounterTestRoom:rwLoadEncounterTestRoom,fixture:rwEncounterTestProject,stop:rwStop,step:dt=>{rwStep(dt);},sync:rwSyncMeshes,pause:f=>{RW.paused=!!f;},input:o=>Object.assign(RW.in,o),
  look:(yaw,pitch)=>{if(yaw!=null)RW.pl.headYaw=C.clamp(yaw,-RW.settings.lookYaw,RW.settings.lookYaw);if(pitch!=null)RW.pl.pitch=pitch;},face:rwFaceView,quarter:rwQuarterView,moveFace:rwFaceMove,moveQuarter:rwQuarterMove,turn:rwQuarterMove,recenter:rwSnapViewToBody,crouch:f=>{RW.pl.crouch=!!f;},door:rwToggleDoor,shoot:rwShoot,
  stats:rwStatsSummary,reset:rwResetStats,set:(o)=>{Object.assign(RW.settings,o);},pos:()=>{const p=rwPlayerPos(),m=rwPlayerMoveYaw(),f=rwPlayerLookYaw();return {x:+p.x.toFixed(2),y:+p.y.toFixed(2),story:p.story,floorZ:+p.floorZ.toFixed(2),edge:RW.pl.edge.id,s:+RW.pl.s.toFixed(2),off:+RW.pl.off.toFixed(2),aboard:!!p.aboard,vehicleId:p.vehicleId||null,local:p.local||null,body:Math.round(m),head:Math.round(RW.pl.headYaw),moveFacing:Math.round(m),moveCardinal:rwCardinalName(m),lookFacing:Math.round(f),lookCardinal:rwCardinalName(f),facing:Math.round(f),cardinal:rwCardinalName(f),junction:p.aboard?null:RW.pl.junctionLatch||null,junctionNeedsRelease:p.aboard?false:!!RW.pl.junctionNeedsRelease,stop:RW.pl.stop};},
  npcs:()=>RW.npcs.map(n=>({id:n.id,state:n.state,x:+n.x.toFixed(1),y:+n.y.toFixed(1),view:n.view,theta:Math.round(n.theta),resid:Math.round(n.resid),head:Math.round(n.head),onScreen:n.onScreen,node:n.node?.id||null})),
  cars:()=>RW.cars.map(c=>({...(RW.vehicleWorld?{vehicleId:c.vehicleId,classId:c.classId,worldState:c.worldState,traffic:c.traffic,signal:c.signal}:{}),id:c.id,label:c.label||c.id,lane:c.lane?.id||null,state:c.state,s:+(c.s||0).toFixed(2),x:+c.x.toFixed(2),y:+c.y.toFixed(2),speed:+c.speed.toFixed(2),cruiseSpeed:Number.isFinite(c.cruiseSpeed)?+c.cruiseSpeed.toFixed(2):null,driver:c.driver?.name||null,aiState:c.aiState||null,responseTo:c.responseTo||null,braking:!!c.braking,emergency:!!c.emergency,onScreen:!!c.onScreen,pendingObservations:c.observations?.length||0,contactCount:c.contactCount||0})),
  vehicleEvents:()=>RW.vehicleWorld?RW.vehicleWorld.events().slice(-80):RW.vehicleEvents.map(e=>({...e})),vehicleSummary:()=>rwVehicleSummary(),
  /* 0.16 Vehicle World hooks (null when the scene uses the older runtime) */
  vehicleWorld:()=>RW.vehicleWorld?RW.vehicleWorld.snapshot():null,vehicleRun:()=>RW.vehicleWorld?RW.vehicleWorld.exportRun():null,
  vehicleCommand:cmd=>RW.vehicleWorld?RW.vehicleWorld.command(cmd):{ok:false,reason:'not_world_runtime'},vehicleQuery:(name,...a)=>RW.vehicleWorld?RW.vehicleWorld.query(name,...a):null,
  signalHeads:()=>RW.vwHeads?RW.vwHeads.list.map(x=>({id:x.hd.id,signalId:x.hd.signalId,groupId:x.hd.groupId,lamp:x.state||null,visible:x.g.visible!==false})):[]};
