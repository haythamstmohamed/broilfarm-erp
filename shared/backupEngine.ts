export type EnterpriseBackupPayload = {
  version: "1.0";
  exportedAt: string;
  checksum: string;
  metadata: {
    companyName?: string;
    totalFarms: number;
    totalCycles: number;
    totalDailyRecords: number;
    totalSales: number;
    totalExpenses: number;
  };
  data: {
    farms: any[];
    houses: any[];
    cycles: any[];
    dailyRecords: any[];
    weightSamples: any[];
    healthEvents: any[];
    expenses: any[];
    sales: any[];
    saleWeighBatches: any[];
    feedTransactions: any[];
  };
};

/**
 * Computes deterministic checksum string for backup payload verification.
 */
export function computeBackupChecksum(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `BF_${Math.abs(hash).toString(16).toUpperCase()}_${str.length}`;
}

/**
 * Creates structured enterprise backup payload with integrity checksum.
 */
export function createBackupPayload(input: {
  companyName?: string;
  farms: any[];
  houses: any[];
  cycles: any[];
  dailyRecords: any[];
  weightSamples: any[];
  healthEvents: any[];
  expenses: any[];
  sales: any[];
  saleWeighBatches: any[];
  feedTransactions: any[];
}): EnterpriseBackupPayload {
  const data = {
    farms: input.farms,
    houses: input.houses,
    cycles: input.cycles,
    dailyRecords: input.dailyRecords,
    weightSamples: input.weightSamples,
    healthEvents: input.healthEvents,
    expenses: input.expenses,
    sales: input.sales,
    saleWeighBatches: input.saleWeighBatches,
    feedTransactions: input.feedTransactions,
  };

  const checksum = computeBackupChecksum(data);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    checksum,
    metadata: {
      companyName: input.companyName || "مؤسسة دواجن تسمين",
      totalFarms: input.farms.length,
      totalCycles: input.cycles.length,
      totalDailyRecords: input.dailyRecords.length,
      totalSales: input.sales.length,
      totalExpenses: input.expenses.length,
    },
    data,
  };
}

/**
 * Validates integrity checksum of an imported backup file.
 */
export function verifyBackupIntegrity(backup: EnterpriseBackupPayload): {
  isValid: boolean;
  message: string;
} {
  if (!backup || backup.version !== "1.0" || !backup.data) {
    return { isValid: false, message: "صيغة ملف النسخ الاحتياطي غير معتمدة أو تالفة" };
  }

  const calculated = computeBackupChecksum(backup.data);
  if (calculated !== backup.checksum) {
    return { isValid: false, message: "فشل التحقق من البصمة الرقمية للنسخة الاحتياطية (الملف معدل أو تالف)" };
  }

  return { isValid: true, message: "تم التحقق من سلامة النسخة الاحتياطية بنجاح" };
}
