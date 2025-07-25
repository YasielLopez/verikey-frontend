import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface KeyData {
  id: number;
  title: string;
  from?: string;
  sharedWith?: string;
  views: string;
  expires: string;
  status: 'new' | 'viewed' | 'seen' | 'not-seen';
  type: 'received' | 'sent';
  isExpired?: boolean;
  lastViewed?: string;
  sentOn?: string;
  receivedOn?: string;
}

export default function KeysScreen() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentKey, setCurrentKey] = useState<KeyData | null>(null);
  const { user } = useAuth();

  // Mock data that matches your mockup exactly
  const mockKeys: KeyData[] = [
    // Received Keys
    {
      id: 1,
      title: 'Proof of Age',
      from: 'emily_rose@pm.me',
      views: '2',
      expires: '1 hour',
      status: 'new',
      type: 'received',
      receivedOn: 'June 2, 2025 at 10:30 AM',
    },
    {
      id: 2,
      title: 'ID Verification',
      from: 'andrewh91@tuta.io',
      views: 'unlimited',
      expires: '6 hours',
      status: 'viewed',
      type: 'received',
      receivedOn: 'June 2, 2025 at 8:15 AM',
    },
    {
      id: 3,
      title: 'Location Check',
      from: '@brookeeve',
      views: '2/2',
      expires: 'Expired June 2025',
      status: 'viewed',
      type: 'received',
      isExpired: true,
      receivedOn: 'May 25, 2025 at 3:20 PM',
    },
    // Sent Keys
    {
      id: 4,
      title: 'Pre-Date Verification',
      sharedWith: 'Julesfox92@gmail.com',
      views: '2',
      expires: '5 hours',
      status: 'seen',
      type: 'sent',
      lastViewed: 'Viewed 2 hours ago',
      sentOn: 'June 2, 2025 at 7:30 AM',
    },
    {
      id: 5,
      title: 'iPhone 14 Sale',
      sharedWith: '(415) 882-4412',
      views: 'unlimited',
      expires: '30 minutes',
      status: 'not-seen',
      type: 'sent',
      lastViewed: 'Not Seen Yet',
      sentOn: 'June 2, 2025 at 9:19 AM',
    },
    {
      id: 6,
      title: 'Location Verification',
      sharedWith: '@AnnaDoe',
      views: '1/3',
      expires: 'Expired April 2025',
      status: 'seen',
      type: 'sent',
      isExpired: true,
      lastViewed: 'Viewed 3 weeks ago',
      sentOn: 'April 15, 2025 at 2:45 PM',
    },
  ];

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setKeys(mockKeys);
    } catch (error) {
      console.error('Failed to load keys:', error);
      Alert.alert('Error', 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBubbleStyle = (status: string, isExpired?: boolean) => {
    const baseStyle = [styles.statusBubble];
    
    if (isExpired) {
      baseStyle.push(styles.expiredBubble);
    }
    
    switch (status) {
      case 'new':
        return [...baseStyle, styles.statusNew];
      case 'viewed':
      case 'seen':
        return [...baseStyle, styles.statusSeen];
      case 'not-seen':
        return [...baseStyle, styles.statusNotSeen];
      default:
        return baseStyle;
    }
  };

  const filteredKeys = keys.filter(key => key.type === activeTab);
  const activeKeys = filteredKeys.filter(key => !key.isExpired);
  const expiredKeys = filteredKeys.filter(key => key.isExpired);

  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <View style={[styles.modeSlider, activeTab === 'sent' && styles.modeSliderRight]} />
      <TouchableOpacity
        style={styles.modeOption}
        onPress={() => setActiveTab('received')}
      >
        <ThemedText style={[styles.modeOptionText, activeTab === 'received' && styles.modeOptionActive]}>
          Received
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.modeOption}
        onPress={() => setActiveTab('sent')}
      >
        <ThemedText style={[styles.modeOptionText, activeTab === 'sent' && styles.modeOptionActive]}>
          Sent
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const handleKeyAction = (key: KeyData) => {
    if (activeTab === 'received') {
      Alert.alert('View Key', `Would open ${key.title} details`);
    } else {
      if (key.isExpired) {
        Alert.alert('View Key', `Would view expired key: ${key.title}`);
      } else {
        Alert.alert('Manage Key', `Would manage ${key.title}`);
      }
    }
  };

  const handleReport = (key: KeyData) => {
    setCurrentKey(key);
    setShowReportModal(true);
  };

  const handleDelete = (key: KeyData) => {
    setCurrentKey(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (currentKey) {
      Alert.alert('Success', 'Key deleted successfully');
      setShowDeleteModal(false);
      setCurrentKey(null);
    }
  };

  const submitReport = () => {
    Alert.alert('Success', 'Report submitted successfully');
    setShowReportModal(false);
    setCurrentKey(null);
  };

  const renderKeyCard = (key: KeyData) => (
    <View key={key.id} style={[styles.keyCard, key.isExpired && styles.expiredCard]}>
      <View style={getStatusBubbleStyle(key.status, key.isExpired)}>
        <ThemedText style={styles.statusText}>
          {key.status === 'not-seen' ? 'not seen' : key.status}
        </ThemedText>
      </View>
      
      <View style={styles.keyInfo}>
        <ThemedText style={styles.keyTitle}>{key.title}</ThemedText>
        <View style={styles.keyDivider} />
        
        <ThemedText style={styles.keyDetail}>
          {activeTab === 'received' ? 'From:' : 'Shared with:'} {key.from || key.sharedWith}
        </ThemedText>
        <ThemedText style={styles.keyDetail}>
          Views left: {key.views}
        </ThemedText>
        <ThemedText style={styles.keyDetail}>
          {key.isExpired ? key.expires : `Expires in ${key.expires}`}
        </ThemedText>
      </View>
      
      {/* Only show button for non-expired keys or expired sent keys */}
      {!(key.isExpired && activeTab === 'received') && (
        <TouchableOpacity
          style={[
            styles.manageButton,
            key.isExpired && activeTab === 'sent' && styles.secondaryButton
          ]}
          onPress={() => handleKeyAction(key)}
        >
          <ThemedText style={[
            styles.manageButtonText,
            key.isExpired && activeTab === 'sent' && styles.secondaryButtonText
          ]}>
            {activeTab === 'received' ? 'View' : 
             key.isExpired ? 'View' : 'Manage'}
          </ThemedText>
        </TouchableOpacity>
      )}
      
      {key.isExpired && (
        <View style={styles.expiredActions}>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => handleReport(key)}
          >
            <ThemedText style={styles.reportButtonText}>Report</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(key)}
          >
            <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>My Keys</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7bc49a" />
          <ThemedText style={styles.loadingText}>Loading your keys...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>My Keys</ThemedText>
      </View>
      
      {renderModeToggle()}
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeKeys.length > 0 && (
          <>
            <ThemedText style={styles.sectionTitle}>Active</ThemedText>
            {activeKeys.map(renderKeyCard)}
          </>
        )}
        
        {expiredKeys.length > 0 && (
          <>
            <ThemedText style={styles.sectionHeader}>Expired</ThemedText>
            {expiredKeys.map(renderKeyCard)}
          </>
        )}
        
        {filteredKeys.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No {activeTab} keys yet
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Delete Key</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to delete this key? You will no longer be able to view this information.
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={confirmDelete}
            >
              <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Report an Incident</ThemedText>
            <TextInput
              style={styles.reportInput}
              placeholder="Please describe the issue or incident..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={submitReport}
            >
              <ThemedText style={styles.confirmButtonText}>Submit Report</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowReportModal(false)}
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
  modeToggle: {
    backgroundColor: '#e9f9f3',
    borderRadius: 999,
    padding: 4,
    margin: 20,
    marginBottom: 20,
    flexDirection: 'row',
    position: 'relative',
  },
modeSlider: {
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
modeSliderRight: {
  left: '50%',  
  right: 4,       
},
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: '700', // Make it bold like in mockup
    color: '#6b7280',
  },
  modeOptionActive: {
    color: '#1f2937',
    fontWeight: '700', // Keep it bold when active
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 24,
    marginBottom: 12,
  },
  keyCard: {
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
    position: 'relative',
  },
  expiredCard: {
    opacity: 0.6,
  },
  statusBubble: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusNew: {
    backgroundColor: '#FFD66B',
  },
  statusSeen: {
    backgroundColor: '#b5eac1',
  },
  statusNotSeen: {
    backgroundColor: '#d1d5db',
  },
  expiredBubble: {
    opacity: 0.6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'lowercase',
  },
  keyInfo: {
    marginBottom: 16,
  },
  keyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  keyDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  keyDetail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  manageButton: {
    backgroundColor: '#FFD66B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#d1d5db',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  secondaryButtonText: {
    color: '#1f2937',
  },
  expiredActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reportButton: {
    flex: 1,
    backgroundColor: '#ff9aa2',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
  confirmButton: {
    backgroundColor: '#ff9aa2',
  },
  confirmButtonText: {
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
  reportInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
  },
});