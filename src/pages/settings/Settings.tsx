import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../lib/language";

type SettingsSection = "profile" | "security" | "notifications" | "appearance" | "help";

type SettingsUser = {
  id: number;
  email: string;
  username: string;
  name: string;
  picture?: string;
  role: "ADMIN" | "RECEPTIONIST" | "USER";
};

type NotificationPreferences = {
  paymentAlerts: boolean;
  courseUpdates: boolean;
  systemAnnouncements: boolean;
};

type SettingsProps = {
  me: SettingsUser | null;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  initialSection?: SettingsSection;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  paymentAlerts: true,
  courseUpdates: true,
  systemAnnouncements: false,
};

export default function Settings({
  me,
  theme,
  setTheme,
  initialSection = "profile",
}: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    const raw = localStorage.getItem("settings-notifications");
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;

    try {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  });

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    localStorage.setItem("settings-notifications", JSON.stringify(notificationPreferences));
  }, [notificationPreferences]);

  const sections = useMemo(
    () =>
      [
        {
          id: "profile" as const,
          label: t("settings.profile"),
          description: t("settings.profileDesc"),
          icon: <ProfileIcon />,
        },
        {
          id: "security" as const,
          label: t("settings.security"),
          description: t("settings.securityDesc"),
          icon: <SecurityIcon />,
        },
        {
          id: "notifications" as const,
          label: t("settings.notifications"),
          description: t("settings.notificationsDesc"),
          icon: <NotificationIcon />,
        },
        {
          id: "appearance" as const,
          label: t("settings.appearance"),
          description: t("settings.appearanceDesc"),
          icon: <AppearanceIcon />,
        },
        {
          id: "help" as const,
          label: t("settings.help"),
          description: t("settings.helpDesc"),
          icon: <HelpIcon />,
        },
      ],
    [t]
  );

  const activeMeta = sections.find((section) => section.id === activeSection) || sections[0];

  if (!me) {
    return (
      <div style={pageStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>{t("settings.titleShort")}</div>
            <h1 style={titleStyle}>{t("settings.title")}</h1>
            <p style={subtitleStyle}>{t("settings.signInPrompt")}</p>
          </div>
        </div>

        <div style={emptyStateStyle}>
          <div style={emptyStateTitleStyle}>{t("settings.needSignIn")}</div>
          <div style={emptyStateTextStyle}>{t("settings.needSignInDesc")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>{t("settings.titleShort")}</div>
          <h1 style={titleStyle}>{t("settings.title")}</h1>
          <p style={subtitleStyle}>{t("settings.subtitle")}</p>
        </div>

        <div style={heroCardStyle}>
          <div style={heroCardLabelStyle}>{t("app.signedInAs")}</div>
          <div style={heroCardNameStyle}>{me.name || me.username || me.email}</div>
          <div style={heroCardSubStyle}>{me.role}</div>
        </div>
      </div>

      <div style={layoutStyle}>
        <aside style={navPanelStyle}>
          <div style={navTitleStyle}>{t("settings.titleShort")}</div>
          <div style={navListStyle}>
            {sections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    ...navButtonStyle,
                    ...(isActive ? navButtonActiveStyle : null),
                  }}
                >
                  <span style={navIconStyle}>{section.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={navButtonTitleStyle}>{section.label}</span>
                    <span style={navButtonDescriptionStyle}>{section.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section style={contentPanelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionHeaderEyebrowStyle}>{t("settings.currentSection")}</div>
              <h2 style={sectionHeaderTitleStyle}>{activeMeta.label}</h2>
              <p style={sectionHeaderDescriptionStyle}>{activeMeta.description}</p>
            </div>
          </div>

          {activeSection === "profile" && (
            <div style={sectionStackStyle}>
              <div style={profileHeaderStyle}>
                {me.picture ? (
                  <img src={me.picture} alt="Profile" style={avatarStyle} />
                ) : (
                  <div style={avatarFallbackStyle}>
                    {(me.name || me.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div style={profileNameStyle}>{me.name || "-"}</div>
                  <div style={profileEmailStyle}>{me.email}</div>
                  <div style={profileRoleStyle}>{me.role}</div>
                </div>
              </div>

              <div style={gridStyle}>
                <InfoCard label={t("settings.fullName")} value={me.name || "-"} />
                <InfoCard label={t("settings.username")} value={me.username || "-"} />
                <InfoCard label={t("settings.emailAddress")} value={me.email || "-"} />
                <InfoCard label={t("app.role")} value={me.role || "-"} />
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div style={sectionStackStyle}>
              <div style={gridStyle}>
                <InfoCard label={t("settings.signInMethod")} value={t("settings.protectedSession")} />
                <InfoCard label={t("settings.primaryIdentity")} value={me.email || "-"} />
                <InfoCard label={t("settings.accessLevel")} value={me.role} />
                <InfoCard label={t("settings.recommendation")} value={t("settings.strongPassword")} />
              </div>

              <div style={noteCardStyle}>
                <div style={noteCardTitleStyle}>{t("settings.securityGuidance")}</div>
                <ul style={bulletListStyle}>
                  <li>{t("settings.securityGuide1")}</li>
                  <li>{t("settings.securityGuide2")}</li>
                  <li>{t("settings.securityGuide3")}</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div style={sectionStackStyle}>
              <SettingToggle
                label={t("settings.paymentAlerts")}
                description={t("settings.paymentAlertsDesc")}
                checked={notificationPreferences.paymentAlerts}
                onToggle={() =>
                  setNotificationPreferences((prev) => ({
                    ...prev,
                    paymentAlerts: !prev.paymentAlerts,
                  }))
                }
              />

              <SettingToggle
                label={t("settings.courseUpdates")}
                description={t("settings.courseUpdatesDesc")}
                checked={notificationPreferences.courseUpdates}
                onToggle={() =>
                  setNotificationPreferences((prev) => ({
                    ...prev,
                    courseUpdates: !prev.courseUpdates,
                  }))
                }
              />

              <SettingToggle
                label={t("settings.systemAnnouncements")}
                description={t("settings.systemAnnouncementsDesc")}
                checked={notificationPreferences.systemAnnouncements}
                onToggle={() =>
                  setNotificationPreferences((prev) => ({
                    ...prev,
                    systemAnnouncements: !prev.systemAnnouncements,
                  }))
                }
              />
            </div>
          )}

          {activeSection === "appearance" && (
            <div style={sectionStackStyle}>
              <div style={settingBlockStyle}>
                <div style={settingBlockHeaderStyle}>
                  <div>
                    <div style={settingBlockTitleStyle}>{t("settings.language")}</div>
                    <div style={settingBlockDescriptionStyle}>{t("settings.languageDesc")}</div>
                  </div>
                </div>

                <div style={appearanceGridStyle}>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    style={{
                      ...themeChoiceStyle,
                      ...(language === "en" ? themeChoiceActiveStyle : null),
                    }}
                  >
                    <div style={languageBadgeStyle}>EN</div>
                    <div style={themeChoiceTitleStyle}>{t("settings.english")}</div>
                    <div style={themeChoiceDescriptionStyle}>{t("settings.englishDesc")}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("km")}
                    style={{
                      ...themeChoiceStyle,
                      ...(language === "km" ? themeChoiceActiveStyle : null),
                    }}
                  >
                    <div style={languageBadgeStyle}>ខ្មែរ</div>
                    <div style={themeChoiceTitleStyle}>{t("settings.khmer")}</div>
                    <div style={themeChoiceDescriptionStyle}>{t("settings.khmerDesc")}</div>
                  </button>
                </div>
              </div>

              <div style={appearanceGridStyle}>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  style={{
                    ...themeChoiceStyle,
                    ...(theme === "dark" ? themeChoiceActiveStyle : null),
                  }}
                >
                  <div style={themePreviewDarkStyle} />
                  <div style={themeChoiceTitleStyle}>{t("settings.darkMode")}</div>
                  <div style={themeChoiceDescriptionStyle}>{t("settings.darkModeDesc")}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  style={{
                    ...themeChoiceStyle,
                    ...(theme === "light" ? themeChoiceActiveStyle : null),
                  }}
                >
                  <div style={themePreviewLightStyle} />
                  <div style={themeChoiceTitleStyle}>{t("settings.lightMode")}</div>
                  <div style={themeChoiceDescriptionStyle}>{t("settings.lightModeDesc")}</div>
                </button>
              </div>

              <div style={noteCardStyle}>
                <div style={noteCardTitleStyle}>{t("settings.currentAppearance")}</div>
                <div style={noteCardTextStyle}>
                  {t("settings.currentAppearanceText", {
                    mode: theme === "dark" ? t("settings.darkMode") : t("settings.lightMode"),
                  })}
                </div>
                <div style={{ ...noteCardTextStyle, marginTop: 6 }}>
                  {t("settings.selectedLanguage", {
                    language: language === "km" ? t("settings.khmer") : t("settings.english"),
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === "help" && (
            <div style={sectionStackStyle}>
              <div style={gridStyle}>
                <InfoCard label={t("settings.supportContact")} value="Eourn Panha" />
                <InfoCard label={t("settings.phoneNumber")} value="070458142" />
                <InfoCard
                  label={t("settings.telegram")}
                  value={
                    <div style={socialCardValueStyle}>
                      <span style={socialIconWrapStyle}>
                        <TelegramIcon />
                      </span>
                      <span>{t("settings.telegramValue")}</span>
                    </div>
                  }
                />
                <InfoCard
                  label={t("settings.facebook")}
                  value={
                    <a
                      href="https://www.facebook.com/share/1Cj8TtxCEM/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noreferrer"
                      style={socialLinkStyle}
                    >
                      <span style={socialIconWrapStyle}>
                        <FacebookIcon />
                      </span>
                      <span>{t("settings.openFacebook")}</span>
                    </a>
                  }
                />
              </div>

              <div style={noteCardStyle}>
                <div style={noteCardTitleStyle}>{t("settings.needHelp")}</div>
                <ul style={bulletListStyle}>
                  <li>{t("settings.help1")}</li>
                  <li>{t("settings.help2")}</li>
                  <li>{t("settings.help3")}</li>
                  <li>{t("settings.help4")}</li>
                  <li>{t("settings.help5")}</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={toggleRowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={toggleLabelStyle}>{label}</div>
        <div style={toggleDescriptionStyle}>{description}</div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        style={{
          ...toggleButtonStyle,
          ...(checked ? toggleButtonActiveStyle : null),
        }}
        aria-pressed={checked}
      >
        <span
          style={{
            ...toggleThumbStyle,
            ...(checked ? toggleThumbActiveStyle : null),
          }}
        />
      </button>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  color: "var(--app-heading)",
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  marginBottom: 22,
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 8px",
  fontSize: "clamp(1.7rem, 2.8vw, 2.4rem)",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
  maxWidth: 760,
};

const heroCardStyle: React.CSSProperties = {
  minWidth: 240,
  padding: "18px 20px",
  borderRadius: 20,
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

const heroCardLabelStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const heroCardNameStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 20,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const heroCardSubStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--app-accent-soft)",
  fontSize: 13,
  fontWeight: 700,
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "280px minmax(0, 1fr)",
  gap: 20,
  alignItems: "start",
};

const navPanelStyle: React.CSSProperties = {
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
  borderRadius: 24,
  padding: 18,
  position: "sticky",
  top: 20,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "var(--app-muted-strong)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 14,
};

const navListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const navButtonStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg)",
  color: "var(--app-heading)",
  borderRadius: 18,
  padding: "14px 14px",
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  gap: 12,
  alignItems: "start",
  boxShadow: "var(--app-glow-soft)",
};

const navButtonActiveStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(61, 118, 255, 0.18), rgba(33, 211, 255, 0.14))",
  border: "1px solid rgba(96, 165, 250, 0.32)",
};

const navIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  background: "var(--app-link-bg)",
  color: "var(--app-accent-soft)",
};

const navButtonTitleStyle: React.CSSProperties = {
  display: "block",
  fontSize: 15,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const navButtonDescriptionStyle: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "var(--app-muted)",
  fontSize: 12,
  lineHeight: 1.45,
};

const contentPanelStyle: React.CSSProperties = {
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
  borderRadius: 24,
  padding: 22,
  minHeight: 560,
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
  paddingBottom: 18,
  borderBottom: "1px solid var(--app-border-soft)",
};

const sectionHeaderEyebrowStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const sectionHeaderTitleStyle: React.CSSProperties = {
  margin: "8px 0 6px",
  fontSize: 28,
  lineHeight: 1.15,
};

const sectionHeaderDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
};

const sectionStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const profileHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  padding: "18px 20px",
  borderRadius: 22,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const avatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid var(--app-border-soft)",
};

const avatarFallbackStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 800,
};

const profileNameStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const profileEmailStyle: React.CSSProperties = {
  marginTop: 4,
  color: "var(--app-subtle-text)",
  fontSize: 15,
};

const profileRoleStyle: React.CSSProperties = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(96, 165, 250, 0.14)",
  color: "var(--app-accent-soft)",
  border: "1px solid var(--app-border-soft)",
  fontSize: 12,
  fontWeight: 700,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const infoCardStyle: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: 18,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const infoLabelStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const infoValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: "var(--app-heading)",
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.35,
  wordBreak: "break-word",
};

const socialLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  color: "var(--app-accent-soft)",
  textDecoration: "none",
  fontWeight: 800,
};

const socialCardValueStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const socialIconWrapStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  background: "var(--app-link-bg)",
  color: "var(--app-accent-soft)",
  flexShrink: 0,
};

const noteCardStyle: React.CSSProperties = {
  padding: "18px 20px",
  borderRadius: 20,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const noteCardTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const noteCardTextStyle: React.CSSProperties = {
  marginTop: 8,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
};

const bulletListStyle: React.CSSProperties = {
  margin: "12px 0 0",
  paddingLeft: 18,
  color: "var(--app-subtle-text)",
  lineHeight: 1.75,
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: "18px 20px",
  borderRadius: 20,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const toggleLabelStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const toggleDescriptionStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--app-subtle-text)",
  fontSize: 14,
  lineHeight: 1.65,
  maxWidth: 560,
};

const toggleButtonStyle: React.CSSProperties = {
  width: 58,
  height: 34,
  borderRadius: 999,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-input-readonly-bg)",
  display: "inline-flex",
  alignItems: "center",
  padding: 4,
  boxSizing: "border-box",
  transition: "all 180ms ease",
};

const toggleButtonActiveStyle: React.CSSProperties = {
  background: "rgba(96, 165, 250, 0.18)",
  border: "1px solid rgba(96, 165, 250, 0.32)",
};

const toggleThumbStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "var(--app-muted)",
  transition: "all 180ms ease",
};

const toggleThumbActiveStyle: React.CSSProperties = {
  background: "#5ec8ff",
  transform: "translateX(24px)",
};

const appearanceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const settingBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const settingBlockHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const settingBlockTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const settingBlockDescriptionStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
};

const themeChoiceStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 18,
  borderRadius: 20,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg)",
  boxShadow: "var(--app-glow-soft)",
  color: "var(--app-heading)",
};

const languageBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 76,
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 999,
  background: "var(--app-link-bg)",
  color: "var(--app-accent-soft)",
  fontWeight: 800,
  marginBottom: 14,
};

const themeChoiceActiveStyle: React.CSSProperties = {
  border: "1px solid rgba(96, 165, 250, 0.34)",
  boxShadow: "var(--app-glow-strong)",
};

const themePreviewBaseStyle: React.CSSProperties = {
  height: 110,
  borderRadius: 16,
  marginBottom: 14,
  border: "1px solid var(--app-border-soft)",
};

const themePreviewDarkStyle: React.CSSProperties = {
  ...themePreviewBaseStyle,
  background:
    "radial-gradient(circle at top right, rgba(96, 165, 250, 0.22), transparent 28%), linear-gradient(180deg, #13213f 0%, #0b1630 38%, #09111f 100%)",
};

const themePreviewLightStyle: React.CSSProperties = {
  ...themePreviewBaseStyle,
  background:
    "radial-gradient(circle at top right, rgba(96, 165, 250, 0.16), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f5f8ff 40%, #eef4ff 100%)",
};

const themeChoiceTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const themeChoiceDescriptionStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
};

const emptyStateStyle: React.CSSProperties = {
  padding: "26px 28px",
  borderRadius: 24,
  background: "var(--app-panel-bg)",
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

const emptyStateTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const emptyStateTextStyle: React.CSSProperties = {
  marginTop: 8,
  color: "var(--app-subtle-text)",
};

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M10 10a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 16a6.2 6.2 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M10 3.4 15.4 6v3.8c0 3.2-2.1 5.3-5.4 6.6-3.3-1.3-5.4-3.4-5.4-6.6V6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 9.8 9.6 11l2.3-2.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M10 16.2a1.9 1.9 0 0 0 1.9-1.7H8.1A1.9 1.9 0 0 0 10 16.2Z" fill="currentColor" />
      <path d="M5.8 13.8h8.4l-1.1-1.8v-2a3.1 3.1 0 1 0-6.2 0v2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M10 2.8a7.2 7.2 0 1 0 7.2 7.2A5.4 5.4 0 0 1 10 2.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M7.8 7.1a2.6 2.6 0 1 1 4.1 2.1c-.9.6-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M17 4 3.8 9.1c-.9.4-.9 1.1-.1 1.3l3.4 1.1 1.3 4c.2.6.3.9.7.9.3 0 .5-.2.7-.4l1.9-1.9 3.9 2.9c.7.4 1.2.2 1.4-.7L18.7 5c.2-.9-.3-1.4-1.2-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M11.2 17v-6h2l.4-2.4h-2.4V7.1c0-.7.2-1.2 1.2-1.2h1.3V3.8c-.2 0-.9-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8H7v2.4h2.1v6z"
        fill="currentColor"
      />
    </svg>
  );
}
