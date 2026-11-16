# 16 · The builder (Room Creator, Combat Room v0.1.1)

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

What already exists and runs. Archive `Room_Creator_v0_2_COMBAT_ROOM_v0_1_1.zip`; everything is under `rc/`. This file is a map of the parts an LLM needs to touch to turn the gunfight into the action playground. **Who changes this code is for the owner to say:** the design document assigns Room Creator changes to ChatGPT/Nova and Encounter-side work to Claude. Facts here were read from the files, not from running them.

## 1. Files that matter

| path under `rc/` | what it is |
|---|---|
| `Play_Combat_Room.html` | the playable game, one self-contained file (6.5 MB). Double-click to run. **Built output: do not edit by hand.** |
| `examples/Combat_Test_Room.room.json` | the scene: rooms, movement network, bots, combat numbers, and the character pictures embedded as images |
| `source/ui-combat.js` | all combat logic (38 KB): bot brain, player gun, hits, HUD |
| `source/ui-route.js` | first-person movement on the path network (126 KB). Calls into combat through hooks |
| `source/style.css`, `source/shell.html`, other `source/*.js` | the rest of the editor and renderer |
| `tools/make_combat_room.cjs` | **generates the scene file**: room layout, spots, links, bots. Edit this to change the room |
| `tools/build_combat_characters.py` | packs character cut-outs into one image per character plus the JSON that describes them |
| `source/build.py`, `source/build_combat_play.py` | assemble the sources into `Room_Creator.html` and `Play_Combat_Room.html` |
| `characters/combat/` | `buyer_atlas.png`, `supplier_atlas.png`, `tracksuit_atlas.png` (1024 wide), `pistol_strip.png`, `combat_characters.json`, `source_cutouts/` |
| `COMBAT_NPC_STANDARD_V0_1.md` | the bot rules in words |
| `COMBAT_ROOM_V0_1_REPORT.md` | what was built and tested, and its limits |
| `TRAPSTAR_COMBAT_ROOM_KERNEL_AND_CLAUDE_STEERING_v0_1.md` | the owner's design rules. **Read §3 of `00_START_HERE.md` for the seven that bind this game** |
| `tests/combat_scene.test.js`, `tests/combat/*.py` | automated checks |

**Rebuild order** (from `rc/`): `python3 tools/build_combat_characters.py` → `node tools/make_combat_room.cjs` → `python3 source/build.py` → `python3 source/build_combat_play.py`. Needs Python 3 with Pillow, and Node.

## 2. Coordinates and scale

Metres. Grid 0.1 m. **North is −y.** Two floors: story 0 (ground) and story 1; floor-to-floor 3.3 m, walls 2.8 m. Character cards: a flat picture that turns to face the camera, sized by `height` (metres) and `pxPerMetre`.

## 3. Rooms

| room | floor | x | y | width | length | open above |
|---|---|---|---|---|---|---|
| Hallway | 0 | 0 | 0 | 2.6 | 12 |  |
| Hallway recess · west | 0 | -2 | 2.8 | 2 | 2 |  |
| Hallway recess · east | 0 | 2.6 | 6.8 | 2 | 2 |  |
| Lobby | 0 | -4 | -10 | 14 | 10 | yes |
| Laundry recess | 0 | -3.5 | -12 | 3 | 2 |  |
| Exit corridor | 0 | 10 | -9.8 | 3 | 2.2 |  |
| Apartment 305 | 0 | -9 | 5 | 9 | 7 |  |
| Apartment back room | 0 | -11 | 10 | 2 | 2 |  |
| Balcony · north | 1 | -4 | -10 | 11 | 3 |  |
| Balcony · east | 1 | 7 | -10 | 3 | 7 |  |
| Stair exit | 1 | 4.2 | -12 | 2 | 2 |  |

`x, y` is the room's corner with the smallest values; `width` runs along x, `length` along y.

## 4. Movement network

The player walks along **links** between **path points**, and may step sideways up to `band` metres from the line. **Spots** are named places beside the path: cover for the player, cover for bots, door approaches, exits.

### Path points (30)

| id | name | x | y | floor |
|---|---|---|---|---|
| `v_start` | Hallway · south end | 1.3 | 11.3 | 0 |
| `v_apt_app` | Apt. 305 approach | 1.3 | 10.1 | 0 |
| `v_h_mid` | Hallway · middle | 1.3 | 5.9 | 0 |
| `v_lobby_app` | Lobby door approach | 1.3 | 0.9 | 0 |
| `v_lobby_thr` | Lobby door threshold | 1.3 | 0.45 | 0 |
| `v_lobby_in` | Inside the lobby door | 1.3 | -0.7 | 0 |
| `v_a` | Lobby · south corridor west | -2.5 | -3 | 0 |
| `v_b` | Lobby · south corridor centre | 1.3 | -3 | 0 |
| `v_c` | Lobby · south corridor east | 8 | -3 | 0 |
| `v_sb` | Stairs · bottom | 9.3 | -3.05 | 0 |
| `v_st` | Stairs · top | 9.3 | -7.95 | 1 |
| `v_d` | Lobby · west corridor north | -2.5 | -8.3 | 0 |
| `v_e` | Lobby · north corridor centre | 1.3 | -8.3 | 0 |
| `v_f` | Lobby · north corridor east | 8 | -8.3 | 0 |
| `v_exit_app` | EXIT approach | 9.1 | -8.9 | 0 |
| `v_exit_thr` | EXIT threshold | 9.65 | -8.9 | 0 |
| `v_exit_in` | Exit corridor | 11 | -8.9 | 0 |
| `v_b1` | Balcony · stair landing | 9.3 | -8.9 | 1 |
| `v_b2` | Balcony · centre | 5.2 | -8.9 | 1 |
| `v_b3` | Balcony · west end | -2.5 | -8.9 | 1 |
| `v_be1` | Balcony east · north | 7.9 | -8.3 | 1 |
| `v_be2` | Balcony east · south | 7.9 | -4 | 1 |
| `v_balc_app` | Stair exit approach | 5.2 | -9.1 | 1 |
| `v_balc_thr` | Stair exit threshold | 5.2 | -9.55 | 1 |
| `v_apt_thr` | Apt. 305 threshold | 0.45 | 10.1 | 0 |
| `v_apt_in` | Inside Apt. 305 | -0.8 | 10.1 | 0 |
| `v_ap1` | Apartment · east | -2.5 | 10.1 | 0 |
| `v_ap2` | Apartment · west | -6.5 | 10.1 | 0 |
| `v_ap3` | Apartment · north-west | -6.5 | 7.2 | 0 |
| `v_ap4` | Apartment · north-east | -2.5 | 7.2 | 0 |

### Links (32)

| id | name | from | to | band (m) | door |
|---|---|---|---|---|---|
| `e_h1` | Hallway | `v_start` | `v_apt_app` | 0.7 |  |
| `e_h2` | Hallway | `v_apt_app` | `v_h_mid` | 0.7 |  |
| `e_h3` | Hallway | `v_h_mid` | `v_lobby_app` | 0.7 |  |
| `e_lobby_gate` | Lobby door · threshold | `v_lobby_app` | `v_lobby_thr` | 0.3 | yes |
| `e_lobby_door` | Lobby doorway | `v_lobby_thr` | `v_lobby_in` | 0.3 | yes |
| `e_l0` | Lobby entry | `v_lobby_in` | `v_b` | 0.6 |  |
| `e_l1` | Lobby · south corridor | `v_a` | `v_b` | 0.8 |  |
| `e_l2` | Lobby · south corridor | `v_b` | `v_c` | 0.8 |  |
| `e_l3` | Lobby · west corridor | `v_a` | `v_d` | 0.7 |  |
| `e_l4` | Lobby · north corridor | `v_d` | `v_e` | 0.7 |  |
| `e_l5` | Lobby · north corridor | `v_e` | `v_f` | 0.7 |  |
| `e_l6` | Lobby · east corridor | `v_c` | `v_f` | 0.7 |  |
| `e_l7` | Lobby · centre crossing | `v_b` | `v_e` | 0.6 |  |
| `e_stairs_in` | To the stairs | `v_c` | `v_sb` | 0.4 |  |
| `e_stairs` | Lobby stairs | `v_sb` | `v_st` | 0.35 |  |
| `e_land` | Stair landing | `v_st` | `v_b1` | 0.4 |  |
| `e_exit_app` | EXIT approach | `v_f` | `v_exit_app` | 0.4 |  |
| `e_exit_gate` | EXIT · threshold | `v_exit_app` | `v_exit_thr` | 0.3 | yes |
| `e_exit_door` | EXIT doorway | `v_exit_thr` | `v_exit_in` | 0.3 | yes |
| `e_b1` | Balcony · north gallery | `v_b1` | `v_b2` | 0.7 |  |
| `e_b2` | Balcony · north gallery | `v_b2` | `v_b3` | 0.7 |  |
| `e_be1` | Balcony · east gallery | `v_b1` | `v_be1` | 0.5 |  |
| `e_be2` | Balcony · east gallery | `v_be1` | `v_be2` | 0.5 |  |
| `e_balc_app` | Stair exit approach | `v_b2` | `v_balc_app` | 0.3 |  |
| `e_balc_gate` | Stair exit · threshold | `v_balc_app` | `v_balc_thr` | 0.3 | yes |
| `e_apt_gate` | Apt. 305 · threshold | `v_apt_app` | `v_apt_thr` | 0.3 | yes |
| `e_apt_door` | Apt. 305 doorway | `v_apt_thr` | `v_apt_in` | 0.3 | yes |
| `e_ap0` | Apartment entry | `v_apt_in` | `v_ap1` | 0.6 |  |
| `e_ap1` | Apartment · south side | `v_ap1` | `v_ap2` | 0.8 |  |
| `e_ap2` | Apartment · west side | `v_ap2` | `v_ap3` | 0.7 |  |
| `e_ap3` | Apartment · north side | `v_ap3` | `v_ap4` | 0.8 |  |
| `e_ap4` | Apartment · east side | `v_ap4` | `v_ap1` | 0.7 |  |

### Spots (29)

`types` tells who may use it: `cover` = player cover, `cover`+`bot` = bot cover, `hide` = fully hidden, `exit`+`bot` = where bots flee to, `door`/`approach`/`interact` = stand here to use a door. `facing` in degrees. `coverHeight` = height in metres of the thing a bot hides behind.

| id | name | x | y | floor | types | facing | coverHeight |
|---|---|---|---|---|---|---|---|
| `N_lobby_door` | At the lobby door | 1.3 | 0.9 | 0 | door approach interact | 0 |  |
| `N_exit_door` | At the EXIT | 9.1 | -8.9 | 0 | door approach interact | 90 |  |
| `N_balc_door` | At the stair exit | 5.2 | -9.1 | 1 | door approach interact | 0 |  |
| `N_apt_door` | At Apt. 305 | 1.3 | 10.1 | 0 | door approach interact | 270 |  |
| `S_recess_w` | Hallway recess · west | -0.5 | 3.8 | 0 | cover hide | 0 |  |
| `S_recess_e` | Hallway recess · east | 3.1 | 7.8 | 0 | cover hide | 0 |  |
| `S_doorway` | Lobby doorway frame | 0.75 | -0.35 | 0 | cover | 0 |  |
| `S_col1` | Behind column 1 | 3.3 | -3.6 | 0 | cover | 0 |  |
| `S_col2` | Behind column 2 | 6.5 | -3.6 | 0 | cover | 0 |  |
| `S_crate2` | Behind the crate (west) | -1.2 | -3.5 | 0 | cover hide | 0 |  |
| `S_stairfoot` | Under the stairs | 8.2 | -4.2 | 0 | cover | 0 |  |
| `S_rail` | Balcony rail | 3.3 | -7.45 | 1 | cover | 0 |  |
| `S_window` | At the balcony window | 2.3 | -9.3 | 1 | loiter | 0 |  |
| `S_couch` | Behind the couch | -4.5 | 9.3 | 0 | cover | 0 |  |
| `S_apt_frame` | Apt. 305 doorframe | -1.3 | 9.3 | 0 | cover | 270 |  |
| `S_fridge` | Beside the fridge | -7.6 | 6.7 | 0 | cover | 0 |  |
| `B_crate1` | Behind crate 1 | 6 | -7.1 | 0 | cover bot | 180 | 1.1 |
| `B_laundry` | Laundry recess | -2.8 | -10.6 | 0 | cover bot | 180 | 1 |
| `B_col1` | North of column 1 | 3.3 | -5 | 0 | cover bot | 180 | 3 |
| `B_col2` | North of column 2 | 6.5 | -5 | 0 | cover bot | 180 | 3 |
| `B_crate2` | North of crate 2 | -1.2 | -5 | 0 | cover bot | 180 | 1.1 |
| `B_rail_e` | Balcony east · over the rail | 7.35 | -5.6 | 1 | cover bot | 250 | 1.05 |
| `B_rail_n` | Balcony north · over the rail | 5.5 | -7.35 | 1 | cover bot | 180 | 1.05 |
| `B_counter` | Behind the kitchen counter | -6.5 | 5.45 | 0 | cover bot | 180 | 0.9 |
| `B_tv` | Behind the TV stand | -1.2 | 5.6 | 0 | cover bot | 180 | 0.6 |
| `B_couch_n` | North of the couch | -4.5 | 7.45 | 0 | cover bot | 180 | 0.85 |
| `X_exit` | EXIT door (bots) | 9.3 | -8.9 | 0 | exit bot | 90 |  |
| `X_balc` | Stair exit (bots) | 5.2 | -9.2 | 1 | exit bot | 0 |  |
| `X_apt` | Apartment back door (bots) | -8.3 | 11 | 0 | exit bot | 270 |  |

**Vertical pairs worth a leap link** (same x,y region, different floor): lobby floor `v_e` (1.3, −8.3) ↔ balcony `v_b2` (5.2, −8.9) and `v_b3` (−2.5, −8.9); lobby floor `v_f` (8, −8.3) ↔ balcony `v_be1` (7.9, −8.3); lobby floor `v_c` (8, −3) ↔ balcony `v_be2` (7.9, −4). The balcony floor is 3.3 m up with a 1.05 m rail.

## 5. Bots and combat numbers

| id | name | pictures | temper | role | side | group | hp | starts at | wakes on |
|---|---|---|---|---|---|---|---|---|---|
| `contact` | Contact | buyer | fighter | gunman | crew A | lobby | 2 | `B_crate1` | door:opening_mvz5659o_7tpmb7r |
| `tracksuit` | Tracksuit | tracksuit | skittish | lookout | crew A | lobby | 2 | `B_laundry` | sight or sound |
| `broker` | Broker | supplier | fighter | boss | crew A | lobby | 2 | `B_rail_e` | sight or sound |
| `broker2` | Broker (apartment) | supplier | fighter | gunman | crew B | apartment | 2 | `B_counter` | door:opening_mvz5659r_yhap21y |
| `tracksuit2` | Tracksuit (apartment) | tracksuit | skittish | lookout | crew B | apartment | 2 | `B_tv` | door:opening_mvz5659r_yhap21y |

Every bot also carries `hostileTo: ["player"]`. A bot whose `hostileTo` does not include the player **holds fire**: that is the hook for bystanders and for bodyguards.

**Tempers** (`routeNet.combat.tempers`):

| setting | fighter | skittish | runner |
|---|---|---|---|
| accuracy | 0.28 | 0.2 | 0 |
| fireInterval | [1.3, 2] | [1.5, 2.3] | [9, 9] |
| burst | [1, 2] | [1, 2] | [0, 0] |
| magazine | 6 | 6 | 0 |
| reload | 2.6 | 3 | 9 |
| peek | [1.2, 1.9] | [1, 1.4] | [0, 0] |
| duck | [1.4, 2.8] | [1.6, 3] | [9, 9] |
| flinch | 0.6 | 0.8 | 0.8 |
| aimTime | 0.6 | 0.5 | 9 |
| notice | 26 | 22 | 20 |
| shotsBeforeFlee |  | 2 |  |
| fleeBelowHp | 0 | 2 |  |
| warningShotFlees |  | True |  |
| fleesOnSight |  |  | True |

`accuracy` = chance per shot when all three of the player's body points are visible. Times in seconds. `notice` = metres.

**Player** (`routeNet.combat.player`): `{"life": 2, "magazine": 6, "reloadTime": 1.6, "fireInterval": 0.28, "recoil": 2.6, "hitGrace": 1.2, "unsteadyAfterHit": 0.8}`.

**Hit zones on a bot:** top 15% of the picture = head (down at once); bottom 48% = legs (disabled); between = body (−1 hp). **Score:** `{"bodyHit": 100, "headHit": 300, "legsDisable": 150, "surrender": 200, "flee": 50, "exit": 500}`.

**Objective:** `{"kind": "reach", "node": "N_exit_door", "door": "opening_mvz5659q_zn2nnrm", "doneEdge": "e_exit_door", "label": "GET TO THE EXIT", "sublabel": "Apt. 305 is optional"}`. Side objective: `{"kind": "clearGroup", "group": "apartment", "door": "opening_mvz5659r_yhap21y", "label": "SURVIVE THE AMBUSH"}`.

## 6. Character picture format

One image per character (an *atlas*: many pictures packed into one) plus a description. This is the shape new characters must take.

```json
{"id":"buyer","name":"Buyer","height":1.8,"pxPerMetre":110,"atlas":"asset_character_buyer",
 "frames":{
   "stand.front":{"x":375,"y":210,"w":74,"h":197,"ax":37,"neck":[37.5,32],"nohead":"stand.front~nohead"},
   "aim.front":  {"x":183,"y":1024,"w":164,"h":540,"ax":71.8,"ppm":300,"hand":[40,100]}
 },
 "states":{
   "stand":{"front":["stand.front"],"q":["stand.q"],"side":["stand.side"],"bq":["stand.bq"],"back":["stand.back"]},
   "walk": {"front":["walk.front","walk.front|m"],"side":["walk.side"]},
   "aim":  {"front":["aim.front"]}
 }}
```

| field | meaning |
|---|---|
| `frames.<name>` | one picture: `x y w h` in the atlas |
| `ax` | feet centre, pixels from the picture's left edge (**the same `ax` this manifest gives**) |
| `ppm` | optional pixels-per-metre for this one picture, when it differs from the character's `pxPerMetre` |
| `hand` | optional muzzle point `[x,y]` inside the picture, where the gun flash is drawn |
| `neck`, `nohead` | optional, for the turning-head trick. Leave out for new characters |
| `states.<pose>.<angle>` | list of frame names played in order. A name ending `\|m` means "this frame mirrored" |
| angles | `front`, `q` (front three-quarter), `side`, `bq` (back three-quarter), `back`. **Turned pictures must face the picture's right**; the game mirrors them for the left |

**Manifest angle → builder angle:** `F`→`front`, `FQ-R`→`q`, `S-R`→`side`, `BQ-R`→`bq`, `B`→`back`. A `-L` picture must be mirrored before packing (or listed with `|m`).

**Poses the combat code asks for** (`cbPose` in `ui-combat.js`): `stand`, `guard`, `aim`, `flinch`, `flee`, `surrender`. Movement code also uses `walk` and `run`. A bot that is down is drawn as its `flinch` (or `stand`) picture tipped over; there is no `down` pose yet. A missing pose falls back: `aim`→`guard`→`stand`.

**First-person weapon** (`routeNet.combat.weapon`): `{"atlas": "asset_pistol_strip", "frames": 14, "frameW": 180, "frameH": 180, "columns": 10, "idle": [0, 10, 11, 12, 13, 12, 11, 10], "fire": [1, 2, 3, 4, 5, 6, 7, 8, 9], "fireFps": 24, "idleFps": 4}`. A strip of equal frames; `idle` and `fire` are lists of frame numbers.

### Ready-made pose lists for the new sprites

Frame names below are manifest IDs. `|m` = mirror. Poses the builder does not know yet are marked NEW and need a line in `cbPose`.

**GNP (pistol gunman)**

```json
{
 "stand": {
  "front": ["GNP.idle.F"],
  "q": ["GNP.idle.FQ-R"],
  "side": ["GNP.idle.S-R"],
  "bq": ["GNP.idle.BQ-R"],
  "back": ["GNP.idle.B"]
 },
 "walk": {
  "front": ["GNP.walk1.F", "GNP.walk2.F", "GNP.walk3.F", "GNP.walk4.F"],
  "q": ["GNP.walk1.FQ-R", "GNP.walk2.FQ-R", "GNP.walk3.FQ-R", "GNP.walk4.FQ-R"],
  "side": ["GNP.walk1.S-R", "GNP.walk2.S-R", "GNP.walk3.S-R", "GNP.walk4.S-R"],
  "bq": ["GNP.walk1.BQ-R", "GNP.walk2.BQ-R", "GNP.walk3.BQ-R", "GNP.walk4.BQ-R"],
  "back": ["GNP.walk1.B", "GNP.walk2.B", "GNP.walk3.B", "GNP.walk4.B"]
 },
 "run": "same lists as walk, played faster",
 "flee": "walk lists, angles bq and back",
 "guard": {
  "front": ["GNP.fire.1"]
 },
 "aim": {
  "front": ["GNP.fire.2"]
 },
 "fire (NEW)": {
  "front": ["GNP.fire.3", "GNP.fire.4"]
 },
 "flinch": {
  "front": ["GNP.hurt.1", "GNP.hurt.2"]
 },
 "down (NEW)": {
  "front": ["GNP.death_clean.1", "GNP.death_clean.2", "GNP.death_clean.3", "GNP.death_clean.4", "GNP.death_clean.5"]
 },
 "rise (NEW, ambush)": {
  "front": ["GNP.rise.1", "GNP.rise.2", "GNP.rise.3", "GNP.rise.4", "GNP.rise.5"]
 }
}
```

**GNR (rifle gunman)**

```json
{
 "stand": {
  "front": ["GNR.aim.F"],
  "q": ["GNR.aim.FQ-L|m"],
  "side": ["GNR.aim.S-L|m"],
  "bq": ["GNR.aim.BQ-L|m"],
  "back": ["GNR.aim.B"]
 },
 "walk": "run lists, played slower",
 "run": {
  "front": ["GNR.run1.F", "GNR.run2.F", "GNR.run3.F", "GNR.run4.F"],
  "q": ["GNR.run1.FQ-L|m", "GNR.run2.FQ-L|m", "GNR.run3.FQ-L|m", "GNR.run4.FQ-L|m"],
  "side": ["GNR.run1.S-L|m", "GNR.run2.S-L|m", "GNR.run3.S-L|m", "GNR.run4.S-L|m"],
  "bq": ["GNR.run1.BQ-L|m", "GNR.run2.BQ-L|m", "GNR.run3.BQ-L|m", "GNR.run4.BQ-L|m"],
  "back": ["GNR.run1.B", "GNR.run2.B", "GNR.run3.B", "GNR.run4.B"]
 },
 "flee": "run lists, angles bq and back",
 "guard": {
  "front": ["GNR.aim.F"],
  "q": ["GNR.aim.FQ-L|m"],
  "side": ["GNR.aim.S-L|m"],
  "bq": ["GNR.aim.BQ-L|m"],
  "back": ["GNR.aim.B"]
 },
 "aim": {
  "front": ["GNR.aim.F"],
  "q": ["GNR.aim.FQ-L|m"],
  "side": ["GNR.aim.S-L|m"],
  "bq": ["GNR.aim.BQ-L|m"],
  "back": ["GNR.aim.B"]
 },
 "fire (NEW)": {
  "front": ["GNR.fire.F"],
  "q": ["GNR.fire.FQ-L|m"],
  "side": ["GNR.fire.S-L|m"],
  "bq": ["GNR.fire.BQ-L|m"],
  "back": ["GNR.fire.B"]
 },
 "flinch": {
  "front": ["GNR.death.1"]
 },
 "down (NEW)": {
  "front": ["GNR.death.1", "GNR.death.2", "GNR.death.3", "GNR.death.4", "GNR.death.5"]
 }
}
```

**GRL (girl)**

```json
{
 "stand": {
  "front": ["GRL.stand.F"],
  "q": ["GRL.stand.FQ-L|m"],
  "side": ["GRL.stand.S-L|m"],
  "bq": ["GRL.stand.BQ-L|m"],
  "back": ["GRL.stand.B"]
 },
 "walk": {
  "front": ["GRL.walk1.F", "GRL.walk2.F", "GRL.walk3.F", "GRL.walk4.F"],
  "q": ["GRL.walk1.FQ-L|m", "GRL.walk2.FQ-L|m", "GRL.walk3.FQ-L|m", "GRL.walk4.FQ-L|m"],
  "side": ["GRL.walk1.S-L|m", "GRL.walk2.S-L|m", "GRL.walk3.S-L|m", "GRL.walk4.S-L|m"],
  "bq": ["GRL.walk1.BQ-L|m", "GRL.walk2.BQ-L|m", "GRL.walk3.BQ-L|m", "GRL.walk4.BQ-L|m"],
  "back": ["GRL.walk1.B", "GRL.walk2.B", "GRL.walk3.B", "GRL.walk4.B"]
 },
 "run": {
  "front": ["GRL.run1.F", "GRL.run2.F", "GRL.run3.F", "GRL.run4.F"],
  "q": ["GRL.run1.FQ-L|m", "GRL.run2.FQ-L|m", "GRL.run3.FQ-L|m", "GRL.run4.FQ-L|m"],
  "side": ["GRL.run1.S-L|m", "GRL.run2.S-L|m", "GRL.run3.S-L|m", "GRL.run4.S-L|m"],
  "bq": ["GRL.run1.BQ-L|m", "GRL.run2.BQ-L|m", "GRL.run3.BQ-L|m", "GRL.run4.BQ-L|m"],
  "back": ["GRL.run1.B", "GRL.run2.B", "GRL.run3.B", "GRL.run4.B"]
 },
 "flee": "run lists",
 "duck (NEW)": {
  "front": ["GRL.duck.F"],
  "q": ["GRL.duck.FQ-L|m"],
  "side": ["GRL.duck.S-L|m"],
  "bq": ["GRL.duck.BQ-L|m"],
  "back": ["GRL.duck.B"]
 },
 "down (NEW)": {
  "front": ["GRL.death.1", "GRL.death.2", "GRL.death.3"]
 },
 "held in a pod (NEW)": {
  "front": ["POD.f07", "POD.f08", "POD.f09", "POD.f08"]
 }
}
```

**PLB (player body, only if shown)**

```json
{
 "stand": {
  "front": ["PLB.idle.F"],
  "q": ["PLB.idle.FQ-R"],
  "side": ["PLB.idle.S-R"],
  "bq": ["PLB.idle.BQ-R"],
  "back": ["PLB.idle.B"]
 },
 "run": {
  "front": ["PLB.run1.F", "PLB.run2.F", "PLB.run3.F", "PLB.run4.F", "PLB.run5.F", "PLB.run6.F"],
  "q": ["PLB.run1.FQ-R", "PLB.run2.FQ-R", "PLB.run3.FQ-R", "PLB.run4.FQ-R", "PLB.run5.FQ-R", "PLB.run6.FQ-R"],
  "side": ["PLB.run1.S-R", "PLB.run2.S-R", "PLB.run3.S-R", "PLB.run4.S-R", "PLB.run5.S-R", "PLB.run6.S-R"],
  "bq": ["PLB.run1.BQ-R", "PLB.run2.BQ-R", "PLB.run3.BQ-R", "PLB.run4.BQ-R", "PLB.run5.BQ-R", "PLB.run6.BQ-R"],
  "back": ["PLB.run1.B", "PLB.run2.B", "PLB.run3.B", "PLB.run4.B", "PLB.run5.B", "PLB.run6.B"]
 },
 "guard": {
  "front": ["PLB.ready.F"],
  "q": ["PLB.ready.FQ-R"],
  "side": ["PLB.ready.S-R"],
  "bq": ["PLB.ready.BQ-R"],
  "back": ["PLB.ready.B"]
 },
 "leap (NEW)": {
  "front": ["PLB.armsup.F"],
  "q": ["PLB.armsup.FQ-R"],
  "side": ["PLB.armsup.S-R"],
  "bq": ["PLB.armsup.BQ-R"],
  "back": ["PLB.armsup.B"]
 },
 "flinch": {
  "front": ["PLB.pain.1", "PLB.pain.2", "PLB.pain.3"]
 },
 "down (NEW)": {
  "front": ["PLB.death.1", "PLB.death.2", "PLB.death.3", "PLB.death.4", "PLB.death.5", "PLB.death.6"]
 }
}
```

**GNC (gunman, any colour: add @colour to every name)**

```json
{
 "stand": {
  "front": ["GNC.idle.F"],
  "q": ["GNC.idle.FQ-R"],
  "side": ["GNC.idle.S-R"],
  "bq": ["GNC.idle.BQ-R"],
  "back": ["GNC.idle.B"]
 },
 "walk": {
  "front": ["GNC.walk1.F", "GNC.walk2.F", "GNC.walk3.F", "GNC.walk4.F"],
  "q": ["GNC.walk1.FQ-R", "GNC.walk2.FQ-R", "GNC.walk3.FQ-R", "GNC.walk4.FQ-R"],
  "side": ["GNC.walk1.S-R", "GNC.walk2.S-R", "GNC.walk3.S-R", "GNC.walk4.S-R"],
  "bq": ["GNC.walk1.BQ-R", "GNC.walk2.BQ-R", "GNC.walk3.BQ-R", "GNC.walk4.BQ-R"],
  "back": ["GNC.walk1.B", "GNC.walk2.B", "GNC.walk3.B", "GNC.walk4.B"]
 },
 "run": "same lists as walk, played faster",
 "aim": {
  "front": ["GNC.shoot1.F"],
  "q": ["GNC.shoot1.FQ-R"],
  "side": ["GNC.shoot1.S-R"],
  "bq": ["GNC.shoot1.BQ-R"],
  "back": ["GNC.shoot1.B"]
 },
 "fire (NEW)": {
  "front": ["GNC.shoot1.F", "GNC.shoot2.F"],
  "q": ["GNC.shoot1.FQ-R", "GNC.shoot2.FQ-R"],
  "side": ["GNC.shoot1.S-R", "GNC.shoot2.S-R"],
  "bq": ["GNC.shoot1.BQ-R", "GNC.shoot2.BQ-R"],
  "back": ["GNC.shoot1.B", "GNC.shoot2.B"]
 },
 "launch (NEW)": {
  "front": ["GNC.launch1.F", "GNC.launch2.F"],
  "q": ["GNC.launch1.FQ-R", "GNC.launch2.FQ-R"],
  "side": ["GNC.launch1.S-R", "GNC.launch2.S-R"],
  "bq": ["GNC.launch1.BQ-R", "GNC.launch2.BQ-R"],
  "back": ["GNC.launch1.B", "GNC.launch2.B"]
 },
 "flinch": {
  "q": ["GNC.death_clean.1|m"]
 },
 "down (NEW)": {
  "q": ["GNC.death_clean.1|m", "GNC.death_clean.2|m", "GNC.death_clean.3|m", "GNC.death_clean.4|m", "GNC.death_clean.5|m", "GNC.death_clean.6|m", "GNC.death_clean.7|m"]
 }
}
```

**SWN (hat gunman)**

```json
{
 "stand": "no idle frame: hold the first aim frame (front, q, side) or the first run frame (bq, back)",
 "run": {
  "front": ["SWN.run1.F", "SWN.run2.F", "SWN.run3.F", "SWN.run4.F"],
  "q": ["SWN.run1.FQ-L|m", "SWN.run2.FQ-L|m", "SWN.run3.FQ-L|m", "SWN.run4.FQ-L|m"],
  "side": ["SWN.run1.S-L|m", "SWN.run2.S-L|m", "SWN.run3.S-L|m", "SWN.run4.S-L|m"],
  "bq": ["SWN.run1.BQ-L|m", "SWN.run2.BQ-L|m", "SWN.run3.BQ-L|m", "SWN.run4.BQ-L|m"],
  "back": ["SWN.run1.B", "SWN.run2.B", "SWN.run3.B", "SWN.run4.B"]
 },
 "aim": {
  "front": ["SWN.shoot1.F"],
  "q": ["SWN.shoot1.FQ-L|m"],
  "side": ["SWN.shoot1.S-L|m"]
 },
 "fire (NEW)": {
  "front": ["SWN.shoot1.F", "SWN.shoot2.F"],
  "q": ["SWN.shoot1.FQ-L|m", "SWN.shoot2.FQ-L|m"],
  "side": ["SWN.shoot1.S-L|m", "SWN.shoot2.S-L|m"]
 },
 "jump (NEW)": {
  "front": ["SWN.jump1.F", "SWN.jump2.F", "SWN.jump3.F", "SWN.jump4.F"],
  "q": ["SWN.jump1.FQ-L|m", "SWN.jump2.FQ-L|m", "SWN.jump3.FQ-L|m", "SWN.jump4.FQ-L|m"],
  "side": ["SWN.jump1.S-L|m", "SWN.jump2.S-L|m", "SWN.jump3.S-L|m", "SWN.jump4.S-L|m"],
  "bq": ["SWN.jump1.BQ-L|m", "SWN.jump2.BQ-L|m", "SWN.jump3.BQ-L|m", "SWN.jump4.BQ-L|m"],
  "back": ["SWN.jump1.B", "SWN.jump2.B", "SWN.jump3.B", "SWN.jump4.B"]
 },
 "dive (NEW)": {
  "front": ["SWN.dive1.F", "SWN.dive2.F", "SWN.dive3.F", "SWN.dive4.F"],
  "q": ["SWN.dive1.FQ-L|m", "SWN.dive2.FQ-L|m", "SWN.dive3.FQ-L|m", "SWN.dive4.FQ-L|m"],
  "side": ["SWN.dive1.S-L|m", "SWN.dive2.S-L|m", "SWN.dive3.S-L|m", "SWN.dive4.S-L|m"],
  "bq": ["SWN.dive1.BQ-L|m", "SWN.dive2.BQ-L|m", "SWN.dive3.BQ-L|m", "SWN.dive4.BQ-L|m"],
  "back": ["SWN.dive1.B", "SWN.dive2.B", "SWN.dive3.B", "SWN.dive4.B"]
 },
 "crawl (NEW)": {
  "front": ["SWN.crawl1.F", "SWN.crawl2.F", "SWN.crawl3.F", "SWN.crawl4.F"],
  "q": ["SWN.crawl1.FQ-L|m", "SWN.crawl2.FQ-L|m", "SWN.crawl3.FQ-L|m", "SWN.crawl4.FQ-L|m"],
  "side": ["SWN.crawl1.S-L|m", "SWN.crawl2.S-L|m", "SWN.crawl3.S-L|m", "SWN.crawl4.S-L|m"],
  "bq": ["SWN.crawl1.BQ-L|m", "SWN.crawl2.BQ-L|m", "SWN.crawl3.BQ-L|m", "SWN.crawl4.BQ-L|m"],
  "back": ["SWN.crawl1.B", "SWN.crawl2.B", "SWN.crawl3.B", "SWN.crawl4.B"]
 },
 "flinch": {
  "front": ["SWN.hurt.1", "SWN.hurt.2", "SWN.hurt.3"]
 },
 "down (NEW)": {
  "front": ["SWN.death_head.1", "SWN.death_head.2", "SWN.death_head.3", "SWN.death_head.4", "SWN.death_head.5", "SWN.death_head.6", "SWN.death_head.7", "SWN.death_head.8"]
 },
 "thrown (NEW)": {
  "front": ["SWN.death_blast.1", "SWN.death_blast.2", "SWN.death_blast.3", "SWN.death_blast.4", "SWN.death_blast.5", "SWN.death_blast.6", "SWN.death_blast.7", "SWN.death_blast.8"]
 }
}
```

**ARM (armoured bruiser)**

```json
{
 "stand": {
  "front": ["ARM.stand.F"],
  "q": ["ARM.stand.FQ-L|m"],
  "side": ["ARM.stand.S-L|m"],
  "bq": ["ARM.stand.BQ-L|m"],
  "back": ["ARM.stand.B"]
 },
 "walk": {
  "front": ["ARM.walk1.F", "ARM.walk2.F", "ARM.walk3.F", "ARM.walk4.F", "ARM.walk5.F", "ARM.walk6.F"],
  "q": ["ARM.walk1.FQ-L|m", "ARM.walk2.FQ-L|m", "ARM.walk3.FQ-L|m", "ARM.walk4.FQ-L|m", "ARM.walk5.FQ-L|m", "ARM.walk6.FQ-L|m"],
  "side": ["ARM.walk1.S-L|m", "ARM.walk2.S-L|m", "ARM.walk3.S-L|m", "ARM.walk4.S-L|m", "ARM.walk5.S-L|m", "ARM.walk6.S-L|m"],
  "bq": ["ARM.walk1.BQ-L|m", "ARM.walk2.BQ-L|m", "ARM.walk3.BQ-L|m", "ARM.walk4.BQ-L|m", "ARM.walk5.BQ-L|m", "ARM.walk6.BQ-L|m"],
  "back": ["ARM.walk1.B", "ARM.walk2.B", "ARM.walk3.B", "ARM.walk4.B", "ARM.walk5.B", "ARM.walk6.B"]
 },
 "run": {
  "front": ["ARM.run1.F", "ARM.run2.F", "ARM.run3.F", "ARM.run4.F"],
  "q": ["ARM.run1.FQ-L|m", "ARM.run2.FQ-L|m", "ARM.run3.FQ-L|m", "ARM.run4.FQ-L|m"],
  "side": ["ARM.run1.S-L|m", "ARM.run2.S-L|m", "ARM.run3.S-L|m", "ARM.run4.S-L|m"],
  "bq": ["ARM.run1.BQ-L|m", "ARM.run2.BQ-L|m", "ARM.run3.BQ-L|m", "ARM.run4.BQ-L|m"],
  "back": ["ARM.run1.B", "ARM.run2.B", "ARM.run3.B", "ARM.run4.B"]
 },
 "guard": {
  "front": ["ARM.punch_a.1"]
 },
 "punch (NEW)": {
  "front": ["ARM.punch_a.1", "ARM.punch_a.2", "ARM.punch_a.3", "ARM.punch_a.4", "ARM.punch_a.5"]
 },
 "punch other arm (NEW)": {
  "front": ["ARM.punch_b.1", "ARM.punch_b.2", "ARM.punch_b.3", "ARM.punch_b.4"]
 },
 "throw or shove (NEW)": {
  "front": ["ARM.arm_low.F", "ARM.arm_up.F", "ARM.arm_out.F"],
  "q": ["ARM.arm_low.FQ-L|m", "ARM.arm_up.FQ-L|m", "ARM.arm_out.FQ-L|m"],
  "side": ["ARM.arm_low.S-L|m", "ARM.arm_up.S-L|m", "ARM.arm_out.S-L|m"],
  "bq": ["ARM.arm_low.BQ-L|m", "ARM.arm_up.BQ-L|m", "ARM.arm_out.BQ-L|m"],
  "back": ["ARM.arm_low.B", "ARM.arm_up.B", "ARM.arm_out.B"]
 },
 "flinch": {
  "front": ["ARM.stagger.1", "ARM.stagger.2", "ARM.stagger.3"]
 },
 "down (NEW)": {
  "front": ["ARM.death.1", "ARM.death.2", "ARM.death.3", "ARM.death.4", "ARM.death.5", "ARM.death.6", "ARM.death.7", "ARM.death.8", "ARM.death.9", "ARM.death.10"]
 }
}
```

**MSK (masked knife man)**

```json
{
 "stand": {
  "front": ["MSK.stand.F"],
  "q": ["MSK.stand.FQ-R"],
  "side": ["MSK.stand.S-R"],
  "bq": ["MSK.stand.BQ-R"],
  "back": ["MSK.stand.B"]
 },
 "run": {
  "front": ["MSK.run1.F", "MSK.run2.F", "MSK.run3.F", "MSK.run4.F", "MSK.run5.F", "MSK.run6.F"],
  "q": ["MSK.run1.FQ-R", "MSK.run2.FQ-R", "MSK.run3.FQ-R", "MSK.run4.FQ-R", "MSK.run5.FQ-R", "MSK.run6.FQ-R"],
  "side": ["MSK.run1.S-R", "MSK.run2.S-R", "MSK.run3.S-R", "MSK.run4.S-R", "MSK.run5.S-R", "MSK.run6.S-R"],
  "bq": ["MSK.run1.BQ-R", "MSK.run2.BQ-R", "MSK.run3.BQ-R", "MSK.run4.BQ-R", "MSK.run5.BQ-R", "MSK.run6.BQ-R"],
  "back": ["MSK.run1.B", "MSK.run2.B", "MSK.run3.B", "MSK.run4.B", "MSK.run5.B", "MSK.run6.B"]
 },
 "stab (NEW)": {
  "front": ["MSK.stab1.F", "MSK.stab2.F", "MSK.stab3.F", "MSK.stab4.F", "MSK.stab5.F", "MSK.stab6.F"],
  "q": ["MSK.stab1.FQ-R", "MSK.stab2.FQ-R", "MSK.stab3.FQ-R", "MSK.stab4.FQ-R", "MSK.stab5.FQ-R", "MSK.stab6.FQ-R"],
  "side": ["MSK.stab1.S-R", "MSK.stab2.S-R", "MSK.stab3.S-R", "MSK.stab4.S-R", "MSK.stab5.S-R", "MSK.stab6.S-R"],
  "bq": ["MSK.stab1.BQ-R", "MSK.stab2.BQ-R", "MSK.stab3.BQ-R", "MSK.stab4.BQ-R", "MSK.stab5.BQ-R", "MSK.stab6.BQ-R"],
  "back": ["MSK.stab1.B", "MSK.stab2.B", "MSK.stab3.B", "MSK.stab4.B", "MSK.stab5.B", "MSK.stab6.B"]
 },
 "flinch": {
  "front": ["MSK.hurt.F"],
  "q": ["MSK.hurt.FQ-R"],
  "side": ["MSK.hurt.S-R"],
  "bq": ["MSK.hurt.BQ-R"],
  "back": ["MSK.hurt.B"]
 },
 "down (NEW)": {
  "front": ["MSK.death.1", "MSK.death.2", "MSK.death.3", "MSK.death.4", "MSK.death.5"]
 },
 "rise (NEW)": {
  "front": ["MSK.rise.1", "MSK.rise.2", "MSK.rise.3", "MSK.rise.4", "MSK.rise.5", "MSK.rise.6"]
 }
}
```

**BRW (brawler)**

```json
{
 "stand": {
  "front": ["BRW.idle.F"],
  "q": ["BRW.idle.FQ-R"],
  "side": ["BRW.idle.S-R"],
  "bq": ["BRW.idle.BQ-R"],
  "back": ["BRW.idle.B"]
 },
 "run": {
  "front": ["BRW.run1.F", "BRW.run2.F", "BRW.run3.F", "BRW.run4.F", "BRW.run5.F", "BRW.run6.F"],
  "q": ["BRW.run1.FQ-R", "BRW.run2.FQ-R", "BRW.run3.FQ-R", "BRW.run4.FQ-R", "BRW.run5.FQ-R", "BRW.run6.FQ-R"],
  "side": ["BRW.run1.S-R", "BRW.run2.S-R", "BRW.run3.S-R", "BRW.run4.S-R", "BRW.run5.S-R", "BRW.run6.S-R"],
  "bq": ["BRW.run1.BQ-R", "BRW.run2.BQ-R", "BRW.run3.BQ-R", "BRW.run4.BQ-R", "BRW.run5.BQ-R", "BRW.run6.BQ-R"],
  "back": ["BRW.run1.B", "BRW.run2.B", "BRW.run3.B", "BRW.run4.B", "BRW.run5.B", "BRW.run6.B"]
 },
 "guard": {
  "front": ["BRW.ready.F"],
  "q": ["BRW.ready.FQ-R"],
  "side": ["BRW.ready.S-R"],
  "bq": ["BRW.ready.BQ-R"],
  "back": ["BRW.ready.B"]
 },
 "swipe (NEW)": {
  "front": ["BRW.swipe.F"],
  "q": ["BRW.swipe.FQ-R"],
  "side": ["BRW.swipe.S-R"],
  "bq": ["BRW.swipe.BQ-R"],
  "back": ["BRW.swipe.B"]
 },
 "lunge (NEW)": {
  "front": ["BRW.lunge.F"],
  "q": ["BRW.lunge.FQ-R"],
  "side": ["BRW.lunge.S-R"],
  "bq": ["BRW.lunge.BQ-R"],
  "back": ["BRW.lunge.B"]
 },
 "flinch": {
  "front": ["BRW.pain.1", "BRW.pain.2", "BRW.pain.3"]
 },
 "down (NEW)": {
  "front": ["BRW.death.1", "BRW.death.2", "BRW.death.3", "BRW.death.4", "BRW.death.5", "BRW.death.6"]
 },
 "rise (NEW)": {
  "front": ["BRW.rise.1", "BRW.rise.2", "BRW.rise.3", "BRW.rise.4", "BRW.rise.5", "BRW.rise.6", "BRW.rise.7", "BRW.rise.8"]
 }
}
```

## 7. Rules for 3D models

The model loader (`source/asset-contract.js`) accepts **binary glTF version 2 (`.glb`) only**, 20 bytes to 200 MiB, with: one embedded binary buffer, triangle meshes, no animations, no skins, no morph targets, no Draco compression, no external files. Anything else is refused with a message. Models are placed as props through the editor's Library tab. **Unverified:** whether a placed model blocks shots and sight. Today's cover test (`rwSightBlock` in `ui-route.js`) is known to use walls, closed doors, windows, crates, columns, counters and the balcony rail from the scene's own geometry.

## 8. Code map of `source/ui-combat.js`

This table describes the code as it stands. Room Creator's source is edited by ChatGPT/Nova only, under the owner's direction.

| function | job | where a new feature would attach (a description for the Room Creator owner, not an instruction) |
|---|---|---|
| `cbStart(net)` / `cbStop` / `cbRestart` | set up and tear down a fight from `routeNet.combat` | loading new data blocks (player actions, the woman, the squad) |
| `cbStep(dt)` | per-frame combat update | timers for attacks, the slime meter, hold and pod progress |
| `cbNpcStep(n,dt)` | one bot's brain each frame | the shared decision process: dispositions, protecting the woman, switching to rescue |
| `cbShoot()` | the player's shot: makes an attempt record, finds the card under the crosshair, checks cover, calls `cbApplyHit` | **the template for every new player action** (punch, kick, grab, throw, slime) |
| `cbApplyHit(n,part,z,cause)` | **the one place a hit takes effect**: hp, flinch, score, records | stun, knock-back and slimed states; stray hits on the woman |
| `cbDown(n,causeId)` | puts a bot down | play a death set instead of tipping the card |
| `cbBotFire(n)` | a bot's shot at the player | hold fire when the woman is in the line |
| `cbWake(n,why,info)` | a bot notices something: sight gives a position, sound gives a direction | the woman reacting to danger |
| `cbBotSees`, `cbBotSeesPoints`, `cbPlayerSeesPoints` | who can see which body points | reuse for "is the woman in my line of fire" |
| `cbPickCover`, `cbFreeCoverNodes`, `cbPathClear`, `cbGoTo` | bots choosing and reaching spots (straight lines with via points, no path-finding, no floor changes) | a guard who advances needs real path following |
| `cbStartFlee`, `cbPickExit`, `cbGone` | running for an exit | the woman fleeing |
| `cbSetIntent(id,intent)` | change a bot's intent without changing who it is | scripted reactions |
| `cbPose(n,ch)` | **state → which pose to draw** | new poses: fire, down, duck, rise, held, slimed, thrown |
| `cbMeshPost` | tips a downed card over | remove when real death frames are used |
| `cbRecord(what,data)` | writes one line to `CB.events` (id, time, what, actor, target, cause) | **a sound-and-effects listener reads this list** |
| `cbOverlay`, `cbDrawWeapon`, `cbDrawHud`, `cbDrawResults` | 2D drawing over the 3D view: tracers, flashes, the hand strip, HUD | effect sprites, new hand strips, slime meter, pod progress bar, screen overlays |
| `cbKey(e)` | combat keys (X reload, Enter restart) | attack keys, jump |

Hooks called from `ui-route.js`: `cbPlayerPre`, `cbNpcStep`, `cbStep`, `cbShoot`, `cbPose`, `cbMeshPost`, `cbStart`, `cbStop`, `cbKey`, `cbOverlay`.

**Current controls:** mouse look · click or Space fire · X reload · W forward along the look direction · A/D sidestep · S back · C crouch · E doors · Q/R quarter turns · Tab debug · Enter restart · Esc leave.

## 9. Not in the builder today

Sound of any kind · jumping · punches and kicks · more than one attack · characters who are not enemies · damage to anyone not aimed at · effect sprites beyond tracer, spark and muzzle flash · death animations · breakable objects · bots that follow the path network or change floors.

## 10. Street scenes and moving cars

The same archive holds outdoor block scenes with working traffic, parked cars and a drop to a riverwalk. None of them has combat switched on yet. They are mapped in `17_STREET_AND_VEHICLES.md`.
