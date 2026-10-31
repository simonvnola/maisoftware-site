#!/usr/bin/env python3
"""Option B charts: redraw Figures 6.1, 6.2, 6.3 and 7.1 for the revised paper.

- 6.1 and 6.3 come from P*'s central path with no dividend: the model's run file
  (runs/fiscal.json, funds['star_m2'], which is Table B1 and the paper's Table 6.6),
  as shares of GDP using the fiscal model's GDP path.
- 6.2 keeps its data (run on the 22 October design) and is relabelled.
- 7.1 is rebuilt from the revised implementation chapter (Tables 7.1, 7.2, 9.1, 9.6).
The other four figures are copied from the round-2 drawings unchanged.

Writes SVGs to charts-out-b/, the data CSVs to charts-data-b/, and alt texts
computed from the data to charts-data-b/alt.json.
Run: PYTHONPATH=<scratchpad>/pylibs python3 make_charts_b.py
"""
import csv
import json
import os
import shutil
from datetime import date

import make_charts as mc
from make_charts import plt, mdates, INK, GREY, BLUE, ORANGE, PURPLE, TEAL, GREEN, RED, RULE, WASH, fig, source, fy_axis

S = mc.SCRATCH
FISCAL = os.path.join(S, "optionb", "model", "runs", "fiscal.json")
OLD_DATA = os.path.join(S, "zip", "beyond-work", "charts", "data")
OUT = os.path.join(S, "charts-out-b")
DATA = os.path.join(S, "charts-data-b")
os.makedirs(OUT, exist_ok=True)
os.makedirs(DATA, exist_ok=True)
mc.OUT = OUT
ALT = {}

MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def fy(y):
    return f"{y}-{str(y + 1)[2:]}"


def write_csv(name, header, rows):
    with open(os.path.join(DATA, name), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)


def p1(x):
    return f"{x:.1f}"


def p2(x):
    return f"{x:.2f}"


fiscal = json.load(open(FISCAL, encoding="utf-8"))
ROWS = fiscal["funds"]["star_m2"]["rows"]           # P* re-costed, recommended (Table B1 = Table 6.6)
GDP = {k: v["gdp"] for k, v in fiscal["p1_rows"].items()}
YEARS = [int(r["fy"][:4]) for r in ROWS]
assert abs(ROWS[0]["net"] - 62.0) < 0.1 and abs(ROWS[0]["bal"] + 20.7) < 0.05 and abs(sum(r["levy"] for r in ROWS) - 36.5) < 0.1


def pct(r, key):
    return r[key] / GDP[r["fy"]] * 100


# ----------------------------------------------------------------- 6.1
def fig6_1():
    taxes = [pct(r, "rev") for r in ROWS]
    cost = [pct(r, "net") for r in ROWS]
    bal = [pct(r, "bal") for r in ROWS]
    levy = [pct(r, "levy") for r in ROWS]
    write_csv("fig6_1_funding_pct_gdp.csv",
              ["year", "five_taxes_bn", "net_cost_bn", "margin_bn", "interest_bn", "kept_surpluses_drawn_bn", "levy_bn",
               "levy_pct_market_income", "balance_30_june_bn", "gdp_bn", "five_taxes_pct_gdp", "net_cost_pct_gdp",
               "balance_30_june_pct_gdp", "levy_pct_gdp"],
              [[r["fy"], p1(r["rev"]), p1(r["net"]), p1(r["margin"]), p1(r["interest"]), p1(r["used"]), p1(r["levy"]),
                f"{r['rate'] * 100:.2f}", p1(r["bal"]), f"{GDP[r['fy']]:.0f}", f"{t:.3f}", f"{c:.3f}", f"{b:.3f}", f"{lv:.3f}"]
               for r, t, c, b, lv in zip(ROWS, taxes, cost, bal, levy)])

    H = 900
    f = fig(H)
    ax = f.add_axes([0.10, 1 - 320 / H, 0.87, 270 / H])
    ax.set_title("A. The five taxes against P*'s net cost (per cent of GDP)")
    ax.fill_between(YEARS, taxes, cost, where=[t >= c for t, c in zip(taxes, cost)], interpolate=True,
                    facecolor="none", hatch="///", edgecolor=GREEN, linewidth=0, label="Taxes above net cost: surplus kept")
    ax.fill_between(YEARS, taxes, cost, where=[t < c for t, c in zip(taxes, cost)], interpolate=True,
                    facecolor="none", hatch="\\\\\\", edgecolor=RED, linewidth=0, label="Taxes below net cost: borrowing, kept surpluses or the levy")
    ax.plot(YEARS, cost, "-", color=INK, label="P*'s net cost")
    ax.plot(YEARS, taxes, "--", color=BLUE, marker="o", markersize=4, label="The five durable taxes")
    ax.annotate(f"{ROWS[0]['fy']}: A${-ROWS[0]['bal']:.1f}bn borrowed", xy=(YEARS[0] + 0.1, (taxes[0] + cost[0]) / 2),
                xytext=(YEARS[0] + 1.6, 1.25), fontsize=13, va="center", ha="left",
                arrowprops=dict(arrowstyle="-", color=INK, lw=1))
    fy_axis(ax, YEARS, 3)
    ax.set_ylim(1.0, 2.4)
    ax.set_ylabel("Per cent of GDP")
    h, l = ax.get_legend_handles_labels()
    f.legend(h, l, loc="upper left", bbox_to_anchor=(0.10, 1 - 355 / H), handlelength=2.6)

    ax2 = f.add_axes([0.10, 1 - 770 / H, 0.87, 230 / H])
    ax2.set_title("B. Borrowing outstanding or surpluses kept at 30 June, and the levy (% of GDP)")
    ax2.axhline(0, color=INK, linewidth=1)
    w = 0.38
    neg = [b if b < 0 else 0 for b in bal]
    posv = [b if b > 0 else 0 for b in bal]
    ax2.bar([y - w / 2 for y in YEARS], neg, width=w, color="none", edgecolor=RED, hatch="\\\\\\", linewidth=1.2,
            label="Borrowing outstanding")
    ax2.bar([y - w / 2 for y in YEARS], posv, width=w, color="none", edgecolor=GREEN, hatch="///", linewidth=1.2,
            label="Surpluses kept")
    ax2.bar([y + w / 2 for y in YEARS], levy, width=w, color=ORANGE, edgecolor=ORANGE, linewidth=1.2, label="Levy on market income")
    ax2.annotate(f"Levy from {ROWS[[r['levy'] > 0 for r in ROWS].index(True)]['fy']}", (YEARS[-2] + w / 2, levy[-2]),
                 xytext=(-8, 26), textcoords="offset points", ha="right", fontsize=13, color=INK,
                 arrowprops=dict(arrowstyle="-", color=INK, lw=1))
    fy_axis(ax2, YEARS, 3)
    ax2.set_ylim(-0.8, 1.0)
    ax2.set_ylabel("Per cent of GDP")
    ax2.set_xlabel("Financial year")
    h2, l2 = ax2.get_legend_handles_labels()
    f.legend(h2, l2, loc="upper left", bbox_to_anchor=(0.10, 1 - 810 / H), ncol=3, handlelength=1.6, columnspacing=1.2)
    source(f, "Source: author's fiscal model, option B runs (Table 6.6) [S5]. P*'s central path, no dividend. Provisional.")
    mc.save(f, "fig6_1_funding_pct_gdp")

    i_peak = max(range(len(ROWS)), key=lambda i: ROWS[i]["bal"])
    i_cross = next(i for i in range(1, len(ROWS)) if ROWS[i]["margin"] < 0)
    i_levy = next(i for i in range(len(ROWS)) if ROWS[i]["levy"] > 0)
    i_repaid = next(i for i in range(len(ROWS)) if ROWS[i]["bal"] >= 0)
    ALT["fig6_1_funding_pct_gdp.svg"] = (
        f"Two charts, {ROWS[0]['fy']} to {ROWS[-1]['fy']}, per cent of GDP, on P*'s central path with no dividend. "
        f"Panel A: the five taxes raise {taxes[0]:.2f}% of GDP in {ROWS[0]['fy']} against P*'s net cost of {cost[0]:.2f}%, "
        f"rise above it to a peak of {max(taxes):.2f}% in {ROWS[taxes.index(max(taxes))]['fy']}, fall below it from {ROWS[i_cross]['fy']}, "
        f"and end at {taxes[-1]:.2f}% against {cost[-1]:.2f}% in {ROWS[-1]['fy']}. "
        f"Panel B: A${-ROWS[0]['bal']:.1f} billion is borrowed in {ROWS[0]['fy']} ({-bal[0]:.2f}% of GDP) and repaid by 30 June {int(ROWS[i_repaid]['fy'][:4]) + 1}; "
        f"surpluses kept peak at A${ROWS[i_peak]['bal']:.1f} billion at 30 June {int(ROWS[i_peak]['fy'][:4]) + 1} and are used up by {ROWS[i_levy]['fy']}, "
        f"when a levy starts, reaching {ROWS[-1]['rate'] * 100:.2f}% of market income ({levy[-1]:.2f}% of GDP) in {ROWS[-1]['fy']}.")


# ----------------------------------------------------------------- 6.2
def fig6_2():
    rows = list(csv.DictReader(open(os.path.join(OLD_DATA, "fig6_2_ai_fund_bn.csv"), encoding="utf-8")))
    shutil.copyfile(os.path.join(OLD_DATA, "fig6_2_ai_fund_bn.csv"), os.path.join(DATA, "fig6_2_ai_fund_bn.csv"))
    yrs = [int(r["year"][:4]) for r in rows]
    pc = [float(r["fund_pc"]) for r in rows]
    p2_ = [float(r["fund_2pc"]) for r in rows]
    p3 = [float(r["fund_3pc"]) for r in rows]
    step = [(y, float(r["step_cost_s2_to_s3"])) for y, r in zip(yrs, rows) if r["step_cost_s2_to_s3"]]
    f = fig(480)
    ax = f.add_axes([0.11, 0.19, 0.69, 0.66])
    ax.set_title("AI receipts under three productivity paths, and the cost of the step\nto a payment at the Age Pension rate (run on the 22 October design)", linespacing=1.3)
    ax.plot(yrs, p3, "-.", color=GREEN, label="AI receipts: productivity growth 3.0% a year")
    ax.plot(yrs, p2_, "--", color=ORANGE, label="AI receipts: 2.0% a year")
    ax.plot(yrs, pc, "-", color=BLUE, label="AI receipts: Productivity Commission path")
    ax.plot([s[0] for s in step], [s[1] for s in step], ":", color=INK, marker="D", markersize=4,
            label="Step from the JobSeeker rate to the Age Pension rate")
    for s, lab, c in [(p3, "3.0%", GREEN), (p2_, "2.0%", ORANGE), (pc, "PC path", BLUE)]:
        ax.annotate(f"A${s[-1]:.0f}bn ({lab})", (yrs[-1], s[-1]), xytext=(6, 0), textcoords="offset points", va="center", fontsize=13, color=c)
    ax.annotate(f"A${step[-1][1]:.0f}bn (step)", (yrs[-1], step[-1][1]), xytext=(6, 0), textcoords="offset points", va="center", fontsize=13, color=INK)
    fy_axis(ax, yrs, 3)
    ax.set_ylim(0, 560)
    ax.set_ylabel("A$ billion a year, nominal")
    ax.set_xlabel("Financial year")
    ax.legend(loc="upper left", handlelength=2.6)
    source(f, "Source: author's modelling [S5, S30, S32, S127], 22 October design. Paths are labour productivity growth against the Budget's 1.2% a year.")
    mc.save(f, "fig6_2_ai_fund")
    ALT["fig6_2_ai_fund.svg"] = (
        f"Line chart, {rows[0]['year']} to {rows[-1]['year']}, A$ billion a year, run on the 22 October design. "
        f"AI receipts rise from about A${pc[0]:.0f} billion to A${pc[-1]:.0f} billion on the Productivity Commission path, "
        f"to A${p2_[-1]:.0f} billion at 2.0% productivity growth and to A${p3[-1]:.0f} billion at 3.0%. "
        f"The cost of the step from a payment at the JobSeeker rate to one at the Age Pension rate rises from "
        f"A${step[0][1]:.0f} billion in {fy(step[0][0])} to A${step[-1][1]:.0f} billion in {fy(step[-1][0])}, above the receipts on the two lower paths.")


# ----------------------------------------------------------------- 6.3
def fig6_3():
    ucb = [pct(r, "ucb") for r in ROWS]
    nd = [pct(r, "nd") for r in ROWS]
    nfw = [-x for x in nd]
    write_csv("fig6_3_ucb_netdebt.csv",
              ["year", "ucb_vs_baseline_bn", "net_debt_vs_baseline_bn", "nfw_vs_baseline_bn", "ucb_vs_baseline_pct_gdp",
               "net_debt_vs_baseline_pct_gdp", "nfw_vs_baseline_pct_gdp"],
              [[r["fy"], p1(r["ucb"]), p1(r["nd"] + 0.0), p1(-r["nd"] + 0.0), f"{u:.3f}", f"{n + 0.0:.3f}", f"{w + 0.0:.3f}"]
               for r, u, n, w in zip(ROWS, ucb, nd, nfw)])
    H = 760
    f = fig(H)
    ax = f.add_axes([0.10, 1 - 300 / H, 0.87, 240 / H])
    ax.set_title("A. Underlying cash balance against the baseline (per cent of GDP)")
    ax.axhline(0, color=INK, linewidth=1)
    posv = [u if u > 0 else 0 for u in ucb]
    neg = [u if u < 0 else 0 for u in ucb]
    ax.bar(YEARS, posv, width=0.6, color="none", edgecolor=GREEN, hatch="///", linewidth=1.2, label="Better than baseline")
    ax.bar(YEARS, neg, width=0.6, color="none", edgecolor=RED, hatch="\\\\\\", linewidth=1.2, label="Worse than baseline")
    fy_axis(ax, YEARS, 3)
    ax.set_ylim(-0.8, 0.5)
    ax.set_ylabel("Per cent of GDP")
    ax.legend(loc="upper right", handlelength=1.6)
    ax2 = f.add_axes([0.10, 1 - 640 / H, 0.87, 250 / H])
    ax2.set_title("B. Net debt and net financial worth against the baseline (% of GDP)")
    ax2.axhline(0, color=INK, linewidth=1)
    ax2.plot(YEARS, nd, "-", color=BLUE, marker="o", markersize=4, label="Net debt")
    ax2.plot(YEARS, nfw, "--", color=ORANGE, marker="s", markersize=4, label="Net financial worth")
    ax2.text(0.99, 0.04, "With no fund, net financial worth\nmoves opposite to net debt.", transform=ax2.transAxes,
             ha="right", va="bottom", fontsize=13, color=GREY)
    fy_axis(ax2, YEARS, 3)
    ax2.set_ylim(-1.0, 1.0)
    ax2.set_ylabel("Per cent of GDP")
    ax2.set_xlabel("Financial year")
    ax2.legend(loc="upper right", handlelength=2.6)
    source(f, "Source: author's fiscal model, option B runs (Table 6.6) [S5]. P*'s central path, no fund. Provisional.")
    mc.save(f, "fig6_3_ucb_netdebt")
    worse = sum(1 for r in ROWS if r["ucb"] < -0.05)
    i_nd_neg = next(i for i in range(len(ROWS)) if ROWS[i]["nd"] < 0)
    i_min = min(range(len(ROWS)), key=lambda i: ROWS[i]["nd"])
    i_b0 = next(i for i in range(len(ROWS)) if ROWS[i]["ucb"] > 0)
    i_b1 = i_b0
    while i_b1 + 1 < len(ROWS) and ROWS[i_b1 + 1]["ucb"] > 0:
        i_b1 += 1
    ALT["fig6_3_ucb_netdebt.svg"] = (
        f"Two charts, {ROWS[0]['fy']} to {ROWS[-1]['fy']}, per cent of GDP against the Budget baseline, on P*'s central path with no fund. "
        f"Panel A: the underlying cash balance is {-ucb[0]:.2f}% of GDP worse than baseline in {ROWS[0]['fy']}, better in each year from "
        f"{ROWS[i_b0]['fy']} to {ROWS[i_b1]['fy']}, worse in {worse} of the 18 years in all, and level with baseline once the levy starts. "
        f"Panel B: net debt is {nd[0]:.2f}% of GDP above baseline at 30 June {YEARS[0] + 1}, falls below baseline from {ROWS[i_nd_neg]['fy']}, "
        f"is furthest below it, by {-nd[i_min]:.2f}% of GDP, at 30 June {YEARS[i_min] + 1}, and returns to baseline by {ROWS[-3]['fy']}; "
        f"net financial worth moves the opposite way.")


# ----------------------------------------------------------------- 7.1
PHASES = [
    # phase, start, end, owner, style
    ("0. Inquiry and consultation", "2026-11-01", "2027-09-30", "Joint select committee; Treasury; DSS", "bar"),
    ("1. Legislation", "2027-07-01", "2027-12-31", "Treasurer; Minister for Social Services", "bar"),
    ("2. Build and test", "2028-01-01", "2028-06-30", "Services Australia; ATO; PBO; JSA", "bar"),
    ("3. Stage 1 (P*): floor, child payment, Rent Assistance +75%", "2028-07-01", "2046-06-30", "DSS; Services Australia; ATO; Treasurer", "bar"),
    ("4. Randomised trial with the work-effort cap", "2029-07-01", "2031-06-30", "DSS; independent evaluator", "bar"),
    ("5. AI need test: quarterly reporting (lapses unless renewed)", "2028-06-30", "2043-06-30", "JSA; ABS", "bar"),
    ("6. PBO certificate of the five taxes, every year", "2029-07-01", "2046-06-30", "PBO", "yearly"),
    ("Any universal payment: a later Act, only after all three tests", "2032-07-01", "2046-06-30", "Parliament; not scheduled", "dashed"),
]
GATES = [
    # number, plot date, label date, row, text
    (1, "2027-05-31", "By 31 May 2027", 0, "First Nations delivery principles, before the exposure drafts"),
    (2, "2027-08-31", "By 31 August 2027", 0, "Full PBO costing of P* and the targeted package"),
    (3, "2027-09-30", "By 30 September 2027", 0, "Joint select committee reports"),
    (4, "2027-12-31", "By 31 December 2027", 1, "ABI Act, levy and revenue Acts passed; no universal rate, no dividend"),
    (5, "2028-03-31", "By 31 March 2028", 2, "Random regional order for the Stage 1 start drawn"),
    (6, "2028-05-31", "By 31 May 2028", 2, "Independent audit of the payment systems"),
    (7, "2028-06-30", "By 30 June 2028", 2, "JSA publishes the AI-specific need-test series"),
    (8, "2028-07-01", "1 July 2028", 3, "Stage 1 (P*) starts, regions in random order to December, with arrears"),
    (9, "2029-06-30", "By June 2029", 4, "Trial contract with a university consortium"),
    (10, "2029-12-31", "2029-30", 6, "First yearly PBO certificate of the five taxes"),
    (11, "2030-06-30", "2029-30", 3, "ANAO audit of delivery, then every three years"),
    (12, "2031-06-30", "2031", 3, "Productivity Commission review"),
    (13, "2031-12-31", "By December 2031", 4, "Trial results published"),
    (14, "2032-07-01", "Not before 1 July 2032", 7, "Earliest a Bill setting a universal rate could follow, after all three tests"),
    (15, "2036-06-30", "2036", 3, "Productivity Commission review"),
    (16, "2041-06-30", "2041", 3, "Productivity Commission review of the Act"),
    (17, "2043-06-30", "30 June 2043", 5, "The pathway's tests lapse unless renewed; Stage 1 continues"),
]


def fig7_1():
    write_csv("fig7_1_roadmap.csv", ["phase", "start", "end", "owner", "style"], [list(p) for p in PHASES])
    write_csv("fig7_1_gates.csv", ["number", "date", "date_label", "phase_row", "gate"], [list(g) for g in GATES])
    colours = [GREY, ORANGE, GREEN, BLUE, PURPLE, TEAL, RED, INK]
    H = 1560
    f = fig(H)
    left, width = 0.03, 0.94

    def panel(box, title, note, rows, x0, x1, ticks, fmt):
        ax = f.add_axes(box)
        ax.set_title(title)
        if note:
            ax.text(1, 1.02, note, transform=ax.transAxes, ha="right", va="bottom", fontsize=13, color=GREY)
        ax.grid(False)
        ax.spines["left"].set_visible(False)
        ax.set_yticks([])
        n = len(rows)
        X0, X1 = mdates.date2num(x0), mdates.date2num(x1)
        for k, idx in enumerate(rows):
            name, s, e, owner, style = PHASES[idx]
            y = (n - 1 - k) * 1.3
            s, e = mdates.date2num(date.fromisoformat(s)), mdates.date2num(date.fromisoformat(e))
            s_c, e_c = max(s, X0), min(e, X1)
            if style == "dashed":
                ax.barh(y, e_c - s_c, left=s_c, height=0.42, color="none", edgecolor=INK, linestyle="--", linewidth=1.5, align="center")
            else:
                ax.barh(y, e_c - s_c, left=s_c, height=0.42, color=colours[idx], align="center")
            if style == "yearly":
                for yr in range(2030, 2047):
                    xd = mdates.date2num(date(yr, 6, 30))
                    if s_c < xd < e_c:
                        ax.plot([xd, xd], [y - 0.21, y + 0.21], color="#ffffff", linewidth=1.5)
            ax.text(X0, y + 0.30, name, fontsize=13, va="bottom", ha="left")
            ax.text(X0, y - 0.28, "Owner: " + owner, fontsize=13, va="top", ha="left", color=GREY)
            prev = None
            for num, d, _lbl, prow, _t in GATES:
                if prow != idx:
                    continue
                xd = mdates.date2num(date.fromisoformat(d))
                if not (X0 <= xd <= X1):
                    continue
                close = prev is not None and (xd - prev) < 0.028 * (X1 - X0)
                yy = y + (0.13 if close else 0.0)
                ax.plot([xd], [yy], marker="o", markersize=18, color=INK, markeredgecolor="#ffffff", markeredgewidth=1.5, zorder=5, linestyle="none")
                ax.text(xd, yy, str(num), color="#ffffff", fontsize=13, fontweight="bold", ha="center", va="center", zorder=6)
                prev = xd
        ax.set_ylim(-0.8, (n - 1) * 1.3 + 0.8)
        ax.set_xlim(X0, X1)
        ax.set_xticks([mdates.date2num(t) for t in ticks])
        ax.set_xticklabels([t.strftime(fmt) for t in ticks])
        for t in ticks:
            ax.axvline(mdates.date2num(t), color=RULE, linewidth=0.8, zorder=0)
        return ax

    ticksA = [date(y, m, 1) for y in (2026, 2027, 2028) for m in (1, 4, 7, 10) if date(2026, 10, 1) <= date(y, m, 1) <= date(2028, 10, 1)]
    panel([left, 1 - 360 / H, width, 300 / H], "A. Set-up, November 2026 to June 2028", "",
          [0, 1, 2, 3], date(2026, 10, 1), date(2028, 12, 31), ticksA, "1 %b\n%Y")
    ticksB = [date(y, 7, 1) for y in range(2028, 2047, 2)]
    ax = panel([left, 1 - 810 / H, width, 370 / H], "B. Stage 1 and the pathway's tests, July 2028 to 2045-46", "",
               [3, 4, 5, 6, 7], date(2028, 1, 1), date(2046, 8, 1), ticksB, "1 Jul\n%Y")
    ax.set_xlabel("Ticks mark the start of financial years (1 July). White marks on the PBO bar: each yearly certificate.")
    lg = f.add_axes([left, 0.03, width, 1 - 900 / H - 0.03])
    lg.axis("off")
    lg.text(0, 1.0, "Gates and milestones (numbered circles on the bars)", fontsize=14, fontweight="bold", va="top")
    for i, (num, d, lbl, prow, text) in enumerate(GATES):
        y = 0.93 - i * 0.0545
        lg.plot([0.018], [y], marker="o", markersize=18, color=INK, linestyle="none", transform=lg.transAxes, clip_on=False)
        lg.text(0.018, y, str(num), color="#ffffff", fontsize=13, fontweight="bold", ha="center", va="center", transform=lg.transAxes)
        lg.text(0.05, y, f"{lbl}: {text}", fontsize=13, va="center", transform=lg.transAxes)
    source(f, "Source: author's proposal (Tables 7.1, 7.2, 9.1 and 9.6) [S5]. The dashed row is not scheduled: it needs a later Act.", y=0.006)
    mc.save(f, "fig7_1_roadmap")
    ALT["fig7_1_roadmap.svg"] = (
        "Timeline in two panels with seventeen numbered gates. Panel A, November 2026 to June 2028: inquiry and consultation to "
        "September 2027, legislation passed by 31 December 2027, then build and test, with Stage 1 (P*) starting on 1 July 2028. "
        "Panel B, July 2028 to 2045-46: Stage 1 runs throughout; the randomised trial runs from July 2029 to June 2031 with results by "
        "December 2031; the AI need test is reported quarterly until the pathway's tests lapse on 30 June 2043 unless renewed; the PBO "
        "certifies the five taxes every year from 2029-30. A dashed, unscheduled row shows that any universal payment needs a later Act, "
        "not before 1 July 2032 and only after the need test, the trial and the PBO certificate are all met.")


def copy_unchanged():
    for name in ["fig2_1_metr_time_horizon", "fig2_2_productivity_compensation", "fig3_1_volunteering", "fig6_4_ssw_pct_gdp"]:
        shutil.copyfile(os.path.join(S, "charts-out", name + ".svg"), os.path.join(OUT, name + ".svg"))
    for name in ["fig2_1_metr_time_horizon.csv", "fig2_2_productivity_compensation.csv", "fig3_1_volunteering.csv", "fig6_4_ssw_pct_gdp.csv"]:
        shutil.copyfile(os.path.join(OLD_DATA, name), os.path.join(DATA, name))


if __name__ == "__main__":
    copy_unchanged()
    fig6_1(); fig6_2(); fig6_3(); fig7_1()
    json.dump(ALT, open(os.path.join(DATA, "alt.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    for k, v in ALT.items():
        print(k, "->", v)
