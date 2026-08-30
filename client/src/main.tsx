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

          // Check if response is not OK (e.g. 404, 500, 502)
          if (!res.ok) {
            const rawText = await res.text();
            let errorMessage = `خطأ في الخادم (${res.status}): يرجى التأكد من ضبط DATABASE_URL في متغيرات البيئة.`;

            try {
              const parsed = JSON.parse(rawText);
              // If it's already a valid tRPC SuperJSON error format, return it
              if (Array.isArray(parsed) && parsed[0]?.error?.json) {
                return new Response(rawText, {
                  status: res.status,
                  headers: { "content-type": "application/json" },
                });
              }
              if (parsed?.error) {
                errorMessage = typeof parsed.error === "string" ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
              } else if (parsed?.message) {
                errorMessage = parsed.message;
              }
            } catch {
              if (rawText && rawText.length > 0 && rawText.length < 200) {
                errorMessage = rawText;
              }
            }

            console.error("[tRPC Intercepted Non-tRPC Error]:", res.status, errorMessage);

            const superjsonPayload = JSON.stringify([
              {
                error: {
                  json: {
                    message: errorMessage,
                    code: -32603,
                    data: {
                      code: "INTERNAL_SERVER_ERROR",
                      httpStatus: res.status,
                    },
                  },
                },
              },
            ]);

            return new Response(superjsonPayload, {
              status: res.status,
              headers: { "content-type": "application/json" },
            });
          }

          return res;
        } catch (err: any) {
          console.error("[Fetch Network Error]:", err);
          const networkErrorPayload = JSON.stringify([
            {
              error: {
                json: {
                  message: "تعذر الاتصال بالخادم السحابي. يرجى التحقق من اتصال الإنترنت أو إعدادات قاعدة البيانات.",
                  code: -32603,
                  data: {
                    code: "INTERNAL_SERVER_ERROR",
                    httpStatus: 0,
                  },
                },
              },
            },
          ]);
          return new Response(networkErrorPayload, {
            status: 503,
            headers: { "content-type": "application/json" },
          });
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
