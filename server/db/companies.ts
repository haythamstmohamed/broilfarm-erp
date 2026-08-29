import { and, count, eq, inArray } from "drizzle-orm";
import { companies, cycles, farmMemberships, farms, houses, users } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function bootstrapCompany(userId: number, input: { name: string; legalName?: string; subscriptionPlan?: "free" | "starter" | "pro" | "business" | "enterprise" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [company] = await db
    .insert(companies)
    .values({
      name: input.name,
      legalName: input.legalName || null,
      subscriptionPlan: input.subscriptionPlan ?? "starter",
      maxFarms: input.subscriptionPlan === "enterprise" ? 50 : input.subscriptionPlan === "pro" ? 10 : 3,
      maxUsersPerFarm: 10,
    })
    .$returningId();

  // Link user to company
  await db.update(users).set({ companyId: company.id, role: "admin" }).where(eq(users.id, userId));

  // Link existing owned farms to company
  await db.update(farms).set({ companyId: company.id }).where(eq(farms.ownerId, userId));

  return { companyId: company.id };
}

export async function getCompany(userId: number, companyId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  let targetId = companyId;
  if (!targetId) {
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
    targetId = user?.companyId ?? undefined;
  }

  if (!targetId) {
    // Return null if user has no company yet
    return null;
  }

  const [company] = await db.select().from(companies).where(eq(companies.id, targetId)).limit(1);
  if (!company) return null;

  // Aggregate stats
  const [farmCountResult] = await db.select({ count: count() }).from(farms).where(eq(farms.companyId, targetId));
  const [userCountResult] = await db.select({ count: count() }).from(users).where(eq(users.companyId, targetId));

  return {
    ...company,
    stats: {
      totalFarms: Number(farmCountResult?.count ?? 0),
      totalUsers: Number(userCountResult?.count ?? 0),
      maxFarms: company.maxFarms,
      maxUsersPerFarm: company.maxUsersPerFarm,
    },
  };
}

export async function updateCompany(
  userId: number,
  input: {
    companyId: number;
    name?: string;
    legalName?: string;
    taxId?: string;
    registrationNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
    governorate?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || (user.companyId !== input.companyId && user.role !== "admin")) {
    throw new Error("ليس لديك صلاحية لتعديل بيانات الشركة");
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.legalName !== undefined) patch.legalName = input.legalName;
  if (input.taxId !== undefined) patch.taxId = input.taxId;
  if (input.registrationNumber !== undefined) patch.registrationNumber = input.registrationNumber;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = input.email;
  if (input.address !== undefined) patch.address = input.address;
  if (input.governorate !== undefined) patch.governorate = input.governorate;

  await db.update(companies).set(patch).where(eq(companies.id, input.companyId));
  return { success: true };
}

export async function listCompanyFarms(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];

  const companyFarms = await db.select().from(farms).where(eq(farms.companyId, companyId));
  if (!companyFarms.length) return [];

  const farmIds = companyFarms.map((f) => f.id);
  const [allHouses, allCycles] = await Promise.all([
    db.select().from(houses).where(inArray(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray(cycles.farmId, farmIds)),
  ]);

  return companyFarms.map((farm) => {
    const farmHouses = allHouses.filter((h) => h.farmId === farm.id);
    const farmCycles = allCycles.filter((c) => c.farmId === farm.id);
    const activeCycle = farmCycles.find((c) => c.status === "active");

    return {
      ...farm,
      housesCount: farmHouses.length,
      totalCapacity: farmHouses.reduce((sum, h) => sum + h.capacity, 0),
      activeCycle: activeCycle
        ? {
            id: activeCycle.id,
            name: activeCycle.name,
            placementDate: activeCycle.placementDate,
            birdsPlaced: activeCycle.birdsPlaced,
          }
        : null,
    };
  });
}

export async function listCompanyUsers(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.companyId, companyId));
}
