import { useState } from "react";
import { apiFetch } from "../api";
import type { CourseRecord } from "../lib/domain-types";
import { getErrorMessage } from "../lib/errors";

export default function CreateCourseForm({
  onCreated,
}: {
  onCreated: (course: CourseRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">(5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    // ✅ validation (FIXED)
    if (!title.trim()) {
      setErr("Title is required");
      return;
    }

    if (price === "" || Number.isNaN(price) || price <= 0) {
      setErr("Price must be > 0");
      return;
    }

    try {
      setLoading(true);

      const created = await apiFetch<CourseRecord>("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          price,
        }),
      });

      onCreated(created);

      // reset form
      setTitle("");
      setDescription("");
      setPrice(5);
    } catch (error: unknown) {
      console.error("CREATE COURSE ERROR:", error);
      setErr(getErrorMessage(error, "Failed to create course"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={formStyle}>
      <div style={formHeaderStyle}>
        <span style={formIconStyle} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="23" height="23">
            <path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12H7.5A2.5 2.5 0 0 1 5 16.5v-12Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M5 16.5A2.5 2.5 0 0 1 7.5 14H18M9 8.5h5M11.5 6v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <div style={eyebrowStyle}>Course administration</div>
          <h3 style={{ margin: "3px 0 0", fontSize: 25, color: "var(--app-heading)" }}>
            Create Course
          </h3>
        </div>
      </div>
      <p style={{ margin: "0", color: "var(--app-muted)", lineHeight: 1.6 }}>
        Add the essential course details now. You can upload lessons and a teacher photo afterward.
      </p>

      {err && (
        <div
          style={{
            color: "var(--app-danger-text)",
            marginBottom: 12,
            padding: "12px 14px",
            borderRadius: 14,
            background: "var(--app-danger-bg)",
            border: "1px solid var(--app-danger-border)",
          }}
        >
          {err}
        </div>
      )}

      <div style={fieldsStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Course title <strong style={requiredStyle}>*</strong></span>
          <input
            placeholder="Example: Advanced Web Development"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            maxLength={120}
          />
        </label>

        <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
          <span style={labelStyle}>Description</span>
          <textarea
            placeholder="Describe what students will learn in this course"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", minHeight: 112 }}
            maxLength={1000}
          />
          <span style={helperStyle}>{description.length}/1000 characters</span>
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Course price <strong style={requiredStyle}>*</strong></span>
          <span style={priceWrapStyle}>
            <span style={currencyStyle}>$</span>
            <input
              type="number"
              aria-label="Course price"
              placeholder="5.00"
              min={0.01}
              step={0.01}
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              style={{ ...inputStyle, paddingLeft: 48 }}
            />
            <span style={usdStyle}>USD</span>
          </span>
        </label>

        <button disabled={loading} type="submit" style={{ ...submitButtonStyle, opacity: loading ? 0.7 : 1 }}>
          <span>{loading ? "Creating..." : "Create Course"}</span>
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </div>
    </form>
  );
}

const formStyle: React.CSSProperties = { margin: 0, display: "grid", gap: 20 };
const formHeaderStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14 };
const formIconStyle: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 15, display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "#8ed8ff", background: "linear-gradient(145deg, rgba(61,118,255,.3), rgba(33,211,255,.12))",
  border: "1px solid rgba(125,211,252,.25)", boxShadow: "0 12px 28px rgba(37,99,235,.16)",
};
const eyebrowStyle: React.CSSProperties = { color: "var(--app-accent-soft)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" };
const fieldsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 8, minWidth: 0 };
const labelStyle: React.CSSProperties = { color: "var(--app-heading)", fontSize: 13, fontWeight: 750 };
const requiredStyle: React.CSSProperties = { color: "#60a5fa" };
const helperStyle: React.CSSProperties = { justifySelf: "end", color: "var(--app-muted)", fontSize: 11 };
const priceWrapStyle: React.CSSProperties = { position: "relative", display: "block" };
const currencyStyle: React.CSSProperties = { position: "absolute", left: 17, top: "50%", transform: "translateY(-50%)", zIndex: 1, color: "var(--app-accent-soft)", fontWeight: 800 };
const usdStyle: React.CSSProperties = { position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)", color: "var(--app-muted)", fontSize: 11, fontWeight: 800, letterSpacing: ".08em" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  padding: "13px 16px",
  borderRadius: 13,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
  outline: "none",
  fontSize: 14,
};

const submitButtonStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  minHeight: 50,
  padding: "12px 18px",
  borderRadius: 13,
  border: "1px solid rgba(191, 219, 254, 0.28)",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  alignSelf: "end",
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.22), 0 0 28px rgba(96, 165, 250, 0.24)",
};
