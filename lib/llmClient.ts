/**
 * LLM Client - Public call layer for Supabase Edge Function proxy
 *
 * Provides:
 * - callLlmProxy() — non-streaming, returns full JSON response
 * - streamLlmProxy() — streaming SSE, invokes callbacks per token
 *
 * Reads JWT from supabase session. Falls back to mock when unauthenticated.
 */

import { supabase } from './supabase';
import type { LlmProxyRequest, LlmProxyResponse, StreamCallbacks } from '../types/llm';

const MOCK_RESPONSE: LlmProxyResponse = {
  id: 'mock-response',
  choices: [
    {
      message: {
        role: 'assistant',
        content:
          'I am a mock response. Please sign in to use the AI features.',
      },
      finish_reason: 'stop',
    },
  ],
};

/**
 * Get the current JWT token from Supabase session.
 * Returns null if the user is not authenticated.
 */
async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Build the Edge Function URL for llm-proxy.
 */
function getLlmProxyUrl(): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/functions/v1/llm-proxy`;
}

/**
 * Non-streaming LLM call via Supabase Edge Function.
 *
 * Sends the request with `stream: false` and returns the full JSON response.
 * Falls back to mock response when the user is not authenticated.
 */
export async function callLlmProxy(
  body: LlmProxyRequest
): Promise<LlmProxyResponse> {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[llmClient] No auth token — returning mock response');
    return MOCK_RESPONSE;
  }

  const url = getLlmProxyUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...body, stream: false }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM proxy error (${response.status}): ${errorText}`
    );
  }

  return response.json() as Promise<LlmProxyResponse>;
}

/**
 * Streaming LLM call via Supabase Edge Function (SSE).
 *
 * Sends the request with `stream: true` and invokes callbacks as tokens arrive.
 * Falls back to mock when the user is not authenticated.
 *
 * @param body - The LLM request body
 * @param callbacks - Token/complete/error callbacks
 * @param signal - Optional AbortSignal for cancellation
 */
export async function streamLlmProxy(
  body: LlmProxyRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[llmClient] No auth token — streaming mock response');
    const mockText = MOCK_RESPONSE.choices[0].message.content;
    // Simulate streaming by emitting each word
    const words = mockText.split(' ');
    for (const word of words) {
      callbacks.onToken(word + ' ');
    }
    callbacks.onComplete?.(mockText);
    return;
  }

  const url = getLlmProxyUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(
      `LLM proxy stream error (${response.status}): ${errorText}`
    );
    callbacks.onError?.(error);
    throw error;
  }

  if (!response.body) {
    const error = new Error('No response body for streaming');
    callbacks.onError?.(error);
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();

        if (data === '[DONE]') {
          callbacks.onComplete?.(fullText);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onToken(delta);
          }
        } catch {
          // Skip non-JSON lines
        }
      }
    }

    callbacks.onComplete?.(fullText);
  } catch (err) {
    if (signal?.aborted) return;
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks.onError?.(error);
    throw error;
  }
}
