// Data Model cho Tin nhắn Thời gian thực (Real-Time Chat)
// Subcollection trong Firestore: "teams/{teamId}/messages"

export interface ChatMessage {
  id?: string; // Document ID của tin nhắn
  teamId: string; // ID nhóm chat
  senderId: string; // UID của người gửi
  senderName: string; // Tên hiển thị người gửi
  senderAvatar?: string | null; // Avatar người gửi
  text: string; // Nội dung tin nhắn
  createdAt: string; // ISO string thời điểm gửi tin nhắn
}

export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
  updatedAt: string;
}
