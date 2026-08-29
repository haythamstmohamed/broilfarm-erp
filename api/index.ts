import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// Support all URL prefix variants on Vercel (/api/trpc, /trpc, /)
app.use(
  ["/api/trpc", "/trpc", "/"],
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Fallback JSON for any unmatched API route
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Error handling middleware to always return JSON
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Vercel API Error]:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;
