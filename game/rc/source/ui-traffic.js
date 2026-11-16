// ------------------------------------------------------------------ 0.16.1 Traffic authoring pane (Control · Units · Flows · Signals)
/* Edits routeNet.vehicleTraffic (rc-vehicle-traffic@0.1) through mutate() → validateBundle, so every change is undoable and
   saved with the scene. The editor also refuses a change that would ADD a reference error (unknown class, portal, lane
   family, connector or intersection) — errors already in a file are shown as broken references instead.
   During Route Walk the left panel shows trafficPreviewPanel(): live, logged world commands that never change the saved scene. */
let TFstate={tab:'control',edit:null,spawnMsg:'',spawnUnit:'unit_civilian_sedan',spawnPortal:'auto'};
const tfTR=()=>globalThis.RCVehicleTraffic,tfSG=()=>globalThis.RCVehicleSignals,tfG=()=>globalThis.RCVehicleGraph,tfK=()=>globalThis.RCVehicleClasses;
function tfNet(){return project.routeNet||null;}
function tfGraph(){const n=tfNet();return n&&n.vehicleGraph&&tfG()?tfG().fromRouteNet(n):null;}
function tfClasses(){return tfK()?tfK().resolve(tfNet()?.vehicleLoop?.classes):{};}
function tfIntersectionIds(){return (tfNet()?.blockComposer?.intersections||[]).map(i=>i.id);}
function tfFindings(vt,graph=tfGraph()){return vt&&tfTR()?tfTR().validate(vt,{classes:tfClasses(),graph,intersectionIds:tfIntersectionIds()}):[];}
function tfKey(f){return f.code+'|'+f.path+'|'+f.message;}
function tfEdit(fn,label){
  const net=tfNet();if(!net)return false;const before=new Set(tfFindings(net.vehicleTraffic).filter(f=>f.level==='error').map(tfKey));
  return mutate(()=>{fn(project.routeNet.vehicleTraffic,project.routeNet);const added=tfFindings(project.routeNet.vehicleTraffic).filter(f=>f.level==='error'&&!before.has(tfKey(f)));if(added.length)throw Error(added[0].message);},label);
}
const tfList=s=>[...new Set(String(s||'').split(',').map(x=>x.trim()).filter(Boolean))];
const tfUid=(prefix,taken)=>{let i=1;while(taken.has(`${prefix}_${i}`))i++;return `${prefix}_${i}`;};
function tfPortalName(g,id){const p=g?.portals.get(id),fam=p?.laneFamily,dir=fam==='traffic_e'?'eastbound':fam==='traffic_w'?'westbound':(fam||'');return p?`${id.includes('west')?'West':id.includes('east')?'East':''} street end · ${dir} ${p.role}`.trim():id;}
function tfConnectorName(g,id){const c=g?.elements.get(id);if(!c)return id;const ix=(c.intersectionId||'').replace(/^intersection_/,'Intersection ');return `${ix||'Connector'} · ${c.direction||''}bound ${String(c.kind||'').replace(/^intersection_/,'')}`;}
function tfMeterValue(vt){return tfTR()?tfTR().meterValue(vt?.meter):.5;}
function tfEffectiveRate(vt){const m=tfMeterValue(vt);return (vt?.flows||[]).filter(f=>f.enabled!==false).reduce((n,f)=>n+tfTR().effective(f,m).vehiclesPerMinute,0);}
function tfCycle(s){return (s.phases||[]).reduce((n,p)=>n+(+p.durationSeconds||0),0);}
function tfChips(a,cls=''){return (a||[]).map(x=>`<span class="tf-chip ${cls}">${esc(x)}</span>`).join('');}

function trafficPane(){
  const net=tfNet(),TR=tfTR(),g=tfGraph();
  const head=`<div class="section"><div class="row"><h2 class="grow">Traffic</h2><span class="badge">VEHICLE WORLD</span></div>`;
  if(!TR||!tfSG()||!tfK())return head+'<p>The traffic modules are missing from this build.</p></div>';
  if(!net||!g)return head+'<p>Traffic needs a street with a vehicle road graph. Build one with <b>+ Block</b> (Block Composer adds the graph automatically).</p></div>';
  const world=net.vehicleLoop?.runtime==='world',vt=net.vehicleTraffic;
  let html=head+`<p>Authoring layer over the Vehicle World: <b>units</b> (kinds of traffic that reference a vehicle class), <b>flows</b> (how they arrive), the <b>meter</b> (how much traffic) and <b>signals</b>. Cars always drive themselves.</p>
    <label class="check"><input type="checkbox" data-tf-toggle="runtime" ${world?'checked':''}>Use the Vehicle World runtime for this scene</label>`;
  if(!vt)return html+`<div class="info">No authored traffic yet. The Vehicle World uses its generic spawner.</div><button class="primary block" data-tf-act="setup">Set up traffic (catalogue, two flows, signals)</button></div>`;
  html+=`<label class="check"><input type="checkbox" data-tf-toggle="enabled" ${vt.enabled===true?'checked':''}>Authored traffic on (flows and signals; off = generic spawner)</label>
    <button class="block" data-tf-act="preview" ${world?'':'disabled'}>▶ Preview in Route Walk</button>${world?'':'<p class="subtle">Turn on the Vehicle World runtime to preview.</p>'}</div>`;
  const tabs=[['control','Control'],['units','Units'],['flows','Flows'],['signals','Signals']];
  html+=`<div class="section"><div class="button-row tf-tabs">${tabs.map(([k,l])=>`<button data-tf-tab="${k}" class="${TFstate.tab===k?'active':''}">${l}</button>`).join('')}</div></div>`;
  const findings=tfFindings(vt,g);
  if(findings.length)html+=`<div class="section"><h3>Check</h3>${findings.map(f=>`<div class="info ${f.level==='error'?'warn':''}">${f.level==='error'?'Broken reference: ':f.level==='info'?'Note: ':''}${esc(f.message)}</div>`).join('')}</div>`;
  html+=TFstate.tab==='units'?tfUnitsTab(vt,g):TFstate.tab==='flows'?tfFlowsTab(vt,g):TFstate.tab==='signals'?tfSignalsTab(vt,g):tfControlTab(vt,g);
  return html;
}
function tfControlTab(vt,g){
  const TR=tfTR(),m=tfMeterValue(vt),preset=vt.meter?.preset&&vt.meter.preset!=='custom'?vt.meter.preset:TR.meterFor(m).preset,flows=(vt.flows||[]).filter(f=>f.enabled!==false);
  return `<div class="section"><h3>Traffic control</h3><div class="tf-meter-label">${esc(TR.PRESET_LABELS[preset])}</div>
    <div class="button-row tf-presets">${TR.PRESET_ORDER.map(k=>`<button data-tf-meter="${k}" class="${preset===k?'active':''}">${esc(TR.PRESET_LABELS[k])}</button>`).join('')}</div>
    <div class="range-field"><label>Density (%)</label><div class="range-controls"><input type="range" min="0" max="100" step="1" value="${Math.round(m*100)}" data-tf-meter-slider="1"><input type="number" min="0" max="100" step="1" value="${Math.round(m*100)}" data-tf-meter-slider="1"></div></div>
    <table class="rw-table"><tr><td>Enabled flows</td><td><b>${flows.length}</b></td></tr><tr><td>Effective arrival rate</td><td><b>${tfEffectiveRate(vt).toFixed(1)}</b> veh/min</td></tr>
    <tr><td>Live counts</td><td>in the Route Walk panel while previewing</td></tr></table>
    <p class="subtle">The meter scales how much traffic the flows <i>request</i> (rate, startup cars, per-flow caps). It never changes braking, reaction, speed, signals or parking, and it is pressure, not an exact car count: cars only appear when there is physical room.</p></div>`;
}
function tfUnitsTab(vt,g){
  const cls=tfClasses(),units=vt.units||[],deps=id=>tfTR().dependents(vt,id);
  const row=u=>{const c=cls[u.classId];if(TFstate.edit==='unit:'+u.id)return tfUnitForm(u,cls);
    return `<div class="list-card tf-card ${u.enabled===false?'muted':''}"><div class="row"><strong class="grow">${esc(u.label)}</strong><label class="check"><input type="checkbox" data-tf-unit-enabled="${esc(u.id)}" ${u.enabled===false?'':'checked'}>on</label></div>
      <small>${c?`${esc(c.label)} · capacity <b>${c.occupantCapacity}</b> (from class)`:`<span class="warn">unknown class "${esc(u.classId)}"</span>`} · role ${esc(u.role||'—')}</small>
      <div>${tfChips(u.classifications,'c')}${tfChips(u.tags)}${tfChips(u.capabilities,'cap')}${tfChips(u.abilities,'ab')}</div>
      <div class="button-row"><button data-tf-spawn="${esc(u.id)}" ${u.enabled===false?'disabled':''}>Spawn one</button><button data-tf-edit="unit:${esc(u.id)}">Edit</button><button data-tf-dup-unit="${esc(u.id)}">Duplicate</button><button data-tf-del-unit="${esc(u.id)}" title="${deps(u.id).length?'Used by '+deps(u.id).join(', '):'Delete'}">Delete</button></div></div>`;};
  return `<div class="section"><div class="row"><h3 class="grow">Traffic units · ${units.length}</h3><button data-tf-act="add-unit">+ Add unit</button></div>
    <p class="subtle">A unit references a vehicle class; capacity and size always come from the class. Tags, capabilities and abilities are free metadata in this version.</p>
    ${TFstate.spawnMsg?`<div class="info">${esc(TFstate.spawnMsg)}${RW.on?'':' <button data-tf-act="preview">▶ Preview</button>'}</div>`:''}${units.map(row).join('')||'<p>No units.</p>'}</div>`;
}
function tfUnitForm(u,cls){
  return `<div class="list-card tf-form" data-tf-form="unit:${esc(u.id)}"><label>Label<input data-tf-field="label" value="${esc(u.label)}"></label>
    <label>Vehicle class<select data-tf-field="classId">${Object.values(cls).map(c=>`<option value="${esc(c.id)}" ${c.id===u.classId?'selected':''}>${esc(c.label)} · capacity ${c.occupantCapacity}</option>`).join('')}${cls[u.classId]?'':`<option value="${esc(u.classId)}" selected>${esc(u.classId)} (unknown)</option>`}</select></label>
    <label>Role<input data-tf-field="role" value="${esc(u.role||'')}"></label>
    ${['classifications','tags','capabilities','abilities'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)} (comma-separated)<input data-tf-field="${k}" value="${esc((u[k]||[]).join(', '))}"></label>`).join('')}
    <label>Notes<input data-tf-field="notes" value="${esc(u.notes||'')}"></label><label class="check"><input type="checkbox" data-tf-field="enabled" ${u.enabled===false?'':'checked'}>Enabled</label>
    <div class="button-row"><button class="primary" data-tf-save="unit:${esc(u.id)}">Save</button><button data-tf-edit="">Cancel</button></div><p class="subtle">Id <code>${esc(u.id)}</code> stays the same when the label changes.</p></div>`;
}
function tfFlowsTab(vt,g){
  const flows=vt.flows||[],m=tfMeterValue(vt),units=new Map((vt.units||[]).map(u=>[u.id,u]));
  const W=RW.on&&RW.vehicleWorld?RW.vehicleWorld.snapshot():null;
  const row=f=>{if(TFstate.edit==='flow:'+f.id)return tfFlowForm(f,vt,g);const e=tfTR().effective(f,m),sc=f.scope||{};
    const active=W?.traffic?.flows?.find(x=>x.flowId===f.id)?.active;
    return `<div class="list-card tf-card ${f.enabled===false?'muted':''}"><div class="row"><strong class="grow">${esc(f.label)}</strong><label class="check"><input type="checkbox" data-tf-flow-enabled="${esc(f.id)}" ${f.enabled===false?'':'checked'}>on</label></div>
      <small>Scope: ${(sc.entryPortals||[]).length?(sc.entryPortals||[]).map(p=>esc(tfPortalName(g,p))).join(', '):'all entries'}${(sc.laneFamilies||[]).length?' · lanes '+sc.laneFamilies.map(esc).join(', '):''}</small>
      <small>Effective <b>${(f.enabled===false?0:e.vehiclesPerMinute).toFixed(1)}</b> veh/min (${f.spawn?.vehiclesPerMinute??0} × meter ${Math.round(m*100)}% × ${f.densityMultiplier??1}) · start ${e.initialCount} · cap ${e.maxActive}${active!=null?` · active ${active}`:''}</small>
      <small>Mix: ${(f.mix||[]).map(x=>`${esc(units.get(x.unitId)?.label||x.unitId)} ${x.weight}`).join(' · ')||'—'}</small>
      <div class="button-row"><button data-tf-edit="flow:${esc(f.id)}">Edit</button><button data-tf-dup-flow="${esc(f.id)}">Duplicate</button><button data-tf-del-flow="${esc(f.id)}">Delete</button></div></div>`;};
  return `<div class="section"><div class="row"><h3 class="grow">Traffic flows · ${flows.length}</h3><button data-tf-act="add-flow">+ Add flow</button></div>
    <p class="subtle">A flow continuously requests units at its entry portals. Deleting or disabling a flow stops future arrivals; cars already on the road stay.</p>${flows.map(row).join('')||'<p>No flows.</p>'}</div>`;
}
function tfFlowForm(f,vt,g){
  const units=vt.units||[],sc=f.scope||{},sp=f.spawn||{};
  const num=(k,label,v,step,min,max)=>`<label>${label}<input type="number" data-tf-num="${k}" value="${v}" step="${step}" ${min!=null?`min="${min}"`:''} ${max!=null?`max="${max}"`:''}></label>`;
  return `<div class="list-card tf-form" data-tf-form="flow:${esc(f.id)}"><label>Label<input data-tf-field="label" value="${esc(f.label)}"></label><label class="check"><input type="checkbox" data-tf-field="enabled" ${f.enabled===false?'':'checked'}>Enabled</label>
    <h4>Entry portals <small>(none ticked = all)</small></h4>${g.entryPortals.map(p=>`<label class="check"><input type="checkbox" data-tf-portal="${esc(p)}" ${(sc.entryPortals||[]).includes(p)?'checked':''}>${esc(tfPortalName(g,p))}</label>`).join('')}
    <h4>Lane families <small>(none ticked = any)</small></h4>${g.laneFamilies.map(l=>`<label class="check"><input type="checkbox" data-tf-family="${esc(l)}" ${(sc.laneFamilies||[]).includes(l)?'checked':''}>${esc(l)}</label>`).join('')}
    <h4>Mix</h4>${(f.mix||[]).map((m,i)=>`<div class="row tf-mix" data-tf-mix="${i}"><select data-tf-mix-unit>${units.map(u=>`<option value="${esc(u.id)}" ${u.id===m.unitId?'selected':''}>${esc(u.label)}</option>`).join('')}${units.some(u=>u.id===m.unitId)?'':`<option value="${esc(m.unitId)}" selected>${esc(m.unitId)} (unknown)</option>`}</select><input type="number" min="0.01" step="1" data-tf-mix-weight value="${m.weight}"><button data-tf-mix-del="${i}" title="Remove">✕</button></div>`).join('')}
    <button data-tf-mix-add="1">+ Add unit to mix</button>
    <div class="form-grid">${num('vehiclesPerMinute','Vehicles / minute (at 100 %)',sp.vehiclesPerMinute??8,.5,0)}${num('jitter','Jitter (0–0.95)',sp.jitter??.15,.05,0,.95)}${num('initialCount','Cars at start',sp.initialCount??0,1,0)}${num('maxActive','Max active',sp.maxActive??6,1,0)}${num('densityMultiplier','Density multiplier',f.densityMultiplier??1,.1,0)}${num('seedOffset','Seed offset',sp.seedOffset??0,1)}${num('blockedRetrySeconds','Retry when blocked (s)',sp.blockedRetrySeconds??.8,.1,.1)}</div>
    <div class="button-row"><button class="primary" data-tf-save="flow:${esc(f.id)}">Save</button><button data-tf-edit="">Cancel</button></div></div>`;
}
function tfSignalsTab(vt,g){
  const sigs=vt.signals||[],used=new Set(sigs.map(s=>s.intersectionId)),free=tfIntersectionIds().filter(i=>!used.has(i));
  const W=RW.on&&RW.vehicleWorld?new Map(RW.vehicleWorld.query('getSignalStates').map(s=>[s.signalId,s])):null;
  const row=s=>{if(TFstate.edit==='signal:'+s.id)return tfSignalForm(s,g);const live=W?.get(s.id);
    return `<div class="list-card tf-card ${s.enabled===false?'muted':''}"><div class="row"><strong class="grow">${esc(s.label||s.id)}</strong><label class="check"><input type="checkbox" data-tf-signal-enabled="${esc(s.id)}" ${s.enabled===false?'':'checked'}>on</label></div>
      <small>${esc(s.intersectionId||'no intersection')} · fixed timing · cycle <b>${tfCycle(s).toFixed(1)} s</b> · offset ${s.offsetSeconds||0} s${live?` · now ${esc(live.phaseId||'off')}`:''}</small>
      ${(s.groups||[]).map(gr=>`<small>${esc(gr.label||gr.id)}: ${gr.connectorIds.map(c=>g.elements.get(c)?esc(tfConnectorName(g,c)):`<span class="warn">broken: ${esc(c)}</span>`).join(', ')||'no connectors'}</small>`).join('')}
      <small>${(s.phases||[]).map(p=>`${esc(p.label||p.id)} ${p.durationSeconds}s`).join(' → ')}</small>
      <div class="button-row"><button data-tf-edit="signal:${esc(s.id)}">Edit</button><button data-tf-copy-timing="${esc(s.id)}" title="Copy this signal's phases and durations to the other signals">Duplicate timing</button><button data-tf-del-signal="${esc(s.id)}">Delete</button></div></div>`;};
  return `<div class="section"><div class="row"><h3 class="grow">Signals · ${sigs.length}</h3></div>
    ${free.length?`<div class="row"><select id="tfNewSignalIx">${free.map(i=>`<option value="${esc(i)}">${esc(i.replace(/^intersection_/,'Intersection '))}</option>`).join('')}</select><button data-tf-act="add-signal">+ Add signal</button></div>`:'<p class="subtle">Every intersection has a signal.</p>'}
    <p class="subtle">A signal controls vehicle <i>movements</i>: each group binds connectors. Today intersections only have straight-through connectors, so RED stops main-street traffic (there is no cross traffic yet). Deleting a signal leaves the connectors uncontrolled.</p>
    ${sigs.map(row).join('')||'<p>No signals.</p>'}</div>`;
}
function tfSignalForm(s,g){
  const conns=g.connectors.map(c=>c.id),states=['GREEN','YELLOW','RED','OFF'];
  return `<div class="list-card tf-form" data-tf-form="signal:${esc(s.id)}"><label>Label<input data-tf-field="label" value="${esc(s.label||'')}"></label><label class="check"><input type="checkbox" data-tf-field="enabled" ${s.enabled===false?'':'checked'}>Enabled</label>
    <label>Offset (s)<input type="number" step="0.5" data-tf-field="offsetSeconds" value="${s.offsetSeconds||0}"></label>
    <h4>Groups (movements)</h4>${(s.groups||[]).map((gr,gi)=>`<div class="tf-group" data-tf-group="${gi}"><label>Group label<input data-tf-group-label value="${esc(gr.label||gr.id)}"></label>
      ${[...new Set([...conns,...gr.connectorIds])].map(c=>`<label class="check ${g.elements.get(c)?'':'warn'}"><input type="checkbox" data-tf-group-conn="${esc(c)}" ${gr.connectorIds.includes(c)?'checked':''}>${g.elements.get(c)?esc(tfConnectorName(g,c)):'broken: '+esc(c)}</label>`).join('')}
      <button data-tf-group-del="${gi}">Remove group</button></div>`).join('')}<button data-tf-group-add="1">+ Add group</button>
    <h4>Phases · cycle ${tfCycle(s).toFixed(1)} s</h4><table class="rw-table tf-phases"><tr><th>Label</th><th>Seconds</th>${(s.groups||[]).map(gr=>`<th>${esc(gr.label||gr.id)}</th>`).join('')}<th></th></tr>
      ${(s.phases||[]).map((p,pi)=>`<tr data-tf-phase="${pi}"><td><input data-tf-phase-label value="${esc(p.label||p.id)}"></td><td><input type="number" min="0.1" step="0.5" data-tf-phase-dur value="${p.durationSeconds}"></td>
        ${(s.groups||[]).map(gr=>`<td><select data-tf-phase-state="${esc(gr.id)}">${states.map(x=>`<option ${p.states?.[gr.id]===x?'selected':''}>${x}</option>`).join('')}</select></td>`).join('')}
        <td><button data-tf-phase-up="${pi}" title="Move up">↑</button><button data-tf-phase-down="${pi}" title="Move down">↓</button><button data-tf-phase-del="${pi}" title="Remove">✕</button></td></tr>`).join('')}</table>
    <button data-tf-phase-add="1">+ Add phase</button>
    <div class="button-row"><button class="primary" data-tf-save="signal:${esc(s.id)}">Save</button><button data-tf-edit="">Cancel</button></div></div>`;
}
/* ---------------- read a form back into a draft object */
function tfFormEl(key){return document.querySelector(`[data-tf-form="${CSS.escape(key)}"]`);}
function tfReadUnit(el,u){const v=k=>el.querySelector(`[data-tf-field="${k}"]`);
  return {...u,label:v('label').value.trim(),classId:v('classId').value,role:v('role').value.trim(),classifications:tfList(v('classifications').value),tags:tfList(v('tags').value),
    capabilities:tfList(v('capabilities').value),abilities:tfList(v('abilities').value),notes:v('notes').value,enabled:v('enabled').checked};}
function tfReadFlow(el,f){const n=k=>Number(el.querySelector(`[data-tf-num="${k}"]`).value);
  const mix=[...el.querySelectorAll('[data-tf-mix]')].map(r=>({unitId:r.querySelector('[data-tf-mix-unit]').value,weight:Number(r.querySelector('[data-tf-mix-weight]').value)}));
  return {...f,label:el.querySelector('[data-tf-field="label"]').value.trim(),enabled:el.querySelector('[data-tf-field="enabled"]').checked,
    scope:{entryPortals:[...el.querySelectorAll('[data-tf-portal]')].filter(x=>x.checked).map(x=>x.dataset.tfPortal),laneFamilies:[...el.querySelectorAll('[data-tf-family]')].filter(x=>x.checked).map(x=>x.dataset.tfFamily)},
    mix,spawn:{...(f.spawn||{}),vehiclesPerMinute:n('vehiclesPerMinute'),jitter:n('jitter'),initialCount:Math.round(n('initialCount')),maxActive:Math.round(n('maxActive')),blockedRetrySeconds:n('blockedRetrySeconds'),seedOffset:Math.round(n('seedOffset'))},
    densityMultiplier:n('densityMultiplier')};}
function tfReadSignal(el,s){
  const groups=[...el.querySelectorAll('[data-tf-group]')].map((ge,gi)=>({id:s.groups[gi]?.id||`${s.id}_grp_${gi+1}`,label:ge.querySelector('[data-tf-group-label]').value.trim()||`Group ${gi+1}`,
    connectorIds:[...ge.querySelectorAll('[data-tf-group-conn]')].filter(x=>x.checked).map(x=>x.dataset.tfGroupConn)}));
  const phases=[...el.querySelectorAll('[data-tf-phase]')].map((pe,pi)=>{const old=s.phases[pi]||{},states={};for(const sel of pe.querySelectorAll('[data-tf-phase-state]'))states[sel.dataset.tfPhaseState]=sel.value;
    const label=pe.querySelector('[data-tf-phase-label]').value.trim()||`Phase ${pi+1}`;return {id:old.id||`phase_${pi+1}`,label,durationSeconds:Number(pe.querySelector('[data-tf-phase-dur]').value),states};});
  return {...s,label:el.querySelector('[data-tf-field="label"]').value.trim(),enabled:el.querySelector('[data-tf-field="enabled"]').checked,offsetSeconds:Number(el.querySelector('[data-tf-field="offsetSeconds"]').value)||0,groups,phases};
}
/* ---------------- Route Walk preview panel: live, logged world commands (never saved) */
function trafficPreviewPanel(){
  const W=RW.vehicleWorld;if(!W)return '';const s=W.snapshot(),t=s.traffic,TR=tfTR();
  let html=`<div class="section"><div class="row"><h3 class="grow">Vehicle World traffic</h3><span class="badge">LIVE</span></div><p class="subtle">${s.counts.moving} moving · ${s.counts.parked} parked · ${s.violations} signal violations. Changes here are logged preview commands; they do not change the saved scene.</p>`;
  if(t.enabled){const p=TR.meterFor(t.meter).preset;
    html+=`<div class="button-row tf-presets">${TR.PRESET_ORDER.filter(k=>k!=='custom').map(k=>`<button data-tfp-meter="${k}" class="${p===k?'active':''}">${esc(TR.PRESET_LABELS[k])}</button>`).join('')}</div>
      <div class="range-field"><label>Density ${Math.round(t.meter*100)}% (${esc(TR.PRESET_LABELS[p])}) · ${t.aggregateVehiclesPerMinute.toFixed(1)} veh/min</label><div class="range-controls"><input type="range" min="0" max="100" step="1" value="${Math.round(t.meter*100)}" data-tfp-meter-slider="1"></div></div>
      ${t.flows.map(f=>`<label class="check"><input type="checkbox" data-tfp-flow="${esc(f.flowId)}" ${f.enabled?'checked':''}>${esc(f.label)} · ${f.active}/${f.maxActive} active · ${f.effectiveVehiclesPerMinute.toFixed(1)}/min</label>`).join('')}`;}
  else html+=`<div class="info">Authored traffic is off for this scene, so the generic spawner is running.</div>`;
  const units=W.query('getTrafficCatalogue');
  if(units.length){html+=`<h3>Spawn one</h3><div class="row"><select id="tfpUnit">${units.map(u=>`<option value="${esc(u.unitId)}" ${u.unitId===TFstate.spawnUnit?'selected':''} ${u.enabled?'':'disabled'}>${esc(u.label)} · ${esc(u.classLabel||'?')} ${u.occupantCapacity??''}</option>`).join('')}</select>
      <select id="tfpPortal"><option value="auto">Auto portal</option>${W.graph.entryPortals.map(p=>`<option value="${esc(p)}" ${p===TFstate.spawnPortal?'selected':''}>${esc(tfPortalName(W.graph,p))}</option>`).join('')}</select><button data-tfp-act="spawn">Spawn</button></div>
      ${TFstate.spawnMsg?`<div class="info">${esc(TFstate.spawnMsg)}</div>`:''}`;}
  if(s.signals.length)html+=`<h3>Signals</h3>${s.signals.map(x=>`<div class="tf-sig"><span class="sig sig-${(Object.values(x.groupStates)[0]||'OFF').toLowerCase()}">●</span> ${esc(x.label||x.signalId)} · ${esc(x.phaseId||'off')} · ${x.phaseRemaining.toFixed(1)} s</div>`).join('')}`;
  return html+'</div>';
}
const TF_REASON={unknown_unit:'that unit does not exist',unit_disabled:'the unit is disabled',unknown_class:'its vehicle class is unknown',no_eligible_portal:'no entry can take it right now',
  portal_not_eligible:'that portal is not an entry',route_restricted:'its class may not use this route',vehicle_too_wide:'it is too wide for the lane',spawn_gap_blocked:'there is no room at the entry yet',
  max_active:'the street already has the most vehicles allowed',not_world_runtime:'this scene is not using the Vehicle World',entry_in_view:'you can see that entry (cars never pop into view)',traffic_not_enabled:'authored traffic is off'};
function tfSpawnText(r,label){return r.ok?`Spawned ${label} as ${r.vehicleId} at ${r.portalId}.`:`Not spawned: ${TF_REASON[r.reason]||r.reason} (${r.reason}).`;}

/* ---------------- events */
HOOKS.leftRender.push(el=>{if(!RW.on&&pane==='traffic'){el.innerHTML=trafficPane();}});
HOOKS.click.push((e,b)=>{
  const d=b.dataset;
  if(d.tfpMeter){const r=RW.vehicleWorld?.command({type:'setTrafficMeter',preset:d.tfpMeter});if(r&&!r.ok)toast('Meter: '+r.reason);renderLeft();return true;}
  if(d.tfpAct==='spawn'){const u=$('tfpUnit')?.value,p=$('tfpPortal')?.value||'auto';TFstate.spawnUnit=u;TFstate.spawnPortal=p;
    const r=RW.vehicleWorld?RW.vehicleWorld.command({type:'spawnTrafficUnit',unitId:u,...(p==='auto'?{}:{portalId:p})}):{ok:false,reason:'not_world_runtime'};
    TFstate.spawnMsg=tfSpawnText(r,u);renderLeft();return true;}
  if(d.tfTab){TFstate.tab=d.tfTab;TFstate.edit=null;renderLeft();return true;}
  if(d.tfAct==='setup'){const g=tfGraph();if(!g)return true;mutate(()=>{project.routeNet.vehicleTraffic=tfTR().defaultTraffic(g);project.routeNet.vehicleTraffic.enabled=true;},'Set up traffic');return true;}
  if(d.tfAct==='preview'){if(project.routeNet?.vehicleLoop?.runtime!=='world'){toast('Turn on the Vehicle World runtime first (Traffic panel).');return true;}TFstate.spawnMsg='';rwStart();return true;}
  if(d.tfMeter){const TR=tfTR();tfEdit(vt=>{if(d.tfMeter==='custom')vt.meter={preset:'custom',value:TR.meterValue(vt.meter)};else vt.meter={preset:d.tfMeter,value:TR.METER_PRESETS[d.tfMeter]};},'Traffic meter');return true;}
  if(d.tfEdit!==undefined){TFstate.edit=d.tfEdit||null;renderLeft();return true;}
  if(d.tfSpawn){const r=RW.on&&RW.vehicleWorld?RW.vehicleWorld.command({type:'spawnTrafficUnit',unitId:d.tfSpawn}):{ok:false,reason:'not_world_runtime'};
    TFstate.spawnMsg=r.reason==='not_world_runtime'?'Spawn one works in the live preview. Start it with ▶ Preview, then use “Spawn one” in the Route Walk panel.':tfSpawnText(r,d.tfSpawn);renderLeft();return true;}
  if(d.tfAct==='add-unit'){tfEdit(vt=>{const taken=new Set(vt.units.map(u=>u.id)),id=tfUid('unit_custom',taken);vt.units.push({id,label:'New unit',classId:'sedan',enabled:true,role:'',classifications:[],tags:[],capabilities:[],abilities:[],notes:''});TFstate.edit='unit:'+id;},'Add traffic unit');return true;}
  if(d.tfDupUnit){tfEdit(vt=>{const u=vt.units.find(x=>x.id===d.tfDupUnit),taken=new Set(vt.units.map(x=>x.id));vt.units.push({...JSON.parse(JSON.stringify(u)),id:tfUid(u.id+'_copy',taken),label:u.label+' (copy)'});},'Duplicate traffic unit');return true;}
  if(d.tfDelUnit){const deps=tfTR().dependents(project.routeNet.vehicleTraffic,d.tfDelUnit);if(deps.length){toast(`Can't delete: flow${deps.length>1?'s':''} ${deps.join(', ')} still use${deps.length>1?'':'s'} this unit. Remove it from their mix first.`,7000);return true;}
    tfEdit(vt=>{vt.units=vt.units.filter(u=>u.id!==d.tfDelUnit);},'Delete traffic unit');return true;}
  if(d.tfSave){const [kind,id]=d.tfSave.split(/:(.*)/s),el=tfFormEl(d.tfSave);if(!el)return true;
    const ok=tfEdit(vt=>{if(kind==='unit'){const i=vt.units.findIndex(u=>u.id===id);vt.units[i]=tfReadUnit(el,vt.units[i]);}
      else if(kind==='flow'){const i=vt.flows.findIndex(f=>f.id===id);vt.flows[i]=tfReadFlow(el,vt.flows[i]);}
      else if(kind==='signal'){const i=vt.signals.findIndex(s=>s.id===id);vt.signals[i]=tfReadSignal(el,vt.signals[i]);}},`Edit ${kind}`);
    if(ok){TFstate.edit=null;renderLeft();}return true;}
  if(d.tfAct==='add-flow'){tfEdit(vt=>{const taken=new Set(vt.flows.map(f=>f.id)),id=tfUid('flow_custom',taken);vt.flows.push(tfTR().defaultFlow(id,'New flow',null,null));TFstate.edit='flow:'+id;},'Add traffic flow');return true;}
  if(d.tfDupFlow){tfEdit(vt=>{const f=vt.flows.find(x=>x.id===d.tfDupFlow),taken=new Set(vt.flows.map(x=>x.id));vt.flows.push({...JSON.parse(JSON.stringify(f)),id:tfUid(f.id+'_copy',taken),label:f.label+' (copy)'});},'Duplicate traffic flow');return true;}
  if(d.tfDelFlow){tfEdit(vt=>{vt.flows=vt.flows.filter(f=>f.id!==d.tfDelFlow);},'Delete traffic flow');return true;}
  if(d.tfMixAdd||d.tfMixDel!==undefined||d.tfGroupAdd||d.tfGroupDel!==undefined||d.tfPhaseAdd||d.tfPhaseDel!==undefined||d.tfPhaseUp!==undefined||d.tfPhaseDown!==undefined){
    /* structural edits inside an open form: apply to the draft read from the form, keep the form open */
    const form=b.closest('[data-tf-form]');if(!form)return true;const [kind,id]=form.dataset.tfForm.split(/:(.*)/s);
    tfEdit(vt=>{if(kind==='flow'){const i=vt.flows.findIndex(f=>f.id===id),f=tfReadFlow(form,vt.flows[i]);
        if(d.tfMixAdd)f.mix.push({unitId:vt.units[0]?.id||'',weight:1});if(d.tfMixDel!==undefined)f.mix.splice(+d.tfMixDel,1);vt.flows[i]=f;}
      else if(kind==='signal'){const i=vt.signals.findIndex(s=>s.id===id),s=tfReadSignal(form,vt.signals[i]);
        if(d.tfGroupAdd){const taken=new Set(s.groups.map(gr=>gr.id));s.groups.push({id:tfUid(`siggrp_${s.intersectionId||s.id}_group`,taken),label:'New group',connectorIds:[]});}
        if(d.tfGroupDel!==undefined){const gone=s.groups.splice(+d.tfGroupDel,1)[0];for(const p of s.phases)delete p.states[gone.id];}
        if(d.tfPhaseAdd){const taken=new Set(s.phases.map(p=>p.id)),st={};for(const gr of s.groups)st[gr.id]='RED';s.phases.push({id:tfUid('phase',taken),label:'New phase',durationSeconds:5,states:st});}
        if(d.tfPhaseDel!==undefined&&s.phases.length>1)s.phases.splice(+d.tfPhaseDel,1);
        for(const [k,dir] of [[d.tfPhaseUp,-1],[d.tfPhaseDown,1]])if(k!==undefined){const a=+k,z=a+dir;if(z>=0&&z<s.phases.length)[s.phases[a],s.phases[z]]=[s.phases[z],s.phases[a]];}
        vt.signals[i]=s;}},'Edit traffic');TFstate.edit=form.dataset.tfForm;renderLeft();return true;}
  if(d.tfAct==='add-signal'){const ix=$('tfNewSignalIx')?.value,g=tfGraph();const def=tfSG().defaultSignals(g).find(s=>s.intersectionId===ix);if(!def){toast('That intersection has no vehicle connectors to control.');return true;}
    tfEdit(vt=>{def.offsetSeconds=0;vt.signals.push(def);vt.signals.sort((a,b)=>a.id<b.id?-1:1);},'Add signal');return true;}
  if(d.tfCopyTiming){tfEdit(vt=>{const src=vt.signals.find(s=>s.id===d.tfCopyTiming);for(const s of vt.signals){if(s===src||s.groups.length!==src.groups.length)continue;
      s.phases=src.phases.map(p=>({id:p.id,label:p.label,durationSeconds:p.durationSeconds,states:Object.fromEntries(src.groups.map((gr,gi)=>[s.groups[gi].id,p.states[gr.id]||'RED']))}));}},'Duplicate signal timing');return true;}
  if(d.tfDelSignal){tfEdit(vt=>{vt.signals=vt.signals.filter(s=>s.id!==d.tfDelSignal);},'Delete signal');return true;}
  return false;
});
document.addEventListener('change',e=>{const el=e.target,d=el.dataset||{};
  if(d.tfToggle==='runtime'){mutate(()=>{const vl=project.routeNet.vehicleLoop||(project.routeNet.vehicleLoop={enabled:true});if(el.checked)vl.runtime='world';else delete vl.runtime;},'Vehicle World runtime');return;}
  if(d.tfToggle==='enabled'){tfEdit(vt=>{vt.enabled=el.checked;},'Authored traffic on/off');return;}
  if(d.tfMeterSlider){const v=Math.max(0,Math.min(100,Number(el.value)||0))/100,TR=tfTR();tfEdit(vt=>{vt.meter=TR.meterFor(v);},'Traffic meter');return;}
  if(d.tfUnitEnabled){tfEdit(vt=>{vt.units.find(u=>u.id===d.tfUnitEnabled).enabled=el.checked;},'Enable traffic unit');return;}
  if(d.tfFlowEnabled){tfEdit(vt=>{vt.flows.find(f=>f.id===d.tfFlowEnabled).enabled=el.checked;},'Enable traffic flow');return;}
  if(d.tfSignalEnabled){tfEdit(vt=>{vt.signals.find(s=>s.id===d.tfSignalEnabled).enabled=el.checked;},'Enable signal');return;}
  if(d.tfpMeterSlider){const r=RW.vehicleWorld?.command({type:'setTrafficMeter',value:(Number(el.value)||0)/100});if(r&&!r.ok)toast('Meter: '+r.reason);renderLeft();return;}
  if(d.tfpFlow){const r=RW.vehicleWorld?.command({type:'setFlowEnabled',flowId:d.tfpFlow,enabled:el.checked});if(r&&!r.ok)toast('Flow: '+r.reason);renderLeft();return;}
});
{const bb=$('blockBtn');if(bb&&!$('trafficBtn')){const t=document.createElement('button');t.id='trafficBtn';t.className='outline';t.textContent='Traffic';t.title='Traffic: catalogue, flows, meter and signals for the Vehicle World';bb.after(t);t.onclick=()=>{pane='traffic';TFstate.edit=null;TFstate.spawnMsg='';renderLeft();const l=$('leftContent');if(l)l.scrollTop=0;};}}
