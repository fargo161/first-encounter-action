# 11 · First-person hands, weapons and kicks

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

Everything drawn from the player's own eyes: seven hand and weapon sources. `HS` and `E11` are loose files and need no cutting. The four sheets need cutting by the tables here.

**Skin tone check (median colour of skin pixels).** `TH1` and `TH2` rgb(148,92,60) match the player body `PLB` rgb(140,88,56). `HS` is much paler rgb(231,155,107). `FPW` bare fists rgb(176,136,96). `DHM` arms rgb(174,113,70). To make `HS` match the tan hands, multiply its colours by about (0.64, 0.59, 0.56).

## Which source for which job (v1.1 player verbs)

The design document gives the player six verbs: punch, kick, grab, throw, jump and slime. He has **no gun and no fireball**.

| job | first choice | second choice | why |
|---|---|---|---|
| Resting hands | `TH1.f19`, `TH1.f20` (back of fist) |  | Tan skin matches the player. |
| Punch | `TH1.f14`, `TH1.f33`, `TH1.f34` | `FPW.fist_side.1..3`, `FPW.fist_front.1..3` | `FPW` has true 3-frame punches but paler skin. |
| Kick | `FPW.kick.1..3` | `DHM.f357`, `f368`, `f377`, `f378` | Neither matches the barefoot player (jeans and boot; green trousers and boot). Stand-in only. |
| Grab: reach and close | `TH1.f09` → `TH1.f10` | `DHM.f224`, `f235`, `f262`, `f245` | `TH1.f10` is a long lunging reach. |
| Hold and carry | `TH1.f21` (fist gripping, thumb on top), `TH2.f04` (hand gripping) | `DHM.f385` (two open hands) | **No frame shows hands holding a person.** One or two gripping fists at the bottom corners of the screen is the best the set can do. |
| Throw: release | `TH1.f11`, `f12`, `f13` (open palm) | `FPW.openhand` | `FPW.openhand` was drawn as a hand that has just thrown something. |
| Slime: spray | `TH1.f06`, `TH1.f07` (claw, fingers spread) or `TH1.f11..13` (open palm), with a slime effect leaving the hand | `HS.pistolidle` → `HS.pistolfire1..3` with the flash tinted slime green | No slime-specific hand exists. `HS` is the only hand with a drawn flash at the fingertip. |
| Jump | none needed |  | First person: the camera does the work. |
| Not a player verb in v1.1 | `HS` as a fire shot, `E11`, `FPW.pistol_*`, `shotgun_*`, `rifle`, `rpg`, `devastator`, `energygun` |  | Kept in the manifest in case a picked-up weapon or a change of design needs them. The design document reserves energy weapons for enemies later. |

---

## HS · HandSprites (loose files, ready to use)

Archive `HandSprites.zip`, folder `HandSprites/`. Pale finger-gun hand. Hand frames are 120×222, effect frames 100×144, transparent. `content box` = where the drawing sits inside the file (x, y, w, h). All hand frames share one canvas, so draw them at the same screen position and they line up.

| id | file | size | content box | shows |
|---|---|---|---|---|
| `HS.pistolidle` | `HandSprites/Pistolidle.png` | 120×222 | 20,91,100,131 | single shot: hand at rest, finger pointing forward |
| `HS.pistolfire1` | `HandSprites/Pistolfire1.png` | 120×222 | 4,7,115,215 | single shot: large flash at fingertip |
| `HS.pistolfire2` | `HandSprites/Pistolfire2.png` | 120×222 | 13,15,106,207 | single shot: smaller flash |
| `HS.pistolfire3` | `HandSprites/Pistolfire3.png` | 120×222 | 22,38,97,184 | single shot: finger raised, no flash (recoil) |
| `HS.rapidlidle` | `HandSprites/rapidlidle.png` | 120×222 | 24,92,96,130 | rapid fire: at rest (file name really is `rapidlidle`) |
| `HS.rapidfire1` | `HandSprites/rapidfire1.png` | 120×222 | 21,17,99,205 | rapid fire: flash |
| `HS.rapidfire2` | `HandSprites/rapidfire2.png` | 120×222 | 21,23,99,199 | rapid fire: smaller flash |
| `HS.rapidfire3` | `HandSprites/rapidfire3.png` | 120×222 | 21,37,99,185 | rapid fire: no flash |
| `HS.strongidle` | `HandSprites/strongidle.png` | 120×222 | 24,79,96,143 | charged shot: fist with middle finger raised |
| `HS.strongcharge` | `HandSprites/strongcharge.png` | 120×222 | 21,115,98,107 | charged shot: closed fist, winding up |
| `HS.strongfire` | `HandSprites/strongfire.png` | 120×222 | 23,75,97,147 | charged shot: release |
| `HS.strongfire2` | `HandSprites/strongfire2.png` | 120×222 | 23,75,97,147 | charged shot: release, darker second frame |
| `HS.projectile` | `HandSprites/projectile.png` | 100×144 | 12,22,78,113 | the flying shot: a glowing red-orange copy of the raised-finger fist |
| `HS.explosion2` | `HandSprites/Explosion2.png` | 100×144 | 20,46,61,57 | explosion, small (play this one first, then the large one, or reverse to shrink) |
| `HS.explosion1` | `HandSprites/Explosion1.png` | 100×144 | 0,26,100,97 | explosion, large |

---

## TH1 · Tan first-person hands A (claws, palms, fists)

File `w0DngzM.png` (594×738), transparent. Preview `previews/TH1_numbered.png`. Dark tan hands that match the player. 38 pieces. **Pieces are packed so tightly that their rectangles overlap.** Cut each one by its connected region starting from the seed point (method C), not by rectangle. Descriptions are by eye from the preview; check the preview before relying on one.

| id | # | x | y | w | h | seed x,y | shows |
|---|---|---|---|---|---|---|---|
| `TH1.f01` | 1 | 0 | 0 | 60 | 116 | 31,67 | one finger raised, back of hand, step 1 of 5 |
| `TH1.f02` | 2 | 74 | 5 | 60 | 111 | 105,68 | finger raised, step 2 |
| `TH1.f03` | 3 | 147 | 22 | 60 | 94 | 178,71 | finger curling, step 3 |
| `TH1.f04` | 4 | 218 | 22 | 60 | 94 | 249,72 | finger nearly closed, step 4 |
| `TH1.f05` | 5 | 292 | 31 | 66 | 85 | 327,78 | closed fist, back of hand, step 5 |
| `TH1.f06` | 6 | 10 | 126 | 100 | 130 | 58,196 | claw, fingers spread, A |
| `TH1.f07` | 7 | 100 | 129 | 90 | 127 | 139,196 | claw, fingers spread, B |
| `TH1.f08` | 8 | 203 | 138 | 81 | 118 | 236,202 | claw seen side-on |
| `TH1.f09` | 9 | 265 | 145 | 120 | 111 | 328,206 | claw reaching forward |
| `TH1.f10` | 10 | 344 | 164 | 250 | 92 | 485,217 | long forearm lunging in from the right, claw open |
| `TH1.f11` | 11 | 0 | 302 | 104 | 100 | 42,356 | open palm facing up, A |
| `TH1.f12` | 12 | 102 | 313 | 94 | 89 | 145,361 | open palm facing up, B (lower) |
| `TH1.f13` | 13 | 196 | 275 | 130 | 127 | 248,344 | open palm with forearm, C (largest) |
| `TH1.f14` | 14 | 301 | 270 | 120 | 132 | 355,338 | clenched fist with forearm |
| `TH1.f15` | 15 | 0 | 427 | 68 | 90 | 38,477 | hand edge-on, thumb side |
| `TH1.f16` | 16 | 75 | 450 | 10 | 33 | 80,466 | three loose fingertips (belongs with f17) |
| `TH1.f17` | 17 | 80 | 427 | 96 | 90 | 127,479 | hand reaching, fingers apart from palm |
| `TH1.f18` | 18 | 175 | 443 | 71 | 74 | 215,485 | hand edge-on, hooked |
| `TH1.f19` | 19 | 261 | 427 | 55 | 90 | 288,475 | back of fist, A |
| `TH1.f20` | 20 | 328 | 427 | 57 | 91 | 356,474 | back of fist, B (larger) |
| `TH1.f21` | 21 | 393 | 424 | 56 | 93 | 422,476 | fist gripping, thumb on top |
| `TH1.f22` | 22 | 526 | 446 | 64 | 71 | 556,482 | fist, knuckles forward |
| `TH1.f23` | 23 | 460 | 453 | 59 | 64 | 487,489 | fist with thumb, small |
| `TH1.f24` | 24 | 0 | 532 | 101 | 102 | 65,597 | thumbs-up, arm from lower left |
| `TH1.f25` | 25 | 89 | 521 | 122 | 113 | 160,587 | pointing finger and thumb (finger-gun), arm from lower left |
| `TH1.f26` | 26 | 211 | 578 | 82 | 56 | 254,608 | knuckles close-up, large |
| `TH1.f27` | 27 | 316 | 588 | 52 | 18 | 343,596 | row of four knuckles (fragment) |
| `TH1.f28` | 28 | 399 | 578 | 34 | 40 | 414,602 | small fist |
| `TH1.f29` | 29 | 442 | 575 | 70 | 59 | 472,603 | bent arm with fist, elbow raised |
| `TH1.f30` | 30 | 529 | 591 | 61 | 15 | 559,600 | hand edge (fragment) |
| `TH1.f31` | 31 | 92 | 676 | 38 | 62 | 104,714 | dark spike, tall, A |
| `TH1.f32` | 32 | 138 | 668 | 28 | 70 | 152,709 | dark spike, tall, B |
| `TH1.f33` | 33 | 179 | 653 | 74 | 85 | 206,702 | forearm and fist rising up-left, A |
| `TH1.f34` | 34 | 234 | 646 | 107 | 92 | 276,701 | forearm and fist rising up-left, B |
| `TH1.f35` | 35 | 331 | 662 | 125 | 76 | 386,702 | arm coming down from top right, A |
| `TH1.f36` | 36 | 446 | 661 | 102 | 54 | 488,690 | arm coming down from top right, B |
| `TH1.f37` | 37 | 24 | 702 | 26 | 36 | 36,724 | dark spike, short, A |
| `TH1.f38` | 38 | 57 | 702 | 26 | 36 | 69,724 | dark spike, short, B |

---

## TH2 · Tan first-person hands B (thumbs, fists, forearms)

File `z6nxuVr.png` (716×703), transparent. Preview `previews/TH2_numbered.png`. More of the same hands, mostly thumb close-ups and forearms. 54 pieces. Lower value than `TH1`: use `f01-f03` (fist toward screen), `f23-f26` (back-hand sweep), `f48-f54` (forearm with fist or thumbs-up). Same overlap warning: cut by seed.

| id | # | x | y | w | h | seed x,y | shows |
|---|---|---|---|---|---|---|---|
| `TH2.f01` | 1 | 0 | 40 | 80 | 66 | 34,73 | fist, thumb side, small |
| `TH2.f02` | 2 | 78 | 37 | 70 | 70 | 109,71 | fist, thumb side, medium |
| `TH2.f03` | 3 | 148 | 23 | 76 | 84 | 179,66 | fist, thumb side, large |
| `TH2.f04` | 4 | 238 | 23 | 62 | 83 | 266,67 | hand gripping, fingers curled over |
| `TH2.f05` | 5 | 311 | 27 | 72 | 80 | 343,70 | fist with fingers showing |
| `TH2.f06` | 6 | 383 | 42 | 12 | 28 | 388,54 | finger fragment (belongs with f07) |
| `TH2.f07` | 7 | 396 | 0 | 63 | 107 | 422,65 | tall thumbs-up fist |
| `TH2.f08` | 8 | 463 | 12 | 76 | 95 | 494,65 | fist, fingers lower left |
| `TH2.f09` | 9 | 388 | 23 | 8 | 14 | 392,29 | fingertip fragment |
| `TH2.f10` | 10 | 0 | 131 | 107 | 76 | 44,172 | forearm with hand folded back, 1 of 4 |
| `TH2.f11` | 11 | 102 | 129 | 105 | 78 | 144,173 | forearm, hand folded, 2 |
| `TH2.f12` | 12 | 191 | 118 | 87 | 89 | 229,168 | forearm, hand folded, 3 |
| `TH2.f13` | 13 | 270 | 118 | 106 | 88 | 314,165 | forearm, hand folded, 4 (largest) |
| `TH2.f14` | 14 | 0 | 222 | 68 | 76 | 42,270 | thumb close-up, large |
| `TH2.f15` | 15 | 108 | 237 | 63 | 62 | 145,274 | thumb pad |
| `TH2.f16` | 16 | 188 | 240 | 66 | 59 | 227,275 | thumb knuckle |
| `TH2.f17` | 17 | 271 | 224 | 43 | 75 | 298,272 | fingertip, tall |
| `TH2.f18` | 18 | 356 | 274 | 56 | 25 | 380,290 | thumb tip, small, A |
| `TH2.f19` | 19 | 433 | 274 | 36 | 25 | 449,288 | thumb tip, small, B |
| `TH2.f20` | 20 | 483 | 265 | 113 | 34 | 540,282 | finger lying flat, pointing right |
| `TH2.f21` | 21 | 83 | 224 | 19 | 24 | 94,234 | finger fragment |
| `TH2.f22` | 22 | 339 | 228 | 14 | 37 | 347,243 | finger fragment |
| `TH2.f23` | 23 | 0 | 315 | 88 | 87 | 40,364 | back of hand, thumb out left, 1 of 4 |
| `TH2.f24` | 24 | 72 | 315 | 88 | 87 | 112,364 | back of hand, 2 |
| `TH2.f25` | 25 | 151 | 315 | 88 | 87 | 191,364 | back of hand, 3 |
| `TH2.f26` | 26 | 227 | 327 | 87 | 75 | 267,366 | back of hand, 4 |
| `TH2.f27` | 27 | 309 | 317 | 72 | 86 | 343,361 | back of fist with veins |
| `TH2.f28` | 28 | 0 | 423 | 47 | 62 | 30,461 | thumb, tall, A |
| `TH2.f29` | 29 | 49 | 464 | 46 | 21 | 67,477 | thumb tip, low, A |
| `TH2.f30` | 30 | 117 | 419 | 60 | 65 | 154,461 | thumb, tall, B |
| `TH2.f31` | 31 | 203 | 463 | 45 | 21 | 221,476 | thumb tip, low, B |
| `TH2.f32` | 32 | 267 | 432 | 57 | 53 | 298,463 | thumb knuckle, A |
| `TH2.f33` | 33 | 343 | 463 | 32 | 22 | 359,475 | thumb tip, low, C |
| `TH2.f34` | 34 | 385 | 435 | 55 | 50 | 418,464 | thumb knuckle, B |
| `TH2.f35` | 35 | 459 | 416 | 144 | 69 | 523,465 ; 526,431 | finger-gun pieces (several loose parts) |
| `TH2.f36` | 36 | 615 | 402 | 101 | 83 | 665,459 | large pointing finger, lower right |
| `TH2.f37` | 37 | 61 | 422 | 17 | 27 | 70,432 | fingertip fragment |
| `TH2.f38` | 38 | 186 | 422 | 17 | 23 | 195,431 | fingertip fragment |
| `TH2.f39` | 39 | 704 | 420 | 10 | 20 | 709,429 | fingertip fragment |
| `TH2.f40` | 40 | 0 | 522 | 40 | 68 | 25,563 | thumb upright, A |
| `TH2.f41` | 41 | 96 | 522 | 40 | 68 | 121,562 | thumb upright, B |
| `TH2.f42` | 42 | 194 | 522 | 53 | 67 | 216,565 | thumb bent |
| `TH2.f43` | 43 | 264 | 528 | 53 | 61 | 287,564 | thumb curled |
| `TH2.f44` | 44 | 62 | 525 | 18 | 27 | 72,536 | fragment |
| `TH2.f45` | 45 | 159 | 525 | 17 | 23 | 168,535 | fragment |
| `TH2.f46` | 46 | 334 | 496 | 72 | 93 | 372,556 | thumbs-up from fist, A |
| `TH2.f47` | 47 | 404 | 500 | 83 | 90 | 450,558 | thumbs-up from fist, B |
| `TH2.f48` | 48 | 0 | 636 | 103 | 66 | 61,672 | forearm from lower left, fist, 1 of 7 |
| `TH2.f49` | 49 | 90 | 600 | 111 | 102 | 156,664 | forearm, thumbs-up, 2 |
| `TH2.f50` | 50 | 177 | 609 | 108 | 93 | 244,663 | forearm, fist closing, 3 |
| `TH2.f51` | 51 | 267 | 621 | 109 | 81 | 330,663 | forearm, fist, 4 |
| `TH2.f52` | 52 | 358 | 608 | 117 | 94 | 426,666 | forearm, thumbs-up, 5 |
| `TH2.f53` | 53 | 457 | 608 | 110 | 95 | 520,670 | forearm, thumbs-up with fingers open, 6 |
| `TH2.f54` | 54 | 556 | 634 | 98 | 68 | 615,673 | forearm, fist reaching, 7 |

---

## FPW · First-person weapons, kick, fists, pickups (one sheet)

File `140567.png` (815×1064), transparent. Preview `previews/FPW_numbered.png`. Pieces are well separated, so plain rectangle cuts work. Numbers 1-55 are the hand and weapon frames; 101-138 are the small icons at the bottom of the sheet.

| set | frames | shows |
|---|---|---|
| `FPW.kick` | 3 | knee raised (jeans) … leg extended, boot up |
| `FPW.pistol_black` | 3 | held, idle … firing, flash B |
| `FPW.pistol_grey` | 3 | held, idle … held, lighter shade |
| `FPW.pistol_gold` | 3 | held, idle … held, narrower view |
| `FPW.shotgun_a` | 8 | aim, idle … ejected shell (separate small sprite) |
| `FPW.shotgun_b` | 8 | aim, idle … ejected shell (separate small sprite) |
| `FPW.rifle` | 3 | held, idle … firing, flash B |
| `FPW.detonator` | 3 | hand with striped detonator, thumb up … pressed (small) |
| `FPW.pipebomb` | 1 | hand holding striped pipe bomb |
| `FPW.openhand` | 1 | open hand, palm up, after throwing |
| `FPW.fist_side` | 3 | bare fist swinging in from right, 1 … bare fist, 3 (furthest) |
| `FPW.fist_front` | 3 | bare fist toward screen, large … small (far) |
| `FPW.rpg` | 3 | launcher held, idle … firing, flash B |
| `FPW.devastator` | 5 | two-handed gun with yellow lights, frame 1 … two-handed gun with yellow lights, frame 5 |
| `FPW.energygun` | 5 | yellow gun seen side-on, idle … firing 4 (sparks) |
| `FPW.pickup` | 8 | gold pistol … pipe bomb |
| `FPW.ammo` | 10 | pistol magazine … pipe bomb case |
| `FPW.projectile` | 9 | spark, front view … rocket, side 6 |
| `FPW.energy` | 11 | yellow-green starburst 1 … impact oval, thin sliver |

| id | # | x | y | w | h | seed x,y | shows |
|---|---|---|---|---|---|---|---|
| `FPW.kick.1` | 1 | 3 | 75 | 72 | 28 | 39,91 | knee raised (jeans) |
| `FPW.kick.2` | 2 | 93 | 58 | 113 | 45 | 148,83 | knee and boot |
| `FPW.kick.3` | 3 | 221 | 0 | 65 | 103 | 258,61 | leg extended, boot up |
| `FPW.pistol_black.1` | 4 | 326 | 43 | 54 | 60 | 348,76 | held, idle |
| `FPW.pistol_black.2` | 5 | 400 | 31 | 62 | 72 | 427,71 | firing, flash A |
| `FPW.pistol_black.3` | 6 | 483 | 31 | 53 | 72 | 507,72 | firing, flash B |
| `FPW.pistol_grey.1` | 7 | 12 | 144 | 52 | 65 | 38,181 | held, idle |
| `FPW.pistol_grey.2` | 8 | 82 | 137 | 62 | 72 | 115,178 | firing, flash |
| `FPW.pistol_grey.3` | 9 | 169 | 147 | 47 | 62 | 192,183 | held, lighter shade |
| `FPW.pistol_gold.1` | 10 | 251 | 144 | 52 | 65 | 277,181 | held, idle |
| `FPW.pistol_gold.2` | 11 | 325 | 137 | 62 | 72 | 358,178 | firing, flash |
| `FPW.pistol_gold.3` | 12 | 412 | 147 | 47 | 62 | 435,183 | held, narrower view |
| `FPW.shotgun_a.1` | 13 | 14 | 273 | 76 | 58 | 49,309 | aim, idle |
| `FPW.shotgun_a.2` | 14 | 115 | 267 | 75 | 64 | 149,307 | firing, small flash |
| `FPW.shotgun_a.3` | 15 | 210 | 276 | 68 | 55 | 238,309 | firing, large flash |
| `FPW.shotgun_a.4` | 16 | 298 | 234 | 85 | 97 | 338,295 | pump 1: gun rising |
| `FPW.shotgun_a.5` | 17 | 398 | 234 | 113 | 97 | 456,294 | pump 2: hand on slide |
| `FPW.shotgun_a.6` | 18 | 528 | 203 | 117 | 128 | 589,281 | pump 3: slide back, gun high |
| `FPW.shotgun_a.7` | 19 | 663 | 213 | 98 | 118 | 713,290 | pump 4: shell ejecting |
| `FPW.shotgun_a.8` | 20 | 764 | 277 | 13 | 26 | 770,290 | ejected shell (separate small sprite) |
| `FPW.shotgun_b.1` | 21 | 16 | 408 | 78 | 59 | 51,442 | aim, idle |
| `FPW.shotgun_b.2` | 22 | 110 | 402 | 78 | 65 | 144,440 | firing, small flash |
| `FPW.shotgun_b.3` | 23 | 203 | 412 | 76 | 55 | 236,443 | firing, large flash |
| `FPW.shotgun_b.4` | 24 | 297 | 373 | 92 | 94 | 340,430 | pump 1 |
| `FPW.shotgun_b.5` | 25 | 398 | 368 | 113 | 99 | 457,429 | pump 2 |
| `FPW.shotgun_b.6` | 26 | 535 | 339 | 123 | 128 | 599,416 | pump 3 |
| `FPW.shotgun_b.7` | 27 | 672 | 348 | 103 | 119 | 724,424 | pump 4 |
| `FPW.shotgun_b.8` | 28 | 773 | 411 | 13 | 26 | 779,424 | ejected shell (separate small sprite) |
| `FPW.rifle.1` | 29 | 19 | 506 | 104 | 69 | 54,555 | held, idle |
| `FPW.rifle.2` | 30 | 131 | 502 | 131 | 73 | 188,552 | firing, flash A |
| `FPW.rifle.3` | 31 | 282 | 504 | 119 | 71 | 329,553 | firing, flash B |
| `FPW.detonator.1` | 32 | 444 | 523 | 40 | 53 | 461,551 | hand with striped detonator, thumb up |
| `FPW.detonator.2` | 33 | 498 | 536 | 36 | 40 | 514,556 | thumb pressing |
| `FPW.detonator.3` | 34 | 551 | 552 | 29 | 24 | 564,564 | pressed (small) |
| `FPW.pipebomb` | 35 | 598 | 521 | 108 | 56 | 648,549 | hand holding striped pipe bomb |
| `FPW.openhand` | 36 | 713 | 512 | 101 | 65 | 756,549 | open hand, palm up, after throwing |
| `FPW.fist_side.1` | 37 | 66 | 599 | 79 | 43 | 116,624 | bare fist swinging in from right, 1 |
| `FPW.fist_side.2` | 38 | 157 | 602 | 72 | 40 | 204,625 | bare fist, 2 |
| `FPW.fist_side.3` | 39 | 242 | 598 | 87 | 44 | 299,624 | bare fist, 3 (furthest) |
| `FPW.fist_front.1` | 40 | 444 | 594 | 67 | 48 | 472,621 | bare fist toward screen, large |
| `FPW.fist_front.2` | 41 | 526 | 606 | 51 | 36 | 550,627 | medium |
| `FPW.fist_front.3` | 42 | 604 | 618 | 48 | 24 | 628,633 | small (far) |
| `FPW.rpg.1` | 43 | 21 | 666 | 164 | 64 | 117,704 | launcher held, idle |
| `FPW.rpg.2` | 44 | 207 | 655 | 164 | 75 | 302,702 | firing, flash A |
| `FPW.rpg.3` | 45 | 394 | 659 | 164 | 71 | 489,703 | firing, flash B |
| `FPW.devastator.1` | 46 | 20 | 768 | 126 | 47 | 81,796 | two-handed gun with yellow lights, frame 1 |
| `FPW.devastator.2` | 47 | 174 | 767 | 126 | 47 | 235,795 | two-handed gun with yellow lights, frame 2 |
| `FPW.devastator.3` | 48 | 326 | 767 | 126 | 47 | 387,795 | two-handed gun with yellow lights, frame 3 |
| `FPW.devastator.4` | 49 | 484 | 767 | 126 | 47 | 545,795 | two-handed gun with yellow lights, frame 4 |
| `FPW.devastator.5` | 50 | 638 | 766 | 126 | 47 | 699,794 | two-handed gun with yellow lights, frame 5 |
| `FPW.energygun.1` | 51 | 20 | 852 | 95 | 41 | 68,876 | yellow gun seen side-on, idle |
| `FPW.energygun.2` | 52 | 143 | 856 | 142 | 37 | 218,877 | yellow gun firing 1 |
| `FPW.energygun.3` | 53 | 303 | 850 | 142 | 42 | 378,875 | firing 2 (sparks) |
| `FPW.energygun.4` | 54 | 463 | 850 | 142 | 42 | 537,875 | firing 3 (sparks) |
| `FPW.energygun.5` | 55 | 622 | 849 | 142 | 43 | 697,876 | firing 4 (sparks) |
| `FPW.pickup.1` | 101 | 33 | 910 | 32 | 24 | 51,920 | gold pistol |
| `FPW.pickup.2` | 102 | 70 | 916 | 64 | 18 | 99,922 | shotgun |
| `FPW.pickup.3` | 103 | 140 | 913 | 64 | 21 | 173,920 | shotgun (second view) |
| `FPW.pickup.4` | 104 | 211 | 913 | 63 | 23 | 239,921 | submachine gun |
| `FPW.pickup.5` | 105 | 279 | 916 | 58 | 18 | 307,924 | rocket launcher |
| `FPW.pickup.6` | 106 | 340 | 914 | 64 | 20 | 372,922 | heavy gun |
| `FPW.pickup.7` | 107 | 410 | 913 | 53 | 20 | 435,924 | yellow energy gun |
| `FPW.pickup.8` | 108 | 469 | 920 | 24 | 11 | 480,925 | pipe bomb |
| `FPW.ammo.1` | 109 | 48 | 945 | 15 | 27 | 55,958 | pistol magazine |
| `FPW.ammo.2` | 110 | 71 | 948 | 30 | 26 | 83,961 | shotgun shells |
| `FPW.ammo.3` | 111 | 108 | 944 | 30 | 32 | 123,960 | ammo box A |
| `FPW.ammo.4` | 112 | 144 | 944 | 29 | 30 | 157,959 | ammo box B |
| `FPW.ammo.5` | 113 | 177 | 944 | 29 | 30 | 190,959 | ammo box C |
| `FPW.ammo.6` | 114 | 210 | 935 | 63 | 41 | 239,960 | rocket bundle |
| `FPW.ammo.7` | 115 | 278 | 941 | 38 | 37 | 298,960 | yellow crystal ammo A |
| `FPW.ammo.8` | 116 | 324 | 938 | 38 | 40 | 344,960 | yellow crystal ammo B |
| `FPW.ammo.9` | 117 | 371 | 941 | 38 | 37 | 391,960 | yellow crystal ammo C |
| `FPW.ammo.10` | 118 | 415 | 944 | 52 | 33 | 441,961 | pipe bomb case |
| `FPW.projectile.1` | 119 | 51 | 983 | 16 | 16 | 59,990 | spark, front view |
| `FPW.projectile.2` | 120 | 75 | 985 | 17 | 14 | 83,992 | grey ball, front view |
| `FPW.projectile.3` | 121 | 102 | 986 | 29 | 11 | 116,991 | rocket, side 1 |
| `FPW.projectile.4` | 122 | 134 | 986 | 64 | 11 | 168,991 | rocket, side 2 (long, with trail) |
| `FPW.projectile.5` | 123 | 202 | 986 | 25 | 11 | 213,991 | rocket, side 3 |
| `FPW.projectile.6` | 124 | 240 | 985 | 15 | 14 | 247,992 | spark, front view B |
| `FPW.projectile.7` | 125 | 269 | 986 | 25 | 11 | 282,991 | rocket, side 4 |
| `FPW.projectile.8` | 126 | 298 | 986 | 64 | 11 | 327,991 | rocket, side 5 (long, with trail) |
| `FPW.projectile.9` | 127 | 365 | 986 | 29 | 11 | 379,991 | rocket, side 6 |
| `FPW.energy.1` | 128 | 44 | 1019 | 32 | 27 | 59,1033 | yellow-green starburst 1 |
| `FPW.energy.2` | 129 | 79 | 1017 | 30 | 29 | 93,1033 | yellow-green starburst 2 |
| `FPW.energy.3` | 130 | 114 | 1016 | 27 | 32 |  | yellow-green starburst 3 |
| `FPW.energy.4` | 131 | 143 | 1016 | 32 | 32 |  | yellow-green starburst 4 |
| `FPW.energy.5` | 132 | 178 | 1017 | 30 | 29 | 192,1033 | yellow-green starburst 5 |
| `FPW.energy.6` | 133 | 213 | 1016 | 27 | 32 | 225,1031 | yellow-green starburst 6 |
| `FPW.energy.7` | 134 | 244 | 1021 | 30 | 23 | 258,1032 | yellow-green starburst 7 |
| `FPW.energy.8` | 135 | 281 | 1016 | 20 | 31 | 291,1031 | impact oval, small |
| `FPW.energy.9` | 136 | 310 | 1000 | 28 | 63 | 323,1031 | impact oval, large |
| `FPW.energy.10` | 137 | 350 | 1005 | 13 | 54 | 356,1032 | impact oval, narrowing |
| `FPW.energy.11` | 138 | 387 | 1012 | 6 | 41 | 390,1031 | impact oval, thin sliver |

---

## DHM · Black-gloved first-person hands, mega sheet (388 pieces, plus boot kick)

File `6Eqwvsr.png` (2592×1932), transparent. Preview `previews/DHM_numbered.png`. A scrapbook of 388 loose pieces, many overlapping. **Cut by seed.** The 69 pieces below have been identified (two of them as not art); the complete list with rectangles and seeds is in `91_DHM_ALL_FRAMES.md`. Black gloves do not match the tan player; the main reasons to use this sheet are the **boot kick** and the **two-hand** frames.

| id | # | x | y | w | h | seed x,y | shows |
|---|---|---|---|---|---|---|---|
| `DHM.f235` | 235 | 1936 | 1126 | 214 | 115 | 2059,1194 | GRAB from the left, 2 |
| `DHM.f262` | 262 | 1934 | 1247 | 211 | 116 | 2055,1314 | GRAB from the left, 3 |
| `DHM.f245` | 245 | 2157 | 1238 | 188 | 110 | 2263,1296 | GRAB from the left, 4 |
| `DHM.f224` | 224 | 1936 | 1054 | 186 | 65 | 2048,1092 | GRAB from the left, hand closing, 1 |
| `DHM.f307` | 307 | 300 | 1424 | 188 | 148 | 406,1504 | GRAB reaching toward upper left, 1 |
| `DHM.f330` | 330 | 317 | 1578 | 167 | 114 | 412,1621 | GRAB reaching, 2 |
| `DHM.f363` | 363 | 300 | 1692 | 194 | 117 | 412,1735 | GRAB reaching, 3 |
| `DHM.f357` | 357 | 1939 | 1667 | 96 | 38 | 1990,1689 | KICK 1: knee up (green trousers) |
| `DHM.f368` | 368 | 1950 | 1722 | 154 | 65 | 2026,1758 | KICK 2: knee with boot sole showing |
| `DHM.f377` | 377 | 2114 | 1749 | 153 | 58 | 2185,1785 | KICK 3: leg extending, boot sole |
| `DHM.f378` | 378 | 2270 | 1738 | 89 | 137 | 2320,1820 | KICK 4: boot fully extended, upright |
| `DHM.f308` | 308 | 1289 | 1346 | 170 | 303 | 1422,1394 ; 1402,1486 | NOT ART: outlined label box around a shotgun |
| `DHM.f001` | 1 | 340 | 4 | 47 | 26 | 377,9 ; 344,9 | NOT ART: piece of the title text |
| `DHM.f122` | 122 | 529 | 610 | 80 | 41 | 573,636 | PUNCH bare fist with knuckle-duster, 1 |
| `DHM.f121` | 121 | 421 | 618 | 80 | 31 | 465,635 | PUNCH bare fist, 1 (small) |
| `DHM.f134` | 134 | 388 | 668 | 107 | 51 | 449,697 | PUNCH bare fist, 2 |
| `DHM.f143` | 143 | 319 | 727 | 143 | 76 | 397,767 | PUNCH bare fist, 3 (largest) |
| `DHM.f042` | 42 | 545 | 156 | 83 | 66 | 582,191 | PUNCH gloved, 2 |
| `DHM.f003` | 3 | 429 | 42 | 146 | 95 | 491,93 | PUNCH gloved, 3 (largest, with forearm) |
| `DHM.f076` | 76 | 1383 | 321 | 139 | 91 | 1453,367 | PUNCH gloved, arm from right, A |
| `DHM.f103` | 103 | 1330 | 420 | 195 | 106 | 1439,464 | PUNCH gloved, arm from right, B (larger) |
| `DHM.f041` | 41 | 429 | 162 | 94 | 63 | 472,198 | PUNCH gloved, toward upper left, 1 |
| `DHM.f056` | 56 | 351 | 234 | 136 | 114 | 422,294 | REACH open gloved hand, back of hand, A |
| `DHM.f057` | 57 | 487 | 244 | 135 | 107 | 558,297 | REACH open hand, B |
| `DHM.f081` | 81 | 351 | 377 | 136 | 107 | 422,430 | REACH open hand, C |
| `DHM.f082` | 82 | 482 | 376 | 140 | 90 | 559,418 | REACH open hand, D |
| `DHM.f288` | 288 | 930 | 1400 | 155 | 108 | 1003,1456 | bare arm punch, very large |
| `DHM.f094` | 94 | 62 | 502 | 67 | 59 | 91,534 | bare fist with knuckle-duster, raised, A |
| `DHM.f095` | 95 | 140 | 486 | 74 | 74 | 167,527 | bare fist with knuckle-duster, raised, B |
| `DHM.f379` | 379 | 492 | 1771 | 110 | 85 | 559,1822 | cupped hand, A |
| `DHM.f380` | 380 | 567 | 1781 | 110 | 75 | 635,1822 | cupped hand, B |
| `DHM.f067` | 67 | 2180 | 262 | 83 | 124 | 2214,335 | finger pointing up, A |
| `DHM.f068` | 68 | 2275 | 268 | 83 | 117 | 2309,335 | finger pointing up, B |
| `DHM.f125` | 125 | 1308 | 551 | 83 | 124 | 1342,624 | finger pointing up, C |
| `DHM.f126` | 126 | 1403 | 557 | 83 | 117 | 1437,624 | finger pointing up, D |
| `DHM.f066` | 66 | 1970 | 252 | 181 | 100 | 2073,311 | finger-gun, arm from lower left |
| `DHM.f284` | 284 | 4 | 1388 | 233 | 103 | 137,1445 | fist behind round wooden shield |
| `DHM.f150` | 150 | 2375 | 698 | 176 | 103 | 2446,739 | flexed arm, gloved fist holding small object |
| `DHM.f035` | 35 | 921 | 162 | 172 | 103 | 1021,203 | flexed bare arm, gloved fist, A |
| `DHM.f044` | 44 | 1100 | 140 | 172 | 103 | 1200,181 | flexed bare arm, gloved fist, B |
| `DHM.f264` | 264 | 434 | 1324 | 128 | 100 | 491,1381 | gloved fist with forearm, medium |
| `DHM.f274` | 274 | 1599 | 1352 | 101 | 85 | 1643,1400 | gloved fist with forearm, medium B |
| `DHM.f212` | 212 | 536 | 1137 | 100 | 49 | 593,1164 | gloved fist with forearm, small |
| `DHM.f051` | 51 | 1530 | 217 | 156 | 137 | 1615,293 | gloved fist with long forearm |
| `DHM.f075` | 75 | 1291 | 304 | 70 | 101 | 1330,355 | gloved fist, front view, large |
| `DHM.f364` | 364 | 496 | 1659 | 138 | 106 | 555,1718 | hand holding grenade |
| `DHM.f027` | 27 | 1527 | 122 | 59 | 75 | 1557,162 | hand holding red button |
| `DHM.f164` | 164 | 303 | 837 | 47 | 73 | 326,875 | hand holding red button, small |
| `DHM.f039` | 39 | 1760 | 180 | 52 | 113 | 1784,238 | hand holding red button, with forearm |
| `DHM.f381` | 381 | 2391 | 1774 | 62 | 141 | 2421,1845 | hand holding red button, with forearm B |
| `DHM.f220` | 220 | 2173 | 1098 | 322 | 127 | 2327,1158 | long arm reach from the left |
| `DHM.f180` | 180 | 1167 | 860 | 107 | 124 | 1224,931 | pointing hand, A |
| `DHM.f253` | 253 | 1187 | 1275 | 88 | 128 | 1239,1350 | pointing hand, B |
| `DHM.f133` | 133 | 2264 | 562 | 137 | 183 | 2335,650 | raised gloved fist, large |
| `DHM.f300` | 300 | 2118 | 1370 | 82 | 118 | 2159,1433 | raised gloved fist, medium |
| `DHM.f203` | 203 | 1173 | 1000 | 102 | 105 | 1229,1055 | raised gloved fist, pale arm |
| `DHM.f234` | 234 | 1760 | 1100 | 156 | 142 | 1846,1180 | spiked knuckle fist |
| `DHM.f004` | 4 | 659 | 42 | 158 | 98 | 730,97 | spread fingers reaching, A |
| `DHM.f034` | 34 | 682 | 150 | 158 | 105 | 751,209 | spread fingers reaching, B |
| `DHM.f116` | 116 | 654 | 539 | 99 | 97 | 705,595 | spread hand, A |
| `DHM.f123` | 123 | 768 | 551 | 96 | 85 | 817,599 | spread hand, B |
| `DHM.f202` | 202 | 1065 | 1021 | 99 | 97 | 1116,1077 | spread hand, C |
| `DHM.f108` | 108 | 1921 | 473 | 343 | 99 | 2095,533 | two hands, 2 |
| `DHM.f129` | 129 | 1921 | 584 | 326 | 99 | 2095,647 | two hands, 3 |
| `DHM.f149` | 149 | 1941 | 703 | 295 | 98 | 2089,764 | two hands, 4 |
| `DHM.f093` | 93 | 1945 | 373 | 298 | 91 | 2083,428 | two hands, cracking knuckles, 1 |
| `DHM.f385` | 385 | 299 | 1817 | 224 | 110 | 444,1880 ; 359,1881 | two open hands, palms up |
| `DHM.f135` | 135 | 506 | 666 | 107 | 52 | 567,696 | with knuckle-duster, 2 |
| `DHM.f144` | 144 | 470 | 727 | 147 | 76 | 548,767 | with knuckle-duster, 3 (largest) |

---

## E11 · Blaster (loose files, ready to use)

Archive `E11 BLASTER.rar`, folder `E11 BLASTER/`. A dark rifle seen from behind, no hands. Every frame is a 512×512 transparent PNG; the gun sits low in the frame, so anchor the frame's bottom edge to the bottom of the screen. Smooth 3D render, not pixel art.

| id | files | frames | content box (union) | shows |
|---|---|---|---|---|
| `E11.idle` | `IDLE/1.png` | 1 | 170,299,148,213 | at rest |
| `E11.fire.1..8` | `FIRE/1.png` … `FIRE/8.png` | 8 | 149,160,210,352 | shot with pink-red muzzle glow, gun kicks up |
| `E11.reload.1..60` | `RELOAD/0001.png` … `0060.png` | 60 | 156,299,356,213 | gun tips sideways and returns |
| `E11.walk.1..30` | `WALK/0001.png` … `0030.png` | 30 | 170,299,148,213 | bob while moving |
| `E11.walk2.1..30` | `WALK/X2/0001.png` … `0030.png` | 30 | 170,299,148,213 | same bob, second version (larger or faster) |

---

## RCP · The builder's own pistol strip (already in the game)

Inside `Room_Creator_v0_2_COMBAT_ROOM_v0_1_1.zip` at `rc/characters/combat/pistol_strip.png`: 1800×360, 14 frames of 180×180 in 10 columns. Idle loop = frames 0,10,11,12,13,12,11,10 at 4 per second. Fire = frames 1-9 at 24 per second. To replace it with any hand set here, build a strip of equal-size frames and edit `routeNet.combat.weapon` (see `16_BUILDER.md` §6).
