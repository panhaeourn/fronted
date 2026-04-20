import type { Role } from "./auth";

export type CourseRecord = {
  id: number;
  title: string;
  description?: string;
  price?: number;
  enrolled?: boolean;
};

export type ReceiptType = "COURSE" | "MONTHLY";

export type ReceiptRecord = {
  id: number;
  studentId?: string;
  studentCode?: string;
  receiptType?: ReceiptType;
  monthlyPeriod?: string;
  monthlyPaidMonths?: string;
  courseName: string;
  studentName: string;
  studentNameEnglish?: string;
  studentNameKhmer?: string;
  gender?: string;
  phone?: string;
  contactInfo?: string;
  email?: string;
  address?: string;
  schedule?: string;
  bookPrice?: number;
  programPrice?: number;
  totalPrice: number;
  paymentStatus?: string;
  qrImage?: string;
  qrText?: string;
  bakongTranId?: string;
  createdAt?: string;
  createdByReceptionist?: string;
  createdByReceptionistName?: string;
};

export type PaymentHistoryRecord = {
  id: number;
  paymentType?: string;
  receiptId?: number;
  courseId?: number;
  studentId?: string;
  studentName?: string;
  courseName?: string;
  amount?: number;
  paymentMethod?: string;
  transactionRef?: string;
  bakongMd5?: string;
  gatewayResponse?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  checkedBy?: string;
  note?: string;
};

export type ClaimCode = {
  id: number;
  code: string;
  targetEmail: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  createdByAdminEmail?: string;
};

export type ReceptionistUser = {
  id: number;
  username?: string;
  email: string;
  role: string;
};

export type ClaimReceptionistResponse = {
  role?: Role | string;
};

export type BakongQrPayload = {
  qr?: string;
  payload?: string;
  khqr?: string;
  transactionId?: string;
  remainingSeconds?: number;
};

export type BakongQrResponse = {
  success?: boolean;
  qr?: string;
  md5?: string;
  transactionId?: string;
  expiresAt?: number;
  remainingSeconds?: number;
  alreadyUnlocked?: boolean;
  message?: string;
  data?: BakongQrPayload;
};

export type BakongPaymentStatusPayload = {
  paid?: boolean;
  unlocked?: boolean;
  status?: string;
};

export type BakongPaymentStatusResponse = {
  success?: boolean;
  paid?: boolean;
  unlocked?: boolean;
  status?: string;
  message?: string;
  verificationPending?: boolean;
  data?: BakongPaymentStatusPayload;
};
