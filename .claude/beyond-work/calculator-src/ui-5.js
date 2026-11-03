
  // ---------- the check against the paper's central case ----------
  function renderCheck() {
    var v = state.validation, box = $('#check'); if (!v) return;
    var ok = v.filter(function (x) { return x.ok; }).length, all = ok === v.length;
    box.innerHTML = ''; box.classList.toggle('fail', !all); box.classList.toggle('ok', all);
    var tol = ' (A$0.1 billion or 0.1 points, or exact for dates and dollar rates)', built = state.validationSource !== 'browser';
    mk('span', 'status', (built ? 'Checked when this page was built: the calculator ' + (all ? 'reproduced' : 'did not reproduce') + ' the paper’s model, ' : (all ? 'The calculator reproduces the paper’s model: ' : 'The calculator does not reproduce the paper’s model: ')) + ok + ' of ' + v.length + ' figures match the model’s tables' + (built ? '.' : ', checked in your browser just now.'), box);
    mk('p', null, 'The tables are the paper’s Part F4 tables and the option B model’s Tables B1 to B5 and B13. Each figure must match within A$0.1 billion or 0.1 points, or exactly for dates and dollar rates.', box);
    mk('p', null, 'This checks that the code gives the model’s own figures: the central case (P*, no dividend) against Tables B1 to B5 and B13, and Part 1 against the 22 October Part F4 tables. It does not test the model’s assumptions, which the ranges and the stress tests speak to. ' + (built ? 'It is rechecked in your browser when JavaScript runs.' : 'It runs in your browser at load.') + (all ? '' : ' The rows marked “no” differ from the paper.'), box);
    var det = mk('details', null, null, box); mk('summary', null, 'Show the ' + v.length + ' checks', det);
    var hostT = mk('div', null, null, det);
    table(hostT, ['Check', 'This page', 'Paper', 'Within tolerance'], v.map(function (x) { return [x.label, x.got.toFixed(3), x.want.toFixed(3), x.ok ? 'yes' : 'no']; }), { caption: 'Figures the calculator reproduces from the paper’s model', hideCaption: true });
  }

  // ---------- boot ----------
  applyQuery();
  buildRail(); buildScenarios(); buildForm(); wireTabs(); wireActions();
  if (location.hash === '#economy') state.section = 'economy';
  $('#simple-levers').innerHTML = '';
  document.body.setAttribute('data-mode', state.mode); $$('input[name="mode"]').forEach(function (r) { setChecked(r, r.value === state.mode); });
  syncRail(); syncForm(); placeLevers();
  if (state.validation) renderCheck();
  $('#dec-year').addEventListener('change', function (e) { state.decileYear = e.target.value; updateUrl(); request(); });
  route();
  // the build script asks for the check to be labelled as the build-time result before it captures the page
  document.addEventListener('bw:prerender', function () { state.validationSource = 'build'; renderCheck(); });
  // build only: one alternative value for each lever (a sourced reference point where it has one), every other option
  window.__bwLevers = [];
  LEVERS.forEach(function (g) { g.items.forEach(function (lv) {
    var d = D[lv.id], alt = [];
    if (lv.type === 'seg') alt = lv.options.map(function (o) { return o[0]; }).filter(function (v) { return v !== d; });
    else if (lv.type === 'toggle') alt = [!d];
    else { var k = lv.k || 1, t = (lv.ticks || []).map(function (x) { return x[0] / k; }).filter(function (v) { return Math.abs(v - d) > 1e-9; }); alt = [t.length ? t[0] : (Math.abs(lv.max / k - d) > 1e-9 ? lv.max / k : lv.min / k)]; }
    window.__bwLevers.push([lv.id, alt]);
    if (lv.toggle) window.__bwLevers.push([lv.toggle, [!D[lv.toggle]]]);
  }); });
  // build only: move one set of levers, render both questions in detailed mode and return the text of every readout
  window.__bwProbe = function (params) {
    return new Promise(function (res) {
      window.__bwProbing = true; state.params = Object.assign({}, D, params); state.mode = 'detailed'; syncRail(); request();
      var iv = setInterval(function () {
        if (LANES.main.inflight || LANES.stage.inflight || LANES.main.queued || LANES.stage.queued) return;
        clearInterval(iv);
        var R = state.result, out = {};
        renderMe(R); renderEconomy(R);
        $$('[data-ro]').forEach(function (e) { var c = e.cloneNode(true); $$('.ro-badge', c).forEach(function (b) { b.remove(); }); out[e.getAttribute('data-ro')] = c.textContent; });
        res(out);
      }, 20);
    });
  };
  var rszObs = 'ResizeObserver' in window ? new ResizeObserver(function () { clearTimeout(rszObs._t); rszObs._t = setTimeout(function () { renderActive(true); }, 120); }) : null;
  if (rszObs) { rszObs.observe($('#me .results')); rszObs.observe($('#economy .results')); }
  var dirtyAtLoad = JSON.stringify(state.params) !== JSON.stringify(D) || JSON.stringify(state.me) !== JSON.stringify(SAMPLE) || state.decileYear !== '2028-29';
  if (dirtyAtLoad) { request(); request({ validate: true }); } else request({ validate: true });
  setTimeout(function () { if (!firstDone) showCalcError(ERR_FIRST); }, 20000);
})();
