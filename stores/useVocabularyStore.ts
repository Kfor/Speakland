/**
 * Vocabulary Store - Zustand store for word book state
 *
 * DB sync: addWord/removeWord/markLearned trigger immediate DB writes.
 * All DB writes are skipped when userId is 'local-user'.
 */

import { create } from 'zustand';
import type { WordEntry } from '../types/vocabulary';
import {
  upsertWordEntry,
  deleteWordEntry,
  loadWordEntries,
} from '../lib/db';

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
  loadFromDb: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useVocabularyStore = create<VocabularyStoreState>((set, get) => ({
  words: [],
  isLoading: false,

  setWords: (words) => set({ words }),

  addWord: (word) => {
    set((state) => ({
      words: [...state.words, word],
    }));
    if (word.userId !== 'local-user') {
      upsertWordEntry(word).catch(() => {});
    }
  },

  removeWord: (wordId) => {
    const word = get().words.find((w) => w.id === wordId);
    set((state) => ({
      words: state.words.filter((w) => w.id !== wordId),
    }));
    if (word && word.userId !== 'local-user') {
      deleteWordEntry(word.userId, word.word, word.language).catch(() => {});
    }
  },

  markLearned: (wordId) => {
    const word = get().words.find((w) => w.id === wordId);
    const learnedAt = new Date().toISOString();
    set((state) => ({
      words: state.words.map((w) =>
        w.id === wordId ? { ...w, learned: true, learnedAt } : w,
      ),
    }));
    if (word && word.userId !== 'local-user') {
      upsertWordEntry({ ...word, learned: true, learnedAt }).catch(() => {});
    }
  },

  setIsLoading: (value) => set({ isLoading: value }),

  loadFromDb: async (userId) => {
    set({ isLoading: true });
    const words = await loadWordEntries(userId);
    set({ words, isLoading: false });
  },

  reset: () => set({ words: [], isLoading: false }),
}));
