import * as openpgp from 'openpgp';

// Настоящий PGP-публичный ключ в armored-формате
export const DEMO_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEY/8r8BYJKwYBBAHaRw8BAQdA+y/DrOwAY8SLeIypZ2TjsrA3Zy92DoS+RSxh
D6a+5vTG+0BVc2VyIDx1c2VyQGV4YW1wbGUuY29tPoiQBBMWCgA4FiEEe8FGLxKH
59hV6G3kON7m8hz5T1cFAmP/K/AGCwkIBwUVCgkICwUWAgMBAAIeAQIXgAAKCRBO
N7m8hz5T1VZbAP9oOxPH33TrsStgT9bFuSkfNwnYKb5PbJDq4fNPL/0+twD+Pbtx
Hz9x2ZAlz88V/hjT8vmowBLy1a4zbiZwQA4=
=NiZT
-----END PGP PUBLIC KEY BLOCK-----`;

export async function encryptFileWithPGP(file: File, publicKeyArmored: string): Promise<string> {
  try {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const fileBuffer = await file.arrayBuffer();
    const message = await openpgp.createMessage({ binary: fileBuffer });

    const encrypted = await openpgp.encrypt({
      message,
      encryptionKeys: publicKey,
      format: "armored", // сохраняется как текст
    });

    return encrypted as string;
  } catch (err) {
    console.error("PGP Encryption failed:", err);
    throw new Error("Failed to encrypt file. Invalid PGP key or file format.");
  }
}