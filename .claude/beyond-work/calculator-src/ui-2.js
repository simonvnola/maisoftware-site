
  // ---------- the lever rail (detailed mode; eight of its levers are moved into the simple list) ----------
  function mk(tag, cls, text, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function radio(name, id, text, checked) {
    var d = mk('div', 'radio'), inp = mk('input'); inp.type = 'radio'; inp.name = name; inp.id = id; setChecked(inp, checked);
    var l = mk('label', null, text); l.htmlFor = id; d.appendChild(inp); d.appendChild(l); return { div: d, input: inp };
  }
  function buildRail() {
    var old = $('#rail'); if (old) old.remove();
    var rail = mk('div', 'rail'); rail.id = 'rail'; rail.hidden = true;
    mk('h3', null, 'The model’s levers', rail);
    mk('p', 'rail-intro', 'Every lever in the paper’s model, grouped by the section of the paper it comes from. Each shows its recommended setting: the paper’s, with no dividend.', rail);
    LEVERS.forEach(function (g, gi) {
      var det = mk('details', 'grp'); det.open = gi === 0; det.id = 'grp-' + gi;
      var sum = mk('summary'); mk('h4', null, g.group, sum); det.appendChild(sum);
      var body = mk('div', 'grp-body', null, det);
      var pl = mk('p', 'grp-link', 'From ', body); var a = mk('a', null, g.chapter.text, pl); a.href = g.chapter.href; pl.appendChild(document.createTextNode(' (' + g.section + ').'));
      g.items.forEach(function (lv) { body.appendChild(buildLever(lv)); });
      rail.appendChild(det);
    });
    $('#me .rail-host').appendChild(rail);
  }
  function buildLever(lv) {
    var ch = mk('div', 'ch'); ch.id = 'ch-' + lv.id; ch.dataset.id = lv.id;
    var hintId = 'hint-' + lv.id, unitId = 'unit-' + lv.id;
    if (lv.type === 'range') {
      if (lv.toggle) {
        var cb = mk('div', 'checkbox'), ci = mk('input'); ci.type = 'checkbox'; ci.id = 'lv-' + lv.toggle; ci.setAttribute('aria-describedby', hintId);
        var cl = mk('label', null, lv.toggleLabel); cl.htmlFor = ci.id; cb.appendChild(ci); cb.appendChild(cl); ch.appendChild(cb);
        ci.addEventListener('change', function (e) { state.params[lv.toggle] = e.target.checked; changed(); });
      }
      var head = mk('div', 'ch-head', null, ch);
      var lab = mk('label', null, lv.label, head); lab.htmlFor = 'lv-' + lv.id;
      var out = mk('output', 'ch-val', null, head); out.id = 'out-' + lv.id; out.htmlFor = 'lv-' + lv.id;
      mk('p', 'hint', lv.hint, ch).id = hintId;
      if (lv.presets) {
        var fs = mk('fieldset', 'radios radios--inline', null, ch); mk('legend', 'bw-visually-hidden', lv.label + ' scenario', fs);
        lv.presets.forEach(function (p, i) {
          var r = radio('lvp-' + lv.id, 'lvp-' + lv.id + '-' + i, p[0], false); fs.appendChild(r.div);
          r.input.addEventListener('change', function () { state.params[lv.id] = p[1] / lv.k; changed(); });
        });
      }
      var rg = mk('div', 'range', null, ch);
      var inp = mk('input', null, null, rg); inp.type = 'range'; inp.id = 'lv-' + lv.id; inp.min = lv.min; inp.max = lv.max; inp.step = lv.step;
      inp.setAttribute('aria-describedby', hintId + ' ' + unitId);
      inp.addEventListener('input', function (e) { state.params[lv.id] = (+e.target.value) / (lv.k || 1); changed(true); });
      inp.addEventListener('change', function () { changed(); });
      if (lv.keyStep) inp.addEventListener('keydown', function (e) {   // arrow keys move by a whole unit; the paper's value keeps its cents
        var d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key], v;
        if (e.key === 'Home') v = lv.min; else if (e.key === 'End') v = lv.max; else if (d) v = Math.round(100 * Math.max(lv.min, Math.min(lv.max, +inp.value + d * lv.keyStep))) / 100; else return;
        e.preventDefault(); inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      });
      var ref = 'Unit: ' + (lv.unit || '') + '. Recommended setting: ' + lv.fmt(leverDisplay(lv, D[lv.id])) + '.';
      var tk = (lv.ticks || []).map(function (t) { return t[1]; }); if (lv.band) tk.push(lv.band[2]);
      if (tk.length) ref += ' Reference points: ' + tk.join('; ') + '.';
      mk('p', 'hint ref', ref, ch).id = unitId;
    } else if (lv.type === 'seg') {
      var fs2 = mk('fieldset', 'radios', null, ch); mk('legend', null, lv.label, fs2);
      mk('p', 'hint', lv.hint + ' Recommended setting: ' + fmtLever(lv, D[lv.id]) + '.', fs2).id = hintId;
      lv.options.forEach(function (o, i) {
        var r = radio('lv-' + lv.id, 'lv-' + lv.id + '-' + i, o[1], false); r.input.setAttribute('aria-describedby', hintId); fs2.appendChild(r.div);
        r.input.addEventListener('change', function () { state.params[lv.id] = o[0]; changed(); });
      });
      if (lv.id === 'part2') { var nt = mk('p', 'hint', 'The dividend options are costed only with the 22 October design (Part 1); choose it under Stage 1 design to add one.', fs2); nt.id = 'part2-note'; nt.hidden = true; }
    } else if (lv.type === 'toggle') {
      var cb2 = mk('div', 'checkbox', null, ch), ci2 = mk('input'); ci2.type = 'checkbox'; ci2.id = 'lv-' + lv.id; ci2.setAttribute('aria-describedby', hintId);
      var cl2 = mk('label', null, lv.label); cl2.htmlFor = ci2.id; cb2.appendChild(ci2); cb2.appendChild(cl2);
      mk('p', 'hint', lv.hint + ' Recommended setting: ' + (D[lv.id] ? 'on' : 'off') + '.', ch).id = hintId;
      ci2.addEventListener('change', function (e) { state.params[lv.id] = e.target.checked; changed(); });
    }
    if (lv.help) { var dt = mk('details', 'help', null, ch); mk('summary', null, 'What is this?', dt); mk('p', null, lv.help, dt); if (lv.helpMore) { var hm = mk('p', null, null, dt); lv.helpMore.forEach(function (x) { if (typeof x === 'string') hm.appendChild(document.createTextNode(x)); else mk('a', null, x.text, hm).href = x.href; }); } }
    var rs = mk('button', 'bw-button bw-button--secondary bw-button--small ch-reset', 'Reset to the recommended setting', ch); rs.type = 'button'; rs.id = 'reset-' + lv.id; rs.hidden = true;
    rs.setAttribute('aria-label', 'Reset ' + lv.label + ' to the recommended setting');
    rs.addEventListener('click', function () { state.params[lv.id] = D[lv.id]; if (lv.toggle) state.params[lv.toggle] = D[lv.toggle]; changed(); $('#lv-' + lv.id + (lv.type === 'seg' ? '-0' : '')).focus(); });
    return ch;
  }
  function syncLever(lv) {
    var v = state.params[lv.id], changedV;
    if (lv.type === 'range') {
      var dv = leverDisplay(lv, v), inp = $('#lv-' + lv.id);
      if (Math.abs(+inp.value - dv) > 1e-9) inp.value = dv; inp.setAttribute('value', dv);
      var off = lv.toggle && !state.params[lv.toggle];
      $('#out-' + lv.id).textContent = off ? 'off' : lv.fmt(dv);
      inp.disabled = !!off;
      inp.setAttribute('aria-valuetext', off ? 'off' : lv.fmt(dv));
      if (lv.toggle) setChecked($('#lv-' + lv.toggle), state.params[lv.toggle]);
      if (lv.presets) lv.presets.forEach(function (p, i) { setChecked($('#lvp-' + lv.id + '-' + i), Math.abs(dv - p[1]) < 1e-9); });
      changedV = !nearlyEq(v, D[lv.id]) || (lv.toggle && state.params[lv.toggle] !== D[lv.toggle]);
    } else if (lv.type === 'seg') {
      lv.options.forEach(function (o, i) { setChecked($('#lv-' + lv.id + '-' + i), o[0] === v); });
      if (lv.id === 'part2') { var dis = state.params.design !== 'p1'; lv.options.forEach(function (o, i) { $('#lv-part2-' + i).disabled = dis && o[0] !== 'none'; }); $('#part2-note').hidden = !dis; }
      changedV = v !== D[lv.id];
    } else { setChecked($('#lv-' + lv.id), v); changedV = v !== D[lv.id]; }
    $('#reset-' + lv.id).hidden = !changedV;
  }
  function syncRail() {
    LEVERS.forEach(function (g) { g.items.forEach(syncLever); });
    PRESETS.forEach(function (p, i) {
      var target = Object.assign({}, D, p[1]), same = Object.keys(D).every(function (k) { return nearlyEq(state.params[k], target[k]); });
      $('#preset-' + i).setAttribute('aria-pressed', same ? 'true' : 'false');
    });
    renderDiff();
  }
  function buildScenarios() {
    var ph = $('#scenarios'); ph.innerHTML = '';
    PRESETS.forEach(function (p, i) {
      var b = mk('button', 'bw-button bw-button--secondary', p[0], ph); b.type = 'button'; b.id = 'preset-' + i; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { state.params = Object.assign({}, D, p[1]); changed(); });
    });
  }
  function placeLevers() {
    var rail = $('#rail');
    if (state.mode === 'detailed') {
      SIMPLE_ECO.map(function (id) { return LV[id]; }).sort(function (a, b) { return a.gi - b.gi || a.idx - b.idx; }).forEach(function (lv) {
        var body = $('#grp-' + lv.gi + ' .grp-body'), el = $('#ch-' + lv.id); body.insertBefore(el, body.children[lv.idx + 1] || null);
      });
      $('#' + state.section + ' .rail-host').appendChild(rail); rail.hidden = false;
    } else {
      rail.hidden = true; var sl = $('#simple-levers');
      SIMPLE_ECO.forEach(function (id) { sl.appendChild($('#ch-' + id)); });
    }
  }
  function renderDiff() {
    var ch = [];
    LEVERS.forEach(function (g) { g.items.forEach(function (lv) {
      if (lv.toggle && state.params[lv.toggle] !== D[lv.toggle]) ch.push(lv.label + ' ' + (state.params[lv.toggle] ? 'on' : 'off') + ' (recommended: ' + (D[lv.toggle] ? 'on' : 'off') + ')');
      if (!nearlyEq(state.params[lv.id], D[lv.id])) ch.push(lv.label + ': ' + fmtLever(lv, state.params[lv.id]) + ' (recommended: ' + fmtLever(lv, D[lv.id]) + ')');
    }); });
    $('#diff').textContent = ch.length ? 'Compared with the paper’s recommended settings, ' + ch.length + (ch.length === 1 ? ' lever is' : ' levers are') + ' different. ' + ch.join('; ') + '.' : 'All levers are at the paper’s recommended settings.';
  }

  // ---------- the household form ----------
  function buildForm() {
    var ex = $('#examples'); ex.innerHTML = '';
    EXAMPLES.forEach(function (e, i) {
      var b = mk('button', 'bw-button bw-button--secondary', e.name, ex); b.type = 'button'; b.id = 'example-' + i; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { state.me = clone(e.me); state.errors = {}; clearErrors(); syncForm(); meChanged(); });
    });
    $$('input[name="hh"]').forEach(function (r) { r.addEventListener('change', function () { state.me.hh = r.value; syncForm(); meChanged(); }); });
    $$('input[name="housing"]').forEach(function (r) { r.addEventListener('change', function () { state.me.housing = r.value; syncForm(); meChanged(); }); });
    $('#me-form').addEventListener('submit', function (e) { e.preventDefault(); request(); });
    var ka = $('#kid-ages'); ka.innerHTML = '';
    for (var i = 0; i < 4; i++) {
      (function (i) {
        var row = mk('div', 'kid', null, ka), lab = mk('label', null, 'Child ' + (i + 1) + ' age', row); lab.htmlFor = 'me-kid' + (i + 1);
        var inp = mk('input', 'input', null, row); inp.type = 'text'; inp.inputMode = 'numeric'; inp.id = 'me-kid' + (i + 1); inp.name = 'kid' + (i + 1); inp.setAttribute('aria-describedby', 'hint-kids err-kids');
        typedNumber(inp, 'kid' + i, $('#err-kids'), 0, 17, 'child ' + (i + 1), function (n) { state.me.kids[i] = n; });
      })(i);
    }
    $('#me-nkids').addEventListener('change', function (e) { state.me.nkids = +e.target.value; syncForm(); meChanged(); });
    $('#me-kidband').addEventListener('change', function (e) { state.me.kids = KID_BANDS[e.target.value].slice(); syncForm(); meChanged(); });
    Object.keys(NUM).forEach(function (k) {
      var c = NUM[k], inp = $('#' + c[2]), err = $('#err-' + c[2].replace('me-', ''));
      typedNumber(inp, k, err, c[0], c[1], c[3], function (n) { state.me[k] = n; });
    });
    $('#me-pay').addEventListener('change', function (e) { state.me.pay = e.target.value; syncForm(); meChanged(); });
  }
  // typed numbers: error at once; value committed 400 ms after typing stops, or on change, if valid
  function typedNumber(inp, key, err, lo, hi, what, set) {
    var t = null;
    function valid() { var n = parseNum(inp.value); return (n === null || n < lo || n > hi) ? null : Math.round(n); }
    function commit() { clearTimeout(t); t = null; var n = valid(); if (n === null) return; set(n); meChanged(); }
    inp.addEventListener('input', function () {
      clearTimeout(t); t = null;
      if (valid() === null) { setError(key, inp, err, 'Enter a whole number from ' + nf0.format(lo) + ' to ' + nf0.format(hi) + ' for ' + what + '.'); return; }
      clearError(key, inp, err); t = setTimeout(commit, 400);
    });
    inp.addEventListener('change', commit);
  }
  function parseNum(s) { s = String(s).replace(/[,\s$A]/g, ''); if (s === '' || !/^-?\d+$/.test(s)) return null; var n = Number(s); return isFinite(n) ? n : null; }   // whole numbers only, as the messages say
  function setError(key, inp, err, msg) { state.errors[key] = true; inp.classList.add('input--error'); inp.setAttribute('aria-invalid', 'true'); err.textContent = msg; inp.closest('.fld').classList.add('fld-error'); staleSync(); }
  function clearError(key, inp, err) { delete state.errors[key]; inp.classList.remove('input--error'); inp.removeAttribute('aria-invalid'); if (!Object.keys(state.errors).some(function (k) { return k.indexOf('kid') === 0; }) || key.indexOf('kid') !== 0) err.textContent = ''; if (!inp.closest('.fld').querySelector('.input--error')) inp.closest('.fld').classList.remove('fld-error'); staleSync(); }
  function clearErrors() { $$('#me-form .input--error').forEach(function (i) { i.classList.remove('input--error'); i.removeAttribute('aria-invalid'); }); $$('#me-form .error-msg').forEach(function (e) { e.textContent = ''; }); $$('#me-form .fld-error').forEach(function (e) { e.classList.remove('fld-error'); }); staleSync(); }
  // while a typed field is invalid the results and the link reflect the last valid entries: say so, and hold the link
  function staleSync() { var bad = Object.keys(state.errors).length > 0; $('#me-stale').hidden = !bad; $('#copy-link').disabled = bad; if (bad) clearStatus(); }
  function clearStatus() { $('#copy-msg').textContent = ''; $('#copy-fallback').hidden = true; }
  function syncForm() {
    var me = state.me;
    var sv = function (sel, v) { var e = $(sel); if (document.activeElement !== e) setVal(e, v); };
    sv('#me-age', me.age); sv('#me-y1', me.y1); sv('#me-y2', me.y2); sv('#me-rent', me.rentPw); sv('#me-mort', me.mortgage);
    var selV = function (sel, v) { var e = $(sel); e.value = v; Array.prototype.forEach.call(e.options, function (o) { if (o.value === String(v)) o.setAttribute('selected', ''); else o.removeAttribute('selected'); }); };
    selV('#me-pay', me.pay); selV('#me-nkids', me.nkids); selV('#me-kidband', kidBandOf(me));
    $$('input[name="hh"]').forEach(function (r) { setChecked(r, r.value === me.hh); });
    $$('input[name="housing"]').forEach(function (r) { setChecked(r, r.value === me.housing); });
    var kids = me.nkids > 0;
    $('#fld-kidband').hidden = !kids; $('#fld-kids').hidden = !kids; $('#fld-y2').hidden = me.hh !== 'couple';
    for (var i = 0; i < 4; i++) { var k = $('#me-kid' + (i + 1)); if (document.activeElement !== k) setVal(k, me.kids[i]); k.parentNode.hidden = i >= me.nkids; }
    $('#fld-rent').hidden = me.housing !== 'rent'; $('#fld-mort').hidden = me.housing !== 'mortgage';
    var which = -1; EXAMPLES.forEach(function (e, i) { if (JSON.stringify(me) === JSON.stringify(e.me)) which = i; });
    EXAMPLES.forEach(function (e, i) { $('#example-' + i).setAttribute('aria-pressed', which === i ? 'true' : 'false'); });
    $('#ex-text').textContent = which >= 0 ? EXAMPLES[which].desc : 'Your figures. Nothing is stored or sent anywhere.';
    var hint = '';
    if (me.pay === 'ap' && me.age < 67) hint = 'Age Pension age is 67; the pension rules are applied anyway.';
    else if (me.pay === 'dsp' && me.age >= 67) hint = 'At 67 and over this is treated as Age Pension.';
    else if (me.pay === 'ya' && me.age > 24) hint = 'Youth Allowance is for people aged 16 to 24; the rules are applied anyway.';
    else if (me.pay === 'pp' && !kids) hint = 'Parenting Payment needs a child in your care.';
    $('#pay-hint').textContent = hint;
  }

  // ---------- compute: three workers running the same model ----------
  // main: Stage 1 at the person's settings, with the pathway held at Stage 1 continuing, so Stage 1 figures never move with it.
  // stage: Stages 2 and 3, costed the paper's way (with the wealth-tax fund at its settings) whatever the dividend choice; it also
  //        gives the year-by-year path when the pathway includes the later stages.
  // range: sweeps the sourced single lever moves in the background, for dates and rates shown as ranges.
  var seq = 0, timer = null, lastInput = 0, busyT = null, firstDone = false, rangeT = null;
  var ERR_UPDATE = 'The results could not be updated. Change a setting to try again, or reload the page. The figures shown are for the last settings that worked.';
  var ERR_FIRST = 'The model could not run in your browser, so your settings have not been applied. The figures shown are for the recommended settings and the example household. Reload the page to try again.';
  var MATERIAL = 5 * 52;    // better or worse off counts only a change of more than A$5 a week (A$260 a year) per adult
  function setBusy(b) { ['me', 'eco'].forEach(function (s) { $('#' + s + '-busy').textContent = b ? 'Updating…' : ''; }); }
  function showCalcError(text) { ['me', 'eco'].forEach(function (s) { var e = $('#' + s + '-error'); e.textContent = text; e.hidden = false; }); }
  function hideCalcError() { ['me', 'eco'].forEach(function (s) { var e = $('#' + s + '-error'); e.textContent = ''; e.hidden = true; }); }
  // runs inside each worker: the model's compute, plus better and worse off shares at the material threshold, from the model's own
  // per-adult gains (distUnits), for each stage and for the decile year shown
  function workerMain() {
    var D0 = null, OB0 = null, MC = { key: null, M: null };
    function model(params) { var k = JSON.stringify(params); if (MC.key !== k) MC = { key: k, M: BW.createModel(D0, params) }; return MC.M; }
    function shareOf(units, th) { var t = 0, b = 0, w = 0; units.forEach(function (x) { t += x[1]; if (x[2] > th) b += x[1]; if (x[2] < -th) w += x[1]; }); return { better: b / t, worse: w / t }; }
    function decShares(units, th) {      // the model's decile split (equal numbers of adults by income), counted at the threshold
      var us = units.slice().sort(function (a, b) { return a[0] - b[0]; }), tot = 0, i, out = [];
      for (i = 0; i < us.length; i++) tot += us[i][1];
      for (i = 0; i < 10; i++) out.push([0, 0, 0]);
      var cum = 0;
      for (i = 0; i < us.length; i++) {
        var gn = us[i][2], rem = us[i][1];
        while (rem > 1e-9) {
          var d = Math.min(9, Math.floor(cum / tot * 10 + 1e-12)), cap = (d + 1) * tot / 10 - cum, take = d < 9 ? Math.min(rem, cap) : rem;
          if (take <= 1e-9) { cum += 1e-9; continue; }
          out[d][0] += take; out[d][1] += take * (gn > th); out[d][2] += take * (gn < -th); cum += take; rem -= take;
        }
      }
      return out.map(function (r) { return { better: r[1] / r[0], worse: r[2] / r[0] }; });
    }
    function extras(params, r) {
      var M = model(params), sh = {}, regs = {};
      ['a', 'c', 'd'].forEach(function (k) { var s = r.stages[k]; if (!s) return; regs[s.stage] = s.reg; sh[k] = shareOf(M.distUnits(s.fy, s.U, s.F, s.tau, s.levy, s.reg, 0), MATERIAL); });
      var row = r.path.rows.filter(function (x) { return x.fy === r.dist.fy; })[0], dec = null, all = null;
      if (row && regs[row.stage]) { var du = M.distUnits(row.fy, row.U, row.F, row.stage > 1 ? row.rate : 0, row.levy || 0, regs[row.stage], 0); dec = decShares(du, MATERIAL); all = shareOf(du, MATERIAL); }
      var s0 = r.stages.a; sh.a2829 = s0 ? shareOf(M.distUnits(s0.fy, s0.U, s0.F, 0, 0, s0.reg, 0), MATERIAL) : null;
      return { sh: sh, dec: dec, all: all };
    }
    // ---- option B: P* and the package: Part 1's net cost (live) plus the script's fixed deltas (optionb_fiscal.py)
    // the five taxes fund the difference under Part 1 alone's rule (partF_r11.C3's recursion: the balance
    // carried at the debt rate, a negative balance after 2031-32 levied). basis 'cf': Rent Assistance on the fiscal model's path
    // (CPI and population, the default); 'hh': on the household model's rents (Tables B1 and B3).
    var IR = 43.4 / 1051.0, REPAY = '2031-32';
    function fundRec(rows, net, levyMode) {
      var B = 0;
      return rows.map(function (x, i) {
        var Bp = B, it = IR * Bp, S = x.dur - net[i], levy = 0, borrow = 0;
        B = Bp + it + S;
        if (B < 0 && x.fy > REPAY) { if (levyMode) { levy = -B; B = 0; } else borrow = Math.max(0, -B - Math.max(0, -Bp)); }
        return { fy: x.fy, B: B, Bp: Bp, it: it, S: S, levy: levy, borrow: borrow };
      });
    }
    function designNet(rows, design, basis, phased) {
      var dl = OB0.delta[design][basis] || {};
      return rows.map(function (x, i) { return x.net + (dl[x.fy] || 0) + (phased && i === 0 ? OB0.phased28[design] : 0); });
    }
    function summary(f, rows) {
      var lv = f.filter(function (x) { return x.levy > 1e-9; }), rep = f.filter(function (x) { return x.B >= 0; })[0];
      return { levy1: lv.length ? lv[0].fy : null, levySum: lv.reduce(function (a, x) { return a + x.levy; }, 0), advance: Math.max(0, -f[0].B), repaid: rep ? rep.fy : null,
        peakBn: Math.max.apply(null, [0].concat(lv.map(function (x) { return x.levy; }))), surplus28: Math.max(0, f[0].B), bal32: (f.filter(function (x) { return x.fy === '2031-32'; })[0] || {}).B,
        balMax: Math.max.apply(null, f.map(function (x) { return x.B; })), balMaxFy: f.reduce(function (a, x) { return x.B > a.B ? x : a; }, f[0]).fy };
    }
    function levyRate(M, fy, levy) { if (levy <= 1e-9) return { rate: 0, capped: false }; var d = M.designC(fy, 0, M.F_of(fy), 0, M.REG1, 0), lj = M.levyJoint(d, 0, levy); return { rate: lj.rate === lj.rate ? lj.rate : lj.peak, capped: lj.rate !== lj.rate }; }
    function applyDesign(r, params) {
      var design = params.design || 'p1', phased = !!params.phased;
      if (!OB0 || (design === 'p1' && !phased)) { r.design = 'p1'; return r; }
      var M = model(params), rows = r.path.rows, levyMode = params.funding !== 'borrow';
      // default: household-model rents (B1, B3); alternative: fiscal model's path (B4, B5)
      var f0 = fundRec(rows, rows.map(function (x) { return x.net; }), levyMode), net = designNet(rows, design, 'hh', phased), f1 = fundRec(rows, net, levyMode);
      var fh = fundRec(rows, designNet(rows, design, 'cf', phased), levyMode);
      var nrows = rows.map(function (x, i) {
        var a = f0[i], b = f1[i], o = Object.assign({}, x), lr = levyRate(M, x.fy, b.levy);
        o.net = net[i]; o.costx = net[i]; o.adv = i === 0 ? Math.max(0, -b.S) : 0; o.levyRev = b.levy; o.lt = b.levy; o.levy = lr.rate; o.capped = lr.capped; o.borrow = b.borrow; o.A = b.B; o.bal = b.B; o.S = b.S;
        o.kdraw = (x.fy > REPAY && b.S < 0) ? Math.min(-b.S, Math.max(0, b.Bp * (1 + IR))) : 0;
        var dc = (b.S + b.levy + b.it) - (a.S + a.levy + a.it), dnd = a.B - b.B;
        o.ucbBn = x.ucbBn + dc; o.ucb = x.ucb + 100 * dc / x.gdp; o.ucbEarn = x.ucbEarn + 100 * dc / x.gdp; if (x.ucbDraw !== undefined) o.ucbDraw = x.ucbDraw + 100 * dc / x.gdp;
        o.ndBn = x.ndBn + dnd; o.nfwBn = x.nfwBn - dnd;
        return o;
      });
      var sm = summary(f1, rows), smh = summary(fh, rows), P0 = OB0.poverty[design];
      var out = Object.assign({}, r);
      out.path = Object.assign({}, r.path, { rows: nrows });
      out.s1 = Object.assign({}, r.s1, { levy1: sm.levy1, levySum: sm.levySum, advance: sm.advance, repaid: sm.repaid, exhaust: null, lapse: null, topups: 0, surplus28: sm.surplus28, bal32: sm.bal32,
        levy1Alt: smh.levy1, levySumAlt: smh.levySum, peakBn: sm.peakBn, balMax: sm.balMax, balMaxFy: sm.balMaxFy });
      out.stages = Object.assign({}, r.stages, { a: Object.assign({}, r.stages.a, { net: net[0] }) });
      if (design !== 'p1') out.poverty = Object.assign({}, r.poverty, { rel: [P0.rel].concat(r.poverty.rel.slice(1)), anch: [P0.anch].concat(r.poverty.anch.slice(1)), child: [P0.u15].concat(r.poverty.child.slice(1)),
        base: [P0.base].concat(r.poverty.base.slice(1)), noDiv: { rel: P0.rel }, divEffect: 0, lag: null, pens: null, fixedS1: true });
      out.design = design; out.phased = phased;
      return out;
    }
    // option B reproduction check: Tables B1 to B5 and B13 at the central settings
    function designChecks() {
      var p0 = Object.assign({}, BW.DEFAULTS, { part2: 'none' }), r = BW.compute(D0, p0, null, {}), M = model(p0), rows = r.path.rows, W = OB0.want, out = [];
      var add = function (l, g, w, tol) { out.push({ label: l, got: g, want: w, ok: Math.abs(g - w) <= tol + 1e-9 }); };
      var yr = function (fy) { return fy ? +fy.slice(0, 4) : 0; };
      rows.forEach(function (x) { add('Table B2: Part 1 net cost, ' + x.fy + ' (A$bn)', x.net, W.p1.net[x.fy], 0.05); });
      rows.forEach(function (x) { add('Table B1: the five taxes, ' + x.fy + ' (A$bn)', x.dur, W.p1.rev[x.fy], 0.05); });
      add('Table B2: Part 1 first levy (year)', yr(r.s1.levy1), yr(W.p1.hh.first), 0); add('Table B2: Part 1 levies to 2045-46 (A$bn)', r.s1.levySum, W.p1.hh.total, 0.1);
      add('Table B2: Part 1 borrowing in 2028-29 (A$bn)', r.s1.advance, W.p1.hh.advance, 0.05);
      [['pstar', 'hh', 'B1: P*', W.pstar.net, W.pstar.hh], ['pstar', 'cf', 'B4: P* on the fiscal model’s Rent Assistance path', W.pstar.netCf, W.pstar.cf], ['pkg', 'hh', 'B3: the targeted package', W.pkg.net, W.pkg.hh]].forEach(function (c) {
        var net = designNet(rows, c[0], c[1], false), f = fundRec(rows, net, true), sm = summary(f, rows);
        rows.forEach(function (x, i) { add('Table ' + c[2] + ' net cost, ' + x.fy + ' (A$bn)', net[i], c[3][x.fy], 0.05); });
        add('Table ' + c[2] + ', borrowing in 2028-29 (A$bn)', sm.advance, c[4].advance, 0.05);
        add('Table ' + c[2] + ', borrowing repaid by 30 June (year)', yr(sm.repaid), yr(c[4].repaid), 0);
        add('Table ' + c[2] + ', first levy (year)', yr(sm.levy1), yr(c[4].first), 0);
        add('Table ' + c[2] + ', levies to 2045-46 (A$bn)', sm.levySum, c[4].total, 0.1);
        add('Table ' + c[2] + ', largest levy (A$bn)', sm.peakBn, c[4].peakBn, 0.1);
        var bp = OB0.balPeak[c[0]]; if (bp && c[1] === 'hh') { add('Table ' + c[2] + ', largest balance kept (A$bn)', sm.balMax, bp.hh, 0.1); add('Table ' + c[2] + ', largest balance kept (year)', yr(sm.balMaxFy), yr(bp.hhFy), 0); }
        var pk = f.filter(function (x) { return Math.abs(x.levy - sm.peakBn) < 1e-9; })[0];
        if (pk && c[4].peakRate) add('Table ' + c[2] + ', largest levy (% of market income)', 100 * levyRate(M, pk.fy, pk.levy).rate, 100 * c[4].peakRate, 0.005);
      });
      var ph = W.phased.pstar, net = designNet(rows, 'pstar', 'hh', true), f = fundRec(rows, net, true), sm = summary(f, rows);
      add('Table B13: phased start, P* net cost 2028-29 (A$bn)', net[0], ph.net28, 0.05); add('Table B13: phased start, P* borrowing in 2028-29 (A$bn)', sm.advance, ph.advance, 0.05);
      add('Table B13: phased start, P* first levy (year; 0 = none to 2045-46)', yr(sm.levy1), yr(ph.first), 0); add('Table B13: phased start, P* levies to 2045-46 (A$bn)', sm.levySum, ph.total, 0.1);
      return out;
    }
    function pick(r) {      // the dates and rates the ranges are given for
      var rows = r.path.rows, last = rows[rows.length - 1];
      return { levy1: r.s1.levy1 || null, lev46: last.levy || 0, exhaust: r.s1.exhaust || null, lapse: r.s1.lapse || null, net: rows[0].net };
    }
    self.onmessage = function (e) {
      var m = e.data;
      if (m.type === 'init') { OB0 = m.ob || null; D0 = OB0 ? Object.assign({}, m.data, { optionb: OB0 }) : m.data; return; }
      try {
        if (m.type === 'sweep') {
          var out = { base: pick(applyDesign(BW.compute(D0, m.base, null, {}), m.base)), moves: [] };
          m.moves.forEach(function (mv) { var p = Object.assign({}, m.base); p[mv[0]] = mv[1]; if (JSON.stringify(p) === JSON.stringify(m.base)) return; out.moves.push({ lever: mv[0], value: mv[1], label: mv[2], v: pick(applyDesign(BW.compute(D0, p, null, {}), p)) }); });
          self.postMessage({ id: m.id, sweep: out });
          return;
        }
        var r = BW.compute(D0, m.params, m.person, m.opts), x = extras(m.params, r);
        r.sh = x.sh; r.dec5 = x.dec; r.dec5all = x.all;
        r = applyDesign(r, m.params);
        if (m.opts && m.opts.validate && OB0) r.validation = (r.validation || []).concat(designChecks());
        self.postMessage({ id: m.id, r: r });
      } catch (err) { self.postMessage({ id: m.id, error: String(err && err.stack || err) }); }
    };
  }
  var WSRC = document.getElementById('bw-model').textContent + '\n;var MATERIAL = ' + MATERIAL + ';\n(' + workerMain.toString() + ')();';
  var LANES = {};
  function makeLane(name) {
    var L = { name: name, w: null, inflight: false, queued: null, r: null, key: null, sentKey: null };
    try {
      L.w = new Worker(URL.createObjectURL(new Blob([WSRC], { type: 'text/javascript' })));
      L.w.onmessage = function (e) { laneDone(L, e.data); };
      L.w.onerror = function () { L.w = null; L.inflight = false; laneDone(L, { error: 'the worker stopped' }); };
      L.w.postMessage({ type: 'init', data: DATA, ob: OB });
    } catch (err) { L.w = null; }
    LANES[name] = L; return L;
  }
  // stage lane: the paper's costing of Stages 2 and 3 (option (i) at its settings)
  function laneParams(name) {
    var p = Object.assign({}, state.params);
    if (name === 'main') { p.pathway = 's1'; if (p.design !== 'p1') p.part2 = 'none'; return p; }
    p.design = 'p1'; p.phased = false;
    if (p.part2 !== 'i') { p.part2 = 'i'; ['fundReturn', 'payout', 'share', 'wtLoss'].forEach(function (k) { p[k] = D[k]; }); }
    return p;
  }
  function laneSend(L, opts) {
    var params = laneParams(L.name), msg = { id: ++seq, type: 'compute', params: params, person: toPerson(state.me), opts: Object.assign({ decileYear: state.decileYear }, opts || {}) };
    L.inflight = true; L.sentKey = JSON.stringify([params, msg.person, state.decileYear]);
    if (L.w) L.w.postMessage(msg);
    else setTimeout(function () { try { var r = BW.compute(DATA, msg.params, msg.person, msg.opts); r.sh = null; laneDone(L, { id: msg.id, r: r }); } catch (e) { laneDone(L, { id: msg.id, error: String(e) }); } }, 0);
  }
  function laneRequest(L, opts) { if (L.inflight) { L.queued = Object.assign(L.queued || {}, opts || {}); return; } laneSend(L, opts); }
  function request(opts) {
    clearTimeout(busyT); busyT = setTimeout(function () { if (LANES.main.inflight || LANES.stage.inflight) setBusy(true); }, 300);
    laneRequest(LANES.main, opts); laneRequest(LANES.stage);
    scheduleRange();
  }
  function laneDone(L, m) {
    L.inflight = false;
    if (L.queued) { var q = L.queued; L.queued = null; laneSend(L, q); }
    if (!LANES.main.inflight && !LANES.stage.inflight) { clearTimeout(busyT); setBusy(false); }
    if (m.error) { window.console.error(m.error); showCalcError(firstDone ? ERR_UPDATE : ERR_FIRST); return; }
    L.r = m.r; L.key = L.sentKey;
    if (L.name === 'main') {
      firstDone = true; hideCalcError();
      if (m.r.validation) { state.validation = m.r.validation; state.validationSource = 'browser'; renderCheck(); }
    }
    state.result = merged();
    state.dirty.me = state.dirty.economy = true;
    renderActive();
    if (L.name === 'main' && lastInput) { window.__bwLatency = performance.now() - lastInput; lastInput = 0; }
    if (!LANES.main.inflight && !LANES.stage.inflight && !LANES.main.queued && !LANES.stage.queued) document.documentElement.setAttribute('data-bw-ready', '1');
    else document.documentElement.removeAttribute('data-bw-ready');
  }
  // one result for the renderers: Stage 1 from the main lane, Stages 2 and 3 from the stage lane; pathR is the year-by-year path
  function merged() {
    var a = LANES.main.r || PAPER, b = LANES.stage.r || PAPER2, R = Object.assign({}, a);
    var stale = !!(LANES.stage.inflight || LANES.stage.queued);
    R.stages = Object.assign({}, a.stages, { c: b.stages.c, d: b.stages.d });
    R.ifTriggered = b.ifTriggered; R.pathB = b.pathB;
    R.personal = Object.assign({}, a.personal, { c: b.personal && b.personal.c, d: b.personal && b.personal.d });
    R.sh = Object.assign({}, a.sh || {}, { c: b.sh && b.sh.c, d: b.sh && b.sh.d });
    R.stageR = b; R.stageStale = stale;
    R.pathR = state.params.pathway === 's1' ? R : b;
    return R;
  }
  makeLane('main'); makeLane('stage');
  state.result = merged();
  function changed(live) { lastInput = performance.now(); if (state.params.design !== 'p1') state.params.part2 = 'none'; syncRail(); updateUrl(); if (live) { if (timer) return; timer = setTimeout(function () { timer = null; request(); }, 60); } else request(); }
  function meChanged() { lastInput = performance.now(); syncForm(); updateUrl(); request(); }
  // ---------- ranges: the sourced single lever moves, swept in the background ----------
  // ranges and the what-moves map are kept for each design, and for each dividend option of Part 1
  function optKey(p) { p = p || state.params; return p.design && p.design !== 'p1' ? p.design : p.part2; }
  var RANGE = { key: null, data: RANGES0 ? RANGES0[optKey(D)] || null : null, forKey: null, busy: false };
  function rangeKey() { var p = Object.assign({}, state.params); p.pathway = 's1'; return JSON.stringify(p); }
  function scheduleRange() {
    clearTimeout(rangeT); if (window.__bwProbing) return;
    var k = rangeKey(), base = Object.assign({}, state.params, { pathway: 's1' });
    var def = JSON.stringify(Object.assign({}, D, { part2: base.part2, design: base.design, pathway: 's1' })) === k;
    if (def && RANGES0 && RANGES0[optKey(base)]) { RANGE.data = RANGES0[optKey(base)]; RANGE.forKey = k; RANGE.busy = false; return; }
    if (RANGE.forKey === k) return;
    RANGE.busy = true; RANGE.forKey = null;
    rangeT = setTimeout(function () {
      if (LANES.range && LANES.range.w) LANES.range.w.terminate();
      var L = makeLane('range'), id = ++seq;
      if (!L.w) { RANGE.busy = false; return; }
      L.w.onmessage = function (e) {
        if (!e.data.sweep) { RANGE.busy = false; return; }
        RANGE.data = e.data.sweep; RANGE.forKey = k; RANGE.busy = false; L.w.terminate();
        state.dirty.me = state.dirty.economy = true; renderActive();
      };
      L.w.postMessage({ id: id, type: 'sweep', base: base, moves: SWEEP });
    }, 1200);
  }

  // ---------- routing, tabs and the level of detail ----------
  function route() {
    var h = (location.hash || '').replace('#', ''), sec = h === 'economy' ? 'economy' : 'me';
    state.section = sec;
    $('#me').hidden = sec !== 'me'; $('#economy').hidden = sec !== 'economy';
    ['me', 'economy'].forEach(function (s) { var t = $('#tab-' + s); t.setAttribute('aria-selected', s === sec ? 'true' : 'false'); t.setAttribute('tabindex', s === sec ? '0' : '-1'); });
    if (state.mode === 'detailed') placeLevers();
    renderActive(true);
  }
  function wireTabs() {
    ['me', 'economy'].forEach(function (s) {
      var t = $('#tab-' + s);
      t.addEventListener('click', function (e) { e.preventDefault(); state.section = s; history.replaceState(null, '', serialize()); route(); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') { e.preventDefault(); var o = s === 'me' ? 'economy' : 'me'; state.section = o; history.replaceState(null, '', serialize()); route(); $('#tab-' + o).focus(); }
      });
    });
    window.addEventListener('hashchange', route);
    $$('input[name="mode"]').forEach(function (r) { r.addEventListener('change', function () { setMode(r.value); }); });
  }
  function setMode(m) {
    state.mode = m; document.body.setAttribute('data-mode', m);
    $$('input[name="mode"]').forEach(function (r) { setChecked(r, r.value === m); });
    placeLevers(); updateUrl();
    if (m === 'detailed') renderActive(true); else fixScrollables();
  }
  function renderActive(force) {
    if (!state.result) return;
    if (state.section === 'me' && (state.dirty.me || force)) { renderMe(state.result); state.dirty.me = false; }
    if (state.section === 'economy' && (state.dirty.economy || force)) { renderEconomy(state.result); state.dirty.economy = false; }
    var secEl = $('#' + state.section); applyBadges(secEl); movesPanel(state.section);
    fixScrollables(); fitLabels();
  }
  // keep end labels inside the drawing at narrow widths
  function fitLabels() {
    $$('.chart svg').forEach(function (svg) {
      var w = +svg.getAttribute('width'); if (!w || !svg.getClientRects().length) return;
      $$('text', svg).forEach(function (t) { var bb; try { bb = t.getBBox(); } catch (e) { return; } if (bb.width && bb.x + bb.width > w - 1) t.setAttribute('x', Math.max(0, w - bb.width - 1)); });
    });
  }
  function fixScrollables() {
    $$('.bw-table-wrap').forEach(function (w) {
      var sc = w.scrollWidth > w.clientWidth + 1;
      if (sc) { w.setAttribute('tabindex', '0'); w.setAttribute('role', 'group'); var c = w.querySelector('caption'); w.setAttribute('aria-label', (c ? c.textContent : 'Table') + ' (scrolls sideways)'); }
      else { w.removeAttribute('tabindex'); w.removeAttribute('role'); w.removeAttribute('aria-label'); }
    });
  }

  // ---------- the settings in the URL ----------
  var ME_KEYS = ['hh', 'nkids', 'y1', 'y2', 'pay', 'housing', 'rentPw', 'mortgage', 'age'];
  function serialize() {
    var q = [];
    if (state.mode === 'detailed') q.push('mode=detailed');
    Object.keys(D).forEach(function (k) { if (!nearlyEq(state.params[k], D[k])) q.push(k + '=' + encodeURIComponent(String(state.params[k]))); });
    var me = state.me;
    if (JSON.stringify(me) !== JSON.stringify(SAMPLE)) {      // only the inputs in effect
      q.push('hh=' + me.hh, 'y1=' + me.y1); if (me.hh === 'couple') q.push('y2=' + me.y2);
      q.push('age=' + me.age, 'nkids=' + me.nkids); if (me.nkids > 0) q.push('kids=' + me.kids.slice(0, me.nkids).join(','));
      q.push('housing=' + me.housing); if (me.housing === 'rent') q.push('rentPw=' + me.rentPw); if (me.housing === 'mortgage') q.push('mortgage=' + me.mortgage);
      q.push('pay=' + me.pay);
    }
    if (state.decileYear !== '2028-29') q.push('dy=' + state.decileYear);
    return location.pathname + (q.length ? '?' + q.join('&') : '') + '#' + state.section;
  }
  var urlTimer = null;
  function updateUrl() { clearStatus(); clearTimeout(urlTimer); urlTimer = setTimeout(function () { try { history.replaceState(null, '', serialize()); } catch (e) { /* file: pages cannot replace state */ } }, 150); }
  function applyQuery() {
    var sp; try { sp = new URLSearchParams(location.search); } catch (e) { return; }
    if (sp.get('mode') === 'detailed') state.mode = 'detailed';
    Object.keys(LV).forEach(function (id) {
      var lv = LV[id], v = sp.get(id); if (v === null) return;
      if (lv.type === 'range') { var n = Number(v); if (isFinite(n)) state.params[id] = Math.min(lv.max / (lv.k || 1), Math.max(lv.min / (lv.k || 1), n)); }
      else if (lv.type === 'seg') { lv.options.forEach(function (o) { if (String(o[0]) === v) state.params[id] = o[0]; }); }
      else state.params[id] = v === 'true';
      if (lv.toggle && sp.get(lv.toggle) !== null) state.params[lv.toggle] = sp.get(lv.toggle) === 'true';
    });
    var me = state.me;
    if (sp.get('hh') === 'single' || sp.get('hh') === 'couple') me.hh = sp.get('hh');
    if (['rent', 'mortgage', 'own'].indexOf(sp.get('housing')) >= 0) me.housing = sp.get('housing');
    if (['none', 'js', 'ya', 'ap', 'dsp', 'pp', 'ca'].indexOf(sp.get('pay')) >= 0) me.pay = sp.get('pay');
    var nk = parseNum(sp.get('nkids') || ''); if (nk !== null && nk >= 0 && nk <= 4) me.nkids = Math.round(nk);
    Object.keys(NUM).forEach(function (k) { var n = parseNum(sp.get(k) || ''); if (n !== null && n >= NUM[k][0] && n <= NUM[k][1]) me[k] = Math.round(n); });
    if (sp.get('kids')) { var ks = sp.get('kids').split(',').map(parseNum); if (ks.length >= 1 && ks.length <= 4 && ks.every(function (a) { return a !== null && a >= 0 && a <= 17; })) me.kids = ks.map(Math.round).concat(SAMPLE.kids.slice(ks.length)); }
    if (sp.get('dy') && /^\d{4}-\d{2}$/.test(sp.get('dy'))) state.decileYear = sp.get('dy');
  }
  function wireActions() {
    $('#reset-all').addEventListener('click', function () {
      state.params = Object.assign({}, D); state.me = clone(SAMPLE); state.decileYear = '2028-29'; state.errors = {}; clearErrors();
      syncRail(); syncForm(); request(); updateUrl();
      $('#copy-fallback').hidden = true; $('#copy-msg').textContent = 'Every lever and the household are back at the paper’s recommended settings.';
    });
    $('#copy-link').addEventListener('click', function () {
      var url = location.origin + serialize(), msg = $('#copy-msg'), fb = $('#copy-fallback'), box = $('#copy-url');
      function fail() { msg.textContent = ''; fb.hidden = false; setVal(box, url); box.focus(); box.select(); }
      if (Object.keys(state.errors).length) { fb.hidden = true; msg.textContent = 'The link is on hold: fix the field marked in the household form first.'; return; }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { fb.hidden = true; msg.textContent = 'Link copied. It opens this page with these settings.'; }, fail);
        else fail();
      } catch (e) { fail(); }
    });
  }
