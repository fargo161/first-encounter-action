#!/usr/bin/env python3
"""Reproduce candidate hand regions into a scratch directory. Requires Pillow + scipy."""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
from packetlib import packet_root, read_json, sha256

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root');ap.add_argument('--output',required=True)
    args=ap.parse_args()
    try:
        import numpy as np
        from PIL import Image
        from scipy.ndimage import label
        root=packet_root(args.root);out=Path(args.output).resolve()
        if out.exists() and any(out.iterdir()): raise ValueError('Use an empty scratch directory; no originals or prepared cuts will be overwritten.')
        out.mkdir(parents=True,exist_ok=True)
        meta=read_json(root/'config/HAND_CUTS.json');sources={};bad=[]
        for entry in meta['cuts']:
            path=root/entry['source_path']
            if entry['source_path'] not in sources:
                if sha256(path)!=entry['source_sha256']: raise ValueError('Source hash mismatch: '+entry['source_path'])
                rgba=np.array(Image.open(path).convert('RGBA'))
                labs,_=label(rgba[:,:,3]>=16,structure=np.ones((3,3),dtype=int))
                sources[entry['source_path']]=(rgba,labs)
            rgba,labs=sources[entry['source_path']]
            selected={int(labs[sy,sx]) for sx,sy in entry['seeds']}-{0}
            if not selected: raise ValueError('No opaque component at seeds for '+entry['id'])
            x,y,w,h=entry['source_rect'];piece=rgba[y:y+h,x:x+w].copy()
            mask=np.isin(labs[y:y+h,x:x+w],list(selected))
            piece[~mask]=0
            dest=out/(entry['id']+'.png');Image.fromarray(piece).save(dest)
            if sha256(dest)!=entry['sha256']: bad.append(entry['id'])
        print(f'Reproduced {meta["count"]} regions; {len(bad)} byte mismatches. Some regions are fragments, not complete poses.')
        if bad: print('PNG encoder/version or algorithm difference: '+', '.join(bad),file=sys.stderr)
        return 1 if bad else 0
    except ImportError:
        print('Optional recut needs Pillow, numpy and scipy; prepared PNGs are already included.',file=sys.stderr);return 2
    except (OSError,ValueError,KeyError) as exc:
        print(str(exc),file=sys.stderr);return 2
if __name__=='__main__': raise SystemExit(main())
