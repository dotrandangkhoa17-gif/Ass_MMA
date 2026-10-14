// Team Service - Quản lý Đội nhóm & Thành viên
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Team, TeamMember } from '../models/Team';
import { UserProfile } from '../models/User';

const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERS_COLLECTION = 'teamMembers';

const teamsCollection = collection(db, TEAMS_COLLECTION);
const teamMembersCollection = collection(db, TEAM_MEMBERS_COLLECTION);

/**
 * Sinh mã nhóm ngẫu nhiên 6 ký tự viết hoa (VD: "DEV92X")
 */
export const generateTeamCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Tạo đội nhóm mới và tự động gán người tạo làm Owner
 */
export const createTeam = async (
  name: string,
  description: string,
  user: UserProfile
): Promise<Team> => {
  const trimmedName = name.trim();
  const trimmedDesc = description.trim();
  const code = generateTeamCode();
  const now = new Date().toISOString();

  // 1. Tạo team document
  const teamDocRef = await addDoc(teamsCollection, {
    name: trimmedName,
    description: trimmedDesc,
    ownerId: user.id,
    ownerName: user.name,
    code,
    createdAt: now,
    memberCount: 1,
  });

  const teamId = teamDocRef.id;

  // 2. Thêm người tạo vào collection teamMembers với vai trò 'owner'
  const memberDocId = `${teamId}_${user.id}`;
  const memberDocRef = doc(db, TEAM_MEMBERS_COLLECTION, memberDocId);
  const ownerMember: TeamMember = {
    id: memberDocId,
    teamId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userAvatar: user.avatarUrl || null,
    role: 'owner',
    joinedAt: now,
  };
  await setDoc(memberDocRef, ownerMember);

  return {
    id: teamId,
    name: trimmedName,
    description: trimmedDesc,
    ownerId: user.id,
    ownerName: user.name,
    code,
    createdAt: now,
    memberCount: 1,
  };
};

/**
 * Tham gia đội nhóm bằng Mã Nhóm (Team Code)
 */
export const joinTeamByCode = async (
  code: string,
  user: UserProfile
): Promise<Team> => {
  const formattedCode = code.trim().toUpperCase();

  // Tìm team với mã code tương ứng
  const q = query(teamsCollection, where('code', '==', formattedCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Không tìm thấy đội nhóm với mã code này. Vui lòng kiểm tra lại!');
  }

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data() as Omit<Team, 'id'>;
  const teamId = teamDoc.id;

  // Kiểm tra xem người dùng đã là thành viên chưa
  const memberDocId = `${teamId}_${user.id}`;
  const memberDocRef = doc(db, TEAM_MEMBERS_COLLECTION, memberDocId);
  const existingMemberSnap = await getDoc(memberDocRef);

  if (existingMemberSnap.exists()) {
    return {
      id: teamId,
      ...teamData,
    };
  }

  // Thêm thành viên mới
  const now = new Date().toISOString();
  const newMember: TeamMember = {
    id: memberDocId,
    teamId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userAvatar: user.avatarUrl || null,
    role: 'member',
    joinedAt: now,
  };
  await setDoc(memberDocRef, newMember);

  // Cập nhật memberCount trong team
  try {
    await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
      memberCount: increment(1),
    });
  } catch (err) {
    console.warn('Lỗi khi cập nhật memberCount:', err);
  }

  return {
    id: teamId,
    ...teamData,
    memberCount: (teamData.memberCount || 1) + 1,
  };
};

/**
 * Lắng nghe danh sách các nhóm mà người dùng tham gia (Real-time)
 */
export const subscribeUserTeams = (
  userId: string,
  onUpdate: (teams: Team[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const memberQuery = query(
    teamMembersCollection,
    where('userId', '==', userId)
  );

  return onSnapshot(
    memberQuery,
    async (snapshot) => {
      try {
        const teamIds = snapshot.docs.map((d) => d.data().teamId as string);

        if (teamIds.length === 0) {
          onUpdate([]);
          return;
        }

        // Lấy thông tin các team document
        const teamPromises = teamIds.map(async (tId) => {
          const tDoc = await getDoc(doc(db, TEAMS_COLLECTION, tId));
          if (tDoc.exists()) {
            return {
              id: tDoc.id,
              ...tDoc.data(),
            } as Team;
          }
          return null;
        });

        const resolvedTeams = await Promise.all(teamPromises);
        const validTeams = resolvedTeams.filter((t): t is Team => t !== null);
        onUpdate(validTeams);
      } catch (err) {
        console.error('Lỗi khi tải thông tin teams:', err);
        if (onError) onError(err as Error);
      }
    },
    (err) => {
      console.error('Lỗi lắng nghe user teams:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Lắng nghe danh sách thành viên của một nhóm (Real-time)
 */
export const subscribeTeamMembers = (
  teamId: string,
  onUpdate: (members: TeamMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(teamMembersCollection, where('teamId', '==', teamId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        members.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as TeamMember);
      });
      onUpdate(members);
    },
    (error) => {
      console.error('Lỗi lắng nghe thành viên team:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Lấy danh sách thành viên của nhóm 1 lần
 */
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const q = query(teamMembersCollection, where('teamId', '==', teamId));
  const snap = await getDocs(q);
  const members: TeamMember[] = [];
  snap.forEach((d) => {
    members.push({ id: d.id, ...d.data() } as TeamMember);
  });
  return members;
};

/**
 * Rời khỏi nhóm
 */
export const leaveTeam = async (
  teamId: string,
  userId: string
): Promise<void> => {
  const memberDocId = `${teamId}_${userId}`;
  await deleteDoc(doc(db, TEAM_MEMBERS_COLLECTION, memberDocId));
  try {
    await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
      memberCount: increment(-1),
    });
  } catch (err) {
    console.warn('Lỗi khi giảm memberCount:', err);
  }
};

/**
 * Xóa đội nhóm (chỉ dành cho Owner)
 */
export const deleteTeam = async (
  teamId: string,
  userId: string
): Promise<void> => {
  const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamDocRef);

  if (!teamSnap.exists()) {
    throw new Error('Đội nhóm không tồn tại');
  }

  const teamData = teamSnap.data() as Team;
  if (teamData.ownerId !== userId) {
    throw new Error('Chỉ người tạo nhóm (Owner) mới có quyền xóa nhóm này');
  }

  // Xóa document team
  await deleteDoc(teamDocRef);

  // Xóa các record trong teamMembers
  const membersSnap = await getDocs(
    query(teamMembersCollection, where('teamId', '==', teamId))
  );
  const deletePromises = membersSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
};
