import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText type="title">Welcome</ThemedText>
          <ThemedText style={styles.mutedText}>
            Sign in to sync bookings, receive alerts, and manage your wallet.
          </ThemedText>
          <Pressable
            onPress={() => router.push('/auth/sign-in')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <ThemedText style={styles.primaryButtonText}>Sign in</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/auth/sign-up')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <ThemedText style={styles.secondaryButtonText}>Create account</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">{user.name}</ThemedText>
        <ThemedText style={styles.mutedText}>{user.email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ProfileRow label="Wallet" value="₦12,500" />
        <ProfileRow label="KYC / Verification" value="Verified" />
        <ProfileRow label="Settings" onPress={() => router.push('/modal')} />
        <ProfileRow label="Support / Help Center" onPress={() => router.push('/modal')} />
      </ThemedView>

      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
        <ThemedText style={styles.secondaryButtonText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

type ProfileRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
};

function ProfileRow({ label, value, onPress }: ProfileRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}>
      <View>
        <ThemedText>{label}</ThemedText>
        {value && <ThemedText style={styles.mutedText}>{value}</ThemedText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  mutedText: {
    color: '#6b7280',
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
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowPressed: {
    opacity: 0.8,
  },
});
