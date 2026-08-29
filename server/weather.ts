import { and, eq } from "drizzle-orm";
import { farmWeatherDays, farms, cycles } from "../drizzle/schema";
import { DailyWeather, cycleDayFromDate } from "../shared/weather";
import { getDb } from "./db";

type OpenMeteoResponse = {
  current?: { temperature_2m?: number; relative_humidity_2m?: number; apparent_temperature?: number; wind_speed_10m?: number; weather_code?: number };
  daily?: { weather_code?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; wind_speed_10m_max?: number[] };
  hourly?: { relative_humidity_2m?: number[] };
};

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchDailyWeather(latitude: number, longitude: number, weatherDate: string): Promise<DailyWeather> {
  const today = new Date().toISOString().slice(0, 10);
  const isPast = weatherDate < today;
  const base = isPast ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude), timezone: "auto", start_date: weatherDate, end_date: weatherDate,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max", hourly: "relative_humidity_2m",
  });
  if (!isPast) params.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code");
  const response = await fetch(`${base}?${params.toString()}`);
  if (!response.ok) throw new Error("Weather provider did not return a usable response");
  const data = await response.json() as OpenMeteoResponse;
  const humidityValues = data.hourly?.relative_humidity_2m?.filter((value): value is number => typeof value === "number") ?? [];
  const averageHumidity = humidityValues.length ? Math.round(humidityValues.reduce((sum, value) => sum + value, 0) / humidityValues.length) : null;
  const current = data.current;
  const high = numberOrNull(data.daily?.temperature_2m_max?.[0]);
  const low = numberOrNull(data.daily?.temperature_2m_min?.[0]);
  const code = numberOrNull(current?.weather_code) ?? numberOrNull(data.daily?.weather_code?.[0]);
  if (high === null || low === null || code === null) throw new Error("Weather provider returned incomplete daily data");
  return {
    weatherCode: code,
    currentTemperature: numberOrNull(current?.temperature_2m),
    temperatureHigh: high,
    temperatureLow: low,
    humidity: numberOrNull(current?.relative_humidity_2m) ?? averageHumidity,
    windSpeed: numberOrNull(current?.wind_speed_10m) ?? numberOrNull(data.daily?.wind_speed_10m_max?.[0]),
    apparentTemperature: numberOrNull(current?.apparent_temperature),
  };
}

export async function getCycleDayWeather(userId: number, input: { cycleId: number; weatherDate: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const weatherDay = new Date(`${input.weatherDate}T00:00:00.000Z`);
  const [cycleFarm] = await db.select({ farmId: cycles.farmId, placementDate: cycles.placementDate, latitude: farms.latitude, longitude: farms.longitude, name: farms.name }).from(cycles).innerJoin(farms, eq(cycles.farmId, farms.id)).where(eq(cycles.id, input.cycleId)).limit(1);
  if (!cycleFarm) throw new Error("Cycle not found");
  const [farm] = await db.select({ ownerId: farms.ownerId }).from(farms).where(eq(farms.id, cycleFarm.farmId)).limit(1);
  if (!farm || farm.ownerId !== userId) {
    // Shared farm membership checks are applied by the workspace route; weather remains read-only.
    const { farmMemberships } = await import("../drizzle/schema");
    const [membership] = await db.select({ id: farmMemberships.id }).from(farmMemberships).where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.farmId, cycleFarm.farmId), eq(farmMemberships.isActive, true))).limit(1);
    if (!membership) throw new Error("You do not have access to this farm weather");
  }
  if (!cycleFarm.latitude || !cycleFarm.longitude) return { state: "location_required" as const, farmName: cycleFarm.name };
  const [cached] = await db.select().from(farmWeatherDays).where(and(eq(farmWeatherDays.farmId, cycleFarm.farmId), eq(farmWeatherDays.weatherDate, weatherDay))).limit(1);
  const today = new Date().toISOString().slice(0, 10);
  const shouldRefresh = input.weatherDate >= today;
  let weather: DailyWeather;
  if (cached && !shouldRefresh) {
    weather = { weatherCode: cached.weatherCode, currentTemperature: cached.currentTemperature === null ? null : Number(cached.currentTemperature), temperatureHigh: Number(cached.temperatureHigh), temperatureLow: Number(cached.temperatureLow), humidity: cached.humidity, windSpeed: cached.windSpeed === null ? null : Number(cached.windSpeed), apparentTemperature: cached.apparentTemperature === null ? null : Number(cached.apparentTemperature) };
  } else {
    weather = await fetchDailyWeather(Number(cycleFarm.latitude), Number(cycleFarm.longitude), input.weatherDate);
    const values = { farmId: cycleFarm.farmId, weatherDate: weatherDay, weatherCode: weather.weatherCode, currentTemperature: weather.currentTemperature?.toFixed(1) ?? null, temperatureHigh: weather.temperatureHigh.toFixed(1), temperatureLow: weather.temperatureLow.toFixed(1), humidity: weather.humidity, windSpeed: weather.windSpeed?.toFixed(1) ?? null, apparentTemperature: weather.apparentTemperature?.toFixed(1) ?? null, source: "open-meteo" };
    if (cached) await db.update(farmWeatherDays).set({ ...values, syncedAt: new Date() }).where(eq(farmWeatherDays.id, cached.id));
    else await db.insert(farmWeatherDays).values(values);
  }
  return { state: "ready" as const, weatherDate: input.weatherDate, cycleDay: cycleDayFromDate(cycleFarm.placementDate, input.weatherDate), farmName: cycleFarm.name, ...weather };
}
