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

// READ - Lấy tất cả công việc
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
