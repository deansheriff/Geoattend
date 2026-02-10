import { apiFetch } from "./client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  timezone: string;
};

export async function login(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }) as Promise<User>;
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function me() {
  return apiFetch("/me");
}

export async function forgotPassword(email: string) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
}