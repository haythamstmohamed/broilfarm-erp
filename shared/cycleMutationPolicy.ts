export type CycleMutationStatus = "draft" | "upcoming" | "active" | "closed";

export function assertCycleAllowsOperationalMutation(status: CycleMutationStatus) {
  if (status === "closed") throw new Error("لا يمكن تعديل بيانات دورة مغلقة");
}
