"""Pressure-combat presentation expansion; preserves original inputs and the 140-frame baseline.
Uses source-backed connected components, no invented source rectangles, no network.
"""
from pathlib import Path
import json,hashlib,base64,math
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'characters/action_proof';OUT=ROOT/'characters/action_pressure';INP=ROOT/'inputs/action_proof'
TAN=[5,6,7,8,9,10,11,12,13,14,15,18,19,20,21,22,23,26,29,33,34,35,36]
IDS=[f'TH1.f{i:02d}' for i in TAN]+[f'FPW.{s}.{i}' for s in ['kick','fist_side','fist_front'] for i in range(1,4)]+['FPW.openhand']
def main():
 data=json.loads((BASE/'runtime_assets.json').read_text());db=json.loads((INP/'frames.json').read_text());idx={f['id']:f for f in db['frames']};OUT.mkdir(parents=True,exist_ok=True)
 originals={};labels={}
 for c in ['TH1','FPW']:
  spec=db['sheets'][c];p=INP/spec['orig'];h=hashlib.sha256(p.read_bytes()).hexdigest();im=Image.open(p).convert('RGBA')
  if h!=spec['sha256'] or list(im.size)!=spec['size']:raise ValueError('Original input mismatch: '+c)
  originals[c]=im;labels[c]=ndimage.label(np.asarray(im)[:,:,3]>=16,np.ones((3,3)))[0]
 records=[r for r in data['records'] if r['sheet'] not in ['TH1','FPW']];cuts={}
 for fid in IDS:
  f=idx[fid];c=f['sheet'];im=originals[c];x,y,w,h=[f[k] for k in ['x','y','w','h']];box=(x,y,x+w,y+h)
  if x<0 or y<0 or x+w>im.width or y+h>im.height:raise ValueError('Rectangle '+fid)
  ar=np.array(im.crop(box));lab=labels[c]
  if c=='TH1':
   seeds=[int(lab[py,px]) for px,py in f['seeds']]
   if not seeds or 0 in seeds:raise ValueError('Foreground seed '+fid)
   ar[~np.isin(lab[y:y+h,x:x+w],seeds)]=0
  # Palette normalization is limited to the new bare FPW hand frames. The boot is unchanged.
  tint=[1,1,1]
  if c=='FPW' and f['set']!='kick':
   tint=[.86,.72,.65];ar[:,:,:3]=np.round(ar[:,:,:3]*np.array(tint)).astype('uint8')
  cut=Image.fromarray(ar)
  if not cut.getbbox():raise ValueError('Empty '+fid)
  cuts[fid]=cut;records.append(dict(id=fid,sheet=c,set=f['set'],key=f['key'],sourceRect=[x,y,w,h],sourceCell=None,actualCut=list(box),sourceSeeds=f.get('seeds',[]),ax=w/2,ay=h,ppm=None,contentBounds=list(cut.getbbox()),sourceSHA256=data['sources'][c]['sha256'],method='C' if c=='TH1' else 'A',paletteMultiplier=tint))
 assets=[a for a in data['assets'] if a['id'] not in ['action_atlas_TH1','action_atlas_FPW']]
 for c in ['TH1','FPW']:
  rr=[r for r in records if r['sheet']==c];W=1024;x=y=2;row=0
  for r in rr:
   im=cuts[r['id']]
   if x+im.width+2>W:x=2;y+=row+2;row=0
   r['atlasRect']=[x,y,im.width,im.height];x+=im.width+2;row=max(row,im.height)
  atlas=Image.new('RGBA',(W,y+row+2));frames={}
  for r in rr:
   x,y,w,h=r['atlasRect'];atlas.paste(cuts[r['id']],(x,y));frames[r['id']]={'x':x,'y':y,'w':w,'h':h,'ax':w/2,'ay':h,'source':r['id']}
  path=OUT/(c+'_atlas.png');atlas.save(path,optimize=True);aid='action_atlas_'+c
  assets.append({'id':aid,'name':'Pressure combat '+c,'width':atlas.width,'height':atlas.height,'category':'character','view':'both','src':'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()})
  data['firstperson'][c]={'atlas':aid,'frames':frames}
 # Explicit identity-preserving fallbacks. The compositor adds hand-guard overlays, not new physics.
 for pack in data['characters']:
  pack['states']['block']=pack['states']['aim'];pack['states']['wilt']=pack['states']['flinch'];pack['states']['strong']=pack['states']['punch'];pack['states']['flyingkick']=pack['states']['airborne']
  pack['fallbacks'].update(block='Own ready/aim body plus source tan-hand defensive overlay',wilt='Own hurt/death-start pose, gentle visual stoop; physical body unchanged',strong='Own ready pose',flyingkick='Own airborne pose')
 data.update(schema='room-pressure-art@0.3',count=len(records),records=records,assets=assets)
 data['presentationNotes']=['No new generated character artwork','FPW fist/open-hand RGB multiplied by 0.86/0.72/0.65; original retained','Flying kick rotates existing boot at presentation only','Body collider never derived from the new guard/hand composition']
 (OUT/'runtime_assets.json').write_text(json.dumps(data,separators=(',',':')))
 (OUT/'ASSET_SUBSET_MANIFEST.json').write_text(json.dumps({k:v for k,v in data.items() if k!='assets'},indent=2))
 cv=Image.new('RGB',(1000,math.ceil(len(IDS)/6)*175),(53,61,67));d=ImageDraw.Draw(cv)
 for i,fid in enumerate(IDS):
  im=cuts[fid];sc=min(1,150/im.width,140/im.height);im=im.resize((round(im.width*sc),round(im.height*sc)),Image.Resampling.NEAREST);x=(i%6)*166+8;y=(i//6)*175
  cv.paste(im,(x,y+145-im.height),im);d.text((x,y+150),fid,fill='white')
 cv.save(OUT/'HAND_CONTACT_SHEET.png')
 print(json.dumps({'totalRecords':len(records),'tanHands':len(TAN),'fistKickOpenHand':len(IDS)-len(TAN),'originalBodyRecords':len(records)-len(IDS)}))
if __name__=='__main__':main()
