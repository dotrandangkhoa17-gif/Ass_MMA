import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <Text style={styles.title}>Đội nhóm (Teams)</Text>
        <Text style={styles.subtitle}>Quản lý phân công & thành viên</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>👥</Text>
        </View>
        <Text style={styles.featureTitle}>Tính năng Đội nhóm (Coming Soon)</Text>
        <Text style={styles.featureDescription}>
          Chức năng phân công công việc cho thành viên (`assigneeId`) và quản lý đội nhóm (`teamId`) sẽ được triển khai ở Bài thi thực hành 2.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚀 Sẽ ra mắt ở Bài thi 2</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
