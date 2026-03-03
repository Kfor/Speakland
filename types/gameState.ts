/**
 * Game state type definitions
 */

export type GameRelationships = Record<string, number>;

export interface GameState {
  id: string;
  userId: string;
  storyId: string;
  currentSegmentId: string;
  completedSegmentIds: string[];
  relationships: GameRelationships;
  inventory: string[];
  xp: number;
  level: number;
  wordsEncountered: number;
  wordsLearned: number;
  totalTurns: number;
  sessionDuration: number;
  startedAt: string;
  lastPlayedAt: string;
}
