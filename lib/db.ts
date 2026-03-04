/**
 * Database CRUD Layer - Supabase persistence for Zustand stores
 *
 * All functions are offline-safe: errors are logged but never thrown.
 * This ensures the app works offline with Zustand in-memory state
 * while persisting to Supabase when connectivity is available.
 */

import { supabase } from './supabase';
import type { UserProfile, OnboardingData } from '../types/user';
import type { GameState } from '../types/gameState';
import type { DialogueMessage } from '../types/dialogue';
import type { WordEntry } from '../types/vocabulary';

// === User Profiles ===

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      onboardingData: data.onboarding_data,
      isPremium: data.is_premium ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[db] loadUserProfile failed:', err);
    return null;
  }
}

export async function saveOnboardingData(
  userId: string,
  onboardingData: OnboardingData,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_data: onboardingData })
      .eq('id', userId);

    if (error) console.warn('[db] saveOnboardingData error:', error.message);
  } catch (err) {
    console.warn('[db] saveOnboardingData failed:', err);
  }
}

// === Game States ===

export async function upsertGameState(game: GameState): Promise<void> {
  try {
    const { error } = await supabase
      .from('game_states')
      .upsert(
        {
          user_id: game.userId,
          story_id: game.storyId,
          current_segment_id: game.currentSegmentId,
          completed_segment_ids: game.completedSegmentIds,
          relationships: game.relationships,
          inventory: game.inventory,
          xp: game.xp,
          level: game.level,
          words_encountered: game.wordsEncountered,
          words_learned: game.wordsLearned,
          total_turns: game.totalTurns,
          session_duration: game.sessionDuration,
          started_at: game.startedAt,
          last_played_at: game.lastPlayedAt,
        },
        { onConflict: 'user_id,story_id' },
      );

    if (error) console.warn('[db] upsertGameState error:', error.message);
  } catch (err) {
    console.warn('[db] upsertGameState failed:', err);
  }
}

export async function loadGameStates(userId: string): Promise<GameState[]> {
  try {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      storyId: row.story_id as string,
      currentSegmentId: row.current_segment_id as string,
      completedSegmentIds: (row.completed_segment_ids as string[]) ?? [],
      relationships: (row.relationships as Record<string, number>) ?? {},
      inventory: (row.inventory as string[]) ?? [],
      xp: (row.xp as number) ?? 0,
      level: (row.level as number) ?? 1,
      wordsEncountered: (row.words_encountered as number) ?? 0,
      wordsLearned: (row.words_learned as number) ?? 0,
      totalTurns: (row.total_turns as number) ?? 0,
      sessionDuration: (row.session_duration as number) ?? 0,
      startedAt: row.started_at as string,
      lastPlayedAt: row.last_played_at as string,
    }));
  } catch (err) {
    console.warn('[db] loadGameStates failed:', err);
    return [];
  }
}

// === Dialogue History ===

export async function saveDialogueMessage(msg: DialogueMessage): Promise<void> {
  try {
    const { error } = await supabase.from('dialogue_history').insert({
      user_id: msg.userId,
      story_id: msg.storyId,
      segment_id: msg.segmentId,
      speaker: msg.speaker,
      content: msg.content,
      translation: msg.translation,
      expression: msg.expression,
      turn_number: msg.turnNumber,
      created_at: msg.createdAt,
    });

    if (error) console.warn('[db] saveDialogueMessage error:', error.message);
  } catch (err) {
    console.warn('[db] saveDialogueMessage failed:', err);
  }
}

// === Vocabulary ===

export async function upsertWordEntry(word: WordEntry): Promise<void> {
  try {
    const { error } = await supabase.from('user_word_books').upsert(
      {
        user_id: word.userId,
        word: word.word,
        language: word.language,
        translation: word.translation,
        context_sentence: word.contextSentence,
        learned: word.learned,
        learned_at: word.learnedAt,
        added_at: word.addedAt,
      },
      { onConflict: 'user_id,word,language' },
    );

    if (error) console.warn('[db] upsertWordEntry error:', error.message);
  } catch (err) {
    console.warn('[db] upsertWordEntry failed:', err);
  }
}

export async function deleteWordEntry(
  userId: string,
  word: string,
  language: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_word_books')
      .delete()
      .eq('user_id', userId)
      .eq('word', word)
      .eq('language', language);

    if (error) console.warn('[db] deleteWordEntry error:', error.message);
  } catch (err) {
    console.warn('[db] deleteWordEntry failed:', err);
  }
}

export async function loadWordEntries(userId: string): Promise<WordEntry[]> {
  try {
    const { data, error } = await supabase
      .from('user_word_books')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      word: row.word as string,
      language: row.language as string,
      translation: row.translation as string | undefined,
      contextSentence: row.context_sentence as string | undefined,
      learned: (row.learned as boolean) ?? false,
      learnedAt: row.learned_at as string | undefined,
      addedAt: row.added_at as string,
    }));
  } catch (err) {
    console.warn('[db] loadWordEntries failed:', err);
    return [];
  }
}
