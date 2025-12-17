import { getCountryByIATA } from "@/utils/getCountryByIATA";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Airport = {
  IATA: string;
  ICAO: string;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string;
  DST: string | null;
};

type FlightPrice = {
  grandTotal?: string;
  total?: string;
  currency?: string;
};

type FlightParams = {
  validatingAirlineCodes?: string[];
  itineraries?: Array<{
    duration: string;
    segments: Array<{
      departure: { at: string; iataCode: string };
      arrival: { at: string; iataCode: string };
    }>;
  }>;
  price?: FlightPrice;
};

type PassengerPayload = {
  passenger?: {
    travelClass?: string;
  };
};

type Props = {
  visible: boolean;
  flight: FlightParams | null;
  payload?: PassengerPayload | null;
  airports: Airport[];
  onClose: () => void;
};

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

function formatDateTime(dateString?: string) {
  if (!dateString) return "--";

  const date = new Date(dateString);

  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const day = date.toLocaleString("en-US", { weekday: "short" });
  const dayNum = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });

  return `${time} ${day} ${dayNum} ${month}`.toUpperCase();
}

function formatMoney(amount: number, currency: string) {
  const locale = Intl.NumberFormat().resolvedOptions().locale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function FlightBookingSheet({ visible, flight, payload, airports, onClose }: Props) {
  const [contentHeight, setContentHeight] = useState(0);
  const translateY = useSharedValue(0);

  const itinerary = flight?.itineraries?.[0];
  const firstSegment = itinerary?.segments?.[0];
  const lastSegment = itinerary?.segments?.[itinerary?.segments?.length - 1 ?? 0];

  const originCode = firstSegment?.departure?.iataCode;
  const destinationCode = lastSegment?.arrival?.iataCode;
  const originCity = originCode ? getCountryByIATA(airports, originCode) : "";
  const destinationCity = destinationCode ? getCountryByIATA(airports, destinationCode) : "";

  const { hours, minutes } = itinerary?.duration ? parseDuration(itinerary.duration) : { hours: 0, minutes: 0 };
  const departureTime = formatDateTime(firstSegment?.departure?.at);
  const arrivalTime = formatDateTime(lastSegment?.arrival?.at);

  const priceValue = useMemo(() => Number(flight?.price?.grandTotal ?? flight?.price?.total ?? 0), [flight]);
  const currency = flight?.price?.currency ?? "NGN";

  useEffect(() => {
    if (visible) {
      translateY.value = contentHeight || 400;
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, contentHeight]);

  const closeSheet = () => {
    translateY.value = withTiming(contentHeight + 80, { duration: 180 }, () => {
      runOnJS(onClose)();
    });
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startY: number }) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: { startY: number }) => {
      const nextValue = ctx.startY + event.translationY;
      translateY.value = nextValue < 0 ? 0 : nextValue;
    },
    onEnd: (event) => {
      const shouldClose = event.velocityY > 800 || translateY.value > (contentHeight || 400) * 0.4;
      translateY.value = shouldClose
        ? withTiming(contentHeight + 80, { duration: 180 }, () => runOnJS(onClose)())
        : withSpring(0, { damping: 14 });
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeSheet}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View
              style={[styles.sheet, sheetStyle]}
              onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                if (height !== contentHeight) {
                  setContentHeight(height);
                }
              }}
            >
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>{flight?.validatingAirlineCodes?.[0] ?? "FL"}</Text>
                </View>
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.airlineName}>{flight?.validatingAirlineCodes?.[0] ?? "Airline"}</Text>
                  <Text style={styles.subText}>{payload?.passenger?.travelClass ?? "Economy"}</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.priceLabel}>Estimated</Text>
                  <Text style={styles.priceValue}>{formatMoney(priceValue, currency)}</Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.locationColumn}>
                  <Text style={styles.code}>{originCode ?? "---"}</Text>
                  <Text style={styles.city}>{originCity}</Text>
                </View>

                <View style={styles.connector}>
                  <View style={styles.dash} />
                  <View style={styles.planeIconColumn}>
                    <View style={styles.planeIconWrapper}>
                      <Ionicons name="airplane" size={16} color="#0c2047" />
                    </View>
                    <Text style={styles.durationText}>
                      {hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : itinerary?.duration?.replace("PT", "") ?? "--"}
                    </Text>
                  </View>
                  <View style={styles.dash} />
                </View>

                <View style={[styles.locationColumn, styles.alignEnd]}>
                  <Text style={[styles.code, styles.alignEnd]}>{destinationCode ?? "---"}</Text>
                  <Text style={[styles.city, styles.alignEnd]}>{destinationCity}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{arrivalTime}</Text>
                <Text style={styles.timeText}>{departureTime}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.secondaryButton} onPress={closeSheet}>
                  <Text style={styles.secondaryText}>Close</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={closeSheet}>
                  <Text style={styles.primaryText}>Proceed to book</Text>
                </Pressable>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000040",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    gap: 16,
  },
  handle: {
    width: 56,
    height: 5,
    backgroundColor: "#e2e8f4",
    alignSelf: "center",
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eef3fb",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#d7e1f1",
    borderWidth: 1,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2047",
  },
  sheetHeaderText: {
    flex: 1,
    gap: 4,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0c2047",
  },
  subText: {
    fontSize: 12,
    color: "#5c6270",
    fontWeight: "600",
  },
  priceBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    color: "#5c6270",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0c2047",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  locationColumn: {
    flex: 1,
    gap: 6,
  },
  code: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0c2047",
  },
  city: {
    fontSize: 12,
    color: "#5c6270",
  },
  connector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  planeIconColumn: {
    alignItems: "center",
    gap: 6,
  },
  planeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef3fb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7e1f1",
  },
  durationText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0c2047",
  },
  dash: {
    width: 44,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#d6deeb",
  },
  alignEnd: {
    textAlign: "right",
    alignItems: "flex-end",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0c2047",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d6deeb",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2047",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1f6feb",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0c2047",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});
