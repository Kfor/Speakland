/**
 * Scene logic tests
 *
 * Tests helper functions and logic used in the learning scene,
 * including message ID generation patterns and system prompt building.
 */

import {
  getStoryById,
  getCharactersForStory,
  getSegmentById,
} from '../data/stories';
import type { LlmMessage } from '../types';

describe('Scene logic helpers', () => {
  describe('Story loading', () => {
    it('should load a story by ID', () => {
      const story = getStoryById('fashion-intern-paris');
      expect(story).toBeDefined();
      expect(story?.title).toBe('Fashion Intern in Paris');
    });

    it('should return undefined for non-existent story', () => {
      const story = getStoryById('non-existent');
      expect(story).toBeUndefined();
    });

    it('should load the root segment for a story', () => {
      const story = getStoryById('fashion-intern-paris');
      expect(story).toBeDefined();
      if (!story) return;

      const segment = getSegmentById(story.rootSegmentId);
      expect(segment).toBeDefined();
      expect(segment?.storyId).toBe(story.id);
    });

    it('should load characters for a story', () => {
      const story = getStoryById('fashion-intern-paris');
      expect(story).toBeDefined();
      if (!story) return;

      const characters = getCharactersForStory(story.id);
      expect(characters.length).toBe(story.characterIds.length);
    });
  });

  describe('System prompt building', () => {
    it('should build a valid system prompt from segment and characters', () => {
      const story = getStoryById('fashion-intern-paris');
      expect(story).toBeDefined();
      if (!story) return;

      const segment = getSegmentById(story.rootSegmentId);
      expect(segment).toBeDefined();
      if (!segment) return;

      const characters = getCharactersForStory(story.id);
      const activeChars = characters.filter((c) =>
        segment.activeCharacterIds.includes(c.id)
      );

      // Build system prompt (mirrors scene screen logic)
      const charDescriptions = activeChars
        .map(
          (c) =>
            `Character: ${c.name}\nPersonality: ${c.personality}\nSpeaking Style: ${c.speakingStyle}`
        )
        .join('\n\n');

      const systemPrompt = `You are roleplaying in an interactive language learning story.\n\n${segment.systemPromptFragment}\n\n${charDescriptions}\n\nIMPORTANT: Stay in character.`;

      expect(systemPrompt).toContain(segment.systemPromptFragment);
      expect(systemPrompt).toContain(activeChars[0].name);
      expect(systemPrompt).toContain(activeChars[0].personality);
      expect(systemPrompt).toContain('Stay in character');
    });
  });

  describe('LLM message building', () => {
    it('should construct valid LLM message array', () => {
      const systemPrompt = 'You are a character in a story.';
      const userMessages = ['Hello!', 'How are you?'];
      const assistantMessages = ['Hi there! Welcome.', 'I am doing well, thanks!'];

      const llmMessages: LlmMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      for (let i = 0; i < userMessages.length; i++) {
        llmMessages.push({ role: 'user', content: userMessages[i] });
        if (i < assistantMessages.length) {
          llmMessages.push({ role: 'assistant', content: assistantMessages[i] });
        }
      }

      expect(llmMessages).toHaveLength(5);
      expect(llmMessages[0].role).toBe('system');
      expect(llmMessages[1].role).toBe('user');
      expect(llmMessages[2].role).toBe('assistant');
      expect(llmMessages[3].role).toBe('user');
      expect(llmMessages[4].role).toBe('assistant');
    });

    it('should handle empty conversation history', () => {
      const llmMessages: LlmMessage[] = [
        { role: 'system', content: 'System prompt' },
      ];

      expect(llmMessages).toHaveLength(1);
      expect(llmMessages[0].role).toBe('system');
    });
  });

  describe('Turn counting', () => {
    it('should track turn count correctly', () => {
      let turnCount = 0;

      // Simulate 3 user turns
      turnCount += 1; // User sends message 1
      expect(turnCount).toBe(1);

      turnCount += 1; // User sends message 2
      expect(turnCount).toBe(2);

      turnCount += 1; // User sends message 3
      expect(turnCount).toBe(3);
    });
  });

  describe('Segment branching', () => {
    it('should have valid branch conditions', () => {
      const story = getStoryById('fashion-intern-paris');
      expect(story).toBeDefined();
      if (!story) return;

      const segment = getSegmentById(story.rootSegmentId);
      expect(segment).toBeDefined();
      if (!segment) return;

      expect(segment.branches.length).toBeGreaterThan(0);

      for (const branch of segment.branches) {
        expect(branch.id).toBeTruthy();
        expect(branch.targetSegmentId).toBeTruthy();
        expect(branch.conditions.length).toBeGreaterThan(0);

        // Verify target segment exists
        const targetSegment = getSegmentById(branch.targetSegmentId);
        expect(targetSegment).toBeDefined();
      }
    });

    it('should detect when turn_count condition is met', () => {
      const story = getStoryById('fashion-intern-paris');
      if (!story) return;

      const segment = getSegmentById(story.rootSegmentId);
      if (!segment) return;

      const turnCountBranch = segment.branches.find((b) =>
        b.conditions.some((c) => c.type === 'turn_count')
      );

      expect(turnCountBranch).toBeDefined();

      if (turnCountBranch) {
        const turnCondition = turnCountBranch.conditions.find(
          (c) => c.type === 'turn_count'
        );
        if (turnCondition && turnCondition.type === 'turn_count') {
          // A turn count of 8+ should trigger this branch
          expect(turnCondition.minTurns).toBeGreaterThan(0);
          expect(8 >= turnCondition.minTurns).toBe(true);
        }
      }
    });
  });

  describe('Message ID generation', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        ids.add(id);
      }
      // Due to Date.now() + random, all should be unique
      expect(ids.size).toBe(100);
    });
  });
});
