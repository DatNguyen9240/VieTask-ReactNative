import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** A personal contact / shortcut */
export interface Contact {
  id: string;
  name: string;       // "con trai", "vợ", "sếp"
  phone: string;      // "0901234567"
  note?: string;      // optional note
}

interface ContactStore {
  contacts: Contact[];
  addContact: (name: string, phone: string, note?: string) => void;
  updateContact: (id: string, data: Partial<Omit<Contact, 'id'>>) => void;
  removeContact: (id: string) => void;
  /** Get contacts as a simple name→phone map for sending to BE */
  getContactsMap: () => Record<string, string>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (name, phone, note) => {
        set((state) => ({
          contacts: [...state.contacts, { id: generateId(), name: name.trim(), phone: phone.trim(), note }],
        }));
      },

      updateContact: (id, data) => {
        set((state) => ({
          contacts: state.contacts.map(c =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },

      removeContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter(c => c.id !== id),
        }));
      },

      getContactsMap: () => {
        const map: Record<string, string> = {};
        for (const c of get().contacts) {
          map[c.name] = c.phone;
        }
        return map;
      },
    }),
    {
      name: 'vietask-contacts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
