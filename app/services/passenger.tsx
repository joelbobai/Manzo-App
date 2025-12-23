import { formatMoney } from './flight-results';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FlightOffer, FlightSearchPayload, FlightSegment } from '@/types/flight';

type PassengerParams = {
  flight?: string | string[];
  payload?: string | string[];
  dictionaries?: string | string[];
  offerId?: string | string[];
};

const parseJsonParam = <T,>(value?: string | string[]): T | null => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn('Unable to parse passenger screen param', error);
    return null;
  }
};

const formatDateLabel = (value?: string) => {
  if (!value) return '--';

  const date = new Date(value);

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} • ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;
};

const SegmentRow = ({ segment }: { segment: FlightSegment }) => (
  <View style={styles.segmentRow}>
    <View style={styles.segmentCodeBlock}>
      <Text style={styles.segmentCode}>{segment.departure.iataCode}</Text>
      <Text style={styles.segmentTime}>{formatDateLabel(segment.departure.at)}</Text>
    </View>

    <View style={styles.segmentDivider}>
      <Ionicons name="airplane" size={18} color="#0c2047" />
      <Text style={styles.segmentDuration}>to</Text>
    </View>

    <View style={styles.segmentCodeBlock}>
      <Text style={[styles.segmentCode, styles.alignEnd]}>{segment.arrival.iataCode}</Text>
      <Text style={[styles.segmentTime, styles.alignEnd]}>{formatDateLabel(segment.arrival.at)}</Text>
    </View>
  </View>
);

export default function PassengerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PassengerParams>();

  const selectedFlight = useMemo(
    () => parseJsonParam<FlightOffer>(params.flight),
    [params.flight],
  );

  const searchPayload = useMemo(
    () => parseJsonParam<FlightSearchPayload>(params.payload),
    [params.payload],
  );

  const itinerary = selectedFlight?.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  const passengerCounts = searchPayload?.passenger;
  const rawFlightParam = Array.isArray(params.flight) ? params.flight[0] : params.flight;
  const rawPayloadParam = Array.isArray(params.payload) ? params.payload[0] : params.payload;
  const rawDictionariesParam = Array.isArray(params.dictionaries) ? params.dictionaries[0] : params.dictionaries;
  const rawOfferIdParam = Array.isArray(params.offerId) ? params.offerId[0] : params.offerId;

  const handleStartPassengerForm = useCallback(() => {
    if (!selectedFlight || !rawFlightParam) {
      Alert.alert(
        'Select a flight first',
        'Choose a flight from the results screen and try again so we can pass its details to the passenger form.',
      );
      return;
    }

    const nextParams: Record<string, string> = {
      flight: rawFlightParam,
    };

    if (rawPayloadParam) {
      nextParams.payload = rawPayloadParam;
    }

    if (rawDictionariesParam) {
      nextParams.dictionaries = rawDictionariesParam;
    }

    if (rawOfferIdParam) {
      nextParams.offerId = rawOfferIdParam;
    }

    router.push({ pathname: '/services/passenger-form', params: nextParams });
  }, [rawDictionariesParam, rawFlightParam, rawOfferIdParam, rawPayloadParam, router, selectedFlight]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.topIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Passenger details</Text>
        <View style={styles.topIcon} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Selected flight</Text>
        <View style={styles.card}>
          {segments.length > 0 ? (
            <>
              <View style={styles.routeRow}>
                <View>
                  <Text style={styles.routeLabel}>From</Text>
                  <Text style={styles.routeValue}>{firstSegment?.departure.iataCode ?? '--'}</Text>
                </View>
                <Ionicons name="swap-horizontal" size={20} color="#0c2047" />
                <View style={styles.alignEnd}>
                  <Text style={styles.routeLabel}>To</Text>
                  <Text style={styles.routeValue}>{lastSegment?.arrival.iataCode ?? '--'}</Text>
                </View>
              </View>

              <View style={styles.separator} />

              {segments.map((segment) => (
                <SegmentRow key={`${segment.carrierCode}-${segment.number}-${segment.id}`} segment={segment} />
              ))}

              <View style={styles.priceRow}>
                <View style={styles.priceChip}>
                  <Ionicons name="briefcase-outline" size={16} color="#0c2047" />
                  <Text style={styles.priceChipText}>{
                    selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ??
                    searchPayload?.passenger?.travelClass ??
                    'Cabin'
                  }</Text>
                </View>
                <Text style={styles.priceValue}>
                  {selectedFlight?.price?.grandTotal
                    ? formatMoney(Number(selectedFlight.price.grandTotal), selectedFlight.price.currency)
                    : 'Price unavailable'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="warning-outline" size={24} color="#b54708" />
              <Text style={styles.emptyText}>No flight was passed from the results page.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Travellers</Text>
        <View style={styles.card}>
          {passengerCounts ? (
            <View style={styles.passengerGrid}>
              <View style={styles.passengerStat}>
                <Text style={styles.passengerLabel}>Adults</Text>
                <Text style={styles.passengerValue}>{passengerCounts.adults ?? 0}</Text>
              </View>
              <View style={styles.passengerStat}>
                <Text style={styles.passengerLabel}>Children</Text>
                <Text style={styles.passengerValue}>{passengerCounts.children ?? 0}</Text>
              </View>
              <View style={styles.passengerStat}>
                <Text style={styles.passengerLabel}>Infants</Text>
                <Text style={styles.passengerValue}>{passengerCounts.infants ?? 0}</Text>
              </View>
              <View style={styles.passengerStat}>
                <Text style={styles.passengerLabel}>Travel class</Text>
                <Text style={styles.passengerValue}>
                  {passengerCounts.travelClass ?? selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? 'N/A'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle-outline" size={24} color="#0c2047" />
              <Text style={styles.emptyText}>We could not read the search passengers. You can still continue.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Next steps</Text>
        <View style={styles.card}> 
          <Text style={styles.bodyText}>
            Review the selected flight information above, then continue to collect passenger names, contact details, and any
            required travel documents. All data from the search and selection has been carried over to this screen so the booking
            flow can proceed without re-entering details.
          </Text>
          <Pressable style={styles.primaryButton} onPress={handleStartPassengerForm}>
            <Text style={styles.primaryButtonText}>Start passenger form</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7fb',
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  topBar: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0c2047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2047',
  },
  section: {
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 13,
    color: '#5c6270',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#0c2047',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeLabel: {
    color: '#5c6270',
    fontSize: 13,
  },
  routeValue: {
    color: '#0c2047',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e6e8ec',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentCodeBlock: {
    flex: 1,
  },
  segmentCode: {
    fontSize: 18,
    color: '#0c2047',
    fontWeight: '700',
  },
  segmentTime: {
    color: '#5c6270',
    fontSize: 13,
    marginTop: 2,
  },
  segmentDivider: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  segmentDuration: {
    fontSize: 12,
    color: '#5c6270',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceChipText: {
    fontWeight: '600',
    color: '#0c2047',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  emptyState: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#5c6270',
    flex: 1,
  },
  passengerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  passengerStat: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  passengerLabel: {
    color: '#5c6270',
    fontSize: 13,
  },
  passengerValue: {
    color: '#0c2047',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  bodyText: {
    color: '#3b4254',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#f27805',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
