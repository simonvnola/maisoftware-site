"""affordability_options.py: funding options for P* beyond the five taxes, on the paper's own funding rule.

Reads runs/fiscal.json (P*'s net cost, the five taxes, GDP and the debt rate, as optionb_fiscal.py wrote them) and
affordability_inputs.json (external figures and the author's assumptions). It needs no supplementary folder.

The funding rule is optionb_fiscal.fund's: the balance is carried at the debt rate, and a negative balance after
2031-32 is levied. The script first checks that it reproduces P*'s saved path (Table 6.6) and the phased start
(Table 6.7), then adds revenue and cost lines. All added lines are first-round: no response of the five taxes,
of P*'s cost or of the household model to them is counted. Poverty and distributional effects are not modelled.

Run: python3 -I affordability_options.py. Writes ../affordability_results.md and ../runs/affordability.json. Stdlib only."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.dirname(ROOT)
F = json.load(open(os.path.join(MODEL, "runs", "fiscal.json")))
IN = json.load(open(os.path.join(MODEL, "affordability_inputs.json")))
A, SRC = IN["assumptions"], IN["sources"]

Y = sorted(F["paths"]["star_m2"])
NET = F["paths"]["star_m2"]
REV = F["rev"]
GDP = {fy: F["p1_rows"][fy]["gdp"] for fy in Y}
I_ = F["int_rate"]
G = {fy: GDP[fy] / GDP["2028-29"] for fy in Y}
FIVE = ("super", "ept", "min", "prrt", "fossil")
CASES = ("low", "central", "high")


def fund(net, rev):
    """optionb_fiscal.fund: balance at the debt rate; a negative balance after 2031-32 is levied."""
    rows, B = [], 0.0
    for fy in Y:
        interest = B * I_
        B = B + interest + rev[fy] - net[fy]
        levy = 0.0
        if fy > "2031-32" and B < -1e-9:
            levy, B = -B, 0.0
        rows.append(dict(fy=fy, rev=rev[fy], net=net[fy], margin=rev[fy] - net[fy], levy=levy, bal=B))
    lv = [r for r in rows if r["levy"] > 1e-9]
    return dict(rows=rows, first=lv[0]["fy"] if lv else None, total=sum(r["levy"] for r in rows),
                advance=max(0.0, -rows[0]["bal"]), bal46=rows[-1]["bal"], margin46=rows[-1]["margin"],
                short_from=next((r["fy"] for r in rows if r["fy"] > "2028-29" and r["margin"] < 0), None))


def break_even(net, rev, last="2045-46"):
    """Smallest share of the costed revenue at which no levy is needed up to and including `last`."""
    lo, hi = 0.3, 2.0
    for _ in range(60):
        mid = (lo + hi) / 2
        f = fund(net, {fy: mid * rev[fy] for fy in Y})
        ok = not any(r["levy"] > 1e-9 and r["fy"] <= last for r in f["rows"])
        lo, hi = (lo, mid) if ok else (mid, hi)
    return hi


# ---- 1. reproduction checks against the saved runs ----
five = {fy: REV[fy]["total"] for fy in Y}
BASE = fund(NET, five)
S = F["funds"]["star_m2"]
assert BASE["first"] == S["first"] and abs(BASE["total"] - S["total"]) < 1e-6 and abs(BASE["advance"] - S["advance"]) < 1e-6
assert abs(break_even(NET, five, "2043-44") - F["be_yield"]["star_m2"]) < 1e-4
PH = F["phased"]["star_m2_floor_and_cra"]
net_ph = dict(NET); net_ph["2028-29"] = PH["net28"]
PHASED = fund(net_ph, five)
assert PHASED["first"] is None and all(abs(a["bal"] - b_["bal"]) < 1e-6 for a, b_ in zip(PHASED["rows"], PH["rows"]))


# ---- 2. the added revenue lines (A$ billion, nominal), low / central / high ----
def cgt(case):
    e15 = SRC["T1"]["figures"]["E15_cgt_discount_individuals_trusts_revenue_forgone_bn"]["2028-29"]
    v = e15 * A["cgt"]["share_of_E15"] * A["cgt"]["behaviour_haircut"][case]
    return {fy: v * G[fy] for fy in Y}


def neg_gearing(case):
    t = SRC["T1"]["figures"]
    scale = t["rental_deductions_tax_reduction_bn"]["2028-29"] / t["rental_deductions_tax_reduction_bn"]["2022-23"]
    v = t["rental_loss_tax_benefit_2022_23_bn"] * scale * A["negative_gearing"]["recovered_share"][case]
    return {fy: v * G[fy] for fy in Y}


def land(case):
    # the base is the ABS value at 30 June 2026, grown with nominal GDP; GDP for 2025-26 is back-cast at the 2028-30 growth rate
    g1 = GDP["2029-30"] / GDP["2028-29"]
    base28 = SRC["A1"]["figures"]["land_current_prices_30_june_2026_bn"] * g1 ** 2.5
    v = base28 * A["land"]["rate"][case] * A["land"]["collection"]
    return {fy: v * G[fy] for fy in Y}


def estate(case):
    p = SRC["P1"]["figures"]
    real = p["real_multiple_to_2050"] ** (1 / 32.0)
    out = {}
    for i, fy in enumerate(Y):
        flow = p["transfers_2018_bn"] * p["inheritance_share"] * (real * 1.025) ** (10.5 + i)
        out[fy] = 0.0 if fy == "2028-29" else flow * A["estate"]["effective_rate_on_inheritance_flow"][case]
    return out


MEAS = dict(cgt=cgt, ng=neg_gearing, land=land, estate=estate)
LABEL = dict(cgt="Halve the capital gains discount", ng="Quarantine rental losses, from 1 July 2028", land="Land levy, 0.1% of unimproved value (0.05% to 0.2%)",
             estate="Estate and gift duty, from 2029-30")
BASIS = dict(cgt="Treasury revenue forgone [T1], which Treasury rates medium to low reliability and which is not the revenue a change would raise, "
                 "x half x the author's behaviour haircut (0.5 to 1.0)",
             ng="Treasury tax benefit of rental losses in 2022-23 [T1], scaled to 2028-29 by its rental deductions series, x the author's "
                "recovered share (25% to 75%). Quarantined losses are carried forward, so part of this is deferral, not a permanent gain",
             land="ABS value of all land at 30 June 2026 [A1], government land included, x the author's rate x 90% collected. "
                  "No fall in land prices is counted",
             estate="Inheritances from the Productivity Commission's 2018 total [P1], a figure taken from press coverage that needs checking, "
                    "x the author's effective rate (2% to 6%)")


def add(*paths):
    return {fy: sum(p[fy] for p in paths) for fy in Y}


def child(case):
    return {fy: A["child_top_up"]["cost_2028_29_bn"][case] * G[fy] for fy in Y}


# ---- 3. scenarios ----
def scen(keys, case, top_up=None, phased=False):
    rev = add(five, *[MEAS[k](case) for k in keys])
    net = dict(net_ph if phased else NET)
    if top_up:
        c = child(top_up)
        net = {fy: net[fy] + (0.0 if (phased and fy == "2028-29") else c[fy]) for fy in Y}
    f = fund(net, rev)
    f["be"] = break_even(net, rev)
    f["new46"] = rev["2045-46"] - five["2045-46"]
    f["new28"] = rev["2028-29"] - five["2028-29"]
    return f


SC = [
    ("A", "P* as recommended (Table 6.6)", [], None, False),
    ("B", "P* with the phased start (Table 6.7)", [], None, True),
    ("C", "A plus the two investor tax changes", ["cgt", "ng"], None, False),
    ("D", "C plus the land levy", ["cgt", "ng", "land"], None, False),
    ("E", "D plus the estate duty", ["cgt", "ng", "land", "estate"], None, False),
    ("F", "E plus the child top-up", ["cgt", "ng", "land", "estate"], "central", False),
    ("G", "F with the phased start", ["cgt", "ng", "land", "estate"], "central", True),
]
RES = {k: {c: scen(keys, c, (c if tu else None), ph) for c in CASES} for k, _, keys, tu, ph in SC}
# the top-up's own range runs against the revenue range: low revenue with the high cost and the reverse
for k in ("F", "G"):
    keys, ph = [s for s in SC if s[0] == k][0][2], k == "G"
    RES[k]["low"], RES[k]["high"] = scen(keys, "low", "high", ph), scen(keys, "high", "low", ph)


# ---- 4. the resource fund: minerals and gas receipts banked, 4% of the opening balance drawn ----
def fund_rule(case, keys):
    r, d = A["fund"]["nominal_return"], A["fund"]["draw"]
    bal, draws, rows = 0.0, {}, []
    for fy in Y:
        draws[fy] = d * bal
        inflow = REV[fy]["min"] + REV[fy]["prrt"]
        bal = bal * (1 + r) - draws[fy] + inflow
        rows.append(dict(fy=fy, inflow=inflow, draw=draws[fy], bal=bal))
    rev = add({fy: REV[fy]["super"] + REV[fy]["ept"] + REV[fy]["fossil"] for fy in Y}, draws, *[MEAS[k](case) for k in keys])
    f = fund(NET, rev)
    f["be"] = break_even(NET, rev)
    return dict(stage1=f, rows=rows, bal46=bal, draw46=draws["2045-46"], real46=bal / 1.025 ** 20)


FUND = {c: fund_rule(c, ["cgt", "ng", "land", "estate"]) for c in CASES}
FUND_NONE = fund_rule("central", [])

# ---- 5. the universal pathway: points of income tax the new bases replace in 2032-33 ----
PTS = {c: sum(MEAS[k](c)["2032-33"] for k in MEAS) / A["stage2_points"]["bn_per_point"] for c in CASES}

# ---- 6. report ----
b = lambda x: f"{x:,.1f}"
pct = lambda x: f"{100 * x:.1f}%"
L = []
W = L.append
W("# Funding options for P* beyond the five taxes (10 November 2026)")
W("")
W("Generated by scripts/affordability_options.py from runs/fiscal.json and affordability_inputs.json. Every figure is first-round and "
  f"provisional. The script reproduces P*'s saved funding path (first levy {S['first']}, levies of A${S['total']:.1f}bn, borrowing of "
  f"A${S['advance']:.1f}bn, break-even yield {100 * F['be_yield']['star_m2']:.1f}%) and every year of the phased start before it adds anything.")
W("")
W("What this does not do: it gives no poverty rate, no count of who gains or loses and no effective tax rate, because the household model is "
  "not in this repository. The new revenue lines are not PBO costings. The low, central and high cases move the author's assumptions "
  "(behaviour haircut, recovered share, rate) together.")
W("")
W("## Table A1. The added revenue measures: illustrative estimates (A$ billion, nominal)")
W("")
W("| Measure | 2028-29, central (low to high) | 2029-30, central (low to high) | 2037-38, central | 2045-46, central | Total to 2045-46, central | Basis |")
W("|---|---:|---:|---:|---:|---:|---|")
for k in MEAS:
    p = {c: MEAS[k](c) for c in CASES}
    cell = lambda fy: f"{b(p['central'][fy])} ({b(p['low'][fy])} to {b(p['high'][fy])})" if p["central"][fy] else "nil"
    W(f"| {LABEL[k]} | {cell('2028-29')} | {cell('2029-30')} | {b(p['central']['2037-38'])} | {b(p['central']['2045-46'])} | {b(sum(p['central'].values()))} | {BASIS[k]} |")
tot = {c: add(*[MEAS[k](c) for k in MEAS]) for c in CASES}
W(f"| **All four** | **{b(tot['central']['2028-29'])} ({b(tot['low']['2028-29'])} to {b(tot['high']['2028-29'])})** | **{b(tot['central']['2029-30'])} ({b(tot['low']['2029-30'])} to {b(tot['high']['2029-30'])})** | **{b(tot['central']['2037-38'])}** | "
  f"**{b(tot['central']['2045-46'])}** | **{b(sum(tot['central'].values()))}** | |")
W(f"| Memo: the five taxes | {b(five['2028-29'])} | {b(five['2029-30'])} | {b(five['2037-38'])} | {b(five['2045-46'])} | {b(sum(five.values()))} | Table 6.4 |")
W("")
W(f"For scale, the states raised A${SRC['S260']['figures']['state_land_tax_2024_25_bn']:.1f}bn in land tax in 2024-25 [S260], on a much narrower base; "
  f"the central land levy would add A${b(land('central')['2028-29'])}bn in 2028-29. None of the four measures has a PBO costing.")
W("")
W("## Table A2. P*'s funding under each option, 2028-29 to 2045-46: illustrative estimates (A$ billion, nominal; central case, low to high in brackets)")
W("")
W("| | Option | Borrowed in 2028-29 | First levy | Levies to 2045-46 | Balance at 30 June 2046 | Margin in 2045-46 | Revenue could fall to this share of its costing with no levy to 2045-46 |")
W("|---|---|---:|---|---:|---:|---:|---:|")
for k, lab, *_ in SC:
    r = RES[k]
    fl = lambda f: f["first"] or "none"
    def rng(key):
        lo_, hi_ = sorted((r["low"][key], r["high"][key]))
        return b(r["central"][key]) if hi_ - lo_ < 0.05 else f"{b(r['central'][key])} ({b(lo_)} to {b(hi_)})"
    firsts = fl(r["central"]) if fl(r["low"]) == fl(r["high"]) == fl(r["central"]) else f"{fl(r['central'])} ({fl(r['low'])} to {fl(r['high'])})"
    W(f"| {k} | {lab} | {rng('advance')} | {firsts} | {rng('total')} | {rng('bal46')} | {rng('margin46')} | "
      + (pct(r['central']['be']) if abs(r['high']['be'] - r['low']['be']) < 5e-4 else f"{pct(r['central']['be'])} ({pct(r['high']['be'])} to {pct(r['low']['be'])})") + " |")
W("")
W("Options A and B have no added revenue, so they have no range. The balance is the surplus the rule accumulates at the debt rate if "
  "nothing else is done with it; it is not a target, and it shows how much the added measures exceed what P* needs. The top-up's central cost, "
  f"A${A['child_top_up']['cost_2028_29_bn']['central']:.1f}bn in 2028-29, is the midpoint of Table 6.58's range, and in G it starts in 2029-30 with the child payment. In F and G the low case pairs low revenue with the "
  "top-up's high cost, and the high case the reverse. The paper's own break-even, 100.2%, is for no levy before 2044-45; "
  "on the stricter test here (none to 2045-46) option A needs " + pct(RES["A"]["central"]["be"]) + ".")
W("")
W("## Table A3. A resource fund: minerals and gas receipts banked, 4% of the opening balance drawn for Stage 1 (A$ billion, nominal)")
W("")
W("| Year | Minerals and gas receipts paid in | Drawn for Stage 1 | Fund balance at 30 June |")
W("|---|---:|---:|---:|")
for r in FUND["central"]["rows"]:
    if r["fy"] in ("2028-29", "2032-33", "2037-38", "2041-42", "2045-46"):
        W(f"| {r['fy']} | {b(r['inflow'])} | {b(r['draw'])} | {b(r['bal'])} |")
fc, fn = FUND["central"], FUND_NONE
W("")
W(f"The fund holds A${b(fc['bal46'])}bn at 30 June 2046 (A${b(fc['real46'])}bn in 2026 dollars) and pays Stage 1 A${b(fc['draw46'])}bn in 2045-46, "
  f"against the A${b(REV['2045-46']['min'] + REV['2045-46']['prrt'])}bn the two measures raise that year. "
  f"With the four added measures, Stage 1 borrows A${b(fc['stage1']['advance'])}bn in 2028-29 and "
  + ("needs no levy to 2045-46 in the central and high cases" if not fc['stage1']['first'] and not FUND['high']['stage1']['first']
     else f"its first levy is {fc['stage1']['first']}, with levies of A${b(fc['stage1']['total'])}bn")
  + f"; in the low case it levies A${b(FUND['low']['stage1']['total'])}bn from {FUND['low']['stage1']['first'] or 'no year'}. "
  f"Without them Stage 1 needs a levy: the first levy is {fn['stage1']['first']} and levies total A${b(fn['stage1']['total'])}bn. "
  "The return is the paper's central assumption, 6.5% nominal [S132]; the borrowing in the early years costs the debt rate, "
  f"{100 * I_:.2f}%, so the fund gains only if it earns more than that.")
W("")
W("## The universal pathway")
W("")
W(f"In 2032-33 the four measures raise A${b(tot['central']['2032-33'])}bn (A${b(tot['low']['2032-33'])}bn to A${b(tot['high']['2032-33'])}bn). "
  f"At Table 6.40's static A$20.75bn a point, that is {PTS['central']:.1f} points ({PTS['low']:.1f} to {PTS['high']:.1f}) of the 12.0 points "
  "Stage 2 needs on every income-tax rate, if none of it were used for Stage 1.")
W("")
W("## Sources")
W("")
for k, s in SRC.items():
    W(f"- [{k}] {s['title']}. Status: {s['status']}." + (f" {s['url']}" if s.get("url") else ""))
W("")
W("Not obtained: " + " ".join(IN["not_obtained"]))
W("")
open(os.path.join(MODEL, "affordability_results.md"), "w").write("\n".join(L))
strip = lambda f: {k: v for k, v in f.items() if k != "rows"}
json.dump(dict(generated="2026-11-10", scenarios={k: {c: strip(RES[k][c]) for c in CASES} for k in RES},
               measures={k: {c: MEAS[k](c) for c in CASES} for k in MEAS},
               fund={c: dict(bal46=FUND[c]["bal46"], draw46=FUND[c]["draw46"], stage1=strip(FUND[c]["stage1"])) for c in CASES},
               fund_without_new_measures=strip(FUND_NONE["stage1"]), stage2_points=PTS),
          open(os.path.join(MODEL, "runs", "affordability.json"), "w"), indent=1)
print("\n".join(L))
