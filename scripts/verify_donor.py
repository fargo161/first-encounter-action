#!/usr/bin/env python3
"""Rebuild the donor and run its focused checks in a disposable directory."""
from __future__ import annotations
import argparse
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from packetlib import packet_root, read_json, verify_records, sha256, write_json

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root')
    ap.add_argument('--include-claude',action='store_true',help='Also attempt the previously timed-out findings file')
    ap.add_argument('--timeout',type=int,default=30,help='Per-command timeout seconds (5..120)')
    args=ap.parse_args()
    if not 5<=args.timeout<=120: ap.error('--timeout must be between 5 and 120 seconds')
    try:
        root=packet_root(args.root)
        if not shutil.which('node'): raise ValueError('Node executable unavailable; install/provision it in the coding environment.')
        lock=read_json(root/'config/DONOR_FILE_LOCK.json')
        errors=verify_records(root,lock['files'])
        if errors: raise ValueError('\n'.join(errors[:10]))
        out=root/'evidence/execution/donor-verification'
        out.mkdir(parents=True,exist_ok=True)
        report={'scope':'Inherited v0.3.1 subset only, not the proposed new game',
                'time_utc':datetime.now(timezone.utc).isoformat(), 'commands':[], 'comparisons':[],
                'claude_findings':'requested' if args.include_claude else 'NOT_RUN: prior preparation timed out; retained in source'}
        with tempfile.TemporaryDirectory(prefix='fe-donor-') as temp:
            rc=Path(temp)/'rc';shutil.copytree(root/'vendor/room-action-v0.3.1/rc',rc)
            (Path(temp)/'evidence_v0_3').mkdir()
            commands=[('generate-scene',['node','tools/make_pressure_scene.cjs']),
                      ('build-host',[sys.executable,'source/build.py']),
                      ('build-playable',[sys.executable,'source/build_pressure_play.py'])]
            for name in ['physical','edge_cases','integration','degradation_occupancy_v031','pressure']:
                commands.append((name,['node',f'tests/action_proof/{name}.test.js']))
            if args.include_claude:
                commands.append(('claude-findings',['node','tests/action_proof/claude_v0_3_findings.test.js']))
            for name,cmd in commands:
                try:
                    res=subprocess.run(cmd,cwd=rc,capture_output=True,text=True,timeout=args.timeout)
                    row={'name':name,'command':cmd,'exit_code':res.returncode,'timed_out':False}
                    log=res.stdout+'\n--- STDERR ---\n'+res.stderr
                except subprocess.TimeoutExpired as exc:
                    row={'name':name,'command':cmd,'exit_code':None,'timed_out':True}
                    def text(x): return x.decode('utf-8','replace') if isinstance(x,bytes) else (x or '')
                    log=text(exc.stdout)+'\n--- TIMEOUT ---\n'+text(exc.stderr)
                (out/f'{name}.log').write_text(log,encoding='utf-8')
                report['commands'].append(row)
                print(f'{name}: {"TIMEOUT" if row["timed_out"] else row["exit_code"]}')
            for rel in ['Room_Creator.html','Play_Action_Playground_v0_3_1.html','examples/Action_Physical_Proof_v0_3.room.json']:
                orig=root/'vendor/room-action-v0.3.1/rc'/rel
                current=rc/rel
                same=current.is_file() and sha256(orig)==sha256(current)
                report['comparisons'].append({'path':rel,'byte_equal':same,'shipped_sha256':sha256(orig),
                      'rebuilt_sha256':sha256(current) if current.is_file() else None})
        report['protected_source_errors_after']=verify_records(root,lock['files'])
        ok=all(x['exit_code']==0 for x in report['commands']) and all(x['byte_equal'] for x in report['comparisons']) and not report['protected_source_errors_after']
        report['selected_checks_result']='PASS' if ok else 'FAIL_OR_UNVERIFIED'
        write_json(out/'result.json',report)
        print(f'{report["selected_checks_result"]}; report: {out/"result.json"}')
        print('Selected checks are not a full-suite, Windows, hardware-performance or human-feel certification.')
        return 0 if ok else 1
    except (OSError,ValueError,KeyError) as exc:
        print(f'Donor verification stopped: {exc}',file=sys.stderr);return 2
if __name__=='__main__':
    raise SystemExit(main())
