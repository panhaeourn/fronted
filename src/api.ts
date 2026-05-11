export const API_BASE = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

type ApiErrorBody = {
  message?: string;
  error?: string;
  status?: {
    message?: string;
    code?: string | number;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readApiErrorBody(value: unknown): ApiErrorBody | null {
  const body = asRecord(value);
  if (!body) return null;

  const status = asRecord(body.status);

  return {
    message: typeof body.message === "string" ? body.message : undefined,
    error: typeof body.error === "string" ? body.error : undefined,
    status: status
      ? {
          message:
            typeof status.message === "string" ? status.message : undefined,
          code:
            typeof status.code === "string" || typeof status.code === "number"
              ? status.code
              : undefined,
        }
      : undefined,
  };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === "content-type"
    );

    if (!hasContentType) {
      headers["Content-Type"] = "application/json";
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    const errorBody = readApiErrorBody(json);

    if (errorBody) {
      msg =
        errorBody.message ||
        errorBody.error ||
        errorBody.status?.message ||
        JSON.stringify(json);

      const code = errorBody.status?.code;
      if (code && msg && !String(msg).includes(String(code))) {
        msg = `${code}: ${msg}`;
      }
    } else if (text) {
      msg = text;
    }

    throw new Error(msg);
  }

  return json as T;
}
