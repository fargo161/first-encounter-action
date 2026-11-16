/* ROOM physical proof @0.1 — opt-in shared bodies. x/y horizontal, z up; root at feet.
 * No renderer, pixel bounds, controller-specific physics, external engine, or Encounter history.
 * Vehicle World remains the only car pose writer. This module owns proof actor transforms.
 * Fixed 1/240 s, bounded swept/substepped contacts, data-driven environmental states.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RCActorPhysical=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const H=1/240,EPS=1e-5,clone=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const direction=yaw=>({x:Math.sin(yaw*Math.PI/180),y:-Math.cos(yaw*Math.PI/180)});
const heading=(a,b)=>(Math.atan2(b.x-a.x,-(b.y-a.y))*180/Math.PI+360)%360;
const wrap=x=>((x+540)%360)-180,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const DEFAULTS={fixedStep:H,gravity:18,jump:8.6,walk:3.8,sprint:5.6,carrySpeed:2.4,acceleration:20,airAcceleration:5,drag:11,holdDistance:1.05,holdLift:.45,throwSpeed:12,throwUp:6.4,grabReach:1.65,fallDamageSpeed:11.5,impactDamageSpeed:8,vehicleDamageSpeed:2.8,vehicleFatalSpeed:6,localLandingRadius:1.3,maxStepDistance:.055,maxFallZ:-12,carSpeed:4.5,carRespawnDelay:1.2};
// Opt-in pressure combat. Historical scenes retain the original physical-proof tuning.
const COMBAT={mode:'pressure_v03',guardMax:100,guardRegen:24,guardRegenDelay:1.1,guardRecovery:72,wiltSeconds:1.7,comboWindow:.72,comboBuffer:.16,blockArc:140,blockSpeed:1.8,counterPause:.46,counterInterval:1.30,flyKickSpeed:9.5,flyKickVerticalReach:2.35};
const PRESSURE_ACTIONS={
 punch:{reach:1.65,windup:.075,duration:.235,damage:.028,push:.32,lift:0,stagger:.16,guardDamage:23,blockStun:.045},
 strong:{reach:1.8,windup:.26,duration:.66,damage:.14,push:4.8,lift:.60,stagger:.48,guardDamage:66,blockStun:.11},
 kick:{reach:2.00,windup:.37,duration:.94,damage:.21,push:7.6,lift:1.10,stagger:.64,guardDamage:105,blockStun:.15},
 flyingkick:{reach:1.8,windup:.075,duration:.78,activeEnd:.53,damage:.24,push:10,lift:1.7,stagger:.72,guardDamage:120,blockStun:.18},
 grab:{reach:1.65,windup:.11,duration:.27},throw:{windup:0,duration:.40},release:{windup:0,duration:.17},jump:{windup:0,duration:0}
};
const ACTIONS={punch:{reach:1.65,windup:.12,duration:.5,damage:.10,push:2.8,lift:.25,stagger:.42},kick:{reach:1.95,windup:.20,duration:.78,damage:.17,push:6.3,lift:1.15,stagger:.68},grab:{reach:1.65,windup:.13,duration:.3},throw:{windup:0,duration:.42},release:{windup:0,duration:.2},jump:{windup:0,duration:0}};
const PROFILES={standard:{height:1.8,radius:.29,mass:75,eye:1.62,maxHealth:2},broad:{height:1.9,radius:.34,mass:88,eye:1.7,maxHealth:2}};
function inRect(x,y,r,pad=0){return x>=r.x0+pad-EPS&&x<=r.x1-pad+EPS&&y>=r.y0+pad-EPS&&y<=r.y1-pad+EPS;}
function boxOverlap(a,p,b){return p.x+a.body.radius>b.x0+EPS&&p.x-a.body.radius<b.x1-EPS&&p.y+a.body.radius>b.y0+EPS&&p.y-a.body.radius<b.y1-EPS&&p.z+a.body.height>b.z0+EPS&&p.z<b.z1-EPS;}
function rayBox(a,b,q,pad=0){let lo=0,hi=1;for(const k of ['x','y','z']){const d=b[k]-a[k],v=a[k],mn=q[k+'0']-pad,mx=q[k+'1']+pad;if(Math.abs(d)<1e-10){if(v<mn||v>mx)return null;}else{let u=(mn-v)/d,w=(mx-v)/d;if(u>w)[u,w]=[w,u];lo=Math.max(lo,u);hi=Math.min(hi,w);if(lo>hi)return null;}}return lo>=0&&lo<=1?lo:null;}
function subtractRect(r,holes){let arr=[r];for(const h of holes){let next=[];for(const q of arr){const x0=Math.max(q.x0,h.x0),x1=Math.min(q.x1,h.x1),y0=Math.max(q.y0,h.y0),y1=Math.min(q.y1,h.y1);if(x0>=x1||y0>=y1){next.push(q);continue;}if(q.y0<y0)next.push({...q,y1:y0});if(y1<q.y1)next.push({...q,y0:y1});if(q.x0<x0)next.push({...q,x1:x0,y0,y1});if(x1<q.x1)next.push({...q,x0:x1,y0,y1});}arr=next;}return arr;}
/* Compile existing ROOM geometry. This is a projection, not a second authored world. */
function roomGeometry(p,C){const boxes=[],surfaces=[],rect=q=>({x0:q.x,x1:q.x+q.width,y0:q.y,y1:q.y+q.length});
 for(const q of [...(p.rooms||[]),...(p.floorSections||[])]){const z=C.storyElevation(p,q.story||0),cuts=(p.floorCuts||[]).filter(c=>(c.story||0)===(q.story||0)).map(rect);let i=0;for(const r of subtractRect(rect(q),cuts)){const id=q.id+':floor:'+i++;surfaces.push({...r,z,id,story:q.story||0,kind:'floor'});boxes.push({...r,z0:z-.12,z1:z,id,kind:'slab',support:true});}
  if((p.rooms||[]).includes(q)&&!q.openAbove){const top=z+(q.height||p.wallHeight||2.8);let j=0;for(const r of subtractRect(rect(q),(p.ceilingCuts||[]).filter(c=>c.roomId===q.id).map(rect))){const id=q.id+':ceiling:'+j++;boxes.push({...r,z0:top,z1:top+.12,id,kind:'ceiling',support:true});surfaces.push({...r,z:top+.12,id,story:q.story||0,kind:'roof'});}}}
 for(const w of C.roomWalls(p)){const base=C.storyElevation(p,w.story||0),cap=C.wallCap(p,w);if(cap<=0)continue;const openings=C.openingsForWall(p,w).filter(o=>o.kind==='passage'||o.kind==='window'||(o.kind==='door'&&o.open));const holes=openings.map(o=>{const l=C.openingLine(p,o);return {x0:l.start,x1:l.end,y0:o.kind==='passage'?base:base+(o.bottom||0),y1:o.kind==='passage'?base+cap:base+(o.bottom||0)+o.height};});
  let i=0;for(const s of subtractRect({x0:w.start,x1:w.end,y0:base,y1:base+cap},holes)){const id='wall:'+(w.id||w.partitionId||w.roomId||'')+':'+w.axis+':'+w.fixed+':'+i++;const b=w.axis==='h'?{x0:s.x0,x1:s.x1,y0:w.fixed-.07,y1:w.fixed+.07}:{x0:w.fixed-.07,x1:w.fixed+.07,y0:s.x0,y1:s.x1};boxes.push({...b,z0:s.y0,z1:s.y1,id,kind:'wall',support:true});surfaces.push({...b,z:s.y1,id,story:w.story||0,kind:'walltop'});}}
 for(const q of p.pillars||[]){const z=C.storyElevation(p,q.story||0),b={x0:q.x-q.width/2,x1:q.x+q.width/2,y0:q.y-q.depth/2,y1:q.y+q.depth/2,z0:z,z1:z+q.height,id:q.id,kind:'pillar',support:true};boxes.push(b);surfaces.push({...b,z:b.z1,story:q.story||0});}
 for(const q of p.props||[]){if(q.enabled===false||q.collision?.solid===false)continue;const z=C.propFloorZ(p,q),fp=C.propFootprint(q,(p.objectLibrary?.setups||{})[q.asset],null,z);const xs=fp.poly.map(a=>a.x),ys=fp.poly.map(a=>a.y);const b={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),z0:fp.z0,z1:fp.z1,id:q.id,kind:'prop',support:true};boxes.push(b);surfaces.push({...b,z:b.z1,story:q.story||0});}
 return {boxes,surfaces};}
function create(options={}){
 const cfg={...DEFAULTS,...options.config},pressure=cfg.combatMode===COMBAT.mode,combat={...COMBAT,...options.combatTuning},actionDefs=pressure?PRESSURE_ACTIONS:ACTIONS,definitions=clone(options.definitions||{}),initial=clone(options.actors||[]),staticGeometry=clone(options.geometry||{boxes:[],surfaces:[]});
 const W={tick:0,acc:0,actors:[],events:[],seq:0,actions:0,controlId:null,pieces:clone(options.pieces||[]),contacts:new Set(),touching:new Set(),lastImpact:new Map(),effects:true,car:options.vehicleWorld||null,lastVehicleSeq:0,carCountdown:0,routeEdges:clone(options.routeEdges||[]),carShapes:[],oldCarShapes:[],lastRejection:'',preset:options.preset||'practice'};
 let hands = null;
 const record=(type,data={})=>{const r={id:'physical:'+String(++W.seq).padStart(6,'0'),tick:W.tick,time:W.tick*H,type,...data};W.events.push(r);if(W.events.length>4000)W.events.shift();return r;};
 const get=id=>W.actors.find(a=>a.id===id)||null;
 const body=s=>Object.freeze({...PROFILES.standard,...(typeof s==='string'?(options.profiles?.[s]||PROFILES[s]||{}):s)});
 function actor(s){return {id:s.id,name:s.name||s.id,appearance:s.appearance||'PLB',bodyProfile:s.bodyProfile||'standard',body:body(s.bodyProfile||'standard'),x:s.x||0,y:s.y||0,z:s.z||0,story:s.story??2,yaw:s.yaw||0,vx:0,vy:0,vz:0,motion:'supported',support:null,localSupport:null,localLanding:null,health:s.health??body(s.bodyProfile).maxHealth,stagger:0,down:false,downTick:0,holder:null,held:null,action:null,cycle:0,distance:0,controller:s.controller||'test',equipment:clone(s.equipment||{weaponId:null,rangedEnabled:false}),capabilities:s.capabilities||['move','face','jump','punch','kick','grab','throw','release'],input:{},recovery:0,thrownBy:null,cause:null,testMode:s.testMode||'counter',nextCounter:0,counterArmed:false,
 guard:combat.guardMax,guardMax:combat.guardMax,guardDelay:0,blockWanted:false,blocking:false,blockHitT:0,wiltT:0,comboStep:0,comboUntil:0,queuedLight:false,queuedGrab:null,flyKickUsed:false,jumpForward:false,offRailLandingAuthorized:false,groundSlip:false,lastPressureTick:-9999,lastHitKind:null};}
 for(const s of initial){if(!s.id||get(s.id))throw Error('Actors require unique stable IDs');W.actors.push(actor(s));}W.controlId=options.controlId||W.actors[0]?.id;
 if(get(W.controlId))get(W.controlId).controller='human';
 if(pressure)for(const a of W.actors)for(const verb of ['strong','flyingkick','block'])if(!a.capabilities.includes(verb))a.capabilities.push(verb);
 function shapeCars(){if(!W.car)return [];return W.car.renderList().filter(v=>v.state!=='OFFSTAGE').map(v=>{const along=direction(v.heading),right={x:-along.y,y:along.x},roof=options.carGeometry||{height:1.35,roofLength:1.85,roofWidth:1.35,bodyHeight:.85};return {id:v.id,x:v.x,y:v.y,z:options.streetElevation||0,yaw:v.heading,vx:along.x*v.speed,vy:along.y*v.speed,length:v.length||v.halfLength*2||4.61,width:v.width||v.halfWidth*2||1.67,halfLength:v.halfLength||2.305,halfWidth:v.halfWidth||.835,roof,along,right,state:v.state,speed:v.speed,driver:v.driver};});}
 function carLocal(c,p){const dx=p.x-c.x,dy=p.y-c.y;return {x:dx*c.right.x+dy*c.right.y,y:dx*c.along.x+dy*c.along.y};}
 function carWorld(c,p){return {x:c.x+c.right.x*p.x+c.along.x*p.y,y:c.y+c.right.y*p.x+c.along.y*p.y};}
 function carBox(c,roofOnly=false){const l=roofOnly?c.roof.roofLength/2:c.halfLength,w=roofOnly?c.roof.roofWidth/2:c.halfWidth,dx=Math.abs(c.along.x)*l+Math.abs(c.right.x)*w,dy=Math.abs(c.along.y)*l+Math.abs(c.right.y)*w;return {id:c.id,x0:c.x-dx,x1:c.x+dx,y0:c.y-dy,y1:c.y+dy,z0:c.z,z1:c.z+(roofOnly?c.roof.height:c.roof.bodyHeight),kind:'car',support:true,car:c};}
 function pieceShapes(){const out=[];for(const p of W.pieces){const def=definitions[p.definition],st=def?.states?.[p.state];if(!st)throw Error('Unknown environmental state '+p.id+':'+p.state);for(const b of st.boxes||[])out.push({...b,x0:b.x0+p.x,x1:b.x1+p.x,y0:b.y0+p.y,y1:b.y1+p.y,z0:b.z0+p.z,z1:b.z1+p.z,id:p.id,kind:'piece',support:true,piece:p});}return out;}
 function boxes(includeCars=true){return [...staticGeometry.boxes,...pieceShapes(),...(includeCars?W.carShapes.flatMap(c=>[carBox(c),{...carBox(c,true),z0:c.z+c.roof.bodyHeight}]):[])];}
 // Actor heads are temporary physical support too. This is not an extra actor controller.
 // Keep these platforms out of authored geometry: their positions come from the shared actor roots.
 function surfaces(a=null){const fixed=[...staticGeometry.surfaces,...pieceShapes().filter(b=>b.support).map(b=>({...b,z:b.z1,kind:'piece'})),...W.carShapes.flatMap(c=>[{...carBox(c),z:c.z+c.roof.bodyHeight,kind:'carhood',car:c},{...carBox(c,true),z:c.z+c.roof.height,kind:'carroof',car:c}])];
  if(a)for(const other of W.actors){if(other===a||other.outOfTile||other.holder||other.down)continue;fixed.push({id:other.id,x0:other.x-other.body.radius,x1:other.x+other.body.radius,y0:other.y-other.body.radius,y1:other.y+other.body.radius,z:other.z+other.body.height,kind:'actor_head',actor:other});}
  return fixed;}
 function supportAt(a,p,maxDiff=.07){let best=null;for(const s of surfaces(a)){
   // Adjacent floor rectangles share an edge; a *positive* inset invented a support gap.
   // A small tolerance across the seam prevents a walking actor from becoming airborne.
   const pad=s.kind==='floor'?-0.018:s.kind==='actor_head'?0:-0.008;
   if(Math.abs(p.z-s.z)>maxDiff||!inRect(p.x,p.y,s,pad))continue;
   if(!best||s.z>best.z)best=s;
  }return best;}
 function acquire(a,s){a.flyKickUsed=false;a.jumpForward=false;a.motion='supported';a.support=s.id;a.z=s.z;a.vz=0;a.localSupport=s.car?{...carLocal(s.car,a),z:s.z-s.car.z}:null;a.story=s.story??a.story;const route=onRoute(a,a.x,a.y,a.z);a.localLanding=route?null:((a.offRailLandingAuthorized||s.kind==='actor_head')?{x:a.x,y:a.y,z:a.z,radius:cfg.localLandingRadius}:null);a.offRailLandingAuthorized=false;a.groundSlip=false;}
 function onRoute(a,x,y,z){let best=null;for(const e of W.routeEdges){const piece=e.piece&&W.pieces.find(p=>p.id===e.piece);if(e.gate===false||piece&&piece.state!==e.requiresState)continue;const A=e.A,B=e.B,dx=B.x-A.x,dy=B.y-A.y,l2=dx*dx+dy*dy;if(l2<EPS)continue;const t=clamp(((x-A.x)*dx+(y-A.y)*dy)/l2,0,1),d=Math.hypot(x-A.x-dx*t,y-A.y-dy*t),ez=A.z+(B.z-A.z)*t;if(Math.abs(z-ez)>.4||d>(e.band??.8))continue;if(!best||d<best.d)best={e,d,t};}return best;}
 function clear(a,p,ignore=[],includeActors=true){for(const b of boxes()){if(ignore.includes(b.id)||b.id===a.support&&b.z1<=p.z+.01)continue;if(boxOverlap(a,p,b))return {kind:'geometry',id:b.id,shape:b};}if(includeActors)for(const o of W.actors){if(o===a||ignore.includes(o.id)||o.holder===a.id||a.holder===o.id)continue;if(o.z+o.body.height>p.z+.02&&p.z+a.body.height>o.z+.02&&dist(o,p)<a.body.radius+o.body.radius-.001)return {kind:'actor',id:o.id};}return null;}
 function line(a,b,ignore=[]){let hit=null;for(const q of boxes()){if(ignore.includes(q.id))continue;const t=rayBox(a,b,q);if(t!==null&&t>1e-4&&t<.9999&&(!hit||t<hit.t))hit={t,id:q.id,shape:q};}return hit;}
 function reject(a,verb,reason){W.lastRejection=reason;record('rejected',{actor:a?.id||null,verb,reason});return {ok:false,reason};}
 function targetFor(a,reach,explicit){let eligible=[];const d=direction(a.yaw);for(const t of W.actors){if(t===a||t.outOfTile||pressure&&t.down||explicit&&t.id!==explicit)continue;const range=Math.hypot(t.x-a.x,t.y-a.y);if(range>reach+t.body.radius||range<.001)continue;if(Math.abs(t.z-a.z)>(a.action?.verb==='flyingkick'?combat.flyKickVerticalReach:1.1))continue;const dot=((t.x-a.x)*d.x+(t.y-a.y)*d.y)/range;if(dot<.5)continue;const start={x:a.x,y:a.y,z:a.z+a.body.height*.60},end={x:t.x,y:t.y,z:t.z+t.body.height*.60};if(line(start,end,[a.support,t.support]))continue;let bodyBlocked=false;for(const o of W.actors){if(o===a||o===t||o.holder===a.id)continue;const q={x0:o.x-o.body.radius,x1:o.x+o.body.radius,y0:o.y-o.body.radius,y1:o.y+o.body.radius,z0:o.z,z1:o.z+o.body.height};const k=rayBox(start,end,q);if(k!==null&&k>.01&&k<.99){bodyBlocked=true;break;}}if(!bodyBlocked)eligible.push({t,range});}eligible.sort((x,y)=>x.range-y.range||x.t.id.localeCompare(y.t.id));return eligible[0]?.t||null;}
 function holdPoint(a,p=a){const d=direction(a.yaw),t=get(a.held);const distance=Math.max(cfg.holdDistance,a.body.radius+(t?.body.radius||.3)+.22);return {x:p.x+d.x*distance,y:p.y+d.y*distance,z:p.z+cfg.holdLift};}
 function release(a,throwing=false,cause=null){const t=get(a.held);if(!t)return {ok:false,reason:'not_holding'};const hp={x:t.x,y:t.y,z:t.z};if(clear(t,hp,[a.id,t.id],true))return reject(a,throwing?'throw':'release','release_space_blocked');a.held=null;t.holder=null;t.motion='airborne';t.support=null;t.localSupport=null;t.localLanding=null;t.offRailLandingAuthorized=true;const d=direction(a.yaw);let sx=0,sy=0;const c=W.carShapes.find(c=>c.id===a.support);if(c){sx=c.vx;sy=c.vy;}t.vx=a.vx+sx+(throwing?d.x*cfg.throwSpeed:0);t.vy=a.vy+sy+(throwing?d.y*cfg.throwSpeed:0);t.vz=throwing?cfg.throwUp:0;t.stagger=throwing?1.15:.35;t.thrownBy=throwing?a.id:null;t.cause=cause;t.action=null;record(throwing?'thrown':'released',{actor:a.id,target:t.id,cause,velocity:[t.vx,t.vy,t.vz]});return {ok:true,target:t.id};}
 function detachOnLoss(a,why){if(a.held){const t=get(a.held);a.held=null;if(t){t.holder=null;t.motion='airborne';t.support=null;t.localSupport=null;t.vz=0;record('holder_lost',{actor:a.id,target:t.id,reason:why});}}if(a.holder){const h=get(a.holder);if(h)h.held=null;a.holder=null;a.motion='airborne';}}
 function damage(a,amount,cause,kind){if(!a||a.down||!(amount>0))return;const before=a.health;a.health=Math.max(0,a.health-amount);record('injury',{target:a.id,before,after:a.health,amount,cause,kind});if(a.health<=EPS){a.down=true;a.downTick=W.tick;a.action=null;a.input={};a.blockWanted=a.blocking=a.queuedLight=false;a.queuedGrab=null;a.wiltT=0;detachOnLoss(a,'down');record('down',{target:a.id,cause});}}
 function changePiece(p,event){const def=definitions[p.definition];const rule=(def.transitions||[]).find(r=>r.from===p.state&&(event.severity>=r.minSeverity)&&(!r.tags||r.tags.some(t=>event.tags?.includes(t))));if(!rule)return false;if(p.lastCause===event.id)return false;const before=p.state,actorBlocked=W.actors.some(a=>!a.outOfTile&&!a.holder&&(def.states[rule.to].boxes||[]).some(b=>boxOverlap(a,a,{...b,x0:b.x0+p.x,x1:b.x1+p.x,y0:b.y0+p.y,y1:b.y1+p.y,z0:b.z0+p.z,z1:b.z1+p.z})));
  if(actorBlocked){record('piece_change_deferred',{piece:p.id,from:before,to:rule.to,cause:event.id,reason:'occupied_target_state'});return false;}
  p.state=rule.to;p.lastCause=event.id;record('piece_changed',{piece:p.id,before,after:p.state,cause:event.id,authority:'ROOM_LOCAL_PROOF'});options.onPieceChange?.(p,before);return true;}
 function impact(a,target,severity,cause,kind='impact',normal=null){const key=[a?.id||'world',target].sort().join('|');W.touching.add(key);const last=W.lastImpact.get(key);if(W.contacts.has(key)||last&&W.tick-last.tick<60)return null;W.lastImpact.set(key,{tick:W.tick});const ev=record('impact',{actor:a?.id||null,target,severity,cause,kind,contact:a?[a.x,a.y,a.z]:null,tags:[kind],normal});const p=W.pieces.find(p=>p.id===target);if(p)changePiece(p,ev);if(a&&kind!=='strike'){const threshold=kind==='vehicle'?cfg.vehicleDamageSpeed:cfg.impactDamageSpeed,fatal=kind==='vehicle'?cfg.vehicleFatalSpeed:12;if(severity>=threshold)damage(a,severity>=fatal?2:1,ev.id,kind);}return ev;}
 function isWilting(a){return !!a&&!a.down&&!a.outOfTile&&!a.holder&&a.wiltT>EPS;}
 function grabEligibility(a,explicit){const t=targetFor(a,cfg.grabReach,explicit);if(!t)return {ok:false,reason:'no_reachable_target'};if(t.down)return {ok:false,reason:'target_down',target:t};if(t.holder||t.held)return {ok:false,reason:'target_already_attached',target:t};if(pressure&&!isWilting(t))return {ok:false,reason:'break_guard_first',target:t};return {ok:true,target:t};}
 function enterWilt(t,cause){if(t.down)return;t.wiltT=Math.max(t.wiltT,combat.wiltSeconds);t.guard=0;t.blocking=t.blockWanted=false;t.action=null;t.queuedLight=false;t.queuedGrab=null;t.stagger=Math.min(t.stagger,.16);t.guardDelay=combat.wiltSeconds+.35;t.input={};record('guard_broken',{target:t.id,cause,seconds:combat.wiltSeconds});}
 function blockFaces(t,a){const d=direction(t.yaw),dx=a.x-t.x,dy=a.y-t.y,l=Math.hypot(dx,dy);return t.blocking&&t.wiltT<=0&&l>EPS&&(dx*d.x+dy*d.y)/l>=Math.cos(combat.blockArc*Math.PI/360);}
 function pressureHit(a,t,ac){
  const blocked=blockFaces(t,a),before=t.guard,wasWilt=t.wiltT>0;
  t.lastPressureTick=W.tick;t.guardDelay=combat.guardRegenDelay;t.blockHitT=.17;t.lastHitKind=ac.verb;t.counterArmed=true;
  if(!wasWilt)t.guard=Math.max(0,t.guard-(blocked?ac.guardDamage:ac.guardDamage*.85));
  const broke=!wasWilt&&(t.guard<=EPS||(!blocked&&ac.verb!=='punch'));
  if(blocked)record('blocked_strike',{actor:a.id,target:t.id,action:ac.id,verb:ac.verb,guardBefore:before,guardAfter:t.guard});
  else damage(t,ac.damage,ac.id,ac.verb);
  if(broke)enterWilt(t,ac.id);
  else if(!wasWilt){t.stagger=Math.max(t.stagger,blocked?ac.blockStun:ac.stagger);if(!blocked){t.action=null;t.queuedLight=false;t.queuedGrab=null;}}
  // Light pressure does not lift the body or keep extending a wilt window.
  const push=ac.push*(blocked?(broke?.40:.12):1),factor=clamp(a.body.mass/t.body.mass,.65,1.35),d=direction(a.yaw);
  t.vx+=d.x*push*factor;t.vy+=d.y*push*factor;
  if(ac.verb!=='punch'&&(!blocked||broke)){t.motion='airborne';t.support=null;t.localSupport=null;t.localLanding=null;t.offRailLandingAuthorized=true;t.vz=Math.max(t.vz,blocked?ac.lift*.4:ac.lift);}
  t.cause=ac.id;record('strike',{actor:a.id,target:t.id,action:ac.id,verb:ac.verb,blocked,guardBreak:broke,combo:ac.combo||0,push});
 }
 function request(id,verb,data={}){
  const a=get(id);if(!a)return reject(null,verb,'unknown_actor');
  if(hands)return hands.request(a,verb,data);
  if(pressure&&verb==='block'&&data.active===false){a.blockWanted=a.blocking=false;a.queuedLight=false;a.queuedGrab=null;return {ok:true};}
  if(!a.capabilities.includes(verb))return reject(a,verb,'capability_unavailable');
  if(a.down||a.holder||a.stagger>0||pressure&&a.wiltT>0&&['punch','strong','kick','flyingkick','grab','block'].includes(verb))return reject(a,verb,'actor_not_ready');
  if(verb==='move'){a.input={...data};return {ok:true};}
  if(verb==='face'){if(!Number.isFinite(data.yaw))return reject(a,verb,'invalid_facing');if(a.held){const target=get(a.held),delta=wrap(data.yaw-a.yaw),start=a.yaw,n=Math.max(1,Math.ceil(Math.abs(delta)*Math.PI/180*cfg.holdDistance/cfg.maxStepDistance));for(let i=1;i<=n;i++){const yaw=start+delta*i/n,point=holdPoint({...a,yaw});if(target&&clear(target,point,[a.id,target.id]))return reject(a,verb,'carried_body_rotation_blocked');a.yaw=yaw;}}else a.yaw=data.yaw;return {ok:true};}
  if(pressure&&verb==='block'){
   if(a.held)return reject(a,verb,'hands_occupied');a.blockWanted=true;a.queuedLight=false;a.queuedGrab=null;a.blocking=!a.action&&a.guard>EPS;return {ok:true};
  }
  // One buffered follow-up, not one hit per mouse event or render frame.
  if(pressure&&verb==='punch'&&a.action?.verb==='punch'&&a.action.t>=.04){a.queuedGrab=null;a.queuedLight=true;return {ok:true,queued:true};}
  // A short grab buffer at the end of a connected light avoids a dead input at guard break.
  // It never skips recovery; eligibility is checked now, when dequeued, and at contact.
  if(pressure&&verb==='grab'&&a.action?.verb==='punch'&&a.action.hit&&a.action.duration-a.action.t<=combat.comboBuffer+EPS){
   const e=grabEligibility(a,data.target);if(!e.ok)return reject(a,verb,e.reason);
   a.queuedLight=false;a.queuedGrab={target:e.target.id,until:W.tick+Math.ceil(combat.comboBuffer/H)+1};
   record('action_buffered',{actor:a.id,verb:'grab',target:e.target.id,after:a.action.id});return {ok:true,queued:true};
  }
  if(a.action&&a.action.verb==='grab'&&a.held&&['throw','release'].includes(verb))a.action=null;
  if(a.action)return reject(a,verb,'recovering');
  if(a.held&&!['release','throw','jump'].includes(verb))return reject(a,verb,'hands_occupied');
  if(pressure){a.blockWanted=a.blocking=false;}
  if(verb==='jump'){
   if(a.motion!=='supported')return reject(a,verb,'not_supported');
   const f=direction(a.yaw),forward=(a.input.x||0)*f.x+(a.input.y||0)*f.y;
   a.jumpForward=forward>.15||a.vx*f.x+a.vy*f.y>1.2;a.flyKickUsed=false;
   const s=W.carShapes.find(c=>c.id===a.support);if(s){a.vx+=s.vx;a.vy+=s.vy;}
   a.motion='airborne';a.support=null;a.localSupport=null;a.localLanding=null;a.offRailLandingAuthorized=true;a.vz=cfg.jump*(a.held?.82:1);a.cause='act:'+ ++W.actions;record('jump',{actor:a.id,cause:a.cause,forward:a.jumpForward});return {ok:true};
  }
  if(pressure&&verb==='kick'&&a.motion==='airborne'&&a.jumpForward&&!a.flyKickUsed)verb='flyingkick';
  if(verb==='flyingkick'){
   if(!pressure||a.motion!=='airborne'||!a.jumpForward)return reject(a,verb,'forward_jump_required');
   if(a.flyKickUsed)return reject(a,verb,'one_flying_kick_per_jump');
  }
  const def=actionDefs[verb];if(!def)return reject(a,verb,'unknown_action');
  if((verb==='release'||verb==='throw')&&!a.held)return reject(a,verb,'not_holding');
  let target=null;if(verb==='grab'){
   if(data.target===a.id)return reject(a,verb,'self_grab');const e=grabEligibility(a,data.target);if(!e.ok)return reject(a,verb,e.reason);target=e.target;
   const proposed=holdPoint({...a,held:target.id});if(clear(target,proposed,[a.id,target.id]))return reject(a,verb,'hold_space_blocked');
  }
  let combo=0;if(pressure&&verb==='punch'){if(W.tick>a.comboUntil)a.comboStep=0;combo=a.comboStep++%4+1;a.comboUntil=W.tick+Math.round((def.duration+combat.comboWindow)/H);}
  const aid='act:'+ ++W.actions;a.action={id:aid,verb,t:0,hit:false,target:target?.id||data.target||null,combo,...def};
  if(verb==='flyingkick'){const d=direction(a.yaw);a.vx=d.x*combat.flyKickSpeed;a.vy=d.y*combat.flyKickSpeed;a.flyKickUsed=true;record('lunge',{actor:a.id,action:aid,velocity:[a.vx,a.vy,a.vz]});}
  record('action_accepted',{actor:a.id,verb,action:aid,target:a.action.target,combo});return {ok:true,action:aid,verb,combo};
 }
 function resolveAction(a){const ac=a.action;if(!ac||ac.hit||ac.t+EPS<ac.windup)return;if(ac.verb==='flyingkick'&&ac.t<ac.activeEnd&&!targetFor(a,ac.reach,ac.target))return;ac.hit=true;
  if(ac.verb==='release'||ac.verb==='throw'){release(a,ac.verb==='throw',ac.id);return;}
  if(ac.verb==='grab'){const t=targetFor(a,cfg.grabReach,ac.target);if(!t||t.holder||t.held||pressure&&!isWilting(t)){record('action_missed',{actor:a.id,action:ac.id,reason:'target_changed'});return;}const hp=holdPoint({...a,held:t.id});if(clear(t,hp,[a.id,t.id])){record('action_missed',{actor:a.id,action:ac.id,reason:'hold_space_blocked'});return;}a.held=t.id;t.holder=a.id;t.action=null;t.input={};t.blockWanted=t.blocking=t.queuedLight=false;t.queuedGrab=null;t.wiltT=0;t.motion='held';t.support=null;t.localSupport=null;t.vx=t.vy=t.vz=0;Object.assign(t,hp);record('grabbed',{actor:a.id,target:t.id,action:ac.id});return;}
  const t=targetFor(a,ac.reach,ac.target);if(t){if(pressure){pressureHit(a,t,ac);return;}const d=direction(a.yaw),factor=clamp(a.body.mass/t.body.mass,.65,1.35);damage(t,ac.damage,ac.id,ac.verb);t.stagger=Math.max(t.stagger,ac.stagger);t.counterArmed=true;t.action=null;t.motion='airborne';t.support=null;t.localSupport=null;t.offRailLandingAuthorized=true;t.vx+=d.x*ac.push*factor;t.vy+=d.y*ac.push*factor;t.vz=Math.max(t.vz,ac.lift);t.cause=ac.id;record('strike',{actor:a.id,target:t.id,action:ac.id,verb:ac.verb});return;}
  const d=direction(a.yaw),s={x:a.x,y:a.y,z:a.z+1},e={x:a.x+d.x*ac.reach,y:a.y+d.y*ac.reach,z:s.z},hit=line(s,e);if(hit?.shape?.piece){const ev=record('impact',{actor:a.id,target:hit.id,severity:ac.push,cause:ac.id,kind:'strike',tags:['strike']});changePiece(hit.shape.piece,ev);}else record('action_missed',{actor:a.id,action:ac.id});}
 function switchControl(id){const a=get(id);if(!a)return {ok:false,reason:'unknown_actor'};if(hands)return hands.switchControl(a);for(const x of W.actors){x.input={};if(x.action)record('action_cancelled',{actor:x.id,action:x.action.id,reason:'control_swap'});x.action=null;x.queuedLight=x.blockWanted=x.blocking=false;x.queuedGrab=null;x.controller=x===a?'human':'test';}W.controlId=id;record('control_changed',{actor:id});return {ok:true};}
 function setAppearance(id,appearance){const a=get(id);if(!a)return false;a.appearance=appearance;record('appearance_changed',{actor:id,appearance});return true;}
 function setProfile(id,name){const a=get(id);if(!a)return false;const old=a.body;a.body=body(name);if(clear(a,a,[a.id])){a.body=old;return false;}a.bodyProfile=name;record('profile_changed',{actor:id,profile:name});return true;}
 function moveActor(a){if(a.motion==='held'||a.outOfTile)return;const old={x:a.x,y:a.y,z:a.z};if(a.support){const car=W.carShapes.find(c=>c.id===a.support);if(a.localSupport&&car){
   // A moving support supplies desired displacement, never permission to penetrate a wall.
   const q={...carWorld(car,a.localSupport),z:car.z+a.localSupport.z},from={x:a.x,y:a.y,z:a.z},n=Math.max(1,Math.ceil(Math.max(Math.abs(q.x-a.x),Math.abs(q.y-a.y),Math.abs(q.z-a.z))/cfg.maxStepDistance));let obstructed=null;
   for(let i=1;i<=n;i++){const p={x:from.x+(q.x-from.x)*i/n,y:from.y+(q.y-from.y)*i/n,z:from.z+(q.z-from.z)*i/n};obstructed=clear(a,p,[car.id,a.held]);if(!obstructed&&a.held){const t=get(a.held);if(t)obstructed=clear(t,holdPoint(a,p),[a.id,t.id]);}if(obstructed)break;Object.assign(a,p);}
   if(obstructed){a.localSupport={...carLocal(car,a),z:a.z-car.z};a.vx=a.vy=0;a.blocked='moving_support_clearance';if(a.lastSupportObstacle!==obstructed.id)record('support_obstructed',{actor:a.id,support:car.id,obstacle:obstructed.id});a.lastSupportObstacle=obstructed.id;}else a.lastSupportObstacle=null;
  }else if(!supportAt(a,a)){const previous=W.oldCarShapes.find(c=>c.id===a.support);if(a.localSupport&&previous){a.vx+=previous.vx;a.vy+=previous.vy;}a.motion='airborne';const onActor=!!get(a.support),onCar=!!W.oldCarShapes.find(c=>c.id===a.support);a.support=null;a.localSupport=null;if(!onActor)a.localLanding=null;a.offRailLandingAuthorized=onActor||onCar;a.groundSlip=!onActor&&!onCar;record('support_lost',{actor:a.id});}}
  const inp=a.input||{},canMove=!a.down&&a.stagger<=0&&(!pressure||a.wiltT<=0)&&!(a.action?.verb==='kick'&&a.action.t<.25);let mx=canMove?(inp.x||0):0,my=canMove?(inp.y||0):0;const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;}const speed=(a.held?cfg.carrySpeed:pressure&&a.blocking?combat.blockSpeed:inp.sprint?cfg.sprint:cfg.walk)*(hands?hands.movementScale(a):1);
  if(a.motion==='supported'){if(canMove&&m>0){a.vx+=clamp(mx*speed-a.vx,-cfg.acceleration*H,cfg.acceleration*H);a.vy+=clamp(my*speed-a.vy,-cfg.acceleration*H,cfg.acceleration*H);}else{a.vx*=Math.max(0,1-cfg.drag*H);a.vy*=Math.max(0,1-cfg.drag*H);}}
  else{if(m>0&&canMove){a.vx+=mx*cfg.airAcceleration*H;a.vy+=my*cfg.airAcceleration*H;}a.vz-=cfg.gravity*H;a.vx=clamp(a.vx,-35,35);a.vy=clamp(a.vy,-35,35);}
  let dx=a.vx*H,dy=a.vy*H,dz=a.vz*H;
  // A walker losing support is allowed to FALL; it does not gain free-form air travel
  // unless a jump, throw or another authorized displacement launched it.
  if(a.motion==='airborne'&&a.groundSlip&&!a.localSupport&&!a.localLanding&&!onRoute(a,a.x+dx,a.y+dy,a.z)){
   dx=dy=0;a.vx=a.vy=0;
  }
  const arenaSurface=hands&&a.motion==='supported'&&!a.localSupport
   ? staticGeometry.surfaces.find(s=>s.id===a.support&&s.kind==='floor'&&hands.arenaFloors.has(s.id))
   : null;
  if(arenaSurface){
   if(!inRect(a.x+dx,a.y,arenaSurface,a.body.radius)){dx=0;a.vx=0;}
   if(!inRect(a.x,a.y+dy,arenaSurface,a.body.radius)){dy=0;a.vy=0;}
  }
  if(!arenaSurface&&a.motion==='supported'&&m>0&&!a.localSupport){const local=a.localLanding,allowed=onRoute(a,a.x+dx,a.y+dy,a.z)||(local&&Math.hypot(a.x+dx-local.x,a.y+dy-local.y)<=local.radius);if(!allowed){dx=dy=0;a.vx=a.vy=0;a.blocked='outside_authored_band';}else a.blocked=null;}
  // Bounded subdivisions protect fast throws and moving-car contacts without a new physics engine.
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))/cfg.maxStepDistance));for(let sub=0;sub<n;sub++){
   let nx=a.x+dx/n,ny=a.y+dy/n,nz=a.z+dz/n;let blockedHold=false;if(a.held){const t=get(a.held),hp=holdPoint(a,{x:nx,y:ny,z:nz});if(t&&clear(t,hp,[a.id,t.id])){nx=a.x;ny=a.y;nz=a.z;a.vx=a.vy=0;blockedHold=true;a.blocked='carried_body_clearance';}}
   // Floors and tops are one-way support only when descending from above; their slabs still block upward movement.
   if(a.vz<=0&&!blockedHold){let land=null;for(const s of surfaces(a)){const pad=s.kind==='floor'?-0.018:s.kind==='actor_head'?0:-0.008;if(a.z>=s.z-.018&&nz<=s.z+.008&&inRect(nx,ny,s,pad)&&(!land||s.z>land.z))land=s;}if(land){const fall=-a.vz;const candidate={x:nx,y:ny,z:land.z};if(!clear(a,candidate,[land.id,a.held],false)){nz=land.z;const was=a.motion;acquire(a,land);dz=0;if(was==='airborne'){record('landed',{actor:a.id,support:land.id,speed:fall});if(fall>=cfg.fallDamageSpeed)damage(a,fall>=13?2:1,a.cause,'fall');a.recovery=.15;}}}}
   // Resolve each axis, using the new support height. Full body volume, not the sprite.
   for(const axis of ['x','y','z']){const p={x:a.x,y:a.y,z:a.z};p[axis]=axis==='x'?nx:axis==='y'?ny:nz;const hit=clear(a,p,[a.held],true);if(hit){const velocity=axis==='x'?a.vx:axis==='y'?a.vy:a.vz;const toward=Math.abs(velocity);if(toward>1.6&&hit.kind==='geometry'){const car=hit.shape.car;const relative=car?Math.hypot(a.vx-car.vx,a.vy-car.vy):toward;const ev=impact(a,hit.id,relative,a.cause,car?'vehicle':'scenery');if(hit.shape.piece&&hit.shape.piece.state!==definitions[hit.shape.piece.definition]?.initialState){if(!clear(a,p,[a.held],true)){a[axis]=p[axis];continue;}}}
     if(axis==='z'){
       if(a.vz>0){a.vz=0;dz=0;record('ceiling_contact',{actor:a.id,obstacle:hit.id});}
       else if(a.vz<0){
        // A blocked descending body must not silently accrue gravitational velocity.
        // This also covers an actor-top collision if its support plane was missed on a step.
        const s=supportAt(a,a,.1);
        if(s){const fall=-a.vz;const was=a.motion;acquire(a,s);if(was==='airborne'){record('landed',{actor:a.id,support:s.id,speed:fall});if(fall>=cfg.fallDamageSpeed)damage(a,fall>=13?2:1,a.cause,'fall');}}
        else a.vz=0;
        dz=0;
       }
      }else{if(axis==='x'){a.vx=0;dx=0;}else{a.vy=0;dy=0;}}a.blocked='contact:'+hit.id;
    }else a[axis]=p[axis];}
  }
  if(a.motion==='supported'){const s=supportAt(a,a,.04);if(!s){a.motion='airborne';const car=W.carShapes.find(c=>c.id===a.support),onActor=!!get(a.support);a.offRailLandingAuthorized=onActor||!!car;a.groundSlip=!onActor&&!car;if(car){a.vx+=car.vx;a.vy+=car.vy;}a.support=null;a.localSupport=null;if(!onActor)a.localLanding=null;record('support_lost',{actor:a.id});}else{a.support=s.id;if(s.car)a.localSupport={...carLocal(s.car,a),z:s.z-s.car.z};if(onRoute(a,a.x,a.y,a.z))a.localLanding=null;}}
  const moved=Math.hypot(a.x-old.x,a.y-old.y);a.cycle+=Math.hypot(a.vx,a.vy)*H;a.distance+=moved;if(a.z<cfg.maxFallZ){damage(a,99,a.cause,'out_of_tile_fall');a.z=cfg.maxFallZ;a.vx=a.vy=a.vz=0;a.outOfTile=true;record('out_of_tile',{actor:a.id,cause:a.cause});}
 }
 function stepVehicles(){if(!W.car)return;W.oldCarShapes=W.carShapes;
  // Height filtering happens before the legacy planar Vehicle World pedestrian contract.
  // No new vehicle pose writer. Supported riders/above-roof actors are NOT road pedestrians.
  W.car.setBodies(W.actors.filter(a=>!a.localSupport&&a.z< (options.streetElevation||0)+(options.carGeometry?.height||1.35)-.1&&a.z+a.body.height>(options.streetElevation||0)+.12).map(a=>({id:a.id,kind:'npc',x:a.x,y:a.y,story:options.streetStory??2,vx:a.vx,vy:a.vy,radius:a.body.radius})));
  W.car.step();W.carShapes=shapeCars();const evs=W.car.events(W.lastVehicleSeq);for(const e of evs){W.lastVehicleSeq=Math.max(W.lastVehicleSeq,e.seq);if(e.type==='vehicle_pedestrian_contact'){const a=get(e.target);if(a){const c=W.carShapes.find(c=>c.id===e.vehicleId);const severity=Math.abs(e.relativeSpeed??e.speed??e.closingSpeed??0);const ev=impact(a,e.vehicleId,severity,'vehicle:'+e.seq,'vehicle');if(ev&&c){if(a.holder)detachOnLoss(a,'vehicle_contact');const d=c.along;a.motion='airborne';a.support=null;a.vx=d.x*Math.max(2,severity*.75);a.vy=d.y*Math.max(2,severity*.75);a.vz=Math.max(2,severity*.35);a.stagger=.8;}}}}
  if(W.carShapes.length===0&&options.respawnCars!==false){W.carCountdown+=H;if(W.carCountdown>=cfg.carRespawnDelay){spawnCar();W.carCountdown=0;}}
 }
 function spawnCar(){if(!W.car)return;const r=W.car.command({type:'spawn',classId:'sedan',portalId:options.carPortal||'vportal_west_e',speed:cfg.carSpeed});if(r.ok){W.car.command({type:'setCruise',vehicleId:r.vehicleId,speed:cfg.carSpeed});record('vehicle_entered',{vehicle:r.vehicleId,authority:'Vehicle World'});}W.carShapes=shapeCars();return r;}
 function testDriver(a){
  if(pressure){
   if(a.controller!=='test'||a.testMode==='idle'||a.down||a.holder||a.wiltT>0)return;
   const target=get(W.controlId);if(!target||target===a||target.down)return;
   const d=dist(a,target);if(d>5.5||line({x:a.x,y:a.y,z:a.z+1},{x:target.x,y:target.y,z:target.z+1}))return;
   if(a.stagger<=0)request(a.id,'face',{yaw:heading(a,target)});
   if(a.action||a.stagger>0)return;
   if(a.counterArmed&&W.tick>=a.nextCounter&&(W.tick-a.lastPressureTick)*H>combat.counterPause&&d<1.8&&Math.abs(a.z-target.z)<.9){
    request(a.id,'block',{active:false});const r=request(a.id,'strong');if(r.ok){a.nextCounter=W.tick+Math.round(combat.counterInterval/H);record('counter_started',{actor:a.id,target:target.id,action:r.action});}return;
   }
   if(!a.blockWanted)request(a.id,'block',{active:true});return;
  }
if(a.controller!=='test'||a.down||a.holder||a.stagger>0||a.action||a.testMode==='idle'||!a.counterArmed)return;const target=get(W.controlId);if(!target||target===a||target.down)return;if(a.testMode==='counter'&&W.tick>=a.nextCounter&&dist(a,target)<1.6&&Math.abs(a.z-target.z)<.8&&!line({x:a.x,y:a.y,z:a.z+1},{x:target.x,y:target.y,z:target.z+1})){request(a.id,'face',{yaw:heading(a,target)});const r=request(a.id,'punch',{target:target.id});if(r.ok)a.nextCounter=W.tick+Math.round(1.15/H);}}
 function tick(){
  W.tick++;W.touching=new Set();
  if(hands){
   const actors=[...W.actors].sort((a,b)=>a.id.localeCompare(b.id));
   hands.beforeMovement(actors);
   for(const a of actors)moveActor(a);
   hands.afterMovement(actors);
   W.contacts=W.touching;
   return;
  }
  stepVehicles();for(const a of W.actors){a.stagger=Math.max(0,a.stagger-H);a.recovery=Math.max(0,a.recovery-H);
   if(pressure){a.blockHitT=Math.max(0,a.blockHitT-H);a.guardDelay=Math.max(0,a.guardDelay-H);const wasWilt=a.wiltT>0;a.wiltT=Math.max(0,a.wiltT-H);if(wasWilt&&a.wiltT<=0&&!a.holder&&!a.down){a.guard=combat.guardRecovery;a.stagger=0;a.nextCounter=W.tick+Math.round(.45/H);record('guard_recovered',{actor:a.id,guard:a.guard});}if(!a.down&&!a.holder&&a.wiltT<=0&&a.guardDelay<=0&&!a.action)a.guard=Math.min(a.guardMax,a.guard+combat.guardRegen*H);a.blocking=a.blockWanted&&!a.down&&!a.holder&&!a.action&&a.wiltT<=0&&a.guard>0;}
   if(a.down&&a.held)detachOnLoss(a,'down');testDriver(a);if(a.action){a.action.t+=H;resolveAction(a);if(a.action&&a.action.t>=a.action.duration){a.action=null;if(pressure){const grab=a.queuedGrab,light=a.queuedLight;a.queuedGrab=null;a.queuedLight=false;if(!a.blockWanted){if(grab&&W.tick<=grab.until)request(a.id,'grab',{target:grab.target});else if(light)request(a.id,'punch');}}}}}
  for(const a of [...W.actors].sort((a,b)=>a.id.localeCompare(b.id)))moveActor(a);
  for(const a of W.actors)if(a.held){const t=get(a.held);if(!t){a.held=null;continue;}const hp=holdPoint(a);if(!clear(t,hp,[a.id,t.id]))Object.assign(t,hp);else{a.blocked='hold_rotation_blocked';}t.yaw=(a.yaw+180)%360;}
  W.contacts=W.touching;
 }
 function advance(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid delta');W.acc+=Math.min(dt,.25);let n=0;while(W.acc+1e-12>=H&&n<60){tick();W.acc-=H;n++;}return n;}
 function snapshot(){return {tick:W.tick,time:W.tick*H,controlId:W.controlId,actors:W.actors.map(a=>clone(a)),pieces:clone(W.pieces),vehicles:clone(W.carShapes),lastRejection:W.lastRejection,...(hands?hands.snapshot():{})};}
 function setup(){W.carShapes=shapeCars();for(const a of W.actors){const s=supportAt(a,a,.1);if(s)acquire(a,s);else a.motion='airborne';}record('proof_started',{authority:'ROOM_LOCAL_PROOF',preset:W.preset,seed:options.seed??1977});}
 if(options.handsMode){
  if(pressure||W.car||W.pieces.length)throw Error('Hands sparring requires the unarmed, fixed arena preset');
  hands=options.handsMode({W,get,record,line,request,initial,floors:staticGeometry.surfaces});
 }
 setup();return {W,cfg,pressure,...(hands?hands.publicAPI:{}),combat,isWilting,grabEligibility,blockFaces,get,request,advance,step:tick,record,snapshot,switchControl,setAppearance,setProfile,targetFor,line,clear,onRoute,surfaces,boxes,supportAt,acquire,damage,impact,changePiece,release,spawnCar,detachOnLoss,carLocal,carWorld,carBox};
}
return {H,DEFAULTS,ACTIONS,PRESSURE_ACTIONS,COMBAT,PROFILES,create,roomGeometry,subtractRect,rayBox,direction,heading};
});
