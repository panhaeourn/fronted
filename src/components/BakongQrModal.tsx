import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { apiFetch } from "../api";
import {
  type BakongPaymentStatusResponse,
  type BakongQrResponse,
} from "../lib/domain-types";
import { getErrorMessage } from "../lib/errors";

type Props = {
  open: boolean;
  courseId: number | null;
  amount: number;
  onClose: () => void;
  onPaid: () => void;
};

export default function BakongQrModal({
  open,
  courseId,
  amount,
  onClose,
  onPaid,
}: Props) {
  const [qrImg, setQrImg] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const pollRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  function clearAllTimers() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    if (!open || !courseId) return;

    let cancelled = false;

    clearAllTimers();
    setQrImg("");
    setTransactionId("");
    setRemainingSeconds(0);
    setErr("");

    (async () => {
      try {
        setLoading(true);

        const res = await apiFetch<BakongQrResponse>("/api/bakong/course-payment", {
          method: "POST",
          body: JSON.stringify({
            courseId,
            amount,
          }),
        });

        console.log("Bakong course-payment response:", res);

        if (res?.alreadyUnlocked) {
          if (!cancelled) {
            onPaid();
            onClose();
          }
          return;
        }

        const payload =
          res?.qr ||
          res?.data?.qr ||
          res?.data?.payload ||
          res?.data?.khqr;

        const txId = res?.transactionId || res?.data?.transactionId || "";
        const secs = Number(
          res?.remainingSeconds || res?.data?.remainingSeconds || 180
        );

        if (!payload) {
          throw new Error(res?.message || "Failed to generate QR payload");
        }

        if (!txId) {
          throw new Error("Missing transactionId from backend");
        }

        const img = await QRCode.toDataURL(payload);

        if (cancelled) return;

        setQrImg(img);
        setTransactionId(txId);
        setRemainingSeconds(secs);
      } catch (error: unknown) {
        if (!cancelled) {
          setErr(getErrorMessage(error, "Failed to generate QR"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearAllTimers();
    };
  }, [open, courseId, amount, onClose, onPaid]);

  useEffect(() => {
    if (!open || !transactionId) return;
    if (remainingSeconds <= 0) return;

    clearAllTimers();

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollRef.current = window.setInterval(async () => {
      try {
        console.log("Polling payment-status for:", transactionId);
        setChecking(true);

        const res = await apiFetch<BakongPaymentStatusResponse>(
          `/api/bakong/payment-status/${transactionId}`
        );

        console.log("Bakong payment-status response:", res);

        const paid =
          res?.paid === true ||
          res?.unlocked === true ||
          res?.status === "PAID";

        const expired = res?.status === "EXPIRED";

        if (paid) {
          clearAllTimers();
          setChecking(false);
          onPaid();
          onClose();
          return;
        }

        if (expired) {
          clearAllTimers();
          setChecking(false);
          setErr("QR expired. Please click Buy again.");
          return;
        }
      } catch (error: unknown) {
        console.error("payment-status polling error:", getErrorMessage(error));
      } finally {
        setChecking(false);
      }
    }, 3000);

    return () => {
      clearAllTimers();
    };
  }, [open, transactionId, onPaid, onClose]);

  useEffect(() => {
    if (remainingSeconds <= 0 && transactionId) {
      clearAllTimers();
    }
  }, [remainingSeconds, transactionId]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--app-overlay-bg)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 430,
          maxWidth: "92vw",
          borderRadius: 34,
          overflow: "hidden",
          background: "#f3f4f6",
          boxShadow: "var(--app-panel-shadow)",
          color: "var(--app-heading)",
          padding: 22,
        }}
      >
        <div
          style={{
            borderRadius: 30,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 22px 50px rgba(15, 23, 42, 0.16)",
          }}
        >
          <div
            style={{
              background: "#df3527",
              color: "#ffffff",
              padding: "22px 28px 18px",
              position: "relative",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              KHQR
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: -1,
                width: 0,
                height: 0,
                borderLeft: "42px solid transparent",
                borderTop: "42px solid #ffffff",
              }}
            />
          </div>

          <div style={{ padding: "22px 28px 26px" }}>
            <div style={{ fontSize: 15, color: "#1f2937", marginBottom: 10 }}>
              CITO Payment
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 800 }}>
                {Number(amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={{ fontSize: 20, color: "#374151" }}>USD</div>
            </div>

            <div
              style={{
                borderTop: "2px dashed #c5cad3",
                marginBottom: 24,
              }}
            />

            {loading && (
              <div style={{ padding: "28px 0", textAlign: "center", color: "var(--app-muted-strong)" }}>
                Generating QR...
              </div>
            )}

            {!loading && err && (
              <div
                style={{
                  marginBottom: 18,
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: "var(--app-danger-bg)",
                  color: "var(--app-danger-text)",
                  textAlign: "center",
                }}
              >
                {err}
              </div>
            )}

            {!loading && !err && qrImg && (
              <>
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 22,
                    padding: 14,
                    boxShadow: "0 16px 30px rgba(15, 23, 42, 0.08)",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={qrImg}
                    alt="Bakong QR"
                    style={{ width: 260, height: 260, objectFit: "contain" }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: "#f8fafc",
                    textAlign: "center",
                    color: remainingSeconds > 0 ? "#111827" : "#b91c1c",
                    fontWeight: 700,
                  }}
                >
                  Remaining: {Math.floor(remainingSeconds / 60)}:
                  {String(remainingSeconds % 60).padStart(2, "0")}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    textAlign: "center",
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  {checking ? "Checking payment automatically..." : "Waiting for payment..."}
                </div>
              </>
            )}

            <div
              style={{
                marginTop: 22,
                display: "flex",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  clearAllTimers();
                  onClose();
                }}
                style={{
                  minHeight: 44,
                  padding: "10px 18px",
                  borderRadius: 14,
                  border: "1px solid var(--app-secondary-border)",
                  background: "var(--app-secondary-bg)",
                  color: "var(--app-secondary-text)",
                  fontWeight: 700,
                  boxShadow: "var(--app-glow-soft)",
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div
            style={{
              padding: "14px 28px 2px",
              display: "flex",
              justifyContent: "center",
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            Secure KHQR payment preview
          </div>
        </div>
      </div>
    </div>
  );
}
