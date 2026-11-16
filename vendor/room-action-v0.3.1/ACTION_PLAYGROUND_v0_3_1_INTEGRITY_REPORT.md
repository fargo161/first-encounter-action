# Action Playground — v0.3.1 Physical-Integrity Repair

**Scope:** Focused repair to the approved v0.3 combat playground. No new enemies, capture features, weapon systems, or tuning decisions.

**Input:** `ACTION_PLAYGROUND_COMBAT_v0_3_SOURCE.zip` (unchanged preserved original) and the owner-supplied `claude_v0_3_findings.test.js`. Branch is a separate working copy. Maintains Room Creator / Three.js, one shared physical actor implementation, existing Vehicle World authority, and the existing proof tile.

## Confirmed issues and repairs

| Claude repro check | v0.3 before | v0.3.1 after | Repair |
|---|---|---|---|
| Resting on another body accumulates fall speed | FAIL | PASS | A physical actor's top may temporarily support another actor; downward blocked movement no longer accumulates gravity indefinitely |
| Stepping off a person leads to lethal stored-velocity fall | FAIL | PASS | Zeroed vertical speed on support; temporary body-top departure retains bounded movement to clear the collision before descending |
| Ordinary forward jump into defender injures the player | FAIL | PASS | Actor contact/support treated consistently with legitimate landing |
| Flying kick on open ground injures the kicker | FAIL | PASS | Same vertical/contact correction, no special-case damage immunity added |
| Broken barrier can trap a bystander standing legally beside it | FAIL | PASS | Broken barricade stubs no longer extend beyond intact depth; generic transition additionally defers if its new collider would overlap an actor |
| Collision variant has greater depth than initial geometry | FAIL | PASS | Authored replacement collision now remains inside intact footprint in the specific practice scene |
| Normal backward walk escapes the band | FAIL | PASS | Distinguish uncommanded support loss from intentional airborne motion; only the former is prevented from acquiring unconstrained movement |
| Seam between floor pieces momentarily drops support | FAIL | PASS | Support footprints use small seam-edge tolerance rather than shrinking every floor panel |
| Ordinary walking exits the authored tile | FAIL | PASS | The rail and support-loss correction prevents the tested walking exploit |

Other safety details: Physical displacement from an intentional jump, throw, or disappearing car support continues to use the airborne path; the first repair attempt was corrected after original edge-case tests exposed two regressions. One new `degradation_occupancy_v031.test.js` verifies that an expanding state collider defers its transition until the space is clear and commits exactly once.

## Executed verification (on current v0.3.1 source)

| Group | Result |
|---|---|
| Claude bug reproduction checks | **9/9 PASS** |
| Original shared-actor physical tests | **15/15 PASS** |
| Actual scene + Vehicle World integration | **19/19 PASS** |
| Original edge-case tests | **9/9 PASS** |
| v0.3 pressure/guard/combat tests | **28/28 PASS** |
| Asset provenance / rebuild tests | **10/10 PASS** |
| New occupied-transition assertions | **2/2 PASS** |
| Selected legacy ROOM / Vehicle World test suites | **9/9 suites PASS** |
| Rebuilt-HTML browser startup checks | **6/6 PASS** |

The generated v0.3.1 HTML boots in Linux headless Chromium (Canvas fallback) when its exact contents are loaded into a page. The browser checks verified two active actors, intact initial barrier, a progressing simulation clock, zero page errors, and zero external HTTP(S) requests. These are smoke checks, not a comprehensive human playthrough or graphics-card acceptance.

**Not run:** Windows double-click `file://` acceptance; WebGL visual/interaction acceptance; physical feel testing. Direct `file://` navigation is restricted in the available managed browser environment. Do not describe this as proof of a fully validated Windows local-file launch.

## Deliberately unresolved gameplay decisions

Claude's four non-failing `DECISION` observations remain open: (1) dangerous flying-kick trajectories can still cause scenery impact injury; (2) deliberate jumps off the authored map can still cause a fall/death; (3) riding a vehicle out of the tile can end in an out-of-tile fall; and (4) car-contact severity can vary with actual throw trajectory and which contact branch first reports impact. No values, immunity, boundary/reset policies, or damage rules were silently changed for these choices.

## Source and build changes

- `source/actor-physical.js`: shared support/vertical-contact handling; floor seams; distinguishing involuntary ground slip from intentional airborne motion; generic occupancy check before environmental state swap.
- `tools/make_pressure_scene.cjs`: specifically authored broken barricade collision stubs constrained within the whole-state footprint (the original example scene remains unchanged).
- `source/build_pressure_play.py`: separate v0.3.1 generated HTML and title.
- `source/ui-physical-proof.js`: updated display version caption only.
- `examples/Action_Physical_Proof_v0_3.room.json`: regenerated test tile with corrected barrier states.
- `tests/action_proof/claude_v0_3_findings.test.js`: exact Claude reproduction tests integrated into the source tree.
- `tests/action_proof/degradation_occupancy_v031.test.js`: additional occupancy regression.
- `Room_Creator.html` and `Play_Action_Playground_v0_3_1.html`: generated outputs, not manually edited.

To rebuild from the `rc/` directory:

```bash
node tools/make_pressure_scene.cjs
python source/build.py
python source/build_pressure_play.py
node tests/action_proof/claude_v0_3_findings.test.js
node tests/action_proof/degradation_occupancy_v031.test.js
```

The existing `ACTION_PLAYGROUND_COMBAT_v0_3_SOURCE.zip` is untouched and is the rollback source. The v0.3.1 source patch is designed for a **copy** of it.
