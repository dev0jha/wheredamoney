import type { ApiErrorPayload } from "@/lib/types";

export class ClientApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers,
    credentials: "include",
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
    throw new ClientApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
