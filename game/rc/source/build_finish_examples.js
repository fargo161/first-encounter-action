/* Visual examples use existing surfaces, props, looks and physical sockets. */
const fs=require('fs'),path=require('path'),C=require('./core.js'),F=require('./finish-tools.js');
const root=path.join(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),write=(p,x)=>fs.writeFileSync(path.join(root,p),JSON.stringify(x,null,2)+'\n');
const original=read('examples/Transport_Infrastructure_Combined_Proof.room.json');let b=C.validateBundle(C.clone(original));const physicalBefore=C.clone(b.project);
b=F.plan(b,F.surfaces(b.project).filter(x=>x.group==='floor').map(x=>x.key),{recipe:'asphalt'});
b.project.name='Transport · textured foundation proof';b.savedWith='Room Creator 0.16.1 · Polish & Asset Readiness 0.1';
// No new props or floor geometry: the original vehicle/pedestrian fixture stays identical.
const strip=p=>{p=C.clone(p);delete p.name;for(const s of F.surfaces(p))if(!s.inherited)for(const k of Object.keys(s.surface))delete s.surface[k];return p;};
if(JSON.stringify(strip(b.project))!==JSON.stringify(strip(physicalBefore)))throw Error('Unexpected physical changes in visual proof.');
write('examples/Transport_Infrastructure_Textured_Proof.room.json',b);
let p=C.partitionExample();p.name='Finish Studio · materials, models & physical bindings';p.rooms[0].name='Public waiting & workroom';p.rooms[1].name='Support room';p.units='m';p.viewpoints[0].name='Materials and asset intake';
const mf=read('assets/Room_Calibration_Library/ASSET_MANIFEST.json'),entries=Object.fromEntries(mf.assets.map(e=>[e.source_path,e]));
function prop(file,name,x,y,angle=0,points=[]){const e=entries[file];return C.normalizeProp(p,{id:'finish_'+file.replace('.glb',''),name,asset:e.asset_id,x,y,z:0,rotation:angle,scale:1,story:0,roomId:p.rooms[0].id,bounds:e.normalization.bounds_after,collision:{solid:true,shape:'auto'},points});}
p.props=[prop('calibration_bench.glb','Waiting bench · structural seat positions',2,5.8,0,[{id:'seat_l',name:'Seat left',x:-.5,y:.52,z:0,type:'sit',yaw:0},{id:'seat_r',name:'Seat right',x:.5,y:.52,z:0,type:'sit',yaw:0}]),prop('calibration_meter.glb','Meter reference · measured, not auto-fit',8,5.7),prop('calibration_stop_marker.glb','Information marker · no transit service',1.2,2.3,0,[{id:'read',name:'Read position',x:0,y:0,z:.9,type:'look',yaw:180}])];
// Stable example IDs make rebuilding this demonstration repeatable; never applied to user scenes.
const ids=new Map();for(const col of ['rooms','partitions','openings','viewpoints','links','pairs','lights'])for(const [i,q]of (p[col]||[]).entries())if(q.id)ids.set(q.id,'finish_demo_'+col+'_'+(i+1));
const remap=x=>typeof x==='string'?(ids.get(x)||x):Array.isArray(x)?x.map(remap):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,remap(v)])):x;p=remap(p);
b=C.validateBundle({project:p,assets:[]});
b=F.plan(b,F.surfaces(b.project).filter(s=>s.group==='wall').map(s=>s.key),{recipe:'plaster'});
b=F.plan(b,F.surfaces(b.project).filter(s=>s.kind==='room'&&s.slot==='floor'&&s.id===p.rooms[0].id).map(s=>s.key),{recipe:'paving'});
b=F.plan(b,F.surfaces(b.project).filter(s=>s.kind==='room'&&s.slot==='floor'&&s.id===p.rooms[1].id).map(s=>s.key),{recipe:'tile'});
b=F.plan(b,F.surfaces(b.project).filter(s=>s.kind==='partition'&&s.slot==='faces.A').map(s=>s.key),{recipe:'brick'});
b=F.plan(b,F.surfaces(b.project).filter(s=>s.group==='ceiling').map(s=>s.key),{recipe:'plaster'});
b.project.notes='Presentation calibration example. Connect assets/Room_Calibration_Library to load the three original fixtures. Offline placeholders retain saved physical bounds. This scene is not the combined transit proof. Bench use points are authored structure only.';
b.savedWith='Room Creator 0.16.1 · Polish & Asset Readiness 0.1';write('examples/Finish_Asset_Studio.room.json',b);
console.log('Built visual-only transit copy and Finish Studio.');
