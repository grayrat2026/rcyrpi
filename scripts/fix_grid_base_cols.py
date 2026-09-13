#!/usr/bin/env python3
"""Add explicit base `grid-cols-1` to grid containers that only define
responsive `XX:grid-cols-N` — clamps mobile implicit auto-tracks to
minmax(0,1fr). Breakpoint rules override at >=sm/md/lg, so desktop and
tablet rendering is pixel-identical. Idempotent."""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1] / "src"
CLASS_RE = re.compile(r'(className=")([^"]*)(")')
TOKEN = re.compile(r'^(sm|md|lg|xl|2xl):grid-cols-\d+$')
BASE = re.compile(r'^grid-cols-\d+$')

changed = []
for f in ROOT.rglob("*.tsx"):
    txt = f.read_text()
    out = []
    modified = False
    for line in txt.splitlines(keepends=True):
        def fix(m):
            global modified
            c = m.group(2)
            toks = c.split()
            try:
                gi = toks.index("grid")
            except ValueError:
                return m.group(0)
            resp = [t for t in toks if TOKEN.match(t)]
            base = [t for t in toks if BASE.match(t)]
            if resp and not base:
                toks.insert(gi + 1, "grid-cols-1")
                modified = True
                changed.append(f"{f}: {c[:80]} -> {' '.join(toks)[:80]}")
            return m.group(1) + " ".join(toks) + m.group(3)
        line = CLASS_RE.sub(fix, line)
        out.append(line)
    if modified:
        f.write_text("".join(out))

print("\n".join(changed))
print(f"TOTAL FILES/LINES CHANGED: {len(changed)}")
