/**
 * n8nService.ts — Crescent Black n8n Webhook Client
 *
 * Wraps all outbound calls to the n8n automation webhook.
 * Falls back to a structured mock response when N8N_WEBHOOK_URL is not set.
 *
 * Usage (server-side, inside server.ts route handlers):
 *   import { callN8nWebhook } from "./src/services/n8nService.js";
 *   const result = await callN8nWebhook({ message, sessionId, userId, userRole });
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface N8nPayload {
  message:       string;
  sessionId:     string;
  userId:        string;
  userRole:      "client" | "freelancer";
  /** Recent history to give n8n conversational context */
  history?:      { role: "user" | "assistant"; content: string }[];
  /** Arbitrary context (last matches, project info, etc.) */
  projectContext?: Record<string, unknown>;
}

export interface N8nResponse {
  aiResponse:        string;
  intent?:           string;
  matches?:          unknown[];
  suggestedActions?: string[];
  meetingLink?:      string;
  projectInfo?:      Record<string, unknown>;
  status?:           string;
}

// ─── Per-user rate limiting (max 10 calls / second) ──────────────────────────

const userCallTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now    = Date.now();
  const window = 1_000; // 1 second rolling window
  const limit  = 10;

  const timestamps = (userCallTimestamps.get(userId) ?? []).filter(
    (t) => now - t < window
  );

  if (timestamps.length >= limit) return false; // rate limited

  timestamps.push(now);
  userCallTimestamps.set(userId, timestamps);
  return true;
}

// ─── Retry logic ──────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  body: string,
  maxAttempts = 2,
  timeoutMs   = 10_000
): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const id         = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.N8N_API_KEY
            ? { "X-API-Key": process.env.N8N_API_KEY }
            : {}),
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(id);
      return response;
    } catch (err) {
      lastErr = err;
      console.warn(`[n8n] attempt ${attempt}/${maxAttempts} failed:`, err);
      if (attempt < maxAttempts) {
        // Exponential back-off: 500 ms, 1 s, …
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw lastErr;
}

// ─── Fallback response (when n8n is unavailable) ─────────────────────────────

function fallbackResponse(payload: N8nPayload): N8nResponse {
  const lower = payload.message.toLowerCase();

  const intentFind     = /find|hire|looking|need|developer|designer/i.test(lower);
  const intentSchedule = /schedule|meeting|call|book/i.test(lower);
  const intentProposal = /proposal|bid|send|offer/i.test(lower);

  if (intentFind) {
    return {
      aiResponse:        "I found some great freelancer matches for your project. Let me show you the top candidates.",
      intent:            "find_freelancer",
      suggestedActions:  ["Send proposal to top match", "Schedule meeting", "Refine search"],
      status:            "fallback",
    };
  }
  if (intentSchedule) {
    return {
      aiResponse:        "I can schedule a meeting for you. Please confirm the time and I'll send the calendar invite.",
      intent:            "schedule_meeting",
      suggestedActions:  ["Confirm 10am tomorrow", "Choose another time"],
      status:            "fallback",
    };
  }
  if (intentProposal) {
    return {
      aiResponse:        "Your proposal is being prepared. I'll send it via the n8n automation workflow once you confirm.",
      intent:            "send_proposal",
      suggestedActions:  ["Confirm & send", "Edit proposal"],
      status:            "fallback",
    };
  }

  return {
    aiResponse:       "I'm here to help! You can ask me to find freelancers, send proposals, or schedule meetings.",
    intent:           "general",
    suggestedActions: ["Find freelancer", "Schedule meeting", "Send proposal"],
    status:           "fallback",
  };
}

// ─── callN8nWebhook ──────────────────────────────────────────────────────────

/**
 * Make a POST request to the configured n8n webhook.
 *
 * @returns Structured AI response. Always resolves — never throws.
 *          If n8n is unreachable, returns a graceful fallback.
 */
export async function callN8nWebhook(payload: N8nPayload): Promise<N8nResponse> {
  // 1. Rate limit check
  if (!checkRateLimit(payload.userId)) {
    console.warn(`[n8n] rate limit hit for user ${payload.userId}`);
    return {
      aiResponse:  "You're sending messages too fast. Please wait a moment and try again.",
      intent:      "rate_limited",
      status:      "rate_limited",
    };
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  // 2. No webhook configured → immediate fallback
  if (!webhookUrl) {
    console.info("[n8n] N8N_WEBHOOK_URL not set — using fallback response");
    return fallbackResponse(payload);
  }

  // 3. Forward to n8n
  const body = JSON.stringify({
    message:        payload.message,
    sessionId:      payload.sessionId,
    userId:         payload.userId,
    userRole:       payload.userRole,
    history:        payload.history ?? [],
    projectContext: payload.projectContext ?? {},
  });

  try {
    console.log(`[n8n] → webhook call | user=${payload.userId} session=${payload.sessionId}`);

    const response = await fetchWithRetry(webhookUrl, body);

    if (!response.ok) {
      console.error(`[n8n] webhook returned HTTP ${response.status}`);
      return fallbackResponse(payload);
    }

    const raw = (await response.json()) as Partial<N8nResponse>;

    // 4. Validate required fields
    if (typeof raw.aiResponse !== "string" || !raw.aiResponse.trim()) {
      console.warn("[n8n] response missing aiResponse field — applying fallback");
      return fallbackResponse(payload);
    }

    console.log(`[n8n] ← response | intent=${raw.intent ?? "unknown"} status=${raw.status ?? "ok"}`);

    return {
      aiResponse:       raw.aiResponse,
      intent:           raw.intent,
      matches:          Array.isArray(raw.matches) ? raw.matches : [],
      suggestedActions: Array.isArray(raw.suggestedActions) ? raw.suggestedActions : [],
      meetingLink:      raw.meetingLink,
      projectInfo:      raw.projectInfo,
      status:           raw.status ?? "ok",
    };
  } catch (err: any) {
    console.error("[n8n] webhook call failed:", err.message ?? err);
    return fallbackResponse(payload);
  }
}
