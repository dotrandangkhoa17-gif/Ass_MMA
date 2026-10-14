// Task Service - CRUD operations với Firebase Firestore
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Task } from '../models/Task';

const COLLECTION_NAME = 'tasks';
const tasksCollection = collection(db, COLLECTION_NAME);

// CREATE - Thêm công việc mới
export const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(tasksCollection, {
      ...task,
      createdAt: now,
      updatedAt: now,
    });
    console.log('Task added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

// READ - Lắng nghe thay đổi dữ liệu thời gian thực (Real-time listener)
export const subscribeTasks = (
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Task);
      });
      onUpdate(tasks);
    },
    (error) => {
      console.error('Error listening to tasks:', error);
      if (onError) onError(error);
    }
  );
};

// READ - Lắng nghe công việc của một nhóm cụ thể (Real-time)
export const subscribeTeamTasks = (
  teamId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  // Chỉ lọc theo teamId, sắp xếp phía client để không yêu cầu Composite Index trên Firestore
  const q = query(tasksCollection, where('teamId', '==', teamId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Task);
      });
      // Sắp xếp thời gian tạo mới nhất lên đầu
      tasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(tasks);
    },
    (error) => {
      console.error('Error listening to team tasks:', error);
      if (onError) onError(error);
    }
  );
};

// READ - Lắng nghe công việc liên quan đến người dùng (nhóm tham gia + được giao việc + cá nhân)
export const subscribeTasksForUser = (
  userId: string,
  userTeamIds: string[],
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const t = { id: docSnap.id, ...docSnap.data() } as Task;
        // Hiển thị nếu:
        // 1. Task thuộc một trong các team mà user là thành viên
        // 2. Hoặc task được assign trực tiếp cho user
        // 3. Hoặc task do chính user này tạo
        const isInUserTeam = t.teamId ? userTeamIds.includes(t.teamId) : false;
        const isAssignee = t.assigneeId === userId;
        const isCreator = t.creatorId === userId;

        if (isInUserTeam || isAssignee || isCreator) {
          tasks.push(t);
        }
      });
      onUpdate(tasks);
    },
    (error) => {
      console.error('Error listening to user tasks:', error);
      if (onError) onError(error);
    }
  );
};

// READ - Lấy tất cả công việc (One-time fetch)
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const q = query(tasksCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      } as Task);
    });
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

// READ - Lấy công việc theo ID
export const getTaskById = async (taskId: string): Promise<Task | null> => {
  try {
    const taskDoc = doc(db, COLLECTION_NAME, taskId);
    const docSnap = await getDoc(taskDoc);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Task;
    }
    return null;
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

// UPDATE - Cập nhật công việc
export const updateTask = async (
  taskId: string,
  updates: Partial<Omit<Task, 'id'>>
): Promise<void> => {
  try {
    const taskDoc = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(taskDoc, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('Task updated:', taskId);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// DELETE - Xóa công việc
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskDoc = doc(db, COLLECTION_NAME, taskId);
    await deleteDoc(taskDoc);
    console.log('Task deleted:', taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
