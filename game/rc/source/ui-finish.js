/* Finish workspace 0.2: a derived, non-destructive view of the existing appearance contract.
 * Batches, clipboard paste and detailed material editing share the native fields and history.
 * No topology, operational state or additional persisted material store is introduced. */
const FIN=window.RCFinish;
const FIN_UI={mode:'surfaces',filter:'',group:'all',story:'all',severity:'all',findingFilter:'',keys:new Set(),current:null,lastOperation:-1};
function finishSync(){
 if(FIN_UI.lastOperation!==operation){FIN_UI.keys.clear();FIN_UI.current=null;FIN_UI.filter='';FIN_UI.group='all';FIN_UI.story='all';FIN_UI.severity='all';FIN_UI.findingFilter='';FIN_UI.lastOperation=operation;}
 const valid=new Set(FIN.surfaces(project).map(x=>x.key));FIN_UI.keys=new Set([...FIN_UI.keys].filter(k=>valid.has(k)));if(!valid.has(FIN_UI.current))FIN_UI.current=null;
}
function finishOpen(which='surfaces'){if(typeof RW!=='undefined'&&RW.on)rwStop();if(mode==='test')exitTest();finishSync();pane='finish';tool='select';pending=null;FIN_UI.mode=which;refresh();}
function finishReport(){return FIN.inspect(project,[...catalog.values()],{connected:A.connected,entries:A.state.index,templates:A.state.templates});}
function finishRows(){return FIN.surfaces(project).filter(d=>(FIN_UI.group==='all'||d.group===FIN_UI.group)&&(FIN_UI.story==='all'||String(d.story)===FIN_UI.story)&&d.label.toLowerCase().includes(FIN_UI.filter.trim().toLowerCase()));}
function finishSelection(){const rows=finishRows(),visible=rows.slice(0,250),selected=visible.filter(d=>FIN_UI.keys.has(d.key)).length;return {rows,visible,selected,hidden:FIN_UI.keys.size-selected};}
function finishLabel(slot){return slot.startsWith('walls.')?C.SIDE_NAMES[slot.slice(6)]+' wall override':slot.startsWith('faces.')?'Partition face '+slot.slice(6):({'wall':'Default walls','floor':'Floor','ceiling':'Ceiling','underside':'Underside','surface':'Surface'})[slot]||slot;}
function finishPane(){
 finishSync();const report=finishReport(),c=report.counts,v=finishSelection();
 let h=`<div class="section finish-head"><span class="eyebrow">PRESENTATION WORKSPACE · 0.2</span><h2>Finish & assets</h2><p>Dress the existing world.<br>Keep its physical structure intact.</p><div class="ti-switch"><button data-fin-mode="surfaces" aria-pressed="${FIN_UI.mode==='surfaces'}" class="${FIN_UI.mode==='surfaces'?'active':''}">Surfaces</button><button data-fin-mode="readiness" aria-pressed="${FIN_UI.mode==='readiness'}" class="${FIN_UI.mode==='readiness'?'active':''}">Readiness</button></div><div class="fin-metrics"><span><b>${c.textured}/${c.surfaces}</b> textured</span><span><b>${c.readyModels}/${c.placedModels}</b> models loaded</span></div></div>`;
 if(FIN_UI.mode==='readiness')return h+`<div class="section"><h3>Current checks</h3><div class="fin-severity-filters" aria-label="Filter readiness findings">${[['all','All',report.findings.length],['error','Errors',report.errors],['warning','Review',report.warnings],['info','Notes',report.infos]].map(([value,name,n])=>`<button data-fin-severity="${value}" aria-pressed="${FIN_UI.severity===value}" class="${FIN_UI.severity===value?'active':''}">${name}<b>${n}</b></button>`).join('')}</div><label>Find a diagnostic<input id="finishFindingFilter" type="search" value="${esc(FIN_UI.findingFilter)}" placeholder="Model, image, surface or code"></label><p>${c.embeddedImages} embedded images · ${(c.embeddedBytes/1048576).toFixed(2)} MiB encoded image data (approx.). GPU memory is additional.</p><button class="block" data-fin-action="refresh">Refresh checks</button><button class="block" data-fin-action="export">Export full readiness report</button><button class="block" data-fin-action="library">Open model library</button><button class="block" data-fin-action="intake">Asset intake guide</button><div class="info">Errors appear first. Filters affect this view only; the export always includes every finding. These checks do not certify physical or operational readiness.</div></div>`;
 h+=`<div class="section fin-selection-tools"><label>Find surfaces<input id="finishFilter" type="search" value="${esc(FIN_UI.filter)}" placeholder="Room, floor or wall name"></label><div class="form-grid"><label>Surface type<select id="finishGroup">${[['all','All'],['floor','Floors'],['wall','Walls'],['ceiling','Ceilings'],['structure','Structure']].map(([value,name])=>`<option value="${value}" ${FIN_UI.group===value?'selected':''}>${name}</option>`).join('')}</select></label><label>Story<select id="finishStory"><option value="all">All</option>${project.stories.map((story,i)=>`<option value="${i}" ${FIN_UI.story===String(i)?'selected':''}>${esc(storyName(i))}</option>`).join('')}</select></label></div><div class="button-row"><button data-fin-action="all">Select visible</button><button data-fin-action="clear-visible" ${v.selected?'':'disabled'}>Clear visible</button><button data-fin-action="none" ${FIN_UI.keys.size?'':'disabled'}>Clear all</button></div><p id="finishSelectionCount" role="status">${FIN_UI.keys.size} selected · ${v.rows.length} match filter${v.hidden?`<strong class="fin-hidden-selection">${v.hidden} selected outside this view</strong>`:''}</p><button class="primary block" data-fin-action="batch" ${FIN_UI.keys.size?'':'disabled'}>Review & apply finish…</button></div>`;
 h+=`<div class="section fin-targets">${v.visible.map(d=>{const a=d.surface?.finish==='image'?catalog.get(d.surface.textureId):null;return `<div class="fin-target ${FIN_UI.current===d.key?'active':''}" data-fin-row="${esc(d.label.toLowerCase())}"><input type="checkbox" aria-label="Select ${esc(d.label)}" data-fin-check="${esc(d.key)}" ${FIN_UI.keys.has(d.key)?'checked':''}><button data-fin-target="${esc(d.key)}" aria-pressed="${FIN_UI.current===d.key}"><span>${esc(d.name)}</span><small>${esc(finishLabel(d.slot))} · ${esc(storyName(d.story))}${d.inherited?' · inherited':''}</small></button><i class="fin-swatch" style="background:${esc(d.surface?.color||'#888888')}" title="${esc(d.surface?.finish||'Missing')}">${a?`<img src="${a.src}" alt="">`:''}</i></div>`;}).join('')||'<p>No surfaces match these filters.</p><button data-fin-action="reset-filters">Show all surfaces</button>'}${v.rows.length>250?'<p>250 rows shown. Refine the filter. Select visible selects only the displayed rows.</p>':''}</div>`;
 return h;
}
function finishFindings(report){
 const filtered=FIN.filterFindings(report,{severity:FIN_UI.severity,query:FIN_UI.findingFilter});
 if(!report.findings.length)return '<div class="info">No appearance-reference findings. This does not certify physical clearance or runtime behavior.</div>';
 return `<p class="subtle" role="status">${filtered.length} of ${report.findings.length} findings · errors first</p>`+(filtered.length?filtered.slice(0,100).map(d=>`<div class="cs-finding ${d.severity}"><span class="fin-issue-level">${esc(d.severity==='warning'?'Review':d.severity)}</span><b>${esc(d.code.replaceAll('_',' '))}</b><p>${esc(d.message)}</p>${d.target?`<button class="small" data-fin-target="${esc(d.target)}">Inspect surface</button>`:''}${d.propId?`<button class="small" data-fin-prop="${esc(d.propId)}">Inspect object</button>`:''}</div>`).join(''):'<p>No findings match this filter. Other findings may still exist.</p>')+(filtered.length>100?'<p>Showing 100 matching findings. Refine the filter or export the complete report.</p>':'');
}
function finishInspector(){
 finishSync();if(FIN_UI.mode==='readiness'){const r=finishReport();return `<section class="section"><span class="eyebrow">LIVE ASSET CHECK</span><h2>Asset & surface checks</h2><p>${esc(r.verification)}</p><p>Models stay external to the project. Surface images are embedded. Disconnecting the library does not remove saved instances or their use points.</p></section><section class="section">${finishFindings(r)}</section>`;}
 let d=null;try{if(FIN_UI.current)d=FIN.resolve(project,FIN_UI.current);}catch(error){}
 if(!d)return `<section class="section"><span class="eyebrow">ONE MATERIAL LANGUAGE</span><h2>Choose a real surface</h2><p>Inspect a floor, wall, ceiling, partition, stair or pillar. Check several surfaces to review a shared finish before applying it as one undoable transaction.</p><div class="info">Room defaults and explicit wall overrides are separate targets. Changing a default does not erase an override.</div><p>Copy an existing material here or in Build; paste through the same surface contract. The clipboard stays within this project.</p><button class="block" data-fin-action="intake">Asset intake guide</button></section>`;
 const s=d.surface||{},assigned=s.textureId?catalog.get(s.textureId):null,a=s.finish==='image'?assigned:null;
 return `<section class="section"><span class="eyebrow">BOUND TO EXISTING GEOMETRY</span><h2>${esc(d.name)}</h2><p>${esc(finishLabel(d.slot))} · ${esc(storyName(d.story))}${d.inherited?' · inherits room material until changed':''}</p><div class="fin-large-swatch" style="background-color:${esc(s.color||'#888888')}">${a?`<img src="${a.src}" alt="${esc(a.name)}">`:`<span>${esc(s.finish||'Missing material')}</span>`}</div><p><b>${esc(a?.name||(s.finish==='image'?'Image not available':'Procedural '+(s.finish||'finish')))}</b><br>Repeat ${fmt(s.tileSize||1)} × ${fmt(s.tileSizeY??s.tileSize??1)} ${unit()}<br>${esc(s.mapping)} · ${esc(s.coordinateMode)} coordinates · ${esc(s.filter)}</p>${assigned&&!a?'<p class="subtle">An image is retained but inactive. The procedural finish is currently rendered.</p>':''}<div class="button-row"><button data-fin-action="focus">Focus map</button><button data-fin-action="studio">Texture studio…</button></div><div class="button-row"><button data-fin-action="copy">Copy finish</button><button data-fin-action="paste" ${materialClipboard?'':'disabled'}>Paste finish…</button></div><button class="block" data-fin-action="single">Review finish here…</button><p class="subtle">Changes affect appearance only. Rails, doors, bays and activity sockets remain authoritative.</p><details class="details"><summary>Exact target</summary><code class="fin-id">${esc(d.key)}</code></details></section>`;
}
function finishFocus(d){activeStory=d.story;if(d.point&&Number.isFinite(d.point.x)){if(active!=='iso')setMode('iso');RCApp.focusMap(d.point,3,d.story);drawSoon();}}
function finishImageSignature(){return JSON.stringify([...catalog.values()].map(a=>[a.id,a.src]));}
async function finishPrepareRenderer(bundle,candidates=[R]){
 const nr=new window.RCRenderer(new Map(bundle.assets.map(a=>[a.id,a])));
 // Reuse a decode only when both identity and bytes agree. An unchanged ID is not a content guarantee.
 for(const a of bundle.assets)for(const source of candidates)if(source?.images.has(a.id)&&source.catalog.get(a.id)?.src===a.src&&(source.images.get(a.id).currentSrc||source.images.get(a.id).src)===a.src){nr.images.set(a.id,source.images.get(a.id));break;}
 await nr.load();return nr;
}
async function finishCommit(next,keys,expected,token,button){
 const prepared=await finishPrepareRenderer(next);
 for(let attempt=0;attempt<3;attempt++){
  if(!button.isConnected)return null;if(operation!==token)throw Error('The project changed. Cancel and reopen this edit.');
  const snapshot=finishImageSignature(),merged=FIN.mergePlan(makeBundle(),next,keys,expected),nr=await finishPrepareRenderer(merged,[R,prepared]);
  if(!button.isConnected)return null;if(operation!==token)throw Error('The project changed. Cancel and reopen this edit.');
  if(finishImageSignature()!==snapshot)continue;
  // Rebase again after decoding so unrelated edits are never rolled back.
  const latest=makeBundle(),rebased=FIN.mergePlan(latest,next,keys,expected),summary=FIN.summarizePlan(latest,rebased,keys);
  if(!summary.changed)return summary;
  if(!mutate(()=>{project=rebased.project;catalog=new Map(rebased.assets.map(a=>[a.id,a]));nr.catalog=catalog;R=nr;GLE?.setLegacy(R);},'Apply shared finish'))throw Error('The finish was not committed; review the project validation message.');
  return summary;
 }
 throw Error('Images kept changing while the finish was prepared. Wait for those edits, then apply again.');
}
function finishValue(value){return value===null?'—':typeof value==='number'?String(Math.round(value*10000)/10000):typeof value==='object'?JSON.stringify(value):String(value);}
function finishPlanSummary(summary){
 const first=summary.rows.find(r=>r.changed)||summary.rows[0];
 return `<div class="fin-plan-metrics" role="status"><span><b>${summary.changed}</b> will change</span><span><b>${summary.unchanged}</b> unchanged</span><span><b>${summary.addedImages.length}</b> new images</span></div>${summary.overrides?`<p>${summary.overrides} inherited surface(s) will receive an explicit override.</p>`:''}<p>${summary.changed?'Apply makes one undo step. Unchanged targets are left alone.':'No changes yet. Closing or applying this proposal will not add an undo step.'}</p><div class="fin-compare"><figure><canvas id="finishBeforePreview" width="320" height="150" aria-label="Current surface finish"></canvas><figcaption>Current</figcaption></figure><figure><canvas id="finishAfterPreview" width="320" height="150" aria-label="Proposed surface finish"></canvas><figcaption>Proposed</figcaption></figure></div><p id="finishPreviewCaption" class="subtle">Neutral material preview · ${esc(first?.label||'')}</p><details class="details"><summary>Review changed fields (${summary.changed} surface${summary.changed===1?'':'s'})</summary>${summary.rows.filter(r=>r.changed).slice(0,30).map(r=>`<div class="fin-delta"><b>${esc(r.label)}</b>${r.createsOverride?'<small>Creates an explicit override</small>':''}<dl>${r.fields.map(f=>`<dt>${esc(f)}</dt><dd>${esc(finishValue(r.before[f]))} → ${esc(finishValue(r.after[f]))}</dd>`).join('')}</dl></div>`).join('')||'<p>All selected surfaces already match.</p>'}${summary.changed>30?'<p>Field details limited to 30 changed surfaces; the total above covers the entire selection.</p>':''}</details>`;
}
function finishDrawCompare(before,after,summary,nr){
 const row=summary.rows.find(r=>r.changed)||summary.rows[0];if(!row)return;const d=FIN.resolve(project,row.key),space=surfaceSpaceFor(d.spec),room=C.roomById(project,d.spec.roomId);
 for(const [id,renderer,material] of [['finishBeforePreview',R,row.before],['finishAfterPreview',nr,row.after]]){const cv=$(id);if(!cv)continue;const ctx=cv.getContext('2d'),ratio=space.w/space.h,w=Math.min(cv.width,cv.height*ratio),h=w/ratio;ctx.fillStyle='#0b141d';ctx.fillRect(0,0,cv.width,cv.height);const im=renderer.surfaceCanvas(project,room,material,space,Math.max(2,Math.round(w)),Math.max(2,Math.round(h)),{neutral:true,wall:space.line});ctx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h);}
}
function finishBatch(keys,{paste=false}={}){
 keys=[...keys];if(!keys.length){toast('Select at least one surface.');return;}let expected;try{expected=FIN.signature(project,keys);if(paste)copiedSurfaceMaterial();}catch(error){toast(error.message);return;}
 const token=operation,visible=new Set(finishRows().slice(0,250).map(d=>d.key)),hidden=keys.filter(k=>!visible.has(k)).length;
 modal(`${modalTitle('Review a shared finish')}<div class="fin-batch-layout"><div class="fin-batch-settings"><p><b>${keys.length} physical surface${keys.length===1?'':'s'}</b>. Appearance only; no geometry, paths or transport bindings change.${hidden?`<strong class="fin-hidden-selection">${hidden} selected outside the current filtered view.</strong>`:''}</p><details class="details"><summary>Review exact targets</summary><ul>${keys.map(k=>`<li>${esc(FIN.resolve(project,k).label)}</li>`).join('')}</ul></details><label>Finish recipe<select id="finishRecipe"><option value="custom">Keep current finish · mapping or image only</option>${materialClipboard?`<option value="copied" ${paste?'selected':''}>Copied finish · ${esc(materialClipboardMeta?.label||'surface')}</option>`:''}${Object.entries(FIN.RECIPES).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('')}</select></label><div class="fin-recipe-preview" id="finishRecipePreview"></div><label class="check"><input id="finishKeepImages" type="checkbox" ${paste?'':'checked'}>Keep already assigned images</label><label class="check"><input id="finishKeepMapping" type="checkbox" ${paste?'':'checked'}>Keep existing mapping / repeat sizes</label><details class="details"><summary>Explicit image and repeat overrides</summary><label>Image override<select id="finishImage"><option value="keep">No explicit override</option><option value="none">Clear texture · plain paint</option>${[...catalog.values()].map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')}</select></label><div class="form-grid"><label>Tile width (${unit()})<input id="finishTile" type="number" min="0.01" step="0.01" placeholder="Keep"></label><label>Tile height (${unit()})<input id="finishTileY" type="number" min="0.01" step="0.01" placeholder="Keep"></label></div><p>Blank keeps the result. Values are displayed in ${unit()} and stored in meters. Explicit overrides take precedence over the preservation checkboxes.</p></details></div><div class="fin-batch-review"><span class="eyebrow">PROPOSAL · NOT YET APPLIED</span><div id="finishPlanReview"></div></div></div><div id="finishBatchError" class="error-text hidden" role="alert"></div><div class="fin-batch-footer"><span class="subtle">Source images and physical bindings stay intact.</span><button data-action="close-modal">Cancel</button><button id="finishBatchApply" class="primary">Apply finish</button></div>`);
 $('modalRoot').querySelector('.modal').classList.add('fin-batch-dialog');const button=$('finishBatchApply'),box=$('finishBatchError');let previewVersion=0,busy=false;
 function propose(){
  if(operation!==token)throw Error('The project changed. Cancel and reopen this edit.');
  const recipe=$('finishRecipe').value,patch=recipe==='copied'?copiedSurfaceMaterial():recipe==='custom'?{}:null,overrides={},image=$('finishImage').value;
  if(image!=='keep')Object.assign(overrides,{textureId:image==='none'?null:image,finish:image==='none'?'paint':'image',textureOpacity:1});
  for(const [field,id] of [['tileSize','finishTile'],['tileSizeY','finishTileY']])if($(id).value.trim()!==''){const v=Number($(id).value);if(!Number.isFinite(v))throw Error('Repeat sizes must be finite numbers.');overrides[field]=C.fromDisplay(v,project.units);}
  const current=makeBundle(),next=FIN.proposal(current,keys,{recipe:patch?null:recipe,patch,preserveImages:$('finishKeepImages').checked,preserveMapping:$('finishKeepMapping').checked,expected},overrides);
  return {current,next,summary:FIN.summarizePlan(current,next,keys)};
 }
 async function preview(){
  if(busy||!button.isConnected)return;const version=++previewVersion;box.classList.add('hidden');
  const recipe=FIN.RECIPES[$('finishRecipe').value],asset=recipe?.texture?window.RCBlockTextures[recipe.texture]:null;
  $('finishRecipePreview').innerHTML=asset?`<img src="${asset.src}" alt="${esc(asset.name)}"><span>${esc(asset.name)}<small>Native repeat ${fmt(asset.tile)} ${unit()} · embedded only when used</small></span>`:'<span>No new recipe image required.</span>';
  try{const {current,next,summary}=propose();$('finishPlanReview').innerHTML=finishPlanSummary(summary);button.textContent=summary.changed?'Apply finish':'No changes · close';
   const renderer=await finishPrepareRenderer(next);if(version!==previewVersion||!button.isConnected||busy)return;finishDrawCompare(current,next,summary,renderer);
  }catch(error){if(version!==previewVersion||!button.isConnected||busy)return;box.textContent=error.message;box.classList.remove('hidden');$('finishPlanReview').innerHTML='<p>Resolve the issue below to review this proposal.</p>';button.textContent='Apply finish';}
 }
 $('modalRoot').querySelectorAll('#finishRecipe,#finishKeepImages,#finishKeepMapping,#finishImage,#finishTile,#finishTileY').forEach(el=>el.addEventListener(el.type==='number'?'input':'change',preview));
 button.onclick=async()=>{if(busy)return;busy=true;previewVersion++;button.disabled=true;box.classList.add('hidden');try{
  const {next,summary}=propose();if(!summary.changed){closeModal();toast('No material changes. No undo step added.');return;}
  button.textContent='Preparing finish…';const result=await finishCommit(next,keys,expected,token,button);if(!result)return;
  closeModal();toast(result.changed?'Applied to '+result.changed+' surface(s). '+result.unchanged+' unchanged. One undo step.':'No material changes. No undo step added.');
 }catch(error){if(box.isConnected){box.textContent=error.message;box.classList.remove('hidden');}}finally{busy=false;if(button.isConnected){button.disabled=false;button.textContent='Apply finish';}}};
 preview();
}
function finishIntake(){modal(`${modalTitle('Asset intake · existing pipeline')}<p>Use <b>Library</b> for standardized 3D packs; use <b>Images</b> or the texture studio for PNG, JPEG and WebP surfaces. The complete checkpoint includes <code>tools/prepare_asset_library.py</code> to turn a folder of supported static GLBs and images into a local library.</p><ol><li>Prepare the library using the supplied script. It checks the supported GLB subset, records dimensions and provenance, and adds a floor-centered root transform without changing vertex data.</li><li>Connect the generated folder in Library. Models are external; keep the folder alongside your work.</li><li>Inspect size, front direction, collision and Use Points before saving an object setup. A visual model does not grant access or supply a service.</li><li>Run Readiness, then rerun the physical scene tests after adding solid props near doors, paths or bays.</li></ol><div class="info">Import accepts static, self-contained, uncompressed GLB 2.0 geometry. Unsupported compression, animation, skinning, external files or material extensions are reported—not silently stripped. This is a compatibility gate, not full glTF certification.</div><p>Coordinates: source GLB uses meters and +Y up. ROOM stores ground position as x/y and elevation as z; the existing asset adapter performs that mapping. The GLB front must be reviewed, not guessed.</p><div class="button-row"><button data-action="close-modal" class="primary">Close</button></div>`);}

HOOKS.leftRender.push(el=>{if(pane==='finish'&&mode==='build'){const y=el.scrollTop;el.innerHTML=finishPane();el.scrollTop=y;}});
HOOKS.inspectorRender.push(el=>{if(pane==='finish'&&mode==='build'){const y=el.scrollTop;el.innerHTML=finishInspector();el.scrollTop=y;document.querySelectorAll('[data-panel]').forEach(b=>b.classList.remove('active'));}});
HOOKS.click.unshift((e,b)=>{
 if(b.dataset.pane==='finish'){finishOpen();return true;}if(pane==='finish'&&b.dataset.pane){pane=b.dataset.pane;refresh();return true;}if(pane==='finish'&&b.dataset.panel){pane='architecture';panel=b.dataset.panel;refresh();return true;}
 if(b.dataset.finMode){FIN_UI.mode=b.dataset.finMode;refresh();return true;}
 if(b.dataset.finSeverity){FIN_UI.severity=b.dataset.finSeverity;refresh();return true;}
 if(b.dataset.finTarget){if(FIN_UI.mode==='readiness'){FIN_UI.filter='';FIN_UI.group='all';FIN_UI.story='all';}FIN_UI.mode='surfaces';FIN_UI.current=b.dataset.finTarget;refresh();return true;}
 if(b.dataset.finProp){pane='library';EXT.props.select(b.dataset.finProp);return true;}
 const action=b.dataset.finAction;if(!action)return false;
 try{
  if(action==='all')for(const d of finishRows().slice(0,250))FIN_UI.keys.add(d.key);
  if(action==='clear-visible')for(const d of finishRows().slice(0,250))FIN_UI.keys.delete(d.key);
  if(action==='none')FIN_UI.keys.clear();
  if(action==='reset-filters'){FIN_UI.filter='';FIN_UI.group='all';FIN_UI.story='all';}
  if(['all','none','clear-visible','refresh','reset-filters'].includes(action)){refresh();return true;}
  if(action==='batch'){finishBatch(FIN_UI.keys);return true;}
  if(action==='single'&&FIN_UI.current){finishBatch([FIN_UI.current]);return true;}
  if(action==='focus'&&FIN_UI.current){finishFocus(FIN.resolve(project,FIN_UI.current));return true;}
  if(action==='studio'&&FIN_UI.current){const d=FIN.resolve(project,FIN_UI.current);roomId=d.spec.roomId||roomId;openStudio(null,d.spec);return true;}
  if(action==='copy'&&FIN_UI.current){const d=FIN.resolve(project,FIN_UI.current);copySurfaceMaterial(d.surface,d.label);renderInspector();toast('Finish copied. Paste here, in Build, or choose Copied finish in a batch.');return true;}
  if(action==='paste'&&FIN_UI.current){finishBatch([FIN_UI.current],{paste:true});return true;}
  if(action==='library'){pane='library';refresh();return true;}
  if(action==='intake'){finishIntake();return true;}
  if(action==='export'){download(new Blob([JSON.stringify(finishReport(),null,2)],{type:'application/json'}),safeName(project.name)+'_asset_readiness.json');return true;}
 }catch(error){toast(error.message);}
 return true;
});
function finishRefreshInputs(){
 const active=document.activeElement,id=active?.id,typing=['finishFilter','finishFindingFilter'].includes(id),start=typing?active.selectionStart:null,end=typing?active.selectionEnd:null;
 renderLeft();if(FIN_UI.mode==='readiness')renderInspector();
 if(typing&&$(id)){$(id).focus({preventScroll:true});$(id).setSelectionRange(start,end);}
}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.finCheck!==undefined){t.checked?FIN_UI.keys.add(t.dataset.finCheck):FIN_UI.keys.delete(t.dataset.finCheck);renderLeft();}if(t.id==='finishGroup'||t.id==='finishStory'){FIN_UI[t.id==='finishGroup'?'group':'story']=t.value;renderLeft();}});
let finishSearchTimer=0;document.addEventListener('input',e=>{const field={'finishFilter':'filter','finishFindingFilter':'findingFilter'}[e.target.id];if(!field)return;FIN_UI[field]=e.target.value;clearTimeout(finishSearchTimer);finishSearchTimer=setTimeout(()=>{if(pane==='finish')finishRefreshInputs();},170);});
HOOKS.keyDown.unshift(e=>{if(pane==='finish'&&mode==='build'&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'')&&(['Delete','Backspace','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','p','P'].includes(e.key)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'))){e.preventDefault();toast('Finish edits appearance only. Use Build or Library to change physical objects.');return true;}return false;});
HOOKS.messages.push(()=>pane==='finish'?{select:'Finish: review appearance before applying. Copy/paste uses the same materials; physical bindings stay intact.'}:{});
EXT.finish={version:FIN.VERSION,open:finishOpen,state:FIN_UI,inspect:finishReport,targets:()=>FIN.surfaces(project),batch:finishBatch};
HOOKS.pointerDown.unshift((e,q)=>pane==='finish'&&mode==='build'&&active==='iso'&&e.button===0&&!e.altKey);
HOOKS.top.push(()=>document.body.classList.toggle('finish-workspace',pane==='finish'&&mode==='build'));
let finishAssetTimer=0;A.on(what=>{if(!['connected','disconnected','template','files'].includes(what))return;clearTimeout(finishAssetTimer);finishAssetTimer=setTimeout(()=>{if(pane!=='finish')return;finishRefreshInputs();if(FIN_UI.mode!=='readiness')renderInspector();},200);});
