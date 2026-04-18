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
    <form onSubmit={submit} style={{ marginBottom: 0 }}>
      <h3 style={{ margin: "8px 0", fontSize: 24, color: "var(--app-heading)" }}>
        Create Course
      </h3>
      <p style={{ margin: "0 0 16px", color: "var(--app-muted)" }}>
        Add a new training course without leaving the catalog page.
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

      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Price"
          min={1}
          value={price}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          style={inputStyle}
        />

        <button disabled={loading} type="submit" style={submitButtonStyle}>
          {loading ? "Creating..." : "Create"}
        </button>

        <div style={{ opacity: 0.75, fontSize: 12, color: "var(--app-muted)" }}>
          Note: you must be logged in (Google / cookie session) or backend
          returns 401/403.
        </div>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-input-bg)",
  color: "var(--app-input-text)",
  boxSizing: "border-box",
  boxShadow: "var(--app-glow-soft)",
};

const submitButtonStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  color: "#fff",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid rgba(191, 219, 254, 0.28)",
  fontWeight: 700,
  boxShadow:
    "0 14px 30px rgba(33, 126, 255, 0.22), 0 0 28px rgba(96, 165, 250, 0.24)",
};
