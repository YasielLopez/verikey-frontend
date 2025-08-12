import { AuthAPI } from '@/services/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import Svg, { Path } from 'react-native-svg';

const EyeIcon = ({ color = '#9CA3AF' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const EyeOffIcon = ({ color = '#9CA3AF' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ArrowLeftIcon = ({ color = '#9CA3AF' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#7FD17F' }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const AlertIcon = ({ color = '#ef4444' }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SignalIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <Path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
  </Svg>
);

const WifiIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <Path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
  </Svg>
);

const BatteryIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <Path d="M23 11v2M2 7h18a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V8a1 1 0 011-1z"/>
  </Svg>
);

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [dobAge, setDobAge] = useState<number | null>(null);
  const [screenName, setScreenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const calculateAge = (dobStr: string) => {
    const [month, day, year] = dobStr.split('/').map(str => parseInt(str));
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      setDobAge(null);
      return;
    }
    
    if (month < 1 || month > 12) {
      setDobAge(null);
      return;
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      setDobAge(null);
      return;
    }
    
    const birthDate = new Date(year, month - 1, day);
    
    if (isNaN(birthDate.getTime())) {
      setDobAge(null);
      return;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setDobAge(age);
  };

  const handleDobChange = (text: string) => {
    setDob(text);
    if (text.length === 10) {
      calculateAge(text);
    } else {
      setDobAge(null);
    }
  };

  React.useEffect(() => {
    if (!screenName || screenName.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const response = await AuthAPI.checkUsername(screenName);
        setUsernameAvailable(response.available);
      } catch (error) {
        console.error('Username check failed:', error);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [screenName]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName || !dob || !screenName) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }
    
    if (dobAge === null) {
      Alert.alert('Error', 'Please enter a valid date of birth in MM/DD/YYYY format');
      return false;
    }
    
    if (dobAge < 18) {
      Alert.alert('Age Restriction', 'You must be at least 18 years old to use Verikey');
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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (screenName.length < 3 || screenName.length > 30) {
      Alert.alert('Error', 'Username must be between 3 and 30 characters');
      return false;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(screenName)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, underscores, and dots');
      return false;
    }

    if (usernameAvailable === false) {
      Alert.alert('Error', 'This username is already taken. Please choose another.');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const signupData = {
        email: email.trim(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        screen_name: screenName,
        date_of_birth: dob
      };

      console.log('📤 Sending signup data:', { ...signupData, password: '***' });
      
      const response = await AuthAPI.signupComplete(signupData);
      console.log('✅ Signup successful:', response);
      
      Alert.alert(
        'Welcome to Verikey!',
        'Your account has been created successfully.',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors.join('\n');
        Alert.alert('Signup Failed', errors);
      } else if (error.response?.status === 409) {
        Alert.alert(
          'Account Already Exists',
          error.response.data.error || 'This email or username is already taken'
        );
      } else {
        Alert.alert(
          'Signup Failed',
          error.response?.data?.error || 'Failed to create account. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://verikey.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://verikey.app/privacy');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../verikey-frontend/assets/images/white-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>CREATE YOUR NEW ACCOUNT</Text>
            </View>

            {/* Notice */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Your name and age can't be changed without contacting support.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* First Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              {/* Date of Birth */}
              <View style={styles.inputWrapper}>
                <MaskedTextInput
                  mask="99/99/9999"
                  keyboardType="numeric"
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder="Date of Birth (MM/DD/YYYY)"
                  placeholderTextColor="#6B7280"
                  style={styles.input}
                  editable={!loading}
                />
                {dobAge !== null && dobAge >= 18 && (
                  <Text style={styles.ageSuccess}>✓ Age: {dobAge} years old</Text>
                )}
                {dobAge !== null && dobAge < 18 && (
                  <Text style={styles.ageError}>❌ You must be 18+ to use Verikey</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Username */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={screenName}
                  onChangeText={setScreenName}
                  placeholder="Username"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {checkingUsername && (
                  <View style={styles.usernameStatus}>
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  </View>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <View style={styles.usernameStatus}>
                    <CheckIcon />
                  </View>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <View style={styles.usernameStatus}>
                    <AlertIcon />
                  </View>
                )}
                {usernameAvailable === true && (
                  <Text style={styles.usernameAvailable}>✓ Username available</Text>
                )}
                {usernameAvailable === false && (
                  <Text style={styles.usernameError}>This username is already taken</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password (min. 6 characters)"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSignup}
                disabled={loading || (dobAge !== null && dobAge < 18) || usernameAvailable === false}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.submitButtonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Terms Notice */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>By creating an account, you agree to our</Text>
              <View style={styles.termsLinksRow}>
                <TouchableOpacity onPress={openTerms}>
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity onPress={openPrivacy}>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Link */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 8,
  },
  time: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 40,
  },
  centerContent: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    height: 50,
    width: 140,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  noticeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 24,
  },
  noticeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    gap: 24,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 8,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 8,
    paddingRight: 30,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    padding: 4,
  },
  usernameStatus: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  usernameAvailable: {
    color: '#7FD17F',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  usernameError: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  ageSuccess: {
    color: '#7FD17F',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  ageError: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#c2ff6b',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termsContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  termsLink: {
    color: 'white',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  toggleLink: {
    color: '#c2ff6b',
    fontSize: 14,
    fontWeight: '600',
  },
});