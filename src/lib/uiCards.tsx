import type { CSSProperties } from "react";

export function toTransparent(color: string, alpha: number) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SummaryGlowCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        ...summaryCardStyle,
        boxShadow: `0 18px 36px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(147, 197, 253, 0.14), 0 0 42px ${toTransparent(
          accent,
          0.24
        )}`,
      }}
    >
      <div
        style={{
          ...summaryGlowStyle,
          background: `radial-gradient(circle, ${toTransparent(
            accent,
            0.36
          )} 0%, transparent 70%)`,
        }}
      />
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
    </div>
  );
}

const summaryCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "var(--app-card-elevated-bg)",
  borderRadius: 22,
  padding: 18,
  border: "1px solid var(--app-border-soft)",
};

const summaryGlowStyle: CSSProperties = {
  position: "absolute",
  top: -24,
  right: -10,
  width: 88,
  height: 88,
  borderRadius: "50%",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
};

const summaryValueStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 30,
  fontWeight: 800,
  color: "var(--app-heading)",
};
