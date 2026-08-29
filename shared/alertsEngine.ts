/**
 * Smart Poultry Alerts & Anomaly Detection Engine
 * BroilFarm Enterprise ERP
 */

export type AlertType =
  | "high_mortality"
  | "low_weight"
  | "abnormal_fcr"
  | "low_feed_stock"
  | "vaccine_due"
  | "water_consumption_anomaly"
  | "missing_daily_record"
  | "system_notification";

export type AlertSeverity = "info" | "warning" | "critical";

export type EvaluatedAlert = {
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Standard Ross 308 expected weight curve by age in days (as-hatched standard in grams)
 */
export const ROSS_308_TARGET_WEIGHTS_GRAMS: Record<number, number> = {
  1: 42,
  7: 190,
  14: 470,
  21: 950,
  28: 1560,
  35: 2280,
  42: 3020,
};

export function getExpectedWeightGrams(ageDays: number): number {
  if (ageDays <= 1) return 42;
  if (ageDays <= 7) return 42 + (190 - 42) * ((ageDays - 1) / 6);
  if (ageDays <= 14) return 190 + (470 - 190) * ((ageDays - 7) / 7);
  if (ageDays <= 21) return 470 + (950 - 470) * ((ageDays - 14) / 7);
  if (ageDays <= 28) return 950 + (1560 - 950) * ((ageDays - 21) / 7);
  if (ageDays <= 35) return 1560 + (2280 - 1560) * ((ageDays - 28) / 7);
  if (ageDays <= 42) return 2280 + (3020 - 2280) * ((ageDays - 35) / 7);
  return 3020 + (ageDays - 42) * 85;
}

/**
 * Evaluates daily mortality for critical spikes or rising trends
 */
export function evaluateMortalityAnomaly(input: {
  dailyRecords: Array<{ recordDate: Date | string; mortality: number; culls: number }>;
  birdsPlaced: number;
}): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  if (!input.dailyRecords.length || input.birdsPlaced <= 0) return alerts;

  // Sort by date ascending
  const sorted = [...input.dailyRecords].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
  const latestRecord = sorted[sorted.length - 1];
  const dailyLoss = latestRecord.mortality + latestRecord.culls;
  const dailyLossPercent = (dailyLoss / input.birdsPlaced) * 100;

  if (dailyLossPercent >= 1.0) {
    alerts.push({
      alertType: "high_mortality",
      severity: "critical",
      title: "ارتفاع حرج في نسبة النفوق اليومي",
      message: `سجل العنبر نفوقاً يومياً بنسبة ${dailyLossPercent.toFixed(2)}% (${dailyLoss} طائر)، وهو ما يتجاوز الحد الحرج (1.0%). يجب الفحص البيطري الفوري.`,
      metadata: { dailyLoss, dailyLossPercent, recordDate: latestRecord.recordDate },
    });
  } else if (dailyLossPercent >= 0.5) {
    alerts.push({
      alertType: "high_mortality",
      severity: "warning",
      title: "تنبيه: ارتفاع في نسبة النفوق اليومي",
      message: `بلغت نسبة النفوق اليومي ${dailyLossPercent.toFixed(2)}% (${dailyLoss} طائر)، يرجى مراجعة التهوية وحرارة العنبر.`,
      metadata: { dailyLoss, dailyLossPercent, recordDate: latestRecord.recordDate },
    });
  }

  // Check 3-day consecutive rise in mortality
  if (sorted.length >= 3) {
    const last3 = sorted.slice(-3);
    const m0 = last3[0].mortality + last3[0].culls;
    const m1 = last3[1].mortality + last3[1].culls;
    const m2 = last3[2].mortality + last3[2].culls;

    if (m2 > m1 && m1 > m0 && m2 >= 15) {
      alerts.push({
        alertType: "high_mortality",
        severity: "warning",
        title: "تصاعد مستمر في النفوق لـ 3 أيام متتالية",
        message: `تم رصد ارتفاع متتالي في أعداد النفوق على مدار آخر 3 أيام (${m0} → ${m1} → ${m2} طائر). يوصى بإجراء تشريح وفحص بيطري استباقي.`,
        metadata: { trend: [m0, m1, m2] },
      });
    }
  }

  return alerts;
}

/**
 * Evaluates live weight vs breed target curve
 */
export function evaluateGrowthAnomaly(input: {
  averageWeightGrams: number;
  cycleAgeDays: number;
}): EvaluatedAlert | null {
  if (input.cycleAgeDays < 7 || input.averageWeightGrams <= 0) return null;

  const expectedWeight = getExpectedWeightGrams(input.cycleAgeDays);
  const deviationRatio = (input.averageWeightGrams - expectedWeight) / expectedWeight;

  if (deviationRatio <= -0.18) {
    return {
      alertType: "low_weight",
      severity: "critical",
      title: "تأخر حرج في معدل نمو القطيع",
      message: `متوسط وزن الطائر (${Math.round(input.averageWeightGrams)} جم في عمر ${input.cycleAgeDays} يوم) أقل بنسبة ${(Math.abs(deviationRatio) * 100).toFixed(1)}% عن الوزن القياسي المستهدف (${Math.round(expectedWeight)} جم).`,
      metadata: { actualWeight: input.averageWeightGrams, expectedWeight, deviationRatio },
    };
  }

  if (deviationRatio <= -0.10) {
    return {
      alertType: "low_weight",
      severity: "warning",
      title: "تراجع في متوسط وزن القطيع",
      message: `متوسط الوزن الحالي (${Math.round(input.averageWeightGrams)} جم) يقل بنسبة ${(Math.abs(deviationRatio) * 100).toFixed(1)}% عن المنحنى القياسي للسلالة (${Math.round(expectedWeight)} جم).`,
      metadata: { actualWeight: input.averageWeightGrams, expectedWeight, deviationRatio },
    };
  }

  return null;
}

/**
 * Evaluates FCR (Feed Conversion Ratio)
 */
export function evaluateFcrAnomaly(input: {
  fcr: number;
  cycleAgeDays: number;
}): EvaluatedAlert | null {
  if (input.cycleAgeDays < 21 || input.fcr <= 0) return null;

  if (input.fcr >= 1.75) {
    return {
      alertType: "abnormal_fcr",
      severity: "critical",
      title: "ارتفاع حرج في معامل التحويل الغذائي (FCR)",
      message: `بلغ معامل التحويل الغذائي ${input.fcr.toFixed(2)} في عمر ${input.cycleAgeDays} يوم. هناك هدر علف محتمل أو مشاكل في الامتصاص المعوي.`,
      metadata: { fcr: input.fcr, ageDays: input.cycleAgeDays },
    };
  }

  if (input.fcr >= 1.60) {
    return {
      alertType: "abnormal_fcr",
      severity: "warning",
      title: "ارتفاع نسبي في معامل التحويل (FCR)",
      message: `معامل التحويل الحالي ${input.fcr.toFixed(2)} أعلى من المستهدف الاقتصادي للدورة.`,
      metadata: { fcr: input.fcr, ageDays: input.cycleAgeDays },
    };
  }

  return null;
}

/**
 * Evaluates feed inventory status
 */
export function evaluateFeedStockAnomaly(input: {
  currentBalanceBags: number;
  reorderPointBags: number;
  dailyConsumptionBags: number;
}): EvaluatedAlert | null {
  if (input.currentBalanceBags <= 0) {
    return {
      alertType: "low_feed_stock",
      severity: "critical",
      title: "نفاد رصيد العلف بالكامل بالمخزن",
      message: `الرصيد الفعلي للعلف في المخزن حالياً هو 0 شكارة! يجب توريد دفعة علف فوراً لتجنب تجويع القطيع.`,
      metadata: { currentBalanceBags: input.currentBalanceBags },
    };
  }

  const daysRemaining = input.dailyConsumptionBags > 0 ? input.currentBalanceBags / input.dailyConsumptionBags : 999;

  if (daysRemaining <= 2 || input.currentBalanceBags <= input.reorderPointBags * 0.5) {
    return {
      alertType: "low_feed_stock",
      severity: "critical",
      title: "مخزون العلف يكفي أقل من يومين",
      message: `الرصيد الحالي بالمخزن (${Math.round(input.currentBalanceBags)} شكارة) يكفي لنحو ${daysRemaining.toFixed(1)} يوم فقط.`,
      metadata: { currentBalanceBags: input.currentBalanceBags, daysRemaining },
    };
  }

  if (input.currentBalanceBags <= input.reorderPointBags || daysRemaining <= 4) {
    return {
      alertType: "low_feed_stock",
      severity: "warning",
      title: "تنبيه: اقتراب نقطة إعادة طلب العلف",
      message: `المخزن قارب على نقطة إعادة الطلب (${Math.round(input.currentBalanceBags)} شكارة متبقية). يكفي لنحو ${daysRemaining.toFixed(1)} يوم.`,
      metadata: { currentBalanceBags: input.currentBalanceBags, daysRemaining, reorderPointBags: input.reorderPointBags },
    };
  }

  return null;
}

/**
 * Standard Vaccination Schedule Reference for Egypt Market (Indicative Days)
 */
export const STANDARD_EGYPT_VACCINATION_WINDOWS = [
  { day: 7, name: "تحصين نيوكاسل + التهاب شعب (ND + IB)", route: "تقطير بالعين أو رش" },
  { day: 12, name: "تحصين الجمبورو (Gumboro / IBD)", route: "مياه الشرب" },
  { day: 18, name: "جرعة منشطة نيوكاسل (ND Clone / LaSota)", route: "مياه الشرب أو رش" },
  { day: 22, name: "جرعة منشطة جمبورو (حسب الوضع الوبائي)", route: "مياه الشرب" },
];

/**
 * Evaluates upcoming vaccination reminders (due in window)
 */
export function evaluateUpcomingVaccines(input: {
  cycleAgeDays: number;
  executedHealthEvents: Array<{ productName: string; eventType: string; eventDate: Date | string }>;
}): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  if (input.cycleAgeDays <= 0) return alerts;

  for (const vaccine of STANDARD_EGYPT_VACCINATION_WINDOWS) {
    const isDueSoon = input.cycleAgeDays >= vaccine.day - 1 && input.cycleAgeDays <= vaccine.day + 1;
    if (!isDueSoon) continue;

    // Check if any health event matches
    const alreadyAdministered = input.executedHealthEvents.some((event) => {
      const pName = (event.productName || "").toLowerCase();
      const vName = vaccine.name.toLowerCase();
      return event.eventType === "vaccination" && (pName.includes("nd") || pName.includes("جمبورو") || pName.includes("نيوكاسل") || vName.includes(pName));
    });

    if (!alreadyAdministered) {
      alerts.push({
        alertType: "vaccine_due",
        severity: input.cycleAgeDays > vaccine.day ? "warning" : "info",
        title: `تذكير تحصين مستحق: ${vaccine.name}`,
        message: `حسب برنامج التسمين الاسترشادي، يستحق موعد ${vaccine.name} عند عمر ${vaccine.day} يوم (${vaccine.route}). يرجى مراجعة الطبيب البيطري.`,
        metadata: { targetAgeDay: vaccine.day, vaccineName: vaccine.name },
      });
    }
  }

  return alerts;
}

/**
 * Master scan function combining all operational checks
 */
export function scanCycleAnomalies(input: {
  birdsPlaced: number;
  cycleAgeDays: number;
  dailyRecords: Array<{ recordDate: Date | string; mortality: number; culls: number; feedKg: number; waterLiters: number }>;
  latestWeightGrams?: number;
  fcr?: number;
  currentFeedBalanceBags?: number;
  feedReorderPointBags?: number;
  dailyConsumptionBags?: number;
  healthEvents?: Array<{ productName: string; eventType: string; eventDate: Date | string }>;
}): EvaluatedAlert[] {
  const allAlerts: EvaluatedAlert[] = [];

  // 1. Mortality scan
  allAlerts.push(...evaluateMortalityAnomaly({ dailyRecords: input.dailyRecords, birdsPlaced: input.birdsPlaced }));

  // 2. Growth scan
  if (input.latestWeightGrams && input.latestWeightGrams > 0) {
    const growthAlert = evaluateGrowthAnomaly({ averageWeightGrams: input.latestWeightGrams, cycleAgeDays: input.cycleAgeDays });
    if (growthAlert) allAlerts.push(growthAlert);
  }

  // 3. FCR scan
  if (input.fcr && input.fcr > 0) {
    const fcrAlert = evaluateFcrAnomaly({ fcr: input.fcr, cycleAgeDays: input.cycleAgeDays });
    if (fcrAlert) allAlerts.push(fcrAlert);
  }

  // 4. Feed Stock scan
  if (input.currentFeedBalanceBags !== undefined && input.feedReorderPointBags !== undefined) {
    const stockAlert = evaluateFeedStockAnomaly({
      currentBalanceBags: input.currentFeedBalanceBags,
      reorderPointBags: input.feedReorderPointBags,
      dailyConsumptionBags: input.dailyConsumptionBags ?? 0,
    });
    if (stockAlert) allAlerts.push(stockAlert);
  }

  // 5. Vaccine reminders
  if (input.healthEvents) {
    allAlerts.push(...evaluateUpcomingVaccines({ cycleAgeDays: input.cycleAgeDays, executedHealthEvents: input.healthEvents }));
  }

  return allAlerts;
}
