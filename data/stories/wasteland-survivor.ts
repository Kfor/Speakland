/**
 * Story 03: Wasteland Survivor
 *
 * Inspired by Fallout. A post-apocalyptic survival story where
 * the player emerges from a vault and must navigate trading,
 * diplomacy, and conflict in the wasteland.
 *
 * Difficulty: 2-3 (Elementary to Intermediate)
 * Target Language: English
 */

import type { Story, Character, StorySegment } from '../../types';

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

const harlow: Character = {
  id: 'harlow',
  name: 'Harlow',
  localizedName: 'Harlow',
  portraits: {
    neutral: 'character_harlow_neutral',
    happy: 'character_harlow_happy',
    sad: 'character_harlow_sad',
    angry: 'character_harlow_angry',
    surprised: 'character_harlow_surprised',
    thinking: 'character_harlow_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 0.9,
    rate: 0.95,
  },
  personality:
    'Pragmatic wasteland trader with dark humor. Doesn\'t trust easily but honors deals. Has seen everything the wasteland has to offer and carries the weight of past losses.',
  speakingStyle:
    'Direct, concise, with post-apocalyptic slang (smooth-skin, caps, rad). Short powerful sentences.',
  vocabulary: [
    'rule one: trust no one', 'not my problem', 'you learn fast',
    'caps', 'trade', 'deal', 'survive', 'wasteland', 'scavenge',
  ],
  backstory:
    'Harlow lost her own settlement years ago because the leader hoarded resources instead of sharing them. She became a solo trader to avoid ever depending on a community again — until you come along.',
  targetLanguageUsage:
    'Uses survival and trading vocabulary. Intermediate-level sentence structures with imperative and conditional forms.',
};

const warden: Character = {
  id: 'warden',
  name: 'Warden',
  localizedName: 'Warden',
  portraits: {
    neutral: 'character_warden_neutral',
    happy: 'character_warden_happy',
    sad: 'character_warden_sad',
    angry: 'character_warden_angry',
    surprised: 'character_warden_surprised',
    thinking: 'character_warden_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 0.85,
    rate: 0.85,
  },
  personality:
    'Authoritative settlement leader and former military. Believes control is the only path to survival. Hides vault technology to maintain power. Not evil — genuinely fears losing his people.',
  speakingStyle:
    'Formal, military-inflected. Uses terms like copy that, perimeter, intel. Structured and commanding but evasive on certain topics.',
  vocabulary: [
    'the community comes first', 'copy that', 'perimeter', 'intel',
    'security', 'protocol', 'authorization', 'threat level',
  ],
  backstory:
    'Warden lost a previous settlement to raiders because he wasn\'t authoritarian enough. The trauma drove him to absolute control over Oasis Station, including secretly stockpiling vault technology as a last resort.',
  targetLanguageUsage:
    'Uses formal and military vocabulary, contrasting with Harlow\'s colloquial style for register awareness.',
};

const sparks: Character = {
  id: 'sparks',
  name: 'Sparks',
  localizedName: 'Sparks',
  portraits: {
    neutral: 'character_sparks_neutral',
    happy: 'character_sparks_happy',
    sad: 'character_sparks_sad',
    angry: 'character_sparks_angry',
    surprised: 'character_sparks_surprised',
    thinking: 'character_sparks_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 1.15,
    rate: 1.15,
  },
  personality:
    'Enthusiastic young engineer and medic. Obsessed with pre-war technology. The most optimistic person in the settlement, hiding deep fear of the wasteland under excitement.',
  speakingStyle:
    'Excited, fast-paced when talking about tech. Naturally explains jargon ("The capacitor — that\'s the part that stores electricity — is fried").',
  vocabulary: [
    'oh oh oh, you know what this means', 'technically yes, practically we might die',
    'pre-war manual', 'circuit', 'generator', 'radiation', 'capacitor',
  ],
  backstory:
    'Sparks grew up in the wasteland but found hope in old-world technology manuals. He\'s the first to discover Warden\'s secret vault technology stash.',
  targetLanguageUsage:
    'Uses technical vocabulary with built-in explanations, serving as a natural i+1 teacher for learners.',
};

export const characters: Character[] = [harlow, warden, sparks];

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

export const story: Story = {
  id: 'wasteland-survivor',
  title: 'Wasteland Survivor',
  localizedTitle: 'Wasteland Survivor',
  description:
    'Emerge from Vault 111 into a post-apocalyptic wasteland. Trade, negotiate, and fight to protect a fragile settlement from raiders and its own leader\'s secrets.',
  backgroundImage: 'bg_wasteland',
  difficulty: 3,
  targetLanguage: 'en',
  estimatedMinutes: 130,
  tags: ['adventure', 'survival', 'post-apocalyptic', 'choices'],
  characterIds: ['harlow', 'warden', 'sparks'],
  rootSegmentId: 'ws-seg-01',
};

// ---------------------------------------------------------------------------
// Segments (MVP: 4 segments)
// ---------------------------------------------------------------------------

export const segments: StorySegment[] = [
  // ---- Segment 1: Vault Door Opens ----
  {
    id: 'ws-seg-01',
    storyId: 'wasteland-survivor',
    title: 'Vault Door Opens',
    activeCharacterIds: ['harlow'],
    narrativeIntro:
      'The vault door groans open — a sound that hasn\'t been heard in two hundred years. Sunlight hits your face like a fist. When your eyes adjust, the world outside is nothing like the training videos promised. Crumbled highways. Cars rusted down to skeletons. A sky that\'s the wrong shade of orange. And a woman in a dusty leather jacket, leaning against a dead tree with a rifle slung over her shoulder. She watches you stumble out and says nothing for a long moment. Then: "Well. You\'re either very brave or very stupid."',
    systemPromptFragment:
      'You are Harlow, a wasteland trader. You spotted the Vault door opening and waited — vault dwellers sometimes carry valuable pre-war tech. Assess this newcomer: ask blunt questions about who they are, what they know about the outside world, and what they\'re carrying. Be sarcastic but not hostile. Test their awareness — if they seem clueless about radiation, raiders, or basic survival, show disbelief ("You don\'t know what a radroach is? Seriously?"). If they show backbone or curiosity, warm up slightly. Use intermediate English with post-apocalyptic slang. End by offering a deal: you\'ll show them the ropes if they share anything useful from the Vault.',
    suggestedTopics: [
      'Introduce yourself to Harlow',
      'Ask about the outside world',
      'Learn survival basics',
      'Negotiate a deal with Harlow',
      'Ask why the Vault opened',
    ],
    branches: [
      {
        id: 'ws-branch-01a',
        targetSegmentId: 'ws-seg-02',
        conditions: [
          { type: 'relationship', characterId: 'harlow', minValue: 5 },
          { type: 'turn_count', minTurns: 6 },
        ],
        hint: 'Harlow respects your grit and agrees to travel together.',
      },
      {
        id: 'ws-branch-01b',
        targetSegmentId: 'ws-seg-02',
        conditions: [{ type: 'turn_count', minTurns: 10 }],
        hint: 'Harlow needs a travel companion through the danger zone regardless.',
      },
    ],
    minTurns: 5,
    maxTurns: 12,
  },

  // ---- Segment 2: Walking the Wasteland ----
  {
    id: 'ws-seg-02',
    storyId: 'wasteland-survivor',
    title: 'Walking the Wasteland',
    activeCharacterIds: ['harlow'],
    narrativeIntro:
      'The gunfire fades behind you. Harlow picks up the pace. "That wasn\'t for us. But it could\'ve been." She pulls out a battered canteen. "Lesson one, vault kid. Water. Clean water is worth more than gold, more than ammo, more than whatever fancy tech you\'ve got under that jumpsuit. Rule is simple: if it glows, don\'t drink it. If it doesn\'t glow, check twice."',
    systemPromptFragment:
      'You are Harlow, walking through the wasteland with a vault dweller. Teach survival fundamentals: clean water vs. irradiated water, reading danger signs (radiation symbols, territorial markings from raiders), the barter economy (bottle caps as currency), and what creatures to avoid. Be a practical teacher — use if/then structures naturally ("If you see scratches on a door, then something big lives there"). Quiz the learner: "What would you do if...?" React bluntly to naive answers. Show a tiny crack in your armor — mention that you "used to travel with someone" but don\'t elaborate. Use imperative and conditional sentence structures.',
    suggestedTopics: [
      'Learn about water safety',
      'Ask about the barter economy',
      'Learn to read danger signs',
      'Ask who Harlow used to travel with',
      'Practice survival scenarios',
    ],
    branches: [
      {
        id: 'ws-branch-02',
        targetSegmentId: 'ws-seg-03',
        conditions: [{ type: 'turn_count', minTurns: 8 }],
        hint: 'Lights appear on the horizon — a settlement.',
      },
    ],
    minTurns: 6,
    maxTurns: 12,
  },

  // ---- Segment 3: First Sight of Oasis ----
  {
    id: 'ws-seg-03',
    storyId: 'wasteland-survivor',
    title: 'First Sight of Oasis',
    activeCharacterIds: ['harlow'],
    narrativeIntro:
      'From the hilltop, you see it: lights. Real, electric lights, not campfires. A cluster of buildings surrounded by walls made from shipping containers and car frames. Watchtowers with searchlights sweep the perimeter. "Oasis Station," Harlow says, and there\'s something complicated in her voice. "Fifty-some people. Clean water. Actual walls. The closest thing to civilization for a hundred miles." She doesn\'t move toward it.',
    systemPromptFragment:
      'You are Harlow, looking down at Oasis Station with the vault dweller. Explain the settlement: how it works, who runs it, why it matters. Warn about Warden — he\'s the leader, an ex-military man who controls everything. Describe the social dynamics: people are safe but not free. Mention that you\'ve heard rumors about raiders getting bolder. Ask the vault dweller what they think — do they want to try entering? Coach them on how to present themselves (don\'t mention Vault tech too eagerly, don\'t challenge authority on day one). Drop a casual remark about a "locked room in the basement that nobody talks about." Use descriptive vocabulary for the settlement and social/political terms for power dynamics.',
    suggestedTopics: [
      'Ask about Oasis Station',
      'Learn about Warden',
      'Discuss the raider threat',
      'Plan how to enter the settlement',
      'Ask about the locked room',
    ],
    branches: [
      {
        id: 'ws-branch-03',
        targetSegmentId: 'ws-seg-04',
        conditions: [{ type: 'turn_count', minTurns: 7 }],
        hint: 'You head down toward the gates of Oasis Station.',
      },
    ],
    minTurns: 5,
    maxTurns: 10,
  },

  // ---- Segment 4: The Gates of Oasis ----
  {
    id: 'ws-seg-04',
    storyId: 'wasteland-survivor',
    title: 'The Gates of Oasis',
    activeCharacterIds: ['warden', 'sparks'],
    narrativeIntro:
      'The gates of Oasis Station grind open just enough for two guards to step through. Behind them, a broad-shouldered man in a military vest crosses his arms. "I\'m Warden. I run this place." His eyes move from Harlow to you. "A vault dweller." It\'s not a question. Before he can say more, wounded patrol members are carried through the gate — blood, shouting, chaos. A young man with goggles rushes to help them. "Ironjaw hit the water station again!" he yells. Warden\'s jaw tightens.',
    systemPromptFragment:
      'You are alternating between Warden and Sparks. WARDEN: Be authoritative and suspicious of the vault dweller. The raider attack on the water station is an emergency. Reluctantly allow the outsiders in only because of the crisis, but make it clear: "One wrong move and you\'re out." Use military vocabulary and formal sentence structures. SPARKS: Be frantic but friendly. You need help fixing the water purifier — it was damaged in the attack. If the vault dweller offers to help or shows any technical knowledge, get excited: "Oh oh oh, you know what this means? Vault education! They actually teach you useful stuff in there?" Use technical vocabulary with built-in explanations.',
    suggestedTopics: [
      'Introduce yourself to Warden',
      'Offer to help with the emergency',
      'Talk to Sparks about the water purifier',
      'Ask about the raider attack',
      'Negotiate entry to Oasis Station',
    ],
    branches: [
      {
        id: 'ws-branch-04a',
        targetSegmentId: 'ws-seg-01',
        conditions: [
          { type: 'keyword', keywords: ['help', 'fix', 'repair', 'purifier', 'water'] },
          { type: 'turn_count', minTurns: 6 },
        ],
        hint: 'Your willingness to help earns you a place in Oasis — for now.',
      },
      {
        id: 'ws-branch-04b',
        targetSegmentId: 'ws-seg-01',
        conditions: [{ type: 'turn_count', minTurns: 10 }],
        hint: 'The crisis forces Warden to accept your presence.',
      },
    ],
    minTurns: 6,
    maxTurns: 14,
  },
];
