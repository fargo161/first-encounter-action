#!/usr/bin/env python3
"""Initialize only the independent workspace. Publication is explicit and capability-gated."""
from __future__ import annotations
import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from packetlib import packet_root, read_json
TARGET='fargo161/first-encounter-action'
BRANCH='codex/hands-first-v0-1'
ALLOWED={f'https://github.com/{TARGET}.git',f'https://github.com/{TARGET}',f'git@github.com:{TARGET}.git'}

def run(args: list[str],cwd: Path,check: bool=True) -> subprocess.CompletedProcess:
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
    if check and p.returncode:
        raise RuntimeError(f'{args[0]} {args[1]} failed (exit {p.returncode}). {p.stderr.strip()[:800]}')
    return p

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root');ap.add_argument('--publish',action='store_true',help='Publish only an already reviewed clean commit; requires authenticated gh')
    args=ap.parse_args()
    try:
        root=packet_root(args.root)
        if not shutil.which('git'): raise ValueError('git is unavailable in this coding environment.')
        if read_json(root/'config/SOURCE_LOCK.json')['github_connection']['target']!=TARGET:
            raise ValueError('Target name differs from the owner-approved new repo.')
        p=run(['git','rev-parse','--show-toplevel'],root,False)
        if p.returncode==0 and Path(p.stdout.strip()).resolve()!=root:
            raise ValueError('Packet is inside another Git checkout. Move/copy to an independent workspace; originals stay untouched.')
        if p.returncode!=0:
            run(['git','init','-b',BRANCH],root)
            print(f'Initialized an independent local repository on {BRANCH}.')
        else:
            rem=run(['git','remote','get-url','--all','origin'],root,False)
            if rem.returncode==0 and any(x.strip() not in ALLOWED for x in rem.stdout.splitlines()):
                raise ValueError('Origin is not the authorized new game. No repository changes made.')
            head=run(['git','symbolic-ref','--short','HEAD'],root,False)
            if head.returncode or head.stdout.strip()!=BRANCH:
                raise ValueError(f'Existing checkout is not on {BRANCH}. Inspect it before creating/checking out the authorized branch.')
            print('Independent local review branch verified.')
        if not args.publish:
            print('No files staged, commits created, remote created or push attempted.')
            return 0
        if not shutil.which('gh'): raise ValueError('Publication unavailable: gh absent. Use an actually available native GitHub write tool or report the single access blocker.')
        if run(['gh','auth','status'],root,False).returncode:
            raise ValueError('Publication requires existing authenticated gh access. Do not paste a token into the prompt or source.')
        if run(['git','status','--porcelain'],root).stdout.strip():
            raise ValueError('Uncommitted files remain. Review and explicitly commit the bounded result before publication.')
        if run(['git','rev-parse','--verify','HEAD'],root,False).returncode:
            raise ValueError('No reviewed commit exists. Bootstrap deliberately does not commit on your behalf.')
        view=run(['gh','repo','view',TARGET,'--json','nameWithOwner'],root,False)
        if view.returncode:
            # Creation may still be refused because 404 can mean inaccessible. Do not force or rename.
            run(['gh','repo','create',TARGET,'--private'],root)
            print('New remote created by authenticated gh.')
        else:
            data=__import__('json').loads(view.stdout)
            if data.get('nameWithOwner','').lower()!=TARGET.lower(): raise ValueError('Remote identity mismatch.')
        rem=run(['git','remote','get-url','--all','origin'],root,False)
        if rem.returncode:
            run(['git','remote','add','origin',f'https://github.com/{TARGET}.git'],root)
        elif any(x.strip() not in ALLOWED for x in rem.stdout.splitlines()): raise ValueError('Origin mismatch; publication refused.')
        remote=run(['git','ls-remote','--heads','origin',BRANCH],root)
        if remote.stdout.strip():
            # Normal push below must fast-forward; never overwrite another history.
            print('Remote branch exists; ordinary fast-forward rules apply.')
        run(['git','push','--set-upstream','origin',f'HEAD:refs/heads/{BRANCH}'],root)
        local=run(['git','rev-parse','HEAD'],root).stdout.strip()
        actual=run(['git','ls-remote','--heads','origin',BRANCH],root).stdout.split()[0]
        if local!=actual: raise ValueError('Push returned but local/remote commit does not match.')
        print(f'Verified remote review ref {BRANCH} at {local}. No main merge or Cloud environment created.')
        return 0
    except (OSError,ValueError,RuntimeError,subprocess.TimeoutExpired,IndexError) as exc:
        print(f'Setup/publication stopped safely: {exc}',file=sys.stderr);return 2
if __name__=='__main__': raise SystemExit(main())
