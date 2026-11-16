"""Two self-contained entry points; all use the same compiled editor.
Only the calibration demo temporarily connects a tiny embedded File-provider library.
Normal project saves remain external-model references, not embedded GLBs.
"""
from pathlib import Path
import base64,json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'Room_Creator.html').read_text()
def build(name,scene,action,title,library=False):
 data=json.dumps(json.loads((ROOT/scene).read_text()),ensure_ascii=False).replace('</','<\\/')
 boot='<script type="application/json" id="rcEmbeddedScene">'+data+'</script>\n'
 libcode=''
 if library:
  pack=ROOT/'assets/Room_Calibration_Library';files=[{'name':p.relative_to(pack).as_posix(),'data':base64.b64encode(p.read_bytes()).decode()} for p in sorted(pack.rglob('*')) if p.is_file()]
  boot+='<script type="application/json" id="rcCalibrationFiles">'+json.dumps(files)+'</script>\n'
  libcode="const files=JSON.parse(document.getElementById('rcCalibrationFiles').textContent).map(x=>{const f=new File([Uint8Array.from(atob(x.data),c=>c.charCodeAt(0))],x.name.split('/').pop());Object.defineProperty(f,'webkitRelativePath',{value:'Room_Calibration_Library/'+x.name});return f;});await RCAssets.connectFiles(files);const ts=RCAssets.state.models.map(e=>RCAssets.template(e.id));await Promise.all(ts.map(t=>t.ready));"
 boot+='''<script>(function(){async function boot(){if(!window.RCApp?.ext().finish)return setTimeout(boot,60);try{await RCApp.applyBundle(JSON.parse(document.getElementById('rcEmbeddedScene').textContent));LIBCODE setTimeout(()=>{ACTION},150);}catch(e){alert('Could not open example: '+e.message);}}if(document.readyState==='complete')boot();else window.addEventListener('load',boot);})();</script>'''.replace('LIBCODE',libcode).replace('ACTION',action)
 idx=html.rfind('</body>');out=(html[:idx]+boot+html[idx:]).replace('<title>','<title>'+title+' · ',1);(ROOT/name).write_text(out);print('Built',name,len(out.encode()))
build('Inspect_Finish_Asset_Studio.html','examples/Finish_Asset_Studio.room.json',"RCApp.ext().finish.open();const k=RCApp.ext().finish.targets()[0]?.key;RCApp.ext().finish.state.current=k;RCApp.refresh();document.getElementById('fitBtn').click();",'Finish & Asset Studio',True)
build('Play_Transport_Textured_Proof.html','examples/Transport_Infrastructure_Textured_Proof.room.json',"RCApp.ext().route.startEncounter();",'Textured Transport Proof')
