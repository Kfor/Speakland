/**
 * Dialogue & AI feedback type definitions
 */

import type { CharacterExpression } from './story';

export type DialogueSpeaker = 'user' | 'character' | 'narrator' | 'system';

export interface DialogueMessage {
  id: string;
  userId: string;
  storyId: string;
  segmentId: string;
  speaker: DialogueSpeaker;
  content: string;
  translation?: string;
  expression?: CharacterExpression;
  turnNumber: number;
  createdAt: string;
}

export interface SmartAssistResult {
  grammar?: {
    original: string;
    corrected: string;
    explanation: string;
  };
  expression?: {
    original: string;
    better: string;
    explanation: string;
  };
  praise?: string;
}

export interface StatePlotResult {
  stateChanges: Record<string, unknown>;
  branchTriggered?: string;
  narrative?: string;
  relationshipChanges?: Record<string, number>;
  xpGained?: number;
}
