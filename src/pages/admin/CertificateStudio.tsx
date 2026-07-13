import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import stampImage from "./certificate/assets/cito-stamp.png";
import {
  dateParts,
  downloadSpreadsheetTemplate,
  fieldValue,
  fullDate,
  readSpreadsheet,
  recipientName,
  type CertificateRow,
} from "./certificate/certificateData";
import "./certificate/certificateStudio.css";

type TextField = "name" | "gender" | "birthDate" | "course" | "issueDate";
type FieldSettings = Record<TextField, { font: string; size: string }>;
type StampPlacement = { x: number; y: number; width: number };

const initialFieldSettings: FieldSettings = {
  name: { font: "", size: "" },
  gender: { font: "", size: "" },
  birthDate: { font: "", size: "" },
  course: { font: "", size: "" },
  issueDate: { font: "", size: "" },
};

const defaultStamp: StampPlacement = { x: 69.25, y: 66.2, width: 13.5 };
const a4LandscapeWidthPx = (297 / 25.4) * 96;

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
  const [stamp, setStamp] = useState<StampPlacement>(defaultStamp);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [printStatus, setPrintStatus] = useState("");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const embeddedUrlsRef = useRef<string[]>([]);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

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

  async function savePdf() {
    if (rows.length === 0) return;
    setError("");
    setPrintStatus("Preparing PDF...");
    document.body.classList.add("certificate-pdf-exporting");
    let printRoot: HTMLDivElement | null = null;

    try {
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
    } catch {
      setError("Could not open the PDF print dialog. Please try again.");
    } finally {
      printRoot?.remove();
      document.body.classList.remove("certificate-pdf-exporting");
      setPrintStatus("");
    }
  }

  async function printAll() {
    if (rows.length === 0) return;
    setPrintStatus("Preparing certificates...");
    await prepareCertificates();
    setPrintStatus("");
    window.print();
  }

  function photoForRow(row: CertificateRow) {
    const raw = fieldValue(row, "recipientPhoto");
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    return "";
  }

  function handleStampPointerDown(event: ReactPointerEvent<HTMLImageElement>) {
    const certificate = event.currentTarget.closest<HTMLElement>(".cito-certificate-sheet");
    if (!certificate) return;
    const stampRect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - stampRect.left,
      offsetY: event.clientY - stampRect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleStampPointerMove(event: ReactPointerEvent<HTMLImageElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const certificate = event.currentTarget.closest<HTMLElement>(".cito-certificate-sheet");
    if (!certificate) return;
    const certificateRect = certificate.getBoundingClientRect();
    const stampRect = event.currentTarget.getBoundingClientRect();
    const widthPercent = (stampRect.width / certificateRect.width) * 100;
    const heightPercent = (stampRect.height / certificateRect.height) * 100;
    setStamp((current) => ({
      ...current,
      x: clamp(((event.clientX - certificateRect.left - drag.offsetX) / certificateRect.width) * 100, 0, 100 - widthPercent),
      y: clamp(((event.clientY - certificateRect.top - drag.offsetY) / certificateRect.height) * 100, 0, 100 - heightPercent),
    }));
  }

  const previewRows = rows.length > 0 ? rows : [blankPreviewRow];

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
          <button className="certificate-button certificate-button--secondary" type="button" onClick={downloadSpreadsheetTemplate}>
            Download template
          </button>
          <button
            className="certificate-button certificate-button--primary"
            type="button"
            disabled={rows.length === 0 || Boolean(printStatus)}
            onClick={() => void savePdf()}
          >
            {printStatus || "Save PDF"}
          </button>
          <button
            className="certificate-button certificate-button--primary"
            type="button"
            disabled={rows.length === 0 || Boolean(printStatus)}
            onClick={() => void printAll()}
          >
            Print all
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
            <p className="certificate-control-note">
              Student photos can be embedded directly in the spreadsheet&apos;s <code>picture</code> column.
            </p>
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

          <ControlSection step="02" title="Position the seal">
            <button
              className="certificate-button certificate-button--secondary certificate-button--wide"
              type="button"
              onClick={() => setStamp(defaultStamp)}
            >
              Reset stamp position
            </button>
          </ControlSection>

          <div className="certificate-column-guide">
            <span className="certificate-guide-kicker">Required columns</span>
            <div>
              {['name_khmer', 'name_english', 'sex', 'birth_day', 'birth_month', 'birth_year', 'course', 'issue_day', 'issue_month', 'issue_year', 'picture'].map((column) => (
                <code key={column}>{column}</code>
              ))}
            </div>
          </div>
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
                  stamp={stamp}
                  selectedField={selectedField}
                  fieldSettings={fieldSettings}
                  onSelectField={setSelectedField}
                  onStampPointerDown={handleStampPointerDown}
                  onStampPointerMove={handleStampPointerMove}
                  onStampPointerEnd={() => { dragRef.current = null; }}
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
  stamp,
  selectedField,
  fieldSettings,
  onSelectField,
  onStampPointerDown,
  onStampPointerMove,
  onStampPointerEnd,
}: {
  row: CertificateRow;
  scale: number;
  photo: string;
  stamp: StampPlacement;
  selectedField: TextField | null;
  fieldSettings: FieldSettings;
  onSelectField: (field: TextField) => void;
  onStampPointerDown: (event: ReactPointerEvent<HTMLImageElement>) => void;
  onStampPointerMove: (event: ReactPointerEvent<HTMLImageElement>) => void;
  onStampPointerEnd: () => void;
}) {
  const birth = dateParts(row, "birthDate", "birthDay", "birthMonth", "birthYear");
  const issue = dateParts(row, "issueDate", "issueDay", "issueMonth", "issueYear");
  const textStyle = (field: TextField): CSSProperties => ({
    fontFamily: fieldSettings[field].font || undefined,
    fontSize: fieldSettings[field].size ? `${fieldSettings[field].size}px` : undefined,
  });
  const textProps = (field: TextField) => ({
    className: `certificate-fill${selectedField === field ? " is-selected" : ""}`,
    style: textStyle(field),
    onClick: () => onSelectField(field),
  });

  return (
    <article
      className="cito-certificate-sheet"
      aria-label={`CITO certificate for ${recipientName(row, "english") || recipientName(row, "khmer") || "student"}`}
      style={{ zoom: scale }}
    >
      <div {...textProps("name")} data-position="name-khmer">{recipientName(row, "khmer")}</div>
      <div {...textProps("gender")} data-position="gender">{fieldValue(row, "gender")}</div>
      <div {...textProps("birthDate")} data-position="birth-day-khmer">{birth.day}</div>
      <div {...textProps("birthDate")} data-position="birth-month-khmer">{birth.month}</div>
      <div {...textProps("birthDate")} data-position="birth-year-khmer">{birth.year}</div>
      <div {...textProps("course")} data-position="course-khmer">{fieldValue(row, "course")}</div>
      <div {...textProps("issueDate")} data-position="issue-day-khmer">{issue.day}</div>
      <div {...textProps("issueDate")} data-position="issue-month-khmer">{issue.month}</div>
      <div {...textProps("issueDate")} data-position="issue-year-khmer">{issue.year}</div>
      <div {...textProps("name")} data-position="name-english">{recipientName(row, "english")}</div>
      <div {...textProps("birthDate")} data-position="birth-date-english">{fullDate(row, "birthDate", birth)}</div>
      <div {...textProps("course")} data-position="course-english">{fieldValue(row, "course")}</div>
      <div {...textProps("issueDate")} data-position="issue-date-english">{fullDate(row, "issueDate", issue)}</div>
      {photo && <img className="certificate-student-photo" src={photo} alt="" />}
      <img
        className="certificate-stamp"
        src={stampImage}
        alt=""
        draggable={false}
        style={{ left: `${stamp.x}%`, top: `${stamp.y}%`, width: `${stamp.width}%` }}
        onPointerDown={onStampPointerDown}
        onPointerMove={onStampPointerMove}
        onPointerUp={onStampPointerEnd}
        onPointerCancel={onStampPointerEnd}
      />
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
