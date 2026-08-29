export type OperationalExportSnapshot = {
  farmName: string;
  cycleName: string;
  selectedDate: string;
  cycleDay: number;
  actualTemperatureC: number | null;
  actualHumidityPercent: number | null;
  targetTemperatureMinC: number;
  targetTemperatureMaxC: number;
  targetHumidityMinPercent: number;
  targetHumidityMaxPercent: number;
  weights: Array<{ date: string; houseName: string; averageWeightGrams: number }>;
};

const headers = [
  "نوع الصف",
  "المزرعة",
  "الدورة",
  "تاريخ سياق البيئة",
  "عمر القطيع (يوم)",
  "الحرارة الفعلية (°م)",
  "الرطوبة الفعلية (%)",
  "هدف الحرارة (°م)",
  "هدف الرطوبة (%)",
  "تاريخ عينة الوزن",
  "العنبر",
  "متوسط الوزن الفعلي (جم)",
];

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function displayRange(min: number, max: number, suffix: string) {
  return `${min}–${max}${suffix}`;
}

export function buildOperationalCsv(snapshot: OperationalExportSnapshot) {
  const environmentalContext = [
    "سياق بيئي مختار",
    snapshot.farmName,
    snapshot.cycleName,
    snapshot.selectedDate,
    snapshot.cycleDay,
    snapshot.actualTemperatureC,
    snapshot.actualHumidityPercent,
    displayRange(snapshot.targetTemperatureMinC, snapshot.targetTemperatureMaxC, "°م"),
    displayRange(snapshot.targetHumidityMinPercent, snapshot.targetHumidityMaxPercent, "%"),
    "",
    "",
    "",
  ];
  const weightRows = snapshot.weights.map((weight) => [
    "عينة وزن فعلية",
    snapshot.farmName,
    snapshot.cycleName,
    snapshot.selectedDate,
    snapshot.cycleDay,
    snapshot.actualTemperatureC,
    snapshot.actualHumidityPercent,
    displayRange(snapshot.targetTemperatureMinC, snapshot.targetTemperatureMaxC, "°م"),
    displayRange(snapshot.targetHumidityMinPercent, snapshot.targetHumidityMaxPercent, "%"),
    weight.date,
    weight.houseName,
    weight.averageWeightGrams,
  ]);
  return `\uFEFF${[headers, environmentalContext, ...weightRows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

function escapeHtml(value: string | number | null) {
  return String(value ?? "—").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function buildOperationalPdfHtml(snapshot: OperationalExportSnapshot) {
  const actualTemperature = snapshot.actualTemperatureC === null ? "غير متاح" : `${snapshot.actualTemperatureC.toFixed(1)}°م`;
  const actualHumidity = snapshot.actualHumidityPercent === null ? "غير متاح" : `${snapshot.actualHumidityPercent}%`;
  const weightRows = snapshot.weights.length
    ? snapshot.weights.map((weight) => `<tr><td>${escapeHtml(weight.date)}</td><td>${escapeHtml(weight.houseName)}</td><td>${escapeHtml(weight.averageWeightGrams)} جم</td></tr>`).join("")
    : '<tr><td colspan="3" class="empty">لا توجد عينات وزن فعلية مسجلة للدورة.</td></tr>';

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>تقرير الوزن والبيئة</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#183c29;margin:0;line-height:1.6}h1{font-size:24px;margin:0}h2{font-size:16px;margin:0 0 12px}.header{border-bottom:3px solid #285c3b;padding-bottom:14px;margin-bottom:20px}.sub{color:#567060;font-size:13px;margin-top:4px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:14px 0 22px}.card{border:1px solid #dce9cf;border-radius:10px;padding:11px;background:#f8fbf5}.label{font-size:11px;color:#5d7465}.value{font-weight:700;font-size:16px;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #dce9cf;padding:9px;text-align:right;font-size:12px}th{background:#edf6e4;font-weight:700}.empty{text-align:center;color:#627369}.note{font-size:11px;color:#607365;margin-top:18px;border-top:1px solid #dce9cf;padding-top:12px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><header class="header"><h1>تقرير الأوزان والبيئة التشغيلية</h1><p class="sub">${escapeHtml(snapshot.farmName)} · ${escapeHtml(snapshot.cycleName)} · تم التصدير بتاريخ ${escapeHtml(snapshot.selectedDate)}</p></header><section><h2>سياق يوم الدورة المختار</h2><div class="grid"><div class="card"><div class="label">عمر القطيع</div><div class="value">${escapeHtml(snapshot.cycleDay)} يوم</div></div><div class="card"><div class="label">الحرارة الفعلية</div><div class="value">${escapeHtml(actualTemperature)}</div></div><div class="card"><div class="label">الرطوبة الفعلية</div><div class="value">${escapeHtml(actualHumidity)}</div></div><div class="card"><div class="label">الحرارة المستهدفة</div><div class="value">${escapeHtml(displayRange(snapshot.targetTemperatureMinC, snapshot.targetTemperatureMaxC, "°م"))}</div></div><div class="card"><div class="label">الرطوبة المستهدفة</div><div class="value">${escapeHtml(displayRange(snapshot.targetHumidityMinPercent, snapshot.targetHumidityMaxPercent, "%"))}</div></div></div></section><section><h2>عينات الوزن الفعلية</h2><table><thead><tr><th>التاريخ</th><th>العنبر</th><th>متوسط الوزن</th></tr></thead><tbody>${weightRows}</tbody></table></section><p class="note">هذا التقرير يجمع عينات الوزن المسجلة مع سياق الطقس المسترجع واليوم التشغيلي المحدد لحظة التصدير. الأهداف البيئية مرجع تخطيطي وليست بديلاً عن متابعة سلوك القطيع أو توجيه المختص.</p></body></html>`;
}

export function operationalExportFilename(snapshot: OperationalExportSnapshot, extension: "csv" | "pdf") {
  const date = snapshot.selectedDate || "cycle-day";
  return `broiler-weight-environment-${date}.${extension}`;
}
