import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabType = 'home' | 'teams' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '📋' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
