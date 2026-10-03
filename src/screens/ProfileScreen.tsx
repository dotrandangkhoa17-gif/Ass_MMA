import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <Text style={styles.title}>Cá nhân (Profile)</Text>
        <Text style={styles.subtitle}>Thông tin sinh viên & ứng dụng</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>Sinh viên thực hiện</Text>
        <Text style={styles.role}>Bài thi thực hành 1 - MMA</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Môn học:</Text>
            <Text style={styles.infoValue}>Phát triển Ứng dụng Di động</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Công nghệ:</Text>
            <Text style={styles.infoValue}>React Native (Expo) & Firebase</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database:</Text>
            <Text style={styles.infoValue}>Cloud Firestore (Test Mode)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Repository:</Text>
            <Text style={[styles.infoValue, { color: '#6366F1' }]}>GitHub (Ass_MMA)</Text>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  avatarText: {
    fontSize: 48,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  role: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
