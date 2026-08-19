import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "../../api";
import { getErrorMessage } from "../../lib/errors";
import {
  dateParts,
  downloadSpreadsheetTemplate,
  fieldValue,
  fullDate,
  readSpreadsheet,
  recipientName,
  type CertificateRow,
} from "./certificate/certificateData";
import citoStampUrl from "./certificate/assets/cito-stamp.png";
import "./certificate/certificateStudio.css";

type TextField = "name" | "gender" | "birthDate" | "course" | "issueDate";
type FieldSettings = Record<TextField, { font: string; size: string }>;
type QrPlacement = { x: number; y: number; width: number };
type IssuedCertificate = {
  status: "DRAFT" | "VALID" | "REVOKED";
  valid: boolean;
  published: boolean;
  verificationCode: string;
  certificateNumber: string;
  recipientNameKhmer: string;
  recipientNameEnglish: string;
  birthDate: string;
  courseName: string;
  issueDate: string;
  issuedAt: string;
  publishedAt?: string | null;
  revokedAt?: string | null;
};

const initialFieldSettings: FieldSettings = {
  name: { font: "", size: "" },
  gender: { font: "", size: "" },
  birthDate: { font: "", size: "" },
  course: { font: "", size: "" },
  issueDate: { font: "", size: "" },
};

const fixedQr: QrPlacement = { x: 7.1, y: 72, width: 12.2 };
const a4LandscapeWidthPx = (297 / 25.4) * 96;
const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://cito.study").replace(/\/$/, "");

const fieldLabels: Record<TextField, string> = {
  name: "Student name",
  gender: "Gender",
  birthDate: "Birth date",
  course: "Course",
  issueDate: "Issue date",
};

const fontOptions = [
  { value: "", label: "Template default" },
  { value: "CITO Battambang", label: "Battambang" },
  { value: "CITO Battambang Bold", label: "Battambang Bold" },
  { value: "CITO Moul", label: "Moul" },
  { value: "CITO Siemreap", label: "Siemreap" },
  { value: "Times New Roman", label: "Times New Roman" },
];

const blankPreviewRow: CertificateRow = {
  name_khmer: "Khmer Name",
  name_english: "English Name",
  sex: "Gender",
  birth_day: "DD",
  birth_month: "MM",
  birth_year: "YYYY",
  course: "Course Name",
  issue_day: "DD",
  issue_month: "MM",
  issue_year: "YYYY",
};

export default function CertificateStudio() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [sheetName, setSheetName] = useState("No spreadsheet selected");
  const [selectedField, setSelectedField] = useState<TextField | null>(null);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>(initialFieldSettings);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [printStatus, setPrintStatus] = useState("");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const embeddedUrlsRef = useRef<string[]>([]);
  const issuanceBatchRef = useRef(createIssuanceBatchId());
  const previewScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      embeddedUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  useEffect(() => {
    const previewScroll = previewScrollRef.current;
    if (!previewScroll) return;

    const updateScale = () => {
      const styles = window.getComputedStyle(previewScroll);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const availableWidth = Math.max(0, previewScroll.clientWidth - horizontalPadding);
      setPreviewScale(Math.min(1, availableWidth / a4LandscapeWidthPx));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(previewScroll);
    updateScale();

    return () => observer.disconnect();
  }, []);

  async function handleSpreadsheet(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setSheetName(`Reading ${file.name}...`);
    setIssuedCertificates([]);
    issuanceBatchRef.current = createIssuanceBatchId();
    embeddedUrlsRef.current.forEach(URL.revokeObjectURL);
    embeddedUrlsRef.current = [];

    try {
      const result = await readSpreadsheet(file);
      embeddedUrlsRef.current = result.embeddedObjectUrls;
      setRows(result.rows);
      setSheetName(file.name);
      if (result.rows.length === 0) {
        setError("The spreadsheet is valid, but it does not contain certificate rows.");
      }
    } catch {
      setRows([]);
      setSheetName("Spreadsheet could not be read");
      setError("Could not read this file. Check that the first sheet contains the CITO certificate columns.");
    } finally {
      setBusy(false);
    }
  }

  function updateSelectedField(key: "font" | "size", value: string) {
    if (!selectedField) return;
    setFieldSettings((current) => ({
      ...current,
      [selectedField]: { ...current[selectedField], [key]: value },
    }));
  }

  async function prepareCertificates(root: ParentNode = document) {
    await document.fonts.ready;
    const certificates = Array.from(
      root.querySelectorAll<HTMLElement>(".cito-certificate-sheet")
    );
    const images = certificates.flatMap((certificate) =>
      Array.from(certificate.querySelectorAll<HTMLImageElement>("img"))
    );
    await Promise.all(images.map(waitForImage));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return certificates;
  }

  function updateCertificateText(rowIndex: number, position: string, value: string) {
    const rowKey = certificateRowKey(position);
    if (!rowKey) return;

    setRows((current) => {
      const nextRows = current.length > 0
        ? current.map((row) => ({ ...row }))
        : [{ ...blankPreviewRow }];
      nextRows[rowIndex] = { ...nextRows[rowIndex], [rowKey]: value.trim() };
      return nextRows;
    });
    setIssuedCertificates([]);
    issuanceBatchRef.current = createIssuanceBatchId();
  }

  function addCertificatePage() {
    setRows((current) => [...current, { ...blankPreviewRow }]);
    setIssuedCertificates([]);
    issuanceBatchRef.current = createIssuanceBatchId();
    setError("");
  }

  async function ensureCertificatesIssued() {
    if (rows.length === 0) {
      throw new Error("Select a spreadsheet before issuing certificates.");
    }
    if (issuedCertificates.length === rows.length) {
      return issuedCertificates;
    }

    setIssuing(true);
    try {
      const certificates = await apiFetch<IssuedCertificate[]>("/api/admin/certificates/issue", {
        method: "POST",
        body: JSON.stringify({
          certificates: rows.map((row, index) => {
            const birth = dateParts(row, "birthDate", "birthDay", "birthMonth", "birthYear");
            const issue = dateParts(row, "issueDate", "issueDay", "issueMonth", "issueYear");
            return {
              issuanceKey: `${issuanceBatchRef.current}-${index}`,
              recipientNameKhmer: recipientName(row, "khmer"),
              recipientNameEnglish: recipientName(row, "english"),
              birthDate: fullDate(row, "birthDate", birth),
              courseName: fieldValue(row, "course"),
              issueDate: fullDate(row, "issueDate", issue),
            };
          }),
        }),
      });

      if (certificates.length !== rows.length) {
        throw new Error("The server did not register every certificate. Please try again.");
      }

      setIssuedCertificates(certificates);
      await waitForQrCodes(certificates.length);
      return certificates;
    } finally {
      setIssuing(false);
    }
  }

  async function issueQrCodes() {
    setError("");
    setPrintStatus("Securing certificates...");
    try {
      await ensureCertificatesIssued();
    } catch (issueError) {
      setError(getErrorMessage(issueError, "Could not secure these certificates."));
    } finally {
      setPrintStatus("");
    }
  }

  async function pushCertificatesToPublic() {
    if (issuedCertificates.length !== rows.length) return;
    setError("");
    setPublishing(true);
    try {
      const published = await apiFetch<IssuedCertificate[]>("/api/admin/certificates/publish", {
        method: "POST",
        body: JSON.stringify({
          verificationCodes: issuedCertificates.map((certificate) => certificate.verificationCode),
        }),
      });
      if (published.length !== rows.length || published.some((certificate) => !certificate.published)) {
        throw new Error("The server did not publish every certificate. Please try again.");
      }
      setIssuedCertificates(published);
    } catch (publishError) {
      setError(getErrorMessage(publishError, "Could not publish these certificates."));
    } finally {
      setPublishing(false);
    }
  }

  async function savePdf() {
    if (rows.length === 0) return;
    setError("");
    setPrintStatus("Securing certificates...");
    document.body.classList.add("certificate-pdf-exporting");
    let printRoot: HTMLDivElement | null = null;

    try {
      await ensureCertificatesIssued();
      setPrintStatus("Preparing PDF...");
      const certificateList = document.querySelector<HTMLElement>(".certificate-list");
      if (!certificateList) throw new Error("Certificate list is not available");

      printRoot = document.createElement("div");
      printRoot.className = "certificate-native-print-root";
      printRoot.append(certificateList.cloneNode(true));
      document.body.append(printRoot);

      await prepareCertificates(printRoot);
      setPrintStatus("");
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      window.print();
    } catch (printError) {
      setError(getErrorMessage(printError, "Could not open the PDF print dialog. Please try again."));
    } finally {
      printRoot?.remove();
      document.body.classList.remove("certificate-pdf-exporting");
      setPrintStatus("");
    }
  }

  function photoForRow(row: CertificateRow) {
    const raw = fieldValue(row, "recipientPhoto");
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    return "";
  }

  const previewRows = rows.length > 0 ? rows : [blankPreviewRow];
  const allCertificatesIssued = rows.length > 0 && issuedCertificates.length === rows.length;
  const allCertificatesPublished =
    allCertificatesIssued && issuedCertificates.every((certificate) => certificate.published);

  return (
    <div className={`certificate-studio-page${previewOnly ? " is-preview-only" : ""}`}>
      <header className="certificate-studio-hero">
        <div className="certificate-hero-identity">
          <div className="certificate-hero-mark" aria-hidden="true">
            <CertificateMarkIcon />
          </div>
          <div>
            <div className="certificate-hero-meta">
              <p className="certificate-eyebrow">CITO administration</p>
              <span>Admin only</span>
            </div>
            <h1>CITO Certificate</h1>
          </div>
        </div>
        <div className="certificate-hero-actions">
          <button
            className="certificate-button certificate-button--secondary"
            type="button"
            disabled={Boolean(printStatus) || issuing || publishing}
            onClick={addCertificatePage}
          >
            + Page
          </button>
          <button className="certificate-button certificate-button--secondary" type="button" onClick={downloadSpreadsheetTemplate}>
            Download template
          </button>
          <button
            className="certificate-button certificate-button--secondary"
            type="button"
            disabled={rows.length === 0 || Boolean(printStatus) || issuing || publishing}
            onClick={() => void issueQrCodes()}
          >
            {allCertificatesIssued
              ? "QR ready"
              : "Issue QR codes"}
          </button>
          <button
            className="certificate-button certificate-button--primary"
            type="button"
            disabled={!allCertificatesIssued || allCertificatesPublished || Boolean(printStatus) || issuing || publishing}
            onClick={() => void pushCertificatesToPublic()}
          >
            {publishing ? "Publishing..." : allCertificatesPublished ? "Published" : "Push to public"}
          </button>
          <button
            className="certificate-button certificate-button--primary"
            type="button"
            disabled={rows.length === 0 || Boolean(printStatus) || issuing || publishing}
            onClick={() => void savePdf()}
          >
            {printStatus || "Save PDF"}
          </button>
        </div>
      </header>

      <div className="certificate-studio-workspace">
        <aside className="certificate-control-panel">
          <ControlSection>
            <UploadCard
              title="Spreadsheet"
              status={sheetName}
              accept=".xlsx,.xls,.csv"
              disabled={busy}
              onChange={(files) => void handleSpreadsheet(files?.[0])}
            />
          </ControlSection>

          <ControlSection step="01" title="Style selected text">
            <div className="certificate-selected-field">
              <span>{selectedField ? "Selected field" : "Waiting for selection"}</span>
              <strong>{selectedField ? fieldLabels[selectedField] : "Click certificate text"}</strong>
            </div>
            <label className="certificate-form-field">
              <span>Font</span>
              <select
                disabled={!selectedField}
                value={selectedField ? fieldSettings[selectedField].font : ""}
                onChange={(event) => updateSelectedField("font", event.target.value)}
              >
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="certificate-form-field">
              <span>Font size</span>
              <input
                disabled={!selectedField}
                type="number"
                min="6"
                max="120"
                placeholder="Template default"
                value={selectedField ? fieldSettings[selectedField].size : ""}
                onChange={(event) => updateSelectedField("size", event.target.value)}
              />
            </label>
          </ControlSection>

        </aside>

        <section className="certificate-preview-panel">
          <div className="certificate-preview-heading">
            <div>
              <p className="certificate-eyebrow">Live output</p>
              <h2>{rows.length > 0 ? `${rows.length} certificate${rows.length === 1 ? "" : "s"} ready` : "CITO Certificate preview"}</h2>
            </div>
            <div className="certificate-preview-heading-actions">
              <span className="certificate-preview-badge">A4 landscape</span>
              <button
                className="certificate-button certificate-button--secondary certificate-preview-full-button"
                type="button"
                onClick={() => setPreviewOnly((current) => !current)}
              >
                {previewOnly ? "Exit full page" : "Full page"}
              </button>
            </div>
          </div>

          {error && <div className="certificate-error" role="alert">{error}</div>}
          <div className="certificate-preview-scroll" ref={previewScrollRef}>
            <div className="certificate-list">
              {previewRows.map((row, index) => (
                <CitoCertificate
                  key={`${recipientName(row, "english") || recipientName(row, "khmer") || "preview"}-${index}`}
                  row={row}
                  scale={previewScale}
                  photo={photoForRow(row)}
                  verification={issuedCertificates[index]}
                  selectedField={selectedField}
                  fieldSettings={fieldSettings}
                  onSelectField={setSelectedField}
                  onEditText={(position, value) => updateCertificateText(index, position, value)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CitoCertificate({
  row,
  scale,
  photo,
  verification,
  selectedField,
  fieldSettings,
  onSelectField,
  onEditText,
}: {
  row: CertificateRow;
  scale: number;
  photo: string;
  verification?: IssuedCertificate;
  selectedField: TextField | null;
  fieldSettings: FieldSettings;
  onSelectField: (field: TextField) => void;
  onEditText: (position: string, value: string) => void;
}) {
  const birth = dateParts(row, "birthDate", "birthDay", "birthMonth", "birthYear");
  const issue = dateParts(row, "issueDate", "issueDay", "issueMonth", "issueYear");
  const textStyle = (field: TextField): CSSProperties => ({
    fontFamily: fieldSettings[field].font || undefined,
    fontSize: fieldSettings[field].size ? `${fieldSettings[field].size}px` : undefined,
  });
  const textProps = (field: TextField, position: string) => ({
    className: `certificate-fill${selectedField === field ? " is-selected" : ""}`,
    style: textStyle(field),
    onClick: () => onSelectField(field),
    contentEditable: true,
    suppressContentEditableWarning: true,
    role: "textbox",
    tabIndex: 0,
    onBlur: (event: React.FocusEvent<HTMLDivElement>) =>
      onEditText(position, event.currentTarget.textContent || ""),
  });

  return (
    <article
      className="cito-certificate-sheet"
      aria-label={`CITO certificate for ${recipientName(row, "english") || recipientName(row, "khmer") || "student"}`}
      style={{ zoom: scale }}
    >
      <div {...textProps("name", "name-khmer")} data-position="name-khmer">{recipientName(row, "khmer")}</div>
      <div {...textProps("gender", "gender")} data-position="gender">{fieldValue(row, "gender")}</div>
      <div {...textProps("birthDate", "birth-day-khmer")} data-position="birth-day-khmer">{birth.day}</div>
      <div {...textProps("birthDate", "birth-month-khmer")} data-position="birth-month-khmer">{birth.month}</div>
      <div {...textProps("birthDate", "birth-year-khmer")} data-position="birth-year-khmer">{birth.year}</div>
      <div {...textProps("course", "course-khmer")} data-position="course-khmer">{fieldValue(row, "course")}</div>
      <div {...textProps("issueDate", "issue-day-khmer")} data-position="issue-day-khmer">{issue.day}</div>
      <div {...textProps("issueDate", "issue-month-khmer")} data-position="issue-month-khmer">{issue.month}</div>
      <div {...textProps("issueDate", "issue-year-khmer")} data-position="issue-year-khmer">{issue.year}</div>
      <div {...textProps("name", "name-english")} data-position="name-english">{recipientName(row, "english")}</div>
      <div {...textProps("birthDate", "birth-date-english")} data-position="birth-date-english">{fullDate(row, "birthDate", birth)}</div>
      <div {...textProps("course", "course-english")} data-position="course-english">{fieldValue(row, "course")}</div>
      <div {...textProps("issueDate", "issue-date-english")} data-position="issue-date-english">{fullDate(row, "issueDate", issue)}</div>
      {photo && <img className="certificate-student-photo" src={photo} alt="" />}
      <img className="certificate-official-stamp" src={citoStampUrl} alt="Official CITO stamp" draggable={false} />
      {verification && (
        <div
          className="certificate-verification-block"
          aria-label="Official certificate verification QR code"
          style={{ left: `${fixedQr.x}%`, top: `${fixedQr.y}%`, width: `${fixedQr.width}%` }}
        >
          <QRCodeSVG
            className="certificate-verification-qr"
            value={certificateVerificationUrl(verification.verificationCode)}
            level="M"
            bgColor="#ffffff"
            fgColor="#071737"
            title={`Verify certificate ${verification.certificateNumber}`}
          />
        </div>
      )}
    </article>
  );
}

function UploadCard({
  title,
  status,
  accept,
  disabled,
  onChange,
}: {
  title: string;
  status: string;
  accept: string;
  disabled?: boolean;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <label className="certificate-upload-card">
      <span className="certificate-upload-icon" aria-hidden="true"><UploadIcon /></span>
      <span className="certificate-upload-copy">
        <strong>{title}</strong>
        <span>{status}</span>
      </span>
      <span className="certificate-upload-action">Browse</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onClick={(event) => { event.currentTarget.value = ""; }}
        onChange={(event) => onChange(event.currentTarget.files)}
      />
    </label>
  );
}

function ControlSection({
  step,
  title,
  children,
}: {
  step?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="certificate-control-section">
      {step && title && (
        <div className="certificate-section-title">
          <span>{step}</span>
          <div><h2>{title}</h2></div>
        </div>
      )}
      {children}
    </section>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5V19h14v-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CertificateMarkIcon() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true">
      <path d="M7 5.5h18v14H7z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 10h10M11 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="21.5" cy="22" r="4.5" fill="currentColor" opacity=".18" />
      <path d="m19.2 25.8-1 3 3.3-1.6 3.2 1.6-1-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return image.decode().catch(() => undefined);
  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
}

function certificateRowKey(position: string) {
  const keys: Record<string, string> = {
    "name-khmer": "name_khmer",
    gender: "sex",
    "birth-day-khmer": "birth_day",
    "birth-month-khmer": "birth_month",
    "birth-year-khmer": "birth_year",
    "course-khmer": "course",
    "issue-day-khmer": "issue_day",
    "issue-month-khmer": "issue_month",
    "issue-year-khmer": "issue_year",
    "name-english": "name_english",
    "birth-date-english": "birth_date",
    "course-english": "course",
    "issue-date-english": "issue_date",
  };
  return keys[position] || "";
}

async function waitForQrCodes(expectedCount: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (document.querySelectorAll(".certificate-verification-qr").length >= expectedCount) return;
  }
  throw new Error("The certificate QR codes did not finish rendering. Please try again.");
}

function certificateVerificationUrl(verificationCode: string) {
  return `${publicSiteUrl}/#/verify-certificate/${encodeURIComponent(verificationCode)}`;
}

function createIssuanceBatchId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
