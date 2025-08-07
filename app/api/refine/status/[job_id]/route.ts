import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;
    const refinementEndpoint = process.env.NEXT_PUBLIC_REFINEMENT_ENDPOINT;

    if (!refinementEndpoint) {
      return NextResponse.json(
        { error: "Refinement endpoint not configured" },
        { status: 500 }
      );
    }

    if (!job_id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const statusUrl = `${refinementEndpoint}/refine/${job_id}`;
    
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error checking refinement job status:", error);
    return NextResponse.json(
      { error: "Failed to check job status" },
      { status: 500 }
    );
  }
} 