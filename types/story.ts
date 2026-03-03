/**
 * Story & Character type definitions
 */

export type CharacterExpression =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'thinking';

export interface VoiceConfig {
  provider: 'expo-speech' | 'tts-api' | 'realtime-voice';
  language: string;
  voiceId?: string;
  pitch?: number;
  rate?: number;
}

export interface Character {
  id: string;
  name: string;
  localizedName: string;
  portraits: Record<CharacterExpression, string>;
  voiceConfig: VoiceConfig;
  personality: string;
  speakingStyle: string;
  vocabulary: string[];
  backstory: string;
  targetLanguageUsage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Story {
  id: string;
  title: string;
  localizedTitle: string;
  description: string;
  backgroundImage: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  targetLanguage: string;
  estimatedMinutes: number;
  tags: string[];
  characterIds: string[];
  rootSegmentId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchCondition =
  | { type: 'keyword'; keywords: string[] }
  | { type: 'turn_count'; minTurns: number }
  | { type: 'state'; key: string; value: unknown }
  | { type: 'relationship'; characterId: string; minValue: number }
  | { type: 'user_choice'; choiceId: string };

export interface StoryBranch {
  id: string;
  targetSegmentId: string;
  conditions: BranchCondition[];
  hint?: string;
}

export interface StorySegment {
  id: string;
  storyId: string;
  title: string;
  backgroundImage?: string;
  activeCharacterIds: string[];
  narrativeIntro?: string;
  systemPromptFragment: string;
  suggestedTopics?: string[];
  branches: StoryBranch[];
  maxTurns?: number;
  minTurns?: number;
  createdAt?: string;
}
