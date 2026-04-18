import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = {
  padding: 24,
  color: "var(--app-heading)",
};

export const headerStyle: CSSProperties = {
  marginBottom: 22,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
};

export const errorStyle: CSSProperties = {
  color: "var(--app-danger-text)",
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: 14,
  background: "var(--app-danger-bg)",
  border: "1px solid var(--app-danger-border)",
};

export const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.85fr)",
  gap: 20,
  alignItems: "start",
};

export const formPanelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 22,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

export const sidePanelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 22,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
  position: "sticky",
  top: 20,
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 16,
};

export const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

export const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const fieldBlockWideStyle: CSSProperties = {
  ...fieldBlockStyle,
  gridColumn: "1 / -1",
};

export const coursePickerShellStyle: CSSProperties = {
  position: "relative",
};

export const labelStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 13,
  fontWeight: 700,
};

export const helperTextStyle: CSSProperties = {
  marginTop: 8,
  color: "var(--app-muted-strong)",
  fontSize: 13,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 52px 12px 14px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

export const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  color: "var(--app-muted)",
  background: "var(--app-input-readonly-bg)",
};

export const pickerToggleStyle: CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  borderRadius: 10,
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--app-muted-strong)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  boxShadow: "var(--app-glow-soft)",
};

export const pickerChevronStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1,
  transform: "translateY(-1px)",
};

export const courseDropdownStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  right: 0,
  zIndex: 20,
  borderRadius: 18,
  border: "1px solid var(--app-border-strong)",
  background: "var(--app-card-elevated-bg)",
  boxShadow: "var(--app-glow-strong)",
  overflow: "hidden",
};

export const courseDropdownHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderBottom: "1px solid var(--app-border-soft)",
  color: "var(--app-muted-strong)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export const courseDropdownListStyle: CSSProperties = {
  maxHeight: 320,
  overflowY: "auto",
  padding: 10,
  display: "grid",
  gap: 8,
};

export const courseMatchButtonStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg-strong)",
  color: "var(--app-heading)",
  boxShadow: "var(--app-glow-soft)",
  cursor: "pointer",
};

export const courseMatchButtonSelectedStyle: CSSProperties = {
  border: "1px solid rgba(96, 165, 250, 0.45)",
  background: "rgba(96, 165, 250, 0.12)",
};

export const courseOptionRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
};

export const courseOptionTitleStyle: CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.35,
};

export const courseOptionPriceStyle: CSSProperties = {
  color: "var(--app-accent-soft)",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

export const courseOptionMetaStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  marginTop: 4,
};

export const noMatchStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 12,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
};

export const selectedCourseStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(96, 165, 250, 0.12)",
  color: "var(--app-accent-soft)",
  border: "1px solid var(--app-border-soft)",
  fontSize: 13,
};

export const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 22,
};

export const primaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.3), 0 0 28px rgba(96, 165, 250, 0.24)",
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

export const sideTextStyle: CSSProperties = {
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
  marginTop: 0,
};

export const summaryCardStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  marginBottom: 14,
  boxShadow: "var(--app-glow-soft)",
};

export const summaryLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
};

export const summaryValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  marginTop: 8,
  color: "var(--app-heading)",
};

export const qrPanelStyle: CSSProperties = {
  marginTop: 18,
  borderRadius: 28,
  overflow: "hidden",
  background: "#f3f4f6",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
};

export const qrImageStyle: CSSProperties = {
  width: "100%",
  maxWidth: 230,
  background: "white",
  padding: 8,
  borderRadius: 16,
  boxSizing: "border-box",
};

export const qrHelpStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "#6b7280",
  wordBreak: "break-word",
  textAlign: "center",
};

export const emptyQrStyle: CSSProperties = {
  marginTop: 18,
  padding: 24,
  borderRadius: 20,
  background: "var(--app-card-solid-bg)",
  color: "var(--app-muted)",
  border: "1px dashed var(--app-border-strong)",
  boxShadow: "var(--app-glow-soft)",
};

export const khqrHeaderStyle: CSSProperties = {
  background: "#df3527",
  color: "#ffffff",
  padding: "20px 24px 16px",
  position: "relative",
  textAlign: "center",
};

export const khqrHeaderTextStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const khqrHeaderCornerStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: -1,
  width: 0,
  height: 0,
  borderLeft: "36px solid transparent",
  borderTop: "36px solid #ffffff",
};

export const khqrBodyStyle: CSSProperties = {
  background: "#ffffff",
  padding: "18px 24px 24px",
};

export const khqrMerchantStyle: CSSProperties = {
  fontSize: 14,
  color: "#1f2937",
  marginBottom: 10,
};

export const khqrAmountRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  flexWrap: "wrap",
};

export const khqrAmountStyle: CSSProperties = {
  fontSize: 30,
  fontWeight: 800,
  color: "#111827",
};

export const khqrCurrencyStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#374151",
};

export const khqrDividerStyle: CSSProperties = {
  borderTop: "2px dashed #d1d5db",
  margin: "18px 0 22px",
};

export const khqrImageWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
};
