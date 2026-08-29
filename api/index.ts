import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC request normalization middleware for Vercel
app.use((req, res, next) => {
  if (req.url.startsWith("/api/trpc")) {
    req.url = req.url.replace(/^\/api\/trpc/, "");
  } else if (req.url.startsWith("/trpc")) {
    req.url = req.url.replace(/^\/trpc/, "");
  }
  if (!req.url.startsWith("/")) {
    req.url = "/" + req.url;
  }
  return createExpressMiddleware({
    router: appRouter,
    createContext,
  })(req, res, next);
});

// JSON fallback for any unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// JSON error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Vercel Handler Error]:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
