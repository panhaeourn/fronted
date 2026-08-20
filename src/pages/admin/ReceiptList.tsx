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
  const [activeTypeFilter, setActiveTypeFilter] = useState<"ALL" | "COURSE" | "MONTHLY" | "CERTIFICATE_REQUESTS">("ALL");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [selectedMonthlyReceipt, setSelectedMonthlyReceipt] = useState<ReceiptRecord | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);
  const [receiptToMarkPaid, setReceiptToMarkPaid] = useState<number | null>(null);
  const [receiptToEdit, setReceiptToEdit] = useState<ReceiptRecord | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

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
      setSelectedCourseFilter("ALL");
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

  async function handleStudentUpdate(id: number, updates: StudentEditValues) {
    try {
      setSavingEdit(true);
      setErr("");
      const updated = await apiFetch<ReceiptRecord>(`/api/reception/receipts/${id}/student`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setReceiptToEdit(null);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to update student information"));
      throw error;
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCompletionStatus(id: number, status: "PENDING" | "APPROVED") {
    try {
      const updated = await apiFetch<ReceiptRecord>(`/api/reception/receipts/${id}/completion-status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      setItems((current) => current.map((item) => item.id === id ? updated : item));
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to update completion approval"));
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
    return items.filter((item) => {
      const isCertificateRequest = true;
      const matchesType = activeTypeFilter === "ALL" || activeTypeFilter === "CERTIFICATE_REQUESTS"
        || normalizeReceiptType(item.receiptType) === activeTypeFilter;
      const matchesCourse = selectedCourseFilter === "ALL"
        || item.courseName.trim() === selectedCourseFilter;
      return isCertificateRequest && matchesType && matchesCourse;
    });
  }, [activeTypeFilter, items, selectedCourseFilter]);

  const courseFilterOptions = useMemo(
    () => [...new Set(items.map((item) => item.courseName.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [items]
  );

  if (loading) {
    return <div style={loadingStyle}>Loading receipts...</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleSm}>All Students</h1>
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
          <button
            onClick={() => setActiveTypeFilter("CERTIFICATE_REQUESTS")}
            style={activeTypeFilter === "CERTIFICATE_REQUESTS" ? activeSegmentButtonStyle : segmentButtonStyle}
          >
            Certificate Requests
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

          <select
            aria-label="Filter students by course"
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            style={searchInputStyle}
          >
            <option value="ALL">All courses</option>
            {courseFilterOptions.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

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
                      {activeTypeFilter === "CERTIFICATE_REQUESTS" && (
                        <div style={{ ...subCellStyle, color: receipt.completionStatus === "APPROVED" ? "#22c55e" : "#f59e0b" }}>
                          {receipt.completionStatus === "APPROVED" ? "Completed / Approved" : "Completion requested"}
                        </div>
                      )}
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

                        <button
                          onClick={() => setReceiptToEdit(receipt)}
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>

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

                        {activeTypeFilter === "CERTIFICATE_REQUESTS" && (
                          <button
                            onClick={() => void handleCompletionStatus(receipt.id, receipt.completionStatus === "APPROVED" ? "PENDING" : "APPROVED")}
                            style={receipt.completionStatus === "APPROVED" ? secondaryButtonStyle : successButtonStyle}
                          >
                            {receipt.completionStatus === "APPROVED" ? "Re-request" : "Approve completion"}
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

      {receiptToEdit && (
        <StudentEditModal
          receipt={receiptToEdit}
          saving={savingEdit}
          onClose={() => setReceiptToEdit(null)}
          onSave={(values) => handleStudentUpdate(receiptToEdit.id, values)}
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

type StudentEditValues = {
  studentName: string;
  studentNameEnglish: string;
  studentNameKhmer: string;
  gender: string;
  phone: string;
  contactInfo: string;
  email: string;
  address: string;
};

function StudentEditModal({
  receipt,
  saving,
  onClose,
  onSave,
}: {
  receipt: ReceiptRecord;
  saving: boolean;
  onClose: () => void;
  onSave: (values: StudentEditValues) => Promise<void>;
}) {
  const [values, setValues] = useState<StudentEditValues>({
    studentName: receipt.studentName || "",
    studentNameEnglish: receipt.studentNameEnglish || "",
    studentNameKhmer: receipt.studentNameKhmer || "",
    gender: receipt.gender || "",
    phone: receipt.phone || "",
    contactInfo: receipt.contactInfo || "",
    email: receipt.email || "",
    address: receipt.address || "",
  });
  const [formError, setFormError] = useState("");

  function update(field: keyof StudentEditValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.studentName.trim()) {
      setFormError("Student name is required.");
      return;
    }
    setFormError("");
    try {
      await onSave(values);
    } catch {
      setFormError("Could not save the changes. Please check the information and try again.");
    }
  }

  const inputStyle = {
    ...searchInputStyle,
    width: "100%",
    height: 42,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={modalOverlayStyle} onClick={saving ? undefined : onClose}>
      <form
        style={{ ...modalCardStyle, maxWidth: 760 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <div style={modalHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 22 }}>Edit Student Information</h3>
            <div style={{ color: "#9ab0d3", marginTop: 6 }}>
              {normalizeDisplayId(receipt.studentId || receipt.studentCode)} · Payment information will not change
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} style={secondaryButtonStyle}>
            Close
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <EditField label="Student name *" value={values.studentName} onChange={(value) => update("studentName", value)} style={inputStyle} />
          <EditField label="English name" value={values.studentNameEnglish} onChange={(value) => update("studentNameEnglish", value)} style={inputStyle} />
          <EditField label="Khmer name" value={values.studentNameKhmer} onChange={(value) => update("studentNameKhmer", value)} style={inputStyle} />
          <label style={{ display: "grid", gap: 7, color: "var(--app-text)" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Gender</span>
            <select value={values.gender} onChange={(event) => update("gender", event.target.value)} style={inputStyle}>
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <EditField label="Phone" value={values.phone} onChange={(value) => update("phone", value)} style={inputStyle} />
          <EditField label="Email" type="email" value={values.email} onChange={(value) => update("email", value)} style={inputStyle} />
          <EditField label="Contact information" value={values.contactInfo} onChange={(value) => update("contactInfo", value)} style={inputStyle} />
          <EditField label="Address" value={values.address} onChange={(value) => update("address", value)} style={inputStyle} />
        </div>

        {formError && <div style={errorStyle}>{formError}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} disabled={saving} style={secondaryButtonStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  style,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  style: React.CSSProperties;
}) {
  return (
    <label style={{ display: "grid", gap: 7, color: "var(--app-text)" }}>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={style} />
    </label>
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
