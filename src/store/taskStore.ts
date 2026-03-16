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
  completeTask: (id: string) => Promise<void>;
  markReminded: (id: string) => void;
  duplicateTask: (id: string, minutesOffset: number) => Promise<void>;
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
          const id = generateId();
          const notificationId = await scheduleTaskNotification(
            t.title,
            t.datetime_local,
            t.action_label,
            t.action_icon,
            id,
          );
          storedTasks.push({
            ...t,
            id,
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

      completeTask: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task?.notificationId) {
          await cancelNotification(task.notificationId);
        }
        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? { ...t, completed: true, reminded: true, notificationId: null } : t
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

      duplicateTask: async (id, minutesOffset) => {
        const original = get().tasks.find(t => t.id === id);
        if (!original) return;

        // Shift the datetime by minutesOffset
        const date = new Date(original.datetime_local.replace(' ', 'T'));
        date.setMinutes(date.getMinutes() + minutesOffset);
        const newDatetime = date.toISOString().slice(0, 16).replace('T', ' ');

        const newTask: ParsedTask = {
          title: original.title,
          datetime_local: newDatetime,
          remind_before_minutes: original.remind_before_minutes,
          repeat: original.repeat as any,
          confidence: original.confidence,
          need_clarification: false,
          clarifying_question: null,
          action: original.action,
          action_label: original.action_label,
          action_icon: original.action_icon,
          action_url: original.action_url,
          app_name: original.app_name,
          android_package: original.android_package,
        };

        const newId = generateId();
        const notificationId = await scheduleTaskNotification(
          newTask.title,
          newTask.datetime_local,
          newTask.action_label ?? '',
          newTask.action_icon ?? '🔔',
          newId,
        );

        set((state) => ({
          tasks: [{
            ...newTask,
            id: newId,
            notificationId,
            createdAt: new Date().toISOString(),
            completed: false,
            reminded: false,
          }, ...state.tasks],
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
