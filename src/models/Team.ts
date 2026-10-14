// Data Model cho Đội nhóm (Teams) & Thành viên (TeamMembers)
// Collections trong Firestore: "teams", "teamMembers"

export interface Team {
  id?: string; // Document ID từ Firestore
  name: string; // Tên đội nhóm
  description: string; // Mô tả đội nhóm
  ownerId: string; // UID của người tạo nhóm
  ownerName?: string; // Tên hiển thị người tạo
  code: string; // Mã tham gia nhóm (VD: ABC123)
  createdAt: string; // ISO string thời điểm tạo nhóm
  memberCount?: number; // Số lượng thành viên (tùy chọn)
}

export type TeamRole = 'owner' | 'member';

export interface TeamMember {
  id?: string; // Document ID (thường là `${teamId}_${userId}`)
  teamId: string; // ID nhóm
  userId: string; // UID người dùng
  userName: string; // Tên người dùng
  userEmail: string; // Email người dùng
  userAvatar?: string | null; // Avatar nếu có
  role: TeamRole; // Vai trò: 'owner' hoặc 'member'
  joinedAt: string; // ISO string thời điểm tham gia
}
