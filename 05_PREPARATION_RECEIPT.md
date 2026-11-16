# Preparation receipt — measured, inherited, proposed and still pending
**November 16, 2026. No new hands-game implementation was performed.**

## Actual source intake

| Property | Measured result |
|---|---|
| Uploaded source | `ACTION_PLAYGROUND_PHYSICAL_INTEGRITY_v0_3_1_SOURCE (1)(1).zip` |
| Archive bytes | 268,482,830 |
| Archive entries | 1,081 |
| Uncompressed entry bytes | 353,843,379 |
| SHA-256 | `450d08e5099a6992786a95ed227ac3131c1d0edb12dc81c5f06c8ce80a8a307f` |
| Source identity | v0.3.1, confirmed inside README/build targets, not merely filename |
| Packet donor | 110 exact extracted files; subset, not a replacement historical archive |
| Later versions | v0.3.2/v0.3.3 raw retrieval unavailable; no invented reconstruction |

## Rebuild performed in a disposable source copy

`node tools/make_pressure_scene.cjs`, `python source/build.py`, and `python source/build_pressure_play.py` all exited 0. The scene, ROOM host, and playable matched the inherited bytes exactly.

| File | SHA-256 of shipped and rebuilt result |
|---|---|
| `Room_Creator.html` | `1e36e7d5107a114f187a85dbb7c185fe99347e77c6713e2269f033f65084dba5` |
| `Play_Action_Playground_v0_3_1.html` | `5118b0f00431b765847525f1a6fc711f06f02a2a0252995e64a2e94584183185` |
| `examples/Action_Physical_Proof_v0_3.room.json` | `2a11c97ccab558f40874cc6bf54d9c91caad0312cafc8753f8af49c068840522` |

Commands and comparisons: `evidence/preparation/rebuild.json`. Runtime here: Node 22.16.0, Python 3.13.5. These are measured preparation versions, not a new supported-platform declaration for other repos.

## Focused inherited checks

| File | Observed result |
|---|---|
| `physical.test.js` | 15 PASS lines, exit 0 |
| `edge_cases.test.js` | 9 PASS lines, exit 0 |
| `integration.test.js` | 19 PASS lines, exit 0 |
| `degradation_occupancy_v031.test.js` | 2/2, exit 0 |
| `pressure.test.js` in untouched extracted layout | 28 assertions passed; exit 1 writing a missing `../evidence_v0_3` output directory |
| Same pressure file in scratch with its output directory | 28/28, exit 0; no assertion edited |
| `claude_v0_3_findings.test.js` | Exceeded 15-second timeout; not certified passed |

Evidence lives under `evidence/preparation/`. A broader exploratory sweep did not finish and is not represented as a complete passing suite. No test file was changed to manufacture a pass. The new slice must investigate defects it reaches and retain the unresolved legacy finding separately.

## Browser smoke performed

The exact inherited playable was loaded in headless Chromium with a Canvas fallback. Direct `file://` navigation was blocked by sandbox policy; the smoke used `page.set_content` of those exact bytes. Two actors appeared in the physical state. A real keyboard J event resulted in an accepted light punch and blocked contact. There were no collected page errors and no external HTTP(S) requests during that smoke.

This establishes a bounded old-page startup/input check. It does **not** establish new control behavior, pointer-lock gestures on Windows, native double-click operation, hardware WebGL performance or human enjoyment. See `browser_smoke.json` and `inherited_baseline_smoke.png`.

## Asset preparation performed

Inspected 22 image records / 21 unique images and three clips. Copied originals unchanged. Extracted 38 TH1 + 54 TH2 connected-alpha regions using exact matching source identities and existing seed/rectangle data. Inspected the resulting montage; it includes partial components as well as full hands. No new illustrations, combat animations or completed wrist/contact registrations were created.

## Connection work performed

Read the linked GitHub login and relevant branch refs. Reopened Lab operating instructions. Checked the proposed new repo, which was not accessible/confirmed. Discovered no currently invokable GitHub create/push action, even though the installed plugin's broader metadata lists write capabilities. No account settings, repository, branch, secret, Cloud environment or agent team was created remotely.

## New packet checks

Portable setup/verification scripts, JSON/TOML, source hashes and packaged paths are checked separately in `evidence/preparation/packet_qa.json` when present. Those checks validate this handoff, not the future game. `MANIFEST_SHA256.json` covers delivered files and excludes itself.

**Human acceptance remains: does the first exchange feel deliberate, readable, responsive and worth repeating? Only playing the implemented slice can settle that.**
