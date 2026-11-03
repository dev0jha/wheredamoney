import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { ApiErrorPayload, User } from "@/lib/types";

const API_URL = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const headers = new Headers(init?.headers);
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let code = "request_failed";
    let message = "Something went wrong. Please try again.";
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // keep the fallback message
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await apiFetch<{ user: User }>("/auth/me");
    return payload.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
