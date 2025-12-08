import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const services = [
  { label: 'Flights', route: '/services/flights', description: 'Search and book flights' },
  { label: 'Hotels', route: '/services/hotels', description: 'Find stays worldwide' },
  { label: 'Rides', route: '/services/rides', description: 'Airport and city rides' },
  { label: 'Visa', route: '/services/visa', description: 'Visa guidance & support' },
];

const popularRoutes = [
  { from: 'Lagos', to: 'London', price: '$820' },
  { from: 'Abuja', to: 'Dubai', price: '$680' },
  { from: 'Accra', to: 'Nairobi', price: '$540' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: '1',
  });

  const searchDisabled = useMemo(
    () => !form.from || !form.to || !form.departureDate || !form.passengers,
    [form]
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    router.push('/services/flights');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Book your next trip</ThemedText>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="From"
            value={form.from}
            onChangeText={(text) => handleChange('from', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="To"
            value={form.to}
            onChangeText={(text) => handleChange('to', text)}
            style={styles.input}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Departure Date"
            value={form.departureDate}
            onChangeText={(text) => handleChange('departureDate', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Passengers"
            value={form.passengers}
            onChangeText={(text) => handleChange('passengers', text)}
            style={styles.input}
            keyboardType="number-pad"
          />
        </View>
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [styles.primaryButton, (pressed || searchDisabled) && styles.buttonDisabled]}
          disabled={searchDisabled}>
          <ThemedText style={styles.primaryButtonText}>Search flights</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick services
        </ThemedText>
        <View style={styles.cardGrid}>
          {services.map((service) => (
            <Pressable
              key={service.label}
              onPress={() => router.push(service.route)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <ThemedText type="defaultSemiBold">{service.label}</ThemedText>
              <ThemedText style={styles.cardDescription}>{service.description}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Popular routes
        </ThemedText>
        {popularRoutes.map((route) => (
          <View key={`${route.from}-${route.to}`} style={styles.routeRow}>
            <View>
              <ThemedText type="defaultSemiBold">
                {route.from} → {route.to}
              </ThemedText>
              <ThemedText style={styles.cardDescription}>Trusted by frequent flyers</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{route.price}</ThemedText>
          </View>
        ))}
      </ThemedView>
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
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
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
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardDescription: {
    color: '#6b7280',
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
