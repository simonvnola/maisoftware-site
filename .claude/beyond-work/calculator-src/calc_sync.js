// Keep the calculator in step with the paper (the calculator sits outside the review loop; this is how it stays correct).
//
//   node calc_sync.js           check: rebuild the option B data from the model outputs the paper is written from
//                               (optionb/model/runs/*.json and optionb_facts.json) and compare it, figure by figure, with the
//                               data embedded in UBI/calculator/index.html; also check the paper values typed into
//                               optionb_data.js against the paper. Exit 1 and list every difference if they disagree.
//   node calc_sync.js --apply   rebuild the calculator (build.js) from the current outputs, then run the check again and the
//                               page's own reproduction check (it must report every figure matching).
//
// Run it whenever a metric or measure in the paper changes (a model re-run, a facts edit, a new scenario).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const S = __dirname;
const SITE = process.env.SITE || '/home/user/maisoftware-site';
const PAGE = path.join(SITE, 'UBI', 'calculator', 'index.html');
const PAPER = path.join(S, '..', 'optionb', 'paper_optionb.md');

function embedded() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const m = /<script id="bw-initial" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error('no bw-initial block in ' + PAGE);
  return JSON.parse(m[1].replace(/<\\\//g, '</')).ob;
}

function diff(a, b, p, out) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) out.push(`${p}: page ${b} | model ${a}`);
    return out;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${p}: page ${JSON.stringify(b)} | model ${JSON.stringify(a)}`);
    return out;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(k in b)) out.push(`${p}.${k}: missing on the page`);
    else if (!(k in a)) out.push(`${p}.${k}: on the page but no longer in the model outputs`);
    else diff(a[k], b[k], `${p}.${k}`, out);
  }
  return out;
}

// figures typed into optionb_data.js from the paper's tables: each must still appear in the paper's text
function typedChecks(OB) {
  const paper = fs.readFileSync(PAPER, 'utf8'), out = [];
  const a57 = paper.indexOf('| Higher earner in families with children: effective marginal tax rate');
  if (a57 < 0) return ['Table 5.7: its work-incentive rows were not found in the paper'];
  const t57 = paper.slice(a57, a57 + 1200);
  for (const [row, vals] of Object.entries(OB.table57)) for (const [d, v] of Object.entries(vals)) {
    if (!t57.includes(v.toFixed(1))) out.push(`table57.${row}.${d}: ${v.toFixed(1)} not found near Table 5.7 in the paper`);
  }
  if (OB.zero) for (const [k, v] of Object.entries(OB.zero.paperFigures || {})) {
    if (!paper.includes(v)) out.push(`zero.paperFigures.${k}: "${v}" not found in the paper`);
  }
  return out;
}

function check() {
  delete require.cache[require.resolve(path.join(S, 'optionb_data.js'))];
  const OB = require(path.join(S, 'optionb_data.js'));
  const d = diff(JSON.parse(JSON.stringify(OB)), embedded(), 'ob', []).concat(typedChecks(OB));
  if (d.length) { console.log(`calculator OUT OF SYNC: ${d.length} difference(s)`); d.slice(0, 200).forEach(x => console.log('  ' + x)); }
  else console.log('calculator in sync with the model outputs and the paper');
  return d.length === 0;
}

if (process.argv.includes('--apply')) {
  const out = execFileSync('node', [path.join(S, 'build.js'), PAGE], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  process.stdout.write(out);
  const rep = /reproduction check: (\d+) of (\d+) match/.exec(out);
  if (!rep || rep[1] !== rep[2]) { console.log('reproduction check FAILED'); process.exit(1); }
  process.exit(check() ? 0 : 1);
} else process.exit(check() ? 0 : 1);
