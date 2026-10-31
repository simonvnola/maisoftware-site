import re, sys, os
BASE = os.path.dirname(os.path.abspath(__file__))
OPT = os.path.dirname(BASE)
L = open(os.path.join(OPT, 'paper_v22oct.md')).read().split('\n')
def F(name): return open(os.path.join(BASE, 'frag', name)).read().rstrip('\n') + '\n'

# ---------------- table label mapping (old -> new), applied to old text only
M = {}
for o, n in [('5.1','5.2'),('5.1a','5.3'),('5.1b','5.4'),('5.1c','5.5'),('5.2','5.6'),('5.4i','5.7'),('5.4h','5.8'),
             ('5.3','5.9'),('5.4','5.10'),('5.4a','5.11'),('5.4c','5.12'),('5.4g','5.13'),('5.5','5.14'),
             ('5.2a','10.1'),('5.2b','10.2'),('5.2c','10.3'),('5.4b','10.4'),('5.4d','10.5'),('5.4e','10.6'),('5.4f','10.7'),
             ('6.7a','10.8'),('6.1a','10.9'),('6.7b','10.10'),('6.7c','10.11'),('6.7d','10.12'),('6.7e','10.13'),('6.7g','10.14'),
             ('6.7h','10.15'),('6.7i','10.16'),('6.10a','10.17'),('6.14','10.18'),('6.14a','10.19'),('6.14b','10.20'),
             ('6.14c','10.21'),('6.14d','10.22'),('6.14e','10.23'),('6.14f','10.24'),('6.16a','10.25'),('6.24a','10.26'),('6.24b','10.27'),
             ('6.1d','6.1'),('6.1e','6.6'),('6.2','6.2'),('6.3','6.3'),('6.4','6.4'),('6.5','6.5'),('6.6','6.8'),('6.14g','6.10'),
             ('6.33','6.11'),('6.34','6.13'),('6.21','6.16'),('6.22','6.17'),('6.22a','6.18'),('6.20','6.19'),('6.23','6.20'),
             ('6.24','6.22'),('6.24c','6.23'),('6.24d','6.24'),('6.24e','6.25'),('6.25','6.26'),('6.26','6.27'),('6.27','6.28'),
             ('6.28','6.29'),('6.29','6.30'),('6.30','6.31'),('6.31','6.32'),('6.32','6.33'),
             ('6.1','6.34'),('6.1b','6.35'),('6.1c','6.36'),('6.7','6.37'),('6.7f','6.38'),('6.8','6.39'),('6.9','6.40'),
             ('6.10','6.41'),('6.11','6.42'),('6.12','6.43'),('6.13','6.44'),('6.15','6.45'),('6.16','6.46'),('6.17','6.47'),
             ('6.17a','6.48'),('6.18','6.49'),('6.18a','6.50'),('6.18b','6.51'),('6.18c','6.52'),('6.18d','6.53'),('6.19','6.54'),
             ('6.35','6.55'),('10.1','11.1'),('10.2','11.2'),('10.3','11.3')]:
    M[o] = n
IDENT = re.compile(r'^(1\.1|2\.[123]|3\.1|4\.[123]|7\.[12]|8\.[1-5]|9\.[1-7])$')
unmapped = set()
REF = re.compile(r'(\d{1,2}\.\d{1,2}[a-z]?)')
LIST = re.compile(r'(Tables?\s+)((?:\d{1,2}\.\d{1,2}[a-z]?(?:\s*\(continued\))?(?:\'s)?(?:,\s*(?:and\s+)?|\s+and\s+|\s+to\s+|\s+or\s+)?)+)')
def mapref(m):
    r = m.group(1)
    if r in M: return M[r]
    if IDENT.match(r): return r
    unmapped.add(r); return r
def map_refs(t):
    return LIST.sub(lambda m: m.group(1) + REF.sub(mapref, m.group(2)), t)
def sec_refs(t):
    t = re.sub(r'Section 10\b', 'Section 11', t)
    return t

def seg(a, b, reps=(), mapping=True):
    t = '\n'.join(L[a-1:b])
    if mapping: t = sec_refs(map_refs(t))
    for old, new in reps:
        mo = sec_refs(map_refs(old)) if mapping else old
        c = t.count(mo)
        if c != 1:
            print(f'REPLACE FAIL ({c}) in {a}-{b}: {old[:90]!r}', file=sys.stderr); sys.exit(1)
        t = t.replace(mo, new)
    return t.rstrip('\n') + '\n'

out = []
def add(x): out.append(x.rstrip('\n') + '\n\n')

YEARS = [f'{y}-{str(y+1)[2:]}' for y in range(2026, 2046)]
def k(y): return y.replace('-', '_')
def row(cells): return '| ' + ' | '.join(cells) + ' |'

# ======================= FRONT MATTER AND CHAPTER 1
add(F('01_front_ch1.md'))

# ======================= CHAPTER 2
ch2a = seg(52, 72, [
 ("Government should prepare now, because AI is advancing quickly and the safety net already leaves millions in poverty, though the evidence on AI's first job effects is mixed. The evidence of mass job loss is not yet in, which is why the paper proposes a staged and tested response.",
  "Government should act now on the safety net, which already leaves millions in poverty, and prepare for AI, which is advancing quickly but has not yet displaced workers across the economy. That difference is why the paper proposes a targeted floor now and only tests for anything universal."),
])
add(ch2a)
add(F('02_ch2_young.md'))
ch2b = seg(80, 191, [
 ("| Stanford Digital Economy Lab (2026) [S26] | Young workers in exposed jobs 19% behind peers, mainly through less hiring | Observational (payroll data); working paper | **Moderate.** Descriptive, not causal; United States only |",
  "| Stanford Digital Economy Lab (2026) [S26, S_CANARIES] | Young workers in exposed jobs 19% behind peers, mainly through less hiring | Observational (payroll data); working paper | **Moderate.** Descriptive, not causal; United States only |\n| Yale Budget Lab (n.d.) [S_YALE26] | Occupational mix not yet changing with AI | Observational | **Moderate.** United States only |\n| Danish data (n.d.) [S_DANISH] | Effects above 2% ruled out | Observational | **Moderate.** One country |"),
 ("The ABI has seven numbered objectives, each with a measurable indicator, a baseline and a target date (Table 2.2). The targets are the household model's first-round rates with Stage 1 continuing, rounded up to the next half point.",
  "The proposal has seven numbered objectives, each with a measurable indicator, a baseline and a target date (Table 2.2). The poverty targets were set on the 22 October design's first-round rates with Stage 1 continuing, rounded up to the next half point; P\\* is modelled below them (10.5% for all persons and 6.6% for children in 2028-29; Table 5.7), so the recommended design meets them with more room."),
 ("Objective 2's targets are what the model supports, though it fits that group poorly, and objectives 3(a), 6(b) and 7(a) apply only if Parliament chooses a dividend.",
  "Objective 2's targets are what the model supports, though it fits that group poorly, and objectives 3(a), 6(b), 7(a) and 7(b) apply only if Parliament later legislates a dividend (Section 10)."),
 ("**Table 2.2. Objectives of the Australian Basic Income,", "**Table 2.2. Objectives of the proposal,"),
 ("| 4 | Leave no current recipient worse off | Share of protected recipients, and of families now receiving Family Tax Benefit, with lower net income than under current rules | Not applicable | 0% in every year from 2028-29 | Department of Social Services (DSS); national audit |",
  "| 4 | Pay no current recipient less, and count who is worse off after housing costs | (a) Share of protected recipients, and of families now receiving Family Tax Benefit, paid less than under current rules (the cash guarantee); (b) recipient households with lower income after housing costs than under current rules | Not applicable | (a) 0% in every year from 2028-29; (b) reported each year by payment and tenure (modelled: {{PSTAR_AHC_LOSER_SHARE}} of recipient households in 2028-29, Table 6.21), with Rent Assistance reviewed if it rises | Department of Social Services (DSS); AIHW; national audit |"),
 ("| (a) On central yields, nil to 2043-44 and no more than A$16.5bn a year to 2045-46 for Part 1 alone; with the wealth-tax fund, nil to 2038-39 and no more than 0.41% of market income, and with the Budget-paid dividend nil to 2039-40 and no more than A$22.1bn a year (Table 5.4d); (b) not spent on the dividend, and the interaction line charged to it after the guarantee lapses reported each year; (c) net financial worth not below baseline once the start-up advance is repaid in 2031-32 (with Part 1 alone it is A$20.6bn, A$18.6bn and A$7.5bn below at 30 June 2029, 2030 and 2031); the PBO certifies any fund's payout and the other taxes each year |",
  "| (a) On central yields, nil before {{PSTAR_FIRST_LEVY_CENTRAL}} and no more than {{PSTAR_LARGEST_LEVY_TO_2045_46}} a year to 2045-46 (Table 6.6), with the joint stress test's range reported each Budget (Table 6.9); (b) only if a fund is later legislated: not spent on the dividend; (c) net financial worth not below baseline once the 2028-29 borrowing is repaid in {{PSTAR_ADVANCE_REPAID_YEAR}}; the PBO certifies the five taxes against Stage 1's costs each year |"),
 ("| (a) Every year from 2029-30; (b) from 2033-34,", "| (a) and (b) only if a dividend is later legislated: (a) every year from its first; (b) from 2033-34,"),
 ("Objective 1(b) is set on the central calibration;", "The targets were set on Part 1's run; P\\*'s modelled rates are lower (Table 5.7). Objective 1(b) is set on the central calibration;"),
 ("If Stage 2 is triggered, Parliament sets new targets at the vote.", "If a later Act legislates a universal payment, Parliament sets new targets then."),
 ("The ABI removes estimate debts from most family payments, and any dividend would have no means test, but keeps the activity test at the floor, so this failure is reduced, not removed.",
  "Stage 1 removes estimate debts from most family payments but keeps the activity test at the floor, so this failure is reduced, not removed."),
 ("The paper asks whether and how Australia should legislate a basic income for the AI transition, through four questions of its own:",
  "The paper asks how Australia should prepare a basic income for the AI transition, through four questions of its own:"),
 ("| Sections 3, 4 and 5 (Tables 3.1, 4.1 to 4.3, 5.2b, 5.2c, 5.3, 5.4 to 5.4c and 5.5) | A 2045 picture that needs displacement, a Stage 2 vote and AI-driven growth; status quo, the strongest targeted package, a floor-first option, negative income tax, job guarantee and the staged ABI on common criteria, at equal budget and equal outcome; four Part 2 options with their pros and cons; four child-payment tapers, tested in a supplementary table |",
  "| Sections 3, 4, 5 and 10 (Tables 3.1, 4.1 to 4.3, 5.7, 5.9 to 5.14, 10.2 and 10.3) | A 2045 picture that needs the pathway to be triggered; P\\*, the targeted package and Part 1 at equal budget, with the status quo, a floor-first option, negative income tax and a job guarantee on common criteria; four dividend options with their pros and cons, none recommended; four child-payment tapers, tested in a supplementary table |"),
 ("| Section 6 (Tables 6.1 to 6.35, including 6.1a, 6.7a to 6.7f, 6.14a, 6.14b, 6.17a, 6.18b, 6.24a and 6.24b) | Stage 1's floor and child payment paid by five taxes and a Budget advance, with a levy from 2044-45 on central yields, and any Part 2 dividend by the option Parliament chooses; a full basic income not fundable from income tax on central assumptions, so Stage 3 carries no rate; monetised net benefit negative at every stage once financing is counted; poverty falls; gains and losses by household, decile, payment, tenure and region, before and after funding, in one year and over 2028-29 to 2045-46 |",
  "| Section 6 (Tables 6.1 to 6.55) | P\\* paid by five taxes and borrowing in its first year, with a levy from {{PSTAR_FIRST_LEVY_CENTRAL}} on central yields and a joint stress test of that date; a full basic income not fundable from income tax on central assumptions, so Stage 3 is not authorised; monetised net benefit negative for every Stage 1 design and every stage on the complete accounting, with each design's break-even weight; poverty falls; gains and losses after and before the five taxes by household, decile, payment, tenure and region, including households worse off after housing costs |"),
 ("changes made after independent assessment, an adversarial review and nine red teams,", "changes made after independent assessment, an adversarial review, red teams and an external critique,"),
 ("| Sections 5, 6 and 7 (Tables 5.3, 6.7a, 7.1 and 7.2; Figure 7.1) | Staged ABI with a floor and a child payment, Stage 1 continuing unless a stage is triggered, and Part 2's dividend left to Parliament as options; dated roadmap, legislation and agencies |",
  "| Sections 5, 6 and 7 (Tables 5.7, 5.9, 5.15, 7.1 and 7.2; Figure 7.1) | P\\* as Stage 1; the targeted package as the alternative if Parliament weights poverty above work incentives; Part 1 rejected, with its price; the universal pathway's tests legislated, no rates; no dividend now; dated roadmap, legislation and agencies |"),
])
add(ch2b)

# ======================= CHAPTER 3
add(F('03_ch3_intro.md'))
add(seg(203, 249, [
 ("but Carer Payment is above the Stage 2 rate,", "but Carer Payment is above the universal rate,"),
 ("His Age Pension is above the Stage 2 rate,", "His Age Pension is above the universal rate,"),
 ("Before the vote she paid a small levy and then the interest on a loan from the fund, and from July 2035 every income-tax rate rose by 25.5 points (Tables 6.18d and 6.7f).",
  "Before the new Act she paid a small levy, and from July 2035 every income-tax rate rose by about 25 to 27 points (Tables 6.38 and 6.52)."),
 ("and Stage 2 began only in July 2035.", "and the universal payment began only in July 2035."),
 ("The basic income stays unconditional, but two voluntary measures support objective 7 (Table 2.2).",
  "A universal payment would stay unconditional. Two voluntary measures, which the paper proposes now, support objective 7 (Table 2.2)."),
]))

# ======================= CHAPTER 4
add(seg(251, 339, [
 ("and how the ABI design responds**", "and how the design responds**"),
 ("| Participation down 4.2 points; hours down 1.3 a week;", "| Participation down 3.9 points (4.2 in the first version); hours down 1.3 a week;"),
 ("The design responds by starting small, lifting the lowest payments first, taxing the universal payment and testing before each larger step.",
  "The design responds by targeting Stage 1, lifting the lowest payments first and testing before any universal step."),
 ("A World Bank study of 10 countries found existing programs on average about 60% more effective in reducing poverty than a budget-neutral basic income [S105].",
  "A World Bank study of 10 countries found existing programs on average about 60% more effective in reducing poverty than a budget-neutral basic income [S105], and the OECD found that a budget-neutral basic income would raise poverty [S_OECD17]."),
 ("Recipients cut their labour-force participation by 4.2 percentage points,", "Recipients cut their labour-force participation by 3.9 percentage points in the trial's latest revision (4.2 in its first version),"),
 ("| OpenResearch: participation down 4.2 points, hours down 1.3 a week, non-transfer income down about US$1,900 a year [S82, S83] | RCT; strong | Work falls, modestly but really | Costing assumes market income falls 16 cents per dollar of gain; Stage 1 is small; Australian trial before Stage 2, and Stage 2 stays at the floor if participation falls more than 3 points; on the costed response that cap binds with probability 0.86 to 0.91, so Stage 2 is not the expected outcome (Section 5) |",
  "| OpenResearch: participation down 3.9 points, hours down 1.3 a week, non-transfer income down about US$1,900 a year [S82, S83] | RCT; strong | Work falls, modestly but really | Costing assumes market income falls 16 cents per dollar of gain; Stage 1 is targeted and keeps the activity test; no universal payment without an Australian trial, and none if participation falls more than 3 points; that cap binds with probability 0.86 to 0.91 at the trial's earlier 4.2-point estimate and {{WORK_CAP_ODDS_AT_3_9}} at 3.9 points, so a universal payment is not the expected outcome (Section 5) |"),
 ("| The dividend is not withdrawn on finding work; the floor's caseload response, including people who leave work and return to payment, is costed; labour-market trigger and Parliamentary vote before Stage 2 |",
  "| The floor's caseload response, including people who leave work and return to payment, is costed; a universal payment needs the need test, the trial and a later Act |"),
 ("| The ABI is not budget-neutral; working-age payments lifted to the floor; no-worse-off rule; top-ups kept |",
  "| Stage 1 is targeted and not budget-neutral; working-age payments lifted to the floor; no payment cut under today's rules [S_OECD17] |"),
 ("| Conceded: at the same budget the strongest targeted package, charged its own responses, cuts household poverty by 2.4 points more on the relative line than Part 1, with or without a dividend (Table 5.4c) |",
  "| Accepted: this is why Stage 1 is targeted. At the same budget P\\* leaves poverty at 10.5% and the targeted package at 9.0%, against 11.3% for Part 1, the design with a universal-leaning supplement (Table 5.7) |"),
 ("| High-response case tested; Stage 3 only after Australian evidence |", "| High-response case tested; Stage 3 described, not authorised |"),
 ("| Rent capture tested (Table 6.30); the rent safeguard raises Rent Assistance and defers the next stage |",
  "| Rent Assistance +75% in Stage 1; rent capture tested (Table 6.31); the rent safeguard raises Rent Assistance further |"),
 ("| At Stage 1 any dividend is paid once a year but is small (A$47 to A$461); a later stage would be paid each fortnight |",
  "| No lump sums: Stage 1 is paid each fortnight through existing payments, and so would any later universal payment |"),
 ("| The ABI is permanent; stages only increase it |", "| Stage 1 is permanent; it is not a temporary payment |"),
 ("| Staging; PBO certification; Stage 3 legislated only as an authority with no rate, because no rate passes its certificate |",
  "| No universal rate legislated; a PBO certificate before any; Stage 3 described, not authorised, because no rate passes its certificate |"),
 ("A dividend would not depend on income, and the child payment is set by last year's income, though about 49,500 families a year still owe a debt after an income-fall review (Table 5.1b).",
  "The child payment is set by last year's income, though on Part 1's run about 49,500 families a year still owe a debt after an income-fall review (Table 5.4); P\\*'s figure is essentially the same."),
 ("and no trial has measured the effect of the taxes.",
  "and no trial has measured the effect of the taxes. No trial has tested what decides the question: paying everyone in a market, raising the taxes to fund it, and keeping it going for good. Where universal cash has been paid for years from volatile revenue it has been cut or eroded: Alaska halved its dividend in 2016, and its 2025 dividend was its smallest in real terms [S99, S_ALASKA25]."),
]))

# ======================= CHAPTER 5
add(F('05a_ch5_stage1.md').rstrip('\n'))
add(seg(351, 351))
add(F('05b_ch5_rates_child.md'))
add(seg(373, 440, [
 ("**Table 5.1a. Who the child payment reaches: a universal supplement against the proposed rule, Stage 1, 2028-29",
  "**Table 5.3. Who the child payment reaches: a universal supplement against Part 1's rule, Stage 1, 2028-29"),
 ("| Who the child payment reaches (Stage 1, 2028-29) | Universal supplement (before the rule) | Proposed rule: means test and tapered FTB-equivalent amount |",
  "| Who the child payment reaches (Stage 1, 2028-29) | Universal supplement (before the rule) | Part 1's rule: means test and tapered FTB-equivalent amount |"),
 ("**Table 5.1a (continued). The rule's two parts separately and together: cost and poverty, Stage 1, 2028-29",
  "**Table 5.3 (continued). Part 1's rule, its two parts separately and together: cost and poverty, Stage 1, 2028-29"),
 ("| **The child payment rule: both schedules, each withdrawn at 18c** |", "| **Part 1's child payment rule: both schedules, each withdrawn at 18c** |"),
 ("Note: household cash, synthetic population; poverty after housing costs; the cost change is against a universal supplement of A$7,452 a child.*",
  "Note: household cash, synthetic population; poverty after housing costs; the cost change is against a universal supplement of A$7,452 a child. P\\* keeps the tapered FTB-equivalent schedule and drops the means-tested supplement-only schedule (Table 5.7).*"),
 ("**Table 5.1b. The child payment rule: cliffs, withdrawal rates, work incentives, families tested and debts, Stage 1, 2028-29",
  "**Table 5.4. Part 1's child payment rule: cliffs, withdrawal rates, work incentives, families tested and debts, Stage 1, 2028-29"),
 ("| Item | Proposed rule |", "| Item | Part 1's rule (P\\* keeps its first schedule) |"),
 ("**Table 5.1c. Child payment under the proposed rule: fiscal cost every year,", "**Table 5.5. Part 1's child payment: fiscal cost every year,"),
 ("Note: the timing and response columns are Table 6.1a's cells.", "Note: Part 1's design; P\\*'s child payment is in Table 6.1. The timing and response columns match Table 10.9."),
]))
add(F('05c_ch5_replaced_gains.md'))
add(seg(717, 742, [
 ("**Table 5.4h. The child payment against the targeted package's child component:", "**Table 5.8. Part 1's child payment against the targeted package's child component:"),
]))

# ---- Table 5.9 (old 5.3 with P* and Part 1 columns rewritten)
old53 = [l for l in L[570:582]]
hdr = "| Criterion | **P\\*: floor, child payment without the middle-income supplement, Rent Assistance +75% (recommended)** | Strongest targeted package (the alternative) | Part 1: floor and child payment with the middle-income supplement (rejected) | Floor first, adult payment on standby | Status quo | Negative income tax | Job guarantee |"
sep = "|---|---|---|---|---|---|---|---|"
P = {
 'Adequacy': ("**Strong** for allowance recipients, renters and low-income families: the floor, the child payment and Rent Assistance +75%; nothing for adults not on a payment",
              "**Moderate to strong** for allowance recipients and families; middle-income families also get the supplement; no Rent Assistance rise"),
 'Poverty': ("**Strong.** 10.5% charged its own responses and the income effect; child poverty 6.6%; 67 and over 11.6%; Disability Support Pension households 52.6% (Table 5.7)",
             "**Moderate.** 11.3% (11.3% to 11.8% across pensioners' other incomes); child poverty 7.2%; 0.8 points more poverty than P\\* and 2.2 to 2.4 points more than the package"),
 'Coverage': ("**Moderate.** 62.1% of households and 77.4% of private renters gain before the five taxes; 35.4% are better off after them; claims needed, as for FTB",
              "**Moderate.** 59.5% of households and 67.4% of private renters gain before the five taxes; 32.8% better off after them"),
 'Work': ("**Moderate.** Part 1's 18-cent taper: 14.7% of higher earners in families with children above a 50% EMTR and 1.3% at 60% or more; second earners' mean participation tax rate 33.0%, none at 60% or more (Table 5.7)",
          "**Moderate.** 15.2% of higher earners above 50% and 1.5% at 60% or more; second earners' mean participation tax rate 32.9% (Tables 5.7 and 5.8)"),
 'Admin': ("**Moderate.** Child payment assessed on past income, leaving about 49,500 residual debts a year; the floor keeps the activity test, its suspensions and the income test",
           "**Moderate.** Child payment assessed on past income, leaving about 49,500 residual debts a year; the floor keeps the activity test, its suspensions and the income test"),
 'Static': ("Not costed separately: set at Part 1's cost on the fiscal model's basis, with responses (next row)", "A$50.2bn static with the 22 October dividend's first payment (Table 5.14)"),
 'Behav': ("A$62.0bn in 2028-29 on the cash path (Table 6.1), the same as Part 1; own behavioural costs A$11.2bn (Table 5.7)",
           "A$62.0bn in 2028-29 on the cash path, with the caseload (A$6.0bn) and taper and income-effect (A$6.1bn) responses (Table 6.1, memo)"),
 'Resil': ("**Moderate.** The floor and child payment keep their indexation in a displacement, with a levy meeting the gap; the floor reaches displaced singles and partnered workers whose partner earns under its cut-out (49% of partnered earners have a partner above it); the pathway's tests are legislated, so a later Act can move quickly if they are met",
           "**Moderate.** As P\\*; on the 22 October run the levy in a severe shock reaches 1.96% of market income in 2034-35 and 6.17% by 2045-46 (Table 6.51)"),
 'Durab': ("**Moderate.** Visible gains for recipients, renters and families and no change to the tax scale; after the taxes 64.6% of households are worse off on the central allocation",
           "**Moderate.** Visible gains for recipients and families; after the taxes 67% of households are worse off on the central allocation, about 30% to 70% across incidence variants"),
 'Overall': ("**Recommended Stage 1.** 0.20 million fewer people in poverty than Part 1 and A$1.5bn to A$1.8bn a year more net benefit; far fewer very high effective tax rates than the package",
             "**Rejected.** Pays the middle-income supplement a universal Stage 2 would pay every child; its price is 0.20 million more people in poverty than P\\* and A$1.5bn to A$1.8bn a year, to save at most A$0.09bn to A$0.37bn in expectation"),
}
keys = ['Adequacy','Poverty','Coverage','Work','Admin','Static','Behav','Resil','Durab','Overall']
rows53 = []
for line, key in zip(L[572:582], keys):
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    crit, sq, pkg, floor, nit, jg, abi = c
    crit, sq, pkg, floor, nit, jg = [map_refs(x) for x in (crit, sq, pkg, floor, nit, jg)]
    if key == 'Poverty':
        pkg = pkg + "; 9.0% charged the same income effect as Part 1 (Table 5.7)"
    if key == 'Overall':
        crit = '**Overall**'
        pkg = "**The alternative**, if Parliament weights poverty above work incentives: the lowest poverty (0.40 million fewer people in poverty than P\\*), but 14.2% of higher earners and 6.8% of second earners at 60% or more, and a levy from 2040-41 (Table 5.7)"
    pst, p1 = P[key]
    rows53.append(row([crit, pst, pkg, p1, floor, sq, nit, jg]))
add("### Options compared\n\nTable 5.9 compares P\\*, the targeted package and Part 1 with four other options on common criteria. Tables 5.10 to 5.14 give the equal-budget comparisons in detail.")
add("**Table 5.9. Seven options compared on common criteria, as at 2026, with fiscal cost in 2028-29 (ratings: strong, moderate, weak; A$ billion, nominal)**\n\n" + hdr + "\n" + sep + "\n" + "\n".join(rows53) + "\n\n" +
    "*Source: author's assessment using the sources cited; fiscal costs from the author's modelling [S5]. Note: EMTR = effective marginal tax rate. The strongest targeted package and the floor-first option are defined under Tables 5.10 and 5.11, and the negative income tax under Table 5.14. 'Static' means no caseload, labour or taper response. Job guarantee: half of the 732,000 unemployed people in September 2026 [S28] take a job at the national minimum wage of A$1,004.90 a week [S53], grown to 2028-29, with 42% on-costs, less JobSeeker saved and income tax paid. The PBO costed the raise-the-rate policy from 2025-26; re-timing its first-year cost to 2028-29 by the nominal GDP factor used for the revenue measures gives A$24.1bn, while the PBO's own figure for 2028-29 is A$27.2bn. P\\*'s and Part 1's cells are revised for this paper; the other columns are the 22 October paper's.*")
add(F('05d_ch5_price.md'))
add(seg(598, 618))
add(seg(620, 630))
add(seg(645, 653))
add(seg(694, 715))
add(seg(765, 781))
add(F('05e_ch5_guarantee_pathway.md'))

exec(open(os.path.join(BASE,'build2.py')).read())
