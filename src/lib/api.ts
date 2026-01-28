export const API_BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type ApiError = { message?: string; error?: string };

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = (await res.json()) as ApiError;
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
