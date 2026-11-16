# 18 · More enemies (third batch of sheets)

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

Seven hostile characters from the six sheets the owner added after the design document: a gunman in eleven colours, a hat gunman and a bomb carrier (one picture), an armoured bruiser, a masked knife man, a brawler, and a woman with a pistol. Same table layout as `10_CHARACTERS.md`. Three of these sheets need cutting methods that the first batch did not: see `20_SLICING_AND_SCALE.md` §4b and §4c.

**Angle codes.** `F` front (faces the camera) · `FQ` front three-quarter · `S` side · `BQ` back three-quarter · `B` back. A suffix says which way the figure faces **in the source picture**: `-L` = toward the left edge, `-R` = toward the right edge. Mirror a picture to get the opposite direction.

**Columns.** `id` = the manifest ID. `#` = the number drawn on that sheet's preview image in `previews/`. `x y w h` = tight rectangle in pixels in the original image, origin top-left. `ax` = where the feet centre sits, in pixels from the rectangle's left edge. `cell x,y` = top-left corner of the grid cell, for sheets that are grids.

## What each one can do (art only)

| code | directions | moves | ranged attack | close attack | hit reaction | deaths | other |
|---|---|---|---|---|---|---|---|
| `GNC` | 8 | idle, walk | pistol (2 frames), launcher (2 frames) | none | none | with blood, without blood (one view) | 11 shirt colours |
| `SWN` | 5 (faces left) | run, jump, dive, crawl, climb | submachine gun (2 frames, 3 angles, no flash drawn) | none | 3 frames, front | head shot, blown off the feet, cut in two | no idle frame |
| `SWC` | 5 (faces left) | run with the box | none (carries a bomb) | none | loose poses | loose poses | no throw frame |
| `ARM` | 5 (faces left) | stand, walk, run | none | two punches at the camera; throw-or-shove arm action at 5 angles | 7 frames, front | falls on the back | unarmed |
| `MSK` | 5 (faces right) | stand, run | none | 6-step overhead stab at 5 angles | 5 angles | falls back; clutches head; head off; bursts; skeleton flash | get-up set |
| `BRW` | 5 (faces right) | idle, ready, run | none | swipe, lunge (one pose each, 5 angles) | 3 frames, front | several, mostly gory | rises out of the ground; same pose set as `PLB` |
| `TKW` | mixed | stand, a few walk poses | pistol aim (3 views) | none | none | none | blurred copy |

---

## GNC · Gunman in 11 shirt colours (pistol in one hand, launcher in the other)

| field | value |
|---|---|
| file | `24175.png`  (2945×3304 px) |
| preview | `previews/GNC_numbered.png` |
| background | cyan rgb(0,255,255) cells with teal rgb(0,128,128) grid lines and labels |
| frames | 946 |
| layout | Eleven colour blocks, each 8 cells wide, in three bands. Every cell is 91×92 px inside 1 px teal lines. Colour number *i* (0 to 10, in the order gray, brown, black, tan, red, olive, blue, white, green, purple, orange) has its block at **x + 736 × (i mod 4), y + 1101 × (i div 4)**. Inside a block: the idle row is at y = 34; the eight direction rows start at y = 142 and step 93; death with blood at y = 901; death without blood at y = 1009; cells step 92 across from x = 1. |
| angles | All 8 directions are drawn. Idle: the 8 cells across are F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R. Walk, shoot and launch: **one row per direction** in that same order; the columns are `walk1`, `walk2`, `walk3`, `walk4`, `shoot1`, `shoot2`, `launch1`, `launch2`. No mirroring needed. |
| scale | 87 px standing = 1.8 m → **48.3 px per metre** |
| use | The most complete armed enemy in the set, and the only one that comes in several colours: one body, eleven looks, two weapons, all 8 directions. A squad of four can be told apart by colour alone. The launcher action is the nearest thing in the uploaded art to a **bomb thrower** (it is a shoulder-height launcher shot, not an arm throw). |

**Watch for**

- Background is cyan `rgb(0,255,255)` inside the cells and teal `rgb(0,128,128)` between them. Delete the cyan (method B, tolerance 8). The tight rectangles never touch the teal lines or the text labels.
- **Only the gray block is listed below.** The tight rectangles are identical in all eleven colours (checked by program on all 946 frames): for another colour, add its block offset. `data/frames.json` lists every colour as `GNC.<set>.<key>@<colour>`, for example `GNC.walk1.F@red`.
- `tan` and `orange` read as bare-chested (the shirt is skin-coloured).
- Two firing actions. `shoot` is the pistol in his right hand; `launch` is the heavy launcher in his left, with a larger flash and his body lit orange on the second frame. Two frames each: aim, then flash. There is no wind-up or recoil frame.
- Deaths are drawn from one view only (front three-quarter, turned to the left). No separate hit-reaction frame: use `death_clean.1`.
- No run cycle. Play the walk faster.
- No crouch, no climb, no jump.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GNC.idle` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | standing, pistol and launcher lowered |
| `GNC.walk1` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 1 |
| `GNC.walk2` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 2 |
| `GNC.walk3` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 3 |
| `GNC.walk4` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 4 |
| `GNC.shoot1` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | pistol shot 2: muzzle flash |
| `GNC.launch1` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | launcher shot 1: launcher levelled |
| `GNC.launch2` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | launcher shot 2: launcher flash, body lit orange |
| `GNC.death_blood` | 7 | 1, 2, 3, 4, 5, 6, 7 | hit, still standing (with blood) … lying flat (with blood) |
| `GNC.death_clean` | 7 | 1, 2, 3, 4, 5, 6, 7 | hit, still standing (no blood) … lying flat (no blood) |

**Frames**

Gray block. For another colour add its block offset to `x`, `y` and `cell x,y`:

| colour | add to x | add to y | id suffix |
|---|---|---|---|
| gray | 0 | 0 | `@gray` |
| brown | 736 | 0 | `@brown` |
| black | 1472 | 0 | `@black` |
| tan | 2208 | 0 | `@tan` |
| red | 0 | 1101 | `@red` |
| olive | 736 | 1101 | `@olive` |
| blue | 1472 | 1101 | `@blue` |
| white | 2208 | 1101 | `@white` |
| green | 0 | 2202 | `@green` |
| purple | 736 | 2202 | `@purple` |
| orange | 1472 | 2202 | `@orange` |

| id | # | x | y | w | h | ax | cell x,y | shows |
|---|---|---|---|---|---|---|---|---|
| `GNC.idle.F` | 1 | 28 | 39 | 37 | 87 | 14.5 | 1,34 | standing, pistol and launcher lowered |
| `GNC.idle.FQ-L` | 2 | 122 | 39 | 32 | 87 | 14.0 | 93,34 | standing, pistol and launcher lowered |
| `GNC.idle.S-L` | 3 | 219 | 37 | 22 | 89 | 9.5 | 185,34 | standing, pistol and launcher lowered |
| `GNC.idle.BQ-L` | 4 | 305 | 38 | 34 | 88 | 17.0 | 277,34 | standing, pistol and launcher lowered |
| `GNC.idle.B` | 5 | 394 | 38 | 40 | 88 | 20.5 | 369,34 | standing, pistol and launcher lowered |
| `GNC.idle.BQ-R` | 6 | 490 | 37 | 32 | 89 | 16.0 | 461,34 | standing, pistol and launcher lowered |
| `GNC.idle.S-R` | 7 | 588 | 37 | 21 | 89 | 11.5 | 553,34 | standing, pistol and launcher lowered |
| `GNC.idle.FQ-R` | 8 | 674 | 39 | 33 | 87 | 17.0 | 645,34 | standing, pistol and launcher lowered |
| `GNC.walk1.F` | 9 | 28 | 147 | 37 | 87 | 15.5 | 1,142 | walk phase 1 |
| `GNC.walk2.F` | 10 | 119 | 143 | 38 | 91 | 11.0 | 93,142 | walk phase 2 |
| `GNC.walk3.F` | 11 | 212 | 146 | 37 | 88 | 21.5 | 185,142 | walk phase 3 |
| `GNC.walk4.F` | 12 | 304 | 143 | 36 | 91 | 22.5 | 277,142 | walk phase 4 |
| `GNC.shoot1.F` | 13 | 397 | 147 | 35 | 87 | 15.0 | 369,142 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.F` | 14 | 492 | 146 | 29 | 88 | 11.0 | 461,142 | pistol shot 2: muzzle flash |
| `GNC.launch1.F` | 15 | 577 | 147 | 42 | 87 | 15.0 | 553,142 | launcher shot 1: launcher levelled |
| `GNC.launch2.F` | 16 | 676 | 149 | 29 | 85 | 12.0 | 645,142 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.FQ-L` | 17 | 29 | 240 | 35 | 87 | 17.0 | 1,235 | walk phase 1 |
| `GNC.walk2.FQ-L` | 18 | 115 | 240 | 46 | 87 | 21.5 | 93,235 | walk phase 2 |
| `GNC.walk3.FQ-L` | 19 | 210 | 240 | 41 | 87 | 27.0 | 185,235 | walk phase 3 |
| `GNC.walk4.FQ-L` | 20 | 292 | 239 | 60 | 88 | 29.0 | 277,235 | walk phase 4 |
| `GNC.shoot1.FQ-L` | 21 | 394 | 240 | 41 | 87 | 27.0 | 369,235 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.FQ-L` | 22 | 471 | 239 | 70 | 88 | 39.0 | 461,235 | pistol shot 2: muzzle flash |
| `GNC.launch1.FQ-L` | 23 | 577 | 239 | 43 | 88 | 25.5 | 553,235 | launcher shot 1: launcher levelled |
| `GNC.launch2.FQ-L` | 24 | 659 | 242 | 63 | 85 | 40.0 | 645,235 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.S-L` | 25 | 26 | 333 | 40 | 87 | 30.5 | 1,328 | walk phase 1 |
| `GNC.walk2.S-L` | 26 | 106 | 335 | 64 | 85 | 36.5 | 93,328 | walk phase 2 |
| `GNC.walk3.S-L` | 27 | 214 | 334 | 32 | 86 | 23.0 | 185,328 | walk phase 3 |
| `GNC.walk4.S-L` | 28 | 291 | 334 | 62 | 86 | 30.5 | 277,328 | walk phase 4 |
| `GNC.shoot1.S-L` | 29 | 391 | 332 | 47 | 88 | 27.0 | 369,328 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.S-L` | 30 | 475 | 333 | 63 | 87 | 41.5 | 461,328 | pistol shot 2: muzzle flash |
| `GNC.launch1.S-L` | 31 | 568 | 332 | 61 | 88 | 43.5 | 553,328 | launcher shot 1: launcher levelled |
| `GNC.launch2.S-L` | 32 | 648 | 333 | 84 | 87 | 61.5 | 645,328 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.BQ-L` | 33 | 16 | 425 | 60 | 88 | 45.5 | 1,421 | walk phase 1 |
| `GNC.walk2.BQ-L` | 34 | 104 | 425 | 68 | 88 | 50.5 | 93,421 | walk phase 2 |
| `GNC.walk3.BQ-L` | 35 | 213 | 426 | 34 | 87 | 16.5 | 185,421 | walk phase 3 |
| `GNC.walk4.BQ-L` | 36 | 296 | 425 | 53 | 88 | 26.0 | 277,421 | walk phase 4 |
| `GNC.shoot1.BQ-L` | 37 | 396 | 423 | 36 | 90 | 22.5 | 369,421 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.BQ-L` | 38 | 478 | 423 | 57 | 90 | 39.5 | 461,421 | pistol shot 2: muzzle flash |
| `GNC.launch1.BQ-L` | 39 | 575 | 426 | 47 | 87 | 29.5 | 553,421 | launcher shot 1: launcher levelled |
| `GNC.launch2.BQ-L` | 40 | 658 | 426 | 64 | 87 | 42.5 | 645,421 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.B` | 41 | 27 | 516 | 39 | 90 | 21.0 | 1,514 | walk phase 1 |
| `GNC.walk2.B` | 42 | 119 | 515 | 39 | 91 | 19.0 | 93,514 | walk phase 2 |
| `GNC.walk3.B` | 43 | 212 | 517 | 37 | 89 | 17.0 | 185,514 | walk phase 3 |
| `GNC.walk4.B` | 44 | 305 | 515 | 35 | 91 | 19.5 | 277,514 | walk phase 4 |
| `GNC.shoot1.B` | 45 | 396 | 516 | 36 | 90 | 17.0 | 369,514 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.B` | 46 | 485 | 517 | 42 | 89 | 15.5 | 461,514 | pistol shot 2: muzzle flash |
| `GNC.launch1.B` | 47 | 579 | 516 | 38 | 90 | 20.0 | 553,514 | launcher shot 1: launcher levelled |
| `GNC.launch2.B` | 48 | 669 | 517 | 42 | 89 | 25.5 | 645,514 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.BQ-R` | 49 | 21 | 611 | 51 | 88 | 13.5 | 1,607 | walk phase 1 |
| `GNC.walk2.BQ-R` | 50 | 109 | 611 | 58 | 88 | 16.5 | 93,607 | walk phase 2 |
| `GNC.walk3.BQ-R` | 51 | 213 | 612 | 34 | 87 | 16.5 | 185,607 | walk phase 3 |
| `GNC.walk4.BQ-R` | 52 | 296 | 611 | 53 | 88 | 26.0 | 277,607 | walk phase 4 |
| `GNC.shoot1.BQ-R` | 53 | 391 | 611 | 46 | 88 | 16.5 | 369,607 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.BQ-R` | 54 | 475 | 611 | 63 | 88 | 20.5 | 461,607 | pistol shot 2: muzzle flash |
| `GNC.launch1.BQ-R` | 55 | 580 | 607 | 37 | 92 | 12.5 | 553,607 | launcher shot 1: launcher levelled |
| `GNC.launch2.BQ-R` | 56 | 662 | 610 | 57 | 89 | 16.5 | 645,607 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.S-R` | 57 | 29 | 704 | 34 | 88 | 8.0 | 1,700 | walk phase 1 |
| `GNC.walk2.S-R` | 58 | 109 | 707 | 58 | 85 | 26.5 | 93,700 | walk phase 2 |
| `GNC.walk3.S-R` | 59 | 213 | 705 | 35 | 87 | 8.0 | 185,700 | walk phase 3 |
| `GNC.walk4.S-R` | 60 | 287 | 704 | 71 | 88 | 30.0 | 277,700 | walk phase 4 |
| `GNC.shoot1.S-R` | 61 | 389 | 704 | 50 | 88 | 16.5 | 369,700 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.S-R` | 62 | 473 | 705 | 66 | 87 | 21.5 | 461,700 | pistol shot 2: muzzle flash |
| `GNC.launch1.S-R` | 63 | 570 | 704 | 57 | 88 | 20.5 | 553,700 | launcher shot 1: launcher levelled |
| `GNC.launch2.S-R` | 64 | 649 | 706 | 83 | 86 | 26.5 | 645,700 | launcher shot 2: launcher flash, body lit orange |
| `GNC.walk1.FQ-R` | 65 | 30 | 797 | 32 | 88 | 16.5 | 1,793 | walk phase 1 |
| `GNC.walk2.FQ-R` | 66 | 115 | 798 | 46 | 87 | 23.5 | 93,793 | walk phase 2 |
| `GNC.walk3.FQ-R` | 67 | 207 | 797 | 46 | 88 | 13.0 | 185,793 | walk phase 3 |
| `GNC.walk4.FQ-R` | 68 | 290 | 796 | 64 | 89 | 25.0 | 277,793 | walk phase 4 |
| `GNC.shoot1.FQ-R` | 69 | 397 | 798 | 35 | 87 | 19.5 | 369,793 | pistol shot 1: pistol raised and aimed |
| `GNC.shoot2.FQ-R` | 70 | 480 | 798 | 53 | 87 | 21.5 | 461,793 | pistol shot 2: muzzle flash |
| `GNC.launch1.FQ-R` | 71 | 569 | 797 | 59 | 88 | 20.5 | 553,793 | launcher shot 1: launcher levelled |
| `GNC.launch2.FQ-R` | 72 | 652 | 798 | 77 | 87 | 22.0 | 645,793 | launcher shot 2: launcher flash, body lit orange |
| `GNC.death_blood.1` | 73 | 21 | 903 | 50 | 90 | 15.5 | 1,901 | hit, still standing (with blood) |
| `GNC.death_blood.2` | 74 | 106 | 902 | 64 | 91 | 26.0 | 93,901 | doubling over, pistol dropping (with blood) |
| `GNC.death_blood.3` | 75 | 195 | 915 | 70 | 78 | 33.0 | 185,901 | on knees (with blood) |
| `GNC.death_blood.4` | 76 | 285 | 925 | 74 | 68 | 36.5 | 277,901 | kneeling, hunched over (with blood) |
| `GNC.death_blood.5` | 77 | 371 | 947 | 86 | 46 | 39.0 | 369,901 | collapsing forward (with blood) |
| `GNC.death_blood.6` | 78 | 462 | 959 | 88 | 34 | 43.5 | 461,901 | curled on the ground (with blood) |
| `GNC.death_blood.7` | 79 | 553 | 969 | 91 | 24 | 43.0 | 553,901 | lying flat (with blood) |
| `GNC.death_clean.1` | 80 | 23 | 1016 | 46 | 85 | 11.5 | 1,1009 | hit, still standing (no blood) |
| `GNC.death_clean.2` | 81 | 108 | 1024 | 60 | 77 | 23.5 | 93,1009 | doubling over, pistol dropping (no blood) |
| `GNC.death_clean.3` | 82 | 197 | 1051 | 66 | 50 | 18.5 | 185,1009 | on knees (no blood) |
| `GNC.death_clean.4` | 83 | 294 | 1056 | 56 | 45 | 32.5 | 277,1009 | kneeling, hunched over (no blood) |
| `GNC.death_clean.5` | 84 | 374 | 1069 | 81 | 32 | 43.5 | 369,1009 | collapsing forward (no blood) |
| `GNC.death_clean.6` | 85 | 476 | 1076 | 61 | 25 | 20.5 | 461,1009 | curled on the ground (no blood) |
| `GNC.death_clean.7` | 86 | 563 | 1077 | 70 | 24 | 16.0 | 553,1009 | lying flat (no blood) |

---

## SWN · Hat gunman (black suit, blue hat, submachine gun): runs, dives, jumps, crawls, climbs

| field | value |
|---|---|
| file | `png-clipart-shadow-warrior-sprite-calligraphy-word-search-shadow-warrior-angle-text.png`  (900×2123 px) |
| preview | `previews/SWN_numbered.png` |
| background | grey-and-white checkerboard painted into the picture (15 px squares) |
| frames | 144 |
| layout | Shares one picture with `SWC` (the bomb carrier fills the top-left block: x < 370, y < 905). Loose rows, no fixed grid: use the rectangles. |
| angles | 5 directions (F, FQ-L, S-L, BQ-L, B) for run, dive, jump and crawl; turned views face **left**; mirror for the right. The standing shot exists at F, FQ-L and S-L only. |
| scale | 82 px standing = 1.75 m → **46.9 px per metre** |
| use | Armed enemy with by far the widest range of movement art: run, standing shot, dive, jump, crawl, climb and three deaths, at five angles. Suits guards who vault, drop flat or get thrown. |

**Watch for**

- This copy has a grey-and-white checkerboard painted into the picture and has been cut down to about 25 colours. Cut with **method E** (`20_SLICING_AND_SCALE.md` §4b) with `gap_min` 1.
- A credit line is printed at the bottom right, (560,2085)-(900,2123). It is excluded.
- No muzzle flash is drawn on the shooting frames. Add `KPA.muzzle_01` or the builder's own flash at the gun.
- There is no standing idle frame. Hold `shoot1` or a run frame.
- `death_blast` (thrown off the feet, tumbling, landing) is the **only tumbling-body animation in the whole set**. Use it for a guard who is thrown, hit by a car or caught by a bomb.
- The five climb sets are five views of the same climb; which view is which was judged by eye.
- The hat is part of the measured height.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `SWN.run1` | 5 | F, FQ-L, S-L, BQ-L, B | running, phase 1 |
| `SWN.run2` | 5 | F, FQ-L, S-L, BQ-L, B | running, phase 2 |
| `SWN.run3` | 5 | F, FQ-L, S-L, BQ-L, B | running, phase 3 |
| `SWN.run4` | 5 | F, FQ-L, S-L, BQ-L, B | running, phase 4 |
| `SWN.shoot1` | 3 | F, FQ-L, S-L | standing shot, frame 1: crouched stance, gun out |
| `SWN.shoot2` | 3 | F, FQ-L, S-L | standing shot, frame 2 (no muzzle flash is drawn) |
| `SWN.dive1` | 5 | F, FQ-L, S-L, BQ-L, B | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2` | 5 | F, FQ-L, S-L, BQ-L, B | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3` | 5 | F, FQ-L, S-L, BQ-L, B | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4` | 5 | F, FQ-L, S-L, BQ-L, B | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.jump1` | 5 | F, FQ-L, S-L, BQ-L, B | jumping, knees drawn up, phase 1 |
| `SWN.jump2` | 5 | F, FQ-L, S-L, BQ-L, B | jumping, knees drawn up, phase 2 |
| `SWN.jump3` | 5 | F, FQ-L, S-L, BQ-L, B | jumping, knees drawn up, phase 3 |
| `SWN.jump4` | 5 | F, FQ-L, S-L, BQ-L, B | jumping, knees drawn up, phase 4 |
| `SWN.crawl1` | 5 | F, FQ-L, S-L, BQ-L, B | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2` | 5 | F, FQ-L, S-L, BQ-L, B | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3` | 5 | F, FQ-L, S-L, BQ-L, B | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4` | 5 | F, FQ-L, S-L, BQ-L, B | crouched low on knees and one hand, phase 4 |
| `SWN.hurt` | 3 | 1, 2, 3 | front, standing, chest bloodied, frame 1 … front, standing, chest bloodied, frame 3 |
| `SWN.death_head` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | front, gun raised to the head … lying dead |
| `SWN.death_blast` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | front, hand to the face (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) … lying flat (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_cut` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | front, red slash across the chest … remains, version B |
| `SWN.climb_a` | 4 | 1, 2, 3, 4 | climbing, side view, gun raised, phase 1 (exact view angle judged by eye) … climbing, side view, gun raised, phase 4 (exact view angle judged by eye) |
| `SWN.climb_b` | 4 | 1, 2, 3, 4 | climbing, three-quarter front view, phase 1 (exact view angle judged by eye) … climbing, three-quarter front view, phase 4 (exact view angle judged by eye) |
| `SWN.climb_c` | 4 | 1, 2, 3, 4 | climbing, seen from behind, phase 1 (exact view angle judged by eye) … climbing, seen from behind, phase 4 (exact view angle judged by eye) |
| `SWN.climb_d` | 4 | 1, 2, 3, 4 | climbing, three-quarter back view, phase 1 (exact view angle judged by eye) … climbing, three-quarter back view, phase 4 (exact view angle judged by eye) |
| `SWN.climb_e` | 4 | 1, 2, 3, 4 | climbing, side view, gun arm nearer the camera, phase 1 (exact view angle judged by eye) … climbing, side view, gun arm nearer the camera, phase 4 (exact view angle judged by eye) |
| `SWN.stagger` | 3 | 1, 2, 3 | front, gun held across the body … front, gun arm dropped |
| `SWN.rungun` | 6 | 1, 2, 3, 4, 5, 6 | moving while pointing the gun, front three-quarter, faces left, A … striding away, back three-quarter, gun low |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `SWN.run1.F` | 45 | 381 | 6 | 40 | 82 | 18.5 | running, phase 1 |
| `SWN.run2.F` | 46 | 518 | 6 | 44 | 84 | 18.0 | running, phase 2 |
| `SWN.run3.F` | 47 | 655 | 6 | 42 | 82 | 19.0 | running, phase 3 |
| `SWN.run4.F` | 48 | 792 | 6 | 43 | 82 | 17.5 | running, phase 4 |
| `SWN.run1.FQ-L` | 49 | 372 | 99 | 55 | 82 | 35.5 | running, phase 1 |
| `SWN.run2.FQ-L` | 50 | 509 | 99 | 52 | 82 | 36.0 | running, phase 2 |
| `SWN.run3.FQ-L` | 51 | 646 | 99 | 46 | 81 | 30.5 | running, phase 3 |
| `SWN.run4.FQ-L` | 52 | 783 | 99 | 55 | 83 | 40.5 | running, phase 4 |
| `SWN.run1.S-L` | 53 | 375 | 195 | 74 | 80 | 48.5 | running, phase 1 |
| `SWN.run2.S-L` | 54 | 512 | 195 | 54 | 81 | 44.5 | running, phase 2 |
| `SWN.run3.S-L` | 55 | 649 | 195 | 59 | 78 | 34.5 | running, phase 3 |
| `SWN.run4.S-L` | 56 | 786 | 195 | 56 | 81 | 46.5 | running, phase 4 |
| `SWN.run1.BQ-L` | 57 | 399 | 288 | 47 | 76 | 26.0 | running, phase 1 |
| `SWN.run2.BQ-L` | 58 | 536 | 288 | 38 | 78 | 22.0 | running, phase 2 |
| `SWN.run3.BQ-L` | 59 | 673 | 288 | 48 | 75 | 27.5 | running, phase 3 |
| `SWN.run4.BQ-L` | 60 | 810 | 288 | 37 | 76 | 29.0 | running, phase 4 |
| `SWN.run1.B` | 61 | 396 | 377 | 39 | 75 | 20.0 | running, phase 1 |
| `SWN.run2.B` | 62 | 533 | 377 | 39 | 79 | 16.5 | running, phase 2 |
| `SWN.run3.B` | 63 | 670 | 377 | 41 | 75 | 20.0 | running, phase 3 |
| `SWN.run4.B` | 64 | 807 | 377 | 44 | 78 | 25.5 | running, phase 4 |
| `SWN.shoot1.F` | 65 | 396 | 461 | 39 | 78 | 18.5 | standing shot, frame 1: crouched stance, gun out |
| `SWN.shoot2.F` | 66 | 533 | 461 | 37 | 79 | 18.0 | standing shot, frame 2 (no muzzle flash is drawn) |
| `SWN.shoot1.FQ-L` | 67 | 670 | 461 | 48 | 77 | 33.0 | standing shot, frame 1: crouched stance, gun out |
| `SWN.shoot2.FQ-L` | 68 | 807 | 461 | 47 | 77 | 29.5 | standing shot, frame 2 (no muzzle flash is drawn) |
| `SWN.shoot1.S-L` | 69 | 392 | 548 | 46 | 76 | 26.5 | standing shot, frame 1: crouched stance, gun out |
| `SWN.shoot2.S-L` | 70 | 529 | 548 | 44 | 78 | 24.0 | standing shot, frame 2 (no muzzle flash is drawn) |
| `SWN.dive1.F` | 71 | 397 | 637 | 38 | 38 | 18.0 | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2.F` | 72 | 534 | 637 | 49 | 46 | 42.5 | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3.F` | 73 | 671 | 637 | 38 | 39 | 15.5 | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4.F` | 74 | 808 | 637 | 48 | 37 | 25.0 | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.dive1.FQ-L` | 75 | 379 | 694 | 82 | 35 | 47.0 | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2.FQ-L` | 76 | 516 | 694 | 81 | 46 | 49.5 | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3.FQ-L` | 77 | 647 | 696 | 83 | 38 | 44.0 | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4.FQ-L` | 78 | 784 | 696 | 81 | 36 | 32.0 | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.dive1.S-L` | 79 | 375 | 749 | 103 | 34 | 14.0 | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2.S-L` | 80 | 512 | 749 | 105 | 43 | 25.5 | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3.S-L` | 81 | 649 | 749 | 105 | 38 | 22.5 | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4.S-L` | 82 | 786 | 749 | 105 | 37 | 21.5 | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.dive1.BQ-L` | 83 | 385 | 796 | 79 | 37 | 13.5 | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2.BQ-L` | 84 | 523 | 796 | 79 | 41 | 3.5 | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3.BQ-L` | 85 | 666 | 796 | 70 | 34 | 11.5 | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4.BQ-L` | 86 | 803 | 796 | 70 | 36 | 16.5 | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.dive1.B` | 87 | 400 | 842 | 35 | 38 | 20.5 | body flat out as in a dive or a belly crawl, phase 1 |
| `SWN.dive2.B` | 88 | 499 | 842 | 43 | 43 | 4.5 | body flat out as in a dive or a belly crawl, phase 2 |
| `SWN.dive3.B` | 89 | 594 | 843 | 35 | 40 | 29.0 | body flat out as in a dive or a belly crawl, phase 3 |
| `SWN.dive4.B` | 90 | 699 | 844 | 41 | 36 | 18.0 | body flat out as in a dive or a belly crawl, phase 4 |
| `SWN.jump1.F` | 91 | 6 | 913 | 48 | 69 | 30.0 | jumping, knees drawn up, phase 1 |
| `SWN.jump2.F` | 92 | 106 | 914 | 45 | 80 | 20.5 | jumping, knees drawn up, phase 2 |
| `SWN.jump3.F` | 93 | 203 | 916 | 51 | 78 | 14.0 | jumping, knees drawn up, phase 3 |
| `SWN.jump4.F` | 94 | 307 | 918 | 51 | 78 | 21.5 | jumping, knees drawn up, phase 4 |
| `SWN.jump1.FQ-L` | 98 | 1 | 1002 | 56 | 72 | 38.0 | jumping, knees drawn up, phase 1 |
| `SWN.jump2.FQ-L` | 99 | 100 | 1003 | 49 | 82 | 34.0 | jumping, knees drawn up, phase 2 |
| `SWN.jump3.FQ-L` | 100 | 195 | 1004 | 54 | 78 | 32.0 | jumping, knees drawn up, phase 3 |
| `SWN.jump4.FQ-L` | 101 | 300 | 1005 | 52 | 78 | 24.5 | jumping, knees drawn up, phase 4 |
| `SWN.jump1.S-L` | 106 | 6 | 1091 | 45 | 71 | 29.5 | jumping, knees drawn up, phase 1 |
| `SWN.jump2.S-L` | 107 | 105 | 1092 | 68 | 80 | 61.5 | jumping, knees drawn up, phase 2 |
| `SWN.jump3.S-L` | 108 | 196 | 1087 | 54 | 81 | 48.5 | jumping, knees drawn up, phase 3 |
| `SWN.jump4.S-L` | 109 | 300 | 1089 | 42 | 81 | 19.0 | jumping, knees drawn up, phase 4 |
| `SWN.jump1.BQ-L` | 114 | 4 | 1177 | 45 | 70 | 28.0 | jumping, knees drawn up, phase 1 |
| `SWN.jump2.BQ-L` | 115 | 104 | 1178 | 52 | 80 | 45.0 | jumping, knees drawn up, phase 2 |
| `SWN.jump3.BQ-L` | 116 | 198 | 1178 | 51 | 79 | 45.5 | jumping, knees drawn up, phase 3 |
| `SWN.jump4.BQ-L` | 117 | 303 | 1180 | 55 | 78 | 24.5 | jumping, knees drawn up, phase 4 |
| `SWN.jump1.B` | 122 | 14 | 1265 | 43 | 68 | 14.0 | jumping, knees drawn up, phase 1 |
| `SWN.jump2.B` | 123 | 113 | 1266 | 48 | 77 | 26.0 | jumping, knees drawn up, phase 2 |
| `SWN.jump3.B` | 124 | 197 | 1266 | 50 | 72 | 29.5 | jumping, knees drawn up, phase 3 |
| `SWN.jump4.B` | 125 | 302 | 1267 | 52 | 76 | 26.5 | jumping, knees drawn up, phase 4 |
| `SWN.crawl1.F` | 130 | 16 | 1350 | 45 | 46 | 24.5 | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2.F` | 131 | 115 | 1351 | 45 | 52 | 26.0 | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3.F` | 132 | 210 | 1352 | 48 | 53 | 28.5 | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4.F` | 133 | 314 | 1353 | 41 | 52 | 22.5 | crouched low on knees and one hand, phase 4 |
| `SWN.crawl1.FQ-L` | 138 | 6 | 1411 | 67 | 42 | 45.0 | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2.FQ-L` | 139 | 106 | 1412 | 68 | 51 | 49.5 | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3.FQ-L` | 140 | 200 | 1411 | 63 | 54 | 52.0 | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4.FQ-L` | 141 | 305 | 1412 | 65 | 52 | 48.5 | crouched low on knees and one hand, phase 4 |
| `SWN.crawl1.S-L` | 142 | 5 | 1474 | 88 | 44 | 44.5 | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2.S-L` | 143 | 104 | 1474 | 86 | 50 | 56.5 | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3.S-L` | 144 | 199 | 1475 | 94 | 54 | 64.5 | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4.S-L` | 145 | 303 | 1477 | 78 | 49 | 67.0 | crouched low on knees and one hand, phase 4 |
| `SWN.crawl1.BQ-L` | 152 | 8 | 1532 | 71 | 43 | 35.0 | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2.BQ-L` | 153 | 107 | 1533 | 63 | 49 | 31.0 | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3.BQ-L` | 154 | 197 | 1534 | 62 | 53 | 32.0 | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4.BQ-L` | 155 | 272 | 1536 | 65 | 50 | 53.0 | crouched low on knees and one hand, phase 4 |
| `SWN.crawl1.B` | 156 | 26 | 1593 | 38 | 36 | 17.5 | crouched low on knees and one hand, phase 1 |
| `SWN.crawl2.B` | 157 | 125 | 1594 | 43 | 47 | 17.0 | crouched low on knees and one hand, phase 2 |
| `SWN.crawl3.B` | 158 | 211 | 1595 | 43 | 52 | 18.0 | crouched low on knees and one hand, phase 3 |
| `SWN.crawl4.B` | 159 | 285 | 1597 | 40 | 45 | 20.0 | crouched low on knees and one hand, phase 4 |
| `SWN.hurt.1` | 95 | 393 | 916 | 56 | 82 | 33.5 | front, standing, chest bloodied, frame 1 |
| `SWN.hurt.2` | 96 | 503 | 916 | 58 | 81 | 34.0 | front, standing, chest bloodied, frame 2 |
| `SWN.hurt.3` | 97 | 599 | 917 | 58 | 84 | 34.0 | front, standing, chest bloodied, frame 3 |
| `SWN.death_head.1` | 102 | 411 | 1010 | 38 | 83 | 19.5 | front, gun raised to the head |
| `SWN.death_head.2` | 103 | 521 | 1010 | 39 | 86 | 25.0 | front, gun at the head, braced |
| `SWN.death_head.3` | 104 | 616 | 1012 | 46 | 93 | 25.0 | head hit, blood |
| `SWN.death_head.4` | 105 | 713 | 1016 | 43 | 90 | 7.5 | head gone, still standing |
| `SWN.death_head.5` | 110 | 405 | 1102 | 48 | 83 | 14.0 | standing, blood down the body |
| `SWN.death_head.6` | 111 | 493 | 1124 | 68 | 61 | 29.0 | toppling forward |
| `SWN.death_head.7` | 112 | 588 | 1126 | 67 | 47 | 29.5 | on knees |
| `SWN.death_head.8` | 113 | 684 | 1130 | 81 | 27 | 41.5 | lying dead |
| `SWN.death_blast.1` | 118 | 398 | 1193 | 35 | 80 | 14.5 | front, hand to the face (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.2` | 119 | 508 | 1193 | 41 | 77 | 15.5 | hit, arms thrown up, blood (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.3` | 120 | 604 | 1197 | 48 | 54 | 9.0 | thrown backward off the feet (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.4` | 121 | 704 | 1199 | 50 | 50 | 25.0 | upside down in the air (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.5` | 126 | 389 | 1282 | 64 | 59 | 36.5 | upside down, legs up, landing on the shoulders (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.6` | 127 | 491 | 1288 | 75 | 48 | 45.0 | landing, limbs spread (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.7` | 128 | 586 | 1289 | 77 | 38 | 42.5 | sprawled (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_blast.8` | 129 | 682 | 1294 | 75 | 20 | 37.0 | lying flat (blown-off-the-feet death: the nearest thing to a thrown or car-struck body) |
| `SWN.death_cut.1` | 134 | 403 | 1354 | 48 | 84 | 25.0 | front, red slash across the chest |
| `SWN.death_cut.2` | 135 | 513 | 1354 | 45 | 84 | 23.5 | upper body starting to slide |
| `SWN.death_cut.3` | 136 | 608 | 1355 | 42 | 83 | 18.5 | upper body sliding further |
| `SWN.death_cut.4` | 137 | 704 | 1360 | 49 | 73 | 20.0 | upper body tipping off |
| `SWN.death_cut.5` | 146 | 400 | 1449 | 54 | 67 | 17.5 | body splitting, blood |
| `SWN.death_cut.6` | 147 | 496 | 1465 | 64 | 57 | 18.5 | halves separating |
| `SWN.death_cut.7` | 148 | 592 | 1467 | 65 | 47 | 42.0 | halves falling |
| `SWN.death_cut.8` | 149 | 688 | 1471 | 95 | 37 | 44.5 | halves on the ground |
| `SWN.death_cut.9` | 150 | 383 | 1532 | 97 | 23 | 40.5 | remains, version A |
| `SWN.death_cut.10` | 151 | 493 | 1532 | 76 | 21 | 35.0 | remains, version B |
| `SWN.climb_a.1` | 160 | 26 | 1653 | 41 | 112 | 30.5 | climbing, side view, gun raised, phase 1 (exact view angle judged by eye) |
| `SWN.climb_a.2` | 161 | 126 | 1654 | 39 | 90 | 26.5 | climbing, side view, gun raised, phase 2 (exact view angle judged by eye) |
| `SWN.climb_a.3` | 162 | 214 | 1658 | 38 | 94 | 28.5 | climbing, side view, gun raised, phase 3 (exact view angle judged by eye) |
| `SWN.climb_a.4` | 163 | 288 | 1659 | 39 | 87 | 27.5 | climbing, side view, gun raised, phase 4 (exact view angle judged by eye) |
| `SWN.climb_b.1` | 164 | 369 | 1650 | 38 | 109 | 27.5 | climbing, three-quarter front view, phase 1 (exact view angle judged by eye) |
| `SWN.climb_b.2` | 165 | 466 | 1651 | 40 | 88 | 25.0 | climbing, three-quarter front view, phase 2 (exact view angle judged by eye) |
| `SWN.climb_b.3` | 166 | 552 | 1652 | 37 | 96 | 22.0 | climbing, three-quarter front view, phase 3 (exact view angle judged by eye) |
| `SWN.climb_b.4` | 167 | 627 | 1654 | 39 | 86 | 22.0 | climbing, three-quarter front view, phase 4 (exact view angle judged by eye) |
| `SWN.climb_c.1` | 168 | 31 | 1780 | 34 | 110 | 18.5 | climbing, seen from behind, phase 1 (exact view angle judged by eye) |
| `SWN.climb_c.2` | 169 | 130 | 1781 | 36 | 87 | 16.5 | climbing, seen from behind, phase 2 (exact view angle judged by eye) |
| `SWN.climb_c.3` | 170 | 208 | 1785 | 36 | 96 | 13.5 | climbing, seen from behind, phase 3 (exact view angle judged by eye) |
| `SWN.climb_c.4` | 171 | 283 | 1786 | 38 | 84 | 20.0 | climbing, seen from behind, phase 4 (exact view angle judged by eye) |
| `SWN.climb_d.1` | 172 | 368 | 1779 | 37 | 109 | 10.5 | climbing, three-quarter back view, phase 1 (exact view angle judged by eye) |
| `SWN.climb_d.2` | 173 | 468 | 1780 | 38 | 89 | 13.0 | climbing, three-quarter back view, phase 2 (exact view angle judged by eye) |
| `SWN.climb_d.3` | 174 | 554 | 1782 | 38 | 98 | 8.0 | climbing, three-quarter back view, phase 3 (exact view angle judged by eye) |
| `SWN.climb_d.4` | 175 | 628 | 1783 | 38 | 84 | 14.0 | climbing, three-quarter back view, phase 4 (exact view angle judged by eye) |
| `SWN.climb_e.1` | 176 | 21 | 1906 | 39 | 108 | 10.0 | climbing, side view, gun arm nearer the camera, phase 1 (exact view angle judged by eye) |
| `SWN.climb_e.2` | 177 | 120 | 1907 | 39 | 87 | 11.0 | climbing, side view, gun arm nearer the camera, phase 2 (exact view angle judged by eye) |
| `SWN.climb_e.3` | 178 | 208 | 1915 | 37 | 99 | 9.5 | climbing, side view, gun arm nearer the camera, phase 3 (exact view angle judged by eye) |
| `SWN.climb_e.4` | 179 | 283 | 1916 | 36 | 84 | 10.0 | climbing, side view, gun arm nearer the camera, phase 4 (exact view angle judged by eye) |
| `SWN.stagger.1` | 180 | 355 | 1920 | 46 | 77 | 28.5 | front, gun held across the body |
| `SWN.stagger.2` | 181 | 454 | 1921 | 49 | 76 | 21.5 | front, arms out, staggered |
| `SWN.stagger.3` | 182 | 540 | 1926 | 52 | 77 | 32.0 | front, gun arm dropped |
| `SWN.rungun.1` | 183 | 8 | 2030 | 51 | 75 | 33.5 | moving while pointing the gun, front three-quarter, faces left, A |
| `SWN.rungun.2` | 184 | 108 | 2031 | 55 | 74 | 36.0 | same, B |
| `SWN.rungun.3` | 185 | 193 | 2033 | 62 | 78 | 44.0 | same, C (longest stride) |
| `SWN.rungun.4` | 186 | 288 | 2036 | 55 | 75 | 30.0 | hunched run, back three-quarter, no gun showing |
| `SWN.rungun.5` | 187 | 388 | 2036 | 73 | 75 | 44.0 | lunging stride, side view, gun pointing left |
| `SWN.rungun.6` | 188 | 474 | 2038 | 61 | 80 | 33.0 | striding away, back three-quarter, gun low |

---

## SWC · Bomb carrier (blue robe, straw hat, explosive box on a pole)

| field | value |
|---|---|
| file | `png-clipart-shadow-warrior-sprite-calligraphy-word-search-shadow-warrior-angle-text.png`  (900×2123 px) |
| preview | `previews/SWC_numbered.png` |
| background | grey-and-white checkerboard painted into the picture (15 px squares) |
| frames | 44 |
| layout | Top-left block of the same picture as `SWN`. Five rows of four run frames, then 24 loose poses. |
| angles | Run: 5 directions (F, FQ-L, S-L, BQ-L, B), turned views face **left**. The loose poses are one view each. |
| scale | 82 px standing = 1.75 m → **46.9 px per metre** |
| use | A robed man running with an explosive box on a pole. Reads as a **bomb carrier** who runs the bomb to a place, not as a thrower. Whether the game wants that is an open design question (`01_NEEDS.md` N-26). |

**Watch for**

- Same checkerboard copy as `SWN`: method E, `gap_min` 1.
- **There is no throwing frame.** He carries the box; he does not throw it.
- The 24 loose poses (`box`, `fall`, `turn`) are listed in the order they sit on the sheet, each described by eye. Their playback order has not been worked out: pick by description and check the preview.
- Scale is taken from `SWN` (same picture, same size of figure).

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `SWC.run1` | 5 | F, FQ-L, S-L, BQ-L, B | running with the box, phase 1 |
| `SWC.run2` | 5 | F, FQ-L, S-L, BQ-L, B | running with the box, phase 2 |
| `SWC.run3` | 5 | F, FQ-L, S-L, BQ-L, B | running with the box, phase 3 |
| `SWC.run4` | 5 | F, FQ-L, S-L, BQ-L, B | running with the box, phase 4 |
| `SWC.box` | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | front, box raised high on the pole … stooped far forward, box dropped ahead on the ground |
| `SWC.fall` | 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | front, upright, box hanging from the pole (order on the sheet, not a checked playback order) … lying flat, version B (order on the sheet, not a checked playback order) |
| `SWC.turn` | 6 | 1, 2, 3, 4, 5, 6 | front, arms low and wide, box at the hip … side view, clutching the box to the chest |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `SWC.run1.F` | 1 | 10 | 6 | 32 | 69 | 19.0 | running with the box, phase 1 |
| `SWC.run2.F` | 2 | 110 | 6 | 31 | 72 | 15.0 | running with the box, phase 2 |
| `SWC.run3.F` | 3 | 211 | 6 | 30 | 70 | 16.0 | running with the box, phase 3 |
| `SWC.run4.F` | 4 | 311 | 6 | 36 | 72 | 25.0 | running with the box, phase 4 |
| `SWC.run1.FQ-L` | 5 | 8 | 87 | 48 | 61 | 27.5 | running with the box, phase 1 |
| `SWC.run2.FQ-L` | 6 | 109 | 86 | 47 | 67 | 32.0 | running with the box, phase 2 |
| `SWC.run3.FQ-L` | 7 | 209 | 87 | 49 | 65 | 35.0 | running with the box, phase 3 |
| `SWC.run4.FQ-L` | 8 | 310 | 86 | 40 | 67 | 32.0 | running with the box, phase 4 |
| `SWC.run1.S-L` | 9 | 11 | 160 | 50 | 63 | 29.0 | running with the box, phase 1 |
| `SWC.run2.S-L` | 10 | 112 | 160 | 40 | 67 | 27.0 | running with the box, phase 2 |
| `SWC.run3.S-L` | 11 | 212 | 160 | 51 | 65 | 34.0 | running with the box, phase 3 |
| `SWC.run4.S-L` | 12 | 313 | 160 | 39 | 64 | 26.0 | running with the box, phase 4 |
| `SWC.run1.BQ-L` | 13 | 19 | 233 | 44 | 62 | 23.0 | running with the box, phase 1 |
| `SWC.run2.BQ-L` | 14 | 122 | 238 | 36 | 64 | 24.0 | running with the box, phase 2 |
| `SWC.run3.BQ-L` | 15 | 220 | 233 | 41 | 63 | 21.5 | running with the box, phase 3 |
| `SWC.run4.BQ-L` | 16 | 320 | 233 | 40 | 64 | 17.0 | running with the box, phase 4 |
| `SWC.run1.B` | 17 | 17 | 310 | 41 | 61 | 14.0 | running with the box, phase 1 |
| `SWC.run2.B` | 18 | 118 | 310 | 42 | 64 | 23.5 | running with the box, phase 2 |
| `SWC.run3.B` | 19 | 218 | 310 | 33 | 64 | 15.5 | running with the box, phase 3 |
| `SWC.run4.B` | 20 | 319 | 310 | 35 | 65 | 11.5 | running with the box, phase 4 |
| `SWC.box.1` | 21 | 7 | 381 | 46 | 74 | 25.0 | front, box raised high on the pole |
| `SWC.box.2` | 22 | 108 | 381 | 54 | 71 | 28.0 | front, box raised, free arm flung out |
| `SWC.box.3` | 23 | 209 | 381 | 46 | 64 | 24.5 | front, pole held across the body, box at the middle |
| `SWC.box.4` | 24 | 10 | 465 | 39 | 70 | 19.5 | turned away, box lifted behind |
| `SWC.box.5` | 25 | 103 | 462 | 59 | 70 | 40.0 | wide step, box held high to one side |
| `SWC.box.6` | 26 | 204 | 463 | 47 | 58 | 29.5 | front, crouched, box at the hip |
| `SWC.box.7` | 27 | 1 | 541 | 61 | 71 | 31.0 | arms flung wide, box swinging up (thrown off balance) |
| `SWC.box.8` | 28 | 102 | 541 | 53 | 64 | 32.5 | leaning forward, hunched, box high |
| `SWC.box.9` | 29 | 203 | 541 | 69 | 57 | 48.0 | stooped far forward, box dropped ahead on the ground |
| `SWC.fall.1` | 30 | 6 | 621 | 42 | 69 | 21.5 | front, upright, box hanging from the pole (order on the sheet, not a checked playback order) |
| `SWC.fall.2` | 31 | 106 | 621 | 44 | 64 | 24.5 | front, head tipped back (order on the sheet, not a checked playback order) |
| `SWC.fall.3` | 32 | 207 | 621 | 43 | 56 | 16.0 | front, low crouch, box in front (order on the sheet, not a checked playback order) |
| `SWC.fall.4` | 33 | 308 | 621 | 42 | 51 | 19.5 | kneeling, box at the lower left (order on the sheet, not a checked playback order) |
| `SWC.fall.5` | 34 | 300 | 690 | 60 | 26 | 9.0 | lying on the side (order on the sheet, not a checked playback order) |
| `SWC.fall.6` | 35 | 106 | 708 | 50 | 29 | 21.0 | on knees, slumped forward (order on the sheet, not a checked playback order) |
| `SWC.fall.7` | 36 | 207 | 708 | 56 | 16 | 19.5 | lying flat, version A (order on the sheet, not a checked playback order) |
| `SWC.fall.8` | 37 | 6 | 708 | 51 | 41 | 19.0 | on knees, arms wide (order on the sheet, not a checked playback order) |
| `SWC.fall.9` | 38 | 300 | 722 | 57 | 18 | 21.0 | lying flat, version B (order on the sheet, not a checked playback order) |
| `SWC.turn.1` | 39 | 7 | 759 | 53 | 60 | 30.0 | front, arms low and wide, box at the hip |
| `SWC.turn.2` | 40 | 107 | 759 | 27 | 69 | 13.5 | narrow side view, box held in front of the face |
| `SWC.turn.3` | 41 | 208 | 759 | 53 | 55 | 28.0 | striding, leaning, box behind |
| `SWC.turn.4` | 42 | 308 | 759 | 39 | 64 | 19.0 | turned away, standing |
| `SWC.turn.5` | 43 | 7 | 841 | 60 | 51 | 35.5 | deep lunge, pole in the far hand |
| `SWC.turn.6` | 44 | 108 | 841 | 36 | 63 | 18.0 | side view, clutching the box to the chest |

---

## ARM · Armoured bruiser (chrome helmet and armour, unarmed): walks, runs, punches

| field | value |
|---|---|
| file | `png-clipart-playstation-sprite-pokemon-black-white-personal-computer-video-game-sprite-angle-electronics.png`  (900×2193 px) |
| preview | `previews/ARM_numbered.png` |
| background | grey-and-white checkerboard painted into the picture (15 px squares) |
| frames | 96 |
| layout | Loose rows on a checkerboard: use the rectangles. Two frames touched each other on the sheet and were split by program: `ARM.run4.S-L` (#54) and `ARM.run4.BQ-L` (#96). |
| angles | 5 directions (F, FQ-L, S-L, BQ-L, B) for stand, walk (6 phases), run (4 phases) and the three arm poses; turned views face **left**. |
| scale | 117 px standing = 1.9 m → **61.6 px per metre** |
| use | The only enemy in the set drawn to fight hand to hand: guard stance, two punches at the camera, a hit-reaction set, and a throw-like arm action at five angles. Drawn larger than the others (1.9 m). |

**Watch for**

- Checkerboard painted in, about 21 colours. Cut with **method E**, `gap_min` 24. The shine on the armour is the same white as the checkerboard, so small enclosed white patches are kept as shine and only pockets of 24 px or more count as gaps. A few small gaps (between an arm and the body) stay filled white.
- A credit line is printed at the bottom right, (610,2155)-(900,2193). It is excluded.
- Unarmed. No gun frames at all.
- `punch_a` and `punch_b` are front view only and end with a fist filling the picture: drawn to be seen by the person being punched.
- `arm_out`, `arm_up` and `arm_low` are single poses in five directions. Played `arm_low` → `arm_up` → `arm_out` they read as an overarm throw or a strike; `arm_low` → `arm_out` reads as a shove.
- `stagger` is listed in sheet order; the frames may not be one continuous movement.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `ARM.stand` | 5 | F, FQ-L, S-L, BQ-L, B | standing, arms at the sides |
| `ARM.walk1` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 1 of 6 |
| `ARM.walk2` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 2 of 6 |
| `ARM.walk3` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 3 of 6 |
| `ARM.walk4` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 4 of 6 |
| `ARM.walk5` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 5 of 6 |
| `ARM.walk6` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 6 of 6 |
| `ARM.run1` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 1 of 4 |
| `ARM.run2` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 2 of 4 |
| `ARM.run3` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 3 of 4 |
| `ARM.run4` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 4 of 4 |
| `ARM.stagger` | 7 | 1, 2, 3, 4, 5, 6, 7 | front, arms starting to fly out (hit reaction, order on the sheet) … front, tilted, recovering (hit reaction, order on the sheet) |
| `ARM.punch_a` | 5 | 1, 2, 3, 4, 5 | front: fists up, on guard … front: fist fills the view (punch at the camera) |
| `ARM.punch_b` | 4 | 1, 2, 3, 4 | front: fists up, on guard … front: follow-through |
| `ARM.arm_out` | 5 | F, FQ-L, S-L, BQ-L, B | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up` | 5 | F, FQ-L, S-L, BQ-L, B | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low` | 5 | F, FQ-L, S-L, BQ-L, B | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.death` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | toppling backward, front view … lying flat, C |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `ARM.stand.F` | 1 | 13 | 9 | 59 | 117 | 29.0 | standing, arms at the sides |
| `ARM.stand.FQ-L` | 2 | 169 | 10 | 55 | 118 | 30.0 | standing, arms at the sides |
| `ARM.stand.S-L` | 3 | 325 | 10 | 35 | 118 | 20.5 | standing, arms at the sides |
| `ARM.stand.BQ-L` | 4 | 481 | 10 | 53 | 117 | 29.5 | standing, arms at the sides |
| `ARM.stand.B` | 5 | 637 | 10 | 59 | 116 | 28.5 | standing, arms at the sides |
| `ARM.walk1.F` | 6 | 17 | 139 | 48 | 117 | 21.5 | walk phase 1 of 6 |
| `ARM.walk2.F` | 7 | 174 | 139 | 52 | 120 | 12.5 | walk phase 2 of 6 |
| `ARM.walk3.F` | 8 | 322 | 140 | 52 | 118 | 25.0 | walk phase 3 of 6 |
| `ARM.walk4.F` | 9 | 478 | 140 | 50 | 116 | 25.5 | walk phase 4 of 6 |
| `ARM.walk5.F` | 10 | 634 | 140 | 52 | 120 | 36.5 | walk phase 5 of 6 |
| `ARM.walk6.F` | 11 | 790 | 140 | 53 | 118 | 26.0 | walk phase 6 of 6 |
| `ARM.walk1.FQ-L` | 12 | 7 | 271 | 82 | 114 | 40.0 | walk phase 1 of 6 |
| `ARM.walk2.FQ-L` | 13 | 162 | 271 | 68 | 117 | 32.0 | walk phase 2 of 6 |
| `ARM.walk3.FQ-L` | 14 | 318 | 271 | 59 | 117 | 37.0 | walk phase 3 of 6 |
| `ARM.walk4.FQ-L` | 15 | 466 | 270 | 67 | 115 | 30.0 | walk phase 4 of 6 |
| `ARM.walk5.FQ-L` | 16 | 622 | 270 | 59 | 119 | 27.0 | walk phase 5 of 6 |
| `ARM.walk6.FQ-L` | 17 | 778 | 270 | 46 | 118 | 28.5 | walk phase 6 of 6 |
| `ARM.walk1.S-L` | 18 | 5 | 399 | 90 | 115 | 45.5 | walk phase 1 of 6 |
| `ARM.walk2.S-L` | 19 | 161 | 399 | 71 | 115 | 33.0 | walk phase 2 of 6 |
| `ARM.walk3.S-L` | 20 | 317 | 399 | 46 | 117 | 33.0 | walk phase 3 of 6 |
| `ARM.walk4.S-L` | 21 | 458 | 399 | 90 | 113 | 44.0 | walk phase 4 of 6 |
| `ARM.walk5.S-L` | 22 | 629 | 396 | 72 | 118 | 30.0 | walk phase 5 of 6 |
| `ARM.walk6.S-L` | 23 | 785 | 395 | 43 | 120 | 30.0 | walk phase 6 of 6 |
| `ARM.walk1.BQ-L` | 24 | 11 | 529 | 66 | 116 | 39.0 | walk phase 1 of 6 |
| `ARM.walk2.BQ-L` | 25 | 167 | 528 | 54 | 117 | 33.0 | walk phase 2 of 6 |
| `ARM.walk3.BQ-L` | 26 | 323 | 528 | 46 | 118 | 29.0 | walk phase 3 of 6 |
| `ARM.walk4.BQ-L` | 27 | 470 | 529 | 81 | 115 | 41.5 | walk phase 4 of 6 |
| `ARM.walk5.BQ-L` | 28 | 625 | 528 | 68 | 116 | 33.0 | walk phase 5 of 6 |
| `ARM.walk6.BQ-L` | 29 | 779 | 528 | 51 | 120 | 28.5 | walk phase 6 of 6 |
| `ARM.walk1.B` | 30 | 12 | 655 | 49 | 117 | 22.0 | walk phase 1 of 6 |
| `ARM.walk2.B` | 31 | 168 | 655 | 52 | 117 | 25.5 | walk phase 2 of 6 |
| `ARM.walk3.B` | 32 | 324 | 655 | 50 | 118 | 25.0 | walk phase 3 of 6 |
| `ARM.walk4.B` | 33 | 480 | 655 | 49 | 117 | 26.5 | walk phase 4 of 6 |
| `ARM.walk5.B` | 34 | 635 | 655 | 51 | 116 | 25.5 | walk phase 5 of 6 |
| `ARM.walk6.B` | 35 | 791 | 655 | 52 | 118 | 26.0 | walk phase 6 of 6 |
| `ARM.run1.F` | 36 | 12 | 782 | 48 | 110 | 8.0 | run phase 1 of 4 |
| `ARM.run2.F` | 37 | 168 | 782 | 54 | 115 | 15.0 | run phase 2 of 4 |
| `ARM.run3.F` | 38 | 324 | 782 | 55 | 107 | 46.5 | run phase 3 of 4 |
| `ARM.run4.F` | 39 | 480 | 782 | 53 | 118 | 39.5 | run phase 4 of 4 |
| `ARM.run1.FQ-L` | 40 | 8 | 907 | 99 | 108 | 48.5 | run phase 1 of 4 |
| `ARM.run2.FQ-L` | 41 | 164 | 907 | 62 | 114 | 38.5 | run phase 2 of 4 |
| `ARM.run3.FQ-L` | 42 | 320 | 907 | 81 | 107 | 19.0 | run phase 3 of 4 |
| `ARM.run4.FQ-L` | 43 | 475 | 904 | 53 | 118 | 32.0 | run phase 4 of 4 |
| `ARM.run1.S-L` | 46 | 13 | 1033 | 109 | 108 | 56.0 | run phase 1 of 4 |
| `ARM.run2.S-L` | 47 | 169 | 1033 | 61 | 113 | 48.5 | run phase 2 of 4 |
| `ARM.run3.S-L` | 48 | 325 | 1033 | 124 | 103 | 14.5 | run phase 3 of 4 |
| `ARM.run4.S-L` | 54 | 481 | 1033 | 80 | 117 | 35.5 | run phase 4 of 4 |
| `ARM.run1.BQ-L` | 51 | 21 | 1152 | 78 | 113 | 71.0 | run phase 1 of 4 |
| `ARM.run2.BQ-L` | 52 | 177 | 1152 | 55 | 114 | 46.0 | run phase 2 of 4 |
| `ARM.run3.BQ-L` | 53 | 328 | 1153 | 111 | 100 | 11.5 | run phase 3 of 4 |
| `ARM.run4.BQ-L` | 96 | 484 | 1153 | 74 | 115 | 26.5 | run phase 4 of 4 |
| `ARM.run1.B` | 57 | 23 | 1275 | 47 | 115 | 14.0 | run phase 1 of 4 |
| `ARM.run2.B` | 58 | 179 | 1275 | 55 | 115 | 39.0 | run phase 2 of 4 |
| `ARM.run3.B` | 59 | 335 | 1275 | 50 | 97 | 18.5 | run phase 3 of 4 |
| `ARM.run4.B` | 60 | 491 | 1275 | 53 | 113 | 11.5 | run phase 4 of 4 |
| `ARM.stagger.1` | 44 | 608 | 901 | 77 | 111 | 34.5 | front, arms starting to fly out (hit reaction, order on the sheet) |
| `ARM.stagger.2` | 45 | 747 | 904 | 93 | 118 | 58.0 | front, arms flung wide, thrown back (hit reaction, order on the sheet) |
| `ARM.stagger.3` | 49 | 596 | 1030 | 91 | 112 | 54.5 | front, arms out, off balance (hit reaction, order on the sheet) |
| `ARM.stagger.4` | 50 | 751 | 1030 | 60 | 109 | 33.0 | hunched, head down (hit reaction, order on the sheet) |
| `ARM.stagger.5` | 55 | 608 | 1155 | 62 | 100 | 32.0 | leaning, arms half raised (hit reaction, order on the sheet) |
| `ARM.stagger.6` | 56 | 763 | 1155 | 60 | 93 | 12.5 | leaning back, one leg lifting (hit reaction, order on the sheet) |
| `ARM.stagger.7` | 61 | 608 | 1272 | 58 | 113 | 34.5 | front, tilted, recovering (hit reaction, order on the sheet) |
| `ARM.punch_a.1` | 62 | 17 | 1397 | 55 | 116 | 46.0 | front: fists up, on guard |
| `ARM.punch_a.2` | 63 | 167 | 1399 | 54 | 116 | 32.0 | front: winding up |
| `ARM.punch_a.3` | 64 | 323 | 1399 | 53 | 113 | 26.0 | front: arm starting forward |
| `ARM.punch_a.4` | 65 | 479 | 1399 | 53 | 111 | 27.5 | front: arm driving forward |
| `ARM.punch_a.5` | 66 | 635 | 1399 | 53 | 116 | 22.5 | front: fist fills the view (punch at the camera) |
| `ARM.punch_b.1` | 67 | 14 | 1520 | 49 | 115 | 27.5 | front: fists up, on guard |
| `ARM.punch_b.2` | 68 | 170 | 1520 | 58 | 117 | 28.5 | front: winding up, other arm |
| `ARM.punch_b.3` | 69 | 326 | 1520 | 58 | 117 | 22.0 | front: fist fills the view, other arm (punch at the camera) |
| `ARM.punch_b.4` | 70 | 474 | 1520 | 61 | 115 | 25.0 | front: follow-through |
| `ARM.arm_out.F` | 71 | 9 | 1645 | 66 | 117 | 37.0 | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_out.FQ-L` | 72 | 113 | 1645 | 72 | 115 | 41.5 | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_out.S-L` | 73 | 218 | 1645 | 63 | 116 | 37.5 | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_out.BQ-L` | 74 | 321 | 1645 | 62 | 116 | 35.5 | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_out.B` | 75 | 426 | 1645 | 62 | 115 | 26.0 | one arm thrust straight out (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up.F` | 76 | 9 | 1770 | 65 | 117 | 39.5 | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up.FQ-L` | 77 | 114 | 1770 | 71 | 115 | 41.0 | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up.S-L` | 78 | 218 | 1770 | 63 | 116 | 39.0 | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up.BQ-L` | 79 | 322 | 1770 | 64 | 115 | 34.5 | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_up.B` | 80 | 426 | 1770 | 61 | 114 | 24.0 | one arm cocked up beside the head (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low.F` | 81 | 8 | 1895 | 65 | 116 | 35.0 | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low.FQ-L` | 82 | 107 | 1893 | 69 | 114 | 39.0 | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low.S-L` | 83 | 211 | 1893 | 54 | 116 | 29.5 | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low.BQ-L` | 84 | 315 | 1893 | 53 | 115 | 30.0 | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.arm_low.B` | 85 | 420 | 1893 | 62 | 114 | 27.0 | arms lowered, braced (three-pose arm action drawn at five angles: reads as a punch, a shove or a throw) |
| `ARM.death.1` | 86 | 7 | 2017 | 70 | 105 | 19.5 | toppling backward, front view |
| `ARM.death.2` | 87 | 164 | 2017 | 84 | 80 | 32.0 | bent over backward, falling |
| `ARM.death.3` | 88 | 319 | 2017 | 98 | 59 | 84.0 | on the ground, legs kicking up, A |
| `ARM.death.4` | 89 | 475 | 2017 | 94 | 78 | 62.5 | legs up, B |
| `ARM.death.5` | 90 | 631 | 2018 | 93 | 65 | 43.5 | legs coming down, C |
| `ARM.death.6` | 91 | 787 | 2017 | 102 | 69 | 89.0 | legs coming down, D |
| `ARM.death.7` | 92 | 10 | 2137 | 103 | 47 | 51.5 | lying on the side |
| `ARM.death.8` | 93 | 166 | 2137 | 103 | 37 | 43.0 | lying flat, feet toward the camera, A |
| `ARM.death.9` | 94 | 322 | 2137 | 102 | 37 | 42.5 | lying flat, B |
| `ARM.death.10` | 95 | 478 | 2137 | 102 | 37 | 42.5 | lying flat, C |

---

## MSK · Masked knife man (white mask, black suit)

| field | value |
|---|---|
| file | `ShQs6Dx.png`  (1000×1950 px) |
| preview | `previews/MSK_numbered.png` |
| background | transparent |
| frames | 128 |
| layout | Perfect grid: 10 columns × 13 rows, every cell 100×150. Sets of five angles run two to a row and **continue across row ends** (a set can start at column 10 and finish on the next row). |
| angles | 5 directions (F, FQ-R, S-R, BQ-R, B); turned views face **right**, which is what the builder wants. |
| scale | 125 px standing = 1.8 m → **69.4 px per metre** |
| use | Close-range attacker with a six-step overhead stab at every angle, a hit reaction at every angle and a get-up set. Smooth, larger art (69 px per metre). |

**Watch for**

- Transparent background, crisp edges. Method A.
- Very dark suit: it loses its outline against a dark street. A thin lighter outline, or lighter ground behind, helps.
- The back of the jacket carries a large red painted symbol, visible in every back view. Paint over it if it does not suit the game.
- Knife only. No gun frames.
- Five different endings: `death` (falls back), `death_b` (clutches the head), `death_head`, `gib`, and `shock` (a skeleton flash). Pick one and use it throughout, or tie each to a cause.
- `rise` played backwards is a drop to the ground.
- `head` is a small loose object (about 23 px), not a figure.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `MSK.run1` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 1 of 6, knife low |
| `MSK.run2` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 2 of 6, knife low |
| `MSK.run3` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 3 of 6, knife low |
| `MSK.run4` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 4 of 6, knife low |
| `MSK.run5` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 5 of 6, knife low |
| `MSK.run6` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 6 of 6, knife low |
| `MSK.hurt` | 5 | F, FQ-R, S-R, BQ-R, B | knocked back, head thrown back |
| `MSK.death` | 5 | 1, 2, 3, 4, 5 | front, arms up, knife flying … lying dead |
| `MSK.rise` | 6 | 1, 2, 3, 4, 5, 6 | flat on the ground (getting up; play backwards for dropping down) … standing (getting up; play backwards for dropping down) |
| `MSK.death_head` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | head gone, standing, arms out … remains, B |
| `MSK.stand` | 5 | F, FQ-R, S-R, BQ-R, B | standing, knife low |
| `MSK.stab1` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab2` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab3` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab4` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab5` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab6` | 5 | F, FQ-R, S-R, BQ-R, B | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.calm` | 1 | (single) | front, standing, hands together low (one frame) |
| `MSK.death_b` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | front, head snapped back … lying |
| `MSK.shock` | 5 | 1, 2, 3, 4, 5 | skeleton showing, front (electrocution flash) … skeleton, sitting (electrocution flash) |
| `MSK.gib` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | body bursting apart, step 1 of 8 … body bursting apart, step 8 of 8 |
| `MSK.head` | 17 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 | loose masked head, spinning, frame 1 of 17 … loose masked head, spinning, frame 17 of 17 |

**Frames**

| id | # | x | y | w | h | ax | cell x,y | shows |
|---|---|---|---|---|---|---|---|---|
| `MSK.run1.F` | 1 | 5 | 5 | 48 | 128 | 36.5 | 0,0 | run phase 1 of 6, knife low |
| `MSK.run1.FQ-R` | 2 | 105 | 5 | 67 | 115 | 35.5 | 100,0 | run phase 1 of 6, knife low |
| `MSK.run1.S-R` | 3 | 205 | 5 | 69 | 112 | 29.0 | 200,0 | run phase 1 of 6, knife low |
| `MSK.run1.BQ-R` | 4 | 305 | 5 | 52 | 120 | 11.0 | 300,0 | run phase 1 of 6, knife low |
| `MSK.run1.B` | 5 | 405 | 5 | 48 | 119 | 30.5 | 400,0 | run phase 1 of 6, knife low |
| `MSK.run2.F` | 6 | 505 | 5 | 49 | 128 | 32.5 | 500,0 | run phase 2 of 6, knife low |
| `MSK.run2.FQ-R` | 7 | 605 | 5 | 56 | 120 | 29.5 | 600,0 | run phase 2 of 6, knife low |
| `MSK.run2.S-R` | 8 | 705 | 5 | 47 | 113 | 19.5 | 700,0 | run phase 2 of 6, knife low |
| `MSK.run2.BQ-R` | 9 | 805 | 5 | 37 | 116 | 13.0 | 800,0 | run phase 2 of 6, knife low |
| `MSK.run2.B` | 10 | 905 | 5 | 46 | 118 | 14.0 | 900,0 | run phase 2 of 6, knife low |
| `MSK.run3.F` | 11 | 5 | 155 | 45 | 127 | 9.5 | 0,150 | run phase 3 of 6, knife low |
| `MSK.run3.FQ-R` | 12 | 105 | 155 | 56 | 118 | 45.0 | 100,150 | run phase 3 of 6, knife low |
| `MSK.run3.S-R` | 13 | 205 | 155 | 67 | 113 | 35.5 | 200,150 | run phase 3 of 6, knife low |
| `MSK.run3.BQ-R` | 14 | 305 | 155 | 53 | 117 | 5.5 | 300,150 | run phase 3 of 6, knife low |
| `MSK.run3.B` | 15 | 405 | 155 | 46 | 122 | 18.0 | 400,150 | run phase 3 of 6, knife low |
| `MSK.run4.F` | 16 | 505 | 155 | 45 | 130 | 9.5 | 500,150 | run phase 4 of 6, knife low |
| `MSK.run4.FQ-R` | 17 | 605 | 155 | 54 | 120 | 43.5 | 600,150 | run phase 4 of 6, knife low |
| `MSK.run4.S-R` | 18 | 705 | 155 | 67 | 114 | 36.0 | 700,150 | run phase 4 of 6, knife low |
| `MSK.run4.BQ-R` | 19 | 805 | 155 | 55 | 116 | 5.0 | 800,150 | run phase 4 of 6, knife low |
| `MSK.run4.B` | 20 | 905 | 155 | 45 | 123 | 17.5 | 900,150 | run phase 4 of 6, knife low |
| `MSK.run5.F` | 21 | 5 | 305 | 49 | 127 | 16.0 | 0,300 | run phase 5 of 6, knife low |
| `MSK.run5.FQ-R` | 22 | 105 | 305 | 39 | 124 | 18.0 | 100,300 | run phase 5 of 6, knife low |
| `MSK.run5.S-R` | 23 | 205 | 305 | 43 | 119 | 24.5 | 200,300 | run phase 5 of 6, knife low |
| `MSK.run5.BQ-R` | 24 | 305 | 305 | 45 | 116 | 27.0 | 300,300 | run phase 5 of 6, knife low |
| `MSK.run5.B` | 25 | 405 | 305 | 45 | 114 | 23.5 | 400,300 | run phase 5 of 6, knife low |
| `MSK.run6.F` | 26 | 505 | 305 | 46 | 127 | 32.5 | 500,300 | run phase 6 of 6, knife low |
| `MSK.run6.FQ-R` | 27 | 605 | 305 | 60 | 114 | 29.5 | 600,300 | run phase 6 of 6, knife low |
| `MSK.run6.S-R` | 28 | 705 | 305 | 60 | 117 | 7.5 | 700,300 | run phase 6 of 6, knife low |
| `MSK.run6.BQ-R` | 29 | 805 | 305 | 50 | 122 | 13.5 | 800,300 | run phase 6 of 6, knife low |
| `MSK.run6.B` | 30 | 905 | 305 | 47 | 122 | 31.5 | 900,300 | run phase 6 of 6, knife low |
| `MSK.hurt.F` | 31 | 5 | 455 | 51 | 108 | 22.0 | 0,450 | knocked back, head thrown back |
| `MSK.hurt.FQ-R` | 32 | 105 | 455 | 53 | 109 | 23.5 | 100,450 | knocked back, head thrown back |
| `MSK.hurt.S-R` | 33 | 205 | 455 | 61 | 109 | 49.0 | 200,450 | knocked back, head thrown back |
| `MSK.hurt.BQ-R` | 34 | 305 | 455 | 67 | 105 | 57.5 | 300,450 | knocked back, head thrown back |
| `MSK.hurt.B` | 35 | 405 | 455 | 53 | 106 | 28.5 | 400,450 | knocked back, head thrown back |
| `MSK.death.1` | 36 | 505 | 455 | 50 | 103 | 27.5 | 500,450 | front, arms up, knife flying |
| `MSK.death.2` | 37 | 605 | 455 | 56 | 97 | 40.5 | 600,450 | falling backward |
| `MSK.death.3` | 38 | 705 | 455 | 47 | 65 | 32.5 | 700,450 | tumbling |
| `MSK.death.4` | 39 | 805 | 455 | 67 | 37 | 61.5 | 800,450 | sprawled, limbs out |
| `MSK.death.5` | 40 | 905 | 455 | 60 | 32 | 44.0 | 900,450 | lying dead |
| `MSK.rise.1` | 41 | 5 | 605 | 57 | 36 | 32.5 | 0,600 | flat on the ground (getting up; play backwards for dropping down) |
| `MSK.rise.2` | 42 | 105 | 605 | 52 | 54 | 29.0 | 100,600 | pushing up (getting up; play backwards for dropping down) |
| `MSK.rise.3` | 43 | 205 | 605 | 46 | 72 | 23.0 | 200,600 | crouched low (getting up; play backwards for dropping down) |
| `MSK.rise.4` | 44 | 305 | 605 | 45 | 86 | 22.0 | 300,600 | crouched (getting up; play backwards for dropping down) |
| `MSK.rise.5` | 45 | 405 | 605 | 47 | 104 | 24.0 | 400,600 | half risen (getting up; play backwards for dropping down) |
| `MSK.rise.6` | 46 | 505 | 605 | 51 | 125 | 28.5 | 500,600 | standing (getting up; play backwards for dropping down) |
| `MSK.death_head.1` | 47 | 605 | 605 | 75 | 103 | 39.0 | 600,600 | head gone, standing, arms out |
| `MSK.death_head.2` | 48 | 705 | 605 | 90 | 111 | 42.0 | 700,600 | arms wide |
| `MSK.death_head.3` | 49 | 805 | 605 | 88 | 102 | 39.5 | 800,600 | arms raised, blood |
| `MSK.death_head.4` | 50 | 905 | 605 | 69 | 105 | 32.5 | 900,600 | dropping to the knees |
| `MSK.death_head.5` | 51 | 5 | 755 | 69 | 86 | 30.5 | 0,750 | on the knees, arms up |
| `MSK.death_head.6` | 52 | 105 | 755 | 64 | 44 | 36.0 | 100,750 | collapsed |
| `MSK.death_head.7` | 53 | 205 | 755 | 64 | 36 | 36.0 | 200,750 | remains, A |
| `MSK.death_head.8` | 54 | 305 | 755 | 64 | 36 | 36.0 | 300,750 | remains, B |
| `MSK.stand.F` | 55 | 405 | 755 | 50 | 125 | 27.0 | 400,750 | standing, knife low |
| `MSK.stand.FQ-R` | 56 | 505 | 755 | 47 | 127 | 20.0 | 500,750 | standing, knife low |
| `MSK.stand.S-R` | 57 | 605 | 755 | 40 | 127 | 30.5 | 600,750 | standing, knife low |
| `MSK.stand.BQ-R` | 58 | 705 | 755 | 44 | 125 | 26.5 | 700,750 | standing, knife low |
| `MSK.stand.B` | 59 | 805 | 755 | 53 | 123 | 23.0 | 800,750 | standing, knife low |
| `MSK.stab1.F` | 60 | 905 | 755 | 50 | 124 | 27.0 | 900,750 | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab1.FQ-R` | 61 | 5 | 905 | 37 | 128 | 9.0 | 0,900 | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab1.S-R` | 62 | 105 | 905 | 50 | 127 | 18.0 | 100,900 | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab1.BQ-R` | 63 | 205 | 905 | 56 | 126 | 25.5 | 200,900 | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab1.B` | 64 | 305 | 905 | 44 | 124 | 22.0 | 300,900 | overhead stab, step 1 of 6: knife drawn up beside the head |
| `MSK.stab2.F` | 65 | 405 | 905 | 43 | 131 | 21.0 | 400,900 | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab2.FQ-R` | 66 | 505 | 905 | 47 | 136 | 19.5 | 500,900 | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab2.S-R` | 67 | 605 | 905 | 53 | 138 | 34.5 | 600,900 | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab2.BQ-R` | 68 | 705 | 905 | 50 | 140 | 32.5 | 700,900 | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab2.B` | 69 | 805 | 905 | 39 | 141 | 19.0 | 800,900 | overhead stab, step 2 of 6: knife raised overhead, arm straight |
| `MSK.stab3.F` | 70 | 905 | 905 | 49 | 134 | 27.0 | 900,900 | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab3.FQ-R` | 71 | 5 | 1055 | 47 | 139 | 13.5 | 0,1050 | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab3.S-R` | 72 | 105 | 1055 | 42 | 140 | 21.5 | 100,1050 | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab3.BQ-R` | 73 | 205 | 1055 | 48 | 134 | 21.5 | 200,1050 | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab3.B` | 74 | 305 | 1055 | 45 | 130 | 19.5 | 300,1050 | overhead stab, step 3 of 6: knife overhead, starting down |
| `MSK.stab4.F` | 75 | 405 | 1055 | 50 | 124 | 20.5 | 400,1050 | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab4.FQ-R` | 76 | 505 | 1055 | 47 | 127 | 11.0 | 500,1050 | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab4.S-R` | 77 | 605 | 1055 | 49 | 125 | 19.0 | 600,1050 | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab4.BQ-R` | 78 | 705 | 1055 | 43 | 124 | 23.5 | 700,1050 | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab4.B` | 79 | 805 | 1055 | 46 | 124 | 26.0 | 800,1050 | overhead stab, step 4 of 6: knife coming down in front |
| `MSK.stab5.F` | 80 | 905 | 1055 | 54 | 124 | 21.0 | 900,1050 | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab5.FQ-R` | 81 | 5 | 1205 | 44 | 126 | 10.0 | 0,1200 | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab5.S-R` | 82 | 105 | 1205 | 39 | 126 | 17.5 | 100,1200 | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab5.BQ-R` | 83 | 205 | 1205 | 44 | 124 | 27.0 | 200,1200 | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab5.B` | 84 | 305 | 1205 | 51 | 124 | 31.0 | 300,1200 | overhead stab, step 5 of 6: knife thrust forward and low |
| `MSK.stab6.F` | 85 | 405 | 1205 | 49 | 124 | 21.0 | 400,1200 | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.stab6.FQ-R` | 86 | 505 | 1205 | 41 | 125 | 11.0 | 500,1200 | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.stab6.S-R` | 87 | 605 | 1205 | 44 | 126 | 17.5 | 600,1200 | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.stab6.BQ-R` | 88 | 705 | 1205 | 49 | 123 | 25.0 | 700,1200 | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.stab6.B` | 89 | 805 | 1205 | 46 | 124 | 26.0 | 800,1200 | overhead stab, step 6 of 6: follow-through, knife low |
| `MSK.calm` | 90 | 905 | 1205 | 43 | 126 | 21.0 | 900,1200 | front, standing, hands together low (one frame) |
| `MSK.death_b.1` | 91 | 5 | 1355 | 52 | 112 | 24.0 | 0,1350 | front, head snapped back |
| `MSK.death_b.2` | 92 | 105 | 1355 | 53 | 107 | 26.0 | 100,1350 | hands to the head, sagging |
| `MSK.death_b.3` | 93 | 205 | 1355 | 55 | 101 | 27.0 | 200,1350 | hands to the head, knees bending |
| `MSK.death_b.4` | 94 | 305 | 1355 | 59 | 87 | 31.5 | 300,1350 | hands to the head, crouched |
| `MSK.death_b.5` | 95 | 405 | 1355 | 47 | 92 | 23.5 | 400,1350 | mask coming loose, crouched |
| `MSK.death_b.6` | 96 | 505 | 1355 | 45 | 86 | 25.5 | 500,1350 | crouched, clutching the face |
| `MSK.death_b.7` | 97 | 605 | 1355 | 47 | 49 | 32.5 | 600,1350 | curled on the ground |
| `MSK.death_b.8` | 98 | 705 | 1355 | 46 | 46 | 31.5 | 700,1350 | lying |
| `MSK.shock.1` | 99 | 805 | 1355 | 51 | 107 | 22.0 | 800,1350 | skeleton showing, front (electrocution flash) |
| `MSK.shock.2` | 100 | 905 | 1355 | 53 | 108 | 23.5 | 900,1350 | skeleton, falling back (electrocution flash) |
| `MSK.shock.3` | 101 | 5 | 1505 | 61 | 108 | 49.0 | 0,1500 | skeleton, falling further (electrocution flash) |
| `MSK.shock.4` | 102 | 105 | 1505 | 68 | 106 | 57.5 | 100,1500 | skeleton, nearly down (electrocution flash) |
| `MSK.shock.5` | 103 | 205 | 1505 | 53 | 107 | 28.5 | 200,1500 | skeleton, sitting (electrocution flash) |
| `MSK.gib.1` | 104 | 305 | 1505 | 75 | 110 | 39.0 | 300,1500 | body bursting apart, step 1 of 8 |
| `MSK.gib.2` | 105 | 405 | 1505 | 72 | 115 | 39.0 | 400,1500 | body bursting apart, step 2 of 8 |
| `MSK.gib.3` | 106 | 505 | 1505 | 80 | 113 | 38.0 | 500,1500 | body bursting apart, step 3 of 8 |
| `MSK.gib.4` | 107 | 605 | 1505 | 77 | 99 | 31.0 | 600,1500 | body bursting apart, step 4 of 8 |
| `MSK.gib.5` | 108 | 705 | 1505 | 77 | 91 | 38.5 | 700,1500 | body bursting apart, step 5 of 8 |
| `MSK.gib.6` | 109 | 805 | 1505 | 87 | 76 | 45.0 | 800,1500 | body bursting apart, step 6 of 8 |
| `MSK.gib.7` | 110 | 905 | 1505 | 87 | 38 | 43.0 | 900,1500 | body bursting apart, step 7 of 8 |
| `MSK.gib.8` | 111 | 5 | 1655 | 87 | 15 | 42.0 | 0,1650 | body bursting apart, step 8 of 8 |
| `MSK.head.1` | 112 | 105 | 1655 | 14 | 26 | 6.5 | 100,1650 | loose masked head, spinning, frame 1 of 17 |
| `MSK.head.2` | 113 | 205 | 1655 | 23 | 25 | 2.5 | 200,1650 | loose masked head, spinning, frame 2 of 17 |
| `MSK.head.3` | 114 | 305 | 1655 | 21 | 23 | 6.5 | 300,1650 | loose masked head, spinning, frame 3 of 17 |
| `MSK.head.4` | 115 | 405 | 1655 | 23 | 23 | 8.5 | 400,1650 | loose masked head, spinning, frame 4 of 17 |
| `MSK.head.5` | 116 | 505 | 1655 | 25 | 24 | 6.0 | 500,1650 | loose masked head, spinning, frame 5 of 17 |
| `MSK.head.6` | 117 | 605 | 1655 | 28 | 19 | 13.0 | 600,1650 | loose masked head, spinning, frame 6 of 17 |
| `MSK.head.7` | 118 | 705 | 1655 | 26 | 18 | 17.5 | 700,1650 | loose masked head, spinning, frame 7 of 17 |
| `MSK.head.8` | 119 | 805 | 1655 | 19 | 23 | 13.0 | 800,1650 | loose masked head, spinning, frame 8 of 17 |
| `MSK.head.9` | 120 | 905 | 1655 | 15 | 29 | 7.0 | 900,1650 | loose masked head, spinning, frame 9 of 17 |
| `MSK.head.10` | 121 | 5 | 1805 | 20 | 27 | 7.5 | 0,1800 | loose masked head, spinning, frame 10 of 17 |
| `MSK.head.11` | 122 | 105 | 1805 | 26 | 18 | 7.5 | 100,1800 | loose masked head, spinning, frame 11 of 17 |
| `MSK.head.12` | 123 | 205 | 1805 | 28 | 21 | 15.0 | 200,1800 | loose masked head, spinning, frame 12 of 17 |
| `MSK.head.13` | 124 | 305 | 1805 | 25 | 22 | 12.5 | 300,1800 | loose masked head, spinning, frame 13 of 17 |
| `MSK.head.14` | 125 | 405 | 1805 | 23 | 16 | 9.0 | 400,1800 | loose masked head, spinning, frame 14 of 17 |
| `MSK.head.15` | 126 | 505 | 1805 | 29 | 21 | 12.0 | 500,1800 | loose masked head, spinning, frame 15 of 17 |
| `MSK.head.16` | 127 | 605 | 1805 | 24 | 23 | 16.0 | 600,1800 | loose masked head, spinning, frame 16 of 17 |
| `MSK.head.17` | 128 | 705 | 1805 | 14 | 26 | 6.5 | 700,1800 | loose masked head, spinning, frame 17 of 17 |

---

## BRW · Bare-chested brawler (same pose set as the player body, plus attack poses)

| field | value |
|---|---|
| file | `cTL66td_d.webp`  (760×768 px) |
| preview | `previews/BRW_numbered.png` |
| background | transparent, soft edges |
| frames | 104 |
| layout | Perfect grid: 10 columns × 11 rows. Cells are 76 wide and 768 ÷ 11 = 69.8 tall, so cell edges fall on fractions of a pixel: use the rectangles and the `cell` values given, do not compute cells. |
| angles | 5 directions (F, FQ-R, S-R, BQ-R, B); turned views face **right**. |
| scale | 66 px standing = 1.8 m → **36.7 px per metre** |
| use | Unarmed rusher. Also a pose reference for the player body: `BRW.swipe` and `BRW.lunge` show what punch and grab poses for `PLB` would look like. |

**Watch for**

- A small, shrunken copy (760×768, about 37 px per metre): roughly half as sharp as the other character sheets. Edges are soft; treat alpha below 128 as empty.
- **Same pose set as the player body `PLB`, set for set** (`run1..6`, `pain`, `death`, `armsup`, `ready`, `idle`, `gore`, `tpose`), plus sets `PLB` does not have: `swipe`, `lunge`, `stoop`, `burst`, `torn`, `headless`, `rise`.
- What `swipe`, `lunge` and `stoop` are meant to show is a guess from one pose each.
- Most of the deaths are gory. `death.1..6` is the mildest.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `BRW.run1` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 1 of 6, arms raised |
| `BRW.run2` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 2 of 6, arms raised |
| `BRW.run3` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 3 of 6, arms raised |
| `BRW.run4` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 4 of 6, arms raised |
| `BRW.run5` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 5 of 6, arms raised |
| `BRW.run6` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 6 of 6, arms raised |
| `BRW.pain` | 3 | 1, 2, 3 | recoil, arms up … hands to the throat, hunched |
| `BRW.death` | 6 | 1, 2, 3, 4, 5, 6 | clutching the chest (blood) … flat on the ground |
| `BRW.armsup` | 5 | F, FQ-R, S-R, BQ-R, B | arms raised high |
| `BRW.ready` | 5 | F, FQ-R, S-R, BQ-R, B | standing, arms held out low (fight-ready) |
| `BRW.idle` | 5 | F, FQ-R, S-R, BQ-R, B | standing, arms loose |
| `BRW.swipe` | 5 | F, FQ-R, S-R, BQ-R, B | one arm swung across the body |
| `BRW.lunge` | 5 | F, FQ-R, S-R, BQ-R, B | hunched, both arms reaching forward |
| `BRW.stoop` | 5 | F, FQ-R, S-R, BQ-R, B | doubled over, head down |
| `BRW.burst` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | front, chest wound, arms up … remains on the floor, B |
| `BRW.torn` | 10 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | chest torn open, standing, arms up … collapsed, B |
| `BRW.headless` | 5 | 1, 2, 3, 4, 5 | head gone, standing … head gone, collapsed, B |
| `BRW.rise` | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | rising up out of the ground, step 1 of 8 … rising up out of the ground, step 8 of 8 |
| `BRW.gore` | 3 | 1, 2, 3 | sitting wounded … sprawled dead |
| `BRW.tpose` | 1 | (single) | arms spread wide, bloodied (one frame) |

**Frames**

| id | # | x | y | w | h | ax | cell x,y | shows |
|---|---|---|---|---|---|---|---|---|
| `BRW.run1.F` | 1 | 0 | 0 | 40 | 69 | 22.5 | 0,0 | run phase 1 of 6, arms raised |
| `BRW.run1.FQ-R` | 2 | 76 | 0 | 45 | 69 | 16.0 | 76,0 | run phase 1 of 6, arms raised |
| `BRW.run1.S-R` | 3 | 152 | 0 | 37 | 67 | 7.0 | 152,0 | run phase 1 of 6, arms raised |
| `BRW.run1.BQ-R` | 4 | 228 | 0 | 36 | 66 | 4.0 | 228,0 | run phase 1 of 6, arms raised |
| `BRW.run1.B` | 5 | 304 | 0 | 40 | 66 | 14.5 | 304,0 | run phase 1 of 6, arms raised |
| `BRW.run2.F` | 6 | 380 | 0 | 39 | 61 | 23.5 | 380,0 | run phase 2 of 6, arms raised |
| `BRW.run2.FQ-R` | 7 | 456 | 0 | 40 | 61 | 3.0 | 456,0 | run phase 2 of 6, arms raised |
| `BRW.run2.S-R` | 8 | 532 | 0 | 53 | 59 | 22.0 | 532,0 | run phase 2 of 6, arms raised |
| `BRW.run2.BQ-R` | 9 | 608 | 0 | 45 | 59 | 17.0 | 608,0 | run phase 2 of 6, arms raised |
| `BRW.run2.B` | 10 | 684 | 0 | 37 | 58 | 12.0 | 684,0 | run phase 2 of 6, arms raised |
| `BRW.run3.F` | 11 | 0 | 70 | 37 | 64 | 12.5 | 0,70 | run phase 3 of 6, arms raised |
| `BRW.run3.FQ-R` | 12 | 76 | 70 | 42 | 63 | 18.5 | 76,70 | run phase 3 of 6, arms raised |
| `BRW.run3.S-R` | 13 | 152 | 70 | 63 | 62 | 42.5 | 152,70 | run phase 3 of 6, arms raised |
| `BRW.run3.BQ-R` | 14 | 228 | 70 | 55 | 62 | 37.5 | 228,70 | run phase 3 of 6, arms raised |
| `BRW.run3.B` | 15 | 304 | 70 | 36 | 62 | 23.0 | 304,70 | run phase 3 of 6, arms raised |
| `BRW.run4.F` | 16 | 380 | 70 | 38 | 67 | 14.0 | 380,70 | run phase 4 of 6, arms raised |
| `BRW.run4.FQ-R` | 17 | 456 | 70 | 38 | 67 | 4.5 | 456,70 | run phase 4 of 6, arms raised |
| `BRW.run4.S-R` | 18 | 532 | 70 | 47 | 66 | 9.5 | 532,70 | run phase 4 of 6, arms raised |
| `BRW.run4.BQ-R` | 19 | 608 | 70 | 44 | 66 | 16.5 | 608,70 | run phase 4 of 6, arms raised |
| `BRW.run4.B` | 20 | 684 | 70 | 37 | 65 | 23.0 | 684,70 | run phase 4 of 6, arms raised |
| `BRW.run5.F` | 21 | 0 | 140 | 37 | 68 | 9.0 | 0,140 | run phase 5 of 6, arms raised |
| `BRW.run5.FQ-R` | 22 | 76 | 140 | 52 | 67 | 3.0 | 76,140 | run phase 5 of 6, arms raised |
| `BRW.run5.S-R` | 23 | 152 | 140 | 49 | 66 | 15.0 | 152,140 | run phase 5 of 6, arms raised |
| `BRW.run5.BQ-R` | 24 | 228 | 140 | 36 | 65 | 6.0 | 228,140 | run phase 5 of 6, arms raised |
| `BRW.run5.B` | 25 | 304 | 140 | 36 | 65 | 23.0 | 304,140 | run phase 5 of 6, arms raised |
| `BRW.run6.F` | 26 | 380 | 140 | 35 | 59 | 17.5 | 380,140 | run phase 6 of 6, arms raised |
| `BRW.run6.FQ-R` | 27 | 456 | 140 | 54 | 60 | 42.5 | 456,140 | run phase 6 of 6, arms raised |
| `BRW.run6.S-R` | 28 | 532 | 140 | 62 | 59 | 55.5 | 532,140 | run phase 6 of 6, arms raised |
| `BRW.run6.BQ-R` | 29 | 608 | 140 | 43 | 59 | 31.5 | 608,140 | run phase 6 of 6, arms raised |
| `BRW.run6.B` | 30 | 684 | 140 | 34 | 58 | 14.0 | 684,140 | run phase 6 of 6, arms raised |
| `BRW.pain.1` | 31 | 0 | 209 | 47 | 66 | 23.5 | 0,209 | recoil, arms up |
| `BRW.pain.2` | 32 | 76 | 209 | 37 | 66 | 20.0 | 76,209 | hands to the throat |
| `BRW.pain.3` | 33 | 152 | 209 | 31 | 65 | 15.5 | 152,209 | hands to the throat, hunched |
| `BRW.death.1` | 34 | 228 | 215 | 29 | 59 | 15.0 | 228,209 | clutching the chest (blood) |
| `BRW.death.2` | 35 | 304 | 222 | 29 | 51 | 13.5 | 304,209 | dropping to the knees |
| `BRW.death.3` | 36 | 380 | 225 | 29 | 46 | 13.5 | 380,209 | kneeling low |
| `BRW.death.4` | 37 | 456 | 242 | 31 | 29 | 15.5 | 456,209 | crouched over |
| `BRW.death.5` | 38 | 532 | 258 | 31 | 13 | 14.0 | 532,209 | face down |
| `BRW.death.6` | 39 | 608 | 258 | 31 | 12 | 13.5 | 608,209 | flat on the ground |
| `BRW.armsup.F` | 40 | 684 | 209 | 47 | 67 | 23.5 | 684,209 | arms raised high |
| `BRW.armsup.FQ-R` | 41 | 0 | 279 | 44 | 66 | 16.5 | 0,279 | arms raised high |
| `BRW.armsup.S-R` | 42 | 76 | 279 | 28 | 66 | 8.5 | 76,279 | arms raised high |
| `BRW.armsup.BQ-R` | 43 | 152 | 279 | 40 | 66 | 11.5 | 152,279 | arms raised high |
| `BRW.armsup.B` | 44 | 228 | 279 | 45 | 66 | 18.0 | 228,279 | arms raised high |
| `BRW.ready.F` | 45 | 304 | 279 | 37 | 66 | 21.0 | 304,279 | standing, arms held out low (fight-ready) |
| `BRW.ready.FQ-R` | 46 | 380 | 279 | 37 | 66 | 16.5 | 380,279 | standing, arms held out low (fight-ready) |
| `BRW.ready.S-R` | 47 | 456 | 279 | 25 | 66 | 9.0 | 456,279 | standing, arms held out low (fight-ready) |
| `BRW.ready.BQ-R` | 48 | 532 | 279 | 32 | 66 | 9.5 | 532,279 | standing, arms held out low (fight-ready) |
| `BRW.ready.B` | 49 | 608 | 279 | 37 | 66 | 13.5 | 608,279 | standing, arms held out low (fight-ready) |
| `BRW.idle.F` | 50 | 684 | 279 | 37 | 66 | 21.5 | 684,279 | standing, arms loose |
| `BRW.idle.FQ-R` | 51 | 0 | 349 | 34 | 66 | 15.5 | 0,349 | standing, arms loose |
| `BRW.idle.S-R` | 52 | 76 | 349 | 26 | 66 | 8.5 | 76,349 | standing, arms loose |
| `BRW.idle.BQ-R` | 53 | 152 | 349 | 33 | 66 | 9.0 | 152,349 | standing, arms loose |
| `BRW.idle.B` | 54 | 228 | 349 | 37 | 66 | 13.0 | 228,349 | standing, arms loose |
| `BRW.swipe.F` | 55 | 304 | 349 | 32 | 65 | 17.5 | 304,349 | one arm swung across the body |
| `BRW.swipe.FQ-R` | 56 | 380 | 349 | 34 | 66 | 15.0 | 380,349 | one arm swung across the body |
| `BRW.swipe.S-R` | 57 | 456 | 349 | 29 | 64 | 13.0 | 456,349 | one arm swung across the body |
| `BRW.swipe.BQ-R` | 58 | 532 | 349 | 26 | 64 | 11.0 | 532,349 | one arm swung across the body |
| `BRW.swipe.B` | 59 | 608 | 349 | 38 | 66 | 14.0 | 608,349 | one arm swung across the body |
| `BRW.lunge.F` | 60 | 684 | 349 | 41 | 63 | 24.0 | 684,349 | hunched, both arms reaching forward |
| `BRW.lunge.FQ-R` | 61 | 0 | 419 | 33 | 62 | 14.0 | 0,419 | hunched, both arms reaching forward |
| `BRW.lunge.S-R` | 62 | 76 | 419 | 29 | 62 | 8.0 | 76,419 | hunched, both arms reaching forward |
| `BRW.lunge.BQ-R` | 63 | 152 | 419 | 33 | 62 | 7.5 | 152,419 | hunched, both arms reaching forward |
| `BRW.lunge.B` | 64 | 228 | 419 | 37 | 61 | 13.5 | 228,419 | hunched, both arms reaching forward |
| `BRW.stoop.F` | 65 | 304 | 419 | 26 | 56 | 11.5 | 304,419 | doubled over, head down |
| `BRW.stoop.FQ-R` | 66 | 380 | 419 | 33 | 60 | 9.5 | 380,419 | doubled over, head down |
| `BRW.stoop.S-R` | 67 | 456 | 419 | 38 | 56 | 6.5 | 456,419 | doubled over, head down |
| `BRW.stoop.BQ-R` | 68 | 532 | 419 | 30 | 61 | 7.5 | 532,419 | doubled over, head down |
| `BRW.stoop.B` | 69 | 608 | 419 | 26 | 61 | 13.0 | 608,419 | doubled over, head down |
| `BRW.burst.1` | 70 | 701 | 423 | 46 | 66 | 23.5 | 684,419 | front, chest wound, arms up |
| `BRW.burst.2` | 71 | 9 | 489 | 53 | 70 | 31.5 | 0,489 | chest bursting, ring of blood, small |
| `BRW.burst.3` | 72 | 82 | 500 | 63 | 59 | 35.0 | 76,489 | ring of blood, wide |
| `BRW.burst.4` | 73 | 162 | 500 | 60 | 59 | 23.5 | 152,489 | ring of blood, widest |
| `BRW.burst.5` | 74 | 234 | 498 | 68 | 60 | 31.0 | 228,489 | ring breaking up |
| `BRW.burst.6` | 75 | 306 | 497 | 74 | 62 | 37.0 | 304,489 | last specks, body down |
| `BRW.burst.7` | 76 | 380 | 550 | 76 | 9 | 38.5 | 380,489 | remains on the floor, A |
| `BRW.burst.8` | 77 | 456 | 551 | 76 | 8 | 38.5 | 456,489 | remains on the floor, B |
| `BRW.torn.1` | 78 | 546 | 492 | 47 | 67 | 23.5 | 532,489 | chest torn open, standing, arms up |
| `BRW.torn.2` | 79 | 621 | 493 | 47 | 66 | 24.5 | 608,489 | standing, arms half down |
| `BRW.torn.3` | 80 | 706 | 500 | 32 | 59 | 16.0 | 684,489 | standing, arms down |
| `BRW.torn.4` | 81 | 26 | 578 | 27 | 50 | 11.5 | 0,559 | standing, torn chest, A |
| `BRW.torn.5` | 82 | 102 | 578 | 27 | 50 | 11.5 | 76,559 | standing, torn chest, B |
| `BRW.torn.6` | 83 | 178 | 578 | 27 | 50 | 11.5 | 152,559 | standing, torn chest, C |
| `BRW.torn.7` | 84 | 249 | 582 | 35 | 46 | 16.5 | 228,559 | sagging |
| `BRW.torn.8` | 85 | 327 | 600 | 31 | 28 | 15.5 | 304,559 | kneeling |
| `BRW.torn.9` | 86 | 403 | 615 | 31 | 13 | 14.0 | 380,559 | collapsed, A |
| `BRW.torn.10` | 87 | 480 | 617 | 31 | 11 | 13.5 | 456,559 | collapsed, B |
| `BRW.headless.1` | 88 | 557 | 587 | 28 | 41 | 12.0 | 532,559 | head gone, standing |
| `BRW.headless.2` | 89 | 629 | 590 | 35 | 38 | 16.5 | 608,559 | head gone, sagging |
| `BRW.headless.3` | 90 | 708 | 604 | 31 | 24 | 15.5 | 684,559 | head gone, crouched |
| `BRW.headless.4` | 91 | 23 | 685 | 32 | 13 | 14.5 | 0,628 | head gone, collapsed, A |
| `BRW.headless.5` | 92 | 100 | 687 | 31 | 11 | 14.5 | 76,628 | head gone, collapsed, B |
| `BRW.rise.1` | 93 | 172 | 695 | 18 | 3 | 9.0 | 152,628 | rising up out of the ground, step 1 of 8 |
| `BRW.rise.2` | 94 | 246 | 689 | 23 | 9 | 11.0 | 228,628 | rising up out of the ground, step 2 of 8 |
| `BRW.rise.3` | 95 | 322 | 683 | 36 | 15 | 17.5 | 304,628 | rising up out of the ground, step 3 of 8 |
| `BRW.rise.4` | 96 | 399 | 677 | 44 | 21 | 23.0 | 380,628 | rising up out of the ground, step 4 of 8 |
| `BRW.rise.5` | 97 | 479 | 670 | 41 | 28 | 20.0 | 456,628 | rising up out of the ground, step 5 of 8 |
| `BRW.rise.6` | 98 | 550 | 653 | 41 | 45 | 20.0 | 532,628 | rising up out of the ground, step 6 of 8 |
| `BRW.rise.7` | 99 | 632 | 644 | 34 | 54 | 15.5 | 608,628 | rising up out of the ground, step 7 of 8 |
| `BRW.rise.8` | 100 | 706 | 634 | 37 | 64 | 21.5 | 684,628 | rising up out of the ground, step 8 of 8 |
| `BRW.gore.1` | 101 | 17 | 718 | 42 | 33 | 23.0 | 0,698 | sitting wounded |
| `BRW.gore.2` | 102 | 97 | 724 | 37 | 18 | 15.5 | 76,698 | collapsed on the back |
| `BRW.gore.3` | 103 | 167 | 723 | 43 | 21 | 24.0 | 152,698 | sprawled dead |
| `BRW.tpose` | 104 | 234 | 705 | 66 | 59 | 32.0 | 228,698 | arms spread wide, bloodied (one frame) |

---

## TKW · Woman thug with pistol (camouflage trousers), blurred enlarged copy

| field | value |
|---|---|
| file | `PC-Computer-Tekwar-Female-Thug.png`  (3264×2448 px) |
| preview | `previews/TKW_numbered.png` |
| background | solid green rgb(27,189,16), blurred edges |
| frames | 45 |
| layout | 45 separate figures in four loose rows, in no fixed order. |
| angles | Mixed. Each figure is described one by one below. |
| scale | 430 px standing = 1.7 m → **252.9 px per metre** |
| use | A woman with a pistol: a second body type for an armed enemy. Enough for a guard who stands, aims and shifts between a few poses; not enough for smooth movement. |

**Watch for**

- A blurred, enlarged copy on a green screen, about 5.1 times too big. Cut with **method F** (`20_SLICING_AND_SCALE.md` §4c), then shrink by 5.1, which gives about 50 px per metre. Edges stay soft and a little green.
- Poses and angles were judged by eye from the blurred picture. Check the preview before relying on one.
- No complete walk cycle could be confirmed at any one angle. No death frames.
- Lowest-quality sheet in the set.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `TKW.f01` | 1 | (single) | side, faces left, crouched, pistol arm straight out (aiming) |
| `TKW.f02` | 1 | (single) | side, faces left, crouched, pistol arm bent |
| `TKW.f03` | 1 | (single) | front three-quarter, faces left, crouched, two hands on the pistol |
| `TKW.f04` | 1 | (single) | side, faces left, walking, stride A |
| `TKW.f05` | 1 | (single) | side, faces left, walking, stride B |
| `TKW.f06` | 1 | (single) | side, faces left, crouched, arm forward |
| `TKW.f07` | 1 | (single) | side, faces left, walking, stride C |
| `TKW.f08` | 1 | (single) | front three-quarter, faces left, crouched, pistol low |
| `TKW.f09` | 1 | (single) | back view, standing |
| `TKW.f10` | 1 | (single) | front, standing wide, hand raised to the chest |
| `TKW.f11` | 1 | (single) | back view, standing, B |
| `TKW.f12` | 1 | (single) | front three-quarter, faces left, walking |
| `TKW.f13` | 1 | (single) | front three-quarter, faces left, crouched, pistol up by the face |
| `TKW.f14` | 1 | (single) | back three-quarter, faces left, crouched, pistol low |
| `TKW.f15` | 1 | (single) | back three-quarter, faces left, crouched, arm out |
| `TKW.f16` | 1 | (single) | back three-quarter, walking, stride A |
| `TKW.f17` | 1 | (single) | back three-quarter, walking, stride B |
| `TKW.f18` | 1 | (single) | front three-quarter, walking, arm swinging |
| `TKW.f19` | 1 | (single) | back three-quarter, faces left, pistol raised |
| `TKW.f20` | 1 | (single) | front, walking, stride A |
| `TKW.f21` | 1 | (single) | front, walking, stride B |
| `TKW.f22` | 1 | (single) | front, crouched wide, gun held across the body |
| `TKW.f23` | 1 | (single) | front, walking, stride C |
| `TKW.f24` | 1 | (single) | back view, walking |
| `TKW.f25` | 1 | (single) | front, standing wide, arms low |
| `TKW.f26` | 1 | (single) | front, crouched, pistol up at the face, pointing at the camera (aiming) |
| `TKW.f27` | 1 | (single) | front three-quarter, standing |
| `TKW.f28` | 1 | (single) | front, walking, stride D |
| `TKW.f29` | 1 | (single) | back view, standing wide |
| `TKW.f30` | 1 | (single) | back view, walking, B |
| `TKW.f31` | 1 | (single) | back three-quarter, walking, stride C |
| `TKW.f32` | 1 | (single) | back three-quarter, faces left, crouched, pistol arm straight out (aiming) |
| `TKW.f33` | 1 | (single) | back view, walking, C |
| `TKW.f34` | 1 | (single) | back view, standing wide, arm bent |
| `TKW.f35` | 1 | (single) | front, standing |
| `TKW.f36` | 1 | (single) | front three-quarter, standing, hand at the hip |
| `TKW.f37` | 1 | (single) | back view, standing wide, hands up behind the head |
| `TKW.f38` | 1 | (single) | back view, shoulders raised, hands up |
| `TKW.f39` | 1 | (single) | front three-quarter, faces right, standing |
| `TKW.f40` | 1 | (single) | side, faces right, standing |
| `TKW.f41` | 1 | (single) | side, faces right, walking, gun near the chest |
| `TKW.f42` | 1 | (single) | side, faces right, standing, B |
| `TKW.f43` | 1 | (single) | back three-quarter, faces right, standing |
| `TKW.f44` | 1 | (single) | side, faces right, standing, C |
| `TKW.f45` | 1 | (single) | side, faces right, standing, D |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `TKW.f01` | 1 | 75 | 166 | 224 | 433 | 161.5 | side, faces left, crouched, pistol arm straight out (aiming) |
| `TKW.f02` | 2 | 352 | 166 | 224 | 426 | 161.5 | side, faces left, crouched, pistol arm bent |
| `TKW.f03` | 3 | 629 | 166 | 210 | 433 | 143.5 | front three-quarter, faces left, crouched, two hands on the pistol |
| `TKW.f04` | 4 | 893 | 166 | 194 | 426 | 96.0 | side, faces left, walking, stride A |
| `TKW.f05` | 5 | 1142 | 166 | 194 | 424 | 95.5 | side, faces left, walking, stride B |
| `TKW.f06` | 6 | 1390 | 166 | 192 | 461 | 140.0 | side, faces left, crouched, arm forward |
| `TKW.f07` | 7 | 1637 | 166 | 173 | 424 | 81.5 | side, faces left, walking, stride C |
| `TKW.f08` | 8 | 1863 | 166 | 171 | 464 | 101.0 | front three-quarter, faces left, crouched, pistol low |
| `TKW.f09` | 9 | 2088 | 166 | 172 | 429 | 99.0 | back view, standing |
| `TKW.f10` | 10 | 2312 | 166 | 164 | 451 | 101.5 | front, standing wide, hand raised to the chest |
| `TKW.f11` | 11 | 2530 | 166 | 162 | 426 | 110.5 | back view, standing, B |
| `TKW.f12` | 12 | 2744 | 166 | 160 | 430 | 89.0 | front three-quarter, faces left, walking |
| `TKW.f13` | 13 | 2960 | 166 | 150 | 461 | 89.5 | front three-quarter, faces left, crouched, pistol up by the face |
| `TKW.f14` | 14 | 75 | 651 | 191 | 472 | 109.0 | back three-quarter, faces left, crouched, pistol low |
| `TKW.f15` | 15 | 317 | 651 | 188 | 430 | 115.5 | back three-quarter, faces left, crouched, arm out |
| `TKW.f16` | 16 | 558 | 651 | 184 | 419 | 109.0 | back three-quarter, walking, stride A |
| `TKW.f17` | 17 | 798 | 651 | 181 | 428 | 131.5 | back three-quarter, walking, stride B |
| `TKW.f18` | 18 | 1034 | 645 | 178 | 422 | 120.0 | front three-quarter, walking, arm swinging |
| `TKW.f19` | 19 | 1264 | 680 | 176 | 470 | 95.0 | back three-quarter, faces left, pistol raised |
| `TKW.f20` | 20 | 1492 | 680 | 173 | 452 | 99.0 | front, walking, stride A |
| `TKW.f21` | 21 | 1717 | 682 | 166 | 446 | 70.5 | front, walking, stride B |
| `TKW.f22` | 22 | 1934 | 682 | 166 | 434 | 88.0 | front, crouched wide, gun held across the body |
| `TKW.f23` | 23 | 2153 | 670 | 159 | 451 | 87.0 | front, walking, stride C |
| `TKW.f24` | 24 | 2367 | 670 | 157 | 424 | 61.0 | back view, walking |
| `TKW.f25` | 25 | 2577 | 649 | 152 | 451 | 86.5 | front, standing wide, arms low |
| `TKW.f26` | 26 | 2783 | 680 | 142 | 420 | 78.5 | front, crouched, pistol up at the face, pointing at the camera (aiming) |
| `TKW.f27` | 27 | 2979 | 680 | 119 | 445 | 63.5 | front three-quarter, standing |
| `TKW.f28` | 28 | 75 | 1175 | 185 | 448 | 121.5 | front, walking, stride D |
| `TKW.f29` | 29 | 319 | 1134 | 180 | 446 | 70.5 | back view, standing wide |
| `TKW.f30` | 30 | 558 | 1125 | 181 | 430 | 69.5 | back view, walking, B |
| `TKW.f31` | 31 | 791 | 1131 | 175 | 414 | 90.0 | back three-quarter, walking, stride C |
| `TKW.f32` | 32 | 1022 | 1131 | 175 | 441 | 103.0 | back three-quarter, faces left, crouched, pistol arm straight out (aiming) |
| `TKW.f33` | 33 | 1249 | 1204 | 175 | 437 | 77.5 | back view, walking, C |
| `TKW.f34` | 34 | 1493 | 1185 | 165 | 432 | 71.0 | back view, standing wide, arm bent |
| `TKW.f35` | 35 | 1711 | 1185 | 160 | 430 | 93.5 | front, standing |
| `TKW.f36` | 36 | 1935 | 1168 | 155 | 481 | 91.0 | front three-quarter, standing, hand at the hip |
| `TKW.f37` | 37 | 2147 | 1175 | 150 | 423 | 69.5 | back view, standing wide, hands up behind the head |
| `TKW.f38` | 38 | 2368 | 1147 | 151 | 424 | 69.5 | back view, shoulders raised, hands up |
| `TKW.f39` | 39 | 2571 | 1154 | 119 | 433 | 62.5 | front three-quarter, faces right, standing |
| `TKW.f40` | 40 | 2745 | 1154 | 113 | 420 | 56.0 | side, faces right, standing |
| `TKW.f41` | 41 | 2910 | 1179 | 106 | 470 | 54.5 | side, faces right, walking, gun near the chest |
| `TKW.f42` | 42 | 3070 | 1179 | 102 | 438 | 60.5 | side, faces right, standing, B |
| `TKW.f43` | 43 | 75 | 1677 | 103 | 418 | 67.5 | back three-quarter, faces right, standing |
| `TKW.f44` | 44 | 231 | 1677 | 96 | 436 | 64.5 | side, faces right, standing, C |
| `TKW.f45` | 45 | 380 | 1633 | 90 | 459 | 58.5 | side, faces right, standing, D |

