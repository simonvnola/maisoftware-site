"""Prepare the option B markdown for pandoc: drop the model agent's pending list and FIGURE_REDRAW markers.
Usage: python3 -I prep_b.py <in.md> <out.md>. Prints what it removed and any {{TOKEN}}s left in the text."""
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
md = open(src, encoding="utf-8").read()
removed = []
m = re.search(r"^## Pending figures\s*$", md, flags=re.M)
if m:
    removed.append(f"'## Pending figures' section ({len(md) - m.start()} chars)")
    md = md[:m.start()].rstrip() + "\n"
n_before = len(md)
md, n = re.subn(r"^\{\{FIGURE_REDRAW:.*?\}\}\s*\n", "", md, flags=re.M | re.S)
if n:
    removed.append(f"{n} FIGURE_REDRAW markers")
open(dst, "w", encoding="utf-8").write(md)
tokens = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", md)))
print("removed:", "; ".join(removed) or "nothing")
print(f"tokens left in text: {len(tokens)}", " ".join(tokens))
