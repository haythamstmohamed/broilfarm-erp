import "dotenv/config";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

export default async function handler(req: any, res: any) {
  try {
    // 1. CORS Headers
    if (res.setHeader) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    // 2. Safe URL Parsing with fallback base to prevent 'TypeError: Invalid URL'
    const rawUrl = req.url || "/";
    const parsedUrl = new URL(rawUrl, "http://localhost");

    // 3. Health check endpoint
    if (parsedUrl.pathname === "/api/health" || parsedUrl.pathname === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
      return;
    }

    // 4. Extract tRPC procedure path
    let path = "";
    if (req.query?.trpc) {
      path = Array.isArray(req.query.trpc) ? req.query.trpc.join("/") : req.query.trpc;
    } else if (req.query?.path) {
      path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    } else {
      path = parsedUrl.pathname
        .replace(/^\/api\/trpc\/?/, "")
        .replace(/^\/trpc\/?/, "")
        .replace(/^\/api\/?/, "");
    }

    // 5. Delegate to official tRPC nodeHTTPRequestHandler
    return await nodeHTTPRequestHandler({
      req,
      res,
      router: appRouter,
      createContext: createContext as any,
      path,
      onError: ({ error, path: errPath }) => {
        console.error(`[tRPC Error on ${errPath}]:`, error);
      },
    });
  } catch (fatalError: any) {
    console.error("[Fatal Serverless Function Error Caught]:", fatalError);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify([
          {
            error: {
              json: {
                message: fatalError?.message || "حدث خطأ غير متوقع في الخادم السحابي",
                code: -32603,
                data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
              },
            },
          },
        ])
      );
    }
  }
}
