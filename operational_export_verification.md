# Operational export verification

The dashboard displays Arabic RTL controls for **تنزيل CSV** and **تصدير PDF** in the active cycle workspace. The CSV download was confirmed in the browser download history with the generated filename `broiler-weight-environment-2026-08-18.csv`.

The PDF control first opens an in-page RTL preview. Browser verification confirmed it shows the farm and cycle, selected production day, actual and target temperature/humidity values, and the weight-sample empty state. From this preview, the operator selects **فتح نافذة الطباعة** and then **Save as PDF** in the standard print dialog. The report generation is covered by unit tests for the rendered Arabic content and RTL direction.

The standard dashboard button interaction was also verified after closing and reopening the dialog through the normal browser click path; it reopened the report preview with the expected RTL content and print action.
