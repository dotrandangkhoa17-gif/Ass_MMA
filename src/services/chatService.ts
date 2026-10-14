// Chat Service - Quản lý Tin nhắn Thời gian thực & Trạng thái Đang gõ
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ChatMessage, TypingStatus } from '../models/Message';

const getMessagesCollection = (teamId: string) =>
  collection(db, 'teams', teamId, 'messages');

const getTypingCollection = (teamId: string) =>
  collection(db, 'teams', teamId, 'typing');

/**
 * Gửi tin nhắn mới vào nhóm chat
 * Lưu vào subcollection: teams/{teamId}/messages
 */
export const sendChatMessage = async (
  teamId: string,
  senderId: string,
  senderName: string,
  text: string,
  senderAvatar?: string | null
): Promise<string> => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Nội dung tin nhắn không được để trống');
  }

  const now = new Date().toISOString();
  const messagesRef = getMessagesCollection(teamId);

  const docRef = await addDoc(messagesRef, {
    teamId,
    senderId,
    senderName,
    senderAvatar: senderAvatar || null,
    text: trimmedText,
    createdAt: now,
  });

  return docRef.id;
};

/**
 * Lắng nghe tin nhắn mới thời gian thực từ Firestore (onSnapshot)
 * Sắp xếp theo createdAt tăng dần
 */
export const subscribeTeamMessages = (
  teamId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const messagesRef = getMessagesCollection(teamId);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as ChatMessage);
      });
      onUpdate(messages);
    },
    (error) => {
      console.error('Lỗi lắng nghe tin nhắn chat:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Cập nhật trạng thái đang gõ (Typing Indicator) - Điểm thưởng
 */
export const setTypingIndicator = async (
  teamId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const typingDocRef = doc(db, 'teams', teamId, 'typing', userId);
    const now = new Date().toISOString();
    const data: TypingStatus = {
      userId,
      userName,
      isTyping,
      updatedAt: now,
    };
    await setDoc(typingDocRef, data);
  } catch (err) {
    // Không làm gián đoạn UI nếu typing indicator gặp lỗi
    console.debug('Lỗi cập nhật typing indicator:', err);
  }
};

/**
 * Lắng nghe người đang gõ trong nhóm (trừ người dùng hiện tại)
 */
export const subscribeTypingIndicators = (
  teamId: string,
  currentUserId: string,
  onUpdate: (typingUserNames: string[]) => void
): Unsubscribe => {
  const typingRef = getTypingCollection(teamId);

  return onSnapshot(
    typingRef,
    (snapshot) => {
      const now = Date.now();
      const typists: string[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TypingStatus;
        if (data.userId !== currentUserId && data.isTyping) {
          const updatedAtTime = new Date(data.updatedAt).getTime();
          // Chỉ hiển thị nếu cập nhật trong vòng 5 giây trước
          if (now - updatedAtTime < 5000) {
            typists.push(data.userName);
          }
        }
      });

      onUpdate(typists);
    },
    (err) => {
      console.debug('Lỗi lắng nghe typing indicator:', err);
    }
  );
};
