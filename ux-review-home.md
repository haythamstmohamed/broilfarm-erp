# Home Dashboard UX Review — 2026-08-20

## Desktop observations

The Arabic RTL dashboard successfully presents the active cycle status, a clear one-click daily-record action, five headline KPIs, age-synced environmental targets, scientific daily guidance, urgent feed-stock status, expected consumption by house and cage row, exports, and a daily activity chart. The design language is coherent and the navigation exposes the newly added worker-account module.

## Findings for follow-up evaluation

1. The dashboard has strong information coverage, but the first screen communicates several competing priorities at once: cycle KPIs, weather synchronization, operating guidance, and feed stock.
2. Current production data makes the feed shortage the clearest urgent exception: 0 bags in stock with a 711-bag purchase recommendation.
3. Average weight and FCR correctly show as unavailable because no actual weight sample is logged; the dashboard includes a suggested next action, but the missing data is not yet visually elevated as a decision-blocking item.
4. The forecast section shows both house-level consumption for all birds and cage-row consumption for configured rows. The differing coverage should be labelled more explicitly to avoid interpreting their totals as comparable.

## Responsive findings

The full dashboard remains readable at 375 px and the RTL order is preserved. The main trade-off is vertical length: high-priority actions and current-cycle exceptions are followed by multiple reference and forecasting blocks before the activity chart and follow-up checklist. On a phone, a compact fixed “today” action bar and a collapsible “reference forecasts” section would reduce operational scrolling.

## Visual-system finding

The palette, card spacing, and status treatment are cohesive, but repeated pale rounded cards reduce the distinction between immediate decisions and reference material. A stronger command-center hierarchy should reserve high-contrast treatment for alerts, data quality gaps, and today’s actions, while allowing secondary forecasts and guidance to be visually quieter.

## Functional walkthrough findings

The live dashboard finished synchronizing weather for the selected cycle date and surfaced the current outdoor temperature, humidity, wind, and the age-matched indoor target. This is useful operational context, but the contrast between the outdoor reading and the target could be summarized in a direct status label such as “requires ventilation review” rather than requiring interpretation. The primary action “تسجيل اليوم” is visible in the top command area, while feed-stock management and exports are contextual actions lower in the page.

The primary action opens a focused, house-scoped daily-record form with date, feed, water, mortality, and culls. It explains that feed is deducted automatically from inventory, which is a strong safety cue. The form was closed without submitting a record. A useful next refinement would be showing the selected house’s current stock impact and the most recent reading inline before saving.

## Prioritized recommendations

| Priority | Recommendation | User impact | Suggested implementation |
|---|---|---|---|
| P0 | Add a top “Today’s exceptions” strip | Makes stock-out, missing weight, and weather deviation actionable at first glance | Show at most three semantic cards: **urgent stock**, **missing weight sample**, and **environmental gap**, each with one direct action. |
| P0 | Make data gaps explicitly actionable | Prevents the missing average weight and FCR from being overlooked | Replace dash-only KPI states with a compact “لم تُسجّل عينة وزن” CTA that opens the weight dialog. |
| P1 | Clarify forecast coverage | Prevents misreading house totals and cage-row totals as equivalent | Label cage-row data as “الصفوف المهيّأة فقط” and display its covered birds versus birds in the whole house. |
| P1 | Add a compact mobile action bar | Reduces scrolling before daily work begins | Keep “تسجيل اليوم”، “إضافة وزن”، and “إدارة المخزون” reachable at the top on small screens. |
| P1 | Add stock effect in the daily-record form | Improves confidence before saving feed consumption | After choosing house and feed quantity, show bags to be issued and stock remaining or shortage warning. |
| P2 | Strengthen visual hierarchy and semantic colors | Makes the dashboard feel more like a farm command center | Use deep green for healthy state, amber for planning, red for urgent risk; give the “today” strip stronger contrast and visually soften reference cards. |
| P2 | Create a weekly management summary | Improves operational handoff and auditability | Add a weekly card comparing feed, mortality, weight, and stock coverage against the preceding week. |

## Overall conclusion

The dashboard is already operationally capable and appropriately Arabic-first. The most valuable improvements are not additional generic widgets; they are **clearer exception-driven decisions**, **stronger treatment of missing data**, and **less mobile scrolling before today’s key actions**. No functional defect was found during this review, and no operational or financial record was changed.
