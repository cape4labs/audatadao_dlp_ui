import { NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt } from "viem/actions";
import { DataRegistry } from "@/contracts/instances/data-registry";
import { Controller } from "@/contracts/instances/controller";
import { activeChain } from "@/contracts/chains";
import { debugLog } from "@/lib/logger";

const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY! as `0x${string}`;

export async function POST(req: Request) {
  try {
    const { fileId, userAddress } = await req.json();

    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: activeChain,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL),
    });

    const dataLiquidityPool = Controller("DataLiquidityPoolProxy");

    const hash = await client.writeContract({
      address: dataLiquidityPool.address,
      abi: dataLiquidityPool.abi,
      functionName: "requestReward",
      args: [BigInt(fileId), BigInt(1)],
    });

    debugLog("claimReward/route 35", hash);

    const rawReceipt = await waitForTransactionReceipt(client, { hash });

    debugLog("claimReward/route 39", rawReceipt);

    const receipt = JSON.parse(
      JSON.stringify(rawReceipt, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    debugLog("claimReward/route 47", receipt);

    return NextResponse.json({ receipt });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to add file" },
      { status: 500 },
    );
  }
}
