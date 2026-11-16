# Asset plan — small vocabulary, all source material retained

## What this packet actually contains

There are **22 inspected still-image records, 21 unique source images** after one byte-identical duplicate of the large hand collage is aliased. All unique originals are copied unchanged into `assets/source/`; `config/ASSET_INTAKE.json` records names, hashes, pixel sizes, alpha ranges and intended use. The three supplied videos and derived review previews are references, not game-ready motion tracks.

The donor's pressure presentation has **164 records**: 131 body records (PLB 54, GNC 42, GNR 35), 23 TH1 hand records and 10 FPW fist/kick records. A database entry does not establish suitability for a new combat pose. The default gunman cannot simply remain frozen with a gun and pass as the new unarmed fighter.

The preparation pass additionally extracted **92 alpha-connected regions: TH1 38 and TH2 54**. They are actual individual PNGs with source rectangles, hashes and seeds in `config/HAND_CUTS.json`. **Some are finger fragments or deliberately cropped partial hands. This is not 92 complete hand poses or 92 animation frames approved for play.** The contact sheet `references/previews/HAND_CUTS_92.jpg` makes that distinction visible.

### Source calibration

| Supplied source | Verified condition | Use |
|---|---|---|
| `w0DngzM(2).png` / TH1 | 594×738; exact manifest source hash | Existing crop metadata valid; 38 regions extracted |
| `z6nxuVr(1).png` / TH2 | 716×703; exact manifest source hash | Existing crop metadata valid; 54 regions extracted |
| `iH9foXw(2).png` / PLB | 756×1044; exact manifest match | Compatible body source; evaluate telegraphs/angles |
| `ShQs6Dx(2).png` / MSK | 1000×1950; exact manifest match | Later armed-body reference; not the initial unarmed default |
| `6Eqwvsr(3).png` / gloved collage | 2048×1526, whereas DHM metadata refers to 2592×1932 | Do not apply old coordinates directly. Resample/recalibrate explicitly, or select new regions by inspection |
| Armored full-body sheet | 840×2048, whereas ARM metadata refers to 900×2193; checkerboard is opaque | Recalibrate and remove background carefully before use; useful unarmed-pose candidate |
| Ten gray hand PNGs | 1254×1254; transparent 2D renders | Shape/anatomy references, not meshes, rig files or automatically retargetable hands |
| Large collage / standalone retro hand sheet | Multiple visual families; visible checkerboard can be baked in | Reference or separately verified extraction; no automatic transparency assumption |
| Gray body pose sheet | JPEG, no alpha | Action silhouettes/reference, not a production animation rig |
| Watermarked hand photograph | Reference-only stock preview | Do not strip watermark or ship as runtime art |

The extraction does not settle anatomical left/right, wrist anchors or striking points. These are explicitly unreviewed in the manifest. Run a pose at actual gameplay scale before approving it. Do not globally erase white, black or magenta pixels just because a sheet uses that background; preserve matching colors inside the art and inspect edges.

## First art pass

Use a coherent bare-hand family rather than a random source change on every punch. TH1/TH2 provide open, reaching, curled and closed shapes; compatible FPW fists already exist. A working first pass can use about **14–20 unique hand drawings**, with pose reuse. This is an effort budget, not a demand to invent 20 moves.

Cover relaxed/raised readiness, loose/tight guard, two light-hand preparations/extensions, heavy preparation/contact/recovery, an interception palm/chop, recoil, and reach/withdrawal. A drawing can serve multiple poses when timing and positioning remain honest. No individually simulated fingers.

First-person and external views need different art but a shared phase/action record. For the opponent, select a coherent full-body donor and supply obvious ready, guard, windup, contact, blocked recoil, stagger and recovery poses. Record directional coverage: F/F3Q/S/R3Q/R. A missing direction may use an explicitly labeled temporary fallback during construction, but rotating around the opponent must not reveal nonsensical final-facing or invisible attack telegraphs.

The supplied armored fighter may be a better unarmed visual starting point than the gunman; select it only after the resized-sheet/background cleanup. The PLB atlas is already calibrated and can provide a quick integration fallback. Do not silently pretend either is a completed universal mannequin.

## Generation is optional, not a blocker

The owner allows new material where necessary. If the execution task has a suitable image-generation tool, use the exact source as a reference for missing poses, then perform the same background/anchor/side QA. If it lacks that tool, use composited existing poses or clearly labeled interim art. Do not promise image-generation capability or invent a download. No runtime image/LLM generation and no new paid asset purchases during this slice.

Keep originals untouched. Record source, transformation, output hash, status and intended move assignment for every derivative. Unknown rights remain unknown in the intake; this packet performs no clearance. That bookkeeping does not delay the mechanical prototype, and it must not be misrepresented as authorization for a later public commercial release.

## What the references contribute

The short first-person sprite clip shows foreground hands as both physical action and gesture. The white-gi clip contributes emphatic stances and weight changes. The HAND 2 HAND recording contributes movement through hazard-filled space. The still concept contributes a clear full-body opponent and legible background. These are observed presentation references, not proof of their hidden game mechanics.

Use the current slice to prove contact and response. Save the stock gesture photograph, firearm/weapon hands, claw horror vocabulary, airborne pose bank and breakdance flourishes for later need rather than forcing every asset into the first fight.
