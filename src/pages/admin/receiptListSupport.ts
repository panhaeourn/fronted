import type { CSSProperties } from "react";
import type { ReceiptRecord } from "../../lib/domain-types";
import { statusBadgeStyle } from "../../lib/uiStyles";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function normalizeReceiptType(value?: string) {
  return value?.toUpperCase() === "MONTHLY" ? "MONTHLY" : "COURSE";
}

export function normalizeDisplayId(value?: string | null) {
  if (!value) return "-";
  return value.startsWith("STD") ? value.replace(/^STD/, "CITO") : value;
}

export function formatReceiptType(value?: string) {
  return normalizeReceiptType(value) === "MONTHLY" ? "Monthly" : "Course";
}

export function isReceiptPaid(receipt: ReceiptRecord) {
  if (normalizeReceiptType(receipt.receiptType) !== "MONTHLY") {
    return String(receipt.paymentStatus || "").toLowerCase() === "paid";
  }
  return getMonthlyPaymentSummary(receipt).isPaid;
}

export function getReceiptIncomeState(receipt: ReceiptRecord) {
  return isReceiptPaid(receipt) ? "Collected income" : "Pending income";
}

export function formatMonthlyPeriod(value?: string) {
  if (!value) return "-";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function parseReceiptDate(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildMonthlyRange(period: string, createdAt?: string) {
  if (!period) return null;
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return null;

  const createdDate = parseReceiptDate(createdAt);
  const anchorDay = createdDate.getDate();
  const monthIndex = month - 1;

  const startDay = Math.min(anchorDay, lastDayOfMonth(year, monthIndex));
  const start = new Date(year, monthIndex, startDay);

  const nextMonthYear = monthIndex === 11 ? year + 1 : year;
  const nextMonthIndex = (monthIndex + 1) % 12;
  const endDay = Math.min(anchorDay, lastDayOfMonth(nextMonthYear, nextMonthIndex));
  const end = new Date(nextMonthYear, nextMonthIndex, endDay);

  return { start, end };
}

function formatMonthlyRange(period: string, createdAt?: string) {
  const range = buildMonthlyRange(period, createdAt);
  if (!range) return "-";

  return `${range.start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${range.end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function resolveMonthlyStartPeriod(receipt: ReceiptRecord) {
  const explicit = receipt.monthlyPeriod;
  if (explicit && /\d{4}-\d{2}/.test(explicit)) {
    return explicit.slice(0, 7);
  }
  return currentPeriod();
}

function buildPeriods(start: string, end: string) {
  const periods: string[] = [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth) return periods;

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return periods;
}

function parsePaidMonths(receipt: ReceiptRecord) {
  return String(receipt.monthlyPaidMonths || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildMonthlyTimeline(receipt: ReceiptRecord) {
  const start = resolveMonthlyStartPeriod(receipt);
  const end = currentPeriod();
  const paidMonths = new Set(parsePaidMonths(receipt));
  const currentPaid = String(receipt.paymentStatus || "").toLowerCase() === "paid";

  return buildPeriods(start, end).map((period) => {
    const isCurrent = period === (receipt.monthlyPeriod || "").slice(0, 7);
    const status = paidMonths.has(period) || (isCurrent && currentPaid)
      ? "Paid"
      : period < end
        ? "Missing"
        : "Pending";

    return {
      period,
      label: formatMonthlyPeriod(period),
      rangeLabel: formatMonthlyRange(period, receipt.createdAt),
      status,
    };
  });
}

export function getMonthlyPaymentSummary(receipt: ReceiptRecord) {
  const timeline = buildMonthlyTimeline(receipt);
  const paidCount = timeline.filter((item) => item.status === "Paid").length;
  const current = timeline[timeline.length - 1];

  return {
    paidCount,
    isPaid: current?.status === "Paid",
    currentLabel:
      current?.status === "Paid"
        ? "Up to date"
        : `${capitalize(current?.status || "Pending")} ${current?.label || ""}`.trim(),
  };
}

export function getMonthlyTracking(receipt: ReceiptRecord) {
  const summary = getMonthlyPaymentSummary(receipt);
  return {
    missed: !summary.isPaid,
    label: summary.currentLabel,
  };
}

export function shouldShowMarkPaid(receipt: ReceiptRecord) {
  if (normalizeReceiptType(receipt.receiptType) !== "MONTHLY") {
    return !isReceiptPaid(receipt);
  }

  return buildMonthlyTimeline(receipt).some((month) => month.status !== "Paid");
}

export const primaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  minWidth: 72,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.3), 0 0 28px rgba(96, 165, 250, 0.24)",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const secondaryButtonStyle: CSSProperties = {
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  minWidth: 72,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid var(--app-secondary-border)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const successButtonStyle: CSSProperties = {
  background: "var(--app-success-bg)",
  color: "var(--app-success-text)",
  minWidth: 88,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid var(--app-success-border)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const dangerButtonStyle: CSSProperties = {
  background: "var(--app-danger-bg)",
  color: "var(--app-danger-text)",
  minWidth: 88,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid var(--app-danger-border)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const actionLinkStyle: CSSProperties = {
  textDecoration: "none",
  background: "var(--app-link-bg)",
  color: "var(--app-accent-soft)",
  minWidth: 88,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid var(--app-border-soft)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const filtersStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

export const segmentRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 16,
};

export const segmentButtonStyle: CSSProperties = {
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  minWidth: 92,
  height: 44,
  padding: "0 18px",
  borderRadius: 999,
  border: "1px solid var(--app-secondary-border)",
  fontSize: 14,
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const activeSegmentButtonStyle: CSSProperties = {
  ...segmentButtonStyle,
  background: "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  border: "1px solid rgba(191, 219, 254, 0.28)",
  boxShadow: "0 12px 26px rgba(33, 126, 255, 0.24), 0 0 24px rgba(96, 165, 250, 0.18)",
};

export const searchInputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  minWidth: 220,
  boxShadow: "var(--app-glow-soft)",
};

export const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--app-overlay-bg)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 50,
};

export const modalCardStyle: CSSProperties = {
  width: "min(760px, 100%)",
  maxHeight: "80vh",
  overflowY: "auto",
  borderRadius: 24,
  padding: 22,
  background: "var(--app-dialog-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-strong)",
};

export const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  marginBottom: 20,
  flexWrap: "wrap",
};

export const monthlyListStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

export const monthlyRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: 14,
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
  flexWrap: "wrap",
};

export function getMonthStatusStyle(status: string): CSSProperties {
  return {
    ...statusBadgeStyle,
    background:
      status === "Paid"
        ? "rgba(34, 197, 94, 0.18)"
        : status === "Missing"
          ? "rgba(239, 68, 68, 0.18)"
          : "rgba(245, 158, 11, 0.18)",
    color:
      status === "Paid"
        ? "#86efac"
        : status === "Missing"
          ? "#fca5a5"
          : "#fcd34d",
  };
}
