import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';

const highlights = [
  {
    icon: 'airplane',
    title: 'Flights made easy',
    description: 'Smart recommendations, fare alerts, and one-tap checkouts keep you on schedule.',
  },
  {
    icon: 'bed',
    title: 'Hotels you will love',
    description: 'Curated stays with flexible cancellation and instant confirmations.',
  },
  {
    icon: 'car',
    title: 'Rides that meet you',
    description: 'Airport pickups, city rides, and trusted drivers wherever you land.',
  },
];

export default function OnboardingScreen() {
  return (
    <View style={[styles.container, styles.background]}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}> 
                <Ionicons name="sparkles" size={16} color="#0f172a" />
                <Text style={styles.badgeText}>Travel smarter</Text>
              </View>
              <Text style={styles.appName}>Mazo</Text>
            </View>
            <Text style={styles.title}>Your gateway to effortless journeys</Text>
            <Text style={styles.subtitle}>
              Book flights, rides, and hotels in a single flow. Track every detail with a beautifully
              organized travel hub.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroGradient}>
              <View style={styles.heroTopRow}>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={18} color="#9dc6ff" />
                  <Text style={styles.locationText}>NYC → Paris</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>On time</Text>
                </View>
              </View>
              <View style={styles.heroImageWrapper}>
                <View style={styles.heroGlow} />
                <Image
                  source={require('@/assets/images/react-logo.png')}
                  style={styles.heroImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Boarding</Text>
                  <Text style={styles.metricValue}>23m</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Carbon offset</Text>
                  <Text style={styles.metricValue}>Included</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardsGrid}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#0f172a" />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDescription}>{item.description}</Text>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.ctaText}>Start exploring</Text>
            <Ionicons name="arrow-forward" size={18} color="#0f172a" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    backgroundColor: '#0b1224',
  },
  backgroundGlowOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(82, 155, 255, 0.18)',
    top: -80,
    left: -120,
    opacity: 0.8,
  },
  backgroundGlowTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(240, 180, 255, 0.12)',
    bottom: -60,
    right: -80,
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9dc6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  appName: {
    color: '#9dc6ff',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 1,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    color: '#a7b7d6',
    fontSize: 15,
    lineHeight: 22,
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroGradient: {
    padding: 20,
    gap: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationText: {
    color: '#e2e8f0',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pill: {
    backgroundColor: 'rgba(157, 198, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(157,198,255,0.4)',
  },
  pillText: {
    color: '#9dc6ff',
    fontWeight: '700',
    fontSize: 12,
  },
  heroImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(82, 155, 255, 0.25)',
    shadowColor: 'rgba(82, 155, 255, 0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  heroImage: {
    width: 140,
    height: 140,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  metric: {
    gap: 4,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9dc6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  featureDescription: {
    color: '#a7b7d6',
    fontSize: 12,
    lineHeight: 18,
  },
  ctaButton: {
    marginTop: 6,
    backgroundColor: '#9dc6ff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#9dc6ff',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  ctaButtonPressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.9,
  },
  ctaText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
