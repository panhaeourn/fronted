const STORAGE_KEY = "course_teacher_photos";

export type TeacherPhotoConfig = {
  src: string;
  positionX: number;
  positionY: number;
  bottomDarkness: number;
  scale: number;
};

type TeacherPhotoMap = Record<string, string | Partial<TeacherPhotoConfig>>;

const DEFAULT_CONFIG: TeacherPhotoConfig = {
  src: "",
  positionX: 50,
  positionY: 0,
  bottomDarkness: 90,
  scale: 1,
};

function readMap(): TeacherPhotoMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(value: TeacherPhotoMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function normalizeEntry(value?: string | Partial<TeacherPhotoConfig>): TeacherPhotoConfig {
  if (!value) return { ...DEFAULT_CONFIG };
  if (typeof value === "string") {
    return {
      ...DEFAULT_CONFIG,
      src: value,
    };
  }
  return {
    src: value.src || "",
    positionX:
      typeof value.positionX === "number" ? value.positionX : DEFAULT_CONFIG.positionX,
    positionY:
      typeof value.positionY === "number" ? value.positionY : DEFAULT_CONFIG.positionY,
    bottomDarkness:
      typeof value.bottomDarkness === "number"
        ? value.bottomDarkness
        : DEFAULT_CONFIG.bottomDarkness,
    scale: typeof value.scale === "number" ? value.scale : DEFAULT_CONFIG.scale,
  };
}

export function getTeacherPhoto(courseId: number) {
  return normalizeEntry(readMap()[String(courseId)]).src;
}

export function getTeacherPhotoConfig(courseId: number) {
  return normalizeEntry(readMap()[String(courseId)]);
}

export function setTeacherPhoto(
  courseId: number,
  photo: string | Partial<TeacherPhotoConfig>
) {
  const current = readMap();
  const normalized =
    typeof photo === "string" ? normalizeEntry(photo) : normalizeEntry(photo);

  if (normalized.src) {
    current[String(courseId)] = normalized;
  } else {
    delete current[String(courseId)];
  }
  writeMap(current);
}

export function removeTeacherPhoto(courseId: number) {
  const current = readMap();
  delete current[String(courseId)];
  writeMap(current);
}

export function getTeacherPhotoMap(courseIds: number[]) {
  const current = readMap();
  return courseIds.reduce<Record<number, TeacherPhotoConfig>>((acc, id) => {
    acc[id] = normalizeEntry(current[String(id)]);
    return acc;
  }, {});
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}
