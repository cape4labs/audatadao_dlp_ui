import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Address } from "viem";

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

        console.log(userData);

        set({
          user: userData,
          isConnected: true,
          error: null,
          isLoading: true,
        });

        try {
          // Try to register with external backend, but don't fail if it's not available
          const response = await fetch("api/user/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: address.toString(),
              chainId: String(chainId),
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("Wallet registered successfully with backend:", result);
          } else if (response.status === 400) {
            console.log("User is already registered");
          } else {
            console.error(
              "Failed to register wallet with backend:",
              response.statusText,
            );
          }
        } catch (error) {
          console.warn(
            "Backend not available, but wallet is connected locally:",
            error,
          );
          // Don't set error state since local connection is still successful
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

        localStorage.clear();
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
      name: "wallet-auth-storage",
      partialize: (state) => ({
        user: state.user,
        isConnected: state.isConnected,
      }),
    },
  ),
);
