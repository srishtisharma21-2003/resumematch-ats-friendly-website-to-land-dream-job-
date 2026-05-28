type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  retryOnRateLimit?: boolean; // new flag, defaults to true
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Parse Groq's rate limit error message to extract wait time in milliseconds.
 * Example message: "Please try again in 16m44.832s"
 * Returns null if not found.
 */
function extractWaitTimeFromError(errorMessage: string): number | null {
  const match = errorMessage.match(/try again in (\d+)m([\d.]+)s/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseFloat(match[2]);
    return (minutes * 60 + seconds) * 1000;
  }
  return null;
}

export async function apiClient<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
  const { body, headers, timeoutMs = 30000, retryOnRateLimit = true, ...init } = options;
  
  const makeRequest = async (): Promise<T> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    try {
      const response = await fetch(url, {
        ...init,
        headers: isFormData
          ? headers
          : {
              "Content-Type": "application/json",
              ...headers,
            },
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        let message =
          typeof data === "object" && data && "error" in data
            ? String((data as { error?: unknown }).error)
            : `Request failed with status ${response.status}`;
        
        const error = new ApiError(message, response.status, data);
        // Attach the raw message for parsing
        (error as any).rawMessage = message;
        throw error;
      }

      return data as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("Network timeout. Please try again.", 408);
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  // Retry logic for rate limiting (429)
  try {
    return await makeRequest();
  } catch (error) {
    if (error instanceof ApiError && error.status === 429 && retryOnRateLimit) {
      const waitMs = extractWaitTimeFromError(error.message);
      if (waitMs && waitMs < 60000) { // Only auto-retry if wait time <= 1 minute (adjust as needed)
        console.warn(`Rate limited. Waiting ${waitMs / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitMs + 1000)); // wait + 1s extra
        // Retry exactly once
        return await makeRequest();
      } else if (waitMs && waitMs >= 60000) {
        // If wait time is too long, throw a user-friendly message
        throw new ApiError(
          `AI service is busy. Please try again in ${Math.ceil(waitMs / 60000)} minutes.`,
          429,
          error.data
        );
      }
    }
    throw error;
  }
}

// The rest remains unchanged, but we add optional retry flag to specific calls
export type AnalyzeResumeParams = {
  resumeText: string;
  jobDescription: string;
  userId?: string;
  fileName?: string;
};

export type AnalyzeResumeResponse = {
  analysisId: string;
  score: number;
  matchScore: number;
  missingKeywords: Array<string | { keyword: string; priority?: string }>;
  improvements: string[];
  summary?: string;
};

export async function analyzeResume(params: AnalyzeResumeParams) {
  return apiClient<AnalyzeResumeResponse>("/api/match/analyze", {
    method: "POST",
    body: params,
    timeoutMs: 45000,
    retryOnRateLimit: true, // explicitly enabled
  });
}

export type RewriteBulletResponse = {
  improved: string;
  explanation: string;
};

export async function rewriteBullet(bullet: string, jobDescription: string) {
  return apiClient<RewriteBulletResponse>("/api/rewrite", {
    method: "POST",
    body: { bullet, jobDescription },
    timeoutMs: 45000,
    retryOnRateLimit: true,
  });
}

export async function extractTextFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiClient<{ text: string }>("/api/parse-file", {
    method: "POST",
    body: formData,
    timeoutMs: 30000,
    retryOnRateLimit: false, // parsing files doesn't hit AI rate limits
  });
  return data.text;
}