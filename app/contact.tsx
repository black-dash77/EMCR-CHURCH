import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Mail, Phone, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { contactApi } from '@/services/api';

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await contactApi.sendMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        newsletter,
      });

      Alert.alert(
        'Message envoyé',
        'Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setNewsletter(false);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themeColors.text }]}>Contact</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact Info */}
          <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <MapPin size={20} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                  Adresse
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  123 Rue de l'Église, Paris
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Phone size={20} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                  Téléphone
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  +33 1 23 45 67 89
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[100] }]}>
                <Mail size={20} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                  Email
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  contact@emcr-church.com
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Form */}
          <Text style={[styles.formTitle, { color: themeColors.text }]}>
            Envoyez-nous un message
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>Nom *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="Votre nom"
                placeholderTextColor={themeColors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="votre@email.com"
                placeholderTextColor={themeColors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>Sujet *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="Sujet de votre message"
                placeholderTextColor={themeColors.textTertiary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>Message *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="Votre message..."
                placeholderTextColor={themeColors.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: themeColors.text }]}>
                S'inscrire à la newsletter
              </Text>
              <Switch
                value={newsletter}
                onValueChange={setNewsletter}
                trackColor={{
                  false: themeColors.border,
                  true: colors.primary[500],
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary[500] },
                sending && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={sending}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {sending ? 'Envoi en cours...' : 'Envoyer'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    ...typography.titleLarge,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 40,
  },
  infoCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  infoLabel: {
    ...typography.labelSmall,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodyMedium,
  },
  formTitle: {
    ...typography.titleMedium,
    marginBottom: spacing[4],
  },
  form: {
    gap: spacing[4],
  },
  inputGroup: {
    gap: spacing[1.5],
  },
  label: {
    ...typography.labelMedium,
  },
  input: {
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    ...typography.bodyMedium,
  },
  textArea: {
    height: 120,
    paddingTop: spacing[3],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...typography.bodyMedium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
  },
});
