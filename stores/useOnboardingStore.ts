/**
 * Onboarding Store - Zustand store for onboarding flow state
 *
 * DB sync: saveToDb(userId) persists onboarding data to user_profiles
 * once on completion.
 */

import { create } from 'zustand';
import type {
  OnboardingData,
  LearningLanguage,
  LearningGoal,
  LearningPain,
  DifficultyLevel,
  StoryPreference,
} from '../types/user';
import { saveOnboardingData } from '../lib/db';

interface OnboardingStoreState {
  /** Current step index in the onboarding flow */
  currentStep: number;
  /** Accumulated onboarding data */
  data: OnboardingData;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTargetLanguage: (lang: LearningLanguage) => void;
  setLearningGoals: (goals: LearningGoal[]) => void;
  setDifficultyLevel: (level: DifficultyLevel) => void;
  setLearningPains: (pains: LearningPain[]) => void;
  setStoryPreference: (pref: StoryPreference) => void;
  setNickname: (nickname: string) => void;
  saveToDb: (userId: string) => Promise<void>;
  reset: () => void;
}

const initialData: OnboardingData = {};

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  currentStep: 0,
  data: { ...initialData },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),
  setTargetLanguage: (lang) =>
    set((state) => ({ data: { ...state.data, targetLanguage: lang } })),
  setLearningGoals: (goals) =>
    set((state) => ({ data: { ...state.data, learningGoals: goals } })),
  setDifficultyLevel: (level) =>
    set((state) => ({ data: { ...state.data, difficultyLevel: level } })),
  setLearningPains: (pains) =>
    set((state) => ({ data: { ...state.data, learningPains: pains } })),
  setStoryPreference: (pref) =>
    set((state) => ({ data: { ...state.data, storyPreference: pref } })),
  setNickname: (nickname) =>
    set((state) => ({ data: { ...state.data, nickname } })),

  saveToDb: async (userId) => {
    const { data } = get();
    const withTimestamp = { ...data, completedAt: new Date().toISOString() };
    set({ data: withTimestamp });
    await saveOnboardingData(userId, withTimestamp);
  },

  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));
