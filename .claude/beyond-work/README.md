# Beyond Work: option B revision bundle (1 November 2026)

Sources behind the pages under /UBI/. This folder is excluded from the
deployed site by .vercelignore.

- paper_2026-11-01.md: the revised paper, "Beyond Work: Preparing a Basic
  Income for Australia's AI Transition", a working draft. The chapter pages
  are built from it word for word.
- plan_2026-10-31.md: the author's plan to answer the October critique;
  option B was chosen.
- model/: the option B model runs on the paper's own Python model.
  optionb_results.md (Tables B1 to B21 and quotable paragraphs; B18 to B21
  are the displacement second-round effects, re-run on the evidence review),
  optionb_facts.json (every figure with units, years, source and a
  provisional flag), scripts/ (stdlib Python; run against a copy of the
  paper's supplementary folder, which is not in this repository) and
  runs/ (per-configuration outputs; fiscal.json holds the fiscal paths).
- site-build/: the scripts that turn the paper into pages and redraw the
  charts (build_paper_b.py, make_charts_b.py, prep_b.py), the paper build
  pieces (paper-build/), the calculator's option B data step
  (optionb_data.js) and the checks. The calculator's full source lives
  with its builder and is embedded in UBI/calculator/index.html.
- charts-data/: the CSV behind each redrawn figure and alt.json.
- evidence_review_2026-11-01.md: the external evidence review of dwelling
  sales, distressed-sale price effects, household debt, means tests, claims
  processing and state property taxes, with evidence_review_brief.md, the
  brief it answered. Sources S233, S234 and S236 to S264 come from it.

Scripts in site-build/ and model/scripts/ have this bundle's build-machine
paths replaced by <SCRATCHPAD>; set that to the folder holding these files.

Caveats carried into the paper: P* as first printed overspent by A$6.2bn
and was re-costed to A$6,750 a child without automatic enrolment; the
stress-test figures are provisional; sources S225 to S232 and S235 and the
OpenResearch revision could not be opened from the build environment and
need checking before submission; the national house-price effect of forced
sales is reported as not quantified.
