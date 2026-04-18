import type { Role } from "../../lib/auth";
import type {
  ClaimCode,
  CourseRecord as Course,
  PaymentHistoryRecord as Payment,
  ReceiptRecord as Receipt,
  ReceptionistUser,
} from "../../lib/domain-types";

export type MeUser = {
  id: number;
  email: string;
  username: string;
  name: string;
  role: Role;
};

export type DashboardApi = Partial<{
  totalCourses: number;
  totalUsers: number;
  totalStudents: number;
  totalReceptionists: number;
  totalReceipts: number;
  totalPayments: number;
  totalRevenue: number;
  activeClaimCodes: number;
  usedClaimCodes: number;
  expiredClaimCodes: number;
  recentReceipts: Receipt[];
  recentPayments: Payment[];
}>;

export type Metric = { label: string; value: string; accent: string };
export type SideMetric = { label: string; value: string; color: string };
export type Status = { label: string; value: number; color: string };
export type Activity = { id: string; title: string; detail: string; time?: string; badge: string };

export type MoneySummary = {
  total: number;
  activeDays: number;
  studentsPaid: number;
  latestDay: string;
  detailBasePath: string;
};

export type DashboardData = {
  title: string;
  subtitle: string;
  welcomeTitle: string;
  welcomeText: string;
  metrics: Metric[];
  sideMetrics: SideMetric[];
  quickLinks: Array<{ label: string; to: string }>;
  chartTitle: string;
  chartSubtitle: string;
  chartItems: Array<{ label: string; value: number }>;
  chartFormatter: (value: number) => string;
  secondTitle: string;
  secondSubtitle: string;
  secondItems: Array<{ label: string; value: number }>;
  secondFormatter: (value: number) => string;
  statusTitle: string;
  statuses: Status[];
  activityTitle: string;
  activity: Activity[];
  tableOneTitle: string;
  tableOneColumns: string[];
  tableOneRows: string[][];
  tableTwoTitle: string;
  tableTwoColumns: string[];
  tableTwoRows: string[][];
  moneySummary?: MoneySummary | null;
};

export type { ClaimCode, Course, Payment, Receipt, ReceptionistUser };
