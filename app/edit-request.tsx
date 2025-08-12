import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RequestsAPI } from '@/services/api';
import { colors, dimensions, mergeStyles, sharedStyles } from '@/services/sharedStyles';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
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

interface EditRequestParams {
  requestId: string;
  title: string;
  sentTo: string;
  sentOn: string;
  informationTypes?: string;
  notes?: string;
}

type InformationType = 'fullname' | 'firstname' | 'age' | 'location' | 'selfie' | 'photo';

export default function EditRequestScreen() {
  const params = useLocalSearchParams<EditRequestParams>();
  const [selectedInfo, setSelectedInfo] = React.useState<Set<InformationType>>(new Set());
  const [noteText, setNoteText] = React.useState('');
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    try {
      if (params.informationTypes) {
        const types = JSON.parse(params.informationTypes) as InformationType[];
        setSelectedInfo(new Set(types));
      }
    } catch (error) {
      console.error('Failed to parse information types:', error);
      setSelectedInfo(new Set(['fullname', 'location']));
    }
    
    if (params.notes) {
      setNoteText(params.notes);
    }
  }, [params.informationTypes, params.notes]);

  const informationOptions = [
    { key: 'fullname' as InformationType, label: 'Full Name' },
    { key: 'firstname' as InformationType, label: 'First Name Only' },
    { key: 'age' as InformationType, label: 'Age' },
    { key: 'location' as InformationType, label: 'General Current Location' },
    { key: 'selfie' as InformationType, label: 'Current Selfie' },
    { key: 'photo' as InformationType, label: 'Additional Photo' },
  ];

  const toggleInformationType = (type: InformationType) => {
    const newSet = new Set(selectedInfo);
    
    if (type === 'fullname' || type === 'firstname') {
      const otherNameField = type === 'fullname' ? 'firstname' : 'fullname';
      newSet.delete(otherNameField);
    }
    
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    
    setSelectedInfo(newSet);
  };

  const handleSaveNote = () => {
    setShowNoteModal(false);
  };

  const handleClearNote = () => {
    setNoteText('');
    setShowNoteModal(false);
  };

  const handleUpdateRequest = async () => {
    if (selectedInfo.size === 0) {
      Alert.alert('Error', 'Please select at least one information type');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const requestId = parseInt(params.requestId);
      const updateData = {
        label: params.title,
        information_types: Array.from(selectedInfo),
        notes: noteText.trim()
      };

      console.log('🔄 Updating request:', requestId, updateData);
      await RequestsAPI.updateRequest(requestId, updateData);
      
      Alert.alert(
        'Request Updated',
        'Your request has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to update request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update request. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={sharedStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backArrow}>‹</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Request</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={sharedStyles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Request Info Section */}
          <View style={mergeStyles(sharedStyles.card, styles.formSection)}>
            <View style={sharedStyles.cardInfo}>
              <ThemedText style={sharedStyles.cardTitle}>{params.title || 'Verification Request'}</ThemedText>
              <View style={sharedStyles.cardDivider} />
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Sent to:</ThemedText>
                <ThemedText style={styles.infoValue}>{params.sentTo || 'Unknown'}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Sent on:</ThemedText>
                <ThemedText style={styles.infoValue}>{params.sentOn || 'Unknown'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Information to Request Section */}
          <View style={mergeStyles(sharedStyles.card, styles.formSection)}>
            <ThemedText style={styles.sectionLabel}>Information to Request</ThemedText>
            <View style={styles.toggleList}>
              {informationOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.toggleItem,
                    selectedInfo.has(option.key) && styles.toggleItemActive
                  ]}
                  onPress={() => toggleInformationType(option.key)}
                >
                  <View style={styles.toggleItemTextContainer}>
                    <ThemedText style={styles.toggleItemText}>{option.label}</ThemedText>
                  </View>
                  <View style={[
                    styles.toggleSwitch,
                    selectedInfo.has(option.key) && styles.toggleSwitchActive
                  ]}>
                    <View style={[
                      styles.toggleSwitchKnob,
                      selectedInfo.has(option.key) && styles.toggleSwitchKnobActive
                    ]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note Section */}
          <View style={mergeStyles(sharedStyles.card, styles.formSection)}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.sectionLabel}>Include Note (Optional)</ThemedText>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  noteText.length > 0 && styles.selectorButtonSelected
                ]}
                onPress={() => setShowNoteModal(true)}
              >
                <ThemedText style={styles.selectorButtonText}>
                  {noteText.length > 0 ? 'Edit Note' : 'Add Note'}
                </ThemedText>
              </TouchableOpacity>
              
              {noteText.length > 0 && (
                <View style={styles.notePreview}>
                  <ThemedText style={styles.notePreviewText} numberOfLines={2}>
                    {noteText}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                (selectedInfo.size === 0 || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleUpdateRequest}
              disabled={selectedInfo.size === 0 || isSubmitting}
            >
              <ThemedText style={sharedStyles.primaryButtonText}>
                {isSubmitting ? 'Updating...' : 'Update Request'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <ThemedText style={sharedStyles.secondaryButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={sharedStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={sharedStyles.modalContent}>
            <ThemedText style={sharedStyles.modalTitle}>Add Note</ThemedText>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a personal message to your request..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={mergeStyles(sharedStyles.modalButton, styles.modalSaveButton)} 
              onPress={handleSaveNote}
            >
              <ThemedText style={styles.modalSaveButtonText}>Save Note</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={mergeStyles(sharedStyles.modalButton, styles.modalClearButton)} 
              onPress={handleClearNote}
            >
              <ThemedText style={styles.modalClearButtonText}>Clear Note</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={mergeStyles(sharedStyles.modalButton, sharedStyles.modalCancelButton)} 
              onPress={() => setShowNoteModal(false)}
            >
              <ThemedText style={sharedStyles.modalCancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  formSection: {
    marginTop: 16,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  toggleList: {
    gap: 10,
  },
  toggleItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: dimensions.borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleItemActive: {
    borderColor: colors.borderActive,
    backgroundColor: 'rgba(181, 234, 215, 0.15)',
  },
  toggleItemTextContainer: {
    flex: 1,
  },
  toggleItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  toggleSwitch: {
    position: 'relative',
    width: 44,
    height: 24,
    backgroundColor: colors.neutral,
    borderRadius: 50,
  },
  toggleSwitchActive: {
    backgroundColor: colors.success,
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
  formGroup: {
    marginBottom: 0,
  },
  selectorButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  selectorButtonSelected: {
    backgroundColor: colors.primary,
  },
  selectorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'left',
  },
  notePreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notePreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  updateButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: dimensions.borderRadius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: dimensions.borderRadius.pill,
    backgroundColor: colors.neutral,
    alignItems: 'center',
  },
  noteInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalSaveButton: {
    backgroundColor: colors.accent,
    marginBottom: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalClearButton: {
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  modalClearButtonText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});