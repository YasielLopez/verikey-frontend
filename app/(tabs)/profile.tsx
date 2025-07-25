import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ isOn, onToggle }) => (
  <TouchableOpacity 
    style={[styles.toggle, isOn && styles.toggleActive]} 
    onPress={onToggle}
  >
    <View style={[styles.toggleSlider, isOn && styles.toggleSliderActive]} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [autoDelete, setAutoDelete] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleMenuPress = (option: string) => {
    Alert.alert(option, `Opening ${option} settings...`);
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = () => {
    setShowSignOutModal(false);
    logout();
    router.replace('/(auth)/login');
  };

  const MenuIcon = ({ name }: { name: string }) => (
    <View style={styles.menuIcon}>
      <ThemedText style={styles.menuIconText}>•</ThemedText>
    </View>
  );

  const ArrowIcon = () => (
    <ThemedText style={styles.arrowIcon}>›</ThemedText>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
      </View>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {user?.first_name?.charAt(0).toUpperCase() || 
               user?.email?.charAt(0).toUpperCase() || 'A'}
            </ThemedText>
          </View>
          <ThemedText style={styles.userName}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user?.email || 'Anna Doe'}
          </ThemedText>
          <ThemedText style={styles.userHandle}>
            @{user?.screen_name || 'Annadoe92'}
          </ThemedText>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('Personal Information')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="person" />
              <ThemedText style={styles.menuText}>Personal Information</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('Verification Data')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="verified" />
              <ThemedText style={styles.menuText}>Verification Data</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => handleMenuPress('Privacy & Security')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="lock" />
              <ThemedText style={styles.menuText}>Privacy & Security</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <ThemedText style={styles.settingTitle}>Notifications</ThemedText>
              <ThemedText style={styles.settingDescription}>Get notified about key activity</ThemedText>
            </View>
            <Toggle isOn={notifications} onToggle={() => setNotifications(!notifications)} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <ThemedText style={styles.settingTitle}>Auto-delete expired keys</ThemedText>
              <ThemedText style={styles.settingDescription}>Remove old keys automatically</ThemedText>
            </View>
            <Toggle isOn={autoDelete} onToggle={() => setAutoDelete(!autoDelete)} />
          </View>

          <View style={[styles.settingItem, styles.lastSettingItem]}>
            <View style={styles.settingLeft}>
              <ThemedText style={styles.settingTitle}>Dark mode</ThemedText>
              <ThemedText style={styles.settingDescription}>Use dark theme</ThemedText>
            </View>
            <Toggle isOn={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('Help & FAQ')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="help" />
              <ThemedText style={styles.menuText}>Help & FAQ</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('Contact Support')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="mail" />
              <ThemedText style={styles.menuText}>Contact Support</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => handleMenuPress('About VeriKey')}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="info" />
              <ThemedText style={styles.menuText}>About VeriKey</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>
        </View>

        {/* Sign Out Section */}
        <View style={styles.signOutSection}>
          <TouchableOpacity 
            style={styles.signOutItem}
            onPress={handleSignOut}
          >
            <View style={styles.menuLeft}>
              <MenuIcon name="logout" />
              <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
            </View>
            <ArrowIcon />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>VeriKey v2.1.0</ThemedText>
          <ThemedText style={styles.footerText}>© 2025 VeriKey Inc.</ThemedText>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Sign Out</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to sign out?
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, styles.signOutButton]}
              onPress={confirmSignOut}
            >
              <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSignOutModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#b5ead7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#b5ead7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 16,
    color: '#6b7280',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: '#d1d5db',
    borderRadius: 50,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#b5eac1',
  },
  toggleSlider: {
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
  toggleSliderActive: {
    transform: [{ translateX: 20 }],
  },
  signOutSection: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
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
  signOutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff9aa2',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
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
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginBottom: 8,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#ff9aa2',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
});