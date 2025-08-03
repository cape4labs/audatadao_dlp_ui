import { parseEventLogs, TransactionReceipt, type Log } from "viem";
import { getAbi } from "@/contracts/abi";

// Define the type for the FileAdded event arguments
type FileAddedEventArgs = {
  fileId: bigint;
  ownerAddress: `0x${string}`; // viem uses branded string type for addresses
  url: string;
};

/**
 * Extract file ID from transaction receipt logs
 */
export function extractFileIdFromReceipt(receipt: TransactionReceipt): number {
  try {
    // Ensure receipt exists and has logs
    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      throw new Error("Transaction receipt has no logs");
    }

    // Parse the event logs using viem's parseEventLogs
    const logs = parseEventLogs({
      abi: getAbi("DataRegistryProxy"),
      logs: receipt.logs as Log[],
      eventName: "FileAdded",
    });

    // Check if the FileAdded event was emitted
    if (logs.length === 0) {
      throw new Error("No FileAdded event found in transaction receipt");
    }

    // Safely cast the first log to the expected event type
    const fileAddedEvent = logs[0] as unknown as {
      args: FileAddedEventArgs;
      eventName: "FileAdded";
    };

    // Extract fileId from the event arguments
    const fileId = Number(fileAddedEvent.args.fileId);

    // Log for debugging purposes
    console.log("FileAdded event parsed:", {
      fileId,
      ownerAddress: fileAddedEvent.args.ownerAddress,
      url: fileAddedEvent.args.url,
    });

    return fileId;
  } catch (error) {
    console.error("Error extracting file ID from receipt:", error);
    throw new Error("Failed to extract file ID from transaction receipt");
  }
}