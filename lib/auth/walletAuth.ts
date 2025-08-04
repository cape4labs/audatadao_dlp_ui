import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address } from 'viem';

export interface WalletUser {
  address: Address;
  chainId: number;
  connectedAt: Date;
  lastActivity: Date;
}

interface WalletAuthState {
  user: WalletUser | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connect: (address: Address, chainId: number) => Promise<void>;
  disconnect: () => void;
  updateActivity: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletAuth = create<WalletAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isConnected: false,
      isLoading: false,
      error: null,

      connect: async (address: Address, chainId: number) => {
        const now = new Date();
        const userData = {
          address,
          chainId,
          connectedAt: now,
          lastActivity: now,
        };

        set({
          user: userData,
          isConnected: true,
          error: null,
          isLoading: true,
        });

        try {
          const response = await fetch('http://audata.space:8000/api/v1/users/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              "address": address,
              "chainId": String(chainId),
            }),
          });
          if (!response.ok) {
            console.error('Failed to register wallet on backend:', response.statusText);
            throw new Error('Failed to register wallet on backend');
          }
          const result = await response.json();
          console.log('Wallet registered successfully:', result);

        } catch (error) {
          console.error('Error registering wallet:', error);
          set({ error: 'Failed to register wallet on backend' });
        } finally {
          set({ isLoading: false });
        }
      },

      disconnect: () => {
        set({
          user: null,
          isConnected: false,
          error: null,
        });
      },

      updateActivity: () => {
        const { user } = get();
        if (user) {
          const now = new Date();
          set({
            user: {
              ...user,
              lastActivity: now,
            },
          });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'wallet-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isConnected: state.isConnected,
      }),
    }
  )
); 