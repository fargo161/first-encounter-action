"""Reproducibility and failure-gate tests for the exact 140-frame preparation."""
from pathlib import Path
import subprocess,tempfile,shutil,json,hashlib,sys
from PIL import Image
R=Path(__file__).resolve().parents[2];results=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(name,fn):
 try:detail=fn();results.append(dict(name=name,status='PASS',detail=detail));print('PASS',name)
 except Exception as e:results.append(dict(name=name,status='FAIL',error=str(e)));print('FAIL',name,str(e))
script=R/'tools/build_action_characters.py';source=R/'inputs/action_proof';out=R/'characters/action_proof';meta=json.loads((out/'ASSET_SUBSET_MANIFEST.json').read_text())
def counts():
 assert meta['count']==140 and len({x['id'] for x in meta['records']})==140
 c={s:sum(r['sheet']==s for r in meta['records']) for s in ['PLB','GNC','GNR','TH1','FPW']};assert c==dict(PLB=54,GNC=42,GNR=35,TH1=6,FPW=3);return c
check('Exactly 140 unique selected records',counts)
def crops():
 for r in meta['records']:
  im=Image.open(out/(r['sheet']+'_atlas.png'));x,y,w,h=r['atlasRect'];assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height;assert im.crop((x,y,x+w,y+h)).getbbox()
 return 'All nonempty and inside atlas; actual provenance recorded'
check('All exported cells contain pixels with valid atlas bounds',crops)
def bindings():
 for c in meta['characters']:
  assert len(c['states'])>=12
  for state,views in c['states'].items():
   for frames in views.values():
    assert isinstance(frames,list) and frames
    for f in frames:assert f.split('|')[0] in c['frames']
 return 'All action/facing bindings are concrete existing frame arrays'
check('Concrete runtime action bindings',bindings)
def provenance():
 for r in meta['records']:
  assert r['sourceSHA256']==meta['sources'][r['sheet']]['sha256']
  if r['sheet'] in ['PLB','GNC','GNR']:assert r['ppm']>0 and r['ax']>=0 and r['ay']>=0
 for c,s in meta['sources'].items():assert sha(source/s['file'])==s['sha256']
 assert meta['sources']['GNC']['status']=='REVIEWED_RESIZED_OWNER_UPLOAD';return 'Original hashes unchanged; GNC explicitly remapped, not falsely byte-identical'
check('Provenance, anchors, standing calibration and original preservation',provenance)
with tempfile.TemporaryDirectory(prefix='action_subset_') as td:
 td=Path(td);inp=td/'input';shutil.copytree(source,inp)
 def bad_case(name,edit,expected):
  def f():
   shutil.rmtree(inp);shutil.copytree(source,inp);edit(inp)
   q=subprocess.run([sys.executable,str(script),'--input',str(inp),'--out',str(td/'bad')],capture_output=True,text=True)
   assert q.returncode!=0;assert expected in q.stdout+q.stderr,(q.stdout+q.stderr);return (q.stdout+q.stderr).strip()[:450]
  check(name,f)
 bad_case('Missing original fails with specific input error',lambda d:(d/'w0DngzM.png').unlink(),'Missing original')
 bad_case('Mismatched hash/dimensions fail rather than accepting blanks',lambda d:Image.new('RGBA',(1,1)).save(d/'w0DngzM.png'),'unreviewed hash or dimensions')
 def change(d,fid,field,value):
  p=d/'frames.json';db=json.loads(p.read_text());f=next(f for f in db['frames'] if f['id']==fid);f[field]=value;p.write_text(json.dumps(db))
 bad_case('Invalid source rectangle is rejected',lambda d:change(d,'FPW.kick.1','x',-1),'invalid rectangle')
 bad_case('Background extraction seed is rejected',lambda d:change(d,'TH1.f09','seeds',[[0,0]]),'invalid foreground seed')
 def empty(d):
  for k,v in dict(x=0,y=0,w=1,h=1).items():change(d,'FPW.kick.1',k,v)
 bad_case('Transparent empty crop is rejected',empty,'empty cut')
 def rebuild():
  q=subprocess.run([sys.executable,str(script),'--input',str(source),'--out',str(td/'again')],capture_output=True,text=True);assert q.returncode==0,q.stderr
  files=[p for p in out.rglob('*') if p.is_file()]
  for p in files:assert sha(p)==sha(td/'again'/p.relative_to(out)),p.name
  return {'files':len(files),'comparison':'byte-identical'}
 check('Independent preparation run reproduces exact atlas and metadata bytes',rebuild)
r={'passed':sum(x['status']=='PASS' for x in results),'total':len(results),'results':results};print(json.dumps(r,indent=2))
if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(r,indent=2))
if r['passed']!=r['total']:sys.exit(1)
