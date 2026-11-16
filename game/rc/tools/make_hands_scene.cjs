"use strict";

const fs = require("node:fs");
const path = require("node:path");
const room = require("../source/core.js");
const physics = require("../source/actor-physical.js");

const project = room.newProject();
project.name = "Warehouse sparring floor";
project.wallHeight = 4;
project.storyHeight = 4.2;
const warehouse = room.makeRoom("Warehouse", -6, -6, 12, 12, 0);
warehouse.id = "sparring_floor";
warehouse.floor = room.surface("#514e40", "concrete");
warehouse.wall = room.surface("#4b4a3e", "paint");
warehouse.ceiling = room.surface("#32352b", "paint");
project.rooms = [warehouse];

const bundle = {
  project,
  assets: [],
  sparring: {
    controlId: "blue",
    arenaFloorIds: ["sparring_floor:floor:0"],
    seed: 1977,
    actors: [
      {id: "blue", name: "Blue", appearance: "blue", bodyProfile: "standard", x: 0, y: 1.3, z: 0, story: 0, yaw: 0, ready: false},
      {id: "red", name: "Red", appearance: "red", bodyProfile: "standard", x: 0, y: -1.3, z: 0, story: 0, yaw: 180, ready: false},
    ],
  },
};

const normalized = room.validateBundle(bundle).project;
const compiled = physics.roomGeometry(normalized, room);
if (compiled.surfaces.filter(surface => surface.kind === "floor").length !== 1 ||
    compiled.boxes.filter(box => box.kind === "wall").length !== 4) {
  throw new Error("The sparring preset needs its single support floor and four perimeter walls.");
}

const output = process.argv[2] || path.join(__dirname, "../examples/First_Encounter_Hands.room.json");
fs.writeFileSync(output, JSON.stringify(bundle, null, 2) + "\n");
