# FIRST ENCOUNTER
## Pre-build review and proposed first-fight specification

**Prepared for Teddy · November 16, 2026 · v0.1**  
**Status: RESEARCH COMPLETE ENOUGH FOR OWNER DECISIONS; SOURCE INTAKE AND EXECUTION AUTHORITY STILL OPEN.**  
**This is a preparation document, not permission to start implementation.** No game source, repository, branch, account configuration, or Codex environment was changed during this review.

> **First deliverable: ten seconds of satisfying, repeatable first-person fisticuffs.** One player, one reactive sparring opponent, one compact warehouse room. Smooth movement; sparse, forceful artwork; responsive combinations; readable guard, parry, counter, and stagger.

---

## 1. Decision in plain language

Use the **existing ROOM / Three.js action runtime**, starting from the newest verifiable Action Playground source delivery. Put the new game in an independent repository with exact links to its sources. Do not port to PlayCanvas, Unity, Godot, or a new physics engine for this milestone.

The useful investment is already present: physical actors, a generated first-person page, a warehouse-sized Wreck room, source-build machinery, and regression tests. The missing investment is the exchange itself: distinct punch behavior, hand recovery, clear opponent animation, a real parry, responsive input, and a sparring controller that can move and respond without cheating.

**Do not make the complete character creator, the complete Encounter integration, or the complete warehouse destruction game prerequisites for this exchange.** Conversely, do not represent a standalone training driver as the completed Encounter brain.

There are two practical blockers before a hands-off Codex run:

1. The newest action source must be available as real files in the execution workspace. Indexed code and release reports are readable, but the file service did not supply the requested ZIP/HTML/patch bytes in this preparation session.
2. The owner must explicitly authorize Codex to modify the **new game's copied action-runtime files**. Existing Lab instructions prohibit Codex from editing ROOM. A new repository name alone does not remove that restriction.

The remaining major design choices are controls and arena movement. Recommendations are in section 14.

### Evidence terms used below

- **READ:** directly inspected source, repository metadata, or document content in this session.
- **REPORTED:** a source describes a previous test or implementation result; not rerun here.
- **MEASURED HERE:** a local inspection actually executed here.
- **PROPOSED:** a recommendation or starting value, not an owner-approved rule.
- **BLOCKED / UNVERIFIED:** the required access or evidence is absent.

No existing game test suite, external fighting-game suite, or hardware performance benchmark was executed in this session. Reported passing tests are not new certification.

---

## 2. What the owner has actually selected

The latest conversation controls this new scope. Older four-defender, damsel, slime-pod, weapon, and city objectives remain historical context, not this build's acceptance criteria.

### First playable scope

One human-controlled physical actor and one NPC-controlled physical actor. Player-first development, with the opponent responding almost immediately rather than a long player-only development phase. Grounded light combinations, a heavy punch, movement, guarding, parrying, counters, guard damage, and temporary stagger. The opponent is a training partner who matches pressure and occasionally checks overcommitment, not an aggressive boss with a large health bar.

The visual target is retro 1990s arcade character presentation: a few deliberate key poses, not smooth full-body animation. The camera, input, movement, and collision remain responsive between those drawings. First-person hands and world-facing opponent animations are separate presentations of shared actions.

### Expansion order, not authorization to expand automatically

1. Ground exchange and defensive timing.
2. Jumping, air-oriented kicks, flying/bicycle kicks, knees, and universal environmental Grab.
3. Punchlines, BASED interpretation, and psychological Momentum.
4. Environmental hazards, destruction, vehicles, and larger stunt sequences.

The clinch is a subsequent escalation mechanic, not required to make initial punches enjoyable. Weapons, rope/hookshot, full faces, multiple opponents, multiplayer, prestige, and the wider city are outside this first implementation contract.

### Retained production principles

ROOM owns authored physical space and its physical execution. Encounter owns semantic identity, interpretation, choice, causal meaning, and history when integrated. Character presentation owns drawings and expressions, not hit truth. The human is another decision source, not a special physical species. Environmental destruction uses authored state changes rather than live fracture simulation. [P1, P3, P4, P6]

---

## 3. What exists, and what does not

### 3.1 Action Playground v0.3.3 is a useful physical donor

**READ / REPORTED:** The November 16 v0.3.3 report describes an enclosed Wreck room measuring **7.8 × 9.4 metres internally**, with a **4.2-metre ceiling**, **3.0-metre window opening**, and a **1.5-metre raised weak floor**. It contains six state-changing object types: barricade, glass, wall, crate, bin, and weak floor. These are simple colored shapes, not a finished warehouse art pass. [P1]

Its report records **53/53 existing and Claude-supplied Node test files passing**, a separate **10/10 Wreck test**, **20/20 Wreck stress runs of 45 simulated seconds**, and **6/6 pointer-capture checks**. These are useful inherited receipts, not tests performed by this reviewer. [P1]

The report also explicitly says that martial-arts moves, opponent decision logic, hand art, hold design, and Encounter integration were not changed. The newly green physical tests do not establish an enjoyable fight. Windows double-click operation and hardware WebGL performance were not verified in that release report. [P1]

### 3.2 Directly inspected executable text

Indexed text from `Play_Action_Playground_v0_3_3.html` exposed the following actual implementation details. The complete source archive was not available for execution.

| Feature | What the inspected text supports | Consequence for the next build |
|---|---|---|
| Renderer | Embedded Three.js identifies revision **159** | Preserve it for the initial baseline; do not upgrade as a side task |
| Shared actors | Physical body profile, appearance, controller, motion, guard, action, and recovery are separate fields | Extend this contract rather than replacing it with unrelated player/NPC implementations |
| Light chain | One `punch` definition; hand pictures change according to combo index | The new chain needs meaningful timing/range/pressure differences, not just four images |
| Guard | Guard 100, regeneration 24/second after 1.1 seconds, temporary wilt 1.7 seconds | Existing values are a rollback reference, not mandatory new-mode tuning |
| Input | LMB down records time; short release requests the punch; a 180-ms hold is used for blocking | Immediate punch onset and deliberate parry favor separate guard input |
| Opponent | `testDriver` faces the player, blocks, and conditionally requests a heavy counter | It is not a mobile sparring partner or Encounter autonomy |
| Movement | HUD explicitly describes rail movement and unrestricted look | Free arena footwork is a deliberate new choice, not something to claim already exists |
| Diagnostics | Physical proof log is labeled “Not Encounter persistence” | Preserve that honesty until an actual semantic bridge exists |
| Appearance swap | The API exposes appearance/profile/control changes separately | Keep appearance-independent hit results and control-swapping tests |

Source anchors: `PRESSURE_ACTIONS`, `actor`, `testDriver`, `apPointerUp`, `apDrawHands`, `apEnsureHud`, and the embedded Three.js revision in the v0.3.3 HTML. [P2]

### 3.3 Current numbers are not the proposed numbers

These are directly read from the v0.3.3 action table. Reach values are table parameters, not a claim about anatomical arm length or final center-to-center collision range. [P2]

| Existing move | Startup | Total duration | Guard damage | Push parameter |
|---|---:|---:|---:|---:|
| Light punch | 75 ms | 235 ms | 23 | 0.32 |
| Strong punch | 260 ms | 660 ms | 66 | 4.8 |
| Ground kick | 370 ms | 940 ms | 105 | 7.6 |
| Flying kick | 75 ms | 780 ms | 120 | 10 |

The earlier combat review records a **1/240-second simulation step**. The v0.3.3 report says combat tuning outside its named repairs was preserved. Verify the actual constant in the source intake; the recommendation is to retain that clock, not rewrite the simulation to 60 Hz merely because the visual target is 60 FPS. [P1, P5]

### 3.4 The outstanding combat problems

The v0.3.1 review identified silent impacts, unreadable opponent windups, identical mechanical light punches, missing block reactions, release-delayed mouse punches, and an opponent who never moves. Some older physical/input failures were subsequently repaired; those must not be presented as still open without rerunning them. The v0.3.3 indexed controller and hand/input code independently confirm several remaining limitations, including the static counter driver, one light action definition, and tap/hold input arrangement. [P1, P2, P5]

The next task is therefore **not another generic physics repair pass**. It is a new, opt-in fisticuffs mode that preserves the physical repairs while improving the exchange.

---

## 4. Repository map: what connects to what

A live GitHub inventory found **21 accessible repositories**. The primary game, Lab, body, expression, and message foundations were inspected at the entry points listed below; this is not a claim that every file in all 21 repositories was audited.

### 4.1 Primary source references

| Source | Verified reference | Role in First Encounter |
|---|---|---|
| `fargo161/First-Encounter-Game` | `main` = `76a92fd82ac5ec6f10748f0b439a5d661fff5ea5` | Protected canonical Encounter/Atlas and ownership baseline |
| Same repository | `codex/economy-substrate-v0.1-accepted-baseline` = `cc8371c3c497edcdcfb8a73ec7da9dad4663847a` | Later producer/design reference; not permission to execute the economy work |
| `fargo161/first-encounter-lab` | Review branch `codex/headless-v0-3-part-a-2026-11-15` = `704ec51d571b05fa93ab17052e0ee07193e04066` | Latest inspected Lab branch: scoped communication, pure decision patterns, records/replay; not a combat controller |
| Same Lab | `main` = `1278b705302da2b1bbd8b0edcca62d63a66fc866` | Older published baseline; do not silently substitute it for the review branch |
| `fargo161/2d-doll` | Default-branch README inspected; blob `6ae2667e1bd42bc4e71658e6c46827a8061dfe8c` | Body/pose architecture reference; not a completed combat animation rig |
| `fargo161/based-expression-foundation` | Default-branch README inspected; blob `7299e1c5715d737a21826efce1894127d3c59378` | BASED roots, ordered pairs, anatomical face conventions |
| `fargo161/dpa-message-foundations-v01` | `main` = `9d38f7c6c1673bf8f421393ba33542d7747a0da5` | Existing ordered-vibe and message-foundation donor; no ready Punchline stat implementation |
| Local Action Playground | v0.3.3 report + indexed playable; source bytes still needed | Actual physical/gameplay donor for this milestone |

A README blob hash identifies that file, not the repository commit. Resolve and pin full commits for any additional donor actually imported during setup.

### 4.2 The important version mismatch

The canonical repository's ROOM README identifies a **v0.14.1 remediation candidate**. That is true at both inspected FEG references above. The root README retains `HOLD_FOR_FURTHER_REMEDIATION` for that package. The action release is a separate, newer local delivery. **Cloning the canonical repository is not equivalent to obtaining the latest Action Playground.** [P3, P7]

Do not apply a v0.3.3 action patch to the old canonical ROOM tree. Do not replace the held canonical package or erase its status because the separate action release reports passing tests. Preserve the canonical Encounter/Atlas IR3-25 qualification and the separate incomplete ZANT acceptance state; a new game checkpoint does not promote those products. [P3]

The available v0.3.2 source archive is identified in the v0.3.3 report by SHA-256:

```text
1926e1f59747b23670c74789e387bdb16165f9a407dd04a4307d5316ef5035ff
```

This is a **reported archive checksum**, not newly recomputed here. A complete v0.3.3 source archive is preferable. A verified v0.3.2 archive plus its actual v0.3.3 patch and added files is an acceptable reconstruction path only after a rebuild and comparison. [P1]

### 4.3 Encounter is real work, but not a ready fighting AI

The current Lab README describes a headless purchase/dialogue implementation, stopped for review. It reports 102 passing tests under Node v24.22.1, while the actual ROOM bridge, shared suite, browser baseline, and stand-in remain separate unfinished gates. Its inspected `decisions/clerk.mjs` contains pure, explainable purchase-choice logic and delivery-sensitive judgments. This is a valuable architectural donor, not code that already knows how to parry. [P4, P8]

The canonical boundary matrix is documentation-level, not a live runtime interface. C6's approved Lab contract concerns physical requests, correlated results, named locations, and snapshots; importing the document does not implement high-frequency combat integration. [P6, P9]

**Connection now should mean:** known repositories, exact revisions, accessible files, documented ownership, a tested action/result boundary, and no missing credentials. It should not mean making the renderer depend on the store economy or running the purchase engine on every physics tick.

### 4.4 Body and message work should not become new blockers

The 2D Doll README explicitly distinguishes a bounded mechanical Poser slice from a finished animation/character pipeline. Its provisional pose corpus is not an accepted game-facing combat rig. Use its conventions where relevant; do not finish that application before making punches work. [P10]

The BASED expression repository supplies the five roots, 20 ordered pairs, and three intensities. Exact glyph transformations and blend mathematics remain open. DPA provides an implemented structural vocabulary, but its README marks the performance cells unmapped and approved runtime TPL protocols absent. Neither supplies the proposed taunt-to-Momentum balance table. [P11, P12]

The One-Room Behavior Lab README now describes a separate **Living Comic** lineage with a bounded beat-driven social model. It is an additional semantic design reference, not the runtime to insert into a 240-Hz fistfight. [P13]

### 4.5 Other inventoried repositories

`social-interaction-system`, `bounded-combinatorial-systems`, `periodic-semantic-grammar`, `design-flow-system`, `design-flow-mcp`, `corpus-pane`, `quest-player`, `Trapstar-the-Demo`, `pulp-sleaze-scene-constructors`, `PulpSleaze_UnityPrototype`, `sentm-framework-`, `SENtm-spec-v.01`, `frnn-agent-team`, `frnn-app`, and `artpark-adaptive-qr-cloud-v2` were found in the repository inventory. Their full contents were not audited here. They are not designated first-fight dependencies. Do not attach every repository or MCP service simply because it exists.

---

## 5. External research: use these patterns, not these engines

The following are sources inspected for this review, not dependencies installed or tested here.

| Resource | Useful lesson | What not to transplant |
|---|---|---|
| **Super KO Boxing** | Separate hand recovery; a short command queue; shared action outcomes and presentation events | It is side-on, not first-person. Its inspected resolver uses random accuracy/knockdowns; do not import those hidden rolls. A reuse license was not established. Ideas only pending permission. [W1] |
| **Shoto Fighter** | Distinguish hitstun, blockstun, hit pause, cancel/buffer timing; human and CPU input separation | Godot implementation is not a ROOM plug-in. Code and character-art permissions differ. Do not count README test claims as tests run here. [W2] |
| **Godot Framitor** | Author startup, contact, recovery, and effect parameters as inspectable data | Several effect fields are stored rather than automatically executed. For this game the simulation selects art, not sparse art frames driving physics. [W3] |
| **GZDoom fist source** | Economical first-person poses; contact resolution and hit sound have explicit timing | Do not import Doom art, automatic camera turning, or random damage. A single-hit invariant does not require testing contact on only one simulation instant. [W4] |
| **Shady Knight, developer description** | Contextual moves can join movement and combat without a button for every variation | Design reference for the later aerial/Grab layer, not source code or a first-day feature list. [W5] |

The synthesis I recommend is **hand recovery + phase-based move data + readable defense + sparse first-person art**, implemented through the existing ROOM actor resolver.

### Useful assets, narrowly selected

**Kenney Impact Sounds:** the official page lists 130 files under CC0. The owner manifest already references this family. First look for the existing supplied pack; use the official source as a fallback. Select only a few light, heavy, block, and material impacts. No large audio-library integration is required. [W6]

**Fantasy FPS Hands:** the author offers CC0 edited hands and cutout photographs, including a raw punch. Useful as a visual donor/reference; not a finished, coherent jab–cross–hook animation set. [W7]

**FanixStudio PSX FPS Arms Free Sample:** the listing advertises left/right punches, guard, and reach/grab in FBX/GLB. It is a candidate for offline pose rendering, not a reason to add a skeletal-model runtime. The inspected listing's license field is blank; acquisition terms and actual animation quality remain unverified. Do not make it a build dependency today. [W8]

The additional “37 hits/punches” page could not be retrieved successfully in this pass; it is not needed because an official sound source was verified. No commercial asset purchase is required by this proposal.

---

## 6. Engine, delivery, and setup recommendation

### Keep the renderer; do not create an engine migration

The current playable embeds Three.js r159. PlayCanvas is a legitimate alternative, but adopting it would add scene, asset, input, and runtime-adapter work before improving a punch. Its official exported-build documentation also requires HTTP/HTTPS rather than promising direct `file://` execution. That conflicts with treating a PlayCanvas export as a drop-in replacement for the existing self-contained page. [P2, W9]

**Proposed:** keep the current renderer and builder. Make a clean game-only start screen and hide editor/debug clutter by default. Keep diagnostics accessible. Do not make Cloudflare or any hosting account a prerequisite. Development can use a local static server; the delivery target should retain a bundled offline HTML page if the actual build supports it, with a one-command local-server fallback.

### Repository shape

Proposed new repository name: **`fargo161/first-encounter-action`**. Product title in the game: **First Encounter**. Name remains subject to owner approval.

Keep one working repository, not a collection of new packages with separate deployment pipelines. Preserve the imported ROOM source layout initially. Include a source provenance record, immutable baseline evidence, a small new-mode tuning file, tests, and the build instructions. Refer to external repositories by exact commit; copy only the authorized modules actually required. Do not add submodules or live floating-main dependencies by default.

Do not put ZIP duplicates, generated screenshots from every run, entire asset libraries, or undocumented third-party source into the repository. A clean clone must either contain its required runtime assets or have one verified acquisition step with checksums. It must not depend on another chat's memory or private sandbox paths.

### Codex environment versus this chat's connection

GitHub repository reads succeeded here. That does **not** prove the eventual Codex task can clone or push. OpenAI's current documentation explicitly separates a connected GitHub account, repository access, and the repositories included in a prepared environment. New and legacy cloud workflows also coexist. [W10]

The environment preflight should prove, in the actual chosen Codex workspace:

1. The intended new repository is checked out, with the expected Git root and remote.
2. Required read-only source repositories are accessible at the pinned revisions.
3. The current action source package and required assets are real local files with recorded hashes.
4. Node 24.x and Python 3.12.x are available as required by the existing project tooling; installed versions are recorded. Pin actual dependencies after reading the real build files. [P3]
5. Existing tests and an unchanged build can run before editing.
6. Browser automation can launch, capture screenshots/console errors, and record its rendering mode.
7. An authorized review-branch commit can be pushed and read back when the first checkpoint is ready. Do not use an unsolicited test commit as a permission probe.

No OpenAI API key, live model call, cloud database, or generic MCP server is required for the playable fight. Authentication, account selection, and new-repository access may still need an owner action. This review did not change them. The currently exposed GitHub connector actions did not include a repository-creation action, and no Codex-environment configuration action was available in this session.

---

## 7. Proposed shared architecture

This is an implementation proposal, not a declaration that new interfaces already exist.

```text
Human input OR reactive training provider OR later Encounter provider
                        |
                 action request
                        |
            shared ROOM actor/action resolver
                        |
       accepted/rejected request + physical result
                   /                 \
        presentation cues       observation/semantic adapter
        sprites + sound          later Encounter interpretation
```

One actor position writer. One simulation clock. One contact resolver. One move definition per move shared by both fighters. Appearance does not change hit truth. A provider proposes actions; it does not directly reduce another fighter's guard or teleport bodies into a good-looking pose.

The first training provider should consume an observation view with visible facing, range, visible action phase, recent perceived contacts, and its own state. It must not read the player's private input queue, future selection, or hidden BASED intent. A replacement provider can later use Encounter without introducing a second physical actor.

Retain the local diagnostic event stream for testing. Do not market it as the completed canonical causal ledger. Future semantic events must be derived from actual accepted results with cause IDs, not independently invented by animation or an “honorable/dirty” classifier.

### Narrow source changes

Use an opt-in new combat mode, provisionally `fisticuffs_v01`, so legacy pressure-mode tests remain valid. Extend the existing shared resolver rather than starting another movement/collision implementation. Exact helper/module names should be chosen after source intake; the likely edit surfaces are `actor-physical.js`, `ui-physical-proof.js`, its scene/build tools, and a small separate tuning/controller module.

The new game may author a clear-floor training preset using existing ROOM geometry. Do not modify the original five drills or Wreck catalogue to make the new tests pass. Keep Vehicle World untouched in this milestone.

---

## 8. Proposed first-fight specification

**Every number in this section is provisional tuning for owner review and playtesting.** It is not historical approval. New-mode values do not silently replace legacy ones.

### 8.1 Clock and presentation

| Item | Proposed target |
|---|---|
| Rendering | 60 FPS target on the owner's actual machine; measure, do not guarantee from headless tests |
| Simulation | Retain the existing fixed 240-Hz step after verifying the source constant |
| Input | Timestamp and queue events; consume on simulation steps, not sprite-frame changes |
| Artwork | 3–5 purposeful images per basic strike, variable holds |
| World position | Smooth interpolation between authoritative positions; no five-FPS locomotion |
| Camera | Immediate mouse response; adjustable sensitivity; no deliberate mouse lag |
| Frame pacing | Target median ≤16.7 ms, 95th percentile ≤20 ms in the small arena; report hardware, resolution, renderer, and sample length |

A 240-Hz simulation with 60-Hz drawing is approximately four simulation steps per rendered frame. That is a consequence of the proposed rates, not four independent timers. Keep a bounded catch-up policy, pause on focus loss, and do not turn a long inactive tab into a burst of attacks on return.

### 8.2 Controls — owner decision required

Recommended working mapping:

| Input | First milestone | Reserved later |
|---|---|---|
| LMB press | Light hand chain | Contextual variations without new basic buttons |
| F press | Heavy punch | Optional charge after basic timing works |
| RMB hold | Guard; initial timing window can parry | Still defensive, not overloaded with opponent grab |
| WASD | Arena footwork, subject to movement decision | Same physical actor in the larger world |
| Space | Reserved; existing jump kept out of first acceptance drill | Jump / air move context |
| E | Reserved | Knee / kick / air kick context |
| Q | Reserved | Universal environmental Grab / use |
| Enter | Reset exchange | Same restart convention |

RMB currently means grab/throw and Q is a debug control, so this mapping is an explicit new-mode control change. It is not already accepted. Keep older drills' controls unchanged. Move conflicting debug actions to the diagnostic panel.

### 8.3 Ground chain: three mechanics, not four random pictures

Use a light chain that alternates hands and finishes with a different close-range action. The last action can read as a hook or karate chop depending on approved art, but its mechanics must remain predictable. Cosmetic variation never randomly changes range or contact time.

| Proposed action | Startup ticks / ms | Active ticks / ms | Recovery ticks / ms | Total | Guard pressure at zero Momentum |
|---|---:|---:|---:|---:|---:|
| Lead jab | 18 / 75 | 8 / 33.3 | 34 / 141.7 | 250 ms | 18 |
| Rear cross | 24 / 100 | 10 / 41.7 | 38 / 158.3 | 300 ms | 22 |
| Hook/chop ender | 42 / 175 | 12 / 50 | 66 / 275 | 500 ms | 30 |
| Heavy punch | 66 / 275 | 12 / 50 | 90 / 375 | 700 ms | 55 |

A complete light chain therefore applies 70 base guard pressure if every contact is guarded; it does not automatically erase a fresh 100-point guard. Two landed guarded heavies can break one, but their startup/recovery should give the defender a real response.

Hands recover independently, but only one hand may be in startup/active contact at a time. The other hand may begin during recovery when the move's shared body-commitment rules permit it. A heavy uses a longer global commitment. Do not permit simultaneous double-hit fist spam merely because the two pictures are independently animated.

A new attack can connect during its active interval, with a per-action/per-target contact latch. The same attack cannot deal damage repeatedly across ticks. Whiffs, blocked contacts, clean hits, parries, and interrupts are different outcomes.

For the initial art, preserve the existing authored collision-body scale and reach as a baseline. Calibrate visible fists, range, and body boundaries together in the actual page; do not select a reach solely from a cropped sprite's pixel width. The hook should be shorter-range than the straight, and the heavy must not become a two-metre magical remote hit.

### 8.4 Input buffering and commitments

Proposed buffer: at most two pending attack presses, each valid for **150 ms**. This is intentionally shorter than a long programmed flurry. Record whether a press was accepted immediately, buffered, expired, or refused; do not silently swallow it and do not display internal error identifiers during normal play.

Guard supersedes pending offensive input when a legal defensive transition is reached. It does not erase an already committed contact phase. Pause, focus loss, death/reset, and controller swap clear pending input. The mouse-capture click is not a punch.

The light animation must begin on button-down. “Responsive” means visible response immediately plus intentional startup before contact; it does not mean every attack hits instantly.

### 8.5 Guard, parry, and stagger

Proposed guard maximum: **100**. Keep the existing 24/second regeneration and 1.1-second delay as initial comparison values unless testing shows a specific problem. Do not add a separate stamina meter in this pass.

A guard request takes effect at the next legal simulation step. The first **100 ms** of a newly raised eligible guard can parry an incoming strike. Holding it beyond that becomes normal blocking. A parry attempt cannot be renewed by rapid tapping: require release and a **300-ms rearm interval** from the attempt's start.

A successful parry negates that strike, visibly deflects it, and creates a proposed **200-ms counter opening**. This is enough to reward a fast reply, not automatically guarantee any heavy attack. A mistimed guard can still block if correctly facing and mechanically legal; a failed attempt does not invent a hit on its own.

Guard damage and blockstun should be visible. Suggested blockstun starts at **50 ms for a jab**, **66.7 ms for a cross**, **100 ms for the ender**, and **133.3 ms for a heavy**. Check that defender control returns between ordinary repeated lights. A successful hit must not refresh a permanent helplessness loop.

For the first drill, a guard break produces the familiar temporary stagger/wilt and then a visible recovery. There is no automatic clinch or execution. Preserve the legacy 1.7-second wilt as a comparison baseline; do not call it final new-mode balance.

### 8.6 Physical movement versus combat Momentum

These are different quantities:

- **Velocity:** where the physical body is moving, measured in world units and time.
- **Momentum:** an authored fighting resource reflecting successful exchanges and pressure.

Do not replace actual velocity with the Momentum score. Do not add a second competing “Tempo” resource.

Proposed initial Momentum: **0–100**, bounded per actor, with every change associated with a contact/result event. Illustrative starting gains: clean hit +6, guarded hit +2, successful parry +12, guard break +16; losses: clean hit received −20, committed whiff −8. No gain for attacking empty air or repeatedly blocking nothing.

First implement it as an inspectable counter, then enable one small, capped effect: up to **15% more guard pressure and contact impulse**, not extra animation speed or altered parry-window length. This makes an already good exchange develop intensity without hiding its timing rules. A full meter must not make three-button spam unbeatable.

Decay can begin after two seconds without a meaningful exchange, at a proposed 8/second. This is a playtest variable; it must not discourage deliberate defense or careful positioning so strongly that the only viable style is rushing.

The later Punchline speed-versus-force exchange should modify explicit fields through this same system, with visible start/end cues. No free opponent speed buff and separate player power buff should be silently stacked on top of it.

### 8.7 The reactive sparring opponent

The first opponent is not a static bag and not the final resourceful villain. Give it four understandable responses: hold distance, guard, answer a clear opening with a short combination, and recover/reset pressure.

It can idle when not engaged, take a limited step toward a player who enters the exchange, turn at a finite rate, and answer overcommitment. It must not instantly face a flanking attacker every tick or refuse to attack forever because light punches continually reset an arbitrary cooldown.

Use a delayed observation queue and a small, testable policy. A proposed **220–320-ms response delay** is a tuning choice for the partner, not a scientific assertion about human reaction speed. First attacks should have visible preparation: a shared optional windup hold can provide roughly **350–450 ms from recognizable preparation to contact**. This prevents a 75-ms jab from being the only warning a novice receives.

The underlying move still uses the same player/NPC rules. The partner's decision to visibly prepare, choose a slower move, or leave a gap is controller behavior. Do not implement unfair damage, fake parries, or invulnerability to conceal a weak controller.

No randomness in contact accuracy. Any seeded variation in training choices is labeled local test-driver behavior, not a new global Encounter decision policy. More ambitious semantic decision reuse requires a later, scoped adaptation of the existing Lab/Encounter design.

### 8.8 Impact feedback without corrupting authority

Provide different sounds and reactions for whiff, guard contact, clean hit, parry, and guard break. Use a small, adjustable visual jolt, contact mark, hand recoil, and defender recoil. Prioritize useful feedback over particle volume.

For the first pass, a **35–60-ms visual impact-pose hold** is an art timing device. The simulation can continue. That is not the same thing as freezing the whole game.

If true gameplay hit-stop is added, it is an explicit shared simulation/timing rule and must remain consistent when optional screen effects are disabled. It cannot simultaneously freeze simulation only when effects are on and claim identical timing with effects off. Earlier discussions blurred these cases; this specification separates them.

---

## 9. Art and animation intake

The earlier review reported **23 TH1 frames and 10 FPW frames** embedded in the action build. Indexed v0.3.3 hand drawing still selects those families. That proves useful source material exists, not a finished coherent karate set. The same review identifies inconsistent scale, brightness, perspective, and arm entry direction. [P2, P5]

### First-person hand pass

Make one small, coherent set rather than waiting for every limb, outfit, and face. A proposed budget is **14–20 unique hand images**, reusing images when appropriate: resting hands, lead jab, rear cross, hook/chop, heavy, two-handed guard, parry, and recoil. Each attack uses roughly three strong poses; timing and smooth placement supply the transitions.

Normalize arm entry side, wrist/forearm anchor, apparent hand size, color family, and pixel density. A mirrored image is allowed only where it actually depicts the correct hand/anatomy. Do not mirror a player's POV hand and call it an incoming enemy attack.

Generated or redrawn art can fill a specific missing pose later under an art task. The next coding task must not assume it has an image-generation tool. An art delivery requires actual files, not a text prompt presented as a completed asset.

### Opponent pass

The prior preferred sparring visual was the armored `ARM` sheet, and its earlier review described usable guard, front-facing punches, stagger, fall, and directional locomotion. That coverage has not been independently re-cropped or visually certified in this session. Inspect the original sheet and manifest before selecting it.

Require genuinely different silhouettes for idle/guard, attack preparation, contact, blocked-hit recoil, clean-hit recoil, and stagger. The old “standing gunman equals incoming attack” presentation is unacceptable for testing parry readability.

The five-angle language remains **front, front three-quarter, side, rear three-quarter, rear**. Missing action angles must be listed as missing; front-only donor attacks are not automatically a complete five-angle production pack. Development fallbacks must be labeled and must not be silently accepted as final artwork.

Standardize the actor interface now—body footprint, height/profile, root, facing, action phase, left/right identity, and attachment conventions. Do not finish a modular, swappable combat mannequin or the CHAR001 garment repair project before producing a usable sparring exchange.

### Video reference inspected here

The supplied MP4 was measured locally: **21.236 seconds**, **146 encoded frames**, **932 × 666 pixels**, and approximately **6.875 encoded FPS**. Sampled frames show strong martial-arts stances and gestures. Encoded frame count is not a count of unique authored poses, and it does not set the game's simulation rate.

Use it for rhythm and attitude. The proposed game should hold useful key poses, not merely reduce a smooth clip to a fixed low frame rate.

---

## 10. Punchlines and the later environment: preserve the design, defer the implementation

### Punchlines

A real physical event supplies a reference: a parry, a miss, a guard break, a recovery, an accepted helping hand, or a betrayal. A character who legitimately observes it can respond. BASED supplies ordered delivery cues; the recipient interprets those cues through their profile and context. Mechanical effects then follow the agreed challenge rules.

The latest direction is a brief force-versus-speed wager: the taunted fighter can become more forceful but slower, with unanswered challenges reducing accumulated Momentum. A good defense or deliberate counter can answer, not merely an immediate rush. Exact duration, loss curve, eligibility, cooldown, and response vocabulary are still to be tested.

Keep one open challenge at a time per relevant exchange, deduplicate the triggering event, and prevent taunt spam from repeatedly refreshing buffs or draining a target with no fair response. An NPC must choose from legitimate observations, not read the human's hidden vulnerability or uncommitted intent.

KeyWrapping is the eventual reference/provenance mechanism, not an omniscient narrator that declares “honorable” as a physical fact. An outward helpful hand can be sincerely respectful, patronizing, or deceptive. Perception is not agreement, and a recipient does not automatically learn private intention. These distinctions already have homes in the existing semantic work. [P4, P6, P9, P11, P12]

For now, retain the necessary physical event IDs and outcome types. No message composer, progression economy, 20-vibe balance table, or live language model belongs in the first-fight build.

### Clinch

The November 16 clinch note replaces the older continuous combatant hold: attacker one win; defender two wins can escape or risk a third for reversal; the winner gets a short payoff choice. Options were punch, kick, and grab, but the dominance cycle remained open. That design must not be replaced with the older grip timer or silently finalized from an example. It is deferred. [P14]

### Environment

The Wreck catalogue already has a physical home for authored state changes. Preserve it. Later, fists, bodies, blasts, and vehicles can send typed physical events to those same definitions. Do not start a separate destructible-world engine.

The warehouse is an authored stunt set, not arbitrary whole-building structural simulation. A collapsing platform is a defined support-state transition; shards may be cosmetic unless explicitly authored as hazards. Vehicle riding and entering are different integrations and should not be bundled into the word “vehicles.” None is required for the first grounded exchange. [P1]

---

## 11. Acceptance: what would actually prove the first milestone

### Automated correctness

| Test | Required result |
|---|---|
| Shared moves | Human and training controller submitting the same legal request in the same state receive the same physical result |
| Appearance invariance | Changing the sprite/skin alone never changes contact, guard damage, or stagger |
| Contact deduplication | One attack can connect at most once per target unless explicitly authored as a multi-hit move |
| Frame-rate independence | Same timestamped input sequence at 30/60/144 drawing rates produces equivalent simulation outcomes |
| Button-down response | A legal light request begins at the next input-consumption step; it does not wait for mouse release |
| Buffer | Accepted, buffered, expired, and denied presses are explainable; no attack appears after reset/focus loss |
| Hand scheduling | Alternation can use the other hand's readiness; the same recovering hand cannot attack early |
| Parry boundaries | Tests just before, inside, and after the window; holding guard never auto-reparries; rearm limits hold |
| Block reaction | Guarded contact changes visible state and emits the correct cue; it is not hidden beneath an idle/block image |
| Interrupt rules | Startup can be interrupted where authored; committed contacts and simultaneous-hit policy resolve consistently |
| No infinite suppression | Sustained lights cannot keep the partner unable to respond indefinitely |
| Observation boundary | Changing unobserved player input/hidden intent cannot change the NPC's immediate choice |
| Controller swap | Identity, body, Momentum, and legal action state survive a safe paused control swap |
| Legacy regression | Old physical and pressure-mode tests run unmodified and remain valid outside the new mode |
| Pointer capture | Refusal/retry, Escape/refocus, and capture-only click work; recapture does not punch |
| Delivery | Selected release opens without missing files, runtime network requests, or page errors under the promised launch method |

Report exact commands, exit codes, test files, source hashes, browser, operating system, rendering mode, and any skips. A screenshot is not proof of parry timing. A Canvas-only pass is not hardware WebGL validation.

### Human feel gate: the ten-second exchange

The player advances, lands a short hand combination into the opponent's guard, and sees/hears the difference between the three hits. The opponent answers visibly. The player can guard safely or time a parry, then choose a fast counter or risk the heavy. Someone loses guard, staggers, recovers, and the exchange resets without a cutscene.

This is an illustrative sequence, not a script that must play identically. It passes only when Teddy can repeat it, understand why contacts succeeded or failed, distinguish the moves without reading diagnostics, and want to try again.

Test three deliberate behaviors: reckless clicking, patient guard/counter, and spacing plus a heavy. Each must have a recognizable tradeoff. Neither constant attack nor constant block should be the universal solution.

The initial drill is low stakes: quick reset, no progression penalty, no environmental instant death. Prefer a training reset/round completion over inflating health to force long exchanges. Any temporary training protection is clearly labeled and tested separately from ordinary actor damage rules.

---

## 12. Codex execution plan after approval

### Gate 0: prove the setup before gameplay work

Confirm repository identity, source package hash, donor pins, permissions, dependencies, source-build commands, and required assets. Rebuild the unchanged baseline. Run its relevant original tests. Record the browser environment and actual launch route.

If the action source is missing, request that exact package; do not quietly build from the old v0.14.1 canonical ROOM. If a visual pose is missing, report it and use a labeled development fallback where approved; do not replace the whole character system.

### Gate 1: one exchange, not one polished isolated punch

Add the new mode, dedicated defense if approved, phase-based hand scheduling, and a reactive training provider. Reuse a clear-floor warehouse preset. Make both sides share requests and resolution from the outset. Include sound and readable hit/block/parry reactions in this checkpoint.

### Gate 2: make the chain meaningfully different

Differentiate jab, cross, ender, and heavy. Add the bounded Momentum counter and test its small mechanical effect separately. Add a compact tuning panel with plain-language help, reset-to-default, and exportable settings. This is a debug aid, not a new editor product.

### Gate 3: package, test, and deliver

Run legacy and new tests, browser checks, source-preservation checks, and the performance sample. Deliver the source checkpoint, playable build, minimal controls page, test results, missing-art list, and known limitations. Commit and push only the authorized review branch; do not merge originals or upgrade the scope automatically.

### Working arrangement

Use one lead/integrator plus, where available, one implementation lane and one independent verifier. More agents are not inherently faster when they all need the same small resolver. Assign file ownership explicitly. The verifier does not edit tests to turn failures green. Routine implementation choices stay with the lead; only material scope, authority, asset, or semantic conflicts return to Teddy.

The agent proceeds between approved gates without asking for permission after every passing test. It stops at the first-fight delivery—not at a new weapons, clinch, or city phase.

A playable-today attempt is credible with the existing source and assets, but the actual completion estimate must follow Gate 0. A report, a green unit suite, and a compiled page are not substitutes for the owner feeling the exchange.

---

## 13. What this preparation did and did not do

### Completed here

Live GitHub repository/branch discovery; selected canonical and Lab source/doc inspection; indexed inspection of the v0.3.3 playable's combat, input, and presentation functions; direct reading of the v0.3.3 release report and relevant earlier review; primary-source research on the four combat references, delivery technology, Codex setup, and a few asset donors; local video metadata and sampled-frame inspection; this proposed specification.

### Still unverified

The newest full source archive's contents and hashes; actual baseline rebuild; existing and proposed tests executed in this workspace; complete original hand/opponent sheets; actual game feel; Windows launch; hardware WebGL performance; Codex environment's repository access and push path.

### Access failures that matter

Requested materialization of the v0.3.2 source ZIP, v0.3.3 patch, v0.3.3 HTML, and v0.3.3 evidence ZIP failed. Some indexed text was readable, but later range reads also failed. No hidden download path or sandbox filename was invented.

The actual MP4 was mounted and inspected. The GitHub connector successfully retrieved repository content. Public-source code/README inspection is not the same as running the external projects; their suites were not executed.

---

## 14. Owner decisions to resolve before the final build handoff

### A. New-repository authority

**Recommended:** create `first-encounter-action`; permit Codex to modify its copied action-runtime source, scene, game UI, and tests for this first-fight scope. Original FEG, Lab, ROOM, ZANT, and character projects remain read-only. No forced pushes, automatic merges, or unrelated migrations.

This is the narrow exception needed to avoid the old “Codex may not edit ROOM” rule stopping the assignment. Merely approving research is not this authorization.

### B. Controls and movement

**Recommended:** LMB light chain, F heavy, RMB guard/parry; reserve Q for universal Grab and E/Space for later kicks/jump. Allow bounded free WASD footwork **inside the training arena only**, using the existing actor/collision authority; do not rewrite the wider rail world. Keeping rail movement is an alternative, but it changes the feel test.

### C. Execution surface

Which actual Codex workflow will receive the final handoff: browser/cloud, desktop, or local CLI? The setup receipt must be run there. This chat's GitHub read access does not answer that question.

### D. Required source intake

Attach the **newest complete Action Playground source ZIP** directly to this conversation, or put that source at a confirmed path/commit in an accessible working repository. If the last complete archive is v0.3.2, supply it with the real v0.3.3 source patch/additions. Start with the source package; inspect its assets before asking for additional images.

Once these are settled, revise this report into an execution-authorized handoff with the actual source hash, selected controls, exact environment commands, and an asset manifest. Do not ask Teddy to approve hypothetical file paths or guess missing hashes.

---

## 15. Source register

Project-source identifiers are exact filenames/paths inspected through the file or GitHub tools. Public URLs are provided for a future developer to reopen; branch URLs must be pinned before importing code.

### Project evidence

- **P1:** `ACTION_PLAYGROUND_v0_3_3_REPORT.md`, November 16, 2026. Sections 1–5: reported tests, physical changes, six-kind catalogue, room dimensions, preservation, limits.
- **P2:** `Play_Action_Playground_v0_3_3.html`, indexed source: Three.js revision at original line 243; action table around 8685–8695; shared actor creation around 8708–8718; `testDriver` around 8965–8977; `apPointerUp` around 13650; `apDrawHands` around 13752; HUD/control diagnostics around 13796. Indexed text only, not executed.
- **P3:** FEG root `README.md`, pinned `76a92fd82ac5ec6f10748f0b439a5d661fff5ea5`; repository branches read live.
  `https://github.com/fargo161/First-Encounter-Game/blob/76a92fd82ac5ec6f10748f0b439a5d661fff5ea5/README.md`
- **P4:** Lab `README.md` and `AGENTS.md`, pinned `704ec51d571b05fa93ab17052e0ee07193e04066`.
  `https://github.com/fargo161/first-encounter-lab/tree/704ec51d571b05fa93ab17052e0ee07193e04066`
- **P5:** `ACTION_PLAYGROUND_V0_3_1_COMBAT_FEEL_REVIEW.md`, November 15, 2026. Historical measurements; later repairs supersede relevant faults.
- **P6:** FEG `contracts/BOUNDARY_MATRIX.md`, pinned main revision above.
- **P7:** FEG `packages/room-creator/README.md`, read at both `76a92fd82ac5ec6f10748f0b439a5d661fff5ea5` and `cc8371c3c497edcdcfb8a73ec7da9dad4663847a`; both identify v0.14.1 remediation candidate.
- **P8:** Lab `decisions/clerk.mjs`, first 95 lines read at the pinned review revision; blob `a60f0ee95a248a25d6274839c9f8216dd0c3d220`. Lab `content/based-cues.json` at the same revision contains two purchase-context entries, EA and SE.
- **P9:** Lab `docs/architecture/SYSTEM_CONTRACTS_C1_C8.md`, pinned review revision; proposed contracts with separately approved C6 status.
- **P10:** `https://github.com/fargo161/2d-doll/blob/main/README.md`, inspected README blob `6ae2667e1bd42bc4e71658e6c46827a8061dfe8c`.
- **P11:** `https://github.com/fargo161/based-expression-foundation/blob/main/README.md`, inspected README blob `7299e1c5715d737a21826efce1894127d3c59378`.
- **P12:** `https://github.com/fargo161/dpa-message-foundations-v01/blob/9d38f7c6c1673bf8f421393ba33542d7747a0da5/README.md`.
- **P13:** `https://github.com/fargo161/one-room-behavior-lab/blob/main/README.md`, inspected README blob `988b543fd509ee3eab89f53adf8733ebf040ec60`.
- **P14:** `Action Playground the clinch and the damsel meter (1).md`, November 16, 2026, combatant section and supersession notice.
- **P15:** Supplied `ezgif-17026a3fe81ff560.mp4`; local ffprobe and sampled-frame inspection in this preparation session.

### Public primary sources, checked November 16, 2026

- **W1:** `https://github.com/DFchillin/SuperKOBoxing` — README and direct source `src/combat/CombatSystem.js`, blob `bbc73aa712677e052b7618fe5b9e58a48e4966cb`; `src/core/Config.js`, blob `38ae3f6fd8534dc3ac20b9881bc884216425951a`. Inspection only; no license established for reuse.
- **W2:** `https://github.com/aminRX/shoto-fighter-godot` — project README, architecture/features and code-versus-art licensing statements. No suite executed here.
- **W3:** `https://github.com/0xEvsky/Godot-Framitor` — plugin README, frame data and incomplete effect-processing caveats.
- **W4:** `https://raw.githubusercontent.com/ZDoom/gzdoom/master/wadsrc/static/zscript/actors/doom/weaponfist.zs` — actual fist state/contact source.
- **W5:** `https://shadyknight.com/` — developer's description of contextual movement/combat and style ranking.
- **W6:** `https://kenney.nl/assets/impact-sounds` — 130-file official CC0 sound listing.
- **W7:** `https://opengameart.org/content/fantasy-fps-hands` — author's CC0 hands/photographs listing.
- **W8:** `https://www.fab.com/listings/204ae3d1-8c00-46d3-a817-648deaac680f?lang=en` — FanixStudio free sample; license field blank in inspected page.
- **W9:** `https://developer.playcanvas.com/user-manual/editor/projects/downloading/` — exported-build/self-hosting requirements.
- **W10:** `https://help.openai.com/en/articles/20001545-using-codex-cloud` — environment, repository-access, and new/legacy cloud distinctions. Its setup link currently redirects to `https://learn.chatgpt.com/docs/environments/cloud-environments`.
- **W11:** `https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API` and `https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock` — engagement, failure, release and retry behavior; relevant to the existing pointer regression tests.

**End state:** a researched build proposal with concrete acceptance criteria. Not a new game release, not a completed connection receipt, and not permission to build before the remaining owner decisions and source intake are resolved.
