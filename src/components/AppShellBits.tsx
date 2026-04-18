import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

export function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link className="sidebar-link-pop" style={linkStyle} to={to}>
      <span style={sidebarLinkInnerStyle}>
        <span style={sidebarIconWrapStyle}>{icon}</span>
        <span>{label}</span>
      </span>
    </Link>
  );
}

export const linkStyle: CSSProperties = {
  color: "var(--app-link-color)",
  textDecoration: "none",
  padding: "11px 14px",
  borderRadius: 14,
  background: "var(--app-link-bg)",
  border: "1px solid rgba(191, 219, 254, 0.18)",
  boxShadow: "0 0 24px rgba(96, 165, 250, 0.14)",
  fontSize: 14,
};

export const sidebarLinkInnerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  whiteSpace: "nowrap",
};

export const sidebarIconWrapStyle: CSSProperties = {
  width: 22,
  height: 22,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--app-accent-soft)",
  flexShrink: 0,
};

export const sectionTitle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1,
  marginTop: 14,
  marginBottom: 6,
};

export const toggleButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: 10,
  border: "var(--app-toggle-border)",
  background: "var(--app-toggle-bg)",
  color: "var(--app-toggle-color)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(6px)",
};

export const bottomActionStackStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  marginBottom: 12,
};

export function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="3" y="3" width="5" height="5" rx="1.4" fill="currentColor" opacity="0.95" />
      <rect x="11" y="3" width="6" height="4" rx="1.4" fill="currentColor" opacity="0.7" />
      <rect x="3" y="11" width="4" height="6" rx="1.4" fill="currentColor" opacity="0.7" />
      <rect x="9" y="9" width="8" height="8" rx="1.6" fill="currentColor" opacity="0.95" />
    </svg>
  );
}

export function CoursesIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path
        d="M5.5 3.5h8a1.5 1.5 0 0 1 1.5 1.5V16l-2.5-1.7-2.5 1.7-2.5-1.7L5 16V5a1.5 1.5 0 0 1 .5-1.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.2 7h5.6M7.2 10h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function LoginIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M12 4h2.2A1.8 1.8 0 0 1 16 5.8v8.4A1.8 1.8 0 0 1 14.2 16H12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M9 6.2 5.2 10 9 13.8M5.8 10H14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function RegisterIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M9 9.4a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M3.8 15.6a5.8 5.8 0 0 1 10.4-2.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M15 6v5M12.5 8.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function ClaimIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M10 3.4 15.5 6v3.9c0 3.3-2.2 5.4-5.5 6.7-3.3-1.3-5.5-3.4-5.5-6.7V6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m7.6 10 1.5 1.6 3.4-3.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path
        d="M8 3.6h4l.7 1.8 2 .8 1.8-.6 2 3.4-1.4 1.3v2.2l1.4 1.3-2 3.4-1.8-.6-2 .8-.7 1.8H8l-.7-1.8-2-.8-1.8.6-2-3.4 1.4-1.3v-2.2L1.5 8.9l2-3.4 1.8.6 2-.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function ManageCoursesIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M4.5 4.2h7.4a1.3 1.3 0 0 1 1.3 1.3v9.8a1.3 1.3 0 0 1-1.3 1.3H4.5a1.3 1.3 0 0 1-1.3-1.3V5.5a1.3 1.3 0 0 1 1.3-1.3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="m12.6 6.1 1.3-1.3a1.3 1.3 0 0 1 1.8 0l.5.5a1.3 1.3 0 0 1 0 1.8l-1.3 1.3M12.6 6.1l2.3 2.3M12.6 6.1 8.3 10.4l-.5 2.8 2.8-.5 4.3-4.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ReceptionistIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M8.6 9.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M3.8 15.6a5.6 5.6 0 0 1 9.2-3.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M14.8 6.1h2.7M16.15 4.75v2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function PaymentHistoryIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="3.2" y="4.8" width="13.6" height="10.4" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M3.8 8.2h12.4M6.3 11.7h2.8M12.2 11.7h1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function StudentMoneyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path
        d="M4.2 5.5h11.6a1.8 1.8 0 0 1 1.8 1.8v5.4a1.8 1.8 0 0 1-1.8 1.8H4.2a1.8 1.8 0 0 1-1.8-1.8V7.3a1.8 1.8 0 0 1 1.8-1.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 8.1h.01M14.5 11.9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M5 3.5h10v13l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 7.2h6M7 10.2h6M7 13.2h4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function NewReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M5 3.5h7l3 3v10a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 16.5V5A1.5 1.5 0 0 1 5 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 3.7v3.6h3.4M9.5 9.2v5M7 11.7h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function ReceiptListIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="4.2" y="3.8" width="11.6" height="12.4" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M7 7.1h6M7 10h6M7 12.9h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M8 4H5.8A1.8 1.8 0 0 0 4 5.8v8.4A1.8 1.8 0 0 0 5.8 16H8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 6.2 14.8 10 11 13.8M7 10h7.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
