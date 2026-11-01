"""optionb_shock.py: second-round effects of the paper's AI displacement scenarios (partc.DISP: moderate, employment-to-population −3
points, recipients +15%; severe, −8 points, +40%; phased in over 2032-33 to 2035-36), from the paper's own fiscal and household models.
Everything here is PROVISIONAL and marked so in the outputs.

A. Claims surge (fiscal model, partc.scn_vals under pc.scenario): displaced workers and extra recipients each year against the JobSeeker
   group's stock (AIHW counts scaled with the working-age population, ubi_model) and against the baseline flow of job losses the paper's
   sources give (the ABS 1.8% annual retrenchment rate, household.S1_RETRENCH, applied to the household model's earners). The model has no
   claims-processing volumes: none of the paper's sources gives Services Australia claim throughput.
B. Debt service on the floor (household model, 2028-29 population and 2035-36): displaced workers drawn at random (10 draws) from
   working-age earners not on a payment, pro rata to the shock (ep x adults), as partc._clawback_x removes them pro rata; each displaced
   household's income with the worker's earnings gone and (i) JobSeeker at today's rate (status quo), (ii) the floor (Part 1), (iii) the floor
   with Rent Assistance +75% (P*), partnered rates and the partner income test (linear taper to the cut-out: JobSeeker A$2,686.67 a fortnight,
   the floor's A$87,041 in 2028-29, Table F4-71), payments taxed at the old scale, current FTB kept, Rent Assistance paid as income support
   (household.cra_h); housing costs as the model carries them (mortgage repayments, rent). Shares and counts of displaced households whose
   housing costs exceed 30% and 50% of that income, medians by quintile, months a A$10,000 buffer covers the excess over 30%.
C. Forced sales (illustrative): mortgaged displaced households above 50% on each basis, against a PLACEHOLDER for annual dwelling sales
   (ABS or CoreLogic transfers: not in the paper's sources) and a stated elasticity range (sources named for the author); the excess profits
   tax at 90% and 80% of its costing on Part 1's and P*'s funding (optionb_fiscal.fund's rule).
D. Policy responses: automatic enrolment of the displaced (the take-up lift partc.targeted_package uses, 85% to 95%, on the extra
   recipients); a liquid-assets waiting period waiver (upper bound: every newly displaced worker paid 13 weeks sooner); the assets-test
   deferral and a mortgage protocol (mechanics only: the model has no assets).
Revised 1 November 2026 on the housing evidence report (optionb/housing_evidence_report_2026-11-01.md; item codes cited in the outputs): dwelling
transfers A1, the partner cut-out D3, buffers C1, means tests D1/D2, claims E1-E3, Budget F1-F3, rents G. The price elasticity is dropped (B).
Run: python3 -I optionb_shock.py (about 5 minutes). Writes runs/shock.json. Stdlib only."""
import contextlib, importlib.util, io, json, os, random, statistics, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))
HERE = os.path.join(ROOT, "supplementary")
T0 = time.time()
log = lambda msg: print(f"[{time.time() - T0:.0f}s] {msg}", flush=True)
OUT = dict(provisional=True)

# ======================================================================================================================
# A. fiscal model
# ======================================================================================================================
os.environ["PARTF_SETUP_ONLY"] = "1"; os.environ["PARTF3"] = "1"; os.environ["PARTF4"] = "1"
_sp = importlib.util.spec_from_file_location("partF_shock", os.path.join(HERE, "partF.py"))
PF = importlib.util.module_from_spec(_sp)
try:
    with contextlib.redirect_stdout(io.StringIO()):
        _sp.loader.exec_module(PF)
except Exception as e_:
    if type(e_).__name__ != "SetupDone":
        raise
for k_ in ("PARTF_SETUP_ONLY", "PARTF3", "PARTF4"):
    os.environ.pop(k_, None)
pc, m = PF.pc, PF.m
Y, I_ = PF.Y, m.INT_RATE
PF.MODE["eff"] = False
PF.F2SW["review"] = True
FIS = json.load(open(os.path.join(ROOT, "runs", "fiscal.json")))
JS_N25 = m.WORKING_AGE_REPLACED_2025["JobSeeker"] + m.WORKING_AGE_REPLACED_2025["Youth Allowance (other)"]
TAKE_NOW, TAKE_AUTO = pc.TAKEUP_NOW, pc.TAKEUP_AUTO
PHI_JS = m.HH_PROGRAMS[m._K_JS]["phi"]
SURGE = {}
for nm in pc.DISP:
    rows = {}
    prev = 0.0
    with pc.scenario(dict(kind="disp", **pc.DISP[nm])):
        for fy in Y:
            v = pc.scn_vals(fy)
            base = pc._ORIG["population"](fy)
            js = JS_N25 * m._wa_scale(fy)
            Bjs = m.hh_B(m._K_JS, fy)
            F = pc.floor_pa(fy)
            new = max(0.0, v["disp"] - prev)
            rows[fy] = dict(displaced=v["disp"], new_displaced=new, extra_recipients=v["dR"], js_stock=js, R=base["R"], R_wa=base["R_wa"], elig_adults=base["elig_adults"],
                            extra_over_js_stock=v["dR"] / js, status_quo_spend=v["dR"] * Bjs * (1 + PHI_JS) / 2 / 1e9, floor_spend=v["dR"] * F * (1 + PHI_JS) / 2 / 1e9,
                            enrol_surge_sq=v["dR"] * (TAKE_AUTO / TAKE_NOW - 1) * Bjs * (1 + PHI_JS) / 2 / 1e9,
                            enrol_surge_floor=v["dR"] * (TAKE_AUTO / TAKE_NOW - 1) * F * (1 + PHI_JS) / 2 / 1e9,
                            lawp_waiver_upper=new * 13 / 52 * F / 1e9, lawp_waiver_upper_sq=new * 13 / 52 * Bjs / 1e9, floor=F, js_rate=Bjs)
            prev = v["disp"]
    SURGE[nm] = rows
    log(f"{nm}: 2035-36 displaced {rows['2035-36']['displaced'] / 1e6:.2f}m, extra recipients {rows['2035-36']['extra_recipients'] / 1e6:.2f}m "
        f"({100 * rows['2035-36']['extra_over_js_stock']:.0f}% of the JobSeeker group's {rows['2035-36']['js_stock'] / 1e6:.2f}m); new displaced a year 2032-33 to 2035-36 "
        f"{rows['2032-33']['new_displaced'] / 1e3:.0f}k")
OUT["surge"] = SURGE

# ---- the excess profits tax at 90% / 80% of its costing (bank profits), Part 1 and P*
REVT = {fy: FIS["rev"][fy]["total"] for fy in Y}
EPT = {fy: FIS["rev"][fy]["ept"] for fy in Y}


def fund(net, rev):
    B, rows = 0.0, []
    for fy in Y:
        B = B * (1 + I_) + rev[fy] - net[fy]
        levy = 0.0
        if B < 0 and fy > PF.REPAY_BY:
            levy, B = -B, 0.0
        rows.append(dict(fy=fy, levy=levy, bal=B))
    lv = [r for r in rows if r["levy"] > 1e-9]
    return dict(first=(lv[0]["fy"] if lv else None), total=sum(r["levy"] for r in rows), peak_bn=max((r["levy"] for r in rows), default=0.0))


EPTS = {}
for d in ("p1", "star_m2", "pkg"):
    EPTS[d] = {}
    for mult in (1.0, 0.9, 0.8, 0.5):
        rev = {fy: REVT[fy] - (1 - mult) * EPT[fy] for fy in Y}
        EPTS[d][str(mult)] = dict(fund(FIS["paths"][d], rev), ept_loss_2035_36=(1 - mult) * EPT["2035-36"])
OUT["ept_sensitivity"] = EPTS
log("EPT at 90% / 80%: " + "; ".join(f"{d} {EPTS[d]['0.9']['first']} {EPTS[d]['0.9']['total']:.0f} / {EPTS[d]['0.8']['first']} {EPTS[d]['0.8']['total']:.0f}" for d in EPTS))

# ======================================================================================================================
# B. household model
# ======================================================================================================================
sys.argv = [sys.argv[0], "partf4"]
_hp = importlib.util.spec_from_file_location("hh_partf4", os.path.join(HERE, "household.py"))
H = importlib.util.module_from_spec(_hp)
_hp.loader.exec_module(H)
assert H.PC is not None
HPC, hm = H.PC, H.m
H.calibrate("2028-29")
JS_SINGLE_PF, JS_PART_PF = 824.90 + 8.80, 755.10 + 7.90           # [S3] 20 September 2026 rates incl. energy supplement (ubi_model, partc.LIFT_SUB)
JS_CUT_PF = 2_711.67                                              # evidence report D3: JobSeeker partner income cut-out, 29 October 2026 (the model's H17 value was 2,686.67)
CUT_FLOOR_2829 = 87_041.0 + (JS_CUT_PF - H.JS_PARTNER_CUTOFF_PF) * 26 * HPC.cpi_idx("2028-29")   # Table F4-71's floor cut-out, shifted by the same rise in the partner free area
TEN_LAB = dict(outright="Owner without a mortgage", mortgage="Owner with a mortgage", private="Private renter", public="Public renter", free="Rent-free and other")


def hh_income(h, fy, disp_a, basis):
    """Household disposable income (A$ a year) with the displaced adult's earnings gone and a payment under `basis`: 'sq' JobSeeker at today's
    rate, 'floor' the floor, 'star' the floor with Rent Assistance +75%; partner income test as a linear taper to the cut-out; the payment taxed
    at the old scale; other adults as now; current FTB kept; Rent Assistance as income support."""
    cpi = HPC.cpi_idx(fy)
    partnered = disp_a["role"] in ("CNC", "CWC")
    partner = None
    if partnered:
        partner = [b for b in h["adults"] if b is not disp_a and b["role"] == disp_a["role"]]
        partner = partner[0] if partner else None
    if basis == "sq":
        rate = (JS_PART_PF if partner else JS_SINGLE_PF) * 26 * cpi
        cut = JS_CUT_PF * 26 * cpi
    else:
        F = HPC.floor_pa(fy)
        rate = F * (JS_PART_PF / JS_SINGLE_PF if partner else 1.0)
        cut = CUT_FLOOR_2829 * cpi / HPC.cpi_idx("2028-29")
    py = (partner["y"] + (partner["Psq"] if partner["cat"] in ("rec", "ap") else 0.0)) if partner else 0.0
    pay = max(0.0, rate - 0.6 * max(0.0, py - (cut - rate / 0.6))) if partner else rate
    inc = pay - hm.old_tax(pay, fy)
    for b in h["adults"]:
        if b is disp_a:
            continue
        if b["cat"] in ("rec", "ap"):
            inc += b["Psq"] + H.supp(b, fy) + b["y"] - hm.old_tax(b["y"] + (b["Psq"] if b["prog"] != H.DSP else 0.0), fy)
        else:
            inc += b["y"] - hm.old_tax(b["y"], fy)
    inc += h["ftbA"] + h["ftbB"]
    cra = 0.0
    if h["ten"] == "private" and pay > 0:
        save = disp_a["incsup"]
        disp_a["incsup"] = True
        cra = H.cra_h(h, fy, 1.75 if basis == "star" else 1.0)
        disp_a["incsup"] = save
    return inc + cra, pay, cra


def run_year(fy, nm, draws=10, seed=20261101):
    pop = H.make(fy)
    W = pop["W"]
    H.mortgage_debt(pop)
    HH = pop["HH"]
    earners = [(h, a) for h in HH for a in h["adults"] if a["cat"] == "nr" and a["y"] > 0 and not a["old"]]
    n_adults = sum(len(h["adults"]) for h in HH)
    n_disp = int(round(pc.DISP[nm]["ep"] * n_adults))
    med_y = statistics.median(a["y"] for _, a in earners)
    acc = {}
    for dr in range(draws):
        rng = random.Random(seed + dr)
        for variant, pool in (("pro_rata", earners), ("below_median", [t for t in earners if t[1]["y"] <= med_y])):
            sel = rng.sample(pool, min(n_disp, len(pool)))
            seen = set()
            recs = []
            for h, a in sel:
                if id(h) in seen:            # one displaced worker per household (second earners in the same household are rare at 3% to 8%)
                    continue
                seen.add(id(h))
                r = dict(ten=h["ten"], q=h["q"], hc=h["hc"], debt=h["debt"], cur=h["cur"] + h["cra"], y_lost=a["y"], partnered=a["role"] in ("CNC", "CWC"))
                for basis in ("sq", "floor", "star"):
                    inc, pay, cra = hh_income(h, fy, a, basis)
                    r[basis] = dict(inc=inc, pay=pay, cra=cra, ratio=(h["hc"] / inc if inc > 0 else 99.0))
                r["ratio_before"] = h["hc"] / (h["cur"] + h["cra"]) if h["cur"] + h["cra"] > 0 else 99.0
                r["partner_cut"] = r["partnered"] and r["floor"]["pay"] <= 0
                r["partner_cut_sq"] = r["partnered"] and r["sq"]["pay"] <= 0
                _pt = [b for b in h["adults"] if b is not a and b["role"] == a["role"]] if r["partnered"] else []
                r["partner_earns"] = bool(_pt) and (_pt[0]["y"] + (_pt[0]["Psq"] if _pt[0]["cat"] in ("rec", "ap") else 0.0)) > 0
                recs.append(r)
            a_ = acc.setdefault(variant, [])
            a_.append(recs)
    res = {}
    for variant, lists in acc.items():
        def agg(f):
            vals = [f(recs) for recs in lists]
            return sum(vals) / len(vals)
        n_tot = agg(lambda recs: len(recs)) * W
        out = dict(displaced_households=n_tot, displaced_workers=n_disp * W, draws=draws,
                   by_tenure={t: agg(lambda recs, t=t: sum(1 for r in recs if r["ten"] == t)) * W for t in H.TEN},
                   partner_above_cutout=agg(lambda recs: sum(1 for r in recs if r["partner_cut"])) * W,
                   partner_above_cutout_sq=agg(lambda recs: sum(1 for r in recs if r["partner_cut_sq"])) * W,
                   partner_earns=agg(lambda recs: sum(1 for r in recs if r["partner_earns"])) * W,
                   partnered=agg(lambda recs: sum(1 for r in recs if r["partnered"])) * W)
        for basis in ("sq", "floor", "star"):
            b = {}
            for t in ("mortgage", "private"):
                sub = lambda recs, t=t: [r for r in recs if r["ten"] == t]
                b[t] = dict(n=agg(lambda recs: len(sub(recs))) * W,
                            over30=agg(lambda recs: sum(1 for r in sub(recs) if r[basis]["ratio"] > 0.3)) * W,
                            over50=agg(lambda recs: sum(1 for r in sub(recs) if r[basis]["ratio"] > 0.5)) * W,
                            over30_before=agg(lambda recs: sum(1 for r in sub(recs) if r["ratio_before"] > 0.3)) * W,
                            median_ratio=statistics.median(r[basis]["ratio"] for recs in lists for r in sub(recs)),
                            median_hc=statistics.median(r["hc"] for recs in lists for r in sub(recs)),
                            median_inc=statistics.median(r[basis]["inc"] for recs in lists for r in sub(recs)),
                            mean_pay=statistics.mean(r[basis]["pay"] for recs in lists for r in sub(recs)),
                            mean_cra=statistics.mean(r[basis]["cra"] for recs in lists for r in sub(recs)),
                            months_per_10k=statistics.median(10_000 / max(1.0, (r["hc"] - 0.3 * r[basis]["inc"]) / 12) for recs in lists for r in sub(recs) if r[basis]["ratio"] > 0.3) if any(r[basis]["ratio"] > 0.3 for recs in lists for r in sub(recs)) else None,
                            by_q=[dict(n=agg(lambda recs, q=q: sum(1 for r in sub(recs) if r["q"] == q)) * W,
                                       median_hc=(statistics.median(r["hc"] for recs in lists for r in sub(recs) if r["q"] == q) if any(r["q"] == q for recs in lists for r in sub(recs)) else None),
                                       median_ratio=(statistics.median(r[basis]["ratio"] for recs in lists for r in sub(recs) if r["q"] == q) if any(r["q"] == q for recs in lists for r in sub(recs)) else None),
                                       over30=agg(lambda recs, q=q: sum(1 for r in sub(recs) if r["q"] == q and r[basis]["ratio"] > 0.3)) * W,
                                       over50=agg(lambda recs, q=q: sum(1 for r in sub(recs) if r["q"] == q and r[basis]["ratio"] > 0.5)) * W) for q in range(5)])
            b["all"] = dict(over30=agg(lambda recs: sum(1 for r in recs if r[basis]["ratio"] > 0.3)) * W, over50=agg(lambda recs: sum(1 for r in recs if r[basis]["ratio"] > 0.5)) * W,
                            median_inc=statistics.median(r[basis]["inc"] for recs in lists for r in recs), mean_pay=statistics.mean(r[basis]["pay"] for recs in lists for r in recs))
            out[basis] = b
        res[variant] = out
    res["rates"] = dict(floor_single=HPC.floor_pa(fy), floor_partnered=HPC.floor_pa(fy) * JS_PART_PF / JS_SINGLE_PF, js_single=JS_SINGLE_PF * 26 * HPC.cpi_idx(fy),
                        js_partnered=JS_PART_PF * 26 * HPC.cpi_idx(fy), cra_single_max=H.cra_unit("single", 1e6, fy, 1.0), cra_single_max_175=H.cra_unit("single", 1e6, fy, 1.75),
                        cra_couple_max=H.cra_unit("couple", 1e6, fy, 1.0), median_repayment_mortgage=statistics.median(h["hc"] for h in HH if h["ten"] == "mortgage"),
                        median_rent_private=statistics.median(h["hc"] for h in HH if h["ten"] == "private"), W=W, employed_model=len(earners) * W,
                        retrench_baseline=H.S1_RETRENCH * len(earners) * W, adults=n_adults * W)
    return res


HHR = {}
for fy in ("2028-29", "2035-36"):
    for nm in pc.DISP:
        HHR[f"{nm}_{fy}"] = run_year(fy, nm)
        r = HHR[f"{nm}_{fy}"]["pro_rata"]
        log(f"{nm} {fy}: displaced households {r['displaced_households'] / 1e6:.2f}m; mortgage {r['by_tenure']['mortgage'] / 1e6:.2f}m; private {r['by_tenure']['private'] / 1e6:.2f}m; "
            + "; ".join(f"{b}: mortgage >30% {r[b]['mortgage']['over30'] / 1e3:.0f}k >50% {r[b]['mortgage']['over50'] / 1e3:.0f}k, renters >30% {r[b]['private']['over30'] / 1e3:.0f}k" for b in ("sq", "floor", "star")))
OUT["household"] = HHR

# ======================================================================================================================
# C. forced sales (illustrative): placeholders and elasticity range the author must source
# ======================================================================================================================
SALES = dict(fy2025_26=560_005, five_year_avg=545_540.4)      # evidence report A1: ABS Total Value of Dwellings, recorded transfers (2025-26 provisional; mean 2021-22 to 2025-26)
LOW_BUFFER_SHARE = 0.40                                         # evidence report C1a/C1b: about 40% of loans had under three months of repayments in buffers (2022, all loans, not owner-occupier only)
FS = {}
for key, r_ in HHR.items():
    r = r_["pro_rata"]
    FS[key] = {}
    for basis in ("sq", "floor", "star"):
        n = r[basis]["mortgage"]["over50"]
        FS[key][basis] = dict(cannot_service=n, over30=r[basis]["mortgage"]["over30"], share_of_transfers_2025_26=n / SALES["fy2025_26"], share_of_transfers_5yr=n / SALES["five_year_avg"],
                              low_buffer_within_3_months=LOW_BUFFER_SHARE * n, rest=(1 - LOW_BUFFER_SHARE) * n,
                              us_benchmark_price_points=4.0 * (100 * n / SALES["fy2025_26"]) / 10.0)   # NOT TRANSFERABLE: Mian, Sufi and Trebbi 2015, 10% more homes on the market ~ 4 points lower prices (B2), listings in a US crisis, not annual transfers
OUT["forced_sales"] = dict(sales=SALES, low_buffer_share=LOW_BUFFER_SHARE, price_effect="NOT QUANTIFIED: no defensible Australian conversion from extra forced sales to a national price fall (evidence report B)", by=FS)
OUT["evidence_inputs"] = dict(A1=SALES, B="price elasticity dropped; local effects: 27% foreclosure discount and about 1% spillover at 0.05 miles (B1); Sydney -0.87% [-1.48, -0.26] per extra concurrent listing within 250 m, Blacktown (B4); US crisis benchmark 10% more homes on the market ~ 4 points (B2), not transferable",
                              C1=dict(low_buffer_share_2022=0.40, median_buffer_months_oct_2026=">12"), C2=dict(other_property_households=2_020_000, share=0.21, note="2019-20, includes holiday homes; upper bound on investor exposure"),
                              C3=dict(npl_jun_2026=0.0101, npl_peak_jun_2020=0.0111), C4=dict(hardship_months="usually up to 3", median_months_after_serious_arrears=dict(repay=3, cure_or_foreclose=6), deep_negative_equity_foreclosure=0.5),
                              D1=dict(single=dict(homeowner=333_000, non_homeowner=600_000), couple=dict(homeowner=499_000, non_homeowner=766_000)),
                              D2=dict(onset=dict(single=5_500, partnered=11_000), maximum_13_weeks=dict(single=11_500, partnered=23_000)), D3=dict(partner_cutout_pf=JS_CUT_PF, cutout_floor_2028_29=CUT_FLOOR_2829, cutout_js_2028_29=JS_CUT_PF * 26 * HPC.cpi_idx("2028-29")),
                              E1=dict(jobseeker_granted={"2023-24": 510_000, "2024-25": 471_000, "2025-26": 462_000}, jobseeker_finalised={"2023-24": 606_000, "2024-25": 541_000, "2025-26": 528_000},
                                      ya_jobseeker_granted={"2023-24": 80_000, "2024-25": 78_400, "2025-26": 77_600}),
                              E2=dict(mean_days_2023_24=dict(jobseeker=22, youth_allowance=26)), E3=dict(mean_days_surge_8_may_2020=10, claims_finalised_16_mar_to_8_may_2020=1_073_850, claims_on_hand_peak=443_507),
                              F1="bank share of the excess profits tax base not disclosed in ECR-2025-3194", F2=dict(transfer_duty_bn=34.447, land_tax_bn=20.002, year="2024-25"),
                              F3=dict(nsw_per_point_prices_m=122, nsw_per_point_volumes_m=98, year="2026-27"), G="no causal Australian evidence on the rent response to forced investor sales; direction not established")
# surge as a multiple of grants
for nm in SURGE:
    for fy in SURGE[nm]:
        r = SURGE[nm][fy]
        r["new_over_js_grants"] = (r["new_displaced"] / 462_000, r["new_displaced"] / 510_000)
        r["new_over_all_grants"] = r["new_displaced"] / (462_000 + 77_600)
json.dump(OUT, open(os.path.join(ROOT, "runs", "shock.json"), "w"), indent=1, default=float)
log("wrote runs/shock.json")
