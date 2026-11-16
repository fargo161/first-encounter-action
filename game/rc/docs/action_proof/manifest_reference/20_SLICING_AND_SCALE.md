# 20 · Cutting, background removal, scale, facing and tint

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

How to turn the uploaded sheets into sprites the game can draw. Code samples are Python with Pillow, NumPy and SciPy. All rectangles come from the tables in `10_CHARACTERS.md`, `18_MORE_ENEMIES.md` and `11_FIRST_PERSON.md`, or from `data/frames.json`, which holds the same numbers. **New in v1.1:** methods E and F (§4b, §4c) for three of the third-batch sheets, and the scale and facing rows for all seven new characters.

---

## 1. Which method for which sheet

| code | method | why |
|---|---|---|
| `GNR`, `PLB`, `GRL`, `POD`, `FPW`, `MSK`, `BRW` | **A** rectangle | background already transparent, pieces do not overlap (`BRW` has soft edges: treat alpha below 128 as empty) |
| `GNP`, `GNC` | **B** rectangle + remove cyan `rgb(0,255,255)` | solid background (on `GNC` the cells are cyan and the lines between them teal; the rectangles stay inside the cells) |
| `GRS` | **B** rectangle + remove grey `rgb(247,247,247)` | solid background |
| `GV2` | **B** rectangle + remove pure white `rgb(255,255,255)`, **tight tolerance** | solid background; clothing on the figures is light grey, so keep the tolerance low |
| `TH1`, `TH2`, `DHM` | **C** connected region from a seed | pieces are packed so close their rectangles overlap |
| `SWN`, `SWC`, `ARM` | **E** remove a painted-in checkerboard | these copies have a grey-and-white checkerboard where the transparency should be |
| `TKW` | **F** remove a green screen, then shrink | blurred, enlarged copy on solid green |
| `HIT`, `DUST`, `WAT`, `ICE`, `DRK`, `ICO`, `ACC` | **D** even grid | equal cells |
| `HS`, `E11`, `GOO`, `KPA`, `KSM`, `KSP` | none | one picture per file |

---

## 2. Method A · plain rectangle

```python
from PIL import Image
sheet = Image.open("girl1bikini.png").convert("RGBA")
x, y, w, h = 38, 0, 41, 118            # GRL.stand.F from the table
sprite = sheet.crop((x, y, x + w, y + h))
```

`GRL` stand and walk rows touch their neighbours by a few pixels. After cropping, delete any pixels in the top two rows that are not connected to the main figure, or accept the specks.

---

## 3. Method B · remove a solid background

Three sheets have a flat background colour instead of transparency. On all three it is safe to delete **every** pixel close to that colour, because nothing on the figures uses it. This was checked on the real files: the cyan appears nowhere on the gunman; the white clothing on `GV2` is light grey, not pure white; the grey behind `GRS` is flat.

```python
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def cut_keyed(sheet, rect, bg, tol):
    x, y, w, h = rect
    a = np.array(sheet.convert("RGB").crop((x, y, x + w, y + h))).astype(int)
    is_bg = np.abs(a - np.array(bg)).max(axis=2) <= tol          # close to the background colour
    rgba = np.dstack([a, np.where(is_bg, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")
```

| sheet | `bg` | `tol` | note |
|---|---|---|---|
| `GNP` | (0, 255, 255) | 40 | crisp pixel art, clean result |
| `GRS` | (247, 247, 247) | 6 | edges are soft: afterwards shrink the outline by one pixel to remove the pale fringe |
| `GV2` | (255, 255, 255) | 8 | **do not raise the tolerance**: above about 14 the light-grey clothing starts to vanish |
| `GNC` | (0, 255, 255) | 8 | crisp, exact colours; the teal lines never fall inside a frame rectangle |

This also clears the gaps trapped inside a figure (between an arm and the body, between vines). Expect a handful of single-pixel pinholes across a whole sheet (about 100 on `GV2`, 80 on `GRS`, 30 on `GNP`); fill any transparent pixel that has solid pixels on all four sides if they show.

## 4. Method C · connected region from a seed

Each piece in `TH1`, `TH2` and `DHM` has one or more **seed points**: pixels known to be inside it. Keep every pixel connected to a seed; throw away the rest, even inside the rectangle (those belong to a neighbour).

```python
def cut_region(sheet_rgba, rect, seeds):
    x, y, w, h = rect
    a = np.array(sheet_rgba.convert("RGBA"))
    solid = a[..., 3] >= 16
    lab, _ = ndi.label(solid, structure=np.ones((3, 3)))        # 8-way connection
    keep = np.zeros_like(solid)
    for sx, sy in seeds:
        keep |= lab == lab[sy, sx]
    out = a.copy(); out[~keep] = 0
    return Image.fromarray(out, "RGBA").crop((x, y, x + w, y + h))
```

A piece with several seeds is made of separate parts that belong together (a hand and its loose fingertips). Use all the seeds listed. `data/frames.json` holds up to six per piece.

## 4b. Method E · remove a painted-in checkerboard (`SWN`, `SWC`, `ARM`)

Two of the third-batch pictures were saved from a site that paints a grey-and-white checkerboard where the transparent background used to be, shrinks the picture and cuts it down to about 25 colours. The checkerboard is regular (15-pixel squares, white 255 and grey 230, white at the top-left corner), so the code can work out which colour the background *should* be at every pixel and remove only pixels that match.

```python
def checker_mask(sheet, gap_min, tile=15, c0=255, c1=230, fringe=185, rings=2):
    a = np.array(sheet.convert("RGB")).astype(int)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    expect = np.where(((xx // tile) + (yy // tile)) % 2 == 0, c0, c1)      # colour the checkerboard has here
    grey = (a[..., 0] == a[..., 1]) & (a[..., 1] == a[..., 2])
    match = grey & (a[..., 0] == expect)
    lab, n = ndi.label(match, structure=np.ones((3, 3)))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    outside = np.isin(lab, edge)                                           # background joined to the sheet edge
    sizes = ndi.sum(match, lab, index=np.arange(1, n + 1))
    big = np.zeros(n + 1, bool); big[1:] = sizes >= gap_min
    bg = outside | (big[lab] & ~outside)                                   # plus enclosed pockets big enough to be gaps
    pale = a.min(axis=2) >= fringe
    for _ in range(rings):                                                 # peel the pale fringe round each figure
        bg |= pale & ndi.binary_dilation(bg, structure=np.ones((3, 3))) & ~bg
    return ~bg                                                             # True = figure

def cut_masked(sheet, mask, rect):
    x, y, w, h = rect
    rgb = np.array(sheet.convert("RGB"))[y:y + h, x:x + w]
    al = np.where(mask[y:y + h, x:x + w], 255, 0).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, al]), "RGBA")
```

Build the mask once per sheet, then cut every frame with `cut_masked`.

| sheet | `gap_min` | why |
|---|---|---|
| `SWN`, `SWC` | 1 | nothing on these figures is the same white or grey as the checkerboard (their lightest colour is 239), so every matching pixel is background, even a single trapped one |
| `ARM` | 24 | the shine on the armour **is** the same white as the checkerboard. Small enclosed white patches are kept as shine; only pockets of 24 px or more are treated as see-through gaps. A few small gaps between an arm and the body stay filled white |

The last step peels two rings of near-white pixels off each outline, because the shrunken copy left a pale fringe. It costs about one pixel of white beard or chrome at the very edge.

**A cleaner route exists.** Both pictures carry the credit line "ripped by Dunkelschwamm for TSR". The originals that line refers to would have real transparency and full colour; with those, method A works and this section is not needed (`30_ONLINE_FINDS.md` §1).

## 4c. Method F · remove a green screen, then shrink (`TKW`)

```python
def green_mask(sheet):
    a = np.array(sheet.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (g - np.maximum(r, b) >= 70) & (g >= 120)                          # clearly green
    return ndi.binary_erosion(~bg, structure=np.ones((3, 3)), iterations=2) # trim two pixels of green-tinged edge

frame = cut_masked(sheet, green_mask(sheet), rect)
frame = frame.resize((round(rect[2] / 5.1), round(rect[3] / 5.1)), Image.BOX)   # 3264 px wide → the 640 px it was drawn at
```

The picture is a 640×480 original blown up 5.1 times and blurred. Shrinking by the same factor brings the figures back to about 84 px tall (about 50 px per metre), close to the other enemies. Rectangles in the tables are in the pixels of the file as uploaded (before shrinking).

---

## 5. Method D · even grid

```python
def cut_grid(sheet, cell_w, cell_h, cols, i):          # i counts from 1
    c, r = (i - 1) % cols, (i - 1) // cols
    return sheet.crop((c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h))
```

Cell sizes, column counts and how many cells are used are in `12_VFX.md`. Stop at the `used` count; later cells are blank.

`GNR` (100×100, 5 columns) and `PLB` (108×116, 7 columns) are also even grids. For animation, cut the **whole cell** so the figure keeps its place from frame to frame; use the tight rectangle only for hit testing.

---

## 6. Scale

Every character sheet was drawn at a different size. Draw each at its own **pixels per metre** so a 1.8 m man is 1.8 m tall in the room whichever sheet he came from.

`on-screen height in metres = frame height in pixels ÷ px per metre`

| code | measured on | standing height | assumed real height | **px per metre** |
|---|---|---|---|---|
| `GNP` | `GNP.idle.F` | 94 px | 1.80 m | **52.2** |
| `GNR` | `GNR.aim.F` | 90 px | 1.85 m | **48.6** |
| `PLB` | `PLB.idle.F` | 107 px | 1.80 m | **59.4** |
| `GRL` | `GRL.stand.F` | 118 px | 1.75 m (in heels) | **67.4** |
| `GRS` | `GRS.stand.F` | 82 px | 1.75 m | **46.9** |
| `POD` | `POD.f02` (the woman) | 135 px | 1.75 m | **77.1** |
| `GV2` standing, dancing | `GV2.stand.1` | 88 px | 1.75 m | **50.3** |
| `GV2.tallpod.*` | same 52×162 size as `POD` frames | | | **77** |
| `GV2.eggpod.*`, `GV2.sitbound.*` | | | | about **80** |
| `GV2.hang.*` | | | | about **85** |
| `GNC` | `GNC.idle.F` | 87 px | 1.80 m | **48.3** |
| `SWN` | `SWN.run1.F` (hat included) | 82 px | 1.75 m | **46.9** |
| `SWC` | taken from `SWN` (same picture, same size of figure) | | 1.75 m | **46.9** |
| `ARM` | `ARM.stand.F` | 117 px | 1.90 m | **61.6** |
| `MSK` | `MSK.stand.F` | 125 px | 1.80 m | **69.4** |
| `BRW` | `BRW.idle.F` | 66 px | 1.80 m | **36.7** (small, soft copy) |
| `TKW` | `TKW.f35` | 430 px as uploaded | 1.70 m | **252.9** as uploaded, **49.6** after shrinking by 5.1 |

The real heights are assumptions. Change one and its figure changes in proportion. The builder's existing characters use 110 (old pictures) and 300 (new cut-outs) px per metre; a picture may carry its own figure (`ppm`), so mixing is supported (`16_BUILDER.md` §6).

**Always scale with nearest-neighbour** (no smoothing) for every pixel-art sheet and effect: `GNP`, `GNR`, `PLB`, `GV2`, `GNC`, `SWN`, `SWC`, `ARM`, `FPW`, `TH1`, `TH2`, `DHM`, `HS`, `HIT`, `DUST`, `WAT`, `ICE`, `DRK`, `TEX`. `GRL`, `POD`, `MSK`, `BRW`, `TKW`, `E11`, `GOO`, `KPA`, `KSM` and `KSP` are smooth art and may be scaled smoothly.

**First-person hands.** These are drawn over the screen, not in the room. Starting sizes, to tune by eye:

| set | drawn for a screen about this tall | so multiply source pixels by |
|---|---|---|
| `FPW` | 200 px | screen height ÷ 200 |
| `HS` | 360 px | screen height ÷ 360 |
| `TH1`, `TH2` | 480 px | screen height ÷ 480 |
| `DHM` | 1,080 px | screen height ÷ 1,080 |
| `E11` | 512 px square frame | screen height ÷ 512, frame's bottom edge on the screen's bottom edge |

Use whole-number multipliers where you can (2×, 3×, 4×) to keep pixels square.

---

## 7. Facing and mirroring

| code | profile and three-quarter views face | to get the other side |
|---|---|---|
| `GNP` | both are drawn (8 directions) | nothing to do |
| `GNR` | **left** | mirror |
| `GRL`, `GRS` | **left** | mirror |
| `PLB` | **right** | mirror |
| `GNC` | both are drawn (8 directions) | nothing to do |
| `SWN`, `SWC`, `ARM` | **left** | mirror |
| `MSK`, `BRW` | **right** | mirror |
| `TKW` | mixed, figure by figure | see each description |

Mirror with `sprite.transpose(Image.FLIP_LEFT_RIGHT)` and replace `ax` with `w − ax`.

**Eight directions from five.** Going clockwise from the front: `F`, `FQ-R`, `S-R`, `BQ-R`, `B`, `BQ-L`, `S-L`, `FQ-L`. A five-direction sheet supplies one side; the mirror supplies the other.

**Choosing a direction.** Take the angle between the way the character faces and the line from the character to the camera. 0° = `F`, then one step every 45°.

**The builder wants turned pictures facing right** and mirrors them itself. So `PLB`, `MSK` and `BRW` go in as they are; `GNR`, `GRL`, `GRS`, `SWN`, `SWC` and `ARM` must be mirrored first, or listed with the `|m` suffix (`16_BUILDER.md` §6). For `GNC`, use its `-R` frames and let the game mirror them, or supply both sides.

---

## 8. Standing a sprite on the floor

`ax` in the frame tables is the feet centre, in pixels from the rectangle's left edge. Put the sprite's bottom edge on the floor and its `ax` column on the character's position. For lying-down frames (the last steps of a death) `ax` is simply the middle of whatever touches the floor.

Animation frames cut by tight rectangle have different widths. Lining them up by `ax` keeps the feet still. For `GNR` and `PLB`, cutting whole cells does the same job with less work.

---

## 9. Blending and tint

- **`KPA` and `KSP` are pure white.** Multiply by a colour, then draw with **additive blending** (colours add up and glow) for fire, sparks and energy; with normal blending for splats and smoke.
- Element colours and every colour change needed to make sets match are in `03_MATRICES.md` M8.
- **Tinting `HS` hands toward tan** also dims the drawn flash in `HS.pistolfire1`, `HS.pistolfire2`, `HS.rapidfire1` and `HS.rapidfire2` (the flash sits in rows 16 to 60 of the 222-row frame). Tint the whole frame, then draw `KPA.muzzle_01` tinted orange over the fingertip on those four frames to put the brightness back. The other eight hand frames have no flash.

---

## 10. Cutting everything in one pass

`data/frames.json` holds `sheets` (file name and background for each code) and `frames` (id, sheet, x, y, w, h, and `seeds` where needed).

```python
import json, os
from PIL import Image
data = json.load(open("data/frames.json"))
KEY = {"GNP": ((0, 255, 255), 40), "GRS": ((247, 247, 247), 6), "GV2": ((255, 255, 255), 8), "GNC": ((0, 255, 255), 8)}
REGION = {"TH1", "TH2", "DHM"}
CHECKER = {"SWN": 1, "SWC": 1, "ARM": 24}                                   # gap_min per sheet (method E)
sheets = {k: Image.open(v["orig"]) for k, v in data["sheets"].items()}       # originals in the working folder
masks = {k: checker_mask(sheets[k], g) for k, g in CHECKER.items()}
masks["TKW"] = green_mask(sheets["TKW"])                                     # method F
os.makedirs("cut", exist_ok=True)
for f in data["frames"]:
    s, rect = f["sheet"], (f["x"], f["y"], f["w"], f["h"])
    if s in KEY:      img = cut_keyed(sheets[s], rect, *KEY[s])
    elif s in REGION: img = cut_region(sheets[s], rect, f["seeds"])
    elif s in masks:  img = cut_masked(sheets[s], masks[s], rect)
    else:             img = sheets[s].convert("RGBA").crop((rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3]))
    if s == "TKW":    img = img.resize((max(1, round(rect[2] / 5.1)), max(1, round(rect[3] / 5.1))), Image.BOX)
    img.save(f"cut/{f['id']}.png")
```

This writes one PNG per frame, named by its ID: **2,382 files** (875 from the first batch, 1,507 from the third; 946 of those are the eleven colours of `GNC`). It was run on the real files for this version and took about a minute. `SWN` and `SWC` are two characters on one picture, so that picture is opened under both codes. If an original has been renamed, match it by pixel size from `90_ARCHIVES.md`.
