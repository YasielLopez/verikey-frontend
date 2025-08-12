import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { KYCAPI, ProfileAPI } from '@/services/api';
import { processProfilePhotoForUpload } from '@/services/imageUtils';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  HelpCircle,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  Trash2,
  UserCheck,
  X
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ isOn, onToggle }) => (
  <TouchableOpacity
    style={[styles.toggle, isOn && styles.toggleActive]}
    onPress={onToggle}
    activeOpacity={0.9}
  >
    <View style={[styles.toggleKnob, isOn && styles.toggleKnobActive]} />
  </TouchableOpacity>
);

interface MenuOptionProps {
  icon: React.ReactNode;
  title: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  onPress: () => void;
  description?: string;
  textColor?: string;
  isLast?: boolean;
}

const MenuOption: React.FC<MenuOptionProps> = ({
  icon,
  title,
  showToggle = false,
  toggleValue = false,
  onPress,
  description,
  textColor,
  isLast = false
}) => {
  return (
    <View>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuLeft}>
          <View style={styles.menuIconContainer}>
            {icon}
          </View>
          <Text style={[styles.menuText, textColor && { color: textColor }]}>
            {title}
          </Text>
        </View>
        {showToggle ? (
          <Toggle isOn={toggleValue} onToggle={onPress} />
        ) : (
          <ChevronRight size={20} color="#9ca3af" />
        )}
      </TouchableOpacity>
      {description && toggleValue && (
        <Text style={styles.menuDescription}>{description}</Text>
      )}
      {!isLast && <View style={styles.menuItemSeparator} />}
    </View>
  );
};

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [autoDelete, setAutoDelete] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Modal states
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      checkVerificationStatus();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const status = await KYCAPI.getVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  const handlePhotoAction = async (action: string) => {
    setShowPhotoModal(false);

    switch (action) {
      case 'camera':
        await takeProfilePhoto();
        break;
      case 'gallery':
        await pickProfilePhoto();
        break;
      case 'remove':
        await removeProfilePhoto();
        break;
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setProfilePhotoUri(null);
      await ProfileAPI.updateProfilePhoto(null);
      await refreshUser();
      Alert.alert('Success', 'Profile photo removed!');
    } catch (error) {
      console.error('Failed to remove photo:', error);
      Alert.alert('Error', 'Failed to remove photo. Please try again.');
    }
  };

  const takeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const processedPhoto = await processProfilePhotoForUpload(result.assets[0].uri);
        setProfilePhotoUri(processedPhoto);
        await ProfileAPI.updateProfilePhoto(processedPhoto);
        await refreshUser();
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        console.error('Failed to process photo:', error);
        Alert.alert('Error', 'Failed to update photo. Please try again.');
      }
    }
  };

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const processedPhoto = await processProfilePhotoForUpload(result.assets[0].uri);
        setProfilePhotoUri(processedPhoto);
        await ProfileAPI.updateProfilePhoto(processedPhoto);
        await refreshUser();
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        console.error('Failed to process photo:', error);
        Alert.alert('Error', 'Failed to update photo. Please try again.');
      }
    }
  };

  const handleGetVerified = async () => {
    if (!verificationStatus) {
      Alert.alert('Please wait', 'Checking verification status...');
      return;
    }

    if (verificationStatus.verified) {
      Alert.alert(
        'Already Verified ✅',
        'Your account is already verified! Your name and age are locked to your account.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push('/kyc-verification');
  };

  const handleMenuPress = (option: string) => {
    switch (option) {
      case 'Account Information':
        router.push('/edit-profile');
        break;
      case 'Privacy & Security':
        Alert.alert('Privacy & Security', 'Privacy settings will be available in the next update');
        break;
      case 'Notifications':
        setNotifications(!notifications);
        break;
      case 'Auto-Delete Keys':
        setAutoDelete(!autoDelete);
        break;
      case 'Dark Mode':
        setDarkMode(!darkMode);
        break;
      case 'Help & FAQ':
        Alert.alert('Help & FAQ', 'Help documentation will be available in the next update.');
        break;
      case 'Contact Support':
        Alert.alert('Contact Support', 'You can reach our support team at support@verikey.com');
        break;
      case 'Sign Out':
        setShowSignOutModal(true);
        break;
    }
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.first_name) {
      return user.first_name;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getDisplayHandle = () => {
    if (user?.screen_name) {
      return user.screen_name;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'user';
  };

  const getAvatarInitial = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.dropdownSection}>
                <View style={styles.dropdownButton}>
                  <Text style={styles.headerTitle}>Profile</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.headerIconButton} disabled>
                <Bell size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#c2ff6b" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const hasProfileImage = profilePhotoUri || (user?.profile_image_url && user.profile_image_url.trim() !== '');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.dropdownSection}>
              <View style={styles.dropdownButton}>
                <Text style={styles.headerTitle}>Profile</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.headerIconButton} onPress={() => {}}>
              <Bell size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Header */}
            <View style={styles.profileCard}>
              <View style={styles.profileContent}>
                {/* Avatar */}
                <TouchableOpacity onPress={() => setShowPhotoModal(true)} style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {hasProfileImage ? (
                      <Image
                        source={{ uri: profilePhotoUri || user?.profile_image_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
                    )}
                  </View>
                  <View style={styles.cameraOverlay}>
                    <Camera size={16} color="#fff" />
                  </View>
                </TouchableOpacity>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{getDisplayName()}</Text>
                  <Text style={styles.userHandle}>{getDisplayHandle()}</Text>

                  {/* Get Verified Button */}
                  <TouchableOpacity
                    style={styles.getVerifiedButton}
                    onPress={handleGetVerified}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.getVerifiedText}>Get Verified</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <MenuOption
                icon={<UserCheck size={16} color="#6b7280" />}
                title="Account Information"
                onPress={() => handleMenuPress('Account Information')}
              />
              <MenuOption
                icon={<Shield size={16} color="#6b7280" />}
                title="Privacy & Security"
                onPress={() => handleMenuPress('Privacy & Security')}
                isLast={true}
              />
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <MenuOption
                icon={<Bell size={16} color="#6b7280" />}
                title="Notifications"
                showToggle={true}
                toggleValue={notifications}
                onPress={() => handleMenuPress('Notifications')}
              />
              <MenuOption
                icon={<Trash2 size={16} color="#6b7280" />}
                title="Auto-Delete Keys"
                showToggle={true}
                toggleValue={autoDelete}
                onPress={() => handleMenuPress('Auto-Delete Keys')}
                description="Old keys will be deleted after 7 days"
              />
              <MenuOption
                icon={<Moon size={16} color="#6b7280" />}
                title="Dark Mode"
                showToggle={true}
                toggleValue={darkMode}
                onPress={() => handleMenuPress('Dark Mode')}
                isLast={true}
              />
            </View>

            {/* Support Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support</Text>
              <MenuOption
                icon={<HelpCircle size={16} color="#6b7280" />}
                title="Help & FAQ"
                onPress={() => handleMenuPress('Help & FAQ')}
              />
              <MenuOption
                icon={<MessageCircle size={16} color="#6b7280" />}
                title="Contact Support"
                onPress={() => handleMenuPress('Contact Support')}
                isLast={true}
              />
            </View>

            {/* Sign Out Section */}
            <View style={styles.section}>
              <MenuOption
                icon={<LogOut size={16} color="#000" />}
                title="Sign Out"
                onPress={() => handleMenuPress('Sign Out')}
                textColor="#000"
                isLast={true}
              />
            </View>
          </ScrollView>
        </View>

        <Modal visible={showPhotoModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.photoModalContent}>
              <View style={styles.photoModalButtons}>
                <TouchableOpacity
                  style={[styles.photoModalButton, styles.photoModalButtonBlack]}
                  onPress={() => handlePhotoAction('camera')}
                  activeOpacity={0.9}
                >
                  <Camera size={16} color="#ffffff" />
                  <Text style={styles.photoModalButtonTextWhite}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoModalButton, styles.photoModalButtonBlack]}
                  onPress={() => handlePhotoAction('gallery')}
                  activeOpacity={0.9}
                >
                  <Text style={styles.photoModalButtonTextWhite}>Choose from Gallery</Text>
                </TouchableOpacity>

                {hasProfileImage && (
                  <TouchableOpacity
                    style={[styles.photoModalButton, styles.photoModalButtonBlack]}
                    onPress={() => handlePhotoAction('remove')}
                    activeOpacity={0.9}
                  >
                    <Trash2 size={16} color="#ffffff" />
                    <Text style={styles.photoModalButtonTextWhite}>Remove Photo</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.photoModalButton, styles.photoModalButtonCancel]}
                  onPress={() => setShowPhotoModal(false)}
                  activeOpacity={0.9}
                >
                  <X size={16} color="#111827" />
                  <Text style={styles.photoModalButtonTextBlack}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sign Out Modal */}
        <Modal visible={showSignOutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.signOutModalContent}>
              <View style={styles.signOutModalHeader}>
                <View style={styles.signOutModalIcon}>
                  <LogOut size={20} color="#111827" />
                </View>
                <Text style={styles.signOutModalTitle}>Sign Out?</Text>
              </View>

              <Text style={styles.signOutModalDescription}>
                Are you sure you want to sign out of your Verikey account?
              </Text>

              <View style={styles.signOutModalButtons}>
                <TouchableOpacity
                  style={[styles.signOutModalButton, styles.signOutModalButtonBlack]}
                  onPress={confirmSignOut}
                  disabled={isSigningOut}
                  activeOpacity={0.9}
                >
                  {isSigningOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <LogOut size={16} color="#ffffff" />
                      <Text style={styles.signOutModalButtonTextWhite}>Sign Out</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.signOutModalButton, styles.signOutModalButtonCancel]}
                  onPress={() => setShowSignOutModal(false)}
                  disabled={isSigningOut}
                  activeOpacity={0.9}
                >
                  <X size={16} color="#111827" />
                  <Text style={styles.signOutModalButtonTextBlack}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // App shells
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSection: {
    flex: 1,
    marginRight: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Poppins-Regular',
  },
  headerIconButton: {
    padding: 6,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },

  // Profile Header Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  avatarText: {
    fontSize: 28,
    color: '#6b7280',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  getVerifiedButton: {
    backgroundColor: '#c2ff6b',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  getVerifiedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },

  // Sections
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    paddingLeft: 60,
    paddingRight: 16,
    paddingBottom: 12,
    marginTop: -8,
  },

  // Toggle
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d1d5db',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: '#000000',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  photoModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoModalButtons: {
    gap: 12,
  },
  photoModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoModalButtonBlack: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  photoModalButtonTextWhite: {
    fontSize: 16,
    color: '#ffffff',
  },
  photoModalButtonCancel: {
    backgroundColor: '#e5e7eb',
    borderColor: '#e5e7eb',
  },
  photoModalButtonTextBlack: {
    fontSize: 16,
    color: '#111827',
  },

  signOutModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff', 
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  signOutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  signOutModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutModalTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  signOutModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  signOutModalButtons: {
    gap: 12,
  },
  signOutModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutModalButtonBlack: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  signOutModalButtonCancel: {
    backgroundColor: '#e5e7eb',
    borderColor: '#e5e7eb',
  },
  signOutModalButtonTextWhite: {
    fontSize: 16,
    color: '#ffffff',
  },
  signOutModalButtonTextBlack: {
    fontSize: 16,
    color: '#111827',
  },
});