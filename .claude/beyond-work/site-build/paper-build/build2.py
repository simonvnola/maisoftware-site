# part 2: chapter 6 (executed inside build.py's namespace)
def cells(line): return [x.strip() for x in line.strip().strip('|').split('|')]
def unb(x): return x.replace('**', '')

exec(open(os.path.join(BASE,'gen_new.py')).read())

def fill(t, **kw):
    for a, b in kw.items(): t = t.replace(f'<<{a}>>', b)
    return t

# ======================= CHAPTER 6 assembly
add(fill(F('06a_ch6_cost.md'), TABLE_6_1=T61))
add(seg(971, 1002, [
 ("because the ABI reuses tax and myGov systems |", "because Stage 1 reuses tax and myGov systems |"),
 ("| Embedded randomised trial (payments to 5,000 adults) | – | – | 120 | 124 | – | – | 5,000 adults × (Stage 2 rate − the Stage 1 dividend), July 2029 to June 2031 |",
  "| Embedded randomised trial (payments to 5,000 adults) | – | – | {{TRIAL_COST_2029_30}} | {{TRIAL_COST_2030_31}} | – | – | 5,000 adults × a payment at the JobSeeker rate, July 2029 to June 2031 (the 22 October basis deducted a Stage 1 dividend of A$47 to A$75 a person, under A$0.5m a year in all, so the cost is unchanged at the rounding shown) |"),
 ("| **Total (A$ million)** | **210** | **160** | **286** | **293** | **170** | **66** |  |",
  "| **Total (A$ million)** | **210** | **160** | **{{IMPL_TOTAL_2029_30}}** | **{{IMPL_TOTAL_2030_31}}** | **170** | **66** |  |"),
 ("is in net cost, in the child payment's timing column of Table 6.1a, not here.", "is in net cost, in the child payment column of Table 6.1, not here."),
 ("At Stage 1 most pensioners already receive more than the dividend, so only A$18.8bn of payments is replaced, almost all of it FTB, which the FTB-equivalent amount largely pays back (Tables 6.3 and 5.1c).",
  "At Stage 1 P\\* replaces only Family Tax Benefit, which the child payment's FTB-equivalent amount largely pays back. The 22 October design also replaced A$0.2bn of pensions up to its dividend (Table 6.3). A universal payment, if a later Act legislated one, would replace far more."),
 ("**Table 6.3. Payments replaced by the ABI, first year of each stage:", "**Table 6.3. Payments replaced on the 22 October design, first year of each stage:"),
 ("Stages 2 and 3 only if triggered.*", "Stages 2 and 3 only if triggered. Under P\\* the Stage 1 column is FTB alone.*"),
]))
add(fill(F('06b_ch6_stack_funding.md'), TABLE_6_4=T64, TABLE_6_6=T66, TABLE_6_7=T67))
add(seg(1050, 1086, [
 ("a response of 0.4 to the child payment's tapers brings Stage 1's first levy forward to 2037-38 (Table 6.14a)",
  "on Part 1's run a response of 0.4 to the child payment's tapers brought the first levy forward to 2032-33 (Table 6.10)"),
 ("at 0.56 Stage 1's first levy comes in 2038-39 (Table 6.14a)", "at 0.56 Part 1's first levy came in 2032-33 (Table 6.10)"),
 ("| Central return for the Permanent AI Dividend Fund:", "| Wealth-tax fund option only (Section 10): central return for the Permanent AI Dividend Fund:"),
]))
add(fill(F('06c_ch6_stress.md'), TABLE_6_9=T69, TABLE_6_10=T610))
add("### Net benefit")
add(seg(2268, 2283, [
 ("Counting the economic cost of the taxes that finance it, every stage has a negative monetised net benefit (Table 6.34).",
  "On the complete accounting, which counts the economic cost of the taxes that finance it and the design's own behavioural costs, every Stage 1 design and every later stage has a negative monetised net benefit; on the paper's method, which counts the taxes' cost alone, Stage 1's ranges span zero (Tables 6.12 and 6.13)."),
]))
add(fill(F('06d_ch6_netbenefit.md'), TABLE_6_12=T612))
add("Table 6.13 gives the same method by stage, as run on the 22 October design with the wealth-tax fund's dividend. With financing and Stage 1's own behavioural costs, Stage 2 would score −A$173.5bn to −A$47.1bn and Stage 3 −A$287.2bn to −A$92.9bn a year in their first years.")
add(seg(2287, 2314))
add("The monetised case for any dividend is not made either: on the complete accounting every dividend option scores below Stage 1 alone (Section 10). The table cannot value coverage, payment without an income test, insurance against displacement or the health and care effects in Section 3; Parliament has to weigh those against each option's measured price.")
add(fill(F('06e_ch6_gains.md'), TABLE_6_14=T614, TABLE_6_15=T615))
add(seg(1896, 1953, [
 ("Table 6.21 puts the superannuation, wealth tax and interaction measures on the top decile.",
  "On the 22 October run, Table 6.16 allocates six taxes, including the wealth tax, and puts the superannuation, wealth tax and interaction measures on the top decile."),
]))
add(seg(1879, 1894, [
 ("Before the six taxes are allocated, 83% of adults are better off. None is worse off at any income, because the dividend is taxed at no more than 47 cents a dollar and kept out of every income test. At Stages 2 and 3 losses fall mainly on the top four or five deciles (Tables 6.20 to 6.23). The income base leaves out tax-free superannuation pensions, so the household tables (6.24 to 6.24b), which count them, are the headline.",
  "On the 22 October run, with Part 1 and the dividend, 83% of adults gained before the six taxes were allocated and none was worse off at any income. At Stages 2 and 3 losses fall mainly on the top four or five deciles (Table 6.19). The income base leaves out tax-free superannuation pensions, so the household tables, which count them, are the headline (Tables 6.14 and 6.15)."),
]))
add(seg(1955, 1971, [
 ("No protected recipient is worse off at any stage. At Stage 1,", "No protected recipient is paid less at any stage. On Part 1's run, whose floor P\\* shares, at Stage 1"),
]))
add(fill(F('06f_ch6_ahc.md'), TABLE_6_21=T621))
add(seg(1973, 2041, [
 ("On the relative line that ACOSS and UNSW publish, Stage 1 cuts poverty after housing costs from 14.2% to 11.3% in the model, with or without the wealth-tax fund's dividend (Table 6.24).",
  "The tables in this section were run on Part 1; P\\*'s results at the same budget are in Table 5.7. On the relative line that ACOSS and UNSW publish, Part 1 cuts poverty after housing costs from 14.2% to 11.3% in the model, with or without the wealth-tax fund's dividend (Table 6.22), and P\\* to 10.5%."),
 ("The strongest targeted package's Rent Assistance rise of 75% would bring them to 80.6%", "The 75% Rent Assistance rise, which P\\* includes, brought them to 80.6% in the targeted package's run"),
]))
add(seg(2095, 2116))
add(seg(2118, 2210, [
 ("At Stage 1 a single JobSeeker recipient", "These worked examples were run on the 22 October design. At Stage 1 a single JobSeeker recipient"),
]))
add(seg(2212, 2244, [
 ("Extra demand from Stage 1 could raise interest rates and rents.", "Extra demand from Stage 1 could raise interest rates and rents. The scenario was run on Part 1."),
 ("which is why the rent safeguard raises Rent Assistance (Table 9.6).", "which is why P\\* raises Rent Assistance 75% and the rent safeguard raises it further (Table 9.6)."),
]))
add(seg(2246, 2264, [
 ("Gross payments follow population,", "On the 22 October design, which paid a dividend at Stage 1, gross payments follow population,"),
]))
# ---- pathway
add("### Funding if the universal pathway were triggered\n\nEverything from here to the assumptions register, except Figure 6.3, was run on the 22 October design: Part 1 with the wealth-tax fund's dividend, and Stages 2 and 3 at the rates that paper costed. No universal rate is now legislated; these tables show what a later Act would face. The lower reference path has Stage 1 in full and Stages 2 and 3 at their earliest dates with no displacement, which cannot meet the need test. On it net cost is 1.9% of GDP at Stage 1, 8.2% at Stage 2 and 12.2% at Stage 3, and 11.9% by 2045-46 (Tables 6.34 and 6.35).")
add(seg(799, 829))
add(seg(862, 885))
add(seg(887, 910))
add(seg(1088, 1121))
add(seg(1313, 1329))
add(seg(1331, 1350))
add(seg(1352, 1379))
add(seg(1381, 1393, [
 ("### AI receipts and the dividend", "### AI receipts"),
 ("AI-driven growth raises the dividend only slowly, through larger durable surpluses, adding A$8 to A$47 to the 2035-36 dividend (Table 6.10a).",
  "AI-driven growth would raise the five taxes' yield and, under the AI receipts rule, lower any rate rise a later Act needs (Tables 6.41 and 6.42)."),
]))
add(seg(1409, 1428, [
 ("![Figure 6.2: AI receipts and step cost](charts/fig6_2_ai_fund.png)",
  "![Figure 6.2: AI receipts and step cost](charts/fig6_2_ai_fund.png)"),
 ("**Figure 6.2 [CHART]. AI receipts under three productivity paths, and the cost of the step from Stage 2 to Stage 3, 2028-29 to 2045-46 (A$ billion a year, nominal)**",
  "**Figure 6.2 [CHART]. AI receipts under three productivity paths, and the cost of the step from a payment at the JobSeeker rate to one at the Age Pension rate, 22 October design, 2028-29 to 2045-46 (A$ billion a year, nominal)**"),
 ("Note: paths are labour productivity growth against the Budget's 1.2% a year. The receipts include taxes already counted in the revenue measures.*",
  "Note: run on the 22 October design; no dividend is shown. Paths are labour productivity growth against the Budget's 1.2% a year. The receipts include taxes already counted in the revenue measures.*"),
]))
add(seg(1430, 1456, [
 ("### Why Stage 3 carries no rate", "### Why Stage 3 is not authorised"),
 ("No rate passes Stage 3's stress-tested certificate on any modelled path, so the Act legislates Stage 3 only as an authority (Table 6.17a).",
  "No rate passes Stage 3's stress-tested certificate on any modelled path, so the paper describes Stage 3 and does not authorise it (Table 6.48)."),
]))
add("### Sensitivity of the pathway's costs")
add(seg(1651, 1651))
add(seg(1464, 1482))
add(seg(1653, 1701, [
 ("On the central path with the wealth-tax fund net financial worth is above baseline every year (Figure 6.3).",
  "On P\\*'s central path the cash balance is worse than baseline in {{PSTAR_UCB_YEARS_WORSE}} of 18 years and net financial worth is below baseline until the 2028-29 borrowing is repaid in {{PSTAR_ADVANCE_REPAID_YEAR}} (Figure 6.3)."),
 ("against the Budget baseline, central path with the wealth-tax fund as an illustration, 2028-29 to 2045-46 (per cent of GDP)**",
  "against the Budget baseline: the underlying cash balance (Panel A), and net debt and net financial worth (Panel B), P\\*'s central path, 2028-29 to 2045-46 (per cent of GDP)**"),
 ("![Figure 6.3: underlying cash balance, net debt and net financial worth](charts/fig6_3_ucb_netdebt.png)",
  "![Figure 6.3: underlying cash balance, net debt and net financial worth](charts/fig6_3_ucb_netdebt.png)"),
 ("*Source: author's modelling [S5, S61, S168]. Data: charts/data/fig6_3_ucb_netdebt.csv. Note: as for the Future Fund, a treatment that is unsettled (Table 6.7g), the cash balance excludes the fund's earnings, net debt counts only the fund's cash and credit (with a memo line counting all its assets), and net financial worth counts the whole fund. A$ values are in Table 6.7c.",
  "*Source: author's fiscal model, option B runs (Table 6.6; model results Table B1) [S5, S61]. Data: charts/data/fig6_3_ucb_netdebt.csv. Note: P\\*'s central path with no fund, unlike the rest of this part of the chapter. Panel A shows the underlying cash balance against baseline; Panel B shows net debt and net financial worth against baseline, which mirror each other because with no fund Stage 1 adds no financial assets. A$ values are in Table 6.6. PROVISIONAL."),
 ("Table 6.16a tests the rules on the central path.", "Section 10 tests the rules on the central path with the wealth-tax fund (Table 10.25)."),
]))
add(seg(1716, 1741, [
 ("If the six taxes yield 70% of their costings and the labour response is 0.29, the wealth-tax fund's dividend falls to A$237 in 2045-46 and the levy reaches 1.82% of market income (Table 6.14a), or 1.90% with the child payment's income effect scaled (supplementary model_output.md, Table F4-114).",
  "If the five taxes yield 70% of their costings and the labour response is 0.29, Part 1's levy peaked at 7.65% of market income (A$566.4bn to 2045-46; Table 6.10), and P\\*'s at {{PSTAR_COMBINED_DOWNSIDE_LEVY_PEAK}}."),
]))
add(seg(1743, 1838, [
 ("In a moderate or severe AI shock the counter-cyclical rule holds the floor's indexation and any dividend once a displacement is declared. It is declared once the need test's youth unemployment leg has been met over eight consecutive quarters: 2036-37 (moderate) or 2034-35 (severe; Table 6.18d). Under a fund option a loan from the fund then meets the gap for about a year, until the first year Stage 2 could start. With no Stage 2, the levy with the wealth-tax fund reaches 2.17% of market income by 2045-46 (moderate) or 5.87% (severe), as market income falls 7.5% or 19.4%. Part 1 alone, with no fund to lend, levies from 2035-36 or 2032-33 and reaches 2.37% or 6.17% (Tables 6.18a and 6.18b).",
  "In a moderate or severe AI shock the counter-cyclical rule holds the floor's and child payment's indexation once a displacement is declared, after the need test's youth unemployment leg has been met over eight consecutive quarters: 2036-37 (moderate) or 2034-35 (severe; Table 6.53). With no fund, the levy meets the gap. On Part 1's run, with no universal payment voted, it levies from 2035-36 or 2032-33 and reaches 2.37% or 6.17% of market income by 2045-46, as market income falls 7.5% or 19.4% (Tables 6.50 and 6.51). Under the wealth-tax fund option the fund would lend for about a year and the levy would reach 2.17% or 5.87%. These runs have not been repeated on P\\*."),
 ("With no Stage 2 vote the severe levy then reaches 2.88% to 6.01% of market income by 2045-46 and the moderate levy 1.15% to 2.22%.",
  "With no universal payment, Part 1's levy then reaches 3.21% to 6.30% of market income by 2045-46 in the severe case and 1.43% to 2.41% in the moderate case (Table 6.52)."),
]))
add(seg(1840, 1875))
add(seg(2318, 2454, [
 ("which moves the levy and the dividend, and the taxpayer response", "which moves the levy, and the taxpayer response"),
 ("| B1 | Stage designs and dates |", "| P1 | Recommended Stage 1 (P\\*) | The payment floor (C1); the child payment rule E14 without its supplement-only schedule, with a supplement of A$6,750 a child in 2028-29, re-costed at Part 1's fiscal cost; Rent Assistance maximum rates +75% (C19); no dividend, wealth tax or fund; the five durable taxes, with kept surpluses drawn before any levy | Round 13 household model (model Table F4-117); P\\* full fiscal path ({{PSTAR_MODEL_TABLE_REF}}) |\n| P2 | Joint stress test | Five taxes' yield, labour, caseload and taxpayer responses, AI path and cost overruns drawn together from {{STRESS_TEST_DISTRIBUTION_SOURCES}}; {{STRESS_TEST_PATHS}} paths | Model review |\n| B1 | Stage designs and dates (22 October design) |"),
]))
exec(open(os.path.join(BASE, 'build3.py')).read())
