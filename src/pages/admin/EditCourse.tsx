import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiFetch } from "../../api";
import type { CourseRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import {
  backLinkStyle,
  errorStyle,
  fieldGroupStyle,
  headerStyle,
  infoCardStyle,
  infoLabelStyle,
  infoValueStyle,
  inputStyle,
  labelStyle,
  loadingStyle,
  pageStyleWide,
  panelStyle,
  primaryButtonStyle,
  secondaryLinkStyle,
  titleStyleMd,
} from "../../lib/uiStyles";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">(5);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setPageLoading(true);
        const data = await apiFetch<CourseRecord>(`/api/courses/${id}`);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice(data.price ?? 5);
      } catch (error: unknown) {
        setErr(getErrorMessage(error, "Failed to load course"));
      } finally {
        setPageLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!id) {
      setErr("Course id is missing");
      return;
    }

    if (!title.trim()) {
      setErr("Title is required");
      return;
    }

    if (price === "" || Number(price) <= 0) {
      setErr("Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      await apiFetch(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          price,
        }),
      });

      alert("Course updated successfully");
      navigate("/courses");
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to update course"));
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) return <div style={loadingStyle}>Loading...</div>;

  return (
    <div style={pageStyleWide}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleMd}>Update Course</h1>
        </div>

        <Link to="/courses" style={backLinkStyle}>
          <span aria-hidden="true">←</span>
          <span>Back to Courses</span>
        </Link>
      </div>

      <div style={contentGridStyle}>
        <section style={panelStyle}>
          <div style={{ position: "relative" }}>
            <div style={eyebrowStyle}>Editing Course</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
              {title || "Untitled Course"}
            </div>
            <div style={{ color: "#9db4d8", marginTop: 10, lineHeight: 1.7 }}>
              Review and update the main course details before saving your changes.
            </div>

            <div style={infoGridStyle}>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Course ID</div>
                  <div style={infoValueStyle}>#{id || "-"}</div>
                </div>
                <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Current Price</div>
                <div style={infoValueStyle}>{Number(price || 0).toFixed(2)} USD</div>
              </div>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ position: "relative" }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Course Details</h2>
            <p style={{ margin: "10px 0 0", color: "#9db4d8", lineHeight: 1.7 }}>
              Update the title, description, and price for this course.
            </p>

            {err && <div style={errorStyle}>{err}</div>}

            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Course Title</label>
                <input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={textareaStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Price</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Price"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="submit" disabled={loading} style={primaryButtonStyle}>
                  {loading ? "Updating..." : "Update Course"}
                </button>
                <Link to="/courses" style={secondaryLinkStyle}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

const eyebrowStyle: React.CSSProperties = {
  color: "#8ca7d8",
  fontSize: 13,
  marginBottom: 8,
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 0.9fr) minmax(420px, 1.3fr)",
  gap: 22,
  alignItems: "start",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  marginTop: 18,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
  marginTop: 22,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 150,
  resize: "vertical",
};
