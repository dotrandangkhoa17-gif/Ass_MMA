// Authentication Service - Quản lý Xác thực & Thông tin Người dùng
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { UserProfile } from '../models/User';

const USERS_COLLECTION = 'users';

/**
 * Đăng ký tài khoản mới bằng Email/Mật khẩu
 * Tạo Firebase Auth user và lưu document vào Firestore collection 'users'
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<UserProfile> => {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    trimmedEmail,
    password
  );
  const user = userCredential.user;

  // Cập nhật displayName trong Firebase Auth
  await updateProfile(user, { displayName: trimmedName });

  const now = new Date().toISOString();
  const userProfile: UserProfile = {
    id: user.uid,
    name: trimmedName,
    email: trimmedEmail,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  // Lưu document vào collection 'users'
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  await setDoc(userDocRef, userProfile);

  return userProfile;
};

/**
 * Đăng nhập bằng Email/Mật khẩu
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const trimmedEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(
    auth,
    trimmedEmail,
    password
  );
  return userCredential.user;
};

/**
 * Đăng xuất khỏi hệ thống
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Lắng nghe thay đổi trạng thái đăng nhập thời gian thực
 */
export const subscribeAuthState = (
  callback: (user: FirebaseUser | null) => void
): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Lấy thông tin profile người dùng từ Firestore 'users' collection
 */
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }

    // Nếu document chưa tồn tại (ví dụ đăng nhập bằng auth cũ), tự động tạo từ auth info
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const now = new Date().toISOString();
      const defaultProfile: UserProfile = {
        id: uid,
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Người dùng',
        email: auth.currentUser.email || '',
        avatarUrl: auth.currentUser.photoURL || null,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userDocRef, defaultProfile);
      return defaultProfile;
    }

    return null;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin user profile:', error);
    return null;
  }
};

/**
 * Cập nhật thông tin profile người dùng (ví dụ: avatarUrl, name)
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const now = new Date().toISOString();
  await updateDoc(userDocRef, {
    ...updates,
    updatedAt: now,
  });

  if (updates.name && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: updates.name });
  }
};
