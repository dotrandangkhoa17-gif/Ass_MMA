// Data Model cho User (Người dùng)
// Collection name trong Firestore: "users"

export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string; // Tên hiển thị người dùng
  email: string; // Địa chỉ email
  avatarUrl?: string | null; // URL ảnh đại diện hoặc base64 / emoji
  createdAt: string; // ISO string thời điểm tạo tài khoản
  updatedAt?: string; // ISO string thời điểm cập nhật
}
