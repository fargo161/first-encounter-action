# ROOM CREATOR × ENCOUNTER — MODULAR ENVIRONMENTAL DEGRADATION
## Architecture decision and manifest-rebuild handoff

**Date:** 2026-11-15  
**Intended recipient:** Claude, while rebuilding the development/architecture manifest  
**Source:** Owner-directed design discussion, November 15, 2026  
**Status:** Approved **general design rule**; exact implementation and interfaces **not yet approved**  
**Action authorized by this document:** Ingest, reconcile and document in the manifest. **Do not interpret this handoff as permission to edit Room Creator source or implement the feature.**

---

## 1. Decision in one paragraph

Use **preauthored modular environmental states** rather than expensive live procedural destruction. A destructible or degradable world element has a small authored set of visual/physical variants, which are switched when relevant damage or other world events warrant a change. Think of *SimCity*-style neighborhood degradation: the scene looks different because the model or tile changes, while the gameplay ramifications can remain simple. A damaged wall might block passage; a collapsed section might open a new route; an altered storefront or barricade might change cover, visibility, or access. **This is a world-wide reusable rule wherever applicable, not only a one-off, scripted cinematic effect.** It should be visually expressive, computationally inexpensive, legible to the player, and consequential to the simulation.

## 2. Why the owner wants it

- The immediate action playground stresses Room Creator with first-person jumps, rail transfers, melee displacement, moving cars, hazards, and NPCs responding to the changing scene.
- The desired style is **high apparent destruction and meaningful play consequences at low runtime cost**.
- The resulting system should eventually carry across the wider world/tooling, without turning every object into an expensive simulated fracture problem.
- The world should remain interesting to agents: an opening, lost cover position, or blocked path should affect what an NPC can do, and its priorities may change as a result.
- **Collapse repeated design patterns into shared systems.** Avoid bespoke code for every building, wall, vehicle, or attack.

## 3. Approved requirements — treat these as decisions

**R1 — State variants, not continuous fracture.** The general model is swapping among **prebuilt variants** of eligible physical objects/tiles/modules. Do not require procedural mesh fracturing, deformable rigid-body geometry, or expensive whole-scene destruction.

**R2 — Generalizable rather than set-piece-specific.** This is a reusable system for applicable walls, windows, doors, barricades, storefront details, cover, vehicle elements, and other authored environmental modules. Not every object must be destructible, and not all eligible objects must share the same variant count.

**R3 — Different states can mean different gameplay.** A state transition can change rendering and one or more of: collision/solid footprint, passability, rail or portal availability, cover value, obstruction, sightlines, hazard status, interaction access, and navigable space. Some transitions can be purely visual; some can change multiple things. No requirement to change all of them.

**R4 — Small discrete changes are sufficient.** Typical authoring might offer `intact → damaged → destroyed` or `usable → blocked`, but those are **examples, not a mandated global three-stage schema**. A wall could degrade and become impassable; another could be destroyed to create an opening. State meanings are authored per archetype.

**R5 — Physical events can trigger changes.** Melee throws, collisions with moving vehicles, impacts, explosions, or other qualifying actions may trigger state transitions. The source of the hit should not require a special-case wall script; the system should consume generic impact/damage/event information and apply authored rules.

**R6 — An ongoing world, not a fake cutscene.** The changed object must be visible and relevant to subsequent movement, collision, tactical choices, and NPC responses, rather than being a cosmetic animation while the original world remains physically unchanged.

**R7 — Respect the established separation of authority.** Room Creator owns authored physical environment data and its geometric consequences. Encounter supplies validated actor/object/world actions, causal consequences, observation, and persistence. Do not create duplicate authoritative world histories or competing movement/vehicle systems.

**R8 — Preserve current project ownership.** **Nova/ChatGPT owns ROOM/Room Creator editing**. Claude may work on Encounter and manifests, but **must not edit ROOM source** or silently change Room Creator's physical rules based solely on this handoff. Capture requirements, map dependencies, surface gaps, and request an explicit owner-approved implementation pass for ROOM changes.

**R9 — Separate prototype from product direction.** The current action playground is a standalone test of Room Creator's physical range. Its kinetic action mechanics are **not a mandate to redesign Trap Star or the main First Encounter experience**. The modular-degradation architecture, however, is intended as general reusable infrastructure.

## 4. Example behavior (illustrative, NOT fixed specifications)

| Element | Possible states | Possible gameplay consequences |
|---|---|---|
| Wall section | Intact / cracked / collapsed | Full blocker → partial blocker → route through opening |
| Storefront window | Intact / shattered | Blocks passage → can pass or see through; shattered frame may remain hazardous |
| Door or barricade | Closed/whole / battered / broken | Access or cover changes; may become obstructed rather than open |
| Street object | Whole / displaced / wrecked | Cover shifts; passage or landing surface changes |
| Vehicle element | Serviceable / damaged / wrecked | Footprint, cover, hazards or ability to use it can change, subject to Vehicle World authority |

Examples must not be reinterpreted as a requirement to implement all these object classes in the first slice.

**Action-playground example:** The player lands a kick, grabs a defending NPC, and throws that NPC into a storefront module. A sufficiently strong impact promotes the module from one authored state to another. The rendered model changes, dust/debris can sell the hit, and the physical collision/navigation now matches the new state. An NPC subsequently chooses a route or cover location using the changed opportunities. **The impact, state change and new affordances matter more than simulated debris fragments.**

**Important nuance:** degradation must not always mean 'more passable'. Rubble can *block* a route, and a smashed barrier can *open* one. The authored new state's physical affordances decide.

## 5. System responsibilities and integration boundary

### Room Creator / ROOM — environment, authored physical opportunities

- Author and export the eligible module's identity and its permitted state variants, including models/tiles, authored physical footprint/collision, access/portal/rail consequences, and optional presentation effects.
- In active play, represent the actual geometry and immediate physical consequences associated with the active variant. Preserve established route, collision, occupancy and Vehicle World contracts.
- Expose enough **stable, qualified identifiers** and queryable affordances for another system to know what changed and what actions are now possible.
- Authoring need not make every scene object breakable or require dozens of variants.

### Encounter — causality, world state and autonomous response

- Authoritatively validate/record consequential state changes, their causes and results in its existing Core history/persistence model **when Encounter is the active game host**.
- Observe/receive Room Creator's reported physical consequences and make them available to agents through existing observation/action/decision mechanisms.
- NPCs react to changed access, cover, line of sight, routes, or obstacles using their ordinary dispositions and goals. Do not add an unrelated 'destruction personality' or separate decision brain.
- Where the ROOM-only playground is tested without Encounter, ROOM may need a minimal local active-state driver for physical demonstration; such a local test mechanism **must not be misrepresented as a second authoritative persistent Encounter world**.

### Rendering / effects — presentation, not authority

- Use model/texture swaps, short debris bursts, dust, hit sounds, and inexpensive animation to sell transitions.
- Effects mirror the state change; they do not independently decide collision or game outcomes.

**Integration invariant:** One authoritative state transition is applied once, and each dependent system updates from it. No divergence between what the player sees, what the collider allows, and what the NPC believes is physically possible. Exact ownership and handoff timing in the active runtime must be reconciled against the real code before implementation.

## 6. Proposed implementation pattern — discussion starter only

The following is an **optional technical shape**, not a finalized schema, API, or demand for new subsystems:

```text
DestructibleModuleDefinition
  moduleType / asset family
  allowedStates: [stateName ...]
  perState: {visualAsset, collisionShape, affordances, optionalEffect}
  transitionRules: {event conditions -> targetState}

DestructibleModuleInstance
  qualifiedWorldId
  moduleType
  authored placement / parent
  currentState [runtime projection of one authoritative change]

Generic event example:
  impact(targetId, sourceId, contact, severity, tags)
     -> validate threshold / allowed transition
     -> record state transition
     -> update projected rendering, collision and affordances
     -> notify/observe agents
```

Do not assume a global numeric hit-points system is required. A transition can be triggered by one discrete qualifying event, by accumulated damage, or by other authored rules. Exact damage thresholds, collision classes, event names, format and serialization remain **open questions**.

**Performance defaults worth evaluating, not mandatory:** small LOD-friendly model sets; pooled debris/effects; simple stable colliders; no persistent physics simulation for every shard; update pathing/visibility only when affected affordances change; retain qualified identity across visual swaps.

## 7. High-priority compatibility concerns for the manifest

1. **Room Creator rail topology:** A visual opening does not automatically create a usable rail/transfer. Record the need for authored/validated route and portal changes when the gameplay intends passage.
2. **Vehicle World:** Do not introduce a second source of vehicle poses, impacts, or occupancy. Vehicle degradation should remain compatible with existing vehicle identity/state and one physical authority.
3. **Identity persistence:** Swapping an asset variant must not accidentally create a new persistent object identity. Treat the module as the same world entity with an altered state.
4. **Encounter causality:** One committed transition should be traceable in history, and agent observations should reflect the actual committed state.
5. **Determinism:** Existing replay/export and regression expectations should not be weakened. Repeated identical qualifying inputs should reproduce transitions and resultant affordances.
6. **Separation of responsibilities:** In a ROOM-only visual stress test, do not assume full Encounter integration is necessary to prove the physical swap. Conversely, do not describe local test flags as the final persistent-game architecture.
7. **Scope:** Do not promote destruction, mesh fragmentation, or a new physics engine to an initial blocker for the action playground.

## 8. Minimal acceptance demonstrations (future proposed tests)

- **State and identity:** A known wall/prop keeps the same qualified identity across intact/damaged/destroyed presentation variants.
- **Collision consistency:** A swap changes its collision or blocking status as authored, with no lingering invisible old collider.
- **Route consistency:** An opening permits traversal only if there is a valid corresponding navigational transition; rubble can close a formerly available path.
- **Agent response:** An NPC using the same general decision machinery changes its chosen route, guard position or cover because of the new affordances, not because a level-specific cutscene commanded it.
- **Event/persistence:** The causal transition can be recorded and reloaded/replayed in a host that supports it; no duplicated event or contradictory state.
- **Performance:** A small number of simultaneous swaps/effects remains playable and avoids simulated fragment piles.
- **Regression:** Modules without degradation data behave just as they did before; legacy routes and vehicle physics are not silently rewritten.

These are recommended future proof targets, **not assertions that any test currently exists or passes**.

## 9. Scope, unknowns and explicit non-goals

### Confirmed/approved

- General, reusable, modular, authored state degradation.
- Potential gameplay effects beyond appearance.
- No requirement for live procedural fracture.
- Application to eligible world objects, not just scripted heroic moments.
- ROOM / Encounter ownership boundary and preservation of current project.

### Still undecided; capture as open questions, not answers

- Exact state schema and file format; whether to extend existing prop/asset records.
- Whether Room Creator exposes dynamic toggles of existing route edges or requires a new mechanism.
- Which objects participate in version one; number of variants per archetype.
- Exact transition triggers, damage accumulation, event severity/tags, resets/repair.
- When/how Encounter Core commits the change relative to the physical update.
- Which simple collision and navigation representations suit the current runtime.
- Which visual models/effects already exist in the asset compilation.

### Not requested

- A whole-city simulation of structural stress or continuously breaking geometry.
- Realistic per-fragment rigid-body physics or complex debris persistence.
- Universal destructibility on every object.
- New AI framework, new renderer/physics engine, new duplicate vehicle runtime.
- Immediate source-code implementation or migration of existing authored worlds.

## 10. Instructions for Claude during the current manifest rebuild

1. **Ingest this as a user-approved architectural direction** and integrate it into the relevant manifest sections: ROOM authoring, physical state, environment modules, gameplay affordances, Encounter observation/causality, integration boundaries, pending work, and test contracts.
2. **Do not mark the system implemented** merely because the design has been approved; distinguish existing capability from this new requirement.
3. **Do not edit Room Creator source**. ROOM changes are owned by Nova/ChatGPT and need a separately authorized implementation contract.
4. **Do not build a competing Encounter system.** Reconcile this with current Encounter Core identity/state/history/observation and the actual bridge.
5. Clearly distinguish **approved requirements** (section 3) from **illustrative examples**, **implementation options** (section 6), and **open decisions** (section 9).
6. Preserve unrelated frozen/checkpointed work and current regression contracts.
7. Report any conflict with the current manifest, plus the smallest next steps and which owner should perform them.

---

**One-line architectural mantra:** *Fake the fracture, honor the consequence: authored visual variants, real world-state affordances, one causal history, and autonomous NPC responses.*
