import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { discordUsername, walletAddress, id } = await req.json();

    if (!discordUsername) {
      return NextResponse.json({ error: "Missing discord_username" }, { status: 400 });
    }

    console.log(discordUsername, id, walletAddress)

    const res = await fetch("https://audata.space/api/v1/users/discord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        "user_address": walletAddress, 
        "username": discordUsername, 
        "id": id
      }),
    });

    const data = await res.json();
    console.log(data)
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error forwarding Discord username:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
