# First Encounter · Hands First

Open `dist/Play_First_Encounter_Hands_v0_1.html` in a desktop browser and select **Start sparring**. The file contains the full game, hand artwork and synthesized sound. It can run directly from disk.

## Try an exchange

- Walk in with **WASD**, use the mouse to look, and press **R** to raise your hands. **Capture mouse** gives you continuous mouse look.
- **Left mouse** starts a light action on press. Watch for the partner to draw back its right hand and try a light as the heavy is coming forward. If you intercept, tap light again to try the counter. A clean or guarded light can also open a short combination.
- **Tap and release right mouse** for a heavy. At the default 150 ms boundary, a hold commits to an empty reach and withdrawal. Wheel up tightens your guard and wheel down loosens it.
- **Tab** or **Switch fighter** takes over the other body during the exchange. **Esc** pauses, **Restart** starts a fresh exchange, and **External view** shows the same fight from five angles.
- **Controls / Feel** pauses play while you rebind inputs, adjust thresholds, compare effects or switch to a quiet partner. Export JSON to keep a portable profile. Q, F and Space are reserved.

The two fighters share the same move, guard, coverage, balance and recovery rules. Sparring uses guard and stagger without reducing either fighter's health. Momentum is an optional pressure and shove bonus. The partner reads visible cues through a delayed snapshot.

## Edit and build

The bundled Action Playground v0.3.1 donor is locked under `vendor/`. The independent working copy lives under `game/rc/`. Node and Python are used for development only.

```sh
python -B scripts/verify_packet.py --sources-only
node game/rc/tools/make_hands_scene.cjs
python -B game/rc/source/build_hands_play.py
node tests/acceptance/hands-rules.cjs
```

- `game/rc/source/actor-physical.js` integrates the opt-in actions into the copied ROOM fixed-step runtime.
- `game/rc/source/hands-combat.js` defines shared move timing, reach, guard, Momentum and the sparring provider.
- `game/rc/source/hands-input.js` defines the editable Sketch A profile and gesture adapter. Export shows the current profile in its runtime format.
- `game/rc/hands-assets/hands-art.json` records selected packet cuts and phase bindings.
- `game/rc/examples/First_Encounter_Hands.room.json` is the editable ROOM scene. Its generator sets the arena and starting positions.

Read [the build report](docs/HANDS_BUILD_REPORT.md) for commands, measurements and evidence paths. The architecture and tuning are an initial hands-first slice. Play-feel approval is the owner's call. Prototype artwork attribution and rights limitations are in the asset manifest.
