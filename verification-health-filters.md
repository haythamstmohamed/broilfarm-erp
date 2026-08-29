# Health Record Filters Verification

Verified in the development preview on 2026-08-20.

| Filter | Verified control |
|---|---|
| House | Lists all three assigned houses and an all-houses option. |
| Bird age day | Lists the actual event days from the current cycle: 1, 4, 7, 10, 15, 18, 21, 28, 35, and 42. |
| Event type | Offers all events, vaccination, and medication. |
| Result feedback | Shows the current number of matching events out of the total. |

No health record was created, edited, or deleted during verification.

The type filter reduced the current cycle from 30 events to 18 vaccinations. Combining it with day 7 correctly displayed zero results because the day-7 events are medication records; each house displayed a clear no-match message and the control exposed a reset action.

The house filter reduced the view from 30 records across three houses to the 10 records for «الكبير» alone, hiding the other house panels as intended. The filters were exercised only for viewing; no clinical data was changed.
