import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { apiFetch } from "../../api";
import {
  ensureFirebaseRecaptchaConfig,
  firebaseAuth,
  isFirebasePhoneAuthConfigured,
} from "../../lib/firebase";

type ForgotPasswordResponse = {
  message?: string;
  debugResetUrl?: string | null;
  maskedPhoneNumber?: string | null;
  channel?: string | null;
  resolvedPhoneNumber?: string | null;
};

const FIREBASE_IDENTIFIER_KEY = "password_reset_identifier";
const FIREBASE_PHONE_KEY = "password_reset_phone";
const FIREBASE_VERIFICATION_ID_KEY = "password_reset_verification_id";

type FirebaseAuthError = Error & {
  code?: string;
};

type ResetChannel = "FIREBASE" | "EMAIL" | null;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [debugResetUrl, setDebugResetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetChannel, setResetChannel] = useState<ResetChannel>(null);
  const [maskedPhoneNumber, setMaskedPhoneNumber] = useState("");
  const [recaptchaMountKey, setRecaptchaMountKey] = useState(0);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  const trimmedIdentifier = identifier.trim();
  const isEmailIdentifier = trimmedIdentifier.includes("@");

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      recaptchaWidgetIdRef.current = null;
    };
  }, []);

  function clearRecaptchaContainer() {
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = "";
    }
  }

  function remountRecaptchaContainer() {
    clearRecaptchaContainer();
    setRecaptchaMountKey((current) => current + 1);
  }

  function clearFirebaseResetState() {
    sessionStorage.removeItem(FIREBASE_IDENTIFIER_KEY);
    sessionStorage.removeItem(FIREBASE_PHONE_KEY);
    sessionStorage.removeItem(FIREBASE_VERIFICATION_ID_KEY);
  }

  async function resetRecaptchaVerifier() {
    const verifier = recaptchaRef.current;
    if (!verifier) {
      return;
    }

    try {
      const grecaptcha = (
        window as typeof window & {
          grecaptcha?: { reset: (widgetId?: number) => void };
        }
      ).grecaptcha;

      if (recaptchaWidgetIdRef.current !== null) {
        grecaptcha?.reset(recaptchaWidgetIdRef.current);
      }
    } catch {
      // Fall back to recreating the verifier below.
    }

    verifier.clear();
    recaptchaRef.current = null;
    recaptchaWidgetIdRef.current = null;
    remountRecaptchaContainer();
  }

  async function getRecaptchaVerifier() {
    if (!isFirebasePhoneAuthConfigured()) {
      throw new Error("Firebase phone authentication is not configured yet.");
    }

    await ensureFirebaseRecaptchaConfig();

    if (!recaptchaRef.current) {
      if (!recaptchaContainerRef.current) {
        throw new Error("reCAPTCHA container is not ready yet. Please try again.");
      }

      clearRecaptchaContainer();

      const recaptchaSize =
        typeof window !== "undefined" && window.location.hostname === "localhost"
          ? "normal"
          : "invisible";

      recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaContainerRef.current, {
        size: recaptchaSize,
      });
      recaptchaWidgetIdRef.current = await recaptchaRef.current.render();
    }

    return recaptchaRef.current;
  }

  function persistFirebaseResetState(
    nextIdentifier: string,
    resolvedPhoneNumber: string,
    confirmationResult: ConfirmationResult
  ) {
    sessionStorage.setItem(FIREBASE_IDENTIFIER_KEY, nextIdentifier);
    sessionStorage.setItem(FIREBASE_PHONE_KEY, resolvedPhoneNumber);
    sessionStorage.setItem(FIREBASE_VERIFICATION_ID_KEY, confirmationResult.verificationId);
  }

  function describeFirebaseError(error: unknown) {
    const authError = error as FirebaseAuthError;
    const code = authError?.code || "";
    const currentOrigin =
      typeof window === "undefined" ? "" : window.location.origin;
    const currentHost =
      typeof window === "undefined" ? "" : window.location.hostname;

    if (
      code === "auth/invalid-app-credential" ||
      code === "auth/captcha-check-failed" ||
      code === "auth/unauthorized-domain"
    ) {
      const hostHint = currentOrigin
        ? ` Current origin: ${currentOrigin}.`
        : "";
      const domainHint = currentHost
        ? ` Make sure ${currentHost} is listed in Firebase Authentication > Settings > Authorized domains.`
        : "";

      return (
        "Firebase phone verification could not start." +
        hostHint +
        " For local testing, open the app from http://localhost:5173 instead of http://127.0.0.1:5173 if possible." +
        domainHint
      );
    }

    if (code === "auth/operation-not-allowed") {
      return "Firebase Phone sign-in is disabled. Enable Phone in Firebase Authentication > Sign-in method.";
    }

    if (code === "auth/invalid-phone-number") {
      return "The registered phone number is not in a valid international format.";
    }

    return authError instanceof Error
      ? authError.message
      : "Unable to send the verification code right now.";
  }

  function getSuccessMessage(response: ForgotPasswordResponse) {
    if (response.channel === "FIREBASE") {
      return (
        response.message ||
        "The registered phone number is ready for Firebase OTP verification."
      );
    }

    if (response.channel === "EMAIL") {
      if (response.debugResetUrl) {
        return "A local reset link has been prepared for this account.";
      }

      return "SMS verification is not available for this account yet. Try again with the registered phone number or contact support.";
    }

    return (
      response.message ||
      "If an account with that email or phone number exists, a verification code has been sent."
    );
  }

  async function submit() {
    setMessage("");
    setDebugResetUrl("");
    setResetChannel(null);
    setMaskedPhoneNumber("");

    if (!trimmedIdentifier) {
      setMessage("Email or phone number is required.");
      return;
    }

    try {
      setSubmitting(true);
      clearFirebaseResetState();
      const response = await apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(
          isEmailIdentifier
            ? { email: trimmedIdentifier }
            : { phoneNumber: trimmedIdentifier }
        ),
      });

      if (response.channel === "FIREBASE" && response.resolvedPhoneNumber) {
        const verifier = await getRecaptchaVerifier();
        const confirmationResult = await signInWithPhoneNumber(
          firebaseAuth,
          response.resolvedPhoneNumber,
          verifier
        );

        persistFirebaseResetState(
          trimmedIdentifier,
          response.resolvedPhoneNumber,
          confirmationResult
        );
        setResetChannel("FIREBASE");
        setMaskedPhoneNumber(response.maskedPhoneNumber || "");
        navigate(`/reset-password?identifier=${encodeURIComponent(trimmedIdentifier)}`);
      } else {
        setResetChannel("EMAIL");
      }

      setMessage(getSuccessMessage(response));
      setDebugResetUrl(response.debugResetUrl || "");
    } catch (error: unknown) {
      clearFirebaseResetState();
      setResetChannel(null);
      setMaskedPhoneNumber("");
      await resetRecaptchaVerifier();
      setMessage(describeFirebaseError(error));
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
              Enter the email or phone number linked to your account and we will send a
              verification code by SMS to the registered phone number.
            </p>
          </div>

          <div style={stackStyle}>
            <label style={labelStyle}>Email or phone number</label>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com or +85512345678"
              style={inputStyle}
            />

            <button onClick={submit} disabled={submitting} style={primaryButtonStyle}>
              {submitting ? "Sending code..." : "Send verification code"}
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

            {resetChannel === "FIREBASE" ? (
              <div style={footerRowStyle}>
                <span style={footerMutedStyle}>
                  {maskedPhoneNumber
                    ? `Code will be sent to ${maskedPhoneNumber}`
                    : "Already received a code?"}
                </span>
                <Link
                  to={`/reset-password?identifier=${encodeURIComponent(trimmedIdentifier)}`}
                  style={footerLinkStyle}
                >
                  Verify and reset
                </Link>
              </div>
            ) : (
              <div style={footerRowStyle}>
                <span style={footerMutedStyle}>
                  SMS verification will appear here only after Firebase OTP starts.
                </span>
              </div>
            )}

            <div
              key={recaptchaMountKey}
              id="firebase-recaptcha"
              ref={recaptchaContainerRef}
            />
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
