import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.login({ email, password });
      console.log('Login successful:', response);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPress = () => {
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality would be implemented here');
  };

  const fillTestCredentials = () => {
    setEmail('fresh@example.com');
    setPassword('password123');
  };

  return (
    <ThemedView style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#111827' : '#fdfdfd' }
    ]}>
      {/* Header matching other screens */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Welcome Back</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Sign in to VeriKey
        </ThemedText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Login Form Card - matching other screen cards */}
          <View style={[
            styles.formCard,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)' }
          ]}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email or Username</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                    color: colorScheme === 'dark' ? '#f9fafb' : '#1f2937',
                    backgroundColor: colorScheme === 'dark' ? '#1f2937' : 'white',
                  }
                ]}
                placeholder="Enter your email or username"
                placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                    color: colorScheme === 'dark' ? '#f9fafb' : '#1f2937',
                    backgroundColor: colorScheme === 'dark' ? '#1f2937' : 'white',
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Remember Me and Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[
                  styles.checkbox, 
                  rememberMe && styles.checkboxChecked,
                  { backgroundColor: colorScheme === 'dark' ? '#1f2937' : 'white' }
                ]}>
                  {rememberMe && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </View>
                <ThemedText style={styles.rememberMeText}>Remember me</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleForgotPassword}>
                <ThemedText style={styles.forgotPasswordText}>
                  Forgot password?
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1f2937" size="small" />
              ) : (
                <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link Card */}
          <View style={[
            styles.linkCard,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)' }
          ]}>
            <View style={styles.signUpContainer}>
              <ThemedText style={styles.signUpText}>
                Don't have an account?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleSignupPress}>
                <ThemedText style={styles.signUpLink}>
                  Sign up
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                By signing in, you agree to our{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => Alert.alert('Terms', 'Terms and conditions would open here')}>
                <ThemedText style={styles.termsLink}>Terms</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.termsText}> and </ThemedText>
              <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would open here')}>
                <ThemedText style={styles.termsLink}>Privacy Policy</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Test Credentials */}
          <TouchableOpacity 
            style={[
              styles.testCredentials,
              { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)' }
            ]}
            onPress={fillTestCredentials}
          >
            <ThemedText style={styles.testCredentialsText}>
              🧪 Test with: fresh@example.com / password123
            </ThemedText>
            <ThemedText style={styles.testCredentialsSubtext}>
              Tap here to auto-fill
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor moved to dynamic styling
  },
  header: {
    backgroundColor: '#b5ead7', // Match other screen headers
    paddingTop: 80, // More space to avoid notch/island
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    opacity: 0.8,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20, // Match other screens
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically
    paddingTop: 20,
    paddingBottom: 40, // Reduced bottom space
  },
  formCard: {
    // backgroundColor moved to dynamic styling
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    // borderColor, color, backgroundColor moved to dynamic styling
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#b5ead7',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor moved to dynamic styling
  },
  checkboxChecked: {
    backgroundColor: '#b5ead7',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 16,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    opacity: 0.7,
  },
  signInButton: {
    backgroundColor: '#FFD66B', // Match other screen buttons
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  linkCard: {
    // backgroundColor moved to dynamic styling
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    opacity: 0.9,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    textAlign: 'center',
  },
  termsLink: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 16,
  },
  testCredentials: {
    // backgroundColor moved to dynamic styling
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  testCredentialsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  testCredentialsSubtext: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});