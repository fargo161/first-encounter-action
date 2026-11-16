# Sources, research and what is being borrowed
**Prepared November 16, 2026.** Current owner instructions in this conversation outrank the superseded prebuild draft. Source observations below are distinguished from design proposals. No external fighting engine was copied into this packet.

## Local evidence

- P1: actual uploaded v0.3.1 archive, exact hash in `05_PREPARATION_RECEIPT.md`.
- P2: source files and original tests under `vendor/room-action-v0.3.1/rc/`; locked by `config/DONOR_FILE_LOCK.json`.
- P3: measured rebuild, focused test outputs and browser smoke in `evidence/preparation/`.
- P4: supplied stills, videos and exact crop metadata, cataloged by `config/ASSET_INTAKE.json` and `config/HAND_CUTS.json`.
- P5: earlier prebuild draft under `docs/history/`, deliberately superseded on controls/player-first language and source availability. It is historical context, not a second current specification.

## Live repository references

Exact commits were checked through the connected GitHub API. They identify inspected references, not proof of an implemented cross-repository runtime bridge or a complete audit of every file.

| Reference | Pinned revision / role |
|---|---|
| [First-Encounter-Game](https://github.com/fargo161/First-Encounter-Game/tree/76a92fd82ac5ec6f10748f0b439a5d661fff5ea5) | Canonical lineage; original remains untouched |
| [FEG accepted economy design branch](https://github.com/fargo161/First-Encounter-Game/tree/cc8371c3c497edcdcfb8a73ec7da9dad4663847a) | Later producer/design context, not a punch dependency |
| [Lab review](https://github.com/fargo161/first-encounter-lab/tree/704ec51d571b05fa93ab17052e0ee07193e04066) | Latest inspected headless review, not main or combat AI |
| [Lab AGENTS](https://github.com/fargo161/first-encounter-lab/blob/704ec51d571b05fa93ab17052e0ee07193e04066/AGENTS.md) | Original authority limits preserved; current owner permission is only for the independent copied game |
| [2D Doll](https://github.com/fargo161/2d-doll/tree/30c8134b75b3a6c28e9b43528d24f0684b77b900) | Pose architecture reference |
| [BASED expression](https://github.com/fargo161/based-expression-foundation/tree/6a839824cd5398497eae6892298b8942a58a275a) | Shared social/face vocabulary reference |
| [DPA foundation](https://github.com/fargo161/dpa-message-foundations-v01/tree/9d38f7c6c1673bf8f421393ba33542d7747a0da5) | Protected message groundwork; unreviewed experimental branches are not silently adopted |

## External technical references

| ID / primary source | Useful idea | Deliberately not inferred or adopted |
|---|---|---|
| T1 [Super KO Boxing](https://github.com/DFchillin/SuperKOBoxing) | Per-hand commitment/recovery, data-defined combinations and contact events | Not a first-person framework; do not import random hit/knockdown rolls or its stamina economy into precision parries |
| T2 [Shoto Fighter](https://github.com/aminRX/shoto-fighter-godot) | Distinct recovery, hitstun/blockstun, input buffering and legal continuations | No engine migration and no claim its systems are already in ROOM |
| T3 [Framitor](https://github.com/0xEvsky/Godot-Framitor) | Inspectable move-phase authoring | A documented/stored field does not prove an effect is executed; animation must not become gameplay authority |
| T4 [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) | User activation, capture failure and escape/re-entry handling | Automated load is not proof of real Windows mouse ergonomics |

These are references for implementation patterns, not adopted code dependencies. Code reuse, if later selected, must carry its actual origin and applicable notices; the handoff does not assert a license it did not verify.

## Current Codex workflow references

- O1 [Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud): Cloud executes in its prepared workspace; account/environment access must be verified there.
- O2 [Codex Cloud guide](https://learn.chatgpt.com/docs/cloud): default no-repository environment is available conditionally; do not assume the user's interface has it.
- O3 [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments): environment setup, task work and publication are separate; source and service access are environment-dependent.
- O4 [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): role delegation/custom-agent support is client-dependent; optional files are not launched workers or independent permission grants.

No Cloud environment settings were inspected or changed by web research. Official product documentation establishes supported workflows, not current user-specific connection state.

## Our proposal, not a source claim

The prototype's move timings, guard values, light-interception rule, Momentum gains, stance profile, simple warehouse dimensions and three-worker split are proposed starting choices. The user explicitly wants reversible experiments. Store those choices as data, test them, and report what changes. No source or passing test can certify that they are the most fun possible values.
