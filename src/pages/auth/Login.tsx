import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import GoogleLoginButton from "../../components/GoogleLoginButton.js";
import { useAuth } from "../../lib/auth-context";
import { useLanguage } from "../../lib/language";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshMe } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || "/";
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauthError");
    if (oauthError) {
      setMsg(oauthError);
    }
  }, [location.search]);

  async function login() {
    setMsg("");

    if (!email.trim() || !password.trim()) {
      setMsg("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch<{ token?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      await refreshMe();
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      setMsg(error instanceof Error ? error.message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={singleShellStyle}>
        <section style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={eyebrowStyle}>{t("auth.welcomeBack")}</div>
            <h2 style={cardTitleStyle}>{t("auth.loginTitle")}</h2>
            <p style={cardTextStyle}>{t("auth.loginSubtitle")}</p>
          </div>

          <div style={formStackStyle}>
            <label style={labelStyle}>{t("auth.email")}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder={t("auth.emailPlaceholder")}
            />

            <label style={labelStyle}>{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder={t("auth.passwordPlaceholder")}
            />

            <button onClick={login} style={primaryButtonStyle} disabled={submitting}>
              {submitting ? "Signing in..." : t("auth.loginTitle")}
            </button>

            <div style={dividerStyle}>{t("auth.or")}</div>

            <GoogleLoginButton />

            {msg && (
              <div
                style={{
                  ...messageStyle,
                  color: msg.toLowerCase().includes("success")
                    ? "var(--app-success-text)"
                    : "var(--app-danger-text)",
                  background: msg.toLowerCase().includes("success")
                    ? "var(--app-success-bg)"
                    : "var(--app-danger-bg)",
                  borderColor: msg.toLowerCase().includes("success")
                    ? "var(--app-success-border)"
                    : "var(--app-danger-border)",
                }}
              >
                {msg}
              </div>
            )}

            <div style={footerRowStyle}>
              <span style={{ color: "var(--app-muted)" }}>{t("auth.needAccount")}</span>
              <Link to="/register" style={footerLinkStyle}>
                {t("auth.registerTitle")}
              </Link>
            </div>
          </div>
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

const dividerStyle: React.CSSProperties = {
  margin: "8px 0 4px",
  textAlign: "center",
  color: "var(--app-muted)",
  fontSize: 12,
  letterSpacing: 1.2,
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
