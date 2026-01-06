import { useAirports } from '@/hooks/useAirports';
import type {
  FlightDictionaries,
  FlightOffer,
  FlightPriceCheckPayload,
  FlightPriceCheckResponse,
  FlightSearchPayload,
  FlightSegment,
  PassengerCounts,
  TravelerPricingDetail,
} from '@/types/flight';
import { encryptTicketPayload } from '@/utils/encrypt-ticket';
import { getAirportLocation, getCountryByIATA } from '@/utils/getCountryByIATA';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaystackProvider, usePaystack } from 'react-native-paystack-webview';
import { formatMoney } from './services/flight-results';
import type { PassengerFormState } from './services/passenger-form';

type OverviewParams = {
  flight?: string | string[];
  payload?: string | string[];
  dictionaries?: string | string[];
  passengers?: string | string[];
  offerId?: string | string[];
  reservedId?: string | string[];
};

type PassengerRow = PassengerFormState & { fullName: string };

const FALLBACK_PURCHASE_CONDITIONS = [
  'Tickets may be non-refundable depending on the fare class selected.',
  'Ensure that passenger names match their travel documents exactly.',
  'Changes to travel dates or routes can incur additional charges.',
  'Check the baggage allowance for each traveler before departure.',
];

const PAYSTACK_CHANNELS = ['card', 'bank_transfer', 'ussd', 'mobile_money'] as const;

const PRICE_CHECK_ENDPOINT = 'https://manzo-be.onrender.com/api/v1/flights/flightPriceLookup';
const TICKET_ISSUANCE_ENDPOINT = 'https://manzo-be.onrender.com/api/v1/flights/issueTicket';

const parseJsonParam = <T,>(value?: string | string[]): T | null => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn('Unable to parse overview screen param', error);
    return null;
  }
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeLabel = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDurationLabel = (duration?: string | null) => {
  if (!duration) return '--';

  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
  const matches = duration.match(regex);

  if (!matches) return duration.replace('PT', '');

  const hours = matches[1] ? Number(matches[1]) : 0;
  const minutes = matches[2] ? Number(matches[2]) : 0;

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
};

const buildFareDetailMap = (offer?: FlightOffer | null) => {
  const map = new Map<string, TravelerPricingDetail>();

  offer?.travelerPricings?.forEach((pricing) => {
    pricing.fareDetailsBySegment?.forEach((detail) => {
      if (detail.segmentId) {
        map.set(detail.segmentId, detail);
      }
    });
  });

  return map;
};

const getCarrierName = (segment: FlightSegment, carriers?: Record<string, string>) => {
  if (segment.operating?.carrierName) return segment.operating.carrierName;
  const operatingCode = segment.operating?.carrierCode;
  const marketingCode = segment.carrierCode;
  const code = operatingCode || marketingCode;

  if (!code) return '';

  return carriers?.[code] ?? code;
};

const formatBaggage = (detail?: TravelerPricingDetail | null) => {
  const baggage = detail?.includedCheckedBags;

  if (!baggage) return null;

  if (typeof baggage.weight === 'number') {
    const unit = baggage.weightUnit?.toUpperCase() ?? 'KG';
    return `${baggage.weight}${unit}`;
  }

  if (typeof baggage.quantity === 'number') {
    return `${baggage.quantity} bag${baggage.quantity === 1 ? '' : 's'}`;
  }

  return null;
};

const buildFallbackPassengers = (counts?: PassengerCounts | null): PassengerRow[] => {
  const fallback: PassengerRow[] = [];
  const safeCounts = counts ?? { adults: 1, children: 0, infants: 0 };

  for (let index = 0; index < (safeCounts.adults ?? 0); index += 1) {
    fallback.push({
      id: `adult-${index + 1}`,
      label: `Adult ${index + 1}`,
      type: 'adult',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '—',
      phoneCountryCode: '',
      phoneNumber: '—',
      dateOfBirth: '',
      passportNumber: '',
      fullName: `Adult ${index + 1}`,
    });
  }

  for (let index = 0; index < (safeCounts.children ?? 0); index += 1) {
    fallback.push({
      id: `child-${index + 1}`,
      label: `Child ${index + 1}`,
      type: 'child',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '—',
      phoneCountryCode: '',
      phoneNumber: '—',
      dateOfBirth: '',
      passportNumber: '',
      fullName: `Child ${index + 1}`,
    });
  }

  for (let index = 0; index < (safeCounts.infants ?? 0); index += 1) {
    fallback.push({
      id: `infant-${index + 1}`,
      label: `Infant ${index + 1}`,
      type: 'infant',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '—',
      phoneCountryCode: '',
      phoneNumber: '—',
      dateOfBirth: '',
      passportNumber: '',
      fullName: `Infant ${index + 1}`,
    });
  }

  if (!fallback.length) {
    fallback.push({
      id: 'adult-1',
      label: 'Adult 1',
      type: 'adult',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '—',
      phoneCountryCode: '',
      phoneNumber: '—',
      dateOfBirth: '',
      passportNumber: '',
      fullName: 'Adult 1',
    });
  }

  return fallback;
};

const formatPassengersForTicketing = (passengers: PassengerRow[]) =>
  passengers.map((passenger, index) => {
    const trimmedPhone = passenger.phoneNumber.replace(/\D+/g, '');
    const trimmedCode = passenger.phoneCountryCode.replace(/\D+/g, '');
    const phoneNumber = trimmedPhone;
    const countryCallingCode = trimmedCode;

    const traveler = {
      id: `${index + 1}`,
      dateOfBirth: passenger.dateOfBirth.trim(),
      name: {
        firstName: passenger.firstName.trim() || passenger.fullName || `Passenger ${index + 1}`,
        lastName: passenger.lastName.trim() || passenger.fullName || `Passenger ${index + 1}`,
      },
      gender: passenger.gender.trim() || 'UNSPECIFIED',
      contact: {
        emailAddress: passenger.email.trim(),
        phones: [
          {
            deviceType: 'MOBILE' as const,
            countryCallingCode,
            number: phoneNumber,
          },
        ],
      },
    };

    if (passenger.passportNumber.trim()) {
      return {
        ...traveler,
        documents: [
          {
            documentType: 'PASSPORT',
            number: passenger.passportNumber.trim(),
          },
        ],
      };
    }

    return traveler;
  });

function OverviewAndPaymentContent() {
  const router = useRouter();
  const { popup } = usePaystack();
  const params = useLocalSearchParams<OverviewParams>();
  const { airports } = useAirports();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricedFlight, setPricedFlight] = useState<FlightOffer | null>(null);

  const reservedId = useMemo(() => (Array.isArray(params.reservedId) ? params.reservedId[0] : params.reservedId), [params.reservedId]);
  const offerId = useMemo(() => (Array.isArray(params.offerId) ? params.offerId[0] : params.offerId), [params.offerId]);

  const selectedFlight = useMemo(() => parseJsonParam<FlightOffer>(params.flight), [params.flight]);
  const searchPayload = useMemo(() => parseJsonParam<FlightSearchPayload>(params.payload), [params.payload]);
  const dictionaries = useMemo(() => parseJsonParam<FlightDictionaries>(params.dictionaries), [params.dictionaries]);
  const passengerForms = useMemo(() => parseJsonParam<PassengerFormState[]>(params.passengers) ?? [], [params.passengers]);

  const passengerRows = useMemo<PassengerRow[]>(() => {
    if (passengerForms.length) {
      return passengerForms.map((passenger, index) => ({
        ...passenger,
        fullName:
          [passenger.title, passenger.firstName, passenger.lastName]
            .map((part) => part?.trim())
            .filter(Boolean)
            .join(' ') || passenger.label || `Passenger ${index + 1}`,
      }));
    }

    return buildFallbackPassengers(searchPayload?.passenger);
  }, [passengerForms, searchPayload?.passenger]);

  const fareDetailMap = useMemo(() => buildFareDetailMap(selectedFlight), [selectedFlight]);

  const purchaseConditions = useMemo(() => {
    const rules = (pricedFlight ?? selectedFlight)?.fareRules?.rules ?? [];

    if (!rules.length) return FALLBACK_PURCHASE_CONDITIONS;

    return rules.map((rule) => {
      const parts: string[] = [];
      if (rule.category) parts.push(rule.category);
      if (typeof rule.maxPenaltyAmount === 'string') parts.push(`Max penalty: ${rule.maxPenaltyAmount}`);
      if (rule.notApplicable) parts.push('Not applicable');
      return parts.join(' • ') || 'Fare rule';
    });
  }, [selectedFlight?.fareRules?.rules]);

  const priceSource = pricedFlight ?? selectedFlight;
  const currency = priceSource?.price?.currency ?? searchPayload?.currencyCode ?? 'NGN';
  const baseFare = Number(priceSource?.price?.base ?? 0);
  const totalFare = Number(priceSource?.price?.grandTotal ?? priceSource?.price?.total ?? baseFare);
  const taxes = Math.max(totalFare - baseFare, 0);
  const serviceFee = 20000;
  const totalWithFees = (Number.isFinite(totalFare) ? totalFare : 0) + serviceFee;

  const travelers = useMemo(() => formatPassengersForTicketing(passengerRows), [passengerRows]);

  const handleIssueTickets = async () => {
    if (!selectedFlight) {
      Alert.alert('Missing flight', 'Please return to the passenger form and pick a flight again.');
      return;
    }

    if (!reservedId) {
      Alert.alert('Missing reservation', 'We could not find your reservation ID. Please submit the passenger form again.');
      return;
    }

    if (!passengerRows.length) {
      Alert.alert('Missing passengers', 'Add at least one passenger before continuing.');
      return;
    }

    const secretKey = process.env.EXPO_PUBLIC_SECRET_KEY || '';

    if (!secretKey) {
      Alert.alert(
        'Payment unavailable',
        'Ticket issuance secret key is not configured. Please set EXPO_PUBLIC_SECRET_KEY to continue.',
      );
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Checking the latest fare before issuing tickets…');
    setStatusTone('info');

    let confirmedFlight: FlightOffer | null = null;

    try {
      const pricePayload: FlightPriceCheckPayload = { flight: selectedFlight };
      const priceResponse = await fetch(PRICE_CHECK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricePayload),
      });

      if (!priceResponse.ok) {
        const errorBody = await priceResponse.text();
        throw new Error(errorBody || `Price check failed with status ${priceResponse.status}`);
      }

      const { data } = (await priceResponse.json()) as FlightPriceCheckResponse;
      confirmedFlight = data?.flightOffers?.[0] ?? null;

      if (!confirmedFlight) {
        throw new Error('We could not verify the latest fare for this flight.');
      }

      const originalTotal = Number(selectedFlight.price?.grandTotal ?? selectedFlight.price?.total ?? selectedFlight.price?.base ?? 0);
      const confirmedTotal = Number(
        confirmedFlight.price?.grandTotal ?? confirmedFlight.price?.total ?? confirmedFlight.price?.base ?? Number.NaN,
      );

      if (!Number.isFinite(confirmedTotal)) {
        throw new Error('The verified fare amount is invalid. Please try again.');
      }

      if (Math.abs(confirmedTotal - originalTotal) > 0.009) {
        setStatusMessage(
          `Fare updated: ${formatMoney(confirmedTotal, currency)} (was ${formatMoney(originalTotal, currency)}). Please review and try again.`,
        );
        setStatusTone('error');
        Alert.alert(
          'Fare changed',
          `The latest fare is ${formatMoney(confirmedTotal, currency)}, previously ${formatMoney(originalTotal, currency)}. Please review before continuing.`,
        );
        setIsProcessing(false);
        setPricedFlight(confirmedFlight);
        return;
      }

      setPricedFlight(confirmedFlight);
      setStatusMessage('Fare confirmed. Issuing tickets…');
      setStatusTone('info');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not verify the latest fare. Please try again shortly.';
      setStatusMessage(message);
      setStatusTone('error');
      Alert.alert('Price check failed', message);
      setIsProcessing(false);
      return;
    }

    const payload = {
      flight: confirmedFlight ?? selectedFlight,
      travelers,
      reservedId,
      littelFlightInfo: [
        {
          passengerSummary: passengerRows,
          searchPayload,
          selectedExtraIds: [],
          dictionaries,
        },
      ],
    };

    let hashedData: string;

    try {
      hashedData = encryptTicketPayload(payload, secretKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not prepare your passenger details for submission.';
      Alert.alert('Ticket issuance failed', message);
      setIsProcessing(false);
      return;
    }

    setStatusMessage('Processing payment and issuing tickets…');
    setStatusTone('info');

    try {
      const response = await fetch(TICKET_ISSUANCE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashedData }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Ticket issuance failed after payment confirmation.');
      }

      await response.json();

      setStatusMessage('Tickets issued successfully! A confirmation will be sent shortly.');
      setStatusTone('success');

      Alert.alert('Tickets issued', 'Your booking has been confirmed.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/trips') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ticket issuance failed.';
      setStatusMessage(message);
      setStatusTone('error');
      Alert.alert('Ticket issuance failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeItineraries = selectedFlight?.itineraries ?? [];
  const passengerChip = useMemo(() => {
    const counts = searchPayload?.passenger;
    if (!counts) return 'Passengers';

    const parts: string[] = [];
    if (counts.adults) parts.push(`${counts.adults} Adult${counts.adults > 1 ? 's' : ''}`);
    if (counts.children) parts.push(`${counts.children} Child${counts.children > 1 ? 'ren' : ''}`);
    if (counts.infants) parts.push(`${counts.infants} Infant${counts.infants > 1 ? 's' : ''}`);
    return parts.join(' • ') || 'Passengers';
  }, [searchPayload?.passenger]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.topIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Overview & Payment</Text>
        <View style={styles.topIcon} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Step 3</Text>
        <View style={[styles.card, styles.cardGap]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Flight overview</Text>
              <Text style={styles.sectionSubtitle}>
                Review your trip details, passenger information, and purchase conditions before completing payment.
              </Text>
            </View>
            <View style={[styles.pill, styles.pillAccent]}>
              <Text style={[styles.pillText, styles.pillAccentText]}>{passengerChip}</Text>
            </View>
          </View>

          {activeItineraries.length ? (
            activeItineraries.map((itinerary, itineraryIndex) => {
              const first = itinerary.segments[0];
              const last = itinerary.segments[itinerary.segments.length - 1];
              const departureCode = first?.departure.iataCode;
              const arrivalCode = last?.arrival.iataCode;
              const departureLabel = getAirportLocation(airports, departureCode) ?? departureCode ?? '';
              const arrivalLabel = getAirportLocation(airports, arrivalCode) ?? arrivalCode ?? '';

              return (
                <View key={`${offerId ?? selectedFlight?.id}-${itineraryIndex}`} style={styles.itineraryCard}>
                  <View style={styles.itineraryHeader}>
                    <View>
                      <Text style={styles.itineraryStopLabel}>{itinerary.segments.length > 1 ? `${itinerary.segments.length - 1} stop` : 'Non-stop'}</Text>
                      <Text style={styles.itineraryRoute}>
                        {departureLabel}
                        {departureCode && departureLabel !== departureCode ? ` (${departureCode})` : ''} → {arrivalLabel}
                        {arrivalCode && arrivalLabel !== arrivalCode ? ` (${arrivalCode})` : ''}
                      </Text>
                      <Text style={styles.itineraryMeta}>
                        {formatDateLabel(first?.departure.at)} • {formatDurationLabel(itinerary.duration)}
                      </Text>
                    </View>
                    <View style={[styles.pill, styles.pillMuted]}>
                      <Text style={[styles.pillText, styles.pillMutedText]}>Itinerary {itineraryIndex + 1}</Text>
                    </View>
                  </View>

                  {itinerary.segments.map((segment) => {
                    const fareDetail = fareDetailMap.get(segment.id);
                    const carrierName = getCarrierName(segment, dictionaries?.carriers);
                    const baggageLabel = formatBaggage(fareDetail);
                    const stopCount = segment.numberOfStops ?? 0;

                    const departureCity = getCountryByIATA(airports, segment.departure.iataCode) ?? segment.departure.iataCode;
                    const arrivalCity = getCountryByIATA(airports, segment.arrival.iataCode) ?? segment.arrival.iataCode;

                    return (
                      <View key={segment.id} style={styles.segmentRow}>
                        <View style={styles.segmentHeaderRow}>
                          <View>
                            <Text style={styles.segmentAirline}>
                              {carrierName || 'Airline'} {segment.carrierCode}
                              {segment.number}
                            </Text>
                            <Text style={styles.segmentDurationText}>Duration {formatDurationLabel(segment.duration)}</Text>
                          </View>
                          <View style={[styles.pill, styles.segmentPill]}>
                            <Text style={[styles.pillText, styles.segmentPillText]}>
                              {stopCount > 0 ? `${stopCount} stop${stopCount > 1 ? 's' : ''}` : 'Non-stop flight'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.segmentLocations}>
                          <View style={styles.segmentLocation}>
                            <Text style={styles.segmentCity}>{departureCity}</Text>
                            <Text style={styles.segmentTime}>Depart • {formatTimeLabel(segment.departure.at)}</Text>
                            <Text style={styles.segmentDate}>
                              {formatDateLabel(segment.departure.at)}
                              {segment.departure.terminal ? ` • Terminal ${segment.departure.terminal}` : ''}
                            </Text>
                          </View>
                          <View style={styles.segmentConnector}>
                            <View style={styles.connectorLine} />
                            <Ionicons name="airplane" size={16} color="#d9570d" />
                            <View style={styles.connectorLine} />
                          </View>
                          <View style={styles.segmentLocation}>
                            <Text style={styles.segmentCity}>{arrivalCity}</Text>
                            <Text style={styles.segmentTime}>Arrive • {formatTimeLabel(segment.arrival.at)}</Text>
                            <Text style={styles.segmentDate}>
                              {formatDateLabel(segment.arrival.at)}
                              {segment.arrival.terminal ? ` • Terminal ${segment.arrival.terminal}` : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.segmentBadges}>
                          {fareDetail?.cabin ? (
                            <View style={styles.segmentBadge}>
                              <Text style={styles.segmentBadgeText}>Cabin {fareDetail.cabin}</Text>
                            </View>
                          ) : null}
                          {baggageLabel ? (
                            <View style={styles.segmentBadge}>
                              <Text style={styles.segmentBadgeText}>Checked bags {baggageLabel}</Text>
                            </View>
                          ) : null}
                          {stopCount > 0 ? (
                            <View style={styles.segmentBadge}>
                              <Text style={styles.segmentBadgeText}>
                                {stopCount} technical stop{stopCount > 1 ? 's' : ''}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="warning-outline" size={24} color="#b54708" />
              <Text style={styles.emptyText}>No flight was passed from the previous step.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Passenger details</Text>
        <View style={styles.card}>
          <Text style={styles.sectionSubtitle}>
            Verify that the passenger details match the travel documents before completing payment.
          </Text>
          <View style={styles.passengerList}>
            {passengerRows.map((passenger) => (
              <View key={passenger.id} style={styles.passengerRow}>
                <View style={styles.passengerHeader}>
                  <Text style={styles.passengerName}>{passenger.fullName}</Text>
                  <View style={styles.passengerType}>
                    <Text style={styles.passengerTypeText}>{passenger.type}</Text>
                  </View>
                </View>
                <Text style={styles.passengerDetail}>Email: {passenger.email || 'Not provided'}</Text>
                <Text style={styles.passengerDetail}>
                  Phone:{' '}
                  {passenger.phoneNumber
                    ? `${passenger.phoneCountryCode ? `+${passenger.phoneCountryCode} ` : ''}${passenger.phoneNumber}`
                    : 'Not provided'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Payment summary</Text>
        <View style={styles.card}>
          <Text style={styles.sectionSubtitle}>
            All fares include applicable taxes and service fees. Add-ons will be included once selected.
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base fare</Text>
            <Text style={styles.summaryValue}>{formatMoney(Number.isFinite(baseFare) ? baseFare : 0, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes & fees</Text>
            <Text style={styles.summaryValue}>{formatMoney(Number.isFinite(taxes) ? taxes : 0, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service fee</Text>
            <Text style={[styles.summaryValue, styles.summaryHighlight]}>{formatMoney(serviceFee, currency)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total due today</Text>
            <Text style={styles.summaryTotalValue}>{formatMoney(totalWithFees, currency)}</Text>
          </View>
          <Pressable
            style={[styles.primaryButton, (isProcessing || !selectedFlight || !reservedId) && styles.primaryButtonDisabled]}
            onPress={handleIssueTickets}
            disabled={isProcessing || !selectedFlight || !reservedId}
          >
            <Text style={styles.primaryButtonText}>{isProcessing ? 'Processing payment…' : 'Pay securely & issue tickets'}</Text>
          </Pressable>
          {statusMessage ? (
            <Text
              style={[
                styles.statusText,
                statusTone === 'error' && styles.statusError,
                statusTone === 'success' && styles.statusSuccess,
              ]}
            >
              {statusMessage}
            </Text>
          ) : null}
          <Text style={styles.statusHint}>
            You will be redirected to confirmation once payment succeeds. A receipt will be emailed immediately after.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Purchase conditions</Text>
        <View style={styles.card}>
          {purchaseConditions.map((condition, index) => (
            <View key={`${condition}-${index}`} style={styles.conditionRow}>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export default function OverviewAndPaymentScreen() {
  const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';

  if (!publicKey) {
    console.warn('Paystack public key is not configured. Please set EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY.');
  }

  return (
    <PaystackProvider publicKey={publicKey} currency="GHS" defaultChannels={PAYSTACK_CHANNELS} debug>
      <OverviewAndPaymentContent />
    </PaystackProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7fb',
    padding: 16,
    paddingBottom: 36,
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
  cardGap: {
    gap: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  sectionSubtitle: {
    color: '#5c6270',
    fontSize: 14,
    lineHeight: 20,
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
  itineraryCard: {
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 12,
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itineraryStopLabel: {
    fontSize: 12,
    color: '#d9570d',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itineraryRoute: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  itineraryMeta: {
    fontSize: 13,
    color: '#5c6270',
  },
  segmentRow: {
    borderWidth: 1,
    borderColor: '#eef1f7',
    backgroundColor: '#f6f8fc',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  segmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  segmentAirline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2047',
  },
  segmentDurationText: {
    fontSize: 12,
    color: '#5c6270',
  },
  segmentPill: {
    backgroundColor: '#fff4ed',
    borderColor: '#ffd6b8',
  },
  segmentPillText: {
    color: '#d9570d',
    fontWeight: '700',
  },
  segmentLocations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentLocation: {
    flex: 1,
    gap: 4,
  },
  segmentCity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2047',
  },
  segmentTime: {
    fontSize: 12,
    color: '#5c6270',
  },
  segmentDate: {
    fontSize: 11,
    color: '#9ba3b4',
  },
  segmentConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectorLine: {
    width: 1,
    height: 18,
    backgroundColor: '#dfe6f1',
  },
  segmentBadges: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  segmentBadge: {
    backgroundColor: '#f5f7fb',
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  segmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  passengerList: {
    gap: 12,
  },
  passengerRow: {
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  passengerType: {
    backgroundColor: '#e5f0ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  passengerTypeText: {
    textTransform: 'capitalize',
    fontWeight: '700',
    fontSize: 12,
    color: '#0c2047',
  },
  passengerDetail: {
    color: '#5c6270',
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  summaryValue: {
    color: '#0c2047',
    fontWeight: '800',
    fontSize: 15,
  },
  summaryHighlight: {
    color: '#d9570d',
  },
  summaryTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e6e8ec',
  },
  summaryTotalLabel: {
    textTransform: 'uppercase',
    fontSize: 13,
    color: '#d65f0b',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2047',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#f27805',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  statusText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    color: '#5c6270',
  },
  statusError: {
    color: '#b00020',
  },
  statusSuccess: {
    color: '#0f9d58',
  },
  statusHint: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11,
    color: '#9ba3b4',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  conditionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff4ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadgeText: {
    color: '#d9570d',
    fontWeight: '800',
  },
  conditionText: {
    color: '#3b4254',
    flex: 1,
    fontSize: 14,
  },
});
