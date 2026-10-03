import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Task, TaskStatus, TaskPriority } from '../models/Task';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (task: Task) => void;
}

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH:
      return '#FF6B6B';
    case TaskPriority.MEDIUM:
      return '#FFB347';
    case TaskPriority.LOW:
      return '#77DD77';
    default:
      return '#B0BEC5';
  }
};

const getPriorityLabel = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'Cao';
    case TaskPriority.MEDIUM:
      return 'Trung bình';
    case TaskPriority.LOW:
      return 'Thấp';
    default:
      return priority;
  }
};

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return '⏳ Chờ xử lý';
    case TaskStatus.IN_PROGRESS:
      return '🔄 Đang thực hiện';
    case TaskStatus.COMPLETED:
      return '✅ Hoàn thành';
    case TaskStatus.CANCELLED:
      return '❌ Đã hủy';
    default:
      return status;
  }
};

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return '#FFF3E0';
    case TaskStatus.IN_PROGRESS:
      return '#E3F2FD';
    case TaskStatus.COMPLETED:
      return '#E8F5E9';
    case TaskStatus.CANCELLED:
      return '#FFEBEE';
    default:
      return '#F5F5F5';
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export default function TaskCard({
  task,
  onPress,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa công việc "${task.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => task.id && onDelete(task.id),
        },
      ]
    );
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isCancelled = task.status === TaskStatus.CANCELLED;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: getPriorityColor(task.priority) },
        (isCompleted || isCancelled) && styles.cardDimmed,
      ]}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              isCompleted && styles.checkboxChecked,
            ]}
            onPress={() => onToggleStatus(task)}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(task.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
        </View>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          />
          <Text style={styles.metaText}>{getPriorityLabel(task.priority)}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>📅 {formatDate(task.dueDate)}</Text>
        </View>
      </View>

      <View style={styles.categoryRow}>
        <Text style={styles.categoryBadge}>📂 {task.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDimmed: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    marginLeft: 34,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 6,
  },
  categoryRow: {
    marginTop: 8,
  },
  categoryBadge: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
});
