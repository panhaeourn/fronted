import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/errors";
import {
  MONTHLY_COURSE_OPTIONS,
  buildDefaultMonthlyPeriod,
  buildMonthlyRange,
} from "../receipt-form/helpers";

type ReceiptType = "COURSE" | "MONTHLY";
type OnlineCourse = {
  id: number;
  title: string;
  price?: number;
};

export default function CitoReceiptForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [qrImage, setQrImage] = useState("");
  const [qrText, setQrText] = useState("");
  const [bakongTranId, setBakongTranId] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { me } = useAuth();
  const [courseQuery, setCourseQuery] = useState("");
  const [onlineCourses, setOnlineCourses] = useState<OnlineCourse[]>([]);
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const coursePickerRef = useRef<HTMLDivElement | null>(null);

  function calculateTotalPrice(bookPrice: string, programPrice: string) {
    const book = Number(bookPrice) || 0;
    const program = Number(programPrice) || 0;
    return (book + program).toFixed(2);
  }

  const [form, setForm] = useState({
    studentId: "",
    studentCode: "",
    receiptType: "COURSE" as ReceiptType,
    courseName: "",
    monthlyPeriod: buildDefaultMonthlyPeriod(),
    studentNameEnglish: "",
    studentNameKhmer: "",
    gender: "",
    phone: "",
    contactInfo: "",
    email: "",
    address: "",
    bookPrice: "",
    programPrice: "",
    totalPrice: "",
    schedule: "",
    paymentStatus: "Pending",
    createdAt: "",
    createdByReceptionist: ""
  });

  const matchingCourses = useMemo(() => {
    if (form.receiptType !== "COURSE") return [];
    const query = courseQuery.trim().toLowerCase();
    const matches = onlineCourses.filter((course) =>
      course.title.toLowerCase().includes(query)
    );
    if (!query) return matches.slice(0, 8);
    return matches;
  }, [courseQuery, form.receiptType, onlineCourses]);

  const matchingMonthlyCourses = useMemo(() => {
    if (form.receiptType !== "MONTHLY") return [];
    const query = courseQuery.trim().toLowerCase();
    if (!query) return MONTHLY_COURSE_OPTIONS;

    return MONTHLY_COURSE_OPTIONS.filter((course) => {
      const title = course.title.toLowerCase();
      return title.startsWith(query) || title.includes(query);
    });
  }, [courseQuery, form.receiptType]);

  const activeCourseOptions = form.receiptType === "COURSE" ? matchingCourses : matchingMonthlyCourses;

  const selectedCourse = useMemo(
    () =>
      onlineCourses.find(
        (course) => course.title.trim().toLowerCase() === form.courseName.trim().toLowerCase()
      ) || null,
    [form.courseName, onlineCourses]
  );

  const selectedMonthlyCourse = useMemo(
    () =>
      MONTHLY_COURSE_OPTIONS.find(
        (course) => course.title.trim().toLowerCase() === form.courseName.trim().toLowerCase()
      ) || null,
    [form.courseName]
  );

  useEffect(() => {
    const now = new Date();

    setForm((prev) => ({
      ...prev,
      studentId: "",
      studentCode: "",
      createdAt: prev.createdAt || now.toLocaleString(),
      createdByReceptionist: me?.name || me?.username || me?.email || "",
    }));
  }, [me]);

  useEffect(() => {
    apiFetch<OnlineCourse[]>("/api/courses")
      .then((rows) => setOnlineCourses(rows || []))
      .catch(() => setOnlineCourses([]));
  }, []);

  useEffect(() => {
    const courseParam = searchParams.get("course")?.trim() || "";
    const priceParam = searchParams.get("price")?.trim() || "";
    const scheduleParam = searchParams.get("schedule")?.trim() || "";

    if (!courseParam) {
      return;
    }

    const matchedOnlineCourse = onlineCourses.find(
      (course) => course.title.toLowerCase() === courseParam.toLowerCase()
    );

    if (matchedOnlineCourse) {
      setCourseQuery(matchedOnlineCourse.title);
      setForm((prev) => ({
        ...prev,
        courseName: matchedOnlineCourse.title,
        programPrice: String(matchedOnlineCourse.price ?? ""),
        totalPrice: calculateTotalPrice(prev.bookPrice, String(matchedOnlineCourse.price ?? "")),
        schedule: scheduleParam || prev.schedule,
      }));
      return;
    }

    setCourseQuery(courseParam);
    setForm((prev) => ({
      ...prev,
      courseName: courseParam,
      programPrice: priceParam || prev.programPrice,
      totalPrice: calculateTotalPrice(prev.bookPrice, priceParam || prev.programPrice),
      schedule: scheduleParam || prev.schedule,
    }));
  }, [searchParams, onlineCourses]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!coursePickerRef.current) return;
      if (coursePickerRef.current.contains(event.target as Node)) return;
      setIsCoursePickerOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (name === "bookPrice" || name === "programPrice") {
      setForm((prev) => {
        const next = {
          ...prev,
          [name]: value,
        };

        next.totalPrice = calculateTotalPrice(next.bookPrice, next.programPrice);
        return next;
      });
      setQrImage("");
      setQrText("");
      setBakongTranId("");
      return;
    }

    setForm((prev) => ({
        ...prev,
        [name]: value
      }));

    if (name === "totalPrice") {
      setQrImage("");
      setQrText("");
      setBakongTranId("");
    }

    if (name === "receiptType") {
      setCourseQuery("");
      setIsCoursePickerOpen(false);
      setQrImage("");
      setQrText("");
      setBakongTranId("");
      setForm((prev) => ({
        ...prev,
        receiptType: value as ReceiptType,
        studentCode: value === "MONTHLY" ? prev.studentCode : "",
        courseName: "",
        bookPrice: "",
        programPrice: "",
        totalPrice: "",
        schedule: "",
        monthlyPeriod: value === "MONTHLY" ? prev.monthlyPeriod || buildDefaultMonthlyPeriod() : "",
      }));
    }
  }

  function selectCourse(name: string) {
    setError("");
    const entry = onlineCourses.find((c) => c.title === name);
    setCourseQuery(name);
    setForm((prev) => ({
      ...prev,
      courseName: name,
      programPrice: entry ? String(entry.price ?? "") : prev.programPrice,
      totalPrice: calculateTotalPrice(prev.bookPrice, entry ? String(entry.price ?? "") : prev.programPrice),
    }));
    setIsCoursePickerOpen(false);
    setQrImage("");
    setQrText("");
    setBakongTranId("");
  }

  function selectMonthlyCourse(name: string) {
    setError("");
    const entry = MONTHLY_COURSE_OPTIONS.find((course) => course.title === name);
    setCourseQuery(name);
    setForm((prev) => ({
      ...prev,
      courseName: name,
      programPrice: entry ? String(entry.price) : prev.programPrice,
      totalPrice: calculateTotalPrice(prev.bookPrice, entry ? String(entry.price) : prev.programPrice),
    }));
    setIsCoursePickerOpen(false);
    setQrImage("");
    setQrText("");
    setBakongTranId("");
  }

  async function generateBakongQr() {
    setError("");

    const amount = Number(form.totalPrice);

    if (!amount || amount <= 0) {
      setError("Enter valid price first");
      return;
    }

    try {
      setLoadingQr(true);

      const data = await apiFetch<{ qr?: string; md5?: string }>(
        `/api/bakong/qr?amount=${amount}`
      );

      if (!data.qr) {
        throw new Error("QR payload missing");
      }

      const qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
        encodeURIComponent(data.qr);

      setQrText(data.qr);
      setQrImage(qrUrl);
      setBakongTranId(data.md5 || "");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to generate QR"));
    } finally {
      setLoadingQr(false);
    }
  }

  async function saveReceipt(openPrintPage: boolean) {
    setError("");

    if (!form.studentNameEnglish.trim()) {
      setError("Student name in English is required");
      return;
    }

    if (!form.studentNameKhmer.trim()) {
      setError("Student name in Khmer is required");
      return;
    }

    if (!form.contactInfo.trim()) {
      setError("Contact information is required");
      return;
    }

    if (!form.schedule.trim()) {
      setError("Schedule is required");
      return;
    }

    if (!form.courseName.trim()) {
      setError("Course name is required");
      return;
    }

    if (form.receiptType === "MONTHLY" && !form.monthlyPeriod) {
      setError("Monthly period is required");
      return;
    }

    if (!form.bookPrice || Number(form.bookPrice) <= 0) {
      setError("Enter valid book price first");
      return;
    }

    if (!form.programPrice || Number(form.programPrice) <= 0) {
      setError("Select a course or enter the course/monthly price first");
      return;
    }

    if (!form.totalPrice || Number(form.totalPrice) <= 0) {
      setError("Total price must be greater than 0");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        receiptType: form.receiptType,
        studentCode: form.receiptType === "MONTHLY" ? form.studentCode.trim() : null,
        courseName: form.courseName.trim(),
        monthlyPeriod: form.receiptType === "MONTHLY" ? form.monthlyPeriod : null,
        studentName: form.studentNameEnglish.trim(),
        studentNameEnglish: form.studentNameEnglish.trim(),
        studentNameKhmer: form.studentNameKhmer.trim(),
        gender: form.gender,
        phone: form.contactInfo.trim(),
        contactInfo: form.contactInfo.trim(),
        email: form.email,
        address: form.schedule.trim(),
        schedule: form.schedule.trim(),
        bookPrice: Number(form.bookPrice),
        programPrice: Number(form.programPrice),
        totalPrice: Number(form.totalPrice),
        paymentStatus: "Pending",
        qrImage: qrImage,
        qrText: qrText,
        bakongTranId: bakongTranId,
        createdAt: form.createdAt,
        createdByReceptionist: form.createdByReceptionist
      };

      const saved = await apiFetch<{
        id: number;
        studentId?: string;
        studentCode?: string;
      }>("/api/reception/receipts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (saved?.studentId) {
        setForm((prev) => ({
          ...prev,
          studentId: saved.studentId || prev.studentId,
          studentCode: saved.studentCode || prev.studentCode
        }));
      }

      if (openPrintPage && saved?.id) {
        navigate(`/reception/receipt/${saved.id}/print`);
        return;
      }

      navigate("/reception/receipts");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to save receipt"));
    } finally {
      setSaving(false);
    }
  }

  if (me && me.role !== "RECEPTIONIST" && me.role !== "ADMIN") {
    return <div style={{ padding: 20 }}>Forbidden</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>CITO Payment Receipt Form</h1>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={layoutStyle}>
        <section style={formPanelStyle}>
          <div style={sectionTitleStyle}>Student And Receipt Details</div>

          <div style={formGridStyle}>
            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Receipt Type</label>
              <select name="receiptType" value={form.receiptType} onChange={handleChange} style={inputStyle}>
                <option value="COURSE">Course</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {form.receiptType === "MONTHLY" && (
              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Monthly Student ID</label>
                <input
                  name="studentCode"
                  placeholder="Leave empty to create first monthly student"
                  value={form.studentCode}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            )}

            {form.receiptType === "MONTHLY" && (
              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Month Period</label>
                <input
                  name="monthlyPeriod"
                  type="month"
                  value={form.monthlyPeriod}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={fieldBlockWideStyle}>
              <label style={labelStyle}>
                {form.receiptType === "COURSE" ? "Course Search (Online Courses)" : "Course Search (Monthly List)"}
              </label>
              <div ref={coursePickerRef} style={coursePickerShellStyle}>
                <input
                  value={courseQuery}
                  onFocus={() => setIsCoursePickerOpen(true)}
                  onClick={() => setIsCoursePickerOpen(true)}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCourseQuery(nextValue);
                    setIsCoursePickerOpen(true);
                    setForm((prev) => ({
                      ...prev,
                      courseName: nextValue,
                      programPrice: "",
                      totalPrice: calculateTotalPrice(prev.bookPrice, "")
                    }));
                    setQrImage("");
                    setQrText("");
                    setBakongTranId("");
                  }}
                  placeholder={
                    form.receiptType === "COURSE"
                      ? "Search online course title"
                      : "Search or pick a monthly course"
                  }
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => setIsCoursePickerOpen((prev) => !prev)}
                  style={pickerToggleStyle}
                  aria-label="Toggle course list"
                >
                  <span style={pickerChevronStyle}>{isCoursePickerOpen ? "▴" : "▾"}</span>
                </button>

                {isCoursePickerOpen && (
                  <div style={courseDropdownStyle}>
                    <div style={courseDropdownHeaderStyle}>
                      <span>
                        {form.receiptType === "COURSE" ? "Online courses" : "Monthly course list"}
                      </span>
                      <span>{activeCourseOptions.length} result{activeCourseOptions.length === 1 ? "" : "s"}</span>
                    </div>

                    <div style={courseDropdownListStyle}>
                      {activeCourseOptions.length > 0 ? (
                        activeCourseOptions.map((course) => {
                          const title = "id" in course ? course.title : course.title;
                          const price = "price" in course ? Number(course.price || 0) : 0;
                          const isSelected = form.courseName.trim().toLowerCase() === title.trim().toLowerCase();

                          return (
                            <button
                              type="button"
                              key={"id" in course ? course.id : course.title}
                              onClick={() =>
                                form.receiptType === "COURSE"
                                  ? selectCourse(title)
                                  : selectMonthlyCourse(title)
                              }
                              style={{
                                ...courseMatchButtonStyle,
                                ...(isSelected ? courseMatchButtonSelectedStyle : null),
                              }}
                            >
                              <div style={courseOptionRowStyle}>
                                <div style={courseOptionTitleStyle}>{title}</div>
                                <div style={courseOptionPriceStyle}>${price.toFixed(2)}</div>
                              </div>
                              <div style={courseOptionMetaStyle}>
                                {form.receiptType === "COURSE" ? "Online course" : "Monthly course"}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div style={noMatchStyle}>
                          {form.receiptType === "COURSE"
                            ? "No online course match found."
                            : "No monthly course match found in the list."}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedCourse && (
                <div style={selectedCourseStyle}>
                  Selected course: <b>{selectedCourse.title}</b> - ${Number(selectedCourse.price || 0).toFixed(2)}
                </div>
              )}

              {selectedMonthlyCourse && (
                <div style={selectedCourseStyle}>
                  Selected monthly course: <b>{selectedMonthlyCourse.title}</b> - ${Number(selectedMonthlyCourse.price || 0).toFixed(2)}
                </div>
              )}
            </div>

            {form.receiptType === "MONTHLY" && (
              <div style={fieldBlockWideStyle}>
                <div style={helperTextStyle}>
                  {formatMonthlyPeriodWithDate(form.monthlyPeriod, form.createdAt)}
                </div>
              </div>
            )}

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Student Name in English</label>
              <input
                name="studentNameEnglish"
                placeholder="Enter student name in English"
                value={form.studentNameEnglish}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Student Name in Khmer</label>
              <input
                name="studentNameKhmer"
                placeholder="Enter student name in Khmer"
                value={form.studentNameKhmer}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Contact Information</label>
              <input
                name="contactInfo"
                placeholder="Phone, Telegram, or email"
                value={form.contactInfo}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Email</label>
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={inputStyle} />
            </div>

            <div style={fieldBlockWideStyle}>
              <label style={labelStyle}>Schedule</label>
              <select name="schedule" value={form.schedule} onChange={handleChange} style={inputStyle}>
                <option value="">Select schedule</option>
                <option value="Monday to Friday">Monday to Friday</option>
                <option value="Saturday to Sunday">Saturday to Sunday</option>
              </select>
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Book Price (USD)</label>
              <input
                name="bookPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter book price"
                value={form.bookPrice}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>
                {form.receiptType === "MONTHLY" ? "Monthly Price (USD)" : "Course Price (USD)"}
              </label>
              <input
                name="programPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder={selectedCourse ? "Auto-filled from course" : "Enter monthly/course price"}
                value={form.programPrice}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Total Price (USD)</label>
              <input
                name="totalPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.totalPrice}
                readOnly
                style={readonlyInputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Payment Status</label>
              <input name="paymentStatus" value="Pending" readOnly style={readonlyInputStyle} />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Created At</label>
              <input name="createdAt" value={form.createdAt} readOnly style={readonlyInputStyle} />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Receptionist</label>
              <input name="createdByReceptionist" value={form.createdByReceptionist} readOnly style={readonlyInputStyle} />
            </div>
          </div>

          <div style={buttonRowStyle}>
            <button onClick={generateBakongQr} disabled={loadingQr || saving} style={primaryButtonStyle}>
              {loadingQr ? "Generating..." : "Generate Bakong QR"}
            </button>

            <button onClick={() => saveReceipt(false)} disabled={saving || loadingQr} style={secondaryButtonStyle}>
              {saving ? "Saving..." : "Save Receipt"}
            </button>

            <button onClick={() => saveReceipt(true)} disabled={saving || loadingQr} style={secondaryButtonStyle}>
              {saving ? "Saving..." : "Save & Download PDF"}
            </button>
          </div>
        </section>

        <aside style={sidePanelStyle}>
          <div style={sectionTitleStyle}>
            {form.receiptType === "MONTHLY" ? "Monthly Payment Tracking" : "Bakong Payment"}
          </div>
          <p style={sideTextStyle}>
            {form.receiptType === "MONTHLY"
              ? "Create the monthly student once here. After that, search by the monthly student ID in receipt list and use Mark Paid there for each next month."
              : "Generate a QR after entering the book price. The QR text and transaction hash will be saved with the receipt. The receipt can be used as proof for online or in-class study."}
          </p>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Receipt Type</div>
            <div style={{ ...summaryValueStyle, fontSize: 22 }}>
              {form.receiptType === "MONTHLY" ? "Monthly" : "Course"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Course</div>
            <div style={{ ...summaryValueStyle, fontSize: 17, lineHeight: 1.35 }}>
              {form.courseName || "—"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Student Name in English</div>
            <div style={{ ...summaryValueStyle, fontSize: 17, lineHeight: 1.35 }}>
              {form.studentNameEnglish || "—"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Student Name in Khmer</div>
            <div style={{ ...summaryValueStyle, fontSize: 17, lineHeight: 1.35 }}>
              {form.studentNameKhmer || "—"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Contact Information</div>
            <div style={{ ...summaryValueStyle, fontSize: 17, lineHeight: 1.35 }}>
              {form.contactInfo || "—"}
            </div>
          </div>

          {form.receiptType === "MONTHLY" && (
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Monthly Student ID</div>
              <div style={{ ...summaryValueStyle, fontSize: 22 }}>
                {form.studentCode || "Auto-generate after save"}
              </div>
            </div>
          )}

          {form.receiptType === "MONTHLY" && (
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Month Period</div>
              <div style={{ ...summaryValueStyle, fontSize: 22 }}>
                {formatMonthlyPeriod(form.monthlyPeriod)}
              </div>
              <div style={{ color: "var(--app-muted-strong)", fontSize: 14, marginTop: 6 }}>
                {formatMonthlyRangeLabel(form.monthlyPeriod, form.createdAt)}
              </div>
            </div>
          )}

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Book Price</div>
            <div style={summaryValueStyle}>
              {form.bookPrice ? `$${Number(form.bookPrice).toFixed(2)}` : "$0.00"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>
              {form.receiptType === "MONTHLY" ? "Monthly Price" : "Course Price"}
            </div>
            <div style={summaryValueStyle}>
              {form.programPrice ? `$${Number(form.programPrice).toFixed(2)}` : "$0.00"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Total Price</div>
            <div style={summaryValueStyle}>
              {form.totalPrice ? `$${Number(form.totalPrice).toFixed(2)}` : "$0.00"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Schedule</div>
            <div style={{ ...summaryValueStyle, fontSize: 17, lineHeight: 1.35 }}>
              {form.schedule || "—"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Payment Status</div>
            <div style={{ ...summaryValueStyle, fontSize: 22 }}>Pending</div>
          </div>

          {qrImage ? (
            <div style={qrPanelStyle}>
              <div style={khqrHeaderStyle}>
                <div style={khqrHeaderTextStyle}>KHQR</div>
                <div style={khqrHeaderCornerStyle} />
              </div>
              <div style={khqrBodyStyle}>
                <div style={khqrMerchantStyle}>CITO Payment</div>
                <div style={khqrAmountRowStyle}>
                  <div style={khqrAmountStyle}>
                    {Number(form.totalPrice || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div style={khqrCurrencyStyle}>USD</div>
                </div>
                <div style={khqrDividerStyle} />
                <div style={khqrImageWrapStyle}>
                  <img src={qrImage} alt="Bakong QR" style={qrImageStyle} />
                </div>
                {qrText && <div style={qrHelpStyle}>QR text saved for the print page.</div>}
              </div>
            </div>
          ) : (
            <div style={emptyQrStyle}>QR preview will appear here after generation.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  padding: 24,
  color: "var(--app-heading)",
};

const headerStyle: CSSProperties = {
  marginBottom: 22,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
};

const errorStyle: CSSProperties = {
  color: "var(--app-danger-text)",
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: 14,
  background: "var(--app-danger-bg)",
  border: "1px solid var(--app-danger-border)",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.85fr)",
  gap: 20,
  alignItems: "start",
};

const formPanelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 22,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
};

const sidePanelStyle: CSSProperties = {
  background: "var(--app-panel-bg)",
  borderRadius: 24,
  padding: 22,
  border: "var(--app-panel-border)",
  boxShadow: "var(--app-panel-shadow)",
  position: "sticky",
  top: 20,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 16,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const fieldBlockWideStyle: CSSProperties = {
  ...fieldBlockStyle,
  gridColumn: "1 / -1",
};

const coursePickerShellStyle: CSSProperties = {
  position: "relative",
};

const labelStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 13,
  fontWeight: 700,
};

const helperTextStyle: CSSProperties = {
  marginTop: 8,
  color: "var(--app-muted-strong)",
  fontSize: 13,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 52px 12px 14px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  color: "var(--app-muted)",
  background: "var(--app-input-readonly-bg)",
};

const pickerToggleStyle: CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  borderRadius: 10,
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--app-muted-strong)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  boxShadow: "var(--app-glow-soft)",
};

const pickerChevronStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1,
  transform: "translateY(-1px)",
};

const courseDropdownStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  right: 0,
  zIndex: 20,
  borderRadius: 18,
  border: "1px solid var(--app-border-strong)",
  background: "var(--app-card-elevated-bg)",
  boxShadow: "var(--app-glow-strong)",
  overflow: "hidden",
};

const courseDropdownHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderBottom: "1px solid var(--app-border-soft)",
  color: "var(--app-muted-strong)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const courseDropdownListStyle: CSSProperties = {
  maxHeight: 320,
  overflowY: "auto",
  padding: 10,
  display: "grid",
  gap: 8,
};

const courseMatchButtonStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg-strong)",
  color: "var(--app-heading)",
  boxShadow: "var(--app-glow-soft)",
  cursor: "pointer",
};

const courseMatchButtonSelectedStyle: CSSProperties = {
  border: "1px solid rgba(96, 165, 250, 0.45)",
  background: "rgba(96, 165, 250, 0.12)",
};

const courseOptionRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
};

const courseOptionTitleStyle: CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.35,
};

const courseOptionPriceStyle: CSSProperties = {
  color: "var(--app-accent-soft)",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const courseOptionMetaStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 12,
  marginTop: 4,
};

const noMatchStyle: CSSProperties = {
  color: "var(--app-muted-strong)",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 12,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
};

const selectedCourseStyle: CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(96, 165, 250, 0.12)",
  color: "var(--app-accent-soft)",
  border: "1px solid var(--app-border-soft)",
  fontSize: 13,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 22,
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(191, 219, 254, 0.28)",
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.3), 0 0 28px rgba(96, 165, 250, 0.24)",
};

const secondaryButtonStyle: CSSProperties = {
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid var(--app-secondary-border)",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
};

const sideTextStyle: CSSProperties = {
  color: "var(--app-subtle-text)",
  lineHeight: 1.7,
  marginTop: 0,
};

const summaryCardStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  marginBottom: 14,
  boxShadow: "var(--app-glow-soft)",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
};

const summaryValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  marginTop: 8,
  color: "var(--app-heading)",
};

const qrPanelStyle: CSSProperties = {
  marginTop: 18,
  borderRadius: 28,
  overflow: "hidden",
  background: "#f3f4f6",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
};

const qrImageStyle: CSSProperties = {
  width: "100%",
  maxWidth: 230,
  background: "white",
  padding: 8,
  borderRadius: 16,
  boxSizing: "border-box",
};

const qrHelpStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "#6b7280",
  wordBreak: "break-word",
  textAlign: "center",
};

const emptyQrStyle: CSSProperties = {
  marginTop: 18,
  padding: 24,
  borderRadius: 20,
  background: "var(--app-card-solid-bg)",
  color: "var(--app-muted)",
  border: "1px dashed var(--app-border-strong)",
  boxShadow: "var(--app-glow-soft)",
};

const khqrHeaderStyle: CSSProperties = {
  background: "#df3527",
  color: "#ffffff",
  padding: "20px 24px 16px",
  position: "relative",
  textAlign: "center",
};

const khqrHeaderTextStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const khqrHeaderCornerStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: -1,
  width: 0,
  height: 0,
  borderLeft: "36px solid transparent",
  borderTop: "36px solid #ffffff",
};

const khqrBodyStyle: CSSProperties = {
  background: "#ffffff",
  padding: "18px 24px 24px",
};

const khqrMerchantStyle: CSSProperties = {
  fontSize: 14,
  color: "#1f2937",
  marginBottom: 10,
};

const khqrAmountRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  flexWrap: "wrap",
};

const khqrAmountStyle: CSSProperties = {
  fontSize: 30,
  fontWeight: 800,
  color: "#111827",
};

const khqrCurrencyStyle: CSSProperties = {
  fontSize: 18,
  color: "#374151",
};

const khqrDividerStyle: CSSProperties = {
  borderTop: "2px dashed #c5cad3",
  margin: "18px 0 16px",
};

const khqrImageWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

function formatMonthlyPeriod(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;

  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatMonthlyPeriodWithDate(value: string, createdAt: string) {
  if (!value) return "-";
  return `${formatMonthlyPeriod(value)} • ${formatMonthlyRangeLabel(value, createdAt)}`;
}

function formatMonthlyRangeLabel(value: string, createdAt: string) {
  const range = buildMonthlyRange(value, createdAt);
  if (!range) return "-";

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return `${range.start.toLocaleDateString("en-US", formatOptions)} - ${range.end.toLocaleDateString("en-US", formatOptions)}`;
}
