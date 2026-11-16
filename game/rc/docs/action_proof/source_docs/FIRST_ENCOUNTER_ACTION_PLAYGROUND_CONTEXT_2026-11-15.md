# ACTION PLAYGROUND — DESIGN CONTEXT AND SESSION HANDOFF

**Project:** Standalone first-person action playground / Room Creator stress test  
**Context captured:** November 15, 2026  
**Status:** Design conversation consolidated; **not** a claim that these mechanics have been built or tested  
**Audience:** Any future ChatGPT, Claude, or development session picking up this prototype

---

## 1. Executive Intent

Build a deliberately **video-gamey, action-movie playground** to push **Room Creator** and explore physical gameplay before layering on more sophisticated character simulation. It is **separate from the main Trap Star / First Encounter game's design and scope**. Do not interpret these notes as a directive to convert Trap Star into this action game.

The player is a highly mobile but fragile first-person attacker trying to get past a four-person armed NPC squad, capture a protected woman using **slime**, then defend her forming slime pod until encasement finishes. The environment is the player's primary weapon: rails, jumps, moving cars, ledges, impacts, and hazards matter as much as attacks.

**The governing design idea:** Preserve the *spirit of Encounter*, not necessarily its existing interface or mechanics. Character personalities, circumstances, and shifting objectives produce **fluid, autonomous, unscripted-seeming behavior**. The game feels like a kinetic first-person action title, but an Encounter-like decision process sits underneath NPC choices.

> **Core loop:** Approach and evade → disrupt armed defenders using movement, melee, slime and environmental throws → reach/secure the woman → relocate and initiate sustained slime encasement → guard the pod against rescuers → win when encasement reaches 100%.

The game should be **simple first, granular later**. Build the smallest set of systems that recombine into interesting situations instead of separate bespoke systems for each encounter.

## 2. Scope and Boundaries

### Agreed direction

- A standalone prototype/action playground for **Room Creator stress-testing**, not a pivot in Trap Star's core design.
- **First-person** action emphasizing velocity, positional choices and environmental interactions.
- Reuse the *idea* of the existing authored **rail system**, but make it feel like jumping or chaining among paths and platforms—**Tony Hawk's Pro Skater** was invoked as an analogy for moving between rails, not a request to add skating.
- Focus initially on **punching, kicking, grabbing, throwing, dodging/jumping and slime**. **No player fireballs** in the initial version.
- Opponents are armed and dangerous; the player is exceptionally fragile.
- Four-person defending squad; **pistol, rifle, bomb thrower** as the initial three weapon archetypes.
- Three independent NPC dispositions: **aggressive, defensive, sneaky/tactical**.
- The woman is initially guarded, may struggle/escape during attempted capture, and can be rescued from a developing pod.
- The capture objective changes the entire fight's roles: **attacker becomes defender**, guards become rescuers.
- Preserve simple, shared rules and autonomous NPC responses rather than scripted set pieces.

### Not established / not authorized by this conversation

- No exact engine integration, code architecture, asset mapping, UI, control scheme, visual implementation, numbers, timers, or tuning values were finalized.
- No existing Room Creator/Encounter implementation was inspected or validated in this discussion.
- This handoff is **not authorization to begin implementation** without the user's next instruction.
- Any reference to additional environmental objects, exact animations, meters, recovery behavior, or scenario layouts below is labeled as a **proposal**, not a settled requirement.

## 3. Player Identity and Combat Fantasy

The player is **dangerously mobile, not bulletproof**. They get close by exploiting movement: jump between rails, onto and off a moving car, avoid shots, drop down with an attack, shove or throw a defender into a hazard, grab the woman, and move quickly before the remaining squad responds.

This is **not** a conventional shooter where the player's strength is superior guns or large hit points. The player primarily controls bodies, space and opportunities:

- **Punch:** close-range strike, especially useful for interrupting or staggering.
- **Kick:** close-range strike with more displacement/knockback potential.
- **Grab:** establish a temporary hold on a hostile NPC or on the protected woman, with different consequences.
- **Throw:** move a grabbed enemy into another position or environmental danger.
- **Jump/dodge/rail transition:** evade fire and exploit different routes, heights and attack approaches.
- **Slime attack:** spend a recharging resource to temporarily ensnare enemies or aid/complete the capture objective.

The player can potentially kill an enemy through **enough repeated punches and kicks**, but that should take long enough to create danger. Melee's primary utility is **stun, displacement and opening windows**, while environmental violence can cause much more decisive harm.

### Fragility

- The user described **one or two gunshots** potentially killing the player, possibly a few more depending on tuning.
- NPCs are similarly vulnerable; they survive through teamwork, weapons, space and counterattack, not enormous health pools.
- **Possibly** some regenerating/rebounding health, but this was floated and **not decided**.
- Attacking one opponent for too long invites another defender to shoot; standing still or getting counter-stunned with firearms nearby is particularly dangerous.

### Counterplay and melee risk

Defenders must not be passive punching bags. After being staggered they may recover, strike back, block, shove or reposition. A counter can briefly stun the player, opening a lethal firing opportunity for another squad member. These were discussed as **preferred initial response concepts**, not finalized frame data or exact rules.

The desirable rhythm is **jump in → interrupt → reposition, throw or bypass → keep moving**. Prolonged one-on-one fistfights in front of an armed squad should be a bad choice, even when they are technically winnable.

## 4. Movement and Physical World

### Rail-driven mobility

Keep the authored rail approach as a foundation, but prioritize **fast first-person traversal and transitions**. Players should feel they can chain movement routes, jump between reachable locations, climb/land on moving platforms where supported, and perform attacks from motion. This is more arcade-like than the slow authored navigation of other planned projects.

Do **not** infer an unrestricted open-world movement system or a finalized traversal algorithm. The exact relationship of jump arcs, rail transfers, collision, air control and landing is still a technical/design question to test in Room Creator.

### Moving car — specifically requested as an early test

Include **at least one moving car** that the player can try to jump **onto and off of**:

- Correct timing can make it a moving platform, traversal option, attack launch point or escape route.
- Mistimed jumps/landings can cause injury or an unfavorable fall.
- A car can also be a dangerous environmental interaction for NPCs who are shoved or thrown into its path.
- This needs robust enough collision and motion handling to feel intentional, not a decorative car driving past.

### Destructible/action environment

The world should be **action-gamey and reactive**. Room Creator's spaces, storefronts, roads, ledges and other objects should be represented physically enough to support impact, collisions, hazards and destruction where appropriate. The player is the main force that **pushes the environment around**.

Environmental interactions discussed:

1. **Moving traffic:** platform and collision hazard; a throw into a car's path may be lethal.
2. **Elevated ledge/roof:** position and jump route; a throw off the edge may cause falling damage or death.
3. **One additional hazard or destructible object:** considered for the first test (examples suggested: storefront window, electrical fixture). **Specific third hazard is not chosen**.

Avoid an overbuilt destruction simulation. Start with legible shared collision, damage, impact and state-change rules that both player and NPCs can use.

## 5. NPC Squads, Weapons and BASED-like Dispositions

### Squad

- **Four armed defenders** initially protecting one woman.
- They actively respond **as a team**; mutual protection makes them far more dangerous than the same four NPCs in isolation.
- Their job changes when the woman is threatened, carried, slimed, or podded: defend, intercept, recover, interrupt the capture, or break the pod and rescue her.

### Initial weapon archetypes

| Weapon | Initial role | Notes |
| --- | --- | --- |
| **Pistol** | Armed close-/mid-range threat | Exact range, damage, aim and cadence TBD. |
| **Rifle** | Stronger ranged pressure / sightline threat | Exact handling TBD. |
| **Bomb thrower** | Area denial / anticipation | Type, explosions, friendly-fire and damage rules TBD. |

The user has a collection of combat assets including **energy weapons and other unusual firearms** which may support much wilder enemy loadouts later. **Those belong to NPC attacks**, not an assumption that the player also gains those powers. Start with the three archetypes above; don't invent a detailed arsenal before asset review.

### Dispositions — start with three

| Disposition | Default preference | Illustrative actions |
| --- | --- | --- |
| **Aggressive** | Push forward, seek the player, disrupt their approach | Hunt and advance even before the woman is reached, pressure and pursue. |
| **Defensive** | Stay near the woman, protect territory, hold useful positions | Guard, cover angles, repel intruders, prioritize recovery/rescue. |
| **Sneaky / tactical** | Set traps, anticipate routes, reposition and ambush | Cover rail transitions, exploit blind angles, intercept rather than rush. |

**Weapon and disposition are independent**: a defensive rifleman, aggressive bomb thrower and sneaky pistol user are all possible. Three weapon archetypes × three dispositions = **nine initial combinations**, not nine independently coded AI types.

### Shared decision process, different priorities

The design goal is **one shared NPC action/decision framework** taking account of:

- Disposition (the character's behavioral priorities)
- Weapon/capability (what they can physically do)
- Position, path/rail and visibility
- Immediate danger and squadmates' behavior
- Current state of the woman and the slime pod
- Available tactical opportunities

A shared set of actions may include **hold, advance, attack, reposition, protect, interrupt, recover, rescue**. Their priorities change based on circumstance. These are **conceptual actions**, not a claim they are already implemented in Encounter.

**Important:** Disposition is a preference, **not an inflexible script**. An aggressive NPC may abandon pursuit to assist a rescue; a defensive NPC may charge when the woman is being carried away; a sneaky NPC may ambush the player at a likely rail transition. The aim is *personality expressed through moment-to-moment gameplay*.

## 6. Slime — One Recharging Player Resource

The user replaced the earlier fireball idea with **slime as the player's distinctive ranged power**. Consider a **single rechargeable slime meter** shared across its uses; values and recharging details are unselected.

### Use A — disable armed defenders

Shoot slime at a hostile NPC to **slow, snare or temporarily immobilize** them. This provides an opening to close distance, bypass, grab or throw the opponent. Spending slime on a guard trades capture readiness for short-term combat safety.

### Use B — help secure the woman

The player may attempt to **grab her directly**, but she should resist and potentially get free. A **grip/struggle meter** was floated as one way to represent this, not formally chosen. **Slime her first** to lengthen the window to grab, hold and carry her away. This is a tactical decision rather than a guaranteed capture.

Carrying her meaningfully changes the player's capabilities:

- The player has **restricted or temporarily unavailable attacks** while holding/carrying her.
- Moving/jumping with her may be possible but more difficult or risky; details TBD.
- She is not a passive inventory item: she can struggle, possibly escape, and change the NPCs' priorities.

### Use C — form the pod

At a chosen location, the player applies a **prolonged/sustained slime attack** to start or form a pod around her. This requires an exposed window of time and access to enough slime. The exact separation between initial application and pod formation, and how interruptions/recharging work during it, remain open tuning questions.

### Formed pod versus finished encasement

The pod's initial formation is **not** immediate victory. After formation, **full encasement takes additional time**. The player must defend the pod while defenders try to free her. The **win condition is full encasement (100%)**, not first grabbing her or first making the pod.

A pod with world position, integrity and progress is a **suggested implementation model** for Room Creator / Encounter coordination, not an already built data structure.

## 7. The Central Dynamic Reversal

This is the gameplay's most distinctive feature and should survive scope reductions.

### Phase 1 — Player attacks, squad defends

The woman is protected. NPCs hold/seek/trap based on dispositions. The player uses motion, melee and slime to produce an opening and reach her.

### Phase 2 — Player grabs and relocates

The player may slime her first, grab and carry her, or attempt a raw grab. She can struggle/escape. The squad shifts toward stopping her removal, chasing, intercepting and rescuing her. Carrying reduces the player's ability to fight back.

### Phase 3 — Sustained slime application / pod formation

The player needs an exposed interval to encase her initially. NPCs may interrupt the player or recover her. Positioning and remaining slime matter.

### Phase 4 — Player defends, squad attacks

Once the pod is formed, the woman's encasement progress advances over time; the **player now defends the objective**. Surviving guards become rescuers and try to break or interrupt the encasement. Their **dispositions remain relevant**, but changing stakes alter their chosen actions.

### Resolution

- **Player victory:** Full encasement reaches **100%** while the pod remains secure.
- **Possible failure/reversal:** NPCs break/open the pod, free her, or interrupt capture; combat/capture may resume depending on chosen reset/retry rules. The precise reset conditions are **not decided**.
- **Player death:** Expected to be frequent if they are careless around gunfire or become trapped in long melee exchanges. Respawn/restart rules are TBD.

This is **one continuous evolving situation**, not two separately scripted game modes.

## 8. Why This Is Still Encounter in Spirit

The user explicitly clarified that the point is **not** to copy Encounter's social dialogue mechanics into a shooter. Rather:

1. **Autonomy:** NPCs perform believable actions toward the player and each other without waiting for scripted triggers.
2. **Disposition:** Character personality changes which actions they favor, even with identical weapons.
3. **Situational response:** Priorities change as the woman is threatened, seized, relocated and podded.
4. **Causality:** The same physical world state leads to consequences—injury, knockback, blocked access, exposure to fire, rescue opportunities, capture progress.
5. **Combinatorial simplicity:** A shared action vocabulary plus different weapons/dispositions/situations produces variety; do not create a bespoke AI for every combination.

The user's formulation: NPCs are essentially performing **Encounter actions against the player**, but it should **feel like a first-person shooter**. This action-focused prototype explores the same ethos of **fluid, dynamic change and personality through gameplay**.

### Integration ownership / boundaries

- **Room Creator:** Author spaces, positions, rails/transitions, objects, collisions, moving car(s), elevations, hazards and destructible interactions. This prototype is intended to stress-test those capabilities.
- **Encounter-like behavior layer:** Select/validate agents' actions, honor dispositions and current circumstances, coordinate squad decisions and causal state changes. Whether this uses the existing Encounter implementation directly is **to be determined**, not assumed.
- **Visual/asset systems:** Render characters, weapons, reactions, effects and animation where available. No complete asset mapping is certified in this conversation.

For the established project workflow, **ChatGPT/Nova handles Room Creator modifications**; Claude is used for Encounter-side work after Room Creator's relevant changes are checkpointed. Keep that ownership separation unless the user changes it.

## 9. Minimal First Playable Slice — Proposed, Not Ordered

A practical **suggested** proof-of-concept, intended to test the loop rather than attempt a complete game:

- **One compact playable area**, preferably a street/storefront section with an elevated route/ledge.
- **One moving car** that can carry a jumping player and create collision danger.
- **One additional simple hazard/destructible object**, chosen during implementation planning.
- **First-person player** with rail-based jumping/dodging, punch, kick, grab, throw and slime meter.
- **Four hostile NPC defenders** using weapon/disposition combinations from the agreed 3×3 set.
- **One protected woman** capable of resisting an ordinary grab.
- **Slime snare**, improved grip when pre-slimed, carry restrictions, sustained pod formation, delayed completion, and NPC rescue attempts.
- **Readable feedback** for staggering/recovery, slime availability, grip/resistance if implemented, and pod completion; UI specifics TBD.

### Suggested observations that would prove the design is working

These are **evaluation ideas**, not tests that already exist:

- Same rifle, different dispositions: one advances, one stays to guard, one maneuvers to intercept.
- Same disposition, different weapons: choices reflect rifle sightlines versus pistol proximity versus bomb placement.
- Capture state changes NPC priorities: defenders stop simply guarding a point and begin intercepting/rescuing.
- A long punching exchange exposes the player to a second NPC's gunfire; a quick stagger/throw can open a path.
- Jumping onto/off the moving car yields useful tactical opportunities, while a botched landing has tangible consequences.
- Slime spent on guards is unavailable for immediate capture until it recharges.
- Forming the pod does not end the encounter; surviving guards try to free the woman, and the player must defend progress to 100%.
- Disposition remains visible through the transition from defense to rescue, without switching to an entirely unrelated AI script.

## 10. Decisions Still Needed

Keep these open until deliberately settled:

- Exact rail-jump model, input/control mapping, camera freedom and navigation edge cases.
- Which actions work midair, during a landing, or while carrying the woman.
- Player/NPC health values, optional health rebound, damage falloff, invulnerability windows (if any).
- Stagger/knockback/throw distances, counters, recovery windows and animation telegraphs.
- Impact, car, falling and other hazard damage; destructible object set.
- Whether/how NPCs can themselves grab/throw the player or interact with all hazards.
- Weapon statistics, projectile types, blast behavior and friendly-fire rules.
- Slime meter capacity, drain, recharge speed, range and snare duration.
- How exactly the woman's grip/struggle/escape behavior is represented.
- Pod-formation hold time, interruption rules, pod durability, rescue methods and restart behavior.
- Squad coordination level, collision/navigation reliability, line-of-fire behavior and decision frequency.
- Exact asset inventory and which of the compiling assets are ready for integration.
- Whether Encounter's present code already supplies any required behaviors and what must be built anew.

**Do not convert these TBDs into supposed prior decisions.** Favor the smallest faithful prototype and show the user concrete tradeoffs when asking for a choice.

## 11. Quick Scenario to Convey the Feel (Illustrative)

The player dashes along one rail while a rifleman holds a clear firing lane. A car comes through the street; the player times a jump onto it, rides briefly, then leaps off to kick the rifleman backward. The pistol defender moves toward the protected woman. A bomb thrower watches a likely transition and throws ahead of the player. The player avoids that route, stuns one guard with a short slime burst and reaches the woman. A raw grab fails quickly because she struggles. After escaping gunfire, the player slimes her, grabs her, and jumps toward a sheltered position—unable to brawl normally while carrying her. A sustained slime application forms a pod. Now the player must leave the pod intact and repel defenders who have switched from holding a perimeter to attempting a rescue. The pod reaches 100%; the player wins.

This scenario demonstrates the intent, **not** a mandated scripted sequence or exact animation list.

## 12. Handoff Instructions for the Next Session

1. Treat this file as a **design-context handoff**. Confirm current actual build status from source/assets before making implementation claims.
2. Keep the project **separate from Trap Star**. It is a contained action playground expressly intended to push Room Creator and later support more nuanced systems.
3. Prioritize **feel, reactive physical space, movement, quick melee control, fragile life and a reversible capture objective** over added attack types or simulation complexity.
4. Preserve **three initial NPC dispositions, three weapon types, one shared behavioral process**, and a squad of four.
5. Preserve **slime**, not player fireballs, as the player's special resource; protect the capture–defense reversal.
6. Clearly distinguish **agreed gameplay**, **suggested implementation**, and **unresolved specifics**.
7. **Wait for the user's explicit direction** before building or modifying code. If asked to implement, inspect actual Room Creator, Encounter, and asset files first and checkpoint work in the correct ownership order.

**One-sentence north star:** *A fragile, hyper-mobile first-person slime attacker turns a destructible rail-connected street into a weapon, fights past an autonomous armed squad, and then must protect an evolving slime pod as that squad dynamically changes from defenders to rescuers.*
