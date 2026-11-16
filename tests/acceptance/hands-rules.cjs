'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const P = require('../../game/rc/source/actor-physical');
const HandsCombat = require('../../game/rc/source/hands-combat');
const HandsInput = require('../../game/rc/source/hands-input');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'evidence/execution');
const H = P.H;
const A = 'blue';
const B = 'red';
const FLOOR = 'test-floor';
const arena = {
  boxes: [
    { id: 'east', x0: 5, x1: 5.5, y0: -5.5, y1: 5.5, z0: 0, z1: 4, kind: 'wall' },
    { id: 'west', x0: -5.5, x1: -5, y0: -5.5, y1: 5.5, z0: 0, z1: 4, kind: 'wall' },
    { id: 'north', x0: -5.5, x1: 5.5, y0: -5.5, y1: -5, z0: 0, z1: 4, kind: 'wall' },
    { id: 'south', x0: -5.5, x1: 5.5, y0: 5, y1: 5.5, z0: 0, z1: 4, kind: 'wall' },
  ],
  surfaces: [{ id: FLOOR, x0: -5, x1: 5, y0: -5, y1: 5, z: 0, story: 0, kind: 'floor' }],
};
const sha = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const rings = Object.fromEntries(['actor-physical', 'hands-combat', 'hands-input'].map((f) => {
  const p = 'game/rc/source/' + f + '.js';
  return [p, sha(p)];
}));
let head;
try { head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
catch {}
const report = {
  command: 'node tests/acceptance/hands-rules.cjs',
  fixture: 'two standard donor bodies; flat 10 x 10 m local test floor; explicit semantic requests; 240 Hz',
  node: process.version, testSha256: sha('tests/acceptance/hands-rules.cjs'),
  measuredLocalHead: head ?? null, measuredSourceSha256: rings, rows: [],
};

function test(id, description, fn) {
  try {
    const detail = fn();
    report.rows.push({ id, status: 'PASS', description, detail: detail ?? null });
    console.log('PASS', id, description, detail === undefined ? '' : JSON.stringify(detail));
  } catch (error) {
    report.rows.push({ id, status: 'FAIL', description, detail: error.stack });
    console.error('FAIL', id, description, '\n' + error.stack);
  }
}

function fixture({
  partner = false, momentum = true, a = {}, b = {}, reverse = false, seed = 1977,
  distance = 1.18, geometry = arena, tuning, controlId = A,
} = {}) {
  const actors = [
    { id: A, x: 0, y: distance / 2, z: 0, story: 0, yaw: 0, ready: true, guardLevel: 0, controller: 'human', ...a },
    { id: B, x: 0, y: -distance / 2, z: 0, story: 0, yaw: 180, ready: true, guardLevel: 0, controller: 'training', ...b },
  ];
  if (reverse) actors.reverse();
  return HandsCombat.create({ partner, momentum, actors, controlId, geometry, arenaFloorIds: [FLOOR], tuning, seed });
}

function step(sim, n, input) {
  for (let i = 0; i < n; i++) {
    input?.sample();
    sim.step();
  }
}
function tickUntil(sim, condition, limit, message) {
  for (let i = 0; i <= limit; i++) {
    if (condition()) return;
    sim.step();
  }
  assert.fail(message ?? 'Condition not reached within ' + limit + ' ticks');
}
function request(sim, id, verb, params) {
  return sim.request(id, verb, params);
}
const hands = (sim, id) => sim.get(id).hands;
const actor = (sim, id) => sim.get(id);
const contacts = (sim) => sim.W.events.filter((e) => e.type === 'hands_contact');
const misses = (sim) => sim.W.events.filter((e) => e.type === 'hands_miss');
const actions = (sim) => sim.W.events.filter((e) => e.type === 'hands_action');
const inputEvents = (sim) => sim.W.events.filter((e) => /^hands_/.test(e.type));

function accepted(sim, id, verb, params) {
  const result = request(sim, id, verb, params);
  assert(result.ok, verb + ': ' + JSON.stringify(result));
  return result;
}
function fighterState(sim, id) {
  const a = actor(sim, id);
  return {
    id, x: a.x, y: a.y, z: a.z, vx: a.vx, vy: a.vy, vz: a.vz, yaw: a.yaw,
    health: a.health, guard: a.guard, stagger: a.stagger, support: a.support,
    readiness: a.hands.ready, guardLevel: a.hands.guardLevel, momentum: a.hands.momentum,
    move: a.action?.move, phase: a.action?.phase,
  };
}
function contactSignature(sim) {
  return contacts(sim).map((event) => ({
    actor: event.actor, target: event.target, outcome: event.outcome, tick: event.tick, pressure: event.pressure,
  })).sort((a, b) => a.tick - b.tick || a.actor.localeCompare(b.actor) || a.target.localeCompare(b.target));
}
function runHit(options, verb, preparation, steps = 180) {
  const sim = fixture(options);
  if (preparation) preparation(sim);
  accepted(sim, A, verb);
  step(sim, steps);
  return sim;
}

test('A01', 'Human adapter and a semantic training request produce equal consequences', () => {
  const player = fixture();
  const direct = fixture({ a: { controller: 'training' }, b: { controller: 'human' }, controlId: B });
  const adapter = HandsInput.create(player);
  adapter.down(adapter.profile.bindings.light);
  step(player, 1, adapter);
  adapter.up(adapter.profile.bindings.light);
  accepted(direct, A, 'light');
  step(direct, 1);
  step(player, 160);
  step(direct, 160);
  assert(contacts(player).length > 0, 'no hit in controller equivalence fixture');
  assert.deepEqual(contactSignature(player), contactSignature(direct));
  assert.deepEqual([A, B].map((id) => fighterState(player, id)), [A, B].map((id) => fighterState(direct, id)));
  const autonomous = fixture({ partner: true });
  step(autonomous, 2400);
  assert(actions(autonomous).some((e) => e.actor === B), 'training provider issued no shared action');
  return contactSignature(player);
});

test('A02', 'Controller swaps preserve committed actions and physical identities through seven exchange states', () => {
  const modes = ['idle', 'moving', 'preparing', 'striking', 'recovering', 'guarding', 'staggered'];
  for (const mode of modes) {
    const sim = fixture({ b: { guardLevel: 0 } });
    if (mode === 'moving') {
      accepted(sim, A, 'move', { x: 1, y: 0 });
      step(sim, 15);
      assert(actor(sim, A).vx > 0, 'movement fixture was idle');
    } else if (mode === 'guarding') {
      accepted(sim, A, 'guard', { level: 1 });
      step(sim, 2);
      assert(hands(sim, A).coverage.left > 0 || hands(sim, A).coverage.right > 0);
    } else if (mode === 'staggered') {
      accepted(sim, B, 'heavy');
      tickUntil(sim, () => actor(sim, A).stagger > 0, 120, 'heavy should visibly stagger');
    } else if (mode !== 'idle') {
      accepted(sim, A, 'light');
      const desired = {
        preparing: /^(startup|prepare|preparation|windup)$/, striking: /^(active|strike|contact)$/,
        recovering: /^(recovery|recover)$/,
      }[mode];
      tickUntil(sim, () => desired.test(actor(sim, A).action?.phase), 80, 'action phase missing: ' + mode);
    }
    const actors = [actor(sim, A), actor(sim, B)];
    const before = actors.map((a) => ({ id: a.id, x: a.x, y: a.y, guard: a.guard, momentum: a.hands.momentum, action: a.action?.id, health: a.health }));
    const tick = sim.W.tick;
    const epoch = sim.W.controlEpoch;
    sim.switchControl(B);
    assert.equal(sim.W.controlId, A, 'swap must wait for boundary');
    sim.step();
    assert.equal(sim.W.tick, tick + 1);
    assert.equal(sim.W.controlId, B);
    assert.equal(sim.W.controlEpoch, epoch + 1);
    assert.strictEqual(sim.get(A), actors[0]);
    assert.strictEqual(sim.get(B), actors[1]);
    assert.equal(actors.filter((a) => a.controller === 'human').length, 1);
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      assert.equal(a.id, before[i].id);
      assert.equal(a.action?.id, before[i].action, mode + ' changed an existing commitment');
      assert.equal(a.health, before[i].health);
      assert(Math.hypot(a.x - before[i].x, a.y - before[i].y) < 0.08, mode + ' teleported a body');
      assert(Math.abs(a.guard - before[i].guard) < 1, mode + ' reset guard');
      assert(Math.abs(a.hands.momentum - before[i].momentum) < 1, mode + ' reset Momentum');
    }
    if (mode === 'moving') assert(actor(sim, A).vx > 0, 'swap erased physical velocity');
  }
  return modes;
});

test('A03', 'Held key and stale heavy release cannot cross control epoch', () => {
  const sim = fixture();
  const input = HandsInput.create(sim);
  const { heavy_or_reach, move_forward } = input.profile.bindings;
  input.down(move_forward);
  input.down(heavy_or_reach);
  step(sim, 8, input);
  const epoch = sim.W.controlEpoch;
  input.swap(B);
  step(sim, 2, input);
  assert.equal(sim.W.controlId, B);
  const oldEpochCheck = request(sim, B, 'heavy', { epoch, controlEpoch: epoch, source: 'human' });
  assert(!oldEpochCheck.ok, 'core accepted a stale control epoch');
  input.up(heavy_or_reach);
  input.up(move_forward);
  step(sim, 230, input);
  assert.equal(actor(sim, B).vx, 0);
  assert.equal(actor(sim, B).vy, 0);
  assert.equal(actor(sim, B).action, null);
  assert(!actions(sim).some((e) => e.move === 'heavy' || e.verb === 'heavy'));
});

test('A04', 'No-art headless replay has the same outcomes as named and missing artwork IDs', () => {
  const one = runHit({}, 'heavy');
  const two = runHit({ a: { appearance: 'sample-does-not-exist' }, b: { appearance: 'unassigned' } }, 'heavy');
  assert.deepEqual(contactSignature(one), contactSignature(two));
  assert.deepEqual(fighterState(one, B), fighterState(two, B));
  assert(contacts(two).length === 1);
});

test('A05', '30, 60 and 144 Hz render schedules replay an equal 240 Hz trace', () => {
  function replay(hz) {
    const sim = fixture();
    // Commands occur at whole-second boundaries, common to all tested schedules.
    for (let second = 0; second < 5; second++) {
      if (second % 2 === 0) accepted(sim, A, 'light');
      else accepted(sim, B, 'guard', { level: second === 1 ? .75 : 0 });
      for (let frame = 0; frame < hz; frame++) sim.advance(1 / hz);
    }
    assert.equal(sim.W.tick, 1200);
    return { actors: [A, B].map((id) => fighterState(sim, id)), contacts: contactSignature(sim) };
  }
  const sixty = replay(60);
  assert(sixty.contacts.length > 0, 'no actual contact in frame scheduling test');
  assert.deepEqual(replay(30), sixty);
  assert.deepEqual(replay(144), sixty);
  return sixty.contacts;
});

test('A06', 'Simultaneous contact is a neutral trade or clash in either actor order', () => {
  function exchange(reverse) {
    const sim = fixture({ reverse });
    const ids = reverse ? [B, A] : [A, B];
    for (const id of ids) accepted(sim, id, 'light');
    step(sim, 120);
    return { contacts: contactSignature(sim), actors: [A, B].map((id) => fighterState(sim, id)) };
  }
  const result = exchange(false);
  assert(result.contacts.some((e) => e.outcome === 'clash') ||
    new Set(result.contacts.map((e) => e.actor)).size === 2, 'contact elected an iteration-order winner');
  assert.deepEqual(exchange(true), result);
  return result.contacts;
});

test('A07', 'Overlapping active ticks produce a single result for an action/target', () => {
  const sim = runHit({}, 'heavy');
  assert.equal(contacts(sim).length, 1);
  assert.equal(misses(sim).length, 0);
  return contactSignature(sim);
});

test('B01', 'Readiness toggle and wheel adjust stance with coverage separated from desired level', () => {
  const sim = fixture({ a: { ready: false } });
  const input = HandsInput.create(sim);
  const controls = input.profile.bindings;
  const tap = (key) => { input.down(key); step(sim, 1, input); input.up(key); };
  input.wheel(-120, 0);
  step(sim, 3, input);
  assert(hands(sim, A).guardLevel > 0);
  assert.deepEqual(hands(sim, A).coverage, { left: 0, right: 0 });
  tap(controls.heavy_or_reach);
  step(sim, 2, input);
  assert.equal(actor(sim, A).action, null);
  tap(controls.readiness_toggle);
  step(sim, 2, input);
  assert(hands(sim, A).ready);
  assert(hands(sim, A).coverage.left > 0 || hands(sim, A).coverage.right > 0);
  input.wheel(120, 0);
  step(sim, 2, input);
  assert(hands(sim, A).guardLevel < .5);
  tap(controls.readiness_toggle);
  assert(!hands(sim, A).ready);
});

test('B02', 'Light begins on press and a held/released input produces no repeat or block', () => {
  const sim = fixture();
  const input = HandsInput.create(sim);
  const code = input.profile.bindings.light;
  input.down(code);
  step(sim, 2, input);
  assert(actor(sim, A).action?.move.includes('light'), 'light did not start on down');
  step(sim, 100, input);
  input.up(code);
  step(sim, 100, input);
  assert.equal(actions(sim).length, 1);
  assert.equal(hands(sim, A).guardLevel, 0);
});

test('B03', 'Heavy release below threshold, reach at and above threshold', () => {
  const measured = [];
  for (const delta of [-1, 0, 1]) {
    const sim = fixture({ distance: 5 });
    const input = HandsInput.create(sim);
    const code = input.profile.bindings.heavy_or_reach;
    const threshold = Math.round(input.profile.thresholds.right_tap_max_ms / 1000 / H);
    input.down(code);
    step(sim, threshold + delta, input);
    input.up(code);
    step(sim, 220, input);
    const heavies = actions(sim).filter((e) => e.move === 'heavy' || e.verb === 'heavy');
    assert.equal(heavies.length, delta < 0 ? 1 : 0, 'boundary at held tick ' + (threshold + delta));
    if (delta >= 0) assert(inputEvents(sim).some((e) => /reach/.test(e.type + ' ' + e.verb + ' ' + e.move)), 'reach never committed');
    measured.push({ heldTicks: threshold + delta, heavyCount: heavies.length });
  }
  return measured;
});

test('B04', 'Lowering readiness and focus-style clear cancel long gestures without a latent heavy', () => {
  for (const cancellation of ['readiness', 'clear']) {
    const sim = fixture({ distance: 5 });
    const input = HandsInput.create(sim);
    const controls = input.profile.bindings;
    input.down(controls.heavy_or_reach);
    step(sim, 54, input);
    if (cancellation === 'readiness') {
      input.down(controls.readiness_toggle);
      step(sim, 1, input);
      input.up(controls.readiness_toggle);
    } else input.clear();
    input.up(controls.heavy_or_reach);
    step(sim, 220, input);
    assert(!actions(sim).some((e) => e.move === 'heavy' || e.verb === 'heavy'), cancellation);
    assert.equal(actor(sim, A).action, null, cancellation + ' left a hand committed');
    assert(!hands(sim, A).queue);
  }
});

test('B05', 'Alternative physical bindings generate the same semantic and physical trace', () => {
  function trace(alternate) {
    const options = { a: { ready: false } };
    const sim = fixture(options);
    const profile = structuredClone(HandsInput.DEFAULT_PROFILE);
    if (alternate) Object.assign(profile.bindings, {
      light: 'KeyJ', heavy_or_reach: 'KeyK',
      readiness_toggle: 'KeyT', guard_raise: 'KeyU', guard_lower: 'KeyI',
    });
    const input = HandsInput.create(sim, profile);
    const bindings = profile.bindings;
    function tap(code) {
      input.down(code);
      step(sim, 1, input);
      input.up(code);
    }
    tap(bindings.readiness_toggle);
    if (alternate) tap(bindings.guard_raise);
    else {
      input.wheel(-120, 0);
      step(sim, 1, input);
    }
    tap(bindings.light);
    step(sim, 130, input);
    tap(bindings.heavy_or_reach);
    step(sim, 180, input);
    return {
      states: [A, B].map((id) => fighterState(sim, id)),
      moves: actions(sim).map(({ move, tick }) => ({ move, tick })),
      contacts: contactSignature(sim),
    };
  }
  const defaultTrace = trace(false);
  assert.equal(defaultTrace.moves.length, 2);
  assert.deepEqual(trace(true), defaultTrace);
  return defaultTrace.moves;
});

test('B06', 'Light mashing while busy queues at most one command with bounded expiry', () => {
  const sim = fixture({ distance: 5 });
  const input = HandsInput.create(sim);
  input.down(input.profile.bindings.light);
  step(sim, 1, input);
  input.up(input.profile.bindings.light);
  for (let i = 0; i < 18; i++) {
    input.down(input.profile.bindings.light);
    step(sim, 1, input);
    input.up(input.profile.bindings.light);
    assert(!Array.isArray(hands(sim, A).queue) || hands(sim, A).queue.length <= 1);
  }
  input.clear();
  step(sim, 240, input);
  assert(actions(sim).length <= 2, 'replayed more than one queued action');
  assert(!hands(sim, A).queue, 'buffer did not expire');

  const noBuffer = fixture({ distance: 5 });
  const profile = structuredClone(HandsInput.DEFAULT_PROFILE);
  profile.thresholds.input_buffer_ms = 0;
  const none = HandsInput.create(noBuffer, profile);
  none.down(profile.bindings.light);
  step(noBuffer, 56, none);
  none.up(profile.bindings.light);
  none.down(profile.bindings.light);
  step(noBuffer, 1, none);
  assert(!hands(noBuffer, A).queue, 'disabled zero buffer still accepts a queued action');
  step(noBuffer, 200, none);
  assert.equal(actions(noBuffer).length, 1, 'disabled zero buffer replayed an action');
});

test('C01', 'Clean light, blocked light, heavy and whiff have distinct outcomes and no early contact', () => {
  const sim = fixture();
  accepted(sim, A, 'light');
  step(sim, 4);
  assert.equal(contacts(sim).length, 0);
  assert.equal(misses(sim).length, 0);
  step(sim, 170);
  const guarded = runHit({ b: { guardLevel: 1 } }, 'light', null, 70);
  const heavy = runHit({}, 'heavy', null, 90);
  const whiff = runHit({ distance: 4.5 }, 'light');
  assert.equal(contacts(sim)[0]?.outcome, 'hit');
  assert.equal(contacts(guarded)[0]?.outcome, 'guard');
  assert(actor(guarded, B).guard < 100);
  assert.equal(contacts(heavy)[0]?.outcome, 'hit');
  assert(contacts(heavy)[0].tick > contacts(sim)[0].tick);
  assert.equal(contacts(whiff).length, 0);
  assert.equal(misses(whiff).length, 1);
  return { clean: contactSignature(sim), guarded: contactSignature(guarded), heavy: contactSignature(heavy), whiff: misses(whiff) };
});

function parryTrial(at, options = {}, mash = false) {
  const sim = fixture(options);
  accepted(sim, B, 'heavy');
  step(sim, at);
  request(sim, A, 'light');
  if (mash) {
    for (let i = 0; i < 110; i++) {
      request(sim, A, 'light');
      sim.step();
    }
  } else step(sim, 100);
  return sim;
}

test('C02', 'Sweep early, in-window, late, misaligned and out-of-range interceptions', () => {
  const result = [];
  for (let at = 0; at <= 76; at += 2) {
    const sim = parryTrial(at);
    if (contacts(sim).some((e) => e.outcome === 'parry' && e.target === A)) result.push(at);
  }
  assert(result.length > 0, 'no measured valid parry window');
  assert(result[0] > 0 && result.at(-1) < 76, 'parry was available outside intended timing');
  const at = result[Math.floor(result.length / 2)];
  for (const options of [{ distance: 4 }, { a: { yaw: 180 } }]) {
    assert(!contacts(parryTrial(at, options)).some((e) => e.outcome === 'parry'), 'misaligned interception succeeded');
  }
  return { validTimingTicksAtTwoTickIntervals: result };
});

test('C03', 'Repeated light requests cannot continually reopen parry eligibility', () => {
  const sim = fixture({ a: { yaw: 0 }, b: { x: .55, y: -.70, yaw: 209 } });
  accepted(sim, B, 'heavy');
  accepted(sim, A, 'light');
  const id = actor(sim, A).action?.id;
  for (let tick = 0; tick < 26; tick++) {
    request(sim, A, 'light');
    sim.step();
    assert.equal(actor(sim, A).action?.id, id, 'mash renewed an existing action');
  }
  step(sim, 100);
  const early = parryTrial(0, {}, true);
  assert(!contacts(early).some((e) => e.outcome === 'parry' && e.target === A), 'early repeated light became a perfect defense');
});

test('C04', 'A committed hand loses coverage while the uncommitted hand remains eligible', () => {
  const sim = fixture({ a: { guardLevel: 1 } });
  step(sim, 2);
  assert(hands(sim, A).coverage.left > 0 && hands(sim, A).coverage.right > 0);
  accepted(sim, A, 'light');
  step(sim, 5);
  const side = actor(sim, A).action.side;
  const free = side === 'left' ? 'right' : 'left';
  assert.equal(hands(sim, A).coverage[side], 0);
  assert(hands(sim, A).coverage[free] > 0);
  return { side, coverage: hands(sim, A).coverage };
});

test('C05', 'Shared combo opportunities follow clean hits and a timed defensive interception', () => {
  const hit = fixture();
  accepted(hit, A, 'light');
  tickUntil(hit, () => contacts(hit).length, 80);
  const offensive = hands(hit, A).combo;
  assert(offensive, 'no continuation from resolved legal contact');
  assert.equal(offensive.via, 'hit', 'offensive continuation should follow a clean hit');
  let defensive;
  for (let at = 20; at <= 76 && !defensive; at++) {
    const sim = fixture();
    accepted(sim, B, 'heavy');
    step(sim, at);
    request(sim, A, 'light');
    for (let remaining = 0; remaining < 80 && !defensive; remaining++) {
      sim.step();
      if (contacts(sim).some((e) => e.outcome === 'parry' && e.target === A) && hands(sim, A).combo) {
        defensive = { combo: structuredClone(hands(sim, A).combo), sim };
      }
    }
  }
  assert(defensive, 'no continuation from parry');
  const requested = request(defensive.sim, A, 'light');
  assert(requested.ok, 'defensive continuation rejected instead of accepted/buffered');
  step(defensive.sim, 100);
  assert(actions(defensive.sim).filter((e) => e.actor === A).length >= 2, 'no second light followed a parry request');
  return { offensive, defensive: defensive.combo };
});

test('C06', 'Repeated guard breaks produce bounded stagger and preserve sparring health', () => {
  const sim = fixture({ distance: .92, b: { guardLevel: 1 } });
  const breaks = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    actor(sim, B).guard = 10; // controlled low-guard fixture, no production mutation path
    request(sim, B, 'ready', { active: true });
    request(sim, B, 'guard', { level: 1 });
    const count = contacts(sim).length;
    accepted(sim, A, 'heavy');
    tickUntil(sim, () => contacts(sim).length > count, 120);
    const e = contacts(sim).at(-1);
    assert.equal(e.outcome, 'guard_break');
    assert(actor(sim, B).stagger > 0);
    assert(!request(sim, B, 'light').ok, 'staggered actor initiated a light');
    tickUntil(sim, () => actor(sim, B).stagger <= 0, 360, 'stagger exceeded 1.5 seconds');
    tickUntil(sim, () => actor(sim, A).action === null, 200, 'attacker never recovered');
    tickUntil(sim, () => sim.W.tick >= hands(sim, B).graceUntil, 100, 'guard recovery grace did not end');
    assert(actor(sim, B).health === actor(sim, B).body.maxHealth);
    breaks.push(e.tick);
    // Replicate the same melee spacing after the physical pushback.
    actor(sim, A).y = .46;
    actor(sim, B).y = -.46;
    actor(sim, A).vy = actor(sim, B).vy = 0;
  }
  return breaks;
});

test('C07', 'Optional Momentum is bounded, off has no attack bonus and misses cannot farm it', () => {
  const sim = fixture({ distance: .98, b: { guardLevel: 1 } });
  hands(sim, A).momentum = 100;
  accepted(sim, A, 'heavy');
  tickUntil(sim, () => contacts(sim).length > 0, 120);
  const boosted = contacts(sim)[0];
  assert(hands(sim, A).momentum <= 100);
  const off = fixture({ distance: .98, b: { guardLevel: 1 } });
  hands(off, A).momentum = 100;
  off.setMomentum(false);
  accepted(off, A, 'heavy');
  tickUntil(off, () => contacts(off).length > 0, 120);
  const base = contacts(off)[0];
  assert(actor(off, B).guard >= actor(sim, B).guard);
  const onCost = 100 - actor(sim, B).guard;
  const offCost = 100 - actor(off, B).guard;
  assert(offCost > 0 && onCost > offCost && onCost / offCost <= 1.15 + 1e-7);
  const missesOnly = fixture({ distance: 5 });
  hands(missesOnly, A).momentum = 25;
  accepted(missesOnly, A, 'heavy');
  step(missesOnly, 180);
  assert.equal(misses(missesOnly).length, 1);
  assert(hands(missesOnly, A).momentum < 25 && hands(missesOnly, A).momentum >= 19 - 1, 'whiff gain or duplicate meaningful loss');
  return { pressureRatio: onCost / offCost, boosted, base, afterMiss: hands(missesOnly, A).momentum };
});

test('C08', 'Sixty seconds of symmetric sparring preserves health and real contact', () => {
  const sim = fixture({ partner: true, seed: 1977 });
  for (let tick = 0; tick < 60 / H; tick++) {
    if (tick % 145 === 0) request(sim, A, tick % 290 === 0 ? 'light' : 'heavy');
    if (tick % 13 === 0) moveToward(sim, A, B, tick % 260 < 155 ? 1 : -1);
    sim.step();
  }
  assert(actions(sim).some((e) => e.actor === B), 'no autonomous action was found');
  assert(contacts(sim).length > 0, 'no meaningful contact was found');
  for (const id of [A, B]) {
    assert.equal(actor(sim, id).health, actor(sim, id).body.maxHealth);
    assert.equal(actor(sim, id).down, false);
  }
  return { logicalTicks: sim.W.tick, retainedContacts: contacts(sim).length };
});

function moveToward(sim, id, other, direction) {
  const a = actor(sim, id);
  const b = actor(sim, other);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  request(sim, id, 'face', { yaw: Math.atan2(dx, -dy) * 180 / Math.PI });
  request(sim, id, 'move', { x: direction * dx / distance, y: direction * dy / distance });
}

test('D01', 'Hidden queued inputs are absent from training observations', () => {
  const one = fixture({ partner: true, distance: 1.2, seed: 19 });
  const two = fixture({ partner: true, distance: 1.2, seed: 19 });
  for (const sim of [one, two]) {
    accepted(sim, A, 'heavy');
    step(sim, 9);
  }
  assert(!hands(one, A).queue && !hands(two, A).queue);
  hands(one, A).queue = { verb: 'light', expires: 200 };
  assert.deepEqual(one.observe(B, A), two.observe(B, A));
  step(one, 20);
  step(two, 20);
  assert.deepEqual(fighterState(one, B), fighterState(two, B));
});

test('D02', 'Partner responses change over an approach, commitment and retreat', () => {
  const sim = fixture({ partner: true, distance: 3.7, seed: 1977, a: { ready: true } });
  const observations = [];
  for (let tick = 0; tick < 1700; tick++) {
    if (tick === 240) request(sim, A, 'heavy');
    if (tick % 10 === 0 && tick > 150) moveToward(sim, A, B, tick % 400 > 240 ? -1 : 1);
    sim.step();
    if (tick % 80 === 0) observations.push({ tick, y: actor(sim, B).y, x: actor(sim, B).x, guard: hands(sim, B).guardLevel });
  }
  assert(new Set(observations.map((sample) => sample.guard)).size > 1, 'partner never adjusted guard');
  assert(Math.max(...observations.map((s) => s.y)) - Math.min(...observations.map((s) => s.y)) > .35, 'partner did not move');
  assert(actions(sim).some((e) => e.actor === B), 'partner did not answer');
  return { observations, partnerActions: actions(sim).filter((e) => e.actor === B).length };
});

test('D04', 'Grounded movement collides with the body and safely stops at the authored floor', () => {
  const sim = fixture({ distance: 2.20 });
  const start = actor(sim, A).y;
  for (let i = 0; i < 360; i++) {
    request(sim, A, 'move', { x: 0, y: -1 });
    sim.step();
  }
  const near = actor(sim, A).y;
  const separation = Math.hypot(actor(sim, A).x - actor(sim, B).x, actor(sim, A).y - actor(sim, B).y);
  assert(near < start && separation >= actor(sim, A).body.radius + actor(sim, B).body.radius - .012);
  for (const geometry of [arena, { ...arena, boxes: [] }]) {
    const test = fixture({ geometry });
    for (let i = 0; i < 2400; i++) {
      request(test, A, 'move', { x: 1, y: i < 1200 ? 1 : -1 });
      test.step();
    }
    assert(Math.abs(actor(test, A).x) <= 5 && Math.abs(actor(test, A).y) <= 5);
    assert.equal(actor(test, A).z, 0);
    assert.equal(actor(test, A).support, FLOOR);
    assert(!actor(test, A).down && !actor(test, A).outOfTile);
  }
  return { closestMeasuredSeparation: separation };
});

test('D06', 'Twenty seeded 30-second exchanges avoid NaN, sustained overlap, permanent stagger and duplicates', () => {
  const cases = [];
  for (let seed = 1977; seed < 1997; seed++) {
    const sim = fixture({ partner: true, seed, distance: 2.65 });
    let prng = seed >>> 0;
    let samples = 0;
    let maxOverlap = 0;
    let duplicate = 0;
    let longestStagger = 0;
    const currentStagger = { [A]: 0, [B]: 0 };
    const seen = new Set();
    let lastContactTick = 0;
    for (let tick = 0; tick < 7200; tick++) {
      if (tick % 12 === 0) {
        prng = (Math.imul(prng, 1664525) + 1013904223) >>> 0;
        moveToward(sim, A, B, (prng & 15) > 3 ? 1 : -1);
        if (prng % 7 === 0) request(sim, A, 'light');
        if (prng % 23 === 0) request(sim, A, 'heavy');
        if (prng % 11 === 0) request(sim, A, 'guard', { level: (prng % 5) / 4 });
      }
      sim.step();
      const a = actor(sim, A), b = actor(sim, B);
      for (const fighter of [a, b]) {
        assert([fighter.x, fighter.y, fighter.z, fighter.vx, fighter.vy, fighter.vz, fighter.yaw, fighter.guard, fighter.health].every(Number.isFinite), 'non-finite state for seed ' + seed);
        if (fighter.stagger > 0) currentStagger[fighter.id]++;
        else currentStagger[fighter.id] = 0;
        longestStagger = Math.max(longestStagger, currentStagger[fighter.id]);
      }
      maxOverlap = Math.max(maxOverlap, a.body.radius + b.body.radius - Math.hypot(a.x - b.x, a.y - b.y));
      for (const e of sim.W.events.slice(-12)) {
        if (e.type !== 'hands_contact' || e.tick <= lastContactTick) continue;
        const key = [e.actionId ?? e.action, e.actor, e.target, e.subhit ?? 0].join('/');
        if (seen.has(key)) duplicate++;
        seen.add(key);
        samples++;
      }
      lastContactTick = sim.W.tick;
    }
    for (const id of [A, B]) {
      assert(!actor(sim, id).down, 'sparring fighter knocked down in seed ' + seed);
      assert.equal(actor(sim, id).health, actor(sim, id).body.maxHealth, 'health loss in seed ' + seed);
    }
    sim.setPartner(false);
    accepted(sim, A, 'move', { x: 0, y: 0 });
    step(sim, 500);
    for (const id of [A, B]) {
      const fighter = actor(sim, id);
      assert.equal(fighter.action, null);
      assert.equal(fighter.stagger, 0);
      accepted(sim, id, 'ready', { active: true });
      accepted(sim, id, 'light');
    }
    assert(maxOverlap < 0.015, 'excessive overlap in seed ' + seed + ': ' + maxOverlap);
    assert(longestStagger < 480, 'stagger persisted at least two seconds in seed ' + seed);
    assert.equal(duplicate, 0, 'duplicate contact in seed ' + seed);
    cases.push({ seed, contacts: samples, maxOverlap, longestStagger });
  }
  assert(cases.reduce((sum, item) => sum + item.contacts, 0) > 20, 'stress fixtures barely exchanged contact');
  report.stress = cases;
  return { secondsPerSeed: 30, seeds: cases.map((item) => item.seed), maxOverlap: Math.max(...cases.map((item) => item.maxOverlap)), longestStagger: Math.max(...cases.map((item) => item.longestStagger)) };
});

report.exitCode = report.rows.some((r) => r.status === 'FAIL') ? 1 : 0;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'hands-rules.json'), JSON.stringify(report, null, 2) + '\n');
process.exitCode = report.exitCode;
