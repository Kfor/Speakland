/**
 * Type definition tests
 *
 * These tests verify that the type definitions compile correctly
 * and that the interfaces are structurally sound.
 */

import type {
  Story,
  Character,
  CharacterExpression,
  VoiceConfig,
  StorySegment,
  StoryBranch,
  BranchCondition,
  DialogueMessage,
  SmartAssistResult,
  StatePlotResult,
  GameState,
  WordEntry,
  VocabularyMatch,
  UserProfile,
  OnboardingData,
  LlmProxyRequest,
  LlmProxyResponse,
  StreamCallbacks,
} from '../types';

describe('Type definitions', () => {
  test('Story type has required fields', () => {
    const story: Story = {
      id: 'test-id',
      title: 'Test Story',
      localizedTitle: 'Test Story',
      description: 'A test story',
      backgroundImage: 'bg.png',
      difficulty: 2,
      targetLanguage: 'en',
      estimatedMinutes: 30,
      tags: ['test'],
      characterIds: ['char-1'],
      rootSegmentId: 'seg-1',
    };
    expect(story.id).toBe('test-id');
    expect(story.difficulty).toBe(2);
    expect(story.tags).toEqual(['test']);
  });

  test('Character type has required fields', () => {
    const character: Character = {
      id: 'char-1',
      name: 'Luna',
      localizedName: 'Luna',
      portraits: {
        neutral: 'n.png',
        happy: 'h.png',
        sad: 's.png',
        angry: 'a.png',
        surprised: 'su.png',
        thinking: 't.png',
      },
      voiceConfig: {
        provider: 'expo-speech',
        language: 'en-US',
      },
      personality: 'Friendly',
      speakingStyle: 'Warm',
      vocabulary: ['hello'],
      backstory: 'A cat sprite',
      targetLanguageUsage: 'Primary',
    };
    expect(character.name).toBe('Luna');
    expect(character.portraits.neutral).toBe('n.png');
  });

  test('BranchCondition discriminated union works', () => {
    const keyword: BranchCondition = { type: 'keyword', keywords: ['hello'] };
    const turnCount: BranchCondition = { type: 'turn_count', minTurns: 5 };
    const state: BranchCondition = { type: 'state', key: 'mood', value: 'happy' };
    const relationship: BranchCondition = { type: 'relationship', characterId: 'c1', minValue: 10 };
    const userChoice: BranchCondition = { type: 'user_choice', choiceId: 'choice-1' };

    expect(keyword.type).toBe('keyword');
    expect(turnCount.type).toBe('turn_count');
    expect(state.type).toBe('state');
    expect(relationship.type).toBe('relationship');
    expect(userChoice.type).toBe('user_choice');
  });

  test('DialogueMessage has correct structure', () => {
    const message: DialogueMessage = {
      id: 'msg-1',
      userId: 'user-1',
      storyId: 'story-1',
      segmentId: 'seg-1',
      speaker: 'character',
      content: 'Hello!',
      turnNumber: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(message.speaker).toBe('character');
  });

  test('GameState has correct defaults', () => {
    const state: GameState = {
      id: 'gs-1',
      userId: 'user-1',
      storyId: 'story-1',
      currentSegmentId: 'seg-1',
      completedSegmentIds: [],
      relationships: {},
      inventory: [],
      xp: 0,
      level: 1,
      wordsEncountered: 0,
      wordsLearned: 0,
      totalTurns: 0,
      sessionDuration: 0,
      startedAt: '2026-01-01T00:00:00Z',
      lastPlayedAt: '2026-01-01T00:00:00Z',
    };
    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
  });

  test('WordEntry has correct structure', () => {
    const word: WordEntry = {
      id: 'w-1',
      userId: 'user-1',
      word: 'hello',
      language: 'en',
      learned: false,
      addedAt: '2026-01-01T00:00:00Z',
    };
    expect(word.learned).toBe(false);
  });

  test('UserProfile has correct structure', () => {
    const profile: UserProfile = {
      id: 'user-1',
      displayName: 'Test User',
      isPremium: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(profile.isPremium).toBe(false);
  });

  test('OnboardingData supports partial data', () => {
    const partial: OnboardingData = {
      targetLanguage: 'en',
    };
    expect(partial.targetLanguage).toBe('en');
    expect(partial.nickname).toBeUndefined();
  });

  test('LlmProxyRequest has correct structure', () => {
    const request: LlmProxyRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    };
    expect(request.messages).toHaveLength(1);
    expect(request.stream).toBe(true);
  });

  test('LlmProxyResponse has correct structure', () => {
    const response: LlmProxyResponse = {
      id: 'resp-1',
      choices: [
        {
          message: { role: 'assistant', content: 'Hi!' },
          finish_reason: 'stop',
        },
      ],
    };
    expect(response.choices[0].message.content).toBe('Hi!');
  });
});
