import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Task, TaskStatus } from '../models/Task';
import { deleteTask, updateTask, subscribeTasksForUser } from '../services/taskService';
import { subscribeUserTeams } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';

interface HomeScreenProps {
  onNavigateToAdd: () => void;
  onNavigateToEdit: (task: Task) => void;
  onNavigateToDetail: (task: Task) => void;
}

export default function HomeScreen({
  onNavigateToAdd,
  onNavigateToEdit,
  onNavigateToDetail,
}: HomeScreenProps) {
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine' | 'team'>('all');

  // Lắng nghe các team mà user tham gia, sau đó lắng nghe các task liên quan
  useEffect(() => {
    if (!user) return;

    let unsubTasks: (() => void) | undefined;

    const unsubTeams = subscribeUserTeams(
      user.uid,
      (teams) => {
        const teamIds = teams.map((t) => t.id!).filter(Boolean);

        if (unsubTasks) unsubTasks();

        unsubTasks = subscribeTasksForUser(
          user.uid,
          teamIds,
          (fetchedTasks) => {
            setTasks(fetchedTasks);
            setLoading(false);
            setRefreshing(false);
          },
          (error) => {
            console.error('Failed to load tasks:', error);
            setLoading(false);
            setRefreshing(false);
          }
        );
      },
      (err) => {
        console.error('Failed to listen to user teams:', err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubTeams();
      if (unsubTasks) unsubTasks();
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!task.id) return;
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle task status:', error);
    }
  };

  // Lọc theo scope (Tất cả / Của tôi / Nhóm) và status (all, pending, in_progress, completed)
  const filteredTasks = tasks.filter((t) => {
    // 1. Lọc theo scope
    if (scopeFilter === 'mine') {
      const isAssignedToMe = t.assigneeId === user?.uid;
      const isCreatedByMe = t.creatorId === user?.uid;
      if (!isAssignedToMe && !isCreatedByMe) return false;
    } else if (scopeFilter === 'team') {
      if (!t.teamId) return false;
    }

    // 2. Lọc theo trạng thái
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
  };

  const statusFilters: { key: 'all' | TaskStatus; label: string }[] = [
    { key: 'all', label: `Tất cả (${tasks.length})` },
    { key: TaskStatus.PENDING, label: `Chờ (${taskStats.pending})` },
    { key: TaskStatus.IN_PROGRESS, label: `Đang làm (${taskStats.inProgress})` },
    { key: TaskStatus.COMPLETED, label: `Xong (${taskStats.completed})` },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Đang tải công việc của bạn...</Text>
      </SafeAreaView>
    );
  }

  const displayName = userProfile?.name || user?.displayName || 'bạn';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Xin chào, {displayName}! 👋</Text>
          <Text style={styles.headerTitle}>Công việc của bạn</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{taskStats.total}</Text>
            <Text style={styles.statLabel}>Tổng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {taskStats.completed}
            </Text>
            <Text style={styles.statLabel}>Xong</Text>
          </View>
        </View>
      </View>

      {/* Scope Switcher Tabs (Tất cả / Của tôi / Nhóm) */}
      <View style={styles.scopeContainer}>
        <TouchableOpacity
          style={[styles.scopeBtn, scopeFilter === 'all' && styles.scopeBtnActive]}
          onPress={() => setScopeFilter('all')}
        >
          <Text
            style={[
              styles.scopeBtnText,
              scopeFilter === 'all' && styles.scopeBtnTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, scopeFilter === 'mine' && styles.scopeBtnActive]}
          onPress={() => setScopeFilter('mine')}
        >
          <Text
            style={[
              styles.scopeBtnText,
              scopeFilter === 'mine' && styles.scopeBtnTextActive,
            ]}
          >
            👤 Của tôi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, scopeFilter === 'team' && styles.scopeBtnActive]}
          onPress={() => setScopeFilter('team')}
        >
          <Text
            style={[
              styles.scopeBtnText,
              scopeFilter === 'team' && styles.scopeBtnTextActive,
            ]}
          >
            👥 Nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs by Status */}
      <View style={styles.filterContainer}>
        <FlatList
          data={statusFilters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                statusFilter === item.key && styles.filterTabActive,
              ]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  statusFilter === item.key && styles.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || ''}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={onNavigateToDetail}
            onDelete={handleDeleteTask}
            onToggleStatus={handleToggleStatus}
            onEdit={onNavigateToEdit}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            message={
              scopeFilter === 'team'
                ? 'Chưa có công việc nào thuộc đội nhóm.'
                : scopeFilter === 'mine'
                ? 'Bạn chưa có công việc cá nhân nào được giao.'
                : 'Chưa có công việc nào. Bấm nút + bên dưới để tạo mới!'
            }
          />
        }
        contentContainerStyle={
          filteredTasks.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateToAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94A3B8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  scopeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  scopeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scopeBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterContainer: {
    paddingBottom: 6,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 90,
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
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
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
