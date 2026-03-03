/**
 * User & onboarding type definitions
 */

export type LearningLanguage = 'en' | 'es';

export type LearningGoal =
  | 'business'
  | 'exam'
  | 'communication'
  | 'travel'
  | 'entertainment';

export type LearningPain =
  | 'cant_remember_words'
  | 'boring'
  | 'cant_persist'
  | 'no_practice_partner'
  | 'poor_pronunciation';

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate';

export type StoryPreference =
  | 'career_woman'
  | 'celebrity_romance'
  | 'medieval_adventure'
  | 'mystery'
  | 'other';

export interface OnboardingData {
  targetLanguage?: LearningLanguage;
  learningGoals?: LearningGoal[];
  difficultyLevel?: DifficultyLevel;
  learningTypes?: string[];
  learningPains?: LearningPain[];
  storyPreference?: StoryPreference;
  nickname?: string;
  completedAt?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  onboardingData?: OnboardingData;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}
