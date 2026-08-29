export type DailyWeather = {
  weatherCode: number;
  currentTemperature: number | null;
  temperatureHigh: number;
  temperatureLow: number;
  humidity: number | null;
  windSpeed: number | null;
  apparentTemperature: number | null;
};

export type WeatherPanelData = { state: "ready" } | { state: "location_required" } | undefined;

export function weatherPanelState(weather: WeatherPanelData, loading: boolean) {
  if (loading) return "loading" as const;
  if (weather?.state === "location_required") return "location_required" as const;
  if (weather?.state === "ready") return "ready" as const;
  return "empty" as const;
}

export function cycleDayFromDate(placementDate: Date, weatherDate: string) {
  const start = Date.UTC(placementDate.getUTCFullYear(), placementDate.getUTCMonth(), placementDate.getUTCDate());
  const target = Date.parse(`${weatherDate}T00:00:00Z`);
  return Math.max(0, Math.floor((target - start) / 86_400_000) + 1);
}

export function arabicWeatherLabel(code: number) {
  if (code === 0) return "صحو";
  if ([1, 2].includes(code)) return "غائم جزئياً";
  if (code === 3) return "غائم";
  if ([45, 48].includes(code)) return "ضباب";
  if ([51, 53, 55, 56, 57].includes(code)) return "رذاذ";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "أمطار";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "ثلوج";
  if ([95, 96, 99].includes(code)) return "عواصف رعدية";
  return "حالة جوية متغيرة";
}
