import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import IATAAirports from '../../data/IATA_airports.json';

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string;
  DST: string | null;
};

type FlightLocation = { iataCode?: string; at?: string };

type FlightSegment = {
  carrierCode?: string;
  number?: string;
  departure?: FlightLocation;
  arrival?: FlightLocation;
  duration?: string;
  numberOfStops?: number;
};

type Itinerary = {
  duration?: string;
  segments?: FlightSegment[];
};

type TravelerPricing = {
  travelerId?: string;
  travelerType?: 'ADULT' | 'CHILD' | 'HELD_INFANT' | 'SEATED_INFANT';
  price?: {
    total?: string;
    base?: string;
    currency?: string;
  };
};

type Price = {
  currency?: string;
  total?: string;
  base?: string;
  fees?: any;
  grandTotal?: string;
};

export type FlightOffer = {
  id: string;
  oneWay?: boolean;
  numberOfBookableSeats?: number;
  itineraries?: Itinerary[];
  price?: Price;
  travelerPricings?: TravelerPricing[];
};

export type FlightRightsDictionaries = {
  carriers?: Record<string, string>;
  aircraft?: Record<string, string>;
  locations?: Record<string, { cityCode?: string; countryCode?: string }>;
  currencies?: Record<string, string>;
};

export type FlightRightsResponse = {
  flightRights?: FlightOffer[];
  flightRightsDictionaries?: FlightRightsDictionaries;
  fetchedAt?: string;
};

type SummaryLeg = {
  id: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  dateLabel: string;
};

type NormalizedLeg = {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  departTimeLabel: string;
  arriveTimeLabel: string;
  durationLabel: string;
  stopsLabel: string;
};

export type NormalizedOffer = {
  id: string;
  airlineLabel: string;
  outbound: NormalizedLeg;
  inbound?: NormalizedLeg;
  priceLabel: string;
  seatsLeft?: number;
  raw: FlightOffer;
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

const airportLabelCache = new Map<string, string | null>();

const getCityLabelFromCode = (code?: string | null) => {
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) return '';

  if (airportLabelCache.has(normalizedCode)) {
    return airportLabelCache.get(normalizedCode) ?? '';
  }

  const airport = airportsData.find((item) => item.IATA?.toUpperCase() === normalizedCode);

  const { city, country } = getCityAndCountry(airport);
  const label = city || country || normalizedCode;

  airportLabelCache.set(normalizedCode, label || null);

  return label;
};

const formatCityName = (label?: string | null, code?: string | null) => {
  const cityFromCode = getCityLabelFromCode(code);

  if (cityFromCode) return cityFromCode;

  const cleaned = (label ?? '')
    .replace(/airport/gi, '')
    .replace(/international/gi, '')
    .replace(/intl/gi, '')
    .trim();

  const primaryPart = cleaned.split(',')[0]?.trim();

  return primaryPart || label || code || '';
};

export const formatTime = (isoString?: string | null) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const parseDuration = (duration?: string | null) => {
  if (!duration) return '';

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);

  if (!match) return duration;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  const parts = [] as string[];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !hours && !minutes) parts.push(`${seconds}s`);

  return parts.join(' ') || duration;
};

export const getItineraryEndpoints = (itinerary?: Itinerary) => {
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return {
    from: firstSegment?.departure?.iataCode ?? '',
    to: lastSegment?.arrival?.iataCode ?? '',
    departAt: firstSegment?.departure?.at ?? '',
    arriveAt: lastSegment?.arrival?.at ?? '',
    segments,
  };
};

export const getStopsLabel = (segments: FlightSegment[]) => {
  if (!segments || segments.length <= 1) return 'Non-stop';

  const stopsFromNumbers = segments.reduce((total, segment) => total + (segment.numberOfStops ?? 0), 0);
  const stopCount = stopsFromNumbers > 0 ? stopsFromNumbers : Math.max(segments.length - 1, 0);

  if (stopCount <= 0) return 'Non-stop';
  if (stopCount === 1) return '1 stop';
  return `${stopCount} stops`;
};

export const normalizeOffer = (
  offer: FlightOffer,
  dictionaries?: FlightRightsDictionaries,
): NormalizedOffer => {
  const outboundItinerary = offer.itineraries?.[0];
  const inboundItinerary = offer.itineraries?.[1];

  const outboundEndpoints = getItineraryEndpoints(outboundItinerary);
  const inboundEndpoints = getItineraryEndpoints(inboundItinerary);

  const carrierCode = outboundEndpoints.segments?.[0]?.carrierCode ?? '';
  const airlineName = carrierCode ? dictionaries?.carriers?.[carrierCode] ?? carrierCode : 'Unknown airline';
  const airlineLabel = carrierCode ? `${airlineName} (${carrierCode})` : airlineName;

  const outbound: NormalizedLeg = {
    from: outboundEndpoints.from,
    to: outboundEndpoints.to,
    departAt: outboundEndpoints.departAt,
    arriveAt: outboundEndpoints.arriveAt,
    departTimeLabel: formatTime(outboundEndpoints.departAt) || outboundEndpoints.departAt,
    arriveTimeLabel: formatTime(outboundEndpoints.arriveAt) || outboundEndpoints.arriveAt,
    durationLabel: parseDuration(outboundItinerary?.duration),
    stopsLabel: getStopsLabel(outboundEndpoints.segments ?? []),
  };

  const inbound: NormalizedLeg | undefined = inboundItinerary
    ? {
        from: inboundEndpoints.from,
        to: inboundEndpoints.to,
        departAt: inboundEndpoints.departAt,
        arriveAt: inboundEndpoints.arriveAt,
        departTimeLabel: formatTime(inboundEndpoints.departAt) || inboundEndpoints.departAt,
        arriveTimeLabel: formatTime(inboundEndpoints.arriveAt) || inboundEndpoints.arriveAt,
        durationLabel: parseDuration(inboundItinerary.duration),
        stopsLabel: getStopsLabel(inboundEndpoints.segments ?? []),
      }
    : undefined;

  const priceCurrency = offer.price?.currency ?? '';
  const priceTotal = offer.price?.total ?? '';
  const priceLabel = `${priceCurrency} ${priceTotal}`.trim();

  return {
    id: offer.id?.toString() ?? `${Math.random()}`,
    airlineLabel,
    outbound,
    inbound,
    priceLabel,
    seatsLeft: offer.numberOfBookableSeats,
    raw: offer,
  };
};

export default function FlightResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; payload?: string; source?: string; response?: string }>();
  const selectedOfferRef = useRef<FlightOffer | null>(null);

  const parsedResult = useMemo<FlightRightsResponse | null>(() => {
    const rawResult = params.response ?? params.data;

    if (!rawResult) return null;

    try {
      return JSON.parse(rawResult) as FlightRightsResponse;
    } catch (error) {
      console.error('Unable to parse search result', error);
      return null;
    }
  }, [params.data, params.response]);

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
        const from = (leg as { from?: string }).from || originCode || '';
        const to = (leg as { to?: string }).to || destinationCode || '';
        const dateValue =
          (leg as { departureDate?: string }).departureDate ??
          (leg as { departureDateTimeRange?: string }).departureDateTimeRange ??
          '';

        return {
          id: (leg as { id?: string | number }).id?.toString() || `leg-${index + 1}`,
          fromCode: originCode,
          toCode: destinationCode,
          fromCity: from,
          toCity: to,
          dateLabel: formatDate(dateValue) || dateValue || '',
        };
      })
      .filter(Boolean);

    return (legs as SummaryLeg[]) ?? [];
  }, [parsedPayload]);

  const normalizedOffers = useMemo<NormalizedOffer[]>(() => {
    const offers = parsedResult?.flightRights ?? [];

    return offers.map((offer) => normalizeOffer(offer, parsedResult?.flightRightsDictionaries));
  }, [parsedResult]);

  const summaryPrimary = summaryLegs[0];
  const firstNormalizedOffer = normalizedOffers[0];
  const defaultFromCode = summaryPrimary?.fromCode || firstNormalizedOffer?.outbound.from || '';
  const defaultToCode = summaryPrimary?.toCode || firstNormalizedOffer?.outbound.to || '';
  const defaultFromCity = summaryPrimary?.fromCity || formatCityName(getCityLabelFromCode(defaultFromCode), defaultFromCode);
  const defaultToCity = summaryPrimary?.toCity || formatCityName(getCityLabelFromCode(defaultToCode), defaultToCode);
  const defaultDateLabel = summaryPrimary?.dateLabel || formatDate(firstNormalizedOffer?.outbound.departAt) || '';

  const passengersLabel = useMemo(() => {
    const passenger = (parsedPayload as { passenger?: Record<string, number> } | null)?.passenger;

    if (!passenger) return '1 Adult';

    const adults =
      (passenger as { adults?: number; adult?: number }).adults ??
      (passenger as { adult?: number }).adult ??
      0;
    const children = (passenger as { children?: number }).children ?? 0;
    const infants = (passenger as { infants?: number }).infants ?? 0;

    const parts: string[] = [];

    if (adults) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    if (infants) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : '1 Adult';
  }, [parsedPayload]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
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
    </View>
  );

  const renderOfferCard = ({ item }: { item: NormalizedOffer }) => {
    const outboundFrom = item.outbound.from || defaultFromCode;
    const outboundTo = item.outbound.to || defaultToCode;
    const outboundFromCity =
      formatCityName(getCityLabelFromCode(outboundFrom), outboundFrom) || defaultFromCity;
    const outboundToCity = formatCityName(getCityLabelFromCode(outboundTo), outboundTo) || defaultToCity;

    const carrierCode = item.raw.itineraries?.[0]?.segments?.[0]?.carrierCode ?? outboundFrom;
    const flightNumber = item.raw.itineraries?.[0]?.segments?.[0]?.number ?? '';

    return (
      <Pressable key={item.id} style={styles.flightCard}>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Ionicons name="person-outline" size={14} color="#0c2047" />
            <Text style={styles.pillText}>{passengersLabel}</Text>
          </View>
          <View style={[styles.refundBadge, styles.refundableBadge]}>
            <Text style={[styles.refundBadgeText, styles.refundableBadgeText]}>
              (Refundable, Penalty Applies)
            </Text>
          </View>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>{carrierCode}</Text>
            </View>
            <View>
              <Text style={styles.airlineName}>{item.airlineLabel}</Text>
              <Text style={styles.aircraft}>Flight {carrierCode}{flightNumber ? `-${flightNumber}` : ''}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#1e73f6' }]}>
              <Text style={styles.tagText}>Flight</Text>
            </View>
          </View>

          <View style={styles.locationColumn}>
            <Text style={styles.airportCodeLarge}>{outboundFrom}</Text>
            <Text style={styles.cityLabel}>{outboundFromCity}</Text>
          </View>

          <View style={styles.connector}>
            <View style={styles.dash} />
            <View style={styles.planeIconColumn}>
              <View style={styles.planeIconWrapper}>
                <Ionicons name="airplane" size={16} color="#0c2047" />
              </View>
              <Text style={styles.durationLabel}>{item.outbound.durationLabel || 'N/A'}</Text>
            </View>
            <View style={styles.dash} />
          </View>

          <View style={[styles.locationColumn, styles.alignEnd]}>
            <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{outboundTo}</Text>
            <Text style={[styles.cityLabel, styles.alignEnd]}>{outboundToCity}</Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{item.outbound.departTimeLabel || defaultDateLabel}</Text>
          <Text style={styles.timeText}>{item.outbound.arriveTimeLabel || ''}</Text>
        </View>

        {item.inbound && (
          <View style={styles.inboundBlock}>
            <Text style={styles.inboundLabel}>Return</Text>
            <Text style={styles.inboundRoute}>{`${item.inbound.from} → ${item.inbound.to}`}</Text>
            <Text style={styles.inboundMeta}>
              {item.inbound.departTimeLabel} - {item.inbound.arriveTimeLabel} • {item.inbound.durationLabel || 'Duration N/A'} • {item.inbound.stopsLabel}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.pill}>
            <Ionicons name="flag-outline" size={14} color="#0c2047" />
            <Text style={styles.pillText}>
              To {formatCityName(getCityLabelFromCode(outboundTo), outboundTo) || outboundToCity}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="briefcase-outline" size={14} color="#0c2047" />
            <Text style={styles.metaText}>{'Economy'}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="swap-horizontal" size={14} color="#0c2047" />
            <Text style={styles.metaText}>{item.outbound.stopsLabel || 'Direct flight'}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.stopRow}>
            <Ionicons name="pin-outline" size={14} color="#5c6270" />
            <Text style={styles.stopText}>{item.outbound.stopsLabel || 'Non-stop service'}</Text>
          </View>

          <View style={[styles.priceBlock, styles.priceFooter]}>
            <Text style={styles.price}>{item.priceLabel || 'Price unavailable'}</Text>
            {typeof item.seatsLeft === 'number' && (
              <Text style={styles.seatsLeft}>Seats left: {item.seatsLeft}</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="airplane" size={32} color="#5c6270" />
      <Text style={styles.emptyTitle}>No flights found</Text>
      <Text style={styles.emptySubtitle}>
        We couldn't find any flights for this search. Try adjusting your dates or airports.
      </Text>
    </View>
  );

  return (
    <FlatList
      data={normalizedOffers}
      keyExtractor={(item) => item.id}
      renderItem={renderOfferCard}
      contentContainerStyle={[styles.container, normalizedOffers.length === 0 && styles.emptyContent]}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    backgroundColor: '#f5f7fb',
    flexGrow: 1,
  },
  listHeader: {
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
  },
  topBar: {
    paddingTop: 48,
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c2047',
    
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
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f5fb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  refundBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  refundableBadge: {
    backgroundColor: '#d8f6df',
  },
  nonRefundableBadge: {
    backgroundColor: '#fdeed9',
  },
  refundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refundableBadgeText: {
    color: '#0f8f32',
  },
  nonRefundableBadgeText: {
    color: '#d06000',
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tripMetaTextWrap: {
    flex: 1,
    gap: 2,
  },
  tripMetaText: {
    color: '#0c2047',
    fontSize: 13,
    fontWeight: '800',
  },
  tripMetaSub: {
    color: '#5c6270',
    fontSize: 12,
    fontWeight: '600',
  },
  airlineChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  airlineCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eef3fb',
    borderWidth: 1,
    borderColor: '#d7e1f1',
    alignItems: 'center',
    justifyContent: 'center',
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
  priceFooter: {
    marginTop: 0,
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
  planeIconColumn: {
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
  durationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
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
  inboundBlock: {
    marginTop: 10,
    backgroundColor: '#f0f4fb',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  inboundLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  inboundRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2047',
  },
  inboundMeta: {
    fontSize: 12,
    color: '#5c6270',
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
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2047',
  },
  seatsLeft: {
    marginTop: 2,
    fontSize: 12,
    color: '#5c6270',
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
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopText: {
    color: '#5c6270',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2047',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#5c6270',
    fontSize: 13,
  },
  alignEnd: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
});
