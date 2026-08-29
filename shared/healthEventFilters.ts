export type HealthEventFilterType = "all" | "medication" | "vaccination";

export type FilterableHealthEvent = {
  houseId?: number;
  date: string;
  eventType: "medication" | "vaccination";
};

export function healthEventAgeDay(eventDate: string, placementDate?: Date | string) {
  if (!placementDate) return undefined;
  const start = new Date(placementDate);
  start.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((event.getTime() - start.getTime()) / 86_400_000) + 1);
}

export function filterHealthEvents<T extends FilterableHealthEvent>(records: T[], filters: { houseId?: number; ageDay?: number; eventType: HealthEventFilterType }, placementDate?: Date | string) {
  return records.filter((record) => {
    if (filters.houseId && record.houseId !== filters.houseId) return false;
    if (filters.eventType !== "all" && record.eventType !== filters.eventType) return false;
    if (filters.ageDay && healthEventAgeDay(record.date, placementDate) !== filters.ageDay) return false;
    return true;
  });
}
