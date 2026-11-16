#!/usr/bin/env python3
"""Package the committed game source and verify its offline rebuild in a clean extraction."""

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PLAYABLE = Path("dist/Play_First_Encounter_Hands_v0_1.html")
ZIP_PATH = DIST / "First_Encounter_Hands_v0_1_Source.zip"
MANIFEST = "SOURCE_RELEASE_MANIFEST.json"


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def zip_file(archive, name, data):
    info = ZipInfo(name, (2026, 11, 16, 0, 0, 0))
    info.compress_type = ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data, compresslevel=6)


def create_release(destination):
    if git("status", "--porcelain"):
        raise ValueError("Commit the reviewed source before packaging.")
    revision = git("rev-parse", "HEAD").decode().strip()
    paths = git("ls-tree", "-r", "--name-only", "-z", revision).decode("utf-8").split("\0")
    names = sorted(set(paths) - {""} | {PLAYABLE.as_posix()})
    records = []
    with ZipFile(destination, "w") as archive:
        for name in names:
            data = (ROOT / name).read_bytes()
            zip_file(archive, name, data)
            records.append({"path": name, "bytes": len(data), "sha256": sha(data)})
        manifest = {"format": "first-encounter-hands-source@1", "revision": revision, "files": records}
        zip_file(archive, MANIFEST, (json.dumps(manifest, indent=2) + "\n").encode())
    return revision


def verify_release(archive_path):
    with ZipFile(archive_path) as archive:
        broken = archive.testzip()
        if broken:
            raise ValueError(f"Bad ZIP CRC for {broken}")
        manifest = json.loads(archive.read(MANIFEST))
        names = [entry["path"] for entry in manifest["files"]]
        if sorted(archive.namelist()) != sorted(names + [MANIFEST]):
            raise ValueError("Archive membership differs from the release manifest")
        parent = archive_path.parent.resolve()
        with TemporaryDirectory(prefix=".hands-rebuild-", dir=parent) as temporary:
            extracted = Path(temporary).resolve()
            if extracted.parent != parent:
                raise ValueError("Extraction directory escaped the delivery folder")
            for record in manifest["files"]:
                data = archive.read(record["path"])
                if sha(data) != record["sha256"] or len(data) != record["bytes"]:
                    raise ValueError(f"Wrong release bytes for {record['path']}")
                destination = (extracted / record["path"]).resolve()
                if not destination.is_relative_to(extracted):
                    raise ValueError(f"Invalid archive path {record['path']}")
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
            subprocess.run([sys.executable, "-B", "scripts/verify_packet.py", "--sources-only"],
                           cwd=extracted, check=True)
            rebuilt_scene = extracted / "rebuilt.room.json"
            subprocess.run(["node", "game/rc/tools/make_hands_scene.cjs", rebuilt_scene],
                           cwd=extracted, check=True)
            if rebuilt_scene.read_bytes() != (extracted / "game/rc/examples/First_Encounter_Hands.room.json").read_bytes():
                raise ValueError("Clean ROOM scene generation differs from the shipped scene.")
            rebuilt = extracted / "rebuilt.html"
            subprocess.run([sys.executable, "-B", "game/rc/source/build_hands_play.py", "--output", rebuilt],
                           cwd=extracted, check=True)
            if rebuilt.read_bytes() != (extracted / PLAYABLE).read_bytes():
                raise ValueError("Clean source rebuild differs from the shipped HTML.")
    return {"revision": manifest["revision"], "payload_files": len(names),
            "html_sha256": sha(archive_playable(archive_path)),
            "zip_sha256": sha(archive_path.read_bytes()), "clean_rebuild": "PASS"}


def archive_playable(path):
    with ZipFile(path) as archive:
        return archive.read(PLAYABLE.as_posix())


if __name__ == "__main__":
    DIST.mkdir(exist_ok=True)
    candidate = ZIP_PATH.with_suffix(".zip.tmp")
    try:
        subprocess.run([sys.executable, "-B", "game/rc/source/build_hands_play.py"], cwd=ROOT, check=True)
        create_release(candidate)
        receipt = verify_release(candidate)
        candidate.replace(ZIP_PATH)
        print(json.dumps(receipt, indent=2))
    finally:
        candidate.unlink(missing_ok=True)
