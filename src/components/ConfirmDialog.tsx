type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmStyle =
    tone === "danger"
      ? dangerButtonStyle
      : primaryButtonStyle;

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
        <div style={eyebrowStyle}>Please Confirm</div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>

        <div style={actionsStyle}>
          <button type="button" onClick={onCancel} style={cancelButtonStyle}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} style={confirmStyle}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "var(--app-overlay-bg)",
  backdropFilter: "blur(10px)",
  zIndex: 10000,
};

const dialogStyle: React.CSSProperties = {
  width: "min(460px, 100%)",
  borderRadius: 28,
  padding: "24px 24px 22px",
  background: "var(--app-dialog-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-strong)",
  color: "var(--app-heading)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 8px",
  fontSize: 24,
  lineHeight: 1.2,
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
  fontSize: 15,
};

const actionsStyle: React.CSSProperties = {
  marginTop: 22,
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const sharedButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 18px",
  borderRadius: 14,
  border: "1px solid transparent",
  fontWeight: 700,
  cursor: "pointer",
};

const cancelButtonStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  borderColor: "var(--app-secondary-border)",
  boxShadow: "var(--app-glow-soft)",
};

const primaryButtonStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  borderColor: "rgba(191, 219, 254, 0.24)",
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.18)",
};

const dangerButtonStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  background:
    "linear-gradient(135deg, rgba(155, 69, 87, 0.94), rgba(204, 99, 92, 0.9))",
  color: "#ffffff",
  borderColor: "rgba(248, 113, 113, 0.22)",
  boxShadow: "0 12px 24px rgba(127, 29, 29, 0.22)",
};
