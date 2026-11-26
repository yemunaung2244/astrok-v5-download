"""Write in-app update metadata from the exact, signed APK being published."""

import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def main(aapt2, apk_path):
    apk = Path(apk_path)
    badging = subprocess.check_output([aapt2, "dump", "badging", str(apk)], text=True)
    package = re.search(
        r"^package: name='com\.astroK\.htunKP' versionCode='(\d+)' versionName='(\d+\.\d+\.\d+)'",
        badging,
        re.MULTILINE,
    )
    if not package:
        raise SystemExit("Expected an AstroK Pro APK with a three-part version name.")
    version_code, version_name = package.groups()
    if apk.name != f"AstroK-Pro-v{version_name}.apk":
        raise SystemExit("APK filename must match its version name.")

    digest = hashlib.sha256()
    size = 0
    with apk.open("rb") as source:
        while block := source.read(1024 * 1024):
            digest.update(block)
            size += len(block)

    manifest = Path(__file__).resolve().parent / "public" / "android-update.json"
    if manifest.exists():
        previous = json.loads(manifest.read_text())
        if int(version_code) < previous["versionCode"]:
            raise SystemExit("Update version code must increase.")
    manifest.write_text(json.dumps({
        "versionCode": int(version_code),
        "versionName": version_name,
        "size": size,
        "sha256": digest.hexdigest(),
    }, indent=2) + "\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prepare_android_update.py AAPT2 AstroK-Pro-vX.Y.Z.apk")
    main(*sys.argv[1:])
