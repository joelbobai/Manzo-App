import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.eyebrow}>Flight results</Text>
        <Text style={styles.title}>We found options for you</Text>
        <Text style={styles.subtitle}>
          {params.source === 'live'
            ? 'Here are the details returned by the search API.'
            : 'Showing a preview of what will be sent once the search API is connected.'}
        </Text>
      </View>

      {parsedResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API response</Text>
          <Text style={styles.codeBlock}>{JSON.stringify(parsedResult, null, 2)}</Text>
        </View>
      )}

      {parsedPayload && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Search payload</Text>
          <Text style={styles.codeBlock}>{JSON.stringify(parsedPayload, null, 2)}</Text>
        </View>
      )}

      {!parsedPayload && !parsedResult && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No data available</Text>
          <Text style={styles.subtitle}>Try launching a new search to see flight details here.</Text>
        </View>
      )}

      <Pressable style={styles.actionButton} onPress={() => router.back()}>
        <Text style={styles.actionText}>Back to search</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: '#f5f7fb',
    flexGrow: 1,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    color: '#1e73f6',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c2047',
  },
  subtitle: {
    fontSize: 14,
    color: '#4c4c4c',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4eaf5',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2047',
  },
  codeBlock: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f4fb',
    borderRadius: 12,
    padding: 12,
    color: '#0c2047',
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: '#1e73f6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
