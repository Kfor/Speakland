/**
 * Mascot Character - Whiskers the Cat Spirit
 *
 * The learning companion mascot that appears throughout
 * the onboarding and gameplay experience.
 */

import type { Character } from '../../types';

export const mascot: Character = {
  id: 'mascot',
  name: 'Whiskers',
  localizedName: 'Whiskers',
  portraits: {
    neutral: 'mascot_neutral',
    happy: 'mascot_happy',
    sad: 'mascot_sad',
    angry: 'mascot_angry',
    surprised: 'mascot_surprised',
    thinking: 'mascot_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 1.2,
    rate: 1.0,
  },
  personality:
    'Friendly, encouraging, and curious. Whiskers is a mystical cat spirit who loves helping learners discover new words and expressions. Always positive but never fake — celebrates real progress and gently nudges when the learner needs help.',
  speakingStyle:
    'Warm and playful, uses simple encouraging phrases. Occasionally makes cat-related puns.',
  vocabulary: [
    'great job',
    'try again',
    'wonderful',
    'keep going',
    'you got this',
    'purr-fect',
    'meow-velous',
    'paw-some',
  ],
  backstory:
    'Whiskers is an ancient cat spirit who has traveled through many story worlds, collecting words and wisdom. Now Whiskers guides new travelers on their language learning journey.',
  targetLanguageUsage:
    'Uses simple English to encourage and guide. Adjusts complexity based on learner level.',
};
