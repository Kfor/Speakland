/**
 * Vocabulary & word book type definitions
 */

export interface WordEntry {
  id: string;
  userId: string;
  word: string;
  language: string;
  translation?: string;
  contextSentence?: string;
  learned: boolean;
  learnedAt?: string;
  addedAt: string;
}

export interface VocabularyMatch {
  word: string;
  language: string;
  difficultyLevel?: number;
  translation?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  isSlang?: boolean;
  tags?: string[];
}
