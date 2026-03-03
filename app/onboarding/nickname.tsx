/**
 * Onboarding Nickname Screen
 *
 * User enters their game nickname.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores';
import { MascotDisplay } from '../../components';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants';

export default function NicknameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, setNickname } = useOnboardingStore();
  const [name, setName] = useState(data.nickname ?? '');

  const trimmedName = name.trim();
  const isValid = trimmedName.length >= 2 && trimmedName.length <= 20;

  const handleNext = () => {
    if (isValid) {
      setNickname(trimmedName);
      router.push('/onboarding/tutorial');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <MascotDisplay size={80} expression="encouraging" />
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.hint}>This is your name in the story world</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your nickname"
          placeholderTextColor={Colors.textLight}
          maxLength={20}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />
        <Text style={styles.charCount}>{trimmedName.length}/20</Text>
      </View>

      <View style={styles.spacer} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  hint: {
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: Spacing['2xl'],
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Fonts.size.lg,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: Fonts.size.sm,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingHorizontal: Spacing['2xl'],
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  nextButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
  },
});
