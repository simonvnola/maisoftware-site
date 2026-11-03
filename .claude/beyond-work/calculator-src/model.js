/* Beyond Work fiscal model, Part F3 (permanent-fund dividend, round 9), ported from supplementary/ubi_model.py, partc.py, partd.py,
   partE.py, partF.py, partF_r8.py and partF_r9.py. Part F3: the PBO's interaction line year by year, extended with nominal GDP and
   booked to the fund in every year (a negative net inflow met from the dividend account, never-cut top-ups levied); the child
   payment's income effect and a caseload response for students and Parenting Payment; non-lodgers paid after enrolment. Part F2
   (opts.partF2) and Part F (opts.partF) reproduce with those switches off. Part F2: the income-fall review in net cost, the wealth tax's net revenue to the fund, the displacement
   loan from the fund and the macro variants of a displacement, on top of Part F's standard taxable-income response, caseload response with a re-entry channel, counts reconciled, the E14 cliff-free
   child payment assessed on income 1.5 years earlier, waiting periods for adults and children, the protection offset capped at
   current-rules tax, take-up 100%, the tax-free threshold and LITO unchanged at Stage 1, and the Permanent AI Dividend Fund with
   its durable account. createModel(DATA, params, opts) returns pure functions closed over the parameters, each with its own caches. */
var BW = (function () {
  'use strict';

  var DEFAULTS = {
    part2: 'i', fuelGrowth: 'real', fundReturn: 'central', payout: 0.04, share: 0, nlTakeup: 0.8, wtLoss: 0, macro: 'paper', floorOn: true, floorPw: 569.81, protections: true, waiting: true, caseload: 0.39,
    funding: 'levy', coverAll: false, pathway: 's1', stageBasis: 'min',
    lp: 0.012, aiInvest: 0, aiUpliftPer10: 0.0005, dispEp: 0, eptYield: 1,
    nom: 225000, wpi: 0.035, cpi: 0.025, bpPerPct: 50, unemp: 4.5, commodity: 1,
    eti: 0.2, mpe: 0.16, takeup: 1.0, stackYield: 1, rentPass: 0.195
  };

  // ---- sourced constants (ubi_model.py section 1, partc.py section 1, partE.py section 0) ----
  var ERP_MAR2026 = 27921150, ERP_JUN2025 = 27614411;
  var AGE_BANDS = { '0-4': [2.82, 2.67], '5-9': [2.99, 2.82], '10-14': [3.13, 2.96], '15-19': [3.18, 3.00], '20-24': [3.42, 3.16],
    '25-29': [3.73, 3.61], '30-34': [3.72, 3.76], '35-39': [3.63, 3.69], '40-44': [3.44, 3.49], '45-49': [2.94, 3.03],
    '50-54': [3.01, 3.10], '55-59': [2.76, 2.87], '60-64': [2.71, 2.85], '65-69': [2.41, 2.61], '70-74': [2.05, 2.27],
    '75-79': [1.74, 1.92], '80-84': [1.08, 1.25], '85+': [0.89, 1.30] };
  var band = function (k) { return (AGE_BANDS[k][0] + AGE_BANDS[k][1]) / 100; };
  var S017_2025 = band('0-4') + band('5-9') + band('10-14') + 0.6 * band('15-19');
  var S67P_2025 = 0.6 * band('65-69') + band('70-74') + band('75-79') + band('80-84') + band('85+');
  var S1866_2025 = 1 - S017_2025 - S67P_2025;
  var TEEN = (0.4 * band('10-14') + 0.6 * band('15-19')) / S017_2025;
  var AP_MBR = 1135.40, AP_MAX = 1237.70, JS_BASIC = 824.90, FTB_A_U13_PF = 235.48, FTB_A_SUPP_PA = 970.90;
  var BUDGET = { '2025-26': [759.8, 788.1, -28.3, 982.0, 556.0, 25.6, 26.6, 33.1], '2026-27': [798.1, 829.6, -31.5, 1051.0, 616.6, 25.8, 26.8, 34.0],
    '2027-28': [822.9, 853.9, -31.0, 1120.0, 668.8, 25.9, 26.8, 35.2], '2028-29': [848.4, 882.8, -34.4, 1193.0, 725.5, 25.4, 26.5, 35.8],
    '2029-30': [894.8, 920.1, -25.3, 1249.0, 767.8, 25.5, 26.2, 35.6] };
  var PBO_PROGRAMS = { ap: [68.7, 111.8], dsp: [26.2, 40.5], unemp: [18.3, 22.8], carer: [13.4, 21.7], ftb: [18.2, 20.3], pp: [8.3, 11.2] };
  var STUDENT_ASSIST = { '2026-27': 6095, '2027-28': 6530, '2028-29': 6889, '2029-30': 7263 };
  var JOBSEEKER_PROG = { '2026-27': 18304, '2027-28': 17864, '2028-29': 17662, '2029-30': 18069 };
  var SA_DEPT = { '2025-26': 6192855, '2026-27': 6209369, '2027-28': 5886223, '2028-29': 4858094, '2029-30': 4781805 };
  var WA_REPLACED_2025 = 821000 + 98500 + 143000 + 23200 + 328000 + 59200 + 670000 + 256000;
  var TAX_RATES = [[45000, 0.30], [135000, 0.37], [190000, 0.45]];
  var TEMP_SHARE = (2807322 - 296625 - 12835) / ERP_MAR2026, TEMP_ADULT = 0.90;
  var BASE_SHARE = AP_MBR / AP_MAX, PPS_BASE_SHARE = 1037.50 / 1087.20;
  var CARER_BASE_SHARE = (256000 * 26 * (0.5 * AP_MBR + 0.5 * 855.90)) / (13424 * 1e6);
  var FUND = { super: [8030, 8690, 8930, 7950, 7750, 7530, 7890, 7770, 8120, 7920, 8310],
    ept: [13125, 22005, 26305, 28205, 29845, 31445, 33155, 34735, 36415, 38175, 40015],
    min: [6425, 8350, 8850, 7830, 7560, 11680, 13700, 13420, 13230, 12710, 12460],
    prrt: [2580, 12520, 17260, 17470, 16860, 15840, 14050, 12790, 12140, 10800, 8730],
    fossil: [6593.5, 8462, 9243, 9947, 10278, 10775, 11062, 11382, 11782, 12205, 12696],
    wealth: [23553, 29112, 25911, 22710, 19609, 16407, 13306, 10205, 7004, 3903, 701] };
  var PIT_FE = -920.0, PIT_MT = -16870.0, PRRT_TAIL = Math.pow(8730 / 15840, 1 / 5) - 1;
  // [F3 T1] ECR-2025-3901 Table A1, 'Reduction in personal income tax due to interactions', A$m, 2025-26 to 2035-36 (re-timed to 2028-29)
  var PBO3901 = [100.0, -30.0, -300.0, -690.0, -1080.0, -1460.0, -1850.0, -2260.0, -2670.0, -3090.0, -3540.0];
  var CASE_OTHER = 0.21;               // [F3 L1] students and Parenting Payment: e61's job-finding elasticity only
  var LIFT_SUB = [['js', 'JobSeeker Payment', 821000, 824.90, 'JS'], ['js', 'Youth Allowance (other)', 98500, 677.20, 'YA'],
    ['js', 'Special Benefit', 2400, 824.90, 'JS'], ['st', 'Youth Allowance (student and apprentice)', 143000, 677.20, 'YA'],
    ['st', 'Austudy', 23200, 677.20, 'YA'], ['st', 'ABSTUDY living allowance', 6600, 677.20, 'YA'],
    ['pp', 'Parenting Payment Single', 328000, 1037.50, 'PPS'], ['pp', 'Parenting Payment Partnered', 59200, 755.10, 'PPP']];
  var SINGLE_REF = { JS: 824.90 + 8.80, YA: 677.20 + 8.80, PPS: 1037.50 + 12.00, PPP: 1037.50 + 12.00 };
  var INCOME_TEST = { js: [150.0, 0.5, 256.0, 0.6], st: [539.0, 0.5, 646.0, 0.6], pp: [232.60, 0.4, null, 0.4],
    ap: [226.0, 0.5, null, 0.5], dsp: [226.0, 0.5, null, 0.5], ca: [226.0, 0.5, null, 0.5] };
  var TAXABLE = { ap: true, dsp: false, js: true, st: true, pp: true, ca: true };
  var PENSION_TAX = { ap: true, ca: true };
  var SAPTO_S = [2230.0, 34919.0, 0.125], SAPTO_C = [1602.0, 30994.0, 0.125];
  var FTB_A_MAX_U13 = 235.48, FTB_A_MAX_13P = 306.46, FTB_A_BASE = 75.60, FTB_A_SUPP = 970.90;
  var FTB_A_MAXTEST = 69131.0, FTB_A_BASETEST = 123078.0, FTB_A_SUPP_LIMIT = 80000.0;
  var FTB_B_U5 = 193.34 * 235.48 / 227.36, FTB_B_5P = 134.96 * 235.48 / 227.36, FTB_B_SUPP = 448.95;
  var FTB_B_PRIMARY = 124327.0, FTB_B_SECOND_FREE = 7154.0, FTB_B_TAPER = 0.20;
  var FTB_B_SHARE = 0.25, FTB_PSI = 0.60, FTB_OMEGA = 0.25, FTB_CHI = 0.70;
  var PHASE_W = 0.50, FORGONE_2627 = 0.5 * 1004.90 * 52, RPO_CAP = true;                // [F14] offset capped at current-rules tax
  var INT_RATE = 43.4 / 1051.0;
  var NARWP = 4 * 185000 * 0.70;                       // [E9, E10] adults serving the 4-year waiting period
  var NARWP_KIDS = 1 * 185000 * 0.30;                  // [F18] children of new residents in FTB's one-year waiting period
  var KEEP = 0.10, CAP = 1.0, AVG_N = 3, DEBT_SHARE = 0.135, REPAY_BY = 2031, SHARE_LAST = 2040;   // [F3, F5, F7, F8]
  var MACRO_RHO = { paper: null, a: 0, c: 0.5, b: 1 };   // [F62] share of the lost labour income that reappears as profits
  var UCB_PUB = { '2027-28': -1.0, '2028-29': -1.0, '2029-30': -0.7, '2034-35': 0.0, '2035-36': 0.4, '2036-37': 0.8 };
  var DISP = { moderate: { ep: 0.03, wage: 0.03, rec: 0.15, profit: 0.05 }, severe: { ep: 0.08, wage: 0.08, rec: 0.40, profit: 0.10 } };
  var TRIG_MIN = { ep: 0.02, wage: 0.0, rec: 0.10, profit: 0.033 };   // [E15] smallest shock meeting the need test, in place by 2030-31
  var MORT_RATE = 0.0625, MORT_TERM = 22, VAR_SHARE = 0.85, MPC_GAP = 0.45, DELTA_TAX = 0.2;
  var CASE_U0 = 4.5, NOM0 = 225000;

  var fyS = function (fy) { return +fy.slice(0, 4); };
  var fyN = function (y) { return y + '-' + String(y + 1).slice(-2); };
  var YEARS = []; for (var yy = 2028; yy <= 2045; yy++) YEARS.push(fyN(yy));
  var up = function (x) { return Math.ceil(Math.round(x * 1000 * 1e6) / 1e6) / 1000; };
  var nmax = function (a, b) { return (a !== a || b !== b) ? NaN : Math.max(a, b); };

  var GDP0 = {};
  ['2025-26', '2026-27', '2027-28', '2028-29', '2029-30'].forEach(function (fy) {
    var b = BUDGET[fy]; GDP0[fy] = (b[0] / (b[5] / 100) + b[1] / (b[6] / 100) + b[3] / (b[7] / 100)) / 3;
  });
  var MT_G = Math.pow((1350.5 / 0.274) / GDP0['2029-30'], 1 / 7) - 1;
  for (var y2 = 2030; y2 <= 2045; y2++) GDP0[fyN(y2)] = GDP0[fyN(y2 - 1)] * (1 + MT_G);
  var DELAY_B = GDP0['2028-29'] / GDP0['2025-26'];
  function receiptsShare(fy) { if (BUDGET[fy]) return BUDGET[fy][5] / 100; var w = Math.min(1, (fyS(fy) - 2029) / 7); return (25.5 + w * 1.5) / 100; }
  function ucbBase(fy) { if (fy in UCB_PUB) return UCB_PUB[fy]; var y = fyS(fy); if (y >= 2030 && y <= 2033) return -0.7 + (y - 2029) * 0.7 / 5; return 0.8; }
  var ND_BASE_PCT = (function () {
    var yrs = []; for (var y = 2030; y <= 2045; y++) yrs.push(fyN(y));
    function run(c) { var nd = 767.8, o = {}; yrs.forEach(function (fy) { nd = nd - ucbBase(fy) / 100 * GDP0[fy] + c; o[fy] = nd; }); return o; }
    var lo = -50, hi = 50, c = 0;
    for (var i = 0; i < 60; i++) { c = (lo + hi) / 2; if (run(c)['2036-37'] / GDP0['2036-37'] * 100 > 15.1) hi = c; else lo = c; }
    var o = run(c); o['2028-29'] = 725.5; o['2029-30'] = 767.8;
    var pct = {}; Object.keys(o).forEach(function (fy) { pct[fy] = 100 * o[fy] / GDP0[fy]; }); return pct;
  })();
  function lito(y) { if (y <= 37500) return 700; if (y >= 66667) return 0; return 700 * (66667 - y) / (66667 - 37500); }
  function rateScale(y, T) {     // 14% from T, then the 2027-28 rates
    var t = 0;
    if (y > T) t += (Math.min(y, 45000) - T) * 0.14;
    for (var i = 0; i < TAX_RATES.length; i++) {
      var lo = TAX_RATES[i][0], hi = i + 1 < TAX_RATES.length ? TAX_RATES[i + 1][0] : Infinity;
      if (y > lo) t += (Math.min(y, hi) - lo) * TAX_RATES[i][1]; else break;
    }
    return t;
  }

  function createModel(DATA, params, opts) {
    opts = opts || {};
    var P = {}; Object.keys(DEFAULTS).forEach(function (k) { P[k] = (params && k in params) ? params[k] : DEFAULTS[k]; });
    // [option B, 31 October 2026] Stage 1 designs for households (optionb_hh.py): 'p1' Part 1 (unchanged), 'pstar' P* re-costed, 'pkg' the
    // targeted package; 'phased' starts the child payment (and the package's credit and FTB increment) in 2029-30. Fiscal paths for
    // P* and the package are Part 1's plus optionb_fiscal.py's differences, applied by the calculator; Part 1's maths is unchanged.
    var OB = DATA.optionb || null, S1D = OB && params && params.design ? params.design : 'p1', PHASED = !!(OB && params && params.phased);
    var W = P.wpi, C = P.cpi;
    var FUND_R = { central: C + 0.04, high: C + 0.05, low: INT_RATE }, RF = FUND_R[P.fundReturn] || FUND_R.central;   // [F2]
    var CSR = DATA.csr, TAPER = 0.18, CSY;
    // [F57] round-8 switches (off with opts.partF, which reproduces Part F as printed); [F3] round-9 switches (off with opts.partF2)
    // [F4] round-10 switches (off with opts.partF3) and the Part 2 option: (i) the wealth-tax fund, (iv) the dividend from the durable
    // account, (v) a fund fed by durable surpluses, (none) Part 1 alone; (iv), (v) and (none) have no wealth tax and no interaction line
    var F2 = !opts.partF, F3 = F2 && !opts.partF2, F4 = F3 && !opts.partF3, P2 = DATA.partf2.params, LAM = P2.lam, TAU_C = P2.tau_c, PHI = P2.phi;
    var OPT = F4 && P.part2 in { i: 1, iv: 1, v: 1, none: 1 } ? P.part2 : 'i', NOWT = OPT !== 'i', DURABLE = OPT === 'iv' || OPT === 'none';
    var HX = F4 ? DATA.partf4 : F3 ? DATA.partf3 : F2 ? DATA.partf2 : null;
    // [F4, round 11] T2: the fuel-tax-credit and coal-and-minerals measures flat in real terms after the PBO's window (GDP growth the high
    // case, the lever); L1: the student line Stages 2 and 3 replace is the living allowance paid to the floor's AIHW counts
    var ERODE = F4 && P.fuelGrowth !== 'gdp';
    CSY = (F4 && CSR.years) || (F3 && CSR.alt.f3) || CSR.alt.f;    // Parts F3 and F4 add the income-effect line; Parts F and F2 reproduce on Part F's table
    var CSPLIT = (F4 && CSR.split) || (F3 && CSR.alt_split.f3) || CSR.alt_split.f, CSO = F4 ? [CSR.over50, CSR.over60] : CSR.alt_over.f3;   // [F4 r11] recalibrated
    var wfC = {}, cfC = {};
    function wf(fy) { return fy in wfC ? wfC[fy] : (wfC[fy] = Math.pow((1 + W) / 1.035, Math.max(0, fyS(fy) - 2026))); }
    function cf(fy) { return fy in cfC ? cfC[fy] : (cfC[fy] = Math.pow((1 + C) / 1.025, Math.max(0, fyS(fy) - 2026))); }
    var medC = {};
    function med(fy) { if (!medC[fy]) { var k = Math.pow(1.025, fyS(fy) - 2025) * cf(fy); medC[fy] = [28011 * k, 35013 * k]; } return medC[fy]; }
    function medicare(y, fy) { var m = med(fy); if (y <= m[0]) return 0; if (y <= m[1]) return Math.min(0.10 * (y - m[0]), 0.02 * y); return 0.02 * y; }
    function oldTax(y, fy) { return Math.max(0, rateScale(y, 18200) - lito(y)) + medicare(y, fy); }
    // the ABI's tax scale: threshold TT (14% from TT), LITO share TL; the regime is set by the caller (Stage 1 or Stages 2 and 3)
    var TT = 0, TL = 0;
    function newTaxTL(y, fy, T, L) {
      var t = rateScale(y, T);
      if (L > 0) t = Math.max(0, t - L * lito(y));
      return t + medicare(y, fy);
    }
    function newTax(y, fy) { return newTaxTL(y, fy, TT, TL); }
    function withReg(reg, fn) { var s0 = TT, s1 = TL; TT = reg.T; TL = reg.L; try { return fn(); } finally { TT = s0; TL = s1; } }
    var REG23 = { T: 0, L: 0 };

    // [E-T1] smallest gain from the payment plus the tax-scale change over all incomes, at threshold T and LITO share L
    function nolossGainMin(U, fy, T, L) {
      var m = med(fy), best = Infinity, pts = [0, 400000];
      [18200, 18200 + 700 / 0.14, 37500, 66667, m[0], m[1], 45000, 135000, 190000].forEach(function (x) { pts.push(x - 1, x, x + 1); });
      var nk = [T, m[0], m[1], 45000, 135000, 190000];
      if (L > 0) nk.push(37500, 66667, T + L * 700 / 0.14);
      nk.forEach(function (x) { pts.push(x - U - 1, x - U, x - U + 1); });
      for (var i = 0; i < pts.length; i++) {
        var y = pts[i]; if (y < 0) continue;
        var g = U - (newTaxTL(y + U, fy, T, L) - oldTax(y, fy)); if (g < best) best = g;
      }
      return best;
    }
    var REG1 = { T: 18200, L: 1 };      // [F6] Stage 1: threshold and LITO unchanged; the dividend is taxable

    // ---- distribution ----
    var DI = DATA.dist, NPT = DI.inc.length, BOTTOM_SHARE = 0;
    var DSHARE = new Float64Array(NPT), DBOT = new Uint8Array(NPT);
    for (var i = 0; i < NPT; i++) { var g = DI.grp[i]; DSHARE[i] = g === 0 ? DI.share[0] : DI.share[g] / 400; DBOT[i] = g <= 2 ? 1 : 0; if (DBOT[i]) BOTTOM_SHARE += DSHARE[i]; }
    function incomeGrowth(fy) { return Math.pow(1.035, fyS(fy) - 2023) * wf(fy); }

    // ---- population (waiting period [E9]: new permanent residents wait four years for the dividend) ----
    function erpMid(fy) {
      var y = fyS(fy), pop = ERP_MAR2026 * Math.pow(1.012, 0.25);
      for (var t = 2026; t < y; t++) pop *= 1 + (t <= 2035 ? 0.012 : t <= 2039 ? 0.011 : 0.010);
      return pop * Math.pow(1 + (y <= 2035 ? 0.012 : y <= 2039 ? 0.011 : 0.010), 0.5);
    }
    function nomExtra(fy) { var y = fyS(fy); return y >= 2027 ? (P.nom - NOM0) * (y - 2027 + 0.5) : 0; }
    function popRatio(fy) { return (erpMid(fy) + nomExtra(fy)) / erpMid(fy); }
    var popC = {};
    function popBase(fy, plain) {
      var key = fy + (plain ? 'p' : ''); if (popC[key]) return popC[key];
      var pop = erpMid(fy) + (plain ? 0 : nomExtra(fy));
      var t = fyS(fy) - 2025; t = Math.min(t, 12.5) + 0.5 * Math.max(0, t - 12.5);
      var s017 = S017_2025 - 0.0015 * t, s67 = S67P_2025 + 0.003 * t, s1866 = 1 - s017 - s67;
      var temp = (P.coverAll && !plain) ? 0 : TEMP_SHARE * pop;
      var adults = pop * (1 - s017), kids = pop * s017;
      var ap = 2700000 / (S67P_2025 * ERP_JUN2025) * pop * s67, wa = WA_REPLACED_2025 / (S1866_2025 * ERP_JUN2025) * pop * s1866;
      var elig = adults - TEMP_ADULT * temp, wait = 0, eligK = kids - (1 - TEMP_ADULT) * temp, waitK = 0;
      if (!plain && P.waiting) {
        var yrs = fyS(fy) - 2027 + 0.5, adultShare = (1 - s017) - (P.coverAll ? 0 : TEMP_ADULT * TEMP_SHARE);
        var extraWait = (P.nom - NOM0) * adultShare * Math.max(0, Math.min(4, yrs)), extraK = (P.nom - NOM0) * s017 * Math.max(0, Math.min(1, yrs));
        wait = Math.max(0, Math.min(NARWP + extraWait, 0.5 * elig));
        waitK = Math.max(0, Math.min(NARWP_KIDS + extraK, 0.5 * eligK));
      }
      return (popC[key] = { pop: pop, s017: s017, s1866: s1866, s67: s67, adults: adults, kids: kids, temp: temp,
        elig_adults: elig - wait, wait: wait, elig_kids: eligK - waitK, waitK: waitK, R: ap + wa, R_ap: ap, R_wa: wa });
    }
    function population(fy) { var p = Object.assign({}, popBase(fy)); p.R0 = p.R; p.R += scn(fy).dR; return p; }
    function waScale(fy, plain) { var p = popBase(fy, plain); return p.pop * p.s1866 / (S1866_2025 * ERP_JUN2025); }

    // ---- payments replaced ----
    function interp(name, fy) { var a = PBO_PROGRAMS[name][0], b = PBO_PROGRAMS[name][1]; return a * Math.pow(Math.pow(b / a, 0.1), fyS(fy) - 2026); }
    function repRaw(fy) {
      var y = fyS(fy);
      return { ap: interp('ap', fy) * BASE_SHARE, dsp: interp('dsp', fy) * BASE_SHARE,
        js: JOBSEEKER_PROG[fy] ? JOBSEEKER_PROG[fy] / 1000 : interp('unemp', fy),
        st: STUDENT_ASSIST[fy] ? STUDENT_ASSIST[fy] / 1000 : STUDENT_ASSIST['2029-30'] / 1000 * Math.pow(1.04, y - 2029),
        pp: interp('pp', fy) * PPS_BASE_SHARE, ca: interp('carer', fy) * CARER_BASE_SHARE, ftb: interp('ftb', fy) };
    }
    var REP26 = repRaw('2026-27'), P26 = popBase('2026-27', true);
    var IW = Math.pow(1.035, 0.25), IC = Math.pow(1.025, 0.25);
    var phiFn = function (S, n, B) { return Math.max(0, Math.min(1, 2 * (S * 1e9 / n) / B - 1)); };
    var JS_N26 = (821000 + 98500) * waScale('2026-27', true), JS_B26 = (821000 * 824.90 + 98500 * 677.20) / 919500 * 26 * IC;
    var PP_N26 = (328000 + 59200) * waScale('2026-27', true), PP_B26 = (328000 * 1037.50 + 59200 * 755.10) / 387200 * 26 * IC;
    var HHP = {
      ap: { B26: REP26.ap * 1e9 / P26.R_ap / ((1 + 0.67) / 2), phi: 0.67, wage: true }, dsp: { B26: 1135.40 * 26 * IW, phi: 0.90, wage: true },
      js: { B26: JS_B26, phi: phiFn(REP26.js, JS_N26, JS_B26), wage: false }, st: { B26: 677.20 * 26 * IC, phi: 0.80, wage: false },
      pp: { B26: PP_B26, phi: phiFn(REP26.pp, PP_N26, PP_B26), wage: false }, ca: { B26: (1135.40 + 855.90) / 2 * 26 * IW, phi: 0.90, wage: true } };
    var PROGS = ['ap', 'dsp', 'js', 'st', 'pp', 'ca'];
    function hhB(prog, fy) { var h = HHP[prog]; return h.B26 * Math.pow(h.wage ? 1.035 : 1.025, fyS(fy) - 2026) * (h.wage ? wf(fy) : cf(fy)); }
    var repBC = {};
    function repBase(fy) {
      if (repBC[fy]) return repBC[fy];
      var r = repRaw(fy), pr = popRatio(fy), o = {};
      Object.keys(r).forEach(function (k) { o[k] = r[k] * pr * ((k === 'ap' || k === 'dsp' || k === 'ca') ? wf(fy) : cf(fy)); });
      if (F4) o.st = (143000 + 23200 + 6600) * waScale(fy) * hhB('st', fy) * (1 + HHP.st.phi) / 2 / 1e9;   // [F4 r11 L1] the living allowance only
      return (repBC[fy] = o);
    }
    function jsCount(fy) { var B = hhB('js', fy), phi = HHP.js.phi; return repBase(fy).js * 1e9 / (B * (1 + phi) / 2); }

    // ---- scenario: AI displacement (user lever, or the paper's smallest trigger shock) and the unemployment rate ----
    function dispParams(ep) {
      var m = DISP.moderate, s = DISP.severe, f;
      if (ep <= 0) return { ep: 0, wage: 0, rec: 0, profit: 0 };
      if (ep <= m.ep) { f = ep / m.ep; return { ep: ep, wage: m.wage * f, rec: m.rec * f, profit: m.profit * f }; }
      if (ep <= s.ep) { f = (ep - m.ep) / (s.ep - m.ep); return { ep: ep, wage: m.wage + f * (s.wage - m.wage), rec: m.rec + f * (s.rec - m.rec), profit: m.profit + f * (s.profit - m.profit) }; }
      f = ep / s.ep; return { ep: ep, wage: s.wage * f, rec: s.rec * f, profit: s.profit * f };
    }
    var DP = opts.scn || dispParams(P.dispEp), EARLY = !!opts.early;
    var scnC = {};
    function scn(fy) {
      if (scnC[fy]) return scnC[fy];
      var y = fyS(fy), ph = EARLY ? Math.min(1, Math.max(0, (y - 2027) / 3)) : Math.min(1, Math.max(0, (y - 2031) / 4)), base = popBase(fy);
      var v = { dR: DP.rec * ph * base.R, disp: DP.ep * ph * base.elig_adults, wage: 1 - DP.wage * ph, profit: DP.profit * ph };
      if (P.unemp !== CASE_U0 && y >= 2028) { var x = (P.unemp / CASE_U0 - 1) * jsCount(fy); v.dR += x; v.disp += x; }
      return (scnC[fy] = v);
    }
    function rep(fy) {
      var r = Object.assign({}, repBase(fy)), v = scn(fy);
      if (v.dR) { var B = hhB('js', fy), phi = HHP.js.phi; r.js += v.dR * B * (1 + phi) / 2 / 1e9; }
      return r;
    }

    // ---- the six revenue measures ----
    var fundC = {};
    function fundingB(fy) {
      if (fundC[fy]) return fundC[fy];
      var k = fyS(fy) - 2028, grow = Math.pow(1 + MT_G, Math.max(0, k - 10)), o = {};
      Object.keys(FUND).forEach(function (n) {
        var s = FUND[n];
        if (k <= 10) o[n] = s[k] / 1000 * DELAY_B; else if (n === 'wealth') o[n] = 0;
        else if (ERODE && (n === 'fossil' || n === 'min')) o[n] = s[10] / 1000 * DELAY_B * Math.pow(1 + C, k - 10) * wf(fyN(2038)) / wf(fy);   // [F4 r11 T2] flat in real terms
        else if (n === 'prrt') o[n] = s[10] / 1000 * DELAY_B * Math.pow(1 + PRRT_TAIL, k - 10); else o[n] = s[10] / 1000 * DELAY_B * grow;
      });
      if (F3) o.pitx = PBO3901[Math.min(k, 10)] / 1000 * DELAY_B * (k > 10 ? grow : 1);      // [F3 T1] the PBO's own profile, then nominal GDP
      else o.pitx = k <= 3 ? PIT_FE / 1000 / 4 * DELAY_B : (PIT_MT - PIT_FE) / 1000 / 7 * DELAY_B * grow;
      if (NOWT) { o.wealth = 0; o.pitx = 0; }                  // [F4 options (iv), (v), (none)] no wealth tax, so no interaction line
      return (fundC[fy] = o);
    }
    var stackC = {}, SMULT = P.stackYield * (opts.stackMult || 1), EW = opts.ewMult || 1;
    function stackParts(fy) {
      if (stackC[fy]) return stackC[fy];
      var f = fundingB(fy), v = scn(fy), mult = SMULT * wf(fy), o = {}, mt = RHO !== null ? macroTerms(fy) : null;
      Object.keys(f).forEach(function (n) {
        var mu = mult;
        if (n === 'ept') mu *= P.eptYield * (1 + upliftTot(fy));
        if (n === 'min' || n === 'prrt') mu *= P.commodity;
        if (mt) {                     // [F62] the excess profits tax follows profits; the other measures move with nominal GDP
          if (n === 'ept') { o[n] = f[n] * mu + mt.dept; return; }
          if (n === 'wealth') mu *= 1 + v.profit;
          o[n] = f[n] * mu * mt.g; return;
        }
        if (n === 'ept' || n === 'wealth') mu *= (1 + v.profit) * EW;
        o[n] = f[n] * mu;
      });
      var t = 0; Object.keys(o).forEach(function (n) { t += o[n]; }); o.total = t; o.mt = mt;
      return (stackC[fy] = o);
    }
    // [F62] a displacement's market-income fall dM split between lost output (GDP falls) and profits (rho), from partF.macro_terms
    var RHO = (!opts.scn && DP.ep > 0 && P.macro in MACRO_RHO) ? MACRO_RHO[P.macro] : null, mkC = {};
    function baseMkt(fy) {           // market income and status-quo tax of the taxpayer pool with no displacement
      if (mkC[fy]) return mkC[fy];
      var p = popBase(fy), E = p.elig_adults, rem = p.R / (E * BOTTOM_SHARE), g = incomeGrowth(fy), mk = 0, sq = 0;
      for (var j = 0; j < NPT; j++) { var y = DI.inc[j] * g, n = E * DSHARE[j] * (DBOT[j] ? 1 - rem : 1); if (y > 0) mk += n * y; sq += n * oldTax(y, fy); }
      return (mkC[fy] = { mkt: mk * P.takeup / 1e9, sq: sq / 1e9 });
    }
    function scnMkt(fy) { var pl = pool(fy), mk = 0, sq = 0; for (var j = 0; j < NPT; j++) { if (pl.ys[j] > 0) mk += pl.ns[j] * pl.ys[j]; sq += pl.ns[j] * oldTax(pl.ys[j], fy); } return { mkt: mk * P.takeup / 1e9, sq: sq / 1e9 }; }
    function macroTerms(fy) {
      var v = scn(fy), f = fundingB(fy), ept0 = f.ept * SMULT * wf(fy) * P.eptYield * (1 + upliftTot(fy)), k = 0.4 * (1 - TAU_C) * PHI;
      var dM = baseMkt(fy).mkt - scnMkt(fy).mkt, dpiS = ept0 * v.profit / k, L = LAM * dM, dpi = dpiS + RHO * Math.max(0, L - dpiS), dY = Math.max(0, L - dpi);
      return { dM: dM, L: L, dpi: dpi, dY: dY, g: 1 - dY / gdp(fy), dept: k * dpi, ctax: TAU_C * dpi };
    }
    // [F63] status-quo cost of a displacement: extra JobSeeker plus lost personal income tax, less company tax on any extra profits
    function sqCost(fy) {
      var v = scn(fy), B = hhB('js', fy), phi = HHP.js.phi, sp = stackParts(fy);
      return v.dR * B * (1 + phi) / 2 / 1e9 + (baseMkt(fy).sq - scnMkt(fy).sq) - (sp.mt ? sp.mt.ctax : 0);
    }
    // [F57] the interaction line is charged to the fund while the wealth tax is collected; [F3 T1] in every year, as the line outlasts the tax
    function pitxFund(fy) { if (!F2) return 0; var sp = stackParts(fy); return (sp.wealth > 0 || F3) ? sp.pitx : 0; }
    // [F3 S1] share of eligible adults paid: lodgers at assessment, non-lodgers (no tax return, not on a payment) only if they enrol
    var clC = {};
    function claimShare(fy) {
      if (!F3) return 1; if (fy in clC) return clC[fy];
      var p = popBase(fy), E = p.elig_adults, nl = E * DSHARE[0] * (1 - p.R / (E * BOTTOM_SHARE));
      return (clC[fy] = 1 - nl / E * (1 - P.nlTakeup));
    }

    // ---- productivity and government AI investment ----
    var gInv = P.aiUpliftPer10 * P.aiInvest / 10;
    function upliftLp(fy) { return Math.pow((1 + P.lp) / 1.012, fyS(fy) - 2025) - 1; }
    function upliftTot(fy) { return (1 + upliftLp(fy)) * Math.pow(1 + gInv, Math.max(0, fyS(fy) - 2027)) - 1; }
    function gdpNoUp(fy) { return GDP0[fy] * wf(fy) * popRatio(fy); }
    function gdp(fy) { return gdpNoUp(fy) * (1 + upliftTot(fy)); }
    function extraRec(fy) { return receiptsShare(fy) * gdpNoUp(fy) * upliftTot(fy); }
    function extraRecLp(fy) { return receiptsShare(fy) * gdpNoUp(fy) * upliftLp(fy); }
    function invNet(fy) { var y = fyS(fy); if (y < 2027 || !P.aiInvest) return 0; return -P.aiInvest * wf(fy) + 0.5 * (extraRec(fy) - extraRecLp(fy)); }

    // ---- rates (pause: years of paused floor and child-payment indexation under the Act's zero-dividend rule) ----
    function shiftFy(fy, pause) { if (!pause) return fy; var y = fyS(fy); return fyN(y - Math.min(pause, Math.max(0, y - 2028))); }
    function ubiRate(fy, pf) { return pf * 26 * Math.pow(1.035, 1.25 + fyS(fy) - 2027) * wf(fy); }
    function childRate(fy, pause) { var f = shiftFy(fy, pause); return (FTB_A_U13_PF * 26 + FTB_A_SUPP_PA) * Math.pow(1.025, 1 + fyS(f) - 2027) * cf(f); }
    function wIdx(fy) { return Math.pow(1 + W, fyS(fy) - 2028); }
    function floorPa(fy, pw, pause) { var f = shiftFy(fy, pause); return (pw || P.floorPw) * 52 * Math.pow(1.035, fyS(f) - 2026 + 0.75) * wf(f); }
    function F_of(fy, pause) { return P.floorOn ? floorPa(fy, null, pause) : null; }
    function cpiIdx(fy) { return IC * Math.pow(1.025, fyS(fy) - 2026) * cf(fy); }
    function wageIdx(fy) { return IW * Math.pow(1.035, fyS(fy) - 2026) * wf(fy); }
    function csThreshold(fy) { return DATA.csr_threshold_2829 * Math.pow(1.035, fyS(fy) - 2028) * wf(fy); }

    function emin(B, phi, U) { return phi * Math.min(B, U) + (1 - phi) * (U >= B ? B / 2 : U - U * U / (2 * B)); }
    function adminSaving(fy) { var y = fyS(fy); if (y === 2027) return 0; var base = SA_DEPT[fy] ? SA_DEPT[fy] / 1e6 : SA_DEPT['2029-30'] / 1e6 * Math.pow(1.025, y - 2029); return 0.2 * base; }

    // ---- taxpayer pool (scenario-aware; the regime's tax scale) ----
    var poolC = {};
    function pool(fy) {
      if (poolC[fy]) return poolC[fy];
      var p = popBase(fy), E = p.elig_adults, R0 = p.R, v = scn(fy), rem = R0 / (E * BOTTOM_SHARE), g = incomeGrowth(fy) * v.wage;
      var ys = new Float64Array(NPT), ns = new Float64Array(NPT), j;
      for (j = 0; j < NPT; j++) { ys[j] = DI.inc[j] * g; ns[j] = E * DSHARE[j] * (DBOT[j] ? 1 - rem : 1); }
      if (v.disp || v.dR) {
        var earners = 0; for (j = 0; j < NPT; j++) if (ys[j] > 0) earners += ns[j];
        var moved = Math.min(v.disp, earners), f = Math.min(1, moved / earners);
        for (j = 0; j < NPT; j++) if (ys[j] > 0) ns[j] *= 1 - f;
        var toNil = Math.max(0, moved - v.dR), fromNil = Math.max(0, v.dR - moved);
        for (j = 0; j < NPT; j++) if (ys[j] === 0) { ns[j] += toNil - fromNil; break; }
      }
      return (poolC[fy] = { ys: ys, ns: ns });
    }
    var cbC = {};
    function clawback(fy, U, mpe) {
      var key = fy + '|' + U + '|' + TT + '|' + TL + '|' + mpe; if (cbC[key]) return cbC[key];
      var pl = pool(fy), stat = 0, dyn = 0, base = 0, mkt = 0, mtrw = 0, sq = 0;
      for (var j = 0; j < NPT; j++) {
        var y = pl.ys[j], n = pl.ns[j], to = oldTax(y, fy); sq += n * to;
        var cb = newTax(y + U, fy) - to; stat += n * cb;
        var dy = y > 0 ? -Math.min(y, mpe * Math.max(0, U - cb)) : 0, ym = y + dy, tn = newTax(ym + U, fy);
        dyn += n * (tn - to); base += n * (ym + U);
        if (ym > 0) { var mtr = (newTax(ym + U + 100, fy) - tn) / 100; mkt += n * ym; mtrw += n * ym * mtr; }
      }
      var k = P.takeup / 1e9;
      return (cbC[key] = { static: stat * k, dynamic: dyn * k, base: base * k, mkt: mkt * k, mtr: mtrw / mkt, sq: sq / 1e9 });
    }
    // per-person form of the taxpayer response [D12, E16]: each unit's own marginal rate
    var ppC = {};
    function ppPrep(fy, U) {
      var key = fy + '|' + U + '|' + TT + '|' + TL; if (ppC[key]) return ppC[key];
      var pl = pool(fy), grp = {}, out = [];     // units grouped by their marginal rate (the response is linear in n x income)
      for (var j = 0; j < NPT; j++) {
        var y = pl.ys[j], n = pl.ns[j], cb = newTax(y + U, fy) - oldTax(y, fy);
        var ym = y > 0 ? y - Math.min(y, P.mpe * Math.max(0, U - cb)) : 0;
        if (ym <= 0 || n <= 0) continue;
        var mt = (newTax(ym + U + 100, fy) - newTax(ym + U, fy)) / 100, k = String(mt);
        if (grp[k]) grp[k][0] += n * ym; else { grp[k] = [n * ym, mt]; out.push(grp[k]); }
      }
      return (ppC[key] = out);
    }
    function ppRev(r, t, eps) {
      if (t <= 0) return 0;
      var prep = r.pp, loss = 0; eps = eps || P.eti;
      for (var i = 0; i < prep.length; i++) { var mt = prep[i][1]; if (1 - mt - t <= 0) return NaN; loss += prep[i][0] * (1 - Math.pow((1 - mt - t) / (1 - mt), eps)) * (mt + t); }
      return t * r.B - loss * P.takeup / 1e9;
    }
    function ppNeed(r, gap) {
      if (gap <= 0) return 0;
      var best = -1e18, bt = 0;
      for (var i = 1; i < 60; i++) { var v = ppRev(r, i / 100); if (v !== v) v = -1e18; if (v > best) { best = v; bt = i / 100; } }
      if (best < gap) return NaN;
      var lo = 0, hi = bt; for (var k = 0; k < 30; k++) { var mid = (lo + hi) / 2; if (ppRev(r, mid) < gap) lo = mid; else hi = mid; }
      return hi;
    }

    // ---- design_year (Part B core) ----
    function designYear(fy, U, mpe, pause) {
      var p = population(fy), Ck = childRate(fy, pause);
      var ga = p.elig_adults * P.takeup * U / 1e9, gc = p.elig_kids * P.takeup * Ck / 1e9;
      var r = rep(fy), repT = 0, ns = 0, nfull = 0;
      PROGS.forEach(function (k) {
        var B = hhB(k, fy), phi = HHP[k].phi, n = r[k] * 1e9 / (B * (1 + phi) / 2);
        repT += n * emin(B, phi, U) / 1e9; ns += n; nfull += n * (U >= B * (1 - 1e-9) ? 1 : (1 - phi) * U / B);
      });
      repT += r.ftb;
      var adm = adminSaving(fy) * nfull / ns, cb = clawback(fy, U, mpe);
      return { ga: ga, gc: gc, gross: ga + gc, rep: repT, admin: adm, cb: cb.dynamic, net: ga + gc - repT - adm - cb.dynamic, B: cb.base, M: cb.mkt, m: cb.mtr, stack: stackParts(fy).total };
    }

    // ---- floor lift ----
    var lgC = {};
    function liftGroups(fy, F) {
      var key = fy + '|' + F; if (lgC[key]) return lgC[key];
      var v = scn(fy), jsCnt = 821000 + 98500 + 2400, ws = waScale(fy), out = [];
      LIFT_SUB.forEach(function (s) {
        var n = s[2] * ws;
        if (s[0] === 'js' && v.dR) n *= 1 + v.dR / (jsCnt * ws);
        var B = s[3] * 26 * cpiIdx(fy), single = SINGLE_REF[s[4]] * 26 * cpiIdx(fy), k = F ? Math.max(1, F / single) : 1;
        out.push({ prog: s[0], lab: s[1], n: n, phi: HHP[s[0]].phi, B: B, B2: B * k, d: B * k - B });
      });
      return (lgC[key] = out);
    }
    function uMin(lo, hi, U) { if (hi <= lo) return Math.min(lo, U); if (U >= hi) return (lo + hi) / 2; if (U <= lo) return U; return ((U * U - lo * lo) / 2 + U * (hi - U)) / (hi - lo); }
    function liftCost(fy, U, F, tau) {
      if (!F) return { static: 0, new: 0, dsave: 0, n_new: 0, caseload: 0, n_case: 0, case_other: 0, n_case_other: 0 };
      var G = liftGroups(fy, F), st = 0, nw = 0, ds = 0, nn_t = 0, cs = 0, ncs = 0, co = 0, nco = 0, yf = FORGONE_2627 * Math.pow(1.035, fyS(fy) - 2026) * wf(fy);
      G.forEach(function (g) {
        var n = g.n, phi = g.phi, B = g.B, d = g.d; if (d <= 0) return;
        var nn = n * (1 - phi) * d / B; st += n * d; nw += nn * d / 2;
        ds += n * phi * (Math.min(B + d, U) - Math.min(B, U)) + n * (1 - phi) * (uMin(d, B + d, U) - uMin(0, B, U)) + nn * uMin(0, d, U); nn_t += nn;
        var eps = g.prog === 'js' ? P.caseload : (F3 ? CASE_OTHER : 0);      // [F3 L1] students and Parenting Payment too
        if (eps > 0) {
          var nx = n * Math.pow((B + d) / B, eps) - n, cx = nx * (Math.max(0, B + d - U) + newTax(yf + U, fy) + tau * (yf + U));
          cs += cx; ncs += nx; if (g.prog !== 'js') { co += cx; nco += nx; }
        }
      });
      return { static: st / 1e9, new: nw / 1e9, dsave: ds / 1e9, n_new: nn_t, caseload: cs / 1e9, n_case: ncs, case_other: co / 1e9, n_case_other: nco };
    }

    // ---- family payments: hold-harmless top-up and the E14 rule (household-model flows for the chosen taper) ----
    function ftbTopup(fy) {
      if (!P.protections) return 0;
      var S = rep(fy).ftb, SB = FTB_B_SHARE * S, SA = (1 - FTB_B_SHARE) * S;
      var partB = SB * (FTB_PSI + (1 - FTB_PSI) * FTB_OMEGA), ix = Math.pow(1.025, fyS(fy) - 2026) * cf(fy);
      var avgMax = ((1 - TEEN) * (FTB_A_MAX_U13 * 26 + FTB_A_SUPP) + TEEN * (FTB_A_MAX_13P * 26 + FTB_A_SUPP)) * ix;
      return partB + SA * FTB_CHI * 1e9 / avgMax * TEEN * (FTB_A_MAX_13P - FTB_A_MAX_U13) * 26 * ix / 1e9;
    }
    function bhAt(y) { var e = P.eti; return e <= 0.2 ? y[4] + (e - 0.1) / 0.1 * (y[5] - y[4]) : y[5] + (e - 0.2) / 0.2 * (y[6] - y[5]); }
    function csRuleAdj(fy, gc) {
      var y = CSY[fy]; if (!y) return { mt: 0, net: 0, tm: 0, bh: 0, inc: 0 };
      // [F3 L1] the income effect of the child payment's net gain (16c a dollar, household.py csrule_f3), with the taper response
      var k = gc / y[0], tm = k * y[3], inc = F3 ? k * (y[7] || 0) : 0, bh = k * bhAt(y) + inc;
      if (!P.protections) return { mt: k * y[1], net: k * y[1] + tm + bh, tm: tm, bh: bh, inc: inc };
      return { mt: k * y[1], net: k * y[2] + tm + bh, tm: tm, bh: bh, inc: inc };
    }

    // ---- protected recipients' tax ----
    function sapto(x, couple) { var s = couple ? SAPTO_C : SAPTO_S; return Math.max(0, s[0] - s[2] * Math.max(0, x - s[1])); }
    function oldTaxRec(x, Pq, prog, fy, couple) { if (PENSION_TAX[prog]) return Math.max(0, oldTax(x, fy) - sapto(x, couple)); return Math.max(0, oldTax(x, fy) - oldTax(Pq, fy)); }
    function invIncome(prog, red, fy) {
      var it = INCOME_TEST[prog], ix = cpiIdx(fy), ifa = it[0] * 26 * ix, bd = it[2] ? it[2] * 26 * ix : null;
      if (bd === null) return ifa + red / it[1];
      var first = (bd - ifa) * it[1]; return red <= first ? ifa + red / it[1] : bd + (red - first) / it[3];
    }
    function incomeReduction(prog, y, fy) {
      var it = INCOME_TEST[prog], ix = cpiIdx(fy), ifa = it[0] * 26 * ix, bd = it[2] ? it[2] * 26 * ix : null;
      if (y <= ifa) return 0; if (bd === null || y <= bd) return (y - ifa) * it[1]; return (bd - ifa) * it[1] + (y - bd) * it[3];
    }
    var partsC = {};
    function programParts(fy, F) {
      var key = fy + '|' + F; if (partsC[key]) return partsC[key];
      var r = rep(fy), groups = F ? liftGroups(fy, F) : [], out = [];
      PROGS.forEach(function (prog) {
        var B = hhB(prog, fy), phi = HHP[prog].phi, n = r[prog] * 1e9 / (B * (1 + phi) / 2), nl = 0;
        groups.forEach(function (g) { if (g.prog === prog) { out.push([prog, g.n, phi, g.B, g.d]); nl += g.n; } });
        if (n > nl) out.push([prog, n - nl, phi, B, 0]);
      });
      return (partsC[key] = out);
    }
    var rpC = {};
    function recipientPoints(fy, F) {
      var key = fy + '|' + F; if (rpC[key]) return rpC[key];
      var pts = [];
      programParts(fy, F).forEach(function (pt) {
        var prog = pt[0], nn = pt[1], phi = pt[2], Bs = pt[3], d = pt[4], ifa = invIncome(prog, 0, fy), B2 = Bs + d, j;
        for (j = 0; j < 4; j++) pts.push([prog, nn * phi / 4, ifa * (j + 0.5) / 4, Bs, B2, 1, B2]);
        for (j = 0; j < 40; j++) { var Pq = (j + 0.5) / 40 * Bs; pts.push([prog, nn * (1 - phi) / 40, invIncome(prog, Bs - Pq, fy), Pq, Pq + d, 1, B2]); }
        if (d > 0) { var ne = nn * (1 - phi) * d / Bs; for (j = 0; j < 10; j++) { var Pn = (j + 0.5) / 10 * d; pts.push([prog, ne / 10, invIncome(prog, B2 - Pn, fy), 0, Pn, 0, B2]); } }
      });
      return (rpC[key] = pts);
    }
    function phaseStart(prog, fy, U, F, B2) { var y1 = U >= B2 ? 0 : invIncome(prog, B2 - U, fy); return Math.max(F || 0, y1); }
    function recTax(prog, y, Psq, Pn, B2, U, F, tau, fy, couple, levy) {
      var Pret = Math.max(0, Pn - U), tx = TAXABLE[prog];
      var Yabi = y + U + (tx ? Pret : 0), Ppay = U + (tx ? Pret : 0), PsqT = tx ? Psq : 0;
      var sq = oldTaxRec(y + PsqT, PsqT, prog, fy, couple), taxPaySq = oldTaxRec(PsqT, PsqT, prog, fy, couple);
      var nY = newTax(Yabi, fy), Ln = nY - newTax(Ppay, fy), Lsq = sq - taxPaySq;
      var full = nY + tau * Yabi + (levy || 0) * y;
      var o = { sq: sq, tax_pay_sq: taxPaySq, L_n: Ln, L_sq: Lsq, full: full, rec: 0, Yabi: Yabi, nY: nY };
      if (!P.protections) { o.prot = full; o.after = full; o.T = 0; o.s = 0; return o; }
      var prot = Math.min(Ln, Lsq) + (RPO_CAP ? taxPaySq : 0); o.prot = prot;
      var T = Math.max(0, full - prot), gainPre = (Math.max(U, Pn) - Psq) - (prot - sq), s = phaseStart(prog, fy, U, F, B2);
      o.rec = Math.min(T, PHASE_W * Math.max(0, y - s), Math.max(0, gainPre)); o.T = T; o.s = s; o.gainPre = gainPre;
      o.after = prot + o.rec; return o;
    }
    function transitional(prog, n, phi, Bs, dl, fy, U, F, tau) {
      if (!P.protections) return [];
      var B2 = Bs + dl, ycut = invIncome(prog, B2, fy), it = INCOME_TEST[prog];
      var dens = n * (1 - phi) / B2 * (it[2] ? it[3] : it[1]), s = phaseStart(prog, fy, U, F, B2), out = [];
      for (var yy = ycut + 500; yy < ycut + 400000; yy += 1000) {
        var T = Math.max(0, newTax(yy + U, fy) + tau * (yy + U) - oldTaxRec(yy, 0, prog, fy)), left = T - PHASE_W * Math.max(0, yy - s);
        if (left <= 0) break; out.push([yy, dens * 1000, left]);
      }
      return out;
    }
    function reconScale(fy, pts) { var s = 0; for (var i = 0; i < pts.length; i++) if (pts[i][5]) s += pts[i][1]; return population(fy).R / s; }
    var plC = {};
    function protectionLines(fy, U, F, tau) {
      var key = fy + '|' + U + '|' + F + '|' + tau + '|' + TT + '|' + TL; if (plC[key]) return plC[key];
      var pts = recipientPoints(fy, F), sc = reconScale(fy, pts), L = { gross_other: 0, ext: 0, rpo_pay: 0, new_prot: 0, recovery: 0, trans: 0, offnet: 0 };
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], w = p[1], t = recTax(p[0], p[2], p[3], p[4], p[6], U, F, tau, fy);
        if (p[5]) {
          w *= sc;
          if (!P.protections) { L.offnet += w * (t.after - t.sq); continue; }
          L.gross_other += w * (t.L_n - t.L_sq); L.ext -= w * Math.max(0, t.L_n - t.L_sq); if (!RPO_CAP) L.rpo_pay -= w * t.tax_pay_sq; L.recovery += w * t.rec;
        } else L.new_prot -= w * ((newTax(p[2] + U, fy) - oldTax(p[2], fy) + tau * (p[2] + U)) - (t.after - t.sq));
      }
      if (P.protections) programParts(fy, F).forEach(function (pt) { transitional(pt[0], pt[1], pt[2], pt[3], pt[4], fy, U, F, tau).forEach(function (x) { L.trans -= x[1] * sc * x[2]; }); });
      Object.keys(L).forEach(function (k) { L[k] /= 1e9; });
      L.net = L.gross_other + L.ext + L.rpo_pay + L.new_prot + L.recovery + L.trans + L.offnet;
      return (plC[key] = L);
    }
    function impl(fy, Dn) {        // Dn: Stage 1's dividend that year, nominal (prices the trial)
      var y = fyS(fy), c = 0;
      if (y === 2027) c += 0.21;
      if (y >= 2028) { var g = Math.pow(1.025, y - 2028); c += 0.06 * g; }
      if (y === 2028) c += 0.10;
      if (y === 2029 || y === 2030) c += 5000 * (ubiRate(fy, JS_BASIC) - Dn) / 1e9;
      if (y >= 2029 && y <= 2031) c += 0.105;
      return c;
    }
    // ---- design_c: the design, one year, under a tax regime ----
    var dcC = {};
    function designC(fy, U, F, tau, reg, pause, mpe) {
      mpe = mpe === undefined ? P.mpe : mpe; pause = pause || 0;
      var key = [fy, U, F, tau, reg.T, reg.L, pause, mpe].join('|'); if (dcC[key]) return dcC[key];
      return (dcC[key] = withReg(reg, function () {
        var r = designYear(fy, U, mpe, pause), lc = liftCost(fy, U, F, tau), ft0 = ftbTopup(fy), ca = csRuleAdj(fy, r.gc), pl = protectionLines(fy, U, F, tau);
        var rv = F2 ? (F4 ? HX.rev28 * r.gc / HX.gc28 : P2.rev28 * r.gc / P2.gc28) : 0;      // [F57] the income-fall review, indexed with the child payment's gross cost ([F4 r11] recalibrated)
        var net = r.net + lc.static + lc.new - lc.dsave + lc.caseload + ft0 + ca.net - pl.net + rv, ga = r.ga, gross = r.gross, unc = 0;
        if (F3 && reg === REG1 && U > 0) { unc = ga * (1 - claimShare(fy)); ga -= unc; gross -= unc; net -= unc; }   // [F3 S1] unclaimed dividend
        return Object.assign({}, r, { fy: fy, U: U, F: F, tau: tau, reg: reg, pause: pause, lift_static: lc.static, lift_new: lc.new, lift_dsave: lc.dsave,
          caseload: lc.caseload, n_case: lc.n_case, case_other: lc.case_other, n_case_other: lc.n_case_other, cs_inc: ca.inc, ga: ga, gross: gross, unclaimed: unc,
          ftb_topup: ft0 + ca.net + rv, ftb_topup0: ft0, cs_net: ca.net, cs_tm: ca.tm + rv, cs_bh: ca.bh, review: rv, prot: pl, net: net });
      }));
    }

    // ---- taxpayer response (standard form) and levies ----
    function etiRev(t, B, M, mm, eps) { if (t <= 0) return 0; eps = eps || P.eti; return t * B - M * (1 - Math.pow((1 - mm - t) / (1 - mm), eps)) * (mm + t); }
    function etiNeed(gap, B, M, mm, eps) {
      if (gap <= 0) return 0;
      var hiT = 1 - mm - 1e-6, prev = 0, t = 0;
      while (t < hiT) {
        t = Math.min(hiT, t + 0.005);
        if (etiRev(t, B, M, mm, eps) >= gap) { var lo = prev, hi = t; for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (etiRev(mid, B, M, mm, eps) < gap) lo = mid; else hi = mid; } return hi; }
        prev = t;
      }
      return NaN;
    }
    function jointRev(r, t, l) { var mm = r.m, M = r.M; if (1 - mm - t - l <= 0) return -Infinity; return t * r.B + l * M - M * (1 - Math.pow((1 - mm - t - l) / (1 - mm), P.eti)) * (mm + t + l); }
    function pkrT(r, t) { var best = -Infinity, bl = 0; for (var i = 0; i < Math.floor((1 - r.m - t) * 1000); i++) { var v = jointRev(r, t, i / 1000); if (v > best) { best = v; bl = i / 1000; } } return bl; }
    // [E17] smallest levy on market income that, with the rise t, closes the gap; NaN with the most it can add if none can
    function levyJoint(r, t, gap) {
      var base = jointRev(r, t, 0), lp = pkrT(r, t), most = jointRev(r, t, lp) - base;
      if (most < gap) return { rate: NaN, most: most, peak: lp };
      var lo = 0, hi = lp; for (var i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (jointRev(r, t, mid) - base < gap) lo = mid; else hi = mid; }
      return { rate: hi, most: most, peak: lp };
    }
    function peakLevy(r) { var best = -Infinity, bt = 0; for (var i = 1; i < Math.floor((1 - r.m) / 0.001); i++) { var v = etiRev(i * 0.001, r.M, r.M, r.m); if (v > best) { best = v; bt = i * 0.001; } } return { t: bt, rev: best }; }
    function peakRate(r) { var best = -Infinity, bt = 0; for (var i = 1; i < Math.floor((1 - r.m) / 0.001); i++) { var v = etiRev(i * 0.001, r.B, r.M, r.m); if (v > best) { best = v; bt = i * 0.001; } } return bt; }

    // ---- [F1-F12] the Permanent AI Dividend Fund, the dividend and the durable account: Stage 1 continuing ----
    var DISPLACED = DP.ep > 0;
    function phase(fy) { var y = fyS(fy); return EARLY ? Math.min(1, Math.max(0, (y - 2027) / 3)) : Math.min(1, Math.max(0, (y - 2031) / 4)); }
    var simC = {};
    // o: { r (fund return), payout (share of the 3-year average balance), funding ('levy' | 'borrow'), levyRate (false: skip the rate) }
    // the displacement loan [F57 L2]: in a declared displacement, after the reserve, the fund lends the durable gap at the bond rate up
    // to a quarter of its balance; the levy pays the interest until the Stage 2 vote's first year, then repays it over ten years
    var LOAN_ON = F2 && DISPLACED, trigL = DISPLACED ? youthTrigger(DP.ep) : null, REPAY_LOAN = trigL ? trigL.start : null;
    // [F4 T2] the never-cut guarantee lapses in the first year the levied top-up it needs would exceed 25% of that year's gross
    // dividend; from then the dividend is the payout rule's and the interaction line is charged to the fund's capital (the levy
    // bears it only once the fund is exhausted). [F4 L2] a displacement is declared only from the year the need test's
    // AI-displacement leg is met over eight quarters, the year before Stage 2 could start.
    var LAPSE = F4 ? 0.25 : null, DECL_Y = F4 && DISPLACED ? (trigL ? trigL.start - 1 : 9999) : null;
    function simFund(s, o) {
      o = o || {};
      var r = o.r !== undefined ? o.r : RF, payout = o.payout !== undefined ? o.payout : P.payout;
      var levyMode = (o.funding || P.funding) === 'levy', wantRate = o.levyRate !== false, loanOn = LOAN_ON && o.loan !== false;
      var key = [s, r, payout, levyMode, wantRate, loanOn].join('|'); if (simC[key]) return simC[key];
      var i_ = INT_RATE, lr = INT_RATE, F = 0, hist = [], Q = 0, A = 0, Dp = 0, startup = true, eptPrev = 0, out = [], Lo = 0, instL = null, loPeak = 0, loBy = null;
      var lapsed = false, lapseFy = null, kLoss = F2 ? P.wtLoss : 0;
      YEARS.forEach(function (fy, j) {
        var y = fyS(fy), N = population(fy).elig_adults * P.takeup, h = hist.slice(-AVG_N), avg = 0, cl = claimShare(fy);
        for (var q = 0; q < h.length; q++) avg += h[q] / h.length;
        var pomv = payout * avg, base = pomv + s * eptPrev, Dstar = base * 1e9 / N;
        var D = Math.max(Dp, Math.floor((1 - KEEP) * Dstar)), G = D * N * cl / 1e9;   // never cut in cash terms; [F3] the claimed share paid
        var avail = Q + pomv, sp = stackParts(fy), pxf = pitxFund(fy), wt = sp.wealth, cdraw = 0;
        if (LAPSE !== null) {
          var wdef4 = Math.max(0, -(wt + pxf - kLoss * wt));
          if (!lapsed && Math.max(0, G - avail) + Math.max(0, wdef4 - Math.max(0, avail - G)) > LAPSE * G + 1e-12) { lapsed = true; lapseFy = fy; }
          if (lapsed) {                     // the payout rule's dividend: last year's rate held while the account can pay it
            D = Math.max(Math.floor((1 - KEEP) * Math.max(0, pomv + s * eptPrev) * 1e9 / N), Math.min(Dp, Math.floor(Math.max(0, Q + pomv) * 1e9 / (N * cl))));
            G = D * N * cl / 1e9;
          }
        }
        var dshort = Math.max(0, G - avail);
        Q = Math.max(0, avail - G);
        var d = designC(fy, D, F_of(fy), 0, REG1, 0), im = impl(fy, D);
        var ept = sp.ept, stack = sp.total, dur = stack - wt - s * ept - pxf, costx = d.net + im - G, S = dur - costx;
        var wtIn = wt + pxf - kLoss * wt;       // [F57 T3] the wealth tax's net revenue to the fund
        var declared = DISPLACED && phase(fy) > 0 && (DECL_Y === null || y >= DECL_Y);
        var Aprev = A, LoOpen = Lo, draw = 0, levy = 0, tr = 0, borrow = 0, lend = 0, lInt = 0, lPrin = 0;
        var toLevy = function (x) { if (levyMode) levy += x; else { borrow += x; A -= x; } };
        if (j === 0 || S >= 0) {                // 2028-29: the start-up advance; later surpluses repay it first, then go to the fund
          var An = A * (1 + i_) + S;
          if (An >= 0) { tr = An; A = 0; startup = false; } else A = An;
        } else {                                // a later shortfall: in a declared displacement the reserve, then the loan, then a levy
          A = A * (1 + i_); var sh = -S;
          if (declared) { draw = Math.min(sh, Q); Q -= draw; sh -= draw; }
          if (loanOn && declared && (REPAY_LOAN === null || y < REPAY_LOAN)) { lend = Math.min(sh, Math.max(0, 0.25 * F - Lo)); Lo += lend; sh -= lend; }
          toLevy(sh);
        }
        if (A < 0 && y > REPAY_BY && levyMode) {   // an advance still outstanding after 2031-32 is repaid by the levy over five years
          var inst = -A / Math.max(1, 5 - (y - REPAY_BY - 1)); levy += inst; A += inst;
        }
        if (LoOpen > 1e-12) {                   // the levy services the loan, then repays it in equal instalments
          lInt = lr * LoOpen;
          if (REPAY_LOAN !== null && y >= REPAY_LOAN) {
            if (instL === null) instL = LoOpen * lr / (1 - Math.pow(1 + lr, -10));
            var pay = Math.min(instL, LoOpen * (1 + lr)); lPrin = pay - lInt; Lo -= lPrin; toLevy(pay);
          } else toLevy(lInt);
          if (Lo < 1e-9 && loBy === null && loPeak > 0) loBy = fy;
        }
        loPeak = Math.max(loPeak, Lo);
        var wdef = Math.max(0, -wtIn);           // a negative net is taken from the dividend account; [F4] after the lapse, from the fund's capital
        if (lapsed) cdraw = wdef; else { Q -= wdef; dshort += Math.max(0, -Q); }
        Q = Math.max(0, Q);
        Q = Q * (1 + i_) + s * ept;
        var exc = Math.max(0, Q - s * ept - CAP * G); Q -= exc;
        var Fo = F;
        if (F2) F = F + r * (F - LoOpen) + lr * LoOpen + Math.max(0, wtIn) + tr + exc - pomv - cdraw;    // the loan earns the bond rate
        else F = F * (1 + r) + wt + tr + exc - pomv;
        if (lapsed && F < 0) { var ex = -F; F = 0; cdraw -= ex; dshort += ex; }   // [F4] the fund exhausted: the line falls on the levy
        if (!levyMode && dshort > 0) { borrow += dshort; A -= dshort; }
        var lt = levy + (levyMode ? dshort : 0), rate = 0, capped = false;
        if (lt > 1e-9 && wantRate) { var lj = levyJoint(d, 0, lt); rate = lj.rate === lj.rate ? lj.rate : lj.peak; capped = lj.rate !== lj.rate; }
        hist.push(F);
        var ucb = stack + lt - d.net - im + i_ * Aprev;      // the fund's earnings are outside the cash balance [F3]
        out.push({ fy: fy, D: D, Dstar: Dstar, G: G, N: N, pomv: pomv, net: d.net, impl: im, costx: costx, stack: stack, dur: dur, wt: wt, ept: ept,
          S: S, A: A, Aprev: Aprev, adv: tr - lt - S, tr: tr, levy: levy, dshort: dshort, lt: lt, rate: rate, capped: capped, draw: draw, borrow: borrow,
          Q: Q, exc: exc, F: F, Fopen: Fo, earn: F2 ? r * (Fo - LoOpen) + lr * LoOpen : r * Fo, startup: startup, ucb: ucb, row: d,
          pxf: pxf, wtIn: wtIn, wdef: wdef, cdraw: cdraw, lapsed: lapsed, lapseFy: lapseFy, lend: lend, loan: Lo, lInt: lInt, lPrin: lPrin, loanPeak: loPeak, loanBy: loBy,
          declared: declared, review: d.review || 0, unc: d.unclaimed || 0, inc: d.cs_inc || 0, caseOther: d.case_other || 0 });
        Dp = D; eptPrev = ept;
      });
      return (simC[key] = out);
    }
    // [F4 Part 2 options] (iv) the same dividend as (i) paid from the durable account, with no wealth tax and no fund; (none) Part 1
    // alone. The five taxes go to the durable account, whose surpluses reduce debt at the debt rate; a negative balance after
    // 2031-32 is levied (partF_r10b.option_durable). Rows carry the fund-path fields so the rest of the page reads them alike.
    var sibC = null;
    function sibling() { return sibC || (sibC = createModel(DATA, Object.assign({}, P, { part2: 'i' }), opts)); }
    function simDurable(s, o) {
      o = o || {};
      var levyMode = (o.funding || P.funding) === 'levy', wantRate = o.levyRate !== false;
      var key = ['dur', s, o.r, o.payout, levyMode, wantRate].join('|'); if (simC[key]) return simC[key];
      var Dp = {}; if (OPT === 'iv') sibling().sim(s, { r: o.r, payout: o.payout, levyRate: false, funding: o.funding }).forEach(function (x) { Dp[x.fy] = x.D; });
      var i_ = INT_RATE, B = 0, out = [], startup = true;
      YEARS.forEach(function (fy, j) {
        var y = fyS(fy), D = Dp[fy] || 0, d = designC(fy, D, F_of(fy), 0, REG1, 0), im = impl(fy, D), sp = stackParts(fy);
        var rev = sp.total, Bp = B, S = rev - d.net - im, levy = 0, borrow = 0;
        // [F4-115] with no fund there is no lender: after 2031-32 the kept surpluses (the balance at the debt rate) meet a shortfall first
        var kdraw = (y > REPAY_BY && S < 0) ? Math.min(-S, Math.max(0, Bp * (1 + i_))) : 0;
        B = B * (1 + i_) + S;
        if (B < 0 && y > REPAY_BY) { if (levyMode) { levy = -B; B = 0; } else borrow = Math.max(0, -B - Math.max(0, -Bp)); }
        if (B >= 0) startup = false;
        var rate = 0, capped = false;
        if (levy > 1e-9 && wantRate) { var lj = levyJoint(d, 0, levy); rate = lj.rate === lj.rate ? lj.rate : lj.peak; capped = lj.rate !== lj.rate; }
        var G = d.ga;
        out.push({ fy: fy, D: D, Dstar: D, G: G, N: population(fy).elig_adults * P.takeup, pomv: 0, net: d.net, impl: im, costx: d.net + im, stack: rev, dur: rev,
          wt: 0, ept: sp.ept, S: S, A: B, Aprev: Bp, adv: j === 0 ? Math.max(0, -S) : 0, tr: 0, levy: levy, dshort: 0, lt: levy, rate: rate, capped: capped,
          draw: 0, borrow: borrow, Q: 0, exc: 0, F: 0, Fopen: 0, earn: 0, startup: startup, ucb: rev + levy - d.net - im + i_ * Bp, row: d, pxf: 0, wtIn: 0, wdef: 0,
          cdraw: 0, lapsed: false, lapseFy: null, lend: 0, loan: 0, lInt: 0, lPrin: 0, loanPeak: 0, loanBy: null, declared: false, review: d.review || 0,
          unc: d.unclaimed || 0, inc: d.cs_inc || 0, caseOther: d.case_other || 0, durable: true, bal: B, kdraw: kdraw });
      });
      return (simC[key] = out);
    }
    function sim(s, o) { return DURABLE ? simDurable(s, o) : simFund(s, o); }
    function firstLevy(o) { for (var i = 0; i < o.length; i++) if (o[i].lt > 1e-6) return o[i].fy; return null; }
    function feasible(o) {
      if (o.some(function (x) { return x.startup && fyS(x.fy) >= REPAY_BY; })) return false;
      var fl = firstLevy(o); return fl === null || fyS(fl) > SHARE_LAST;
    }
    // [F8] the largest share of the excess profits tax at which the durable taxes cover the floor, child payment, protections and
    // implementation to 2040-41 and repay the start-up advance by 2031-32 (bisection, then rounded down to a whole per cent)
    function chooseS() {
      if (DURABLE) return { raw: 0, leg: 0, none: false, na: true };     // no fund: the share rule does not apply
      var ok = function (x) { return feasible(sim(x, { levyRate: false, funding: 'levy' })); };
      if (!ok(0)) return { raw: 0, leg: 0, none: true };
      var lo = 0, hi = 1;
      for (var k = 0; k < 14; k++) { var mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
      return { raw: lo, leg: Math.floor(lo * 100 + 1e-9) / 100, none: false };
    }
    function ndebt(x) { var L = x.loan || 0; return { nd: -(x.A + x.Q + DEBT_SHARE * (x.F - L)), nfw: x.A + x.Q + x.F - L }; }   // the fund's loan to the Budget nets out
    // after 2045-46: no wealth tax, the excess profits tax growing with GDP, eligible adults at their last growth rate [F52]
    function perpetuity(o, s, r, payout, years) {
      var gG = gdp(YEARS[YEARS.length - 1]) / gdp(YEARS[YEARS.length - 2]) - 1, L = o.length, gN = o[L - 1].N / o[L - 2].N - 1;
      var hist = o.slice(-AVG_N).map(function (x) { return x.F; }), F = o[L - 1].F, Q = o[L - 1].Q, Dp = o[L - 1].D, ept = o[L - 1].ept, N = o[L - 1].N, out = [];
      var lastFy = YEARS[YEARS.length - 1], cl = claimShare(lastFy), Lx = F3 ? pitxFund(lastFy) : 0;   // [F3] the line outlasts the tax
      var lapsed = !!o[L - 1].lapsed;          // [F4 T2] the guarantee's state at 30 June 2046
      if (o[L - 1].durable) return out;        // no fund after 2045-46 under options (iv) and (none)
      for (var k = 1; k <= (years || 80); k++) {
        var y = 2045 + k; N *= 1 + gN;
        var eptPrev = ept; ept *= 1 + gG; Lx *= 1 + gG;
        var h = hist.slice(-AVG_N), avg = h.reduce(function (a, b) { return a + b; }, 0) / h.length, pomv = payout * avg;
        var D = Math.max(Dp, Math.floor((1 - KEEP) * (pomv + s * eptPrev) * 1e9 / N)), G = D * N * cl / 1e9;
        var avail = Q + pomv, cdraw = 0;
        if (LAPSE !== null) {
          if (!lapsed && Math.max(0, G - avail) + Math.max(0, -Lx - Math.max(0, avail - G)) > LAPSE * G + 1e-12) lapsed = true;
          if (lapsed) { D = Math.max(Math.floor((1 - KEEP) * Math.max(0, pomv + s * eptPrev) * 1e9 / N), Math.min(Dp, Math.floor(Math.max(0, Q + pomv) * 1e9 / (N * cl)))); G = D * N * cl / 1e9; }
        }
        var dsh = Math.max(0, G - avail);
        if (lapsed) { Q = Math.max(0, avail - G); cdraw = -Lx; }      // [F4] the line charged to the fund's capital; no top-up
        else { Q = Math.max(0, avail - G) + Lx; dsh += Math.max(0, -Q); }   // [F3] the line from the dividend account; the top-up levied
        Q = Math.max(0, Q) * (1 + INT_RATE) + s * ept;
        var exc = Math.max(0, Q - s * ept - CAP * G); Q -= exc;
        F = F * (1 + r) + exc - pomv - cdraw;
        if (F < 0) { dsh += -F; cdraw += F; F = 0; }                     // [F4] the fund exhausted: the line it cannot bear is levied
        hist.push(F);
        var dfl = Math.pow(1 + C, y - 2026);
        out.push({ y: y, fy: fyN(y), F: F, F26: F / dfl, D: D, D26: D / dfl, dshort: dsh, line: Lx, pomv: pomv, G: G, cdraw: cdraw, lapsed: lapsed }); Dp = D;
      }
      return out;
    }
    // the dividend path, its funding and the start-up advance, for the Stage 2 and 3 paths and Stage 1 in full (partF.py section 1)
    function ctxFrom(o, s) {
      var first = o.filter(function (x) { return x.D > 0; })[0], Uraw = first ? first.D / wIdx(first.fy) : 0, U1 = Math.round(Uraw), dur = !!o[0].durable;
      var fy0 = YEARS[0], d0 = designC(fy0, U1, F_of(fy0), 0, REG1, 0), sp0 = stackParts(fy0), DIVF = {}, ADVF = {}, Dn = {};
      if (dur) s = 0;                          // no fund: every tax stays with the durable account, which also pays any dividend
      o.forEach(function (x) { DIVF[x.fy] = dur ? 0 : x.G; ADVF[x.fy] = dur ? 0 : x.adv; Dn[x.fy] = x.D; });
      DIVF[fy0] = dur ? 0 : d0.ga; Dn[fy0] = U1;
      ADVF[fy0] = Math.max(0, d0.net + impl(fy0, U1) - (sp0.total - sp0.wealth - s * sp0.ept - pitxFund(fy0) + DIVF[fy0]));
      return { s: s, U1: U1, Uraw: Uraw, firstPay: first ? first.fy : null, DIVF: DIVF, ADVF: ADVF, Dn: Dn };
    }

    // ---- Stages 2 and 3 'if triggered': rises covering cost under both forms of the response [E15, E16]; funded by the durable
    // taxes plus the dividend paid from the fund (and the start-up advance) with the rise on top ----
    function runPathE(start2, start3, ctx, tau, wantNeed, mpe) {
      return YEARS.map(function (fy) {
        var y = fyS(fy), k = (start3 && y >= start3) ? 'd' : (start2 && y >= start2) ? 'c' : 'a';
        var st = k === 'd' ? 3 : k === 'c' ? 2 : 1, U = st === 1 ? ctx.Dn[fy] : ubiRate(fy, k === 'c' ? JS_BASIC : AP_MBR), reg = st === 1 ? REG1 : REG23;
        var t = tau[k] || 0, d = Object.assign({}, designC(fy, U, F_of(fy), t, reg, 0, mpe)), sp = stackParts(fy);
        d.key = k; d.stage = st; d.impl = impl(fy, ctx.Dn[fy]) + (ctx.extra ? ctx.extra[fy] || 0 : 0); d.stackTax = sp.total; d.wt = sp.wealth; d.ept = sp.ept;
        d.stack = sp.total - sp.wealth - ctx.s * sp.ept + ctx.DIVF[fy] + ctx.ADVF[fy] - pitxFund(fy);
        d.gap0 = d.net + d.impl - d.stack;
        d.rise_agg = t > 0 ? etiRev(t, d.B, d.M, d.m) : 0;
        d.need_agg = (st > 1 && d.gap0 > 0) ? etiNeed(d.gap0, d.B, d.M, d.m) : 0;
        if (st > 1) {
          d.pp = withReg(reg, function () { return ppPrep(fy, U); });
          d.rise_pp = t > 0 ? ppRev(d, t) : 0;
          d.need_pp = wantNeed ? ppNeed(d, d.gap0) : 0;
        } else { d.rise_pp = d.rise_agg; d.need_pp = 0; }
        return d;
      });
    }
    function solvePathE(start2, start3, ctx) {
      var t = { a: 0, c: 0, d: 0 }, rows = null, na, npp, keys = ['c', 'd'];
      for (var it = 0; it < 15; it++) {
        rows = runPathE(start2, start3, ctx, t, true);
        na = { c: 0, d: 0 }; npp = { c: 0, d: 0 };
        rows.forEach(function (r) { if (r.stage > 1) { na[r.key] = nmax(na[r.key], r.need_agg); npp[r.key] = nmax(npp[r.key], r.need_pp); } });
        var bad = keys.filter(function (k) { return na[k] !== na[k] || npp[k] !== npp[k]; });
        if (bad.length) return { tau_agg: na, tau_pp: npp, tau: null, rows: rows, feasible: false, infeasible: bad };
        var nw = { a: 0, c: Math.max(up(na.c), up(npp.c)), d: Math.max(up(na.d), up(npp.d)) };
        if (nw.c === t.c && nw.d === t.d) break;
        t = nw;
      }
      rows = runPathE(start2, start3, ctx, t, false);
      var tb16 = Object.assign({}, t), badK = [];
      var marg = function (r) { return Math.min(r.stack + r.rise_agg, r.stack + r.rise_pp) - r.net - r.impl; };
      for (var v = 0; v < 12; v++) {
        badK = ['c', 'd'].filter(function (k) { return rows.some(function (r) { return r.key === k && marg(r) < -1e-9; }); });
        if (!badK.length) break;
        badK.forEach(function (k) { t[k] = Math.round((t[k] + 0.001) * 1e6) / 1e6; });
        rows = runPathE(start2, start3, ctx, t, false);
      }
      var short = null;
      if (badK.length) {
        badK.forEach(function (k) {
          var best = null;
          for (var i = -20; i <= 12; i += 2) {
            var tk = Object.assign({}, t); tk[k] = Math.round((tb16[k] + i / 1000) * 1000) / 1000;
            var rr = runPathE(start2, start3, ctx, tk, false);
            var vv = Math.min.apply(null, rr.filter(function (r) { return r.key === k; }).map(marg));
            if (!best || vv > best[0] + 1e-9) best = [vv, tk, rr];
          }
          t = best[1]; rows = best[2];
        });
        var w = null;
        rows.forEach(function (r) { if (r.stage > 1) { var mg = marg(r); if (!w || mg < w.margin) w = { margin: mg, fy: r.fy, form: r.rise_pp < r.rise_agg ? 'per-person' : 'aggregate', key: r.key }; } });
        short = w;
      }
      return { tau_agg: { c: up(na.c), d: up(na.d) }, tau_pp: { c: up(npp.c), d: up(npp.d) }, tau: t, rows: rows, feasible: !badK.length, short: short };
    }
    // the B16 rule in the aggregate form only (partc.solve_taus): the earliest-dates path of the validation block
    function solveTausAgg(ctx) {
      var t = { a: 0, c: 0, d: 0 }, rows;
      for (var it = 0; it < 8; it++) {
        rows = runPathE(2032, 2037, ctx, t, false);
        var need = { a: 0, c: 0, d: 0 };
        rows.forEach(function (r) { var gap = r.net + r.impl - r.stack; if (gap > 0 && r.stage > 1) need[r.key] = Math.max(need[r.key], etiNeed(gap, r.B, r.M, r.m)); });
        var nw = { a: 0, c: up(need.c), d: up(need.d) };
        if (nw.c === t.c && nw.d === t.d) {
          var ok = rows.every(function (r) { return r.stack + (t[r.key] > 0 ? etiRev(t[r.key], r.B, r.M, r.m) : 0) - r.net - r.impl >= -1e-9; });
          if (ok) return { tau: t, rows: rows };
          ['c', 'd'].forEach(function (k) { if (nw[k] > 0) nw[k] += 0.001; });
        }
        t = nw;
      }
      return { tau: t, rows: runPathE(2032, 2037, ctx, t, false) };
    }
    function fiscalPathC(rows, tau) {   // plain fiscal path against the baseline (validation block)
      var dnd = 0, out = {};
      rows.forEach(function (r) {
        var interest = INT_RATE * dnd, t = tau[r.key] || 0, dbal = r.stack + (t > 0 ? etiRev(t, r.B, r.M, r.m) : 0) - r.net - r.impl - interest;
        dnd -= dbal; var G = gdp(r.fy), ub = ucbBase(r.fy), ndb = ND_BASE_PCT[r.fy] / 100 * G;
        out[r.fy] = { ucb_base: ub, ucb: ub + 100 * dbal / G, nd_base: 100 * ndb / G, nd: 100 * (ndb + dnd) / G, dnd: dnd };
      });
      return out;
    }
    // ---- the Budget on the Future Fund basis [F3]: cash balance (fund earnings outside it), net debt (the fund's cash and credit
    // only) and net financial worth (all of it), against the baseline; Stage 1 from the fund simulation, Stages 2 and 3 with the
    // legislated rise and the correction levy [E17], their surpluses held at the debt rate ----
    function budgetRows(rows, tau, base, ctx, funding, isSim) {
      var levyMode = funding === 'levy', Ap = 0, Fp = 0, Dinv = P.aiInvest ? -invNet('2027-28') : 0, out = [], i_ = INT_RATE;
      rows.forEach(function (r, j) {
        var x = base[j], G = gdp(r.fy), rec = { fy: r.fy, key: r.key, stage: r.stage };
        Dinv = Dinv * (1 + i_) - invNet(r.fy);
        if (isSim) {
          Object.assign(rec, { dur: x.dur, div: x.G - (levyMode ? x.dshort : 0), draw: x.draw, rise: 0, rate: 0, levy: x.rate, levyRev: x.lt, capped: x.capped,
            topup: levyMode ? x.dshort : 0, adv: j === 0 ? Math.max(0, -x.S) : 0, borrow: x.borrow, ucbBn: x.ucb + invNet(r.fy), A: x.A, Q: x.Q, F: x.F, D: x.D,
            earn: x.earn, pomv: x.pomv });
        } else {
          var t = tau[r.key] || 0, rise = r.stage > 1 && t > 0 ? Math.min(etiRev(t, r.B, r.M, r.m), r.rise_pp === undefined ? Infinity : r.rise_pp) : 0;
          var gap = r.net + r.impl - r.stack - rise, levyRev = 0, levy = 0, capped = false, borrow = 0;
          if (gap > 1e-9 && levyMode) {
            var lj = withReg(r.reg, function () { return levyJoint(r, t, gap); });
            if (lj.rate === lj.rate) { levy = lj.rate; levyRev = gap; } else { levy = lj.peak; levyRev = lj.most; capped = true; borrow = gap - lj.most; }
          } else if (gap > 1e-9) borrow = gap;
          var Aprev = Ap, earnP = RF * Fp;
          Ap = Ap * (1 + i_) + (r.stack - ctx.ADVF[r.fy] + rise + levyRev - r.net - r.impl);
          Fp = Fp * (1 + RF) + (F2 ? Math.max(0, x.wtIn) : x.wt) + x.exc - x.pomv;
          Object.assign(rec, { dur: r.stack - ctx.DIVF[r.fy] - ctx.ADVF[r.fy], div: ctx.DIVF[r.fy], draw: 0, rise: rise, rate: t, levy: levy, levyRev: levyRev,
            capped: capped, topup: 0, adv: Math.max(0, ctx.ADVF[r.fy]), borrow: borrow, ucbBn: r.stackTax + rise + levyRev - r.net - r.impl + i_ * Aprev + invNet(r.fy),
            A: Ap, Q: x.Q, F: Fp, D: x.D, earn: earnP, pomv: x.pomv });
        }
        var nd = -(rec.A + rec.Q + DEBT_SHARE * rec.F) + Dinv, nfw = rec.A + rec.Q + rec.F - Dinv, ub = ucbBase(r.fy), ndb = ND_BASE_PCT[r.fy];
        Object.assign(rec, { ndBn: nd, nfwBn: nfw, ucb_base: ub, ucb: ub + 100 * rec.ucbBn / G, ucbEarn: ub + 100 * (rec.ucbBn + rec.earn) / G,
          ucbDraw: ub + 100 * (rec.ucbBn + rec.pomv) / G, nd_base: ndb, nd: ndb + 100 * nd / G, gdp: G,
          fund26: rec.F / Math.pow(1 + C, fyS(r.fy) - 2026) });
        out.push(rec);
      });
      return out;
    }

    // ---- distribution ----
    function childNetFiscal(fy, pause) {   // the child payment allocated to adults; take-up 98% as partc.child_net_fiscal's default
      var gc = population(fy).elig_kids * 0.98 * childRate(fy, pause) / 1e9;
      return gc - rep(fy).ftb + ftbTopup(fy) + csRuleAdj(fy, gc).net;
    }
    function splitFor(fy) {
      var y = fyS(fy), base = y >= 2037 ? '2037-38' : y >= 2032 ? '2032-33' : '2028-29';
      return { sp: CSPLIT[base], defl: Math.pow(1.035, fyS(base) - y) / wf(fy) * wf(base) };
    }
    function distUnits(fy, U, F, tau, levy, reg, pause) {
      return withReg(reg, function () {
        levy = levy || 0;
        var p = population(fy), E = p.elig_adults, R = p.R, rem = R / (E * BOTTOM_SHARE), g = incomeGrowth(fy), units = [], j;
        for (j = 0; j < NPT; j++) { var y = DI.inc[j] * g, n = E * DSHARE[j] * (DBOT[j] ? 1 - rem : 1); units.push([y, n, U - (newTax(y + U, fy) - oldTax(y, fy)) - tau * (y + U) - levy * y, 0]); }
        var nAto = units.length, pts = recipientPoints(fy, F), wrec = 0, extra = {};
        pts.forEach(function (q) { if (q[5]) wrec += q[1]; });
        pts.forEach(function (q) {
          var t = recTax(q[0], q[2], q[3], q[4], q[6], U, F, tau, fy, false, levy);
          if (q[5]) units.push([q[2] + q[3], q[1] * R / wrec, (Math.max(U, q[4]) - q[3]) - (t.after - t.sq), 1]);
          else {
            var counted = U - (newTax(q[2] + U, fy) - oldTax(q[2], fy)) - tau * (q[2] + U) - levy * q[2], real = Math.max(U, q[4]) - (t.after - t.sq), b = Math.floor(q[2] / 5000);
            extra[b] = (extra[b] || 0) + q[1] * (real - counted);
          }
        });
        var sc = reconScale(fy, pts);
        programParts(fy, F).forEach(function (pt) { transitional(pt[0], pt[1], pt[2], pt[3], pt[4], fy, U, F, tau).forEach(function (x) { var b = Math.floor(x[0] / 5000); extra[b] = (extra[b] || 0) + x[1] * sc * x[2]; }); });
        var wbin = {};
        for (j = 0; j < nAto; j++) { var b = Math.floor(units[j][0] / 5000); wbin[b] = (wbin[b] || 0) + units[j][1]; }
        for (j = 0; j < nAto; j++) { var bb = Math.floor(units[j][0] / 5000); if (extra[bb] && wbin[bb]) units[j][2] += extra[bb] / wbin[bb]; }
        var S = splitFor(fy), raw = 0, sg = units.map(function (u) { return S.sp[u[3] ? 'rec' : 'nr'][String(Math.floor(u[0] * S.defl / 5000))] || [0, 0]; });
        for (j = 0; j < units.length; j++) raw += units[j][1] * sg[j][0] * sg[j][1];
        var k = raw > 0 ? childNetFiscal(fy, pause) * 1e9 / raw : 0, out = [];
        for (j = 0; j < units.length; j++) {
          var u = units[j], sh = sg[j][0], ga = sg[j][1];
          if (sh > 0 && ga > 0) { out.push([u[0], u[1] * sh, u[2] + k * ga, u[3]]); if (sh < 1) out.push([u[0], u[1] * (1 - sh), u[2], u[3]]); }
          else out.push(u);
        }
        return out;
      });
    }
    function deciles(units) {
      var us = units.slice().sort(function (a, b) { return a[0] - b[0]; }), tot = 0, i;
      for (i = 0; i < us.length; i++) tot += us[i][1];
      var out = []; for (i = 0; i < 10; i++) out.push([0, 0, 0, 0, 0]);
      var cum = 0;
      for (i = 0; i < us.length; i++) {
        var y = us[i][0], gn = us[i][2], rem = us[i][1];
        while (rem > 1e-9) {
          var d = Math.min(9, Math.floor(cum / tot * 10 + 1e-12)), cap = (d + 1) * tot / 10 - cum, take = d < 9 ? Math.min(rem, cap) : rem;
          if (take <= 1e-9) { cum += 1e-9; continue; }
          var r = out[d]; r[0] += take; r[1] += take * y; r[2] += take * gn; r[3] += take * (gn > 1); r[4] += take * (gn < -1);
          cum += take; rem -= take;
        }
      }
      return out.map(function (r, i) { return { decile: i + 1, adults: r[0], pre: r[1] / r[0], gain: r[2] / r[0], better: r[3] / r[0], worse: r[4] / r[0] }; });
    }
    function distSummary(row) {
      var u = distUnits(row.fy, row.U, row.F, row.tau || 0, row.levyRate || 0, row.reg, row.pause), tot = 0, bet = 0, wor = 0, gpos = 0;
      u.forEach(function (x) { tot += x[1]; if (x[2] > 1) bet += x[1]; if (x[2] < -1) wor += x[1]; if (x[2] > 0) gpos += x[1] * x[2]; });
      return { fy: row.fy, deciles: deciles(u), better: bet / tot, worse: wor / tot, gains: gpos / 1e9 };
    }

    // ---- household poverty: Stage 1 (in full, 2028-29) from household-model runs at Part F, interpolated on the floor; the
    // dividend's effect is under 0.1 point at these sizes; Stages 2 and 3 are the paper's figures ----
    function poverty(U1) {
      var H = DATA.hh, st = H.stages, FL = H.floor, UG = H.U;
      var fk = [[416.85, FL.off], [450, FL['450.00']], [500, FL['500.00']], [569.81, FL['569.81']], [650, FL['650.00']], [750, FL['750.00']]];
      var uk = [0, 83, 300, 700, 1500].map(function (u) { return [u, UG[String(u)]]; });
      function lin(knots, x, line, grp) {
        x = Math.max(knots[0][0], Math.min(knots[knots.length - 1][0], x)); var i = 0;
        while (i < knots.length - 2 && x > knots[i + 1][0]) i++;
        var a = knots[i], b = knots[i + 1]; return a[1][line][grp] + (x - a[0]) / (b[0] - a[0]) * (b[1][line][grp] - a[1][line][grp]);
      }
      var X = HX ? (F4 ? HX.opts[OPT].hh : HX.hh) : null, u = U1 / wf('2028-29'), u0 = HX ? (F4 ? HX.opts[OPT].hh.U : HX.U1) : 83;
      var ref = X ? { rel: { all: X.rel, u15: X.u15 }, anch: { all: X.anch } } : null;    // the household model at the Part F2 or F3 dividend
      function at(line, grp) {
        var fl = P.floorOn ? lin(fk, P.floorPw, line, grp) : FL.off[line][grp], v;
        if (ref) v = ref[line][grp] + (fl - FL['569.81'][line][grp]) + (lin(uk, u, line, grp) - lin(uk, u0, line, grp));
        else v = fl + lin(uk, u, line, grp) - UG['83'][line][grp];
        return Math.max(0, v);
      }
      return { base: [st.a.base, st.c.base, st.d.base], rel: [at('rel', 'all'), st.c.rel, st.d.rel], anch: [at('anch', 'all'), st.c.anch, st.d.anch],
        child: [at('rel', 'u15'), st.c.rel_u15, st.d.rel_u15], childBase: st.a.base_u15, years: [st.a.fy, st.c.fy, st.d.fy],
        noDiv: HX ? { rel: HX.hh.nodiv } : H.no_div, pkg: H.package, divEffect: lin(uk, u, 'rel', 'all') - UG['0'].rel.all,
        pens: HX ? HX.pens : null, lag: F3 ? HX.lag : null };
    }
    function impulseBp(row, gains, risen) {
      var imp = risen ? DELTA_TAX * gains + (MPC_GAP - DELTA_TAX) * row.stack : MPC_GAP * gains;
      return { pct: 100 * imp / gdp(row.fy), bp: 100 * imp / gdp(row.fy) * P.bpPerPct };
    }
    function annuity(D, r, n) { var i = r / 12; return 12 * D * i / (1 - Math.pow(1 + i, -12 * n)); }

    // ---- a person or household (generalises partc.household; E14 child payment, E21) ----
    function ftbCurrent(ati, kids, fy, single, incomeSupport, primary, secondary) {
      if (!kids.length) return [0, 0];
      var ix = Math.pow(1.025, fyS(fy) - 2026) * cf(fy), mx = 0;
      kids.forEach(function (a) { mx += (a < 13 ? FTB_A_MAX_U13 : FTB_A_MAX_13P) * 26; }); mx *= ix;
      var base = kids.length * FTB_A_BASE * 26 * ix, supp = kids.length * FTB_A_SUPP * ix, A;
      if (incomeSupport) A = mx + supp;
      else { A = Math.max(base, mx - 0.2 * Math.max(0, ati - FTB_A_MAXTEST * ix)); A = Math.max(0, A - 0.3 * Math.max(0, ati - FTB_A_BASETEST * ix)); A += ati <= FTB_A_SUPP_LIMIT * ix ? supp : 0; }
      var youngest = Math.min.apply(null, kids), Bmax = ((youngest < 5 ? FTB_B_U5 : FTB_B_5P) * 26 + FTB_B_SUPP) * ix, Bv;
      if (single) Bv = (incomeSupport || ati <= FTB_B_PRIMARY * ix) ? Bmax : 0;
      else Bv = (primary > FTB_B_PRIMARY * ix || youngest >= 13) ? 0 : Math.max(0, Bmax - FTB_B_TAPER * Math.max(0, secondary - FTB_B_SECOND_FREE * ix));
      return [A, Bv];
    }
    // [E14] max(G, S, 0), held harmless to current FTB A+B; x = parents' combined income (prior year, excluding the dividend)
    function famE(kids, x, fy, single, secondary, cur, s1, incsup) {
      var n = kids.length; if (!n) return { pay: 0, supp: 0, top: 0 };
      var d1 = s1 && S1D !== 'p1' ? S1D : null;
      if (s1 && PHASED && fy === '2028-29') return { pay: cur, supp: cur, top: 0, G: 0, S: 0 };       // [option B] families keep current FTB
      var ix = Math.pow(1.025, fyS(fy) - 2026) * cf(fy), cs = childRate(fy, 0), mx = 0;
      kids.forEach(function (a) { mx += (a < 13 ? FTB_A_MAX_U13 : FTB_A_MAX_13P) * 26; }); mx *= ix;
      var supp = n * FTB_A_SUPP * ix, Bmax = ((Math.min.apply(null, kids) < 5 ? FTB_B_U5 : FTB_B_5P) * 26 + FTB_B_SUPP) * ix, Be;
      if (single) Be = Bmax; else if (Math.min.apply(null, kids) >= 13) Be = 0; else Be = Math.max(0, Bmax - FTB_B_TAPER * Math.max(0, secondary - FTB_B_SECOND_FREE * ix));
      var G = n * cs + mx + supp + Be - TAPER * Math.max(0, x - FTB_A_MAXTEST * ix), S = n * cs - TAPER * Math.max(0, x - csThreshold(fy));
      var pay = Math.max(0, G, S);
      // [option B] P*: Part 1's G schedule with the per-child amount D (moving with the child supplement), no supplement-only schedule S
      if (d1 === 'pstar') pay = Math.max(0, G + n * (OB.pstarD * cs / childRate('2028-29', 0) - cs));
      // [option B] the targeted package keeps FTB and adds D a child (CPI-indexed), withdrawn at 20c above the max-rate income test
      // unless a parent is on income support
      if (d1 === 'pkg') { var inc = n * OB.pkgD * cpiIdx(fy) / cpiIdx('2028-29'); return { pay: cur + (incsup ? inc : Math.max(0, inc - OB.ftbTaper * Math.max(0, x - FTB_A_MAXTEST * ix))), supp: cur + (incsup ? inc : Math.max(0, inc - OB.ftbTaper * Math.max(0, x - FTB_A_MAXTEST * ix))), top: 0, G: G, S: S }; }
      var held = P.protections && cur > pay + 1e-9;
      return { pay: held ? cur : pay, supp: pay, top: held ? cur - pay : 0, G: G, S: S };
    }
    // [option B] Rent Assistance under current rules for a private-renting income unit (household.cra_unit), maximum rates times mult
    function craUnit(kind, rentPf, fy, mult) { var r = OB.cra[kind], ix = cpiIdx(fy); return 26 * Math.min(r[0] * ix * mult, OB.craTaper * Math.max(0, rentPf - r[1] * ix)); }
    // [option B] the package's earned-income credit (household.eitc_low): 20c a dollar of earnings up to C, then 20c to nil at the cut-out;
    // C and the cut-out wage-indexed from 2028-29 (ASSUMPTION, as optionb_hh.py)
    function credit(y, fy) { var w = wageIdx(fy) / wageIdx('2028-29'), C = OB.creditC * w, cut = OB.creditCut * w, tp = cut - C / 0.2; return y <= 0 ? 0 : Math.max(0, Math.min(0.2 * y, C) - 0.2 * Math.max(0, y - tp)); }
    function s1Extras(h, fy, y1, y2, pay, kids, ab) {
      var out = { credit: 0, cra: 0 }, d1 = S1D; if (d1 === 'p1') return out;
      if (d1 === 'pkg' && !(PHASED && fy === '2028-29')) out.credit = credit(y1, fy) + (h.couple ? credit(y2, fy) : 0);
      if (h.housing === 'rent' && h.rentPw > 0) {
        var ixb = Math.pow(1.025, fyS(fy) - 2026) * cf(fy), n = kids.length;
        var above = n && ab[0] > n * FTB_A_BASE * 26 * ixb * 1.0001 + n * FTB_A_SUPP * ixb;
        if ((pay && pay.Psq > 0) || above) {
          var kind = h.couple ? (n ? 'couple_kids' : 'couple') : (n ? 'single_kids' : 'single');
          out.cra = craUnit(kind, h.rentPw * 2, fy, 1 + OB.craX) - craUnit(kind, h.rentPw * 2, fy, 1);
        }
      }
      return out;
    }
    function paymentFor(kind, y, fy, F, couple, coupleIncome) {
      var ci = cpiIdx(fy), wi = wageIdx(fy), mx, B2, red, prog;
      if (kind === 'none') return null;
      if (kind === 'js') { prog = 'js'; mx = (couple ? 755.10 + 7.90 : 824.90 + 8.80) * 26 * ci; B2 = F ? mx * Math.max(1, F / (SINGLE_REF.JS * 26 * ci)) : mx; red = incomeReduction('js', y, fy); }
      else if (kind === 'ya') { prog = 'st'; mx = (677.20 + 8.80) * 26 * ci; B2 = F ? mx * Math.max(1, F / (SINGLE_REF.YA * 26 * ci)) : mx; red = incomeReduction('st', y, fy); }
      else if (kind === 'pp') {
        prog = 'pp';
        if (couple) { mx = (755.10 + 7.90) * 26 * ci; B2 = F ? mx * Math.max(1, F / (SINGLE_REF.PPP * 26 * ci)) : mx; red = incomeReduction('js', y, fy); }
        else { var ps = 30.70 * 26 * ci; mx = 1080.20 * 26 * ci; B2 = F ? Math.max(mx, F + ps) : mx; red = Math.max(0, y - 232.60 * 26 * ci) * 0.4; }
      } else { prog = kind === 'ap' ? 'ap' : kind === 'dsp' ? 'dsp' : 'ca'; mx = (couple ? 855.90 : 1135.40) * 26 * wi; B2 = mx; red = couple ? 0.25 * Math.max(0, coupleIncome - 396.0 * 26 * ci) : 0.5 * Math.max(0, y - 226.0 * 26 * ci); }
      return { prog: prog, Psq: Math.max(0, mx - red), Pn: Math.max(0, B2 - red), B2: B2, mx: mx, taxable: TAXABLE[prog] };
    }
    // h: { couple, y1, y2, kind, kids, housing, rentPw, mortgage }; st: { fy, U, F, tau, levy, bp, reg }
    function household(h, st, y1) {
      return withReg(st.reg, function () {
        var fy = st.fy, U = st.U, F = st.F, tau = st.tau, levy = st.levy || 0;
        y1 = y1 === undefined ? h.y1 : y1;
        var y2 = h.couple ? h.y2 : 0, comb = y1 + y2, pay = paymentFor(h.kind, y1, fy, F, h.couple, comb);
        if (pay && h.couple && (pay.prog === 'js' || pay.prog === 'st' || pay.prog === 'pp') && y2 > 2686.67 * 26 * cpiIdx(fy)) { pay.Psq = 0; pay.Pn = 0; }
        var kids = h.kids || [], recip = !!(pay && (pay.Psq > 0 || pay.Pn > 0));
        var fam = null, ab = [0, 0], support = !!(pay && pay.Psq > 0), ati = comb + (pay && pay.taxable ? pay.Psq : 0);
        var s1 = !!(st.reg && st.reg.T > 0);   // [option B] the Stage 1 design applies at Stage 1 only
        if (kids.length) { ab = ftbCurrent(ati, kids, fy, !h.couple, support, Math.max(y1, y2), Math.min(y1, y2)); fam = famE(kids, ati, fy, !h.couple, h.couple ? Math.min(y1, y2) : 0, ab[0] + ab[1], s1, support); }
        var cur = 0, abi = 0, parts = { U: 0, tax: 0, replaced: 0, prot: 0, child: 0, rise: 0 };
        if (recip) {
          var PsqT = pay.taxable ? pay.Psq : 0;
          cur += y1 + pay.Psq - oldTaxRec(y1 + PsqT, PsqT, pay.prog, fy, h.couple);
          var t = recTax(pay.prog, y1, pay.Psq, pay.Pn, pay.B2, U, F, tau, fy, h.couple, levy), after = t.after;
          if (fam && P.protections && t.rec > 0) {        // [E21] the phase-out counts what the child payment has already withdrawn
            var payS = paymentFor(h.kind, t.s, fy, F, h.couple, t.s + y2), PsqS = payS ? payS.Psq : 0;
            var atiS = t.s + y2 + (payS && payS.taxable ? PsqS : 0), abS = ftbCurrent(atiS, kids, fy, !h.couple, PsqS > 0, Math.max(t.s, y2), Math.min(t.s, y2));
            var famS = famE(kids, atiS, fy, !h.couple, h.couple ? Math.min(t.s, y2) : 0, abS[0] + abS[1], s1, PsqS > 0).pay;
            var fw = Math.max(0, famS - fam.pay);
            after = t.prot + Math.min(t.T, Math.max(0, PHASE_W * Math.max(0, y1 - t.s) - fw), Math.max(0, t.gainPre));
          }
          var Pret = Math.max(0, pay.Pn - U);
          abi += y1 + U + Pret - after;
          parts.U += U; parts.replaced += -Math.min(pay.Psq, U); parts.prot += Pret - Math.max(0, pay.Psq - U) + (t.full - after);
          parts.offset = (parts.offset || 0) + (t.full - after);   // [option B] the protection offset on tax, for display (a part of prot)
          parts.tax += -(t.nY - t.sq); parts.rise += -(tau * t.Yabi + levy * y1);
        } else {
          cur += y1 - oldTax(y1, fy); abi += y1 + U - newTax(y1 + U, fy) - tau * (y1 + U) - levy * y1;
          parts.U += U; parts.tax += -(newTax(y1 + U, fy) - oldTax(y1, fy)); parts.rise += -(tau * (y1 + U) + levy * y1);
        }
        if (h.couple) {
          cur += y2 - oldTax(y2, fy); abi += y2 + U - newTax(y2 + U, fy) - tau * (y2 + U) - levy * y2;
          parts.U += U; parts.tax += -(newTax(y2 + U, fy) - oldTax(y2, fy)); parts.rise += -(tau * (y2 + U) + levy * y2);
        }
        if (fam) { cur += ab[0] + ab[1]; abi += fam.pay; parts.child += fam.supp - (ab[0] + ab[1]); parts.prot += fam.top; }
        if (s1 && S1D !== 'p1') { var ex = s1Extras(h, fy, y1, y2, pay, kids, ab); abi += ex.credit + ex.cra; parts.credit = ex.credit; parts.cra = ex.cra; }
        return { cur: cur, abi: abi, gain: abi - cur, parts: parts, pay: pay };
      });
    }
    function housingEffects(h, st, gain) {
      var rate = 0, rent = 0;
      if (h.housing === 'mortgage' && h.mortgage > 0) rate = -(annuity(h.mortgage, MORT_RATE + st.bp / 1e4, MORT_TERM) - annuity(h.mortgage, MORT_RATE, MORT_TERM)) * VAR_SHARE;
      if (h.housing === 'rent') rent = -P.rentPass * Math.max(0, gain);
      return { rate: rate, rent: rent };
    }

    return {
      P: P, F2: F2, F3: F3, F4: F4, taperOver: CSO, rep: rep, OPT: OPT, DURABLE: DURABLE, NOWT: NOWT, claimShare: claimShare, pitxFund: pitxFund, YEARS: YEARS, RF: RF, FUND_R: FUND_R, CSR: CSR, REG1: REG1, sqCost: sqCost, macroTerms: macroTerms, repayLoan: REPAY_LOAN, gdp: gdp, impl: impl, ubiRate: ubiRate, floorPa: floorPa, F_of: F_of, wIdx: wIdx,
      nolossGainMin: nolossGainMin, designC: designC, sim: sim, chooseS: chooseS, feasible: feasible, firstLevy: firstLevy, ndebt: ndebt,
      perpetuity: perpetuity, ctxFrom: ctxFrom, runPathE: runPathE, solvePathE: solvePathE, solveTausAgg: solveTausAgg, fiscalPathC: fiscalPathC,
      budgetRows: budgetRows, etiRev: etiRev, etiNeed: etiNeed, peakLevy: peakLevy, peakRate: peakRate, ppRev: ppRev, levyJoint: levyJoint,
      distSummary: distSummary, distUnits: distUnits, poverty: poverty, impulseBp: impulseBp, household: household, housingEffects: housingEffects,
      population: population, stackParts: stackParts, youthTrigger: youthTrigger, dispParams: function () { return DP; }, invNet: invNet, ucbBase: ucbBase,
      ndBasePct: function (fy) { return ND_BASE_PCT[fy]; }, withReg: withReg
    };

    function youthTrigger(ep) {
      for (var q = 1; q <= 40; q++) {
        if (1.5 * 100 * ep * Math.min(1, q / 16) >= 3.0) {
          var met = q + 7, year = 2032 + Math.floor((met - 1) / 4), qn = (met - 1) % 4;
          return { q: met, label: ['Jul–Sep', 'Oct–Dec', 'Jan–Mar', 'Apr–Jun'][qn] + ' ' + (year + (qn >= 2 ? 1 : 0)), start: 2032 + Math.floor((met - 1) / 4) + 1 };
        }
      }
      return null;
    }
  }

  // ---- the central path: the fund, the dividend and the durable account at the chosen share s ----
  var RULE = {}, RULE_KEYS = [];
  var NOT_IN_RULE = ['share', 'pathway', 'funding', 'stageBasis', 'bpPerPct', 'rentPass'];
  function ruleShare(M) {            // the share the rule would choose at these settings, cached on the levers that move it
    var k = JSON.stringify([M.F2, M.F3, M.F4].concat(Object.keys(M.P).filter(function (x) { return NOT_IN_RULE.indexOf(x) < 0; }).map(function (x) { return M.P[x]; })));
    if (!(k in RULE)) { RULE[k] = M.chooseS(); RULE_KEYS.push(k); if (RULE_KEYS.length > 40) delete RULE[RULE_KEYS.shift()]; }
    return RULE[k];
  }
  function centralPath(M) {
    var s = M.P.share, base = M.sim(s), ctx = M.ctxFrom(base, s);
    var rows = base.map(function (x, j) { return { fy: x.fy, key: 'a', stage: 1, U: j === 0 ? ctx.U1 : x.D, F: x.row.F, net: x.net, impl: x.impl, stack: x.stack, reg: M.REG1 }; });
    return { s: s, base: base, ctx: ctx, rows: rows, U1: ctx.U1, Uraw: ctx.Uraw };
  }
  var fyY = function (fy) { return +fy.slice(0, 4); };

  // ---- validation against levers.json "validation" and the Part F figures (the footer check) ----
  function validate(DATA, done) {
    var M = createModel(DATA, {}), out = [], E = DATA.partf4, O = E.opts;
    var add = function (l, g, w, tol) { out.push({ label: l, got: g, want: w, ok: Math.abs(g - w) <= tol + 1e-9 }); };
    var sum = function (o, k) { return o.reduce(function (a, x) { return a + x[k]; }, 0); };
    var cp = done && done.cp ? done.cp : centralPath(M), b = cp.base, last = b[b.length - 1];
    ['2029-30', '2032-33', '2037-38', '2045-46'].forEach(function (fy) { add('(i) Dividend per adult, ' + fy + ' (A$)', b[M.YEARS.indexOf(fy)].D, E.upath[fy], 0); });
    add('(i) Stage 1 in full: first dividend in 2028-29 dollars (A$)', cp.ctx.U1, E.U1, 0);
    add('(i) Permanent AI Dividend Fund, 2045-46 (A$bn)', last.F, E.fund46, 0.1);
    add('Stage 1 net cost, 2028-29, cash (A$bn)', b[0].net + b[0].impl, E.net2829, 0.1);
    add('Child payment income effect, 2028-29 (A$bn)', b[0].inc, E.l1_2829.inc, 0.01);
    add('Students and Parenting Payment caseload, 2028-29 (A$bn)', b[0].caseOther, E.l1_2829.case, 0.01);
    add('Income-fall review, 2028-29 (A$bn)', b[0].review, E.review['2028-29'], 0.01);
    add('Eligible adults paid, 2029-30 (%)', 100 * M.claimShare('2029-30'), 100 * E.delivery[0].claim, 0.05);
    add('(i) First year of the levy', fyY(M.firstLevy(b) || '0'), fyY(E.levy1), 0);
    add('(i) Levies to 2045-46 (A$bn)', sum(b, 'lt'), E.levy_sum, 0.1);
    add('(i) Levy in 2045-46 (% of market income)', 100 * last.rate, 100 * E.levy46_rate, 0.005);
    add('(i) Never-cut guarantee lapses (year)', fyY((b.filter(function (x) { return x.lapseFy; })[0] || {}).lapseFy || '0'), fyY(E.lapse_fy), 0);
    add('(i) Never-cut top-ups levied before the lapse (A$bn)', sum(b, 'dshort'), E.top46, 0.05);
    var perp = M.perpetuity(b, cp.s, M.RF, M.P.payout, 80);
    add('(i) Fund exhausted after 2045-46 (year)', fyY((perp.filter(function (x) { return x.F <= 1e-9; })[0] || {}).fy || '0'), fyY(E.exhaust), 0);
    add('(i) Levied for the line after 2045-46, to 2085-86 (A$bn)', sum(perp.filter(function (x) { return x.y <= 2085; }), 'dshort'), E.post_levy85, 0.5);
    add('(i) Net financial worth vs baseline, 2045-46 (A$bn)', M.ndebt(last).nfw, E.nfw46, 0.1);
    add('(i) Net debt vs baseline, 2045-46 (A$bn)', M.ndebt(last).nd, E.nd46, 0.1);
    add('(i) Cash balance counting all fund earnings, 2045-46 (A$bn)', last.ucb + last.earn, E.ucb_alt['2045-46'][1], 0.1);
    var rs = done && done.rule ? done.rule : ruleShare(M);
    add('No share of the excess profits tax meets the rule, so 0% (1 = yes)', rs.none && rs.leg === 0 ? 1 : 0, E.s === 0 ? 1 : 0, 0);
    // the Table 6.1 path: earliest dates, no displacement, at the costing tables' rises (Table F4-5's B16 rule, as partF_r8.py at round 13)
    var rows61 = M.runPathE(2032, 2037, cp.ctx, E.tau_61, false);
    ['2028-29', '2032-33', '2037-38', '2045-46'].forEach(function (fy) { var r = rows61[M.YEARS.indexOf(fy)]; add('Table 6.1 path net cost incl. review, ' + fy + ' (A$bn)', r.net + r.impl, E.table61[fy], 0.1); });
    var head = done && done.head ? done.head : createModel(DATA, {}, { scn: TRIG_MIN, early: true }).solvePathE(2032, 2037, cp.ctx);
    add('Stage 2 rise if triggered, headline (points)', 100 * head.tau.c, 100 * E.tau_min.c, 0.1); add('Stage 3 rise if triggered, headline (points)', 100 * head.tau.d, 100 * E.tau_min.d, 0.1);
    var Ms = createModel(DATA, { dispEp: 0.08 }), ls = Ms.sim(cp.s), Rg = E.ranges.severe, ry = Ms.repayLoan;
    add('Severe displacement: loan from the fund, peak (A$bn)', ls[ls.length - 1].loanPeak, Rg.loan_peak[2], 0.1);
    add('Severe displacement: largest levy before repayment (%)', 100 * Math.max.apply(null, ls.filter(function (x) { return fyY(x.fy) < ry; }).map(function (x) { return x.rate; })), Rg.pre[2], 0.005);
    add('Severe displacement: fund 2045-46, loan rule (A$bn)', ls[ls.length - 1].F, Rg.fund[2], 0.1);
    add('Severe displacement: status-quo cost, 2035-36 (A$bn)', Ms.sqCost('2035-36'), Rg.sq[2], 0.1);
    var pv = M.poverty(cp.U1);
    add('Household poverty, Stage 1, relative line (%)', pv.rel[0], E.hh.rel, 0.05); add('Household poverty, Stage 1, anchored line (%)', pv.anch[0], E.hh.anch, 0.05);
    add('Child poverty, Stage 1, relative line (%)', pv.child[0], E.hh.u15, 0.05);
    ['iv', 'v', 'none'].forEach(function (k) {
      var Mk = createModel(DATA, { part2: k }), bk = centralPath(Mk).base, w = O[k], lk = bk[bk.length - 1];
      add('(' + k + ') Levies to 2045-46 (A$bn)', sum(bk, 'lt'), w.levy46, 0.1);
      add('(' + k + ') First levy (year)', fyY(Mk.firstLevy(bk) || '0'), fyY(w.first || '0'), 0);
      add('(' + k + ') Dividend per adult, 2045-46 (A$)', lk.D, w.D['2045-46'], 0);
      if (k === 'v') { add('(v) Fund, 2045-46 (A$bn)', lk.F, w.F46, 0.1); add('(v) First dividend (year)', fyY((bk.filter(function (x) { return x.D > 0; })[0] || {}).fy || '0'), fyY(E.first_v), 0); }
      if (k === 'none') add('(none) Balance kept by the durable account, peak (A$bn)', Math.max.apply(null, bk.map(function (x) { return x.A; })), w.bal_max, 0.1);
      add('(' + k + ') Household poverty, Stage 1, relative line (%)', Mk.poverty(centralPath(Mk).U1).rel[0], w.hh.rel, 0.05);
    });
    // [F4-106] Part 1 alone under stress: the high case (fuel and minerals revenue growing with GDP) and the taxes at 80% of their costings
    [['gdp', { fuelGrowth: 'gdp' }, /^High case/], ['80%', { stackYield: 0.8 }, /80% of the costings/]].forEach(function (c) {
      var w = E.stress.filter(function (x) { return c[2].test(x.case); })[0], Mk = createModel(DATA, Object.assign({ part2: 'none' }, c[1])), bk = Mk.sim(0);
      add('Part 1 alone, ' + (c[0] === 'gdp' ? 'fuel and minerals growing with GDP' : 'taxes at 80% of their costings') + ': levies to 2045-46 (A$bn)', sum(bk, 'lt'), w.levies, 0.1);
      add('Part 1 alone, same: first levy (year)', fyY(Mk.firstLevy(bk) || '0'), fyY(w.first), 0);
    });
    // [F4-115] Part 1 alone in the two displacement scenarios (GDP held): kept surpluses first, then the levy, if no vote is held
    [['moderate', 0.03], ['severe', 0.08]].forEach(function (c) {
      var w = E.p1disp[c[0]].var.paper, Mk = createModel(DATA, { part2: 'none', dispEp: c[1] }), bk = Mk.sim(0), nm = 'Part 1 alone, ' + c[0] + ' displacement';
      add(nm + ': levy 2045-46 (% of market income)', 100 * bk[bk.length - 1].rate, w.rate46, 0.005);
      add(nm + ': levies to 2045-46 (A$bn)', sum(bk, 'lt'), w.total, 0.1);
      add(nm + ': first levy (year)', fyY(Mk.firstLevy(bk) || '0'), fyY(w.first), 0);
      add(nm + ': kept surpluses drawn (A$bn)', sum(bk, 'kdraw'), w.drawn, 0.1);
    });
    return out;
  }

  // ---- assemble everything the page shows (in a worker; returns plain data) ----
  var CACHE = { key: null };
  function compute(DATA, params, person, opts) {
    opts = opts || {};
    var key = JSON.stringify([params, opts.model || null]);         // opts.model: createModel options (the reproduction checks' earlier parts)
    if (CACHE.key !== key) CACHE = { key: key, dist: {} };
    if (!CACHE.out) CACHE.out = assemble(DATA, params, CACHE, opts.model || {});
    var out = Object.assign({}, CACHE.out), C = CACHE;
    var dy = opts.decileYear && C.M.YEARS.indexOf(opts.decileYear) >= 0 ? opts.decileYear : '2028-29';
    out.dist = distFor(C, C.sel, dy);
    if (person) out.personal = personal(C.M, out.stages, person);
    if (opts.validate) out.validation = validate(DATA, isDefault(params) && !opts.model ? { cp: C.cp, head: C.headSolve, rule: C.rule } : null);
    return out;
  }
  function isDefault(p) { return Object.keys(DEFAULTS).every(function (k) { return p[k] === DEFAULTS[k]; }); }
  function distFor(C, path, fy) {
    var k = path.id + '|' + fy; if (C.dist[k]) return C.dist[k];
    var i = C.M.YEARS.indexOf(fy), r = path.rows[i], f = path.br[i];
    var row = { fy: fy, U: r.U, F: r.F, tau: r.stage > 1 ? (f.rate || 0) : 0, levyRate: f.levy || 0, reg: r.reg, pause: 0 };
    return (C.dist[k] = C.M.distSummary(row));
  }
  function assemble(DATA, params, C, mo) {
    var mx = function (o) { return Object.assign({}, mo, o || {}); };
    var M = createModel(DATA, params, mx()), P = M.P, cp = centralPath(M), ctx = cp.ctx, U1 = ctx.U1;
    C.M = M; C.cp = cp; C.rule = ruleShare(M);
    var dfl = function (fy) { return Math.pow(1 + P.cpi, fyY(fy) - 2026); };
    // the fund and the dividend under the three returns, at the chosen share and payout
    var byR = {};
    ['low', 'central', 'high'].forEach(function (k) {
      var o = k === P.fundReturn ? cp.base : M.sim(P.share, { r: M.FUND_R[k] });
      byR[k] = { rate: M.FUND_R[k], F: o.map(function (x) { return x.F; }), F26: o.map(function (x) { return x.F / dfl(x.fy); }), D: o.map(function (x) { return x.D; }) };
    });
    var perp = M.perpetuity(cp.base, P.share, M.RF, P.payout, 80), p85 = perp.filter(function (x) { return x.fy === '2085-86'; })[0];
    // the Stage 2 and 3 paths take the dividend path with no displacement (as partF_r8.py); under the loan rule a trigger-timed
    // Stage 2 also repays the fund's loan
    var ctxP = ctx;
    if (P.dispEp > 0) { var M0 = createModel(DATA, Object.assign({}, params, { dispEp: 0 }), mx()), b0 = M0.sim(P.share); ctxP = M0.ctxFrom(b0, P.share); }
    // Stages 2 and 3 'if triggered' (path B): costed on the smallest shock that meets the need test, or on none
    var userDisp = P.dispEp > 0, Mb = (!userDisp && P.stageBasis === 'min') ? createModel(DATA, params, mx({ scn: TRIG_MIN, early: true })) : M;
    var head = Mb.solvePathE(2032, 2037, ctxP); C.headSolve = (Mb !== M && isDefault(params)) ? head : null;
    var tauB = head.tau || { a: 0, c: NaN, d: NaN };
    function mkPath(id, Mx, rows, tau, extra, isSim) {
      return Object.assign({ id: id, M: Mx, rows: rows, tau: tau, br: Mx.budgetRows(rows, tau, cp.base, ctxP, P.funding, isSim) }, extra || {});
    }
    var central = mkPath('s1', M, cp.rows, { a: 0 }, {}, true);
    var pathB = head.tau ? mkPath('s23', Mb, head.rows, head.tau, { short: head.short }) : null;
    var sel = central, trig = null;
    if (P.pathway === 's23' && pathB) sel = pathB;
    else if (P.pathway === 's2') { var s2 = Mb.solvePathE(2032, null, ctxP); if (s2.tau) sel = mkPath('s2', Mb, s2.rows, s2.tau, { short: s2.short }); }
    var ttLoan = null;
    if (P.dispEp > 0) {
      trig = M.youthTrigger(M.dispParams().ep);
      if (trig) {
        var extra = {}; cp.base.forEach(function (x) { if (fyY(x.fy) >= trig.start) extra[x.fy] = x.lInt + x.lPrin; });
        ttLoan = M.solvePathE(trig.start, null, Object.assign({}, ctxP, { extra: extra }));
        if (P.pathway === 'trigger' && ttLoan.tau) sel = mkPath('trigger', M, ttLoan.rows, ttLoan.tau, { short: ttLoan.short });
      }
    }
    C.sel = sel;
    var b = cp.base, last = b[b.length - 1], fl = M.firstLevy(b), flr = fl ? b[M.YEARS.indexOf(fl)] : null;
    var o = { P: P, U1: U1, Uraw: ctx.Uraw, firstPay: ctx.firstPay, share: P.share, rule: C.rule, fundRate: M.RF, fundRates: M.FUND_R, trigger: trig, pathwayShown: sel.id };
    o.upath = b.map(function (x) { return x.D; }); o.cp0 = { stack: b[0].stack, stack46: last.stack }; o.upath26 = b.map(function (x) { return x.D / dfl(x.fy); });
    o.fundByReturn = byR;
    o.perp = { F26_2045: last.F / dfl(last.fy), F26_2085: p85 ? p85.F26 : null, D26_2085: p85 ? p85.D26 : null, D26_2045: last.D / dfl(last.fy),
      realReturn: M.RF - P.cpi, F26_min: Math.min.apply(null, perp.map(function (x) { return x.F26; })) };
    o.s1 = { levy1: fl, levy1Rate: flr ? flr.rate : 0, levy1Bn: flr ? flr.lt : 0, levy46Rate: last.lt > 1e-6 ? last.rate : 0, levy46Bn: last.lt,
      levySum: b.reduce(function (a, x) { return a + x.lt; }, 0), levyCapped: b.some(function (x) { return x.capped; }),
      advance: -b[0].A, repaid: (b.filter(function (x) { return !x.startup; })[0] || {}).fy || null,
      draws: b.reduce(function (a, x) { return a + x.draw; }, 0), borrow: b.reduce(function (a, x) { return a + x.borrow; }, 0),
      surplusTo: b.filter(function (x) { return x.S < 0; }).map(function (x) { return x.fy; })[0] || null,
      topups: b.reduce(function (a, x) { return a + x.dshort; }, 0), topups66: perp.slice(0, 20).reduce(function (a, x) { return a + x.dshort; }, 0),
      lapse: (b.filter(function (x) { return x.lapseFy; })[0] || {}).lapseFy || null, capital46: b.reduce(function (a, x) { return a + x.cdraw; }, 0),
      exhaust: (perp.filter(function (x) { return x.F <= 1e-9; })[0] || {}).fy || null,
      postLevy: perp.slice(0, 40).reduce(function (a, x) { return a + x.dshort; }, 0) };
    // [F3 T1] the wealth tax over its life: the gross tax, the interaction line, the net to the fund, what the dividend account meets
    // and the never-cut top-ups levied, 2028-29 to 2065-66 (the projection after 2045-46 is the perpetuity's), and its present value
    var gL = perp.length > 1 && perp[0].line ? perp[1].line / perp[0].line - 1 : 0, life = [], pv = 0, dfr = function (y) { return Math.pow(1 + M.RF, y - 2028); };
    // [F4] to 2085-86: after the guarantee lapses the line is charged to the fund's capital, and levied once the fund is exhausted
    b.forEach(function (x) { life.push({ fy: x.fy, wt: x.wt, line: x.pxf, net: x.wtIn, wdef: x.lapsed ? 0 : x.wdef, capital: x.cdraw || 0, topup: x.dshort }); });
    perp.slice(0, M.F4 ? 40 : 20).forEach(function (x) { life.push({ fy: x.fy, wt: 0, line: x.line, net: x.line, wdef: x.lapsed ? 0 : -x.line, capital: x.cdraw || 0, topup: x.dshort }); });
    life.slice(0, 38).forEach(function (x) { pv += (x.wt + x.line) / dfr(fyY(x.fy)); });
    var lastL = life[Math.min(37, life.length - 1)], tail = M.RF > gL && M.F3 && life.length >= 38 ? lastL.line * (1 + gL) / (M.RF - gL) / dfr(2066) : null;
    o.wtLife = { rows: life, gross: b.reduce(function (a, x) { return a + x.wt; }, 0), pv: pv, tail: tail, pvAll: tail === null ? null : pv + tail,
      firstNeg: (b.filter(function (x) { return x.wt + x.pxf < 0; })[0] || {}).fy || null, growth: gL };
    // [F3 L1, S1] the round-9 responses and delivery in 2028-29 and 2029-30
    o.behav = { inc: b[0].inc, caseOther: b[0].caseOther, nCaseOther: b[0].row.n_case_other || 0, net: b[0].net + b[0].impl,
      claim: M.claimShare('2029-30'), unc: b[1].unc, nlTakeup: P.nlTakeup };
    function rowsOut(path) {
      return path.rows.map(function (r, i) {
        var f = path.br[i];
        return { fy: r.fy, key: r.key, stage: r.stage, U: r.U, F: r.F, net: r.net + r.impl, impl: r.impl, dur: f.dur, div: f.div, adv: f.adv, draw: f.draw,
          rise: f.rise, rate: f.rate, levy: f.levy, levyRev: f.levyRev, topup: f.topup, capped: f.capped, borrow: f.borrow, fund: f.F, fund26: f.fund26, D: f.D,
          gdp: f.gdp, ucbBn: f.ucbBn, ucb_base: f.ucb_base, ucb: f.ucb, ucbEarn: f.ucbEarn, ucbDraw: f.ucbDraw, earn: f.earn, pomv: f.pomv,
          nd_base: f.nd_base, nd: f.nd, ndBn: f.ndBn, nfwBn: f.nfwBn };
      });
    }
    o.path = { id: sel.id, rows: rowsOut(sel), short: sel.short || null, tau: sel.tau };
    o.pathB = pathB && sel !== pathB ? { id: pathB.id, rows: rowsOut(pathB), short: pathB.short || null, tau: pathB.tau } : null;
    o.pre = ['2026-27', '2027-28'].map(function (fy) { return { fy: fy, impl: M.impl(fy, U1), gdp: M.gdp(fy) }; });
    // Stages 2 and 3 if triggered: rises (headline basis), the findings and Stage 3's stress-tested certificate
    o.ifTriggered = { basis: (userDisp ? 'user' : P.stageBasis), tau: head.tau, tau_agg: head.tau_agg, tau_pp: head.tau_pp, short: head.short, feasible: !!head.tau };
    if (pathB) {
      var r3 = pathB.rows.filter(function (x) { return x.fy === '2037-38'; })[0], pkl = Mb.peakLevy(r3);
      o.ifTriggered.levy = { gap: r3.gap0, peakRev: pkl.rev, peakT: pkl.t };
      // a doubled taxpayer response, and the combined downside (measures at 70%, labour response 0.29, elasticity 0.3) [F36]
      var m4 = null, n4 = { c: 0, d: 0 }, e4 = 2 * P.eti, ed = P.eti + 0.1;
      pathB.rows.forEach(function (r) {
        if (r.stage < 2) return; var t = tauB[r.key] || 0, mg = r.stack + Mb.etiRev(t, r.B, r.M, r.m, e4) - r.net - r.impl;
        if (r.key === 'd' && (!m4 || mg < m4[0])) m4 = [mg, r.fy];
        if (r.gap0 > 0) n4[r.key] = nmax(n4[r.key], Mb.etiNeed(r.gap0, r.B, r.M, r.m, e4));
      });
      o.ifTriggered.eti04 = { minMargin: m4, need: n4, eps: e4 };
      var Md = createModel(DATA, Object.assign({}, params, { mpe: P.mpe + 0.13 }), mx(Mb === M ? { stackMult: 0.7 } : { scn: TRIG_MIN, early: true, stackMult: 0.7 }));
      var rd = Md.runPathE(2032, 2037, ctx, tauB, false), md = null, s1d = null, nd = { c: 0, d: 0 };
      rd.forEach(function (r) {
        var t = tauB[r.key] || 0, mg = r.stack + (r.stage > 1 ? Md.etiRev(t, r.B, r.M, r.m, ed) : 0) - r.net - r.impl;
        if (r.key === 'd' && (!md || mg < md[0])) md = [mg, r.fy];
        if (r.stage === 1 && (!s1d || mg < s1d[0])) s1d = [mg, r.fy];
        if (r.stage > 1 && r.gap0 > 0) nd[r.key] = nmax(nd[r.key], Md.etiNeed(r.gap0, r.B, r.M, r.m, ed));
      });
      o.ifTriggered.down = { minMargin: md, s1: s1d, need: nd };
      o.ifTriggered.cert = isNum(n4.d) && isNum(nd.d);     // [S3] a Stage 3 rate must hold under both stresses
    } else o.ifTriggered.cert = false;
    o.ifTriggered.worseAfter = DATA.lifetime.worse_after;
    // a declared displacement: the loan rule, the macro variant and the status-quo cost [F62 to F65]
    if (P.dispEp > 0) {
      var cur = M.sim(P.share, { loan: false }), lb = cp.base, ry = M.repayLoan, preV = function (o) { return Math.max.apply(null, [0].concat(o.filter(function (x) { return ry === null || fyY(x.fy) < ry; }).map(function (x) { return x.rate; }))); };
      var mt = M.stackParts('2035-36').mt;
      // [F4-115] options with no fund: kept surpluses, then the levy; the largest levy before the first year Stage 2 could start
      var preSt = function (o) { return Math.max.apply(null, [0].concat(o.filter(function (x) { return !trig || fyY(x.fy) < trig.start; }).map(function (x) { return x.rate; }))); };
      if (M.DURABLE) preV = preSt;
      o.disp = { durable: M.DURABLE, drawn: lb.reduce(function (a, x) { return a + (x.kdraw || 0); }, 0), levySum: lb.reduce(function (a, x) { return a + x.lt; }, 0), levy1: M.firstLevy(lb),
        decl: M.DURABLE ? null : (lb.filter(function (x) { return x.declared; })[0] || {}).fy || null, macro: P.macro, start: trig ? trig.start : null, trigLabel: trig ? trig.label : null, preLoan: preV(lb), preCur: preV(cur), loanPeak: lb[lb.length - 1].loanPeak,
        loanBy: (lb.filter(function (x) { return x.loanBy; })[0] || {}).loanBy || null, levy46: lb[lb.length - 1].rate, levy46Cur: cur[cur.length - 1].rate,
        rise: ttLoan && ttLoan.tau ? ttLoan.tau.c : null, div46: lb[lb.length - 1].D, fund46: lb[lb.length - 1].F, sq3536: M.sqCost('2035-36'),
        gdpLost: mt ? 100 * mt.dY / M.gdp('2035-36') : 0 };
    } else o.disp = null;
    var X4 = DATA.partf4, XP = M.F4 ? X4 : DATA.partf3;
    o.f2 = { ranges: XP.ranges, price28: XP.price28, pricePV: XP.price_pv, pens: XP.pens, delivery: XP.delivery, options: XP.options, f67: XP.f67 };
    // [F4] the Part 2 option shown, with the paper's figures for it (Tables F4-98 to F4-101, at the paper's settings)
    o.opt = { key: M.OPT, label: X4.labels[M.OPT], durable: M.DURABLE, nowt: M.NOWT, paper: X4.opts[M.OPT], keys: ['i', 'iv', 'v', 'none'], labels: X4.labels,
      t98: X4.t98, t100: X4.t100, t101: X4.t101, firstV: X4.first_v,
      balMax: M.DURABLE ? Math.max.apply(null, b.map(function (x) { return x.A; })) : null, G46: last.G };
    // first year of each stage: on this path if it has the stage, otherwise from path B
    o.stages = {};
    [['a', 1], ['c', 2], ['d', 3]].forEach(function (s) {
      var path = sel, i = path.rows.findIndex(function (x) { return x.stage === s[1]; }), ifT = false;
      if (i < 0 && pathB) { path = pathB; ifT = true; i = path.rows.findIndex(function (x) { return x.stage === s[1]; }); }
      if (i < 0) return;
      var r = path.rows[i], f = path.br[i], ds = distFor(C, path, r.fy), imp = path.M.impulseBp(r, ds.gains, (f.rate || 0) > 0 || (f.levy || 0) > 0);
      o.stages[s[0]] = { stage: s[1], fy: r.fy, U: r.U, F: r.F, tau: r.stage > 1 ? f.rate : 0, levy: f.levy || 0, reg: r.reg, ifTriggered: ifT,
        bp: imp.bp, better: ds.better, worse: ds.worse, net: r.net + r.impl };
    });
    o.dist2829 = distFor(C, central, '2028-29');
    o.poverty = M.poverty(U1);
    o.taper = { t: '0.18', over50: M.taperOver[0], over60: M.taperOver[1], today: DATA.emtr_today.over50 };
    o.lifetime = DATA.lifetime;
    return o;
  }
  function isNum(x) { return typeof x === 'number' && x === x; }
  function personal(M, stages, h) {
    var o = {};
    ['a', 'c', 'd'].forEach(function (k) {
      var s = stages[k]; if (!s) return;
      var st = { fy: s.fy, U: s.U, F: s.F, tau: s.tau, levy: s.levy, bp: s.bp, reg: s.reg };
      var r = M.household(h, st), he = M.housingEffects(h, st, r.gain), r1 = M.household(h, st, h.y1 + 1000), curve = [];
      for (var y = 0; y <= 250000; y += 2500) curve.push([y, M.household(h, st, y).gain]);
      o[k] = { fy: s.fy, ifTriggered: s.ifTriggered, cur: r.cur, abi: r.abi, gain: r.gain, parts: r.parts, rate: he.rate, rent: he.rent,
        total: r.gain + he.rate + he.rent, emtrCur: 1 - (r1.cur - r.cur) / 1000, emtrAbi: 1 - (r1.abi - r.abi) / 1000, curve: curve,
        pay: r.pay ? { Psq: r.pay.Psq, Pn: r.pay.Pn, mx: r.pay.mx } : null, tau: s.tau, levy: s.levy, bp: s.bp, U: s.U, T: s.reg.T };
    });
    return o;
  }

  return { createModel: createModel, centralPath: centralPath, ruleShare: ruleShare, validate: validate, compute: compute, DEFAULTS: DEFAULTS, DISP: DISP, TRIG_MIN: TRIG_MIN };
})();
if (typeof module !== 'undefined') module.exports = BW;
