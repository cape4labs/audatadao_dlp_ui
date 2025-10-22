"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { debugLog } from "@/lib/logger";
import { useEffect } from "react";

function CallbackInner() {
  const params = useSearchParams();
  const code = params.get("code");
  const router = useRouter();

  useEffect(() => {
    if (!code) return;

    const fetchDiscordData = async () => {
      try {
        const tokenRes = await fetch("/api/auth/discord/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("No token");

        const userRes = await fetch("/api/auth/discord/user", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userRes.json();
        localStorage.setItem("discord_user", JSON.stringify(userData));
        
        localStorage.removeItem("discord_username")
        localStorage.setItem("discord_username", JSON.stringify(userData.username))
        debugLog(userData);

        const walletData = localStorage.getItem("wallet-auth-storage");
        if (walletData) {
          const parsed = JSON.parse(walletData);
          await fetch("/api/user/discord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discordUsername: userData.username,
              walletAddress: parsed.state.user.address,
              id: userData.id,
            }),
          });
        } else {
          console.warn("No wallet found in localStorage");
        }

        router.replace("/");
      } catch (err) {
        debugLog("Discord OAuth error:", err);
      }
    };

    fetchDiscordData();
  }, [code, router]);

  return <div>Authenticating with Discord...</div>;
}

export default function DiscordCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackInner />
    </Suspense>
  );
}
