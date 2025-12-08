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
import Ionicons from '@expo/vector-icons/Ionicons';
import IATAAirports from '../../data/IATA_airports.json';

const flightHeroImage =
  'https://images.unsplash.com/photo-1670699054598-776d35923e75?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string;
  City: string;
  Country: string;
};

type LocationFieldProps = {
  label: string;
  airport?: Airport | null;
  onPress: () => void;
};

const airportsData: Airport[] = IATAAirports;

function LocationField({ label, airport, onPress }: LocationFieldProps) {
  const mainLabel = airport ? airport.City : 'Select a city';
  return (
    <Pressable style={styles.locationField} onPress={onPress}>
      <View style={styles.locationIcon}>
        <Ionicons name="airplane" size={18} color="#8e8e93" />
      </View>
      <View style={styles.locationTextContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.locationMainRow}>
          <Text style={styles.locationPrimary}>{mainLabel}</Text>
          {airport && <Text style={styles.locationCode}>{airport.IATA}</Text>}
        </View>
        <Text style={styles.locationSecondary} numberOfLines={1}>
          {airport
            ? `${airport.Airport_name}${airport.Country ? `, ${airport.Country}` : ''}`
            : 'Tap to search for an airport'}
        </Text>
      </View>
    </Pressable>
  );
}

type DetailFieldProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  muted?: boolean;
};

function DetailField({ label, value, icon, muted }: DetailFieldProps) {
  return (
    <View style={styles.detailField}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#6d6d6d" />
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

    const lower = query.toLowerCase();
    return airportsData
      .filter(
        (airport) =>
          airport.City.toLowerCase().includes(lower) ||
          airport.IATA.toLowerCase().includes(lower) ||
          airport.Airport_name.toLowerCase().includes(lower) ||
          airport.Country.toLowerCase().includes(lower),
      )
      .slice(0, 50);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#6d6d6d" />
            <TextInput
              placeholder="Search by city, airport or country"
              placeholderTextColor="#a0a0a0"
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
                  <Ionicons name="airplane-outline" size={18} color="#6d6d6d" />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listPrimary} numberOfLines={1}>
                    {item.City} ({item.IATA})
                  </Text>
                  <Text style={styles.listSecondary} numberOfLines={1}>
                    {item.Airport_name}
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
        <Text style={styles.formTitle}>Search flights</Text>

        <View style={styles.locationRow}>
          <View style={styles.flexOne}>
            <LocationField
              label="From"
              airport={fromAirport}
              onPress={() => {
                setActiveField('from');
                setIsModalVisible(true);
              }}
            />
          </View>

          <View style={styles.swapWrapper}>
            <Pressable style={styles.swapButton} onPress={handleSwap} accessibilityLabel="Swap locations">
              <Ionicons name="swap-vertical" size={20} color="#6d6d6d" />
            </Pressable>
          </View>

          <View style={styles.flexOne}>
            <LocationField
              label="To"
              airport={toAirport}
              onPress={() => {
                setActiveField('to');
                setIsModalVisible(true);
              }}
            />
          </View>
        </View>

        <View style={styles.detailRow}>
          <DetailField label="Departure" value="15/07/2022" icon="calendar-outline" />
          <DetailField label="Return" value="+ Add Return Date" icon="add-circle-outline" muted />
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
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 4,
    marginTop: -60,
    marginHorizontal: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2047',
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationField: {
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
    gap: 4,
  },
  locationMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  locationPrimary: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  locationCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7a7a7a',
  },
  locationSecondary: {
    fontSize: 12,
    color: '#8a8a8f',
  },
  swapWrapper: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  detailField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
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
    color: '#6d6d6d',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  mutedText: {
    color: '#a0a0a0',
  },
  searchButton: {
    marginTop: 16,
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
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  searchInputWrapper: {
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#1f1f1f',
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
    backgroundColor: '#f3f3f3',
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
    color: '#1f1f1f',
  },
  listSecondary: {
    fontSize: 12,
    color: '#8a8a8f',
  },
  listDivider: {
    height: 1,
    backgroundColor: '#e6e6e6',
  },
});
