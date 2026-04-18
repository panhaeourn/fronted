import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = {
  padding: 24,
  color: "var(--app-heading)",
};

export const pageStyleWide: CSSProperties = {
  ...pageStyle,
  maxWidth: 1180,
  margin: "0 auto",
};

export const pageStyleMedium: CSSProperties = {
  ...pageStyle,
  maxWidth: 980,
  margin: "0 auto",
};

export const loadingStyle: CSSProperties = {
  padding: 24,
  color: "var(--app-heading)",
};

export const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 18,
  flexWrap: "wrap",
  marginBottom: 22,
};

export const titleStyleSm: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.45rem, 2.4vw, 1.9rem)",
};

export const titleStyleMd: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
};

export const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  minHeight: 46,
  padding: "10px 16px",
  borderRadius: 14,
  background: "var(--app-secondary-bg)",
  border: "1px solid var(--app-secondary-border)",
  color: "var(--app-secondary-text)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
};

export const panelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 20,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

export const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

export const infoCardStyle: CSSProperties = {
  padding: "16px 18px",
  borderRadius: 18,
  background: "var(--app-panel-soft-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

export const infoLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

export const infoValueStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 24,
  fontWeight: 800,
};

export const errorStyle: CSSProperties = {
  color: "var(--app-danger-text)",
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: 14,
  background: "var(--app-danger-bg)",
  border: "1px solid var(--app-danger-border)",
};

export const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const labelStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 13,
  fontWeight: 700,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 50,
  padding: "12px 16px",
  borderRadius: 16,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

export const primaryButtonStyle: CSSProperties = {
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.24)",
};

export const secondaryButtonStyle: CSSProperties = {
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid var(--app-secondary-border)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
};

export const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid var(--app-secondary-border)",
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  textDecoration: "none",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
};

export const tableHeaderStyle: CSSProperties = {
  marginBottom: 16,
};

export const tableSubtitleStyle: CSSProperties = {
  color: "var(--app-muted)",
  margin: "8px 0 0",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "var(--app-heading)",
  minWidth: 980,
};

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "0 0 14px",
  color: "var(--app-muted-strong)",
  fontSize: 12,
  fontWeight: 700,
  borderBottom: "1px solid var(--app-table-border)",
};

export const tdStyle: CSSProperties = {
  padding: "16px 8px 16px 0",
  borderBottom: "1px solid var(--app-table-border-soft)",
  verticalAlign: "top",
};

export const subCellStyle: CSSProperties = {
  marginTop: 4,
  color: "var(--app-muted)",
  fontSize: 12,
};

export const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

export const emptyCellStyle: CSSProperties = {
  padding: "24px 0",
  color: "var(--app-muted)",
  textAlign: "center",
};
