import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { KeysAPI, UIKeyData } from '@/services/api';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  AlertTriangle,
  Ban,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
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

type FilterType = 'all' | 'active' | 'new' | 'inactive';

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

export default function KeysScreen() {
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [allKeys, setAllKeys] = useState<{sent: UIKeyData[]; received: UIKeyData[]}>({
    sent: [],
    received: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [currentKey, setCurrentKey] = useState<UIKeyData | null>(null);
  const [reportText, setReportText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(['all']));
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const lastLoadTime = useRef<number>(0);
  const isBackgroundLoading = useRef<boolean>(false);
  const MIN_REFRESH_INTERVAL = 5000;
  const isMounted = useRef<boolean>(true);
  const isNavigatingToDetail = useRef(false);

  const { user } = useAuth();

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
          const cachedData = await KeysAPI.getAllKeys(false);
          if (cachedData && (cachedData.sent.length > 0 || cachedData.received.length > 0)) {
            if (isMounted.current) {
              setAllKeys(cachedData);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('⚠ Cache load failed:', error);
        }

        if (shouldForceRefresh && !isBackgroundLoading.current) {
          isBackgroundLoading.current = true;
          try {
            const freshData = await KeysAPI.getAllKeys(true);
            if (isMounted.current) {
              setAllKeys(freshData);
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
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch {
      return 'Unknown';
    }
  };

  const loadKeys = async (showRefreshIndicator = false, forceRefresh = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else if (!isBackgroundLoading.current) setLoading(true);

      const keysData = await KeysAPI.getAllKeys(forceRefresh);
      if (isMounted.current) {
        setAllKeys(keysData);
        lastLoadTime.current = Date.now();
      }
    } catch (error: any) {
      console.error('Failed to load keys:', error);
      if (!isBackgroundLoading.current && isMounted.current) {
        Alert.alert('Error', 'Failed to load keys', [
          { text: 'Retry', onPress: () => loadKeys(showRefreshIndicator, true) },
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
    loadKeys(true, true);
  };

  const filteredKeys = activeTab === 'received' ? allKeys.received : allKeys.sent;
  const activeKeys = filteredKeys.filter(key => key.status === 'active');
  const newKeys = filteredKeys.filter(key => key.isNew && key.status === 'active');
  const inactiveKeys = filteredKeys.filter(key => key.status === 'viewed_out');
  const revokedKeys = filteredKeys.filter(key => key.status === 'revoked');

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(new Set([filter]));
  };

  const getDisplayKeys = () => {
    if (activeFilters.has('all')) {
      return [...activeKeys, ...inactiveKeys, ...revokedKeys].sort((a, b) => {
        const dateA = new Date(a.receivedOn || a.sentOn || a.created_at || '').getTime();
        const dateB = new Date(b.receivedOn || b.sentOn || b.created_at || '').getTime();
        return dateB - dateA;
      });
    }
    if (activeFilters.has('active')) return activeKeys;

    let keys: UIKeyData[] = [];
    if (activeFilters.has('new')) keys = [...keys, ...newKeys];
    if (activeFilters.has('inactive')) keys = [...keys, ...inactiveKeys];

    const uniqueKeys = Array.from(new Map(keys.map(key => [key.id, key])).values());
    return uniqueKeys.sort((a, b) => {
      const dateA = new Date(a.receivedOn || a.sentOn || a.created_at || '').getTime();
      const dateB = new Date(b.receivedOn || b.sentOn || b.created_at || '').getTime();
      return dateB - dateA;
    });
  };

  const displayKeys = getDisplayKeys();

  const handleKeyAction = (key: UIKeyData) => {
    isNavigatingToDetail.current = true;

    if (activeTab === 'received') {
      if (key.status === 'viewed_out') {
        Alert.alert('Views Exhausted', 'You have used all available views for this key.');
        return;
      }

      router.push({
        pathname: '/view-key',
        params: {
          keyId: key.id.toString(),
          title: key.title,
          from: key.from || 'Unknown',
          views: key.views,
          receivedOn: formatDateDisplay(key.receivedOn || key.created_at || ''),
          status: key.status,
          keyType: 'received',
          returnTab: 'received'
        }
      });
    } else {
      if (key.status === 'active') {
        router.push({
          pathname: '/manage-key',
          params: {
            keyId: key.id.toString(),
            title: key.title,
            sharedWith: key.sharedWith || 'Unknown',
            lastViewed: key.lastViewed || 'Not Viewed',
            sentOn: formatDateDisplay(key.sentOn || key.created_at || ''),
            status: key.status,
            returnTab: 'sent'
          }
        });
      } else {
        router.push({
          pathname: '/view-key',
          params: {
            keyId: key.id.toString(),
            title: key.title,
            from: key.sharedWith || 'Unknown',
            views: key.views,
            receivedOn: formatDateDisplay(key.sentOn || key.created_at || ''),
            status: key.status,
            keyType: 'sent',
            returnTab: 'sent'
          }
        });
      }
    }
  };

  const handleReport = (key: UIKeyData) => {
    setCurrentKey(key);
    setReportText('');
    setShowReportModal(true);
  };

  const handleDelete = async (key: UIKeyData) => {
    try {
      await KeysAPI.deleteShareableKey(key.id);

      setAllKeys((prev) =>
        activeTab === 'received'
          ? { ...prev, received: prev.received.filter((k) => k.id !== key.id) }
          : { ...prev, sent: prev.sent.filter((k) => k.id !== key.id) }
      );
      setActivePopup(null);

      console.log(`✅ Key ${key.id} deleted successfully`);
    } catch (error: any) {
      console.error('Failed to delete key:', error);
      Alert.alert('Error', 'Failed to delete key. Please try again.');
    }
  };

  const handleRevoke = (key: UIKeyData) => {
    setCurrentKey(key);
    setActivePopup(null);
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!currentKey) return;

    setIsRevoking(true);
    try {
      await KeysAPI.revokeShareableKey(currentKey.id);

      setAllKeys((prev) => ({
        ...prev,
        sent: prev.sent.map((k) =>
          k.id === currentKey.id ? { ...k, status: 'revoked' } : k
        )
      }));

      console.log(`✅ Key ${currentKey.id} revoked successfully`);
      Alert.alert('Success', 'Key has been revoked successfully.');
      setShowRevokeModal(false);
      setCurrentKey(null);
    } catch (error: any) {
      console.error('Failed to revoke key:', error);
      Alert.alert('Error', 'Failed to revoke key. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  const submitReport = () => {
    setShowReportModal(false);
    setCurrentKey(null);
    setReportText('');
  };

  const cleanSenderName = (name: string | undefined): string => {
    if (!name) return 'Unknown';
    return name.startsWith('@') ? name.substring(1) : name;
  };

  const renderKeyCard = (key: UIKeyData) => {
    const isPopupOpen = activePopup === key.id;
    const isDimmed = isPopupOpen || key.status !== 'active';

    const getCardStyle = () =>
      isDimmed ? [styles.card, styles.inactiveCard] : styles.card;

    const getPillStyle = () =>
      isDimmed ? [styles.senderPill, styles.inactivePill] : styles.senderPill;

    const getTitleStyle = () =>
      isDimmed ? [styles.cardTitle, styles.inactiveText] : styles.cardTitle;

    const getStatusTextStyle = () =>
      isDimmed ? [styles.statusText, styles.inactiveStatusText] : styles.statusText;

    const userIconColor = isDimmed ? '#9ca3af' : '#374151';
    const statusDotStyle = [
      styles.statusDot,
      key.isNew && !isDimmed && styles.newStatusDot,
      (key.status === 'viewed_out' || key.status === 'revoked' || isDimmed) && styles.inactiveStatusDot,
    ];

    return (
      <TouchableOpacity
        key={key.id}
        style={getCardStyle()}
        onPress={() => handleKeyAction(key)}
        activeOpacity={0.98}
      >
        {/* Floating sender pill */}
        <View style={getPillStyle()}>
          <User size={14} color={userIconColor} />
          <Text style={styles.pillText} numberOfLines={1}>
            {activeTab === 'received'
              ? `From ${cleanSenderName(key.from)}`
              : `To ${cleanSenderName(key.sharedWith)}`}
          </Text>
        </View>

        {/* Three Dots Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            setActivePopup(isPopupOpen ? null : key.id);
          }}
        >
          <MoreHorizontal size={20} color="#6b7280" />
        </TouchableOpacity>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={getTitleStyle()}>{key.title}</Text>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.statusRow}>
              <View style={statusDotStyle as any} />
              <Text style={getStatusTextStyle()}>
                {key.isNew && key.status === 'active'
                  ? 'This is a new key'
                  : key.status === 'active'
                  ? 'This key is active'
                  : key.status === 'viewed_out'
                  ? 'Views were exhausted'
                  : 'This key was revoked'
                }
              </Text>
            </View>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.metadataPill}>
              <Eye size={14} color="#6b7280" />
              <Text style={styles.metadataText}>{key.views}</Text>
            </View>
            <View style={styles.metadataPill}>
              <Calendar size={14} color="#6b7280" />
              <Text style={styles.metadataText}>
                {formatDateDisplay(activeTab === 'received' ? key.receivedOn : key.sentOn)}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        {key.status === 'active' && (
          <TouchableOpacity
            style={[
              styles.arrowButton,
              isDimmed && styles.arrowButtonDimmed
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleKeyAction(key);
            }}
          >
            <ChevronRight size={20} color={isDimmed ? '#9ca3af' : '#374151'} />
          </TouchableOpacity>
        )}

        {/* In-card centered popup */}
        {isPopupOpen && (
          <Pressable
            style={styles.cardPopupOverlay}
            onPress={(e) => {
              e.stopPropagation();
              setActivePopup(null);
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.cardPopupMenu}
            >
              {activeTab === 'sent' && key.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={styles.popupMenuItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRevoke(key);
                    }}
                  >
                    <Ban size={20} color="#6b7280" />
                    <Text style={styles.popupMenuText}>Revoke</Text>
                  </TouchableOpacity>
                  <View style={styles.popupDivider} />
                </>
              )}

              <TouchableOpacity
                style={styles.popupMenuItem}
                onPress={(e) => {
                  e.stopPropagation();
                  setActivePopup(null);
                  handleDelete(key);
                }}
              >
                <Trash2 size={20} color="#6b7280" />
                <Text style={styles.popupMenuText}>Delete</Text>
              </TouchableOpacity>

              {activeTab === 'received' && (
                <>
                  <View style={styles.popupDivider} />
                  <TouchableOpacity
                    style={styles.popupMenuItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActivePopup(null);
                      handleReport(key);
                    }}
                  >
                    <AlertTriangle size={20} color="#6b7280" />
                    <Text style={styles.popupMenuText}>Report</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && allKeys.sent.length === 0 && allKeys.received.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Dropdown */}
              <View style={styles.dropdownSection}>
                <View style={styles.dropdownButton}>
                  <Text style={styles.headerTitle}>
                    {activeTab === 'received' ? 'Received Keys' : 'Sent Keys'}
                  </Text>
                  <ChevronDown size={20} color="#9ca3af" />
                </View>
              </View>

              {/* Notification bell icon  */}
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

  // Main render
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Dropdown Section */}
            <View style={styles.dropdownSection}>
              <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                style={styles.dropdownButton}
                activeOpacity={1}
              >
                <Text style={styles.headerTitle}>
                  {activeTab === 'received' ? 'Received Keys' : 'Sent Keys'}
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
                      Received Keys
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
                      Sent Keys
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Notification bell icon */}
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
            data={displayKeys}
            keyExtractor={(item) => `key-${item.id}-${item.status}`}
            ListHeaderComponent={() => (
              <View style={styles.filterHeaderRow}>
                <Text style={styles.filterHeaderText}>
                  {activeFilters.has('all')
                    ? `All Keys (${displayKeys.length})`
                    : activeFilters.has('active')
                    ? `Active Keys (${displayKeys.length})`
                    : activeFilters.has('new')
                    ? `New Keys (${displayKeys.length})`
                    : `Inactive Keys (${displayKeys.length})`
                  }
                </Text>

                {/* Filter icon */}
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
                    ? `No ${activeTab} keys found`
                    : activeFilters.has('active')
                    ? `No active ${activeTab} keys found`
                    : activeFilters.has('new')
                    ? `No new ${activeTab} keys found`
                    : `No inactive ${activeTab} keys found`
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilters.has('all') || activeFilters.has('active')
                    ? activeTab === 'received'
                      ? 'Keys shared with you will appear here'
                      : 'Keys you share will appear here'
                    : 'Try adjusting your filter selection'
                  }
                </Text>
              </View>
            )}
            renderItem={({ item }) => renderKeyCard(item)}
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
            {/* Background catcher */}
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowFilterModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            />
            {/* Popup content */}
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Keys</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterOptions}>
                {/* All Keys */}
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
                        ]}>All Keys</Text>
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
                            {activeKeys.length + inactiveKeys.length + revokedKeys.length}
                          </Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* New Keys */}
                {newKeys.length > 0 && (() => {
                  const selected = activeFilters.has('new');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('new')}
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
                        ]}>New Keys</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{newKeys.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Active Keys */}
                {(() => {
                  const selected = activeFilters.has('active');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('active')}
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
                        ]}>Active Keys</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{activeKeys.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Inactive Keys */}
                {inactiveKeys.length > 0 && (() => {
                  const selected = activeFilters.has('inactive');
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selected && styles.filterOptionActive
                      ]}
                      onPress={() => toggleFilter('inactive')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.filterDot,
                          { backgroundColor: selected ? '#FFFFFF' : '#9ca3af' }
                        ]} />
                        <Text style={[
                          styles.filterOptionText,
                          selected && { color: '#ffffff' }
                        ]}>Inactive Keys</Text>
                      </View>
                      <View style={styles.filterOptionRight}>
                        <View style={[
                          styles.filterCountCircle,
                          selected && { backgroundColor: 'rgba(255,255,255,0.2)' }
                        ]}>
                          <Text style={[
                            styles.filterCount,
                            selected && { color: '#ffffff' }
                          ]}>{inactiveKeys.length}</Text>
                        </View>
                        {selected && <Check size={16} color="#ffffff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })()}
              </View>

              {/* Clear All Filters */}
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
                Report key: "{currentKey?.title}"
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

        {/* Revoke Confirmation Modal */}
        <Modal visible={showRevokeModal} transparent animationType="fade">
          <View style={styles.revokeModalOverlay}>
            <View style={styles.revokeModalContent}>
              <View style={styles.revokeModalHeader}>
                <View style={styles.revokeModalIcon}>
                  <Ban size={20} color="#111827" />
                </View>
                <Text style={styles.revokeModalTitle}>Revoke Key?</Text>
              </View>

              <Text style={styles.revokeModalMessage}>
                Are you sure you want to revoke this key? The recipient will no longer be able to view your information, and this action cannot be undone.
              </Text>

              <View style={styles.revokeModalButtons}>
                <TouchableOpacity
                  style={[styles.revokeModalButton, styles.revokeModalConfirmButton]}
                  onPress={confirmRevoke}
                  disabled={isRevoking}
                  activeOpacity={0.9}
                >
                  {isRevoking ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.revokeModalConfirmText}>Revoke Key</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.revokeModalButton, styles.revokeModalCancelButton]}
                  onPress={() => setShowRevokeModal(false)}
                  disabled={isRevoking}
                  activeOpacity={0.9}
                >
                  <Text style={styles.revokeModalCancelText}>Cancel</Text>
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

  // Card
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
  // Gray state
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
  newStatusDot: {
    backgroundColor: '#16a34a',
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
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

  cardPopupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPopupMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  popupMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  popupDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
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
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
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
  modalDeleteButton: {
    backgroundColor: '#ef4444',
  },
  modalDeleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
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
    top: 10,
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

  revokeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  revokeModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  revokeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  revokeModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revokeModalTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  revokeModalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  revokeModalButtons: {
    gap: 12,
  },
  revokeModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  revokeModalConfirmButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  revokeModalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
  },
  revokeModalCancelButton: {
    backgroundColor: '#e5e7eb',
    borderColor: '#e5e7eb',
  },
  revokeModalCancelText: {
    fontSize: 16,
    color: '#111827',
  },
});