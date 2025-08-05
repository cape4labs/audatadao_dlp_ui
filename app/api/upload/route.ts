import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    formData.append('file', file);

    // Upload to Pinata
        const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            "pinata_api_key": '0904cdffa1f7a18dc408',
            "pinata_secret_api_key": '29aaac77b8e5fd3a3de8a5f8666f1586911a88d8cf55240e51639200a4fbd784',
          },
          body: formData,
        });


        console.log("Pinata response:", await pinataResponse.json());
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Pinata upload error:', pinataResponse.status, errorText);
      return NextResponse.json(
        { error: `Pinata upload failed: ${pinataResponse.statusText}` },
        { status: 500 }
      );
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
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 