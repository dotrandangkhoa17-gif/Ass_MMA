import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Team } from '../models/Team';
import { UserProfile } from '../models/User';
import {
  subscribeUserTeams,
  createTeam,
  joinTeamByCode,
} from '../services/teamService';

interface TeamsScreenProps {
  onNavigateToTeamDetail: (team: Team) => void;
}

export default function TeamsScreen({ onNavigateToTeamDetail }: TeamsScreenProps) {
  const { user, userProfile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lắng nghe danh sách nhóm của user thời gian thực
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeUserTeams(
      user.uid,
      (fetchedTeams) => {
        setTeams(fetchedTeams);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching teams:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Listener will automatically update
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đội nhóm.');
      return;
    }
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tạo nhóm.');
      return;
    }

    const currentProfile: UserProfile = userProfile || {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Người dùng',
      email: user.email || '',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const created = await createTeam(newTeamName, newTeamDesc, currentProfile);
      setCreateModalVisible(false);
      setNewTeamName('');
      setNewTeamDesc('');
      Alert.alert(
        'Tạo nhóm thành công!',
        `Nhóm "${created.name}" đã được tạo.\nMã mời tham gia nhóm của bạn là: ${created.code}`
      );
    } catch (error: any) {
      console.error('Error creating team:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async () => {
    const formattedCode = joinCode.trim().toUpperCase();
    if (!formattedCode) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã nhóm.');
      return;
    }
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tham gia nhóm.');
      return;
    }

    const currentProfile: UserProfile = userProfile || {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Người dùng',
      email: user.email || '',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const joinedTeam = await joinTeamByCode(formattedCode, currentProfile);
      setJoinModalVisible(false);
      setJoinCode('');
      Alert.alert('Thành công', `Bạn đã tham gia nhóm "${joinedTeam.name}"!`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      Alert.alert('Không thể tham gia', error.message || 'Mã nhóm không hợp lệ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareCode = async (team: Team) => {
    try {
      await Share.share({
        message: `Tham gia đội nhóm "${team.name}" trên TaskMaster Pro với mã code: ${team.code}`,
      });
    } catch (err) {
      console.debug('Share cancelled or error:', err);
    }
  };

  const renderTeamItem = ({ item }: { item: Team }) => {
    const isOwner = user?.uid === item.ownerId;

    return (
      <TouchableOpacity
        style={styles.teamCard}
        onPress={() => onNavigateToTeamDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.teamIconBox}>
            <Text style={styles.teamEmoji}>👥</Text>
          </View>
          <View style={styles.teamMainInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.teamName} numberOfLines={1}>
                {item.name}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Trưởng nhóm</Text>
                </View>
              )}
            </View>
            <Text style={styles.teamDesc} numberOfLines={2}>
              {item.description || 'Không có mô tả'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <TouchableOpacity
            style={styles.codePill}
            onPress={() => handleShareCode(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.codePillPrefix}>Mã:</Text>
            <Text style={styles.codePillValue}>{item.code}</Text>
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>

          <View style={styles.memberPill}>
            <Text style={styles.memberIcon}>👤</Text>
            <Text style={styles.memberCountText}>
              {item.memberCount || 1} thành viên
            </Text>
          </View>

          <View style={styles.arrowBox}>
            <Text style={styles.arrowIcon}>➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Quản lý công tác & phân công</Text>
          <Text style={styles.headerTitle}>Đội nhóm ({teams.length})</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.headerButtonsRow}>
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => setJoinModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>🔗 Nhập mã</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createBtnText}>+ Tạo nhóm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải danh sách đội nhóm...</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id || item.code}
          renderItem={renderTeamItem}
          contentContainerStyle={
            teams.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>👥</Text>
              </View>
              <Text style={styles.emptyTitle}>Chưa tham gia đội nhóm nào</Text>
              <Text style={styles.emptyDesc}>
                Tạo nhóm mới hoặc nhập mã mời để cùng đồng nghiệp phân chia công việc và chat thời gian thực!
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.emptyPrimaryBtn}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={styles.emptyPrimaryBtnText}>+ Tạo nhóm mới ngay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emptySecondaryBtn}
                  onPress={() => setJoinModalVisible(true)}
                >
                  <Text style={styles.emptySecondaryBtnText}>Nhập mã nhóm</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal: Tạo nhóm mới */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Tạo đội nhóm mới</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Nhóm giúp bạn gán công việc cho từng thành viên và trò chuyện trực tiếp.
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Tên đội nhóm *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: Nhóm Phát Triển Mobile, Marketing..."
                placeholderTextColor="#94A3B8"
                value={newTeamName}
                onChangeText={setNewTeamName}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Mô tả ngắn</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Mô tả mục tiêu của nhóm..."
                placeholderTextColor="#94A3B8"
                value={newTeamDesc}
                onChangeText={setNewTeamDesc}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreateTeam}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Tạo nhóm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Tham gia bằng mã */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔗 Tham gia đội nhóm</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Nhập mã nhóm gồm 6 ký tự được người tạo nhóm chia sẻ với bạn.
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Mã nhóm (Team Code) *</Text>
              <TextInput
                style={[styles.modalInput, styles.codeInput]}
                placeholder="VD: DEV92X"
                placeholderTextColor="#94A3B8"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                onPress={handleJoinTeam}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Tham gia</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#F8FAFC',
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
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  joinBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '700',
  },
  createBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  teamIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  teamEmoji: {
    fontSize: 24,
  },
  teamMainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  teamDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 8,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  codePillPrefix: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  codePillValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareIcon: {
    fontSize: 11,
    marginLeft: 2,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  memberIcon: {
    fontSize: 11,
  },
  memberCountText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  arrowBox: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActions: {
    width: '100%',
    gap: 10,
  },
  emptyPrimaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySecondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptySecondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
    lineHeight: 18,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
