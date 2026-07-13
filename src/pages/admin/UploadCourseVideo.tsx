import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiFetch, API_BASE } from "../../api";
import type { CourseRecord } from "../../lib/domain-types";
import { getErrorMessage } from "../../lib/errors";
import {
  type TeacherPhotoConfig,
  getTeacherPhotoConfig,
  readImageFileAsCompressedDataUrl,
  removeTeacherPhoto,
  setTeacherPhoto,
} from "../../lib/courseTeacherPhoto";
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

export default function UploadCourseVideo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [teacherPhoto, setTeacherPhotoState] = useState("");
  const [photoPositionX, setPhotoPositionX] = useState(50);
  const [photoPositionY, setPhotoPositionY] = useState(0);
  const [bottomDarkness, setBottomDarkness] = useState(90);
  const [photoScale, setPhotoScale] = useState(1);
  const [teacherPhotoUploadName, setTeacherPhotoUploadName] =
    useState("teacher-photo.jpg");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [err, setErr] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [photoAutoSaveMessage, setPhotoAutoSaveMessage] = useState("");
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number | null>(null);
  const skipNextPhotoAutoSaveRef = useRef(true);
  const activeFile =
    currentUploadIndex !== null ? files[currentUploadIndex] : files[0] || null;
  const totalUploadSize = files.reduce((sum, item) => sum + item.size, 0);

  useEffect(() => {
    if (!id) return;
    skipNextPhotoAutoSaveRef.current = true;

    (async () => {
      try {
        setPageLoading(true);
        const data = await apiFetch<CourseRecord>(`/api/courses/${id}`);
        setCourse(data);
        const photoConfig = getCourseTeacherPhotoConfig(data);
        setTeacherPhotoState(photoConfig.src);
        setPhotoPositionX(photoConfig.positionX);
        setPhotoPositionY(photoConfig.positionY);
        setBottomDarkness(photoConfig.bottomDarkness);
        setPhotoScale(photoConfig.scale);
      } catch (error: unknown) {
        setErr(getErrorMessage(error, "Failed to load course"));
      } finally {
        setPageLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    if (skipNextPhotoAutoSaveRef.current) {
      skipNextPhotoAutoSaveRef.current = false;
      return;
    }

    if (!teacherPhoto) return;

    const photoConfig = {
      src: teacherPhoto,
      positionX: photoPositionX,
      positionY: photoPositionY,
      bottomDarkness,
      scale: photoScale,
    };
    setTeacherPhoto(Number(id), photoConfig);
    setPhotoAutoSaveMessage("Photo layout saved automatically.");

    const timeoutId = window.setTimeout(() => {
      void updateCourseTeacherPhotoLayout(Number(id), photoConfig).catch(() => {
        setPhotoAutoSaveMessage("Photo layout saved locally. Backend sync failed.");
      });
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [id, teacherPhoto, photoPositionX, photoPositionY, bottomDarkness, photoScale]);

  useEffect(() => {
    if (!photoAutoSaveMessage) return;
    const timeoutId = window.setTimeout(() => setPhotoAutoSaveMessage(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [photoAutoSaveMessage]);

  async function handleVideoSelection(selectedFiles: File[]) {
    setErr("");
    setSuccessMessage("");
    setUploadProgress(0);
    setCurrentUploadIndex(null);
    setFiles([]);

    try {
      await Promise.all(selectedFiles.map(validateFastStreamingMp4));
      setFiles(selectedFiles);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Video is not ready for browser streaming"));
    }
  }

  async function uploadSingleVideo(selectedFile: File, uploadTitle: string) {
    if (!id) {
      throw new Error("Course id is missing");
    }

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("title", uploadTitle);

    await uploadCourseVideo(id, form, setUploadProgress);
  }

  async function saveTeacherPhotoToCloudflare(
    dataUrl = teacherPhoto,
    originalFileName = teacherPhotoUploadName,
    photoConfig: TeacherPhotoConfig = {
      src: dataUrl,
      positionX: photoPositionX,
      positionY: photoPositionY,
      bottomDarkness,
      scale: photoScale,
    }
  ) {
    if (!id) return;

    if (!dataUrl.startsWith("data:")) {
      setPhotoAutoSaveMessage("Teacher photo is already saved to website.");
      return;
    }

    try {
      setErr("");
      setPhotoSaving(true);
      setPhotoAutoSaveMessage("Saving teacher photo to Cloudflare...");

      const savedCourse = await uploadCourseTeacherPhoto(
        Number(id),
        dataUrl,
        originalFileName,
        photoConfig
      );
      setCourse(savedCourse);
      const savedPhotoConfig = getCourseTeacherPhotoConfig(savedCourse);
      setTeacherPhotoState(savedPhotoConfig.src);
      setTeacherPhoto(Number(id), savedPhotoConfig);
      setPhotoAutoSaveMessage("Teacher photo saved to website.");
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed to save teacher photo"));
      setPhotoAutoSaveMessage("Teacher photo is only saved on this browser.");
    } finally {
      setPhotoSaving(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!files.length) {
      setErr("Please choose at least one video file");
      return;
    }

    let failedIndex = 0;

    try {
      setLoading(true);
      setSuccessMessage("");

      for (let index = 0; index < files.length; index += 1) {
        failedIndex = index;
        const selectedFile = files[index];
        setCurrentUploadIndex(index);
        setUploadProgress(0);

        const fallbackTitle = selectedFile.name.replace(/\.[^/.]+$/, "");
        const uploadTitle =
          files.length === 1
            ? title.trim() || fallbackTitle
            : title.trim()
              ? `${title.trim()} ${index + 1}`
              : fallbackTitle;

        await uploadSingleVideo(selectedFile, uploadTitle);
        setUploadProgress(100);
      }

      setSuccessMessage(
        files.length === 1
          ? "Video uploaded successfully."
          : `${files.length} videos uploaded successfully.`
      );
    } catch (error: unknown) {
      const failedFile = files[failedIndex]?.name;
      setErr(
        getErrorMessage(
          error,
          failedFile ? `Upload failed for ${failedFile}` : "Upload failed"
        )
      );
    } finally {
      setLoading(false);
      setCurrentUploadIndex(null);
    }
  }

  if (pageLoading) return <div style={loadingStyle}>Loading...</div>;

  return (
    <div style={pageStyleWide}>
      {loading && (
        <div style={uploadOverlayStyle}>
          <div style={uploadOverlayCardStyle}>
            <div style={uploadOverlayEyebrowStyle}>
              {uploadProgress < 100 ? "Uploading Video" : "Saving To Cloudflare"}
            </div>
            <div style={uploadOverlayPercentStyle}>{uploadProgress}%</div>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressFillStyle,
                  width: `${uploadProgress}%`,
                }}
              />
            </div>
            <div style={uploadOverlayTextStyle}>
              {uploadProgress < 100
                ? `Uploading ${activeFile?.name || "selected video"}${
                    files.length > 1 && currentUploadIndex !== null
                      ? ` (${currentUploadIndex + 1} of ${files.length})`
                      : ""
                  }.`
                : "Browser upload is complete. The backend is now saving the file to Cloudflare R2."}
            </div>
          </div>
        </div>
      )}

      <div style={headerStyle}>
        <div>
          <h1 style={titleStyleMd}>Upload Course Video</h1>
        </div>

        <Link to="/courses" style={backLinkStyle}>
          <span aria-hidden="true">←</span>
          <span>Back to Courses</span>
        </Link>
      </div>

      <div style={contentGridStyle}>
        {course && (
          <section style={panelStyle}>
            <div style={{ position: "relative" }}>
              <div style={eyebrowStyle}>Selected Course</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
                {course.title}
              </div>
              <div style={{ color: "var(--app-muted)", marginTop: 10, lineHeight: 1.7 }}>
                {course.description || "Upload structured lesson videos to enrich this course experience."}
              </div>
              <div style={courseMetaGridStyle}>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Course ID</div>
                  <div style={infoValueStyle}>#{course.id}</div>
                </div>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Price</div>
                  <div style={infoValueStyle}>
                    {Number(course.price || 0).toFixed(2)} USD
                  </div>
                </div>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Teacher Photo</div>
                  <div style={{ marginTop: 10 }}>
                    {teacherPhoto ? (
                      <img
                        src={teacherPhoto}
                        alt="Teacher preview"
                        style={teacherPhotoAvatarStyle}
                      />
                    ) : (
                      <div style={photoEmptyStyle}>No photo selected</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section style={panelStyle}>
          <div style={{ position: "relative" }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Video Details</h2>
            <p style={{ margin: "10px 0 0", color: "var(--app-muted)", lineHeight: 1.7 }}>
              Use a clear lesson title and select one or more video files to upload.
            </p>

            {err && <div style={errorStyle}>{err}</div>}
            {successMessage && <div style={successStyle}>{successMessage}</div>}

            <form onSubmit={handleUpload} style={formStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Video Title</label>
                <input
                  type="text"
                  placeholder="Video title (example: Lesson 1)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Video Files</label>
                <div style={nativeFileGroupStyle}>
                  <input
                    type="file"
                    accept=".mp4,video/mp4"
                    multiple
                    onClick={(e) => {
                      e.currentTarget.value = "";
                      setSuccessMessage("");
                      setErr("");
                    }}
                    onChange={(e) => {
                      void handleVideoSelection(Array.from(e.target.files || []));
                    }}
                    style={nativeInputStyle}
                  />
                  <div style={selectedFileTextStyle}>
                    {files.length
                      ? successMessage
                        ? `Uploaded ${files.length} video${files.length === 1 ? "" : "s"}`
                        : `Selected ${files.length} video${files.length === 1 ? "" : "s"}`
                      : "No videos selected yet"}
                  </div>
                  <div style={fileHintStyle}>
                    {loading
                      ? `Uploading ${activeFile?.name || "selected video"}...`
                      : successMessage
                      ? "Upload completed successfully."
                      : files.length
                      ? `Total size: ${formatFileSize(totalUploadSize)}`
                      : "MP4 only: H.264/AVC with Fast Start enabled"}
                  </div>
                  {files.length > 0 && (
                    <div style={fileQueueListStyle}>
                      {files.map((item, index) => (
                        <div
                          key={`${item.name}-${item.size}-${index}`}
                          style={{
                            ...fileQueueItemStyle,
                            borderColor:
                              currentUploadIndex === index
                                ? "rgba(125, 211, 252, 0.48)"
                                : fileQueueItemStyle.borderColor,
                          }}
                        >
                          <span style={fileQueueNameStyle}>{item.name}</span>
                          <span style={fileQueueMetaStyle}>{formatFileSize(item.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(loading || files.length > 0 || successMessage) && (
                    <div style={uploadStatusCardStyle}>
                      <div style={uploadStatusHeaderStyle}>
                        <div>
                          <div style={uploadStatusLabelStyle}>
                            {loading
                              ? `Uploading ${currentUploadIndex !== null ? currentUploadIndex + 1 : 1} Of ${files.length}`
                              : successMessage
                              ? "Upload Complete"
                              : "Ready To Upload"}
                          </div>
                          <div style={uploadStatusValueStyle}>
                            {loading || successMessage ? `${uploadProgress}%` : "0%"}
                          </div>
                        </div>
                        <div style={uploadStatusMetaStyle}>
                          {activeFile
                            ? `${formatFileSize(activeFile.size)} current`
                            : "Waiting for files"}
                        </div>
                      </div>

                      <div style={progressTrackStyle}>
                        <div
                          style={{
                            ...progressFillStyle,
                            width: `${loading || successMessage ? uploadProgress : 0}%`,
                          }}
                        />
                      </div>

                      <div style={uploadStatusHintStyle}>
                        {loading
                          ? uploadProgress < 100
                            ? "Please keep this page open while the video is uploading."
                            : "Browser upload is complete. The backend is now saving the video to Cloudflare R2."
                          : successMessage
                          ? "You can now upload more videos or open the course page."
                          : "Videos will upload one by one to avoid server timeout errors."}
                      </div>

                      {loading && uploadProgress >= 100 && (
                        <div style={cloudSyncNoticeStyle}>
                          <div style={cloudSyncTitleStyle}>Saving To Cloudflare</div>
                          <div style={cloudSyncTextStyle}>
                            Your file already reached the backend. The remaining wait is the
                            backend uploading it to Cloudflare R2, so an exact percentage is
                            not available on the website yet.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Teacher Photo</label>
                <div style={fileRowStyle}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onClick={(e) => {
                      e.currentTarget.value = "";
                      setErr("");
                    }}
                    onChange={async (e) => {
                      const selectedFile = e.target.files?.[0];
                      if (!selectedFile) return;

                      try {
                        const dataUrl = await readImageFileAsCompressedDataUrl(selectedFile);
                        const photoConfig = {
                          src: dataUrl,
                          positionX: 50,
                          positionY: 0,
                          bottomDarkness: 90,
                          scale: 1,
                        };
                        setTeacherPhotoUploadName(selectedFile.name);
                        setTeacherPhoto(Number(id), photoConfig);
                        setTeacherPhotoState(dataUrl);
                        setPhotoPositionX(photoConfig.positionX);
                        setPhotoPositionY(photoConfig.positionY);
                        setBottomDarkness(photoConfig.bottomDarkness);
                        setPhotoScale(photoConfig.scale);
                        await saveTeacherPhotoToCloudflare(
                          dataUrl,
                          selectedFile.name,
                          photoConfig
                        );
                      } catch (error: unknown) {
                        setErr(getErrorMessage(error, "Failed to load image"));
                      }
                    }}
                    style={nativeInputStyle}
                  />
                  <div style={fileNameBoxStyle}>
                    <span style={{ fontWeight: 700, color: "var(--app-heading)" }}>
                      {teacherPhoto ? "Teacher photo ready" : "No photo selected"}
                    </span>
                    <span style={fileHintStyle}>
                      JPG, PNG, or WebP; automatically compressed for fast loading
                    </span>
                  </div>
                </div>

                {teacherPhoto && (
                  <div style={photoActionRowStyle}>
                    <img
                      src={teacherPhoto}
                      alt="Teacher preview"
                      style={teacherPhotoAvatarStyle}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeTeacherPhoto(Number(id));
                        setTeacherPhotoState("");
                        setPhotoPositionX(50);
                        setPhotoPositionY(0);
                        setBottomDarkness(90);
                        setPhotoScale(1);
                        setPhotoAutoSaveMessage("Teacher photo removed.");
                      }}
                      style={secondaryLinkStyle}
                    >
                      Remove Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveTeacherPhotoToCloudflare()}
                      disabled={photoSaving || !teacherPhoto.startsWith("data:")}
                      style={{
                        ...secondaryLinkStyle,
                        opacity: teacherPhoto.startsWith("data:") ? 1 : 0.72,
                      }}
                    >
                      {photoSaving
                        ? "Saving..."
                        : teacherPhoto.startsWith("data:")
                          ? "Save Photo to Cloudflare"
                          : "Saved to Cloudflare"}
                    </button>
                  </div>
                )}
              </div>

              {teacherPhoto && (
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Photo Position</label>
                  <div style={autoSaveHintStyle}>
                    Adjust freely. Changes save automatically.
                    {photoAutoSaveMessage ? ` ${photoAutoSaveMessage}` : ""}
                  </div>
                  <div style={positionPanelStyle}>
                      <div style={positionPreviewFrameStyle}>
                        <img
                          src={teacherPhoto}
                          alt="Card preview"
                          style={{
                            ...positionPreviewImageStyle,
                            objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                            transform: `scale(${photoScale})`,
                          }}
                        />
                        <div
                          style={positionPreviewOverlayStyle(bottomDarkness)}
                        />
                      </div>

                    <div style={positionControlsStyle}>
                      <div style={sliderGroupStyle}>
                        <div style={sliderHeaderStyle}>
                          <span>Horizontal</span>
                          <span>{photoPositionX}%</span>
                        </div>
                        <input
                          className="photo-range"
                          type="range"
                          min={-20}
                          max={120}
                          step={0.5}
                          value={photoPositionX}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setPhotoPositionX(next);
                          }}
                          style={sliderStyle}
                        />
                      </div>

                      <div style={sliderGroupStyle}>
                        <div style={sliderHeaderStyle}>
                          <span>Vertical</span>
                          <span>{photoPositionY}%</span>
                        </div>
                        <input
                          className="photo-range"
                          type="range"
                          min={-20}
                          max={120}
                          step={0.5}
                          value={photoPositionY}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setPhotoPositionY(next);
                          }}
                          style={sliderStyle}
                        />
                      </div>

                      <div style={sliderGroupStyle}>
                        <div style={sliderHeaderStyle}>
                          <span>Bottom Darkness</span>
                          <span>{bottomDarkness}%</span>
                        </div>
                        <input
                          className="photo-range"
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={bottomDarkness}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setBottomDarkness(next);
                          }}
                          style={sliderStyle}
                        />
                      </div>

                      <div style={sliderGroupStyle}>
                        <div style={sliderHeaderStyle}>
                          <span>Zoom</span>
                          <span>{photoScale.toFixed(2)}x</span>
                        </div>
                        <input
                          className="photo-range"
                          type="range"
                          min={1}
                          max={2.2}
                          step={0.01}
                          value={photoScale}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setPhotoScale(next);
                          }}
                          style={sliderStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="submit" disabled={loading} style={primaryButtonStyle}>
                    {loading ? "Uploading..." : "Upload Video"}
                  </button>
                  <Link to="/courses" style={secondaryLinkStyle}>
                    Cancel
                  </Link>
                  {successMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessMessage("");
                        setErr("");
                        setFiles([]);
                        setTitle("");
                        setUploadProgress(0);
                        setCurrentUploadIndex(null);
                      }}
                      style={secondaryGhostButtonStyle}
                    >
                      Upload Another
                    </button>
                  )}
                  {successMessage && (
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/${id}`)}
                      style={secondaryGhostButtonStyle}
                    >
                      View Course
                    </button>
                  )}
                </div>

              {loading && (
                <div style={progressWrapStyle}>
                  <div style={progressHeaderStyle}>
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={progressTrackStyle}>
                    <div
                      style={{
                        ...progressFillStyle,
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                  <div style={progressHintStyle}>
                    {uploadProgress < 100
                      ? "Uploading video file, please wait..."
                      : "Finalizing upload..."}
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function uploadCourseVideo(
  courseId: string,
  formData: FormData,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/course-videos/${courseId}/upload`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.min(
        100,
        Math.max(0, Math.round((event.loaded / event.total) * 100))
      );
      onProgress(progress);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      try {
        const json = JSON.parse(xhr.responseText);
        reject(
          new Error(
            json?.message ||
              json?.error ||
              json?.status?.message ||
              xhr.responseText ||
              "Upload failed"
          )
        );
      } catch {
        reject(new Error(xhr.responseText || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

function getCourseTeacherPhotoConfig(course: CourseRecord): TeacherPhotoConfig {
  const localConfig = getTeacherPhotoConfig(course.id);
  const serverSrc = resolveCoursePhotoUrl(course);

  return {
    src: serverSrc || localConfig.src,
    positionX:
      typeof course.teacherPhotoPositionX === "number"
        ? course.teacherPhotoPositionX
        : localConfig.positionX,
    positionY:
      typeof course.teacherPhotoPositionY === "number"
        ? course.teacherPhotoPositionY
        : localConfig.positionY,
    bottomDarkness:
      typeof course.teacherPhotoBottomDarkness === "number"
        ? course.teacherPhotoBottomDarkness
        : localConfig.bottomDarkness,
    scale:
      typeof course.teacherPhotoScale === "number"
        ? course.teacherPhotoScale
        : localConfig.scale,
  };
}

function resolveCoursePhotoUrl(course: CourseRecord) {
  const rawUrl =
    course.teacherPhotoUrl ||
    (course.teacherPhotoFileName ? `/files/${course.teacherPhotoFileName}` : "");

  if (!rawUrl) return "";
  return rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;
}

async function uploadCourseTeacherPhoto(
  courseId: number,
  dataUrl: string,
  originalFileName: string,
  photoConfig: TeacherPhotoConfig
) {
  const form = new FormData();
  form.append("file", dataUrlToFile(dataUrl, originalFileName));
  form.append("positionX", String(photoConfig.positionX));
  form.append("positionY", String(photoConfig.positionY));
  form.append("bottomDarkness", String(photoConfig.bottomDarkness));
  form.append("scale", String(photoConfig.scale));

  return apiFetch<CourseRecord>(`/api/courses/${courseId}/teacher-photo`, {
    method: "POST",
    body: form,
  });
}

function updateCourseTeacherPhotoLayout(
  courseId: number,
  photoConfig: TeacherPhotoConfig
) {
  const params = new URLSearchParams({
    positionX: String(photoConfig.positionX),
    positionY: String(photoConfig.positionY),
    bottomDarkness: String(photoConfig.bottomDarkness),
    scale: String(photoConfig.scale),
  });

  return apiFetch<CourseRecord>(
    `/api/courses/${courseId}/teacher-photo?${params.toString()}`,
    {
      method: "PATCH",
    }
  );
}

function dataUrlToFile(dataUrl: string, originalFileName: string) {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = window.atob(content || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const safeName = originalFileName.replace(/\.[^.]+$/, "") || "teacher-photo";
  const extension = mime === "image/webp" ? "webp" : "jpg";
  return new File([bytes], `${safeName}.${extension}`, { type: mime });
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const MP4_SCAN_SIZE = 16 * 1024 * 1024;

async function validateFastStreamingMp4(file: File) {
  if (!file.name.toLowerCase().endsWith(".mp4")) {
    throw new Error(`${file.name}: choose an MP4 file.`);
  }

  const bytes = new Uint8Array(
    await file.slice(0, Math.min(file.size, MP4_SCAN_SIZE)).arrayBuffer()
  );
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  let foundMediaData = false;

  while (offset + 8 <= bytes.length) {
    let boxSize = view.getUint32(offset);
    const boxType = readAscii(bytes, offset + 4, 4);
    let headerSize = 8;

    if (boxSize === 1) {
      if (offset + 16 > bytes.length) break;
      boxSize = Number(view.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (boxSize === 0) {
      boxSize = file.size - offset;
    }

    if (!Number.isSafeInteger(boxSize) || boxSize < headerSize) break;

    if (boxType === "mdat") {
      foundMediaData = true;
    }

    if (boxType === "moov") {
      if (foundMediaData) {
        throw new Error(
          `${file.name}: Fast Start is not enabled. Export again with Network Optimization/Fast Start.`
        );
      }

      if (offset + boxSize > bytes.length) {
        throw new Error(
          `${file.name}: MP4 metadata is too large to verify. Export again with Fast Start.`
        );
      }

      const moov = bytes.subarray(offset, offset + boxSize);
      if (containsAscii(moov, "hev1") || containsAscii(moov, "hvc1")) {
        throw new Error(
          `${file.name}: H.265/HEVC is not supported. Export as H.264/AVC.`
        );
      }

      if (!containsAscii(moov, "avc1") && !containsAscii(moov, "avc3")) {
        throw new Error(
          `${file.name}: video must use the H.264/AVC codec.`
        );
      }

      return;
    }

    if (boxSize > bytes.length - offset) break;
    offset += boxSize;
  }

  throw new Error(
    `${file.name}: Fast Start metadata was not found. Export again with Network Optimization/Fast Start.`
  );
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index]);
  }
  return value;
}

function containsAscii(bytes: Uint8Array, value: string) {
  const pattern = Array.from(value, (character) => character.charCodeAt(0));

  search: for (let offset = 0; offset <= bytes.length - pattern.length; offset += 1) {
    for (let index = 0; index < pattern.length; index += 1) {
      if (bytes[offset + index] !== pattern[index]) continue search;
    }
    return true;
  }

  return false;
}

const eyebrowStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
  marginBottom: 8,
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 0.9fr) minmax(420px, 1.3fr)",
  gap: 22,
  alignItems: "start",
};

const courseMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  marginTop: 18,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
  marginTop: 22,
  maxWidth: 680,
};

const uploadOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.62)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 9999,
};

const uploadOverlayCardStyle: React.CSSProperties = {
  width: "min(100%, 460px)",
  borderRadius: 26,
  padding: "28px 26px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(24, 36, 66, 0.96))",
  border: "1px solid rgba(96, 165, 250, 0.24)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.36), 0 0 36px rgba(59, 130, 246, 0.18)",
  display: "grid",
  gap: 16,
};

const uploadOverlayEyebrowStyle: React.CSSProperties = {
  color: "rgba(191, 219, 254, 0.8)",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const uploadOverlayPercentStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 72,
  lineHeight: 1,
  fontWeight: 800,
};

const uploadOverlayTextStyle: React.CSSProperties = {
  color: "rgba(219, 234, 254, 0.84)",
  fontSize: 14,
  lineHeight: 1.6,
};

const fileRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 260px) 1fr",
  gap: 12,
  alignItems: "stretch",
};

const nativeInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "12px 14px",
  cursor: "pointer",
};

const secondaryGhostButtonStyle: React.CSSProperties = {
  minHeight: 50,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-card-solid-bg)",
  boxShadow: "var(--app-glow-soft)",
  color: "var(--app-heading)",
  fontWeight: 700,
  cursor: "pointer",
};

const fileNameBoxStyle: React.CSSProperties = {
  minHeight: 50,
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid var(--app-input-border)",
  background: "var(--app-card-solid-bg)",
  boxShadow: "var(--app-glow-soft)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
};

const fileHintStyle: React.CSSProperties = {
  color: "var(--app-muted)",
  fontSize: 13,
};

const successStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(74, 222, 128, 0.28)",
  background: "rgba(22, 101, 52, 0.12)",
  color: "#166534",
  fontWeight: 700,
  boxShadow: "var(--app-glow-soft)",
};

const nativeFileGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const selectedFileTextStyle: React.CSSProperties = {
  color: "var(--app-heading)",
  fontSize: 14,
  fontWeight: 700,
};

const fileQueueListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 4,
};

const fileQueueItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-solid-bg)",
};

const fileQueueNameStyle: React.CSSProperties = {
  minWidth: 0,
  color: "var(--app-heading)",
  fontSize: 13,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const fileQueueMetaStyle: React.CSSProperties = {
  flexShrink: 0,
  color: "var(--app-muted)",
  fontSize: 12,
  fontWeight: 700,
};

const uploadStatusCardStyle: React.CSSProperties = {
  marginTop: 4,
  padding: "18px 18px 16px",
  borderRadius: 18,
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(24, 36, 66, 0.92))",
  border: "1px solid rgba(96, 165, 250, 0.22)",
  boxShadow: "0 0 30px rgba(59, 130, 246, 0.18)",
  display: "grid",
  gap: 12,
};

const uploadStatusHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const uploadStatusLabelStyle: React.CSSProperties = {
  color: "rgba(191, 219, 254, 0.78)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const uploadStatusValueStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 40,
  lineHeight: 1,
  fontWeight: 800,
  marginTop: 6,
};

const uploadStatusMetaStyle: React.CSSProperties = {
  color: "rgba(191, 219, 254, 0.88)",
  fontSize: 14,
  fontWeight: 700,
  alignSelf: "center",
};

const uploadStatusHintStyle: React.CSSProperties = {
  color: "rgba(219, 234, 254, 0.78)",
  fontSize: 13,
  lineHeight: 1.5,
};

const cloudSyncNoticeStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(125, 211, 252, 0.24)",
  background: "rgba(14, 165, 233, 0.08)",
  display: "grid",
  gap: 4,
};

const cloudSyncTitleStyle: React.CSSProperties = {
  color: "#e0f2fe",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const cloudSyncTextStyle: React.CSSProperties = {
  color: "rgba(224, 242, 254, 0.82)",
  fontSize: 13,
  lineHeight: 1.5,
};

const photoActionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const photoPreviewStyle: React.CSSProperties = {
  width: 88,
  height: 88,
  objectFit: "cover",
  borderRadius: "50%",
  border: "1px solid rgba(191, 219, 254, 0.28)",
  boxShadow: "0 0 26px rgba(96, 165, 250, 0.2)",
  transformOrigin: "center center",
};

const teacherPhotoAvatarStyle: React.CSSProperties = {
  ...photoPreviewStyle,
  objectPosition: "center top",
  transform: "none",
};

const photoEmptyStyle: React.CSSProperties = {
  minHeight: 88,
  borderRadius: 18,
  border: "1px dashed var(--app-border-soft)",
  background: "var(--app-card-solid-bg)",
  color: "var(--app-muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 14px",
};

const positionPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 220px) minmax(0, 1fr)",
  gap: 16,
  alignItems: "start",
  padding: "14px",
  borderRadius: 18,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const positionPreviewFrameStyle: React.CSSProperties = {
  position: "relative",
  minHeight: 230,
  borderRadius: 20,
  overflow: "hidden",
  border: "1px solid var(--app-border-soft)",
  background: "var(--app-card-elevated-bg)",
};

const positionPreviewImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  opacity: 0.96,
  transition: "object-position 180ms ease, transform 180ms ease",
  transformOrigin: "center center",
};

const positionPreviewOverlayStyle = (
  bottomDarkness: number
): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
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
  transition: "background 180ms ease",
  pointerEvents: "none",
});

const positionControlsStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const sliderGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const sliderHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "var(--app-heading)",
  fontWeight: 700,
  fontSize: 13,
};

const sliderStyle: React.CSSProperties = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
};

const autoSaveHintStyle: React.CSSProperties = {
  marginTop: 4,
  color: "var(--app-muted)",
  fontSize: 13,
  lineHeight: 1.6,
};

const progressWrapStyle: React.CSSProperties = {
  marginTop: 4,
  padding: "16px 18px",
  borderRadius: 18,
  background: "var(--app-card-solid-bg)",
  border: "1px solid var(--app-border-soft)",
  boxShadow: "var(--app-glow-soft)",
};

const progressHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "var(--app-heading)",
  fontWeight: 700,
  marginBottom: 10,
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 12,
  borderRadius: 999,
  overflow: "hidden",
  background: "var(--app-input-readonly-bg)",
  border: "1px solid var(--app-border-soft)",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(61, 118, 255, 1), rgba(33, 211, 255, 0.92))",
  boxShadow: "0 0 18px rgba(96, 165, 250, 0.3)",
  transition: "width 180ms ease",
};

const progressHintStyle: React.CSSProperties = {
  marginTop: 10,
  color: "var(--app-muted)",
  fontSize: 13,
};
