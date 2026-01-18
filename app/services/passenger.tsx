import type { FlightOffer, FlightSearchPayload, PassengerCounts } from '@/types/flight';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from './flight-results';

const statusBarHeight =
  Constants.statusBarHeight || (Platform.OS === "ios" ? 20 : 24);

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

const formatDepartureDate = (value?: string) => {
  if (!value) return '--';

  const date = new Date(value);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatPassengerLabel = (counts?: PassengerCounts | null, travelerCount?: number) => {
  const adults = counts?.adults ?? 0;
  const children = counts?.children ?? 0;
  const infants = counts?.infants ?? 0;

  const parts: string[] = [];
  if (adults) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
  if (children) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
  if (infants) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);

  if (parts.length) return parts.join(', ');
  if (travelerCount && travelerCount > 0) return `${travelerCount} Adult${travelerCount > 1 ? 's' : ''}`;
  return 'Passengers';
};

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

  const passengerCounts = searchPayload?.passenger;
  const itinerary = selectedFlight?.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const passengerLabel = formatPassengerLabel(passengerCounts, selectedFlight?.travelerPricings?.length);
  const routeLabel = `${firstSegment?.departure.iataCode ?? '--'} → ${lastSegment?.arrival.iataCode ?? '--'}`;
  const departureLabel = formatDepartureDate(firstSegment?.departure.at);
  const cabinLabel =
    selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ??
    searchPayload?.passenger?.travelClass ??
    'Cabin';
  const priceLabel = selectedFlight?.price?.grandTotal
    ? formatMoney(Number(selectedFlight.price.grandTotal), selectedFlight.price.currency)
    : 'Price unavailable';
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
        <View style={[styles.card, styles.bookingCard]}>
          {segments.length > 0 ? (
            <>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingTitle}>Booking Summary</Text>
                <View style={[styles.pill, styles.pillAccent]}>
                  <Text style={[styles.pillText, styles.pillAccentText]}>{passengerLabel.toUpperCase()}</Text>
                </View>
              </View>

              <View style={[styles.pill, styles.pillMuted]}>
                <Text style={[styles.pillText, styles.pillMutedText]}>{passengerLabel}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Route</Text>
                <Text style={styles.summaryValue}>{routeLabel}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Departure</Text>
                <Text style={styles.summaryValue}>{departureLabel}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cabin</Text>
                <Text style={styles.summaryValue}>{cabinLabel.toUpperCase()}</Text>
              </View>

              <View style={styles.farePill}>
                <Text style={styles.farePassenger}>{passengerLabel}</Text>
                <Text style={styles.farePrice}>{priceLabel}</Text>
              </View>

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total price</Text>
                <Text style={styles.totalValue}>{priceLabel}</Text>
                <Text style={styles.totalHint}>Taxes and fees are included in the displayed amount.</Text>
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
    paddingRight: 16,
    paddingLeft: 16,
    paddingTop: statusBarHeight,
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
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#0c2047',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  bookingCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillAccent: {
    backgroundColor: '#fff4ed',
    borderWidth: 1,
    borderColor: '#ffcfa8',
  },
  pillAccentText: {
    color: '#d9570d',
  },
  pillMuted: {
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: '#dfe6f1',
  },
  pillMutedText: {
    color: '#5c6270',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 15,
    color: '#0c2047',
    fontWeight: '700',
  },
  farePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e6e8ef',
  },
  farePassenger: {
    color: '#5c6270',
    fontSize: 14,
    fontWeight: '600',
  },
  farePrice: {
    color: '#0c2047',
    fontSize: 16,
    fontWeight: '800',
  },
  totalBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffe3c7',
    gap: 6,
  },
  totalLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    color: '#d65f0b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c2047',
  },
  totalHint: {
    color: '#7b8292',
    fontSize: 12,
    lineHeight: 16,
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
