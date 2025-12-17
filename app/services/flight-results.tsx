import { useAirports } from "@/hooks/useAirports";
import { getCountryByIATA } from "@/utils/getCountryByIATA";
import type { FlightOffer, FlightSegment, TravelerPricingDetail } from "@/types/flight";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Localization from "expo-localization";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import IATAAirports from '../../data/IATA_airports.json';

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string;
  DST: string | null;
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

function parseDuration(duration: string) {
  const regex = /PT(\d+H)?(\d+M)?/;
  const matches = duration.match(regex);

  if (!matches) {
    return { hours: 0, minutes: 0 };
  }

  const hours = matches[1] ? parseInt(matches[1].replace("H", ""), 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2].replace("M", ""), 10) : 0;

  return { hours, minutes };
}
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



export function formatMoney(amount: number, currency: string) {
  const [locale] = Localization.getLocales();

  const symbol = locale?.currencySymbol ?? '';
  const decimal = locale?.decimalSeparator ?? ".";
  const group = locale?.digitGroupingSeparator ?? ",";

  const fixed = amount.toFixed(2);
  const [intPart, frac] = fixed.split(".");

  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);

  return `${currency === 'NGN'? "₦" : symbol}${grouped}${decimal}${frac}`;
}

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

function FormatDate(dateString: string): string {
  const date = new Date(dateString);

  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const day = date.toLocaleString("en-US", {
    weekday: "short",
  });

  const dayNum = date.getDate();

  const month = date.toLocaleString("en-US", {
    month: "short",
  });

  return `${time} ${day} ${dayNum} ${month}`.toUpperCase();
}

const formatTime = (value?: string | null) => {
  if (!value) return "--";

  const date = new Date(value);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return "--";

  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatDurationLabel = (duration?: string | null) => {
  if (!duration) return "--";

  const { hours, minutes } = parseDuration(duration);

  if (!hours && !minutes) return duration.replace("PT", "");

  return `${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m` : ""}`.trim();
};

const getLayoverDuration = (from?: string, to?: string) => {
  if (!from || !to) return null;

  const start = new Date(from).getTime();
  const end = new Date(to).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  const diffMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return { hours, minutes };
};


export default function FlightResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; payload?: string; source?: string; response?: string }>();
  const { airports } = useAirports();
  const airportList = airports.length > 0 ? airports : airportsData;
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [isSheetVisible, setSheetVisible] = useState(false);

  const parsedResult = useMemo(() => {
    const rawResult = params.response ?? params.data;

    if (!rawResult) return null;

    try {
      return JSON.parse(rawResult);
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
        const from = (leg as { from?: string }).from || originCode || 'N/A';
        const to = (leg as { to?: string }).to || destinationCode || 'N/A';
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

  const defaultToCity = summaryPrimary?.toCity ?? 'Denpasar, Bali';

  const handleBookNowPress = useCallback((flight: any) => {
    setSelectedFlight(flight);
    setSheetVisible(true);
  }, []);

  const flightCards = useMemo(() => {
    if (!parsedResult?.flightRights) return null;

    return parsedResult.flightRights.map((flight, flightIndex) => (
      <View key={flight.id ?? `flight-${flightIndex}`} style={styles.flightCard}>
        <View style={styles.pillRow}>
         
          <View style={styles.pill}>
            <Ionicons name="person-outline" size={14} color="#0c2047" />
            <Text style={styles.pillText}> 1 Adult</Text>
          </View>
{flight.fareRules?.rules?.[1]?.category === "REFUND" ? (
          <>
            {flight.fareRules?.rules?.[1]?.notApplicable ? (
               <View
            style={[
              styles.refundBadge,
               styles.nonRefundableBadge,
            ]}
          >
            <Text
              style={[
                styles.refundBadgeText,
                styles.nonRefundableBadgeText,
              ]}
            >
               (Non Refundable)
            </Text>
          </View>
 
            ) : (
               <View
            style={[
              styles.refundBadge,
              styles.refundableBadge,
            ]}
          >
            <Text
              style={[
                styles.refundBadgeText,
                styles.refundableBadgeText,
              ]}
            >
              (Refundable, Penalty Applies)
            </Text>
          </View>
      
            )}
          </>
        ) : (
           <View
            style={[
              styles.refundBadge,
               styles.nonRefundableBadge,
            ]}
          >
            <Text
              style={[
                styles.refundBadgeText,
                styles.nonRefundableBadgeText,
              ]}
            >
               (Non Refundable)
            </Text>
          </View>
     
        )}

         
          
        </View>

        <View style={styles.tripMetaRow}>


        </View>

        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.logoCircle}>
             
               <Image source={`https://images.wakanow.com/Images/flight-logos/${flight.validatingAirlineCodes?.[0]}.gif`} 
               style={{ width: "100%", height: "100%" }} 
               contentFit="cover" />
            </View>
            <View>
              <Text style={styles.airlineName}>{flight.validatingAirlineCodes?.[0]}</Text>
              <Text style={styles.aircraft}>{flight.validatingAirlineCodes?.[0]}</Text>
            </View>
          </View>

          <Pressable style={styles.ctaButton} onPress={() => handleBookNowPress(flight)}>
            <Text style={styles.ctaText}>Book now</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </Pressable>
        </View>

           {flight?.itineraries.map((itinerary, idx) => {
          //    const stopovers = itinerary.segments
          // .map((segment, idx) => {
          //   if (idx !== 0) {
          //     return getCountryByIATA(airports, segment.departure.iataCode);
          //   }
          // })
          // .filter((value): value is string => Boolean(value))
          // .join(", ");
            const { hours, minutes } = parseDuration(itinerary.duration);
            const destinationTime = FormatDate(
              itinerary.segments[itinerary.segments.length - 1].arrival.at
            );
            const leg = parsedPayload?.flightSearch?.[idx];
            const originSegment = itinerary.segments[0];
            const lastSegment = itinerary.segments[itinerary.segments.length - 1];
            const originCode =
              leg?.originLocationCode ?? originSegment?.departure.iataCode;
            const destinationCode =
              leg?.destinationLocationCode ?? lastSegment?.arrival.iataCode;
            const originTime = FormatDate(itinerary.segments[0].departure.at);
            // const { hours, minutes } = parseDuration(itinerary.duration);
            // const destination_Label = getCountryByIATA(
            //   airports,
            //   payload?.flightSearch?.[idx]?.destinationLocationCode
            // );
            return (
              <View key={itinerary.id ?? `itinerary-${idx}`} style={styles.itinerarySection}>
                <View style={styles.routeBlock}>
                  <View style={styles.locationColumn}>
                    <Text style={styles.airportCodeLarge}>{originCode}</Text>
                    <Text style={styles.cityLabel}> {getCountryByIATA(airportList, originCode)}</Text>
                  </View>

                  <View style={styles.connector}>
                    <View style={styles.dash} />
                    <View style={styles.planeIconColumn}>
                      <View style={styles.planeIconWrapper}>
                        <Ionicons name="airplane" size={16} color="#0c2047" />
                      </View>
                      <Text style={styles.durationLabel}>
                        {hours > 0 || minutes > 0
                          ? `${hours}h ${minutes}m`
                          : itinerary.duration.replace("PT", "")}
                      </Text>
                    </View>
                    <View style={styles.dash} />
                  </View>

                  <View style={[styles.locationColumn, styles.alignEnd]}>
                    <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{destinationCode}</Text>
                    <Text style={[styles.cityLabel, styles.alignEnd]}> {getCountryByIATA(airportList, destinationCode)}</Text>
                  </View>
                </View>


                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{destinationTime}</Text>
                  <Text style={styles.timeText}>{originTime}</Text>
                </View>
              </View>
            );
          })}

       

        <View style={styles.detailRow}>
          <View style={styles.pill}>
            <Ionicons name="flag-outline" size={14} color="#0c2047" />
            <Text style={styles.pillText}>
              To {formatCityName(getCityLabelFromCode(parsedPayload?.flightSearch?.[0]?.destinationLocationCode   ), parsedPayload?.flightSearch?.[0]?.destinationLocationCode) || flight.toCity || defaultToCity}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="briefcase-outline" size={14} color="#0c2047" />
            <Text style={styles.metaText}>{parsedPayload?.passenger?.travelClass}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="swap-horizontal" size={14} color="#0c2047" />
            <Text style={styles.metaText}>{(flight?.itineraries[0].segments.length - 1) === 0 ? 'Direct flight' : (flight?.itineraries[0].segments.length - 1) === 2? "2 stop over" :"1 stop overs"}  </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.stopRow}>
            <Ionicons name="pin-outline" size={14} color="#5c6270" />
            <Text style={styles.stopText}>Non-stop service</Text>
          </View>

          <View style={[styles.priceBlock, styles.priceFooter]}>
            <Text style={styles.price}>{formatMoney(Number(flight?.price.grandTotal ?? flight?.price.total),"NGN")}</Text>
          </View>
        </View>


      </View>
    ));
  }, [airportList, defaultToCity, handleBookNowPress, parsedPayload, parsedResult?.flightRights]);

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setSelectedFlight(null);
  };

  const selectedItinerary = selectedFlight?.itineraries?.[0];
  const selectedOrigin = selectedItinerary?.segments?.[0]?.departure?.iataCode;
  const selectedDestination = selectedItinerary?.segments?.[selectedItinerary?.segments?.length - 1]?.arrival?.iataCode;
  const selectedOriginCity = selectedOrigin ? getCountryByIATA(airportList, selectedOrigin) : '';
  const selectedDestinationCity = selectedDestination ? getCountryByIATA(airportList, selectedDestination) : '';
  const { hours: selectedHours, minutes: selectedMinutes } = selectedItinerary?.duration
    ? parseDuration(selectedItinerary.duration)
    : { hours: 0, minutes: 0 };
  const selectedDeparture = selectedItinerary?.segments?.[0]?.departure?.at;
  const selectedArrival = selectedItinerary?.segments?.[selectedItinerary?.segments?.length - 1]?.arrival?.at;
  const selectedPrice = selectedFlight?.price?.grandTotal ?? selectedFlight?.price?.total;
  const selectedCabin = selectedFlight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? parsedPayload?.passenger?.travelClass;
  const segmentDetailsMap = useMemo(() => {
    const detailMap = new Map<string, TravelerPricingDetail>();

    selectedFlight?.travelerPricings?.forEach((pricing) => {
      pricing.fareDetailsBySegment?.forEach((detail) => {
        if (detail.segmentId) {
          detailMap.set(detail.segmentId.toString(), detail);
        }
      });
    });

    return detailMap;
  }, [selectedFlight]);


  return (
    <View style={styles.screen}>
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

      {flightCards}
    </ScrollView>

    <BottomSheet visible={isSheetVisible} onClose={handleCloseSheet}>
      {selectedFlight && (
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.logoCircle}>
                <Image
                  source={`https://images.wakanow.com/Images/flight-logos/${selectedFlight.validatingAirlineCodes?.[0]}.gif`}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View>
                <Text style={styles.airlineName}>{selectedFlight.validatingAirlineCodes?.[0]}</Text>
                <Text style={styles.aircraft}>{selectedFlight.validatingAirlineCodes?.[0]}</Text>
              </View>
            </View>

            <View style={styles.sheetPriceBlock}>
              <Text style={styles.sheetPriceLabel}>Estimated fare</Text>
              <Text style={styles.sheetPrice}>{formatMoney(Number(selectedPrice ?? 0), "NGN")}</Text>
            </View>
          </View>

            <View style={styles.sheetRoute}>
              <View style={styles.sheetRouteRow}>
                <View style={styles.locationColumn}>
                  <Text style={styles.airportCodeLarge}>{selectedOrigin ?? "---"}</Text>
                  <Text style={styles.cityLabel}>{selectedOriginCity}</Text>
                </View>

                <View style={styles.connector}>
                  <View style={styles.dash} />
                  <View style={styles.planeIconColumn}>
                    <View style={styles.planeIconWrapper}>
                      <Ionicons name="airplane" size={16} color="#0c2047" />
                    </View>
                    <Text style={styles.durationLabel}>
                      {selectedHours > 0 || selectedMinutes > 0
                        ? `${selectedHours}h ${selectedMinutes}m`
                        : selectedItinerary?.duration?.replace("PT", "") ?? "--"}
                    </Text>
                  </View>
                  <View style={styles.dash} />
                </View>

                <View style={[styles.locationColumn, styles.alignEnd]}>
                  <Text style={[styles.airportCodeLarge, styles.alignEnd]}>{selectedDestination ?? "---"}</Text>
                  <Text style={[styles.cityLabel, styles.alignEnd]}>{selectedDestinationCity}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{selectedDeparture ? FormatDate(selectedDeparture) : "--"}</Text>
                <Text style={styles.timeText}>{selectedArrival ? FormatDate(selectedArrival) : "--"}</Text>
              </View>
            </View>

          <View style={styles.sheetMetaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="people" size={14} color="#0c2047" />
              <Text style={styles.metaText}>{parsedPayload?.passenger?.adults ?? 1} Adult</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="briefcase-outline" size={14} color="#0c2047" />
              <Text style={styles.metaText}>{selectedCabin ?? ""}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="pricetag-outline" size={14} color="#0c2047" />
              <Text style={styles.metaText}>Seats left: {selectedFlight?.numberOfBookableSeats ?? "--"}</Text>
            </View>
          </View>

          <View style={styles.sheetSectionHeader}>
            <Text style={styles.sheetSectionTitle}>Flight details</Text>
            <Text style={styles.sheetSectionSub}>{selectedFlight?.itineraries?.length ?? 0} leg(s)</Text>
          </View>

          {selectedFlight?.itineraries?.map((itinerary, itineraryIndex) => {
            const { hours, minutes } = parseDuration(itinerary.duration);
            const legLabel = itineraryIndex === 0 ? "Departure" : itineraryIndex === 1 ? "Return" : `Leg ${itineraryIndex + 1}`;

            return (
              <View key={itinerary.id ?? `itinerary-${itineraryIndex}`} style={styles.itineraryCard}>
                <View style={styles.itineraryHeader}>
                  <View>
                    <Text style={styles.itineraryTitle}>{legLabel}</Text>
                    <Text style={styles.itinerarySub}>{itinerary.segments?.[0]?.departure?.iataCode} → {itinerary.segments?.[itinerary.segments.length - 1]?.arrival?.iataCode}</Text>
                  </View>
                  <View style={styles.itineraryDurationRow}>
                    <Ionicons name="time-outline" size={16} color="#0c2047" />
                    <Text style={styles.itineraryDurationText}>{hours || minutes ? `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}m` : ''}`.trim() : itinerary.duration.replace("PT", "")}</Text>
                  </View>
                </View>

                {itinerary.segments.map((segment: FlightSegment, segmentIndex: number) => {
                  const segmentDetail = segmentDetailsMap.get(segment.id?.toString?.() ?? segment.id);
                  const departureLabel = getCountryByIATA(airportList, segment.departure.iataCode);
                  const arrivalLabel = getCountryByIATA(airportList, segment.arrival.iataCode);
                  const layover = itinerary.segments[segmentIndex + 1]
                    ? getLayoverDuration(segment.arrival.at, itinerary.segments[segmentIndex + 1].departure.at)
                    : null;

                  return (
                    <View key={segment.id ?? `segment-${segmentIndex}`} style={styles.segmentCard}>
                      <View style={styles.segmentRow}>
                        <View style={styles.segmentBlock}>
                          <Text style={styles.segmentTime}>{formatTime(segment.departure.at)}</Text>
                          <Text style={styles.segmentDate}>{formatDateLabel(segment.departure.at)}</Text>
                          <Text style={styles.segmentAirport}>{segment.departure.iataCode} • {departureLabel}</Text>
                          {segment.departure.terminal && (
                            <Text style={styles.segmentTerminal}>Terminal {segment.departure.terminal}</Text>
                          )}
                        </View>

                        <View style={styles.segmentCenter}>
                          <View style={styles.segmentDash} />
                          <Ionicons name="airplane" size={16} color="#0c2047" />
                          <View style={styles.segmentDash} />
                          <Text style={styles.segmentDuration}>{formatDurationLabel(segment.duration)}</Text>
                        </View>

                        <View style={[styles.segmentBlock, styles.alignEnd]}>
                          <Text style={styles.segmentTime}>{formatTime(segment.arrival.at)}</Text>
                          <Text style={styles.segmentDate}>{formatDateLabel(segment.arrival.at)}</Text>
                          <Text style={[styles.segmentAirport, styles.alignEnd]}>{segment.arrival.iataCode} • {arrivalLabel}</Text>
                          {segment.arrival.terminal && (
                            <Text style={[styles.segmentTerminal, styles.alignEnd]}>Terminal {segment.arrival.terminal}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.segmentMetaRow}>
                        <View style={styles.segmentMetaChip}>
                          <Ionicons name="airplane-outline" size={14} color="#0c2047" />
                          <Text style={styles.segmentMetaText}>Flight {segment.carrierCode}{segment.number}</Text>
                        </View>
                        {segment.operating?.carrierCode || segment.operating?.carrierName ? (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="information-circle-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>
                              Operated by {segment.operating?.carrierName ?? segment.operating?.carrierCode}
                            </Text>
                          </View>
                        ) : null}
                        {segmentDetail?.cabin && (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="briefcase-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>Cabin {segmentDetail.cabin}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.segmentMetaRow}>
                        {segment.aircraft?.code && (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="airplane-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>Aircraft {segment.aircraft.code}</Text>
                          </View>
                        )}
                        {segmentDetail?.includedCheckedBags?.quantity !== undefined && (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="cube-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>{segmentDetail.includedCheckedBags.quantity} checked bag(s)</Text>
                          </View>
                        )}
                        {segmentDetail?.includedCabinBags?.quantity !== undefined && (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="bag-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>{segmentDetail.includedCabinBags.quantity} cabin bag</Text>
                          </View>
                        )}
                        {segmentDetail?.includedCheckedBags?.weight && (
                          <View style={styles.segmentMetaChip}>
                            <Ionicons name="barbell-outline" size={14} color="#0c2047" />
                            <Text style={styles.segmentMetaText}>
                              {segmentDetail.includedCheckedBags.weight}{segmentDetail.includedCheckedBags.weightUnit ?? "KG"} weight allowance
                            </Text>
                          </View>
                        )}
                      </View>

                      {layover && (
                        <View style={styles.layoverRow}>
                          <Ionicons name="time" size={14} color="#5c6270" />
                          <Text style={styles.layoverText}>
                            Layover in {arrivalLabel} ({segment.arrival.iataCode}) • {layover.hours}h {layover.minutes}m
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

          <View style={styles.sheetActions}>
            <Pressable style={styles.sheetSecondaryButton} onPress={handleCloseSheet}>
              <Text style={styles.sheetSecondaryText}>Close</Text>
            </Pressable>
            <Pressable style={styles.sheetPrimaryButton} onPress={handleCloseSheet}>
              <Text style={styles.sheetPrimaryText}>Proceed to book</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
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
  itinerarySection: {
    gap: 8,
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
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1f6feb',
    borderColor: '#ff9f1c',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#0c2047',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
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
  alignEnd: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  sheetContent: {
    gap: 16,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetPriceBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sheetPriceLabel: {
    fontSize: 12,
    color: '#5c6270',
    fontWeight: '600',
  },
  sheetPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2047',
  },
  sheetRoute: {
    gap: 10,
  },
  sheetRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  sheetSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0c2047',
  },
  sheetSectionSub: {
    fontSize: 12,
    color: '#5c6270',
    fontWeight: '600',
  },
  itineraryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4eaf5',
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itineraryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2047',
  },
  itinerarySub: {
    fontSize: 12,
    color: '#5c6270',
    marginTop: 2,
  },
  itineraryDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itineraryDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  segmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e7ecf5',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  segmentBlock: {
    flex: 1,
    gap: 2,
  },
  segmentTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  segmentDate: {
    fontSize: 12,
    color: '#5c6270',
  },
  segmentAirport: {
    fontSize: 12,
    color: '#0c2047',
    fontWeight: '700',
  },
  segmentTerminal: {
    fontSize: 12,
    color: '#5c6270',
  },
  segmentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  segmentDash: {
    width: 28,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d6deeb',
  },
  segmentDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  segmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f6fd',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  segmentMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2047',
  },
  layoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  layoverText: {
    fontSize: 12,
    color: '#5c6270',
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6deeb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  sheetSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2047',
  },
  sheetPrimaryButton: {
    flex: 1,
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0c2047',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheetPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
