type AlertDialogProps = {
  open: boolean;
  title: string;
  message: string;
  buttonText?: string;
  tone?: "success" | "error" | "info";
  onClose: () => void;
};

export default function AlertDialog({
  open,
  title,
  message,
  buttonText = "OK",
  tone = "info",
  onClose,
}: AlertDialogProps) {
  if (!open) return null;

  const palette = tonePalettes[tone];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
        <div
          style={{
            ...iconWrapStyle,
            background: palette.badgeBg,
            color: palette.badgeText,
          }}
        >
          <div style={{ ...iconGlowStyle, background: palette.glow }} />
          <span style={{ position: "relative" }}>{palette.icon}</span>
        </div>

        <div style={{ ...eyebrowStyle, color: palette.eyebrowColor }}>
          {palette.eyebrow}
        </div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>

        <div style={actionsStyle}>
          <button type="button" onClick={onClose} style={buttonStyle}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

const tonePalettes = {
  success: {
    icon: "OK",
    eyebrow: "Success",
    eyebrowColor: "#6ee7b7",
    badgeBg:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(52, 211, 153, 0.2))",
    badgeText: "#d1fae5",
    glow: "radial-gradient(circle, rgba(52, 211, 153, 0.38), transparent 70%)",
  },
  error: {
    icon: "!",
    eyebrow: "Something Went Wrong",
    eyebrowColor: "#fda4af",
    badgeBg:
      "linear-gradient(135deg, rgba(190, 24, 93, 0.28), rgba(251, 113, 133, 0.18))",
    badgeText: "#ffe4e6",
    glow: "radial-gradient(circle, rgba(251, 113, 133, 0.34), transparent 70%)",
  },
  info: {
    icon: "i",
    eyebrow: "Notice",
    eyebrowColor: "#93c5fd",
    badgeBg:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(34, 211, 238, 0.18))",
    badgeText: "#dbeafe",
    glow: "radial-gradient(circle, rgba(96, 165, 250, 0.34), transparent 70%)",
  },
} as const;

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "var(--app-overlay-bg)",
  backdropFilter: "blur(12px)",
  zIndex: 10000,
};

const dialogStyle: React.CSSProperties = {
  width: "min(460px, 100%)",
  borderRadius: 30,
  padding: "26px 24px 22px",
  background:
    "radial-gradient(circle at top right, rgba(96, 165, 250, 0.14), transparent 30%), var(--app-dialog-bg)",
  border: "1px solid rgba(191, 219, 254, 0.16)",
  boxShadow: "var(--app-glow-strong)",
  color: "var(--app-heading)",
};

const iconWrapStyle: React.CSSProperties = {
  position: "relative",
  width: 56,
  height: 56,
  borderRadius: 18,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 800,
  overflow: "hidden",
  marginBottom: 18,
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const iconGlowStyle: React.CSSProperties = {
  position: "absolute",
  inset: -14,
  filter: "blur(14px)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 8px",
  fontSize: 25,
  lineHeight: 1.18,
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
  fontSize: 15,
};

const actionsStyle: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  justifyContent: "flex-end",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 46,
  minWidth: 110,
  padding: "10px 18px",
  borderRadius: 14,
  border: "1px solid rgba(191, 219, 254, 0.24)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.24), 0 0 28px rgba(96, 165, 250, 0.18)",
};
