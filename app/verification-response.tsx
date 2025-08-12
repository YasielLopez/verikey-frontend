import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VerificationAPI } from '@/services/api';
import { colors, dimensions, mergeStyles, sharedStyles } from '@/services/sharedStyles';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ResponseParams {
  requestId: string;
  requestTitle: string;
  requesterEmail: string;
  informationTypes: string;
}

interface ResponseData {
  fullname?: string;
  firstname?: string;
  age?: string;
  location?: {
    latitude: number;
    longitude: number;
    cityDisplay: string;
  };
  selfie?: string;
  photo?: string;
}

type InformationType = 'fullname' | 'firstname' | 'age' | 'location' | 'selfie' | 'photo';

export default function VerificationResponseScreen() {
  const params = useLocalSearchParams<ResponseParams>();
  const [informationTypes, setInformationTypes] = useState<InformationType[]>([]);
  const [responseData, setResponseData] = useState<ResponseData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'selfie' | 'photo'>('selfie');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef(null);

  useEffect(() => {
    try {
      const types = JSON.parse(params.informationTypes || '[]') as InformationType[];
      setInformationTypes(types);
      console.log('📋 Information types requested:', types);
    } catch (error) {
      console.error('Failed to parse information types:', error);
      Alert.alert('Error', 'Invalid request data');
      router.back();
    }
  }, [params.informationTypes]);

  const handleTextInput = (type: 'fullname' | 'firstname' | 'age', value: string) => {
    setResponseData(prev => ({ ...prev, [type]: value }));
  };

  const handleLocationCapture = async () => {
    try {
      setIsCapturingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed for verification');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let cityDisplay = 'Near your current location';
      if (reverseGeocodedAddress.length > 0) {
        const address = reverseGeocodedAddress[0];
        const city = address.city || address.subregion || 'Unknown City';
        const state = address.region || '';
        cityDisplay = state ? `Near ${city}, ${state}` : `Near ${city}`;
      }

      setResponseData(prev => ({
        ...prev,
        location: { latitude, longitude, cityDisplay }
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleCameraCapture = async (type: 'selfie' | 'photo') => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed for verification');
      return;
    }

    setCameraType(type);
    setCameraFacing(type === 'selfie' ? 'front' : 'back');
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const photoBase64 = `data:image/jpeg;base64,${base64}`;

      setResponseData(prev => ({
        ...prev,
        [cameraType]: photoBase64
      }));

      setShowCamera(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const flipCamera = () => {
    setCameraFacing(prev => prev === 'front' ? 'back' : 'front');
  };

  const isFormComplete = () => {
    return informationTypes.every(type => {
      const data = responseData[type];
      return data !== undefined && data !== null && data !== '';
    });
  };

  const getProgressPercentage = () => {
    if (informationTypes.length === 0) return 0;
    
    const completed = informationTypes.filter(type => {
      const data = responseData[type];
      return data !== undefined && data !== null && data !== '';
    }).length;
    
    return Math.round((completed / informationTypes.length) * 100);
  };

  const submitResponse = async () => {
    const missingData = informationTypes.filter(type => !responseData[type]);
    if (missingData.length > 0) {
      Alert.alert('Incomplete', `Please provide: ${missingData.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submissionData: any = {
        request_id: parseInt(params.requestId),
      };

      if (responseData.location) {
        submissionData.latitude = responseData.location.latitude;
        submissionData.longitude = responseData.location.longitude;
      }

      if (responseData.selfie) {
        submissionData.photo_base64 = responseData.selfie;
      } else if (responseData.photo) {
        submissionData.photo_base64 = responseData.photo;
      }

      const otherData: any = {};
      if (responseData.fullname) otherData.fullname = responseData.fullname;
      if (responseData.firstname) otherData.firstname = responseData.firstname;
      if (responseData.age) otherData.age = responseData.age;
      
      if (Object.keys(otherData).length > 0) {
        submissionData.additional_data = JSON.stringify(otherData);
      }

      console.log('🚀 Submitting verification response:', submissionData);
      await VerificationAPI.submitVerification(submissionData);

      Alert.alert(
        'Success!',
        `Your verification response has been sent successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll();
              router.replace('/(tabs)/requests');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Submission failed:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormSection = (type: InformationType) => {
    const isCompleted = responseData[type] !== undefined && responseData[type] !== null && responseData[type] !== '';

    switch (type) {
      case 'fullname':
        return (
          <View key="fullname" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>👤</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={responseData.fullname || ''}
              onChangeText={(value) => handleTextInput('fullname', value)}
              autoCapitalize="words"
            />
          </View>
        );

      case 'firstname':
        return (
          <View key="firstname" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>👤</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>First Name</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your first name"
              value={responseData.firstname || ''}
              onChangeText={(value) => handleTextInput('firstname', value)}
              autoCapitalize="words"
            />
          </View>
        );

      case 'age':
        return (
          <View key="age" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>🎂</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>Age</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your age"
              value={responseData.age || ''}
              onChangeText={(value) => handleTextInput('age', value)}
              keyboardType="numeric"
            />
          </View>
        );

      case 'location':
        return (
          <View key="location" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>📍</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>Current Location</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            {responseData.location ? (
              <View style={styles.locationResult}>
                <ThemedText style={styles.locationText}>{responseData.location.cityDisplay}</ThemedText>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleLocationCapture}
                  disabled={isCapturingLocation}
                >
                  <ThemedText style={styles.retakeButtonText}>
                    {isCapturingLocation ? 'Getting Location...' : 'Update Location'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleLocationCapture}
                disabled={isCapturingLocation}
              >
                <ThemedText style={styles.captureButtonText}>
                  {isCapturingLocation ? 'Getting Location...' : 'Get Current Location'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'selfie':
        return (
          <View key="selfie" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>🤳</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>Selfie Verification</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            {responseData.selfie ? (
              <View style={styles.photoResult}>
                <Image source={{ uri: responseData.selfie }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => handleCameraCapture('selfie')}
                >
                  <ThemedText style={styles.retakeButtonText}>Retake Selfie</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => handleCameraCapture('selfie')}
              >
                <ThemedText style={styles.captureButtonText}>Take Selfie</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'photo':
        return (
          <View key="photo" style={[styles.fieldSection, isCompleted && styles.fieldSectionCompleted]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <ThemedText style={styles.fieldIconText}>📸</ThemedText>
              </View>
              <ThemedText style={styles.fieldLabel}>Additional Photo</ThemedText>
              {isCompleted && <ThemedText style={styles.completedIcon}>✓</ThemedText>}
            </View>
            {responseData.photo ? (
              <View style={styles.photoResult}>
                <Image source={{ uri: responseData.photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => handleCameraCapture('photo')}
                >
                  <ThemedText style={styles.retakeButtonText}>Retake Photo</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => handleCameraCapture('photo')}
              >
                <ThemedText style={styles.captureButtonText}>Take Photo</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={sharedStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backArrow}>‹</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Verification Response</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {params.requestTitle || 'Verification Request'}
          </ThemedText>
          <ThemedText style={styles.headerFrom}>
            From: {params.requesterEmail}
          </ThemedText>
        </View>
        <View style={styles.headerSpacer} />
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
          </View>
          <ThemedText style={styles.progressText}>
            {getProgressPercentage()}% Complete
          </ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={mergeStyles(sharedStyles.card, styles.instructionCard)}>
            <ThemedText style={styles.instructionText}>
              Please provide the following information to complete the verification:
            </ThemedText>
          </View>

          {informationTypes.map(type => renderFormSection(type))}

          {/* Submit Button */}
          <TouchableOpacity
            style={mergeStyles(
              sharedStyles.primaryButton,
              styles.submitButton,
              !isFormComplete() && styles.submitButtonDisabled
            )}
            onPress={submitResponse}
            disabled={!isFormComplete() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Send Verification Response
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={cameraFacing}
            ref={cameraRef}
          />
          
          <TouchableOpacity
            style={styles.cameraCloseButton}
            onPress={() => setShowCamera(false)}
          >
            <ThemedText style={styles.cameraCloseIcon}>✕</ThemedText>
          </TouchableOpacity>
          
          {cameraType === 'photo' && (
            <TouchableOpacity
              style={styles.cameraFlipButton}
              onPress={flipCamera}
            >
              <ThemedText style={styles.cameraFlipIcon}>🔄</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.cameraCaptureButton}
            onPress={takePicture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <View style={styles.cameraInstructions}>
            <ThemedText style={styles.cameraInstructionsText}>
              {cameraType === 'selfie'
                ? 'Take a clear selfie for verification'
                : 'Take a clear photo as requested'}
            </ThemedText>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  headerFrom: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  headerSpacer: {
    height: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 214, 107, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  instructionCard: {
    marginTop: 20,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fieldSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  fieldSectionCompleted: {
    borderColor: colors.borderActive,
    backgroundColor: 'rgba(181, 234, 215, 0.1)',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldIconText: {
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  completedIcon: {
    fontSize: 20,
    color: '#10b981',
    fontWeight: '700',
  },
  textInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.medium,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  captureButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: dimensions.borderRadius.medium,
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationResult: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: dimensions.borderRadius.medium,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
  },
  photoResult: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: dimensions.borderRadius.medium,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: dimensions.borderRadius.medium,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: colors.accent,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 60,
    left: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  cameraFlipButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFlipIcon: {
    fontSize: 20,
  },
  cameraCaptureButton: {
    position: 'absolute',
    bottom: 120,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
  },
  cameraInstructions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraInstructionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});