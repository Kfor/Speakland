/**
 * Game Store - Zustand store for active game/scene state
 *
 * DB sync: setCurrentGame/updateRelationships/addXp trigger a debounced (1s)
 * upsertGameState. addMessage triggers an immediate saveDialogueMessage.
 * All DB writes are skipped when userId is 'local-user'.
 */

import { create } from 'zustand';
import type { GameState, GameRelationships } from '../types/gameState';
import type { DialogueMessage } from '../types/dialogue';
import {
  upsertGameState,
  saveDialogueMessage,
  loadGameStates,
} from '../lib/db';

// Module-level debounce timer for game state sync
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDebouncedSync(getGame: () => GameState | null) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const game = getGame();
    if (game && game.userId !== 'local-user') {
      upsertGameState(game).catch(() => {});
    }
  }, 1000);
}

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
  loadFromDb: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentGame: null,
  messages: [],
  isGenerating: false,

  setCurrentGame: (game) => {
    set({ currentGame: game });
    if (game) {
      scheduleDebouncedSync(() => get().currentGame);
    }
  },

  updateRelationships: (changes) => {
    set((state) => {
      if (!state.currentGame) return state;
      const updated = { ...state.currentGame.relationships };
      for (const [charId, delta] of Object.entries(changes)) {
        updated[charId] = (updated[charId] ?? 0) + delta;
      }
      return {
        currentGame: { ...state.currentGame, relationships: updated },
      };
    });
    scheduleDebouncedSync(() => get().currentGame);
  },

  addXp: (amount) => {
    set((state) => {
      if (!state.currentGame) return state;
      return {
        currentGame: {
          ...state.currentGame,
          xp: state.currentGame.xp + amount,
        },
      };
    });
    scheduleDebouncedSync(() => get().currentGame);
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
    if (message.userId !== 'local-user') {
      saveDialogueMessage(message).catch(() => {});
    }
  },

  clearMessages: () => set({ messages: [] }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  loadFromDb: async (userId) => {
    const games = await loadGameStates(userId);
    if (games.length > 0) {
      // Set the most recently played game as current
      const latest = games.sort(
        (a, b) =>
          new Date(b.lastPlayedAt).getTime() -
          new Date(a.lastPlayedAt).getTime(),
      )[0];
      set({ currentGame: latest });
    }
  },

  reset: () => {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    set({ currentGame: null, messages: [], isGenerating: false });
  },
}));
