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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { Navigation } from "./components/Navigation";
import { UserOnboarding } from "./components/UserOnboarding";
import { WalletLoginButton } from "./auth/WalletLoginButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { debugLog } from "@/lib/logger";
import Mascot from "./components/Mascot";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: "pending" | "processing" | "completed" | "error";
  uploadedAt: string;
  fileHash?: string;
  pinataUrl: string;
}

interface OnboardingData {
  id: number;
  userAddress: string;
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: boolean;
  createdAt: string;
  discordUsername: string;
}

interface Stats {
  userAddress: string;
  contributedSeconds: string;
}

interface Info {
  totalSeconds: number;
  totalUsers: number;
}

interface Code {
  code: string;
}

export default function Home() {
  const { user } = useWalletAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );
  const [stats, setStats] = useState<Stats[] | null>(null);
  const [info, setInfo] = useState<Info>();
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [code, setCode] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const devWallets = ["0x28Db17501913fB126b33347f0AC77d3828578EA9",
                      "0xc855933BaB81099E04071949c9FedCA0556577F4",
                      "0xE08F0464611E66603237B054770bdd3004F6dE1d",
                      "0x3CA30E365106817f2Ed3082861EAF4FE5351374F",
                      "0x33a53ff7889ef2d0b1edf0618d46a47581a52840",
                      "0xfb8eb82e21ca82869033446233d32c92bae53231",
                      "0x1C0CCd67709a6AcbD4D43ac40FF07bF090acf0d3",
                      "0x2d6F6Bf3B4740941e4ce64Ac775Fe28d494169df",
                      "0xd5974E891456A6a39d149d4Ffcf21B7569D44810",
                      "0xe6b07040691CC9ceB7C068a2Ac11D5E422216A4e",
                      "0xaB8241De6116375364c4dC31dae02Ab2FB409675",
                      "0x8e9d8922045b1d1ED11abc2C60A6DaF91aB9C94d",
                      "0xfd023a6129812015d7Bd8156cA6cD194351B8315",
                      "0x4e7e78482FCCdC6468Bc32158A0037dC19B67798",
                      "0xC1635863A4979c79d84714bBF571A04fbEf0156D",
                      "0x575D93774057867bEDF64F40Da74d3bdD5Bc0129",
                      "0xFB8eB82E21ca82869033446233d32C92bAe53231",
                      "0xa71c992ADC69a7B7c1e0b14bb11C59a8D83d795C",
                      "0xF9E45C4EF7FfB0E0c9Ae8De14b0eA66311e8767B",
                      "0x6779aa8ad54300e4859bb8F9F0010e7Dff64557d",
                      "0x0C409b6B3F31f14FD883Affe0776897256749cEC",
                      "0x1140727968448aB7D10E666C2C6e4e3411aede1b",
                      "0xEff6cb8b614999d130E537751Ee99724D01aA167",
                      "0xfe0B4db5645feB46C5eDaB78424b47192d23d0e9",
                      "0x2e1Ec11fC97E9F5401e5bfD8A74478d6519FE6a0",
                      "0xfF31B797cb24bd99314B77dcbBdE7f807a195bc1",
                      "0x2Eee69C8E2ba6B4DCc7446ACB3254313eB0891C7",
                      "0xc68B33692192Ec4726603a0990b8771d4741Be92",
                      "0xc511373F2eC1ff6aB6515b25Ce66acd4A7a1069D",
                      "0xdF5d5498Cb99a408dE3D7486106c11b15A02E651",
                      "0x1768826c560a80F1289a7bcd0576748315FEDdD9",
                      "0x75B3a936C4A56471141e14E2Ed118Ab337B5b2b4",
                      "0xf2c8eFd623910AfA7b4E7B61A4b08c7255FF70B3",
                      "0xCAF6bC6CfE64a28F06f656C9D7998d16a8590920",
                    ]

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

        debugLog(result);
        if (data) {
          setOnboardingData({
            id: data.id,
            userAddress: data.userAddress,
            country: data.country,
            birthMonth: data.birthMonth,
            birthYear: data.birthYear,
            isItRelated: data.isItRelated,
            createdAt: data.submittedAt,
            discordUsername: data.discord_username,
          });

          localStorage.setItem("user_onboarding", "true");

          localStorage.setItem("discord_username", onboardingData?.discordUsername || "discord auth")

          setInfo(info);
          setStats(leaders);
          debugLog(info);
        }
      }
    } catch (e) {
      setOnboardingData(null);
      setStats(null);
    } finally {
      setOnboardingLoading(false);
    }
  };

  // const handleCodeSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!code) return;
  //   setLoading(true);
  //   setMessage("");

  //   try {
  //     const res = await fetch("/api/user/code", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(code),
  //     });

  //     if (res.ok) {
  //       setIsAllowed(true) 
  //       return;
  //     } else if (res.status == 404) {
  //       toast.info("Code is not valid");
  //       return;
  //     } else if (res.status == 401) {
  //       toast.info("Code has been blocked");
  //       return;
  //     }
  //   } catch (err) {
  //     setMessage("Error with fetch");
  //     toast.error("Error with request")
  //   } finally {
  //     setLoading(false);    
  //   }
  // };

  useEffect(() => {
    if (user?.address) {
      loadOnboarding();
    }
  }, [user?.address]);

  if (!user?.address) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation
          discordUsername={onboardingData?.discordUsername || "discord auth"}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {!isAllowed && (
            <Card className="align-center items-center justify-center">
            <CardHeader>
              <CardTitle className="">Connect your wallet to enter AudataDAO app</CardTitle>          
              </CardHeader>
            </Card>
            )}
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
        <Navigation
          discordUsername={onboardingData?.discordUsername || "discord auth"}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation
        discordUsername={onboardingData?.discordUsername || null}
      />
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
                      
                  <Mascot />
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

          <Card className="flex-1 overflow-x-hidden space-y-4 p-4 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image
                  src={"/icons/trophy.png"}
                  alt="user"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                Weekly Leaderboard
              </CardTitle>
              <CardDescription>Top 30 of our uploaders</CardDescription>

              <div className="text-sm text-gray-600">
                Total users: <b>{info?.totalUsers ?? 0}</b> • Total minutes:{" "}
                <b>{Math.floor((info?.totalSeconds ?? 0) / 60)}</b>
              </div>
            </CardHeader>

            {/* Контейнер со скроллом */}
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-4">
                {stats && stats.length > 0 ? (
                  stats.map((stat, index) => (
                    <div
                      key={stat.userAddress}
                      className="grid grid-cols-[40px_1fr_auto] items-center gap-4 p-4 border rounded-lg w-full"
                    >
                      {/* Колонка 1 — номер */}
                      <div className="text-lg font-bold text-center">{index + 1}.</div>

                      {/* Колонка 2 — пользователь */}
                      <div className="flex items-center gap-3">
                        <Image
                          src={"/icons/wallet.png"}
                          alt="Wallet"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2 uppercase">
                            User Wallet
                            {devWallets
                              .map((addr) => addr.toString().toLowerCase())
                              .includes(stat.userAddress.toLowerCase()) ? (
                              <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
                                TESTERS
                              </span>
                            ) : (
                              stat.userAddress.toLowerCase() ===
                                user.address.toLowerCase() && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                  YOU
                                </span>
                              )
                            )}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {stat.userAddress.slice(0, 6)}...{stat.userAddress.slice(-4)}
                          </p>
                        </div>
                      </div>

                      {/* Колонка 3 — минуты */}
                      <div className="flex items-center gap-2 justify-end text-right">
                        <Image
                          src={"/icons/time.png"}
                          alt="Minutes upload"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <div>
                          <p className="text-sm font-medium uppercase">Minutes Uploaded</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {Math.floor(parseInt(stat.contributedSeconds) / 60)} min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">New leaderboard for this week</div>
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
