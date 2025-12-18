import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack>
      <Stack.Screen name="flights" options={{ title: 'Flights', headerShown: false }}  />
      <Stack.Screen name="flight-results" options={{ title: 'Flight results', headerShown: false }} />
      <Stack.Screen name="passenger" options={{ title: 'Passenger', headerShown: false }} />
      <Stack.Screen name="hotels" options={{ title: 'Hotels' }} />
      <Stack.Screen name="rides" options={{ title: 'Rides' }} />
      <Stack.Screen name="visa" options={{ title: 'Visa' }} />
    </Stack>
  );
}
