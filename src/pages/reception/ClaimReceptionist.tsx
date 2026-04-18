import { useState } from "react";
import { apiFetch } from "../../api";
import type { ClaimReceptionistResponse } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";

export default function ClaimReceptionist() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async () => {
    setMsg("");
    setErr("");

    try {
      const res = await apiFetch<ClaimReceptionistResponse>("/api/auth/claim-receptionist", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      setMsg(`Upgraded successfully. New role: ${res.role}`);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to claim receptionist"));
    }
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 560,
        margin: "0 auto",
        color: "var(--app-heading)",
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background: "var(--app-panel-bg)",
          border: "var(--app-panel-border)",
          boxShadow: "var(--app-panel-shadow)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Claim Receptionist</h1>
        <p style={{ color: "var(--app-subtle-text)", marginBottom: 16 }}>
          Enter receptionist secret code
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: 12,
            borderRadius: 14,
            border: "1px solid var(--app-input-border)",
            background: "var(--app-input-bg)",
            color: "var(--app-input-text)",
            boxSizing: "border-box",
            boxShadow: "var(--app-glow-soft)",
          }}
        />

        <button
          onClick={onSubmit}
          style={{
            border: "1px solid rgba(191, 219, 254, 0.28)",
            background:
              "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 14,
            fontWeight: 700,
            boxShadow:
              "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.24)",
          }}
        >
          Submit
        </button>

        {msg && (
          <p
            style={{
              color: "var(--app-success-text)",
              background: "var(--app-success-bg)",
              border: "1px solid var(--app-success-border)",
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 14,
            }}
          >
            {msg}
          </p>
        )}
        {err && (
          <p
            style={{
              color: "var(--app-danger-text)",
              background: "var(--app-danger-bg)",
              border: "1px solid var(--app-danger-border)",
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 14,
            }}
          >
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
