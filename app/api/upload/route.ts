import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "No wallet address provided" },
        { status: 400 }
      );
    }

    // Check if Pinata credentials are configured
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataApiSecret = process.env.PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      return NextResponse.json(
        { error: "Pinata API credentials not configured" },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create metadata for Pinata
    const metadata = {
      name: file.name,
      description: `Uploaded by ${walletAddress}`,
      attributes: [
        {
          trait_type: "Wallet Address",
          value: walletAddress,
        },
        {
          trait_type: "File Type",
          value: file.type,
        },
        {
          trait_type: "File Size",
          value: file.size.toString(),
        },
        {
          trait_type: "Upload Date",
          value: new Date().toISOString(),
        },
      ],
    };

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataApiSecret,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: file.type }), file.name);
        formData.append('pinataMetadata', JSON.stringify(metadata));
        return formData;
      })(),
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Pinata upload error:', pinataResponse.status, errorText);
      return NextResponse.json(
        { error: `Pinata upload failed: ${pinataResponse.statusText}` },
        { status: 500 }
      );
    }

    const pinataResult = await pinataResponse.json();

    // Generate file hash (using the file content)
    const crypto = require('crypto');
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Return the result in the format expected by the template
    return NextResponse.json({
      data: {
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${pinataResult.IpfsHash}`,
        fileHash: fileHash,
        fileName: file.name,
        fileSize: file.size,
        fileId: pinataResult.IpfsHash,
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