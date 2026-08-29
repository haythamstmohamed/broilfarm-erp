import { describe, expect, it } from "vitest";
import { OfflineSyncQueue } from "../shared/offlineQueue";

describe("Offline Field Resilience & Sync Queue", () => {
  it("enqueues and preserves chronological order of operations", () => {
    const queue = new OfflineSyncQueue();
    const item1 = queue.enqueue("addDailyRecord", { cycleId: 1, feedKg: 500 });
    const item2 = queue.enqueue("addWeightSample", { cycleId: 1, avgWeight: 1450 });

    expect(queue.size()).toBe(2);
    expect(queue.pendingCount()).toBe(2);

    const pending = queue.getPendingItems();
    expect(pending[0].id).toBe(item1.id);
    expect(pending[1].id).toBe(item2.id);
  });

  it("handles status transitions, retry counter, and errors", () => {
    const queue = new OfflineSyncQueue();
    const item = queue.enqueue("addSaleWeighBatch", { saleId: 5, grossKg: 125 });

    queue.markSyncing(item.id);
    expect(queue.getPendingItems().length).toBe(0); // In progress

    queue.markFailed(item.id, "Network timeout 504");
    const pendingAfterFail = queue.getPendingItems();
    expect(pendingAfterFail.length).toBe(1);
    expect(pendingAfterFail[0].retryCount).toBe(1);
    expect(pendingAfterFail[0].lastError).toBe("Network timeout 504");

    queue.markSynced(item.id);
    expect(queue.pendingCount()).toBe(0);

    queue.clearSynced();
    expect(queue.size()).toBe(0);
  });

  it("serializes and deserializes cleanly for localStorage persistence", () => {
    const queue = new OfflineSyncQueue();
    queue.enqueue("addDailyRecord", { mortality: 5 });

    const serialized = queue.serialize();
    const restored = OfflineSyncQueue.deserialize(serialized);

    expect(restored.size()).toBe(1);
    expect(restored.getPendingItems()[0].mutationType).toBe("addDailyRecord");
  });
});
