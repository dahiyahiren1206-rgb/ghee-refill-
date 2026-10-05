// Typed fetch layer over the FastAPI backend. Base is the relative "/api" prefix so the
// same code works in dev (Vite proxies /api → :8001) and behind a single origin in prod.
const BASE = "/api";

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  // Auth rides the httpOnly session cookie automatically — never add auth headers here.
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // FastAPI reports request-validation failures as 422 with a {detail: [...]} body.
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);

// Multipart upload (PDFs) — browser sets the multipart boundary itself.
export async function apiFormPost<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: form });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  return (await res.json()) as T;
}

// SSE reader for the Ghee Guru chat stream: calls onDelta per token chunk, resolves with the full reply.
export async function apiStreamPost(
  path: string,
  body: JsonBody,
  onDelta: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = JSON.parse(line.slice(6)) as { delta?: string };
      if (payload.delta) {
        full += payload.delta;
        onDelta(payload.delta);
      }
    }
  }
  return full;
}

// Human-readable text from an ApiError (FastAPI 422 bodies nest detail as string or object).
export function apiErrorText(err: unknown, fallback = "Kuch gadbad ho gayi — phir try karo"): string {
  if (err instanceof ApiError) {
    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const d = detail as { message?: string; reason?: string };
      if (d.message && d.reason) return `${d.message}: ${d.reason}`;
      return d.message ?? d.reason ?? fallback;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

// ---- Interfaces mirroring backend Pydantic models — keep in sync in the same edit ----

// models/videos.py :: Video
export interface Video {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  youtube_id: string;
  channel: string;
  duration_label: string;
  tags: string[];
  source: string;
  status: string;
  ai_generated: boolean;
  notes_md: string;
  summary: string[];
  created_at: string;
}

// models/videos.py :: QuestionOut
export interface QuestionOut {
  id: string;
  question: string;
  options: string[];
}

// models/videos.py :: AttemptResult
export interface AttemptResult {
  correct: boolean;
  correct_index: number;
  explanation: string;
}

// models/videos.py :: Comment
export interface Comment {
  id: string;
  video_id: string;
  author: string;
  text: string;
  created_at: string;
}

// models/videos.py :: SearchResponse
export interface SearchResponse {
  query: string;
  best: Video | null;
  alternatives: Video[];
}

// models/videos.py :: Stats
export interface Stats {
  videos: number;
  questions: number;
  papers: number;
  notes: number;
  comments: number;
}

// models/community.py :: Paper
export interface Paper {
  id: string;
  title: string;
  subject: string;
  exam: string;
  year: string;
  uploader: string;
  file_name: string;
  size: number;
  status: string;
  reason: string;
  relevance: number;
  created_at: string;
}

// models/community.py :: CommunityNote
export interface CommunityNote {
  id: string;
  title: string;
  topic: string;
  uploader: string;
  file_name: string;
  size: number;
  status: string;
  reason: string;
  relevance: number;
  created_at: string;
}

// models/community.py :: Suggestion
export interface Suggestion {
  id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  topic: string;
  why: string;
  suggested_by: string;
  status: string;
  reason: string;
  relevance: number;
  created_at: string;
}

// routers/chat.py :: history item
export interface ChatHistoryItem {
  id: string;
  role: string;
  content: string;
}
