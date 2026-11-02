# part 3: chapters 7 to 11, sources, tokens (executed inside build.py's namespace)
def seg_lines(a, b, over=None, after=None, reps=()):
    over = over or {}; after = after or {}
    outl = []
    for i in range(a, b + 1):
        if i in over:
            if over[i] is not None: outl.append(over[i])
        else:
            outl.append(sec_refs(map_refs(L[i-1])))
        if i in after: outl.append(after[i])
    t = '\n'.join(outl).replace('| Before any Stage 2 vote |', '| Before any Bill setting a universal rate |')
    for old, new in reps:
        mo = sec_refs(map_refs(old)); c = t.count(mo)
        if c != 1:
            print(f'REPLACE FAIL ({c}) in {a}-{b}: {old[:90]!r}', file=sys.stderr); sys.exit(1)
        t = t.replace(mo, new)
    return t.rstrip('\n') + '\n'

# ======================= CHAPTER 7
add(seg(2456, 2468, [
 ("## 7. Implementation pathway", "## 7. Implementation pathway"),
 ("The ABI can start on 1 July 2028 if Parliament passes the main laws by December 2027 and the payment systems are built and tested in the first half of 2028. Stage 2 follows only after the need test is met, a fresh PBO certificate and a vote; Stage 3 would need a later Act setting its rate. The binding safeguards in Table 9.6 can then lower, cap, defer or correct a stage without further legislation.",
  "Stage 1 can start on 1 July 2028 if Parliament passes the main laws by December 2027 and the payment systems are built and tested in the first half of 2028. A universal payment could follow only under a later Act, introduced after the need test is met, the trial has reported within its work-effort cap and the PBO has certified the funding. The binding safeguards in Table 9.6 then correct Stage 1's funding without further legislation."),
 ("Figure 7.1 draws the seven rollout phases, their owners and 17 numbered gates and milestones; each phase must pass its gate before the next starts.",
  "Figure 7.1 draws the seven phases of Stage 1 and its tests, their owners and 17 numbered gates and milestones from Tables 7.1, 7.2, 9.1 and 9.6, with a dashed row for any universal payment, which would need a later Act. Each of the first three phases must pass its gate before the next starts."),
 ("Note: on the central path Stage 1 continues to 2045-46: the floor and child payment start on 1 July 2028, the first dividend is paid in 2029-30, and the PBO certifies the fund's payout and the durable taxes every year (gate 12 marks the certificate of 30 June 2033). The Stage 2 bar shows the earliest start, only if gate 11 is passed. Stage 3 is an authority with no rate; its bar shows the earliest start under a later Act and certificate (gate 14). The Stage 2 and 3 authorities lapse unless renewed (gates 16 and 17); Stage 1 and the fund continue.*",
  "Note: the seven phases are the inquiry and consultation, legislation, build and test, Stage 1 (P\\*) from 1 July 2028, the randomised trial from July 2029 to June 2031, quarterly need-test reporting to 30 June 2043, when the pathway's tests lapse unless renewed, and the PBO's yearly certificate of the five taxes from 2029-30. The dashed row shows that any universal payment would need a later Act, not before 1 July 2032 and only after the need test, the trial and the PBO certificate are all met; it is not scheduled.*"),
]))
add("### Legislation to enact or amend")
oldtax = '\n'.join(sec_refs(map_refs(L[i-1])) for i in (2489, 2490, 2492, 2493, 2494))
add(F('07_table71.md').replace('<<OLD_TAX_ROWS>>', oldtax))
add(seg(2500, 2540, [
 ("| Leads the ABI Act and revenue measures and, if a fund option is chosen, the Permanent AI Dividend Fund; reports fiscal effects in each Budget;",
  "| Leads the ABI Act and revenue measures; reports fiscal effects in each Budget, including the kept surpluses and any levy;"),
 ("| Owns ABI policy, the child supplement and the no-worse-off rule;", "| Owns Stage 1 policy, the child payment and the cash guarantee;"),
 ("| Pays the dividend once a year to people who do not lodge a return, once they enrol, and the child payment and top-ups; runs enrolment through myGov and reports take-up; applies the waiting periods | Systems live 1 July 2028; first dividends in 2029-30 |",
  "| Pays the floor, the child payment and Rent Assistance; reports take-up; applies the waiting periods; builds the payment system that can reach every adult and runs the surge protocol in a declared displacement, with a published surge plan and service standard | Systems live 1 July 2028; surge plan by 1 July 2028 |"),
 ("| Credits any dividend once a year as a refundable offset when returns are assessed; administers revenue measures; supplies income data | Offset in 2029-30 assessments; no new withholding schedules for Stage 1 |",
  "| Administers the five durable taxes; supplies the assessed income on which the child payment is paid; in a declared displacement passes Single Touch Payroll records of workers whose pay has stopped to Services Australia | No new withholding schedules for Stage 1; surge data-sharing live by 1 July 2028 |"),
 ("| Full costing; certifies any fund's payout and the durable taxes against Stage 1's costs each year, and funding before each later stage, under a stress test for Stage 3 | Costing by 31 August 2027; first certificate in 2029-30, then each year; certificates before any Stage 2 vote or Stage 3 rate Act |",
  "| Full costing of P\\* and the targeted package; certifies the five durable taxes against Stage 1's costs each year, and the funding of any universal rate proposed after the tests, under a stress test for a payment at the Age Pension rate | Costing by 31 August 2027; first certificate in 2029-30, then each year; a certificate before any Bill setting a universal rate |"),
 ("| If a fund option is chosen, reports the fund in the Budget on the Future Fund's basis | Any fund opens 1 July 2028 |",
  "| Reports Stage 1's effect on the cash balance, net debt and net financial worth | Each Budget from 2028-29 |"),
 ("| Audits delivery and the no-worse-off rule |", "| Audits delivery and the cash guarantee |"),
 ("The ABI never reduces a retained payment. The DSP top-up, carer payments and supplements, Commonwealth Rent Assistance, Remote Area Allowance, the National Disability Insurance Scheme (NDIS) and Paid Parental Leave all continue, and their income tests ignore any dividend (Table 7.1).",
  "Stage 1 never reduces a retained payment. Pensions, carer payments and supplements, Commonwealth Rent Assistance (which rises), Remote Area Allowance, the National Disability Insurance Scheme (NDIS) and Paid Parental Leave all continue."),
 ("The tax scale is unchanged, so Stage 1 needs no new withholding schedules. Any dividend is paid once a year, to lodgers at assessment and to non-lodgers by Services Australia once they enrol. The extended Recipient Protection Offset is applied through withholding where Services Australia pays a protected recipient and through assessment for other income. Rent Assistance",
  "The tax scale is unchanged, so Stage 1 needs no new withholding schedules. Rent Assistance"),
 ("If states count the dividend as income, public tenants lose part of their gain,", "If states count higher payments as income for public housing rents, public tenants lose part of their gain,"),
 ("Every person moving to the ABI keeps these protections.", "Every person affected by Stage 1 keeps these protections."),
 ("1. Every person receiving a replaced payment on 30 June 2028, and every later claimant who meets its tests, receives at least the net income that current rules would give, including the tax on other income and current FTB.",
  "1. Every person receiving a payment Stage 1 changes on 30 June 2028, and every later claimant who meets its tests, is paid at least what current rules would pay, including current FTB. This protects payments, not income after housing costs (Table 6.21)."),
 ("5. Every adult affected receives a written statement of any dividend, floor or top-up, and their tax change before the first payment.",
  "5. Every person affected receives a written statement of their floor, child payment or Rent Assistance change before the first payment."),
 ("The ABI runs on existing tax and myGov systems: payments go to the bank account people already use for tax refunds or Centrelink, and enrolment uses ATO and Medicare records.",
  "Stage 1 runs on existing payment, tax and myGov systems: payments go to the bank account people already use for Centrelink, and the child payment uses ATO assessed income."),
 ("need assisted enrolment designed with First Nations organisations (Table 7.2), and the Act excludes the dividend from income management.",
  "need assisted claims designed with First Nations organisations (Table 7.2)."),
]))
add(F('07_surge.md'))

# ======================= CHAPTER 8
riskrows = {}
for line in F('08_risks.md').strip().split('\n'):
    riskrows[int(cells(line)[0])] = line
over = {}
for i in range(2554, 2575):
    n = int(cells(L[i-1])[0]) if False else int(L[i-1].split('|')[1].strip())
    if n in riskrows: over[i] = riskrows[n]
add(seg_lines(2542, 2576, over=over, after={2575: F('08_risks_extra.md').rstrip('\n')}, reps=[
 ("Most risks are met by a test before each larger step and a binding safeguard after it. The fund's return is met only by a review, and for Stage 3 no rate rise would be enough.",
  "Most risks are met by a test before any universal step and a binding safeguard once Stage 1 starts. Two are not: the five taxes may fall short sooner than the central path shows, and no rate rise would fund a payment at the Age Pension rate."),
 ("Of the 21 risks in Table 8.1, the three that could most change the funding are a shortfall in the six taxes,", "Of the 24 risks in Table 8.1, the three that could most change the funding are a shortfall in the five taxes,"),
 ("and set a second earner's participation tax rate at 38% at Stage 1 (Table 5.1b);",
  "and, on Part 1's run, whose taper P\\* keeps, set a second earner's participation tax rate at 38% (Table 5.4); under P\\* second earners' mean participation tax rate is 33.0% (Table 5.7);"),
 ("On the relative line, Stage 1's result for people aged 67 and over", "On the relative line, Stage 1's result for people aged 67 and over (11.6% under P\\*, Table 5.7)"),
]))
add(F('08_objections.md'))
rt = F('08b_redteams.md'); i = rt.index('**Table 8.6.')
add(rt[:i])
add(seg(2612, 2676))
add(rt[i:])

# ======================= CHAPTER 9
add(F('09_conclusion_recs.md'))
over9 = {
 2793: "| Household poverty after housing costs, all persons (relative line, as ACOSS–UNSW publish) | 14.2% (2022-23, latest available) [S37] | 12.0% by 2030-31 and 12.5% by 2034-35 (modelled: 10.5% with P\\* in 2028-29, Table 5.7; 11.3% to 11.8% with Part 1 across pensioners' other incomes, Tables 6.22 and 6.23); new targets set by any later Act | ACOSS–UNSW; ABS income surveys, funded for 2028-29 and 2030-31 and published within 12 months | Every 2 years | Productivity Commission review 2031 |",
 2800: "| Take-up of the floor and the child payment | Not applicable | 100% of eligible working-age recipients by 30 June 2029; child payment take-up among families newly eligible reported | Services Australia; ATO | Quarterly | ANAO audit 2029-30 |",
 2806: "| Participation effect in the embedded trial (working-age adults not receiving a payment) | OpenResearch: −3.9 points [S82] | Binding limit: a fall of more than 3 points among low-income participants, with the lower end of its 90% confidence interval above 1 point, rules out a universal payment under the Act (Table 9.6) | University consortium chosen by DSS open tender | End of trial | December 2031 |",
 2807: "| Five durable taxes against Stage 1's costs | Table 6.6 | Kept surpluses drawn before any levy; any gap levied; the joint stress test's range reported (Table 6.9) | PBO | Annual | Each Budget |",
 2808: None,
 2809: "| Poverty after housing costs among people aged 67 and over and in households relying on the Disability Support Pension, relative and anchored lines | 11.1% and 63.6% (household model, 2028-29) | Reported; no target until full-rate pensioners' assessed income is measured (modelled with P\\*: 11.6% and 52.6%, Table 5.7; at 67 and over 12.1% to 13.5% with Part 1, Table 6.23) | ACOSS–UNSW; ABS; DSS | Every 2 years | Before any Bill setting a universal rate |",
 2810: "| Underlying cash balance, net debt and net financial worth against baseline | Figure 6.3 | Net financial worth not below baseline once the 2028-29 borrowing is repaid in {{PSTAR_ADVANCE_REPAID_YEAR}} | PBO; Treasury | Annual | Each Budget |",
 2803: "| Employment-to-population ratio, all adults (a risk indicator, not a target) | 63.6% (September 2026) [S28] | No target (objective 5). Reported against Treasury's projection; a shortfall of more than 1 point is explained to Parliament with the need test's series, and changes no payment by itself | ABS Labour Force | Monthly | Annual Budget |",
 2814: "| Share of earning parents with an effective marginal tax rate above 50% | 14% (household model, current rules, 2028-29) | No more than 19% (objective 5, a guardrail that work pays) | ATO; Services Australia | Annual | Before 1 July 2028 and each Budget |",
 2815: "| Any dividend, only if one is later legislated | Nil (2026) | Set by the Act that legislates it (Section 10) | PBO; Treasury | Annual | Each Budget |",
 2825: None,
 2826: "| Durable account | PBO projection of the five durable taxes against Stage 1's costs, and of any surpluses kept as debt reduction at the debt rate | A shortfall once the kept surpluses are used up (expected, on central yields, from {{PSTAR_FIRST_LEVY_CENTRAL}}, with a 37% to 59% chance of one before 2034-35 in the joint stress test; the taxes fall short each year from {{PSTAR_FIRST_SHORTFALL_YEAR}}) | The Basic Income Levy is set from the next 1 July to the gap the kept surpluses no longer cover, never above it, unless Parliament legislates another measure within six months; the floor and child payment are never paused | PBO; Treasurer |",
 2827: "| Counter-cyclical rule | Youth unemployment leg of the need test, assessed over eight consecutive quarters | Met over eight quarters: a displacement is declared from the financial year that contains the eighth | The floor and child payment keep their indexation; the levy meets any gap; the PBO reports within three months on the funding of a universal payment on the trigger-timed path | PBO; Treasurer; JSA |",
 2828: "| Fiscal certificate for any universal payment | PBO costing of the proposed rate and projected funding against net cost, next four years | Funding at least equal to net cost in each year; for a payment at the Age Pension rate, also under a doubled taxpayer response and the combined downside, which no rate passes on any modelled path | Without a certificate no Bill setting a universal rate may be introduced; if the PBO's yield later proves lower, the later Act's own correction applies | PBO |",
 2829: None,
 2830: "| Need test | Youth unemployment, aged 15 to 24, and JSA's series for 22 to 29 year olds in the most and least AI-exposed occupations | Both, over the same 8 consecutive quarters: youth unemployment at least 3 points above the September 2026 level of 11.1%, and the exposed group's employment falling at least 5% relative to the least exposed | Without it, no Bill setting a universal rate may be introduced; productivity growth cannot substitute for it | JSA; ABS |",
 2831: "| Work-effort cap | Participation effect in the embedded trial, among at least 3,000 low-income working-age adults not receiving a payment, against a control group twice that size | A fall of more than 3 percentage points, with the lower end of its 90% confidence interval above 1 point | No Bill setting a universal rate may be introduced under the Act; Stage 1 continues | DSS; independent evaluator |",
 2832: "| Rent safeguard | Lower-quartile rents for new leases against wages; real income after housing costs of private renters in the lowest income fifth | Rents more than 2 points faster than wages over four quarters, or two consecutive years of real decline in that income | Maximum Rent Assistance rises by the gap between rent and wage growth, and any universal step is deferred by a year | Treasurer; Minister for Housing; ABS; AIHW |",
 2833: None,
 2834: None,
 2835: "| Review | Whole Act | 2031, 2036 and 2041 | Productivity Commission review; the pathway's tests lapse on 30 June 2043 unless Parliament renews them; Stage 1 continues | Productivity Commission; Parliament |",
}
after9 = {
 2813: "| Weekly face-to-face contact with family or friends, a measure of wellbeing | 53% (2025) [S62] | Reported; no target for Stage 1 (objective 7(d)); Table 3.1's 2045 aim of 68% assumes the universal pathway | ABS General Social Survey | Each survey | Productivity Commission reviews |",
 2754: "| 30 October 2026 | External critique of the 22 October paper and its website | Ten criticisms, led by a recommendation (Part 1) that the paper's own comparison did not support, a Budget advance not called borrowing, a narrow \"no one loses\" claim and a dividend illustrated throughout | Errors and claims corrected; the summary states the borrowing, the narrow appraisal, the cash-only guarantee, the households worse off after housing costs and the stress-test odds; objections reordered; Table 8.6 answers each criticism |\n| 31 October 2026 | The author's decision on the critique | Recommend the design the evidence favours now, and make the universal stages a tested, pre-committed pathway (option B of the revision plan) | P\\* recommended as Stage 1, the targeted package as the alternative and Part 1 rejected with its price (Section 5); the pathway's tests legislated with no rates and Stage 3 not authorised; the dividend options moved to Section 10, none recommended; the central path rebuilt on P\\* (Section 6) |",
 2798: "| Recipient households worse off after housing costs, by payment and tenure | {{PSTAR_AHC_LOSER_HOUSEHOLDS}} modelled with P\\* (2028-29; Table 6.21) | Reported each year; Rent Assistance reviewed if the number rises | DSS; AIHW; ABS | Annual | Each Budget |\n| Claims decided within the service standard (surge protocol) | Services Australia's standard, published before 1 July 2028 | The standard held in every quarter; in a declared displacement, provisional payment of claims that pass it and a report to Parliament each quarter | Services Australia | Quarterly; monthly in a declared displacement | ANAO audits |\n| Forced-sale share of annual dwelling sales | Set before 1 July 2028 from lenders' hardship and mortgagee-sale reports against the ABS count of dwelling transfers (560,005 in 2025-26) [S_ABS_TVD] | Reported; in a declared displacement, forced sales above 5% of annual dwelling sales, a placeholder threshold for the author to set, prompt a Treasury and APRA report within three months (Table 6.56) | Treasury; APRA; ABS; state revenue offices | Quarterly | Each Budget; any displacement report |",
}
add(seg_lines(2716, 2850, over=over9, after=after9, reps=[
 ("| Advice on adequacy and the no-worse-off rule |", "| Advice on adequacy and the cash guarantee |"),
 ("the no-worse-off rule would extend to them.", "the cash guarantee would extend to them."),
 ("| No role in starting a stage; changes the dividend, through the excess profits tax, and the size of the rate rise |", "| No role in starting a stage; changes the five taxes' yield and the size of any later rate rise |"),
 ("| Views on the Permanent AI Dividend Fund, the trigger design and the rate rise |", "| Views on the need test, the trial and any later dividend |"),
 ("| Evidence on how the excess profits tax and rate rises would affect investment and hiring |", "| Evidence on how the excess profits tax, a levy or any later rate rise would affect investment and hiring |"),
 ("Published positions, repeated independent assessment, an adversarial review and nine red teams have already changed the design (Table 9.3),",
  "Published positions, repeated independent assessment, an adversarial review, nine red-team reviews and an external critique have changed the design (Table 9.3),"),
 ("changed the design, 2020 to 21 October 2026 (no organisation", "changed the design, 2020 to 31 October 2026 (no organisation"),
 ("| The first five of nine independent red teams", "| The first five independent red teams"),
 ("Tables 8.2 to 8.5 answer the third to sixth of the nine red teams |", "Tables 8.2 to 8.5 answer the third to sixth of the red teams |"),
 ("the stack, and with it the levy and any dividend, would change.", "the stack, and with it the levy, would change."),
 ("5. If public submissions show low support for even a Stage 2 tax rise, the Stage 2 authority could lapse with Stage 3's, leaving Stage 1 and any fund.",
  "5. If public submissions show low support for any universal payment, Parliament could drop the pathway's tests, leaving Stage 1.\n6. If the committee weights poverty above work incentives, it could recommend the targeted package as Stage 1."),
 ("Note: HILDA = Household, Income and Labour Dynamics in Australia survey.*", "Note: HILDA = Household, Income and Labour Dynamics in Australia survey. Formal volunteering keeps targets because the National Contribution Register and Community Contribution Fund pilot aims at it (Recommendation 10); weekly contact has none, because no measure aims at it directly (Table 2.2). Neither is a condition on any payment.*"),
 ("including permanent programs such as Alaska's dividend |", "including permanent programs such as Alaska's dividend [S94] |"),
 ("with poverty after housing costs on the relative line as the headline.", "with poverty after housing costs on the relative line as the headline. Following the paper's thesis (Section 2), the indicators of success are poverty, security and wellbeing; employment is reported as a risk indicator, with no target, and the activity test's suspensions are reported until Parliament decides on Recommendation 16."),
 ("Parliament will have post-reform poverty figures, trial results and a Productivity Commission review before any Stage 2 vote.",
  "Parliament will have post-reform poverty figures, trial results and a Productivity Commission review before any Bill setting a universal rate."),
 ("The Productivity Commission reviews the ABI in 2031, 2036 and 2041,", "The Productivity Commission reviews the Act in 2031, 2036 and 2041,"),
 ("A randomised trial of the Stage 2 rate from July 2029 to June 2031,", "A randomised trial of a payment at the JobSeeker rate from July 2029 to June 2031,"),
 ("Each safeguard has a measure, a threshold, an automatic action under the Act and an owner (Table 9.6). For Stage 1 a shortfall in the durable taxes is met by a levy set to the gap once any surpluses kept as debt reduction are drawn. Under a fund option it is met first by a loan in a displacement declared after eight quarters. Under the Act the floor is never paused and any dividend is not cut in cash terms, until, for the wealth-tax fund, the guarantee lapses, though a later Parliament can change both rules. If its ten-year real return falls below 4%, the Minister for Finance tables a review of the payout rate (Table 9.5; Recommendation 5e).",
  "Each safeguard has a measure, a threshold, an automatic action under the Act and an owner (Table 9.6). For Stage 1 a shortfall in the five durable taxes is met by a levy set to the gap once any surpluses kept as debt reduction are drawn. Under the Act the floor and child payment are never paused, though a later Parliament can change that rule."),
 ("Stage 2 then needs 18.6 or 25.5 points, and until the vote the counter-cyclical rule holds the floor and any dividend (Tables 6.7f and 6.18b). On the costing's own labour response the work-effort cap binds with probability 0.86 to 0.91; Stage 2 passes with even odds only if the true fall is under 3.0 points (model Table F4-70).",
  "a payment at the JobSeeker rate then needs 18.6 or 25.5 points on the 22 October run, and until any later Act the counter-cyclical rule holds the floor and child payment (Tables 6.38 and 6.51). At the OpenResearch trial's earlier 4.2-point estimate the work-effort cap binds with probability 0.86 to 0.91, and at its latest 3.9-point estimate with probability {{WORK_CAP_ODDS_AT_3_9}}; a universal payment passes with probability 0.16 to 0.21 at 3.9 points, and with even odds only if the true fall is under 3.0 points (model Table F4-70)."),
 ("A good result is therefore not evidence that Stage 2 or Stage 3 is sound, and the Act requires separate evidence before the Stage 2 vote and any Stage 3 rate.",
  "A good result is therefore not evidence that a universal payment is sound, and the Act requires separate evidence before any Bill setting a universal rate."),
 ("| Separate evidence required before the Stage 2 vote and any Stage 3 rate |", "| Separate evidence required before any Bill setting a universal rate |"),
 ("respond to the Stage 2 rate over two years |", "respond to a payment at the JobSeeker rate over two years |"),
 ("| A fresh PBO costing of the Stage 2 rise and the six measures together,", "| A fresh PBO costing of the proposed rate and the five taxes together,"),
 ("Note: about 5,000 adults receive the Stage 2 rate,", "Note: about 5,000 adults receive a payment at the JobSeeker rate,"),
 ("which gives a 90% chance of detecting a 4.2-point fall in participation, the OpenResearch estimate [S191].",
  "which gives a 90% chance of detecting a 4.2-point fall in participation, the figure the 22 October paper used; at the trial's latest estimate of 3.9 points the trial detects some fall with probability 0.97 to 1.00 and the cap binds with probability 0.79 to 0.84 [S191]."),
 (" Regression discontinuities at age 18 and at the end of the waiting period isolate only the dividend, whose early effects are too small to detect.*", "*"),
]))

# ======================= CHAPTER 10 (dividend)
add(F('10_dividend_intro.md'))
add(seg(467, 478, [
 ("Part 2 would add a yearly dividend for every eligible adult. It would not reduce poverty: Stage 1 gives",
  "A dividend would be paid every year to every eligible adult. It would not reduce poverty: on the 22 October run Stage 1 gives"),
 ("The paper sets out four options and leaves the choice to Parliament as a later decision, after a PBO costing of each (Recommendation 4):",
  "There are four options, and the paper recommends none of them now (Recommendation 4):"),
 ("the design modelled in full in Section 6;", "the design the 22 October paper modelled in full (Tables 10.8 to 10.27);"),
 ("- **no dividend**: Part 1 alone.", "- **no dividend**: Stage 1 alone, which this paper recommends (P\\*; on the 22 October run, Part 1 alone)."),
 ("Under any option lodgers would receive the dividend", "Any dividend would follow the newly arrived resident's four-year waiting period that applies to JobSeeker Payment [S123]. Under any option lodgers would receive the dividend"),
]))
add(seg(480, 490))
add(seg(492, 536))
add(seg(538, 538, [
 ("The paper sets out the evidence and does not choose (Recommendation 4).", "The paper sets out the evidence and recommends none now (Recommendation 4)."),
]))
add("### Stage 1 with and without a dividend")
add(seg(632, 643))
add(seg(655, 665))
add(seg(667, 681))
add(seg(683, 692))
add("### The wealth-tax fund in detail\n\nThe tables below are the 22 October paper's model of the wealth-tax fund, run with Part 1 as Stage 1.")
add(seg(1125, 1146, [
 ("On the Budget's forecasts no stage is triggered, so Stage 1 runs on (Tables 6.7a to 6.7c).",
  "On the 22 October run, with Part 1 and the wealth-tax fund, no stage is triggered on the Budget's forecasts, so Stage 1 runs on (Tables 10.8 to 10.11)."),
]))
add(seg(831, 860))
add(seg(1148, 1198))
add(seg(1206, 1311))
add("AI-driven growth raises the dividend only slowly, through larger durable surpluses, adding A$8 to A$47 to the 2035-36 dividend (Table 10.17).")
add(seg(1395, 1407))
add(seg(1460, 1460, [
 ("With the wealth-tax fund, uncertainty about Stage 1's costs", "With the wealth-tax fund, on the 22 October run, uncertainty about Stage 1's costs"),
]))
add(seg(1484, 1549))
add(seg(1551, 1623))
add(seg(1703, 1714))
add("### Who gains and who loses after funding with a dividend")
add(seg(2045, 2093))

# ======================= CHAPTER 11 (appendix)
app = seg(2852, 3174, [
 ("## 10. Appendix: methodology, assumptions and sources", "## 11. Appendix: methodology, assumptions and sources"),
 ("lets a reader change the main levers, such as the floor, the taper and the fund's return, and watch the dividend and costs move [S5].",
  "lets a reader change the main levers, such as the floor, the taper and the five taxes' yield, and watch costs and the levy move [S5]. Its checks reproduce the paper's model; they do not test the model's assumptions."),
 ("| 2. Gross cost | Eligible adults × take-up × the dividend, from 2029-30 (100% of lodgers and 80% of non-lodgers), plus eligible children × the child supplement | Table 6.1a |",
  "| 2. Gross cost | Eligible children × the child supplement, less the FTB it replaces, under the child payment's rule; under a dividend option (Section 10), also eligible adults × take-up × the dividend, from 2029-30 (100% of lodgers and 80% of non-lodgers) | Tables 6.1 and 10.9 |"),
 ("| Tables 6.7a to 6.7f and 6.14a to 6.18b |", "| Tables 6.6 to 6.10 and 6.34 to 6.53 |"),
 ("Sources are numbered in order of first citation. Each entry gives the author or organisation, title, year of publication and web address or file path.",
  "Sources S1 to S224 are numbered in order of first citation, and later sources in the order they were added. Each entry gives the author or organisation, title, year of publication and web address or file path. Sources S233, S234 and S236 to S264 were verified in the author's evidence review of 1 November 2026, which records the page, table or cell each figure comes from; its summary is lodged with the supplementary files. S225 to S232, S235 and S265 to S274 could not be opened from the drafting environment and carry descriptive titles in square brackets; they need checking before submission. S265 to S268 and S274 support the paper's account of the industrial revolution, which uses no figures from them, and S269 to S273 its comparison with other countries' institutions (Section 9)."),
 ("| Tables 6.20 to 6.24b; F4-48 |", "| Tables 6.14 to 6.27; F4-48 |"),
 ("and the household scripts (household.py to household_r13.py) regenerate every model table,",
  "the household scripts (household.py to household_r13.py) and the scripts for this revision ({{OPTIONB_MODEL_SCRIPTS}}) regenerate every model table,"),
 ("*The employment effects of a guaranteed income: experimental evidence from two US states (Working Paper 32719, July 2024, revised August 2026)*. 2024. https://www.nber.org/system/files/working_papers/w32719/w32719.pdf",
  "*The employment effects of a guaranteed income: experimental evidence from two US states (Working Paper 32719, July 2024, revised August 2026)*. 2024. https://www.nber.org/system/files/working_papers/w32719/w32719.pdf; latest revision, cited for the 3.9-point fall in participation: https://www.nber.org/system/files/working_papers/w32719/revisions/w32719.rev2.pdf"),
])
add(app)

text = ''.join(out)
# ---------------- fill tokens from the model's option B results
FILLS = {
 'REVISION_DATE': 'Revised 1 November 2026', 'REVISION_VERSION_DATE': '1 November 2026',
 'WORK_CAP_ODDS_AT_3_9': '0.79 to 0.84', 'PSTAR_FIRST_LEVY_CENTRAL': '2043-44', 'PSTAR_ADVANCE_REPAID_YEAR': '2031-32',
 'PSTAR_ADVANCE_2028_29': 'A$20.7bn', 'PHASED_ADVANCE_2028_29': 'nil',
 'PSTAR_HH_BETTER_AFTER_FUNDING_2028_29': '35.4%', 'PSTAR_HH_WORSE_AFTER_FUNDING_2028_29': '64.6%', 'PSTAR_HH_WORSE_INCIDENCE_RANGE': 'about 59% to 67%',
 'PSTAR_NET_BENEFIT_2028_29': '−A$23.3bn to −A$2.3bn', 'PACKAGE_NET_BENEFIT_2028_29': '−A$25.2bn to nil',
 'PSTAR_LEVY_PROB_BEFORE_2044_45': '48% to 74%', 'PSTAR_FIRST_SHORTFALL_YEAR': '2037-38',
 'PSTAR_COMBINED_DOWNSIDE_LEVY_PEAK': '7.64% (A$570.1bn to 2045-46)', 'PSTAR_AHC_LOSER_HOUSEHOLDS': '0.70 million', 'PSTAR_AHC_LOSER_SHARE': '16%',
 'PSTAR_UCB_YEARS_WORSE': '7', 'PSTAR_LARGEST_LEVY_TO_2045_46': 'A$16.6bn (0.62% of market income)',
 'STRESS_TEST_PATHS': '4,000', 'STRESS_TEST_DISTRIBUTION_SOURCES': "triangular distributions over the paper's tested ranges, with AI displacement in 15% of draws (an assumption)",
 'PSTAR_MODEL_TABLE_REF': 'option B model results, Tables B1 to B16', 'OPTIONB_MODEL_SCRIPTS': 'optionb_hh.py, optionb_fiscal.py, optionb_report.py and optionb_check.py',
 'TRIAL_COST_2029_30': '120', 'TRIAL_COST_2030_31': '124', 'IMPL_TOTAL_2029_30': '286', 'IMPL_TOTAL_2030_31': '293',
}

# ---- second-round effects: current B18-B21 values, TO BE UPDATED from the model's re-run
FILLS.update({
 'MED_INC_SQ': '118,396', 'MED_INC_FLOOR': '124,234', 'MED_INC_SQ_SEVERE': '116,393', 'MED_INC_FLOOR_SEVERE': '122,409',
 'PARTNER_TEST_EXCLUDED_SHARE': '31.2',
 'EXTRA_PAY_SQ_MODERATE': '23.2', 'EXTRA_PAY_SQ_SEVERE': '61.7', 'EXTRA_PAY_FLOOR_MODERATE': '36.3', 'EXTRA_PAY_FLOOR_SEVERE': '96.8',
 'ENROL_COST_MODERATE': '4.3', 'ENROL_COST_SEVERE': '11.4', 'ENROL_SUM_MODERATE': '67.2', 'ENROL_SUM_SEVERE': '179.2',
 'ENROL_COST_SQ_MODERATE': '2.7', 'ENROL_COST_SQ_SEVERE': '7.3', 'ENROL_SUM_SQ_MODERATE': '40.9', 'ENROL_SUM_SQ_SEVERE': '109.1',
 'WAIVER_COST_MODERATE': '1.6', 'WAIVER_COST_SEVERE': '4.2', 'WAIVER_SUM_MODERATE': '7.6', 'WAIVER_SUM_SEVERE': '20.3',
 'DEBT_MEDIAN_REPAYMENT_MODERATE': '42,970', 'DEBT_MEDIAN_REPAYMENT_SEVERE': '42,727',
 'DEBT_SHARE_SQ_MODERATE': '36%', 'DEBT_SHARE_FLOOR_MODERATE': '34%', 'DEBT_SHARE_SQ_SEVERE': '36%', 'DEBT_SHARE_FLOOR_SEVERE': '35%',
 'DEBT_ABOVE30_SQ_MODERATE': '222', 'DEBT_ABOVE50_SQ_MODERATE': '85', 'DEBT_ABOVE30_FLOOR_MODERATE': '210', 'DEBT_ABOVE50_FLOOR_MODERATE': '63',
 'DEBT_ABOVE30_SQ_SEVERE': '576', 'DEBT_ABOVE50_SQ_SEVERE': '223', 'DEBT_ABOVE30_FLOOR_SEVERE': '546', 'DEBT_ABOVE50_FLOOR_SEVERE': '168',
 'BUFFER_MONTHS_SQ_MODERATE': '9.5', 'BUFFER_MONTHS_FLOOR_MODERATE': '11.0', 'BUFFER_MONTHS_SQ_SEVERE': '9.4', 'BUFFER_MONTHS_FLOOR_SEVERE': '10.9',
 'RENT_ABOVE30_SQ_MODERATE': '168', 'RENT_ABOVE50_SQ_MODERATE': '71', 'RENT_ABOVE30_FLOOR_MODERATE': '159', 'RENT_ABOVE50_FLOOR_MODERATE': '49',
 'RENT_ABOVE30_PSTAR_MODERATE': '156', 'RENT_ABOVE50_PSTAR_MODERATE': '38', 'RENT_ABOVE30_SQ_SEVERE': '425', 'RENT_ABOVE50_SQ_SEVERE': '181',
 'RENT_ABOVE30_FLOOR_SEVERE': '404', 'RENT_ABOVE50_FLOOR_SEVERE': '123', 'RENT_ABOVE30_PSTAR_SEVERE': '397', 'RENT_ABOVE50_PSTAR_SEVERE': '96',
})
FILLS.update({'SALES_SHARE_SQ_MODERATE': '15.1%', 'SALES_SHARE_FLOOR_MODERATE': '11.3%', 'SALES_SHARE_SQ_SEVERE': '39.8%', 'SALES_SHARE_FLOOR_SEVERE': '30.1%',
              'SALES_SHARE5_SQ_MODERATE': '15.5%', 'SALES_SHARE5_FLOOR_MODERATE': '11.6%', 'SALES_SHARE5_SQ_SEVERE': '40.9%', 'SALES_SHARE5_FLOOR_SEVERE': '30.9%'})
for k_, v_ in FILLS.items():
    text = text.replace('{{' + k_ + '}}', v_)

FINAL = [
 ("At the OpenResearch trial's earlier estimate of a 4.2-point fall in participation, the work-effort cap would bind with probability 0.86 to 0.91; at its latest estimate of 3.9 points,",
  "At the 4.2-point fall in participation the 22 October paper used, the work-effort cap would bind with probability 0.86 to 0.91; at the trial's latest estimate of 3.9 points,"),
 ("at the trial's earlier 4.2-point estimate", "at the 4.2-point figure the 22 October paper used"),
 ("computed at the OpenResearch trial's earlier 4.2-point estimate", "computed at the 4.2-point figure the 22 October paper used"),
 ("(0.86 to 0.91 at its earlier 4.2-point estimate)", "(0.86 to 0.91 at the 4.2-point figure the 22 October paper used)"),
 ("At the earlier 4.2-point estimate that would happen", "At the 4.2-point figure the 22 October paper used, that would happen"),
 ("At the OpenResearch trial's earlier 4.2-point estimate the work-effort cap binds", "At the 4.2-point figure the 22 October paper used, the work-effort cap binds"),
 ("a 4.2-point fall in participation, the OpenResearch trial's earlier estimate, and", "a 4.2-point fall in participation, the figure the 22 October paper used, and"),
 ("| Participation down 3.9 points (4.2 in the first version);", "| Participation down 3.9 points;"),
 ("by 3.9 percentage points in the trial's latest revision (4.2 in its first version),", "by 3.9 percentage points in the trial's latest revision,"),
 ("Because top-ups and the floor are still income-tested,", "Because the floor and the child payment are still income-tested,"),
]
FINAL += [
 ("that cap binds with probability 0.86 to 0.91 at the 4.2-point figure the 22 October paper used and 0.79 to 0.84 at 3.9 points,", "at the trial's latest 3.9-point estimate that cap binds with probability 0.79 to 0.84,"),
 (" (At the 4.2 points the 22 October paper used, the figures were 0.09 to 0.14 and A$0.05bn to A$0.25bn.)", ""),
 ("At the 4.2-point fall in participation the 22 October paper used, the work-effort cap would bind with probability 0.86 to 0.91; at the trial's latest estimate of 3.9 points, with probability 0.79 to 0.84.", "At the trial's latest estimate of a 3.9-point fall in participation, the work-effort cap would bind with probability 0.79 to 0.84."),
 ("at the trial's latest estimate (0.86 to 0.91 at the 4.2-point figure the 22 October paper used) |", "at the trial's latest estimate |"),
 ("At the 4.2-point figure the 22 October paper used, that would happen with probability 0.86 to 0.91; at 3.9 points, with probability 0.79 to 0.84.", "At the trial's latest 3.9-point estimate that would happen with probability 0.79 to 0.84."),
 ("At the 4.2-point figure the 22 October paper used, the work-effort cap binds with probability 0.86 to 0.91, and at its latest 3.9-point estimate with probability 0.79 to 0.84;", "At the OpenResearch trial's latest 3.9-point estimate the work-effort cap binds with probability 0.79 to 0.84;"),
]
FINAL += [("**Figure 6.3 [CHART]. Underlying cash balance, net debt and net financial worth against the Budget baseline: the underlying cash balance (Panel A), and net debt and net financial worth (Panel B),",
  "**Figure 6.3 [CHART]. The underlying cash balance (Panel A), and net debt and net financial worth (Panel B), against the Budget baseline,")]
FINAL += [("And every option scores below Stage 1 alone on the paper's net-benefit method (Table 10.2).", "And every option scores below Stage 1 alone on the complete accounting (Table 10.2).")]
for a_, b_ in FINAL:
    c = text.count(a_)
    if c == 0: print('FINAL skip', a_[:60], file=sys.stderr); continue
    if c != 1: print('FINAL FAIL', c, a_[:80], file=sys.stderr); sys.exit(1)
    text = text.replace(a_, b_)

# ---------------- new sources: number by first appearance
NEW = {
 'S_CANARIES': "Stanford Digital Economy Lab. [Update on employment of young workers in AI-exposed occupations]. 2026. https://digitaleconomy.stanford.edu/app/uploads/2026/08/Canaries_August2026.pdf",
 'S_YALE26': "Yale Budget Lab. [Analysis of AI and the US occupational mix]. n.d. https://budgetlab.yale.edu/node/1419/pdf",
 'S_DANISH': "Becker Friedman Institute, University of Chicago. [Working paper on large language models and labour-market effects in Danish data]. n.d. https://bfi.uchicago.edu/working-papers/large-language-models-small-labor-market-effects",
 'S_OECD17': "OECD. [Policy brief on basic income as a policy option]. 2017. https://search.oecd.org/els/soc/Basic-Income-Policy-Option-2017.pdf",
 'S_ALASKA25': "KMXT, Alaska statewide news. [Report on the 2025 Alaska Permanent Fund Dividend]. 2025. https://www.kmxt.org/alaska-statewide-news/2025-09-19/the-2025-alaska-permanent-fund-dividend-will-be-1-000",
 'S_IMF17': "International Monetary Fund. [Fiscal Monitor, October 2017]. 2017. https://www.astrid-online.it/static/upload/imf_/imf_fiscal-monitor-10_2017.pdf",
 'S_NYFED': "Federal Reserve Bank of New York. [Staff report on wage insurance]. n.d. https://www.newyorkfed.org/research/staff_reports/sr1105",
 'S_ANUJS': "Australian National University. [Article on the cost of increasing JobSeeker]. n.d. https://research.anu.edu.au/research-innovation-news/increasing-jobseeker-is-long-overdue-heres-how-we-could-do-it-without",
 'S_LAWP': "Services Australia. *Liquid assets waiting period* (duration table; updated 30 July 2026). 2026. https://www.servicesaustralia.gov.au/liquid-assets-waiting-period?context=51411",
 'S_RBA_FSR': "Reserve Bank of Australia. *Financial Stability Review, October 2026: Resilience of Australian households and businesses* (Graph 2.4 and adjacent text; released 1 October 2026). 2026. https://www.rba.gov.au/publications/fsr/2026/oct/resilience-of-australian-households-and-businesses.html",
 'S_STP': "Australian Taxation Office. [Single Touch Payroll: what employers report]. n.d. https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/single-touch-payroll",
 'S_SA_AR2324': "Services Australia. *Annual Report 2023-24* (Table 2, pp. 58-59: claims finalised and granted; p. 40: processing standards). 2024. https://www.servicesaustralia.gov.au/sites/default/files/2024-10/annual-report-2023-24.pdf",
 'S_SA_AR2425': "Services Australia. *Annual Report 2024-25* (Table 2, pp. 54-55). 2025. https://www.servicesaustralia.gov.au/sites/default/files/2025-10/annual-report-2024-25.pdf",
 'S_SA_AR2526': "Services Australia. *Annual Report 2025-26* (Table 1, pp. 58-59; published 16 October 2026). 2026. https://www.servicesaustralia.gov.au/sites/default/files/2026-10/annual-report-2025-26.pdf",
 'S_DSS_PROC': "Department of Social Services ministers. *Services Australia delivers 900,000 claims, reduces call wait times* (media release, 30 July 2024; average processing time table). 2024. https://ministers.dss.gov.au/media-releases/15451",
 'S_SA_SENATE': "Services Australia. *Answer to question on notice IQ20-000047, Senate Select Committee on COVID-19, hearing of 30 April 2020* (answer as at 8 May 2020, p. 1). 2020. https://www.aph.gov.au/DocumentStore.ashx?id=01c991a6-b503-493a-8dc1-b52669d1d381",
 'S_ANAO_COVID': "Australian National Audit Office. *Services Australia COVID-19 Measures and Enterprise Risk Management* (Report 23 of 2020-21, 10 December 2020; paragraphs 2.54, 2.65, 2.68 and 4.15, Figures 2.6 and 4.1). 2020. https://www.anao.gov.au/work/performance-audit/services-australia-covid-19-measures-and-enterprise-risk-management",
 'S_SA_PARTNER': "Services Australia. *Income test for JobSeeker Payment* ('Maximum income per fortnight if you're partnered'; updated 29 October 2026). 2026. https://www.servicesaustralia.gov.au/income-test-for-jobseeker-payment?context=51411",
 'S_SA_ASSETS': "Services Australia. *Income and assets tests for JobSeeker Payment; Assets test for allowances* (cut-off table, updated 1 July 2026). 2026. https://www.servicesaustralia.gov.au/income-and-assets-tests-for-jobseeker-payment?context=51411; https://www.servicesaustralia.gov.au/assets-test-for-allowances?context=22281",
 'S_DSS_GUIDE': "Department of Social Services. *Social Security Guide, version 1.344* (section 1.1.L.50, Liquid assets; released 26 October 2026). 2026. https://guides.dss.gov.au/social-security-guide/1/1/l/50",
 'S_ABS_HIW': "Australian Bureau of Statistics. *Household Income and Wealth, Australia, 2019-20* (data cubes 7, 8 and 10; released 28 April 2022). 2022. https://www.abs.gov.au/statistics/economy/finance/household-income-and-wealth-australia/2019-20",
 'S_RBA_FSR2022': "Reserve Bank of Australia. *Financial Stability Review, October 2022: Household and business finances in Australia* (Graph 2.4 and surrounding paragraphs). 2022. https://www.rba.gov.au/publications/fsr/2022/oct/household-business-finances-in-australia.html",
 'S_RBA_FSR2023': "Reserve Bank of Australia. *Financial Stability Review, April 2023* (chapter 3, Graph 3.4, pp. 39-40). 2023. https://www.rba.gov.au/publications/fsr/2023/apr/pdf/financial-stability-review-2023-04.pdf",
 'S_RBA_FSR2024': "Reserve Bank of Australia. *Financial Stability Review, March 2024: Resilience of Australian households and businesses* (Graph 2.8). 2024. https://www.rba.gov.au/publications/fsr/2024/mar/resilience-of-australian-households-and-businesses.html",
 'S_APRA': "Australian Prudential Regulation Authority. *Quarterly ADI Property Exposures Statistics, June 2026* (Tab 1b, rows 16 and 69, and highlights; released 17 September 2026). 2026. https://www.apra.gov.au/quarterly-authorised-deposit-taking-institution-property-exposure-statistics-june-2026-highlights",
 'S_ASIC782': "Australian Securities and Investments Commission. *Report 782: Hardship, hard to get help* (p. 83, Figure 15; Appendix 2, Table 28; 20 May 2024). 2024. https://download.asic.gov.au/media/w35baapb/rep782-published-20-may-2024-20240809.pdf",
 'S_BERGMANN': "Bergmann, Reserve Bank of Australia. *The Determinants of Mortgage Defaults in Australia: Evidence for the Double-trigger Hypothesis* (Research Discussion Paper 2020-03, July 2020; sections 3-4, Figures 5-6). 2020. https://www.rba.gov.au/publications/rdp/2020/2020-03/full.html",
 'S_ABS_TVD': "Australian Bureau of Statistics. *Total Value of Dwellings, June Quarter 2026* (Table 2, Data1; released 8 September 2026; transfers summed from cells AF89:BI108). 2026. https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/total-value-dwellings/jun-quarter-2026/643202.xlsx",
 'S_ABS_HOC': "Australian Bureau of Statistics. *Housing Occupancy and Costs, 2019-20* ('Ownership of other residential property'; released 25 May 2022). 2022. https://www.abs.gov.au/statistics/people/housing/housing-occupancy-and-costs/2019-20",
 'S_SAUNDERS_TULIP': "Saunders and Tulip, Reserve Bank of Australia. *A Model of the Australian Housing Market* (Research Discussion Paper 2019-01, March 2019; section 5.3 and Figure 15). 2019. https://www.rba.gov.au/publications/rdp/2019/2019-01/model-responses.html",
 'S_CAMPBELL': "Campbell, Giglio and Pathak. *Forced Sales and House Prices*. American Economic Review 101(5), August 2011, pp. 2108-2131 (abstract, p. 2108). 2011. https://doi.org/10.1257/aer.101.5.2108",
 'S_ANENBERG': "Anenberg and Kung. *Estimates of the Size and Source of Price Declines Due to Nearby Foreclosures*. American Economic Review 104(8), August 2014, pp. 2527-2551 (abstract; the coefficient is taken from the secondary review, source S_COHEN, because the article's table could not be opened). 2014. https://doi.org/10.1257/aer.104.8.2527",
 'S_COHEN': "Cohen, Coughlin and Yao. *Sales of Distressed Residential Property: What Have We Learned from Recent Research?* Federal Reserve Bank of St Louis Review 98(3), third quarter 2016 (Table 2, p. 176). 2016. https://files.stlouisfed.org/research/publications/review/2016-09-12//sales-of-distressed-residential-property-what-have-we-learned-from-recent-research.pdf",
 'S_SIJP_LI': "Sijp and Li. *The effect of nearby listings on house sale prices in Sydney: a spatio-temporal regularization approach*. Real Estate Economics, first published 29 March 2026 (section 3, Tables 5 and 6). 2026. https://onlinelibrary.wiley.com/doi/full/10.1111/1540-6229.70046",
 'S_MIAN': "Mian, Sufi and Trebbi. *Foreclosures, House Prices, and the Real Economy*. Journal of Finance 70(6), December 2015, pp. 2587-2634 (Table VI, pp. 2608-2610; interpretation p. 2611; listings analysis pp. 2612-2614; Table VII). 2015. https://doi.org/10.1111/jofi.12310",
 'S_ABS_TAXREV': "Australian Bureau of Statistics. *Taxation Revenue, Australia, 2024-25* (Tables 2-10; stamp duties on conveyances, cell K35, and land taxes, cell K11, in each state table; released 21 April 2026). 2026. https://www.abs.gov.au/statistics/economy/government/taxation-revenue-australia/2024-25/55060DO001_202425.xlsx",
 'S_NSW_BP1': "NSW Treasury. *2026-27 Budget Paper No. 1: Budget Statement* (Appendix E, Table E.3, p. E-4; June 2026). 2026. https://www.parliament.nsw.gov.au/tp/files/211353/2026-27%20Budget%20Paper%20No.01%20-%20Budget%20Statement.pdf",
 'S_PBO_EPT': "Parliamentary Budget Office. *40% excess profits tax on corporations with over $100 million in turnover* (ECR-2025-3194, 2025 Election Commitments Report, June 2025; pp. 1-6, Table 1 and Attachment A, Table A1: no sector or bank share disclosed). 2025. https://www.pbo.gov.au/elections/2025-general-election/2025-election-commitments-costings/40%25%20excess%20profits%20tax%20on%20corporations%20with%20over%20%24100%20million%20in%20turnover",
 'S_AHURI291': "Eccleston, Warren, Verdouw and Flanagan. *Pathways to state property tax reform* (AHURI Final Report 291, November 2017; Box 4, p. 36). 2017. https://www.ahuri.edu.au/sites/default/files/migration/documents/AHURI_Final_Report_No_291_-_Pathways_to_state_property_tax_reform.pdf",
 'S_RBA_RENTS': "Reserve Bank of Australia. *Do Housing Investors Pass-through Changes in Their Interest Costs to Rents?* (Bulletin, 17 October 2024; abstract, results and conclusion). 2024. https://www.rba.gov.au/publications/bulletin/2024/oct/do-housing-investors-pass-through-changes-in-their-interest-costs-to-rents.html",

 'S_ALLEN': "Allen. [Engels' pause: technical change, capital accumulation and inequality in the British industrial revolution; Explorations in Economic History 46(4), 2009]. n.d. https://doi.org/10.1016/j.eeh.2009.04.004",
 'S_FEINSTEIN': "Feinstein. [Pessimism perpetuated: real wages and the standard of living in Britain during and after the industrial revolution; Journal of Economic History 58(3), 1998]. n.d. https://doi.org/10.1017/S0022050700021100",
 'S_HUMPHRIES': "Humphries. [Childhood and child labour in the British industrial revolution; Cambridge University Press, 2010]. n.d. https://doi.org/10.1017/CBO9780511780516",
 'S_FACTORY1833': "UK Parliament. [Living Heritage: the 1833 Factory Act]. n.d. https://www.parliament.uk/about/living-heritage/transformingsociety/livinglearning/19thcentury/overview/factoryact/",
 'S_HENRY': "Australian Treasury. [Australia's Future Tax System review (the Henry review), final report, 2010: the transfer system's flat-rate, means-tested payments funded from general revenue]. n.d. https://treasury.gov.au/review/the-australias-future-tax-system-review",
 'S_NZJS': "Work and Income, New Zealand Ministry of Social Development. [Jobseeker Support: rates, income test and eligibility]. n.d. https://www.workandincome.govt.nz/products/a-z-benefits/jobseeker-support.html",
 'S_RTI': "HM Revenue and Customs. [Running payroll: reporting pay to HMRC in real time (Real Time Information)]. n.d. https://www.gov.uk/running-payroll",
 'S_OBR': "Office for Budget Responsibility. [About the Office for Budget Responsibility and its forecasts and costings]. n.d. https://obr.uk/",
 'S_POORLAW': "UK Parliament. [Living Heritage: the Poor Law Amendment Act 1834 and the workhouse]. n.d. https://www.parliament.uk/about/living-heritage/transformingsociety/livinglearning/19thcentury/overview/poorlaw/",
 'S_CBO': "Congressional Budget Office. [An overview of CBO's work: budget projections and cost estimates for the Congress]. n.d. https://www.cbo.gov/about/overview",
}
order = ['S_CANARIES', 'S_YALE26', 'S_DANISH', 'S_OECD17', 'S_ALASKA25', 'S_IMF17', 'S_NYFED', 'S_ANUJS', 'S_LAWP', 'S_RBA_FSR', 'S_STP']  # fixed: S225 to S235 as first published
LATE = ['S_ALLEN', 'S_FEINSTEIN', 'S_HUMPHRIES', 'S_FACTORY1833', 'S_HENRY', 'S_NZJS', 'S_RTI', 'S_OBR', 'S_CBO', 'S_POORLAW']  # added 1 November 2026 (thesis and international sections): numbered after S264
for m in re.finditer(r'S_[A-Z0-9_]+', text):
    if m.group(0) in NEW and m.group(0) not in order and m.group(0) not in LATE: order.append(m.group(0))
order += LATE
missing = set(NEW) - set(order)
if missing: print('new sources never cited:', missing, file=sys.stderr)
num = {key: f'S{225 + i}' for i, key in enumerate(order)}
for key, s in num.items():
    text = re.sub(r'\b' + key + r'\b', s, text)
for key in order:
    for k2, s2 in num.items(): NEW[key] = re.sub(r'\b' + k2 + r'\b', s2, NEW[key])
srcs = '\n'.join(f"{225 + i}. **[S{225 + i}]** {NEW[key]}" for i, key in enumerate(order))
text = text.rstrip('\n') + '\n' + srcs + '\n'

# ---------------- pending figures
toks = []
for m in re.finditer(r'\{\{([A-Z0-9_]+)\}\}', text):
    if m.group(1) not in toks: toks.append(m.group(1))
redraws = re.findall(r'\{\{FIGURE_REDRAW: ([^}]*)\}\}', text)
pend = "\n## Pending figures\n\nThis list is for the model agent and is removed once the figures are filled. Each token below appears in the text as {{NAME}}. Figure markers are listed after the tokens.\n\n" + \
       '\n'.join(f'- `{t}`' for t in toks) + '\n\nFigures to redraw:\n\n' + '\n'.join(f'- {r[:120]}…' for r in redraws) + '\n'
text = text.replace("the paper's net-benefit method", "the paper's method")
text = text.replace("A$1.5bn to A$1.8bn a year more net benefit (A$0.8bn", "A$1.5bn to A$1.8bn a year more net benefit on the complete accounting (A$0.8bn")
text = text.replace("A$1.5bn to A$1.8bn a year more net benefit than Part 1", "A$1.5bn to A$1.8bn a year more net benefit on the complete accounting than Part 1")
text = text.replace("with A$1.5bn to A$1.8bn a year more net benefit;", "with A$1.5bn to A$1.8bn a year more net benefit on the complete accounting;")
text = text.replace("at the same budget and with A$1.5bn to A$1.8bn a year more net benefit.", "at the same budget and with A$1.5bn to A$1.8bn a year more net benefit on the complete accounting.")
text = text.replace("than P\\* and A$1.5bn to A$1.8bn a year, to save", "than P\\* and A$1.5bn to A$1.8bn a year of net benefit on the complete accounting, to save")
text = text.replace("0.20 million fewer people in poverty than Part 1 and A$1.5bn to A$1.8bn a year more net benefit;", "0.20 million fewer people in poverty than Part 1 and A$1.5bn to A$1.8bn a year more net benefit on the complete accounting;")
text = text.replace("| Net benefit against Part 1 (A$ billion a year) |", "| Net benefit against Part 1, complete accounting (A$ billion a year) |")

if toks: text = text + pend
open(os.path.join(OPT, 'paper_optionb.md'), 'w').write(text)
print('written; tokens:', len(toks), '; unmapped refs:', sorted(unmapped), '; new sources:', num)
