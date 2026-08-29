export type OfflineMutationType =
  | "addDailyRecord"
  | "addWeightSample"
  | "addHealthEvent"
  | "addSaleWeighBatch"
  | "addFeedInventoryTransaction";

export type OfflineQueueItem<T = Record<string, unknown>> = {
  id: string;
  mutationType: OfflineMutationType;
  payload: T;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "synced" | "failed";
  lastError?: string;
};

export class OfflineSyncQueue {
  private items: OfflineQueueItem[] = [];

  constructor(initialItems: OfflineQueueItem[] = []) {
    this.items = [...initialItems];
  }

  enqueue<T extends Record<string, unknown>>(
    mutationType: OfflineMutationType,
    payload: T
  ): OfflineQueueItem<T> {
    const item: OfflineQueueItem<T> = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      mutationType,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending",
    };
    this.items.push(item as OfflineQueueItem);
    return item;
  }

  getPendingItems(): OfflineQueueItem[] {
    return this.items
      .filter((i) => i.status === "pending" || i.status === "failed")
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  markSyncing(id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = "syncing";
    }
  }

  markSynced(id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = "synced";
    }
  }

  markFailed(id: string, error: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = "failed";
      item.retryCount += 1;
      item.lastError = error;
    }
  }

  clearSynced(): void {
    this.items = this.items.filter((i) => i.status !== "synced");
  }

  size(): number {
    return this.items.length;
  }

  pendingCount(): number {
    return this.getPendingItems().length;
  }

  serialize(): string {
    return JSON.stringify(this.items);
  }

  static deserialize(serialized: string): OfflineSyncQueue {
    try {
      const items = JSON.parse(serialized);
      if (Array.isArray(items)) {
        return new OfflineSyncQueue(items);
      }
    } catch {
      // Return empty queue if parsing fails
    }
    return new OfflineSyncQueue();
  }
}
