# Hands-first acceptance matrix
**All new-game rows below are requirements to implement and execute, not tests already passed.** Keep inherited donor evidence separately. Reviewer must publish PASS/FAIL/UNVERIFIED with command, fixture/seed, exact source revision, exit code and artifact path.

## A. Architecture and action truth

| ID | Exercise | Expected |
|---|---|---|
| A01 | Replay identical semantic requests through a human adapter and a training controller against equivalent states | Same resulting physical state/events, excluding source-of-input audit metadata |
| A02 | Swap controllers during neutral, attack preparation, recovery and stagger | Actor IDs, position, velocity, guard, Momentum and current commitment preserved; exactly one controller each |
| A03 | Hold mouse/key during swap; deliver an old pointer-up afterward | No phantom heavy/grab/throw or stuck button in either actor; old input epoch rejected |
| A04 | Replace/disable hand artwork and replay action trace | Same mechanical outcomes; missing art diagnosed separately |
| A05 | Replay at 30, 60 and 144 render scheduling rates | Same fixed-step state/events; no art-rate-dependent reach, guard or cooldown |
| A06 | Reverse actor iteration order in a simultaneous contact fixture | Equivalent outcome; no first-in-array winner; defined neutral clash/trade |
| A07 | Keep an attack overlapping target for multiple physics ticks | At most one outcome per action/target/subhit; no repeated damage from frame rate |

## B. Controls are a sketch

| ID | Exercise | Expected |
|---|---|---|
| B01 | R up/down, idle hands, change guard with wheel | Visible readiness/guard changes; lowered fists cannot RMB-heavy; guard request is not identical to actual coverage |
| B02 | LMB down, hold, release | Light begins on down when eligible; release does not produce another light; no LMB-hold block inherited from old controls |
| B03 | RMB release just below/at/above configurable tap threshold with raised fists | One documented boundary; quick-release heavy only; long reach preview never backfires into heavy |
| B04 | Long RMB misses; lower fists or lose focus before release | Withdraw/no attack; no stale queued heavy; no unexpected gameplay action from canceled capture |
| B05 | Rebind light/heavy/readiness/guard to alternative inputs in tuning UI; export/import profile | Controls work with no code change; resulting equivalent semantic trace preserves rules |
| B06 | Rapid repeated input and pause/unpause | Bounded one-command buffer and expiry; no prerecorded long flurry or pause catch-up attack burst |
| B07 | Q, F and Tab in new mode | No accidental legacy Q control-swap or F heavy; Tab dev-swap only if mapped; future controls clearly inactive/reserved |

## C. Fight rules

| ID | Exercise | Expected |
|---|---|---|
| C01 | Clean light, guarded light, heavy, miss | Distinct contact result/pressure/recovery and audio/visual cue; no outcome before logical contact |
| C02 | Intercept just early, in-window and just late; target behind/out of range | Only valid geometry/timing/hand availability parries; no global invulnerability |
| C03 | Mash LMB while committed | Does not indefinitely renew parry eligibility; can be punished |
| C04 | Spend one hand attacking while guard requested | That hand loses its coverage; the other hand's legal coverage remains; neither guards and strikes the same line at once |
| C05 | Make a defensive success then request next light; compare clean-hit continuation | Shared, inspectable combo opportunities; defensive success can open a continuation; not only cosmetic click counting |
| C06 | Break guard repeatedly | Visible stagger, bounded opening, recovery; no infinite unavoidable stun loop; no missing-clinch freeze |
| C07 | Switch Momentum off/on, whiff repeatedly, spam into stagger | Off mode has no bonus; gain/loss once per meaningful outcome; no free farm; maximum multiplier respected |
| C08 | New sparring encounter runs for 60 seconds | Ordinary contacts do not force a health-drain death race; both actors obey same sparring policy |

## D. Partner, space and presentation

| ID | Exercise | Expected |
|---|---|---|
| D01 | Change hidden queued input while visible state is identical | Partner decision unchanged until a permitted cue becomes observable |
| D02 | Stand quietly, approach, overcommit, retreat | Partner modestly changes spacing/guard and sometimes answers; not a statue or relentless boss |
| D03 | View preparation/contact/recovery in first and third person and from five directions | Both depict the same phase; obvious windups and blocked reactions; no static gunman masquerading as unarmed combat |
| D04 | Move/strafe into boundaries and the other body, walk off the authored support | No tunneling/rooting/overlap exploit; bounded floor footprint; no global removal of rail rules |
| D05 | Hand pose/frame debug stepping | Sparse meaningful poses, consistent wrist entry/anatomical side/scale; contact proxy visibly aligned; alpha/background clean |
| D06 | Simulate 20 deterministic 30-second exchange runs | No NaNs, permanent unresponsive actor, infinite stagger or duplicate contacts; record seeds and worst-case overlap |

## E. Actual browser and delivery

| ID | Exercise | Expected |
|---|---|---|
| E01 | Real mouse down/up/wheel and keyboard events after launch gesture | Intended actions occur; no browser context menu/page scroll stealing game input; not only direct core calls |
| E02 | Capture denied, Escape, pointer cancellation, focus loss, re-entry | Clear safe fallback/retry; no stuck fists or unintended queued action |
| E03 | Offline load of final self-contained HTML | All required code/art embedded/local; zero external requests during play; restart works |
| E04 | Audio locked/unlocked/muted | Initial gesture unlocks where needed; game works silently; no missing audio stops gameplay |
| E05 | Toggle presentation contact hold/camera effects | No change to authoritative contact timing; camera aim not silently turned |
| E06 | Performance observation | Report actual OS/browser/renderer/resolution/frame-time sample; software headless results not sold as hardware performance |
| E07 | Clean extraction and build, then source ZIP | Rebuild reproducible or nondeterminism explicitly explained; manifest current; named launch file present |
| E08 | Native Windows double-click | Record actual Windows test, or mark UNVERIFIED. A Linux content-load smoke is not this result |

## Human feel gate — Teddy, not an automated PASS

A ten-second exchange can include advance, a short chain, visible guard contacts, a readable answer, an intentional interception, counter, stagger and recovery. It must not be scripted to force that order. The owner can identify why a parry succeeded or failed and want to try again. Provide an immediate reset, mute/effect controls and a small timing panel. Do not attach a finished/fun claim to code tests.

## Handling inherited failures

Run the five focused donor files in their correct output layout. Retain the separately timed-out Claude findings file, attempt a bounded longer run, and report its outcome. New hands-mode acceptance cannot hide a baseline failure. Conversely, a legacy car/drop-mode defect outside this safe-floor slice should be recorded rather than driving an unrequested vehicle rewrite. Any defect reachable in the new slice must be fixed or cause explicit failure of the appropriate row.
