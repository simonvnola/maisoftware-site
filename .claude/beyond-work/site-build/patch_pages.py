"""patch_pages.py: carry a paper revision onto the built pages under /UBI/paper/ when build_paper.py is not to hand.

It converts markdown fragments with pandoc (the settings build_paper_b.py uses) and applies the page builder's markup:
paper ### becomes h2 and #### h3, a table gets its title paragraph and scrolling wrapper, columns of numbers are
right-aligned, and [S#] citations link to the sources list. `python3 -I patch_pages.py --selftest <paper.md>` rebuilds an existing section and compares it with
the served page, so the markup rules are tested before anything new is written. Import `render` to use it."""
import re, subprocess, sys
from bs4 import BeautifulSoup

SITE = "/UBI/paper/"
APPENDIX = SITE + "11-appendix/"


def pandoc(md):
    return subprocess.run(["pandoc", "-f", "gfm-tex_math_dollars", "-t", "html5", "--wrap=none"], input=md, text=True,
                          capture_output=True, check=True).stdout


def cite(html):
    return re.sub(r"\bS(\d+)\b(?=[^\[\]<>]*\])", lambda m: f'<a href="{APPENDIX}#s-{m.group(1)}">S{m.group(1)}</a>', html)


def render(md, appendix=False):
    soup = BeautifulSoup(pandoc(md), "html.parser")
    for h in soup.find_all(["h3", "h4"]):
        h.name = "h2" if h.name == "h3" else "h3"
    for t in soup.find_all("table"):
        title = t.find_previous_sibling("p")
        m = re.match(r"Table (\d+)\.(\d+)\.", title.get_text())
        tid = f"table-{m.group(1)}-{m.group(2)}"
        title["class"], title["id"] = ["bw-table-title"], tid
        heads = t.thead.find_all("th")
        body = [r.find_all("td") for r in t.tbody.find_all("tr")]
        numeric = lambda c: bool(re.match(r"^[−–+-]?\(?(A\$)?\d|^–$", c.get_text().strip()))
        right = [sum(numeric(r[i]) for r in body) * 2 > len(body) for i in range(len(heads))]
        t["class"] = [f"bw-c{len(heads)}"]
        for row in t.find_all("tr"):
            del row["class"]
            for i, c in enumerate(row.find_all(["th", "td"])):
                del c["style"]
                if right[i]:
                    c["class"] = ["num", "txt"] if (c.name == "th" and len(c.get_text()) > 18) else ["num"]
                elif i == 0:
                    c["class"] = ["wide"]
                if c.name == "th":
                    c["scope"] = "col"
        wrap = soup.new_tag("div", attrs={"aria-labelledby": tid, "class": "bw-table-wrap", "role": "group", "tabindex": "0"})
        t.wrap(wrap)
    out = str(soup)
    return out if appendix else cite(out)


if __name__ == "__main__" and "--selftest" in sys.argv:
    md = open(sys.argv[-1], encoding="utf-8").read()
    a = md.index("### What it would cost to end poverty: an illustration")
    b = md.index("### Assumptions", a)
    mine = BeautifulSoup(render(md[a:b]), "html.parser")
    page = open("../../../UBI/paper/6-making-the-dollars-work/index.html", encoding="utf-8").read()
    s = page.index('<h2 id="what-it-would-cost-to-end-poverty-an-illustration">')
    e = page.index('<h2 id="assumptions">', s)
    theirs = BeautifulSoup(page[s:e], "html.parser")
    norm = lambda x: re.sub(r">\s+<", "><", re.sub(r"\s+", " ", str(x))).strip()
    A, B = norm(mine), norm(theirs)
    if A == B:
        print("selftest: identical markup,", len(A), "characters")
    else:
        i = next(k for k in range(min(len(A), len(B))) if A[k] != B[k])
        print("selftest: DIFF at", i, "\n mine  :", A[max(0, i - 150):i + 150], "\n served:", B[max(0, i - 150):i + 150])
        sys.exit(1)
