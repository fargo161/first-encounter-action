/* City Structure Foundation: add-on to the existing editor transaction/hook system.
   All project writes use mutate(). Rendering, inspection and export do not mutate the world. */
const CS=window.RCCityStructure;
const CITY_UI={collection:'premises',id:null,overlay:true,ties:true,filter:''};
let CITY_EDIT=null;
const cityNames={buildings:'building assembly',premises:'premises',stations:'activity socket',roleSlots:'role-position socket',links:'organizational tie',accessPlans:'access declaration',requirements:'support requirement'};
const cityTitles={buildings:'Building assemblies',premises:'Premises',stations:'Activity sockets',roleSlots:'Role-position sockets',links:'Organizational ties',accessPlans:'Access declarations',requirements:'Support requirements'};
const citySingular={buildings:'building',premises:'premises',stations:'station',roleSlots:'roleSlot',links:'link',accessPlans:'accessPlan',requirements:'requirement'};
const cityHelp={
 buildings:'A named collection of existing ROOM spaces. References only: no copied geometry or automatic whole-building movement.',
 premises:'A household, business, civic use or other operating premises. Several can share one shell; one can span several buildings.',
 stations:'An activity socket anchored to existing ROOM topology or use points. Provider, recipient and waiting positions are physical bindings, not people.',
 roleSlots:'Unfilled role-position sockets. State what locations or stations a role needs, not who is employed, scheduled or occupying them.',
 links:'Directional declarations between places or role sockets. A purchasing or pricing tie describes the intended responsibility; it makes no decision.',
 accessPlans:'Intended access categories on existing boundaries or spaces. They do not grant permissions, change locks or create an intruder route.',
 requirements:'A declared support dependency. A named provider is a binding, not a guarantee that staff, stock or a running service will be available.'
};
function cityData(){return CS.get(project);}
function cityCurrent(){return CS.supported(cityData())?cityData()[CITY_UI.collection]?.find(r=>r.id===CITY_UI.id)||null:null;}
function cityOpen(col=null,id=null){if(typeof TRANSPORT_UI!=='undefined')TRANSPORT_UI.active=false;if(typeof RW!=='undefined'&&RW.on)rwStop();if(mode==='test')exitTest();if(col)CITY_UI.collection=col;CITY_UI.id=id;pane='city';tool='select';pending=null;if(active!=='iso')setMode('iso');refresh();}
function citySelect(col,id){if(col?.startsWith('transport:')){transportOpen(col.split(':')[1],id);return;}if(typeof TRANSPORT_UI!=='undefined')TRANSPORT_UI.active=false;CITY_UI.collection=col;CITY_UI.id=id;pane='city';refresh();}
function cityEnable(){return mutate(()=>CS.initialize(project),'Enable City Structure authoring');}
function cityStatus(report){return ({not_enabled:'NOT ENABLED',empty:'ENABLED · NO DECLARATIONS',read_only:'FUTURE SCHEMA · READ ONLY',invalid:'INVALID DATA',invalid_bindings:'BINDINGS NEED REPAIR',draft:'DRAFT DECLARATIONS',references_resolve:'REFERENCES RESOLVE'})[report.status]||report.status;}
function cityRefLabel(ref){if(!ref)return 'Unbound';const hit=CS.resolvePhysical(project,ref);return (hit?hit.name:'MISSING: '+ref.id)+' · '+ref.kind+(ref.parentId?' / '+ref.parentId:'');}
function cityEndpointLabel(e){if(!e)return 'Unbound';const hit=CS.resolveEndpoint(project,e);return (hit?.name||'MISSING: '+e.id)+' · '+e.kind;}
function cityPane(){
 const s=cityData(),report=CS.inspect(project),ready=CS.supported(s);
 let html=`<div class="section cs-head"><div class="ti-switch"><button class="active" data-city-view="structure">Structure</button><button data-city-view="transport">Transport</button></div><span class="eyebrow">FOUNDATION 0.1.1</span><h2>City Structure</h2><div class="cs-boundary">ROOM authors the sockets.<br>ENCOUNTER supplies people and behavior.</div><p>Physical bindings, role positions and cross-location ties. No live city simulation.</p><span class="cs-status ${report.errors?'bad':report.warnings?'warn':''}">${esc(cityStatus(report))}</span></div>`;
 if(!s)return html+`<div class="section"><p>Enable this optional layer on the current project. No rooms, roads, NPCs or existing settings will change.</p><button class="primary block" data-city-action="enable">Enable framework</button></div>`;
 if(!ready)return html+`<div class="section"><p>${esc(report.diagnostics[0]?.message||'Unsupported schema.')}</p><p>The original data is preserved. Use a compatible editor to change it.</p></div>`;
 html+=`<div class="section cs-controls"><label>Record type<select id="cityCollection">${Object.entries(cityTitles).map(([k,v])=>`<option value="${k}" ${k===CITY_UI.collection?'selected':''}>${esc(v)} · ${s[k].length}</option>`).join('')}</select></label><button class="primary block" data-city-action="add">+ Add ${esc(cityNames[CITY_UI.collection])}</button><label class="cs-search">Filter names<input id="cityFilter" type="search" value="${esc(CITY_UI.filter)}" placeholder="Search this record type"></label><p>${esc(cityHelp[CITY_UI.collection])}</p></div>`;
 const rows=s[CITY_UI.collection];
 html+=`<div class="section cs-list">${rows.map(r=>`<button class="list-card ${r.id===CITY_UI.id?'active':''}" data-city-select="${esc(r.id)}" data-city-collection="${CITY_UI.collection}" data-city-name="${esc(r.name.toLowerCase())}" ${CITY_UI.filter&&!r.name.toLowerCase().includes(CITY_UI.filter.toLowerCase())?'hidden':''}><span><strong>${esc(r.name)}</strong><small>${esc(r.function||r.category||r.kind||r.roleTag||r.form||'Declaration')}</small></span>${report.diagnostics.some(d=>d.id===r.id&&d.severity==='error')?'<i class="cs-dot bad" title="Broken binding"></i>':report.diagnostics.some(d=>d.id===r.id&&d.severity==='warning')?'<i class="cs-dot warn" title="Unresolved declaration"></i>':''}</button>`).join('')||'<p>No records of this type yet.</p>'}</div>`;
 html+=`<div class="section"><h3>Inspection</h3><p><b>${report.errors}</b> broken bindings · <b>${report.warnings}</b> draft warnings</p><button class="block" data-city-action="inspect">Show all findings</button><label class="check"><input type="checkbox" id="cityOverlay" ${CITY_UI.overlay?'checked':''}>Show physical bindings</label><label class="check"><input type="checkbox" id="cityTies" ${CITY_UI.ties?'checked':''}>Show organizational ties</label><p>Dashed arrows are declarations, not roads or movement paths.</p><button class="block" data-city-action="export">Export structural contract</button><p>Save project keeps this layer inside the normal .room.json file.</p></div>`;
 return html;
}
function cityFindingList(ds){return ds.length?ds.slice(0,120).map(d=>`<div class="cs-finding ${d.severity}"><b>${esc(d.code.replaceAll('_',' '))}</b><p>${esc(d.message)}</p>${d.id?`<button class="small" data-city-select="${esc(d.id)}" data-city-collection="${esc(d.collection)}">Inspect record</button>`:''}</div>`).join('')+(ds.length>120?'<p>More findings are included in the exported contract.</p>':''):'<div class="info">No structural findings in this selection. This is not a runtime readiness verdict.</div>';}
function cityInspector(){
 const s=cityData(),report=CS.inspect(project),r=cityCurrent();
 if(!CS.supported(s))return `<section class="section"><span class="eyebrow">CITY STRUCTURE</span><h2>Authoring boundary</h2><p>Buildings, physical use positions and unfilled role sockets belong in this layer.</p><p>Hiring, individual actors, schedules, access decisions, pricing, inventory and consequences do not.</p><p>Existing ROOM geometry and movement remain authoritative.</p></section>`;
 if(!r)return `<section class="section"><span class="eyebrow">STRUCTURAL INSPECTOR</span><h2>${esc(cityStatus(report))}</h2><p>${esc(report.verification)}</p><div class="cs-counts">${Object.keys(cityTitles).map(k=>`<button data-city-group="${k}"><b>${s[k].length}</b><span>${esc(cityTitles[k])}</span></button>`).join('')}</div><p>Namespace <code>${esc(s.namespace)}</code><br>Structure revision ${s.revision}</p></section><section class="section"><h3>Findings</h3>${cityFindingList(report.diagnostics)}</section>`;
 const col=CITY_UI.collection,refs=CS.physicalRefs(col,r),deps=CS.dependencies(project,r.id),ds=report.diagnostics.filter(d=>d.id===r.id);
 let summary='';
 if(col==='premises')summary=`<p><b>Function:</b> ${esc(r.function)}<br><b>Access intent:</b> ${esc(r.accessIntent)}<br><b>Vehicle relationship:</b> ${esc(r.vehicleIntent)}<br><b>Operator socket:</b> ${esc(r.operatorSocket||'Unbound')}</p>${r.capacities.map(x=>`<p>Declared ${esc(x.kind)}: <b>${x.amount} ${esc(x.unit)}</b></p>`).join('')}`;
 if(col==='stations')summary=`<p><b>Category:</b> ${esc(r.category)}<br><b>Design capacity:</b> ${r.capacity} simultaneous uses<br><b>Purpose:</b> ${esc(r.purpose||'Not specified')}</p>${r.bindings.map(b=>`<p><b>${esc(b.purpose)}:</b> ${esc(cityRefLabel(b.ref))}</p>`).join('')}`;
 if(col==='roleSlots')summary=`<p><b>Role tag:</b> ${esc(r.roleTag)}<br><b>Unfilled design slots:</b> ${r.slotCount}</p><p>No assigned person, employment status or shift is stored.</p>`;
 if(col==='links')summary=`<div class="cs-tie"><span>${esc(cityEndpointLabel(r.from))}</span><strong>↓ ${esc(r.kind)} · intended</strong><span>${esc(cityEndpointLabel(r.to))}</span></div><p>This relation creates neither a route nor a transaction.</p>`;
 if(col==='accessPlans')summary=`<p><b>Intended category:</b> ${esc(r.category)}<br><b>Role tags:</b> ${esc(r.roleTags.join(', ')||'None specified')}</p><p>No permission is granted or denied by this declaration.</p>`;
 if(col==='requirements')summary=`<p><b>${r.required?'Required':'Optional'} ${esc(r.kind)}</b></p><p>Consumer: ${esc(cityEndpointLabel(r.consumer))}</p><p>Provider: ${esc(cityEndpointLabel(r.provider))}</p>`;
 if(col==='buildings')summary=`<p><b>Form:</b> ${esc(r.form)}</p><p>The assembly references its spaces. It does not yet provide whole-building move, clone or regeneration.</p>`;
 return `<section class="section"><span class="eyebrow">${esc(cityNames[col].toUpperCase())}</span><h2>${esc(r.name)}</h2><p class="cs-id">${esc(r.id)}</p><div class="button-row"><button class="primary" data-city-action="edit">Edit</button><button data-city-action="focus">Focus map</button><button class="danger" data-city-action="delete">Delete record</button></div>${summary}${r.notes?`<p class="cs-notes">${esc(r.notes)}</p>`:''}</section><section class="section"><h3>Physical bindings · ${refs.length}</h3>${refs.map(ref=>`<button class="cs-ref ${CS.resolvePhysical(project,ref)?'':'missing'}" data-city-focus-ref="${esc(JSON.stringify(ref))}">${esc(cityRefLabel(ref))}</button>`).join('')||'<p>No direct physical reference. A parent place may provide context.</p>'}</section><section class="section"><h3>Structural dependencies</h3>${CS.structuralRefs(col,r).map(e=>`<button class="cs-ref" data-city-select="${esc(e.id)}" data-city-collection="${CS.KINDS[e.kind]}">${esc(cityEndpointLabel(e))}</button>`).join('')||'<p>None.</p>'}${deps.length?`<h3>Used by</h3>${deps.map(d=>`<button class="cs-ref" data-city-select="${esc(d.id)}" data-city-collection="${d.collection}">${esc(d.name)}</button>`).join('')}`:''}</section><section class="section"><h3>Findings</h3>${cityFindingList(ds)}</section><section class="section"><details><summary>Stored authoring fields</summary><pre class="cs-json">${esc(JSON.stringify(r,null,2))}</pre></details></section>`;
}
function cityOption(v,label,sel){return `<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(label)}</option>`;}
function citySelectField(label,key,value,values){return `<label>${esc(label)}<select data-city-field="${key}">${values.map(v=>cityOption(v,v.replaceAll('_',' '),value)).join('')}</select></label>`;}
function cityTextField(label,key,value,extra=''){return `<label>${esc(label)}<input data-city-field="${key}" value="${esc(value)}" ${extra}></label>`;}
function cityPhysicalOptions(value,spaceOnly=false){
 const val=value?JSON.stringify(value):'',items=CS.physicalCatalog(project).filter(x=>!spaceOnly||CS.SPACE_KINDS.includes(x.ref.kind));
 let out=cityOption('','— Choose existing physical record —',val);
 if(value&&!CS.resolvePhysical(project,value))out+=cityOption(val,'MISSING · '+value.kind+' '+value.id,val);
 // Existing refs can carry extension metadata. Match identity, not JSON property order.
 const chosen=value?CS.refKey(value):null;
 for(const kind of CS.PHYSICAL_KINDS){const xs=items.filter(x=>x.ref.kind===kind);if(!xs.length)continue;out+=`<optgroup label="${kind}">`+xs.map(x=>{const match=chosen===CS.refKey(x.ref),json=match?val:JSON.stringify(x.ref);return cityOption(json,x.name+(x.ref.parentId?' ['+x.ref.parentId+']':''),match?json:val);}).join('')+'</optgroup>';}
 return out;
}
function cityEndpointOptions(value){let out=cityOption('','— Unbound —',value?JSON.stringify(value):'');const val=value?JSON.stringify(value):'';if(value&&!CS.resolveEndpoint(project,value))out+=cityOption(val,'MISSING · '+value.id,val);for(const kind of CS.ENDPOINT_KINDS){out+=`<optgroup label="${kind}">`;for(const r of cityData()?.[CS.KINDS[kind]]||[]){const match=value?.kind===kind&&value?.id===r.id,json=match?val:JSON.stringify({kind,id:r.id});out+=cityOption(json,r.name,match?json:val);}out+='</optgroup>';}return out;}
function cityRefField(label,key,ref){return `<label>${esc(label)}<select data-city-ref-field="${key}">${cityPhysicalOptions(ref)}</select></label>`;}
function cityEndpointField(label,key,ref){return `<label>${esc(label)}<select data-city-endpoint-field="${key}">${cityEndpointOptions(ref)}</select></label>`;}
function cityMulti(label,key,ids,col){const rows=cityData()?.[col]||[],unknown=ids.filter(id=>!rows.some(r=>r.id===id));return `<label>${esc(label)}<select multiple size="4" data-city-multi="${key}">${unknown.map(id=>`<option value="${esc(id)}" selected>MISSING · ${esc(id)}</option>`).join('')}${rows.map(r=>`<option value="${esc(r.id)}" ${ids.includes(r.id)?'selected':''}>${esc(r.name)}</option>`).join('')}</select><small>Ctrl-click / Command-click selects several. Existing missing references stay visible.</small></label>`;}
function cityPremisesField(r){return `<label>Premises<select data-city-field="premisesId">${cityOption('','— Unbound —',r.premisesId||'')}${r.premisesId&&!cityData().premises.some(x=>x.id===r.premisesId)?cityOption(r.premisesId,'MISSING · '+r.premisesId,r.premisesId):''}${cityData().premises.map(x=>cityOption(x.id,x.name,r.premisesId)).join('')}</select></label>`;}
function cityRefRows(label,key,rows,{spaceOnly=false,bindings=false}={}){
 return `<div class="cs-field-group"><h3>${esc(label)}</h3>${rows.map((row,i)=>`<div class="cs-binding-row">${bindings?`<select aria-label="Binding purpose ${i+1}" data-city-purpose="${i}">${CS.BINDING_PURPOSES.map(v=>cityOption(v,v,row.purpose)).join('')}</select>`:''}<select aria-label="${esc(label)} ${i+1}" data-city-ref-list="${key}" data-city-index="${i}">${cityPhysicalOptions(bindings?row.ref:row,spaceOnly)}</select><button type="button" class="small danger" data-city-remove-row="${key}" data-city-index="${i}" aria-label="Remove binding ${i+1}">×</button></div>`).join('')}<button type="button" class="small" data-city-add-row="${key}">+ Add binding</button></div>`;
}
function cityCapacityRows(rows){return `<div class="cs-field-group"><h3>Declared capacity · not current occupancy or stock</h3>${rows.map((r,i)=>`<div class="cs-capacity-row"><input aria-label="Capacity type ${i+1}" data-city-cap="kind" data-city-index="${i}" value="${esc(r.kind)}" placeholder="e.g. storage"><input aria-label="Capacity amount ${i+1}" type="number" min="0" step="any" data-city-cap="amount" data-city-index="${i}" value="${r.amount}"><input aria-label="Capacity unit ${i+1}" data-city-cap="unit" data-city-index="${i}" value="${esc(r.unit)}" placeholder="e.g. pallet positions"><button type="button" class="small danger" data-city-remove-row="capacities" data-city-index="${i}">×</button></div>`).join('')}<button type="button" class="small" data-city-add-row="capacities">+ Add capacity</button></div>`;}
function cityRenderEditor(){
 if(!CITY_EDIT)return;const {col,draft:r}=CITY_EDIT;let left='',right='';
 if(col==='buildings'){left=citySelectField('Physical form','form',r.form,CS.FORMS)+cityTextField('Tags (comma separated)','tags',r.tags.join(', '));right=cityRefRows('Existing spaces','spaces',r.spaces,{spaceOnly:true});}
 if(col==='premises'){left=citySelectField('Primary function','function',r.function,CS.FUNCTIONS)+citySelectField('Access intent','accessIntent',r.accessIntent,CS.ACCESS)+citySelectField('Vehicle relationship','vehicleIntent',r.vehicleIntent,CS.VEHICLE_INTENTS)+cityTextField('Operator socket key · no organization is instantiated','operatorSocket',r.operatorSocket)+cityTextField('Tags / secondary uses (comma separated)','tags',r.tags.join(', '));right=cityMulti('Building assemblies','buildingIds',r.buildingIds,'buildings')+cityRefRows('Premises spaces / shared areas','spaces',r.spaces,{spaceOnly:true})+cityCapacityRows(r.capacities);}
 if(col==='stations'){left=cityPremisesField(r)+citySelectField('Category','category',r.category,CS.STATION_CATEGORIES)+cityTextField('Purpose / activity label','purpose',r.purpose)+cityTextField('Declared simultaneous-use capacity','capacity',r.capacity,'type="number" min="1" step="1"')+cityRefField('Physical anchor','anchor',r.anchor);right=cityRefRows('Physical activity positions','bindings',r.bindings,{bindings:true});}
 if(col==='roleSlots'){left=cityPremisesField(r)+cityTextField('Role tag (e.g. cashier, resident, cleaner)','roleTag',r.roleTag)+cityTextField('Unfilled design slots · not actor count','slotCount',r.slotCount,'type="number" min="1" step="1"')+cityTextField('Requirement tags (comma separated)','requirementTags',r.requirementTags.join(', '));right=cityMulti('Activity sockets used by this role','stationIds',r.stationIds,'stations')+cityRefRows('Additional duty locations / routes','dutyRefs',r.dutyRefs);}
 if(col==='links'){left=citySelectField('Intended relationship','kind',r.kind,CS.LINK_KINDS)+cityEndpointField('From · intended controller / provider','from',r.from)+cityEndpointField('To · intended target / recipient','to',r.to);right=cityRefRows('Optional physical interfaces · not a new route','via',r.via)+`<p>For a downtown office → warehouse relationship, select the two premises and choose management, purchasing or pricing. No decisions or transactions run here.</p>`;}
 if(col==='accessPlans'){left=cityRefField('Existing boundary or area','target',r.target)+citySelectField('Intended access category','category',r.category,CS.ACCESS)+cityTextField('Relevant role tags (comma separated)','roleTags',r.roleTags.join(', '));right='<p>Use an existing doorway, rail edge, space or bay. This declaration never changes a lock, writes actor permissions or makes a bypass through a wall.</p>';}
 if(col==='requirements'){left=citySelectField('Support type','kind',r.kind,CS.REQUIREMENT_KINDS)+cityEndpointField('Consumer','consumer',r.consumer)+cityEndpointField('Proposed provider','provider',r.provider)+`<label class="check"><input data-city-field="required" type="checkbox" ${r.required?'checked':''}>Required support</label>`;right=cityRefRows('Physical interfaces','via',r.via)+'<p>An unbound provider remains a visible draft requirement. A resolved provider is not proof of operating capacity or availability.</p>';}
 modal(`${modalTitle((CITY_EDIT.existing?'Edit ':'Add ')+cityNames[col])}<div class="cs-boundary">Authoring only · no actors, occupancy, schedules, stock or live decisions.</div><p>${esc(cityHelp[col])}</p><div class="cs-editor-grid"><div>${cityTextField('Name','name',r.name,'maxlength="180"')}${left}<label>Notes<textarea data-city-field="notes" rows="4" maxlength="5000">${esc(r.notes)}</textarea></label></div><div>${right}</div></div><div class="cs-modal-footer"><small>Changes apply as one undoable edit. Physical records remain untouched.</small><button data-action="close-modal">Cancel</button><button id="cityApply" class="primary">Apply structure</button></div>`);
 $('modalRoot').querySelector('.modal').classList.add('cs-dialog');$('cityApply').onclick=cityApplyEditor;
}
function cityCollectEditor(){if(!CITY_EDIT)return;const r=CITY_EDIT.draft,root=$('modalRoot');
 root.querySelectorAll('[data-city-field]').forEach(el=>{const k=el.dataset.cityField;r[k]=['tags','requirementTags','roleTags'].includes(k)?el.value.split(',').map(s=>s.trim()).filter(Boolean):el.type==='checkbox'?el.checked:el.type==='number'?(el.value.trim()===''?NaN:Number(el.value)):k==='premisesId'?(el.value||null):el.value;});
 root.querySelectorAll('[data-city-ref-field]').forEach(el=>r[el.dataset.cityRefField]=el.value?JSON.parse(el.value):null);
 root.querySelectorAll('[data-city-endpoint-field]').forEach(el=>r[el.dataset.cityEndpointField]=el.value?JSON.parse(el.value):null);
 root.querySelectorAll('[data-city-multi]').forEach(el=>r[el.dataset.cityMulti]=[...el.selectedOptions].map(o=>o.value));
 root.querySelectorAll('[data-city-ref-list]').forEach(el=>{const key=el.dataset.cityRefList,i=Number(el.dataset.cityIndex),ref=el.value?JSON.parse(el.value):null;if(key==='bindings')r[key][i].ref=ref;else r[key][i]=ref;});
 root.querySelectorAll('[data-city-purpose]').forEach(el=>r.bindings[Number(el.dataset.cityPurpose)].purpose=el.value);
 root.querySelectorAll('[data-city-cap]').forEach(el=>r.capacities[Number(el.dataset.cityIndex)][el.dataset.cityCap]=el.dataset.cityCap==='amount'?(el.value.trim()===''?NaN:Number(el.value)):el.value);
}
function cityEdit(col,id=null,overrides={}){
 if(mode!=='build'||!CS.supported(cityData())){toast('Enable a supported City Structure layer in editing mode first.');return;}
 const record=id?cityData()[col]?.find(r=>r.id===id):null;if(id&&!record){toast('That structural record no longer exists.');return;}
 CITY_EDIT={col,draft:record?C.clone(record):CS.draft(col,overrides),existing:!!record,namespace:cityData().namespace,revision:cityData().revision};cityRenderEditor();
}
function cityApplyEditor(){
 try{cityCollectEditor();const edit=CITY_EDIT;if(!edit)return;if(cityData()?.namespace!==edit.namespace||cityData()?.revision!==edit.revision)throw Error('The project changed while this dialog was open. Cancel and reopen the record before applying.');
 const trial=C.clone(project);CS.put(trial,edit.col,edit.draft); // shape errors stay in the dialog; missing references remain inspectable drafts
 if(mutate(()=>CS.put(project,edit.col,edit.draft),'Edit '+cityNames[edit.col])){CITY_UI.collection=edit.col;CITY_UI.id=edit.draft.id;CITY_EDIT=null;closeModal();pane='city';refresh();}
 }catch(e){modalError(e);}
}
function cityDelete(){const r=cityCurrent(),col=CITY_UI.collection;if(!r)return;const used=CS.dependencies(project,r.id);if(used.length){toast('Still referenced by '+used.map(x=>x.name).join(', ')+'. Rebind those records first.',8000);return;}ask('Delete this structural record?','Only "'+r.name+'" will be removed. Physical ROOM geometry and other systems are not deleted.',()=>{if(mutate(()=>CS.remove(project,col,r.id),'Delete city structure record')){CITY_UI.id=null;refresh();}},'Delete record');}
function cityFocusRef(ref){const q=CS.referencePoint(project,ref,C);if(!q){toast('No resolvable physical position for this binding.');return;}cityFocusPoint(q);}
function cityFocusPoint(q){activeStory=q.story||0;const room=C.roomAt(project,q,0,activeStory);if(room){roomId=room.id;selection={kind:'room',id:roomId};}active='iso';window.RCApp.focusMap(q,2.5,activeStory);refresh();}
function cityFocusRecord(){const r=cityCurrent();if(!r)return;const q=CS.recordPoint(project,CITY_UI.collection,r,C);if(q)cityFocusPoint(q);else toast('Bind a physical place or parent premises before focusing this record.');}
function cityExport(){try{const data=CS.contract(project);download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),safeName(project.name)+'_city_structure.contract.json');toast('Structural contract exported. No runtime state or second movement graph was created.');}catch(e){toast(e.message,7000);}}
HOOKS.leftRender.push(el=>{if(pane==='city'&&mode==='build'){const scroll=el.scrollTop;el.innerHTML=cityPane();el.scrollTop=scroll;}});
HOOKS.inspectorRender.push(el=>{if(pane==='city'&&mode==='build'){const scroll=el.scrollTop;el.innerHTML=cityInspector();el.scrollTop=scroll;document.querySelectorAll('[data-panel]').forEach(b=>b.classList.remove('active'));}});
HOOKS.click.push((e,b)=>{
 if(b.dataset.cityView==='transport'){transportOpen();return true;}
 if(b.dataset.cityView==='structure'){cityOpen();return true;}
 if(b.dataset.pane==='city'){cityOpen(CITY_UI.collection,CITY_UI.id);return true;}
 if(pane==='city'&&b.dataset.pane){pane=b.dataset.pane;refresh();return true;}
 if(pane==='city'&&b.dataset.panel){pane='architecture';panel=b.dataset.panel;refresh();return true;}
 if(b.dataset.cityGroup){CITY_UI.collection=b.dataset.cityGroup;CITY_UI.id=null;CITY_UI.filter='';refresh();return true;}
 if(b.dataset.citySelect){citySelect(b.dataset.cityCollection,b.dataset.citySelect);return true;}
 if(b.dataset.cityFocusRef){cityFocusRef(JSON.parse(b.dataset.cityFocusRef));return true;}
 if(b.dataset.cityAddRow&&CITY_EDIT){cityCollectEditor();const key=b.dataset.cityAddRow;CITY_EDIT.draft[key].push(key==='bindings'?{purpose:'provider',ref:null}:key==='capacities'?{kind:'people',amount:1,unit:'people'}:null);cityRenderEditor();return true;}
 if(b.dataset.cityRemoveRow&&CITY_EDIT){cityCollectEditor();CITY_EDIT.draft[b.dataset.cityRemoveRow].splice(Number(b.dataset.cityIndex),1);cityRenderEditor();return true;}
 if(b.dataset.cityAction){const a=b.dataset.cityAction;if(a==='enable')cityEnable();if(a==='add')cityEdit(CITY_UI.collection);if(a==='edit')cityEdit(CITY_UI.collection,CITY_UI.id);if(a==='delete')cityDelete();if(a==='focus')cityFocusRecord();if(a==='inspect'){CITY_UI.id=null;renderInspector();drawSoon();}if(a==='export')cityExport();return true;}
 return false;
});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='cityCollection'){CITY_UI.collection=el.value;CITY_UI.id=null;CITY_UI.filter='';refresh();}if(el.id==='cityOverlay'){CITY_UI.overlay=el.checked;drawSoon();}if(el.id==='cityTies'){CITY_UI.ties=el.checked;drawSoon();}});
document.addEventListener('input',e=>{if(e.target.id==='cityFilter'){CITY_UI.filter=e.target.value;document.querySelectorAll('[data-city-name]').forEach(b=>b.hidden=!b.dataset.cityName.includes(CITY_UI.filter.toLowerCase()));}});
// Avoid deleting underlying geometry when the user is viewing a structural record.
HOOKS.keyDown.push(e=>{if(pane!=='city'||mode!=='build'||TRANSPORT_UI.active)return false;if(['Delete','Backspace'].includes(e.key)){e.preventDefault();cityDelete();return true;}return false;});
// City mode is an inspector, not an extra geometry editor. Map clicks select sockets;
// pan/zoom still use the editor's existing gestures. Edit geometry in Build / Move / Library.
HOOKS.pointerDown.unshift((e,q)=>{
 if(pane!=='city'||mode!=='build'||TRANSPORT_UI.active||active!=='iso'||e.button!==0||(typeof RW!=='undefined'&&RW.on))return false;
 if(CS.supported(cityData())){
  const candidates=[...cityData().stations.map(r=>({col:'stations',r})),...cityData().premises.map(r=>({col:'premises',r}))];
  for(const {col,r} of candidates){const p=CS.recordPoint(project,col,r,C);if(!p||p.story!==activeStory)continue;const a=C.isoPoint(project,p,p.z??C.storyElevation(project,p.story));if(Math.hypot(a.x-q.x,a.y-q.y)<16*mk()){citySelect(col,r.id);break;}}
 }
 return true;
});
document.addEventListener('keydown',e=>{if(pane==='city'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')){e.preventDefault();e.stopImmediatePropagation();toast('Whole-building duplication is not part of this foundation pass. No physical object was duplicated.');}},true);
function cityDrawLabel(g,q,label,k,color){g.font=`600 ${11*k}px Segoe UI`;const text=label.length>48?label.slice(0,45)+'…':label,w=g.measureText(text).width;g.fillStyle='#101b25ed';g.fillRect(q.x+9*k,q.y-12*k,w+10*k,20*k);g.fillStyle=color;g.textAlign='left';g.fillText(text,q.x+14*k,q.y+2*k);}
HOOKS.drawGraph.push((g,k)=>{
 if(pane!=='city'||mode!=='build'||TRANSPORT_UI.active||active!=='iso'||!CS.supported(cityData()))return;
 const s=cityData(),selectedRecord=cityCurrent(),point=q=>C.isoPoint(project,q,q.z??C.storyElevation(project,q.story||0));g.save();
 if(CITY_UI.overlay){
  const assembly=selectedRecord&&['buildings','premises'].includes(CITY_UI.collection)?selectedRecord:null;
  if(assembly)for(const ref of assembly.spaces){const r=CS.resolvePhysical(project,ref)?.record;if(!r||r.story!==activeStory||!Number.isFinite(r.width)||!Number.isFinite(r.length))continue;const corners=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.length},{x:r.x,y:r.y+r.length}].map(q=>point({...q,story:r.story||0}));g.fillStyle='#61d4c514';g.strokeStyle='#80e8d2';g.lineWidth=2.5*k;g.setLineDash([8*k,4*k]);g.beginPath();corners.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();g.stroke();g.setLineDash([]);}
  for(const r of s.premises){const p=CS.recordPoint(project,'premises',r,C);if(!p||p.story!==activeStory)continue;cityDrawLabel(g,point(p),r.name,k,'#a5eddd');}
  for(const r of s.stations){const p=r.anchor?CS.referencePoint(project,r.anchor,C):null;if(!p||p.story!==activeStory)continue;const q=point(p),sel=r.id===CITY_UI.id;g.strokeStyle=sel?'#ffd181':'#6ed8e0';g.fillStyle='#122737';g.lineWidth=2*k;g.beginPath();g.arc(q.x,q.y,(sel?8:5)*k,0,Math.PI*2);g.fill();g.stroke();if(sel)cityDrawLabel(g,q,r.name,k,'#ffd181');}
 }
 if(CITY_UI.ties)for(const r of [...s.links].sort((a,b)=>Number(a.id===CITY_UI.id)-Number(b.id===CITY_UI.id))){if(!r.from||!r.to)continue;const a=CS.recordPoint(project,CS.KINDS[r.from.kind],CS.resolveEndpoint(project,r.from),C),b=CS.recordPoint(project,CS.KINDS[r.to.kind],CS.resolveEndpoint(project,r.to),C);if(!a||!b||a.story!==activeStory||b.story!==activeStory)continue;const A=point(a),B=point(b);if(Math.hypot(A.x-B.x,A.y-B.y)<1)continue;g.strokeStyle=r.id===CITY_UI.id?'#ffc9f5':'#bc8bc9';g.lineWidth=(r.id===CITY_UI.id?2.5:1.5)*k;g.setLineDash([7*k,5*k]);g.beginPath();g.moveTo(A.x,A.y);g.lineTo(B.x,B.y);g.stroke();g.setLineDash([]);const angle=Math.atan2(B.y-A.y,B.x-A.x);g.beginPath();g.moveTo(B.x-10*k*Math.cos(angle-.5),B.y-10*k*Math.sin(angle-.5));g.lineTo(B.x,B.y);g.lineTo(B.x-10*k*Math.cos(angle+.5),B.y-10*k*Math.sin(angle+.5));g.stroke();if(r.id===CITY_UI.id||s.links.length===1)cityDrawLabel(g,{x:(A.x+B.x)/2,y:(A.y+B.y)/2},r.kind+' · declaration',k,'#e8c2ed');}
 g.restore();
});
HOOKS.messages.push(()=>pane==='city'&&mode==='build'?{select:'City Structure: references only. Edit physical geometry in Build / Move / Library. Dashed ties are organizational declarations, never movement paths.'}:{});
EXT.cityStructure={version:CS.VERSION,model:CS,state:CITY_UI,open:cityOpen,select:citySelect,enable:cityEnable,edit:cityEdit,
 put:(col,record)=>mutate(()=>CS.put(project,col,record),'Edit city structure'),remove:(col,id)=>mutate(()=>CS.remove(project,col,id),'Delete city structure'),inspect:()=>CS.inspect(project),contract:()=>CS.contract(project),focus:cityFocusRecord};
