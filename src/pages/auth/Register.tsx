import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../lib/auth-context";
import { useLanguage } from "../../lib/language";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      setMsg("All fields are required.");
      return;
    }

    if (password.trim().length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    setMsg(t("auth.loading"));

    try {
      setSubmitting(true);
      await apiFetch<unknown>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
        }),
      });

      setMsg(t("auth.registerSuccess"));
      const me = await refreshMe();
      navigate(me ? "/" : "/login", { replace: true });
    } catch (error: unknown) {
      setMsg(error instanceof Error ? error.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const success = msg === t("auth.registerSuccess");

  return (
    <div style={pageStyle}>
      <div style={singleShellStyle}>
        <section style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={eyebrowStyle}>{t("auth.joinPlatform")}</div>
            <h2 style={cardTitleStyle}>{t("auth.registerTitle")}</h2>
            <p style={cardTextStyle}>{t("auth.registerSubtitle")}</p>
          </div>

          <form onSubmit={submit} style={formStackStyle}>
            <label style={labelStyle}>{t("auth.username")}</label>
            <input
              placeholder={t("auth.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>{t("auth.email")}</label>
            <input
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>{t("auth.phone")}</label>
            <input
              placeholder={t("auth.phonePlaceholder")}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>{t("auth.password")}</label>
            <input
              type="password"
              placeholder={t("auth.createPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            <button type="submit" style={primaryButtonStyle} disabled={submitting}>
              {submitting ? "Creating..." : t("auth.registerTitle")}
            </button>

            {msg && (
              <div
                style={{
                  ...messageStyle,
                  color: success ? "var(--app-success-text)" : "var(--app-danger-text)",
                  background: success
                    ? "var(--app-success-bg)"
                    : "var(--app-danger-bg)",
                  borderColor: success
                    ? "var(--app-success-border)"
                    : "var(--app-danger-border)",
                }}
              >
                {msg}
              </div>
            )}

            <div style={footerRowStyle}>
              <span style={{ color: "var(--app-muted)" }}>{t("auth.haveAccount")}</span>
              <Link to="/login" style={footerLinkStyle}>
                {t("auth.loginTitle")}
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100%",
  padding: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--app-heading)",
};

const singleShellStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  margin: "0 auto",
};

const formCardStyle: React.CSSProperties = {
  borderRadius: 28,
  padding: 30,
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: 20,
};

const cardTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 27,
};

const cardTextStyle: React.CSSProperties = {
  color: "var(--app-subtle-text)",
  margin: "10px 0 0",
  lineHeight: 1.7,
};

const formStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

const primaryButtonStyle: React.CSSProperties = {
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

const messageStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid transparent",
};

const footerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: 8,
};

const footerLinkStyle: React.CSSProperties = {
  color: "var(--app-accent-soft)",
  textDecoration: "none",
  fontWeight: 700,
};
