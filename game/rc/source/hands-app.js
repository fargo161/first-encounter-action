(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const boot = JSON.parse(byId("hands-data").textContent);
  const canvas = byId("arena");
  const dialog = byId("feel-dialog");
  const renderer = HandsView.create(canvas, boot.images, boot.art);
  const room = RCCore.validateBundle(boot.scene).project;
  const geometry = RCActorPhysical.roomGeometry(room, RCCore);
  const clockStep = 1 / 240;
  const storageKey = "firstEncounter.hands.profile.v1";
  const thresholdNames = ["right_tap_max_ms", "input_buffer_ms", "guard_steps"];
  const bindingNames = {
    move_forward: "Step forward", move_back: "Step back",
    move_left: "Step left", move_right: "Step right",
    readiness_toggle: "Raise / lower hands", light: "Light / intercept",
    heavy_or_reach: "Heavy tap / reach hold", guard_raise: "Tighten guard",
    guard_lower: "Loosen guard", dev_swap: "Switch fighter",
  };

  let sim;
  let input;
  let started = false;
  let paused = false;
  let captured = false;
  let captureStatus = "fallback";
  let ignoreUnlock = false;
  let view = "first";
  let pitch = 0;
  let debug = false;
  let poseStep = null;
  let accumulator = 0;
  let previousFrame = 0;
  let lastControlId;
  let lookReady = false;
  let lastEvent;
  let lastCallout = "";
  let calloutUntil = 0;
  const frameTimes = [];

  let audioContext;
  let noiseBuffer;
  let muted = false;
  const voices = {
    hit:       {hz: 115, end: 42, len: .105, tone: .16, noise: .10, filter: 520},
    guard:     {hz: 188, end: 105, len: .065, tone: .10, noise: .19, filter: 1150},
    parry:     {hz: 615, end: 192, len: .13, tone: .12, noise: .18, filter: 1820},
    guard_break: {hz: 145, end: 35, len: .24, tone: .20, noise: .24, filter: 650},
    clash:     {hz: 338, end: 75, len: .14, tone: .14, noise: .23, filter: 1200},
    miss:      {hz: 95, end: 46, len: .095, tone: .025, noise: .09, filter: 450},
  };

  function unlockSound() {
    if (muted) return;
    try {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext = new Audio();
        noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate / 3, audioContext.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
      }
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    } catch {
      audioContext = undefined;
    }
  }

  function sound(cue) {
    const voice = voices[cue];
    if (muted || !voice || audioContext?.state !== "running") return;
    const time = audioContext.currentTime;
    const stop = time + voice.len;
    const oscillator = audioContext.createOscillator();
    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const toneGain = envelope(voice.tone, time, stop);
    const noiseGain = envelope(voice.noise, time, stop);
    oscillator.type = cue === "parry" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(voice.hz, time);
    oscillator.frequency.exponentialRampToValueAtTime(voice.end, stop);
    filter.type = "lowpass";
    filter.frequency.value = voice.filter;
    noise.buffer = noiseBuffer;
    oscillator.connect(toneGain).connect(audioContext.destination);
    noise.connect(filter).connect(noiseGain).connect(audioContext.destination);
    oscillator.start(time);
    noise.start(time);
    oscillator.stop(stop);
    noise.stop(stop);
  }

  function envelope(amount, time, stop) {
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(.001, time);
    gain.gain.exponentialRampToValueAtTime(amount, time + .008);
    gain.gain.exponentialRampToValueAtTime(.001, stop);
    return gain;
  }

  function loadProfile() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return HandsInput.validate(JSON.parse(saved));
    } catch {
      // Restricted file contexts still support an in-session profile.
    }
    return HandsInput.DEFAULT_PROFILE;
  }

  function newExchange(profile) {
    input?.clear();
    sim = HandsCombat.create({
      ...boot.scene.sparring,
      geometry,
      momentum: byId("momentum").checked,
      partner: !byId("practice").checked,
    });
    input = HandsInput.create(sim, profile);
    lastEvent = undefined;
    lastCallout = "";
    calloutUntil = 0;
    accumulator = 0;
    poseStep = null;
    pitch = 0;
  }

  function captureLabel(state, message) {
    captureStatus = state;
    byId("capture-status").textContent = message;
    byId("capture").textContent = state === "captured" ? "Release mouse" : "Capture mouse";
  }

  function releaseCapture() {
    if (document.pointerLockElement === canvas) {
      ignoreUnlock = true;
      document.exitPointerLock();
    }
  }

  function captureFailure() {
    if (captured || captureStatus === "fallback") return;
    input.clear();
    captureLabel("denied", "Capture unavailable. Move the mouse inside the arena or try again.");
    if (active()) canvas.focus({preventScroll: true});
  }

  function active() {
    return started && !paused && !dialog.open;
  }

  function setPaused(value) {
    paused = value;
    accumulator = 0;
    input.clear();
    if (value) releaseCapture();
    byId("pause-screen").hidden = !started || !value || dialog.open;
  }

  function resume() {
    setPaused(false);
    lookReady = false;
    unlockSound();
    canvas.focus({preventScroll: true});
  }

  function launch() {
    started = true;
    byId("start-screen").hidden = true;
    byId("capture").disabled = false;
    byId("switch").disabled = false;
    resume();
  }

  function readableBind(code) {
    return {
      Mouse0: "LMB", Mouse1: "MMB", Mouse2: "RMB", Mouse3: "Mouse 4", Mouse4: "Mouse 5",
      WheelUp: "Wheel ↑", WheelDown: "Wheel ↓",
    }[code] ?? code.replace(/^(Key|Digit)/, "");
  }

  function updateQuickControls() {
    const bindings = input.profile.bindings;
    const groups = [
      [["move_forward", "move_left", "move_back", "move_right"], "Move"],
      [["readiness_toggle"], "Hands up / down"],
      [["light"], "Light / intercept"],
      [["heavy_or_reach"], "Tap heavy · hold reach"],
      [["guard_raise", "guard_lower"], "Guard"],
    ];
    byId("quick-controls").replaceChildren(...groups.map(([keys, hint]) => {
      const item = document.createElement("span");
      const key = document.createElement("kbd");
      const raw = keys.map(name => bindings[name]);
      key.textContent = raw.join(",") === "WheelUp,WheelDown" ? "Wheel" : raw.map(readableBind).join(" ");
      item.append(key, " ", hint);
      return item;
    }));
    byId("switch").title = `Switch fighters without resetting (${readableBind(bindings.dev_swap)})`;
  }

  function fillFields() {
    const profile = input.profile;
    for (const field of dialog.querySelectorAll("[data-bind]")) field.value = profile.bindings[field.name];
    for (const name of thresholdNames) byId(name).value = profile.thresholds[name];
    byId("lookSensitivity").value = profile.lookSensitivity;
  }

  function profileStatus(message) {
    byId("profile-status").value = message;
  }

  function applyProfile(profile) {
    try {
      input.setProfile(profile);
      updateQuickControls();
      fillFields();
      try { localStorage.setItem(storageKey, JSON.stringify(input.profile)); } catch {}
      profileStatus("Profile applied.");
    } catch (error) {
      profileStatus(error.message);
    }
  }

  function formProfile() {
    const form = structuredClone(input.profile);
    for (const field of dialog.querySelectorAll("[data-bind]")) form.bindings[field.name] = field.value.trim();
    for (const name of thresholdNames) form.thresholds[name] = byId(name).valueAsNumber;
    form.lookSensitivity = byId("lookSensitivity").valueAsNumber;
    return form;
  }

  function openControls() {
    dialog.showModal();
    if (started) setPaused(true);
    fillFields();
    profileStatus("");
  }

  function showResult(message, duration = .88) {
    lastCallout = message;
    calloutUntil = sim.W.tick + Math.round(duration / clockStep);
  }

  function collectEvents(events) {
    const labels = {
      hit: "Clean contact", guard: "Caught on guard", parry: "Intercepted",
      guard_break: "Guard broken", clash: "Clash", miss: "Out of reach",
    };
    const start = lastEvent ? events.indexOf(lastEvent) + 1 : 0;
    for (let index = start; index < events.length; index++) {
      const event = events[index];
      if (event.type === "hands_contact" || event.type === "hands_miss") {
        const outcome = event.outcome ?? "miss";
        showResult(labels[outcome] ?? "");
        sound(outcome);
      }
    }
    if (events.length) lastEvent = events.at(-1);
  }

  function showFighter(slot, fighter) {
    const hands = fighter.hands ?? {};
    byId(`${slot}-name`).textContent = fighter.name || fighter.id;
    byId(`${slot}-guard`).style.width = `${Math.max(0, fighter.guard ?? 100)}%`;
    const act = fighter.action;
    const phase = {preparation: "Preparing", active: "Striking", recovery: "Recovering", reaching: "Reaching", withdrawal: "Withdrawing"};
    const state = fighter.stagger > 0 ? "Staggered" : phase[act?.phase];
    byId(`${slot}-state`).textContent = state ?? (hands.ready
      ? `Hands up · guard ${Math.round((hands.guardLevel ?? 0) * 100)}%`
      : "Hands down");
    byId(`${slot}-momentum`).textContent = byId("momentum").checked
      ? `Momentum ${Math.round(hands.momentum ?? 0)}` : "";
  }

  function describeFighter(fighter) {
    const hands = fighter.hands ?? {};
    const action = fighter.action;
    const queue = hands.queue;
    const coverage = hands.coverage ?? {};
    const percent = value => Math.round((value || 0) * 100);
    return [
      `${fighter.name || fighter.id}  ·  ${fighter.controller ?? fighter.driver ?? ""}`,
      `  ${action ? `${action.move} / ${action.phase} #${action.id}` : "neutral"}`,
      `  Coverage ${percent(coverage.left)}% L / ${percent(coverage.right)}% R`,
      `  Hands ${hands.states?.left ?? "available"} L / ${hands.states?.right ?? "available"} R`,
      `  Queue ${queue ? `${queue.verb ?? queue.intent ?? "next"} · ${Math.max(0, sim.W.tick - (queue.queuedTick ?? sim.W.tick))} ticks old` : "empty"}`,
      `  ${hands.decision && fighter.controller === "sparring" ? "Partner: " + hands.decision : "Pressure ×" + sim.multiplier(fighter.id).toFixed(3)}`,
      `  Velocity ${Math.hypot(fighter.vx ?? 0, fighter.vy ?? 0).toFixed(2)} m/s`,
    ].join("\n");
  }

  function animate(time) {
    const delta = previousFrame ? time - previousFrame : 0;
    previousFrame = time;
    if (active()) {
      if (delta > 0) {
        frameTimes.push(delta);
        if (frameTimes.length > 600) frameTimes.shift();
      }
      accumulator += Math.min(delta / 1000, .10);
      while (accumulator + 1e-10 >= clockStep) {
        input.sample();
        sim.step();
        accumulator -= clockStep;
      }
    }
    const state = sim.snapshot();
    const events = sim.W.events;
    const current = state.actors.find(actor => actor.id === state.controlId);
    const other = state.actors.find(actor => actor.id !== state.controlId);
    if (state.controlId !== lastControlId) {
      pitch = 0;
      lastControlId = state.controlId;
    }
    renderer.draw(state, {
      events, proxies: state.actors.map(actor => sim.proxy(actor.id)),
      pitch, view, orbit: Number(byId("orbit").value), subjectId: state.controlId,
      room: room.rooms[0], poseStep, debug, effects: byId("effects").checked, hold: byId("hold").checked,
    });
    collectEvents(events);
    showFighter("home", current);
    showFighter("away", other);
    const seconds = Math.floor(sim.W.tick * clockStep);
    const pad = value => String(value).padStart(2, "0");
    byId("clock").textContent = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
    const callout = active() && sim.W.tick < calloutUntil ? lastCallout : "";
    if (byId("callout").textContent !== callout) byId("callout").textContent = callout;
    if (debug) {
      const diag = [
        `Tick ${sim.W.tick}   ·   Controller epoch ${state.controlEpoch}`,
        describeFighter(current), describeFighter(other),
        `Last contact  ${lastCallout || "—"}`,
        poseStep === null ? "Live hand poses" : `Hand pose ${poseStep + 1}`,
      ];
      byId("diagnostics").textContent = diag.join("\n");
    }
    requestAnimationFrame(animate);
  }

  // Only the focused arena owns gameplay input. The browser and modal retain
  // their normal keyboard and pointer behaviors outside that surface.
  const ownsKeyboard = () => active() &&
    (captured || document.activeElement === canvas || document.activeElement === document.body);

  window.addEventListener("keydown", event => {
    if (!ownsKeyboard()) return;
    if (event.code === "Escape") {
      event.preventDefault();
      setPaused(true);
      byId("resume").focus();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (input.owns(event.code)) {
      event.preventDefault();
      if (!event.repeat) {
        const result = input.down(event.code);
        if (event.code === "KeyQ" && result.hint) showResult("Messages later", .75);
      }
    }
  });

  window.addEventListener("keyup", event => {
    if (!active() || !input.owns(event.code)) return;
    if (ownsKeyboard()) event.preventDefault();
    input.up(event.code);
  });

  canvas.addEventListener("mousedown", event => {
    if (!active()) return;
    canvas.focus({preventScroll: true});
    const code = `Mouse${event.button}`;
    if (input.owns(code)) {
      event.preventDefault();
      input.down(code);
    }
  });

  window.addEventListener("mouseup", event => {
    if (!active()) return;
    const code = `Mouse${event.button}`;
    if (!input.owns(code)) return;
    if (event.target !== canvas && !captured) {
      input.clear();
      return;
    }
    event.preventDefault();
    input.up(code);
  });

  canvas.addEventListener("mousemove", event => {
    if (!active() || view === "external" || !Number.isFinite(event.movementX)) return;
    if (!captured && !lookReady) {
      lookReady = true;
      return;
    }
    const limit = captured ? 280 : 45;
    const clamp = value => Math.max(-limit, Math.min(limit, value));
    input.look(clamp(event.movementX));
    pitch = Math.max(-22, Math.min(22, pitch - clamp(event.movementY) * input.profile.lookSensitivity * .6));
  });
  canvas.addEventListener("mouseleave", () => { lookReady = false; });

  canvas.addEventListener("wheel", event => {
    if (!active()) return;
    event.preventDefault();
    input.wheel(event.deltaY, event.deltaMode);
  }, {passive: false});
  canvas.addEventListener("contextmenu", event => { if (active()) event.preventDefault(); });
  canvas.addEventListener("auxclick", event => { if (active() && input.owns(`Mouse${event.button}`)) event.preventDefault(); });
  canvas.addEventListener("pointercancel", () => input.clear());
  canvas.addEventListener("blur", () => input.clear());
  window.addEventListener("blur", () => input.clear());
  document.addEventListener("visibilitychange", () => { if (document.hidden && active()) setPaused(true); });

  document.addEventListener("pointerlockchange", () => {
    const wasCaptured = captured;
    captured = document.pointerLockElement === canvas;
    if (captured) {
      ignoreUnlock = false;
      captureLabel("captured", "Mouse captured. Esc pauses and releases it.");
    } else {
      input.clear();
      if (wasCaptured && !ignoreUnlock && active()) {
        setPaused(true);
        byId("resume").focus();
      }
      ignoreUnlock = false;
      captureLabel("fallback", "Move the mouse inside the arena to look. Esc pauses.");
    }
  });
  document.addEventListener("pointerlockerror", captureFailure);

  byId("capture").addEventListener("click", () => {
    if (!started || dialog.open) return;
    resume();
    if (captured) {
      releaseCapture();
      return;
    }
    input.clear();
    captureLabel("pending", "Requesting mouse capture…");
    try {
      if (typeof canvas.requestPointerLock !== "function") captureFailure();
      else canvas.requestPointerLock()?.catch(captureFailure);
    } catch {
      captureFailure();
    }
  });

  byId("start").addEventListener("click", launch);
  byId("resume").addEventListener("click", resume);
  byId("switch").addEventListener("click", () => {
    if (!active()) return;
    input.swap();
    pitch = 0;
    canvas.focus({preventScroll: true});
  });
  byId("restart").addEventListener("click", () => {
    newExchange(input.profile);
    launch();
  });
  byId("mute").addEventListener("click", event => {
    muted = !muted;
    if (!muted) unlockSound();
    event.currentTarget.textContent = muted ? "Sound off" : "Sound on";
    event.currentTarget.setAttribute("aria-pressed", muted);
    if (active()) canvas.focus({preventScroll: true});
  });
  byId("controls").addEventListener("click", openControls);
  byId("close-controls").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { if (started) resume(); });
  byId("momentum").addEventListener("change", event => sim.setMomentum(event.target.checked));
  byId("practice").addEventListener("change", event => sim.setPartner(!event.target.checked));
  byId("view").addEventListener("click", event => {
    view = view === "first" ? "external" : "first";
    byId("orbit-label").hidden = view === "first";
    byId("crosshair").hidden = view !== "first";
    event.currentTarget.textContent = view === "first" ? "External view" : "First-person view";
    event.currentTarget.setAttribute("aria-pressed", view === "external");
    if (active()) canvas.focus({preventScroll: true});
  });
  byId("debug").addEventListener("click", event => {
    debug = !debug;
    event.currentTarget.setAttribute("aria-pressed", debug);
    for (const name of ["diagnostics", "pose-step", "pose-live"]) byId(name).hidden = !debug;
    if (!debug) poseStep = null;
    if (active()) canvas.focus({preventScroll: true});
  });
  byId("pose-step").addEventListener("click", () => {
    poseStep = ((poseStep ?? -1) + 1) % boot.art.poseOrder.length;
  });
  byId("pose-live").addEventListener("click", () => { poseStep = null; });

  for (const [name, caption] of Object.entries(bindingNames)) {
    const label = document.createElement("label");
    const field = document.createElement("input");
    field.name = name;
    field.dataset.bind = "";
    field.spellcheck = false;
    field.autocomplete = "off";
    label.append(caption, field);
    byId("binding-fields").append(label);
  }
  byId("profile-form").addEventListener("submit", event => {
    event.preventDefault();
    applyProfile(formProfile());
  });
  byId("profile-reset").addEventListener("click", () => applyProfile(HandsInput.DEFAULT_PROFILE));
  byId("profile-export").addEventListener("click", () => {
    const area = byId("profile-json");
    area.value = JSON.stringify(input.profile, null, 2);
    area.focus();
    area.select();
    profileStatus("Current profile ready to copy.");
  });
  byId("profile-import").addEventListener("click", () => {
    try {
      applyProfile(JSON.parse(byId("profile-json").value));
    } catch {
      profileStatus("Paste a valid controls profile as JSON.");
    }
  });

  newExchange(loadProfile());
  updateQuickControls();
  byId("capture").disabled = true;
  byId("switch").disabled = true;
  window.firstEncounter = Object.freeze({
    inspect: () => ({
      ...sim.snapshot(),
      host: {started, paused, captured, captureStatus, view, pitch, debug, poseStep},
    }),
    profile: () => structuredClone(input.profile),
    events: () => structuredClone(sim.W.events),
    presentation: () => renderer.inspect(),
    performance: () => ({
      frameTimesMs: [...frameTimes],
      canvas: {width: canvas.width, height: canvas.height},
      devicePixelRatio,
      renderer: "Canvas 2D",
    }),
    audio: () => ({muted, state: audioContext?.state ?? "locked"}),
  });
  requestAnimationFrame(animate);
})();
