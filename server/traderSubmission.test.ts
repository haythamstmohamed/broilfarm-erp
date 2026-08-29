import { describe, expect, it, vi } from "vitest";
import { persistTraderForm } from "../shared/traderSubmission";

describe("trader account form submission", () => {
  it("resets the captured form only after a successful asynchronous trader save", async () => {
    const order: string[] = [];
    const reset = vi.fn(() => { order.push("reset"); });
    const onSave = vi.fn(async () => { order.push("save"); });
    await persistTraderForm({ form: { reset }, values: { name: "أحمد", phone: "111" }, onSave });
    expect(onSave).toHaveBeenCalledWith({ name: "أحمد", phone: "111" });
    expect(reset).toHaveBeenCalledOnce();
    expect(order).toEqual(["save", "reset"]);
  });
});
