import { LockFilledIcon } from '@/components/icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileAPI } from '@/services/api';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [email, setEmail] = useState(user?.email || '');
  const [screenName, setScreenName] = useState(user?.screen_name ? `@${user.screen_name}` : '@');
  const [originalScreenName, setOriginalScreenName] = useState(user?.screen_name ? `@${user.screen_name}` : '@');
  
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const age = user?.age || 0;
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setScreenName(user.screen_name ? `@${user.screen_name}` : '@');
      setOriginalScreenName(user.screen_name ? `@${user.screen_name}` : '@');
    }
  }, [user]);

  const canChangeScreenName = () => {
    return user?.can_change_screen_name !== false;
  };

  const calculateNextScreenNameChange = () => {
    if (!user?.last_screen_name_change) return null;
    
    const lastChange = new Date(user.last_screen_name_change);
    const nextChange = new Date(lastChange);
    nextChange.setMonth(nextChange.getMonth() + 6);
    
    return nextChange;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (screenName) {
      const cleanScreenName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
      if (cleanScreenName.length < 3 || cleanScreenName.length > 30) {
        Alert.alert('Error', 'Username must be between 3 and 30 characters');
        return false;
      }

      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(cleanScreenName)) {
        Alert.alert('Error', 'Username can only contain letters, numbers, underscores, and dots');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check if username is being changed
    const cleanScreenName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
    const cleanOriginalScreenName = originalScreenName.startsWith('@') ? originalScreenName.slice(1) : originalScreenName;
    
    if (cleanScreenName !== cleanOriginalScreenName && screenName !== '') {
      if (!canChangeScreenName()) {
        const nextDate = calculateNextScreenNameChange();
        Alert.alert(
          'Username Change Restricted',
          `You can only change your username once every 6 months. You can change it again on ${nextDate ? formatDate(nextDate) : 'later'}.`
        );
        return;
      }

      // Show confirmation for username change
      Alert.alert(
        'Change Username?',
        'Are you sure you want to change your username? You can only do this once every 6 months.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScreenName(originalScreenName)
          },
          {
            text: 'Yes, Change It',
            style: 'destructive',
            onPress: () => performSave()
          }
        ]
      );
      return;
    }

    performSave();
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        email: email.trim(),
      };

      // Only include screen_name if it has changed
      const cleanScreenName = screenName.startsWith('@') ? screenName.slice(1) : screenName;
      const cleanOriginalScreenName = originalScreenName.startsWith('@') ? originalScreenName.slice(1) : originalScreenName;
      
      if (cleanScreenName !== cleanOriginalScreenName && screenName !== '') {
        updateData.screen_name = cleanScreenName;
      }

      await ProfileAPI.updateProfile(updateData);
      await refreshUser();
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle specific error for screen name change restriction
      if (error.response?.status === 403 && error.response?.data?.last_change) {
        const nextDate = new Date(error.response.data.next_available);
        Alert.alert(
          'Username Change Restricted',
          `You can only change your username once every 6 months. You can change it again on ${formatDate(nextDate)}.`
        );
      } else {
        Alert.alert(
          'Update Failed',
          error.response?.data?.error || 'Failed to update profile. Please try again.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion');
      return;
    }

    setDeleting(true);
    try {
      await ProfileAPI.deleteAccount(deletePassword);
      // Account deleted, logout will happen automatically
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      } else {
        Alert.alert(
          'Deletion Failed',
          error.response?.data?.error || 'Failed to delete account. Please try again.'
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will erase all your data and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7bc49a" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backArrow}>‹</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        
        <TouchableOpacity
          style={styles.headerRight}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#7bc49a" />
          ) : (
            <ThemedText style={styles.saveText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Information Card */}
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Username</ThemedText>
              <View style={styles.usernameWrapper}>
                <TextInput
                  style={[
                    styles.textInput,
                    !canChangeScreenName() && styles.disabledInput
                  ]}
                  value={screenName}
                  onChangeText={(text) => {
                    if (!text || text === '') {
                      setScreenName('@');
                    } else if (!text.startsWith('@')) {
                      setScreenName('@' + text);
                    } else {
                      setScreenName(text);
                    }
                  }}
                  placeholder="@username"
                  placeholderTextColor="#9ca3af"
                  editable={canChangeScreenName()}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!canChangeScreenName() && (
                  <View style={styles.lockedTextContainer}>
                    <LockFilledIcon size={14} color="#6b7280" />
                    <ThemedText style={styles.lockedText}>
                      Can be changed on {calculateNextScreenNameChange() ? formatDate(calculateNextScreenNameChange()!) : 'later'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.sectionTitleContainer}>
              <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
              <LockFilledIcon size={20} color="#1f2937" />
            </View>
            
            {!user?.is_verified && (
              <View style={styles.infoNotice}>
                <ThemedText style={styles.infoNoticeText}>
                  Name and age are locked after signup for security. Contact support to make changes.
                </ThemedText>
              </View>
            )}

            {user?.is_verified && (
              <View style={styles.verifiedNotice}>
                <ThemedText style={styles.verifiedNoticeIcon}>✓</ThemedText>
                <ThemedText style={styles.verifiedNoticeText}>
                  Your identity is verified. Name and age cannot be changed.
                </ThemedText>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>First Name</ThemedText>
              <View style={styles.lockedField}>
                <ThemedText style={styles.lockedFieldText}>{firstName || 'Not set'}</ThemedText>
                {user?.is_verified && (
                  <ThemedText style={styles.verifiedBadge}>✓ Verified</ThemedText>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
              <View style={styles.lockedField}>
                <ThemedText style={styles.lockedFieldText}>{lastName || 'Not set'}</ThemedText>
                {user?.is_verified && (
                  <ThemedText style={styles.verifiedBadge}>✓ Verified</ThemedText>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Age</ThemedText>
              <View style={styles.lockedField}>
                <View>
                  <ThemedText style={styles.lockedFieldText}>{age} years old</ThemedText>
                  <ThemedText style={styles.ageNote}>Auto-updates on your birthday</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Danger Zone Card */}
          <View style={styles.card}>
            <ThemedText style={styles.dangerZoneTitle}>Danger Zone</ThemedText>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={openDeleteModal}
            >
              <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
            </TouchableOpacity>
            
            <ThemedText style={styles.deleteWarning}>
              This action cannot be undone. All your data will be permanently deleted.
            </ThemedText>
          </View>
        </ScrollView>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Delete Account?</ThemedText>
              <ThemedText style={styles.modalMessage}>
                This will permanently delete all your verikeys, requests, and personal data.
              </ThemedText>

              <TextInput
                style={styles.modalInput}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Enter password to confirm"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoCapitalize="none"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.deleteConfirmButton]}
                  onPress={handleDeleteAccount}
                  disabled={deleting || !deletePassword.trim()}
                >
                  {deleting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText style={styles.deleteConfirmButtonText}>Delete Account</ThemedText>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                >
                  <ThemedText style={styles.cancelModalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    padding: 8,
    marginLeft: -8,
    minWidth: 40,
  },
  backArrow: {
    fontSize: 36,
    fontWeight: '300',
    color: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#7bc49a',
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  infoNotice: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoNoticeText: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  verifiedNoticeIcon: {
    fontSize: 16,
    color: '#059669',
    marginRight: 8,
  },
  verifiedNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#1f2937',
  },
  usernameWrapper: {
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    borderColor: '#d1d5db',
  },
  lockedField: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedFieldText: {
    fontSize: 15,
    color: '#6b7280',
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  ageNote: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  lockedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  lockedText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#ff9aa2',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1f2937',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#1f2937',
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelModalButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});