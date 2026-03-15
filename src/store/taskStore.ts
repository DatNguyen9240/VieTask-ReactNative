import { create } from 'zustand';
import type { ParsedTask } from '../services/api';

interface TaskStore {
  /** All saved tasks */
  tasks: ParsedTask[];

  /** Add parsed tasks to the store */
  addTasks: (newTasks: ParsedTask[]) => void;

  /** Remove a task by index */
  removeTask: (index: number) => void;

  /** Clear all tasks */
  clearTasks: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  addTasks: (newTasks) => set((state) => ({
    tasks: [...newTasks, ...state.tasks],
  })),

  removeTask: (index) => set((state) => ({
    tasks: state.tasks.filter((_, i) => i !== index),
  })),

  clearTasks: () => set({ tasks: [] }),
}));
