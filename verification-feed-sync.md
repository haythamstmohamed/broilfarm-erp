# Feed Operations–Inventory Verification

Verified in the development preview on 2026-08-20 after the historical synchronization.

| Check | Verified result |
|---|---|
| Linked historical issue movements | 126 daily-operation records |
| Historical feed consumption | 81,000 kg = 1,620.0000 bags at 50 kg/bag |
| Remaining farm stock | 0.0000 bags / 0.0000 kg |
| Preview state | Arabic RTL critical-stock alert and a 711-bag seven-day purchase recommendation |
| Movement ledger | Displays auto-issued fractional movements such as -20.52, -10.68, and -7.40 bags with daily-record references |

The daily-operation service now creates one uniquely linked inventory movement per feed-bearing record. Updating the record recalculates that same movement; deleting the record removes the linked movement and restores the quantity to available stock.

The operations preview was also checked without altering any records. Each displayed daily reading now exposes Arabic edit and delete controls. Opening the 20 August record for العنبر الكبير loaded its existing values, including 1,026 kg of feed, and clearly explains that saving a feed change updates inventory automatically.
