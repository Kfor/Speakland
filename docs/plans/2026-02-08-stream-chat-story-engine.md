# Stream Chat + Story Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mock chatbot with streaming LLM responses and a story-tree-driven scene engine that transitions between segments based on branch conditions.

**Architecture:** The LLM service becomes a streaming text generator using OpenAI-compatible API with SSE. A new `engine/` module manages story loading, prompt building, and branch evaluation. SceneContext is refactored to work with RPG types from the data layer, adding stream-token support and segment transitions.

**Tech Stack:** React Native, Expo, Supabase, OpenAI-compatible streaming API (fetch + ReadableStream), existing expo-speech TTS

---

### Task 1: Streaming LLM Service

**Files:**
- Create: `speakland/lib/streamingLlm.ts`
- Modify: `speakland/lib/llm.ts` (keep non-streaming functions intact)

**Step 1: Create streaming LLM module**

Create `speakland/lib/streamingLlm.ts` — a focused module that does one thing: stream text from an OpenAI-compatible chat completions API.

```typescript
// speakland/lib/streamingLlm.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

const LLM_API_URL = process.env.EXPO_PUBLIC_LLM_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY || '';
const LLM_MODEL = process.env.EXPO_PUBLIC_LLM_MODEL || 'gpt-4o-mini';

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  if (!LLM_API_KEY) {
    // Fallback: simulate streaming with mock text
    const mockText = "I understand. That's a great point! Let me think about that...";
    await simulateStream(mockText, callbacks);
    return;
  }

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (error) {
    if (signal?.aborted) return;
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

async function simulateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
  const words = text.split(' ');
  let fullText = '';
  for (let i = 0; i < words.length; i++) {
    const token = (i === 0 ? '' : ' ') + words[i];
    fullText += token;
    callbacks.onToken(token);
    await new Promise(r => setTimeout(r, 50 + Math.random() * 80));
  }
  callbacks.onDone(fullText);
}
```

**Step 2: Commit**

```bash
git add speakland/lib/streamingLlm.ts
git commit -m "feat(stream): add streaming LLM service with SSE parsing and mock fallback"
```

---

### Task 2: Story Engine — Core + Prompt Builder

**Files:**
- Create: `speakland/engine/storyEngine.ts`
- Create: `speakland/engine/promptBuilder.ts`
- Create: `speakland/engine/index.ts`

**Step 1: Create prompt builder**

```typescript
// speakland/engine/promptBuilder.ts

import type { RpgCharacter, StorySegment, GameState } from '../types/rpg';
import type { ChatMessage } from '../lib/streamingLlm';

const MAX_HISTORY_TURNS = 20;

export function buildSystemPrompt(
  character: RpgCharacter,
  segment: StorySegment,
  gameState: GameState
): string {
  const parts: string[] = [];

  // Character persona
  parts.push(`You are ${character.name} (${character.localizedName}).`);
  if (character.personality) parts.push(`Personality: ${character.personality}`);
  if (character.speakingStyle) parts.push(`Speaking style: ${character.speakingStyle}`);
  if (character.vocabulary.length > 0) {
    parts.push(`Favorite expressions: ${character.vocabulary.join(', ')}`);
  }
  if (character.backstory) parts.push(`Background: ${character.backstory}`);
  if (character.targetLanguageUsage) parts.push(`Language usage: ${character.targetLanguageUsage}`);

  // Scene instruction
  parts.push('');
  parts.push('--- Current Scene ---');
  parts.push(segment.systemPromptFragment);
  if (segment.suggestedTopics && segment.suggestedTopics.length > 0) {
    parts.push(`Suggested topics: ${segment.suggestedTopics.join(', ')}`);
  }

  // State summary
  parts.push('');
  parts.push('--- Learner Status ---');
  parts.push(`Level: ${gameState.level}, XP: ${gameState.xp}`);
  parts.push(`Words encountered: ${gameState.wordsEncountered}, learned: ${gameState.wordsLearned}`);
  const relationshipValue = gameState.relationships[character.id];
  if (relationshipValue !== undefined) {
    parts.push(`Relationship with learner: ${relationshipValue}/100`);
  }

  // Instructions
  parts.push('');
  parts.push('Keep responses concise (1-3 sentences). Stay in character. Do not break the fourth wall.');

  return parts.join('\n');
}

export interface DialogueTurn {
  speaker: 'user' | 'assistant';
  content: string;
}

export function buildChatMessages(
  systemPrompt: string,
  dialogueHistory: DialogueTurn[],
  userInput: string
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add recent history (capped)
  const recentHistory = dialogueHistory.slice(-MAX_HISTORY_TURNS);
  for (const turn of recentHistory) {
    messages.push({ role: turn.speaker === 'user' ? 'user' : 'assistant', content: turn.content });
  }

  // Add current user input
  messages.push({ role: 'user', content: userInput });

  return messages;
}
```

**Step 2: Create story engine**

```typescript
// speakland/engine/storyEngine.ts

import type {
  Story, StorySegment, StoryBranch, BranchCondition,
  GameState, RpgCharacter,
} from '../types/rpg';
import { getStory, getStorySegments } from '../services/storyService';
import { getCharacters } from '../services/characterService';
import {
  getGameState, createGameState, updateGameState,
} from '../services/gameStateService';
import type { DialogueTurn } from './promptBuilder';

export interface StoryData {
  story: Story;
  segments: Map<string, StorySegment>;
  characters: Map<string, RpgCharacter>;
}

export interface TransitionResult {
  segment: StorySegment;
  narrativeIntro: string | undefined;
  characters: RpgCharacter[];
}

export async function loadStoryData(storyId: string): Promise<StoryData | null> {
  const story = await getStory(storyId);
  if (!story) return null;

  const segmentList = await getStorySegments(storyId);
  const segments = new Map<string, StorySegment>();
  for (const seg of segmentList) {
    segments.set(seg.id, seg);
  }

  const characterList = await getCharacters(story.characterIds);
  const characters = new Map<string, RpgCharacter>();
  for (const ch of characterList) {
    characters.set(ch.id, ch);
  }

  return { story, segments, characters };
}

export async function getOrCreateGameState(
  userId: string,
  storyId: string,
  rootSegmentId: string
): Promise<GameState | null> {
  const existing = await getGameState(userId, storyId);
  if (existing) return existing;
  return createGameState(userId, storyId, rootSegmentId);
}

export function evaluateBranches(
  segment: StorySegment,
  dialogueHistory: DialogueTurn[],
  gameState: GameState,
  segmentTurnCount: number
): StoryBranch | null {
  // Check maxTurns first — force transition on the default (first) branch
  if (segment.maxTurns && segmentTurnCount >= segment.maxTurns && segment.branches.length > 0) {
    return segment.branches[0];
  }

  // Don't evaluate branches before minTurns
  if (segment.minTurns && segmentTurnCount < segment.minTurns) {
    return null;
  }

  for (const branch of segment.branches) {
    if (evaluateAllConditions(branch.conditions, dialogueHistory, gameState, segmentTurnCount)) {
      return branch;
    }
  }

  return null;
}

function evaluateAllConditions(
  conditions: BranchCondition[],
  dialogueHistory: DialogueTurn[],
  gameState: GameState,
  segmentTurnCount: number
): boolean {
  // All conditions must be satisfied (AND logic)
  return conditions.every(c => evaluateCondition(c, dialogueHistory, gameState, segmentTurnCount));
}

function evaluateCondition(
  condition: BranchCondition,
  dialogueHistory: DialogueTurn[],
  gameState: GameState,
  segmentTurnCount: number
): boolean {
  switch (condition.type) {
    case 'keyword': {
      const recentTexts = dialogueHistory
        .slice(-10)
        .map(t => t.content.toLowerCase());
      return condition.keywords.some(kw =>
        recentTexts.some(text => text.includes(kw.toLowerCase()))
      );
    }
    case 'turn_count':
      return segmentTurnCount >= condition.minTurns;
    case 'state':
      return (gameState as any)[condition.key] === condition.value;
    case 'relationship': {
      const rel = gameState.relationships[condition.characterId] ?? 0;
      return rel >= condition.minValue;
    }
    case 'user_choice':
      // user_choice is handled by explicit UI selection, not auto-evaluation
      return false;
    default:
      return false;
  }
}

export async function transitionToSegment(
  gameStateId: string,
  targetSegmentId: string,
  storyData: StoryData,
  completedSegmentIds: string[],
  currentSegmentId: string
): Promise<TransitionResult | null> {
  const nextSegment = storyData.segments.get(targetSegmentId);
  if (!nextSegment) return null;

  const newCompleted = [...completedSegmentIds, currentSegmentId];

  await updateGameState(gameStateId, {
    current_segment_id: targetSegmentId,
    completed_segment_ids: newCompleted,
  });

  const chars = nextSegment.activeCharacterIds
    .map(id => storyData.characters.get(id))
    .filter((c): c is RpgCharacter => c !== undefined);

  return {
    segment: nextSegment,
    narrativeIntro: nextSegment.narrativeIntro,
    characters: chars,
  };
}
```

**Step 3: Create index barrel**

```typescript
// speakland/engine/index.ts
export { loadStoryData, getOrCreateGameState, evaluateBranches, transitionToSegment } from './storyEngine';
export type { StoryData, TransitionResult } from './storyEngine';
export { buildSystemPrompt, buildChatMessages } from './promptBuilder';
export type { DialogueTurn } from './promptBuilder';
```

**Step 4: Commit**

```bash
git add speakland/engine/
git commit -m "feat(engine): add story engine with branch evaluation and prompt builder"
```

---

### Task 3: Refactor SceneContext for RPG + Streaming

**Files:**
- Modify: `speakland/contexts/SceneContext.tsx` (full rewrite)

**Step 1: Rewrite SceneContext**

Replace the entire contents of `speakland/contexts/SceneContext.tsx` with a new version that:
- Uses RPG types (`RpgCharacter`, `StorySegment`, `GameState`) from `types/rpg.ts`
- Still uses `DialogueMessage` from `types/scene.ts` for UI rendering
- Adds `STREAM_TOKEN` action to update the streaming message in-place
- Adds `SET_SEGMENT` action for scene transitions
- Adds `SET_NARRATIVE` action for transition narration
- Loads story from Supabase via story engine (not MOCK_STORIES)
- Calls `streamChat` instead of `generateDialogue`
- Calls `evaluateBranches` after each complete response
- Saves dialogue to Supabase via `dialogueService`
- Preserves TTS integration (plays after stream completes)

Key state additions:
```typescript
interface SceneState {
  // ... existing fields ...
  currentSegment: StorySegment | null;
  gameState: GameState | null;
  storyData: StoryData | null;
  narrative: string | null;        // transition narration text
  isStreaming: boolean;             // distinct from isLoading
  segmentTurnCount: number;        // turns in current segment
}
```

New reducer actions:
```typescript
| { type: 'STREAM_TOKEN'; payload: { messageId: string; token: string } }
| { type: 'STREAM_DONE'; payload: { messageId: string; fullText: string } }
| { type: 'SET_SEGMENT'; payload: { segment: StorySegment; characters: RpgCharacter[]; narrative?: string } }
| { type: 'SET_NARRATIVE'; payload: string | null }
| { type: 'SET_GAME_STATE'; payload: GameState }
| { type: 'SET_STORY_DATA'; payload: { storyData: StoryData; segment: StorySegment; characters: RpgCharacter[]; gameState: GameState; narrative?: string } }
| { type: 'INCREMENT_TURN' }
| { type: 'SET_STREAMING'; payload: boolean }
```

The `sendMessage` flow becomes:
1. Dispatch ADD_USER_MESSAGE
2. Create a placeholder assistant message with empty text
3. Dispatch ADD_DIALOGUE (with empty text)
4. Set isStreaming = true
5. Build prompt via `buildSystemPrompt` + `buildChatMessages`
6. Call `streamChat` with onToken → dispatch STREAM_TOKEN, onDone → dispatch STREAM_DONE
7. After done: increment turn count, evaluate branches
8. If branch triggers: call transitionToSegment, dispatch SET_SEGMENT
9. Save both user message and assistant message to dialogue_history via dialogueService
10. Play TTS on the full response text

**Step 2: Commit**

```bash
git add speakland/contexts/SceneContext.tsx
git commit -m "feat(scene): refactor SceneContext for RPG engine + streaming LLM"
```

---

### Task 4: Update Scene Page + DialogueArea for Streaming

**Files:**
- Modify: `speakland/app/scene/[id].tsx`
- Modify: `speakland/components/scene/DialogueArea.tsx`

**Step 1: Update scene/[id].tsx**

Changes:
- Remove `MOCK_STORIES` import
- `loadStory` now takes a story ID string (not a Story object) — the context handles loading from Supabase
- Add narrative overlay: when `state.narrative` is set, show a semi-transparent overlay with the narrative text, auto-dismiss after 3s
- Show streaming indicator (pulsing dots) while `state.isStreaming` is true
- Story title can come from `state.storyData?.story.localizedTitle`

**Step 2: Update DialogueArea.tsx**

Changes:
- The component already renders `dialogue.text` word-by-word
- During streaming (`isStreaming` prop), the text updates in real-time as tokens arrive
- The words container re-renders as `dialogue.text` grows
- No cursor animation needed — the growing text IS the indicator
- Disable long-press on words while streaming (text is still changing)

**Step 3: Commit**

```bash
git add speakland/app/scene/[id].tsx speakland/components/scene/DialogueArea.tsx
git commit -m "feat(ui): scene page loads from Supabase + streaming text rendering + narrative overlay"
```

---

### Task 5: Add LLM env vars + update .env.example

**Files:**
- Modify: `speakland/.env.example` (if exists, otherwise `.env.example` at root)

**Step 1: Add LLM environment variable documentation**

Add to `.env.example`:
```
# LLM Configuration (for streaming chat)
EXPO_PUBLIC_LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
EXPO_PUBLIC_LLM_API_KEY=sk-your-key-here
EXPO_PUBLIC_LLM_MODEL=gpt-4o-mini
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add LLM API env vars to .env.example"
```

---

### Task 6: TypeScript Check + Final Verification

**Step 1: Run TypeScript check**

```bash
cd speakland && npx tsc --noEmit
```

Fix any type errors.

**Step 2: Verify all imports are correct**

Ensure:
- No circular imports between engine/ and services/
- SceneContext properly imports from both engine/ and lib/streamingLlm.ts
- scene/[id].tsx doesn't import MOCK_STORIES anymore
- DialogueArea still works with the same props interface (just `dialogue.text` grows during streaming)

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from stream + engine integration"
```

---

## Architecture Notes for Implementer

### File dependency graph:
```
lib/streamingLlm.ts          (standalone, no app deps)
    ↓
engine/promptBuilder.ts       (depends on types/rpg)
engine/storyEngine.ts         (depends on types/rpg, services/*)
engine/index.ts               (barrel)
    ↓
contexts/SceneContext.tsx      (depends on engine/, lib/streamingLlm, lib/tts, services/dialogueService, contexts/AuthContext)
    ↓
app/scene/[id].tsx            (depends on contexts/SceneContext)
components/scene/DialogueArea (depends on types/scene)
```

### Streaming in React Native:
- `fetch` + `ReadableStream` works in React Native 0.81+ with Hermes
- SSE parsing is manual (no EventSource needed)
- The STREAM_TOKEN dispatch on each token causes a re-render, which updates the DialogueArea text
- This is the standard pattern for streaming chat UIs

### Mock fallback:
- When `EXPO_PUBLIC_LLM_API_KEY` is empty, `streamChat` falls back to `simulateStream`
- This simulates token-by-token delivery using word splitting + delays
- The UX is identical to real streaming, allowing development without an API key

### Branch evaluation timing:
- Evaluated AFTER each complete assistant response (not during streaming)
- maxTurns is a hard limit → first branch is forced
- minTurns prevents premature transitions
- All conditions within a branch are AND-ed
- Branches are checked in order; first match wins

### Dialogue persistence:
- Both user and assistant messages are saved to `dialogue_history` via `saveDialogueMessage`
- The `turn_number` is the `segmentTurnCount` at the time of the message
- On segment transition, segmentTurnCount resets to 0

### TTS integration:
- TTS plays AFTER the full stream is complete (onDone callback)
- The existing `speakAsCharacter` function is reused
- Need to adapt it to accept `RpgCharacter` (which has a different `voiceConfig` shape)
- Create a small adapter: `{ language: voiceConfig.language, pitch: voiceConfig.pitch, rate: voiceConfig.rate }`
