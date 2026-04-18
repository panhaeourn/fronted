import type { ReceptionistDayEntry } from "../../lib/receptionistDailyReceipts";

export type RangeView = "DAY" | "WEEK" | "MONTH" | "YEAR";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatRangeLabel(range: RangeView) {
  switch (range) {
    case "DAY":
      return "Day";
    case "WEEK":
      return "Week";
    case "MONTH":
      return "Month";
    case "YEAR":
      return "Year";
    default:
      return range;
  }
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = value.getDay();
  const offset = day === 0 ? 6 : day - 1;
  value.setDate(value.getDate() - offset);
  return value;
}

function endOfWeek(date: Date) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  return value;
}

export function filterDaysByRange(days: ReceptionistDayEntry[], range: RangeView) {
  const now = new Date();
  const today = startOfToday();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return days.filter((entry) => {
    const entryDate = new Date(`${entry.dayKey}T00:00:00`);
    if (Number.isNaN(entryDate.getTime())) return false;

    if (range === "DAY") return entryDate.getTime() === today.getTime();
    if (range === "WEEK") return entryDate >= weekStart && entryDate <= now;
    if (range === "MONTH") return entryDate >= monthStart && entryDate <= now;
    return entryDate >= yearStart && entryDate <= now;
  });
}

export function buildWeekBuckets(days: ReceptionistDayEntry[]) {
  const map = new Map<string, { key: string; label: string; total: number; count: number }>();

  for (const day of days) {
    const date = new Date(`${day.dayKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) continue;

    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const key = weekStart.toISOString().slice(0, 10);
    const label = `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;

    if (!map.has(key)) {
      map.set(key, { key, label, total: 0, count: 0 });
    }

    const bucket = map.get(key)!;
    bucket.total += day.total;
    bucket.count += day.count;
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function buildMonthBuckets(days: ReceptionistDayEntry[]) {
  const map = new Map<string, { key: string; label: string; total: number; count: number }>();

  for (const day of days) {
    const date = new Date(`${day.dayKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!map.has(key)) {
      map.set(key, { key, label, total: 0, count: 0 });
    }

    const bucket = map.get(key)!;
    bucket.total += day.total;
    bucket.count += day.count;
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function getSummaryBucketLabel(range: RangeView) {
  if (range === "DAY") return "Transactions Today";
  if (range === "WEEK") return "Days This Week";
  if (range === "MONTH") return "Weeks This Month";
  return "Months This Year";
}

export function getSummaryBucketCount(
  range: RangeView,
  days: { count: number }[],
  weeks: unknown[],
  months: unknown[]
) {
  if (range === "DAY") {
    return days.reduce((sum, day) => sum + day.count, 0);
  }
  if (range === "WEEK") return days.length;
  if (range === "MONTH") return weeks.length;
  return months.length;
}

export function getSummaryLatestLabel(range: RangeView) {
  if (range === "DAY") return "Today";
  if (range === "WEEK") return "Latest Day";
  if (range === "MONTH") return "Latest Week";
  return "Latest Month";
}

export function getLatestSummaryValue(
  range: RangeView,
  days: { dayLabel: string }[],
  weeks: { label: string }[],
  months: { label: string }[]
) {
  if (range === "DAY") return days[0] ? "Active" : "-";
  if (range === "WEEK") return days[0]?.dayLabel || "-";
  if (range === "MONTH") return weeks[0]?.label || "-";
  return months[0]?.label || "-";
}
