import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import type { PaymentHistoryRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import { SummaryGlowCard } from "../../lib/uiCards";
import {
  emptyCellStyle,
  errorStyle,
  headerStyle,
  loadingStyle,
  pageStyle,
  panelStyle,
  primaryButtonStyle,
  statsGridStyle,
  statusBadgeStyle,
  subCellStyle,
  tableHeaderStyle,
  tableStyle,
  tableSubtitleStyle,
  tdStyle,
  thStyle,
  titleStyleSm,
} from "../../lib/uiStyles";

export default function AdminPaymentHistory() {
  const [rows, setRows] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [scope, setScope] = useState<"all" | "online">("all");
  const [period, setPeriod] = useState<"all" | "today" | "week">("all");
  const [courseId, setCourseId] = useState("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const res = await apiFetch<PaymentHistoryRecord[]>("/api/admin/payment-history");
      setRows(res || []);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to load payment history"));
    } finally {
      setLoading(false);
    }
  }

  const courseOptions = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    rows.forEach((row) => {
      if (!row.courseId || !isPaidStatus(row.status)) return;
      const id = String(row.courseId);
      const current = counts.get(id);
      counts.set(id, {
        id,
        name: row.courseName || `Course ${id}`,
        count: (current?.count || 0) + 1,
      });
    });
    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    const dayFromMonday = (todayStart.getDay() + 6) % 7;
    weekStart.setDate(todayStart.getDate() - dayFromMonday);

    return rows.filter((row) => {
      const onlineEnrollment =
        (row.paymentType || "").toUpperCase() === "COURSE" &&
        Boolean(row.courseId) &&
        isPaidStatus(row.status);
      if (scope === "online" && !onlineEnrollment) return false;
      if (courseId !== "all" && String(row.courseId || "") !== courseId) return false;
      if (period === "all") return true;

      const rawDate = row.paidAt || row.createdAt;
      if (!rawDate) return false;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;
      return period === "today" ? date >= todayStart : date >= weekStart;
    });
  }, [courseId, period, rows, scope]);

  const summary = useMemo(() => {
    const paidRows = filteredRows.filter((row) =>
      ["paid", "success", "completed"].includes((row.status || "").toLowerCase())
    );
    const pendingRows = filteredRows.filter(
      (row) => !["paid", "success", "completed"].includes((row.status || "").toLowerCase())
    );

    return {
      totalPayments: filteredRows.length,
      paidCount: paidRows.length,
      pendingCount: pendingRows.length,
      totalRevenue: paidRows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      ),
      pendingRevenue: pendingRows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      ),
    };
  }, [filteredRows]);

  if (loading) {
    return <div style={loadingStyle}>Loading payment history...</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleSm}>Payment History</h1>
        </div>

        <button onClick={() => void load()} style={primaryButtonStyle}>
          Refresh
        </button>
      </div>

      {err && <div style={errorStyle}>{err}</div>}

      <div style={filterBarStyle}>
        <div style={filterGroupStyle}>
          <span style={filterLabelStyle}>Show</span>
          <FilterButton active={scope === "all"} onClick={() => {
            setScope("all");
            setCourseId("all");
          }}>All Transactions</FilterButton>
          <FilterButton active={scope === "online"} onClick={() => setScope("online")}>Online Enrollments</FilterButton>
        </div>
        <div style={filterGroupStyle}>
          <span style={filterLabelStyle}>Period</span>
          <FilterButton active={period === "all"} onClick={() => setPeriod("all")}>All Time</FilterButton>
          <FilterButton active={period === "today"} onClick={() => setPeriod("today")}>Today</FilterButton>
          <FilterButton active={period === "week"} onClick={() => setPeriod("week")}>This Week</FilterButton>
        </div>
        {scope === "online" && (
          <label style={courseFilterStyle}>
            <span style={filterLabelStyle}>Course</span>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              style={courseSelectStyle}
            >
              <option value="all">All Courses ({courseOptions.reduce((sum, course) => sum + course.count, 0)})</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.count})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div style={statsGridStyle}>
        <SummaryGlowCard
          label="Total Payments"
          value={summary.totalPayments.toLocaleString()}
          accent="#60a5fa"
        />
        <SummaryGlowCard
          label="Collected Income"
          value={formatCurrency(summary.totalRevenue)}
          accent="#34d399"
        />
        {scope !== "online" && (
          <SummaryGlowCard
            label="Pending Income"
            value={formatCurrency(summary.pendingRevenue)}
            accent="#f59e0b"
          />
        )}
        <SummaryGlowCard
          label="Paid Records"
          value={summary.paidCount.toLocaleString()}
          accent="#22c55e"
        />
      </div>

      <section style={panelStyle}>
        <div style={tableHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Transactions</h2>
          <p style={tableSubtitleStyle}>
            Includes course payments, receipt-linked transactions, and payment
            status tracking.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Course</th>
                <th style={thStyle}>Receipt Income</th>
                <th style={thStyle}>Method</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={emptyCellStyle}>
                    No payment history found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td style={tdStyle}>#{row.id}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{row.studentName || "-"}</div>
                      <div style={subCellStyle}>{row.studentId || "-"}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{row.paymentType || "-"}</div>
                      <div style={subCellStyle}>Receipt {row.receiptId || "-"}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{row.courseName || "-"}</div>
                      <div style={subCellStyle}>Course {row.courseId || "-"}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>
                        {formatCurrency(Number(row.amount || 0))}
                      </div>
                      <div style={subCellStyle}>
                        {isPaidStatus(row.status) ? "Collected income" : "Pending income"}
                      </div>
                    </td>
                    <td style={tdStyle}>{row.paymentMethod || "-"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...statusBadgeStyle,
                          background: getStatusBackground(row.status),
                          color: getStatusColor(row.status),
                        }}
                      >
                        {capitalize(row.status || "Unknown")}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div>{row.transactionRef || "-"}</div>
                      {row.checkedBy && (
                        <div style={subCellStyle}>By {row.checkedBy}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{formatDate(row.createdAt)}</td>
                    <td style={tdStyle}>{formatDate(row.paidAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...filterButtonStyle, ...(active ? filterButtonActiveStyle : {}) }}>
      {children}
    </button>
  );
}

const filterBarStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14,
  flexWrap: "wrap", marginBottom: 18, padding: 14, borderRadius: 18,
  background: "var(--app-panel-bg)", border: "var(--app-panel-border)", boxShadow: "var(--app-glow-soft)",
};
const filterGroupStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const courseFilterStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" };
const courseSelectStyle: React.CSSProperties = {
  minHeight: 40, minWidth: 220, padding: "8px 36px 8px 12px", borderRadius: 12,
  color: "var(--app-heading)", background: "var(--app-input-bg)", border: "1px solid var(--app-input-border)",
  fontWeight: 700, cursor: "pointer",
};
const filterLabelStyle: React.CSSProperties = { color: "var(--app-muted)", fontSize: 12, fontWeight: 800, marginRight: 2 };
const filterButtonStyle: React.CSSProperties = {
  minHeight: 38, padding: "8px 13px", borderRadius: 12, cursor: "pointer", fontWeight: 750,
  color: "var(--app-heading)", background: "var(--app-secondary-bg)", border: "1px solid rgba(148,163,184,.18)",
};
const filterButtonActiveStyle: React.CSSProperties = {
  color: "#fff", background: "linear-gradient(135deg,#4f7cff,#41c7f4)", borderColor: "rgba(125,211,252,.4)",
  boxShadow: "0 10px 24px rgba(59,130,246,.24)",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function capitalize(value: string) {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : "Unknown";
}

function isPaidStatus(status?: string) {
  return ["paid", "success", "completed"].includes((status || "").toLowerCase());
}

function getStatusBackground(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (isPaidStatus(normalized)) {
    return "rgba(34, 197, 94, 0.18)";
  }
  if (["pending", "processing"].includes(normalized)) {
    return "rgba(245, 158, 11, 0.18)";
  }
  return "rgba(96, 165, 250, 0.18)";
}

function getStatusColor(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (isPaidStatus(normalized)) {
    return "#86efac";
  }
  if (["pending", "processing"].includes(normalized)) {
    return "#fcd34d";
  }
  return "#bfdbfe";
}
