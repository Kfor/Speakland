/**
 * Character Chat Screen - 1-on-1 conversation with a character
 *
 * A simpler version of the scene screen focused on free-form
 * conversation with a single character. No story segments or
 * branching -- just casual dialogue for practice.
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
import { ChatInput, SubtitleDisplay } from '../../components';
import { getCharacterById } from '../../data/stories';
import { mascot } from '../../data/characters/mascot';
import { streamLlmProxy } from '../../lib/llmClient';
import type { Character, LlmMessage } from '../../types';

/** Simple message type for chat (no full DialogueMessage needed) */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/** Generate a unique ID */
function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CharacterChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const initRef = useRef(false);

  // ---- Load character on mount ----
  useEffect(() => {
    if (!id || initRef.current) return;
    initRef.current = true;

    let loadedChar: Character | undefined;

    if (id === 'mascot') {
      loadedChar = mascot;
    } else {
      loadedChar = getCharacterById(id);
    }

    if (!loadedChar) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[CharacterChat] Character not found: ${id}`);
      }
      router.back();
      return;
    }

    setCharacter(loadedChar);

    // Add initial greeting
    const greeting: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `Hi there! I'm ${loadedChar.name}. ${loadedChar.personality.split('.')[0]}. Let's chat!`,
      createdAt: new Date().toISOString(),
    };
    setMessages([greeting]);
  }, [id, router]);

  // ---- Auto-scroll ----
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, streamingText]);

  // ---- System prompt ----
  const systemPrompt = useMemo(() => {
    if (!character) return '';
    return `You are ${character.name}. ${character.personality}\n\nSpeaking style: ${character.speakingStyle}\n\nYou are having a casual, friendly conversation. Stay in character at all times. Keep your responses concise (1-3 sentences). Use natural English appropriate for language learners.`;
  }, [character]);

  // ---- Build LLM messages ----
  const buildLlmMessages = useCallback((): LlmMessage[] => {
    const llmMessages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        llmMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        llmMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    return llmMessages;
  }, [messages, systemPrompt]);

  // ---- Send message ----
  const handleSend = useCallback(
    async (text: string) => {
      if (!character || isGenerating) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Start generating
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
            max_tokens: 300,
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
                console.warn('[CharacterChat] Stream error:', error.message);
              }
            },
          },
          controller.signal
        );
      } catch {
        // Stream may have been aborted
      }

      // Add the AI response
      if (fullResponse.trim().length > 0) {
        const aiMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: fullResponse.trim(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }

      setStreamingText('');
      setIsGenerating(false);
      abortControllerRef.current = null;
    },
    [character, isGenerating, buildLlmMessages]
  );

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ---- Loading state ----
  if (!character) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading character...</Text>
      </View>
    );
  }

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
          <View style={styles.headerPortrait}>
            <Text style={styles.headerPortraitEmoji}>{'\uD83E\uDDD1'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.characterNameHeader}>{character.name}</Text>
            <Text style={styles.characterStatus}>Online</Text>
          </View>
        </View>
        <View style={styles.spacer} />
      </View>

      {/* Messages */}
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
            speaker={msg.role === 'user' ? 'user' : 'character'}
            speakerName={msg.role === 'user' ? 'You' : character.name}
            showTranslation={false}
          />
        ))}

        {/* Streaming text */}
        {streamingText.length > 0 && (
          <SubtitleDisplay
            text={streamingText}
            speaker="character"
            speakerName={character.name}
            showTranslation={false}
          />
        )}

        {/* Typing indicator */}
        {isGenerating && streamingText.length === 0 && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>
              {character.name} is typing...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Chat input */}
      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInput
          onSend={handleSend}
          disabled={isGenerating}
          placeholder={`Message ${character.name}...`}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  headerPortrait: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPortraitEmoji: {
    fontSize: 18,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
  },
  characterNameHeader: {
    fontSize: Fonts.size.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  characterStatus: {
    fontSize: Fonts.size.xs,
    color: Colors.accent,
  },
  spacer: {
    width: 40,
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
});
