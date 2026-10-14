#!/usr/bin/env python3
"""Copy the public site into dist/, and nothing else.

Vercel used to serve this whole repository (outputDirectory "."), so files
that are not part of the website -- CLAUDE.md, docs/, vercel.json, the CI
workflows and scripts, editor tooling -- were downloadable from the live
domain. This script publishes an explicit allowlist instead: anything not
named here is never deployed. A new public file must be added to PUBLIC.

Exit codes: 0 = built, 1 = a listed file is missing, 2 = usage error.
"""

from __future__ import annotations

import pathlib
import shutil
import sys

# Files served from the site root.
PUBLIC = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "logo.png",
]
# Directories copied whole (content-hashed assets and the self-hosted fonts).
PUBLIC_DIRS = ["assets"]


def main(argv: list[str]) -> int:
    root = pathlib.Path(argv[1] if len(argv) > 1 else ".").resolve()
    if not (root / "index.html").is_file():
        print(f"error: no index.html under {root}", file=sys.stderr)
        return 2
    out = root / "dist"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()

    missing = [name for name in PUBLIC + PUBLIC_DIRS if not (root / name).exists()]
    if missing:
        for name in missing:
            print(f"missing public file: {name}", file=sys.stderr)
        return 1

    for name in PUBLIC:
        shutil.copy2(root / name, out / name)
    for name in PUBLIC_DIRS:
        shutil.copytree(root / name, out / name)

    count = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"Built dist/: {count} public files.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
