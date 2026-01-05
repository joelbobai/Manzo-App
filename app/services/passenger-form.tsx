import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { FlightDictionaries, FlightOffer, FlightSearchPayload, PassengerCounts } from '@/types/flight';
import { encryptTicketPayload } from '@/utils/encrypt-ticket';
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

const TITLE_OPTIONS = ['MR', 'MRS', 'MS', 'MISS', 'MASTER', 'DR'];

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];

const COUNTRY_CODES = [
  { label: 'United States (+1)', value: '1' },
  { label: 'Nigeria (+234)', value: '234' },
  { label: 'United Kingdom (+44)', value: '44' },
  { label: 'Ghana (+233)', value: '233' },
  { label: 'Kenya (+254)', value: '254' },
  { label: 'South Africa (+27)', value: '27' },
  { label: 'United Arab Emirates (+971)', value: '971' },
  { label: 'India (+91)', value: '91' },
  { label: 'Canada (+1)', value: '1' },
  { label: 'France (+33)', value: '33' },
];

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

const PassengerCard = ({
  passenger,
  onChange,
}: {
  passenger: PassengerFormState;
  onChange: (id: string, field: PassengerField, value: string) => void;
}) => {
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [iosSelectedDate, setIosSelectedDate] = useState<Date>(
    passenger.dateOfBirth ? new Date(passenger.dateOfBirth) : new Date(1990, 0, 1),
  );

  useEffect(() => {
    if (passenger.dateOfBirth) {
      setIosSelectedDate(new Date(passenger.dateOfBirth));
    }
  }, [passenger.dateOfBirth]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    const safeDate = date > today ? today : date;
    setIosSelectedDate(safeDate);
    onChange(passenger.id, 'dateOfBirth', formatDate(safeDate));
  };

  const openNativeDatePicker = () => {
    const initialDate = passenger.dateOfBirth ? new Date(passenger.dateOfBirth) : new Date(1990, 0, 1);
    const maximumDate = new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: 'date',
        maximumDate,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleDateSelect(selectedDate);
          }
        },
      });
      return;
    }

    setIosSelectedDate(initialDate);
    setShowIOSDatePicker(true);
  };

  const renderOptionModal = ({
    visible,
    onClose,
    options,
    onSelect,
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    onSelect: (value: string) => void;
  }) => (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.optionRow}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={styles.optionLabel}>{option}</Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderCountryModal = () => (
    <Modal transparent animationType="fade" visible={showCountryModal} onRequestClose={() => setShowCountryModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowCountryModal(false)}>
        <Pressable
          style={styles.modalContent}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView>
            {COUNTRY_CODES.map((country) => (
              <TouchableOpacity
                key={country.value + country.label}
                style={styles.optionRow}
                onPress={() => {
                  onChange(passenger.id, 'phoneCountryCode', country.value);
                  setShowCountryModal(false);
                }}
              >
                <Text style={styles.optionLabel}>{country.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.passengerCard}>
      <View style={styles.passengerCardHeader}>
        <Text style={styles.passengerLabel}>{passenger.label}</Text>
        <Text style={styles.passengerPill}>{passenger.type}</Text>
      </View>
      <View style={styles.inputGrid}>
        <Pressable style={styles.selectInput} onPress={() => setShowTitleModal(true)}>
          <Text style={passenger.title ? styles.selectValue : styles.selectPlaceholder}>
            {passenger.title || 'Select title'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#5c6270" />
        </Pressable>
        <Pressable style={styles.selectInput} onPress={() => setShowGenderModal(true)}>
          <Text style={passenger.gender ? styles.selectValue : styles.selectPlaceholder}>
            {passenger.gender || 'Select gender'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#5c6270" />
        </Pressable>
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
        <View style={styles.phoneRow}>
          <Pressable style={styles.phoneCode} onPress={() => setShowCountryModal(true)}>
            <Text style={passenger.phoneCountryCode ? styles.selectValue : styles.selectPlaceholder}>
              {passenger.phoneCountryCode ? `+${passenger.phoneCountryCode}` : 'Code'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#5c6270" />
          </Pressable>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            value={passenger.phoneNumber}
            onChangeText={(text) => onChange(passenger.id, 'phoneNumber', text)}
            keyboardType="phone-pad"
            placeholderTextColor="#9ba3b4"
          />
        </View>
        <Pressable style={styles.selectInput} onPress={openNativeDatePicker}>
          <Text style={passenger.dateOfBirth ? styles.selectValue : styles.selectPlaceholder}>
            {passenger.dateOfBirth || 'Select date of birth'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#5c6270" />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Passport number (optional)"
          value={passenger.passportNumber}
          onChangeText={(text) => onChange(passenger.id, 'passportNumber', text)}
        />
      </View>

      {renderOptionModal({
        visible: showTitleModal,
        onClose: () => setShowTitleModal(false),
        options: TITLE_OPTIONS,
        onSelect: (value) => onChange(passenger.id, 'title', value),
      })}

      {renderOptionModal({
        visible: showGenderModal,
        onClose: () => setShowGenderModal(false),
        options: GENDER_OPTIONS,
        onSelect: (value) => onChange(passenger.id, 'gender', value),
      })}

      {renderCountryModal()}

      {Platform.OS === 'ios' && showIOSDatePicker ? (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowIOSDatePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowIOSDatePicker(false)}>
            <Pressable style={[styles.modalContent, styles.iosPickerContent]} onPress={(event) => event.stopPropagation()}>
              <DateTimePicker
                value={iosSelectedDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setIosSelectedDate(selectedDate);
                  }
                }}
              />
              <View style={styles.dateModalActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setShowIOSDatePicker(false)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => {
                    handleDateSelect(iosSelectedDate);
                    setShowIOSDatePicker(false);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Confirm</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

export default function PassengerFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PassengerFormParams>();

  const selectedFlight = useMemo(() => parseJsonParam<FlightOffer>(params.flight), [params.flight]);
  const searchPayload = useMemo(() => parseJsonParam<FlightSearchPayload>(params.payload), [params.payload]);
  const dictionaries = useMemo(() => parseJsonParam<FlightDictionaries>(params.dictionaries), [params.dictionaries]);
  const offerIdParam = useMemo(() => (Array.isArray(params.offerId) ? params.offerId[0] : params.offerId), [params.offerId]);

  const passengerCounts = searchPayload?.passenger;
  const itinerary = selectedFlight?.itineraries?.[0];
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const passengerLabel = formatPassengerLabel(passengerCounts, selectedFlight?.travelerPricings?.length);
  const routeLabel = `${firstSegment?.departure.iataCode ?? '--'} → ${lastSegment?.arrival.iataCode ?? '--'}`;
  const departureLabel = formatDepartureDate(firstSegment?.departure.at);
  const cabinLabel =
    selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? passengerCounts?.travelClass ?? 'Cabin';
  const priceLabel = selectedFlight?.price?.grandTotal
    ? formatMoney(Number(selectedFlight.price.grandTotal), selectedFlight.price.currency)
    : 'Price unavailable';

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
    const hashedData = encryptTicketPayload(ticketPayload, secretKey);

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
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#0c2047',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardGap: {
    gap: 16,
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
  selectInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectPlaceholder: {
    color: '#9ba3b4',
    fontSize: 14,
  },
  selectValue: {
    color: '#0c2047',
    fontSize: 14,
    fontWeight: '600',
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
  primaryButtonSmall: {
    backgroundColor: '#f27805',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e6e8ec',
  },
  secondaryButtonText: {
    color: '#0c2047',
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneCode: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#d8dde5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0c2047',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    maxHeight: '70%',
  },
  iosPickerContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  optionLabel: {
    fontSize: 15,
    color: '#0c2047',
    fontWeight: '600',
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
});
