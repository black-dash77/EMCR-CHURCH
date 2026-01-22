import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserStore } from '@/stores/useUserStore';
import { typography, spacing, borderRadius } from '@/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUserStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const canContinue = firstName.trim().length >= 2;

  const handleContinue = () => {
    if (!canContinue) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding(firstName.trim(), lastName.trim());
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.iconContainer}>
            <User size={48} color="#FFFFFF" strokeWidth={1.5} />
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.title}>
            Bienvenue à l'Église Missionnaire Christ est Roi
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.subtitle}>
            Comment vous appelez-vous ?
          </Animated.Text>

          {/* Inputs */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.inputsContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nom (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Button - Fixed at bottom */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing[4] }]}
        >
          <Pressable
            style={[
              styles.button,
              !canContinue && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing[6],
  },
  title: {
    ...typography.headlineLarge,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.bodyLarge,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  inputsContainer: {
    gap: spacing[4],
  },
  inputWrapper: {
    gap: spacing[2],
  },
  label: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: spacing[1],
  },
  input: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    backgroundColor: '#000000',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    ...typography.labelLarge,
    color: '#000000',
    fontWeight: '700',
  },
});
