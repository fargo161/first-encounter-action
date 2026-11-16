#!/usr/bin/env python3
"""Verify delivered bytes, or just protected source assets after development begins."""
from __future__ import annotations
import argparse
import sys
from packetlib import packet_root, read_json, verify_records

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', help='Packet root; defaults to this script parent')
    ap.add_argument('--sources-only', action='store_true', help='Verify only locked donor and source/derived art')
    args = ap.parse_args()
    try:
        root = packet_root(args.root)
        if args.sources_only:
            donor = read_json(root/'config/DONOR_FILE_LOCK.json')['files']
            art = read_json(root/'config/ASSET_INTAKE.json')['images']
            cuts = read_json(root/'config/HAND_CUTS.json')['cuts']
            records = donor + art + cuts
        else:
            manifest = root/'MANIFEST_SHA256.json'
            if not manifest.is_file():
                raise ValueError('Delivery manifest missing. Use the complete packet, not isolated documents.')
            records = read_json(manifest)['files']
        errors = verify_records(root, records)
        for error in errors:
            print(error, file=sys.stderr)
        print(f'{"FAIL" if errors else "PASS"}: {len(records)} listed file records; {len(errors)} errors.')
        print('This checks delivered/protected bytes, not game functionality or licensing.')
        return 1 if errors else 0
    except (OSError, ValueError, KeyError) as exc:
        print(f'Verification failed: {exc}', file=sys.stderr)
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
