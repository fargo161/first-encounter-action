"""Original geometric calibration props for this checkpoint, not third-party production art.
Rebuilds a disposable generated library; never touches a user's library.
"""
from pathlib import Path
import struct,json,sys,shutil,zlib,base64
from prepare_asset_library import write_glb,prepare
ROOT=Path(__file__).resolve().parents[1]

def png_rgba():
    def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    rows=b''.join(b'\0'+bytes(v for x in range(8) for v in ((255,255,255,255) if (x+y)%2==0 else (255,255,255,0))) for y in range(8))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',8,8,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')

def model(boxes,materials,name):
    d={'asset':{'version':'2.0','generator':'Original ROOM calibration fixture'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':name,'children':[]}],'meshes':[],'materials':materials,'accessors':[],'bufferViews':[]};buf=bytearray()
    def accessor(vals,width,kind,ctype=5126):
        while len(buf)%4:buf.append(0)
        offset=len(buf);flat=[v for a in vals for v in a] if width>1 else vals;fmt='f' if ctype==5126 else 'H';buf.extend(struct.pack('<'+fmt*len(flat),*flat));vi=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(buf)-offset});ai=len(d['accessors']);entry={'bufferView':vi,'componentType':ctype,'count':len(vals),'type':kind}
        if width==3:entry.update(min=[min(v[i] for v in vals) for i in range(3)],max=[max(v[i] for v in vals) for i in range(3)])
        d['accessors'].append(entry);return ai
    for label,center,size,mat in boxes:
        x,y,z=[v/2 for v in size];faces=[([(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],(0,0,1)), ([(x,-y,-z),(-x,-y,-z),(-x,y,-z),(x,y,-z)],(0,0,-1)), ([(x,-y,z),(x,-y,-z),(x,y,-z),(x,y,z)],(1,0,0)), ([(-x,-y,-z),(-x,-y,z),(-x,y,z),(-x,y,-z)],(-1,0,0)), ([(-x,y,z),(x,y,z),(x,y,-z),(-x,y,-z)],(0,1,0)), ([(-x,-y,-z),(x,-y,-z),(x,-y,z),(-x,-y,z)],(0,-1,0))];ps=[];ns=[];uv=[];ix=[]
        for face,normal in faces:
            start=len(ps);ps+=face;ns += [normal]*4;uv += [(0,0),(1,0),(1,1),(0,1)];ix += [start,start+1,start+2,start,start+2,start+3]
        prim={'attributes':{'POSITION':accessor(ps,3,'VEC3'),'NORMAL':accessor(ns,3,'VEC3'),'TEXCOORD_0':accessor(uv,2,'VEC2')},'indices':accessor(ix,1,'SCALAR',5123),'material':mat}
        mi=len(d['meshes']);d['meshes'].append({'name':label,'primitives':[prim]});ni=len(d['nodes']);d['nodes'].append({'name':label,'mesh':mi,'translation':center});d['nodes'][0]['children'].append(ni)
    if any(m.get('pbrMetallicRoughness',{}).get('baseColorTexture') for m in materials):
        d.update(images=[{'uri':'data:image/png;base64,'+base64.b64encode(png_rgba()).decode()}],textures=[{'source':0}])
    d['buffers']=[{'byteLength':len(buf)}];return write_glb(d,bytes(buf))

def mat(name,color,**kw):return {'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0,'roughnessFactor':.85},**kw}
def build():
    source=ROOT/'assets/Calibration_Source';dest=ROOT/'assets/Room_Calibration_Library';source.mkdir(parents=True,exist_ok=True)
    materials=[mat('Warm timber',[.55,.32,.17,1]),mat('Dark metal',[.12,.16,.18,1]),mat('Transit teal',[.12,.55,.55,1]),mat('Warm enamel',[.85,.8,.65,1])]
    boxes=[('Seat plank',[0,.47,0],[2,.1,.65],0),('Back',[0,.78,-.28],[2,.35,.08],0),('Foot L',[-.75,.21,0],[.12,.42,.5],1),('Foot R',[.75,.21,0],[.12,.42,.5],1)]
    (source/'calibration_bench.glb').write_bytes(model(boxes,materials,'Bench · +Z front'))
    (source/'calibration_meter.glb').write_bytes(model([('Meter body',[2,3.5,4],[1,1,1],2),('Front marker',[2,3.5,4.501],[.32,.32,.002],3)],materials,'Meter cube with +Z marker'))
    cut=mat('Cutout calibration',[.75,.32,.16,1],alphaMode='MASK',alphaCutoff=.5,doubleSided=True);cut['pbrMetallicRoughness']['baseColorTexture']={'index':0}
    boxes=[('Foot',[0,.04,0],[.5,.08,.5],1),('Post',[0,1.05,0],[.08,2.1,.08],1),('Sign',[0,2.1,0],[.7,.6,.06],2),('Stripe',[0,2.1,.035],[.5,.13,.01],3),('Cutout sample',[0,1.5,0],[.35,.3,.015],4)]
    (source/'calibration_stop_marker.glb').write_bytes(model(boxes,materials+[cut],'Stop marker · decorative only'))
    if dest.exists():shutil.rmtree(dest)
    r=prepare(source,dest,name='ROOM original calibration props',provenance='Original procedural calibration geometry supplied with this checkpoint; source generator included.')
    if r['rejected']:raise RuntimeError(r)
    mf=dest/'ASSET_MANIFEST.json';m=json.loads(mf.read_text())
    for e in m['assets']:e.update(license_status='known',commercial_use_verified=True,license='Original generated example geometry; reuse permitted',category_path=['Prototype Reference','Calibration'])
    mf.write_text(json.dumps(m,indent=2)+'\n');(dest/'SOURCE_PACK_MANIFEST.json').write_text(json.dumps({'source_packs':[{'pack_id':'user_intake','license':'Original procedural calibration fixtures; reuse and modification permitted','license_status':'known','generator':'tools/build_calibration_assets.py'}]},indent=2)+'\n');(dest/'README.md').write_text('# ROOM calibration library\n\nThree original low-poly calibration fixtures, generated by tools/build_calibration_assets.py. Reuse and modification are permitted. These are not final Trapstar art. Connect this folder in Library to resolve the Finish Asset Studio example.\n\nThe bench has distinct timber and metal source materials. The meter block demonstrates floor centering and measured dimensions. The stop marker includes an embedded alpha-mask sample. None of these objects grants a transit service, access permission, or activity. Their physical bindings are authored separately in the example.\n')
    print(json.dumps({'prepared':r['prepared'],'rejected':r['rejected'],'ids':{e['source_path']:e['asset_id'] for e in m['assets']}},indent=2))
if __name__=='__main__':build()
