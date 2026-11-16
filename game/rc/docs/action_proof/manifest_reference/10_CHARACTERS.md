# 10 · Characters (people and pods)

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

Every person-shaped sprite. **First batch:** two gunmen, the player body, the girl in two sizes, the pod sequence, the variants sheet. **Third batch (hostile characters, added in v1.1, detailed in `18_MORE_ENEMIES.md`):** a gunman in eleven colours, a hat gunman and a bomb carrier, an armoured bruiser, a masked knife man, a brawler, a woman with a pistol. For how to cut, key and scale, see `20_SLICING_AND_SCALE.md`.

**Angle codes.** `F` front (faces the camera) · `FQ` front three-quarter · `S` side · `BQ` back three-quarter · `B` back. A suffix says which way the figure faces **in the source picture**: `-L` = toward the left edge, `-R` = toward the right edge. Mirror a picture to get the opposite direction.

**Columns.** `id` = the manifest ID. `#` = the number drawn on that sheet's preview image in `previews/`. `x y w h` = tight rectangle in pixels in the original image, origin top-left. `ax` = where the feet centre sits, in pixels from the rectangle's left edge: stand the sprite on the floor at this point.

## Quick comparison

| code | what | frames | original file | size | background | standing height | px per metre |
|---|---|---|---|---|---|---|---|
| GNP | Gunman, pistol (grey jacket, helmet) | 63 | `19857.png` | 699×1029 | solid colour rgb(0, 255, 255) | 94 px | 52.2 |
| GNR | Gunman, rifle (long coat, sunglasses) | 35 | `dm54n38-e8f0900b-c660-4192-b158-858426919e1c.png` | 500×700 | transparent | 90 px | 48.6 |
| PLB | Player body (tan shirtless humanoid) | 63 | `iH9foXw.png` | 756×1044 | transparent | 107 px | 59.4 |
| GRL | Girl NPC, large sheet (blue bikini) | 53 | `girl1bikini.png` | 1200×744 | transparent | 118 px | 67.4 |
| GRS | Girl NPC, small sheet (same poses, lower resolution, different death row) | 53 | `446-4468753_npc-girl-sprites-duke-png-download-sprite-woman.png` | 860×593 | solid colour rgb(247, 247, 247) | 82 px | 46.9 |
| POD | Pod capture sequence (woman + tall green pod) | 12 | `standinganimation_copy.png` | 800×588 | transparent | 135 px | 77.1 |
| GV2 | Girl variants and four pod types (small original-scale sprites) | 23 | `dukevar2.png` | 469×1117 | solid colour rgb(255, 255, 255) | 88 px | 50.3 |
| GNC | Gunman in 11 shirt colours (pistol in one hand, launcher in the other) | 946 | `24175.png` | 2945×3304 | cyan rgb(0,255,255) cells with teal rgb(0,128,128) grid lines and labels | 87 px | 48.3 |
| SWN | Hat gunman (black suit, blue hat, submachine gun): runs, dives, jumps, crawls, climbs | 144 | `png-clipart-shadow-warrior-sprite-calligraphy-word-search-shadow-warrior-angle-text.png` | 900×2123 | grey-and-white checkerboard painted into the picture (15 px squares) | 82 px | 46.9 |
| SWC | Bomb carrier (blue robe, straw hat, explosive box on a pole) | 44 | `png-clipart-shadow-warrior-sprite-calligraphy-word-search-shadow-warrior-angle-text.png` | 900×2123 | grey-and-white checkerboard painted into the picture (15 px squares) | 82 px | 46.9 |
| ARM | Armoured bruiser (chrome helmet and armour, unarmed): walks, runs, punches | 96 | `png-clipart-playstation-sprite-pokemon-black-white-personal-computer-video-game-sprite-angle-electronics.png` | 900×2193 | grey-and-white checkerboard painted into the picture (15 px squares) | 117 px | 61.6 |
| MSK | Masked knife man (white mask, black suit) | 128 | `ShQs6Dx.png` | 1000×1950 | transparent | 125 px | 69.4 |
| BRW | Bare-chested brawler (same pose set as the player body, plus attack poses) | 104 | `cTL66td_d.webp` | 760×768 | transparent, soft edges | 66 px | 36.7 |
| TKW | Woman thug with pistol (camouflage trousers), blurred enlarged copy | 45 | `PC-Computer-Tekwar-Female-Thug.png` | 3264×2448 | solid green rgb(27,189,16), blurred edges | 430 px | 252.9 |

`px per metre` assumes the heights in `20_SLICING_AND_SCALE.md` §5. Draw every sprite at its own figure, so a 1.8 m man is 1.8 m tall whatever sheet he came from.

The seven third-batch characters are detailed in `18_MORE_ENEMIES.md`; the comparison table above covers all fourteen.

---

## GNP · Gunman, pistol (grey jacket, helmet)

| field | value |
|---|---|
| file | `19857.png`  (699×1029 px) |
| preview | `previews/GNP_numbered.png` |
| background | solid colour rgb(0, 255, 255) |
| frames | 63 |
| layout | 10 rows, uneven spacing. Use the rectangles below; do not assume a grid. |
| angles | All 8 directions are drawn (order across each row: F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R). No mirroring needed. |
| scale | 94 px standing = 1.8 m → **52.2 px per metre** |
| use | Pistol gunman. Stands and walks in 8 directions, fires from the front, has hit and death sets with and without blood, and a five-frame get-up-off-the-floor set. Which behaviour he gets is a design choice, not a property of the art (`03_MATRICES.md` M9). |

**Watch for**

- Background is solid cyan `rgb(0,255,255)`, not transparent. Delete every cyan pixel (see `20_SLICING_AND_SCALE.md` method B); nothing on the figure is cyan.
- The sheet carries text labels, a large black brace and a grey credit box. None are art. Their rectangles are excluded from every frame below: (366,36)-(402,60), (500,150)-(668,452), (414,520)-(699,692), (198,548)-(382,576), (388,690)-(516,716), (388,786)-(508,812), (376,862)-(444,890), (148,958)-(196,984).
- `fire` exists from the front only. When firing, turn the card to face the player.
- No run cycle. Use `walk1..4` played faster.
- Left sleeve carries a pale armband with a small dark emblem (a few pixels). Check it suits the game; paint over if not.
- `hurt` and `death` come in two versions, with and without blood. Pick one version and use it throughout.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GNP.idle` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | standing, pistol lowered |
| `GNP.walk1` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 1 |
| `GNP.walk2` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 2 (full stride) |
| `GNP.walk3` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 3 (pistol visibly in hand) |
| `GNP.walk4` | 8 | F, FQ-L, S-L, BQ-L, B, BQ-R, S-R, FQ-R | walk phase 4 (full stride, pistol in hand) |
| `GNP.hurt` | 4 | 1, 2, 3, 4 | hit reaction A, no blood … hit reaction B, with blood |
| `GNP.death_clean` | 5 | 1, 2, 3, 4, 5 | struck, pistol flies from hand (no blood) … lying dead (no blood) |
| `GNP.death_blood` | 5 | 1, 2, 3, 4, 5 | struck, pistol flies from hand (with blood) … lying dead (with blood) |
| `GNP.rise` | 5 | 1, 2, 3, 4, 5 | lying face down (playing dead or prone) … standing, pistol raised at camera |
| `GNP.fire` | 4 | 1, 2, 3, 4 | standing ready, pistol low … aiming, after shot |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `GNP.idle.F` | 1 | 7 | 8 | 37 | 94 | 17.5 | standing, pistol lowered |
| `GNP.idle.FQ-L` | 2 | 59 | 8 | 33 | 94 | 14.5 | standing, pistol lowered |
| `GNP.idle.S-L` | 3 | 115 | 8 | 23 | 94 | 10.5 | standing, pistol lowered |
| `GNP.idle.BQ-L` | 4 | 155 | 9 | 32 | 94 | 14.0 | standing, pistol lowered |
| `GNP.idle.B` | 5 | 199 | 9 | 37 | 93 | 16.0 | standing, pistol lowered |
| `GNP.idle.BQ-R` | 6 | 247 | 8 | 33 | 93 | 15.0 | standing, pistol lowered |
| `GNP.idle.S-R` | 7 | 292 | 10 | 23 | 93 | 10.5 | standing, pistol lowered |
| `GNP.idle.FQ-R` | 8 | 329 | 10 | 30 | 93 | 16.0 | standing, pistol lowered |
| `GNP.walk1.F` | 9 | 5 | 111 | 39 | 93 | 16.0 | walk phase 1 |
| `GNP.walk1.FQ-L` | 10 | 56 | 112 | 30 | 94 | 12.0 | walk phase 1 |
| `GNP.walk1.S-L` | 11 | 98 | 113 | 33 | 94 | 21.5 | walk phase 1 |
| `GNP.walk1.BQ-L` | 12 | 143 | 113 | 37 | 94 | 21.0 | walk phase 1 |
| `GNP.walk1.B` | 13 | 189 | 113 | 37 | 93 | 19.0 | walk phase 1 |
| `GNP.walk1.BQ-R` | 14 | 240 | 115 | 28 | 92 | 13.0 | walk phase 1 |
| `GNP.walk1.S-R` | 15 | 281 | 116 | 32 | 90 | 11.5 | walk phase 1 |
| `GNP.walk1.FQ-R` | 16 | 322 | 115 | 37 | 91 | 14.0 | walk phase 1 |
| `GNP.walk2.F` | 17 | 6 | 216 | 38 | 93 | 15.5 | walk phase 2 (full stride) |
| `GNP.walk2.FQ-L` | 18 | 55 | 217 | 47 | 91 | 23.0 | walk phase 2 (full stride) |
| `GNP.walk2.S-L` | 19 | 111 | 220 | 58 | 90 | 30.0 | walk phase 2 (full stride) |
| `GNP.walk2.BQ-L` | 20 | 175 | 218 | 47 | 94 | 32.0 | walk phase 2 (full stride) |
| `GNP.walk2.B` | 21 | 235 | 219 | 37 | 92 | 17.5 | walk phase 2 (full stride) |
| `GNP.walk2.BQ-R` | 22 | 283 | 219 | 47 | 91 | 23.0 | walk phase 2 (full stride) |
| `GNP.walk2.S-R` | 23 | 342 | 220 | 57 | 90 | 27.0 | walk phase 2 (full stride) |
| `GNP.walk2.FQ-R` | 24 | 413 | 220 | 47 | 92 | 20.5 | walk phase 2 (full stride) |
| `GNP.walk3.F` | 25 | 8 | 323 | 38 | 92 | 19.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.FQ-L` | 26 | 55 | 323 | 48 | 91 | 32.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.S-L` | 27 | 111 | 322 | 38 | 93 | 28.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.BQ-L` | 28 | 165 | 324 | 28 | 92 | 14.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.B` | 29 | 202 | 322 | 37 | 93 | 16.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.BQ-R` | 30 | 248 | 324 | 47 | 94 | 14.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.S-R` | 31 | 301 | 325 | 43 | 92 | 11.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk3.FQ-R` | 32 | 356 | 325 | 27 | 93 | 12.0 | walk phase 3 (pistol visibly in hand) |
| `GNP.walk4.F` | 33 | 6 | 429 | 36 | 93 | 19.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.FQ-L` | 34 | 53 | 430 | 56 | 92 | 32.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.S-L` | 35 | 118 | 429 | 54 | 90 | 26.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.BQ-L` | 36 | 184 | 429 | 48 | 90 | 23.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.B` | 37 | 242 | 427 | 38 | 93 | 18.0 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.BQ-R` | 38 | 290 | 426 | 55 | 94 | 17.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.S-R` | 39 | 356 | 429 | 56 | 90 | 26.5 | walk phase 4 (full stride, pistol in hand) |
| `GNP.walk4.FQ-R` | 40 | 425 | 427 | 47 | 92 | 23.0 | walk phase 4 (full stride, pistol in hand) |
| `GNP.hurt.1` | 41 | 6 | 530 | 40 | 88 | 20.0 | hit reaction A, no blood |
| `GNP.hurt.2` | 42 | 58 | 533 | 37 | 87 | 20.0 | hit reaction B, no blood |
| `GNP.hurt.3` | 43 | 107 | 533 | 40 | 88 | 20.0 | hit reaction A, with blood |
| `GNP.hurt.4` | 44 | 154 | 534 | 37 | 87 | 20.0 | hit reaction B, with blood |
| `GNP.death_clean.1` | 45 | 7 | 632 | 56 | 86 | 38.0 | struck, pistol flies from hand (no blood) |
| `GNP.death_clean.2` | 46 | 75 | 638 | 55 | 80 | 41.0 | staggering back (no blood) |
| `GNP.death_clean.3` | 47 | 147 | 663 | 60 | 56 | 40.0 | dropping to knees (no blood) |
| `GNP.death_clean.4` | 48 | 218 | 681 | 79 | 42 | 38.5 | falling flat (no blood) |
| `GNP.death_clean.5` | 49 | 308 | 695 | 76 | 21 | 34.5 | lying dead (no blood) |
| `GNP.death_blood.1` | 50 | 7 | 728 | 56 | 86 | 38.0 | struck, pistol flies from hand (with blood) |
| `GNP.death_blood.2` | 51 | 75 | 734 | 55 | 80 | 41.0 | staggering back (with blood) |
| `GNP.death_blood.3` | 52 | 147 | 759 | 60 | 56 | 40.0 | dropping to knees (with blood) |
| `GNP.death_blood.4` | 53 | 218 | 777 | 79 | 42 | 38.5 | falling flat (with blood) |
| `GNP.death_blood.5` | 54 | 308 | 791 | 76 | 21 | 38.0 | lying dead (with blood) |
| `GNP.rise.1` | 55 | 12 | 886 | 57 | 28 | 22.5 | lying face down (playing dead or prone) |
| `GNP.rise.2` | 56 | 81 | 869 | 60 | 50 | 29.5 | pushing up, pistol out |
| `GNP.rise.3` | 57 | 159 | 864 | 54 | 54 | 18.5 | crouched |
| `GNP.rise.4` | 58 | 232 | 860 | 49 | 58 | 24.0 | crouched, facing camera |
| `GNP.rise.5` | 59 | 309 | 835 | 53 | 87 | 26.0 | standing, pistol raised at camera |
| `GNP.fire.1` | 60 | 5 | 931 | 35 | 90 | 18.0 | standing ready, pistol low |
| `GNP.fire.2` | 61 | 51 | 930 | 24 | 93 | 11.0 | aiming at camera |
| `GNP.fire.3` | 62 | 88 | 930 | 24 | 93 | 11.0 | firing, muzzle flash |
| `GNP.fire.4` | 63 | 121 | 930 | 24 | 93 | 11.0 | aiming, after shot |

---

## GNR · Gunman, rifle (long coat, sunglasses)

| field | value |
|---|---|
| file | `dm54n38-e8f0900b-c660-4192-b158-858426919e1c.png`  (500×700 px) |
| preview | `previews/GNR_numbered.png` |
| background | transparent |
| frames | 35 |
| layout | Perfect grid: 5 columns × 7 rows, every cell 100×100. Cell origin = ((col−1)×100, (row−1)×100). |
| angles | 5 directions drawn (columns: F, FQ-L, S-L, BQ-L, B). Mirror FQ-L, S-L, BQ-L to get the three right-facing views. |
| scale | 90 px standing = 1.85 m → **48.6 px per metre** |
| use | Rifle gunman. Runs and fires at five angles. Which behaviour he gets is a design choice, not a property of the art (`03_MATRICES.md` M9). |

**Watch for**

- No separate hit-reaction frames. Use `death.1` as the flinch.
- No walk cycle, only a run. Slow the run for walking.
- The coat is very dark. On a dark room it loses its outline; a thin lighter outline or a brighter floor behind helps.
- For steady animation, paste each frame at its cell position, not its tight rectangle, so the feet do not jitter.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GNR.run1` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 1 |
| `GNR.run2` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 2 |
| `GNR.run3` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 3 |
| `GNR.run4` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 4 |
| `GNR.aim` | 5 | F, FQ-L, S-L, BQ-L, B | standing, rifle levelled |
| `GNR.fire` | 5 | F, FQ-L, S-L, BQ-L, B | firing, muzzle flash |
| `GNR.death` | 5 | 1, 2, 3, 4, 5 | hit, arms flung out, still standing … lying dead |

**Frames**

| id | # | x | y | w | h | ax | cell x,y | shows |
|---|---|---|---|---|---|---|---|---|
| `GNR.run1.F` | 1 | 29 | 6 | 43 | 88 | 22.5 | 0,0 | run phase 1 |
| `GNR.run1.FQ-L` | 2 | 112 | 6 | 76 | 88 | 49.0 | 100,0 | run phase 1 |
| `GNR.run1.S-L` | 3 | 209 | 6 | 82 | 88 | 51.5 | 200,0 | run phase 1 |
| `GNR.run1.BQ-L` | 4 | 325 | 6 | 50 | 88 | 29.5 | 300,0 | run phase 1 |
| `GNR.run1.B` | 5 | 429 | 6 | 42 | 88 | 18.0 | 400,0 | run phase 1 |
| `GNR.run2.F` | 6 | 28 | 104 | 44 | 92 | 14.0 | 0,100 | run phase 2 |
| `GNR.run2.FQ-L` | 7 | 115 | 104 | 70 | 92 | 45.5 | 100,100 | run phase 2 |
| `GNR.run2.S-L` | 8 | 211 | 104 | 78 | 92 | 58.5 | 200,100 | run phase 2 |
| `GNR.run2.BQ-L` | 9 | 323 | 104 | 54 | 92 | 43.0 | 300,100 | run phase 2 |
| `GNR.run2.B` | 10 | 430 | 104 | 40 | 92 | 26.0 | 400,100 | run phase 2 |
| `GNR.run3.F` | 11 | 32 | 206 | 39 | 88 | 21.0 | 0,200 | run phase 3 |
| `GNR.run3.FQ-L` | 12 | 116 | 206 | 68 | 88 | 51.0 | 100,200 | run phase 3 |
| `GNR.run3.S-L` | 13 | 209 | 206 | 82 | 88 | 53.0 | 200,200 | run phase 3 |
| `GNR.run3.BQ-L` | 14 | 320 | 206 | 60 | 88 | 32.0 | 300,200 | run phase 3 |
| `GNR.run3.B` | 15 | 430 | 206 | 40 | 88 | 20.0 | 400,200 | run phase 3 |
| `GNR.run4.F` | 16 | 28 | 304 | 43 | 92 | 33.0 | 0,300 | run phase 4 |
| `GNR.run4.FQ-L` | 17 | 120 | 304 | 60 | 92 | 52.5 | 100,300 | run phase 4 |
| `GNR.run4.S-L` | 18 | 213 | 304 | 74 | 92 | 51.5 | 200,300 | run phase 4 |
| `GNR.run4.BQ-L` | 19 | 320 | 304 | 59 | 92 | 26.5 | 300,300 | run phase 4 |
| `GNR.run4.B` | 20 | 429 | 304 | 41 | 92 | 9.5 | 400,300 | run phase 4 |
| `GNR.aim.F` | 21 | 28 | 405 | 43 | 90 | 23.5 | 0,400 | standing, rifle levelled |
| `GNR.aim.FQ-L` | 22 | 121 | 405 | 58 | 90 | 44.5 | 100,400 | standing, rifle levelled |
| `GNR.aim.S-L` | 23 | 214 | 405 | 72 | 90 | 48.0 | 200,400 | standing, rifle levelled |
| `GNR.aim.BQ-L` | 24 | 325 | 405 | 50 | 90 | 24.5 | 300,400 | standing, rifle levelled |
| `GNR.aim.B` | 25 | 430 | 405 | 40 | 90 | 17.5 | 400,400 | standing, rifle levelled |
| `GNR.fire.F` | 26 | 30 | 505 | 46 | 90 | 26.5 | 0,500 | firing, muzzle flash |
| `GNR.fire.FQ-L` | 27 | 113 | 505 | 78 | 90 | 64.5 | 100,500 | firing, muzzle flash |
| `GNR.fire.S-L` | 28 | 207 | 505 | 91 | 90 | 67.0 | 200,500 | firing, muzzle flash |
| `GNR.fire.BQ-L` | 29 | 318 | 505 | 67 | 90 | 41.5 | 300,500 | firing, muzzle flash |
| `GNR.fire.B` | 30 | 424 | 505 | 42 | 90 | 17.5 | 400,500 | firing, muzzle flash |
| `GNR.death.1` | 31 | 15 | 608 | 69 | 83 | 43.0 | 0,600 | hit, arms flung out, still standing |
| `GNR.death.2` | 32 | 113 | 604 | 74 | 92 | 51.0 | 100,600 | staggering |
| `GNR.death.3` | 33 | 210 | 612 | 81 | 75 | 33.0 | 200,600 | knees buckling |
| `GNR.death.4` | 34 | 325 | 618 | 50 | 64 | 25.5 | 300,600 | on knees |
| `GNR.death.5` | 35 | 411 | 638 | 78 | 24 | 16.0 | 400,600 | lying dead |

---

## PLB · Player body (tan shirtless humanoid)

| field | value |
|---|---|
| file | `iH9foXw.png`  (756×1044 px) |
| preview | `previews/PLB_numbered.png` |
| background | transparent |
| frames | 63 |
| layout | Perfect grid: 7 columns × 9 rows, every cell 108×116. Sets run in groups of five angles that **continue across row ends** (a group can start at column 4 and finish on the next row). |
| angles | 5 directions drawn (F, FQ-R, S-R, BQ-R, B). Mirror the three right-facing views for the left. |
| scale | 107 px standing = 1.8 m → **59.4 px per metre** |
| use | The player seen from outside. In a first-person game this is only needed for a death camera, a shadow or reflection, a HUD figure, or a third-person mode. The brawler sheet `BRW` is the same figure with more poses. |

**Watch for**

- There are no punch or kick frames for the body. `armsup` and `ready` are the nearest attack poses.
- `shock` is a grey-blue skeleton figure, one pose in five angles. Flash it for a few frames when the player is hit by electricity or frozen.
- Six pixels touch the grid lines in total; harmless.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `PLB.tpose` | 1 | (single) | arms spread wide, bloodied (one frame) |
| `PLB.gore` | 3 | 1, 2, 3 | sitting wounded (gory death variant) … sprawled dead (gory death variant) |
| `PLB.shock` | 5 | F, FQ-R, S-R, BQ-R, B | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.run1` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 1 of 6, arms raised |
| `PLB.run2` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 2 of 6, arms raised |
| `PLB.run3` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 3 of 6, arms raised |
| `PLB.run4` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 4 of 6, arms raised |
| `PLB.run5` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 5 of 6, arms raised |
| `PLB.run6` | 5 | F, FQ-R, S-R, BQ-R, B | run phase 6 of 6, arms raised |
| `PLB.pain` | 3 | 1, 2, 3 | recoil, arms out, blood at throat … hands to throat, hunched |
| `PLB.death` | 6 | 1, 2, 3, 4, 5, 6 | clutching chest … flat on ground |
| `PLB.armsup` | 5 | F, FQ-R, S-R, BQ-R, B | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.ready` | 5 | F, FQ-R, S-R, BQ-R, B | standing, arms held out low (fight-ready) |
| `PLB.idle` | 5 | F, FQ-R, S-R, BQ-R, B | standing relaxed |

**Frames**

| id | # | x | y | w | h | ax | cell x,y | shows |
|---|---|---|---|---|---|---|---|---|
| `PLB.tpose` | 1 | 0 | 10 | 108 | 96 | 53.5 | 0,0 | arms spread wide, bloodied (one frame) |
| `PLB.gore.1` | 2 | 128 | 31 | 69 | 55 | 37.5 | 108,0 | sitting wounded (gory death variant) |
| `PLB.gore.2` | 3 | 240 | 44 | 60 | 29 | 25.5 | 216,0 | collapsed on back (gory death variant) |
| `PLB.gore.3` | 4 | 343 | 42 | 71 | 33 | 39.0 | 324,0 | sprawled dead (gory death variant) |
| `PLB.shock.F` | 5 | 452 | 5 | 68 | 106 | 35.0 | 432,0 | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.shock.FQ-R` | 6 | 560 | 5 | 68 | 106 | 35.0 | 540,0 | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.shock.S-R` | 7 | 674 | 6 | 56 | 105 | 35.5 | 648,0 | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.shock.BQ-R` | 8 | 21 | 122 | 66 | 105 | 32.5 | 0,116 | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.shock.B` | 9 | 130 | 121 | 64 | 106 | 33.5 | 108,116 | skeleton-flash figure (electrocuted or frozen look) |
| `PLB.run1.F` | 10 | 237 | 117 | 66 | 113 | 37.5 | 216,116 | run phase 1 of 6, arms raised |
| `PLB.run1.FQ-R` | 11 | 341 | 118 | 74 | 112 | 26.0 | 324,116 | run phase 1 of 6, arms raised |
| `PLB.run1.S-R` | 12 | 456 | 119 | 61 | 110 | 12.0 | 432,116 | run phase 1 of 6, arms raised |
| `PLB.run1.BQ-R` | 13 | 565 | 120 | 59 | 108 | 6.5 | 540,116 | run phase 1 of 6, arms raised |
| `PLB.run1.B` | 14 | 669 | 121 | 66 | 107 | 24.0 | 648,116 | run phase 1 of 6, arms raised |
| `PLB.run2.F` | 15 | 23 | 233 | 63 | 100 | 39.0 | 0,232 | run phase 2 of 6, arms raised |
| `PLB.run2.FQ-R` | 16 | 129 | 238 | 66 | 99 | 5.0 | 108,232 | run phase 2 of 6, arms raised |
| `PLB.run2.S-R` | 17 | 227 | 237 | 87 | 97 | 4.0 | 216,232 | run phase 2 of 6, arms raised |
| `PLB.run2.BQ-R` | 18 | 342 | 238 | 73 | 96 | 28.5 | 324,232 | run phase 2 of 6, arms raised |
| `PLB.run2.B` | 19 | 456 | 237 | 61 | 94 | 20.0 | 432,232 | run phase 2 of 6, arms raised |
| `PLB.run3.F` | 20 | 564 | 234 | 60 | 104 | 21.0 | 540,232 | run phase 3 of 6, arms raised |
| `PLB.run3.FQ-R` | 21 | 668 | 239 | 68 | 103 | 30.5 | 648,232 | run phase 3 of 6, arms raised |
| `PLB.run3.S-R` | 22 | 3 | 354 | 103 | 102 | 70.0 | 0,348 | run phase 3 of 6, arms raised |
| `PLB.run3.BQ-R` | 23 | 117 | 355 | 90 | 102 | 61.0 | 108,348 | run phase 3 of 6, arms raised |
| `PLB.run3.B` | 24 | 241 | 353 | 59 | 102 | 38.0 | 216,348 | run phase 3 of 6, arms raised |
| `PLB.run4.F` | 25 | 347 | 351 | 62 | 110 | 23.0 | 324,348 | run phase 4 of 6, arms raised |
| `PLB.run4.FQ-R` | 26 | 455 | 352 | 62 | 109 | 7.5 | 432,348 | run phase 4 of 6, arms raised |
| `PLB.run4.S-R` | 27 | 556 | 352 | 77 | 108 | 16.0 | 540,348 | run phase 4 of 6, arms raised |
| `PLB.run4.BQ-R` | 28 | 667 | 352 | 71 | 108 | 27.5 | 648,348 | run phase 4 of 6, arms raised |
| `PLB.run4.B` | 29 | 24 | 469 | 60 | 106 | 38.0 | 0,464 | run phase 4 of 6, arms raised |
| `PLB.run5.F` | 30 | 132 | 466 | 61 | 112 | 15.0 | 108,464 | run phase 5 of 6, arms raised |
| `PLB.run5.FQ-R` | 31 | 228 | 467 | 84 | 110 | 5.0 | 216,464 | run phase 5 of 6, arms raised |
| `PLB.run5.S-R` | 32 | 339 | 468 | 80 | 108 | 24.5 | 324,464 | run phase 5 of 6, arms raised |
| `PLB.run5.BQ-R` | 33 | 457 | 469 | 58 | 106 | 10.5 | 432,464 | run phase 5 of 6, arms raised |
| `PLB.run5.B` | 34 | 565 | 468 | 58 | 106 | 38.0 | 540,464 | run phase 5 of 6, arms raised |
| `PLB.run6.F` | 35 | 674 | 464 | 57 | 97 | 29.0 | 648,464 | run phase 6 of 6, arms raised |
| `PLB.run6.FQ-R` | 36 | 10 | 583 | 88 | 98 | 70.0 | 0,580 | run phase 6 of 6, arms raised |
| `PLB.run6.S-R` | 37 | 112 | 585 | 101 | 97 | 91.0 | 108,580 | run phase 6 of 6, arms raised |
| `PLB.run6.BQ-R` | 38 | 235 | 586 | 70 | 97 | 51.5 | 216,580 | run phase 6 of 6, arms raised |
| `PLB.run6.B` | 39 | 350 | 585 | 56 | 96 | 23.5 | 324,580 | run phase 6 of 6, arms raised |
| `PLB.pain.1` | 40 | 448 | 585 | 76 | 107 | 38.5 | 432,580 | recoil, arms out, blood at throat |
| `PLB.pain.2` | 41 | 564 | 585 | 61 | 107 | 32.5 | 540,580 | hands to throat |
| `PLB.pain.3` | 42 | 677 | 585 | 50 | 106 | 25.0 | 648,580 | hands to throat, hunched |
| `PLB.death.1` | 43 | 30 | 706 | 48 | 96 | 25.5 | 0,696 | clutching chest |
| `PLB.death.2` | 44 | 139 | 712 | 47 | 84 | 22.5 | 108,696 | dropping to knees |
| `PLB.death.3` | 45 | 247 | 716 | 47 | 76 | 23.0 | 216,696 | kneeling low |
| `PLB.death.4` | 46 | 353 | 731 | 50 | 47 | 25.5 | 324,696 | crouched over |
| `PLB.death.5` | 47 | 461 | 743 | 51 | 22 | 24.0 | 432,696 | face down |
| `PLB.death.6` | 48 | 569 | 745 | 50 | 19 | 22.5 | 540,696 | flat on ground |
| `PLB.armsup.F` | 49 | 664 | 701 | 76 | 108 | 39.0 | 648,696 | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.armsup.FQ-R` | 50 | 18 | 817 | 72 | 107 | 28.0 | 0,812 | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.armsup.S-R` | 51 | 139 | 817 | 46 | 107 | 14.0 | 108,812 | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.armsup.BQ-R` | 52 | 238 | 817 | 65 | 107 | 19.5 | 216,812 | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.armsup.B` | 53 | 341 | 817 | 74 | 107 | 30.5 | 324,812 | arms raised high (use for leap, roar or claw wind-up) |
| `PLB.ready.F` | 54 | 456 | 817 | 60 | 107 | 34.5 | 432,812 | standing, arms held out low (fight-ready) |
| `PLB.ready.FQ-R` | 55 | 564 | 816 | 60 | 108 | 27.0 | 540,812 | standing, arms held out low (fight-ready) |
| `PLB.ready.S-R` | 56 | 682 | 816 | 41 | 108 | 15.0 | 648,812 | standing, arms held out low (fight-ready) |
| `PLB.ready.BQ-R` | 57 | 28 | 932 | 52 | 108 | 16.0 | 0,928 | standing, arms held out low (fight-ready) |
| `PLB.ready.B` | 58 | 132 | 933 | 61 | 107 | 22.0 | 108,928 | standing, arms held out low (fight-ready) |
| `PLB.idle.F` | 59 | 240 | 933 | 60 | 107 | 35.5 | 216,928 | standing relaxed |
| `PLB.idle.FQ-R` | 60 | 350 | 932 | 56 | 108 | 25.5 | 324,928 | standing relaxed |
| `PLB.idle.S-R` | 61 | 465 | 932 | 43 | 108 | 14.5 | 432,928 | standing relaxed |
| `PLB.idle.BQ-R` | 62 | 567 | 932 | 54 | 108 | 15.0 | 540,928 | standing relaxed |
| `PLB.idle.B` | 63 | 672 | 933 | 61 | 107 | 22.0 | 648,928 | standing relaxed |

---

## GRL · Girl NPC, large sheet (blue bikini)

| field | value |
|---|---|
| file | `girl1bikini.png`  (1200×744 px) |
| preview | `previews/GRL_numbered.png` |
| background | transparent |
| frames | 53 |
| layout | Three blocks side by side. **Stand + walk** (5 columns) are stacked so tightly that neighbours touch: rows are cut at y = 0, 120, 240, 360, 480 (height about 118). **Duck** (1 column) and **run** (4 columns) are spaced apart. **Death** is a separate row at the bottom. |
| angles | 5 directions, top to bottom in every column: F, FQ-L, S-L, BQ-L, B. Mirror for right-facing. |
| scale | 118 px standing = 1.75 m → **67.4 px per metre** |
| use | The girl NPC: stands, walks, runs away, ducks, dies. The larger and sharper of the two girl sheets. |

**Watch for**

- Stand and walk frames touch the frame above or below by a few pixels (hair against heels). The rectangles below cut on the cleanest row; expect up to 10 stray pixels on the top or bottom edge.
- Text labels (STAND, WALKING, DUCK, RUNNING, credit) sit at y 612-640 and bottom right. They are excluded.
- The three death frames here show blood. `GRS` has a bloodless death row.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GRL.stand` | 5 | F, FQ-L, S-L, BQ-L, B | standing |
| `GRL.walk1` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 1 |
| `GRL.walk2` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 2 |
| `GRL.walk3` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 3 |
| `GRL.walk4` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 4 |
| `GRL.duck` | 5 | F, FQ-L, S-L, BQ-L, B | crouched, covering head |
| `GRL.run1` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 1 |
| `GRL.run2` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 2 |
| `GRL.run3` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 3 |
| `GRL.run4` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 4 |
| `GRL.death` | 3 | 1, 2, 3 | hit, knees buckling (blood) … lying dead (blood) |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `GRL.stand.F` | 1 | 38 | 0 | 41 | 118 | 17.5 | standing |
| `GRL.stand.FQ-L` | 2 | 42 | 120 | 40 | 118 | 15.0 | standing |
| `GRL.stand.S-L` | 3 | 47 | 240 | 27 | 118 | 15.0 | standing |
| `GRL.stand.BQ-L` | 4 | 46 | 360 | 33 | 118 | 17.0 | standing |
| `GRL.stand.B` | 5 | 40 | 480 | 41 | 118 | 22.5 | standing |
| `GRL.walk1.F` | 6 | 162 | 1 | 36 | 116 | 16.0 | walk phase 1 |
| `GRL.walk1.FQ-L` | 7 | 156 | 121 | 43 | 116 | 23.5 | walk phase 1 |
| `GRL.walk1.S-L` | 8 | 156 | 241 | 48 | 116 | 23.0 | walk phase 1 |
| `GRL.walk1.BQ-L` | 9 | 160 | 361 | 41 | 116 | 19.5 | walk phase 1 |
| `GRL.walk1.B` | 10 | 161 | 481 | 36 | 116 | 19.0 | walk phase 1 |
| `GRL.walk2.F` | 11 | 279 | 0 | 40 | 117 | 17.5 | walk phase 2 |
| `GRL.walk2.FQ-L` | 12 | 282 | 120 | 33 | 117 | 12.5 | walk phase 2 |
| `GRL.walk2.S-L` | 13 | 288 | 240 | 22 | 117 | 8.5 | walk phase 2 |
| `GRL.walk2.BQ-L` | 14 | 279 | 360 | 38 | 117 | 18.5 | walk phase 2 |
| `GRL.walk2.B` | 15 | 280 | 480 | 40 | 117 | 21.5 | walk phase 2 |
| `GRL.walk3.F` | 16 | 402 | 1 | 35 | 116 | 15.5 | walk phase 3 |
| `GRL.walk3.FQ-L` | 17 | 396 | 121 | 40 | 116 | 19.5 | walk phase 3 |
| `GRL.walk3.S-L` | 18 | 395 | 241 | 45 | 116 | 22.0 | walk phase 3 |
| `GRL.walk3.BQ-L` | 19 | 396 | 361 | 43 | 116 | 24.0 | walk phase 3 |
| `GRL.walk3.B` | 20 | 402 | 481 | 36 | 116 | 18.5 | walk phase 3 |
| `GRL.walk4.F` | 21 | 519 | 0 | 40 | 116 | 19.0 | walk phase 4 |
| `GRL.walk4.FQ-L` | 22 | 521 | 120 | 33 | 116 | 15.5 | walk phase 4 |
| `GRL.walk4.S-L` | 23 | 527 | 240 | 23 | 116 | 10.5 | walk phase 4 |
| `GRL.walk4.BQ-L` | 24 | 518 | 360 | 38 | 116 | 20.0 | walk phase 4 |
| `GRL.walk4.B` | 25 | 520 | 480 | 40 | 116 | 20.0 | walk phase 4 |
| `GRL.duck.F` | 26 | 636 | 50 | 43 | 67 | 23.0 | crouched, covering head |
| `GRL.duck.FQ-L` | 27 | 629 | 170 | 52 | 67 | 31.5 | crouched, covering head |
| `GRL.duck.S-L` | 28 | 631 | 290 | 55 | 67 | 32.5 | crouched, covering head |
| `GRL.duck.BQ-L` | 29 | 631 | 410 | 46 | 67 | 32.0 | crouched, covering head |
| `GRL.duck.B` | 30 | 640 | 530 | 43 | 67 | 19.0 | crouched, covering head |
| `GRL.run1.F` | 31 | 746 | 7 | 63 | 106 | 32.5 | run phase 1 |
| `GRL.run1.FQ-L` | 32 | 734 | 127 | 71 | 106 | 46.0 | run phase 1 |
| `GRL.run1.S-L` | 33 | 742 | 246 | 77 | 107 | 38.0 | run phase 1 |
| `GRL.run1.BQ-L` | 34 | 744 | 367 | 66 | 105 | 35.0 | run phase 1 |
| `GRL.run1.B` | 35 | 750 | 487 | 63 | 106 | 29.5 | run phase 1 |
| `GRL.run2.F` | 36 | 855 | 9 | 74 | 107 | 48.5 | run phase 2 |
| `GRL.run2.FQ-L` | 37 | 849 | 129 | 76 | 107 | 40.0 | run phase 2 |
| `GRL.run2.S-L` | 38 | 856 | 249 | 82 | 107 | 25.5 | run phase 2 |
| `GRL.run2.BQ-L` | 39 | 853 | 369 | 77 | 107 | 30.0 | run phase 2 |
| `GRL.run2.B` | 40 | 870 | 489 | 74 | 107 | 24.0 | run phase 2 |
| `GRL.run3.F` | 41 | 980 | 5 | 67 | 111 | 44.0 | run phase 3 |
| `GRL.run3.FQ-L` | 42 | 977 | 125 | 56 | 111 | 47.0 | run phase 3 |
| `GRL.run3.S-L` | 43 | 975 | 245 | 67 | 111 | 46.5 | run phase 3 |
| `GRL.run3.BQ-L` | 44 | 973 | 365 | 66 | 111 | 45.0 | run phase 3 |
| `GRL.run3.B` | 45 | 992 | 485 | 67 | 111 | 22.0 | run phase 3 |
| `GRL.run4.F` | 46 | 1097 | 9 | 71 | 109 | 41.5 | run phase 4 |
| `GRL.run4.FQ-L` | 47 | 1088 | 129 | 78 | 109 | 58.5 | run phase 4 |
| `GRL.run4.S-L` | 48 | 1093 | 248 | 80 | 110 | 58.0 | run phase 4 |
| `GRL.run4.BQ-L` | 49 | 1093 | 368 | 69 | 110 | 56.0 | run phase 4 |
| `GRL.run4.B` | 50 | 1111 | 489 | 71 | 109 | 28.5 | run phase 4 |
| `GRL.death.1` | 51 | 413 | 641 | 53 | 100 | 48.0 | hit, knees buckling (blood) |
| `GRL.death.2` | 52 | 528 | 663 | 66 | 80 | 61.0 | falling back (blood) |
| `GRL.death.3` | 53 | 642 | 709 | 81 | 32 | 50.0 | lying dead (blood) |

---

## GRS · Girl NPC, small sheet (same poses, lower resolution, different death row)

| field | value |
|---|---|
| file | `446-4468753_npc-girl-sprites-duke-png-download-sprite-woman.png`  (860×593 px) |
| preview | `previews/GRS_numbered.png` |
| background | solid colour rgb(247, 247, 247) |
| frames | 53 |
| layout | Same layout as `GRL` at about 70% size. Stand and walk rows are cut near y = 40, 123, 206, 289, 372. |
| angles | Same as `GRL`: F, FQ-L, S-L, BQ-L, B top to bottom. |
| scale | 82 px standing = 1.75 m → **46.9 px per metre** |
| use | Same girl, smaller. Its pixel scale matches the gunmen and `GV2` more closely. |

**Watch for**

- Background is solid light grey `rgb(247,247,247)`, not transparent. Delete it (method B, tolerance 6), then shrink the outline by one pixel to lose the pale fringe.
- Lower resolution than `GRL`. Use it only if you want the small sprites to match `GV2`, or for its bloodless death row.
- Death row differs from `GRL`: stumble, sprawl, lying face down, no blood.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GRS.stand` | 5 | F, FQ-L, S-L, BQ-L, B | standing |
| `GRS.walk1` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 1 |
| `GRS.walk2` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 2 |
| `GRS.walk3` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 3 |
| `GRS.walk4` | 5 | F, FQ-L, S-L, BQ-L, B | walk phase 4 |
| `GRS.duck` | 5 | F, FQ-L, S-L, BQ-L, B | crouched, covering head |
| `GRS.run1` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 1 |
| `GRS.run2` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 2 |
| `GRS.run3` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 3 |
| `GRS.run4` | 5 | F, FQ-L, S-L, BQ-L, B | run phase 4 |
| `GRS.death` | 3 | 1, 2, 3 | stumbling low … lying face down |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `GRS.stand.F` | 1 | 39 | 40 | 29 | 82 | 12.5 | standing |
| `GRS.stand.FQ-L` | 2 | 40 | 122 | 31 | 83 | 12.5 | standing |
| `GRS.stand.S-L` | 3 | 45 | 206 | 20 | 82 | 11.0 | standing |
| `GRS.stand.BQ-L` | 4 | 45 | 289 | 23 | 82 | 11.5 | standing |
| `GRS.stand.B` | 5 | 41 | 371 | 29 | 83 | 15.5 | standing |
| `GRS.walk1.F` | 6 | 125 | 41 | 26 | 81 | 11.5 | walk phase 1 |
| `GRS.walk1.FQ-L` | 7 | 121 | 124 | 30 | 81 | 16.0 | walk phase 1 |
| `GRS.walk1.S-L` | 8 | 121 | 207 | 34 | 80 | 16.0 | walk phase 1 |
| `GRS.walk1.BQ-L` | 9 | 124 | 289 | 29 | 81 | 13.5 | walk phase 1 |
| `GRS.walk1.B` | 10 | 124 | 372 | 26 | 81 | 13.5 | walk phase 1 |
| `GRS.walk2.F` | 11 | 206 | 40 | 28 | 82 | 12.0 | walk phase 2 |
| `GRS.walk2.FQ-L` | 12 | 208 | 123 | 23 | 82 | 8.5 | walk phase 2 |
| `GRS.walk2.S-L` | 13 | 212 | 206 | 16 | 81 | 6.0 | walk phase 2 |
| `GRS.walk2.BQ-L` | 14 | 206 | 289 | 27 | 81 | 13.0 | walk phase 2 |
| `GRS.walk2.B` | 15 | 206 | 371 | 29 | 82 | 15.5 | walk phase 2 |
| `GRS.walk3.F` | 16 | 291 | 41 | 25 | 81 | 11.0 | walk phase 3 |
| `GRS.walk3.FQ-L` | 17 | 287 | 124 | 28 | 81 | 13.5 | walk phase 3 |
| `GRS.walk3.S-L` | 18 | 286 | 207 | 32 | 80 | 15.5 | walk phase 3 |
| `GRS.walk3.BQ-L` | 19 | 287 | 289 | 30 | 81 | 16.5 | walk phase 3 |
| `GRS.walk3.B` | 20 | 291 | 372 | 25 | 81 | 13.0 | walk phase 3 |
| `GRS.walk4.F` | 21 | 372 | 40 | 28 | 81 | 13.0 | walk phase 4 |
| `GRS.walk4.FQ-L` | 22 | 373 | 123 | 24 | 81 | 11.0 | walk phase 4 |
| `GRS.walk4.S-L` | 23 | 377 | 206 | 17 | 81 | 7.5 | walk phase 4 |
| `GRS.walk4.BQ-L` | 24 | 371 | 289 | 27 | 81 | 13.5 | walk phase 4 |
| `GRS.walk4.B` | 25 | 372 | 371 | 29 | 81 | 14.5 | walk phase 4 |
| `GRS.duck.F` | 26 | 452 | 75 | 31 | 47 | 16.5 | crouched, covering head |
| `GRS.duck.FQ-L` | 27 | 448 | 158 | 36 | 47 | 21.5 | crouched, covering head |
| `GRS.duck.S-L` | 28 | 449 | 240 | 39 | 47 | 22.5 | crouched, covering head |
| `GRS.duck.BQ-L` | 29 | 449 | 323 | 33 | 47 | 22.0 | crouched, covering head |
| `GRS.duck.B` | 30 | 455 | 406 | 31 | 47 | 13.5 | crouched, covering head |
| `GRS.run1.F` | 31 | 528 | 45 | 45 | 74 | 23.0 | run phase 1 |
| `GRS.run1.FQ-L` | 32 | 520 | 128 | 50 | 74 | 32.0 | run phase 1 |
| `GRS.run1.S-L` | 33 | 526 | 210 | 54 | 75 | 26.5 | run phase 1 |
| `GRS.run1.BQ-L` | 34 | 527 | 293 | 46 | 74 | 24.0 | run phase 1 |
| `GRS.run1.B` | 35 | 531 | 376 | 45 | 74 | 21.0 | run phase 1 |
| `GRS.run2.F` | 36 | 604 | 46 | 52 | 75 | 33.5 | run phase 2 |
| `GRS.run2.FQ-L` | 37 | 599 | 129 | 54 | 75 | 28.0 | run phase 2 |
| `GRS.run2.S-L` | 38 | 604 | 212 | 58 | 75 | 18.0 | run phase 2 |
| `GRS.run2.BQ-L` | 39 | 602 | 295 | 54 | 75 | 21.5 | run phase 2 |
| `GRS.run2.B` | 40 | 614 | 378 | 52 | 74 | 17.0 | run phase 2 |
| `GRS.run3.F` | 41 | 690 | 44 | 47 | 77 | 30.5 | run phase 3 |
| `GRS.run3.FQ-L` | 42 | 688 | 126 | 40 | 78 | 33.0 | run phase 3 |
| `GRS.run3.S-L` | 43 | 687 | 209 | 47 | 78 | 32.0 | run phase 3 |
| `GRS.run3.BQ-L` | 44 | 685 | 292 | 47 | 78 | 31.5 | run phase 3 |
| `GRS.run3.B` | 45 | 698 | 375 | 47 | 77 | 16.0 | run phase 3 |
| `GRS.run4.F` | 46 | 771 | 46 | 50 | 77 | 29.0 | run phase 4 |
| `GRS.run4.FQ-L` | 47 | 765 | 129 | 54 | 76 | 40.0 | run phase 4 |
| `GRS.run4.S-L` | 48 | 768 | 211 | 56 | 77 | 40.5 | run phase 4 |
| `GRS.run4.BQ-L` | 49 | 768 | 294 | 49 | 77 | 39.0 | run phase 4 |
| `GRS.run4.B` | 50 | 780 | 378 | 50 | 76 | 20.5 | run phase 4 |
| `GRS.death.1` | 51 | 30 | 496 | 49 | 58 | 31.5 | stumbling low |
| `GRS.death.2` | 52 | 111 | 525 | 66 | 29 | 40.0 | sprawled face down |
| `GRS.death.3` | 53 | 192 | 536 | 71 | 18 | 43.0 | lying face down |

---

## POD · Pod capture sequence (woman + tall green pod)

| field | value |
|---|---|
| file | `standinganimation_copy.png`  (800×588 px) |
| preview | `previews/POD_numbered.png` |
| background | transparent |
| frames | 12 |
| layout | 12 separate figures in two rows, wide gaps. Rectangles below. |
| angles | Front view only. |
| scale | 135 px standing = 1.75 m → **77.1 px per metre** |
| use | The capture itself: woman, tall green pod, and the stages between free and held. |

**Watch for**

- The woman here is a different character from `GRL` (brown hair, white bikini). Hide the swap behind a splash effect (recipe `R-POD-FORM`).
- Frame order below is the order on the sheet, not a playback order. Suggested playback orders are in `02_RECIPES.md`.
- Background is transparent, so the white bikini is safe.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `POD.f01` | 1 | (single) | empty pod, no figure |
| `POD.f02` | 1 | (single) | woman standing free, no pod |
| `POD.f03` | 1 | (single) | held against pod, ankles bound, head tilted |
| `POD.f04` | 1 | (single) | held, one arm reaching out to the side |
| `POD.f05` | 1 | (single) | held, arm lowering |
| `POD.f06` | 1 | (single) | held, slumped (pod mostly hidden behind her) |
| `POD.f07` | 1 | (single) | held against pod, loop frame A |
| `POD.f08` | 1 | (single) | held against pod, loop frame B |
| `POD.f09` | 1 | (single) | held against pod, loop frame C (ankles clear) |
| `POD.f10` | 1 | (single) | backed against pod, standing upright |
| `POD.f11` | 1 | (single) | standing just in front of pod |
| `POD.f12` | 1 | (single) | standing beside pod, not touching |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `POD.f01` | 1 | 25 | 28 | 47 | 162 | 22.5 | empty pod, no figure |
| `POD.f02` | 2 | 131 | 53 | 42 | 135 | 18.0 | woman standing free, no pod |
| `POD.f03` | 3 | 186 | 27 | 52 | 162 | 26.0 | held against pod, ankles bound, head tilted |
| `POD.f04` | 4 | 266 | 28 | 84 | 163 | 45.5 | held, one arm reaching out to the side |
| `POD.f05` | 5 | 412 | 28 | 67 | 162 | 38.0 | held, arm lowering |
| `POD.f06` | 6 | 569 | 24 | 51 | 162 | 25.0 | held, slumped (pod mostly hidden behind her) |
| `POD.f07` | 7 | 131 | 292 | 52 | 162 | 26.0 | held against pod, loop frame A |
| `POD.f08` | 8 | 193 | 292 | 52 | 162 | 26.0 | held against pod, loop frame B |
| `POD.f09` | 9 | 261 | 292 | 52 | 162 | 26.0 | held against pod, loop frame C (ankles clear) |
| `POD.f10` | 10 | 334 | 292 | 52 | 162 | 25.0 | backed against pod, standing upright |
| `POD.f11` | 11 | 462 | 295 | 71 | 162 | 39.0 | standing just in front of pod |
| `POD.f12` | 12 | 595 | 295 | 92 | 162 | 46.5 | standing beside pod, not touching |

---

## GV2 · Girl variants and four pod types (small original-scale sprites)

| field | value |
|---|---|
| file | `dukevar2.png`  (469×1117 px) |
| preview | `previews/GV2_numbered.png` |
| background | solid colour rgb(255, 255, 255) |
| frames | 23 |
| layout | 8 rows of 2 to 4 single figures. Rectangles below. |
| angles | One fixed view each (roughly front or front three-quarter). |
| scale | 88 px standing = 1.75 m → **50.3 px per metre** |
| use | Variety. Four more pod styles (round pod, tall pod, sitting bound, hanging) and extra standing or dancing women for set dressing. |

**Watch for**

- Background is pure white `rgb(255,255,255)`, not transparent. The white clothing on some figures is light grey, not pure white, so deleting pure white with a **tight tolerance (8 or less)** removes the background and leaves the clothing (method B). A loose tolerance eats the clothing.
- Every figure is a single still frame: these are variants of one pose, not animations.
- The standing and dancing figures are small (about 50 px per metre) and match `GRS` and the gunmen in pixel size.
- **The pod figures are drawn larger than the standing figures.** `tallpod` is 52×162, exactly the size of the `POD` frames (77 px per metre), so the three tall pods can stand in as extra `POD` variants. `eggpod` and `sitbound` are about 80 px per metre, `hang` about 85.

**Sets**

| set | frames | keys | shows |
|---|---|---|---|
| `GV2.dancer` | 3 | 1, 2, 3 | dancer in stockings, hand on head; colour variant 1 … dancer in stockings, hand on head; colour variant 3 |
| `GV2.pole` | 2 | 1, 2 | pole dancer; variant 1 … pole dancer; variant 2 |
| `GV2.stand` | 4 | 1, 2, 3, 4 | woman standing, hand on hip; outfit variant 1 … woman standing, hand on hip; outfit variant 4 |
| `GV2.dance2` | 2 | 1, 2 | dancing in bikini; variant 1 … dancing in bikini; variant 2 |
| `GV2.eggpod` | 3 | 1, 2, 3 | round pod, upper body showing; variant 1 … round pod, upper body showing; variant 3 |
| `GV2.tallpod` | 3 | 1, 2, 3 | tall leaf-shaped pod, woman bound standing; variant 1 … tall leaf-shaped pod, woman bound standing; variant 3 |
| `GV2.sitbound` | 3 | 1, 2, 3 | sitting on vine mat, bound; variant 1 … sitting on vine mat, bound; variant 3 |
| `GV2.hang` | 3 | 1, 2, 3 | hanging upside down from vines; variant 1 … hanging upside down from vines; variant 3 |

**Frames**

| id | # | x | y | w | h | ax | shows |
|---|---|---|---|---|---|---|---|
| `GV2.dancer.1` | 1 | 64 | 10 | 37 | 93 | 15.0 | dancer in stockings, hand on head; colour variant 1 |
| `GV2.dancer.2` | 2 | 149 | 9 | 37 | 94 | 15.0 | dancer in stockings, hand on head; colour variant 2 |
| `GV2.dancer.3` | 3 | 237 | 8 | 37 | 95 | 15.0 | dancer in stockings, hand on head; colour variant 3 |
| `GV2.pole.1` | 4 | 55 | 108 | 41 | 128 | 27.0 | pole dancer; variant 1 |
| `GV2.pole.2` | 5 | 140 | 108 | 41 | 128 | 27.0 | pole dancer; variant 2 |
| `GV2.stand.1` | 6 | 63 | 247 | 32 | 88 | 15.0 | woman standing, hand on hip; outfit variant 1 |
| `GV2.stand.2` | 7 | 148 | 247 | 32 | 88 | 15.0 | woman standing, hand on hip; outfit variant 2 |
| `GV2.stand.3` | 8 | 236 | 246 | 32 | 89 | 15.0 | woman standing, hand on hip; outfit variant 3 |
| `GV2.stand.4` | 9 | 304 | 247 | 32 | 88 | 15.0 | woman standing, hand on hip; outfit variant 4 |
| `GV2.dance2.1` | 10 | 55 | 366 | 57 | 97 | 23.5 | dancing in bikini; variant 1 |
| `GV2.dance2.2` | 11 | 140 | 366 | 57 | 97 | 23.5 | dancing in bikini; variant 2 |
| `GV2.eggpod.1` | 12 | 50 | 489 | 74 | 113 | 40.5 | round pod, upper body showing; variant 1 |
| `GV2.eggpod.2` | 13 | 135 | 486 | 74 | 116 | 40.5 | round pod, upper body showing; variant 2 |
| `GV2.eggpod.3` | 14 | 223 | 488 | 74 | 114 | 40.5 | round pod, upper body showing; variant 3 |
| `GV2.tallpod.1` | 15 | 64 | 624 | 52 | 162 | 26.0 | tall leaf-shaped pod, woman bound standing; variant 1 |
| `GV2.tallpod.2` | 16 | 149 | 624 | 52 | 163 | 26.0 | tall leaf-shaped pod, woman bound standing; variant 2 |
| `GV2.tallpod.3` | 17 | 236 | 624 | 53 | 162 | 27.0 | tall leaf-shaped pod, woman bound standing; variant 3 |
| `GV2.sitbound.1` | 18 | 6 | 811 | 135 | 89 | 67.0 | sitting on vine mat, bound; variant 1 |
| `GV2.sitbound.2` | 19 | 157 | 808 | 135 | 92 | 67.0 | sitting on vine mat, bound; variant 2 |
| `GV2.sitbound.3` | 20 | 310 | 809 | 135 | 91 | 67.0 | sitting on vine mat, bound; variant 3 |
| `GV2.hang.1` | 21 | 31 | 933 | 85 | 170 | 13.5 | hanging upside down from vines; variant 1 |
| `GV2.hang.2` | 22 | 136 | 933 | 85 | 170 | 12.5 | hanging upside down from vines; variant 2 |
| `GV2.hang.3` | 23 | 243 | 933 | 85 | 161 | 12.0 | hanging upside down from vines; variant 3 |

