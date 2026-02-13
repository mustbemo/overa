import { DEFAULT_HEADERS } from "./constants";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchText(url: string, acceptHeader: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          ...DEFAULT_HEADERS,
          Accept: acceptHeader,
        },
        signal: controller.signal,
      });

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
      lastError = typedError;

      if (attempt === MAX_ATTEMPTS) {
        throw typedError;
      }
    } finally {
      clearTimeout(timeoutId);
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
