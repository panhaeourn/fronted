import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import type {
  ClaimCode,
  CourseRecord as Course,
  PaymentHistoryRecord as Payment,
  ReceiptRecord as Receipt,
  ReceptionistUser,
} from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import { DashboardLayout, GuestHome, HomeError, HomeLoading } from "./components";
import { buildAdminDashboard, buildReceptionistDashboard, buildUserDashboard } from "./helpers";
import type { DashboardApi, MeUser } from "./types";

export default function Home() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meLoaded, setMeLoaded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claimCodes, setClaimCodes] = useState<ClaimCode[]>([]);
  const [receptionists, setReceptionists] = useState<ReceptionistUser[]>([]);
  const [adminAggregate, setAdminAggregate] = useState<DashboardApi | null>(null);

  useEffect(() => {
    void loadHome();
  }, []);

  async function loadHome() {
    setLoading(true);
    setError("");

    try {
      const user = await apiFetch<MeUser>("/api/auth/me");
      setMe(user);
      setMeLoaded(true);

      if (user.role === "ADMIN") {
        const [c, p, r, cc, ru] = await Promise.allSettled([
          apiFetch<Course[]>("/api/courses"),
          apiFetch<Payment[]>("/api/admin/payment-history"),
          apiFetch<Receipt[]>("/api/reception/receipts"),
          apiFetch<ClaimCode[]>("/api/admin/receptionist-codes"),
          apiFetch<ReceptionistUser[]>("/api/admin/receptionist-codes/users"),
        ]);
        setAdminAggregate(null);
        setCourses(c.status === "fulfilled" ? c.value || [] : []);
        setPayments(p.status === "fulfilled" ? p.value || [] : []);
        setReceipts(r.status === "fulfilled" ? r.value || [] : []);
        setClaimCodes(cc.status === "fulfilled" ? cc.value || [] : []);
        setReceptionists(ru.status === "fulfilled" ? ru.value || [] : []);
      } else if (user.role === "RECEPTIONIST") {
        const [c, r] = await Promise.allSettled([
          apiFetch<Course[]>("/api/courses"),
          apiFetch<Receipt[]>("/api/reception/receipts"),
        ]);
        setCourses(c.status === "fulfilled" ? c.value || [] : []);
        setReceipts(r.status === "fulfilled" ? r.value || [] : []);
      } else {
        setCourses((await apiFetch<Course[]>("/api/courses")) || []);
      }
    } catch (error: unknown) {
      setMe(null);
      setMeLoaded(true);
      setError(getErrorMessage(error, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => {
    if (!me) return null;
    if (me.role === "ADMIN") {
      return buildAdminDashboard(me, courses, receipts, payments, claimCodes, receptionists, adminAggregate);
    }
    if (me.role === "RECEPTIONIST") {
      return buildReceptionistDashboard(me, courses, receipts);
    }
    return buildUserDashboard(me, courses);
  }, [me, courses, receipts, payments, claimCodes, receptionists, adminAggregate]);

  if (loading) return <HomeLoading>Loading dashboard...</HomeLoading>;
  if (!me && meLoaded) return <GuestHome />;
  if (error) return <HomeError error={error} onRetry={() => void loadHome()} />;
  if (!data) return <HomeLoading>Please log in.</HomeLoading>;

  return <DashboardLayout data={data} onRefresh={() => void loadHome()} refreshing={loading} />;
}
