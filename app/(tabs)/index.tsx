import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Category = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Hotel = {
  name: string;
  location: string;
  country: string;
  price: string;
  rating: string;
  image: string;
  badge?: string;
};

const categories: Category[] = [
  { label: 'Hotel', icon: 'bed-outline' },
  { label: 'Flight', icon: 'airplane-outline' },
  { label: 'Place', icon: 'map-outline' },
  { label: 'Food', icon: 'fast-food-outline' },
];

const popularHotels: Hotel[] = [
  {
    name: 'Santorini',
    location: 'Greece',
    country: 'Greece',
    price: '$488/night',
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Hotel Royal',
    location: 'Spain',
    country: 'Spain',
    price: '$280/night',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=900&q=80',
  },
];

const hotDeal: Hotel = {
  name: 'BaLi Motel Vung Tau',
  location: 'Indonesia',
  country: 'Indonesia',
  price: '$580/night',
  rating: '4.9',
  image:
    'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=1200&q=80',
  badge: '25% OFF',
};

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Hotel');

  const CategoryPill = ({ label, icon }: Category) => {
    const isActive = selectedCategory === label;

    return (
      <Pressable
        onPress={() => setSelectedCategory(label)}
        style={({ pressed }) => [
          styles.categoryPill,
          isActive && styles.categoryPillActive,
          pressed && styles.pillPressed,
        ]}>
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? '#1e73f6' : '#9aa5b5'}
        />
        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const renderHotelCard = ({ item }: { item: Hotel }) => (
    <View style={styles.hotelCard}>
      <Image source={item.image} style={styles.hotelImage} contentFit="cover" />
      <View style={styles.hotelInfo}>
        <View>
          <Text style={styles.hotelName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#9aa5b5" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#f9b62d" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.greeting}>Where you</Text>
            <Text style={styles.greeting}>wanna go?</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Ionicons name="search" size={20} color="#1e73f6" />
            </Pressable>
            <Image
              source="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60"
              style={styles.avatar}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}>
          {categories.map((category) => (
            <CategoryPill key={category.label} {...category} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Hotels</Text>
          <Pressable>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>

        <FlatList
          data={popularHotels}
          renderItem={renderHotelCard}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hotelList}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hot Deals</Text>
        </View>

        <View style={styles.hotDealCard}>
          <Image source={hotDeal.image} style={styles.hotDealImage} contentFit="cover" />
          <View style={styles.hotDealOverlay} />
          <View style={styles.hotDealContent}>
            {hotDeal.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{hotDeal.badge}</Text>
              </View>
            )}
            <View style={styles.hotDealFooter}>
              <View>
                <Text style={styles.hotDealTitle}>{hotDeal.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="#d7e3ff" />
                  <Text style={styles.hotDealLocation}>{hotDeal.location}</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.hotDealPrice}>{hotDeal.price}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#f9b62d" />
                  <Text style={styles.hotDealRating}>{hotDeal.rating}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f8',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  titleContainer: {
    gap: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2735',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1f2735',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  pillRow: {
    gap: 10,
    paddingVertical: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#1f2735',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  categoryPillActive: {
    backgroundColor: '#e9f1ff',
  },
  pillText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#1e73f6',
  },
  pillPressed: {
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2735',
  },
  sectionLink: {
    color: '#1e73f6',
    fontWeight: '600',
  },
  hotelList: {
    gap: 14,
    paddingVertical: 12,
  },
  hotelCard: {
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1f2735',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    marginRight: 14,
  },
  hotelImage: {
    width: '100%',
    height: 130,
  },
  hotelInfo: {
    padding: 12,
    gap: 10,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2735',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  locationText: {
    color: '#9aa5b5',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2735',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '700',
    color: '#1f2735',
  },
  hotDealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1f2735',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  hotDealImage: {
    width: '100%',
    height: 230,
  },
  hotDealOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  hotDealContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f26768',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hotDealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  hotDealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  hotDealLocation: {
    color: '#d7e3ff',
    fontWeight: '600',
  },
  hotDealPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  hotDealRating: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
