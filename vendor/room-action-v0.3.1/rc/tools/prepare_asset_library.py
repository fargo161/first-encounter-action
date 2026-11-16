#!/usr/bin/env python3
"""Prepare a read-only-source, local ROOM asset library. Python 3.10+, standard library.

Static, self-contained, uncompressed GLB 2 only. This is a bounded compatibility
check, not the Khronos validator. Source files are never rewritten. Relative paths
supply stable IDs; hashes record content changes. Default source units are meters.
"""
from __future__ import annotations
import argparse, base64, copy, hashlib, json, math, os, re, shutil, struct, sys, tempfile
from pathlib import Path

VERSION = '0.1.0'
MAX_BYTES = 200 * 1024 * 1024
class IntakeError(ValueError): pass

def safe_path(s: str) -> bool:
    return bool(s) and len(s) <= 1024 and not re.search(r'[\\\x00-\x1f?#]', s) and not re.match(r'(?:[a-z][a-z0-9+.-]*:|/)', s, re.I) and all(x not in ('', '.', '..') for x in s.split('/'))

def read_glb(data: bytes) -> tuple[dict, bytes]:
    if len(data) < 20 or len(data) > MAX_BYTES: raise IntakeError('GLB must be 20 bytes to 200 MiB.')
    if struct.unpack_from('<III', data) != (0x46546c67, 2, len(data)): raise IntakeError('Invalid GLB 2 header or byte length.')
    p = 12; doc = None; binary = None; n = 0
    while p < len(data):
        if p + 8 > len(data): raise IntakeError('Truncated chunk header.')
        size, kind = struct.unpack_from('<II', data, p); p += 8
        if size % 4 or p + size > len(data): raise IntakeError('Truncated or unaligned chunk.')
        chunk = data[p:p+size]; p += size
        if n == 0 and kind != 0x4e4f534a: raise IntakeError('JSON must be first.')
        n += 1
        if kind == 0x4e4f534a:
            if doc is not None: raise IntakeError('Duplicate JSON chunk.')
            try: doc = json.loads(chunk.decode('utf8').strip())
            except (ValueError, UnicodeError) as e: raise IntakeError('Invalid JSON chunk.') from e
        elif kind == 0x004e4942:
            if binary is not None: raise IntakeError('Duplicate binary chunk.')
            binary = chunk
        else: raise IntakeError('Unknown GLB chunk; review before conversion.')
    if not isinstance(doc, dict): raise IntakeError('Missing JSON document.')
    return doc, binary or b''

def write_glb(doc: dict, binary: bytes) -> bytes:
    j = json.dumps(doc, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()
    j += b' ' * (-len(j) % 4); binary += b'\0' * (-len(binary) % 4)
    parts = [struct.pack('<II', len(j), 0x4e4f534a), j]
    if binary: parts += [struct.pack('<II', len(binary), 0x004e4942), binary]
    body = b''.join(parts)
    return struct.pack('<III', 0x46546c67, 2, len(body)+12) + body

def check_contract(d: dict, binary: bytes) -> list[str]:
    warnings = []
    if d.get('asset', {}).get('version') != '2.0': raise IntakeError('asset.version must be 2.0.')
    if d.get('asset', {}).get('minVersion', '2.0') != '2.0': raise IntakeError('A newer glTF version is required.')
    for x in d.get('extensionsRequired', []):
        if x != 'KHR_mesh_quantization': raise IntakeError('Unsupported required extension: '+x)
    for x in d.get('extensionsUsed', []):
        if x != 'KHR_mesh_quantization': warnings.append('Optional extension may be approximated: '+x)
    if d.get('animations') or d.get('skins'): raise IntakeError('Export a deliberate static asset: animation and skinning are unsupported.')
    bufs = d.get('buffers', [])
    if len(bufs) != 1 or bufs[0].get('uri') or not isinstance(bufs[0].get('byteLength'), int) or not 0 <= bufs[0]['byteLength'] <= len(binary): raise IntakeError('One complete embedded binary buffer is required.')
    for v in d.get('bufferViews', []):
        if 'EXT_meshopt_compression' in v.get('extensions', {}): raise IntakeError('Meshopt decoder is not installed.')
        off = v.get('byteOffset', 0); length = v.get('byteLength', -1)
        if v.get('buffer', 0) != 0 or not isinstance(off, int) or not isinstance(length, int) or off < 0 or length < 0 or off+length > bufs[0]['byteLength']: raise IntakeError('Buffer view lies outside the embedded buffer.')
    for im in d.get('images', []):
        if im.get('uri') and not re.fullmatch(r'data:image/(?:png|jpeg);base64,[A-Za-z0-9+/=]+', im['uri']): raise IntakeError('Model images must be embedded PNG/JPEG.')
        if im.get('mimeType') and im['mimeType'] not in ('image/png', 'image/jpeg'): raise IntakeError('Unsupported model image format.')
    if not d.get('meshes'): raise IntakeError('No meshes.')
    for m in d['meshes']:
        for p in m.get('primitives', []):
            if p.get('mode', 4) != 4 or p.get('targets') or 'POSITION' not in p.get('attributes', {}): raise IntakeError('Only static triangle primitives with POSITION are supported.')
            if 'KHR_draco_mesh_compression' in p.get('extensions', {}): raise IntakeError('Draco decoder is not installed.')
    for m in d.get('materials', []):
        base = m.get('pbrMetallicRoughness', {}).get('baseColorTexture', {})
        if base.get('texCoord', 0) != 0 or 'KHR_texture_transform' in base.get('extensions', {}): raise IntakeError('Bake base-color UV transforms into TEXCOORD_0.')
        if any(m.get(k) for k in ('normalTexture','occlusionTexture','emissiveTexture')) or m.get('pbrMetallicRoughness', {}).get('metallicRoughnessTexture'):
            warnings.append('Stylized ROOM rendering does not use normal/metallic/roughness/emissive maps.')
    return sorted(set(warnings))

def mm(a, b): return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
IDENTITY = [[float(i == j) for j in range(4)] for i in range(4)]
def node_matrix(n):
    if 'matrix' in n:
        a = n['matrix']
        if len(a) != 16 or any(not isinstance(x, (int,float)) or not math.isfinite(x) for x in a): raise IntakeError('Invalid node matrix.')
        return [[a[j*4+i] for j in range(4)] for i in range(4)]
    t = n.get('translation',[0,0,0]); s = n.get('scale',[1,1,1]); r = n.get('rotation',[0,0,0,1])
    if len(t)!=3 or len(s)!=3 or len(r)!=4 or any(not isinstance(x,(int,float)) or not math.isfinite(x) for x in t+s+r): raise IntakeError('Invalid node transform.')
    x,y,z,w = r
    if abs(sum(v*v for v in r)-1) > 1e-4: raise IntakeError('Node quaternion is not normalized.')
    a = [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),t[0]], [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),t[1]], [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),t[2]], [0,0,0,1]]
    for i in range(3):
        for j in range(3): a[i][j] *= s[j]
    return a

def positions(d, binary, index):
    try:
        a = d['accessors'][index]
        if 'sparse' in a: raise IntakeError('Sparse POSITION accessors require a deliberate dense export.')
        if a.get('type') != 'VEC3': raise IntakeError('POSITION must be VEC3.')
        ct = a.get('componentType'); spec = {5120:('b',1,127),5121:('B',1,255),5122:('h',2,32767),5123:('H',2,65535),5126:('f',4,1)}.get(ct)
        if not spec: raise IntakeError('Unsupported POSITION component type.')
        fmt,size,div = spec; v = d['bufferViews'][a['bufferView']]; count = a.get('count',0)
        if not isinstance(count,int) or not 0 < count <= 2_000_000: raise IntakeError('POSITION count outside the bounded intake limit.')
        stride = v.get('byteStride',3*size); off = a.get('byteOffset',0); start = v.get('byteOffset',0)+off
        if not isinstance(stride,int) or not isinstance(off,int) or off < 0 or stride < 3*size or off+(count-1)*stride+3*size > v['byteLength']: raise IntakeError('Truncated POSITION accessor.')
        for i in range(count):
            vals = struct.unpack_from('<'+fmt*3,binary,start+i*stride)
            if a.get('normalized') and ct != 5126: vals = tuple(max(-1,x/div) for x in vals)
            if not all(math.isfinite(x) for x in vals): raise IntakeError('Non-finite vertex position.')
            yield vals
    except (KeyError, IndexError, struct.error, TypeError) as e: raise IntakeError('Invalid POSITION accessor.') from e

def measure(d, binary):
    try: roots = d['scenes'][d.get('scene',0)]['nodes']; nodes=d['nodes']
    except (IndexError,KeyError,TypeError) as e: raise IntakeError('No valid default scene roots.') from e
    lo=[math.inf]*3; hi=[-math.inf]*3; count=0; visiting=set(); seen=set()
    def walk(i, parent):
        nonlocal count
        if not isinstance(i,int) or i < 0 or i >= len(nodes) or i in visiting or i in seen: raise IntakeError('Invalid, repeated, or cyclic node hierarchy.')
        visiting.add(i);seen.add(i);n=nodes[i];world=mm(parent,node_matrix(n))
        if 'mesh' in n:
            try: mesh=d['meshes'][n['mesh']]
            except (IndexError,KeyError,TypeError) as e: raise IntakeError('Invalid mesh reference.') from e
            for p in mesh.get('primitives',[]):
                for xyz in positions(d,binary,p['attributes']['POSITION']):
                    out=[sum(world[j][k]*xyz[k] for k in range(3))+world[j][3] for j in range(3)]
                    for j,v in enumerate(out): lo[j]=min(lo[j],v);hi[j]=max(hi[j],v)
                    count+=1
                    if count>4_000_000: raise IntakeError('Scene vertex budget exceeded.')
        for child in n.get('children',[]): walk(child,world)
        visiting.remove(i)
    for i in roots: walk(i,IDENTITY)
    if not count: raise IntakeError('Default scene contains no drawable vertices.')
    return {'min':lo,'max':hi}, count

def normalize_glb(data: bytes, scale: float=1.0):
    if not math.isfinite(scale) or not 1e-6 <= scale <= 1e6: raise IntakeError('Scale must be finite and between 0.000001 and 1000000.')
    d,b = read_glb(data); warnings=check_contract(d,b); bounds,count=measure(d,b)
    if len(d.get('scenes',[]))>1: warnings.append('Only the default scene is normalized; other scenes are not loaded by ROOM.')
    center=[(bounds['min'][0]+bounds['max'][0])/2,bounds['min'][1],(bounds['min'][2]+bounds['max'][2])/2]
    scene=d['scenes'][d.get('scene',0)];root={'name':'ROOM intake · floor-centered meter root','children':scene['nodes'][:],'translation':[-x*scale for x in center],'scale':[scale]*3}
    scene['nodes']=[len(d['nodes'])];d['nodes'].append(root)
    after,count2=measure(d,b);dims=[after['max'][i]-after['min'][i] for i in range(3)]
    if not all(0 < x <= 10000 for x in dims): raise IntakeError('Use a non-degenerate volumetric prop; dimensions must be positive and at most 10000m.')
    materials=d.get('materials',[]);requires=[]
    if len(materials)>1 or any(len(m.get('primitives',[]))>1 for m in d['meshes']): requires.append('multi_material')
    if any(m.get('alphaMode','OPAQUE')!='OPAQUE' for m in materials): requires.append('alpha')
    return write_glb(d,b), {'bounds_before':bounds,'bounds_after':after,'dimensions_m':dims,'vertices_measured':count,'scale_to_meters':scale,'front':'not inferred; review +Z convention in ROOM','warnings':warnings,'requires':requires,'material_system':'uv_texture' if d.get('images') else 'untextured'}

def sha(b): return hashlib.sha256(b).hexdigest()
def prepare(source: Path, output: Path, scale=1.0, name='Prepared ROOM library', provenance='Unverified user-supplied source'):
    source=source.resolve();output=output.absolute()
    if not source.is_dir(): raise IntakeError('Input must be a folder.')
    if output.exists(): raise IntakeError('Output already exists; choose a new folder. Nothing was overwritten.')
    if source == output.resolve() or source in output.resolve().parents: raise IntakeError('Output must be outside the input folder.')
    output.parent.mkdir(parents=True,exist_ok=True)
    temp=Path(tempfile.mkdtemp(prefix='.room_intake_',dir=output.parent));entries=[];rows=[]
    try:
        for path in sorted(source.rglob('*')):
            if path.is_symlink(): rows.append({'file':path.relative_to(source).as_posix(),'status':'rejected','error':'Symbolic links are not read.'});continue
            if not path.is_file(): continue
            rel=path.relative_to(source).as_posix();ext=path.suffix.lower()
            if ext not in ('.glb','.png','.jpg','.jpeg','.webp'): continue
            try:
                if not safe_path(rel): raise IntakeError('Unsafe relative path.')
                if path.stat().st_size > MAX_BYTES: raise IntakeError('Input exceeds 200 MiB.')
                data=path.read_bytes();id='intake_'+sha(rel.encode())[:16];target='STANDARDIZED_LIBRARY/'+id+ext;dest=temp/target;dest.parent.mkdir(exist_ok=True)
                e={'asset_id':id,'display_name':path.stem.replace('_',' '),'working_path':target,'source_pack_id':'user_intake','source_path':rel,'source_sha256':sha(data),'license_status':'unverified','commercial_use_verified':False,'provenance_note':provenance,'recommended_for_room_creator':True,'tags':['prepared','review-front','user-source']}
                if ext=='.glb':
                    result,info=normalize_glb(data,scale);dest.write_bytes(result);e.update(asset_type='model',category_path=['Prototype Props','Prepared intake'],dimensions_m=info['dimensions_m'],requires=info['requires'],material_system=info['material_system'],normalization=info)
                else:
                    # Bytes are copied, never resampled. Browser image decoding is the next gate.
                    signatures={'.png':data.startswith(b'\x89PNG\r\n\x1a\n'),'.jpg':data.startswith(b'\xff\xd8\xff'),'.jpeg':data.startswith(b'\xff\xd8\xff'),'.webp':data[:4]==b'RIFF' and data[8:12]==b'WEBP'}
                    if not signatures[ext]: raise IntakeError('Image signature does not match its extension.')
                    dest.write_bytes(data);e.update(asset_type='surface_texture',category_path=['Surface Textures','Prepared intake']);info={'warnings':['Copied unchanged. Browser must decode and inspect dimensions.']}
                e['working_sha256']=sha(dest.read_bytes());entries.append(e);rows.append({'file':rel,'status':'prepared','asset_id':id,**info})
            except (IntakeError,ValueError,TypeError,IndexError,KeyError,OverflowError) as err: rows.append({'file':rel,'status':'rejected','error':str(err)})
        manifest={'schema_version':2,'library_name':name,'generator':'ROOM bounded intake '+VERSION,'units':'meters','assets':entries}
        report={'tool_version':VERSION,'prepared':len(entries),'rejected':sum(x['status']=='rejected' for x in rows),'source_untouched':True,'license_verified':False,'results':rows}
        for filename,obj in [('ASSET_MANIFEST.json',manifest),('INTAKE_REPORT.json',report),('SOURCE_PACK_MANIFEST.json',{'source_packs':[{'pack_id':'user_intake','provenance_note':provenance,'license':'unverified','license_status':'unverified'}]})]: (temp/filename).write_text(json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf8')
        (temp/'README.md').write_text('# Prepared ROOM library\n\nConnect this folder in Room Creator → Library. Inspect INTAKE_REPORT.json first.\nThe source was not modified. Models are floor-centered and scaled to meters; front direction is not inferred. Review collision, use points, and visual appearance before saving setups.\n\nThis is a bounded compatibility conversion, not glTF certification or license clearance. Rejected files were not copied. Images were not resampled. Models remain external to .room.json. Keep this folder with the project.\n',encoding='utf8')
        os.replace(temp,output);return report
    except BaseException:
        shutil.rmtree(temp,ignore_errors=True);raise

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('source',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--scale',type=float,default=1.0,help='Explicit conversion to meters; no unit guessing.');ap.add_argument('--name',default='Prepared ROOM library');ap.add_argument('--provenance',default='Unverified user-supplied source');args=ap.parse_args()
    try: r=prepare(args.source,args.output,args.scale,args.name,args.provenance)
    except (IntakeError,OSError) as e: print('Intake stopped: '+str(e),file=sys.stderr);return 2
    print(f"Prepared {r['prepared']} assets; rejected {r['rejected']}. See {args.output / 'INTAKE_REPORT.json'}")
    return 1 if r['rejected'] else 0
if __name__=='__main__': raise SystemExit(main())
