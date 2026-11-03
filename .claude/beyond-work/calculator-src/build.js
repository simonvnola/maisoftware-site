// Build /UBI/calculator/index.html from template.html, model.js, ui-1.js to ui-5.js and data.json.
// model.js is the paper's model with one change: distUnits is exported (no maths changes), so the page can count
// "better off" above a material amount from the model's own per-adult gains.
// 1. Compute the initial results in Node with the same worker code the page runs (ui-2.js workerMain): Stage 1 at the
//    recommended settings (no dividend, pathway held at Stage 1), Stages 2 and 3 costed the paper's way, the 62-figure
//    reproduction check, and the ranges across the sourced single lever moves for each dividend option.
// 2. Open the page in Chromium and move each lever alone from several starting points to find what moves each readout
//    (Live, Interpolated or Fixed).
// 3. Rebuild with that map, let the UI render the default results for both questions, and write the rendered <main>
//    back into the file, so the page is complete at rest and shows its default results without JavaScript.
const fs = require('fs'), path = require('path'), vm = require('vm');
const S = __dirname, OUT = process.argv[2] || '/home/user/maisoftware-site/UBI/calculator/index.html';
const BW = require(path.join(S, 'model.js'));
const dataTxt = fs.readFileSync(path.join(S, 'data.json'), 'utf8'), DATA = JSON.parse(dataTxt);
const model = fs.readFileSync(path.join(S, 'model.js'), 'utf8');
const uiParts = [1, 2, 3, 4, 5].map(i => fs.readFileSync(path.join(S, 'ui-' + i + '.js'), 'utf8')), ui = uiParts.join('\n');
if (/<\/script/i.test(model) || /<\/script/i.test(ui)) throw new Error('script text contains a closing tag');
const esc = s => s.replace(/<\//g, '<\\/');

// the page's own worker code and sweep list
function extractFn(src, name) {
  const i = src.indexOf('function ' + name + '()'); let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  throw new Error('no ' + name);
}
const wsrc = extractFn(uiParts[1], 'workerMain');
const MATERIAL = +(/var MATERIAL = ([^;]+);/.exec(uiParts[1])[1].replace(/\s*\/\/.*$/, '').split('*').reduce((a, x) => a * +x, 1));
const sweepSrc = /var SWEEP = (\[[\s\S]*?\]);\n/.exec(uiParts[0])[1];
const SWEEP = vm.runInNewContext(sweepSrc);
const ctx = { BW, MATERIAL, self: {}, JSON, Math, Object, String, Infinity };
let reply = null; ctx.self.postMessage = m => { reply = m; };
vm.runInNewContext('(' + wsrc + ')();', ctx);
ctx.self.onmessage({ data: { type: 'init', data: DATA, ob: require(path.join(S, 'optionb_data.js')) } });
const OB = require(path.join(S, 'optionb_data.js'));
const call = msg => { reply = null; ctx.self.onmessage({ data: msg }); if (reply.error) throw new Error(reply.error); return reply; };

const D = Object.assign({}, BW.DEFAULTS, { part2: 'none', design: 'pstar', phased: false });
const sample = { couple: true, y1: 78000, y2: 32000, kind: 'none', kids: [6, 11], housing: 'rent', rentPw: 600, mortgage: 550000 };
const pMain = Object.assign({}, D, { pathway: 's1' });
const pStage = Object.assign({}, D, { part2: 'i', design: 'p1', phased: false });
const main = call({ id: 1, type: 'compute', params: pMain, person: sample, opts: { decileYear: '2028-29', validate: true } }).r;
const stage = call({ id: 2, type: 'compute', params: pStage, person: sample, opts: { decileYear: '2028-29' } }).r;
const bad = main.validation.filter(v => !v.ok);
console.log('reproduction check:', main.validation.length - bad.length, 'of', main.validation.length, 'match', bad.length ? JSON.stringify(bad) : '');
const ranges = {};
for (const k of ['pstar', 'pkg', 'none', 'i', 'iv', 'v']) {
  const t = Date.now(), b = ['pstar', 'pkg'].includes(k) ? { design: k, part2: 'none' } : { design: 'p1', part2: k };
  ranges[k] = call({ id: 3, type: 'sweep', base: Object.assign({}, D, b, { pathway: 's1' }), moves: SWEEP }).sweep;
  const vals = f => [ranges[k].base[f]].concat(ranges[k].moves.map(m => m.v[f]));
  console.log('ranges', k, ranges[k].moves.length, 'moves', (Date.now() - t) + 'ms', 'levy1', JSON.stringify([...new Set(vals('levy1'))].sort()), 'lev46', Math.min(...vals('lev46')).toFixed(4), Math.max(...vals('lev46')).toFixed(4), 'exhaust', JSON.stringify([...new Set(vals('exhaust'))].sort()), 'lapse', JSON.stringify([...new Set(vals('lapse'))].sort()));
}

function assemble(moves) {
  let html = fs.readFileSync(path.join(S, 'template.html'), 'utf8');
  // the working-draft banner, exactly as the shared file has it (rubric A8: the same markup on every page)
  html = html.replace('<!--PHASE-BANNER-->', () => fs.readFileSync(path.join(S, '..', 'optionb', 'phase_banner.html'), 'utf8').trim());
  return html.replace('/*DATA*/', () => esc(dataTxt)).replace('/*INITIAL*/', () => esc(JSON.stringify({ main, stage, ranges, moves, ob: OB })))
    .replace('/*MODEL*/', () => model).replace('/*UI*/', () => ui);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const STAGE = path.join(S, '..', 'stage'); fs.mkdirSync(STAGE, { recursive: true });
const local = h => h.replace('href="/UBI/assets/gov.css"', 'href="file:///home/user/maisoftware-site/UBI/assets/gov.css"');

(async () => {
  const { chromium } = require('/opt/node22/lib/node_modules/playwright');
  const b = await chromium.launch();
  // ---- 2. what moves each readout ----
  let moves = null;
  if (!process.env.BW_SKIP_MOVES) {
    const st1 = path.join(STAGE, 'stage1.html'); fs.writeFileSync(st1, local(assemble(null)));
    const p = await b.newPage({ viewport: { width: 1024, height: 900 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('file://' + st1 + '#economy');
    await p.waitForFunction(() => document.documentElement.getAttribute('data-bw-ready') === '1', null, { timeout: 60000 });
    const levers = await p.evaluate(() => window.__bwLevers);
    const t0 = Date.now(), all = {}, bases = [{}, { design: 'pkg' }, { design: 'p1' }, { design: 'p1', part2: 'i' }, { design: 'p1', part2: 'iv' }, { design: 'p1', part2: 'v' }, { dispEp: 0.03 }];
    let n = 0;
    for (const base of bases) {
      const opt = base.design && base.design !== 'p1' ? base.design : base.design === 'p1' ? (base.part2 || 'none') : 'pstar', found = all[opt] = all[opt] || {};
      const b0 = await p.evaluate(x => window.__bwProbe(x), base); n++;
      for (const [id, vals] of levers) for (const v of vals) {
        if (base[id] !== undefined && base[id] === v) continue;
        const t = await p.evaluate(x => window.__bwProbe(x), Object.assign({}, base, { [id]: v })); n++;
        for (const k of Object.keys(t)) if (b0[k] !== undefined && b0[k] !== t[k]) (found[k] = found[k] || new Set()).add(id);
        for (const k of Object.keys(b0)) if (found[k] === undefined) found[k] = found[k] || new Set();
      }
    }
    if (errs.length) { console.error('errors while probing:', errs); process.exit(1); }
    moves = {}; for (const o of Object.keys(all)) { moves[o] = {}; for (const k of Object.keys(all[o])) moves[o][k] = [...all[o][k]]; }
    const m0 = moves.pstar; console.log('probed', n, 'settings in', ((Date.now() - t0) / 1000).toFixed(0) + 's;', Object.keys(m0).length, 'readouts for P*;', Object.keys(m0).filter(k => !m0[k].length).length, 'fixed');
    await p.close();
  }
  // ---- 3. prerender ----
  const html = assemble(moves), st2 = path.join(STAGE, 'stage2.html'); fs.writeFileSync(st2, local(html));
  const p = await b.newPage({ viewport: { width: 1024, height: 900 } });
  const errs = []; p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + st2 + '#economy');
  await p.waitForFunction(() => document.documentElement.getAttribute('data-bw-ready') === '1', null, { timeout: 60000 });
  await p.evaluate(() => { location.hash = '#me'; document.dispatchEvent(new Event('bw:prerender')); });
  await p.waitForTimeout(500);
  // without JavaScript the charts keep their natural width inside a scrolling, labelled wrapper; the UI strips these on boot
  await p.evaluate(() => document.querySelectorAll('.chart').forEach(c => { if (!c.querySelector('svg')) return; const h = c.closest('figure') && c.closest('figure').querySelector('h3'); c.setAttribute('tabindex', '0'); c.setAttribute('role', 'group'); c.setAttribute('aria-label', (h ? h.textContent : 'Chart') + ' (chart; scrolls sideways)'); }));
  const mainHtml = await p.evaluate(() => document.querySelector('main').innerHTML);
  const checkText = await p.evaluate(() => document.querySelector('#check .status').textContent);
  await b.close();
  if (errs.length) { console.error('console errors during prerender:', errs); process.exit(1); }
  const start = html.indexOf('<main id="main" class="bw-wrap">') + '<main id="main" class="bw-wrap">'.length, end = html.indexOf('</main>');
  const final = html.slice(0, start) + '\n' + mainHtml.replace(/\s+data-bw-ready="1"/g, '').replace(/ (hidden|checked|disabled|open|selected|readonly|novalidate)=""/g, ' $1') + '\n' + html.slice(end);
  fs.writeFileSync(OUT, final);
  console.log('check text:', checkText);
  console.log('wrote', OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });
