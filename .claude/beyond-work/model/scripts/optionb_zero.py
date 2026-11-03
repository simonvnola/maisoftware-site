"""optionb_zero.py: an illustrative zero-poverty costing on the option B household model (2028-29).

Runs optionb_hh.py's section 1 unchanged (the calibrated 2028-29 population, Part 1 and P* matched on the fiscal basis without
automatic enrolment: key gsm2), then prices three ways of taking measured poverty after housing costs to zero against the baseline
relative line L (50% of the current-rules median equivalised income after housing costs, held fixed; the ACOSS-UNSW measure):

  A  gap top-up:       each household below L is paid exactly its gap, L x e - y (y = income after housing costs), so every
                       dollar of private income below the line is withdrawn in full (100% withdrawal).
  B  tapered top-up:   each household is paid max(0, L x e - 0.5 x y) (the full gap if y < 0), a negative income tax that lifts
                       every household to at least L and phases out at 2L x e, about the median.
  K  child top-up:     A for households with children under 15 only (ending child poverty, the paper's child measure).
  C  universal:        every household is paid L x e whatever its income, the equivalised poverty line as a basic income.

Each is sized to the relative line it produces (a fixed point: the line is half the median after the payment) and costed from current rules and on top of P* (Stage 1). Static costs are exact on the model's population. Work responses are
indicative only, in the paper's taper-response form (elasticity 0.2 on the net-of-withdrawal rate, household._e_year_extras):
  low:     elasticity 0.1; central: elasticity 0.2; high (A only): every dollar of private income in a household paid the gap top-up
           is replaced by the top-up (the fiscal cost of earning nothing below the line is the private income itself).
For B and C the high case is elasticity 0.4. C's income effect is not modelled. The relative line is also recomputed after each
payment (the median moves when payments reach it), and poverty is reported against both lines.
Run from the folder above supplementary/: python3 -I optionb_zero.py --seed 20261016 --cal central --out runs/zero.json. Stdlib only.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(ROOT, "optionb_hh.py")).read()
_cut = _src.index("# 2. --full")
_cut = _src.rindex("# =====", 0, _cut)
G = dict(__file__=os.path.join(ROOT, "optionb_hh.py"), __name__="optionb_hh_section1")
exec(compile(_src[:_cut], "optionb_hh section 1", "exec"), G)
H, pop, W, FY, m, log, ARGS = (G[k] for k in ("H", "pop", "W", "FY", "m", "log", "ARGS"))

GDP28 = json.load(open(os.path.join(ROOT, "runs", "fiscal.json")))["p1_rows"][FY]["gdp"]
STAR_KEY = "gsm2"

base = H.poverty(pop, None, True)
u15_persons = sum(h["n_u15"] for h in pop["HH"]) * W / 1e6
L = base["line"]
inc0 = lambda h, key: H.incomes(h, key, True)


def mt_of(a):
    """Marginal income-tax rate on the adult's private income (current scale)."""
    y = max(0.0, a["y"]) + (a["Psq"] if a["cat"] in ("rec", "ap") else 0.0)
    return max(0.0, min(0.6, (m.new_tax(y + 100, FY) - m.new_tax(y, FY)) / 100))


WORKING = lambda a: a["cat"] not in ("ap", "oldnr")     # the work response counts working-age adults only


def response(hh_w, eps):
    """Work response cost (A$bn) for working-age adults in households facing an extra withdrawal rate w on private income:
    -y (r^eps - 1)(mt + w), r = max(0.02, 1 - mt - w) / (1 - mt), as household._e_year_extras."""
    tot = 0.0
    for h, w in hh_w:
        for a in h["adults"]:
            y = a["y"]
            if y <= 0 or not WORKING(a):
                continue
            mt = mt_of(a)
            den = 1 - mt
            if den <= 0.02:
                continue
            r_ = max(0.02, 1 - mt - w) / den
            tot += -y * (r_ ** eps - 1) * (mt + w)
    return tot * W / 1e9


def payments(key, design, line):
    pay, hh_w = {}, []
    for h in pop["HH"]:
        y = inc0(h, key)
        need = line * h["e"] - y
        if design == "A":
            p = need + 1.0 if need > 0 else 0.0          # A$1 a year above the line, so no household sits exactly on it
            if p > 0 and y >= 0:
                hh_w.append((h, 1.0))
        elif design == "K":
            p = need + 1.0 if (need > 0 and h["n_u15"] > 0) else 0.0
            if p > 0 and y >= 0:
                hh_w.append((h, 1.0))
        elif design == "B":
            p = need + 1.0 if y < 0 else max(0.0, line * h["e"] - 0.5 * y + 1.0)
            if p > 1.0 and y >= 0:
                hh_w.append((h, 0.5))
            if p <= 1.0:
                p = 0.0
        else:
            p = line * h["e"] + 1.0
        pay[id(h)] = p
    return pay, hh_w


def scenario(key, design):
    """Each design sized to the relative line it produces: the line is half the median after the payments, so the payment's
    line is solved as a fixed point (the median moves when payments reach it; for a universal payment it moves by the payment)."""
    tag = f"_z{design}_{key or 'cur'}"
    line = 0.5 * H.wmedian([(inc0(h, key) / h["e"], h["np"]) for h in pop["HH"]])
    for it in range(80):
        pay, hh_w = payments(key, design, line)
        for h in pop["HH"]:
            h[tag] = (h[key] if key else 0.0) + pay[id(h)]
        new = 0.5 * H.wmedian([(inc0(h, tag) / h["e"], h["np"]) for h in pop["HH"]])
        if abs(new - line) < 0.5:
            break
        line = new
    pay, hh_w = payments(key, design, new)
    for h in pop["HH"]:
        h[tag] = (h[key] if key else 0.0) + pay[id(h)]
    rline = 0.5 * H.wmedian([(inc0(h, tag) / h["e"], h["np"]) for h in pop["HH"]])
    cost = sum(pay.values()) * W / 1e9
    rel = H.poverty(pop, tag, True, rline)
    anch = H.poverty(pop, tag, True, L)
    recips = sum(h["np"] for h in pop["HH"] if pay[id(h)] > 0) * W / 1e6
    priv = sum(max(0.0, a["y"]) for h, _ in hh_w for a in h["adults"] if WORKING(a)) * W / 1e9
    neg = sum(h["np"] for h in pop["HH"] if inc0(h, key) < 0) * W / 1e6
    neg_gap = sum(pay[id(h)] for h in pop["HH"] if inc0(h, key) < 0) * W / 1e9
    out = dict(cost=cost, pct_gdp=100 * cost / GDP28, persons_paid=recips, iterations=it + 1, line_pa=rline, line_pw=rline / 52.18,
               line_shift_pct=100 * (rline / L - 1), poor_rel=rel["rates"]["all"], u15_rel=rel["rates"]["u15"], n_poor_rel=rel["n_poor"],
               poor_anch=anch["rates"]["all"], working_age_private_income_of_recipients=priv, negative_ahc_persons=neg,
               paid_to_negative_ahc=neg_gap)
    out["n_u15_poor_rel"] = rel["rates"]["u15"] * u15_persons / 100
    if design in ("A", "K"):
        out["resp"] = dict(low=response(hh_w, 0.1), central=response(hh_w, 0.2), high=priv)
    elif design == "B":
        out["resp"] = dict(low=response(hh_w, 0.1), central=response(hh_w, 0.2), high=response(hh_w, 0.4))
    else:
        out["resp"] = dict(low=0.0, central=0.0, high=0.0)
    for k_ in ("low", "central", "high"):
        out[f"total_{k_}"] = cost + out["resp"][k_]
        out[f"total_{k_}_pct_gdp"] = 100 * out[f"total_{k_}"] / GDP28
    return out


star_line = 0.5 * H.wmedian([(inc0(h, STAR_KEY) / h["e"], h["np"]) for h in pop["HH"]])
star = H.poverty(pop, STAR_KEY, True, star_line)
star_anch = H.poverty(pop, STAR_KEY, True, L)
negative = sum(h["np"] for h in pop["HH"] if inc0(h, None) < 0) * W / 1e6
neg_star = sum(h["np"] for h in pop["HH"] if inc0(h, STAR_KEY) < 0) * W / 1e6
RES = dict(seed=ARGS.seed, cal=ARGS.cal, fy=FY, gdp=GDP28, line_pa=L, line_pw=L / 52.18,
           u15_persons=u15_persons,
           base=dict(rate=base["rates"]["all"], u15=base["rates"]["u15"], n_poor=base["n_poor"], gap=base["gap"], persons=base["persons"],
                     n_u15_poor=base["rates"]["u15"] * u15_persons / 100,
                     negative_ahc_persons=negative),
           star=dict(rate=star["rates"]["all"], u15=star["rates"]["u15"], n_poor=star["n_poor"], gap=star["gap"], line_pa=star_line,
                     anch_rate=star_anch["rates"]["all"], anch_gap=star_anch["gap"], n_u15_poor=star["rates"]["u15"] * u15_persons / 100,
                     cash=sum(h[STAR_KEY] for h in pop["HH"]) * W / 1e9, negative_ahc_persons=neg_star),
           designs={})
for key, lab in ((None, "cur"), (STAR_KEY, "star")):
    for d in ("A", "K", "B", "C"):
        RES["designs"][f"{d}_{lab}"] = r = scenario(key, d)
        log(f"{d} on {lab}: static A${r['cost']:.1f}bn ({r['pct_gdp']:.2f}% GDP), paid {r['persons_paid']:.2f}m; relative line A${r['line_pw']:.0f} a week "
            f"({r['line_shift_pct']:+.1f}%, {r['iterations']} it); poverty rel {r['poor_rel']:.2f}% anch {r['poor_anch']:.2f}%; negative AHC {r['negative_ahc_persons']:.2f}m "
            f"(A${r['paid_to_negative_ahc']:.1f}bn); response {r['resp']}")
log(f"baseline: rate {base['rates']['all']:.2f}% ({base['n_poor']:.2f}m), gap A${base['gap']:.2f}bn, line A${L:.0f} a year (A${L / 52.18:.0f} a week, single adult); "
    f"P*: {star['rates']['all']:.2f}% gap A${star['gap']:.2f}bn; GDP A${GDP28:.0f}bn")
json.dump(RES, open(ARGS.out, "w"), indent=1)
log(f"wrote {ARGS.out}")
