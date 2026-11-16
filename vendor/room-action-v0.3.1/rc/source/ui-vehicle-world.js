// ------------------------------------------------------------------ 0.16 Vehicle World adapter for Route Walk
/* When routeNet.vehicleLoop.runtime === "world", Route Walk hands traffic to RCVehicleWorld (vehicle-world.js):
   - each frame it sends the people (player + visible NPCs) and the presentation hints (which street ends are in view,
     25 m by default), then runs the world's fixed 1/240 s steps exactly like the older runtime did;
   - it mirrors the world's moving vehicles into RW.cars so the existing cards, labels, map and test hooks keep working;
   - parked vehicles are the room's own props, so they are not drawn twice;
   - signal heads are simple procedural placeholders whose lamps read the world's authoritative signal state.
   Nothing here decides traffic: the world is the only physical authority. */
function rwWorldInit(net,spec){
  const T=globalThis.RCRouteTraffic;RW.vehicleCfg=T.config(spec.config||{});
  const W=globalThis.RCVehicleWorld.create({routeNet:net,props:project.props,seed:(net.settings?.seed||1977)});
  RW.vehicleWorld=W;RW.vehicleLoop=true;RW.cars=[];RW.worldCarState=new Map();RW.carAcc=0;RW.carClock=0;RW.carSerial=0;RW.vwSeq=W.lastSeq();RW.vehicleEvents=[];
  RW.carContacts=new Set();RW.vehicleImpactKeys=new Set();rwWorldDisposeHeads();rwWorldMirror();return true;
}
function rwWorldBodies(){
  const out=[],P=RW.pl,W=RW.vehicleWorld;if(P&&P.edge&&!W?.query('isBodySuppressed','PLAYER')){const p=rwRoutePlayerPos(),e=P.edge,va=P.vAlong*P.dir,vs=P.vSide*P.dir;
    out.push({id:'PLAYER',kind:'player',x:+p.x.toFixed(3),y:+p.y.toFixed(3),story:p.story,vx:+(e.ux*va+e.rx*vs).toFixed(3),vy:+(e.uy*va+e.ry*vs).toFixed(3)});}
  for(const n of RW.npcs){if(n.state==='hidden')continue;const f=C.basis(n.facing||0),sp=n.moving?(n.speed||0):0;
    out.push({id:n.id,kind:'npc',x:+n.x.toFixed(3),y:+n.y.toFixed(3),story:rwActorStory(n),vx:+(f.fx*sp).toFixed(3),vy:+(f.fy*sp).toFixed(3)});}
  return out;
}
function rwWorldHints(){
  const W=RW.vehicleWorld,g=W.graph,cfg=W.config,vis=(id,dist)=>{const p=g.portals.get(id);return !!p&&rwVisible({x:p.x,y:p.y,story:p.story},{notice:dist});};
  return {watchedExits:g.exitPortals.filter(id=>vis(id,cfg.exitViewDistance)),visibleEntries:g.entryPortals.filter(id=>vis(id,cfg.entryViewDistance))};
}
function rwWorldPassengerCandidate(){
  const W=RW.vehicleWorld;if(!W||rwPlayerAboard())return null;const p=rwRoutePlayerPos();let best=null;
  for(const v of W.renderList()){const list=W.query('getVehicleAccessCandidates',v.id,p)||[];for(const c of list){if(!(c.accessKind==='interior_portal'||c.type==='passenger_door'))continue;if(!best||c.distance<best.distance)best=c;}}
  return best?.highlighted?best:null;
}
function rwWorldPlacePlayer(place,worldViewYaw=null){
  const P=RW.pl;if(!P||!place||!Number.isFinite(place.x)||!Number.isFinite(place.y))return false;const story=Number.isInteger(place.story)?place.story:0;let best=null;
  for(const e of RW.graph?.edges||[]){const sa=Number.isInteger(e.A.story)?e.A.story:0,sb=Number.isInteger(e.B.story)?e.B.story:sa;if(sa!==story||sb!==story)continue;const pr=rwProject(e,place),s=C.clamp(pr.s,0,e.len),bL=rwBandSide(e,s,-1),bR=rwBandSide(e,s,1),off=C.clamp(pr.off,-bL,bR),x=e.A.x+e.ux*s+e.rx*off,y=e.A.y+e.uy*s+e.ry*off,d=Math.hypot(place.x-x,place.y-y);if(!best||d<best.d)best={e,s,off,d};}
  if(!best)return false;const ref=Number.isFinite(worldViewYaw)?C.norm(worldViewYaw):Number.isFinite(place.heading)?C.norm(place.heading):best.e.hd,h0=C.norm(best.e.hd),h1=C.norm(best.e.hd+180),dir=Math.abs(rwWrap(ref-h0))<=Math.abs(rwWrap(ref-h1))?1:-1,move=dir>0?h0:h1;
  Object.assign(P,{edge:best.e,s:best.s,off:best.off,dir,bodyYaw:move,headYaw:C.clamp(rwWrap(ref-move),-RW.settings.lookYaw,RW.settings.lookYaw),bodyTurn:null,viewHold:ref,vAlong:0,vSide:0,stop:null,junctionLatch:null,junctionNeedsRelease:false});activeStory=story;return true;
}
function rwWorldTransitInteract(){
  const W=RW.vehicleWorld;if(!W)return false;const aboard=W.query('getInteriorActorState','PLAYER');
  if(aboard){const viewYaw=rwPlayerLookYaw(),r=W.alightTransitActor('PLAYER');if(!r.ok){rwSay(r.reason==='transit_door_closed'?'The automatic passenger door is closed. You can leave only while the bus is fully stopped in a transit bay.':'Cannot leave the bus here: '+String(r.reason||'access refused').replaceAll('_',' ')+'.',3600);return true;}if(!rwWorldPlacePlayer(r.place,viewYaw)){rwSay('The bus opened, but no authored pedestrian rail was available beside this stop.',4200);return true;}RW.in={};rwSay('Alighted through the automatic passenger door. The bus will close it before departing.',3200);renderLeft();rwUpdateHud();drawSoon();return true;}
  const c=rwWorldPassengerCandidate();if(!c)return false;if(!c.inRange){rwSay(`Passenger door ${c.distance.toFixed(1)} m away — walk to its marker. It opens automatically only in a transit bay.`,3000);return true;}if(!c.usable){const why=String(c.accessReason||'access refused').replaceAll('_',' ');rwSay(`Passenger door unavailable: ${why}. It cannot be opened manually.`,3400);return true;}
  const v=W.query('getVehicleState',c.vehicleId),base=v?.pose?.heading||0,worldBody=rwPlayerMoveYaw(),worldView=rwPlayerLookYaw(),r=W.boardTransitActor('PLAYER',c.vehicleId);if(!r.ok){rwSay('Could not board: '+String(r.reason||'access refused').replaceAll('_',' ')+'.',3400);return true;}
  RW.pl.bodyYaw=C.norm(worldBody-base);RW.pl.headYaw=C.clamp(rwWrap(worldView-(base+RW.pl.bodyYaw)),-RW.settings.lookYaw,RW.settings.lookYaw);RW.pl.bodyTurn=null;RW.pl.viewHold=worldView;RW.pl.vAlong=RW.pl.vSide=0;RW.pl.stop=null;for(const nd of RW.nodes)if(nd.occ==='player')nd.occ=null;rwSay('Aboard the bus. W/S move along the aisle, A/D move across it, and E alights only at an open transit stop.',4200);renderLeft();rwUpdateHud();drawSoon();return true;
}
function rwWorldStep(dt){
  const W=RW.vehicleWorld;W.setHints(rwWorldHints());W.setBodies(rwWorldBodies());
  RW.carAcc+=Math.min(.1,dt);const h=W.config.fixedStep;let n=0;while(RW.carAcc+1e-12>=h&&n<32){W.step();RW.carAcc-=h;n++;}if(n===32)RW.carAcc=0;
  RW.carClock=W.time;rwWorldMirror();rwWorldEvents();
}
function rwWorldMirror(){
  const W=RW.vehicleWorld;if(!W)return;const seen=new Set(),out=[];
  for(const v of W.renderList()){if(v.visualKind==='prop')continue;
    let c=RW.worldCarState.get(v.id);if(!c){c={id:v.id,view:'side',vsign:1,planeYaw:v.heading,switches:0,h:null,onScreen:false,dist:0,theta:0};RW.worldCarState.set(v.id,c);}
    Object.assign(c,{label:v.id,vehicleId:v.id,classId:v.classId,state:'drive',worldState:v.state,lane:{id:v.laneFamily||v.elementId,story:v.story},laneId:v.elementId,
      x:v.x,y:v.y,facing:v.heading,speed:v.speed,s:v.routeS,cruiseSpeed:v.cruiseSpeed,aiState:v.aiState,braking:v.braking,emergency:v.emergency,driver:{name:v.driverStyle},
      responseTo:v.responseTo,halfLength:v.halfLength,halfWidth:v.halfWidth,length:2*v.halfLength,width:2*v.halfWidth,traffic:v.traffic,signal:v.signal,contactCount:v.contactCount,observations:[]});
    seen.add(v.id);out.push(c);}
  for(const [id] of RW.worldCarState)if(!seen.has(id)){RW.worldCarState.delete(id);const m=RW.meshes?.list?.get(id);if(m)m.visible=false;}
  RW.cars=out;
}
function rwWorldEvents(){
  const W=RW.vehicleWorld,evs=W.events(RW.vwSeq);if(!evs.length)return;RW.vwSeq=evs[evs.length-1].seq;let transitChanged=false;
  for(const e of evs){if(e.type==='vehicle_pedestrian_contact'&&e.target==='PLAYER'){RW.stats.playerVehicleContacts=(RW.stats.playerVehicleContacts||0)+1;rwSay(`${e.vehicleId} made vehicle contact with you — no injury model is installed in this prototype.`,4200);}
    if(e.type==='vehicle_pedestrian_contact')RW.stats.pedestrianContacts=(RW.stats.pedestrianContacts||0)+1;if(e.type==='vehicle_contact')RW.stats.trafficContacts=(RW.stats.trafficContacts||0)+1;
    if(String(e.type||'').startsWith('transit_')){transitChanged=true;if(e.type==='transit_arrived'&&rwPlayerAboard())rwSay('Bus arrived. The passenger door is open for the configured dwell time; press E to alight.',3600);}}
  if(transitChanged&&RW.on)renderLeft();
}
function rwWorldSummary(){
  const W=RW.vehicleWorld,s=W.snapshot(),cars=RW.cars;
  return {runtime:'world',tracked:s.counts.moving,parked:s.counts.parked,visible:cars.filter(c=>c.onScreen).length,braking:cars.filter(c=>c.braking).length,
    following:cars.filter(c=>c.aiState==='following').length,easing:cars.filter(c=>c.aiState==='easing'||c.aiState==='braking').length,openingGap:cars.filter(c=>c.aiState==='opening-gap').length,
    contacts:RW.stats?.trafficContacts||0,pedestrianContacts:RW.stats?.pedestrianContacts||0,signalViolations:s.violations,traffic:s.traffic,signals:s.signals,transit:s.transit||[]};
}
function rwWorldHud(){
  const W=RW.vehicleWorld;if(!W)return '';const q=rwWorldSummary(),t=q.traffic,p=rwPlayerPos(),aboard=W.query('getInteriorActorState','PLAYER'),services=W.query('getTransitServices')||[];let nearest=null;
  if(!aboard)for(const x of W.renderList()){const c=W.query('getVehicleAccessCandidates',x.id,p);if(c?.length&&c[0].highlighted&&(!nearest||c[0].distance<nearest.distance))nearest=c[0];}
  let html=`<div class="rh-row">Vehicle world: <b>${q.tracked}</b> moving · ${q.parked} parked · ${q.contacts} contacts · ${q.pedestrianContacts} person contacts</div>`;
  if(aboard)html+=`<div class="rh-row warn"><b>ABOARD ${esc(aboard.vehicleId)}</b> · interior x ${Number(aboard.local?.x||0).toFixed(2)} / z ${Number(aboard.local?.z||0).toFixed(2)} · E alights only at an open transit stop</div>`;
  if(nearest){const door=nearest.accessKind==='interior_portal'||nearest.type==='passenger_door',why=nearest.usable?'IN ACCESS ZONE':nearest.inRange?String(nearest.accessReason||'access refused').replaceAll('_',' '):'follow the visible marker';html+=`<div class="rh-row ${nearest.usable?'warn':''}">Nearest ${door?'bus passenger':'vehicle'} door: <b>${esc(nearest.cueLabel||nearest.name||nearest.seatId)}</b> · ${nearest.distance.toFixed(1)} m · ${esc(why)}${door?' · automatic only':''}</div>`;}
  for(const svc of services){const cur=svc.currentStop?.label||svc.currentStop?.id||'—',target=svc.targetStop?.label||svc.targetStop?.id||'—',rem=svc.dwellRemaining==null?'—':svc.dwellRemaining.toFixed(1)+' s',lane=W.query('getLaneStatus',svc.vehicleId),leg=svc.routeLeg||{},route=Array.isArray(leg.branchSequence)&&leg.branchSequence.length?` · route ${leg.cursor||0}/${leg.branchSequence.length}${leg.expectedConnector?' → '+esc(leg.expectedConnector):''}`:'';html+=`<div class="rh-row ${svc.active?'':'warn'}">Bus <b>${esc(svc.label||svc.serviceId)}</b>: ${svc.active?'ACTIVE':'INACTIVE'} · ${esc(String(svc.state||'').replaceAll('_',' '))} · door <b>${esc(svc.doorState)}</b> · driver ${esc(svc.driverActorId||'MISSING')} · ${esc(cur)} → ${esc(target)} · dwell ${rem}${route}${lane?.multiLane?` · lane ${lane.laneIndex+1} ${esc(lane.laneLabel||'')}${lane.changing?' → '+esc(lane.targetLabel||''):''}`:''}</div>`;}
  const controlled=W.renderList().find(x=>['guided','external'].includes(x.controllerMode));if(controlled){const lane=W.query('getLaneStatus',controlled.id);if(lane?.multiLane)html+=`<div class="rh-row">Driven vehicle ${esc(controlled.id)}: lane ${lane.laneIndex+1} <b>${esc(lane.laneLabel||'')}</b>${lane.changing?' → '+esc(lane.targetLabel||''):''}</div>`;}
  if(t&&t.enabled){const live=t.flows.filter(f=>f.enabled),next=live.map(f=>f.nextSpawnAt).filter(x=>x!=null).sort((a,b)=>a-b)[0];html+=`<div class="rh-row">Traffic: meter <b>${esc(globalThis.RCVehicleTraffic?.PRESET_LABELS[t.meterPreset]||t.meterPreset)}</b> ${Math.round(t.meter*100)}% · ${live.length} flow${live.length===1?'':'s'} · ${t.aggregateVehiclesPerMinute.toFixed(1)} veh/min · flow vehicles ${t.flows.reduce((n,f)=>n+f.active,0)} · next spawn ${next!=null?Math.max(0,next-W.time).toFixed(1)+' s':'—'}</div>`;}
  if(q.signals.length)html+=`<div class="rh-row">Signals ${q.signals.length}: ${q.signals.map(s=>{const st=Object.values(s.groupStates)[0]||'OFF';return `<span class="sig sig-${st.toLowerCase()}">${esc((s.label||s.signalId).replace(/^Intersection /,'#'))} ${st} ${s.phaseRemaining.toFixed(0)}s</span>`;}).join(' · ')} · violations ${q.signalViolations}</div>`;
  return html;
}
function rwWorldTransitPanel(){
  const W=RW.vehicleWorld,services=W?.query('getTransitServices')||[];if(!services.length)return '';return services.map(svc=>{const parked=svc.vehicleState==='PARKED',canToggle=!svc.active||parked,label=!svc.active?'Activate bus route':parked?'Deactivate bus route':'Route active — deactivate at a bay',cur=svc.currentStop?.label||svc.currentStop?.id||'—',target=svc.targetStop?.label||svc.targetStop?.id||'—',leg=svc.routeLeg||{},seq=Array.isArray(leg.branchSequence)?leg.branchSequence:[],seat=W.query('getVehicleSeatPose',svc.vehicleId,'driver');return `<div class="section"><div class="row"><h3 class="grow">Public transit control</h3><span class="badge">ROOM V2.5.1</span></div><p><b>${esc(svc.label||svc.serviceId)}</b></p><p class="subtle">${svc.active?'Service is active.':'Initial hold: the bus remains in its bay indefinitely with the automatic passenger door open.'}</p><table class="rw-table"><tr><td>state</td><td>${esc(String(svc.state||'').replaceAll('_',' '))}</td></tr><tr><td>door</td><td>${esc(svc.doorState)} · automatic, never player-operated</td></tr><tr><td>driver binding</td><td>${esc(svc.driverActorId||'MISSING')}</td></tr><tr><td>driver seat</td><td>${seat?`${seat.x.toFixed(2)}, ${seat.y.toFixed(2)} · heading ${Math.round(seat.heading)}°`:'MISSING'}</td></tr><tr><td>stop</td><td>${esc(cur)} → ${esc(target)}</td></tr><tr><td>ordered route leg</td><td>${seq.length?`${leg.cursor||0}/${seq.length} · ${esc(leg.expectedConnector||'complete')}`:'legacy / direct'}</td></tr></table><button class="primary block" data-rw-transit-act="${esc(svc.serviceId)}" ${canToggle?'':'disabled'}>${esc(label)}</button><label>Bus dwell time (seconds)<input type="number" min="0" max="120" step="0.5" value="${svc.dwellSeconds}" data-rw-transit-dwell="${esc(svc.serviceId)}"></label><p class="subtle">One dwell metric governs every normal stop. The ordered ROOM itinerary completes the local block loop before each inter-block connector. While aboard: W/S aisle, A/D across aisle, E alight at an open stop.</p></div>`;}).join('');
}
/* ---------------- procedural signal heads (placeholder art; no collision; lamps read the world's signal state) */
function rwWorldEnsureHeads(){
  const W=RW.vehicleWorld;if(RW.vwHeads||!W||!W.signals||!window.THREE||!GLE?.dynamic)return RW.vwHeads;
  const T=window.THREE,heads=W.query('getSignalHeads'),geo={pole:new T.CylinderGeometry(.07,.07,3.0,10),box:new T.BoxGeometry(.34,.95,.26),lamp:new T.CircleGeometry(.105,18),visor:new T.BoxGeometry(.3,.04,.14)};
  const M=c=>new T.MeshBasicMaterial({color:c}),mats={pole:M('#4b4f55'),box:M('#16181b'),visor:M('#0c0d0f'),RED:[M('#3b1210'),M('#ff3b2f')],YELLOW:[M('#3b3210'),M('#ffcc1a')],GREEN:[M('#0f3a1c'),M('#2fe06a')]};
  const list=[];
  for(const hd of heads){const g=new T.Group(),floor=C.storyElevation(project,hd.story||0),b=C.basis(hd.facing);
    const pole=new T.Mesh(geo.pole,mats.pole);pole.position.set(0,1.5,0);g.add(pole);const box=new T.Mesh(geo.box,mats.box);box.position.set(0,3.35,0);g.add(box);
    const lamps={};[['RED',3.66],['YELLOW',3.35],['GREEN',3.04]].forEach(([k,y])=>{const l=new T.Mesh(geo.lamp,mats[k][0]);l.position.set(0,y,.135);g.add(l);lamps[k]=l;const v=new T.Mesh(geo.visor,mats.visor);v.position.set(0,y+.13,.19);g.add(v);});
    g.position.set(hd.x,floor,hd.y);g.rotation.set(0,Math.atan2(b.fx,b.fy),0);g.userData.signalHead=hd.id;GLE.dynamic.add(g);list.push({hd,g,lamps});}
  RW.vwHeads={list,geo,mats};return RW.vwHeads;
}
function rwWorldSyncHeads(){
  const H=rwWorldEnsureHeads();if(!H)return;const states=new Map(RW.vehicleWorld.query('getSignalStates').map(s=>[s.signalId,s.groupStates]));
  for(const x of H.list){const st=states.get(x.hd.signalId)?.[x.hd.groupId]||'OFF';x.state=st;for(const k of ['RED','YELLOW','GREEN'])x.lamps[k].material=H.mats[k][st===k?1:0];}
}
function rwWorldDisposeHeads(){
  const H=RW.vwHeads;if(!H)return;for(const x of H.list)GLE?.dynamic?.remove(x.g);for(const g of Object.values(H.geo))g.dispose();
  for(const m of Object.values(H.mats))(Array.isArray(m)?m:[m]).forEach(z=>z.dispose());RW.vwHeads=null;
}
/* ---------------- debug overlay (first person): footprints at debug ≥ 1; graph, stop lines and signal labels at debug 2 */
const RW_SIG_COLOR={GREEN:'#2fe06a',YELLOW:'#ffcc1a',RED:'#ff3b2f',OFF:'#9aa0a6'};
function rwWorldCorners(v){const b=C.basis(v.heading),hl=v.halfLength,hw=v.halfWidth,c=(a,s)=>({x:v.x+b.fx*hl*a+b.rx*hw*s,y:v.y+b.fy*hl*a+b.ry*hw*s,story:v.story});return [c(1,-1),c(1,1),c(-1,1),c(-1,-1),c(1,-1)];}
function rwWorldInteriorPoint(v,x,z){const b=C.basis(v.pose.heading);return {x:v.pose.x-b.rx*x+b.fx*z,y:v.pose.y-b.ry*x+b.fy*z,story:v.pose.story};}
function rwWorldInteriorOverlay(g,view,k){
  const W=RW.vehicleWorld,a=W?.query('getInteriorActorState','PLAYER');if(!a)return;const v=W.query('getVehicleState',a.vehicleId),interior=W.query('getVehicleInterior',a.vehicleId);if(!v||!interior)return;const b=interior.bounds||{},pt=(x,z)=>rwWorldInteriorPoint(v,x,z),corners=[pt(b.x0,b.z0),pt(b.x1,b.z0),pt(b.x1,b.z1),pt(b.x0,b.z1),pt(b.x0,b.z0)];
  rwFPLine(g,view,corners,{color:'#62e7ff',width:2.4,k});const nodes=new Map((interior.nodes||[]).map(n=>[n.id,n]));for(const e of interior.edges||[]){const A=nodes.get(e.a),B=nodes.get(e.b);if(A&&B)rwFPLine(g,view,[pt(A.x,A.z),pt(B.x,B.z)],{color:'#ffe26a',width:2.2,k});}
  g.save();for(const p of interior.positions||[]){const q=rwFP(view,pt(p.x,p.z),p.kind==='seat'?.35:.18);if(!q||q.depth<.35||q.depth>20)continue;g.fillStyle=p.kind==='seat'?'#91cfff':'#7ff0d0';g.beginPath();g.arc(q.x,q.y,(p.kind==='seat'?4:3)*k,0,Math.PI*2);g.fill();}g.restore();
  const cue=W.query('getVehicleInteractionCues',a.vehicleId),door=cue?.access?.find(x=>x.accessKind==='interior_portal'||x.type==='passenger_door');if(door)rwWorldCueBadge(g,view,k,door,'PASSENGER DOOR',cue.accessStatus?.allowed?'#ffe26a':'#ff9b7b',cue.accessStatus?.allowed?'OPEN · E TO ALIGHT':'AUTOMATIC · CLOSED','door',true);
  const svc=(W.query('getTransitServices')||[]).find(x=>x.vehicleId===a.vehicleId);g.save();const x=18*k,y=18*k,w=360*k,h=58*k;g.fillStyle='#07131de8';g.fillRect(x,y,w,h);g.strokeStyle='#62e7ff';g.lineWidth=2*k;g.strokeRect(x,y,w,h);g.fillStyle='#e8f4ee';g.textAlign='left';g.font=`bold ${14*k}px Segoe UI`;g.fillText(`ABOARD ${svc?.label||a.vehicleId}`,x+10*k,y+19*k);g.font=`${11*k}px Segoe UI`;g.fillStyle='#ffe26a';g.fillText('W/S aisle · A/D across aisle · E alight at open transit bay',x+10*k,y+38*k);g.fillStyle='#b9cbd3';g.fillText(`door ${svc?.doorState||interior.doorState||'CLOSED'} · ${svc?.state?.replaceAll('_',' ')||'service'}`,x+10*k,y+53*k);g.restore();
}
function rwWorldCueBadge(g,v,k,p,text,color,sub='',kind='door',emph=false){const q=rwFP(v,p,kind==='door'?1.45:.65);if(!q||q.depth<.4||q.depth>35)return;g.save();const fs=(emph?12:10.5)*k,ss=9*k;g.font=`bold ${fs}px Segoe UI`;const tw=g.measureText(text).width,sw=sub?(g.font=`${ss}px Segoe UI`,g.measureText(sub).width):0,w=Math.max(tw,sw)+14*k,h=(sub?30:18)*k;g.fillStyle='#07131ddd';g.fillRect(q.x-w/2,q.y-h/2,w,h);g.strokeStyle=color;g.lineWidth=(emph?2.6:1.6)*k;g.strokeRect(q.x-w/2,q.y-h/2,w,h);g.fillStyle=color;g.font=`bold ${fs}px Segoe UI`;g.textAlign='center';g.fillText(text,q.x,q.y-(sub?2.5:0)*k);if(sub){g.font=`${ss}px Segoe UI`;g.fillStyle='#e8f4ee';g.fillText(sub,q.x,q.y+10*k);}if(kind==='front'){g.fillStyle=color;g.beginPath();g.moveTo(q.x,q.y-h/2-7*k);g.lineTo(q.x-6*k,q.y-h/2);g.lineTo(q.x+6*k,q.y-h/2);g.closePath();g.fill();}else if(kind==='rear'){g.fillStyle=color;g.fillRect(q.x-7*k,q.y-h/2-4*k,14*k,3*k);}else{g.beginPath();g.arc(q.x,q.y+h/2+4*k,(emph?5:3.5)*k,0,Math.PI*2);g.fill();}g.restore();}
function rwWorldLegibilityOverlay(g,v,k){const W=RW.vehicleWorld;if(!W||rwPlayerAboard())return;const cam=rwCam(),player=rwPlayerPos();for(const x of W.renderList()){const d=Math.hypot(x.x-cam.x,x.y-cam.y);if(d>30)continue;const cue=W.query('getVehicleInteractionCues',x.id,player);if(!cue)continue;
    rwWorldCueBadge(g,v,k,cue.front,'▶ '+cue.front.label,'#7ff0d0','', 'front',true);rwWorldCueBadge(g,v,k,cue.rear,'■ '+cue.rear.label,'#ff9c88','', 'rear',false);
    if(!cue.accessStatus?.allowed||d>16)continue;for(const a of cue.candidates){const emph=a.nearest&&a.highlighted,usable=a.usable,col=usable?'#ffe26a':emph?'#62e7ff':a.highlighted?'#91cfff':'#5b8090',lab=(usable?'E · ':'')+(a.cueLabel||a.name||a.seatId||'DOOR'),sub=usable?`${a.distance.toFixed(1)} m · IN RANGE`:a.highlighted?`${a.distance.toFixed(1)} m`:'DOOR';rwWorldCueBadge(g,v,k,a,lab,col,sub,'door',usable||emph);}}}
function rwWorldFPOverlay(g,v,k){
  const W=RW.vehicleWorld,S=RW.settings;if(!W)return;rwWorldInteriorOverlay(g,v,k);rwWorldLegibilityOverlay(g,v,k);if(S.debug<1)return;const cam=rwCam();
  for(const x of W.renderList()){if(Math.hypot(x.x-cam.x,x.y-cam.y)>60)continue;
    rwFPLine(g,v,rwWorldCorners(x),{color:x.state==='PARKED'?'#9ad0ff':x.aiState==='signal-stop'?'#ff3b2f':x.aiState==='box-wait'?'#ffcc1a':'#ffb98a',width:1.6,k});
    if(x.state==='PARKED'&&Math.hypot(x.x-cam.x,x.y-cam.y)<25){const q=rwFP(v,x,1.6);if(q&&q.depth>.4){g.save();g.font=`${10*k}px Consolas, monospace`;g.fillStyle='#9ad0ff';g.textAlign='center';g.fillText(`${x.id} PARKED`,q.x,q.y);g.restore();}}}
  if(S.debug<2)return;
  const gr=W.graph,states=new Map(W.query('getSignalStates').map(s=>[s.signalId,s]));
  for(const el of gr.elements.values()){const pts=el.pts.map(p=>({...p,story:el.story})),b=W.signals?.byConnector.get(el.id),st=b?states.get(b.signalId):null,state=st?st.groupStates[b.groupId]:null;
    rwFPLine(g,v,pts,{color:state?RW_SIG_COLOR[state]:'#ff9a4a99',width:state?3.2:1.4,dash:state?null:[10,8],k});
    if(!state){for(const s of [-1,1]){const a=gr.poseAt(el.id,0),z=gr.poseAt(el.id,el.len);rwFPLine(g,v,[{x:a.x+a.rx*el.halfWidth*s,y:a.y+a.ry*el.halfWidth*s,story:el.story},{x:z.x+z.rx*el.halfWidth*s,y:z.y+z.ry*el.halfWidth*s,story:el.story}],{color:'#ff9a4a44',width:1,k});}}}
  for(const hd of W.query('getSignalHeads')){const st=states.get(hd.signalId),state=st?.groupStates[hd.groupId]||'OFF',L=hd.stopLine;
    rwFPLine(g,v,[{x:L.x0,y:L.y0,story:hd.story},{x:L.x1,y:L.y1,story:hd.story}],{color:RW_SIG_COLOR[state],width:5,k});
    const q=rwFP(v,{x:(L.x0+L.x1)/2,y:(L.y0+L.y1)/2,story:hd.story},.6);if(q&&q.depth>.4&&q.depth<70){g.save();g.font=`${9.5*k}px Consolas, monospace`;g.textAlign='center';g.fillStyle='#0c1823cc';
      const t1=`${hd.signalId} · ${hd.groupId}`,t2=`${st?.phaseId||'off'} · ${state} · ${(st?.phaseRemaining||0).toFixed(1)} s`,w=Math.max(g.measureText(t1).width,g.measureText(t2).width)+8*k;
      g.fillRect(q.x-w/2,q.y-24*k,w,26*k);g.fillStyle=RW_SIG_COLOR[state];g.fillText(t1,q.x,q.y-13*k);g.fillText(t2,q.x,q.y-2*k);g.restore();}}
}
/* ---------------- map layer: footprints and signal states */
function rwWorldMapLayer(g,k,P,focus){
  const W=RW.vehicleWorld;if(!W)return;
  for(const x of W.renderList()){if(x.story!==focus)continue;const pts=rwWorldCorners(x).slice(0,4).map(q=>P(q,focus));
    R.polygon(g,pts,x.state==='PARKED'?'#9ad0ff33':'#ff9a4a66',x.state==='PARKED'?'#9ad0ff':'#ff9a4a',1.2*k);const cue=W.query('getVehicleInteractionCues',x.id);if(cue){const f=P(cue.front,focus),r=P(cue.rear,focus);g.save();g.font=`bold ${8.5*k}px Segoe UI`;g.textAlign='center';g.fillStyle='#7ff0d0';g.fillText('▶ FRONT',f.x,f.y);g.fillStyle='#ff9c88';g.fillText('■ REAR',r.x,r.y);if(cue.accessStatus?.allowed)for(const a of cue.access){const z=P(a,focus);g.strokeStyle='#62e7ff';g.lineWidth=1.5*k;g.beginPath();g.arc(z.x,z.y,4*k,0,Math.PI*2);g.stroke();}g.restore();}}
  if(RW.settings.debug<1)return;const states=new Map(W.query('getSignalStates').map(s=>[s.signalId,s]));
  for(const hd of W.query('getSignalHeads')){if(hd.story!==focus)continue;const st=states.get(hd.signalId)?.groupStates[hd.groupId]||'OFF',L=hd.stopLine,a=P({x:L.x0,y:L.y0},focus),b=P({x:L.x1,y:L.y1},focus);
    g.save();g.strokeStyle=RW_SIG_COLOR[st];g.lineWidth=3*k;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.restore();}
}
/* ---------------- public-transit director controls (ENCOUNTER owns activation/driver identity; ROOM executes motion) */
HOOKS.click.push((e,b)=>{const id=b.dataset.rwTransitAct;if(id===undefined)return false;const W=RW.vehicleWorld,svc=W?.query('getTransitServiceState',id);if(!W||!svc)return true;const r=W.setTransitServiceActive(id,!svc.active);if(r.ok)rwSay(r.active?`Bus route activated. Door closes after the ${svc.dwellSeconds.toFixed(1)} s dwell, then the NPC driver departs.`:'Bus route inactive. It will remain in this bay with the passenger door open.',4200);else rwSay('Bus route control refused: '+String(r.reason||'unknown').replaceAll('_',' ')+'.',4200);renderLeft();rwUpdateHud();drawSoon();return true;});
document.addEventListener('change',e=>{const el=e.target;if(!el.matches?.('[data-rw-transit-dwell]'))return;const W=RW.vehicleWorld,seconds=Number(el.value),id=el.dataset.rwTransitDwell;if(!W||!Number.isFinite(seconds))return;const r=W.setTransitDwellSeconds(id,seconds);rwSay(r.ok?`Bus dwell time set to ${seconds.toFixed(1)} seconds.`:'Dwell time refused: '+String(r.reason||'unknown').replaceAll('_',' ')+'.',3000);renderLeft();rwUpdateHud();drawSoon();});
