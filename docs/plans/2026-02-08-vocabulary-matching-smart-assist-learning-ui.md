# Vocabulary Matching + Smart Assist + Learning UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement vocabulary matching (local, zero-latency), smart assist (async LLM), and upgrade the learning assist UI so users get continuous language feedback during RPG chat.

**Architecture:** Three layers — (1) a local vocabulary matcher engine that tokenizes dialogue and matches against cached word lists, (2) an async smart assist service that calls a lightweight LLM for grammar/expression feedback after each chat turn, (3) an upgraded FeedbackBar + DialogueArea with word highlighting, new-word tip bar, and smart assist display. All layers communicate via typed callbacks/events through SceneContext.

**Tech Stack:** TypeScript, React Native, Expo, Supabase (for vocabulary persistence), OpenAI-compatible API (for smart assist), AsyncStorage (local cache), React Native Animated API.

---

### Task 1: Add new types for vocabulary matching and smart assist

**Files:**
- Modify: `speakland/types/scene.ts`

**Step 1: Add the new types to scene.ts**

Add after the existing `WordPopupData` interface (line ~195):

```typescript
/**
 * A word from the graded vocabulary database
 */
export interface VocabWord {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  difficulty: number;
  isSlang: boolean;
}

/**
 * Result of matching a single token against vocabulary
 */
export interface MatchedWord {
  /** The original token from the text */
  token: string;
  /** Cleaned/lowercased form used for matching */
  normalized: string;
  /** Start index in the original text's word array */
  index: number;
  /** Whether this word is in the user's word book and marked learned */
  isLearned: boolean;
  /** Whether this is a new word (in vocab DB but not learned by user) */
  isNew: boolean;
  /** Vocabulary entry if matched */
  vocabEntry?: VocabWord;
}

/**
 * Result of vocabulary matching for an entire text
 */
export interface VocabMatchResult {
  /** All tokens from the text */
  tokens: string[];
  /** Only the tokens that matched vocabulary entries */
  matchedWords: MatchedWord[];
  /** New words the user hasn't learned yet */
  newWords: MatchedWord[];
  /** Already-learned words */
  learnedWords: MatchedWord[];
}

/**
 * A single grammar issue found by smart assist
 */
export interface GrammarIssue {
  original: string;
  corrected: string;
  explanation: string;
}

/**
 * A better expression suggestion from smart assist
 */
export interface BetterExpression {
  userSaid: string;
  suggestion: string;
  reason: string;
}

/**
 * Smart assist response for a chat turn
 */
export interface SmartAssistResult {
  grammarIssues: GrammarIssue[];
  betterExpressions: BetterExpression[];
  praise: string | null;
}

/**
 * User word book entry (mirrors Supabase user_word_books)
 */
export interface UserWordBookEntry {
  id: string;
  userId: string;
  word: string;
  translation: string;
  pronunciation?: string;
  sentenceContext: string;
  learned: boolean;
  addedAt: number;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors related to these types

**Step 3: Commit**

```bash
git add speakland/types/scene.ts
git commit -m "feat(T1770481392818): add types for vocabulary matching and smart assist"
```

---

### Task 2: Create the vocabulary matcher engine

**Files:**
- Create: `speakland/engine/vocabularyMatcher.ts`

**Step 1: Create the engine directory and vocabulary matcher**

```typescript
/**
 * Vocabulary Matcher Engine
 * Local, zero-latency matching of dialogue text against cached vocabulary.
 * No LLM calls — pure string matching against in-memory word lists.
 */

import { VocabWord, MatchedWord, VocabMatchResult, UserWordBookEntry } from '../types/scene';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const VOCAB_CACHE_KEY = '@speakland_vocab_cache';
const WORD_BOOK_CACHE_KEY = '@speakland_word_book_cache';

/**
 * In-memory caches
 */
let vocabCache: Map<string, VocabWord> = new Map();
let wordBookCache: Map<string, UserWordBookEntry> = new Map();
let segmentVocab: Map<string, VocabWord> = new Map();

/**
 * Tokenize text by splitting on whitespace and cleaning punctuation.
 * Works for English, Spanish, and other space-delimited languages.
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(t => t.length > 0);
}

/**
 * Normalize a token: lowercase + strip punctuation
 */
export function normalize(token: string): string {
  return token.replace(/[.,!?;:'"()\[\]{}\-—–…""'']/g, '').toLowerCase();
}

/**
 * Load graded vocabulary for a difficulty level from Supabase into cache.
 * Falls back to local cache if network fails.
 */
export async function loadVocabulary(difficulty: number): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('vocabularies')
      .select('id, word, translation, pronunciation, difficulty, is_slang')
      .lte('difficulty', difficulty);

    if (error) throw error;

    vocabCache = new Map();
    (data ?? []).forEach((row: {
      id: string;
      word: string;
      translation: string;
      pronunciation: string | null;
      difficulty: number;
      is_slang: boolean;
    }) => {
      const entry: VocabWord = {
        id: row.id,
        word: row.word.toLowerCase(),
        translation: row.translation,
        pronunciation: row.pronunciation ?? undefined,
        difficulty: row.difficulty,
        isSlang: row.is_slang,
      };
      vocabCache.set(entry.word, entry);
    });

    // Persist to local cache
    await AsyncStorage.setItem(
      VOCAB_CACHE_KEY,
      JSON.stringify(Array.from(vocabCache.entries()))
    );
  } catch (err) {
    console.warn('Failed to load vocabulary from Supabase, using local cache:', err);
    await loadVocabFromLocalCache();
  }
}

/**
 * Load vocabulary from local AsyncStorage cache
 */
async function loadVocabFromLocalCache(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(VOCAB_CACHE_KEY);
    if (cached) {
      vocabCache = new Map(JSON.parse(cached));
    }
  } catch (err) {
    console.warn('Failed to load local vocab cache:', err);
  }
}

/**
 * Load user's personal word book from Supabase.
 * Falls back to local cache.
 */
export async function loadUserWordBook(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('user_word_books')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    wordBookCache = new Map();
    (data ?? []).forEach((row: {
      id: string;
      user_id: string;
      word: string;
      translation: string;
      pronunciation: string | null;
      sentence_context: string;
      learned: boolean;
      added_at: string;
    }) => {
      const entry: UserWordBookEntry = {
        id: row.id,
        userId: row.user_id,
        word: row.word.toLowerCase(),
        translation: row.translation,
        pronunciation: row.pronunciation ?? undefined,
        sentenceContext: row.sentence_context,
        learned: row.learned,
        addedAt: new Date(row.added_at).getTime(),
      };
      wordBookCache.set(entry.word, entry);
    });

    await AsyncStorage.setItem(
      WORD_BOOK_CACHE_KEY,
      JSON.stringify(Array.from(wordBookCache.entries()))
    );
  } catch (err) {
    console.warn('Failed to load word book from Supabase, using local cache:', err);
    await loadWordBookFromLocalCache();
  }
}

/**
 * Load word book from local cache
 */
async function loadWordBookFromLocalCache(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(WORD_BOOK_CACHE_KEY);
    if (cached) {
      wordBookCache = new Map(JSON.parse(cached));
    }
  } catch (err) {
    console.warn('Failed to load local word book cache:', err);
  }
}

/**
 * Load segment-specific vocabulary (key words for a story segment).
 */
export async function loadSegmentVocab(segmentId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('segment_vocabularies')
      .select('vocabulary_id, vocabularies(id, word, translation, pronunciation, difficulty, is_slang)')
      .eq('segment_id', segmentId);

    if (error) throw error;

    segmentVocab = new Map();
    (data ?? []).forEach((row: any) => {
      const v = row.vocabularies;
      if (!v) return;
      const entry: VocabWord = {
        id: v.id,
        word: v.word.toLowerCase(),
        translation: v.translation,
        pronunciation: v.pronunciation ?? undefined,
        difficulty: v.difficulty,
        isSlang: v.is_slang,
      };
      segmentVocab.set(entry.word, entry);
    });
  } catch (err) {
    // Segment vocab is optional; silent fail
    console.warn('Failed to load segment vocab:', err);
  }
}

/**
 * Match dialogue text against vocabulary caches.
 * Returns match result with new words, learned words, etc.
 */
export function matchText(text: string): VocabMatchResult {
  const tokens = tokenize(text);
  const matchedWords: MatchedWord[] = [];
  const newWords: MatchedWord[] = [];
  const learnedWords: MatchedWord[] = [];

  tokens.forEach((token, index) => {
    const norm = normalize(token);
    if (!norm) return;

    // Check all vocab sources (segment vocab takes priority, then general)
    const vocabEntry = segmentVocab.get(norm) ?? vocabCache.get(norm);
    if (!vocabEntry) return;

    const wordBookEntry = wordBookCache.get(norm);
    const isLearned = wordBookEntry?.learned === true;
    const isNew = !wordBookEntry || !wordBookEntry.learned;

    const matched: MatchedWord = {
      token,
      normalized: norm,
      index,
      isLearned,
      isNew,
      vocabEntry,
    };

    matchedWords.push(matched);

    if (isLearned) {
      learnedWords.push(matched);
    } else {
      newWords.push(matched);
    }
  });

  return { tokens, matchedWords, newWords, learnedWords };
}

/**
 * Add a word to the user's word book (optimistic update).
 * Updates local cache immediately, then syncs to Supabase.
 */
export async function addToWordBook(
  userId: string,
  word: string,
  translation: string,
  sentenceContext: string,
  pronunciation?: string
): Promise<UserWordBookEntry> {
  const norm = word.toLowerCase();
  const entry: UserWordBookEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    word: norm,
    translation,
    pronunciation,
    sentenceContext,
    learned: false,
    addedAt: Date.now(),
  };

  // Optimistic local update
  wordBookCache.set(norm, entry);
  await AsyncStorage.setItem(
    WORD_BOOK_CACHE_KEY,
    JSON.stringify(Array.from(wordBookCache.entries()))
  );

  // Async Supabase sync
  try {
    const { data, error } = await supabase
      .from('user_word_books')
      .upsert({
        user_id: userId,
        word: norm,
        translation,
        pronunciation: pronunciation ?? null,
        sentence_context: sentenceContext,
        learned: false,
      }, { onConflict: 'user_id,word' })
      .select()
      .single();

    if (!error && data) {
      entry.id = data.id;
      wordBookCache.set(norm, entry);
    }
  } catch (err) {
    console.warn('Failed to sync word book to Supabase:', err);
  }

  return entry;
}

/**
 * Mark a word as learned (optimistic update).
 */
export async function markWordLearned(userId: string, word: string): Promise<void> {
  const norm = word.toLowerCase();
  const existing = wordBookCache.get(norm);
  if (existing) {
    existing.learned = true;
    wordBookCache.set(norm, existing);
    await AsyncStorage.setItem(
      WORD_BOOK_CACHE_KEY,
      JSON.stringify(Array.from(wordBookCache.entries()))
    );
  }

  try {
    await supabase
      .from('user_word_books')
      .update({ learned: true })
      .eq('user_id', userId)
      .eq('word', norm);
  } catch (err) {
    console.warn('Failed to sync learned status to Supabase:', err);
  }
}

/**
 * Check if a word is in the user's word book
 */
export function isInWordBook(word: string): boolean {
  return wordBookCache.has(normalize(word));
}

/**
 * Check if a word is learned
 */
export function isWordLearned(word: string): boolean {
  return wordBookCache.get(normalize(word))?.learned === true;
}

/**
 * Get the current vocabulary cache size (for monitoring memory)
 */
export function getCacheStats(): { vocabSize: number; wordBookSize: number; segmentSize: number } {
  return {
    vocabSize: vocabCache.size,
    wordBookSize: wordBookCache.size,
    segmentSize: segmentVocab.size,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

**Step 3: Commit**

```bash
git add speakland/engine/vocabularyMatcher.ts
git commit -m "feat(T1770481392818): create vocabulary matcher engine with local caching"
```

---

### Task 3: Create the smart assist service

**Files:**
- Create: `speakland/services/smartAssistService.ts`

**Step 1: Create the services directory and smart assist service**

```typescript
/**
 * Smart Assist Service
 * Async LLM call triggered after each chat turn.
 * Provides grammar issues, better expressions, and praise.
 * Runs in parallel with chat — never blocks user interaction.
 */

import { SmartAssistResult } from '../types/scene';

/**
 * Configuration for the smart assist LLM call
 */
interface SmartAssistConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
}

const DEFAULT_CONFIG: SmartAssistConfig = {
  apiEndpoint: process.env.EXPO_PUBLIC_LLM_API_ENDPOINT || '',
  apiKey: process.env.EXPO_PUBLIC_LLM_API_KEY || '',
  model: process.env.EXPO_PUBLIC_SMART_ASSIST_MODEL || 'gpt-4o-mini',
};

/**
 * JSON schema for structured output from the LLM
 */
const RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    grammarIssues: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          original: { type: 'string' as const },
          corrected: { type: 'string' as const },
          explanation: { type: 'string' as const },
        },
        required: ['original', 'corrected', 'explanation'],
      },
    },
    betterExpressions: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          userSaid: { type: 'string' as const },
          suggestion: { type: 'string' as const },
          reason: { type: 'string' as const },
        },
        required: ['userSaid', 'suggestion', 'reason'],
      },
    },
    praise: { type: ['string', 'null'] as const },
  },
  required: ['grammarIssues', 'betterExpressions', 'praise'],
};

/**
 * Build the system prompt for smart assist analysis
 */
function buildPrompt(
  userMessage: string,
  characterReply: string,
  targetLanguage: string,
  userLevel: string
): string {
  return `You are a language learning assistant. Analyze the following conversation turn and provide feedback.

Target language: ${targetLanguage}
User level: ${userLevel}

User said: "${userMessage}"
Character replied: "${characterReply}"

Provide a JSON response with:
1. grammarIssues: Array of grammar problems in the user's message. Each has "original" (what they wrote), "corrected" (the fix), "explanation" (why, in the user's native language Chinese).
2. betterExpressions: Array of more natural/idiomatic alternatives. Each has "userSaid", "suggestion", "reason" (in Chinese).
3. praise: If the user used any advanced or impressive expressions, give a short encouraging comment in Chinese. Otherwise null.

Keep feedback concise and helpful. Focus on the most important 1-2 issues max. If the user's message is perfect, return empty arrays and give praise.`;
}

/**
 * Call the smart assist LLM and return structured feedback.
 * Silently returns empty result on failure — never throws.
 */
export async function getSmartAssist(
  userMessage: string,
  characterReply: string,
  targetLanguage: string,
  userLevel: string,
  config?: Partial<SmartAssistConfig>
): Promise<SmartAssistResult> {
  const emptyResult: SmartAssistResult = {
    grammarIssues: [],
    betterExpressions: [],
    praise: null,
  };

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // If no API key configured, return mock result for development
  if (!mergedConfig.apiKey || !mergedConfig.apiEndpoint) {
    return getMockSmartAssist(userMessage);
  }

  try {
    const response = await fetch(mergedConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mergedConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: mergedConfig.model,
        messages: [
          {
            role: 'user',
            content: buildPrompt(userMessage, characterReply, targetLanguage, userLevel),
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'smart_assist',
            schema: RESPONSE_SCHEMA,
          },
        },
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn(`Smart assist API error: ${response.status}`);
      return emptyResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return emptyResult;

    const parsed = JSON.parse(content) as SmartAssistResult;

    // Validate structure
    return {
      grammarIssues: Array.isArray(parsed.grammarIssues) ? parsed.grammarIssues : [],
      betterExpressions: Array.isArray(parsed.betterExpressions) ? parsed.betterExpressions : [],
      praise: typeof parsed.praise === 'string' ? parsed.praise : null,
    };
  } catch (err) {
    // Silent degradation — never disrupt the chat experience
    console.warn('Smart assist failed:', err);
    return emptyResult;
  }
}

/**
 * Mock smart assist for development (no API key configured)
 */
function getMockSmartAssist(userMessage: string): SmartAssistResult {
  const words = userMessage.split(/\s+/);

  // Simple heuristics for mock feedback
  if (words.length < 3) {
    return {
      grammarIssues: [],
      betterExpressions: [],
      praise: null,
    };
  }

  const rand = Math.random();

  if (rand > 0.6) {
    return {
      grammarIssues: [],
      betterExpressions: [{
        userSaid: userMessage,
        suggestion: userMessage + ', please',
        reason: '加上 please 更礼貌自然',
      }],
      praise: null,
    };
  }

  if (rand > 0.3) {
    return {
      grammarIssues: [],
      betterExpressions: [],
      praise: '表达得很地道！继续保持！',
    };
  }

  return {
    grammarIssues: [{
      original: words.slice(0, 2).join(' '),
      corrected: words.slice(0, 2).join(' '),
      explanation: '这里的语法是正确的，做得好！',
    }],
    betterExpressions: [],
    praise: null,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

**Step 3: Commit**

```bash
git add speakland/services/smartAssistService.ts
git commit -m "feat(T1770481392818): create smart assist service with async LLM + mock fallback"
```

---

### Task 4: Add Supabase migration for user_word_books and vocabularies tables

**Files:**
- Create: `supabase/migrations/20260208000001_vocabulary_tables.sql`

**Step 1: Write the migration**

```sql
-- Graded vocabulary table (populated by admin/seed data)
CREATE TABLE IF NOT EXISTS public.vocabularies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  translation text NOT NULL,
  pronunciation text,
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  is_slang boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique word per language
CREATE UNIQUE INDEX IF NOT EXISTS vocabularies_word_lang_idx ON public.vocabularies (word, language);

-- Index for difficulty-based loading
CREATE INDEX IF NOT EXISTS vocabularies_difficulty_idx ON public.vocabularies (difficulty);

-- User personal word book
CREATE TABLE IF NOT EXISTS public.user_word_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  pronunciation text,
  sentence_context text NOT NULL DEFAULT '',
  learned boolean NOT NULL DEFAULT false,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One entry per user per word
CREATE UNIQUE INDEX IF NOT EXISTS user_word_books_user_word_idx ON public.user_word_books (user_id, word);

-- Index for user queries
CREATE INDEX IF NOT EXISTS user_word_books_user_id_idx ON public.user_word_books (user_id);

-- Segment vocabulary junction table (optional: links segments to key words)
CREATE TABLE IF NOT EXISTS public.segment_vocabularies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id text NOT NULL,
  vocabulary_id uuid NOT NULL REFERENCES public.vocabularies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS segment_vocab_idx ON public.segment_vocabularies (segment_id, vocabulary_id);

-- Enable RLS
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_vocabularies ENABLE ROW LEVEL SECURITY;

-- Vocabularies: everyone can read (public reference data)
CREATE POLICY "Anyone can read vocabularies"
  ON public.vocabularies FOR SELECT
  USING (true);

-- User word books: users can CRUD their own
CREATE POLICY "Users can view own word book"
  ON public.user_word_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word book"
  ON public.user_word_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word book"
  ON public.user_word_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own word book"
  ON public.user_word_books FOR DELETE
  USING (auth.uid() = user_id);

-- Segment vocabularies: everyone can read
CREATE POLICY "Anyone can read segment vocabularies"
  ON public.segment_vocabularies FOR SELECT
  USING (true);

-- Auto-update updated_at trigger for user_word_books
CREATE TRIGGER set_user_word_books_updated_at
  BEFORE UPDATE ON public.user_word_books
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260208000001_vocabulary_tables.sql
git commit -m "feat(T1770481392818): add Supabase migration for vocabularies and user_word_books"
```

---

### Task 5: Integrate vocabulary matching + smart assist into SceneContext

**Files:**
- Modify: `speakland/types/scene.ts` (add to SceneState)
- Modify: `speakland/contexts/SceneContext.tsx`

**Step 1: Extend SceneState with new fields**

In `speakland/types/scene.ts`, update the `SceneState` interface to add:

```typescript
// Add these fields to SceneState (after error: string | null)
  /** Vocabulary match results for the current dialogue */
  vocabMatch: VocabMatchResult | null;
  /** Smart assist results for the latest turn */
  smartAssist: SmartAssistResult | null;
  /** Whether smart assist is loading */
  smartAssistLoading: boolean;
```

**Step 2: Update SceneContext reducer and sendMessage**

In `speakland/contexts/SceneContext.tsx`:

1. Import the new types and services:
```typescript
import { VocabMatchResult, SmartAssistResult } from '../types/scene';
import { matchText } from '../engine/vocabularyMatcher';
import { getSmartAssist } from '../services/smartAssistService';
```

2. Add new action types:
```typescript
| { type: 'SET_VOCAB_MATCH'; payload: VocabMatchResult | null }
| { type: 'SET_SMART_ASSIST'; payload: SmartAssistResult | null }
| { type: 'SET_SMART_ASSIST_LOADING'; payload: boolean }
```

3. Update `initialState` with new fields:
```typescript
vocabMatch: null,
smartAssist: null,
smartAssistLoading: false,
```

4. Add reducer cases:
```typescript
case 'SET_VOCAB_MATCH':
  return { ...state, vocabMatch: action.payload };
case 'SET_SMART_ASSIST':
  return { ...state, smartAssist: action.payload };
case 'SET_SMART_ASSIST_LOADING':
  return { ...state, smartAssistLoading: action.payload };
```

5. In `sendMessage`, after the AI response is generated and dispatched, add:
```typescript
// Run vocabulary matching on the response (synchronous, zero-latency)
const responseMatch = matchText(response.text);
dispatch({ type: 'SET_VOCAB_MATCH', payload: responseMatch });

// Trigger smart assist asynchronously (don't await — fire and forget)
dispatch({ type: 'SET_SMART_ASSIST_LOADING', payload: true });
getSmartAssist(
  text,
  response.text,
  state.story.targetLanguage,
  String(state.story.difficulty)
).then(result => {
  dispatch({ type: 'SET_SMART_ASSIST', payload: result });
}).catch(() => {
  // Silent — never block chat
}).finally(() => {
  dispatch({ type: 'SET_SMART_ASSIST_LOADING', payload: false });
});
```

6. Also run vocab matching on the user's own message (before the AI response):
```typescript
// After ADD_USER_MESSAGE, match user's text too
const userMatch = matchText(text);
dispatch({ type: 'SET_VOCAB_MATCH', payload: userMatch });
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 4: Commit**

```bash
git add speakland/types/scene.ts speakland/contexts/SceneContext.tsx
git commit -m "feat(T1770481392818): integrate vocab matching + smart assist into SceneContext"
```

---

### Task 6: Upgrade FeedbackBar to show smart assist + new words

**Files:**
- Modify: `speakland/components/scene/FeedbackBar.tsx`

**Step 1: Redesign FeedbackBar with two zones**

Replace the existing FeedbackBar with an upgraded version that has:
- **Vocabulary zone** (top): Shows new words from `VocabMatchResult.newWords` with word + translation + "add to word book" button
- **Assist zone** (below vocab): Shows grammar issues, better expressions, and praise from `SmartAssistResult`

Add new props:
```typescript
interface FeedbackBarProps {
  feedbackMessages: FeedbackMessage[];
  onDismiss: (feedbackId: string) => void;
  /** New words from vocabulary matching */
  newWords?: MatchedWord[];
  /** Smart assist results */
  smartAssist?: SmartAssistResult | null;
  smartAssistLoading?: boolean;
  /** Callback when user taps "add to word book" on a new word */
  onAddToWordBook?: (word: MatchedWord) => void;
}
```

The vocabulary zone renders a horizontal scrollable row of new-word chips, each showing `word • translation` with a + button. Animation: slide in from top.

The assist zone renders grammar issues (orange cards), better expressions (blue cards), and praise (green card) with fade-in animation.

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add speakland/components/scene/FeedbackBar.tsx
git commit -m "feat(T1770481392818): upgrade FeedbackBar with vocabulary zone and smart assist display"
```

---

### Task 7: Add word highlighting to DialogueArea

**Files:**
- Modify: `speakland/components/scene/DialogueArea.tsx`

**Step 1: Add vocab match data to props**

```typescript
interface DialogueAreaProps {
  // ... existing props
  /** Vocabulary match results for highlighting */
  vocabMatch?: VocabMatchResult | null;
}
```

**Step 2: Update word rendering to show underlines**

In the word rendering loop, check if each token is in `vocabMatch.matchedWords`:
- If `isLearned`: render with a dotted underline (gray) — user already knows this word
- If `isNew`: render with a solid underline (blue/accent color) — new word for the user
- Regular words: no underline (existing behavior)

Change the `TouchableOpacity` for each word:
- **Long press** still opens the existing `WordPopup` modal
- **Single tap** on underlined words also opens the popup (more discoverable than long-press only)

```typescript
// In the word map:
const norm = normalize(word);
const matched = vocabMatch?.matchedWords.find(m => m.index === index);
const isLearned = matched?.isLearned;
const isNew = matched?.isNew;

<TouchableOpacity
  key={`${word}-${index}`}
  onPress={matched ? () => handleWordPress(word, index) : undefined}
  onLongPress={() => handleWordLongPress(word, index)}
  delayLongPress={300}
  activeOpacity={0.7}
>
  <Text style={[
    styles.word,
    isUserMessage && styles.userWord,
    isLearned && styles.learnedWord,
    isNew && styles.newWord,
  ]}>
    {word}{' '}
  </Text>
</TouchableOpacity>
```

Add styles:
```typescript
learnedWord: {
  textDecorationLine: 'underline',
  textDecorationStyle: 'dotted',
  textDecorationColor: '#999',
},
newWord: {
  textDecorationLine: 'underline',
  textDecorationStyle: 'solid',
  textDecorationColor: '#007AFF',
},
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 4: Commit**

```bash
git add speakland/components/scene/DialogueArea.tsx
git commit -m "feat(T1770481392818): add vocabulary highlighting to DialogueArea"
```

---

### Task 8: Enhance WordPopup with word book status

**Files:**
- Modify: `speakland/components/scene/WordPopup.tsx`

**Step 1: Add "in word book" / "learned" status indicator**

When the WordPopup opens for a word that's already in the user's word book:
- Show "In your word book" badge with a checkmark
- If `learned === true`, show "Learned" badge instead
- The "Add to Vocabulary" button becomes "Mark as Learned" if word is in book but not learned

Add a new prop:
```typescript
interface WordPopupProps {
  // ... existing
  /** Whether this word is in the user's word book */
  isInWordBook?: boolean;
  /** Whether this word is marked as learned */
  isLearned?: boolean;
  /** Callback to add word to word book (via vocabulary matcher) */
  onAddToWordBook?: () => void;
  /** Callback to mark word as learned */
  onMarkLearned?: () => void;
}
```

Update the actions section:
- Not in word book → "Add to Word Book" button
- In word book but not learned → "Mark as Learned" button + "Remove" link
- Learned → "Learned" badge + "Remove" link

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add speakland/components/scene/WordPopup.tsx
git commit -m "feat(T1770481392818): enhance WordPopup with word book status and learn action"
```

---

### Task 9: Wire everything together in the scene screen

**Files:**
- Modify: `speakland/app/scene/[id].tsx`

**Step 1: Connect new FeedbackBar props**

Pass the new props from `state` to `FeedbackBar`:

```typescript
<FeedbackBar
  feedbackMessages={state.feedbackMessages}
  onDismiss={removeFeedback}
  newWords={state.vocabMatch?.newWords}
  smartAssist={state.smartAssist}
  smartAssistLoading={state.smartAssistLoading}
  onAddToWordBook={handleAddToWordBook}
/>
```

**Step 2: Connect vocabMatch to DialogueArea**

```typescript
<DialogueArea
  dialogue={state.currentDialogue}
  character={state.currentCharacter}
  showTranslation={state.showTranslation}
  isSpeaking={state.isSpeaking}
  vocabMatch={state.vocabMatch}
  onWordLongPress={handleWordLongPress}
  onReplayPress={playDialogue}
  onTranslatePress={toggleTranslation}
/>
```

**Step 3: Add handlers for word book operations**

```typescript
import { addToWordBook, markWordLearned, isInWordBook, isWordLearned } from '../../engine/vocabularyMatcher';

const handleAddToWordBook = useCallback(async (matched: MatchedWord) => {
  if (!matched.vocabEntry) return;
  // userId would come from auth context — for now use a placeholder
  await addToWordBook(
    'current-user-id', // TODO: get from AuthContext
    matched.vocabEntry.word,
    matched.vocabEntry.translation,
    state.currentDialogue?.text ?? '',
    matched.vocabEntry.pronunciation
  );
}, [state.currentDialogue]);
```

**Step 4: Pass word book status to WordPopup**

```typescript
<WordPopup
  visible={wordPopupVisible}
  data={wordPopupData}
  language={state.story.targetLanguage === 'ja' ? 'ja-JP' : 'en-US'}
  onDismiss={handleWordPopupDismiss}
  isInWordBook={wordPopupData ? isInWordBook(wordPopupData.word) : false}
  isLearned={wordPopupData ? isWordLearned(wordPopupData.word) : false}
  onAddToWordBook={() => { /* call addToWordBook */ }}
  onMarkLearned={() => { /* call markWordLearned */ }}
/>
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 6: Commit**

```bash
git add speakland/app/scene/[id].tsx
git commit -m "feat(T1770481392818): wire vocab matching + smart assist into scene screen"
```

---

### Task 10: Initialize vocabulary caches on app startup

**Files:**
- Modify: `speakland/contexts/SceneContext.tsx` (or the appropriate app-level provider)

**Step 1: Add vocabulary initialization to SceneProvider**

In `SceneProvider`, add an effect that loads vocabulary caches when a story is loaded:

```typescript
import { loadVocabulary, loadUserWordBook, loadSegmentVocab } from '../engine/vocabularyMatcher';

// In SceneProvider, after story is loaded:
useEffect(() => {
  if (!state.story) return;

  // Load graded vocabulary for the story's difficulty level
  loadVocabulary(state.story.difficulty);

  // Load user word book (if authenticated)
  // TODO: get userId from auth context
  // loadUserWordBook(userId);
}, [state.story?.id, state.story?.difficulty]);
```

**Step 2: Commit**

```bash
git add speakland/contexts/SceneContext.tsx
git commit -m "feat(T1770481392818): initialize vocabulary caches on story load"
```

---

### Task 11: Final verification and cleanup

**Step 1: Run TypeScript check**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481392818 && npx tsc --noEmit --pretty`
Expected: PASS with no errors

**Step 2: Verify all files are committed**

Run: `git status`
Expected: clean working tree

**Step 3: Review the complete feature commit history**

Run: `git log --oneline -15`
Expected: All feat(T1770481392818) commits visible

---

## File Summary

| Action | Path |
|--------|------|
| Modify | `speakland/types/scene.ts` |
| Create | `speakland/engine/vocabularyMatcher.ts` |
| Create | `speakland/services/smartAssistService.ts` |
| Create | `supabase/migrations/20260208000001_vocabulary_tables.sql` |
| Modify | `speakland/contexts/SceneContext.tsx` |
| Modify | `speakland/components/scene/FeedbackBar.tsx` |
| Modify | `speakland/components/scene/DialogueArea.tsx` |
| Modify | `speakland/components/scene/WordPopup.tsx` |
| Modify | `speakland/app/scene/[id].tsx` |
