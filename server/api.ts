import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

export default async function handler(
  req: IncomingMessage & { query?: Record<string, any> },
  res: ServerResponse
) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/api/health" || req.url === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  // Resolve tRPC procedure path
  let path = "";
  if (req.query?.trpc) {
    path = Array.isArray(req.query.trpc) ? req.query.trpc.join("/") : req.query.trpc;
  } else if (req.query?.path) {
    path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
  } else if (req.url) {
    const cleanUrl = req.url.split("?")[0] || "";
    path = cleanUrl.replace(/^\/api\/trpc\/?/, "").replace(/^\/trpc\/?/, "").replace(/^\/api\/?/, "");
  }

  return nodeHTTPRequestHandler({
    req: req as any,
    res,
    router: appRouter,
    createContext: createContext as any,
    path,
    onError: ({ error, path: errPath }) => {
      console.error(`[tRPC Error on ${errPath}]:`, error);
    },
  });
}
