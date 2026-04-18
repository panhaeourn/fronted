import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";

export default function OAuthSuccess() {
  const nav = useNavigate();
  const { refreshMe } = useAuth();

  useEffect(() => {
    let cancelled = false;

    void refreshMe()
      .then((me) => {
        if (cancelled) return;
        nav(me ? "/" : "/login", { replace: true });
      })
      .catch(() => {
        if (!cancelled) nav("/login", { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [nav, refreshMe]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(77,130,255,0.16), transparent 30%), linear-gradient(180deg, #060d1c 0%, #071121 48%, #050b15 100%)",
        color: "#f8fbff",
      }}
    >
      <div
        style={{
          minWidth: 320,
          maxWidth: 420,
          padding: 28,
          borderRadius: 24,
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(13, 25, 52, 0.96), rgba(7, 14, 30, 0.94))",
          border: "1px solid rgba(191, 219, 254, 0.24)",
          boxShadow:
            "0 22px 48px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(147, 197, 253, 0.14), 0 0 42px rgba(96, 165, 250, 0.2)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>Signing you in</h2>
        <p style={{ margin: "10px 0 0", color: "#9ab0d3" }}>Please wait a moment.</p>
      </div>
    </div>
  );
}
