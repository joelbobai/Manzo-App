import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

const mockBookings = [
  {
    id: '1',
    reference: 'MNZ-4521',
    route: 'Lagos → London',
    date: 'Dec 12, 2024',
    status: 'active',
  },
  {
    id: '2',
    reference: 'MNZ-2982',
    route: 'Accra → Nairobi',
    date: 'Oct 04, 2024',
    status: 'past',
  },
  {
    id: '3',
    reference: 'MNZ-1012',
    route: 'Abuja → Dubai',
    date: 'Nov 20, 2024',
    status: 'cancelled',
  },
];

type BookingResult = {
  reference: string;
  route: string;
  date: string;
  status: string;
};

export default function TripsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [bookingRef, setBookingRef] = useState('');
  const [contact, setContact] = useState('');
  const [lookupResult, setLookupResult] = useState<BookingResult | null>(null);
  const [recentLookups, setRecentLookups] = useState<BookingResult[]>([]);

  const groupedBookings = useMemo(
    () => ({
      active: mockBookings.filter((booking) => booking.status === 'active'),
      past: mockBookings.filter((booking) => booking.status === 'past'),
      cancelled: mockBookings.filter((booking) => booking.status === 'cancelled'),
    }),
    []
  );

  const handleLookup = async () => {
    const result: BookingResult = {
      reference: bookingRef || 'MNZ-0000',
      route: 'Lagos → London',
      date: 'Dec 12, 2024',
      status: 'Active - confirmed',
    };

    setLookupResult(result);
    setRecentLookups((prev) => [result, ...prev.slice(0, 2)]);
  };

  if (isAuthenticated) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText type="title">Your trips</ThemedText>
          <ThemedText style={styles.mutedText}>
            Bookings are grouped into Active, Past, and Cancelled for quick access.
          </ThemedText>
        </ThemedView>

        <BookingGroup title="Active Trips" bookings={groupedBookings.active} />
        <BookingGroup title="Past Trips" bookings={groupedBookings.past} />
        <BookingGroup title="Cancelled Trips" bookings={groupedBookings.cancelled} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Find a booking</ThemedText>
        <ThemedText style={styles.mutedText}>
          Track guest bookings with your reference code and email or phone number.
        </ThemedText>
        <TextInput
          placeholder="Booking reference code"
          value={bookingRef}
          onChangeText={setBookingRef}
          style={styles.input}
        />
        <TextInput
          placeholder="Email or phone number"
          value={contact}
          onChangeText={setContact}
          style={styles.input}
        />
        <Pressable
          onPress={handleLookup}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <ThemedText style={styles.buttonText}>Find my trip</ThemedText>
        </Pressable>

        {lookupResult && (
          <ThemedView style={styles.resultCard}>
            <ThemedText type="defaultSemiBold">{lookupResult.route}</ThemedText>
            <ThemedText style={styles.mutedText}>{lookupResult.date}</ThemedText>
            <ThemedText style={styles.statusText}>{lookupResult.status}</ThemedText>
            <ThemedText style={styles.referenceText}>Ref: {lookupResult.reference}</ThemedText>
          </ThemedView>
        )}

        {recentLookups.length > 0 && (
          <ThemedView style={styles.recentCard}>
            <ThemedText type="defaultSemiBold">Recent on this device</ThemedText>
            {recentLookups.map((item) => (
              <View key={item.reference} style={styles.recentRow}>
                <View>
                  <ThemedText>{item.route}</ThemedText>
                  <ThemedText style={styles.mutedText}>{item.date}</ThemedText>
                </View>
                <ThemedText style={styles.referenceText}>{item.reference}</ThemedText>
              </View>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Create an account</ThemedText>
          <ThemedText style={styles.mutedText}>
            Save trips permanently and receive price or status alerts.
          </ThemedText>
          <Pressable
            onPress={() => router.push('/auth/sign-up')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <ThemedText style={styles.secondaryButtonText}>Sign up to save booking</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

type BookingGroupProps = {
  title: string;
  bookings: typeof mockBookings;
};

function BookingGroup({ title, bookings }: BookingGroupProps) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {bookings.length === 0 ? (
        <ThemedText style={styles.mutedText}>No trips yet.</ThemedText>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.bookingRow}>
              <View>
                <ThemedText type="defaultSemiBold">{item.route}</ThemedText>
                <ThemedText style={styles.mutedText}>{item.date}</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.referenceText}>{item.reference}</ThemedText>
                <ThemedText style={styles.statusText}>{item.status}</ThemedText>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
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
  resultCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  recentCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#0f9d58',
    fontWeight: '600',
  },
  referenceText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  mutedText: {
    color: '#6b7280',
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
  sectionTitle: {
    marginBottom: 6,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
});
