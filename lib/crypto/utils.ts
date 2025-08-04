/**
 * Client-side encryption of file data using wallet public key
 * @param data The data to encrypt
 * @param walletPublicKey The wallet public key to use for encryption
 * @returns The encrypted data as a Blob
 */
export async function clientSideEncrypt(
  data: Blob,
  walletPublicKey: string
): Promise<Blob> {
  try {
    const arrayBuffer = await data.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Encrypt the base64 data with wallet public key
    const encryptedHex = await encryptWithWalletPublicKey(base64Data, walletPublicKey);
    
    // Convert hex string back to ArrayBuffer
    const encryptedBuffer = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    return new Blob([encryptedBuffer], { type: "application/octet-stream" });
  } catch (err) {
    console.error("Wallet key encryption failed:", err);
    throw new Error("Failed to encrypt file using wallet public key.");
  }
}

/**
 * Simple encryption using wallet public key as seed
 * This is a temporary solution until we can properly integrate eccrypto
 * @param data The data to encrypt
 * @param publicKey The wallet public key
 * @returns The encrypted data as a hex string
 */
export const encryptWithWalletPublicKey = async (
  data: string,
  publicKey: string
): Promise<string> => {
  try {
    // Create a simple encryption key from the public key
    const keyBytes = new TextEncoder().encode(publicKey);
    const dataBytes = new TextEncoder().encode(data);
    
    // Simple XOR encryption with the public key
    const result = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      result[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to hex string
    const hexString = Array.from(result)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    return hexString;
  } catch (error) {
    console.error('Simple encryption failed:', error);
    throw new Error('Failed to encrypt data with wallet public key');
  }
};

/**
 * Prepares a file ID for the VANA DLP registry
 * @param url The URL of the file
 * @param timestamp Optional timestamp
 * @returns A formatted file ID
 */
export function formatVanaFileId(
  url: string,
  timestamp: number = Date.now()
): string {
  return `vana_submission_${timestamp}_${url.substring(
    url.lastIndexOf("/") + 1
  )}`;
}


