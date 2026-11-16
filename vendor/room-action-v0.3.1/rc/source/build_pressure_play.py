"""Build the actual Room Creator host with the opt-in physical proof embedded. No external requests."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
html=(ROOT/'Room_Creator.html').read_text()
scene=(ROOT/'examples/Action_Physical_Proof_v0_3.room.json').read_text();json.loads(scene)
boot='''<script type="application/json" id="actionPhysicalScene">'''+scene.replace('</','<\\/')+'''</script><script>
(function(){function boot(){if(!window.RCApp?.ext().physicalProof){setTimeout(boot,50);return;}
 RCApp.applyBundle(JSON.parse(document.getElementById('actionPhysicalScene').textContent)).then(function(){
  setTimeout(function(){const ok=RCApp.ext().route.startEncounter();if(!ok)throw Error('Physical proof failed to start');document.title='Action Playground — Physical Integrity v0.3.1';},100);
 }).catch(function(e){const d=document.createElement('pre');d.style.cssText='position:fixed;inset:10%;z-index:999999;background:#101e24;color:#f0bd8e;padding:30px';d.textContent='Unable to open the physical proof: '+e.message;document.body.appendChild(d);console.error(e);});}
 if(document.readyState==='complete')boot();else addEventListener('load',boot);})();
</script>'''
i=html.rfind('</body>');assert i>=0
out=html[:i]+boot+html[i:];dst=ROOT/'Play_Action_Playground_v0_3_1.html';dst.write_text(out);print('Built',dst.name,dst.stat().st_size,'bytes')
