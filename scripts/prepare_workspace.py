#!/usr/bin/env python3
"""Create an editable copy once. Never overwrite a working game or mutate the donor."""
from __future__ import annotations
import argparse
import shutil
import sys
from datetime import datetime, timezone
from packetlib import packet_root, read_json, verify_records, write_json

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root')
    args=ap.parse_args()
    try:
        root=packet_root(args.root)
        lock=read_json(root/'config/DONOR_FILE_LOCK.json')
        errors=verify_records(root,lock['files'])
        if errors:
            raise ValueError('\n'.join(errors[:10]))
        src=root/'vendor/room-action-v0.3.1/rc'
        target=root/'game/rc'
        marker=root/'game/WORKSPACE_BASELINE.json'
        if target.exists():
            if not marker.is_file():
                raise ValueError('game/rc exists without this packet\'s baseline receipt; refused to overwrite.')
            saved=read_json(marker)
            if saved.get('original_archive_sha256') != lock['original_archive_sha256']:
                raise ValueError('Existing workspace belongs to another baseline; no files changed.')
            print('Working copy already exists; preserved all edits.')
        else:
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copytree(src,target)
            write_json(marker,{'created_utc':datetime.now(timezone.utc).isoformat(),
                 'original_archive_sha256':lock['original_archive_sha256'],
                 'source':'vendor/room-action-v0.3.1/rc','destination':'game/rc',
                 'note':'Editable inherited copy only; not the new hands implementation.'})
            print('Created editable game/rc from locked v0.3.1 donor.')
        # The unedited pressure test writes to the parent of rc.
        (root/'game/evidence_v0_3').mkdir(parents=True,exist_ok=True)
        (root/'evidence/execution').mkdir(parents=True,exist_ok=True)
        print('Created required output directories. No assertions, source or controls were changed.')
        return 0
    except (OSError,ValueError,KeyError) as exc:
        print(f'Setup stopped safely: {exc}',file=sys.stderr);return 2
if __name__=='__main__':
    raise SystemExit(main())
