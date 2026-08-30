import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async fetch(input, init) {
        try {
          const res = await globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });

          // If the server returned an HTML/text error (e.g. 500 or Vercel edge crash) instead of JSON:
          const contentType = res.headers.get("content-type") || "";
          if (!res.ok && !contentType.includes("application/json")) {
            const rawText = await res.text();
            console.error("[Server Error Intercepted]:", res.status, rawText);
            const fallbackBody = JSON.stringify([
              {
                error: {
                  message: `خطأ في الخادم (${res.status}): يرجى التأكد من ضبط DATABASE_URL في متغيرات البيئة.`,
                  code: -32603,
                  data: { code: "INTERNAL_SERVER_ERROR", httpStatus: res.status },
                },
              },
            ]);
            return new Response(fallbackBody, {
              status: res.status,
              headers: { "content-type": "application/json" },
            });
          }

          return res;
        } catch (err) {
          console.error("[Fetch Network Error]:", err);
          throw err;
        }
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
