# Room Creator 0.16 / 0.16.1 — Vehicle World, road graph and traffic control

Format number stays **11**. Everything below is optional, lives inside `routeNet`, and is kept by the open
route-network rule (unknown keys survive). A file without these records opens and plays exactly as in 0.15.2: the older
traffic runtime is used unless `vehicleLoop.runtime` is `"world"`.

## `routeNet.vehicleGraph` (schema `rc-vehicle-graph@0.1`, written by Block Composer)

The road as vehicles see it. Pure data beside the older `traffic[]` lines (which stay unchanged). World coordinates,
metres, x east, y south, heading 0 = north.

```json
"vehicleGraph":{"schema":"rc-vehicle-graph@0.1","generatedBy":"block-composer","trafficSide":"left",
 "edges":[{"id":"veh_e_block_01","kind":"road_lane","laneFamily":"traffic_e","direction":"east","story":2,"blockId":"block_01",
   "centerPath":[{"x":-84.8,"y":21.25},{"x":-59,"y":21.25}],"corridor":{"halfWidth":1.25},
   "speedPolicy":{"cruise":8.5,"min":6.7,"max":10.1},"fromNode":"vn_e_00","toNode":"vn_e_01","tags":["main_street"]}],
 "connectors":[{"id":"vc_intersection_01_e_straight","kind":"intersection_straight","intersectionId":"intersection_01",
   "laneFamily":"traffic_e","direction":"east","story":2,"fromEdge":"veh_e_block_01","toEdge":"veh_e_block_02",
   "fromNode":"vn_e_01","toNode":"vn_e_02","path":[{"x":-59,"y":21.25},{"x":-49,"y":21.25}],"corridor":{"halfWidth":1.25},
   "conflictZoneIds":["zone_intersection_01_crosswalk"],"priority":"through","signalGroup":null,"tags":["main_street","intersection"]}],
 "nodes":[{"id":"vn_e_00","kind":"area_entry","x":-84.8,"y":21.25,"story":2}],
 "portals":[{"id":"vportal_west_e","node":"vn_e_00","role":"entry","kind":"street_end","laneFamily":"traffic_e"}],
 "parkingAreas":[{"id":"parea_block_01_far","blockId":"block_01","side":"far","accessEdge":"veh_w_block_01","spaceIds":["parking_block_01_far_1","parking_block_01_far_2"]}],
 "spaceAccess":[{"spaceId":"parking_block_01_far_1","areaId":"parea_block_01_far","accessEdge":"veh_w_block_01","approachS":18.4,"departS":24.6}],
 "pulloverCandidates":[]}
```

- One **edge** per block per driving direction (`veh_e_*` eastbound, `veh_w_*` westbound); one straight **connector** per
  intersection per direction. Turn connectors and cross streets do not exist yet.
- `corridor.halfWidth` is half the drive lane (2.5 m lane → 1.25). A vehicle class fits when its width ≤ 2 × halfWidth.
- `trafficSide` is computed from the lane positions when both driving directions exist (`left` on today's street), else
  `left`. It is information only: no runtime code reads it yet.
- `spaceAccess.approachS` / `departS` = distance along `accessEdge` where a pull-in starts / a pull-out ends (from the
  space's authored `pullInPath` / `pullOutPath`).
- `signalGroup` on a connector is reserved; signal binding lives in `vehicleTraffic.signals` (below).
- Scenes without a `vehicleGraph` (for example `Street_Modules_Demo`) get a graph derived from `traffic[]` at run time;
  nothing is written back.

## `routeNet.vehicleLoop` additions

```json
"vehicleLoop":{ …existing keys…, "runtime":"world",
  "classes":{"sedan":{"geometry":{"length":4.7}}},
  "config":{"maxTracked":12,"exitViewDistance":25,"entryViewDistance":25,"handling":"legacy"}}
```

- **`runtime`**: `"world"` turns on the Vehicle World for this scene. Absent (or anything else) = the older runtime.
- **`classes`**: optional per-class overrides, deep-merged over the built-in classes (`source/vehicle-classes.js`,
  schema `rc-vehicle-classes@0.1`: sedan, truck_suv, coupe, pickup, bus, commercial_box_truck, tractor_truck,
  tractor_trailer, police_official_van), so sizes go under `geometry`. Capacity, compartments, slots, length, width,
  turn radius, handling, route restrictions, and optional vehicle-owned `accessPoints[]` live **only** here. Sizes are provisional until the vehicle art arrives.
- **`config`** world keys (unknown or wrongly typed keys are ignored): `maxTracked` 12, `exitViewDistance` 25,
  `entryViewDistance` 25 (m; a street end closer than this and in line of sight counts as "in view"), `handling`
  `"legacy"|"scaled"`, `laneDrift` 0.1 m (each car appears on the lane centre and eases to its own fixed sideways offset,
  at most this much and never past the corridor), `laneDriftSeconds` 1.5 (time constant of that easing), `severityContact` 1.5 / `severityLight` 4 /
  `severityModerate` 9 (m/s closing speed), `stopLineBuffer` 0.5 m, `contactHoldSeconds` 0.30, `pedestrianRadius` 0.34,
  `boxClearSpeed` 1.5 m/s, `maxEvents` 2000, `maxLoggedEvents` 50000, `autoPopulate` true, `autoSpawn` true,
  `disableBraking` false (tests only). The older keys (`fixedStep`, `seedPerLane`, spawn intervals …) keep their meaning.

**Runtime state is never saved.** Vehicle positions, parking-space states (`OPEN`, `OCCUPIED`, …), signal phases, flow
timers and the live meter exist only while Route Walk runs. Parked props are adopted as `PARKED` vehicles at start
(sorted by space id); the saved `parking.spaces[]` and `props[]` are not written to.

## `routeNet.vehicleTraffic` (schema `rc-vehicle-traffic@0.1`, 0.16.1)

The authored traffic layer: catalogue, flows, meter and signals. Used only when `enabled === true` **and**
`vehicleLoop.runtime === "world"`. Then flows own automatic spawning (the generic spawner does not run in parallel) and
signals are active. `enabled:false` keeps the data but runs the generic spawner and no signals.

```json
"vehicleTraffic":{"schema":"rc-vehicle-traffic@0.1","enabled":true,
 "meter":{"preset":"normal","value":0.5},
 "units":[{"id":"unit_civilian_sedan","label":"Civilian Sedan","classId":"sedan","enabled":true,"role":"civilian_traffic",
   "classifications":["civilian","passenger"],"tags":["ordinary"],"capabilities":[],"abilities":[],"notes":""}],
 "flows":[{"id":"flow_main_eastbound","label":"Main Street Eastbound","enabled":true,
   "scope":{"entryPortals":["vportal_west_e"],"laneFamilies":["traffic_e"]},
   "mix":[{"unitId":"unit_civilian_sedan","weight":55},{"unitId":"unit_civilian_suv","weight":25}],
   "spawn":{"vehiclesPerMinute":8,"jitter":0.15,"initialCount":2,"maxActive":6,"blockedRetrySeconds":0.8,"seedOffset":0},
   "densityMultiplier":1}],
 "signals":[{"id":"signal_intersection_01","label":"Intersection 01","intersectionId":"intersection_01","enabled":true,
   "mode":"fixed","offsetSeconds":0,
   "groups":[{"id":"siggrp_intersection_01_main","label":"Main street through",
     "connectorIds":["vc_intersection_01_e_straight","vc_intersection_01_w_straight"]}],
   "phases":[{"id":"main_green","label":"Main green","durationSeconds":14,"states":{"siggrp_intersection_01_main":"GREEN"}},
             {"id":"main_yellow","label":"Main yellow","durationSeconds":3,"states":{"siggrp_intersection_01_main":"YELLOW"}},
             {"id":"main_red","label":"Main red","durationSeconds":8,"states":{"siggrp_intersection_01_main":"RED"}}]}]}
```

- **units** (the Traffic Catalogue): an operational kind of traffic that *references* a vehicle class by `classId`.
  A unit never stores capacity, length, width, turn radius, handling or footprint; those always come from the class.
  `classifications`, `tags`, `capabilities`, `abilities` are free lists of unique, non-empty strings (metadata only in
  v0.1). `id` stays the same when the label changes.
- **flows**: `scope.entryPortals` (empty = every entry portal) and `scope.laneFamilies` (empty = any). `mix` weights must
  be > 0 and reference units. Effective values at meter value `m`:
  `vehiclesPerMinute × m × densityMultiplier` (rate), `round(initialCount × m × densityMultiplier)` (cars placed at
  start), `ceil(maxActive × m × densityMultiplier)` (cap on this flow's live vehicles: DRIVING and STOPPED cars
  count, PARKED and OFFSTAGE do not). `jitter`, from 0 up to (not including) 1, spreads arrival times (values above
  0.95 act as 0.95); `blockedRetrySeconds` is the wait before retrying a blocked arrival; `seedOffset` changes this
  flow's random stream only.
- **meter**: `preset` one of `empty` (0), `light` (0.25), `normal` (0.5), `busy` (0.75), `heavy` (1) or `custom`;
  `value` 0–1. It scales flows only — never braking, reaction, speed, signals or parking.
- **signals**: `mode` `"fixed"` (the only mode in v0.1). `groups` bind connector ids. A connector should belong to one
  group of one signal: twice inside one signal is rejected; in two signals it is a warning, and the signal that comes
  first by id controls it. `phases` run in order and repeat; each gives every group a state `GREEN`, `YELLOW`, `RED` or
  `OFF` (a group missing from a phase is `OFF`). `offsetSeconds` shifts the cycle. Disabled signals read `OFF`.
- Validation (`core.js` `validateVehicleTraffic`) rejects broken structure (unknown preset, value outside 0–1,
  duplicate ids, a mix entry without a unit or with weight ≤ 0, unknown state, a connector bound twice within one
  signal, a phase naming an unknown group …).
  Broken *references* (unknown class, unit, portal, lane family, connector, intersection) are reported by the Traffic
  pane and by `RCVehicleTraffic.validate`, the editor refuses an edit that would add one, and a saved file that already
  has one still opens (the broken item is skipped at run time).

## Vehicle run export (`rc-vehicle-run@0.1`, not part of a project file)

`RCApp.ext().route.vehicleRun()` returns
`{schema, world:"rc-vehicle-world@0.1", seed, config, classes, graphHash, trafficHash, inputs, events, droppedEvents, final}`.
`inputs` is one ordered list of `{tick, kind:"bodies"|"hints"|"command", data}`; `RCVehicleWorld.replay(run,{routeNet,props})`
re-applies them at their ticks and reproduces `final` exactly. Commands: `spawn`, `promote`, `setCruise`,
`setController {vehicleId, mode:"ai"|"external"|"guided"}`, `driverIntent {vehicleId, intent}`, `activateVehicle {vehicleId}`,
`setBodySuppressed {bodyId, suppressed}`, `setTransitDriver {serviceId, actorId}`, `setTransitServiceActive {serviceId, active}`,
`setTransitDwellSeconds {serviceId, seconds}`, `boardTransitActor {actorId, vehicleId}`, `setInteriorActorInput {actorId, input}`,
`alightTransitActor {actorId}`, `spawnTrafficUnit {unitId, portalId?}`, `setTrafficMeter {value | preset}`, and
`setFlowEnabled {flowId, enabled}`.

### Vehicle World V2 external driver intent (runtime only; project format still 11)

`RCVehicleWorld.create()` also exposes three convenience calls that use the same logged command path:

- `world.setController(vehicleId, "ai" | "external")`
- `world.setDriverIntent(vehicleId, {throttle, brake, reverse, steer, branch})`
- `world.activateVehicle(vehicleId)`

Driver intent schema: `rc-vehicle-driver-intent@0.1`. `throttle` / `brake` are clamped to 0–1; `steer` to -1–1;
`branch` is `"left" | "straight" | "right" | null`; `reverse` is boolean. Intent never contains a world
position, route distance, velocity or heading. Vehicle World remains the only movement authority. `occupancy.driverActorId`
remains inert metadata; actor identity / seat assignment stay with Encounter.

External control uses the class driver acceleration/braking/jerk limits, authored road/corridor limits, Vehicle World
contacts and pedestrian impacts. Reverse keeps `pose.speed` non-negative and moves backward on the current route only;
it stops at route distance 0 and never invents a predecessor route. `steer` changes bounded lateral position inside the
authored corridor. `branch` is a separate next-junction preference; `null` uses the straightest available continuation.
A parked authored vehicle must be activated onto its authored adjacent road before it can move. Activation begins
`MANEUVER_OUT`, keeps the parking space `EXIT_IN_PROGRESS`, and only marks the space `OPEN` when the vehicle footprint
has merged inside the road corridor.

### Vehicle World V2.1 host/body and live-access additions (runtime only; project format still 11)

V2.1 adds two narrow ROOM-side bridge helpers without changing Route Walk movement code or vehicle ownership:

- `world.setBodySuppressed(bodyId, true | false)` (logged command `setBodySuppressed`) lets a host temporarily exclude a physical body id from Vehicle World's pedestrian/contact feed. While suppressed, repeated `setBodies()` calls containing that id are filtered. This is intended for cases such as a player whose on-foot Route Walk body is suspended while seated in a vehicle. `query("isBodySuppressed", bodyId)` reports the current flag. Unsuppressing makes the body eligible again; the next ordinary `setBodies()` publication restores it.
- `query("getVehicleAccessPoints", vehicleId, type?)` returns enabled Use Points from an adopted vehicle prop transformed by the vehicle's **current authoritative pose**. Each item contains `{vehicleId, propId, pointId, type, name, x, y, story, heading, zOffset}`. It is read-only and returns `[]` for vehicles with no adopted prop/use points. The optional `type` filters, e.g. `"driver"`.

Neither helper writes actor identity, seat occupancy, vehicle pose, route distance, speed or heading. `ui-route.js` and `ui-vehicle-world.js` are unchanged from V2; the body suppression is enforced inside Vehicle World so an Encounter host can keep its accepted movement runtime unchanged.

### Vehicle World V2.4 guided driving, capture bays and vehicle-owned access (runtime + optional authored metadata; project format still 11)

V2.4 adds a simpler guided-driving vocabulary beside the older V2 analog external controls. Existing `external` mode remains valid and unchanged for regression compatibility. New gameplay may instead select controller mode `"guided"` and send intent with:

```json
{"motion":"go","steer":0,"branch":null}
```

- `motion:"go"` is latched **GO / RESUME**. Vehicle World supplies longitudinal acceleration and cruise, and the existing delayed traffic perception / braking rules may stop the car for vehicles, pedestrians, signals or holds. When the obstruction clears, the same latched GO resumes automatically.
- `motion:"hold"` is latched **DRIVER HOLD / STOP** and uses the class driver braking limits. The car stays stopped until a later GO.
- In guided mode `throttle`, `brake` and manual `reverse` are ignored. Reverse manoeuvring is left to authored bay paths for now.
- `steer` remains bounded lateral intent and also supplies the side-of-road gesture used to capture an authored parking/loading bay. `branch` remains a separate next-junction preference.

A drive-in / drive-out bay reuses the existing parking and route languages. A capture-enabled `routeNet.parking.spaces[]` record may add:

```json
"access":{"enabled":true,"capture":true,"kind":"parking_bay",
  "walkLoopEdges":["me_bay_s","me_bay_e","me_bay_n","me_bay_w"],
  "allowedClasses":["sedan"]}
```

The same space supplies a physical parked pose through `vehicleBox` + `heading`, its existing `maneuver.pullInPath[]` / `pullOutPath[]`, and road attachment through `vehicleGraph.spaceAccess[]` (or `adjacentTrafficLane` for the legacy traffic fallback). `access.capture:true` is structurally validated: the parked box, both manoeuvre paths and required road reference must exist; listed `walkLoopEdges` must name actual pedestrian Movement Network edges.

**Capture / release rule:** while a guided car is DRIVING with GO latched, steering toward an OPEN compatible bay inside its authored capture window hands the car to ROOM. Vehicle World follows the authored pull-in polyline with finite acceleration/braking and bounded heading turn, settles exactly into the bay's parked pose, changes the space to `OCCUPIED`, changes the car to `PARKED`, and latches HOLD. GO from a legal PARKED bay follows the authored pull-out path, frees the bay only after the manoeuvre completes, then returns to ordinary automatic road motion. The transition is physical and replayable; no external system writes the car pose.

**Entry / exit rule:** `query("getVehicleAccessStatus", vehicleId)` is the ROOM authorization gate. It returns `allowed:true` only while the vehicle is `PARKED`, effectively stopped, and its parking space is physically `OCCUPIED` and access-enabled. A road car that merely stops is **not** an entry/exit location. `query("getParkingCaptureCandidates", vehicleId)` reports nearby compatible open bays for presentation / intent adapters; it does not move the car.

Access points belong to the vehicle, not the bay. Vehicle classes may define optional:

```json
"accessPoints":[{"id":"access_driver","seatId":"driver","type":"driver","x":1.3,"y":0,"z":0.4,"yaw":90}]
```

`seatId` must name a class slot. The current `sedan` / Crown Victoria class authors four access nodes (`driver`, `front_passenger`, `rear_left`, `rear_right`). In the Room Creator prop-point convention used by Vehicle World, **positive local `x` is vehicle-left** and negative local `x` is vehicle-right; the sedan node coordinates follow that convention. Other vehicle classes deliberately remain without assumed access geometry until their own layouts are authored. A placed vehicle prop may explicitly author the same nodes; prop nodes win by `seatId`, and missing class nodes are only used as a runtime fallback. The normal Vehicle inspector provides **Add missing class access nodes** so these points can be written explicitly to the prop without moving an existing matching point. `getVehicleAccessPoints()` transforms them from vehicle-local coordinates through the live authoritative car pose.

The bay itself never owns doors or seat identity. Its `walkLoopEdges` describe pedestrian topology around the stable parked pose; Encounter remains responsible for actor identity, seat occupancy, permission, ownership, keys, theft meaning and deciding which actor attempts to use which vehicle node.


### Vehicle World V2.4.1 access legibility and forgiving door zones (runtime-only extension; project format still 11)

V2.4.1 does not change parking, seat authority, or the four sedan door anchors. It makes those existing physical facts usable by a human instead of requiring a host to guess presentation or an actor to hit an invisible coordinate.

Sedan access points may additionally carry presentation-neutral physical metadata:

```json
{"seatId":"driver","side":"left","end":"front","cueLabel":"DRIVER",
 "interactionRadius":1.4,"highlightRadius":3.2,"marker":"door"}
```

- `interactionRadius` is a ROOM-owned physical interaction zone around the live vehicle-owned node. It is deliberately forgiving; callers should not substitute their own exact-point tolerance.
- `highlightRadius` is advance-notice distance for presentation only. It never grants access.
- `side`, `end`, `cueLabel`, and `marker` are stable semantic cues for rendering/UX. They do not carry actor permission or seat occupancy.
- Explicit prop access points still win for coordinates. When a prop point names a known seat, missing legibility metadata is inherited from the matching class point, so explicitly authored Crown Vic doors do not lose the class's access-zone definition.

New read-only queries:

- `query("getVehicleAccessCandidates", vehicleId, {x,y,story})` returns the live door nodes sorted nearest-first with `distance`, `interactionRadius`, `highlightRadius`, `nearest`, `highlighted`, `inRange`, ROOM access `allowed`, and final `usable = allowed && inRange`. This is the canonical answer to “which door is the actor close enough to use?”
- `query("getVehicleInteractionCues", vehicleId, actorPoint?)` returns schema `rc-vehicle-interaction-cues@0.1`: authoritative vehicle body dimensions/heading, forward/right vectors, an explicit FRONT chevron point beyond the nose, an explicit REAR bar point beyond the tail, all live access nodes, optional actor-relative candidates, and the current access-status gate.

The current sedan/Crown Victoria uses a **1.4 m** interaction radius and **3.2 m** highlight radius at each of its four doors. On `Vehicle_V2_4_Bay_Access_Test.room.json`, the ordinary walk-ring centreline is already inside the correct door zone; no precision strafe toward an invisible point is required. Overlapping zones resolve to the nearest door deterministically.

ROOM's first-person Vehicle World preview now renders FRONT/REAR orientation badges and all four door badges for a nearby legal parked vehicle. The nearest/in-range door is emphasized and the HUD reports its semantic name and `IN ACCESS ZONE`. These are proof/debug presentation of ROOM facts; downstream presentation may render them differently but should consume the same queries rather than inventing door geometry.

The bay still owns only capture/release geometry and whether the parked location is legal. The vehicle still owns the door/access nodes. Encounter still owns actor identity, seat occupancy, and permission.


### Vehicle World V2.5.1 two-block lanes, ordered transit routes and published seat poses (runtime + optional authored sidecars; project format still 11)

V2.5.1 extends the existing Vehicle World rather than adding a second transport simulation. A vehicle still occupies one
authoritative graph route and ROOM still owns pose, speed, contact, bay capture, replay and physical access. The new
pieces are: explicit parallel lane metadata on graph elements, branch-to-lane requirements, a public-transit service
sidecar, and a small vehicle-local moving interior.

#### Parallel lanes on `vehicleGraph` elements

An edge or connector may add:

```json
"lanes": {
  "count": 2,
  "width": 3.3,
  "centers": [-1.65, 1.65],
  "labels": ["ROUTE / THROUGH LANE", "CURB / BAY LANE"],
  "defaultLane": 1,
  "parkingLane": 1,
  "changeAllowed": true,
  "branchLanes": {"straight": 0, "right": 1}
}
```

`centers` are lateral offsets in the graph element's authored corridor. They are sorted from negative to positive
lateral, and every centre must remain inside `corridor.halfWidth`. `defaultLane` is used when a vehicle first adopts the
element; `parkingLane` is the lane from which bay capture/release occurs. `branchLanes` may name `left`, `straight`, or
`right`; a vehicle cannot commit to that branch until it occupies the required lane and its lane change has finished.
A denied branch emits `vehicle_branch_lane_refused` rather than teleporting or silently changing lanes.

In guided player control, one fresh A/D steering edge requests one adjacent lane. ROOM interpolates the lateral pose at
the configured lane-change speed and keeps the vehicle footprint/contact rules active throughout the change. Service
vehicles use the same lane state and graph, but their route controller requests the lane required by the next authored
service connector. `query("getLaneStatus", vehicleId)` returns the current lane index/label, target, change state and
available lane metadata for presentation.

#### Public-transit service sidecar

`routeNet.vehicleTransit` is optional and uses schema `rc-vehicle-transit@0.1`:

```json
"vehicleTransit": {
  "schema": "rc-vehicle-transit@0.1",
  "services": [{
    "id": "service_block_ab",
    "label": "Block A ↔ Block B public bus",
    "classId": "bus",
    "initialSpaceId": "transit_bay_a",
    "initialActive": false,
    "initialDriverActorId": "NPC_BUS_DRIVER_01",
    "driverRequired": true,
    "dwellSeconds": 10,
    "stops": [
      {"id":"stop_a","label":"Block A","spaceId":"transit_bay_a"},
      {"id":"stop_b","label":"Block B","spaceId":"transit_bay_b"}
    ],
    "routeLegs": [
      {"fromStopId":"stop_a","toStopId":"stop_b",
       "branchSequence":["a_00_turn_ne_right","a_10_to_b_straight"]},
      {"fromStopId":"stop_b","toStopId":"stop_a",
       "branchSequence":["b_00_turn_sw_right","b_10_to_a_straight"]}
    ],
    "routeNotes": {
      "outboundFork": "a_10_to_b_straight",
      "returnFork": "b_10_to_a_straight",
      "activationOwner": "ENCOUNTER",
      "physicalOwner": "ROOM"
    }
  }]
}
```

A service needs a unique id, a known vehicle class, a non-negative single dwell metric, at least two stops, and an
initial space that is one of those stops. Each stop must refer to an access-enabled parking space with
`access.kind:"transit_bay"`, and the service class must be accepted by the bay.

`routeLegs` is the authoritative ordered itinerary between consecutive stops. Every stop-to-next-stop transition needs
one leg when the list is present. `branchSequence` names the connector choices that must be taken **in order**. ROOM
chooses ordinary local-loop branches until the next named connector is encountered, advances the leg cursor only after
the vehicle physically enters that connector, and refuses target-stop capture until the full leg sequence is complete.
This allows a service to circle a block once before taking an inter-block fork without giving ENCOUNTER low-level road
control. Unknown stops, missing legs, or unknown connectors are validation errors rather than runtime guesses.

Legacy `routeNotes.outboundFork` / `returnFork` remain accepted for older V2.5 rooms, but a V2.5.1 full-circuit service
should use `routeLegs`.

The intended cold-launch service state is explicit: an inactive service is staged in `initialSpaceId`, fully stopped,
with the passenger door open and no dwell countdown. It remains there indefinitely. `setTransitServiceActive(...,true)`
starts the normal dwell timer; after that timer expires, ROOM closes the door, completes the authored bay pull-out, and
runs the vehicle over the shared road/lane/fork graph. Arrival at the next transit bay opens the door and starts the same
single dwell metric again. Deactivation is allowed only while parked at a bay.

A service may require a real driver binding. `initialDriverActorId` and `setTransitDriver(serviceId, actorId)` only bind
an external actor id to the driver position; ROOM does not create the NPC, author motives, or decide employment. With
`driverRequired:true`, activation without a driver is refused. If the binding disappears while en route, the service
enters a waiting state and holds the bus instead of continuing as a driverless vehicle.

Service states exposed by `getTransitServiceState` include `INACTIVE_AT_BAY`, `DWELLING`, `DOOR_CLOSING`, `DEPARTING`,
`EN_ROUTE`, `PARKING`, `WAITING_FOR_DRIVER_AT_BAY`, and `WAITING_FOR_DRIVER`. Door state is automatic service state,
not a player command. The passenger door is open only while the bus is fully parked in an authorized transit bay; the
bus cannot depart until it is closed, and stopping in traffic never opens it.

Runtime helpers, all using the logged/replayable command path:

- `world.setTransitDriver(serviceId, actorId | null)`
- `world.setTransitServiceActive(serviceId, true | false)`
- `world.setTransitDwellSeconds(serviceId, seconds)`
- `world.boardTransitActor(actorId, vehicleId)`
- `world.setInteriorActorInput(actorId, {forward, side})`
- `world.alightTransitActor(actorId)`

Read-only queries:

- `query("getTransitServices")`
- `query("getTransitServiceState", serviceIdOrVehicleId)` — includes the active ordered route leg, cursor, next expected connector and completion flag.
- `query("getVehicleSeatPose", vehicleId, seatId)`
- `query("getVehicleSeatPoses", vehicleId[, seatId])`
- `query("getVehicleInterior", vehicleId)`
- `query("getInteriorActorState", actorId)`
- `query("getVehicleDoorState", vehicleId)`
- `query("getLaneStatus", vehicleId)`


#### Vehicle-owned occupant seat poses (`rc-vehicle-seat-pose@0.1`)

Exterior access nodes answer where an actor approaches a vehicle; occupant seat poses answer where that actor is
physically presented after occupancy is established. A class may publish:

```json
"seatPoses": [
  {"seatId":"driver","role":"driver","x":0.72,"y":1.05,"z":4.72,"yaw":0}
]
```

The local convention is shared with access points: positive `x` is vehicle-left, positive `z` is forward, `y` is the
vertical presentation anchor, and `yaw` is relative to the vehicle heading. `seatId` must name a real class slot and
may appear only once. A class with `mobileInterior` must publish a driver pose so a host can place the real driver actor
without inventing geometry.

`getVehicleSeatPose(vehicleId, seatId)` returns the stable local pose plus the live world `x`, `y`, `story`, `heading`
and `zOffset`. `getVehicleSeatPoses` returns the list. The world pose is derived every query from the authoritative
vehicle pose, so it follows and turns with the vehicle. ROOM owns this geometry; ENCOUNTER owns which actor occupies it.

#### Transit bays and automatic passenger access

Transit stops reuse the parking/bay language but are distinct from personal-car spaces:

```json
"access": {
  "enabled": true,
  "capture": true,
  "kind": "transit_bay",
  "allowedClasses": ["bus"],
  "walkLoopEdges": ["me25_a_platform"]
}
```

The bus owns its passenger door/access node, just as the sedan owns its four door nodes. The initial bus class supplies
one `PASSENGER DOOR` point with `type:"passenger_door"`, `accessKind:"interior_portal"`, and an interaction radius.
The bay does not own the door and the player cannot operate it. `getVehicleAccessStatus` additionally requires the
service door to be `OPEN`; therefore boarding/alighting is refused while moving, while stopped in traffic, during bay
manoeuvres, or while the automatic door is closing/closed.

#### Mobile interior (`rc-mobile-interior@0.1`)

A vehicle class may add `mobileInterior`:

```json
"mobileInterior": {
  "schema":"rc-mobile-interior@0.1",
  "bounds":{"x0":-1.02,"x1":1.02,"z0":-4.85,"z1":4.35},
  "walkSpeed":1.55,
  "entry":{"nodeId":"door_inside","x":-0.82,"z":3.55,"heading":90},
  "nodes":[...],
  "edges":[...],
  "positions":[...]
}
```

Interior coordinates are vehicle-local: `x` is side-to-side and `z` is front/back. Boarding places the actor at the
entry, suppresses its outside body, and creates one local interior record. `forward` / `side` input moves that record
within the authored bounds. The published world pose is derived each frame from the authoritative bus pose plus the
unchanged local coordinates, so passengers move with the bus without dragging their dormant outside Route Walk state.
Alighting removes the interior record and returns the live passenger-door world point; the host projects that point to
its authored pedestrian network.

ROOM owns the physical interior bounds, door interlock, vehicle-relative transform and replay. ENCOUNTER owns actor
identity, social meaning, fares, permission, seating choices and the director/service activation UI. The shipped V2.5
Room Creator panel is a proof control only; production activation and dwell control belong in ENCOUNTER.

#### V2.5.1 proof topology

`Vehicle_V2_5_Two_Block_Transit_Test.room.json` authors two separated two-lane block loops. A dedicated A→B fork and a
different B→A fork join them. Each block contains one personal-car bay and one larger transit bay. A player Crown Vic
and the NPC-driver-bound bus share the same roadway, occupancy and contact rules. The Crown Vic defaults to the curb
lane/local loop; changing into the through lane allows the inter-block connector. The bus begins inactive/open at
Transit A, can be boarded from the authored platform, and follows ordered legs: it completes Block A before the A→B connector, completes Block B before the B→A connector, and therefore uses every block side plus both connectors during one repeating service circuit.

# Room Creator 0.15 — character packs in the route network (`routeNet.characters`)

Format number stays **11**. Everything below is optional and lives inside the optional `routeNet` block, so files
without characters are unchanged. Unknown keys anywhere in a character pack or actor are kept (tested in
`tests/characters_data.test.js`).

```json
"routeNet":{ …,
 "characters":[{"id":"buyer","name":"Buyer (purple jacket)","height":1.8,"pxPerMetre":110,
   "atlas":"asset_character_buyer",
   "frames":{"walk.side":{"x":0,"y":0,"w":53,"h":198,"ax":24.5,"neck":[31.0,27],"nohead":"walk.side~nohead"},
             "walk.side~nohead":{"x":55,"y":0,"w":53,"h":198,"ax":24.5},
             "head.Q":{"x":900,"y":420,"w":27,"h":31,"ax":13.0,"neck":[13.0,28]}},
   "states":{"stand":{"front":["stand.front"],"q":["stand.q"],"side":["stand.side"],"bq":["stand.bq"],"back":["stand.back"]},
             "walk":{"front":["walk.front","walk.front|m"],"q":["walk.q"],"side":["walk.side"],"back":["walk.back","walk.back|m"]}},
   "heads":{"F":"head.F","Q":"head.Q","S":"head.S","BQ":"head.BQ","B":"head.B"}}],
 "actors":[{"id":"buyer","character":"buyer","lane":"near_in","lanes":["near_in","far_w","near_out","far_e"],"loiterChance":0.55,…}]}
```

- **atlas**: id of a project image (`assets[]`, `category:"character"`) holding all of the character's pictures. The
  editor's image grid hides `character` images; they are still ordinary embedded PNGs.
- **frames**: rectangle in the atlas (`x,y,w,h`, pixels), `ax` = horizontal position of the feet/hip anchor (pixels from
  the frame's left). The frame's bottom edge is the floor. `neck` = point where the head joins (pixels in the frame);
  `nohead` = the same body with its head removed. Head frames carry `neck` as the point that sits on the body's neck.
- **pxPerMetre** turns frame pixels into metres (card width = `w/pxPerMetre`, height = `h/pxPerMetre`).
- **states**: pose → view → list of frame names. Views: `front` (0°), `q` (45°), `side` (90°), `bq` (135°), `back`
  (180°). `q`, `side` and `bq` pictures face the picture's right and are mirrored for the other side. A list with more
  than one frame is played by distance walked (0.72 m per frame walking, 1.05 m running); `"name|m"` = that frame
  mirrored. A one-frame walk gets a small bounce. Poses the game uses: `stand`, `walk`, `run` (speed over 2.1 m/s),
  `flinch` (0.7 s after a hit), `phone` (part of a stop at a spot), `alert` (the mark can see the player). A missing pose
  falls back to `walk` (for `run`) or `stand`.
- **heads**: `F/Q/S/BQ/B` → head frame. The body keeps its own head unless the head looks a different way (then the
  `nohead` body plus the head card are drawn), and always within 1.8 m of the player.
- **actor.character**: draws that NPC with the pack (otherwise the placeholder cards). **actor.lanes**: when the NPC
  leaves out of sight it comes back on the next lane in the list. **actor.loiterChance**: chance (0–1) to stop at each
  free spot of type `loiter` that its lane passes within 1.9 m (0.15: rolled once per spot per walk; before, once per walk).

## Route traffic driver loop (modular-street derivative, optional `routeNet.vehicleLoop`)

The First Encounter modular-street derivative may opt a route network into a richer traffic runtime without changing
format 11. The record is optional and unknown keys are preserved by the existing `routeNet` rules. Files without it use
the original 0.13/0.15 one-car-per-traffic-lane behavior.

```json
"vehicleLoop": {
  "schema": "rc-route-vehicle-loop@0.1",
  "enabled": true,
  "source": {"prototype":"Trapstar Vehicle Loop v0.4","adaptation":"authored route lanes in metres"},
  "config": {"fixedStep":0.0041666667,"maxTracked":12,"seedPerLane":2},
  "encounter": {"bindingStatus":"descriptor_only"}
}
```

When enabled, each `traffic[]` record remains the authored road lane but can host multiple persistent runtime vehicles.
`traffic.speed` is the default cruise; optional `cruiseMin` / `cruiseMax` bound generated per-car cruise speeds. Cars:

- receive stable `T01`, `T02`, … identities for their tracked lifetime;
- get deterministic Cautious / Steady / Brisk driver profiles derived from the route seed and vehicle serial;
- sample the nearest physical same-lane hazard every 0.10 s and act only after their own reaction delay;
- react to the player and NPCs only when those bodies physically project into the road-lane corridor;
- ease, brake, follow, or make a small bounded temporary speed increase under rear vehicle pressure when the road ahead is clear;
- use bounded acceleration, braking and jerk; no speed or position teleport is used to maintain a following gap;
- continue their AI while offscreen and are only spawned at an unseen lane start;
- may physically make bumper or pedestrian contact if a gap becomes impossible; actual contact is resolved at the
  footprint boundary rather than by an invisible pre-contact clamp;
- never autonomously change traffic lanes in this pass.

The route-walk runtime exposes current car state through `RCApp.ext().route.cars()`, recent contact/exit records through
`vehicleEvents()`, and a compact count through `vehicleSummary()`. These are diagnostics. `vehicleLoop.encounter` is
metadata only: Room Creator does not install Encounter consequences, identities, police response, insurance state, or
other world truth.

# Room Creator 0.14 — placed 3D objects (`props`) and the project object library (`objectLibrary`)

Format number stays **11**. Both blocks are optional and only written when present, so files without 3D objects are
byte-for-byte what 0.13.1 wrote. **Rule for every block below: fields the editor does not know are kept unchanged on
load, edit and save** (tested in `tests/props_metadata.test.js`). Unknown tag objects, unknown point types, unknown
keys in `override`, `collision`, `gameplay`, points, looks, palettes and setups all survive.

Geometry is never stored in a project: an object references a library model by its stable `asset_id`
(`ASSET_MANIFEST.json`). The library itself is read-only; Room Creator never writes to it.

> 0.15.2 — library manifest field **`requires`** (array of strings). `multi_material`: the model has several parts with
> different pictures or plain colours; `alpha`: some parts are cut-out or see-through. Room Creator 0.15.2 supports both and
> draws such models part by part (one material per source material; glTF `alphaMode` MASK → cut-out at `alphaCutoff`,
> BLEND → see-through; untextured parts use their base colour). A model whose `requires` are all supported is shown even if
> `recommended_for_room_creator` is false. Unknown `requires` codes keep the model hidden. Models without `requires` are drawn
> exactly as in 0.14–0.15.1 (one picture for every part). Library v2 also carries extra per-model fields (`dimensions`,
> `geometry`, `vehicle`, `room_creator`, `qa`, `scale_basis`, …); Room Creator ignores them.

## Coordinates
- Plan metres: `x` east, `y` south, `story` = story index. `z` = height above that story's floor (or the room floor).
- `rotation` = plan heading in degrees that the model's **front** faces (0 north, 90 east, 180 south, 270 west).
- Model space = the GLB's own axes: metres, +Y up, ground-centre pivot. The front is +Z unless the asset's setup says
  otherwise (`frontTurn`, below). +X is the model's **left**.
- three.js yaw = π − rad(rotation) − rad(frontTurn).  `core.propToPlan / planToProp / propYaw / propFootprint` do the maths.

## `project.props[]` — one record per placed object
```json
{"id":"prop_till","asset":"lp_technology_props_misc_tech_props_mesh_checkout_till_02","name":"Register",
 "x":57.35,"y":31.9,"story":0,"z":1.0,"rotation":270,"scale":[1,1,1],"enabled":true,"locked":false,
 "roomId":"room_shop",
 "look":null,
 "override":{"palette":"palv_x","tint":"#c23b2a","tintStrength":0.5,"brightness":1,"contrast":1,"saturation":1,"hue":0,
             "filter":"pixel","texture":{"library":"pix_metal_metal_01_grey_rust_3"}},
 "collision":{"solid":true,"shape":"auto"},
 "gameplay":{"tags":["interactable","commercial",{"id":"faction","value":"police"}],"props":{"cash":{"min":40,"max":220}}},
 "points":[{"id":"pt_till_1","type":"customer","name":"Customer pays here","x":0,"y":0,"z":0.85,"yaw":0,"enabled":true}],
 "bounds":{"min":[-0.17,0,-0.24],"max":[0.17,0.44,0.24]}}
```
- `asset` — library `asset_id`. A missing/renamed asset is **kept** (pink placeholder + repair message, never deleted).
- `roomId` — recomputed on every load/save from the position (room on that story, or `null` on open floor space).
- `scale` — per axis, 0.01–50 (a single number is read as uniform). `enabled:false` = faint in the map, absent in first
  person, not solid. `locked:true` = cannot be dragged/turned.
- `look` — id of a named look in `objectLibrary.looks`, or `null`.
- `override` — this object's own appearance changes, on top of the look. Known fields (`LOOK_FIELDS`):
  `palette` (project palette id, library palette id, or `"default"` = force the library palette even if the look has one),
  `texture` (`{library: textureAssetId}` or `{image: projectAssetId}`, or `"default"`), `tint` (#rrggbb), `tintStrength` 0–1,
  `brightness`, `contrast`, `saturation`, `hue` (degrees), `filter` (`"pixel"` crisp | `"smooth"`).
  Resolution order: library default ← look ← override (`core.propAppearance`).
- `collision` — `solid` (people can't walk through), `shape` `auto` (box fitted to the model) | `box` | `cylinder`,
  optional `size` [width, depth, height] in model metres (before scale) and `offset` [x, z]. A solid object blocks walking
  when its height range overlaps 0.15–1.8 m above its floor. Used by first-person walking, rails paths, route-walk sight
  lines/blocking and the route check.
- `gameplay.tags` — open-ended: any string, or any object (kept as-is). Suggested words in the UI are only suggestions.
  `gameplay.props` — free key/value data for later game systems. Other keys in `gameplay` are kept.
- `points[]` — Use Points / sockets attached to the object: `type` is any string (`sit`, `use`, `work`, `customer`, `cover`,
  `hide`, `driver`, `passenger`, `arrival`, `look`, `stand`, `search` are suggestions; new types need no code), position
  `x,y,z` in **model space** (so points move/turn/scale with the object), `yaw` degrees (rotates +Z toward +X),
  `enabled`, optional `name`. Room Creator authors where/what a point is; it does not run behaviour.
- `bounds` — the model's measured box (model space), stored so collision and placeholders work without the library.

Limits: 5000 objects per project; duplicate ids are renamed on load.

## `project.objectLibrary` — reusable, project-local, exportable
```json
{"schema":1,
 "looks":[{"id":"look_chair_red","name":"Painted red","asset":"lp_furniture_chairs_mesh_chair_wood_01","palette":"palv_red_paint"}],
 "palettes":[{"id":"palv_red_paint","name":"Red paint, teal seat","base":"pal_lowpoly_master_32","image":"data:image/png;base64,…",
              "quick":"grimy","owner":"prop_id"}],
 "setups":{"lp_furniture_chairs_mesh_chair_wood_01":{"frontTurn":180,"points":[…default use points…],"tags":[…],"collision":{…}}}}
```
- **looks** — named appearances (any `LOOK_FIELDS`). `asset` limits a look to one model; without it a look may name a
  palette `family`.
- **palettes** — edited copies of a library palette image (`base` = library palette id). `quick` marks the one-click
  Grimy/Faded/Night/Warm versions; `owner` marks a palette made for one object's own colour change.
- **setups** — per-model defaults for *new* copies: `frontTurn` (0 / 90 / 180 / 270 = which side of the model is its real
  front, measured from +Z toward +X; older `front:-1` is read as 180), default `points`, `tags`, `collision`.
- Export/Import: the Looks view writes `{"format":"trapstar-room-creator-looks","version":1,"looks":[…],"palettes":[…],
  "setups":{…}}` (palettes a chosen look needs are always included). Import skips identical entries and adds clashing ids
  as new copies. The canonical library is never touched.

## Library textures on walls/floors
Choosing a library texture copies it into the project's image list (`assets[]`) with `library:{asset_id, library}` so the
project keeps working without the library. Surfaces gained `filter: "pixel"|"smooth"` (default pixel).

# Project format 11 (Room Creator v0.13)

Version 11 adds five things. Version 4/7/8/9/10 files are upgraded on load (the new fields get defaults); nothing old is removed.

- `project.sky` — `{mode:'gradient'|'image', top, horizon, bottom (#rrggbb), curve 0.1–4, assetId|null, rotation (deg), repeat 1–16 (integer), mirror, flipX, horizonV 0–1 (row of the picture placed at eye level, 0 = top), size 0.1–8, lift −45…45 (deg), fadeTop 0–1, fadeBottom 0–1, brightness 0.1–3, saturation 0–2.5, tint (#rrggbb), tintStrength 0–1, haze:{enabled, color|null (null = horizon colour), start m, end m (> start), strength 0–1}}`. A picture is wrapped round the camera on a cylinder: one copy spans 360°/repeat; its height follows the picture's proportions × size. `mode:'image'` without an existing asset falls back to the gradient. `SKY_PRESETS` holds the built-in gradients.
- `viewpoint.horizon` — 0.1–0.9 (default 0.42): the fraction of the picture height where eye level sits. Lower values look up, higher values look down; the camera stays upright (vertical lines stay vertical).
- `project.stairs[]` — `{id, name, story (bottom story; top is story+1), x, y, width (X extent), length (Y extent), dir:'N'|'E'|'S'|'W' (climbing direction), steps, rails, surface}`. `createStairs`/`editStairs` keep three generated records in step: a `floorCuts` opening on the story above (`stairId`), `ceilingCuts` over the flight in rooms below (`stairId`), and guard-rail free walls with spindle openings round the opening upstairs (`partitions[].stairId`). `deleteStairs` removes all of them. `stairGeometry(p,st)` gives steps, rise, run, bottom/top centres and the walk-on (`entry`) and walk-off (`exit`) points.
- `project.floorCuts[]` — `{id, name, story, x, y, width ≥ 0.2, length ≥ 0.2, stairId?, openBelow?}`: rectangular holes in a story's floor. `inFloor` treats them as not-floor; the renderer leaves them open. Editor-made holes also open the ceiling of rooms directly below through `ceilingCuts` tagged `floorCutId` (unless `openBelow:false`).
- `project.rails[]` — `{id, name, speed m/s 0.2–40, ease m, corner m, lookAhead m, turnDistance m, hold s, autoPath, loop, nodes[]}`; each node is `{id, kind:'stop', viewId, hold|null, speed|null}` or `{id, kind:'via', x, y, story, speed|null}`. `rails.js` (`RCRails`) turns a rail into a timed camera path: a walking path on a 0.2 m grid per story (around walls with 0.2 m clearance, through open doors/passages ≥ 1.65 m high, up stairs), rounded corners, cosine speed ramps, look-ahead headings blended into each stop's facing, and holds at stops. `RCRails.exportFrames(plan,fps)` returns per-frame `{t, x, y, story, eyeZ, facing, fov, horizon, stop}` — the same data the editor's "Camera path (.json)" export writes.

The map can also be shown as a flat top-down plan (`setMapProjection('plan')`); this is display state only and is not saved.

> v0.12 keeps schema version 10. New core operations: `addStoryWithRooms(p,{name,sourceIds})`, `floorSectionToRoom(p,id)`, `deleteRoom(p,id)` (re-hosts free walls, removes the room's ceiling edits, keeps items still on floor space), `storyContents(p,i)`, `deleteStory(p,i,{force:true})`. Partition overlap and junction checks compare walls on the same story only.

> v0.11.2: viewpoints and objects may stand on a floor section with no enclosed room. They then store `roomId: null` with an integer `story`; `floorZ` derives from that story's elevation. Validation never reassigns a story-tagged item to a room on another story. `lightingRoomAt(p,q,story)` gives the room whose tint applies at a floor point.

> v0.11.1 keeps schema version 10. `storyName(p,i)` returns a story's stored name; `floorSectionHost(p,f)` picks the room a floor section borrows default materials/tint from (same-story room under its centre → nearest lower room under its centre → any same-story room → first room). Deleting a story renames shifted stories that still carry their default label.

> Editor v0.11 uses the existing v10 project schema. Story focus, reference visibility, drawing guides and fixed editing projection are session-only UI state. Floor operations edit the existing floorSections array; split/extend preserve top and underside materials.

# Project format 10 — implementation notes

The portable bundle is `{project, assets, savedWith}`. `RCCore.validateBundle` is the authoritative validator. All plan coordinates and construction dimensions use metres internally; `project.units` changes display only. Facing remains degrees clockwise from North (negative Y). +X is East and +Y is South.

`project.format` remains `trapstar-room-creator`; `version` is 10. Supported earlier room-project formats are normalized to format 10. v0.10 introduces an explicit contiguous `stories[]` stack plus manual floor, ceiling, wall and pillar construction records. Story indices must be consecutive beginning at 0 (Ground); nonexistent intermediate stories are invalid.

### v0.10 construction records

- `stories[]`: `{id,index,name}`. Indices are contiguous `0..n-1`. Adding creates only `n`; deleting a used story is refused, while deleting an empty intermediate story shifts higher records down one level.
- `floorSections[]`: rectangular manual floor patches with `story`, `x/y/width/length`, `floor` material and `underside` material. They can extend beyond rooms and provide their underside as ceiling to lower viewpoints.
- `ceilingCuts[]`: rectangular holes hosted by a room ceiling.
- `ceilingPatches[]`: explicit rectangular ceiling areas hosted by a room; these can restore selected overhead areas even when the room uses the broad `openAbove` mode.
- `partitions[]` may set `free:true` and a `story`; these free walls use the same two-face material/opening pipeline but are not required to lie wholly inside an enclosed room footprint.
- `pillars[]`: `{id,name,story,x,y,width,depth,height,surface,blocks}`. Pillars may exist inside or outside room footprints and can be explicit cover sources.

The older rectangular `rooms[]` workflow is retained. `Adjoin same story` and `Room above` remain convenience tools layered alongside manual construction rather than being replaced by it.

## Persistent records

- `rooms[]`: axis-aligned rectangles with IDs, origin, width, length, `story`, `openAbove`, `balconySides`, floor/wall/ceiling style, individual N/E/S/W overrides, ambient light, and exterior matte settings. Rooms may overlap in X/Y only when they are on different stories.
- `partitions[]`: independent interior wall lines, always hosted in one room section. See below.
- `openings[]`: apertures attached either to a room boundary side or to a partition; geometry is shared, not copied into separate views.
- `lights[]`: room-local 2D falloff tint records.
- `objects[]`: shared image instances with room/story attachment, absolute `floorZ`, floor coordinates, footprint, height/mount, facing, anchors, opacity, sprite/panel/floor mode, image assignments, visibility/locking, and blocking flag.
- `viewpoints[]`: room/story attachment, absolute `floorZ`, floor position and facing, FOV, eye level, output pixel dimensions, role, optional explicit `cover`, and notes.
- `pairs[]`: primary covered view ID, exposed view ID, sideways/forward offsets, exposed eye level, and name. `syncPairs` derives the exposed pose from its primary.
- `links[]`: ordinary directed/two-way travel routes between viewpoint IDs, separate from paired-state switches.
- `startViewId`, `migrationNotes`, `legacyArchive`: existing navigation/provenance fields.
- Bundle `assets[]`: imported PNG/JPEG/WebP data URIs, ID, name, and dimensions. New projects and the new partition example use an empty array.

## Multi-story records

`project.storyHeight` is the common floor-to-floor spacing in metres (2.2–8.0). A room stores integer `story` (`0` Ground, positive values above, negative values basements). `roomElevation(project, room)` returns the room floor elevation; `roomTop` adds the common wall height.

> v0.15.1: a story record may carry its own `elevation` (metres; street generators use this, e.g. river water −4.2, lower walkway −3.4, street 0). `storyElevation(project, story)` is now the single source of truth: a story with `elevation` uses it; a story without one sits `storyHeight` above the nearest lower story that has one, or at `story × storyHeight` when no story has one (older projects therefore keep exactly the old numbers). `roomElevation`, `roomTop`, object and viewpoint `floorZ`, slab tops and the map frame all use it. `storyGap(project, story)` is the real height from that story up to the next one (falls back to `storyHeight`); stair flights, the build-up stair tool and the free camera on stairs climb `storyGap`, not `storyHeight`. Changing `storyHeight` does not move stories that have a set `elevation`.

Each room adds:

```json
{
  "story": 0,
  "openAbove": false,
  "balconySides": []
}
```

`openAbove` suppresses that room's normal ceiling wherever the view can continue into higher architecture, allowing atriums and double-height spaces. `balconySides` contains N/E/S/W sides on upper rooms that should render as a simplified 1.05 m gallery edge rather than a full-height boundary wall. It is an authoring shorthand, not a configurable railing-asset system.

`addRoomAbove` creates a higher-story rectangle from an existing room with optional X/Y offsets and dimensions. X/Y overlap is legal across different stories; same-story overlap remains invalid. `addAdjoining` always creates a room on the parent room's current story. `roomWalls` includes the story in its deduplication key so walls at the same X/Y on different floors stay independent.

Objects and viewpoints carry `roomId`, `story`, and derived `floorZ`. Validation re-derives `floorZ` from the owning room so changing `storyHeight` does not require hand-editing every record. Cover partners remain on the primary viewpoint's story.

A `links[]` route whose endpoint viewpoints are on different stories is an explicit vertical transition. The core treats it as author-defined navigation; it does not create stair, elevator, ramp, or ladder geometry. Same-story routes continue to use the normal straight floor-plan obstruction checks.

The first-person renderer uses absolute floor elevations so a Ground viewpoint can see upper slabs, walls, openings and balcony caps when the lower room is open above. Isometric rendering stacks rooms using the same elevations. Stories are still authored as flat 2D floor sections; there are no meshes, sloped floors, or physical floor-thickness simulation.

## Partition record

```json
{
  "id": "partition_example",
  "name": "Interior divider",
  "roomId": "room_main",
  "axis": "h",
  "x": 1,
  "y": 3.4,
  "length": 8,
  "height": null,
  "faces": { "A": {}, "B": {} }
}
```

The `faces` values above stand for full surface-style records from `surface()`; empty objects are not valid styles. `axis:'h'` extends from `(x,y)` to `(x+length,y)`. `axis:'v'` extends to `(x,y+length)`. Length is positive, 0.35-40 m. Null height follows the common room height; a custom height must be 0.3 m through the common wall height.

Face A is viewed from the positive side of the line (+Y for horizontal, +X for vertical), Face B from the negative side. Both faces use the same direct texture schema as room walls. There is no `exterior`, `matte`, or `backdrop` field on a partition; validation rejects such assignments.

Both endpoints must lie inside/on the owning rectangle, and the line's fixed coordinate must be at least 0.04 m inside that rectangle. Collinear overlap is invalid. Orthogonal solid junctions are permitted but cannot run through another partition's aperture. Geometry edits preserve hosted opening offsets; a resize too small for an opening fails atomically.

`partitionWall` derives a line for the common wall-processing pipeline:

```
kind: 'partition'
partitionId: partition.id
id: 'partition_wall_' + partition.id
owners: [{roomId, partitionId, face:'A', side:'A'}, ...face B...]
height: resolved common/custom height
```

This is not an exterior boundary and does not duplicate a room section. It participates in visibility, viewpoint clearance, routes, first-person tags, and isometric selection.

## Aperture hosts and multiple cuts

Boundary opening:

```
roomId: host room ID
side: 'N' | 'E' | 'S' | 'W'
partitionId: null or absent
```

Partition opening:

```
roomId: partition's room ID
partitionId: partition ID
side: null
```

Both store `offset`, `width`, `bottom`, `height`, `kind:'door'|'window'|'passage'`, `open`, `trim`, frame/panel/glass colors, and optional door-panel texture ID. Offset is measured from the host line's increasing-coordinate start, not the observer's screen-left. A host can contain many nonoverlapping intervals. Stacked apertures at overlapping horizontal intervals are not supported.

`openingHostLine`, `openingCap`, and `openingHostLabel` resolve either kind of host. `openingsForWall` restricts by partition identity before considering line overlap, preventing leakage between distinct hosts.

`unusedWallSpans` subtracts occupied intervals from the selected segment; usable gaps are at least 0.35 m. `suggestOpening` fits a new cut within one gap. `openUnusedSpans` validates a trial copy and adds passages in those gaps without modifying existing openings. `fullOpenWall` remains non-destructive and refuses occupied walls.

## Attaching rooms

`canAttachRoom` requires an existing boundary opening whose entire span is exterior. `attachRoomPlan` takes `width`, `length`, optional `inset` (null means center), and optional name. It returns a nonmutating trial plan and affected-opening names for UI preview. The new room lies outside the host side, with its whole edge covering the selected opening and no overlap with other rooms.

`attachRoom` commits the validated new room only. It never duplicates or changes the existing aperture. Room boundary deduplication derives the new shared geometry; matte visibility follows the shared/exterior intervals, not a mutable per-opening interior flag. Opening kind and door state are preserved. New viewpoints/routes are not automatically created.

Room-section resize/move operations carry hosted partitions with room contents when requested, and validate all partitions before commit. Deleting a partition removes its hosted apertures and clears dangling cover sources without discarding view positions.

## Surface styles

Surfaces retain the previous color/finish/texture/repeat/angle/offset/opacity settings. `surface()` and validation define exact defaults. A room's shared wall default can have per-side overrides; a partition stores independent complete Face A and Face B styles. A selected-face texture import identifies the partition and face explicitly, so changing panel context cannot redirect an in-flight import to another surface.

Isometric wall material patches use the same texture sampler and room tint/light settings as the first-person surface. Texture coordinates run along the host wall and vertically through its height. An aperture clips the wall surface; it does not re-fit the wall texture into each remaining piece.

## Shared-side mattes, retained from 0.6.1

`rooms[].exterior.default` and `rooms[].exterior.sides[N|E|S|W]` hold:

```json
{"assetId": null, "fit": "cover", "scale": 1, "offsetX": 0, "offsetY": 0, "alpha": 1, "distance": 0}
```

Empty side image references inherit the default. `backdropFor` is a nonmutating read and explicitly returns null for partition owners. `backdropFrame` rejects partition owners. Renderers only apply mattes to actual exterior boundary segments (`owners.length === 1`, no partition ID), not shared-room or interior-partition segments.

The entire room side supplies the matte coordinate reference, not an aperture or a deduplicated subsegment. Horizontal direction is screen-right when viewed from inside: N west-to-east, E north-to-south, S east-to-west, W south-to-north. Shared/exterior subdivision does not change that framing. `distance` 0-100 m shifts the flat matte outward for observer-relative parallax. Out-of-image samples remain empty instead of tiling, clamping, or smearing.

Exterior pixels have separate hit tags from wall, partition, and opening-frame tags. They never count as frame/partition cover. A partition opening may reveal another real room opening farther away; that boundary opening may legitimately show an exterior matte.

## Viewpoint-first cover

A new obstruction source is supported:

```json
{"kind":"partition","id":"partition_example"}
```

Existing sources remain `wall` (roomId/side), `opening` (ID), and `object` (ID). A partition source matches visible solid partition pixels, not an aperture, scenery, or an unrelated wall behind it. Cover percentages are authoring aids only. Exposed partners cannot exist without an assigned primary covered viewpoint. Geometry edits never invent replacement views or move a cover pair with furniture.

## Rendering and boundaries

The renderer stays Canvas2D: wall-line intersections on the floor plan determine vertical screen bands, floor/ceiling samples, architecture depth/picking, and sprite/panel compositing. There is no 3D model/mesh scene, WebGL dependency, or automatic image-angle synthesis.

The isometric cutaway shortens the displayed front/perimeter and partition heights for editing only. The first-person architecture, collision, and routes use actual wall geometry. Test routes still use straight floor-plan segments; walls/windows/closed doors block them, and bend navigation needs intermediate viewpoints. Custom short partitions are not a vault/jump system.

## Source and tests

`core.js` owns geometry/invariants/validation, `renderer.js` owns rendering/picking, and `app.js` owns interactions, imports, undo, and exports. The single HTML is built from `shell.html`, `style.css`, those scripts, and the retained legacy converters with `build.py`.

`window.RCApp` exposes selected commands for QA. Direct raw-project mutation is not the supported editor workflow. `RCCore.validateBundle` should be used for generated project files. See `../TEST_REPORT.md` for current tested paths and environment limits.

## Opening fields retained from v0.8

`panes: 1|2` (default 2), `leaves: 1|2` (default 1), `frameWidth` (m),
`dividerWidth` (m), `glassOpacity` (0–0.75),
`doorStyle: panel|flush|slatted`, `handleColor` (hex). Total width is always the
entire opening, not per-pane/per-leaf width. `open` is still a shared door state.
`openingGeometry` derives capped trim widths; `openingRanges` derives bounds
from neighboring cuts and host dimensions. `editOpening` validates and rolls
back atomically, including occupied-viewpoint safety.

## Surface fields retained from v0.8

- `mapping: repeat|mirror|stretch`. Stretch maps once to the full surface.
- `tileSize` is the U dimension in metres; `tileSizeY` is V, or null to link.
- `flipX`, `flipY`, `angle`, `offsetX`, `offsetY` adjust the sampling transform.
- `coordinateMode: local|legacy`. Local walls use along-wall coordinate relative
  to their full host, with vertical origin at the top. Legacy retains old origin.
- `brightness`, `contrast`, `saturation`, `hue`, `tintStrength`, `textureOpacity`.
- `secondary` pattern colour, `jointWidth`, and `wear`.
- `baseHeight`, `baseColor`, `capHeight`, `capColor`: painted wall trim bands.

Surface images blend their alpha over the solid surface's base colour. They do
not make the actual wall geometrically transparent. Only architectural openings
do that. Exterior matte sampling is unchanged.

Room `light` adds `exposure`, `contrast`, `saturation`; individual `lights[]` add
`falloff` (default 2). These are 2D colour effects, not physically based lights.

## Named room looks

`project.stylePresets[]` stores `{id, name, look}`. `look` contains copied
`floor`, `wall`, `ceiling`, `walls`, and `light` settings only. Surface references
inside saved looks are validated against the embedded catalogue. Clearing images
clears those references as well. Opening/room geometry, matte and viewpoint/pair
records are deliberately excluded.

## Route network (0.13.1 prototype, optional `routeNet`)

A project may carry `routeNet`. It is only kept when present, so ordinary projects are unchanged. It is
authored as JSON for now (see `examples/Route_Prototype_Street.room.json` and
`scratch/make_route_scene.cjs` in the build workspace). Coordinates are plan metres; story 0 only.

```json
{"version":1,
 "settings":{"seed":1977,"start":{"edge":"e_harlan_w","s":8,"dir":1},"defaults":{"strafe":0.7}},
 "vertices":[{"id":"vD","name":"Bodega door","x":58.25,"y":37.85,"story":0}],
 "edges":[{"id":"e_bodega","a":"vD","b":"vIn","name":"Bodega","band":0.25,"door":"opening_bodega_door"}],
 "lanes":[{"id":"near_in","side":"near","offMin":-0.1,"offMax":0.8,"door":null,"points":[{"x":50,"y":-1.6}]}],
 "nodes":[{"id":"N4","name":"Behind the parked car","x":33,"y":39.2,"facing":180,"types":["cover","hide","spy"],
           "radius":0.55,"reach":true,"door":null,"insidePath":null}],
 "zones":[{"id":"Z1","x":47,"y":52.95,"width":5,"length":0.9,"slots":[{"x":47.8,"y":53.4,"facing":45}]}],
 "portals":[{"id":"P1","name":"Alley (corner)","kind":"corner","x":50,"y":-2.1}],
 "traffic":[{"id":"car_w","speed":8.5,"gap":9,"delay":3,"points":[{"x":65.6,"y":-19}]}],
 "actors":[{"id":"mark","role":"mark","cls":"combatant","lane":"far_w","startS":16,"divertAt":"N6","watch":40}]}
```

- **edges**: the player's walkable route. `band` caps the strafe distance each side (the Route walk
  slider caps it further). `door` names an opening: while that door is closed the branch is blocked.
- **lanes**: one-way NPC walking lines. `offMin`/`offMax` limit how far walkers may step aside
  (+ = the walker's right). `door`: walkers only appear on this lane while that door is open.
  A lane should start and end at a hidden spot (a portal).
- **nodes**: shared spots. One occupant at a time (player or NPC). A node within 1.9 m of a route edge
  makes the strafe band bulge so the player can step into it (`reach:false` turns that off).
  `insidePath` lets an NPC leave through a door (last point = hidden exit).
- **zones**: gathering places; `slots` are where loiterers stand.
- **portals**: documentation and debug markers for valid ways in and out. The rules are enforced by
  sight lines at run time, not by the marker.
- **actors**: `role` walker | loiter | stoop | mark; `cls` pedestrian | stationary | background |
  combatant (how hard the card may cheat); `views` limits the body pictures (default FRONT, 3/4, BACK).

## Block Composer v0.3 extension

Generated First Encounter block projects may carry `project.routeNet.blockComposer` with schema `feg-block-composer@0.3`.

This metadata is additive and preserved by the existing open route-network rule. It describes a recipe of repeatable 26 m × 60 m blocks. Each block permits 1–3 atomic street elements. The main street axis is east-west. Optional `river` or `tunnel` lower crossings are north-south, with the walkable lower pedestrian story one story below Street Level. River water may occupy a separate non-walkable story below the pedestrian walkways.

> v0.15.2 (texture pass): `blockComposer.texturePass` = `{version:1, textures:[…], note}` when the street was built with
> textures (default). Surfaces then use `finish:"image"`, `textureId` = one of the embedded pictures `asset_blocktex_asphalt`,
> `_paving`, `_brick`, `_grass`, `_concrete` (image records with `category:"texture"` and a `source` note naming the CC0
> origin), and `tileSize` = the picture's real repeat in metres. Street rooms carry brick on `walls.S` only. The pass changes
> surface looks only; `buildBundle(specs,{textures:false})` gives the untextured street with identical geometry.

> v0.15.1 (layout revision 2): `blockComposer.layoutRevision` is `2`. Each `instances[]` entry gains `layout`: `{revision, elements:[{element, side, x, width, scale}], stairs:{near, far}, notes:[…]}`. `x` is the element's centre across the block, `width`/`scale` record any narrowing (never below 0.8 for near-side shops and alleys, 0.85 for far-side features), `stairs` gives each lower-crossing stair's foot point and side, and `notes` are the plain-words adjustments shown in the Blocks panel. Stairs never overlap shops, alleys, walls, pillars, objects, spots, NPC lanes, walkways or parking; shop fronts sit flush on the sidewalk line (y 12.5). Files from layout revision 1 still open unchanged; only newly built blocks use revision 2.

Room Creator owns the authored spatial representation. `encounterBindingStatus: "descriptor_only"` never grants Room Creator authority over Encounter identity, action, consequence or observation truth.

## Encounter retrofit R2 — Movement Network ribbons and derived junction zones

Format remains **11**. The editor visually authors the existing `routeNet.vertices[]` and `routeNet.edges[]`
records; no second movement graph is introduced. Enhanced Movement Network edits continue to use
`routeNet.movementSchema: "rc-movement-net@0.1"`. Older projects remain valid and are not rewritten merely by opening them.

R2 continues to store movement width only in the existing `edge.band` half-width. Existing edges keep their authored values.
New ordinary movement edges created by the enhanced editor start at the provisional Encounter-derived authoring baseline
`band: 0.60` m. Door/gated/chokepoint context may remain narrower.

The Move pane renders each edge as a physical ribbon using its authored width. Junction choice/capture geometry is derived
for authoring/validation instead of stored everywhere:

```text
effective capture = max(0.50 m, widest connected authored half-width + 0.10 m)
```

R2 warns, but never silently repairs, ordinary edges narrower than the provisional ±0.60 m baseline, preview strafe caps
that hide part of an authored ribbon, and overlapping derived zones between true branching junctions. Broader topology
validation (unmarked terminals, disconnected components, crossing edges without a shared vertex, etc.) remains a later pass.

R2 does not change Encounter preview controls, NPC behavior, doors, occupancy, traffic arbitration or activity selection.
Door-approach authoring remains R3; intentional terminals and full topology validation remain R4.

## Encounter retrofit R3 — authored door approaches

R3 keeps project format 11 and the existing `routeNet` model. No separate door-navigation graph is introduced.

A movement vertex/edge may carry optional `doorApproach` metadata used only to preserve the authoring relationship between a Room Creator door and its generated movement pieces:

```json
{"door":"opening_id","side":"h+","role":"approach","sourceVertex":"v_source"}
```

Supported roles are `approach`, `threshold`, `link`, `gate`, and (for a two-sided interior/shared door) `cross`.

An authored approach also creates/reuses a route POI in `routeNet.nodes[]`:

```json
{
  "types":["door","approach","interact"],
  "door":"opening_id",
  "doorSide":"h+",
  "vertex":"v_approach",
  "facing":0
}
```

The canonical physical pattern is:

`ordinary route -> approach/interact vertex -> short door-gated threshold`

For a door with two authored usable sides, R3 additionally links the two threshold vertices with a door-gated cross-door edge. A closed door leaves each approach reachable; only the segments tagged with `edge.door` are blocked.

R3 defaults are provisional Encounter-derived authoring values: approach setback 0.90 m from the door plane, threshold setback 0.60 m, and door/gate half-width 0.30 m. Existing projects are not rewritten automatically.


## Encounter retrofit R4 — intentional terminals and topology validation

R4 keeps project format **11** and the same `routeNet` movement graph. No second movement or validation graph is introduced.

A movement vertex may carry the optional terminal marker already defined by the ROOM ↔ ENCOUNTER movement contract:

```json
"terminal": {
  "intentional": true,
  "reason": "world_edge"
}
```

The presence of `terminal.intentional:true` means a degree-1 route endpoint is deliberately authored to end there. `reason` is optional/open-ended authoring text. This is spatial metadata only: Room Creator does not assign gameplay meaning, activity, transition, or consequence to the stop.

The Move pane now reports topology warnings without silently repairing the graph. R4 checks include:
- degree-1 endpoints that are not intentional terminals and are not structurally explained by a door threshold / linked stop / portal;
- terminal markers placed on nodes that are not degree-1 endpoints;
- isolated movement vertices;
- disconnected movement components;
- same-story movement edges that cross/touch/overlap without a shared graph vertex;
- duplicate and zero-length edge connections;
- edges that reference missing vertices;
- movement vertices outside authored floor space;
- movement edges that cross invalid physical world geometry (solid walls / outside floor), with closed-door state ignored for this authoring check;
- door-gated edges that have no authored reachable door approach/interact structure;
- door approach POIs that drift away from their associated movement approach vertex.

R2 width/junction warnings and R3 door-approach stale/link warnings remain active. R4 warnings are diagnostic only. They never widen, reconnect, split, move, or delete authored topology automatically.

The built-in Encounter movement fixture remains the same 10×8 / 3×3 route room with two R3 door approaches and now validates with zero R4 topology warnings.


## Polish & Asset Readiness v0.2 — no saved schema change

Project version remains 11. Finish proposals, preview renderers, selection filters and the shared appearance clipboard are transient editor state. They are not new serialized project records. Application writes the existing known surface fields and only the referenced new embedded images. Inherited ceiling materials remain inherited after no-op edits. Unknown destination metadata remains on its own target and is not copied through the surface clipboard. City/Transport declarations, physical geometry and external model bounds are unchanged by finishing.
