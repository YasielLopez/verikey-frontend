import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { KeysAPI, ProfileAPI, RequestsAPI } from '@/services/api';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronDown,
  Loader2,
  MapPin,
  RefreshCw
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_PURPLE = '#D9B8F3';
const ACCENT_GREEN = '#c2ff6b';

type InformationType = 'fullname' | 'firstname' | 'age' | 'location' | 'selfie' | 'photo';

interface InformationOption {
  key: InformationType;
  label: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  cityDisplay: string;
}

export default function SendScreen() {
  const { user } = useAuth();

  const [mode, setMode] = useState<'send' | 'request'>('send');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // form
  const [label, setLabel] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [informationTypes, setInformationTypes] = useState<InformationType[]>([]);
  const [viewsAllowed, setViewsAllowed] = useState(0);
  const [notes, setNotes] = useState('');

  // recipients
  const [recipientChip, setRecipientChip] = useState('');
  const [recipientDisplayName, setRecipientDisplayName] = useState('');
  const [isShareableLink, setIsShareableLink] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // media & location
  const [capturedPhotos, setCapturedPhotos] = useState<{[k: string]: string}>({});
  const [capturedLocation, setCapturedLocation] = useState<LocationData | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // camera & preview
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'selfie' | 'photo'>('selfie');
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewUri, setPreviewUri] = useState<string>('');

  // modal states
  const [showViewsModal, setShowViewsModal] = useState(false);

  // submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // skeleton
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const informationOptions: InformationOption[] = [
    { key: 'fullname', label: 'Full Name' },
    { key: 'firstname', label: 'First Name Only' },
    { key: 'age', label: 'Age' },
    { key: 'location', label: 'General Current Location' },
    { key: 'selfie', label: 'Current Selfie' },
    { key: 'photo', label: 'Additional Photo' },
  ];

  const templates = [
    { name: 'Minimal', types: ['firstname'] as InformationType[] },
    { name: 'Standard', types: ['firstname', 'age', 'location'] as InformationType[] },
    { name: 'Full Profile', types: ['fullname', 'age', 'location', 'selfie', 'photo'] as InformationType[] },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // reset on mode change
  useEffect(() => {
    setLabel('');
    setTargetEmail('');
    setInformationTypes([]);
    setViewsAllowed(0);
    setNotes('');
    setRecipientChip('');
    setRecipientDisplayName('');
    setIsShareableLink(false);
    setCapturedPhotos({});
    setCapturedLocation(null);
  }, [mode]);

  const calculateProgress = useCallback(() => {
    let completed = 0;
    let total = mode === 'request' ? 3 : 4;

    if (label.trim().length > 0) completed++;
    if (recipientChip.length > 0 || isShareableLink) completed++;
    if (informationTypes.length > 0) completed++;
    if (mode === 'send' && (viewsAllowed > 0 || isShareableLink)) completed++;

    return Math.round((completed / total) * 100);
  }, [mode, label, recipientChip, isShareableLink, informationTypes, viewsAllowed]);

  const handleModeChange = (m: 'send' | 'request') => {
    setMode(m);
    setShowDropdown(false);
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setInformationTypes(template.types);
    Object.keys(capturedPhotos).forEach(k => {
      if (!template.types.includes(k as InformationType)) {
        setCapturedPhotos(prev => {
          const { [k]: _r, ...rest } = prev;
          return rest;
        });
      }
    });
    if (!template.types.includes('location')) setCapturedLocation(null);
    if (template.types.includes('location') && mode === 'send') {
      setTimeout(() => captureCurrentLocation(), 50);
    }
  };

  const toggleInformationType = (type: InformationType) => {
    let list = [...informationTypes];

    if (type === 'fullname' || type === 'firstname') {
      const other = type === 'fullname' ? 'firstname' : 'fullname';
      list = list.filter(t => t !== other);
    }

    if (list.includes(type)) {
      list = list.filter(t => t !== type);
      if (type === 'selfie' || type === 'photo') {
        setCapturedPhotos(prev => {
          const { [type]: _r, ...rest } = prev;
          return rest;
        });
      }
      if (type === 'location') setCapturedLocation(null);
    } else {
      list.push(type);
      if (type === 'location' && mode === 'send') {
        captureCurrentLocation();
      }
    }
    setInformationTypes(list);
  };

  const captureCurrentLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      let cityDisplay = 'Near your current location';
      if (reverse.length > 0) {
        const addr = reverse[0];
        const city = addr.city || addr.subregion || 'Unknown City';
        const state = addr.region || '';
        cityDisplay = state ? `Near ${city}, ${state}` : `Near ${city}`;
      }
      setCapturedLocation({ latitude, longitude, cityDisplay });
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleRecipientLookup = async () => {
    if (!targetEmail.trim()) return;
    setSearchingUsers(true);
    try {
      const result = await ProfileAPI.lookupUser(targetEmail);
      if (result) {
        setRecipientChip(result.email || targetEmail);
        setRecipientDisplayName(result.display_name || targetEmail);
        setTargetEmail('');
      } else {
        Alert.alert('Not found', 'No user found with that username.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to look up user.');
    } finally {
      setSearchingUsers(false);
    }
  };

  const removeRecipientChip = () => {
    setRecipientChip('');
    setRecipientDisplayName('');
  };

  const toggleShareableLink = () => {
    const next = !isShareableLink;
    setIsShareableLink(next);
    if (next) {
      setRecipientChip('shareable-link');
      setRecipientDisplayName('Anyone with the link');
      setViewsAllowed(1);
    } else {
      setRecipientChip('');
      setRecipientDisplayName('');
      setViewsAllowed(0);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      const base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
      const uri = `data:image/jpeg;base64,${base64}`;
      setCapturedPhotos(prev => ({ ...prev, [cameraType]: uri }));
      setShowCamera(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const isFormValid = () => {
    const hasLabel = label.trim().length > 0;
    const hasRecipient = recipientChip.length > 0 || isShareableLink;
    const hasInfo = informationTypes.length > 0;
    if (mode === 'send') {
      const hasViews = viewsAllowed > 0 || isShareableLink;
      return hasLabel && hasRecipient && hasInfo && hasViews;
    }
    return hasLabel && hasRecipient && hasInfo;
  };

  const submit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    try {
      if (mode === 'send') {
        await KeysAPI.createShareableKey({
          label,
          recipient_email: isShareableLink ? null : recipientChip,
          is_shareable_link: isShareableLink,
          information_types: informationTypes,
          views_allowed: isShareableLink ? 999 : viewsAllowed,
          notes: notes.trim(),
          location_data: capturedLocation,
          selfie_data: capturedPhotos.selfie,
          photo_data: capturedPhotos.photo,
        });
        Alert.alert('Success', 'Key created and sent.', [{ text: 'OK', onPress: () => router.push('/(tabs)') }]);
      } else {
        await RequestsAPI.createRequest({
          label,
          target_email: isShareableLink ? null : recipientChip,
          is_shareable_link: isShareableLink,
          information_types: informationTypes,
          notes: notes.trim(),
        });
        Alert.alert('Success', 'Request sent.', [{ text: 'OK', onPress: () => router.push('/(tabs)/requests') }]);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'Failed to submit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.9} style={[styles.toggle, isOn && styles.toggleActive]}>
      <View style={[styles.toggleKnob, isOn && styles.toggleKnobActive]} />
    </TouchableOpacity>
  );

  const Skeleton = () => (
    <Animated.View
      style={[
        styles.skeletonCard,
        { opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }) }
      ]}
    >
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonInput} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonBtn} />
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.dropdownSection}>
                <View style={[styles.dropdownButton, styles.dropdownOffset]}>
                  <Text style={styles.headerTitle}>Send Key</Text>
                  <ChevronDown size={20} color="#9ca3af" />
                </View>
              </View>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => {}}>
                <Bell size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}>
            {[1,2,3].map(i => <Skeleton key={i} />)}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.dropdownSection}>
                <TouchableOpacity
                  onPress={() => setShowDropdown(!showDropdown)}
                  style={[styles.dropdownButton, styles.dropdownOffset]}
                  activeOpacity={1}
                >
                  <Text style={styles.headerTitle}>
                    {mode === 'send' ? 'Send Key' : 'Request Key'}
                  </Text>
                  <ChevronDown
                    size={20}
                    color="#9ca3af"
                    style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      onPress={() => handleModeChange('send')}
                      style={[styles.dropdownItem, mode === 'send' && styles.dropdownItemActive]}
                      activeOpacity={1}
                    >
                      <Text style={[styles.dropdownItemText, mode === 'send' && styles.dropdownItemTextActive]}>
                        Send Key
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.dropdownDivider} />

                    <TouchableOpacity
                      onPress={() => handleModeChange('request')}
                      style={[styles.dropdownItem, mode === 'request' && styles.dropdownItemActive]}
                      activeOpacity={1}
                    >
                      <Text style={[styles.dropdownItemText, mode === 'request' && styles.dropdownItemTextActive]}>
                        Request Key
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Bell size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${calculateProgress()}%` }]} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ScrollView
              contentContainerStyle={{ paddingTop: 30, paddingHorizontal: 20, paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brief description (max 30 chars)"
                  placeholderTextColor="#9ca3af"
                  value={label}
                  onChangeText={setLabel}
                  maxLength={30}
                />
              </View>

              {/* Recipient */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{mode === 'send' ? 'Send To' : 'Request From'}</Text>

                {recipientChip && !isShareableLink ? (
                  <View style={styles.recipientChipWide}>
                    <Text style={styles.recipientChipText} numberOfLines={1}>{recipientDisplayName}</Text>
                    <TouchableOpacity onPress={removeRecipientChip} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                      <Text style={styles.chipX}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : !isShareableLink ? (
                  <>
                    <TextInput
                      style={[styles.input, { marginBottom: 12 }]}
                      placeholder="Enter a username"
                      placeholderTextColor="#9ca3af"
                      value={targetEmail}
                      onChangeText={setTargetEmail}
                      onSubmitEditing={handleRecipientLookup}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchingUsers && (
                      <View style={styles.inlineInfo}>
                        <Loader2 size={16} color="#6b7280" />
                        <Text style={styles.inlineInfoText}>Looking up user...</Text>
                      </View>
                    )}
                  </>
                ) : null}

                <TouchableOpacity
                  onPress={toggleShareableLink}
                  style={[
                    styles.fullWidthButton,
                    isShareableLink ? styles.fullWidthButtonActive : styles.fullWidthButtonNeutral
                  ]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.fullWidthButtonText, isShareableLink && styles.fullWidthButtonTextActive]}>
                    {isShareableLink ? 'Shareable Link Mode' : 'Or Generate Shareable Link'}
                  </Text>
                </TouchableOpacity>
                
                {isShareableLink && (
                  <Text style={styles.shareableLinkDescription}>
                    {mode === 'send' 
                      ? 'Generate a link that you can send to anyone to share your information.'
                      : 'Generate a link that you can send to anyone to request their information.'}
                  </Text>
                )}
              </View>

              {/* Information */}
              <View style={styles.card}>
                <View style={{ gap: 12 }}>
                  {informationOptions.map(opt => {
                    const selected = informationTypes.includes(opt.key);
                    return (
                      <View key={opt.key}>
                        <View style={styles.infoRow}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={styles.infoRowText}>{opt.label}</Text>
                            {opt.key === 'location' && mode === 'send' && (
                              <Text style={styles.privacyNote}>Exact coordinates not shared for privacy</Text>
                            )}
                          </View>
                          <Toggle
                            isOn={selected}
                            onToggle={() => toggleInformationType(opt.key)}
                          />
                        </View>

                        {selected && mode === 'send' && (opt.key === 'location' || opt.key === 'selfie' || opt.key === 'photo') && (
                          <View style={{ marginTop: 10 }}>
                            {opt.key === 'location' && (
                              capturedLocation ? (
                                <View style={styles.locationCaptured}>
                                  <View style={styles.locationHeader}>
                                    <MapPin size={22} color="#111827" />
                                    <Text style={styles.locationCapturedText} numberOfLines={2}>
                                      {capturedLocation.cityDisplay}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={captureCurrentLocation}
                                    disabled={isCapturingLocation}
                                    style={styles.locationUpdateBtn}
                                    activeOpacity={0.9}
                                  >
                                    <Text style={styles.locationUpdateBtnText}>
                                      {isCapturingLocation ? 'Updating...' : 'Update'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ) : (
                                <Text style={styles.locationGeneratingText}>
                                  {isCapturingLocation ? 'Generating current location...' : 'Generating current location...'}
                                </Text>
                              )
                            )}

                            {(opt.key === 'selfie' || opt.key === 'photo') && (
                              capturedPhotos[opt.key] ? (
                                <View style={styles.photoCaptured}>
                                  <View style={styles.photoCapturedHeader}>
                                    <Camera size={22} color="#111827" />
                                    <Text style={styles.photoCapturedHeaderText}>
                                      {opt.key === 'selfie' ? 'Selfie captured' : 'Photo captured'}
                                    </Text>
                                  </View>

                                  <View style={styles.photoCapturedActions}>
                                    <TouchableOpacity
                                      style={styles.whitePillBtn}
                                      onPress={() => {
                                        setPreviewUri(capturedPhotos[opt.key]);
                                        setShowPhotoPreview(true);
                                      }}
                                    >
                                      <Text style={styles.whitePillBtnText}>Preview</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.whitePillBtn}
                                      onPress={() => {
                                        setCameraType(opt.key);
                                        setCameraFacing(opt.key === 'selfie' ? 'front' : 'back');
                                        setShowCamera(true);
                                      }}
                                    >
                                      <Text style={styles.whitePillBtnText}>Retake</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.takePhotoBtn}
                                  onPress={() => {
                                    setCameraType(opt.key);
                                    setCameraFacing(opt.key === 'selfie' ? 'front' : 'back');
                                    setShowCamera(true);
                                  }}
                                  activeOpacity={0.9}
                                >
                                  <Camera size={18} color="#111827" />
                                  <Text style={styles.takePhotoBtnText}>
                                    {opt.key === 'selfie' ? 'Take Selfie' : 'Take Photo'}
                                  </Text>
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Views Allowed */}
              {mode === 'send' && !isShareableLink && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Views Allowed</Text>
                  
                  <TouchableOpacity
                    style={styles.viewsSelector}
                    onPress={() => setShowViewsModal(true)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.viewsSelectorText}>
                      {viewsAllowed === 0 ? 'Select views' : viewsAllowed === 999 ? 'Unlimited views' : `${viewsAllowed} ${viewsAllowed === 1 ? 'view' : 'views'}`}
                    </Text>
                    <ChevronDown size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Notes */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Include Note (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add a message with your key"
                  placeholderTextColor="#9ca3af"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={5}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text style={styles.notesCount}>{notes.length}/200</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={submit}
                disabled={!isFormValid() || isSubmitting}
                style={[
                  styles.submitButton,
                  (!isFormValid() || isSubmitting) && styles.submitButtonDisabled
                ]}
                activeOpacity={0.95}
              >
                <Text style={[
                  styles.submitButtonText,
                  (!isFormValid() || isSubmitting) && styles.submitButtonTextDisabled
                ]}>
                  {mode === 'send' ? 'Create and Send Key' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Views Modal */}
        <Modal visible={showViewsModal} transparent animationType="fade" onRequestClose={() => setShowViewsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.viewsModalCard}>
              <Text style={styles.viewsModalTitle}>Select Views Allowed</Text>
              
              <View style={styles.viewsModalOptions}>
                {[1, 2, 3, 5, 'Unlimited'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.viewsModalOption,
                      (num === 'Unlimited' ? viewsAllowed === 999 : viewsAllowed === num) && styles.viewsModalOptionActive
                    ]}
                    onPress={() => {
                      setViewsAllowed(num === 'Unlimited' ? 999 : num);
                      setShowViewsModal(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[
                      styles.viewsModalOptionText,
                      (num === 'Unlimited' ? viewsAllowed === 999 : viewsAllowed === num) && styles.viewsModalOptionTextActive
                    ]}>
                      {num === 'Unlimited' ? 'Unlimited' : `${num} ${num === 1 ? 'view' : 'views'}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.viewsModalCancel}
                onPress={() => setShowViewsModal(false)}
              >
                <Text style={styles.viewsModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Camera Fullscreen */}
        <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing}>
              <View style={styles.cameraOverlay}>
                <TouchableOpacity style={styles.cameraClose} onPress={() => setShowCamera(false)}>
                  <Text style={{ color: '#fff', fontSize: 22 }}>×</Text>
                </TouchableOpacity>

                <View style={styles.cameraBottomControls}>
                  <TouchableOpacity style={styles.capturePhotoButtonCamera} onPress={takePicture}>
                    <View style={styles.capturePhotoButtonInner} />
                  </TouchableOpacity>
                  
                  {cameraType === 'photo' && (
                    <TouchableOpacity
                      style={styles.cameraFlipButton}
                      onPress={() => setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'))}
                    >
                      <RefreshCw size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </CameraView>
          </View>
        </Modal>

        {/* Preview Modal */}
        <Modal visible={showPhotoPreview} transparent animationType="fade" onRequestClose={() => setShowPhotoPreview(false)}>
          <View style={styles.previewOverlay}>
            <View style={styles.previewCard}>
              <View style={styles.previewMedia}>
                {previewUri ? (
                  <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
                      <Text style={{ display: 'none' }}>{/* keep RN happy */}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.previewEmpty}>
                    <Camera size={40} color="#111827" />
                    <Text style={styles.previewEmptyText}>No photo to preview</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.previewClose} onPress={() => setShowPhotoPreview(false)}>
                <Text style={styles.previewCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  /* header */
  header: { backgroundColor: '#000', paddingTop: 10, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIconButton: { padding: 6 },
  dropdownSection: { flex: 1, marginRight: 16 },
  dropdownOffset: { paddingLeft: 20 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#000',
  },
  dropdownItem: { paddingVertical: 16, paddingHorizontal: 24, backgroundColor: '#e5e7eb' },
  dropdownItemActive: { backgroundColor: ACCENT_GREEN },
  dropdownItemText: { fontSize: 16, color: '#000', fontWeight: '400', fontFamily: 'Inter-Regular' },
  dropdownItemTextActive: { color: '#000' },
  dropdownDivider: { height: 1, backgroundColor: '#000' },

  /* content */
  content: { flex: 1, backgroundColor: '#f3f4f6' },

  /* progress */
  progressBarContainer: {
    backgroundColor: '#000',
  },
  progressBar: { 
    height: 8, 
    backgroundColor: '#d1d5db', 
    overflow: 'hidden' 
  },
  progressFill: { height: '100%', backgroundColor: ACCENT_GREEN },

  /* cards */
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '400', color: '#111827', marginBottom: 12, fontFamily: 'Inter-Regular' },

  /* input */
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },

  /* recipient chip */
  recipientChipWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217,184,243,0.6)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  recipientChipText: { fontSize: 15, color: '#111827', marginRight: 8 },
  chipX: { fontSize: 18, color: '#374151', paddingHorizontal: 6 },

  inlineInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  inlineInfoText: { fontSize: 13, color: '#6b7280' },

  /* shareable link */
  fullWidthButton: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  fullWidthButtonNeutral: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  fullWidthButtonActive: { backgroundColor: ACCENT_GREEN, borderWidth: 1, borderColor: ACCENT_GREEN },
  fullWidthButtonText: { fontSize: 15, color: '#111827' },
  fullWidthButtonTextActive: { color: '#111827' },
  shareableLinkDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 10,
    lineHeight: 18,
  },

  /* templates */
  templatesTitle: { fontSize: 16, color: '#111827', marginBottom: 10, fontFamily: 'Inter-Regular' },
  templatesRow: { flexDirection: 'row', gap: 10 },
  templateBtnWide: { flex: 1, borderRadius: 999, backgroundColor: ACCENT_GREEN, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  templateBtnText: { fontSize: 14, color: '#111827', fontWeight: '400', fontFamily: 'Inter-Regular' },

  /* info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  infoRowText: { fontSize: 15, color: '#111827' },
  privacyNote: { 
    fontSize: 12, 
    color: '#9ca3af', 
    marginTop: 4,
    lineHeight: 16,
  },

  /* toggle */
  toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: '#d1d5db', padding: 3 },
  toggleActive: { backgroundColor: '#000' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobActive: { transform: [{ translateX: 22 }] },

  /* location */
  locationGeneratingText: { fontSize: 14, color: '#111827', textAlign: 'left', paddingHorizontal: 2, paddingVertical: 4 },
  locationCaptured: { backgroundColor: '#f3f4f6', borderRadius: 14, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 20 },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationCapturedText: { color: '#111827', fontSize: 16, fontWeight: '400' },
  locationUpdateBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 999,
    alignItems: 'center',
  },
  locationUpdateBtnText: { color: '#111827', fontSize: 14, fontWeight: '400' },

  /* media capture */
  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: ACCENT_GREEN,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  takePhotoBtnText: { fontSize: 15, color: '#111827', fontWeight: '400' },

  photoCaptured: { backgroundColor: '#f3f4f6', borderRadius: 14, padding: 24, gap: 20 },
  photoCapturedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  photoCapturedHeaderText: { color: '#111827', fontSize: 16, fontWeight: '400' },
  photoCapturedActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  whitePillBtn: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20 },
  whitePillBtnText: { color: '#111827', fontSize: 14, fontWeight: '400' },

  /* views allowed */
  viewsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  viewsSelectorText: { fontSize: 15, color: '#111827' },

  /* views modal */
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  viewsModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  viewsModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  viewsModalOptions: {
    gap: 12,
    marginBottom: 20,
  },
  viewsModalOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  viewsModalOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  viewsModalOptionText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  viewsModalOptionTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  viewsModalCancel: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
  },
  viewsModalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  /* notes */
  notesInput: { minHeight: 110, paddingTop: 12 },
  notesCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 8 },

  /* submit */
  submitButton: {
    backgroundColor: ACCENT_GREEN,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: '#e5e7eb' },
  submitButtonText: { fontSize: 18, color: '#111827', fontWeight: '400' },
  submitButtonTextDisabled: { color: '#6b7280', fontWeight: '400' },

  /* camera */
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1 },
  cameraClose: {
    position: 'absolute', top: 60, left: 30,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturePhotoButtonCamera: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff',
  },
  capturePhotoButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: ACCENT_GREEN },
  cameraFlipButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: 50,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* preview modal */
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  previewCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  previewMedia: { height: 480, borderRadius: 16, backgroundColor: '#f3f4f6', overflow: 'hidden', marginBottom: 14 },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  previewEmptyText: { color: '#111827', fontSize: 15 },
  previewClose: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 22, backgroundColor: '#000', borderRadius: 999 },
  previewCloseText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  /* skeleton */
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonTitle: { height: 16, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 12, width: '30%' },
  skeletonInput: { height: 48, backgroundColor: '#e5e7eb', borderRadius: 12, marginBottom: 12 },
  skeletonRow: { flexDirection: 'row', gap: 8 },
  skeletonBtn: { flex: 1, height: 36, backgroundColor: '#e5e7eb', borderRadius: 999 },
});