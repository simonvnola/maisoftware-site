// The option B figures the calculator needs, from the model agent's outputs (optionb/model: runs/fiscal.json, runs/central_20261016.json,
// optionb_facts.json). Household rules (P*'s per-child amount, the package's increment and credit, Rent Assistance +75%) go to the model;
// the fiscal differences from Part 1 by year (optionb_fiscal.py's paths) are applied to the page's own Part 1 path; the rest is shown Fixed.
const fs = require('fs'), path = require('path');
const MD = path.join(__dirname, '..', 'optionb', 'model');
const F = JSON.parse(fs.readFileSync(path.join(MD, 'runs', 'fiscal.json'), 'utf8'));
const HH = JSON.parse(fs.readFileSync(path.join(MD, 'runs', 'central_20261016.json'), 'utf8'));
const FA = JSON.parse(fs.readFileSync(path.join(MD, 'optionb_facts.json'), 'utf8')).facts;
const v = k => FA[k].value;
const YEARS = Object.keys(F.paths.p1);
const diff = (P, d) => { const o = {}; YEARS.forEach(fy => { o[fy] = P[d][fy] - P.p1[fy]; }); return o; };
const p28 = F.pieces['2028-29'], pk = p28.pkg_parts;
const pov = k => { const d = HH.design[k]; return { rel: d.rel, anch: d.anch, u15: d.u15, old: d.old, opf: d.opf, base: d.base_rel, n: d.n_rel }; };
const los = k => { const x = v('after_housing_losers_' + k), a = x['All recipient households']; return { hh: a.hh_m, people: a.people_m, share: a.share, avg: a.avg_loss, dsp: x['Disability Support Pension'], apr: x['Age Pension (private renter)'] }; };
const st = v('stress_test');
const stress = k => ({ before44: st.main[k].p_before_2044_45, before34: st.main[k].p_before_2034_35, any: st.main[k].p_any_to_2045_46, p10: st.main[k].p10, p50: st.main[k].p50, p90: st.main[k].p90,
  sym44: st.symmetric[k].p_before_2044_45, sym34: st.symmetric[k].p_before_2034_35 });
const fundSummary = (fd) => ({ first: fd.first, total: fd.total, advance: fd.advance, repaid: fd.repaid, peakBn: fd.peak_bn, peakRate: fd.peak_rate });
const OB = {
  pstarD: v('pstar_per_child'), pkgD: HH.D.pkg_ie, ftbTaper: 0.20, creditC: 5000, creditCut: 60000, craX: 0.75, craTaper: 0.75,
  cra: { single: [223.80, 157.80], couple: [211.00, 255.80], single_kids: [263.06, 207.34], couple_kids: [263.06, 306.60] },
  delta: { pstar: { cf: diff(F.paths_cra_fiscal, 'star_m2'), hh: diff(F.paths, 'star_m2') }, pkg: { cf: diff(F.paths_cra_fiscal, 'pkg'), hh: diff(F.paths, 'pkg') }, p1: { cf: {}, hh: {} } },
  phased28: { p1: -p28.child_p1, pstar: -p28.child_star_m2, pkg: -(pk.credit + p28.k * (pk.ftb + pk.resp_ftb + pk.ie) + pk.resp_credit) },
  // Table 5.7 of the option B paper (household model, current income, 2028-29): the work-incentive rows (provisional for P* and the package)
  table57: { emtr50: { pstar: 41.6, pkg: 21.8, p1: 43.6 }, ptrMean: { pstar: 33.0, pkg: 28.9, p1: 32.9, cur: 27.3 }, ptr40: { pstar: 31.6, pkg: 22.4, p1: 29.4 }, ptr60: { pstar: 0.0, pkg: 6.8, p1: 0.0 } },
  balPeak: { pstar: { hh: F.funds.star_m2.peak_bal, hhFy: F.funds.star_m2.peak_bal_fy, cf: F.funds_cra_fiscal.star_m2.peak_bal, cfFy: F.funds_cra_fiscal.star_m2.peak_bal_fy }, pkg: { hh: F.funds.pkg.peak_bal, hhFy: F.funds.pkg.peak_bal_fy } },
  // Table B15: each design under Table 6.14g's stress cases; the yield the five taxes need for no levy before 2044-45
  sens: { p1: v('pstar_sensitivity_cases').p1, pstar: v('pstar_sensitivity_cases').star_m2, pkg: v('pstar_sensitivity_cases').pkg },
  beYield: { p1: v('break_even_yield_no_levy_before_2044_45').p1, pstar: v('break_even_yield_no_levy_before_2044_45').star_m2, pkg: v('break_even_yield_no_levy_before_2044_45').pkg },
  // Table B6: the pensioner variant of the household calibration (full-rate pensioners' other income 25% lower), relative line
  povRec075: { pstar: JSON.parse(fs.readFileSync(path.join(MD, 'runs', 'rec075_20261016.json'), 'utf8')).design.star_m2.rel, pkg: JSON.parse(fs.readFileSync(path.join(MD, 'runs', 'rec075_20261016.json'), 'utf8')).design.pkg_ie.rel },
  phasedPrice: { pstar: { cash: v('phased_start_price_pstar').cash_to_families_net_of_ftb_kept, saving: v('phased_start_price_pstar').budget_saving } },
  childCost28: { p1: p28.child_p1, pstar: p28.child_star_m2, pkg: pk.credit + p28.k * (pk.ftb + pk.resp_ftb + pk.ie) + pk.resp_credit },
  taxDec: v('calculator_tax_by_decile').rows.map(r => ({ upper: r.upper_equiv_disp_income || null, central: r.central, low: r.low, high: r.high })),
  taxBase: v('calculator_tax_by_decile').five_taxes_bn,
  reach: { p1: v('reach_before_after_household_basis').p1, pstar: v('reach_before_after_household_basis').star_m2, pkg: v('reach_before_after_household_basis').pkg_ie },
  poverty: { p1: pov('p1'), pstar: pov('star_m2'), pkg: pov('pkg_ie') },
  losers: { p1: los('p1'), pstar: los('star_m2'), pkg: los('pkg_ie') },
  stress: { p1: stress('p1'), pstar: stress('star_m2'), pkg: stress('pkg') },
  appraisal: Object.fromEntries([['p1', 'p1'], ['pstar', 'star_m2'], ['pkg', 'pkg']].map(([k, d]) => [k, { nb: F.appraisal[d].nb_complete, vsP1: F.appraisal[d].nb_vs_p1_complete, w: F.appraisal[d].w_breakeven_complete, gb: F.appraisal[d].gb13 }])),
  // the figures the reproduction check compares with (Tables B1 to B5 and B13)
  want: {
    p1: { net: F.paths.p1, rev: Object.fromEntries(YEARS.map(fy => [fy, F.rev[fy].total])), hh: fundSummary(F.funds.p1) },
    pstar: { net: F.paths.star_m2, netCf: F.paths_cra_fiscal.star_m2, hh: fundSummary(F.funds.star_m2), cf: fundSummary(F.funds_cra_fiscal.star_m2) },
    pkg: { net: F.paths.pkg, netCf: F.paths_cra_fiscal.pkg, hh: fundSummary(F.funds.pkg), cf: fundSummary(F.funds_cra_fiscal.pkg) },
    phased: { pstar: F.phased.star_m2_floor_and_cra, p1: F.phased.p1_floor_only, pkg: F.phased.pkg_floor_cra_enrol }
  }
};
['p1', 'pstar', 'pkg'].forEach(k => { if (OB.want.phased[k]) delete OB.want.phased[k].rows; });
module.exports = OB;
if (require.main === module) console.log(JSON.stringify(OB).length, 'bytes', JSON.stringify({ phased28: OB.phased28, pstarD: OB.pstarD, pkgD: OB.pkgD, d28: OB.delta.pstar.cf['2028-29'], d46: OB.delta.pstar.cf['2045-46'] }));
