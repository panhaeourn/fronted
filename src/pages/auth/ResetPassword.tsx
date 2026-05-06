import { useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { apiFetch } from "../../api";
import { firebaseAuth, isFirebasePhoneAuthConfigured } from "../../lib/firebase";

type ResetPasswordResponse = {
  message?: string;
};

const FIREBASE_IDENTIFIER_KEY = "password_reset_identifier";
const FIREBASE_PHONE_KEY = "password_reset_phone";
const FIREBASE_VERIFICATION_ID_KEY = "password_reset_verification_id";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = useMemo(
    () => searchParams.get("token")?.trim() || "",
    [searchParams]
  );
  const initialIdentifier = useMemo(
    () =>
      searchParams.get("identifier")?.trim() ||
      searchParams.get("phone")?.trim() ||
      "",
    [searchParams]
  );

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const isSmsFlow = !token;
  const trimmedIdentifier = identifier.trim();
  const isEmailIdentifier = trimmedIdentifier.includes("@");
  const firebaseIdentifier =
    typeof window !== "undefined" ? sessionStorage.getItem(FIREBASE_IDENTIFIER_KEY) || "" : "";
  const firebasePhoneNumber =
    typeof window !== "undefined" ? sessionStorage.getItem(FIREBASE_PHONE_KEY) || "" : "";
  const firebaseVerificationId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(FIREBASE_VERIFICATION_ID_KEY) || ""
      : "";
  const hasFirebaseResetSession =
    !!firebaseVerificationId &&
    !!firebasePhoneNumber &&
    (!firebaseIdentifier || firebaseIdentifier === trimmedIdentifier);

  function clearFirebaseResetState() {
    sessionStorage.removeItem(FIREBASE_IDENTIFIER_KEY);
    sessionStorage.removeItem(FIREBASE_PHONE_KEY);
    sessionStorage.removeItem(FIREBASE_VERIFICATION_ID_KEY);
  }

  async function submit() {
    setMessage("");

    if (isSmsFlow) {
      if (isFirebasePhoneAuthConfigured() && !hasFirebaseResetSession) {
        setMessage("SMS verification is not active for this request. Go back and request a new code first.");
        return;
      }

      if (!trimmedIdentifier) {
        setMessage("Email or phone number is required.");
        return;
      }

      if (!code.trim()) {
        setMessage("Verification code is required.");
        return;
      }

    } else if (!token) {
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
      let firebaseIdToken: string | undefined;

      if (isSmsFlow && isFirebasePhoneAuthConfigured()) {
        const credential = PhoneAuthProvider.credential(firebaseVerificationId, code.trim());
        const userCredential = await signInWithCredential(firebaseAuth, credential);
        firebaseIdToken = await userCredential.user.getIdToken();
      }

      const response = await apiFetch<ResetPasswordResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token || undefined,
          email: isSmsFlow && isEmailIdentifier ? trimmedIdentifier : undefined,
          phoneNumber: isSmsFlow && !isEmailIdentifier ? trimmedIdentifier : undefined,
          firebaseIdToken,
          newPassword: password,
        }),
      });

      setSuccess(true);
      clearFirebaseResetState();
      await signOut(firebaseAuth).catch(() => undefined);
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
              {isSmsFlow
                ? "Enter the email or phone number you used to request the SMS code, then choose a new password."
                : "Choose a new password for your account. Use at least 8 characters."}
            </p>
          </div>

          <div style={stackStyle}>
            {isSmsFlow && isFirebasePhoneAuthConfigured() && !hasFirebaseResetSession && (
              <div
                style={{
                  ...messageStyle,
                  color: "var(--app-heading)",
                  background: "var(--app-panel-bg)",
                  borderColor: "var(--app-border-soft)",
                }}
              >
                Request a new verification code from the forgot-password page before resetting your password.
              </div>
            )}

            {isSmsFlow && hasFirebaseResetSession && (
              <>
                <label style={labelStyle}>Email or phone number</label>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="you@example.com or +85512345678"
                  style={inputStyle}
                />

                <label style={labelStyle}>Verification code</label>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="6-digit code"
                  style={inputStyle}
                />
              </>
            )}

            {isSmsFlow && !hasFirebaseResetSession && (
              <div style={noticeStyle}>
                No SMS verification session is active for this request yet. Start from the forgot-password page and wait for the OTP step to appear before entering a new password here.
              </div>
            )}

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

            <button
              onClick={submit}
              disabled={submitting || (isSmsFlow && isFirebasePhoneAuthConfigured() && !hasFirebaseResetSession)}
              style={primaryButtonStyle}
            >
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

const noticeStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  color: "var(--app-heading)",
  background: "var(--app-panel-bg)",
  border: "1px solid var(--app-border-soft)",
  lineHeight: 1.6,
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
