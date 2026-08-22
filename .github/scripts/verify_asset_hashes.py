#!/usr/bin/env python3
"""Content-hash guard for the Siraj Institute landing-page repository.

Everything under assets/ is served with `Cache-Control: immutable` for a year
(see vercel.json), which is only safe while a file's URL changes whenever its
bytes change. That safety rests on a naming convention rather than a build
step -- this site deliberately has neither a bundler nor a package manager --
so this check enforces the convention instead.

It fails the build when:

  * an asset's filename does not carry the first 8 hex characters of the
    SHA-256 of its own contents (the case that would let a browser keep
    serving an old CSS or JS file for up to a year);
  * a /assets/ URL in index.html or in any CSS/JS asset points at a file that
    is not in the tree (a rename that was not carried through);
  * an asset is in the tree but nothing references it (a leftover from a
    rename, which would otherwise ship dead bytes).

To re-hash a changed asset: rename it to <stem>.<new-hash>.<ext> and update
every reference. Running this script prints the expected hash for anything
that is wrong.

Exit codes: 0 = clean, 1 = findings, 2 = usage/internal error.
"""

from __future__ import annotations

import hashlib
import pathlib
import re
import sys

HASH_RE = re.compile(r"^(?P<stem>.+)\.(?P<hash>[0-9a-f]{8})(?P<ext>\.[^.]+)$")
ASSET_REF = re.compile(r"/assets/[A-Za-z0-9][A-Za-z0-9./_-]*")

# Documentation shipped alongside the fonts; not served as a page asset.
EXEMPT_SUFFIXES = {".txt", ".md"}


def reference_sources(root: pathlib.Path) -> list[pathlib.Path]:
    """Files that may contain /assets/ URLs."""
    sources = [root / "index.html"]
    sources += sorted(p for p in (root / "assets").rglob("*") if p.suffix in {".css", ".js"})
    return [p for p in sources if p.is_file()]


def main(argv: list[str]) -> int:
    root = pathlib.Path(argv[1] if len(argv) > 1 else ".").resolve()
    assets = root / "assets"
    if not assets.is_dir():
        print(f"error: no assets directory under {root}", file=sys.stderr)
        return 2

    findings: list[str] = []

    tracked = [p for p in sorted(assets.rglob("*")) if p.is_file() and p.suffix not in EXEMPT_SUFFIXES]

    for path in tracked:
        rel = path.relative_to(root)
        match = HASH_RE.match(path.name)
        if not match:
            findings.append(f"{rel}: filename carries no content hash")
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()[:8]
        if match.group("hash") != actual:
            findings.append(
                f"{rel}: stale content hash "
                f"(named {match.group('hash')}, contents hash to {actual})"
            )

    on_disk = {"/" + str(p.relative_to(root)) for p in tracked}
    referenced: set[str] = set()
    for source in reference_sources(root):
        for ref in ASSET_REF.findall(source.read_text(encoding="utf-8")):
            referenced.add(ref)
            if ref not in on_disk:
                findings.append(f"{source.relative_to(root)}: reference to missing {ref}")

    for orphan in sorted(on_disk - referenced):
        findings.append(f"{orphan.lstrip('/')}: present in the tree but never referenced")

    if findings:
        print(f"Asset hash check failed with {len(findings)} finding(s):")
        for line in findings:
            print(f"  {line}")
        return 1

    print(f"Asset hash check clean: {len(tracked)} hashed assets, {len(referenced)} references resolved.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except Exception as exc:  # noqa: BLE001 - surface the reason, fail closed
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(2)
