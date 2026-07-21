import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api";
import citoLogo from "../../assets/CITO.svg";
import { getErrorMessage } from "../../lib/errors";
import "./VerifyCertificate.css";

type CertificateVerification = {
  status: "VALID" | "REVOKED";
  valid: boolean;
  verificationCode: string;
  certificateNumber: string;
  recipientNameKhmer: string;
  recipientNameEnglish: string;
  birthDate?: string | null;
  courseName: string;
  issueDate: string;
  issuedAt: string;
  revokedAt?: string | null;
};

export default function VerifyCertificate() {
  const { verificationCode = "" } = useParams();
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState(verificationCode);
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(Boolean(verificationCode));
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Verify Certificate | CITO";
    return () => {
      document.title = "CITO STUDY | AI Learning Platform";
    };
  }, []);

  useEffect(() => {
    setSearchCode(verificationCode);
    setCertificate(null);
    setError("");

    if (!verificationCode) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    apiFetch<CertificateVerification>(
      `/api/certificates/verify/${encodeURIComponent(verificationCode)}`
    )
      .then((result) => {
        if (active) setCertificate(result);
      })
      .catch((verificationError) => {
        if (active) {
          const message = getErrorMessage(verificationError, "Certificate not found.");
          setError(
            message.includes("404")
              ? "Certificate not found in the official CITO registry."
              : message
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [verificationCode]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = searchCode.trim();
    if (!code) return;
    navigate(`/verify-certificate/${encodeURIComponent(code)}`);
  }

  const state = certificate?.valid
    ? "valid"
    : certificate
      ? "revoked"
      : error
        ? "invalid"
        : "ready";

  return (
    <div className="certificate-verify-page">
      <div className="certificate-verify-grid" aria-hidden="true" />
      <div className="certificate-verify-glow certificate-verify-glow--one" />
      <div className="certificate-verify-glow certificate-verify-glow--two" />

      <main className="certificate-verify-shell">
        <header className="certificate-verify-header">
          <a className="certificate-verify-brand" href="https://cito.study/#/" aria-label="CITO home">
            <img src={citoLogo} alt="CITO" />
            <span>
              <strong>CITO</strong>
              <small>Official credential verification</small>
            </span>
          </a>
          <span className="certificate-verify-official">
            <OfficialMarkIcon />
            cito.study
          </span>
        </header>

        <section className={`certificate-verify-card is-${state}`}>
          {loading ? (
            <ResultHeader icon={<span className="certificate-verify-spinner" />}>
              <div className="certificate-verify-message">
                <p>Checking official records</p>
                <h1>Verifying certificate...</h1>
                <span>Please wait while CITO checks the secure registry.</span>
              </div>
            </ResultHeader>
          ) : certificate ? (
            <>
              <ResultHeader icon={<VerificationStatusIcon valid={certificate.valid} />}>
                <div className="certificate-verify-message">
                  <p>Official verification result</p>
                  <h1>{certificate.valid ? "Valid CITO certificate" : "Certificate revoked"}</h1>
                  <span>
                    {certificate.valid
                      ? "Authenticated against CITO's official certificate registry."
                      : "This record exists, but its certificate has been revoked by CITO."}
                  </span>
                </div>
              </ResultHeader>

              <dl className="certificate-verify-details">
                <div className="certificate-detail--id">
                  <dt>Certificate ID</dt>
                  <dd>{certificate.certificateNumber}</dd>
                </div>
                <div className="certificate-detail--recipient">
                  <dt>Recipient</dt>
                  <dd>{certificate.recipientNameEnglish || certificate.recipientNameKhmer}</dd>
                  {certificate.recipientNameKhmer && certificate.recipientNameEnglish && (
                    <small>{certificate.recipientNameKhmer}</small>
                  )}
                </div>
                <div className="certificate-detail--course">
                  <dt>Course</dt>
                  <dd>{certificate.courseName}</dd>
                </div>
                <div className="certificate-detail--birth">
                  <dt>Date of birth</dt>
                  <dd>{certificate.birthDate || "Not recorded"}</dd>
                </div>
                <div className="certificate-detail--issue">
                  <dt>Issue date</dt>
                  <dd>{certificate.issueDate}</dd>
                </div>
              </dl>

              <p className="certificate-verify-guidance">
                <OfficialMarkIcon />
                Confirm that the recipient, date of birth, course, and issue date match the printed certificate.
              </p>
            </>
          ) : (
            <ResultHeader icon={<VerificationStatusIcon valid={false} neutral={!error} />}>
              <div className="certificate-verify-message">
                <p>{error ? "Verification failed" : "Official CITO verification"}</p>
                <h1>{error ? "Certificate not verified" : "Check a certificate"}</h1>
                <span>
                  {error || "Scan a CITO certificate QR code or enter its verification code below."}
                </span>
              </div>
            </ResultHeader>
          )}

          {!loading && (
            <form className="certificate-verify-search" onSubmit={submitSearch}>
              <label htmlFor="certificate-code">
                {certificate ? "Verify another certificate" : "Verification code"}
              </label>
              <div>
                <input
                  id="certificate-code"
                  value={searchCode}
                  onChange={(event) => setSearchCode(event.target.value)}
                  placeholder="Enter the code contained in the QR"
                  autoComplete="off"
                />
                <button type="submit" disabled={!searchCode.trim()}>Verify</button>
              </div>
            </form>
          )}
        </section>

        <footer className="certificate-verify-footer">
          <span><OfficialMarkIcon /> Verified directly from CITO&apos;s official</span>
          <a href="https://cito.study/#/">Return to cito.study</a>
        </footer>
      </main>
    </div>
  );
}

function ResultHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="certificate-verify-result-head">
      <div className="certificate-verify-status-mark" aria-hidden="true">{icon}</div>
      {children}
    </div>
  );
}

function VerificationStatusIcon({ valid, neutral = false }: { valid: boolean; neutral?: boolean }) {
  if (neutral) {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="14" cy="14" r="8" />
        <path d="m20 20 6 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5 26 7v7.5c0 6.5-4.1 11.7-10 14-5.9-2.3-10-7.5-10-14V7l10-3.5Z" />
      {valid ? <path d="m10.8 15.8 3.2 3.3 7.2-7.4" /> : <path d="m12 12 8 8m0-8-8 8" />}
    </svg>
  );
}

function OfficialMarkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.8 16.7 4v5c0 4.3-2.7 7.8-6.7 9.3C6 16.8 3.3 13.3 3.3 9V4L10 1.8Z" />
      <path d="m6.8 9.8 2 2 4.5-4.6" />
    </svg>
  );
}
