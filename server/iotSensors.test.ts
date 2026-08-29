import { describe, expect, it } from "vitest";
import { evaluateSensorReading, getTargetTemperatureRange } from "../shared/iotSensors";

describe("IoT Sensor Telemetry & Threshold Assessment Engine", () => {
  it("determines expected temperature comfort zones by age", () => {
    // Day 1: 31-33°C
    const d1 = getTargetTemperatureRange(1);
    expect(d1.target).toBe(32);
    expect(d1.min).toBe(31);
    expect(d1.max).toBe(33);

    // Day 21: 24-26°C
    const d21 = getTargetTemperatureRange(21);
    expect(d21.target).toBe(25);

    // Day 35: 20-22°C
    const d35 = getTargetTemperatureRange(35);
    expect(d35.target).toBe(21);
  });

  it("detects severe heat stress (> max + 4°C)", () => {
    // Day 21 (max is 26°C), reading 31°C -> critical
    const assessment = evaluateSensorReading("temperature", 31.0, 21);
    expect(assessment.status).toBe("critical");
    expect(assessment.message).toContain("إجهاد حراري شديد");
  });

  it("detects critical ammonia (NH3) gas buildup (>= 25 ppm)", () => {
    const assessment = evaluateSensorReading("ammonia_nh3", 28.0);
    expect(assessment.status).toBe("critical");
    expect(assessment.message).toContain("الأمونيا حرج");

    const warnAssessment = evaluateSensorReading("ammonia_nh3", 20.0);
    expect(warnAssessment.status).toBe("warning");

    const optimalAssessment = evaluateSensorReading("ammonia_nh3", 12.0);
    expect(optimalAssessment.status).toBe("optimal");
  });

  it("evaluates carbon dioxide (CO2) concentrations", () => {
    const critical = evaluateSensorReading("co2", 3800);
    expect(critical.status).toBe("critical");

    const warning = evaluateSensorReading("co2", 2800);
    expect(warning.status).toBe("warning");

    const optimal = evaluateSensorReading("co2", 1500);
    expect(optimal.status).toBe("optimal");
  });

  it("evaluates relative humidity levels", () => {
    const low = evaluateSensorReading("humidity", 32);
    expect(low.status).toBe("warning");
    expect(low.message).toContain("منخفضة");

    const high = evaluateSensorReading("humidity", 82);
    expect(high.status).toBe("warning");
    expect(high.message).toContain("مرتفعة");

    const optimal = evaluateSensorReading("humidity", 62);
    expect(optimal.status).toBe("optimal");
  });
});
