/**
 * Stories Index - Exports all stories, characters, and segments
 */

import {
  story as fashionInternStory,
  characters as fashionInternCharacters,
  segments as fashionInternSegments,
} from './fashion-intern';

import {
  story as summerBeachStory,
  characters as summerBeachCharacters,
  segments as summerBeachSegments,
} from './summer-beach';

import {
  story as wastelandSurvivorStory,
  characters as wastelandSurvivorCharacters,
  segments as wastelandSurvivorSegments,
} from './wasteland-survivor';

import type { Story, Character, StorySegment } from '../../types';

// ---------------------------------------------------------------------------
// Aggregated exports
// ---------------------------------------------------------------------------

/** All available stories */
export const allStories: Story[] = [
  fashionInternStory,
  summerBeachStory,
  wastelandSurvivorStory,
];

/** All characters across all stories */
export const allCharacters: Character[] = [
  ...fashionInternCharacters,
  ...summerBeachCharacters,
  ...wastelandSurvivorCharacters,
];

/** All segments across all stories */
export const allSegments: StorySegment[] = [
  ...fashionInternSegments,
  ...summerBeachSegments,
  ...wastelandSurvivorSegments,
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get a story by its ID */
export function getStoryById(id: string): Story | undefined {
  return allStories.find((s) => s.id === id);
}

/** Get all characters for a given story */
export function getCharactersForStory(storyId: string): Character[] {
  const story = getStoryById(storyId);
  if (!story) return [];
  return allCharacters.filter((c) => story.characterIds.includes(c.id));
}

/** Get all segments for a given story */
export function getSegmentsForStory(storyId: string): StorySegment[] {
  return allSegments.filter((s) => s.storyId === storyId);
}

/** Get a segment by its ID */
export function getSegmentById(id: string): StorySegment | undefined {
  return allSegments.find((s) => s.id === id);
}

/** Get a character by their ID */
export function getCharacterById(id: string): Character | undefined {
  return allCharacters.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Individual story exports
// ---------------------------------------------------------------------------

export {
  fashionInternStory,
  fashionInternCharacters,
  fashionInternSegments,
  summerBeachStory,
  summerBeachCharacters,
  summerBeachSegments,
  wastelandSurvivorStory,
  wastelandSurvivorCharacters,
  wastelandSurvivorSegments,
};
