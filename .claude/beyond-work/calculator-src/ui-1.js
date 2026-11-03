(function () {
  'use strict';
  document.documentElement.className = 'js';
  var DATA = JSON.parse(document.getElementById('bw-data').textContent);
  var INITIAL = JSON.parse(document.getElementById('bw-initial').textContent);
  // the recommended settings: the model's defaults with no dividend (option B: no dividend is recommended now)
  var D = Object.assign({}, BW.DEFAULTS, { part2: 'none', design: 'pstar', phased: false });
  var OB = INITIAL.ob;
  var PAPER = INITIAL.main, PAPER2 = INITIAL.stage, MOVES = INITIAL.moves || null, RANGES0 = INITIAL.ranges || null;
  var LEVY1_REC = PAPER.s1.levy1 || 'no year to 2045-46';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var MINUS = '−';

  // ---------- formatting ----------
  var nf0 = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function aud(v, signed) { var s = 'A$' + nf0.format(Math.abs(Math.round(v))); if (Math.round(v) < 0) return MINUS + s; return (signed && Math.round(v) > 0 ? '+' : '') + s; }
  function bn(v, signed) { var s = 'A$' + nf1.format(Math.abs(v)) + 'bn'; if (v < -0.049) return MINUS + s; return (signed && v > 0.049 ? '+' : '') + s; }
  function bnWord(v) { return 'A$' + nf1.format(Math.abs(v)) + ' billion'; }
  function bn0(v, signed) { var s = 'A$' + nf0.format(Math.abs(v)) + 'bn'; if (v <= -0.5) return MINUS + s; return (signed && v >= 0.5 ? '+' : '') + s; }
  function pct(v, d, signed) { d = d === undefined ? 1 : d; var x = v.toFixed(d); if (+x === 0) x = (0).toFixed(d); var neg = +x < 0; return (neg ? MINUS : (signed && +x > 0 ? '+' : '')) + Math.abs(+x).toFixed(d) + '%'; }
  function pts(v) { return nf1.format(v) + (Math.abs(v - 1) < 1e-9 ? ' point' : ' points'); }
  function round100(v) { return Math.round(v / 100) * 100; }
  function nearlyEq(a, b) { return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function setVal(e, v) { e.value = v; e.setAttribute('value', v); }
  function setChecked(e, c) { e.checked = !!c; if (c) e.setAttribute('checked', ''); else e.removeAttribute('checked'); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function ccls(color) { return color ? 'c-' + String(color).replace(/var\(--|\)/g, '').replace('-', '') : 'c-none'; }

  // ---------- levers, grouped by the paper's sections ----------
  var OPT_LAB = [['none', 'No dividend (the default)'], ['i', '(i) A wealth-tax fund pays it'], ['iv', '(iv) The Budget pays it'], ['v', '(v) A fund built from surpluses pays it']];
  var OPT_NAME = { i: 'a dividend paid by a wealth-tax fund, option (i)', iv: 'a dividend paid from the Budget, option (iv)', v: 'a dividend paid by a fund built from surpluses, option (v)', none: 'no dividend' };
  var X4 = DATA.partf4, T4 = function (k) { return (100 * X4.tau_min[k]).toFixed(1); }, R4 = function (k) { return (100 * X4.tau_ref[k]).toFixed(1); };
  var CH5 = { href: '/UBI/paper/5-the-proposal/', text: 'chapter 5, The proposal' }, CH6 = { href: '/UBI/paper/6-making-the-dollars-work/', text: 'chapter 6, Making the dollars work' };
  var DESIGN_NAME = { pstar: 'P*, the recommended design', pkg: 'the targeted package, Parliament’s alternative', p1: 'Part 1 as printed on 22 October, the earlier design' };
  var DESIGN_SHORT = { pstar: 'P*', pkg: 'the targeted package', p1: 'Part 1' };
  var LEVERS = [
    { group: 'Stage 1, a targeted floor: the design', chapter: CH5, section: 'The proposal; Options compared', items: [
      { id: 'design', type: 'seg', label: 'Stage 1 design', options: [['pstar', 'P*: the recommended design'], ['pkg', 'Targeted package: Parliament’s alternative'], ['p1', 'Part 1 as printed on 22 October: the earlier design, not recommended']],
        hint: 'Which targeted floor to model. All three cost about the same in 2028-29.',
        help: 'P* keeps Part 1’s floor and child payment but pays A$' + nf0.format(Math.round(OB.pstarD)) + ' a child in 2028-29. It drops the schedule that pays the supplement to middle-income families and raises Rent Assistance by 75%. The targeted package keeps Family Tax Benefit and adds A$' + nf0.format(Math.round(OB.pkgD)) + ' a child to its Part A. It adds an earned-income credit of up to A$5,000 and Rent Assistance 75% higher. It cuts poverty most and leaves fewer second and higher earners on high effective tax rates, though more at 60% or more. Its second earners’ mean participation tax rate is 28.9%, against P*’s 33.0%. It needs far more levies: A$108.1 billion against A$36.5 billion to 2045-46. Part 1, as printed on 22 October, leaves about 0.2 million more people in poverty than P* at the same cost. P* is the paper’s choice among designs of equal cost, weighing poverty against work incentives and fiscal sustainability. Figures for P* and the package are provisional: they rest on a re-costing at Part 1’s budget, checked on three random seeds and three calibrations.' },
      { id: 'phased', type: 'toggle', label: 'Phased start: the child payment from 2029-30', hint: 'Starts the floor and Rent Assistance in 2028-29 and the child payment a year later, so there is no borrowing in 2028-29.',
        help: 'Families keep their current Family Tax Benefit in 2028-29 and go without the new child payment for that year. Under P* it would have paid families A$' + nf1.format(OB.phasedPrice.pstar.cash) + ' billion above the Family Tax Benefit they keep; the budget saves A$' + nf1.format(OB.phasedPrice.pstar.saving) + ' billion. For the package, the credit and the Family Tax Benefit increment start a year later. The five taxes then cover the floor in 2028-29 and the borrowing becomes a surplus.' }
    ] },
    { group: 'Part 2 (the dividend): options described, none recommended', chapter: CH5, section: 'Part 2: options for Parliament', items: [
      { id: 'part2', type: 'seg', label: 'A dividend for every adult', options: OPT_LAB,
        hint: 'Whether to add one of the four dividend designs the paper describes. It recommends none of them now.',
        help: 'Option (i): a wealth tax builds a permanent fund and the fund’s payout is the dividend. Option (iv): the same dividend paid each year by the other taxes, with no wealth tax and no fund. Option (v): a fund built only from the other taxes’ surpluses, so a smaller dividend that starts later. Each adds a payment of a few hundred dollars a year at most by 2045-46 and machinery to run it. The Stage 1 figures change with this choice; Stages 2 and 3 are costed the same way whatever you choose here.' }
    ] },
    { group: 'Stage 1, a targeted floor: rates and protections', chapter: CH5, section: 'Rates and indexation; The no-worse-off rule', items: [
      { id: 'floorPw', type: 'range', label: 'Working-age floor', min: 400, max: 750, step: 0.01, keyStep: 1, k: 1, toggle: 'floorOn', toggleLabel: 'Lift working-age payments to a floor', fmt: function (v) { return 'A$' + v.toFixed(2) + ' a week'; },
        unit: 'A$ a week, March quarter 2026, indexed to wages', ticks: [[416.85, 'JobSeeker single rate A$412 a week from 20 September 2026, A$416.85 with the Energy Supplement'], [569.81, 'poverty line A$569.81 a week, Melbourne Institute, March quarter 2026'], [600, 'ACOSS proposal A$600 a week']],
        hint: 'The rate JobSeeker, Youth Allowance, student and Parenting payments are lifted to.',
        help: 'The poverty line is the Melbourne Institute line for a single person not in the workforce. Switch the floor off to model Stage 1 without it.' },
      { id: 'caseload', type: 'seg', label: 'Caseload response to the floor', options: [[0.21, 'Job-finding only (0.21)'], [0.39, 'With re-entry (0.39)'], [0.56, 'High re-entry (0.56)']],
        hint: 'How many more people stay on, or return to, payments once the floor is lifted.',
        help: 'e61’s job-finding effect is 0.21. The other settings add 25% or 50% of the extra job separations re-entering payment, a share the paper assumes. Students and Parenting Payment recipients respond at the job-finding effect in every case.' },
      { id: 'protections', type: 'toggle', label: 'Payment protections', hint: 'Keeps current recipients’ payments from falling under today’s rules, through offsets, a 50 cent phase-out and a family top-up.',
        help: 'The Recipient Protection Offset is capped at the tax current rules levy on the payment. The offset on other income, the 50 cent phase-out and the family top-up come with it. It protects the payment, not income after rent: a household whose rent rises with its gain can still end up worse off after housing costs.' },
      { id: 'waiting', type: 'toggle', label: 'Waiting periods for new residents', hint: 'New permanent residents wait before they get the dividend and the child payment.',
        help: 'Four years for the dividend, as for JobSeeker Payment. One year for the child payment, as for Family Tax Benefit. That is about 518,000 adults and 55,500 children in 2028-29.' },
      { id: 'coverAll', type: 'seg', label: 'Coverage', options: [[false, 'Citizens and permanent residents'], [true, 'All residents']], hint: 'Who can receive the dividend.' },
      { id: 'nlTakeup', type: 'range', label: 'Adults with no tax return who enrol', min: 50, max: 100, step: 5, k: 100, fmt: function (v) { return v.toFixed(0) + '%'; },
        unit: '% of about 1.5 million eligible adults who lodge no return and get no payment', ticks: [[92, '92% reached by the first US stimulus payment in 2020']],
        hint: 'The share of adults without a tax return who sign up for the dividend.',
        help: 'Lodgers are paid once a year at assessment; the rest must enrol with Services Australia. The rate per adult is set on everyone eligible, and what goes unclaimed stays in the dividend account. No figure exists for an Australian payment that needs enrolment, so 80% is an assumption.' }
    ] },
    { group: 'The dividend and the fund', chapter: CH6, section: 'The central path with the wealth-tax fund', items: [
      { id: 'fundReturn', type: 'seg', label: 'The fund’s return', options: [['low', 'Bond rate, 4.13%'], ['central', 'CPI + 4%'], ['high', 'CPI + 5%']],
        hint: 'What the Permanent AI Dividend Fund earns each year.', help: 'CPI + 4% is the Future Fund mandate’s lower bound. At the bond rate the fund earns no risk premium, so it grows more slowly and pays less.' },
      { id: 'payout', type: 'range', label: 'Payout rate of the fund', min: 2, max: 8, step: 0.25, k: 100, fmt: function (v) { return v.toFixed(2) + '%'; },
        unit: '% of the fund’s average balance over the last three years, paid out each year',
        hint: 'The share of the fund paid out as the dividend each year.', help: 'At 4% the dividend spends the fund’s expected real return, so its real value lasts. A higher rate pays more now, and the fund’s real value falls.' },
      { id: 'share', type: 'range', label: 'Share of the excess profits tax paid out', min: 0, max: 30, step: 1, k: 100, fmt: function (v) { return v.toFixed(0) + '%'; },
        unit: '% of last year’s excess profits tax, added to the dividend',
        hint: 'Part of last year’s excess profits tax added to the dividend.',
        help: 'Applies only with a dividend fund, options (i) and (v). The paper’s rule takes the largest whole per cent the other taxes can carry. They must still pay for the floor, the child payment, the protections and the income-fall review to 2040-41. With the wealth-tax fund no share meets the rule, since a levy is needed from ' + X4.levy1 + ' even at 0%. A higher share raises the dividend and brings the levy forward.' },
      { id: 'wtLoss', type: 'seg', label: 'Wealth tax: further losses in other taxes', options: [[0, 'None'], [0.25, '25%'], [0.5, '50%'], [1, '100%']],
        hint: 'Revenue the wealth tax might cost beyond the income tax the PBO has costed.',
        help: 'The PBO warns the wealth tax could reduce other revenue, without an estimate. The fund receives the tax net of these losses too, so they shrink the dividend. The levied top-ups that keep it from being cut then grow.' }
    ] },
    { group: 'Stages 2 and 3: a conditional pathway', chapter: CH6, section: 'Triggers for Stages 2 and 3 (chapter 5); Funding if Stages 2 and 3 are triggered', items: [
      { id: 'pathway', type: 'seg', label: 'Conditional pathway', options: [['s1', 'Stage 1 continuing'], ['s2', 'Stage 2 from 2032-33'], ['s23', 'Stages 2 and 3'], ['trigger', 'Trigger-timed']],
        hint: 'Whether the year-by-year charts show Stages 2 and 3 starting. Stage 1 figures do not change with this choice.',
        help: 'Stage 1 continuing is the central path. The universal stages are a conditional pathway. Their tests are legislated (the AI need test, a randomised trial and a Parliamentary Budget Office certificate); their rates are not. Stage 2 would pay the JobSeeker rate to every adult. Stage 3, which the paper describes but does not authorise, would pay the Age Pension rate from 2037-38. Trigger-timed starts Stage 2 when youth unemployment trips the trigger. The model costs Stages 2 and 3 only with the paper’s wealth-tax fund, so the charts use it whenever this pathway includes them.' },
      { id: 'stageBasis', type: 'seg', label: 'If triggered, cost them on', options: [['min', 'Smallest shock that meets the test'], ['none', 'No displacement']],
        hint: 'The AI displacement the later stages are costed on, if they are triggered.',
        help: 'The stages start only if AI displaces work. Costed on the smallest displacement that meets the need test, they need income-tax rates ' + T4('c') + ' (up to ' + nf1.format(X4.ranges.severe.rise[2]) + ' on trigger-timed paths) and ' + T4('d') + ' points higher; with no displacement, ' + R4('c') + ' and ' + R4('d') + '. The displacement lever, if set, takes over.' },
      { id: 'funding', type: 'seg', label: 'When the taxes fall short', options: [['levy', 'Levy sized to the gap'], ['borrow', 'Borrow']],
        hint: 'What happens when the taxes do not cover the cost.',
        help: 'Levy: a levy on market income, set each year to the gap and never above it. With a dividend fund, the gap includes the top-ups that keep the dividend from being cut. At the recommended settings Stage 1 needs one from ' + LEVY1_REC + '. Borrow: the gaps add to debt instead.' }
    ] },
    { group: 'AI receipts and an AI displacement shock', chapter: CH6, section: 'AI receipts and the dividend; An AI displacement shock', items: [
      { id: 'lp', type: 'range', label: 'Labour productivity growth', min: 0.5, max: 4.0, step: 0.1, k: 100, fmt: function (v) { return v.toFixed(1) + '% a year'; }, unit: '% a year, sustained',
        ticks: [[1.2, '1.2% Budget'], [1.6, '1.6% Productivity Commission']], band: [1.5, 2.0, '1.5% to 2.0% Intergenerational Report AI upside'],
        hint: 'How fast output per hour worked grows each year.', help: 'Faster growth raises the excess profits tax in proportion, and with it the dividend and the fund (the paper’s Table F45 method).' },
      { id: 'aiInvest', type: 'range', label: 'Government AI investment', min: 0, max: 30, step: 1, k: 1, fmt: function (v) { return 'A$' + v.toFixed(0) + 'bn a year'; }, unit: 'A$bn a year from 2027-28, counted as a budget cost',
        hint: 'Public spending on AI each year.' },
      { id: 'aiUpliftPer10', type: 'range', label: 'Productivity uplift per A$10bn a year', min: 0, max: 0.2, step: 0.01, k: 100, fmt: function (v) { return v.toFixed(2) + ' points'; },
        unit: 'percentage points of growth a year', hint: 'Extra productivity growth from each A$10 billion a year of public AI investment.', help: 'Your assumption: no Australian estimate exists. The extra receipts count against the investment’s cost.' },
      { id: 'dispEp', type: 'range', label: 'AI displacement: fall in employment', min: 0, max: 10, step: 0.5, k: 100, fmt: function (v) { return v.toFixed(1) + ' points'; },
        unit: 'percentage points of adults, phased in from 2032-33 to 2035-36', ticks: [[3, '3 moderate'], [8, '8 severe']], presets: [['None', 0], ['Moderate (3 points)', 3], ['Severe (8 points)', 8]],
        hint: 'How many adults lose work to AI between 2032-33 and 2035-36.',
        help: 'The paper’s scenarios: wages, JobSeeker numbers and company profits move with employment. A displacement is declared once the need test has been met for eight quarters. The reserve, then a loan from the fund, bridge the gap until the first year Stage 2 could start. The levy then starts repaying the loan. With no fund, the surpluses the other taxes have kept meet a gap first, then the levy.', helpMore: ['The paper’s ', { href: CH6.href + '#second-round-effects-of-a-displacement-claims-debt-and-asset-prices', text: 'chapter 6' }, ' also estimates the claims surge, debt service on the floor and possible forced sales in a displacement; the calculator does not model those.'] },
      { id: 'macro', type: 'seg', label: 'Macro feedback in a displacement', options: [['paper', 'GDP held'], ['a', 'GDP falls'], ['c', 'Midpoint'], ['b', 'Wages become taxed profits']],
        hint: 'What happens to GDP and profits when wages are lost in a displacement.',
        help: 'Applies when the displacement lever is set. Whether the feedback raises or lowers the cost is not known. If GDP falls with the lost wages, the levy is higher. If the lost wages reappear as taxed company profits, it is lower.' },
      { id: 'eptYield', type: 'range', label: 'Excess profits tax: share of AI profits captured', min: 50, max: 150, step: 5, k: 100, fmt: function (v) { return v.toFixed(0) + '%'; },
        unit: '% of the PBO costing (ECR-2025-3194)', hint: 'How much of the PBO’s costing the excess profits tax raises.' }
    ] },
    { group: 'The economy and population: sensitivity assumptions', chapter: CH6, section: 'Sensitivity; Assumptions', items: [
      { id: 'nom', type: 'range', label: 'Net overseas migration', min: 100000, max: 450000, step: 5000, k: 1, fmt: function (v) { return nf0.format(v) + ' a year'; }, unit: 'people a year from 2027-28',
        ticks: [[225000, '225,000 ABS medium'], [292100, '292,100 in the year to March 2026']],
        hint: 'People added to the population each year.', help: 'Migrants have the population’s age and visa mix (the paper’s assumption). New residents serve the waiting periods first, so extra arrivals add receipts before they add cost.' },
      { id: 'wpi', type: 'range', label: 'Wage growth', min: 2, max: 5, step: 0.1, k: 100, fmt: function (v) { return v.toFixed(1) + '% a year'; }, unit: 'Wage Price Index, % a year', ticks: [[3.5, '3.5% Budget']],
        hint: 'Growth in wages each year; it also indexes the floor.' },
      { id: 'cpi', type: 'range', label: 'Consumer prices', min: 1, max: 5, step: 0.1, k: 100, fmt: function (v) { return v.toFixed(1) + '% a year'; }, unit: 'CPI, % a year; also sets the fund’s CPI-linked return', ticks: [[2.5, '2.5% Budget']],
        hint: 'Growth in consumer prices each year.' },
      { id: 'bpPerPct', type: 'range', label: 'Cash-rate response', min: 0, max: 100, step: 5, k: 1, fmt: function (v) { return v.toFixed(0) + ' basis points'; }, unit: 'basis points per 1% of GDP of extra demand',
        ticks: [[25, '25 low'], [50, '50 central'], [75, '75 high']], hint: 'How far the cash rate rises for each 1% of GDP of extra demand.', help: 'Range from the paper’s household model. Feeds the mortgage line in the household results.' },
      { id: 'unemp', type: 'range', label: 'Unemployment rate', min: 3.5, max: 8, step: 0.1, k: 1, fmt: function (v) { return v.toFixed(1) + '%'; }, unit: '% of the labour force, from 2028-29',
        ticks: [[4.5, '4.5% Budget 2026-27 forecast'], [4.6, '4.6% ABS Labour Force, August 2026']], hint: 'The share of the labour force out of work from 2028-29.', help: 'JobSeeker numbers move in proportion.' },
      { id: 'fuelGrowth', type: 'seg', label: 'Fuel and minerals revenue after the PBO window', options: [['real', 'Flat in real terms'], ['gdp', 'Grows with GDP']],
        hint: 'How two revenue measures grow after the PBO costing window ends in 2038-39.',
        help: 'The fuel-tax-credit and coal-and-minerals measures after 2038-39. The paper holds them flat in real terms, since machinery keeps its credits while light vehicles electrify; growing with GDP is its high case.' },
      { id: 'commodity', type: 'range', label: 'Commodity prices', min: 50, max: 150, step: 5, k: 100, fmt: function (v) { return v.toFixed(0); }, unit: 'index, 100 = PBO costings; scales the minerals and gas measures',
        hint: 'Scales the minerals and gas measures up or down.' },
      { id: 'eti', type: 'range', label: 'Taxpayer response', min: 0.1, max: 0.5, step: 0.01, k: 1, fmt: function (v) { return v.toFixed(2); }, unit: 'elasticity of taxable income; also used for the child-payment taper',
        ticks: [[0.2, '0.2 PBO'], [0.4, '0.4 stress test']], hint: 'How much taxable income falls when tax rates rise.' },
      { id: 'mpe', type: 'range', label: 'Labour response', min: 0.05, max: 0.35, step: 0.01, k: 1, fmt: function (v) { return v.toFixed(2); }, unit: 'cents of earnings given up per dollar of dividend; parents’ response to the child payment stays at 16 cents',
        ticks: [[0.16, '0.16 OpenResearch trial'], [0.29, '0.29 household model']], hint: 'Earnings given up for each dollar of dividend.' },
      { id: 'stackYield', type: 'range', label: 'Yield of the five taxes', min: 50, max: 130, step: 5, k: 100, fmt: function (v) { return v.toFixed(0) + '%'; }, unit: '% of the PBO costings; with the wealth-tax dividend this includes the wealth tax, the sixth tax',
        ticks: [[70, '70% downside']], hint: 'What the five taxes raise, as a share of the PBO costings.' },
      { id: 'rentPass', type: 'range', label: 'Rent pass-through', min: 0, max: 40, step: 0.5, k: 100, fmt: function (v) { return v.toFixed(1) + '%'; }, unit: '% of renters’ gains taken in higher rent',
        ticks: [[6.6, '6.6% AHURI low'], [32.4, '32.4% AHURI high']], hint: 'The share of renters’ gains that landlords take in higher rent.', help: 'The paper’s setting is the midpoint of the AHURI range. Feeds the rent line in the household results.' }
    ] }
  ];
  var LV = {}; LEVERS.forEach(function (g, gi) { g.items.forEach(function (lv, i) { lv.gi = gi; lv.idx = i; LV[lv.id] = lv; }); });
  var SIMPLE_ECO = ['design', 'phased', 'floorPw', 'stackYield', 'eti', 'lp', 'dispEp', 'pathway'];
  var PRESETS = [
    ['Recommended settings', {}],
    ['AI boom', { lp: 0.03, aiInvest: 15 }],
    ['Severe displacement', { dispEp: 0.08, pathway: 'trigger' }],
    ['Taxes raise 70% of their costings', { stackYield: 0.7 }],
    ['Combined downside', { stackYield: 0.7, mpe: 0.29 }]
  ];
  // sourced single lever moves (each a reference point the lever cites), swept to give dates and rates as ranges; the AI
  // displacement scenarios are left out, as they are shocks shown on their own rather than uncertainty in the central case
  var SWEEP = [
    ['fundReturn', 'low', 'fund return at the bond rate'], ['fundReturn', 'high', 'fund return CPI + 5%'],
    ['caseload', 0.21, 'caseload response 0.21 (e61, job-finding only)'], ['caseload', 0.56, 'caseload response 0.56 (high re-entry)'],
    ['nlTakeup', 0.92, '92% of non-lodgers enrol (US 2020)'], ['lp', 0.016, 'productivity 1.6% (Productivity Commission)'],
    ['lp', 0.015, 'productivity 1.5% (Intergenerational Report, low)'], ['lp', 0.02, 'productivity 2.0% (Intergenerational Report, high)'],
    ['nom', 292100, 'migration 292,100 (year to March 2026)'], ['unemp', 4.6, 'unemployment 4.6% (ABS, August 2026)'],
    ['fuelGrowth', 'gdp', 'fuel and minerals revenue grows with GDP'], ['eti', 0.4, 'taxpayer response 0.4 (stress test)'],
    ['mpe', 0.29, 'labour response 0.29 (household model)'], ['stackYield', 0.7, 'the five taxes at 70% of their costings'],
    ['rentPass', 0.066, 'rent pass-through 6.6% (AHURI low)'], ['rentPass', 0.324, 'rent pass-through 32.4% (AHURI high)'],
    ['bpPerPct', 25, 'cash-rate response 25 basis points'], ['bpPerPct', 75, 'cash-rate response 75 basis points'],
    ['wtLoss', 0.25, 'wealth tax loses 25% more'], ['wtLoss', 0.5, 'wealth tax loses 50% more'], ['wtLoss', 1, 'wealth tax loses 100% more']
  ];
  var SAMPLE = { age: 38, hh: 'couple', nkids: 2, kids: [6, 11, 3, 1], y1: 78000, y2: 32000, pay: 'none', housing: 'rent', rentPw: 600, mortgage: 550000 };
  var EXAMPLES = [
    { name: 'A couple renting with two children, earning A$78,000 and A$32,000', desc: 'The paper’s example household: a couple aged 38 renting in Western Sydney for A$600 a week, with two children aged 6 and 11.', me: SAMPLE },
    { name: 'A single parent renting with two children, earning A$52,000', desc: 'A sole parent aged 34 renting for A$480 a week, with children aged 4 and 9, on no payment.', me: { age: 34, hh: 'single', nkids: 2, kids: [4, 9, 3, 1], y1: 52000, y2: 0, pay: 'none', housing: 'rent', rentPw: 480, mortgage: 550000 } },
    { name: 'A couple with a mortgage, two incomes, no children', desc: 'A couple aged 45 earning A$95,000 and A$70,000, with A$620,000 owing on their home loan.', me: { age: 45, hh: 'couple', nkids: 0, kids: [6, 11, 3, 1], y1: 95000, y2: 70000, pay: 'none', housing: 'mortgage', rentPw: 600, mortgage: 620000 } },
    { name: 'A single person on JobSeeker, renting', desc: 'A single person aged 29 on JobSeeker Payment with no other income, renting for A$350 a week.', me: { age: 29, hh: 'single', nkids: 0, kids: [6, 11, 3, 1], y1: 0, y2: 0, pay: 'js', housing: 'rent', rentPw: 350, mortgage: 550000 } },
    { name: 'A retired couple on the Age Pension, owning their home', desc: 'A couple aged 72 on the Age Pension with A$5,000 a year of other income, owning their home outright.', me: { age: 72, hh: 'couple', nkids: 0, kids: [6, 11, 3, 1], y1: 5000, y2: 0, pay: 'ap', housing: 'own', rentPw: 600, mortgage: 550000 } }
  ];
  var KID_BANDS = { u5: [2, 2, 2, 2], '5to12': [8, 8, 8, 8], '13to17': [15, 15, 15, 15], mixed: [3, 8, 12, 15] };
  function kidBandOf(me) {
    var ks = me.kids.slice(0, me.nkids); if (!ks.length) return '5to12';
    if (ks.every(function (a) { return a < 5; })) return 'u5';
    if (ks.every(function (a) { return a >= 5 && a <= 12; })) return '5to12';
    if (ks.every(function (a) { return a >= 13; })) return '13to17';
    return 'mixed';
  }
  var NUM = { age: [18, 105, 'me-age', 'your age'], y1: [0, 1000000, 'me-y1', 'your income'], y2: [0, 1000000, 'me-y2', 'your partner’s income'], rentPw: [0, 5000, 'me-rent', 'rent'], mortgage: [0, 5000000, 'me-mort', 'the mortgage owing'] };

  var state = { params: Object.assign({}, D), me: clone(SAMPLE), decileYear: '2028-29', section: 'me', mode: 'simple', result: null, validation: INITIAL.main.validation || null, validationSource: 'build', dirty: { me: true, economy: true }, errors: {} };

  function toPerson(me) {
    var couple = me.hh === 'couple', kids = me.kids.slice(0, me.nkids).map(function (a) { return Math.max(0, Math.min(17, +a || 0)); });
    var kind = me.pay; if (kind === 'dsp' && me.age >= 67) kind = 'ap';
    return { couple: couple, y1: Math.max(0, +me.y1 || 0), y2: couple ? Math.max(0, +me.y2 || 0) : 0, kind: kind, kids: kids, housing: me.housing, rentPw: +me.rentPw || 0, mortgage: +me.mortgage || 0 };
  }
  function leverDisplay(lv, v) { return lv.k ? v * lv.k : v; }
  function fmtLever(lv, v) {
    if (lv.type === 'range') return lv.fmt(leverDisplay(lv, v));
    if (lv.type === 'seg') { var o = lv.options.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : String(v); }
    return v ? 'on' : 'off';
  }
