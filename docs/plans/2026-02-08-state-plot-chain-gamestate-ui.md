# State & Plot Chain + GameState UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the state & plot LLM call chain (async, per-turn) and GameState frontend UI—so users see relationship changes, item pickups, XP/level-ups, and narrative transitions as gamified feedback during RPG learning sessions.

**Architecture:** Extend the existing SceneContext reducer with GameState fields (relationships, inventory, xp, level). A new `statePlotService.ts` fires async after each chat turn, returns structured `StatePlotResult` (stateChanges + branchTriggered + narrative), which the reducer validates and applies. A `GameStateBar` component sits between dialogue area and input area, with animations using React Native `Animated` API. Supabase `game_states` table persists state via optimistic updates.

**Tech Stack:** React Native Animated API, Context + useReducer (existing pattern), Supabase JS client, TypeScript

---

### Task 1: Add GameState Types

**Files:**
- Modify: `speakland/types/scene.ts`

**Step 1: Add GameState and StatePlotResult type definitions to scene.ts**

Add after the existing `WordPopupData` interface (end of file):

```typescript
/**
 * XP thresholds for level calculation
 */
export const XP_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500] as const;

/**
 * A single state change suggested by the LLM
 */
export interface StateChange {
  type: 'relationship' | 'inventory' | 'xp';
  /** characterId for relationship, itemId for inventory, ignored for xp */
  target: string;
  /** Numeric delta for relationship/xp, 1 for inventory add, -1 for remove */
  delta: number;
  /** Human-readable reason for UI display */
  reason: string;
}

/**
 * Branch trigger signal from the LLM
 */
export interface BranchTrigger {
  branchId: string;
  /** 0-1 confidence score */
  confidence: number;
  reason: string;
}

/**
 * Result from the state & plot LLM chain
 */
export interface StatePlotResult {
  stateChanges: StateChange[];
  branchTriggered: BranchTrigger | null;
  /** Narrative text for scene transitions */
  narrative: string | null;
}

/**
 * An item in the player's inventory
 */
export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  acquiredAt: number;
}

/**
 * Game state tracking relationships, inventory, xp, and level
 */
export interface GameState {
  relationships: Record<string, number>;
  inventory: InventoryItem[];
  xp: number;
  level: number;
}

/**
 * A state change event for animation display
 */
export interface StateChangeEvent {
  id: string;
  type: 'relationship' | 'inventory' | 'xp' | 'level_up';
  value: number | string;
  reason: string;
  timestamp: number;
}
```

**Step 2: Commit**

```bash
git add speakland/types/scene.ts
git commit -m "feat(T1770481429709): add GameState and StatePlotResult types"
```

---

### Task 2: Create statePlotService

**Files:**
- Create: `speakland/services/statePlotService.ts`

**Step 1: Create the state & plot LLM service**

```typescript
/**
 * State & Plot LLM Service
 * Async chain that evaluates game state changes and branch triggers after each chat turn.
 * Runs in parallel with chat—failures are silently ignored.
 */

import { DialogueMessage, GameState, StatePlotResult, StateChange, BranchTrigger } from '../types/scene';

interface StatePlotContext {
  dialogueHistory: DialogueMessage[];
  gameState: GameState;
  currentCharacterId: string;
  /** Branch conditions from current story segment, if any */
  branches?: Array<{ id: string; condition: string }>;
}

/**
 * Build the system prompt for state & plot evaluation
 */
function buildStatePlotPrompt(ctx: StatePlotContext): string {
  const recentDialogue = ctx.dialogueHistory.slice(-10);
  const dialogueText = recentDialogue
    .map(m => `${m.speaker === 'user' ? 'User' : 'Character'}: ${m.text}`)
    .join('\n');

  const branchesText = ctx.branches?.length
    ? `\nAvailable branches:\n${ctx.branches.map(b => `- ${b.id}: ${b.condition}`).join('\n')}`
    : '';

  return `You are a game state evaluator for an RPG language learning app.

Given the recent dialogue and current game state, determine:
1. State changes (relationship, inventory, xp) based on the conversation
2. Whether a story branch should be triggered
3. Optional narrative text for scene transitions

Current game state:
- Relationships: ${JSON.stringify(ctx.gameState.relationships)}
- Inventory: ${ctx.gameState.inventory.map(i => i.name).join(', ') || 'empty'}
- XP: ${ctx.gameState.xp}, Level: ${ctx.gameState.level}
- Current character: ${ctx.currentCharacterId}
${branchesText}

Recent dialogue:
${dialogueText}

Respond with ONLY valid JSON matching this schema:
{
  "stateChanges": [{ "type": "relationship"|"inventory"|"xp", "target": "string", "delta": number, "reason": "string" }],
  "branchTriggered": { "branchId": "string", "confidence": 0-1, "reason": "string" } | null,
  "narrative": "string" | null
}

Rules:
- relationship delta: -20 to +20 per change
- xp delta: 5 to 30 per change
- Only suggest inventory items that make sense in context
- Only trigger branches if very confident (>0.7)
- Keep reasons concise (under 30 chars), in the user's language (Chinese)`;
}

/**
 * Parse and validate the LLM response into a StatePlotResult
 */
function parseStatePlotResponse(raw: string): StatePlotResult | null {
  try {
    // Extract JSON from possible markdown code blocks
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const stateChanges: StateChange[] = (parsed.stateChanges || [])
      .filter((sc: any) =>
        ['relationship', 'inventory', 'xp'].includes(sc.type) &&
        typeof sc.target === 'string' &&
        typeof sc.delta === 'number' &&
        typeof sc.reason === 'string'
      )
      .map((sc: any) => ({
        type: sc.type,
        target: sc.target,
        delta: sc.type === 'relationship'
          ? Math.max(-20, Math.min(20, Math.round(sc.delta)))
          : sc.type === 'xp'
            ? Math.max(0, Math.min(30, Math.round(sc.delta)))
            : sc.delta > 0 ? 1 : -1,
        reason: String(sc.reason).slice(0, 50),
      }));

    let branchTriggered: BranchTrigger | null = null;
    if (parsed.branchTriggered && typeof parsed.branchTriggered.branchId === 'string') {
      branchTriggered = {
        branchId: parsed.branchTriggered.branchId,
        confidence: Math.max(0, Math.min(1, Number(parsed.branchTriggered.confidence) || 0)),
        reason: String(parsed.branchTriggered.reason || '').slice(0, 100),
      };
    }

    return {
      stateChanges,
      branchTriggered,
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative : null,
    };
  } catch {
    return null;
  }
}

/**
 * Evaluate state and plot changes for the current dialogue turn.
 * This is called async after each chat turn—failures return null (silent degradation).
 */
export async function evaluateStatePlot(ctx: StatePlotContext): Promise<StatePlotResult | null> {
  const apiEndpoint = process.env.EXPO_PUBLIC_LLM_API_ENDPOINT;
  const apiKey = process.env.EXPO_PUBLIC_LLM_API_KEY;

  // Mock mode when API not configured
  if (!apiEndpoint || !apiKey) {
    return generateMockStatePlotResult(ctx);
  }

  try {
    const prompt = buildStatePlotPrompt(ctx);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.EXPO_PUBLIC_LLM_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Evaluate the state changes based on the dialogue above.' },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseStatePlotResponse(content);
  } catch {
    return null;
  }
}

/**
 * Mock state/plot evaluation for development without API
 */
function generateMockStatePlotResult(ctx: StatePlotContext): StatePlotResult {
  const lastUserMsg = [...ctx.dialogueHistory].reverse().find(m => m.speaker === 'user');
  const changes: StateChange[] = [];

  // Always give small XP for participating
  changes.push({
    type: 'xp',
    target: '',
    delta: 10,
    reason: '积极参与对话',
  });

  // Random relationship boost
  if (Math.random() > 0.4) {
    changes.push({
      type: 'relationship',
      target: ctx.currentCharacterId,
      delta: Math.floor(Math.random() * 10) + 1,
      reason: '愉快的对话',
    });
  }

  // Rare item pickup
  if (Math.random() > 0.85) {
    changes.push({
      type: 'inventory',
      target: `item_${Date.now()}`,
      delta: 1,
      reason: '获得新道具',
    });
  }

  return {
    stateChanges: changes,
    branchTriggered: null,
    narrative: null,
  };
}
```

**Step 2: Commit**

```bash
git add speakland/services/statePlotService.ts
git commit -m "feat(T1770481429709): create statePlotService with mock fallback"
```

---

### Task 3: Extend SceneContext with GameState Reducer

**Files:**
- Modify: `speakland/types/scene.ts` (add gameState to SceneState)
- Modify: `speakland/contexts/SceneContext.tsx`

**Step 1: Add gameState field to SceneState in types/scene.ts**

In `SceneState` interface, add after `error: string | null`:

```typescript
  /** Game state for RPG mechanics */
  gameState: GameState;
  /** Recent state change events for animation */
  stateChangeEvents: StateChangeEvent[];
```

**Step 2: Add new reducer actions and game state logic to SceneContext.tsx**

Add new action types to `SceneAction`:

```typescript
  | { type: 'APPLY_STATE_CHANGES'; payload: { changes: StateChange[]; events: StateChangeEvent[] } }
  | { type: 'REMOVE_STATE_CHANGE_EVENT'; payload: string }
  | { type: 'ADD_NARRATIVE'; payload: string }
```

Update `initialState` to include:

```typescript
  gameState: {
    relationships: {},
    inventory: [],
    xp: 0,
    level: 1,
  },
  stateChangeEvents: [],
```

Add reducer cases:

```typescript
    case 'APPLY_STATE_CHANGES': {
      let gs = { ...state.gameState };

      for (const change of action.payload.changes) {
        switch (change.type) {
          case 'relationship': {
            const current = gs.relationships[change.target] || 0;
            gs.relationships = {
              ...gs.relationships,
              [change.target]: Math.max(-100, Math.min(100, current + change.delta)),
            };
            break;
          }
          case 'xp': {
            gs.xp = Math.max(0, gs.xp + change.delta);
            // Recalculate level from XP_LEVEL_THRESHOLDS
            let newLevel = 1;
            for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
              if (gs.xp >= XP_LEVEL_THRESHOLDS[i]) {
                newLevel = i + 1;
                break;
              }
            }
            gs.level = newLevel;
            break;
          }
          case 'inventory': {
            if (change.delta > 0) {
              // Add item if not already present
              if (!gs.inventory.some(i => i.id === change.target)) {
                gs.inventory = [...gs.inventory, {
                  id: change.target,
                  name: change.reason,
                  icon: '🎁',
                  acquiredAt: Date.now(),
                }];
              }
            } else {
              gs.inventory = gs.inventory.filter(i => i.id !== change.target);
            }
            break;
          }
        }
      }

      return {
        ...state,
        gameState: gs,
        stateChangeEvents: [...state.stateChangeEvents, ...action.payload.events],
      };
    }

    case 'REMOVE_STATE_CHANGE_EVENT':
      return {
        ...state,
        stateChangeEvents: state.stateChangeEvents.filter(e => e.id !== action.payload),
      };

    case 'ADD_NARRATIVE': {
      const narrativeMsg: DialogueMessage = {
        id: `narrative_${Date.now()}`,
        speaker: 'narrator',
        text: action.payload,
        timestamp: Date.now(),
        isNarrative: true,
      };
      return {
        ...state,
        dialogueHistory: [...state.dialogueHistory, narrativeMsg],
      };
    }
```

**Step 3: Wire statePlotService into sendMessage**

In the `sendMessage` function, after the `generateDialogue` call succeeds and before TTS playback, add an async fire-and-forget call:

```typescript
      // Fire state & plot evaluation async (non-blocking)
      evaluateStatePlot({
        dialogueHistory: [...state.dialogueHistory, userMessage, dialogueMessage],
        gameState: state.gameState,
        currentCharacterId: state.currentCharacter.id,
      }).then(result => {
        if (!result) return;

        // Build state change events for animation
        const events: StateChangeEvent[] = result.stateChanges.map(sc => ({
          id: `sce_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: sc.type,
          value: sc.type === 'inventory' ? sc.reason : sc.delta,
          reason: sc.reason,
          timestamp: Date.now(),
        }));

        // Check for level up
        let newXp = state.gameState.xp;
        for (const sc of result.stateChanges) {
          if (sc.type === 'xp') newXp += sc.delta;
        }
        let newLevel = 1;
        for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
          if (newXp >= XP_LEVEL_THRESHOLDS[i]) { newLevel = i + 1; break; }
        }
        if (newLevel > state.gameState.level) {
          events.push({
            id: `sce_levelup_${Date.now()}`,
            type: 'level_up',
            value: newLevel,
            reason: `Level ${newLevel}!`,
            timestamp: Date.now(),
          });
        }

        if (result.stateChanges.length > 0) {
          dispatch({ type: 'APPLY_STATE_CHANGES', payload: { changes: result.stateChanges, events } });
        }

        if (result.narrative) {
          dispatch({ type: 'ADD_NARRATIVE', payload: result.narrative });
        }

        // Persist to Supabase async
        persistGameState(state.gameState);
      }).catch(() => { /* silent degradation */ });
```

**Step 4: Add Supabase persistence helper**

Add a helper function inside `SceneProvider`:

```typescript
  const persistGameState = useCallback(async (gs: GameState) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      await supabase.from('game_states').upsert({
        user_id: userId,
        relationships: gs.relationships,
        inventory: gs.inventory,
        xp: gs.xp,
        level: gs.level,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch {
      // Silent fail—local state preserved
    }
  }, []);
```

**Step 5: Expose gameState and stateChangeEvents in context value**

Add to `SceneContextType` interface:

```typescript
  /** Remove a state change event (after animation completes) */
  removeStateChangeEvent: (id: string) => void;
```

Add implementation and include in provider value.

**Step 6: Commit**

```bash
git add speakland/types/scene.ts speakland/contexts/SceneContext.tsx
git commit -m "feat(T1770481429709): extend SceneContext with GameState reducer + statePlot integration"
```

---

### Task 4: Create Supabase Migration for game_states

**Files:**
- Create: `supabase/migrations/20260208000001_game_states.sql`

**Step 1: Write the migration**

```sql
-- Game states table for RPG mechanics persistence
create table if not exists public.game_states (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  relationships jsonb default '{}'::jsonb not null,
  inventory jsonb default '[]'::jsonb not null,
  xp integer default 0 not null,
  level integer default 1 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index
create index if not exists idx_game_states_user_id on public.game_states(user_id);

-- RLS
alter table public.game_states enable row level security;

create policy "Users can view their own game state"
  on public.game_states for select
  using (auth.uid() = user_id);

create policy "Users can insert their own game state"
  on public.game_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own game state"
  on public.game_states for update
  using (auth.uid() = user_id);

-- Auto-update timestamp
create trigger on_game_states_updated
  before update on public.game_states
  for each row execute function public.handle_updated_at();
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260208000001_game_states.sql
git commit -m "feat(T1770481429709): add game_states Supabase migration"
```

---

### Task 5: Create GameStateBar Component

**Files:**
- Create: `speakland/components/scene/GameStateBar.tsx`

**Step 1: Build the GameStateBar component**

This component sits between DialogueArea and ChatInput. Layout: left = relationship heart + value, center = recent items (up to 3), right = level + XP bar.

```typescript
/**
 * GameStateBar - Shows relationship, inventory, and level/XP
 * Positioned between dialogue area and input area
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState } from '../../types/scene';

interface GameStateBarProps {
  gameState: GameState;
  currentCharacterId: string | null;
}

function calculateXpProgress(xp: number, level: number): number {
  const { XP_LEVEL_THRESHOLDS } = require('../../types/scene');
  const currentThreshold = XP_LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = XP_LEVEL_THRESHOLDS[level] || currentThreshold + 100;
  const progress = (xp - currentThreshold) / (nextThreshold - currentThreshold);
  return Math.max(0, Math.min(1, progress));
}

export function GameStateBar({ gameState, currentCharacterId }: GameStateBarProps) {
  const relationship = currentCharacterId
    ? (gameState.relationships[currentCharacterId] || 0)
    : 0;
  const recentItems = gameState.inventory.slice(-3);
  const xpProgress = calculateXpProgress(gameState.xp, gameState.level);

  return (
    <View style={styles.container}>
      {/* Left: Relationship */}
      <View style={styles.section}>
        <Text style={styles.heartIcon}>❤️</Text>
        <Text style={styles.relationshipValue}>{relationship}</Text>
      </View>

      {/* Center: Recent Items */}
      <View style={styles.itemsSection}>
        {recentItems.map(item => (
          <Text key={item.id} style={styles.itemIcon}>{item.icon}</Text>
        ))}
        {recentItems.length === 0 && (
          <Text style={styles.emptyItems}>—</Text>
        )}
      </View>

      {/* Right: Level + XP */}
      <View style={styles.section}>
        <Text style={styles.levelText}>Lv.{gameState.level}</Text>
        <View style={styles.xpBarOuter}>
          <View style={[styles.xpBarInner, { width: `${xpProgress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartIcon: {
    fontSize: 16,
  },
  relationshipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  itemsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 18,
  },
  emptyItems: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
    marginRight: 6,
  },
  xpBarOuter: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarInner: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
});
```

**Step 2: Commit**

```bash
git add speakland/components/scene/GameStateBar.tsx
git commit -m "feat(T1770481429709): create GameStateBar component"
```

---

### Task 6: Create StateChangeAnimations Component

**Files:**
- Create: `speakland/components/scene/StateChangeAnimations.tsx`

**Step 1: Build the floating animation component**

Handles: relationship floaty text (+5 ❤️), item fly-in, level-up flash.

```typescript
/**
 * StateChangeAnimations - Floating text and effects for state changes
 * Renders above the GameStateBar area
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { StateChangeEvent } from '../../types/scene';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StateChangeAnimationsProps {
  events: StateChangeEvent[];
  onEventComplete: (id: string) => void;
}

function FloatingText({ event, onComplete }: { event: StateChangeEvent; onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(onComplete);
  }, []);

  const getText = () => {
    switch (event.type) {
      case 'relationship': {
        const delta = event.value as number;
        return `${delta > 0 ? '+' : ''}${delta} ❤️`;
      }
      case 'xp': {
        const delta = event.value as number;
        return `+${delta} XP`;
      }
      case 'inventory':
        return `🎁 ${event.reason}`;
      case 'level_up':
        return `⬆️ Level Up!`;
      default:
        return '';
    }
  };

  const getColor = () => {
    switch (event.type) {
      case 'relationship': return '#FF6B8A';
      case 'xp': return '#FFD700';
      case 'inventory': return '#7BE495';
      case 'level_up': return '#FFD700';
      default: return '#fff';
    }
  };

  return (
    <Animated.View style={[styles.floatingText, { opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.floatingTextContent, { color: getColor() }]}>
        {getText()}
      </Text>
      {event.type !== 'level_up' && (
        <Text style={styles.floatingReason}>{event.reason}</Text>
      )}
    </Animated.View>
  );
}

function LevelUpFlash({ onComplete }: { onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.View style={[styles.levelUpFlash, { opacity }]}>
      <Text style={styles.levelUpText}>Level Up!</Text>
    </Animated.View>
  );
}

export function StateChangeAnimations({ events, onEventComplete }: StateChangeAnimationsProps) {
  const levelUpEvent = events.find(e => e.type === 'level_up');
  const otherEvents = events.filter(e => e.type !== 'level_up');

  return (
    <>
      {/* Level up full-screen flash */}
      {levelUpEvent && (
        <LevelUpFlash onComplete={() => onEventComplete(levelUpEvent.id)} />
      )}

      {/* Floating text events */}
      <View style={styles.container} pointerEvents="none">
        {otherEvents.map(event => (
          <FloatingText
            key={event.id}
            event={event}
            onComplete={() => onEventComplete(event.id)}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
    zIndex: 500,
  },
  floatingText: {
    alignItems: 'center',
    marginBottom: 4,
  },
  floatingTextContent: {
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingReason: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelUpFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  levelUpText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
```

**Step 2: Commit**

```bash
git add speakland/components/scene/StateChangeAnimations.tsx
git commit -m "feat(T1770481429709): create StateChangeAnimations with floating text + level-up flash"
```

---

### Task 7: Integrate GameState UI into Scene Screen

**Files:**
- Modify: `speakland/app/scene/[id].tsx`

**Step 1: Import new components and wire into the scene layout**

Add imports:

```typescript
import { GameStateBar } from '../../components/scene/GameStateBar';
import { StateChangeAnimations } from '../../components/scene/StateChangeAnimations';
```

Destructure from useScene:

```typescript
  const {
    state,
    loadStory,
    sendMessage,
    playDialogue,
    stopDialogue,
    toggleTranslation,
    removeFeedback,
    removeStateChangeEvent,
    resetScene,
  } = useScene();
```

Add GameStateBar between the dialogue area and input area, and StateChangeAnimations as a floating layer:

```tsx
        {/* Main content area */}
        <View style={styles.content}>
          {/* Character portrait area */}
          <View style={styles.portraitArea}>
            <CharacterPortrait ... />
          </View>

          {/* Dialogue area */}
          <View style={styles.dialogueArea}>
            <DialogueArea ... />
          </View>

          {/* Game State Bar */}
          <GameStateBar
            gameState={state.gameState}
            currentCharacterId={state.currentCharacter?.id ?? null}
          />
        </View>

        {/* State change animations (floating) */}
        <StateChangeAnimations
          events={state.stateChangeEvents}
          onEventComplete={removeStateChangeEvent}
        />

        {/* Chat input area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom }]}>
          ...
        </View>
```

**Step 2: Support narrative messages in DialogueArea**

The existing `DialogueArea` component needs to handle `isNarrative` messages. When `state.currentDialogue?.isNarrative === true`, render with centered italic style instead of character bubble.

Check existing DialogueArea for `isNarrative` support—if not present, add a conditional render:

In `DialogueArea.tsx`, add a check: if `dialogue?.isNarrative`, render as:

```tsx
  <View style={narrativeStyles.container}>
    <Text style={narrativeStyles.text}>{dialogue.text}</Text>
  </View>
```

With styles:
```typescript
const narrativeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  text: {
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
```

**Step 3: Commit**

```bash
git add speakland/app/scene/[id].tsx speakland/components/scene/DialogueArea.tsx
git commit -m "feat(T1770481429709): integrate GameStateBar and animations into scene screen"
```

---

### Task 8: Run TypeScript Check and Fix Issues

**Step 1: Run the TypeScript compiler**

Run: `cd speakland && npx tsc --noEmit`

**Step 2: Fix any type errors discovered**

Address import paths, missing exports, type mismatches.

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix(T1770481429709): resolve TypeScript errors from GameState integration"
```

---

### Task 9: Final Verification and Cleanup

**Step 1: Run TypeScript check again**

Run: `cd speakland && npx tsc --noEmit`
Expected: No errors

**Step 2: Verify all acceptance criteria are met**

1. ✅ statePlotService fires async after each chat turn
2. ✅ GameState updated with relationship/inventory/xp via reducer validation
3. ✅ GameStateBar shows relationship/items/level in scene
4. ✅ StateChangeAnimations provides floating text + level-up flash
5. ✅ Narrative messages display as centered italic text
6. ✅ Supabase game_states migration + persistence
7. ✅ Silent degradation on failures

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "feat(T1770481429709): state & plot chain + GameState UI complete"
```
