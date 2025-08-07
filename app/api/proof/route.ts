import { NextRequest, NextResponse } from "next/server";

interface ProofRequestBody {
  job_id: number;
  file_id: number;
  nonce: string;
  proof_url: string;
  encryption_seed: string;
  env_vars: {
    DLP_ID: number,
    DB_URI: string,
  },
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

    const jobUrl = requestBody.teeUrl;

    const body: ProofRequestBody = {
        job_id: requestBody.job_id,
        file_id: requestBody.file_id,
        nonce: requestBody.nonce,
        proof_url: requestBody.proof_url,
        encryption_seed: requestBody.encryption_seed,
        env_vars: {
            DLP_ID: requestBody.env_vars?.DLP_ID,
            DB_URI: requestBody.env_vars?.DB_URI,
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

    console.log(body.proof_url)

    const contributionProofResponse = await fetch(
    `${jobUrl}/RunProof`,
    {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(body), 
    }
    );
    console.log(jobUrl)
    console.log(body)

    if (!contributionProofResponse.ok) {
      const errorText = await contributionProofResponse.text();
      console.error("Error:", contributionProofResponse.status, errorText);
      return NextResponse.json({ error: `Error: ${contributionProofResponse.statusText}` }, { status: 500 });
    }

    const res = await contributionProofResponse.json();

    console.log(res)

    return NextResponse.json({
      data: {
        "res": res
      },
    }, {status: 200});

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
