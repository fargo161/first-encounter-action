# Setup and connections — what is actually ready
**Checked November 16, 2026.** This is a receipt and execution plan, not a promise that a remote task has already been launched.

## Preparation-side status

| Item | Result |
|---|---|
| Linked GitHub identity | `fargo161`, ID 219675997, returned by the active connector |
| FEG/Lab reference branches | Live reads succeeded; exact commits in `config/SOURCE_LOCK.json` |
| Body/BASED/DPA main references | Live branch reads succeeded; pin the listed revisions, not moving `main` |
| New `fargo161/first-encounter-action` lookup | 404; not accessible/confirmed by this connection |
| Repository creation / push from this chat | Not performed; current in-scope GitHub actions are read-only |
| Alternative write capability check | Installed GitHub plugin manifest advertises write operations, but discovery exposed no create/write actions in this session. Advertised capability is not executed capability |
| Container GitHub CLI | `gh` unavailable in preparation; no authenticated publication test |
| Codex browser environment / attachment access | Not inspectable from this chat; must be checked in the actual Cloud task |
| Native Codex workers | Not launched here; role/config files are supplied, not claimed active |
| Source bytes and assets | Included locally, hashed; no need to fetch the original ZIP to begin |
| New game | Not implemented by preparation; the shipped inherited HTML is explicitly old |

The canonical GitHub repos remain read-only references. Do not add six runtime services, a live LLM or an online login screen to the game merely to say the repositories are “connected.”

## Least-friction browser path

Current official Codex documentation permits a Cloud task in a default environment without a repository **when that environment is available**. Start there with the packet. A published repository environment is the fallback if the user's account/interface requires it. This packet does not infer which UI is present from the GitHub connection in ChatGPT.

Codex first verifies it has actual bytes for `config/DONOR_FILE_LOCK.json`, `vendor/.../rc/source/actor-physical.js` and the two tan-hand images. A title, a prior ChatGPT Library reference or a sandbox link alone is insufficient. If attachment transfer failed, the blocker is “packet bytes missing,” not “rebuild the project from memory.” Ask for one file-source/attachment action, not a multi-page environment questionnaire.

## Commands for the coding agent, not work for Teddy

From the extracted packet root:

```bash
python scripts/verify_packet.py
python scripts/doctor.py
python scripts/prepare_workspace.py
python scripts/verify_donor.py
```

The first call verifies the unmodified delivered packet. After implementation begins, use `--sources-only` to verify protected donors/assets without expecting the edited spec or added game files to match the original packet manifest. The setup script is idempotent: it creates `game/rc` once and never overwrites a working copy. It creates the known test-output folder, not a patch to a test assertion.

The baseline is dependency-light: Python and Node are enough to rebuild and run the five focused source files. Prefer the environment's supported Node 24 and Python 3.12 when already available; preparation itself succeeded with Node 22.16.0/Python 3.13.5. Record actual versions rather than claiming an untested canonical toolchain. Use a browser driver available in the Cloud environment; install only an actually needed browser-test dependency during setup and lock it. Play does not need Python/Node.

## New-repository bootstrap

Run `python scripts/bootstrap_repository.py` only from this independent packet/workspace. It verifies the target name, refuses an unrelated enclosing Git checkout, and creates a local review branch. It neither commits nor publishes automatically.

If the target remote is already available to the actual Codex task, inspect it before changing anything. Refuse unrelated content, protect existing history, and use the designated review branch. Never force-push. If no remote is available and an authenticated GitHub CLI or repository tool can create it, create `fargo161/first-encounter-action`; default to a private development workspace without altering any existing repository's visibility. Do not make visibility a new creative decision for Teddy.

The local helper has a `--publish` option for an already staged/reviewed commit when authenticated `gh` is available. It refuses credentials in remote URLs, unknown remotes, uncommitted changes, and a branch different from `codex/hands-first-v0-1`. It does not bypass a service permission or turn a 404 into evidence that the account is authorized. Use native authenticated GitHub actions instead when the environment supplies those. Any remote publication path remains untested in preparation.

Before any commit/push: inspect changed paths and the outgoing content for secrets; preserve source hashes; use the existing Git identity or a clearly identified automation identity. Preserve inherited attribution. Do not claim unknown artwork rights were cleared. Keep watermarked stock reference material out of the generated game.

If creation/push is blocked, record that once and continue the local game build. Deliver the playable/source ZIP even when the remote is pending. Creating or authorizing a Cloud environment is an account action the agent must not falsely report as completed.

## Upstream references

`config/SOURCE_LOCK.json` lists exact revisions. The later Lab review branch is not its `main`. ROOM in the canonical monorepo is not the locally delivered Action Playground. Do not merge the Lab's review branch, change canonical acceptance status or start its paused phases.

Read a pinned upstream file only when its boundary matters; the bundled donor does not need a clone of every repo to render a punch. If a reference is unavailable, document that and preserve the already specified boundary rather than replacing it with invented code.

## Agent team

Use native subagents only after a capability check. Roles are given in `02_CODEX_BUILD_SPEC.md` and optional TOML files. Those TOMLs are a convenience for clients that honor local custom-agent files; they do not provision workers or grant permissions in browser Cloud. The Lead may give the same role text directly to native workers. Without spawning, execute the lanes sequentially with separate evidence; do not call that independent parallel verification.

The Lead alone integrates shared-runtime/host changes. The verifier owns tests and findings, not the production implementation. Maximum four simultaneous roles including Lead. No external agent servers, extra subscriptions, plugin installations or API keys are required by the game.

## Official references

See `06_SOURCE_AND_RESEARCH.md` O1–O4 for current Cloud, environments and subagent documentation. Platform-wide documentation is not proof of this user's environment state.
