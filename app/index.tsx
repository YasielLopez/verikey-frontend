import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is logged in, go to main app
        router.replace('/(tabs)');
      } else {
        // User is not logged in, go to login
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Show loading screen while checking auth state
  return (
    <ThemedView style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <ActivityIndicator size="large" />
      <ThemedText style={{ 
        marginTop: 16, 
        fontSize: 16 
      }}>
        Loading Verikey...
      </ThemedText>
    </ThemedView>
  );
}