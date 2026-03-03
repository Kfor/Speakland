/**
 * Vocabulary Store - Zustand store for word book state
 */

import { create } from 'zustand';
import type { WordEntry } from '../types/vocabulary';

interface VocabularyStoreState {
  /** User's word book entries */
  words: WordEntry[];
  /** Whether word data is being loaded */
  isLoading: boolean;

  setWords: (words: WordEntry[]) => void;
  addWord: (word: WordEntry) => void;
  removeWord: (wordId: string) => void;
  markLearned: (wordId: string) => void;
  setIsLoading: (value: boolean) => void;
  reset: () => void;
}

export const useVocabularyStore = create<VocabularyStoreState>((set) => ({
  words: [],
  isLoading: false,

  setWords: (words) => set({ words }),

  addWord: (word) =>
    set((state) => ({
      words: [...state.words, word],
    })),

  removeWord: (wordId) =>
    set((state) => ({
      words: state.words.filter((w) => w.id !== wordId),
    })),

  markLearned: (wordId) =>
    set((state) => ({
      words: state.words.map((w) =>
        w.id === wordId
          ? { ...w, learned: true, learnedAt: new Date().toISOString() }
          : w
      ),
    })),

  setIsLoading: (value) => set({ isLoading: value }),

  reset: () => set({ words: [], isLoading: false }),
}));
