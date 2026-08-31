/**
 * Production Intelligence & Biological Analytics Engine
 * محرك ذكاء الإنتاج والتحليلات البيولوجية لمزارع التسمين
 */

export type PoultryBreed = "ross_308" | "cobb_500" | "arbor_acres" | "hubbard" | "ir_standard";

export interface BreedDayTarget {
  ageDays: number;
  targetWeightGrams: number;
  dailyGainGrams: number;
  dailyFeedGrams: number;
  cumulativeFeedGrams: number;
  targetFcr: number;
}

// ────────────────────────────────────────────────────────────────
// Breed Performance Standards (Ross 308, Cobb 500, Arbor Acres, Hubbard)
// ────────────────────────────────────────────────────────────────

export const ROSS_308_OBJECTIVES: Record<number, BreedDayTarget> = {
  1: { ageDays: 1, targetWeightGrams: 42, dailyGainGrams: 0, dailyFeedGrams: 13, cumulativeFeedGrams: 13, targetFcr: 0.31 },
  7: { ageDays: 7, targetWeightGrams: 200, dailyGainGrams: 26, dailyFeedGrams: 34, cumulativeFeedGrams: 175, targetFcr: 0.88 },
  14: { ageDays: 14, targetWeightGrams: 510, dailyGainGrams: 52, dailyFeedGrams: 67, cumulativeFeedGrams: 535, targetFcr: 1.05 },
  21: { ageDays: 21, targetWeightGrams: 1010, dailyGainGrams: 78, dailyFeedGrams: 112, cumulativeFeedGrams: 1180, targetFcr: 1.17 },
  28: { ageDays: 28, targetWeightGrams: 1640, dailyGainGrams: 94, dailyFeedGrams: 154, cumulativeFeedGrams: 2140, targetFcr: 1.30 },
  35: { ageDays: 35, targetWeightGrams: 2360, dailyGainGrams: 104, dailyFeedGrams: 188, cumulativeFeedGrams: 3360, targetFcr: 1.42 },
  42: { ageDays: 42, targetWeightGrams: 3120, dailyGainGrams: 108, dailyFeedGrams: 212, cumulativeFeedGrams: 4790, targetFcr: 1.54 },
};

export const COBB_500_OBJECTIVES: Record<number, BreedDayTarget> = {
  1: { ageDays: 1, targetWeightGrams: 42, dailyGainGrams: 0, dailyFeedGrams: 12, cumulativeFeedGrams: 12, targetFcr: 0.29 },
  7: { ageDays: 7, targetWeightGrams: 195, dailyGainGrams: 25, dailyFeedGrams: 33, cumulativeFeedGrams: 170, targetFcr: 0.87 },
  14: { ageDays: 14, targetWeightGrams: 500, dailyGainGrams: 51, dailyFeedGrams: 65, cumulativeFeedGrams: 525, targetFcr: 1.05 },
  21: { ageDays: 21, targetWeightGrams: 990, dailyGainGrams: 77, dailyFeedGrams: 110, cumulativeFeedGrams: 1160, targetFcr: 1.17 },
  28: { ageDays: 28, targetWeightGrams: 1610, dailyGainGrams: 92, dailyFeedGrams: 152, cumulativeFeedGrams: 2100, targetFcr: 1.30 },
  35: { ageDays: 35, targetWeightGrams: 2320, dailyGainGrams: 102, dailyFeedGrams: 185, cumulativeFeedGrams: 3310, targetFcr: 1.43 },
  42: { ageDays: 42, targetWeightGrams: 3080, dailyGainGrams: 106, dailyFeedGrams: 209, cumulativeFeedGrams: 4720, targetFcr: 1.53 },
};

/**
 * Interpolates target weight and metrics for any arbitrary day (1 to 50)
 */
export function getBreedTargetForDay(breed: PoultryBreed, day: number): BreedDayTarget {
  const safeDay = Math.max(1, Math.min(50, Math.round(day)));

  let factor = 1.0;
  if (breed === "cobb_500") factor = 0.985;
  else if (breed === "arbor_acres") factor = 0.990;
  else if (breed === "hubbard") factor = 0.975;

  // Approximate realistic cubic curve for smooth daily targets
  const targetWeight = Math.round(
    factor * (42 + 22 * safeDay + 1.25 * Math.pow(safeDay, 2) + 0.008 * Math.pow(safeDay, 3))
  );
  const targetFcr = Number((0.85 + (safeDay / 42) * 0.70).toFixed(2));
  const cumulativeFeed = Math.round(targetWeight * targetFcr);
  const dailyFeed = Math.round(cumulativeFeed / safeDay);
  const dailyGain = Math.round((targetWeight - 42) / safeDay);

  return {
    ageDays: safeDay,
    targetWeightGrams: targetWeight,
    dailyGainGrams: dailyGain,
    dailyFeedGrams: dailyFeed,
    cumulativeFeedGrams: cumulativeFeed,
    targetFcr: targetFcr,
  };
}

// ────────────────────────────────────────────────────────────────
// Uniformity (CV%) & Flock Weight Homogeneity
// ────────────────────────────────────────────────────────────────

export interface UniformityResult {
  sampleCount: number;
  meanWeightGrams: number;
  standardDeviationGrams: number;
  cvPercentage: number;
  uniformityPercentage: number;
  flockGrade: "world_class" | "excellent" | "good" | "moderate" | "poor";
  flockGradeArabic: string;
  recommendation: string;
}

/**
 * Computes statistical uniformity and Coefficient of Variation (CV%) from a sample of weights
 */
export function calculateWeightUniformity(weightsGrams: number[]): UniformityResult | null {
  if (!weightsGrams || weightsGrams.length < 3) return null;

  const validWeights = weightsGrams.filter((w) => typeof w === "number" && w > 0);
  const n = validWeights.length;
  if (n < 3) return null;

  const sum = validWeights.reduce((acc, w) => acc + w, 0);
  const mean = sum / n;

  // Sample standard deviation (Bessel's correction n - 1)
  const variance = validWeights.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation
  const cvPct = Number(((stdDev / mean) * 100).toFixed(2));

  // Percentage of birds within ±10% of mean weight
  const lowerBound = mean * 0.9;
  const upperBound = mean * 1.1;
  const withinRangeCount = validWeights.filter((w) => w >= lowerBound && w <= upperBound).length;
  const uniformityPct = Number(((withinRangeCount / n) * 100).toFixed(2));

  // Grading
  let flockGrade: UniformityResult["flockGrade"] = "good";
  let flockGradeArabic = "جيد";
  let recommendation = "تجانس طبيعي، استمر على برنامج التغذية والمساحات الحالية.";

  if (cvPct <= 7.5 || uniformityPct >= 88) {
    flockGrade = "world_class";
    flockGradeArabic = "ممتاز عالمي (توزيع فائق التجانس)";
    recommendation = "تجانس مثالي للقطيع. كفاءة عالية في توزيع خطوط العلف ومساحات العنابر.";
  } else if (cvPct <= 9.5 || uniformityPct >= 80) {
    flockGrade = "excellent";
    flockGradeArabic = "ممتاز";
    recommendation = "تجانس عالي جداً. يساعد على استقرار متوسط الوزن عند الذبح.";
  } else if (cvPct <= 12.0 || uniformityPct >= 70) {
    flockGrade = "good";
    flockGradeArabic = "جيد (مقبول)";
    recommendation = "تجانس مقبول. يفضل فحص توزيع أطباق العلف وسرعة التغذية.";
  } else if (cvPct <= 14.5 || uniformityPct >= 60) {
    flockGrade = "moderate";
    flockGradeArabic = "متوسط (تفاوت ملحوظ)";
    recommendation = "تفاوت بين أحجام الطيور. تحقق من ضغط المياه وسعة العلافات والتهوية.";
  } else {
    flockGrade = "poor";
    flockGradeArabic = "ضعيف (تفاوت حاد)";
    recommendation = "تفاوت شديد في الأوزان. يلزم فرز الطيور الصغيرة ومراجعة برنامج التحضين وكثافة الطيور.";
  }

  return {
    sampleCount: n,
    meanWeightGrams: Math.round(mean),
    standardDeviationGrams: Math.round(stdDev),
    cvPercentage: cvPct,
    uniformityPercentage: uniformityPct,
    flockGrade,
    flockGradeArabic,
    recommendation,
  };
}

// ────────────────────────────────────────────────────────────────
// Water:Feed Ratio Diagnostic Engine
// ────────────────────────────────────────────────────────────────

export interface WaterFeedRatioAssessment {
  ratio: number;
  status: "low" | "optimal" | "elevated" | "critical_high";
  statusArabic: string;
  tone: "blue" | "emerald" | "amber" | "rose";
  diagnostic: string;
}

export function evaluateWaterToFeedRatio(
  waterLiters: number,
  feedKg: number,
  ambientTempC: number = 24
): WaterFeedRatioAssessment {
  if (feedKg <= 0 || waterLiters <= 0) {
    return {
      ratio: 0,
      status: "optimal",
      statusArabic: "غير متوفر",
      tone: "blue",
      diagnostic: "بيانات الاستهلاك غير كافية لتقييم النسبة.",
    };
  }

  const ratio = Number((waterLiters / feedKg).toFixed(2));

  // Temperature adjusted baseline (water intake increases ~6.5% per 1°C above 21°C)
  const tempAdjustedMax = ambientTempC > 28 ? 2.4 : ambientTempC > 24 ? 2.1 : 1.95;

  if (ratio < 1.45) {
    return {
      ratio,
      status: "low",
      statusArabic: "استهلاك مياه منخفض",
      tone: "amber",
      diagnostic: "استهلاك المياه أقل من المعدل الطبيعي. افحص ضغط النبل، فلتر المياه، أو انسداد الخطوط.",
    };
  }

  if (ratio <= tempAdjustedMax) {
    return {
      ratio,
      status: "optimal",
      statusArabic: "معدل مثالي",
      tone: "emerald",
      diagnostic: "نسبة استهلاك المياه إلى العلف متوازنة ومثالية للنمو السليم.",
    };
  }

  if (ratio <= tempAdjustedMax + 0.35) {
    return {
      ratio,
      status: "elevated",
      statusArabic: "استهلاك مياه مرتفع",
      tone: "amber",
      diagnostic: "استهلاك مياه أعلى من المعتاد. قد يكون ناتجاً عن ارتفاع حرارة العنبر أو زيادة ملوحة العلف.",
    };
  }

  return {
    ratio,
    status: "critical_high",
    statusArabic: "استهلاك مياه شديد الارتفاع",
    tone: "rose",
    diagnostic: "استهلاك ماء مفرط. احتمال وجود تسريب في خطوط النبل أو إصابة معوية (إسهالات/كوكسيديا).",
  };
}

// ────────────────────────────────────────────────────────────────
// European Production Efficiency Factor (EPEF / EEI) & Performance Index
// ────────────────────────────────────────────────────────────────

export interface EpefAssessment {
  epefScore: number;
  ratingArabic: string;
  grade: "world_class" | "excellent" | "good" | "average" | "poor";
  adjustedFcr2kg: number;
  performanceIndex: number;
  livabilityPercentage: number;
  averageDailyGainGrams: number;
}

/**
 * Calculates EPEF, Performance Index (PI), and standardized Adjusted FCR to 2.0kg body weight
 */
export function calculateAdvancedEpef({
  birdsPlaced,
  totalMortality,
  averageWeightGrams,
  actualFcr,
  ageDays,
}: {
  birdsPlaced: number;
  totalMortality: number;
  averageWeightGrams: number;
  actualFcr: number;
  ageDays: number;
}): EpefAssessment | null {
  if (birdsPlaced <= 0 || ageDays <= 0 || actualFcr <= 0 || averageWeightGrams <= 0) {
    return null;
  }

  const livabilityPct = Number((Math.max(0, ((birdsPlaced - totalMortality) / birdsPlaced) * 100)).toFixed(2));
  const avgWeightKg = averageWeightGrams / 1000;
  const adg = Number((averageWeightGrams / ageDays).toFixed(1));

  // EPEF = (Livability % * Average Weight kg * 100) / (Age days * FCR)
  const epef = Math.round((livabilityPct * avgWeightKg * 100) / (ageDays * actualFcr));

  // Performance Index (PI) = (Livability % * Average Live Weight kg) / FCR
  const performanceIndex = Number(((livabilityPct * avgWeightKg) / actualFcr).toFixed(1));

  // Adjusted FCR to standard 2.0kg: FCR_adj = Actual_FCR - ((Weight_kg - 2.0) * 0.33)
  const adjustedFcr = Number((actualFcr - (avgWeightKg - 2.0) * 0.33).toFixed(2));

  let grade: EpefAssessment["grade"] = "good";
  let ratingArabic = "جيد";

  if (epef >= 400) {
    grade = "world_class";
    ratingArabic = "عالمي ممتاز ⭐⭐⭐";
  } else if (epef >= 350) {
    grade = "excellent";
    ratingArabic = "ممتاز ⭐⭐";
  } else if (epef >= 300) {
    grade = "good";
    ratingArabic = "جيد جداً ⭐";
  } else if (epef >= 250) {
    grade = "average";
    ratingArabic = "متوسط";
  } else {
    grade = "poor";
    ratingArabic = "دون المتوقع";
  }

  return {
    epefScore: epef,
    ratingArabic,
    grade,
    adjustedFcr2kg: Math.max(0.8, adjustedFcr),
    performanceIndex,
    livabilityPercentage: livabilityPct,
    averageDailyGainGrams: adg,
  };
}
