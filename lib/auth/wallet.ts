import { mokshaTestnet, vanaMainnet } from "@/contracts/chains";
import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";

// Configure Wagmi
const config = createConfig({
  chains: [mokshaTestnet, vanaMainnet],
  connectors: [injected(), metaMask()],
  transports: {
    [mokshaTestnet.id]: http(),
    [vanaMainnet.id]: http(),
  },
});

export const wagmiConfig = config;
