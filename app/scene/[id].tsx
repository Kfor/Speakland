/**
 * Scene Screen - Core Learning Experience
 *
 * The main interactive learning scene where the user converses with
 * AI-driven characters in the context of a story segment. Features:
 * - Narrative intro display
 * - Character portraits with expression placeholders
 * - Scrollable subtitle/message area with long-press word lookup
 * - Chat input for text/voice
 * - Smart Assist grammar feedback via FeedbackBanner
 * - Translation button
 * - WordPopup modal for vocabulary saving
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  ChatInput,
  SubtitleDisplay,
  FeedbackBanner,
  WordPopup,
} from '../../components';
import { useGameStore, useVocabularyStore } from '../../stores';
import { useAuth } from '../../providers/AuthProvider';
import {
  getStoryById,
  getCharactersForStory,
  getSegmentById,
} from '../../data/stories';
import { callLlmProxy, streamLlmProxy } from '../../lib/llmClient';
import type {
  Story,
  Character,
  StorySegment,
  DialogueMessage,
  SmartAssistResult,
  LlmMessage,
} from '../../types';

/** Generate a unique message ID */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SceneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stores
  const {
    messages,
    isGenerating,
    addMessage,
    setIsGenerating,
    clearMessages,
    setCurrentGame,
  } = useGameStore();
  const { words, addWord, removeWord } = useVocabularyStore();
  const { session } = useAuth();
  const userId = session?.user?.id ?? 'local-user';

  // Scene data
  const [story, setStory] = useState<Story | null>(null);
  const [segment, setSegment] = useState<StorySegment | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [turnCount, setTurnCount] = useState(0);

  // UI state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'praise' | 'correction' | 'info'>('info');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackDetail, setFeedbackDetail] = useState<string | undefined>(undefined);

  // Word popup state
  const [wordPopupVisible, setWordPopupVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [wordTranslation, setWordTranslation] = useState<string | undefined>(undefined);

  // Streaming state
  const [streamingText, setStreamingText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const initRef = useRef(false);

  // ---- Load story & segment on mount ----
  useEffect(() => {
    if (!id || initRef.current) return;
    initRef.current = true;

    const loadedStory = getStoryById(id);
    if (!loadedStory) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[SceneScreen] Story not found: ${id}`);
      }
      router.back();
      return;
    }

    setStory(loadedStory);
    const storyCharacters = getCharactersForStory(loadedStory.id);
    setCharacters(storyCharacters);

    const rootSegment = getSegmentById(loadedStory.rootSegmentId);
    if (!rootSegment) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[SceneScreen] Root segment not found: ${loadedStory.rootSegmentId}`);
      }
      router.back();
      return;
    }

    setSegment(rootSegment);

    // Initialize game state
    clearMessages();
    setCurrentGame({
      id: `game-${Date.now()}`,
      userId,
      storyId: loadedStory.id,
      currentSegmentId: rootSegment.id,
      completedSegmentIds: [],
      relationships: {},
      inventory: [],
      xp: 0,
      level: 1,
      wordsEncountered: 0,
      wordsLearned: 0,
      totalTurns: 0,
      sessionDuration: 0,
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
    });

    // Show narrative intro as narrator message
    if (rootSegment.narrativeIntro) {
      addMessage({
        id: generateMessageId(),
        userId,
        storyId: loadedStory.id,
        segmentId: rootSegment.id,
        speaker: 'narrator',
        content: rootSegment.narrativeIntro,
        turnNumber: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }, [id, router, addMessage, clearMessages, setCurrentGame]);

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, streamingText]);

  // ---- Build system prompt ----
  const systemPrompt = useMemo(() => {
    if (!segment || characters.length === 0) return '';

    const activeChars = characters.filter((c) =>
      segment.activeCharacterIds.includes(c.id)
    );

    const charDescriptions = activeChars
      .map(
        (c) =>
          `Character: ${c.name}\nPersonality: ${c.personality}\nSpeaking Style: ${c.speakingStyle}`
      )
      .join('\n\n');

    return `You are roleplaying in an interactive language learning story.\n\n${segment.systemPromptFragment}\n\n${charDescriptions}\n\nIMPORTANT: Stay in character. Use natural English at an appropriate difficulty level. Keep responses concise (2-4 sentences). Include the character name before their dialogue like "CharacterName: dialogue".`;
  }, [segment, characters]);

  // ---- Build conversation history for LLM ----
  const buildLlmMessages = useCallback((): LlmMessage[] => {
    const llmMessages: LlmMessage[] = [];

    if (systemPrompt) {
      llmMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.speaker === 'user') {
        llmMessages.push({ role: 'user', content: msg.content });
      } else if (msg.speaker === 'character') {
        llmMessages.push({ role: 'assistant', content: msg.content });
      }
      // Skip narrator and system messages in the LLM history
    }

    return llmMessages;
  }, [messages, systemPrompt]);

  // ---- Smart Assist (grammar check) ----
  const runSmartAssist = useCallback(
    async (userText: string) => {
      try {
        const response = await callLlmProxy({
          messages: [
            {
              role: 'system',
              content:
                'You are a language tutor. Check the following English text for grammar or expression issues. Respond in JSON format with: {"grammar": {"original": "...", "corrected": "...", "explanation": "..."} | null, "expression": {"original": "...", "better": "...", "explanation": "..."} | null, "praise": "..." | null}. If the text is correct, set grammar and expression to null and provide brief praise.',
            },
            { role: 'user', content: userText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 300,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) return;

        try {
          const result: SmartAssistResult = JSON.parse(content);

          if (result.grammar) {
            setFeedbackType('correction');
            setFeedbackMessage(`"${result.grammar.original}" -> "${result.grammar.corrected}"`);
            setFeedbackDetail(result.grammar.explanation);
            setFeedbackVisible(true);
          } else if (result.expression) {
            setFeedbackType('correction');
            setFeedbackMessage(`Try: "${result.expression.better}"`);
            setFeedbackDetail(result.expression.explanation);
            setFeedbackVisible(true);
          } else if (result.praise) {
            setFeedbackType('praise');
            setFeedbackMessage(result.praise);
            setFeedbackDetail(undefined);
            setFeedbackVisible(true);
          }
        } catch {
          // JSON parse failed, ignore
        }
      } catch {
        // Smart assist is non-critical, silently fail
      }
    },
    []
  );

  // ---- Send message ----
  const handleSend = useCallback(
    async (text: string) => {
      if (!story || !segment || isGenerating) return;

      const newTurn = turnCount + 1;
      setTurnCount(newTurn);

      // Add user message
      const userMessage: DialogueMessage = {
        id: generateMessageId(),
        userId,
        storyId: story.id,
        segmentId: segment.id,
        speaker: 'user',
        content: text,
        turnNumber: newTurn,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Run Smart Assist asynchronously (fire-and-forget)
      runSmartAssist(text);

      // Start generating AI response
      setIsGenerating(true);
      setStreamingText('');

      const llmMessages = buildLlmMessages();
      llmMessages.push({ role: 'user', content: text });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let fullResponse = '';

      try {
        await streamLlmProxy(
          {
            messages: llmMessages,
            stream: true,
            temperature: 0.8,
            max_tokens: 500,
          },
          {
            onToken: (token: string) => {
              fullResponse += token;
              setStreamingText(fullResponse);
            },
            onComplete: (completeText: string) => {
              fullResponse = completeText;
            },
            onError: (error: Error) => {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn('[SceneScreen] Stream error:', error.message);
              }
            },
          },
          controller.signal
        );
      } catch {
        // Stream may have been aborted or errored
      }

      // Add the complete AI message
      if (fullResponse.trim().length > 0) {
        const aiMessage: DialogueMessage = {
          id: generateMessageId(),
          userId,
          storyId: story.id,
          segmentId: segment.id,
          speaker: 'character',
          content: fullResponse.trim(),
          turnNumber: newTurn,
          createdAt: new Date().toISOString(),
        };
        addMessage(aiMessage);
      }

      setStreamingText('');
      setIsGenerating(false);
      abortControllerRef.current = null;
    },
    [
      story,
      segment,
      isGenerating,
      turnCount,
      userId,
      addMessage,
      setIsGenerating,
      buildLlmMessages,
      runSmartAssist,
    ]
  );

  // ---- Word long-press handler ----
  const handleWordLongPress = useCallback((word: string) => {
    setSelectedWord(word);
    setWordTranslation(undefined);
    setWordPopupVisible(true);

    // Attempt to get a translation asynchronously
    callLlmProxy({
      messages: [
        {
          role: 'system',
          content: 'Translate the following English word to Chinese (Simplified). Reply with only the translation, nothing else.',
        },
        { role: 'user', content: word },
      ],
      temperature: 0.1,
      max_tokens: 50,
    })
      .then((response) => {
        const translation = response.choices[0]?.message?.content?.trim();
        if (translation) {
          setWordTranslation(translation);
        }
      })
      .catch(() => {
        // Translation is best-effort
      });
  }, []);

  // ---- Toggle word in word book ----
  const isWordInBook = useMemo(
    () => words.some((w) => w.word.toLowerCase() === selectedWord.toLowerCase()),
    [words, selectedWord]
  );

  const handleToggleWordBook = useCallback(() => {
    if (isWordInBook) {
      const entry = words.find(
        (w) => w.word.toLowerCase() === selectedWord.toLowerCase()
      );
      if (entry) {
        removeWord(entry.id);
      }
    } else {
      addWord({
        id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        word: selectedWord,
        language: 'en',
        translation: wordTranslation,
        contextSentence: undefined,
        learned: false,
        addedAt: new Date().toISOString(),
      });
    }
    setWordPopupVisible(false);
  }, [isWordInBook, selectedWord, wordTranslation, words, userId, addWord, removeWord]);

  // ---- Translate last message ----
  const handleTranslate = useCallback(async () => {
    const lastCharacterMessage = [...messages]
      .reverse()
      .find((m) => m.speaker === 'character');
    if (!lastCharacterMessage) return;

    try {
      const response = await callLlmProxy({
        messages: [
          {
            role: 'system',
            content: 'Translate the following text to Chinese (Simplified). Reply with only the translation.',
          },
          { role: 'user', content: lastCharacterMessage.content },
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

      const translation = response.choices[0]?.message?.content?.trim();
      if (translation) {
        setFeedbackType('info');
        setFeedbackMessage(translation);
        setFeedbackDetail(undefined);
        setFeedbackVisible(true);
      }
    } catch {
      // Translation is non-critical
    }
  }, [messages]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ---- Loading state ----
  if (!story || !segment) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  const activeCharacters = characters.filter((c) =>
    segment.activeCharacterIds.includes(c.id)
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.segmentTitle} numberOfLines={1}>
            {segment.title}
          </Text>
          <Text style={styles.storyTitle} numberOfLines={1}>
            {story.title}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.translateButton}
          onPress={handleTranslate}
        >
          <Text style={styles.translateButtonText}>{'\uD83C\uDF10'}</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback banner */}
      <FeedbackBanner
        visible={feedbackVisible}
        type={feedbackType}
        message={feedbackMessage}
        detail={feedbackDetail}
        autoDismissMs={5000}
        onDismiss={() => setFeedbackVisible(false)}
      />

      {/* Character portraits */}
      <View style={styles.characterPortraits}>
        {activeCharacters.map((char) => (
          <View key={char.id} style={styles.characterPortrait}>
            <View style={styles.portraitCircle}>
              <Text style={styles.portraitEmoji}>{'\uD83E\uDDD1'}</Text>
            </View>
            <Text style={styles.characterName} numberOfLines={1}>
              {char.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Messages area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <SubtitleDisplay
            key={msg.id}
            text={msg.content}
            speaker={
              msg.speaker === 'user'
                ? 'user'
                : msg.speaker === 'narrator'
                  ? 'narrator'
                  : 'character'
            }
            speakerName={
              msg.speaker === 'narrator'
                ? 'Narrator'
                : msg.speaker === 'user'
                  ? 'You'
                  : activeCharacters[0]?.name
            }
            onWordLongPress={handleWordLongPress}
            showTranslation={false}
          />
        ))}

        {/* Streaming text */}
        {streamingText.length > 0 && (
          <SubtitleDisplay
            text={streamingText}
            speaker="character"
            speakerName={activeCharacters[0]?.name}
            onWordLongPress={handleWordLongPress}
            showTranslation={false}
          />
        )}

        {/* Generating indicator */}
        {isGenerating && streamingText.length === 0 && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        )}

        {/* Suggested topics */}
        {messages.length <= 1 && segment.suggestedTopics && (
          <View style={styles.suggestedTopics}>
            <Text style={styles.suggestedLabel}>Suggested topics:</Text>
            {segment.suggestedTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={styles.topicChip}
                onPress={() => handleSend(topic)}
                disabled={isGenerating}
              >
                <Text style={styles.topicChipText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Chat input */}
      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInput
          onSend={handleSend}
          disabled={isGenerating}
          placeholder="Type in English..."
        />
      </View>

      {/* Word popup */}
      <WordPopup
        visible={wordPopupVisible}
        word={selectedWord}
        translation={wordTranslation}
        isInWordBook={isWordInBook}
        onClose={() => setWordPopupVisible(false)}
        onToggleWordBook={handleToggleWordBook}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.primary,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  segmentTitle: {
    fontSize: Fonts.size.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  storyTitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  translateButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButtonText: {
    fontSize: 22,
  },
  characterPortraits: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  characterPortrait: {
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  portraitCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  portraitEmoji: {
    fontSize: 24,
  },
  characterName: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    maxWidth: 80,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  typingText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  suggestedTopics: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  suggestedLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  topicChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  topicChipText: {
    fontSize: Fonts.size.md,
    color: Colors.primaryDark,
  },
});
