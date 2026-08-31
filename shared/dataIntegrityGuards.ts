/**
 * BroilFarm Data Integrity & Impossible Logic Guards
 * حراس اتساق البيانات والمنطق البيولوجي لمزارع التسمين
 */

export interface PopulationCheckInput {
  birdsPlaced: number;
  totalMortality: number;
  totalCulls: number;
  totalSoldBirds: number;
  newMortality?: number;
  newCulls?: number;
  newSoldBirds?: number;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  errorCode?: string;
  errorMessageArabic?: string;
  currentLiveBirds: number;
  maxAllowableAddition?: number;
}

/**
 * Validates population integrity for a cycle before adding mortality, culls, or sales.
 */
export function validatePopulationIntegrity(input: PopulationCheckInput): IntegrityCheckResult {
  const {
    birdsPlaced,
    totalMortality,
    totalCulls,
    totalSoldBirds,
    newMortality = 0,
    newCulls = 0,
    newSoldBirds = 0,
  } = input;

  if (birdsPlaced <= 0) {
    return {
      isValid: false,
      errorCode: "INVALID_PLACEMENT_COUNT",
      errorMessageArabic: "عدد الطيور المسكنة بالدورة يجب أن يكون أكبر من الصفر.",
      currentLiveBirds: 0,
    };
  }

  // Calculate current standing live birds
  const totalDeductedSoFar = totalMortality + totalCulls + totalSoldBirds;
  const currentLiveBirds = Math.max(0, birdsPlaced - totalDeductedSoFar);

  const requestedDeduction = newMortality + newCulls + newSoldBirds;

  if (requestedDeduction < 0) {
    return {
      isValid: false,
      errorCode: "NEGATIVE_COUNT_PROHIBITED",
      errorMessageArabic: "لا يمكن إدخال قيم عددية سالبة للطيور أو المبيعات أو النفوق.",
      currentLiveBirds,
    };
  }

  if (requestedDeduction > currentLiveBirds) {
    return {
      isValid: false,
      errorCode: "EXCEEDS_LIVE_POPULATION",
      errorMessageArabic: `العدد المطلوب (${requestedDeduction} طائر) يتجاوز إجمالي الطيور الحية المتبقية في الدورة (${currentLiveBirds} طائر).`,
      currentLiveBirds,
      maxAllowableAddition: currentLiveBirds,
    };
  }

  return {
    isValid: true,
    currentLiveBirds: currentLiveBirds - requestedDeduction,
    maxAllowableAddition: currentLiveBirds,
  };
}

/**
 * Validates biological plausibility of daily feed and water intake for a broiler flock.
 */
export function validateDailyIntakePlausibility(params: {
  ageDays: number;
  currentLiveBirds: number;
  feedKg: number;
  waterLiters: number;
}): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const { ageDays, currentLiveBirds, feedKg, waterLiters } = params;
  const warnings: string[] = [];
  const errors: string[] = [];

  if (feedKg < 0) {
    errors.push("كمية العلف لا يمكن أن تكون سالبة.");
  }
  if (waterLiters < 0) {
    errors.push("كمية المياه لا يمكن أن تكون سالبة.");
  }

  if (currentLiveBirds > 0 && feedKg > 0) {
    const gramsPerBird = (feedKg * 1000) / currentLiveBirds;
    // Biologically impossible: > 350 grams per bird per day for broilers
    if (gramsPerBird > 350) {
      errors.push(`كمية العلف غير منطقية بيولوجياً (${Math.round(gramsPerBird)} جم/طائر في اليوم، الحد الأقصى الطبيعي 350 جم).`);
    } else if (gramsPerBird > 240 && ageDays < 25) {
      warnings.push(`استهلاك العلف مرتفع جداً بالنسبة لعمر ${ageDays} يوم (${Math.round(gramsPerBird)} جم/طائر).`);
    }
  }

  if (feedKg > 0 && waterLiters > 0) {
    const ratio = waterLiters / feedKg;
    if (ratio < 1.0) {
      warnings.push(`نسبة استهلاك المياه للعلف منخفضة جداً (${ratio.toFixed(2)})، يرجى فحص خطوط المياه والنيبل.`);
    } else if (ratio > 3.2) {
      warnings.push(`نسبة استهلاك المياه للعلف مرتفعة جداً (${ratio.toFixed(2)})، قد تشير لتسريب في النيبل أو إجهاد حراري شديد.`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validates a live bird weighing sale batch.
 */
export function validateSaleWeighBatch(params: {
  grossWeightGrams: number;
  tareWeightGrams: number;
  cageCount: number;
  birdsPerCage?: number;
}): {
  isValid: boolean;
  netWeightGrams: number;
  averageBirdWeightGrams: number;
  errorArabic?: string;
} {
  const { grossWeightGrams, tareWeightGrams, cageCount, birdsPerCage = 0 } = params;

  if (grossWeightGrams <= 0) {
    return {
      isValid: false,
      netWeightGrams: 0,
      averageBirdWeightGrams: 0,
      errorArabic: "الوزن القائم (الإجمالي) يجب أن يكون أكبر من الصفر.",
    };
  }

  if (tareWeightGrams >= grossWeightGrams) {
    return {
      isValid: false,
      netWeightGrams: 0,
      averageBirdWeightGrams: 0,
      errorArabic: "وزن الفارغ (الأقفاص) لا يمكن أن يكون مساوياً أو أكبر من الوزن الإجمالي.",
    };
  }

  if (cageCount <= 0) {
    return {
      isValid: false,
      netWeightGrams: 0,
      averageBirdWeightGrams: 0,
      errorArabic: "عدد الأقفاص يجب أن يكون قفصاً واحداً على الأقل.",
    };
  }

  const netWeightGrams = grossWeightGrams - tareWeightGrams;
  const totalBirds = cageCount * (birdsPerCage > 0 ? birdsPerCage : 1);
  const avgBirdWeight = totalBirds > 0 ? Math.round(netWeightGrams / totalBirds) : 0;

  return {
    isValid: true,
    netWeightGrams,
    averageBirdWeightGrams: avgBirdWeight,
  };
}
