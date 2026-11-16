/* Room Creator 0.16.1 — traffic signals for the Vehicle World (routeNet.vehicleTraffic.signals, rc-vehicle-traffic@0.1).
   A signal controls authored vehicle MOVEMENTS: each group binds connector ids, each phase gives every group a state
   (GREEN / YELLOW / RED / OFF). Fixed timing only: the state at a world tick depends on nothing but that tick, the
   signal's offset and its phase durations (no clock, no timers, no randomness). Durations are rounded to whole fixed
   steps (1/240 s by default) so phase boundaries are exact.
   This module only supplies control state. Vehicle World decides what drivers perceive and how they brake. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RCVehicleSignals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STATES=Object.freeze(['GREEN','YELLOW','RED','OFF']);
  const DEFAULT_TIMING=Object.freeze({green:14,yellow:3,red:8,offsetStep:4});
  const byId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;

  /* Reference findings (structure is checked by core.validateVehicleTraffic). */
  function validateRefs(signals,graph,intersectionIds){
    const out=[],owner=new Map(),ix=intersectionIds?new Set(intersectionIds):null;
    for(const s of signals||[]){
      if(s.intersectionId!=null&&ix&&!ix.has(s.intersectionId))out.push({level:'error',code:'unknown_intersection',path:`signals.${s.id}`,message:`Signal "${s.id}" names unknown intersection "${s.intersectionId}".`});
      for(const g of s.groups||[])for(const c of g.connectorIds||[]){
        if(graph&&!(graph.elements.get(c)?.type==='connector'))out.push({level:'error',code:'unknown_connector',path:`signals.${s.id}.groups.${g.id}`,message:`Group "${g.id}" of signal "${s.id}" names unknown connector "${c}" (shown as a broken reference; the movement is uncontrolled).`});
        else if(owner.has(c)&&owner.get(c)!==s.id)out.push({level:'warning',code:'connector_in_two_signals',path:`signals.${s.id}`,message:`Connector "${c}" is controlled by both "${owner.get(c)}" and "${s.id}"; the first by id is used.`});
        else owner.set(c,s.id);}
    }
    return out;
  }

  function compile(signals,graph,{fixedStep=1/240,stopLineBuffer=.5}={}){
    const toTicks=sec=>Math.max(1,Math.round(sec/fixedStep));
    const controllers=[],byConnector=new Map(),byId_=new Map();
    for(const s of [...(signals||[])].sort(byId)){
      const phases=(s.phases||[]).map(p=>({id:p.id,label:p.label||p.id,durationSeconds:p.durationSeconds,ticks:toTicks(p.durationSeconds),states:{...(p.states||{})}}));
      const starts=[];let cycle=0;for(const p of phases){starts.push(cycle);cycle+=p.ticks;}
      const groups=(s.groups||[]).map(g=>{const ok=[],broken=[];for(const c of g.connectorIds||[])(graph&&graph.elements.get(c)?.type==='connector'?ok:broken).push(c);return {id:g.id,label:g.label||g.id,connectorIds:ok,brokenConnectorIds:broken};});
      const ctl={id:s.id,label:s.label||s.id,intersectionId:s.intersectionId??null,enabled:s.enabled!==false,mode:s.mode||'fixed',
        offsetTicks:Math.round((Number.isFinite(s.offsetSeconds)?s.offsetSeconds:0)/fixedStep),phases,starts,cycleTicks:cycle,groups};
      controllers.push(ctl);byId_.set(ctl.id,ctl);
      for(const g of groups)for(const c of g.connectorIds)if(!byConnector.has(c))byConnector.set(c,{signalId:ctl.id,groupId:g.id});
    }
    function phaseIndexAt(ctl,tick){
      if(!ctl.cycleTicks)return {index:-1,elapsed:0};
      let local=(tick-ctl.offsetTicks)%ctl.cycleTicks;if(local<0)local+=ctl.cycleTicks;
      let i=ctl.phases.length-1;while(i>0&&ctl.starts[i]>local)i--;return {index:i,elapsed:local-ctl.starts[i]};
    }
    function stateAt(signalId,tick){
      const ctl=byId_.get(signalId);if(!ctl)return null;
      const groupStates={};
      if(!ctl.enabled||!ctl.phases.length){for(const g of ctl.groups)groupStates[g.id]='OFF';return {signalId,phaseId:null,phaseIndex:-1,phaseElapsed:0,phaseRemaining:0,groupStates,enabled:false};}
      const {index,elapsed}=phaseIndexAt(ctl,tick),ph=ctl.phases[index];
      for(const g of ctl.groups)groupStates[g.id]=STATES.includes(ph.states[g.id])?ph.states[g.id]:'OFF';
      return {signalId,phaseId:ph.id,phaseLabel:ph.label,phaseIndex:index,phaseElapsed:elapsed*fixedStep,phaseRemaining:(ph.ticks-elapsed)*fixedStep,groupStates,enabled:true};
    }
    function connectorState(connectorId,tick){
      const b=byConnector.get(connectorId);if(!b)return null;const st=stateAt(b.signalId,tick);
      return {signalId:b.signalId,groupId:b.groupId,state:st.groupStates[b.groupId]||'OFF',phaseId:st.phaseId};
    }
    /* first tick (≤ tick) at which the group's current state began — used for "red for N s" in violation events */
    function stateSince(signalId,groupId,tick){
      const ctl=byId_.get(signalId);if(!ctl||!ctl.enabled||!ctl.cycleTicks)return tick;
      const cur=stateAt(signalId,tick).groupStates[groupId];let t=tick,guard=0;
      while(guard++<ctl.phases.length+1){const {index,elapsed}=phaseIndexAt(ctl,t),start=t-elapsed;if(start<=0)return 0;
        const prev=ctl.phases[(index-1+ctl.phases.length)%ctl.phases.length];if((prev.states[groupId]||'OFF')!==cur)return start;t=start-1;}
      return t;
    }
    /* Presentation: one signal head per controlled approach, just before the stop line, on the road side away from
       other vehicle lanes, facing approaching traffic. Never a physical blocker. */
    function heads(){
      const out=[];if(!graph)return out;
      for(const ctl of controllers)for(const g of ctl.groups)for(const cid of g.connectorIds){
        const c=graph.elements.get(cid),from=c&&graph.elements.get(c.fromEdge);if(!from)continue;
        const stopS=Math.max(0,from.len-stopLineBuffer),q=graph.poseAt(from.id,stopS),back=graph.poseAt(from.id,Math.max(0,stopS-.6));
        const off=from.halfWidth+2.6,cands=[1,-1].map(side=>({side,x:back.x+back.rx*off*side,y:back.y+back.ry*off*side}));
        const clearance=p=>{let d=Infinity;for(const e of graph.edges)if(e.id!==from.id&&e.story===from.story){const pr=graph.project(e.id,p);d=Math.min(d,pr.dist);}return d;};
        const pick=cands.sort((a,b)=>clearance(b)-clearance(a)||a.side-b.side)[0];
        out.push({id:`head_${ctl.id}_${cid}`,signalId:ctl.id,groupId:g.id,connectorId:cid,approachEdge:from.id,x:pick.x,y:pick.y,story:from.story,
          facing:(q.heading+180)%360,stopLine:{x0:q.x-q.rx*from.halfWidth,y0:q.y-q.ry*from.halfWidth,x1:q.x+q.rx*from.halfWidth,y1:q.y+q.ry*from.halfWidth}});
      }
      return out;
    }
    return {controllers,byConnector,stopLineBuffer,fixedStep,stateAt,connectorState,stateSince,heads,
      states:tick=>controllers.map(c=>stateAt(c.id,tick))};
  }

  /* Default: one signal per intersection that has straight-through connectors, one group binding them all,
     GREEN 14 / YELLOW 3 / RED 8 s, offsets 0, 4, 8, 12 … s in intersection order. Demo values, not tuning. */
  function defaultSignals(graph,timing=DEFAULT_TIMING){
    const byIx=new Map();
    for(const c of graph?.connectors||[])if(c.intersectionId&&c.kind==='intersection_straight'){if(!byIx.has(c.intersectionId))byIx.set(c.intersectionId,[]);byIx.get(c.intersectionId).push(c.id);}
    return [...byIx.keys()].sort().map((ix,i)=>{const gid=`siggrp_${ix}_main`;return {id:`signal_${ix}`,label:ix.replace(/^intersection_/,'Intersection '),intersectionId:ix,enabled:true,mode:'fixed',
      offsetSeconds:i*timing.offsetStep,groups:[{id:gid,label:'Main street through',connectorIds:byIx.get(ix).sort()}],
      phases:[{id:'main_green',label:'Main green',durationSeconds:timing.green,states:{[gid]:'GREEN'}},
        {id:'main_yellow',label:'Main yellow',durationSeconds:timing.yellow,states:{[gid]:'YELLOW'}},
        {id:'main_red',label:'Main red',durationSeconds:timing.red,states:{[gid]:'RED'}}]};});
  }
  return Object.freeze({STATES,DEFAULT_TIMING,validateRefs,compile,defaultSignals});
});
