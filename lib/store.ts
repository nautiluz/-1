import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EmailStats, SenderInfo, CleaningRule } from '@/lib/gmail/types';

interface AppState {
  isAuthenticated: boolean;
  tokens: string | null;
  email: string | null;
  stats: EmailStats | null;
  topSenders: SenderInfo[];
  cleaningRules: CleaningRule[];
  
  setTokens: (tokens: string) => void;
  setEmail: (email: string) => void;
  setStats: (stats: EmailStats) => void;
  setTopSenders: (senders: SenderInfo[]) => void;
  addCleaningRule: (rule: CleaningRule) => void;
  updateCleaningRule: (id: string, updates: Partial<CleaningRule>) => void;
  deleteCleaningRule: (id: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      tokens: null,
      email: null,
      stats: null,
      topSenders: [],
      cleaningRules: [],

      setTokens: (tokens) => set({ isAuthenticated: true, tokens }),
      setEmail: (email) => set({ email }),
      setStats: (stats) => set({ stats }),
      setTopSenders: (senders) => set({ topSenders: senders }),
      
      addCleaningRule: (rule) =>
        set((state) => ({
          cleaningRules: [...state.cleaningRules, rule],
        })),
      
      updateCleaningRule: (id, updates) =>
        set((state) => ({
          cleaningRules: state.cleaningRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      
      deleteCleaningRule: (id) =>
        set((state) => ({
          cleaningRules: state.cleaningRules.filter((r) => r.id !== id),
        })),
      
      logout: () =>
        set({
          isAuthenticated: false,
          tokens: null,
          email: null,
          stats: null,
          topSenders: [],
        }),
    }),
    {
      name: 'clean-mailbox-storage',
    }
  )
);