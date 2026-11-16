/* Unarmed sparring action mode mounted inside ROOM's 240 Hz actor physics. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./actor-physical.js"));
  } else {
    root.HandsCombat = factory(root.RCActorPhysical);
  }
})(globalThis, function (physical) {
  "use strict";

  const { H, direction, heading } = physical;
  const ticks = ms => Math.round(ms / (1000 * H));
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const opposite = side => side === "left" ? "right" : "left";
  const wrap = angle => ((angle % 360) + 360) % 360;
  const shortest = angle => wrap(angle + 180) - 180;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const directions = ["left", "right"];
  const eventNamespace = "first_encounter.hands";

  const DEFAULT_ACTORS = [
    { id: "blue", name: "Blue", appearance: "blue", x: 0, y: 1.3, z: 0, story: 0, yaw: 0 },
    { id: "red", name: "Red", appearance: "red", x: 0, y: -1.3, z: 0, story: 0, yaw: 180 }
  ];
  const DEFAULT_GEOMETRY = {
    boxes: [{ id: "training-floor", x0: -6, x1: 6, y0: -6, y1: 6, z0: -.12, z1: 0, support: true, kind: "slab" }],
    surfaces: [{ id: "training-floor", x0: -6, x1: 6, y0: -6, y1: 6, z: 0, story: 0, kind: "floor" }]
  };

  const DEFAULT_TUNING = Object.freeze({
    moves: Object.freeze({
      lead_light: Object.freeze({ side: "left", startupMs: 75, activeMs: 25, recoveryMs: 150, pressure: 18, reach: 1.26, push: .62, arc: 7 }),
      rear_light: Object.freeze({ side: "right", startupMs: 100, activeMs: 25, recoveryMs: 175, pressure: 22, reach: 1.31, push: .82, arc: 8 }),
      hook_chop: Object.freeze({ side: "left", startupMs: 175, activeMs: 25, recoveryMs: 300, pressure: 30, reach: 1.24, push: 1.28, arc: 24 }),
      counter_palm: Object.freeze({ side: "right", startupMs: 82, activeMs: 25, recoveryMs: 165, pressure: 25, reach: 1.32, push: .90, arc: 8 }),
      heavy: Object.freeze({ side: "right", startupMs: 275, activeMs: 50, recoveryMs: 375, pressure: 55, reach: 1.44, push: 2.10, arc: 13 })
    }),
    guard: Object.freeze({ maximum: 100, regen: 20, recovery: 60, delayMs: 750, breakMs: 800, graceMs: 300, minimumCover: .40 }),
    timing: Object.freeze({ comboMs: 430, counterMs: 200, parryMs: 100, bufferMs: 150, withdrawalMs: 185, maxReachMs: 420, reactionMs: 240, cueMs: 235 }),
    momentum: Object.freeze({ clean: 4, parry: 10, guardBreak: 12, miss: -6, parried: -8, scale: .0015 })
  });

  function compileTuning(overrides) {
    const tuning = {
      guard: { ...DEFAULT_TUNING.guard, ...overrides.guard },
      timing: { ...DEFAULT_TUNING.timing, ...overrides.timing },
      momentum: { ...DEFAULT_TUNING.momentum, ...overrides.momentum },
      moves: {}
    };
    for (const [name, defaults] of Object.entries(DEFAULT_TUNING.moves)) {
      const def = { ...defaults, ...overrides.moves?.[name] };
      if (!directions.includes(def.side) ||
          ![def.startupMs, def.activeMs, def.recoveryMs, def.pressure, def.reach, def.push, def.arc]
            .every(value => Number.isFinite(value) && value > 0)) {
        throw Error("Invalid hands move tuning: " + name);
      }
      def.startup = Math.max(1, ticks(def.startupMs));
      def.active = Math.max(1, ticks(def.activeMs));
      def.recovery = Math.max(1, ticks(def.recoveryMs));
      tuning.moves[name] = def;
    }
    return tuning;
  }

  function create(options = {}) {
    const actors = options.actors ?? DEFAULT_ACTORS;
    const geometry = options.geometry ?? DEFAULT_GEOMETRY;
    if (actors.length !== 2 || !actors.some(actor => actor.id === (options.controlId ?? actors[0].id))) {
      throw Error("Hands sparring needs two fighters and a valid controlled actor");
    }
    const tuning = compileTuning(options.tuning || {});
    return physical.create({
      actors, geometry, controlId: options.controlId ?? actors[0].id, preset: "hands-first",
      seed: (options.seed ?? 1977) >>> 0, profiles: options.profiles,
      config: options.config,
      handsMode: context => attach(context, options, tuning)
    });
  }

  function attach({ W, initial, floors, get, record, line, request }, options, tuning) {
    const { guard, timing, momentum, moves } = tuning;
    const arenaFloors = new Set(options.arenaFloorIds ?? floors.filter(floor => floor.kind === "floor").map(floor => floor.id));
    let momentumEnabled = options.momentum !== false;
    let partnerEnabled = options.partner !== false;
    let pendingControl = null;
    let randomState = (options.seed ?? 1977) >>> 0;
    const observationHistory = new Map();
    const historyLength = Math.max(2, ticks(timing.reactionMs) + 2);

    W.controlEpoch = 0;
    for (const actor of W.actors) {
      const source = initial.find(item => item.id === actor.id);
      actor.controller = actor.id === W.controlId ? "human" : "sparring";
      actor.capabilities = ["move", "face", "ready", "guard", "light", "heavy", "reach_prepare", "reach_start", "reach_end", "reach_cancel", "input_cancel"];
      actor.guard = actor.guardMax = guard.maximum;
      actor.hands = {
        ready: source.ready === true, readyRevision: 0,
        guardLevel: Number.isFinite(source.guardLevel) ? clamp(source.guardLevel, 0, 1) : .4,
        coverage: { left: 0, right: 0 }, states: { left: "available", right: "available" },
        momentum: 0, queue: null, combo: null, staggerUntil: 0, breakUntil: 0, graceUntil: 0,
        guardRegenTick: 0, reachPrep: false, lastReaction: null, cue: null, decision: "waiting",
        nextDecision: ticks(1100), lastStart: 0
      };
      refreshHands(actor);
    }

    function log(type, data) {
      return record(type, { namespace: eventNamespace, ...data });
    }

    function reject(actor, verb, reason) {
      W.lastRejection = reason;
      return { ok: false, reason, actor: actor.id, verb };
    }

    function available(actor) {
      return !actor.down && !actor.holder && !actor.held && !actor.equipment.weaponId &&
        actor.motion === "supported" && actor.stagger <= 0;
    }

    function refreshHands(actor) {
      const hands = actor.hands;
      const action = actor.action;
      const base = hands.ready && available(actor) && actor.guard > 0 ? hands.guardLevel : 0;
      for (const side of directions) {
        let state = base > 0 ? "guarding" : "available";
        let cover = base;
        if (actor.stagger > 0) state = "recoiling";
        if ((action && action.side === side) || (hands.reachPrep && side === "right" && !action)) {
          state = { preparation: "preparing", active: "active", recovery: "recovering",
            reaching: "reaching", withdrawal: "recovering" }[action?.phase] ?? "preparing";
          cover = 0;
        }
        hands.states[side] = state;
        hands.coverage[side] = cover;
      }
    }

    function start(actor, verb, data) {
      const hands = actor.hands;
      if (!available(actor)) return reject(actor, verb, "actor_not_ready");
      if (!hands.ready) return reject(actor, verb, "fists_lowered");
      if (actor.action) {
        const buffer = Number.isFinite(data.bufferMs) ? clamp(data.bufferMs, 0, 300) : timing.bufferMs;
        if (buffer > 0 && verb === "light" && actor.action.verb !== "reach" && actor.action.phase === "recovery" &&
            actor.action.endTick - W.tick <= ticks(buffer) && !hands.queue) {
          hands.queue = { verb, data: { ...data }, queuedTick: W.tick, expires: W.tick + ticks(buffer) };
          log("hands_buffered", { actor: actor.id, verb, after: actor.action.id, commandId: data.commandId ?? null });
          return { ok: true, queued: true };
        }
        return reject(actor, verb, "committed");
      }

      const opportunity = hands.combo && hands.combo.until >= W.tick ? hands.combo : null;
      hands.combo = null;
      hands.reachPrep = false;
      const move = verb === "light" ? opportunity?.move ?? "lead_light" : verb === "reach_start" ? "reach" : "heavy";
      const def = moves[move];
      const action = {
        id: "hands:" + (++W.actions), verb: move === "reach" ? "reach" : verb, move,
        side: def?.side ?? "right", startTick: W.tick, phaseStart: W.tick,
        endTick: W.tick + (def ? def.startup + def.active + def.recovery : ticks(timing.maxReachMs)),
        phase: def ? "preparation" : "reaching", progress: 0,
        t: 0, duration: def ? (def.startup + def.active + def.recovery) * H : ticks(timing.maxReachMs) * H,
        resolved: false, commandId: data.commandId ?? null,
        begunWith: opportunity?.via ?? null
      };
      actor.action = action;
      hands.cue = null;
      hands.lastStart = W.tick;
      refreshHands(actor);
      log("hands_action", { actor: actor.id, verb: action.verb, action: action.id, move, side: action.side,
        commandId: action.commandId, via: action.begunWith });
      return { ok: true, action: action.id, verb: action.verb, move };
    }

    function withdraw(actor) {
      const action = actor.action;
      if (action?.phase !== "reaching") return;
      action.phase = "withdrawal";
      action.phaseStart = W.tick;
      action.endTick = W.tick + ticks(timing.withdrawalMs);
      action.progress = 0;
      log("hands_withdraw", { actor: actor.id, action: action.id, move: action.move, side: action.side });
    }

    function requestAction(actor, verb, data) {
      const hands = actor.hands;
      if (data.epoch !== undefined && (data.epoch !== W.controlEpoch || actor.id !== W.controlId || pendingControl)) {
        return reject(actor, verb, "input_epoch_expired");
      }
      if (verb === "move") {
        const { x, y } = data;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return reject(actor, verb, "invalid_movement");
        actor.input = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
        return { ok: true };
      }
      if (verb === "face") {
        if (!Number.isFinite(data.yaw)) return reject(actor, verb, "invalid_facing");
        actor.yaw = wrap(data.yaw);
        return { ok: true };
      }
      if (verb === "ready") {
        const ready = typeof data.active === "boolean" ? data.active : !hands.ready;
        if (ready !== hands.ready) hands.readyRevision++;
        hands.ready = ready;
        if (!hands.ready) {
          hands.reachPrep = false;
          hands.queue = null;
          hands.combo = null;
          withdraw(actor);
        }
        refreshHands(actor);
        log("hands_ready", { actor: actor.id, ready: hands.ready });
        return { ok: true };
      }
      if (verb === "guard") {
        const level = Number.isFinite(data.level) ? data.level : hands.guardLevel + data.delta;
        if (!Number.isFinite(level)) return reject(actor, verb, "invalid_guard");
        const next = clamp(level, 0, 1);
        if (next > hands.guardLevel) hands.queue = null;
        if (next !== hands.guardLevel) log("hands_guard", { actor: actor.id, level: next });
        hands.guardLevel = next;
        refreshHands(actor);
        return { ok: true };
      }
      if (verb === "reach_prepare") {
        if (!available(actor) || actor.action) return reject(actor, verb, "hands_unavailable");
        if (!hands.ready) return reject(actor, verb, "fists_lowered");
        hands.reachPrep = true;
        refreshHands(actor);
        return { ok: true };
      }
      if (verb === "reach_end" || verb === "reach_cancel" || verb === "input_cancel") {
        if (verb === "input_cancel") {
          hands.queue = null;
          actor.input = {};
        }
        hands.reachPrep = false;
        withdraw(actor);
        refreshHands(actor);
        return { ok: true };
      }
      if (verb === "light" || verb === "heavy" || verb === "reach_start") return start(actor, verb, data);
      return reject(actor, verb, "capability_unavailable");
    }

    function switchControl(actor) {
      if (actor.id === W.controlId) return { ok: true, unchanged: true };
      pendingControl = actor.id;
      return { ok: true, pending: true };
    }

    function transferControl() {
      if (!pendingControl) return;
      const before = W.controlId;
      W.controlId = pendingControl;
      pendingControl = null;
      W.controlEpoch++;
      observationHistory.clear();
      for (const actor of W.actors) {
        actor.input = {};
        actor.controller = actor.id === W.controlId ? "human" : "sparring";
        const hands = actor.hands;
        hands.queue = null;
        hands.reachPrep = false;
        hands.cue = null;
        hands.nextDecision = W.tick + ticks(timing.reactionMs + 250);
        withdraw(actor);
        refreshHands(actor);
      }
      log("control_changed", { actor: W.controlId, from: before, epoch: W.controlEpoch });
    }

    function recover(actor) {
      const hands = actor.hands;
      actor.stagger = Math.max(0, hands.staggerUntil - W.tick) * H;
      actor.recovery = Math.max(0, actor.recovery - H);
      if (hands.breakUntil && W.tick >= hands.breakUntil) {
        hands.breakUntil = 0;
        actor.guard = guard.recovery;
        hands.guardRegenTick = W.tick + ticks(guard.delayMs);
        hands.graceUntil = W.tick + ticks(guard.graceMs);
        log("hands_guard_recovered", { actor: actor.id, guard: actor.guard });
      }
      if (W.tick >= hands.guardRegenTick && !actor.action && actor.stagger <= 0) {
        actor.guard = Math.min(guard.maximum, actor.guard + guard.regen * H);
      }
      if (hands.combo && W.tick > hands.combo.until) hands.combo = null;
      if (hands.queue && W.tick > hands.queue.expires) hands.queue = null;
    }

    function changeMomentum(actor, change) {
      if (momentumEnabled) actor.hands.momentum = clamp(actor.hands.momentum + change, 0, 100);
    }

    function multiplier(actor) {
      return momentumEnabled ? clamp(1 + momentum.scale * actor.hands.momentum, 1, 1.15) : 1;
    }

    function spendMiss(actor, action) {
      action.resolved = true;
      actor.hands.combo = null;
      changeMomentum(actor, momentum.miss);
      log("hands_miss", { actor: actor.id, action: action.id, move: action.move, side: action.side });
    }

    function updatePhase(actor) {
      const action = actor.action;
      if (!action) return;
      const age = W.tick - action.startTick;
      action.t = age * H;
      if (action.phase === "reaching" && W.tick >= action.endTick) withdraw(actor);
      if (W.tick >= action.endTick) {
        actor.action = null;
        const queue = actor.hands.queue;
        actor.hands.queue = null;
        if (queue && W.tick <= queue.expires) request(actor.id, queue.verb, queue.data);
        return;
      }
      if (action.verb === "reach") {
        const span = action.phase === "reaching" ? ticks(110) : Math.max(1, action.endTick - action.phaseStart);
        action.progress = clamp((W.tick - action.phaseStart) / span, 0, 1);
        return;
      }
      const def = moves[action.move];
      if (action.interruptedTick !== undefined) {
        action.progress = (W.tick - action.interruptedTick) / (action.endTick - action.interruptedTick);
      } else if (age < def.startup) {
        action.phase = "preparation";
        action.progress = age / def.startup;
      } else if (age < def.startup + def.active) {
        action.phase = "active";
        action.progress = (age - def.startup) / def.active;
      } else {
        if (!action.resolved) spendMiss(actor, action);
        action.phase = "recovery";
        action.progress = clamp((age - def.startup - def.active) / def.recovery, 0, 1);
      }
    }

    function point(actor, forward, lateral, height, yaw = actor.yaw) {
      const f = direction(yaw);
      return { x: actor.x + f.x * forward - f.y * lateral,
        y: actor.y + f.y * forward + f.x * lateral, z: actor.z + actor.body.height * height };
    }

    function proxy(actor, interception = false) {
      const action = actor?.action;
      const def = moves[action?.move];
      if (!def) return null;
      const sign = action.side === "left" ? -1 : 1;
      const shoulder = sign * actor.body.radius * .68;
      const arcOffset = sign * Math.sin(def.arc * Math.PI / 180) * (1 - action.progress);
      const height = action.move === "hook_chop" ? .75 : .72;
      if (interception) {
        return { from: point(actor, .42, shoulder * .9, .72),
          to: point(actor, .91, -shoulder * .24, .72), radius: .19, side: action.side, phase: action.phase };
      }
      return { from: point(actor, .13, shoulder, height),
        to: point(actor, def.reach, arcOffset, height), radius: .10, side: action.side, phase: action.phase };
    }

    function nearest(path, target) {
      const dx = path.to.x - path.from.x;
      const dy = path.to.y - path.from.y;
      const k = clamp(((target.x - path.from.x) * dx + (target.y - path.from.y) * dy) / (dx * dx + dy * dy), 0, 1);
      return { x: path.from.x + dx * k, y: path.from.y + dy * k, z: path.from.z + (path.to.z - path.from.z) * k };
    }

    function segmentGap(a, b) {
      const u = { x: a.to.x - a.from.x, y: a.to.y - a.from.y };
      const v = { x: b.to.x - b.from.x, y: b.to.y - b.from.y };
      const det = u.x * v.y - u.y * v.x;
      if (Math.abs(det) > 1e-7) {
        const w = { x: b.from.x - a.from.x, y: b.from.y - a.from.y };
        const t = (w.x * v.y - w.y * v.x) / det;
        const s = (w.x * u.y - w.y * u.x) / det;
        if (t >= 0 && t <= 1 && s >= 0 && s <= 1) return 0;
      }
      return Math.min(...[a.from, a.to].map(p => distance(p, nearest(b, p))),
        ...[b.from, b.to].map(p => distance(p, nearest(a, p))));
    }

    function faces(actor, target, tolerance) {
      return Math.abs(shortest(heading(actor, target) - actor.yaw)) <= tolerance;
    }

    function canIntercept(target, attacker, incoming) {
      const light = target.action;
      if (!available(target) || light?.verb !== "light" || light.resolved ||
          light.phase === "recovery" || W.tick - light.startTick >= ticks(timing.parryMs) ||
          !faces(target, attacker, 55)) return false;
      const blocking = proxy(target, true);
      return Math.abs(blocking.from.z - incoming.from.z) <= .24 &&
        segmentGap(blocking, incoming) <= blocking.radius + incoming.radius &&
        !line(blocking.from, blocking.to, [target.support, attacker.support]);
    }

    function coverage(target, actor) {
      const angle = shortest(heading(target, actor) - target.yaw);
      const hands = target.hands.coverage;
      if (Math.abs(angle) <= 13) return Math.max(hands.left, hands.right);
      const side = angle < 0 ? "left" : "right";
      const primary = hands[side];
      return Math.abs(angle) <= 22 + 53 * primary ? primary : 0;
    }

    function candidate(actor, target) {
      const action = actor.action;
      if (action?.phase !== "active" || action.resolved || !available(actor) ||
          target.down || target.outOfTile || target.holder || !faces(actor, target, 55)) return null;
      const path = proxy(actor);
      const contact = nearest(path, target);
      const coveredHeight = contact.z >= target.z + target.body.height * .45 &&
        contact.z <= target.z + target.body.height * .96;
      if (!coveredHeight || distance(target, contact) > target.body.radius + path.radius ||
          line(path.from, contact, [actor.support, target.support])) return null;
      return { actor, target, action, contact, parry: canIntercept(target, actor, path),
        blocked: coverage(target, actor) >= guard.minimumCover, guardBefore: target.guard,
        protectedOpening: target.stagger > 0 || target.hands.graceUntil > W.tick,
        force: multiplier(actor) };
    }

    function cancelAction(actor, recoveryMs) {
      const action = actor.action;
      actor.hands.queue = null;
      actor.hands.reachPrep = false;
      actor.hands.cue = null;
      if (!action) return;
      if (action.verb === "reach") {
        withdraw(actor);
        return;
      }
      action.resolved = true;
      action.phase = "recovery";
      action.progress = 0;
      const def = moves[action.move];
      const recovery = Math.max(def.recovery, ticks(recoveryMs));
      action.interruptedTick = W.tick;
      action.endTick = W.tick + recovery;
    }

    function stagger(actor, durationMs) {
      actor.hands.staggerUntil = W.tick + ticks(durationMs);
      actor.stagger = ticks(durationMs) * H;
    }

    function addCombo(actor, move, via) {
      const next = via === "parry" ? "counter_palm" : { lead_light: "rear_light", rear_light: "hook_chop", counter_palm: "rear_light" }[move];
      if (next) {
        actor.hands.combo = { move: next, via, until: (actor.action?.endTick ?? W.tick) +
          ticks(via === "parry" ? timing.counterMs : timing.comboMs) };
      }
    }

    function contactLog(hit, outcome, extra = {}) {
      const { actor, target, action, contact, guardBefore } = hit;
      return log("hands_contact", { actor: actor.id, target: target.id, action: action.id,
        move: action.move, side: action.side, subhit: 0, contact, outcome, guardBefore,
        guardAfter: target.guard, ...extra });
    }

    function reaction(actor, outcome, source, side) {
      actor.hands.lastReaction = { outcome, source, side, tick: W.tick };
    }

    function resolveInterception(hit, clash) {
      const { actor, target, action } = hit;
      cancelAction(actor, 180);
      cancelAction(target, 105);
      const outcome = clash ? "clash" : "parry";
      if (!clash) {
        actor.hands.combo = null;
        changeMomentum(actor, momentum.parried);
        changeMomentum(target, momentum.parry);
        addCombo(target, target.action?.move, "parry");
      }
      reaction(actor, clash ? "clash" : "parried", target.id, action.side);
      reaction(target, outcome, actor.id, target.action?.side);
      contactLog(hit, outcome, { defenderAction: target.action?.id ?? null });
    }

    function resolveContact(hit, trade) {
      const { actor, target, action, blocked, guardBefore, protectedOpening, force } = hit;
      const def = moves[action.move];
      action.resolved = true;
      const pressure = def.pressure * force * (blocked ? 1 : .68);
      if (!protectedOpening) target.guard = Math.max(0, guardBefore - pressure);
      target.hands.guardRegenTick = W.tick + ticks(guard.delayMs);
      const broke = !protectedOpening && target.guard <= 0;
      const outcome = broke ? "guard_break" : blocked ? "guard" : "hit";
      if (broke) {
        target.hands.breakUntil = W.tick + ticks(guard.breakMs);
        stagger(target, guard.breakMs);
        cancelAction(target, 0);
      } else if (!protectedOpening && !blocked) {
        stagger(target, action.verb === "heavy" ? 255 : 105);
        if (!trade) cancelAction(target, 0);
      }
      if (!protectedOpening) {
        if (broke) changeMomentum(actor, momentum.guardBreak);
        else if (!blocked) changeMomentum(actor, momentum.clean);
        addCombo(actor, action.move, outcome);
      }

      // Shove the same feet-rooted actor that ROOM moves and collides on the next tick.
      const d = direction(heading(actor, target));
      const shove = def.push * force * (protectedOpening ? .22 : broke ? .90 : blocked ? .36 : 1) *
        clamp(actor.body.mass / target.body.mass, .65, 1.35);
      target.vx += d.x * shove;
      target.vy += d.y * shove;
      target.cause = action.id;
      reaction(target, outcome, actor.id, action.side);
      contactLog(hit, outcome, { trade, shove, pressure: guardBefore - target.guard, momentumMultiplier: force });
    }

    function observe(observerId, targetId) {
      const observer = get(observerId);
      const target = get(targetId);
      if (!observer || !target || target === observer) return null;
      const a = point(observer, 0, 0, .84);
      const b = point(target, 0, 0, .75);
      if (line(a, b, [observer.support, target.support])) return null;
      const action = target.action;
      return {
        tick: W.tick, id: target.id, x: target.x, y: target.y, yaw: target.yaw,
        ready: target.hands.ready, distance: distance(observer, target), staggered: target.stagger > 0,
        pose: action ? { verb: action.verb, move: action.move, phase: action.phase } : null,
        cue: target.hands.cue?.kind ?? null,
        lastReaction: target.hands.lastReaction ? { ...target.hands.lastReaction } : null
      };
    }

    function nextRandom() {
      randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
      return randomState / 4294967296;
    }

    function train(actor) {
      if (!partnerEnabled || actor.controller !== "sparring" || actor.testMode === "idle") return;
      const target = get(W.controlId);
      const hands = actor.hands;
      const current = observe(actor.id, target.id);
      const delayedTick = W.tick - ticks(timing.reactionMs);
      observationHistory.set(W.tick, current);
      observationHistory.delete(W.tick - historyLength);
      const observed = observationHistory.get(delayedTick);
      if (!observed || !available(actor)) {
        request(actor.id, "move", { x: 0, y: 0 });
        hands.decision = "waiting";
        return;
      }
      const range = distance(actor, observed);
      const angle = heading(actor, observed);
      request(actor.id, "face", { yaw: actor.yaw + clamp(shortest(angle - actor.yaw), -250 * H, 250 * H) });
      const engaged = range < 3.15;
      if (engaged && !hands.ready) request(actor.id, "ready", { active: true });
      if (!engaged && hands.ready && !actor.action && range > 4.4) request(actor.id, "ready", { active: false });
      if (engaged && hands.guardLevel !== .64) request(actor.id, "guard", { level: .64 });

      const face = direction(angle);
      let forward = engaged && range > 1.34 ? .44 : engaged && range < .93 ? -.32 : 0;
      if (hands.cue || actor.action) forward *= .40;
      request(actor.id, "move", { x: face.x * forward, y: face.y * forward });
      hands.decision = forward > 0 ? "closing distance" : forward < 0 ? "making space" : "holding guard";

      if (actor.action || !engaged || !hands.ready) return;
      if (hands.cue) {
        hands.decision = "showing the opening";
        if (W.tick < hands.cue.until) return;
        hands.cue = null;
        if (range < 1.64) request(actor.id, "heavy");
        hands.nextDecision = W.tick + ticks(1450 + 650 * nextRandom());
        return;
      }
      if (W.tick < hands.nextDecision || range > 1.50 || observed.staggered || !faces(actor, observed, 35)) return;
      if (observed.pose?.phase === "recovery" && observed.pose.verb === "heavy") {
        hands.decision = "answering visible recovery";
        request(actor.id, "light");
        hands.nextDecision = W.tick + ticks(1200);
      } else if (!observed.pose && observed.ready) {
        hands.cue = { kind: "opening", until: W.tick + ticks(timing.cueMs) };
        hands.decision = "showing the opening";
        log("hands_cue", { actor: actor.id, cue: "opening", until: hands.cue.until });
      }
    }

    function beforeMovement(actors) {
      transferControl();
      for (const actor of actors) {
        recover(actor);
        updatePhase(actor);
        refreshHands(actor);
        train(actor);
      }
    }

    function afterMovement(actors) {
      const [first, second] = actors;
      const hits = [candidate(first, second), candidate(second, first)].filter(Boolean);
      const parry = hits.find(hit => hit.parry);
      if (parry) {
        resolveInterception(parry, hits.length === 2 && hits.every(hit => hit.parry));
      } else {
        // Every candidate and its coverage were captured before any strike mutated the two fighters.
        for (const hit of hits) resolveContact(hit, hits.length === 2);
      }
      for (const actor of actors) refreshHands(actor);
    }

    function movementScale(actor) {
      if (actor.action?.phase === "active") return .55;
      if (actor.action) return .76;
      return actor.hands.ready ? 1 - actor.hands.guardLevel * .20 : 1;
    }

    return {
      request: requestAction, switchControl, beforeMovement, afterMovement, movementScale, arenaFloors,
      snapshot: () => ({ controlEpoch: W.controlEpoch, momentumEnabled, partnerEnabled }),
      publicAPI: {
        proxy: id => proxy(get(id)),
        observe, tuning, multiplier: id => get(id) ? multiplier(get(id)) : 1,
        setMomentum: enabled => { momentumEnabled = !!enabled; },
        setPartner: enabled => {
          partnerEnabled = !!enabled;
          observationHistory.clear();
          for (const actor of W.actors) if (actor.controller === "sparring") {
            actor.input = {};
            actor.hands.cue = null;
            actor.hands.nextDecision = W.tick + ticks(timing.reactionMs + 250);
          }
        }
      }
    };
  }

  return { create, DEFAULT_TUNING, H };
});
