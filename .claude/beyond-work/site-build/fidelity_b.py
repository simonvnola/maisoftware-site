"""Word-for-word comparison of the option B paper (pandoc of the prepared markdown) against the built pages.
Site-added material is excluded: navigation, figure data tables and figure notes."""
import difflib
import re
from bs4 import BeautifulSoup

S = "/tmp/claude-0/-home-user-maisoftware-site/0002bdc0-746f-580b-b8b8-664940bff637/scratchpad"
SITE = "/home/user/maisoftware-site/UBI/paper/"
orig = BeautifulSoup(open(S + "/build-b/paper-body.html", encoding="utf-8"), "html.parser")
SLUGS = ["1-executive-summary", "2-the-case-for-change", "3-a-picture-of-2045", "4-what-the-evidence-says", "5-the-proposal",
         "6-making-the-dollars-work", "7-implementation-pathway", "8-risks-objections-and-responses",
         "9-conclusion-and-recommendations", "10-a-dividend-options-for-later", "11-appendix"]


def words(el):
    el = BeautifulSoup(str(el), "html.parser")
    for img in el.find_all("img"):
        img.replace_with(" [IMG] ")
    for a in el.find_all("a"):
        a.unwrap()
    el.smooth()
    return re.sub(r"\s+", " ", el.get_text(" ")).strip().split(" ")


def strip_site(root):
    for x in root.find_all("nav"):
        x.decompose()
    for x in root.select("details.bw-figure-data, p.bw-figure-note"):
        x.decompose()
    return root


top = [n for n in orig.contents if getattr(n, "name", None)]
front, changes, chapters, cur = [], [], [], None
for n in top[1:]:
    if n.name == "p" and n.find("a", id="changes") is not None and not n.get_text(strip=True):
        continue
    if n.name == "h2" and n.get_text(strip=True) == "Changes in this revision":
        cur = changes
        continue
    if n.name == "h2":
        cur = []
        chapters.append(cur)
        continue
    (front if cur is None else cur).append(n)

ok = True
for slug, nodes in zip(SLUGS, chapters):
    o = [w for n in nodes for w in words(n)]
    page = BeautifulSoup(open(SITE + slug + "/index.html", encoding="utf-8"), "html.parser")
    g = words(strip_site(page.select_one(".bw-body")))
    if o != g:
        d = [x for x in difflib.unified_diff(o, g, lineterm="", n=0) if not x.startswith(("---", "+++", "@@"))]
        print(f"{slug}: DIFF ({len(o)} words in paper, {len(g)} on page)", d[:8])
        ok = False
    else:
        print(f"{slug}: identical, {len(o)} words")

contents = BeautifulSoup(open(SITE + "index.html", encoding="utf-8"), "html.parser")
o = [w for n in front for w in words(n)]
g = words(contents.select_one(".bw-inset"))
print("front matter:", "identical" if o == g else ("DIFF", o[:6], g[:6]))
ok &= o == g
h = contents.find(id="changes")
assert h is not None and h.name == "h2", "contents page lacks h2#changes"
sec = []
for sib in h.find_next_siblings():
    if sib.name == "h2":
        break
    sec.append(sib)
o = [w for n in changes for w in words(n)]
g = [w for n in sec for w in words(n)]
print(f"changes in this revision (h2#changes): {'identical' if o == g else 'DIFF'}, {len(o)} words")
ok &= o == g
print("ALL IDENTICAL apart from listed diffs" if not ok else "ALL IDENTICAL")
