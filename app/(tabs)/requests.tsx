import { ThemedView } from '@/components/ThemedView';
import { RequestsAPI, UIRequestData } from '@/services/api';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Edit,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
  User,
  X
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const APP_PURPLE = '#D9B8F3';
const DENIED_COLOR = '#EE5E37'; 

type FilterType = 'all' | 'pending' | 'completed' | 'denied';

const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          })
        }
      ]}
    >
      <View style={styles.skeletonPill} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
      <View style={styles.skeletonButton} />
    </Animated.View>
  );
};

export default function RequestsScreen() {
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [allRequests, setAllRequests] = useState<{sent: UIRequestData[]; received: UIRequestData[]}>({
    sent: [],
    received: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<UIRequestData | null>(null);
  const [reportText, setReportText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(['all']));
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePopup, setActivePopup] = useState<number | null>(null);

  const lastLoadTime = useRef<number>(0);
  const isBackgroundLoading = useRef<boolean>(false);
  const MIN_REFRESH_INTERVAL = 5000;
  const isMounted = useRef<boolean>(true);
  const isNavigatingToDetail = useRef(false);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isNavigatingToDetail.current) {
        setActiveTab('received');
      }
      isNavigatingToDetail.current = false;

      const loadInitial = async () => {
        const now = Date.now();
        const shouldForceRefresh = now - lastLoadTime.current > MIN_REFRESH_INTERVAL;

        try {
          const cachedData = await RequestsAPI.getRequests(false);
          if (cachedData && (cachedData.sent.length > 0 || cachedData.received.length > 0)) {
            if (isMounted.current) {
              setAllRequests(cachedData);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('⚠ Cache load failed:', error);
        }

        if (shouldForceRefresh && !isBackgroundLoading.current) {
          isBackgroundLoading.current = true;
          try {
            const freshData = await RequestsAPI.getRequests(true);
            if (isMounted.current) {
              setAllRequests(freshData);
              lastLoadTime.current = now;
            }
          } catch (error) {
            console.error('⚠ Background refresh failed:', error);
          } finally {
            isBackgroundLoading.current = false;
            if (isMounted.current && loading) {
              setLoading(false);
            }
          }
        } else if (loading) {
          setLoading(false);
        }
      };

      loadInitial();
    }, [route.params])
  );

  const handleTabChange = (tab: 'received' | 'sent') => {
    setActiveTab(tab);
    setShowDropdown(false);
    setActivePopup(null);
  };

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
      return 'Unknown';
    }
  };

  const loadRequests = async (showRefreshIndicator = false, forceRefresh = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else if (!isBackgroundLoading.current) setLoading(true);

      const requestsData = await RequestsAPI.getRequests(forceRefresh);
      if (isMounted.current) {
        setAllRequests(requestsData);
        lastLoadTime.current = Date.now();
      }
    } catch (error: any) {
      console.error('Failed to load requests:', error);
      if (!isBackgroundLoading.current && isMounted.current) {
        Alert.alert('Error', 'Failed to load requests', [
          { text: 'Retry', onPress: () => loadRequests(showRefreshIndicator, true) },
          { text: 'OK', style: 'cancel' }
        ]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    lastLoadTime.current = Date.now();
    loadRequests(true, true);
  };

  const filteredRequests = activeTab === 'received' ? allRequests.received : allRequests.sent;
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const completedRequests = filteredRequests.filter(req => req.status === 'completed');
  const deniedRequests = filteredRequests.filter(req => req.status === 'denied' || req.status === 'cancelled');

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(new Set([filter]));
  };

  const getDisplayRequests = () => {
    if (activeFilters.has('all')) {
      return [...filteredRequests].sort((a, b) => {
        const dateA = new Date(a.receivedOn || a.sentOn || '').getTime();
        const dateB = new Date(b.receivedOn || b.sentOn || '').getTime();
        return dateB - dateA;
      });
    }
    if (activeFilters.has('pending')) return pendingRequests;
    if (activeFilters.has('completed')) return completedRequests;
    if (activeFilters.has('denied')) return deniedRequests;
    return filteredRequests;
  };

  const displayRequests = getDisplayRequests();

  const handleRequestAction = (request: UIRequestData) => {
    isNavigatingToDetail.current = true;
    if (activeTab === 'received' && request.status === 'pending') {
      router.push({
        pathname: '/verification-response',
        params: {
          requestId: request.id.toString(),
          requestTitle: request.title,
          requesterEmail: request.from || 'Unknown',
          informationTypes: JSON.stringify(request.informationTypes || ['age'])
        }
      });
    } else if (activeTab === 'sent' && request.status === 'pending') {
      router.push({
        pathname: '/edit-request',
        params: {
          requestId: request.id.toString(),
          title: request.title,
          sentTo: request.sentTo || 'Unknown',
          sentOn: formatDateDisplay(request.sentOn || 'Unknown'),
          informationTypes: JSON.stringify(request.informationTypes || []),
          notes: request.notes || ''
        }
      });
    }
  };

  const handleReport = (request: UIRequestData) => {
    setCurrentRequest(request);
    setReportText('');
    setShowReportModal(true);
  };

  const handleDelete = async (request: UIRequestData) => {
    try {
      await RequestsAPI.deleteRequest(request.id);
      setAllRequests((prev) =>
        activeTab === 'received'
          ? { ...prev, received: prev.received.filter((r) => r.id !== request.id) }
          : { ...prev, sent: prev.sent.filter((r) => r.id !== request.id) }
      );
      setActivePopup(null);
      Alert.alert('Success', 'Request deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      Alert.alert('Error', 'Failed to delete request. Please try again.');
    }
  };

  const handleDeny = async (request: UIRequestData) => {
    try {
      await RequestsAPI.denyRequest(request.id);
      await loadRequests(false, true);
      Alert.alert('Success', 'Request denied successfully');
    } catch (error: any) {
      console.error('Deny request failed:', error);
      Alert.alert('Error', 'Failed to deny request. Please try again.');
    }
  };

  const submitReport = () => {
    setShowReportModal(false);
    setCurrentRequest(null);
    setReportText('');
  };

  const cleanSenderName = (name: string | undefined): string => {
    if (!name) return 'Unknown';
    return name.startsWith('@') ? name.substring(1) : name;
  };

  const renderRequestCard = (request: UIRequestData) => {
    const isPopupOpen = activePopup === request.id;
    const isDimmed = isPopupOpen || request.status !== 'pending';
    
    const getCardStyle = () =>
      isDimmed ? [styles.card, styles.inactiveCard] : styles.card;
    
    const getPillStyle = () =>
      isDimmed ? [styles.senderPill, styles.inactivePill] : styles.senderPill;
    
    const getTitleStyle = () =>
      isDimmed ? [styles.cardTitle, styles.inactiveText] : styles.cardTitle;
    
    const getStatusTextStyle = () =>
      isDimmed ? [styles.statusText, styles.inactiveStatusText] : styles.statusText;
    
    const metaIconColor = isDimmed ? '#9ca3af' : '#6b7280';
    const userIconColor = isDimmed ? '#9ca3af' : '#374151';
    
    const statusDotStyle = [
      styles.statusDot,
      request.status === 'pending' && !isDimmed && styles.pendingStatusDot,
      request.status === 'completed' && styles.completedStatusDot,
      (request.status === 'denied' || request.status === 'cancelled') && styles.deniedStatusDot,
      isDimmed && styles.inactiveStatusDot,
    ];

    const getStatusText = () => {
      if (request.status === 'pending') return 'This request is pending';
      if (request.status === 'completed') return 'This request was completed';
      if (request.status === 'denied') return 'This request was denied';
      if (request.status === 'cancelled') return 'This request was cancelled';
      return 'Unknown status';
    };

    return (
      <View key={request.id}>
        {isPopupOpen && (
          <Pressable
            style={styles.fullScreenOverlay}
            onPress={() => setActivePopup(null)}
          />
        )}
        
        <TouchableOpacity
          style={getCardStyle()}
          onPress={() => handleRequestAction(request)}
          activeOpacity={0.98}
        >
          {/* Floating sender pill */}
          <View style={getPillStyle()}>
            <User size={14} color={userIconColor} />
            <Text style={styles.pillText} numberOfLines={1}>
              {activeTab === 'received'
                ? `From ${cleanSenderName(request.from)}`
                : `To ${cleanSenderName(request.sentTo)}`}
            </Text>
          </View>

          {/* Three Dots Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              setActivePopup(isPopupOpen ? null : request.id);
            }}
          >
            <MoreHorizontal size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Card content */}
          <View style={styles.cardContent}>
            <Text style={getTitleStyle()}>{request.title}</Text>
            
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={styles.statusRow}>
                <View style={statusDotStyle as any} />
                <Text style={getStatusTextStyle()}>{getStatusText()}</Text>
              </View>
            </View>

            {/* Metadata row */}
            <View style={styles.metadataRow}>
              <View style={styles.metadataPill}>
                <Calendar size={14} color="#6b7280" />
                <Text style={styles.metadataText}>
                  {formatDateDisplay(activeTab === 'received' ? request.receivedOn : request.sentOn)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action button for pending requests */}
          {request.status === 'pending' && (
            <TouchableOpacity
              style={[
                styles.arrowButton,
                isDimmed && styles.arrowButtonDimmed
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleRequestAction(request);
              }}
            >
              {activeTab === 'received' ? (
                <ChevronRight size={20} color={isDimmed ? '#9ca3af' : '#374151'} />
              ) : (
                <Edit size={16} color={isDimmed ? '#9ca3af' : '#374151'} />
              )}
            </TouchableOpacity>
          )}

          {/* Popup menu */}
          {isPopupOpen && (
            <View style={[
              styles.popupMenuCentered,
              (request.status !== 'pending' || activeTab !== 'received') && { transform: [{ translateX: -80 }, { translateY: -30 }] },
              activeTab === 'sent' && { transform: [{ translateX: -80 }, { translateY: -10 }] }
            ]}>
              {request.status === 'pending' && activeTab === 'received' && (
                <TouchableOpacity
                  style={styles.popupMenuItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActivePopup(null);
                    handleDeny(request);
                  }}
                >
                  <X size={20} color="#6b7280" />
                  <Text style={styles.popupMenuText}>Deny</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.popupMenuItem,
                  request.status === 'pending' && activeTab === 'received' && styles.popupMenuItemBorderTop
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  setActivePopup(null);
                  handleDelete(request);
                }}
              >
                <Trash2 size={20} color="#6b7280" />
                <Text style={styles.popupMenuText}>Delete</Text>
              </TouchableOpacity>
              {activeTab === 'received' && (
                <TouchableOpacity
                  style={[styles.popupMenuItem, styles.popupMenuItemBorderTop]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActivePopup(null);
                    handleReport(request);
                  }}
                >
                  <AlertTriangle size={20} color="#6b7280" />
                  <Text style={styles.popupMenuText}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && allRequests.sent.length === 0 && allRequests.received.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.dropdownSection}>
                <View style={styles.dropdownButton}>
                  <Text style={styles.headerTitle}>
                    {activeTab === 'received' ? 'Received Requests' : 'Sent Requests'}
                  </Text>
                  <ChevronDown size={20} color="#9ca3af" />
                </View>
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
          <FlatList
            data={[1, 2, 3, 4, 5]}
            keyExtractor={(item) => item.toString()}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
          />
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
          <View style={styles.headerContent}>
            <View style={styles.dropdownSection}>
              <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                style={styles.dropdownButton}
                activeOpacity={1}
              >
                <Text style={styles.headerTitle}>
                  {activeTab === 'received' ? 'Received Requests' : 'Sent Requests'}
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
                    onPress={() => {
                      handleTabChange('received');
                      setShowDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      activeTab === 'received' && styles.dropdownItemActive
                    ]}
                    activeOpacity={1}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        activeTab === 'received' && styles.dropdownItemTextActive
                      ]}
                    >
                      Received Requests
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity
                    onPress={() => {
                      handleTabChange('sent');
                      setShowDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      activeTab === 'sent' && styles.dropdownItemActive
                    ]}
                    activeOpacity={1}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        activeTab === 'sent' && styles.dropdownItemTextActive
                      ]}
                    >
                      Sent Requests
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

        {/* Content */}
        <View style={styles.content}>
          <FlatList
            data={displayRequests}
            keyExtractor={(item) => `request-${item.id}-${item.status}`}
            ListHeaderComponent={() => (
              <View style={styles.filterHeaderRow}>
                <Text style={styles.filterHeaderText}>
                  {activeFilters.has('all')
                    ? `All Requests (${displayRequests.length})`
                    : activeFilters.has('pending')
                    ? `Pending Requests (${displayRequests.length})`
                    : activeFilters.has('completed')
                    ? `Completed Requests (${displayRequests.length})`
                    : `Denied Requests (${displayRequests.length})`
                  }
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(true)}
                  style={styles.filterHeaderIcon}
                  accessibilityRole="button"
                  accessibilityLabel="Open filters"
                >
                  <SlidersHorizontal size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <User size={32} color="#9ca3af" />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeFilters.has('all')
                    ? `No ${activeTab} requests found`
                    : `No ${activeFilters.values().next().value} ${activeTab} requests found`
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'received'
                    ? 'Requests sent to you will appear here'
                    : 'Requests you send will appear here'
                  }
                </Text>
              </View>
            )}
            renderItem={({ item }) => renderRequestCard(item)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#10b981']}
                tintColor={'#10b981'}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowFilterModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Requests</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterOptions}>
                {/* All Requests */}
                {(() => {
                  const selected = activeFilters.has('all');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('all')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.filterDot,
                          { backgroundColor: selected ? '#FFFFFF' : '#1f2937' }
                        ]} />
                        <Text style={[
                          styles.filterOptionText,
                          selected && { color: '#ffffff' }
                        ]}>All Requests</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>
                            {filteredRequests.length}
                          </Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Pending Requests */}
                {(() => {
                  const selected = activeFilters.has('pending');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('pending')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.filterDot,
                          { backgroundColor: selected ? '#FFFFFF' : APP_PURPLE }
                        ]} />
                        <Text style={[
                          styles.filterOptionText,
                          selected && { color: '#ffffff' }
                        ]}>Pending</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{pendingRequests.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Completed Requests */}
                {completedRequests.length > 0 && (() => {
                  const selected = activeFilters.has('completed');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('completed')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.filterDot,
                          { backgroundColor: selected ? '#FFFFFF' : '#16a34a' }
                        ]} />
                        <Text style={[
                          styles.filterOptionText,
                          selected && { color: '#ffffff' }
                        ]}>Completed</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{completedRequests.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Denied Requests */}
                {deniedRequests.length > 0 && (() => {
                  const selected = activeFilters.has('denied');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('denied')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.filterDot,
                          { backgroundColor: selected ? '#FFFFFF' : DENIED_COLOR }
                        ]} />
                        <Text style={[
                          styles.filterOptionText,
                          selected && { color: '#ffffff' }
                        ]}>Denied</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{deniedRequests.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}
              </View>

              {/* Clear Filters */}
              {(!activeFilters.has('all')) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setActiveFilters(new Set(['all']));
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Report Modal */}
        <Modal visible={showReportModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report an Issue</Text>
                <TouchableOpacity
                  onPress={() => setShowReportModal(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtext}>
                Report request: "{currentRequest?.title}"
              </Text>
              <TextInput
                style={styles.reportInput}
                placeholder="Please describe the issue or incident..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={reportText}
                onChangeText={setReportText}
              />
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={submitReport}
                disabled={!reportText.trim()}
              >
                <Text style={styles.modalSubmitButtonText}>Submit Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#000000',
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#e5e7eb',
  },
  dropdownItemActive: {
    backgroundColor: '#c2ff6b',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  dropdownItemTextActive: {
    color: '#000000',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  filterHeaderRow: {
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterHeaderText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  filterHeaderIcon: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    height: 176,
    position: 'relative',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inactiveCard: {
    backgroundColor: '#f9fafb',
  },
  senderPill: {
    position: 'absolute',
    top: -12,
    left: 16,
    backgroundColor: APP_PURPLE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
    zIndex: 10,
    maxWidth: SCREEN_WIDTH - 120,
  },
  inactivePill: {
    backgroundColor: '#e5e7eb',
    borderColor: '#9ca3af',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 20,
  },
  cardContent: {
    flex: 1,
    paddingTop: 22,
    paddingRight: 60,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
  },
  inactiveText: {
    color: '#6b7280',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: APP_PURPLE,
  },
  pendingStatusDot: {
    backgroundColor: APP_PURPLE,
  },
  completedStatusDot: {
    backgroundColor: '#16a34a',
  },
  deniedStatusDot: {
    backgroundColor: DENIED_COLOR,
  },
  inactiveStatusDot: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  inactiveStatusText: {
    color: '#6b7280',
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metadataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metadataText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  arrowButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDimmed: {
    backgroundColor: '#e5e7eb',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 40,
  },
  popupMenuCentered: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -50 }],
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
  popupMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  popupMenuItemBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  popupMenuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSubmitButton: {
    backgroundColor: '#7b3ff2',
  },
  modalSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#1f2937',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  filterOptionActive: {
    backgroundColor: '#000000',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  filterCountCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  // Skeleton styles
  skeletonPill: {
    position: 'absolute',
    top: -12,
    left: 16,
    width: 120,
    height: 32,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 32,
    marginBottom: 16,
    width: '70%',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
    width: '100%',
  },
  skeletonButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
  },
});