import { NextRequest, NextResponse } from "next/server";
import { debugLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const code = await request.json();


    if (!code) {
      return NextResponse.json(
        { error: "Missing code" },
        { status: 400 },
      );
    }

    debugLog(code);

    const res = await fetch(
      `https://audata.space/api/v1/users/code?code=${code}`,
      {
        method: "POST",
      },
      
    );

    debugLog(res);

    if (res.status == 200) {
      return NextResponse.json({
        success: true,
        message: "Code is valid",
      });
    } else if (res.status == 404) {
      return NextResponse.json({
        success: false,
        message: "Code is not valid",
      }, 
      {
        status: 404
      }
    );
    } else if (res.status == 401) {
      return NextResponse.json({
        success: false,
        message: "Your code has been blocked"
      }, 
      {
        status: 401
      }
    )
    }
  } catch (error) {
    console.error("Error processing code data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
