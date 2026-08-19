import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { ClaimCode, ReceptionistUser } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import {
  groupReceiptsByReceptionistDay,
  type ReceiptHistoryRow,
} from "../../lib/receptionistDailyReceipts";
import { ReceptionistSummaryCard } from "./ReceptionistSummaryCard";
import {
  activeStatusStyle,
  errorTextStyle,
  formStyle,
  generatedCodeCardStyle,
  inputStyle,
  pageStyle,
  primaryButtonStyle,
  sectionHeadingStyle,
  sectionPanelStyle,
  simpleGridStyle,
} from "./manageReceptionistStyles";
import type { RangeView } from "./manageReceptionistSupport";

export default function ManageReceptionist() {
  const [email, setEmail] = useState("");
  const [generated, setGenerated] = useState<ClaimCode | null>(null);
  const [codes, setCodes] = useState<ClaimCode[]>([]);
  const [receptionists, setReceptionists] = useState<ReceptionistUser[]>([]);
  const [paymentRows, setPaymentRows] = useState<ReceiptHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [userToRemove, setUserToRemove] = useState<number | null>(null);
  const [rangeByUser, setRangeByUser] = useState<Record<number, RangeView>>({});
  const [overallRange, setOverallRange] = useState<RangeView | "CUSTOM">("DAY");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedCustomFrom, setAppliedCustomFrom] = useState("");
  const [appliedCustomTo, setAppliedCustomTo] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));

  const activeCodes = codes.filter(
    (item) => !item.used && new Date(item.expiresAt) >= new Date()
  );

  const receiptHistoryByReceptionist = useMemo(
    () => groupReceiptsByReceptionistDay(paymentRows),
    [paymentRows]
  );

  const currentReceiptHistoryByReceptionist = useMemo(() => {
    const currentEmails = new Set(
      receptionists.map((user) => user.email.trim().toLowerCase()).filter(Boolean)
    );
    return new Map(
      [...receiptHistoryByReceptionist.entries()].filter(([email]) => currentEmails.has(email))
    );
  }, [receiptHistoryByReceptionist, receptionists]);

  const timelineBounds = useMemo(() => {
    const timestamps = [...currentReceiptHistoryByReceptionist.values()].flat()
      .map((day) => new Date(`${day.dayKey}T00:00:00`).getTime())
      .filter(Number.isFinite);
    const today = new Date();
    const fallbackMax = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const fallbackMin = new Date(today.getFullYear(), 0, 1).getTime();
    return {
      min: timestamps.length ? Math.min(...timestamps) : fallbackMin,
      max: timestamps.length ? Math.max(fallbackMax, ...timestamps) : fallbackMax,
    };
  }, [currentReceiptHistoryByReceptionist]);

  const overallSummary = useMemo(() => {
    const now = new Date();
    const days = [...currentReceiptHistoryByReceptionist.values()].flat().filter((day) => {
      const date = new Date(`${day.dayKey}T00:00:00`);
      if (Number.isNaN(date.getTime())) return false;
      if (overallRange === "DAY") {
        return date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
      }
      if (overallRange === "WEEK") {
        const start = startOfWeek(now);
        return date >= start && date <= now;
      }
      if (overallRange === "MONTH") {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }
      if (overallRange === "YEAR") return date.getFullYear() === now.getFullYear();

      const from = appliedCustomFrom ? new Date(`${appliedCustomFrom}T00:00:00`) : null;
      const to = appliedCustomTo ? new Date(`${appliedCustomTo}T23:59:59.999`) : null;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return Boolean(from || to);
    });

    const studentIds = new Set<string>();
    days.forEach((day) => day.items.forEach((item) =>
      studentIds.add(item.studentId !== "-" ? item.studentId : `${day.dayKey}:${item.id}`)
    ));

    return {
      income: days.reduce((sum, day) => sum + day.total, 0),
      transactions: days.reduce((sum, day) => sum + day.count, 0),
      students: studentIds.size,
      receptionists: [...currentReceiptHistoryByReceptionist.values()].filter((history) =>
        history.some((day) => days.includes(day))
      ).length,
    };
  }, [appliedCustomFrom, appliedCustomTo, currentReceiptHistoryByReceptionist, overallRange]);

  const todayInput = timestampToDateInput(new Date().setHours(0, 0, 0, 0));

  function openCustomTimeline() {
    const from = timestampToDateInput(timelineBounds.min);
    const to = todayInput;
    setOverallRange("CUSTOM");
    const selectedFrom = appliedCustomFrom || from;
    const selectedTo = appliedCustomTo || to;
    setCustomFrom(selectedFrom);
    setCustomTo(selectedTo);
    const selectedMonth = startOfMonth(new Date(`${selectedFrom}T00:00:00`));
    const latestFirstMonth = addMonths(startOfMonth(new Date()), -1);
    setCalendarMonth(selectedMonth > latestFirstMonth ? latestFirstMonth : selectedMonth);
    setCalendarOpen(true);
  }

  function selectCalendarDate(value: string) {
    if (!customFrom || customTo) {
      setCustomFrom(value);
      setCustomTo("");
      return;
    }
    if (dateInputToTimestamp(value) < dateInputToTimestamp(customFrom)) {
      setCustomFrom(value);
      return;
    }
    setCustomTo(value);
  }

  function cancelCalendar() {
    setCustomFrom(appliedCustomFrom);
    setCustomTo(appliedCustomTo);
    setCalendarOpen(false);
  }

  function applyCalendar() {
    if (!customFrom) return;
    const to = customTo || customFrom;
    setCustomTo(to);
    setAppliedCustomFrom(customFrom);
    setAppliedCustomTo(to);
    setCalendarOpen(false);
  }

  async function loadData() {
    try {
      const [codeData, userData, paymentData] = await Promise.all([
        apiFetch<ClaimCode[]>("/api/admin/receptionist-codes"),
        apiFetch<ReceptionistUser[]>("/api/admin/receptionist-codes/users"),
        apiFetch<ReceiptHistoryRow[]>("/api/admin/payment-history"),
      ]);
      setCodes(codeData || []);
      setReceptionists(userData || []);
      setPaymentRows(paymentData || []);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to load receptionist data"));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!email.trim()) {
      setErr("Receptionist email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch<ClaimCode>("/api/admin/receptionist-codes", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      setGenerated(res);
      setEmail("");
      await loadData();
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to generate code"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: number) {
    try {
      setErr("");
      await apiFetch(`/api/admin/receptionist-codes/remove/${userId}`, {
        method: "PATCH",
      });
      await loadData();
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to remove receptionist"));
    }
  }

  return (
    <div style={pageStyle}>
      <h1>Manage Receptionist</h1>

      {err && (
        <div style={errorTextStyle}>
          {err}
        </div>
      )}

      <div style={sectionPanelStyle}>
        <h2 style={sectionHeadingStyle}>Generate Receptionist Claim Code</h2>

        <form onSubmit={handleGenerate} style={formStyle}>
          <input
            type="email"
            placeholder="Receptionist Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButtonStyle,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating..." : "Generate Code"}
          </button>
        </form>

        {generated && (
          <div style={generatedCodeCardStyle}>
            <div><b>Code:</b> {generated.code}</div>
            <div><b>Email:</b> {generated.targetEmail}</div>
            <div><b>Expires:</b> {new Date(generated.expiresAt).toLocaleString()}</div>
          </div>
        )}
      </div>

      <div style={sectionPanelStyle}>
        <div style={overallHeaderStyle}>
          <h2 style={{ ...sectionHeadingStyle, marginBottom: 0 }}>All Receptionists Income</h2>
        </div>

        <div style={durationToolbarStyle}>
          <span style={durationLabelStyle}>Duration</span>
          <div style={overallRangeStyle}>
            {(["DAY", "WEEK", "MONTH", "YEAR"] as RangeView[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOverallRange(item)}
                style={item === overallRange ? overallRangeActiveStyle : overallRangeButtonStyle}
              >
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={openCustomTimeline}
              style={overallRange === "CUSTOM" ? overallRangeActiveStyle : overallRangeButtonStyle}
            >
              Custom
            </button>
          </div>
          {overallRange === "CUSTOM" && (
            <div className="income-date-picker-shell">
              <button
                type="button"
                className="income-date-range-trigger"
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
                onClick={() => setCalendarOpen((open) => !open)}
              >
                <span className="income-date-icon" aria-hidden="true">▣</span>
                <span>
                  <small>From</small>
                  <strong>{formatShortDate(customFrom || appliedCustomFrom)}</strong>
                </span>
                <span className="income-date-divider" />
                <span>
                  <small>To</small>
                  <strong>{formatShortDate(customTo || appliedCustomTo)}</strong>
                </span>
                <span className="income-date-chevron" aria-hidden="true">⌄</span>
              </button>

              {calendarOpen && (
                <div className="income-calendar-popover" role="dialog" aria-label="Choose income date range">
                  <div className="income-calendar-heading">
                    <div>
                      <strong>Select income period</strong>
                      <span>{customTo ? `${formatShortDate(customFrom)} – ${formatShortDate(customTo)}` : "Choose an end date"}</span>
                    </div>
                    <div className="income-calendar-nav">
                      <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>‹</button>
                      <button
                        type="button"
                        aria-label="Next month"
                        disabled={isSameOrAfterMonth(addMonths(calendarMonth, 1), new Date())}
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      >›</button>
                    </div>
                  </div>
                  <div className="income-calendar-months">
                    {[calendarMonth, addMonths(calendarMonth, 1)].map((month) => (
                      <CalendarMonth
                        key={`${month.getFullYear()}-${month.getMonth()}`}
                        month={month}
                        from={customFrom}
                        to={customTo}
                        min={timestampToDateInput(timelineBounds.min)}
                        max={todayInput}
                        onSelect={selectCalendarDate}
                      />
                    ))}
                  </div>
                  <div className="income-calendar-actions">
                    <span>{customFrom && customTo ? `${countInclusiveDays(dateInputToTimestamp(customFrom), dateInputToTimestamp(customTo))} days selected` : "Select a start and end date"}</span>
                    <button type="button" className="income-calendar-cancel" onClick={cancelCalendar}>Cancel</button>
                    <button type="button" className="income-calendar-apply" disabled={!customFrom} onClick={applyCalendar}>Apply</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={overallSummaryGridStyle}>
          <OverallMetric label="Total Income" value={formatCurrency(overallSummary.income)} accent="#34d399" />
          <OverallMetric label="Transactions" value={overallSummary.transactions.toLocaleString()} accent="#60a5fa" />
          <OverallMetric label="Students Paid" value={overallSummary.students.toLocaleString()} accent="#a78bfa" />
          <OverallMetric label="Active Receptionists" value={overallSummary.receptionists.toLocaleString()} accent="#f59e0b" />
        </div>
      </div>

      <div style={sectionPanelStyle}>
        <h2 style={sectionHeadingStyle}>Current Receptionists</h2>

        {receptionists.length === 0 ? (
          <p>No receptionists yet.</p>
        ) : (
          <div style={simpleGridStyle}>
            {receptionists.map((user) => (
              <ReceptionistSummaryCard
                key={user.id}
                user={user}
                allDays={currentReceiptHistoryByReceptionist.get(user.email.trim().toLowerCase()) || []}
                range={rangeByUser[user.id] || "DAY"}
                onRangeChange={(nextRange) =>
                  setRangeByUser((prev) => ({ ...prev, [user.id]: nextRange }))
                }
                onRemove={() => setUserToRemove(user.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={sectionPanelStyle}>
        <h2 style={sectionHeadingStyle}>Generated Claim Codes</h2>

        {activeCodes.length === 0 ? (
          <p>No active codes right now.</p>
        ) : (
          <div style={simpleGridStyle}>
            {activeCodes.map((item) => (
              <div key={item.id} style={generatedCodeCardStyle}>
                <div><b>Code:</b> {item.code}</div>
                <div><b>Email:</b> {item.targetEmail}</div>
                <div><b>Created:</b> {new Date(item.createdAt).toLocaleString()}</div>
                <div><b>Expires:</b> {new Date(item.expiresAt).toLocaleString()}</div>
                <div>
                  <b>Status:</b>{" "}
                  <span style={activeStatusStyle}>ACTIVE</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={userToRemove !== null}
        title="Remove receptionist role?"
        message="This user will lose receptionist access and return to a normal account."
        confirmText="Remove"
        tone="danger"
        onCancel={() => setUserToRemove(null)}
        onConfirm={() => {
          if (userToRemove !== null) {
            void handleRemove(userToRemove);
          }
          setUserToRemove(null);
        }}
      />
    </div>
  );
}

function OverallMetric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...overallMetricStyle, boxShadow: `0 14px 32px color-mix(in srgb, ${accent} 18%, transparent)` }}>
      <div style={overallMetricLabelStyle}>{label}</div>
      <div style={{ ...overallMetricValueStyle, color: accent }}>{value}</div>
    </div>
  );
}

function CalendarMonth({
  month, from, to, min, max, onSelect,
}: {
  month: Date; from: string; to: string; min: string; max: string; onSelect: (value: string) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const leadingDays = (first.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: leadingDays + totalDays }, (_, index) => {
    if (index < leadingDays) return null;
    return new Date(month.getFullYear(), month.getMonth(), index - leadingDays + 1);
  });

  return (
    <section className="income-calendar-month" aria-label={month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}>
      <h3>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
      <div className="income-calendar-weekdays" aria-hidden="true">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="income-calendar-grid">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const value = timestampToDateInput(date.getTime());
          const disabled = value < min || value > max;
          const selected = value === from || value === to;
          const inRange = Boolean(from && to && value > from && value < to);
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              className={`${selected ? "is-selected" : ""} ${inRange ? "is-in-range" : ""}`}
              aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              aria-pressed={selected}
              onClick={() => onSelect(value)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function startOfWeek(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = value.getDay();
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function timestampToDateInput(value: number) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateInputToTimestamp(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameOrAfterMonth(date: Date, comparison: Date) {
  return date.getFullYear() > comparison.getFullYear() ||
    (date.getFullYear() === comparison.getFullYear() && date.getMonth() >= comparison.getMonth());
}

function countInclusiveDays(start: number, end: number) {
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1).toLocaleString();
}

const overallHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14,
  flexWrap: "wrap", marginBottom: 12,
};
const overallRangeStyle: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const durationToolbarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16,
  padding: "12px 14px", borderRadius: 15, background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
};
const durationLabelStyle: React.CSSProperties = {
  color: "var(--app-muted)", fontSize: 12, fontWeight: 850, letterSpacing: ".05em", textTransform: "uppercase",
};
const overallRangeButtonStyle: React.CSSProperties = {
  minHeight: 38, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 800,
  color: "var(--app-heading)", background: "var(--app-secondary-bg)", border: "1px solid var(--app-border-soft)",
};
const overallRangeActiveStyle: React.CSSProperties = {
  ...overallRangeButtonStyle, color: "#fff", background: "linear-gradient(135deg,#4f7cff,#41c7f4)",
  boxShadow: "0 10px 24px rgba(59,130,246,.22)",
};
const overallSummaryGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12,
};
const overallMetricStyle: React.CSSProperties = {
  padding: 16, borderRadius: 17, background: "var(--app-card-solid-bg)", border: "1px solid var(--app-border-soft)",
};
const overallMetricLabelStyle: React.CSSProperties = {
  color: "var(--app-muted)", fontSize: 11, fontWeight: 850, letterSpacing: ".07em", textTransform: "uppercase",
};
const overallMetricValueStyle: React.CSSProperties = { marginTop: 9, fontSize: 27, fontWeight: 850 };
