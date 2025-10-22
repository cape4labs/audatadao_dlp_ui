import { NextRequest, NextResponse } from "next/server";
import { debugLog } from "@/lib/logger";

interface ProofRequestBody {
  job_id: number;
  file_id: number;
  nonce: string;
  proof_url: string;
  encryption_seed: string;
  env_vars: {
    DLP_ID: number;
    DB_URI: string;
  };
  validate_permissions: {
    address: string;
    public_key: string;
    iv: string;
    ephemeral_key: string;
  }[];
  encrypted_encryption_key?: string;
  encryption_key?: string;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const db_uri = process.env.DB_URI || "";

    if (!db_uri) {
      return NextResponse.json({ error: "DB_URI is not set" }, { status: 500 });
    }

    const jobUrl = requestBody.teeUrl;

    const body: ProofRequestBody = {
      job_id: requestBody.job_id,
      file_id: requestBody.file_id,
      nonce: requestBody.nonce,
      proof_url: requestBody.proof_url,
      encryption_seed: requestBody.encryption_seed,
      env_vars: {
        DLP_ID: requestBody.env_vars?.DLP_ID,
        DB_URI: db_uri,
      },
      validate_permissions: requestBody.validate_permissions?.map((p: any) => ({
        address: p.address,
        public_key: p.public_key,
        iv: p.iv,
        ephemeral_key: p.ephemeral_key,
      })),
      encrypted_encryption_key: requestBody.encrypted_encryption_key,
      encryption_key: requestBody.encryption_key,
    };

    debugLog(jobUrl);
    debugLog("api/proof/route.ts 61", body);

    const contributionProofResponse = await fetch(`${jobUrl}/RunProof`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!contributionProofResponse.ok) {
      // TODO this is a quick and dirty solution until we fix it
      let errorText = await contributionProofResponse.text();
      errorText = errorText.replace(/postgres[^"'\s]*\/\w+/gi, "[REDACTED]");
      console.error("Error:", contributionProofResponse.status, errorText);
      return NextResponse.json(
        { error: `Error: ${errorText}` },
        { status: 500 },
      );
    }

    let res = await contributionProofResponse.json();
    // Hide sensitive info from the response
    // TODO this is a quick and dirty solution until we fix it
    // Convert to string, strip out any "postgres.../..."
    // e.g. postgres://user@host/db or postgresql://.../anything
    res = JSON.parse(
      JSON.stringify(res).replace(/postgres[^"'\s]*\/\w+/gi, "[REDACTED]")
    );
    debugLog("api/proof/route.ts 70", res);

    return NextResponse.json(
      {
        data: {
          res: res,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
