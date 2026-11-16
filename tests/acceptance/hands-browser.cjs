'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { existsSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { openBrowser } = require('./cdp.cjs');

const root = path.resolve(__dirname, '../..');
const playable = path.resolve(process.argv[2] || path.join(root, 'dist/Play_First_Encounter_Hands_v0_1.html'));
const onlyRow = process.env.FIRST_ENCOUNTER_BROWSER_ROW;
const evidence = path.join(root, 'evidence/execution', onlyRow ? 'hands-browser-probe' : 'hands-browser');
if (onlyRow) assert(/^[A-Z0-9_-]+$/.test(onlyRow));
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const report = {
  command: 'node tests/acceptance/hands-browser.cjs',
  html: path.relative(root, playable).replaceAll('\\', '/'),
  platform: { type: os.type(), release: os.release(), arch: os.arch(), node: process.version },
  requests: [], pageErrors: [], browserErrors: [], rows: [],
};
let head;
try { head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
catch {}
report.measuredLocalHead = head ?? null;
let browser;
let page;

function read(expr) {
  return page.eval('(() => { const f = firstEncounter; const s = f.inspect(); const a = s.actors.find(x => x.id === s.controlId); const b = s.actors.find(x => x.id !== s.controlId); const events = f.events(); return (' + expr + '); })()');
}
function until(expr, message, timeout = 3500) {
  return page.until('(() => { const f = firstEncounter; const s = f.inspect(); const a = s.actors.find(x => x.id === s.controlId); const b = s.actors.find(x => x.id !== s.controlId); const events = f.events(); return (' + expr + '); })()', { message, timeout });
}
function checked(id) {
  return page.eval('document.getElementById(' + JSON.stringify(id) + ').checked');
}
function actionCount(verb, current = true) {
  const actor = current ? ' && x.actor === s.controlId' : '';
  return read('events.filter(x => x.type === "hands_action" && x.verb === ' + JSON.stringify(verb) + actor + ').length');
}
function untilCount(verb, count) {
  return until('events.filter(x => x.type === "hands_action" && x.verb === ' + JSON.stringify(verb) + ' && x.actor === s.controlId).length >= ' + count, 'action ' + verb + ' #' + count);
}
async function untilTicks(ticks) {
  const start = await read('s.tick');
  await until('s.tick >= ' + (start + ticks), 'clock advances ' + ticks + ' ticks');
}
async function gap(wait = 185) {
  await until('!a.action && a.stagger === 0', 'recover');
  if (wait) await delay(wait);
}
async function setField(selector, value) {
  await page.eval('document.querySelector(' + JSON.stringify(selector) + ').scrollIntoView({block:"nearest"})');
  await page.click(selector);
  await page.key('KeyA', 'press', 2);
  await page.send('Input.insertText', { text: String(value) });
}
async function controls(callback) {
  await page.click('#controls');
  await page.until('document.querySelector("#feel-dialog").open');
  if (callback) await callback();
  await page.click('#close-controls');
  await until('!s.host.paused', 'dialog returns to the arena');
}
async function setPractice(yes) {
  if (await checked('practice') !== yes) {
    await controls(() => page.click('#practice'));
  }
}
async function restart() {
  await page.click('#restart');
  await until('s.host.started && !s.host.paused && s.controlId === "blue"', 'restart');
}
async function ready(key = 'KeyR') {
  if (!(await read('a.hands.ready'))) await page.key(key);
  await until('a.hands.ready', 'hands raised');
}
async function settle() {
  await until('Math.hypot(a.vx, a.vy) < .035', 'footwork settles', 2900);
}
async function moveIntoRange(distance = 1.13) {
  const criterion = 'Math.hypot(a.x - b.x, a.y - b.y) <= ' + distance;
  await page.key('KeyW', 'down');
  try {
    await until(criterion, 'move into sparring range', 4800);
  } finally {
    await page.key('KeyW', 'up');
  }
  await settle();
}
async function shot(name) {
  await page.screenshot(path.join(evidence, name + '.png'));
}
async function canvasShot(name) {
  const url = await page.eval('document.querySelector("#arena").toDataURL("image/png")');
  const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  await fs.writeFile(path.join(evidence, name + '.png'), bytes);
  return sha(bytes);
}
async function row(id, description, func) {
  if (onlyRow && onlyRow !== id) return;
  try {
    const detail = await func();
    report.rows.push({ id, status: 'PASS', description, detail: detail ?? null });
    console.log('PASS', id, description);
  } catch (error) {
    report.rows.push({ id, status: 'FAIL', description, detail: error.stack });
    console.error('FAIL', id, description, '\n' + error.stack);
    if (page) {
      await shot('failure-' + id).catch(() => {});
      const state = await read('({snapshot:s,events,render:f.presentation()})').catch(() => null);
      if (state) await fs.writeFile(path.join(evidence, 'failure-' + id + '.json'), JSON.stringify(state, null, 2) + '\n');
    }
  }
}

async function run() {
  await fs.mkdir(evidence, { recursive: true });
  assert(existsSync(playable), 'Build the final HTML before browser verification: ' + playable);
  report.htmlSha256 = sha(await fs.readFile(playable));
  const harness = await openBrowser();
  browser = harness.browser;
  page = harness.page;
  report.browser = await browser.send('Browser.getVersion');
  report.chromePath = harness.browserPath;
  report.testMode = 'Windows installed Chrome headless; software rendering; direct file URL; real CDP mouse, wheel and keyboard input; no HTTP(S) or WebSocket allowed';
  page.on('Network.requestWillBeSent', ({ request, type }) => {
    const url = request.url.startsWith('data:') ? request.url.split(',', 1)[0] : request.url;
    report.requests.push({ url, type });
  });
  page.on('Runtime.exceptionThrown', ({ exceptionDetails }) =>
    report.pageErrors.push(exceptionDetails.exception?.description || exceptionDetails.text));
  await page.send('Log.enable');
  page.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error') report.browserErrors.push({ source: entry.source, text: entry.text });
  });
  await page.send('Network.setBlockedURLs', { urls: ['http://*', 'https://*', 'ws://*', 'wss://*'] });
  await page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  try {
    const navigation = await page.send('Page.navigate', { url: pathToFileURL(playable).href });
    assert(!navigation.errorText, navigation.errorText);
    await page.until('Boolean(globalThis.firstEncounter)', { message: 'offline playable loaded', timeout: 8000 });
    await page.eval('window.addEventListener("contextmenu", e => (window.testContextMenu = { trusted:e.isTrusted, prevented:e.defaultPrevented }), { passive:true })');
    report.initialAudio = await read('f.audio()');
    await shot('launch');
    await page.click('#start');
    await until('s.host.started && !s.host.paused', 'start button launches the exchange');
    await setPractice(true);

    await row('E01', 'Real browser down/up/wheel and keyboard events drive the offline game surface', async () => {
      await restart();
      const down = await read('a.hands.ready');
      assert(!down, 'scenario should start with lowered fists');
      await ready();
      const previous = await read('a.hands.guardLevel');
      const scroll = await page.eval('scrollY');
      await page.wheel('#arena', -120);
      await until('a.hands.guardLevel > ' + previous, 'wheel tightens guard');
      assert.equal(await page.eval('scrollY'), scroll);
      const position = await read('a.y');
      await page.key('KeyW', 'down');
      await until('a.y < ' + (position - .22), 'keyboard footwork');
      await page.key('KeyW', 'up');
      const arena = await page.point('#arena');
      await page.mouse('mousePressed', arena);
      await untilCount('light', 1);
      assert.equal(await actionCount('light'), 1);
      await untilTicks(68);
      await page.mouse('mouseReleased', arena);
      assert.equal(await actionCount('light'), 1, 'release produced a second light');
      await page.click('#arena', 'right');
      await untilCount('heavy', 1);
      const menu = await page.eval('window.testContextMenu');
      assert(menu?.trusted && menu.prevented, 'trusted arena context menu was not consumed');
      await gap(0);
      const before = await actionCount('heavy');
      await page.click('#arena', 'right', 220);
      await untilCount('reach', 1);
      await gap(0);
      assert.equal(await actionCount('heavy'), before, 'reach release became a heavy');
      return { movement: await read('a.y') - position, trustedContextMenu: menu, guard: await read('a.hands.guardLevel') };
    });

    await row('B07', 'Reserved Q/F/Space do not leak legacy abilities and Tab owns the default switch', async () => {
      await restart();
      await ready();
      const before = await read('s.controlId');
      const num = await read('events.filter(x => x.type === "hands_action").length');
      for (const code of ['KeyQ', 'KeyF', 'Space']) await page.key(code);
      await untilTicks(10);
      assert.equal(await read('s.controlId'), before);
      assert.equal(await read('events.filter(x => x.type === "hands_action").length'), num);
      const arena = await page.point('#arena');
      await page.mouse('mousePressed', arena, 'right');
      await page.key('Tab');
      await until('s.controlId !== ' + JSON.stringify(before), 'Tab switches controlled body');
      await page.mouse('mouseReleased', arena, 'right');
      await untilTicks(85);
      assert.equal(await actionCount('heavy', false), 0, 'stale real RMB release threw a heavy');
      assert.equal(await read('s.actors.filter(x => x.controller === "human").length'), 1);
      const after = await read('s.controlId');
      await page.click('#switch');
      await until('s.controlId !== ' + JSON.stringify(after), 'visible button also changes controller');
      assert.equal(await read('s.controlId'), before);
      return { start: before, tab: after, button: await read('s.controlId') };
    });

    await row('B05', 'Rebind light, heavy, readiness and guard from the actual controls form, with conflict and profile round trips', async () => {
      await restart();
      const before = await read('f.profile()');
      let exported;
      const remap = { light: 'KeyJ', heavy_or_reach: 'KeyK', readiness_toggle: 'KeyT', guard_raise: 'KeyU', guard_lower: 'KeyI' };
      await controls(async () => {
        const pausedTick = await read('s.tick');
        await setField('[name="light"]', before.bindings.readiness_toggle);
        await page.click('#profile-save');
        await page.until('document.getElementById("profile-status").value.length > 0');
        assert.equal(await read('f.profile().bindings.light'), before.bindings.light, 'conflicting profile was applied');
        for (const [name, code] of Object.entries(remap)) await setField('[name="' + name + '"]', code);
        await page.click('#profile-save');
        await until('f.profile().bindings.light === "KeyJ"', 'apply alternative bindings');
        await page.click('#profile-export');
        exported = JSON.parse(await page.eval('document.querySelector("#profile-json").value'));
        assert.equal(exported.bindings.heavy_or_reach, 'KeyK');
        await page.click('#profile-reset');
        assert.deepEqual(await read('f.profile()'), before);
        await setField('#profile-json', JSON.stringify(exported));
        await page.click('#profile-import');
        await until('f.profile().bindings.guard_raise === "KeyU"', 'import alternative profile');
        assert.equal(await read('s.tick'), pausedTick, 'applying a profile advanced or reset paused physical state');
      });
      await page.key('KeyR');
      assert.equal(await read('a.hands.ready'), false);
      await ready('KeyT');
      const guard = await read('a.hands.guardLevel');
      await page.key('KeyU');
      await until('a.hands.guardLevel > ' + guard, 'rebound guard key');
      await page.key('KeyI');
      await until('a.hands.guardLevel <= ' + (guard + .001), 'rebound guard lower key');
      await page.key('KeyJ');
      await untilCount('light', 1);
      await gap(0);
      await page.key('KeyK');
      await untilCount('heavy', 1);
      await controls(() => page.click('#profile-reset'));
      assert.deepEqual(await read('f.profile()'), before);
      return exported;
    });

    await row('E02', 'Capture denial/retry, Escape, cancelled pointer, blur and outside release clear pending controls', async () => {
      await restart();
      await ready();
      await page.eval('window.testPointerLock = document.querySelector("#arena").requestPointerLock; document.querySelector("#arena").requestPointerLock = () => Promise.reject(new DOMException("QA denied capture", "NotAllowedError"))');
      await page.click('#capture');
      await until('s.host.captureStatus === "denied"', 'declined capture fallback');
      assert.equal(await actionCount('light', false), 0, 'capture click threw a strike');
      await page.eval('document.querySelector("#arena").requestPointerLock = window.testPointerLock');
      await page.click('#capture');
      await until('s.host.captureStatus !== "pending"', 'capture retry concludes');
      const retried = await read('s.host.captureStatus');
      await page.key('Escape');
      await until('s.host.paused', 'Escape pauses the arena');
      const frozen = await read('s.tick');
      await delay(300);
      assert.equal(await read('s.tick'), frozen);
      await page.click('#resume');
      await untilTicks(16);
      assert(await read('s.tick') < frozen + 110, 'resume accumulated hidden simulation time');
      const arena = await page.point('#arena');
      const outside = await page.point('header h1');
      await page.mouse('mousePressed', arena, 'right');
      await page.mouse('mouseReleased', outside, 'right');
      assert.equal(await actionCount('heavy'), 0);
      // Fault injection for native event paths that a physical mouse does not reliably generate.
      await page.mouse('mousePressed', arena, 'right');
      await page.eval('document.querySelector("#arena").dispatchEvent(new PointerEvent("pointercancel", {bubbles:true, pointerType:"mouse", button:2}))');
      await page.mouse('mouseReleased', arena, 'right');
      assert.equal(await actionCount('heavy'), 0);
      await page.mouse('mousePressed', arena, 'right');
      await page.eval('document.querySelector("#mute").focus()');
      await page.mouse('mouseReleased', arena, 'right');
      await untilTicks(110);
      assert.equal(await actionCount('heavy'), 0, 'blur left an active heavy gesture');
      await page.click('#arena');
      await untilCount('light', 1);
      return { captureRequestRetried: retried, arenaReentry: 'trusted LMB' };
    });

    await row('E04', 'Audio starts locked, browser gesture enables it, and muting leaves combat active', async () => {
      await restart();
      assert.equal(report.initialAudio.state, 'locked');
      await until('f.audio().state === "running"', 'Web Audio unlock');
      const before = await read('f.audio()');
      await page.click('#mute');
      assert((await read('f.audio()')).muted);
      await ready();
      await page.click('#arena');
      await untilCount('light', 1);
      assert.equal(await read('f.audio().muted'), true);
      await page.click('#mute');
      return before;
    });

    async function effectsTrace(enabled, external = false) {
      await controls(async () => {
        for (const id of ['effects', 'hold']) {
          if ((await checked(id)) !== enabled) await page.click('#' + id);
        }
      });
      await restart();
      assert.equal(await read('s.partnerEnabled'), false);
      await ready();
      await moveIntoRange();
      const yaw = await read('a.yaw');
      const button = await page.point('#arena');
      const begin = read('({x:a.x,y:a.y,yaw:a.yaw})');
      const pose = page.eval('new Promise((resolve, reject) => { const timeout=setTimeout(() => reject(new Error("Missing phase sample")),2000); const frames={}; function step(){ const s=firstEncounter.inspect(); const a=s.actors.find(x => x.id===s.controlId); const b=s.actors.find(x => x.id!==s.controlId); const phase=a.action?.phase; if(phase && !frames[phase]) frames[phase]={tick:s.tick,mechanicalPhase:phase,visual:firstEncounter.presentation(),url:document.getElementById("arena").toDataURL("image/png"),otherGuard:b.guard}; if(frames.preparation && frames.active && frames.recovery){clearTimeout(timeout);resolve(frames)}else requestAnimationFrame(step) } requestAnimationFrame(step) })');
      await page.mouse('mousePressed', button, 'right');
      await page.mouse('mouseReleased', button, 'right');
      await untilCount('heavy', 1);
      await until('events.some(e => e.type === "hands_contact" && e.move === "heavy") && a.action?.move === "heavy"', 'heavy resolves');
      const line = await read('events.filter(e => e.type === "hands_contact" && e.move === "heavy").at(-1)');
      const start = await read('events.find(e => e.type === "hands_action" && e.verb === "heavy").tick');
      const frames = await pose;
      assert.equal(await read('a.yaw'), yaw);
      const saved = [];
      for (const [phase, entry] of Object.entries(frames)) {
        const fileName = (external ? 'external-' : 'first-person-') + phase + '.png';
        const payload = Buffer.from(entry.url.slice(entry.url.indexOf(',') + 1), 'base64');
        if (external || enabled) await fs.writeFile(path.join(evidence, fileName), payload);
        const { url, ...metadata } = entry;
        saved.push({ ...metadata, image: fileName, bitmapSha256: sha(payload) });
      }
      return { offset: line.tick - start, outcome: line.outcome, begin: await begin, yaw, frames: saved };
    }

    let visuals;
    await row('E05', 'Turning presentation effects and contact hold off preserves contact offset, result and aim', async () => {
      const enabled = await effectsTrace(true);
      const disabled = await effectsTrace(false);
      assert.equal(enabled.offset, disabled.offset);
      assert.equal(enabled.outcome, disabled.outcome);
      assert.equal(enabled.yaw, disabled.yaw);
      assert(enabled.offset > 0);
      visuals = enabled;
      return { enabled: { offset: enabled.offset, outcome: enabled.outcome, yaw: enabled.yaw }, disabled: { offset: disabled.offset, outcome: disabled.outcome, yaw: disabled.yaw } };
    });

    await row('D03', 'Both cameras capture shared preparation, active and recovery plus five distinct unarmed views', async () => {
      assert(visuals?.frames.length === 3, 'missing sampled live first-person phases');
      function assertPhases(result) {
        for (const frame of result.frames) {
          const own = frame.visual.fighters.find((fighter) => fighter.id === frame.visual.subjectId);
          assert.equal(own?.phase, frame.mechanicalPhase, 'renderer diverged from action phase');
          assert.equal(frame.visual.frameTick, frame.tick, 'renderer and mechanics used different ticks');
        }
      }
      assertPhases(visuals);
      await page.click('#view');
      await until('s.host.view === "external"', 'external camera');
      const external = await effectsTrace(true, true);
      assert.equal(external.offset, visuals.offset);
      assert.equal(external.outcome, visuals.outcome);
      assertPhases(external);
      assert(visuals.frames.some((frame) => frame.visual.hands.length === 2));
      await gap(0);
      const angles = [];
      for (const angle of [0, 45, 90, 135, 180]) {
        // Select metadata through change event while actual combat controls use trusted input.
        await page.eval('document.getElementById("orbit").value = ' + JSON.stringify(String(angle)) + '; document.getElementById("orbit").dispatchEvent(new Event("change",{bubbles:true}))');
        await delay(95);
        const name = 'external-angle-' + angle;
        const render = await read('f.presentation()');
        assert.equal(render.orbit, angle);
        angles.push({ angle, bitmapSha256: await canvasShot(name), image: name + '.png', render });
      }
      assert.equal(new Set(angles.map((view) => view.bitmapSha256)).size, 5, 'distinct orbit values rendered the same bitmap');
      await page.click('#view');
      return { firstPerson: visuals.frames, external: external.frames, angles };
    });

    await row('D05', 'Live-pose stepping and the timing view render distinct asset-backed hand states', async () => {
      await restart();
      await page.click('#debug');
      await until('s.host.debug', 'developer timing overlay opens');
      assert(await page.eval('document.querySelector("#diagnostics").textContent.includes("Coverage")'));
      const captures = [];
      for (let i = 0; i < 6; i++) {
        await page.click('#pose-step');
        await until('s.host.poseStep === ' + i, 'pose debug step ' + i);
        await delay(65);
        const name = 'hand-pose-' + i;
        const view = await read('f.presentation()');
        const hands = view.hands;
        assert.equal(hands.length, 2);
        assert.deepEqual(hands.map((h) => h.side).sort(), ['left', 'right']);
        for (const hand of hands) {
          assert(!hand.fallback, 'fallback pose used unexpectedly');
          assert([hand.strike.x, hand.strike.y, hand.wrist.x, hand.wrist.y].every(Number.isFinite));
          assert(Math.hypot(hand.strike.x - hand.wrist.x, hand.strike.y - hand.wrist.y) > 1);
        }
        assert.equal(hands[0].mirror, -hands[1].mirror);
        captures.push({ step: i, bitmapSha256: await canvasShot(name), image: name + '.png', hands });
      }
      const render = await read('f.presentation()');
      assert.equal(render.assets.loaded, render.assets.total);
      assert.deepEqual(render.assets.failures, []);
      assert(new Set(captures.map((pose) => pose.bitmapSha256)).size >= 4);
      await page.click('#pose-live');
      await until('s.host.poseStep === null', 'return to shared poses');
      await page.click('#debug');
      return { captures, render };
    });

    await row('EXCHANGE', 'One live partner exchange includes a chain, timed intercept, counter and guard break', async () => {
      // A smaller viewport leaves enough software-render headroom for genuine
      // device events to arrive inside the short interception window.
      await page.send('Emulation.setDeviceMetricsOverride', {width:1024,height:768,deviceScaleFactor:1,mobile:false});
      try {
        await setPractice(false);
        await restart();
        await ready();
        await moveIntoRange(1.24);
        await page.click('#arena');
        await untilCount('light', 1);
        await gap(0);
        await page.click('#arena');
        await untilCount('light', 2);
        await gap(0);
        await shot('live-exchange');
        const hasParry = 'events.some(e => e.type === "hands_contact" && e.outcome === "parry" && e.target === s.controlId)';
        const arena = await page.point('#arena');
        const attempts = [];
        let found = false;
        let requestedAttackAge = 47;
        let minimumStart = 0;
        for (let attempt = 0; attempt < 6 && !found; attempt++) {
          const deadline = Date.now() + 5000;
          const observation = await page.eval('new Promise((resolve, reject) => {' +
            'function sample(){' +
            'const s=firstEncounter.inspect(), a=s.actors.find(x=>x.id===s.controlId), b=s.actors.find(x=>x.id!==s.controlId);' +
            'const start=b.action?.startTick, age=s.tick-start;' +
            'if(!a.action && !a.stagger && b.action?.move==="heavy" && b.action.phase==="preparation" && start>' + minimumStart +
            ' && age>=' + requestedAttackAge + ' && age<=58) return resolve({start,tick:s.tick,age,distance:Math.hypot(a.x-b.x,a.y-b.y)});' +
            'if(Date.now()>' + deadline + ') return reject(new Error("No readable windup before deadline"));' +
            'requestAnimationFrame(sample)} requestAnimationFrame(sample)})');
          const counts = await actionCount('light');
          await page.mouse('mousePressed', arena);
          await page.mouse('mouseReleased', arena);
          await until('s.tick >= ' + (observation.start + 67), 'heavy contact time elapsed');
          const light = await read('events.filter(e => e.type === "hands_action" && e.verb === "light" && e.actor === s.controlId).at(-1)');
          found = await read(hasParry);
          const acceptedAt = (await actionCount('light')) > counts ? light.tick - observation.start : null;
          attempts.push({ observedAt: observation.age, acceptedAt, distance: observation.distance, parry: found });
          minimumStart = observation.start;
          if (acceptedAt !== null) requestedAttackAge = Math.max(30, Math.min(54, requestedAttackAge + 54 - acceptedAt));
        }
        report.exchangeInputTiming = attempts;
        assert(found, 'real input did not intercept: ' + JSON.stringify(attempts));
        const nowLight = await actionCount('light');
        // Continue through the measured late-recovery buffer. A screenshot here
        // can spend the entire 200 ms counter window in software capture.
        await page.mouse('mousePressed', arena);
        await page.mouse('mouseReleased', arena);
        await untilCount('light', nowLight + 1);
        await until('events.some(e => e.type === "hands_action" && e.move === "counter_palm" && e.actor === s.controlId)', 'defensive continuation becomes a counter palm');
        await shot('live-counter');
        await gap(0);
        const opponentBroke = 'events.some(e => e.outcome === "guard_break" && e.target === b.id)';
        let broken = await read(opponentBroke);
        for (let tryHeavy = 0; !broken && tryHeavy < 5; tryHeavy++) {
          if ((await read('Math.hypot(a.x - b.x,a.y - b.y)')) > 1.30) await moveIntoRange(1.16);
          await page.click('#arena', 'right');
          await untilTicks(110);
          broken = await read(opponentBroke);
          if (!broken) await gap(0);
        }
        assert(broken, 'opponent guard never yielded during the measured exchange');
        await shot('live-guard-break');
        await until('events.some(e => e.type === "hands_guard_recovered" && e.actor === b.id)', 'opponent guard recovers');
        const trace = await read('events');
        await fs.writeFile(path.join(evidence, 'exchange-trace.json'), JSON.stringify(trace, null, 2) + '\n');
        return { viewport: [1024,768], attempts, events: trace.filter((e) => e.type === 'hands_contact').map((e) => ({ e: e.outcome, action: e.move, tick: e.tick, actor: e.actor, target: e.target })), finishTick: await read('s.tick') };
      } finally {
        await page.send('Emulation.setDeviceMetricsOverride', {width:1360,height:860,deviceScaleFactor:1,mobile:false});
      }
    });

    await row('E06', 'Actual native Windows software headless frame-time sample recorded', async () => {
      const start = await read('f.performance().frameTimesMs.length');
      await delay(1600);
      const performance = await read('f.performance()');
      assert(performance.frameTimesMs.length >= 25);
      const samples = start >= 525 ? performance.frameTimesMs.slice(-25) : performance.frameTimesMs.slice(start);
      assert(samples.length >= 25, 'did not capture enough primary-viewport frames');
      const sorted = samples.filter((n) => n > 0).sort((a, b) => a - b);
      const quantile = (p) => sorted[Math.floor(p * (sorted.length - 1))];
      return { renderer: performance.renderer, canvas: performance.canvas, viewport: await page.eval('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})'), frames: sorted.length, p50Ms: quantile(.50), p95Ms: quantile(.95), maxMs: sorted.at(-1), browser: report.browser.product, nativeOs: report.platform, headlessSoftware: true };
    });

    await row('E03', 'Offline direct file load and restart without external requests or page exceptions', async () => {
      const state = await read('s');
      assert(state.tick > 0);
      await restart();
      assert(await read('s.tick') < state.tick);
      assert.equal(await read('events.filter(e => e.type === "hands_contact").length'), 0);
      assert.equal(report.requests.filter((r) => /^(https?|wss?):/i.test(r.url)).length, 0);
      assert.deepEqual(report.pageErrors, []);
      assert.deepEqual(report.browserErrors, []);
      return { fileUrl: await page.eval('location.protocol'), checkedRequests: report.requests.length, onlineRequests: 0, pageErrors: 0 };
    });
  } finally {
    await harness.stop();
  }
}

run().catch((error) => {
  report.rows.push({ id: 'HARNESS', status: 'FAIL', description: 'Local browser launch and setup', detail: error.stack });
  console.error('FAIL HARNESS', error.stack);
}).finally(async () => {
  report.exitCode = !report.rows.length || report.rows.some((r) => r.status === 'FAIL') ? 1 : 0;
  await fs.mkdir(evidence, { recursive: true });
  await fs.writeFile(path.join(evidence, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.exitCode;
});
