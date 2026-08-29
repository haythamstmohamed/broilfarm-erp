# QA Cycle Data Plan

| Element | QA specification |
|---|---|
| Farm and cycle | `TEST FARM — BroilFarm QA` and `TEST-CYCLE-001`, isolated from production-like records. |
| Cycle model | Ross 308 reference scenario, 10,000 placed birds, 40 chronological operating days, three houses with 4,000 / 3,400 / 2,600 birds. |
| Daily operations | Age-varying feed and water; 40 days × 3 houses; 300 mortality and 100 culls distributed proportionately. |
| Feed inventory | 50-kg bags, 400-bag opening stock, dated replenishment at day 22, and a 160-bag reorder point. |
| Growth | Samples at days 7, 14, 21, 28, 35, and 40 for every house. |
| Health | Three reference-only batch health events for all houses; no clinical instruction or medical advice is represented. |
| Expenses and workers | Cycle-linked costs and independent worker account movements, both explicitly marked QA. |
| Sales | Four traders and 1,920 cages representing 9,600 birds after the simulated 400-bird loss; each sale has independent tare and filled batches and full settlement. |

The source used for breed context is Aviagen’s Ross 308 brand material; the values in this scenario are a **QA test dataset**, not a veterinary or commercial operating recommendation.[1]

## Source note

At retrieval on 2026-08-20, Aviagen describes Ross 308 as a balanced broiler product supporting varied market requirements and broiler performance. The official product page did not provide a machine-readable day-by-day broiler table in the extracted text. Consequently, the day-by-day test entries are documented as an internally consistent QA scenario, not as Aviagen performance targets.[1]

## Reference

[1]: https://aviagen.com/eu/brands/ross/products/ross-308 "Aviagen — Ross 308"
