/* Action Physical Proof v0.1: opt-in adapter for the existing ROOM host.
 * Shared physical state -> existing Three / Canvas presentation. No Encounter integration is claimed.
 * All actor commands go to RCActorPhysical; legacy combat and pedestrian locomotion are bypassed only here.
 */
const AP={on:false,core:null,spec:null,preset:'practice',debug:false,paused:false,inspection:false,inspectPose:'stand',inspectFacing:180,frames:new Map(),group:null,meshes:new Map(),hud:null,lastPitch:null,keys:{},milestones:new Set(),eventCursor:0,cpu:null,started:0,noticeUntil:0,left:null,dragLook:null,pointerReady:false,pointerUnavailable:false,captureOnly:false,expectedUnlock:false,handFrames:new Map(),lastHandPose:null};
function apPlayer(){return AP.core?.get(AP.core.W.controlId);}
function apWorldPos(){const a=apPlayer();return a?{x:a.x,y:a.y,story:a.story,floorZ:a.z}:null;}
function apCameraView(){if(!AP.inspection)return null;return {id:null,name:'Encounter preview',x:9,y:18.1,story:2,floorZ:0,facing:0,fov:78,eyeHeight:1.62,horizon:.42,width:1440,height:900,role:'inspection'};}
function apStart(net){if(!net.physicalProof)return false;AP.on=true;AP.spec=net.physicalProof;AP.debug=false;AP.frames.clear();document.body.classList.add('ap-playing');apEnsureHud();apReset('practice');return true;}
function apReset(preset=AP.preset){if(!AP.on)return;const s=AP.spec,pr=s.presets[preset]||s.presets.practice;AP.preset=preset;AP.inspection=preset==='inspection';AP.paused=AP.inspection;AP.keys={};RW.in={};RW.paused=false;AP.eventCursor=0;AP.milestones.clear();AP.lastPitch=null;AP.notice='';AP.noticeUntil=0;AP.left=null;AP.dragLook=null;AP.captureOnly=false;AP.pointerReady=document.pointerLockElement===canvas;AP.handFrames.clear();AP.pitchTextures?.clear();AP.pitchAppearance?.clear();
 rwWorldInit(RW.net,RW.net.vehicleLoop); // one fresh original Vehicle World; no legacy traffic instance for this car.
 const lookup=Object.fromEntries(RW.net.vertices.map(v=>[v.id,{...v,z:C.storyElevation(project,v.story||0)}]));
 let actors=s.actors.map((a,i)=>({...a,...pr.actors[i]}));
 if(AP.inspection){actors[0]={...actors[0],x:7.4,y:14.9,yaw:180,testMode:'idle'};actors[1]={...actors[1],x:8.5,y:14.9,yaw:180,testMode:'idle'};actors.push({...actors[1],id:'proof01__appearance_rifle',name:'Rifle appearance',x:9.6,appearance:'GNR',equipment:{weaponId:'rifle',rangedEnabled:false}});}
 AP.core=RCActorPhysical.create({...s,preset,actors,vehicleWorld:RW.vehicleWorld,geometry:RCActorPhysical.roomGeometry(project,C),routeEdges:RW.net.edges.map(e=>({...e,A:lookup[e.a],B:lookup[e.b],piece:e.physicalPiece})),onPieceChange:apPieceChanged});
 if(!AP.inspection)AP.core.spawnCar();AP.core.W.effects=true;RW.pl.bodyYaw=apPlayer().yaw;RW.pl.headYaw=0;RW.pl.pitch=0;RW.pl.eye=apPlayer().body.eye;RW.pl.bobZ=0;RW.settings.lookYaw=360;RW.settings.lookDown=89;RW.settings.lookUp=89;RW.settings.fov=78;RW.settings.debug=0;
 apDisposeGraphics();rwBuildSight();apPieceChanged();R.clear();GLE?.invalidate();RW.t=0;apMirror();apUpdateHud();drawSoon();}
function apStop(){if(!AP.on)return;for(const a of AP.core.W.actors)AP.core.detachOnLoss(a,'reset_or_leave');apClearInput();AP.on=false;apDisposeGraphics();AP.core=null;AP.keys={};AP.hud?.remove();AP.hud=null;document.body.classList.remove('ap-playing');}
function apPieceChanged(){if(!AP.on||!AP.core)return;for(const e of RW.graph?.edges||[]){if(!e.physicalPiece)continue;const p=AP.core.W.pieces.find(p=>p.id===e.physicalPiece);e.gate=!!p&&p.state===e.requiresState;}
 // Legacy sight consumers receive the same changed piece volumes. The proof's physical line query also includes slabs.
 if(RW.sight){RW.sight.boxes=RW.sight.boxes.filter(b=>!b.proofPiece);for(const b of AP.core.boxes(false).filter(b=>b.kind==='piece'))RW.sight.boxes.push({cx:(b.x0+b.x1)/2,cy:(b.y0+b.y1)/2,ux:1,uy:0,hu:(b.x1-b.x0)/2,hv:(b.y1-b.y0)/2,z0:b.z0,h:b.z1,name:b.id,proofPiece:true});}
}
function apFeedback(message,secs=1.8){AP.notice=message;AP.noticeUntil=(AP.core?.W.tick||0)+Math.round(secs/RCActorPhysical.H);}
// Short release = punch; sustained press = block. Input intent never decides contact.
function apClearInput(){AP.left=null;AP.dragLook=null;RW.drag=null;RW.in={};if(AP.core){const a=apPlayer();a.input={};AP.core.request(a.id,'block',{active:false});a.queuedLight=false;a.queuedGrab=null;}}
function apLook(dx,dy){if(AP.paused||AP.inspection)return;const sens=RW.settings.mouseSens||.14;RW.pl.bodyYaw=C.norm(RW.pl.bodyYaw+dx*sens);RW.pl.headYaw=0;RW.pl.pitch=C.clamp(RW.pl.pitch-dy*sens,-89,89);drawSoon();}
function apPointerDown(e){
 if(AP.inspection)return true;
 // A resume/capture click is never an attack. Lock can be reacquired after Escape.
 const wasPaused=AP.paused;if(wasPaused){apClearInput();AP.paused=false;}
 if(document.pointerLockElement!==canvas&&!AP.pointerUnavailable){
  AP.captureOnly=true;
  try{if(!canvas.requestPointerLock){AP.pointerUnavailable=true;apFeedback('Mouse capture unavailable — drag to look or use arrows',3);}else{const p=canvas.requestPointerLock();p?.catch?.(()=>{AP.pointerUnavailable=true;apFeedback('Mouse capture unavailable — drag to look or use arrows',3);});}}catch(_){AP.pointerUnavailable=true;}
  return true;
 }
 if(wasPaused){AP.captureOnly=true;return true;}
 if(e.button===2){apRequest(apPlayer().held?'throw':'grab');return true;}
 if(e.button!==0)return true;
 AP.left={tick:AP.core.W.tick,blocking:false,cancelled:false};
 if(document.pointerLockElement!==canvas){AP.dragLook={x:e.clientX,y:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId);}catch(_){}}
 return true;
}
function apPointerMove(e){if(!AP.dragLook)return true;const d=AP.dragLook,dx=e.clientX-d.x,dy=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;if(Math.abs(dx)+Math.abs(dy)>2)d.moved=true;if(d.moved){if(AP.left)AP.left.cancelled=true;apLook(dx,dy);}return true;}
function apPointerUp(e){if(AP.captureOnly){AP.captureOnly=false;return true;}if(e?.button!==0&&e?.type!=='pointercancel')return true;const click=AP.left;AP.left=null;AP.dragLook=null;if(!click)return true;const a=apPlayer();if(e?.type==='pointercancel'||click.blocking||click.cancelled||AP.paused){AP.core.request(a.id,'block',{active:false});return true;}if((AP.core.W.tick-click.tick)*RCActorPhysical.H<.18)apRequest('punch');return true;}
function apPollBlock(){const l=AP.left;if(!l||l.cancelled)return;const a=apPlayer();if((AP.core.W.tick-l.tick)*RCActorPhysical.H>=.18){l.blocking=true;if(!a.blockWanted&&!a.down&&!a.holder&&a.stagger<=0&&a.wiltT<=0)AP.core.request(a.id,'block',{active:true});}}
canvas.addEventListener('contextmenu',e=>{if(AP.on)e.preventDefault();});
window.addEventListener('blur',()=>{if(AP.on){apClearInput();AP.paused=true;}});
document.addEventListener('visibilitychange',()=>{if(AP.on&&document.hidden){apClearInput();AP.paused=true;}});
document.addEventListener('pointerlockchange',()=>{if(!AP.on)return;const expected=AP.expectedUnlock;AP.expectedUnlock=false;AP.pointerReady=document.pointerLockElement===canvas;if(AP.pointerReady){AP.pointerUnavailable=false;}else if(!expected){apClearInput();AP.paused=true;apFeedback('Paused · click to resume and capture mouse, or P',3);}}); // Escape already paused synchronously; a late acknowledgement must not re-pause a reset/resume.
function apSyncMovementIntent(){const a=apPlayer();if(!a)return;const input=RW.in,yaw=C.norm(RW.pl.bodyYaw+RW.pl.headYaw),f=RCActorPhysical.direction(yaw),r={x:-f.y,y:f.x},along=(input.fwd?1:0)-(input.back?1:0),side=(input.right?1:0)-(input.left?1:0);
 if(!a.down&&!a.holder&&a.stagger<=0&&a.wiltT<=0){AP.core.request(a.id,'face',{yaw});AP.core.request(a.id,'move',{x:f.x*along+r.x*side,y:f.y*along+r.y*side,sprint:!!input.sprint});}else a.input={};}
function apRequest(verb){if(!AP.on||AP.paused)return;apSyncMovementIntent();const r=AP.core.request(AP.core.W.controlId,verb);if(!r.ok)apFeedback(({break_guard_first:'GUARD UP — pressure with light punches or use F / E',actor_not_ready:'Recovering — defend and wait for your opening',recovering:'Attack recovering',no_reachable_target:'No target in reach',one_flying_kick_per_jump:'Land before another flying kick'})[r.reason]||r.reason.replaceAll('_',' '),1.7);else{AP.notice='';AP.noticeUntil=0;AP.core.W.lastRejection='';}return r;}
function apAdvance(dt){if(!AP.on)return;const a=apPlayer(),input=RW.in;if(!a)return;
 if(!AP.paused){if(input.lookL)RW.pl.bodyYaw=C.norm(RW.pl.bodyYaw-115*dt);if(input.lookR)RW.pl.bodyYaw=C.norm(RW.pl.bodyYaw+115*dt);if(input.lookU)RW.pl.pitch=Math.min(89,RW.pl.pitch+75*dt);if(input.lookD)RW.pl.pitch=Math.max(-89,RW.pl.pitch-75*dt);
  apPollBlock();
  apSyncMovementIntent(); // Sample current input before physical execution; action keys also sample immediately.
  AP.core.advance(dt);
 }
 RW.t=AP.core.W.tick*RCActorPhysical.H;RW.pl.eye=a.body.eye;RW.pl.bobZ=0;RW.pl.vAlong=Math.hypot(a.vx,a.vy);
 if(AP.lastPitch!==RW.pl.pitch){R.archCache.clear();R.fullCache.clear();AP.lastPitch=RW.pl.pitch;}
 for(const e of AP.core.W.events){if(e.id<=String(AP.eventCursor||''))continue;AP.eventCursor=e.id;
  if(e.type==='jump')AP.milestones.add('Jump');if(e.type==='landed'&&e.support?.startsWith('veh_')){AP.milestones.add('Ride');if(e.actor===a.id)apFeedback('Roof landing secured — ride or jump off',2.0);}
  if(e.type==='strike'){AP.milestones.add('Strike');if(e.actor===a.id)apFeedback(e.guardBreak?'GUARD BROKEN — right-click to grab':e.blocked?'Guard pressured — keep the chain going':e.verb==='punch'?'LIGHT '+(e.combo||'')+' — stunned':e.verb==='strong'?'HEAVY — forceful contact':e.verb==='flyingkick'?'FLYING KICK — contact':'KICK — displaced',1.2);}
  if(e.type==='grabbed'){AP.milestones.add('Hold');if(e.actor===a.id)apFeedback('HELD — right-click throws · G safely releases',2.5);}
  if(e.type==='thrown'){AP.milestones.add('Throw');if(e.actor===a.id)apFeedback('Target released into physical trajectory',1.5);}
  if(e.type==='piece_changed'){AP.milestones.add('Breach');apFeedback('BARRICADE BREACHED — new passage open',2.5);}
  if(e.type==='support_obstructed'&&e.actor===a.id)apFeedback('Cannot follow support — physical obstruction',1.5);
  if(e.type==='guard_broken'&&e.target===a.id)apFeedback('YOUR GUARD BROKE — vulnerable briefly',1.7);
  if(e.type==='down'&&e.target===a.id)apFeedback('Down — Enter to restart',3);
 }
 if(AP.notice&&AP.core.W.tick>AP.noticeUntil)AP.notice='';
 apMirror();}
function apMirror(){if(!AP.core)return;RW.npcs=AP.core.W.actors.map(a=>({id:a.id,name:a.name,appearance:a.appearance,charId:a.appearance,x:a.x,y:a.y,story:a.story,facing:a.yaw,state:a.outOfTile?'hidden':'physical',view:'front',vsign:1,planeYaw:a.yaw,onScreen:true,moving:Math.hypot(a.vx,a.vy)>.1,speed:Math.hypot(a.vx,a.vy),cycle:a.cycle,h:{view:null},actor:{},physical:a}));RW.cars=AP.core.W.carShapes.map(c=>({id:c.id,vehicleId:c.id,x:c.x,y:c.y,facing:c.yaw,planeYaw:c.yaw,speed:c.speed,state:'drive',classId:'sedan',lane:{story:2},length:c.length,width:c.width,view:'side',vsign:1,onScreen:true}));}
function apSwap(){if(!AP.core)return;const A=AP.core.W.actors,i=A.findIndex(a=>a.id===AP.core.W.controlId),a=A[(i+1)%A.length];apClearInput();AP.core.switchControl(a.id);RW.in={};RW.pl.bodyYaw=a.yaw;RW.pl.headYaw=0;RW.pl.pitch=0;AP.notice='Controller changed; identity, health, velocity and body retained.';}
function apOther(){return AP.core.W.actors.find(a=>a.id!==AP.core.W.controlId);}
function apChangeSkin(){const a=apOther();if(!a)return;AP.core.setAppearance(a.id,a.appearance==='GNC'?'GNR':a.appearance==='GNR'?'PLB':'GNC');AP.notice='Appearance changed; physical profile unchanged.';}
function apKey(e){if(!AP.on)return false;const k=RW_KEYS[e.code];if(k){RW.in[k]=true;return true;}if(e.key==='Shift'){RW.in.sprint=true;return true;}if(e.repeat)return true;
 const verbs={Space:'jump',KeyJ:'punch',KeyF:'strong',KeyE:'kick',KeyK:'kick',KeyT:'throw'};if(verbs[e.code])apRequest(verbs[e.code]);
 else if(e.code==='KeyG')apRequest('release');else if(e.code==='Enter')apReset();else if(e.code==='Tab')AP.debug=!AP.debug;else if(e.code==='KeyQ')apSwap();else if(e.code==='KeyV')apChangeSkin();else if(e.code==='KeyB'){const a=apPlayer();AP.core.setProfile(a.id,a.bodyProfile==='standard'?'broad':'standard');}
 else if(e.code==='KeyP'){apClearInput();AP.paused=!AP.paused;if(!AP.paused)AP.pointerUnavailable=false;}else if(e.code==='KeyO'&&AP.paused){AP.core.step();apMirror();}
 else if(e.code==='KeyI'){const poses=['stand','block','wilt','run','aim','flinch','airborne','held','thrown','land','down','punch','strong','kick','flyingkick','grab'];AP.inspectPose=poses[(poses.indexOf(AP.inspectPose)+1)%poses.length];}
 else if(e.code==='KeyU')AP.inspectFacing=(AP.inspectFacing+45)%360;
 else if(e.code==='KeyH')AP.hud.classList.toggle('ap-compact');else if(/^Digit[1-5]$/.test(e.code))apReset(['practice','car','barrier','drop','inspection'][+e.code.slice(-1)-1]);
 apUpdateHud();drawSoon();return true;}
function apFrame(a){const rec=RW.chars?.get(a.appearance);if(!rec?.ready)return null;const pack=rec.pack,cam=AP.inspection?{x:9,y:18.1}:rwCam();let pose='stand';
 if(AP.inspection)pose=AP.inspectPose;else if(a.down)pose='down';else if(a.motion==='held')pose='held';else if(a.wiltT>0)pose='wilt';else if(a.blocking)pose='block';else if(a.motion==='airborne')pose=a.thrownBy?'thrown':'airborne';else if(a.stagger>0)pose='flinch';else if(a.recovery>0)pose='land';else if(a.action&&pack.states[a.action.verb])pose=a.action.verb;else if(Math.hypot(a.vx,a.vy)>.15)pose=Math.hypot(a.vx,a.vy)>3?'run':'walk';
 const yaw=AP.inspection?AP.inspectFacing:a.yaw,rel=rwWrap(C.heading(a,cam)-yaw),av=Math.abs(rel),view=av<22.5?'front':av<67.5?'q':av<112.5?'side':av<157.5?'bq':'back',set=pack.states[pose]||pack.states.stand,list=set[view]||set.front;
 let i=0;if(list.length>1){if(pose==='down')i=Math.min(list.length-1,Math.floor((AP.core.W.tick-a.downTick)*RCActorPhysical.H*9));else i=Math.floor((AP.inspection?AP.core.W.tick*.04:a.cycle/.7))%list.length;}
 const [name,flag]=String(list[i]).split('|'),fr=pack.frames[name];if(!fr)return null;const mirrored=(rel<0)!==(flag==='m');a.visualFrame=name;a.visualPose=pose;
 return {actor:a,view,rec,pack,pose,name,fr,mirrored,ppm:(fr.ppm||pack.pxPerMetre)/(a.body.height/(pack.height||1.8)),yaw:C.heading(a,cam)};}
function apFrameImage(k){const key=k.pack.id+'|'+k.name+'|'+k.fr.x+','+k.fr.y+'|'+k.pose+'|'+k.view;let im=AP.frames.get(key);if(!im){im=document.createElement('canvas');im.width=k.fr.w;im.height=k.fr.h;const g=im.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(k.rec.canvas,k.fr.x,k.fr.y,k.fr.w,k.fr.h,0,0,k.fr.w,k.fr.h);
 // Deliberately simple identity-preserving guard fallback: own ready body and raised tan forearms.
 if(k.pose==='block'&&!['back','bq'].includes(k.view)){
  const p=AP.spec.firstperson.TH1,f=p.frames['TH1.f14'],img=R.images.get(p.atlas),ppm=k.fr.ppm||k.pack.pxPerMetre;
  if(f&&img){for(const side of[-1,1]){const h=ppm*.44,w=h*f.w/f.h;g.save();g.translate(k.fr.ax+side*ppm*.11,(k.fr.ay||k.fr.h)-ppm*1.22);g.rotate(side*.25);g.scale(side,1);g.drawImage(img,f.x,f.y,f.w,f.h,-w/2,-h,w,h);g.restore();}}
 }
 AP.frames.set(key,im);}return im;}
function apVisibleActors(){return AP.core.W.actors.filter(a=>!a.outOfTile&&(AP.inspection||a.id!==AP.core.W.controlId));}
function apDrawBoxes(){const out=[];for(const c of AP.core.W.carShapes){out.push({...AP.core.carBox(c),color:'#367579',role:'carbody'});out.push({...AP.core.carBox(c,true),z0:c.z+c.roof.bodyHeight,color:'#506774',role:'cabin'});
  // Native geometric wheels, not independently simulated rigid bodies.
  for(const side of[-1,1])for(const along of[-1,1]){const q=AP.core.carWorld(c,{x:side*(c.halfWidth-.02),y:along*c.halfLength*.63});out.push({id:c.id+':wheel',x0:q.x-.34,x1:q.x+.34,y0:q.y-.13,y1:q.y+.13,z0:.02,z1:.52,color:'#182329',role:'wheel'});}}
 for(const b of AP.core.boxes(false)){if(b.kind==='piece')out.push({...b,color:AP.spec.definitions[b.piece.definition].states[b.piece.state].color,role:'barrier'});else if(b.id==='proof01__launch')out.push({...b,color:'#347e83',role:'launch'});}return out;}
function apDisposeGraphics(){if(AP.blockMaterials){for(const m of AP.blockMaterials.values()){m.map?.dispose();m.dispose();}AP.blockMaterials.clear();}if(AP.group){AP.group.parent?.remove(AP.group);AP.group.traverse(o=>{o.geometry?.dispose();if(o.material&&!o.userData.sharedMaterial){o.material.map?.dispose();o.material.dispose();}});}AP.group=null;AP.meshes.clear();}
function apSyncMeshes(){if(!AP.on||!GLE||!window.THREE)return;const T=window.THREE;if(!AP.group){AP.group=new T.Group();GLE.dynamic.add(AP.group);}for(const m of AP.meshes.values())m.visible=false;
 const mesh=(id,geo,mat)=>{let m=AP.meshes.get(id);if(!m){m=new T.Mesh(geo(),mat());m.frustumCulled=false;AP.group.add(m);AP.meshes.set(id,m);}m.visible=true;return m;};
 apDrawBoxes().forEach((b,i)=>{const m=mesh('box:'+i,()=>new T.BoxGeometry(1,1,1),()=>new T.MeshBasicMaterial({color:b.color}));m.material.color.set(b.color);m.position.set((b.x0+b.x1)/2,(b.z0+b.z1)/2,(b.y0+b.y1)/2);m.scale.set(b.x1-b.x0,b.z1-b.z0,b.y1-b.y0);});
 for(const a of apVisibleActors()){const k=apFrame(a);if(!k)continue;const m=mesh(a.id,()=>new T.PlaneGeometry(1,1).translate(0,.5,0),()=>new T.MeshBasicMaterial({transparent:true}));m.userData.sharedMaterial=true;if(k.pose==='block'){if(!AP.blockMaterials)AP.blockMaterials=new Map();const key=k.pack.id+'|'+k.name+'|'+k.view;let mat=AP.blockMaterials.get(key);if(!mat){const tex=new T.CanvasTexture(apFrameImage(k));tex.magFilter=tex.minFilter=T.NearestFilter;mat=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:T.DoubleSide});AP.blockMaterials.set(key,mat);}m.material=mat;}else m.material=rwCharMaterial(k.rec,k.name);const w=k.fr.w/k.ppm,h=k.fr.h/k.ppm,b=C.basis(k.yaw),s=k.mirrored?-1:1,off=s*w*(.5-k.fr.ax/k.fr.w);rwPlace(m,a.x-b.rx*off,a.y-b.ry*off,k.yaw,w,h,a.z+((k.fr.ay??k.fr.h)-k.fr.h)/k.ppm,k.mirrored);}
}
/* Extend the existing Canvas fallback with depth-tested dynamic boxes and atlas sprites.
 * The existing ROOM renderer still draws the room; these projections read the same physical bounds as Three.
 */
function apComposite2D(base,v){if(!AP.on)return base.canvas;const W=base.W,H=base.H,sv={...v,width:W,height:H},lens=C.lens(sv),b=C.basis(v.facing),eye=(v.floorZ||0)+v.eyeHeight,pixels=new Uint32Array(base.pixels),depth=new Float32Array(base.depth);
 const rgba=(r,g,bl)=>((255<<24)|((Math.min(255,bl)|0)<<16)|((Math.min(255,g)|0)<<8)|(Math.min(255,r)|0))>>>0;
 for(const q of apDrawBoxes()){const cs=[parseInt(q.color.slice(1,3),16),parseInt(q.color.slice(3,5),16),parseInt(q.color.slice(5,7),16)];let projected=[];for(const x of[q.x0,q.x1])for(const y of[q.y0,q.y1])for(const z of[q.z0,q.z1]){const pt=C.fpPoint(sv,{x,y,floorZ:z},0);if(pt)projected.push(pt);}if(!projected.length)continue;
  const allFront=projected.length===8,x0=allFront?Math.max(0,Math.floor(Math.min(...projected.map(p=>p.x)))):0,x1=allFront?Math.min(W,Math.ceil(Math.max(...projected.map(p=>p.x)))):W,y0=allFront?Math.max(0,Math.floor(Math.min(...projected.map(p=>p.y)))):0,y1=allFront?Math.min(H,Math.ceil(Math.max(...projected.map(p=>p.y)))):H;
  for(let x=x0;x<x1;x++){const side=(x+.5-W/2)/lens.f,dx=b.fx+b.rx*side,dy=b.fy+b.ry*side;for(let y=y0;y<y1;y++){const dz=-(y+.5-lens.horizon)/lens.f,origin=[v.x,v.y,eye],dir=[dx,dy,dz],mn=[q.x0,q.y0,q.z0],mx=[q.x1,q.y1,q.z1];let lo=.075,hi=200,axis=2;
   for(let n=0;n<3;n++){if(Math.abs(dir[n])<1e-10){if(origin[n]<mn[n]||origin[n]>mx[n]){hi=-1;break;}}else{let t=(mn[n]-origin[n])/dir[n],u=(mx[n]-origin[n])/dir[n];if(t>u)[t,u]=[u,t];if(t>lo){lo=t;axis=n;}hi=Math.min(hi,u);if(lo>hi)break;}}
   const i=y*W+x;if(lo>hi||lo>depth[i]+.013)continue;let shade=axis===2?1.18:axis===0?.78:.95;if(q.role==='barrier'&&axis!==2&&q.z1>1&&((Math.floor((v.x+dx*lo)*5)+Math.floor((eye+dz*lo)*5))%8<2))shade*=.52;
   pixels[i]=rgba(cs[0]*shade,cs[1]*shade,cs[2]*shade);depth[i]=lo;}}
 }
 if(!AP.spriteCanvas){AP.spriteCanvas=document.createElement('canvas');}const lc=AP.spriteCanvas;lc.width=W;lc.height=H;const g=lc.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;
 for(const a of apVisibleActors()){const k=apFrame(a),pt=C.fpPoint(sv,{x:a.x,y:a.y,floorZ:a.z},0);if(!k||!pt||pt.depth<.08)continue;
  const sc=pt.scale/k.ppm,ax=k.fr.ax*sc,ay=(k.fr.ay??k.fr.h)*sc,ww=k.fr.w*sc,hh=k.fr.h*sc;
  const lx=k.mirrored?pt.x-(ww-ax):pt.x-ax,ty=pt.y-ay;
  const x0=Math.max(0,Math.floor(lx)-1),y0=Math.max(0,Math.floor(ty)-1),x1=Math.min(W,Math.ceil(lx+ww)+1),y1=Math.min(H,Math.ceil(ty+hh)+1);
  if(x1<=x0||y1<=y0)continue;
  // Only clear, read and blend the actual sprite rectangle, not every pixel in the scene.
  g.clearRect(x0,y0,x1-x0,y1-y0);g.save();g.translate(pt.x,pt.y);g.scale(k.mirrored?-1:1,1);g.drawImage(apFrameImage(k),-ax,-ay,ww,hh);g.restore();
  const img=g.getImageData(x0,y0,x1-x0,y1-y0).data,w=x1-x0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*W+x,j=((y-y0)*w+x-x0)*4,alpha=img[j+3]/255;if(alpha<.05||pt.depth>depth[i]+.02)continue;const old=pixels[i];pixels[i]=rgba(img[j]*alpha+(old&255)*(1-alpha),img[j+1]*alpha+((old>>>8)&255)*(1-alpha),img[j+2]*alpha+((old>>>16)&255)*(1-alpha));if(alpha>.5)depth[i]=pt.depth;}}

 if(!AP.cpu)AP.cpu=document.createElement('canvas');AP.cpu.width=W;AP.cpu.height=H;AP.cpu.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer),W,H),0,0);return AP.cpu;}
function apLine(g,v,pts,col,width=2){g.save();g.strokeStyle=col;g.lineWidth=width;g.beginPath();let started=false;for(const p of pts){const q=C.fpPoint(v,{x:p.x,y:p.y,floorZ:p.z},0);if(!q){started=false;continue;}if(started)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y);started=true;}g.stroke();g.restore();}
// Source sprites only; mirrored/tinted views are presentation, never extra contacts.
function apDrawHands(g,v){const a=apPlayer(),W=v.width,H=v.height,ac=a.action,t=ac?.t||0,phase=ac?Math.min(1,t/ac.duration):0;AP.lastHandPose=[];
 const hand=(id,x,y,width,mirror=false,angle=0)=>{const code=id.split('.')[0],p=AP.spec.firstperson[code],f=p?.frames[id],img=p&&R.images.get(p.atlas);if(!f||!img)return;const w=W*width,h=w*f.h/f.w;g.save();g.imageSmoothingEnabled=false;g.translate(W*x,H*y);g.rotate(angle);g.scale(mirror?-1:1,1);g.drawImage(img,f.x,f.y,f.w,f.h,-w/2,-h,w,h);g.restore();AP.lastHandPose.push(id+(mirror?'|m':''));};
 const breathe=Math.sin(AP.core.W.tick*RCActorPhysical.H*3)*.003;
 const idle=(side)=>hand(side<0?'TH1.f19':'TH1.f20',side<0?.29:.71,1.10+breathe,.12,side<0,side<0?-.18:.18);
 if(a.down)return;
 if(a.blocking||AP.left?.blocking&&!a.action){const recoil=Math.max(0,a.blockHitT)/.17;hand('TH1.f14',.42-recoil*.015,.93+recoil*.02,.19,true,.32);hand('TH1.f14',.58+recoil*.015,.93+recoil*.02,.19,false,-.32);return;}
 if(a.wiltT>0){hand('TH1.f11',.25,1.08,.16,true,-.4);hand('TH1.f12',.76,1.08,.16,false,.4);return;}
 if(a.held){hand('TH1.f21',.27,.99,.115,true,-.17);hand('TH1.f22',.73,.99,.13,false,.17);return;}
 if(ac?.verb==='grab'){const id=phase<.35?'TH1.f08':phase<.66?'TH1.f09':'TH1.f10';hand(id,.26,.97,.23,true,-.16);hand(id,.74,.97,.23,false,.16);return;}
 if(ac?.verb==='throw'||ac?.verb==='release'){const idx=phase<.30?0:phase<.65?1:2,id=['TH1.f13','TH1.f11','TH1.f12'][idx];hand(id,.33-phase*.1,.99-phase*.15,.23,true,-.2);hand(id,.67+phase*.1,.99-phase*.15,.23,false,.2);return;}
 if(ac?.verb==='kick'){const ext=t<ac.windup?t/ac.windup:Math.max(0,1-(t-ac.windup)/(ac.duration-ac.windup));const id=ext<.35?'FPW.kick.1':ext<.66?'FPW.kick.2':'FPW.kick.3';hand(id,.59,1.10,.19+ext*.045,false,-.11);hand('TH1.f06',.16,1.04,.14,true,-.35);hand('TH1.f07',.88,1.04,.14,false,.35);return;}
 if(ac?.verb==='flyingkick'){const f=Math.sin(Math.min(1,phase)*Math.PI);hand('FPW.kick.3',.46,.83+phase*.20,.29,false,1.38);hand('TH1.f09',.16,1.02,.15,true,-.4);hand('TH1.f08',.88,1.02,.14,false,.4);return;}
 if(ac?.verb==='strong'){const ext=t<ac.windup?0:Math.max(0,1-(t-ac.windup)/(.40));idle(-1);if(t<ac.windup)hand('TH1.f14',.81,1.10+Math.sin(t/ac.windup*Math.PI)*.05,.22,false,-.12);else{const id=ext>.66?'FPW.fist_side.3':ext>.3?'FPW.fist_side.2':'FPW.fist_side.1';hand(id,.67-ext*.20,.99-ext*.15,.42,false,-.32);}return;}
 if(ac?.verb==='punch'){
  const n=(ac.combo||1)-1,side=n%2===0?-1:1;idle(-side);
  const ext=t<ac.windup?t/ac.windup:Math.max(0,1-(t-ac.windup)/(ac.duration-ac.windup));
  const cx=(side<0?.29:.71)-side*ext*.19,cy=1.10-ext*.27;
  if(n===0){hand(ext<.35?'TH1.f14':ext<.68?'TH1.f23':'TH1.f22',cx,cy,ext<.35?.15:.145,true,-.10);}
  else if(n===1){hand('FPW.fist_front.'+(ext<.3?1:ext<.64?2:3),cx,cy,.22-ext*.04,false,.1);}
  else if(n===2){hand('FPW.fist_side.'+(ext<.3?1:ext<.65?2:3),.19+ext*.18,1.00-ext*.18,.36,true,.24);}
  else{hand(ext<.25?'TH1.f14':ext<.7?'TH1.f22':'TH1.f26',cx,cy,ext>.7?.21:.16,false,-.3);}
  return;
 }
 idle(-1);idle(1);
}

function apOverlay(g,v,k){if(!AP.on)return;g.save();const a=apPlayer(),W=v.width,H=v.height;
 // Cosmetic-only, analytic fragments: sample committed facts, never create contacts or route changes.
 if(AP.core.W.effects){for(const e of AP.core.W.events.slice(-30)){const age=(AP.core.W.tick-e.tick)*RCActorPhysical.H;if(age<0||age>.52||!['piece_changed','strike'].includes(e.type))continue;const p=e.type==='piece_changed'?AP.core.W.pieces.find(p=>p.id===e.piece):AP.core.get(e.target);if(!p)continue;for(let j=0;j<8;j++){const phase=(j*2.3999632297),at={x:p.x+Math.cos(phase)*age*1.8,y:p.y+Math.sin(phase)*age*1.2,floorZ:p.z+.8+age*(1.5+j*.1)-age*age*4},q=C.fpPoint(v,at,0);if(!q)continue;g.globalAlpha=(1-age/.52)*.65;g.fillStyle=e.type==='piece_changed'?'#e3c28a':'#d3e5df';const size=Math.max(2,q.scale*.035);g.fillRect(q.x-size/2,q.y-size/2,size,size);}g.globalAlpha=1;}}

 if(AP.debug||AP.inspection){for(const e of AP.inspection?[]:AP.core.W.routeEdges){const piece=e.piece&&AP.core.W.pieces.find(p=>p.id===e.piece),closed=piece&&piece.state!==e.requiresState;apLine(g,v,[{...e.A,z:e.A.z+.025},{...e.B,z:e.B.z+.025}],closed?'#ed7b65':'#59e0ca',2);}
  for(const actor of AP.core.W.actors){if(actor.id===a.id&&!AP.inspection||actor.outOfTile)continue;const r=actor.body.radius,z=actor.z,h=actor.body.height,points=[{x:actor.x-r,y:actor.y,z},{x:actor.x+r,y:actor.y,z},{x:actor.x+r,y:actor.y,z:z+h},{x:actor.x-r,y:actor.y,z:z+h},{x:actor.x-r,y:actor.y,z}];apLine(g,v,points,'#e2cc73',2);const q=C.fpPoint(v,{x:actor.x,y:actor.y,floorZ:z+h+.16});if(q){g.font='15px monospace';g.textAlign='center';g.fillStyle='#fff2bb';g.fillText(actor.appearance+' · '+actor.bodyProfile,q.x,q.y);g.font='11px monospace';g.fillText(actor.visualFrame||'',q.x,q.y+18);}}}
 if(!AP.inspection){apDrawHands(g,v);
  const x=W/2,y=H/2,t=AP.core.targetFor(a,2.3),wilt=t&&AP.core.isWilting(t),col=a.wiltT>0?'#ff866f':wilt?'#dcff91':a.blocking?'#74dbfa':'#edf7f2';
  g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(x-10,y);g.lineTo(x-4,y);g.moveTo(x+4,y);g.lineTo(x+10,y);g.moveTo(x,y-10);g.lineTo(x,y-4);g.moveTo(x,y+4);g.lineTo(x,y+10);g.stroke();
  // Attack-confirmation marks are presentation of committed strikes only.
  const hit=AP.core.W.events.slice(-10).reverse().find(e=>e.type==='strike'&&e.actor===a.id&&(AP.core.W.tick-e.tick)*RCActorPhysical.H<.13);
  if(hit){g.strokeStyle=hit.guardBreak?'#eaff92':hit.blocked?'#74dbfa':'#fff2c8';g.beginPath();for(const d of[-1,1]){g.moveTo(x+d*14,y+d*14);g.lineTo(x+d*21,y+d*21);g.moveTo(x+d*14,y-d*14);g.lineTo(x+d*21,y-d*21);}g.stroke();}
  if(a.stagger>0||a.wiltT>0){g.strokeStyle='#d77b5e';g.lineWidth=6;g.strokeRect(5,5,W-10,H-10);}
  if(a.down){g.fillStyle='#10161de0';g.fillRect(W*.25,H*.36,W*.5,H*.2);g.fillStyle='#f0ad80';g.textAlign='center';g.font='bold 34px monospace';g.fillText('DOWN',W/2,H*.44);g.font='18px monospace';g.fillStyle='#f0f0e5';g.fillText('Enter restarts this drill',W/2,H*.50);}}
 // World-space target condition. Looking at somebody does not make them eligible.
 if(!AP.inspection){const t=AP.core.targetFor(a,5);if(t){const q=C.fpPoint(v,{x:t.x,y:t.y,floorZ:t.z},t.body.height+.22);if(q){const wid=116,ratio=t.wiltT>0?t.wiltT/AP.core.combat.wiltSeconds:t.guard/t.guardMax;g.fillStyle='#08171de8';g.fillRect(q.x-wid/2,q.y-8,wid,8);g.fillStyle=t.wiltT>0?'#dfff8a':t.blocking?'#72d7ee':'#d2aa72';g.fillRect(q.x-wid/2,q.y-8,wid*Math.max(0,Math.min(1,ratio)),8);g.font='bold 13px monospace';g.textAlign='center';g.fillText(t.wiltT>0?'WILTING · GRAB '+t.wiltT.toFixed(1)+'s':t.action?.verb==='strong'?'COUNTER WINDUP':t.blocking?'GUARD':'RECOVERING',q.x,q.y-15);}}}

 g.restore();}
function apEnsureHud(){if(AP.hud)return;const el=document.createElement('div');el.id='apHud';el.innerHTML=`<div class="ap-top"><div><small>ROOM CREATOR / SHARED ACTOR LAB</small><h1>ACTION <span>PLAYGROUND</span></h1><div class="ap-sub">PHYSICAL INTEGRITY 0.3.1 <b id="apRenderer"></b></div></div><div class="ap-vitals"><span id="apHealth"></span><small id="apMotion"></small><span id="apGuard"></span><span id="apCombo"></span></div></div><div class="ap-drills"><button data-ap-preset="practice">1 · Melee</button><button data-ap-preset="car">2 · Car jump</button><button data-ap-preset="barrier">3 · Breach</button><button data-ap-preset="drop">4 · Drop</button><button data-ap-preset="inspection">5 · Inspect</button><button data-ap-command="reset">↺ Reset</button><button data-ap-command="debug">Diagnostics</button></div><div class="ap-guide"><b id="apTitle"></b><p id="apHint"></p><div id="apOpportunity" role="status" aria-live="off"></div><span id="apChecks"></span></div><div class="ap-footer"><div><kbd>W A S D</kbd> move on rails <kbd>Mouse / ← →</kbd> look <kbd>Space</kbd> jump <kbd>Shift</kbd> sprint<br><kbd>LMB</kbd> tap: light combo / hold: block <kbd>RMB</kbd> grab → throw<br><kbd>F</kbd> strong punch <kbd>E</kbd> kick / forward-jump flying kick <kbd>G</kbd> release <kbd>Enter</kbd> restart <kbd>Esc / P</kbd> pause</div><div class="ap-note">Click once to capture mouse · unrestricted look.<br>Short left click punches; hold 0.18s to block.<br><span id="apNotice">Pressure → guard break → wilt → grab → throw.</span></div></div><div class="ap-debug hidden"><div class="ap-debug-buttons"><button data-ap-command="swap">Q · Swap control</button><button data-ap-command="skin">V · Other skin</button><button data-ap-command="profile">B · Body profile</button><button data-ap-command="pause">P · Pause</button><button data-ap-command="step">O · Step</button><button data-ap-command="pose">I · Pose</button><button data-ap-command="facing">U · Facing</button><button data-ap-command="effects">Effects</button><button data-ap-command="export">Export log</button></div><pre id="apDebugText"></pre></div>`;document.body.appendChild(el);AP.hud=el;
 el.addEventListener('pointerdown',e=>e.stopPropagation());el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const pre=b.dataset.apPreset;if(pre)apReset(pre);else{switch(b.dataset.apCommand){case'reset':apReset();break;case'debug':AP.debug=!AP.debug;break;case'swap':apSwap();break;case'skin':apChangeSkin();break;case'profile':{const a=apPlayer();AP.core.setProfile(a.id,a.bodyProfile==='standard'?'broad':'standard');break;}case'pause':apClearInput();AP.paused=!AP.paused;break;case'step':if(AP.paused){AP.core.step();apMirror();}break;case'pose':apKey({code:'KeyI'});break;case'facing':apKey({code:'KeyU'});break;case'effects':AP.core.W.effects=!AP.core.W.effects;break;case'export':{const data={schema:'ROOM_LOCAL_PHYSICAL_PROOF_LOG@0.1',note:'Not Encounter persistence',snapshot:AP.core.snapshot(),events:AP.core.W.events,vehicleRun:AP.core.W.car.exportRun()},u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='action-physical-proof-run.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);break;}}}apUpdateHud();drawSoon();canvas.focus();});}
function apUpdateHud(){if(!AP.on||!AP.hud||!AP.core)return;RW.hud?.classList.add('hidden');const a=apPlayer(),pr=AP.spec.presets[AP.preset];$('apRenderer').textContent=GLE?'WEBGL':'CANVAS FALLBACK';$('apHealth').textContent='INTEGRITY '+a.health.toFixed(2)+' / '+a.body.maxHealth;$('apMotion').textContent=(AP.paused?'PAUSED · ':'')+a.motion.toUpperCase()+(a.held?' · CARRYING':'')+' · '+a.appearance;$('apTitle').textContent=pr.title;$('apHint').textContent=pr.hint;$('apChecks').textContent=['Jump','Ride','Strike','Hold','Throw','Breach'].map(x=>(AP.milestones.has(x)?'● ':'○ ')+x).join('   ');
 const opportunity=$('apOpportunity'),near=AP.core.targetFor(a,AP.core.cfg.grabReach),eligible=AP.core.grabEligibility(a);
 $('apGuard').textContent=(a.wiltT>0?'WILTING '+a.wiltT.toFixed(1)+'s':a.blocking?'BLOCKING':'GUARD')+' · '+Math.round(a.guard)+' / '+a.guardMax;
 $('apCombo').textContent=a.action?.verb==='punch'?'LIGHT CHAIN '+a.action.combo+' / 4':a.action?.verb==='strong'?'HEAVY PUNCH':a.action?.verb==='flyingkick'?'FLYING KICK':a.action?.verb==='kick'?'POWER KICK':'';
 opportunity.textContent=AP.inspection?'INSPECTION · I pose / U facing / O step':a.down?'DOWN · Enter to restart':a.held?'HELD · Right-click throws / G releases':eligible.ok?'WILTING · Right-click to grab NOW':a.blocking?'BLOCKING · release to attack':near?'GUARD UP · light chain / F heavy / E kick':a.motion==='airborne'?(a.jumpForward&&!a.flyKickUsed?'FORWARD JUMP · E flying kick':'AIRBORNE · choose a landing'):a.support?.startsWith('veh_')?'MOVING ROOF · Space to jump off':'CLOSE DISTANCE · pressure their guard';
 opportunity.classList.toggle('ready',eligible.ok||!!a.held);$('apNotice').textContent=AP.notice||'Five fast lights, two heavies, or one kick break a fresh guard.';
 for(const b of AP.hud.querySelectorAll('[data-ap-preset]'))b.classList.toggle('selected',b.dataset.apPreset===AP.preset);AP.hud.querySelector('.ap-debug').classList.toggle('hidden',!AP.debug&&!AP.inspection);
 if(AP.debug||AP.inspection)$('apDebugText').textContent='LOCAL ROOM TEST DRIVER — not Encounter history\nVehicle authority: original Vehicle World · fixed 1/240 s\nTick '+AP.core.W.tick+' | '+(AP.paused?'paused':'running')+' | obstacle '+AP.core.W.pieces[0].state+'\n'+AP.core.W.actors.map(x=>`${x.id} · ${x.controller} · ${x.appearance}\n  equipment ${x.equipment.weaponId||'none'} (ranged disabled)\n  ${x.bodyProfile} h=${x.body.height} r=${x.body.radius} mass=${x.body.mass}\n  pos ${x.x.toFixed(2)}, ${x.y.toFixed(2)}, ${x.z.toFixed(2)} | ${x.motion}\n  support ${x.support||'—'} | holder ${x.holder||'—'} | held ${x.held||'—'}\n  guard ${x.guard.toFixed(1)} · block ${x.blocking} · wilt ${x.wiltT.toFixed(2)}s\n  action ${x.action?.verb||'—'} | hp ${x.health.toFixed(2)} | frame ${x.visualFrame||'pending'}`).join('\n')+'\nRecent facts:\n'+AP.core.W.events.slice(-5).map(e=>e.tick+' '+e.type+' '+(e.target||e.actor||e.piece||'')).join('\n');}
EXT.physicalProof={get state(){return AP;},get core(){return AP.core;},reset:apReset,request:(verb)=>apRequest(verb),swap:apSwap,snapshot:()=>AP.core?.snapshot(),step:(n=1)=>{for(let i=0;i<n;i++)AP.core.step();apMirror();drawSoon();},pause:(v=true)=>{AP.paused=!!v;},setAppearance:(id,code)=>AP.core.setAppearance(id,code),setProfile:(id,name)=>AP.core.setProfile(id,name)};
