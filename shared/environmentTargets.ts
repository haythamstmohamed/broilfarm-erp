export type BroilerEnvironmentTarget = {
  cycleDay: number;
  temperatureMinC: number;
  temperatureMaxC: number;
  humidityMinPercent: number;
  humidityMaxPercent: number;
};

function roundedRange(high: number) {
  const temperatureMaxC = Math.round(high * 10) / 10;
  return { temperatureMaxC, temperatureMinC: Math.round((temperatureMaxC - 2) * 10) / 10 };
}

// Operational bird-level reference targets. See broiler_environment_reference.md.
export function broilerEnvironmentTargetForCycleDay(cycleDay: number): BroilerEnvironmentTarget {
  const safeDay = Number.isFinite(cycleDay) && cycleDay > 0 ? Math.floor(cycleDay) : 0;
  if (safeDay === 0) return { cycleDay: 0, temperatureMinC: 0, temperatureMaxC: 0, humidityMinPercent: 0, humidityMaxPercent: 0 };

  if (safeDay <= 7) {
    const temperatures = roundedRange(34 - ((safeDay - 1) * 4) / 6);
    return { cycleDay: safeDay, ...temperatures, humidityMinPercent: 50, humidityMaxPercent: 60 };
  }

  if (safeDay <= 14) {
    const temperatures = roundedRange(30 - ((safeDay - 7) * 4) / 7);
    return { cycleDay: safeDay, ...temperatures, humidityMinPercent: 45, humidityMaxPercent: 60 };
  }

  if (safeDay <= 21) {
    const temperatures = roundedRange(26 - ((safeDay - 14) * 4) / 7);
    return { cycleDay: safeDay, ...temperatures, humidityMinPercent: 45, humidityMaxPercent: 60 };
  }

  return { cycleDay: safeDay, temperatureMinC: 20, temperatureMaxC: 22, humidityMinPercent: 50, humidityMaxPercent: 60 };
}
