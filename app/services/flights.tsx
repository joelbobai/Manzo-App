import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
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

const flightHeroImage =
  'https://images.unsplash.com/photo-1670699054598-776d35923e75?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

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

type LocationFieldProps = {
  label: string;
  airport?: Airport | null;
  onPress: () => void;
};

const airportsData = IATAAirports as Airport[];

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
      <Text style={styles.locationLabel}>{label}</Text>
      <View style={styles.locationInput}>
        <View style={styles.locationIcon}>
          <Ionicons name="airplane-outline" size={19} color="#666666" />
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
};

function DetailField({ label, value, icon, muted }: DetailFieldProps) {
  return (
    <View style={styles.detailField}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#1e73f6" />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.detailValue, muted && styles.mutedText]}>{value}</Text>
      </View>
    </View>
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

export default function FlightsScreen() {
  const [fromAirport, setFromAirport] = useState<Airport | null>(
    airportsData.find((airport) => airport.IATA === 'LHE') ?? null,
  );
  const [toAirport, setToAirport] = useState<Airport | null>(
    airportsData.find((airport) => airport.IATA === 'KHI') ?? null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to'>('from');
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip' | 'multiCity'>('oneWay');

  const tripOptions: { key: typeof tripType; label: string }[] = [
    { key: 'oneWay', label: 'One way' },
    { key: 'roundTrip', label: 'Round' },
    { key: 'multiCity', label: 'Multicity' },
  ];

  const handleSelectAirport = (airport: Airport) => {
    if (activeField === 'from') {
      setFromAirport(airport);
    } else {
      setToAirport(airport);
    }
    setIsModalVisible(false);
  };

  const handleSwap = () => {
    setFromAirport(toAirport);
    setToAirport(fromAirport);
  };

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

        <View style={styles.locationRow}>
          <LocationField
            label="From"
            airport={fromAirport}
            onPress={() => {
              setActiveField('from');
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
              setActiveField('to');
              setIsModalVisible(true);
            }}
          />
        </View>

        <View style={styles.detailRow}>
          <DetailField label="Departure" value="15/07/2022" icon="calendar-outline" />
          <DetailField label="Return" value="+ Add Return Date" icon="return-up-forward" muted />
        </View>

        <View style={styles.detailRow}>
          <DetailField label="Traveller" value="1 Adult" icon="person-outline" />
          <DetailField label="Class" value="Economy" icon="briefcase-outline" />
        </View>

        <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <SearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={handleSelectAirport}
        title={activeField === 'from' ? 'Select departure airport' : 'Select destination airport'}
      />
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
    backgroundColor: '#f34f2a',
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
    position: 'relative',
    paddingRight: 40,
  },
  locationField: {
    gap: 8,
    borderRadius: 14,
  },
  locationLabel: {
    color: '#7d7d7d',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#d5deeb',
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    paddingVertical: 12,
    paddingHorizontal: 12,
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
    right: 0,
    top: '50%',
    transform: [{ translateY: -24 }],
  },
  swapButton: {
    width: 38,
    height: 38,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  mutedText: {
    color: '#7a8aa7',
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
    height:"70%",
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
});
