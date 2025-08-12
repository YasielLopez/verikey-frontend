import { ThemedView } from '@/components/ThemedView';
import { KeysAPI } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Calendar,
  Camera,
  ChevronLeft,
  Eye,
  Loader2,
  Lock,
  MapPin,
  MoreHorizontal,
  PenLine,
  Trash2,
  User,
  UserCheck,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ViewKeyParams {
  keyId: string;
  title: string;
  from: string;
  views: string;
  receivedOn: string;
  status: string;
  keyType: 'sent' | 'received';
  sharedWith?: string;
  sentOn?: string;
}

export default function ViewKeyScreen() {
  const params = useLocalSearchParams<ViewKeyParams>();
  const [keyDetails, setKeyDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    fetchKeyDetails();
  }, []);

  const fetchKeyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const keyId = parseInt(params.keyId);
      const details = await KeysAPI.getKeyDetails(keyId);
      setKeyDetails(details);
      console.log('✅ Loaded key details:', details);
    } catch (error: any) {
      console.error('Failed to fetch key details:', error);
      setError(error.response?.data?.error || 'Failed to load key details');
      if (error.response?.status === 403 && params.status === 'viewed_out') {
        setError('This key has been viewed the maximum number of times');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  const handleReport = () => {
    setReportText('');
    setShowReportModal(true);
    setShowMoreMenu(false);
  };

  const submitReport = async () => {
    if (!reportText.trim()) {
      Alert.alert('Error', 'Please describe the issue before submitting');
      return;
    }

    try {
      setIsProcessing(true);
      Alert.alert('Success', 'Report submitted successfully. Our team will review it shortly.');
      setShowReportModal(false);
      setReportText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Delete Key',
      `Are you sure you want to delete "${params.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              setShowMoreMenu(false);
              
              await KeysAPI.deleteShareableKey(parseInt(params.keyId));
              
              Alert.alert('Success', 'Key deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]);
              
            } catch (error: any) {
              console.error('Failed to delete key:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete key. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackNavigation}
            >
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Loading Content */}
          <View style={styles.content}>
            <View style={styles.loadingContainer}>
              <Loader2 size={32} color="#D9B8F3" />
              <Text style={styles.loadingText}>Loading key details...</Text>
            </View>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackNavigation}
          >
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Key Details</Text>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MoreHorizontal size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Main Key Card */}
            <View style={styles.mainCard}>
              {/* Floating sender pill */}
              <View style={styles.senderPill}>
                <User size={16} color="#374151" />
                <Text style={styles.senderPillText}>
                  {params.keyType === 'received' 
                    ? `From ${params.from?.replace('@', '')}` 
                    : `To ${(params.sharedWith || params.from)?.replace('@', '')}`}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.keyTitle}>{params.title}</Text>

              {/* Key Info Pills */}
              <View style={styles.infoPillsContainer}>
                <View style={styles.infoPill}>
                  <Eye size={16} color="#6b7280" />
                  <Text style={styles.infoPillText}>{params.views}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.infoPillText}>
                    {formatDate(params.receivedOn || params.sentOn || '')}
                  </Text>
                </View>
              </View>

              {/* Notes Section */}
              <View style={styles.notesSection}>
                <View style={styles.noteHeader}>
                  <PenLine size={20} color="#9b5fd0" />
                  <Text style={styles.noteHeaderTitle}>Note</Text>
                </View>
                {keyDetails?.notes ? (
                  <Text style={styles.notesText}>{keyDetails.notes}</Text>
                ) : (
                  <Text style={styles.notesTextEmpty}>No note included in this key.</Text>
                )}
              </View>
            </View>

            {/* Shared Data Sections */}
            {keyDetails?.user_data && (
              <View style={styles.dataContainer}>
                {/* Personal Information */}
                {(keyDetails.user_data.fullname || keyDetails.user_data.firstname || keyDetails.user_data.age) && (
                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <UserCheck size={20} color="#9b5fd0" />
                      <Text style={styles.dataCardTitle}>Personal Information</Text>
                    </View>
                    <View style={styles.dataCardContent}>
                      {keyDetails.user_data.fullname && keyDetails.user_data.fullname !== 'Name not available' && (
                        <View style={styles.dataRow}>
                          <Text style={styles.dataLabel}>Full Name:</Text>
                          <Text style={styles.dataValue}>{keyDetails.user_data.fullname}</Text>
                        </View>
                      )}
                      {keyDetails.user_data.firstname && keyDetails.user_data.firstname !== 'First name not available' && (
                        <View style={styles.dataRow}>
                          <Text style={styles.dataLabel}>First Name:</Text>
                          <Text style={styles.dataValue}>{keyDetails.user_data.firstname}</Text>
                        </View>
                      )}
                      {keyDetails.user_data.age && keyDetails.user_data.age !== 'Age not provided' && (
                        <View style={styles.dataRow}>
                          <Text style={styles.dataLabel}>Age:</Text>
                          <Text style={styles.dataValue}>
                            {keyDetails.user_data.age.includes('years old') 
                              ? keyDetails.user_data.age 
                              : `${keyDetails.user_data.age} years old`}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.verificationBadge}>
                      <Text style={styles.verificationBadgeText}>
                        This information hasn't been verified yet.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Location Information */}
                {keyDetails.user_data.location && keyDetails.user_data.location.cityDisplay !== 'Location not captured' && (
                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <MapPin size={20} color="#9b5fd0" />
                      <Text style={styles.dataCardTitle}>Location</Text>
                    </View>
                    <View style={styles.locationDisplay}>
                      <Text style={styles.locationText}>
                        {keyDetails.user_data.location.cityDisplay}
                      </Text>
                    </View>
                    <Text style={styles.locationNote}>
                      {params.keyType === 'received'
                        ? "Captured at the time of key's creation"
                        : "General area shared for privacy protection"}
                    </Text>
                  </View>
                )}

                {/* Photos */}
                {keyDetails.user_data.selfie?.image_data && (
                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <Camera size={20} color="#9b5fd0" />
                      <Text style={styles.dataCardTitle}>Selfie Verification</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPhoto(keyDetails.user_data.selfie.image_data);
                        setShowPhotoModal(true);
                      }}
                      style={styles.photoButton}
                    >
                      <Image
                        source={{ uri: keyDetails.user_data.selfie.image_data }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <Text style={styles.photoHintText}>Tap to expand photo</Text>
                  </View>
                )}

                {keyDetails.user_data.photo?.image_data && (
                  <View style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <Camera size={20} color="#9b5fd0" />
                      <Text style={styles.dataCardTitle}>Additional Photo</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPhoto(keyDetails.user_data.photo.image_data);
                        setShowPhotoModal(true);
                      }}
                      style={styles.photoButton}
                    >
                      <Image
                        source={{ uri: keyDetails.user_data.photo.image_data }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <Text style={styles.photoHintText}>Tap to expand photo</Text>
                  </View>
                )}
              </View>
            )}

            {/* No Data Available Message */}
            {!keyDetails?.user_data && !error && (
              <View style={styles.noDataCard}>
                <View style={styles.noDataIcon}>
                  <Lock size={32} color="#9ca3af" />
                </View>
                <Text style={styles.noDataTitle}>No Shared Data</Text>
                <Text style={styles.noDataText}>
                  This key doesn't contain any additional shared information.
                </Text>
              </View>
            )}

            {/* Error Messages */}
            {params.status === 'viewed_out' && params.keyType === 'received' && (
              <View style={styles.warningCard}>
                <AlertTriangle size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                  This key has reached its view limit and cannot be viewed again.
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorCard}>
                <AlertTriangle size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* More Menu Dropdown */}
        {showMoreMenu && (
          <>
            {/* Backdrop, using full screen invisible overlay like keys page */}
            <TouchableOpacity 
              style={styles.menuBackdrop}
              onPress={() => setShowMoreMenu(false)}
              activeOpacity={1}
            />
            
            {/* Menu, matching keys page style */}
            <View style={styles.moreMenuDropdown}>
              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={handleRemove}
              >
                <Trash2 size={20} color="#6b7280" />
                <Text style={styles.moreMenuText}>Delete</Text>
              </TouchableOpacity>
              {params.keyType === 'received' && (
                <TouchableOpacity
                  style={[styles.moreMenuItem, styles.moreMenuItemBorder]}
                  onPress={handleReport}
                >
                  <AlertTriangle size={20} color="#6b7280" />
                  <Text style={styles.moreMenuText}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Report Modal */}
        <Modal visible={showReportModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIcon}>
                  <AlertTriangle size={20} color="#ef4444" />
                </View>
                <Text style={styles.modalTitle}>Report Issue</Text>
              </View>

              <Text style={styles.modalSubtitle}>
                Report key: "{params.title}"
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Please describe the issue or incident..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={reportText}
                onChangeText={setReportText}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSubmitButton]}
                  onPress={submitReport}
                  disabled={isProcessing || !reportText.trim()}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <AlertTriangle size={16} color="#ffffff" />
                      <Text style={styles.modalSubmitText}>Submit Report</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowReportModal(false)}
                  disabled={isProcessing}
                >
                  <X size={16} color="#111827" />
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Photo Preview Modal */}
        <Modal visible={showPhotoModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.photoModalOverlay}
            onPress={() => setShowPhotoModal(false)}
            activeOpacity={1}
          >
            <View style={styles.photoModalContainer}>
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.photoModalImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    backgroundColor: '#000000',
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: 16,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  headerSpacer: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  // Main Card
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  senderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D9B8F3',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#111827',
  },
  senderPillText: {
    fontSize: 16,
    color: '#374151',
  },
  keyTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 32,
  },
  infoPillsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  infoPillText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Notes Section
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noteHeaderTitle: {
    fontSize: 17,
    color: '#111827',
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  notesTextEmpty: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  
  // Data Container
  dataContainer: {
    gap: 16,
    marginBottom: 24,
  },
  
  // Data Cards
  dataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 17,
    color: '#111827',
  },
  dataCardContent: {
    gap: 12,
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  dataValue: {
    fontSize: 16,
    color: '#111827',
  },
  
  // Verification Badge
  verificationBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  verificationBadgeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Location
  locationDisplay: {
    backgroundColor: 'rgba(194, 255, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(194, 255, 107, 0.3)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
  },
  locationNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Photos
  photoButton: {
    width: '100%',
  },
  photoImage: {
    width: '100%',
    height: 192,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  photoHintText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // No Data Card
  noDataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  noDataIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 17,
    color: '#111827',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Warning/Error Cards
  warningCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    flex: 1,
  },
  
  // More Menu
  menuBackdrop: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    right: -9999,
    bottom: -9999,
    zIndex: 40,
  },
  moreMenuDropdown: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 50,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  moreMenuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  moreMenuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.5)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSubmitButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#ffffff',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    borderColor: 'rgba(156, 163, 175, 0.5)',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  
  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContainer: {
    width: '90%',
    height: '70%',
  },
  photoModalImage: {
    width: '100%',
    height: '100%',
  },
});