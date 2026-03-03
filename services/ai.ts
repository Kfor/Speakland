// ============================================================
// AI Conversation Service Layer
// OpenAI-compatible API wrapper for roleplay + story context
// ============================================================

import type {
  ChatMessage,
  ConversationContext,
  Character,
  MessageFeedback,
} from '@/types';

// ---- Configuration ----

const API_BASE_URL = process.env.EXPO_PUBLIC_AI_API_BASE_URL ?? 'https://api.openai.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY ?? '';
const MODEL = process.env.EXPO_PUBLIC_AI_MODEL ?? 'gpt-4o-mini';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  id: string;
  choices: Array<{
    index: number;
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

// ---- System Prompt Builder ----

function buildSystemPrompt(
  character: Character,
  context: ConversationContext,
  userLanguage: string,
  targetLanguage: string
): string {
  return `You are "${character.name}", a character in an interactive language learning story.

## Your Character
- Name: ${character.name}
- Personality: ${character.personality_traits.join(', ')}
- Speaking style: ${character.speaking_style}
${character.system_prompt ? `- Additional instructions: ${character.system_prompt}` : ''}

## Scene Context
- Scene: ${context.scene_description}
- Story so far: ${context.plot_summary}

## Language Learning Rules
- The learner's native language is ${userLanguage}
- The target language they are learning is ${targetLanguage}
- Speak primarily in ${targetLanguage} (the target language)
- Adjust complexity to match the learner's level
- When the learner makes a language mistake, gently correct it in-character
- Naturally introduce vocabulary from the focus list when contextually appropriate
- Keep responses conversational and natural (2-4 sentences typically)
- Stay in character at all times - never break the fourth wall
- Drive the story forward with each response

${context.vocabulary_focus.length > 0 ? `## Vocabulary Focus\nTry to naturally use these words/phrases when appropriate:\n${context.vocabulary_focus.map((v) => `- ${v}`).join('\n')}` : ''}

## Response Format
Respond ONLY as your character in the target language. Do not include translations, explanations, or meta-commentary in your main response.`;
}

// ---- Feedback Prompt Builder ----

function buildFeedbackPrompt(
  userMessage: string,
  targetLanguage: string,
  userLanguage: string
): string {
  return `Analyze the following learner message for language learning feedback. The learner is learning ${targetLanguage} and their native language is ${userLanguage}.

Learner message: "${userMessage}"

Respond in JSON format with the following structure:
{
  "feedback": null | {
    "type": "encouragement" | "word_correction" | "grammar_correction",
    "original": "the problematic part (empty string for encouragement)",
    "suggestion": "the correct form or encouraging message",
    "explanation": "brief explanation in ${userLanguage}"
  }
}

Rules:
- Return null feedback if the message is fine and doesn't need correction
- Only provide ONE piece of feedback (the most important one)
- For encouragement, use it when the learner uses a complex or idiomatic expression correctly
- Keep explanations short (one sentence)
- Return valid JSON only, no markdown`;
}

// ---- API Client ----

async function callChatAPI(
  messages: OpenAIMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  if (!API_KEY) {
    console.warn('[AI] No API key configured. Set EXPO_PUBLIC_AI_API_KEY.');
    return '[AI service not configured]';
  }

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }

  const data: OpenAIChatResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

// ---- Conversation Manager ----

export class ConversationManager {
  private messages: ChatMessage[] = [];
  private openaiMessages: OpenAIMessage[] = [];
  private character: Character;
  private context: ConversationContext;
  private userLanguage: string;
  private targetLanguage: string;

  constructor(params: {
    character: Character;
    context: ConversationContext;
    userLanguage: string;
    targetLanguage: string;
    previousMessages?: ChatMessage[];
  }) {
    this.character = params.character;
    this.context = params.context;
    this.userLanguage = params.userLanguage;
    this.targetLanguage = params.targetLanguage;

    // Build system message
    const systemPrompt = buildSystemPrompt(
      params.character,
      params.context,
      params.userLanguage,
      params.targetLanguage
    );

    this.openaiMessages = [{ role: 'system', content: systemPrompt }];

    // Restore previous messages if any
    if (params.previousMessages) {
      this.messages = [...params.previousMessages];
      for (const msg of params.previousMessages) {
        if (msg.role !== 'system') {
          this.openaiMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }
      }
    }
  }

  /**
   * Send a user message and get a character response.
   */
  async sendMessage(userText: string): Promise<{
    response: ChatMessage;
    feedback: MessageFeedback | null;
  }> {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(userMessage);
    this.openaiMessages.push({ role: 'user', content: userText });

    // Get character response and feedback in parallel
    const [responseText, feedback] = await Promise.all([
      callChatAPI(this.openaiMessages),
      this.analyzeFeedback(userText),
    ]);

    // Add assistant message
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: responseText,
      character_id: this.character.id,
      timestamp: new Date().toISOString(),
      feedback: feedback ?? undefined,
    };
    this.messages.push(assistantMessage);
    this.openaiMessages.push({ role: 'assistant', content: responseText });

    // Trim history if it's getting too long (keep system + last 40 messages)
    if (this.openaiMessages.length > 42) {
      this.openaiMessages = [
        this.openaiMessages[0], // system
        ...this.openaiMessages.slice(-40),
      ];
    }

    return { response: assistantMessage, feedback };
  }

  /**
   * Get the initial greeting from the character.
   */
  async getGreeting(): Promise<ChatMessage> {
    const greetingPrompt: OpenAIMessage = {
      role: 'user',
      content:
        '[SYSTEM: The learner has just entered the scene. Greet them in character and set the stage. Keep it brief and engaging.]',
    };

    const responseText = await callChatAPI([
      ...this.openaiMessages,
      greetingPrompt,
    ]);

    const greetingMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: responseText,
      character_id: this.character.id,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(greetingMessage);
    this.openaiMessages.push({ role: 'assistant', content: responseText });

    return greetingMessage;
  }

  /**
   * Analyze a user message for language feedback.
   */
  private async analyzeFeedback(userText: string): Promise<MessageFeedback | null> {
    try {
      const feedbackPrompt = buildFeedbackPrompt(
        userText,
        this.targetLanguage,
        this.userLanguage
      );

      const result = await callChatAPI(
        [{ role: 'user', content: feedbackPrompt }],
        { temperature: 0.3, maxTokens: 200 }
      );

      const parsed = JSON.parse(result);
      return parsed.feedback ?? null;
    } catch {
      // Feedback is non-critical; silently return null on failure
      return null;
    }
  }

  /**
   * Update the story context (e.g., after a chapter change or player choice).
   */
  updateContext(newContext: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...newContext };

    // Rebuild the system prompt
    const systemPrompt = buildSystemPrompt(
      this.character,
      this.context,
      this.userLanguage,
      this.targetLanguage
    );
    this.openaiMessages[0] = { role: 'system', content: systemPrompt };
  }

  /**
   * Get all messages in this conversation.
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Get the character for this conversation.
   */
  getCharacter(): Character {
    return this.character;
  }
}

// ---- Standalone Translation ----

/**
 * Translate a single text to the user's native language.
 */
export async function translateText(
  text: string,
  fromLanguage: string,
  toLanguage: string
): Promise<string> {
  const result = await callChatAPI(
    [
      {
        role: 'user',
        content: `Translate the following text from ${fromLanguage} to ${toLanguage}. Return ONLY the translation, nothing else.\n\nText: "${text}"`,
      },
    ],
    { temperature: 0.2, maxTokens: 500 }
  );
  return result.trim();
}

/**
 * Get a contextual word definition for vocabulary lookup.
 */
export async function getWordDefinition(
  word: string,
  contextSentence: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<{
  translation: string;
  contextMeaning: string;
  exampleSentence: string;
}> {
  const result = await callChatAPI(
    [
      {
        role: 'user',
        content: `Define the word "${word}" as used in this ${targetLanguage} sentence: "${contextSentence}"

Respond in JSON format:
{
  "translation": "translation in ${nativeLanguage}",
  "contextMeaning": "meaning in this specific context in ${nativeLanguage}",
  "exampleSentence": "another example sentence using this word in ${targetLanguage}"
}

Return valid JSON only.`,
      },
    ],
    { temperature: 0.3, maxTokens: 200 }
  );

  try {
    return JSON.parse(result);
  } catch {
    return {
      translation: word,
      contextMeaning: '',
      exampleSentence: '',
    };
  }
}

// ---- Utilities ----

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
