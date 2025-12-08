import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

export default function SignUpScreen() {
  const { login } = useAuth();

  const handleCreateAccount = () => {
    login({ name: 'New Traveller', email: 'traveller@manzo.app' });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Create account</ThemedText>
        <ThemedText style={styles.mutedText}>
          We will attach guest bookings to your new account so you can receive alerts.
        </ThemedText>
        <TextInput placeholder="Full name" style={styles.input} />
        <TextInput placeholder="Email" style={styles.input} />
        <TextInput placeholder="Password" secureTextEntry style={styles.input} />
        <Pressable
          onPress={handleCreateAccount}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <ThemedText style={styles.buttonText}>Create account</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  mutedText: {
    color: '#6b7280',
  },
});
