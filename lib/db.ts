/**
 * Supabase CRUD Layer
 *
 * Typed functions for 4 tables: user_profiles, game_states, user_word_books, dialogue_history.
 * All functions are fire-and-forget safe: errors are logged, never thrown.
 */

import { supabase } from './supabase';
import type { UserProfile, OnboardingData } from '../types/user';
import type { GameState } from '../types/gameState';
import type { WordEntry } from '../types/vocabulary';
import type { DialogueMessage } from '../types/dialogue';

// ---------------------------------------------------------------------------
// camelCase <-> snake_case helpers
// ---------------------------------------------------------------------------

/** Convert a camelCase string to snake_case */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert a snake_case string to camelCase */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** Map all keys of an object from camelCase to snake_case */
export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

/** Map all keys of an object from snake_case to camelCase */
export function toCamelCase<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

interface DbResult<T> {
  data: T | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// 1. loadProfile
// ---------------------------------------------------------------------------

export async function loadProfile(
  userId: string,
): Promise<DbResult<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[db] loadProfile error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: toCamelCase(data) as unknown as UserProfile, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] loadProfile exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 2. saveOnboardingData
// ---------------------------------------------------------------------------

export async function saveOnboardingData(
  userId: string,
  onboardingData: OnboardingData,
): Promise<DbResult<null>> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_data: onboardingData })
      .eq('id', userId);

    if (error) {
      console.error('[db] saveOnboardingData error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] saveOnboardingData exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 3. loadGameStates
// ---------------------------------------------------------------------------

export async function loadGameStates(
  userId: string,
): Promise<DbResult<GameState[]>> {
  try {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[db] loadGameStates error:', error.message);
      return { data: null, error: error.message };
    }

    const mapped = (data ?? []).map(
      (row) => toCamelCase(row as Record<string, unknown>) as unknown as GameState,
    );
    return { data: mapped, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] loadGameStates exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 4. upsertGameState
// ---------------------------------------------------------------------------

export async function upsertGameState(
  userId: string,
  state: Omit<GameState, 'id'>,
): Promise<DbResult<GameState>> {
  try {
    const snakeRow = toSnakeCase(state as unknown as Record<string, unknown>);
    // Ensure user_id is set (it may already be in state, but enforce it)
    snakeRow.user_id = userId;
    // Remove id — let the DB generate/match via onConflict
    delete snakeRow.id;

    const { data, error } = await supabase
      .from('game_states')
      .upsert(snakeRow, { onConflict: 'user_id,story_id' })
      .select()
      .single();

    if (error) {
      console.error('[db] upsertGameState error:', error.message);
      return { data: null, error: error.message };
    }

    return {
      data: toCamelCase(data as Record<string, unknown>) as unknown as GameState,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] upsertGameState exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 5. loadWords
// ---------------------------------------------------------------------------

export async function loadWords(
  userId: string,
): Promise<DbResult<WordEntry[]>> {
  try {
    const { data, error } = await supabase
      .from('user_word_books')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[db] loadWords error:', error.message);
      return { data: null, error: error.message };
    }

    const mapped = (data ?? []).map(
      (row) => toCamelCase(row as Record<string, unknown>) as unknown as WordEntry,
    );
    return { data: mapped, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] loadWords exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 6. addWord
// ---------------------------------------------------------------------------

export async function addWord(
  userId: string,
  word: Omit<WordEntry, 'id'>,
): Promise<DbResult<WordEntry>> {
  try {
    const snakeRow = toSnakeCase(word as unknown as Record<string, unknown>);
    snakeRow.user_id = userId;
    delete snakeRow.id;

    const { data, error } = await supabase
      .from('user_word_books')
      .upsert(snakeRow, { onConflict: 'user_id,word,language' })
      .select()
      .single();

    if (error) {
      console.error('[db] addWord error:', error.message);
      return { data: null, error: error.message };
    }

    return {
      data: toCamelCase(data as Record<string, unknown>) as unknown as WordEntry,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] addWord exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 7. removeWord
// ---------------------------------------------------------------------------

export async function removeWord(
  userId: string,
  wordId: string,
): Promise<DbResult<null>> {
  try {
    const { error } = await supabase
      .from('user_word_books')
      .delete()
      .eq('id', wordId)
      .eq('user_id', userId);

    if (error) {
      console.error('[db] removeWord error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] removeWord exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 8. markWordLearned
// ---------------------------------------------------------------------------

export async function markWordLearned(
  userId: string,
  wordId: string,
): Promise<DbResult<null>> {
  try {
    const { error } = await supabase
      .from('user_word_books')
      .update({ learned: true, learned_at: new Date().toISOString() })
      .eq('id', wordId)
      .eq('user_id', userId);

    if (error) {
      console.error('[db] markWordLearned error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] markWordLearned exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 9. loadDialogue
// ---------------------------------------------------------------------------

export async function loadDialogue(
  userId: string,
  storyId: string,
  segmentId: string,
): Promise<DbResult<DialogueMessage[]>> {
  try {
    const { data, error } = await supabase
      .from('dialogue_history')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .eq('segment_id', segmentId)
      .order('turn_number', { ascending: true });

    if (error) {
      console.error('[db] loadDialogue error:', error.message);
      return { data: null, error: error.message };
    }

    const mapped = (data ?? []).map(
      (row) =>
        toCamelCase(row as Record<string, unknown>) as unknown as DialogueMessage,
    );
    return { data: mapped, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] loadDialogue exception:', message);
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// 10. saveDialogueMessage
// ---------------------------------------------------------------------------

export async function saveDialogueMessage(
  userId: string,
  message: Omit<DialogueMessage, 'id'>,
): Promise<DbResult<DialogueMessage>> {
  try {
    const snakeRow = toSnakeCase(message as unknown as Record<string, unknown>);
    snakeRow.user_id = userId;
    delete snakeRow.id;

    const { data, error } = await supabase
      .from('dialogue_history')
      .insert(snakeRow)
      .select()
      .single();

    if (error) {
      console.error('[db] saveDialogueMessage error:', error.message);
      return { data: null, error: error.message };
    }

    return {
      data: toCamelCase(data as Record<string, unknown>) as unknown as DialogueMessage,
      error: null,
    };
  } catch (err) {
    const message_str = err instanceof Error ? err.message : String(err);
    console.error('[db] saveDialogueMessage exception:', message_str);
    return { data: null, error: message_str };
  }
}
