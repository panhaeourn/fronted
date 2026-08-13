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
  const [overallRange, setOverallRange] = useState<RangeView>("DAY");

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
      return date.getFullYear() === now.getFullYear();
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
  }, [overallRange, receiptHistoryByReceptionist]);

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
          <div>
            <h2 style={{ ...sectionHeadingStyle, marginBottom: 4 }}>All Receptionists Income</h2>
            <div style={overallSubtitleStyle}>Combined paid income from every receptionist</div>
          </div>
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
          </div>
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

const overallHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14,
  flexWrap: "wrap", marginBottom: 16,
};
const overallSubtitleStyle: React.CSSProperties = { color: "var(--app-muted)", fontSize: 13 };
const overallRangeStyle: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
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
