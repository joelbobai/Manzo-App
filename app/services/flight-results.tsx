import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import IATAAirports from '../../data/IATA_airports.json';

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string;
  DST: string | null;
};

type FlightCard = {
  id: string;
  airline: string;
  airlineCode: string;
  aircraft: string;
  cabinClass?: string;
  passengersLabel?: string;
  tripLabel?: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime?: string;
  duration: string;
  stopsLabel?: string;
  stopCities?: string;
  fareNote?: string;
  airlinesCount?: number;
  price: string;
  tagColor: string;
  flightNumber: string;
};

type SummaryLeg = {
  id: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  dateLabel: string;
};

const airportsData = IATAAirports as Airport[];

const getCityAndCountry = (airport: Airport | null | undefined) => {
  if (!airport) return { city: '', country: '' };

  const cleaned = (airport.Location_served ?? '').replace(/\u00a0/g, ' ');
  const parts = cleaned
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] ?? '',
    country: parts[parts.length - 1] ?? '',
  };
};

const getAirportName = (airport: Airport | null | undefined) =>
  (airport?.Airport_name ?? '').replace(/\u00a0/g, ' ');

const getCityLabelFromCode = (code?: string | null) => {
  if (!code) return '';

  const airport = airportsData.find((item) => item.IATA === code);
  if (!airport) return '';

  const { city, country } = getCityAndCountry(airport);
  const airportName = getAirportName(airport);

  return city || airportName || country || code;
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

  const summaryLegs = useMemo<SummaryLeg[]>(() => {
    const legs = (Array.isArray(parsedPayload?.flightSearch) ? parsedPayload?.flightSearch : [])
      ?.map((leg, index) => {
        const originCode = (leg as { originLocationCode?: string }).originLocationCode ?? '';
        const destinationCode = (leg as { destinationLocationCode?: string }).destinationLocationCode ?? '';
        const from =
          (leg as { from?: string }).from || getCityLabelFromCode(originCode) || originCode || 'N/A';
        const to =
          (leg as { to?: string }).to || getCityLabelFromCode(destinationCode) || destinationCode || 'N/A';
        const dateValue =
          (leg as { departureDate?: string }).departureDate ??
          (leg as { departureDateTimeRange?: string }).departureDateTimeRange ??
          '';

        return {
          id: (leg as { id?: string | number }).id?.toString() || `leg-${index + 1}`,
          fromCode: originCode || '---',
          toCode: destinationCode || '---',
          fromCity: from,
          toCity: to,
          dateLabel: formatDate(dateValue) || dateValue || 'Date unavailable',
        };
      })
      .filter(Boolean);

    if (legs && legs.length > 0) return legs as SummaryLeg[];

    return [
      {
        id: 'leg-1',
        fromCode: 'SBY',
        toCode: 'DPS',
        fromCity: 'Surabaya, East Java',
        toCity: 'Denpasar, Bali',
        dateLabel: 'Dec 21, 2023',
      },
    ];
  }, [parsedPayload]);

  const summaryPrimary = summaryLegs[0];

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

  const defaultFromCode = summaryPrimary?.fromCode ?? 'SBY';
  const defaultToCode = summaryPrimary?.toCode ?? 'DPS';
  const defaultFromCity = summaryPrimary?.fromCity ?? 'Surabaya, East Java';
  const defaultToCity = summaryPrimary?.toCity ?? 'Denpasar, Bali';
  const defaultDateLabel = summaryPrimary?.dateLabel ?? 'Dec 21, 2023';
  const defaultTimeLabel = '09:00 AM';

  const mockFlights: FlightCard[] = [
    {
      id: '1',
      airline: 'Garuda Indonesia',
      airlineCode: 'GA',
      aircraft: 'A330',
      cabinClass: 'Economy',
      passengersLabel: '1 Adult',
      tripLabel: 'Round trip',
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: defaultTimeLabel,
      arrivalTime: '01:30 PM',
      duration: '4h30m',
      stopsLabel: '2 stop overs',
      stopCities: 'Addis Ababa, Hessen',
      fareNote: 'Refundable, Penalty Applies',
      airlinesCount: 2,
      price: '$320',
      tagColor: '#1e73f6',
      flightNumber: 'GA-01',
    },
    {
      id: '2',
      airline: 'Lion Air',
      airlineCode: 'JT',
      aircraft: 'JT-25',
      cabinClass: 'Economy',
      passengersLabel: '1 Adult',
      tripLabel: 'Round trip',
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: '12:30 PM',
      arrivalTime: '04:20 PM',
      duration: '3h50m',
      stopsLabel: '1 stop over',
      stopCities: 'Kuala Lumpur',
      fareNote: 'Free reschedule within 24h',
      airlinesCount: 1,
      price: '$479',
      tagColor: '#F89A1C',
      flightNumber: 'JT-25',
    },
    {
      id: '3',
      airline: 'Citilink',
      airlineCode: 'QG',
      aircraft: 'QG-101',
      cabinClass: 'Economy',
      passengersLabel: '1 Adult',
      tripLabel: 'Round trip',
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: '05:45 PM',
      arrivalTime: '09:55 PM',
      duration: '4h10m',
      stopsLabel: 'Direct flight',
      stopCities: 'Non-stop service',
      fareNote: 'Baggage included',
      airlinesCount: 1,
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
        <View style={styles.topMeta}>
          <Text style={styles.topTitle}>Flight results</Text>
          <Text style={styles.topSubtitle}>
            {defaultFromCity} • {defaultToCity} • {defaultDateLabel}
          </Text>
        </View>
        <View style={styles.topPlaceholder} />
      </View>

      <Text style={styles.sectionLabel}>Available flights</Text>

      {cardsToShow.map((flight) => (
        <View key={flight.id} style={styles.flightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>{flight.airlineCode}</Text>
              </View>
              <View>
                <Text style={styles.airlineName}>{flight.airline}</Text>
                <Text style={styles.aircraft}>
                  Flight {flight.flightNumber} • {flight.cabinClass || 'Economy'}
                </Text>
              </View>
            </View>

            <View style={styles.priceBlock}>
              <Text style={styles.price}>{flight.price}</Text>
              <Pressable style={styles.ctaButton}>
                <Text style={styles.ctaText}>Book now</Text>
                <Ionicons name="arrow-forward" size={16} color="#0c2047" />
              </Pressable>
            </View>
          </View>

          <View style={styles.routeBlock}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>{flight.departureTime}</Text>
              <Text style={styles.airportCodeLarge}>{flight.fromCode}</Text>
              <Text style={styles.cityLabel}>{flight.fromCity}</Text>
            </View>

            <View style={styles.connector}>
              <View style={styles.dash} />
              <View style={styles.planeIconWrapper}>
                <Ionicons name="airplane" size={16} color="#0c2047" />
              </View>
              <View style={styles.dash} />
            </View>

            <View style={[styles.timeColumn, styles.alignEnd]}>
              <Text style={[styles.timeLabel, styles.alignEnd]}>{flight.arrivalTime || ''}</Text>
              <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{flight.toCode}</Text>
              <Text style={[styles.cityLabel, styles.alignEnd]}>{flight.toCity}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#5c6270" />
              <Text style={styles.metaText}>{flight.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="swap-horizontal" size={14} color="#5c6270" />
              <Text style={styles.metaText}>{flight.stopsLabel || 'Direct flight'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color="#5c6270" />
              <Text style={styles.metaText}>{defaultDateLabel}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    gap: 14,
    backgroundColor: '#f5f7fb',
    flexGrow: 1,
  },
  topBar: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0c2047',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  topIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1e73f6',
  },
  topMeta: {
    flex: 1,
    gap: 2,
  },
  topTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  topSubtitle: {
    color: '#e3e8f2',
    fontSize: 12,
    fontWeight: '600',
  },
  topPlaceholder: {
    width: 34,
    height: 34,
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e7ecf5',
    gap: 14,
    shadowColor: '#0c2047',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eef3fb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7e1f1',
  },
  logoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0c2047',
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  aircraft: {
    fontSize: 12,
    color: '#5c6270',
    fontWeight: '600',
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2047',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e5edff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0c2047',
    textTransform: 'capitalize',
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeColumn: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0c2047',
  },
  airportCodeLarge: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0c2047',
  },
  cityLabel: {
    fontSize: 12,
    color: '#5c6270',
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dash: {
    width: 44,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d6deeb',
  },
  planeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef3fb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7e1f1',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#5c6270',
    fontWeight: '700',
  },
  alignEnd: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
});

