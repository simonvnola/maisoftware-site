"""optionb_probe.py: diagnostic only. Recomputes, on the central household calibration (2028-29), the pieces of Part 1 alone's and
P*'s budgets in household_r13.py (fixed parts, family payments over current FTB, responses) and the household/fiscal child-payment
components, to test whether P* is costed like for like with Part 1. Prints numbers; writes nothing. Stdlib only."""
import importlib.util, json, os, sys
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "supplementary")
sys.argv = [sys.argv[0], "partf4"]
sp = importlib.util.spec_from_file_location("hh_partf4", os.path.join(HERE, "household.py"))
H = importlib.util.module_from_spec(sp); sp.loader.exec_module(H)
PC, m = H.PC, H.m
FY = "2028-29"
H.calibrate(FY)
pop = H.make(FY); W = pop["W"]
d0 = PC.design_c("a", FY, 0.0)
print("design_c no dividend net", round(d0["net"], 3), {k: round(d0[k], 3) for k in ("gc", "ftb_topup", "ftb_topup0", "cs_net", "cs_tm", "cs_bh", "cs_inc", "lift_static", "lift_new", "caseload", "rep", "lift_dsave", "admin", "cb") if k in d0})
print("review", d0.get("review"), "prot net", d0["prot"]["net"], "gross", d0["gross"])
CSR = PC.CSR["years"][FY]
T_ = H.cs_threshold(FY, pop); CS = m.child_rate(FY)
fams = [h for h in pop["HH"] if h["kids"]]
par = lambda h: [a["ati"] for a in h["adults"] if a["role"] in ("OPF", "CWC")]
cur = lambda h, at: sum(H.cur_ab(h, FY, at))
fam_p1 = sum(H.pay_e(h, FY, T_, par(h), hold=True) - cur(h, par(h)) for h in fams) * W / 1e9
ab = sum(h["ftbA"] + h["ftbB"] for h in fams) * W / 1e9
ab2 = sum(cur(h, par(h)) for h in fams) * W / 1e9
print("household FTB (h ftbA+B)", round(ab, 2), "cur_ab", round(ab2, 2), "Part 1 family payments over current FTB", round(fam_p1, 3))
print("rule table: gross_hh univ mo tm bh inc", CSR["gross_hh"], CSR["univ_hh"], CSR["mo"], CSR["tm"], CSR["bh"]["0.2"], CSR["inc"], "k", d0["gc"] / CSR["gross_hh"])
ex = H.e_year_extras(pop, FY, T_, CS)
print("e_year_extras now", ex)
F4 = json.load(open(os.path.join(HERE, "tables", "partf4_facts.json")))["options_r10"]["fe"][FY]
print("FE", F4)
H.abi(pop, "a", U=0.0)
print("abi g cash bn", sum(h["g"] for h in pop["HH"]) * W / 1e9, "g_fam", sum(h.get("g_fam", 0) for h in pop["HH"]) * W / 1e9)
lc = PC.lift_cost(FY, 0.0, pop["F"]); print("lift", {k: round(v, 3) for k, v in lc.items() if isinstance(v, float)})
