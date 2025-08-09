import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const { userAddress, country, birthMonth, birthYear, isItRelated, region, countryCode } = body;

    if (
      !userAddress ||
      !country ||
      !birthMonth ||
      !birthYear ||
      isItRelated === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const res = await fetch("http://audata.space:8000/api/v1/users/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        country,
        birthMonth,
        birthYear,
        isItRelated,
        region,
        countryCode,
      }),
    });

    console.log(res);

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: {
        userAddress,
        country,
        birthMonth,
        birthYear,
        isItRelated,
        region,
        countryCode,
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

