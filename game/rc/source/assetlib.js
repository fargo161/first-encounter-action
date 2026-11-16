/* TRAPSTAR Room Creator 0.14 — asset library reader.
   Reads the standardized asset library (ASSET_MANIFEST.json + STANDARDIZED_LIBRARY) from a folder the user connects.
   - The library is never modified. Room Creator only reads it.
   - Each model is loaded once (GLB via three.js GLTFLoader) and shared by every placed copy.
   - Problems are reported in plain language; nothing here throws at the user.
   Where files come from is hidden behind a small "provider" (folder handle, picked file list, or a web address), so a
   later desktop wrapper only needs to add one more provider. */
(function(){'use strict';
const T=window.THREE,C=window.RCCore,AC=window.RCAssetContract;
let connectTicket=0;
const DB='rc-asset-library',STORE='kv';
/* 0.15.2: drawing features a library model may ask for in its manifest `requires` list. Models asking only for these are
   shown even when the library marks them “not for Room Creator” (that flag was written for 0.15.1, which could not draw them). */
const SUPPORTED_REQUIRES=new Set(['multi_material','alpha']);
const MODEL_CATEGORY_ORDER=['Furniture','Technology','Street','Clutter','Vehicles','Architecture Utility','Prototype Props','Prototype Shapes','Prototype Reference'];
const listeners=new Set();
const S={connected:false,connecting:false,name:'',kind:'',root:'',provider:null,manifest:null,index:new Map(),models:[],textures:[],palettes:[],
  modelCategories:[],textureCategories:[],report:null,revision:0,templates:new Map(),thumbs:new Map(),images:new Map(),fingerprint:'',fileCheck:null,storedName:null,generation:0,renderRevision:0};
function emit(what,id){S.revision++;if(['connected','disconnected','template'].includes(what))S.renderRevision++;for(const f of listeners)try{f(what,id);}catch(e){console.error(e);}}

// ------------------------------------------------------------------ tiny key-value store (folder handle, thumbnails)
function idb(){return new Promise((res,rej)=>{let r;try{r=indexedDB.open(DB,1);}catch(e){rej(e);return;}r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function kvGet(k){try{const d=await idb();return await new Promise(res=>{const t=d.transaction(STORE).objectStore(STORE).get(k);t.onsuccess=()=>res(t.result);t.onerror=()=>res(undefined);});}catch(e){return undefined;}}
async function kvSet(k,v){try{const d=await idb();await new Promise(res=>{const t=d.transaction(STORE,'readwrite').objectStore(STORE).put(v,k);t.onsuccess=()=>res();t.onerror=()=>res();});}catch(e){}}

// ------------------------------------------------------------------ file providers
function dirProvider(handle,prefix=[]){const cache=new Map();
  async function dir(parts){let h=handle,key='';for(const p of [...prefix,...parts]){key+='/'+p;if(cache.has(key)){h=cache.get(key);continue;}h=await h.getDirectoryHandle(p);cache.set(key,h);}return h;}
  return {kind:'folder',name:handle.name,
    async get(rel){const parts=rel.split('/').filter(Boolean),file=parts.pop();const d=await dir(parts);return (await d.getFileHandle(file)).getFile();},
    async list(onProgress){const out=new Set();let n=0;async function walk(h,path){for await(const [name,child] of h.entries()){const p=path?path+'/'+name:name;if(child.kind==='directory'){if(path===''&&name==='ORIGINAL_SOURCE_ARCHIVES')continue;await walk(child,p);}else{out.add(p);if(++n%200===0)onProgress?.(n);}}}
      await walk(prefix.length?await dir([]):handle,'');return out;}};}
function filesProvider(files){const map=new Map();let root=null;
  for(const f of files){const rel=(f.webkitRelativePath||f.name).replace(/\\/g,'/');map.set(rel,f);if(/(^|\/)ASSET_MANIFEST\.json$/.test(rel)&&(root===null||rel.length<root.length+18))root=rel.slice(0,rel.length-'ASSET_MANIFEST.json'.length);}
  root=root||'';return {kind:'files',name:(root.split('/').filter(Boolean).pop())||'library',root,
    async get(rel){const f=map.get(root+rel);if(!f)throw Error('not found: '+rel);return f;},
    async list(){const out=new Set();for(const k of map.keys())if(k.startsWith(root))out.add(k.slice(root.length));return out;}};}
function urlProvider(base){if(!base.endsWith('/'))base+='/';return {kind:'url',name:decodeURIComponent(base.split('/').filter(Boolean).pop()||'library'),
  async get(rel){const r=await fetch(base+rel.split('/').map(encodeURIComponent).join('/'));if(!r.ok)throw Error('not found: '+rel);return r.blob();},list:null};}
async function findManifestInHandle(h){try{await h.getFileHandle('ASSET_MANIFEST.json');return [];}catch(e){}
  for await(const [name,child] of h.entries()){if(child.kind!=='directory')continue;try{await child.getFileHandle('ASSET_MANIFEST.json');return [name];}catch(e){}}return null;}

// ------------------------------------------------------------------ connecting
const pickerSupported=()=>typeof window.showDirectoryPicker==='function';
async function connectPicker(){
  if(!pickerSupported())return {ok:false,fallback:true,message:'This browser cannot remember folders. Choose the library folder in the next window.'};
  let h;try{h=await window.showDirectoryPicker({id:'trapstar-asset-library',mode:'read'});}catch(e){return {ok:false,cancelled:true,message:'No folder chosen.'};}
  const r=await connectHandle(h);if(r.ok)await kvSet('handle',h);return r;}
async function connectHandle(h){const prefix=await findManifestInHandle(h);if(!prefix)return {ok:false,message:'That folder has no ASSET_MANIFEST.json. Choose your Room Creator asset library folder (the one with ASSET_MANIFEST.json inside) or the folder that contains it. Library v2 is current; a v1 library folder also works.'};
  return connectProvider(dirProvider(h,prefix),prefix.length?h.name+'/'+prefix[0]:h.name);}
async function storedHandle(){const h=await kvGet('handle');if(!h)return null;S.storedName=h.name;return h;}
async function reconnect({ask=true}={}){const h=await storedHandle();if(!h)return {ok:false,message:'No library folder remembered yet.'};
  try{let perm=await h.queryPermission?.({mode:'read'});if(perm!=='granted'&&ask)perm=await h.requestPermission?.({mode:'read'});if(perm!=='granted')return {ok:false,needsClick:true,message:'Click to allow Room Creator to read the library folder again.'};}catch(e){return {ok:false,message:'The remembered folder is not available any more. Connect it again.'};}
  return connectHandle(h);}
async function connectFiles(fileList){const files=[...fileList];if(!files.length)return {ok:false,cancelled:true,message:'No folder chosen.'};
  const p=filesProvider(files);if(!files.some(f=>(f.webkitRelativePath||f.name).endsWith('ASSET_MANIFEST.json')))return {ok:false,message:'That folder has no ASSET_MANIFEST.json. Choose your Room Creator asset library folder (the one with ASSET_MANIFEST.json inside) or the folder that contains it. Library v2 is current; a v1 library folder also works.'};
  return connectProvider(p,p.name);}
async function connectUrl(base){return connectProvider(urlProvider(base),base);}

async function connectProvider(provider,label){
  const ticket=++connectTicket;S.connecting=true;emit('connecting');
  try{
    let text;try{text=await (await provider.get('ASSET_MANIFEST.json')).text();}catch(e){return fail('ASSET_MANIFEST.json could not be read from that folder.');}
    let m;try{m=JSON.parse(text);}catch(e){return fail('ASSET_MANIFEST.json is damaged (it is not valid JSON), so the library cannot be used.');}
    if(!m||!Array.isArray(m.assets))return fail('ASSET_MANIFEST.json does not look like a Room Creator asset manifest (it has no list of assets).');
    let schema=null;try{schema=JSON.parse(await (await provider.get('CATEGORY_SCHEMA.json')).text());}catch(e){}
    let packs=null;try{packs=JSON.parse(await (await provider.get('SOURCE_PACK_MANIFEST.json')).text());}catch(e){}
    if(ticket!==connectTicket)return {ok:false,cancelled:true,message:'Superseded by a newer library connection.'};
    clearAssetCaches();S.generation++;
    S.provider=provider;S.manifest=m;S.name=m.library_name||provider.name;S.kind=provider.kind;S.root=label;S.schema=schema;S.packs=packs?.source_packs||[];
    buildIndex(m,schema);S.connected=true;S.fingerprint=S.name+'|'+AC.fingerprint(m);S.connecting=false;
    emit('connected');checkFiles();return {ok:true,message:summary()};
  }catch(e){return fail('Library connection failed: '+String(e.message||e));}finally{if(ticket===connectTicket)S.connecting=false;}
  function fail(message){if(ticket!==connectTicket)return {ok:false,cancelled:true,message:'Superseded by a newer library connection.'};S.connecting=false;emit('error');return {ok:false,message};}
}
function clearAssetCaches(){for(const t of S.templates.values())disposeTemplate(t);S.templates.clear();for(const u of S.thumbs.values())if(typeof u==='string'&&u.startsWith('blob:'))URL.revokeObjectURL(u);S.thumbs.clear();for(const im of S.images.values())Promise.resolve(im).then(x=>x?.close?.()).catch(()=>{});S.images.clear();thumbQueue.length=0;}
function disconnect(){connectTicket++;S.generation++;S.connecting=false;clearAssetCaches();S.connected=false;S.provider=null;S.index.clear();S.models=[];S.textures=[];S.palettes=[];S.report=null;S.fileCheck=null;emit('disconnected');}

// ------------------------------------------------------------------ index + plain-language check
function buildIndex(m,schema){
  const problems=[],seen=new Set(),index=new Map(),models=[],textures=[],palettes=[];
  m.assets.forEach((a,i)=>{
    if(!a||typeof a!=='object'){problems.push({level:'warn',text:`Entry ${i+1} in the manifest is not an asset record; it was skipped.`});return;}
    const id=a.asset_id;if(typeof id!=='string'||!id){problems.push({level:'warn',text:`Entry ${i+1} has no asset ID; it was skipped.`});return;}
    if(seen.has(id)){problems.push({level:'warn',text:`Two entries use the ID “${id}”; the second one was skipped.`});return;}seen.add(id);
    if(!AC.safePath(a.working_path)){problems.push({level:'warn',text:`“${a.display_name||id}” has an unsafe or missing relative file path; it was skipped.`});return;}
    const e={...a,id,name:a.display_name||id,category:(a.category_path||[])[0]||'Other',sub:(a.category_path||[])[1]||'',tags:Array.isArray(a.tags)?a.tags:[]};
    if(a.asset_type==='model'){
      if(!['palette','uv_texture','untextured'].includes(a.material_system)){problems.push({level:'info',text:`“${e.name}” has an unfamiliar material type (${a.material_system}); it is treated as a normal painted model.`});e.material_system='uv_texture';}
      const d=a.dimensions_m;if(!Array.isArray(d)||d.length!==3||!d.every(Number.isFinite)){problems.push({level:'warn',text:`“${e.name}” has no usable size in the manifest; its real size is measured when it loads.`});e.dims=null;}
      else{e.dims=d;const mx=Math.max(...d);if(mx>30)problems.push({level:'info',text:`“${e.name}” is unusually large (${mx.toFixed(1)} m).`});if(mx<.005)problems.push({level:'info',text:`“${e.name}” is unusually small (${(mx*1000).toFixed(1)} mm).`});}
      e.requires=Array.isArray(a.requires)?a.requires.filter(r=>typeof r==='string'):[];e.drawsPerPart=e.requires.some(r=>SUPPORTED_REQUIRES.has(r));
      e.unverifiedLicense=a.license_status!=='known'||a.commercial_use_verified!==true;e.hidden=a.recommended_for_room_creator===false&&!(e.requires.length&&e.requires.every(r=>SUPPORTED_REQUIRES.has(r)));models.push(e);}
    else if(a.asset_type==='surface_texture')textures.push(e);
    else if(a.asset_type==='palette')palettes.push(e);
    else{problems.push({level:'info',text:`“${e.name}” has an unknown type (${a.asset_type}); it was skipped.`});return;}
    index.set(id,e);});
  // palette families: the library has no explicit field, so a palette model belongs to the palette from its own source pack
  // (in v1 every palette model's built-in colour image is byte-identical to that palette; checked again when a model loads)
  const byPack=new Map();for(const p of palettes){if(!byPack.has(p.source_pack_id))byPack.set(p.source_pack_id,[]);byPack.get(p.source_pack_id).push(p);}
  let noFamily=0;for(const e of models){if(e.material_system!=='palette')continue;const fam=byPack.get(e.source_pack_id);if(fam?.length)e.paletteFamily=fam[0].id;else{e.paletteFamily=null;noFamily++;}}
  if(noFamily)problems.push({level:'warn',text:`${noFamily} palette-coloured objects have no matching palette in the library, so palette swapping is off for them.`});
  const catOrder=schema?.top_level_model_categories||[];const cats=[...new Set(models.map(e=>e.category))].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
  function rank(c){const i=MODEL_CATEGORY_ORDER.indexOf(c);return i<0?50+catOrder.indexOf(c):i;}
  const tcats=[...new Set(textures.map(e=>e.sub||e.category))].sort();
  const unverified=models.filter(e=>e.unverifiedLicense).length;
  S.index=index;S.models=models.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));S.textures=textures.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));S.palettes=palettes;S.modelCategories=cats;S.textureCategories=tcats;
  S.report={problems,counts:{models:models.length,textures:textures.length,palettes:palettes.length,hidden:models.filter(e=>e.hidden).length,unverified},missingFiles:[],loadFailures:[]};
}
function summary(){const c=S.report.counts,p=S.report.problems.filter(x=>x.level!=='info').length+S.report.missingFiles.length+S.report.loadFailures.length;
  return `Library connected: ${c.models} objects, ${c.textures} textures, ${c.palettes} palettes. `+(p?`${p} problem${p>1?'s':''} found (see the list in the Library tab).`:'Manifest indexed. Model geometry and images are checked when loaded.');}
async function checkFiles(){
  const generation=S.generation,provider=S.provider;
  if(!provider?.list){S.fileCheck={done:true,skipped:true};emit('files');return;}
  S.fileCheck={done:false,count:0};emit('files');let all;
  try{all=await provider.list(n=>{if(generation===S.generation){S.fileCheck.count=n;emit('files');}});}catch(e){if(generation!==S.generation)return;S.fileCheck={done:true,error:'The folder could not be listed, so missing files will only show up when they are used.'};emit('files');return;}
  if(generation!==S.generation)return;const missing=[];for(const e of S.index.values()){if(!all.has(e.working_path))missing.push({id:e.id,text:`${e.asset_type==='model'?'Model':e.asset_type==='palette'?'Palette':'Texture'} file missing: “${e.name}” (${e.working_path})`});}
  S.report.missingFiles=missing;for(const m of missing){const e=S.index.get(m.id);if(e)e.missing=true;}
  S.fileCheck={done:true,count:all.size};emit('files');}

// ------------------------------------------------------------------ reading files
async function blob(rel){if(!S.provider)throw Error('The asset library is not connected.');return S.provider.get(rel);}
async function imageOf(rel){if(S.images.has(rel))return S.images.get(rel);const generation=S.generation,provider=S.provider;const p=(async()=>{if(!provider)throw Error('The asset library is not connected.');const b=await provider.get(rel),im=await createImageBitmap(b,{imageOrientation:'none',premultiplyAlpha:'none',colorSpaceConversion:'none'});if(generation!==S.generation){im.close?.();throw Error('Library changed during image load.');}return im;})();S.images.set(rel,p);p.catch(()=>{if(S.images.get(rel)===p)S.images.delete(rel);});return p;}
async function dataUrl(rel){const b=await blob(rel);return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('cannot read '+rel));r.readAsDataURL(b);});}

// ------------------------------------------------------------------ models (one load per asset, shared by every copy)
function template(id){
  const e=S.index.get(id);if(!e||e.asset_type!=='model')return {status:S.connected?'missing':'offline',entry:e||null};
  let t=S.templates.get(id);if(!t){t={status:'loading',entry:e,scene:null,bounds:null,parts:[],baseTexture:null,error:null};t.generation=S.generation;t.provider=S.provider;S.templates.set(id,t);t.ready=loadTemplate(t);}return t;}
async function loadTemplate(t){
  const e=t.entry;
  try{
    if(!window.RCGLTFLoader)throw Error('the model loader is missing from this build');
    const buf=await (await t.provider.get(e.working_path)).arrayBuffer();if(t.generation!==S.generation){t.status='cancelled';return;}t.preflight=AC.requireSupported(buf);
    const manager=new T.LoadingManager();manager.setURLModifier(url=>{if(!/^(blob:|data:)/.test(url))throw Error('External model resources are not allowed; use a self-contained GLB.');return url;});const loader=new window.RCGLTFLoader(manager);
    const gltf=await new Promise((res,rej)=>loader.parse(buf,'',res,err=>rej(err instanceof Error?err:Error(String(err?.message||err)))));
    const scene=gltf.scene;if(t.generation!==S.generation){disposeTemplate({scene});t.status='cancelled';return;}t.scene=scene;scene.updateMatrixWorld(true);let tex=null;const parts=[];let tris=0;
    /* 0.15.2: no copy of the UV data in userData any more — three.js copies userData as JSON when a model is placed, and that
       crashed on interleaved vertex data ("Cannot create property 'interleavedBuffers' on string 'uvAttr'"). Nothing read it. */
    const looks=[],lookOf=new Map();
    scene.traverse(o=>{if(o.isMesh){parts.push(o.name||'part');tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
      for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&!lookOf.has(m.uuid)){
        if(m.map){m.map.colorSpace=T.NoColorSpace;m.map.flipY=false;if(!tex)tex=m.map;}
        const alphaMode=m.transparent?2:(m.alphaTest>0?1:0);lookOf.set(m.uuid,looks.length);looks.push({index:looks.length,name:m.name||'',map:m.map||null,color:'#'+(m.color?m.color.getHexString():'ffffff'),alphaMode,cutoff:m.alphaTest>0?m.alphaTest:.5,baseA:Number.isFinite(m.opacity)?m.opacity:1});
      }}});
    if(tex){tex.colorSpace=T.NoColorSpace;tex.flipY=false;}
    t.looks=looks;t.lookOf=lookOf;t.drawsPerPart=e.drawsPerPart||looks.length>1||looks.some(x=>x.alphaMode||x.color!=='#ffffff');
    scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(scene,true); /* precise: walks the vertices, so turned parts do not inflate the size */if(box.isEmpty())throw Error('the model has no visible geometry');
    t.scene=scene;t.baseTexture=tex;t.parts=parts;t.triangles=Math.round(tris);t.bounds={min:box.min.toArray().map(v=>+v.toFixed(4)),max:box.max.toArray().map(v=>+v.toFixed(4))};t.status='ready';
    if(e.dims){const sz=box.getSize(new T.Vector3()).toArray(),diff=Math.max(...sz.map((v,i)=>Math.abs(v-e.dims[i])));if(diff>Math.max(.05,.05*Math.max(...e.dims)))t.warning=`Its real size (${sz.map(v=>v.toFixed(2)).join(' × ')} m) differs from the manifest (${e.dims.map(v=>v.toFixed(2)).join(' × ')} m).`;}
    if(e.material_system==='palette'&&e.paletteFamily&&tex?.image){const pal=S.index.get(e.paletteFamily);if(pal?.dimensions_px&&(tex.image.width!==pal.dimensions_px[0]||tex.image.height!==pal.dimensions_px[1])){t.paletteMismatch=true;t.warning=(t.warning?t.warning+' ':'')+'Its colour image does not match its palette, so palette swapping is off for it.';}}
  }catch(err){if(t.generation!==S.generation){t.status='cancelled';return;}disposeTemplate(t);t.scene=null;t.status='error';t.error=plainLoadError(err);S.report?.loadFailures.push({id:e.id,text:`“${e.name}” could not be loaded: ${t.error}`});}
  if(t.generation===S.generation)emit('template',e.id);}
function plainLoadError(err){const m=String(err?.message||err);if(/not found|NotFoundError/i.test(m))return 'its file is missing from the library folder';if(/Unexpected|JSON|magic|version/i.test(m))return 'its file is damaged or not a GLB model';return m.slice(0,160);}
function disposeTemplate(t){const geometries=new Set(),materials=new Set(),textures=new Set();t.scene?.traverse(o=>{if(o.isMesh){if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const x of textures)x.dispose();}
function preload(ids){for(const id of ids)template(id);}

// colours a palette model actually uses (for "this object uses these colours" editing)
function usedColors(id){const t=S.templates.get(id);if(!t||t.status!=='ready'||!t.baseTexture?.image)return [];if(t.usedColors)return t.usedColors;
  const im=t.baseTexture.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data,count=new Map();
  t.scene.traverse(o=>{const uv=o.isMesh&&o.geometry.attributes.uv;if(!uv)return;for(let i=0;i<uv.count;i++){const x=Math.min(c.width-1,Math.max(0,Math.floor((uv.getX(i)%1+1)%1*c.width))),y=Math.min(c.height-1,Math.max(0,Math.floor((uv.getY(i)%1+1)%1*c.height))),k=(y*c.width+x)*4,hex='#'+[d[k],d[k+1],d[k+2]].map(v=>v.toString(16).padStart(2,'0')).join('');count.set(hex,(count.get(hex)||0)+1);}});
  t.usedColors=[...count.entries()].sort((a,b)=>b[1]-a[1]).map(([hex,n])=>({hex,n}));return t.usedColors;}

// ------------------------------------------------------------------ thumbnails (drawn from the models; the package's own previews show wrong colours)
let thumbR=null,thumbQueue=[],thumbBusy=false;
function thumb(id){
  if(S.thumbs.has(id)){const u=S.thumbs.get(id);if(!u){const i=thumbQueue.findIndex(x=>x.id===id&&x.generation===S.generation);if(i>0){const item=thumbQueue.splice(i,1)[0];thumbQueue.unshift(item);}}return u;}
  const e=S.index.get(id);if(!e)return null;const generation=S.generation,provider=S.provider,fingerprint=S.fingerprint,cacheKey=e.working_sha256?'thumb:renderer-3:'+fingerprint+':'+id+':'+e.working_sha256:null;S.thumbs.set(id,null);
  if(e.asset_type!=='model'){provider.get(e.working_path).then(b=>{if(generation!==S.generation)return;S.thumbs.set(id,URL.createObjectURL(b));emit('thumb');}).catch(()=>{});return null;}
  (async()=>{const cached=cacheKey?await kvGet(cacheKey):null;if(generation!==S.generation)return;if(cached instanceof Blob){S.thumbs.set(id,URL.createObjectURL(cached));emit('thumb');return;}thumbQueue.unshift({id,generation,cacheKey});pumpThumbs();})();return null;}
async function pumpThumbs(){if(thumbBusy)return;thumbBusy=true;try{while(thumbQueue.length){const {id,generation,cacheKey}=thumbQueue.shift();if(generation!==S.generation)continue;const t=template(id);if(t.status==='loading')await t.ready;if(t.status!=='ready'||generation!==S.generation)continue;const b=await renderThumb(t);if(b&&generation===S.generation){S.thumbs.set(id,URL.createObjectURL(b));if(cacheKey)kvSet(cacheKey,b);emit('thumb');}}}finally{thumbBusy=false;}}

async function renderThumb(t){
  try{
    if(!thumbR){const cv=document.createElement('canvas');cv.width=cv.height=160;thumbR=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});T.ColorManagement.enabled=false;thumbR.outputColorSpace=T.LinearSRGBColorSpace;}
    const sc=new T.Scene();sc.add(new T.AmbientLight(0xffffff,1.15));const dl=new T.DirectionalLight(0xffffff,1.25);dl.position.set(-2,4,3);sc.add(dl);
    const obj=t.scene.clone(true);const mats=[];obj.traverse(o=>{if(o.isMesh){const original=Array.isArray(o.material)?o.material:[o.material];const made=original.map((source,i)=>{const lk=partLook(t,o,i),m=new T.MeshLambertMaterial({map:lk?.map||null,color:lk?.color||0xffffff,side:T.DoubleSide,transparent:lk?.alphaMode===2,opacity:lk?.baseA??1,alphaTest:lk?.alphaMode===1?lk.cutoff:0,depthWrite:lk?.alphaMode!==2});mats.push(m);return m;});o.material=Array.isArray(o.material)?made:made[0];}});sc.add(obj);
    const b=t.bounds,size=new T.Vector3(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2]),ce=new T.Vector3((b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2),R=Math.max(.05,size.length()/2);
    const cam=new T.PerspectiveCamera(30,1,R/50,R*20),dir=new T.Vector3(.9,.62,1.05).normalize();cam.position.copy(ce).addScaledVector(dir,R/Math.sin(T.MathUtils.degToRad(15))*1.02);cam.lookAt(ce);
    thumbR.setClearColor(0x000000,0);thumbR.clear();thumbR.render(sc,cam);mats.forEach(m=>m.dispose());
    return await new Promise(res=>thumbR.domElement.toBlob(res,'image/png'));
  }catch(e){return null;}}

// 0.15.2: the look of one part of a placed copy (copies share the template's materials, so the material identifies the part)
function partLook(t,o,index=0){const m=Array.isArray(o.material)?o.material[index]:o.material;const i=m?t.lookOf?.get(m.uuid):undefined;return i===undefined?null:t.looks[i];}

// ------------------------------------------------------------------ licences / provenance
function provenance(e){if(!e)return null;const pack=S.packs.find(p=>p.pack_id===e.source_pack_id)||{};
  return {pack:e.source_pack_id,archive:e.source_archive||pack.archive_filename||'',license:pack.license||e.license||e.license_status||'unknown',status:e.license_status,commercial:e.commercial_use_verified===true?'verified':'NOT verified',
    unverified:e.license_status!=='known'||e.commercial_use_verified!==true,sourcePath:e.source_path,subasset:e.source_subasset,notes:e.conversion_notes||''};}

window.RCAssets={state:S,on(f){listeners.add(f);return ()=>listeners.delete(f);},pickerSupported,connectPicker,connectFiles,connectUrl,reconnect,storedHandle,disconnect,
  entry:id=>S.index.get(id)||null,template,preload,thumb,usedColors,partLook,SUPPORTED_REQUIRES,blob,imageOf,dataUrl,provenance,summary,get revision(){return S.revision;},
  get generation(){return S.generation;},get renderRevision(){return S.renderRevision;},get connected(){return S.connected;}};
})();
