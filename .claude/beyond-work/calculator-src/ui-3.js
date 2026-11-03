
  // ---------- svg and table helpers ----------
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function tx(parent, x, y, s, cls, anchor, extra) { var t = el('text', Object.assign({ x: x, y: y, 'text-anchor': anchor || 'start' }, cls ? { class: cls } : {}, extra || {}), parent); t.textContent = s; return t; }
  function niceTicks(lo, hi, n) {
    if (hi - lo < 1e-9) { hi = lo + 1; }
    var raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, st = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    var a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st, out = [];
    for (var v = a; v <= b + st * 1e-6; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return out;
  }
  function colPath(x, yBase, yTop, w) { return 'M' + x + ',' + yBase + 'V' + yTop + 'H' + (x + w) + 'V' + yBase + 'Z'; }
  function hatch(svg, id, color) {
    var defs = svg.querySelector('defs') || el('defs', {}, svg);
    var pat = el('pattern', { id: id, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 5, height: 5, fill: '#ffffff' }, pat); el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: color, 'stroke-width': 2 }, pat);
    return 'url(#' + id + ')';
  }
  function legend(host, items) {
    host.innerHTML = '';
    items.forEach(function (it) {
      var s = document.createElement('span'), k = document.createElement('i');
      k.className = (it.type === 'line' ? 'k-line' : it.type === 'dot' ? 'k-dot' : it.type === 'ring' ? 'k-ring' : it.type === 'hatch' ? 'k-hatch' : 'k-rect') + (it.cls ? ' ' + it.cls : '') + (it.type === 'hatch' ? '' : ' ' + ccls(it.color)) + (it.dash ? ' dash' : '');
      s.appendChild(k); s.appendChild(document.createTextNode(it.label)); host.appendChild(s);
    });
  }
  function table(host, head, rows, opts) {
    opts = opts || {}; host.innerHTML = '';
    var wrap = mk('div', 'bw-table-wrap', null, host), t = mk('table', ((opts.cls || '') + (opts.stacked ? ' bw-stages' : '') + (opts.stacked === 'wide' ? ' bw-stages--wide' : '')).trim() || null, null, wrap);
    if (opts.caption) mk('caption', opts.hideCaption ? 'bw-visually-hidden' : null, opts.caption, t);
    var th = mk('thead', null, null, t), tr = mk('tr', null, null, th);
    head.forEach(function (h, i) { var c = mk('th', i && !opts.text ? ((opts.textCols || []).indexOf(i) >= 0 ? 'text' : 'num') : null, h, tr); c.scope = 'col'; });
    var tb = mk('tbody', null, null, t);
    rows.forEach(function (r, ri) {
      var tr2 = mk('tr', r.cls || null, null, tb), cells = r.cells || r;
      if (r.full) { var hf = mk('th', 'full', cells[0], tr2); hf.scope = 'row'; hf.setAttribute('colspan', String(head.length)); return; }
      if (r.span && !opts.stacked) { var hs = mk('th', null, cells[0], tr2); hs.scope = 'row'; var tds = mk('td', 'text', cells[1], tr2); tds.setAttribute('colspan', String(head.length - 1)); return; }
      if (r.span) { var h0 = mk('th', null, cells[0], tr2); h0.scope = 'row'; var td0 = mk('td', 'text', cells[1], tr2); td0.setAttribute('colspan', String(head.length - 1)); if (opts.stacked) td0.setAttribute('data-label', ''); return; }
      cells.forEach(function (v, i) {
        var c = mk(i === 0 ? 'th' : 'td', i && !opts.text ? ((opts.textCols || []).indexOf(i) >= 0 ? 'text' : 'num') : null, v, tr2);
        if (i === 0) c.scope = 'row'; else if (opts.stacked) c.setAttribute('data-label', head[i]);
        if (opts.signed && i && typeof v === 'string') { if (v.charAt(0) === '+') c.classList.add('pos'); else if (v.charAt(0) === MINUS) c.classList.add('neg'); }
        if (i && opts.roCells) { var k = opts.roStages[ri]; ro(c, opts.roCells + '-' + k + '-' + i, cells[0] + ': ' + head[i], opts.roKind ? opts.roKind(k, i) : null); }
      });
    });
    if (opts.ro) ro(wrap, opts.ro, opts.roLabel || opts.caption || 'Table', opts.roFixed ? 'fixed' : null, opts.roTarget || 'before');
  }
  // ---------- readout status: Live, Interpolated or Fixed, and what moves each figure ----------
  // MOVES is found when the page is built: each lever is moved alone to a sourced value and every readout compared.
  var LEVER_NAME = { floorOn: 'Working-age floor switched on or off' };
  var STAGE_LONG = { a: 'Stage 1, a targeted floor', c: 'Stage 2, conditional pathway', d: 'Stage 3, described, not authorised' };
  function ro(elm, id, label, kind, target) {
    elm.setAttribute('data-ro', id); elm.setAttribute('data-ro-label', label);
    if (kind) elm.setAttribute('data-ro-kind', kind); if (target) elm.setAttribute('data-ro-target', target);
    return elm;
  }
  function roStatus(elm) {
    var id = elm.getAttribute('data-ro'), kind = elm.getAttribute('data-ro-kind'), own = !!elm.closest('#me'), mv = null;
    if (MOVES) { var mo = MOVES[optKey()] || {}; mv = mo[id]; if (!mv) { var u = {}; Object.keys(MOVES).forEach(function (o) { (MOVES[o][id] || []).forEach(function (l) { u[l] = 1; }); }); mv = Object.keys(u); } }
    var by = (mv || []).map(function (l) { return LEVER_NAME[l] || (LV[l] ? LV[l].label : l); });
    if (kind === 'fixed') return { s: 'Fixed', by: by, per: true };
    if (own) by.unshift('your household’s details');
    if (kind === 'interp') return { s: 'Interpolated', by: by };
    if (!MOVES && !own) return null;
    return { s: by.length ? 'Live' : 'Fixed', by: by };
  }
  var BADGE_HELP = { Live: 'Live: recalculated by the model in your browser.', Interpolated: 'Interpolated: estimated between runs of the paper’s household model.', Fixed: 'Fixed: the paper’s figure; no lever moves it.' };
  function applyBadges(root) {
    $$('[data-ro]', root).forEach(function (elm) {
      var st = roStatus(elm); if (!st) return;
      elm.classList.toggle('is-fixed', st.s === 'Fixed');
      var tg = elm.getAttribute('data-ro-target'), host = !tg || tg === 'before' ? elm : tg.charAt(0) === '>' ? elm.querySelector(tg.slice(1)) : $(tg);
      if (!host) return;
      var old = tg === 'before' ? (elm.previousElementSibling && elm.previousElementSibling.classList.contains('ro-badge') ? elm.previousElementSibling : null) : host.querySelector(':scope > .ro-badge');
      if (old) old.remove();
      var b = document.createElement('span'); b.className = 'ro-badge ro-' + st.s.toLowerCase(); b.textContent = st.s;
      b.title = BADGE_HELP[st.s];
      if (tg === 'before') elm.parentNode.insertBefore(b, elm); else host.appendChild(b);
      var op = (tg === 'before' ? elm.parentNode : host).querySelector('.ro-provisional[data-for="' + elm.getAttribute('data-ro') + '"]'); if (op) op.remove();
      if (elm.getAttribute('data-ro-prov')) { var pv = document.createElement('span'); pv.className = 'ro-badge ro-provisional'; pv.textContent = 'Provisional'; pv.setAttribute('data-for', elm.getAttribute('data-ro')); pv.title = 'Provisional: rests on the option B re-costing, which has not yet been through every check.'; if (tg === 'before') elm.parentNode.insertBefore(pv, elm); else host.appendChild(pv); }
    });
  }
  function movesPanel(sec) {
    var body = $('#moves-' + sec + '-body'); if (!body) return;
    var rows = [], seen = {};
    $$('#' + (sec === 'me' ? 'me' : 'economy') + ' [data-ro]').forEach(function (elm) {
      var id = elm.getAttribute('data-ro'); if (seen[id]) return; seen[id] = 1;
      var st = roStatus(elm); if (!st) return;
      if (elm.closest('[hidden]')) return;
      if ((state.mode === 'simple' && elm.closest('.detailed-only')) || (state.mode === 'detailed' && elm.closest('.simple-only'))) return;
      rows.push([elm.getAttribute('data-ro-label'), st.s + (elm.getAttribute('data-ro-prov') ? ', provisional' : ''), elm.getAttribute('data-ro-by') === 'design' ? 'Changes only with the Stage 1 design' : st.per && st.by.length ? 'Nothing within a choice; the paper gives one figure for each choice of: ' + st.by.join('; ').toLowerCase() : st.s === 'Fixed' || !st.by.length ? 'Nothing on this page' : cap(st.by.join('; '))]);
    });
    table(body, ['Figure', 'Status', 'What moves it'], rows, { text: true, stacked: true, caption: 'What moves each figure', hideCaption: true });
    // a long list of levers reads as a list, not a sentence
    $$('tbody tr', body).forEach(function (tr) { var c = tr.children[2]; if (!c) return; var parts = c.textContent.split('; '); if (parts.length < 3) return; c.textContent = ''; var ul = mk('ul', 'moves-list', null, c); parts.forEach(function (x) { mk('li', null, x.replace(/^the paper gives one figure for each choice of: /, ''), ul); }); });
  }
  function hover(cont, svg, frame, n, xAt, tipFn) {
    var tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; cont.appendChild(tip);
    var cross = el('line', { x1: 0, x2: 0, y1: frame.t, y2: frame.h - frame.b, stroke: '#505a5f', 'stroke-width': 1, opacity: 0 }, svg);
    var hit = el('rect', { x: frame.l, y: frame.t, width: Math.max(0, frame.w - frame.l - frame.r), height: Math.max(0, frame.h - frame.t - frame.b), fill: 'transparent' }, svg);
    var cur = n - 1;
    function show(i, px, py) {
      cur = Math.max(0, Math.min(n - 1, i));
      var x = xAt(cur); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('opacity', 0.5);
      var d = tipFn(cur); tip.innerHTML = '';
      mk('div', 'th', d.title, tip);
      d.rows.forEach(function (r) {
        var row = mk('div', 'tr', null, tip); mk('span', 'kl ' + ccls(r.color) + (r.kind === 'rect' ? ' rect' : ''), null, row);
        mk('span', 'tl', r.label, row); mk('b', null, r.value, row);
      });
      tip.hidden = false;
      var cw = cont.clientWidth, tw = tip.offsetWidth, left = x + 12;
      if (left + tw > cw) left = x - tw - 12; if (left < 0) left = Math.max(0, cw - tw);
      tip.style.left = left + 'px'; tip.style.top = Math.max(0, (py !== undefined ? py : frame.t) - 10) + 'px';
    }
    function hide() { tip.hidden = true; cross.setAttribute('opacity', 0); }
    hit.addEventListener('pointermove', function (e) {
      var rc = svg.getBoundingClientRect(), px = e.clientX - rc.left, best = 0, bd = 1e9;
      for (var i = 0; i < n; i++) { var dd = Math.abs(xAt(i) - px); if (dd < bd) { bd = dd; best = i; } }
      show(best, px, e.clientY - rc.top);
    });
    hit.addEventListener('pointerleave', hide);
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('focus', function () { show(cur); });
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(cur - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { show(cur + 1); e.preventDefault(); }
      else if (e.key === 'Escape') hide();
    });
  }
  // year chart frame: years on a band scale, linear y, axis titles with units
  function frameYears(cont, years, yLo, yHi, opts) {
    opts = opts || {};
    var w = chartWidth(cont), h = opts.h || (w < 520 ? 260 : 300);
    var ticks = niceTicks(yLo, yHi, h < 280 ? 4 : 5), y0 = ticks[0], y1 = ticks[ticks.length - 1];
    var fmtY = opts.fmtY || function (v) { return nf0.format(v); };
    var labW = Math.max.apply(null, ticks.map(function (t) { return fmtY(t).length; })) * 7 + 10;
    var f = { w: w, h: h, l: Math.max(30, labW), r: opts.r || 12, t: opts.t || 30, b: 42 };
    var svg = el('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': (opts.aria || '') + ' (the table below has the same figures)' }, cont);
    var n = years.length, bw = (w - f.l - f.r) / n;
    f.x = function (i) { return f.l + (i + 0.5) * bw; }; f.bw = bw;
    f.y = function (v) { return f.t + (h - f.t - f.b) * (1 - (v - y0) / (y1 - y0)); };
    if (opts.bands) opts.bands.forEach(function (b, bi) {
      var x0 = f.l + b.i0 * bw, x1 = f.l + (b.i1 + 1) * bw;
      if (bi % 2 === 0) el('rect', { x: x0, y: f.t - 14, width: x1 - x0, height: h - f.t - f.b + 14, fill: 'var(--band)' }, svg);
      if (x1 - x0 > 34) tx(svg, x0 + 4, f.t - 4, b.label, 'blab');
    });
    ticks.forEach(function (t) { el('line', { x1: f.l, x2: w - f.r, y1: f.y(t), y2: f.y(t), class: Math.abs(t) < 1e-9 ? 'zero' : 'gridl' }, svg); tx(svg, f.l - 6, f.y(t) + 4, fmtY(t), '', 'end'); });
    var every = Math.max(1, Math.ceil(56 / bw));
    years.forEach(function (fy, i) { if ((n - 1 - i) % every === 0) tx(svg, f.x(i), h - 24, fy, '', 'middle'); });
    tx(svg, 0, 12, opts.yUnit || '', 'unit');
    tx(svg, f.l + (w - f.l - f.r) / 2, h - 6, opts.xUnit || 'Financial year', 'unit', 'middle');
    f.svg = svg;
    return f;
  }
  // the chart is drawn at the container's real width (text stays 12 px); a hidden container falls back to its results column
  function chartWidth(cont) {
    cont.innerHTML = ''; cont.removeAttribute('tabindex'); cont.removeAttribute('role'); cont.removeAttribute('aria-label');
    var col = cont.closest('.results');
    return Math.max(280, cont.clientWidth || (col && col.clientWidth) || 600);
  }
  function stageBands(rows, pre) {
    var bands = [], off = pre || 0;
    if (pre) bands.push({ i0: 0, i1: pre - 1, label: 'Set-up' });
    rows.forEach(function (r, i) {
      var lab = r.stage === 1 ? 'Stage 1' : r.stage === 2 ? 'Stage 2' : 'Stage 3', last = bands[bands.length - 1];
      if (last && last.stage === r.stage && last.key === r.key) last.i1 = i + off;
      else bands.push({ i0: i + off, i1: i + off, label: lab, stage: r.stage, key: r.key });
    });
    return bands;
  }
  var STAGE_NAMES = { a: 'Stage 1', c: 'Stage 2', d: 'Stage 3' }, STAGE_COL = { a: 'var(--s1)', c: 'var(--s2)', d: 'var(--s3)' };
  function stageKeys(p) { return ['a', 'c', 'd'].filter(function (k) { return !!p[k]; }); }
  function yearsOf(r) { return r.path.rows.map(function (x) { return x.fy; }); }

  // ---------- What happens to me ----------
  function renderMe(r) {
    var p = r.personal; if (!p || !p.a) return;
    renderMeSimple(r);
    if (state.mode === 'detailed') renderMeDetailed(r);
  }
  // weekly amounts: under A$1 a week shows cents, so a small yearly change never reads as "A$0 a week"
  function wk(v) { var w = v / 52; if (Math.abs(v) < 0.5) return 'A$0'; if (Math.abs(w) < 1) return (w > 0 ? '+' : MINUS) + 'A$' + Math.abs(w).toFixed(2); return aud(w, true); }
  function yr(v) { return Math.abs(v) < 0.5 ? 'A$0' : aud(v, true); }
  // better or worse off only by more than A$5 a week
  function wordFor(total) { return Math.abs(total) / 52 < 5 ? 'about the same' : total > 0 ? 'better off' : 'worse off'; }
  function netWords(total) { var w = Math.abs(total) / 52; return w < 5 ? 'About the same: ' + wk(total) + ' a week (' + yr(total) + ' a year), within A$5 a week' : wk(total) + ' a week ' + (total > 0 ? 'better off' : 'worse off') + ' (' + yr(total) + ' a year)'; }
  // household's share of the five funding taxes (Table B11 by decile; low and high incidence variants; scaled by that year's taxes)
  function taxShare(r, fy) {
    var me = state.me, a = r.personal.a, kids = me.kids.slice(0, me.nkids);
    var scale = 1 + (me.hh === 'couple' ? 0.5 : 0) + kids.reduce(function (t, k) { return t + (k >= 14 ? 0.5 : 0.3); }, 0);   // modified OECD scale
    var eq = a.cur / scale, i = 0;
    while (i < 9 && OB.taxDec[i].upper && eq > OB.taxDec[i].upper) i++;
    var row = (r.path.rows.filter(function (x) { return x.fy === fy; })[0]) || r.path.rows[0], k = row.dur / OB.taxBase, d = OB.taxDec[i];
    return { decile: i + 1, central: d.central * k, low: d.low * k, high: d.high * k, eq: eq };
  }
  function renderMeSimple(r) {
    var p = r.personal, a = p.a, before = a.total, tx = taxShare(r, a.fy), tot = before - tx.central, wkly = Math.abs(tot) / 52, hl = $('#me-hl'), des = r.design || 'p1'; hl.innerHTML = '';
    var tail = ' in ' + a.fy + ', after your share of the taxes that pay for it.';
    if (wkly < 5) hl.textContent = 'About the same as now' + tail + ' (within A$5 a week)';
    else { mk('strong', tot > 0 ? 'pos' : 'neg', 'About A$' + nf0.format(Math.round(wkly)) + ' a week ' + (tot > 0 ? 'better off' : 'worse off'), hl); hl.appendChild(document.createTextNode(tail)); }
    ro(hl, 'me-headline', 'Your household’s change in 2028-29, after the funding taxes', null, '#me-hl-tag');
    var lo = before - tx.high, hi = before - tx.low;
    $('#me-sub').textContent = 'Before those taxes: ' + wk(before) + ' a week. Stage 1: ' + DESIGN_SHORT[des] + (r.phased ? ', phased start' : '') + '.';
    var payBits = [];
    if (a.pay) payBits.push(a.pay.Psq > 0 ? 'Your current payment works out at ' + aud(a.pay.Psq) + ' a year (' + (a.pay.Psq >= a.pay.mx - 1 ? 'full rate' : 'part rate') + ').' : 'At this income you would get no payment under current rules.');
    var ok = r.opt.key, nch = $('#diff').textContent.indexOf('All levers') === 0 ? 0 : 1, des = r.design || 'p1';
    var rentNote = ' Higher rent: as modelled, landlords take ' + pct(100 * state.params.rentPass) + ' of a renting household’s gain in higher rent, so a renter with no gain shows none; a mortgage holder pays more as the cash rate responds to the extra spending.';
    var dnote = des === 'pstar' ? ' Rent Assistance 75% higher counts if you rent privately and get Rent Assistance today (on a payment, or more than the base rate of Family Tax Benefit Part A).' :
      des === 'pkg' ? ' The earned-income credit (up to A$5,000 for each earner) and Rent Assistance 75% higher count as the package sets them; Rent Assistance if you rent privately and get it today.' : '';
    $('#me-opt').textContent = payBits.join(' ') + (payBits.length ? ' ' : '') + 'Modelled with ' + OPT_NAME[ok] + (ok === 'none' ? '' : ': each adult gets ' + aud(r.U1) + ' in 2028-29 dollars, first paid in ' + (r.firstPay || 'a later year')) + '.' + dnote + (r.phased ? ' With a phased start the child payment begins in 2029-30, so it is not in the 2028-29 figures.' : '') + rentNote + ' ' + (nch ? 'Some levers are changed from the recommended settings (see the line above the tabs).' : 'Every other lever is at its recommended setting.');
    var off = a.parts.offset || 0;   // the protection offset on tax: shown with the tax change, not as a separate gain
    var val = function (key) { return key === 'rate' ? a.rate : key === 'rent' ? a.rent : key === 'tax' ? (a.parts.tax || 0) + off : key === 'prot' ? (a.parts.prot || 0) - off : (a.parts[key] || 0); };
    var items = [['U', 'Dividend'], ['child', des === 'pkg' ? 'FTB increment' : 'Child payment, net of FTB'], ['credit', 'Earned-income credit'], ['cra', 'Rent Assistance +75%'], ['prot', 'Floor and protections'],
      ['tax', off > 0.5 ? 'Income tax, after offset' : 'Income tax change'], ['rise', 'Rate rise or levy'], ['replaced', 'Payments replaced'],
      ['rent', 'Higher rent'], ['rate', 'Higher mortgage repayments']];
    var rows = items.filter(function (it) { return Math.abs(val(it[0])) >= 0.5 || it[0] === 'tax' || (it[0] === 'child' && state.me.nkids > 0); })
      .map(function (it) { var v = val(it[0]); return [it[1], yr(v), wk(v)]; });
    rows.push({ cls: 'sub', cells: ['Before the five taxes', yr(before), wk(before)] });
    rows.push(['Your share of the taxes', yr(-tx.central), wk(-tx.central)]);
    rows.push({ cls: 'total', cells: ['After the five taxes', yr(tot), wk(tot)] });
    rows.push({ full: true, cls: 'range', cells: ['Range, by who bears the taxes: your share A$' + nf0.format(Math.round(tx.low)) + ' to A$' + nf0.format(Math.round(tx.high)) + ' a year (decile ' + tx.decile + '), so ' + wk(lo) + ' to ' + wk(hi) + ' a week after them.'] });
    table($('#me-simple-table'), ['Whole household, 2028-29', 'A$ a year', 'A$ a week'], rows, { cls: 'simple-bd', signed: true, caption: 'Where the change comes from in ' + a.fy + ', modelled estimate', hideCaption: true, ro: 'me-bd', roLabel: 'Where the change comes from', roTarget: '#h-me-bd' });
    // at each stage: the model's per-stage household results less the household's share of that year's five taxes
    var srows = [], anyT = false;
    ['a', 'c', 'd'].forEach(function (k, i) {
      var s = p[k], lab = STAGE_LONG[k] + ' (' + (s ? s.fy : ['2028-29', '2032-33', '2037-38'][i]) + ')';
      if (!s) { srows.push({ span: true, cells: [lab, 'Not shown: no rate rise funds this stage at these settings.'] }); return; }
      if (s.ifTriggered) anyT = true;
      var pays = s.parts.tax + s.parts.rise, sh = taxShare(r, s.fy).central, adult = s.parts.U, fam = (s.parts.child || 0) + (s.parts.credit || 0) + (s.parts.cra || 0);
      srows.push([lab, yr(adult), yr(fam), yr(pays), yr(-sh), netWords(s.total - sh)]);
    });
    if (des !== 'p1') { prov(hl); prov($('#me-simple-table .bw-table-wrap')); }
    table($('#me-stages'), ['Stage', 'Adult payments (A$ a year)', 'Child payment and other help (A$ a year)', 'Income tax and rate rise (A$ a year)', 'Your share of the five taxes (A$ a year)', 'Net change, after the funding taxes'], srows, { signed: true, stacked: true, textCols: [5], caption: 'Your household at each stage, modelled estimate', hideCaption: true, roCells: 'me-st', roStages: ['a', 'c', 'd'] });
    if (des !== 'p1') $$('#me-stages [data-ro^="me-st-a-"]').forEach(function (c) { prov(c); });
    $('#me-stages-note').textContent = 'Adult payments: the dividend at Stage 1 if one is chosen, the basic income at Stages 2 and 3, for every adult in the household. Child payment and other help: the Stage 1 design’s family payment' + (des === 'p1' ? '' : ', credit and Rent Assistance rise') + '. Income tax and rate rise: the tax on the payments plus the rate rise or levy that funds the stage. Your share of the five taxes: the paper’s central allocation by income decile, scaled to each year’s five taxes. Net change also counts payments replaced, the floor and protections, and the rent or mortgage effect, as in the breakdown above. Better or worse off means by more than A$5 a week.' + (anyT ? ' Stages 2 and 3 are shown as if triggered at their earliest dates, at the rate rise they would need, costed the paper’s way (with Part 1 and its wealth-tax fund) whatever Stage 1 design or dividend you choose.' : '');
  }
  function renderMeDetailed(r) {
    var p = r.personal, a = p.a, keys = stageKeys(p);
    var st = $('#me-strip'); st.innerHTML = '';
    ['a', 'c', 'd'].forEach(function (k) {
      var s = p[k], d = mk('div', 'bw-figure', null, st);
      if (!s) { mk('span', 'bw-figure-value', 'Not shown', d); mk('span', 'bw-figure-label', STAGE_LONG[k] + ': no rate rise funds this stage at these settings.', d); return; }
      var shk = taxShare(r, s.fy).central, aft = s.total - shk;
      var v = mk('span', 'bw-figure-value ' + (wordFor(aft) === 'better off' ? 'pos' : wordFor(aft) === 'worse off' ? 'neg' : ''), yr(aft) + ' a year', d); ro(d, 'me-strip-' + k, STAGE_LONG[k] + ': your household, after the funding taxes'); if (k === 'a' && (r.design || 'p1') !== 'p1') prov(d);
      var rr = s.tau > 0 ? (k === 'c' ? nf1.format(100 * s.tau) + ' to ' + nf1.format(R2MAX) + ' points rate rise' : pts(100 * s.tau) + ' rate rise') : 'no rate rise';
      if (s.levy > 0) rr += ', ' + pct(100 * s.levy, 2) + ' levy';
      if (k === 'd' && !r.ifTriggered.cert) rr += '; no rate passes its stress test';
      mk('span', 'bw-figure-label', STAGE_LONG[k] + ', ' + s.fy + ': ' + wordFor(aft) + ' after your share of the five taxes, ' + wk(aft) + ' a week. Before them: ' + yr(s.total) + ' a year (' + wk(s.total) + ' a week); ' + rr + '.', d);
    });
    drawHhDiv(r);
    var ROWS = [['U', 'Dividend or basic income'], ['tax', 'Tax change, after the protection offset'], ['replaced', 'Payments replaced'],
      ['prot', 'Protections and floor'], ['child', 'Child payment, net of FTB'], ['credit', 'Earned-income credit'], ['cra', 'Rent Assistance +75%'], ['rise', 'Rate rise or levy'],
      ['rate', 'Interest-rate effect on your mortgage'], ['rent', 'Rent pass-through']];
    var val = function (s, key) { var o = s.parts.offset || 0; return key === 'rate' ? s.rate : key === 'rent' ? s.rent : key === 'tax' ? s.parts.tax + o : key === 'prot' ? s.parts.prot - o : (s.parts[key] || 0); };
    var rows = [];
    ROWS.forEach(function (rw) {
      var any = keys.some(function (k) { return Math.abs(val(p[k], rw[0])) >= 0.5; });
      if (!any && rw[0] !== 'U' && rw[0] !== 'tax') return;
      rows.push([rw[1]].concat(keys.map(function (k) { return yr(val(p[k], rw[0])); })));
    });
    rows.push({ cls: 'sub', cells: ['Before the funding taxes'].concat(keys.map(function (k) { return yr(p[k].total); })) });
    rows.push(['Your share of the five taxes'].concat(keys.map(function (k) { return yr(-taxShare(r, p[k].fy).central); })));
    rows.push({ cls: 'total', cells: ['After the funding taxes'].concat(keys.map(function (k) { return yr(p[k].total - taxShare(r, p[k].fy).central); })) });
    table($('#me-breakdown'), ['A$ a year'].concat(keys.map(function (k) { return STAGE_NAMES[k] + ' ' + p[k].fy + (p[k].ifTriggered ? '*' : ''); })), rows, { signed: true, caption: 'Where the change comes from, by stage, A$ a year', hideCaption: true, ro: 'me-bd-stage', roLabel: 'Where the change comes from, by stage' });
    if ((r.design || 'p1') !== 'p1') prov($('#me-breakdown .bw-table-wrap'));
    var notes = [];
    if (keys.some(function (k) { return p[k].ifTriggered; })) notes.push('* Not on the chosen pathway: shown as if triggered at its earliest date, at the rate rise it would need.');
    if (state.me.housing === 'mortgage') notes.push('Mortgage line: the cash rate rises by about ' + keys.map(function (k) { return Math.round(p[k].bp) + ' basis points (' + STAGE_NAMES[k] + ')'; }).join(', ') + ', on a 22-year variable loan at 6.25% (85% of the debt variable).');
    if (state.me.housing === 'rent') notes.push('Rent line: rents rise by ' + pct(100 * state.params.rentPass) + ' of a renting household’s gain (AHURI range 6.6% to 32.4%).');
    notes.push('The rows add to the net change. Stage 1 is shown in full, with the first dividend valued in 2028-29 dollars. Tax change: the payment is taxed. At Stage 1 the tax-free threshold and the low income tax offset are unchanged; at Stages 2 and 3 both go. Protections and floor: what current recipients keep, the lift to the floor and the family top-up.');
    if (state.me.nkids > 0) notes.push('Child payment: tapered at 18 cents a dollar of parents’ income and assessed on income about 1.5 years earlier, so a change in earnings shows up later. A birth or job loss can be reviewed on an estimate. FTB: Family Tax Benefit.');
    $('#me-bd-note').textContent = notes.join(' ');
    var er = [['Current rules (' + a.fy + ')', pct(100 * a.emtrCur, 0)]];
    keys.forEach(function (k) { er.push([STAGE_NAMES[k] + ' (' + p[k].fy + (p[k].ifTriggered ? ', if triggered' : '') + ')', pct(100 * p[k].emtrAbi, 0)]); });
    table($('#me-emtr'), ['Rules', 'Rate at ' + aud(state.me.y1)], er, { caption: 'Effective marginal tax rate at your income', hideCaption: true });
    drawCurve(p);
  }
  function drawHhDiv(r) {
    var adults = state.me.hh === 'couple' ? 2 : 1, years = yearsOf(r);
    if (r.opt.key === 'none') { $('#ch-hdiv').innerHTML = ''; $('#lg-hdiv').innerHTML = ''; $('#tb-hdiv').innerHTML = ''; $('#why-hdiv').textContent = 'No dividend is chosen, so there is nothing to chart. The paper recommends none now; choose one of the dividend options with the 22 October design to see what it would pay.'; return; }
    var nom = r.upath.map(function (d) { return d * adults; }), real = r.upath26.map(function (d) { return d * adults; });
    var hi = Math.max(1, Math.max.apply(null, nom));
    var f = frameYears($('#ch-hdiv'), years, 0, hi * 1.12, { aria: 'Your household’s dividend by year, in dollars of the day and in 2026 dollars', yUnit: 'A$ a year', r: 56, h: 250 });
    var svg = f.svg, cw = Math.min(20, f.bw * 0.6);
    nom.forEach(function (v, i) { if (v > 0.5) el('path', { d: colPath(f.x(i) - cw / 2, f.y(0), f.y(v), cw), fill: 'var(--s1)' }, svg); });
    el('path', { d: real.map(function (v, i) { return (i ? 'L' : 'M') + f.x(i).toFixed(1) + ',' + f.y(v).toFixed(1); }).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    var li = years.length - 1;
    tx(svg, f.x(li) + cw / 2 + 4, f.y(nom[li]) + 4, aud(nom[li]), 'lab');
    legend($('#lg-hdiv'), [{ type: 'rect', color: 'var(--s1)', label: 'Dividend, A$ of the day (columns)' }, { type: 'line', color: 'var(--ink)', label: 'Same, in 2026 dollars (line)' }]);
    hover($('#ch-hdiv'), svg, f, years.length, f.x, function (i) {
      return { title: years[i], rows: [{ color: 'var(--s1)', label: 'Dividend', value: aud(nom[i]), kind: 'rect' }, { color: 'var(--ink)', label: 'In 2026 dollars', value: aud(real[i]) }] };
    });
    var rmax = Math.max.apply(null, real), imax = real.indexOf(rmax), drift = rmax - real[li] > 1, ok = r.opt.key;
    $('#why-hdiv').textContent = ok === 'none' ? 'No dividend is chosen, so there is nothing to show here. The paper recommends none now; choose one of the dividend options to see what it would pay.' :
      (adults === 2 ? 'Two adults, ' : 'One adult, ') + 'on the paper’s central path, option ' + ok + '. Nothing is paid in 2028-29: the first dividend comes a year in arrears, in ' + (r.firstPay || 'a later year') + '. ' +
      (r.s1.lapse ? 'It is not cut in cash terms until ' + r.s1.lapse + ', when the never-cut guarantee lapses and it follows the fund’s payout. ' : 'It is never cut in cash terms. ') +
      'Its value in 2026 dollars ' + (drift ? 'peaks in ' + years[imax] + ' and drifts down after.' : 'keeps rising to 2045-46.');
    table($('#tb-hdiv'), ['Year', 'Dividend (A$)', 'In 2026 dollars (A$)'], years.map(function (fy, i) { return [fy, aud(nom[i]), aud(real[i])]; }), { caption: 'Your household’s dividend by year', hideCaption: true });
  }
  function drawCurve(p) {
    var cont = $('#ch-curve');
    var keys = stageKeys(p), xs = p.a.curve.map(function (c) { return c[0]; });
    var lo = 0, hi = 0; keys.forEach(function (k) { p[k].curve.forEach(function (c) { lo = Math.min(lo, c[1]); hi = Math.max(hi, c[1]); }); });
    var w = chartWidth(cont), h = w < 520 ? 270 : 320;
    var ticks = niceTicks(lo, hi, 5), y0 = ticks[0], y1 = ticks[ticks.length - 1];
    var fmtY = function (v) { return (v < 0 ? MINUS : '') + nf0.format(Math.abs(v) / 1000) + 'k'; };
    var f = { w: w, h: h, l: 50, r: 14, t: 30, b: 42 };
    var svg = el('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': 'Net gain by your private income for each stage (the table below has the same figures)' }, cont);
    var X = function (v) { return f.l + (w - f.l - f.r) * v / 250000; }, Y = function (v) { return f.t + (h - f.t - f.b) * (1 - (v - y0) / (y1 - y0)); };
    ticks.forEach(function (t) { el('line', { x1: f.l, x2: w - f.r, y1: Y(t), y2: Y(t), class: Math.abs(t) < 1e-9 ? 'zero' : 'gridl' }, svg); tx(svg, f.l - 6, Y(t) + 4, fmtY(t), '', 'end'); });
    [0, 50000, 100000, 150000, 200000, 250000].forEach(function (v) { if (w < 420 && v % 100000 && v) return; tx(svg, X(v), h - 24, v ? (v / 1000) + 'k' : '0', '', 'middle'); });
    tx(svg, 0, 12, 'A$ a year', 'unit'); tx(svg, f.l + (w - f.l - f.r) / 2, h - 6, 'Your private income, A$ a year', 'unit', 'middle');
    var DASH = { a: null, c: '6 4', d: '2 4' };
    keys.forEach(function (k) {
      var d = p[k].curve.map(function (c, i) { return (i ? 'L' : 'M') + X(c[0]).toFixed(1) + ',' + Y(c[1]).toFixed(1); }).join('');
      el('path', Object.assign({ d: d, fill: 'none', stroke: STAGE_COL[k], 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, DASH[k] ? { 'stroke-dasharray': DASH[k] } : {}), svg);
    });
    var me = Math.min(250000, Math.max(0, state.me.y1));
    el('line', { x1: X(me), x2: X(me), y1: f.t, y2: h - f.b, stroke: 'var(--ink-2)', 'stroke-width': 1 }, svg);
    tx(svg, X(me) + (X(me) > w - 110 ? -4 : 4), f.t + 10, 'You: ' + aud(state.me.y1), 'lab', X(me) > w - 110 ? 'end' : 'start');
    keys.forEach(function (k) { if (state.me.y1 > 250000) return; el('circle', { cx: X(me), cy: Y(p[k].gain), r: 5, fill: STAGE_COL[k], stroke: '#fff', 'stroke-width': 2 }, svg); });
    legend($('#lg-curve'), keys.map(function (k) { return { type: 'line', color: STAGE_COL[k], dash: !!DASH[k], label: STAGE_NAMES[k] + ' (' + p[k].fy + (p[k].ifTriggered ? ', if triggered' : '') + ')' + (DASH[k] ? ', dashed' : ', solid') }; }));
    hover(cont, svg, { l: f.l, r: f.r, t: f.t, b: f.b, w: w, h: h }, xs.length, function (i) { return X(xs[i]); }, function (i) {
      return { title: 'Your private income ' + aud(xs[i]), rows: keys.map(function (k) { return { color: STAGE_COL[k], label: STAGE_NAMES[k], value: aud(p[k].curve[i][1], true) }; }) };
    });
    var rows = []; for (var i = 0; i < xs.length; i += 4) rows.push([aud(xs[i])].concat(keys.map(function (k) { return aud(p[k].curve[i][1], true); })));
    table($('#tb-curve'), ['Your private income'].concat(keys.map(function (k) { return STAGE_NAMES[k] + ' (A$ a year)'; })), rows, { signed: true, caption: 'Net gain by private income', hideCaption: true });
  }
