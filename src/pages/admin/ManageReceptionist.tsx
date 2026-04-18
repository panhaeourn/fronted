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

  const activeCodes = codes.filter(
    (item) => !item.used && new Date(item.expiresAt) >= new Date()
  );

  const receiptHistoryByReceptionist = useMemo(
    () => groupReceiptsByReceptionistDay(paymentRows),
    [paymentRows]
  );

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
