# RPG Engine Data Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the RPG interactive engine data infrastructure: Supabase DB tables, TypeScript type definitions, service layer, and seed data.

**Architecture:** New SQL migration for 7 tables with RLS. New TypeScript types in `speakland/types/rpg.ts`. New service modules in `speakland/services/` using the existing Supabase client at `speakland/lib/supabase.ts`. Seed data as a SQL migration file.

**Tech Stack:** Supabase (PostgreSQL + RLS), TypeScript, React Native/Expo

---

### Task 1: SQL Migration — Create 7 RPG Tables

**Files:**
- Create: `supabase/migrations/20260208000001_rpg_engine_tables.sql`

**Step 1: Write the migration file**

```sql
-- RPG Engine Tables Migration
-- Creates: characters, stories, story_segments, game_states, vocabularies, user_word_books, dialogue_history

-- 角色人设表
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  localized_name TEXT,
  portraits JSONB NOT NULL DEFAULT '{}',
  voice_config JSONB,
  personality TEXT,
  speaking_style TEXT,
  vocabulary TEXT[],
  backstory TEXT,
  target_language_usage TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 故事表
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  localized_title TEXT,
  description TEXT,
  background_image TEXT,
  difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  target_language TEXT NOT NULL,
  estimated_minutes INT,
  tags TEXT[],
  character_ids UUID[],
  root_segment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 场景节点表
CREATE TABLE IF NOT EXISTS story_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_image TEXT,
  active_character_ids UUID[],
  narrative_intro TEXT,
  system_prompt_fragment TEXT NOT NULL,
  suggested_topics TEXT[],
  branches JSONB DEFAULT '[]',
  max_turns INT,
  min_turns INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 用户游戏状态表
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  current_segment_id UUID REFERENCES story_segments(id),
  completed_segment_ids UUID[] DEFAULT '{}',
  relationships JSONB DEFAULT '{}',
  inventory TEXT[] DEFAULT '{}',
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  words_encountered INT DEFAULT 0,
  words_learned INT DEFAULT 0,
  total_turns INT DEFAULT 0,
  session_duration INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_played_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, story_id)
);

-- 分级词库表
CREATE TABLE IF NOT EXISTS vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  difficulty_level SMALLINT,
  translation TEXT,
  pronunciation TEXT,
  part_of_speech TEXT,
  example_sentence TEXT,
  is_slang BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 用户个人词本表
CREATE TABLE IF NOT EXISTS user_word_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  translation TEXT,
  context_sentence TEXT,
  learned BOOLEAN DEFAULT false,
  learned_at TIMESTAMPTZ,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word, language)
);

-- 对话历史表
CREATE TABLE IF NOT EXISTS dialogue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES story_segments(id),
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  translation TEXT,
  expression TEXT,
  turn_number INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add root_segment_id FK after story_segments exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_root_segment_id_fkey'
  ) THEN
    ALTER TABLE stories
      ADD CONSTRAINT stories_root_segment_id_fkey
      FOREIGN KEY (root_segment_id) REFERENCES story_segments(id);
  END IF;
END $$;
```

**Step 2: Verify the SQL is syntactically valid**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481283390 && cat supabase/migrations/20260208000001_rpg_engine_tables.sql | head -5`
Expected: First 5 lines of the migration file visible

**Step 3: Commit**

```bash
git add supabase/migrations/20260208000001_rpg_engine_tables.sql
git commit -m "feat(rpg): add migration for 7 RPG engine tables"
```

---

### Task 2: SQL Migration — RLS Policies

**Files:**
- Create: `supabase/migrations/20260208000002_rpg_rls_policies.sql`

**Step 1: Write the RLS policy migration**

```sql
-- RLS Policies for RPG Engine Tables

-- Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_history ENABLE ROW LEVEL SECURITY;

-- Public read-only tables (authenticated users can read)
CREATE POLICY IF NOT EXISTS "characters_select_authenticated"
  ON characters FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "stories_select_authenticated"
  ON stories FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "story_segments_select_authenticated"
  ON story_segments FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "vocabularies_select_authenticated"
  ON vocabularies FOR SELECT TO authenticated USING (true);

-- User-owned tables (users can only access their own data)
-- game_states
CREATE POLICY IF NOT EXISTS "game_states_select_own"
  ON game_states FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "game_states_insert_own"
  ON game_states FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "game_states_update_own"
  ON game_states FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "game_states_delete_own"
  ON game_states FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_word_books
CREATE POLICY IF NOT EXISTS "user_word_books_select_own"
  ON user_word_books FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_word_books_insert_own"
  ON user_word_books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_word_books_update_own"
  ON user_word_books FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_word_books_delete_own"
  ON user_word_books FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- dialogue_history
CREATE POLICY IF NOT EXISTS "dialogue_history_select_own"
  ON dialogue_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "dialogue_history_insert_own"
  ON dialogue_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "dialogue_history_delete_own"
  ON dialogue_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260208000002_rpg_rls_policies.sql
git commit -m "feat(rpg): add RLS policies for RPG engine tables"
```

---

### Task 3: TypeScript Types — RPG Core Interfaces

**Files:**
- Create: `speakland/types/rpg.ts`

**Step 1: Write the type definitions file**

All types must match the PRD interfaces exactly. The key types are:

- `CharacterExpression` — reuse from scene.ts or redefine (prefer import)
- `VoiceConfig` — extracted from Character
- `Character` — full RPG character with personality, backstory, etc.
- `Story` — with characterIds (UUID refs, not embedded objects)
- `StorySegment` — scene node with branches, system prompt, etc.
- `StoryBranch` — transition between segments
- `BranchCondition` — discriminated union (keyword/turn_count/state/relationship/user_choice)
- `GameState` — user progress per story
- `SmartAssistResult` — grammar + expression + praise
- `StatePlotResult` — state changes + branch trigger + narrative
- `VocabularyMatch` — vocabulary match result

Key design decisions:
- `Character` here is the full RPG version (extends the scene version with personality, backstory, etc.)
- `Story` uses `characterIds: string[]` (UUID references) instead of embedding `Character[]`
- `StorySegment` is a new concept (scene nodes in the story DAG)
- Keep `CharacterExpression` imported from `scene.ts` to avoid duplication

```typescript
import { CharacterExpression } from './scene';

// Re-export for convenience
export type { CharacterExpression };

export interface VoiceConfig {
  provider: 'expo-speech' | 'tts-api' | 'realtime-voice';
  language: string;
  voiceId?: string;
  pitch?: number;
  rate?: number;
}

export interface RpgCharacter {
  id: string;
  name: string;
  localizedName: string;
  portraits: Record<CharacterExpression, string>;
  voiceConfig: VoiceConfig;
  personality: string;
  speakingStyle: string;
  vocabulary: string[];
  backstory: string;
  targetLanguageUsage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Story {
  id: string;
  title: string;
  localizedTitle: string;
  description: string;
  backgroundImage: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  targetLanguage: string;
  estimatedMinutes: number;
  tags: string[];
  characterIds: string[];
  rootSegmentId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchCondition =
  | { type: 'keyword'; keywords: string[] }
  | { type: 'turn_count'; minTurns: number }
  | { type: 'state'; key: string; value: unknown }
  | { type: 'relationship'; characterId: string; minValue: number }
  | { type: 'user_choice'; choiceId: string };

export interface StoryBranch {
  id: string;
  targetSegmentId: string;
  conditions: BranchCondition[];
  hint?: string;
}

export interface StorySegment {
  id: string;
  storyId: string;
  title: string;
  backgroundImage?: string;
  activeCharacterIds: string[];
  narrativeIntro?: string;
  systemPromptFragment: string;
  suggestedTopics?: string[];
  branches: StoryBranch[];
  maxTurns?: number;
  minTurns?: number;
  createdAt?: string;
}

export interface GameState {
  id: string;
  userId: string;
  storyId: string;
  currentSegmentId: string;
  completedSegmentIds: string[];
  storyStartedAt: string;
  lastPlayedAt: string;
  relationships: Record<string, number>;
  inventory: string[];
  xp: number;
  level: number;
  wordsEncountered: number;
  wordsLearned: number;
  totalTurns: number;
  sessionDuration: number;
}

export interface SmartAssistResult {
  grammarIssues?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  betterExpressions?: Array<{
    userSaid: string;
    suggestion: string;
    context: string;
  }>;
  praise?: string;
}

export interface StatePlotResult {
  stateChanges?: Array<{
    type: 'relationship' | 'inventory' | 'xp';
    target?: string;
    delta?: number;
    reason: string;
  }>;
  branchTriggered?: {
    branchId: string;
    confidence: number;
    reason: string;
  };
  narrative?: string;
}

export interface VocabularyMatch {
  word: string;
  translation: string;
  pronunciation?: string;
  difficultyLevel?: number;
  isSlang: boolean;
  isLearned: boolean;
  partOfSpeech?: string;
}

// DB row types (snake_case, matching Supabase column names)
export interface DbCharacter {
  id: string;
  name: string;
  localized_name: string | null;
  portraits: Record<CharacterExpression, string>;
  voice_config: VoiceConfig | null;
  personality: string | null;
  speaking_style: string | null;
  vocabulary: string[] | null;
  backstory: string | null;
  target_language_usage: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStory {
  id: string;
  title: string;
  localized_title: string | null;
  description: string | null;
  background_image: string | null;
  difficulty: number | null;
  target_language: string;
  estimated_minutes: number | null;
  tags: string[] | null;
  character_ids: string[] | null;
  root_segment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStorySegment {
  id: string;
  story_id: string;
  title: string;
  background_image: string | null;
  active_character_ids: string[] | null;
  narrative_intro: string | null;
  system_prompt_fragment: string;
  suggested_topics: string[] | null;
  branches: StoryBranch[];
  max_turns: number | null;
  min_turns: number | null;
  created_at: string;
}

export interface DbGameState {
  id: string;
  user_id: string;
  story_id: string;
  current_segment_id: string | null;
  completed_segment_ids: string[];
  relationships: Record<string, number>;
  inventory: string[];
  xp: number;
  level: number;
  words_encountered: number;
  words_learned: number;
  total_turns: number;
  session_duration: number;
  started_at: string;
  last_played_at: string;
}

export interface DbVocabularyEntry {
  id: string;
  word: string;
  language: string;
  difficulty_level: number | null;
  translation: string | null;
  pronunciation: string | null;
  part_of_speech: string | null;
  example_sentence: string | null;
  is_slang: boolean;
  tags: string[] | null;
  created_at: string;
}

export interface DbUserWordBook {
  id: string;
  user_id: string;
  word: string;
  language: string;
  translation: string | null;
  context_sentence: string | null;
  learned: boolean;
  learned_at: string | null;
  added_at: string;
}

export interface DbDialogueHistory {
  id: string;
  user_id: string;
  story_id: string;
  segment_id: string | null;
  speaker: string;
  content: string;
  translation: string | null;
  expression: string | null;
  turn_number: number | null;
  created_at: string;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481283390 && npx tsc --noEmit speakland/types/rpg.ts 2>&1 | head -20`
Expected: No errors (or only unrelated project-wide errors)

**Step 3: Commit**

```bash
git add speakland/types/rpg.ts
git commit -m "feat(rpg): add TypeScript type definitions for RPG engine"
```

---

### Task 4: Service — characterService

**Files:**
- Create: `speakland/services/characterService.ts`

**Step 1: Write characterService**

```typescript
import { supabase } from '../lib/supabase';
import type { DbCharacter, RpgCharacter } from '../types/rpg';

function toRpgCharacter(row: DbCharacter): RpgCharacter {
  return {
    id: row.id,
    name: row.name,
    localizedName: row.localized_name ?? row.name,
    portraits: row.portraits,
    voiceConfig: row.voice_config ?? { provider: 'expo-speech', language: 'en-US' },
    personality: row.personality ?? '',
    speakingStyle: row.speaking_style ?? '',
    vocabulary: row.vocabulary ?? [],
    backstory: row.backstory ?? '',
    targetLanguageUsage: row.target_language_usage ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCharacter(id: string): Promise<RpgCharacter | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return toRpgCharacter(data as DbCharacter);
}

export async function getCharacters(ids: string[]): Promise<RpgCharacter[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .in('id', ids);

  if (error || !data) return [];
  return (data as DbCharacter[]).map(toRpgCharacter);
}

export async function getAllCharacters(): Promise<RpgCharacter[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('name');

  if (error || !data) return [];
  return (data as DbCharacter[]).map(toRpgCharacter);
}
```

**Step 2: Commit**

```bash
git add speakland/services/characterService.ts
git commit -m "feat(rpg): add characterService for reading character data"
```

---

### Task 5: Service — storyService

**Files:**
- Create: `speakland/services/storyService.ts`

**Step 1: Write storyService**

```typescript
import { supabase } from '../lib/supabase';
import type { DbStory, DbStorySegment, Story, StorySegment } from '../types/rpg';

function toStory(row: DbStory): Story {
  return {
    id: row.id,
    title: row.title,
    localizedTitle: row.localized_title ?? row.title,
    description: row.description ?? '',
    backgroundImage: row.background_image ?? '',
    difficulty: (row.difficulty ?? 1) as 1 | 2 | 3 | 4 | 5,
    targetLanguage: row.target_language,
    estimatedMinutes: row.estimated_minutes ?? 0,
    tags: row.tags ?? [],
    characterIds: row.character_ids ?? [],
    rootSegmentId: row.root_segment_id ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toStorySegment(row: DbStorySegment): StorySegment {
  return {
    id: row.id,
    storyId: row.story_id,
    title: row.title,
    backgroundImage: row.background_image ?? undefined,
    activeCharacterIds: row.active_character_ids ?? [],
    narrativeIntro: row.narrative_intro ?? undefined,
    systemPromptFragment: row.system_prompt_fragment,
    suggestedTopics: row.suggested_topics ?? undefined,
    branches: row.branches ?? [],
    maxTurns: row.max_turns ?? undefined,
    minTurns: row.min_turns ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getStory(id: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return toStory(data as DbStory);
}

export async function getAllStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('difficulty');

  if (error || !data) return [];
  return (data as DbStory[]).map(toStory);
}

export async function getStoriesByLanguage(language: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('target_language', language)
    .order('difficulty');

  if (error || !data) return [];
  return (data as DbStory[]).map(toStory);
}

export async function getStorySegment(id: string): Promise<StorySegment | null> {
  const { data, error } = await supabase
    .from('story_segments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return toStorySegment(data as DbStorySegment);
}

export async function getStorySegments(storyId: string): Promise<StorySegment[]> {
  const { data, error } = await supabase
    .from('story_segments')
    .select('*')
    .eq('story_id', storyId);

  if (error || !data) return [];
  return (data as DbStorySegment[]).map(toStorySegment);
}
```

**Step 2: Commit**

```bash
git add speakland/services/storyService.ts
git commit -m "feat(rpg): add storyService for reading stories and segments"
```

---

### Task 6: Service — gameStateService

**Files:**
- Create: `speakland/services/gameStateService.ts`

**Step 1: Write gameStateService**

```typescript
import { supabase } from '../lib/supabase';
import type { DbGameState, GameState } from '../types/rpg';

function toGameState(row: DbGameState): GameState {
  return {
    id: row.id,
    userId: row.user_id,
    storyId: row.story_id,
    currentSegmentId: row.current_segment_id ?? '',
    completedSegmentIds: row.completed_segment_ids ?? [],
    storyStartedAt: row.started_at,
    lastPlayedAt: row.last_played_at,
    relationships: row.relationships ?? {},
    inventory: row.inventory ?? [],
    xp: row.xp,
    level: row.level,
    wordsEncountered: row.words_encountered,
    wordsLearned: row.words_learned,
    totalTurns: row.total_turns,
    sessionDuration: row.session_duration,
  };
}

export async function getGameState(userId: string, storyId: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();

  if (error || !data) return null;
  return toGameState(data as DbGameState);
}

export async function getUserGameStates(userId: string): Promise<GameState[]> {
  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('user_id', userId)
    .order('last_played_at', { ascending: false });

  if (error || !data) return [];
  return (data as DbGameState[]).map(toGameState);
}

export async function createGameState(
  userId: string,
  storyId: string,
  rootSegmentId: string
): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('game_states')
    .insert({
      user_id: userId,
      story_id: storyId,
      current_segment_id: rootSegmentId,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toGameState(data as DbGameState);
}

export async function updateGameState(
  id: string,
  updates: Partial<Pick<DbGameState,
    'current_segment_id' | 'completed_segment_ids' | 'relationships' |
    'inventory' | 'xp' | 'level' | 'words_encountered' | 'words_learned' |
    'total_turns' | 'session_duration'
  >>
): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('game_states')
    .update({ ...updates, last_played_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return toGameState(data as DbGameState);
}
```

**Step 2: Commit**

```bash
git add speakland/services/gameStateService.ts
git commit -m "feat(rpg): add gameStateService for user game state CRUD"
```

---

### Task 7: Service — vocabularyService

**Files:**
- Create: `speakland/services/vocabularyService.ts`

**Step 1: Write vocabularyService**

```typescript
import { supabase } from '../lib/supabase';
import type { DbVocabularyEntry, DbUserWordBook, VocabularyMatch } from '../types/rpg';

export async function queryVocabulary(
  language: string,
  difficultyLevel?: number
): Promise<DbVocabularyEntry[]> {
  let query = supabase
    .from('vocabularies')
    .select('*')
    .eq('language', language);

  if (difficultyLevel !== undefined) {
    query = query.lte('difficulty_level', difficultyLevel);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as DbVocabularyEntry[];
}

export async function searchVocabulary(
  word: string,
  language: string
): Promise<DbVocabularyEntry | null> {
  const { data, error } = await supabase
    .from('vocabularies')
    .select('*')
    .eq('word', word)
    .eq('language', language)
    .single();

  if (error || !data) return null;
  return data as DbVocabularyEntry;
}

export async function getUserWordBook(
  userId: string,
  language: string
): Promise<DbUserWordBook[]> {
  const { data, error } = await supabase
    .from('user_word_books')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .order('added_at', { ascending: false });

  if (error || !data) return [];
  return data as DbUserWordBook[];
}

export async function addToWordBook(
  userId: string,
  word: string,
  language: string,
  translation: string,
  contextSentence?: string
): Promise<DbUserWordBook | null> {
  const { data, error } = await supabase
    .from('user_word_books')
    .upsert(
      {
        user_id: userId,
        word,
        language,
        translation,
        context_sentence: contextSentence ?? null,
      },
      { onConflict: 'user_id,word,language' }
    )
    .select()
    .single();

  if (error || !data) return null;
  return data as DbUserWordBook;
}

export async function markWordLearned(
  userId: string,
  word: string,
  language: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_word_books')
    .update({ learned: true, learned_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('word', word)
    .eq('language', language);

  return !error;
}

export async function removeFromWordBook(
  userId: string,
  word: string,
  language: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_word_books')
    .delete()
    .eq('user_id', userId)
    .eq('word', word)
    .eq('language', language);

  return !error;
}

export async function matchVocabulary(
  words: string[],
  language: string,
  userId: string
): Promise<VocabularyMatch[]> {
  if (words.length === 0) return [];

  // Fetch vocabulary entries for the words
  const { data: vocabData } = await supabase
    .from('vocabularies')
    .select('*')
    .eq('language', language)
    .in('word', words);

  // Fetch user's word book to check learned status
  const { data: userWords } = await supabase
    .from('user_word_books')
    .select('word, learned')
    .eq('user_id', userId)
    .eq('language', language)
    .in('word', words);

  const learnedMap = new Map(
    (userWords ?? []).map((w: { word: string; learned: boolean }) => [w.word, w.learned])
  );

  return ((vocabData ?? []) as DbVocabularyEntry[]).map((entry) => ({
    word: entry.word,
    translation: entry.translation ?? '',
    pronunciation: entry.pronunciation ?? undefined,
    difficultyLevel: entry.difficulty_level ?? undefined,
    isSlang: entry.is_slang,
    isLearned: learnedMap.get(entry.word) ?? false,
    partOfSpeech: entry.part_of_speech ?? undefined,
  }));
}
```

**Step 2: Commit**

```bash
git add speakland/services/vocabularyService.ts
git commit -m "feat(rpg): add vocabularyService for vocabulary queries and user word book"
```

---

### Task 8: Service — dialogueService

**Files:**
- Create: `speakland/services/dialogueService.ts`

**Step 1: Write dialogueService**

```typescript
import { supabase } from '../lib/supabase';
import type { DbDialogueHistory } from '../types/rpg';

export async function saveDialogueMessage(params: {
  userId: string;
  storyId: string;
  segmentId: string;
  speaker: string;
  content: string;
  translation?: string;
  expression?: string;
  turnNumber?: number;
}): Promise<DbDialogueHistory | null> {
  const { data, error } = await supabase
    .from('dialogue_history')
    .insert({
      user_id: params.userId,
      story_id: params.storyId,
      segment_id: params.segmentId,
      speaker: params.speaker,
      content: params.content,
      translation: params.translation ?? null,
      expression: params.expression ?? null,
      turn_number: params.turnNumber ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as DbDialogueHistory;
}

export async function getDialogueHistory(
  userId: string,
  storyId: string,
  segmentId?: string
): Promise<DbDialogueHistory[]> {
  let query = supabase
    .from('dialogue_history')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .order('turn_number')
    .order('created_at');

  if (segmentId) {
    query = query.eq('segment_id', segmentId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as DbDialogueHistory[];
}

export async function getRecentDialogue(
  userId: string,
  storyId: string,
  limit: number = 20
): Promise<DbDialogueHistory[]> {
  const { data, error } = await supabase
    .from('dialogue_history')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  // Return in chronological order
  return (data as DbDialogueHistory[]).reverse();
}

export async function deleteDialogueHistory(
  userId: string,
  storyId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('dialogue_history')
    .delete()
    .eq('user_id', userId)
    .eq('story_id', storyId);

  return !error;
}
```

**Step 2: Commit**

```bash
git add speakland/services/dialogueService.ts
git commit -m "feat(rpg): add dialogueService for dialogue history persistence"
```

---

### Task 9: Seed Data — Convert Mock Data to SQL

**Files:**
- Create: `supabase/migrations/20260208000003_rpg_seed_data.sql`

**Step 1: Write seed data migration**

Convert the existing mock data (MOCK_CHARACTER_EMMA, MOCK_CHARACTER_SAKURA, MOCK_STORY_COFFEE_SHOP, MOCK_STORY_TOKYO) into SQL INSERT statements using the new RPG table schema. Use deterministic UUIDs for cross-referencing.

The seed data must include:
- 2 characters (Emma, Sakura) with full RPG fields (personality, speaking_style, backstory, etc.)
- 2 stories (Coffee Shop Chat, Tokyo Adventure)
- 2+ story_segments (at least 1 root segment per story, with branches)
- Sample vocabularies (based on MOCK_WORD_TRANSLATIONS)

Use DO blocks with conflict handling to make the migration idempotent.

```sql
-- RPG Engine Seed Data
-- Converts existing mock data (Coffee Shop Chat, Tokyo Adventure) into RPG schema

-- Use deterministic UUIDs for cross-referencing
-- Emma: 00000000-0000-0000-0000-000000000001
-- Sakura: 00000000-0000-0000-0000-000000000002
-- Coffee Shop story: 00000000-0000-0000-0000-000000000011
-- Tokyo Adventure story: 00000000-0000-0000-0000-000000000012
-- Coffee Shop root segment: 00000000-0000-0000-0000-000000000021
-- Tokyo root segment: 00000000-0000-0000-0000-000000000022
-- Coffee Shop branch segment: 00000000-0000-0000-0000-000000000023
-- Tokyo branch segment: 00000000-0000-0000-0000-000000000024

-- Characters
INSERT INTO characters (id, name, localized_name, portraits, voice_config, personality, speaking_style, vocabulary, backstory, target_language_usage)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Emma',
    '艾玛老师',
    '{"neutral": "placeholder:neutral", "happy": "placeholder:happy", "surprised": "placeholder:surprised"}',
    '{"provider": "expo-speech", "language": "en-US", "pitch": 1.1, "rate": 0.9}',
    'Warm, patient, and encouraging. Loves helping learners build confidence in English.',
    'Casual and friendly, uses simple sentences for beginners, gradually introduces more complex structures.',
    ARRAY['wonderful', 'great job', 'let me help you', 'how about', 'that''s interesting'],
    'Emma is an English teacher who runs a cozy coffee shop where she chats with language learners from around the world.',
    'Speaks entirely in English, slows down and simplifies when the learner struggles.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Sakura',
    '樱花',
    '{"neutral": "placeholder:neutral", "happy": "placeholder:happy", "surprised": "placeholder:surprised"}',
    '{"provider": "expo-speech", "language": "ja-JP", "pitch": 1.2, "rate": 0.85}',
    'Cheerful, curious, and enthusiastic about sharing Japanese culture.',
    'Polite and uses a mix of casual and formal Japanese. Often adds cultural context to explanations.',
    ARRAY['すごい', 'なるほど', 'いいですね', '面白い', 'がんばって'],
    'Sakura is a university student in Tokyo who loves showing visitors around the city and teaching them Japanese along the way.',
    'Speaks primarily in Japanese with occasional English hints for difficult concepts.'
  )
ON CONFLICT (id) DO NOTHING;

-- Story Segments (must be inserted before stories due to root_segment_id FK)

-- Coffee Shop segments
INSERT INTO story_segments (id, story_id, title, background_image, active_character_ids, narrative_intro, system_prompt_fragment, suggested_topics, branches, max_turns, min_turns)
VALUES
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000011',
    'First Meeting',
    'placeholder:coffee-shop',
    ARRAY['00000000-0000-0000-0000-000000000001']::UUID[],
    'You walk into a cozy coffee shop. A friendly woman behind the counter smiles at you.',
    'You are Emma, a friendly English teacher running a coffee shop. The user just walked in. Start with a warm greeting and help them order a drink. Keep language simple for beginners. Guide the conversation toward daily life topics.',
    ARRAY['ordering drinks', 'weather', 'hobbies', 'introductions'],
    '[{"id": "branch-coffee-1", "targetSegmentId": "00000000-0000-0000-0000-000000000023", "conditions": [{"type": "turn_count", "minTurns": 6}], "hint": "After a few exchanges, transition to a deeper conversation about hobbies"}]',
    12,
    4
  ),
  (
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000011',
    'Getting to Know Each Other',
    'placeholder:coffee-shop',
    ARRAY['00000000-0000-0000-0000-000000000001']::UUID[],
    'Emma brings over two cups of coffee and sits down across from you.',
    'You are Emma. The user has settled in with their drink. Now have a more personal conversation about hobbies, travel, and dreams. Introduce slightly more complex sentence structures.',
    ARRAY['travel experiences', 'favorite foods', 'weekend plans', 'dreams'],
    '[]',
    15,
    5
  ),
  -- Tokyo Adventure segments
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000012',
    'Arriving in Tokyo',
    'placeholder:tokyo',
    ARRAY['00000000-0000-0000-0000-000000000002']::UUID[],
    '東京駅に到着しました。人混みの中、笑顔の若い女性があなたに手を振っています。',
    'You are Sakura, a cheerful university student meeting a visitor at Tokyo Station. Greet them warmly in Japanese. Help them navigate the station and suggest places to visit. Use polite form (です/ます) primarily.',
    ARRAY['self-introduction', 'directions', 'transportation', 'sightseeing'],
    '[{"id": "branch-tokyo-1", "targetSegmentId": "00000000-0000-0000-0000-000000000024", "conditions": [{"type": "turn_count", "minTurns": 6}], "hint": "After introductions, suggest visiting a nearby temple or market"}]',
    12,
    4
  ),
  (
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000012',
    'Exploring Asakusa',
    'placeholder:tokyo-asakusa',
    ARRAY['00000000-0000-0000-0000-000000000002']::UUID[],
    '桜があなたを浅草寺に連れてきました。大きな赤い提灯が目の前にあります。',
    'You are Sakura, now at Senso-ji temple in Asakusa with the visitor. Share cultural knowledge about the temple, teach them about Japanese customs (e.g., omamori, ema), and help them buy souvenirs. Mix casual and polite Japanese.',
    ARRAY['temple customs', 'shopping', 'Japanese culture', 'food'],
    '[]',
    15,
    5
  )
ON CONFLICT (id) DO NOTHING;

-- Stories
INSERT INTO stories (id, title, localized_title, description, background_image, difficulty, target_language, estimated_minutes, tags, character_ids, root_segment_id)
VALUES
  (
    '00000000-0000-0000-0000-000000000011',
    'Coffee Shop Chat',
    '咖啡店闲聊',
    'Practice everyday English conversation in a cozy coffee shop setting.',
    'placeholder:coffee-shop',
    1,
    'en',
    10,
    ARRAY['beginner', 'daily-life', 'conversation'],
    ARRAY['00000000-0000-0000-0000-000000000001']::UUID[],
    '00000000-0000-0000-0000-000000000021'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'Tokyo Adventure',
    '东京探险',
    'Explore Tokyo with Sakura and learn Japanese along the way.',
    'placeholder:tokyo',
    2,
    'ja',
    15,
    ARRAY['beginner', 'travel', 'culture'],
    ARRAY['00000000-0000-0000-0000-000000000002']::UUID[],
    '00000000-0000-0000-0000-000000000022'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample vocabularies (from existing mock word translations)
INSERT INTO vocabularies (word, language, difficulty_level, translation, pronunciation, part_of_speech, example_sentence, is_slang, tags)
VALUES
  ('hello', 'en', 1, '你好', '/həˈloʊ/', 'interjection', 'Hello! How are you doing today?', false, ARRAY['greeting', 'beginner']),
  ('welcome', 'en', 1, '欢迎', '/ˈwelkəm/', 'adjective', 'Welcome to our coffee shop!', false, ARRAY['greeting', 'beginner']),
  ('coffee', 'en', 1, '咖啡', '/ˈkɔːfi/', 'noun', 'Would you like some coffee?', false, ARRAY['food', 'beginner']),
  ('beautiful', 'en', 1, '美丽的', '/ˈbjuːtɪfl/', 'adjective', 'It is a beautiful day today.', false, ARRAY['description', 'beginner']),
  ('conversation', 'en', 2, '对话', '/ˌkɒnvərˈseɪʃn/', 'noun', 'Let us have a conversation in English.', false, ARRAY['communication', 'intermediate']),
  ('partner', 'en', 2, '伙伴', '/ˈpɑːrtnər/', 'noun', 'She is my conversation partner.', false, ARRAY['people', 'intermediate']),
  ('こんにちは', 'ja', 1, '你好', 'konnichiwa', 'interjection', 'こんにちは！元気ですか？', false, ARRAY['greeting', 'beginner']),
  ('東京', 'ja', 1, '东京', 'tōkyō', 'noun', '東京へようこそ！', false, ARRAY['place', 'beginner']),
  ('観光', 'ja', 2, '观光', 'kankō', 'noun', '今日は観光しましょうか？', false, ARRAY['travel', 'intermediate']),
  ('今日', 'ja', 1, '今天', 'kyō', 'noun', '今日は何をしたいですか？', false, ARRAY['time', 'beginner'])
ON CONFLICT DO NOTHING;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260208000003_rpg_seed_data.sql
git commit -m "feat(rpg): add seed data for Coffee Shop Chat and Tokyo Adventure"
```

---

### Task 10: Export Barrel + Type Check

**Files:**
- Create: `speakland/services/index.ts`

**Step 1: Create barrel export for services**

```typescript
export * as characterService from './characterService';
export * as storyService from './storyService';
export * as gameStateService from './gameStateService';
export * as vocabularyService from './vocabularyService';
export * as dialogueService from './dialogueService';
```

**Step 2: Run TypeScript check on all new files**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481283390 && npx tsc --noEmit 2>&1 | grep -E "(rpg|characterService|storyService|gameStateService|vocabularyService|dialogueService)" | head -20`
Expected: No errors related to the new files (or only unrelated project-wide errors)

**Step 3: Commit**

```bash
git add speakland/services/index.ts
git commit -m "feat(rpg): add service barrel export"
```

---

### Task 11: Final Verification + Summary Commit

**Step 1: Verify all files exist**

Run: `ls -la speakland/types/rpg.ts speakland/services/characterService.ts speakland/services/storyService.ts speakland/services/gameStateService.ts speakland/services/vocabularyService.ts speakland/services/dialogueService.ts speakland/services/index.ts supabase/migrations/20260208000001_rpg_engine_tables.sql supabase/migrations/20260208000002_rpg_rls_policies.sql supabase/migrations/20260208000003_rpg_seed_data.sql`

Expected: All 10 files listed with sizes > 0

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/k/MyPlayground/aigc/Speakland/.weaver/worktrees/T1770481283390 && npx tsc --noEmit 2>&1 | tail -5`
Expected: Clean compilation or only pre-existing errors

**Step 3: Review git log**

Run: `git log --oneline -10`
Expected: 9 commits with feat(rpg) prefix
