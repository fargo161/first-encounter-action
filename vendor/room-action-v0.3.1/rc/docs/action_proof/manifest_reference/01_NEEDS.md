# 01 · What the game needs, and what fills it

*Action Game Asset Manifest v1.1 · 2026-11-15. Part of a linked set: begin at `00_START_HERE.md`.*

Each row is one thing the playground in the owner's design document needs. Two columns say different things:

**Design** = how settled the *idea* is (`00_START_HERE.md` §3): `AGREED`, `PROPOSED`, `OPEN`.

**Status** = how ready the *art or sound* is:

| status | meaning |
|---|---|
| `READY` | loose files or an even grid; use as they are |
| `CUT` | on a sprite sheet; cut out using the tables |
| `TINT` | usable after a colour change (the change is in `03_MATRICES.md` M8) |
| `STAND-IN` | wrong look, but works until better art exists |
| `GAP` | nothing in the uploaded set |
| `CODE` | needs no art; it is behaviour, and it is not built |

Rows marked `CODE` describe work in Room Creator or Encounter. This page does not ask anyone to do it (`00_START_HERE.md` rule 7).

---

## A. The player

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-01 | Hands at rest | `AGREED` (first person) | `CUT` | `TH1.f19`, `TH1.f20` | `R-IDLE-HANDS` | Tan skin matches the body sheet `PLB`. |
| N-02 | Punch | `AGREED` | `CUT` | `TH1.f14`, `TH1.f33`, `TH1.f34`; or `FPW.fist_side.1..3`, `FPW.fist_front.1..3` | `R-PUNCH` | `TH1` has single poses: slide the sprite. `FPW` has drawn three-frame swings but paler skin (`TINT`). |
| N-03 | Kick | `AGREED` | `STAND-IN` | `FPW.kick.1..3` (jeans, boot) or `DHM.f357`, `DHM.f368`, `DHM.f377`, `DHM.f378` (green trousers, boot) | `R-KICK` | **Nothing matches the barefoot player.** |
| N-04 | Grab a guard | `AGREED` | `CUT` | `TH1.f09` → `TH1.f10` (long reach); `DHM.f224`, `DHM.f235`, `DHM.f262`, `DHM.f245` | `R-GRAB` | |
| N-05 | Throw | `AGREED` | `CUT` hands, `GAP` for most bodies | release: `TH1.f11`, `TH1.f12`, `TH1.f13`, `FPW.openhand` | `R-THROW` | The body in the air: see N-27. |
| N-06 | Jump, dodge, change rail | `AGREED` as verbs; how they work `OPEN` | `CODE` | dust `DUST.v1`, `DUST.v4`; speed lines `KPA.trace_01` to `KPA.trace_07` | `R-JUMP`, `R-RAIL-CHANGE` | No art needed in first person. Not in the builder (`17_STREET_AND_VEHICLES.md` §7). |
| N-07 | Slime spray | `AGREED` | `TINT` + `READY` | hands `TH1.f06`, `TH1.f07`; slime `KSP.splat00` to `KSP.splat35` tinted green, `KSM.fart.00..08`, `GOO.blob.1..49`, `HIT.green.1..6` | `R-SLIME-SPRAY` | No slime-specific hand exists. |
| N-08 | Hold and carry the woman | `AGREED` (carrying limits attacks) | `GAP` | gripping fists `TH1.f21`, `TH2.f04` at the screen's lower corners | `R-CARRY` | No frame shows hands holding a person. |
| N-09 | Player is hit | `AGREED` fragile; exact hits `OPEN`; rebounding health `OPEN` | `CUT` + `READY` | `PLB.pain.1..3` on a HUD figure; `KSP.splat07` tinted red at the screen edge | `R-PLAYER-HIT` | |
| N-10 | Player dies | `AGREED` | `CUT` | `PLB.death.1..6` | `R-PLAYER-DEATH` | Only if a death camera is wanted. |
| N-11 | Player body seen from outside | `OPEN` (not mentioned) | `CUT` | `PLB`; pose reference `BRW.swipe`, `BRW.lunge` | | No punch, kick, grab or throw frames for the body. |
| N-12 | No fireball, no gun for the player | `AGREED` | — | `HS`, `E11` and the `FPW` guns are **unassigned** | | Energy weapons are reserved for enemies later. |

## B. The squad

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-20 | Four guards who can be told apart | `AGREED` (four armed guards) | `CUT` | `PROPOSED`: `GNC` in four colours, for example `@gray`, `@red`, `@blue`, `@olive` | | One body, so they read as one team. Mixing `GNP`, `GNR`, `SWN`, `TKW` gives more variety and less unity. |
| N-21 | Pistol guard | `AGREED` | `CUT` | `GNC.shoot1`, `GNC.shoot2` (8 directions); `GNP.fire.1..4` (front only); `TKW.f01`, `TKW.f03`, `TKW.f26`, `TKW.f32` | `R-GUARD-SHOOT` | |
| N-22 | Rifle guard | `AGREED` | `CUT` | `GNR.aim`, `GNR.fire` (5 angles); `SWN.shoot1`, `SWN.shoot2` (a submachine gun, 3 angles, no flash drawn) | `R-GUARD-SHOOT` | `GNC` has no rifle. A rifle guard in the `GNC` body does not exist. |
| N-23 | Bomb thrower | `AGREED` as a weapon | `STAND-IN` | `GNC.launch1`, `GNC.launch2` (launcher shot); `ARM.arm_low` → `ARM.arm_up` → `ARM.arm_out` (throw-like, but he is unarmed); `SWC.run1..4` (carries a bomb) | `R-GUARD-BOMB` | **No drawn overarm bomb throw.** `30_ONLINE_FINDS.md` §2. |
| N-24 | Guards moving | `AGREED` | `CUT` | `GNC.walk1..4`, `GNP.walk1..4`, `GNR.run1..4`, `SWN.run1..4`, `ARM.walk1..6`, `ARM.run1..4` | | `GNC` and `GNP` have no run: play the walk faster. |
| N-25 | Guard stunned or shoved by a punch or kick | `AGREED` (melee stuns and displaces) | `CUT` | `GNP.hurt.1..4`; `SWN.hurt.1..3`, `SWN.stagger.1..3`; `ARM.stagger.1..7`; `MSK.hurt` (5 angles) | `R-GUARD-STUNNED` | `GNC` has none: use `GNC.death_clean.1`. `GNR` has none: use `GNR.death.1`. |
| N-26 | How the bomb reaches its target: thrown, launched or carried | `OPEN` | — | see N-23 | | Decides which art is the bomb guard. |
| N-27 | Guard in the air after a throw, a car or a blast | `AGREED` (throwing is a player verb) | `CUT`, one set only | `SWN.death_blast.1..8` | `R-THROW`, `R-CAR-HIT` | The only tumbling body in the set. For other guards: tip the picture and move it (the builder already tips downed cards). |
| N-28 | Guard goes down | `AGREED` | `CUT` | `GNC.death_clean.1..7`, `GNC.death_blood.1..7`; `GNP.death_clean.1..5`; `GNR.death.1..5`; `SWN.death_head.1..8`; `ARM.death.1..10`; `MSK.death.1..5` | `R-GUARD-DOWN` | Pick blood or no blood once and keep to it. |
| N-29 | Guard snared in slime | `AGREED` (slime ensnares guards) | `TINT`, otherwise `GAP` | any standing frame tinted green with `KSP.splat12` over it; `GOO.blob.1..49` at the feet | `R-GUARD-SLIMED` | No "stuck" or "struggling" guard art. |
| N-30 | Guard turns rescuer and works to free her | `AGREED` | `GAP` | stand-ins: a standing frame facing the pod; `ARM.arm_out`; `MSK.stab1` to `MSK.stab6` reads as hacking at the pod | `R-RESCUE` | No "freeing" pose exists. |
| N-31 | Guard who fights hand to hand | `OPEN` (the document names an armed squad only) | `CUT` | `ARM.punch_a.1..5`, `ARM.punch_b.1..4`; `MSK.stab1` to `MSK.stab6`; `BRW.swipe`, `BRW.lunge` | `R-GUARD-MELEE` | The art arrived in the third batch; whether the game uses it is the owner's call. |
| N-32 | Weapon and disposition chosen separately (3 × 3) | `AGREED` | `CODE` | | | `03_MATRICES.md` M9. |
| N-33 | One shared decision process; shared actions hold, advance, attack, reposition, protect, interrupt, recover, rescue | `AGREED` | `CODE` | | | `03_MATRICES.md` M9. Where it runs is `OPEN` (`21_MODULAR_DEGRADATION.md` §8, item 4). |

## C. The woman and the pod

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-40 | The woman: stand, walk, run, duck | `AGREED` (one protected woman) | `CUT` | `GRL.stand`, `GRL.walk1..4`, `GRL.run1..4`, `GRL.duck` (5 angles, faces left) | | `GRS` is the same at lower resolution. |
| N-41 | Grabbed bare: she struggles and may break free | `AGREED`; a struggle meter is `OPEN` | `GAP` | stand-in: `GRL.duck.F` shaken side to side | `R-WOMAN-GRABBED` | |
| N-42 | Slimed first: the hold lasts longer | `AGREED` | `TINT` | her current frame with `KSP.splat03`, `KSP.splat18` tinted green over it | `R-WOMAN-SLIMED` | No half-slimed art. |
| N-43 | Carried | `AGREED` | `GAP` | she is not drawn; the player's fists are (N-08) | `R-CARRY` | |
| N-44 | Pod forms from sustained slime | `AGREED` | `CUT` | `POD.f01` to `POD.f12`; other pod looks `GV2.tallpod.1..3`, `GV2.eggpod.1..3` | `R-POD-FORM` | The woman in `POD` is drawn as a different woman from `GRL`: hide the swap behind a splash. |
| N-45 | Encasement rises to 100% | `AGREED` (this is the win) | `CUT` | `PROPOSED` stage-to-frame map in `03_MATRICES.md` M6 | `R-ENCASE-PROGRESS` | |
| N-46 | She struggles inside the pod | `PROPOSED` | `CUT` | loop `POD.f07`, `POD.f08`, `POD.f09`, `POD.f08` | `R-ENCASE-PROGRESS` | |
| N-47 | Rescue: guards free her | `AGREED` | `CUT` | the pod frames run backwards to `POD.f02` (she stands free) | `R-RESCUE` | |
| N-48 | She must not be killed in the fighting | `OPEN`: said by the owner in the voice session, absent from the written file | `CUT` | `GRL.death.1..3` (blood), `GRS.death.1..3` (no blood) | `R-WOMAN-HURT` | Confirm: can she be hurt, by whom, and does it end the game? |
| N-49 | Win: fully encased | `AGREED` | `CUT` + `READY` | `POD.f03`; `SFX.impactBell_heavy` | `R-WIN` | |

## D. Meters and screen

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-50 | One slime meter that refills, three uses | `AGREED`; costs and refill rate `OPEN` | `CODE` | a bar tinted slime green rgb(136,217,92); `GOO.drip_still` as a frame | `R-HUD` | |
| N-51 | Hold / struggle meter | `OPEN` (floated) | `CODE` | | `R-HUD` | |
| N-52 | Encasement bar | `AGREED` (progress to 100%) | `CODE` | | `R-HUD` | |
| N-53 | Player health | `AGREED` fragile; display and rebound `OPEN` | `CODE` | | `R-HUD` | Rule 7 of the Encounter spirit says no hidden health bars. |

## E. Street, cars and hazards

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-60 | A street to fight in | `AGREED` in spirit; which scene `OPEN` | `EXISTS` in the builder | `17_STREET_AND_VEHICLES.md` §2 | | |
| N-61 | At least one moving car | `AGREED` | `EXISTS` | two traffic lanes, `17_STREET_AND_VEHICLES.md` §4 | `R-CAR-HIT` | Cars brake for people when they have room. |
| N-62 | Jump onto and off a car; a bad jump hurts | `AGREED` | `CODE` | landing `SFX.impactPlate_heavy`, `DUST.v4` | `R-CAR-JUMP` | Not in the builder. |
| N-63 | A ledge or roof to throw someone off | `AGREED` | `EXISTS` as geometry; `CODE` for falling | the bridge walls, `17_STREET_AND_VEHICLES.md` §3 | `R-LEDGE-FALL` | Splash: `WAT.splash.1..19`. |
| N-64 | A third hazard | `OPEN` (shop window, electrical fixture floated) | `GAP` for broken glass and sparks | `TEX.Dec_Props_Fusebox_1`; the store's shop window | `R-WINDOW-BREAK` | See section G. |
| N-65 | More rails to chain along | `AGREED` in spirit | `CODE` (authoring) | | `R-RAIL-CHANGE` | Today's street network is one pavement line and one crossing. |

## F. Sound

| # | need | design | status | use | notes |
|---|---|---|---|---|---|
| N-70 | Hits, landings, steps | | `READY` | `SFX.impactPunch_medium`, `SFX.impactPunch_heavy`, `SFX.impactSoft_heavy`, `SFX.footstep_concrete` | `13_AUDIO.md` |
| N-71 | Gunshots, bomb blast | | `GAP` | stand-in `SFX.impactMetal_heavy` + `SFX.impactPunch_heavy` | `30_ONLINE_FINDS.md` §5 |
| N-72 | Slime | | `STAND-IN` | `SFX.footstep_snow` slowed + `SFX.impactSoft_heavy` | `30_ONLINE_FINDS.md` §5 |
| N-73 | Voices: guards, the woman | | `GAP` | | `30_ONLINE_FINDS.md` §5 |
| N-74 | Car engine, tyres, horn | | `GAP` | | `30_ONLINE_FINDS.md` §5 |
| N-75 | Something to play sounds at all | | `CODE` | | The builder has no sound code. |

## G. Pieces of the world that change state

The rule is in `21_MODULAR_DEGRADATION.md`. It is `AGREED` as a general rule and not built.

| # | need | design | status | use | recipe | notes |
|---|---|---|---|---|---|---|
| N-80 | Pieces that have a few ready-made states | `AGREED` rule; which pieces first `OPEN` | mixed | families in `21_MODULAR_DEGRADATION.md` §5 | `R-STATE-CHANGE` | |
| N-81 | Wall section: whole, opened, cut down | `EXAMPLE` | `READY` | `KBK.wall` → `KBK.wall-window-square` → `KBK.wall-doorway-square`; `KBK.wall-low` | `R-STATE-CHANGE` | All 2.0 × 2.4 m, so they swap in place. |
| N-82 | Shop window: whole, shattered | `EXAMPLE` | `GAP` (no shattered glass) | `TEX.Glass_01_1`; sound `SFX.impactGlass_heavy` | `R-WINDOW-BREAK` | A broken window is not a route unless a link is authored through it. |
| N-83 | Surface that shows damage | `EXAMPLE` | `READY` | `TEX.Brick_Plaster_01_1` → `TEX.Brick_Plaster_01_Bullets_1` → `TEX.Brick_Plaster_01_Hole_1`; decals `TEX.Dec_Damage_Bullets_1`, `TEX.Dec_Damage_Hole_1` | `R-STATE-CHANGE` | Looks only. |
| N-84 | Car: whole, dented, wrecked | `EXAMPLE` | `GAP` | | | Must live with the builder's own vehicle records, not beside them. |
| N-85 | Dust and noise for a change | `AGREED` (effects mirror the change) | `READY` | `DUST.v1`, `KSM.whitepuff.00..24`, `KPA.dirt_01`, `SFX.impactPlank_medium`, `SFX.impactWood_heavy` | `R-STATE-CHANGE` | |
| N-86 | Guards react to lost cover or a new opening | `AGREED` | `CODE` | | | Through the ordinary decision process (N-33). No separate "destruction" behaviour. |

---

## The gaps, in one list

Art: a kick that matches the player · punch, grab and throw frames for the player's body · hands holding a person · a drawn bomb throw · a rifle for the `GNC` body · snared or struggling guards · a guard freeing someone · the woman struggling, carried or half-slimed · tumbling bodies beyond one set · shattered glass, rubble, dented or wrecked cars, sparks.

Sound: everything except impacts and footsteps.

Behaviour, none of it built: jump and rail change · standing on a car · grab, throw, carry · the slime meter · pod progress and rescue · injury from cars and falls · the squad's shared decision process on a street · state changes to the world · any sound at all.
