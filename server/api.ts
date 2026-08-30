import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, path }) => {
    console.error(`[tRPC Error on ${path}]:`, error);
  },
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC request normalization middleware for Vercel
app.use((req, res, next) => {
  let url = req.url || "/";

  // Handle URL normalization across Vercel rewrite modes
  const forwardedUri = (req.headers["x-forwarded-uri"] as string) || (req.headers["x-matched-path"] as string) || req.originalUrl;
  if (forwardedUri && forwardedUri.includes("/api/trpc/")) {
    url = forwardedUri.slice(forwardedUri.indexOf("/api/trpc/") + "/api/trpc".length);
  } else if (forwardedUri && forwardedUri.includes("/trpc/")) {
    url = forwardedUri.slice(forwardedUri.indexOf("/trpc/") + "/trpc".length);
  } else if (req.query?.trpc) {
    const trpcParam = Array.isArray(req.query.trpc) ? req.query.trpc.join("/") : req.query.trpc;
    const queryIdx = url.indexOf("?");
    const search = queryIdx >= 0 ? url.slice(queryIdx) : "";
    url = `/${trpcParam}${search}`;
  } else if (req.query?.path) {
    const pathParam = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    const queryIdx = url.indexOf("?");
    const search = queryIdx >= 0 ? url.slice(queryIdx) : "";
    url = `/${pathParam}${search}`;
  } else {
    url = url.replace(/^\/api\/trpc/, "").replace(/^\/trpc/, "").replace(/^\/api/, "");
  }

  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  req.url = url;

  return trpcMiddleware(req, res, next);
});

// SuperJSON-compatible fallback for unhandled routes
app.use((req, res) => {
  res.status(404).json([
    {
      error: {
        json: {
          message: `المسار غير موجود (${req.url})`,
          code: -32004,
          data: { code: "NOT_FOUND", httpStatus: 404 },
        },
      },
    },
  ]);
});

// SuperJSON-compatible error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Vercel Handler Error]:", err);
  res.status(500).json([
    {
      error: {
        json: {
          message: err?.message || "حدث خطأ غير متوقع في الخادم",
          code: -32603,
          data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
        },
      },
    },
  ]);
});

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    app(req, res, () => {
      resolve(undefined);
    });
  });
}
