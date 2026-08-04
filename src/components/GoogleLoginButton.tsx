import { API_BASE } from "../api";
import googleIcon from "../assets/google.svg";

export default function GoogleLoginButton() {
  return (
    <button
      onClick={() => (window.location.href = `${API_BASE}/oauth2/authorization/google`)}
      style={buttonStyle}
    >
      <span style={iconWrapStyle}>
        <img src={googleIcon} alt="" aria-hidden="true" style={iconStyle} />
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
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const iconStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  display: "block",
};

const labelStyle: React.CSSProperties = {
  lineHeight: 1,
};
