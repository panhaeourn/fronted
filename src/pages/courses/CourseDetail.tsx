import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch, API_BASE } from "../../api";
import {
  backLinkStyle,
  errorStyle,
  loadingStyle,
  pageStyleWide,
  panelStyle,
  titleStyleMd,
} from "../../lib/uiStyles";

type Course = {
  id: number;
  title: string;
  description?: string;
  price?: number;
  enrolled?: boolean;
};

type CourseVideo = {
  id: number;
  title?: string;
  fileName?: string;
  videoUrl?: string;
  sortOrder?: number;
};

const CLOUD_FLARE_R2_PUBLIC_BASE = (
  import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_BASE_URL ?? ""
).replace(/\/$/, "");

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const isLightTheme =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "light";

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        const courseData = await apiFetch<Course>(`/api/courses/${id}`);
        setCourse(courseData);

        const videoData = await apiFetch<CourseVideo[]>(
          `/api/course-videos/course/${id}`
        );
        setVideos(videoData || []);

        if (videoData && videoData.length > 0) {
          setSelectedVideoId(videoData[0].id);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) || videos[0] || null,
    [videos, selectedVideoId]
  );

  const selectedVideoSrc = useMemo(() => {
    if (!selectedVideo) return "";

    if (CLOUD_FLARE_R2_PUBLIC_BASE && selectedVideo.fileName) {
      return encodeURI(`${CLOUD_FLARE_R2_PUBLIC_BASE}/${selectedVideo.fileName}`);
    }

    if (selectedVideo.videoUrl) {
      const rawUrl = selectedVideo.videoUrl.startsWith("http")
        ? selectedVideo.videoUrl
        : `${API_BASE}${selectedVideo.videoUrl}`;
      return encodeURI(rawUrl);
    }

    if (selectedVideo.fileName) {
      return encodeURI(`${API_BASE}/files/${selectedVideo.fileName}`);
    }

    return "";
  }, [selectedVideo]);

  if (loading) return <div style={loadingStyle}>Loading course...</div>;
  if (err) return <div style={errorStyle}>{err}</div>;
  if (!course) return <div style={loadingStyle}>Course not found</div>;

  return (
    <div style={pageStyleWide}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleMd}>{course.title}</h1>
          <div style={subheadStyle}>
            Continue your lessons in a cleaner, focused player workspace.
          </div>
        </div>

        <Link to="/courses" style={backLinkStyle}>
          <span aria-hidden="true">←</span>
          <span>Back to Courses</span>
        </Link>
      </div>

      <div style={statsGridStyle}>
        <InfoCard
          label="Price"
          value={`$${Number(course.price || 0).toFixed(0)}`}
          accent="#60a5fa"
        />
        <InfoCard
          label="Status"
          value={course.enrolled ? "Enrolled" : "Locked"}
          accent={course.enrolled ? "#34d399" : "#f87171"}
        />
        <InfoCard
          label="Lessons"
          value={String(videos.length)}
          accent="#a78bfa"
        />
      </div>

      {!course.enrolled && (
        <div style={noticeStyle}>
          Buy this course first to access the content.
        </div>
      )}

      {course.enrolled && videos.length === 0 && (
        <div style={noticeStyle}>
          You are enrolled. No videos uploaded yet.
        </div>
      )}

      {course.enrolled && videos.length > 0 && selectedVideo && (
        <div style={contentGridStyle}>
          <section style={panelStyle}>
            <div style={videoFrameStyle}>
              <video
                key={selectedVideo.id}
                controls
                preload="auto"
                playsInline
                style={videoStyle}
              >
                <source src={selectedVideoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div style={detailsPanelStyle}>
              <div style={eyebrowStyle}>
                Lesson {videos.findIndex((video) => video.id === selectedVideo.id) + 1}
              </div>
              <h2 style={lessonTitleStyle}>
                {selectedVideo.title || "Untitled Video"}
              </h2>
              <p style={descriptionStyle}>
                {course.description || "No description yet."}
              </p>
            </div>
          </section>

          <aside style={playlistPanelStyle}>
            <h3 style={playlistTitleStyle}>Course Playlist</h3>
            <div style={playlistListStyle}>
              {videos.map((video, index) => {
                const active = selectedVideo.id === video.id;

                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoId(video.id)}
                    style={{
                      ...playlistItemStyle,
                      border: active
                        ? "1px solid rgba(96, 165, 250, 0.42)"
                        : "1px solid rgba(148, 163, 184, 0.16)",
                      background: active
                        ? isLightTheme
                          ? "linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(191, 219, 254, 0.88))"
                          : "linear-gradient(180deg, rgba(29, 49, 92, 0.96), rgba(17, 27, 54, 0.94))"
                        : isLightTheme
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))",
                      boxShadow: active
                        ? isLightTheme
                          ? "0 14px 30px rgba(96, 165, 250, 0.18)"
                          : "0 14px 30px rgba(59, 130, 246, 0.22)"
                        : isLightTheme
                        ? "0 10px 24px rgba(15, 23, 42, 0.06)"
                        : "none",
                    }}
                  >
                    <div style={playlistThumbStyle}>
                      <div
                        style={{
                          ...playlistThumbFallbackStyle,
                          background: active
                            ? "linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(37, 99, 235, 0.92))"
                            : playlistThumbFallbackStyle.background,
                        }}
                      >
                        {active ? "Now Playing" : "Video"}
                      </div>
                    </div>

                    <div style={playlistTextWrapStyle}>
                      <div
                        style={{
                          ...playlistLessonStyle,
                          color: active
                            ? isLightTheme
                              ? "#2563eb"
                              : "#8fd8ff"
                            : isLightTheme
                            ? "#64748b"
                            : "#9ab0d3",
                        }}
                      >
                        Lesson {index + 1}
                      </div>
                      <div
                        style={{
                          ...playlistVideoTitleStyle,
                          color: active
                            ? isLightTheme
                              ? "#0f172a"
                              : "#f8fbff"
                            : isLightTheme
                            ? "#1e293b"
                            : "#e2e8f0",
                        }}
                      >
                        {video.title || `Video ${index + 1}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        ...infoCardStyle,
        boxShadow: `0 18px 36px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(147, 197, 253, 0.14), 0 0 40px ${toTransparent(
          accent,
          0.24
        )}`,
      }}
    >
      <div
        style={{
          ...infoGlowStyle,
          background: `radial-gradient(circle, ${toTransparent(
            accent,
            0.36
          )} 0%, transparent 70%)`,
        }}
      />
      <div style={infoLabelTextStyle}>{label}</div>
      <div style={infoValueTextStyle}>{value}</div>
    </div>
  );
}

function toTransparent(color: string, alpha: number) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 18,
  flexWrap: "wrap",
  marginBottom: 22,
};

const subheadStyle: React.CSSProperties = {
  marginTop: 10,
  color: "var(--app-muted)",
  lineHeight: 1.7,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const infoCardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "var(--app-card-elevated-bg)",
  borderRadius: 22,
  padding: 18,
  border: "1px solid var(--app-border-soft)",
};

const infoGlowStyle: React.CSSProperties = {
  position: "absolute",
  top: -24,
  right: -10,
  width: 88,
  height: 88,
  borderRadius: "50%",
};

const infoLabelTextStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
};

const infoValueTextStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 28,
  fontWeight: 800,
  color: "var(--app-heading)",
};

const noticeStyle: React.CSSProperties = {
  ...panelStyle,
  color: "var(--app-heading)",
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.8fr) minmax(320px, 0.95fr)",
  gap: 24,
  alignItems: "start",
};

const videoFrameStyle: React.CSSProperties = {
  background: "#000",
  borderRadius: 20,
  overflow: "hidden",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const videoStyle: React.CSSProperties = {
  width: "100%",
  display: "block",
  background: "#000",
  maxHeight: 720,
};

const detailsPanelStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 20,
  borderRadius: 18,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--app-accent-soft)",
  fontSize: 13,
  marginBottom: 8,
};

const lessonTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  color: "var(--app-heading)",
};

const descriptionStyle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "var(--app-muted-strong)",
  lineHeight: 1.7,
};

const playlistPanelStyle: React.CSSProperties = {
  ...panelStyle,
  position: "sticky",
  top: 20,
};

const playlistTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "var(--app-heading)",
};

const playlistListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 16,
};

const playlistItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "132px 1fr",
  gap: 12,
  width: "100%",
  borderRadius: 16,
  padding: 10,
  cursor: "pointer",
  textAlign: "left",
  alignItems: "center",
};

const playlistTextWrapStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

const playlistThumbStyle: React.CSSProperties = {
  background: "#000",
  borderRadius: 12,
  overflow: "hidden",
  height: 80,
};

const playlistThumbFallbackStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  background:
    "linear-gradient(180deg, rgba(6, 16, 35, 0.92), rgba(16, 33, 68, 0.92))",
};

const playlistLessonStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#93c5fd",
  marginBottom: 6,
};

const playlistVideoTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.4,
  fontSize: 15,
  wordBreak: "break-word",
};
