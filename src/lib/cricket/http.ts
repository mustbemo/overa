import { DEFAULT_HEADERS } from "./constants";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;
type RequestFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

let cachedTauriFetch: Promise<RequestFetch | null> | null = null;

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "__TAURI_INTERNALS__" in window ||
    "__TAURI__" in window ||
    navigator.userAgent.toLowerCase().includes("tauri")
  );
}

async function resolveFetch(): Promise<RequestFetch> {
  if (!isTauriRuntime()) {
    return fetch;
  }

  if (!cachedTauriFetch) {
    cachedTauriFetch = import("@tauri-apps/plugin-http")
      .then((module) => module.fetch as RequestFetch)
      .catch(() => null);
  }

  return (await cachedTauriFetch) ?? fetch;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function normalizeFetchError(error: Error): Error {
  const message = error.message.toLowerCase();

  if (
    message.includes("scope") ||
    message.includes("denied") ||
    message.includes("not allowed")
  ) {
    return new Error(
      "Tauri HTTP permission denied for Cricbuzz URL. Add Cricbuzz URL patterns in src-tauri/capabilities/default.json.",
    );
  }

  return error;
}

async function fetchText(url: string, acceptHeader: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const requestFetch = await resolveFetch();
      const response = await withTimeout(
        requestFetch(url, {
          method: "GET",
          headers: {
            ...DEFAULT_HEADERS,
            Accept: acceptHeader,
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (!response.ok) {
        const error = new Error(`Failed to fetch ${url} (${response.status})`);

        if (!shouldRetry(response.status) || attempt === MAX_ATTEMPTS) {
          throw error;
        }

        lastError = error;
        continue;
      }

      return await response.text();
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error("Unknown fetch failure");
      lastError = normalizeFetchError(typedError);

      if (attempt === MAX_ATTEMPTS) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Unknown fetch failure");
}

export function fetchHtml(url: string): Promise<string> {
  return fetchText(
    url,
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  );
}

export async function fetchJson<T>(url: string): Promise<T> {
  const text = await fetchText(url, "application/json,text/plain,*/*");

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response from ${url}: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`,
    );
  }
}
