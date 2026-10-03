// Data Model cho Task (Công việc)
// Collection name trong Firestore: "tasks"

export enum TaskStatus {
  PENDING = 'pending',       // Chờ xử lý
  IN_PROGRESS = 'in_progress', // Đang thực hiện
  COMPLETED = 'completed',   // Hoàn thành
  CANCELLED = 'cancelled',   // Đã hủy
}

export enum TaskPriority {
  LOW = 'low',         // Thấp
  MEDIUM = 'medium',   // Trung bình
  HIGH = 'high',       // Cao
}

export interface Task {
  id?: string;                // Document ID từ Firestore (tự động tạo)
  title: string;              // Tiêu đề công việc (bắt buộc)
  description: string;        // Mô tả chi tiết
  status: TaskStatus;         // Trạng thái công việc
  priority: TaskPriority;     // Mức độ ưu tiên
  category: string;           // Danh mục (VD: "Công việc", "Cá nhân", "Học tập")
  dueDate: string;            // Ngày hết hạn (ISO string)
  createdAt: string;          // Ngày tạo (ISO string, tự động)
  updatedAt: string;          // Ngày cập nhật (ISO string, tự động)
}

// Các danh mục mặc định
export const DEFAULT_CATEGORIES = [
  'Công việc',
  'Cá nhân',
  'Học tập',
  'Sức khỏe',
  'Khác',
];

// Hàm tạo task mới với giá trị mặc định
export const createDefaultTask = (): Omit<Task, 'id'> => ({
  title: '',
  description: '',
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  category: DEFAULT_CATEGORIES[0],
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
