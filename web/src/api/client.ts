const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return res.json();
}

export async function apiFetchForm(path: string, body: FormData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return res.json();
}

export { BASE_URL, API_BASE };
