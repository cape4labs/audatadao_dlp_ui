"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { Navigation } from "./components/Navigation";
import { UserOnboarding } from "./components/UserOnboarding";
import { WalletLoginButton } from "./auth/WalletLoginButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: "pending" | "processing" | "completed" | "error";
  uploadedAt: string;
  fileHash?: string;
  pinataUrl: string; // добавьте это поле
}

interface OnboardingData {
  id: number;
  userAddress: string;
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: boolean;
  createdAt: string;
}

interface Stats {
  userAddress: string;
  contributedSeconds: string;
}

interface Info {
  totalSeconds: number;
  totalUsers: number;
}

export default function Home() {
  const { user } = useWalletAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );
  const [stats, setStats] = useState<Stats[] | null>(null);
  const [info, setInfo] = useState<Info>();
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
 
  const loadOnboarding = async () => {
    if (!user?.address) return;

    setOnboardingLoading(true);

    try {
      const res = await fetch(
        `/api/user/onboarding?walletAddress=${user.address}`,
      );

      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        const leaders = result.stat.leaders.leaders;
        const info = result.stat;

        console.log(result)
        if (data) {
          setOnboardingData({
            id: data.id,
            userAddress: data.userAddress,
            country: data.country,
            birthMonth: data.birthMonth,
            birthYear: data.birthYear,
            isItRelated: data.isItRelated,
            createdAt: data.submittedAt,
          });

          setInfo(info)
          setStats(leaders);
          console.log(info)
        }
      }
    } catch (e) {
      setOnboardingData(null);
      setStats(null);
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Success!");
        setEmail("");
      } else {
        setMessage("Error with uploading email");
      }
    } catch (err) {
      setMessage("Error with fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.address) {
      loadOnboarding();
    }
  }, [user?.address]);

  if (!user?.address) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Waitlist HERE!!!</CardTitle>
                <CardDescription>
                  Enter your Gmail/Email for money :)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col gap-3"
                >
                  <Input
                    type="email"
                    placeholder="your@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Submit Email"}
                  </Button>
                  {message && (
                    <p className="text-sm text-gray-600">{message}</p>
                  )}
                </form>
              </CardContent>
            </Card>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your wallet OR provide your email.
              </AlertDescription>
            </Alert>

            {/* Wallet login */}
            <div className="flex justify-center pt-2">
              <WalletLoginButton />
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (onboardingLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image
                  src={"/icons/user.png"}
                  alt="user"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                User Profile
              </CardTitle>
              <CardDescription>
                Your VANA DLP contribution profile and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Wallet Address */}
                <div className="flex items-center gap-3 p-4 border rounded-lg h-full">
                  <Image
                    src={"/icons/wallet.png"}
                    alt="Wallet"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium">Wallet Address</p>
                    <b className="text-xs text-gray-500 font-mono">
                      {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </b>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3 p-4 border rounded-lg h-full">
                  <Image
                    src={"/icons/calendar.png"}
                    alt="Wallet"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-xs text-gray-500">
                      <b className="text-xs text-gray-500">
                        {onboardingData?.createdAt
                          ? new Date(
                              onboardingData.createdAt,
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            })
                          : "-"}
                      </b>
                    </p>
                  </div>
                </div>

                {/* Onboarding Data */}
                <div className="flex flex-col gap-2 p-4 border rounded-lg h-full">
                  <p className="text-sm font-medium">Onboarding Data</p>
                  <div className="text-xs text-gray-700">
                    {onboardingData ? (
                      <>
                        <div>
                          Country: <b>{onboardingData.country}</b>
                        </div>
                        <div>
                          Birth:{" "}
                          <b>
                            {onboardingData.birthMonth}{" "}
                            {onboardingData.birthYear}
                          </b>
                        </div>
                        <div>
                          IT Related:{" "}
                          <b>{onboardingData.isItRelated ? "Yes" : "No"}</b>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">Not completed yet</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image
                    src={"/icons/trophy.png"}
                    alt="user"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  Leaderboard
                </CardTitle>
                <CardDescription>Top 5 of our uploaders</CardDescription>

                {/* TODO: */}
                <div className="text-sm text-gray-600">
                  Total users: <b>{info?.totalUsers ?? 0}</b> • Total minutes: <b>{Math.floor((info?.totalSeconds ?? 0) / 60)}</b>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                {stats && stats.length > 0 ? (
                  stats.map((stat, index) => (
                    <div
                      key={stat.userAddress}
                      className="flex items-center justify-around gap-3 p-4 border rounded-lg w-full"
                    >
                      <div className="w-8 font-bold">{index + 1}.</div>

                      <div className="flex items-center gap-2">
                        <Image
                          src={"/icons/wallet.png"}
                          alt="Wallet"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            User Wallet
                            {stat.userAddress.toLowerCase() === user.address.toLowerCase() && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {stat.userAddress.slice(0, 6)}...{stat.userAddress.slice(-4)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Image
                          src={"/icons/time.png"}
                          alt="Minutes upload"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <div>
                          <p className="text-sm font-medium">Minutes Uploaded</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {Math.floor(parseInt(stat.contributedSeconds) / 60)} min
                          </p>
                        </div>
                      </div>
                    </div>

                  ))
                ) : (
                  <div className="text-gray-500">No Leaderboard</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Form - показываем только если опрос не пройден */}
          {!onboardingData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image
                    src={"/icons/user.png"}
                    alt="user"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  Complete Your Profile
                </CardTitle>
                <CardDescription>
                  Please provide some information to help us personalize your
                  experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserOnboarding onComplete={loadOnboarding} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
