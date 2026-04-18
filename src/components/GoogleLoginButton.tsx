import { API_BASE } from "../api";

export default function GoogleLoginButton() {
  return (
    <button
      onClick={() => (window.location.href = `${API_BASE}/oauth2/authorization/google`)}
      style={buttonStyle}
    >
      <span style={iconWrapStyle}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.9-4 2.9-7 0-.7-.1-1.5-.2-2.2H12z"
          />
          <path
            fill="#34A853"
            d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2l-3.1 2.4C4.9 18.7 8.2 21 12 21z"
          />
          <path
            fill="#4A90E2"
            d="M6.4 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.3 6.6C2.5 8.1 2 9.9 2 11.8s.5 3.7 1.3 5.2L6.4 13z"
          />
          <path
            fill="#FBBC05"
            d="M12 6.2c1.4 0 2.7.5 3.6 1.4l2.7-2.7C16.8 3.6 14.6 2.7 12 2.7c-3.8 0-7.1 2.3-8.7 5.6L6.4 10C7.2 7.9 9.4 6.2 12 6.2z"
          />
        </svg>
      </span>

      <span style={labelStyle}>Continue with Google</span>
    </button>
  );
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "13px 18px",
  borderRadius: 16,
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.24)",
};

const iconWrapStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--app-input-bg)",
  boxShadow: "var(--app-glow-soft)",
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  lineHeight: 1,
};
