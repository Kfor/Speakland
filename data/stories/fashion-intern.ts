/**
 * Story 01: Fashion Intern in Paris
 *
 * Inspired by Emily in Paris. Workplace drama at a fashion magazine
 * where the player (intern) must prove their value amid rivalry
 * and a looming fashion show crisis.
 *
 * Difficulty: 1-2 (Beginner to Elementary)
 * Target Language: English
 */

import type { Story, Character, StorySegment } from '../../types';

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

const claireDubois: Character = {
  id: 'claire_dubois',
  name: 'Claire Dubois',
  localizedName: 'Claire Dubois',
  portraits: {
    neutral: 'character_claire_neutral',
    happy: 'character_claire_happy',
    sad: 'character_claire_sad',
    angry: 'character_claire_angry',
    surprised: 'character_claire_surprised',
    thinking: 'character_claire_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 0.95,
    rate: 0.9,
  },
  personality:
    'Outwardly cold and exacting senior fashion editor. Deeply passionate about the industry but guards herself after a past betrayal. Tests newcomers relentlessly, but softens toward those who show genuine dedication.',
  speakingStyle:
    'Formal and precise. Occasionally drops French phrases (tres bien, c\'est la vie). Never wastes words.',
  vocabulary: [
    'deadline', 'layout', 'collection', 'runway', 'aesthetic',
    'editorial', 'portfolio', 'concept', 'detail', 'standard',
  ],
  backstory:
    'Claire was once betrayed by her closest colleague — Nadia\'s mother — who stole her designs and took credit. This made Claire distrustful of newcomers, but she still believes in mentoring genuine talent.',
  targetLanguageUsage:
    'Uses precise mid-level workplace vocabulary. Keeps sentences clear but professional.',
};

const nadiaMarchetti: Character = {
  id: 'nadia_marchetti',
  name: 'Nadia Marchetti',
  localizedName: 'Nadia Marchetti',
  portraits: {
    neutral: 'character_nadia_neutral',
    happy: 'character_nadia_happy',
    sad: 'character_nadia_sad',
    angry: 'character_nadia_angry',
    surprised: 'character_nadia_surprised',
    thinking: 'character_nadia_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 1.1,
    rate: 1.0,
  },
  personality:
    'Elegant and charming on the surface, secretly threatened by competition. From a fashion dynasty family, she interns to prove she\'s more than her last name. Uses sophisticated vocabulary as a power play.',
  speakingStyle:
    'Sweet with hidden sarcasm. Favors elevated vocabulary to assert superiority.',
  vocabulary: [
    'charming', 'exquisite', 'sophisticated', 'between us',
    'opportunity', 'impression', 'exclusive', 'heritage',
  ],
  backstory:
    'Nadia\'s mother was Claire\'s former partner who betrayed her. Nadia doesn\'t know the full story and genuinely wants to succeed on her own merits, though her methods are underhanded.',
  targetLanguageUsage:
    'Uses slightly advanced vocabulary, creating a gentle comprehension challenge for learners.',
};

const leoChen: Character = {
  id: 'leo_chen',
  name: 'Leo Chen',
  localizedName: 'Leo Chen',
  portraits: {
    neutral: 'character_leo_neutral',
    happy: 'character_leo_happy',
    sad: 'character_leo_sad',
    angry: 'character_leo_angry',
    surprised: 'character_leo_surprised',
    thinking: 'character_leo_thinking',
  },
  voiceConfig: {
    provider: 'expo-speech',
    language: 'en-US',
    pitch: 1.0,
    rate: 1.05,
  },
  personality:
    'Easygoing freelance photographer with sharp observational skills. Genuinely friendly and supportive. Seems carefree but notices everything.',
  speakingStyle:
    'Casual and conversational. Uses slang, contractions, and informal expressions.',
  vocabulary: [
    'trust me', 'here\'s the thing', 'you owe me coffee',
    'no worries', 'basically', 'legit', 'vibe', 'shots',
  ],
  backstory:
    'Leo has his own history of failure in the fashion world — a gallery show that flopped. He channels his energy into supporting others rather than chasing his own spotlight.',
  targetLanguageUsage:
    'Uses colloquial English and slang, contrasting with Claire\'s formality to expose learners to register differences.',
};

export const characters: Character[] = [claireDubois, nadiaMarchetti, leoChen];

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

export const story: Story = {
  id: 'fashion-intern-paris',
  title: 'Fashion Intern in Paris',
  localizedTitle: 'Fashion Intern in Paris',
  description:
    'You\'re a brand-new intern at Chic Magazine in Paris. Prove your worth amid office politics, a scheming rival, and a high-stakes fashion show crisis.',
  backgroundImage: 'bg_fashion_intern',
  difficulty: 2,
  targetLanguage: 'en',
  estimatedMinutes: 120,
  tags: ['workplace', 'drama', 'fashion', 'rivalry'],
  characterIds: ['claire_dubois', 'nadia_marchetti', 'leo_chen'],
  rootSegmentId: 'fi-seg-01',
};

// ---------------------------------------------------------------------------
// Segments (MVP: 4 segments)
// ---------------------------------------------------------------------------

export const segments: StorySegment[] = [
  // ---- Segment 1: The Lobby ----
  {
    id: 'fi-seg-01',
    storyId: 'fashion-intern-paris',
    title: 'The Lobby',
    activeCharacterIds: ['claire_dubois'],
    narrativeIntro:
      'You push through the glass doors of Chic Magazine headquarters, dragging a suitcase that\'s seen better days. The lobby is all marble and glass — intimidatingly elegant. A receptionist with perfect posture looks you up and down. "You must be the new intern. Ms. Dubois is on the 12th floor. She doesn\'t like waiting."',
    systemPromptFragment:
      'You are Claire Dubois. A new intern has just arrived at your office — late by 3 minutes. You\'re reviewing layouts at your desk. Be professional but distant. Your first instinct is to test them: ask about their background, why they chose fashion, what they know about Chic Magazine. Don\'t smile easily. If they show genuine passion (not just rehearsed answers), soften slightly. Drop one cryptic remark about the industry: "In this industry, everyone wears a mask. The question is whether you can find who\'s real." Keep language clear, use fashion vocabulary naturally.',
    suggestedTopics: [
      'Introduce yourself to Claire',
      'Explain why you love fashion',
      'Ask about your responsibilities',
      'Comment on the impressive office',
    ],
    branches: [
      {
        id: 'fi-branch-01',
        targetSegmentId: 'fi-seg-02',
        conditions: [{ type: 'turn_count', minTurns: 8 }],
        hint: 'The conversation flows naturally to meeting other people in the office.',
      },
    ],
    minTurns: 8,
    maxTurns: 12,
  },

  // ---- Segment 2: Meeting the Rival ----
  {
    id: 'fi-seg-02',
    storyId: 'fashion-intern-paris',
    title: 'Meeting the Rival',
    activeCharacterIds: ['nadia_marchetti', 'leo_chen'],
    narrativeIntro:
      'The office door swings open and a woman in an impeccably tailored blazer steps in — Nadia Marchetti. Claire\'s expression shifts almost imperceptibly. Then a guy with a camera slung around his neck pops his head in: "Hey! New face! I\'m Leo — the unofficial welcome committee."',
    systemPromptFragment:
      'You are alternating between two characters. NADIA: Greet the new intern with charm that has an edge. Use phrases like "Oh, how charming" and "You\'re so brave to try that." Mention your family\'s fashion background casually. LEO: Be warm, casual, and encouraging. Use slang and informal English. Offer to show the intern around. Create a natural contrast between Nadia\'s polished sweetness and Leo\'s genuine friendliness. Both characters should ask the intern about themselves.',
    suggestedTopics: [
      'Get to know Nadia',
      'Chat with Leo about photography',
      'Ask about office culture',
      'Learn about the upcoming fashion show',
    ],
    branches: [
      {
        id: 'fi-branch-02',
        targetSegmentId: 'fi-seg-03',
        conditions: [{ type: 'turn_count', minTurns: 8 }],
        hint: 'Claire announces a competitive opportunity that changes everything.',
      },
    ],
    minTurns: 8,
    maxTurns: 12,
  },

  // ---- Segment 3: The Competition ----
  {
    id: 'fi-seg-03',
    storyId: 'fashion-intern-paris',
    title: 'The Competition',
    activeCharacterIds: ['claire_dubois', 'nadia_marchetti', 'leo_chen'],
    narrativeIntro:
      'Claire calls both interns to the conference room. The walls are covered with mood boards and fabric swatches. She stands at the head of the table, arms crossed. "This Friday, Chic Magazine hosts its annual showcase. I need one intern to assist me. One." She looks between you and Nadia. "Prove to me you deserve it."',
    systemPromptFragment:
      'You are Claire, announcing that only one intern will assist at the fashion show this Friday. Be firm and fair — lay out what you expect: creativity, attention to detail, professionalism. Assign a first test: each intern must bring you a mood board concept by tomorrow morning. If the player asks questions, answer directly. Nadia should interject with confident remarks. Leo (if addressed) gives quiet encouragement. This is the catalyst — raise tension but keep it professional.',
    suggestedTopics: [
      'Ask Claire what she expects in the mood board',
      'Discuss your creative ideas',
      'React to the competition with Nadia',
      'Seek advice from Leo',
    ],
    branches: [
      {
        id: 'fi-branch-03a',
        targetSegmentId: 'fi-seg-04',
        conditions: [
          { type: 'keyword', keywords: ['mood board', 'idea', 'concept', 'design'] },
          { type: 'turn_count', minTurns: 6 },
        ],
        hint: 'Your creative engagement impresses Claire enough to move forward.',
      },
      {
        id: 'fi-branch-03b',
        targetSegmentId: 'fi-seg-04',
        conditions: [{ type: 'turn_count', minTurns: 10 }],
        hint: 'The meeting concludes and the race begins.',
      },
    ],
    minTurns: 6,
    maxTurns: 12,
  },

  // ---- Segment 4: Fabric Shopping (Fun & Games) ----
  {
    id: 'fi-seg-04',
    storyId: 'fashion-intern-paris',
    title: 'Fabric Shopping',
    activeCharacterIds: ['leo_chen'],
    narrativeIntro:
      'Leo catches up with you in the hallway. "Hey, I know a place — this little fabric shop in Le Marais. The owner\'s a legend. Want me to take you? You\'ll need real fabric samples if you want to blow Claire away." He grins. "Plus, you owe me a coffee."',
    systemPromptFragment:
      'You are Leo Chen, taking the intern to a fabric shop in Le Marais, Paris. Be enthusiastic and teach them about fabrics in a casual way: silk vs cotton vs linen, colors, textures. Use simple, colloquial English. Share a personal story about a time your photography work was rejected and how you bounced back. If they mention Nadia, be diplomatic but hint that "she\'s not always what she seems." End by encouraging them: "Trust me, your idea is solid. Just be yourself tomorrow." Use concrete sensory vocabulary: touch, feel, weight, color.',
    suggestedTopics: [
      'Learn about different fabrics',
      'Ask Leo about his photography career',
      'Discuss mood board ideas with Leo',
      'Talk about Nadia and the competition',
    ],
    branches: [
      {
        id: 'fi-branch-04',
        targetSegmentId: 'fi-seg-01',
        conditions: [{ type: 'turn_count', minTurns: 8 }],
        hint: 'You head back to prepare your mood board for tomorrow.',
      },
    ],
    minTurns: 8,
    maxTurns: 14,
  },
];
