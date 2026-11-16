"""0.15: build Play_Street_Scene.html — the editor with the character street scene inside, opening straight into
the route walk. Python standard library only. Run after build.py:  python3 source/build.py && python3 source/build_play.py"""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent;PKG=HERE.parent
html=(PKG/'Room_Creator.html').read_text(encoding='utf-8')
scene=(PKG/'examples'/'Street_Characters_Scene.room.json').read_text(encoding='utf-8')
json.loads(scene)  # must be valid JSON
scene=scene.replace('</','<\\/')
boot='''<script type="application/json" id="rcEmbeddedScene">'''+scene+'''</script>
<script>
/* Play file: open the embedded street scene and start the route walk. Leaving the walk (Esc) shows the editor;
   the header button "Route walk" starts it again. Nothing is saved unless you choose Save. */
(function(){
  function say(t){var d=document.getElementById('rcPlayNote');if(!d){d=document.createElement('div');d.id='rcPlayNote';d.style.cssText='position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:99999;background:#0c1823ee;color:#e8f4ee;font:15px Segoe UI,Arial,sans-serif;padding:16px 22px;border-radius:10px;border:1px solid #2c4252;text-align:center;max-width:520px';document.body.appendChild(d);}d.innerHTML=t;return d;}
  function boot(){
    if(!window.RCApp||!window.RCApp.ext||!window.RCApp.ext().route){return setTimeout(boot,60);}
    var note=say('Loading the street scene…');
    var bundle;try{bundle=JSON.parse(document.getElementById('rcEmbeddedScene').textContent);}catch(e){say('This play file is damaged: '+e.message);return;}
    window.RCApp.applyBundle(bundle).then(function(){
      setTimeout(function(){var ok=window.RCApp.ext().route.start();note.remove();if(!ok)say('The scene opened, but the route walk could not start. Click "Route walk" at the top.');},250);
    }).catch(function(e){say('Could not open the scene: '+e.message);});
  }
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot);
})();
</script>
'''
i=html.rfind('</body>')
if i<0:raise SystemExit('No </body> in Room_Creator.html')
out=html[:i]+boot+html[i:]
out=out.replace('<title>','<title>Street scene · ',1)
dst=PKG/'Play_Street_Scene.html';dst.write_text(out,encoding='utf-8')
print(f'Built {dst.name}: {dst.stat().st_size:,} bytes')
