"""optionb_extra.py: further measures for the re-costed P* (per-child amount from runs/central_20261016.json, no enrolment) on the central
household calibration, 2028-29, with Part 1 alone alongside as a check against the paper:
  - the higher earner's effective marginal tax rate (household_r13.emtr_hi: Table F4-109's measure) and second earners' participation
    tax rates (household_r13.second), both functions executed unchanged from household_r13.py with P*'s payment rule added;
  - the prior-year assessment's income-fall review and residual debts (household._s1_review: Table P11's measures), run with partc.fam_e
    temporarily replaced by P*'s rule (Part 1's G schedule with P*'s per-child amount, no supplement-only schedule, held harmless).
Writes runs/extra.json. Run: python3 -I optionb_extra.py (about 3 minutes). Stdlib only."""
import importlib.util, json, os, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))
HERE = os.path.join(ROOT, "supplementary")
T0 = time.time()
log = lambda msg: print(f"[{time.time() - T0:.0f}s] {msg}", flush=True)
sys.argv = [sys.argv[0], "partf4"]
_sp = importlib.util.spec_from_file_location("hh_partf4", os.path.join(HERE, "household.py"))
H = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(H)
PC, m = H.PC, H.m
FY = "2028-29"
CEN = json.load(open(os.path.join(ROOT, "runs", "central_20261016.json")))
D_STAR = CEN["D"]["m2"]
TJ = lambda fn: json.load(open(os.path.join(HERE, "tables", fn)))
H.calibrate(FY)
pop = H.make(FY)
W = pop["W"]
NS = dict(H=H, PC=PC, m=m, pop=pop, W=W, FY=FY, HHF4=TJ("household_partf4_facts.json"), H10=TJ("household_r10_f4_facts.json"))
_src = open(os.path.join(HERE, "household_r11.py")).read()
exec(compile(_src[_src.index("pk0 = HHF4"):_src.index("su0 = setup(")], "household_r11 helpers", "exec"), NS)
parents = lambda h: [a for a in h["adults"] if a["role"] in ("OPF", "CWC")]
NS.update(BUD=PC.design_c("a", FY, 0.0)["net"], X=NS["pk0"]["x"], C=NS["pk0"]["C"], TEST=0.0, EPS=H.PKG_EPS, parents=parents,
          cur=lambda h, atis: sum(H.cur_ab(h, FY, atis)), PKG=None)
_s13 = open(os.path.join(HERE, "household_r13.py")).read()
exec(compile(_s13[_s13.index("T_ = H.cs_threshold(FY, pop)"):_s13.index("def taper_resp(")], "household_r13 payment rules", "exec"), NS)
pay_p1, pay_star = NS["pay_p1"], NS["pay_star"]
exec(compile(_s13[_s13.index("def credit_ok(a):"):_s13.index("EM = {k: emtr_hi(k)")], "household_r13 emtr and second earners", "exec"), NS)
NS["DES"] = dict(cur=(lambda h, at: sum(H.cur_ab(h, FY, at)), False), p1=(pay_p1, False), star_m2=(lambda h, at: pay_star(h, at, D_STAR), False))
EM = {k: NS["emtr_hi"](k) for k in NS["DES"]}
SE = {k: NS["second"](k) for k in NS["DES"]}
log("EMTR (>=50 / >50 / >=60): " + "; ".join(f"{k} {v['ge50']:.1f} / {v['over50']:.1f} / {v['ge60']:.1f}" for k, v in EM.items()))
log("second earners PTR mean / >=40 / >=60: " + "; ".join(f"{k} {v['ptr_mean']:.1f} / {v['ptr_ge40']:.1f} / {v['ptr_ge60']:.1f}" for k, v in SE.items()))

# ---- the income-fall review and residual debts (Table P11) for Part 1 (check) and P*
RV = dict(p1=H._s1_review(pop))
_fe0 = PC.fam_e
CS = m.child_rate(FY)


def fam_star(kids, x, fy, single_parent, secondary=0.0, cur=None, T=None):
    e = dict(_fe0(kids, x, fy, single_parent, secondary, cur=None, T=T))
    if not kids:
        return e
    pay = max(0.0, e["G"] + len(kids) * (D_STAR * m.child_rate(fy) / CS - m.child_rate(fy)))
    hh = cur is not None and cur > pay + 1e-9
    e.update(pay=(cur if hh else pay), hh=hh)
    return e


PC.fam_e = fam_star
try:
    RV["star_m2"] = H._s1_review(pop)
finally:
    PC.fam_e = _fe0
for k, v in RV.items():
    log(f"review {k}: cost A${v['total_cost_bn']:.2f}bn; residual debts {v['total_n_debts'] / 1e3:.1f} thousand, A${v['total_debts_bn']:.3f}bn")
json.dump(dict(D=D_STAR, emtr=EM, second=SE, review=RV), open(os.path.join(ROOT, "runs", "extra.json"), "w"), indent=1, default=float)
log("wrote runs/extra.json")
