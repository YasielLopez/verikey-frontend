import { useFocusEffect } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';
import { KeysAPI, RequestsAPI } from '@/services/api';

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
  size = 20,
  color = '#8b8b8b',
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
  size = 20,
  color = '#8b8b8b',
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
        top: -4,
        right: -4,
        backgroundColor: '#000000',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
};

const TabButton = ({
  children,
  focused,
}: React.PropsWithChildren<{ focused: boolean }>) => (
  <View style={{ 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    marginTop: 26,
  }}>
    <View
      style={{
        width: 46,
        height: 46,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? '#c2ff6b' : 'transparent',
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

  const ACTIVE_COLOR = '#1a1a1a';
  const INACTIVE_COLOR = '#8b8b8b';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,

        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? (50 + bottom) : 50,  
          paddingBottom: Platform.OS === 'ios' ? bottom : 0,
          paddingHorizontal: 35,
          flexDirection: 'row',
          alignItems: 'flex-start', 
          justifyContent: 'space-between',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },

        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start', 
          paddingHorizontal: 0,
        },

        tabBarIconStyle: {
          margin: 0,
          padding: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keys',
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused}>
              <SafeTabIcon
                IconComponent={KeyIcon} 
                fallbackName="Key"
                size={26}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <NotificationBubble count={newKeysCount} />
            </TabButton>
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused}>
              <SafeTabIcon
                IconComponent={MailIcon}
                fallbackName="Mail"
                size={26}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <NotificationBubble count={newRequestsCount} />
            </TabButton>
          ),
        }}
      />

      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused}>
              <SafeTabIcon
                IconComponent={SendIcon}
                fallbackName="Send"
                size={26}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            </TabButton>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused}>
              <SafeTabIcon
                IconComponent={UserIcon}
                fallbackName="User"
                size={26}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            </TabButton>
          ),
        }}
      />
    </Tabs>
  );
}