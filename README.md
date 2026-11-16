# First Encounter — Hands-first Codex packet

**This packet is a prepared source/assets/specification handoff, not the newly implemented game.**

Start with `00_START_HERE.md`. Design: `01_DESIGN_NOTE.md`. Execution: `02_CODEX_BUILD_SPEC.md`. Setup status: `03_SETUP_AND_CONNECTIONS.md`. Assets: `04_ASSET_PLAN.md`. Acceptance: `tests/acceptance/ACCEPTANCE.md`.

The bundled inherited Action Playground v0.3.1 is reproducible. It does not implement the new controls, active parries, independent hand commitments or the final hands-first exchange. It is named and isolated accordingly.

The package contains all unique still-image uploads from this conversation, three supplied videos, verified candidate hand regions (including partial components) and a lean source donor. Unknown source licensing is recorded as provenance, not silently changed into a license claim. Stock watermarked reference material is not a default runtime asset.

Development preparation (inside the extracted packet):

```bash
python scripts/verify_packet.py
python scripts/prepare_workspace.py
python scripts/verify_donor.py
```

These commands verify and copy the donor; they do not implement the new game. The agent then follows the build spec and delivers `dist/Play_First_Encounter_Hands_v0_1.html`.

A fresh remote repository, a published Codex environment and remote write permission have **not** been established by this packet. Source links are locked in `config/SOURCE_LOCK.json`; remote availability is separate from runtime dependency.
