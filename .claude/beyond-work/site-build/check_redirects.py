"""Emulate vercel.json redirects (path-to-regexp style '(.*)' and '$1') for old and lowercase URLs,
then check the final path resolves to a file in the repo and any #fragment exists on that page.
Vercel matches redirect sources case-sensitively and applies redirects before the filesystem."""
import json
import os
import re
from bs4 import BeautifulSoup

SITE = "/home/user/maisoftware-site"
rules = json.load(open(os.path.join(SITE, "vercel.json")))["redirects"]


def compile_rule(src):
    rx = "^" + re.escape(src).replace(re.escape("(.*)"), "(.*)") + "$"
    return re.compile(rx)


RULES = [(compile_rule(r["source"]), r["destination"], r.get("permanent")) for r in rules]


def resolve(url, max_hops=5):
    path, _, frag = url.partition("#")
    hops = []
    for _ in range(max_hops):
        for rx, dest, perm in RULES:
            m = rx.match(path)
            if m:
                new = dest
                for i, g in enumerate(m.groups(), start=1):
                    new = new.replace(f"${i}", g)
                hops.append((path, new, 308 if perm else 307))
                path = new
                break
        else:
            return path, frag, hops
    raise RuntimeError("redirect loop: " + " -> ".join(h[0] for h in hops))


def exists(path, frag):
    fp = os.path.join(SITE, path.lstrip("/"))
    if path.endswith("/"):
        fp = os.path.join(fp, "index.html")
    if not os.path.isfile(fp):
        return False, "no file " + fp
    if frag:
        ids = {e["id"] for e in BeautifulSoup(open(fp, encoding="utf-8"), "html.parser").find_all(id=True)}
        if frag not in ids:
            return False, "no #" + frag
    return True, ""


TESTS = ["/UBI/paper/10-appendix/", "/UBI/paper/10-appendix", "/UBI/paper/10-appendix/#s-12", "/UBI/paper/10-appendix/#s-224",
         "/UBI/paper/10-appendix/index.html", "/ubi/paper/10-appendix/#s-5", "/ubi", "/ubi/paper/", "/ubi/paper/11-appendix/#s-232",
         "/UBI/", "/UBI/paper/#changes", "/UBI/paper/11-appendix/#s-1"]
bad = 0
for t in TESTS:
    path, frag, hops = resolve(t)
    ok, why = exists(path, frag)
    bad += not ok
    chain = " -> ".join(f"{h[1]} ({h[2]})" for h in hops) or "no redirect"
    print(f"{'ok  ' if ok else 'FAIL'} {t}: {chain}; final {path}{'#' + frag if frag else ''} {why}")
print("REDIRECTS OK" if not bad else f"REDIRECT FAILURES: {bad}")
