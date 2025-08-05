"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { mokshaTestnet } from "@/contracts/chains";

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  // Check if user is on the wrong network
  const isWrongNetwork = chain && chain.id !== mokshaTestnet.id;

  if (!isWrongNetwork) {
    return null;
  }

  const handleSwitchNetwork = () => {
    switchChain({ chainId: mokshaTestnet.id });
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Wrong Network</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You are connected to {chain?.name} (Chain ID: {chain?.id}). 
          Please switch to VANA - Moksha (Chain ID: 14800) to use this application.
        </span>
        <Button 
          onClick={handleSwitchNetwork} 
          disabled={isPending}
          size="sm"
          className="ml-4"
        >
          {isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Switching...
            </>
          ) : (
            "Switch Network"
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
} 