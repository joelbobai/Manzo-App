import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  FlightOffer,
  FlightRightsDictionaries,
  NormalizedOffer,
  normalizeOffer,
} from './flight-results';

export default function FlightRecheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ offer?: string; dictionaries?: string; source?: string }>();

  const parsedOffer = useMemo<FlightOffer | null>(() => {
    if (!params.offer) return null;

    try {
      return JSON.parse(decodeURIComponent(params.offer));
    } catch (error) {
      console.error('Unable to decode offer', error);
      return null;
    }
  }, [params.offer]);

  const parsedDictionaries = useMemo<FlightRightsDictionaries | undefined>(() => {
    if (!params.dictionaries) return undefined;

    try {
      return JSON.parse(decodeURIComponent(params.dictionaries));
    } catch (error) {
      console.error('Unable to decode dictionaries', error);
      return undefined;
    }
  }, [params.dictionaries]);

  const normalizedOffer = useMemo<NormalizedOffer | null>(() => {
    if (!parsedOffer) return null;

    return normalizeOffer(parsedOffer, parsedDictionaries);
  }, [parsedOffer, parsedDictionaries]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0c2047" />
        </Pressable>
        <Text style={styles.title}>Flight recheck</Text>
      </View>

      {!normalizedOffer && (
        <View style={styles.card}>
          <Text style={styles.label}>No offer selected</Text>
          <Text style={styles.subtext}>Return to results and choose a flight to review details.</Text>
        </View>
      )}

      {normalizedOffer && (
        <View style={styles.card}>
          <Text style={styles.label}>{normalizedOffer.airlineLabel}</Text>
          <Text style={styles.price}>{normalizedOffer.priceLabel || 'Price unavailable'}</Text>

          <View style={styles.legBlock}>
            <Text style={styles.legLabel}>Outbound</Text>
            <Text style={styles.legRoute}>{`${normalizedOffer.outbound.from} → ${normalizedOffer.outbound.to}`}</Text>
            <Text style={styles.legMeta}>
              {normalizedOffer.outbound.departTimeLabel} - {normalizedOffer.outbound.arriveTimeLabel} • {normalizedOffer.outbound.durationLabel || 'Duration N/A'} • {normalizedOffer.outbound.stopsLabel}
            </Text>
          </View>

          {normalizedOffer.inbound && (
            <View style={styles.legBlock}>
              <Text style={styles.legLabel}>Return</Text>
              <Text style={styles.legRoute}>{`${normalizedOffer.inbound.from} → ${normalizedOffer.inbound.to}`}</Text>
              <Text style={styles.legMeta}>
                {normalizedOffer.inbound.departTimeLabel} - {normalizedOffer.inbound.arriveTimeLabel} • {normalizedOffer.inbound.durationLabel || 'Duration N/A'} • {normalizedOffer.inbound.stopsLabel}
              </Text>
            </View>
          )}

          {typeof normalizedOffer.seatsLeft === 'number' && (
            <Text style={styles.seats}>Seats left: {normalizedOffer.seatsLeft}</Text>
          )}

          <Text style={styles.subtext}>Source: {params.source || 'live'}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f5f7fb',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e6edfb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e4eaf5',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  subtext: {
    color: '#5c6270',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c2047',
  },
  legBlock: {
    gap: 4,
  },
  legLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  legRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2047',
  },
  legMeta: {
    fontSize: 12,
    color: '#5c6270',
  },
  seats: {
    fontSize: 12,
    color: '#0c2047',
    fontWeight: '700',
  },
});
