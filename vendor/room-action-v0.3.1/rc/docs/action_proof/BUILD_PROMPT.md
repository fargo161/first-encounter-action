# Action Playground — Shared Actor Standard, Asset Normalization, and One-Tile Physical Proof

**Detailed implementation prompt · v0.1 · November 15, 2026**  
**Primary implementer:** Nova / ChatGPT for ROOM and the physical runtime.  
**Claude's role:** Source inspection, manifest/asset preparation outside ROOM, and separately scoped Encounter-side work.  
**Document status:** A build prompt, not a build report. Creating this document did not implement or test the game.

---

## 0. The assignment

Build the following sequence against the **actual Combat Room source**, in one progressively improving browser application:

> **Shared actor standard → small, repeatable asset-normalization subset → one-tile physical interaction proof.**

The deliverable is not another general design essay, an asset slideshow, an unrelated physics demo, or a plan to migrate engines. It is a small playable physical encounter, backed by reproducible preparation scripts, source changes, and evidence of what passes.

The owner wants to move quickly by making existing material work together. Start with one modular playground tile and characters that occupy the same kind of physical world. The player and NPCs must use the same underlying actor implementation; input source, appearance, equipment, abilities, and parameter values can differ.

**End-of-pass experience:** In one street tile, the user can move and jump, land on and leave a moving car, punch or kick a defender, grab and carry that defender briefly, release or throw them, and produce a real physical consequence against a car, a drop, or one state-swapping obstruction. A debug control swap proves that player and NPC are not separate physical species of implementation.

This pass establishes the physical foundation. The complete slime/capture/pod/rescue loop and full four-person squad follow later; they are not prerequisites for finishing this pass.

### How to execute this prompt

When the owner explicitly instructs you to execute this prompt, work through the stages in order. Do not stop after every successful stage to ask permission to continue within the authorized scope. Do stop at a missing indispensable input, an unresolved authority boundary, or a change that would exceed that scope.

Receiving this document only for review does not authorize implementation. When execution is authorized, preserve all baseline checkpoints and make changes in a new working copy or branch.

---

## 1. Source hierarchy, evidence, and scope of authority

### 1.1 What governs the work

Use these sources, with their roles kept distinct:

| Source | Role |
|---|---|
| The owner's latest explicit instructions | Current scope, priorities, and authorization; includes the shared-actor and modular-tile directions summarized below |
| `source_docs/FIRST_ENCOUNTER_ACTION_PLAYGROUND_CONTEXT_2026-11-15.md` | Governing gameplay intent |
| `source_docs/ROOM_MODULAR_DEGRADATION_MANIFEST_HANDOFF_2026-11-15.md` | Governing state-swap rule and ownership boundary |
| The seven Encounter-spirit rules quoted in `00_START_HERE.md` §5 | Shared rules, perception, identity, and state-before-presentation principles |
| Actual supplied Combat Room source and executed tests | Evidence of implementation and runtime behavior, not permission to override design |
| `ACTION_GAME_ASSET_MANIFEST_v1_1.zip` | Asset IDs, source-image metadata, extraction instructions, source map, and labeled suggestions |
| `ACTION_PLAYGROUND_MANIFEST_REVIEW_AND_ASSEMBLY_PLAN_2026-11-15.md` | Review findings and proposed assembly strategy; not evidence that the underlying runtime was tested |
| This prompt's working defaults | Bounded implementation choices for this proof, not previously approved final game tuning |

If source code disagrees with a manifest claim, report the actual source behavior and update the implementation plan accordingly. Do not silently change the owner's design to match old code. If a recipe disagrees with a governing owner document, the owner document controls.

### 1.2 Owner direction supplied with this prompt

The owner explicitly wants:

- One small modular environment tile first, capable of being connected into a larger city later.
- Player and NPC avatars to be the same kind of physical actor, not two unrelated implementations.
- A pipeline that cleans and aligns existing character art into predictable physical space, with consistent treatment of size, weight, grabbing, and throwing.
- Slight character size differences without reinventing physical behavior per character.
- A player-specific animation presentation initially, but not a player-only physics system.
- Existing supplied assets as the starting material.
- Simple, authored environmental degradation states instead of real-time fracture simulation.

### 1.3 Ownership is a hard boundary

**Nova / ChatGPT owns ROOM source changes**, including changes to its movement, physical interaction, rendering integration, source build scripts, vehicle integration, and scene-authoring machinery.

**Claude must not edit ROOM source**, modify its generated outputs as a workaround, or create an alternate runtime to evade that boundary. Claude may inspect the source and prepare selected asset outputs and standalone preparation tools outside the ROOM tree under the owner's instruction. Claude's Encounter-side changes require their own applicable authorization.

If you are Claude receiving this prompt, perform the permitted inspection/preparation work and return a precise Nova handoff for required ROOM modifications. Mark the integrated playable proof **blocked pending Nova implementation**, not completed. Ownership is semantic: putting replacement ROOM behavior in a differently named folder does not make it Encounter work.

If you are Nova executing an authorized build, proceed through the physical implementation and proof. Do not turn the source audit into an indefinite planning exercise.

---

## 2. Required inputs and the first hard gate

### 2.1 Required documents

Read the two owner documents, the assembly review, and these manifest sections before touching implementation:

`00_START_HERE.md`, `01_NEEDS.md`, `10_CHARACTERS.md`, relevant portions of `11_FIRST_PERSON.md` and `18_MORE_ENEMIES.md`, `16_BUILDER.md`, `17_STREET_AND_VEHICLES.md`, `20_SLICING_AND_SCALE.md`, `21_MODULAR_DEGRADATION.md`, `90_ARCHIVES.md`, and `data/frames.json`.

Read the relevant recipes, matrices, model specifications, and effects/audio entries only as needed. Do not make ingesting every catalogue page or cleaning every sheet a prerequisite.

### 2.2 Required implementation material

Locate and open the actual **`Room_Creator_v0_2_COMBAT_ROOM_v0_1_1.zip`**, or an owner-designated successor with a traceable relationship to it. The manifest identifies its source root as `rc/`.

Also locate the original images needed for the selected subset in §5. The annotated numbered previews are not substitutes for the originals.

**Known packaging fact:** The inspected manifest ZIP contains documentation, `data/frames.json`, numbered previews, and the two owner documents. It does not contain the original character sheets, referenced asset archives, or `rc/` implementation tree. An inventory entry is not the underlying file.

Search the actual available uploads/project files or authorized repository before asking the owner for files already accessible. If indispensable source or originals are unavailable, ask once for the specifically missing items. Continue independent permitted preparation where useful, but do not claim an actual-source check, normalized art, or physical proof without the required material.

The inspected manifest ZIP has SHA-256:

```text
0216e3d355b3ed218ccfba0760650244c1a0ff9d0caf1fbbe170c172833e1bbc
```

A different hash means a different package; identify it rather than assuming identical contents.

### 2.3 Input identification rules

Match source images using file identity, dimensions, full fingerprints from `data/frames.json`, and visual inspection where needed. Dimensions alone are not a unique identifier. A renamed but byte-identical file is fine. A resized or recompressed replacement must be identified and checked before its coordinates are reused.

Never crop production art from a numbered preview. Never guess rectangles, invent missing files, or silently substitute an online asset. Preserve originals unchanged.

---

## 3. Stage A — Audit and reproduce the actual Combat Room baseline

### 3.1 Identify exactly what is being extended

Record the source archive or repository commit, the internal version/checkpoint, relevant hashes, build commands, and actual runtime dependencies. The archive name and an internal version string may differ; report both.

Read the supplied baseline reports and tests. Distinguish a report of a past pass from a test you executed now. Preserve frozen Room Creator checkpoints and unrelated Encounter work.

**Do not mandate Unity, PlayCanvas, Three.js upgrades, Rapier, Yuka, or any other replacement merely because it appeared in research.** Retain the runtime actually supplied unless a concrete blocker is demonstrated. A necessary engine/library change is an explicit decision, not a silent convenience.

### 3.2 Inspect these named locations, then follow the actual call paths

The following are manifest-reported locations to verify, not guaranteed current APIs:

| Inspect | Establish |
|---|---|
| `rc/source/ui-combat.js` | Setup/reset, actor records, current player/NPC split, action resolution, damage, local bot decisions, animation, and event recording |
| `rc/source/ui-route.js` | The route graph, movement, coordinates, supports/elevations, collision/sight queries, controls, and combat hooks |
| `rc/tools/build_combat_characters.py` and `characters/combat/` | Existing atlas generation, frame origins, pose bindings, and embedded asset handling |
| `rc/tools/make_combat_room.cjs` | Scene generation, bots, movement links, and combat setup |
| `rc/source/build.py`, `rc/source/build_combat_play.py`, `source/shell.html` | Source assembly, dependency embedding, and playable output generation |
| `rc/source/vehicle-world.js`, `route-traffic.js`, associated vehicle adapters and scene configuration | Which vehicle runtime actually owns poses and contacts in the selected scene |
| `rc/source/asset-contract.js` and the prop renderer/collision path | Accepted model format, geometry placement, and whether imported props block movement and sight |
| `rc/examples/Combat_Test_Room.room.json`, `Block_triple_shop.room.json` | What can genuinely be reused for the proof |
| `rc/COMBAT_NPC_STANDARD_V0_1.md`, `COMBAT_ROOM_V0_1_REPORT.md`, `TRAPSTAR_COMBAT_ROOM_KERNEL_AND_CLAUDE_STEERING_v0_1.md` | Current intended behavior and known limitations |
| `rc/tests/combat_scene.test.js`, `rc/tests/combat/`, and relevant movement/vehicle suites | Runnable baseline coverage and regression obligations |

Trace manifest-reported functions such as `cbStep`, `cbPlayerPre`, `cbNpcStep`, `cbApplyHit`, `cbPose`, `cbRecord`, `rwEdgeBlock`, and `rwBuildSight` into their real definitions and callers. Do not patch from names alone.

Answer these questions before introducing a shared actor:

1. Who writes player position, NPC position, vehicle position, and camera position today?
2. What are the simulation clock, fixed-step behavior, seeded-random source, and render update order?
3. How do horizontal coordinates, story IDs, and physical elevation map into the renderer?
4. Are hit regions currently derived from sprite/card dimensions? Which old damage rules must remain unchanged outside the proof?
5. What does a bot actually know, and where does its current decision process run?
6. Which vehicles are legacy lane traffic and which belong to Vehicle World? Which one can support this tile without competing authorities?
7. How are doors, route gates, collision, and sight rebuilt? Which facts can already be reported?
8. Does the packaged file really boot from disk with its dependencies embedded?

The manifest describes north as `-y`, but do not assume its horizontal `y` is the renderer's up axis. In the candidate street, story 2 is at world elevation zero and lower story IDs are below it. Do not hard-code `height = storyId × floorHeight`.

### 3.3 Reproduce before changing

In a scratch copy, try the manifest's reported build sequence, verifying it against the actual files:

```text
python3 tools/build_combat_characters.py
node tools/make_combat_room.cjs
python3 source/build.py
python3 source/build_combat_play.py
```

These commands are reported to run from `rc/`. Record any corrected commands required by the actual checkpoint. Do not edit `Play_Combat_Room.html` by hand; it is generated output.

Run the relevant available baseline tests and a browser smoke test. Capture exact commands, environment, results, and pre-existing failures. Do not reuse catalogue totals as a current test count.

Create a new branch/working copy for this pass. Keep the original scene and original playable output as regression references. Add the proof scene/output instead of quietly converting every old scene to the new physical model.

**Stage A exit:** Actual source identity, successful build or precisely documented blocker, baseline evidence, and a short source-backed map of the changes required.

---

## 4. Stage B — Define and implement one shared actor contract

Implement the smallest common representation that the inspected runtime needs. Reuse existing identity, action, event, and movement records where practical. Do not introduce a general-purpose entity framework as a prerequisite.

The field names below describe responsibilities. They are not assertions that these APIs already exist.

### 4.1 Required concerns

| Concern | Required behavior |
|---|---|
| Identity | Stable actor ID across controller switches, appearances, holds, throws, impacts, recovery, and downed state |
| Physical profile | Explicit height, footprint/collision shape, weight or mass treatment, and movement parameters independent of frame bounds |
| Transform | One authoritative world/root pose with documented feet/support origin and facing |
| Motion | One execution path handling supported movement, airborne motion, and being held |
| Support | A known stationary or moving support, with a local attachment position where applicable |
| Conditions | Small reusable conditions for stagger, incapacitation, holding, and being held; no personality-specific physics |
| Capabilities | Which actions are available from equipment, abilities, and current restrictions |
| Controller | Human input, one selected decision provider, or an explicitly labeled deterministic test driver |
| Presentation | Appearance ID, animation/action binding, facing, offsets, and effects; reads physical state |
| Relations | Explicit holder/held relationship and collision policy; no hidden deletion of a held actor |
| Events | Accepted actions and physical consequences recorded through the host's existing mechanism or a labeled local test log |

**Shared implementation does not mean identical statistics or abilities.** A slightly larger character may have a different body profile. A guard may have a rifle. The normal player must not acquire a firearm simply because the old Combat Room's player had one.

### 4.2 Body and visual normalization are separate

Start with one common body profile for equality tests, then a modest parameter variant to demonstrate supported size variation. Choose reversible provisional values from the actual source and document them. Do not invent final canonical heights or masses.

One collider or comparably simple existing shape is sufficient. Use existing physical query machinery where it can meet the requirements. No articulated anatomical simulation or ragdoll is required.

A wider punch picture must not widen the whole actor's collider. A short falling picture must not shrink its mass or health regions. A source change from `PLB` to `GNR` must not alter body behavior when the body profile is held fixed.

Keep collision shape, action reach, and damage regions explicit and conceptually distinct. Deliberate physical changes such as an implemented crouch must be state-driven, not inferred from opaque pixels.

### 4.3 One movement authority per actor

Use a small, explicit motion-state arrangement equivalent to:

- **Supported:** standing or moving on a valid surface, including a moving car.
- **Airborne:** jumping, falling, knocked off a support, or thrown.
- **Held:** positioned by a validated holder relationship, with world obstruction checks.

Stagger, attack phase, health, and controller are separate concerns; do not multiply them into dozens of combined movement states.

At each simulation step, one motion executor owns the actor transform. Route following, airborne integration, car-support motion, and held attachment must not all write competing positions.

Changing controller must not reset identity, health, velocity, support, or physical parameters. Clear stale input and pending action ownership safely so a control swap does not double-execute an attack.

### 4.4 Shared action execution

All controllers submit to the same action validation/execution path. The proof needs equivalents of:

```text
move / face
jump
punch
kick
grab
release
throw
```

These are semantic action names, not prescribed function names.

Validation includes capability, current condition, range, facing where relevant, line of reach, target validity, and physical clearance. Requests are not outcomes. Reject impossible actions with a readable reason in debug mode.

A visual contact frame never decides that a hit occurred. An accepted hit or state transition causes the presentation, not the reverse. Use one action ID or equivalent correlation mechanism so a single punch does not hit repeatedly because several render frames overlap the target.

### 4.5 Keep decisions outside physical execution

Reuse the existing Encounter decision provider only if it is actually available and compatible. Do not claim Encounter integration from similarly named local functions.

For this physical proof, a small deterministic test driver is acceptable: hold position, fire a readable shot if the existing verified gun path supports it, or request a counter after recovery. It must use the shared action interface, remain clearly labeled, and not grow into a second squad brain or persistent world history.

A test driver can prove action execution. It does not prove autonomous tactical intelligence. If existing bot movement would fight the new actor executor, disable or adapt that movement for proof actors explicitly rather than leaving both active.

**Stage B exit:** The actor contract is implemented on the branch, with at least two appearances using it and a debug control-swap/body-invariance test.

---

## 5. Stage C — Normalize a deliberately small, explicit asset subset

Do not clean all 2,382 catalogue entries. This prompt selects a **140-record starter subset** from the inspected `data/frames.json`. This selection is a working default for the proof, not a claim that these are final casting choices or that their original images are already present.

### 5.1 Exact starter selection

For directional selection below, the builder's canonical five views are `F`, `FQ-R`, `S-R`, `BQ-R`, and `B`; its mirrored views may reuse these. Preserve the original source IDs and record any transform.

| Role | Selection | Source records |
|---|---|---:|
| Player external body | `PLB`: all frames in `idle`, `run1`–`run6`, `ready`, `armsup`, `pain`, and `death` | 54 |
| Pistol-guard appearance | `GNC`, color `@gray`: canonical five views of `idle`, `walk1`–`walk4`, `shoot1`, and `shoot2`, plus all seven `death_clean` frames | 42 |
| Rifle-guard appearance / normalization cross-check | All `GNR` frames: `run1`–`run4`, `aim`, `fire`, and `death` | 35 |
| First-person hands | `TH1.f09`, `TH1.f10`, `TH1.f11`, `TH1.f13`, `TH1.f20`, `TH1.f21` | 6 |
| Temporary kick | `FPW.kick.1`, `FPW.kick.2`, `FPW.kick.3` | 3 |
| **Total** | Unique source-frame records; mirrored instances do not require duplicated source art | **140** |

The IDs and this total were checked against the supplied frame database while drafting this prompt. They have not been extracted or visually certified from original images by this document.

Use `GNC` as the initial active defender and `GNR` as a selectable second appearance/test actor. Two simultaneously intelligent opponents are not necessary for the first physical milestone. Preserve their independent weapon definitions; selecting a costume must not automatically select a disposition.

### 5.2 Original-image checklist

| Code | Manifest's original filename | Dimensions | SHA-256 prefix for initial identification |
|---|---|---|---|
| `PLB` | `iH9foXw.png` | 756 × 1044 | `9267e519dba5ab43` |
| `GNC` | `24175.png` | 2945 × 3304 | `7c48e6b7f3470e75` |
| `GNR` | `dm54n38-e8f0900b-c660-4192-b158-858426919e1c.png` | 500 × 700 | `19a76842ca3af306` |
| `TH1` | `w0DngzM.png` | 594 × 738 | `da1af281d9858423` |
| `FPW` | `140567.png` | 815 × 1064 | `b8dcde97d45598e1` |

Use full hashes from the database for byte-identity checks. A short prefix in this table is only an identification aid.

### 5.3 Build a repeatable subset importer

The pipeline must be executable from a clean working directory:

```text
original inputs + source frame database + explicit selection
    → validated cuts and masks
    → stable origins, scale, and facing transforms
    → concrete runtime animation bindings
    → packed atlases and metadata
    → visual inspection in the same playable application
```

Extend or wrap the existing atlas workflow instead of replacing it unnecessarily. Claude may prepare standalone extraction tools outside ROOM; Nova performs changes to ROOM's own build tools and runtime bindings.

The importer must fail clearly for missing sources, hash/dimension mismatches needing review, invalid rectangles, empty cuts, invalid seeds, missing frame references, or unresolved action aliases. Report errors together where possible; do not silently export blank success placeholders.

Keep a machine-readable subset list containing the resolved frame IDs and transformation settings. Retain provenance from each derived frame back to its original image and source rectangle.

### 5.4 Extraction rules for this subset

**`PLB` and `GNR`:** transparent grid sheets. Preserve whole cells where that fits the existing renderer: `PLB` cells are 108 × 116; `GNR` cells are 100 × 100. Alternatively trim them while preserving equivalent origin offsets. Do not mix cell-relative and tight-crop-relative anchors.

**`GNC`:** use method B with the source-specific cyan removal described in the manifest. Resolve `@gray` explicitly. Keep cell labels/grid lines out of output. Do not apply a color-block offset twice if the selected database rectangle already includes it.

**`TH1`:** use method C and every seed listed for the chosen frame. A rectangle alone may include neighboring hand fragments. Check that every seed belongs to foreground; do not interpret background label zero as the desired component.

**`FPW.kick`:** use the specified transparent rectangles. This is a declared boot/clothing stand-in, not a finished visual match to the player.

Other extraction methods are outside the selected subset. Do not spend this pass repairing `SWN`, `ARM`, or `TKW` merely because they appear in the catalogue.

### 5.5 Scale, origins, and facing

Start from the manifest's source calibration, treating its assumed real heights as provisional:

| Code | Reported source pixels per meter |
|---|---:|
| `PLB` | 59.4 |
| `GNC` | 48.3 |
| `GNR` | 48.6 |

Calibrate from a standing reference and keep that source scale across actions. Do not resize every frame to a common bounding-box height or width. The six first-person hand images are screen-space presentation, not world-space bodies.

Preserve a stable root/feet origin. When converting tight rectangles into whole-cell coordinates, account for the crop offset in both axes. When trimming, retain the removed margin. When mirroring or resizing, transform anchors and attachments along with the pixels.

Use the actual renderer's pixel-coordinate convention for mirrored anchors. Avoid applying both a pre-mirror and the runtime `|m` flag. `PLB` turned views already face right; `GNR` turned views face left and need the documented mapping. `GNC` selection uses its right-facing views.

Do not use the manifest's suggestion to use tight visual bounds for hit testing as a replacement for the shared physical body. Preserve visual bounds for rendering/inspection; physical hit regions remain actor-state data.

Use the source-appropriate pixel-art sampling described in the manifest. Do not downsample originals merely to reduce delivery size. Atlas packing or lossless packaging is allowed; an intentional visual degradation must be disclosed.

### 5.6 Compile real animation bindings

The manifest's `builder_pose_lists` is guidance, not a ready runtime file. Convert strings such as “run lists, played slower” into concrete arrays plus playback settings. Resolve descriptive keys such as `fire (NEW)` into actual supported runtime names.

Bind the actions this proof uses: stand, walk/run, aim/fire where applicable, flinch/stagger, airborne, held, thrown, landing/recovery, and downed. This does not require original art for every action. It requires an explicit, visible fallback policy.

Suggested economical fallbacks:

- `PLB.armsup` for a temporary airborne presentation.
- Each appearance's own idle/hurt/death-start frame for held/thrown reactions, moved or tilted as presentation.
- `TH1.f20` for a short punch presentation; `f09`/`f10` for reach; `f21` for hold; `f13`/`f11` for release.
- The three listed kick frames for the temporary kick.

These are fallbacks, not newly discovered animations. Do not switch every thrown actor to `SWN.death_blast`; that would change its appearance/identity. External-body punch/grab art remains incomplete even when the physical action works.

### 5.7 Inspect the result, not just the metadata

Generate selected-frame contact sheets on light and dark backgrounds, and inspect them at original-pixel and gameplay sizes. Check clipped extremities, background halos, neighboring pixels, missing fingertips, facing mistakes, and origin wobble.

Add a debug inspection mode to the same playable page: ground reference, visible body bounds, actor ID, source frame, action/facing controls, and freeze/step. This is a diagnostic mode, not a separate replacement deliverable.

**Stage C exit:** Reproducible selected atlases and executable metadata; explicit fallbacks; a readable normalization report; the selected appearances rendering at consistent world scale without altering physical behavior.

---

## 6. Stage D — Assemble the single physical playground tile

### 6.1 Candidate and scope

Use `Block_triple_shop.room.json` as the first candidate, after checking the actual scene. It is a proposal from the manifest, not an already approved production level. A source-backed reason may justify a simpler existing tile; document the substitution without building a new city.

The chosen tile needs only:

- A safe spawn and short authored approach.
- One accessible raised support or ledge.
- One existing moving car with a validated rideable roof.
- One active defender and optional second appearance/test actor.
- One generic two-state obstacle with an authored gameplay consequence.
- Useful movement connections between those opportunities.

The manifest reports no combat cover spots and a thin route graph in the candidate street. Inspect and author the required connections; do not assume the supplied scenery is already a useful combat layout.

Reuse the existing car/model where possible. Do not make importing the spare vehicle packs or developing a drivable-car simulator part of this pass.

### 6.2 Minimal modularity for later composition

Preserve metric units, a clear tile-local origin, boundary connection identifiers, and instance-qualified actor/piece/route IDs. Record elevation and road/walking connections that a neighboring tile would need.

Do not implement a city generator, streaming system, cross-tile AI, or multiple loaded districts. Later expansion means connecting compatible instances, not nonuniformly stretching geometry and invalidating actor sizes or jump distances.

### 6.3 Routes and airborne motion

Keep authored route movement as the grounded foundation. A jump or throw can temporarily leave the graph, but must remain collision-checked.

Landing requires a valid support, clearance, and a documented transition back to the appropriate route or local support movement. Do not snap an actor to an arbitrary nearest route through a wall or onto another floor.

Jump targeting, limited air steering, support acquisition tolerance, and movement speeds are working tuning decisions. Put them in one inspectable configuration and document them. Do not quietly convert the whole game to unconstrained free roaming.

### 6.4 One vehicle authority and a real moving support

After the source audit, select the existing vehicle path appropriate to the proof. Prefer reuse of verified Vehicle World capability where practical; do not activate legacy traffic and Vehicle World simultaneously for the same vehicle. Preserve unrelated legacy scenes and their baseline behavior.

The vehicle's owner supplies its pose. Actor support follows that pose; actor code does not independently drive the car.

Validate the roof's actual bounds and height from the supplied model/source geometry. A footprint table alone is not roof geometry.

Prove that an actor can land from above, be carried by the vehicle's motion, jump off, and land elsewhere without drift or double-applied velocity. Define how support velocity contributes to departure exactly once. Explicitly handle support loss, reset, and vehicle removal.

A supported passenger must not be counted as a pedestrian standing in front of that same car. An airborne body above the roof must not register a road-level collision merely because its horizontal position overlaps the lane. Apply vertical clearance and contact checks consistently.

Retain the verified vehicle driver's sensing and braking behavior. Do not make the car ignore people just so the throwing demonstration succeeds. Use a repeatable setup to demonstrate a valid near impact and a separate case where the driver can stop. The manifest's approximate stopping-distance calculation is not a runtime guarantee.

### 6.5 Punch and kick

Use shared target validation and hit resolution. Punch should provide a short interrupt/displacement; kick can produce a stronger displacement. Exact values are provisional.

Attacks need bounded windup/contact/recovery or an equivalent explicit timing structure. One accepted strike produces one hit. Spamming input must not bypass recovery or multiply damage across render frames.

Keep slow attritional melee lethality possible, as the governing context allows. Do not balance this proof as an ordinary high-health punch fest. A recovering opponent can counter or create firearm exposure; effects should make that danger legible.

The minimum counter proof can be driven by the labeled test driver. Do not claim a full squad or finished autonomous AI from it.

### 6.6 Grab, carry, release, and throw

Use one generic actor-holding mechanism, not a separate implementation per skin or future role.

A valid grab checks reach, obstruction, target conditions, and capability. Disallow self-grabs, cyclic holds, and two holders owning the same target. A failed grab must not leave a partial attachment.

While held, the target keeps its identity, physical root, and relevant world presence. Its own locomotion/controller must not fight the holder. Define a scoped collision policy for the holder-target pair without making the target pass through walls or other actors.

Carrying restricts attacks according to a documented provisional rule. A held target that cannot fit through an opening must block or resolve the movement safely; hiding its sprite is not a solution.

Release places the target in a physically valid supported or airborne state. Throw releases the relationship, applies the chosen velocity/impulse through shared motion, and preserves identity and body parameters. Test releases near walls, on a moving support, and while airborne where the proof permits those actions.

Define safe cleanup when the holder dies, is disabled, resets, or disappears. Recovery from a throw must not teleport the target back to its old route point.

The future woman's grip/struggle/slime modifiers are deferred. Do not invent their final rules to make this physical hold test work.

### 6.7 Impacts and hazards

Use generic contact/impact information: involved identities, relative motion or existing severity measure, location, time/tick, and cause/action reference as available. A throw into a wall, a vehicle strike, and a landing may have different authored responses but must not depend on hard-coded character names.

Inspect the existing vehicle severity units before reusing their thresholds. Do not assume they are already a universal damage model.

Protect fast motion against tunneling using the smallest compatible swept-query/substep approach. The visual endpoint of a throw is not enough to determine what was hit between frames.

A contact episode must not apply lethal damage every simulation step while two bodies remain touching. Distinct legitimate impacts may produce distinct consequences; duplicate processing of the same impact must not.

Player and NPC share physical hazard rules. Exact injury tuning, fall thresholds, and recovery times remain provisional and configurable.

### 6.8 One real state-swapping obstruction

Use a reusable two-state definition for this proof, not a custom `if this wall was hit` script. Choose a source-verified wall/barrier pair or an explicitly labeled primitive stand-in.

A practical first consequence is **blocked → passable through an authored opening**. Author the corresponding path connection; a hole in a texture does not create a route. Check imported model bounds, alignment, and collision rather than assuming all wall pieces fit the same slot. In particular, half-width is not half-height.

Keep the same piece identity across states. Update rendering, collision, sight/cover where applicable, and route availability coherently. Remove the old collider; avoid a decorative prop opening while an invisible scene wall continues blocking the same space.

Effects follow the committed physical change. The swap must still work with dust and sound disabled. No live fracturing, permanent fragment simulation, or requirement to make every object breakable.

Use `state` terminology for degradation; do not overload props' existing directional `variants` field.

**Commit ordering:** The owner handoff leaves final ROOM–Encounter timing unresolved. For a ROOM-only proof, an explicitly labeled local driver may apply one physical transition and record one local fact. That does not settle the future Encounter protocol or create persistent Encounter history. If real Encounter is the active host, inspect and use its approved execution contract; if the required order is genuinely undecided, resolve that boundary before cross-system mutation. Never implement both competing commit paths.

Handle an actor standing in/on a changing piece: revalidate support and obstruction, then fall or resolve penetration by a documented policy. Do not leave it floating on vanished geometry.

**Stage D exit:** All physical demonstrations run in the same tile/application through normal input, not only through scripted coordinate jumps or a debug “pass” button.

---

## 7. Controls, diagnostics, and repeatability

Audit the old bindings before assigning new ones. The manifest reports Space/click firing and Q/R turns; Space must not both jump and fire after this pass.

Expose a short in-game control legend for movement/look, jump, punch, kick, grab/release, throw, restart, and debug. Preserve working pointer capture and allow escape from it. The normal player has no gun or fireball action.

The debug panel should show actor identity, controller type, body profile, motion state, support ID, holder/held IDs, current action, health/conditions, selected visual frame, vehicle authority, and obstruction state. Show rejection reasons for invalid physical actions.

Provide deterministic reset presets for the car landing, throw/contact, ledge, and obstruction demonstrations. Presets may position the scene before a test; they must not teleport actors through the interaction being tested.

Control swapping is a debug architecture test, not a new playable-role-selection feature. Swapping control does not rewrite appearance, equipment, health, or physics. Do not use it to add a firearm to the normal player.

Retain the host's clock and seeded behavior. Do not drive damage, movement, or degradation from animation frame callbacks, wall-clock time, or unrelated timers. Document any tested numeric tolerances rather than claiming unverified bit-for-bit determinism.

---

## 8. Acceptance tests and required evidence

Turn these targets into actual automated checks where practical, plus browser/manual evidence for visual and control behavior. Status must be one of **PASS, FAIL, BLOCKED, NOT RUN, or DEFERRED**. “Implemented” and “looks plausible in code” are not test results.

| ID | Test | Required evidence |
|---|---|---|
| A01 | Actual source and reproducible build | Source identity, commands, generated output, and a real boot; no manifest-only claim |
| A02 | Baseline preservation | Before/after results for relevant existing suites; pre-existing failures separated from new failures |
| A03 | Input failures | Missing source/image or mismatched dimensions produces a clear error, not a blank successful build |
| N01 | Exact subset | 140 intended unique records resolve, or every deliberate scope change is itemized; no silent alias/color mismatch |
| N02 | Image extraction | Nonempty output, valid rectangles/seeds, no annotation contamination; inspected light/dark contact sheets |
| N03 | Origins and scale | Frame changes do not inflate/shrink the actor or cause unaccounted root jumps; source-relative offsets retained |
| N04 | Bindings | Runtime action/facing mappings contain concrete frames/settings, no unresolved prose; fallbacks are listed |
| B01 | Visual/body independence | Change appearance while holding body profile fixed: collision, reach, mass treatment, and hit regions remain unchanged |
| B02 | Controller independence | Switch human/test control on existing actors without recreating them; IDs and physical state remain intact |
| B03 | Shared parameterization | Two modest body profiles use the same execution path; no skin-name or player-ID physics branches |
| B04 | One transform writer | No simultaneous route, airborne, support, and hold updates fight for an actor's pose |
| M01 | Jump, collision, and landing | Successful landing and blocked/failed landing tested; no wall traversal or arbitrary snap to a distant route |
| M02 | Car support | Ride for a documented interval, depart, and land; measured support error within a declared tolerance; no false self-car strike |
| M03 | Vehicle contact | Near impact and stoppable approach are distinct; vertical separation respected; one contact is not repeatedly charged |
| M04 | Strike and counter | Punch/kick interrupt/displace once; cooldown holds; counter is possible through shared execution |
| M05 | Holding invariants | Valid grab, obstructed grab, self/cycle rejection, carry clearance, safe release, and holder-loss cleanup |
| M06 | Throwing | Identity-preserving throw against wall/car/drop; no tunneling, double launch, or teleport back to old route |
| M07 | Player/NPC physical parity | Under matched profile and inputs, the same hazard and throw rules apply regardless of controller |
| D01 | Physical state swap | Same piece ID; visual/collision/sight/route results match; no invisible old blocker |
| D02 | Cause and effects separation | Qualifying impact produces one transition; repeated processing is deduplicated; disabling effects changes no outcome |
| D03 | Support revalidation | An actor on/in changed geometry is resolved by policy, not left floating or embedded |
| R01 | Reset | Repeated restart removes stale holds, supports, actions, input, colliders, and duplicate event listeners |
| R02 | Timing | Replay the same test input at different render rates against the simulation clock; report final-state/event tolerances and any divergence |
| R03 | Legacy regression | Original Combat Room and scenes without the new opt-in data retain their prior behavior |
| P01 | Final packaged launch | Test the delivered output, not just a development server; report platform, browser, launch method, console errors, and network dependence |

### Additional presentation checks

Show the player external body and both guard appearances at the same reference scale. Show the declared temporary kick and held/thrown fallback. Show car landing and departure, one throw/contact outcome, and the obstruction before/after.

Screenshots support appearance checks but do not prove movement. Pair motion claims with executable tests, a short recording when available, or precise manual reproduction steps and observations. Do not fabricate a recording or a passed manual test.

### Packaging target and platform honesty

Preserve the actual Combat Room's self-contained browser packaging where feasible. The desired user-facing artifact is one generated page that can be opened locally on Windows without fetching libraries, fonts, models, or textures from a network.

Test that exact artifact. A localhost success is not proof of `file://` success; a Linux headless run is not a verified Windows launch. If Windows or a required browser is unavailable, mark the Windows acceptance test **NOT RUN**, provide the exact offline test steps, and state the limitation.

Do not silently change the delivery to a server-dependent app, a framework project the user must compile, or several manually arranged asset folders. A discovered packaging blocker needs a specific explanation and proposed remedy.

---

## 9. What remains deliberately outside this pass

Do not expand this assignment into the full game. Defer:

- Slime-resource balance, raw versus pre-slimed capture, the woman's struggle/escape behavior, pod formation/completion, and rescue.
- The four-person squad, complete pistol/rifle/bomb repertoire, and full aggressive/defensive/sneaky tactical behavior.
- Dynamic fracture, ragdolls, cloth, new anatomical rigs, full ZANT integration, and new character art production.
- More districts, city streaming, traffic-system replacement, new engine adoption, or large-scale navigation reconstruction.
- Cleaning every sheet, all eleven `GNC` colors, all spare car packs, or unrelated effects libraries.

Leave the foundation compatible with the later loop without implementing speculative fields and subsystems for every future feature.

For later work, preserve these existing design decisions: weapon and disposition are independent; the normal player uses melee/mobility/slime rather than guns or fireballs; enough melee hits may kill slowly; pod formation is not victory; after formation, encasement progresses over time while the player can defend; exact rescue/integrity interaction remains unresolved. Do not inadvertently rewrite those decisions in a temporary proof.

A successful physical proof is not a claim that capture gameplay, squad intelligence, persistent Encounter integration, or city-scale composition is complete.

---

## 10. Decision handling: move quickly without inventing approval

### Reversible working choices

Choose source-compatible provisional values and record them in one tuning/decisions section: body dimensions, mass treatment, action reach, timings, jump parameters, throw strength, injury thresholds, landing tolerances, sprite playback speeds, and the first obstacle's threshold.

Likewise, choosing the candidate tile, the selected gray guard, an actor-owned visual fallback, or a minimal diagnostic control layout can be documented as a working proof choice. Do not stall on every value that requires playtesting.

### Genuine gates

Stop the affected work and ask a focused question when:

- Actual source/original assets cannot be obtained from available authorized sources.
- The branch/checkpoint is genuinely ambiguous or preserving the frozen baseline is impossible.
- The executor is not authorized to change the required subsystem.
- Satisfying the task would require an engine migration, replacing Vehicle World, or changing authoritative Encounter contracts.
- Real Encounter integration requires an unresolved commit/ownership decision that a local proof cannot legitimately settle.

Ask for the smallest missing input or decision. Continue independent, in-scope work. Do not label a blocked physical runtime as a completed game because its documentation or contact sheet is finished.

---

## 11. Deliverables

Use these as proposed output names, not claims that the files already exist:

| Deliverable | Contents |
|---|---|
| `Play_Action_Physical_Proof.html` | One built playable page with normal interaction and optional diagnostics |
| `ACTION_PHYSICAL_PROOF_SOURCE.zip` | Reproducible source branch/working copy, scene data, preparation/build scripts, tests, and required derived assets; no overwrite of the original checkpoint |
| `SHARED_ACTOR_STANDARD.md` | The actual implemented contract, authority/motion rules, capabilities, and mappings to existing code—not merely this prompt copied back |
| `ASSET_SUBSET_MANIFEST.json` plus atlases/metadata | Resolved selected IDs, input hashes, transforms, runtime bindings, and fallback provenance |
| Contact sheets / inspection images | Evidence of the selected normalized art and origins |
| `ACTOR_PHYSICAL_PROOF_REPORT.md` | Source baseline, implementation decisions, changed paths, exact test outcomes, visual checks, known gaps, and instructions for the next session |
| `README_FIRST.md` | What to open, controls, how to reproduce the physical demonstrations, and any unverified platform requirement |

These may be bundled together to reduce clutter. Do not create a pile of redundant reports. Put the playable file and source package where the user can actually obtain them; verify exact paths, file sizes, and hashes before presenting download links.

The final report must distinguish:

1. What was read and verified against actual source.
2. What was changed and generated.
3. What was executed and passed.
4. What failed, remains blocked, or was not run.
5. What is a visible temporary stand-in.
6. What comes next after the physical proof—not a broad new redesign.

Do not provide a percentage-complete estimate based on sprite counts. Do not claim success because an output file exists. Open and test the output.

---

## 12. Finish line

This pass is complete only when the delivered evidence shows:

**One actual source-based browser runtime. One modular tile. One shared actor implementation. A small normalized asset subset. One moving car. Physical melee, hold/release/throw, and a meaningful state-swapping obstruction. Preserved baselines. Honest test results.**

A missing or untested required part keeps that part incomplete; document it rather than disguising it with a placeholder or a claim of future work.

Start with the source/input gate, then progress directly through the shared actor and selective normalization into the physical interaction proof. Keep source changes owned by Nova, preserve Encounter's authority where it is actually integrated, and let presentation follow the physical state.

**Build the common physical language first; use it immediately in a playable scene.**

---

## Source references for this prompt

These references are relative to the supplied documents so the prompt remains usable in another session without chat-specific citation tokens.

- **Owner gameplay:** `FIRST_ENCOUNTER_ACTION_PLAYGROUND_CONTEXT_2026-11-15.md`, especially player fragility/melee, physical movement, capture progression, and implementation boundaries.
- **Owner degradation:** `ROOM_MODULAR_DEGRADATION_MANIFEST_HANDOFF_2026-11-15.md`, especially §§3–9: general state swaps, physical consequences, authority, open commit timing, and proof targets.
- **Review basis:** `ACTION_PLAYGROUND_MANIFEST_REVIEW_AND_ASSEMBLY_PLAN_2026-11-15.md`, especially §§2, 4–7, and 9–10: evidence limits, common actor, normalization, candidate tile, one authority, and implementation order.
- **Inventory and hierarchy:** Manifest `00_START_HERE.md` §§1–7 and `90_ARCHIVES.md`.
- **Runtime map:** Manifest `16_BUILDER.md` §§1–2, 5–9. These are source-reading claims to verify, not runtime proof.
- **Street and vehicles:** Manifest `17_STREET_AND_VEHICLES.md` §§2–8. Candidate topology, vehicle runtime distinctions, and explicit missing capabilities.
- **Selected character art:** Manifest `10_CHARACTERS.md`, `11_FIRST_PERSON.md`, `18_MORE_ENEMIES.md`, and `data/frames.json`.
- **Preparation:** Manifest `20_SLICING_AND_SCALE.md` §§1–8 and 10. Source-specific extraction, origins, scale, and executable-mapping work.
- **Degradation integration:** Manifest `21_MODULAR_DEGRADATION.md` §§2–4 and 6–10. Existing door/gate/sight patterns, naming collision, ownership/timing questions, and proof targets.

**No additional web research, engine recommendation, original-image extraction, or actual Combat Room execution was performed to create this prompt.** The 140-record selection is a database check; the build and its acceptance tests remain the executor's work.
