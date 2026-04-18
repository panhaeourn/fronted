import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = { padding: 24, color: "var(--app-heading)" };
export const loadingStyle: CSSProperties = { padding: 24, color: "var(--app-heading)" };
export const dashboardShellStyle: CSSProperties = {
  minHeight: "100%",
  color: "var(--app-heading)",
  background: "var(--app-main-bg)",
  borderRadius: 28,
  padding: 28,
  boxSizing: "border-box",
  boxShadow: "var(--app-panel-shadow)",
  border: "var(--app-panel-border)",
};
export const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "center",
  marginBottom: 24,
  flexWrap: "wrap",
};
export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
};
export const panelSubtitleStyle: CSSProperties = {
  color: "var(--app-muted)",
  margin: "8px 0 0",
};
export const panelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 20,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};
export const welcomePanelStyle: CSSProperties = {
  minHeight: 220,
  background:
    "radial-gradient(circle at 70% 35%, rgba(79, 117, 255, 0.42), transparent 24%), radial-gradient(circle at 62% 42%, rgba(126, 231, 255, 0.18), transparent 18%), var(--app-card-elevated-bg)",
};
export const heroChartPanelStyle: CSSProperties = {
  minHeight: 220,
  gridColumn: "span 2",
};
export const homeFilterChipLinkStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid var(--app-border-strong)",
  background: "var(--app-secondary-bg)",
  color: "var(--app-heading)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.02em",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--app-panel-shadow)",
};
export const homeDetailLinkStyle: CSSProperties = {
  ...homeFilterChipLinkStyle,
  background: "linear-gradient(135deg, rgba(61, 118, 255, 0.96), rgba(33, 211, 255, 0.9))",
  border: "1px solid rgba(191, 219, 254, 0.28)",
  color: "#ffffff",
};
export const homeSummaryMiniCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-panel-shadow)",
};
export const homeSummaryMiniLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
export const homeSummaryMiniValueStyle: CSSProperties = {
  marginTop: 8,
  color: "var(--app-heading)",
  fontSize: 28,
  fontWeight: 800,
};
export const primaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background: "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 700,
  boxShadow: "0 14px 30px rgba(33, 126, 255, 0.3)",
};
export const primaryButtonLinkStyle: CSSProperties = {
  ...primaryButtonStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};
export const ghostLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  color: "var(--app-secondary-text)",
  padding: "11px 16px",
  borderRadius: 14,
  background: "var(--app-secondary-bg)",
  border: "1px solid var(--app-secondary-border)",
  boxShadow: "var(--app-glow-soft)",
};
export const actionLinkStyle: CSSProperties = {
  ...ghostLinkStyle,
  justifyContent: "space-between",
  background: "var(--app-card-solid-bg-strong)",
};
export const errorStyle: CSSProperties = {
  marginBottom: 18,
  padding: "14px 16px",
  borderRadius: 16,
  color: "#ffd3d3",
  background: "rgba(146, 37, 37, 0.34)",
  border: "1px solid rgba(248, 113, 113, 0.3)",
};
export const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 16,
  marginBottom: 22,
};
export const threeColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
  marginBottom: 22,
};
export const twoColumnWideGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1.65fr) minmax(280px, 1fr)",
  gap: 18,
  marginBottom: 22,
};
export const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
  marginBottom: 22,
};
export const chartGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  alignItems: "end",
  gap: 14,
  height: 220,
  paddingTop: 10,
};
export const chartBarWrapStyle: CSSProperties = {
  height: 150,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};
export const lineChartWrapStyle: CSSProperties = {
  marginTop: 10,
};
export const lineChartSvgStyle: CSSProperties = {
  width: "100%",
  height: 250,
  display: "block",
  overflow: "visible",
};
export const donutWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "150px 1fr",
  gap: 18,
  alignItems: "center",
};
export const donutOuterStyle: CSSProperties = {
  width: 150,
  height: 150,
  borderRadius: "50%",
  position: "relative",
  justifySelf: "center",
  boxShadow: "var(--app-glow-soft)",
};
export const donutInnerStyle: CSSProperties = {
  position: "absolute",
  inset: 26,
  borderRadius: "50%",
  background: "var(--app-card-solid-bg-strong)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
};
export const statusRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 14,
  background: "var(--app-card-solid-bg)",
  boxShadow: "var(--app-glow-soft)",
};
export const activityRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};
export const activityDetailStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
  marginTop: 4,
};
export const activityBadgeStyle: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  minWidth: 72,
  padding: "5px 10px",
  borderRadius: 999,
  background: "rgba(96, 165, 250, 0.18)",
  color: "#a8d1ff",
  fontSize: 12,
  fontWeight: 700,
};
export const activityTimeStyle: CSSProperties = {
  marginTop: 8,
  color: "var(--app-muted)",
  fontSize: 12,
};
export const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  color: "var(--app-muted)",
  boxShadow: "var(--app-glow-soft)",
};
export const tableHeadStyle: CSSProperties = {
  textAlign: "left",
  color: "var(--app-muted-strong)",
  fontWeight: 700,
  fontSize: 12,
  padding: "0 0 12px",
  borderBottom: "1px solid var(--app-table-border)",
};
export const tableCellStyle: CSSProperties = {
  padding: "14px 0",
  borderBottom: "1px solid var(--app-table-border-soft)",
  color: "var(--app-heading)",
};
export const guestBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(96, 165, 250, 0.16)",
  color: "var(--app-accent-soft)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
export const guestHeadingStyle: CSSProperties = {
  margin: "18px 0 10px",
  fontSize: "clamp(2rem, 4vw, 3rem)",
};
export const guestTextStyle: CSSProperties = {
  color: "var(--app-subtle-text)",
  maxWidth: 700,
  lineHeight: 1.8,
};
export const guestActionsStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 18,
};
export const summaryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};
export const summaryTitleWrapStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};
export const summaryFiltersStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};
export const summaryMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};
export const summaryTotalStyle: CSSProperties = {
  color: "var(--app-heading)",
  fontSize: 13,
  fontWeight: 800,
};
export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

export function metricCardStyle(accent: string): CSSProperties {
  return {
    position: "relative",
    overflow: "hidden",
    background: "var(--app-card-elevated-bg)",
    borderRadius: 22,
    padding: 18,
    border: "1px solid var(--app-border-soft)",
    boxShadow: `0 18px 36px rgba(0, 0, 0, 0.24), 0 0 32px ${toTransparent(accent, 0.2)}`,
  };
}

export function metricCardGlowStyle(accent: string): CSSProperties {
  return {
    position: "absolute",
    top: -34,
    right: -18,
    width: 132,
    height: 132,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${toTransparent(accent, 0.72)} 0%, ${toTransparent(accent, 0.36)} 34%, ${toTransparent(accent, 0.14)} 56%, transparent 78%)`,
    filter: "blur(10px)",
    opacity: 0.98,
  };
}

function toTransparent(color: string, alpha: number) {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
