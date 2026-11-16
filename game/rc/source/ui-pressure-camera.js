/* Opt-in pitched software presentation for the physical proof.
 * Reads ROOM geometry/materials and actor state. Does not own collision or motion.
 * Legacy editor cameras and the original Canvas path are untouched.
 */
function apSoftwareFrame(v){
 const W=480,H=Math.round(W*v.height/v.width),sv={...v,width:W,height:H},f=C.lens(sv).f,b=C.basis(v.facing),pitch=C.rad(v.pitch||0),cp=Math.cos(pitch),sp=Math.sin(pitch),eye=(v.floorZ||0)+v.eyeHeight;
 if(!AP.pitchCanvas)AP.pitchCanvas=document.createElement('canvas');const cv=AP.pitchCanvas;cv.width=W;cv.height=H;
 const out=new ImageData(W,H),pixels=new Uint32Array(out.data.buffer),depth=new Float32Array(W*H);depth.fill(Infinity);
 const pack=(r,g,bl)=>((255<<24)|((Math.max(0,Math.min(255,bl))|0)<<16)|((Math.max(0,Math.min(255,g))|0)<<8)|(Math.max(0,Math.min(255,r))|0))>>>0;
 for(let y=0;y<H;y++){const rayZ=sp+((H/2-y)/f)*cp,s=Math.max(0,Math.min(1,rayZ*.65+.4)),color=pack(30+40*s,43+55*s,53+67*s);pixels.fill(color,y*W,(y+1)*W);}
 const toView=(p)=>{const x=p.x-v.x,y=p.y-v.y,z=p.z-eye,h=x*b.fx+y*b.fy;return {x:x*b.rx+y*b.ry,y:z*cp-h*sp,z:h*cp+z*sp,u:p.u||0,v:p.v||0};};
 const textures=AP.pitchTextures||(AP.pitchTextures=new Map());
 const texture=(style,host)=>{const key=JSON.stringify(style);if(textures.has(key))return textures.get(key);const rr=R.prepareRoom(projectRef(),host||projectRef().rooms[0]),st=R.prepareStyle(style||C.surface('#63727a','concrete'));
  const n=128,p=new Uint32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)p[y*n+x]=R.sample(st,x/n,y/n,rr,0,0,1);const tex={w:n,h:n,pixels:p,repeat:true};textures.set(key,tex);return tex;};
 function projectRef(){return project;}
 const projectData=project;
 // Actual source styles, cached on reset (not substituted world geometry).
 const appearance=AP.pitchAppearance||(AP.pitchAppearance=new Map());
 function styleFor(q){if(appearance.has(q.id))return appearance.get(q.id);let style=null,host=null;
  for(const r of [...projectData.rooms,...(projectData.floorSections||[])])if(q.id.startsWith(r.id+':')){style=q.kind==='ceiling'?r.ceiling:r.floor;host=projectData.rooms.find(h=>h.id===r.id)||projectData.rooms[0];break;}
  if(!style&&q.kind==='pillar')style=projectData.pillars.find(p=>p.id===q.id)?.surface;
  if(!style&&q.kind==='wall'){const w=C.roomWalls(projectData).find(w=>q.id.startsWith('wall:'+(w.id||w.partitionId||w.roomId||'')+':'+w.axis+':'+w.fixed+':'));if(w){const o=C.ownerFacing(w,v,projectData);style=C.wallStyle(projectData,o);host=projectData.rooms.find(r=>r.id===o.roomId);}}
  const a={tex:texture(style||C.surface('#65727a','concrete'),host)};appearance.set(q.id,a);return a;
 }
 function polygon(points,tex,shade=1){let ps=points.map(toView),clipped=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length],inside=a.z>=.075,next=z.z>=.075;if(inside)clipped.push(a);if(inside!==next){const t=(.075-a.z)/(z.z-a.z),q={};for(const k of ['x','y','z','u','v'])q[k]=a[k]+(z[k]-a[k])*t;clipped.push(q);}}
  if(clipped.length<3)return;ps=clipped.map(p=>({x:W/2+p.x*f/p.z,y:H/2-p.y*f/p.z,iz:1/p.z,u:p.u/p.z,v:p.v/p.z}));for(let i=1;i<ps.length-1;i++)triangle(ps[0],ps[i],ps[i+1],tex,shade);
 }
 function triangle(a,b,c,tex,shade){const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<1e-5)return;
  const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(H-1,Math.ceil(Math.max(a.y,b.y,c.y)));if(x1<x0||y1<y0)return;
  const ix=1/area,A=(b.y-c.y)*ix,B=(c.x-b.x)*ix,D=(c.y-a.y)*ix,E=(a.x-c.x)*ix;
  for(let y=y0;y<=y1;y++){let w0=((b.x-(x0+.5))*(c.y-(y+.5))-(b.y-(y+.5))*(c.x-(x0+.5)))*ix,w1=((c.x-(x0+.5))*(a.y-(y+.5))-(c.y-(y+.5))*(a.x-(x0+.5)))*ix;
   for(let x=x0;x<=x1;x++,w0+=A,w1+=D){const w2=1-w0-w1;if(w0<-.00001||w1<-.00001||w2<-.00001)continue;const inv=w0*a.iz+w1*b.iz+w2*c.iz;if(inv<=0)continue;const z=1/inv,i=y*W+x;if(z>=depth[i])continue;
    let u=(w0*a.u+w1*b.u+w2*c.u)*z,vv=(w0*a.v+w1*b.v+w2*c.v)*z;if(tex.repeat){u-=Math.floor(u);vv-=Math.floor(vv);}else if(u<0||u>1||vv<0||vv>1)continue;
    const tx=Math.min(tex.w-1,Math.max(0,Math.floor(u*tex.w))),ty=Math.min(tex.h-1,Math.max(0,Math.floor(vv*tex.h))),color=tex.pixels[ty*tex.w+tx],alpha=(color>>>24)/255;if(alpha<.06)continue;
    const old=pixels[i];pixels[i]=pack((color&255)*shade*alpha+(old&255)*(1-alpha),((color>>>8)&255)*shade*alpha+((old>>>8)&255)*(1-alpha),((color>>>16)&255)*shade*alpha+((old>>>16)&255)*(1-alpha));if(alpha>.5)depth[i]=z;
   }
  }
 }
 function box(q,tex){const{x0,x1,y0,y1,z0,z1}=q,vert=(x,y,z,u,v)=>({x,y,z,u,v});
  if(v.x<x0)polygon([vert(x0,y0,z0,y0,z0),vert(x0,y1,z0,y1,z0),vert(x0,y1,z1,y1,z1),vert(x0,y0,z1,y0,z1)],tex,.82);
  if(v.x>x1)polygon([vert(x1,y1,z0,y1,z0),vert(x1,y0,z0,y0,z0),vert(x1,y0,z1,y0,z1),vert(x1,y1,z1,y1,z1)],tex,.82);
  if(v.y<y0)polygon([vert(x1,y0,z0,x1,z0),vert(x0,y0,z0,x0,z0),vert(x0,y0,z1,x0,z1),vert(x1,y0,z1,x1,z1)],tex,.95);
  if(v.y>y1)polygon([vert(x0,y1,z0,x0,z0),vert(x1,y1,z0,x1,z0),vert(x1,y1,z1,x1,z1),vert(x0,y1,z1,x0,z1)],tex,.95);
  if(eye>z1)polygon([vert(x0,y0,z1,x0,y0),vert(x1,y0,z1,x1,y0),vert(x1,y1,z1,x1,y1),vert(x0,y1,z1,x0,y1)],tex,1.08);
  if(eye<z0)polygon([vert(x0,y1,z0,x0,y1),vert(x1,y1,z0,x1,y1),vert(x1,y0,z0,x1,y0),vert(x0,y0,z0,x0,y0)],tex,.75);
 }
 for(const q of AP.core.boxes(false)){if(q.kind==='piece')continue;box(q,styleFor(q).tex);}
 for(const q of apDrawBoxes()){const style=C.surface(q.color,q.role==='barrier'?'wood':'paint');box(q,texture(style));}
 for(const a of apVisibleActors()){const k=apFrame(a);if(!k)continue;const im=apFrameImage(k),key='actor:'+k.pack.id+'|'+k.name+'|'+k.pose+'|'+k.view;let tex=textures.get(key);if(!tex){tex={w:im.width,h:im.height,pixels:new Uint32Array(im.getContext('2d').getImageData(0,0,im.width,im.height).data.buffer),repeat:false};textures.set(key,tex);}
  const left=-(k.mirrored?k.fr.w-k.fr.ax:k.fr.ax)/k.ppm,right=left+k.fr.w/k.ppm,top=(k.fr.ay??k.fr.h)/k.ppm,bottom=top-k.fr.h/k.ppm,lean=k.pose==='wilt'?.14:0;
  const pt=(x,z,u,vv)=>({x:a.x+b.rx*(x+lean*z),y:a.y+b.ry*(x+lean*z),z:a.z+z,u:k.mirrored?1-u:u,v:vv});polygon([pt(left,top,0,0),pt(right,top,1,0),pt(right,bottom,1,1),pt(left,bottom,0,1)],tex);
 }
 cv.getContext('2d').putImageData(out,0,0);return cv;
}
