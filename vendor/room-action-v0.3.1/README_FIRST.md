# Action Playground v0.3.1 — Physical-Integrity Repair

1. Extract `ACTION_PLAYGROUND_PHYSICAL_INTEGRITY_v0_3_1.zip`.
2. Open `Play_Action_Playground_v0_3_1.html` in a Windows Chrome/Edge browser (intended offline workflow; not independently tested on Windows).
3. Try `1` Melee, `2` Car Jump, and `3` Breach, then reset with Enter.

**Controls unchanged from v0.3:** Mouse look; WASD to move on authored rails; Space jump; Shift sprint; left mouse tap light combo / hold block; F strong punch; E kick (E during forward jump = lunge kick); right mouse grab a wilting defender / click again throw; G release; Esc pause and P resume; 1–5 drills; Tab diagnostics; Q/V/B debug appearance/controller/body variants.

**Changed:** Normal walking no longer escapes through floor seams; resting on and stepping off a body no longer accumulates lethal phantom fall speed; barricade state changes do not create overlapping colliders. Preserved: jump/car roof, flying kick, pressure guard, wilt, grab/throw and one-piece degradation.

**Still open, not repaired/tuned in this pass:** Very hard flying-kick collisions can hurt; deliberate off-tile jumps and vehicle-boundary behavior may cause a fall; thrown-body/car collision severity warrants a separate design decision. See `ACTION_PLAYGROUND_v0_3_1_INTEGRITY_REPORT.md`.

Original v0.3 is not overwritten. No slime/capture system or additional training NPC has been added.
