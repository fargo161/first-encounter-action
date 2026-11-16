# 21 · Modular environmental degradation (approved design rule)

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

**Source:** `ROOM_MODULAR_DEGRADATION_MANIFEST_HANDOFF_2026-11-15.md` (owner-directed, copied unchanged into `source_docs/`). Where this page and that document differ, that document wins.

**Status:** approved as a **general design rule**. **Not built.** Exact data format, interfaces and timing are **not approved**. Nothing on this page authorises editing Room Creator source or implementing the feature.

**Who does what:** Room Creator source is edited by Nova/ChatGPT only. Claude works on Encounter and on manifests.

Labels used here: `AGREED` = owner decision on record, binding · `EXISTS` = found in the files today · `PROPOSED` = a suggestion, free to reject · `EXAMPLE` = illustration only · `OPEN` = undecided, do not treat as settled.

---

## 1. The rule in plain words

`AGREED` When something in the world gets damaged, **do not simulate it breaking**. Instead, each breakable thing has a few **ready-made versions** (whole, damaged, wrecked, or whatever suits it), and the game **swaps one version for another** when a qualifying event happens. The swap changes how the thing looks **and** what it physically allows: whether you can pass, hide behind it, see through it, or get hurt by it. Characters then notice the change and act on it with the same decision rules they always use.

The handoff's own summary: *fake the fracture, honor the consequence.*

---

## 2. The binding requirements

All nine are `AGREED`. Wording shortened; meaning unchanged.

| # | requirement |
|---|---|
| R1 | **Swap between pre-built versions.** No live fracturing, no bending geometry, no whole-scene destruction physics. |
| R2 | **A general, reusable system**, not a one-off set piece. For walls, windows, doors, barricades, storefront details, cover, vehicle parts and other authored pieces, where it applies. Not every object must take part; pieces need not share the same number of versions. |
| R3 | **A change of state may change play.** Any of: solid shape, whether you can pass, rail or doorway availability, cover value, obstruction, sight lines, hazard, access for interaction, walkable space. Some changes are looks only. None must change everything. |
| R4 | **A few distinct steps are enough.** "whole → damaged → destroyed" and "usable → blocked" are examples, not a fixed three-step scheme. What each state means is authored per kind of piece. |
| R5 | **Physical events trigger changes.** Throws, vehicle collisions, impacts, explosions. The system reads **generic** impact information and applies authored rules; no special script per wall or per attack. |
| R6 | **It is the ongoing world, not a cutscene.** After the swap, movement, collision, tactics and character reactions all use the new state. |
| R7 | **Keep the existing split of authority.** Room Creator owns the authored physical world and its geometric consequences. Encounter supplies validated actions, causes and consequences, observation and persistence. No second world history; no competing movement or vehicle system. |
| R8 | **Keep current ownership.** Nova/ChatGPT edits Room Creator. Claude must not edit its source or quietly change its physical rules on the strength of the handoff. Room Creator changes need a separately approved implementation pass. |
| R9 | **Prototype and product are separate.** The action playground's fast action is not a mandate to redesign Trap Star or the main First Encounter experience. The degradation rule itself **is** meant as general, reusable infrastructure. |

Also `AGREED`: degradation does **not** always mean "more passable". Rubble can close a route; a smashed barrier can open one. The authored new state decides.

---

## 3. Where it fits in the existing architecture (no new system)

The three-part split already on record (project doc `CONVERGENCE_BOUNDARY_MATRIX.md`): **Room Creator** = physical world; **Encounter** = meaning, cause, history, character choice; **presentation** = what is shown. The degradation rule slots into that split as it stands.

| existing rule or interface (already on record) | how degradation uses it |
|---|---|
| Room Creator-only column already lists "doors (open/closed as a physical state)" | a degradable piece's **current state** is the same kind of thing as a door being open or closed: a physical state, held by Room Creator |
| B-1: Room Creator reports facts, never meanings | Room Creator reports "piece X is now in state S, and here is what it allows". It does not say who is to blame or what it means |
| B-3: presentation never flows back as truth | dust, debris and sound follow a state change. They never cause one (R6, and the handoff's §5 "presentation, not authority") |
| B-4: Encounter only hears about physical events it asked to hear about | state changes become one more kind of event Encounter can register interest in |
| B-5: the host owns timing, not meaning; B-6: every cross-system message is logged with its tick | one transition, applied once, logged once, so a combined run can replay |
| I-1 physical fact report (Room Creator → Encounter) | `PROPOSED` carries the impact and the resulting state change as facts |
| I-2 physical attempt check (Encounter → Room Creator) | already the way to ask "is this physically possible now?". After a swap, the answer simply changes |
| Vehicle World as the one physical authority for vehicles; owner rule RC-D071 "Vehicle World supplies facts, Encounter interprets them" | vehicle damage states must live with Vehicle World's own vehicle records, not in a parallel list |
| the unified decision process (project docs `FIRST_ENCOUNTER_LAB_DECISION_SPEC_v0_1.md`, `_v0_2.md`) | characters react to lost cover or a new opening through that one process. No "destruction personality", no second brain |
| complexity rule from the Room Creator pause handoff: collapse more play into fewer shared rules | reuse what is already there (§4) before adding any new vocabulary |

`PROPOSED` **One new row for the boundary matrix** (offered as wording for the owner to accept or change; the existing project document has not been edited):

| category | truth | proposes | physical fact / execution | presentation | persists |
|---|---|---|---|---|---|
| Environmental state change | Room Creator for the piece's current physical state and what it allows; Encounter for who caused it, what it means and what follows | player or Encounter (an action whose physical result is an impact); Room Creator itself for purely physical causes (a car hitting a wall) | Room Creator: checks the authored rule, swaps the state, updates collision, sight and routes | effects layer: model or texture swap, dust, debris, sound | Room Creator for the current run; Encounter in its history when Encounter is the host |

---

## 4. What already exists that this can stand on

Read from the Room Creator sources in the uploaded archive (`rc/source/`). `EXISTS` throughout. Read only; nothing was changed.

| what exists | where | why it matters |
|---|---|---|
| **A door is already a two-state piece.** Opening one sets `open`, redraws, rebuilds the sight geometry and writes one `doorOpened` record | `ui-combat.js`, `ui-route.js` (`rwDoor`, `rwBuildSight`) | the full chain the rule needs (state → looks → sight → one log entry) already runs for one kind of piece |
| **A path link can depend on a door.** A link carries the door's id; while the door is closed the link is blocked | `ui-route.js` (`rwEdgeBlock`), `ui-movement.js` (`mnSetEdgeDoor`) | a route that opens or closes with a piece's state is an existing idea, not a new one |
| **A path link can be switched off by data** (`gate` set to false blocks it) | `ui-route.js` (`rwEdgeBlock`) | a second existing way to open or close a route |
| **Sight and cover are rebuilt from geometry on demand** | `ui-route.js` (`rwBuildSight`, `rwSightBlock`) | after a swap, one rebuild makes sight and cover match |
| **Props carry tags**, and the suggested list includes `breakable`, `cover`, `climb`, `movable`, `hide` | `ui-props.js` | a place to mark which pieces take part. The tags do nothing by themselves today |
| **Vehicle contacts have a severity scale** (three thresholds) and each vehicle has a `damage` level field that is always 0 | `vehicle-world.js` | generic "how hard was the hit" already exists for vehicles; the damage field is an empty slot |
| **Contact events are logged** (`vehicle_contact`, `vehicle_pedestrian_contact`, with speed) | `route-traffic.js`, `ui-route.js`, `vehicle-world.js` | generic impact information of the kind R5 asks for, for vehicles |
| **Runs repeat.** Fixed time step, seeded random numbers (the combat code draws from the same seeded source), an event list | `ui-route.js`, `ui-combat.js` | the base that determinism (§8, item 5) depends on |
| **Surfaces have a `wear` number** | `core.js` | a looks-only wear setting already exists for floors and walls |

**What does not exist** (searched for and not found): any swap of a prop, wall or window between versions; any impact event for a person or thrown body hitting scenery; any change to collision at run time other than doors; any word for shatter, wreck, debris or barricade in the code. The model loader takes **one static model per prop** (`16_BUILDER.md` §7).

**Name clash to avoid.** Props already have a field called `variants`, and it means the four **view directions** of a picture (front, right, back, left). The palette code also says "variant". `PROPOSED` call the new thing **states**, never variants, in any data format.

---

## 5. Which uploaded assets already come as "versions of one thing"

`EXISTS` as files. Whether to use them is `OPEN`. IDs are from `14_WORLD_3D.md` and `92_TEXTURES_ALL.md`.

| family | states available | what could change with the state | gap |
|---|---|---|---|
| **Wall module** (Kenney kit; every piece 2.0 m wide, 2.4 m tall, so they swap in place) | `KBK.wall` (solid) · `KBK.wall-window-square`, `KBK.wall-window-wide-square` (hole at window height) · `KBK.wall-doorway-square`, `KBK.wall-doorway-wide-square` (walk-through gap) · `KBK.wall-half`, `KBK.wall-low` (cut down to cover height) | passage, sight, cover height | no rubble or collapsed version |
| **Boarded opening** | `KBK.barricade-window-a`, `-b`, `-c` · `KBK.barricade-doorway-a`, `-b`, `-c` | blocked ↔ open; cover | whether a, b, c are stages or just styles was not checked |
| **Door leaf** | `KBK.door-rotate-square-a` to `-d`, with door-damage decals `TEX.Dec_Damage_WoodDoor_1` to `TEX.Dec_Damage_WoodDoor_4` | whole → battered (four decal stages) | no broken-off door model |
| **Brick-and-plaster wall surface** | `TEX.Brick_Plaster_01_1` (clean) · `TEX.Brick_Plaster_01_Bullets_1`, `_2` (bullet-marked) · `TEX.Brick_Plaster_01_Hole_1`, `_2` (holed) | looks only, unless paired with a wall-module swap | |
| **Tiled surfaces** (22 colour families) | each has a clean texture and 2 to 6 damaged ones, for example `TEX.Tiles_Small_White_1` → `TEX.Tiles_Small_White_Damaged_1` to `_4` | looks only | |
| **Stick-on damage** | `TEX.Dec_Damage_Bullets_1`, `_2` · `TEX.Dec_Damage_Hole_1`, `_2` · `TEX.Dec_Barrier_Boards_01` | looks only | |
| **Bins** | `LPA.Mesh_Dumpster_Closed` ↔ `LPA.Mesh_Dumpster_Open` · `LPA.Mesh_Wheelie_Bin_Closed` ↔ `LPA.Mesh_Wheelie_Bin_Open` | closed lid = something to land on; open = a place to hide or fall into | FBX: needs converting to GLB |
| **Glass** | `TEX.Glass_01_1` to `_3`, `TEX.Glass_01_Transparent`, `TEX.Dec_Window_1` to `_3` | whole pane only | **no cracked or shattered pane** |
| **Electrical fixture** | `TEX.Dec_Props_Fusebox_1` (one picture) | | **no damaged or sparking version** |
| **Cars** | 21 + 8 car models, the builder's own two | | **no dented or wrecked version of any car** |
| **Wear pattern to copy** | `SHG` items come as new / used / damaged / broken | none here (swords and armour) | shows the four-stage naming the owner's packs already use |

**Effects to dress a swap** (all `EXISTS`): `DUST.v1`, `KSM.whitepuff.00..24`, `KSM.blacksmoke.00..24`, `KPA.dirt_01`, `SFX.impactGlass_heavy`, `SFX.impactPlank_medium`, `SFX.impactWood_heavy`, `SFX.impactMetal_heavy`. Glass-break and debris art found online is listed in `30_ONLINE_FINDS.md` §4.

---

## 6. The handoff's example, walked through against the real scene

`EXAMPLE` Illustration only. Scene: `Block_triple_shop` (`17_STREET_AND_VEHICLES.md`). The store's street wall has a shop window, 1.35 × 1.25 m.

| step | what happens | who owns it | exists today? |
|---|---|---|---|
| 1 | player kicks a guard, grabs him, throws him at the store front | the action is proposed by the player; whether it is physically possible is Room Creator's answer | no: no grab, throw or thrown body |
| 2 | the body reaches the window; an impact fact is produced: target piece, source, contact point, how hard | Room Creator | no for bodies; yes for vehicles (contact with severity) |
| 3 | the window's authored rule says "an impact this hard: whole → shattered" | Room Creator holds the rule; who commits the change first is `OPEN` (§8, item 2) | no |
| 4 | the state is recorded **once**, with its cause | Encounter when it hosts; a small local stand-in when Room Creator is tested alone, and that stand-in must not be described as the real persistent history | no |
| 5 | looks, collision, sight and routes all update from that one change | Room Creator | the sight rebuild exists; the rest does not |
| 6 | dust, glass, sound | effects layer, mirroring step 4 | effect art and sounds exist |
| 7 | a guard now sees a way through, or sees his cover gone, and chooses differently using the ordinary decision process | Encounter | no |

**The catch in this very scene:** no path link goes through that window. Shattering it would change how it looks and what can be seen through it, but nobody could climb through unless a link through the window is authored and tied to the window's state. This is the handoff's first compatibility concern, seen in a real file.

---

## 7. The handoff's proposed shape

`PROPOSED` by the handoff as a **discussion starter only**: not a schema, not an API.

```text
piece definition:   kind · allowed states · per state {model or texture, solid shape, what it allows, optional effect}
                    · transition rules {event conditions → target state}
piece in the world: stable world id · kind · placement · current state
generic event:      impact(target, source, contact, severity, tags)
                    → check threshold and allowed transition → record the transition
                    → update looks, collision and what it allows → notify characters who could observe it
```

No global hit-point system is assumed. A change may come from one event, from accumulated damage, or from another authored rule. Cost-saving defaults "worth evaluating, not mandatory": small model sets, pooled effects, simple stable colliders, no lasting physics for shards, update paths and sight only when what a piece allows changes, keep the same identity across swaps.

---

## 8. Conflicts and tensions found, and the smallest next step for each

| # | what | why it matters | smallest next step | whose |
|---|---|---|---|---|
| 1 | **This manifest's own v1.0 pages read like build instructions for Room Creator.** `16_BUILDER.md` §8 had a "touch it to add" column and the recipes named functions to change. | R8: Room Creator changes need their own approved pass, by Nova/ChatGPT. | Done in v1.1: those pages now say they describe where things attach, for the Room Creator owner. | Claude (done) |
| 2 | **Who commits a state change first is undecided.** Two orders fit the existing interfaces. (a) Room Creator applies the authored change and reports it as a fact, the way a door opening works today. (b) Room Creator reports the impact; Encounter validates and records; Room Creator then shows the result. | The handoff demands one transition applied once, and lists the timing as open. Order (a) is simplest and needs nothing new for a Room Creator-only test. Order (b) keeps cause and record in one place but needs a way for Encounter to tell Room Creator to switch a state, which does not exist. | Owner decision, after Nova confirms which is practical in the running code. | owner, with Nova |
| 3 | **Room Creator 0.16.1 is frozen** (project doc `ROOM_CREATOR_CLAUDE_PAUSE_THREE_LEG_HANDOFF.md`: do not start combat, do not start 0.16.2, change the baseline only in an owner-approved pass that branches from it). The playground and this rule both need Room Creator changes. | R8 and the handoff's instruction to preserve checkpoints and regression contracts. | Name the branch point and the regression set (the archive ships 219 test files; the frozen baseline records 28 suites / 483 checks) before any work is ordered. | owner, then Nova |
| 4 | **The combat brain lives inside Room Creator's source** (`rc/source/ui-combat.js` decides what bots do). The boundary matrix puts character choice in Encounter. | R7, and the handoff's "no separate decision brain". For a Room Creator-only stress test a local driver is allowed, but it must not grow into a second decision system. | Decide and write down: is the playground's squad logic a throwaway local driver, or the Encounter decision process hosted alongside? | owner |
| 5 | **Three existing vocabularies overlap with this one**: props' `variants` (view directions), Vehicle World's severity scale and `damage` level, and the `breakable` tag. | The standing complexity rule: do not add a parallel vocabulary. | Reuse the severity scale and the tag; call the new thing "state"; never reuse `variants`. | Nova, when a format is drafted |
| 6 | **A visible opening is not a usable route.** Routes are authored links. Two ways to switch a link already exist (tied to a door; `gate` off). | The handoff's first compatibility concern, and its open question on whether to extend an existing mechanism or add one. | Nova to say whether door-tied links can be generalised to "tied to a piece's state". | Nova |
| 7 | **One model per prop, static only.** No per-state models. | R1 needs at least two looks per piece. | Part of the format question. For walls, the Kenney family (§5) already swaps in place. | Nova |
| 8 | **Encounter only hears what it registered for** (B-4). | If state changes are not a registrable kind, characters never learn of them. | Add "piece changed state" to the list of physical facts when the I-1 list is next revised. Documentation only. | Claude, when authorised |
| 9 | **Art gaps**: no shattered glass, no rubble, no wrecked or dented car, no broken door, no sparking fixture. | The handoff asks which visual models already exist: the honest answer is walls and surface textures yes, glass and vehicles no. | Source or make them (`30_ONLINE_FINDS.md` §4). | owner |
| 10 | **This manifest's v1.0 "surface × impact" table treated a breaking window as an effect only.** | R6: effects mirror a state change; they are not the change. | Done in v1.1: `03_MATRICES.md` M5 and the hazard recipes are rewritten as "state change first, effects after". | Claude (done) |

No conflict was found with the Action Playground document: it says "ChatGPT/Nova handles Room Creator modifications", and its "storefront window" and "destructible, action-gamey" cars and storefronts are examples of exactly this rule.

---

## 9. Open questions

From the handoff (§9), all `OPEN`:

1. Exact state format and file layout; whether to extend existing prop and asset records.
2. Whether Room Creator switches existing links on and off, or needs a new mechanism.
3. Which objects take part in a first version; how many states each.
4. Exact triggers, damage build-up, severity and tags, resets and repair.
5. When and how Encounter commits a change relative to the physical update.
6. Which simple collision and navigation shapes suit the running code.
7. Which models and effects already exist in the asset set (answered as far as files go in §5).

Added by this integration, also `OPEN`:

8. Is the vehicle severity scale the one scale for all impacts, including thrown bodies?
9. For the Room Creator-only playground: where does the minimal local state driver live, and how is it kept from being mistaken for Encounter's history?
10. Do the three Kenney barricade versions form a sequence?
11. Does a swap of state need to re-check characters standing in or on the piece?

---

## 10. Proof targets for later

From the handoff (§8). `PROPOSED` future tests. **None exists or passes today.**

| target | passes when |
|---|---|
| state and identity | a known wall or prop keeps the same world id across its looks |
| collision consistency | a swap changes blocking as authored, with no leftover invisible collider |
| route consistency | an opening allows travel only where a valid link exists; rubble can close a path that was open |
| character response | a character changes route, guard position or cover because of the new state, through the ordinary decision process, not a scripted cue |
| event and persistence | the change is recorded once, and reloads or replays without duplicates or contradictions, in a host that supports it |
| performance | a few swaps and effects at once stay playable, with no piles of simulated fragments |
| regression | pieces without degradation data behave exactly as before; old routes and vehicle physics are untouched |

---

## 11. Not requested

A city-wide structural simulation · per-fragment physics or lasting debris · every object breakable · a new AI framework, renderer, physics engine or second vehicle system · immediate implementation · migration of existing authored worlds.

---

## 12. What changed in this manifest because of the handoff, and what work remains

**Changed in v1.1:** this page; `01_NEEDS.md` section G; `02_RECIPES.md` "World: state changes"; `03_MATRICES.md` M5 (piece × state × what it allows); `16_BUILDER.md` and `17_STREET_AND_VEHICLES.md` reworded as description, not instruction; `00_START_HERE.md` rules 7 and 9.

**Still to do, by owner of the work:**

| work | who |
|---|---|
| Decide conflict 2 (commit order), conflict 4 (where squad decisions live), conflict 3 (branch point and regression set) | owner |
| Draft the state format; answer the route question; say what a first slice would cover | Nova/ChatGPT, under a separately approved pass |
| Add the new row to the boundary matrix and the new fact kind to the interface list, once the owner accepts the wording in §3 | Claude, documentation only, when authorised |
| Fill the art gaps in §8 item 9 | owner |
| Write the proof targets in §10 as real tests | whoever builds the slice |
