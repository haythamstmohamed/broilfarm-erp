import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { companies, users } from "../../drizzle/schema";
import { hashPassword, verifyPassword } from "../_core/password";
import { sdk } from "../_core/sdk";
import { getDb, getPool } from "./connection";
import { ensureDatabaseSchema } from "./autoMigrate";

async function getUserByEmailWithFallback(cleanEmail: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  try {
    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    return user;
  } catch (err: any) {
    console.warn("[localAuth] Direct select failed, attempting schema bootstrap:", err.message);
    const pool = getPool();
    if (pool) {
      await ensureDatabaseSchema(pool);
      const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      return user;
    }
    throw err;
  }
}

export async function registerLocalUser(input: {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();

  // Check if email already exists
  const existingUser = await getUserByEmailWithFallback(cleanEmail);
  if (existingUser) {
    throw new Error("البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول");
  }

  // Create Company if requested
  let companyId: number | null = null;
  if (input.companyName && input.companyName.trim()) {
    const [createdCompany] = await db
      .insert(companies)
      .values({
        name: input.companyName.trim(),
        subscriptionPlan: "starter",
      })
      .$returningId();
    companyId = createdCompany.id;
  }

  const passwordHash = hashPassword(input.password);
  const openId = `local_${randomBytes(12).toString("hex")}`;
  const now = new Date();

  const [createdUser] = await db
    .insert(users)
    .values({
      openId,
      name: cleanName,
      email: cleanEmail,
      phone: input.phone?.trim() || null,
      passwordHash,
      companyId,
      loginMethod: "email",
      role: "user",
      isEmailVerified: true,
      lastSignedIn: now,
    })
    .$returningId();

  const [userRecord] = await db.select().from(users).where(eq(users.id, createdUser.id)).limit(1);
  const sessionToken = await sdk.createSessionToken(openId, {
    name: cleanName,
  });

  return { user: userRecord, sessionToken };
}

export async function loginLocalUser(input: { email: string; password: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const cleanEmail = input.email.trim().toLowerCase();
  const user = await getUserByEmailWithFallback(cleanEmail);

  if (!user || !user.passwordHash) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  const isMatch = verifyPassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  const now = new Date();
  await db.update(users).set({ lastSignedIn: now }).where(eq(users.id, user.id));

  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || "User",
  });

  return { user: { ...user, lastSignedIn: now }, sessionToken };
}

export async function changeLocalUserPassword(
  userId: number,
  input: { oldPassword: string; newPassword: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.passwordHash) {
    throw new Error("المستخدم غير موجود أو لا يملك كلمة مرور مسجلة");
  }

  const isMatch = verifyPassword(input.oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("كلمة المرور الحالية غير صحيحة");
  }

  const newHash = hashPassword(input.newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

  return { success: true };
}
