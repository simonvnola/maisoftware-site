"""apply_2026-11-10.py: carry the 10 November 2026 revision of the paper onto the pages under /UBI/paper/.

Each new or changed passage is taken from the paper source, rendered by patch_pages.render and placed at the matching
point of the served page. Run once from this folder: python3 -I apply_2026-11-10.py. Then run fidelity_b.py."""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_pages import render

MD = open(os.path.join(HERE, "..", "paper_2026-11-10.md"), encoding="utf-8").read()
SITE = os.path.join(HERE, "..", "..", "..", "UBI")
OLD, NEW = "3 November 2026", "10 November 2026"


def para(start):
    """The paper paragraph (or list item or table row) that begins with `start`."""
    i = MD.index(start)
    return MD[i:MD.index("\n", i)]


def inner(md):
    return re.sub(r"^<p>|</p>\s*$", "", render(md).strip())


def edit(rel, fn):
    p = os.path.join(SITE, rel)
    s = open(p, encoding="utf-8").read()
    t = fn(s)
    assert t != s, rel
    open(p, "w", encoding="utf-8").write(t)
    print("patched", rel)


def once(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80])
    return s.replace(a, b)


CAPTION = "prepared by Mai Software, revised "
PAGES = ["paper/index.html"] + [os.path.join("paper", d, "index.html") for d in sorted(os.listdir(os.path.join(SITE, "paper")))
                                if d[0].isdigit()]
for rel in PAGES:
    edit(rel, lambda s: once(s, CAPTION + OLD, CAPTION + NEW))


def contents(s):
    s = once(s, "Revised 3 November 2026 after an external critique.", "Revised 10 November 2026 after an external critique.")
    s = once(s, "This version: 3 November 2026.", "This version: 10 November 2026.")
    s = once(s, "it is not government policy. Revised 3 November 2026.</p>", "it is not government policy. Revised 10 November 2026.</p>")
    s = once(s, "This version was revised on 3 November 2026 after", "This version was revised on 10 November 2026 after")
    h = '<h2 id="changes">Changes in this revision</h2>\n'
    return once(s, h, h + render(para("**10 November 2026.** This revision adds")).strip() + "\n")


def summary(s):
    a = "no rate passes its funding test on any modelled path (Section 6).</li>\n</ol>"
    return once(s, a, a + render(para("The funding would be less exposed to a shortfall with more revenue behind it")).strip())


def dollars(s):
    a = MD.index("### Funding beyond the five taxes: an illustration")
    sec = render(MD[a:MD.index("## 7. Implementation pathway", a)]).strip()
    s = once(s, "Note: every measure has a published PBO costing,", "Note: each of the five taxes and the wealth tax has a published PBO costing,")
    s = once(s, "Every revenue measure has an official costing, but", "Each of the five taxes has an official costing, but")
    s = once(s, '\n  <nav class="bw-pager"', sec + '\n  <nav class="bw-pager"')
    li = '<li><a href="#assumptions">Assumptions</a></li>\n'
    return once(s, li, li + '<li><a href="#funding-beyond-the-five-taxes-an-illustration">Funding beyond the five taxes: an illustration</a></li>\n')


def objections(s):
    a = "but it does need that levy, and the paper does not claim otherwise."
    full = inner(para("The objection is fair, and the paper now leads with the result after the taxes"))
    return once(s, a, a + full[full.index(a) + len(a):])


def recs(s):
    s = once(s, "Twenty-nine recommendations, each with an owner and a date, would put Stage 1 in place by 1 July 2028, build the pathway, "
             "measure what poverty costs and share the design (Table 9.1).", inner(para("Thirty recommendations, each with an owner")))
    cells = [inner(c.strip()) for c in para("| 19 | Cost further funding for Stage 1").strip("|").split(" | ")]
    row = "<tr>\n<td>" + cells[0].strip() + "</td>\n" + "".join(f'<td class="wide">{c.strip()}</td>\n' for c in cells[1:]) + "</tr>\n"
    a = "Section 6 (Table 6.58)</td>\n</tr>\n"
    return once(s, a, a + row)


def dividend(s):
    a = "pays a token dividend, A$1 in 2032-33 and A$86 in 2045-46.</p>"
    return once(s, a, a + render(para("A fund fed by resource receipts and used for Stage 1")).strip())


def appendix(s):
    a = "S225 to S232, S235 and S265 to S295 could not be opened from the drafting environment"
    full = inner(para("Sources S1 to S224 are numbered"))
    k = full.index("S296 and S297 were read")
    s = once(s, a, full[k:full.index(a)] + a)
    items = render("\n".join(para(f"{n}. **[S{n}]**") for n in (296, 297, 298)), appendix=True)
    lis = re.findall(r"<li>.*?</li>", items, flags=re.S)
    assert len(lis) == 3
    new = "".join(li.replace("<li>", f'<li id="s-{n}">', 1) + "\n" for n, li in zip((296, 297, 298), lis))
    a = "https://bmjopen.bmj.com/content/11/12/e052156</a></li>\n"
    return once(s, a, a + new)


edit("paper/index.html", contents)
edit("paper/1-executive-summary/index.html", summary)
edit("paper/6-making-the-dollars-work/index.html", dollars)
edit("paper/8-risks-objections-and-responses/index.html", objections)
edit("paper/9-conclusion-and-recommendations/index.html", recs)
edit("paper/10-a-dividend-options-for-later/index.html", dividend)
edit("paper/11-appendix/index.html", appendix)
