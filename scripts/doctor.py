#!/usr/bin/env python3
"""Report local capabilities without reading credentials or claiming remote access."""
from __future__ import annotations
import argparse
import importlib.util
import platform
import shutil
import subprocess
import sys
from packetlib import packet_root, write_json

def version(command: list[str]) -> dict:
    if not shutil.which(command[0]): return {'available':False,'version':None}
    try:
        p=subprocess.run(command,capture_output=True,text=True,timeout=10)
        return {'available':p.returncode==0,'version':(p.stdout or p.stderr).strip().splitlines()[0]}
    except (OSError,subprocess.TimeoutExpired,IndexError):
        return {'available':False,'version':None}

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root');args=ap.parse_args()
    try:
        root=packet_root(args.root)
        tools={name:version(cmd) for name,cmd in {
            'node':['node','--version'],'git':['git','--version'],'gh':['gh','--version'],
            'chromium':['chromium','--version'],'ffmpeg':['ffmpeg','-version']}.items()}
        result={'os':platform.platform(),'python':platform.python_version(),'tools':tools,
            'optional_python_modules':{m:importlib.util.find_spec(m) is not None for m in ['PIL','scipy','playwright']},
            'github_authenticated': 'NOT_CHECKED', 'cloud_environment': 'NOT_INFERRED',
            'native_subagents':'CHECK_ACTUAL_CODING_TOOLS','image_generation':'CHECK_ACTUAL_CODING_TOOLS',
            'note':'No environment secrets inspected. Installed binaries do not establish service access.'}
        write_json(root/'evidence/execution/doctor.json',result)
        print(__import__('json').dumps(result,indent=2))
        return 0 if tools['node']['available'] else 1
    except (OSError,ValueError) as exc:
        print(str(exc),file=sys.stderr);return 2
if __name__=='__main__': raise SystemExit(main())
