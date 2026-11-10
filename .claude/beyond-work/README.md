# Beyond Work: option B revision bundle (revised 3 November 2026)

Sources behind the pages under /UBI/. This folder is excluded from the
deployed site by .vercelignore.

- paper_2026-11-03.md: the revised paper (3 November 2026: the cost of poverty,
  Tables 2.3 and 2.4, and an illustrative zero-poverty costing, Table 6.58), "Beyond Work: Preparing a Basic
  Income for Australia's AI Transition", a working draft. The chapter pages
  are built from it word for word.
- plan_2026-10-31.md: the author's plan to answer the October critique;
  option B was chosen.
- model/: the option B model runs on the paper's own Python model.
  optionb_results.md (Tables B1 to B21 and quotable paragraphs; B18 to B21
  are the displacement second-round effects, re-run on the evidence review),
  optionb_facts.json (every figure with units, years, source and a
  provisional flag; zero_poverty and cost_of_poverty feed Tables 2.3 and
  6.58 and the calculator), cost_of_poverty_inputs.json (the external
  inputs to Table B23, each marked as needing checking), scripts/ (stdlib Python; run against a copy of the
  paper's supplementary folder, which is not in this repository) and
  runs/ (per-configuration outputs; fiscal.json holds the fiscal paths).
- model/scripts/optionb_zero.py: the zero-poverty costing (Table B22): an
  exact top-up, a top-up for families with children, a tapered top-up and a
  universal payment, each sized to the relative line it produces. Run
  runs/run_zero.sh, then optionb_report.py.
- calculator-src/: the calculator's source (template.html, ui-1.js to
  ui-5.js, model.js, data.json, optionb_data.js, build.js) and calc_sync.js.
  These are the scripts/ folder of the build layout, which expects
  ../optionb/model/ and ../optionb/paper_optionb.md beside it.
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

## Keeping the calculator in step with the paper

The calculator is outside the rubric's review loop (rubric v3.3, section G).
Whenever a metric or measure in the paper changes, rebuild it from the same
model outputs the paper is written from:

    node calc_sync.js --apply   # rebuild, reproduction check, then compare
    node calc_sync.js           # check only; exits 1 and lists differences

A paper change is not finished while the check reports the calculator out of
sync.

## Cost of poverty evidence

evidence_cost_of_poverty_2026-11-03.md is the research note behind Section
2's estimate of what poverty costs (sources S275 to S295). No source could be
opened from the build environment, so every figure in it comes from search
results or published summaries and needs checking before submission.

## Funding options beyond the five taxes

model/scripts/affordability_options.py costs four added revenue measures (the
capital gains discount, rental losses, a land levy and an estate duty), a child
top-up and a resource fund on P*'s funding rule. It reads runs/fiscal.json and
model/affordability_inputs.json and needs no supplementary folder. It writes
model/affordability_results.md and runs/affordability.json. The added measures
are the author's arithmetic on Treasury, ABS and Productivity Commission
figures, not PBO costings, and nothing in the paper uses them yet. The estate
duty rests on a 2018 total taken from press coverage, which needs checking.
