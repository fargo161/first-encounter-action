/* Transport authoring is a second view inside City, not an alternative geometry editor.
 * Every write uses ROOM's transaction/history machinery. No runtime service is launched by enabling it. */
const TI=window.RCTransportInfrastructure;
const TRANSPORT_UI={active:false,collection:'curbs',id:null,filter:'',overlay:true,severity:'all'};
let TRANSPORT_EDIT=null;
function transportCurrent(){return TI.supported(TI.get(project))?TI.get(project)[TRANSPORT_UI.collection]?.find(x=>x.id===TRANSPORT_UI.id)||null:null;}
function transportOpen(col=null,id=null){if(typeof RW!=='undefined'&&RW.on)rwStop();if(mode==='test')exitTest();if(col)TRANSPORT_UI.collection=col;TRANSPORT_UI.active=true;TRANSPORT_UI.id=id;pane='city';tool='select';pending=null;if(active!=='iso')setMode('iso');refresh();}
function transportSelect(col,id){transportOpen(col,id);}
function transportStatus(r){return ({empty:'EMPTY AUTHORING LAYER',not_enabled:'NOT ENABLED',read_only:'FUTURE SCHEMA · READ ONLY',invalid:'INVALID DATA',invalid_bindings:'REPAIR REQUIRED',draft:'DRAFT · REVIEW FINDINGS',bindings_checked:'BOUNDED CHECKS CLEAR'})[r.status]||r.status;}
function transportPane(){
 const t=TI.get(project),ready=TI.supported(t),report=TI.inspect(project);
 let html=`<div class="section cs-head"><div class="ti-switch"><button data-city-view="structure">Structure</button><button class="active" data-city-view="transport">Transport</button></div><span class="eyebrow">TRANSPORT FOUNDATION ${TI.VERSION}</span><h2>Streets to stops</h2><div class="cs-boundary">One physical city.<br>Shared curbs · exact interfaces.</div><p>Bindings and bounded diagnostics only. Existing Vehicle World remains the physical executor.</p><span class="cs-status ${report.errors?'bad':report.warnings?'warn':''}">${esc(transportStatus(report))}</span></div>`;
 if(!t)return html+`<div class="section"><p>Enable transport declarations inside City Structure. No road, bay, vehicle, actor or service setting is changed.</p><button class="primary block" data-ti-action="enable">Enable transport framework</button></div>`;
 if(!ready)return html+`<div class="section"><p>${esc(report.diagnostics[0]?.message||'Read-only schema.')}</p><p>Original data is preserved; there is no automatic downgrade.</p></div>`;
 html+=`<div class="section"><label>Record type<select id="transportCollection">${Object.entries(TI.COLLECTIONS).map(([k,v])=>cityOption(k,v+' · '+t[k].length,TRANSPORT_UI.collection)).join('')}</select></label><button class="primary block" data-ti-action="add">+ Add ${TRANSPORT_UI.collection==='curbs'?'shared curb':'stopping place'}</button><label>Filter names<input id="transportFilter" type="search" value="${esc(TRANSPORT_UI.filter)}" placeholder="Search this record type"></label><p>${TRANSPORT_UI.collection==='curbs'?'One location can serve several premises or purposes. Multiple labels do not create extra capacity.':'Compose an actual bay, class-owned door, walking approach, waiting point and existing activity sockets.'}</p></div>`;
 html+=`<div class="section cs-list">${t[TRANSPORT_UI.collection].map(r=>`<button class="list-card ${r.id===TRANSPORT_UI.id?'active':''}" data-ti-select="${esc(r.id)}" data-ti-collection="${TRANSPORT_UI.collection}" data-ti-name="${esc(r.name.toLowerCase())}" ${TRANSPORT_UI.filter&&!r.name.toLowerCase().includes(TRANSPORT_UI.filter.toLowerCase())?'hidden':''}><span><strong>${esc(r.name)}</strong><small>${esc(r.uses?.join(' / ')||r.kind?.replaceAll('_',' ')||'')}</small></span>${report.diagnostics.some(d=>d.id===r.id&&d.severity==='error')?'<i class="cs-dot bad" title="Repair required"></i>':report.diagnostics.some(d=>d.id===r.id&&d.severity==='warning')?'<i class="cs-dot warn" title="Review findings"></i>':''}</button>`).join('')||'<p>No records yet.</p>'}</div>`;
 html+=`<div class="section"><h3>Infrastructure inspection</h3><div class="ti-totals"><span><b>${report.errors}</b> errors</span><span><b>${report.warnings}</b> warnings</span></div><button class="block" data-ti-action="inspect">Inspect all infrastructure</button><label class="check"><input id="transportOverlay" type="checkbox" ${TRANSPORT_UI.overlay?'checked':''}>Show curb and stop bindings</label><button class="block" data-ti-action="export">Export transport contract</button><p>Recomputed from current ROOM records. No saved green check can override changed geometry.</p><p class="subtle">Gray / teal: authored roads and lanes.<br>Orange: selected curb.<br>Door rings: class-at-bay projections.<br>Dashed lines: selected walking edges.</p></div>`;
 return html;
}
function transportFindings(ds){const filtered=ds.filter(d=>TRANSPORT_UI.severity==='all'||d.severity===TRANSPORT_UI.severity);return `<label class="ti-severity">Show findings<select id="transportSeverity">${['all','error','warning','info'].map(x=>cityOption(x,x,TRANSPORT_UI.severity)).join('')}</select></label>`+(filtered.length?filtered.slice(0,100).map(d=>`<div class="cs-finding ${d.severity}"><b>${esc(d.code.replaceAll('_',' '))}</b><p>${esc(d.message)}</p>${d.id&&d.collection?.startsWith('transport:')?`<button class="small" data-ti-select="${esc(d.id)}" data-ti-collection="${esc(d.collection.split(':')[1])}">Inspect record</button>`:''}</div>`).join(''):'<p>No findings at this severity. This is not a runtime certification.</p>');}
function transportInspector(){
 const t=TI.get(project),r=transportCurrent(),report=TI.inspect(project);
 if(!TI.supported(t))return `<section class="section"><span class="eyebrow">TRANSPORT BOUNDARY</span><h2>Author infrastructure, not a second simulator</h2><p>Curbs reference real road geometry. Stops reference real bays and pedestrian edges. Lanes and signal groups have qualified, revision-checked references.</p><p>No drivers, schedules, passenger population, fares or access permissions are added here.</p></section>`;
 if(!r)return `<section class="section"><span class="eyebrow">CURRENT PROJECT INSPECTION</span><h2>${esc(transportStatus(report))}</h2><p>${esc(report.verification)}</p><div class="cs-counts">${Object.entries(TI.COLLECTIONS).map(([col,label])=>`<button data-ti-group="${col}"><b>${t[col].length}</b><span>${esc(label)}</span></button>`).join('')}</div><p>Infrastructure revision ${t.revision}<br><small>Physical source <code>${esc(report.source.physicalFingerprint)}</code></small></p></section><section class="section">${transportFindings(report.diagnostics)}</section>`;
 const col=TRANSPORT_UI.collection,rr=TI.physicalRefs(col,r),ds=report.diagnostics.filter(d=>d.id===r.id),result=(col==='curbs'?report.curbs:report.stoppingPlaces).find(x=>x.id===r.id);
 let summary='';
 if(col==='curbs')summary=`<p><b>Road-side extent:</b> ${r.startM} → ${r.endM} m<br><b>Side:</b> ${esc(r.side)} of authored travel<br><b>Story:</b> ${r.story}<br><b>Uses:</b> ${esc(r.uses.join(' / ')||'Unspecified')}</p><p>Referenced bays: ${r.bayRefs.length}. This is one shared location, not independent capacity per use.</p>${r.premisesIds.map(id=>`<button class="cs-ref" data-city-select="${esc(id)}" data-city-collection="premises">Serves: ${esc(cityData()?.premises.find(x=>x.id===id)?.name||'MISSING '+id)}</button>`).join('')}`;
 else{
  const curb=t.curbs.find(x=>x.id===r.curbId),premise=cityData()?.premises.find(x=>x.id===r.premisesId);
  summary=`<p><b>Kind:</b> ${esc(r.kind.replaceAll('_',' '))}<br><b>Configuration:</b> ${esc(r.configuration.replaceAll('_',' '))}<br><b>Vehicle class:</b> ${esc(r.vehicleClassId)}<br><b>Door selector:</b> ${esc(r.doorId||'Not used')}<br><b>Maneuver intent:</b> ${esc(r.maneuverIntent.replaceAll('_',' '))}</p>${curb?`<button class="cs-ref" data-ti-select="${esc(curb.id)}" data-ti-collection="curbs">Shared curb: ${esc(curb.name)}</button>`:'<p class="warn">No resolved shared curb.</p>'}${premise?`<button class="cs-ref" data-city-select="${esc(premise.id)}" data-city-collection="premises">Premises: ${esc(premise.name)}</button>`:''}`;
  summary+=`<div class="ti-checks"><h3>Evidence levels</h3><p><b>Walking:</b> ${result?.walk?.pairs.every(x=>x.edges!==null)?'selected-edge connectivity':'incomplete / disconnected'}</p><p><b>Door:</b> ${result?.door?`class-at-bay projection${Number.isFinite(result.door.distanceM)?' · '+result.door.distanceM.toFixed(2)+' m from boarding point':''}`:'not projected / not applicable'}</p><p><b>Maneuvers and clearances:</b> not certified</p><p><b>Live service:</b> not executed by inspector</p></div>`;
 }
 return `<section class="section"><span class="eyebrow">${esc(TI.COLLECTIONS[col])}</span><h2>${esc(r.name)}</h2><p class="cs-id">${esc(r.id)}</p><div class="button-row"><button class="primary" data-ti-action="edit">Edit</button><button data-ti-action="focus">Focus map</button><button class="danger" data-ti-action="delete">Delete</button></div>${summary}${r.notes?`<p class="cs-notes">${esc(r.notes)}</p>`:''}</section><section class="section"><h3>Exact physical references · ${rr.length}</h3>${rr.map(x=>`<button class="cs-ref ${CS.resolvePhysical(project,x)?'':'missing'}" data-city-focus-ref="${esc(JSON.stringify(x))}">${esc(cityRefLabel(x))}${x.layoutToken?`<small>Layout ${esc(x.layoutToken)}</small>`:''}</button>`).join('')||'<p>No physical reference yet.</p>'}</section><section class="section"><h3>Findings</h3>${transportFindings(ds)}</section><section class="section"><details><summary>Stored authoring fields</summary><pre class="cs-json">${esc(JSON.stringify(r,null,2))}</pre></details></section>`;
}
function transportRefOptions(value,kinds){
 const val=value?JSON.stringify(value):'',key=value?CS.refKey(value):null;let out=cityOption('','— Unbound / choose existing record —',val);
 const items=CS.physicalCatalog(project).filter(x=>!kinds||kinds.includes(x.ref.kind));
 if(value&&!items.some(x=>CS.refKey(x.ref)===key))out+=cityOption(val,'MISSING / STALE · '+value.kind+' '+value.id,val);
 for(const kind of kinds||CS.PHYSICAL_KINDS){const xs=items.filter(x=>x.ref.kind===kind);if(!xs.length)continue;out+=`<optgroup label="${kind}">`+xs.map(x=>{const hit=key===CS.refKey(x.ref),json=hit?val:JSON.stringify(x.ref);return cityOption(json,x.name+(x.ref.layoutToken?' · current layout':''),hit?json:val);}).join('')+'</optgroup>';}
 return out;
}
function transportRefField(label,key,value,kinds){return `<label>${esc(label)}<select data-ti-ref="${key}">${transportRefOptions(value,kinds)}</select></label>`;}
function transportField(label,key,value,options=null){return options?`<label>${esc(label)}<select data-ti-field="${key}">${options.map(v=>cityOption(v,v.replaceAll('_',' '),value)).join('')}</select></label>`:`<label>${esc(label)}<input data-ti-field="${key}" value="${esc(value)}"></label>`;}
function transportNumber(label,key,value,min=0,step='any'){return `<label>${esc(label)}<input data-ti-field="${key}" type="number" min="${min}" step="${step}" value="${value}"></label>`;}
function transportRefMulti(label,key,values,kinds){
 const items=CS.physicalCatalog(project).filter(x=>kinds.includes(x.ref.kind)),keys=new Set(values.map(CS.refKey)),missing=values.filter(x=>!items.some(y=>CS.refKey(x)===CS.refKey(y.ref)));
 return `<label>${esc(label)}<select multiple size="5" data-ti-ref-multi="${key}">${missing.map(x=>`<option selected value="${esc(JSON.stringify(x))}">MISSING / STALE · ${esc(x.id)}</option>`).join('')}${items.map(x=>{const saved=values.find(v=>CS.refKey(v)===CS.refKey(x.ref));return `<option value="${esc(JSON.stringify(saved||x.ref))}" ${keys.has(CS.refKey(x.ref))?'selected':''}>${esc(x.name)} · ${esc(x.ref.kind)}</option>`;}).join('')}</select><small>Ctrl / Command-click selects several. References never copy geometry.</small></label>`;
}
function transportIdSelect(label,key,value,rows,nullable=true,multi=false){
 const vals=multi?value:[value],known=new Set(rows.map(x=>x.id)),missing=vals.filter(x=>x&&!known.has(x));
 return `<label>${esc(label)}<select ${multi?'multiple size="4"':''} data-ti-${multi?'ids':'field'}="${key}">${nullable&&!multi?cityOption('','— Unbound —',value||''):''}${missing.map(x=>`<option selected value="${esc(x)}">MISSING · ${esc(x)}</option>`).join('')}${rows.map(x=>`<option value="${esc(x.id)}" ${vals.includes(x.id)?'selected':''}>${esc(x.name||x.label||x.id)}</option>`).join('')}</select></label>`;
}
function transportEdit(col,id=null){
 if(mode!=='build'||!TI.supported(TI.get(project))){toast('Enable a supported transport framework first.');return;}
 const found=id?TI.get(project)[col]?.find(x=>x.id===id):null;if(id&&!found){toast('That record no longer exists.');return;}
 TRANSPORT_EDIT={col,draft:found?C.clone(found):TI.draft(col),existing:!!found,source:TI.sourceStamp(project)};transportRenderEditor();
}
function transportRenderEditor(){
 if(!TRANSPORT_EDIT)return;const {col,draft:r}=TRANSPORT_EDIT,t=TI.get(project);let left='',right='';
 if(col==='curbs'){
  left=transportRefField('Authored road element','roadRef',r.roadRef,['vehicleEdge','vehicleConnector'])+transportRefField('Exact approach lane · explicit rebinding after edits','laneRef',r.laneRef,['vehicleLane'])+transportField('Side relative to road travel','side',r.side,['left','right'])+`<div class="ti-inline">${transportNumber('Start · metres','startM',r.startM)}${transportNumber('End · metres','endM',r.endM)}</div>`+transportNumber('Story','story',r.story,-100,1)+`<label>Intended uses · one shared location<select multiple size="7" data-ti-ids="uses">${TI.USES.map(x=>`<option value="${x}" ${r.uses.includes(x)?'selected':''}>${esc(x.replaceAll('_',' '))}</option>`).join('')}</select></label>`;
  right=transportRefMulti('Existing physical bays','bayRefs',r.bayRefs,['vehicleBay'])+transportRefMulti('Pedestrian interfaces','pedestrianRefs',r.pedestrianRefs,['routeVertex','routeEdge','routeNode','opening','usePoint'])+transportRefMulti('Signal controls / qualified groups','controlRefs',r.controlRefs,['signalController','signalGroup'])+transportIdSelect('Premises sharing this location','premisesIds',r.premisesIds,cityData().premises,false,true);
 }else{
  const classes=RCVehicleClasses.resolve(project.routeNet?.vehicleLoop?.classes),cls=classes[r.vehicleClassId];
  left=transportField('Stopping-place use','kind',r.kind,TI.STOP_KINDS)+transportField('Configuration','configuration',r.configuration,TI.CONFIGURATIONS)+transportIdSelect('Existing premises','premisesId',r.premisesId,cityData().premises)+transportIdSelect('Shared curb location','curbId',r.curbId,t.curbs)+transportRefField('Actual stopping bay','bayRef',r.bayRef,['vehicleBay'])+transportIdSelect('Vehicle class','vehicleClassId',r.vehicleClassId,Object.values(classes),false)+transportIdSelect('Class-owned access point · blank for non-boarding use','doorId',r.doorId,cls?.accessPoints||[])+transportField('Required maneuver capability','maneuverIntent',r.maneuverIntent,TI.MANEUVERS);
  right=transportRefField('Pedestrian approach vertex','approachRef',r.approachRef,['routeVertex'])+transportRefField('Waiting vertex','waitingRef',r.waitingRef,['routeVertex'])+transportRefField('Boarding vertex · compared with the class door','boardingRef',r.boardingRef,['routeVertex'])+transportRefField('Pedestrian exit vertex','exitRef',r.exitRef,['routeVertex'])+transportRefMulti('Selected canonical pedestrian edges','pathRefs',r.pathRefs,['routeEdge'])+transportIdSelect('Existing activity sockets','stationIds',r.stationIds,cityData().stations,false,true);
 }
 modal(`${modalTitle((TRANSPORT_EDIT.existing?'Edit ':'Add ')+(col==='curbs'?'shared curb location':'stopping place'))}<div class="cs-boundary">Authoring only. No actor, schedule, occupancy or permission is created.</div><p>${col==='curbs'?'Extents use metres along the road centerline. Left/right follows the authored travel direction, not screen orientation.':'The bay authorizes the stopping context; the vehicle class supplies its door. Path references do not invent new connections.'}</p><div class="cs-editor-grid"><div>${transportField('Name','name',r.name)}${left}<label>Notes<textarea data-ti-field="notes" rows="3" maxlength="5000">${esc(r.notes)}</textarea></label></div><div>${right}</div></div><div class="cs-modal-footer"><small>One undoable edit. Missing bindings stay visible; no automatic substitution.</small><button data-action="close-modal">Cancel</button><button id="transportApply" class="primary">Apply infrastructure</button></div>`);
 $('modalRoot').querySelector('.modal').classList.add('cs-dialog');$('transportApply').onclick=transportApply;
 $('modalRoot').querySelector('[data-ti-field="vehicleClassId"]')?.addEventListener('change',()=>{transportCollect();transportRenderEditor();});
}
function transportCollect(){if(!TRANSPORT_EDIT)return;const r=TRANSPORT_EDIT.draft,root=$('modalRoot');
 root.querySelectorAll('[data-ti-field]').forEach(el=>{const k=el.dataset.tiField;r[k]=el.type==='number'?(el.value.trim()===''?NaN:Number(el.value)):['premisesId','curbId'].includes(k)?el.value||null:el.value;});
 root.querySelectorAll('[data-ti-ref]').forEach(el=>r[el.dataset.tiRef]=el.value?JSON.parse(el.value):null);
 root.querySelectorAll('[data-ti-ref-multi]').forEach(el=>r[el.dataset.tiRefMulti]=[...el.selectedOptions].map(x=>JSON.parse(x.value)));
 root.querySelectorAll('[data-ti-ids]').forEach(el=>r[el.dataset.tiIds]=[...el.selectedOptions].map(x=>x.value));
}
function transportApply(){try{transportCollect();const e=TRANSPORT_EDIT;if(!e)return;if(!TI.isFresh({source:e.source},project))throw Error('Project geometry or declarations changed while this dialog was open. Cancel and reopen; stale references will not be refreshed silently.');const trial=C.clone(project);TI.put(trial,e.col,e.draft);if(mutate(()=>TI.put(project,e.col,e.draft),'Edit transport infrastructure')){TRANSPORT_UI.collection=e.col;TRANSPORT_UI.id=e.draft.id;TRANSPORT_EDIT=null;closeModal();refresh();}}catch(e){modalError(e);}}
function transportDelete(){const r=transportCurrent();if(!r)return;const col=TRANSPORT_UI.collection,used=TI.dependencies(project,col,r.id);if(used.length){toast('Still referenced by '+used.map(x=>x.name).join(', ')+'. Rebind those stopping places first.',7000);return;}ask('Delete infrastructure declaration?','Only "'+r.name+'" will be removed. Physical roads, bays and walking paths are not deleted.',()=>{if(mutate(()=>TI.remove(project,col,r.id),'Delete infrastructure declaration')){TRANSPORT_UI.id=null;refresh();}},'Delete declaration');}
function transportFocus(){const r=transportCurrent();if(!r)return;const q=TI.recordPoint(project,TRANSPORT_UI.collection,r);if(q)cityFocusPoint(q);else toast('No resolved physical position. Repair the binding first.');}
function transportExport(){try{download(new Blob([JSON.stringify(TI.contract(project),null,2)],{type:'application/json'}),safeName(project.name)+'_transport.contract.json');toast('Exported current infrastructure declarations and bounded diagnostics.');}catch(e){toast(e.message,7000);}}
HOOKS.leftRender.push(el=>{if(pane==='city'&&mode==='build'&&TRANSPORT_UI.active){const y=el.scrollTop;el.innerHTML=transportPane();el.scrollTop=y;}});
HOOKS.inspectorRender.push(el=>{if(pane==='city'&&mode==='build'&&TRANSPORT_UI.active){const y=el.scrollTop;el.innerHTML=transportInspector();el.scrollTop=y;}});
HOOKS.click.push((e,b)=>{
 if(b.dataset.tiSelect){transportSelect(b.dataset.tiCollection,b.dataset.tiSelect);return true;}
 if(b.dataset.tiGroup){TRANSPORT_UI.collection=b.dataset.tiGroup;TRANSPORT_UI.id=null;TRANSPORT_UI.filter='';refresh();return true;}
 if(b.dataset.tiAction){const a=b.dataset.tiAction;if(a==='enable')mutate(()=>TI.initialize(project),'Enable transport infrastructure');if(a==='add')transportEdit(TRANSPORT_UI.collection);if(a==='edit')transportEdit(TRANSPORT_UI.collection,TRANSPORT_UI.id);if(a==='delete')transportDelete();if(a==='focus')transportFocus();if(a==='inspect'){TRANSPORT_UI.id=null;refresh();}if(a==='export')transportExport();return true;}return false;
});
document.addEventListener('change',e=>{if(e.target.id==='transportCollection'){TRANSPORT_UI.collection=e.target.value;TRANSPORT_UI.id=null;TRANSPORT_UI.filter='';refresh();}if(e.target.id==='transportOverlay'){TRANSPORT_UI.overlay=e.target.checked;drawSoon();}if(e.target.id==='transportSeverity'){TRANSPORT_UI.severity=e.target.value;renderInspector();}});
document.addEventListener('input',e=>{if(e.target.id==='transportFilter'){TRANSPORT_UI.filter=e.target.value;document.querySelectorAll('[data-ti-name]').forEach(x=>x.hidden=!x.dataset.tiName.includes(TRANSPORT_UI.filter.toLowerCase()));}});
HOOKS.keyDown.unshift(e=>{if(pane==='city'&&mode==='build'&&TRANSPORT_UI.active&&['Delete','Backspace'].includes(e.key)){e.preventDefault();transportDelete();return true;}return false;});
HOOKS.pointerDown.unshift((e,q)=>{
 if(pane!=='city'||mode!=='build'||!TRANSPORT_UI.active||active!=='iso'||e.button!==0)return false;
 const t=TI.get(project);if(!TI.supported(t))return true;
 for(const r of [...t.stoppingPlaces]){const pos=TI.recordPoint(project,'stoppingPlaces',r);if(!pos||pos.story!==activeStory)continue;const pt=C.isoPoint(project,pos,C.storyElevation(project,pos.story));if(Math.hypot(pt.x-q.x,pt.y-q.y)<18*mk()){transportSelect('stoppingPlaces',r.id);return true;}}
 return true;
});
HOOKS.drawGraph.push((g,k)=>{
 if(pane!=='city'||mode!=='build'||!TRANSPORT_UI.active||!TRANSPORT_UI.overlay||active!=='iso'||!TI.supported(TI.get(project)))return;
 const t=TI.get(project),selected=transportCurrent(),point=q=>C.isoPoint(project,q,C.storyElevation(project,q.story||0));g.save();
 // Read-only map projection of the same compiled geometry used by Vehicle World.
 // These outlines are not swept-path or collision certificates.
 let graph=null;try{graph=RCVehicleGraph.fromRouteNet(project.routeNet||{});}catch(_){}
 if(graph){
  for(const el of graph.elements.values()){
   if(el.story!==activeStory||!(el.len>0))continue;
   const cuts=[...new Set([0,...el.cum,el.len])].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){
    const a=RCVehicleGraph.poseAt(el,cuts[i-1]+1e-7),b=RCVehicleGraph.poseAt(el,cuts[i]-1e-7);
    const corners=[{x:a.x+a.rx*el.halfWidth,y:a.y+a.ry*el.halfWidth,story:el.story},{x:b.x+b.rx*el.halfWidth,y:b.y+b.ry*el.halfWidth,story:el.story},{x:b.x-b.rx*el.halfWidth,y:b.y-b.ry*el.halfWidth,story:el.story},{x:a.x-a.rx*el.halfWidth,y:a.y-a.ry*el.halfWidth,story:el.story}].map(point);
    g.fillStyle='rgba(35,49,61,.86)';g.beginPath();corners.forEach((q,j)=>j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();
   }
   for(const lane of el.lanes?.centers||[0]){g.strokeStyle=lane===0?'#526c7a':'#537e84';g.lineWidth=1*k;g.setLineDash([4*k,4*k]);g.beginPath();cuts.forEach((dist,i)=>{const a=RCVehicleGraph.poseAt(el,dist),q=point({x:a.x+a.rx*lane,y:a.y+a.ry*lane,story:el.story});i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.stroke();}
  }
  g.setLineDash([]);
  for(const bay of project.routeNet?.parking?.spaces||[]){if((bay.story||0)!==activeStory||!bay.vehicleBox)continue;const b=bay.vehicleBox,pts=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].map(([x,y])=>point({x,y,story:bay.story||0}));g.strokeStyle='#768fa0';g.lineWidth=1.5*k;g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.stroke();
   if(selected?.bayRef?.id===bay.id)for(const key of ['pullInPath','pullOutPath']){g.strokeStyle=key==='pullInPath'?'#cba776':'#94aade';g.lineWidth=2*k;g.beginPath();(bay.maneuver?.[key]||[]).forEach((a,i)=>{const q=point(a);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.stroke();}
  }
  for(const control of project.routeNet?.vehicleTraffic?.signals||[]){const pos=TI.referencePoint(project,{kind:'signalController',id:control.id});if(!pos||pos.story!==activeStory)continue;const q=point(pos);g.fillStyle='#d8ba77';g.fillRect(q.x-3*k,q.y-3*k,6*k,6*k);}
 }
 for(const r of t.curbs){const ps=TI.curbPoints(project,r);if(!ps.length||ps[0].story!==activeStory)continue;const sel=r.id===TRANSPORT_UI.id||selected?.curbId===r.id;g.strokeStyle=sel?'#ffce84':'#70baac';g.lineWidth=(sel?5:3)*k;g.setLineDash([]);g.beginPath();ps.map(point).forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();if(sel)cityDrawLabel(g,point(ps[0]),r.name,k,'#ffce84');}
 if(selected&&TRANSPORT_UI.collection==='stoppingPlaces'){
  for(const ref of selected.pathRefs){const edge=CS.resolvePhysical(project,ref)?.record,a=project.routeNet?.vertices.find(v=>v.id===edge?.a),b=project.routeNet?.vertices.find(v=>v.id===edge?.b);if(!a||!b||a.story!==activeStory||b.story!==activeStory)continue;const A=point(a),B=point(b);g.strokeStyle='#7cdde8';g.lineWidth=2.5*k;g.setLineDash([7*k,4*k]);g.beginPath();g.moveTo(A.x,A.y);g.lineTo(B.x,B.y);g.stroke();}
  g.setLineDash([]);
  for(const [key,label] of [['approachRef','Approach'],['waitingRef','Wait'],['boardingRef','Board'],['exitRef','Exit']]){const p=selected[key]?CS.referencePoint(project,selected[key]):null;if(!p||p.story!==activeStory)continue;const q=point(p);g.fillStyle='#092e3a';g.strokeStyle='#7cdde8';g.lineWidth=2*k;g.beginPath();g.arc(q.x,q.y,5*k,0,Math.PI*2);g.fill();g.stroke();if(key!=='exitRef'||CS.refKey(selected.exitRef)!==CS.refKey(selected.approachRef||{}))cityDrawLabel(g,q,label,k,'#7cdde8');}
  const door=TI.projectedDoor(project,selected);if(door&&door.story===activeStory){const q=point(door);g.strokeStyle='#f4b3ce';g.lineWidth=2*k;g.beginPath();g.arc(q.x,q.y,8*k,0,Math.PI*2);g.stroke();cityDrawLabel(g,{x:q.x,y:q.y-24*k},'Door · class projection',k,'#f4b3ce');}
 }
 for(const r of t.stoppingPlaces){const pos=TI.recordPoint(project,'stoppingPlaces',r);if(!pos||pos.story!==activeStory)continue;const q=point(pos),sel=r.id===TRANSPORT_UI.id;g.fillStyle=sel?'#ffce84':'#80cfdd';g.fillRect(q.x-5*k,q.y-5*k,10*k,10*k);if(!selected||sel)cityDrawLabel(g,{x:q.x,y:q.y+24*k},r.name,k,sel?'#ffce84':'#80cfdd');}
 g.restore();
});
HOOKS.messages.push(()=>pane==='city'&&mode==='build'&&TRANSPORT_UI.active?{select:'Transport: curb extents and exact bindings. Door rings are class projections, not live doors. Edit physical geometry in Build / Move.'}:{});
EXT.transportInfrastructure={version:TI.VERSION,model:TI,state:TRANSPORT_UI,open:transportOpen,select:transportSelect,edit:transportEdit,enable:()=>mutate(()=>TI.initialize(project),'Enable transport infrastructure'),put:(col,r)=>mutate(()=>TI.put(project,col,r),'Edit transport infrastructure'),remove:(col,id)=>mutate(()=>TI.remove(project,col,id),'Delete transport declaration'),inspect:()=>TI.inspect(project),contract:()=>TI.contract(project),focus:transportFocus};
