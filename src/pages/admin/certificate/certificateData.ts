import type JSZip from "jszip";
import * as XLSX from "xlsx";

export type CertificateRow = Record<string, string>;

export const certificateColumns = [
  "name",
  "sex",
  "birth_day",
  "birth_month",
  "birth_year",
  "course",
  "issue_day",
  "issue_month",
  "issue_year",
  "picture",
];

const fieldAliases = {
  recipientName: ["name", "recipient_name", "recipient name", "student name", "full name"],
  gender: ["sex", "gender"],
  birthDay: ["birth_day", "birth day"],
  birthMonth: ["birth_month", "birth month"],
  birthYear: ["birth_year", "birth year"],
  birthDate: ["birth_date", "birth date", "dob", "date_of_birth"],
  course: ["course", "course_name", "course name", "program", "completed_course"],
  issueDay: ["issue_day", "issue day"],
  issueMonth: ["issue_month", "issue month"],
  issueYear: ["issue_year", "issue year"],
  issueDate: ["issue_date", "issue date", "due_date", "certificate_date"],
  recipientPhoto: ["picture", "recipient_photo", "recipient photo", "photo", "image"],
} as const;

export type CertificateField = keyof typeof fieldAliases;

export function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function fieldValue(row: CertificateRow, key: CertificateField) {
  for (const alias of fieldAliases[key]) {
    const found = row[normalize(alias)];
    if (found) return found;
  }
  return "";
}

export function dateParts(
  row: CertificateRow,
  combinedKey: "birthDate" | "issueDate",
  dayKey: "birthDay" | "issueDay",
  monthKey: "birthMonth" | "issueMonth",
  yearKey: "birthYear" | "issueYear"
) {
  const direct = {
    day: fieldValue(row, dayKey),
    month: fieldValue(row, monthKey),
    year: fieldValue(row, yearKey),
  };

  if (direct.day || direct.month || direct.year) return direct;

  const raw = fieldValue(row, combinedKey).trim();
  const match = raw.match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})$/);
  return match
    ? { day: match[1], month: match[2], year: match[3] }
    : { day: "", month: "", year: "" };
}

export function fullDate(
  row: CertificateRow,
  combinedKey: "birthDate" | "issueDate",
  parts: { day: string; month: string; year: string }
) {
  return fieldValue(row, combinedKey) || [parts.day, parts.month, parts.year].filter(Boolean).join(" / ");
}

export async function readSpreadsheet(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const embeddedImages = await extractEmbeddedImages(buffer);

  const rows = XLSX.utils
    .sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false })
    .map((row, index) => {
      const normalized = normalizeRow(row);
      const embeddedImage = embeddedImages.byRow.get(index) ?? embeddedImages.ordered[index];
      if (embeddedImage) normalized.picture = embeddedImage;
      return normalized;
    })
    .filter((row) => Object.values(row).some((value) => value.trim() !== ""));

  return { rows, embeddedObjectUrls: embeddedImages.ordered };
}

export function downloadSpreadsheetTemplate() {
  const workbook = XLSX.utils.book_new();
  const sample = ["Sok Dara", "Male", "15", "08", "2005", "Computer Basics", "04", "07", "2026", "Sok Dara.jpg"];
  const sheet = XLSX.utils.aoa_to_sheet([certificateColumns, sample]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Upload_Data");
  XLSX.writeFile(workbook, "cito_certificate_upload_template.xlsx");
}

function normalizeRow(row: Record<string, unknown>): CertificateRow {
  const result: CertificateRow = {};
  for (const [key, value] of Object.entries(row)) {
    result[normalize(key)] = String(value ?? "").trim();
  }
  return result;
}

type EmbeddedImages = {
  byRow: Map<number, string>;
  ordered: string[];
};

async function extractEmbeddedImages(buffer: ArrayBuffer) {
  const embeddedImages: EmbeddedImages = { byRow: new Map(), ordered: [] };

  try {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(buffer);
    await extractWpsCellImages(zip, embeddedImages);
    await extractDrawingImages(zip, embeddedImages);
  } catch {
    return embeddedImages;
  }

  return embeddedImages;
}

async function extractWpsCellImages(zip: JSZip, embeddedImages: EmbeddedImages) {
  const cellImagesXml = await zip.file("xl/cellimages.xml")?.async("text");
  const cellImagesRelsXml = await zip.file("xl/_rels/cellimages.xml.rels")?.async("text");
  const sheetXml = await zip.file("xl/worksheets/sheet1.xml")?.async("text");
  if (!cellImagesXml || !cellImagesRelsXml || !sheetXml) return;

  const imageIdToRelId = new Map<string, string>();
  const cellImagesDoc = parseXml(cellImagesXml);
  for (const cellImage of elements(cellImagesDoc, "cellImage")) {
    const imageId = attr(elements(cellImage, "cNvPr")[0], "name");
    const relId = attr(elements(cellImage, "blip")[0], "embed");
    if (imageId && relId) imageIdToRelId.set(imageId, relId);
  }

  const rels = relMap(cellImagesRelsXml);
  const imageIdToUrl = new Map<string, string>();
  for (const [imageId, relId] of imageIdToRelId.entries()) {
    const imageUrl = await imageUrlFromZipPath(zip, "xl/cellimages.xml", rels.get(relId));
    if (!imageUrl) continue;
    imageIdToUrl.set(imageId, imageUrl);
    embeddedImages.ordered.push(imageUrl);
  }

  const sheetDoc = parseXml(sheetXml);
  for (const cell of elements(sheetDoc, "c")) {
    const imageId = childText(cell, "f").match(/DISPIMG\("([^"]+)"/i)?.[1];
    const rowNumber = Number(attr(cell, "r").match(/\d+/)?.[0]);
    const imageUrl = imageId ? imageIdToUrl.get(imageId) : "";
    if (!imageUrl || !Number.isFinite(rowNumber) || rowNumber < 2) continue;
    embeddedImages.byRow.set(rowNumber - 2, imageUrl);
  }
}

async function extractDrawingImages(zip: JSZip, embeddedImages: EmbeddedImages) {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("text");
  const workbookRelsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("text");
  if (!workbookXml || !workbookRelsXml) return;

  const firstSheet = elements(parseXml(workbookXml), "sheet")[0];
  const sheetPath = resolveZipPath("xl/workbook.xml", relMap(workbookRelsXml).get(attr(firstSheet, "id")));
  if (!sheetPath) return;

  const sheetXml = await zip.file(sheetPath)?.async("text");
  if (!sheetXml) return;

  const drawingRelId = attr(elements(parseXml(sheetXml), "drawing")[0], "id");
  const sheetRelsXml = await zip.file(relsPath(sheetPath))?.async("text");
  if (!drawingRelId || !sheetRelsXml) return;

  const drawingPath = resolveZipPath(sheetPath, relMap(sheetRelsXml).get(drawingRelId));
  const drawingXml = drawingPath ? await zip.file(drawingPath)?.async("text") : "";
  const drawingRelsXml = drawingPath ? await zip.file(relsPath(drawingPath))?.async("text") : "";
  if (!drawingPath || !drawingXml || !drawingRelsXml) return;

  const drawingRels = relMap(drawingRelsXml);
  const drawingDoc = parseXml(drawingXml);
  const anchors = [...elements(drawingDoc, "twoCellAnchor"), ...elements(drawingDoc, "oneCellAnchor")];

  for (const anchor of anchors) {
    const row = Number(childText(child(anchor, "from"), "row"));
    const relId = attr(elements(anchor, "blip")[0], "embed");
    const imageUrl = await imageUrlFromZipPath(zip, drawingPath, drawingRels.get(relId));
    if (!Number.isFinite(row) || !imageUrl) continue;

    embeddedImages.ordered.push(imageUrl);
    if (row >= 1 && !embeddedImages.byRow.has(row - 1)) {
      embeddedImages.byRow.set(row - 1, imageUrl);
    }
  }
}

async function imageUrlFromZipPath(zip: JSZip, basePath: string, target: string | undefined) {
  const imagePath = resolveZipPath(basePath, target);
  const imageFile = imagePath ? zip.file(imagePath) : null;
  if (!imagePath || !imageFile) return "";

  const bytes = await imageFile.async("uint8array");
  const imageBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(imageBuffer).set(bytes);
  return URL.createObjectURL(new Blob([imageBuffer], { type: mimeType(imagePath) }));
}

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function elements(root: ParentNode, localName: string) {
  return Array.from(root.querySelectorAll("*")).filter((node) => node.localName === localName);
}

function child(root: Element | undefined, localName: string) {
  return root ? Array.from(root.children).find((node) => node.localName === localName) : undefined;
}

function childText(root: Element | undefined, localName: string) {
  return child(root, localName)?.textContent ?? "";
}

function attr(element: Element | undefined, localName: string) {
  if (!element) return "";
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.localName === localName || attribute.name === localName) return attribute.value;
  }
  return "";
}

function relMap(xml: string) {
  const map = new Map<string, string>();
  for (const relationship of elements(parseXml(xml), "Relationship")) {
    const id = attr(relationship, "Id");
    const target = attr(relationship, "Target");
    if (id && target) map.set(id, target);
  }
  return map;
}

function relsPath(zipPath: string) {
  const slash = zipPath.lastIndexOf("/");
  const dir = slash >= 0 ? zipPath.slice(0, slash) : "";
  const file = slash >= 0 ? zipPath.slice(slash + 1) : zipPath;
  return `${dir}/_rels/${file}.rels`;
}

function resolveZipPath(basePath: string, target: string | undefined) {
  if (!target) return "";
  if (target.startsWith("/")) return target.replace(/^\/+/, "");

  const parts = basePath.split("/");
  parts.pop();
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function mimeType(zipPath: string) {
  const extension = zipPath.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "gif") return "image/gif";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
