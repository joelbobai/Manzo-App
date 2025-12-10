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
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime?: string;
  duration: string;
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
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: defaultTimeLabel,
      arrivalTime: '01:30 PM',
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
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: '12:30 PM',
      arrivalTime: '04:20 PM',
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
      fromCode: defaultFromCode,
      toCode: defaultToCode,
      fromCity: defaultFromCity,
      toCity: defaultToCity,
      departureTime: '05:45 PM',
      arrivalTime: '09:55 PM',
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
      <View style={styles.topActions}>
        <Pressable style={styles.topIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Result Search</Text>
        <View style={styles.topIcon}>
          <Ionicons name="options" size={20} color="#ffffff" />
        </View>
        </View>

            <View style={styles.summaryCard}>
        {summaryLegs.map((leg, index) => (
          <View
            key={leg.id}
            style={[styles.summaryLeg, index > 0 && styles.summaryLegDivider]}
          >
            <View style={styles.routeRow}>
              <View style={styles.locationBlock}>
                <Text style={styles.airportCode}>{leg.fromCode}</Text>
                <Text style={styles.airportCity}>{leg.fromCity}</Text>
              </View>

              <View style={styles.summaryConnector}>
                <View style={[styles.dash, styles.summaryDash]} />
                <View style={[styles.planeIconWrapper, styles.summaryPlaneIcon]}>
                  <Ionicons name="airplane" size={16} color="#0c2047" />
                </View>
                <View style={[styles.dash, styles.summaryDash]} />
              </View>

              <View style={[styles.locationBlock, styles.alignEnd]}>
                <Text style={styles.airportCode}>{leg.toCode}</Text>
                <Text style={styles.airportCity}>{leg.toCity}</Text>
              </View>
            </View>
            <View style={styles.summaryMetaRow}>
              <Ionicons name="calendar" size={14} color="#ffffff" />
              <Text style={styles.summaryMetaText}>{leg.dateLabel}</Text>
            </View>
          </View>
        ))}
      </View>
      </View>

  

      <Text style={styles.sectionLabel}>Result</Text>

      {cardsToShow.map((flight) => (
        <View key={flight.id} style={styles.flightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${flight.tagColor}14` }]}>
                <Text style={[styles.badgeText, { color: flight.tagColor }]}>Airlines</Text>
              </View>
              <Text style={styles.airlineName}>{flight.airline}</Text>
            </View>

            <Text style={styles.aircraft}>{flight.aircraft}</Text>
          </View>

          <View style={styles.routeBlock}>
            <View style={styles.locationColumn}>
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

            <View style={[styles.locationColumn, styles.alignEnd]}>
              <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{flight.toCode}</Text>
              <Text style={[styles.cityLabel, styles.alignEnd]}>{flight.toCity}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{flight.departureTime}</Text>
            <Text style={styles.timeText}>{flight.arrivalTime || ''}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.metaPill}>
              <Ionicons name="calendar" size={14} color="#0c2047" />
              <Text style={styles.metaText}>{defaultDateLabel}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={14} color="#0c2047" />
              <Text style={styles.metaText}>{flight.duration}</Text>
            </View>
            <Text style={styles.price}>{flight.price}/pax</Text>
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
    paddingTop: 48,
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c2047',
    paddingHorizontal: 14,
    paddingVertical: 14,

    borderRadius: 14,
    marginBottom: 6,
  },
  topActions: {
    width: '100%',
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
     width: "100%",
    // backgroundColor: '#ffffff',
    // borderRadius: 16,
    padding: 16,
    gap: 12,
    // borderWidth: 1,
    // borderColor: '#e4eaf5',
  },
  summaryLeg: {
    width: '100%',
    gap: 8,
  },
  summaryLegDivider: {
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ffffff33',
  },
  routeRow: {
    width: "100%",
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
    color: '#fff',
  },
  airportCity: {
    fontSize: 12,
    color: '#fff',
  },
  summaryConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryDash: {
    borderColor: '#ffffffb3',
  },
  summaryPlaneIcon: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffffb3',
  },
  routeConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryMetaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 11,
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
  locationColumn: {
    flex: 1,
    gap: 6,
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
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2047',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f4fb',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2047',
  },
  alignEnd: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
});
