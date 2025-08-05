"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Upload, Home, Wallet, Menu, X } from "lucide-react";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { WalletLoginButton } from "@/app/auth/WalletLoginButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navigation() {
  const { isConnected, disconnect, user } = useWalletAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    disconnect();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="border-b bg-white dark:bg-black py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-xl font-bold">VANA DLP Demo</h1>
          </Link>
          
          {isConnected && (
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/">
                <Button 
                  variant={isActive("/") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
              
              <Link href="/upload">
                <Button 
                  variant={isActive("/upload") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Wallet className="h-4 w-4" />
                <span className="font-mono">
                  {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                </span>
              </div>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-1"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </Button>
            </>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-black">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm" 
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            
            <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/upload") ? "default" : "ghost"} 
                size="sm" 
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>
            
            {isConnected ? (
              <>

                
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Wallet className="h-4 w-4" />
                    <span className="font-mono">
                      {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Connect your wallet to start</p>
                  <WalletLoginButton />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 