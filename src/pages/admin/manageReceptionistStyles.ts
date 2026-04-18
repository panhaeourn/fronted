import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = {
  padding: 20,
  color: "var(--app-heading)",
};

export const errorTextStyle: CSSProperties = {
  color: "var(--app-danger-text)",
  marginBottom: 12,
};

export const sectionPanelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
  boxShadow: "var(--app-panel-shadow)",
};

export const sectionHeadingStyle: CSSProperties = {
  marginTop: 0,
};

export const formStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  maxWidth: 500,
};

export const simpleGridStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

export const generatedCodeCardStyle: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 10,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
};

export const activeStatusStyle: CSSProperties = {
  color: "#3b82f6",
};

export const inputStyle: CSSProperties = {
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
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

export const dangerButtonStyle: CSSProperties = {
  minHeight: 48,
  minWidth: 100,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid rgba(248, 113, 113, 0.24)",
  background: "rgba(239, 68, 68, 0.18)",
  color: "#fecaca",
  fontWeight: 700,
  boxShadow: "0 0 24px rgba(248, 113, 113, 0.18)",
  cursor: "pointer",
};

export const receptionistCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  display: "grid",
  gap: 14,
};

export const receptionistHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

export const receptionistRoleStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
};

export const summaryWrapStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "var(--app-card-solid-bg-strong)",
  border: "1px solid var(--app-border-soft)",
};

export const summaryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
  flexWrap: "wrap",
};

export const summaryTitleStackStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const summaryTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: "var(--app-heading)",
};

export const chipRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

export const summaryActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

export const totalLabelStyle: CSSProperties = {
  color: "var(--app-heading)",
  fontSize: 13,
  fontWeight: 700,
};

export const emptySummaryStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 14,
};

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 10,
};

export const summaryMiniCardStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
};

export const summaryMiniLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const summaryMiniValueStyle: CSSProperties = {
  marginTop: 8,
  color: "var(--app-heading)",
  fontSize: 22,
  fontWeight: 800,
};

export const filterChipLinkStyle: CSSProperties = {
  minHeight: 30,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-secondary-bg)",
  color: "var(--app-heading)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  boxShadow: "var(--app-glow-soft)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const filterChipButtonStyle: CSSProperties = {
  ...filterChipLinkStyle,
  cursor: "pointer",
};

export const activeFilterChipButtonStyle: CSSProperties = {
  ...filterChipButtonStyle,
  background: "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  border: "1px solid rgba(191, 219, 254, 0.28)",
};

export const detailLinkStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid rgba(96, 165, 250, 0.28)",
  background: "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.02em",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--app-glow-soft)",
};
