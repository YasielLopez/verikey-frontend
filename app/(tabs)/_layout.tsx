import { useFocusEffect } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';
import { KeysAPI, RequestsAPI } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

let KeyIcon: any, MailIcon: any, SendIcon: any, UserIcon: any;
try {
  const icons = require('@/components/icons');
  KeyIcon = icons.KeyIcon; 
  MailIcon = icons.MailIcon;
  SendIcon = icons.SendIcon;
  UserIcon = icons.UserIcon;
} catch {
}

const TabFallbackIcon = ({
  name,
  size = 26,
  color = '#B3B3B3',
}: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const map: Record<string, string> = {
    Key: '🔑',  
    Mail: '📧',
    Send: '📤',
    User: '👤',
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.7, color }}>{map[name] ?? '●'}</Text>
    </View>
  );
};

const SafeTabIcon = ({
  IconComponent,
  fallbackName,
  size = 26,
  color = '#B3B3B3',
}: {
  IconComponent?: React.ComponentType<{ size: number; color: string }>;
  fallbackName: string;
  size?: number;
  color?: string;
}) =>
  IconComponent ? (
    <IconComponent size={size} color={color} />
  ) : (
    <TabFallbackIcon name={fallbackName} size={size} color={color} />
  );

const useNotificationCounts = () => {
  const [newKeysCount, setNewKeysCount] = useState<number>(3);
  const [newRequestsCount, setNewRequestsCount] = useState<number>(2);

  const fetchCounts = useCallback(async () => {
    try {
      const keys = await KeysAPI.getAllKeys();
      const received = keys?.received_keys ?? keys?.received ?? [];
      setNewKeysCount(received.filter((k: any) => k.isNew || k.badgeText === 'NEW').length);

      const req = await RequestsAPI.getRequests();
      const rec = req?.received ?? [];
      setNewRequestsCount(rec.filter((r: any) => r.status === 'pending').length);
    } catch {
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCounts();
      const id = setInterval(fetchCounts, 30000);
      return () => clearInterval(id);
    }, [fetchCounts]),
  );

  return { newKeysCount, newRequestsCount };
};

const NotificationBubble = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
      }}
    >
      <Text style={{ color: '#1F2937', fontSize: 11, fontWeight: '700' }}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
};

const IconWrap = ({
  children,
  focused,
  activeBg,
}: React.PropsWithChildren<{ focused: boolean; activeBg: string }>) => (
  <View style={{ 
    alignItems: 'center', 
    justifyContent: 'center',
  }}>
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? activeBg : 'transparent',
        position: 'relative',
      }}
    >
      {children}
    </View>
  </View>
);

export default function TabLayout() {
  useColorScheme();
  const { bottom } = useSafeAreaInsets();
  const { newKeysCount, newRequestsCount } = useNotificationCounts();

  const ACTIVE_BG = '#C2FF6B';
  const BAR_BG = '#000';  
  const INACTIVE = '#B3B3B3';
  const ACTIVE_ICON = '#000';

  const TAB_BAR_WIDTH = 300;
  const TAB_BAR_HEIGHT = 64;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACTIVE_BG,
        tabBarInactiveTintColor: INACTIVE,

        tabBarStyle: {
          position: 'absolute',
          left: undefined,
          right: undefined,
          marginLeft: undefined,
          marginRight: undefined,
          marginHorizontal: undefined,
          alignSelf: undefined,
          
          bottom: Platform.OS === 'ios' ? (16 + bottom) : 16,
          width: TAB_BAR_WIDTH,
          height: TAB_BAR_HEIGHT,
          
          marginLeft: (SCREEN_WIDTH - TAB_BAR_WIDTH) / 2,
          
          backgroundColor: BAR_BG,
          borderRadius: TAB_BAR_HEIGHT / 2,
          borderTopWidth: 0,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          paddingHorizontal: 12,
          paddingVertical: 0,
        },

        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },

        tabBarIconStyle: {
          margin: 0,
          padding: 0,
          marginTop: 3,
          marginBottom: 0,
        },

        tabBarContainerStyle: undefined,
        safeAreaInsets: undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keys',
          tabBarIcon: ({ focused }) => (
            <IconWrap focused={focused} activeBg={ACTIVE_BG}>
              <SafeTabIcon
                IconComponent={KeyIcon} 
                fallbackName="Key"
                size={24}
                color={focused ? ACTIVE_ICON : INACTIVE}
              />
              <NotificationBubble count={newKeysCount} />
            </IconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ focused }) => (
            <IconWrap focused={focused} activeBg={ACTIVE_BG}>
              <SafeTabIcon
                IconComponent={MailIcon}
                fallbackName="Mail"
                size={26}
                color={focused ? ACTIVE_ICON : INACTIVE}
              />
              <NotificationBubble count={newRequestsCount} />
            </IconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ focused }) => (
            <IconWrap focused={focused} activeBg={ACTIVE_BG}>
              <SafeTabIcon
                IconComponent={SendIcon}
                fallbackName="Send"
                size={26}
                color={focused ? ACTIVE_ICON : INACTIVE}
              />
            </IconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <IconWrap focused={focused} activeBg={ACTIVE_BG}>
              <SafeTabIcon
                IconComponent={UserIcon}
                fallbackName="User"
                size={26}
                color={focused ? ACTIVE_ICON : INACTIVE}
              />
            </IconWrap>
          ),
        }}
      />
    </Tabs>
  );
}