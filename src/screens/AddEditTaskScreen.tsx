import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Task,
  TaskStatus,
  TaskPriority,
  DEFAULT_CATEGORIES,
  createDefaultTask,
} from '../models/Task';
import { Team, TeamMember } from '../models/Team';
import { addTask, updateTask } from '../services/taskService';
import { subscribeUserTeams, getTeamMembers } from '../services/teamService';
import { useAuth } from '../context/AuthContext';

interface AddEditScreenProps {
  task?: Task; // If provided, we are editing
  initialTeam?: Team; // If opened from a specific team
  onGoBack: () => void;
}

export default function AddEditTaskScreen({
  task,
  initialTeam,
  onGoBack,
}: AddEditScreenProps) {
  const { user, userProfile } = useAuth();
  const isEditing = !!task;

  const getDateYYYYMMDD = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState<Omit<Task, 'id'>>(() => {
    if (task) {
      return {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        teamId: task.teamId || null,
        teamName: task.teamName || null,
        assigneeId: task.assigneeId || null,
        assigneeName: task.assigneeName || null,
        assigneeAvatar: task.assigneeAvatar || null,
        creatorId: task.creatorId || user?.uid || null,
        creatorName: task.creatorName || userProfile?.name || null,
      };
    }
    const def = createDefaultTask();
    if (initialTeam) {
      def.teamId = initialTeam.id || null;
      def.teamName = initialTeam.name;
    }
    def.creatorId = user?.uid || null;
    def.creatorName = userProfile?.name || null;
    return def;
  });

  const [dateInputText, setDateInputText] = useState<string>(() =>
    getDateYYYYMMDD(formData.dueDate)
  );
  const [saving, setSaving] = useState(false);

  // Teams and Members states
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Lắng nghe danh sách nhóm của user
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserTeams(user.uid, (teams) => {
      setUserTeams(teams);
    });
    return () => unsub();
  }, [user]);

  // Khi chọn team khác, tải danh sách thành viên của team đó
  useEffect(() => {
    let isMounted = true;
    if (formData.teamId) {
      getTeamMembers(formData.teamId)
        .then((members) => {
          if (isMounted) setTeamMembers(members);
        })
        .catch((err) => console.error('Error fetching team members:', err));
    } else {
      setTeamMembers([]);
    }
    return () => {
      isMounted = false;
    };
  }, [formData.teamId]);

  const handleSelectTeam = (selectedTeam: Team | null) => {
    if (selectedTeam) {
      setFormData((prev) => ({
        ...prev,
        teamId: selectedTeam.id || null,
        teamName: selectedTeam.name,
        // Reset assignee nếu team thay đổi
        assigneeId: null,
        assigneeName: null,
        assigneeAvatar: null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        teamId: null,
        teamName: null,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatar: null,
      }));
    }
  };

  const handleSelectAssignee = (member: TeamMember | null) => {
    if (member) {
      setFormData((prev) => ({
        ...prev,
        assigneeId: member.userId,
        assigneeName: member.userName,
        assigneeAvatar: member.userAvatar || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatar: null,
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        creatorId: formData.creatorId || user?.uid || null,
        creatorName: formData.creatorName || userProfile?.name || null,
      };

      if (isEditing && task?.id) {
        await updateTask(task.id, dataToSave);
        Alert.alert('Thành công', 'Đã cập nhật công việc!', [
          { text: 'OK', onPress: onGoBack },
        ]);
      } else {
        await addTask(dataToSave);
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

  const getPresetDate = (daysFromNow: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };

  const datePresets = [
    { label: 'Hôm nay', date: getPresetDate(0) },
    { label: 'Ngày mai', date: getPresetDate(1) },
    { label: '3 ngày nữa', date: getPresetDate(3) },
    { label: '1 tuần nữa', date: getPresetDate(7) },
    { label: '2 tuần nữa', date: getPresetDate(14) },
  ];

  const handleSelectPreset = (date: Date) => {
    setFormData((prev) => ({ ...prev, dueDate: date.toISOString() }));
    setDateInputText(getDateYYYYMMDD(date.toISOString()));
  };

  const handleCustomDateChange = (text: string) => {
    setDateInputText(text);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
      const parsedDate = new Date(`${text.trim()}T23:59:59`);
      if (!isNaN(parsedDate.getTime())) {
        setFormData((prev) => ({
          ...prev,
          dueDate: parsedDate.toISOString(),
        }));
      }
    }
  };

  const statusOptions = [
    { value: TaskStatus.PENDING, label: '⏳ Chờ xử lý' },
    { value: TaskStatus.IN_PROGRESS, label: '🔄 Đang làm' },
    { value: TaskStatus.COMPLETED, label: '✅ Hoàn thành' },
    { value: TaskStatus.CANCELLED, label: '❌ Đã hủy' },
  ];

  const priorityOptions = [
    { value: TaskPriority.LOW, label: 'Thấp 🟢', color: '#77DD77' },
    { value: TaskPriority.MEDIUM, label: 'Trung bình 🟡', color: '#FFB347' },
    { value: TaskPriority.HIGH, label: 'Cao 🔴', color: '#FF6B6B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕ Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.headerSaveBtn}
          >
            <Text style={[styles.headerSaveText, saving && styles.btnDisabled]}>
              {saving ? 'Lưu...' : 'Lưu'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section: Title */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Tiêu đề <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Thiết kế màn hình đăng nhập..."
              placeholderTextColor="#94A3B8"
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, title: text }))
              }
              maxLength={100}
            />
          </View>

          {/* Section: Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Mô tả chi tiết</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ghi chú chi tiết yêu cầu công việc..."
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

          {/* Section: Đội nhóm (Team) - Bài thi 2 */}
          <View style={styles.section}>
            <Text style={styles.label}>Đội nhóm (Team)</Text>
            <Text style={styles.subLabel}>
              Chọn nhóm để gán công việc hoặc để ở chế độ cá nhân:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  !formData.teamId && styles.chipActive,
                ]}
                onPress={() => handleSelectTeam(null)}
              >
                <Text
                  style={[
                    styles.chipText,
                    !formData.teamId && styles.chipTextActive,
                  ]}
                >
                  👤 Cá nhân
                </Text>
              </TouchableOpacity>

              {userTeams.map((t) => {
                const isSelected = formData.teamId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id || t.code}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleSelectTeam(t)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      👥 {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section: Người thực hiện (Assignee) - Bài thi 2 */}
          {formData.teamId && (
            <View style={styles.section}>
              <Text style={styles.label}>Người thực hiện trong nhóm</Text>
              <Text style={styles.subLabel}>
                Chỉ định thành viên chịu trách nhiệm thực hiện task này:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    !formData.assigneeId && styles.chipActive,
                  ]}
                  onPress={() => handleSelectAssignee(null)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      !formData.assigneeId && styles.chipTextActive,
                    ]}
                  >
                    Chưa chỉ định
                  </Text>
                </TouchableOpacity>

                {teamMembers.map((m) => {
                  const isSelected = formData.assigneeId === m.userId;
                  return (
                    <TouchableOpacity
                      key={m.id || m.userId}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleSelectAssignee(m)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {m.userAvatar || '👤'} {m.userName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Section: Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.optionRow}>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionChip,
                    formData.status === opt.value && styles.optionChipActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, status: opt.value }))
                  }
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      formData.status === opt.value &&
                        styles.optionChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Priority */}
          <View style={styles.section}>
            <Text style={styles.label}>Mức độ ưu tiên</Text>
            <View style={styles.optionRow}>
              {priorityOptions.map((opt) => {
                const isSelected = formData.priority === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.priorityChip,
                      isSelected && {
                        borderColor: opt.color,
                        backgroundColor: `${opt.color}20`,
                      },
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, priority: opt.value }))
                    }
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: opt.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && { color: '#0F172A', fontWeight: 'bold' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.optionRow}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionChip,
                    formData.category === cat && styles.optionChipActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, category: cat }))
                  }
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      formData.category === cat && styles.optionChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Due Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Hạn chót (Due Date)</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                📅 Hạn chót:{' '}
                <Text style={styles.dateValueHighlight}>
                  {formatDateForDisplay(formData.dueDate)}
                </Text>
              </Text>
            </View>

            <Text style={styles.subLabel}>Chọn nhanh:</Text>
            <View style={styles.optionRow}>
              {datePresets.map((preset) => {
                const isSelected =
                  getDateYYYYMMDD(formData.dueDate) ===
                  getDateYYYYMMDD(preset.date.toISOString());
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.datePresetChip,
                      isSelected && styles.datePresetChipActive,
                    ]}
                    onPress={() => handleSelectPreset(preset.date)}
                  >
                    <Text
                      style={[
                        styles.datePresetText,
                        isSelected && styles.datePresetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subLabel}>Hoặc nhập ngày (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2026-10-25"
              placeholderTextColor="#94A3B8"
              value={dateInputText}
              onChangeText={handleCustomDateChange}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.btnDisabled]}
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
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSaveBtn: {
    paddingVertical: 4,
    paddingLeft: 10,
  },
  headerSaveText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    height: 100,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  optionChipText: {
    fontSize: 13,
    color: '#64748B',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 13,
    color: '#64748B',
  },
  dateDisplay: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  dateValueHighlight: {
    fontWeight: '700',
  },
  datePresetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  datePresetChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  datePresetText: {
    fontSize: 12,
    color: '#64748B',
  },
  datePresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
