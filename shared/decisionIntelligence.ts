/**
 * Actionable AI & Decision Intelligence Engine
 * محرك ذكاء القرار والتحليلات التنبؤية وكشف الأنماط الشاذة لمزارع الدواجن
 */

import { getBreedTargetForDay, PoultryBreed, evaluateWaterToFeedRatio } from "./productionIntelligence";

export interface FlockAnomalyReport {
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  overallRiskArabic: string;
  detectedAnomalies: {
    type: "mortality_spike" | "growth_stunting" | "fcr_drift" | "water_imbalance" | "heat_stress" | "data_gap";
    severity: "warning" | "critical";
    titleArabic: string;
    descriptionArabic: string;
    recommendationArabic: string;
    investigationQuestions: string[];
  }[];
}

export interface HarvestWindowAdvice {
  currentAgeDays: number;
  currentWeightGrams: number;
  targetWeightGrams: number;
  estimatedOptimalHarvestDay: number;
  projectedProfitPerBirdEgp: number;
  dailyMarginalGainEgp: number;
  dailyFeedCostEgp: number;
  recommendationArabic: string;
  status: "growing" | "approaching_harvest" | "optimal_window" | "past_optimal";
}

/**
 * Scans recent cycle data to identify multi-factor biological and environmental anomalies.
 */
export function analyzeFlockAnomalies(params: {
  breed: PoultryBreed;
  ageDays: number;
  currentLiveBirds: number;
  todayMortality: number;
  past3DaysAvgMortality: number;
  latestAvgWeightGrams?: number;
  todayFeedKg: number;
  todayWaterLiters: number;
  ambientTempC?: number;
}): FlockAnomalyReport {
  const {
    breed,
    ageDays,
    currentLiveBirds,
    todayMortality,
    past3DaysAvgMortality,
    latestAvgWeightGrams,
    todayFeedKg,
    todayWaterLiters,
    ambientTempC = 24,
  } = params;

  const anomalies: FlockAnomalyReport["detectedAnomalies"] = [];
  const target = getBreedTargetForDay(breed, ageDays);

  // 1. Mortality Anomaly Scan
  if (currentLiveBirds > 0) {
    const dailyMortalityRate = (todayMortality / currentLiveBirds) * 100;
    const isSpike = past3DaysAvgMortality > 0 && todayMortality >= past3DaysAvgMortality * 2.2 && todayMortality >= 10;

    if (dailyMortalityRate >= 0.3 || (isSpike && dailyMortalityRate >= 0.2)) {
      anomalies.push({
        type: "mortality_spike",
        severity: "critical",
        titleArabic: "ارتفاع حاد وغير مسبوق في نسبة النفوق اليومي",
        descriptionArabic: `تم تسجيل ${todayMortality} نافق اليوم (${dailyMortalityRate.toFixed(2)}%) وهو أعلى من المعدل الطبيعي بأكثر من الضعف.`,
        recommendationArabic: "تشريح عينات طازجة فوراً بواسطة الطبيب البيطري، فحص سلامة التهوية، والتأكد من عدم وجود سموم فطرية بالعلف.",
        investigationQuestions: [
          "هل توجد أعراض تنفسية (صوت خخشخة/إفرازات) أو إسهالات ملونة في الفرشة؟",
          "هل حدث انقطاع مفاجئ في التيار الكهربائي أو توقف شفاطات التهوية ليلاً؟",
          "هل تم فتح شكائر علف من تشغيلة أو مورد جديد خلال الـ 48 ساعة الماضية؟",
        ],
      });
    } else if (dailyMortalityRate >= 0.15 && ageDays > 10) {
      anomalies.push({
        type: "mortality_spike",
        severity: "warning",
        titleArabic: "تزايد ملحوظ في معدل النفوق",
        descriptionArabic: `نسبة النفوق اليومي بلغت ${dailyMortalityRate.toFixed(2)}%، يفضل المتابعة الدقيقة.`,
        recommendationArabic: "فحص حرارة العنبر وتجانس توزيع الطيور بين الأدوار ومراجعة برنامج التحصين.",
        investigationQuestions: ["هل ترتفع نسبة النفوق في الدور العلوي أو الأرضي تحديداً؟"],
      });
    }
  }

  // 2. Growth & Weight Stunting Scan
  if (latestAvgWeightGrams && latestAvgWeightGrams > 0) {
    const weightRatio = latestAvgWeightGrams / target.targetWeightGrams;
    if (weightRatio < 0.88) {
      anomalies.push({
        type: "growth_stunting",
        severity: "critical",
        titleArabic: "تأخر حاد في متوسط وزن القطيع مقارنة بالسلالة",
        descriptionArabic: `الوزن الحالي (${latestAvgWeightGrams} جم) يقل بنسبة ${(100 - weightRatio * 100).toFixed(1)}% عن الوزن المستهدف لسلالة ${breed} (${target.targetWeightGrams} جم).`,
        recommendationArabic: "مراجعة كفاءة هضم العلف، زيادة عدد وجبات التغذية، والتأكد من عدم وجود تزاحم في العلافات.",
        investigationQuestions: [
          "هل تكفي أطوال خطوط العلافات لجميع الطيور في نفس الوقت؟",
          "هل تم قياس طاقة وبروتين العلف في المعمل للتأكد من مطابقة المواصفات؟",
        ],
      });
    } else if (weightRatio < 0.94) {
      anomalies.push({
        type: "growth_stunting",
        severity: "warning",
        titleArabic: "تأخر طفيف في معدل التحويل الوزني",
        descriptionArabic: `الوزن أقل بنسبة ${(100 - weightRatio * 100).toFixed(1)}% عن المعيار القياسي.`,
        recommendationArabic: "إضافة منشطات نمو وأحماض عضوية في مياه الشرب وفحص سرعة سحب العلف.",
        investigationQuestions: ["هل جودة ونقاء مياه الشرب مطابقة للمواصفات القياسية؟"],
      });
    }
  }

  // 3. Water Intake Anomaly Scan
  if (todayFeedKg > 0 && todayWaterLiters > 0) {
    const waterAssessment = evaluateWaterToFeedRatio(todayWaterLiters, todayFeedKg, ambientTempC);
    if (waterAssessment.status === "critical_high" || waterAssessment.status === "low") {
      anomalies.push({
        type: "water_imbalance",
        severity: waterAssessment.status === "critical_high" ? "critical" : "warning",
        titleArabic: `شذوذ في استهلاك المياه (${waterAssessment.statusArabic})`,
        descriptionArabic: waterAssessment.diagnostic,
        recommendationArabic: "فحص ضغط خطوط النيبل، صيانة الفلاتر، والتأكد من خلو المياه من الملوحة المفرطة.",
        investigationQuestions: [
          "هل يوجد بلل ملحوظ تحت خطوط النيبل يشير لتسريب؟",
          "هل تم تنظيف وتطهير خطوط المياه بمادة معقمة مؤخراً؟",
        ],
      });
    }
  }

  // 4. Heat Stress Risk
  if (ambientTempC >= 33 && ageDays > 20) {
    anomalies.push({
      type: "heat_stress",
      severity: "critical",
      titleArabic: "خطر إجهاد حراري حاد على القطيع",
      descriptionArabic: `درجة الحرارة المسجلة (${ambientTempC}°C) تفوق قدرة الطيور الكبيرة على التبريد الذاتي.`,
      recommendationArabic: "تشغيل خلايا التبريد وأقصى طاقة للشفاطات، إضافة فيتامين C والكترولايت في الماء، ورفع العلف في ساعات الذروة.",
      investigationQuestions: [
        "هل تعمل لوحات التبريد بكامل تدفق المياه وبدون انسدادات؟",
        "هل تم تفعيل خطة الطوارئ للمولد الكهربائي الاحتياطي؟",
      ],
    });
  }

  const hasCritical = anomalies.some((a) => a.severity === "critical");
  const overallRiskLevel: FlockAnomalyReport["overallRiskLevel"] = hasCritical
    ? "critical"
    : anomalies.length > 0
      ? "medium"
      : "low";

  const overallRiskArabic =
    overallRiskLevel === "critical"
      ? "مرتفع جداً (يتطلب تدخلاً فورياً 🔴)"
      : overallRiskLevel === "medium"
        ? "متوسط (يحتاج متابعة وإجراءات وقائية 🟡)"
        : "منخفض ومستقر (حالة القطيع ممتازة 🟢)";

  return {
    overallRiskLevel,
    overallRiskArabic,
    detectedAnomalies: anomalies,
  };
}

/**
 * Evaluates the harvest window and calculates the optimal marketing day based on live economics.
 */
export function calculateOptimalHarvestWindow(params: {
  breed: PoultryBreed;
  ageDays: number;
  currentAvgWeightGrams: number;
  feedPricePerKgEgp: number;
  liveChickenPricePerKgEgp: number;
  targetMarketWeightGrams?: number;
}): HarvestWindowAdvice {
  const {
    breed,
    ageDays,
    currentAvgWeightGrams,
    feedPricePerKgEgp,
    liveChickenPricePerKgEgp,
    targetMarketWeightGrams = 2200,
  } = params;

  const currentTarget = getBreedTargetForDay(breed, ageDays);
  const dailyGainKg = (currentTarget.dailyGainGrams || 85) / 1000;
  const dailyFeedKg = (currentTarget.dailyFeedGrams || 170) / 1000;

  const dailyMarginalGainEgp = Number((dailyGainKg * liveChickenPricePerKgEgp).toFixed(2));
  const dailyFeedCostEgp = Number((dailyFeedKg * feedPricePerKgEgp).toFixed(2));

  // Projected optimal harvest age (usually 33 to 38 days in Egyptian broiler market)
  const estimatedDaysToTarget = Math.max(
    0,
    Math.ceil((targetMarketWeightGrams - currentAvgWeightGrams) / (dailyGainKg * 1000))
  );
  const estimatedOptimalHarvestDay = ageDays + estimatedDaysToTarget;

  const birdValueEgp = (currentAvgWeightGrams / 1000) * liveChickenPricePerKgEgp;
  const projectedProfitPerBirdEgp = Number((birdValueEgp * 0.18).toFixed(2)); // estimated net margin ratio

  let status: HarvestWindowAdvice["status"] = "growing";
  let recommendationArabic = `القطيع في مرحلة النمو السريع. الوقت المتوقع للوصول للوزن التسويقي (${targetMarketWeightGrams} جم) هو عمر ${estimatedOptimalHarvestDay} يوم.`;

  if (currentAvgWeightGrams >= targetMarketWeightGrams && dailyMarginalGainEgp <= dailyFeedCostEgp) {
    status = "past_optimal";
    recommendationArabic =
      "تجاوز القطيع نقطة التحويل الاقتصادي الأمثل (تكلفة العلف اليومي تفوق قيمة الزيادة الوزنية). يوصى ببدء البيع فوراً.";
  } else if (currentAvgWeightGrams >= targetMarketWeightGrams * 0.95) {
    status = "optimal_window";
    recommendationArabic =
      "القطيع الآن في نافذة البيع والتسويق المثالية. متوسط الأوزان ممتاز ومطابق للمواصفات التجارية الأعلى سعراً.";
  } else if (currentAvgWeightGrams >= targetMarketWeightGrams * 0.85) {
    status = "approaching_harvest";
    recommendationArabic = "القطيع يقترب من الوزن التسويقي. ابدأ بالتنسيق المسبق مع التجار ومسؤولي المجازر.";
  }

  return {
    currentAgeDays: ageDays,
    currentWeightGrams: currentAvgWeightGrams,
    targetWeightGrams: targetMarketWeightGrams,
    estimatedOptimalHarvestDay,
    projectedProfitPerBirdEgp,
    dailyMarginalGainEgp,
    dailyFeedCostEgp,
    recommendationArabic,
    status,
  };
}
