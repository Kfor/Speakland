/**
 * LLM Client tests
 *
 * Tests the mock fallback behavior when no auth session is available.
 */

// Mock supabase before importing llmClient
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}));

import { callLlmProxy, streamLlmProxy } from '../lib/llmClient';
import type { LlmProxyRequest, StreamCallbacks } from '../types/llm';

describe('llmClient', () => {
  describe('callLlmProxy', () => {
    test('returns mock response when not authenticated', async () => {
      const request: LlmProxyRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await callLlmProxy(request);
      expect(response.id).toBe('mock-response');
      expect(response.choices).toHaveLength(1);
      expect(response.choices[0].message.role).toBe('assistant');
      expect(response.choices[0].message.content).toContain('mock');
    });
  });

  describe('streamLlmProxy', () => {
    test('streams mock response when not authenticated', async () => {
      const request: LlmProxyRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      };

      const tokens: string[] = [];
      let completed = false;

      const callbacks: StreamCallbacks = {
        onToken: (token) => tokens.push(token),
        onComplete: () => {
          completed = true;
        },
      };

      await streamLlmProxy(request, callbacks);

      expect(tokens.length).toBeGreaterThan(0);
      expect(completed).toBe(true);
    });
  });
});
