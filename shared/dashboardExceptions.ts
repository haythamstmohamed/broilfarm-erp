export type DashboardExceptionKind = "feed" | "weight" | "environment";

export function dashboardExceptionKinds(input: {
  stockStatus: "setup" | "healthy" | "reorder" | "critical";
  hasWeight: boolean;
  temperatureHigh: number | null;
  humidity: number | null;
  targetTemperatureMaxC: number;
  targetHumidityMinPercent: number;
}): DashboardExceptionKind[] {
  const exceptions: DashboardExceptionKind[] = [];
  if (input.stockStatus === "critical" || input.stockStatus === "reorder") exceptions.push("feed");
  if (!input.hasWeight) exceptions.push("weight");
  const heatRisk = input.temperatureHigh !== null && input.temperatureHigh >= input.targetTemperatureMaxC + 8;
  const dryAirRisk = input.humidity !== null && input.humidity <= input.targetHumidityMinPercent - 20;
  if (heatRisk || dryAirRisk) exceptions.push("environment");
  return exceptions;
}
