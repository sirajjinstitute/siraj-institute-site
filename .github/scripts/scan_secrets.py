#!/usr/bin/env python3
"""Secret-regression guard for the Siraj Institute landing-page repository.

This is a deliberately small, dependency-free scanner. It looks for
provider-specific credential formats that have a recognisable shape and
therefore a low false-positive rate. It is a regression net, not a
comprehensive secret-scanning product -- see .github/workflows/secret-scan.yml
for the documented limitations.

Design rules:
  * No third-party dependencies and no network access, so there is no pinned
    version to drift and no supply-chain surface.
  * Never print a matched value. Findings report rule name, file and line
    number only, so a candidate secret is not copied into public CI logs.
  * base64 data: URIs are elided before matching. index.html legitimately
    embeds the logo as a data URI, and raw base64 otherwise produces noise.

Exit codes: 0 = clean, 1 = findings, 2 = usage/internal error.
"""

from __future__ import annotations

import os
import re
import sys

# Files that are never worth scanning as text.
BINARY_SUFFIXES = (
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".icns",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".pdf", ".zip", ".gz", ".tgz", ".bz2", ".xz", ".7z",
    ".mp4", ".webm", ".mp3", ".wav", ".mov",
)

SKIP_DIRS = {".git", "node_modules", ".vercel", ".next", "dist", "build"}

# Elided before matching so embedded images do not generate noise.
DATA_URI = re.compile(r"data:[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+")

# (rule name, compiled pattern). Formats chosen for distinctive shape.
RULES: list[tuple[str, re.Pattern[str]]] = [
    ("aws-access-key-id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("aws-secret-access-key", re.compile(
        r"aws_secret_access_key\s*[:=]\s*[\"']?[A-Za-z0-9/+=]{40}[\"']?", re.I)),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36}\b")),
    ("github-fine-grained-pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{60,}\b")),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    ("stripe-live-secret-key", re.compile(r"\b[sr]k_live_[0-9A-Za-z]{16,}\b")),
    ("npm-token", re.compile(r"\bnpm_[A-Za-z0-9]{36}\b")),
    ("sendgrid-api-key", re.compile(r"\bSG\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\b")),
    ("openai-api-key", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_\-]{32,}\b")),
    ("anthropic-api-key", re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{24,}\b")),
    # Any JWT. Supabase service-role keys and similar privileged tokens are
    # JWTs, and a JWT has no business being committed to a static site.
    ("jwt-or-supabase-service-role", re.compile(
        r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("private-key-block", re.compile(
        r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----")),
    ("supabase-service-role-mention", re.compile(
        r"service[_-]?role[_-]?key\s*[:=]\s*[\"'][^\"']{20,}[\"']", re.I)),
    # Generic: a secret-ish name assigned a long opaque literal.
    ("generic-assigned-credential", re.compile(
        r"(?:api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|"
        r"client[_-]?secret|private[_-]?key|password|passwd)"
        r"\s*[:=]\s*[\"'][A-Za-z0-9+/_\-]{24,}[\"']", re.I)),
]


def iter_files(paths: list[str]):
    for base in paths:
        if os.path.isfile(base):
            yield base
            continue
        for root, dirs, names in os.walk(base):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for name in names:
                yield os.path.join(root, name)


def scan_file(path: str) -> list[tuple[str, str, int]]:
    if path.lower().endswith(BINARY_SUFFIXES):
        return []
    try:
        with open(path, "r", encoding="utf-8", errors="strict") as fh:
            text = fh.read()
    except (UnicodeDecodeError, OSError):
        return []  # binary or unreadable: nothing to scan as text

    findings = []
    for lineno, line in enumerate(text.split("\n"), start=1):
        cleaned = DATA_URI.sub("[data-uri]", line)
        for rule, pattern in RULES:
            if pattern.search(cleaned):
                findings.append((rule, path, lineno))
    return findings


def main(argv: list[str]) -> int:
    paths = argv[1:] or ["."]
    all_findings: list[tuple[str, str, int]] = []
    scanned = 0
    for path in iter_files(paths):
        result = scan_file(path)
        scanned += 1
        all_findings.extend(result)

    if all_findings:
        print(f"Secret scan FAILED: {len(all_findings)} candidate(s) found.")
        print("Values are intentionally not printed. Inspect the lines below locally.\n")
        for rule, path, lineno in all_findings:
            print(f"  {path}:{lineno}  rule={rule}")
        print(
            "\nIf a finding is a false positive, narrow the rule in "
            ".github/scripts/scan_secrets.py rather than deleting the check."
        )
        return 1

    print(f"Secret scan clean: {scanned} file(s) scanned, no candidates found.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except Exception as exc:  # pragma: no cover - defensive
        print(f"Secret scan errored: {exc}", file=sys.stderr)
        sys.exit(2)
