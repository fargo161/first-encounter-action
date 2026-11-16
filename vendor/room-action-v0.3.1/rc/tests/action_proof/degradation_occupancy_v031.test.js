'use strict';
// New regression: a replacement collider must not materialize inside an occupied legal space.
const assert=require('assert');
const P=require('../../source/actor-physical');
const w=P.create({
 geometry:{surfaces:[{id:'ground',x0:-10,x1:10,y0:-10,y1:10,z:0}],boxes:[]},
 routeEdges:[{A:{x:0,y:4,z:0},B:{x:0,y:-4,z:0},band:9}],
 actors:[{id:'test_a',x:0.84,y:0,z:0,testMode:'idle'}],
 definitions:{fixture:{initialState:'small',states:{small:{boxes:[{x0:-.4,x1:.4,y0:-.2,y1:.2,z0:0,z1:1}]},expanded:{boxes:[{x0:-.4,x1:1.2,y0:-.2,y1:.2,z0:0,z1:1}]}},transitions:[{from:'small',to:'expanded',minSeverity:1}]}},
 pieces:[{id:'p',definition:'fixture',state:'small',x:0,y:0,z:0}]
});
const p=w.W.pieces[0],a=w.get('test_a');
assert(!w.clear(a,a,['test_a']), 'initial location should be clear');
assert.strictEqual(w.changePiece(p,{id:'event1',severity:2}),false,'expanding into the actor must be postponed');
assert.strictEqual(p.state,'small','deferred transition must not mutate world state');
assert(w.W.events.some(e=>e.type==='piece_change_deferred'&&e.piece==='p'));
a.x=3;
assert.strictEqual(w.changePiece(p,{id:'event2',severity:2}),true,'unoccupied state change should succeed');
assert.strictEqual(p.state,'expanded');
assert.strictEqual(w.W.events.filter(e=>e.type==='piece_changed').length,1);
assert.strictEqual(w.changePiece(p,{id:'event2',severity:2}),false);
console.log('PASS 2/2: occupied expansion deferred; clear expansion commits exactly once');
