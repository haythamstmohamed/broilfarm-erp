import "dotenv/config";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  const url = new URL(req.url);

  // Health check
  if (url.pathname === "/api/health" || url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization, x-trpc-source",
      },
    });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (opts) => {
      const headerMap: Record<string, string> = {};
      opts.req.headers.forEach((v, k) => {
        headerMap[k] = v;
      });

      return createContext({
        req: {
          headers: headerMap,
          cookies: {},
        } as any,
        res: {
          setHeader: (k: string, v: string) => opts.resHeaders.set(k, v),
          cookie: () => {},
        } as any,
      });
    },
    onError: ({ error, path }) => {
      console.error(`[tRPC Error on ${path}]:`, error);
    },
    responseMeta: () => {
      return {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-credentials": "true",
        },
      };
    },
  });
}
