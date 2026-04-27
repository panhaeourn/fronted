import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";

type ForgotPasswordResponse = {
  message?: string;
  debugResetUrl?: string | null;
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [debugResetUrl, setDebugResetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setMessage("");
    setDebugResetUrl("");

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      setMessage(
        response.message ||
          "If an account with that email exists, a reset link has been prepared."
      );
      setDebugResetUrl(response.debugResetUrl || "");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare a reset link right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div style={eyebrowStyle}>Account Recovery</div>
            <h2 style={titleStyle}>Forgot Password</h2>
            <p style={subtitleStyle}>
              Enter your email address and we will prepare a reset link for your account.
            </p>
          </div>

          <div style={stackStyle}>
            <label style={labelStyle}>Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />

            <button onClick={submit} disabled={submitting} style={primaryButtonStyle}>
              {submitting ? "Preparing link..." : "Send reset link"}
            </button>

            {message && <div style={messageStyle}>{message}</div>}

            {debugResetUrl && (
              <div style={debugCardStyle}>
                <div style={debugTitleStyle}>Local debug link</div>
                <a href={debugResetUrl} style={debugLinkStyle}>
                  {debugResetUrl}
                </a>
              </div>
            )}

            <div style={footerRowStyle}>
              <span style={footerMutedStyle}>Remembered your password?</span>
              <Link to="/login" style={footerLinkStyle}>
                Back to login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100%",
  padding: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--app-heading)",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  borderRadius: 28,
  padding: 30,
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

const headerStyle: CSSProperties = {
  marginBottom: 20,
};

const eyebrowStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 27,
};

const subtitleStyle: CSSProperties = {
  color: "var(--app-subtle-text)",
  margin: "10px 0 0",
  lineHeight: 1.7,
};

const stackStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const labelStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

const primaryButtonStyle: CSSProperties = {
  marginTop: 6,
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  padding: "13px 18px",
  borderRadius: 16,
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.24)",
};

const messageStyle: CSSProperties = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 14,
  color: "var(--app-heading)",
  background: "var(--app-panel-bg)",
  border: "1px solid var(--app-border-soft)",
};

const debugCardStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(96, 165, 250, 0.12)",
  border: "1px solid rgba(96, 165, 250, 0.22)",
  display: "grid",
  gap: 8,
};

const debugTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--app-muted-strong)",
};

const debugLinkStyle: CSSProperties = {
  color: "var(--app-accent-soft)",
  wordBreak: "break-all",
};

const footerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: 8,
};

const footerMutedStyle: CSSProperties = {
  color: "var(--app-muted)",
};

const footerLinkStyle: CSSProperties = {
  color: "var(--app-accent-soft)",
  textDecoration: "none",
  fontWeight: 700,
};
