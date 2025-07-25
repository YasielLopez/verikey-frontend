import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthAPI } from '@/services/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await AuthAPI.signup({ email, password });
      console.log('Signup successful:', response);
      
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully. You can now set up your profile.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Failed',
        error.response?.data?.message || 'Failed to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>
                Join Verikey to start verifying your identity
              </ThemedText>
            </View>

            {/* Signup Form */}
            <View style={styles.form}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: Colors[colorScheme ?? 'light'].text,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: Colors[colorScheme ?? 'light'].text,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: Colors[colorScheme ?? 'light'].text,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.signupButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.signupButtonText}>Create Account</ThemedText>
                )}
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                Already have an account?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleLoginPress}>
                <ThemedText style={[
                  styles.loginLink,
                  { color: Colors[colorScheme ?? 'light'].tint }
                ]}>
                  Sign In
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <ThemedText style={styles.infoText}>
                After creating your account, you'll be able to set up your profile and start requesting verifications.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 120,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  signupButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 16,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
