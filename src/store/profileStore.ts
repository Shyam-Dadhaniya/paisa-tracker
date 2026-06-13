import { create } from 'zustand';

const STORAGE_KEY = 'paisatrack-display-name';

function readStored(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

interface ProfileStore {
  /** Local display name, used when the user isn't signed in. The signed-in
   *  name lives in Supabase user_metadata (see authStore.updateDisplayName). */
  localName: string;
  init: () => void;
  setLocalName: (name: string) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  localName: readStored(),

  init: () => set({ localName: readStored() }),

  setLocalName: (name) => {
    const trimmed = name.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    set({ localName: trimmed });
  },
}));
