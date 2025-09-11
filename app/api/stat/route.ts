import { NextRequest, NextResponse } from "next/server";
import { debugLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const { userAddress, audioLength } = body;

    if (!userAddress || !audioLength) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    debugLog("STATISTICS DATA: ", userAddress, audioLength);

    const res = await fetch("https://audata.space/api/v1/users/contribute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        audioLength,
      }),
    });

    const resultData = await res.json();

    if (!res.ok) {
      debugLog("STATISTICS UPLOADING ERROR: ", resultData);
      return NextResponse.json(
        { error: "Failed to upload statistics data" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Statistics data saved successfully",
    });
  } catch (error) {
    console.error("Error uploading statistics data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
