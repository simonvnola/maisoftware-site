
  // ---------- What happens to the economy ----------
  var KEYNAME = { a: 'Stage 1', c: 'Stage 2', d: 'Stage 3' };
  function firstFy(rows, key) { for (var i = 0; i < rows.length; i++) if (rows[i].key === key) return rows[i].fy; return null; }
  function isNum(x) { return typeof x === 'number' && x === x; }
  function riseStr(t) { return nf1.format(100 * t); }
  function rangeBn(t) { return t.split(' to ').map(function (x) { var v = +x.replace(MINUS, '-'); return bn0(v); }).join(' to '); }
  function finding(host, text, info) {
    var li = host.tagName === 'UL' ? mk('li') : null, d = mk('div', info ? 'bw-inset' : 'bw-warning');
    if (!info) { var m = mk('span', 'bw-warning-mark', '!', d); m.setAttribute('aria-hidden', 'true'); }
    var p = mk('p', null, null, d); if (!info) mk('strong', 'bw-visually-hidden', 'Warning', p); p.appendChild(document.createTextNode(text));
    (li || host).appendChild(d); if (li) host.appendChild(li);
  }
  function shortfall(r) {
    var rows = r.path.rows, lv = rows.filter(function (x) { return x.levyRev > 0.005; }), brw = rows.filter(function (x) { return x.borrow > 0.05; });
    return { lv: lv, brw: brw, first: lv.length ? lv[0].fy : brw.length ? brw[0].fy : null, lvMax: Math.max.apply(null, [0].concat(lv.map(function (x) { return x.levy; }))), brwSum: brw.reduce(function (s, x) { return s + x.borrow; }, 0) };
  }
  function renderEconomy(r) {
    renderEcoSimple(r);
    var pr = r.pathR || r, note = $('#path-note');
    if (pr !== r) {
      note.hidden = false;
      note.textContent = 'The pathway you chose includes Stages 2 and 3, so the year-by-year charts are costed the paper’s way, with Part 1 and its wealth-tax fund (option (i)), whatever Stage 1 design or dividend you choose' +
        (pr.path.id === 's1' ? ': at these settings the trigger is not met, so the path stays at Stage 1.' : '. On this path the model costs Stage 1’s first year by its Stage 2 and 3 method: ' + bnWord(pr.path.rows[0].net) + ' in 2028-29, against ' + bnWord(r.path.rows[0].net) + ' in the Stage 1 figures above, which do not change with the pathway.');
    } else { note.hidden = true; note.textContent = ''; }
    drawCost(pr);
    if (state.mode === 'detailed') renderEcoDetailed(r);
    var isPd = designKey(r) !== 'p1' && pr === r;
    $$('#economy figure.fig[data-ro]').forEach(function (f) { if (isPd && /net-cost|tax-change|budget|poverty/.test(f.getAttribute('data-ro'))) f.setAttribute('data-ro-prov', '1'); else f.removeAttribute('data-ro-prov'); });
  }
  // ---------- ranges across the sourced single lever moves ----------
  function fyNum(fy) { return fy ? +fy.slice(0, 4) : Infinity; }
  function rangeOf(field, kind) {
    var D0 = RANGE.data; if (!D0) return null;
    var vals = [D0.base.v ? D0.base.v[field] : D0.base[field]].concat(D0.moves.map(function (m) { return m.v[field]; }));
    var n = D0.moves.length;
    if (kind === 'year') {
      var nums = vals.map(fyNum), lo = Math.min.apply(null, nums), hi = Math.max.apply(null, nums);
      var name = function (x) { return x === Infinity ? (field === 'levy1' ? 'none by 2045-46' : field === 'exhaust' ? 'never within the projection' : 'never') : vals[nums.indexOf(x)]; };
      return { lo: name(lo), hi: name(hi), same: lo === hi, n: n };
    }
    var lo2 = Math.min.apply(null, vals), hi2 = Math.max.apply(null, vals);
    return { lo: lo2, hi: hi2, same: Math.abs(hi2 - lo2) < 1e-9, n: n };
  }
  function rangeText(field, kind, fmt) {
    if (window.__bwProbing) return '';
    if (RANGE.busy) return 'Range across the sourced single lever changes: calculating.';
    var g = rangeOf(field, kind); if (!g) return '';
    var lo = kind === 'year' ? g.lo : fmt(g.lo), hi = kind === 'year' ? g.hi : fmt(g.hi);
    return g.same ? 'The same across all ' + g.n + ' sourced single lever changes.' : 'Range across ' + g.n + ' sourced single lever changes: ' + lo + ' to ' + hi + '.';
  }
  var STAGE_LONG_ECO = { a: 'Stage 1, a targeted floor', c: 'Stage 2, conditional pathway', d: 'Stage 3, described, not authorised' };
  // Stage 2's rate rise runs from the smallest qualifying displacement up to the trigger-timed paths (Table F4-65's severe case)
  var R2MAX = DATA.partf4.ranges.severe.rise[2];
  function prov(elm) { elm.setAttribute('data-ro-prov', '1'); return elm; }
  function designKey(r) { return r.design || 'p1'; }
  function pc0(v) { return pct(v, 0); }
  function renderEcoSimple(r) {
    var rows = r.path.rows, last = rows[rows.length - 1], P = r.P, years = yearsOf(r), s1 = r.s1, sf = shortfall(r), pv = r.poverty, Ln = years.length - 1, des = designKey(r), isP = des !== 'p1';
    var adv = rows[0].adv, hl = $('#eco-hl');
    hl.textContent = 'At these settings Stage 1, a targeted floor (' + DESIGN_NAME[des] + '), would cost the Budget ' + bnWord(rows[0].net) + ' in 2028-29, ' + pct(100 * rows[0].net / rows[0].gdp) + ' of GDP' +
      (adv > 0.05 ? ', of which ' + bnWord(adv) + ' is borrowed that year.' : ', with no borrowing: the five taxes raise ' + bnWord(rows[0].dur) + ' that year.');
    ro(hl, 'eco-headline', 'Net cost of Stage 1 in 2028-29', null, '#eco-hl-tag'); if (isP) prov(hl);
    var sub = [];
    if (adv > 0.05) sub.push('The borrowing is repaid from later surpluses' + (s1.repaid ? ', by 30 June ' + (+s1.repaid.slice(0, 4) + 1) : '') + '.');
    if (sf.lv.length) sub.push('There is a shortfall from ' + sf.lv[0].fy + (isP && s1.levy1Alt && s1.levy1Alt !== s1.levy1 ? ' (' + s1.levy1Alt + ' if Rent Assistance follows the fiscal model’s path)' : '') + ': the taxes no longer cover the cost, and a levy on market income meets the gap. It reaches ' + pct(100 * sf.lvMax, 2) + ' at most, and the levies total ' + bnWord(s1.levySum) + ' to 2045-46.');
    else if (sf.brw.length) sub.push('There is a shortfall from ' + sf.brw[0].fy + ', met by borrowing: ' + bnWord(sf.brwSum) + ' to 2045-46.');
    else sub.push('The taxes cover the cost in every later year to 2045-46, with no shortfall' + (isP && s1.levy1Alt ? ' (a levy from ' + s1.levy1Alt + ' if Rent Assistance follows the fiscal model’s path)' : '') + '.');
    $('#eco-sub').textContent = sub.join(' ');
    var fh = $('#eco-figs'); fh.innerHTML = '';
    function fig(id, label, value, sub, paper, cls, kind, isProv) {
      var d = mk('div', 'bw-figure', null, fh); mk('span', 'bw-figure-value' + (cls ? ' ' + cls : ''), value, d); mk('span', 'bw-figure-label', label + (sub ? '. ' + cap(sub) + (/[.:]$/.test(sub) ? '' : '.') : '.'), d);
      if (paper) mk('span', 'bw-figure-paper', 'Recommended settings: ' + paper, d);
      ro(d, id, label, kind); if (isProv) prov(d); return d;
    }
    var pp = PAPER, psf = shortfall(pp), fi = r.firstPay ? years.indexOf(r.firstPay) : -1, ok = r.opt.key;
    fig('eco-net', 'Net cost of Stage 1 in 2028-29', bn(rows[0].net), (adv > 0.05 ? bn(adv) + ' of it borrowed that year; ' : 'no borrowing that year; ') + bn(last.net) + ' in 2045-46', bn(pp.path.rows[0].net), null, null, isP);
    fig('eco-short', 'First year of a shortfall', sf.first || 'None to 2045-46', (sf.lv.length ? 'a levy on market income meets the gap; ' + bn(s1.levySum) + ' of levies to 2045-46. ' : sf.brw.length ? bn(sf.brwSum) + ' borrowed to 2045-46. ' : '') +
      (isP ? 'On the fiscal model’s Rent Assistance path: ' + (s1.levy1Alt || 'none to 2045-46') + ' (' + bn(s1.levySumAlt) + '). ' : '') + rangeText('levy1', 'year'), psf.first || 'none', sf.first ? 'neg' : 'pos', null, isP);
    fig('eco-lev46', 'Levy on market income in 2045-46', pct(100 * last.levy, 2), (last.levyRev > 0.005 ? bn(last.levyRev) + ' that year. ' : '') + rangeText('lev46', 'rate', function (v) { return pct(100 * v, 2); }), pct(100 * pp.path.rows[Ln].levy, 2), null, null, isP);
    var ST = OB.stress[des];
    fig('eco-stress', 'Chance of a levy before 2044-45', pc0(100 * ST.before44), 'before 2034-35: ' + pc0(100 * ST.before34) + '. A joint stress test drawing tax yield, behaviour, cost overruns, the household calibration and the AI path together; with symmetric uncertainty alone, ' + pc0(100 * ST.sym44) + ' and ' + pc0(100 * ST.sym34) + '. The most likely first year is ' + ST.p50 + ', when borrowing not repaid by then is levied at once', null, null, 'fixed', true);
    if (isP) fig('eco-pov', 'Household poverty at Stage 1', pct(pv.rel[0]), 'from ' + pct(pv.base[0]) + ' under current rules; relative line, after housing costs; the household model’s figure for ' + DESIGN_SHORT[des] + ' at the recommended settings, which does not move with the levers', pct(pp.poverty.rel[0]), null, 'fixed', true);
    else fig('eco-pov', 'Household poverty at Stage 1', pct(pv.rel[0]), 'from ' + pct(pv.base[0]) + ' under current rules; relative line, after housing costs; interpolated between household-model runs', pct(pp.poverty.rel[0]), null, 'interp');
    var RC = OB.reach[des].adults;
    fig('eco-better-after', 'Adults better off after the funding taxes, 2028-29', pc0(RC.after_5pw), 'by more than A$5 a week once the five taxes are shared out; ' + pc0(RC.after_any) + ' by any amount. Same population and basis as the before-funding figure; it does not move with the levers', null, null, 'fixed', isP);
    fig('eco-better-before', 'Adults better off before the funding taxes, 2028-29', pc0(RC.before_5pw), 'by more than A$5 a week; ' + pc0(RC.before_any) + ' by any amount. Household model: adults counted by their household’s result, the same basis as the after-funding figure', null, null, 'fixed', isP);
    var LS = OB.losers[des];
    fig('eco-losers', 'Households on payments worse off after housing costs, 2028-29', nf1.format(LS.hh) + ' million', nf1.format(LS.people) + ' million people, about A$' + nf0.format(Math.round(LS.avg / 10) * 10) + ' a year each (Part 1: ' + nf1.format(OB.losers.p1.hh) + ' million). The rule protects payments under today’s rules, not income after rent; the rent and interest-rate scenario takes some of the gain back', null, null, 'fixed', true);
    if (r.phased && des === 'pstar') fig('eco-phased', 'A year without the child payment', bn(OB.phasedPrice.pstar.cash), 'what families forgo in 2028-29 above the Family Tax Benefit they keep until 2029-30; the budget saves ' + bn(OB.phasedPrice.pstar.saving), null, null, 'fixed', true);
    else if (r.phased) fig('eco-phased', 'What a phased start saves the budget in 2028-29', bn(OB.childCost28[des]), 'families keep current Family Tax Benefit until 2029-30; the model gives the cash families forgo for P* only', null, null, 'fixed', isP);
    if (ok !== 'none') {
      fig('eco-div', 'Dividend per adult', fi >= 0 ? aud(r.upath[fi]) + ' in ' + r.firstPay : 'None', fi >= 0 ? aud(r.upath[Ln]) + ' in 2045-46' : 'the fund is too small to pay one at these settings', 'none (no dividend)');
      if (!r.opt.durable) fig('eco-fund', 'Fund at 30 June 2046', bn(r.fundByReturn[P.fundReturn].F[Ln]), bn(r.fundByReturn[P.fundReturn].F26[Ln]) + ' in 2026 dollars' + (s1.exhaust ? '; it runs out in ' + s1.exhaust : '; it does not run out within the projection') + '. ' + rangeText('exhaust', 'year'), 'no fund');
    }
    renderEcoStages(r);
  }
  // at each stage: Stage 1 from the main run (the chosen design); Stages 2 and 3 costed the paper's way whatever the choices above
  function renderEcoStages(r) {
    var S = r.stages, it = r.ifTriggered, pv = r.poverty, ok = r.opt.key, rows = [], a0 = r.path.rows[0], des = designKey(r), isP = des !== 'p1';
    var paid1 = 'Five taxes' + (a0.adv > 0.05 ? ', and ' + bn(a0.adv) + ' of borrowing in ' + S.a.fy + ', repaid' + (r.s1.repaid ? ' by 30 June ' + (+r.s1.repaid.slice(0, 4) + 1) : ' later') : ' with no borrowing in ' + S.a.fy) + (r.s1.levy1 ? '; a levy on market income from ' + r.s1.levy1 : '; no levy to 2045-46') + (ok === 'i' ? '; the wealth-tax fund pays the dividend' : ok === 'iv' ? '; the Budget pays the dividend' : ok === 'v' ? '; a fund built from surpluses pays the dividend' : '');
    var D1 = { pstar: '; a child payment of A$' + nf0.format(Math.round(OB.pstarD)) + ' a child without the middle-income supplement; Rent Assistance 75% higher', pkg: '; Family Tax Benefit kept, plus A$' + nf0.format(Math.round(OB.pkgD)) + ' a child, an earned-income credit up to A$5,000 and Rent Assistance 75% higher', p1: '; the child payment as printed on 22 October' };
    var adult1 = 'Floor of ' + aud(S.a.F) + ' a year for working-age payments' + D1[des] + (ok === 'none' || !r.firstPay ? '; no dividend' : '; dividend ' + aud(S.a.U) + ' per adult in 2028-29 dollars, first paid ' + r.firstPay) + (r.phased ? '; child payment from 2029-30' : '');
    var RC = OB.reach[des].adults, hw = DATA.lifetime.worse_after;
    var bw = function (k, s) { var x = r.sh && r.sh[k]; return pc0(100 * (x ? x.better : s.better)) + ' / ' + pc0(100 * (x ? x.worse : s.worse)) + ' (fiscal model, adults)'; };
    rows.push([STAGE_LONG_ECO.a + ': ' + DESIGN_SHORT[des], S.a.fy, adult1, bn(S.a.net), paid1, pct(pv.rel[0]) + ' (from ' + pct(pv.base[0]) + ')', pc0(RC.after_5pw) + ' of adults better off by A$5 a week', pc0(RC.before_5pw) + ' better off by A$5 a week (household model)']);
    [['c', 2, 'JobSeeker rate'], ['d', 3, 'Age Pension rate']].forEach(function (x) {
      var s = S[x[0]], i = x[1] - 1, lab = STAGE_LONG_ECO[x[0]];
      if (!s) { rows.push({ span: true, cells: [lab, 'Not shown: no rate rise funds this stage at these settings (' + pv.years[i] + ' at the earliest).'] }); return; }
      var paid = (x[0] === 'c' ? 'No rate is legislated: it would need income-tax rates ' + riseStr(s.tau) + ' to ' + nf1.format(R2MAX) + ' points higher' : 'Not authorised: it would need income-tax rates about ' + riseStr(s.tau) + ' points higher') + (s.levy > 0 ? ' and a ' + pct(100 * s.levy, 2) + ' levy' : '') + (x[0] === 'd' && !it.cert ? '; no rate passes its stress test' : '');
      rows.push([lab, s.fy + ' at the earliest', aud(s.U) + ' a year to every adult (' + x[2] + ')', bn(s.net), paid, pct(pv.rel[i]) + ' (from ' + pct(pv.base[i]) + ')', pc0(hw[x[0]]) + ' of households worse off', bw(x[0], s)]);
    });
    table($('#eco-stages'), ['Stage', 'First year', 'Adult payment', 'Net cost that year', 'How it is paid for', 'Poverty after housing costs, all people', 'After the funding taxes', 'Before the funding taxes'], rows,
      { stacked: 'wide', textCols: [1, 2, 4, 5, 6, 7], caption: 'Stage 1 and the conditional pathway, modelled estimates', hideCaption: true, roCells: 'eco-st', roStages: ['a', 'c', 'd'],
        roKind: function (k, j) { if (j === 1) return 'fixed'; if (j === 5) return k === 'a' && !isP ? 'interp' : 'fixed'; if (j === 6) return 'fixed'; if (j === 7 && k === 'a') return 'fixed'; return null; } });
    if (isP) $$('#eco-stages [data-ro^="eco-st-a-"]').forEach(function (c) { prov(c); });
    $('#eco-stages-note').textContent = 'Stage 1 figures follow the design and levers you choose; the pathway lever does not change them.' + (isP ? ' ' + cap(DESIGN_SHORT[des]) + '’s cost is Part 1’s, live, plus the option B model’s difference from Part 1 in each year (provisional); its poverty rate and the shares better off are the household model’s figures at the recommended settings.' : '') +
      ' Stages 2 and 3 are costed the paper’s way, with Part 1 and its wealth-tax fund, whatever you choose above, at the smallest AI job loss that meets the need test or at the displacement lever if it is set. Their poverty rates and the shares worse off after the funding taxes are the paper’s figures at its settings. Shares before the funding taxes: Stage 1 on the household model (adults counted by their household’s result), Stages 2 and 3 on the fiscal model’s adult units, by more than A$5 a week.' + (r.stageStale ? ' Stage 2 and 3 figures are updating.' : '');
  }
  function renderEcoDetailed(r) {
    var des = designKey(r), isP = des !== 'p1';
    var P = r.P, path = r.path, rows = path.rows, last = rows[rows.length - 1], it = r.ifTriggered, levyMode = P.funding === 'levy', years = yearsOf(r);
    var pathName = { s1: 'Stage 1 continuing to 2045-46', s2: 'Stage 1, then Stage 2 from 2032-33', s23: 'Stage 2 from 2032-33 and Stage 3 from 2037-38 (the earliest dates)', trigger: 'trigger-timed' }[path.id];
    var pn = 'Stage 1 design: ' + DESIGN_NAME[des] + (r.phased ? ', with a phased start' : '') + '. Pathway: ' + pathName + '. ';
    if (P.pathway === 'trigger' && path.id === 'trigger' && r.trigger) pn += 'The youth-unemployment trigger is met in ' + r.trigger.label + ', so Stage 2 starts in ' + firstFy(rows, 'c') + '. ';
    else if (P.pathway === 'trigger') pn += 'Without AI displacement the trigger is never met, so Stage 1 continues. ';
    else if (P.pathway !== path.id) pn += 'No rate rise funds the later stages at these settings, so Stage 1 continues. ';
    var ok = r.opt.key;
    if (ok === 'i') pn += 'The wealth tax, net of the income tax it costs,' + (P.share > 0 ? ' and ' + pct(100 * P.share, 0) + ' of the excess profits tax go' : ' goes') + ' to the fund, which pays the dividend. The other taxes pay for the floor, the child payment and the protections';
    else if (ok === 'v') pn += 'There is no wealth tax. The other taxes pay for the floor, the child payment and the protections, and their surpluses' + (P.share > 0 ? ' and ' + pct(100 * P.share, 0) + ' of the excess profits tax' : '') + ' build the fund that pays the dividend';
    else if (ok === 'iv') pn += 'There is no wealth tax and no fund. The other taxes pay for the floor, the child payment, the protections and the dividend; their surpluses reduce debt and any later gap is levied';
    else pn += 'Stage 1 with no dividend, no wealth tax and no fund (the default). The other taxes pay for the floor, the child payment and the protections; their surpluses reduce debt and any later gap is levied';
    pn += rows.some(function (x) { return x.stage > 1; }) ? ', with the rate rise on top for the later stages.' : '.';
    $('#eco-path').textContent = pn;
    var roH = $('#eco-readouts'); roH.innerHTML = '';
    function readoutEl(label, value, sub) { readout(label, value, sub); return roH.lastElementChild; }
    function readoutFixed(label, value, sub) { var e = readoutEl(label, value, sub); e.setAttribute('data-ro-kind', 'fixed'); return e; }
    function readoutDesign(label, value, sub) { var e = readoutFixed(label, value, sub); e.setAttribute('data-ro-by', 'design'); return e; }
    function readout(label, value, sub, chip) {
      var d = mk('div', 'ro', null, roH); mk('p', 'rl', label, d); mk('p', 'rv', value, d); var s = mk('p', 'rs', cap(sub), d);
      ro(d, 'eco-ro-' + label.toLowerCase().replace(/[0-9]+/g, '').replace(/[^a-z]+/g, '-').replace(/^-+|-+$/g, ''), label, /^Household poverty/.test(label) ? 'interp' : null);
      if (chip) mk('span', 'chip ' + chip[0], chip[1], s);
    }
    var fi = r.firstPay ? years.indexOf(r.firstPay) : -1, i37 = years.indexOf('2037-38'), Ln = r.upath.length - 1, bh = r.behav, O = r.opt, s1 = r.s1;
    var fund = !O.durable, fb = r.fundByReturn[P.fundReturn];
    readout('Dividend per adult, first payment', fi >= 0 ? aud(r.upath[fi]) : 'None', fi >= 0 ? 'in ' + r.firstPay + '; ' + aud(r.upath[i37]) + ' in 2037-38 and ' + aud(r.upath[Ln]) + ' in 2045-46 (' + aud(r.upath26[Ln]) + ' in 2026 dollars). ' + pct(100 * bh.claim, 1) + ' of eligible adults are paid, as ' + pct(100 * P.nlTakeup, 0) + ' of those with no tax return enrol.' :
      ok === 'none' ? 'No dividend is chosen; the paper recommends none now.' : 'The fund is too small to pay a dividend at these settings.');
    if (fund) readout(ok === 'i' ? 'Permanent AI Dividend Fund, 2045-46' : 'Fund built from surpluses, 2045-46', bn(fb.F[Ln]), bn(fb.F26[Ln]) + ' in 2026 dollars, earning ' + pct(100 * r.fundRate, 2) + (s1.exhaust ? '. It runs out in ' + s1.exhaust + ', after the line has been charged to it.' : '. It does not run out within the projection.') + ' ' + rangeText('exhaust', 'year'), s1.exhaust ? ['bad', 'runs out ' + s1.exhaust] : null);
    else readout('Fund', 'None', ok === 'iv' ? 'The dividend is a Budget outlay every year (' + bn(O.G46) + ' in 2045-46), with no rule after 2045-46: Parliament sets the rate.' : 'Surpluses reduce debt instead; the balance kept peaks at ' + (isP ? bn(s1.balMax) + ' at 30 June ' + (+s1.balMaxFy.slice(0, 4) + 1) : bn(O.balMax || 0)) + '.');
    readout('Net cost, 2028-29', bn(rows[0].net), bn(rows[0].adv) + ' of it is borrowed that year and repaid' + (s1.repaid ? ' by ' + s1.repaid : ' later') + '. ' + pct(100 * rows[0].net / rows[0].gdp) + ' of GDP, including set-up, the income-fall review, parents working less as the child payment rises (' + bn(bh.inc) + ') and more students and Parenting Payment recipients (' + bn(bh.caseOther) + '). ' + bn(rows[1].net) + ' in 2029-30.');
    if (fund) readout('Share of the excess profits tax', pct(100 * P.share, 0), r.rule.none ? 'No share meets the paper’s rule at these settings: even at 0% the other taxes need a levy before 2041-42.' : 'The most the other taxes can carry to 2040-41 at these settings: ' + pct(100 * r.rule.leg, 0) + '.', P.share > r.rule.leg + 1e-9 ? ['bad', 'above the rule'] : null);
    else readout('Taxes raised, 2028-29', bn(r.cp0.stack), 'The five taxes other than the wealth tax, which this option drops; ' + bn(r.cp0.stack46) + ' in 2045-46.');
    var rk = ['c', 'd'].filter(function (k) { return path.tau && path.tau[k] > 0 && rows.some(function (x) { return x.key === k; }); });
    var sf = shortfall(r), lv = sf.lv, brw = sf.brw;
    if (rk.length) readout('Rate rise needed', rk.map(function (k) { return riseStr(path.tau[k]) + (k === 'c' && 100 * path.tau[k] < R2MAX - 0.05 ? ' to ' + nf1.format(R2MAX) : ''); }).join(' / ') + ' points',
      rk.map(function (k) { return KEYNAME[k] + ' from ' + firstFy(rows, k); }).join('; ') + (lv.length ? '; plus a levy of up to ' + pct(100 * sf.lvMax, 2) + ' in ' + lv.length + (lv.length === 1 ? ' year' : ' years') : '') + '.');
    else if (lv.length) readout('Levy on market income, from ' + lv[0].fy, pct(100 * lv[0].levy, 2), bn(lv[0].levyRev) + ' that year, ' + pct(100 * last.levy, 2) + ' (' + bn(last.levyRev) + ') in 2045-46; ' + bn(s1.levySum) + ' in all to 2045-46. ' + rangeText('levy1', 'year') + ' No rise in income-tax rates.');
    else readout('Tax change needed', 'None', brw.length ? 'Borrowing from ' + brw[0].fy + ', ' + bn(sf.brwSum) + ' in all (a shortfall).' : 'The taxes cover every year to 2045-46.');
    var wl = r.wtLife;
    if (ok === 'i') readout('Never-cut guarantee', s1.lapse ? 'Lapses ' + s1.lapse : 'Holds', rangeText('lapse', 'year') + ' ' + s1.lapse ? 'The year its levied top-up would pass a quarter of the dividend (' + bn(s1.topups) + ' levied before then). From then the income tax the wealth tax costs is charged to the fund' + (s1.exhaust ? ', which runs out in ' + s1.exhaust + '; then the levy bears it (' + bn(s1.postLevy) + ' to 2085-86).' : '.') : 'Top-ups levied to 2045-46: ' + bn(s1.topups) + '.');
    else if (ok === 'v') readout('Never-cut guarantee', s1.lapse ? 'Lapses ' + s1.lapse : 'Holds', 'With no wealth tax there is no lost income tax for the fund to carry; the fund keeps its real value' + (r.perp.F26_2085 !== null ? ', ' + bn(r.perp.F26_2085) + ' in 2026 dollars by 2085-86' : '') + '.');
    else if (ok === 'iv') readout('Dividend paid from the Budget, 2045-46', bn(O.G46), 'The same dividend as option (i), paid by the other taxes; the levy meets the gap from ' + (s1.levy1 || 'no year') + '.');
    else if (isP) prov(readoutEl('Balance kept by the other taxes, peak', bn(s1.balMax), 'At 30 June ' + (+s1.balMaxFy.slice(0, 4) + 1) + '. Surpluses reduce debt until the floor and child payment outgrow the taxes; a levy from ' + (s1.levy1 || 'no year to 2045-46') + '.'));
    else readout('Balance kept by the other taxes, peak', bn(O.balMax || 0), 'Surpluses reduce debt until the floor and child payment outgrow the taxes; a levy from ' + (s1.levy1 || 'no year to 2045-46') + '.');
    var nb = O.t100 ? O.t100.filter(function (x) { return x[0].indexOf('(' + ok + ')') === 0; })[0] : null;
    var AP = OB.appraisal[des], rg = function (x) { return bn(x[0]) + ' to ' + bn(x[1]); };
    if (isP) prov(readoutDesign('Net benefit, complete accounting, 2028-29', rg(AP.nb), 'First-year net benefit on the paper’s complete accounting for ' + DESIGN_SHORT[des] + ', against Part 1: ' + (AP.vsP1 ? bn(AP.vsP1[0], true) + ' to ' + bn(AP.vsP1[1], true) : 'the reference') + '. It breaks even at a weight of ' + nf1.format(AP.w[0]) + ' to ' + nf1.format(AP.w[1]) + ' on gains to households in poverty; with the Green Book’s standard weights it is ' + rg(AP.gb) + '. The paper’s figure at its settings.'));
    else if (nb) readoutFixed('Net benefit, complete accounting', rangeBn(nb[12]), 'Present value 2028-29 to 2045-46 at the paper’s settings, after the deadweight cost of the taxes and the behavioural costs. ' + (ok === 'none' ? 'The reference for the other options.' : 'Universality would need to be worth A$' + nb[13].replace(' to ', ' to A$') + ' per adult a year to match Stage 1 with no dividend.'));
    var pv = r.poverty, pz = pv.pens, hiRel = pz ? pv.rel[0] + pz[1].rel - pz[0].rel : pv.rel[0];
    if (isP) { var pr2 = OB.povRec075[des]; readout('Household poverty, Stage 1', nf1.format(pv.rel[0]) + '–' + pct(pr2), 'Relative line, from ' + pct(pv.base[0]) + ': the household model’s run for ' + DESIGN_SHORT[des] + ', and with full-rate pensioners’ other income 25% lower (closest to DSS data). Anchored line ' + pct(pv.anch[0]) + '; children ' + pct(pv.child[0]) + '. After housing costs; the model’s figures at the recommended settings, which do not move with the levers.'); }
    else readout('Household poverty, Stage 1', nf1.format(pv.rel[0]) + '–' + pct(hiRel), 'Relative line, from ' + pct(pv.base[0]) + ': as modelled, and if full-rate pensioners have a quarter less other income (closest to DSS data). Anchored line ' + pct(pv.anch[0]) + '; children ' + pct(pv.child[0]) + (pv.lag ? ' (' + nf1.format(pv.lag.rel[0]) + '–' + pct(pv.lag.rel[1]) + ' allowing for the assessment lag)' : '') + '; without the dividend ' + pct(pv.noDiv.rel) + '. After housing costs, approximate between modelled points.');
    readout('Net financial worth vs baseline, 2045-46', bn0(last.nfwBn, true), 'Net debt ' + bn0(last.ndBn, true) + (fund ? ' (only the fund’s cash and credit count).' : ' (no fund: the levies keep the balance at zero).'),
      last.nfwBn > 0.5 ? ['good', 'higher'] : last.nfwBn < -0.5 ? ['bad', 'lower'] : null);
    var nWorse = rows.filter(function (x) { return x.ucbBn < -0.05; }).length;
    readout('Cash balance vs baseline, 2045-46', bn(last.ucbBn, true), (fund ? 'The fund’s earnings sit outside it, as for the Future Fund; counting all of them, ' + bn(last.ucbBn + last.earn, true) + '. ' : 'No fund: surpluses cut debt and the interest saved is in the balance. ') + 'Worse than baseline in ' + nWorse + ' of 18 years.');
    var lt = r.lifetime, hw = O.paper.hh.worse;
    var RC = OB.reach[des];
    var e2 = readoutEl('Adults better off after the funding taxes, 2028-29', pct(RC.adults.after_5pw, 0), 'By more than A$5 a week once the five taxes are shared out; ' + pct(RC.adults.after_any, 0) + ' by any amount; households ' + pct(RC.households.after_5pw, 0) + ' and ' + pct(RC.households.after_any, 0) + '. Same population and basis as the before-funding figure. Fixed at the recommended settings.');
    ro(e2, 'eco-ro-adults-better-off-after-the-funding-taxes', 'Adults better off after the funding taxes, 2028-29', 'fixed'); if (isP) prov(e2);
    var e1 = readoutEl('Adults better off before the funding taxes, 2028-29', pct(RC.adults.before_5pw, 0), 'By more than A$5 a week; ' + pct(RC.adults.before_any, 0) + ' by any amount; households ' + pct(RC.households.before_5pw, 0) + ' and ' + pct(RC.households.before_any, 0) + '. Household model, adults counted by their household’s result; the same basis as the after-funding figure. Fixed at the recommended settings.');
    ro(e1, 'eco-ro-adults-better-off-before-the-funding-taxes', 'Adults better off before the funding taxes, 2028-29', 'fixed'); if (isP) prov(e1);
    var shA = r.sh && r.sh.a;
    if (shA && !isP) readout('Adults better off before the funding taxes, fiscal model', pct(100 * shA.better, 0), pct(100 * shA.worse, 0) + ' worse off, by more than A$5 a week, on the fiscal model’s individual-income units: a different basis from the two figures above, shown because it moves with the levers.');
    if (isP) { var pe = $('[data-ro="eco-ro-household-poverty-stage"]'); if (pe) { pe.setAttribute('data-ro-kind', 'fixed'); prov(pe); } $$('#eco-readouts .ro').forEach(function (e) { if (!/taxes-raised/.test(e.getAttribute('data-ro'))) prov(e); }); }
    if (!isP) readout('Working parents above a 50% marginal rate', pct(r.taper.over50, 0), 'With the child payment’s 18 cent taper; ' + pct(r.taper.today, 0) + ' under current rules.');
    var fh = $('#eco-findings'); fh.innerHTML = '';
    if (fund && P.payout > r.perp.realReturn + 1e-9 && r.perp.F26_2085 !== null && r.perp.F26_2085 < r.perp.F26_2045 - 0.5 && !s1.exhaust)
      finding(fh, 'Paying out ' + pct(100 * P.payout, 2) + ' a year when the fund earns ' + pct(100 * r.perp.realReturn, 1) + ' above inflation spends its capital. In 2026 dollars the fund falls from ' + bn(r.perp.F26_2045) + ' in 2045-46 to ' + bn(r.perp.F26_2085) + ' by 2085-86.');
    else if (fund && P.payout < 0.04 - 1e-9) finding(fh, 'Paying out less than the fund’s expected real return keeps more for later. The fund grows in real terms, and the dividend is smaller now.', true);
    if (ok === 'i' && (s1.lapse || s1.topups > 0.05)) finding(fh, 'The wealth tax’s last year is 2038-39, but the income tax it costs keeps growing with GDP: ' + bn(-wl.rows[17].line) + ' in 2045-46. The fund bears it. ' +
      (s1.lapse ? 'At first the dividend account pays it' + (s1.topups > 0.05 ? ' and a levy tops the account up so the dividend is not cut (' + bn(s1.topups) + ')' : '') + '. In ' + s1.lapse + ' the top-up needed would pass a quarter of the dividend, so the guarantee lapses. The dividend then follows the fund’s payout and the loss is charged to the fund’s capital' + (s1.exhaust ? ', which runs out in ' + s1.exhaust + '. After that the levy bears the loss, ' + bn(s1.postLevy) + ' to 2085-86.' : '.') :
        'The dividend account pays it and a levy tops the account up so the dividend is not cut: ' + bn(s1.topups) + ' to 2045-46.'), true);
    if (ok === 'v') finding(fh, 'Without the wealth tax the fund only receives the other taxes’ surpluses, ' + (r.firstPay ? 'so the first dividend comes in ' + r.firstPay + ' (' + aud(r.upath[fi]) + ') and reaches ' + aud(r.upath[Ln]) + ' by 2045-46' : 'and pays no dividend at these settings') + '. Banking those surpluses brings the levy forward: ' + bn(s1.levySum) + ' to 2045-46' + (s1.levy1 ? ', from ' + s1.levy1 : '') + '.', true);
    if (ok === 'iv') finding(fh, 'With no wealth tax and no fund, the same dividend as option (i) is a Budget outlay every year. The other taxes carry it with the floor and the child payment, so the levy comes ' + (s1.levy1 ? 'from ' + s1.levy1 : 'later') + (P.dispEp > 0 ? ': ' : ' and is the largest of the four options: ') + bn(s1.levySum) + ' to 2045-46.', true);
    if (ok === 'none' && isP) finding(fh, 'With no dividend, ' + DESIGN_SHORT[des] + '’s floor and family payments reach the people the paper targets. Its levies total ' + bn(s1.levySum) + ' to 2045-46' + (s1.levy1 ? ', from ' + s1.levy1 : '') + '. In the 22 October (Part 1) run, adults gaining before the taxes fell from ' + pct(X4.opts.i.adult.before, 0) + ' with the wealth-tax dividend to ' + pct(X4.opts.none.adult.before, 0) + ' without it, and no dividend had the smallest levies of the four options.', true);
    else if (ok === 'none') finding(fh, 'With no dividend, the floor and the child payment reach the people the paper targets. Counting any gain, adults gaining before the taxes fall from ' + pct(X4.opts.i.adult.before, 0) + ' with the wealth-tax dividend to ' + pct(100 * r.dist2829.better, 0) + '; the dividend adds A$45 a year, under A$1 a week. Its levies ' + (P.dispEp > 0 ? 'total ' : 'are the smallest of the four options: ') + bn(s1.levySum) + ' to 2045-46' + (s1.levy1 ? ', from ' + s1.levy1 : '') + '.', true);
    if (ok === 'i' && r.rule.none && P.dispEp <= 0 && s1.levy1) finding(fh, P.share > 0 ? 'At ' + pct(100 * P.share, 0) + ' of the excess profits tax in the dividend a levy is needed from ' + s1.levy1 + '. No share meets the paper’s rule at these settings, so it would pay none out.' :
      'No share of the excess profits tax meets the paper’s rule at these settings. Even with none of it in the dividend, the other taxes fall short of the floor, the child payment and the protections in ' + s1.levy1 + ', before 2041-42, so the levy starts then. The dividend is still paid and the floor is not cut.');
    else if (ok === 'i' && P.share > r.rule.leg + 1e-9 && P.dispEp <= 0) finding(fh, 'At ' + pct(100 * P.share, 0) + ' of the excess profits tax the other taxes no longer cover the floor, the child payment and the protections to 2040-41' + (s1.levy1 ? ': a levy is needed from ' + s1.levy1 + '.' : '.'));
    if (P.dispEp > 0 && r.disp) finding(fh, fund ? 'In this displacement the floor is held and the dividend follows the fund. ' + (r.disp.decl ? 'It is declared in ' + r.disp.decl + ', once the need test has been met for eight quarters; before then the levy meets the gap. From then the reserve meets ' + bn(s1.draws) + ' of the shortfall' + (r.disp.loanPeak > 0.05 ? ' and the fund lends the rest for a year (up to ' + bn(r.disp.loanPeak) + ')' : '') + '. From the first year Stage 2 could start the levy repays the loan, whether or not a vote is held.' : 'It is not declared by 2045-46, so the levy meets the gap.') + ' See “If AI displaces work” below.' :
      'In this displacement the floor is held. With no fund there is no loan: ' + (r.disp.drawn > 0.05 ? 'the surpluses the other taxes have kept meet a gap first (' + bn(r.disp.drawn) + '), then the levy (' : 'the other taxes have kept no surpluses to draw on, so the levy meets the gap (') + bn(r.disp.levySum) + ' to 2045-46' + (r.disp.levy1 ? ', from ' + r.disp.levy1 : '') + '). See “If AI displaces work” below.', true);
    if (fund && P.fundReturn === 'low') finding(fh, 'At the bond rate the fund earns no risk premium. It holds ' + bn(r.fundByReturn.low.F[Ln]) + ' by 2045-46, against ' + bn(r.fundByReturn.central.F[Ln]) + ' at CPI + 4%, and the dividend is ' + aud(r.fundByReturn.low.D[Ln]) + ' that year.', true);
    if (path.short && path.id !== 's1') finding(fh, 'Even at its best rise of ' + riseStr(path.tau[path.short.key]) + ' points, ' + KEYNAME[path.short.key] + ' is ' + bn(-path.short.margin) + ' short in ' + path.short.fy + ' under the ' + path.short.form + ' form of the taxpayer response. ' + (levyMode ? 'The levy carries the rest.' : 'The rest is borrowed.'));
    var capRows = rows.filter(function (x) { return x.capped; });
    if (capRows.length) finding(fh, 'In ' + capRows.length + (capRows.length === 1 ? ' year' : ' years') + ' from ' + capRows[0].fy + ' even the levy cannot close the gap. Past ' + pct(100 * capRows[0].levy) + ' it raises less, not more, so the rest is borrowed.');
    if (P.aiInvest > 0) finding(fh, 'Government AI investment of ' + bn(P.aiInvest) + ' a year is counted in the cash balance and net debt, along with the receipts it generates. It is not part of the payment’s net cost.', true);
    var tl = $('#eco-trig'); tl.innerHTML = '';
    if (r.opt.key !== 'i') finding(tl, 'Costed here with the funding of option ' + r.opt.key + ' (' + (r.opt.nowt ? 'no wealth tax' : 'the wealth tax') + (r.opt.durable ? ', no fund' : '') + '); the paper costs Stages 2 and 3 with option (i).', true);
    var basis = it.basis === 'user' ? 'the AI displacement you set' : it.basis === 'min' ? 'the smallest AI displacement that meets the need test' : 'no AI displacement (which cannot meet the need test)';
    if (it.tau) finding(tl, 'Costed on ' + basis + ', Stage 2 needs income-tax rates ' + riseStr(it.tau.c) + ' points higher from 2032-33, up to ' + nf1.format(R2MAX) + ' on trigger-timed paths. Stage 3 needs ' + riseStr(it.tau.d) + ' points from 2037-38, on top of the other taxes and the fund’s dividend. That is the larger of the two forms of the taxpayer response (aggregate ' + riseStr(it.tau_agg.c) + ' and ' + riseStr(it.tau_agg.d) + '; per person ' + riseStr(it.tau_pp.c) + ' and ' + riseStr(it.tau_pp.d) + '). After the six taxes, ' + pct(it.worseAfter.c, 0) + ' and ' + pct(it.worseAfter.d, 0) + ' of households are worse off at the paper’s settings.', true);
    else {
      var bad = ['c', 'd'].filter(function (k) { return !isNum(it.tau_agg[k]) || !isNum(it.tau_pp[k]); });
      finding(tl, 'Costed on ' + basis + ', no rate rise funds ' + (bad.length === 2 ? 'Stages 2 and 3' : KEYNAME[bad[0] || 'd']) + ' at these settings: past the revenue peak a higher rate raises less, not more.');
    }
    finding(tl, it.cert ? 'A Stage 3 rate passes its stress-tested certificate at these settings. It still covers the cost with the taxpayer response doubled and in the combined downside.' :
      'No rate passes Stage 3’s stress-tested certificate: none covers its cost both with the taxpayer response doubled and in the combined downside. So the Act would legislate Stage 3 as an authority with no rate.');
    if (it.levy) finding(tl, it.levy.peakRev < it.levy.gap ? 'A levy on market income alone cannot fund Stage 3. At its peak (' + pct(100 * it.levy.peakT) + ') it raises ' + bn(it.levy.peakRev) + ' against a gap of ' + bn(it.levy.gap) + ' in 2037-38.' :
      'A levy on market income alone could fund Stage 3 in 2037-38: the gap of ' + bn(it.levy.gap) + ' is within the ' + bn(it.levy.peakRev) + ' it raises at its peak.', it.levy.peakRev >= it.levy.gap);
    if (it.eti04 && it.eti04.minMargin) {
      var e4 = it.eti04, nd4 = !isNum(e4.need.d);
      finding(tl, 'At double the taxpayer response (' + e4.eps.toFixed(2) + ')' + (nd4 ? ', no rate rise restores Stage 3: at the rise above it is ' + bn(-e4.minMargin[0]) + ' short in ' + e4.minMargin[1] + '.' : ', Stage 3 needs a rise of ' + riseStr(e4.need.d) + ' points.'), !nd4);
    }
    if (it.down && it.down.minMargin) {
      var dn = it.down, ndd = !isNum(dn.need.d);
      finding(tl, 'In a combined downside (the six taxes at 70% of their costings, stronger labour and taxpayer responses)' + (ndd ? ', Stage 3 is ' + bn(-dn.minMargin[0]) + ' short in ' + dn.minMargin[1] + ' at the rise above and no rise restores it.' : ', Stage 3 needs a rise of ' + riseStr(dn.need.d) + ' points.'), !ndd);
    }
    if (it.short) finding(tl, 'Even at its best rise of ' + riseStr(it.tau[it.short.key]) + ' points, ' + KEYNAME[it.short.key] + ' is ' + bn(-it.short.margin) + ' short in ' + it.short.fy + ' under the ' + it.short.form + ' form: the rate is past the revenue peak.');
    renderDisp(r); renderParts(r);
    var pr = r.pathR || r;
    drawDividend(r); drawFund(r); drawWT(r); drawBal(pr); drawRise(pr); drawPoverty(r); renderDesigns(r); renderAlt(); renderZero(); drawDeciles(pr);
    if (isP) $('#dec-sub').textContent += ' These deciles are for Part 1 as printed on 22 October; the model has them for no other design.';
  }
  function renderDisp(r) {
    var host = $('#eco-disp'); host.innerHTML = '';
    var VN = { paper: 'GDP held, the paper’s scenario', a: 'GDP falls with the lost wages', c: 'half the lost wages reappear as profits', b: 'the lost wages reappear as taxed profits' };
    if (r.disp) {
      var d = r.disp;
      finding(host, 'At your settings (' + VN[d.macro] + '): ' + (d.start ? 'the youth-unemployment trigger is met in ' + d.trigLabel + ', so Stage 2 could start from 1 July ' + d.start + '. ' : 'the trigger is not met by 2045-46. ') +
        (d.durable ? 'With no fund there is no lender. ' + (d.drawn > 0.05 ? 'The surpluses the other taxes have kept, carried at the debt rate, meet a gap first (' + bn(d.drawn) + ' of it), then the levy' : 'The other taxes have kept no surpluses to draw on, so the levy meets the gap') + (d.levy1 ? ' from ' + d.levy1 + ', at most ' + pct(100 * d.preLoan, 2) + ' of market income before Stage 2 could start' : '') + '. ' :
        (d.decl ? 'The displacement is declared in ' + d.decl + ', once the need test has been met for eight quarters; before that the levy meets the gap. ' : '') +
        (d.loanPeak > 0.05 ? 'From then the reserve and a loan from the fund (up to ' + bn(d.loanPeak) + ') bridge the year to Stage 2. The largest levy before repayment is ' + pct(100 * d.preLoan, 2) + ' of market income (' + pct(100 * d.preCur, 2) + ' if the levy met every gap). From ' + d.start + ' the levy repays the loan over ten years, whether or not a vote is held' + (d.loanBy ? ', and it is repaid by ' + d.loanBy : '') + '. ' : 'The reserve covers any gap until then. ')) +
        'If Stage 1 simply continues, the levy reaches ' + pct(100 * d.levy46, 2) + ' of market income by 2045-46' + (d.durable ? ' (' + bn(d.levySum) + ' of levies to 2045-46)' : '') +
        (d.rise !== null ? '; a trigger-timed Stage 2 would need income-tax rates ' + nf1.format(100 * d.rise) + ' points higher' + (d.durable ? '' : ', which also repays the loan') : '') +
        '. ' + (r.opt.key === 'none' ? '' : r.opt.key === 'iv' ? 'The dividend is paid in full from the Budget (' + aud(d.div46) + ' in 2045-46). ' : 'The dividend is never cut (' + aud(d.div46) + ' in 2045-46). ') + 'Without the reform this displacement would cost the Budget ' + bn(d.sq3536) + ' in 2035-36 in extra JobSeeker and lost income tax' + (d.gdpLost > 0.05 ? ', with GDP ' + pct(d.gdpLost) + ' lower' : '') + '.', true);
    } else finding(host, 'Set the displacement lever to see the loan rule and the macro feedback at work at your settings.', true);
    finding(host, 'Is the sign of the macro feedback known? No. If GDP falls with the lost wages the levy is higher; if the lost wages reappear as taxed company profits it is lower. Which happens depends on how much displaced labour income is lost output and how much becomes profit, which the model cannot tell. A shortfall remains in every variant.');
    var R = r.f2.ranges, rg = function (x, f) { return f(x[0]) + ' to ' + f(x[1]); }, p2 = function (v) { return pct(v, 2); }, p1 = function (v) { return nf1.format(v); }, b1 = function (v) { return bn(v); };
    var Q = X4.p1disp, qv = function (nm, k) { var V = Q[nm].var, xs = ['a', 'c', 'b'].map(function (v) { return V[v][k]; }); return [Math.min.apply(null, xs), Math.max.apply(null, xs), V.paper[k]]; };
    var qrow = function (lab, k, f) { var m = qv('moderate', k), v = qv('severe', k); return [lab, f(m[2]), rg(m, f), f(v[2]), rg(v, f)]; };
    var tP = mk('div'), t = mk('div');
    table(tP, ['Across the variants (Stage 1 with no dividend, paper’s settings)', 'Moderate: GDP held', 'Moderate: range', 'Severe: GDP held', 'Severe: range'], [
      qrow('Largest levy before Stage 2 could start (% of market income)', 'pre', p2), qrow('Levy in 2045-46 if Stage 1 continues (% of market income)', 'rate46', p2),
      qrow('Levies to 2045-46', 'total', b1), qrow('Kept surpluses drawn to 2045-46', 'drawn', b1), qrow('Status-quo cost of the displacement, 2035-36', 'sq35', b1)], { caption: 'A displacement under Stage 1 with no dividend, across the macro variants', hideCaption: true, ro: 'eco-disp-none', roLabel: 'A displacement with no dividend, across the macro variants', roFixed: true });
    if (r.opt.key === 'none') { host.appendChild(tP); host.appendChild(t); } else { host.appendChild(t); host.appendChild(tP); }
    table(t, ['Across the variants (option (i), paper’s settings)', 'Moderate: GDP held', 'Moderate: range', 'Severe: GDP held', 'Severe: range'], [
      ['Largest levy before the loan is repaid (% of market income)', p2(R.moderate.pre[2]), rg(R.moderate.pre, p2), p2(R.severe.pre[2]), rg(R.severe.pre, p2)],
      ['Levy in 2045-46 if Stage 1 continues (% of market income)', p2(R.moderate.levy46[2]), rg(R.moderate.levy46, p2), p2(R.severe.levy46[2]), rg(R.severe.levy46, p2)],
      ['Trigger-timed Stage 2 rise, repaying the loan (points)', p1(R.moderate.rise[2]), rg(R.moderate.rise, p1), p1(R.severe.rise[2]), rg(R.severe.rise, p1)],
      ['Status-quo cost of the displacement, 2035-36', b1(R.moderate.sq[2]), rg(R.moderate.sq, b1), b1(R.severe.sq[2]), rg(R.severe.sq, b1)],
      ['Fund, 30 June 2046', b1(R.moderate.fund[2]), rg(R.moderate.fund, b1), b1(R.severe.fund[2]), rg(R.severe.fund, b1)],
      ['Dividend 2045-46 (A$, never cut)', aud(R.moderate.div[2]), rg(R.moderate.div, aud), aud(R.severe.div[2]), rg(R.severe.div, aud)]], { caption: 'A displacement under option (i), across the macro variants', hideCaption: true, ro: 'eco-disp-i', roLabel: 'A displacement under option (i), across the macro variants', roFixed: true });
  }
  var T98_ROWS = [['How Part 2 is financed', 'How it is financed'], ['Dividend per adult, 2029-30', 'Dividend per adult, 2029-30 / 2032-33 / 2037-38 / 2045-46 (A$)'],
    ['First dividend', 'First dividend'], ['Never-cut guarantee', 'Never-cut guarantee'], ['Fund, 30 June 2046', 'Fund, 30 June 2046 (A$bn; in 2026 A$bn)'], ['Does the fund run out', 'Does the fund run out?'],
    ['Levies to 2045-46', 'Levies to 2045-46 (A$bn); first levy'], ['Net cost 2028-29', 'Net cost 2028-29 / 2045-46 / ten years to 2037-38 (A$bn)'],
    ['Taxes raised', 'Taxes raised 2028-29 / ten years (A$bn)'], ['Deadweight cost of the financing', 'Deadweight cost of the taxes, first ten years (A$bn)'],
    ['Net benefit, complete accounting, 2028-29', 'Net benefit 2028-29, complete accounting (A$bn)'], ['Net benefit, complete accounting, present value', 'Net benefit, present value to 2045-46 (A$bn)'],
    ['Break-even value of universality', 'Universality must be worth, per adult a year (A$)'], ['Households gaining before funding', 'Households gaining before / better off after the taxes, 2028-29'],
    ['Adults gaining before funding', 'Adults gaining before / better off after the taxes, 2028-29'], ['AHC poverty', 'Poverty after housing costs, relative / anchored (%)'],
    ['Net debt / net financial worth', 'Net debt / net financial worth vs baseline, June 2046 (A$bn)']];
  function renderParts(r) {
    var host = $('#eco-opts'); host.innerHTML = '';
    var O = r.opt, T = O.t98, sel = O.keys.indexOf(O.key) + 1;
    mk('p', 'why', 'The paper describes these four ways of paying, or not paying, a universal dividend and recommends none of them now; the calculator’s default is no dividend. Stage 1, the floor and the child payment, is the same in all four. Figures at the paper’s 22 October settings; the column of the option you have chosen is marked.', host);
    var wrap = mk('div', 'bw-table-wrap', null, host), t = mk('table', 'opts-tbl', null, wrap); ro(wrap, 'eco-opts', 'The four dividend options at the paper’s settings', 'fixed', 'before');
    mk('caption', 'bw-visually-hidden', 'The four Part 2 options at the paper’s settings', t);
    var th = mk('thead', null, null, t), tr = mk('tr', null, null, th), h0 = mk('th', null, 'At the paper’s settings', tr); h0.scope = 'col';
    var isPo = designKey(r) !== 'p1'; if (isPo) sel = 0;
    O.keys.forEach(function (k, i) { var c = mk('th', i + 1 === sel ? 'sel' : null, (isPo && k === 'none' ? 'Part 1 alone, 22 October run' : O.labels[k]) + (i + 1 === sel ? ' (chosen)' : ''), tr); c.scope = 'col'; });
    var tb = mk('tbody', null, null, t);
    T98_ROWS.forEach(function (rw) {
      var src = T.filter(function (x) { return x[0].indexOf(rw[0]) === 0; })[0]; if (!src) return;
      var trr = mk('tr', null, null, tb), h = mk('th', null, rw[1], trr); h.scope = 'row';
      for (var i = 1; i <= 4; i++) mk('td', i === sel ? 'sel' : null, src[i], trr);
    });
    var grid = mk('div', 'proscons', null, host);
    O.t101.slice(1).forEach(function (row, i) {
      mk('h4', null, row[0] + (i + 1 === sel ? ' (chosen)' : ''), grid);
      [['For', row[1]], ['Against', row[2]]].forEach(function (x) { var p = mk('p', null, null, grid); mk('b', null, x[0] + ': ', p); p.appendChild(document.createTextNode(String(x[1]).replace(/; ([a-z])/g, function (m, c) { return '. ' + c.toUpperCase(); }))); });
    });
    mk('p', 'why', 'Complete accounting counts the deadweight cost of each option’s taxes and levies, the dividend’s small labour response and the behavioural costs of Stage 1 itself. Present values run to 2045-46 at the debt rate and leave out the funds still held in June 2046. The benefit rests on two assumptions: the poverty-gap reduction grows with the floor and the number of adults, and the income people forgo grows with the dividend. On the paper’s household measure the dividend barely moves poverty, so the options differ in net benefit almost wholly through the cost of their financing. Whether reaching every adult is worth that cost is the judgement left to Parliament.', host);
  }
  function drawDividend(r) {
    var years = yearsOf(r), nom = r.upath, real = r.upath26;
    if (r.opt.key === 'none') { $('#ch-div').innerHTML = ''; $('#lg-div').innerHTML = ''; $('#tb-div').innerHTML = ''; $('#why-div').textContent = 'No dividend is chosen, so none is paid and there is nothing to chart. The paper recommends none now.'; return; }
    var hi = Math.max(1, Math.max.apply(null, nom));
    var f = frameYears($('#ch-div'), years, 0, hi * 1.12, { aria: 'Dividend per adult by year, in dollars of the day and in 2026 dollars', yUnit: 'A$ a year', r: 56, h: 260 });
    var svg = f.svg, cw = Math.min(20, f.bw * 0.6);
    nom.forEach(function (v, i) { if (v > 0.5) el('path', { d: colPath(f.x(i) - cw / 2, f.y(0), f.y(v), cw), fill: 'var(--s1)' }, svg); });
    el('path', { d: real.map(function (v, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(v).toFixed(1); }).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    var li = years.length - 1;
    tx(svg, f.x(li) + cw / 2 + 4, f.y(nom[li]) + 4, aud(nom[li]), 'lab');
    legend($('#lg-div'), [{ type: 'rect', color: 'var(--s1)', label: 'A$ of the day (columns)' }, { type: 'line', color: 'var(--ink)', label: 'In 2026 dollars (line)' }]);
    hover($('#ch-div'), svg, f, years.length, f.x, function (i) {
      return { title: years[i], rows: [{ color: 'var(--s1)', label: 'Per adult', value: aud(nom[i]), kind: 'rect' }, { color: 'var(--ink)', label: 'In 2026 dollars', value: aud(real[i]) }] };
    });
    var ok = r.opt.key;
    $('#why-div').textContent = ok === 'none' ? 'No dividend is chosen, so none is paid. The paper recommends none now.' : ok === 'iv' ? 'Option (iv) pays option (i)’s dividend from the Budget each year, a year in arrears, to every eligible adult who is paid (' + pct(100 * r.behav.claim, 1) + '); it is taxed.' :
      'Paid a year in arrears: ' + pct(100 * r.P.payout, 2) + ' of the fund’s average balance over the last three years' + (r.P.share > 0 ? ' plus ' + pct(100 * r.P.share, 0) + ' of last year’s excess profits tax' : '') + ', less 10% kept in a reserve, shared among all eligible adults. What non-lodgers who do not enrol leave unclaimed (' + pct(100 * (1 - r.behav.claim), 1) + ' of adults) stays in the account. ' +
      (r.s1.lapse ? 'It is not cut in cash terms until the guarantee lapses in ' + r.s1.lapse + '. ' : 'It is never cut in cash terms. ') + 'It is taxed.';
    table($('#tb-div'), ['Year', 'Per adult (A$)', 'In 2026 dollars (A$)'], years.map(function (fy, i) { return [fy, aud(nom[i]), aud(real[i])]; }), { caption: 'Dividend per adult by year', hideCaption: true });
  }
  function drawFund(r) {
    var years = yearsOf(r), cont = $('#ch-fund'), FR = r.fundByReturn, sel = r.P.fundReturn;
    if (r.opt.durable) {
      cont.innerHTML = ''; $('#lg-fund').innerHTML = ''; $('#tb-fund').innerHTML = '';
      $('#why-fund').textContent = r.opt.key === 'iv' ? 'Option (iv) has no fund: the dividend is paid from the Budget each year, and the other taxes’ surpluses reduce debt instead.' : 'Stage 1 with no dividend has no fund and no dividend: the other taxes’ surpluses reduce debt instead.';
      return;
    }
    var COL = { low: 'var(--fund)', central: 'var(--ai)', high: 'var(--s2)' }, NAME = { low: 'Bond rate', central: 'CPI + 4%', high: 'CPI + 5%' };
    var hi = 0, lo = 0; ['low', 'central', 'high'].forEach(function (k) { FR[k].F.forEach(function (v) { hi = Math.max(hi, v); lo = Math.min(lo, v); }); });
    var f = frameYears(cont, years, lo, hi * 1.08, { aria: 'Fund balance by year under three returns', yUnit: 'A$ billion', r: 64, h: 260 });
    var svg = f.svg, line = function (arr) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(v).toFixed(1); }).join(''); };
    var area = 'M' + f.x(0).toFixed(1) + ',' + f.y(0).toFixed(1) + FR[sel].F.map(function (v, i) { return 'L' + f.x(i).toFixed(1) + ',' + f.y(v).toFixed(1); }).join('') + 'L' + f.x(years.length - 1).toFixed(1) + ',' + f.y(0).toFixed(1) + 'Z';
    el('path', { d: area, fill: 'var(--ai-wash)' }, svg);
    ['low', 'central', 'high'].forEach(function (k) { if (k !== sel) el('path', { d: line(FR[k].F), fill: 'none', stroke: COL[k], 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg); });
    el('path', { d: line(FR[sel].F26), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 1.5, 'stroke-dasharray': '1.5 3', 'stroke-linecap': 'round' }, svg);
    el('path', { d: line(FR[sel].F), fill: 'none', stroke: COL[sel], 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
    var li = years.length - 1, ends = ['low', 'central', 'high'].map(function (k) { return [k, f.y(FR[k].F[li])]; }).sort(function (a, b) { return a[1] - b[1]; });
    var lastY = -1e9; ends.forEach(function (e) { var y = Math.max(e[1] + 4, lastY + 12); lastY = y; tx(svg, f.x(li) + 7, y, bn0(FR[e[0]].F[li]), e[0] === sel ? 'lab' : ''); });
    legend($('#lg-fund'), ['low', 'central', 'high'].map(function (k) { return { type: 'line', color: COL[k], dash: k !== sel, label: NAME[k] + ' (' + pct(100 * FR[k].rate, 2) + ')' + (k === sel ? ', chosen (solid)' : ' (dashed)') }; })
      .concat([{ type: 'line', color: 'var(--ink-2)', dash: true, label: 'Chosen, in 2026 dollars (dotted)' }]));
    hover(cont, svg, f, years.length, f.x, function (i) {
      return { title: years[i], rows: ['low', 'central', 'high'].map(function (k) { return { color: COL[k], label: NAME[k], value: bn(FR[k].F[i]) }; }).concat([{ color: 'var(--ink-2)', label: 'Chosen, 2026 A$', value: bn(FR[sel].F26[i]) }]) };
    });
    var p = r.perp, w = 'The fund receives the wealth tax, net of the income tax it costs, to its last year in 2038-39, and the other taxes’ surpluses. It pays out ' + pct(100 * r.P.payout, 2) + ' of its average balance a year. ';
    if (r.opt.key === 'v') w = 'With no wealth tax the fund receives only the other taxes’ surpluses, from ' + (r.s1.repaid || 'the first surplus year') + '. It pays out ' + pct(100 * r.P.payout, 2) + ' of its average balance a year. ';
    w += p.F26_2085 === null ? '' : r.s1.exhaust ? 'After the never-cut guarantee lapses in ' + r.s1.lapse + ' the income tax the wealth tax costs is charged to the fund’s capital, and the fund runs out in ' + r.s1.exhaust + '.' :
      p.F26_2085 >= p.F26_2045 - 0.5 ? 'At this payout its real value holds: ' + bn(p.F26_2085) + ' in 2026 dollars by 2085-86 against ' + bn(p.F26_2045) + ' in 2045-46.' : 'At this payout its real value falls after 2045-46, to ' + bn(p.F26_2085) + ' in 2026 dollars by 2085-86.';
    $('#why-fund').textContent = w;
    table($('#tb-fund'), ['Year'].concat(['low', 'central', 'high'].map(function (k) { return NAME[k] + ' (A$bn)'; })).concat(['Chosen, 2026 A$bn']),
      years.map(function (fy, i) { return [fy].concat(['low', 'central', 'high'].map(function (k) { return nf1.format(FR[k].F[i]); })).concat([nf1.format(FR[sel].F26[i])]); }), { caption: 'Fund balance by year under three returns', hideCaption: true });
  }
  function drawWT(r) {
    var W = r.wtLife, data = W.rows, years = data.map(function (d) { return d.fy; }), cont = $('#ch-wt');
    if (r.opt.nowt) {
      cont.innerHTML = ''; $('#lg-wt').innerHTML = ''; $('#tb-wt').innerHTML = '';
      $('#why-wt').textContent = 'This option has no wealth tax, so there is no lost income tax for anyone to carry and no top-up to levy for it. Choose option (i) to see the wealth tax over its life.';
      return;
    }
    var lo = 0, hi = 0; data.forEach(function (d) { lo = Math.min(lo, d.line, d.net); hi = Math.max(hi, d.wt + d.topup); });
    var f = frameYears(cont, years, lo * 1.1, hi * 1.08, { bands: [{ i0: 0, i1: 17, label: 'Modelled' }, { i0: 18, i1: data.length - 1, label: 'Projected' }],
      aria: 'Wealth tax, the income tax it costs, its net revenue and the never-cut top-ups by year', yUnit: 'A$ billion', r: 50 });
    var svg = f.svg, cw = Math.max(3, Math.min(16, f.bw * 0.62)), hp = hatch(svg, 'hatch-top2', 'var(--s3)');
    data.forEach(function (d, i) {
      var x = f.x(i) - cw / 2;
      if (d.wt > 0.02) el('path', { d: colPath(x, f.y(0), f.y(d.wt), cw), fill: 'var(--ai)' }, svg);
      if (d.topup > 0.02) el('path', { d: colPath(x, f.y(d.wt) - (d.wt > 0.02 ? 1.5 : 0), f.y(d.wt + d.topup), cw), fill: hp, stroke: 'var(--s3)', 'stroke-width': 1 }, svg);
      if (d.line < -0.02) el('path', { d: colPath(x, f.y(0), f.y(d.line), cw), fill: 'var(--loss)' }, svg);
    });
    el('path', { d: data.map(function (d, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(d.net).toFixed(1); }).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    var li = data.length - 1;
    tx(svg, f.x(li) + cw / 2 + 4, f.y(data[li].net) + 4, bn0(data[li].net), 'lab');
    if (data[li].topup > 0.05) tx(svg, f.x(li) + cw / 2 + 4, f.y(data[li].topup) + 4, bn0(data[li].topup), '');
    legend($('#lg-wt'), [{ type: 'rect', color: 'var(--ai)', label: 'Wealth tax, to the fund (above zero)' }, { type: 'rect', color: 'var(--loss)', label: 'Income tax it costs, PBO (below zero)' },
      { type: 'line', color: 'var(--ink)', label: 'Net to the fund (line)' }, { type: 'hatch', cls: 'top', label: 'Levied: top-ups, then the loss itself (hatched)' }]);
    hover(cont, svg, f, data.length, f.x, function (i) {
      var d = data[i];
      return { title: d.fy + (i > 17 ? ' (projected)' : ''), rows: [{ color: 'var(--ai)', label: 'Wealth tax', value: bn(d.wt), kind: 'rect' }, { color: 'var(--loss)', label: 'Income tax it costs', value: bn(d.line, true), kind: 'rect' },
        { color: 'var(--ink)', label: 'Net to the fund', value: bn(d.net, true) }, { color: '', label: 'Met from the dividend account', value: bn(d.wdef) }, { color: '', label: 'Charged to the fund’s capital', value: bn(d.capital) },
        { color: 'var(--s3)', label: 'Levied', value: bn(d.topup), kind: 'rect' }] };
    });
    var l46 = data[17].line, l65 = data[Math.min(37, li)].line, s1 = r.s1;
    $('#why-wt').textContent = 'The wealth tax raises ' + bn(W.gross) + ' over its life to 2038-39. The income tax it costs, which the PBO costs year by year (ECR-2025-3901), starts small, ' +
      (W.firstNeg ? 'exceeds the tax in ' + W.firstNeg : 'stays below the tax to 2045-46') + ' and grows with GDP after the tax ends: ' + bn(-l46) + ' in 2045-46 and ' + bn(-l65) + ' by 2065-66. The fund bears it every year. Once its net inflow turns negative the dividend account pays it. A levy then tops the account up so the dividend is not cut' +
      (s1.lapse ? (s1.topups > 0.05 ? ' (' + bn(s1.topups) + ')' : '') + ' until ' + s1.lapse + '. In that year the top-up needed would pass a quarter of the dividend, so the guarantee lapses. From then the loss is charged to the fund’s capital' + (s1.exhaust ? ' until the fund runs out in ' + s1.exhaust + ', and the levy bears it after that (' + bn(s1.postLevy) + ' to 2085-86). ' : '. ') : ': ' + bn(s1.topups) + ' to 2045-46. ') +
      (W.pvAll === null ? 'The loss grows faster than the fund earns, so the tax has no finite net present value.' : 'In present value at the fund’s return, counting that loss for ever, the tax raises ' + bn(W.pvAll) + ' net.') +
      ' After 2045-46 the projection has no wealth tax, the excess profits tax growing with GDP and the fund paying out ' + pct(100 * r.P.payout, 2) + ' a year.';
    table($('#tb-wt'), ['Year', 'Wealth tax (A$bn)', 'Income tax it costs (A$bn)', 'Net to the fund (A$bn)', 'Met from the dividend account (A$bn)', 'Charged to the fund’s capital (A$bn)', 'Levied (A$bn)'],
      data.map(function (d) { return [d.fy, nf1.format(d.wt), nf1.format(d.line), nf1.format(d.net), nf1.format(d.wdef), nf1.format(d.capital), nf1.format(d.topup)]; }), { caption: 'The wealth tax over its life', hideCaption: true });
  }
  function drawCost(r) {
    var rows = r.path.rows, pre = r.pre;
    var data = pre.map(function (p) { return { fy: p.fy, net: p.impl, dur: 0, div: 0, adv: 0, draw: 0, rise: 0, levy: 0, topup: 0, borrow: 0 }; })
      .concat(rows.map(function (x) { return { fy: x.fy, net: x.net, dur: x.dur, div: x.div, adv: x.adv, draw: x.draw, rise: x.rise, levy: x.levyRev - (x.topup || 0), topup: x.topup || 0, borrow: x.borrow, stage: x.stage, key: x.key }; }));
    var SEG = [['dur', 'var(--fund)', 'Other taxes (durable)'], ['div', 'var(--ai)', 'Dividend paid by the fund'], ['adv', 'var(--s1)', 'Borrowing (start-up advance)'],
      ['draw', 'hatch-draw', 'Reserve (hatched)'], ['rise', 'var(--accent)', 'Rate-rise revenue'], ['levy', 'var(--s3)', 'Levy for the other taxes’ gap (shortfall)'], ['topup', 'hatch-top', 'Levy topping up the dividend (hatched)'], ['borrow', 'var(--loss)', 'Borrowed (shortfall)']];
    var has = {}; SEG.forEach(function (sg) { has[sg[0]] = data.some(function (d) { return d[sg[0]] > 0.05; }); });
    var hi = 0; data.forEach(function (d) { hi = Math.max(hi, d.net, SEG.reduce(function (a, sg) { return a + Math.max(0, d[sg[0]]); }, 0)); });
    var f = frameYears($('#ch-cost'), data.map(function (d) { return d.fy; }), 0, hi * 1.04, { bands: stageBands(rows, pre.length), aria: 'Net cost against funding by year', yUnit: 'A$ billion', r: 54 });
    var svg = f.svg, cw = Math.min(24, f.bw * 0.66), gap = 2;
    var FILL = { 'hatch-draw': hatch(svg, 'hatch-draw', 'var(--ai)'), 'hatch-top': hatch(svg, 'hatch-top', 'var(--s3)') }, HATCH = { draw: 'var(--ai)', topup: 'var(--s3)' };
    data.forEach(function (d, i) {
      var x = f.x(i) - cw / 2, base = 0, tops = SEG.filter(function (sg) { return d[sg[0]] > 0.02; });
      tops.forEach(function (sg) {
        var y0 = f.y(base) - (base > 0 ? gap : 0), y1 = f.y(base + d[sg[0]]);
        if (y0 - y1 > 0.5) el('path', Object.assign({ d: colPath(x, y0, y1, cw), fill: FILL[sg[1]] || sg[1] }, HATCH[sg[0]] ? { stroke: HATCH[sg[0]], 'stroke-width': 1 } : {}), svg);
        base += d[sg[0]];
      });
    });
    el('path', { d: data.map(function (d, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(d.net).toFixed(1); }).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    var li = data.length - 1;
    el('circle', { cx: f.x(li), cy: f.y(data[li].net), r: 4.5, fill: 'var(--ink)', stroke: '#fff', 'stroke-width': 2 }, svg);
    tx(svg, f.x(li) + 8, f.y(data[li].net) + 4, bn0(data[li].net), 'lab');
    var lg = [{ type: 'line', color: 'var(--ink)', label: 'Net cost including set-up (line)' }];
    SEG.forEach(function (sg) { if (has[sg[0]]) lg.push({ type: HATCH[sg[0]] ? 'hatch' : 'rect', cls: sg[0] === 'topup' ? 'top' : '', color: sg[1], label: sg[2] }); });
    legend($('#lg-cost'), lg);
    hover($('#ch-cost'), svg, f, data.length, f.x, function (i) {
      var d = data[i], rr = [{ color: 'var(--ink)', label: 'Net cost', value: bn(d.net) }];
      SEG.forEach(function (sg) { if (has[sg[0]]) rr.push({ color: HATCH[sg[0]] || sg[1], label: sg[2], value: bn(d[sg[0]]), kind: 'rect' }); });
      return { title: d.fy, rows: rr };
    });
    var why = $('#why-cost'); why.innerHTML = '';
    var brw = data.filter(function (d) { return d.borrow > 0.05; }), lvy = data.filter(function (d) { return d.levy > 0.05; }), txt = [];
    if (rows.every(function (x) { return x.stage === 1; })) {
      txt.push('In 2028-29 the other taxes fall short before the excess profits tax reaches full yield, so the Budget borrows ' + bn(r.s1.advance) + ' (an advance), repaid from the next surpluses' + (r.s1.repaid ? ' by ' + r.s1.repaid : '') + '.' + (r.opt.durable ? ' Later surpluses reduce debt.' : ' Later surpluses go to the fund.'));
      if (lvy.length) txt.push('From ' + lvy[0].fy + ' the floor and the child payment, which rise with wages, cost more than the other taxes raise. That shortfall is met by a levy sized to the gap.');
      var tps = data.filter(function (d) { return d.topup > 0.05; });
      if (tps.length) txt.push('From ' + tps[0].fy + ' the levy also tops up the dividend account, which carries the income tax the wealth tax costs: ' + bn(r.s1.topups) + ' to 2045-46.');
    } else txt.push('The later stages cost several times what the taxes and the dividend raise. The rate rise covers most of the gap, sized on each stage’s worst year, and a levy meets what is left.');
    if (brw.length) mk('span', 'lossword', 'Shortfall borrowed in ' + brw.length + (brw.length === 1 ? ' year' : ' years') + ' from ' + brw[0].fy + '. ', why);
    why.appendChild(document.createTextNode(txt.join(' ')));
    table($('#tb-cost'), ['Year', 'Net cost', 'Other taxes', 'Dividend', 'Borrowing (advance)', 'Reserve', 'Rate rise', 'Levy, other taxes’ gap', 'Levy, dividend top-up', 'Borrowed'],
      data.map(function (d) { return [d.fy, bn(d.net), bn(d.dur), bn(d.div), bn(d.adv), bn(d.draw), bn(d.rise), bn(d.levy), bn(d.topup), bn(d.borrow)]; }), { caption: 'Net cost and funding by year, A$ billion, ' + data[0].fy + ' to ' + data[li].fy, hideCaption: true });
  }
  function drawBal(r) {
    var rows = r.path.rows, cont = $('#ch-bal');
    var narrow = chartWidth(cont) < 560, years = rows.map(function (x) { return x.fy; });
    function panel(title, series, fmtY, aria, unit) {
      var wrap = mk('div', 'bal-panel' + (narrow ? ' narrow' : ''), null, cont);
      mk('p', 'fig-unit', title, wrap);
      var box = mk('div', 'chart', null, wrap);
      var lo = 0, hi = 0; series.forEach(function (s) { rows.forEach(function (x) { lo = Math.min(lo, x[s.key]); hi = Math.max(hi, x[s.key]); }); });
      var f = frameYears(box, years, lo, hi, { h: 250, fmtY: fmtY, aria: aria, yUnit: unit, r: 46 });
      var lastY = -1e9;
      series.map(function (s) { return [s, f.y(rows[rows.length - 1][s.key])]; }).sort(function (a, b) { return a[1] - b[1]; }).forEach(function (e) {
        var s = e[0];
        el('path', Object.assign({ d: rows.map(function (x, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(x[s.key]).toFixed(1); }).join(''), fill: 'none', stroke: s.color, 'stroke-width': 2 }, s.dash ? { 'stroke-dasharray': '5 3' } : {}), f.svg);
        var y = Math.max(e[1] + 4, lastY + 12); lastY = y; tx(f.svg, f.x(rows.length - 1) + 7, y, fmtY(rows[rows.length - 1][s.key]), s.main ? 'lab' : '');
      });
      hover(box, f.svg, f, rows.length, f.x, function (i) { return { title: years[i], rows: series.map(function (s) { return { color: s.color, label: s.label, value: s.fmt(rows[i][s.key]) }; }) }; });
    }
    panel('Cash balance, % of GDP', [{ key: 'ucb', color: 'var(--accent)', label: 'With the payment', fmt: function (v) { return pct(v); }, main: true }, { key: 'ucbEarn', color: 'var(--ai)', label: 'Counting the fund’s earnings', fmt: function (v) { return pct(v); }, dash: true },
      { key: 'ucb_base', color: 'var(--fund)', label: 'Budget baseline', fmt: function (v) { return pct(v); } }],
      function (v) { return nf1.format(v); }, 'Cash balance against the Budget baseline, with and without the fund’s earnings', '% of GDP');
    panel('Against baseline, A$bn', [{ key: 'nfwBn', color: 'var(--gain)', label: 'Net financial worth', fmt: function (v) { return bn0(v, true); }, main: true }, { key: 'ndBn', color: 'var(--loss)', label: 'Net debt', fmt: function (v) { return bn0(v, true); }, dash: true }],
      function (v) { return nf0.format(v); }, 'Net financial worth and net debt against the Budget baseline', 'A$ billion');
    legend($('#lg-bal'), [{ type: 'line', color: 'var(--accent)', label: 'Cash balance with the payment (solid)' }, { type: 'line', color: 'var(--ai)', label: 'Same, counting the fund’s earnings (dashed)', dash: true }, { type: 'line', color: 'var(--fund)', label: 'Budget baseline (solid)' },
      { type: 'line', color: 'var(--gain)', label: 'Net financial worth vs baseline (solid)' }, { type: 'line', color: 'var(--loss)', label: 'Net debt vs baseline (dashed)', dash: true }]);
    var bad = rows.filter(function (x) { return x.ucbBn < -0.05; })[0], lr = rows[rows.length - 1];
    $('#why-bal').textContent = 'The fund is treated as the Future Fund is: its earnings sit outside the cash balance, net debt counts only its cash and credit (13.5%), and net financial worth counts all of it. ' +
      (bad ? 'The cash balance is better than baseline while the wealth tax is banked and worse from ' + bad.fy + ', when the dividend is paid out of earnings the cash balance does not count. ' : 'The cash balance stays better than baseline in every year. ') +
      'Finance has said Future Fund earnings would count once the fund pays for recurrent costs, but not which earnings. Counting all of them (dashed), the balance is ' + bn(Math.abs(lr.ucbBn + lr.earn)) + (lr.ucbBn + lr.earn < 0 ? ' worse' : ' better') + ' than baseline in ' + lr.fy +
      '; counting only the payout, ' + (Math.abs(lr.ucbBn + lr.pomv) < 0.05 ? 'level with it' : bn(Math.abs(lr.ucbBn + lr.pomv)) + (lr.ucbBn + lr.pomv < 0 ? ' worse' : ' better')) + '. Net debt and net financial worth do not change.';
    table($('#tb-bal'), ['Year', 'Cash balance, baseline (% GDP)', 'Cash balance, with', 'Counting the fund’s earnings', 'Cash balance vs baseline (A$bn)', 'Counting the fund’s earnings (A$bn)', 'Net debt vs baseline (A$bn)', 'Net financial worth vs baseline (A$bn)'],
      rows.map(function (x) { return [x.fy, nf1.format(x.ucb_base), nf1.format(x.ucb), nf1.format(x.ucbEarn), bn(x.ucbBn, true), bn(x.ucbBn + x.earn, true), bn0(x.ndBn, true), bn0(x.nfwBn, true)]; }), { signed: true, caption: 'Budget against the Budget baseline by year', hideCaption: true });
  }
  function drawRise(r) {
    renderStress(r);
    var own = r.path.rows.some(function (x) { return x.rate > 0 || x.levyRev > 0.005; }), src = own ? r.path : r.pathB, cont = $('#ch-rise');
    if (!src) {
      cont.innerHTML = ''; $('#lg-rise').innerHTML = ''; $('#tb-rise').innerHTML = '';
      $('#h-rise').textContent = 'Tax change by year';
      $('#why-rise').textContent = 'No income-tax rise or levy in any year on this path, and no rate rise funds Stages 2 and 3 at these settings.';
      return;
    }
    var rows = src.rows;
    $('#h-rise').textContent = own ? 'Tax change by year' : 'Tax change by year, if Stages 2 and 3 are triggered';
    var data = rows.map(function (x) { return { fy: x.fy, rate: 100 * x.rate, levy: 100 * x.levy, capped: x.capped, lr: x.levyRev }; });
    var hi = 0.05; data.forEach(function (d) { hi = Math.max(hi, d.rate, d.levy); });
    var small = hi < 1;
    var f = frameYears(cont, data.map(function (d) { return d.fy; }), 0, hi * 1.15, { bands: stageBands(rows, 0), fmtY: function (v) { return small ? String(+v.toFixed(3)) : nf0.format(v); }, aria: 'Rate rise and levy by year', yUnit: 'Points, or % of market income', r: 44 });
    var svg = f.svg, cw = Math.min(18, f.bw * 0.55);
    data.forEach(function (d, i) { if (d.levy > 0.0005) el('path', { d: colPath(f.x(i) - cw / 2, f.y(0), f.y(d.levy), cw), fill: d.capped ? 'var(--loss)' : 'var(--s3)' }, svg); });
    if (data.some(function (d) { return d.rate > 0; })) {
      var pth = '', prev = null;
      data.forEach(function (d, i) { var x0 = f.l + i * f.bw, x1 = x0 + f.bw, y = f.y(d.rate); pth += (i ? (prev !== y ? 'L' + x0.toFixed(1) + ',' + y.toFixed(1) : '') : 'M' + x0.toFixed(1) + ',' + y.toFixed(1)) + 'L' + x1.toFixed(1) + ',' + y.toFixed(1); prev = y; });
      el('path', { d: pth, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5 }, svg);
      var ld = data[data.length - 1]; if (ld.rate > 0) tx(svg, f.w - f.r + 4, f.y(ld.rate) + 4, nf1.format(ld.rate), 'lab');
    } else { var lv = data[data.length - 1]; if (lv.levy > 0) tx(svg, f.x(data.length - 1) + cw / 2 + 3, f.y(lv.levy) + 4, lv.levy.toFixed(2) + '%', 'lab'); }
    var lg = [];
    if (data.some(function (d) { return d.rate > 0; })) lg.push({ type: 'line', color: 'var(--accent)', label: 'Rate rise legislated, points on every income-tax rate (line)' });
    if (data.some(function (d) { return d.levy > 0.0005; })) lg.push({ type: 'rect', color: 'var(--s3)', label: 'Levy, % of market income (columns)' });
    if (data.some(function (d) { return d.capped; })) lg.push({ type: 'rect', color: 'var(--loss)', label: 'Levy at its cap, the rest borrowed' });
    legend($('#lg-rise'), lg);
    hover(cont, svg, f, data.length, f.x, function (i) {
      var d = data[i];
      return { title: d.fy, rows: [{ color: 'var(--accent)', label: 'Rate rise', value: nf1.format(d.rate) + ' points' }, { color: 'var(--s3)', label: 'Levy', value: pct(d.levy, 3) + (d.lr > 0.005 ? ' (' + bn(d.lr) + ')' : ''), kind: 'rect' }] };
    });
    var lvs = data.filter(function (d) { return d.levy > 0.0005; });
    $('#why-rise').textContent = (own ? '' : 'On this path no tax rises. If the later stages were triggered at their earliest dates: ') +
      (src.rows.some(function (x) { return x.stage > 1; }) ? 'each stage gets one rise, sized on its worst year and rounded up to 0.1 point, so that it covers the cost under both forms of the taxpayer response. ' : '') +
      (lvs.length ? 'The levy is set each year to the gap and never above it: ' + pct(lvs[0].levy, 3) + ' in ' + lvs[0].fy + (lvs.length > 1 ? ', ' + pct(lvs[lvs.length - 1].levy, 3) + ' in ' + lvs[lvs.length - 1].fy : '') + (own && r.s1.topups > 0.05 ? ', including the top-ups that keep the dividend from being cut' : '') + '.' : '');
    table($('#tb-rise'), ['Year', 'Rate rise (points)', 'Levy (% of market income)', 'Levy (A$bn)'], data.map(function (d) { return [d.fy, nf1.format(d.rate), d.levy > 0.0005 ? d.levy.toFixed(3) : '0', d.lr > 0.005 ? nf1.format(d.lr) : '0']; }), { caption: 'Rate rise and levy by year', hideCaption: true });
  }
  function renderStress(r) {
    var des = designKey(r);
    if (des !== 'p1') return renderStressDesign(r, des);
    var host = $('#stress-rise'), S = X4.stress; host.innerHTML = '';
    mk('h4', null, 'Stage 1’s levy under stress, with no dividend', host);
    var c = S[0], find = function (re) { return S.filter(function (x) { return re.test(x.case); })[0]; }, lo80 = find(/80%/), hi = S[1], sup = find(/^Superannuation measure/), lit = find(/^Safeguard read literally/);
    mk('p', 'why', 'At the paper’s settings, Stage 1 with no dividend needs a levy from ' + c.first + ' (' + bn(c.levies) + ' to 2045-46, peaking at ' + pct(c.peak_pct, 2) + ' of market income). If fuel and minerals revenue grew with GDP, it would start in ' + hi.first + ' (' + bn(hi.levies) + '). ' +
      'If the five taxes yield 80% of their costings the levy starts in ' + lo80.first + ' and reaches ' + pct(lo80.peak_pct, 2) + ' (' + bn(lo80.levies) + ' to 2045-46). The taxes must yield ' + pct(100 * X4.be_yield, 1) + ' of their costings for no levy before ' + c.first + '.' +
      (sup ? ' If the superannuation measure raised half its costing (a test of its overlap with Division 296), the levy would start in ' + sup.first + ' and peak at ' + pct(sup.peak_pct, 2) + ' (' + bn(sup.levies) + ').' : '') +
      (lit ? ' The model draws on the surpluses the other taxes have kept before any levy. If the safeguard were read literally, levying each year’s shortfall and leaving those surpluses untouched, the levy would start in ' + lit.first + ' (' + bn(lit.levies) + ', peaking at ' + pct(lit.peak_pct, 2) + ').' : '') +
      (r.opt.key === 'none' ? '' : ' The chart above follows the option you chose.'), host);
    var det = mk('details', 'tview', null, host); if (r.opt.key === 'none') det.open = true;
    mk('summary', null, 'All the stress cases (paper’s Table F4-106)', det);
    var w = mk('div', null, null, det);
    table(w, ['Case', 'First levy', 'Levies to 2045-46 (A$bn)', 'Peak levy (% of market income)', 'First levy, borrowing repaid over five years', 'Levies, five-year rule (A$bn)'],
      S.map(function (x) { return [x.case.replace(/, round \d+\)/, ')').replace(/ \(round \d+\)$/, '').replace(/ \(a noise check\)$/, ', a check on the fit'), x.first || 'none', nf1.format(x.levies), x.peak_pct.toFixed(2), x.five_year_rule.first || 'none', nf1.format(x.five_year_rule.levies)]; }), { caption: 'Stage 1’s levy under stress, with no dividend', hideCaption: true, ro: 'eco-stress', roLabel: 'Stage 1’s levy under stress, with no dividend', roFixed: true });
  }
  // Table B15: the chosen design under the stress cases, Part 1 beside it
  function renderStressDesign(r, des) {
    var host = $('#stress-rise'), S = OB.sens[des], S1 = OB.sens.p1; host.innerHTML = '';
    var nm = cap(DESIGN_SHORT[des]), f = function (x) { return x.first || 'none'; }, find = function (re) { return S.filter(function (x) { return re.test(x.case); })[0]; };
    var c = S[0], lo80 = find(/80% of the costings/), hi = find(/^High case/);
    mk('h4', null, nm + '’s levy under stress, with no dividend', host);
    mk('p', 'why', 'At the paper’s settings, ' + DESIGN_SHORT[des] + ' needs a levy from ' + f(c) + ' (' + bn(c.total) + ' to 2045-46, peaking at ' + pct(100 * c.peak_rate, 2) + ' of market income). If fuel and minerals revenue grew with GDP, from ' + f(hi) + ' (' + bn(hi.total) + '). If the five taxes yield 80% of their costings, from ' + f(lo80) + ', reaching ' + pct(100 * lo80.peak_rate, 2) + ' (' + bn(lo80.total) + ' to 2045-46). The taxes must yield ' + pct(OB.beYield[des], 1) + ' of their costings for no levy before 2044-45, against ' + pct(OB.beYield.p1, 1) + ' for Part 1. The option B model’s Table B15; provisional.', host);
    var det = mk('details', 'tview', null, host);
    mk('summary', null, 'All the stress cases (Table B15), with Part 1 for comparison', det);
    var w = mk('div', null, null, det);
    table(w, ['Case', nm + ': first levy', nm + ': levies to 2045-46 (A$bn)', nm + ': largest levy (% of market income)', 'Part 1: first levy; levies (A$bn); largest (%)'],
      S.map(function (x, i) { var p = S1[i]; return [x.case.replace(/ \(a noise check\)$/, ', a check on the fit'), f(x), nf1.format(x.total), (100 * x.peak_rate).toFixed(2), f(p) + '; ' + nf1.format(p.total) + '; ' + (100 * p.peak_rate).toFixed(2)]; }),
      { caption: nm + '’s levy under stress', hideCaption: true, ro: 'eco-stress', roLabel: 'The levy under stress', roFixed: true });
    var sw = $('#stress-rise .bw-table-wrap'); if (sw) prov(sw);
  }
  function renderDesigns(r) {
    var ks = ['pstar', 'pkg', 'p1'], W = OB.want, nm = { pstar: 'P* (recommended)', pkg: 'Targeted package (Parliament’s alternative)', p1: 'Part 1 as printed on 22 October' };
    var sm = function (k) { return k === 'p1' ? W.p1.hh : W[k].hh; }, smh = function (k) { return k === 'p1' ? W.p1.hh : W[k].cf; }, T7 = OB.table57;
    var row = function (lab, fn) { return [lab].concat(ks.map(fn)); };
    table($('#tb-designs'), ['At Part 1’s cost in 2028-29', nm.pstar, nm.pkg, nm.p1], [
      row('Net cost 2028-29 / 2045-46 (A$bn)', function (k) { var n = k === 'p1' ? W.p1.net : W[k].net; return bn(n['2028-29']) + ' / ' + bn(n['2045-46']); }),
      row('Borrowing in 2028-29 (A$bn), repaid by 30 June', function (k) { return bn(sm(k).advance) + ', ' + (+sm(k).repaid.slice(0, 4) + 1); }),
      row('First levy (on the fiscal model’s Rent Assistance path)', function (k) { return (sm(k).first || 'none') + (k !== 'p1' ? ' (' + (smh(k).first || 'none') + ')' : ''); }),
      row('Levies to 2045-46 (A$bn)', function (k) { return bn(sm(k).total) + (k !== 'p1' ? ' (' + bn(smh(k).total) + ')' : ''); }),
      row('Chance of a levy before 2044-45 / 2034-35 (joint stress test)', function (k) { return pct(100 * OB.stress[k].before44, 0) + ' / ' + pct(100 * OB.stress[k].before34, 0); }),
      row('Poverty after housing costs, relative line (%)', function (k) { return nf1.format(OB.poverty[k].rel); }),
      row('Children under 15 in poverty (%)', function (k) { return nf1.format(OB.poverty[k].u15); }),
      row('People in poverty (million)', function (k) { return OB.poverty[k].n.toFixed(2); }),
      row('Adults better off before / after the funding taxes, by A$5 a week (%)', function (k) { return pct(OB.reach[k].adults.before_5pw, 0) + ' / ' + pct(OB.reach[k].adults.after_5pw, 0); }),
      row('Households on payments worse off after housing costs (million)', function (k) { return nf1.format(OB.losers[k].hh); }),
      row('Higher earners in families with children at an effective marginal tax rate of 50% or more (%)', function (k) { return nf1.format(T7.emtr50[k]); }),
      row('Second earners: mean participation tax rate (%; ' + nf1.format(T7.ptrMean.cur) + ' under current rules)', function (k) { return nf1.format(T7.ptrMean[k]); }),
      row('Second earners: participation tax rate 40% or more / 60% or more (%)', function (k) { return nf1.format(T7.ptr40[k]) + ' / ' + nf1.format(T7.ptr60[k]); }),
      row('First-year net benefit, complete accounting (A$bn)', function (k) { return bn(OB.appraisal[k].nb[0]) + ' to ' + bn(OB.appraisal[k].nb[1]); })],
      { stacked: 'wide', text: true, caption: 'Three designs for Stage 1 at the same cost', hideCaption: true, ro: 'eco-designs', roLabel: 'Three designs for Stage 1 at the same cost', roFixed: true });
    var w = $('#tb-designs .bw-table-wrap'); if (w) prov(w);
    $('#why-designs').textContent = 'P* is the paper’s choice among three designs of equal cost, weighing poverty against work incentives and fiscal sustainability. The targeted package cuts poverty most (' + nf1.format(OB.poverty.pkg.rel) + '% against ' + nf1.format(OB.poverty.pstar.rel) + '% for P* and ' + nf1.format(OB.poverty.p1.rel) + '% for Part 1). It also leaves fewer second and higher earners on high effective tax rates: a ' + nf1.format(T7.ptrMean.pkg) + '% against ' + nf1.format(T7.ptrMean.pstar) + '% mean participation tax rate, and ' + nf1.format(T7.emtr50.pkg) + '% against ' + nf1.format(T7.emtr50.pstar) + '% of higher earners at 50% or more, though more at 60% or more. But it needs far more levies: ' + bn(W.pkg.hh.total) + ' against ' + bn(W.pstar.hh.total) + ' to 2045-46, with a ' + pct(100 * OB.stress.pkg.before44, 0) + ' against ' + pct(100 * OB.stress.pstar.before44, 0) + ' chance of a levy before 2044-45. P* leaves 0.2 million fewer people in poverty than Part 1 at the same cost. Net costs and levies use Rent Assistance on the household model’s rents, the paper’s central case; the fiscal model’s Rent Assistance path is in brackets. Work-incentive rows: the paper’s Table 5.7. These figures do not move with the levers.';
  }
  function renderZero() {
    var Z = OB.zero, C = OB.costOfPoverty; if (!Z || !C) return;
    var rg = function (a) { return bn(a[0]) + ' to ' + bn(a[2]); }, pg = function (a) { return nf2.format(a[0]) + '% to ' + nf2.format(a[2]) + '%'; };
    var rows = [['Pay each household in poverty exactly its gap to the line', 'A_cur', ''], ['The same, on top of P*', 'A_star', ' more than P*'],
      ['The same, for families with children under 15 only', 'K_cur', ''], ['The same for families with children, on top of P*', 'K_star', ' more than P*'],
      ['A top-up that withdraws 50 cents for each dollar of income', 'B_cur', '']];
    var body = rows.map(function (x) { var d = Z.d[x[1]]; return [x[0], nf2.format(d.paid), rg(d.total) + x[2], pg(d.gdp), nf1.format(d.poor)]; });
    var c = Z.d.C_cur;
    body.push(['A universal payment equal to the median income', nf2.format(c.paid), 'about A$' + nf0.format(Math.round(c.stat)) + 'bn, before tax and work effects', 'about ' + nf0.format(c.gdp[1]) + '%', nf1.format(c.poor)]);
    table($('#tb-zero'), ['Design', 'People in the households paid (million)', 'Cost a year, with the fall in work', 'Share of GDP', 'Poverty after (%)'], body,
      { stacked: 'wide', text: true, caption: 'Ending poverty: an illustration', hideCaption: true, ro: 'eco-zero', roLabel: 'Ending poverty: an illustration', roFixed: true });
    var w = $('#tb-zero .bw-table-wrap'); if (w) prov(w);
    $('#why-zero').textContent = 'Each design pays households enough to reach the poverty line that holds after the payment. Paying each household its exact gap costs less than P*, because it pays only people below the line, but it takes back a dollar for each dollar earned below the line, so work there pays nothing. A universal payment raises the median, and so the line, by half its own amount, so it must equal the whole median (A$' + nf0.format(Math.round(Z.lineC)) + ' a week for a single adult) before relative poverty ends. In practice measured poverty would not stay at zero: the line moves, ' + nf2.format(Z.neg) + ' million people have incomes below zero after housing costs, not everyone claims, and incomes are measured with error.';
    var k0 = function (x) { return 'A$' + nf0.format(Math.round(x / 1000) * 1000); };
    table($('#tb-cop'), ['The annual cost of poverty to Australia, 2028-29', 'Low', 'Central', 'High'], [
      ['Cost of each child in poverty, a year'].concat(C.perChild.map(k0)),
      ['Cost of child poverty, a year'].concat(C.child.map(function (x) { return bn(x); })),
      ['Cost of poverty at all ages, a year'].concat(C.total.map(function (x) { return bn(x); })),
      ['Share of GDP'].concat(C.pct.map(function (x) { return nf1.format(x) + '%'; })),
      ['For each person in poverty, a year'].concat(C.perPerson.map(k0))],
      { text: true, caption: 'The annual cost of poverty to Australia', hideCaption: true, ro: 'eco-cop', roLabel: 'The annual cost of poverty to Australia', roFixed: true });
    var w2 = $('#tb-cop .bw-table-wrap'); if (w2) prov(w2);
    $('#why-cop').textContent = 'The paper’s illustrative estimate of what poverty costs everyone else (Table 2.3): lower earnings and taxes, extra services and poorer health, scaled from the only Australian study, for New South Wales, whose figures need checking. The cost of each child is close to the lifetime cost of one year of a child’s poverty, not cash spent on each child each year. Most of it falls over decades, and only part returns to the Budget, so the paper does not count it as a saving.';
  }
  function renderAlt() {
    var A = X4.alt, C = [A.cur, A.p1, A.pkg_ie, A.star], Pr = A.price, f1 = function (v) { return nf1.format(v); };
    var row = function (lab, fn, noCur) { return [lab].concat(C.map(function (x, i) { return i === 0 && noCur ? '–' : fn(x); })); };
    var sg = function (v) { return (v > 0.049 ? '+' : v < -0.049 ? MINUS : '') + nf1.format(Math.abs(v)); };
    $('#why-alt-intro').textContent = 'Three designs for Stage 1 at the same cost (' + bn(A.budget) + ' in 2028-29). The 22 October paper proposed Part 1, the floor and the child payment. The revised recommendation is the last column: the same floor and child payment without the schedule that pays its supplement to middle-income families, with Rent Assistance 75% higher. The targeted package is Parliament’s alternative if it weights poverty above work incentives. ' +
      'The targeted package keeps Family Tax Benefit and adds A$' + nf0.format(A.pkg_ie.D) + ' a child to its Part A, an earned-income credit of up to A$5,000 and Rent Assistance 75% higher. ' +
      'The recommended design drops the schedule that pays the supplement to families above A$144,584, mostly with one child. All three keep the floor and the conditional pathway to Stages 2 and 3.';
    table($('#tb-alt'), ['At the same budget', 'Current rules', 'Part 1 (22 October design)', 'Targeted package (Parliament’s alternative)', 'P* as first printed (before its re-costing)'], [
      row('Poverty, relative line: all persons (%)', function (x) { return f1(x.rel); }),
      row('People in poverty (million)', function (x) { return x.n_rel.toFixed(2); }, true),
      row('Children under 15 (%)', function (x) { return f1(x.u15); }),
      row('People aged 67 and over (%)', function (x) { return f1(x.old); }),
      row('Sole-parent households (%)', function (x) { return f1(x.opf); }),
      row('People in households relying on the Disability Support Pension (%)', function (x) { return f1(x.dsp); }),
      row('Families with children gaining (%)', function (x) { return f1(x.fam); }, true),
      row('Households gaining (%)', function (x) { return f1(x.hh); }, true),
      row('Private renters gaining (%)', function (x) { return f1(x.rent); }, true),
      row('Families’ higher earner above a 50% marginal rate (%)', function (x) { return f1(x.over50); }),
      row('Families’ higher earner at a 60% marginal rate or more (%)', function (x) { return f1(x.ge60); }),
      row('Second earners’ mean participation tax rate (%)', function (x) { return f1(x.ptr); }),
      row('Net benefit against Part 1, complete accounting (A$bn a year)', function (x) { return x.nb ? sg(x.nb[0]) + ' to ' + sg(x.nb[1]) : '0'; }, true)], { caption: 'Three designs for Stage 1 at the same budget', hideCaption: true, ro: 'eco-alt', roLabel: 'Three designs for Stage 1 at the same budget', roFixed: true });
    $('#why-alt').textContent = 'Both alternatives leave fewer people in poverty than Part 1 in every group shown. The package reaches more households and private renters but fewer families with children. Its increment’s taper stacks on Family Tax Benefit’s, so ' +
      pct(A.pkg_ie.ge60, 1) + ' of families’ higher earners face 60% or more, against ' + pct(A.p1.ge60, 1) + ' under Part 1. Without its middle-income supplement Part 1 would do better on nearly every measure: ' +
      nf1.format(Pr.points) + ' points less poverty (' + Pr.people.toFixed(2) + ' million people) and ' + bn(-Pr.nb[1]) + ' to ' + bn(-Pr.nb[0]) + ' a year more net benefit. The price is ' + nf1.format(Pr.fam_reach) + ' points fewer families with children gaining, and slightly higher rates for second earners. ' +
      'The 22 October paper kept the supplement at that price; the revised recommendation drops it. Each design is charged its own taper responses and the 16 cent work response to its gain (for the package, on its increment only, so its advantage is a lower bound). Household model, current income, at the paper’s settings: these figures do not move with the levers.';
  }
  function drawDeciles(r) {
    var sel = $('#dec-year');
    if (sel.options.length !== r.path.rows.length) { sel.innerHTML = ''; r.path.rows.forEach(function (x) { var o = mk('option', null, x.fy, sel); o.value = x.fy; }); }
    sel.value = r.dist.fy;
    var ds = r.dist, dec = ds.deciles, row = r.path.rows.filter(function (x) { return x.fy === ds.fy; })[0];
    $('#dec-sub').textContent = (row.stage === 1 ? 'Stage 1' : row.stage === 2 ? 'Stage 2' : 'Stage 3') + ' in ' + ds.fy + (ds.fy === '2028-29' && row.stage === 1 ? ' (Stage 1 in full, the first dividend valued in 2028-29 dollars)' : '') + '. Average change per adult from the payment, tax changes, protections and child payment, before the funding taxes are allocated. ' +
      pct(100 * (r.dec5all ? r.dec5all.better : ds.better), 0) + ' of adults are better off and ' + pct(100 * (r.dec5all ? r.dec5all.worse : ds.worse), 0) + ' worse off, ' + (r.dec5all ? 'by more than A$5 a week.' : 'by any amount.');
    var lo = 0, hi = 0; dec.forEach(function (d) { lo = Math.min(lo, d.gain); hi = Math.max(hi, d.gain); });
    var cont = $('#ch-dec');
    var f = frameYears(cont, dec.map(function (d) { return String(d.decile); }), lo * 1.2, hi * 1.2,
      { fmtY: function (v) { return (v < 0 ? MINUS : '') + nf0.format(Math.abs(v) / 1000) + 'k'; }, aria: 'Average gain or loss per adult by income decile', yUnit: 'A$ a year per adult', xUnit: 'Income decile (1 lowest, 10 highest)', h: 280 });
    var svg = f.svg, cw = Math.min(28, f.bw * 0.6), hn = hatch(svg, 'hatch-neg', 'var(--loss)');
    Array.prototype.slice.call(svg.querySelectorAll('text')).forEach(function (t) { if (+t.getAttribute('y') === f.h - 24) t.remove(); });
    dec.forEach(function (d, i) { tx(svg, f.x(i), f.h - 24, String(d.decile), '', 'middle'); });
    dec.forEach(function (d, i) {
      if (Math.abs(d.gain) < 1) return;
      el('path', { d: colPath(f.x(i) - cw / 2, f.y(0), f.y(d.gain), cw), fill: d.gain > 0 ? 'var(--gain)' : hn, stroke: d.gain > 0 ? 'var(--gain)' : 'var(--loss)', 'stroke-width': 1 }, svg);
      if (f.bw >= 44) tx(svg, f.x(i), d.gain > 0 ? f.y(d.gain) - 5 : f.y(d.gain) + 14, aud(d.gain, true), 'lab', 'middle');
    });
    legend($('#lg-dec'), [{ type: 'rect', color: 'var(--gain)', label: 'Better off on average (solid, above zero)' }, { type: 'hatch', cls: 'neg', label: 'Worse off on average (hatched, below zero)' }]);
    hover(cont, svg, f, 10, f.x, function (i) {
      var d = dec[i];
      return { title: 'Decile ' + d.decile + ', average income ' + aud(d.pre), rows: [{ color: d.gain >= 0 ? 'var(--gain)' : 'var(--loss)', label: 'Average change', value: aud(d.gain, true), kind: 'rect' },
        { color: '', label: 'Better off', value: pct(100 * (r.dec5 ? r.dec5[i].better : d.better), 0) }, { color: '', label: 'Worse off', value: pct(100 * (r.dec5 ? r.dec5[i].worse : d.worse), 0) }] };
    });
    var thr = r.dec5 ? ' (by more than A$5 a week)' : ' (any amount)';
    table($('#tb-dec'), ['Decile', 'Average pre-reform income', 'Average change', 'Better off' + thr, 'Worse off' + thr],
      dec.map(function (d, i) { var x = r.dec5 ? r.dec5[i] : d; return [String(d.decile), aud(d.pre), aud(d.gain, true), pct(100 * x.better, 0), pct(100 * x.worse, 0)]; }), { signed: true, caption: 'Gains and losses by income decile in ' + ds.fy, hideCaption: true });
  }
  function drawPoverty(r) {
    var pv = r.poverty, cont = $('#ch-pov');
    var onPath = { 1: true, 2: r.path.rows.some(function (x) { return x.stage === 2; }), 3: r.path.rows.some(function (x) { return x.stage === 3; }) };
    var labels = ['Stage 1, ' + pv.years[0], 'Stage 2, ' + pv.years[1] + (onPath[2] ? '' : '*'), 'Stage 3, ' + pv.years[2] + (onPath[3] ? '' : '*')];
    var w = chartWidth(cont), rowH = 60, h = 3 * rowH + 50, l = w < 420 ? 112 : 128, rgt = 18;
    var svg = el('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': 'Household poverty before and with each stage (the table below has the same figures)' }, cont);
    var xmax = Math.max(16, Math.ceil(Math.max.apply(null, pv.base) / 2) * 2 + 2), X = function (v) { return l + (w - l - rgt) * v / xmax; };
    niceTicks(0, xmax, 4).forEach(function (t) { if (t > xmax) return; el('line', { x1: X(t), x2: X(t), y1: 6, y2: h - 38, class: t === 0 ? 'axis' : 'gridl' }, svg); tx(svg, X(t), h - 24, t + '%', '', 'middle'); });
    tx(svg, l + (w - l - rgt) / 2, h - 6, '% of people in poverty after housing costs', 'unit', 'middle');
    [0, 1, 2].forEach(function (i) {
      var cy = 18 + i * rowH + 12;
      tx(svg, 0, cy + 4, labels[i], 'blab');
      var b = pv.base[i], rl = pv.rel[i], an = pv.anch[i];
      el('line', { x1: X(Math.min(rl, an)), x2: X(b), y1: cy, y2: cy, stroke: 'var(--rule)', 'stroke-width': 3 }, svg);
      el('circle', { cx: X(b), cy: cy, r: 6, fill: '#fff', stroke: 'var(--ink-2)', 'stroke-width': 2 }, svg);
      el('rect', { x: X(an) - 5, y: cy - 5, width: 10, height: 10, fill: 'var(--accent)', stroke: '#fff', 'stroke-width': 1.5 }, svg);
      el('circle', { cx: X(rl), cy: cy, r: 6, fill: 'var(--ink)', stroke: '#fff', 'stroke-width': 2 }, svg);
      tx(svg, X(rl), cy - 10, pct(rl), 'lab', 'middle');
      tx(svg, X(b), cy + 19, pct(b), '', 'middle');
    });
    legend($('#lg-pov'), [{ type: 'ring', color: 'var(--ink-2)', label: 'Before (open circle)' }, { type: 'dot', color: 'var(--ink)', label: 'With the payment, relative line (filled circle)' }, { type: 'rect', color: 'var(--accent)', label: 'Anchored line (square)' }]);
    var figP = $('[data-ro="fig-household-poverty-by-stage"]'); if (figP) figP.setAttribute('data-ro-kind', pv.fixedS1 ? 'fixed' : 'interp');
    if (pv.fixedS1) {
      var dsP = r.design || 'pstar', p75 = OB.povRec075[dsP];
      $('#why-pov').textContent = 'Relative line: 50% of the median after the change, the ACOSS and UNSW measure; the anchored line holds the line at its old level. Stage 1 is the household model’s run for ' + DESIGN_SHORT[dsP] + ' at the recommended settings, so no lever moves it.' + (p75 ? ' With full-rate pensioners’ other income 25% lower (closest to DSS data), ' + pct(p75) + '.' : '') + ' Children: ' + pct(pv.child[0]) + ' (from ' + pct(pv.childBase) + '). Stages 2 and 3 are the paper’s figures at the rises they need.' + (!onPath[2] || !onPath[3] ? ' * Not on the chosen pathway: shown as if triggered.' : '');
    } else {
    var pz = pv.pens, notes = 'Relative line: 50% of the median after the change, the ACOSS and UNSW measure; the anchored line holds the line at its old level. Stage 1 is interpolated between household-model runs at your floor, so it is approximate between modelled points. The dividend moves it by less than 0.1 point at these sizes (' + (pv.divEffect >= 0 ? '+' : MINUS) + Math.abs(pv.divEffect).toFixed(2) + ' points here); without it, ' + pct(pv.noDiv.rel) + '. Children: ' + pct(pv.child[0]) + ' (from ' + pct(pv.childBase) + ')' + (pv.lag ? '; ' + nf1.format(pv.lag.rel[0]) + '% to ' + pct(pv.lag.rel[1]) + ' allowing for the 1.5-year assessment lag, a crude bound from the share of families whose income falls' : '') + '.' +
      (pz ? ' If full-rate pensioners have less other income than modelled, Stage 1 is higher: ' + pct(pz[1].rel) + ' with a quarter less (closest to DSS data), ' + pct(pz[2].rel) + ' with half; people aged 67 and over ' + pct(pz[0].old) + ' to ' + pct(pz[1].old) + '.' : '') + ' Stages 2 and 3 are the paper’s figures at the rises they need.';
    if (!onPath[2] || !onPath[3]) notes += ' * Not on the chosen pathway: shown as if triggered.';
    $('#why-pov').textContent = notes;
    }
    table($('#tb-pov'), ['Stage', 'Before', 'Relative line', 'Anchored line'], [0, 1, 2].map(function (i) { return [labels[i], pct(pv.base[i]), pct(pv.rel[i]), pct(pv.anch[i])]; }), { caption: 'Household poverty by stage', hideCaption: true });
  }
