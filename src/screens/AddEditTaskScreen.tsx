import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Task,
  TaskStatus,
  TaskPriority,
  DEFAULT_CATEGORIES,
  createDefaultTask,
} from '../models/Task';
import { addTask, updateTask } from '../services/taskService';

interface AddEditScreenProps {
  task?: Task; // If provided, we are editing
  onGoBack: () => void;
}

export default function AddEditTaskScreen({
  task,
  onGoBack,
}: AddEditScreenProps) {
  const isEditing = !!task;
  const [formData, setFormData] = useState<Omit<Task, 'id'>>(
    task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }
      : createDefaultTask()
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && task?.id) {
        await updateTask(task.id, formData);
        Alert.alert('Thành công', 'Đã cập nhật công việc!', [
          { text: 'OK', onPress: onGoBack },
        ]);
      } else {
        await addTask(formData);
        Alert.alert('Thành công', 'Đã thêm công việc mới!', [
          { text: 'OK', onPress: onGoBack },
        ]);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Lỗi', 'Không thể lưu công việc. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateForDisplay = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const priorities: { key: TaskPriority; label: string; color: string }[] = [
    { key: TaskPriority.LOW, label: 'Thấp', color: '#77DD77' },
    { key: TaskPriority.MEDIUM, label: 'Trung bình', color: '#FFB347' },
    { key: TaskPriority.HIGH, label: 'Cao', color: '#FF6B6B' },
  ];

  const statuses: { key: TaskStatus; label: string; emoji: string }[] = [
    { key: TaskStatus.PENDING, label: 'Chờ xử lý', emoji: '⏳' },
    { key: TaskStatus.IN_PROGRESS, label: 'Đang làm', emoji: '🔄' },
    { key: TaskStatus.COMPLETED, label: 'Hoàn thành', emoji: '✅' },
    { key: TaskStatus.CANCELLED, label: 'Đã hủy', emoji: '❌' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề công việc..."
              placeholderTextColor="#94A3B8"
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, title: text }))
              }
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết công việc..."
              placeholderTextColor="#94A3B8"
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mức độ ưu tiên</Text>
            <View style={styles.optionRow}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.optionButton,
                    formData.priority === p.key && {
                      backgroundColor: p.color,
                      borderColor: p.color,
                    },
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, priority: p.key }))
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.priority === p.key && styles.optionTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status (only for editing) */}
          {isEditing && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.optionGrid}>
                {statuses.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.statusOption,
                      formData.status === s.key && styles.statusOptionActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, status: s.key }))
                    }
                  >
                    <Text style={styles.statusEmoji}>{s.emoji}</Text>
                    <Text
                      style={[
                        styles.statusOptionText,
                        formData.status === s.key &&
                          styles.statusOptionTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.optionRow}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    formData.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, category: cat }))
                  }
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      formData.category === cat &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date (simplified - just show current date) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày hết hạn</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                📅 {formatDateForDisplay(formData.dueDate)}
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Đang lưu...'
                : isEditing
                ? '💾 Cập nhật công việc'
                : '➕ Thêm công việc'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
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
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSpacer: {
    width: 80,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  statusOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
