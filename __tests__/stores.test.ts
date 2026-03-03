/**
 * Zustand stores tests
 *
 * Verifies store state management, actions, and resets.
 */

import { useAuthStore } from '../stores/useAuthStore';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useGameStore } from '../stores/useGameStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import type { UserProfile } from '../types/user';
import type { GameState } from '../types/gameState';
import type { DialogueMessage } from '../types/dialogue';
import type { WordEntry } from '../types/vocabulary';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  test('initial state', () => {
    const state = useAuthStore.getState();
    expect(state.profile).toBeNull();
    expect(state.isOnboarded).toBe(false);
  });

  test('setProfile', () => {
    const profile: UserProfile = {
      id: 'user-1',
      displayName: 'Test',
      isPremium: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    useAuthStore.getState().setProfile(profile);
    expect(useAuthStore.getState().profile?.id).toBe('user-1');
  });

  test('setOnboarded', () => {
    useAuthStore.getState().setOnboarded(true);
    expect(useAuthStore.getState().isOnboarded).toBe(true);
  });

  test('reset clears state', () => {
    useAuthStore.getState().setOnboarded(true);
    useAuthStore.getState().reset();
    expect(useAuthStore.getState().isOnboarded).toBe(false);
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  test('initial state', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.data).toEqual({});
  });

  test('nextStep / prevStep', () => {
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(2);
    useOnboardingStore.getState().prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
  });

  test('prevStep does not go below 0', () => {
    useOnboardingStore.getState().prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe(0);
  });

  test('setTargetLanguage', () => {
    useOnboardingStore.getState().setTargetLanguage('es');
    expect(useOnboardingStore.getState().data.targetLanguage).toBe('es');
  });

  test('setNickname', () => {
    useOnboardingStore.getState().setNickname('Player1');
    expect(useOnboardingStore.getState().data.nickname).toBe('Player1');
  });

  test('setLearningGoals', () => {
    useOnboardingStore.getState().setLearningGoals(['travel', 'communication']);
    expect(useOnboardingStore.getState().data.learningGoals).toEqual([
      'travel',
      'communication',
    ]);
  });

  test('reset clears all data', () => {
    useOnboardingStore.getState().setTargetLanguage('en');
    useOnboardingStore.getState().nextStep();
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().currentStep).toBe(0);
    expect(useOnboardingStore.getState().data).toEqual({});
  });
});

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  const mockGameState: GameState = {
    id: 'gs-1',
    userId: 'user-1',
    storyId: 'story-1',
    currentSegmentId: 'seg-1',
    completedSegmentIds: [],
    relationships: { 'char-1': 5 },
    inventory: [],
    xp: 10,
    level: 1,
    wordsEncountered: 0,
    wordsLearned: 0,
    totalTurns: 0,
    sessionDuration: 0,
    startedAt: '2026-01-01T00:00:00Z',
    lastPlayedAt: '2026-01-01T00:00:00Z',
  };

  test('initial state', () => {
    const state = useGameStore.getState();
    expect(state.currentGame).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.isGenerating).toBe(false);
  });

  test('setCurrentGame', () => {
    useGameStore.getState().setCurrentGame(mockGameState);
    expect(useGameStore.getState().currentGame?.id).toBe('gs-1');
  });

  test('updateRelationships', () => {
    useGameStore.getState().setCurrentGame(mockGameState);
    useGameStore.getState().updateRelationships({ 'char-1': 3, 'char-2': 1 });
    const game = useGameStore.getState().currentGame;
    expect(game?.relationships['char-1']).toBe(8);
    expect(game?.relationships['char-2']).toBe(1);
  });

  test('addXp', () => {
    useGameStore.getState().setCurrentGame(mockGameState);
    useGameStore.getState().addXp(5);
    expect(useGameStore.getState().currentGame?.xp).toBe(15);
  });

  test('addMessage', () => {
    const message: DialogueMessage = {
      id: 'msg-1',
      userId: 'user-1',
      storyId: 'story-1',
      segmentId: 'seg-1',
      speaker: 'user',
      content: 'Hello',
      turnNumber: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };
    useGameStore.getState().addMessage(message);
    expect(useGameStore.getState().messages).toHaveLength(1);
    expect(useGameStore.getState().messages[0].content).toBe('Hello');
  });

  test('setIsGenerating', () => {
    useGameStore.getState().setIsGenerating(true);
    expect(useGameStore.getState().isGenerating).toBe(true);
  });

  test('reset clears everything', () => {
    useGameStore.getState().setCurrentGame(mockGameState);
    useGameStore.getState().setIsGenerating(true);
    useGameStore.getState().reset();
    expect(useGameStore.getState().currentGame).toBeNull();
    expect(useGameStore.getState().messages).toEqual([]);
    expect(useGameStore.getState().isGenerating).toBe(false);
  });
});

describe('useVocabularyStore', () => {
  beforeEach(() => {
    useVocabularyStore.getState().reset();
  });

  const mockWord: WordEntry = {
    id: 'w-1',
    userId: 'user-1',
    word: 'hello',
    language: 'en',
    learned: false,
    addedAt: '2026-01-01T00:00:00Z',
  };

  test('initial state', () => {
    const state = useVocabularyStore.getState();
    expect(state.words).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  test('addWord', () => {
    useVocabularyStore.getState().addWord(mockWord);
    expect(useVocabularyStore.getState().words).toHaveLength(1);
    expect(useVocabularyStore.getState().words[0].word).toBe('hello');
  });

  test('removeWord', () => {
    useVocabularyStore.getState().addWord(mockWord);
    useVocabularyStore.getState().removeWord('w-1');
    expect(useVocabularyStore.getState().words).toHaveLength(0);
  });

  test('markLearned', () => {
    useVocabularyStore.getState().addWord(mockWord);
    useVocabularyStore.getState().markLearned('w-1');
    const word = useVocabularyStore.getState().words[0];
    expect(word.learned).toBe(true);
    expect(word.learnedAt).toBeDefined();
  });

  test('setWords', () => {
    const words: WordEntry[] = [
      mockWord,
      { ...mockWord, id: 'w-2', word: 'world' },
    ];
    useVocabularyStore.getState().setWords(words);
    expect(useVocabularyStore.getState().words).toHaveLength(2);
  });

  test('reset clears state', () => {
    useVocabularyStore.getState().addWord(mockWord);
    useVocabularyStore.getState().setIsLoading(true);
    useVocabularyStore.getState().reset();
    expect(useVocabularyStore.getState().words).toEqual([]);
    expect(useVocabularyStore.getState().isLoading).toBe(false);
  });
});
