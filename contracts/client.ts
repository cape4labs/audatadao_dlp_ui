import { Chain, createPublicClient, http } from "viem";

import { activeChainId, chains } from "./chains";

// No need to query earlier than this
export const defaultFromBlock = BigInt(292220);

let _client: ReturnType<typeof createClient>;

export const createClient = (
  chainId: keyof typeof chains = activeChainId,
): ReturnType<typeof createPublicClient> & { chain: Chain } => {
  if (!_client || _client.chain?.id !== chainId) {
    const chain = chains[chainId];
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    _client = createPublicClient({
      chain,
      transport: http(),
    });
  }

  return _client;
};
