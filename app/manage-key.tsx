import { ThemedView } from '@/components/ThemedView';
import { KeysAPI } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Ban,
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
  UserCheck
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
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ManageKeyParams {
  keyId: string;
  title: string;
  sharedWith: string;
  lastViewed: string;
  sentOn: string;
  status: string;
  returnTab?: string;
}

interface KeyDetails {
  id: number;
  label: string;
  information_types: string[];
  user_data: any;
  views_allowed: number;
  views_used: number;
  recipient_email?: string;
  status: string;
  created_at: string;
  last_viewed_at?: string;
  notes?: string;
}

export default function ManageKeyScreen() {
  const params = useLocalSearchParams<ManageKeyParams>();
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyDetails, setKeyDetails] = useState<KeyDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    fetchKeyDetails();
  }, []);

  const fetchKeyDetails = async () => {
    try {
      setLoadingDetails(true);
      const keyId = parseInt(params.keyId);
      const details = await KeysAPI.getKeyDetails(keyId);
      setKeyDetails(details);
      console.log('✅ Loaded real key details:', details);
    } catch (error) {
      console.error('Failed to fetch key details:', error);
      Alert.alert('Error', 'Failed to load key details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRevokeKey = () => {
    setShowMoreMenu(false);
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!params.keyId) {
      Alert.alert('Error', 'Invalid key ID');
      return;
    }

    setIsLoading(true);
    try {
      await KeysAPI.revokeShareableKey(parseInt(params.keyId));
      Alert.alert('Success', 'Key revoked successfully', [
        {
          text: 'OK',
          onPress: () => {
            setShowRevokeModal(false);
            router.back();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Revoke key failed:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to revoke key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
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
              setIsLoading(true);
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
              setIsLoading(false);
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

  const formatFullDate = (dateString: string): string => {
    if (!dateString) return 'Not viewed yet';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;

      return `${month} ${day}, ${year} at ${displayHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  if (loadingDetails) {
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
          <Text style={styles.headerTitle} numberOfLines={1}>Manage Key</Text>
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
              {/* Floating recipient pill */}
              <View style={styles.recipientPill}>
                <User size={16} color="#374151" />
                <Text style={styles.recipientPillText}>
                  To {params.sharedWith?.replace('@', '')}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.keyTitle}>{params.title || 'Untitled Key'}</Text>

              {/* Key Info Pills */}
              <View style={styles.infoPillsContainer}>
                <View style={styles.infoPill}>
                  <Eye size={16} color="#6b7280" />
                  <Text style={styles.infoPillText}>
                    {keyDetails ? `${Math.max(0, keyDetails.views_allowed - keyDetails.views_used)} views left` : 'Loading...'}
                  </Text>
                </View>
                <View style={styles.infoPill}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.infoPillText}>
                    {formatDate(params.sentOn?.replace(/^sent\s+/i, ''))}
                  </Text>
                </View>
              </View>

              {/* Last Viewed Section */}
              <View style={styles.lastViewedSection}>
                <View style={styles.sectionHeader}>
                  <Eye size={20} color="#9b5fd0" />
                  <Text style={styles.sectionHeaderTitle}>Last Viewed</Text>
                </View>
                <Text style={styles.lastViewedText}>
                  {keyDetails?.last_viewed_at
                    ? formatFullDate(keyDetails.last_viewed_at)
                    : 'Not viewed yet'}
                </Text>
              </View>

              {/* Notes Section */}
              <View style={styles.notesSection}>
                <View style={styles.sectionHeader}>
                  <PenLine size={20} color="#9b5fd0" />
                  <Text style={styles.sectionHeaderTitle}>Note</Text>
                </View>
                {keyDetails?.notes ? (
                  <Text style={styles.notesText}>{keyDetails.notes}</Text>
                ) : (
                  <Text style={styles.notesTextEmpty}>No note included with this key.</Text>
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
                      <Text style={styles.dataCardTitle}>Shared Information</Text>
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
                      General area shared for privacy protection
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

            {/* Status Messages */}
            {params.status === 'viewed_out' && (
              <View style={styles.warningCard}>
                <AlertTriangle size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                  This key has reached its view limit and cannot be viewed anymore.
                </Text>
              </View>
            )}

            {params.status === 'revoked' && (
              <View style={styles.errorCard}>
                <Lock size={20} color="#ef4444" />
                <Text style={styles.errorText}>
                  This key has been revoked and can no longer be accessed.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* More Menu Dropdown */}
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <TouchableOpacity 
              style={styles.menuBackdrop}
              onPress={() => setShowMoreMenu(false)}
              activeOpacity={1}
            />
            
            {/* Menu */}
            <View style={styles.moreMenuDropdown}>
              {params.status === 'active' && (
                <TouchableOpacity
                  style={styles.moreMenuItem}
                  onPress={handleRevokeKey}
                >
                  <Ban size={20} color="#6b7280" />
                  <Text style={styles.moreMenuText}>Revoke</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.moreMenuItem, params.status === 'active' && styles.moreMenuItemBorder]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#6b7280" />
                <Text style={styles.moreMenuText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Revoke Confirmation Modal */}
        <Modal visible={showRevokeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIcon}>
                  <Ban size={20} color="#111827" />
                </View>
                <Text style={styles.modalTitle}>Revoke Key?</Text>
              </View>

              <Text style={styles.modalMessage}>
                Are you sure you want to revoke this key? The recipient will no longer be able to view your information, and this action cannot be undone.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={confirmRevoke}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Revoke Key</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowRevokeModal(false)}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
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
  recipientPill: {
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
  recipientPillText: {
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
  
  // Section Headers (for Last Viewed and Notes)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    color: '#111827',
  },
  
  // Last Viewed Section
  lastViewedSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    marginBottom: 16,
  },
  lastViewedText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  
  // Notes Section
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalConfirmButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
  },
  modalCancelButton: {
    backgroundColor: '#e5e7eb',
    borderColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#111827',
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