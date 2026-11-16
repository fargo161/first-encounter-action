'use strict';
const fs=require('fs'),path=require('path'),C=require('../source/core');const root=path.resolve(__dirname,'..');
const b=JSON.parse(fs.readFileSync(path.join(root,'examples/Action_Physical_Proof.room.json'))),n=b.project.routeNet,s=n.physicalProof;
const a=JSON.parse(fs.readFileSync(path.join(root,'characters/action_pressure/runtime_assets.json')));
b.project.name='Action Playground · Physical Integrity 0.3.1';b.assets=b.assets.filter(x=>!x.id.startsWith('action_atlas_')).concat(a.assets);n.characters=a.characters;s.firstperson=a.firstperson;
// v0.3.1: broken stubs must fit within the intact stand-in's collision depth.
// Do this in authored scene output, never by introducing a special-case runtime collider.
const intact=s.definitions.practice_barrier.states.whole.boxes[0];
for(const stub of s.definitions.practice_barrier.states.broken.boxes){
 stub.y0=Math.max(stub.y0,intact.y0);stub.y1=Math.min(stub.y1,intact.y1);
}
s.schema='room-physical-proof@0.3.1';s.config.combatMode='pressure_v03';s.combatTuning={guardMax:100,guardRegen:24,guardRegenDelay:1.1,guardRecovery:72,wiltSeconds:1.7,blockArc:140,counterPause:.46,counterInterval:1.30,flyKickSpeed:9.5};
s.presets.practice.title='PRESSURE / GUARD BREAK';s.presets.practice.hint='Tap LMB to chain lights. Hold LMB to block. F heavy · E kick. Break guard, then RMB grab → RMB throw.';
s.presets.barrier.title='BREAK GUARD / BREACH';s.presets.barrier.hint='Weaken the guard with light punches or F/E. During WILTING, RMB grabs. RMB again throws into the barricade.';
s.presets.drop.hint='Break guard, then RMB grab → RMB throw toward the drop. Both bodies obey the same impact rules.';
s.presets.inspection.hint='I cycles poses (including block/wilt), U facing, Q control, V appearance, B body. Mouse look is unrestricted outside inspection.';
s.presets.car.hint='Time W + Space from the teal block onto the car; release W before touchdown. Jump off with Space + S. W + Space + E is a flying kick.';
s.standIns=a.standIns.concat(a.presentationNotes,['NPC block is its own aim pose plus raised-hand overlay; no bespoke guard sheet','NPC driver is a local guard / counter test, not full Encounter AI']);
C.validateBundle(b);const dst=path.join(root,'examples/Action_Physical_Proof_v0_3.room.json');fs.writeFileSync(dst,JSON.stringify(b));console.log('Built',dst);
