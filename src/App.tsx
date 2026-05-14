import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import aiDarkLogo from "./assets/ai dark mode.png";
import aiWhiteLogo from "./assets/ai-white-mode.jpg";
import citoLogo from "./assets/CITO.svg";
import {
  bottomActionStackStyle,
  ClaimIcon,
  CoursesIcon,
  DashboardIcon,
  LoginIcon,
  LogoutIcon,
  ManageCoursesIcon,
  NewReceiptIcon,
  PaymentHistoryIcon,
  ReceptionistIcon,
  ReceiptIcon,
  ReceiptListIcon,
  RegisterIcon,
  StudentMoneyIcon,
  sectionTitle,
  SettingsIcon,
  SidebarLink,
  sidebarIconWrapStyle,
  toggleButtonStyle,
} from "./components/AppShellBits";
import ConfirmDialog from "./components/ConfirmDialog";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import { useAuth } from "./lib/auth-context";
import { useLanguage } from "./lib/language";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Courses from "./pages/courses/Courses";
import OAuthSuccess from "./pages/auth/OAuthSuccess";
import CourseDetail from "./pages/courses/CourseDetail";
import ClaimReceptionist from "./pages/reception/ClaimReceptionist";
import CitoReceiptForm from "./pages/reception/CitoReceiptForm";
import CitoReceiptPrint from "./pages/reception/CitoReceiptPrint";
import Settings from "./pages/settings/Settings";
import ReceiptList from "./pages/admin/ReceiptList";
import AdminPaymentHistory from "./pages/admin/AdminPaymentHistory";
import EditCourse from "./pages/admin/EditCourse";
import UploadCourseVideo from "./pages/admin/UploadCourseVideo";
import ManageReceptionist from "./pages/admin/ManageReceptionist";
import ReceptionistDailyMoney from "./pages/admin/ReceptionistDailyMoney";
import CitoAi from "./pages/ai/CitoAi";

function AppContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { me, signOut, isAdmin, isReceptionist, isUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("app-theme");
    return saved === "light" ? "light" : "dark";
  });
  const location = useLocation();
  const aiLogo = theme === "light" ? aiWhiteLogo : aiDarkLogo;
  const isReceiptPrintPage =
    location.pathname.startsWith("/reception/receipt/") &&
    location.pathname.endsWith("/print");
  const isAuthLandingPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);
  const isGuestWelcomePage = location.pathname === "/" && !me;
  const showSidebar = !!me && !isReceiptPrintPage && !isAuthLandingPage && !isGuestWelcomePage;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!showSidebar || !mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen, showSidebar]);

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={[
        "app-shell",
        showSidebar ? "app-shell--with-nav" : "app-shell--single",
        sidebarCollapsed ? "app-shell--collapsed" : "",
        mobileNavOpen ? "app-shell--mobile-nav-open" : "",
        isReceiptPrintPage ? "app-shell--print" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "relative",
        height: isReceiptPrintPage ? "auto" : undefined,
        minHeight: isReceiptPrintPage ? "100vh" : undefined,
        overflow: isReceiptPrintPage ? "visible" : undefined,
        background: isReceiptPrintPage
          ? "#ffffff"
          : "var(--app-shell-bg)",
      }}
    >
      {showSidebar && (
        <header className="app-mobile-topbar">
          <button
            className="app-mobile-menu-button"
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
              <path
                d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link to="/" className="app-mobile-brand" aria-label="CITO dashboard">
            <img src={citoLogo} alt="" />
            <span>CITO</span>
          </Link>

          <Link to="/settings" className="app-mobile-avatar" aria-label="Open profile settings">
            {me?.picture ? (
              <img src={me.picture} alt="" />
            ) : (
              <span>{(me?.name || me?.email || "U").charAt(0).toUpperCase()}</span>
            )}
          </Link>
        </header>
      )}

      {showSidebar && mobileNavOpen && (
        <button
          className="app-mobile-nav-backdrop"
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {showSidebar && sidebarCollapsed && (
        <div
          className="app-collapsed-rail"
          style={{
            position: "absolute",
            inset: "16px auto 16px 16px",
            width: 56,
            zIndex: 4,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(8, 20, 46, 0.96), rgba(5, 13, 31, 0.94))",
            border: "var(--app-sidebar-border)",
            borderRadius: 22,
            boxShadow: "var(--app-sidebar-shadow)",
          }}
          aria-hidden="true"
        />
      )}

      {showSidebar && sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="app-collapsed-toggle"
          style={{
            ...toggleButtonStyle,
            position: "absolute",
            top: 32,
            left: 25,
            zIndex: 5,
            width: 38,
            height: 38,
            borderRadius: 12,
            boxShadow:
              "0 14px 30px rgba(2, 8, 23, 0.32), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          title={t("app.expandSidebar")}
          aria-label={t("app.expandSidebar")}
        >
          <svg
            viewBox="0 0 20 20"
            width="17"
            height="17"
            aria-hidden="true"
            style={{ display: "block", transform: "rotate(180deg)" }}
          >
            <path
              d="M12.5 4.5L7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {showSidebar && (!sidebarCollapsed || mobileNavOpen) && (
        <aside
          className="app-sidebar"
          onClickCapture={(event) => {
            if (
              mobileNavOpen &&
              event.target instanceof Element &&
              event.target.closest("a")
            ) {
              setMobileNavOpen(false);
            }
          }}
          style={{
            width: 240,
            background: "var(--app-sidebar-bg)",
            margin: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0,
            height: "calc(100vh - 32px)",
            boxSizing: "border-box",
            border: "var(--app-sidebar-border)",
            boxShadow:
              "var(--app-sidebar-shadow), 0 22px 48px rgba(2, 8, 23, 0.28)",
            transition: "width 240ms ease",
            position: "relative",
            zIndex: 2,
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <img
                  src={citoLogo}
                  alt="CITO"
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 18px rgba(96, 165, 250, 0.22))",
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--app-heading)", margin: 0, fontWeight: 800, fontSize: 24 }}>
                    CITO
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (window.matchMedia("(max-width: 820px)").matches) {
                    setMobileNavOpen(false);
                    return;
                  }
                  setSidebarCollapsed((prev) => !prev);
                }}
                style={toggleButtonStyle}
                title={t("app.collapseSidebar")}
                aria-label={t("app.collapseSidebar")}
              >
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  style={{
                    display: "block",
                    transition: "transform 180ms ease",
                  }}
                >
                  <path
                    d="M12.5 4.5L7 10l5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <>
                <SidebarLink to="/" icon={<DashboardIcon />} label={t("app.dashboard")} />

                <SidebarLink
                  to="/ai"
                  className="sidebar-link-ai"
                  icon={
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderRadius: 10,
                      }}
                    >
                      <img
                        src={aiLogo}
                        alt=""
                        style={{
                          width: 42,
                          height: 42,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </span>
                  }
                  label="CITO AI"
                />

                {!isAdmin && (
                  <SidebarLink to="/courses" icon={<CoursesIcon />} label={t("app.courses")} />
                )}

                {!me && (
                  <>
                    <SidebarLink to="/login" icon={<LoginIcon />} label={t("app.login")} />

                    <SidebarLink to="/register" icon={<RegisterIcon />} label={t("app.register")} />
                  </>
                )}

                {isUser && (
                  <SidebarLink
                    to="/claim-receptionist"
                    icon={<ClaimIcon />}
                    label={t("app.claimReceptionist")}
                  />
                )}

                {isAdmin && (
                  <>
                    <div style={sectionTitle}>{t("app.admin")}</div>

                    <SidebarLink to="/courses" icon={<ManageCoursesIcon />} label={t("app.manageCourse")} />

                    <SidebarLink
                      to="/admin/receptionists"
                      icon={<ReceptionistIcon />}
                      label={t("app.manageReceptionist")}
                    />

                    <SidebarLink
                      to="/admin/payment-history"
                      icon={<PaymentHistoryIcon />}
                      label={t("app.paymentHistory")}
                    />

                    <SidebarLink
                      to="/reception/receipts"
                      icon={<ReceiptIcon />}
                      label={t("app.allReceipts")}
                    />
                  </>
                )}

                {isReceptionist && (
                  <>
                    <div style={sectionTitle}>{t("app.reception")}</div>

                    <SidebarLink
                      to="/reception/receipt/new"
                      icon={<NewReceiptIcon />}
                      label={t("app.newReceipt")}
                    />

                    <SidebarLink
                      to="/reception/receipts"
                      icon={<ReceiptListIcon />}
                      label={t("app.receiptList")}
                    />

                    <SidebarLink
                      to="/reception/money?range=YEAR"
                      icon={<StudentMoneyIcon />}
                      label={t("app.studentMoneySummary")}
                    />
                  </>
                )}
              </>
          </div>

          {me && (
            <div
              style={{
                padding: 14,
                borderRadius: 20,
                background:
                  "var(--app-panel-bg)",
                border: "var(--app-panel-border)",
                boxShadow: "var(--app-panel-shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <Link to="/settings">
                  {me.picture ? (
                    <img
                      src={me.picture}
                      alt="profile"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(191, 219, 254, 0.28)",
                        cursor: "pointer",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {(me.name || me.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color: "var(--app-heading)",
                      fontSize: 15,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {me.name || me.username || "User"}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      color: "var(--app-muted)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {me.email}
                  </div>
                </div>
              </div>

              <div
                style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--app-muted)", fontSize: 12, fontWeight: 700 }}>
                {t("app.role")}
              </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 82,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "rgba(96, 165, 250, 0.14)",
                    color: "#cce7ff",
                    border: "1px solid rgba(147, 197, 253, 0.14)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {me.role}
                </span>
              </div>

              <div style={bottomActionStackStyle}>
                <SidebarLink to="/settings" icon={<SettingsIcon />} label={t("app.settings")} />
              </div>

              <button
                onClick={() => setLogoutConfirmOpen(true)}
                style={{
                  width: "100%",
                  minHeight: 38,
                  padding: "8px 14px",
                  background:
                    "linear-gradient(135deg, rgba(155, 69, 87, 0.94), rgba(204, 99, 92, 0.9))",
                  color: "#ffffff",
                  border: "1px solid rgba(248, 113, 113, 0.2)",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow:
                    "0 10px 20px rgba(127, 29, 29, 0.16)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <span style={{ ...sidebarIconWrapStyle, color: "var(--app-accent-soft)" }}>
                  <LogoutIcon />
                </span>
                {t("app.logout")}
              </button>
            </div>
          )}
        </aside>
      )}

      <main
        className="app-main"
        style={{
          flex: 1,
          position: "relative",
          height: isReceiptPrintPage ? "auto" : "100dvh",
          minHeight: isReceiptPrintPage ? "100vh" : undefined,
          padding: isReceiptPrintPage
            ? 0
            : showSidebar && sidebarCollapsed
              ? "20px 20px 20px 96px"
              : 20,
          overflowY: isReceiptPrintPage ? "visible" : "auto",
          boxSizing: "border-box",
          background:
            isReceiptPrintPage
              ? "#ffffff"
              : "var(--app-main-bg)",
          boxShadow: !showSidebar || sidebarCollapsed || isReceiptPrintPage
            ? "none"
            : "inset 12px 0 22px rgba(77, 140, 255, 0.04)",
        }}
      >
        {showSidebar && !sidebarCollapsed && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 34,
              height: "100%",
              pointerEvents: "none",
              background:
                "linear-gradient(90deg, rgba(109, 163, 255, 0.1) 0%, rgba(109, 163, 255, 0.04) 40%, transparent 100%)",
              filter: "blur(8px)",
              zIndex: 0,
            }}
          />
        )}
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/ai"
            element={
              <RequireAuth>
                <CitoAi />
              </RequireAuth>
            }
          />
          <Route
            path="/courses"
            element={
              <RequireAuth>
                <Courses />
              </RequireAuth>
            }
          />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route
            path="/courses/:id"
            element={
              <RequireAuth>
                <CourseDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/claim-receptionist"
            element={
              <RequireAuth>
                <ClaimReceptionist />
              </RequireAuth>
            }
          />
          <Route
            path="/reception/receipt/new"
            element={
              <RequireRole roles={["ADMIN", "RECEPTIONIST"]}>
                <CitoReceiptForm />
              </RequireRole>
            }
          />
          <Route
            path="/reception/receipt/:id/print"
            element={
              <RequireRole roles={["ADMIN", "RECEPTIONIST"]}>
                <CitoReceiptPrint />
              </RequireRole>
            }
          />
          <Route
            path="/reception/receipts"
            element={
              <RequireRole roles={["ADMIN", "RECEPTIONIST"]}>
                <ReceiptList />
              </RequireRole>
            }
          />
          <Route
            path="/reception/money"
            element={
              <RequireRole roles={["ADMIN", "RECEPTIONIST"]}>
                <ReceptionistDailyMoney />
              </RequireRole>
            }
          />
          <Route
            path="/admin/receptionists"
            element={
              <RequireRole roles={["ADMIN"]}>
                <ManageReceptionist />
              </RequireRole>
            }
          />
          <Route
            path="/admin/receptionists/:userId/money"
            element={
              <RequireRole roles={["ADMIN"]}>
                <ReceptionistDailyMoney />
              </RequireRole>
            }
          />
          <Route
            path="/admin/payment-history"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AdminPaymentHistory />
              </RequireRole>
            }
          />
          <Route
            path="/courses/:id/edit"
            element={
              <RequireRole roles={["ADMIN"]}>
                <EditCourse />
              </RequireRole>
            }
          />
          <Route
            path="/courses/:id/upload"
            element={
              <RequireRole roles={["ADMIN"]}>
                <UploadCourseVideo />
              </RequireRole>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings me={me} theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Settings me={me} theme={theme} setTheme={setTheme} initialSection="profile" />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
        </Routes>
      </main>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title={t("app.confirmLogoutTitle")}
        message={t("app.confirmLogoutMessage")}
        confirmText={t("app.logout")}
        tone="danger"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
