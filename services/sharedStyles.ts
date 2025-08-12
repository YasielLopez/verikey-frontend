import { StyleSheet } from 'react-native';

export const colors = {
  // Primary colors
  primary: '#b5ead7',
  accent: '#FFD66B',
  success: '#b5eac1',
  error: '#ff9aa2',
  neutral: '#d1d5db',
  warning: '#fbbf24',
  
  // Background colors
  background: '#fdfdfd',
  cardBackground: 'rgba(255, 255, 255, 0.85)',
  sectionBackground: 'rgba(255, 255, 255, 0.5)',
  locationBackground: '#f0f9ff',
  noteBackground: 'rgba(181, 234, 215, 0.2)',
  
  // Text colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Border colors
  border: '#e5e7eb',
  borderActive: '#b5ead7',
  noteBorder: 'rgba(181, 234, 215, 0.4)',
  
  // Specific UI elements
  toggleBackground: '#e9f9f3',
  toggleSlider: '#b5eac1',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

export const dimensions = {
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    pill: 999,
  },
  padding: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
  },
  headerHeight: 70,
  tabHeight: 44,
};

export const createSharedStyles = () => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header styles
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  headerCentered: {
    backgroundColor: colors.primary,
    paddingTop: dimensions.headerHeight,
    paddingBottom: 25,
    paddingHorizontal: dimensions.padding.xlarge,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  
  headerTitleCentered: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
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
  
  headerSpacer: {
    width: 28,
  },
  
  // Content and scroll styles
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 50, 
  },
  
  scrollContentLarge: {
    paddingHorizontal: 20,
    paddingBottom: 140, 
  },
  
  // Mode toggle (Received/Sent)
  modeToggle: {
    backgroundColor: colors.toggleBackground,
    borderRadius: dimensions.borderRadius.pill,
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
    height: dimensions.tabHeight,
    backgroundColor: colors.toggleSlider,
    borderRadius: dimensions.borderRadius.pill,
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
    zIndex: 2,
  },
  
  modeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  
  modeOptionActive: {
    color: colors.textPrimary,
  },
  
  // Section styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  
  oldSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  expandButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  
  collapsedMessage: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  emptySection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.sectionBackground,
    borderRadius: dimensions.borderRadius.medium,
    marginBottom: 16,
  },
  
  emptySectionText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Card styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  
  inactiveCard: {
    opacity: 0.7,
  },
  
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: dimensions.borderRadius.pill,
    zIndex: 3,
  },
  
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  cardInfo: {
    marginBottom: 16,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  
  cardDetail: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  
  cardTimestamp: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 8,
  },
  
  cardTimestampWithNote: {
    marginTop: 12,
  },
  
  // Info row styles (for detail screens)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  
  // Notes container
  notesContainer: {
    backgroundColor: colors.noteBackground,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.noteBorder,
  },
  
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  
  notesText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  // Data sections
  dataSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  dataSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  
  dataList: {
    gap: 8,
  },
  
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  dataCheckmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginRight: 8,
  },
  
  dataWarningIcon: {
    fontSize: 14,
    marginRight: 8,
    color: colors.warning,
  },
  
  dataText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  
  // Notes section (separate from notes container)
  notesSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  notesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  
  // Location section
  locationSection: {
    backgroundColor: colors.locationBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  
  locationIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  
  locationNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Photo section
  photoSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.large,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  
  photoSectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  photoImage: {
    width: 150,
    height: 150,
    borderRadius: dimensions.borderRadius.large,
  },
  
  // Button styles
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: dimensions.borderRadius.pill,
    alignItems: 'center',
  },
  
  fullWidthButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: dimensions.borderRadius.pill,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: colors.accent,
  },
  
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  secondaryButton: {
    backgroundColor: colors.neutral,
  },
  
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  dangerButton: {
    backgroundColor: colors.error,
  },
  
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  
  viewButton: {
    backgroundColor: colors.primary,
  },
  
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  // Load more button
  loadMoreButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: dimensions.borderRadius.pill,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: dimensions.borderRadius.xlarge,
    padding: 24,
    minWidth: 280,
    maxWidth: '90%',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: dimensions.borderRadius.pill,
    marginBottom: 8,
    alignItems: 'center',
  },
  
  modalConfirmButton: {
    backgroundColor: colors.error,
  },
  
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  
  modalCancelButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.small,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  
  // Warning section
  warningSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  
  warningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Photo modal
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

// Helper function to merge styles
export const mergeStyles = (...styles: any[]) => {
  return styles.filter(Boolean);
};

// Export singleton instance
export const sharedStyles = createSharedStyles();
