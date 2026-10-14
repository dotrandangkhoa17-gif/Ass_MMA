import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { subscribeUserTeams } from '../services/teamService';
import { subscribeTasksForUser } from '../services/taskService';
import ConfirmModal from '../components/ConfirmModal';

const PRESET_AVATARS = ['👨‍💻', '👩‍💻', '🚀', '⚡', '🦊', '🐼', '🦁', '⭐'];

export default function ProfileScreen() {
  const { user, userProfile, logout, updateAvatar } = useAuth();
  const [teamCount, setTeamCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let unsubTasks: (() => void) | undefined;
    const unsubTeams = subscribeUserTeams(user.uid, (teams) => {
      setTeamCount(teams.length);
      const teamIds = teams.map((t) => t.id!).filter(Boolean);

      if (unsubTasks) unsubTasks();
      unsubTasks = subscribeTasksForUser(user.uid, teamIds, (tasks) => {
        setTaskCount(tasks.length);
      });
    });

    return () => {
      unsubTeams();
      if (unsubTasks) unsubTasks();
    };
  }, [user]);

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Yêu cầu quyền truy cập',
          'Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện.'
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!pickerResult.canceled && pickerResult.assets[0].uri) {
        await updateAvatar(pickerResult.assets[0].uri);
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới!');
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSelectPresetAvatar = (emoji: string) => {
    updateAvatar(emoji);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const isImageUri =
    userProfile?.avatarUrl &&
    (userProfile.avatarUrl.startsWith('http') ||
      userProfile.avatarUrl.startsWith('file') ||
      userProfile.avatarUrl.startsWith('content'));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Tài khoản cá nhân</Text>
          <Text style={styles.headerTitle}>Hồ sơ người dùng</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {isImageUri ? (
              <Image
                source={{ uri: userProfile!.avatarUrl! }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>
                  {userProfile?.avatarUrl || '👤'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>
            {userProfile?.name || user?.displayName || 'Người dùng'}
          </Text>
          <Text style={styles.userEmail}>
            {userProfile?.email || user?.email || ''}
          </Text>

          {/* Quick Avatar Picker */}
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>Chọn avatar nhanh:</Text>
            <View style={styles.presetRow}>
              {PRESET_AVATARS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.presetBtn,
                    userProfile?.avatarUrl === emoji && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectPresetAvatar(emoji)}
                >
                  <Text style={styles.presetEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* User Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{teamCount}</Text>
              <Text style={styles.statLabel}>Đội nhóm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{taskCount}</Text>
              <Text style={styles.statLabel}>Công việc</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>Online</Text>
              <Text style={styles.statLabel}>Trạng thái</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Thông tin ứng dụng</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bài thi:</Text>
            <Text style={styles.infoValue}>Bài thi thực hành 2 (MMA)</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tính năng mới:</Text>
            <Text style={styles.infoValue}>Auth, Teams & Real-Time Chat</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend / Database:</Text>
            <Text style={styles.infoValue}>Firebase Auth & Cloud Firestore</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Security Rules:</Text>
            <Text style={[styles.infoValue, { color: '#10B981' }]}>
              Protected (request.auth != null)
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modern Confirmation Modal for Logout */}
      <ConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        title="Đăng xuất tài khoản?"
        message="Bạn có chắc chắn muốn đăng xuất không? Bạn sẽ cần đăng nhập lại để tiếp tục quản lý công việc và chat đội nhóm."
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        type="danger"
        icon="🚪"
        loading={loggingOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  avatarEmoji: {
    fontSize: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 13,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  presetSection: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  presetTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  presetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
  },
  presetEmoji: {
    fontSize: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
