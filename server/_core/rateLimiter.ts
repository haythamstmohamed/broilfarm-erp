import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private hits = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly message: string = "تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد قليل."
  ) {}

  private cleanup(): void {
    const now = Date.now();
    const threshold = now - this.windowMs;
    for (const [key, record] of this.hits.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > threshold);
      if (record.timestamps.length === 0) {
        this.hits.delete(key);
      }
    }
  }

  private getKey(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress || "127.0.0.1";
    return `${ip}:${req.baseUrl || ""}${req.path || ""}`;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const now = Date.now();
      if (now - this.lastCleanup > 5 * 60 * 1000) {
        this.cleanup();
        this.lastCleanup = now;
      }
      const key = this.getKey(req);
      const threshold = now - this.windowMs;

      let record = this.hits.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.hits.set(key, record);
      }

      // Filter timestamps within current sliding window
      record.timestamps = record.timestamps.filter((t) => t > threshold);

      if (record.timestamps.length >= this.maxRequests) {
        const oldest = record.timestamps[0];
        const retryAfterSec = Math.ceil((oldest + this.windowMs - now) / 1000);
        res.setHeader("Retry-After", Math.max(1, retryAfterSec));
        res.setHeader("RateLimit-Limit", this.maxRequests);
        res.setHeader("RateLimit-Remaining", 0);
        res.setHeader("RateLimit-Reset", Math.max(1, retryAfterSec));
        return res.status(429).json({
          error: "TOO_MANY_REQUESTS",
          message: this.message,
          retryAfterSeconds: Math.max(1, retryAfterSec),
        });
      }

      record.timestamps.push(now);
      const remaining = this.maxRequests - record.timestamps.length;
      res.setHeader("RateLimit-Limit", this.maxRequests);
      res.setHeader("RateLimit-Remaining", Math.max(0, remaining));
      next();
    };
  }
}

// 1. Strict rate limiter for authentication routes: max 15 attempts per minute per IP
export const authRateLimiter = new InMemoryRateLimiter(
  60 * 1000,
  15,
  "تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى الانتظار دقيقة قبل المحاولة مجدداً."
).middleware();

// 2. General API rate limiter: max 300 requests per minute per IP
export const generalApiRateLimiter = new InMemoryRateLimiter(
  60 * 1000,
  300,
  "تم تجاوز الحد الأقصى لمعدل الطلبات في الدقيقة."
).middleware();
