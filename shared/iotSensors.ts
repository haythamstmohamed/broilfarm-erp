export type SensorType =
  | "temperature"
  | "humidity"
  | "ammonia_nh3"
  | "co2"
  | "static_pressure"
  | "water_flow"
  | "light_lux";

export type EnvironmentalThresholdAssessment = {
  status: "optimal" | "warning" | "critical";
  message: string;
  expectedMin?: number;
  expectedMax?: number;
};

/**
 * Returns expected broiler target temperature range (°C) by bird age in days.
 */
export function getTargetTemperatureRange(ageDays: number): { min: number; max: number; target: number } {
  if (ageDays <= 3) return { min: 31.0, max: 33.0, target: 32.0 };
  if (ageDays <= 7) return { min: 29.0, max: 31.0, target: 30.0 };
  if (ageDays <= 14) return { min: 26.5, max: 28.5, target: 27.5 };
  if (ageDays <= 21) return { min: 24.0, max: 26.0, target: 25.0 };
  if (ageDays <= 28) return { min: 22.0, max: 24.0, target: 23.0 };
  if (ageDays <= 35) return { min: 20.0, max: 22.0, target: 21.0 };
  return { min: 19.0, max: 21.0, target: 20.0 };
}

/**
 * Evaluates environmental sensor reading against poultry welfare thresholds.
 */
export function evaluateSensorReading(
  sensorType: SensorType,
  value: number,
  ageDays = 21
): EnvironmentalThresholdAssessment {
  switch (sensorType) {
    case "temperature": {
      const range = getTargetTemperatureRange(ageDays);
      if (value > range.max + 4) {
        return {
          status: "critical",
          message: `إجهاد حراري شديد: درجة الحرارة ${value}°C تتجاوز الحد الأقصى للعمر (${range.max}°C)`,
          expectedMin: range.min,
          expectedMax: range.max,
        };
      }
      if (value < range.min - 3) {
        return {
          status: "critical",
          message: `برودة شديدة: درجة الحرارة ${value}°C أقل من الحد الأدنى للعمر (${range.min}°C)`,
          expectedMin: range.min,
          expectedMax: range.max,
        };
      }
      if (value > range.max + 1.5 || value < range.min - 1.5) {
        return {
          status: "warning",
          message: `درجة الحرارة (${value}°C) خارج النطاق المثالي (${range.min}-${range.max}°C)`,
          expectedMin: range.min,
          expectedMax: range.max,
        };
      }
      return { status: "optimal", message: `درجة الحرارة في النطاق المثالي (${value}°C)`, expectedMin: range.min, expectedMax: range.max };
    }

    case "humidity": {
      if (value < 40) {
        return { status: "warning", message: `رطوبة منخفضة (${value}%) قد تسبب جفاف الغشاء المخاطي وغبار بالعنبر`, expectedMin: 50, expectedMax: 70 };
      }
      if (value > 75) {
        return { status: "warning", message: `رطوبة مرتفعة (${value}%) تزيد من رطوبة الفرشة وتكاثر الكوكسيديا والغازات`, expectedMin: 50, expectedMax: 70 };
      }
      return { status: "optimal", message: `الرطوبة النسبية مثالية (${value}%)`, expectedMin: 50, expectedMax: 70 };
    }

    case "ammonia_nh3": {
      if (value >= 25) {
        return {
          status: "critical",
          message: `غاز الأمونيا حرج (${value} ppm) يسبب تلف أهداب الجهاز التنفسي والعمى للقطيع! يجب تشغيل التهوية فوراً`,
          expectedMin: 0,
          expectedMax: 20,
        };
      }
      if (value >= 18) {
        return {
          status: "warning",
          message: `غاز الأمونيا مرتفع (${value} ppm)، يُرجى زيادة معدل التهوية الدنيا ومراجعة رطوبة الفرشة`,
          expectedMin: 0,
          expectedMax: 20,
        };
      }
      return { status: "optimal", message: `مستوى الأمونيا آمن (${value} ppm)`, expectedMin: 0, expectedMax: 20 };
    }

    case "co2": {
      if (value >= 3500) {
        return {
          status: "critical",
          message: `تركيز ثاني أكسيد الكربون حرج (${value} ppm) قد يسبب الاستسقاء (Ascites) والاختناق!`,
          expectedMin: 400,
          expectedMax: 2500,
        };
      }
      if (value >= 2500) {
        return {
          status: "warning",
          message: `تركيز ثاني أكسيد الكربون مرتفع (${value} ppm)، يتطلب زيادة سرعة الشفاطات`,
          expectedMin: 400,
          expectedMax: 2500,
        };
      }
      return { status: "optimal", message: `مستوى ثاني أكسيد الكربون مثالي (${value} ppm)`, expectedMin: 400, expectedMax: 2500 };
    }

    case "static_pressure": {
      // Ideal tunnel/transitional ventilation static pressure: 15-35 Pa depending on width
      if (value > 45 || value < 10) {
        return { status: "warning", message: `الضغط الاستاتيكي (${value} Pa) خارج النطاق المطلوب للتهوية السليمة`, expectedMin: 15, expectedMax: 35 };
      }
      return { status: "optimal", message: `الضغط الاستاتيكي سليم (${value} Pa)`, expectedMin: 15, expectedMax: 35 };
    }

    default:
      return { status: "optimal", message: `القراءة مستقرة (${value})` };
  }
}
