import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

const createDatabase = (pool: mysql.Pool) => drizzle(pool);
let _db: ReturnType<typeof createDatabase> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = process.env.DATABASE_URL;
      const isCloudDb =
        url.includes("ssl") ||
        url.includes("aiven") ||
        url.includes("planetscale") ||
        url.includes("tidb") ||
        url.includes("railway") ||
        url.includes("render");

      _pool = mysql.createPool({
        uri: url,
        ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        enableKeepAlive: true,
      });

      _db = createDatabase(_pool);
    } catch (error) {
      console.error("[Database] Connection pool initialization failed:", error);
      _db = null;
    }
  }
  return _db;
}
