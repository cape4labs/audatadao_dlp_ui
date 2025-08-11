import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const { address, chainId} = body;

    if (!address ||!chainId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const res = await fetch("https://audata.space/api/v1/users/signup", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        address,
        chainId,
        }),
    });

    console.log(res);

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: {
        address,
        chainId,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
