/**
 * Game Store - Zustand store for active game/scene state
 */

import { create } from 'zustand';
import type { GameState, GameRelationships } from '../types/gameState';
import type { DialogueMessage } from '../types/dialogue';

interface GameStoreState {
  /** Current active game state (one story at a time) */
  currentGame: GameState | null;
  /** Dialogue messages for the current scene */
  messages: DialogueMessage[];
  /** Whether the AI is currently generating a response */
  isGenerating: boolean;

  setCurrentGame: (game: GameState | null) => void;
  updateRelationships: (changes: GameRelationships) => void;
  addXp: (amount: number) => void;
  addMessage: (message: DialogueMessage) => void;
  clearMessages: () => void;
  setIsGenerating: (value: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  currentGame: null,
  messages: [],
  isGenerating: false,

  setCurrentGame: (game) => set({ currentGame: game }),

  updateRelationships: (changes) =>
    set((state) => {
      if (!state.currentGame) return state;
      const updated = { ...state.currentGame.relationships };
      for (const [charId, delta] of Object.entries(changes)) {
        updated[charId] = (updated[charId] ?? 0) + delta;
      }
      return {
        currentGame: { ...state.currentGame, relationships: updated },
      };
    }),

  addXp: (amount) =>
    set((state) => {
      if (!state.currentGame) return state;
      return {
        currentGame: {
          ...state.currentGame,
          xp: state.currentGame.xp + amount,
        },
      };
    }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  clearMessages: () => set({ messages: [] }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  reset: () =>
    set({ currentGame: null, messages: [], isGenerating: false }),
}));
