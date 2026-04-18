import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { apiFetch } from "../../api";
import citoLogo from "../../assets/CITO.svg";
import type { ReceiptRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";

export default function CitoReceiptPrint() {
  const { id } = useParams();
  const [data, setData] = useState<ReceiptRecord | null>(null);
  const [qrSrc, setQrSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");
        const res = await apiFetch<ReceiptRecord>(`/api/reception/receipts/${id}`);
        if (ignore) return;
        setData(res);
      } catch (error: unknown) {
        if (!ignore) setErr(getErrorMessage(error, "Failed to load receipt"));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function buildQr() {
      if (!data) return;

      if (data.qrImage) {
        setQrSrc(data.qrImage);
        return;
      }

      if (data.qrText) {
        try {
          const url = await QRCode.toDataURL(data.qrText, {
            width: 160,
            margin: 1,
          });
          if (active) setQrSrc(url);
        } catch {
          if (active) setQrSrc("");
        }
      } else {
        setQrSrc("");
      }
    }

    buildQr();

    return () => {
      active = false;
    };
  }, [data]);

  useEffect(() => {
    if (!data?.id) return;
    if (!data?.bakongTranId) return;
    if (data.paymentStatus === "Paid") return;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch<ReceiptRecord>(
          `/api/reception/receipts/${data.id}/payment-status`
        );
        setData(res);
      } catch {
        // ignore temporary polling errors
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [data?.id, data?.bakongTranId, data?.paymentStatus]);

  const createdDate = useMemo(() => {
    if (!data?.createdAt) return "-";
    const d = new Date(data.createdAt);
    if (Number.isNaN(d.getTime())) return data.createdAt;
    return d.toLocaleString();
  }, [data]);

  const onPrint = () => window.print();
  const receiptTypeLabel = (data?.receiptType || "COURSE").toUpperCase() === "MONTHLY" ? "Monthly" : "Course";
  const itemLabel = receiptTypeLabel === "Monthly" ? "Monthly Name" : "Course Name";
  const priceLabel = receiptTypeLabel === "Monthly" ? "Monthly Price" : "Course Price";
  const displayStudentId = data?.studentCode || data?.studentId || "-";

  if (loading) {
    return <div style={styles.screenWrap}>Loading receipt...</div>;
  }

  if (err || !data) {
    return (
      <div style={styles.screenWrap}>
        <div style={styles.toolbar} className="no-print">
          <Link to="/reception/receipts" style={styles.linkBtn}>
            Back
          </Link>
        </div>
        <div style={styles.paper}>
          <h2 style={{ marginTop: 0 }}>Receipt not found</h2>
          <p>{err || "No data"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{printCss}</style>

      <div style={styles.screenWrap}>
        <div style={styles.toolbar} className="no-print">
          <Link to="/reception/receipts" style={styles.linkBtn}>
            Back to list
          </Link>

          <button onClick={onPrint} style={styles.primaryBtn}>
            Download PDF
          </button>
        </div>

        <div style={styles.paper} className="print-page">
          <div style={styles.headerTop}>
            <div>
              <div style={styles.logoBox}>
                <img src={citoLogo} alt="CITO" style={styles.logoImage} />
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={styles.receiptTitle}>PAYMENT RECEIPT</div>
              <div style={styles.metaText}>
                Generate By: {data.createdByReceptionistName || data.createdByReceptionist || "-"}
              </div>
              <div style={styles.metaText}>Date: {createdDate}</div>
              <div
                style={{
                  ...styles.metaText,
                  color: data.paymentStatus === "Paid" ? "#166534" : "#92400e",
                  fontWeight: 700,
                }}
              >
                Status: {data.paymentStatus || "Pending"}
              </div>
            </div>
          </div>

          <div style={styles.centerTitle}>
            Center for Information Technology & Office
          </div>
          <div style={styles.subTitle}>
            Official Training Payment Receipt
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Student Information</div>
            <div style={styles.grid2}>
              <Info label="Student Name in English" value={data.studentNameEnglish || data.studentName} />
              <Info label="Student Name in Khmer" value={data.studentNameKhmer || data.studentName} />
              <Info label="Student ID" value={displayStudentId} />
              <Info label="Gender" value={data.gender || "-"} />
              <Info label="Contact Information" value={data.contactInfo || data.phone || data.email || "-"} />
              <Info label="Email" value={data.email || "-"} />
              <Info label="Schedule" value={data.schedule || data.address || "-"} full />
              {data.studentCode && <Info label="Receipt No" value={data.studentId || "-"} />}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Receipt & Payment Information</div>
            <div style={styles.grid2}>
              <Info label="Receipt Type" value={receiptTypeLabel} />
              <Info label={itemLabel} value={data.courseName} />
              {receiptTypeLabel === "Monthly" && (
                <Info label="Month Period" value={formatMonthlyPeriod(data.monthlyPeriod)} />
              )}
              <Info
                label="Book Price"
                value={`$${Number(data.bookPrice ?? data.totalPrice ?? 0).toFixed(2)}`}
              />
              <Info
                label={priceLabel}
                value={`$${Number(data.programPrice ?? 0).toFixed(2)}`}
              />
              <Info
                label="Total Price"
                value={`$${Number(data.totalPrice || 0).toFixed(2)}`}
              />
              <Info
                label="Payment Status"
                value={data.paymentStatus || "Pending"}
              />
              <Info
                label="Receptionist"
                value={data.createdByReceptionistName || data.createdByReceptionist || "-"}
              />
            </div>
          </div>

          <div style={styles.qrSection}>
            <div style={styles.qrLeft}>
              <div style={styles.sectionTitle}>Bakong QR Payment</div>
              <p style={styles.note}>
                This receipt confirms the enrollment record. The QR code shown is
                attached to this receipt for payment reference.
              </p>

              <div style={styles.termsBox}>
                <div style={styles.termsTitle}>Notes</div>
                <ul style={styles.ul}>
                  <li>Please keep this receipt for your records.</li>
                  <li>Present this receipt when requested by reception.</li>
                  <li>This receipt can be shown as proof for online or in-class study.</li>
                  <li>Payment verification is subject to system confirmation.</li>
                </ul>
              </div>
            </div>

            <div style={styles.qrRight}>
              <div style={styles.khqrCard}>
                <div style={styles.khqrHeader}>
                  <div style={styles.khqrHeaderText}>KHQR</div>
                  <div style={styles.khqrCorner} />
                </div>
                <div style={styles.khqrBody}>
                  <div style={styles.khqrMerchant}>CITO Payment</div>
                  <div style={styles.khqrAmountRow}>
                    <div style={styles.khqrAmount}>
                      {Number(data.totalPrice || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div style={styles.khqrCurrency}>USD</div>
                  </div>
                  <div style={styles.khqrDivider} />
                  <div style={styles.qrFrame}>
                    {qrSrc ? (
                      <img
                        src={qrSrc}
                        alt="Bakong QR"
                        style={{ width: 170, height: 170, objectFit: "contain" }}
                      />
                    ) : (
                      <div style={styles.noQr}>No QR available</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.qrCaption}>Scan for payment</div>
            </div>
          </div>

          {data.paymentStatus === "Paid" && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Payment confirmed successfully
            </div>
          )}

          <div style={styles.signatureRow}>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine} />
              <div style={styles.signatureLabel}>Receptionist Signature</div>
            </div>

            <div style={styles.signatureBox}>
              <div style={styles.signatureLine} />
              <div style={styles.signatureLabel}>Student Signature</div>
            </div>
          </div>

          <div style={styles.footer}>
            This is a system-generated receipt from CITO.
          </div>
        </div>
      </div>
    </>
  );
}

function formatMonthlyPeriod(value?: string) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Info({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div style={{ ...styles.infoCard, gridColumn: full ? "1 / -1" : undefined }}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "-"}</div>
    </div>
  );
}

const printCss = `
  @page {
    size: A4 portrait;
    margin: 6mm;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  @media print {
    html, body {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
    }

    body * {
      visibility: hidden;
    }

    .print-page, .print-page * {
      visibility: visible;
    }

    .print-page {
      position: absolute;
      left: 0;
      top: 0;
      width: 198mm !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 6mm !important;
      box-shadow: none !important;
      border: none !important;
      background: #ffffff !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .no-print {
      display: none !important;
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  screenWrap: {
    background: "#f4f6f8",
    minHeight: "100vh",
    padding: 16,
  },
  toolbar: {
    maxWidth: 860,
    margin: "0 auto 12px auto",
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  primaryBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  linkBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#111827",
    padding: "10px 16px",
    borderRadius: 8,
    fontWeight: 600,
    border: "1px solid #d1d5db",
  },
  paper: {
    width: "198mm",
    minHeight: "auto",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "8mm",
    boxSizing: "border-box",
    pageBreakInside: "avoid",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    borderBottom: "2px solid #111827",
    paddingBottom: 10,
    pageBreakInside: "avoid",
  },
  logoBox: {
    width: 128,
    height: 128,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    padding: 0,
    boxSizing: "border-box",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  metaText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 3,
  },
  centerTitle: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },
  subTitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#4b5563",
    marginTop: 4,
    marginBottom: 14,
  },
  section: {
    marginTop: 12,
    pageBreakInside: "avoid",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  infoCard: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: 10,
    background: "#fff",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    wordBreak: "break-word",
  },
  qrSection: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 16,
    alignItems: "start",
    pageBreakInside: "avoid",
  },
  qrLeft: {
    pageBreakInside: "avoid",
  },
  qrRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    pageBreakInside: "avoid",
  },
  khqrCard: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 28,
    overflow: "hidden",
    background: "#f3f4f6",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
  },
  khqrHeader: {
    background: "#df3527",
    color: "#ffffff",
    padding: "18px 20px 14px",
    position: "relative",
    textAlign: "center",
  },
  khqrHeaderText: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 1,
  },
  khqrCorner: {
    position: "absolute",
    right: 0,
    bottom: -1,
    width: 0,
    height: 0,
    borderLeft: "34px solid transparent",
    borderTop: "34px solid #ffffff",
  },
  khqrBody: {
    background: "#ffffff",
    padding: 16,
  },
  khqrMerchant: {
    fontSize: 13,
    color: "#1f2937",
    marginBottom: 8,
  },
  khqrAmountRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  khqrAmount: {
    fontSize: 26,
    fontWeight: 800,
    color: "#111827",
  },
  khqrCurrency: {
    fontSize: 17,
    color: "#374151",
  },
  khqrDivider: {
    borderTop: "2px dashed #c5cad3",
    margin: "14px 0",
  },
  qrFrame: {
    border: "none",
    borderRadius: 16,
    padding: 0,
    minWidth: 190,
    minHeight: 190,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
  },
  qrCaption: {
    marginTop: 8,
    fontWeight: 600,
    color: "#374151",
    fontSize: 13,
  },
  noQr: {
    color: "#6b7280",
    fontSize: 14,
  },
  note: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.5,
    margin: 0,
  },
  termsBox: {
    marginTop: 10,
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: 10,
    pageBreakInside: "avoid",
  },
  termsTitle: {
    fontWeight: 700,
    marginBottom: 6,
    fontSize: 14,
  },
  ul: {
    margin: 0,
    paddingLeft: 18,
    color: "#374151",
    lineHeight: 1.5,
    fontSize: 13,
  },
  signatureRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 28,
    marginTop: 24,
    pageBreakInside: "avoid",
  },
  signatureBox: {
    textAlign: "center",
  },
  signatureLine: {
    borderBottom: "1px solid #111827",
    height: 28,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: 600,
  },
  footer: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    pageBreakInside: "avoid",
  },
};
