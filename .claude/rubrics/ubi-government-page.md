# Rubric v3.3: Beyond Work (UBI) pages in the style of a government service

Scope: the overview (`/UBI/`) and the paper (`/UBI/paper/` and its chapters).
The calculator (`/UBI/calculator/`) is outside the review loop: it is kept in
step with the paper by the sync step in section G, not scored.
Modelled on the GOV.UK Design System and its content guidance, the Australian
Government GOLD Design System, the Australian Digital Service Standard, the US
Web Design System (USWDS) and WCAG 2.2 AA.

Scoring: every criterion is pass or fail. Score = criteria passed / criteria
total. A page set passes only at 100%. The reviewer checks each criterion on
each page it applies to and records the evidence (what was looked at, what was
measured, a screenshot name). "Looks fine" is not evidence. The reviewer must
not be the builder.

## A. Identity, trust and honesty

A1. Every page states plainly who publishes it (Mai Software) in the header or
    directly below it, and the footer says the site is not a government site.
A2. No Commonwealth or state coat of arms, crest, government logo or wording
    that claims or implies the pages are published by a government.
A3. The paper's author, status (a submission prepared by Mai Software), date and
    revision are stated on the overview and at the top of the paper.
A4. Every figure on the overview that is an estimate or model
    output is labelled as an estimate or modelled figure on screen, close to the
    number, not only in a footnote.
A5. Nothing confirms an action that did not happen and no empty state implies
    data that is not there.
A6. Contact route: a working way to write to the publisher (a mailto link or
    a contact page) in the footer of every page.
A7. No secrets, tokens, local file paths or build-machine paths in any served
    file.
A8. Every page in scope carries the working-draft banner directly below the primary
    navigation (the same markup on every page), saying the paper and calculator
    are updated regularly and may change, with a link to what changed in the
    latest revision; the paper's own front matter states its working-draft
    status and revision date.

## B. Navigation and structure

B1. One header pattern on every page: publisher name, service name ("Beyond
    Work"), and the same primary navigation in the same order (Overview, The
    paper, Calculator). The current section is marked with `aria-current`.
B2. A skip link ("Skip to main content") is the first focusable element on every
    page and becomes visible on focus.
B3. Breadcrumbs on every page below the overview, starting with the overview and
    ending with the current page (the current page not linked).
B4. Each page has exactly one `h1`, and headings nest without skipping levels.
B5. Long pages (over about three screens) have an "On this page" contents list
    at the top that links to each `h2`, and the links work.
B6. The paper is split into chapters, one page each, with a persistent contents
    list of all chapters, the current chapter marked, and Previous / Next links
    at the bottom of each chapter.
B7. Every internal link resolves (no 404s), uses an absolute path under `/UBI/`,
    and link text says where it goes ("Read the executive summary", never
    "click here" or "here").
B8. The footer is the same on every page: links back to the overview, to
    maisoftware.app, to the privacy page, a contact link, and the "not a
    government site" statement.
B9. The browser title of every page is "<page name> - Beyond Work - Mai
    Software" (or the same pattern), unique per page.
B10. No page needs more than two clicks from the overview to reach any chapter
     or the calculator.

## C. Content and plain language

C1. Every page opens with a lead paragraph that says in one or two sentences
    what the page is for and who it is for.
C2. Sentences in page copy written for the site (not the paper's own text)
    average under 25 words; no sentence over 40 words.
C3. No marketing or filler words in site copy: "seamless", "robust",
    "cutting-edge", "powerful", "game-changing", "revolutionary",
    "world-class", "exciting". No exclamation marks in site copy.
C4. Acronyms are expanded on first use on each page (ABI, PBO, AI, UBI, GDP,
    FTB, JobSeeker is a proper noun and needs no expansion).
C5. Numbers in site copy are presented with units and a year or period ("A$62.0
    billion in 2028-29"), and dollar figures say A$ or US$.
C6. Dates are written in full ("1 July 2028"), not numerically.
C7. The paper's text is reproduced faithfully from the current revised paper
    source: no section of the paper is missing, every table renders as a table, every figure is present with its
    caption and alt text, and every [S#] citation links to its entry in the
    sources list.
C8. The overview page gives a reader who will not open the paper the proposal,
    its cost, who pays, the poverty effect and the main risks, each with the
    paper's figure.
C9. Site copy is in Australian English (organisation, labour, programme or
    program used consistently, modelling).
C10. No emoji anywhere. No icons used as the only carrier of meaning.

## D. Visual design and clutter

D1. One typeface family for text (a system sans-serif stack is acceptable),
    body text at least 17px on desktop and 16px on mobile, line height 1.5 or
    more, measure 50-75 characters for body copy.
D2. A limited palette: one dark header colour, body text near-black on white or
    off-white, one link colour, one focus colour, plus the chart colours. No
    gradients, no drop shadows on cards, no decorative background images.
D3. White space does the separating: no borders, dividers or boxes that carry
    no meaning. Panels are used only for things that are different in kind
    (warnings, key figures, results).
D4. Links are underlined in body text and distinguishable from surrounding text
    by more than colour.
D5. Buttons look like buttons (solid fill, clear label, large target) and links
    look like links; nothing is both.
D6. Charts: each has a title that says what it shows, axes labelled with units,
    a source line, readable at mobile width (scrollable or redrawn, never
    cropped), and a text alternative (alt text or a data table).
D7. Tables: header row marked up with `th`, numeric columns right-aligned,
    wide tables scroll horizontally inside their container at narrow widths
    rather than breaking the page layout, and a caption or preceding heading.
D8. Nothing moves without the person asking (no autoplay, no parallax, no
    animated counters longer than 300 ms), and motion honours
    `prefers-reduced-motion`.
D9. The page does not look like a marketing site: no hero image, no "feature
    cards" grid with icons, no testimonials, no call-to-action band.
D10. Consistent spacing scale (multiples of 4 or 8 px) and consistent heading
     sizes across all pages.

## E. Accessibility (WCAG 2.2 AA)

E1. Text contrast at least 4.5:1 for body text and 3:1 for large text and for
    UI component boundaries, measured, including text on the header and
    buttons and chart labels.
E2. Every page passes an automated axe-core run with zero violations.
E3. Every interactive element is reachable and operable with the keyboard alone,
    in a sensible order, and the focus indicator is visible on every element
    (at least 3:1 contrast, 2px thick or equivalent).
E4. Every form control has a visible label associated with `for`/`id` or
    `aria-labelledby`; sliders expose their current value to assistive
    technology (`aria-valuetext` or an associated output).
E5. Every image has alt text that conveys the content, or `alt=""` if
    decorative. SVG charts have an accessible name.
E6. Page language is set (`lang="en-AU"`), and the viewport meta allows zoom
    (no `maximum-scale=1` or `user-scalable=no`).
E7. Content reflows at 320px wide and at 400% zoom with no horizontal scrolling
    of the page (tables and charts may scroll inside their own container).
E8. Touch targets at least 24x24 CSS px (44x44 for primary controls) with space
    between them.
E9. Colour is never the only way information is conveyed (gains and losses, the
    selected tab, errors).
E10. Live-updating results use `aria-live="polite"` or an equivalent so screen
     reader users learn the result changed, without being interrupted on every
     keystroke.
E11. Headings and landmarks: `header`, `nav` (labelled), `main`, `footer`
     present once each; a `nav` for breadcrumbs and one for contents are
     labelled distinctly.

## F. Responsive behaviour and performance

F1. Layout works at 320, 375, 768, 1024 and 1440 px wide with no overlap,
    clipping or horizontal page scroll.
F2. No external requests other than fonts from the site's own domain; no
    third-party scripts, trackers or CDNs.
F3. The overview is under 150 KB uncompressed; every other page (with inline
    CSS and JS) is under 600 KB, except a paper chapter whose tables need more
    (under 1 MB).
F4. Images are SVG or appropriately sized; no image over 300 KB.
F5. The pages render correctly with JavaScript disabled.
F6. Print styles: the paper chapters print without navigation and with
    readable tables.
F7. HTML validates with no errors (duplicate ids, unclosed elements, invalid
    nesting), checked with a validator or a parser that reports errors.

## G. Calculator sync (outside the review loop; not scored)

The calculator is not reviewed against this rubric. The reviewer does not score
it and does not open it except to confirm that the navigation link resolves
(H1). It is kept correct by a sync step instead. Whenever a metric or measure
in the paper changes (a model re-run, an edited facts file, a new scenario or
a corrected figure), the builder, in the same change:

1. updates the model outputs the paper is written from (optionb/model/runs/
   and optionb_facts.json) and any paper value typed into the calculator's
   data step (optionb_data.js);
2. runs `node calc_sync.js --apply`, which rebuilds UBI/calculator/index.html
   from those outputs, runs the page's own reproduction check (every figure
   must match) and then compares every figure embedded in the page with the
   model outputs and the paper;
3. commits the rebuilt calculator with the paper change, and names it in the
   paper's change note when a calculator figure moves.

`node calc_sync.js` (without `--apply`) only checks. It exits with an error and
lists each figure that differs. A change to the paper is not finished while it
reports the calculator out of sync.

## H. Technical correctness

H1. All three page types load with HTTP 200 from the deployed site (or a local
    static server that mirrors the Vercel layout), including `/UBI/`,
    `/UBI/paper/`, each chapter and every chart file; the calculator link
    (`/UBI/calculator/`) resolves.
H2. Lowercase `/ubi/` paths reach the same pages (by rewrite or redirect), with
    no redirect loop, verified on a deployment where possible.
H3. No console errors or warnings on load or on interaction in Chromium.
H4. Each page has `meta description`, `canonical`, and Open Graph title and
    description, and a favicon.
H5. The files this work adds to the branch (everything under /UBI/ and
    .claude/) contain nothing that does not belong on a published site:
    no templates with placeholder text, test screenshots, backups, zip
    archives, build scripts or node_modules; and .claude/ is excluded from
    deployment (.vercelignore); the source bundle in .claude/beyond-work/
    (the paper source, model, site-build and calculator source) is allowed
    there because it is never deployed. Files that were already in the repository
    before this work are out of scope.

## I. Does the recommendation follow from the evidence (version 3 gate)

Added after the October 2026 external critique. These criteria test substance,
not presentation. Each applies to the overview and the paper wherever the
subject appears.

I1. The recommended Stage 1 is the option the paper's own comparison supports on
    its stated objectives; or the paper names the value judgement that overrides
    that comparison, quantifies its price (people in poverty and A$ a year) and
    shows why the price is worth paying.
I2. Any claim that no one loses holds for income after housing costs, or is
    stated as the narrower guarantee it is (payments under today's rules), with
    the households worse off after housing costs counted.
I3. The Budget advance is called borrowing, with its amount, in the paper's
    summary and on the overview.
I4. The risk to the funding is shown from a joint stress test (a probability or
    range for the first levy year), not only the central date.
I5. Household and population results lead with figures after the funding taxes,
    with before-funding figures beside them, and count "better off" only above
    a stated material amount.
I6. Uncertain dates and rates are given as ranges.
I7. Wherever the overview or the paper mentions the calculator's check against
    the paper, it is described as reproducing the model, not validating its
    assumptions.
I8. The decisive questions come first in any objections list (why not the
    targeted package, why legislate any universal pathway, who pays), answered
    with the paper's own figures; weak objections few serious critics make are
    not featured.
I9. The universal stages are a conditional pathway: the tests are legislated, no
    rates are; Stage 3 is described, not authorised. Dividend options sit in
    their own section, are described neutrally, and none is recommended.
I10. Every figure from a provisional or unchecked model run is labelled
     provisional; every external fact matches its source.
I11. A red-team reader asking only "does the recommendation follow from the
     results?" finds no place where the paper's own figures favour an option
     the paper does not recommend without the price being stated.
I12. The paper deals with the second-round effects of an AI displacement
     shock and the site reflects them: (a) the surge of claims on a
     means-tested system (processing capacity, waiting periods, the assets
     test and the liquid-assets waiting period as barriers for displaced
     workers) with a quantified estimate of claim volumes in the paper's
     displacement scenarios and a stated surge response; (b) displaced
     workers' ability to service existing debt on the safety-net rate, with
     the share of displaced households holding mortgages or investment
     property and the gap between the payment and typical repayments; (c) the
     effect of forced sales of investment properties and other assets on
     property prices, the Budget and the paper's own rent scenario, with a
     bounded, provisional estimate and its sources, or a plain statement of
     what cannot be estimated. Policy options are priced where the model can
     price them, and the overview summarises the finding in plain words.
I13. The paper and the overview are organised as one argument: where Australia
     is now (current state and problems, with today's poverty rates, their
     sources and years, and the paper's targets); what is likely to happen in
     the near future (stated as ranges with honest uncertainty, including the
     lesson of the industrial revolution, with sources); one or two solutions
     (the paper's recommendation, each tied to the problems it fixes); and
     whether the model could work beyond Australia (what transfers, what
     depends on Australian institutions, with no unsourced claims about other
     countries). The thesis (a good life, not jobs) is stated plainly, and the
     paper is consistent with it: employment is monitored, not targeted, and
     any place the design falls short of the thesis is named.
I14. The paper includes an illustrative costing of zero poverty after housing
     costs, and the model produces it: (a) it is labelled illustrative and not
     recommended; (b) at least two designs are costed on the paper's household
     model (an exact top-up and at least one design with a lower withdrawal
     rate or a universal payment), each with its static cost, a range for the
     work response and its share of GDP, both from current rules and on top
     of the recommendation; (c) it says plainly why measured poverty would not
     reach zero, or stay there, in practice (the relative line moves with the
     median, incomes below zero after housing costs, take-up, measurement);
     (d) the overview summarises it in plain words with the paper's figures.
I15. The paper estimates the cost of poverty to society: (a) an annual cost
     for each person in poverty and each child in poverty, as a low, central
     and high range, with its components, method, price year and sources, and
     the cost to government budgets kept apart from the wider cost; (b) the
     poverty trap for children raised in poverty, with Australian evidence on
     how disadvantage persists and a stated share of the outcome gap that
     income itself can close (association is not presented as cause); (c)
     the health costs linked to poverty that fall on the public health
     system, with sourced evidence that early intervention costs less than
     later treatment; (d) the estimate is set beside the cost of the
     recommendation and of the zero-poverty scenario without double counting,
     and the paper claims no more than its figures show (for example, that a
     payment pays for itself); (e) the overview summarises it in plain words.
