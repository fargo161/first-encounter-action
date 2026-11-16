'use strict';
/* Action Playground v0.3 — reproduction checks from Claude's review (2026-11-15).
 *
 * Where it goes:  rc/tests/action_proof/claude_v0_3_findings.test.js
 * How to run:     from the rc/ folder:  node tests/action_proof/claude_v0_3_findings.test.js
 *
 * Every check states the behaviour that SHOULD hold. On the v0.3 package as delivered,
 * the checks marked BUG fail. They are meant to pass after the repair.
 * Checks marked DECISION describe current behaviour the owner has to rule on; they never fail the run.
 * This file changes nothing. It only reads source/actor-physical.js and the v0.3 scene.
 * Not covered here, because it needs a real browser: the Esc-then-quick-click mouse capture bug (see the review, Bug 4).
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const P=require('../../source/actor-physical'),{C,VW}=require('./scene_fixture');
const H=P.H,A='proof01__person_a',B='proof01__person_b';
const results=[];
function scene(preset='practice',change){
 const b=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../examples/Action_Physical_Proof_v0_3.room.json'))),p=b.project,n=p.routeNet,s=n.physicalProof;
 const lookup=Object.fromEntries(n.vertices.map(v=>[v.id,{...v,z:C.storyElevation(p,v.story||0)}]));
 const o={...s,preset,actors:s.actors.map((a,i)=>({...a,...s.presets[preset].actors[i]})),geometry:P.roomGeometry(p,C),routeEdges:n.edges.map(e=>({...e,A:lookup[e.a],B:lookup[e.b],piece:e.physicalPiece})),vehicleWorld:VW.create({routeNet:n,props:p.props,seed:1977})};
 if(change)change(o);const w=P.create(o);w.spawnCar();return w;}
const run=(w,sec)=>{for(let i=0,n=Math.round(sec/H);i<n;i++)w.step();};
const ev=(w,type,f=()=>true)=>w.W.events.filter(e=>e.type===type&&f(e));
const ready=a=>!a.down&&!a.holder&&a.stagger<=0&&a.wiltT<=0;
function check(kind,name,fn){try{const d=fn();results.push({kind,name,status:'PASS',detail:d});console.log('PASS ['+kind+']',name,d?'— '+d:'');}
 catch(e){const fail=kind==='BUG';results.push({kind,name,status:fail?'FAIL':'NOTE',detail:e.message});console.log((fail?'FAIL':'NOTE')+' ['+kind+']',name,'—',e.message);}}

/* 1. Downward movement that is stopped by a body or by the lip of a box keeps adding gravity to the
 *    vertical speed (actor-physical.js, moveActor: the z-axis branch only zeroes vz when vz>0). */
check('BUG','Resting on another body does not build up fall speed',()=>{
 const w=scene('practice',o=>{o.actors[0]={...o.actors[0],x:9,y:15.75,z:1.85};});const a=w.get(A);run(w,1);
 assert(Math.abs(a.vz)<9,'after 1 s resting on the defender\'s head the vertical speed is '+a.vz.toFixed(1)+' m/s and still growing');
 return 'vertical speed '+a.vz.toFixed(1);});

check('BUG','Stepping off a 1.8 m body is a harmless drop',()=>{
 const w=scene('practice',o=>{o.actors[0]={...o.actors[0],x:9,y:15.75,z:1.82};});const a=w.get(A);run(w,.5);w.request(A,'face',{yaw:90});
 for(let i=0;i<480;i++){if(ready(a))w.request(A,'move',{x:1,y:0});w.step();}
 const land=ev(w,'landed',e=>e.actor===A).pop();
 assert(a.health===2,'health '+a.health+' after landing at '+(land?land.speed.toFixed(1):'?')+' m/s (a true 1.8 m drop lands at 8.0 m/s)');
 return 'landing '+land.speed.toFixed(1)+' m/s';});

check('BUG','Plain forward jump at the defender does not injure the jumper (Melee drill, hold W, Space)',()=>{
 const w=scene('practice');const a=w.get(A);
 for(let i=0;i<240*4;i++){if(ready(a)){w.request(A,'face',{yaw:0});w.request(A,'move',{x:0,y:-1});}if(i===36)w.request(A,'jump');w.step();}
 const fall=ev(w,'injury',e=>e.target===A&&e.kind==='fall');const land=ev(w,'landed',e=>e.actor===A)[0];
 assert(fall.length===0,'took fall damage '+fall.map(e=>e.amount).join('+')+' landing at '+land.speed.toFixed(1)+' m/s from an ordinary jump (normal landing is 8.6 m/s)');
 return 'health '+a.health;});

check('BUG','Flying kick on open ground does not injure the kicker',()=>{
 const w=scene('practice',o=>{o.actors[0]={...o.actors[0],x:4,y:15.5,yaw:270};o.actors[1]={...o.actors[1],x:2.5,y:15.5,yaw:90};});const a=w.get(A);
 const mv=()=>{if(ready(a)){w.request(A,'face',{yaw:270});w.request(A,'move',{x:-1,y:0});}};
 mv();run(w,.15);mv();w.request(A,'jump');for(let i=0;i<240*3;i++){mv();if(i===12)w.request(A,'kick');w.step();}
 const self=ev(w,'injury',e=>e.target===A&&e.kind!=='strong');
 assert(ev(w,'lunge').length===1,'the flying kick did not start');
 assert(self.length===0,'kicker hurt himself: '+self.map(e=>e.kind+' '+e.amount).join(', '));
 return 'health '+a.health;});

/* 2. The barricade's "broken" state has collision boxes that are deeper (y ±0.20) than the "whole" state (y ±0.14).
 *    A body pressed against the outer thirds of the barricade is inside the new boxes the moment the state swaps. */
check('BUG','Breaking the barricade does not trap a body standing against it',()=>{
 const w=scene('barrier',o=>{o.actors[0]={...o.actors[0],x:7.78,y:14.63,yaw:0};o.actors[1]={...o.actors[1],x:-9,y:16};});const a=w.get(A);
 run(w,.05);assert(!w.clear(a,a,[a.id],false),'fixture error: start position is already inside something');
 w.request(A,'kick');run(w,1.2);assert.strictEqual(w.W.pieces[0].state,'broken','fixture error: the kick did not break the barricade');
 const y0=a.y;for(let i=0;i<360;i++){if(ready(a)){w.request(A,'face',{yaw:0});w.request(A,'move',{x:0,y:1});}w.step();}
 const inside=w.clear(a,a,[a.id],false);
 assert(Math.abs(a.y-y0)>.5&&!inside,'after the swap the body is inside "'+(inside&&inside.id)+'" and moved '+Math.abs(a.y-y0).toFixed(2)+' m in 1.5 s of walking away');
 return 'walked clear';});

check('BUG','No state of a swappable piece may overlap a body that was legally standing beside the previous state',()=>{
 const w=scene('barrier');const def=w.W.pieces[0],d=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../examples/Action_Physical_Proof_v0_3.room.json'))).project.routeNet.physicalProof.definitions[def.definition];
 const hull=s=>({y0:Math.min(...s.boxes.map(b=>b.y0)),y1:Math.max(...s.boxes.map(b=>b.y1))});const a=hull(d.states.whole),b=hull(d.states.broken);
 assert(b.y0>=a.y0-1e-9&&b.y1<=a.y1+1e-9,'broken state spans y '+b.y0+'..'+b.y1+' but whole state spans y '+a.y0+'..'+a.y1);
 return 'contained';});

/* 3. The rails leak. supportAt() insets every floor rectangle (line 54), so a walker crossing the seam between two
 *    floor pieces is airborne for a few steps, and airborne movement is not band-checked. He lands just outside the band,
 *    and acquire() (line 55), which the landing branch calls on every step, re-centres localLanding on his current
 *    position, so the 1.3 m circle follows him and never restricts anything again. */
check('BUG','Walking alone never leaves the authored bands (Melee start, hold S for 1 s)',()=>{
 const w=scene('practice');const a=w.get(A);
 for(let i=0;i<240;i++){if(ready(a)){w.request(A,'face',{yaw:0});w.request(A,'move',{x:0,y:1});}w.step();}
 assert(!!w.onRoute(a,a.x,a.y,a.z),'after 1 s of walking backward the player stands at y='+a.y.toFixed(2)+' (the band ends at y=18.05; the driving lane starts at y=20), off every band and free to keep going');
 return 'stopped at y='+a.y.toFixed(2);});

check('BUG','Walking across the seam between two floor pieces keeps the walker supported',()=>{
 const w=scene('practice');const a=w.get(A);
 for(let i=0;i<120;i++){if(ready(a)){w.request(A,'face',{yaw:0});w.request(A,'move',{x:0,y:1});}w.step();}
 const lost=ev(w,'support_lost',e=>e.actor===A).length;
 assert(lost===0,lost+' support_lost event(s) while walking on flat ground; a jump pressed in that moment is refused as not_supported');
 return 'no gaps';});

check('BUG','Walking alone cannot take a body off the map',()=>{
 const w=scene('practice');const a=w.get(A);const go=(d,sec)=>{const yaw=(Math.atan2(d[0],-d[1])*180/Math.PI+360)%360;for(let i=0;i<sec*240;i++){if(ready(a)){w.request(A,'face',{yaw});w.request(A,'move',{x:d[0],y:d[1]});}w.step();}};
 go([0,1],2.5);go([1,0],4);
 assert(!a.outOfTile,'S for 2.5 s then D-direction for 4 s, no jumping: the player crossed the road, walked off the east edge and died');
 return 'still on the map at '+a.x.toFixed(1)+', '+a.y.toFixed(1);});

/* 4. Tuning that needs an owner decision. Reported, never failed. */
check('DECISION','A flying kick cannot kill its own user from full health',()=>{
 let dead=0,hurt=0,n=0;
 for(const back of [0,0.5,1,1.5,2,2.5])for(const delay of [0.02,0.05,0.1,0.15,0.2,0.3,0.4]){n++;
  const w=scene('practice',o=>{o.actors[0]={...o.actors[0],y:17.25+back};});const a=w.get(A);
  const mv=()=>{if(ready(a)){w.request(A,'face',{yaw:0});w.request(A,'move',{x:0,y:-1});}};
  mv();run(w,.15);mv();w.request(A,'jump');let k=false;for(let i=0;i<240*4;i++){mv();if(!k&&i>=Math.round(delay/H)){w.request(A,'kick');k=true;}w.step();}
  if(a.down)dead++;if(ev(w,'injury',e=>e.target===A&&e.kind==='scenery').length)hurt++;}
 assert(dead===0,dead+' of '+n+' flying kicks in the Melee drill killed the kicker; '+hurt+' of '+n+' injured him on scenery (lunge 9.5 m/s rising past 12 with W held; injury threshold 8, fatal 12)');
 return 'none fatal';});

check('DECISION','The edges of the street stop a body or are marked as a hazard',()=>{
 const w=scene('practice');const a=w.get(A);
 for(let i=0;i<240*10;i++){if(ready(a)){w.request(A,'face',{yaw:90});w.request(A,'move',{x:1,y:0,sprint:true});}if(a.x>11.2&&a.motion==='supported')w.request(A,'jump');w.step();}
 assert(!a.outOfTile,'a sprint-jump off the east end of the sidewalk leaves the map and kills (out_of_tile_fall); "boundaries" in the scene data are not read by actor-physical.js');
 return 'stayed on the map';});

check('DECISION','Riding the car roof to the end of the street is survivable',()=>{
 const w=scene('car');const a=w.get(A);run(w,.35);w.request(A,'face',{yaw:180});w.request(A,'move',{x:0,y:1});w.request(A,'jump');
 for(let i=0;i<Math.round(.67/H);i++){w.request(A,'move',{x:0,y:1});w.step();}w.request(A,'move',{x:0,y:0});run(w,2);
 assert(a.localSupport,'fixture error: did not land on the roof');run(w,6);
 assert(!a.down,'rider is carried past the map edge when the car leaves and dies ('+ev(w,'injury',e=>e.target===A).map(e=>e.kind).join(',')+')');
 return 'alive';});

check('DECISION','A body thrown at a passing car is hit, and scored the same way, wherever the thrower stands',()=>{
 const rows=[];let over=0,kinds=new Set();
 for(const py of [16.0,16.5,16.8,17.0,17.25,17.7]){let hits=0,dead=0,n=0,sev=new Set();
  for(let carX=-6;carX<=5;carX+=0.5){n++;
   const w=scene('car',o=>{o.actors[0]={...o.actors[0],x:0,y:py,z:0,yaw:180};o.actors[1]={...o.actors[1],x:0,y:py+1.4,z:0,yaw:0};});const b=w.get(B);
   b.wiltT=1.7;b.guard=0;w.request(A,'grab');run(w,.3);let g=0;while((w.W.carShapes[0]?.x??-99)<carX&&g++<4800)w.step();
   w.request(A,'throw');run(w,4);const c=ev(w,'impact',e=>e.kind==='vehicle'&&e.actor===B)[0];if(c){hits++;sev.add(c.severity.toFixed(1));if(b.down)dead++;}}
  if(!hits)over++;for(const k of sev)kinds.add(k);
  rows.push((18-py).toFixed(2)+' m back: '+hits+'/'+n+' hit'+(hits?', severity '+[...sev].join('/')+', '+dead+' killed':''));}
 assert(over===0&&kinds.size<=1,rows.join(' | ')+'. From 1.2 to 2 m back the body clears the 1.35 m roof. Close to the kerb the Vehicle World contact report fires first and scores the car speed only (4.5, one point); from 1 m back only the box collision sees it and scores the combined speed (12.8, fatal)');
 return rows.join(' | ');});

const bugs=results.filter(r=>r.kind==='BUG'),failed=bugs.filter(r=>r.status==='FAIL').length;
console.log('\nBUG checks passing: '+(bugs.length-failed)+' / '+bugs.length+'   |   DECISION notes: '+results.filter(r=>r.status==='NOTE').length);
if(failed)process.exitCode=1;
