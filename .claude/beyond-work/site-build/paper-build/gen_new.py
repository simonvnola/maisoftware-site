# replacement generators using model results (executed inside build namespace)
import json as _json
BT = _json.load(open(os.path.join(BASE, 'btables.json')))
FX = _json.load(open(os.path.join(OPT, 'model', 'optionb_facts.json')))['facts']
def fv(k):
    v = FX[k]; return v['value'] if isinstance(v, dict) and 'value' in v else v
def f1(x): 
    s = f'{x:,.1f}'; return s.replace('-', '−')
MY = YEARS[2:]
# ---- Table 6.1
b4 = {r[0]: r for r in BT['B4']}
net = fv('pstar_net_cost_by_year'); pct = fv('pstar_net_cost_pct_gdp_by_year'); p1n = fv('part1_net_cost_by_year'); dl = fv('pstar_less_part1_by_year')
hdr = ("| Year | P\\*: child payment, net of FTB replaced | P\\*: Rent Assistance +75% | Floor, protections and implementation (net cost less the two) | **P\\*: net cost** | P\\*: net cost (% of GDP) | Memo: Part 1 net cost | Memo: Part 1 child payment | P\\* less Part 1 |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|")
rows = []
for y in MY:
    r = b4[y]; cp, ra, n = float(r[3]), float(r[4]), float(r[5])
    rows.append(row([y, r[3], r[4], f1(n - cp - ra), f'**{r[5]}**', f'{pct[y]:.2f}%', r[1], r[2], f'{dl[y]:.2f}'.replace('-', '−')]))
def tot(a, b, d):
    ys = YEARS[YEARS.index(a):YEARS.index(b) + 1]
    return sum(d[y] for y in ys)
for lab, a, b in [('2028-29 and 2029-30', '2028-29', '2029-30'), ('First 10 years, 2028-29 to 2037-38', '2028-29', '2037-38'), ('All years, 2028-29 to 2045-46', '2028-29', '2045-46')]:
    ys = YEARS[YEARS.index(a):YEARS.index(b) + 1]
    cp = sum(float(b4[y][3]) for y in ys); ra = sum(float(b4[y][4]) for y in ys); n = tot(a, b, net); p1 = tot(a, b, p1n); p1cp = sum(float(b4[y][2]) for y in ys)
    rows.append(row([f'**{lab}**', f1(cp), f1(ra), f1(n - cp - ra), f'**{f1(n)}**', '', f1(p1), f1(p1cp), f'{n - p1:.1f}'.replace('-', '−')]))
T61 = hdr + '\n' + '\n'.join(rows)
# ---- Table 6.4 unchanged (five taxes), built as before
five = {}; p1fund = {}
for line in L[946:964]:
    c = cells(line); y = c[0]; five[y] = unb(c[1]); p1fund[y] = dict(balance=unb(c[8]), levy=c[6])
hdr = ("| Year | Super above transfer balance cap (ECR-2025-3128) | 40% excess profits tax (ECR-2025-3194) | Coal and minerals super-profits tax (ECR-2025-3518) | PRRT reform and 10% offshore gas royalty (ECR-2025-3123) | End fossil-fuel subsidies (ECR-2025-3001) | **Five durable taxes** | Memo: net wealth tax (ECR-2025-3463), wealth-tax fund option only | Memo: interaction, personal income tax (ECR-2025-3901), that option only |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|")
rows = []
for line in L[1011:1031]:
    c = cells(line); y = unb(c[0])
    ft = '800.3' if y.startswith('Total, 2028-29 to 2037-38') else '1,619.4' if y.startswith('Total, 2028-29 to 2045-46') else five[y]
    rows.append(row([f'**{y}**' if y.startswith('Total') else y] + c[1:6] + [f'**{ft}**', c[6], c[7]]))
T64 = hdr + '\n' + '\n'.join(rows)
# ---- Table 6.6 from B1
hdr = ("| Year | **Five taxes** | P\\* net cost (Table 6.1) | **Margin: taxes less net cost** | Interest on the balance at the debt rate (+ earned, − paid) | Kept surpluses drawn down | Levy (A$ billion) | Levy (% of market income) | **Balance at 30 June: borrowing outstanding (−) or surpluses kept (+)** | Underlying cash balance against baseline | Memo: Part 1 balance at 30 June | Memo: Part 1 levy (A$ billion) |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
rows = []
for r in BT['B1']:
    y = r[0]
    if y.startswith('2028-29 to'):
        rows.append(row(['**2028-29 to 2045-46**', '**1,619.4**', r[1], f'**{r[9]}**', r[10], r[11], f'**{r[12]}**', '', '', '', '', '**25.8**'])); continue
    rows.append(row([y, f'**{r[8]}**', r[1], f'**{r[9]}**', r[10], r[11], r[12], r[13], f'**{r[14]}**', r[15], p1fund[y]['balance'], p1fund[y]['levy']]))
T66 = hdr + '\n' + '\n'.join(rows)
# ---- Table 6.7 phased start (B13)
T67 = "\n".join(["| Start | Net cost, 2028-29 (A$ billion) | **Borrowing in 2028-29 (A$ billion)** | Balance at 30 June 2029 (+ surplus kept) | Borrowing with a full start | **First levy** | First levy, full start | Levies to 2045-46 (A$ billion) | Levies, full start | Balance at 30 June 2032 |",
                 "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"] +
                [row([r[0] + (' (offered to Parliament)' if i == 0 else '')] + r[1:]) for i, r in enumerate(BT['B13'])])
# ---- Table 6.9 stress (B9 without the printed P*)
T69 = "\n".join(["| Design | **Levy before 2044-45** | **Levy before 2034-35** | Any levy to 2045-46 | First levy: 10th percentile | Median | 90th percentile | No AI displacement: before 2044-45 / 2034-35 | Symmetric draws only (yield, behaviour, calibration): before 2044-45 / 2034-35 | Tax yield alone: before 2044-45 / 2034-35 |",
                 "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"] +
                [row(r) for r in BT['B9'] if not r[0].startswith('P* as printed')]).replace('P*', 'P\\*').replace(' (Table 5.4i)', '').replace(' (re-costed; recommended)', ' (recommended)')
# ---- Table 6.10: old 6.14g plus P* columns from B15
b15 = {r[0]: r for r in BT['B15']}
caseMap = ['Central', 'High case: fuel-credit and minerals measures grow with nominal GDP', 'Safeguard read literally: each year\'s shortfall after 2031-32 levied',
           'Five taxes yield 90% of the costings', 'Five taxes yield 80% of the costings', 'Excess profits tax yields 50% of the PBO costing',
           'Superannuation measure yields 50% of the PBO costing', 'Caseload elasticity 0.56 (high)', 'Taxable-income elasticity 0.4 for the response to the family-payment tapers',
           "Labour response high (0.29), the child payment's income effect scaled", 'Labour response low (0.05), the same', 'Floor costed on the PBO\'s basis (lift x1.34)',
           'Cost overrun of A$1bn a year', 'Cost overrun of A$2bn a year', 'Combined downside: five taxes at 70%, labour response 0.29, the income effect scaled',
           "Household model calibrated to FTB's PBO path", "Household model: full-rate pensioners' other income 25% lower", None]
hdr = ("| Case | Part 1: first levy | **Part 1: levies to 2045-46 (A$ billion)** | Part 1: largest levy (A$ billion; % of market income) | Part 1, five-year repayment rule: first levy | Five-year rule: levies to 2045-46 (A$ billion) | Five-year rule: largest levy (% of market income) | **P\\*: first levy** | **P\\*: levies to 2045-46 (A$ billion)** | **P\\*: largest levy (A$ billion; % of market income)** |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
rows = []
for line, key in zip(L[1628:1646], caseMap):
    c = cells(line)
    if key is None:
        r = b15['Household model: the same pensioner variant, calibration started from the central result (a noise check)']
        c = [c[0] + ' (Part 1 corrected in this revision: the printed 2043-44 and A$37.6bn were calibration noise)', '2044-45', '**32.1**', '0.66%', '2044-45', '32.1', '0.66%']
        extra = [r[1], r[2], r[3]]
    else:
        r = b15[key]; extra = [r[1], r[2], r[3]]
    rows.append(row(c + extra))
T610 = hdr + '\n' + '\n'.join(rows)
# ---- Table 6.12 net benefit (B10)
b10 = {r[0]: r for r in BT['B10']}
def nb(k, i): return b10[k][i]
PS, P1, PK = 'P* (re-costed; recommended)', 'Part 1 alone', 'Targeted package (Table 5.4i)'
T612 = "\n".join([
 "| Measure, 2028-29 | P\\* (provisional) | Targeted package (provisional) | Part 1 |", "|---|---:|---:|---:|",
 f"| Household poverty-gap reduction after housing costs, relative line (A$ billion) | {nb(PS,2)} | {nb(PK,2)} | {nb(P1,2)} |",
 f"| Own behavioural costs (A$ billion) | {nb(PS,3)} | {nb(PK,3)} | {nb(P1,3)} |",
 f"| Net benefit with the real cost of financing, the paper's method (weights 1.5 to 2.0 on the poverty gap) | {nb(PS,4)} | {nb(PK,4)} | {nb(P1,4)} |",
 f"| **The same, also counting own behavioural costs (complete accounting)** | **{nb(PS,5)}** | **{nb(PK,5)}** | **{nb(P1,5)}** |",
 f"| The same, with the 2028-29 borrowing charged | {nb(PS,6)} | {nb(PK,6)} | {nb(P1,6)} |",
 "| Against Part 1, complete accounting | +1.5 to +1.8 | −0.4 to +4.1 | 0 |",
 f"| **Break-even weight on the poverty gap, the paper's method** | **{nb(PS,7)}** | **{nb(PK,7)}** | **{nb(P1,7)}** |",
 f"| Break-even weight, complete accounting | {nb(PS,8)} | {nb(PK,8)} | {nb(P1,8)} |",
 f"| Net benefit with the UK Green Book's weights (elasticity 1.3), full cost financed (provisional) | {nb(PS,10)} | {nb(PK,10)} | {nb(P1,10)} |",
 f"| Break-even inequality-aversion elasticity, Green Book method (provisional) | {nb(PS,12)} | {nb(PK,12)} | {nb(P1,12)} |",
]).replace('−', '−')
# ---- Table 6.14 from B12a and B12
b12a = {r[0]: r for r in BT['B12a']}; b12 = {r[0]: r for r in BT['B12']}
def r3(i, t=b12a): return [t[PS][i], t[PK][i], t[P1][i]]
T614 = "\n".join([
 "| Measure, 2028-29 (household model, one basis) | P\\* | Targeted package | Part 1 |", "|---|---:|---:|---:|",
 row(['**Adults in households better off after the five taxes, any gain**'] + [f'**{x}**' for x in r3(6)]),
 row(['Adults in households better off after the taxes by A$5 a week or more'] + r3(8)),
 row(['**Households better off after the five taxes, any gain**'] + [f'**{x}**' for x in r3(2)]),
 row(['Households better off after the taxes by A$5 a week or more'] + r3(4)),
 row(['Households better off after the taxes, range across incidence variants'] + r3(9, b12)),
 row(['Adults in households gaining before the taxes, any gain'] + r3(5)),
 row(['Adults in households gaining before the taxes by A$5 a week or more'] + r3(7)),
 row(['Households gaining before the taxes, any gain'] + r3(1)),
 row(['Households gaining before the taxes by A$5 a week or more'] + r3(3)),
])
# ---- Table 6.15 from B11 and B16
b16 = {r[0]: r for r in BT['B16']}
hdr = ("| Household decile (equivalised disposable income, current rules) | Upper bound (A$ a year, equivalised) | Households (million) | **Five taxes borne, central (A$ a year)** | Lowest / highest of six allocations | Share of the five taxes (%) | P\\*: gain before the taxes | **P\\*: net after the taxes** | Gaining before / better off after / by A$5 a week or more / worse off after (%) | Memo: Part 1 net | Memo: package net |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
rows = []
for r in BT['B11']:
    d = b16[r[0]]
    rows.append(row([f'Decile {r[0]}', r[1] if r[1] != '–' else 'top', r[2], f'**{r[4]}**', f'{r[5]} / {r[6]}', r[9], d[1], f'**{d[3]}**', f'{d[4]} / {d[5]} / {d[6]} / {d[7]}', d[8], d[9]]))
T615 = hdr + '\n' + '\n'.join(rows)
# ---- Table 6.21 after-housing losers (B8)
hdr = ("| Household's main current payment | Households (million) | Part 1: worse off, million (share) | Part 1: people (million) | Part 1: average loss (A$ a year) | **P\\*: worse off, million (share)** | P\\*: people (million) | P\\*: average loss (A$ a year) | Package: worse off, million (share) | Package: people (million) | Package: average loss (A$ a year) |\n"
       "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
T621 = hdr + '\n' + '\n'.join(row(r[:4+1] + [f'**{r[5]}**'] + r[6:11]) for r in BT['B8'])
