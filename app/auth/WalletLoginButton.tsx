"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { toast } from "sonner";

export function WalletLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { connectors, connect, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const {
    connect: connectWallet,
    isConnected: isWalletConnected,
    isLoading: isWalletLoading,
  } = useWalletAuth();

  const handleConnect = async (connectorId: string) => {
    try {
      setIsLoading(true);
      const connector = connectors.find((c) => c.id === connectorId);

      if (connector) {
        await connect({ connector });
      } else {
        toast.error("Wallet connector not found");
      }
    } catch (error) {
      console.error("Connection failed", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Если кошелек подключен, сохраняем данные пользователя
  useEffect(() => {
    if (isConnected && address && !isWalletConnected && !isWalletLoading) {
      connectWallet(address, Number(process.env.NEXT_PUBLIC_CHAIN_ID)); // Используем Moksha testnet по умолчанию
    }
  }, [isConnected, address, isWalletConnected, isWalletLoading, connectWallet]);

  // Показываем уведомление об успешном подключении
  useEffect(() => {
    if (isWalletConnected && !isLoading) {
      toast.success("Wallet connected successfully!");
    }
  }, [isWalletConnected, isLoading]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {connectors.map((connector) => (
          <Button
            key={connector.id}
            onClick={() => handleConnect(connector.id)}
            disabled={isLoading || isPending || isWalletLoading}
            className="flex items-center gap-2 w-full justify-start"
            size="lg"
            variant="outline"
          >
            {isLoading || isPending || isWalletLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isWalletLoading ? "Registering..." : "Connecting..."}
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Connect {connector.name}
              </>
            )}
          </Button>
        ))}
      </div>

      {isWalletConnected && (
        <div className="text-center text-sm text-green-600">
          ✓ Wallet connected and registered
        </div>
      )}
    </div>
  );
}
