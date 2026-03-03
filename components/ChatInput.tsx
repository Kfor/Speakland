/**
 * ChatInput - Bottom chat input with voice/text toggle
 *
 * Provides a text input field with a send button and a
 * microphone button for voice input toggle.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants';

interface ChatInputProps {
  /** Callback when a message is sent */
  onSend: (text: string) => void;
  /** Callback when voice recording starts */
  onVoiceStart?: () => void;
  /** Callback when voice recording stops */
  onVoiceStop?: () => void;
  /** Whether the input is disabled (e.g., during AI generation) */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether voice input is currently recording */
  isRecording?: boolean;
}

export function ChatInput({
  onSend,
  onVoiceStart,
  onVoiceStop,
  disabled = false,
  placeholder = 'Type your message...',
  isRecording = false,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setText('');
  };

  const handleVoicePress = () => {
    if (isRecording) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      {/* Voice button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isRecording && styles.voiceButtonRecording,
        ]}
        onPress={handleVoicePress}
        disabled={disabled}
      >
        <Text style={styles.voiceIcon}>
          {isRecording ? '\u23F9' : '\uD83C\uDF99\uFE0F'}
        </Text>
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        editable={!disabled && !isRecording}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit
      />

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendButton, canSend && styles.sendButtonActive]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text
          style={[
            styles.sendIcon,
            canSend && styles.sendIconActive,
          ]}
        >
          {'\u2191'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  voiceButtonRecording: {
    backgroundColor: Colors.error,
  },
  voiceIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    fontSize: Fonts.size.base,
    color: Colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  sendIconActive: {
    color: Colors.textOnPrimary,
  },
});
