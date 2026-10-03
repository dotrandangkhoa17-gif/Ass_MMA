import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Task, TaskStatus, TaskPriority } from '../models/Task';
import { deleteTask, updateTask } from '../services/taskService';

interface TaskDetailScreenProps {
  task: Task;
  onGoBack: () => void;
  onNavigateToEdit: (task: Task) => void;
}

const getPriorityInfo = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return { label: 'Cao', color: '#FF6B6B', bgColor: '#FFF0F0' };
    case TaskPriority.MEDIUM:
      return { label: 'Trung bình', color: '#FFB347', bgColor: '#FFF8F0' };
    case TaskPriority.LOW:
      return { label: 'Thấp', color: '#77DD77', bgColor: '#F0FFF0' };
    default:
      return { label: priority, color: '#B0BEC5', bgColor: '#F5F5F5' };
  }
};

const getStatusInfo = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING:
      return { label: 'Chờ xử lý', emoji: '⏳', color: '#F59E0B', bgColor: '#FFF3E0' };
    case TaskStatus.IN_PROGRESS:
      return { label: 'Đang thực hiện', emoji: '🔄', color: '#3B82F6', bgColor: '#E3F2FD' };
    case TaskStatus.COMPLETED:
      return { label: 'Hoàn thành', emoji: '✅', color: '#10B981', bgColor: '#E8F5E9' };
    case TaskStatus.CANCELLED:
      return { label: 'Đã hủy', emoji: '❌', color: '#EF4444', bgColor: '#FFEBEE' };
    default:
      return { label: status, emoji: '📋', color: '#94A3B8', bgColor: '#F5F5F5' };
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function TaskDetailScreen({
  task,
  onGoBack,
  onNavigateToEdit,
}: TaskDetailScreenProps) {
  const priorityInfo = getPriorityInfo(task.priority);
  const statusInfo = getStatusInfo(task.status);

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa công việc "${task.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              if (task.id) {
                await deleteTask(task.id);
                onGoBack();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Lỗi', 'Không thể xóa công việc.');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async () => {
    if (!task.id) return;
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;
    try {
      await updateTask(task.id, { status: newStatus });
      onGoBack();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => onNavigateToEdit(task)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>✏️ Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>🗑 Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: statusInfo.bgColor },
          ]}
        >
          <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Description */}
        {task.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Mô tả</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        ) : null}

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          {/* Priority */}
          <View style={[styles.infoCard, { backgroundColor: priorityInfo.bgColor }]}>
            <Text style={styles.infoCardIcon}>🎯</Text>
            <Text style={styles.infoCardLabel}>Ưu tiên</Text>
            <Text style={[styles.infoCardValue, { color: priorityInfo.color }]}>
              {priorityInfo.label}
            </Text>
          </View>

          {/* Category */}
          <View style={[styles.infoCard, { backgroundColor: '#F0F4FF' }]}>
            <Text style={styles.infoCardIcon}>📂</Text>
            <Text style={styles.infoCardLabel}>Danh mục</Text>
            <Text style={[styles.infoCardValue, { color: '#6366F1' }]}>
              {task.category}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Thời gian</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Hạn hoàn thành:</Text>
            <Text style={styles.dateValue}>{formatDate(task.dueDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Ngày tạo:</Text>
            <Text style={styles.dateValue}>{formatDateTime(task.createdAt)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.dateValue}>{formatDateTime(task.updatedAt)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            task.status === TaskStatus.COMPLETED
              ? styles.reopenButton
              : styles.completeButton,
          ]}
          onPress={handleToggleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {task.status === TaskStatus.COMPLETED
              ? '🔄 Mở lại công việc'
              : '✅ Đánh dấu hoàn thành'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusEmoji: {
    fontSize: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    lineHeight: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  infoCardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dateValue: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  reopenButton: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
