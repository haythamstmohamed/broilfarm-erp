# Trader-led batch weighing verification

The redesigned sales workspace loads with a trader-first layout. Existing trader accounts appear as selectable entries, and each entry presents the intended account-opening affordance for loading sessions, batch weights, cumulative totals, and settlements.

Three existing accounts named **احمد** are visible. They were already persisted by the earlier failed mobile submission attempts, so they were intentionally left unchanged during this feature validation.

Opening an existing trader confirms the dedicated account page with contact details, balance metrics, sales history, and a **بدء تحميل جديد** action. Its loading dialog exposes the planned-cage count (default **200**), batch size (default **5**), tare measurement, tare cage count, price per kilogram, date, and reference. The dialog was closed without creating any sale or batch record.

After the final restart, the trader-first sales page loaded normally with the three existing trader entries and the account-opening actions. Batch records are now loaded only when attached to sales already accessible in the active farm workspace.
