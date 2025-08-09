import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(req.headers.entries());
    const busboy = Busboy({ headers, limits: { fileSize: 51 * 1024 * 1024 } });

    let uploadedFileName = "";
    let uploadedFileSize = 0;

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      uploadedFileName = filename;

      const pinataForm = new FormData();
      pinataForm.append("file", file, { filename, contentType: mimeType });

      fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY!,
        },
        body: pinataForm as any,
      })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            return reject(
              NextResponse.json(
                { error: `Pinata upload failed: ${errText}` },
                { status: 500 }
              )
            );
          }
          const result = await res.json();
          resolve(
            NextResponse.json({
              data: {
                pinataUrl: `https://moccasin-hilarious-canid-233.mypinata.cloud/ipfs/${result.IpfsHash}`,
                fileName: uploadedFileName,
                fileSize: uploadedFileSize,
              },
            })
          );
        })
        .catch((err) => {
          reject(
            NextResponse.json(
              { error: `Pinata upload error: ${err.message}` },
              { status: 500 }
            )
          );
        });

      file.on("data", (chunk) => {
        uploadedFileSize += chunk.length;
      });
    });

    busboy.on("error", (err) => {
      reject(
        NextResponse.json(
          { error: `Busboy error: ${err}` },
          { status: 500 }
        )
      );
    });

    const reader = req.body?.getReader();
    if (!reader) {
      return reject(
        NextResponse.json({ error: "No request body" }, { status: 400 })
      );
    }

    async function read() {
      const { done, value } = await reader.read();
      if (done) {
        busboy.end();
        return;
      }
      busboy.write(value);
      await read();
    }

    read();
  });
}

