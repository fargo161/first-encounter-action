"""Deterministic 140-frame subset -> existing ROOM character atlas/pack format.
Run from any directory. Originals are read-only. GNC's supplied resized copy is explicitly
fingerprinted here; its coordinates are mapped, never silently applied at original scale.
Requires Pillow, numpy and scipy. No network or generation of new character art.
"""
from pathlib import Path
import argparse,base64,hashlib,json,math,sys
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from scipy import ndimage as ndi
ROOT=Path(__file__).resolve().parents[1]
VIEWS={'front':'F','q':'FQ-R','side':'S-R','bq':'BQ-R','back':'B'}
REVIEWED_GNC={'sha256':'e10fabd80e2d2d415e79ef86af18d2274908fbca610ba54e3bacdc28edb4e2c8','size':[1825,2048]}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def selected(f):
 c=f['sheet'];s=f['set']
 return (c=='PLB' and s in ['idle','ready','armsup','pain','death']+['run'+str(i) for i in range(1,7)]) or (c=='GNR') or (c=='GNC' and f.get('variant')=='gray' and ((s in ['idle','shoot1','shoot2']+['walk'+str(i) for i in range(1,5)] and f['key'] in VIEWS.values()) or s=='death_clean')) or f['id'] in ['TH1.f09','TH1.f10','TH1.f11','TH1.f13','TH1.f20','TH1.f21','FPW.kick.1','FPW.kick.2','FPW.kick.3']
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=ROOT/'inputs/action_proof');ap.add_argument('--out',type=Path,default=ROOT/'characters/action_proof');a=ap.parse_args()
 errors=[]; dbfile=a.input/'frames.json'
 if not dbfile.exists():raise SystemExit('INPUT ERROR: missing frames.json')
 db=json.loads(dbfile.read_text());fs=[f for f in db['frames'] if selected(f)]
 if len(fs)!=140 or len({f['id'] for f in fs})!=140:errors.append(f'Expected 140 distinct records, got {len(fs)}')
 sources={};imgs={};codes=['PLB','GNC','GNR','TH1','FPW']
 for code in codes:
  spec=db['sheets'][code];p=a.input/spec['orig']
  if not p.exists():errors.append('Missing original '+str(p));continue
  im=Image.open(p).convert('RGBA');h=digest(p);identity=h==spec['sha256'] and list(im.size)==spec['size'];reviewed=code=='GNC' and h==REVIEWED_GNC['sha256'] and list(im.size)==REVIEWED_GNC['size']
  if not identity and not reviewed:errors.append(f'{code}: unreviewed hash or dimensions ({im.size}, {h})');continue
  sx,sy=im.width/spec['size'][0],im.height/spec['size'][1];imgs[code]=im
  sources[code]={'file':spec['orig'],'sha256':h,'dimensions':list(im.size),'manifestSHA256':spec['sha256'],'manifestDimensions':spec['size'],'coordinateScale':[sx,sy],'status':'BYTE_IDENTICAL' if identity else 'REVIEWED_RESIZED_OWNER_UPLOAD','note':'' if identity else 'Original upload is a resized rendering of the same sheet. 42 gray records mapped by pixel ratios and visually checked. Original full-resolution bytes not supplied. No upsampling.'}
 if errors:raise SystemExit('INPUT ERRORS:\n'+'\n'.join(errors))
 a.out.mkdir(parents=True,exist_ok=True);(a.out/'inspection').mkdir(exist_ok=True)
 lab,_=ndi.label(np.asarray(imgs['TH1'])[:,:,3]>=16,structure=np.ones((3,3)));cuts={};records=[]
 for f in fs:
  c=f['sheet'];im=imgs[c];sx,sy=sources[c]['coordinateScale'];cell=f.get('cell') if c in ['PLB','GNR','GNC'] else None
  rect=cell or [f[k] for k in ['x','y','w','h']];x,y,w,h=rect
  if x<0 or y<0 or x+w>db['sheets'][c]['size'][0] or y+h>db['sheets'][c]['size'][1]:errors.append(f['id']+' invalid rectangle');continue
  # GNC uses full cells, interior grid border excluded by source cell definition.
  box=(round(x*sx),round(y*sy),round((x+w)*sx),round((y+h)*sy));ar=np.array(im.crop(box))
  if c=='TH1':
   ids=[]
   for px,py in f['seeds']:
    if not(0<=px<im.width and 0<=py<im.height) or lab[py,px]==0:errors.append(f['id']+' invalid foreground seed');continue
    ids.append(int(lab[py,px]))
   keep=np.isin(lab[box[1]:box[3],box[0]:box[2]],ids);ar[~keep]=0
  if c=='GNC':
   rgb=ar[:,:,:3].astype(float);cyan=(rgb[:,:,1]-rgb[:,:,0]>30)&(rgb[:,:,2]-rgb[:,:,0]>30)&(abs(rgb[:,:,1]-rgb[:,:,2])<40)
   # The supplied downscaled image contains cyan antialiasing. Key dominant cyan,
   # then keep the main body component (and connected held weapons), not grid specks.
   ar[cyan]=0;labels,num=ndi.label(ar[:,:,3]>0,structure=np.ones((3,3)));sizes=np.bincount(labels.ravel());sizes[0]=0
   if num:ar[(labels!=int(sizes.argmax()))]=0
  cut=Image.fromarray(ar);bb=cut.getbbox()
  if not bb:errors.append(f['id']+' empty cut');continue
  if c in ['PLB','GNR','GNC']:
   ax=(f['x']+f.get('ax',f['w']/2)-x)*sx; ay=(f['y']+f['h']-y)*sy
   ppm=db['sheets'][c]['px_per_metre']*sy
  else:ax=cut.width/2;ay=cut.height;ppm=None
  cuts[f['id']]=cut
  records.append({'id':f['id'],'sheet':c,'set':f['set'],'key':f['key'],'sourceRect':[f[k] for k in ['x','y','w','h']],'sourceCell':cell,'actualCut':list(box),'sourceSeeds':f.get('seeds',[]),'ax':ax,'ay':ay,'ppm':ppm,'contentBounds':list(bb),'sourceSHA256':sources[c]['sha256'],'method':'C' if c=='TH1' else 'B_REVIEWED_RESIZE' if c=='GNC' else 'A','mirroredAtRuntime':c=='GNR' and f['key'] in ['FQ-L','S-L','BQ-L']})
 if errors:raise SystemExit('EXTRACTION ERRORS:\n'+'\n'.join(errors))
 packs=[];assets=[];meta={};allr={r['id']:r for r in records}
 for code in codes:
  rr=[r for r in records if r['sheet']==code];W=1024;x=y=2;row=0
  for r in rr:
   im=cuts[r['id']]
   if x+im.width+2>W:x=2;y+=row+2;row=0
   r['atlasRect']=[x,y,im.width,im.height];x+=im.width+2;row=max(row,im.height)
  atlas=Image.new('RGBA',(W,y+row+2));frames={}
  for r in rr:
   x,y,w,h=r['atlasRect'];atlas.paste(cuts[r['id']],(x,y));frames[r['id']]={'x':x,'y':y,'w':w,'h':h,'ax':r['ax'],'ay':r['ay'],'ppm':r['ppm'],'source':r['id']}
  path=a.out/f'{code}_atlas.png';atlas.save(path,optimize=True);aid='action_atlas_'+code
  assets.append({'id':aid,'name':'Action proof '+code,'width':atlas.width,'height':atlas.height,'category':'character','view':'both','src':'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()})
  if code not in ['PLB','GNC','GNR']:meta[code]={'atlas':aid,'frames':frames};continue
  def dirset(s):
   out={}
   for view,key in VIEWS.items():
    k=key.replace('-R','-L') if code=='GNR' else key;fid=f'{code}.{s}.{k}'+('@gray' if code=='GNC' else '');out[view]=[fid+('|m' if code=='GNR' and '-L' in k else '')]
   return out
  idle=dirset('idle' if code!='GNR' else 'aim');motion={v:[] for v in VIEWS}
  for i in range(1,7 if code=='PLB' else 5):
   s=dirset(('walk' if code=='GNC' else 'run')+str(i))
   for v in VIEWS:motion[v]+=s[v]
  dying=[r['id'] for r in rr if r['set'] in ['death','death_clean']]
  hurt=[r['id'] for r in rr if r['set']=='pain'] or dying[:1]
  shared=lambda seq:{v:list(seq) for v in VIEWS}
  states={'stand':idle,'walk':motion,'run':motion,'aim':dirset('ready' if code=='PLB' else 'shoot1' if code=='GNC' else 'aim'),'flinch':shared(hurt),'airborne':dirset('armsup') if code=='PLB' else idle,'held':idle,'thrown':shared(hurt[:1]),'land':idle,'down':shared(dying),'punch':dirset('ready') if code=='PLB' else idle,'kick':dirset('ready') if code=='PLB' else idle,'grab':idle}
  if code=='GNC':states['fire']={v:dirset('shoot1')[v]+dirset('shoot2')[v] for v in VIEWS}
  elif code=='GNR':states['fire']=dirset('fire')
  else:states['fire']=states['aim']
  for state,vs in states.items():
   for ls in vs.values():
    for fid in ls:
     if fid.split('|')[0] not in frames:raise SystemExit(f'UNRESOLVED BINDING {state}: {fid}')
  pack={'id':code,'name':{'PLB':'Tan humanoid','GNC':'Gray pistol defender','GNR':'Rifle defender'}[code],'atlas':aid,'height':1.8,'pxPerMetre':db['sheets'][code]['px_per_metre']*sources[code]['coordinateScale'][1],'frames':frames,'states':states,'playback':{'walk':8,'run':12,'flinch':9,'down':9,'fire':12},'fallbacks':{'airborne':'armsup' if code=='PLB' else 'own idle','held':'own idle','thrown':'own pain/death-start','land':'own idle','externalPunchKickGrab':'own ready/idle; no new artwork'},'physicalBoundsSource':'Explicit shared actor profile, never this image'}
  packs.append(pack)
 data={'schema':'room-action-subset@0.1','count':len(records),'sources':sources,'records':records,'characters':packs,'firstperson':meta,'assets':assets,'standIns':['FPW boot kick does not match barefoot player','Held/thrown/landing external art uses identity-preserving fallback','GNC is the supplied smaller, antialiased copy, not manifest-original bytes']}
 (a.out/'ASSET_SUBSET_MANIFEST.json').write_text(json.dumps({k:v for k,v in data.items() if k!='assets'},indent=2));(a.out/'runtime_assets.json').write_text(json.dumps(data,separators=(',',':')))
 # Two complete, original-pixel contact sheets; no resampling of source art.
 font=ImageFont.load_default()
 for style,bg,fg in [('light',(230,233,232),(20,24,27)),('dark',(20,25,31),(230,235,238))]:
  cols=8;cw=160;ch=154;cv=Image.new('RGB',(cols*cw,math.ceil(len(records)/cols)*ch),bg);dr=ImageDraw.Draw(cv)
  for i,r in enumerate(records):
   xx=(i%cols)*cw;yy=(i//cols)*ch;im=cuts[r['id']];scale=min(1,(cw-8)/im.width,(ch-28)/im.height);show=im if scale==1 else im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
   cv.paste(show,(xx+int(cw/2-show.width/2),yy+int(ch-20-show.height)),show);dr.line((xx+4,yy+ch-20,xx+cw-4,yy+ch-20),fill=(100,115,120));dr.text((xx+3,yy+ch-15),r['id'],font=font,fill=fg)
  cv.save(a.out/'inspection'/f'subset_{style}.png')
 print(f'EXTRACTED {len(records)} records: '+str({c:sum(r['sheet']==c for r in records) for c in codes}));print('GNC: explicitly remapped reviewed resized upload; see input record.')
if __name__=='__main__':main()
