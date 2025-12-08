import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const flightHeroImage =
  'https://images.unsplash.com/photo-1504198266285-165a04d0c12e?auto=format&fit=crop&w=1400&q=80';

type FormFieldProps = {
  label: string;
  placeholder: string;
};

function FormField({ label, placeholder }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8fa2bc"
        style={styles.input}
      />
    </View>
  );
}

export default function FlightsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Image source={flightHeroImage} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Doesn't write on</Text>
          <Text style={styles.heroTitle}>Plan your next flight</Text>
          <Text style={styles.heroSubtitle}>
            Find great fares and flexible routes before you take off.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Search flights</Text>

        <View style={styles.fieldGrid}>
          <FormField label="From" placeholder="Enter departure city" />
          <FormField label="To" placeholder="Enter destination" />
        </View>

        <View style={styles.fieldGrid}>
          <FormField label="Departure" placeholder="Select date" />
          <FormField label="Return" placeholder="Select date" />
        </View>

        <FormField label="Passengers & Class" placeholder="2 Adults, Economy" />

        <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}>
          <Text style={styles.searchButtonText}>Search flight</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    backgroundColor: '#f5f7fb',
  },
  hero: {
    height: 260,
    borderRadius: 20,
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
    padding: 16,
    shadowColor: '#0c2047',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    marginTop: -60,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2047',
    marginBottom: 12,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2047',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d5deeb',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8fbff',
    color: '#0c2047',
    fontWeight: '600',
  },
  searchButton: {
    marginTop: 4,
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
});
