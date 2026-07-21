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
          setError(message.includes("404") ? "Certificate not found in the official CITO registry." : message);
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

  const state = certificate?.valid ? "valid" : certificate ? "revoked" : error ? "invalid" : "ready";

  return (
    <div className="certificate-verify-page">
      <div className="certificate-verify-glow certificate-verify-glow--one" />
      <div className="certificate-verify-glow certificate-verify-glow--two" />

      <main className="certificate-verify-shell">
        <header className="certificate-verify-header">
          <a className="certificate-verify-brand" href="https://cito.study/#/" aria-label="CITO home">
            <img src={citoLogo} alt="CITO" />
            <span>
              <strong>CITO</strong>
              <small>Official certificate registry</small>
            </span>
          </a>
          <span className="certificate-verify-official">cito.study</span>
        </header>

        <section className={`certificate-verify-card is-${state}`}>
          <div className="certificate-verify-status-mark" aria-hidden="true">
            {loading ? <span className="certificate-verify-spinner" /> : certificate?.valid ? "✓" : certificate ? "!" : error ? "×" : "?"}
          </div>

          {loading ? (
            <div className="certificate-verify-message">
              <p>Checking official records</p>
              <h1>Verifying certificate...</h1>
              <span>Please wait while CITO checks the secure registry.</span>
            </div>
          ) : certificate ? (
            <>
              <div className="certificate-verify-message">
                <p>Official verification result</p>
                <h1>{certificate.valid ? "Valid CITO certificate" : "Certificate revoked"}</h1>
                <span>
                  {certificate.valid
                    ? "This certificate matches an official record issued by CITO."
                    : "This certificate is in the registry, but CITO has revoked it."}
                </span>
              </div>

              <dl className="certificate-verify-details">
                <div>
                  <dt>Certificate ID</dt>
                  <dd>{certificate.certificateNumber}</dd>
                </div>
                <div>
                  <dt>Recipient</dt>
                  <dd>{certificate.recipientNameEnglish || certificate.recipientNameKhmer}</dd>
                  {certificate.recipientNameKhmer && certificate.recipientNameEnglish && (
                    <small>{certificate.recipientNameKhmer}</small>
                  )}
                </div>
                <div>
                  <dt>Course</dt>
                  <dd>{certificate.courseName}</dd>
                </div>
                <div>
                  <dt>Issue date</dt>
                  <dd>{certificate.issueDate}</dd>
                </div>
              </dl>

              <p className="certificate-verify-guidance">
                Confirm that the recipient, course, and issue date shown here match the printed certificate.
              </p>
            </>
          ) : (
            <div className="certificate-verify-message">
              <p>{error ? "Verification failed" : "Official CITO verification"}</p>
              <h1>{error ? "Certificate not verified" : "Check a certificate"}</h1>
              <span>
                {error || "Scan a CITO certificate QR code or enter its verification code below."}
              </span>
            </div>
          )}

          {!loading && (
            <form className="certificate-verify-search" onSubmit={submitSearch}>
              <label htmlFor="certificate-code">Verification code</label>
              <div>
                <input
                  id="certificate-code"
                  value={searchCode}
                  onChange={(event) => setSearchCode(event.target.value)}
                  placeholder="Enter the code printed with the QR"
                  autoComplete="off"
                />
                <button type="submit" disabled={!searchCode.trim()}>Verify</button>
              </div>
            </form>
          )}
        </section>

        <footer className="certificate-verify-footer">
          <span>Verified directly from CITO&apos;s official database</span>
          <a href="https://cito.study/#/">Return to cito.study</a>
        </footer>
      </main>
    </div>
  );
}
