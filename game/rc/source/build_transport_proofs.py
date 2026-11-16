"""Build offline infrastructure inspector and physical proof after build.py.
Also rebuild the current accepted transit wrapper from its unchanged scene.
No external dependencies or script downloads.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'Room_Creator.html').read_text()
def build(name, scene_path, mode, title):
    scene=json.loads(scene_path.read_text())
    data=json.dumps(scene,ensure_ascii=False).replace('</','<\\/')
    action="RCApp.ext().route.startEncounter();" if mode=='play' else "RCApp.ext().transportInfrastructure.open('stoppingPlaces','ti_stop_a');document.getElementById('planBtn').click();document.getElementById('fitBtn').click();"
    boot='<script type="application/json" id="rcEmbeddedScene">'+data+'</script>\n'+'''<script>(function(){
function boot(){if(!window.RCApp||!RCApp.ext().transportInfrastructure)return setTimeout(boot,60);
RCApp.applyBundle(JSON.parse(document.getElementById('rcEmbeddedScene').textContent)).then(function(){setTimeout(function(){ACTION},150);}).catch(function(e){alert('Could not open proof: '+e.message);});}
if(document.readyState==='complete')boot();else window.addEventListener('load',boot);
})();</script>'''.replace('ACTION',action)
    idx=html.rfind('</body>');out=(html[:idx]+boot+html[idx:]).replace('<title>','<title>'+title+' · ',1)
    (ROOT/name).write_text(out);print('Built',name,len(out.encode()))
build('Inspect_Transport_Infrastructure.html',ROOT/'examples/Transport_Infrastructure_Combined_Proof.room.json','inspect','Transport Infrastructure')
build('Play_Transport_Combined_Proof.html',ROOT/'examples/Transport_Infrastructure_Combined_Proof.room.json','play','Transport Combined Proof')
build('Play_Vehicle_Two_Block_Transit.html',ROOT/'Vehicle_V2_5_Two_Block_Transit_Test.room.json','play','Accepted Two-Block Transit')
