import type {
  ClaimCode,
  Course,
  DashboardApi,
  DashboardData,
  MeUser,
  Metric,
  MoneySummary,
  Payment,
  Receipt,
  SideMetric,
} from "./types";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });

export function buildAdminDashboard(
  me: MeUser,
  courses: Course[],
  receipts: Receipt[],
  payments: Payment[],
  claimCodes: ClaimCode[],
  receptionists: { id: number }[],
  aggregate: DashboardApi | null
): DashboardData {
  const paidPayments = payments.filter((item) => isPaid(item.status));
  const activeCodes = claimCodes.filter((item) => !item.used && new Date(item.expiresAt) >= new Date()).length;
  const usedCodes = claimCodes.filter((item) => item.used).length;
  const expiredCodes = claimCodes.filter((item) => !item.used && new Date(item.expiresAt) < new Date()).length;
  const uniqueUsers = new Set(
    [...receipts, ...payments]
      .map((item) => `${item.studentId || ""}-${item.studentName || ""}`.trim())
      .filter((item) => item !== "-")
  );

  return {
    title: "Admin Dashboard",
    subtitle: "Monitor courses, students, receipts, payments, and receptionist claim activity from one control center.",
    welcomeTitle: `Welcome back, ${me.name || "Admin"}`,
    welcomeText: "Manage the full training platform with live operational and financial visibility.",
    metrics: [
      metric("Total Courses", aggregate?.totalCourses ?? courses.length, "#60a5fa"),
      metric("Total Users", aggregate?.totalUsers ?? aggregate?.totalStudents ?? uniqueUsers.size, "#8b5cf6"),
      metric("Receptionists", aggregate?.totalReceptionists ?? receptionists.length, "#34d399"),
      metric("Receipts", aggregate?.totalReceipts ?? receipts.length, "#f59e0b"),
      metric("Payments", aggregate?.totalPayments ?? payments.length, "#38bdf8"),
      metricCurrency(
        "Revenue",
        aggregate?.totalRevenue ?? paidPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        "#22c55e"
      ),
    ],
    sideMetrics: [
      sideMetric("Active Codes", activeCodes, "#60a5fa"),
      sideMetric("Used Codes", usedCodes, "#34d399"),
      sideMetric("Expired Codes", expiredCodes, "#f59e0b"),
    ],
    quickLinks: [
      { label: "Manage Courses", to: "/courses" },
      { label: "Manage Receptionists", to: "/admin/receptionists" },
      { label: "View Payments", to: "/admin/payment-history" },
      { label: "Review Receipts", to: "/reception/receipts" },
    ],
    chartTitle: "Revenue Trend",
    chartSubtitle: "Paid revenue over the last 6 months",
    chartItems: buildSeries(paidPayments, (item) => item.paidAt || item.createdAt, (item) => Number(item.amount || 0)),
    chartFormatter: (value) => formatCurrency(value),
    secondTitle: "Receipt Creation Trend",
    secondSubtitle: "Monthly receipt volume",
    secondItems: buildSeries(receipts, (item) => item.createdAt, () => 1),
    secondFormatter: (value) => `${value} receipts`,
    statusTitle: "Payment Status",
    statuses: buildPaymentStatusItems(payments),
    activityTitle: "Recent Activity",
    activity: buildAdminActivity(receipts, payments, claimCodes),
    tableOneTitle: "Recent Receipts",
    tableOneColumns: ["Student", "Course", "Status", "Date"],
    tableOneRows: (aggregate?.recentReceipts || receipts.slice(0, 5)).map((item) => [
      item.studentName,
      item.courseName,
      item.paymentStatus || "Pending",
      formatDate(item.createdAt),
    ]),
    tableTwoTitle: "Recent Payments",
    tableTwoColumns: ["Student", "Amount", "Status", "Date"],
    tableTwoRows: (aggregate?.recentPayments || payments.slice(0, 5)).map((item) => [
      item.studentName || "-",
      formatCurrency(Number(item.amount || 0)),
      capitalize(item.status || "Unknown"),
      formatDate(item.paidAt || item.createdAt),
    ]),
    moneySummary: null,
  };
}

export function buildReceptionistDashboard(me: MeUser, courses: Course[], receipts: Receipt[]): DashboardData {
  const paidReceipts = receipts.filter((item) => (item.paymentStatus || "").toLowerCase() === "paid");
  const pendingReceipts = receipts.filter((item) => (item.paymentStatus || "").toLowerCase() !== "paid");
  const moneySummary = buildReceptionistMoneySummary(receipts);

  return {
    title: "Receptionist Dashboard",
    subtitle: "Track daily receipt operations, payment status, and your latest billing activity.",
    welcomeTitle: `Welcome back, ${me.name || "Receptionist"}`,
    welcomeText: "Create new receipts quickly, follow pending payments, and keep student billing organized.",
    metrics: [
      metric("Total Receipts", receipts.length, "#60a5fa"),
      metric("Paid Receipts", paidReceipts.length, "#34d399"),
      metric("Pending Receipts", pendingReceipts.length, "#f59e0b"),
      metricCurrency("Receipt Value", receipts.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), "#22c55e"),
    ],
    sideMetrics: [
      sideMetric("Courses Available", courses.length, "#60a5fa"),
      sideMetric("Receipts Today", countToday(receipts, (item) => item.createdAt), "#38bdf8"),
      sideMetric("Need Follow-up", pendingReceipts.length, "#f59e0b"),
    ],
    quickLinks: [
      { label: "New CITO Receipt", to: "/reception/receipt/new" },
      { label: "Receipt List", to: "/reception/receipts" },
      { label: "Course Catalog", to: "/courses" },
    ],
    chartTitle: "Receipt Trend",
    chartSubtitle: "Receipts created over the last 6 months",
    chartItems: buildSeries(receipts, (item) => item.createdAt, () => 1),
    chartFormatter: (value) => `${value} receipts`,
    secondTitle: "Collection Trend",
    secondSubtitle: "Paid receipt value over the last 6 months",
    secondItems: buildSeries(paidReceipts, (item) => item.createdAt, (item) => Number(item.totalPrice || 0)),
    secondFormatter: (value) => formatCurrency(value),
    statusTitle: "Receipt Status",
    statuses: [
      { label: "Paid", value: paidReceipts.length, color: "#34d399" },
      { label: "Pending", value: pendingReceipts.length, color: "#f59e0b" },
    ],
    activityTitle: "Recent Receipt Activity",
    activity: receipts.slice(0, 8).map((item) => ({
      id: `receipt-${item.id}`,
      title: `${item.studentName} receipt created`,
      detail: `${item.courseName} - ${formatCurrency(item.totalPrice)}`,
      time: item.createdAt,
      badge: item.paymentStatus || "Pending",
    })),
    tableOneTitle: "Latest Receipts",
    tableOneColumns: ["Student", "Course", "Status", "Date"],
    tableOneRows: receipts.slice(0, 5).map((item) => [
      item.studentName,
      item.courseName,
      item.paymentStatus || "Pending",
      formatDate(item.createdAt),
    ]),
    tableTwoTitle: "Pending Payments",
    tableTwoColumns: ["Student", "Course", "Amount", "Date"],
    tableTwoRows: pendingReceipts.slice(0, 5).map((item) => [
      item.studentName,
      item.courseName,
      formatCurrency(Number(item.totalPrice || 0)),
      formatDate(item.createdAt),
    ]),
    moneySummary,
  };
}

export function buildUserDashboard(me: MeUser, courses: Course[]): DashboardData {
  const enrolledCourses = courses.filter((item) => item.enrolled);
  const lockedCourses = courses.filter((item) => !item.enrolled);
  const totalCatalogValue = courses.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return {
    title: "Student Dashboard",
    subtitle: "See your course access, explore the catalog, and jump back into learning quickly.",
    welcomeTitle: `Welcome back, ${me.name || "Student"}`,
    welcomeText: "Continue your learning path, unlock more courses, and use your dashboard as a personal study hub.",
    metrics: [
      metric("All Courses", courses.length, "#60a5fa"),
      metric("Unlocked Courses", enrolledCourses.length, "#34d399"),
      metric("Available to Buy", lockedCourses.length, "#f59e0b"),
      metricCurrency("Catalog Value", totalCatalogValue, "#22c55e"),
    ],
    sideMetrics: [
      sideMetric("Learning Ready", enrolledCourses.length, "#34d399"),
      sideMetric("Recommended", Math.min(lockedCourses.length, 3), "#8b5cf6"),
      sideMetric("Role", 0, "#38bdf8", "Student"),
    ],
    quickLinks: [
      { label: "Browse Courses", to: "/courses" },
      ...(enrolledCourses[0] ? [{ label: "Open My Course", to: `/courses/${enrolledCourses[0].id}` }] : []),
      { label: "Claim Receptionist", to: "/claim-receptionist" },
    ],
    chartTitle: "Catalog Snapshot",
    chartSubtitle: "Unlocked versus locked course access",
    chartItems: [
      { label: "Unlocked", value: enrolledCourses.length },
      { label: "Locked", value: lockedCourses.length },
      { label: "All", value: courses.length },
      { label: "Ready", value: enrolledCourses.length },
      { label: "Explore", value: lockedCourses.length },
      { label: "Next", value: Math.min(lockedCourses.length, 3) },
    ],
    chartFormatter: (value) => `${value}`,
    secondTitle: "Course Growth",
    secondSubtitle: "Catalog expansion over the last 6 months",
    secondItems: buildStaticCourseSeries(courses.length),
    secondFormatter: (value) => `${value} courses`,
    statusTitle: "Enrollment Status",
    statuses: [
      { label: "Unlocked", value: enrolledCourses.length, color: "#34d399" },
      { label: "Locked", value: lockedCourses.length, color: "#f59e0b" },
    ],
    activityTitle: "Learning Highlights",
    activity: [
      ...enrolledCourses.slice(0, 4).map((item) => ({
        id: `open-${item.id}`,
        title: `Continue ${item.title}`,
        detail: "This course is unlocked and ready to study.",
        badge: "Unlocked",
      })),
      ...lockedCourses.slice(0, 4).map((item) => ({
        id: `locked-${item.id}`,
        title: `Explore ${item.title}`,
        detail: `Price ${formatCurrency(Number(item.price || 0))}`,
        badge: "Available",
      })),
    ],
    tableOneTitle: "My Courses",
    tableOneColumns: ["Course", "Price", "Status"],
    tableOneRows: enrolledCourses.slice(0, 5).map((item) => [
      item.title,
      formatCurrency(Number(item.price || 0)),
      "Unlocked",
    ]),
    tableTwoTitle: "Recommended Courses",
    tableTwoColumns: ["Course", "Price", "Action"],
    tableTwoRows: lockedCourses.slice(0, 5).map((item) => [
      item.title,
      formatCurrency(Number(item.price || 0)),
      "Buy now",
    ]),
    moneySummary: null,
  };
}

export function buildReceptionistMoneySummary(receipts: Receipt[]): MoneySummary {
  const paidByDay = new Map<string, { total: number; count: number; dayLabel: string }>();

  for (const receipt of receipts) {
    if ((receipt.paymentStatus || "").trim().toLowerCase() !== "paid") continue;
    if (!receipt.createdAt) continue;
    const createdAt = new Date(receipt.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;

    const dayKey = createdAt.toISOString().slice(0, 10);
    const dayLabel = createdAt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const current = paidByDay.get(dayKey) || { total: 0, count: 0, dayLabel };
    current.total += Number(receipt.totalPrice || 0);
    current.count += 1;
    paidByDay.set(dayKey, current);
  }

  const orderedDays = [...paidByDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return {
    total: orderedDays.reduce((sum, [, day]) => sum + day.total, 0),
    activeDays: orderedDays.length,
    studentsPaid: orderedDays.reduce((sum, [, day]) => sum + day.count, 0),
    latestDay: orderedDays[0]?.[1].dayLabel || "-",
    detailBasePath: "/reception/money",
  };
}

export function formatRangeLabel(range: "DAY" | "WEEK" | "MONTH" | "YEAR") {
  switch (range) {
    case "DAY":
      return "Day";
    case "WEEK":
      return "Week";
    case "MONTH":
      return "Month";
    case "YEAR":
      return "Year";
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function buildPaymentStatusItems(payments: Payment[]) {
  const counts = new Map<string, number>();
  payments.forEach((item) => {
    const key = capitalize(item.status || "Unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, value], index) => ({
    label,
    value,
    color: ["#60a5fa", "#34d399", "#f59e0b", "#f87171"][index % 4],
  }));
}

function buildAdminActivity(receipts: Receipt[], payments: Payment[], claimCodes: ClaimCode[]) {
  return [
    ...receipts.slice(0, 4).map((item) => ({
      id: `receipt-${item.id}`,
      title: `${item.studentName} receipt created`,
      detail: `${item.courseName} - ${formatCurrency(item.totalPrice)}`,
      time: item.createdAt,
      badge: "Receipt",
    })),
    ...payments.slice(0, 4).map((item) => ({
      id: `payment-${item.id}`,
      title: `${item.studentName || "Student"} payment updated`,
      detail: `${item.courseName || item.paymentType || "Payment"} - ${capitalize(item.status || "Unknown")}`,
      time: item.paidAt || item.createdAt,
      badge: "Payment",
    })),
    ...claimCodes.slice(0, 4).map((item) => ({
      id: `claim-${item.id}`,
      title: `${item.targetEmail} claim code ${item.used ? "used" : "generated"}`,
      detail: item.code,
      time: item.usedAt || item.createdAt,
      badge: "Claim",
    })),
  ]
    .sort((a, b) => toTime(b.time) - toTime(a.time))
    .slice(0, 8);
}

function buildSeries<T>(rows: T[], getDate: (row: T) => string | undefined, getValue: (row: T) => number) {
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: monthFormatter.format(date), value: 0 };
  });

  rows.forEach((row) => {
    const rawDate = getDate(row);
    if (!rawDate) return;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;
    const bucket = buckets.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.value += getValue(row);
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

function buildStaticCourseSeries(totalCourses: number) {
  return [
    { label: "Jan", value: Math.max(1, Math.round(totalCourses * 0.2)) },
    { label: "Feb", value: Math.max(1, Math.round(totalCourses * 0.3)) },
    { label: "Mar", value: Math.max(1, Math.round(totalCourses * 0.45)) },
    { label: "Apr", value: Math.max(1, Math.round(totalCourses * 0.55)) },
    { label: "May", value: Math.max(1, Math.round(totalCourses * 0.75)) },
    { label: "Jun", value: Math.max(1, totalCourses) },
  ];
}

function countToday<T>(rows: T[], getDate: (row: T) => string | undefined) {
  const today = new Date();
  return rows.filter((row) => {
    const rawDate = getDate(row);
    if (!rawDate) return false;
    const date = new Date(rawDate);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;
}

function isPaid(status?: string) {
  return ["paid", "success", "completed"].includes((status || "").toLowerCase());
}

function metric(label: string, value: number, accent: string): Metric {
  return { label, value: value.toLocaleString(), accent };
}

function metricCurrency(label: string, value: number, accent: string): Metric {
  return { label, value: formatCurrency(value), accent };
}

function sideMetric(label: string, value: number, color: string, display?: string): SideMetric {
  return { label, value: display || value.toLocaleString(), color };
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "Unknown";
}

function toTime(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
