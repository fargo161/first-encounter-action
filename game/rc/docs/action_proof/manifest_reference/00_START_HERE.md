# Action Game Asset Manifest · START HERE

*v1.1 · 2026-11-15 · 20 linked files + 18 numbered previews + one data file + two owner documents*

This is a lookup system for **every file the owner uploaded** for the first-person action playground: 18 loose images and 22 archives. It is written for an AI assistant working on that game. It tells you what exists, exactly where each picture sits, how the pieces combine, what is missing, and which parts of the design are settled.

Read this page first. Then open only the file your question needs.

**What is new in v1.1** is listed in §11.

---

## 1. Rules for the assistant using this manifest

1. **Look up, never guess.** Every rectangle, file name, frame count and size you need is in a table here. If something is not in the manifest, say "that is not in the uploaded set". Do not invent a file name or a coordinate.
2. **Use the IDs.** Every asset has one ID (grammar in §6). Quote IDs exactly.
3. **Coordinates** are pixels, origin at the top-left corner, measured in the **original uploaded image**. Identify an image by its pixel size (`90_ARCHIVES.md`), because file names change when files are re-saved.
4. **Cut each sheet the right way.** Six methods, A to F, in `20_SLICING_AND_SCALE.md`. The method for each asset is in §7 below.
5. **Scale by the sheet's own pixels-per-metre figure.** The sheets were drawn at different sizes.
6. **Do not paper over a gap.** Where the set has nothing (status `GAP` in `01_NEEDS.md`), say so and use the listed stand-in or leave it out.
7. **Describe; do not build.** The owner's design document says to wait for his explicit direction before building or changing code. **Room Creator's source is edited by ChatGPT/Nova only.** Claude works on Encounter-side work and on manifests. Pages here that name functions and files describe where things attach; they are not instructions to edit.
8. **Two owner documents outrank this manifest** (§2). Every design statement here carries a label (§3). **Never turn an `OPEN` item into a decision, and never present a `PROPOSED` number as agreed.**
9. **Damage to the world is a swap between ready-made states**, never simulated breaking, and effects follow a state change rather than cause one (`21_MODULAR_DEGRADATION.md`).
10. **This playground is separate from Trap Star** and from the main First Encounter game. Do not carry its action mechanics across.
11. **Descriptions of what a frame shows were written by eye** from the previews. Rectangles and counts were measured by program. If a description matters, open the preview and check the number.

---

## 2. What outranks what

| rank | source | where | governs |
|---|---|---|---|
| 1 | `FIRST_ENCOUNTER_ACTION_PLAYGROUND_CONTEXT_2026-11-15.md` | `source_docs/` (unchanged copy) | what the playground is |
| 1 | `ROOM_MODULAR_DEGRADATION_MANIFEST_HANDOFF_2026-11-15.md` | `source_docs/` (unchanged copy) | how damage to the world works; who owns what |
| 2 | the seven rules in §5 | owner's document inside the builder archive | the "Encounter spirit" |
| 3 | this manifest | here | facts about the uploaded files, and suggestions clearly marked as such |

If this manifest disagrees with a rank-1 document, the document wins and this manifest is wrong.

---

## 3. Labels

| label | meaning |
|---|---|
| `AGREED` | stated as decided in a rank-1 document |
| `PROPOSED` | suggested by this manifest, or floated in the documents without being decided. Free to reject |
| `OPEN` | the documents say it is undecided, or do not say. **Ask the owner** |
| `EXISTS` | found in the uploaded files or the builder's code today |
| `EXAMPLE` | an illustration, not a specification |

Asset readiness uses its own words (`READY`, `CUT`, `TINT`, `STAND-IN`, `GAP`, `CODE`), explained in `01_NEEDS.md`.

---

## 4. The game, from the owner's design document

A standalone, video-game-like **first-person action playground** made to stress-test Room Creator.

| part | what the document says | label |
|---|---|---|
| The player | very mobile, **fragile**: one or two gunshots kill, "maybe a few more" | `AGREED`; exact number `OPEN`; health that rebounds was floated, `OPEN` |
| Player verbs | **punch, kick, grab, throw, jump / dodge / rail change, slime**. **No fireballs and no guns for the player** | `AGREED` |
| Melee | punches and kicks **stun, shove and open a window**; repeated hits can kill slowly | `AGREED` (in the voice session the owner said they probably will not kill; the written file says they can, slowly: confirm) |
| The decisive weapon | **the environment**: a moving car, a ledge or roof, and one more hazard | `AGREED`; the third hazard is `OPEN` (shop window and electrical fixture were floated) |
| Movement | the rail system reused, chaining from rail to rail | `AGREED` in spirit; mechanics `OPEN` |
| Cars | **at least one moving car** to jump on and off; a mistimed jump hurts | `AGREED` |
| Enemies | a **four-person armed squad**; weapons **pistol, rifle, bomb thrower**; dispositions **aggressive, defensive, sneaky/tactical**, chosen independently of weapon | `AGREED` |
| Their thinking | **one shared decision process**; shared actions: hold, advance, attack, reposition, protect, interrupt, recover, rescue | `AGREED` |
| The woman | **one** protected woman. Grabbed bare, she struggles and may escape; slimed first, the hold lasts longer; carrying her limits the player's attacks | `AGREED`; a struggle meter was floated, `OPEN` |
| The pod | sustained slime forms a **pod**. Forming the pod is not the win | `AGREED` |
| Winning | **encasement reaches 100%** while the player defends the pod and the surviving guards turn into rescuers | `AGREED` |
| Slime | **one recharging meter**, three uses: snare guards, help secure the woman, form the pod | `AGREED`; costs and timings `OPEN` |
| Her safety | in the voice session the owner said not to kill her in the carnage; the written file does not include it | `OPEN`: confirm whether she can be hurt and whether that loses the game |
| World damage | ready-made states swapped on impact, with real consequences for movement, cover and sight | `AGREED` as a general rule; first slice `OPEN` (`21_MODULAR_DEGRADATION.md`) |

---

## 5. The seven design rules to keep (the "Encounter spirit")

From the owner's document inside the builder (`rc/TRAPSTAR_COMBAT_ROOM_KERNEL_AND_CLAUDE_STEERING_v0_1.md`):

1. **One world.** A fight does not switch the rest of the world off.
2. **Who someone is, is separate from what they are doing now.** A guard can stop shooting, run, or turn rescuer and still be the same character.
3. **Same rules for the player and everyone else.** If cover hides you from him, it hides him from you. If a car can hit a guard, it can hit you.
4. **People act on what they saw or heard**, not on what the game knows.
5. **State first, pictures second.** A drawing of a hit never decides that a hit happened.
6. **Special moves appear only when the conditions line up.** No "do anything anywhere" button.
7. **Deadly.** About two hits kills, both ways. No hidden health bars.

---

## 6. ID grammar

`CODE.set.key` — three parts at most, separated by dots.

| part | meaning | examples |
|---|---|---|
| `CODE` | which sheet or pack (2 to 4 capital letters or digits) | `GNC`, `TH1`, `KPA`, `SFX` |
| `set` | a named group inside it | `walk2`, `death_clean`, `stab3` |
| `key` | which one in the group: an **angle** (`F`, `FQ-L`, `S-R` …), a **step number**, or nothing | `GNP.walk2.S-L`, `SWN.death_blast.4`, `FPW.openhand` |

- **Colour suffix (new):** the eleven-colour gunman takes `@colour` on the end: `GNC.walk1.F@red`. Without a suffix, an ID means "any colour"; the tables list the gray block.
- Loose pieces on scrapbook sheets are numbered: `TH1.f06`, `DHM.f357`, `TKW.f26`. The number is the one drawn on the preview.
- A range is written `HIT.orange.1..6` (steps 1 to 6) or `GNC.walk1..4` (sets walk1 to walk4).
- Pack files use the file name: `KPA.flame_03`, `KSP.splat12`, `SFX.impactPunch_heavy`, `KBK.wall-low`, `TEX.Dec_Damage_Bullets_1`.
- **Angles:** `F` front, `FQ` front three-quarter, `S` side, `BQ` back three-quarter, `B` back; `-L` / `-R` = the figure faces the left / right edge of the source picture.
- Recipes are `R-NAME`, needs are `N-00`, matrices are `M1` to `M9`.

---

## 7. Everything at a glance

**Cut method:** A = plain rectangle · B = rectangle, then remove a solid background colour · C = connected region from a seed point · D = even grid · E = remove a painted-in checkerboard · F = remove a green screen, then shrink · — = loose file.

### Characters

| code | what | how many | cut | file |
|---|---|---|---|---|
| `GNC` | **gunman in 11 shirt colours**, pistol + launcher, 8 directions | 86 frames × 11 = 946 | B | `18_MORE_ENEMIES.md` |
| `GNP` | pistol gunman, 8 directions | 63 | B | `10_CHARACTERS.md` |
| `GNR` | rifle gunman, 5 directions | 35 | A (grid 100×100) | `10_CHARACTERS.md` |
| `SWN` | hat gunman: run, dive, jump, crawl, climb, three deaths | 144 | E | `18_MORE_ENEMIES.md` |
| `SWC` | bomb carrier (same picture as `SWN`) | 44 | E | `18_MORE_ENEMIES.md` |
| `ARM` | armoured bruiser, unarmed, punches | 96 | E | `18_MORE_ENEMIES.md` |
| `MSK` | masked knife man | 128 | A (grid 100×150) | `18_MORE_ENEMIES.md` |
| `BRW` | brawler; same pose set as the player body | 104 | A | `18_MORE_ENEMIES.md` |
| `TKW` | woman with a pistol (blurred copy) | 45 | F | `18_MORE_ENEMIES.md` |
| `PLB` | player body | 63 | A (grid 108×116) | `10_CHARACTERS.md` |
| `GRL` / `GRS` | the woman, large / small | 53 / 53 | A / B | `10_CHARACTERS.md` |
| `POD` | pod sequence | 12 | A | `10_CHARACTERS.md` |
| `GV2` | women variants + 4 pod styles | 23 stills | B | `10_CHARACTERS.md` |

### Everything else

| code | what | how many | cut | file |
|---|---|---|---|---|
| `TH1` / `TH2` | tan first-person hands | 38 / 54 pieces | C | `11_FIRST_PERSON.md` |
| `FPW` | kick, fists, weapons, pickups | 93 pieces | A | `11_FIRST_PERSON.md` |
| `DHM` | gloved hands scrapbook + boot kick | 388 pieces (67 identified) | C | `11_FIRST_PERSON.md`, `91_DHM_ALL_FRAMES.md` |
| `HS` / `E11` | finger-gun hand / blaster (not player verbs in v1.1) | 15 / 129 files | — | `11_FIRST_PERSON.md` |
| `HIT` `DUST` `WAT` `ICE` `DRK` | pixel effect animations | 24 animations | D | `12_VFX.md` |
| `GOO` | slime | 1 still + 2 animations | — | `12_VFX.md` |
| `KPA` `KSM` `KSP` | Kenney particles, smoke puffs, splats | 96 + 77 + 36 | — | `12_VFX.md` |
| `SFX` | impact sounds and footsteps | 130 in 26 families | — | `13_AUDIO.md` |
| `KBK` `LPA` `MOD` | room pieces and props (3D) | 79 + 217 + 81 | — | `14_WORLD_3D.md` |
| `CAR` `KNT` | spare vehicle models (3D) | 21 + 8 | — | `14_WORLD_3D.md` |
| `TEX` | pixel textures, including damaged versions | 1,043 | — | `14_WORLD_3D.md`, `92_TEXTURES_ALL.md` |
| `ICO` `ACC` `SHG` | icons, accessories, armour set | 80 + 4 sheets + 184 | D / — | `15_OTHER_2D.md` |
| `RC` | the builder, with street scenes and traffic | 951 files | — | `16_BUILDER.md`, `17_STREET_AND_VEHICLES.md` |

---

## 8. How to look something up (the program)

Work down this chain. Stop as soon as you have what you need.

| step | your question | open | you get |
|---|---|---|---|
| 0 | Is this settled, suggested or undecided? | §4 above, then `source_docs/` | the label |
| 1 | What does the game need, and is there art for it? | `01_NEEDS.md` | each need, its label, its status, the IDs that fill it |
| 2 | What exactly plays when **this event** happens? | `02_RECIPES.md` | one bundle: who, hands, travelling effect, impact, sound, screen, result |
| 3 | How do two lists combine? | `03_MATRICES.md` | verb × target, slime use × stage, weapon × disposition, piece × state |
| 4 | Where is **this asset** and what is in it? | `10` to `18` | file, size, every frame's rectangle |
| 5 | How do I cut it out and how big do I draw it? | `20_SLICING_AND_SCALE.md` | method, code, scale, facing, tint |
| 6 | Where would it plug into the game, and who may change that? | `16_BUILDER.md`, `17_STREET_AND_VEHICLES.md`, `21_MODULAR_DEGRADATION.md` | data format, attachment points, owners |
| 7 | The set has nothing: is there something online? | `30_ONLINE_FINDS.md` | links, by gap |

**Worked example. "The player throws a guard in front of a car."**
§4 says throw is `AGREED` and the environment is the decisive weapon.
`01_NEEDS.md` N-05 and N-27: hands exist; the only tumbling-body art is `SWN.death_blast.1..8`.
`02_RECIPES.md` → `R-THROW` then `R-CAR-HIT` list the hand frames, the body frames, the dust and the sounds.
`03_MATRICES.md` M4 says what a throw does to a guard, to the woman and to a breakable piece.
`17_STREET_AND_VEHICLES.md` §4 gives the car speed and the stopping distance that makes the timing matter, and says what is missing: thrown bodies and an injury rule.
`18_MORE_ENEMIES.md` gives the rectangles; `20_SLICING_AND_SCALE.md` says `SWN` is cut by method E.
`21_MODULAR_DEGRADATION.md` applies if the guard hits a shop front instead.

---

## 9. File map

| file | answers |
|---|---|
| `00_START_HERE.md` | this page |
| `01_NEEDS.md` | what the game needs, what fills it, what is missing, what is undecided |
| `02_RECIPES.md` | what plays for each game event |
| `03_MATRICES.md` | the combination tables |
| `10_CHARACTERS.md` | first batch: two gunmen, player body, the woman, pods. Comparison table of all fourteen |
| `11_FIRST_PERSON.md` | hands, kicks, weapons: every frame |
| `12_VFX.md` | effects, slime, particles |
| `13_AUDIO.md` | sounds, and the sounds that do not exist |
| `14_WORLD_3D.md` | room pieces, props, spare vehicles, textures |
| `15_OTHER_2D.md` | icons and the packs that do not fit |
| `16_BUILDER.md` | the existing combat room: files, coordinates, data formats, code map |
| `17_STREET_AND_VEHICLES.md` | **new:** street scenes, traffic, the bridge drop, what cars do today |
| `18_MORE_ENEMIES.md` | **new:** the seven third-batch characters, every frame |
| `20_SLICING_AND_SCALE.md` | cutting (methods A to F), scale, facing, tint |
| `21_MODULAR_DEGRADATION.md` | **new:** the approved state-swap rule, where it fits, conflicts, open questions |
| `30_ONLINE_FINDS.md` | **new:** things on the web that fill gaps |
| `90_ARCHIVES.md` | every upload and where it is described |
| `91_DHM_ALL_FRAMES.md`, `92_TEXTURES_ALL.md`, `93_MODELS_ALL.md` | full name lists |
| `previews/<CODE>_numbered.png` | each sheet with every frame boxed and numbered (the `#` column) |
| `data/frames.json` | all 2,382 rectangles, seeds, colour offsets and pose lists as data, for code |
| `source_docs/` | the two owner documents, unchanged |

---

## 10. The biggest facts

1. **The squad is covered.** `GNC` gives one gunman in eleven colours with a pistol shot and a launcher shot in all eight directions. Four colours make four guards who can be told apart at a glance.
2. **Nothing draws a bomb being thrown.** The nearest are `GNC`'s launcher shot, `ARM`'s throw-like arm action and `SWC`, who carries a bomb and runs. Which one the "bomb thrower" becomes is `OPEN`.
3. **Thrown bodies have one animation in the whole set:** `SWN.death_blast.1..8`.
4. **The woman has no struggle, carried or half-slimed frames.** `POD`'s twelve frames cover the pod itself.
5. **The player's kick still matches nothing**, and his body has no punch or grab frames; `BRW` shows what those would look like.
6. **The street, the traffic and the drop already exist in the builder** (`17_STREET_AND_VEHICLES.md`). Jumping, standing on a car, throwing, falling and any injury from a car do not.
7. **Cars stop for people when they can.** From cruising speed a car needs about 7 m. That is the timing window for every car hazard.
8. **Sound is still impacts and footsteps only**, and the builder has no sound code.
9. **World damage is approved as swaps between ready-made states**, not built, with ten points to settle first (`21_MODULAR_DEGRADATION.md` §8).
10. **Three of the new sheets are poor copies** (checkerboard, shrunk, blurred). They cut cleanly with the methods given, and cleaner originals probably exist (`30_ONLINE_FINDS.md` §1).

---

## 11. What changed from v1.0

| change | why |
|---|---|
| Design pages `01`, `02`, `03` rewritten | the owner's design document replaced the first brief: no fire, ice or energy for the player; grab, throw, carry, one slime meter, pod progress, rescue; four guards with weapon and disposition chosen separately |
| Every design statement labelled | the design document says not to turn undecided points into decisions |
| Six sheets added: 1,507 new frames, seven characters | third batch from the owner |
| Two cutting methods added (E, F) | three of the new sheets have no real transparency |
| `17`, `18`, `21`, `30` added | street and cars; new enemies; the degradation rule; online finds |
| Art no longer assigned to behaviours | the design makes weapon and disposition independent |
| Builder pages reworded as description | Room Creator is edited by ChatGPT/Nova only |
| Cars moved from "not needed" to central | the design calls for a moving car |
