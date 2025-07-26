import { mokshaTestnet, vanaMainnet } from "@/contracts/chains";
import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";

// Configure Wagmi
const config = createConfig({
  chains: [mokshaTestnet, vanaMainnet],
  connectors: [
    injected(), // MetaMask and browser injected wallets
    metaMask(), // Explicit MetaMask connector
    coinbaseWallet({
      appName: "Vana DLP Template",
    }),
  ],
  transports: {
    [mokshaTestnet.id]: http(),
    [vanaMainnet.id]: http(),
  },
});

export const wagmiConfig = config;
