/**
 * LLM proxy request/response type definitions
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmProxyRequest {
  messages: LlmMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object' | 'text';
  };
}

export interface LlmProxyResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}
