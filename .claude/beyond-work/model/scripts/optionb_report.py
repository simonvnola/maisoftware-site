"""optionb_report.py: writes optionb_facts.json (machine-readable: every number with its unit, year(s), source script and table) and
optionb_results.md (tables in the paper's style) from runs/*.json (optionb_hh.py, one per household configuration) and runs/fiscal.json
(optionb_fiscal.py). Also computes the trial work-effort cap at OpenResearch's revised 3.9-point participation fall with the paper's own
trial design (partF_r8.py L1: 3,000 treated, 6,000 controls, the cap binds if the estimated fall exceeds 3 points and the lower end of its 90%
interval exceeds 1 point; normal approximation). Run: python3 -I optionb_report.py. Stdlib only."""
import glob, json, os
from statistics import NormalDist

ROOT = os.path.dirname(os.path.abspath(__file__))
FIS = json.load(open(os.path.join(ROOT, "runs", "fiscal.json")))
REV28_ = FIS["rev28"]
RUNS = {}
for fn in sorted(glob.glob(os.path.join(ROOT, "runs", "*_*.json"))):
    j = json.load(open(fn))
    if "design" in j:
        RUNS[f"{j['cal']}_{j['seed']}"] = j
CEN = RUNS["central_20261016"]
Y = list(FIS["p1_rows"])
DN = dict(p1="Part 1 alone", star_m2="P* (re-costed; recommended)", star_m1="P* with automatic enrolment (re-costed)", star="P* as printed (Table 5.4i)",
          pkg="Targeted package (Table 5.4i)", pkg_ie="Targeted package (Table 5.4i)")
HK = dict(p1="p1", star_m2="star_m2", star_m1="star_m1", star="star", pkg="pkg_ie")
SRC_HH, SRC_F = "optionb_hh.py (runs/<cal>_<seed>.json)", "optionb_fiscal.py (runs/fiscal.json)"
FACTS = {}
HREL = {}


def fact(key, value, unit, years, source, note=None, provisional=False):
    FACTS[key] = dict(value=value, unit=unit, years=years, source=source, **({"note": note} if note else {}), **({"provisional": True} if provisional else {}))
    return value


f1 = lambda x: "–" if x is None else f"{x:,.1f}".replace("-", "−")
f2 = lambda x: "–" if x is None else f"{x:,.2f}".replace("-", "−")
f0 = lambda x: "–" if x is None else f"{x:,.0f}".replace("-", "−")
pc_ = lambda x: f"{100 * x:.0f}%"
rg = lambda a, f=f1: f"{f(a[0])} to {f(a[1])}"
L = []
A = L.append


def table(title, hdr, rows, note):
    A(f"**{title}**\n")
    A("| " + " | ".join(hdr) + " |")
    A("|" + "|".join(["---"] + ["---:"] * (len(hdr) - 1)) + "|")
    for r in rows:
        A("| " + " | ".join(str(c) for c in r) + " |")
    A(f"\n*{note}*\n")


A("# Option B: model results for the rewrite (31 October 2026)\n")
A("All figures from the paper's own model (supplementary folder of 22 October, unchanged, run in a copy) and the option B scripts in this folder "
  "(optionb_hh.py, optionb_fiscal.py, optionb_report.py). Stage 1 continuing, no dividend, no wealth tax, no fund; the five taxes to the durable "
  "account under Part 1 alone's rule (Table 6.1e). A$ nominal unless stated. 'Provisional' marks a figure resting on an assumption made here.\n")

# ======================================================================================================================
# 0. The re-costing of P*
# ======================================================================================================================
c = CEN
A("## 0. First, a correction: P* as printed is not at Part 1 alone's budget\n")
exc = c["excess_paper"]
fact("pstar_printed_excess_2028_29", exc, "A$bn", "2028-29", SRC_HH + "; " + SRC_F,
     "P* as printed (household_r13.py: per-child A$6,973, with automatic enrolment) costs this much more than Part 1 alone on the fiscal model's basis")
A(f"household_r13.py solved P*'s per-child amount so that its household-cash family cost, plus the floor, automatic enrolment and Rent Assistance, "
  f"equalled Part 1's *fiscal* net cost (A${c['budget']:.1f}bn). The fiscal model costs Part 1's child payment from the PBO's FTB path (A$18.6bn of FTB "
  f"replaced) plus the household model's rule flows, including the prior-year timing cost (A$2.1bn plus the A$0.8bn income-fall review); the household "
  f"model's own current FTB is A$23.2bn. So the printed P* was given the A$3.1bn by which the household model under-costs the child payment against the "
  f"fiscal model, and was not charged its own prior-year timing. On the fiscal model's basis it costs **A${exc:.1f}bn more than Part 1 in 2028-29** "
  f"(A${c['excess_paper_noae']:.1f}bn excluding the A${c['ae28']:.1f}bn of enrolment, which Part 1 alone's fiscal path does not carry). Re-costed at Part 1's "
  f"cost on the fiscal basis, the per-child amount is **A${c['D']['m2']:,.0f}** without enrolment (the plan's P*: floor, child payment without the supplement-only "
  f"schedule, Rent Assistance +75%) and **A${c['D']['m1']:,.0f}** with enrolment, against A${c['D']['paper']:,.0f} as printed. "
  "Everything below uses the re-costed P* (without enrolment) as the recommended Stage 1, and shows the printed P* only for comparison.\n")
fact("pstar_per_child", c["D"]["m2"], "A$ a year per child", "2028-29", SRC_HH, "P* re-costed at Part 1 alone's fiscal cost, no enrolment", provisional=True)
fact("pstar_m1_per_child", c["D"]["m1"], "A$ a year per child", "2028-29", SRC_HH, "P* re-costed with automatic enrolment")
fact("pstar_printed_per_child", c["D"]["paper"], "A$ a year per child", "2028-29", "household_r13.py (reproduced)")
fact("part1_supplement_per_child", c["design"]["p1"]["D"], "A$ a year per child", "2028-29", "partc.m.child_rate")

# ======================================================================================================================
# 1. Fiscal paths
# ======================================================================================================================
A("## 1. Fiscal paths, 2028-29 to 2045-46\n")
FU, PA = FIS["funds"], FIS["paths"]
for d in ("star_m2", "p1", "pkg"):
    rows = []
    for r in FU[d]["rows"]:
        fy = r["fy"]
        rv = FIS["rev"][fy]
        rows.append([fy, f1(r["net"]), f"{r['pct']:.2f}%", f1(rv["super"]), f1(rv["ept"]), f1(rv["min"]), f1(rv["prrt"]), f1(rv["fossil"]), f"**{f1(r['rev'])}**",
                     f"**{f1(r['margin'])}**", f1(r["interest"]), f1(r["used"]), f1(r["levy"]), (f"{100 * r['rate']:.2f}%" if r["levy"] > 1e-9 else "–"),
                     f"**{f1(r['bal'])}**", f1(r["ucb"]), f1(r["nd"])])
    tot = lambda k: sum(r[k] for r in FU[d]["rows"])
    rows.append(["**2028-29 to 2045-46**", f1(tot("net")), "", "", "", "", "", "", f"**{f1(tot('rev'))}**", f"**{f1(tot('margin'))}**", f1(tot("interest")), f1(tot("used")),
                 f"**{f1(tot('levy'))}**", "", "", "", ""])
    n = {"star_m2": "B1", "p1": "B2", "pkg": "B3"}[d]
    table(f"Table {n}. {DN[d]}: net cost, the five taxes, the start-up advance, the surpluses kept and the levy, every year, 2028-29 to 2045-46 (A$ billion, nominal; per cent)",
          ["Year", "Net cost", "Net cost (% of GDP)", "Superannuation above the cap", "Excess profits tax", "Coal and minerals", "PRRT and offshore royalty", "Fossil-fuel measures",
           "**Five taxes**", "**Margin**", "Interest (+ earned, − paid)", "Kept surpluses drawn down", "Levy", "Levy (% of market income)", "**Balance, 30 June**",
           "Cash balance against baseline", "Net debt against baseline"], rows,
          f"Source: {SRC_F}. Method: net cost from the fiscal model (Part 1: partc.design_c plus implementation, Table F4-102 reproduced); " +
          {"star_m2": "P* = Part 1 + k × (P*'s household rule flows − Part 1's: static, prior-year timing, taper response, income effect) + Rent Assistance +75%; per-child amount A$" + f"{c['D']['m2']:,.0f}" + " indexed with the child supplement; Rent Assistance on the household model's rents. Funding by Part 1 alone's rule. PROVISIONAL: rests on the re-costing in section 0 and the Rent Assistance path.",
           "p1": "Table 6.1d/6.1e reproduced exactly.",
           "pkg": "package = Part 1's floor part + enrolment + Rent Assistance +75% + earned-income credit + k × (FTB A increment + its taper response + income effect) + the credit's response; increment and its test CPI-indexed, the credit's parameters wage-indexed (ASSUMPTION). PROVISIONAL."}[d])
    s = FU[d]
    pre = {"star_m2": "pstar", "p1": "part1", "pkg": "package"}[d]
    fact(f"{pre}_net_cost_by_year", {r["fy"]: round(r["net"], 3) for r in s["rows"]}, "A$bn nominal", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_net_cost_pct_gdp_by_year", {r["fy"]: round(r["pct"], 3) for r in s["rows"]}, "% of GDP", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_levy_by_year", {r["fy"]: round(r["levy"], 3) for r in s["rows"]}, "A$bn nominal", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_levy_rate_by_year", {r["fy"]: round(100 * r["rate"], 3) for r in s["rows"]}, "% of market income", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_balance_by_year", {r["fy"]: round(r["bal"], 3) for r in s["rows"]}, "A$bn at 30 June (− advance outstanding, + surpluses kept)", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_net_debt_vs_baseline_by_year", {r["fy"]: round(r["nd"], 3) for r in s["rows"]}, "A$bn at 30 June", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_ucb_vs_baseline_by_year", {r["fy"]: round(r["ucb"], 3) for r in s["rows"]}, "A$bn", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_advance_2028_29", s["advance"], "A$bn (borrowing)", "2028-29", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_advance_repaid_by", s["repaid"], "first 30 June with a non-negative balance", "2028-29 to 2045-46", SRC_F)
    fact(f"{pre}_first_levy", s["first"], "financial year", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_levies_total", s["total"], "A$bn nominal, sum", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_peak_levy", dict(bn=s["peak_bn"], pct_market_income=100 * s["peak_rate"]), "A$bn; % of market income", "2028-29 to 2045-46", SRC_F, provisional=(d != "p1"))
    fact(f"{pre}_peak_surplus_kept", dict(bn=s["peak_bal"], at_30_june_of=s["peak_bal_fy"]), "A$bn", "2028-29 to 2045-46", SRC_F)
fact("five_taxes_by_year", {fy: {k: round(v, 3) for k, v in FIS["rev"][fy].items()} for fy in Y}, "A$bn nominal", "2028-29 to 2045-46", "partc.stack_by_measure via " + SRC_F)

# P* tracking Part 1
rows = []
for fy in Y:
    p = FIS["pieces"][fy]
    rows.append([fy, f1(PA["p1"][fy]), f1(p["child_p1"]), f1(p["child_star_m2"]), f1(p["cra"]), f1(PA["star_m2"][fy]), f2(PA["star_m2"][fy] - PA["p1"][fy]),
                 f1(FIS["paths_cra_fiscal"]["star_m2"][fy]), f2(FIS["paths_cra_fiscal"]["star_m2"][fy] - PA["p1"][fy]), f1(PA["star"][fy]), f1(PA["pkg"][fy])])
table("Table B4. How P*'s cost tracks Part 1 alone's: the child payment, Rent Assistance +75% and net cost every year, 2028-29 to 2045-46 (A$ billion, nominal)",
      ["Year", "Part 1 alone: net cost", "Part 1: child payment (net of FTB replaced)", "P*: child payment", "P*: Rent Assistance +75% (household rents)", "**P*: net cost**",
       "**P* less Part 1**", "P*: net cost, Rent Assistance on the fiscal model's CPI x population path", "P* less Part 1 on that path", "Memo: P* as printed", "Memo: targeted package"], rows,
      "Source: " + SRC_F + ". Method: P*'s per-child amount is set so that 2028-29 matches Part 1 (the small 2028-29 gap is the fiscal-household scale factor k = 0.990); "
      "it then moves with the child supplement (wages), while Rent Assistance +75% follows its CPI-indexed rates against the household model's rents (which grow with "
      "incomes, so more renters reach the maximum rate) or, in the alternative column, the fiscal model's CRA path (CPI and 1.2% population growth). PROVISIONAL.")
fact("pstar_less_part1_by_year", {fy: round(PA["star_m2"][fy] - PA["p1"][fy], 3) for fy in Y}, "A$bn", "2028-29 to 2045-46", SRC_F,
     "Rent Assistance on the household model's rents", provisional=True)
fact("pstar_less_part1_by_year_cra_fiscal_path", {fy: round(FIS["paths_cra_fiscal"]["star_m2"][fy] - PA["p1"][fy], 3) for fy in Y}, "A$bn", "2028-29 to 2045-46", SRC_F,
     "Rent Assistance on the fiscal model's CPI x population path", provisional=True)

rows = []
for d in ("star_m2", "star_m1", "p1", "pkg", "star"):
    s, s2 = FU[d], FIS["funds_cra_fiscal"][d]
    rows.append([DN[d], f1(PA[d]["2028-29"]), f"{100 * PA[d]['2028-29'] / FIS['p1_rows']['2028-29']['gdp']:.2f}%", f1(PA[d]["2045-46"]), f1(sum(PA[d].values())),
                 f1(s["advance"]), s["repaid"], s["first"] or "none", f1(s["total"]), f"{f1(s['peak_bn'])}; {100 * s['peak_rate']:.2f}%", f"{f1(s['peak_bal'])} ({s['peak_bal_fy']})",
                 f"{100 * FIS['be_yield'][d]:.1f}%", f"{s2['first'] or 'none'}; {f1(s2['total'])}"])
table("Table B5. The recommended Stage 1 and its comparators on Part 1 alone's funding rule: summary, 2028-29 to 2045-46 (A$ billion; per cent)",
      ["Design", "Net cost 2028-29", "% of GDP", "Net cost 2045-46", "Net cost, 2028-29 to 2045-46", "Start-up advance (borrowing), 2028-29", "Advance repaid by 30 June",
       "First levy", "Levies to 2045-46", "Largest levy: A$bn; % of market income", "Largest balance kept (30 June)", "Five taxes' yield needed for no levy before 2044-45",
       "Rent Assistance on the fiscal model's path: first levy; levies"], rows,
      "Source: " + SRC_F + ". Method: Part 1 alone's rule (Table 6.1e): the advance is repaid with interest at 4.13%, surpluses are kept as debt reduction and drawn down, "
      "and a negative balance after 2031-32 is levied. Net debt against baseline is minus the balance. P* figures PROVISIONAL (section 0); the package's later "
      "years rest on its indexation (ASSUMPTION).")
fact("summary_by_design", {d: dict(net28=PA[d]["2028-29"], net46=PA[d]["2045-46"], advance=FU[d]["advance"], repaid=FU[d]["repaid"], first_levy=FU[d]["first"],
                                   levies=FU[d]["total"], peak_levy_pct=100 * FU[d]["peak_rate"], be_yield_pct=100 * FIS["be_yield"][d]) for d in FU},
     "A$bn; %", "2028-29 to 2045-46", SRC_F, provisional=True)

# ======================================================================================================================
# 2. Robustness: seeds and calibrations
# ======================================================================================================================
A("## 2. Robustness: three seeds and three calibrations\n")
A("The household model has a random seed (household.SEED, which draws the synthetic population, tenure and the enrolment sample) and alternative "
  "calibrations (household_r12.py: full-rate pensioners' other income 25% lower, the variant nearest DSS data; and the FTB-consistent calibration, "
  "parents' tilt 1.7). Each configuration is re-calibrated to ACOSS–UNSW's 14.2% and re-solves every design at Part 1 alone's budget. Seeds: 20261016 (the "
  "paper's), 20261029 and 20261031.\n")
KEYS = ("rel", "u15", "old", "opf", "dsp", "n_rel", "lift_rel", "new_rel")
rows, WEAK = [], []
ROB = {}
for nm, j in RUNS.items():
    H = j["design"]
    fz = FIS["configs"][nm]
    for d in ("p1", "star_m2", "pkg_ie", "star_m1", "star"):
        h = H[d]
        rows.append([nm.replace("_", ", seed "), DN[d], f2(h["base_rel"]), f2(h["rel"]), f2(h["anch"]), f2(h["u15"]), f2(h["old"]), f2(h["opf"]), f1(h["dsp"]), f2(h["n_rel"]),
                     f2(h["lift_rel"]), f2(h["new_rel"]), f1(h["gain_hh"]), f"{fz[HK.get(d, d) if d != 'pkg_ie' else 'pkg']['first'] or 'none'}"])
    # P* against Part 1, every group, and the net benefit against Part 1 (complete accounting, own costs on this configuration)
    p1, st, pk = H["p1"], H["star_m2"], H["pkg_ie"]
    better = {k: st[k] < p1[k] for k in ("rel", "anch", "u15", "old", "opf", "dsp", "n_rel")}
    better["new_rel"] = st["new_rel"] <= p1["new_rel"]
    better["lift_rel"] = st["lift_rel"] >= p1["lift_rel"]
    k28 = FIS["p1_rows"]["2028-29"]["k"]
    cas = j["fe28"]["caseload"]
    own_p1 = cas + k28 * (j["flows_p1"]["bh"] + j["flows_p1"]["inc"])
    own_st = cas + k28 * (j["flows_m2"]["bh"] + j["flows_m2"]["inc"])
    own_pk = cas + pk["own"]["resp"] + pk["own"]["ie"]
    meb = FIS["meb"]
    red = lambda h: h["gap_base"] - h["gap_rel"]

    def nbv(h, own, dcost):
        dG, dF = red(h) - red(p1), own - own_p1
        return (0.5 * dG - dF - meb[1] * dcost, dG - 0.5 * dF - meb[0] * dcost)
    nb_st = nbv(st, own_st, fz["star_m2"]["net28"] - fz["p1"]["net28"])
    nb_pk = nbv(pk, own_pk, fz["pkg"]["net28"] - fz["p1"]["net28"])
    ROB[nm] = dict(star_beats_p1=better, all_groups=all(better.values()), nb_star_vs_p1=nb_st, nb_pkg_vs_p1=nb_pk,
                   pkg_beats_star={k: pk[k] < st[k] for k in ("rel", "u15", "old", "opf", "dsp")},
                   fiscal={d: dict(first=fz[d]["first"], total=fz[d]["total"], net28=fz[d]["net28"]) for d in ("p1", "star_m2", "pkg", "star_m1", "star")}, D=j["D"])
    if not all(better.values()) or nb_st[0] < 0:
        WEAK.append((nm, [k for k, v in better.items() if not v], nb_st))
table("Table B6. Poverty after housing costs at Part 1 alone's budget across seeds and calibrations, Stage 1, 2028-29 (per cent; million people)",
      ["Configuration", "Design", "Before (relative)", "**All persons, relative**", "All persons, anchored", "Children under 15", "Aged 67 and over", "Sole-parent households",
       "People in DSP-reliant households", "Persons in poverty (million)", "Lifted above the relative line (million)", "Newly below (million)", "Households gaining (%)",
       "First levy on this configuration"], rows,
      "Source: " + SRC_HH + " and " + SRC_F + ". Method: household.pov_both (relative line = 50% of the post-reform median; anchored = the baseline line); each configuration "
      "re-calibrated; P* re-costed at Part 1 alone's fiscal cost in each configuration; the package charged the 16-cent income effect (Table 5.4i's). Fiscal path: Part 1's own "
      "rule flows and each design's on that configuration, scaled as partc.cs_rule_adj does.")
rows = []
for nm, r in ROB.items():
    rows.append([nm.replace("_", ", seed "), "yes" if r["all_groups"] else "NO: " + ", ".join(k for k, v in r["star_beats_p1"].items() if not v), rg(r["nb_star_vs_p1"]), rg(r["nb_pkg_vs_p1"]),
                 f0(r["D"]["m2"]), "yes" if all(r["pkg_beats_star"].values()) else "no"])
table("Table B7. Does P* still beat Part 1 alone? Every poverty group and the first-year net benefit against Part 1 (complete accounting), by configuration, 2028-29 (A$ billion a year)",
      ["Configuration", "P* below Part 1 in every group (all, anchored, children, 67+, sole parents, DSP-reliant, persons; lifted not fewer, newly below not more)",
       "**P* less Part 1: net benefit, complete accounting**", "Package less Part 1: net benefit, complete accounting", "P*'s per-child amount (A$)", "Package below P* in every group shown"], rows,
      "Source: " + SRC_HH + ". Method: Table F4-100's complete accounting (low = ½ × gap reduction − own behavioural costs, high = gap reduction − ½ × own costs, each against "
      "Part 1), plus any difference in fiscal cost at the five taxes' excess burden (0.08 to 0.37 a dollar). Own costs: the floor's caseload response (common) and each "
      "design's taper response and income effect in household._e_year_extras' forms (the package: its own forms).")
fact("robustness", ROB, "per configuration: booleans; A$bn a year (net benefit against Part 1, 2028-29)", "2028-29", SRC_HH)
fact("robustness_poverty", {nm: {d: {k: j["design"][d][k] for k in ("rel", "anch", "u15", "old", "opf", "dsp", "n_rel", "lift_rel", "new_rel", "gain_hh", "base_rel")}
                                for d in ("p1", "star_m2", "star_m1", "star", "pkg_ie", "pkg")} for nm, j in RUNS.items()},
     "% (rates); million (persons)", "2028-29", SRC_HH)

# ======================================================================================================================
# 3. After-housing losers
# ======================================================================================================================
A("## 3. Current recipients worse off after housing costs\n")
GL = ["All recipient households", "Disability Support Pension", "Age Pension", "Age Pension (private renter)", "Age Pension (other tenure)", "Carer Payment",
      "JobSeeker, Youth Allowance (other), Special Benefit", "Youth Allowance (student), Austudy, ABSTUDY", "Parenting Payment"]
rows = []
for g in GL:
    r0 = CEN["housing_losers"]["p1"]["groups"][g]
    row = [g, f2(r0["hh_m"])]
    for d in ("p1", "star_m2", "pkg_ie", "star"):
        r = CEN["housing_losers"][d]["groups"][g]
        row += [f"{f2(r['worse_hh_m'])} ({r['worse_share']:.0f}%)", f2(r["worse_people_m"]), f0(r["avg_loss"])]
    rows.append(row)
table("Table B8. Households on current payments worse off after the rent and interest-rate effects, by main payment: central scenario, Stage 1, 2028-29 (million; per cent; A$ a year)",
      ["Household's main current payment", "Households (million)"] + sum([[f"{DN[d]}: households worse off (share)", "people (million)", "average loss (A$ a year)"] for d in ("p1", "star_m2", "pkg_ie", "star")], []),
      rows, "Source: " + SRC_HH + ". Method: household.scenario (Tables 6.30/6.31): 45 basis points on variable mortgages and the mid-point of the rent pass-through range "
      "(6.6% to 32.4% of private renters' gains within each quintile, in proportion to rent; public rents 25 cents per dollar of gain); each design's own first-round gain, so "
      "Rent Assistance rises are themselves partly passed into rents. Worse off = first-round gain less higher repayments and rent below −A$1. Recipient household = any member "
      "on a current payment; grouped by the member's largest payment. The rule protects payments under today's rules, not income after housing costs.")
for d in ("p1", "star_m2", "star_m1", "star", "pkg_ie"):
    g = CEN["housing_losers"][d]["groups"]
    fact(f"after_housing_losers_{d}", {k: dict(hh_m=v.get("worse_hh_m"), people_m=v.get("worse_people_m"), share=v.get("worse_share"), avg_loss=v.get("avg_loss"),
                                               high_scenario_share=v.get("worse_hi_share")) for k, v in g.items()},
         "million households; million people; % of the group's households; A$ a year", "2028-29", SRC_HH + " (household.scenario, central case)")
    fact(f"after_housing_poverty_anchored_{d}", CEN["housing_losers"][d]["ahc_pov"], "% of persons on the baseline (anchored) line; A$bn gap", "2028-29", SRC_HH + " (household.scenario_poverty)")
rows = []
for d in ("p1", "star_m2", "pkg_ie"):
    hl = CEN["housing_losers"][d]
    if "ahc_pov_relative" not in hl:
        continue
    fr = CEN["design"][d]
    HREL[d] = dict(first_round=dict(all=fr["rel"], u15=fr["u15"], old=fr["old"], opf=fr["opf"], n_rel=fr["n_rel"]), **hl["ahc_pov_relative"])
    for lab in ("first_round", "low", "central", "high"):
        v = HREL[d][lab]
        rows.append([DN[d], {"first_round": "First round (no rent or rate effects)", "low": "Low (15 bp, low pass-through)", "central": "**Central (45 bp, mid pass-through)**",
                             "high": "High (90 bp, high pass-through)"}[lab], f2(v["all"]), f2(v["u15"]), f2(v["old"]), f2(v["opf"]), f2(v["n_rel"]),
                     (f2(v["anch_all"]) if "anch_all" in v else f2(fr["anch"]))])
if rows:
    table("Table B8a. Poverty after housing costs on the relative line after the rent and interest-rate scenario: Part 1, P* and the package, Stage 1, 2028-29 (per cent; million)",
          ["Design", "Case", "All persons, relative", "Children under 15", "Aged 67 and over", "Sole-parent households", "Persons in poverty (million)", "All persons, anchored"], rows,
          f"Source: {SRC_HH}. Method: household.scenario's rate and rent effects on each design's own gain (Table 6.30's cases); relative line = 50% of the post-scenario "
          "median (household.pov_both), anchored = the baseline line (Table 6.31's second figure). Part 1's central case reproduces Table 6.31's 11.7% / 10.2%.")
    fact("poverty_after_housing_scenario_relative", HREL, "% of persons; million", "2028-29", SRC_HH + " (household.scenario + household.pov_both)")
p1l, stl = CEN["housing_losers"]["p1"]["groups"]["All recipient households"], CEN["housing_losers"]["star_m2"]["groups"]["All recipient households"]
REMOVED = 1 - stl["worse_hh_m"] / p1l["worse_hh_m"]
fact("pstar_removes_share_of_after_housing_losers", 100 * REMOVED, "% of Part 1's recipient households worse off after housing", "2028-29", SRC_HH)

# ======================================================================================================================
# 4. Joint stress test
# ======================================================================================================================
A("## 4. Joint stress test of the funding\n")
rows = [[k, v[3] if v[0] == "triangular" else "; ".join(f"{a} {b:.0%}" for a, b in zip(v[1], v[2])), (f"triangular({v[1]}, {v[2]}, {v[3]})" if v[0] == "triangular" else "discrete")]
        for k, v in FIS["dist"].items()]
A("Distributions (each from the paper's own tested range; independent draws; 4,000 draws, seed 20261031):\n")
for k, v in FIS["dist"].items():
    A(f"- **{k.rstrip('_')}**: " + (f"triangular, low {v[1]}, mode {v[2]}, high {v[3]}: {v[4]}" if v[0] == "triangular" else f"{v[3]}"))
A("")
rows = []
MC = FIS["mc"]
for d in ("star_m2", "p1", "pkg", "star_m1", "star"):
    m_ = MC["main"][d]
    rows.append([DN[d], pc_(m_["p_before_2044_45"]), pc_(m_["p_before_2034_35"]), pc_(m_["p_any_to_2045_46"]), m_["p10"], m_["p50"], m_["p90"],
                 f"{pc_(MC['no_ai'][d]['p_before_2044_45'])} / {pc_(MC['no_ai'][d]['p_before_2034_35'])}",
                 f"{pc_(MC['symmetric'][d]['p_before_2044_45'])} / {pc_(MC['symmetric'][d]['p_before_2034_35'])}",
                 f"{pc_(MC['yield_only'][d]['p_before_2044_45'])} / {pc_(MC['yield_only'][d]['p_before_2034_35'])}"])
table("Table B9. Joint stress test: the chance of a levy and the first levy year, 2028-29 to 2045-46 (per cent of draws; financial year)",
      ["Design", "**Levy before 2044-45**", "**Levy before 2034-35**", "Any levy to 2045-46", "First levy: 10th percentile", "Median", "90th percentile",
       "No AI displacement: before 2044-45 / 2034-35", "Symmetric draws only (yield, behaviour, calibration; no overrun, PBO floor or AI): before 2044-45 / 2034-35",
       "Tax yield alone: before 2044-45 / 2034-35"], rows,
      "Source: " + SRC_F + ". Method: per-year deltas from the fiscal model's own runs at the tested points (caseload 0.21/0.56, taper elasticity 0.1/0.4, floor x1.34, the two "
      "displacement scenarios), interpolated linearly and added (ASSUMPTION: additivity); P*'s and the package's taper and income-effect lines scaled in proportion to Part 1's; "
      "Part 1 alone's rule. The first-levy distribution is bimodal: an advance not repaid by 30 June 2032 is levied at once in 2032-33, so 2032-33 is the most common first "
      "year. PROVISIONAL: the distributions' shapes, the independence of the draws and the AI-path probabilities are assumptions.")
fact("stress_test", {k: v for k, v in MC.items()}, "share of draws; financial year", "2028-29 to 2045-46", SRC_F, provisional=True)
fact("stress_test_distributions", FIS["dist"], "as stated", "2028-29 to 2045-46", SRC_F)
fact("break_even_yield_no_levy_before_2044_45", {d: 100 * v for d, v in FIS["be_yield"].items()}, "% of the costings", "2028-29 to 2045-46", SRC_F)

# ======================================================================================================================
# 5. Distributional weights
# ======================================================================================================================
A("## 5. Break-even distributional weights and the Green Book\n")
AP = FIS["appraisal"]
rows = []
for d in ("star_m2", "p1", "pkg", "star_m1", "star"):
    a = AP[d]
    eps = a["eps_breakeven"]
    rows.append([DN[d], f1(a["cost28"]), f2(a["gap_red_rel"]), f1(a["own"]), rg(a["nb634"]), rg(a["nb_complete"]), rg(a["nb_complete_adv"]),
                 rg(a["w_breakeven_634"], f2), rg(a["w_breakeven_complete"], f2), rg(a["w_breakeven_complete_adv"], f2), rg(a["gb13"]), rg(a["gb13_first_year_taxes"]),
                 ("none" if eps[0] is None else f2(eps[0])) + " to " + ("none" if eps[1] is None else f2(eps[1])), "–" if d == "p1" else rg(a["nb_vs_p1_complete"])])
table("Table B10. First-year net benefit, the break-even weight on gains to households in poverty, and the Green Book's weights, Stage 1, 2028-29 (A$ billion a year; weight)",
      ["Design", "Fiscal cost 2028-29", "Household poverty gap reduction (relative line)", "Own behavioural costs", "Net benefit, Table 6.34's method (weights 1.5 to 2.0)",
       "Net benefit, complete accounting", "Same, start-up advance charged", "**Break-even weight, Table 6.34's method**", "**Break-even weight, complete accounting**",
       "Same, advance charged", "**Green Book weights (elasticity 1.3): net benefit, full cost financed**", "Green Book, first-year taxes only (A$41.3bn)",
       "Break-even inequality aversion (elasticity), full cost", "Complete accounting against Part 1"], rows,
      "Source: " + SRC_F + " and " + SRC_HH + ". Method: Table 6.34's net benefit = (w − 1) × the household poverty-gap reduction − implementation − the five taxes' excess "
      "burden (A$3.3bn to A$15.3bn; extra cost above Part 1 at the same rate); the complete accounting also counts own behavioural costs at 1 (low) and ½ (high). The break-even "
      "weight is the w at which each bound reaches zero: the range runs from the high case's assumptions to the low case's. Green Book (2022, Annex A3): weights (median / "
      "quintile mean equivalised disposable income)^1.3 on every household cash flow, the design's whole 2028-29 cost (taxes and the advance) borne as the central allocation "
      "of the five taxes, plus excess burden at 0.08 to 0.37 a dollar weighted the same way; the first-year-taxes column charges only the 2028-29 taxes (the paper's "
      "single-year convention, which leaves the advance uncharged). The break-even elasticity is where the full-cost Green Book net benefit is zero (low to high excess "
      "burden). PROVISIONAL: the quintile weighting and the cost allocation are choices made here.")
fact("appraisal", AP, "A$bn a year; weights", "2028-29", SRC_F, provisional=True)

# ======================================================================================================================
# 6. The calculator: the five taxes by decile; reach after funding
# ======================================================================================================================
A("## 6. For the calculator: each household's share of the five taxes, and who is better off after funding\n")
TB = CEN["tax_by_hdec"]
rows = [[r["decile"], (f0(r["upper_equiv_disp_income"]) if r["upper_equiv_disp_income"] else "–"), f2(r["hh_m"]), f2(r["adults_per_hh"]), f0(r["central"]), f0(r["low"]),
         f0(r["high"]), f"{r['low_var']} / {r['high_var']}", f0(r["per_adult_central"]), f1(r["share_central"])] +
        [f0(r["variants"][k]) for k in ("half_ept", "two_thirds", "fuel", "conc50", "conc25")] for r in TB["rows"]]
table("Table B11. The five taxes borne per household by decile of equivalised household income, central and incidence range, 2028-29 (A$ a year; per cent)",
      ["Decile (household equivalised disposable income, current rules)", "Upper bound (A$ a year, equivalised)", "Households (million)", "Adults per household",
       "**Central (Table 6.24a's rule)**", "**Low**", "**High**", "Low / high variant", "Central, per adult", "Share of the five taxes (%)",
       "Half the excess profits tax on wages", "Two-thirds of company-type taxes on wages", "Fossil-fuel measure on petrol spending",
       "Capital taxes concentrated (50% hold capital)", "Capital taxes concentrated (25%)"], rows,
      f"Source: {SRC_HH} (household model, central calibration). Method: the five taxes of 2028-29 (A${TB['five_taxes_bn']:.1f}bn) allocated to adults by Table 6.24a's rule "
      "(each adult-income decile's share spread equally; superannuation on the top decile; company-type measures by the PBO's capital-gains shares) and by Table F4-104's variants; "
      "households then ranked by equivalised current-rules disposable income (modified OECD scale). Low and high are the smallest and largest of the six allocations for that "
      "decile. To scale to another year multiply by that year's five taxes over A$41.3bn (Table B1). The design does not change who pays: the same taxes fund every Stage 1 design.")
fact("calculator_tax_by_decile", TB, "A$ a year per household (and per adult), 2028-29 dollars", "2028-29", SRC_HH)
fact("five_taxes_by_year_for_scaling", {fy: FIS["rev"][fy]["total"] for fy in Y}, "A$bn nominal", "2028-29 to 2045-46", SRC_F)
R_ = CEN["reach"]
rows = []
for d in ("star_m2", "p1", "pkg_ie", "star"):
    r = R_[d]
    vals = [r[v]["a1"]["hh_better"] for v in ("central", "half_ept", "two_thirds", "fuel", "conc50")]
    rows.append([DN[d], f1(r["before"]["hh"]), f1(r["before"]["hh_5pw"]), f1(r["central"]["a1"]["hh_better"]), f1(r["central"]["a5pw"]["hh_better"]),
                 f1(r["central"]["a1"]["adults_individual_better"]), f1(r["central"]["a5pw"]["adults_individual_better"]), f1(r["central"]["a1"]["adults_in_hh_better"]),
                 f1(r["central"]["a5pw"]["adults_in_hh_better"]), f"{min(vals):.1f} to {max(vals):.1f}"])
table("Table B12. Reach before and after funding, at any gain and at A$5 a week, Stage 1, 2028-29 (per cent)",
      ["Design", "Households gaining before funding", "Gaining A$5 a week or more", "**Households better off after funding**", "Better off by A$5 a week or more",
       "**Adults better off after funding (own share)**", "Same, A$5 a week or more", "Adults in households better off", "Same, A$5 a week or more",
       "Households better off across incidence variants"], rows,
      f"Source: {SRC_HH}. Method: each household's first-round gain less its central allocation of the five taxes (2028-29); 'own share' gives each adult an equal share of the "
      "household's gain less the taxes allocated to that adult; threshold A$1 a year or A$260 a year (A$5 a week). The calculator's current 29.0% (adults better off after "
      "funding, Part 1 alone, partF_r10b.py) is on the fiscal model's individual-income units; this household-model measure gives Part 1 "
      f"{R_['p1']['central']['a1']['adults_individual_better']:.1f}%, so the two bases differ by about "
      f"{R_['p1']['central']['a1']['adults_individual_better'] - 28.96:.1f} points; use one basis throughout.")
fact("reach_after_funding", R_, "% of households / adults", "2028-29", SRC_HH)
fact("pstar_adults_better_after_funding", dict(any=R_["star_m2"]["central"]["a1"]["adults_individual_better"], a5pw=R_["star_m2"]["central"]["a5pw"]["adults_individual_better"],
                                                households_any=R_["star_m2"]["central"]["a1"]["hh_better"], households_a5pw=R_["star_m2"]["central"]["a5pw"]["hh_better"]),
     "% of adults / households", "2028-29", SRC_HH + " (household-model basis)", provisional=True)
BA = {}
rows = []
for d in ("star_m2", "p1", "pkg_ie"):
    r = R_[d]
    BA[d] = dict(households=dict(before_any=r["before"]["hh"], before_5pw=r["before"]["hh_5pw"], after_any=r["central"]["a1"]["hh_better"], after_5pw=r["central"]["a5pw"]["hh_better"]),
                 adults=dict(before_any=r["before"]["adults_in_hh"], before_5pw=r["before"]["adults_in_hh_5pw"], after_any=r["central"]["a1"]["adults_in_hh_better"],
                             after_5pw=r["central"]["a5pw"]["adults_in_hh_better"]))
    b = BA[d]
    rows.append([DN[d], f1(b["households"]["before_any"]), f1(b["households"]["after_any"]), f1(b["households"]["before_5pw"]), f1(b["households"]["after_5pw"]),
                 f1(b["adults"]["before_any"]), f1(b["adults"]["after_any"]), f1(b["adults"]["before_5pw"]), f1(b["adults"]["after_5pw"])])
table("Table B12a. Before and after the funding taxes, side by side, one population and one basis (household model): households and adults in households better off, at any gain and at A$5 a week or more, Stage 1, 2028-29 (per cent)",
      ["Design", "**Households: before, any gain**", "**after, any gain**", "Households: before, A$5 a week or more", "after, A$5 a week or more",
       "**Adults: before, any gain**", "**after, any gain**", "Adults: before, A$5 a week or more", "after, A$5 a week or more"], rows,
      f"Source: {SRC_HH}. Method: before = the household's first-round gain; after = that gain less its central allocation of the five taxes (Table 6.24a's rule, 2028-29); "
      "'any gain' = more than A$1 a year, 'A$5 a week' = more than A$260 a year (and, after funding, the same threshold on the net). Adults are counted by their household's "
      "result, so before and after use the same population and basis. Not comparable with the calculator's 83% / 29.0%, which are the fiscal model's individual-income units.")
fact("reach_before_after_household_basis", BA, "% of households; % of adults (counted by their household's result)", "2028-29", SRC_HH,
     "before = first-round gain > A$1 (or > A$260 a year); after = gain less the central allocation of the five taxes > A$1 (or > A$260)")
fact("part1_adults_better_after_funding_fiscal_basis", 28.96, "% of adults", "2028-29", "partf4_r10b_facts.json summary.none.adult.after (calculator's 29.0%)")

# ======================================================================================================================
# 7. Phased start
# ======================================================================================================================
A("## 7. A phased start: the floor in 2028-29, the child payment from 2029-30\n")
rows = []
for lab, nm in (("star_m2_floor_and_cra", "P*: floor and Rent Assistance +75% in 2028-29, child payment from 2029-30"), ("star_m2_floor_only", "P*: floor only in 2028-29"),
                ("p1_floor_only", "Part 1: floor only in 2028-29"), ("pkg_floor_cra_enrol", "Package: floor, enrolment and Rent Assistance in 2028-29; credit and FTB increment from 2029-30")):
    p = FIS["phased"][lab]
    rows.append([nm, f1(p["net28"]), f1(p["advance"]), f1(p["rows"][0]["bal"]), f1(p["full_start"]["advance"]), p["first"] or "none to 2045-46", p["full_start"]["first"] or "none", f1(p["total"]), f1(p["full_start"]["total"]),
                 f1(next(r["bal"] for r in p["rows"] if r["fy"] == "2031-32"))])
table("Table B13. A phased start: net cost and the advance in 2028-29, and the levy, 2028-29 to 2045-46 (A$ billion)",
      ["Start", "Net cost 2028-29", "**Start-up advance (borrowing)**", "Balance at 30 June 2029 (+ surplus kept)", "Advance with a full start", "**First levy**", "First levy, full start", "Levies to 2045-46", "Levies, full start",
       "Balance at 30 June 2032"], rows,
      "Source: " + SRC_F + ". Method: in 2028-29 families keep current FTB (no child payment cost and no FTB replaced); from 2029-30 the design in full; the five taxes "
      "as costed (their 2028-29 yield, A$41.3bn, exceeds the floor's cost, so the advance becomes a surplus kept). Implementation unchanged. PROVISIONAL for P* (section 0).")
_pz = FIS["pieces"]["2028-29"]
_fm2 = CEN["flows_m2"]
PRICE = dict(budget_saving=FIS["paths"]["star_m2"]["2028-29"] - FIS["phased"]["star_m2_floor_and_cra"]["net28"], child_payment_net_fiscal=_pz["child_star_m2"],
             cash_to_families_net_of_ftb_kept=_pz["k"] * _fm2["S"], gross_child_payments_household=_fm2["S"] + 23.18,
             of_which_timing_and_responses=_pz["k"] * (_fm2["tm"] + _fm2["bh"] + _fm2["inc"]), part1_gross_supplement=FIS["p1_rows"]["2028-29"]["child"])
A(f"**The phased start's price (P*, 2028-29).** Quote the cash families forgo net of the FTB they keep: **A${PRICE['cash_to_families_net_of_ftb_kept']:.1f}bn** "
  f"(P*'s family payments over current FTB, household model, scaled to the fiscal model's children; optionb_hh.py flows_m2.S x k). The budget saving is "
  f"A${PRICE['budget_saving']:.1f}bn (Table B4's P* child payment net of FTB replaced, A${PRICE['child_payment_net_fiscal']:.1f}bn, which also includes prior-year "
  f"timing, the review and the behavioural responses, A${PRICE['of_which_timing_and_responses']:.1f}bn, that are not cash to families, plus the household-fiscal FTB "
  "difference). The earlier 'about A$42bn' was Part 1's gross supplement (Table F4-102's gross cost), the wrong measure for P*; P*'s gross child payments before "
  f"FTB are about A${PRICE['gross_child_payments_household']:.0f}bn in the household model.\n")
fact("phased_start", {k: {kk: vv for kk, vv in v.items() if kk != "rows"} for k, v in FIS["phased"].items()}, "A$bn; financial year", "2028-29 to 2045-46", SRC_F)
fact("phased_start_price_pstar", PRICE, "A$bn, 2028-29", "2028-29", "optionb_fiscal.py pieces['2028-29'] (Table B4); optionb_hh.py flows_m2",
     "quote cash_to_families_net_of_ftb_kept as the price to families; budget_saving as the fiscal saving")

# ======================================================================================================================
# trial cap
# ======================================================================================================================
N = NormalDist()
TR = []
for p0 in (0.6, 0.7, 0.8):
    se = (p0 * (1 - p0) * (1 / 3000 + 1 / 6000)) ** 0.5 * 100
    thr = max(3.0, 1.0 + N.inv_cdf(0.95) * se)
    TR.append(dict(p0=p0, se=se, thr=thr, p39=1 - N.cdf((thr - 3.9) / se), p42=1 - N.cdf((thr - 4.2) / se)))
fact("trial_cap", dict(true_fall_points=3.9, p_bind_by_baseline={str(t["p0"]): round(t["p39"], 3) for t in TR}, range=[round(min(t["p39"] for t in TR), 2), round(max(t["p39"] for t in TR), 2)],
                       at_4_2=[round(min(t["p42"] for t in TR), 2), round(max(t["p42"] for t in TR), 2)],
                       design="3,000 treated, 6,000 controls; cap binds if the estimated fall > 3 points and the lower end of its 90% CI > 1 point (partF_r8.py L1, Table F4-70)",
                       mpe_verdict=("Keep 0.16. The costed labour response is OpenResearch's individual non-transfer income fall per dollar transferred (ubi_model.MPE, "
                                    "[S14]), not the participation effect, so a revision of participation from 4.2 to 3.9 points does not by itself change it. Re-check the income "
                                    "estimate in the revised NBER paper (w32719 rev. 2): nber.org could not be reached from this session, so the income figure was not verified; "
                                    "if it moved roughly in proportion (3.9/4.2), the MPE would be about 0.15 (low 0.05 and high 0.29 cases unchanged)."),
                       mpe_if_proportional=round(0.16 * 3.9 / 4.2, 3)),
     "probability; points", "trial 2029-30 to 2030-31", "optionb_report.py (partF_r8.py L1's formula)")
A("## 8. The trial's work-effort cap at OpenResearch's revised 3.9 points\n")
table("Table B14. Probability the trial trips the 3-point work-effort cap, at a true participation fall of 3.9 points (revised) and 4.2 (as printed) (points; probability)",
      ["Baseline participation", "Standard error (points)", "Estimated fall needed", "**P(cap binds), true fall 3.9**", "P(cap binds), true fall 4.2"],
      [[t["p0"], f2(t["se"]), f2(t["thr"]), f2(t["p39"]), f2(t["p42"])] for t in TR],
      "Source: optionb_report.py, partF_r8.py L1's formula and trial design (Tables 9.6, 9.7, F4-70). So the paper's 0.86 to 0.91 becomes 0.79 to 0.84. The costed labour "
      "response (16 cents a dollar) is an income response, not participation; keep it unless the revision also moved the income estimate (not verifiable from this session).")

# ---- Table B15: Table 6.14g's sensitivity cases on P*
SE = FIS.get("sens", {})
if SE:
    rows = []
    for a, b, k in zip(SE["p1"], SE["star_m2"], SE["pkg"]):
        f5b, f5a = b["five"], a["five"]
        rows.append([b["case"], b["first"] or "none to 2045-46", f1(b["total"]), f"{f1(b['peak_bn'])}; {100 * b['peak_rate']:.2f}%", f"{100 * b['rate46']:.2f}%",
                     f"{f5b['first'] or 'none'}; {f1(f5b['total'])}; {100 * f5b['peak_rate']:.2f}%",
                     f"{a['first'] or 'none'}; {f1(a['total'])}; {100 * a['peak_rate']:.2f}%", f"{f5a['first'] or 'none'}; {f1(f5a['total'])}; {100 * f5a['peak_rate']:.2f}%",
                     f"{k['first'] or 'none'}; {f1(k['total'])}; {100 * k['peak_rate']:.2f}%"])
    A("## 10. P* under the paper's sensitivity cases\n")
    table("Table B15. P* under stress (Table 6.14g's cases): first levy, levies to 2045-46 and the largest levy, with Part 1 alone and the package for comparison, 2028-29 to 2045-46 (A$ billion; per cent of market income)",
          ["Case", "**P*: first levy**", "**P*: levies to 2045-46**", "P*: largest levy (A$bn; % of market income)", "P*: levy in 2045-46 (%)",
           "P*, five-year repayment rule: first levy; levies; largest (%)", "Part 1 alone: first levy; levies; largest (%)",
           "Part 1 alone, five-year rule: first levy; levies; largest (%)", "Package: first levy; levies; largest (%)"], rows,
          "Source: " + SRC_F + ". Method: each case changes one assumption from the central case, as Table F4-106; behavioural and costing cases are the fiscal model's own runs "
          "at the tested values applied as per-year deltas (P*'s and the package's taper and income-effect lines scaled in proportion to Part 1's); calibration cases use the "
          "re-calibrated household runs at seed 20261016. Part 1's column reproduces Table F4-106 in every row except the pensioner calibration (A$38.8bn here against A$49.7bn "
          "printed; A$37.6bn in the paper's noise check), which is the calibration's noise. The paper's noise-check row is not re-run. PROVISIONAL for P*.")
    fact("pstar_sensitivity_cases", SE, "first levy (financial year); A$bn; share of market income", "2028-29 to 2045-46", SRC_F, provisional=True)
# ---- Table B16: P* after funding by decile
if "deciles_after_funding" in CEN:
    DD = CEN["deciles_after_funding"]
    rows = []
    for i in range(10):
        st_, p_, k_ = DD["star_m2"][i], DD["p1"][i], DD["pkg_ie"][i]
        rows.append([i + 1, f0(st_["gain"]), f0(st_["tax"]), f"**{f0(st_['net'])}**", f1(st_["gaining_before"]), f1(st_["better"]), f1(st_["better_5pw"]), f1(st_["worse"]),
                     f0(p_["net"]), f0(k_["net"])])
    table("Table B16. P* by decile of equivalised household income: first-round gain, the five taxes borne, net and the shares better and worse off after funding, Stage 1, 2028-29 (A$ a year per household; per cent)",
          ["Decile", "P*: gain before funding", "Five taxes borne (central allocation)", "**P*: net**", "Gaining before funding (%)", "Better off after funding (%)",
           "Better off by A$5 a week or more (%)", "Worse off after funding (%)", "Memo: Part 1 net", "Memo: package net"], rows,
          f"Source: {SRC_HH}. Method: as Table 6.24a: each household's first-round gain less its central allocation of the 2028-29 five taxes; deciles of current-rules "
          "equivalised disposable income (Table B11's). The taxes are the same for every design. PROVISIONAL for P* (section 0).")
    fact("deciles_after_funding", DD, "A$ a year per household; % of households", "2028-29", SRC_HH, provisional=True)

# ---- Table B17: further measures for P* (coordinator's list)
_ex = os.path.join(ROOT, "runs", "extra.json")
if os.path.exists(_ex):
    EX = json.load(open(_ex))
    E_, S2_, RV_ = EX["emtr"], EX["second"], EX["review"]
    st_, p_ = CEN["design"]["star_m2"], CEN["design"]["p1"]
    sp = [t for t in FIS["sens"]["star_m2"] if "noise check" in t["case"]]
    sp1 = [t for t in FIS["sens"]["p1"] if "noise check" in t["case"]]
    pw = dict(cap39=[round(min(t["p39"] for t in TR), 3), round(max(t["p39"] for t in TR), 3)], cap42=[round(min(t["p42"] for t in TR), 3), round(max(t["p42"] for t in TR), 3)])
    # power of the trial to detect a fall (90% interval excluding nil) at 3.9 and 4.2
    pw["detect_any_39"] = [round(1 - N.cdf((N.inv_cdf(0.95) * t["se"] - 3.9) / t["se"]), 4) for t in TR]
    pw["detect_any_42"] = [round(1 - N.cdf((N.inv_cdf(0.95) * t["se"] - 4.2) / t["se"]), 4) for t in TR]
    pass39 = (1 - pw["cap39"][1], 1 - pw["cap39"][0])
    pass42 = (1 - pw["cap42"][1], 1 - pw["cap42"][0])
    df = (1.0413) ** 4
    sav42 = (0.7 * pass42[0] / df, 2.1 * pass42[1] / df)
    sav39 = (0.7 * pass39[0] / df, 2.1 * pass39[1] / df)
    rows = [["Families with children gaining (%)", f1(p_["gain_fam"]), f1(st_["gain_fam"]), "optionb_hh.py (household model)"],
            ["Private-renter households gaining (%)", f1(p_["gain_rent"]), f1(st_["gain_rent"]), "optionb_hh.py"],
            ["Higher earner's EMTR: 50% or more (%)", f1(E_["p1"]["ge50"]), f1(E_["star_m2"]["ge50"]), "household_r13.emtr_hi (Table F4-109's measure)"],
            ["Higher earner's EMTR: above 50% (%)", f1(E_["p1"]["over50"]), f1(E_["star_m2"]["over50"]), "as above"],
            ["Higher earner's EMTR: 60% or more (%)", f1(E_["p1"]["ge60"]), f1(E_["star_m2"]["ge60"]), "as above"],
            ["Higher earner's mean EMTR (%)", f1(E_["p1"]["mean"]), f1(E_["star_m2"]["mean"]), "as above"],
            ["Second earners: mean participation tax rate (%)", f1(S2_["p1"]["ptr_mean"]), f1(S2_["star_m2"]["ptr_mean"]), "household_r13.second"],
            ["Second earners: participation tax rate 40% or more / 60% or more (%)", f"{f1(S2_['p1']['ptr_ge40'])} / {f1(S2_['p1']['ptr_ge60'])}",
             f"{f1(S2_['star_m2']['ptr_ge40'])} / {f1(S2_['star_m2']['ptr_ge60'])}", "as above"],
            ["Residual family-payment debts a year (thousand families)", f1(RV_["p1"]["total_n_debts"] / 1e3), f1(RV_["star_m2"]["total_n_debts"] / 1e3), "household._s1_review (Table P11)"],
            ["Residual debts (A$bn)", f"{RV_['p1']['total_debts_bn']:.3f}", f"{RV_['star_m2']['total_debts_bn']:.3f}", "as above"],
            ["Income-fall review: cost incl. administration, 2028-29 (A$bn)", f2(RV_["p1"]["total_cost_bn"]), f2(RV_["star_m2"]["total_cost_bn"]), "as above"],
            ["Noise-check calibration (Table 6.14g's last row): first levy; levies to 2045-46; largest levy",
             (f"{sp1[0]['first'] or 'none'}; {f1(sp1[0]['total'])}; {100 * sp1[0]['peak_rate']:.2f}%" if sp1 else "not run"),
             (f"{sp[0]['first'] or 'none'}; {f1(sp[0]['total'])}; {100 * sp[0]['peak_rate']:.2f}%" if sp else "not run"), "optionb_hh.py --cal rec075_c; optionb_fiscal.py"],
            ["Trial: probability the cap binds (its power to stop Stage 2) at a true 3.9-point fall / at 4.2", f"{pw['cap39'][0]:.2f} to {pw['cap39'][1]:.2f} / {pw['cap42'][0]:.2f} to {pw['cap42'][1]:.2f}", "same", "partF_r8.py L1's formula"],
            ["Trial: power to detect any fall (90% interval excludes nil) at 3.9 points", f"{min(pw['detect_any_39']):.3f} to {max(pw['detect_any_39']):.3f}", "same", "normal approximation, 3,000 v 6,000"],
            ["Stage 2's pass probability at 3.9 points (4.2)", f"{pass39[0]:.2f} to {pass39[1]:.2f} ({pass42[0]:.2f} to {pass42[1]:.2f})", "same", "1 − P(cap binds)"],
            ["Expected saving of Part 1 as Stage 2's base, 2028-29 dollars, once (A$bn): at 3.9 points (at 4.2)", f"{sav39[0]:.2f} to {sav39[1]:.2f} ({sav42[0]:.2f} to {sav42[1]:.2f})", "–",
             "Table F4-113's A$0.7bn to A$2.1bn × pass probability, discounted from 2032-33 at 4.13%"]]
    table("Table B17. P* (re-costed, A$" + f"{EX['D']:,.0f}" + " a child, no enrolment) against Part 1 alone: reach, effective tax rates, debts, the noise-check calibration, the trial and Part 1's base, 2028-29 (per cent; thousand; A$ billion; probability)",
          ["Measure", "Part 1 alone", "**P***", "Method / source"], rows,
          "Source: optionb_extra.py (runs/extra.json), optionb_hh.py, optionb_fiscal.py, optionb_report.py. Part 1's column reproduces Tables F4-109 and P11 (49,500 debts; "
          "A$0.8bn review) as a check. Omitted benefit: what the paper's method leaves out for Part 1 against P* is the value of paying the supplement to middle-income "
          "families as a universal entitlement (reach and the payment channel) and its value as Stage 2's base. The second is valued above, at A$0.09bn to A$0.37bn once at "
          "3.9 points against the package; against P*, which keeps Part 1's G schedule and its assessment and claims machinery, Stage 2 needs only the supplement-only "
          "schedule restored, a parameter change, so the saving is smaller still and not separately valued here (ASSUMPTION: close to nil). The first is a value judgement "
          "the model cannot price; its break-even is in Table B10. Nothing found raises Part 1's measured advantage above about A$0.4bn once, against P*'s A$0.8bn to "
          "A$3.1bn a year (Table B7).")
    fact("pstar_extra_measures", dict(gain_fam=dict(p1=p_["gain_fam"], pstar=st_["gain_fam"]), gain_rent=dict(p1=p_["gain_rent"], pstar=st_["gain_rent"]),
                                      emtr_higher_earner={k: E_[k] for k in E_}, second_earners={k: S2_[k] for k in S2_},
                                      review={k: dict(cost_bn=v["total_cost_bn"], n_debts=v["total_n_debts"], debts_bn=v["total_debts_bn"]) for k, v in RV_.items()},
                                      noise_check_calibration=dict(pstar=(sp[0] if sp else None), p1=(sp1[0] if sp1 else None)),
                                      trial=dict(**pw, pass_39=pass39, pass_42=pass42), part1_base_expected_saving=dict(at_3_9=sav39, at_4_2=sav42, unit="A$bn once, 2028-29 dollars"),
                                      omitted_benefit=("Valued: Part 1 as Stage 2's base, A$0.09bn to A$0.37bn once at 3.9 points against the package, smaller against P* (not separately "
                                                       "valued; ASSUMPTION close to nil). Not valued: universality's reach and payment channel (a value judgement; see break-even weights).")),
         "%; thousand; A$bn; probability", "2028-29", "optionb_extra.py; optionb_report.py", provisional=True)

# ======================================================================================================================
# 8. Summary
# ======================================================================================================================
cen = CEN["design"]
s, p, k_ = cen["star_m2"], cen["p1"], cen["pkg_ie"]
SUM = dict(
    pstar_poverty_rel=s["rel"], pstar_poverty_anch=s["anch"], pstar_u15=s["u15"], pstar_67=s["old"], pstar_opf=s["opf"], pstar_dsp=s["dsp"], pstar_persons_m=s["n_rel"],
    pstar_lifted_m=s["lift_rel"], pstar_newly_below_m=s["new_rel"], part1_poverty_rel=p["rel"], part1_persons_m=p["n_rel"], pkg_poverty_rel=k_["rel"], pkg_persons_m=k_["n_rel"],
    pstar_fewer_in_poverty_than_part1_m=p["n_rel"] - s["n_rel"], pkg_fewer_than_pstar_m=s["n_rel"] - k_["n_rel"],
    pstar_printed_poverty_rel=cen["star"]["rel"], pstar_printed_excess_bn=CEN["excess_paper"],
    pstar_net_cost_2028_29=PA["star_m2"]["2028-29"], pstar_net_cost_2045_46=PA["star_m2"]["2045-46"], pstar_pct_gdp_2028_29=100 * PA["star_m2"]["2028-29"] / FIS["p1_rows"]["2028-29"]["gdp"],
    pstar_advance_2028_29=FU["star_m2"]["advance"], pstar_advance_repaid_by=FU["star_m2"]["repaid"], pstar_first_levy=FU["star_m2"]["first"], pstar_levies_to_2045_46=FU["star_m2"]["total"],
    pstar_peak_levy_pct=100 * FU["star_m2"]["peak_rate"], pstar_peak_surplus=FU["star_m2"]["peak_bal"],
    pstar_first_levy_cra_fiscal_path=FIS["funds_cra_fiscal"]["star_m2"]["first"], pstar_levies_cra_fiscal_path=FIS["funds_cra_fiscal"]["star_m2"]["total"],
    stress_pstar_before_2044_45=MC["main"]["star_m2"]["p_before_2044_45"], stress_pstar_before_2034_35=MC["main"]["star_m2"]["p_before_2034_35"],
    stress_part1_before_2044_45=MC["main"]["p1"]["p_before_2044_45"], stress_part1_before_2034_35=MC["main"]["p1"]["p_before_2034_35"],
    stress_pstar_first_levy_p10_p50_p90=[MC["main"]["star_m2"]["p10"], MC["main"]["star_m2"]["p50"], MC["main"]["star_m2"]["p90"]],
    ahc_losers_part1_hh_m=p1l["worse_hh_m"], ahc_losers_part1_people_m=p1l["worse_people_m"], ahc_losers_part1_avg=p1l["avg_loss"],
    ahc_losers_pstar_hh_m=stl["worse_hh_m"], ahc_losers_pstar_people_m=stl["worse_people_m"], ahc_losers_pstar_avg=stl["avg_loss"],
    ahc_losers_pkg_hh_m=CEN["housing_losers"]["pkg_ie"]["groups"]["All recipient households"]["worse_hh_m"],
    nb_pstar_vs_part1=AP["star_m2"]["nb_vs_p1_complete"], nb_pkg_vs_part1=AP["pkg"]["nb_vs_p1_complete"],
    w_breakeven_complete=dict(p1=AP["p1"]["w_breakeven_complete"], pstar=AP["star_m2"]["w_breakeven_complete"], pkg=AP["pkg"]["w_breakeven_complete"]),
    gb13=dict(p1=AP["p1"]["gb13"], pstar=AP["star_m2"]["gb13"], pkg=AP["pkg"]["gb13"]),
    phased_pstar_advance=FIS["phased"]["star_m2_floor_and_cra"]["advance"], phased_pstar_first_levy=FIS["phased"]["star_m2_floor_and_cra"]["first"],
    pstar_hh_better_after_funding=R_["star_m2"]["central"]["a1"]["hh_better"], pstar_adults_better_after_funding=R_["star_m2"]["central"]["a1"]["adults_individual_better"],
    pstar_adults_better_after_funding_5pw=R_["star_m2"]["central"]["a5pw"]["adults_individual_better"],
    robust_all_configs=all(r["all_groups"] for r in ROB.values()), robust_nb_positive_all=all(r["nb_star_vs_p1"][0] > 0 for r in ROB.values()),
    trial_cap_at_3_9=[round(min(t["p39"] for t in TR), 2), round(max(t["p39"] for t in TR), 2)])
fact("summary", SUM, "mixed: % of persons; million; A$bn; financial year; probability", "2028-29 to 2045-46", SRC_HH + "; " + SRC_F, provisional=True)
A("## 9. Findings the author can quote, and the figures for the summary (option B)\n")
S_, M_ = SUM, MC["main"]
nconf = len(ROB)
nbs = [r["nb_star_vs_p1"] for r in ROB.values()]
ph = FIS["phased"]["star_m2_floor_and_cra"]
PARA = [
    ("P* re-costed", f"P* as first printed was not at Part 1 alone's budget: on the fiscal model's own basis it cost A${S_['pstar_printed_excess_bn']:.1f}bn more in 2028-29, "
     f"because its child payment was costed against the household model's higher current FTB and was not charged its prior-year timing cost. Re-costed at Part 1's cost, "
     f"P* pays A${c['D']['m2']:,.0f} a child a year (Part 1's supplement is A${c['design']['p1']['D']:,.0f}) and keeps the floor and Rent Assistance +75%."),
    ("Poverty", f"At the same cost as Part 1, P* cuts poverty after housing costs to {S_['pstar_poverty_rel']:.1f}% on the relative line, against {S_['part1_poverty_rel']:.1f}% "
     f"for Part 1 and {S_['pkg_poverty_rel']:.1f}% for the targeted package: {S_['pstar_fewer_in_poverty_than_part1_m']:.2f} million fewer people in poverty than Part 1, "
     f"and {S_['pkg_fewer_than_pstar_m']:.2f} million more than the package. Child poverty is {S_['pstar_u15']:.1f}% (Part 1 {c['design']['p1']['u15']:.1f}%), sole-parent "
     f"households {S_['pstar_opf']:.1f}% ({c['design']['p1']['opf']:.1f}%) and people aged 67 and over {S_['pstar_67']:.1f}% ({c['design']['p1']['old']:.1f}%)."),
    ("Robustness", f"Across {nconf} household-model configurations (three random seeds and three calibrations), P* has less poverty than Part 1 in every group shown and a "
     f"higher first-year net benefit in every one (A${min(x[0] for x in nbs):.1f}bn to A${max(x[1] for x in nbs):.1f}bn a year on the complete accounting); the "
     "targeted package has less poverty than P* in every group in every configuration."),
    ("Cost and borrowing", f"P* costs A${S_['pstar_net_cost_2028_29']:.1f}bn in 2028-29 ({S_['pstar_pct_gdp_2028_29']:.2f}% of GDP), rising to A${S_['pstar_net_cost_2045_46']:.1f}bn "
     f"in 2045-46. The five taxes fall A${S_['pstar_advance_2028_29']:.1f}bn short in the first year; that is borrowing, repaid with interest by 30 June "
     f"{int(S_['pstar_advance_repaid_by'][:4]) + 1}. Surpluses then build to A${S_['pstar_peak_surplus']:.0f}bn and are drawn down from the late 2030s."),
    ("The levy", f"On central yields a levy is first needed in {S_['pstar_first_levy']} (in {S_['pstar_first_levy_cra_fiscal_path']} if Rent Assistance grows on the fiscal "
     f"model's path rather than with the model's rents), totalling A${S_['pstar_levies_to_2045_46']:.0f}bn to 2045-46 and peaking at {S_['pstar_peak_levy_pct']:.2f}% of market "
     f"income; Part 1's is {FU['p1']['first']} and A${FU['p1']['total']:.0f}bn. The five taxes must yield {100 * FIS['be_yield']['star_m2']:.1f}% of their costings for no levy before 2044-45."),
    ("Stress test", f"Drawing tax yield, behavioural responses, cost overruns, the household calibration and the AI path together, the chance of a levy before 2044-45 is "
     f"{100 * M_['star_m2']['p_before_2044_45']:.0f}% for P* ({100 * M_['p1']['p_before_2044_45']:.0f}% for Part 1) and before 2034-35 {100 * M_['star_m2']['p_before_2034_35']:.0f}% "
     f"({100 * M_['p1']['p_before_2034_35']:.0f}%); with symmetric uncertainty alone it is {100 * MC['symmetric']['star_m2']['p_before_2044_45']:.0f}% and "
     f"{100 * MC['symmetric']['star_m2']['p_before_2034_35']:.0f}%. The most likely first levy year is 2032-33, when an advance not repaid by then would be levied at once. "
     "P* carries the same funding risk as Part 1; the package carries more."),
    ("A phased start", f"Starting the floor and Rent Assistance in 2028-29 and the child payment a year later removes the first-year borrowing: 2028-29 costs "
     f"A${ph['net28']:.1f}bn against A${REV28_:.1f}bn of taxes, and on central yields no levy is needed to 2045-46. The price is a year without the child payment: "
     f"A${PRICE['cash_to_families_net_of_ftb_kept']:.1f}bn of family payments above the FTB families keep (a budget saving of A${PRICE['budget_saving']:.1f}bn)."),
    ("After housing costs", f"The no-worse-off rule protects payments under today's rules, not income after housing costs. In the paper's rent and interest-rate scenario, "
     f"{S_['ahc_losers_part1_hh_m']:.2f} million households on current payments ({S_['ahc_losers_part1_people_m']:.2f} million people) are worse off under Part 1, by about "
     f"A${S_['ahc_losers_part1_avg']:,.0f} a year; under P* {S_['ahc_losers_pstar_hh_m']:.2f} million ({S_['ahc_losers_pstar_people_m']:.2f} million people, about "
     f"A${S_['ahc_losers_pstar_avg']:,.0f}): mostly Disability Support Pension households ({CEN['housing_losers']['star_m2']['groups']['Disability Support Pension']['worse_hh_m']:.2f} million) "
     f"and Age Pension households that own or are buying their home ({CEN['housing_losers']['star_m2']['groups']['Age Pension (other tenure)']['worse_hh_m']:.2f} million), whom Rent Assistance does not reach."),
    ("Who is better off after the taxes", f"Before the funding taxes {BA['star_m2']['households']['before_any']:.0f}% of households gain from P*; after them "
     f"{BA['star_m2']['households']['after_any']:.0f}% are better off ({BA['star_m2']['households']['after_5pw']:.0f}% by A$5 a week or more), against "
     f"{BA['p1']['households']['after_any']:.0f}% under Part 1 and {BA['pkg_ie']['households']['after_any']:.0f}% under the package."),
    ("Net benefit", f"On the paper's complete accounting every design's first-year net benefit is negative at its 1.5 to 2.0 weights; it breaks even at a weight of "
     f"{AP['star_m2']['w_breakeven_complete'][0]:.1f} to {AP['star_m2']['w_breakeven_complete'][1]:.1f} on gains to households in poverty for P* "
     f"({AP['p1']['w_breakeven_complete'][0]:.1f} to {AP['p1']['w_breakeven_complete'][1]:.1f} for Part 1, {AP['pkg']['w_breakeven_complete'][0]:.1f} to "
     f"{AP['pkg']['w_breakeven_complete'][1]:.1f} for the package). With the Green Book's standard weights every design is positive: P* A${AP['star_m2']['gb13'][0]:.0f}bn to "
     f"A${AP['star_m2']['gb13'][1]:.0f}bn, Part 1 A${AP['p1']['gb13'][0]:.0f}bn to A${AP['p1']['gb13'][1]:.0f}bn, the package A${AP['pkg']['gb13'][0]:.0f}bn to "
     f"A${AP['pkg']['gb13'][1]:.0f}bn, so standard weights widen the package's lead."),
    ("The trial's work-effort cap", f"At OpenResearch's revised 3.9-point fall in participation, the Australian trial would trip the 3-point cap with probability "
     f"{S_['trial_cap_at_3_9'][0]:.2f} to {S_['trial_cap_at_3_9'][1]:.2f} (0.86 to 0.91 at 4.2). The costed labour response, 16 cents a dollar, is an income response and stays.")]
if HREL:
    PARA.insert(8, ("Poverty after the housing scenario", f"After the scenario's rent and interest-rate effects (central case), poverty on the relative line is "
                    f"{HREL['star_m2']['central']['all']:.1f}% with P*, {HREL['p1']['central']['all']:.1f}% with Part 1 and {HREL['pkg_ie']['central']['all']:.1f}% with the package."))
for t_, p_ in PARA:
    A(f"**{t_}.** {p_}\n")
fact("quotable_paragraphs", {t_: p_ for t_, p_ in PARA}, "text", "2028-29 to 2045-46", "optionb_report.py from the facts above", provisional=True)
A("### The figures\n")

for k, v in SUM.items():
    A(f"- `{k}`: {json.dumps(v, default=float) if not isinstance(v, float) else round(v, 3)}")
A("")
if WEAK:
    A("**Configurations where P* does not beat Part 1 in every group or on net benefit:** " + "; ".join(f"{n} ({', '.join(g) or 'net benefit'})" for n, g, _ in WEAK) + "\n")
open(os.path.join(ROOT, "optionb_results.md"), "w").write("\n".join(L) + "\n")
json.dump(dict(generated="2026-10-31", model="supplementary/ of 22 October 2026 (unchanged copy)", scripts=["optionb_hh.py", "optionb_fiscal.py", "optionb_report.py", "optionb_check.py"],
               facts=FACTS), open(os.path.join(ROOT, "optionb_facts.json"), "w"), indent=1, default=float)
print("wrote optionb_results.md and optionb_facts.json;", len(FACTS), "facts; weak configs:", WEAK)
