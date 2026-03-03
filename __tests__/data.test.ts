/**
 * Story data integrity tests
 *
 * Verifies that all story data is properly structured:
 * - All stories have required fields
 * - All character IDs referenced in stories exist
 * - All segment IDs are valid and reference existing stories
 * - Root segment IDs point to existing segments
 * - Branch target segment IDs are valid
 * - Mascot character has all required fields
 */

import {
  allStories,
  allCharacters,
  allSegments,
  getStoryById,
  getCharactersForStory,
  getSegmentsForStory,
  getSegmentById,
  getCharacterById,
} from '../data/stories';
import { mascot } from '../data/characters/mascot';

describe('Story data integrity', () => {
  describe('allStories', () => {
    it('should contain at least one story', () => {
      expect(allStories.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unique story IDs', () => {
      const ids = allStories.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it.each(
      allStories.map((s) => [s.id, s])
    )('story "%s" should have all required fields', (_id, story) => {
      expect(story.id).toBeTruthy();
      expect(story.title).toBeTruthy();
      expect(story.localizedTitle).toBeTruthy();
      expect(story.description).toBeTruthy();
      expect(story.backgroundImage).toBeTruthy();
      expect(story.difficulty).toBeGreaterThanOrEqual(1);
      expect(story.difficulty).toBeLessThanOrEqual(5);
      expect(story.targetLanguage).toBeTruthy();
      expect(story.estimatedMinutes).toBeGreaterThan(0);
      expect(Array.isArray(story.tags)).toBe(true);
      expect(story.tags.length).toBeGreaterThan(0);
      expect(Array.isArray(story.characterIds)).toBe(true);
      expect(story.characterIds.length).toBeGreaterThan(0);
      expect(story.rootSegmentId).toBeTruthy();
    });

    it.each(
      allStories.map((s) => [s.id, s])
    )('story "%s" should have a valid rootSegmentId', (_id, story) => {
      const rootSegment = getSegmentById(story.rootSegmentId);
      expect(rootSegment).toBeDefined();
      expect(rootSegment?.storyId).toBe(story.id);
    });

    it.each(
      allStories.map((s) => [s.id, s])
    )('story "%s" should reference existing characters', (_id, story) => {
      for (const charId of story.characterIds) {
        const character = getCharacterById(charId);
        expect(character).toBeDefined();
      }
    });
  });

  describe('allCharacters', () => {
    it('should contain at least one character', () => {
      expect(allCharacters.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unique character IDs', () => {
      const ids = allCharacters.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it.each(
      allCharacters.map((c) => [c.id, c])
    )('character "%s" should have all required fields', (_id, character) => {
      expect(character.id).toBeTruthy();
      expect(character.name).toBeTruthy();
      expect(character.localizedName).toBeTruthy();
      expect(character.portraits).toBeDefined();
      expect(character.portraits.neutral).toBeTruthy();
      expect(character.portraits.happy).toBeTruthy();
      expect(character.portraits.sad).toBeTruthy();
      expect(character.portraits.angry).toBeTruthy();
      expect(character.portraits.surprised).toBeTruthy();
      expect(character.portraits.thinking).toBeTruthy();
      expect(character.voiceConfig).toBeDefined();
      expect(character.voiceConfig.provider).toBeTruthy();
      expect(character.voiceConfig.language).toBeTruthy();
      expect(character.personality).toBeTruthy();
      expect(character.speakingStyle).toBeTruthy();
      expect(Array.isArray(character.vocabulary)).toBe(true);
      expect(character.backstory).toBeTruthy();
      expect(character.targetLanguageUsage).toBeTruthy();
    });
  });

  describe('allSegments', () => {
    it('should contain at least one segment', () => {
      expect(allSegments.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unique segment IDs', () => {
      const ids = allSegments.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it.each(
      allSegments.map((s) => [s.id, s])
    )('segment "%s" should have all required fields', (_id, segment) => {
      expect(segment.id).toBeTruthy();
      expect(segment.storyId).toBeTruthy();
      expect(segment.title).toBeTruthy();
      expect(Array.isArray(segment.activeCharacterIds)).toBe(true);
      expect(segment.activeCharacterIds.length).toBeGreaterThan(0);
      expect(segment.systemPromptFragment).toBeTruthy();
      expect(Array.isArray(segment.branches)).toBe(true);
    });

    it.each(
      allSegments.map((s) => [s.id, s])
    )('segment "%s" should reference an existing story', (_id, segment) => {
      const story = getStoryById(segment.storyId);
      expect(story).toBeDefined();
    });

    it.each(
      allSegments.map((s) => [s.id, s])
    )('segment "%s" should reference existing characters', (_id, segment) => {
      for (const charId of segment.activeCharacterIds) {
        const character = getCharacterById(charId);
        expect(character).toBeDefined();
      }
    });

    it('should have valid branch target segment IDs', () => {
      for (const segment of allSegments) {
        for (const branch of segment.branches) {
          const targetSegment = getSegmentById(branch.targetSegmentId);
          expect(targetSegment).toBeDefined();
        }
      }
    });
  });

  describe('Lookup helpers', () => {
    it('getStoryById returns correct story', () => {
      const story = allStories[0];
      const found = getStoryById(story.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(story.id);
    });

    it('getStoryById returns undefined for unknown ID', () => {
      const found = getStoryById('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('getCharactersForStory returns correct characters', () => {
      const story = allStories[0];
      const chars = getCharactersForStory(story.id);
      expect(chars.length).toBe(story.characterIds.length);
      for (const char of chars) {
        expect(story.characterIds).toContain(char.id);
      }
    });

    it('getSegmentsForStory returns correct segments', () => {
      const story = allStories[0];
      const segs = getSegmentsForStory(story.id);
      expect(segs.length).toBeGreaterThan(0);
      for (const seg of segs) {
        expect(seg.storyId).toBe(story.id);
      }
    });

    it('getSegmentById returns correct segment', () => {
      const segment = allSegments[0];
      const found = getSegmentById(segment.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(segment.id);
    });

    it('getCharacterById returns correct character', () => {
      const character = allCharacters[0];
      const found = getCharacterById(character.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(character.id);
    });
  });

  describe('Mascot character', () => {
    it('should have all required fields', () => {
      expect(mascot.id).toBe('mascot');
      expect(mascot.name).toBeTruthy();
      expect(mascot.localizedName).toBeTruthy();
      expect(mascot.portraits).toBeDefined();
      expect(mascot.voiceConfig).toBeDefined();
      expect(mascot.personality).toBeTruthy();
      expect(mascot.speakingStyle).toBeTruthy();
      expect(mascot.backstory).toBeTruthy();
    });

    it('should have all expression portraits', () => {
      expect(mascot.portraits.neutral).toBeTruthy();
      expect(mascot.portraits.happy).toBeTruthy();
      expect(mascot.portraits.sad).toBeTruthy();
      expect(mascot.portraits.angry).toBeTruthy();
      expect(mascot.portraits.surprised).toBeTruthy();
      expect(mascot.portraits.thinking).toBeTruthy();
    });

    it('should not be included in allCharacters (story characters only)', () => {
      const found = allCharacters.find((c) => c.id === 'mascot');
      expect(found).toBeUndefined();
    });
  });
});
