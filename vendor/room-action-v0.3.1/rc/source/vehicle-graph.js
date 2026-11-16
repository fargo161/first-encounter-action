/* Room Creator 0.16 — Vehicle World road graph (runtime view of routeNet.vehicleGraph, schema rc-vehicle-graph@0.1).
   Builds edges + connectors ("elements"), nodes, portals and routes from the authored graph. Scenes without a
   vehicleGraph fall back to one edge per routeNet.traffic line (no connectors). Pure: no DOM, no randomness.
   V2.5.3 keeps lateral lane offsets continuous across polyline corners, element seams and loop seams.
   Conventions (same as Room Creator): metres; x east, y south; heading 0 = north, 90 = east;
   forward = (sin h, -cos h), right = (cos h, sin h); lateral > 0 is to the right of travel. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCVehicleGraph=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const EPS=1e-9,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  /* V2.5.3: cache route-level centreline joins. A lateral lane offset is applied to the
     joined route, not independently to each polyline segment, so the same lane remains
     physically continuous through connector corners and element seams. */
  const routeOffsetCache=new WeakMap();
  const norm=a=>{const n=((a%360)+360)%360;return n<1e-9||360-n<1e-9?0:n;};
  const wrap=a=>((a%360)+540)%360-180;
  const headingOf=(dx,dy)=>norm(Math.atan2(dx,-dy)*180/Math.PI);
  const byId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
  function laneModel(src,halfWidth){
    const raw=src&&src.lanes;if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    let centers=Array.isArray(raw.centers)?raw.centers.filter(Number.isFinite).map(Number):[];
    const count=Number.isInteger(raw.count)&&raw.count>0?raw.count:centers.length;
    if(!centers.length&&count>1){const usable=Math.max(0,halfWidth-(Number.isFinite(raw.edgeClearance)?raw.edgeClearance:.2)),step=2*usable/count;centers=Array.from({length:count},(_,i)=>-usable+step*(i+.5));}
    if(count<2||centers.length!==count)return null;centers=centers.slice().sort((a,b)=>a-b);
    const labels=Array.isArray(raw.labels)?raw.labels.slice(0,count).map(String):centers.map((_,i)=>`lane_${i}`);while(labels.length<count)labels.push(`lane_${labels.length}`);
    const valid=i=>Number.isInteger(i)&&i>=0&&i<count,branch={};for(const k of ['left','straight','right'])if(valid(raw.branchLanes?.[k]))branch[k]=raw.branchLanes[k];
    return {count,centers,labels,width:Number.isFinite(raw.width)&&raw.width>0?raw.width:null,defaultLane:valid(raw.defaultLane)?raw.defaultLane:count-1,parkingLane:valid(raw.parkingLane)?raw.parkingLane:count-1,branchLanes:branch,changeAllowed:raw.changeAllowed!==false};
  }
  function laneIndexFor(el,lateral){const lm=el?.lanes;if(!lm)return null;let best=0,d=Infinity;for(let i=0;i<lm.centers.length;i++){const q=Math.abs(lm.centers[i]-lateral);if(q<d){d=q;best=i;}}return best;}
  function laneCenter(el,index){const lm=el?.lanes;return lm&&Number.isInteger(index)&&index>=0&&index<lm.count?lm.centers[index]:0;}

  function makeElement(src,type,pts,story){
    const P=pts.map(q=>({x:+q.x,y:+q.y})),cum=[0];
    for(let i=1;i<P.length;i++)cum.push(cum[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y));
    const hw=Number.isFinite(src.corridor?.halfWidth)&&src.corridor.halfWidth>0?src.corridor.halfWidth:1.25;
    return {id:src.id,type,kind:src.kind||(type==='edge'?'road_lane':'connector'),laneFamily:src.laneFamily||null,direction:src.direction||null,
      story:Number.isInteger(src.story)?src.story:(Number.isInteger(pts[0]?.story)?pts[0].story:0),pts:P,cum,len:cum[cum.length-1],halfWidth:hw,lanes:laneModel(src,hw),laneRule:src.laneRule&&typeof src.laneRule==='object'?{...src.laneRule}:null,
      speedPolicy:src.speedPolicy?{...src.speedPolicy}:null,fromNode:src.fromNode||null,toNode:src.toNode||null,fromEdge:src.fromEdge||null,toEdge:src.toEdge||null,
      intersectionId:src.intersectionId||null,conflictZoneIds:Array.isArray(src.conflictZoneIds)?[...src.conflictZoneIds]:[],signalGroup:src.signalGroup??null,
      blockId:src.blockId||null,tags:Array.isArray(src.tags)?[...src.tags]:[],next:[],prev:[]};
  }
  function poseAt(el,s){
    s=clamp(s,0,el.len);let i=1;while(i<el.pts.length-1&&el.cum[i]<s)i++;
    const a=el.pts[i-1],b=el.pts[i],span=el.cum[i]-el.cum[i-1],t=span>EPS?(s-el.cum[i-1])/span:0,dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;
    const fx=dx/L,fy=dy/L;return {x:a.x+dx*t,y:a.y+dy*t,story:el.story,heading:headingOf(dx,dy),fx,fy,rx:-fy,ry:fx};
  }
  function projectOn(el,p){
    let best={s:0,lateral:0,dist:Infinity};
    for(let i=1;i<el.pts.length;i++){const a=el.pts[i-1],b=el.pts[i],dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy,L=Math.sqrt(L2)||1;
      const tr=L2?((p.x-a.x)*dx+(p.y-a.y)*dy)/L2:0,t=clamp(tr,0,1),x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(p.x-x,p.y-y);
      const along=el.cum[i-1]+L*tr,lat=((p.x-a.x)*(-dy/L)+(p.y-a.y)*(dx/L));
      if(d<best.dist)best={s:along,lateral:lat,dist:d,clampedS:el.cum[i-1]+L*t};}
    return best;
  }

  function segmentDir(a,b){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);return L>EPS?{x:dx/L,y:dy/L}:null;}
  function firstDir(el){for(let i=1;i<(el?.pts?.length||0);i++){const d=segmentDir(el.pts[i-1],el.pts[i]);if(d)return d;}return null;}
  function lastDir(el){for(let i=(el?.pts?.length||0)-1;i>0;i--){const d=segmentDir(el.pts[i-1],el.pts[i]);if(d)return d;}return null;}
  function miterVector(prev,next){
    prev=prev||next;next=next||prev;if(!prev&&!next)return {x:0,y:0};
    const n0={x:-prev.y,y:prev.x},n1={x:-next.y,y:next.x},sx=n0.x+n1.x,sy=n0.y+n1.y,den=sx*n0.x+sy*n0.y;
    if(Math.abs(den)<1e-7)return n1;let x=sx/den,y=sy/den,L=Math.hypot(x,y);
    /* A route should not contain a true U-turn vertex, but cap pathological miters so malformed authoring cannot
       throw a lane several metres away. The shared vertex still keeps the offset path continuous. */
    if(!Number.isFinite(L)||L>4){const S=Math.hypot(sx,sy);if(S<EPS)return n1;x=sx/S*4;y=sy/S*4;}
    return {x,y};
  }
  function routeOffsetGeometry(g,route){
    let out=routeOffsetCache.get(route);if(out)return out;const pts=[];
    for(let pi=0;pi<(route?.parts?.length||0);pi++){
      const part=route.parts[pi],el=g.elements.get(part.elementId);if(!el)continue;const cuts=[part.enterS];
      for(const s of el.cum)if(s>part.enterS+EPS&&s<part.exitS-EPS)cuts.push(s);cuts.push(part.exitS);
      for(const s of cuts){const q=poseAt(el,s),rs=part.start+(s-part.enterS),last=pts[pts.length-1];
        if(last&&Math.abs(last.rs-rs)<EPS&&Math.hypot(last.x-q.x,last.y-q.y)<EPS)continue;
        pts.push({x:q.x,y:q.y,rs});}
    }
    if(pts.length<2){out={points:pts};routeOffsetCache.set(route,out);return out;}
    const dirs=[];for(let i=1;i<pts.length;i++)dirs.push(segmentDir(pts[i-1],pts[i])||dirs[dirs.length-1]||{x:0,y:-1});
    const prevCtx=route.startPrevElement?lastDir(g.elements.get(route.startPrevElement)):null;
    const nextCtx=route.loopNextElement?firstDir(g.elements.get(route.loopNextElement)):null;
    for(let i=0;i<pts.length;i++){const prev=i?dirs[i-1]:(prevCtx||dirs[0]),next=i<dirs.length?dirs[i]:(nextCtx||dirs[dirs.length-1]),m=miterVector(prev,next);pts[i].mx=m.x;pts[i].my=m.y;}
    out={points:pts};routeOffsetCache.set(route,out);return out;
  }

  function fromRouteNet(rn){
    const g={schema:'rc-vehicle-graph@0.1',source:'vehicleGraph',trafficSide:'left',elements:new Map(),nodes:new Map(),portals:new Map(),
      parkingAreas:new Map(),spaceAccess:new Map(),edges:[],connectors:[],routes:new Map()};
    const vg=rn&&rn.vehicleGraph;
    if(vg&&typeof vg==='object'){
      g.trafficSide=vg.trafficSide||'left';
      for(const n of vg.nodes||[])g.nodes.set(n.id,{...n,story:Number.isInteger(n.story)?n.story:0});
      for(const e of [...(vg.edges||[])].sort(byId)){const el=makeElement(e,'edge',e.centerPath||[],e.story);g.elements.set(el.id,el);g.edges.push(el);}
      for(const c of [...(vg.connectors||[])].sort(byId)){const el=makeElement(c,'connector',c.path||[],c.story);g.elements.set(el.id,el);g.connectors.push(el);}
      for(const p of vg.portals||[])g.portals.set(p.id,{...p});
      for(const a of vg.parkingAreas||[])g.parkingAreas.set(a.id,{...a,spaceIds:[...(a.spaceIds||[])]});
      for(const x of vg.spaceAccess||[])g.spaceAccess.set(x.spaceId,{...x});
    }else{
      g.source='traffic-fallback';
      for(const t of [...(rn?.traffic||[])].filter(t=>Array.isArray(t.points)&&t.points.length>=2).sort(byId)){
        const a=t.points[0],z=t.points[t.points.length-1],story=Number.isInteger(t.story)?t.story:(Number.isInteger(a.story)?a.story:0);
        const n0={id:t.id+'__start',kind:'area_entry',x:a.x,y:a.y,story},n1={id:t.id+'__end',kind:'area_exit',x:z.x,y:z.y,story};g.nodes.set(n0.id,n0);g.nodes.set(n1.id,n1);
        const el=makeElement({id:t.id,kind:'road_lane',laneFamily:t.id,story,fromNode:n0.id,toNode:n1.id,
          speedPolicy:{cruise:Number.isFinite(t.cruiseSpeed)?t.cruiseSpeed:Number.isFinite(t.speed)?t.speed:8.5,min:t.cruiseMin,max:t.cruiseMax}},'edge',t.points,story);
        const h=poseAt(el,0).heading;el.direction=['north','east','south','west'][Math.round(h/90)%4];
        g.elements.set(el.id,el);g.edges.push(el);
        g.portals.set(t.id+'__entry',{id:t.id+'__entry',node:n0.id,role:'entry',kind:'lane_end',laneFamily:t.id});
        g.portals.set(t.id+'__exit',{id:t.id+'__exit',node:n1.id,role:'exit',kind:'lane_end',laneFamily:t.id});
      }
      for(const sp of rn?.parking?.spaces||[]){const el=g.elements.get(sp.adjacentTrafficLane);if(!el)continue;
        const aid=`parea_${sp.blockId||sp.adjacentTrafficLane}_${sp.side||'curb'}`;if(!g.parkingAreas.has(aid))g.parkingAreas.set(aid,{id:aid,blockId:sp.blockId||null,side:sp.side||null,accessEdge:el.id,spaceIds:[]});
        g.parkingAreas.get(aid).spaceIds.push(sp.id);const pin=sp.maneuver?.pullInPath||[],pout=sp.maneuver?.pullOutPath||[];
        g.spaceAccess.set(sp.id,{spaceId:sp.id,areaId:aid,accessEdge:el.id,approachS:pin.length?projectOn(el,pin[0]).s:null,departS:pout.length?projectOn(el,pout[pout.length-1]).s:null});}
      for(const a of g.parkingAreas.values())a.spaceIds.sort();
    }
    /* topology: edge -> connectors leaving it (and edges starting at its end node); connector -> its toEdge */
    for(const el of g.elements.values()){
      if(el.type==='edge'){for(const c of g.connectors)if(c.fromEdge===el.id)el.next.push(c.id);for(const e of g.edges)if(e!==el&&e.fromNode&&e.fromNode===el.toNode)el.next.push(e.id);}
      else if(el.toEdge&&g.elements.has(el.toEdge))el.next.push(el.toEdge);
      el.next.sort();}
    for(const el of g.elements.values())for(const n of el.next)g.elements.get(n).prev.push(el.id);
    for(const el of g.elements.values())el.prev.sort();
    for(const p of g.portals.values()){const n=g.nodes.get(p.node);if(n){p.x=n.x;p.y=n.y;p.story=n.story;}}
    g.entryPortals=[...g.portals.values()].filter(p=>p.role==='entry').map(p=>p.id).sort();
    g.exitPortals=[...g.portals.values()].filter(p=>p.role==='exit').map(p=>p.id).sort();
    g.laneFamilies=[...new Set(g.edges.map(e=>e.laneFamily).filter(Boolean))].sort();
    g.poseAt=(id,s)=>poseAt(g.elements.get(id),s);
    g.project=(id,p)=>projectOn(g.elements.get(id),p);
    g.routeFrom=portalId=>routeFrom(g,portalId);
    g.validate=()=>validate(g);
    return g;
  }

  /* A route = ordered "parts": {elementId, enterS, exitS, start}. Most authored traffic still uses routeFrom(),
     whose branch rule stays byte-for-byte compatible in meaning: deterministic first-id choice. V2 external driving adds
     routeFromElement(), which may choose ONE upcoming branch by left / straight / right preference, then falls back to
     the same deterministic first-id rule. This keeps route choice separate from lateral steering. */
  function branchLabel(g,fromEl,nextId){
    const n=g.elements.get(nextId);if(!fromEl||!n)return null;const text=((n.kind||'')+' '+(n.id||'')).toLowerCase();
    if(/(^|[_\s-])left($|[_\s-])/.test(text))return 'left';if(/(^|[_\s-])right($|[_\s-])/.test(text))return 'right';if(/(^|[_\s-])straight($|[_\s-])/.test(text))return 'straight';
    const a=poseAt(fromEl,Math.max(0,fromEl.len-1e-4)).heading,b=poseAt(n,Math.min(n.len,1e-4)).heading,d=wrap(b-a);
    return Math.abs(d)<=35?'straight':d>0?'right':'left';
  }
  function chooseNext(g,fromEl,preference=null){
    const ids=[...(fromEl?.next||[])].sort();if(!ids.length)return null;if(ids.length===1||!['left','straight','right'].includes(preference))return ids[0];
    const target=preference==='left'?-90:preference==='right'?90:0,a=poseAt(fromEl,Math.max(0,fromEl.len-1e-4)).heading;
    return ids.map(id=>{const n=g.elements.get(id),label=branchLabel(g,fromEl,id),b=n?poseAt(n,Math.min(n.len,1e-4)).heading:a,d=wrap(b-a);
      return {id,score:(label===preference?0:100)+Math.abs(wrap(d-target))};}).sort((x,y)=>x.score-y.score||x.id.localeCompare(y.id))[0].id;
  }
  function finishRoute(g,id,entryPortal,parts,laneFamily,loopNextElement=null,startPrevElement=null){
    if(!parts.length)return null;const elements=parts.map(q=>q.elementId),last=g.elements.get(elements[elements.length-1]);
    const exit=[...g.portals.values()].find(q=>q.role==='exit'&&last&&q.node===last.toNode)||null;
    const loopNext=loopNextElement&&g.elements.has(loopNextElement)?loopNextElement:null;
    const prev=startPrevElement&&g.elements.has(startPrevElement)?startPrevElement:null;
    return {id,entryPortal:entryPortal||null,exitPortal:exit?exit.id:null,isLoop:!!loopNext,loopNextElement:loopNext,startPrevElement:prev,laneFamily:laneFamily||g.elements.get(elements[0])?.laneFamily||null,
      parts,elements,starts:parts.map(q=>q.start),total:parts.reduce((n,q)=>n+(q.exitS-q.enterS),0),
      minHalfWidth:Math.min(...elements.map(eid=>g.elements.get(eid).halfWidth)),
      multiLane:elements.some(eid=>!!g.elements.get(eid).lanes),
      tags:[...new Set(elements.flatMap(eid=>g.elements.get(eid).tags))].sort(),
      hasTurn:elements.some(eid=>/turn|left|right/.test(g.elements.get(eid).kind||'')),
      allMainStreet:g.source==='traffic-fallback'||elements.every(eid=>g.elements.get(eid).tags.includes('main_street'))};
  }
  function routeFrom(g,portalId){
    if(g.routes.has(portalId))return g.routes.get(portalId);
    const p=g.portals.get(portalId);if(!p||p.role!=='entry')return null;
    let el=g.edges.filter(e=>e.fromNode===p.node).sort(byId)[0]||null;const parts=[],seen=new Set();let total=0;
    while(el&&!seen.has(el.id)){seen.add(el.id);parts.push({elementId:el.id,enterS:0,exitS:el.len,start:total});total+=el.len;el=el.next.length?g.elements.get(el.next[0]):null;}
    const r=finishRoute(g,portalId,portalId,parts,p.laneFamily,el&&seen.has(el.id)?el.id:null);if(r)g.routes.set(portalId,r);return r;
  }
  function routeFromElement(g,elementId,enterS=0,preference=null,startPrevElement=null){
    let el=g.elements.get(elementId);if(!el)return null;enterS=clamp(Number.isFinite(enterS)?enterS:0,0,el.len);
    const parts=[],seen=new Set();let total=0,first=true,usedPreference=false;
    while(el&&!seen.has(el.id)){seen.add(el.id);const a=first?enterS:0;parts.push({elementId:el.id,enterS:a,exitS:el.len,start:total});total+=el.len-a;first=false;
      let next=null;if(el.next.length>1&&!usedPreference&&['left','straight','right'].includes(preference)){next=chooseNext(g,el,preference);usedPreference=true;}else next=el.next.length?[...el.next].sort()[0]:null;
      el=next?g.elements.get(next):null;}
    const key=`dynamic:${elementId}:${Math.round(enterS*1000)}:${preference||'default'}:${startPrevElement||'entry'}:${parts.map(q=>q.elementId).join('>')}`;
    return finishRoute(g,key,null,parts,g.elements.get(elementId)?.laneFamily||null,el&&seen.has(el.id)?el.id:null,startPrevElement);
  }
  function nextBranch(g,route,rs,preference=null){
    if(!route?.parts?.length)return null;const L=locate(g,route,rs);
    for(let i=L.index;i<route.parts.length;i++){const el=g.elements.get(route.parts[i].elementId);if(!el||el.next.length<=1)continue;
      const selected=route.parts[i+1]?.elementId||null,desired=chooseNext(g,el,preference);return {elementId:el.id,index:i,selected,desired,preference,options:[...el.next].sort().map(id=>({elementId:id,kind:branchLabel(g,el,id)}))};}
    return null;
  }
  function locate(g,route,rs){
    rs=clamp(rs,0,route.total);let i=route.parts.length-1;while(i>0&&route.parts[i].start>rs)i--;
    const q=route.parts[i];return {index:i,elementId:q.elementId,s:q.enterS+(rs-q.start)};
  }
  function poseOnRoute(g,route,rs,lateral=0){
    const L=locate(g,route,rs),q=poseAt(g.elements.get(L.elementId),L.s);
    if(Math.abs(lateral)<EPS)return {...q,elementId:L.elementId,s:L.s,index:L.index};
    const geom=routeOffsetGeometry(g,route),P=geom.points;if(!P||P.length<2)return {...q,x:q.x+q.rx*lateral,y:q.y+q.ry*lateral,elementId:L.elementId,s:L.s,index:L.index};
    rs=clamp(rs,0,route.total);let i=1;while(i<P.length-1&&P[i].rs<rs)i++;const a=P[i-1],b=P[i],span=b.rs-a.rs,t=span>EPS?(rs-a.rs)/span:0;
    const x=a.x+(b.x-a.x)*t+lateral*(a.mx+(b.mx-a.mx)*t),y=a.y+(b.y-a.y)*t+lateral*(a.my+(b.my-a.my)*t);
    let dx=(b.x-a.x)+lateral*(b.mx-a.mx),dy=(b.y-a.y)+lateral*(b.my-a.my),len=Math.hypot(dx,dy);if(len<EPS){dx=q.fx;dy=q.fy;len=1;}
    const fx=dx/len,fy=dy/len,rx=-fy,ry=fx;return {x,y,story:q.story,heading:headingOf(dx,dy),fx,fy,rx,ry,elementId:L.elementId,s:L.s,index:L.index};
  }
  /* Nearest point of a route to p, limited to route distances [from, to]. */
  function projectOnRoute(g,route,p,from=0,to=Infinity){
    let best=null;
    for(let i=0;i<route.parts.length;i++){const part=route.parts[i],el=g.elements.get(part.elementId),len=part.exitS-part.enterS;if(part.start>to||part.start+len<from)continue;
      const q=projectOn(el,p);if(q.s<part.enterS-1e-9||q.s>part.exitS+1e-9)continue;const rs=part.start+(q.s-part.enterS);if(rs<from-1e-9||rs>to+1e-9)continue;
      if(!best||q.dist<best.dist)best={rs,lateral:q.lateral,dist:q.dist,index:i,elementId:el.id,halfWidth:el.halfWidth};}
    return best;
  }
  function validate(g){
    const problems=[];
    for(const el of g.elements.values()){if(el.pts.length<2)problems.push(`${el.id}: path needs 2 points`);if(!(el.len>0))problems.push(`${el.id}: zero length`);if(el.lanes){if(el.lanes.centers.some(x=>Math.abs(x)>=el.halfWidth))problems.push(`${el.id}: lane centre lies outside corridor`);if(new Set(el.lanes.centers.map(x=>x.toFixed(6))).size!==el.lanes.count)problems.push(`${el.id}: lane centres must be unique`);}}
    for(const pid of g.entryPortals){const r=routeFrom(g,pid);if(!r||!r.parts.length)problems.push(`${pid}: no route`);else if(!r.exitPortal&&!r.isLoop)problems.push(`${pid}: route has no exit portal`);
      else {for(let i=1;i<r.parts.length;i++){const A=r.parts[i-1],B=r.parts[i],a=g.elements.get(A.elementId),b=g.elements.get(B.elementId),pa=poseAt(a,A.exitS),pb=poseAt(b,B.enterS);
        if(Math.hypot(pa.x-pb.x,pa.y-pb.y)>1e-6)problems.push(`${pid}: ${a.id} and ${b.id} do not meet`);}
        if(r.isLoop&&r.loopNextElement){const A=r.parts[r.parts.length-1],a=g.elements.get(A.elementId),b=g.elements.get(r.loopNextElement),pa=poseAt(a,A.exitS),pb=poseAt(b,0);
          if(!b||Math.hypot(pa.x-pb.x,pa.y-pb.y)>1e-6)problems.push(`${pid}: loop seam ${a.id} -> ${r.loopNextElement} does not meet`);}}
    }
    return problems;
  }
  return Object.freeze({SCHEMA:'rc-vehicle-graph@0.1',fromRouteNet,routeFrom,routeFromElement,nextBranch,chooseNext,branchLabel,locate,poseAt,projectOn,poseOnRoute,projectOnRoute,laneIndexFor,laneCenter,validate,headingOf,norm});
});
