import { and, desc, eq, gte } from "drizzle-orm";
import { sensorReadings, houses } from "../../drizzle/schema";
import { evaluateSensorReading, SensorType } from "../../shared/iotSensors";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";

export async function ingestSensorReadings(
  userId: number,
  input: {
    farmId: number;
    houseId: number;
    readings: Array<{
      sensorType: SensorType;
      value: number;
      unit: string;
      deviceId?: string;
      readingTime?: Date;
    }>;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
  if (!house || house.farmId !== input.farmId) throw new Error("العنبر لا يتبع المزرعة المحددة");
  await requireFarmCapability(userId, input.farmId, "record_operations", {
    houseId: input.houseId,
    cycleId: null,
  });

  const now = new Date();
  const inserted = await Promise.all(
    input.readings.map((r) =>
      db
        .insert(sensorReadings)
        .values({
          farmId: input.farmId,
          houseId: input.houseId,
          sensorType: r.sensorType,
          value: r.value.toFixed(2),
          unit: r.unit,
          deviceId: r.deviceId || null,
          readingTime: r.readingTime || now,
        })
        .$returningId()
    )
  );

  // Evaluate instant assessments
  const evaluations = input.readings.map((r) => ({
    sensorType: r.sensorType,
    value: r.value,
    assessment: evaluateSensorReading(r.sensorType, r.value),
  }));

  return { insertedCount: inserted.length, evaluations };
}

export async function getLatestHouseReadings(userId: number, farmId: number, houseId: number) {
  const db = await getDb();
  if (!db) return [];

  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, houseId)).limit(1);
  if (!house || house.farmId !== farmId) throw new Error("العنبر لا يتبع المزرعة المحددة");
  await requireFarmCapability(userId, farmId, "view_reports", {
    houseId,
    cycleId: null,
  });

  // Fetch recent readings for this house
  const recent = await db
    .select()
    .from(sensorReadings)
    .where(and(eq(sensorReadings.farmId, farmId), eq(sensorReadings.houseId, houseId)))
    .orderBy(desc(sensorReadings.readingTime))
    .limit(50);

  // Group latest by sensorType
  const latestMap = new Map<string, typeof recent[0]>();
  recent.forEach((item) => {
    if (!latestMap.has(item.sensorType)) {
      latestMap.set(item.sensorType, item);
    }
  });

  return Array.from(latestMap.values()).map((reading) => ({
    ...reading,
    numericValue: Number(reading.value),
    assessment: evaluateSensorReading(reading.sensorType as SensorType, Number(reading.value)),
  }));
}

export async function getHouseTelemetryHistory(
  userId: number,
  input: {
    farmId: number;
    houseId: number;
    sensorType?: SensorType;
    hours?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
  if (!house || house.farmId !== input.farmId) throw new Error("العنبر لا يتبع المزرعة المحددة");
  await requireFarmCapability(userId, input.farmId, "view_reports", {
    houseId: input.houseId,
    cycleId: null,
  });

  const sinceTime = new Date(Date.now() - (input.hours ?? 24) * 60 * 60 * 1000);
  const conditions = [
    eq(sensorReadings.farmId, input.farmId),
    eq(sensorReadings.houseId, input.houseId),
    gte(sensorReadings.readingTime, sinceTime),
  ];

  if (input.sensorType) {
    conditions.push(eq(sensorReadings.sensorType, input.sensorType));
  }

  return db
    .select()
    .from(sensorReadings)
    .where(and(...conditions))
    .orderBy(desc(sensorReadings.readingTime))
    .limit(500);
}
