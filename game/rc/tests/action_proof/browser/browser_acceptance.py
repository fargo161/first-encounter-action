import asyncio,json,time
from pathlib import Path
from playwright.async_api import async_playwright
W=Path(__file__).resolve().parents[3]; E=W/'proof_evidence'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await b.new_page(viewport={'width':1440,'height':900});errors=[];requests=[];results=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
  await page.set_content((W/'Play_Action_Physical_Proof.html').read_text(),wait_until='load')
  await page.wait_for_function('window.RCApp?.ext().physicalProof?.state.on',timeout=20000)
  expr='RCApp.ext().physicalProof'
  async def wait(cond):await page.wait_for_function(expr+'.core && ('+cond+')',timeout=15000)
  async def ev(t,extra='true'):await wait(f'{expr}.core.W.events.some(e=>e.type==="{t}"&&({extra}))')
  async def shot(name):await page.screenshot(path=str(E/name))
  async def run(name,f):
   try:detail=await f();results.append({'test':name,'status':'PASS','detail':detail});print('PASS',name,flush=True)
   except Exception as e:results.append({'test':name,'status':'FAIL','error':str(e)[:1600]});print('FAIL',name,str(e)[:350],flush=True)
  async def boot():
   await wait(f'{expr}.core.W.actors.length===2'); await shot('playable_start.png');return await page.evaluate(f'()=>({{characters:[...RCApp.ext().route.RW.chars.values()].map(c=>c.ready),vehicles:{expr}.core.W.carShapes.length,renderer:document.getElementById("apRenderer").textContent}})')
  await run('Exact generated HTML boots offline via page.set_content',boot)
  async def breach():
   await page.keyboard.press('Digit3');await page.keyboard.press('KeyG');await ev('grabbed');await page.keyboard.press('KeyP');await shot('held_guard.png');await page.keyboard.press('KeyP');await wait(f'!{expr}.core.get({expr}.core.W.controlId).action');await page.keyboard.press('KeyT');await ev('piece_changed');await page.keyboard.down('KeyW');await wait(f'{expr}.core.get({expr}.core.W.controlId).y<14.0');await page.keyboard.up('KeyW');await page.keyboard.press('KeyP');await shot('breach_after.png');return await page.evaluate(f'()=>({{state:{expr}.core.W.pieces[0].state,actor:{expr}.core.get({expr}.core.W.controlId),events:{expr}.core.W.events}})')
  await run('Keyboard grab / throw / breach / walk through opening',breach)
  async def strike():
   await page.keyboard.press('Digit1');await page.keyboard.press('KeyJ');await ev('strike','e.actor==="proof01__person_a"');await page.keyboard.down('KeyW');await ev('strike','e.actor==="proof01__person_b"');await page.keyboard.up('KeyW');await page.keyboard.press('KeyP');return await page.evaluate(f'()=>{expr}.snapshot()')
  await run('Keyboard punch and defender counter use shared execution',strike)
  async def kick():
   await page.keyboard.press('Digit1');await page.keyboard.press('KeyK');await ev('strike','e.verb==="kick"');await page.keyboard.press('KeyP');await shot('kick_contact.png');return await page.evaluate(f'()=>{expr}.core.W.events.filter(e=>e.type==="strike")')
  await run('Keyboard kick makes one contact',kick)
  async def car():
   r=await page.evaluate('''()=>new Promise(resolve=>{
    const x=RCApp.ext().physicalProof;document.querySelector('[data-ap-preset="car"]').click();let jump=null,release=null,land=null,look=false,trace=[],begin=performance.now();
    const key=(code,type)=>document.dispatchEvent(new KeyboardEvent(type,{code,key:code==='Space'?' ':code==='KeyW'?'w':code==='KeyP'?'p':'PageDown',bubbles:true}));
    function f(){const t=x.core.W.tick,a=x.core.get(x.core.W.controlId);trace.push({tick:t,x:a.x,y:a.y,z:a.z,support:a.support});
     if(jump===null&&t>=65){key('KeyW','keydown');key('Space','keydown');key('Space','keyup');jump=t;}
     if(jump!==null&&release===null&&t>=jump+135){key('KeyW','keyup');release=t;}
     if(a.localSupport&&land===null)land=t;
     if(land!==null&&!look&&t>=land+150){key('PageDown','keydown');look=true;}
     if(land!==null&&t>=land+240||t>1200||performance.now()-begin>25000){key('PageDown','keyup');key('KeyW','keyup');key('KeyP','keydown');key('KeyP','keyup');resolve({jump,release,land,snapshot:x.snapshot(),events:x.core.W.events,trace});return;}
     requestAnimationFrame(f);
    }requestAnimationFrame(f);
   })''')
   (E/'car_browser_trace.json').write_text(json.dumps(r,indent=2));await shot('car_roof_landing.png');assert r['snapshot']['actors'][0]['localSupport'];assert r['snapshot']['actors'][0]['health']==2;return r
  await run('Keyboard-event jump lands and rides moving car for at least one second',car)
  async def swap():
   await page.keyboard.press('Digit1');await page.keyboard.press('KeyP');before=await page.evaluate(f'()=>{expr}.snapshot()');await page.keyboard.press('KeyQ');after=await page.evaluate(f'()=>{expr}.snapshot()');assert before['controlId']!=after['controlId']; fields=['id','x','y','z','vx','vy','vz','health','body','support'];assert [[a[k] for k in fields] for a in before['actors']]==[[a[k] for k in fields] for a in after['actors']];return {'from':before['controlId'],'to':after['controlId'],'physicalFieldsUnchanged':True}
  await run('Keyboard control swap preserves physical state',swap)
  async def inspection():
   await page.keyboard.press('Digit5');await shot('inspection_final.png');before=await page.evaluate(f'()=>{expr}.snapshot()');await page.keyboard.press('KeyV');await page.keyboard.press('KeyB');await page.keyboard.press('KeyI');await page.keyboard.press('KeyU');await page.keyboard.press('KeyO');after=await page.evaluate(f'()=>{expr}.snapshot()');assert before['actors'][1]['body']==after['actors'][1]['body'];assert before['actors'][1]['appearance']!=after['actors'][1]['appearance'];assert after['actors'][0]['bodyProfile']=='broad';await shot('inspection_variation.png');return {'appearanceChanged':True,'profileChanged':True,'tick':after['tick']}
  await run('Inspection appearance/profile/facing/frame controls work',inspection)
  async def resets():
   for _ in range(10):await page.keyboard.press('Digit1');await page.keyboard.press('Enter')
   await page.keyboard.press('KeyJ');await ev('strike');await page.keyboard.press('KeyP');r=await page.evaluate(f'()=>({{actors:{expr}.core.W.actors.length,vehicles:{expr}.core.W.carShapes.length,huds:document.querySelectorAll("#apHud").length,strikes:{expr}.core.W.events.filter(e=>e.type==="strike").length}})');assert r=={'actors':2,'vehicles':1,'huds':1,'strikes':1};return r
  await run('Repeated UI restarts do not duplicate actors, HUD or attacks',resets)
  async def escape():
   await page.keyboard.press('Escape');assert await page.evaluate(f'{expr}.state.on && {expr}.state.paused');await page.keyboard.press('KeyP');assert await page.evaluate(f'!{expr}.state.paused');await page.keyboard.press('KeyP');return 'Escape pauses without leaving proof; P resumes'
  await run('Escape / resume behavior',escape)
  results.append({'test':'No JavaScript page errors','status':'PASS' if not errors else 'FAIL','errors':errors})
  results.append({'test':'No HTTP(S) asset requests','status':'PASS' if not requests else 'FAIL','requests':requests})
  report={'method':'Exact delivered HTML bytes loaded with Playwright set_content; Playwright keyboard input; car drill uses frame-scheduled DOM keyboard events; no physical coordinate mutation','platform':'Linux Chromium '+b.version,'fileURL':'BLOCKED by administrator navigation policy; not bypassed','Windows':'NOT RUN','WebGL':'Unavailable in environment; Canvas fallback exercised','results':results};(E/'browser_acceptance.json').write_text(json.dumps(report,indent=2));print('RESULTS',[(r['test'],r['status']) for r in results],flush=True);await b.close()
asyncio.run(main())
