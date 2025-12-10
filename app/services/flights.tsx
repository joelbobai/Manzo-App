import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import IATAAirports from '../../data/IATA_airports.json';
type DatePickerTarget = { type: 'departure' | 'return' | 'leg'; legId?: string };

const flightHeroImage =
  'https://images.unsplash.com/photo-1670699054598-776d35923e75?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const SEARCH_API_URL = process.env.EXPO_PUBLIC_FLIGHT_SEARCH_URL ?? 'http://192.168.0.136:3800/api/v1/flights/flightOffersSearch';

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string;
  DST: string | null;
};

const getCityAndCountry = (airport: Airport | null | undefined) => {
  if (!airport) return { city: '', country: '' };

  const cleaned = (airport.Location_served ?? '').replace(/\u00a0/g, ' ');
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);

  return {
    city: parts[0] ?? '',
    country: parts[parts.length - 1] ?? '',
  };
};

const getAirportName = (airport: Airport | null | undefined) =>
  (airport?.Airport_name ?? '').replace(/\u00a0/g, ' ');

const toLowerSafe = (value?: string | null) => (value ?? '').toLowerCase();

const normalizeCabinClass = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized.includes('premium')) return 'PREMIUM_ECONOMY';
  if (normalized.includes('business')) return 'BUSINESS';
  if (normalized.includes('first')) return 'FIRST';

  return 'ECONOMY';
};

const formatDateForApi = (date: Date | null) => {
  if (!date) return '';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getAirportLabel = (airport: Airport | null) => {
  if (!airport) return '';

  const airportName = getAirportName(airport) || airport.IATA;
  return `${airportName} (${airport.IATA})`;
};

type LocationFieldProps = {
  label: string;
  airport?: Airport | null;
  onPress: () => void;
};

const airportsData = IATAAirports as Airport[];
const cabinClassOptions = ['Economy', 'Premium Economy', 'Business Class', 'First Class'];

type FlightLeg = {
  id: string;
  fromAirport: Airport | null;
  toAirport: Airport | null;
  date: Date | null;
  cabinClass: string;
};

type PassengerCounts = {
  adults: number;
  children: number;
  infants: number;
};

type OneWayOrRoundPayload = {
  flexible: boolean;
  currencyCode: string;
  passenger: PassengerCounts & { travelClass: string };
  flightSearch: {
    id: number;
    originLocationCode: string;
    destinationLocationCode: string;
    departureDateTimeRange: string;
  }[];
};

type MultiCityPayload = {
  currencyCode: string;
  passenger: PassengerCounts;
  flightSearch: {
    id: number;
    from: string;
    to: string;
    departureDate: string;
    originLocationCode: string;
    destinationLocationCode: string;
    tripClass: string;
  }[];
};

function LocationField({ label, airport, onPress }: LocationFieldProps) {
  const { city, country } = getCityAndCountry(airport);
  const airportName = getAirportName(airport);
  const mainLabel = airport ? city || airport.IATA : 'Select a city';
  const airportLabel = airport ? airportName : 'Tap to search for an airport';
  const secondaryLabel = airport
    ? city && country
      ? `${city} Airport, ${country}`
      : airportLabel
    : 'Tap to search for an airport';

  return (
    <Pressable style={styles.locationField} onPress={onPress}>
      <View style={{ position: 'absolute', top: 0,  left: 15, zIndex: 1 , backgroundColor: "#fff",  borderRadius: 8}}>
      <Text style={styles.locationLabel}>{label}</Text>
      </View>
      <View style={styles.locationInput}>
        <View style={styles.locationIcon}>
          <Ionicons name="airplane-outline" size={19} color="#1e73f6" />
        </View>
        <View style={styles.locationTextContainer}>
          <View style={styles.locationPrimaryRow}>
            <Text style={styles.locationPrimary} numberOfLines={1}>
              {mainLabel}
            </Text>
            {airport && <Text style={styles.locationCode}>{airport.IATA}</Text>}
          </View>
          <Text style={styles.locationSecondary} numberOfLines={1}>
            {secondaryLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

type DetailFieldProps = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  muted?: boolean;
  onPress?: () => void;
};

function DetailField({ label, value, icon, muted, onPress }: DetailFieldProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.detailField} onPress={onPress}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#1e73f6" />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.detailValue, muted && styles.mutedText]}>{value}</Text>
      </View>
    </Wrapper>
  );
}

function SearchModal({
  visible,
  onClose,
  onSelect,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  title: string;
}) {
  const [query, setQuery] = useState('');

  const filteredAirports = useMemo(() => {
    if (!query) return airportsData.slice(0, 50);

    const lower = toLowerSafe(query);
    return airportsData
      .filter((airport) => {
        const { city, country } = getCityAndCountry(airport);
        const airportName = toLowerSafe(getAirportName(airport));
        const served = toLowerSafe((airport.Location_served ?? '').replace(/\u00a0/g, ' '));

        return (
          toLowerSafe(city).includes(lower) ||
          toLowerSafe(airport.IATA).includes(lower) ||
          airportName.includes(lower) ||
          toLowerSafe(country).includes(lower) ||
          served.includes(lower)
        );
      })
      .slice(0, 50);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#1e73f6" />
            <TextInput
              placeholder="Search by city, airport or country"
              placeholderTextColor="#8fa2bc"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredAirports}
            keyExtractor={(item) => item.IATA + item.ICAO}
            ItemSeparatorComponent={() => <View style={styles.listDivider} />}
            renderItem={({ item }) => (
              <Pressable style={styles.listItem} onPress={() => onSelect(item)}>
                <View style={styles.listIcon}>
                  <Ionicons name="airplane-outline" size={18} color="#1e73f6" />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listPrimary} numberOfLines={1}>
                    {getCityAndCountry(item).city || item.IATA} ({item.IATA})
                  </Text>
                  <Text style={styles.listSecondary} numberOfLines={1}>
                    {getAirportName(item)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function PassengerModal({
  visible,
  onClose,
  counts,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  counts: PassengerCounts;
  onChange: (counts: PassengerCounts) => void;
}) {
  const adjustCount = (key: keyof PassengerCounts, delta: number) => {
    const next = Math.max(0, counts[key] + delta);
    const updated = { ...counts, [key]: key === 'adults' ? Math.max(1, next) : next };
    onChange(updated);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Passengers</Text>
          <View style={styles.passengerRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerTitle}>Adults</Text>
              <Text style={styles.passengerSubtitle}>12+ years</Text>
            </View>
            <View style={styles.counterWrapper}>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('adults', -1)}
              >
                <Text style={styles.counterLabel}>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{counts.adults}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('adults', 1)}
              >
                <Text style={styles.counterLabel}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.passengerRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerTitle}>Child</Text>
              <Text style={styles.passengerSubtitle}>2-11 years</Text>
            </View>
            <View style={styles.counterWrapper}>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('children', -1)}
              >
                <Text style={styles.counterLabel}>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{counts.children}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('children', 1)}
              >
                <Text style={styles.counterLabel}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.passengerRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerTitle}>Infant</Text>
              <Text style={styles.passengerSubtitle}>Under 2 years</Text>
            </View>
            <View style={styles.counterWrapper}>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('infants', -1)}
              >
                <Text style={styles.counterLabel}>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{counts.infants}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterButton, pressed && styles.buttonPressed]}
                onPress={() => adjustCount('infants', 1)}
              >
                <Text style={styles.counterLabel}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.searchButtonText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CabinClassModal({
  visible,
  onClose,
  onSelect,
  selected,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selected: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Cabin Class</Text>
          {cabinClassOptions.map((option) => (
            <Pressable
              key={option}
              style={({ pressed }) => [styles.listItem, pressed && styles.buttonPressed]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <View style={styles.cabinIcon}>
                <Ionicons name="briefcase-outline" size={18} color="#1e73f6" />
              </View>
              <View style={styles.listTextContainer}>
                <Text style={styles.listPrimary}>{option}</Text>
                {selected === option && <Text style={styles.selectedTag}>Selected</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatePickerModal({
  visible,
  initialDate,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  initialDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    setCurrentMonth(initialDate);
    setSelectedDate(initialDate);
  }, [initialDate]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const startDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const days: (Date | null)[] = [
    ...Array.from({ length: startDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, idx) =>
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), idx + 1),
    ),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.datePickerCard}>
          <View style={styles.dateHeader}>
            <Pressable
              style={({ pressed }) => [styles.dateNavButton, pressed && styles.buttonPressed]}
              onPress={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                )
              }
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={18} color="#1e73f6" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.dateNavButton, pressed && styles.buttonPressed]}
              onPress={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                )
              }
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={18} color="#1e73f6" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((day, idx) => {
              const isSelected = day ? isSameDay(day, selectedDate) : false;

              return (
                <Pressable
                  key={idx}
                  disabled={!day}
                  style={({ pressed }) => [
                    styles.dayCell,
                    !day && styles.dayCellEmpty,
                    isSelected && styles.dayCellSelected,
                    pressed && day && styles.buttonPressed,
                  ]}
                  onPress={() => day && setSelectedDate(day)}
                  accessibilityLabel={day ? `Select ${day.toDateString()}` : undefined}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {day ? day.getDate() : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
            onPress={() => onConfirm(selectedDate)}
          >
            <Text style={styles.searchButtonText}>Confirm date</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function FlightsScreen() {
  const router = useRouter();
  const [fromAirport, setFromAirport] = useState<Airport | null>(
    airportsData.find((airport) => airport.IATA === 'LHE') ?? null,
  );
  const [toAirport, setToAirport] = useState<Airport | null>(
    airportsData.find((airport) => airport.IATA === 'KHI') ?? null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip' | 'multiCity'>('roundTrip');
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date | null>(new Date());
  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState('Economy');
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);
  const [cabinModalVisible, setCabinModalVisible] = useState(false);
  const [activeCabinLeg, setActiveCabinLeg] = useState<string | null>(null);
  const [locationContext, setLocationContext] = useState<{
    mode: 'single' | 'multi';
    field: 'from' | 'to';
    legId?: string;
  }>({
    mode: 'single',
    field: 'from',
  });
  const [legs, setLegs] = useState<FlightLeg[]>([
    {
      id: 'leg-1',
      fromAirport: airportsData.find((airport) => airport.IATA === 'LHE') ?? null,
      toAirport: airportsData.find((airport) => airport.IATA === 'KHI') ?? null,
      date: new Date(),
      cabinClass: 'Economy',
    },
    {
      id: 'leg-2',
      fromAirport: null,
      toAirport: null,
      date: new Date(),
      cabinClass: 'Economy',
    },
  ]);

  const [datePickerConfig, setDatePickerConfig] = useState<{
    target: DatePickerTarget;
    date: Date;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (tripType === 'oneWay') {
      setReturnDate(null);
      return;
    }

    setReturnDate((prev) => {
      if (prev && prev > departureDate) return prev;

      const adjusted = new Date(departureDate);
      adjusted.setDate(departureDate.getDate() + 2);
      return adjusted;
    });
  }, [tripType, departureDate]);

  const formatDateLabel = (date: Date | null, emptyLabel = 'Select Date') =>
    date ? date.toLocaleDateString('en-GB') : emptyLabel;

  const getInitialDateForPicker = (target: DatePickerTarget) => {
    if (target.type === 'departure') return departureDate;

    if (target.type === 'return') {
      if (returnDate) return returnDate;

      const fallback = new Date(departureDate);
      fallback.setDate(departureDate.getDate() + 2);
      return fallback;
    }

    const legDate = legs.find((leg) => leg.id === target.legId)?.date;
    return legDate ?? departureDate;
  };

  const openDatePicker = (target: DatePickerTarget) => {
    const nextDate = getInitialDateForPicker(target);
    setDatePickerConfig({ target, date: nextDate });
  };

  const applyDateSelection = (target: DatePickerTarget, date: Date) => {
    if (target.type === 'departure') {
      setDepartureDate(date);
    } else if (target.type === 'return') {
      setReturnDate(date);
    } else if (target.legId) {
      setLegs((prev) => prev.map((leg) => (leg.id === target.legId ? { ...leg, date } : leg)));
    }
  };

  const handleConfirmDate = (date: Date) => {
    if (datePickerConfig) {
      applyDateSelection(datePickerConfig.target, date);
    }
    setDatePickerConfig(null);
  };

  const tripOptions: { key: typeof tripType; label: string }[] = [
    { key: 'oneWay', label: 'One way' },
    { key: 'roundTrip', label: 'Round' },
    { key: 'multiCity', label: 'Multicity' },
  ];

  const handleSelectAirport = (airport: Airport) => {
    if (locationContext.mode === 'single') {
      if (locationContext.field === 'from') {
        setFromAirport(airport);
      } else {
        setToAirport(airport);
      }
    } else {
      setLegs((prev) =>
        prev.map((leg) =>
          leg.id === locationContext.legId
            ? {
                ...leg,
                [locationContext.field === 'from' ? 'fromAirport' : 'toAirport']: airport,
              }
            : leg,
        ),
      );
    }
    setIsModalVisible(false);
  };

  const handleSwap = () => {
    setFromAirport(toAirport);
    setToAirport(fromAirport);
  };

  const handleSwapLeg = (legId: string) => {
    setLegs((prev) =>
      prev.map((leg) =>
        leg.id === legId
          ? { ...leg, fromAirport: leg.toAirport, toAirport: leg.fromAirport }
          : leg,
      ),
    );
  };

  const passengerSummary = `${passengerCounts.adults} Adult${
    passengerCounts.adults > 1 ? 's' : ''
  }, ${passengerCounts.children} Child, ${passengerCounts.infants} Infant`;

  const addLeg = () => {
    setLegs((prev) => [
      ...prev,
        {
          id: `leg-${prev.length + 1}`,
          fromAirport: null,
          toAirport: null,
          date: null,
          cabinClass: cabinClassOptions[0],
        },
      ]);
  };

  const removeLeg = (legId: string) => {
    setLegs((prev) => prev.filter((leg) => leg.id !== legId));
  };

  const handleSelectCabin = (value: string) => {
    if (tripType === 'multiCity' && activeCabinLeg) {
      setLegs((prev) =>
        prev.map((leg) => (leg.id === activeCabinLeg ? { ...leg, cabinClass: value } : leg)),
      );
    } else {
      setCabinClass(value);
    }
  };

  const buildOneWayOrRoundPayload = (): OneWayOrRoundPayload | null => {
    if (!fromAirport || !toAirport) {
      Alert.alert('Missing details', 'Please select both departure and destination airports.');
      return null;
    }

    const flightSearch = [
      {
        id: 1,
        originLocationCode: fromAirport.IATA,
        destinationLocationCode: toAirport.IATA,
        departureDateTimeRange: formatDateForApi(departureDate),
      },
    ];

    if (tripType === 'roundTrip') {
      if (!returnDate) {
        Alert.alert('Missing details', 'Please select a return date for your round trip.');
        return null;
      }

      flightSearch.push({
        id: 2,
        originLocationCode: toAirport.IATA,
        destinationLocationCode: fromAirport.IATA,
        departureDateTimeRange: formatDateForApi(returnDate),
      });
    }

    return {
      flexible: flexibleDates,
      currencyCode: 'NGN',
      passenger: {
        ...passengerCounts,
        travelClass: normalizeCabinClass(cabinClass),
      },
      flightSearch,
    };
  };

  const buildMultiCityPayload = (): MultiCityPayload | null => {
    const incompleteLeg = legs.find(
      (leg) => !leg.fromAirport || !leg.toAirport || !leg.date,
    );

    if (incompleteLeg) {
      Alert.alert(
        'Incomplete leg',
        'Please make sure every multi-city leg has departure, destination, and date.',
      );
      return null;
    }

    return {
      currencyCode: 'NGN',
      passenger: { ...passengerCounts },
      flightSearch: legs.map((leg, index) => ({
        id: index + 1,
        from: getAirportLabel(leg.fromAirport),
        to: getAirportLabel(leg.toAirport),
        departureDate: formatDateForApi(leg.date),
        originLocationCode: leg.fromAirport?.IATA ?? '',
        destinationLocationCode: leg.toAirport?.IATA ?? '',
        tripClass: normalizeCabinClass(leg.cabinClass),
      })),
    };
  };

  const handleSearch = async () => {
    const payload =
      tripType === 'multiCity' ? buildMultiCityPayload() : buildOneWayOrRoundPayload();

    if (!payload) return;

    setIsSearching(true);

    console.log('Flight search payload', payload);

    if (!SEARCH_API_URL) {
      setTimeout(() => {
        router.push({
          pathname: '/services/flight-results',
          params: { payload: JSON.stringify(payload), source: 'offline' },
        });
        setIsSearching(false);
      }, 600);
      return;
    }

    console.log('SEARCH_API_URL', SEARCH_API_URL);
    console.log('Submitting search to API payload:', payload);
    try {
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('Submitting search to API JSON.stringify(payload)', JSON.stringify(payload));
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((result as { message?: string })?.message ?? 'Search request failed');
      }

      router.push({
        pathname: '/services/flight-results',
        params: { data: JSON.stringify(result), source: 'live' },
      });
    } catch (error) {
      console.error('Flight search error', error);
      Alert.alert('Search failed', (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectedCabinClass =
    tripType === 'multiCity' && activeCabinLeg
      ? legs.find((leg) => leg.id === activeCabinLeg)?.cabinClass ?? cabinClass
      : cabinClass;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Image source={flightHeroImage} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Doesn’t write on</Text>
          <Text style={styles.heroTitle}>Plan your next flight</Text>
          <Text style={styles.heroSubtitle}>
            Find great fares and flexible routes before you take off.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.tripTypeRow}>
          {tripOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.tripTypeButton, tripType === option.key && styles.tripTypeButtonActive]}
              onPress={() => setTripType(option.key)}
            >
              <Text
                style={[styles.tripTypeLabel, tripType === option.key && styles.tripTypeLabelActive]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tripType !== 'multiCity' ? (
          <>
            <View style={styles.locationRow}>
              <LocationField
                label="From"
                airport={fromAirport}
                onPress={() => {
                  setLocationContext({ mode: 'single', field: 'from' });
                  setIsModalVisible(true);
                }}
              />

              <View style={styles.swapWrapper}>
                <Pressable
                  style={styles.swapButton}
                  onPress={handleSwap}
                  accessibilityLabel="Swap locations"
                >
                  <Ionicons name="swap-vertical" size={18} color="#6a6a6a" />
                </Pressable>
              </View>

              <LocationField
                label="To"
                airport={toAirport}
                onPress={() => {
                  setLocationContext({ mode: 'single', field: 'to' });
                  setIsModalVisible(true);
                }}
              />
            </View>

            <View style={styles.detailRow}>
              <DetailField
                label="Departure"
                value={formatDateLabel(departureDate)}
                icon="calendar-outline"
                onPress={() => openDatePicker({ type: 'departure' })}
              />
              {tripType === 'roundTrip' && (
                <DetailField
                  label="Return"
                  value={formatDateLabel(returnDate, '+ Add Return Date')}
                  icon="return-up-forward"
                  muted={!returnDate}
                  onPress={() => openDatePicker({ type: 'return' })}
                />
              )}
            </View>

            <View style={styles.detailRow}>
              <DetailField
                label="Traveller"
                value={passengerSummary}
                icon="person-outline"
                onPress={() => setPassengerModalVisible(true)}
              />
              <DetailField
                label="Class"
                value={cabinClass}
                icon="briefcase-outline"
                onPress={() => {
                  setActiveCabinLeg(null);
                  setCabinModalVisible(true);
                }}
              />
            </View>
          </>
        ) : (
          <>
            {legs.map((leg, index) => (
              <View key={leg.id} style={styles.legCard}>
                <View style={styles.legHeader}>
                  <Text style={styles.legTitle}>Leg {index + 1}</Text>
                  <View style={styles.legActions}>
                    <Pressable
                      style={({ pressed }) => [styles.legActionButton, pressed && styles.buttonPressed]}
                      onPress={() => handleSwapLeg(leg.id)}
                      accessibilityLabel={`Swap locations for leg ${index + 1}`}
                    >
                      <Ionicons name="swap-vertical" size={18} color="#1e73f6" />
                    </Pressable>
                    {legs.length > 1 && (
                      <Pressable
                        style={({ pressed }) => [styles.legActionButton, pressed && styles.buttonPressed]}
                        onPress={() => removeLeg(leg.id)}
                        accessibilityLabel={`Remove leg ${index + 1}`}
                      >
                        <Ionicons name="trash-outline" size={18} color="#d97757" />
                      </Pressable>
                    )}
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <LocationField
                    label="From"
                    airport={leg.fromAirport}
                    onPress={() => {
                      setLocationContext({ mode: 'multi', field: 'from', legId: leg.id });
                      setIsModalVisible(true);
                    }}
                  />

                  <View style={styles.swapWrapper}>
                    <Pressable
                      style={styles.swapButton}
                      onPress={() => handleSwapLeg(leg.id)}
                      accessibilityLabel={`Swap locations for leg ${index + 1}`}
                    >
                      <Ionicons name="swap-vertical" size={18} color="#6a6a6a" />
                    </Pressable>
                  </View>

                  <LocationField
                    label="To"
                    airport={leg.toAirport}
                    onPress={() => {
                      setLocationContext({ mode: 'multi', field: 'to', legId: leg.id });
                      setIsModalVisible(true);
                    }}
                  />
                </View>

                <View style={styles.detailRow}>
                  <DetailField
                    label="Departure"
                    value={formatDateLabel(leg.date)}
                    icon="calendar-outline"
                    onPress={() => openDatePicker({ type: 'leg', legId: leg.id })}
                  />
                  <DetailField
                    label="Cabin"
                    value={leg.cabinClass}
                    icon="briefcase-outline"
                    onPress={() => {
                      setActiveCabinLeg(leg.id);
                      setCabinModalVisible(true);
                    }}
                  />
                </View>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.addLegButton, pressed && styles.buttonPressed]}
              onPress={addLeg}
            >
              <Text style={styles.addLegText}>Add another leg</Text>
            </Pressable>

            <View style={styles.detailRow}>
              <DetailField
                label="Passengers"
                value={passengerSummary}
                icon="person-outline"
                onPress={() => setPassengerModalVisible(true)}
              />
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.flexibleRow, pressed && styles.buttonPressed]}
          onPress={() => setFlexibleDates((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: flexibleDates }}
          accessibilityLabel="My dates are flexible"
        >
          <View style={[styles.checkboxBase, flexibleDates && styles.checkboxChecked]}>
            {flexibleDates && <Ionicons name="checkmark" size={14} color="#ffffff" />}
          </View>
          <Text style={styles.flexibleLabel}>My Dates Are Flexible</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <SearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={handleSelectAirport}
        title={
          locationContext.field === 'from'
            ? 'Select departure airport'
            : 'Select destination airport'
        }
      />

      <PassengerModal
        visible={passengerModalVisible}
        onClose={() => setPassengerModalVisible(false)}
        counts={passengerCounts}
        onChange={setPassengerCounts}
      />

      <CabinClassModal
        visible={cabinModalVisible}
        onClose={() => {
          setCabinModalVisible(false);
          setActiveCabinLeg(null);
        }}
        selected={selectedCabinClass}
        onSelect={handleSelectCabin}
      />

      <DatePickerModal
        visible={!!datePickerConfig}
        initialDate={datePickerConfig?.date ?? new Date()}
        onClose={() => setDatePickerConfig(null)}
        onConfirm={handleConfirmDate}
      />

      {isSearching && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.loadingLogo}
              contentFit="contain"
            />
            <ActivityIndicator size="large" color="#1e73f6" />
            <Text style={styles.loadingText}>Searching for flights...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    backgroundColor: '#f5f7fb',
  },
  hero: {
    height: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 32, 71, 0.35)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 6,
  },
  heroEyebrow: {
    color: '#e7eefc',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#e7eefc',
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0c2047',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    marginTop: -60,
    marginHorizontal: 16,
  },
  tripTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d5deeb',
  },
  tripTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tripTypeButtonActive: {
    backgroundColor: '#ff7b00',
    shadowColor: '#f34f2a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  tripTypeLabel: {
    color: '#7a8aa7',
    fontWeight: '700',
    fontSize: 14,
  },
  tripTypeLabelActive: {
    color: '#ffffff',
  },
  locationRow: {
    gap: 14,
    width: '100%',
    position: 'relative',
  },
  locationField: {
    gap: 8,
    borderRadius: 14,
    width: '100%',
  },
  locationLabel: {
    color: '#7d7d7d',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    paddingHorizontal: 4,
   
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#d5deeb',
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 10,
  },
  locationTextContainer: {
    flex: 1,
    gap: 4,
  },
  locationPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationPrimary: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3e3e3e',
  },
  locationCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b6b6b',
    letterSpacing: 0.3,
  },
  locationSecondary: {
    fontSize: 12,
    color: '#747474',
  },
  swapWrapper: {
    position: 'absolute',
    right: 25,
    top: '50%',
    transform: [{ translateY: -24 }],
    zIndex: 2,
  },
  swapButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  detailField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d5deeb',
    borderRadius: 16,
    backgroundColor: '#f8fbff',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextContainer: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4c4c4c',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0c2047',
  },
  mutedText: {
    color: '#7a8aa7',
  },
  legCard: {
    borderWidth: 1,
    borderColor: '#dce6f3',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#f9fbff',
    marginTop: 10,
    gap: 12,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  legActions: {
    flexDirection: 'row',
    gap: 8,
  },
  legActionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce6f3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  addLegButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e73f6',
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
  },
  addLegText: {
    color: '#1e73f6',
    fontWeight: '800',
    fontSize: 14,
  },
  flexibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e73f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#1e73f6',
  },
  flexibleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2047',
  },
  searchButton: {
    marginTop: 4,
    backgroundColor: '#1e73f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1e73f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 32, 71, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 14,
    width: '70%',
    shadowColor: '#0c2047',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  loadingLogo: {
    width: 82,
    height: 82,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c2047',
  },
  flexOne: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    height: '70%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  searchInputWrapper: {
    borderWidth: 1,
    borderColor: '#d5deeb',
    borderRadius: 12,
    backgroundColor: '#f8fbff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#0c2047',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTextContainer: {
    flex: 1,
    gap: 2,
  },
  listPrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0c2047',
  },
  listSecondary: {
    fontSize: 12,
    color: '#50607a',
  },
  listDivider: {
    height: 1,
    backgroundColor: '#ecf1f8',
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  passengerInfo: {
    gap: 2,
  },
  passengerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0c2047',
  },
  passengerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d5deeb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e73f6',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  cabinIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTag: {
    marginTop: 2,
    fontSize: 12,
    color: '#1e73f6',
    fontWeight: '700',
  },
  datePickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 18,
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce6f3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#7a8aa7',
    fontWeight: '700',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: `${(100 - 6 * 6) / 7}%`,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dce6f3',
    backgroundColor: '#f8fbff',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: '#1e73f6',
    borderColor: '#1e73f6',
  },
  dayLabel: {
    color: '#0c2047',
    fontWeight: '700',
  },
  dayLabelSelected: {
    color: '#ffffff',
  },
});
