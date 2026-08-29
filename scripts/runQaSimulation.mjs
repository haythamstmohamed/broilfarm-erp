import { and, asc, eq } from "drizzle-orm";
import {
  addDailyRecord,
  addFarmExpense,
  addFeedInventoryTransaction,
  addHealthEvents,
  addSalePayment,
  addSaleTareBatch,
  addWeightSample,
  addWorkerAccountEntry,
  bootstrapFarm,
  calculateSaleTotal,
  completeSale,
  createHouse,
  createCageSection,
  createInvitation,
  createTrader,
  createWorker,
  deleteFarm,
  fillSaleTareBatch,
  finalizeCycleSalesAndClose,
  getDb,
  getUserByOpenId,
  setCycleHouseAssignment,
  startTraderLoading,
  updateFeedInventorySettings,
} from "../server/db.ts";
import { ENV } from "../server/_core/env.ts";
import { cycles, farms, houses, sales, traders, users, weightSamples, workers } from "../drizzle/schema.ts";

const QA_FARM_NAME = "TEST FARM — BroilFarm QA";
const QA_CYCLE_NAME = "TEST-CYCLE-001";
const placementDate = new Date("2026-07-10T09:00:00.000Z");
const endOfDay = (day) => new Date(placementDate.getTime() + (day - 1) * 86_400_000);
const note = "QA reference data only — not a real farm record";
const housesPlan = [
  { name: "House 1", assignedBirds: 4_000, cages: 500 },
  { name: "House 2", assignedBirds: 3_400, cages: 425 },
  { name: "House 3", assignedBirds: 2_600, cages: 325 },
];
const feedPerBirdGrams = [15, 17, 19, 22, 26, 31, 37, 44, 51, 58, 66, 74, 83, 92, 101, 111, 121, 131, 141, 151, 160, 169, 178, 187, 196, 205, 214, 222, 230, 238, 246, 254, 262, 270, 278, 286, 294, 302, 310, 318];
const dailyMortality = [8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const dailyCulls = [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function distribute(total, weights) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const result = weights.map((weight) => Math.floor((total * weight) / totalWeight));
  let remainder = total - result.reduce((sum, value) => sum + value, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % result.length) {
    result[index] += 1;
    remainder -= 1;
  }
  return result;
}

async function getCreatedId(db, table, where) {
  const [row] = await db.select({ id: table.id }).from(table).where(where).limit(1);
  assert(row, "تعذر العثور على السجل الذي أنشأته محاكاة QA");
  return row.id;
}

async function run() {
  const db = await getDb();
  assert(db, "قاعدة البيانات غير متاحة لمحاكاة QA");
  const owner = await getUserByOpenId(ENV.ownerOpenId);
  assert(owner, "لا يوجد مستخدم مالك مهيأ لمحاكاة QA");
  const [existing] = await db.select({ id: farms.id }).from(farms).where(eq(farms.name, QA_FARM_NAME)).limit(1);
  if (existing) {
    const [existingHouses, existingCycles] = await Promise.all([
      db.select({ id: houses.id }).from(houses).where(eq(houses.farmId, existing.id)),
      db.select({ id: cycles.id }).from(cycles).where(eq(cycles.farmId, existing.id)),
    ]);
    if (existingHouses.length === 0 && existingCycles.length === 1) {
      await deleteFarm(owner.id, existing.id);
    } else {
      throw new Error("بيئة QA مكتملة أو تحتوي سجلات فعلية؛ أوقف المشغل لمنع تكرار بيانات الاختبار");
    }
  }

  const totals = {
    feedKg: feedPerBirdGrams.reduce((sum, grams) => sum + Math.round((grams * 10_000) / 1_000), 0),
    mortality: dailyMortality.reduce((sum, value) => sum + value, 0),
    culls: dailyCulls.reduce((sum, value) => sum + value, 0),
  };
  const { farmId, cycleId } = await bootstrapFarm(owner.id, {
    farmName: QA_FARM_NAME,
    cycleName: QA_CYCLE_NAME,
    placementDate,
    birdsPlaced: 10_000,
    governorate: "QA Environment",
    location: "Isolated QA simulation — BroilFarm QA Company",
    latitude: 30.0444,
    longitude: 31.2357,
    locationSource: "manual",
  });

  for (const house of housesPlan) {
    await createHouse(owner.id, { farmId, name: house.name, capacity: house.assignedBirds });
  }
  const qaHouses = await db.select().from(houses).where(eq(houses.farmId, farmId)).orderBy(asc(houses.id));
  assert(qaHouses.length === housesPlan.length, "عدد عنابر QA لا يطابق خطة الاختبار");
  for (let index = 0; index < qaHouses.length; index += 1) {
    const house = qaHouses[index];
    const plan = housesPlan[index];
    await setCycleHouseAssignment(owner.id, { cycleId, houseId: house.id, assignedBirds: plan.assignedBirds });
    await createCageSection(owner.id, { cycleId, houseId: house.id, name: `${plan.name} — QA Row`, rowName: "QA-A", cageCount: plan.cages, capacityPerCage: 8 });
  }

  await updateFeedInventorySettings(owner.id, { farmId, bagWeightKg: 50, reorderPointBags: 160 });
  await addFeedInventoryTransaction(owner.id, { farmId, movementType: "opening", bagDelta: 400, occurredAt: new Date(placementDate.getTime() - 86_400_000), reference: "QA-OPENING-STARTER", notes: `رصيد افتتاحي مرجعي للمحاكاة: Starter. ${note}` });

  const houseBirds = housesPlan.map((house) => house.assignedBirds);
  for (let day = 1; day <= 40; day += 1) {
    if (day === 22) {
      const receiptBags = Math.ceil((totals.feedKg + 5_000 - 20_000) / 50);
      await addFeedInventoryTransaction(owner.id, { farmId, movementType: "receipt", bagDelta: receiptBags, occurredAt: endOfDay(day), reference: "QA-RECEIPT-GROWER-FINISHER", notes: `توريد مرجعي للمحاكاة: Grower / Finisher. ${note}` });
    }
    const totalFeedKg = Math.round((feedPerBirdGrams[day - 1] * 10_000) / 1_000);
    const totalWaterLiters = Math.round(totalFeedKg * (day <= 14 ? 1.85 : day <= 28 ? 1.95 : 2.1));
    const feedByHouse = distribute(totalFeedKg, houseBirds);
    const waterByHouse = distribute(totalWaterLiters, houseBirds);
    const mortalityByHouse = distribute(dailyMortality[day - 1], houseBirds);
    const cullsByHouse = distribute(dailyCulls[day - 1], houseBirds);
    for (let index = 0; index < qaHouses.length; index += 1) {
      await addDailyRecord(owner.id, { cycleId, houseId: qaHouses[index].id, recordDate: endOfDay(day), feedKg: feedByHouse[index], waterLiters: waterByHouse[index], mortality: mortalityByHouse[index], culls: cullsByHouse[index] });
    }
  }

  const weightMilestones = [
    { day: 7, weight: 180 }, { day: 14, weight: 510 }, { day: 21, weight: 1_050 },
    { day: 28, weight: 1_700 }, { day: 35, weight: 2_380 }, { day: 40, weight: 2_820 },
  ];
  const houseWeightOffsets = [10, -15, 5];
  for (const milestone of weightMilestones) {
    for (let index = 0; index < qaHouses.length; index += 1) {
      await addWeightSample(owner.id, { cycleId, houseId: qaHouses[index].id, sampleDate: endOfDay(milestone.day), averageWeightGrams: milestone.weight + houseWeightOffsets[index] });
    }
  }

  const allHouseIds = qaHouses.map((house) => house.id);
  for (const event of [
    { day: 7, eventType: "vaccination", productName: "QA vaccination reference — Day 7", dosage: "QA reference only", administrationRoute: "مياه الشرب" },
    { day: 14, eventType: "vaccination", productName: "QA vaccination reference — Day 14", dosage: "QA reference only", administrationRoute: "مياه الشرب" },
    { day: 21, eventType: "medication", productName: "QA supportive health record — Day 21", dosage: "QA reference only", administrationRoute: "مياه الشرب" },
  ]) {
    await addHealthEvents(owner.id, { cycleId, houseIds: allHouseIds, eventDate: endOfDay(event.day), eventType: event.eventType, productName: event.productName, dosage: event.dosage, administrationRoute: event.administrationRoute, notes: `بيانات اختبار مرجعية فقط؛ ليست توصية علاجية أو بيطرية. ${note}` });
  }

  const feedExpense = Math.round(totals.feedKg * 18.5);
  for (const expense of [
    ["chicks", 145_000, "QA Hatchery", "QA-CHICKS"], ["feed", feedExpense, "QA Feed Supplier", "QA-FEED"],
    ["health", 70_000, "QA Veterinary Supplier", "QA-HEALTH"], ["labor", 100_000, "QA Labor", "QA-LABOR"],
    ["utilities", 75_000, "QA Utilities", "QA-UTILITIES"], ["transport", 45_000, "QA Transport", "QA-TRANSPORT"],
    ["maintenance", 25_000, "QA Maintenance", "QA-MAINTENANCE"], ["equipment", 20_000, "QA Setup", "QA-EQUIPMENT"],
  ]) {
    const [category, amountEgp, supplier, reference] = expense;
    await addFarmExpense(owner.id, { farmId, cycleId, category, amountEgp, expenseDate: endOfDay(1), supplier, reference, notes: note });
  }

  for (const workerData of [{ name: "QA Worker A", jobTitle: "مشرف عنبر" }, { name: "QA Worker B", jobTitle: "عامل تشغيل" }]) {
    await createWorker(owner.id, { farmId, ...workerData, notes: note });
  }
  const qaWorkers = await db.select().from(workers).where(eq(workers.farmId, farmId));
  for (const worker of qaWorkers) {
    await addWorkerAccountEntry(owner.id, { workerId: worker.id, entryType: "salary_credit", amountEgp: 12_000, occurredAt: endOfDay(30), reference: "QA-SALARY", notes: note });
    await addWorkerAccountEntry(owner.id, { workerId: worker.id, entryType: "advance", amountEgp: 2_000, occurredAt: endOfDay(15), reference: "QA-ADVANCE", notes: note });
  }

  for (const role of ["farm_manager", "veterinarian", "engineer", "worker"]) {
    await createInvitation(owner.id, { farmId, cycleId, role, maxUses: 1, expiresAt: new Date("2026-12-31T12:00:00.000Z"), notes: `QA invitation for ${role}` });
  }

  const salePlans = [
    { trader: "QA Trader 1", cages: 500, averageKg: 2.55, price: 74.5, day: 37 },
    { trader: "QA Trader 2", cages: 600, averageKg: 2.68, price: 75.0, day: 38 },
    { trader: "QA Trader 3", cages: 400, averageKg: 2.78, price: 76.0, day: 39 },
    { trader: "QA Trader 4", cages: 420, averageKg: 2.86, price: 77.0, day: 40 },
  ];
  for (const plan of salePlans) {
    await createTrader(owner.id, { farmId, name: plan.trader, companyName: "BroilFarm QA Trading", notes: note });
    const traderId = await getCreatedId(db, traders, and(eq(traders.farmId, farmId), eq(traders.name, plan.trader)));
    const sale = await startTraderLoading(owner.id, { farmId, cycleId, traderId, saleDate: endOfDay(plan.day), plannedCageCount: plan.cages, batchCageCount: 100, weighingMode: "fixed", birdsPerCage: 5, tareWeightKg: 0, tareCageCount: 0, pricePerKgEgp: plan.price, reference: `QA-SALE-D${plan.day}`, notes: note });
    for (let cagesLeft = plan.cages; cagesLeft > 0; cagesLeft -= 100) {
      const cageCount = Math.min(100, cagesLeft);
      const tareWeightKg = cageCount * 2;
      const tare = await addSaleTareBatch(owner.id, { saleId: sale.id, cageCount, tareWeightKg, weighedAt: endOfDay(plan.day), notes: note });
      const netWeightKg = cageCount * 5 * plan.averageKg;
      await fillSaleTareBatch(owner.id, { batchId: tare.id, grossWeightKg: netWeightKg + tareWeightKg, weighedAt: endOfDay(plan.day), notes: note });
    }
    await calculateSaleTotal(owner.id, sale.id);
    const [storedSale] = await db.select().from(sales).where(eq(sales.id, sale.id)).limit(1);
    assert(storedSale && storedSale.totalPiasters > 0, "لم تُحسب قيمة بيع QA");
    const dueEgp = (storedSale.totalPiasters - storedSale.discountPiasters) / 100;
    await addSalePayment(owner.id, { saleId: sale.id, amountEgp: Math.round(dueEgp * 0.6 * 100) / 100, paidAt: endOfDay(plan.day), paymentMethod: "transfer", reference: `QA-PAY-1-D${plan.day}`, notes: note });
    await addSalePayment(owner.id, { saleId: sale.id, amountEgp: Math.round((dueEgp - Math.round(dueEgp * 0.6 * 100) / 100) * 100) / 100, paidAt: endOfDay(plan.day), paymentMethod: "cash", reference: `QA-PAY-2-D${plan.day}`, notes: note });
    await completeSale(owner.id, sale.id);
  }

  await finalizeCycleSalesAndClose(owner.id, cycleId);
  const [closedCycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  const qaSales = await db.select().from(sales).where(eq(sales.cycleId, cycleId));
  const qaWeights = await db.select().from(weightSamples).where(eq(weightSamples.cycleId, cycleId));
  assert(closedCycle?.status === "closed", "لم تُغلق دورة QA");
  assert(qaSales.length === 4 && qaSales.every((sale) => sale.status === "closed"), "لم تُغلق مبيعات QA الأربع");
  assert(qaWeights.length === 18, "عدد عينات وزن QA غير متوقع");

  console.log(JSON.stringify({ farmId, cycleId, totalFeedKg: totals.feedKg, totalMortality: totals.mortality, totalCulls: totals.culls, expectedClosingBirds: 10_000 - totals.mortality - totals.culls, saleCount: qaSales.length, cycleStatus: closedCycle.status }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
