import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;

    formData.append("file", file)

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "pinata_api_key": `${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
        "pinata_secret_api_key": `${process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY}`,
      },
      body: formData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error("Pinata upload error:", pinataResponse.status, errorText);
      return NextResponse.json({ error: `Pinata upload failed: ${pinataResponse.statusText}` }, { status: 500 });
    }

    const pinataResult = await pinataResponse.json();

    return NextResponse.json({
      data: {
        pinataUrl: `https://moccasin-hilarious-canid-233.mypinata.cloud/ipfs/${pinataResult.IpfsHash}`,
        fileName: file.name,
        fileSize: file.size,
      },
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
