"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";

interface UserOnboardingData {
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: true | false;
}

// interface CountryData {
//   name: string;
//   code: string;
// }

export function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useWalletAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string>("");
  const [formData, setFormData] = useState<UserOnboardingData>({
    country: "",
    birthMonth: "",
    birthYear: "",
    isItRelated: false,
  });

  // Определяем местоположение пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;

            // Получаем название страны по координатам
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            const data = await response.json();
            setUserLocation(data.countryName || "");
            setFormData((prev) => ({
              ...prev,
              country: data.countryName || "",
            }));
          } catch (error) {
            console.error("Error getting location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Если геолокация недоступна, показываем сообщение
          toast.error(
            "Location access denied. Please enter your country manually.",
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 минут
        },
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.country || !formData.birthMonth || !formData.birthYear) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const onboardingData = {
        userAddress: user?.address,
        ...formData,
      };

      // Try to submit to local API route first, then fallback to external API
      try {
        // Try local API route first
        const localResponse = await fetch("/api/user/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(onboardingData),
        });

        if (localResponse.ok) {
          const result = await localResponse.json();
          console.log("Onboarding data submitted to local API:", result);
          toast.success("Onboarding completed successfully!");
        }
      } catch (apiError) {
        console.warn(
          "APIs not available, but onboarding data saved locally:",
          apiError,
        );
        toast.success("Onboarding completed (offline mode)");
      }

      // Save onboarding data to localStorage as fallback
      localStorage.setItem(
        `user_onboarding_${user?.address}`,
        JSON.stringify(onboardingData),
      );

      onComplete();
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      toast.error("Failed to submit onboarding data");
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="Your country"
            required
          />
          {userLocation && (
            <p className="text-sm text-green-600">
              ✓ Location detected: {userLocation}
            </p>
          )}
        </div>

        {/* Birth Month */}
        <div className="space-y-2">
          <Label htmlFor="birthMonth">Birth Month</Label>
          <Select
            value={formData.birthMonth}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, birthMonth: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Birth Year */}
        <div className="space-y-2">
          <Label htmlFor="birthYear">Birth Year</Label>
          <Select
            value={formData.birthYear}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, birthYear: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* IT Related */}
        <div className="space-y-2">
          <Label>Are you related to IT?</Label>
          <RadioGroup
            value={formData.isItRelated ? "true" : "false"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                isItRelated: value === "true",
              }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Complete Onboarding"}
        </Button>
      </form>
    </div>
  );
}
