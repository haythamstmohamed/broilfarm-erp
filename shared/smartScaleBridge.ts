export type ScaleReadingResult = {
  isValid: boolean;
  isStable: boolean;
  weightKg: number;
  weightGrams: number;
  unit: "kg" | "g" | "lb";
  raw: string;
  errorMessage?: string;
};

/**
 * Parses raw serial / Bluetooth stream from industrial poultry scale indicators.
 * Supports NCI, Toledo, Avery Weigh-Tronix, Cardinal, and plain ASCII formats.
 */
export function parseRawScaleData(rawStream: string): ScaleReadingResult {
  if (!rawStream || !rawStream.trim()) {
    return {
      isValid: false,
      isStable: false,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "قراءة فارغة من الميزان",
    };
  }

  const clean = rawStream.trim();
  const isStable = !clean.toUpperCase().startsWith("US") && !clean.includes("MOTION");

  // Regex patterns for various industrial scale protocols:
  // 1. NCI: ST,GS,+  124.50kg
  // 2. Toledo: WT: 124.5 kg GR
  // 3. Plain: +00124.50 kg or 124.5
  const match = clean.match(/([+-]?\s*\d+(?:\.\d+)?)\s*(kg|g|lb|كجم)?/i);

  if (!match) {
    return {
      isValid: false,
      isStable,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "تعذر فك تشفير نسق بيانات الميزان",
    };
  }

  const numericPart = match[1].replace(/\s+/g, "");
  const val = parseFloat(numericPart);

  if (isNaN(val) || val < 0) {
    return {
      isValid: false,
      isStable,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "قيمة الوزن غير صالحة",
    };
  }

  const unitStr = (match[2] || "kg").toLowerCase();
  let weightKg = val;
  let unit: "kg" | "g" | "lb" = "kg";

  if (unitStr === "g") {
    weightKg = val / 1000;
    unit = "g";
  } else if (unitStr === "lb") {
    weightKg = val * 0.45359237;
    unit = "lb";
  }

  const weightGrams = Math.round(weightKg * 1000);

  return {
    isValid: true,
    isStable,
    weightKg: Number(weightKg.toFixed(2)),
    weightGrams,
    unit,
    raw: rawStream,
  };
}

/**
 * Calculates net weight and bird average weight from gross and tare readings.
 */
export function calculateBatchNetMetrics(input: {
  grossWeightKg: number;
  tareWeightKg: number;
  cageCount: number;
  birdCount: number;
}) {
  const netKg = Math.max(0, input.grossWeightKg - input.tareWeightKg);
  const netGrams = Math.round(netKg * 1000);
  const avgBirdWeightGrams = input.birdCount > 0 ? Math.round(netGrams / input.birdCount) : 0;
  const avgCageWeightKg = input.cageCount > 0 ? Number((input.tareWeightKg / input.cageCount).toFixed(2)) : 0;

  return {
    netWeightKg: Number(netKg.toFixed(2)),
    netWeightGrams: netGrams,
    avgBirdWeightGrams,
    avgCageWeightKg,
  };
}
