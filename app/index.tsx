import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  FlatList,
  ViewToken,
  StatusBar,
} from 'react-native';

type Slide = {
  title: string;
  subtitle: string;
  image: string;
  cta?: string;
};

const slides: Slide[] = [
  {
    title: 'Booking',
    subtitle: 'Book a flight through simple steps and pay securely.',
    image: 'https://i.imgur.com/MDnpslF.png',
  },
  {
    title: 'Get price alert',
    subtitle: 'Save your search and get notifications when prices change.',
    image: 'https://i.imgur.com/98Qjb5X.png',
    cta: 'Enable Notification',
  },
  {
    title: 'Search flights',
    subtitle: 'Search and compare prices for flights around the world.',
    image: 'https://i.imgur.com/DmqkcGr.png',
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        setActiveIndex(index);
      }
    }
  ).current;

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      router.replace('/(tabs)');
      return;
    }

    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex });
    setActiveIndex(nextIndex);
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <Image source={{ uri: item.image }} style={styles.illustration} contentFit="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>

      {item.cta && (
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>{item.cta}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
      />

      <View style={styles.footer}>
        <Pressable hitSlop={10} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]} onPress={handleNext}>
          <Ionicons name="arrow-forward" size={22} color="#1f7ff0" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  slide: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingTop: 40,
    gap: 18,
  },
  illustration: {
    width: '88%',
    height: 420,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2b2b2b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8a8a8a',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#1f7ff0',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 999,
    width: '78%',
    alignItems: 'center',
    shadowColor: '#1f7ff0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  skipText: {
    color: '#8a8a8a',
    fontSize: 15,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cfd3db',
  },
  dotActive: {
    backgroundColor: '#1f7ff0',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nextButton: {
    backgroundColor: '#f4f6fb',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e8ee',
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});
