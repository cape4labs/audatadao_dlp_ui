import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();

    const refinementEndpoint = `${process.env.NEXT_PUBLIC_REFINEMENT_ENDPOINT}/refine`;
    const fileId = requestBody.file_id;
    const encryptionKey = requestBody.encryption_key;
    const refinerId = process.env.NEXT_PUBLIC_REFINER_ID || requestBody.refiner_id;
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
    const apiVersion = process.env.NEXT_PUBLIC_REFINEMENT_API_VERSION;
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;


    if (!refinementEndpoint) {
      return NextResponse.json(
        { error: "Refinement endpoint not configured" },
        { status: 500 }
      );
    }

    if (!fileId || !encryptionKey) {
      return NextResponse.json(
        { error: "Missing required parameters: file_id or encryption_key" },
        { status: 400 }
      );
    }

    const payload = {
      file_id: fileId,
      encryption_key: encryptionKey,
      refiner_id: refinerId,
      env_vars: {
        PINATA_API_KEY: pinataApiKey,
        PINATA_API_SECRET: pinataApiSecret,
        PINATA_GATEWAY: pinataGateway,
      },
    };

    // Set headers for the request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Vana-Accept-Version header for V2
    if (apiVersion === "V2") {
      headers["Vana-Accept-Version"] = "v2";
    }

    const response = await fetch(refinementEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // For V2, we return the job information for async processing
    if (apiVersion === "V2") {
      return NextResponse.json({
        ...data,
        api_version: "V2",
        requires_polling: true
      }, { status: response.status });
    }

    // For V1, return the direct response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in refinement process:", error);
    return NextResponse.json(
      { error: "Failed to process refinement request" },
      { status: 500 }
    );
  }
}