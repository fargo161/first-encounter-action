"""Combat Room v0.1 — add the new high-resolution poses to the three existing character packs.

Reads  : examples/Street_Characters_Scene.room.json (the three 0.15 packs + their 1024x1024 atlases)
         characters/combat/source_cutouts/*.png (the chosen cut-outs, already shrunk — see --import)
Writes : characters/combat/<id>_atlas.png  (old atlas on top, new frames packed below)
         characters/combat/combat_characters.json (the three packs with the new frames and combat states)

New states (front view only unless noted; the engine falls back to the front picture for other angles):
  guard     : standing, alert, facing you            (idle cut-out)
  aim       : arm out, "pointing" = aiming at you    (pointing cut-out)   frame carries hand:[x,y] for the muzzle flash
  surrender : hands up                               (defensive cut-out; Contact/buyer only)
  flee      : back view, running away                (back_facing cut-out) + the old run pictures for the other angles
Every new frame carries its own ppm (pixels per metre) because it is drawn at a higher resolution than the pack.

Usage:
  python3 tools/build_combat_characters.py --import /path/to/unzipped/cutouts   # choose + shrink the cut-outs once
  python3 tools/build_combat_characters.py                                      # rebuild atlases + json from source_cutouts
Pillow only.
"""
import json, os, sys, base64, io, argparse
from PIL import Image
PKG=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE=os.path.join(PKG,'examples','Street_Characters_Scene.room.json')
OUT=os.path.join(PKG,'characters','combat'); SRC=os.path.join(OUT,'source_cutouts')
PPM=300            # new pictures: 300 px per metre (old packs: 110). 1.8 m person = 540 px tall.
MARGIN=2
# which cut-out file is which character: (2)/(5) = Broker = supplier pack, (3)/(6) = Contact = buyer pack, (4)/none = Tracksuit
PICK={'buyer':{'guard':'idle_generated (3).png','aim':'pointing_generated (3).png','flee':'back_facing_generated (3).png','surrender':'contact_defensive_generated.png'},
      'supplier':{'guard':'idle_generated (2).png','aim':'pointing_generated (2).png','flee':'back_facing_generated (2).png'},
      'tracksuit':{'guard':'idle_generated (4).png','aim':'pointing_generated (4).png','flee':'back_facing_generated.png'}}

# fingertip of the pointing hand in the shrunk frame (px); checked by eye on the 300 px/m frames. The automatic finder
# picks the elbow on these pictures because the arm points toward the viewer, not sideways.
HAND={'buyer':[40,100],'supplier':[55,100],'tracksuit':[130,92]}

def shrink(path,height_m):
    im=Image.open(path).convert('RGBA'); bb=im.getbbox(); im=im.crop(bb)
    target=int(round(height_m*PPM)); r=target/im.size[1]
    im=im.resize((max(1,int(round(im.size[0]*r))),target),Image.LANCZOS)
    # kill faint fringe pixels so the alpha hit-test and the 0.5 alpha cut-off agree
    a=im.getchannel('A').point(lambda v:0 if v<40 else v); im.putalpha(a)
    return im

def feet_anchor(im):
    w,h=im.size; a=im.getchannel('A'); band=a.crop((0,int(h*.92),w,h)); xs=[]
    px=band.load()
    for y in range(band.size[1]):
        for x in range(w):
            if px[x,y]>128: xs.append(x)
    return round(sum(xs)/len(xs),1) if xs else w/2

def hand_point(im):
    """The extended arm points to the picture's right: the muzzle is the right-most solid pixel between 25% and 60% height."""
    w,h=im.size; a=im.getchannel('A'); px=a.load(); best=None
    for y in range(int(h*.25),int(h*.6)):
        for x in range(w-1,0,-1):
            if px[x,y]>128:
                if best is None or x>best[0]: best=(x,y)
                break
    return [best[0],best[1]] if best else [w-1,int(h*.4)]

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--import',dest='imp',default=None); a=ap.parse_args()
    os.makedirs(SRC,exist_ok=True)
    bundle=json.load(open(SCENE,encoding='utf-8'))
    packs={c['id']:c for c in bundle['project']['routeNet']['characters']}
    assets={x['id']:x for x in bundle['assets']}
    if a.imp:
        for cid,poses in PICK.items():
            for pose,fn in poses.items():
                im=shrink(os.path.join(a.imp,fn),packs[cid]['height']); im.save(os.path.join(SRC,f'{cid}_{pose}.png'),optimize=True)
                print('imported',cid,pose,im.size)
    out={}
    for cid,pack in packs.items():
        old=assets[pack['atlas']]; atlas=Image.open(io.BytesIO(base64.b64decode(old['src'].split(',',1)[1]))).convert('RGBA')
        W=atlas.size[0]; frames=dict(pack['frames']); states=json.loads(json.dumps(pack['states']))
        # pack the new pictures in rows under the old atlas
        new=[]
        for pose in PICK[cid]:
            p=os.path.join(SRC,f'{cid}_{pose}.png')
            if not os.path.exists(p): raise SystemExit('missing '+p+' (run with --import first)')
            new.append((pose,Image.open(p).convert('RGBA')))
        x=0;y=atlas.size[1];rowh=0;placed=[]
        for pose,im in new:
            w,h=im.size
            if x+w+MARGIN>W: x=0;y+=rowh+MARGIN;rowh=0
            placed.append((pose,im,x,y)); x+=w+MARGIN; rowh=max(rowh,h)
        H=y+rowh+MARGIN
        big=Image.new('RGBA',(W,H),(0,0,0,0)); big.paste(atlas,(0,0))
        names={'guard':'guard.front','aim':'aim.front','flee':'flee.back','surrender':'surrender.front'}
        for pose,im,px,py in placed:
            big.paste(im,(px,py),im); w,h=im.size
            fr={'x':px,'y':py,'w':w,'h':h,'ax':feet_anchor(im),'ppm':PPM,'hires':True}
            if pose=='aim': fr['hand']=HAND.get(cid) or hand_point(im)
            frames[names[pose]]=fr
        states['guard']={'front':['guard.front']}
        states['aim']={'front':['aim.front']}
        if 'surrender' in PICK[cid]: states['surrender']={'front':['surrender.front']}
        run=states.get('run',{})
        states['flee']={'back':['flee.back'],**{k:v for k,v in run.items() if k!='back'}}
        big.save(os.path.join(OUT,f'{cid}_atlas.png'),optimize=True)
        newpack=dict(pack); newpack['frames']=frames; newpack['states']=states
        newpack['combatArt']={'ppm':PPM,'poses':list(PICK[cid].keys()),'note':'guard/aim/flee/surrender are front-view high-resolution cut-outs (Combat Room v0.1); other states are the 0.15 pack pictures.'}
        out[cid]={'pack':newpack,'atlas':f'{cid}_atlas.png','width':W,'height':H}
        print(cid,'atlas',W,'x',H,'new frames',[(n,frames[n]['w'],frames[n]['h'],frames[n].get('hand')) for n in names.values() if n in frames])
    json.dump(out,open(os.path.join(OUT,'combat_characters.json'),'w',encoding='utf-8'),indent=1)
    print('wrote',os.path.join(OUT,'combat_characters.json'))
if __name__=='__main__': main()
