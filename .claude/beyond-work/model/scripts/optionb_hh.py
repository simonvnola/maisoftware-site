"""optionb_hh.py: option B household runs (household.py partf4, unchanged, loaded as household_r13.py loads it).

For one household-model configuration (random seed, calibration variant) this computes, Stage 1, no dividend:

 1. 2028-29 designs at Part 1 alone's budget (fiscal design_c net cost of payments, A$62.4bn):
      p1        Part 1 alone (household.abi, U = 0);
      pkg_ie    the targeted package charged the 16-cent income effect (Table 5.4i / F4-117's 'package'; household_r13.T1);
      pkg       the package as Table F4-105 (own taper responses, no income effect);
      star      P* exactly as household_r13.S1 (the paper's Table 5.4i column: the per-child amount solved so that the floor,
                automatic enrolment, Rent Assistance +75%, P*'s family payments over current FTB, its taper responses and its income
                effect equal the fiscal budget);
      star_m1   P* matched on the fiscal model's basis (see below), with automatic enrolment;
      star_m2   P* matched on the fiscal model's basis, without automatic enrolment (Part 1 alone's fiscal path carries none):
                Part 1's gains with its child payment replaced by P*'s and Rent Assistance +75% added.
    'Matched on the fiscal model's basis' means: the fiscal model costs Part 1's child payment as the fiscal supplement plus k x the
    household rule flows (static rule net, prior-year timing tm, taper response bh at 0.2, income effect inc; partc.cs_rule_adj,
    k = gc / gross_hh). P*'s fiscal cost is Part 1's plus k x (P*'s four flows less Part 1's, computed with household._e_year_extras'
    own forms) plus Rent Assistance +75% (household synthetic, as household_r13) [plus enrolment for m1]; D is solved so that equals
    Part 1's. household_r13's P* instead set P*'s household-cash family cost against the fiscal budget, so it is not charged its
    prior-year timing and it inherits the household model's over-statement of current FTB (A$23.2bn against the PBO's A$18.6bn).
    For each design: poverty after housing costs (relative and anchored; all, under 15, 67+, sole-parent), persons in poverty, lifted
    and newly below the relative line, the household poverty gap, reach, own behavioural costs.
 2. (--full) after-housing losers under the paper's rent and interest-rate scenario (household.scenario, Tables 6.30/6.31's central
    case: 45 bp, mid pass-through) by current payment; the five taxes' allocation by decile of equivalised household income under the
    paper's central rule and its incidence variants (household_r11.B3's vectors); households and adults better off after funding at
    A$1 and A$5 a week; Green Book weighted net benefit and break-even weights.
 3. (--years) every year 2028-29 to 2045-46: the household flows the fiscal path needs (Part 1's rule flows, each P*'s, the package's
    FTB increment, responses, income effect and credit, Rent Assistance +75%), with indexation: P*'s per-child amount moves with the
    child supplement (partc: m.child_rate), the package's FTB increment and income test with CPI (as FTB), the credit's parameters with
    wages (ASSUMPTION), Rent Assistance with its CPI-indexed maximum rates against the model's rents.
Run from the folder above supplementary/: python3 -I optionb_hh.py --seed 20261016 --cal central [--full] [--years] --out file.json
Calibrations: central; rec075 (full-rate pensioners' other income 25% lower, nearest DSS data); tilt17 (FTB-consistent). Stdlib only."""
import argparse, importlib.util, json, os, random, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))
HERE = os.path.join(ROOT, "supplementary")
ap_ = argparse.ArgumentParser()
ap_.add_argument("--seed", type=int, default=20261016)
ap_.add_argument("--cal", default="central", choices=("central", "rec075", "tilt17", "rec075_c"))
ap_.add_argument("--full", action="store_true")
ap_.add_argument("--years", action="store_true")
ap_.add_argument("--out", required=True)
ARGS = ap_.parse_args()
T0 = time.time()
log = lambda msg: print(f"[{ARGS.cal} {ARGS.seed} {time.time() - T0:.0f}s] {msg}", flush=True)
sys.argv = [sys.argv[0], "partf4"]
_sp = importlib.util.spec_from_file_location("hh_partf4", os.path.join(HERE, "household.py"))
H = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(H)
assert H.PART_F3 and H.PART_F4
PC, m = H.PC, H.m
FY = "2028-29"
TJ = lambda fn: json.load(open(os.path.join(HERE, "tables", fn)))
HHF4, H10 = TJ("household_partf4_facts.json"), TJ("household_r10_f4_facts.json")
FE = TJ("partf4_facts.json")["options_r10"]["fe"]

# ---- seed: the population draw (build), tenure (assign_tenure, seed + 3) and the enrolment sample (comparator_setup, SEED + 7)
SEED = ARGS.seed
H.SEED = SEED
_at0 = H.assign_tenure


def _at(pop, drift=H.HC_DRIFT, seed=None):
    return _at0(pop, drift=drift, seed=(SEED + 3 if seed is None else seed))


H.assign_tenure = _at
CKW, MKW = dict(central=({}, {}), rec075=(dict(rec_oth=0.75), dict(rec_oth=0.75)), tilt17=(dict(u15_target=None, tilt=1.7), {}),
                rec075_c=(dict(rec_oth=0.75), dict(rec_oth=0.75)))[ARGS.cal]
if ARGS.cal == "rec075_c":            # Table 6.14g's noise check: the pensioner variant calibrated from the central calibration's result
    H.calibrate(FY, store=True, seed=SEED)
H.calibrate(FY, store=True, seed=SEED, **CKW)
CALV = dict(level=H.CAL["level"], drift=H.CAL["drift"], tilt=H.CAL["tilt"])
mk = lambda fy: H.make(fy, seed=SEED, tilt=H.CAL["tilt"], **MKW)
log(f"calibrated {CALV}")

U1 = H.U1
GL = (1 + PC.WAGE) ** H.LAG_YEARS
CPI, WAGE = PC.CPI, PC.WAGE
yr = lambda fy: m.fy_start(fy)
parents = lambda h: [a for a in h["adults"] if a["role"] in ("OPF", "CWC")]


# ======================================================================================================================
# Generic family-payment flows in household._e_year_extras' own forms (static over current FTB, prior-year timing, taper response
# at elasticity 0.2, income effect at MPE_CP), for any family payment
# ======================================================================================================================
def flows(pop, fy, pay_u, pay_h, cur_fn):
    """pay_u(h, atis): the payment without the hold-harmless; pay_h(h, atis): as paid (held harmless); cur_fn(h, atis): current FTB."""
    W = pop["W"]
    with PC.tax_stage("a"):
        U = PC.stage_U("a", fy, U1)
        S = tm = bh = inc = 0.0
        for h in pop["HH"]:
            if not h["kids"]:
                continue
            par = parents(h)
            atis = [a["ati"] for a in par]
            AB = h["ftbA"] + h["ftbB"]
            p0 = pay_h(h, atis)
            S += p0 - AB
            tm += pay_u(h, [v / GL for v in atis]) - pay_u(h, atis)
            gain_ = max(0.0, p0 - AB)
            y_nr = sum(a["y"] for a in par if a["cat"] == "nr" and a["y"] > 0)
            pu0 = pay_u(h, atis)
            c0 = cur_fn(h, atis)
            for i, a in enumerate(par):
                y = a["y"]
                if y <= 0:
                    continue
                bump = list(atis); bump[i] += 100.0
                w_e = (pu0 - pay_u(h, bump)) / 100
                w_c = (c0 - cur_fn(h, bump)) / 100
                base_y = y + (a["Psq"] if a["cat"] in ("rec", "ap") else 0.0)
                mt = (m.new_tax(base_y + U + 100, fy) - m.new_tax(base_y + U, fy)) / 100
                if a["cat"] == "nr" and y_nr > 0 and gain_ > 0:
                    inc += min(y, H.MPE_CP * gain_ * y / y_nr) * (mt + w_e)
                den = 1 - mt - w_c
                if den > 0.02 and w_c < 1.0:
                    r_ = max(0.02, 1 - mt - w_e) / den
                    bh += -y * (r_ ** 0.2 - 1) * (mt + w_e)
    return dict(S=S * W / 1e9, tm=tm * W / 1e9, bh=bh * W / 1e9, inc=inc * W / 1e9)


def tot4(f_):
    return f_["S"] + f_["tm"] + f_["bh"] + f_["inc"]


def star_fns(fy, T, D):
    """P*: Part 1's G schedule (partc.fam_e) with per-child amount D, without the supplement-only schedule S."""
    cs = m.child_rate(fy)

    def pu(h, atis):
        single = h["typ"] == "OPF" or len(atis) < 2
        e = PC.fam_e(h["kids"], sum(atis), fy, single, (0.0 if single else min(atis)), cur=None, T=T)
        return max(0.0, e["G"] + len(h["kids"]) * (D - cs))

    def ph(h, atis):
        return max(h["ftbA"] + h["ftbB"], pu(h, atis))
    return pu, ph


def p1_fns(fy, T):
    pu = lambda h, atis: H.pay_e(h, fy, T, atis, hold=False)
    ph = lambda h, atis: max(h["ftbA"] + h["ftbB"], pu(h, atis))
    return pu, ph


def cur_fn_y(fy):
    return lambda h, atis: sum(H.cur_ab(h, fy, atis))


def cra_rise(pop, fy, x=0.75):
    W = pop["W"]
    tot = 0.0
    for h in pop["HH"]:
        h["_cra_x"] = (H.cra_h(h, fy, 1 + x) - h["cra"]) if h["ten"] == "private" else 0.0
        tot += h["_cra_x"]
    return tot * W / 1e9


# ======================================================================================================================
# 1. 2028-29
# ======================================================================================================================
pop = mk(FY)
W = pop["W"]
NS = dict(H=H, PC=PC, m=m, pop=pop, W=W, FY=FY, HHF4=HHF4, H10=H10)
_src = open(os.path.join(HERE, "household_r11.py")).read()
exec(compile(_src[_src.index("pk0 = HHF4"):_src.index("su0 = setup(")], "household_r11 helpers", "exec"), NS)
setup, cra_x, eitc_fiscal, resp, stats, solve, fams = (NS[k] for k in ("setup", "cra_x", "eitc_fiscal", "resp", "stats", "solve", "fams"))
pk0 = NS["pk0"]
D0 = PC.design_c("a", FY, 0.0)
BUD = D0["net"]
su = setup(BUD)
X, C, TEST = pk0["x"], pk0["C"], su["test"]
PKG = solve(su, BUD, X, C, 1.0, pk0["D_static"])
H.abi(pop, "a", U=0.0)
P1 = stats("g")
NS.update(BUD=BUD, su=su, X=X, C=C, TEST=TEST, EPS=H.PKG_EPS, parents=parents, cur=lambda h, atis: sum(H.cur_ab(h, FY, atis)), PKG=PKG)
_s13 = open(os.path.join(HERE, "household_r13.py")).read()
exec(compile(_s13[_s13.index("T_ = H.cs_threshold(FY, pop)"):_s13.index("# ---- T1: the package charged")], "household_r13 functions", "exec"), NS)
pay_pkg, pay_star, taper_resp, inc_effect, fam_cost, solve_d = (NS[k] for k in ("pay_pkg", "pay_star", "taper_resp", "inc_effect", "fam_cost", "solve_d"))
T_ = NS["T_"]
fixed_pkg = su["floor"] + su["ae"] + cra_x(su, X) + eitc_fiscal(C, 1.0)
PKG_IE = solve_d(lambda D: (lambda h, at, D_=D: pay_pkg(h, at, D_)), fixed_pkg, lambda D: resp(su, C, D, 1.0)["total"], PKG["D"], "gpk_ie", True)
fixed_star = su["floor"] + su["ae"] + cra_x(su, X)
STAR = solve_d(lambda D: (lambda h, at, D_=D: pay_star(h, at, D_)), fixed_star, "taper", 6800.0, "gstar", False)
log(f"P1 rel {P1['rel']:.3f}; package(ie) rel {PKG_IE['rel']:.3f} D {PKG_IE['D']:.0f}; P* (r13 method) rel {STAR['rel']:.3f} D {STAR['D']:.0f}")

# ---- matched P*: the fiscal basis
CUR28 = cur_fn_y(FY)
F_P1 = flows(pop, FY, *p1_fns(FY, T_), CUR28)
KF = D0["gc"] / PC.CSR["years"][FY]["gross_hh"]
CRA28 = cra_rise(pop, FY)
AE28 = su["ae"]
CSR28 = PC.CSR["years"][FY]
log(f"Part 1 flows (generic) {F_P1}; rule table: S {CSR28['univ_hh'] + CSR28['mo']:.4f} tm {CSR28['tm']} bh {CSR28['bh']['0.2']} inc {CSR28['inc']}; k {KF:.5f}; "
    f"CRA+75% {CRA28:.3f} (r11 cache {su['cra_cache'][X]:.3f}); enrolment {AE28:.3f}")


def star_excess(D, fy=FY, pop_=None, F1=None, kf=None, cra=None, ae=0.0, T=None):
    pop_ = pop if pop_ is None else pop_
    fs = flows(pop_, fy, *star_fns(fy, T_ if T is None else T, D), cur_fn_y(fy))
    return (KF if kf is None else kf) * (tot4(fs) - tot4(F_P1 if F1 is None else F1)) + (CRA28 if cra is None else cra) + ae, fs


def solve_match(ae):
    lo, hi = 3000.0, 9000.0
    for _ in range(26):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if star_excess(mid, ae=ae)[0] < 0 else (lo, mid)
    return (lo + hi) / 2


EXC_PAPER, FS_PAPER = star_excess(STAR["D"], ae=AE28)
D_M1, D_M2 = solve_match(AE28), solve_match(0.0)
log(f"P* (r13) fiscal-basis excess over Part 1: A${EXC_PAPER:.2f}bn (with enrolment); matched D: with enrolment {D_M1:.0f}, without {D_M2:.0f}")
# paper P* without the enrolment it was charged: excess on the fiscal basis without ae
EXC_PAPER_NOAE = EXC_PAPER - AE28

# gains for the matched designs: Part 1's own gains with its child payment replaced and Rent Assistance +75% added (+ enrolment)
# the enrolment gain in household.comparator_setup's c_fix (avgP for each chosen non-lodger) is its residual after the lifted
# recipients' gain and the bin extras, computed as comparator_setup does
_lifted = {g["lab"] for g in su["pk"]["groups"] if g["d"] > 0}
_lc = PC.lift_cost(FY, 0.0, pop["F"])
_ato, _R = PC._ato_units(FY, 0.0, 0.0)
_extra, _wbin = {}, {}
for prog, w, y, Psq, Pn, kind, B2 in pop["new"]:
    _extra[int(y // 5000)] = _extra.get(int(y // 5000), 0.0) + w * Pn
for a in _ato:
    _wbin[int(a["y"] // 5000)] = _wbin.get(int(a["y"] // 5000), 0.0) + a["n"]
_ex = {b: v / _wbin[b] for b, v in _extra.items() if _wbin.get(b)}
for h in pop["HH"]:
    rec = sum(a["Pn"] - a["Psq"] for a in h["adults"] if a["cat"] in ("rec", "ap") and a["lab"] in _lifted)
    bins = sum(_ex.get(int(a["y"] // 5000), 0.0) for a in h["adults"] if a["cat"] not in ("rec", "ap"))
    h["_ae_g"] = h["c_fix"] - rec - bins
AE_CASH = sum(h["_ae_g"] for h in pop["HH"]) * W / 1e9
assert min(h["_ae_g"] for h in pop["HH"]) > -1e-6, "enrolment residual negative"


def set_star_key(key, D, with_ae):
    for h in pop["HH"]:
        g = h["g"] - h["g_fam"] + h.get("_cra_x", 0.0) + (h["_ae_g"] if with_ae else 0.0)
        if h["kids"]:
            atis = [a["ati"] for a in parents(h)]
            g += pay_star(h, atis, D) - sum(H.cur_ab(h, FY, atis))
        h[key] = g


H.abi(pop, "a", U=0.0)
cra_rise(pop, FY)
set_star_key("gsm1", D_M1, True)
set_star_key("gsm2", D_M2, False)
set_star_key("gsp2", STAR["D"], False)      # the paper's per-child amount on Part 1's gains, no enrolment (for decomposition)
F_M1 = star_excess(D_M1, ae=AE28)[1]
F_M2 = star_excess(D_M2)[1]
log(f"enrolment cash in household gains A${AE_CASH:.2f}bn; P* m1 D {D_M1:.0f}, m2 D {D_M2:.0f}")

DES = dict(p1="g", pkg="gpk", pkg_ie="gpk_ie", star="gstar", star_m1="gsm1", star_m2="gsm2", star_p_noae="gsp2")
RES = {}
for k, key in DES.items():
    A_ = H.pov_both(pop, key, True)
    n = len(pop["HH"])
    priv = [h for h in pop["HH"] if h["ten"] == "private"]
    gr = H.reliance(pop, key, True, A_["rel"]["line"])
    RES[k] = dict(rel=A_["rel"]["rates"]["all"], anch=A_["anch"]["rates"]["all"], u15=A_["rel"]["rates"]["u15"], old=A_["rel"]["rates"]["old"],
                  opf=A_["rel"]["rates"]["opf"], u15_anch=A_["anch"]["rates"]["u15"], old_anch=A_["anch"]["rates"]["old"], opf_anch=A_["anch"]["rates"]["opf"],
                  n_rel=A_["rel"]["n_poor"], n_anch=A_["anch"]["n_poor"], lift_rel=A_["lift_rel"], new_rel=A_["new_rel"], lift_anch=A_["lift_anch"], new_anch=A_["new_anch"],
                  gap_base=A_["base"]["gap"], gap_rel=A_["rel"]["gap"], gap_anch=A_["anch"]["gap"], base_rel=A_["base"]["rates"]["all"],
                  base=A_["base"]["rates"], cash=sum(h[key] for h in pop["HH"]) * W / 1e9,
                  gain_hh=100 * sum(1 for h in pop["HH"] if h[key] > 1) / n, gain_fam=100 * sum(1 for h in fams if h[key] > 1) / len(fams),
                  gain_rent=100 * sum(1 for h in priv if h[key] > 1) / len(priv),
                  dsp=gr["Disability Support Pension"][0], reliance={kk: v[0] for kk, v in gr.items() if kk != "line"})
own = dict(p1=dict(resp=F_P1["bh"], ie=F_P1["inc"], tm=F_P1["tm"], fe_resp=FE[FY]["taper"], fe_ie=FE[FY]["inc"]),
           pkg=dict(resp=PKG["resp"]["total"], ie=0.0, tm=0.0), pkg_ie=dict(resp=PKG_IE["resp"], ie=PKG_IE["ie"], tm=0.0),
           star=dict(resp=STAR["resp"], ie=STAR["ie"], tm=0.0, e_resp=FS_PAPER["bh"], e_ie=FS_PAPER["inc"], e_tm=FS_PAPER["tm"]),
           star_m1=dict(resp=F_M1["bh"], ie=F_M1["inc"], tm=F_M1["tm"]), star_m2=dict(resp=F_M2["bh"], ie=F_M2["inc"], tm=F_M2["tm"]))
for k in RES:
    RES[k]["own"] = own.get(k, {})
RES["p1"]["D"], RES["pkg"]["D"], RES["pkg_ie"]["D"], RES["star"]["D"] = m.child_rate(FY), PKG["D"], PKG_IE["D"], STAR["D"]
RES["star_m1"]["D"], RES["star_m2"]["D"], RES["star_p_noae"]["D"] = D_M1, D_M2, STAR["D"]
OUT = dict(seed=SEED, cal=ARGS.cal, calv=CALV, budget=BUD, k=KF, cra28=CRA28, ae28=AE28, ae_cash=AE_CASH, flows_p1=F_P1, flows_star_paper=FS_PAPER,
           flows_m1=F_M1, flows_m2=F_M2, excess_paper=EXC_PAPER, excess_paper_noae=EXC_PAPER_NOAE, D=dict(paper=STAR["D"], m1=D_M1, m2=D_M2, pkg_ie=PKG_IE["D"]),
           design=RES, fe28=FE[FY], fam=dict(star=STAR["fam"], pkg_ie=PKG_IE["fam"]), pkg_fixed=fixed_pkg, star_fixed=fixed_star,
           pkg_parts=dict(floor=su["floor"], ae=su["ae"], cra=cra_x(su, X), credit=eitc_fiscal(C, 1.0), ftb=PKG_IE["fam"], resp=PKG_IE["resp"], ie=PKG_IE["ie"]))
log("poverty rel: " + "; ".join(f"{k} {v['rel']:.2f} (u15 {v['u15']:.2f}, 67+ {v['old']:.2f}, opf {v['opf']:.2f})" for k, v in RES.items()))

# ======================================================================================================================
# 2. --full: after-housing losers, the five taxes by decile, after-funding reach, distributional weights
# ======================================================================================================================
if ARGS.full:
    PAYLAB = {H.AP: "Age Pension", H.DSP: "Disability Support Pension", H.CA: "Carer Payment", H.JS: "JobSeeker, Youth Allowance (other), Special Benefit",
              H.ST: "Youth Allowance (student), Austudy, ABSTUDY", H.PP: "Parenting Payment"}

    def main_pay(h):
        best, lab = 0.0, None
        for a in h["adults"]:
            if a["cat"] in ("rec", "ap") and a["Psq"] > 0:
                p = a["Psq"] + H.supp(a, FY)
                if p > best:
                    best, lab = p, PAYLAB.get(a["prog"], str(a["prog"]))
        return lab

    REC = [h for h in pop["HH"] if main_pay(h)]
    LOS = {}
    for k, key in DES.items():
        H.scenario(pop, key)
        rows = {}
        for h in pop["HH"]:
            h["_ahc"] = h[key] - h["rate_mid"] - (h["rent_lo"] + h["rent_hi"]) / 2
            h["_ahc_hi"] = h[key] - h["rate_hi"] - h["rent_hi"]
        for h in REC:
            lab = main_pay(h)
            sub = lab + (" (private renter)" if h["ten"] == "private" else " (other tenure)") if lab == "Age Pension" else lab
            for gl in (lab, sub, "All recipient households") if sub != lab else (lab, "All recipient households"):
                r = rows.setdefault(gl, dict(n=0, np=0.0, worse=0, worse_np=0.0, loss=0.0, worse_hi=0, gain=0.0))
                r["n"] += 1; r["np"] += h["np"]; r["gain"] += h[key]
                if h["_ahc"] < -1:
                    r["worse"] += 1; r["worse_np"] += h["np"]; r["loss"] += -h["_ahc"]
                if h["_ahc_hi"] < -1:
                    r["worse_hi"] += 1
        out = {}
        for gl, r in rows.items():
            out[gl] = dict(hh_m=r["n"] * W / 1e6, people_m=r["np"] * W / 1e6, worse_hh_m=r["worse"] * W / 1e6, worse_people_m=r["worse_np"] * W / 1e6,
                           worse_share=100 * r["worse"] / r["n"], avg_loss=(r["loss"] / r["worse"] if r["worse"] else 0.0),
                           worse_hi_share=100 * r["worse_hi"] / r["n"], worse_hi_hh_m=r["worse_hi"] * W / 1e6, avg_gain_first_round=r["gain"] / r["n"])
        allh = [h for h in pop["HH"]]
        out["All households"] = dict(worse_hh_m=sum(1 for h in allh if h["_ahc"] < -1) * W / 1e6, worse_share=100 * sum(1 for h in allh if h["_ahc"] < -1) / len(allh))
        sp_ = H.scenario_poverty(pop, key)
        # [round B2] the relative line after the scenario: 50% of the post-scenario median (household.pov_both on the scenario's net gain)
        rel_ = {}
        for lab, r_k in (("low", "rate_lo"), ("central", "rate_mid"), ("high", "rate_hi")):
            for h in pop["HH"]:
                rent = h["rent_lo"] if lab == "low" else (h["rent_hi"] if lab == "high" else (h["rent_lo"] + h["rent_hi"]) / 2)
                h["_scn"] = h[key] - h[r_k] - rent
            Ar = H.pov_both(pop, "_scn", True)
            rel_[lab] = dict(all=Ar["rel"]["rates"]["all"], u15=Ar["rel"]["rates"]["u15"], old=Ar["rel"]["rates"]["old"], opf=Ar["rel"]["rates"]["opf"],
                             n_rel=Ar["rel"]["n_poor"], gap=Ar["rel"]["gap"], anch_all=Ar["anch"]["rates"]["all"])
        LOS[k] = dict(groups=out, ahc_pov={lab: dict(anchored_all=v["rates"]["all"], u15_anchored=v["rates"]["u15"], opf_anchored=v["rates"]["opf"], gap_anchored=v["gap"]) for lab, v in sp_.items()},
                      ahc_pov_relative=rel_)
    OUT["housing_losers"] = LOS
    log("after-housing losers (central): " + "; ".join(f"{k} {v['groups']['All recipient households']['worse_hh_m']:.2f}m hh "
                                                      f"({v['groups']['All recipient households']['worse_people_m']:.2f}m people), avg A${v['groups']['All recipient households']['avg_loss']:.0f}" for k, v in LOS.items()))

    # ---- the five taxes by decile (Part 1 alone's five taxes, 2028-29; household_r11.B3's vectors) -------------------------------
    ADS = []
    for h in pop["HH"]:
        for a in h["adults"]:
            ADS.append((a["y"] + (a["Psq"] if a["cat"] in ("rec", "ap") else 0.0), id(a), a))
    ADS.sort(key=lambda t: t[0])
    NA = len(ADS)
    for i, (_, _, a) in enumerate(ADS):
        a["_dec"] = min(9, i * 10 // NA)
    ND = [sum(1 for _, _, a in ADS if a["_dec"] == d) for d in range(10)]
    f = m.funding_b(FY)
    k_sup, k_fos = [k for k in f if "Super" in k][0], [k for k in f if "fossil" in k][0]
    CSH = [x / sum(PC.CAP_SHARE) for x in PC.CAP_SHARE]
    WG = [0.0] * 10
    for _, _, a in ADS:
        if a["cat"] not in ("rec", "ap"):
            WG[a["_dec"]] += max(0.0, a["y"])
    WS = [x / sum(WG) for x in WG]
    PETROL_Q = [16.36, 27.60, 38.55, 47.00, 53.87]
    FUEL_DEC = [PETROL_Q[d // 2] / 2 / sum(PETROL_Q) for d in range(10)]
    co, ept, fos, sup = f[m._EPT] + f[m._MIN] + f[m._PRRT] + f[k_fos], f[m._EPT], f[k_fos], f[k_sup]
    REV28 = co + sup
    VEC = {"central": [co * CSH[d] for d in range(10)], "half_ept": [(co - 0.5 * ept) * CSH[d] + 0.5 * ept * WS[d] for d in range(10)],
           "two_thirds": [co / 3 * CSH[d] + 2 * co / 3 * WS[d] for d in range(10)], "fuel": [(co - fos) * CSH[d] + fos * FUEL_DEC[d] for d in range(10)]}
    VEC = {k: [v[d] + (sup if d == 9 else 0.0) for d in range(10)] for k, v in VEC.items()}
    TOPN = max(1, round(80_000 / W))
    TOP = {id(a) for _, _, a in ADS[-TOPN:]}

    def alloc_equal(B):
        bpa = [B[d] * 1e9 / (ND[d] * W) for d in range(10)]
        for h in pop["HH"]:
            for a in h["adults"]:
                a["_b"] = bpa[a["_dec"]]
            h["_b"] = sum(a["_b"] for a in h["adults"])

    def alloc_conc(share, seed):
        rng = random.Random(seed)
        cov = [VEC["central"][d] - (sup if d == 9 else 0.0) for d in range(10)]
        hold = set()
        for d in range(10):
            ids = [id(a) for _, _, a in ADS if a["_dec"] == d]
            hold |= set(rng.sample(ids, max(1, round(share * len(ids)))))
        per_hold = [cov[d] * 1e9 / (max(1, round(share * ND[d])) * W) for d in range(10)]
        per_top = sup * 1e9 / (TOPN * W)
        for h in pop["HH"]:
            for a in h["adults"]:
                a["_b"] = (per_hold[a["_dec"]] if id(a) in hold else 0.0) + (per_top if id(a) in TOP else 0.0)
            h["_b"] = sum(a["_b"] for a in h["adults"])

    HS = sorted(pop["HH"], key=lambda h: h["cur"] / h["e"])
    NH = len(HS)
    for i, h in enumerate(HS):
        h["_hdec"] = min(9, i * 10 // NH)
    BOUNDS = [HS[min(NH - 1, (d + 1) * NH // 10)]["cur"] / HS[min(NH - 1, (d + 1) * NH // 10)]["e"] for d in range(9)]

    def by_hdec():
        out = []
        for d in range(10):
            L = [h for h in HS if h["_hdec"] == d]
            na = sum(len(h["adults"]) for h in L)
            out.append(dict(per_hh=sum(h["_b"] for h in L) / len(L), per_adult=sum(h["_b"] for h in L) / na,
                            share=100 * sum(h["_b"] for h in L) * W / 1e9 / REV28))
        return out

    TAX = {}
    for k in VEC:
        alloc_equal(VEC[k])
        TAX[k] = by_hdec()
    for sh in (0.5, 0.25):
        acc = None
        for s in range(5):
            alloc_conc(sh, 20261021 + s)
            r = by_hdec()
            acc = r if acc is None else [{kk: acc[d][kk] + r[d][kk] for kk in r[d]} for d in range(10)]
        TAX[f"conc{int(100 * sh)}"] = [{kk: v / 5 for kk, v in acc[d].items()} for d in range(10)]
    HDEC = []
    for d in range(10):
        L = [h for h in HS if h["_hdec"] == d]
        vals = {k: TAX[k][d]["per_hh"] for k in TAX}
        HDEC.append(dict(decile=d + 1, upper_equiv_disp_income=(BOUNDS[d] if d < 9 else None), hh_m=len(L) * W / 1e6,
                         adults_per_hh=sum(len(h["adults"]) for h in L) / len(L), central=vals["central"], low=min(vals.values()), high=max(vals.values()),
                         low_var=min(vals, key=vals.get), high_var=max(vals, key=vals.get), variants=vals,
                         per_adult_central=TAX["central"][d]["per_adult"], share_central=TAX["central"][d]["share"]))
    OUT["tax_by_hdec"] = dict(fy=FY, five_taxes_bn=REV28, rows=HDEC, by_variant=TAX,
                              note="A$ a year per household, 2028-29, the five taxes (A$%.1fbn) allocated to adults by Table 6.24a's rule and the variants of Table F4-104; "
                                   "households ranked by current-rules equivalised disposable income (h['cur']/h['e'], A$ a year); conc variants: mean of 5 draws" % REV28)

    # ---- reach after funding, households and adults, at A$1 and A$5 a week (central allocation and every variant)
    def reach(key, thr):
        hh_b = sum(1 for h in pop["HH"] if h[key] - h["_b"] > thr) / NH
        hh_w = sum(1 for h in pop["HH"] if h[key] - h["_b"] < -thr) / NH
        nad = sum(len(h["adults"]) for h in pop["HH"])
        ad_b = sum(len(h["adults"]) for h in pop["HH"] if h[key] - h["_b"] > thr) / nad
        # adults on an individual basis: each adult's equal share of the household gain less the tax allocated to that adult
        ad_i = sum(1 for h in pop["HH"] for a in h["adults"] if h[key] / len(h["adults"]) - a["_b"] > thr) / nad
        return dict(hh_better=100 * hh_b, hh_worse=100 * hh_w, adults_in_hh_better=100 * ad_b, adults_individual_better=100 * ad_i)

    REACH = {}
    for k, key in DES.items():
        nad = sum(len(h["adults"]) for h in pop["HH"])
        before = dict(hh=100 * sum(1 for h in pop["HH"] if h[key] > 1) / NH, adults_in_hh=100 * sum(len(h["adults"]) for h in pop["HH"] if h[key] > 1) / nad,
                      hh_5pw=100 * sum(1 for h in pop["HH"] if h[key] > 260) / NH, adults_in_hh_5pw=100 * sum(len(h["adults"]) for h in pop["HH"] if h[key] > 260) / nad)
        REACH[k] = dict(before=before)
        for vk in ("central", "half_ept", "two_thirds", "fuel"):
            alloc_equal(VEC[vk])
            REACH[k][vk] = dict(a1=reach(key, 1.0), a5pw=reach(key, 260.0))
        for sh in (0.5,):
            alloc_conc(sh, 20261021)
            REACH[k]["conc50"] = dict(a1=reach(key, 1.0), a5pw=reach(key, 260.0))
    OUT["reach"] = REACH
    # [round B2] gains, taxes borne, net and shares better / worse off by decile of equivalised household income (central allocation)
    alloc_equal(VEC["central"])
    DEC = {}
    for k, key in DES.items():
        rows_ = []
        for d in range(10):
            Ld = [h for h in HS if h["_hdec"] == d]
            n_ = len(Ld)
            rows_.append(dict(decile=d + 1, gain=sum(h[key] for h in Ld) / n_, tax=sum(h["_b"] for h in Ld) / n_, net=sum(h[key] - h["_b"] for h in Ld) / n_,
                              better=100 * sum(1 for h in Ld if h[key] - h["_b"] > 1) / n_, worse=100 * sum(1 for h in Ld if h[key] - h["_b"] < -1) / n_,
                              better_5pw=100 * sum(1 for h in Ld if h[key] - h["_b"] > 260) / n_, gaining_before=100 * sum(1 for h in Ld if h[key] > 1) / n_))
        DEC[k] = rows_
    OUT["deciles_after_funding"] = DEC
    log("after funding, central, households better (A$1 / A$5 a week): " + "; ".join(f"{k} {v['central']['a1']['hh_better']:.1f} / {v['central']['a5pw']['hh_better']:.1f}" for k, v in REACH.items()))

    # ---- Green Book weights: equivalised disposable income (current rules, before housing costs), persons; weights (median / y)^1.3 by
    # quintile of persons (Green Book 2022, Annex A3), applied to every household cash flow: gains and the taxes allocated (central)
    alloc_equal(VEC["central"])
    pairs = sorted((((h["cur"] + h["cra"]) / h["e"]), id(h), h) for h in pop["HH"])
    totp = sum(h["np"] for _, _, h in pairs)
    c = 0.0
    QM = [[0.0, 0.0] for _ in range(5)]
    med = None
    for y, _, h in pairs:
        q = min(4, int(5 * c / totp))
        h["_q"] = q
        QM[q][0] += y * h["np"]; QM[q][1] += h["np"]
        if med is None and c + h["np"] >= totp / 2:
            med = y
        c += h["np"]
    QMEAN = [a / b for a, b in QM]
    OUT["gb_quintiles"] = dict(median=med, means=QMEAN)

    def gb(key, eps, tax_scale, by="quintile"):
        """Weighted sum (A$bn) of household gains and of the taxes allocated (scaled by tax_scale), and the tax-weighted mean weight."""
        G = Tw = Tu = 0.0
        for _, _, h in pairs:
            y = QMEAN[h["_q"]] if by == "quintile" else max((h["cur"] + h["cra"]) / h["e"], 0.2 * med)
            w = (med / y) ** eps
            G += w * h[key]
            Tw += w * h["_b"] * tax_scale
            Tu += h["_b"] * tax_scale
        return G * W / 1e9, Tw * W / 1e9, (Tw / Tu if Tu else 1.0)

    OUT["gb_raw"] = {k: {str(e): dict(zip(("G", "T", "wbar"), gb(key, e, 1.0))) for e in (0.0, 0.5, 1.0, 1.3, 1.5, 2.0)} for k, key in DES.items()}
    OUT["gb_raw_decile_ind"] = {k: {str(e): dict(zip(("G", "T", "wbar"), gb(key, e, 1.0, by="hh"))) for e in (1.3,)} for k, key in DES.items()}
    OUT["gb_pairs_rev"] = REV28
    # per-quintile sums (A$bn) of household gains and of the central allocation of the five taxes, so any weight can be applied exactly
    OUT["gb_q"] = {k: dict(G=[sum(h[key] for _, _, h in pairs if h["_q"] == q) * W / 1e9 for q in range(5)],
                           T=[sum(h["_b"] for _, _, h in pairs if h["_q"] == q) * W / 1e9 for q in range(5)]) for k, key in DES.items()}

# ======================================================================================================================
# 3. --years: household flows every year for the fiscal path
# ======================================================================================================================
if ARGS.years:
    YRS = {}
    T28 = PC.CSR["rule"]["threshold_2829"]
    cs28 = m.child_rate(FY)
    for fy in PC.Y:
        pop_t = pop if fy == FY else mk(fy)
        Wt = pop_t["W"]
        T = T28 * (1 + WAGE) ** (yr(fy) - 2028)
        cs = m.child_rate(fy)
        curf = cur_fn_y(fy)
        gross = sum(len(h["kids"]) * cs for h in pop_t["HH"]) * Wt / 1e9
        f1_ = flows(pop_t, fy, *p1_fns(fy, T), curf)
        row = dict(gross_hh=gross, cs=cs, p1=f1_, table=dict(S=PC.CSR["years"][fy]["univ_hh"] + PC.CSR["years"][fy]["mo"], tm=PC.CSR["years"][fy]["tm"],
                                                            bh=PC.CSR["years"][fy]["bh"]["0.2"], inc=PC.CSR["years"][fy]["inc"]))
        for lab, D in (("star_paper", STAR["D"]), ("star_m1", D_M1), ("star_m2", D_M2)):
            row[lab] = flows(pop_t, fy, *star_fns(fy, T, D * cs / cs28), curf)
        row["cra75"] = cra_rise(pop_t, fy)
        row["cra_total_hh"] = pop_t["cra_total"]
        row["cra_fiscal"] = PC.cra_cost(fy)
        lc_ = PC.lift_cost(fy, 0.0, pop_t["F"])
        row["ae"] = PC.targeted_package(fy, pop_t["F"], 60.0)["autoenrol"]
        # the package: FTB A increment (CPI), its 20c taper above the CPI-indexed maximum-rate test, the credit (wage-indexed), responses
        ixc, ixw = (1 + CPI) ** (yr(fy) - 2028), (1 + WAGE) ** (yr(fy) - 2028)
        Dp, test_t = PKG_IE["D"] * ixc, PC.FTB_A_MAXTEST * (1 + CPI) ** (yr(fy) - 2026)
        Ct, cut_t = C * ixw, H.EITC_CUT * ixw
        famt = [h for h in pop_t["HH"] if h["kids"]]
        isup = lambda h: any(a["incsup"] for a in parents(h))
        inc_ = lambda h, atis: len(h["kids"]) * Dp if isup(h) else max(0.0, len(h["kids"]) * Dp - H.FTB_TAPER * max(0.0, sum(atis) - test_t))
        ftb_cost = sum(inc_(h, [a["ati"] for a in parents(h)]) for h in famt) * Wt / 1e9
        # responses (household_r11.resp's form, by year) and the income effect on the increment (household_r13.inc_effect's form, by year)
        rf = rc = ie = 0.0
        for h in pop_t["HH"]:
            par = parents(h) if h["kids"] else []
            atis = [a["ati"] for a in par]
            on_ftb = bool(h["kids"]) and not isup(h)
            w_ftb = H.FTB_TAPER if (on_ftb and test_t < sum(atis) < test_t + len(h["kids"]) * Dp / H.FTB_TAPER) else 0.0
            for a in h["adults"]:
                y = a["y"]
                if y <= 0:
                    continue
                on_c = a["cat"] == "nr" or (a["cat"] in ("rec", "ap") and a["prog"] in (H.JS, H.ST, H.PP))
                w_cr = 0.0
                if on_c and Ct > 0:
                    if y < Ct / 0.2:
                        w_cr = -0.2
                    elif cut_t - Ct / 0.2 < y < cut_t:
                        w_cr = 0.2
                w_f = w_ftb if a in par else 0.0
                if not (w_cr or w_f):
                    continue
                base_y = y + (a["Psq"] if a["cat"] in ("rec", "ap") else 0.0)
                mo = (m.old_tax(base_y + 100, fy) - m.old_tax(base_y, fy)) / 100
                w_c = 0.0
                if a in par:
                    bump = list(atis); bump[par.index(a)] += 100.0
                    w_c = (sum(H.cur_ab(h, fy, atis)) - sum(H.cur_ab(h, fy, bump))) / 100
                den = 1 - mo - w_c
                if den <= 0.02:
                    continue
                for w, which in ((w_f, "f"), (w_cr, "c")):
                    if not w:
                        continue
                    r_ = max(0.02, den - w) / den
                    c_ = -y * (r_ ** H.PKG_EPS - 1) * (mo + w_c + w)
                    if which == "f":
                        rf += c_
                    else:
                        rc += c_
            if h["kids"]:
                gain = inc_(h, atis)
                y_nr = sum(a["y"] for a in par if a["cat"] == "nr" and a["y"] > 0)
                if gain > 0 and y_nr > 0:
                    for i, a in enumerate(par):
                        if a["y"] <= 0 or a["cat"] != "nr":
                            continue
                        bump = list(atis); bump[i] += 100.0
                        w_n = (gain - inc_(h, bump)) / 100
                        mo = (m.old_tax(a["y"] + 100, fy) - m.old_tax(a["y"], fy)) / 100
                        ie += min(a["y"], H.MPE_CP * gain * a["y"] / y_nr) * (mo + w_n)
        ato_t, Rn_t = PC._ato_units(fy, 0.0, 0.0)
        rp_t = [p_ for p_ in PC.recipient_points(fy, 0.0, pop_t["F"]) if p_[5] == "rec"]
        wrec_t = sum(p_[1] for p_ in rp_t)
        credit = 0.98 * (sum(a["n"] * H.eitc_low(a["y"], Ct, cut_t) for a in ato_t) +
                         sum(w * Rn_t / wrec_t * H.eitc_low(y, Ct, cut_t) for prog, w, y, *_ in rp_t if prog in (H.JS, H.ST, H.PP))) / 1e9
        row["pkg"] = dict(ftb=ftb_cost, resp_ftb=rf * Wt / 1e9, resp_credit=rc * Wt / 1e9, ie=ie * Wt / 1e9, credit=credit, D=Dp, C=Ct)
        row["floor_hh"] = lc_["static"] + lc_["new"] + lc_.get("caseload", 0.0)
        YRS[fy] = row
        log(f"{fy}: P1 S {f1_['S']:.2f} tm {f1_['tm']:.2f} bh {f1_['bh']:.2f} inc {f1_['inc']:.2f} (table S {row['table']['S']:.2f}); "
            f"P* m2 total {tot4(row['star_m2']):.2f} vs P1 {tot4(f1_):.2f}; CRA+75 {row['cra75']:.2f}; pkg ftb {ftb_cost:.2f} credit {credit:.2f}")
    OUT["years"] = YRS

json.dump(OUT, open(ARGS.out, "w"), indent=1, default=float)
log(f"wrote {ARGS.out}")
