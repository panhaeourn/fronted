import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, me } = useAuth();
  const location = useLocation();

  if (loading) return <div className="card">Checking login...</div>;

  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
