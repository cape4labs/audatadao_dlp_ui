"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface NavigationProps {
  discordUsername?: string | null;
}

export function Navigation({ discordUsername }: NavigationProps) {
  const { isConnected, disconnect, user } = useWalletAuth();
  const [discordUser, setDiscordUser] = useState<{ username: string } | null>(
    null,
  );
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // инициализация discordUser
  useEffect(() => {
    if (discordUsername) {
      setDiscordUser({ username: discordUsername });
      return;
    }

    try {
      const stored = localStorage.getItem("discord_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setDiscordUser(parsed);
      }
    } catch (err) {
      console.error("Failed to parse discord_user:", err);
    }
  }, [discordUsername]);

  const handleSignOut = () => {
    disconnect();
    setIsMobileMenuOpen(false);
  };

  const handleDiscordLogout = () => {
    localStorage.removeItem("discord_user");
    setDiscordUser(null);
  };

  const handleDiscordAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
    );
    const scope = "identify email";
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;
  };

  const isActive = (path: string) => pathname === path;
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="border-b bg-white dark:bg-black py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Логотип и навигация */}
        <div className="flex gap-6 justify-center align-middle">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/folder.png"
              alt="logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-semibold">AUDATA</span>
          </Link>

          {isConnected && (
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Image
                    src={
                      isActive("/")
                        ? "/icons/home-white.png"
                        : "/icons/home-black.png"
                    }
                    alt="home"
                    width={20}
                    height={20}
                  />
                  <span>Home</span>
                </Button>
              </Link>

              <Link href="/upload">
                <Button
                  variant={isActive("/upload") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Image
                    src={
                      isActive("/upload")
                        ? "/icons/upload-white.png"
                        : "/icons/upload-black.png"
                    }
                    alt="upload"
                    width={20}
                    height={20}
                  />
                  <span>Upload</span>
                </Button>
              </Link>
            </nav>
          )}
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <Image
                src={"/icons/wallet.png"}
                alt="Wallet"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="font-mono">
                {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
              </span>
            </div>
          )}

          {/* Кнопка меню для мобилок */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          {/* Disconnect */}
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-1"
              onClick={handleSignOut}
            >
              <Image
                src={"/icons/exit.png"}
                alt="exit"
                width={20}
                height={20}
                className="object-contain"
              />
              <span>Disconnect</span>
            </Button>
          )}

          {/* Discord Auth / Username */}
          {isConnected ? (
            <div>
              {discordUser ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDiscordLogout}
                >
                  {discordUser.username}
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={handleDiscordAuth}>
                  Discord Auth
                </Button>
              )}
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-black">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Image
                  src={
                    isActive("/")
                      ? "/icons/home-white.png"
                      : "/icons/home-black.png"
                  }
                  alt="home"
                  width={20}
                  height={20}
                />
                Home
              </Button>
            </Link>

            <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant={isActive("/upload") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Image
                  src={
                    isActive("/upload")
                      ? "/icons/upload-white.png"
                      : "/icons/upload-black.png"
                  }
                  alt="upload"
                  width={20}
                  height={20}
                />
                Upload
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
