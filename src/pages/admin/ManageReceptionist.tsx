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
  const [timelineDrag, setTimelineDrag] = useState<{
    clientX: number; start: number; end: number; width: number;
  } | null>(null);

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

  const timelineStart = customFrom ? dateInputToTimestamp(customFrom) : timelineBounds.min;
  const timelineEnd = customTo ? dateInputToTimestamp(customTo) : timelineBounds.max;
  const timelineSpan = Math.max(1, timelineBounds.max - timelineBounds.min);
  const selectedLeft = ((timelineStart - timelineBounds.min) / timelineSpan) * 100;
  const selectedWidth = ((timelineEnd - timelineStart) / timelineSpan) * 100;

  function openCustomTimeline() {
    const from = timestampToDateInput(timelineBounds.min);
    const to = timestampToDateInput(timelineBounds.max);
    setOverallRange("CUSTOM");
    if (!customFrom || !customTo) {
      setCustomFrom(from);
      setCustomTo(to);
      setAppliedCustomFrom(from);
      setAppliedCustomTo(to);
    }
  }

  function updateTimelineStart(value: number) {
    const next = Math.min(value, timelineEnd);
    const date = timestampToDateInput(next);
    setCustomFrom(date);
    setAppliedCustomFrom(date);
  }

  function updateTimelineEnd(value: number) {
    const next = Math.max(value, timelineStart);
    const date = timestampToDateInput(next);
    setCustomTo(date);
    setAppliedCustomTo(date);
  }

  function moveTimelineSelection(clientX: number) {
    if (!timelineDrag) return;
    const day = 86_400_000;
    const rawDelta = ((clientX - timelineDrag.clientX) / Math.max(1, timelineDrag.width)) * timelineSpan;
    let delta = Math.round(rawDelta / day) * day;
    delta = Math.max(delta, timelineBounds.min - timelineDrag.start);
    delta = Math.min(delta, timelineBounds.max - timelineDrag.end);
    const from = timestampToDateInput(timelineDrag.start + delta);
    const to = timestampToDateInput(timelineDrag.end + delta);
    setCustomFrom(from);
    setCustomTo(to);
    setAppliedCustomFrom(from);
    setAppliedCustomTo(to);
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
            <div style={timelineWrapStyle}>
              <div style={timelineHeaderStyle}>
                <div>
                  <div style={timelineTitleStyle}>Income timeline</div>
                  <div style={timelineSubtitleStyle}>Drag the handles to choose a reporting period</div>
                </div>
                <div style={timelineLegendStyle}>
                  <span style={timelineLegendItemStyle}><i style={allTimeDotStyle} />All time</span>
                  <span style={timelineLegendItemStyle}><i style={selectedDotStyle} />Selected</span>
                </div>
              </div>
              <div style={timelineDateRowStyle}>
                <span>{formatShortDate(timestampToDateInput(timelineBounds.min))}</span>
                <strong style={selectedDatePillStyle}>{formatShortDate(customFrom)} {"–"} {formatShortDate(customTo)}</strong>
                <span style={{ textAlign: "right" }}>{formatShortDate(timestampToDateInput(timelineBounds.max))}</span>
              </div>
              <div style={timelineTrackWrapStyle}>
                <div style={timelineTrackStyle} />
                <div
                  style={{ ...timelineSelectionStyle, left: `${selectedLeft}%`, width: `${selectedWidth}%` }}
                  title="Drag to move the selected duration"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setTimelineDrag({
                      clientX: event.clientX,
                      start: timelineStart,
                      end: timelineEnd,
                      width: event.currentTarget.parentElement?.getBoundingClientRect().width || 1,
                    });
                  }}
                  onPointerMove={(event) => moveTimelineSelection(event.clientX)}
                  onPointerUp={() => setTimelineDrag(null)}
                  onPointerCancel={() => setTimelineDrag(null)}
                />
                <input
                  className="income-timeline-range"
                  aria-label="Income range start date"
                  type="range"
                  min={timelineBounds.min}
                  max={timelineBounds.max}
                  step={86_400_000}
                  value={timelineStart}
                  style={{ zIndex: timelineStart >= timelineEnd ? 5 : 4 }}
                  onChange={(event) => updateTimelineStart(Number(event.target.value))}
                />
                <input
                  className="income-timeline-range"
                  aria-label="Income range end date"
                  type="range"
                  min={timelineBounds.min}
                  max={timelineBounds.max}
                  step={86_400_000}
                  value={timelineEnd}
                  style={{ zIndex: 3 }}
                  onChange={(event) => updateTimelineEnd(Number(event.target.value))}
                />
              </div>
              <div style={timelineFooterStyle}>
                <span>Earliest income</span>
                <span>{countInclusiveDays(timelineStart, timelineEnd)} day period · drag green bar to move</span>
                <span style={{ textAlign: "right" }}>Today</span>
              </div>
            </div>
          )}
        </div>

        {overallRange === "CUSTOM" && appliedCustomFrom && appliedCustomTo && (
          <div style={appliedRangeStyle}>All income from {formatShortDate(appliedCustomFrom)} to {formatShortDate(appliedCustomTo)}</div>
        )}

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
const timelineWrapStyle: React.CSSProperties = {
  flexBasis: "100%", display: "grid", gap: 11, padding: "14px 16px 12px", borderRadius: 14,
  background: "linear-gradient(135deg,rgba(79,124,255,.08),rgba(65,199,244,.04))",
  border: "1px solid rgba(96,165,250,.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.45)",
};
const timelineHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
};
const timelineTitleStyle: React.CSSProperties = { color: "var(--app-heading)", fontSize: 13, fontWeight: 850 };
const timelineSubtitleStyle: React.CSSProperties = { marginTop: 2, color: "var(--app-muted)", fontSize: 11 };
const timelineLegendStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 };
const timelineLegendItemStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, color: "var(--app-muted)", fontSize: 10, fontWeight: 750,
};
const allTimeDotStyle: React.CSSProperties = { width: 9, height: 4, borderRadius: 99, background: "#172033" };
const selectedDotStyle: React.CSSProperties = {
  width: 9, height: 4, borderRadius: 99, background: "linear-gradient(90deg,#4f7cff,#22c55e)",
};
const timelineDateRowStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center",
  color: "var(--app-muted)", fontSize: 11, fontWeight: 750,
};
const selectedDatePillStyle: React.CSSProperties = {
  padding: "6px 11px", borderRadius: 999, color: "#2563eb", background: "rgba(59,130,246,.11)",
  border: "1px solid rgba(59,130,246,.16)", fontSize: 11, whiteSpace: "nowrap",
};
const timelineTrackWrapStyle: React.CSSProperties = { position: "relative", height: 42, margin: "0 13px" };
const timelineTrackStyle: React.CSSProperties = {
  position: "absolute", top: 18, left: 0, right: 0, height: 7, borderRadius: 999,
  background: "repeating-linear-gradient(90deg,#172033 0,#172033 calc(10% - 1px),#334155 calc(10% - 1px),#334155 10%)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,.35)",
};
const timelineSelectionStyle: React.CSSProperties = {
  position: "absolute", zIndex: 2, top: 14, height: 15, borderRadius: 999, cursor: "grab", touchAction: "none",
  background: "linear-gradient(90deg,#4f7cff,#41c7f4 48%,#22c55e)",
  boxShadow: "0 4px 13px rgba(59,130,246,.27),0 0 0 3px rgba(65,199,244,.1)",
};
const timelineFooterStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, color: "var(--app-muted)", fontSize: 10, fontWeight: 700,
};
const appliedRangeStyle: React.CSSProperties = {
  width: "fit-content", margin: "-7px 0 14px", padding: "6px 10px", borderRadius: 999, color: "#2563eb",
  background: "rgba(59,130,246,.1)", fontSize: 12, fontWeight: 800,
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
