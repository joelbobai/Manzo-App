import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

type FlightCard = {
  id: string;
  airline: string;
  airlineCode: string;
  aircraft: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  duration: string;
  price: string;
  tagColor: string;
  flightNumber: string;
};

export default function FlightResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; payload?: string; source?: string }>();

  const parsedResult = useMemo(() => {
    if (!params.data) return null;

    try {
      return JSON.parse(params.data);
    } catch (error) {
      console.error('Unable to parse search result', error);
      return null;
    }
  }, [params.data]);

  const parsedPayload = useMemo(() => {
    if (!params.payload) return null;

    try {
      return JSON.parse(params.payload);
    } catch (error) {
      console.error('Unable to parse search payload', error);
      return null;
    }
  }, [params.payload]);

  const formatDate = (value?: string | null) => {
    if (!value) return '';

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const firstLeg = parsedPayload?.flightSearch?.[0];
  const lastLeg = parsedPayload?.flightSearch?.[parsedPayload?.flightSearch?.length - 1 ?? 0];

  const summary = {
    fromCode: firstLeg?.originLocationCode || 'SBY',
    toCode: lastLeg?.destinationLocationCode || 'DPS',
    fromCity: firstLeg?.from || 'Surabaya, East Java',
    toCity: lastLeg?.to || 'Denpasar, Bali',
    dateLabel: formatDate(firstLeg?.departureDate) || 'Dec 21, 2023',
    timeLabel: '09:00 AM',
  };

  const flights: FlightCard[] = (
    (parsedResult as { flights?: FlightCard[] } | null)?.flights ?? (
      parsedResult as { data?: FlightCard[] } | null
    )?.data ??
    []
  ).map((flight, index) => ({
    ...flight,
    id: flight.id || `${index + 1}`,
    tagColor: flight.tagColor || '#1e73f6',
  }));

  const mockFlights: FlightCard[] = [
    {
      id: '1',
      airline: 'Garuda Indonesia',
      airlineCode: 'GA',
      aircraft: 'A330',
      fromCode: summary.fromCode,
      toCode: summary.toCode,
      fromCity: summary.fromCity,
      toCity: summary.toCity,
      departureTime: summary.timeLabel,
      duration: '4h30m',
      price: '$320',
      tagColor: '#1e73f6',
      flightNumber: 'GA-01',
    },
    {
      id: '2',
      airline: 'Lion Air',
      airlineCode: 'JT',
      aircraft: 'JT-25',
      fromCode: summary.fromCode,
      toCode: summary.toCode,
      fromCity: summary.fromCity,
      toCity: summary.toCity,
      departureTime: '12:30 PM',
      duration: '3h50m',
      price: '$479',
      tagColor: '#F89A1C',
      flightNumber: 'JT-25',
    },
    {
      id: '3',
      airline: 'Citilink',
      airlineCode: 'QG',
      aircraft: 'QG-101',
      fromCode: summary.fromCode,
      toCode: summary.toCode,
      fromCity: summary.fromCity,
      toCity: summary.toCity,
      departureTime: '05:45 PM',
      duration: '4h10m',
      price: '$289',
      tagColor: '#3DBE29',
      flightNumber: 'QG-101',
    },
  ];

  const cardsToShow = flights.length > 0 ? flights : mockFlights;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.topIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Result Search</Text>
        <View style={styles.topIcon}>
          <Ionicons name="options" size={20} color="#ffffff" />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.routeRow}>
          <View style={styles.locationBlock}>
            <Text style={styles.airportCode}>{summary.fromCode}</Text>
            <Text style={styles.airportCity}>{summary.fromCity}</Text>
          </View>

          <View style={styles.routeConnector}>
            <Ionicons name="airplane" size={18} color="#1e73f6" />
            <View style={styles.routeLine} />
          </View>

          <View style={styles.locationBlock}>
            <Text style={styles.airportCode}>{summary.toCode}</Text>
            <Text style={styles.airportCity}>{summary.toCity}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color="#1e73f6" />
            <Text style={styles.metaText}>{summary.dateLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#1e73f6" />
            <Text style={styles.metaText}>{summary.timeLabel}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Result</Text>

      {cardsToShow.map((flight) => (
        <View key={flight.id} style={styles.flightCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: `${flight.tagColor}1A` }]}>
              <Text style={[styles.badgeText, { color: flight.tagColor }]}>Airlines</Text>
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.airlineName}>{flight.airline}</Text>
              <Text style={styles.aircraft}>{flight.aircraft}</Text>
            </View>
            <Text style={styles.price}>{flight.price}/pax</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.flightRow}>
            <View style={styles.locationColumn}>
              <Text style={styles.airportCodeLarge}>{flight.fromCode}</Text>
              <Text style={styles.cityLabel}>{flight.fromCity}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={14} color="#1e73f6" />
                <Text style={styles.infoText}>{summary.dateLabel}</Text>
              </View>
            </View>

            <View style={styles.centerInfo}>
              <Text style={styles.duration}>{flight.duration}</Text>
              <Ionicons name="airplane" size={18} color="#1e73f6" />
              <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
            </View>

            <View style={styles.locationColumn}>
              <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{flight.toCode}</Text>
              <Text style={[styles.cityLabel, styles.alignEnd]}>{flight.toCity}</Text>
              <View style={[styles.infoRow, styles.justifyEnd]}>
                <Ionicons name="time" size={14} color="#1e73f6" />
                <Text style={styles.infoText}>{flight.departureTime}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    backgroundColor: '#f5f7fb',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c2047',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 6,
  },
  topIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1e73f6',
  },
  topTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4eaf5',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBlock: {
    flex: 1,
    gap: 4,
  },
  airportCode: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c2047',
  },
  airportCity: {
    fontSize: 12,
    color: '#4c4c4c',
  },
  routeConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  routeLine: {
    width: 54,
    height: 1,
    backgroundColor: '#d8dfea',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f4fb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metaText: {
    color: '#0c2047',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c2047',
    marginTop: 4,
    marginBottom: -2,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4eaf5',
    gap: 12,
    shadowColor: '#0c2047',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  headerTitles: {
    flex: 1,
    gap: 4,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  aircraft: {
    fontSize: 12,
    color: '#4c4c4c',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  divider: {
    height: 1,
    backgroundColor: '#eef1f7',
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationColumn: {
    flex: 1,
    gap: 4,
  },
  airportCodeLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0c2047',
  },
  cityLabel: {
    fontSize: 12,
    color: '#4c4c4c',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    color: '#0c2047',
    fontSize: 12,
  },
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  duration: {
    fontSize: 12,
    color: '#4c4c4c',
  },
  flightNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2047',
  },
  alignEnd: {
    textAlign: 'right',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
});
