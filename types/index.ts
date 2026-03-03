// ============================================================
// Speakland Core Type Definitions
// ============================================================

// --- User ---

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  native_language: string;
  target_language: TargetLanguage;
  proficiency_level: ProficiencyLevel;
  learning_goals: LearningGoal[];
  onboarding_completed: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export type TargetLanguage = 'en' | 'es';

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced';

export type LearningGoal = 'business' | 'exam' | 'communication' | 'travel' | 'culture';

// --- Story / World ---

export interface Story {
  id: string;
  title: string;
  title_localized: Record<string, string>;
  description: string;
  description_localized: Record<string, string>;
  cover_image_url: string | null;
  genre: StoryGenre;
  difficulty: ProficiencyLevel;
  target_language: TargetLanguage;
  chapters: Chapter[];
  characters: StoryCharacter[];
  estimated_duration_minutes: number;
  is_free: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type StoryGenre = 'workplace' | 'romance' | 'adventure' | 'historical' | 'daily_life';

export interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  title_localized: Record<string, string>;
  scene_description: string;
  scene_image_url: string | null;
  sort_order: number;
}

export interface StoryCharacter {
  character_id: string;
  role: 'main_npc' | 'supporting' | 'background';
}

// --- Character ---

export interface Character {
  id: string;
  name: string;
  name_localized: Record<string, string>;
  bio: string;
  bio_localized: Record<string, string>;
  avatar_url: string | null;
  portrait_url: string | null;
  personality_traits: string[];
  speaking_style: string;
  system_prompt: string;
  voice_id: string | null;
  is_mascot: boolean;
  created_at: string;
}

// --- Progress ---

export interface UserProgress {
  id: string;
  user_id: string;
  story_id: string;
  current_chapter_id: string | null;
  status: ProgressStatus;
  choices: StoryChoice[];
  started_at: string;
  last_played_at: string;
  completed_at: string | null;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface StoryChoice {
  chapter_id: string;
  choice_key: string;
  chosen_at: string;
}

// --- Vocabulary ---

export interface Vocabulary {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  context_sentence: string | null;
  context_translation: string | null;
  source_story_id: string | null;
  source_chapter_id: string | null;
  target_language: TargetLanguage;
  mastery_level: number; // 0-5
  next_review_at: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// --- Chat / Conversation ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  translation?: string;
  character_id?: string;
  timestamp: string;
  feedback?: MessageFeedback;
}

export interface MessageFeedback {
  type: 'encouragement' | 'word_correction' | 'grammar_correction' | 'pronunciation_tip';
  original: string;
  suggestion: string;
  explanation?: string;
}

export interface ConversationContext {
  story_id: string;
  chapter_id: string;
  character_id: string;
  scene_description: string;
  plot_summary: string;
  user_choices: StoryChoice[];
  vocabulary_focus: string[];
}

// --- Subscription ---

export interface Subscription {
  user_id: string;
  status: SubscriptionStatus;
  product_id: string | null;
  platform: 'ios' | 'android' | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'none';

// --- Onboarding ---

export interface OnboardingData {
  target_language: TargetLanguage;
  learning_goals: LearningGoal[];
  proficiency_level: ProficiencyLevel;
  learning_preferences: LearningPreference[];
  pain_points: LearningPainPoint[];
  preferred_genre: StoryGenre;
  display_name: string;
}

export type LearningPreference = 'speaking' | 'vocabulary' | 'listening' | 'reading' | 'grammar';

export type LearningPainPoint = 'boring' | 'cant_remember' | 'no_practice' | 'cant_persist' | 'no_context';
