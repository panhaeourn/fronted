import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { ReceiptRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import { SummaryGlowCard } from "../../lib/uiCards";
import {
  emptyCellStyle,
  errorStyle,
  headerStyle,
  loadingStyle,
  pageStyle,
  panelStyle,
  statsGridStyle,
  statusBadgeStyle,
  subCellStyle,
  tableStyle,
  tdStyle,
  thStyle,
  titleStyleSm,
} from "../../lib/uiStyles";
import {
  actionLinkStyle,
  actionsStyle,
  activeSegmentButtonStyle,
  buildMonthlyTimeline,
  capitalize,
  dangerButtonStyle,
  filtersStyle,
  formatCurrency,
  formatDate,
  formatMonthlyPeriod,
  formatReceiptType,
  getMonthlyTracking,
  getMonthStatusStyle,
  getMonthlyPaymentSummary,
  getReceiptIncomeState,
  isReceiptPaid,
  modalCardStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  monthlyListStyle,
  monthlyRowStyle,
  normalizeDisplayId,
  normalizeReceiptType,
  primaryButtonStyle,
  resolveMonthlyStartPeriod,
  searchInputStyle,
  secondaryButtonStyle,
  segmentButtonStyle,
  segmentRowStyle,
  shouldShowMarkPaid,
  successButtonStyle,
} from "./receiptListSupport";

export default function ReceiptList() {
  const [items, setItems] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchId, setSearchId] = useState("CITO");
  const [activeTypeFilter, setActiveTypeFilter] = useState<"ALL" | "COURSE" | "MONTHLY">("ALL");
  const [selectedMonthlyReceipt, setSelectedMonthlyReceipt] = useState<ReceiptRecord | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);
  const [receiptToMarkPaid, setReceiptToMarkPaid] = useState<number | null>(null);

  async function loadReceipts(ignore = false) {
    try {
      setLoading(true);
      setErr("");
      const res = await apiFetch<ReceiptRecord[]>("/api/reception/receipts");
      if (!ignore) setItems(res || []);
    } catch (error: unknown) {
      if (!ignore) setErr(getErrorMessage(error, "Failed to load receipts"));
    } finally {
      if (!ignore) setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    void loadReceipts(ignore);
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSearch() {
    try {
      setLoading(true);
      setErr("");

      let url = "/api/reception/receipts/search";
      const params = new URLSearchParams();

      if (searchName.trim()) params.append("studentName", searchName.trim());
      if (searchId.trim() && searchId.trim().toUpperCase() !== "CITO") {
        params.append("studentId", searchId.trim());
      }

      const query = params.toString();
      if (query) url += `?${query}`;

      const res = await apiFetch<ReceiptRecord[]>(url);
      setItems(res || []);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to search receipts"));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      setLoading(true);
      setErr("");
      setSearchName("");
      setSearchId("CITO");
      const res = await apiFetch<ReceiptRecord[]>("/api/reception/receipts");
      setItems(res || []);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to reload receipts"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setDeletingId(id);
      setErr("");

      await apiFetch<unknown>(`/api/reception/receipts/${id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to delete receipt");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkPaid(id: number) {
    try {
      setPayingId(id);
      setErr("");

      await apiFetch<unknown>(`/api/reception/receipts/${id}/paid`, {
        method: "PATCH",
      });
      await loadReceipts();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to update payment status");
    } finally {
      setPayingId(null);
    }
  }

  const summary = useMemo(() => {
    const paid = items.filter(
      (item) => isReceiptPaid(item)
    );
    const pending = items.filter((item) => !isReceiptPaid(item));
    const courseReceipts = items.filter(
      (item) => normalizeReceiptType(item.receiptType) === "COURSE"
    );
    const monthlyReceipts = items.filter(
      (item) => normalizeReceiptType(item.receiptType) === "MONTHLY"
    );

    return {
      totalReceipts: items.length,
      paidReceipts: paid.length,
      pendingReceipts: pending.length,
      courseReceipts: courseReceipts.length,
      monthlyReceipts: monthlyReceipts.length,
      paidIncome: paid.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      ),
      pendingIncome: pending.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      ),
      totalValue: items.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      ),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeTypeFilter === "ALL") {
      return items;
    }

    return items.filter(
      (item) => normalizeReceiptType(item.receiptType) === activeTypeFilter
    );
  }, [activeTypeFilter, items]);

  if (loading) {
    return <div style={loadingStyle}>Loading receipts...</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleSm}>All Receipts</h1>
        </div>

        <button onClick={() => void handleReset()} style={primaryButtonStyle}>
          Refresh
        </button>
      </div>

      {err && <div style={errorStyle}>{err}</div>}

      <div style={statsGridStyle}>
        <SummaryGlowCard label="Total Receipts" value={summary.totalReceipts.toLocaleString()} accent="#60a5fa" />
        <SummaryGlowCard label="Collected Income" value={formatCurrency(summary.paidIncome)} accent="#22c55e" />
        <SummaryGlowCard label="Pending Income" value={formatCurrency(summary.pendingIncome)} accent="#f59e0b" />
        <SummaryGlowCard label="Receipt Value" value={formatCurrency(summary.totalValue)} accent="#8b5cf6" />
      </div>

      <section style={panelStyle}>
        <div style={segmentRowStyle}>
          <button
            onClick={() => setActiveTypeFilter("ALL")}
            style={activeTypeFilter === "ALL" ? activeSegmentButtonStyle : segmentButtonStyle}
          >
            All
          </button>
          <button
            onClick={() => setActiveTypeFilter("COURSE")}
            style={activeTypeFilter === "COURSE" ? activeSegmentButtonStyle : segmentButtonStyle}
          >
            Course
          </button>
          <button
            onClick={() => setActiveTypeFilter("MONTHLY")}
            style={activeTypeFilter === "MONTHLY" ? activeSegmentButtonStyle : segmentButtonStyle}
          >
            Monthly
          </button>
        </div>

        <div style={filtersStyle}>
          <input
            type="text"
            placeholder="Search student name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={searchInputStyle}
          />

          <input
            type="text"
            placeholder="CITO2026001"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={searchInputStyle}
          />

          <button onClick={() => void handleSearch()} style={primaryButtonStyle}>
            Search
          </button>
          <button onClick={() => void handleReset()} style={secondaryButtonStyle}>
            Reset
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Month</th>
                <th style={thStyle}>Income</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Receptionist</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={emptyCellStyle}>
                    No receipts found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((receipt) => (
                  <tr key={receipt.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{receipt.studentName}</div>
                      <div style={subCellStyle}>
                        {normalizeDisplayId(receipt.studentId || receipt.studentCode)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...statusBadgeStyle,
                          background:
                            normalizeReceiptType(receipt.receiptType) === "MONTHLY"
                              ? "rgba(139, 92, 246, 0.18)"
                              : "rgba(59, 130, 246, 0.18)",
                          color:
                            normalizeReceiptType(receipt.receiptType) === "MONTHLY"
                              ? "#c4b5fd"
                              : "#93c5fd",
                        }}
                      >
                        {formatReceiptType(receipt.receiptType)}
                      </span>
                    </td>
                    <td style={tdStyle}>{receipt.courseName}</td>
                    <td style={tdStyle}>
                      {normalizeReceiptType(receipt.receiptType) === "MONTHLY"
                        ? formatMonthlyPeriod(resolveMonthlyStartPeriod(receipt))
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>
                        {formatCurrency(Number(receipt.totalPrice || 0))}
                      </div>
                      <div style={subCellStyle}>
                        {getReceiptIncomeState(receipt)}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "grid", gap: 8 }}>
                        {(() => {
                          const monthlySummary =
                            normalizeReceiptType(receipt.receiptType) === "MONTHLY"
                              ? getMonthlyPaymentSummary(receipt)
                              : null;
                          const paymentLabel = monthlySummary?.currentLabel || capitalize(receipt.paymentStatus || "Pending");
                          const isPaid = monthlySummary?.isPaid ?? ((receipt.paymentStatus || "").toLowerCase() === "paid");

                          return (
                        <span
                          style={{
                            ...statusBadgeStyle,
                            background:
                              isPaid
                                ? "rgba(34, 197, 94, 0.18)"
                                : "rgba(245, 158, 11, 0.18)",
                            color:
                              isPaid
                                ? "#86efac"
                                : "#fcd34d",
                          }}
                        >
                          {paymentLabel}
                        </span>
                          );
                        })()}

                        {normalizeReceiptType(receipt.receiptType) === "MONTHLY" && (
                          <span
                            style={{
                              ...statusBadgeStyle,
                              background:
                                getMonthlyTracking(receipt).missed
                                  ? "rgba(239, 68, 68, 0.18)"
                                  : "rgba(59, 130, 246, 0.18)",
                              color:
                                getMonthlyTracking(receipt).missed
                                  ? "#fca5a5"
                                  : "#93c5fd",
                            }}
                          >
                            {getMonthlyTracking(receipt).label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {receipt.createdByReceptionistName || receipt.createdByReceptionist || "-"}
                    </td>
                    <td style={tdStyle}>{formatDate(receipt.createdAt)}</td>
                    <td style={tdStyle}>
                      <div style={actionsStyle}>
                        <Link
                          to={`/reception/receipt/${receipt.id}/print`}
                          style={actionLinkStyle}
                        >
                          Detail
                        </Link>

                        {normalizeReceiptType(receipt.receiptType) === "MONTHLY" && (
                          <button
                            onClick={() => setSelectedMonthlyReceipt(receipt)}
                            style={secondaryButtonStyle}
                          >
                            View Months
                          </button>
                        )}

                        {shouldShowMarkPaid(receipt) && (
                          <button
                            onClick={() => setReceiptToMarkPaid(receipt.id)}
                            disabled={payingId === receipt.id}
                            style={{
                              ...successButtonStyle,
                              opacity: payingId === receipt.id ? 0.7 : 1,
                              cursor:
                                payingId === receipt.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {payingId === receipt.id
                              ? "Updating..."
                              : normalizeReceiptType(receipt.receiptType) === "MONTHLY"
                                ? "Mark Paid"
                                : "Mark Paid"}
                          </button>
                        )}

                        <button
                          onClick={() => setReceiptToDelete(receipt.id)}
                          disabled={deletingId === receipt.id}
                          style={{
                            ...dangerButtonStyle,
                            opacity: deletingId === receipt.id ? 0.7 : 1,
                            cursor:
                              deletingId === receipt.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {deletingId === receipt.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedMonthlyReceipt && (
        <MonthlyHistoryModal
          receipt={selectedMonthlyReceipt}
          onClose={() => setSelectedMonthlyReceipt(null)}
        />
      )}

      <ConfirmDialog
        open={receiptToDelete !== null}
        title="Delete receipt?"
        message="This receipt record will be removed permanently from the list."
        confirmText="Delete"
        tone="danger"
        onCancel={() => setReceiptToDelete(null)}
        onConfirm={() => {
          if (receiptToDelete !== null) {
            void handleDelete(receiptToDelete);
          }
          setReceiptToDelete(null);
        }}
      />

      <ConfirmDialog
        open={receiptToMarkPaid !== null}
        title="Mark receipt as paid?"
        message="This will update the payment status and confirm the receipt in the system."
        confirmText="Mark Paid"
        onCancel={() => setReceiptToMarkPaid(null)}
        onConfirm={() => {
          if (receiptToMarkPaid !== null) {
            void handleMarkPaid(receiptToMarkPaid);
          }
          setReceiptToMarkPaid(null);
        }}
      />
    </div>
  );
}

function MonthlyHistoryModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptRecord;
  onClose: () => void;
}) {
  const months = buildMonthlyTimeline(receipt);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 22 }}>Monthly History</h3>
            <div style={{ color: "#9ab0d3", marginTop: 6 }}>
              {receipt.studentName} • {normalizeDisplayId(receipt.studentId || receipt.studentCode)}
            </div>
          </div>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Close
          </button>
        </div>

        <div style={monthlyListStyle}>
          {months.length === 0 ? (
            <div style={emptyCellStyle}>No monthly history yet.</div>
          ) : (
            months.map((month) => (
              <div key={month.period} style={monthlyRowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{month.label}</div>
                  <div style={{ marginTop: 6, color: "#9ab0d3", fontSize: 13 }}>
                    {month.rangeLabel}
                  </div>
                </div>
                <div style={getMonthStatusStyle(month.status)}>
                  {month.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
