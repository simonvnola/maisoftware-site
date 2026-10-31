"""optionb_fiscal.py: option B fiscal paths, stress test, phased start and appraisal, from the paper's fiscal model (partF.py in its
setup-only mode with the F3 and F4 switches, as partF_r11b.py loads it) and the household runs of optionb_hh.py (runs/*.json).

Designs, Stage 1 continuing, no dividend, no wealth tax, no fund, the five taxes to the durable account (Part 1 alone's rule, Table F4-103):
  p1       Part 1 alone: partc.design_c('a', fy, 0, floor) + implementation, exactly Table F4-102 (asserted);
  star_m2  P* re-costed (the option B recommendation): Part 1 with its child payment replaced by P*'s (Part 1's G schedule, no supplement-only
           schedule) and Rent Assistance +75%: Part 1 + k x (P*'s household rule flows - Part 1's) + Rent Assistance +75% (household synthetic),
           k = gc / gross_hh as partc.cs_rule_adj; the per-child amount is solved in optionb_hh.py so 2028-29 equals Part 1, then moves with
           the child supplement; Rent Assistance with its CPI-indexed rates against the model's rents;
  star_m1  the same with automatic enrolment of non-lodgers (partc.targeted_package's autoenrol), re-solved at Part 1's 2028-29 cost;
  star     P* as household_r13.py costed it (per-child A$6,973 with enrolment), on the fiscal model's basis;
  pkg      the targeted package charged the income effect (Table 5.4i): the floor part of Part 1 (lift, caseload, protections) + enrolment +
           Rent Assistance +75% + the earned-income credit (fiscal ATO units, parameters wage-indexed: ASSUMPTION) + k x (FTB A increment,
           CPI-indexed, + its taper response + income effect) + the credit's response + implementation.
Funding (each design): the five taxes (partc.stack_by_measure less the wealth tax and its interaction line); the balance carried at the debt
rate; a negative balance after 2031-32 levied (partF_r11.C3's recursion). Outputs: net cost, % of GDP, taxes, margin, advance, levy,
balance, cash balance and net debt against baseline; per household configuration (3 seeds x 3 calibrations) the headline fiscal results.
Stress test: a joint Monte Carlo of tax yield, behavioural responses, cost overruns, household calibration and the AI path (distributions in
DIST, from the paper's tested ranges; additive per-year deltas from the fiscal model's own runs at the tested points: ASSUMPTION).
Phased start: the floor (and Rent Assistance) in 2028-29, the child payment from 2029-30. Appraisal: first-year net benefit, break-even
poverty-gap weights on Table 6.34's method and the complete accounting, Green Book weights (elasticity 1.3, by quintile) and the
break-even inequality aversion. Run (after optionb_hh.py runs): python3 -I optionb_fiscal.py. Writes runs/fiscal.json. Stdlib only."""
import contextlib, glob, importlib.util, io, json, math, os, random, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))
HERE = os.path.join(ROOT, "supplementary")
T0 = time.time()
log = lambda msg: print(f"[{time.time() - T0:.0f}s] {msg}", flush=True)
os.environ["PARTF_SETUP_ONLY"] = "1"; os.environ["PARTF3"] = "1"; os.environ["PARTF4"] = "1"
_sp = importlib.util.spec_from_file_location("partF_ob", os.path.join(HERE, "partF.py"))
PF = importlib.util.module_from_spec(_sp)
try:
    with contextlib.redirect_stdout(io.StringIO()):
        _sp.loader.exec_module(PF)
except Exception as e_:
    if type(e_).__name__ != "SetupDone":
        raise
for k_ in ("PARTF_SETUP_ONLY", "PARTF3", "PARTF4"):
    os.environ.pop(k_, None)
assert PF.F3MODE and PF.F4MODE
pc, m = PF.pc, PF.m
Y, GDP, I_ = PF.Y, PF.GDP, m.INT_RATE
PF.MODE["eff"] = False
PF.F2SW["review"] = True
TJ = lambda fn: json.load(open(os.path.join(HERE, "tables", fn)))
R11 = TJ("partf4_r11_facts.json")
RB = TJ("partf4_r10b_facts.json")["summary"]["none"]
CSRY = pc.CSR["years"]
tot4 = lambda f: f["S"] + f["tm"] + f["bh"] + f["inc"]
_LC0 = pc.lift_cost


# ======================================================================================================================
# 1. Part 1 alone by year (Table F4-102) and its pieces
# ======================================================================================================================
def p1_rows():
    out = {}
    for fy in Y:
        d_ = pc.design_c("a", fy, 0.0, pc.floor_pa(fy), takeup=PF.TAKEUP)
        impl = pc.impl_c(fy, 0.0)
        child = d_["gc"] + d_["ftb_topup"] - d_["rep"]
        out[fy] = dict(d=d_, net=d_["net"] + impl, impl=impl, child=child, floor=d_["net"] - child, gc=d_["gc"], k=d_["gc"] / CSRY[fy]["gross_hh"],
                       lift=d_["lift_static"] + d_["lift_new"] + d_["caseload"], cs_bh=d_["cs_bh"] - d_["cs_inc"], cs_inc=d_["cs_inc"], cs_tm=d_["cs_tm"])
    return out


P1 = p1_rows()
for fy in Y:
    assert abs(P1[fy]["net"] - R11["c1"]["years"][fy]["net_u"]) < 1e-6, fy
    assert abs(sum(v for k, v in m.replaced_payments(fy).items() if "Family Tax" in k) - P1[fy]["d"]["rep"]) < 1e-6, "Stage 1 replaces only FTB"
REV = {fy: {k: v for k, v in pc.stack_by_measure(fy).items() if k not in ("wealth", "pitx")} for fy in Y}
REVT = {fy: sum(REV[fy].values()) for fy in Y}
log(f"Part 1 alone reproduces Table F4-102; 2028-29 net {P1['2028-29']['net']:.2f}, child {P1['2028-29']['child']:.2f}, floor {P1['2028-29']['floor']:.2f}, k {P1['2028-29']['k']:.4f}")


def fund(net, rev=None, rev_mult=1.0, rate=True):
    """partF_r11.C3's durable-account recursion: net (fy -> A$bn incl. implementation)."""
    B, rows = 0.0, []
    for fy in Y:
        r_ = (REVT[fy] if rev is None else rev[fy]) * rev_mult
        Bp = B
        interest = I_ * Bp
        B = Bp + interest + r_ - net[fy]
        levy = 0.0
        if B < 0 and fy > PF.REPAY_BY:
            levy, B = -B, 0.0
        used = max(0.0, Bp - B) if Bp > 0 else 0.0
        rows.append(dict(fy=fy, rev=r_, net=net[fy], margin=r_ - net[fy], interest=interest, used=used, levy=levy, bal=B, ucb=r_ + levy - net[fy] + interest,
                         nd=-B, rate=(PF.levy_joint(P1[fy]["d"], 0.0, levy)[0] if (levy > 1e-9 and rate) else 0.0), pct=100 * net[fy] / GDP[fy]))
    lv = [r for r in rows if r["levy"] > 1e-9]
    neg = [r["fy"] for r in rows if r["bal"] < -1e-9]
    return dict(rows=rows, first=(lv[0]["fy"] if lv else None), total=sum(r["levy"] for r in rows), peak_bn=max((r["levy"] for r in rows), default=0.0),
                peak_rate=max((r["rate"] for r in rows), default=0.0), advance=max(0.0, -rows[0]["bal"]), surplus28=max(0.0, rows[0]["bal"]),
                repaid=next((r["fy"] for r in rows if r["bal"] >= 0), None), adv_years=len([fy for fy in neg if fy <= PF.REPAY_BY]),
                peak_bal=max(rows, key=lambda r: r["bal"])["bal"], peak_bal_fy=max(rows, key=lambda r: r["bal"])["fy"],
                ucb_neg=[r["fy"] for r in rows if r["ucb"] < -1e-9], nd_pos=[r["fy"] for r in rows if r["nd"] > 1e-9],
                short_from=next((r["fy"] for r in rows if r["fy"] > "2028-29" and r["margin"] < 0), None), levy46=rows[-1]["levy"], rate46=rows[-1]["rate"])


C0 = fund({fy: P1[fy]["net"] for fy in Y})
assert C0["first"] == RB["first"] and abs(C0["total"] - RB["levy46"]) < 1e-6
log(f"Part 1 alone funding reproduces Table F4-103: first levy {C0['first']}, levies {C0['total']:.1f}")

# ======================================================================================================================
# 2. Design paths from a household configuration
# ======================================================================================================================
RUNS = {}
for fn in sorted(glob.glob(os.path.join(ROOT, "runs", "*.json"))):
    if os.path.basename(fn) == "fiscal.json":
        continue
    j = json.load(open(fn))
    if "years" in j:
        RUNS[f"{j['cal']}_{j['seed']}"] = j
CEN = RUNS["central_20261016"]
log(f"household configurations: {sorted(RUNS)}")
DESIGNS = ("p1", "star_m2", "star_m1", "star", "pkg")


def paths(cfg, cra_basis="household"):
    """Net cost (A$bn incl. implementation) by design and year, and the pieces."""
    YR = cfg["years"]
    out = {d: {} for d in DESIGNS}
    pieces = {}
    cra28 = YR["2028-29"]["cra75"]
    for fy in Y:
        r, p = YR[fy], P1[fy]
        k = p["k"]
        caldiff = tot4(r["p1"]) - tot4(r["table"])                  # Part 1's rule flows under this configuration less the rule table
        p1 = p["net"] + k * caldiff
        cra = r["cra75"] if cra_basis == "household" else cra28 * r["cra_fiscal"] / YR["2028-29"]["cra_fiscal"]
        ae = r["ae"]
        star = {x: p1 + k * (tot4(r[x2]) - tot4(r["p1"])) + cra + (ae if x in ("star_m1", "star") else 0.0)
                for x, x2 in (("star_m2", "star_m2"), ("star_m1", "star_m1"), ("star", "star_paper"))}
        pk = r["pkg"]
        pkg = p["floor"] + p["impl"] + ae + cra + pk["credit"] + k * (pk["ftb"] + pk["resp_ftb"] + pk["ie"]) + pk["resp_credit"]
        out["p1"][fy] = p1
        for x in star:
            out[x][fy] = star[x]
        out["pkg"][fy] = pkg
        pieces[fy] = dict(k=k, caldiff=caldiff, cra=cra, ae=ae, child_p1=p["child"] + k * caldiff, floor=p["floor"], impl=p["impl"],
                          child_star_m2=p["child"] + k * caldiff + k * (tot4(r["star_m2"]) - tot4(r["p1"])), pkg_parts=pk,
                          star_flows={x: r[x] for x in ("star_m2", "star_m1", "star_paper")}, p1_flows=r["p1"], D=cfg["D"])
    return out, pieces


PATHS, PIECES = paths(CEN)
FUNDS = {d: fund(PATHS[d]) for d in DESIGNS}
PATHS_CF, _ = paths(CEN, cra_basis="fiscal")
FUNDS_CF = {d: fund(PATHS_CF[d]) for d in DESIGNS}
for d in DESIGNS:
    f_ = FUNDS[d]
    log(f"{d}: 2028-29 net {PATHS[d]['2028-29']:.2f}, 2045-46 {PATHS[d]['2045-46']:.2f}; advance {f_['advance']:.1f} repaid {f_['repaid']}; first levy {f_['first']}, "
        f"levies {f_['total']:.1f}, peak {100 * f_['peak_rate']:.2f}% | CRA on the fiscal model's path: first levy {FUNDS_CF[d]['first']}, levies {FUNDS_CF[d]['total']:.1f}")

# ---- every configuration
CFG = {}
for nm, cfg in RUNS.items():
    pa, _ = paths(cfg)
    CFG[nm] = {d: dict(net28=pa[d]["2028-29"], net46=pa[d]["2045-46"], sum=sum(pa[d].values()), **{k: v for k, v in fund(pa[d]).items() if k != "rows"}) for d in DESIGNS}
    CFG[nm]["D"] = cfg["D"]
    log(f"{nm}: " + "; ".join(f"{d} first {CFG[nm][d]['first']} ({CFG[nm][d]['total']:.0f})" for d in DESIGNS))


# ======================================================================================================================
# 3. Break-even yield (no levy before 2044-45) for each design
# ======================================================================================================================
def be_yield(net, year="2044-45"):
    ok = lambda mult: (lambda f_: f_ is None or f_ >= year)(fund(net, rev_mult=mult, rate=False)["first"])
    lo, hi = (0.5, 1.0) if ok(1.0) else (1.0, 1.6)
    for _ in range(30):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if ok(mid) else (mid, hi)
    return hi


BEY = {d: be_yield(PATHS[d]) for d in DESIGNS}
log("break-even yield for no levy before 2044-45: " + "; ".join(f"{d} {100 * v:.1f}%" for d, v in BEY.items()))

# ======================================================================================================================
# 4. Phased start: the floor (with or without Rent Assistance +75%) in 2028-29, the child payment from 2029-30
# ======================================================================================================================
PHASED = {}
for lab, d, with_cra in (("p1_floor_only", "p1", False), ("star_m2_floor_and_cra", "star_m2", True), ("star_m2_floor_only", "star_m2", False),
                         ("pkg_floor_cra_enrol", "pkg", True)):
    net = dict(PATHS[d])
    pz = PIECES["2028-29"]
    base28 = pz["floor"] + pz["impl"]
    if d == "pkg":
        net["2028-29"] = base28 + pz["ae"] + pz["cra"]
    else:
        net["2028-29"] = base28 + (pz["cra"] if with_cra else 0.0)
    f_ = fund(net)
    PHASED[lab] = dict(net28=net["2028-29"], advance=f_["advance"], repaid=f_["repaid"], first=f_["first"], total=f_["total"], peak_rate=f_["peak_rate"],
                       full_start=dict(advance=FUNDS[d]["advance"], first=FUNDS[d]["first"], total=FUNDS[d]["total"]), rows=f_["rows"])
    log(f"phased {lab}: 2028-29 net {net['2028-29']:.1f}, advance {f_['advance']:.1f} (full start {FUNDS[d]['advance']:.1f}); first levy {f_['first']} "
        f"(full {FUNDS[d]['first']}); levies {f_['total']:.1f} ({FUNDS[d]['total']:.1f})")


# ======================================================================================================================
# 5. Joint stress test
# ======================================================================================================================
@contextlib.contextmanager
def patched(**kw):
    save = {k: getattr(pc, k) for k in kw if k != "lift_k"}
    try:
        for k, v in kw.items():
            if k == "lift_k":
                def lc_k(fy, U, F, rmult=1.0, tau=0.0, _k=v):
                    d_ = dict(_LC0(fy, U, F, rmult, tau))
                    for key_ in ("static", "new", "caseload"):
                        d_[key_] *= _k
                    return d_
                pc.lift_cost = lc_k
            else:
                setattr(pc, k, v)
        yield
    finally:
        for k, v in save.items():
            setattr(pc, k, v)
        pc.lift_cost = _LC0


def p1_net_path():
    return {fy: pc.design_c("a", fy, 0.0, pc.floor_pa(fy), takeup=PF.TAKEUP)["net"] + pc.impl_c(fy, 0.0) for fy in Y}


BASE = {fy: P1[fy]["net"] for fy in Y}
DELTA = {}
for lab, kw in (("case_lo", dict(CASELOAD_EPS=PF.CASE["low"])), ("case_hi", dict(CASELOAD_EPS=PF.CASE["high"])),
                ("bh_01", dict(CS_BH_EPS="0.1")), ("bh_04", dict(CS_BH_EPS="0.4")), ("lift_134", dict(lift_k=1 / TJ("partf4full_facts.json")["val_share"]))):
    with patched(**kw):
        pth = p1_net_path()
    DELTA[lab] = {fy: pth[fy] - BASE[fy] for fy in Y}
# the AI path: the paper's displacement scenarios (GDP held), Part 1 alone's net cost and the five taxes (partF_r13.run's method)
DISPD = {}
for nm in pc.DISP:
    nd_, rd_ = {}, {}
    with pc.scenario(dict(kind="disp", **pc.DISP[nm])):
        for fy in Y:
            d_ = pc.design_c("a", fy, 0.0, pc.floor_pa(fy), takeup=PF.TAKEUP)
            wt, ept, oth, px = PF.comps4(fy)
            nd_[fy], rd_[fy] = d_["net"] + pc.impl_c(fy, 0.0), ept + oth
    c_rev = {}
    for fy in Y:
        wt, ept, oth, px = PF.comps4(fy)
        c_rev[fy] = ept + oth
    DISPD[nm] = dict(dnet={fy: nd_[fy] - BASE[fy] for fy in Y}, drev={fy: rd_[fy] - c_rev[fy] for fy in Y})
    assert all(abs(c_rev[fy] - REVT[fy]) < 1e-6 for fy in Y), "comps4 central != the five taxes"
log("stress deltas 2035-36: " + "; ".join(f"{k} {v['2035-36']:+.2f}" for k, v in DELTA.items()) + "; displacement " +
    "; ".join(f"{nm} net {v['dnet']['2035-36']:+.1f} rev {v['drev']['2035-36']:+.1f}" for nm, v in DISPD.items()))


def bh_ratio_delta(fy, e):
    """Part 1's taper-response delta at elasticity e as a share of its own taper response (piecewise linear through 0.1, 0.2, 0.4)."""
    b = P1[fy]["cs_bh"]
    if e <= 0.2:
        return DELTA["bh_01"][fy] / b * (0.2 - e) / 0.1
    return DELTA["bh_04"][fy] / b * (e - 0.2) / 0.2


def case_delta(fy, e):
    return DELTA["case_lo"][fy] * (0.39 - e) / (0.39 - 0.21) if e <= 0.39 else DELTA["case_hi"][fy] * (e - 0.39) / (0.56 - 0.39)


DIST = dict(yield_=("triangular", 0.8, 1.0, 1.2, "five taxes' yield as a share of the costings: Table 6.14's 80% and 120% scenarios as the ends, mode at the costing"),
            caseload=("triangular", 0.21, 0.39, 0.56, "caseload elasticity: partF.CASE low / central / high (Table 6.14g's 0.56)"),
            eti=("triangular", 0.1, 0.2, 0.4, "taxable-income elasticity of the response to the family-payment tapers: Table 6.13 / F4-106's 0.1, 0.2, 0.4"),
            mpe=("triangular", 0.05, 0.16, 0.29, "labour response (income effect per dollar of net gain), scaled into the child payment's income effect: Tables 6.13, F4-114"),
            overrun=("triangular", 0.0, 0.0, 2.0, "cost overrun, A$bn a year nominal from 2028-29: Table 6.14g's A$1bn and A$2bn cases; one-sided, mode nil"),
            lift_k=("triangular", 1.0, 1.0, 1.34, "floor costing: the model's own (mode) to the PBO's basis (x1.34, Table 6.14g)"),
            calibration=("discrete", ["central", "rec075", "tilt17"], [1 / 3, 1 / 3, 1 / 3], "household calibration: central, pensioners' other income 25% lower, FTB-consistent (Table 6.14g's rows); equal weights ASSUMPTION"),
            ai=("discrete", ["none", "moderate", "severe"], [0.85, 0.10, 0.05], "AI path: the paper's displacement scenarios (Table 6.18b; GDP held); the paper gives no probabilities, so 10% moderate and 5% severe is an ASSUMPTION"))
CAL_PATHS = {c: paths(RUNS[f"{c}_20261016"])[0] for c in ("central", "rec075", "tilt17") if f"{c}_20261016" in RUNS}
CAL_PIECES = {c: paths(RUNS[f"{c}_20261016"])[1] for c in CAL_PATHS}


def draw_net(d, cal, e_case, e_bh, mpe, over, lk, ai):
    pth, pcs = CAL_PATHS[cal][d], CAL_PIECES[cal]
    out = {}
    for fy in Y:
        p, q = P1[fy], pcs[fy]
        k = p["k"]
        v = pth[fy] + case_delta(fy, e_case) + (lk - 1.0) * p["lift"] + over
        rb = bh_ratio_delta(fy, e_bh)
        s = mpe / 0.16 - 1.0
        if d == "p1":
            v += rb * p["cs_bh"] + s * p["cs_inc"]
        elif d == "pkg":
            pk = q["pkg_parts"]
            v += rb * (k * pk["resp_ftb"] + pk["resp_credit"]) + s * k * pk["ie"]
        else:
            fl = q["star_flows"][{"star_m2": "star_m2", "star_m1": "star_m1", "star": "star_paper"}[d]]
            v += rb * k * fl["bh"] + s * k * fl["inc"]
        if ai != "none":
            v += DISPD[ai]["dnet"][fy]
        out[fy] = v
    return out


def mc(n=4000, seed=20261031, use_cal=True, use_ai=True, designs=DESIGNS, one_sided=True):
    rng = random.Random(seed)
    res = {d: [] for d in designs}
    for _ in range(n):
        y_ = rng.triangular(0.8, 1.2, 1.0)
        ec = rng.triangular(0.21, 0.56, 0.39)
        eb = rng.triangular(0.1, 0.4, 0.2)
        mp = rng.triangular(0.05, 0.29, 0.16)
        ov = rng.triangular(0.0, 2.0, 0.0)
        lk = rng.triangular(1.0, 1.34, 1.0)
        if not one_sided:
            ov, lk = 0.0, 1.0
        cal = rng.choice(sorted(CAL_PATHS)) if use_cal else "central"
        ai = rng.choices(["none", "moderate", "severe"], [0.85, 0.10, 0.05])[0] if use_ai else "none"
        rev = {fy: REVT[fy] * y_ + (DISPD[ai]["drev"][fy] if ai != "none" else 0.0) for fy in Y}
        for d in designs:
            f_ = fund(draw_net(d, cal, ec, eb, mp, ov, lk, ai), rev=rev, rate=False)
            res[d].append(f_["first"])
    out = {}
    order = Y + [None]
    idx = lambda f_: order.index(f_) if f_ in order else len(Y)
    for d, v in res.items():
        n_ = len(v)
        s_ = sorted(idx(x) for x in v)
        pct = lambda q: (order[s_[min(n_ - 1, int(q * n_))]] or "none to 2045-46")
        out[d] = dict(p_before_2044_45=sum(1 for x in v if x is not None and x < "2044-45") / n_, p_before_2034_35=sum(1 for x in v if x is not None and x < "2034-35") / n_,
                      p_any_to_2045_46=sum(1 for x in v if x is not None) / n_, p10=pct(0.10), p50=pct(0.50), p90=pct(0.90), n=n_)
    return out


MC = dict(main=mc(), no_ai=mc(use_ai=False), no_cal=mc(use_cal=False), symmetric=mc(use_ai=False, one_sided=False), yield_only=None)


def mc_yield_only(n=4000, seed=20261031):
    rng = random.Random(seed)
    res = {d: [] for d in DESIGNS}
    for _ in range(n):
        y_ = rng.triangular(0.8, 1.2, 1.0)
        for d in DESIGNS:
            res[d].append(fund(PATHS[d], rev_mult=y_, rate=False)["first"])
    return {d: dict(p_before_2044_45=sum(1 for x in v if x is not None and x < "2044-45") / n, p_before_2034_35=sum(1 for x in v if x is not None and x < "2034-35") / n) for d, v in res.items()}


MC["yield_only"] = mc_yield_only()
for k, v in MC.items():
    log(f"MC {k}: " + "; ".join(f"{d} {100 * r['p_before_2044_45']:.0f}% / {100 * r['p_before_2034_35']:.0f}%" + (f" (median {r['p50']}, p10 {r['p10']}, p90 {r['p90']})" if 'p50' in r else "") for d, r in v.items()))

# ======================================================================================================================
# 5b. Table 6.14g's sensitivity cases (Table F4-106) on each design (Part 1 reproduces F4-106; checked in the output)
# ======================================================================================================================
def fund_annual(net, rev):
    """Table F4-106's 'safeguard read literally' (partF_r11b.part1 rule='annual', advance levied at once)."""
    B, A5, rows = 0.0, None, []
    for fy in Y:
        S = rev[fy] - net[fy]
        levy = 0.0
        B *= 1 + I_
        if fy <= PF.REPAY_BY:
            B += S
        else:
            if B < 0 and A5 is None:
                A5 = -B
                levy, B = -B, 0.0
            if S >= 0:
                B += S
            else:
                levy += -S
        rows.append(dict(fy=fy, levy=levy, rate=(PF.levy_joint(P1[fy]["d"], 0.0, levy)[0] if levy > 1e-9 else 0.0)))
    lv = [r for r in rows if r["levy"] > 1e-9]
    return dict(first=(lv[0]["fy"] if lv else None), total=sum(r["levy"] for r in rows), peak_rate=max((r["rate"] for r in rows), default=0.0),
                peak_bn=max((r["levy"] for r in rows), default=0.0), rate46=rows[-1]["rate"])


def fund_five(net, rev):
    """Option (i)'s five-year rule for the advance (partF_r11b.part1 five=True): a shortfall after 2028-29 is met from kept surpluses or
    levied in its year, surpluses repay the advance first, and an advance still outstanding after 2031-32 is levied over five years."""
    A, K, rows = 0.0, 0.0, []
    for j, fy in enumerate(Y):
        S = rev[fy] - net[fy]
        levy = 0.0
        K *= 1 + I_
        if j == 0 or S >= 0:
            An = A * (1 + I_) + S
            if An >= 0:
                K, A = K + An, 0.0
            else:
                A = An
        else:
            A *= 1 + I_
            use = min(K, -S)
            K -= use
            levy = -S - use
        if A < 0 and fy > PF.REPAY_BY:
            k_left = max(1, 5 - (PF.yrs(fy) - PF.yrs(PF.REPAY_BY) - 1))
            inst = -A / k_left
            levy += inst
            A += inst
        rows.append(dict(fy=fy, levy=levy, rate=(PF.levy_joint(P1[fy]["d"], 0.0, levy)[0] if levy > 1e-9 else 0.0)))
    lv = [r for r in rows if r["levy"] > 1e-9]
    return dict(first=(lv[0]["fy"] if lv else None), total=sum(r["levy"] for r in rows), peak_rate=max((r["rate"] for r in rows), default=0.0))


_nz = os.path.join(ROOT, "runs", "noise", "rec075c_20261016.json")
if os.path.exists(_nz):                       # Table 6.14g's noise check (added after the Monte Carlo, which keeps its three calibrations)
    _pz, _qz = paths(json.load(open(_nz)))
    CAL_PATHS["rec075_c"], CAL_PIECES["rec075_c"] = _pz, _qz
_er = m.ERODE
m.ERODE = None
REV_HI = {fy: sum(v for k, v in pc.stack_by_measure(fy).items() if k not in ("wealth", "pitx")) for fy in Y}
m.ERODE = _er
REV_EPT50 = {fy: REVT[fy] - 0.5 * REV[fy]["ept"] for fy in Y}
REV_SUP50 = {fy: REVT[fy] - 0.5 * REV[fy]["super"] for fy in Y}
SENS_CASES = [("Central", {}, None, 1.0, False), ("High case: fuel-credit and minerals measures grow with nominal GDP", {}, REV_HI, 1.0, False),
              ("Five taxes yield 90% of the costings", {}, None, 0.9, False), ("Five taxes yield 80% of the costings", {}, None, 0.8, False),
              ("Excess profits tax yields 50% of the PBO costing", {}, REV_EPT50, 1.0, False), ("Superannuation measure yields 50% of the PBO costing", {}, REV_SUP50, 1.0, False),
              ("Caseload elasticity 0.56 (high)", dict(e_case=0.56), None, 1.0, False), ("Taxable-income elasticity 0.4 for the response to the family-payment tapers", dict(e_bh=0.4), None, 1.0, False),
              ("Labour response high (0.29) on the universal payment only", {}, None, 1.0, False),
              ("Labour response high (0.29), the child payment's income effect scaled", dict(mpe=0.29), None, 1.0, False),
              ("Labour response low (0.05), the same", dict(mpe=0.05), None, 1.0, False), ("Floor costed on the PBO's basis (lift x1.34)", dict(lk=1 / TJ("partf4full_facts.json")["val_share"]), None, 1.0, False),
              ("Cost overrun of A$1bn a year", dict(over=1.0), None, 1.0, False), ("Cost overrun of A$2bn a year", dict(over=2.0), None, 1.0, False),
              ("Combined downside: five taxes at 70%, labour response 0.29 (universal only)", {}, None, 0.7, False),
              ("Combined downside: five taxes at 70%, labour response 0.29, the income effect scaled", dict(mpe=0.29), None, 0.7, False),
              ("Household model calibrated to FTB's PBO path", dict(cal="tilt17"), None, 1.0, False),
              ("Household model: full-rate pensioners' other income 25% lower", dict(cal="rec075"), None, 1.0, False),
              ("Household model: the same pensioner variant, calibration started from the central result (a noise check)", dict(cal="rec075_c"), None, 1.0, False),
              ("Safeguard read literally: each year's shortfall after 2031-32 levied", {}, None, 1.0, True)]
SENS = {}
for d in DESIGNS:
    SENS[d] = []
    for lab, kw, rv, mult, annual in SENS_CASES:
        a = dict(cal="central", e_case=0.39, e_bh=0.2, mpe=0.16, over=0.0, lk=1.0, ai="none")
        a.update(kw)
        if a["cal"] not in CAL_PATHS:
            continue
        net = draw_net(d, a["cal"], a["e_case"], a["e_bh"], a["mpe"], a["over"], a["lk"], a["ai"])
        rev = {fy: (REVT[fy] if rv is None else rv[fy]) * mult for fy in Y}
        f_ = fund_annual(net, rev) if annual else fund(net, rev=rev)
        f5 = f_ if annual else fund_five(net, rev)
        SENS[d].append(dict(case=lab, first=f_["first"], total=f_["total"], peak_bn=f_["peak_bn"], peak_rate=f_["peak_rate"], rate46=f_["rate46"],
                            five=dict(first=f5["first"], total=f5["total"], peak_rate=f5["peak_rate"])))
log("sensitivity, Part 1 (check against F4-106) / P*: " + "; ".join(f"{a['case'][:28]} {a['first']} {a['total']:.1f} | {b['first']} {b['total']:.1f}" for a, b in zip(SENS["p1"], SENS["star_m2"])))

# ======================================================================================================================
# 6. Appraisal: first-year net benefit, break-even weights, Green Book weights
# ======================================================================================================================
H = CEN["design"]
D28, REV28 = RB["nb"]["d28"], REVT["2028-29"]
MEB = (D28[0] / REV28, D28[1] / REV28)
IMPL28 = P1["2028-29"]["impl"]
CASEL = CEN["fe28"]["caseload"]
k28 = P1["2028-29"]["k"]
OWN = dict(p1=CEN["fe28"]["total"], star_m2=CASEL + k28 * (CEN["flows_m2"]["bh"] + CEN["flows_m2"]["inc"]),
           star_m1=CASEL + k28 * (CEN["flows_m1"]["bh"] + CEN["flows_m1"]["inc"]), star=CASEL + k28 * (CEN["flows_star_paper"]["bh"] + CEN["flows_star_paper"]["inc"]),
           pkg=CASEL + H["pkg_ie"]["own"]["resp"] + H["pkg_ie"]["own"]["ie"])
HK = dict(p1="p1", star_m2="star_m2", star_m1="star_m1", star="star", pkg="pkg_ie")
APP = {}
for d in DESIGNS:
    h = H[HK[d]]
    G = h["gap_base"] - h["gap_rel"]
    Ga = h["gap_base"] - h["gap_anch"]
    cost = PATHS[d]["2028-29"]
    extra = cost - PATHS["p1"]["2028-29"]                          # cost above Part 1's, financed at the five taxes' excess burden
    Dlo, Dhi = D28[0] + MEB[0] * extra, D28[1] + MEB[1] * extra
    own = OWN[d]
    nb634 = (0.5 * G - IMPL28 - Dhi, G - IMPL28 - Dlo)              # Table 6.34's method, weights 1.5 to 2.0
    nbca = (nb634[0] - own, nb634[1] - 0.5 * own)                   # complete accounting (own behavioural costs at 1 low, 1/2 high)
    adv = cost - REV28                                              # the start-up advance charged at the five taxes' excess burden
    nbca_adv = (nbca[0] - MEB[1] * adv, nbca[1] - MEB[0] * adv)
    w634 = (1 + (IMPL28 + Dlo) / G, 1 + (IMPL28 + Dhi) / G)
    wca = (1 + (IMPL28 + Dlo + 0.5 * own) / G, 1 + (IMPL28 + Dhi + own) / G)
    wca_adv = (1 + (IMPL28 + Dlo + 0.5 * own + MEB[0] * adv) / G, 1 + (IMPL28 + Dhi + own + MEB[1] * adv) / G)
    wca_anch = (1 + (IMPL28 + Dlo + 0.5 * own) / Ga, 1 + (IMPL28 + Dhi + own) / Ga)
    # Green Book: weights (median / quintile mean)^eps on every household cash flow; the design's full 2028-29 cost (net cost incl.
    # implementation, i.e. the taxes and the advance) borne as the central allocation of the five taxes, plus excess burden at MEB
    q = CEN["gb_q"][HK[d]]
    med, qm = CEN["gb_quintiles"]["median"], CEN["gb_quintiles"]["means"]
    Tsum = sum(q["T"])

    def gbnb(eps, meb, full=True):
        w = [(med / qm[i]) ** eps for i in range(5)]
        Gw = sum(w[i] * q["G"][i] for i in range(5))
        wbar = sum(w[i] * q["T"][i] for i in range(5)) / Tsum
        burden = cost if full else REV28
        return Gw - wbar * burden * (1 + meb)

    def eps_star(meb, full=True):
        f0, f5 = gbnb(0.0, meb, full), gbnb(5.0, meb, full)
        if (f0 > 0) == (f5 > 0):
            return None
        lo, hi = 0.0, 5.0
        for _ in range(50):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if (gbnb(mid, meb, full) > 0) == (f0 > 0) else (lo, mid)
        return (lo + hi) / 2

    APP[d] = dict(cost28=cost, extra_over_p1=extra, gap_red_rel=G, gap_red_anch=Ga, own=own, fin=(Dlo, Dhi), nb634=nb634, nb_complete=nbca, nb_complete_adv=nbca_adv,
                  w_breakeven_634=w634, w_breakeven_complete=wca, w_breakeven_complete_adv=wca_adv, w_breakeven_complete_anch=wca_anch,
                  nb_vs_p1_complete=None, gb13=(gbnb(1.3, MEB[1]), gbnb(1.3, MEB[0])), gb13_first_year_taxes=(gbnb(1.3, MEB[1], False), gbnb(1.3, MEB[0], False)),
                  gb0=(gbnb(0.0, MEB[1]), gbnb(0.0, MEB[0])), eps_breakeven=(eps_star(MEB[0]), eps_star(MEB[1])),
                  eps_breakeven_first_year_taxes=(eps_star(MEB[0], False), eps_star(MEB[1], False)), cash=h["cash"])
for d in DESIGNS:
    if d == "p1":
        continue
    a, b = APP[d], APP["p1"]
    dG, dF = a["gap_red_rel"] - b["gap_red_rel"], a["own"] - b["own"]
    dD = (a["fin"][0] - b["fin"][0], a["fin"][1] - b["fin"][1])
    APP[d]["nb_vs_p1_complete"] = (0.5 * dG - dF - dD[1], dG - 0.5 * dF - dD[0])
    APP[d]["gb13_vs_p1"] = (a["gb13"][0] - b["gb13"][0], a["gb13"][1] - b["gb13"][1])
for d, a in APP.items():
    log(f"{d}: cost {a['cost28']:.2f} (+{a['extra_over_p1']:.2f}); gap red {a['gap_red_rel']:.2f}; own {a['own']:.2f}; NB complete {a['nb_complete'][0]:.1f} to {a['nb_complete'][1]:.1f}; "
        f"vs P1 {a['nb_vs_p1_complete']}; w* 6.34 {a['w_breakeven_634'][0]:.2f}-{a['w_breakeven_634'][1]:.2f}, complete {a['w_breakeven_complete'][0]:.2f}-{a['w_breakeven_complete'][1]:.2f}; "
        f"GB1.3 {a['gb13'][0]:.1f} to {a['gb13'][1]:.1f} (first-year taxes {a['gb13_first_year_taxes'][0]:.1f} to {a['gb13_first_year_taxes'][1]:.1f}); eps* {a['eps_breakeven']}")

OUT = dict(p1_rows={fy: dict(net=P1[fy]["net"], child=P1[fy]["child"], floor=P1[fy]["floor"], impl=P1[fy]["impl"], k=P1[fy]["k"], gdp=GDP[fy]) for fy in Y},
           rev={fy: dict(REV[fy], total=REVT[fy]) for fy in Y}, paths=PATHS, pieces=PIECES, funds={d: FUNDS[d] for d in DESIGNS},
           funds_cra_fiscal={d: {k: v for k, v in FUNDS_CF[d].items() if k != "rows"} for d in DESIGNS}, paths_cra_fiscal=PATHS_CF, configs=CFG, be_yield=BEY,
           phased=PHASED, mc=MC, dist=DIST, delta=DELTA, disp={nm: v for nm, v in DISPD.items()}, appraisal=APP, meb=MEB, d28=D28, rev28=REV28, impl28=IMPL28, int_rate=I_, sens=SENS)
json.dump(OUT, open(os.path.join(ROOT, "runs", "fiscal.json"), "w"), indent=1, default=float)
log("wrote runs/fiscal.json")
