import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** A user-defined shortcut: key → value (completely free-form) */
export interface Shortcut {
  id: string;
  key: string;    // "con trai", "dép lào", "yêu từ bé"
  value: string;  // "0912345567", "zalo", "youtube", anything
}

interface ShortcutStore {
  shortcuts: Shortcut[];
  addShortcut: (key: string, value: string) => void;
  updateShortcut: (id: string, data: Partial<Omit<Shortcut, 'id'>>) => void;
  removeShortcut: (id: string) => void;
  /** Get as simple key→value map for sending to BE */
  getShortcutsMap: () => Record<string, string>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useShortcutStore = create<ShortcutStore>()(
  persist(
    (set, get) => ({
      shortcuts: [],

      addShortcut: (key, value) => {
        set((state) => ({
          shortcuts: [...state.shortcuts, { id: generateId(), key: key.trim(), value: value.trim() }],
        }));
      },

      updateShortcut: (id, data) => {
        set((state) => ({
          shortcuts: state.shortcuts.map(s =>
            s.id === id ? { ...s, ...data } : s
          ),
        }));
      },

      removeShortcut: (id) => {
        set((state) => ({
          shortcuts: state.shortcuts.filter(s => s.id !== id),
        }));
      },

      getShortcutsMap: () => {
        const map: Record<string, string> = {};
        for (const s of get().shortcuts) {
          map[s.key] = s.value;
        }
        return map;
      },
    }),
    {
      name: 'vietask-shortcuts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
