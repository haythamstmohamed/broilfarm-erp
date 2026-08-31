import { describe, it, expect, vi } from "vitest";
import { ensureDatabaseSchema } from "./db/autoMigrate";

describe("Database Auto-Migration Engine", () => {
  it("executes table creations and column alterations using query protocol", async () => {
    const executedQueries: string[] = [];
    const mockPool = {
      query: vi.fn(async (sql: string) => {
        executedQueries.push(sql);
        return [];
      }),
    } as any;

    await ensureDatabaseSchema(mockPool);
    expect(mockPool.query).toHaveBeenCalled();
    expect(executedQueries.length).toBeGreaterThan(20);
    expect(executedQueries.some((q) => q.includes("CREATE TABLE IF NOT EXISTS `companies`"))).toBe(true);
    expect(executedQueries.some((q) => q.includes("CREATE TABLE IF NOT EXISTS `users`"))).toBe(true);
  });

  it("safely handles existing tables and duplicate columns without throwing", async () => {
    const mockPoolWithErrors = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("CREATE TABLE")) {
          const err: any = new Error("Table already exists");
          err.errno = 1050;
          err.code = "ER_TABLE_EXISTS_ERROR";
          throw err;
        }
        if (sql.includes("ALTER TABLE")) {
          const err: any = new Error("Duplicate column name");
          err.errno = 1060;
          err.code = "ER_DUP_FIELDNAME";
          throw err;
        }
        return [];
      }),
    } as any;

    // Reset module-level flag by creating new instance test
    await expect(ensureDatabaseSchema(mockPoolWithErrors)).resolves.not.toThrow();
  });
});
