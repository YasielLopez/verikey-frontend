import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KYCAPI } from '@/services/api';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface DocumentInfo {
  documentType: 'drivers_license' | 'passport' | 'national_id' | '';
  idFrontImage: string | null;
  idBackImage: string | null;
  verificationSelfie: string | null;
}

type VerificationStep = 'personal_info' | 'document_selection' | 'id_front' | 'id_back' | 'selfie' | 'review';

export default function KYCVerificationScreen() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('personal_info');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    documentType: '',
    idFrontImage: null,
    idBackImage: null,
    verificationSelfie: null,
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  
  const cameraRef = useRef<any>(null);

  const documentTypes = [
    { key: 'drivers_license', label: "Driver's License", icon: '🚗' },
    { key: 'passport', label: 'Passport', icon: '📘' },
    { key: 'national_id', label: 'National ID Card', icon: '🪪' },
  ];

  const formatDateInput = (input: string) => {
    const digits = input.replace(/\D/g, '');
    
    if (digits.length >= 5) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length >= 1) {
      return digits;
    }
    return '';
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (dateOfBirth.length !== 10) return null;
    
    const [month, day, year] = dateOfBirth.split('/').map(Number);
    if (!month || !day || !year || year < 1900 || year > new Date().getFullYear()) return null;
    
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 && age <= 120 ? age : null;
  };

  const handleDateOfBirthChange = (text: string) => {
    const formatted = formatDateInput(text);
    setPersonalInfo(prev => ({ ...prev, dateOfBirth: formatted }));
    
    const age = calculateAge(formatted);
    setCurrentAge(age);
  };

  const validatePersonalInfo = () => {
    if (!personalInfo.firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return false;
    }
    if (!personalInfo.lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return false;
    }
    if (!personalInfo.dateOfBirth || personalInfo.dateOfBirth.length !== 10) {
      Alert.alert('Error', 'Please enter a valid date of birth (MM/DD/YYYY)');
      return false;
    }
    if (!currentAge || currentAge < 13) {
      Alert.alert('Error', 'You must be at least 13 years old to verify your account');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      const imageBase64 = `data:image/jpeg;base64,${photo.base64}`;
      
      setShowCamera(false);

      if (currentStep === 'id_front') {
        setDocumentInfo(prev => ({ ...prev, idFrontImage: imageBase64 }));
        setCurrentStep('id_back');
      } else if (currentStep === 'id_back') {
        setDocumentInfo(prev => ({ ...prev, idBackImage: imageBase64 }));
        setCurrentStep('selfie');
      } else if (currentStep === 'selfie') {
        setDocumentInfo(prev => ({ ...prev, verificationSelfie: imageBase64 }));
        setCurrentStep('review');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const submitVerification = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const verificationData = {
        document_type: documentInfo.documentType,
        id_front_image: documentInfo.idFrontImage,
        id_back_image: documentInfo.idBackImage,
        verification_selfie: documentInfo.verificationSelfie,
        manual_data: {
          firstName: personalInfo.firstName.trim(),
          lastName: personalInfo.lastName.trim(),
          dateOfBirth: personalInfo.dateOfBirth,
        },
      };

      await KYCAPI.submitVerification(verificationData);

      Alert.alert(
        'Verification Submitted! ✅',
        'Thanks for submitting your information. Someone on our team will take a look and verify that the information matches. This usually takes one to two days.\n\nIf the information matches, your name and age will be linked to your account and users will see that you\'ve been verified when you share a key with them.',
        [
          {
            text: 'Got it!',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error('Verification submission failed:', error);
      
      if (error.response?.status === 409) {
        Alert.alert(
          'Already Submitted',
          'You already have a verification request pending review.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Submission Failed',
          'Failed to submit verification. Please check your connection and try again.',
          [
            { text: 'Try Again', onPress: () => {} },
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() }
          ]
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <ScrollView style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Personal Information</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Enter your personal information exactly as it appears on your ID document.
      </ThemedText>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>First Name</ThemedText>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your first name"
          value={personalInfo.firstName}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, firstName: text }))}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your last name"
          value={personalInfo.lastName}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, lastName: text }))}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>Date of Birth</ThemedText>
        <TextInput
          style={styles.textInput}
          placeholder="MM/DD/YYYY"
          value={personalInfo.dateOfBirth}
          onChangeText={handleDateOfBirthChange}
          keyboardType="numeric"
          maxLength={10}
        />
        {currentAge !== null && (
          <ThemedText style={styles.ageDisplay}>
            Your current age is {currentAge}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !validatePersonalInfo() && styles.disabledButton]}
        onPress={() => {
          if (validatePersonalInfo()) {
            setCurrentStep('document_selection');
          }
        }}
      >
        <ThemedText style={styles.primaryButtonText}>Submit ID →</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDocumentSelection = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Select Document Type</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Choose the type of ID document you want to verify with.
      </ThemedText>

      {documentTypes.map((doc) => (
        <TouchableOpacity
          key={doc.key}
          style={styles.documentOption}
          onPress={() => {
            setDocumentInfo(prev => ({ ...prev, documentType: doc.key as any }));
            setCurrentStep('id_front');
          }}
        >
          <ThemedText style={styles.documentIcon}>{doc.icon}</ThemedText>
          <ThemedText style={styles.documentLabel}>{doc.label}</ThemedText>
          <ThemedText style={styles.documentArrow}>›</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCameraStep = () => {
    const getStepTitle = () => {
      switch (currentStep) {
        case 'id_front': return 'Capture ID Front';
        case 'id_back': return 'Capture ID Back';
        case 'selfie': return 'Take Verification Selfie';
        default: return 'Take Photo';
      }
    };

    const getStepInstructions = () => {
      switch (currentStep) {
        case 'id_front': return 'Position the front of your ID within the frame. Make sure all text is clearly visible.';
        case 'id_back': return 'Now capture the back of your ID. Ensure any barcodes or additional information are visible.';
        case 'selfie': return 'Take a clear selfie. Look directly at the camera and ensure your face is well-lit.';
        default: return 'Take a clear photo';
      }
    };

    const getCameraFacing = () => {
      return currentStep === 'selfie' ? 'front' : 'back';
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (currentStep === 'id_front') {
                setCurrentStep('document_selection');
              } else if (currentStep === 'id_back') {
                setCurrentStep('id_front');
              } else if (currentStep === 'selfie') {
                setCurrentStep('id_back');
              }
            }}
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.cameraTitle}>{getStepTitle()}</ThemedText>
        </View>
        
        <ThemedText style={styles.cameraInstructions}>
          {getStepInstructions()}
        </ThemedText>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowCamera(true)}
        >
          <ThemedText style={styles.primaryButtonText}>Open Camera</ThemedText>
        </TouchableOpacity>

        {/* Camera Modal */}
        <Modal visible={showCamera} animationType="slide">
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={getCameraFacing()}
            >
              <View style={styles.cameraOverlay}>
                <TouchableOpacity
                  style={styles.closeCamera}
                  onPress={() => setShowCamera(false)}
                >
                  <ThemedText style={styles.closeCameraText}>✕</ThemedText>
                </TouchableOpacity>

                <View style={styles.cameraInstructionsOverlay}>
                  <ThemedText style={styles.cameraInstructionsText}>
                    {getStepInstructions()}
                  </ThemedText>
                </View>

                <View style={styles.cameraControls}>
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Review & Submit</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Please review your information before submitting for verification.
      </ThemedText>

      <View style={styles.reviewSection}>
        <ThemedText style={styles.reviewSectionTitle}>Personal Information</ThemedText>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Name:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {personalInfo.firstName} {personalInfo.lastName}
          </ThemedText>
        </View>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Date of Birth:</ThemedText>
          <ThemedText style={styles.reviewValue}>{personalInfo.dateOfBirth}</ThemedText>
        </View>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Age:</ThemedText>
          <ThemedText style={styles.reviewValue}>{currentAge} years old</ThemedText>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <ThemedText style={styles.reviewSectionTitle}>Documents</ThemedText>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Document Type:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {documentTypes.find(d => d.key === documentInfo.documentType)?.label}
          </ThemedText>
        </View>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>ID Front:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {documentInfo.idFrontImage ? '✅ Captured' : '❌ Missing'}
          </ThemedText>
        </View>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>ID Back:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {documentInfo.idBackImage ? '✅ Captured' : '❌ Missing'}
          </ThemedText>
        </View>
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Selfie:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {documentInfo.verificationSelfie ? '✅ Captured' : '❌ Missing'}
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isProcessing && styles.disabledButton]}
        onPress={submitVerification}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <ThemedText style={styles.primaryButtonText}>Submit for Verification</ThemedText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentStep('selfie')}
        disabled={isProcessing}
      >
        <ThemedText style={styles.secondaryButtonText}>← Go Back</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'personal_info':
        return renderPersonalInfoStep();
      case 'document_selection':
        return renderDocumentSelection();
      case 'id_front':
      case 'id_back':
      case 'selfie':
        return renderCameraStep();
      case 'review':
        return renderReviewStep();
      default:
        return renderPersonalInfoStep();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.headerBackText}>← Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Get Verified</ThemedText>
          <View style={styles.headerPlaceholder} />
        </View>

        {renderCurrentStep()}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackText: {
    fontSize: 16,
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 60,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  ageDisplay: {
    marginTop: 8,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#7bc49a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  documentLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  documentArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraInstructions: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeCamera: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeCameraText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraInstructionsOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  cameraInstructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
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
    backgroundColor: '#7bc49a',
  },
  reviewSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});