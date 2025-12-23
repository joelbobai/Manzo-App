import Ionicons from '@expo/vector-icons/Ionicons';
import CryptoJS from 'crypto-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import type { FlightDictionaries, FlightOffer, FlightSearchPayload, FlightSegment, PassengerCounts } from '@/types/flight';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatMoney } from './flight-results';

type PassengerFormParams = {
  flight?: string | string[];
  payload?: string | string[];
  dictionaries?: string | string[];
  offerId?: string | string[];
};

type PassengerField =
  | 'title'
  | 'gender'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phoneCountryCode'
  | 'phoneNumber'
  | 'dateOfBirth'
  | 'passportNumber';

type PassengerFormState = {
  id: string;
  label: string;
  type: 'adult' | 'child' | 'infant';
  title: string;
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  passportNumber: string;
};

const parseJsonParam = <T,>(value?: string | string[]): T | null => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn('Unable to parse passenger form param', error);
    return null;
  }
};

const buildPassengerForms = (counts?: PassengerCounts | null): PassengerFormState[] => {
  const safeCounts = counts ?? { adults: 1, children: 0, infants: 0 };
  const forms: PassengerFormState[] = [];

  for (let i = 0; i < (safeCounts.adults ?? 0); i += 1) {
    forms.push({
      id: `adult-${i + 1}`,
      label: `Adult ${i + 1}`,
      type: 'adult',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '',
      phoneNumber: '',
      dateOfBirth: '',
      passportNumber: '',
    });
  }

  for (let i = 0; i < (safeCounts.children ?? 0); i += 1) {
    forms.push({
      id: `child-${i + 1}`,
      label: `Child ${i + 1}`,
      type: 'child',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '',
      phoneNumber: '',
      dateOfBirth: '',
      passportNumber: '',
    });
  }

  for (let i = 0; i < (safeCounts.infants ?? 0); i += 1) {
    forms.push({
      id: `infant-${i + 1}`,
      label: `Infant ${i + 1}`,
      type: 'infant',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '',
      phoneNumber: '',
      dateOfBirth: '',
      passportNumber: '',
    });
  }

  if (!forms.length) {
    forms.push({
      id: 'adult-1',
      label: 'Adult 1',
      type: 'adult',
      title: '',
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '',
      phoneNumber: '',
      dateOfBirth: '',
      passportNumber: '',
    });
  }

  return forms;
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

const PassengerCard = ({
  passenger,
  onChange,
}: {
  passenger: PassengerFormState;
  onChange: (id: string, field: PassengerField, value: string) => void;
}) => (
  <View style={styles.passengerCard}>
    <View style={styles.passengerCardHeader}>
      <Text style={styles.passengerLabel}>{passenger.label}</Text>
      <Text style={styles.passengerPill}>{passenger.type}</Text>
    </View>
    <View style={styles.inputGrid}>
      <TextInput
        style={styles.input}
        placeholder="Title (e.g. MR, MRS)"
        value={passenger.title}
        onChangeText={(text) => onChange(passenger.id, 'title', text.toUpperCase())}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Gender (MALE/FEMALE/OTHER)"
        value={passenger.gender}
        onChangeText={(text) => onChange(passenger.id, 'gender', text.toUpperCase())}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="First name"
        value={passenger.firstName}
        onChangeText={(text) => onChange(passenger.id, 'firstName', text)}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Last name"
        value={passenger.lastName}
        onChangeText={(text) => onChange(passenger.id, 'lastName', text)}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={passenger.email}
        onChangeText={(text) => onChange(passenger.id, 'email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone country code (e.g. 234)"
        value={passenger.phoneCountryCode}
        onChangeText={(text) => onChange(passenger.id, 'phoneCountryCode', text.replace(/\D+/g, ''))}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={passenger.phoneNumber}
        onChangeText={(text) => onChange(passenger.id, 'phoneNumber', text)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Date of birth (YYYY-MM-DD)"
        value={passenger.dateOfBirth}
        onChangeText={(text) => onChange(passenger.id, 'dateOfBirth', text)}
        keyboardType="numbers-and-punctuation"
      />
      <TextInput
        style={styles.input}
        placeholder="Passport number (optional)"
        value={passenger.passportNumber}
        onChangeText={(text) => onChange(passenger.id, 'passportNumber', text)}
      />
    </View>
  </View>
);

export default function PassengerFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PassengerFormParams>();

  const selectedFlight = useMemo(() => parseJsonParam<FlightOffer>(params.flight), [params.flight]);
  const searchPayload = useMemo(() => parseJsonParam<FlightSearchPayload>(params.payload), [params.payload]);
  const dictionaries = useMemo(() => parseJsonParam<FlightDictionaries>(params.dictionaries), [params.dictionaries]);
  const offerIdParam = useMemo(() => (Array.isArray(params.offerId) ? params.offerId[0] : params.offerId), [params.offerId]);

  const itinerary = selectedFlight?.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const passengerCounts = searchPayload?.passenger;

  const [forms, setForms] = useState<PassengerFormState[]>(() => buildPassengerForms(passengerCounts));
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (id: string, field: PassengerField, value: string) => {
    setForms((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const formatPassengersForTicketing = (passengers: PassengerFormState[]) =>
    passengers.map((passenger, index) => {
      const trimmedPhone = passenger.phoneNumber.replace(/\D+/g, '');
      const trimmedCode = passenger.phoneCountryCode.replace(/\D+/g, '');
      const phoneNumber = trimmedPhone;
      const countryCallingCode = trimmedCode;

      const traveler = {
        id: `${index + 1}`,
        dateOfBirth: passenger.dateOfBirth.trim(),
        name: {
          firstName: passenger.firstName.trim(),
          lastName: passenger.lastName.trim(),
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

  const handleSubmit = async () => {
    const hasMissing = forms.some(
      (passenger) =>
        !passenger.title.trim() ||
        !passenger.gender.trim() ||
        !passenger.firstName.trim() ||
        !passenger.lastName.trim() ||
        !passenger.email.trim() ||
        !passenger.phoneCountryCode.trim() ||
        !passenger.phoneNumber.trim() ||
        !passenger.dateOfBirth.trim(),
    );

    if (hasMissing) {
      Alert.alert('Add passenger details', 'Please complete all fields for each traveller before continuing.');
      return;
    }

    if (!selectedFlight) {
      Alert.alert('Missing flight', 'Please return to flight results and select a flight.');
      return;
    }

    if (!dictionaries) {
      Alert.alert('Missing dictionaries', 'Flight dictionaries are required to complete this booking step.');
      return;
    }

    const travelers = formatPassengersForTicketing(forms);
    const ticketPayload = {
      flight: selectedFlight,
      travelers,
      littelFlightInfo: [{ dictionaries }],
    };

    const secretKey = process.env.EXPO_PUBLIC_SECRET_KEY || 'CHANGE_ME';
    const hashedData = CryptoJS.AES.encrypt(JSON.stringify(ticketPayload), secretKey).toString();

    setIsLoading(true);

    try {
      const response = await fetch('https://manzo-be.onrender.com/api/v1/flights/reserveTicket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashedData }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Ticket reservation failed.');
      }

      const data = await response.json();
      const reservedId = data?.reservedId;

      if (!reservedId) {
        Alert.alert('Reservation error', 'We could not obtain a reservation ID. Please try again.');
        return;
      }

      const offerId = offerIdParam || selectedFlight.id;

      if (!offerId) {
        Alert.alert('Missing offer ID', 'Unable to determine the selected offer. Please try again.');
        return;
      }

      router.push({
        pathname: '/overviewAndpayment',
        params: {
          offerId,
          reservedId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ticket reservation failed.';
      Alert.alert('Reservation failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.topIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
          <Text style={styles.topTitle}>Passenger form</Text>
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
                    <Text style={styles.priceChipText}>
                      {selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ??
                        passengerCounts?.travelClass ??
                        'Cabin'}
                    </Text>
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
          <Text style={styles.sectionEyebrow}>Passenger details</Text>
          <View style={[styles.card, styles.cardGap]}>
            {forms.map((passenger) => (
              <PassengerCard key={passenger.id} passenger={passenger} onChange={handleChange} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Summary</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Fill in each traveller&apos;s legal name and contact information. We&apos;ll reuse this information on the payment
              screen so you don&apos;t need to re-enter it later.
            </Text>
            <Pressable style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Saving...' : 'Save passenger details'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
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
  cardGap: {
    gap: 16,
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
  passengerCard: {
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  passengerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2047',
  },
  passengerPill: {
    backgroundColor: '#e5f0ff',
    color: '#0c2047',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
    fontSize: 12,
  },
  inputGrid: {
    gap: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0c2047',
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
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
