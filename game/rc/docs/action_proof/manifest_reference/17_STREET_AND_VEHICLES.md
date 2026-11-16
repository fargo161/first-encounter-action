# 17 · Street scenes and moving cars (already inside the builder)

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

The design document asks for a street-style playground with **at least one moving car**, a **ledge or roof** to throw people off, and one more hazard. The Room Creator archive already contains outdoor street scenes with working traffic. This file maps them. Everything here was **read from the files, not from running them**. Nothing in this file is a decision; labels are explained in `00_START_HERE.md` §3.

**Who may change any of this:** Room Creator is edited by ChatGPT/Nova only. This file describes; it does not instruct anyone to edit.

---

## 1. The short version

| question | answer |
|---|---|
| Is there a street with moving cars? | **Yes.** Eleven block scenes; every one has two traffic lanes with cars driving through. |
| Is there a drop to throw someone off? | **Yes, as geometry.** The street crosses a river on a bridge: 3.4 m down to a riverside walkway, 4.2 m down to the water, behind a 1.05 m guard wall. |
| Is there a storefront? | **Yes.** A store with a front door and a shop window facing the pavement. |
| Do cars notice the player? | **Yes.** They treat the player as a pedestrian, brake, and log a contact event with the car's speed if they touch. |
| Does a car hurt anyone? | **No.** The message on contact reads "no injury model is installed in this prototype". |
| Can anyone jump, stand on a car, or be thrown? | **No.** There is no jump, no riding, no knock-back and no falling in any source file. |
| Is combat switched on in a street scene? | **No.** Only `examples/Combat_Test_Room.room.json` has a combat block. |

---

## 2. Which scenes exist

All are in `rc/examples/`. Metres; **north is −y**; three levels.

| scene file | what it is | size | play page |
|---|---|---|---|
| `Block_triple_shop.room.json` | one block: store + park + bus stop | 26 × 60 m | none of its own: open it in the editor `Room_Creator.html` (not verified by running) |
| `Block_store_park.room.json`, `Block_bar_bus_stop.room.json`, `Block_alley_office.room.json`, `Block_subway_civic.room.json`, `Block_carpark_restaurant.room.json` | the other single blocks (2 to 4 rooms, 2 stairs, 12 to 14 path points, 6 walking lanes, 2 traffic lanes each) | 26 × 60 m | none of their own |
| `Block_Composer_Demo.room.json` | five blocks in a row: bar + bus stop, store + park, alley + office (tunnel), subway stairs + civic lobby (tunnel), car park + restaurant. 14 rooms, 10 stairs, 39 props, 70 path points, 71 links, 24 spots | 170 × 60 m | `Play_Block_Composer_Demo.html` |
| `Block_Composer_Vehicle_World.room.json` | the same five blocks driven by the newer vehicle system (§6) | 170 × 60 m | `Play_Vehicle_World.html` (matched by name) |
| `Block_Composer_Traffic_Control.room.json` | the same with traffic signals | 170 × 60 m | `Play_Traffic_Control.html` (matched by name) |

`PROPOSED` **Smallest useful base: `Block_triple_shop.room.json`.** One screenful of street that already holds a storefront, two lanes of traffic, three parked cars, a bus shelter, park furniture and the bridge drop. The choice of scene is `OPEN` and belongs to the owner and to whoever builds in Room Creator.

---

## 3. `Block_triple_shop` in detail

Name inside the file: "Block · Store + Park + Bus stop". Extent x −13 to 13, y 0 to 60. Wall height 3 m; floor-to-floor 3.4 m.

### Levels

| level | name | height |
|---|---|---|
| 2 | Street Level | 0 m |
| 1 | Lower Pedestrian (riverside walkways) | −3.4 m |
| 0 | River Water | −4.2 m |

### Ground at street level, south to north across the road

Every band runs the full width (x −13 to 13).

| y from | y to | band |
|---|---|---|
| 12.5 | 18 | **near pavement** (the store's front wall is its north edge at y = 12.5) |
| 18 | 20 | near parking lane |
| 20 | 22.5 | **eastbound driving lane** (cars along y = 21.25) |
| 22.5 | 25 | **westbound driving lane** (cars along y = 23.75) |
| 25 | 27 | far parking lane (x 5 to 12 is kept clear for the bus stop) |
| 27 | 36 | **far pavement**; park apron at x −3.2 to 3.2, y 30.6 to 35.6 |

### The river and the drop

The river runs **across** the block under the street, x −2.8 to 2.8, for the whole 60 m. Riverside walkways run beside it on the lower level: x −5.2 to −3.3 and x 3.3 to 5.2. The street and both pavements pass over on a bridge between y 12.5 and y 36.

| edge | where | guard | below |
|---|---|---|---|
| near bridge edge | y = 12.5, x −3.15 to 3.15 | wall 1.05 m high | river water, 4.2 m down |
| far bridge edge | y = 36, x −3.15 to 3.15 | wall 1.05 m high | river water, 4.2 m down |
| walkway edges (lower level) | x = ±3.15, along the river | wall 1.05 m high | water, 0.8 m lower |

Two stairs, 19 steps each with guard rails, join the levels: near stair at x 5.2 to 6.4, y 8.1 to 12.5; far stair at x −6.4 to −5.2, y 31.8 to 36.2.

**What this gives the game:** a person tipped over the near or far bridge wall falls 4.2 m into water. **What is missing:** nothing in the code can move a body over a wall or make it fall. The player and every character stay on the path network.

### The store

Room at x −12.05 to −5.35, y 3.1 to 12.5 (6.7 × 9.4 m). Its street wall carries a **front door** (1.35 m wide, 2.3 m high) and a **shop window** (1.35 × 1.25 m). Inside: shelf, rack, register, security monitor. The path network reaches the doorway; **no path goes through the window**.

### Props outside

| prop | x | y |
|---|---|---|
| parked car (near lane) | −8.5 | 19 |
| parked car (near lane) | 8.5 | 19 |
| parked car (far lane) | 0 | 26 |
| park table, chair, bin | 0 / −1 / 2.4 | 33.2 / 33.2 / 34.3 |
| bus stop seat | 8.7 | 33.6 |
| bus shelter (three walls 2.3 m high) | 5.9 to 11.5 | 31.5 to 34.5 |
| bus stop sign post | 5.3 | 31.7 |

The parked cars use the builder's own model `car_kent_ford_crown_victoria` (a sedan, 4.61 × 1.67 m by the builder's size table).

### Path network (where the player can go today)

14 path points, 13 links, 4 named spots.

| path point | x | y | level |
|---|---|---|---|
| `v_main_start` street west end | −12.5 | 15.5 | 2 |
| `v_mid_block_01` middle of the near pavement | 0 | 15.5 | 2 |
| `v_main_end` street east end | 12.5 | 15.5 | 2 |
| `v_door_node_block_01__store_door` store doorway | −8.7 | 12.7 | 2 |
| `v_block_01__river_near_top` near stair, top | 5.8 | 12.95 | 2 |
| `v_block_01__river_far_top` far stair, top | −5.8 | 31.35 | 2 |
| `v_block_01__river_near_bottom`, `v_block_01__river_near_foot` near stair, bottom | 5.8 / 4.15 | 7.65 | 1 |
| `v_block_01__river_far_bottom`, `v_block_01__river_far_foot` far stair, bottom | −5.8 / −4.15 | 36.65 | 1 |
| `v_block_01__river_e_n`, `v_block_01__river_e_s` east walkway ends | 4.15 | 0.7 / 59.3 | 1 |
| `v_block_01__river_w_n`, `v_block_01__river_w_s` west walkway ends | −4.15 | 0.7 / 59.3 | 1 |

| link | joins | side-step width (m) |
|---|---|---|
| `e_main_0`, `e_main_1` main pavement | west end ↔ middle ↔ east end | 0.9 |
| `e_door_node_block_01__store_door` | middle ↔ store doorway | 0.45 |
| `e_street_stair_v_block_01__river_near_top` | middle ↔ near stair top | 0.55 |
| `e_street_stair_v_block_01__river_far_top` | middle ↔ far stair top (**this link crosses both driving lanes**) | 0.55 |
| `e_block_01__river_near_stairs`, `e_block_01__river_far_stairs` | stairs down | 0.48 |
| `e_block_01__river_e`, `e_block_01__river_w` | the two riverside walkways, end to end | 0.7 |
| four short joining links at the stair feet | | 0.5 to 0.55 |

Named spots: store doorway (−8.7, 12.7); park hangout (0, 31.6); bus stop (8.7, 31.8); riverwalk overlook (4.15, 39, lower level). Their types are `loiter`, `queue`, `listen`, `view`, `spy`. **None is marked as cover**, so the combat code would find no cover here as the scene stands.

**For rail-to-rail jumping this network is thin:** one pavement line, one link across the road, two walkways below. A playground needs more lines (far pavement, car roofs, the bridge wall, the shelter roof) before chaining jumps means anything. That is new authoring in Room Creator.

---

## 4. Traffic as it runs today (older lane system)

Files: `rc/source/route-traffic.js`, `rc/source/ui-route.js`. Settings live in the scene under `routeNet.traffic` and `routeNet.vehicleLoop`.

| setting | value |
|---|---|
| lanes | `traffic_e` along y = 21.25 heading east; `traffic_w` along y = 23.75 heading west |
| cruise speed | 8.5 m/s (each car picks between 6.7 and 10.1) |
| cars alive at once | up to 12 |
| new car | every 3.3 to 4.7 s per lane, first after 2.8 s |
| step | fixed, 1/240 s |
| lane changes | none |
| random numbers | seeded (scene seed 1977), so a run repeats |

A car takes about **3 seconds** to cross the 26 m block.

### How drivers react

| driver style | reaction time | normal braking | emergency braking |
|---|---|---|---|
| Cautious | 0.56 s | 5.87 m/s² | 10.7 m/s² |
| Steady | 0.43 s | 6.68 m/s² | 11.9 m/s² |
| Brisk | 0.32 s | 7.49 m/s² | 13.2 m/s² |

The rule text in the scene says: cars watch the nearest physical hazard in their own lane, with delayed samples; braking is finite, so "real bumper/person contact can still occur".

`PROPOSED` **What that means for "throw him in front of a car".** From 8.5 m/s a Steady driver needs roughly 3.7 m of reaction distance plus 3.0 m of emergency braking: about **7 m** to stop. A body that arrives in the lane more than about 7 m ahead of a car makes the car stop; closer than that, the car hits it. So the timing window for a throw is real and comes from numbers already in the code. (Worked from the table above; not measured in a run.)

### The player and cars today

- The lane code looks for the player as a pedestrian (`rwVehiclePlayerNeighbor`) and cars brake for him.
- On contact it adds one to `RW.stats.playerVehicleContacts`, records `{time, type:'vehicle_pedestrian_contact', car, target, speed}` in `RW.vehicleEvents`, shows "made vehicle contact with you — no injury model is installed in this prototype", and the car stops against the person.
- The scene lists the events it can report: `vehicle_spawn`, `vehicle_exit`, `vehicle_braking`, `vehicle_contact`, `vehicle_pedestrian_contact`, and notes: "Room Creator reports spatial traffic state only; Encounter remains authority for persistent world consequences."

---

## 5. Vehicle sizes (builder's own table, `rc/source/vehicle-classes.js`)

| class | length × width (m) | model in the builder's library |
|---|---|---|
| sedan | 4.61 × 1.67 | `car_kent_ford_crown_victoria` |
| coupe | 3.75 × 1.63 | `car_kent_duster` |
| truck / SUV | 4.80 × 1.90 | none named |
| pickup | 5.70 × 2.00 | none named |
| box truck | 7.50 × 2.50 | none named |
| bus | 12.0 × 2.55 | none named |

Roof heights are not in this table. A sedan roof is about 1.4 to 1.5 m in life; the real figure has to be read from the model.

The older lane system uses one simple box for every car: 4.3 m long, 1.84 m wide, and it senses pedestrians within 1.18 m of the lane centre.

---

## 6. The newer vehicle system (Vehicle World)

File: `rc/source/vehicle-world.js`. Used by `Play_Vehicle_World.html`. Every vehicle, moving or parked, is one object with a stable ID, a class and a position on a road graph.

| what | detail |
|---|---|
| contact scale | three thresholds in the code: `severityContact` 1.5, `severityLight` 4, `severityModerate` 9 |
| per vehicle | `collision` (last contact time, contact count, last severity) and `damage: {level: 0}` (a placeholder: nothing raises it) |
| people | positions of people are passed in so vehicles can sense and touch them; contacts with people are logged with a severity |
| outside control | `world.setController(vehicleId, 'external')`, `world.setDriverIntent(vehicleId, {throttle, brake, reverse, steer, branch})`, `world.activateVehicle(...)` |
| standing rule | one physical authority for vehicles. The owner's rule on record: "Vehicle World supplies facts, Encounter interprets them." |

**Use for the playground:** a contact already arrives with a speed and a severity. An injury rule could read those. It should not be a second vehicle system.

---

## 7. What the design asks for, against what exists

| design item | label | exists today | missing |
|---|---|---|---|
| at least one moving car | `AGREED` | two lanes of traffic, seeded and repeatable | nothing |
| jump onto and off a car | `AGREED` | car positions and sizes | jumping; a car roof as a place to stand; being carried along; stepping off |
| mistimed jump hurts | `AGREED` | contact events with speed | an injury rule for the player |
| throw a guard into a car's path | `AGREED` (environment is the decisive weapon) | cars that cannot always stop (§4) | bodies that can be thrown; an injury rule for characters; `SWN.death_blast` is the only tumbling art (`18_MORE_ENEMIES.md`) |
| throw a guard off a ledge or roof | `AGREED` | bridge walls with a 4.2 m drop | falling; any way over a wall |
| third hazard | `OPEN` (storefront window and electrical fixture were floated) | a shop window and a door in the store front | see `21_MODULAR_DEGRADATION.md` for how a breakable window fits the approved state-swap rule |
| chaining jumps between rails | `AGREED` in spirit, mechanics `OPEN` | a thin path network (§3) | more lines, and the jump itself |
| four armed guards and the woman on this street | `AGREED` | walking lanes and three stand-in characters | a combat block for a street scene; cover spots; the new characters packed in the builder's picture format (`16_BUILDER.md` §6) |

All of the "missing" column is Room Creator work.

---

## 8. Things not checked

- None of these scenes was run. Frame rate on the owner's laptop is unknown.
- Whether a parked-car model blocks shots and sight the way crates and columns do.
- Whether moving cars block sight.
- Whether `Room_Creator.html` opens a single-block scene and walks it without extra steps.
- The unit of the three severity numbers.
