import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(email);

    const res = await fetch(
      `https://audata.space/api/v1/users/email?email=${email}`,
      {
        method: "POST",
      },
    );

    console.log(res);

    return NextResponse.json({
      success: true,
      message: "Email saved successfully",
      data: {
        email,
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
