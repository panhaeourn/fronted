export type ReceiptHistoryRow = {
  id: number;
  studentName: string;
  courseName?: string;
  totalPrice?: number;
  amount?: number;
  createdAt?: string;
  createdByReceptionist?: string;
  checkedBy?: string;
  studentId?: string;
  studentCode?: string;
  paymentStatus?: string;
  status?: string;
};

export type ReceptionistDayEntry = {
  dayKey: string;
  dayLabel: string;
  total: number;
  count: number;
  items: Array<{
    id: number;
    studentName: string;
    studentId: string;
    studentCode?: string;
    courseName: string;
    amount: number;
    timeLabel: string;
  }>;
};

/** Group paid income rows by receptionist email (lowercase) then by calendar day. */
export function groupReceiptsByReceptionistDay(
  receipts: ReceiptHistoryRow[]
): Map<string, ReceptionistDayEntry[]> {
  const grouped = new Map<string, ReceptionistDayEntry[]>();

  for (const receipt of receipts) {
    const status = (receipt.paymentStatus || receipt.status || "").trim().toLowerCase();
    if (status !== "paid") continue;

    const receptionistKey = (receipt.checkedBy || receipt.createdByReceptionist || "").trim().toLowerCase();
    if (!receptionistKey) continue;

    const createdAt = receipt.createdAt ? new Date(receipt.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) continue;

    const dayKey = createdAt.toISOString().slice(0, 10);
    const dayLabel = createdAt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeLabel = createdAt.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const amount = Number(receipt.totalPrice ?? receipt.amount ?? 0);
    const sid = (receipt.studentId || "").trim() || "-";

    if (!grouped.has(receptionistKey)) {
      grouped.set(receptionistKey, []);
    }

    const dailyList = grouped.get(receptionistKey)!;
    let dayEntry = dailyList.find((entry) => entry.dayKey === dayKey);

    if (!dayEntry) {
      dayEntry = {
        dayKey,
        dayLabel,
        total: 0,
        count: 0,
        items: [],
      };
      dailyList.push(dayEntry);
    }

    dayEntry.total += amount;
    dayEntry.count += 1;
    dayEntry.items.push({
      id: receipt.id,
      studentName: receipt.studentName || "Unknown student",
      studentId: sid,
      studentCode: receipt.studentCode?.trim() || undefined,
      courseName: receipt.courseName || "-",
      amount,
      timeLabel,
    });
  }

  for (const history of grouped.values()) {
    history.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
    for (const day of history) {
      day.items.sort((a, b) => b.id - a.id);
    }
  }

  return grouped;
}
