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

  const summary = useMemo(() => {
    const paidRows = rows.filter((row) =>
      ["paid", "success", "completed"].includes((row.status || "").toLowerCase())
    );
    const pendingRows = rows.filter(
      (row) => !["paid", "success", "completed"].includes((row.status || "").toLowerCase())
    );

    return {
      totalPayments: rows.length,
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
  }, [rows]);

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
        <SummaryGlowCard
          label="Pending Income"
          value={formatCurrency(summary.pendingRevenue)}
          accent="#f59e0b"
        />
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={emptyCellStyle}>
                    No payment history found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
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
