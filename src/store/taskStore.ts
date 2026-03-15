import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParsedTask } from '../services/api';
import { scheduleTaskNotification, cancelNotification, cancelAllNotifications } from '../services/notifications';

/** Task with notification tracking */
export interface StoredTask extends ParsedTask {
  id: string;
  notificationId: string | null;
  createdAt: string;
  completed: boolean;
  reminded: boolean;
}

interface TaskStore {
  tasks: StoredTask[];
  addTasks: (newTasks: ParsedTask[]) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  completeTask: (id: string) => void;
  markReminded: (id: string) => void;
  clearTasks: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTasks: async (newTasks) => {
        const storedTasks: StoredTask[] = [];
        for (const t of newTasks) {
          const notificationId = await scheduleTaskNotification(
            t.title,
            t.datetime_local,
            t.action_label,
            t.action_icon,
          );
          storedTasks.push({
            ...t,
            id: generateId(),
            notificationId,
            createdAt: new Date().toISOString(),
            completed: false,
            reminded: false,
          });
        }
        set((state) => ({
          tasks: [...storedTasks, ...state.tasks],
        }));
      },

      removeTask: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task?.notificationId) {
          await cancelNotification(task.notificationId);
        }
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? { ...t, completed: true, reminded: true } : t
          ),
        }));
      },

      markReminded: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? { ...t, reminded: true } : t
          ),
        }));
      },

      clearTasks: async () => {
        await cancelAllNotifications();
        set({ tasks: [] });
      },
    }),
    {
      name: 'vietask-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
