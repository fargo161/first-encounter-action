/* ROOM City Structure Foundation 0.1.0
 * Optional, declarative authoring sockets. No actors, clocks, occupancy, transactions,
 * permission decisions, inventory, navigation executor, or autonomous work.
 * Browser + Node, no dependencies. Physical references never own/copy geometry.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RCCityStructure=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const SCHEMA='rc-city-structure@0.1', VERSION='0.1.1';
const COLLECTIONS={buildings:'Building assemblies',premises:'Premises',stations:'Activity sockets',roleSlots:'Role-position sockets',links:'Organizational ties',accessPlans:'Access declarations',requirements:'Support requirements'};
const KINDS={building:'buildings',premises:'premises',station:'stations',roleSlot:'roleSlots',link:'links',accessPlan:'accessPlans',requirement:'requirements'};
const FORMS=['unspecified','frontage','corner','detached','courtyard','hall','floorplate','yard','compound','mixed'];
const FUNCTIONS=['unspecified','residential','retail','food','warehouse','industrial','workshop','office','civic','secure','health','hygiene','venue','transit','parking','public_space','communal','mixed','other'];
const STATION_CATEGORIES=['service','meeting','hygiene','repair','venue','threshold','storage','supply','disposal','waiting','seating','sleeping','food','information','receiving','other'];
const ACCESS=['unspecified','public','staff','management','service','restricted','residential','member','invited','other'];
const VEHICLE_INTENTS=['unspecified','none','shared','dedicated','transit'];
const LINK_KINDS=['management','purchasing','pricing','ownership','supply','waste','shared_service','maintenance','information','access','other'];
const REQUIREMENT_KINDS=['work_position','service','storage','supply','waste','vehicle','circulation','utility','other'];
const BINDING_PURPOSES=['provider','recipient','waiting','approach','entrance','exit','storage','receiving','service','circulation','vehicle','other'];
const PHYSICAL_KINDS=['room','floorSection','opening','partition','stairs','viewpoint','prop','usePoint','routeVertex','routeEdge','routeNode','routeZone','routePortal','vehicleEdge','vehicleConnector','vehicleBay','vehicleLane','signalController','signalGroup'];
const SPACE_KINDS=['room','floorSection','routeZone'];
const ENDPOINT_KINDS=['building','premises','station','roleSlot'];
const RUNTIME_FIELDS=new Set(['actors','actorId','actorIds','employees','assignedActorId','occupants','occupancy','schedules','schedule','currentStock','inventory','transactions','currentPrice','balance','runtime','permissionsGranted']);
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=prefix=>prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const supported=s=>isObject(s)&&s.schema===SCHEMA;
const get=p=>p.cityStructure||null;
// Optional, versioned transport extension; loaded lazily to keep the base module dependency-free.
const transport=()=>typeof module==='object'&&module.exports?require('./transport-infrastructure.js'):(typeof window!=='undefined'?window.RCTransportInfrastructure:null);
const fail=s=>{throw Error('City structure: '+s);};
const arr=(v,path)=>{if(!Array.isArray(v)||v.length>20000)fail(path+' must be an array (maximum 20,000 entries).');};
const str=(v,path,max=1000,empty=true)=>{if(typeof v!=='string'||v.length>max||(!empty&&!v.trim()))fail(path+' must be '+(empty?'text':'nonempty text')+' (maximum '+max+' characters).');};
const oneOf=(v,opts,path)=>{if(!opts.includes(v))fail(path+' has an unsupported value.');};
const num=(v,path,{integer=false,min=0}={})=>{if(!Number.isFinite(v)||v<min||v>100000000||(integer&&!Number.isInteger(v)))fail(path+' must be a finite '+(integer?'integer ':'')+'number between '+min+' and 100000000.');};
const texts=(v,path)=>{arr(v,path);v.forEach((t,i)=>str(t,path+'['+i+']',200,false));};
function noRuntime(o,path){for(const k of Object.keys(o))if(RUNTIME_FIELDS.has(k))fail(path+'.'+k+' is runtime/ENCOUNTER state, not an authoring socket.');}
function physicalRef(ref,path='reference',nullable=false){if(nullable&&ref===null)return;if(!isObject(ref))fail(path+' must be a typed physical reference.');oneOf(ref.kind,PHYSICAL_KINDS,path+'.kind');str(ref.id,path+'.id',200,false);if(['usePoint','vehicleLane','signalGroup'].includes(ref.kind))str(ref.parentId,path+'.parentId',200,false);if(ref.kind==='vehicleLane'){oneOf(ref.parentKind,['vehicleEdge','vehicleConnector'],path+'.parentKind');if(!/^lane:[0-9]+$/.test(ref.id))fail(path+'.id must be lane:index.');}if(['vehicleLane','signalGroup'].includes(ref.kind))str(ref.layoutToken,path+'.layoutToken',80,false);}
function refs(xs,path,spaceOnly=false){arr(xs,path);xs.forEach((ref,i)=>{physicalRef(ref,path+'['+i+']');if(spaceOnly)oneOf(ref.kind,SPACE_KINDS,path+'['+i+'].kind');});}
function endpoint(e,path,nullable=true){if(nullable&&e===null)return;if(!isObject(e))fail(path+' must name a typed structural endpoint.');oneOf(e.kind,ENDPOINT_KINDS,path+'.kind');str(e.id,path+'.id',100,false);}
function capacities(xs,path){arr(xs,path);xs.forEach((x,i)=>{if(!isObject(x))fail(path+'['+i+'] must be an object.');str(x.kind,path+'.kind',80,false);num(x.amount,path+'.amount');str(x.unit,path+'.unit',80,false);});}
function validateShape(s){
 if(!isObject(s))fail('the optional block must be an object.');str(s.schema,'schema',80,false);
 if(!s.schema.startsWith('rc-city-structure@'))fail('unsupported schema family.');
 // Never reinterpret a future contract; the editor retains it and presents it read-only.
 if(!supported(s))return {supported:false};
 if(s.authority!=='authoring-only')fail('authority must be authoring-only.');
 str(s.namespace,'namespace',100,false);num(s.revision,'revision',{integer:true});noRuntime(s,'root');
 const ids=new Set();
 for(const [col] of Object.entries(COLLECTIONS)){
  arr(s[col],col);
  for(const r of s[col]){
   if(!isObject(r))fail(col+' contains a non-object.');
   str(r.id,col+'.id',100,false);if(!/^[-a-zA-Z0-9_]+$/.test(r.id)||ids.has(r.id))fail('invalid or duplicate structural ID '+r.id+'.');ids.add(r.id);
   str(r.name,r.id+'.name',180,false);str(r.notes,r.id+'.notes',5000);noRuntime(r,r.id);
   switch(col){
   case 'buildings':oneOf(r.form,FORMS,r.id+'.form');refs(r.spaces,r.id+'.spaces',true);texts(r.tags,r.id+'.tags');break;
   case 'premises':oneOf(r.function,FUNCTIONS,r.id+'.function');texts(r.buildingIds,r.id+'.buildingIds');refs(r.spaces,r.id+'.spaces',true);str(r.operatorSocket,r.id+'.operatorSocket',200);oneOf(r.accessIntent,ACCESS,r.id+'.accessIntent');oneOf(r.vehicleIntent,VEHICLE_INTENTS,r.id+'.vehicleIntent');capacities(r.capacities,r.id+'.capacities');texts(r.tags,r.id+'.tags');break;
   case 'stations':if(r.premisesId!==null)str(r.premisesId,r.id+'.premisesId',100,false);oneOf(r.category,STATION_CATEGORIES,r.id+'.category');str(r.purpose,r.id+'.purpose',200);physicalRef(r.anchor,r.id+'.anchor',true);num(r.capacity,r.id+'.capacity',{integer:true,min:1});arr(r.bindings,r.id+'.bindings');for(const b of r.bindings){if(!isObject(b))fail('invalid station binding.');oneOf(b.purpose,BINDING_PURPOSES,r.id+'.binding purpose');physicalRef(b.ref,r.id+'.binding');}break;
   case 'roleSlots':if(r.premisesId!==null)str(r.premisesId,r.id+'.premisesId',100,false);str(r.roleTag,r.id+'.roleTag',100,false);num(r.slotCount,r.id+'.slotCount',{integer:true,min:1});texts(r.stationIds,r.id+'.stationIds');refs(r.dutyRefs,r.id+'.dutyRefs');texts(r.requirementTags,r.id+'.requirementTags');break;
   case 'links':oneOf(r.kind,LINK_KINDS,r.id+'.kind');endpoint(r.from,r.id+'.from');endpoint(r.to,r.id+'.to');refs(r.via,r.id+'.via');break;
   case 'accessPlans':physicalRef(r.target,r.id+'.target',true);oneOf(r.category,ACCESS,r.id+'.category');texts(r.roleTags,r.id+'.roleTags');break;
   case 'requirements':oneOf(r.kind,REQUIREMENT_KINDS,r.id+'.kind');endpoint(r.consumer,r.id+'.consumer');endpoint(r.provider,r.id+'.provider');refs(r.via,r.id+'.via');if(typeof r.required!=='boolean')fail(r.id+'.required must be boolean.');break;
   }
  }
 }
 if(s.transportInfrastructure!==undefined){const ti=transport();if(!ti)fail('transport infrastructure support is missing from this editor build.');ti.validateShape(s.transportInfrastructure);}
 return {supported:true};
}
function empty(namespace=uid('city')){return {schema:SCHEMA,authority:'authoring-only',namespace,revision:0,...Object.fromEntries(Object.keys(COLLECTIONS).map(k=>[k,[]]))};}
function initialize(p){if(p.cityStructure){validateShape(p.cityStructure);if(!supported(p.cityStructure))fail('this version cannot edit the future schema '+p.cityStructure.schema+'.');}else p.cityStructure=empty();return p.cityStructure;}
function draft(col,overrides={}){
 if(!COLLECTIONS[col])fail('unknown collection '+col+'.');
 const core={id:uid('cs'),name:'New '+({buildings:'building',premises:'premises',stations:'activity socket',roleSlots:'role-position socket',links:'organizational tie',accessPlans:'access declaration',requirements:'support requirement'}[col]),notes:''};
 const defs={
  buildings:{form:'unspecified',spaces:[],tags:[]},
  premises:{function:'unspecified',buildingIds:[],spaces:[],operatorSocket:'',accessIntent:'unspecified',vehicleIntent:'unspecified',capacities:[],tags:[]},
  stations:{premisesId:null,category:'service',purpose:'',anchor:null,capacity:1,bindings:[]},
  roleSlots:{premisesId:null,roleTag:'worker',slotCount:1,stationIds:[],dutyRefs:[],requirementTags:[]},
  links:{kind:'management',from:null,to:null,via:[]},
  accessPlans:{target:null,category:'unspecified',roleTags:[]},
  requirements:{kind:'service',consumer:null,provider:null,via:[],required:true}
 };
 return {...core,...defs[col],...clone(overrides)};
}
function put(p,col,record){
 if(!COLLECTIONS[col])fail('unknown collection.');const s=clone(p.cityStructure||empty());validateShape(s);if(!supported(s))fail('future schema is read-only.');
 const i=s[col].findIndex(x=>x.id===record.id);const r=i<0?draft(col,record):{...s[col][i],...clone(record)};
 if(i<0)s[col].push(r);else s[col][i]=r;s.revision++;validateShape(s);p.cityStructure=s;return r;
}
function structuralRefs(col,r){
 switch(col){
 case 'premises':return r.buildingIds.map(id=>({kind:'building',id}));
 case 'stations':return r.premisesId?[{kind:'premises',id:r.premisesId}]:[];
 case 'roleSlots':return [...(r.premisesId?[{kind:'premises',id:r.premisesId}]:[]),...r.stationIds.map(id=>({kind:'station',id}))];
 case 'links':return [r.from,r.to].filter(Boolean);
 case 'requirements':return [r.consumer,r.provider].filter(Boolean);
 default:return [];
 }
}
function physicalRefs(col,r){
 switch(col){case 'buildings':case 'premises':return r.spaces;case 'stations':return [...(r.anchor?[r.anchor]:[]),...r.bindings.map(b=>b.ref)];case 'roleSlots':return r.dutyRefs;case 'links':case 'requirements':return r.via;case 'accessPlans':return r.target?[r.target]:[];default:return [];}
}
function dependencies(p,id){const s=get(p);if(!supported(s))return [];return Object.keys(COLLECTIONS).flatMap(col=>s[col].filter(r=>r.id!==id&&structuralRefs(col,r).some(e=>e.id===id)).map(r=>({collection:col,id:r.id,name:r.name}))).concat(get(p)?.transportInfrastructure?(transport()?.cityDependencies(p,id)||[]):[]);}
function remove(p,col,id){const s=clone(get(p));validateShape(s);if(!supported(s))fail('future schema is read-only.');if(!COLLECTIONS[col])fail('unknown collection.');const dependents=dependencies(p,id);if(dependents.length)fail('record is referenced by '+dependents.map(d=>d.name).join(', ')+'. Rebind or remove those declarations first.');if(!s[col].some(r=>r.id===id))fail('record no longer exists.');s[col]=s[col].filter(r=>r.id!==id);s.revision++;p.cityStructure=s;}
function refKey(r){return ['vehicleLane','signalGroup'].includes(r.kind)?JSON.stringify([r.kind,r.parentKind||'',r.parentId||'',r.id,r.layoutToken||'']):JSON.stringify([r.kind,r.parentId||'',r.id]);}
function endpointKey(e){return e?e.kind+':'+e.id:'';}
function physicalCatalog(p){
 const out=[],push=(kind,list)=>{for(const r of list||[])if(r&&typeof r.id==='string')out.push({ref:{kind,id:r.id},name:r.name||r.label||r.id,record:r});};
 for(const [kind,key] of Object.entries({room:'rooms',floorSection:'floorSections',opening:'openings',partition:'partitions',stairs:'stairs',viewpoint:'viewpoints',prop:'props'}))push(kind,p[key]);
 for(const prop of p.props||[])for(const pt of prop.points||[])if(pt?.id)out.push({ref:{kind:'usePoint',parentId:prop.id,id:pt.id},name:(prop.name||prop.id)+' / '+(pt.name||pt.type||pt.id)+(pt.enabled===false?' (disabled)':''),record:pt,parent:prop});
 const n=p.routeNet||{};
 for(const [kind,key] of Object.entries({routeVertex:'vertices',routeEdge:'edges',routeNode:'nodes',routeZone:'zones',routePortal:'portals'}))push(kind,n[key]);
 push('vehicleEdge',n.vehicleGraph?.edges);push('vehicleConnector',n.vehicleGraph?.connectors);push('vehicleBay',n.parking?.spaces);
 const ti=transport();if(ti)out.push(...ti.preciseCatalog(p));
 return out;
}
function resolvePhysical(p,ref,catalog=physicalCatalog(p)){if(!ref)return null;const matches=catalog.filter(x=>refKey(x.ref)===refKey(ref));return matches.length===1?matches[0]:null;}
function resolveEndpoint(p,e){if(!e||!ENDPOINT_KINDS.includes(e.kind)||!supported(get(p)))return null;return get(p)[KINDS[e.kind]].find(r=>r.id===e.id)||null;}
function referencePoint(p,ref,C){
 if(['vehicleLane','signalController','signalGroup'].includes(ref?.kind))return transport()?.referencePoint(p,ref)||null;
 const item=resolvePhysical(p,ref);if(!item)return null;const r=item.record,kind=ref.kind;let q=null,story=r.story??p.rooms?.find(x=>x.id===r.roomId)?.story??0;
 if(['room','floorSection','routeZone'].includes(kind)&&Number.isFinite(r.width)&&Number.isFinite(r.length))q={x:r.x+r.width/2,y:r.y+r.length/2,story};
 else if(kind==='opening'&&C){const l=C.openingLine(p,r);q={...C.wallPoint(l,(l.start+l.end)/2),story};}
 else if(kind==='usePoint'&&C){const prop=item.parent,setup=p.objectLibrary?.setups?.[prop.asset]||{};const w=C.propToPlan(prop,r,setup,C.propFloorZ(p,prop));q={x:w.x,y:w.y,z:w.z,story:prop.story||0};}
 else if(kind==='vehicleBay'&&r.vehicleBox){const b=r.vehicleBox;q={x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2,story};}
 else if(kind==='routeEdge'){const a=p.routeNet?.vertices?.find(v=>v.id===r.a),b=p.routeNet?.vertices?.find(v=>v.id===r.b);if(a&&b)q={x:(a.x+b.x)/2,y:(a.y+b.y)/2,story:a.story||0};}
 else if(['vehicleEdge','vehicleConnector'].includes(kind)){const pts=r.centerPath||r.path||r.points;if(pts?.length){const m=pts[Math.floor(pts.length/2)];q={x:m.x,y:m.y,story:m.story||story};}}
 else if(Number.isFinite(r.x)&&Number.isFinite(r.y))q={x:r.x,y:r.y,story};
 return q&&Number.isFinite(q.x)&&Number.isFinite(q.y)?q:null;
}
function recordPoint(p,col,r,C,seen=new Set()){
 if(!r||seen.has(r.id))return null;seen.add(r.id);
 for(const ref of physicalRefs(col,r)){const q=referencePoint(p,ref,C);if(q)return q;}
 const s=get(p);if(!supported(s))return null;
 if(col==='premises')for(const id of r.buildingIds){const q=recordPoint(p,'buildings',s.buildings.find(x=>x.id===id),C,seen);if(q)return q;}
 if(['stations','roleSlots'].includes(col)&&r.premisesId)return recordPoint(p,'premises',s.premises.find(x=>x.id===r.premisesId),C,seen);
 if(col==='links'&&r.from)return recordPoint(p,KINDS[r.from.kind],resolveEndpoint(p,r.from),C,seen);
 if(col==='requirements'&&r.consumer)return recordPoint(p,KINDS[r.consumer.kind],resolveEndpoint(p,r.consumer),C,seen);
 return null;
}
function inspect(p){
 const s=get(p),diagnostics=[];const emit=(severity,code,message,collection=null,id=null)=>diagnostics.push({severity,code,message,collection,id});
 if(!s)return {status:'not_enabled',errors:0,warnings:0,diagnostics,verification:'No city structure declarations; existing project is unchanged.'};
 try{validateShape(s);}catch(e){emit('error','INVALID_SHAPE',e.message);return finish('invalid');}
 if(!supported(s)){emit('warning','FUTURE_SCHEMA','This version preserves '+s.schema+' without interpreting or editing it.');return finish('read_only');}
 const catalog=physicalCatalog(p),index=new Map();for(const item of catalog){const k=refKey(item.ref);if(!index.has(k))index.set(k,[]);index.get(k).push(item);}
 const tables=Object.fromEntries(Object.keys(COLLECTIONS).map(col=>[col,new Map(s[col].map(r=>[r.id,r]))]));
 const checkEP=(e,col,r,label)=>{if(!e){emit('warning','UNBOUND_ENDPOINT',r.name+': '+label+' is unbound.',col,r.id);return;}if(!tables[KINDS[e.kind]]?.has(e.id))emit('error','MISSING_ENDPOINT',r.name+': '+label+' references missing '+e.kind+' '+e.id+'.',col,r.id);};
 for(const col of Object.keys(COLLECTIONS))for(const r of s[col]){
  for(const ref of physicalRefs(col,r)){
   const hits=index.get(refKey(ref))||[];
   if(!hits.length){const issue=['vehicleLane','signalGroup'].includes(ref.kind)?transport()?.refIssue(p,ref,catalog):null;emit('error',issue?.code||'MISSING_PHYSICAL_REFERENCE',r.name+': '+(issue?.message||'missing '+ref.kind+' '+ref.id+'. Rebind it; no substitute is selected automatically.'),col,r.id);}
   else if(hits.length>1)emit('error','AMBIGUOUS_PHYSICAL_REFERENCE',r.name+': '+ref.kind+' '+ref.id+' is ambiguous.',col,r.id);
   else if(hits[0].record.enabled===false)emit('warning','DISABLED_PHYSICAL_REFERENCE',r.name+': '+ref.kind+' '+ref.id+' is disabled.',col,r.id);
  }
  for(const e of structuralRefs(col,r))checkEP(e,col,r,'binding');
  if(col==='buildings'){
   if(!r.spaces.length)emit('warning','BUILDING_WITHOUT_SPACES',r.name+': no physical space is bound.',col,r.id);
  }else if(col==='premises'){
   if(!r.buildingIds.length&&!r.spaces.length)emit('warning','PREMISES_WITHOUT_PLACE',r.name+': bind a building or an existing physical space.',col,r.id);
   if(r.accessIntent==='unspecified')emit('warning','ACCESS_UNDECLARED',r.name+': intended access category is unspecified.',col,r.id);
   if(r.vehicleIntent==='unspecified')emit('warning','VEHICLE_RELATION_UNDECLARED',r.name+': vehicle relationship is unspecified (none is a valid choice).',col,r.id);
   if(r.buildingIds.length&&r.spaces.length){const spaces=new Set(r.buildingIds.flatMap(id=>tables.buildings.get(id)?.spaces||[]).map(refKey));for(const ref of r.spaces)if(!spaces.has(refKey(ref)))emit('warning','SPACE_OUTSIDE_ASSEMBLY',r.name+': '+ref.id+' is not listed in its building assemblies; check shared or external space intent.',col,r.id);}
  }else if(col==='stations'){
   if(!r.premisesId)emit('warning','STATION_WITHOUT_PREMISES',r.name+': premises binding is unassigned.',col,r.id);
   if(!r.anchor)emit('warning','STATION_WITHOUT_ANCHOR',r.name+': select an existing physical node, use point, doorway or bay.',col,r.id);
   else if(SPACE_KINDS.includes(r.anchor.kind)||r.anchor.kind==='prop')emit('warning','COARSE_STATION_ANCHOR',r.name+': a whole space/prop is a coarse anchor, not an authored standing/use position.',col,r.id);
   if(r.category==='service'){for(const purpose of ['provider','recipient'])if(!r.bindings.some(b=>b.purpose===purpose))emit('warning','SERVICE_POSITION_MISSING',r.name+': '+purpose+' position is not bound.',col,r.id);}
   const exact=new Set();for(const b of r.bindings){const k=b.purpose+'|'+refKey(b.ref);if(exact.has(k))emit('warning','DUPLICATE_STATION_BINDING',r.name+': duplicate '+b.purpose+' binding.',col,r.id);exact.add(k);}
   for(const a of r.bindings.filter(b=>b.purpose==='provider'))if(r.bindings.some(b=>b.purpose==='recipient'&&refKey(a.ref)===refKey(b.ref)))emit('warning','OVERLAPPING_SERVICE_POSITIONS',r.name+': provider and recipient reference the same physical point.',col,r.id);
  }else if(col==='roleSlots'){
   if(!r.premisesId)emit('warning','ROLE_WITHOUT_PREMISES',r.name+': premises binding is unassigned.',col,r.id);
   if(!r.stationIds.length&&!r.dutyRefs.length)emit('warning','ROLE_WITHOUT_DUTY_PLACE',r.name+': bind activity sockets or duty locations. A desk is not required for a roaming role.',col,r.id);
   for(const id of r.stationIds){const st=tables.stations.get(id);if(st&&st.premisesId&&r.premisesId&&st.premisesId!==r.premisesId)emit('warning','CROSS_PREMISES_DUTY',r.name+': '+st.name+' belongs to another premises; review the intended shared duty.',col,r.id);}
  }else if(col==='links'){
   if(!r.from)checkEP(null,col,r,'source');if(!r.to)checkEP(null,col,r,'target');
   if(r.from&&r.to&&endpointKey(r.from)===endpointKey(r.to))emit('warning','SELF_LINK',r.name+': source and target are identical.',col,r.id);
   if(['supply','waste','maintenance','access'].includes(r.kind)&&!r.via.length)emit('warning','LOGISTICS_INTERFACE_UNBOUND',r.name+': no physical interface is declared. This tie does not create a route.',col,r.id);
  }else if(col==='accessPlans'){
   if(!r.target)emit('warning','ACCESS_WITHOUT_TARGET',r.name+': select an existing physical boundary or area.',col,r.id);
   if(r.category==='unspecified')emit('warning','ACCESS_UNDECLARED',r.name+': intended access category is unspecified.',col,r.id);
  }else if(col==='requirements'){
   if(!r.consumer)checkEP(null,col,r,'consumer');
   if(!r.provider)emit(r.required?'warning':'info','UNRESOLVED_REQUIREMENT',r.name+': '+(r.required?'required':'optional')+' support provider is not bound.',col,r.id);
   if(['vehicle','circulation'].includes(r.kind)&&!r.via.length)emit('warning','REQUIREMENT_INTERFACE_UNBOUND',r.name+': physical interface is not bound.',col,r.id);
  }
 }
 // Shared spaces are explicit references to one ROOM object, never copies.
 for(const kind of ['buildings','premises']){
  const users=new Map();for(const r of s[kind])for(const ref of r.spaces){const k=refKey(ref);if(!users.has(k))users.set(k,new Set());users.get(k).add(r.id);}
  for(const [key,ids] of users)if(ids.size>1)emit('info','SHARED_SPACE',`${ids.size} ${kind} reference one physical space ${JSON.parse(key)[2]}. No independent copy or capacity is created.`);
 }
 if(s.transportInfrastructure){const ti=transport();if(ti)diagnostics.push(...ti.inspect(p).diagnostics);}
 return finish(Object.keys(COLLECTIONS).every(k=>!s[k].length)&&!s.transportInfrastructure?'empty':undefined);
 function finish(forced){const errors=diagnostics.filter(d=>d.severity==='error').length,warnings=diagnostics.filter(d=>d.severity==='warning').length;return {status:forced||(errors?'invalid_bindings':warnings?'draft':'references_resolve'),errors,warnings,diagnostics,verification:'Structural references only. Not a proof of physical traversability, clearances, staffing, permissions, supply or runtime operation.'};}
}
function stableStringify(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(stableStringify).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableStringify(v[k])).join(',')+'}';}
function fingerprint(v){const s=stableStringify(v);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return 'fnv1a32:'+((h>>>0).toString(16).padStart(8,'0'));}
function contract(p){
 const s=get(p);if(!s)fail('enable the framework before exporting.');validateShape(s);if(!supported(s))fail('cannot compile a future schema.');
 const geometry=Object.fromEntries(['rooms','floorSections','floorCuts','ceilingCuts','ceilingPatches','pillars','partitions','openings','stairs','props','objects','viewpoints','rails','routeNet','objectLibrary','stories','storyHeight','wallHeight','units'].map(k=>[k,p[k]??null]));
 return {schema:'rc-city-structure-contract@0.1',authority:'authoring-only',source:{name:p.name,projectFormat:p.version,namespace:s.namespace,structureRevision:s.revision,structureFingerprint:fingerprint(s),physicalFingerprint:fingerprint(geometry),fingerprintPurpose:'Change detection only; not cryptographic integrity.'},structure:clone(s),diagnostics:inspect(p),notImplemented:['actor binding','employment/hiring','occupancy','schedules','access decisions','inventory/transactions','pricing decisions','service execution','routing proof','building geometry move/clone/regenerate']};
}
return {SCHEMA,VERSION,COLLECTIONS,KINDS,FORMS,FUNCTIONS,STATION_CATEGORIES,ACCESS,VEHICLE_INTENTS,LINK_KINDS,REQUIREMENT_KINDS,BINDING_PURPOSES,PHYSICAL_KINDS,SPACE_KINDS,ENDPOINT_KINDS,validatePhysicalRef:physicalRef,get,supported,empty,initialize,validateShape,draft,put,remove,dependencies,structuralRefs,physicalRefs,refKey,endpointKey,physicalCatalog,resolvePhysical,resolveEndpoint,referencePoint,recordPoint,inspect,fingerprint,contract};
});
