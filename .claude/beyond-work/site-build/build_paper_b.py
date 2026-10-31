#!/usr/bin/env python3
"""Build the option B paper pages (31 October 2026 revision) under /UBI/paper/.

Pipeline:
  1. prep_b.py drops the model agent's "Pending figures" list and the FIGURE_REDRAW markers.
  2. pandoc -f gfm-tex_math_dollars -t html5 --wrap=none (the settings the paper was first converted with).
  3. This script splits the body into the front matter, "Changes in this revision" and 11 chapters,
     reuses build_paper.py for tables, figures, citations and sources, and writes the pages with the
     shared shell and the working-draft banner.

Usage: python3 build_paper_b.py [--md path/to/paper.md] [--write-overview-abbr]
The overview (/UBI/index.html) is never rewritten except for its abbreviations block, and only with
--write-overview-abbr.
"""
import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys

from bs4 import BeautifulSoup, NavigableString, Tag

import build_paper as bp

SCRATCH = bp.SCRATCH
MD_DEFAULT = os.path.join(SCRATCH, "optionb", "paper_optionb.md")
BUILD = os.path.join(SCRATCH, "build-b")
SITE = bp.SITE
OUT = bp.OUT
CHARTS_OUT = bp.CHARTS_OUT
ORIGIN = bp.ORIGIN
APPENDIX = "11-appendix"
STALE_DIRS = ["10-appendix"]          # old slugs, now redirected in vercel.json
BANNER = open(os.path.join(SCRATCH, "optionb", "phase_banner.html"), encoding="utf-8").read().rstrip("\n")

# Point the shared helpers at the option B inputs.
bp.CHARTS_SRC = os.path.join(SCRATCH, "charts-out-b")
bp.CSV_DIR = os.path.join(SCRATCH, "charts-data-b")
bp.ALT.update(json.load(open(os.path.join(bp.CSV_DIR, "alt.json"), encoding="utf-8")))
bp.chapter_for_source = lambda n: f"/UBI/paper/{APPENDIX}/#s-{n}"
bp.DATA_FILE_RE = re.compile(r"(?:charts/data/)?fig(\d)_(\d)_[A-Za-z0-9_]+\.csv")
bp.NOT_ACRONYMS.add("KMXT")          # a public radio station's call sign, in a source entry
bp.GLOSSARY.update({
    "PTR": "participation tax rate",
    "JSA": "Jobs and Skills Australia",
})

CHAPTERS = [
    ("1-executive-summary", "1. Executive summary",
     "It gives the whole case briefly: the recommended Stage 1, its alternative, the five facts that weigh against it, the universal pathway and the decisions Parliament needs to make now. It is for readers with ten minutes."),
    ("2-the-case-for-change", "2. The case for change",
     "It sets out why Australia should act now: the pace of artificial intelligence (AI), which jobs are exposed, what the safety net leaves unmet, and the objectives the paper sets. It is for readers who want the problem before the proposal."),
    ("3-a-picture-of-2045", "3. A picture of 2045",
     "It describes what Australia could look like in 2045, told through seven people and the aggregate numbers. It is for readers who want to see the intended result."),
    ("4-what-the-evidence-says", "4. What the evidence says",
     "It reviews what international basic income trials, Australian precedents and the contrary evidence show, and what they cannot tell us. It is for readers who want to test the proposal against the evidence."),
    ("5-the-proposal", "5. The proposal",
     "It sets out the recommended Stage 1, a targeted floor called P*, compares it with the targeted package and Part 1, and describes the universal pathway's tests. It is for readers who need the specifics."),
    ("6-making-the-dollars-work", "6. Making the dollars work",
     "It covers the costings: net cost, the five taxes, the borrowing and the levy, a joint stress test, net benefit, and who gains and who loses after the taxes. It is the longest chapter and is for readers who want the numbers behind every claim."),
    ("7-implementation-pathway", "7. Implementation pathway",
     "It lays out the phases and gates from November 2026, the legislation to enact or amend, the agencies responsible and the transition protections. It is for readers who want to know how Stage 1 would be delivered."),
    ("8-risks-objections-and-responses", "8. Risks, objections and responses",
     "It covers the risk register, the strongest objections in order of weight, and the objections of the red teams and the external critique. It is for readers who want to see the case against the recommendation."),
    ("9-conclusion-and-recommendations", "9. Conclusion and recommendations",
     "It lists the recommendations, the consultation plan and the monitoring and evaluation plan. It is for readers who want to know what the paper asks Parliament to do."),
    ("10-a-dividend-options-for-later", "10. A dividend: options for later",
     "It sets out four ways to pay a yearly dividend to every adult, with the tests any dividend should pass. None is recommended now. It is for readers weighing a universal element."),
    (APPENDIX, "11. Appendix: methodology, assumptions and sources",
     "It explains how the model works, describes the household model and the data gaps, and lists the numbered sources. It is for readers who want to check the method or follow a citation."),
]
_fig_tables_v1 = bp.fig_tables


def fig_tables_b(svg_name):
    """Data tables for the redrawn figures; the others as before."""
    if svg_name == "fig6_1_funding_pct_gdp.svg":
        data, hdr, num = bp._pick(bp._rd("fig6_1_funding_pct_gdp.csv"), [
            ("year", "Financial year", False), ("five_taxes_bn", "Five taxes (A$ billion)", True), ("net_cost_bn", "P* net cost (A$ billion)", True),
            ("five_taxes_pct_gdp", "Five taxes (% of GDP)", True), ("net_cost_pct_gdp", "P* net cost (% of GDP)", True),
            ("balance_30_june_bn", "Balance at 30 June: borrowing (−) or surpluses kept (+) (A$ billion)", True),
            ("balance_30_june_pct_gdp", "Balance at 30 June (% of GDP)", True), ("levy_bn", "Levy (A$ billion)", True),
            ("levy_pct_market_income", "Levy (% of market income)", True), ("levy_pct_gdp", "Levy (% of GDP)", True)])
        for d in data:
            for k in (3, 4, 6, 9):
                d[k] = f"{float(d[k]):.2f}"
            for k in range(1, len(d)):
                d[k] = d[k].replace("-", "−")
        return [("Data for Figure 6.1 (P*'s central path; provisional)", hdr, data, num)]
    if svg_name == "fig6_3_ucb_netdebt.svg":
        data, hdr, num = bp._pick(bp._rd("fig6_3_ucb_netdebt.csv"), [
            ("year", "Financial year", False), ("ucb_vs_baseline_bn", "Underlying cash balance against baseline (A$ billion)", True),
            ("ucb_vs_baseline_pct_gdp", "Underlying cash balance against baseline (% of GDP)", True),
            ("net_debt_vs_baseline_pct_gdp", "Net debt against baseline (% of GDP)", True),
            ("nfw_vs_baseline_pct_gdp", "Net financial worth against baseline (% of GDP; minus net debt, as there is no fund)", True)])
        for d in data:
            for k in (2, 3, 4):
                d[k] = f"{float(d[k]) + 0.0:.2f}"
            for k in range(1, len(d)):
                d[k] = d[k].replace("-", "−")
                if d[k] in ("−0.00", "−0.0"):
                    d[k] = d[k][1:]
        return [("Data for Figure 6.3 (P*'s central path; provisional)", hdr, data, num)]
    if svg_name == "fig7_1_roadmap.svg":
        phases = bp._rd("fig7_1_roadmap.csv")
        pdata = [[p["phase"], bp.long_date(p["start"]), bp.long_date(p["end"]), p["owner"]] for p in phases]
        pdata[-1][2] = "Not scheduled"
        gates = [[g["number"], g["date_label"], phases[int(g["phase_row"])]["phase"], g["gate"]] for g in bp._rd("fig7_1_gates.csv")]
        return [("Phases in Figure 7.1", ["Phase", "Start", "End", "Owner"], pdata, [False, False, False, False]),
                ("Gates in Figure 7.1", ["Gate", "Date", "Phase", "Gate or milestone"], gates, [True, False, False, False])]
    if svg_name == "fig6_2_ai_fund.svg":
        (cap, hdr, data, num), = _fig_tables_v1(svg_name)
        hdr[-1] = "Cost of the step from a payment at the JobSeeker rate to one at the Age Pension rate (A$ billion)"
        return [("Data for Figure 6.2 (run on the 22 October design)", hdr, data, num)]
    return _fig_tables_v1(svg_name)


bp.fig_tables = fig_tables_b

FIGURE_NOTES = {
    "figure-6-1": "Modelled projection from the paper's model, not a forecast. Provisional.",
    "figure-6-2": "Modelled projection from the paper's model, not a forecast. Run on the 22 October design.",
    "figure-6-3": "Modelled projection from the paper's model, not a forecast. Provisional.",
    "figure-6-4": "Modelled projection from the paper's model, not a forecast.",
    "figure-7-1": "Proposed timeline from the paper, not a forecast: the dates depend on Parliament.",
}


def shell(*, title, description, path, nav_current, crumbs, body):
    page = bp.shell(title=title, description=description, path=path, nav_current=nav_current, crumbs=crumbs, body=body)
    marker = "</nav>\n<main id=\"main\""
    assert page.count(marker) == 1
    return page.replace(marker, "</nav>\n" + BANNER + "\n<main id=\"main\"", 1)


def run_pandoc(md_path):
    os.makedirs(BUILD, exist_ok=True)
    prepped = os.path.join(BUILD, "paper.md")
    body = os.path.join(BUILD, "paper-body.html")
    r = subprocess.run([sys.executable, "-I", os.path.join(os.path.dirname(__file__), "prep_b.py"), md_path, prepped],
                       capture_output=True, text=True, check=True)
    print(r.stdout.strip())
    subprocess.run(["pandoc", "-f", "gfm-tex_math_dollars", "-t", "html5", "--wrap=none", prepped, "-o", body], check=True)
    return body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", default=MD_DEFAULT)
    ap.add_argument("--write-overview-abbr", action="store_true")
    args = ap.parse_args()

    body_path = run_pandoc(args.md)
    soup = BeautifulSoup(open(body_path, encoding="utf-8").read(), "html.parser")
    stats = {"abbr": {}, "data_links": 0, "ids": set(), "tables": 0, "figures": 0, "untitled_tables": 0, "untitled_figures": 0,
             "continued_tables": 0, "cols": {}, "s5_fixed": 0, "bare_urls_linked": 0, "cites": 0}

    # ---- split: h1, front matter, "Changes in this revision", 11 chapters
    top = [n for n in soup.contents if isinstance(n, Tag)]
    assert top[0].name == "h1"
    paper_title = top[0].get_text(strip=True)
    front, changes, chapters, cur = [], None, [], None
    for n in top[1:]:
        if n.name == "p" and n.find("a", id="changes") is not None and not n.get_text(strip=True):
            continue                                    # the raw anchor; the h2 gets id="changes" instead
        if n.name == "h2" and n.get_text(strip=True) == "Changes in this revision":
            changes = {"h2": n, "nodes": []}
            cur = changes
        elif n.name == "h2":
            cur = {"h2": n, "nodes": []}
            chapters.append(cur)
        elif cur is None:
            front.append(n)
        else:
            cur["nodes"].append(n)
    assert changes is not None, "no 'Changes in this revision' section"
    assert len(chapters) == len(CHAPTERS), (len(chapters), [c["h2"].get_text() for c in chapters])
    for ch, (slug, title, _) in zip(chapters, CHAPTERS):
        assert ch["h2"].get_text(strip=True) == title, (ch["h2"].get_text(strip=True), title)
    front_text = " ".join(n.get_text(" ") for n in front)
    rev = re.search(r"Revised (\d{1,2} [A-Z][a-z]+ \d{4})", front_text)
    revised = rev.group(1) if rev else "31 October 2026"
    caption = f"Working draft policy paper, prepared by Mai Software, revised {revised}"

    # ---- charts
    os.makedirs(CHARTS_OUT, exist_ok=True)
    for f in sorted(os.listdir(bp.CHARTS_SRC)):
        if f.endswith(".svg"):
            shutil.copyfile(os.path.join(bp.CHARTS_SRC, f), os.path.join(CHARTS_OUT, f))

    # ---- sources first, then every chapter
    last = len(chapters) - 1
    app = soup.new_tag("div")
    for n in chapters[last]["nodes"]:
        app.append(n)
    chapters[last]["root"] = app
    bp.process_sources(app, soup, stats)
    for i, ch in enumerate(chapters):
        if "root" not in ch:
            root = soup.new_tag("div")
            for n in ch["nodes"]:
                root.append(n)
            ch["root"] = root
        root = ch["root"]
        for h in root.find_all(["h4", "h3"]):
            h.name = "h2" if h.name == "h3" else "h3"
        bp.process_tables(root, soup, stats)
        bp.process_figures(root, soup, stats)
        for note in root.find_all("p", class_="bw-figure-note"):
            fid = note.find_parent("figure").find("figcaption")["id"]
            note.string = FIGURE_NOTES[fid]
        for fig in root.find_all("figure"):
            fid = fig.find("figcaption")["id"]
            if fid in FIGURE_NOTES and fig.find("p", class_="bw-figure-note") is None:
                note = soup.new_tag("p")
                note["class"] = ["bw-figure-note"]
                note.string = FIGURE_NOTES[fid]
                fig.find("details", class_="bw-figure-data").insert_before(note)
        page_fids = {c.get("id")[:-5] for c in root.find_all("details", class_="bw-figure-data")}
        stats["data_links"] += bp.link_data_files(root, soup, page_fids)
        stats["cites"] += bp.link_citations(root, soup, same_page=(i == last))

    front_root = soup.new_tag("div")
    for n in front:
        front_root.append(n)
    stats["cites"] += bp.link_citations(front_root, soup, same_page=False)
    changes_root = soup.new_tag("div")
    for n in changes["nodes"]:
        changes_root.append(n)
    stats["cites"] += bp.link_citations(changes_root, soup, same_page=False)

    tokens = {}
    sizes = {}
    n_ch = len(CHAPTERS)
    # ---- chapter pages
    for i, (ch, (slug, title, desc)) in enumerate(zip(chapters, CHAPTERS)):
        root = ch["root"]
        path = f"/UBI/paper/{slug}/"
        h2s = root.find_all("h2")
        ids = [h.get("id") for h in h2s]
        assert all(ids) and len(ids) == len(set(ids)), ids
        otp = ""
        if h2s:
            items = "\n".join(f'      <li><a href="#{h["id"]}">{html.escape(h.get_text())}</a></li>' for h in h2s)
            otp = f'    <nav class="bw-contents" aria-label="On this page">\n      <h2>On this page</h2>\n      <ol>\n{items}\n      </ol>\n    </nav>\n'
        chap_items = []
        for j, (s2, t2, _) in enumerate(CHAPTERS):
            cur_attr = ' aria-current="page"' if j == i else ""
            chap_items.append(f'        <li><a href="/UBI/paper/{s2}/"{cur_attr}>{html.escape(t2)}</a></li>')
        aside = ('  <aside>\n    <nav class="bw-contents bw-chapters" aria-label="Chapters">\n      <h2>Chapters</h2>\n      <ol>\n'
                 + "\n".join(chap_items) + '\n      </ol>\n      <p><a href="/UBI/paper/">About the paper and its contents</a></p>\n    </nav>\n  </aside>\n')
        pager_parts = []
        if i > 0:
            ps, pt, _ = CHAPTERS[i - 1]
            pager_parts.append(f'    <a class="prev" href="/UBI/paper/{ps}/"><span class="bw-pager-label">Previous</span><span class="bw-pager-title">{html.escape(pt)}</span></a>')
        else:
            pager_parts.append('    <a class="prev" href="/UBI/paper/"><span class="bw-pager-label">Previous</span><span class="bw-pager-title">The paper: contents</span></a>')
        if i < n_ch - 1:
            ns, nt, _ = CHAPTERS[i + 1]
            pager_parts.append(f'    <a class="next" href="/UBI/paper/{ns}/"><span class="bw-pager-label">Next</span><span class="bw-pager-title">{html.escape(nt)}</span></a>')
        pager = '  <nav class="bw-pager" aria-label="Previous and next chapter">\n' + "\n".join(pager_parts) + "\n  </nav>\n"
        content = "".join(str(n) for n in root.contents)
        lead = f"Chapter {i + 1} of {n_ch} of the paper Beyond Work. {desc}"
        acrs, unknown = bp.page_acronyms(root)
        acrs |= bp.page_acronyms(BeautifulSoup(f"<p>{html.escape(title)} {html.escape(lead)}</p>", "html.parser"))[0]
        if unknown:
            print(f"UNKNOWN ACRONYMS on {slug}: {sorted(unknown)}")
        stats["abbr"][slug] = sorted(acrs)
        body = (f'  <p class="bw-caption">{caption}</p>\n  <h1>{html.escape(title)}</h1>\n  <p class="bw-lead">{html.escape(lead)}</p>\n'
                f'{bp.abbr_html(acrs, "Abbreviations used in this chapter")}  <div class="bw-cols">\n{aside}  <div class="bw-body">\n{otp}{content}\n{pager}  </div>\n  </div>')
        page = shell(title=title, description=f"Chapter {i + 1} of the paper Beyond Work. {desc}", path=path, nav_current="The paper",
                     crumbs=[("/UBI/", "Beyond Work"), ("/UBI/paper/", "The paper"), (path, title)], body=body)
        page = bp.tidy(page)
        t = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", page)))
        if t:
            tokens[slug] = t
        d = os.path.join(OUT, slug)
        os.makedirs(d, exist_ok=True)
        fp = os.path.join(d, "index.html")
        open(fp, "w", encoding="utf-8").write(page)
        sizes[fp] = len(page.encode("utf-8"))

    # ---- stale chapter folders (redirected in vercel.json)
    for stale in STALE_DIRS:
        sd = os.path.join(OUT, stale)
        if os.path.isdir(sd):
            shutil.rmtree(sd)
            print("removed stale folder", sd)

    # ---- contents page
    changes["h2"]["id"] = "changes"
    front_html = "".join(str(n) for n in front_root.contents)
    changes_html = str(changes["h2"]) + "\n" + "".join(str(n) for n in changes_root.contents)
    chap_list = "\n".join(
        f'      <li><a href="/UBI/paper/{s}/">{html.escape(t)}</a><br>{html.escape(d.split(" It is for")[0])}</li>'
        for s, t, d in CHAPTERS)
    n_tables = stats["tables"] - stats["continued_tables"]
    n_figs = stats["figures"]
    n_src = stats["sources"]
    body = f'''  <p class="bw-caption">{caption}</p>
  <h1>{html.escape(paper_title)}</h1>
  <div class="bw-measure">
  <p class="bw-lead">This is the contents page of the paper. It is for readers who want the full case chapter by chapter, or one chapter on its own.</p>
__ABBR__
  <p class="bw-meta">Author: Simon, Founder, Mai Software, Sydney. Status: a working draft of a submission prepared by Mai Software; it is not government policy. Revised {revised}.</p>
  <nav class="bw-contents" aria-label="On this page">
    <h2>On this page</h2>
    <ol>
      <li><a href="#about">About this paper</a></li>
      <li><a href="#changes">Changes in this revision</a></li>
      <li><a href="#chapters">Chapters</a></li>
      <li><a href="#figures">Figures and tables</a></li>
      <li><a href="#calculator">The calculator</a></li>
    </ol>
  </nav>
  <h2 id="about">About this paper</h2>
  <p>Beyond Work is a policy paper prepared by Mai Software as a submission to Parliament. It recommends a targeted floor for income support from 1 July 2028, called Stage 1 or P*. It also asks Parliament to legislate the tests a universal basic income would have to pass, but no universal rate and no dividend.</p>
  <p>The paper is a working draft. It is updated regularly, and its figures and recommendations may change. It is not government policy and no government has adopted it.</p>
  <p>This version was revised on {revised} after an external critique. The changes it made are listed below, in the paper's own words.</p>
  <p>The paper's front matter follows.</p>
  <div class="bw-inset">
{front_html}
  </div>
{changes_html}
  <h2 id="chapters">Chapters</h2>
  <p>The paper has {len(CHAPTERS)} chapters. Each is on its own page. <a href="/UBI/paper/1-executive-summary/">Start with the executive summary</a> if you have ten minutes.</p>
  <ol class="bw-chapter-list">
{chap_list}
  </ol>
  <h2 id="figures">Figures and tables</h2>
  <p>The paper has {n_figs} figures and {n_tables} tables. Each figure is drawn as a chart with its title, a source line, a text description and its data in a table you can open. Each table has a title and a header row. Wide tables scroll sideways on small screens. The paper's supplementary files are listed as source <a href="/UBI/paper/{APPENDIX}/#s-5">S5 in the appendix</a>.</p>
  <h2 id="calculator">The calculator</h2>
  <p>The calculator runs the paper's model in your browser. You can change the paper's settings and see the modelled effect on a household and on the Budget. <a href="/UBI/calculator/">Use the calculator</a>.</p>
  </div>'''
    page = shell(title="The paper", description=f"Contents of the working-draft policy paper {paper_title}, prepared by Mai Software: its {len(CHAPTERS)} chapters, the changes in this revision, figures and sources.",
                 path="/UBI/paper/", nav_current="The paper", crumbs=[("/UBI/", "Beyond Work"), ("/UBI/paper/", "The paper")], body=body)
    acrs, unknown = bp.page_acronyms(BeautifulSoup(page.replace("__ABBR__", ""), "html.parser").find("main"))
    if unknown:
        print("UNKNOWN ACRONYMS on contents page:", sorted(unknown))
    stats["abbr"]["contents"] = sorted(acrs)
    page = bp.tidy(page.replace("__ABBR__\n", bp.abbr_html(acrs, "Abbreviations used on this page")))
    t = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", page)))
    if t:
        tokens["contents"] = t
    fp = os.path.join(OUT, "index.html")
    open(fp, "w", encoding="utf-8").write(page)
    sizes[fp] = len(page.encode("utf-8"))

    # ---- overview: abbreviations block only, and only on request
    ov = os.path.join(SITE, "UBI", "index.html")
    page = open(ov, encoding="utf-8").read()
    m = re.search(r"<!--abbr-start-->.*?<!--abbr-end-->", page, flags=re.S)
    if m:
        stripped = page[:m.start()] + page[m.end():]
        acrs, unknown = bp.page_acronyms(BeautifulSoup(stripped, "html.parser").find("main"))
        if unknown:
            print("UNKNOWN ACRONYMS on overview:", sorted(unknown))
        stats["abbr"]["overview"] = sorted(acrs)
        new_page = page[:m.start()] + "<!--abbr-start-->\n" + bp.abbr_html(acrs, "Abbreviations used on this page") + "  <!--abbr-end-->" + page[m.end():]
        if new_page == page:
            print("overview: abbreviations block up to date (not rewritten)")
        elif args.write_overview_abbr:
            open(ov, "w", encoding="utf-8").write(new_page)
            page = new_page
            print("overview: abbreviations block rewritten")
        else:
            print("overview: abbreviations block differs; left untouched (pass --write-overview-abbr)")
    sizes[ov] = len(page.encode("utf-8"))

    # ---- report
    for k, v in stats["abbr"].items():
        print("abbr", k, len(v), " ".join(v))
    print("tables:", stats["tables"], "untitled:", stats["untitled_tables"], "continued:", stats["continued_tables"])
    print("figures:", stats["figures"], "untitled:", stats["untitled_figures"])
    print("sources:", stats["sources"], "s5 fixed:", stats["s5_fixed"], "bare urls linked:", stats["bare_urls_linked"])
    print("citations linked:", stats["cites"], "data-file links:", stats["data_links"])
    if tokens:
        print("UNFILLED TOKENS on the built pages:")
        for k, v in tokens.items():
            print("  ", k, " ".join(v))
    for fp, sz in sizes.items():
        print(f"{sz:>8}  {fp}")


if __name__ == "__main__":
    main()
