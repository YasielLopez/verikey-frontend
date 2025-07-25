import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CameraView } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface RequestData {
  id: number;
  title: string;
  from?: string;
  sentTo?: string;
  status: 'pending' | 'active' | 'denied';
  receivedTime?: string;
  sentTime?: string;
  type: 'received' | 'sent';
}

export default function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Response form states
  const [responseNote, setResponseNote] = useState('');
  const [responseExpiry, setResponseExpiry] = useState('');
  const [responseViews, setResponseViews] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<RequestData | null>(null);

  const cameraRef = useRef(null);

  // Mock data matching the mockup
  const mockRequests: RequestData[] = [
    // Received Requests
    {
      id: 1,
      title: 'Age Verification Request',
      from: 'marcus.dev@outlook.com',
      status: 'pending',
      receivedTime: '2 hours ago',
      type: 'received',
    },
    {
      id: 2,
      title: 'Dating Verification',
      from: '@alex_photos',
      status: 'denied',
      receivedTime: 'June 1, 2025',
      type: 'received',
    },
    // Your Requests
    {
      id: 3,
      title: 'Marketplace Seller Check',
      sentTo: '(415) 287-9054',
      status: 'pending',
      sentTime: '45 minutes ago',
      type: 'sent',
    },
    {
      id: 4,
      title: 'Event Meet-up Verification',
      sentTo: '@eventplanner_jay',
      status: 'denied',
      sentTime: 'May 30, 2025',
      type: 'sent',
    },
  ];

  React.useEffect(() => {
    setRequests(mockRequests);
  }, []);

  const getStatusBubbleStyle = (status: string) => {
    const baseStyle = [styles.statusBubble];
    switch (status) {
      case 'pending':
        return [...baseStyle, styles.statusPending];
      case 'denied':
        return [...baseStyle, styles.statusDenied];
      default:
        return baseStyle;
    }
  };

  const filteredRequests = requests.filter(request => request.type === activeTab);
  const activeRequests = filteredRequests.filter(request => request.status === 'pending');
  const deniedRequests = filteredRequests.filter(request => request.status === 'denied');

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
          Your Requests
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const handleRespond = (request: RequestData) => {
    setCurrentRequest(request);
    // Navigate to age verification response screen
    Alert.alert('Respond to Request', `Would respond to: ${request.title}`);
  };

  const handleDeny = (request: RequestData) => {
    setCurrentRequest(request);
    setShowDenyModal(true);
  };

  const handleEdit = (request: RequestData) => {
    setCurrentRequest(request);
    Alert.alert('Edit Request', `Would edit: ${request.title}`);
  };

  const handleDelete = (request: RequestData) => {
    setCurrentRequest(request);
    setShowDeleteModal(true);
  };

  const handleReport = (request: RequestData) => {
    setCurrentRequest(request);
    setShowReportModal(true);
  };

  const confirmDeny = () => {
    if (currentRequest) {
      Alert.alert('Success', 'Request denied successfully');
      setShowDenyModal(false);
      setCurrentRequest(null);
    }
  };

  const confirmDelete = () => {
    if (currentRequest) {
      Alert.alert('Success', 'Request deleted successfully');
      setShowDeleteModal(false);
      setCurrentRequest(null);
    }
  };

  const submitReport = () => {
    Alert.alert('Success', 'Report submitted successfully');
    setShowReportModal(false);
    setCurrentRequest(null);
  };

  const renderRequestCard = (request: RequestData) => (
    <View key={request.id} style={[styles.requestCard, request.status === 'denied' && styles.deniedCard]}>
      <View style={getStatusBubbleStyle(request.status)}>
        <ThemedText style={styles.statusText}>
          {request.status}
        </ThemedText>
      </View>
      
      <View style={styles.requestInfo}>
        <ThemedText style={styles.requestTitle}>{request.title}</ThemedText>
        <View style={styles.requestDivider} />
        
        <ThemedText style={styles.requestDetail}>
          {activeTab === 'received' ? 'From:' : 'Sent to:'} {request.from || request.sentTo}
        </ThemedText>
        <ThemedText style={styles.requestDetail}>
          {activeTab === 'received' 
            ? (request.status === 'denied' ? `Denied ${request.receivedTime}` : `Received ${request.receivedTime}`)
            : (request.status === 'denied' ? `Denied ${request.sentTime}` : `Sent ${request.sentTime}`)
          }
        </ThemedText>
      </View>
      
      {request.status === 'pending' ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => activeTab === 'received' ? handleRespond(request) : handleEdit(request)}
          >
            <ThemedText style={styles.primaryButtonText}>
              {activeTab === 'received' ? 'Respond' : 'Edit'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => activeTab === 'received' ? handleDeny(request) : handleDelete(request)}
          >
            <ThemedText style={styles.secondaryButtonText}>
              {activeTab === 'received' ? 'Deny' : 'Cancel'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.reportButton]}
            onPress={() => handleReport(request)}
          >
            <ThemedText style={styles.reportButtonText}>Report</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleDelete(request)}
          >
            <ThemedText style={styles.secondaryButtonText}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Requests</ThemedText>
      </View>
      
      {renderModeToggle()}
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeRequests.length > 0 && (
          <>
            <ThemedText style={styles.sectionTitle}>Active</ThemedText>
            {activeRequests.map(renderRequestCard)}
          </>
        )}
        
        {deniedRequests.length > 0 && (
          <>
            <ThemedText style={styles.sectionHeader}>Denied</ThemedText>
            {deniedRequests.map(renderRequestCard)}
          </>
        )}
        
        {filteredRequests.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No {activeTab === 'received' ? 'received requests' : 'sent requests'} yet
            </ThemedText>
          </View>
        )}
      </ScrollView>

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
              onPress={() => {
                setPhotoTaken(true);
                setShowCameraModal(false);
                Alert.alert('Success', 'Photo captured successfully!');
              }}
            >
              <ThemedText style={styles.captureButtonText}>📸</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Deny Request Modal */}
      <Modal visible={showDenyModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Deny Request</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to deny this request? The requester will be notified.
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={confirmDeny}
            >
              <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDenyModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {activeTab === 'received' ? 'Delete Request' : 'Cancel Request'}
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              {activeTab === 'received' 
                ? 'Are you sure you want to delete this request? This action cannot be undone.'
                : 'Are you sure you want to cancel this request? The recipient will be notified.'
              }
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
    justifyContent: 'center',
    borderRadius: 999,
    zIndex: 2,
  },
modeOptionText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#6b7280',
},
modeOptionActive: {
  color: '#1f2937',
  fontWeight: '700',
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
  requestCard: {
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
  deniedCard: {
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
  statusPending: {
    backgroundColor: '#d1d5db',
  },
  statusDenied: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'lowercase',
  },
  requestInfo: {
    marginBottom: 16,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  requestDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  requestDetail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD66B',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  secondaryButton: {
    backgroundColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportButton: {
    backgroundColor: '#ff9aa2',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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