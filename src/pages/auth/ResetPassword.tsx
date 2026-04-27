import { useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";

type ResetPasswordResponse = {
  message?: string;
};

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token")?.trim() || "",
    [location.search]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setMessage("");

    if (!token) {
      setMessage("Reset token is missing. Please use the latest reset link.");
      return;
    }

    if (password.trim().length < 8) {
      setMessage("New password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiFetch<ResetPasswordResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      setSuccess(true);
      setMessage(response.message || "Password reset successful. Redirecting to login...");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error: unknown) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset password right now."
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
            <h2 style={titleStyle}>Reset Password</h2>
            <p style={subtitleStyle}>
              Choose a new password for your account. Use at least 8 characters.
            </p>
          </div>

          <div style={stackStyle}>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
            />

            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              style={inputStyle}
            />

            <button onClick={submit} disabled={submitting} style={primaryButtonStyle}>
              {submitting ? "Resetting..." : "Reset password"}
            </button>

            {message && (
              <div
                style={{
                  ...messageStyle,
                  color: success ? "var(--app-success-text)" : "var(--app-danger-text)",
                  background: success ? "var(--app-success-bg)" : "var(--app-danger-bg)",
                  borderColor: success
                    ? "var(--app-success-border)"
                    : "var(--app-danger-border)",
                }}
              >
                {message}
              </div>
            )}

            <div style={footerRowStyle}>
              <span style={footerMutedStyle}>Need another reset link?</span>
              <Link to="/forgot-password" style={footerLinkStyle}>
                Request again
              </Link>
            </div>

            <div style={footerRowStyle}>
              <span style={footerMutedStyle}>Already have a password?</span>
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
  border: "1px solid transparent",
};

const footerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const footerMutedStyle: CSSProperties = {
  color: "var(--app-muted)",
};

const footerLinkStyle: CSSProperties = {
  color: "var(--app-accent-soft)",
  textDecoration: "none",
  fontWeight: 700,
};
