"""Combat Room v0.1: build Play_Combat_Room.html — the editor with the combat test room inside, opening straight into
the fight (Encounter preview + combat). Python standard library only. Run after build.py:
    python3 source/build.py && python3 source/build_combat_play.py"""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent;PKG=HERE.parent
html=(PKG/'Room_Creator.html').read_text(encoding='utf-8')
scene=(PKG/'examples'/'Combat_Test_Room.room.json').read_text(encoding='utf-8')
json.loads(scene)  # must be valid JSON
scene=scene.replace('</','<\\/')
boot='''<script type="application/json" id="rcEmbeddedScene">'''+scene+'''</script>
<script>
/* Play file: open the embedded combat room and start the fight. Esc leaves the fight and shows the editor; the header
   button "Encounter preview" starts it again. Nothing is saved unless you choose Save. */
(function(){
  function say(t){var d=document.getElementById('rcPlayNote');if(!d){d=document.createElement('div');d.id='rcPlayNote';d.style.cssText='position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:99999;background:#0c0710ee;color:#f6edf3;font:15px Consolas,monospace;padding:16px 22px;border-radius:10px;border:1px solid #ff3fa4;text-align:center;max-width:560px;line-height:1.5';document.body.appendChild(d);}d.innerHTML=t;return d;}
  function boot(){
    if(!window.RCApp||!window.RCApp.ext||!window.RCApp.ext().route){return setTimeout(boot,60);}
    var note=say('Loading the combat room…');
    var bundle;try{bundle=JSON.parse(document.getElementById('rcEmbeddedScene').textContent);}catch(e){say('This play file is damaged: '+e.message);return;}
    window.RCApp.applyBundle(bundle).then(function(){
      setTimeout(function(){var ok=window.RCApp.ext().route.startEncounter();note.remove();
        if(!ok)say('The room opened, but the fight could not start. Click "Encounter preview" at the top.');
        else say('<b style="color:#ff3fa4">TRAPSTAR · COMBAT TEST ROOM</b><br>Click the picture once to capture the mouse.<br>Mouse = look · W = go where you look · A/D = sidestep into cover · S = back up<br>Click / Space = fire · X = reload · C = crouch · E = open a door · Tab = debug · Esc = leave<br><small>Get to the EXIT. Apt. 305 (the door on your left) is an optional ambush.</small>').onclick=function(){this.remove();};
        setTimeout(function(){var d=document.getElementById('rcPlayNote');if(d)d.remove();},9000);},250);
    }).catch(function(e){say('Could not open the room: '+e.message);});
  }
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot);
})();
</script>
'''
i=html.rfind('</body>')
if i<0:raise SystemExit('No </body> in Room_Creator.html')
out=html[:i]+boot+html[i:]
out=out.replace('<title>','<title>Combat Test Room · ',1)
dst=PKG/'Play_Combat_Room.html';dst.write_text(out,encoding='utf-8')
print(f'Built {dst.name}: {dst.stat().st_size:,} bytes')
