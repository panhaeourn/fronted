import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api";
import type { ReceptionistUser } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import {
  groupReceiptsByReceptionistDay,
  type ReceiptHistoryRow,
  type ReceptionistDayEntry,
} from "../../lib/receptionistDailyReceipts";

type MeUser = {
  id: number;
  email: string;
  username?: string;
  name?: string;
  role: string;
};

type RangeView = "DAY" | "WEEK" | "MONTH" | "YEAR";

type WeekBucket = {
  key: string;
  label: string;
  total: number;
  count: number;
  days: ReceptionistDayEntry[];
};

type MonthBucket = {
  key: string;
  label: string;
  total: number;
  count: number;
  weeks: WeekBucket[];
};

export default function ReceptionistDailyMoney() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [receptionists, setReceptionists] = useState<ReceptionistUser[]>([]);
  const [paymentRows, setPaymentRows] = useState<ReceiptHistoryRow[]>([]);
  const [me, setMe] = useState<MeUser | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const idNum = userId ? Number(userId) : NaN;
  const range = normalizeRange(searchParams.get("range"));
  const isSelfView = !userId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        if (isSelfView) {
          const [meData, receiptData] = await Promise.all([
            apiFetch<MeUser>("/api/auth/me"),
            apiFetch<ReceiptHistoryRow[]>("/api/reception/receipts"),
          ]);
          if (cancelled) return;
          setMe(meData || null);
          setReceptionists([]);
          setPaymentRows(receiptData || []);
          return;
        }

        const [userData, paymentData] = await Promise.all([
          apiFetch<ReceptionistUser[]>("/api/admin/receptionist-codes/users"),
          apiFetch<ReceiptHistoryRow[]>("/api/admin/payment-history"),
        ]);
        if (cancelled) return;
        setReceptionists(userData || []);
        setPaymentRows(paymentData || []);
      } catch (error: unknown) {
        if (!cancelled) {
          setErr(getErrorMessage(error, "Failed to load data"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSelfView]);

  const user = useMemo(
    () =>
      isSelfView
        ? me
          ? {
              id: me.id,
              username: me.name || me.username || "Receptionist",
              email: me.email,
              role: me.role,
            }
          : null
        : receptionists.find((item) => item.id === idNum) ?? null,
    [receptionists, idNum, isSelfView, me]
  );

  const normalizedRows = useMemo(() => {
    if (!isSelfView || !user) return paymentRows;
    return paymentRows.map((row) => ({
      ...row,
      checkedBy: user.email,
      createdByReceptionist: user.email,
    }));
  }, [isSelfView, paymentRows, user]);

  const groupedByReceptionist = useMemo(
    () => groupReceiptsByReceptionistDay(normalizedRows),
    [normalizedRows]
  );

  const allDays = user
    ? groupedByReceptionist.get(user.email.trim().toLowerCase()) || []
    : [];

  const filteredDays = useMemo(() => filterDaysByRange(allDays, range), [allDays, range]);
  const weekBuckets = useMemo(() => buildWeekBuckets(filteredDays), [filteredDays]);
  const yearBuckets = useMemo(() => buildYearBuckets(filteredDays), [filteredDays]);
  const total = filteredDays.reduce((sum, day) => sum + day.total, 0);
  const totalTransactions = filteredDays.reduce((sum, day) => sum + day.count, 0);

  if (!isSelfView && (!userId || Number.isNaN(idNum))) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "var(--app-danger-text)" }}>Invalid receptionist.</p>
        <button type="button" onClick={() => navigate("/admin/receptionists")} style={backBtn}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1240, margin: "0 auto", color: "var(--app-heading)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => navigate(isSelfView ? "/" : "/admin/receptionists")}
          style={backBtn}
        >
          Back
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{isSelfView ? `My ${getPageTitle(range)}` : getPageTitle(range)}</h1>
          <p style={{ margin: "6px 0 0", color: "var(--app-muted)", fontSize: 14 }}>
            {getPageDescription(range)}
          </p>
        </div>
      </div>

      {loading && <p style={{ color: "var(--app-accent-soft)" }}>Loading...</p>}
      {err && !loading && (
        <div style={{ color: "var(--app-danger-text)", marginBottom: 12 }}>{err}</div>
      )}

      {!loading && !user && !err && (
        <p style={{ color: "var(--app-danger-text)" }}>Receptionist not found.</p>
      )}

      {user && (
        <>
        <div style={heroCardStyle}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>
              {isSelfView ? user.username || "My Summary" : user.username || "No username"}
            </div>
            <div style={{ color: "var(--app-accent-soft)", marginTop: 6 }}>{user.email}</div>
            <div style={{ color: "var(--app-muted)", fontSize: 13, marginTop: 6 }}>{user.role}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["DAY", "WEEK", "MONTH", "YEAR"] as const).map((item) => (
                <Link
                  key={item}
                  to={isSelfView ? `/reception/money?range=${item}` : `/admin/receptionists/${user.id}/money?range=${item}`}
                  style={item === range ? activeFilterChipStyle : filterChipStyle}
                >
                  {formatRangeLabel(item)}
                </Link>
              ))}
            </div>
          </div>

          <div style={summaryGridStyle}>
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Total Income</div>
              <div style={summaryValueStyle}>{formatCurrency(total)}</div>
            </div>
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>{getBucketLabel(range)}</div>
              <div style={summaryValueStyle}>
                {getBucketCount(range, filteredDays, weekBuckets, yearBuckets)}
              </div>
            </div>
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Transactions</div>
              <div style={summaryValueStyle}>{totalTransactions}</div>
            </div>
          </div>
        </>
      )}

      {user && filteredDays.length === 0 && !loading && (
        <div style={emptyStateStyle}>
          No paid transactions found in this {formatRangeLabel(range).toLowerCase()}.
        </div>
      )}

      {user && filteredDays.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {range === "DAY" && renderDayTree(filteredDays)}
          {range === "WEEK" && renderWeekTree(filteredDays)}
          {range === "MONTH" && renderMonthTree(weekBuckets)}
          {range === "YEAR" && renderYearTree(yearBuckets)}
        </div>
      )}
    </div>
  );
}

function renderDayTree(days: ReceptionistDayEntry[]) {
  return days.map((day) => (
    <div key={day.dayKey} style={bucketCardStyle}>
      <div style={bucketHeaderStyle}>
        <div>
          <div style={bucketTitleStyle}>{day.dayLabel}</div>
          <div style={bucketMetaStyle}>{day.count} paid transaction(s)</div>
        </div>
        <div style={bucketTotalStyle}>{formatCurrency(day.total)}</div>
      </div>

      <div style={treeChildColumnStyle}>
        {day.items.map((item) => (
          <div key={`${day.dayKey}-${item.id}`} style={treeLeafRowStyle}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.studentName}</div>
              <div style={transactionMetaStyle}>Student ID: {item.studentId}</div>
              {item.studentCode ? (
                <div style={transactionMetaStyle}>Code: {item.studentCode}</div>
              ) : null}
              <div style={transactionMetaStyle}>Course: {item.courseName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</div>
              <div style={transactionMetaStyle}>{item.timeLabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}

function renderWeekTree(days: ReceptionistDayEntry[]) {
  return (
    <div style={bucketCardStyle}>
      <div style={bucketHeaderStyle}>
        <div>
          <div style={bucketTitleStyle}>This Week</div>
          <div style={bucketMetaStyle}>Each day with its paid transactions</div>
        </div>
      </div>

      <div style={treeColumnStyle}>
        {days.map((day) => (
          <div key={day.dayKey} style={treeBranchCardStyle}>
            <div style={treeBranchHeaderStyle}>
              <div>
                <div style={treeBranchTitleStyle}>{day.dayLabel}</div>
                <div style={transactionMetaStyle}>{day.count} transaction(s)</div>
              </div>
              <div style={treeBranchValueStyle}>{formatCurrency(day.total)}</div>
            </div>

            <div style={treeChildColumnStyle}>
              {day.items.map((item) => (
                <div key={`${day.dayKey}-${item.id}`} style={treeLeafRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.studentName}</div>
                    <div style={transactionMetaStyle}>{item.courseName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</div>
                    <div style={transactionMetaStyle}>{item.timeLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderMonthTree(weeks: WeekBucket[]) {
  return (
    <div style={bucketCardStyle}>
      <div style={bucketHeaderStyle}>
        <div>
          <div style={bucketTitleStyle}>This Month</div>
          <div style={bucketMetaStyle}>Weekly tree with daily breakdown</div>
        </div>
      </div>

      <div style={treeColumnStyle}>
        {weeks.map((week) => (
          <div key={week.key} style={treeBranchCardStyle}>
            <div style={treeBranchHeaderStyle}>
              <div>
                <div style={treeBranchTitleStyle}>{week.label}</div>
                <div style={transactionMetaStyle}>{week.count} transaction(s)</div>
              </div>
              <div style={treeBranchValueStyle}>{formatCurrency(week.total)}</div>
            </div>

            <div style={treeChildColumnStyle}>
              {week.days.map((day) => (
                <div key={day.dayKey} style={nestedCardStyle}>
                  <div style={nestedRowStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{day.dayLabel}</div>
                      <div style={transactionMetaStyle}>{day.count} transaction(s)</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(day.total)}</div>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {day.items.map((item) => (
                      <div key={`${day.dayKey}-${item.id}`} style={treeLeafRowStyle}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.studentName}</div>
                          <div style={transactionMetaStyle}>{item.courseName}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</div>
                          <div style={transactionMetaStyle}>{item.timeLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderYearTree(months: MonthBucket[]) {
  return (
    <div style={bucketCardStyle}>
      <div style={bucketHeaderStyle}>
        <div>
          <div style={bucketTitleStyle}>Year Decomposition Tree</div>
          <div style={bucketMetaStyle}>Month to week to day income flow</div>
        </div>
      </div>

      <div style={treeColumnStyle}>
        {months.map((month) => (
          <div key={month.key} style={treeBranchCardStyle}>
            <div style={treeBranchHeaderStyle}>
              <div>
                <div style={treeBranchTitleStyle}>{month.label}</div>
                <div style={transactionMetaStyle}>{month.count} transaction(s)</div>
              </div>
              <div style={treeBranchValueStyle}>{formatCurrency(month.total)}</div>
            </div>

            <div style={treeChildColumnStyle}>
              {month.weeks.map((week) => (
                <div key={week.key} style={nestedCardStyle}>
                  <div style={nestedRowStyle}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{week.label}</div>
                      <div style={transactionMetaStyle}>{week.count} transaction(s)</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(week.total)}</div>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {week.days.map((day) => (
                      <div key={day.dayKey} style={treeLeafRowStyle}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{day.dayLabel}</div>
                          <div style={transactionMetaStyle}>{day.count} transaction(s)</div>
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatCurrency(day.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeRange(value: string | null): RangeView {
  const normalized = (value || "DAY").toUpperCase();
  if (normalized === "WEEK" || normalized === "MONTH" || normalized === "YEAR") {
    return normalized;
  }
  return "DAY";
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

function filterDaysByRange(days: ReceptionistDayEntry[], range: RangeView) {
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

function buildWeekBuckets(days: ReceptionistDayEntry[]): WeekBucket[] {
  const map = new Map<string, WeekBucket>();

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
      map.set(key, {
        key,
        label,
        total: 0,
        count: 0,
        days: [],
      });
    }

    const bucket = map.get(key)!;
    bucket.total += day.total;
    bucket.count += day.count;
    bucket.days.push(day);
  }

  return [...map.values()]
    .map((bucket) => ({
      ...bucket,
      days: bucket.days.sort((a, b) => b.dayKey.localeCompare(a.dayKey)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function buildYearBuckets(days: ReceptionistDayEntry[]): MonthBucket[] {
  const monthMap = new Map<string, MonthBucket>();

  for (const day of days) {
    const date = new Date(`${day.dayKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) continue;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        key: monthKey,
        label: monthLabel,
        total: 0,
        count: 0,
        weeks: [],
      });
    }

    const monthBucket = monthMap.get(monthKey)!;
    monthBucket.total += day.total;
    monthBucket.count += day.count;
  }

  const weekBuckets = buildWeekBuckets(days);

  for (const week of weekBuckets) {
    const firstDay = week.days[0];
    if (!firstDay) continue;
    const firstDate = new Date(`${firstDay.dayKey}T00:00:00`);
    const monthKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, "0")}`;
    const monthBucket = monthMap.get(monthKey);
    if (monthBucket) monthBucket.weeks.push(week);
  }

  return [...monthMap.values()]
    .map((bucket) => ({
      ...bucket,
      weeks: bucket.weeks.sort((a, b) => b.key.localeCompare(a.key)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function getPageTitle(range: RangeView) {
  switch (range) {
    case "DAY":
      return "Daily Income";
    case "WEEK":
      return "Weekly Income";
    case "MONTH":
      return "Monthly Income";
    case "YEAR":
      return "Yearly Income";
  }
}

function getPageDescription(range: RangeView) {
  switch (range) {
    case "DAY":
      return "See today's paid income and every payment transaction.";
    case "WEEK":
      return "See this week's paid income broken down by day.";
    case "MONTH":
      return "See this month's paid income grouped by week, then by day.";
    case "YEAR":
      return "See this year's paid income grouped by month in a decomposition tree.";
  }
}

function getBucketLabel(range: RangeView) {
  switch (range) {
    case "DAY":
      return "Active Days";
    case "WEEK":
      return "Days This Week";
    case "MONTH":
      return "Weeks This Month";
    case "YEAR":
      return "Months This Year";
  }
}

function getBucketCount(
  range: RangeView,
  days: ReceptionistDayEntry[],
  weeks: WeekBucket[],
  months: MonthBucket[]
) {
  if (range === "DAY") return days.length;
  if (range === "WEEK") return days.length;
  if (range === "MONTH") return weeks.length;
  return months.length;
}

function formatRangeLabel(range: RangeView) {
  return range.charAt(0) + range.slice(1).toLowerCase();
}

const backBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid rgba(191, 219, 254, 0.22)",
  background: "rgba(96, 165, 250, 0.14)",
  color: "#dbeafe",
  fontWeight: 700,
  cursor: "pointer",
};

const heroCardStyle: React.CSSProperties = {
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
  boxShadow: "var(--app-panel-shadow)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const summaryCardStyle: React.CSSProperties = {
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "var(--app-glow-soft)",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const summaryValueStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 28,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const bucketCardStyle: React.CSSProperties = {
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "var(--app-panel-shadow)",
};

const bucketHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const bucketTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 20,
};

const bucketMetaStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
  marginTop: 4,
};

const bucketTotalStyle: React.CSSProperties = {
  color: "#86efac",
  fontWeight: 800,
  fontSize: 22,
};

const treeColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const treeBranchCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const treeBranchHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const treeBranchTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 18,
};

const treeBranchValueStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 18,
  color: "#86efac",
};

const treeChildColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
  paddingLeft: 16,
  borderLeft: "2px solid rgba(96, 165, 250, 0.22)",
};

const nestedCardStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const nestedRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const treeLeafRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  padding: "10px 12px",
  borderRadius: 12,
  background: "var(--app-card-solid-bg-strong)",
  border: "1px solid var(--app-border-soft)",
};

const transactionMetaStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  marginTop: 4,
};

const emptyStateStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 18,
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  color: "var(--app-muted)",
  boxShadow: "var(--app-panel-shadow)",
};

const filterChipStyle: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg)",
  color: "var(--app-muted-strong)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  boxShadow: "var(--app-glow-soft)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const activeFilterChipStyle: React.CSSProperties = {
  ...filterChipStyle,
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  border: "1px solid rgba(191, 219, 254, 0.28)",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}
