import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Team, TeamMember } from '../models/Team';
import { Task, TaskStatus } from '../models/Task';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTeamMembers,
  leaveTeam,
  deleteTeam,
} from '../services/teamService';
import {
  subscribeTeamTasks,
  deleteTask,
  updateTask,
} from '../services/taskService';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

interface TeamDetailScreenProps {
  team: Team;
  onGoBack: () => void;
  onNavigateToChat: (team: Team) => void;
  onNavigateToAddTask: (team: Team) => void;
  onNavigateToEditTask: (task: Task) => void;
  onNavigateToTaskDetail: (task: Task) => void;
}

export default function TeamDetailScreen({
  team,
  onGoBack,
  onNavigateToChat,
  onNavigateToAddTask,
  onNavigateToEditTask,
  onNavigateToTaskDetail,
}: TeamDetailScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.uid === team.ownerId;

  // Lắng nghe thành viên & công việc của team thời gian thực
  useEffect(() => {
    if (!team.id) return;

    setLoading(true);
    const unsubMembers = subscribeTeamMembers(team.id, (fetchedMembers) => {
      setMembers(fetchedMembers);
    });

    const unsubTasks = subscribeTeamTasks(team.id, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => {
      unsubMembers();
      unsubTasks();
    };
  }, [team.id]);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Tham gia đội nhóm "${team.name}" trên TaskMaster Pro với mã code: ${team.code}`,
      });
    } catch (err) {
      console.debug('Share cancelled or error:', err);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    if (!task.id) return;
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [teamModalLoading, setTeamModalLoading] = useState(false);

  const handleLeaveOrDelete = () => {
    setTeamModalVisible(true);
  };

  const handleConfirmLeaveOrDelete = async () => {
    if (!team.id || !user) return;
    setTeamModalLoading(true);

    try {
      if (isOwner) {
        await deleteTeam(team.id, user.uid);
      } else {
        await leaveTeam(team.id, user.uid);
      }
      setTeamModalVisible(false);
      onGoBack();
    } catch (err: any) {
      console.error('Error leaving/deleting team:', err);
    } finally {
      setTeamModalLoading(false);
    }
  };

  const renderMemberItem = ({ item }: { item: TeamMember }) => {
    const isMemberOwner = item.role === 'owner';
    const isCurrentUser = item.userId === user?.uid;

    return (
      <View style={styles.memberCard}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarEmoji}>
            {item.userAvatar || '👤'}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.userName}</Text>
            {isCurrentUser && <Text style={styles.youBadge}>(Bạn)</Text>}
          </View>
          <Text style={styles.memberEmail}>{item.userEmail}</Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            isMemberOwner ? styles.roleOwner : styles.roleMember,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              isMemberOwner ? styles.roleTextOwner : styles.roleTextMember,
            ]}
          >
            {isMemberOwner ? 'Trưởng nhóm' : 'Thành viên'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {team.name}
        </Text>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeaveOrDelete}
        >
          <Text style={styles.leaveBtnText}>{isOwner ? '🗑️' : '🚪'}</Text>
        </TouchableOpacity>
      </View>

      {/* Team Header Summary Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerMainRow}>
          <View style={styles.headerIconBox}>
            <Text style={styles.headerEmoji}>👥</Text>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.teamTitle}>{team.name}</Text>
            <Text style={styles.teamDescription}>
              {team.description || 'Chưa có mô tả cho nhóm này'}
            </Text>
          </View>
        </View>

        {/* Code Bar & Chat Button */}
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={styles.codeButton}
            onPress={handleShareCode}
            activeOpacity={0.7}
          >
            <Text style={styles.codeButtonLabel}>MÃ MỜI:</Text>
            <Text style={styles.codeButtonText}>{team.code}</Text>
            <Text style={styles.codeButtonIcon}>📋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => onNavigateToChat(team)}
            activeOpacity={0.8}
          >
            <Text style={styles.chatButtonIcon}>💬</Text>
            <Text style={styles.chatButtonText}>Chat Nhóm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tasks' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'tasks' && styles.tabBtnTextActive,
            ]}
          >
            📋 Công việc ({tasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'members' && styles.tabBtnTextActive,
            ]}
          >
            👥 Thành viên ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : activeTab === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={onNavigateToTaskDetail}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleTaskStatus}
              onEdit={onNavigateToEditTask}
            />
          )}
          contentContainerStyle={
            tasks.length === 0 ? styles.emptyTasksList : styles.tasksList
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState message="Chưa có công việc nào trong nhóm này." />
              <TouchableOpacity
                style={styles.addFirstTaskBtn}
                onPress={() => onNavigateToAddTask(team)}
              >
                <Text style={styles.addFirstTaskText}>+ Giao việc đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id || item.userId}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.membersList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB to Add Task for Team */}
      {activeTab === 'tasks' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => onNavigateToAddTask(team)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Confirmation Modal for Leave / Delete Team */}
      <ConfirmModal
        visible={teamModalVisible}
        onClose={() => setTeamModalVisible(false)}
        onConfirm={handleConfirmLeaveOrDelete}
        title={isOwner ? 'Giải tán đội nhóm?' : 'Rời khỏi đội nhóm?'}
        message={
          isOwner
            ? `Bạn là Trưởng nhóm. Thao tác này sẽ giải tán nhóm "${team.name}", xóa toàn bộ thành viên và các tin nhắn trong nhóm.`
            : `Bạn có chắc muốn rời khỏi nhóm "${team.name}"? Bạn sẽ cần nhập lại mã mời để tham gia lại.`
        }
        confirmText={isOwner ? 'Xóa nhóm' : 'Rời nhóm'}
        cancelText="Ở lại"
        type="danger"
        icon={isOwner ? '🗑️' : '🚪'}
        loading={teamModalLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backArrow: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '300',
    marginTop: -2,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '70%',
  },
  leaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: {
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerEmoji: {
    fontSize: 26,
  },
  headerTextCol: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  teamDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  headerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  codeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  codeButtonLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  codeButtonText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeButtonIcon: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  chatButtonIcon: {
    fontSize: 14,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
  },
  tasksList: {
    paddingBottom: 90,
  },
  emptyTasksList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  addFirstTaskBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addFirstTaskText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  membersList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  youBadge: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleOwner: {
    backgroundColor: '#FEF3C7',
  },
  roleMember: {
    backgroundColor: '#F1F5F9',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleTextOwner: {
    color: '#B45309',
  },
  roleTextMember: {
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
