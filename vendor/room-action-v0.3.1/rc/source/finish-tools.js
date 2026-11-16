/* Finishing & asset readiness 0.2 — derived views of existing ROOM data.
 * No new topology, inventory, permissions, model store, or saved readiness verdict.
 * Geometry remains authoritative. Texture recipes become ordinary surface fields.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.RCCore,typeof module==='object'&&module.exports?require('./block-textures.js'):root.RCBlockTextures);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RCFinish=api;})(typeof window!=='undefined'?window:null,function(C,kit){'use strict';
const VERSION='0.2.0',clone=C.clone;
const RECIPES=Object.freeze({
 asphalt:{name:'Street asphalt',texture:'asphalt',patch:{color:'#686b70',brightness:.84}},
 paving:{name:'Sidewalk paving',texture:'paving',patch:{color:'#a4aaab'}},
 concrete:{name:'Utility concrete',texture:'concrete',patch:{color:'#939b9e'}},
 brick:{name:'Brick frontage',texture:'brick',patch:{color:'#a67b68'}},
 grass:{name:'Grass / verge',texture:'grass',patch:{color:'#68774b'}},
 plaster:{name:'Warm plaster',patch:{finish:'paint',color:'#c5bba8',secondary:'#ddd7c9',tileSize:1,wear:.06}},
 tile:{name:'Service tile',patch:{finish:'tile',color:'#adbcb8',secondary:'#536363',tileSize:.5,jointWidth:.012,wear:.08}},
 boards:{name:'Worn floorboards',patch:{finish:'wood',color:'#896b50',secondary:'#574535',tileSize:.8,wear:.18}},
 metal:{name:'Painted steel',patch:{finish:'paint',color:'#647783',secondary:'#a5b2b4',tileSize:1,wear:.04}}
});
const key=(kind,id,slot)=>JSON.stringify([kind,id,slot]);
function surfaces(p){
 const out=[];
 function add(kind,o,slot,surface,group,spec,point,inherited=false){out.push({key:key(kind,o.id,slot),kind,id:o.id,slot,name:o.name||o.id,label:(o.name||o.id)+' · '+slot.replaceAll('.',' / '),group,story:o.story??C.roomById(p,o.roomId)?.story??0,surface,inherited,spec,point});}
 for(const r of p.rooms||[]){const pt={x:r.x+r.width/2,y:r.y+r.length/2};for(const slot of ['floor','wall','ceiling'])add('room',r,slot,r[slot],slot,{kind:'surface',surface:slot,roomId:r.id},pt);for(const side of C.SIDES)if(r.walls?.[side])add('room',r,'walls.'+side,r.walls[side],'wall',{kind:'surface',surface:'selectedWall',roomId:r.id,side},pt);}
 for(const f of p.floorSections||[]){const pt={x:f.x+f.width/2,y:f.y+f.length/2};add('floorsection',f,'floor',f.floor,'floor',{kind:'surface',surface:'floorSection',floorSectionId:f.id,roomId:f.roomId||p.rooms?.[0]?.id},pt);add('floorsection',f,'underside',f.underside,'ceiling',{kind:'surface',surface:'floorSectionUnder',floorSectionId:f.id,roomId:f.roomId||p.rooms?.[0]?.id},pt);}
 for(const q of p.partitions||[]){const w=C.partitionLine(q),pt=C.wallPoint(w,(w.start+w.end)/2);for(const face of ['A','B'])add('partition',q,'faces.'+face,q.faces?.[face],'wall',{kind:'surface',surface:'partition',partitionId:q.id,roomId:q.roomId,face},pt);}
 for(const q of p.ceilingPatches||[])add('ceilingpatch',q,'surface',q.surface||C.roomById(p,q.roomId)?.ceiling,'ceiling',{kind:'surface',surface:'ceilingPatch',ceilingPatchId:q.id,roomId:q.roomId},{x:q.x+q.width/2,y:q.y+q.length/2},!q.surface);
 for(const q of p.pillars||[])add('pillar',q,'surface',q.surface,'structure',{kind:'surface',surface:'pillar',pillarId:q.id,roomId:q.roomId||p.rooms?.[0]?.id},{x:q.x,y:q.y});
 for(const q of p.stairs||[])add('stairs',q,'surface',q.surface,'structure',{kind:'surface',surface:'stairs',stairsId:q.id,roomId:q.roomId||p.rooms?.[0]?.id},{x:q.x,y:q.y});
 return out;
}
// Resolve many targets against one derived index. Ambiguity must never pick the first match.
function surfaceIndex(p){const index=new Map();for(const d of surfaces(p)){const a=index.get(d.key)||[];a.push(d);index.set(d.key,a);}return index;}
function fromIndex(index,k){const found=index.get(k)||[];if(found.length!==1)throw Error(found.length?'Ambiguous surface identity; repair the duplicate physical ID.':'This surface no longer exists. Reselect the current target.');return found[0];}
function resolve(p,k){return fromIndex(surfaceIndex(p),k);}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const SURFACE_FIELDS=Object.freeze(Object.keys(C.surface('#ffffff')));
// Copy only the known appearance contract. Extension metadata belongs to its target, not the clipboard.
function surfacePatch(surface){const patch={};for(const k of SURFACE_FIELDS)if(Object.hasOwn(surface,k))patch[k]=clone(surface[k]);return patch;}

function assign(p,d,value){const list={room:'rooms',floorsection:'floorSections',partition:'partitions',ceilingpatch:'ceilingPatches',pillar:'pillars',stairs:'stairs'}[d.kind],o=p[list].find(x=>x.id===d.id),parts=d.slot.split('.');if(parts.length===1)o[d.slot]=value;else o[parts[0]][parts[1]]=value;}
function signature(p,keys){const index=surfaceIndex(p);return JSON.stringify(keys.map(k=>{const d=fromIndex(index,k);return [k,d.surface,d.inherited];}));}
function ensureTexture(assets,name){const a=kit?.[name];if(!a)throw Error('That built-in texture is not included in this build.');const same=assets.find(x=>x.src===a.src);if(same)return same.id;let id=a.id,n=1;const used=new Set(assets.map(x=>x.id));while(used.has(id))id=a.id+'_'+n++;assets.push({...clone(a),id,category:'texture',view:'both'});return id;}
function recipePatch(id,assets){const r=RECIPES[id];if(!r)throw Error('Choose a finish recipe.');const patch={...C.surface(r.patch.color||'#b3b6b6'),...clone(r.patch)};if(r.texture){const a=kit[r.texture];Object.assign(patch,{finish:'image',textureId:ensureTexture(assets,r.texture),tileSize:a.tile,tileSizeY:null,filter:'pixel',...a.tweak,...r.patch});}return patch;}
function plan(bundle,keys,{recipe=null,patch=null,preserveImages=false,preserveMapping=false,expected=null}={}){
 if(!Array.isArray(keys)||!keys.length)throw Error('Select at least one actual surface.');if(new Set(keys).size!==keys.length)throw Error('The same surface was selected more than once.');
 const p=clone(bundle.project),assets=[...(bundle.assets||[])],index=surfaceIndex(p),targets=keys.map(k=>fromIndex(index,k));if(expected!==null&&signature(p,keys)!==expected)throw Error('A selected surface changed while this edit was open. Cancel and reopen it.');
 let change=recipe?recipePatch(recipe,assets):patch?clone(patch):null;if(!change||typeof change!=='object'||Array.isArray(change))throw Error('Choose a valid surface change.');
 const allowed=new Set(SURFACE_FIELDS);for(const k of Object.keys(change))if(!allowed.has(k))throw Error('Not a surface field: '+k);
 for(const d of targets){const old=d.surface;if(!old)throw Error('A selected surface has no material definition.');const next={...clone(old),...clone(change)};
  if(preserveImages&&old.textureId)for(const k of ['textureId','finish','textureOpacity'])next[k]=old[k];
  if(preserveMapping)for(const k of ['mapping','coordinateMode','tileSize','tileSizeY','angle','offsetX','offsetY','flipX','flipY'])next[k]=old[k];
  // An empty/no-op edit must not turn an inherited ceiling patch into an override.
  if(!equal(next,old))assign(p,d,next);
 }
 // Do not import a recipe texture if every target preserved its old picture.
 const oldIds=new Set((bundle.assets||[]).map(a=>a.id)),used=new Set(surfaces(p).map(d=>d.surface?.textureId));const kept=assets.filter(a=>oldIds.has(a.id)||used.has(a.id));
 return C.validateBundle({project:p,assets:kept});
}
// Rebase a prepared visual edit onto the latest project in one validation pass.
// Only selected surface records and the image bytes they actually need can cross this boundary.
function mergePlan(current,planned,keys,expected){
 if(signature(current.project,keys)!==expected)throw Error('A selected surface changed during preparation. Reopen this edit.');
 const p=clone(current.project),assets=[...(current.assets||[])],needed=new Set(),dstIndex=surfaceIndex(p),srcIndex=surfaceIndex(planned.project);
 for(const k of keys){const dst=fromIndex(dstIndex,k),src=fromIndex(srcIndex,k);if(!equal(dst.surface,src.surface)||dst.inherited!==src.inherited)assign(p,dst,clone(src.surface));if(src.surface.textureId)needed.add(src.surface.textureId);}
 for(const id of needed){const old=assets.find(a=>a.id===id),src=(planned.assets||[]).find(a=>a.id===id);if(!src)throw Error('The prepared finish is missing its image.');if(old&&old.src!==src.src)throw Error('An image ID changed during preparation; reopen this edit.');if(!old)assets.push(src);}
 return C.validateBundle({project:p,assets});
}
function eachSurface(p,fn){for(const d of surfaces(p))if(!d.inherited&&d.surface)fn(d.surface,d);for(const l of p.stylePresets||[])for(const s of [l.look?.floor,l.look?.wall,l.look?.ceiling,...Object.values(l.look?.walls||{})])if(s)fn(s,null);}
// Each reference carries an actionable target when the existing editor has one.
function imageReferences(p){
 const refs=[],add=(id,where,target=null,propId=null)=>{if(typeof id==='string'&&id)refs.push({id,where,target,propId});};
 eachSurface(p,(s,d)=>add(s.textureId,d?.label||'Saved room look',d?.key||null));
 for(const r of p.rooms||[]){add(r.exterior?.default?.assetId,r.name+' / exterior');for(const [side,m] of Object.entries(r.exterior?.sides||{}))add(m?.assetId,r.name+' / exterior '+side);}
 for(const o of p.openings||[])add(o.textureId,o.name||o.id);add(p.sky?.assetId,'Sky');
 for(const o of p.objects||[]){for(const k of ['assetId','isoAssetId','viewAssetId'])add(o[k],o.name||o.id);for(const id of Object.values(o.variants||{}))add(id,o.name||o.id);}
 for(const q of p.props||[])add(q.override?.texture?.image,q.name||q.id,null,q.id);
 for(const l of p.objectLibrary?.looks||[])add(l.texture?.image,'Object look '+l.name);
 for(const id of p.legacyArchive?.assetIds||[])add(id,'Legacy archive');return refs;
}
// Compose a recipe/paste and explicit overrides without retaining an unused image introduced by the first step.
// Pre-existing images are never deleted by this cleanup.
function proposal(bundle,keys,options={},overrides={}){
 let next=plan(bundle,keys,options);if(Object.keys(overrides).length)next=plan(next,keys,{patch:overrides});
 const original=new Set((bundle.assets||[]).map(a=>a.id)),used=new Set(imageReferences(next.project).map(r=>r.id));
 next.assets=next.assets.filter(a=>original.has(a.id)||used.has(a.id));return next;
}
function summarizePlan(current,planned,keys){
 const before=surfaceIndex(current.project),after=surfaceIndex(planned.project),rows=keys.map(k=>{
  const a=fromIndex(before,k),b=fromIndex(after,k),fields=SURFACE_FIELDS.filter(f=>!equal(a.surface?.[f],b.surface?.[f]));
  const createsOverride=!!a.inherited&&!b.inherited;return {key:k,label:a.label,fields,changed:fields.length>0||createsOverride,createsOverride,before:surfacePatch(a.surface||{}),after:surfacePatch(b.surface||{})};
 });
 const ids=new Set((current.assets||[]).map(a=>a.id));return {total:rows.length,changed:rows.filter(r=>r.changed).length,unchanged:rows.filter(r=>!r.changed).length,overrides:rows.filter(r=>r.createsOverride).length,addedImages:planned.assets.filter(a=>!ids.has(a.id)).map(a=>({id:a.id,name:a.name})),rows};
}
function filterFindings(report,{severity='all',query=''}={}){const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);return report.findings.filter(f=>(severity==='all'||f.severity===severity)&&words.every(w=>(f.code+' '+f.message).toLowerCase().includes(w)));}

function clearImages(p){
 eachSurface(p,s=>{s.textureId=null;if(s.finish==='image')s.finish='paint';});
 for(const r of p.rooms||[]){if(r.exterior?.default)r.exterior.default.assetId=null;for(const m of Object.values(r.exterior?.sides||{}))if(m)m.assetId=null;}
 for(const o of p.openings||[])o.textureId=null;if(p.sky){p.sky.assetId=null;if(p.sky.mode==='image')p.sky.mode='gradient';}
 for(const q of p.props||[])if(q.override?.texture?.image)q.override.texture='default';for(const l of p.objectLibrary?.looks||[])if(l.texture?.image)delete l.texture;
 p.objects=[];p.legacyArchive=null;
}
function inspect(p,assets=[],library=null){
 const targets=surfaces(p),images=new Map(assets.map(a=>[a.id,a])),refs=imageReferences(p),findings=[];const add=(severity,code,message,target=null,propId=null)=>findings.push({severity,code,message,target,propId});
 for(const d of targets){const s=d.surface;if(!s){add('error','SURFACE_MISSING',d.label+' has no material.',d.key);continue;}if(s.finish==='image'&&!s.textureId)add('warning','IMAGE_MODE_UNASSIGNED',d.label+' is set to image mode but has no assigned image.',d.key);if(s.textureId&&s.finish!=='image')add('info','IMAGE_NOT_ACTIVE',d.label+' retains an image, but its procedural finish is active.',d.key);if(s.coordinateMode==='legacy')add('info','LEGACY_MAPPING',d.label+' preserves legacy mapping. Change it explicitly in the texture studio.',d.key);}
 const refsById=new Map();for(const r of refs){const rs=refsById.get(r.id)||[];rs.push(r);refsById.set(r.id,rs);}for(const [id,uses] of refsById)if(!images.has(id)){const r=uses.find(x=>x.target||x.propId)||uses[0];add('error','IMAGE_MISSING','Missing embedded image '+id+' used by '+r.where+(uses.length>1?' and '+(uses.length-1)+' other reference(s)':'')+'.',r.target,r.propId);}
 for(const a of assets)if(a.width>2048||a.height>2048)add('warning','LARGE_IMAGE',a.name+' is '+a.width+' × '+a.height+' px. Review memory cost; no automatic resampling.');
 const rows=[];for(const q of p.props||[]){const e=library?.entries?.get(q.asset),t=library?.templates?.get(q.asset),status=!library?.connected?'offline':!e?'missing':e.missing?'missing':t?.status||'not_loaded';const row={id:q.id,name:q.name||e?.name||q.asset,assetId:q.asset,status,boundsSaved:C.validBounds(q.bounds),solid:q.collision?.solid!==false,usePoints:(q.points||[]).length};rows.push(row);
  if(status==='offline')add('info','MODEL_LIBRARY_OFFLINE',row.name+': reconnect the model library. Saved bounds remain the placeholder/collision reference.',null,q.id);
  if(status==='missing'||status==='error')add('error','MODEL_UNAVAILABLE',row.name+': '+(t?.error||'the model file or ID is missing from the connected library')+'.',null,q.id);
  if(status==='not_loaded'||status==='loading')add('info','MODEL_UNVERIFIED',row.name+': indexed, but not yet successfully loaded.',null,q.id);
  if(!row.boundsSaved)add('warning','MODEL_BOUNDS_UNSAVED',row.name+': no saved model bounds. Fit and save before disconnecting the library.',null,q.id);
  if(t?.status==='ready'&&row.boundsSaved&&['min','max'].some(k=>q.bounds[k].some((v,i)=>Math.abs(v-t.bounds[k][i])>.02)))add('warning','MODEL_BOUNDS_CHANGED',row.name+': loaded geometry differs from saved bounds. Review collision and use points; no automatic physical resize.',null,q.id);
  if(t?.warning)add('warning','MODEL_DIMENSION_REVIEW',row.name+': '+t.warning,null,q.id);for(const w of t?.preflight?.warnings||[])add('warning','MODEL_MATERIAL_REVIEW',row.name+': '+w,null,q.id);const look=C.propAppearance(p,q);if(look.lookMissing)add('warning','LOOK_MISSING',row.name+': its reusable look is missing; overrides are retained.',null,q.id);
  if(look.texture?.library&&library?.connected&&!library.entries?.has(look.texture.library))add('error','MODEL_TEXTURE_MISSING',row.name+': its external texture reference is missing.',null,q.id);
  if(e?.unverifiedLicense)add('info','PROVENANCE_REVIEW',row.name+': provenance or commercial-use status is unverified. Private tooling does not establish game-art rights.',null,q.id);
 }
 const counts={surfaces:targets.length,textured:targets.filter(d=>d.surface?.finish==='image'&&images.has(d.surface.textureId)).length,embeddedImages:assets.length,embeddedBytes:Math.round(assets.reduce((n,a)=>n+(a.src?.split(',')[1]?.length||0)*.75,0)),placedModels:rows.length,readyModels:rows.filter(x=>x.status==='ready').length,unreferencedImages:assets.filter(a=>!refsById.has(a.id)).length};
 // Sort before the UI applies its display limit: errors can never be buried under informational notes.
 const rank={error:0,warning:1,info:2};findings.sort((a,b)=>rank[a.severity]-rank[b.severity]);
 return {version:VERSION,authority:'presentation-audit-only',verification:'Appearance and asset references only. No movement, collision, boarding, licensing or simulation certification.',counts,models:rows,errors:findings.filter(x=>x.severity==='error').length,warnings:findings.filter(x=>x.severity==='warning').length,infos:findings.filter(x=>x.severity==='info').length,findings};
}
return {VERSION,RECIPES,surfaces,resolve,signature,plan,mergePlan,proposal,summarizePlan,surfacePatch,filterFindings,ensureTexture,recipePatch,imageReferences,clearImages,inspect};
});
