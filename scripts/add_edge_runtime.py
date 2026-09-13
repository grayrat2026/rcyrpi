#!/usr/bin/env python3
"""Add `export const runtime = "edge"` to all API routes + dynamic pages (next-on-pages requirement)."""
import os, re

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "app")
MARK = 'export const runtime = "edge";'

targets = []
for dirpath, _, files in os.walk(ROOT):
    for f in files:
        p = os.path.join(dirpath, f)
        rel = os.path.relpath(p, ROOT)
        if f == "route.ts":
            targets.append(p)
        elif f == "page.tsx" and ("[" in rel):  # dynamic segments only
            targets.append(p)

changed, skipped = [], []
for p in sorted(targets):
    src = open(p, encoding="utf-8").read()
    if 'runtime = "edge"' in src or "runtime = 'edge'" in src:
        skipped.append(p)
        continue
    # insert after the last top import block (or at top if none)
    lines = src.split("\n")
    last_import = 0
    for i, line in enumerate(lines[:80]):
        if line.startswith("import ") or (line.startswith("} from ") and last_import):
            last_import = i
        if re.match(r"^import[\s{]", line):
            last_import = i
    # find end of multi-line imports: scan while parentheses/braces open
    insert_at = 0
    depth = 0
    seen_import = False
    for i, line in enumerate(lines[:120]):
        depth += line.count("{") + line.count("(") - line.count("}") - line.count(")")
        if re.match(r"^import[\s{]", line):
            seen_import = True
        if seen_import and depth == 0 and not line.strip().startswith("import"):
            insert_at = i
            break
    else:
        insert_at = len(lines)
    lines.insert(insert_at, "\n" + MARK + "\n")
    open(p, "w", encoding="utf-8").write("\n".join(lines))
    changed.append(os.path.relpath(p, os.path.dirname(ROOT)))

print(f"targeted={len(targets)} changed={len(changed)} skipped(already)={len(skipped)}")
for c in changed:
    print("  +", c)
