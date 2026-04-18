export type ReceiptType = "COURSE" | "MONTHLY";

export type OnlineCourse = {
  id: number;
  title: string;
  price?: number;
};

export type MonthlyCourseOption = {
  title: string;
  price: number;
};
