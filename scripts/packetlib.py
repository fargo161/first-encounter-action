"""Small standard-library helpers for the preparation packet, not game runtime code."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from typing import Any

def packet_root(value: str | None = None) -> Path:
    root = Path(value).expanduser().resolve() if value else Path(__file__).resolve().parent.parent
    if not (root / 'config/DONOR_FILE_LOCK.json').is_file():
        raise ValueError(f'Not a First Encounter packet root: {root}')
    return root

def inside(root: Path, relative: str) -> Path:
    value = Path(relative)
    if value.is_absolute():
        raise ValueError(f'Expected relative path: {relative}')
    p = (root / value).resolve()
    if not p.is_relative_to(root.resolve()):
        raise ValueError(f'Path escapes packet: {relative}')
    return p

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))

def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def verify_records(root: Path, records: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    for item in records:
        p = inside(root, item['path'])
        if not p.is_file():
            errors.append('Missing: ' + item['path'])
        elif sha256(p) != item['sha256']:
            errors.append('Hash mismatch: ' + item['path'])
        elif 'bytes' in item and p.stat().st_size != item['bytes']:
            errors.append('Size mismatch: ' + item['path'])
    return errors
