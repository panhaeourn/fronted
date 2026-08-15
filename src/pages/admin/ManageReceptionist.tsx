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

  const activeCodes = codes.filter(
    (item) => !item.used && new Date(item.expiresAt) >= new Date()
  );

  const receiptHistoryByReceptionist = useMemo(
    () => groupReceiptsByReceptionistDay(paymentRows),
    [paymentRows]
  );

  const overallSummary = useMemo(() => {
    const now = new Date();
    const days = [...receiptHistoryByReceptionist.values()].flat().filter((day) => {
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
      receptionists: [...receiptHistoryByReceptionist.values()].filter((history) =>
        history.some((day) => days.includes(day))
      ).length,
    };
  }, [appliedCustomFrom, appliedCustomTo, overallRange, receiptHistoryByReceptionist]);

  const customRangeInvalid = Boolean(customFrom && customTo && customFrom > customTo);
  const customRangeReady = Boolean(customFrom && customTo && !customRangeInvalid);

  function applyCustomRange() {
    if (!customRangeReady) return;
    setAppliedCustomFrom(customFrom);
    setAppliedCustomTo(customTo);
  }

  function resetCustomRange() {
    setCustomFrom("");
    setCustomTo("");
    setAppliedCustomFrom("");
    setAppliedCustomTo("");
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
              onClick={() => setOverallRange("CUSTOM")}
              style={overallRange === "CUSTOM" ? overallRangeActiveStyle : overallRangeButtonStyle}
            >
              Custom
            </button>
          </div>
          {overallRange === "CUSTOM" && (
            <div style={customRangeControlsStyle}>
              <label style={customDateLabelStyle}>
                <span>From</span>
                <input type="date" max={customTo || undefined} value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} style={customDateInputStyle} />
              </label>
              <div aria-hidden="true" style={dateArrowStyle}>→</div>
              <label style={customDateLabelStyle}>
                <span>To</span>
                <input type="date" min={customFrom || undefined} value={customTo} onChange={(event) => setCustomTo(event.target.value)} style={customDateInputStyle} />
              </label>
              <button
                type="button"
                disabled={!customRangeReady}
                onClick={applyCustomRange}
                style={{ ...applyRangeButtonStyle, opacity: customRangeReady ? 1 : 0.5, cursor: customRangeReady ? "pointer" : "not-allowed" }}
              >
                Apply
              </button>
              {(customFrom || customTo || appliedCustomFrom || appliedCustomTo) && (
                <button type="button" onClick={resetCustomRange} style={resetRangeButtonStyle}>Reset</button>
              )}
            </div>
          )}
          {overallRange === "CUSTOM" && customRangeInvalid && (
            <div style={customRangeErrorStyle}>End date must be on or after the start date.</div>
          )}
        </div>

        {overallRange === "CUSTOM" && !customRangeInvalid && appliedCustomFrom && appliedCustomTo && (
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
                allDays={receiptHistoryByReceptionist.get(user.email.trim().toLowerCase()) || []}
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
const customRangeControlsStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginLeft: "auto",
};
const customDateLabelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7,
  color: "var(--app-muted)", fontSize: 12, fontWeight: 800,
};
const customDateInputStyle: React.CSSProperties = {
  width: 150, minHeight: 40, boxSizing: "border-box", padding: "7px 10px", borderRadius: 10, color: "var(--app-heading)",
  background: "var(--app-input-bg)", border: "1px solid var(--app-input-border)", fontWeight: 700,
};
const dateArrowStyle: React.CSSProperties = { color: "var(--app-muted)", fontWeight: 900 };
const applyRangeButtonStyle: React.CSSProperties = {
  minHeight: 42, padding: "9px 20px", border: 0, borderRadius: 11, color: "#fff", fontWeight: 850,
  background: "linear-gradient(135deg,#4f7cff,#41c7f4)", boxShadow: "0 9px 20px rgba(59,130,246,.2)",
};
const resetRangeButtonStyle: React.CSSProperties = {
  minHeight: 42, padding: "9px 16px", borderRadius: 11, cursor: "pointer", fontWeight: 800,
  color: "var(--app-heading)", background: "transparent", border: "1px solid var(--app-border-soft)",
};
const customRangeErrorStyle: React.CSSProperties = { flexBasis: "100%", color: "#ef4444", fontSize: 12, fontWeight: 750 };
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
