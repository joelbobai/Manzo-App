import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const alertSections = [
  {
    title: 'Price Alerts',
    description: 'Saved flight searches and fare drops will appear here.',
  },
  {
    title: 'Booking Updates',
    description: 'Check-in reminders, gate changes, and trip updates.',
  },
  {
    title: 'Payment & Visa Notifications',
    description: 'Payment confirmations and visa application milestones.',
  },
];

export default function AlertsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Alerts & notifications</ThemedText>
        <ThemedText style={styles.mutedText}>
          Plug your alert sources here to surface fare drops, booking status updates, and payment notices.
        </ThemedText>
      </ThemedView>

      {alertSections.map((section) => (
        <ThemedView key={section.title} style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">{section.title}</ThemedText>
          </View>
          <ThemedText style={styles.mutedText}>{section.description}</ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  mutedText: {
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
