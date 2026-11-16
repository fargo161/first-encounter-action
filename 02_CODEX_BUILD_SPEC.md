# FIRST ENCOUNTER — Hands-first system and execution specification
**Version:** 0.2 / execution handoff · **Date:** November 16, 2026
**Owner:** Teddy · **Prepared by:** Nova / ChatGPT
**Execution surface:** browser Codex Cloud
**Target repository:** `fargo161/first-encounter-action`
**Target implementation branch:** `codex/hands-first-v0-1`
**Task:** implement the first hands-first exchange, not another research report.

## 0. Read this before making a plan

Read `01_DESIGN_NOTE.md`, this document, `AGENTS.md`, `03_SETUP_AND_CONNECTIONS.md`, `04_ASSET_PLAN.md`, and `tests/acceptance/ACCEPTANCE.md`. Run the supplied setup/verification scripts. Then implement inside the independent new-game workspace.

Teddy asked for a hands-first playable and minimal administration. He authorized creation of an independent repository and changes to its copied action runtime; the original FEG/Lab/ROOM/ZANT projects remain unchanged. He explicitly kept the controls experimental. The permissions in this packet do not promote held canonical packages, authorize the Lab's next phase, or erase existing qualifications.

Do not ask the owner to reapprove an engine, repo name, ordinary implementation detail, test-output folder, or tuning constant already covered here. Proceed through the bounded internal gates. Ask only for an actual access/consent action you cannot perform, a destructive operation, or a material design/authority conflict. Do not switch engines or silently fabricate an unavailable source.

**Stop at a delivered hands-first playable and its evidence.** No weapons, Punchlines, clinch, world destruction, or city build after the first-fight gate unless separately requested.

## 1. Honest starting point

### 1.1 Actual available source

The uploaded archive is **Action Playground v0.3.1**, with 1,081 entries and SHA-256:

`450d08e5099a6992786a95ed227ac3131c1d0edb12dc81c5f06c8ce80a8a307f`

The packet contains a **110-file reproducible action subset** under `vendor/room-action-v0.3.1/`, not the entire historical archive. Exact extracted-file hashes are in `config/DONOR_FILE_LOCK.json`. It includes all ROOM source modules, relevant action build tools, two physical scenes, the action atlases/manifests and original input sheets, the six action `.test.js` files and their fixture, and the shipped HTML baseline.

The supplied source, scene generator, host builder, and playable builder reproduced the shipped scene and both HTML files **byte-for-byte** in preparation. See `evidence/preparation/rebuild.json`.

Later v0.3.2/v0.3.3 documents are known, but their raw source bytes could not be obtained in this session. This is not v0.3.3 and does not include that release's six-kind Wreck room. **Do not block the hands-only build waiting for an unavailable archive.** Use this verified donor, label the new product separately, and repair defects reached by the new slice. An actual later source found in the execution environment may replace the donor only after hash, provenance, comparison and baseline checks; never pretend a reconstructed patch is the original release.

### 1.2 Measurements made during preparation

- Node v22.16.0 / Python 3.13.5 were used here; this is not a claim that the canonical FEG toolchain was verified under those versions.
- Physical tests: 15 PASS lines; edge cases: 9; integration: 19; degradation occupancy: reports 2/2. Those four files exited 0.
- Pressure: 28 assertions passed, then the unmodified test exited 1 because its `../evidence_v0_3` output directory was missing. In a separate scratch copy, creating that output directory allowed the same test to finish 28/28 with exit 0. No assertion was edited.
- The separate Claude findings file exceeded a 15-second timeout; this is **unverified**, not a pass. Investigate with a bounded larger timeout or isolate the slow case in a separate reproduction. Do not delete it or infer a clean full suite.
- Exact inherited HTML launched in headless Chromium's Canvas path through `set_content`, with no page errors or external HTTP(S) requests in that smoke. Direct `file://` navigation was blocked by sandbox policy. No native Windows launch, hardware WebGL performance, human play-feel, or new hands-game test has passed yet.

These results identify a usable donor and its limitations. They do not certify the finished game or all legacy modes.

### 1.3 Source anchors that matter

| Existing file | Relevant symbols / responsibility |
|---|---|
| `rc/source/actor-physical.js` | `H`, `PROFILES`, `PRESSURE_ACTIONS`, `create`, `actor`, `request`, `resolveAction`, `moveActor`, `testDriver`, `tick`, `switchControl`, `snapshot` |
| `rc/source/ui-physical-proof.js` | `AP`, `apPointerDown`, `apPointerUp`, `apClearInput`, `apFrame`, `apDrawHands`, `apEnsureHud`, exposed `EXT.physicalProof` |
| `rc/source/ui-route.js` | Host input dispatch; audit legacy key conflicts |
| `rc/source/ui-pressure-camera.js` | Existing fallback display; do not invent another gameplay state authority |
| `rc/source/build.py` | Host assembly and duplicate-name guard for shared UI scope |
| `rc/source/build_pressure_play.py` | Existing offline embedded-scene packaging example |
| `rc/tools/make_pressure_scene.cjs` | Current pressure scene construction |
| `rc/characters/action_pressure/runtime_assets.json` | 164 presentation records; 23 TH1 and 10 FPW first-person frames; three body packs |
| `rc/inputs/action_proof/frames.json` | Exact source frame database; verify each sheet identity before reusing rectangles |

The existing action system is fixed-step **1/240 second**, uses x/y horizontally and z up, and has feet-rooted bodies. The renderer maps these to its own coordinate convention. Preserve that conversion explicitly. Do not silently migrate to y-up gameplay coordinates or drive collisions from sprite pixels.

## 2. Deliverable scope

### Required

A single self-contained offline HTML named `Play_First_Encounter_Hands_v0_1.html`, plus editable source and a verified source ZIP. A compact warehouse-looking training room with a clear floor; two standardized, unarmed combatants; free bounded footwork; raised/lowered fists; light hand combinations; a heavy; adjustable guard; an interception parry caused by a correctly timed light action; visible guard pressure, stagger and recovery; input/profile tuning; and a minimally reactive partner. Developer control switching must work in the actual playable.

No damage-over-time death race. Use an explicit symmetric sparring mode: ordinary hand exchanges pressure guard and balance, with no mandatory lethal health drain. Keep the underlying health field for later integration; do not secretly make only the player invulnerable. Guard breaks and recovery are enough to test this slice.

Keep a small, inspectable Momentum value as an **experimental combat resource**, separate from physical velocity. It can be toggled off for comparison. It is not a second stamina/Tempo/Punchline economy.

### Not required now

Jump/kick improvements, bicycle kicks, knee-release combos, wall boosts, actual person grips, clinch, traversal attachments, rope/hookshot, throwables, firearms, full faces, Punchline menus, BASED stat modifiers, persistent social interpretation, destructive scenery, moving vehicles, multiplayer, progression or final art. Existing legacy demonstrations can remain accessible under a clearly labeled legacy/debug area; their existence does not mean they meet the new rules.

**Reach preview only:** support the long-RMB intent and an obvious empty reach/withdrawal with no accidental heavy. Do not implement a full grappling system to finish this first slice.

## 3. Architecture: one actor, not player code plus enemy code

### 3.1 Ownership

- ROOM's copied physical runtime owns body transforms, support, collisions, contact eligibility and physical results.
- A shared hands-action layer owns action phases, hand occupancy, coverage, recovery and combo opportunities **inside that same simulation**, not in a second physics loop.
- Human input and the sparring provider both submit semantic action requests. Controller type is not a damage/guard/collision modifier.
- Presentation reads resolved state/events. First-person hands and external body art are views of the same actor action.
- Future Encounter integration owns meaning, identity bindings, observation, interpretation and history. The local training provider and local diagnostic event log remain explicitly labeled as such.

Suggested action boundary, not a claim that these exported APIs already exist:

`requestAction(actorId, {intentId, commandId, logicalTick, parameters}) -> accepted/buffered/rejected + reason`

Input adapters can translate to or extend the existing `request` function. Keep one authoritative resolver. Use IDs and explicit time, not button names, throughout core mechanics.

### 3.2 Minimal shared state

Retain identity, appearance, body profile, transform, velocity, support, health, controller binding and equipment. Add only the fields needed for this pass: readiness; desired guard level; actual left/right coverage; hand state and recovery; current move/phase/action ID; a short validated queue; guard integrity; temporary stagger; combo opportunity/expiry; experimental Momentum; and an observation snapshot for the training controller.

`left/right` always means the actor's anatomical side. Mirroring artwork must not swap gameplay hands or hand-specific cooldowns. First-person sprites are not physical hands simulated finger by finger.

### 3.3 Developer switching

Provide a visible **Switch controlled fighter** button and configurable dev hotkey (default Tab, not Q). Apply the switch at a simulation boundary, pausing briefly in development if needed. Transfer exclusive controller/camera ownership; do not recreate actors or reset position, velocity, guard, recovery, momentum, action IDs or inventory. Discard stale controller input using a control-epoch boundary. A mouse-up from the former controller must not trigger a heavy on the newly controlled body.

Existing committed actions finish under shared rules. Future attachments must survive a controller transfer unless a deliberate physical release is commanded; clearing an input device must not secretly change world custody. With the current no-attachment slice, test swaps while idle, moving, preparing, striking, recovering, guarding and staggered. Both body art and first-person art must still match the new viewpoint.

## 4. Controls are a replaceable experiment

`config/CONTROLS_SKETCH_A.json` records the owner's current idea. It is **not permanent game canon**. Add a small in-game Controls/Feel panel for rebinding, tuning hold thresholds, export/import/reset, and concise help. Validate conflicts and show which context owns an input. Changing the profile does not require editing action rules.

Do not implement a giant input editor. Provide a few bounded settings and JSON import/export. Preserve the user's saved profiles. Apply changes while paused or at a safe neutral boundary; clear old pending gestures, but never reset world state to apply a binding.

### Sketch A for this slice

- WASD: free footwork on the clear ground-level surface. Wider world/elevated authored traversal remains future work.
- R: raise/lower fists. This is a stance change, not instant recovery cancellation or free guard restoration.
- LMB down: light hand action when ready. Context and timing choose a legitimate continuation. A correctly timed light interception may resolve as a parry; there is no separate perfect-block button.
- RMB: quick click-and-release gives a heavy **only while fists are up, hands available and no other object/attachment context owns that press**. Hold commits to an empty reach preview. A committed miss withdraws; release must not accidentally become a heavy.
- Wheel up/down: raise/tighten or lower/loosen the selected guard stance. The stance persists; protection still depends on hands actually being available and correctly placed.
- Q: reserved for future quick messaging, not Grab and not developer swap. In this slice show a short nonmodal “Messages later” hint at most; do not ship a fake functional menu.
- F/Space: reserve the kick/jump language. No new aerial implementation is required for the hands milestone. Do not silently use F for heavy or Q for swap because the donor did.

### Owner's later context rules — preserve, do not build them all now

| Context | Meaning |
|---|---|
| Person or vault/momentum/climb node attached | RMB must be held to maintain the grip; physical release follows timing/momentum/context. No dedicated throw button. |
| Item/weapon acquisition | Successful pickup latches possession at actual acquisition; continuing to hold RMB is not required. The pickup-release edge does not throw it. |
| Throwable item, not a proper melee weapon | A new RMB hold plus wheel-up enters winding. Release phase and aim determine bounded power/arc. Holding alone is not automatically a wound throw. |
| Firearm held | RMB performs the appropriate melee action. |
| Proper melee weapon held | Exact contextual action still open; do not invent a final binding. |
| F | Tap light kick; eligible wall-jump context can produce wall boost. Hold knee; timed release can extend knee into heavy kick. |
| Space | Jump. |
| Q | Quick-message choices: taunts/threats/deals and later Punchlines. |

Record these as future action families and contextual input cases, not completed functionality. Person-grab eligibility/clinch and the exact throw equations remain future design work.

### Input edge rules

Use a per-press token and explicit undecided/tap-candidate/reach-committed/consumed/cancelled phases. An action cannot execute as both heavy and grab from the same gesture. Freeze the relevant input context for each gesture; a mid-press equipment change cancels or revalidates it, never converts it invisibly into another attack. Start an inexpensive preparatory hand pose on button-down; contact must wait for the legitimate resolved move.

Prototype RMB tap threshold: 150 ms (36 physical ticks). This is adjustable, not an owner-approved final number. A hold that crosses the threshold will not produce a heavy on release even if there is no target. Readiness lowered at press, pause, focus loss, profile change or controller swap must not produce a latent heavy. Browser pointer-capture clicks are consumed for capture, not attacks.

Normalize mouse-wheel delta modes before applying guard increments. Ignore gameplay wheel input while an actual menu owns it. Scope context-menu prevention and page-scroll prevention to the active game surface. Test pointer lock refusal/retry, Escape, losing focus and mouse-up outside the canvas. No raw internal error strings in the play HUD.

## 5. Shared combat mechanics

### 5.1 Proposed tuning, fully editable

These numbers are engineering seeds. The team may adjust them together to meet readability/fairness, documenting the change. Do not enforce them as the owner's immutable fighting system.

| Move | Startup | Active | Recovery | Guard pressure | Notes |
|---|---:|---:|---:|---:|---|
| Lead light | 75 ms / 18 ticks | 25 ms / 6 ticks | 150 ms / 36 ticks | 18 | Short, clear preparation; may be fist/palm variant |
| Rear light continuation | 100 ms / 24 ticks | 25 ms / 6 ticks | 175 ms / 42 ticks | 22 | Must respect hand/body availability |
| Hook/chop ender | 175 ms / 42 ticks | 25 ms / 6 ticks | 300 ms / 72 ticks | 30 | More committed; no endless automatic restart |
| Heavy | 275 ms / 66 ticks | 50 ms / 12 ticks | 375 ms / 90 ticks | 55 | Defendable and punishable when missed |

Guard: 100 initial; regeneration candidate 20/sec after 0.75 s without fresh guard contact, subject to legal recovery. Guard break: candidate 0.8 s stagger then recovery to 60. No repeated light can extend stagger forever. Parry counter opportunity: candidate 0.2 s. Buffer: one eligible next action, 150 ms expiry, not a three-hit macro. Latest legal defensive intent may cancel an unstarted queued offense; it must not erase an already committed heavy.

Keep donor movement values initially (walk 3.8 m/s, sprint 5.6 m/s, acceleration 20) for comparison, then tune in the new mode. Current body baseline is 1.8 m, radius .29 m, eye 1.62 m; values belong to the shared profile. Reach must be measured against body/hand origins, not confused with anatomical arm length. Start from donor reach values and show them in diagnostics.

### 5.2 Hands and bodily commitment

Each hand can be available, preparing, active, guarding, recoiling, recovering or reaching. A hand cannot simultaneously strike, cover the same line, and grip. A separate body commitment prevents independent hands from becoming two unconstrained simultaneous cannons. Both hands may be posed together without both being able to deal damage.

The first combination is a small directed set of legal continuations from outcomes: clean contact, guarded contact, successful interception, or recovery. LMB is not a request for arbitrary random art. A defensive success can open a different continuation from a clean offensive hit. Cosmetic variants within the same move preserve timing, reach and result; actual mechanical variations require a readable preparation cue and distinct move data.

Use bounded momentum/spacing consequences, not simulated joints. Whiffs expose recovery. A guard break earns an opening; it does not invoke a missing clinch. Use a brief, visibly recoverable stagger for this milestone.

### 5.3 Parry is a hand interception

Raising guard gives ordinary coverage. A light hand action can intercept an incoming strike when timing, facing, reach, hand availability and an authored interception region overlap. Initial eligibility can cover the first 100 ms of the light action. It is not universal invulnerability, does not protect the back, and cannot be renewed by raw click spam while committed.

Resolve a candidate contact exactly once. Successful parry consumes that interception/strike opportunity, redirects or cancels the incoming contact, and opens a counter opportunity. Do not award an automatic free second hit in the same event. A late attempt can be an ordinary hit, miss, block, or trade according to the same geometry and phases.

Initially use simple actor-local contact proxies and an authored action-phase path, not rendered-pixel collisions and not full hand rigid bodies. Expose their debug overlay. Verify the visual hand/attack line is close enough to the proxy that parries do not appear to occur across empty space. Do not solve bad alignment by silently expanding the hit region.

### 5.4 Simultaneous outcomes and determinism

Collect eligible contacts for a fixed tick before applying conflicting outcomes, so actor array order cannot make one side inherently stronger. Define a neutral clash when mutually valid interceptions occur; neither side gets an arbitrary ID-based bonus. Use a contact key containing action ID, target ID and explicit subhit index. One active window cannot damage repeatedly on every 240-Hz step.

Presentation frame rate cannot change outcomes. The same semantic command trace and seed must produce the same state at 30/60/144-Hz render scheduling. Buffering and reaction timestamps use the logical simulation clock after input timestamps are normalized. Pause does not accumulate a future attack burst.

### 5.5 Momentum, not a pile of meters

Maintain physical velocity separately from an experimental Momentum resource `M` in 0..100. Candidate values: effective clean contact +4; successful parry +10; guard break +12; a meaningful whiff -6; being parried -8. No gains for swinging in air or repeatedly touching an already-staggered target. Apply once per resolved event.

A small optional effect can be `1 + .0015*M` on guard pressure and attack shove, capped at 1.15. Do not simultaneously multiply health damage, movement speed, animation playback and parry windows. The default sparring slice does not need lethal damage. Keep a tuning toggle to compare momentum on/off, and make active effects visible in diagnostics.

No Punchline speed/power trade or hidden BASED weakness yet. Preserve that future idea without silently making it a balancing dependency now.

## 6. The reactive partner

This is a training decision provider, clearly labeled **not the integrated Encounter brain**. Only one provider controls an actor at a time. It chooses from the shared action vocabulary; it never edits health, positions, guard, recovery or outcome flags directly.

Give it modest movement: face with a bounded turn rate, hold a comfortable distance, step in/out, guard, answer a visible whiff or overcommitment, and occasionally initiate an obvious check after pressure has subsided. Stop chasing when the owner wants a quiet practice moment. It should neither be a passive statue nor permanently aggressive.

Feed it an observer-scoped snapshot with visible pose/action cues, approximate distance and legitimately observed contact history. No player input queue, mouse state, private intended next move, or future RNG. A training reaction delay can begin around 240 ms. Before an opening attack, it can deliberately show a 200–300 ms preparation/stance cue; this is a chosen action delay using a shared cue state, not a privileged slower/faster hit calculation. The actual move uses the same timing table as the human's move.

Show reasons in developer diagnostics, not thought text over the opponent. A deterministic mode supports tests. Repetition recognition, BASED personality and long-memory tactical deception are later work, not a claim about this simple provider.

## 7. Presentation: hands as information

### 7.1 Sparse poses, smooth movement

Render/input responsiveness targets 60 FPS. Retain the 240-Hz physical baseline unless measured necessity establishes a change. Interpolate presentation transforms as appropriate. Advance body drawings by semantic phase and authored hold durations, not a fixed five-FPS animation clock and not a velocity-derived walk-cycle index reused for attacks.

Each basic strike can use roughly 3–5 meaningful pose assignments: ready/chamber, preparation, extension/contact, recovery. Reuse drawings deliberately. Missing art does not change physics, but a static standing NPC cannot pass the final telegraph test.

Use a small composition of forearm/hand layers where needed; no universal rig editor and no procedural finger simulation. Maintain wrist entry, scale, side, silhouette and palette continuity. Choose one coherent bare-hand family for the first pass (TH1/TH2 with compatible FPW examples); other sheet families are alternatives/reference, not random per-punch substitutions.

### 7.2 Same action, two presentations

An action ID/phase feeds both the first-person view and external five-direction actor view: front, front three-quarter, side, rear three-quarter, rear. Mirror only according to documented side conventions. Missing directions require explicit compatible fallback/art work, not labeling a front-facing image as a verified rear view. The opponent must visibly raise guard, prepare attacks, recoil on blocked contact, stagger, and recover. Any borrowed body source is a presentation choice only.

Do not paste a first-person foreshortened fist over a distant body at an arbitrary scale and call the external pose finished. The asset lane must inspect both views in the real play camera. Missing heavy/guard/parry poses can be composed or generated if the execution environment has a suitable image tool; the game must not wait indefinitely for it. Record stand-ins truthfully.

### 7.3 Impact and audio

Differentiate miss, ordinary hit, guard contact, parry and guard break through sound, hand recoil and body response. A subtle camera impulse is optional and must be adjustable/off. Never move the aiming direction as an unrequested automatic camera lock.

Start with a short presentation contact hold (roughly 20–35 ms), not a render-driven global simulation freeze. Continue input capture and preserve logical timing. A true simulation hit-stop would be a separate, explicit paired rule with its own tests; do not smuggle it in as an animation effect that changes parry windows.

Use bundled sound only when actually available. Otherwise synthesize a few original transient contacts locally using Web Audio; unlock audio on the initial user gesture. No live network or generation service during play. Never claim sounds came from an absent pack.

### 7.4 Minimal play UI

Show the game, not the editor: start/restart, concise controls/help, optional guard/Momentum indicators and a small expand/collapse tuning panel. All functional controls get a plain-language help label. Developer tools may show hands, action phases, queued command age, guard coverage, body velocity, last result and controller binding. Clear missing-asset diagnostics must remain outside normal combat text.

## 8. Physical arena and eventual integration

Author a new simple warehouse-like ROOM scene for this new game. Suggested 12×12 m footprint, 4 m ceiling, at least 8×8 m unobstructed floor; these are proposals, not claims about the donor. No moving car or lethal falling surface in the accepted hands preset. Preserve the original scenes separately.

Allow free bounded WASD on that surface through the same collision/movement authority. Do not remove all rail constraints globally or treat empty space as a walkable floor. On elevated routes later, authored attachments/rails can supply the intended traversal grammar. A locally sufficient scene is not a whole-city migration.

For future Encounter, expose committed events with sequence ID, actor/target IDs, logical tick, action ID, contact point, outcome and state changes. Distinguish physical truth from observer access and interpretation. An event called `parry_resolved` is evidence, not automatic “humiliation.” Keep the local event namespace explicit and prevent duplicate receipt effects.

Do not import the Lab's store purchase loop as the fighter brain. Do not map hidden BASED intent directly to a public UI or let the presentation mint wrappers. Meaning, communication, physical performance and outcome remain distinct.

## 9. Suggested implementation layout

Run `python scripts/prepare_workspace.py` to create the editable `game/rc` copy. The vendor snapshot and source images remain unchanged. The layout below is an implementation proposal, not files already implemented in the packet:

```
game/rc/source/hands-actions.js           shared hand states, legality, phases, combo opportunities
game/rc/source/hands-input.js             replaceable human gesture adapter; no hit truth
game/rc/source/hands-sparring.js          observable-only training provider
game/rc/source/ui-hands-lab.js             hand/body presentation, help, tuning, controller switch
game/rc/data/hands-moves.json              tunable moves and shared coverage definitions
game/rc/data/hands-art.json                pose/phase bindings, source IDs, anchors, hold times
game/rc/examples/First_Encounter_Hands.room.json
game/rc/tools/make_hands_scene.cjs
game/rc/source/build_hands_play.py
tests/hands/                             actual new tests written by the implementation/QA lanes
dist/Play_First_Encounter_Hands_v0_1.html
```

The lead may simplify this layout. Preserve one writer for the shared runtime and host integration. Keep old pressure mode behavior distinct with an explicit new hands mode rather than accidentally changing every inherited demo.

## 10. Agent team and bounded workflow

One lead/integrator and at most three concurrent workers. Use native subagent tools when actually available; otherwise execute the same roles sequentially and report that independent parallel review was unavailable. Do not invent completed agents. Optional `.codex/agents` definitions are supplied; cloud support must be checked, not assumed from local-client documentation.

**Lead / integration steward:** owns root setup, branch, `actor-physical.js`, host build/input integration, cross-lane contracts, README, commits and packaging. Keeps one current source of truth.

**Mechanics/input specialist:** owns the new hands action/input modules, data and unit tests; proposes changes to shared actor code to the lead instead of editing it concurrently.

**Presentation/asset specialist:** owns derived assets, art manifest, new hands presentation module, audio/presentation tests and actual browser inspection. Does not change hit rules to conceal an art problem.

**Independent verifier:** owns new adversarial tests and evidence; no production edits, no weakening old tests. Checks actor parity, input conflicts, appearance-independence, offline launch and report honesty.

The lead handles the small sparring provider after the action interface is stable, or assigns it as a sequential mechanics task. No additional agent for every acronym.

### Internal gates — proceed automatically within this scope

**A. Intake and baseline:** verify manifests; create isolated repo/copy; reproduce the donor; record existing failures; establish actual browser/network/remote capabilities. Source files are already included: do not start by asking Teddy to find them again.

**B. One working shared exchange:** readiness, footwork, light/heavy, coverage, active interception, stagger and a controllable partner. Prove controller transfer and identical semantic action outcomes before expanding art.

**C. Readability and feel pass:** coherent hands, honest external cues, contextual continuations, audio/recoil, modest partner movement, profile controls, tuning and help. Capture a short actual play trace/video. Tune obvious timing problems rather than just showing a green unit suite.

**D. Verification and delivery:** run the acceptance matrix, export evidence and exact package, commit the new review branch, push when supported and authorized, verify remote SHA. No automatic merge into an old repository and no stage-two expansion. Deliver a working local artifact even when remote publication is unavailable; label that separately.

## 11. Completion and failure policy

A page opening is not completion. A pretty fist moving on screen is not a playable shared action system. Passing simulations without a real mouse-input check is not input acceptance. A browser frame-rate reading under software rendering is not hardware performance certification.

Required delivery: self-contained playable HTML; source ZIP; updated README with launch instructions; actual control profile; tuning and art manifests; build commands; individual test results including failures/timeouts; input/contact trace; screenshots or short recording; known limitations; and exact local/remote revision status.

The final response to Teddy should begin with the playable, controls and what to try. No giant architecture essay instead of the game. Keep at most one necessary access question. Do not promise a guaranteed afternoon deadline or certify human enjoyment without the owner's play.

When blocked: keep the latest functioning checkpoint; retry a bounded failing step; report exact missing capability/file and whether it blocks play, publishing or only optional art. Never replace supplied source with an unrelated game, silently reset the repository, ask for raw credentials in chat, or abandon implementation for endless preparatory documents.
