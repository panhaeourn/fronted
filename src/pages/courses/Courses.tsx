import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import ConfirmDialog from "../../components/ConfirmDialog";
import CreateCourseForm from "../../components/CreateCourseForm";
import BakongQrModal from "../../components/BakongQrModal";
import type { CourseRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import {
  type TeacherPhotoConfig,
  getTeacherPhotoMap,
  removeTeacherPhoto,
} from "../../lib/courseTeacherPhoto";

function sortCoursesNewestFirst(list: CourseRecord[]) {
  return [...list].sort((a, b) => b.id - a.id);
}

type MeUser = {
  id: number;
  email: string;
  username: string;
  name: string;
  role: "ADMIN" | "RECEPTIONIST" | "USER";
};

export default function Courses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [teacherPhotos, setTeacherPhotos] = useState<Record<number, TeacherPhotoConfig>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [meLoaded, setMeLoaded] = useState(false);

  const [me, setMe] = useState<MeUser | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payCourseId, setPayCourseId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

  async function loadCourses() {
    setErr("");
    setLoading(true);

    try {
      const list = await apiFetch<CourseRecord[]>("/api/courses");
      const sorted = sortCoursesNewestFirst(list || []);
      setCourses(sorted);
      setTeacherPhotos(getTeacherPhotoMap(sorted.map((course) => course.id)));
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to load courses"));
    } finally {
      setLoading(false);
    }
  }

  async function loadMe() {
    try {
      const user = await apiFetch<MeUser>("/api/auth/me");
      setMe(user);
    } catch {
      setMe(null);
    } finally {
      setMeLoaded(true);
    }
  }

  function openPayment(courseId: number, amount: number) {
    setPayCourseId(courseId);
    setPayAmount(amount);
    setPayOpen(true);
  }

  function closePayment() {
    setPayOpen(false);
    setPayCourseId(null);
    setPayAmount(0);
  }

  async function handlePaid() {
    closePayment();
    await loadCourses();
    alert("Payment successful. Course unlocked.");
  }

  async function handleDelete(courseId: number) {
    try {
      await apiFetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      removeTeacherPhoto(courseId);
      await loadCourses();
      alert("Course deleted");
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to delete course"));
    }
  }

  function handleUpdate(courseId: number) {
    navigate(`/courses/${courseId}/edit`);
  }

  function handleUploadVideo(courseId: number) {
    navigate(`/courses/${courseId}/upload`);
  }

  useEffect(() => {
    loadCourses();
    loadMe();
  }, []);

  const isAdmin = me?.role === "ADMIN";
  const isGuest = meLoaded && !me;
  const showGuestCta = isGuest && !loading;
  const showError = !!err && !showGuestCta;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1240,
        margin: "0 auto",
        color: "var(--app-heading)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "clamp(1.45rem, 2.4vw, 1.9rem)" }}>
            Courses
          </h2>
        </div>

        <button
          onClick={loadCourses}
          disabled={loading}
          style={refreshButtonStyle}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
            }}
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              aria-hidden="true"
              style={{
                display: "block",
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            >
              <path
                d="M16.5 10a6.5 6.5 0 1 1-1.6-4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M13.8 3.8h2.9v2.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>{loading ? "Refreshing" : "Refresh"}</span>
        </button>
      </div>

      {showError && (
        <div
          style={{
            color: "var(--app-danger-text)",
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 14,
            background: "var(--app-danger-bg)",
            border: "1px solid var(--app-danger-border)",
          }}
        >
          {err}
        </div>
      )}

      {showGuestCta && (
        <div
          style={{
            marginBottom: 22,
            padding: "28px 24px",
            borderRadius: 24,
            border: "1px solid rgba(191, 219, 254, 0.28)",
            background:
              "radial-gradient(circle at top right, rgba(82, 140, 255, 0.22), transparent 32%), var(--app-card-elevated-bg)",
            boxShadow: "var(--app-panel-shadow)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(96, 165, 250, 0.16)",
                  color: "var(--app-accent-soft)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Guest Access
              </div>
              <h3 style={{ margin: "16px 0 10px", fontSize: 28 }}>
                Register to See Courses
              </h3>
              <p style={{ margin: 0, color: "var(--app-subtle-text)", maxWidth: 680, lineHeight: 1.7 }}>
                Create an account or sign in to browse the course catalog,
                unlock enrollments, and access your learning dashboard.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button onClick={() => navigate("/register")} style={primaryActionStyle}>
                Register
              </button>
              <button onClick={() => navigate("/login")} style={secondaryActionStyle}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div
          style={{
            marginBottom: 22,
            padding: 20,
            borderRadius: 22,
            background: "var(--app-panel-bg)",
            border: "var(--app-panel-border)",
            boxShadow: "var(--app-panel-shadow)",
          }}
        >
          <CreateCourseForm
            onCreated={(course) =>
              setCourses((prev) => sortCoursesNewestFirst([course, ...prev]))
            }
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}
      >
        {courses.map((course) => {
          const price = typeof course.price === "number" ? course.price : 5;
          const teacherPhoto = teacherPhotos[course.id];

          return (
            <div
              key={course.id}
              className="course-card-hover"
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(191, 219, 254, 0.24)",
                borderRadius: 24,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 18,
                minHeight: 280,
                background:
                  "radial-gradient(circle at top right, rgba(73, 120, 255, 0.26), transparent 24%), var(--app-card-elevated-bg)",
                boxShadow: "var(--app-panel-shadow)",
              }}
            >
              {teacherPhoto?.src && (
                <>
                  <div style={posterBackgroundStyle}>
                    <img
                      src={teacherPhoto.src}
                      alt={`${course.title} poster`}
                      style={{
                        ...teacherPosterStyle,
                        objectPosition: `${teacherPhoto.positionX}% ${teacherPhoto.positionY}%`,
                        transform: `scale(${teacherPhoto.scale ?? 1})`,
                      }}
                    />
                  </div>
                  <div
                    style={posterOverlayStyle(teacherPhoto.bottomDarkness)}
                  />
                </>
              )}

              <div
                style={{
                  position: "absolute",
                  top: -28,
                  right: -12,
                  width: 144,
                  height: 144,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(120, 190, 255, 0.58) 0%, rgba(120, 190, 255, 0.24) 40%, transparent 74%)",
                  filter: "blur(10px)",
                }}
              />

              <div style={{ flex: 1, position: "relative" }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(96, 165, 250, 0.16)",
                    color: "var(--app-accent-soft)",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  {course.enrolled ? "Unlocked" : "Available"}
                </div>

                <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>
                  {course.title}
                </div>

                {course.description && (
                  <div
                    style={{
                      color: "var(--app-subtle-text)",
                      marginTop: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    {course.description}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 18,
                    color: "var(--app-muted-strong)",
                    fontSize: 10,
                  }}
                >
                  Course Price
                </div>
                <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800 }}>
                  ${Number(price).toFixed(0)}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    color: "var(--app-muted-strong)",
                    fontSize: 13,
                    minHeight: 20,
                  }}
                >
                  {!course.enrolled ? "Purchase to unlock the course content." : "\u00A0"}
                </div>

                {course.enrolled && (
                  <div style={{ marginTop: 10, color: "#34d399", fontWeight: 700 }}>
                    Enrolled
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: isAdmin ? "repeat(2, minmax(0, 1fr))" : "1fr",
                }}
              >
                {course.enrolled ? (
                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    style={primaryActionStyle}
                  >
                    Open
                  </button>
                ) : (
                  <button
                    onClick={() => openPayment(course.id, price)}
                    style={primaryActionStyle}
                  >
                    Buy
                  </button>
                )}

                  {isAdmin && (
                    <>
                      <button onClick={() => handleUpdate(course.id)} style={secondaryActionStyle}>
                        Update
                      </button>

                    <button onClick={() => setCourseToDelete(course.id)} style={dangerActionStyle}>
                      Delete
                    </button>

                      <button
                        onClick={() => handleUploadVideo(course.id)}
                        style={secondaryActionStyle}
                      >
                        Upload Video
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
        })}

        {!loading && courses.length === 0 && !showGuestCta && (
          <div
            style={{
              opacity: 0.8,
              padding: 24,
              borderRadius: 18,
              background: "var(--app-card-solid-bg)",
            }}
          >
            No courses yet.
          </div>
        )}
      </div>

      <BakongQrModal
        open={payOpen}
        courseId={payCourseId}
        amount={payAmount}
        onClose={closePayment}
        onPaid={handlePaid}
      />

      <ConfirmDialog
        open={courseToDelete !== null}
        title="Delete course?"
        message="This will permanently remove the course from the catalog."
        confirmText="Delete"
        tone="danger"
        onCancel={() => setCourseToDelete(null)}
        onConfirm={() => {
          if (courseToDelete !== null) {
            void handleDelete(courseToDelete);
          }
          setCourseToDelete(null);
        }}
      />
    </div>
  );
}

const actionButtonBaseStyle: React.CSSProperties = {
  minHeight: 52,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "12px 16px",
  borderRadius: 14,
  fontWeight: 700,
  fontSize: 16,
  lineHeight: 1.2,
  textAlign: "center",
};

const primaryActionStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  border: "1px solid rgba(191, 219, 254, 0.28)",
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.22), 0 0 28px rgba(96, 165, 250, 0.24)",
};

const secondaryActionStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  background: "var(--app-secondary-bg)",
  color: "var(--app-secondary-text)",
  border: "1px solid var(--app-secondary-border)",
  boxShadow: "var(--app-glow-soft)",
};

const dangerActionStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  background:
    "linear-gradient(135deg, rgba(123, 31, 55, 0.96), rgba(175, 62, 84, 0.92))",
  color: "#fff",
  border: "1px solid rgba(251, 146, 146, 0.28)",
  boxShadow:
    "0 14px 28px rgba(127, 29, 29, 0.24), 0 0 24px rgba(248, 113, 113, 0.16)",
};

const refreshButtonStyle: React.CSSProperties = {
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px 18px",
  borderRadius: 16,
  border: "1px solid rgba(191, 219, 254, 0.3)",
  background:
    "linear-gradient(135deg, rgba(63, 111, 255, 0.98), rgba(90, 181, 255, 0.96))",
  color: "#ffffff",
  fontWeight: 800,
  letterSpacing: "0.02em",
  boxShadow:
    "0 16px 34px rgba(36, 108, 255, 0.28), 0 0 34px rgba(96, 165, 250, 0.26)",
};

const posterBackgroundStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  borderRadius: 24,
  pointerEvents: "none",
};

const teacherPosterStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  opacity: 0.96,
  transition: "object-position 180ms ease, transform 180ms ease",
  transformOrigin: "center center",
};

const posterOverlayStyle = (bottomDarkness: number): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  borderRadius: 24,
  background: (() => {
    const t = Math.max(0, Math.min(1, bottomDarkness / 100));
    const eased = 1 - Math.pow(1 - t, 2.1);
    const top = 0.015 + eased * 0.035;
    const upper = 0.035 + eased * 0.075;
    const mid = 0.14 + eased * 0.28;
    const lower = 0.36 + eased * 0.46;
    const deep = 0.64 + eased * 0.34;
    return `linear-gradient(180deg, rgba(8, 16, 35, ${top}) 0%, rgba(8, 16, 35, ${upper}) 18%, rgba(8, 16, 35, ${mid}) 42%, rgba(8, 16, 35, ${lower}) 68%, rgba(8, 16, 35, ${deep}) 100%)`;
  })(),
  boxShadow: "inset 0 0 0 1px rgba(191, 219, 254, 0.08)",
  transition: "background 180ms ease",
  pointerEvents: "none",
});
