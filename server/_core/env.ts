export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

/**
 * التحقق من المتغيرات الحرجة عند بدء التشغيل.
 * يُستدعى من startServer() قبل أي عملية تسجيل دخول.
 */
export function validateCriticalEnv(): void {
  const errors: string[] = [];

  if (!ENV.cookieSecret || ENV.cookieSecret.length < 16) {
    errors.push(
      "JWT_SECRET غير موجود أو أقصر من 16 حرف. " +
      "يجب تعيين JWT_SECRET بقيمة عشوائية آمنة لتوقيع جلسات المستخدمين."
    );
  }

  if (!ENV.databaseUrl) {
    errors.push(
      "DATABASE_URL غير موجود. يجب تعيين عنوان اتصال قاعدة البيانات."
    );
  }

  if (errors.length > 0) {
    console.error("\n╔══════════════════════════════════════════════╗");
    console.error("║  ⚠️  خطأ حرج في إعدادات البيئة (ENV)          ║");
    console.error("╚══════════════════════════════════════════════╝");
    for (const error of errors) {
      console.error(`  ❌ ${error}`);
    }
    console.error("");
    process.exit(1);
  }
}
