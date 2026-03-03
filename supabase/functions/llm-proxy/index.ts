/**
 * Supabase Edge Function: llm-proxy
 *
 * Secure proxy for LLM API calls. Handles:
 * - JWT authentication via Supabase Auth
 * - Streaming (SSE passthrough) and non-streaming forwarding
 * - Server-side API key management (never exposed to client)
 *
 * Environment variables (set via `supabase secrets set`):
 * - LLM_API_KEY: API key for the LLM provider (e.g. OpenRouter)
 * - LLM_API_ENDPOINT: LLM API endpoint URL
 * - LLM_MODEL: Default model to use
 * - SMART_ASSIST_MODEL: Optional model override for grammar/assist calls
 *
 * Deno runtime — uses standard Web APIs (fetch, ReadableStream).
 */

// @ts-ignore: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore: Deno environment
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ---- 1. Authentication ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT with Supabase Auth
    // @ts-ignore: Deno environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore: Deno environment
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- 2. Parse Request ----
    const body = await req.json();
    const {
      messages,
      stream = false,
      temperature,
      max_tokens,
      response_format,
      model_hint,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "messages" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- 3. Server-side LLM configuration ----
    // @ts-ignore: Deno environment
    const apiKey = Deno.env.get('LLM_API_KEY');
    // @ts-ignore: Deno environment
    const apiEndpoint = Deno.env.get('LLM_API_ENDPOINT') ?? 'https://openrouter.ai/api/v1/chat/completions';
    // @ts-ignore: Deno environment
    const defaultModel = Deno.env.get('LLM_MODEL') ?? 'openai/gpt-4o-mini';
    // @ts-ignore: Deno environment
    const smartAssistModel = Deno.env.get('SMART_ASSIST_MODEL');

    if (!apiKey) {
      console.error('[llm-proxy] LLM_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LLM service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which model to use
    // model_hint allows the client to request a specific purpose (e.g. "smart_assist")
    // without revealing actual model names
    let model = defaultModel;
    if (model_hint === 'smart_assist' && smartAssistModel) {
      model = smartAssistModel;
    }

    // ---- 4. Build upstream request ----
    const upstreamBody: Record<string, unknown> = {
      model,
      messages,
      stream,
    };

    if (temperature !== undefined) upstreamBody.temperature = temperature;
    if (max_tokens !== undefined) upstreamBody.max_tokens = max_tokens;
    if (response_format !== undefined) upstreamBody.response_format = response_format;

    const upstreamResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://speakland.app',
        'X-Title': 'Speakland',
      },
      body: JSON.stringify(upstreamBody),
    });

    // ---- 5. Handle upstream errors ----
    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error(`[llm-proxy] Upstream error ${upstreamResponse.status}: ${errorText}`);
      return new Response(
        JSON.stringify({
          error: 'LLM upstream error',
          status: upstreamResponse.status,
          details: errorText,
        }),
        {
          status: upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ---- 6. Streaming response ----
    if (stream) {
      if (!upstreamResponse.body) {
        return new Response(
          JSON.stringify({ error: 'No streaming body from upstream' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Pipe the upstream SSE stream directly to the client
      return new Response(upstreamResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ---- 7. Non-streaming response ----
    const data = await upstreamResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[llm-proxy] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
