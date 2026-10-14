import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Team } from '../models/Team';
import { ChatMessage } from '../models/Message';
import { useAuth } from '../context/AuthContext';
import {
  sendChatMessage,
  subscribeTeamMessages,
  setTypingIndicator,
  subscribeTypingIndicators,
} from '../services/chatService';

interface TeamChatScreenProps {
  team: Team;
  onGoBack: () => void;
}

export default function TeamChatScreen({ team, onGoBack }: TeamChatScreenProps) {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lắng nghe tin nhắn và typing indicator thời gian thực
  useEffect(() => {
    if (!team.id || !user) return;

    setLoading(true);

    const unsubMessages = subscribeTeamMessages(
      team.id,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        setLoading(false);
        // Tự động cuộn xuống cuối khi có tin nhắn mới
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      },
      (error) => {
        console.error('Error fetching chat messages:', error);
        setLoading(false);
      }
    );

    const unsubTyping = subscribeTypingIndicators(
      team.id,
      user.uid,
      (typists) => {
        setTypingUsers(typists);
      }
    );

    return () => {
      unsubMessages();
      unsubTyping();
      // Xóa trạng thái đang gõ khi rời khỏi màn hình
      if (team.id && user) {
        setTypingIndicator(team.id, user.uid, userProfile?.name || 'Thành viên', false);
      }
    };
  }, [team.id, user, userProfile?.name]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!team.id || !user) return;

    // Bật trạng thái typing
    setTypingIndicator(team.id, user.uid, userProfile?.name || 'Thành viên', true);

    // Xóa timeout cũ nếu người dùng vẫn đang gõ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Tắt typing sau 2.5 giây nếu ngừng gõ
    typingTimeoutRef.current = setTimeout(() => {
      if (team.id && user) {
        setTypingIndicator(team.id, user.uid, userProfile?.name || 'Thành viên', false);
      }
    }, 2500);
  };

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !team.id || !user) return;

    setSending(true);
    setInputText('');

    // Tắt trạng thái typing ngay lập tức
    if (team.id && user) {
      setTypingIndicator(team.id, user.uid, userProfile?.name || 'Thành viên', false);
    }

    try {
      await sendChatMessage(
        team.id,
        user.uid,
        userProfile?.name || user.displayName || 'Thành viên',
        trimmed,
        userProfile?.avatarUrl || null
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Khôi phục lại text nếu gửi thất bại
      setInputText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;

    if (isMe) {
      return (
        <View style={styles.myMessageRow}>
          <View style={styles.myBubble}>
            <Text style={styles.myMessageText}>{item.text}</Text>
            <Text style={styles.myMessageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageRow}>
        <View style={styles.otherAvatarBox}>
          <Text style={styles.otherAvatarText}>
            {item.senderAvatar || '👤'}
          </Text>
        </View>
        <View style={styles.otherMessageWrapper}>
          <Text style={styles.otherSenderName}>{item.senderName}</Text>
          <View style={styles.otherBubble}>
            <Text style={styles.otherMessageText}>{item.text}</Text>
            <Text style={styles.otherMessageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {team.name}
          </Text>
          <View style={styles.onlineBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineStatusText}>
              Kênh chat nhóm thời gian thực
            </Text>
          </View>
        </View>
        <View style={styles.teamEmojiBox}>
          <Text style={styles.teamEmojiText}>💬</Text>
        </View>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang kết nối đoạn chat...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || String(Math.random())}
            renderItem={renderMessageItem}
            contentContainerStyle={
              messages.length === 0
                ? styles.emptyMessagesContent
                : styles.messagesContent
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconBox}>
                  <Text style={styles.emptyEmoji}>💬</Text>
                </View>
                <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
                <Text style={styles.emptyDesc}>
                  Hãy bắt đầu cuộc trò chuyện cùng các thành viên trong nhóm{' '}
                  <Text style={{ fontWeight: '700' }}>{team.name}</Text>!
                </Text>
              </View>
            }
          />

          {/* Typing Indicator Banner */}
          {typingUsers.length > 0 && (
            <View style={styles.typingBanner}>
              <Text style={styles.typingIcon}>✏️</Text>
              <Text style={styles.typingText}>
                {typingUsers.join(', ')} đang nhập tin nhắn...
              </Text>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.inputField}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backArrow: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '300',
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  onlineStatusText: {
    fontSize: 12,
    color: '#64748B',
  },
  teamEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamEmojiText: {
    fontSize: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94A3B8',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  myBubble: {
    backgroundColor: '#6366F1',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageTime: {
    color: '#E0E7FF',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    gap: 8,
  },
  otherAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherAvatarText: {
    fontSize: 16,
  },
  otherMessageWrapper: {
    maxWidth: '78%',
  },
  otherSenderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 3,
    marginLeft: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  otherMessageText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
  },
  otherMessageTime: {
    color: '#94A3B8',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  typingIcon: {
    fontSize: 12,
  },
  typingText: {
    fontSize: 12,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#0F172A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    fontSize: 17,
    color: '#FFFFFF',
    marginLeft: 2,
  },
});
