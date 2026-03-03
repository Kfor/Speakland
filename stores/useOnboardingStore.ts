/**
 * Onboarding Store - Zustand store for onboarding flow state
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
  reset: () => void;
}

const initialData: OnboardingData = {};

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
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
  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));
