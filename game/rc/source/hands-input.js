/* Replaceable human adapter. Physical controls end here; the resolver sees semantic intents. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./hands-combat.js"));
  } else {
    root.HandsInput = factory(root.HandsCombat);
  }
})(globalThis, function (combat) {
  "use strict";

  const SCHEMA = "first-encounter-controls@0.1";
  const { H } = combat;
  const MOVEMENT = ["move_forward", "move_back", "move_left", "move_right"];
  const WHEELS = ["WheelUp", "WheelDown"];
  const RESERVED = Object.freeze({ KeyQ: "Quick messages are reserved for later.", KeyF: "Kicks are reserved for later.",
    Space: "Jump is reserved for later." });
  const BINDING_LABELS = Object.freeze({
    move_forward: "Walk forward", move_back: "Walk back", move_left: "Strafe left", move_right: "Strafe right",
    readiness_toggle: "Raise or lower fists", light: "Light strike / interception", heavy_or_reach: "Heavy on tap / reach on hold",
    guard_raise: "Tighten guard", guard_lower: "Loosen guard", dev_swap: "Switch controlled fighter"
  });
  const DEFAULT_PROFILE = Object.freeze({
    schema: SCHEMA, name: "Teddy Sketch A", lookSensitivity: .19,
    bindings: Object.freeze({
      move_forward: "KeyW", move_back: "KeyS", move_left: "KeyA", move_right: "KeyD",
      readiness_toggle: "KeyR", light: "Mouse0", heavy_or_reach: "Mouse2",
      guard_raise: "WheelUp", guard_lower: "WheelDown", dev_swap: "Tab"
    }),
    thresholds: Object.freeze({ right_tap_max_ms: 150, input_buffer_ms: 150, guard_steps: 5 })
  });

  function validate(raw) {
    if (!raw || typeof raw !== "object" || ![SCHEMA, "first-encounter-controls-sketch@0.1"].includes(raw.schema)) {
      throw Error("This file is not a First Encounter control profile.");
    }
    const bindings = {};
    const bound = new Map();
    for (const [id, label] of Object.entries(BINDING_LABELS)) {
      const supplied = raw.bindings?.[id];
      const code = typeof supplied === "string" ? supplied.trim().replace(/^(Mouse[0-4])(?:Down|Sequence)$/, "$1") : "";
      if (!/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(Up|Down|Left|Right)|Mouse[0-4]|Wheel(Up|Down)|Tab|Enter|Backspace|Bracket(Left|Right)|Comma|Period|Slash|Backslash|Semicolon|Quote|Minus|Equal)$/.test(code)) {
        throw Error(label + " needs a supported keyboard, mouse, or wheel binding.");
      }
      if (RESERVED[code]) throw Error(code + " is reserved by the sketch.");
      if (WHEELS.includes(code) && (MOVEMENT.includes(id) || id === "heavy_or_reach" || id === "dev_swap")) {
        throw Error(label + " needs a key or mouse button.");
      }
      if (bound.has(code)) throw Error(code + " is already used for " + BINDING_LABELS[bound.get(code)] + ".");
      bound.set(code, id);
      bindings[id] = code;
    }

    function readNumber(value, name, low, high, integer = false) {
      if (!Number.isFinite(value) || value < low || value > high || (integer && !Number.isInteger(value))) {
        throw Error(name + " must be between " + low + " and " + high + ".");
      }
      return value;
    }

    return {
      schema: SCHEMA, name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 64) : DEFAULT_PROFILE.name,
      bindings,
      thresholds: {
        right_tap_max_ms: readNumber(raw.thresholds?.right_tap_max_ms, "Tap threshold (ms)", 50, 500),
        input_buffer_ms: readNumber(raw.thresholds?.input_buffer_ms, "Queue window (ms)", 0, 300),
        guard_steps: readNumber(raw.thresholds?.guard_steps, "Guard steps", 2, 12, true)
      },
      lookSensitivity: readNumber(raw.lookSensitivity ?? DEFAULT_PROFILE.lookSensitivity, "Look sensitivity", .04, 1.25)
    };
  }

  function create(sim, initialProfile = DEFAULT_PROFILE) {
    let profile = validate(initialProfile);
    let bindingFor = indexBindings();
    let epoch = sim.W.controlEpoch;
    let blocked = false;
    let held = new Map();
    let gesture = null;
    let serial = 0;
    let lastResult = null;

    function indexBindings() {
      return new Map(Object.entries(profile.bindings).map(([intent, code]) => [code, intent]));
    }

    function synchronize() {
      if (sim.W.controlEpoch !== epoch) {
        epoch = sim.W.controlEpoch;
        held.clear();
        gesture = null;
        blocked = false;
      }
    }

    function current() {
      return sim.get(sim.W.controlId);
    }

    function send(verb, data = {}) {
      return sim.request(sim.W.controlId, verb, { epoch, ...data });
    }

    function discrete(result, extra = {}) {
      lastResult = { handled: true, ...result, ...extra };
      return lastResult;
    }

    function clear() {
      synchronize();
      held.clear();
      gesture = null;
      if (!blocked) send("input_cancel");
    }

    function cancelGesture() {
      if (!gesture || gesture.phase === "cancelled") return;
      gesture.phase = "cancelled";
      send("reach_cancel");
    }

    function swap(id) {
      synchronize();
      if (blocked) return { ok: false, reason: "swap_pending" };
      const to = id ?? sim.W.actors.find(actor => actor.id !== sim.W.controlId)?.id;
      if (to === sim.W.controlId) return { ok: true, unchanged: true };
      clear();
      const result = sim.switchControl(to);
      blocked = !!result.pending;
      return result;
    }

    function context(actor) {
      return JSON.stringify([actor.hands.readyRevision, actor.equipment?.weaponId, actor.holder, actor.held]);
    }

    function gestureValid() {
      const actor = current();
      return actor.hands.ready && actor.stagger <= 0 && gesture.context === context(actor);
    }

    function updateGesture() {
      if (!gesture || gesture.phase !== "tap-candidate") return;
      if (!gestureValid()) {
        cancelGesture();
        return;
      }
      const threshold = Math.ceil(profile.thresholds.right_tap_max_ms / (H * 1000) - 1e-9);
      if (sim.W.tick - gesture.tick < threshold) return;
      gesture.phase = "reach-committed";
      discrete(send("reach_start", { commandId: gesture.token }), { phase: gesture.phase });
    }

    function followIntent(intent, token, weight = 1) {
      if (intent === "readiness_toggle") {
        cancelGesture();
        return send("ready");
      }
      if (intent === "light") {
        cancelGesture();
        return send("light", { commandId: token, bufferMs: profile.thresholds.input_buffer_ms });
      }
      if (intent === "guard_raise" || intent === "guard_lower") {
        const delta = (intent === "guard_raise" ? weight : -weight) / profile.thresholds.guard_steps;
        return send("guard", { delta });
      }
      if (intent === "dev_swap") return swap();
      return { ok: true };
    }

    function down(code) {
      synchronize();
      const intent = bindingFor.get(code);
      if (!intent) return RESERVED[code] ? discrete({ ok: true, hint: RESERVED[code] }) : { handled: false };
      if (blocked) return discrete({ ok: false, reason: "swap_pending" });
      if (held.has(code)) return { handled: true, repeated: true, token: held.get(code) };
      const token = "input:" + epoch + ":" + (++serial);
      held.set(code, token);
      if (intent !== "heavy_or_reach") return discrete(followIntent(intent, token), { token });

      const result = send("reach_prepare", { commandId: token });
      gesture = { code, token, tick: sim.W.tick, context: context(current()),
        phase: result.ok ? "tap-candidate" : "cancelled" };
      return discrete(result, { phase: gesture.phase, token });
    }

    function up(code, token) {
      synchronize();
      const press = held.get(code);
      if (!press || (token !== undefined && token !== press)) return { handled: bindingFor.has(code), stale: true };
      held.delete(code);
      if (blocked || gesture?.token !== press) return { handled: true };
      updateGesture();
      const { phase } = gesture;
      gesture = null;
      if (phase === "tap-candidate") {
        const result = send("heavy", { commandId: press });
        if (!result.ok) send("reach_cancel");
        return discrete(result, { phase: "consumed", token: press });
      }
      if (phase === "reach-committed") return discrete(send("reach_end"), { phase: "consumed", token: press });
      return { handled: true, phase: "cancelled", token: press };
    }

    function wheel(deltaY, deltaMode = 0) {
      synchronize();
      if (!Number.isFinite(deltaY) || deltaY === 0) return { handled: false };
      const intent = bindingFor.get(deltaY < 0 ? "WheelUp" : "WheelDown");
      if (!intent) return { handled: false };
      if (blocked) return { handled: true, reason: "swap_pending" };
      const pixels = Math.abs(deltaY) * (deltaMode === 1 ? 16 : deltaMode === 2 ? 800 : 1);
      const steps = Math.max(1, Math.min(3, Math.round(pixels / 100)));
      return discrete(followIntent(intent, "input:" + epoch + ":" + (++serial), steps));
    }

    function look(dx) {
      synchronize();
      if (blocked || !Number.isFinite(dx) || !dx) return { handled: false };
      return { handled: true, ...send("face", { yaw: current().yaw + dx * profile.lookSensitivity }) };
    }

    function sample() {
      synchronize();
      if (blocked) return;
      updateGesture();
      const downFor = intent => Number(held.has(profile.bindings[intent]));
      const forward = downFor("move_forward") - downFor("move_back");
      const lateral = downFor("move_right") - downFor("move_left");
      const yaw = current().yaw * Math.PI / 180;
      send("move", { x: forward * Math.sin(yaw) + lateral * Math.cos(yaw),
        y: -forward * Math.cos(yaw) + lateral * Math.sin(yaw) });
    }

    function setProfile(raw) {
      const next = validate(raw);
      clear();
      profile = next;
      bindingFor = indexBindings();
      return validate(profile);
    }

    return {
      down, up, wheel, look, sample, clear, swap, setProfile,
      owns: code => bindingFor.has(code) || Object.hasOwn(RESERVED, code),
      get profile() { return validate(profile); },
      get lastResult() { return lastResult; },
      get gesture() { return gesture ? { ...gesture } : null; }
    };
  }

  return { create, DEFAULT_PROFILE, BINDING_LABELS, validate };
});
