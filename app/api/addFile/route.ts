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
    const { fileUrl, encryptionKey, userAddress } = await req.json();

    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: activeChain,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL),
    });
    const { address: dataLiquidityPoolAddress } = Controller(
      "DataLiquidityPoolProxy",
    );
    const dataRegistry = DataRegistry();

    const hash = await client.writeContract({
      address: dataRegistry.address,
      abi: dataRegistry.abi,
      functionName: "addFileWithPermissions",
      args: [
        fileUrl,
        userAddress,
        [
          {
            account: dataLiquidityPoolAddress,
            key: encryptionKey,
          },
        ],
      ],
    });

    debugLog("addFile/route 45", hash);
    const rawReceipt = await waitForTransactionReceipt(client, { hash });
    debugLog("addFile/route 46", rawReceipt);

    const receipt = JSON.parse(
      JSON.stringify(rawReceipt, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    debugLog("addFile/route 57", receipt);
    return NextResponse.json({ receipt });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to add file" },
      { status: 500 },
    );
  }
}
