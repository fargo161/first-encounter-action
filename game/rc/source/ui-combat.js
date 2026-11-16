/* ===================== Combat Room v0.1.1 · ui-combat.js — COMBAT NPC STANDARD + PLAYER GUNPLAY =====================
   Plugs into the route walk (ui-route.js) through the small "Combat v0.1" hooks. Active only when the scene's
   routeNet carries a `combat` block (examples/Combat_Test_Room.room.json). Ordinary scenes are untouched.

   The standard, in plain words (COMBAT_NPC_STANDARD_V0_1.md has the long form):
   - A bot is an NPC card with a stable id, a role, a side, a temper (fighter / skittish / runner), hit points, a cover
     spot, a gun, an intent (idle / engage / hold / escape / surrender) and its own knowledge (what it saw, what it heard).
   - Bots and you use the SAME cover rules: the same spots, the same sight lines through the same walls, doors,
     windows, crates and rails. A bot ducked behind cover shows only its head and shoulders; so do you when crouched.
   - Hitboxes: a bot is hit where its picture is solid; head = down at once, body = one hit point, legs = disabled.
     You are three points: head, chest, hips. A bot can only hit the points it can actually see.
   - Lethality (owner direction): two consequential hits put you or a bot down. Legibility instead of padding: a bot
     raises its gun for a moment before its first shot, a short grace after a hit, Enter restarts.
   - State decides; pictures follow. The drawn card never decides whether a shot is possible or lands.
   - Every consequential action is an attempt → result record with ids, time, actor, target and cause (CB.events).
   Nothing here edits the project. Doors bots open are put back when the walk ends (ui-route.js already does that). */
const CB={on:false,cfg:null,pl:null,t:0,state:'live',score:0,tracers:[],flashes:[],sparks:[],noise:null,events:[],seq:0,weapon:null,imgs:new Map(),exposure:[0,0,0],exposureT:0,results:null,side:null,lastHit:-99,msg:'',msgT:0};
const CB_COLORS={pink:'#ff3fa4',cyan:'#3fd8ff',gold:'#e8b84a',ink:'#0b0710',white:'#f6edf3',red:'#ff3b3b'};
const CB_INTENT_OF={unaware:'idle',alert:'engage',cover:'engage',peek:'engage',search:'engage',relocate:'engage',hold:'hold',flee:'escape',gone:'escape',surrender:'surrender',disabled:'disabled',down:'down'};
function cbSay(t,ms=2400){CB.msg=t;CB.msgT=CB.t+ms/1000;rwSay(t,ms);}
function cbRand(a,b){return a+(b-a)*RW.rng();}
function cbTemper(n){return CB.cfg.tempers[n.combat.temper]||CB.cfg.tempers.fighter;}
function cbNodeById(id){return RW.nodes.find(x=>x.id===id)||null;}
function cbBots(){return RW.npcs.filter(n=>n.combat);}
function cbBot(id){return cbBots().find(b=>b.id===id)||null;}
function cbLive(n){const c=n.combat;return c&&!c.down&&c.state!=='gone';}
function cbFighting(n){return cbLive(n)&&!['surrender','disabled','gone','hold'].includes(n.combat.state);}
// causal records: one list, ids in order, every record says who, what, whom, when and why
function cbRecord(what,data){const r={id:'ev_'+String(++CB.seq).padStart(4,'0'),t:+CB.t.toFixed(2),what,...data};CB.events.push(r);if(CB.events.length>600)CB.events.splice(0,CB.events.length-600);return r;}
// ------------------------------------------------------------------ start / stop / restart
function cbStart(net){
  CB.on=false;const cfg=net.combat;if(!cfg||typeof cfg!=='object')return;CB.cfg=cfg;CB.on=true;CB.t=0;CB.seq=0;CB.lastHit=-99;CB.state='live';CB.score=0;CB.tracers=[];CB.flashes=[];CB.sparks=[];CB.events=[];CB.noise=null;CB.results=null;CB.msg='';CB.exposure=[0,0,0];
  const P=cfg.player||{};CB.pl={id:'player',life:P.life||2,maxLife:P.life||2,mag:P.magazine||6,ammo:P.magazine||6,reload:0,reloadTime:P.reloadTime||1.6,fireT:0,fireInterval:P.fireInterval||.28,recoil:P.recoil||2.6,kick:0,anim:null,hitFlash:0,unsteady:0,hits:0,shots:0,landed:0,head:0,legs:0};
  CB.side={done:false,active:false};
  const w=cfg.weapon||{};CB.weapon={...w,img:null};const asset=catalog.get(w.atlas);if(asset?.src){let img=CB.imgs.get(asset.src);if(!img){img=new Image();img.src=asset.src;CB.imgs.set(asset.src,img);}CB.weapon.img=img;}
  // combat look limits (a two-storey fight needs a real up/down range; you may look all the way round). Movement facing rules are untouched.
  RW.settings.lookYaw=cfg.lookYaw||180;RW.settings.lookUp=cfg.lookUp||62;RW.settings.lookDown=cfg.lookDown||62;
  for(const n of RW.npcs){const a=n.actor;if(a.role!=='bot')continue;const ac=a.combat||{},T=cfg.tempers[ac.temper]||cfg.tempers.fighter,home=cbNodeById(a.node);
    n.combat={id:n.id,role:ac.role||'gunman',side:ac.side||ac.group||'hostile',group:ac.group||'all',hostileTo:ac.hostileTo||['player'],temper:ac.temper||'fighter',intent:'idle',target:null,
      hp:ac.hp??2,maxHp:ac.hp??2,state:'unaware',aware:false,down:false,tilt:0,node:home,home,timer:cbRand(.2,.8),ammo:T.magazine,reloadT:0,readyT:0,unsteadyT:0,flinchT:0,fireT:0,burst:0,path:null,wake:ac.wake||null,
      shotsBeforeFlee:ac.shotsBeforeFlee??T.shotsBeforeFlee??99,fleeBelowHp:ac.fleeBelowHp??T.fleeBelowHp??0,exposedT:0,know:{seenPlayer:null,heard:null},alertAt:null,alertFrom:null,sink:0,scared:false,surrendered:false,disabled:false,fired:0,hitsOnYou:0};
    const story=Number.isInteger(a.story)?a.story:(home?.story||0);
    if(home){Object.assign(n,{state:'bot',x:home.x,y:home.y,story,facing:home.facing||0});home.occ=n.id;}else Object.assign(n,{state:'bot',x:0,y:0,story,facing:0});
    n.combatSink=0;n.cycle=0;}
  try{wrap.classList.add('combat-on');}catch(_){}
  rwSay('COMBAT · '+(cfg.objective?.label||'')+' · click to fire, X reloads, C crouches, Esc leaves',6000);
}
function cbStop(){if(!CB.on)return;CB.on=false;for(const n of RW.npcs)if(n.combat){n.combatSink=0;}if(RW.hud)RW.hud.classList.remove('combat');try{wrap.classList.remove('combat-on');}catch(_){}}
function cbRestart(){const ctl=RW.control;rwStop();setTimeout(()=>{rwStart(ctl);},60);}
// ------------------------------------------------------------------ player: input guard, timers, exposure
function cbPlayerPre(dt){if(!CB.on)return;if(CB.state!=='live')RW.in={};} /* movement facing / free look rules stay exactly as Encounter preview defines them */
function cbPlayerPoints(){const c=rwCam();return [{name:'head',x:c.x,y:c.y,z:c.z},{name:'chest',x:c.x,y:c.y,z:c.z-.45},{name:'hips',x:c.x,y:c.y,z:c.z-.85}];}
function cbBotGun(n){const floor=rwActorFloor(n);return {x:n.x,y:n.y,z:floor+1.45-(n.combat.sink||0)*.6};} /* arm out at shoulder height; a crouched bot's gun sits lower */
function cbBotPoints(n){const floor=rwActorFloor(n),s=n.combat.sink||0;return [{name:'head',x:n.x,y:n.y,z:floor+1.6-s},{name:'chest',x:n.x,y:n.y,z:floor+1.25-s},{name:'hips',x:n.x,y:n.y,z:floor+.85-s}];}
function cbBotSeesPoints(n){const g=cbBotGun(n);return cbPlayerPoints().filter(p=>!rwSightBlock(g,g.z,p,p.z));}
function cbPlayerSeesPoints(n){const c=rwCam();return cbBotPoints(n).filter(p=>!rwSightBlock(c,c.z,p,p.z));}
function cbPlayerReady(){const pl=CB.pl;return CB.state==='live'&&pl.reload<=0&&pl.fireT<=0&&pl.unsteady<=0&&pl.ammo>0;}
function cbStep(dt){
  if(!CB.on)return;CB.t+=dt;const pl=CB.pl,P=RW.pl;
  pl.fireT=Math.max(0,pl.fireT-dt);pl.unsteady=Math.max(0,pl.unsteady-dt);if(pl.reload>0){pl.reload-=dt;if(pl.reload<=0){pl.reload=0;pl.ammo=pl.mag;cbRecord('reloaded',{actor:'player'});cbSay('Reloaded',900);}}
  if(pl.kick>0){const r=Math.min(pl.kick,dt*14);P.pitch=C.clamp(P.pitch-r,-RW.settings.lookDown,RW.settings.lookUp);pl.kick-=r;}
  if(pl.anim){pl.anim.t+=dt;if(pl.anim.t>=pl.anim.dur)pl.anim=null;}
  pl.hitFlash=Math.max(0,pl.hitFlash-dt*1.6);
  for(const t of CB.tracers)t.t+=dt;CB.tracers=CB.tracers.filter(t=>t.t<t.life);for(const f of CB.flashes)f.t+=dt;CB.flashes=CB.flashes.filter(f=>f.t<f.life);for(const s of CB.sparks)s.t+=dt;CB.sparks=CB.sparks.filter(s=>s.t<s.life);
  if(CB.noise&&CB.t-CB.noise.t>1.2)CB.noise=null;
  // exposure meter: which of your three points any engaged bot can see (checked a few times a second)
  CB.exposureT-=dt;if(CB.exposureT<=0){CB.exposureT=.15;const ex=[0,0,0];for(const n of cbBots()){if(!cbFighting(n)||!n.combat.aware||n.combat.state==='flee')continue;const g=cbBotGun(n);cbPlayerPoints().forEach((p,i)=>{if(!ex[i]&&!rwSightBlock(g,g.z,p,p.z))ex[i]=1;});}CB.exposure=ex;}
  if(CB.state!=='live')return;
  const o=CB.cfg.objective;if(o?.kind==='reach'&&P.edge&&P.edge.id===o.doneEdge&&P.s>P.edge.len*.5)cbFinish('won'); /* past the middle of the doorway piece = through the EXIT */
  const so=CB.cfg.sideObjective;if(so?.kind==='clearGroup'&&!CB.side.done){const door=so.door?rwDoor(so.door):null;if(!CB.side.active&&door?.open){CB.side.active=true;cbSay(so.label+' — '+(cbBots().filter(n=>n.combat.group===so.group&&cbLive(n)).length)+' inside',3000);}
    if(CB.side.active&&cbBots().filter(n=>n.combat.group===so.group&&cbFighting(n)).length===0){CB.side.done=true;CB.score+=300;cbRecord('sideObjective',{group:so.group});cbSay('AMBUSH SURVIVED · +300',3000);}}
}
function cbFinish(how){
  CB.state=how;const bots=cbBots(),pl=CB.pl;if(how==='won')CB.score+=CB.cfg.score?.exit||500;cbRecord(how==='won'?'exitReached':'playerDown',{actor:'player'});
  CB.results={how,seconds:+CB.t.toFixed(1),score:CB.score,shots:pl.shots,landed:pl.landed,head:pl.head,legs:pl.legs,accuracy:pl.shots?Math.round(100*pl.landed/pl.shots):0,timesHit:pl.hits,lifeLeft:pl.life,
    bots:bots.map(n=>({id:n.id,name:n.name,temper:n.combat.temper,side:n.combat.side,intent:n.combat.intent,end:n.combat.down?'down':n.combat.state,hp:n.combat.hp,fired:n.combat.fired,hitYou:n.combat.hitsOnYou}))};
  RW.in={};rwSay(how==='won'?'EXIT REACHED — room clear. Enter restarts.':'YOU ARE DOWN — Enter restarts.',8000);
}
// ------------------------------------------------------------------ shots: one resolver for both sides
// An attempt is validated (ready? ammo? alive?), then resolved: your shots by the crosshair ray against the bot cards,
// bot shots by a dice roll weighted by distance and by how many of your points they actually see. Both produce the same
// kind of result record and both go through cbApplyHit.
function cbShoot(){
  if(!CB.on)return false;const pl=CB.pl;if(CB.state!=='live')return true;
  if(pl.reload>0||pl.fireT>0)return true;if(pl.unsteady>0){cbSay('Not ready',500);return true;}
  if(pl.ammo<=0){cbReload();return true;}
  const c=rwCam(),ray=rwAimRay();const attempt=cbRecord('attempt',{actor:'player',verb:'shoot',from:[+c.x.toFixed(2),+c.y.toFixed(2),+c.z.toFixed(2)]});
  pl.ammo--;pl.shots++;RW.stats.shots++;pl.fireT=pl.fireInterval;pl.anim={kind:'fire',t:0,dur:(CB.weapon.fire?.length||9)/(CB.weapon.fireFps||24)};CB.noise={x:c.x,y:c.y,story:c.story,t:CB.t,by:'player'};
  pl.kick+=pl.recoil;RW.pl.pitch=C.clamp(RW.pl.pitch+pl.recoil,-RW.settings.lookDown,RW.settings.lookUp); /* the shot went where the crosshair was; the kick comes after */
  let best=null;for(const n of cbBots()){if(!cbLive(n)||!n.onScreen||!n.cards)continue;const h=rwCardsHit(n,ray);if(h&&(!best||h.depth<best.depth))best={n,...h};}
  if(best){const n=best.n,floor=rwActorFloor(n),blk=rwSightBlock(c,c.z,{x:n.x,y:n.y},best.z);
    if(blk){RW.stats.blockedShots++;CB.sparks.push({x:n.x,y:n.y,z:best.z,t:0,life:.25,hit:false});cbRecord('shotBlocked',{actor:'player',attempt:attempt.id,target:n.id,by:blk});cbSay('Blocked by '+blk,1200);cbAlertNoise();return true;}
    const card=n.cards.body,rel=(best.z-floor-card.z)/card.h,part=best.part==='head'||rel>.85?'head':rel<.48?'legs':'body'; /* zones by height on the card: top 15 % head, bottom 48 % legs */
    cbApplyHit(n,part,best.z,{actor:'player',attempt:attempt.id,dist:+rwDist(n,c).toFixed(1)});cbAlertNoise();return true;} /* a hit is as loud as a miss */
  // a miss: did it whistle past someone? (warning shot — a near miss makes the target unsteady and tells it you are there)
  let near=null;for(const n of cbBots()){if(!cbLive(n))continue;const q=cbBotPoints(n)[1],t=(q.x-ray.x)*ray.dx+(q.y-ray.y)*ray.dy;if(t<.5)continue;const px=ray.x+ray.dx*t,py=ray.y+ray.dy*t,pz=ray.z+ray.dz*t,d=Math.hypot(px-q.x,py-q.y,pz-q.z);if(d<1.4&&!rwSightBlock(c,c.z,{x:px,y:py},pz)&&(!near||d<near.d))near={n,d};}
  if(near){const n=near.n,T=cbTemper(n);cbRecord('nearMiss',{actor:'player',attempt:attempt.id,target:n.id,d:+near.d.toFixed(2)});cbUnsteady(n,1.2,'near miss');cbWake(n,'near miss',{heard:{x:c.x,y:c.y,story:c.story}});
    if(T.warningShotFlees||T.fleesOnSight){n.combat.scared=true;cbSay(n.name+' panics',1500);}else cbSay('Warning shot — '+n.name+' knows you are here',1500);}
  else{cbRecord('miss',{actor:'player',attempt:attempt.id});cbSay('Miss',600);}
  cbAlertNoise();return true;
}
function cbReload(){const pl=CB.pl;if(pl.reload>0||pl.ammo===pl.mag)return;pl.reload=pl.reloadTime;pl.anim={kind:'reload',t:0,dur:pl.reloadTime};cbRecord('attempt',{actor:'player',verb:'reload'});cbSay('Reloading…',900);}
function cbAlertNoise(){const c=rwCam();for(const n of cbBots()){if(!cbLive(n)||n.combat.aware)continue;if(rwDist(n,c)<22)cbWake(n,'gunfire',{heard:{x:c.x,y:c.y,story:c.story}});}}
function cbUnsteady(n,secs,why){const c=n.combat;if(!cbLive(n))return;c.unsteadyT=Math.max(c.unsteadyT,secs);c.readyT=Math.max(c.readyT,secs*.8);cbRecord('unsteady',{actor:n.id,secs,why});}
// the one place a hit lands, whoever fired it
function cbApplyHit(n,part,z,cause){
  const c=n.combat,pl=CB.pl,S=CB.cfg.score||{};pl.landed++;RW.stats.hits++;CB.sparks.push({x:n.x,y:n.y,z,t:0,life:.3,hit:true});
  const before=c.hp;cbWake(n,'hit',{seen:true});
  if(c.state==='surrender')c.hp=0;
  if(part==='head'){c.hp=0;pl.head++;CB.score+=S.headHit||300;}
  else if(part==='legs'){if(!c.disabled){c.disabled=true;pl.legs++;CB.score+=S.legsDisable||150;}else c.hp--;}
  else{c.hp--;CB.score+=S.bodyHit||100;}
  c.flinchT=cbTemper(n).flinch||.6;c.readyT=Math.max(c.readyT,c.flinchT+.3);n.combatSink=0;c.sink=0;
  const rec=cbRecord('hit',{actor:cause.actor,attempt:cause.attempt,target:n.id,part,hpBefore:before,hpAfter:Math.max(0,c.hp),dist:cause.dist});
  if(c.hp<=0){cbDown(n,rec.id);cbSay('HIT '+n.name+(part==='head'?' (head)':'')+' at '+cause.dist+' m — down',1800);}
  else if(part==='legs')cbSay('HIT '+n.name+' (legs) at '+cause.dist+' m — disabled',1800);
  else cbSay('HIT '+n.name+' at '+cause.dist+' m',1200);
}
function cbDown(n,causeId){const c=n.combat;c.down=true;c.state='down';c.intent='down';c.aware=false;n.combatSink=0;c.sink=0;c.flinchT=0;if(c.node&&c.node.occ===n.id)c.node.occ=null;n.moving=false;n.speed=0;cbRecord('down',{actor:n.id,cause:causeId});}
// waking up: what the bot learns depends on HOW it noticed you (sight = where you are; sound = where the sound was; a friend = what the friend knew)
function cbWake(n,why,info={}){const c=n.combat;if(c.down)return;const p=rwPlayerPos();
  if(info.seen||why==='sight'||why==='hit'||why==='test')c.know.seenPlayer={x:p.x,y:p.y,story:p.story,t:CB.t};
  if(info.heard)c.know.heard={...info.heard,t:CB.t,what:why};
  if(c.aware)return;c.aware=true;c.alertAt=null;c.target='player';if(c.state==='unaware'){c.state='alert';c.intent='engage';}c.timer=cbRand(.8,1.5);cbRecord('aware',{actor:n.id,why,knows:c.know.seenPlayer?'position':c.know.heard?'direction':'nothing'});
  for(const m of cbBots()){if(m===n||!cbLive(m)||m.combat.aware||m.combat.group!==c.group)continue;if(rwDist(m,n)<14&&!m.combat.alertAt){m.combat.alertAt=CB.t+cbRand(.5,1.4);m.combat.alertFrom=n.id;}}}
// a bot's best guess of where you are: a recent sighting, else the last sound, else nothing (it waits at its spot)
function cbGuess(n){const k=n.combat.know;if(k.seenPlayer&&CB.t-k.seenPlayer.t<8)return k.seenPlayer;if(k.heard&&CB.t-k.heard.t<20)return k.heard;return null;}
// ------------------------------------------------------------------ bots: perception
function cbBotSees(n){
  const c=n.combat,T=cbTemper(n),p=rwPlayerPos(),d=rwDist(n,p);if(d>(T.notice||24))return false;
  if(!c.aware){const rel=Math.abs(rwWrap(C.heading(n,p)-n.facing));if(rel>75)return false;}
  return cbBotSeesPoints(n).length>0;
}
function cbFreeCoverNodes(n){const story=rwActorStory(n);return RW.nodes.filter(nd=>(nd.story??0)===story&&nd.types?.includes('bot')&&nd.types.includes('cover')&&(!nd.occ||nd.occ===n.id)&&nd.occ!=='player');}
function cbPathClear(n,q){const fa=rwActorFloor(n),fb=C.storyElevation(project,q.story??rwActorStory(n));return !rwSightBlock({x:n.x,y:n.y},fa+1,{x:q.x,y:q.y},fb+1)&&!rwSightBlock({x:n.x,y:n.y},fa+.3,{x:q.x,y:q.y},fb+.3);}
function cbPickCover(n,{avoidCurrent=true}={}){
  const p=cbGuess(n)||rwPlayerPos(),c=n.combat;let best=null,bs=-1e9;
  for(const nd of cbFreeCoverNodes(n)){if(avoidCurrent&&nd===c.node)continue;if(!cbPathClear(n,nd))continue;const d=rwDist(n,nd);if(d>11)continue;
    const facing=Math.abs(rwWrap(C.heading(nd,p)-(nd.facing||0))),toward=rwDist(nd,p);let s=-d*.6-(facing>100?6:0)-(toward<3?8:0)+(nd.coverHeight&&nd.coverHeight<2?3:0);if(s>bs){bs=s;best=nd;}}
  return best;
}
function cbPickExit(n){const story=rwActorStory(n),p=rwPlayerPos();let best=null,bd=1e9;
  for(const nd of RW.nodes){if((nd.story??0)!==story||!nd.types?.includes('exit'))continue;const d=rwDist(n,nd)+(rwDist(nd,p)<2.5?20:0);if(d<bd){bd=d;best=nd;}}
  if(!best)return null;const vias=(best.via||[]).map(v=>({x:v.x,y:v.y,story})).filter(v=>cbPathClear(n,v)),path=[];
  if(!cbPathClear(n,best)){if(vias.length){vias.sort((a,b)=>rwDist(n,a)-rwDist(n,b));path.push(vias[0]);}}
  path.push({x:best.x,y:best.y,story,node:best});if(best.beyond)path.push({x:best.beyond.x,y:best.beyond.y,story,beyond:true});
  return {node:best,path};
}
function cbSinkFor(nd){return nd?.coverHeight?C.clamp(nd.coverHeight-.55,0,.6):0;}
function cbFace(n,target,dt,rate=260){if(target)rwTurnTo(n,C.heading(n,target),dt,rate);}
function cbEnterPeek(n){const c=n.combat,T=cbTemper(n);c.state='peek';c.intent='engage';c.timer=cbRand(...(T.peek||[.9,1.6]));c.burst=Math.round(cbRand(...(T.burst||[1,2])));c.readyT=Math.max(c.readyT,T.aimTime??.6);c.fireT=0;} /* readyT = the visible wind-up: gun up, then the first shot */
function cbEnterCover(n,secs){const c=n.combat;c.state=c.node?.coverHeight&&c.node.coverHeight<2.5?'cover':'peek';c.intent='engage';c.timer=secs;if(c.state==='peek'){c.burst=Math.round(cbRand(...(cbTemper(n).burst||[1,2])));c.readyT=Math.max(c.readyT,secs);c.fireT=0;}} /* no cover to duck behind: the bot lowers its gun for `secs` instead, then fires again */
// ------------------------------------------------------------------ bots: the brain
function cbNpcStep(n,dt){
  const c=n.combat,T=cbTemper(n),p=rwPlayerPos();n.moving=false;n.speed=0;
  if(c.down){c.tilt=Math.min(1.5,c.tilt+dt*4.2);return;}
  if(c.state==='gone'){n.state='hidden';n.onScreen=false;return;}
  c.readyT=Math.max(0,c.readyT-dt);c.unsteadyT=Math.max(0,c.unsteadyT-dt);
  if(c.flinchT>0){c.flinchT-=dt;cbFace(n,cbGuess(n),dt);if(c.flinchT<=0)cbAfterFlinch(n);return;}
  if(CB.state!=='live'){cbFace(n,cbGuess(n),dt,120);return;}
  if(!c.aware){
    if(c.alertAt!=null&&CB.t>=c.alertAt){const f=cbBot(c.alertFrom);cbWake(n,'alarm',{heard:f?.combat.know.seenPlayer||f?.combat.know.heard||{x:f?f.x:n.x,y:f?f.y:n.y,story:rwActorStory(n)}});}
    else if(c.wake&&/^door:/.test(c.wake)&&rwDoor(c.wake.slice(5))?.open&&rwDist(n,p)<16){const o=rwDoor(c.wake.slice(5)),l=C.openingLine(project,o),m=C.wallPoint(l,(l.start+l.end)/2);cbWake(n,'door',{heard:{x:m.x,y:m.y,story:rwActorStory(n)}});}
    else if(CB.noise&&(CB.noise.story===rwActorStory(n)||rwDist(n,CB.noise)<12)&&rwDist(n,CB.noise)<22)cbWake(n,'gunfire',{heard:{x:CB.noise.x,y:CB.noise.y,story:CB.noise.story}});
    else if(cbBotSees(n))cbWake(n,'sight');
  }
  const hostile=c.hostileTo.includes('player'),sees=c.aware&&hostile?cbBotSeesPoints(n):[];if(sees.length){c.know.seenPlayer={x:p.x,y:p.y,story:p.story,t:CB.t};}
  if(c.reloadT>0){c.reloadT-=dt;if(c.reloadT<=0){c.ammo=T.magazine;cbRecord('reloaded',{actor:n.id});}}
  const guess=cbGuess(n);
  switch(c.state){
    case 'unaware':{n.combatSink=0;c.sink=0;rwTurnTo(n,c.node?.facing??n.facing,dt,90);break;}
    case 'alert':{n.combatSink=0;c.sink=0;cbFace(n,guess,dt);c.timer-=dt;
      if(c.timer<=0){if(!hostile){c.state='hold';c.intent='hold';break;}if(T.fleesOnSight||c.scared){cbStartFlee(n);break;}if(c.node?.coverHeight&&c.node.coverHeight<2.5){c.state='cover';c.timer=cbRand(.3,.8);}else cbEnterPeek(n);}
      break;}
    case 'hold':{n.combatSink=0;c.sink=0;cbFace(n,guess,dt,160);if(c.scared)cbStartFlee(n);break;} /* aware, armed, not shooting: the input point for a later negotiation result */
    case 'cover':{c.sink=cbSinkFor(c.node);n.combatSink+=C.clamp(c.sink-n.combatSink,-2*dt,2*dt);cbFace(n,guess,dt,200);c.timer-=dt;
      if(c.scared){cbStartFlee(n);break;}
      const seen=cbPlayerSeesPoints(n).length;c.exposedT=seen>=2?c.exposedT+dt:Math.max(0,c.exposedT-dt); /* cover blown: you can see most of a ducked bot */
      if(c.exposedT>1.1){const nd=cbPickCover(n);if(nd){cbGoTo(n,nd,'relocate');break;}c.exposedT=0;}
      if(c.timer<=0){if(c.ammo<=0&&c.reloadT<=0){c.reloadT=T.reload;c.timer=T.reload;break;}cbEnterPeek(n);}
      break;}
    case 'peek':{n.combatSink+=C.clamp(0-n.combatSink,-2.5*dt,2.5*dt);c.sink=n.combatSink;cbFace(n,guess,dt);c.timer-=dt;c.fireT-=dt;
      if(c.scared){cbStartFlee(n);break;}
      if(sees.length&&c.readyT<=0&&c.unsteadyT<=0&&c.fireT<=0&&c.burst>0&&c.ammo>0){cbBotFire(n,sees);c.burst--;c.fireT=cbRand(...(T.fireInterval||[1,1.6]))*.8;}
      if(!sees.length&&CB.t-(c.know.seenPlayer?.t??-99)>2.5){c.state='search';c.timer=4;break;}
      if(c.timer<=0||c.burst<=0||c.ammo<=0){cbEnterCover(n,cbRand(...(T.duck||[1.2,2.6])));if(c.ammo<=0)c.reloadT=T.reload;}
      if(c.temper==='skittish'&&c.fired>=c.shotsBeforeFlee)cbStartFlee(n);
      break;}
    case 'search':{n.combatSink+=C.clamp(0-n.combatSink,-2.5*dt,2.5*dt);c.sink=n.combatSink;cbFace(n,guess,dt,120);c.timer-=dt;
      if(sees.length)cbEnterPeek(n);else if(c.timer<=0)cbEnterCover(n,cbRand(1,2));
      break;}
    case 'relocate':case 'flee':{const tgt=c.path?.[0];if(!tgt){if(c.state==='flee')cbGone(n);else cbEnterCover(n,.5);break;}
      n.combatSink+=C.clamp(0-n.combatSink,-3*dt,3*dt);c.sink=n.combatSink;const speed=(c.state==='flee'?2.7:2.2)*(c.unsteadyT>0?1.15:1); /* unsteady = a faster, sloppier scramble */
      if(rwStepToward(n,tgt,speed,dt)){const done=c.path.shift();
        if(done.node?.door){const o=rwDoor(done.node.door);if(o&&!o.open){o.open=true;GLE?.invalidate();rwBuildSight();liveRev++;cbRecord('doorOpened',{actor:n.id,door:o.id,name:o.name});}}
        if(done.beyond)cbGone(n);
        else if(!c.path.length&&c.state==='relocate'){const nd=c.target2;if(c.node&&c.node.occ===n.id)c.node.occ=null;c.node=nd;if(nd)nd.occ=n.id;n.facing=nd?.facing||n.facing;c.exposedT=0;cbRecord('relocated',{actor:n.id,spot:nd?.id});cbEnterCover(n,cbRand(.4,1));}}
      break;}
    case 'surrender':{n.combatSink=0;c.sink=0;cbFace(n,guess||p,dt,160);break;}
    case 'disabled':{n.combatSink+=C.clamp(.55-n.combatSink,-2*dt,2*dt);c.sink=n.combatSink;cbFace(n,guess,dt,100);break;}
  }
  c.intent=CB_INTENT_OF[c.state]||c.intent;
}
function cbGoTo(n,nd,why){const c=n.combat;c.path=[{x:nd.x,y:nd.y,story:nd.story??0}];c.target2=nd;c.state=why;if(c.node&&c.node.occ===n.id&&c.node!==nd)c.node.occ=null;nd.occ=n.id;cbRecord('attempt',{actor:n.id,verb:why,spot:nd.id});}
function cbGone(n){const c=n.combat;c.state='gone';c.intent='escape';n.state='hidden';if(c.node&&c.node.occ===n.id)c.node.occ=null;CB.score+=CB.cfg.score?.flee||50;cbSay(n.name+' got away',1500);cbRecord('escaped',{actor:n.id});}
function cbStartFlee(n){const c=n.combat,ex=cbPickExit(n);c.scared=false;if(!ex){cbEnterCover(n,1);return;}if(c.node&&c.node.occ===n.id)c.node.occ=null;c.node=null;c.path=ex.path;c.state='flee';c.intent='escape';cbSay(n.name+' runs for it',1500);cbRecord('attempt',{actor:n.id,verb:'flee',exit:ex.node.id});}
function cbAfterFlinch(n){const c=n.combat,ch=rwCharOf(n);
  if(c.disabled){if(ch?.states?.surrender&&!c.surrendered){c.surrendered=true;c.state='surrender';c.intent='surrender';CB.score+=CB.cfg.score?.surrender||200;cbSay(n.name+' gives up — hands up',2000);cbRecord('surrendered',{actor:n.id});}else{c.state='disabled';c.intent='disabled';}return;}
  if(c.temper==='runner'||c.hp<=(c.fleeBelowHp||0)||(c.temper==='skittish'&&c.hp<c.maxHp)){cbStartFlee(n);return;}
  if(c.state==='hold')return;cbEnterCover(n,cbRand(.6,1.4));
}
// a bot's shot at you: a dice roll weighted by distance and by how much of you it can actually see
function cbBotFire(n,seen){
  const c=n.combat,T=cbTemper(n),P=RW.pl,pl=CB.pl,g=cbBotGun(n),cam=rwCam(),d=rwDist(n,cam);if(c.ammo<=0||c.readyT>0||c.unsteadyT>0)return null;
  const attempt=cbRecord('attempt',{actor:n.id,verb:'shoot',target:'player',sees:seen.map(s=>s.name)});c.ammo--;c.fired++;RW.stats.botShots=(RW.stats.botShots||0)+1;
  const moving=Math.abs(P.vAlong)>1.9?.7:1,crouch=P.crouch?.85:1,chance=(T.accuracy||.4)*C.clamp(1.05-d/28,.15,.85)*(seen.length/3)*moving*crouch,grace=CB.t-CB.lastHit<(CB.cfg.player?.hitGrace??1.2),hit=!grace&&RW.rng()<chance;
  const hand=cbHandWorld(n)||g;CB.flashes.push({x:hand.x,y:hand.y,z:hand.z,t:0,life:.12,size:.55});CB.noise={x:n.x,y:n.y,story:rwActorStory(n),t:CB.t,by:n.id};
  let end;if(hit){const pt=seen[Math.floor(RW.rng()*seen.length)];end={x:pt.x,y:pt.y,z:pt.z,name:pt.name};}else{const b=C.basis(C.heading(n,cam)),side=(RW.rng()<.5?-1:1)*cbRand(.35,1.1);end={x:cam.x+b.fx*1.5+b.rx*side,y:cam.y+b.fy*1.5+b.ry*side,z:cam.z+cbRand(-.6,.5)};}
  CB.tracers.push({a:hand,b:end,t:0,life:.09,hit});
  if(hit){CB.lastHit=CB.t;pl.life--;pl.hits++;c.hitsOnYou++;pl.hitFlash=1;pl.unsteady=Math.max(pl.unsteady,CB.cfg.player?.unsteadyAfterHit??.8);cbRecord('hit',{actor:n.id,attempt:attempt.id,target:'player',part:end.name,chance:+chance.toFixed(2),lifeAfter:pl.life});cbSay('Hit by '+n.name+(seen.length<3?' (only partly covered)':''),1200);if(pl.life<=0)cbFinish('down');}
  else{cbRecord(grace?'graceMiss':'miss',{actor:n.id,attempt:attempt.id,target:'player',chance:+chance.toFixed(2)});if(!grace&&RW.rng()<.5){pl.unsteady=Math.max(pl.unsteady,.35);}} /* a near miss rattles you for a moment too */
  return attempt;
}
function cbHandWorld(n){const k=n.cards;if(!k)return null;const card=k.body,fr=card.fr;if(!fr?.hand)return null;const floor=rwActorFloor(n),b=C.basis(card.yaw),u=fr.hand[0]/fr.w,v=fr.hand[1]/fr.h,l=(u-.5)*card.w*(card.mir?-1:1);
  return {x:card.x+(-b.rx)*l,y:card.y+(-b.ry)*l,z:floor+card.z+(1-v)*card.h};}
// debug preset: change an NPC's intent without changing who it is (the input point for a later social result). Not persuasion.
function cbSetIntent(id,intent){const n=cbBot(id);if(!n||!cbLive(n))return false;const c=n.combat;cbRecord('intentSet',{actor:id,intent,by:'debug'});
  if(intent==='hold'){c.aware=true;c.state='hold';c.intent='hold';c.target=null;c.scared=false;return true;}
  if(intent==='engage'){c.aware=true;c.target='player';c.hostileTo=['player'];cbEnterCover(n,.3);return true;}
  if(intent==='escape'){c.aware=true;cbStartFlee(n);return true;}
  if(intent==='surrender'){c.surrendered=true;c.state='surrender';c.intent='surrender';return true;}
  return false;}
// ------------------------------------------------------------------ hooks: pose, mesh, keys (presentation follows state)
function cbPose(n,ch){const c=n.combat,S=ch.states;if(!c)return null;
  if(c.down)return S.flinch?'flinch':'stand';if(c.flinchT>0)return S.flinch?'flinch':'stand';
  if(c.state==='surrender')return S.surrender?'surrender':'guard';
  if(c.state==='flee'||c.state==='relocate')return n.moving&&S.flee?'flee':'guard';
  if(c.unsteadyT>0&&!n.moving)return S.flinch?'flinch':'guard';
  if(c.state==='peek')return S.aim?'aim':'guard';
  return S.guard?'guard':'stand';}
function cbMeshPost(n,body,head,shadow){const c=n.combat;if(!c)return;
  if(c.down){body.rotation.order='YXZ';body.rotation.x=-c.tilt;body.position.y+=.06;head.visible=false;if(shadow)shadow.scale.set(1.6,1,.9);}
  else if(body.rotation.x!==0)body.rotation.x=0;}
function cbKey(e){if(!CB.on)return false;
  if(e.code==='KeyX'){if(CB.state==='live')cbReload();return true;} /* X = reload; Q/R keep their project meaning (body turns) */
  if(e.code==='Enter'||e.code==='NumpadEnter'){if(CB.state!=='live')cbRestart();return true;}
  return false;}
// ------------------------------------------------------------------ drawing: tracers, flashes, pistol, HUD
function cbProject(v,p){return C.fpPoint(v,{x:p.x,y:p.y,floorZ:0},p.z);}
function cbOverlay(g,v,k){
  if(!CB.on)return false;const W=v.width,H=v.height,pl=CB.pl,cx=W/2;
  if(RW.hud&&!RW.hud.classList.contains('combat'))RW.hud.classList.add('combat');
  for(const t of CB.tracers){const a=cbProject(v,t.a),b=cbProject(v,t.b);if(!a||!b||a.depth<.3||b.depth<.3)continue;g.save();g.globalAlpha=1-t.t/t.life;g.strokeStyle=t.hit?'#ffd27a':'#ffe9b0';g.lineWidth=2.2*k;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.restore();}
  for(const f of CB.flashes){const q=cbProject(v,f);if(!q||q.depth<.3)continue;const r=f.size*q.scale*(1-f.t/f.life*.5);g.save();g.globalAlpha=1-f.t/f.life;const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,r);gr.addColorStop(0,'#fff8d0');gr.addColorStop(.35,'#ffb347');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,r,0,Math.PI*2);g.fill();g.restore();}
  for(const s of CB.sparks){const q=cbProject(v,s);if(!q||q.depth<.3)continue;g.save();g.globalAlpha=1-s.t/s.life;g.strokeStyle=s.hit?'#ff5d5d':'#ffffff';g.lineWidth=2*k;const r=(s.hit?.16:.1)*q.scale+3*k;for(let i=0;i<5;i++){const a=i/5*Math.PI*2+s.t*20;g.beginPath();g.moveTo(q.x+Math.cos(a)*r*.3,q.y+Math.sin(a)*r*.3);g.lineTo(q.x+Math.cos(a)*r,q.y+Math.sin(a)*r);g.stroke();}g.restore();}
  cbDrawWeapon(g,v,k);
  if(pl.hitFlash>0){g.save();g.globalAlpha=Math.min(.75,pl.hitFlash*.75);const gr=g.createRadialGradient(cx,H*.5,H*.25,cx,H*.5,H*.8);gr.addColorStop(0,'rgba(255,40,40,0)');gr.addColorStop(1,'rgba(255,30,30,.9)');g.fillStyle=gr;g.fillRect(0,0,W,H);g.restore();}
  cbDrawHud(g,v,k);
  if(CB.state!=='live')cbDrawResults(g,v,k);
  return true;
}
function cbDrawWeapon(g,v,k){
  const w=CB.weapon,img=w?.img,pl=CB.pl,W=v.width,H=v.height;if(!img||!img.complete||!img.naturalWidth)return;
  const S=H*.64,cols=w.columns||10,fw=w.frameW||180,fh=w.frameH||180;let frame=0,dy=0;
  if(pl.anim?.kind==='fire'){const seq=w.fire||[1,2,3,4,5,6,7,8,9],i=Math.min(seq.length-1,Math.floor(pl.anim.t*(w.fireFps||24)));frame=seq[i];}
  else if(pl.anim?.kind==='reload'){const u=pl.anim.t/pl.anim.dur;dy=S*.55*Math.sin(Math.min(1,u)*Math.PI);frame=0;}
  else{const seq=w.idle||[0],i=Math.floor(CB.t*(w.idleFps||4))%seq.length;frame=seq[i];}
  if(pl.unsteady>0&&!pl.anim)dy+=S*.12*Math.min(1,pl.unsteady/.8); /* not ready: the gun sits low until you steady it */
  const sx=(frame%cols)*fw,sy=Math.floor(frame/cols)*fh,bob=Math.sin(RW.pl.bobPhase||0)*H*.008;
  const x=W*.80-S,y=H-S+H*.05+dy+bob;g.save();g.imageSmoothingEnabled=false;g.drawImage(img,sx,sy,fw,fh,x,y,S,S);g.restore();
}
function cbText(g,txt,x,y,{size=14,color=CB_COLORS.white,align='left',weight=700,font='Consolas, "Courier New", monospace',glow=null,k=1}={}){g.save();g.font=`${weight} ${size*k}px ${font}`;g.textAlign=align;g.textBaseline='middle';if(glow){g.shadowColor=glow;g.shadowBlur=10*k;}g.fillStyle=color;g.fillText(txt,x,y);g.restore();}
function cbPanel(g,x,y,w,h,k){g.save();g.fillStyle='rgba(8,5,12,.78)';g.strokeStyle=CB_COLORS.pink;g.lineWidth=1.2*k;g.beginPath();g.roundRect(x,y,w,h,4*k);g.fill();g.stroke();g.restore();}
function cbDrawHud(g,v,k){
  const W=v.width,H=v.height,pl=CB.pl,cfg=CB.cfg,cx=W/2,cy=H*RW_AIM_Y,ready=cbPlayerReady();
  // crosshair: red ring when ready, grey when the weapon is not ready (reloading, unsteady, empty)
  g.save();g.strokeStyle=ready?'rgba(255,60,60,.95)':'rgba(170,170,170,.8)';g.lineWidth=1.6*k;const r=11*k;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();g.beginPath();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){g.moveTo(cx+dx*(r+3*k),cy+dy*(r+3*k));g.lineTo(cx+dx*(r+10*k),cy+dy*(r+10*k));}g.stroke();g.fillStyle=ready?'rgba(255,60,60,.95)':'rgba(170,170,170,.8)';g.beginPath();g.arc(cx,cy,1.6*k,0,Math.PI*2);g.fill();g.restore();
  if(!ready&&CB.state==='live')cbText(g,pl.reload>0?'RELOADING':pl.unsteady>0?'NOT READY':pl.ammo<=0?'EMPTY — X':'',cx,cy+22*k,{size:10,color:'#d0d0d0',align:'center',k});
  g.save();g.strokeStyle='rgba(255,63,164,.55)';g.lineWidth=2*k;g.strokeRect(1*k,1*k,W-2*k,H-2*k);g.restore();
  cbText(g,'TRAPSTAR',16*k,22*k,{size:22,color:CB_COLORS.pink,weight:900,font:'Impact, "Arial Black", sans-serif',glow:CB_COLORS.pink,k});
  const o=cfg.objective||{};const label=CB.side.active&&!CB.side.done?(cfg.sideObjective?.label||o.label):o.label||'';
  cbText(g,'APT. 305',cx,16*k,{size:15,color:CB_COLORS.cyan,align:'center',weight:900,glow:CB_COLORS.cyan,k});cbText(g,label,cx,34*k,{size:12,color:CB_COLORS.pink,align:'center',glow:CB_COLORS.pink,k});
  const mm=Math.floor(CB.t/60),ss=Math.floor(CB.t%60);cbText(g,'SCORE',W-150*k,16*k,{size:11,color:'#b89cb0',align:'right',k});cbText(g,String(CB.score).padStart(8,'0'),W-16*k,16*k,{size:15,color:CB_COLORS.cyan,align:'right',glow:CB_COLORS.cyan,k});
  cbText(g,'TIME',W-150*k,36*k,{size:11,color:'#b89cb0',align:'right',k});cbText(g,`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,W-16*k,36*k,{size:15,color:CB_COLORS.pink,align:'right',glow:CB_COLORS.pink,k});
  const bx=16*k,by=H-30*k;cbPanel(g,bx-6*k,by-16*k,200*k,34*k,k);cbText(g,'AMMO',bx,by,{size:11,color:'#b89cb0',k});
  for(let i=0;i<pl.mag;i++){const x=bx+48*k+i*16*k,full=i<pl.ammo;g.save();g.fillStyle=full?CB_COLORS.gold:'rgba(120,100,60,.35)';g.beginPath();g.roundRect(x,by-9*k,8*k,18*k,[4*k,4*k,1.5*k,1.5*k]);g.fill();if(full){g.fillStyle='#8c6a1e';g.fillRect(x,by+4*k,8*k,4*k);}g.restore();}
  if(pl.reload>0)cbText(g,'RELOADING',bx+150*k,by,{size:10,color:CB_COLORS.pink,k});
  const rx=W-16*k;cbPanel(g,rx-250*k,by-16*k,256*k,34*k,k);cbText(g,'LIFE',rx-240*k,by,{size:11,color:'#b89cb0',k});
  for(let i=0;i<Math.min(10,pl.maxLife);i++){const x=rx-200*k+i*18*k;g.save();g.fillStyle=i<pl.life?CB_COLORS.pink:'rgba(120,40,90,.35)';g.fillRect(x,by-7*k,14*k,14*k);g.restore();}
  cbText(g,'COVER',rx-120*k,by,{size:11,color:'#b89cb0',k});const names=['H','C','L'];
  for(let i=0;i<3;i++){const x=rx-66*k+i*20*k,hid=!CB.exposure[i];g.save();g.fillStyle=hid?CB_COLORS.cyan:'rgba(40,60,70,.35)';g.strokeStyle=hid?CB_COLORS.cyan:CB_COLORS.red;g.lineWidth=1.2*k;g.beginPath();g.roundRect(x,by-7*k,14*k,14*k,2*k);g.fill();g.stroke();g.restore();cbText(g,names[i],x+7*k,by,{size:9,color:hid?'#0b2a33':'#ff8080',align:'center',k});}
  if(RW.pl.crouch)cbText(g,'CROUCHED',rx-120*k,by-24*k,{size:9,color:CB_COLORS.cyan,k});
  const live=cbBots().filter(cbFighting).length;cbText(g,`HOSTILES ${live}`,cx,52*k,{size:11,color:live?CB_COLORS.red:'#7fe0a0',align:'center',glow:live?CB_COLORS.red:'#7fe0a0',k});
  if(CB.msg&&CB.t<CB.msgT)cbText(g,CB.msg,cx,cy+36*k,{size:12,color:CB_COLORS.white,align:'center',glow:'#000',k});
  if(RW.settings.debug>=1){let y=64*k;for(const n of cbBots()){const c=n.combat,kn=c.know;cbText(g,`${n.name} [${c.side}/${c.role}] ${c.down?'down':c.state} · intent ${c.intent}${c.aware?' · aware':''} · hp ${c.hp} · ammo ${c.ammo} · fired ${c.fired}${c.readyT>0?' · winding up':''}${c.unsteadyT>0?' · UNSTEADY':''} · knows ${kn.seenPlayer&&CB.t-kn.seenPlayer.t<8?'your position':kn.heard?'a sound ('+kn.heard.what+')':'nothing'} · you see ${cbLive(n)?cbPlayerSeesPoints(n).length:0}/3 · it sees ${cbLive(n)&&c.aware?cbBotSeesPoints(n).length:0}/3`,16*k,y,{size:9,color:'#d9e3ea',weight:400,k});y+=12*k;}}
}
function cbDrawResults(g,v,k){
  const W=v.width,H=v.height,r=CB.results;if(!r)return;const w=440*k,h=(230+r.bots.length*14)*k,x=W/2-w/2,y=H*.5-h/2;
  g.save();g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,0,W,H);g.restore();cbPanel(g,x,y,w,h,k);
  cbText(g,r.how==='won'?'EXIT REACHED · ROOM CLEAR':'YOU ARE DOWN',W/2,y+22*k,{size:18,color:r.how==='won'?CB_COLORS.cyan:CB_COLORS.red,align:'center',weight:900,glow:r.how==='won'?CB_COLORS.cyan:CB_COLORS.red,k});
  const lines=[`time ${r.seconds}s · score ${r.score}`,`shots ${r.shots} · landed ${r.landed} (${r.accuracy}%) · head ${r.head} · legs ${r.legs}`,`times hit ${r.timesHit} · life left ${r.lifeLeft}`,'',...r.bots.map(b=>`${b.name} (${b.temper}, ${b.side}): ${b.end} · fired ${b.fired} · hit you ${b.hitYou}`),'','Enter = restart · Esc = leave'];
  lines.forEach((t,i)=>cbText(g,t,W/2,y+50*k+i*15*k,{size:11,color:'#e8dce4',align:'center',weight:400,k}));
}
EXT.combat={CB,start:cbStart,stop:cbStop,restart:cbRestart,shoot:cbShoot,reload:cbReload,setIntent:cbSetIntent,
  bots:()=>cbBots().map(n=>({id:n.id,name:n.name,role:n.combat.role,side:n.combat.side,temper:n.combat.temper,intent:n.combat.intent,target:n.combat.target,state:n.combat.down?'down':n.combat.state,aware:n.combat.aware,hp:n.combat.hp,ammo:n.combat.ammo,fired:n.combat.fired,readyT:+n.combat.readyT.toFixed(2),unsteadyT:+n.combat.unsteadyT.toFixed(2),know:{seenPlayer:n.combat.know.seenPlayer?{x:+n.combat.know.seenPlayer.x.toFixed(2),y:+n.combat.know.seenPlayer.y.toFixed(2),t:n.combat.know.seenPlayer.t}:null,heard:n.combat.know.heard?{x:+n.combat.know.heard.x.toFixed(2),y:+n.combat.know.heard.y.toFixed(2),what:n.combat.know.heard.what,t:n.combat.know.heard.t}:null},x:+n.x.toFixed(2),y:+n.y.toFixed(2),story:rwActorStory(n),sink:+(n.combatSink||0).toFixed(2),pose:n.pose,view:n.view,onScreen:!!n.onScreen,node:n.combat.node?.id||null,seesYou:cbLive(n)&&n.combat.aware?cbBotSeesPoints(n).length:0,youSee:cbLive(n)?cbPlayerSeesPoints(n).length:0})),
  player:()=>({...CB.pl,anim:CB.pl?.anim?.kind||null,ready:cbPlayerReady(),state:CB.state,score:CB.score,t:+CB.t.toFixed(2),exposure:CB.exposure.slice()}),events:()=>CB.events.slice(),results:()=>CB.results,
  /* test helpers */ wake:id=>{const n=cbBot(id);if(n)cbWake(n,'test');},hitBot:(id,part)=>{const n=cbBot(id);if(n)cbApplyHit(n,part||'body',rwActorFloor(n)+1.2,{actor:'test',attempt:null,dist:0});},
  botFire:id=>{const n=cbBot(id);if(n){const s=cbBotSeesPoints(n);if(s.length){n.combat.ammo=Math.max(1,n.combat.ammo);n.combat.readyT=0;n.combat.unsteadyT=0;cbBotFire(n,s);}return s.length;}return -1;},
  placeBot:(id,x,y,story)=>{const n=cbBot(id);if(!n)return false;if(n.combat.node&&n.combat.node.occ===n.id)n.combat.node.occ=null;n.combat.node=null;Object.assign(n,{x,y,story:Number.isInteger(story)?story:n.story});n.combatSink=0;n.combat.sink=0;return true;}};
