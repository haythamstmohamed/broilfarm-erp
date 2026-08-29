import { describe, expect, it } from "vitest";
import { dashboardExceptionKinds } from "../shared/dashboardExceptions";

describe("dashboardExceptionKinds", () => {
  it("elevates urgent stock, missing weight, and heat risk as today exceptions", () => {
    expect(dashboardExceptionKinds({ stockStatus: "critical", hasWeight: false, temperatureHigh: 36, humidity: 15, targetTemperatureMaxC: 22, targetHumidityMinPercent: 50 })).toEqual(["feed", "weight", "environment"]);
  });

  it("does not raise avoidable exceptions for a healthy, measured, in-range day", () => {
    expect(dashboardExceptionKinds({ stockStatus: "healthy", hasWeight: true, temperatureHigh: 28, humidity: 55, targetTemperatureMaxC: 22, targetHumidityMinPercent: 50 })).toEqual([]);
  });
});
