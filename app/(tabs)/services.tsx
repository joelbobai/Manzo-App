import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const services = [
  { label: 'Flights', route: '/services/flights', description: 'Find and book flights' },
  { label: 'Hotels', route: '/services/hotels', description: 'Reserve stays and apartments' },
  { label: 'Rides', route: '/services/rides', description: 'Airport and in-city rides' },
  { label: 'Visa Application', route: '/services/visa', description: 'Guided visa assistance' },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">All services</ThemedText>
        <ThemedText style={styles.mutedText}>
          Pick a service to continue. Each option opens its flow so you can plug in live APIs.
        </ThemedText>
      </ThemedView>

      <View style={styles.grid}>
        {services.map((service) => (
          <Pressable
            key={service.label}
            onPress={() => router.push(service.route)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <ThemedText type="defaultSemiBold">{service.label}</ThemedText>
            <ThemedText style={styles.mutedText}>{service.description}</ThemedText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  cardPressed: {
    opacity: 0.9,
  },
  mutedText: {
    color: '#6b7280',
  },
});
