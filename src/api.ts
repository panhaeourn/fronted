export const API_BASE = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

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
  let json: any = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;

    if (json) {
      msg =
        json.message ||
        json.error ||
        json?.status?.message ||
        JSON.stringify(json);

      const code = json?.status?.code;
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