import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../api";
import type {
  ClaimCode,
  CourseRecord as Course,
  PaymentHistoryRecord as Payment,
  ReceiptRecord as Receipt,
  ReceptionistUser,
} from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import { useAuth } from "../../lib/auth-context";
import { DashboardLayout, HomeError, HomeLoading } from "./components";
import { buildAdminDashboard, buildReceptionistDashboard, buildUserDashboard } from "./helpers";

export default function Home() {
  const { me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claimCodes, setClaimCodes] = useState<ClaimCode[]>([]);
  const [receptionists, setReceptionists] = useState<ReceptionistUser[]>([]);
  const [reloadVersion, setReloadVersion] = useState(0);
  const hasLoaded = useRef(false);
  const userId = me?.id;
  const role = me?.role;

  useEffect(() => {
    if (!userId || !role) return;

    let active = true;
    const initialLoad = !hasLoaded.current;

    async function loadHome() {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      try {
        const courseRequest = apiFetch<Course[]>("/api/courses");
        const adminRequest =
          role === "ADMIN"
            ? Promise.allSettled([
                apiFetch<Payment[]>("/api/admin/payment-history"),
                apiFetch<Receipt[]>("/api/reception/receipts"),
                apiFetch<ClaimCode[]>("/api/admin/receptionist-codes"),
                apiFetch<ReceptionistUser[]>("/api/admin/receptionist-codes/users"),
              ] as const)
            : null;
        const receptionistRequest =
          role === "RECEPTIONIST"
            ? Promise.allSettled([apiFetch<Receipt[]>("/api/reception/receipts")] as const)
            : null;

        const courseData = await courseRequest;
        if (!active) return;

        setCourses(courseData || []);
        hasLoaded.current = true;
        setLoading(false);

        if (adminRequest) {
          const [p, r, cc, ru] = await adminRequest;
          if (!active) return;

          setPayments(p.status === "fulfilled" ? p.value || [] : []);
          setReceipts(r.status === "fulfilled" ? r.value || [] : []);
          setClaimCodes(cc.status === "fulfilled" ? cc.value || [] : []);
          setReceptionists(ru.status === "fulfilled" ? ru.value || [] : []);
        } else if (receptionistRequest) {
          const [r] = await receptionistRequest;
          if (!active) return;
          setReceipts(r.status === "fulfilled" ? r.value || [] : []);
        }
      } catch (loadError: unknown) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Failed to load dashboard"));
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadHome();
    return () => {
      active = false;
    };
  }, [reloadVersion, role, userId]);

  const data = useMemo(() => {
    if (!me) return null;
    if (me.role === "ADMIN") {
      return buildAdminDashboard(me, courses, receipts, payments, claimCodes, receptionists, null);
    }
    if (me.role === "RECEPTIONIST") {
      return buildReceptionistDashboard(me, courses, receipts);
    }
    return buildUserDashboard(me, courses);
  }, [me, courses, receipts, payments, claimCodes, receptionists]);

  if (loading) return <HomeLoading>Loading dashboard...</HomeLoading>;
  if (error) {
    return <HomeError error={error} onRetry={() => setReloadVersion((version) => version + 1)} />;
  }
  if (!data) return <HomeLoading>Please log in.</HomeLoading>;

  return (
    <DashboardLayout
      data={data}
      onRefresh={() => setReloadVersion((version) => version + 1)}
      refreshing={refreshing}
    />
  );
}
