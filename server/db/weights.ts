import { weightSamples } from "../../drizzle/schema";
import { requireCycleHouseAssignment } from "./auth";
import { getDb } from "./connection";


export async function addWeightSample(ownerId: number, input: { cycleId: number; houseId: number; sampleDate: Date; averageWeightGrams: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "record_weights");
  await db.insert(weightSamples).values(input);
}
