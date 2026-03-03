/**
 * Speakland - Shared Type Definitions
 *
 * Central export for all application types.
 */

export type {
  Story,
  Character,
  CharacterExpression,
  VoiceConfig,
  StorySegment,
  StoryBranch,
  BranchCondition,
} from './story';

export type {
  DialogueMessage,
  DialogueSpeaker,
  SmartAssistResult,
  StatePlotResult,
} from './dialogue';

export type {
  GameState,
  GameRelationships,
} from './gameState';

export type {
  WordEntry,
  VocabularyMatch,
} from './vocabulary';

export type {
  UserProfile,
  OnboardingData,
  LearningLanguage,
  LearningGoal,
  LearningPain,
  DifficultyLevel,
  StoryPreference,
} from './user';

export type {
  LlmProxyRequest,
  LlmProxyResponse,
  StreamCallbacks,
} from './llm';
