const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');
for(const s of['route-traffic','vehicle-classes','vehicle-graph','vehicle-signals','vehicle-traffic','vehicle-world'])require(path.join(root,'source',s+'.js'));
const C=require(path.join(root,'source/core.js')),P=require(path.join(root,'source/actor-physical.js')),VW=globalThis.RCVehicleWorld;
function make(preset='practice',modify=null){const bundle=JSON.parse(fs.readFileSync(path.join(root,'examples/Action_Physical_Proof.room.json'))),p=bundle.project,n=p.routeNet,s=n.physicalProof;
 const actors=s.actors.map((a,i)=>({...a,...s.presets[preset].actors[i]}));
 const lookup=Object.fromEntries(n.vertices.map(v=>[v.id,{...v,z:C.storyElevation(p,v.story||0)}]));
 const opts={...s,actors,preset,geometry:P.roomGeometry(p,C),routeEdges:n.edges.map(e=>({...e,A:lookup[e.a],B:lookup[e.b],piece:e.physicalPiece})),vehicleWorld:VW.create({routeNet:n,props:p.props,seed:1977})};
 if(modify)modify(opts,p);const w=P.create(opts);w.spawnCar();return {w,p,s,opts};}
module.exports={make,C,P,VW};
