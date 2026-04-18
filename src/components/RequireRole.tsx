import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "../lib/auth";
import { useAuth } from "../lib/auth-context";

export default function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { loading, me } = useAuth();
  const location = useLocation();

  if (loading) return <div className="card">Checking access...</div>;

  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes(me.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
