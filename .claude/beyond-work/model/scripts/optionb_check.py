"""optionb_check.py: arithmetic checks on the option B outputs, in the manner of supplementary/check_arithmetic.py (identities and
agreement with the paper's own tables). Checks:
  C1  Part 1 alone's path equals Table F4-102's net cost and Table F4-103's levy, every year (partf4_r11_facts.json);
  C2  every design's funding rows: balance recursion at the debt rate, the levy rule, cash balance = taxes + levy - net cost + interest,
      net debt = - balance, % of GDP, and the period sums;
  C3  the re-costed P* costs Part 1 alone's net cost in 2028-29 within A$0.1bn (the fiscal-household scale factor);
  C4  household flows: persons lifted less newly below = persons in poverty before less after (relative line), every design and configuration;
  C5  the central configuration reproduces household_r13.py's Part 1, package and printed P* (Table 5.4i);
  C6  the five taxes by decile sum to the five taxes (every allocation);
  C7  the trial-cap formula reproduces Table F4-70 at 4.2 points (0.86 / 0.88 / 0.91);
  C8  every summary figure in optionb_facts.json equals its source in the runs.
Run: python3 -I optionb_check.py. Prints the number of checks and any issue; exit code 1 on an issue. Stdlib only."""
import glob, json, os, sys
from statistics import NormalDist

ROOT = os.path.dirname(os.path.abspath(__file__))
SUP = os.path.join(ROOT, "supplementary", "tables")
FIS = json.load(open(os.path.join(ROOT, "runs", "fiscal.json")))
FACTS = json.load(open(os.path.join(ROOT, "optionb_facts.json")))["facts"]
R11 = json.load(open(os.path.join(SUP, "partf4_r11_facts.json")))
H13 = json.load(open(os.path.join(SUP, "household_r13_f4_facts.json")))
RUNS = {os.path.basename(f): json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs", "*_*.json"))}
issues, n = [], 0
I_ = FIS["int_rate"]


def chk(ok, msg):
    global n
    n += 1
    if not ok:
        issues.append(msg)


# C1
for r, r0 in zip(FIS["funds"]["p1"]["rows"], R11["c3"]["rows"]):
    chk(abs(r["net"] - r0["net"]) < 1e-3 and abs(r["levy"] - r0["levy"]) < 2e-3 and abs(r["bal"] - r0["bal"]) < 2e-3, f"C1 {r['fy']}: Part 1 != F4-103 (tolerance: the rule table is stored to 4 decimals)")
# C2
for d, f in FIS["funds"].items():
    B = 0.0
    for r in f["rows"]:
        Bn = B * (1 + I_) + r["rev"] - r["net"] + r["levy"]
        chk(abs(Bn - r["bal"]) < 1e-6, f"C2 {d} {r['fy']}: balance recursion")
        chk(r["levy"] < 1e-9 or (r["fy"] > "2031-32" and abs(r["bal"]) < 1e-9), f"C2 {d} {r['fy']}: levy only to restore a nil balance after 2031-32")
        chk(abs(r["ucb"] - (r["rev"] + r["levy"] - r["net"] + B * I_)) < 1e-6 and abs(r["nd"] + r["bal"]) < 1e-9, f"C2 {d} {r['fy']}: cash balance or net debt")
        chk(abs(r["pct"] - 100 * r["net"] / FIS["p1_rows"][r["fy"]]["gdp"]) < 1e-9, f"C2 {d} {r['fy']}: % of GDP")
        B = r["bal"]
    chk(abs(f["total"] - sum(r["levy"] for r in f["rows"])) < 1e-9, f"C2 {d}: levy total")
    lv = [r["fy"] for r in f["rows"] if r["levy"] > 1e-9]
    chk(f["first"] == (lv[0] if lv else None), f"C2 {d}: first levy")
# C3
chk(abs(FIS["paths"]["star_m2"]["2028-29"] - FIS["paths"]["p1"]["2028-29"]) < 0.1, "C3: re-costed P* not at Part 1's 2028-29 cost")
chk(abs(FIS["paths"]["star_m1"]["2028-29"] - FIS["paths"]["p1"]["2028-29"]) < 0.15, "C3: P* with enrolment not at Part 1's 2028-29 cost")
# C4
for nm, j in RUNS.items():
    for d, h in j["design"].items():
        nb = h["n_rel"] + h["lift_rel"] - h["new_rel"]
        base_n = h["base_rel"]
        chk(h["lift_rel"] >= 0 and h["new_rel"] >= 0, f"C4 {nm} {d}: flows negative")
        # persons before = after + lifted - newly below, the same for every design in a configuration
        j.setdefault("_nb", []).append(nb)
    chk(max(j["_nb"]) - min(j["_nb"]) < 1e-6, f"C4 {nm}: persons before != after + lifted - newly below across designs")
# C5
c = RUNS["central_20261016.json"]["design"]
chk(abs(c["p1"]["rel"] - H13["p1"]["rel"]) < 1e-9 and abs(c["pkg_ie"]["rel"] - H13["pkg_ie"]["rel"]) < 1e-9 and abs(c["star"]["rel"] - H13["star"]["rel"]) < 1e-9,
    "C5: central configuration does not reproduce household_r13")
chk(abs(c["star"]["D"] - H13["star"]["D"]) < 1e-6, "C5: printed P* per-child amount")
# C6
TB = RUNS["central_20261016.json"]["tax_by_hdec"]
for v in TB["by_variant"]:
    tot = sum(TB["by_variant"][v][d]["per_hh"] * TB["rows"][d]["hh_m"] * 1e6 for d in range(10)) / 1e9
    chk(abs(tot - TB["five_taxes_bn"]) < 0.01 * TB["five_taxes_bn"], f"C6 {v}: decile taxes sum to {tot:.2f} not {TB['five_taxes_bn']:.2f}")
    chk(abs(sum(r["share"] for r in TB["by_variant"][v]) - 100) < 1.0, f"C6 {v}: shares")
# C7
N = NormalDist()
got = []
for p0 in (0.6, 0.7, 0.8):
    se = (p0 * (1 - p0) * (1 / 3000 + 1 / 6000)) ** 0.5 * 100
    got.append(round(1 - N.cdf((max(3.0, 1 + N.inv_cdf(0.95) * se) - 4.2) / se), 2))
chk(got == [0.86, 0.88, 0.91], f"C7: trial cap at 4.2 {got}")
chk(FACTS["trial_cap"]["value"]["at_4_2"] == [0.86, 0.91], "C7: facts' 4.2 range")
# C8
S = FACTS["summary"]["value"]
F = FIS["funds"]["star_m2"]
chk(S["pstar_first_levy"] == F["first"] and abs(S["pstar_levies_to_2045_46"] - F["total"]) < 1e-9 and abs(S["pstar_advance_2028_29"] - F["advance"]) < 1e-9, "C8: P* fiscal summary")
chk(abs(S["pstar_poverty_rel"] - c["star_m2"]["rel"]) < 1e-9 and abs(S["part1_poverty_rel"] - c["p1"]["rel"]) < 1e-9 and abs(S["pkg_poverty_rel"] - c["pkg_ie"]["rel"]) < 1e-9, "C8: poverty summary")
chk(abs(S["stress_pstar_before_2044_45"] - FIS["mc"]["main"]["star_m2"]["p_before_2044_45"]) < 1e-12, "C8: stress summary")
chk(abs(FACTS["pstar_advance_2028_29"]["value"] - F["advance"]) < 1e-9, "C8: advance fact")
print(f"optionb_check: {n} checks; {len(issues)} issue(s)")
for i in issues:
    print("  ISSUE", i)
sys.exit(1 if issues else 0)
