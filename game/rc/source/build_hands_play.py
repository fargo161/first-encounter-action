#!/usr/bin/env python3
"""Build the standalone Hands First HTML using only the standard library."""

import argparse
import base64
import hashlib
import json
import re
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
ROOM = SOURCE.parent
ROOT = ROOM.parents[1]
OUTPUT = ROOT / "dist/Play_First_Encounter_Hands_v0_1.html"
SOURCES = (
    "core.js",
    "actor-physical.js",
    "hands-combat.js",
    "hands-input.js",
    "hands-render.js",
    "hands-app.js",
)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def embedded_assets(art):
    images = {}
    for name, record in art["assets"].items():
        path = (ROOT / record["path"]).resolve()
        if not path.is_relative_to(ROOT / "assets/derived/hand-cuts") or path.suffix != ".png":
            raise ValueError(f"{name}: expected a locked packet hand cut")
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != record["sha256"]:
            raise ValueError(f"{name}: hand cut hash mismatch")
        images[name] = "data:image/png;base64," + base64.b64encode(data).decode("ascii")
    return images


def build(output):
    art = read_json(ROOM / "hands-assets/hands-art.json")
    scene = read_json(ROOM / "examples/First_Encounter_Hands.room.json")
    data = json.dumps(
        {"art": art, "images": embedded_assets(art), "scene": scene},
        ensure_ascii=False,
        separators=(",", ":"),
    ).replace("<", r"\u003c").replace(">", r"\u003e").replace("&", r"\u0026")
    scripts = [f'<script id="hands-data" type="application/json">{data}</script>']
    for name in SOURCES:
        source = (SOURCE / name).read_text(encoding="utf-8")
        if re.search(r"<\s*/\s*script", source, re.IGNORECASE):
            raise ValueError(f"{name}: contains an HTML script closing tag")
        scripts.append(f"<script>\n{source}\n</script>")

    shell = (SOURCE / "hands-shell.html").read_text(encoding="utf-8")
    style = (SOURCE / "hands-style.css").read_text(encoding="utf-8")
    if shell.count("/* HANDS_STYLE */") != 1 or shell.count("<!-- HANDS_SCRIPTS -->") != 1:
        raise ValueError("Hands shell must declare both insertion points exactly once")
    html = shell.replace("/* HANDS_STYLE */", style).replace(
        "<!-- HANDS_SCRIPTS -->", "\n".join(scripts)
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = html.encode("utf-8")
    output.write_bytes(payload)
    print(f"{output}  {len(payload):,} bytes  SHA-256 {hashlib.sha256(payload).hexdigest()}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    options = parser.parse_args()
    build(options.output.resolve())


if __name__ == "__main__":
    main()
