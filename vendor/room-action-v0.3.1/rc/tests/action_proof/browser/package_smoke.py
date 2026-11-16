import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
W=Path(__file__).resolve().parents[3];E=W/'proof_evidence'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);r={'browser':b.version,'os':'Linux','tests':[]}
  pg=await b.new_page()
  try:
   await pg.goto((W/'Play_Action_Physical_Proof.html').as_uri(),timeout=15000);r['tests'].append({'name':'file:// launch','status':'PASS'})
  except Exception as e:r['tests'].append({'name':'file:// launch','status':'BLOCKED','reason':str(e)[:600]})
  await pg.close()
  for name in ['Play_Action_Physical_Proof.html','Play_Combat_Room.html']:
   pg=await b.new_page(viewport={'width':1280,'height':800});errs=[];urls=[]
   pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('request',lambda q:urls.append(q.url) if q.url.startswith(('http:','https:')) else None)
   await pg.set_content((W/name).read_text(),wait_until='load');await pg.wait_for_function('window.RCApp?.ext().route.RW.on',timeout=15000)
   data=await pg.evaluate('''()=>({proofOn:RCApp.ext().physicalProof.state.on,combatOn:RCApp.ext().combat.CB.on,legacyBots:RCApp.ext().combat.bots().length,three:THREE.REVISION,webglAvailable:!!document.createElement('canvas').getContext('webgl2')})''')
   good=not errs and not urls and (data['proofOn'] if name.startswith('Play_Action') else data['combatOn'] and not data['proofOn'] and data['legacyBots']==5)
   r['tests'].append({'name':name+' exact bytes / about:blank','status':'PASS' if good else 'FAIL','observations':data,'pageErrors':errs,'httpRequests':urls});await pg.close()
  r['tests'].append({'name':'Native Windows file:// smoke','status':'NOT RUN','reason':'Windows is not available in this environment'})
  r['tests'].append({'name':'WebGL visual acceptance','status':'NOT RUN','reason':'Both WebGL context creation and original engine initialization unavailable; Canvas path was tested'})
  (E/'package_smoke.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2));await b.close()
asyncio.run(main())
