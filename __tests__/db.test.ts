/**
 * lib/db.ts unit tests
 *
 * Uses a fully mocked Supabase client to verify all 10 CRUD functions,
 * camelCase/snake_case helpers, and error handling behavior.
 */

// ---------------------------------------------------------------------------
// Mock setup — must come before any import that touches lib/supabase
// ---------------------------------------------------------------------------

/** Build a fresh chainable query builder for each test */
function createChainableBuilder(terminal: jest.Mock) {
  const builder: Record<string, jest.Mock> = {};

  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'single',
    'order',
  ];

  for (const name of methods) {
    builder[name] = jest.fn().mockImplementation(() => builder);
  }

  // The terminal mock is the last call in the chain that resolves the promise.
  // We override it so tests can mockResolvedValueOnce.
  builder._terminal = terminal;

  return builder;
}

let mockTerminal: jest.Mock;
let qb: Record<string, jest.Mock>;
let mockFromFn: jest.Mock;

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFromFn(...args),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocking)
// ---------------------------------------------------------------------------

import {
  camelToSnake,
  snakeToCamel,
  toSnakeCase,
  toCamelCase,
  loadProfile,
  saveOnboardingData,
  loadGameStates,
  upsertGameState,
  loadWords,
  addWord,
  removeWord,
  markWordLearned,
  loadDialogue,
  saveDialogueMessage,
} from '../lib/db';

// ---------------------------------------------------------------------------
// Before each: fresh query builder
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockTerminal = jest.fn();
  qb = createChainableBuilder(mockTerminal);
  mockFromFn = jest.fn().mockReturnValue(qb);
});

// ===========================================================================
// camelCase / snake_case helpers
// ===========================================================================

describe('camelToSnake', () => {
  test('converts camelCase to snake_case', () => {
    expect(camelToSnake('currentSegmentId')).toBe('current_segment_id');
    expect(camelToSnake('isPremium')).toBe('is_premium');
    expect(camelToSnake('id')).toBe('id');
    expect(camelToSnake('xp')).toBe('xp');
  });
});

describe('snakeToCamel', () => {
  test('converts snake_case to camelCase', () => {
    expect(snakeToCamel('current_segment_id')).toBe('currentSegmentId');
    expect(snakeToCamel('is_premium')).toBe('isPremium');
    expect(snakeToCamel('id')).toBe('id');
  });
});

describe('toSnakeCase', () => {
  test('maps object keys from camelCase to snake_case', () => {
    const input = { userId: '1', storyId: '2', wordsLearned: 5 };
    const output = toSnakeCase(input);
    expect(output).toEqual({ user_id: '1', story_id: '2', words_learned: 5 });
  });
});

describe('toCamelCase', () => {
  test('maps object keys from snake_case to camelCase', () => {
    const input = { user_id: '1', story_id: '2', words_learned: 5 };
    const output = toCamelCase(input);
    expect(output).toEqual({ userId: '1', storyId: '2', wordsLearned: 5 });
  });
});

// ===========================================================================
// 1. loadProfile
// ===========================================================================

describe('loadProfile', () => {
  test('returns profile mapped to camelCase on success', async () => {
    const dbRow = {
      id: 'u1',
      display_name: 'Alice',
      avatar_url: null,
      onboarding_data: {},
      is_premium: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    // .from('user_profiles').select('*').eq('id', userId).single()
    qb.single.mockResolvedValueOnce({ data: dbRow, error: null });

    const result = await loadProfile('u1');

    expect(mockFromFn).toHaveBeenCalledWith('user_profiles');
    expect(qb.select).toHaveBeenCalledWith('*');
    expect(qb.eq).toHaveBeenCalledWith('id', 'u1');
    expect(qb.single).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: 'u1',
      displayName: 'Alice',
      avatarUrl: null,
      onboardingData: {},
      isPremium: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  test('returns error when Supabase returns error', async () => {
    qb.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const result = await loadProfile('bad-id');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Not found');
  });

  test('catches thrown exceptions', async () => {
    qb.single.mockRejectedValueOnce(new Error('Network error'));

    const result = await loadProfile('u1');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Network error');
  });
});

// ===========================================================================
// 2. saveOnboardingData
// ===========================================================================

describe('saveOnboardingData', () => {
  test('calls update with onboarding_data on user_profiles', async () => {
    // .from('user_profiles').update({}).eq('id', userId) — eq is the terminal
    qb.eq.mockResolvedValueOnce({ data: null, error: null });

    const onboardingData = { targetLanguage: 'en' as const, nickname: 'Bob' };
    const result = await saveOnboardingData('u1', onboardingData);

    expect(mockFromFn).toHaveBeenCalledWith('user_profiles');
    expect(qb.update).toHaveBeenCalledWith({
      onboarding_data: onboardingData,
    });
    expect(qb.eq).toHaveBeenCalledWith('id', 'u1');
    expect(result.error).toBeNull();
  });

  test('returns error on failure', async () => {
    qb.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'Update failed' },
    });

    const result = await saveOnboardingData('u1', {});

    expect(result.error).toBe('Update failed');
  });
});

// ===========================================================================
// 3. loadGameStates
// ===========================================================================

describe('loadGameStates', () => {
  test('returns array of game states mapped to camelCase', async () => {
    const rows = [
      {
        id: 'gs1',
        user_id: 'u1',
        story_id: 's1',
        current_segment_id: 'seg1',
        completed_segment_ids: [],
        relationships: {},
        inventory: [],
        xp: 10,
        level: 1,
        words_encountered: 0,
        words_learned: 0,
        total_turns: 0,
        session_duration: 0,
        started_at: '2026-01-01T00:00:00Z',
        last_played_at: '2026-01-01T00:00:00Z',
      },
    ];
    qb.eq.mockResolvedValueOnce({ data: rows, error: null });

    const result = await loadGameStates('u1');

    expect(mockFromFn).toHaveBeenCalledWith('game_states');
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].currentSegmentId).toBe('seg1');
    expect(result.data![0].wordsLearned).toBe(0);
  });

  test('returns empty array when no data', async () => {
    qb.eq.mockResolvedValueOnce({ data: [], error: null });

    const result = await loadGameStates('u1');
    expect(result.data).toEqual([]);
  });

  test('returns error on failure', async () => {
    qb.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error' },
    });

    const result = await loadGameStates('u1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('DB error');
  });
});

// ===========================================================================
// 4. upsertGameState
// ===========================================================================

describe('upsertGameState', () => {
  test('upserts with onConflict user_id,story_id and returns camelCase', async () => {
    const dbRow = {
      id: 'gs1',
      user_id: 'u1',
      story_id: 's1',
      current_segment_id: 'seg1',
      completed_segment_ids: [],
      relationships: {},
      inventory: [],
      xp: 20,
      level: 2,
      words_encountered: 5,
      words_learned: 3,
      total_turns: 10,
      session_duration: 600,
      started_at: '2026-01-01T00:00:00Z',
      last_played_at: '2026-01-02T00:00:00Z',
    };
    qb.single.mockResolvedValueOnce({ data: dbRow, error: null });

    const state = {
      userId: 'u1',
      storyId: 's1',
      currentSegmentId: 'seg1',
      completedSegmentIds: [] as string[],
      relationships: {},
      inventory: [] as string[],
      xp: 20,
      level: 2,
      wordsEncountered: 5,
      wordsLearned: 3,
      totalTurns: 10,
      sessionDuration: 600,
      startedAt: '2026-01-01T00:00:00Z',
      lastPlayedAt: '2026-01-02T00:00:00Z',
    };

    const result = await upsertGameState('u1', state);

    expect(mockFromFn).toHaveBeenCalledWith('game_states');
    expect(qb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', story_id: 's1' }),
      { onConflict: 'user_id,story_id' },
    );
    expect(result.error).toBeNull();
    expect(result.data!.xp).toBe(20);
    expect(result.data!.level).toBe(2);
  });

  test('does not include id in upserted row', async () => {
    qb.single.mockResolvedValueOnce({
      data: { id: 'gs1', user_id: 'u1', story_id: 's1' },
      error: null,
    });

    await upsertGameState('u1', {
      userId: 'u1',
      storyId: 's1',
      currentSegmentId: '',
      completedSegmentIds: [],
      relationships: {},
      inventory: [],
      xp: 0,
      level: 1,
      wordsEncountered: 0,
      wordsLearned: 0,
      totalTurns: 0,
      sessionDuration: 0,
      startedAt: '',
      lastPlayedAt: '',
    });

    const upsertArg = qb.upsert.mock.calls[0][0];
    expect(upsertArg).not.toHaveProperty('id');
  });

  test('returns error on upsert failure', async () => {
    qb.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Conflict' },
    });

    const result = await upsertGameState('u1', {
      userId: 'u1',
      storyId: 's1',
      currentSegmentId: 'seg1',
      completedSegmentIds: [],
      relationships: {},
      inventory: [],
      xp: 0,
      level: 1,
      wordsEncountered: 0,
      wordsLearned: 0,
      totalTurns: 0,
      sessionDuration: 0,
      startedAt: '',
      lastPlayedAt: '',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe('Conflict');
  });
});

// ===========================================================================
// 5. loadWords
// ===========================================================================

describe('loadWords', () => {
  test('returns array of words mapped to camelCase', async () => {
    const rows = [
      {
        id: 'w1',
        user_id: 'u1',
        word: 'hello',
        language: 'en',
        translation: 'hola',
        context_sentence: 'Hello world',
        learned: false,
        learned_at: null,
        added_at: '2026-01-01T00:00:00Z',
      },
    ];
    qb.eq.mockResolvedValueOnce({ data: rows, error: null });

    const result = await loadWords('u1');

    expect(mockFromFn).toHaveBeenCalledWith('user_word_books');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].contextSentence).toBe('Hello world');
    expect(result.data![0].addedAt).toBe('2026-01-01T00:00:00Z');
  });
});

// ===========================================================================
// 6. addWord
// ===========================================================================

describe('addWord', () => {
  test('upserts with onConflict user_id,word,language', async () => {
    const dbRow = {
      id: 'w1',
      user_id: 'u1',
      word: 'hello',
      language: 'en',
      translation: 'hola',
      context_sentence: null,
      learned: false,
      learned_at: null,
      added_at: '2026-01-01T00:00:00Z',
    };
    qb.single.mockResolvedValueOnce({ data: dbRow, error: null });

    const word = {
      userId: 'u1',
      word: 'hello',
      language: 'en',
      translation: 'hola',
      learned: false,
      addedAt: '2026-01-01T00:00:00Z',
    };

    const result = await addWord('u1', word);

    expect(mockFromFn).toHaveBeenCalledWith('user_word_books');
    expect(qb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', word: 'hello', language: 'en' }),
      { onConflict: 'user_id,word,language' },
    );
    expect(result.error).toBeNull();
    expect(result.data!.word).toBe('hello');
  });
});

// ===========================================================================
// 7. removeWord
// ===========================================================================

describe('removeWord', () => {
  test('deletes by id and user_id', async () => {
    // chain: .from().delete().eq('id',...).eq('user_id',...)
    // The last eq resolves the promise
    qb.eq.mockReturnValueOnce(qb); // first eq returns builder
    qb.eq.mockResolvedValueOnce({ data: null, error: null }); // second eq resolves

    const result = await removeWord('u1', 'w1');

    expect(mockFromFn).toHaveBeenCalledWith('user_word_books');
    expect(qb.delete).toHaveBeenCalled();
    expect(qb.eq).toHaveBeenCalledWith('id', 'w1');
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result.error).toBeNull();
  });

  test('returns error on failure', async () => {
    qb.eq.mockReturnValueOnce(qb);
    qb.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'Delete failed' },
    });

    const result = await removeWord('u1', 'w1');
    expect(result.error).toBe('Delete failed');
  });
});

// ===========================================================================
// 8. markWordLearned
// ===========================================================================

describe('markWordLearned', () => {
  test('updates learned and learned_at', async () => {
    // chain: .from().update({}).eq('id',...).eq('user_id',...)
    qb.eq.mockReturnValueOnce(qb);
    qb.eq.mockResolvedValueOnce({ data: null, error: null });

    const result = await markWordLearned('u1', 'w1');

    expect(mockFromFn).toHaveBeenCalledWith('user_word_books');
    expect(qb.update).toHaveBeenCalledWith(
      expect.objectContaining({ learned: true, learned_at: expect.any(String) }),
    );
    expect(qb.eq).toHaveBeenCalledWith('id', 'w1');
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result.error).toBeNull();
  });
});

// ===========================================================================
// 9. loadDialogue
// ===========================================================================

describe('loadDialogue', () => {
  test('loads dialogue messages ordered by turn_number', async () => {
    const rows = [
      {
        id: 'd1',
        user_id: 'u1',
        story_id: 's1',
        segment_id: 'seg1',
        speaker: 'user',
        content: 'Hello',
        translation: null,
        expression: null,
        turn_number: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
    ];
    qb.order.mockResolvedValueOnce({ data: rows, error: null });

    const result = await loadDialogue('u1', 's1', 'seg1');

    expect(mockFromFn).toHaveBeenCalledWith('dialogue_history');
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(qb.eq).toHaveBeenCalledWith('story_id', 's1');
    expect(qb.eq).toHaveBeenCalledWith('segment_id', 'seg1');
    expect(qb.order).toHaveBeenCalledWith('turn_number', {
      ascending: true,
    });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].turnNumber).toBe(1);
    expect(result.data![0].createdAt).toBe('2026-01-01T00:00:00Z');
  });

  test('returns error on failure', async () => {
    qb.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'Query failed' },
    });

    const result = await loadDialogue('u1', 's1', 'seg1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Query failed');
  });
});

// ===========================================================================
// 10. saveDialogueMessage
// ===========================================================================

describe('saveDialogueMessage', () => {
  test('inserts a dialogue message and returns camelCase', async () => {
    const dbRow = {
      id: 'd1',
      user_id: 'u1',
      story_id: 's1',
      segment_id: 'seg1',
      speaker: 'character',
      content: 'Bonjour!',
      translation: 'Hello!',
      expression: 'happy',
      turn_number: 2,
      created_at: '2026-01-01T00:00:01Z',
    };
    qb.single.mockResolvedValueOnce({ data: dbRow, error: null });

    const msg = {
      userId: 'u1',
      storyId: 's1',
      segmentId: 'seg1',
      speaker: 'character' as const,
      content: 'Bonjour!',
      translation: 'Hello!',
      expression: 'happy' as const,
      turnNumber: 2,
      createdAt: '2026-01-01T00:00:01Z',
    };

    const result = await saveDialogueMessage('u1', msg);

    expect(mockFromFn).toHaveBeenCalledWith('dialogue_history');
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        story_id: 's1',
        segment_id: 'seg1',
        speaker: 'character',
        content: 'Bonjour!',
      }),
    );
    expect(result.error).toBeNull();
    expect(result.data!.turnNumber).toBe(2);
    expect(result.data!.expression).toBe('happy');
  });

  test('returns error on insert failure', async () => {
    qb.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insert failed' },
    });

    const msg = {
      userId: 'u1',
      storyId: 's1',
      segmentId: 'seg1',
      speaker: 'user' as const,
      content: 'Hi',
      turnNumber: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };

    const result = await saveDialogueMessage('u1', msg);
    expect(result.data).toBeNull();
    expect(result.error).toBe('Insert failed');
  });

  test('catches thrown exceptions', async () => {
    qb.single.mockRejectedValueOnce(new Error('Unexpected'));

    const msg = {
      userId: 'u1',
      storyId: 's1',
      segmentId: 'seg1',
      speaker: 'user' as const,
      content: 'Hi',
      turnNumber: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };

    const result = await saveDialogueMessage('u1', msg);
    expect(result.data).toBeNull();
    expect(result.error).toBe('Unexpected');
  });
});

// ===========================================================================
// Fire-and-forget safety: functions never throw
// ===========================================================================

describe('fire-and-forget safety', () => {
  test('loadProfile never throws even on unexpected errors', async () => {
    qb.single.mockRejectedValueOnce(new Error('crash'));
    const result = await loadProfile('u1');
    expect(result.error).toBe('crash');
  });

  test('saveOnboardingData never throws', async () => {
    qb.eq.mockRejectedValueOnce(new Error('crash'));
    const result = await saveOnboardingData('u1', {});
    expect(result.error).toBe('crash');
  });

  test('loadGameStates never throws', async () => {
    qb.eq.mockRejectedValueOnce(new Error('crash'));
    const result = await loadGameStates('u1');
    expect(result.error).toBe('crash');
  });

  test('upsertGameState never throws', async () => {
    qb.single.mockRejectedValueOnce(new Error('crash'));
    const result = await upsertGameState('u1', {
      userId: 'u1',
      storyId: 's1',
      currentSegmentId: '',
      completedSegmentIds: [],
      relationships: {},
      inventory: [],
      xp: 0,
      level: 1,
      wordsEncountered: 0,
      wordsLearned: 0,
      totalTurns: 0,
      sessionDuration: 0,
      startedAt: '',
      lastPlayedAt: '',
    });
    expect(result.error).toBe('crash');
  });

  test('loadWords never throws', async () => {
    qb.eq.mockRejectedValueOnce(new Error('crash'));
    const result = await loadWords('u1');
    expect(result.error).toBe('crash');
  });

  test('addWord never throws', async () => {
    qb.single.mockRejectedValueOnce(new Error('crash'));
    const result = await addWord('u1', {
      userId: 'u1',
      word: 'x',
      language: 'en',
      learned: false,
      addedAt: '',
    });
    expect(result.error).toBe('crash');
  });

  test('removeWord never throws', async () => {
    qb.eq.mockReturnValueOnce(qb);
    qb.eq.mockRejectedValueOnce(new Error('crash'));
    const result = await removeWord('u1', 'w1');
    expect(result.error).toBe('crash');
  });

  test('markWordLearned never throws', async () => {
    qb.eq.mockReturnValueOnce(qb);
    qb.eq.mockRejectedValueOnce(new Error('crash'));
    const result = await markWordLearned('u1', 'w1');
    expect(result.error).toBe('crash');
  });

  test('loadDialogue never throws', async () => {
    qb.order.mockRejectedValueOnce(new Error('crash'));
    const result = await loadDialogue('u1', 's1', 'seg1');
    expect(result.error).toBe('crash');
  });

  test('saveDialogueMessage never throws', async () => {
    qb.single.mockRejectedValueOnce(new Error('crash'));
    const result = await saveDialogueMessage('u1', {
      userId: 'u1',
      storyId: 's1',
      segmentId: 'seg1',
      speaker: 'user',
      content: '',
      turnNumber: 1,
      createdAt: '',
    });
    expect(result.error).toBe('crash');
  });
});
