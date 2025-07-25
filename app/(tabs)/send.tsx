import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Camera, CameraView } from 'expo-camera';
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

type InformationType = 'fullname' | 'firstname' | 'age' | 'location' | 'selfie' | 'photo';

interface FormData {
  label: string;
  targetEmail: string;
  informationTypes: InformationType[];
  expiryHours: number;
  viewsAllowed: number;
  notes: string;
  photos: string[];
}

export default function SendRequestScreen() {
  const [mode, setMode] = useState<'send' | 'request'>('send');
  const [formData, setFormData] = useState<FormData>({
    label: '',
    targetEmail: '',
    informationTypes: [],
    expiryHours: 0,
    viewsAllowed: 0,
    notes: '',
    photos: [],
  });
  
  // Modal states
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState<'selfie' | 'photo'>('selfie');
  
  // Form states
  const [isShareableLink, setIsShareableLink] = useState(false);
  const [recipientChip, setRecipientChip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const cameraRef = useRef(null);

  // Information options exactly as in mockup
  const informationOptions = [
    { key: 'fullname' as InformationType, label: 'Full Name' },
    { key: 'firstname' as InformationType, label: 'First Name Only' },
    { key: 'age' as InformationType, label: 'Age' },
    { key: 'location' as InformationType, label: 'General Current Location' },
    { key: 'selfie' as InformationType, label: 'Current Selfie' },
    { key: 'photo' as InformationType, label: 'Additional Photo' },
  ];

  // Template presets matching the mockup
  const templates = [
    { name: 'Minimal', types: ['firstname'] as InformationType[] },
    { name: 'Standard', types: ['firstname', 'age', 'location'] as InformationType[] },
    { name: 'Full Profile', types: ['fullname', 'age', 'location', 'selfie', 'photo'] as InformationType[] },
  ];

  const toggleInformationType = (type: InformationType) => {
    setFormData(prev => {
      let newTypes = [...prev.informationTypes];
      
      // Handle mutual exclusivity for name fields
      if (type === 'fullname' || type === 'firstname') {
        const otherNameField = type === 'fullname' ? 'firstname' : 'fullname';
        newTypes = newTypes.filter(t => t !== otherNameField);
      }
      
      // Toggle current selection
      if (newTypes.includes(type)) {
        newTypes = newTypes.filter(t => t !== type);
      } else {
        newTypes.push(type);
      }
      
      return { ...prev, informationTypes: newTypes };
    });
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      informationTypes: template.types
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    
    return emailRegex.test(email) || phoneRegex.test(email) || 
           (usernameRegex.test(email) && email.length >= 3 && !email.includes('@'));
  };

  const handleRecipientInput = (text: string) => {
    setFormData(prev => ({ ...prev, targetEmail: text }));
  };

  const createRecipientChip = () => {
    if (validateEmail(formData.targetEmail)) {
      setRecipientChip(formData.targetEmail);
      setFormData(prev => ({ ...prev, targetEmail: '' }));
    }
  };

  const removeRecipientChip = () => {
    setRecipientChip('');
  };

  const toggleShareableLink = () => {
    setIsShareableLink(!isShareableLink);
    if (!isShareableLink) {
      setFormData(prev => ({ ...prev, viewsAllowed: 1 }));
      setRecipientChip('shareable-link');
    } else {
      setFormData(prev => ({ ...prev, viewsAllowed: 0 }));
      setRecipientChip('');
    }
  };

  const openCamera = async (type: 'selfie' | 'photo') => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setCameraType(type);
      setShowCameraModal(true);
    } else {
      Alert.alert('Camera Permission', 'Camera access is required to take photos');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, photo.base64]
        }));
        
        setShowCameraModal(false);
        Alert.alert('Success', `${cameraType === 'selfie' ? 'Selfie' : 'Photo'} captured successfully!`);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const isFormValid = () => {
    const hasLabel = formData.label.trim().length > 0;
    const hasRecipient = recipientChip.length > 0;
    const hasInfo = formData.informationTypes.length > 0;
    const hasExpiry = formData.expiryHours > 0;
    const hasViews = formData.viewsAllowed > 0;
    
    if (mode === 'send') {
      return hasLabel && hasRecipient && hasInfo && hasExpiry && hasViews;
    } else {
      return hasLabel && hasRecipient && hasInfo;
    }
  };

  const submitRequest = async () => {
    if (!isFormValid()) {
      Alert.alert('Form Incomplete', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      Alert.alert(
        'Success',
        `${mode === 'send' ? 'Key sent' : 'Request sent'} successfully!`,
        [{
          text: 'OK',
          onPress: () => {
            // Reset form
            setFormData({
              label: '',
              targetEmail: '',
              informationTypes: [],
              expiryHours: 0,
              viewsAllowed: 0,
              notes: '',
              photos: [],
            });
            setRecipientChip('');
            setIsShareableLink(false);
            setNoteText('');
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {mode === 'send' ? 'Send Key' : 'Request Key'}
        </ThemedText>
        <View style={styles.progressBar} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <View style={[
              styles.modeToggleSlider,
              mode === 'request' && styles.modeToggleSliderRequest
            ]} />
            <TouchableOpacity
              style={styles.modeToggleOption}
              onPress={() => setMode('send')}
            >
              <ThemedText style={[
                styles.modeToggleText,
                mode === 'send' && styles.modeToggleTextActive
              ]}>
                Send
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeToggleOption}
              onPress={() => setMode('request')}
            >
              <ThemedText style={[
                styles.modeToggleText,
                mode === 'request' && styles.modeToggleTextActive
              ]}>
                Request
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Send Mode Content */}
          {mode === 'send' && (
            <>
              {/* Label and Recipient Section */}
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Label</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Give this key a name"
                    value={formData.label}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Send To</ThemedText>
                  {recipientChip && !isShareableLink ? (
                    <View style={styles.recipientChip}>
                      <ThemedText style={styles.chipText}>{recipientChip}</ThemedText>
                      <TouchableOpacity onPress={removeRecipientChip} style={styles.removeBtn}>
                        <ThemedText style={styles.removeBtnText}>×</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : !isShareableLink ? (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email, phone number, or username"
                      value={formData.targetEmail}
                      onChangeText={handleRecipientInput}
                      onBlur={createRecipientChip}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : null}
                  
                  <View style={styles.generateLink}>
                    <TouchableOpacity onPress={toggleShareableLink}>
                      <ThemedText style={[
                        styles.generateLinkText,
                        isShareableLink && styles.generateLinkTextClicked
                      ]}>
                        {isShareableLink ? 'Link Generated' : 'Or Generate Shareable Link'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Templates and Information Section */}
              <View style={styles.formSection}>
                <ThemedText style={styles.label}>Quick Templates</ThemedText>
                <View style={styles.templates}>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.name}
                      style={styles.templateBtn}
                      onPress={() => applyTemplate(template)}
                    >
                      <ThemedText style={styles.templateBtnText}>{template.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.toggleList}>
                  {informationOptions.map((option) => (
                    <View key={option.key}>
                      <TouchableOpacity
                        style={[
                          styles.toggleItem,
                          formData.informationTypes.includes(option.key) && styles.toggleItemActive
                        ]}
                        onPress={() => toggleInformationType(option.key)}
                      >
                        <ThemedText style={styles.toggleItemText}>{option.label}</ThemedText>
                        <View style={[
                          styles.toggleSwitch,
                          formData.informationTypes.includes(option.key) && styles.toggleSwitchActive
                        ]}>
                          <View style={[
                            styles.toggleSwitchKnob,
                            formData.informationTypes.includes(option.key) && styles.toggleSwitchKnobActive
                          ]} />
                        </View>
                      </TouchableOpacity>
                      
                      {/* Photo buttons for selfie/photo toggles */}
                      {formData.informationTypes.includes(option.key) && (option.key === 'selfie' || option.key === 'photo') && (
                        <TouchableOpacity
                          style={styles.photoButton}
                          onPress={() => openCamera(option.key)}
                        >
                          <ThemedText style={styles.photoButtonText}>Take Photo</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Settings Section */}
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Expires In</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectorButton,
                      formData.expiryHours > 0 && styles.selectorButtonSelected
                    ]}
                    onPress={() => setShowExpiryModal(true)}
                  >
                    <ThemedText style={styles.selectorButtonText}>
                      {formData.expiryHours > 0 ? 
                        (formData.expiryHours < 1 ? `${formData.expiryHours * 60} minutes` : 
                         formData.expiryHours === 1 ? '1 hour' : `${formData.expiryHours} hours`) : 
                        'Choose Expiry'
                      }
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Views Allowed</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectorButton,
                      formData.viewsAllowed > 0 && styles.selectorButtonSelected,
                      isShareableLink && styles.selectorButtonDisabled
                    ]}
                    onPress={() => !isShareableLink && setShowViewsModal(true)}
                    disabled={isShareableLink}
                  >
                    <ThemedText style={[
                      styles.selectorButtonText,
                      isShareableLink && styles.selectorButtonTextDisabled
                    ]}>
                      {formData.viewsAllowed > 0 ? 
                        (formData.viewsAllowed === 999 ? 'Unlimited Views' : `${formData.viewsAllowed} View${formData.viewsAllowed > 1 ? 's' : ''}`) : 
                        'Choose Views'
                      }
                    </ThemedText>
                  </TouchableOpacity>
                  {isShareableLink && (
                    <ThemedText style={styles.disclaimer}>
                      For security, links are limited to only one view.
                    </ThemedText>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Include Note (Optional)</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectorButton,
                      formData.notes.length > 0 && styles.selectorButtonSelected
                    ]}
                    onPress={() => setShowNotesModal(true)}
                  >
                    <ThemedText style={styles.selectorButtonText}>
                      {formData.notes.length > 0 ? 'Edit Note' : 'Add Note'}
                    </ThemedText>
                  </TouchableOpacity>
                  {formData.notes.length > 0 && (
                    <View style={styles.notePreview}>
                      <ThemedText style={styles.notePreviewText} numberOfLines={2}>
                        {formData.notes}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Request Mode Content */}
          {mode === 'request' && (
            <>
              {/* Label and Recipient Section */}
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Label</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Give this request a name"
                    value={formData.label}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Request From</ThemedText>
                  {recipientChip ? (
                    <View style={styles.recipientChip}>
                      <ThemedText style={styles.chipText}>{recipientChip}</ThemedText>
                      <TouchableOpacity onPress={removeRecipientChip} style={styles.removeBtn}>
                        <ThemedText style={styles.removeBtnText}>×</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email, phone number, or username"
                      value={formData.targetEmail}
                      onChangeText={handleRecipientInput}
                      onBlur={createRecipientChip}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                </View>
              </View>

              {/* Information Section */}
              <View style={styles.formSection}>
                <ThemedText style={styles.label}>Information to Request</ThemedText>
                <View style={styles.toggleList}>
                  {informationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.toggleItem,
                        formData.informationTypes.includes(option.key) && styles.toggleItemActive
                      ]}
                      onPress={() => toggleInformationType(option.key)}
                    >
                      <ThemedText style={styles.toggleItemText}>{option.label}</ThemedText>
                      <View style={[
                        styles.toggleSwitch,
                        formData.informationTypes.includes(option.key) && styles.toggleSwitchActive
                      ]}>
                        <View style={[
                          styles.toggleSwitchKnob,
                          formData.informationTypes.includes(option.key) && styles.toggleSwitchKnobActive
                        ]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Note Section */}
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Include Note (Optional)</ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectorButton,
                      formData.notes.length > 0 && styles.selectorButtonSelected
                    ]}
                    onPress={() => setShowNotesModal(true)}
                  >
                    <ThemedText style={styles.selectorButtonText}>
                      {formData.notes.length > 0 ? 'Edit Note' : 'Add Note'}
                    </ThemedText>
                  </TouchableOpacity>
                  {formData.notes.length > 0 && (
                    <View style={styles.notePreview}>
                      <ThemedText style={styles.notePreviewText} numberOfLines={2}>
                        {formData.notes}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid() && styles.submitButtonDisabled
            ]}
            onPress={submitRequest}
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#1f2937" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {mode === 'send' ? 'Create and Send Key' : 'Send Request'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Camera Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ThemedView style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="front"
            ref={cameraRef}
          />
          <ThemedView style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCameraModal(false)}
            >
              <ThemedText style={styles.cameraButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <ThemedText style={styles.captureButtonText}>📸</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Expiry Modal */}
      <Modal visible={showExpiryModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Expiration</ThemedText>
            {[0.25, 0.5, 1, 2, 6, 12, 24].map((hours) => (
              <TouchableOpacity
                key={hours}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, expiryHours: hours }));
                  setShowExpiryModal(false);
                }}
              >
                <ThemedText style={styles.modalOptionText}>
                  {hours < 1 ? `${hours * 60} minutes` : 
                   hours === 1 ? '1 hour' : `${hours} hours`}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowExpiryModal(false)}
            >
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Views Modal */}
      <Modal visible={showViewsModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Views Allowed</ThemedText>
            {[1, 2, 3, 999].map((views) => (
              <TouchableOpacity
                key={views}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, viewsAllowed: views }));
                  setShowViewsModal(false);
                }}
              >
                <ThemedText style={styles.modalOptionText}>
                  {views === 999 ? 'Unlimited' : `${views} View${views > 1 ? 's' : ''}`}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowViewsModal(false)}
            >
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={showNotesModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Add Note</ThemedText>
            <TextInput
              style={styles.notesInput}
              placeholder={mode === 'send' ? 
                "Add a personal message with your key..." : 
                "Add a personal message to your request..."
              }
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.modalSave}
              onPress={() => {
                setFormData(prev => ({ ...prev, notes: noteText }));
                setShowNotesModal(false);
              }}
            >
              <ThemedText style={styles.modalSaveText}>Save Note</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setNoteText('');
                setFormData(prev => ({ ...prev, notes: '' }));
                setShowNotesModal(false);
              }}
            >
              <ThemedText style={styles.modalCancelText}>Clear Note</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowNotesModal(false)}
            >
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  header: {
    backgroundColor: '#b5ead7',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#FFD66B',
    width: '0%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  modeToggle: {
    backgroundColor: '#e9f9f3',
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 20,
  },
modeToggleSlider: {
  position: 'absolute',
  top: 4,
  left: 4,
  right: '50%', 
  height: 44,
  backgroundColor: '#b5eac1',
  borderRadius: 999,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
  zIndex: 1,
},
modeToggleSliderRequest: {
  left: '50%',  
  right: 4,       
},
  modeToggleOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    zIndex: 2,
  },
modeToggleText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#6b7280',
},
modeToggleTextActive: {
  color: '#1f2937',
  fontWeight: '700',
},
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
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
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1d5db',
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chipText: {
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
  },
  removeBtn: {
    backgroundColor: 'transparent',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  removeBtnText: {
    fontSize: 16,
    color: '#6b7280',
  },
  generateLink: {
    marginTop: 8,
  },
  generateLinkText: {
    fontSize: 14,
    backgroundColor: '#FFD66B',
    color: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    textAlign: 'center',
    fontWeight: '600',
    overflow: 'hidden',
  },
  generateLinkTextClicked: {
    backgroundColor: '#b5ead7',
  },
  templates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  templateBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    backgroundColor: '#FFD66B',
    color: '#1f2937',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBtnText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
  toggleList: {
    gap: 10,
  },
  toggleItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleItemActive: {
    borderColor: '#b5ead7',
    backgroundColor: 'rgba(181, 234, 215, 0.15)',
  },
  toggleItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  toggleSwitch: {
    position: 'relative',
    width: 44,
    height: 24,
    backgroundColor: '#d1d5db',
    borderRadius: 50,
  },
  toggleSwitchActive: {
    backgroundColor: '#b5eac1',
  },
  toggleSwitchKnob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleSwitchKnobActive: {
    transform: [{ translateX: 20 }],
  },
  photoButton: {
    width: '100%',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#FFD66B',
    color: '#1f2937',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectorButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    color: '#1f2937',
    borderRadius: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  selectorButtonSelected: {
    backgroundColor: '#b5ead7',
  },
  selectorButtonDisabled: {
    opacity: 0.5,
  },
  selectorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'left',
  },
  selectorButtonTextDisabled: {
    color: '#6b7280',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  notePreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fdfdfd',
    borderRadius: 8,
  },
  notePreviewText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#FFD66B',
    color: '#1f2937',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cameraButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonText: {
    fontSize: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    minWidth: 280,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  modalSave: {
    backgroundColor: '#FFD66B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
});