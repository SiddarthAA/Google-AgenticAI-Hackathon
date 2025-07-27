"use client";

import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import Navbar from "../components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  Mail,
  Calendar,
  Award,
  Gift,
  Star,
  Target,
  CheckSquare,
  Square,
} from "lucide-react";

const CLOUDRUN_UPDATE_PREFERENCES_ENDPOINT =
  "https://bangalorenow-backend-59317430987.asia-south1.run.app/update-user-preferences";

const FILTER_TAGS = [
  "Traffic",
  "Weather",
  "Infrastructure",
  "Events",
  "Emergency",
  "Health",
  "Education",
  "Transport",
  "Power",
  "Other",
];

export const getUser = async (uid) => {
  const res = await fetch(
    `https://bangalorenow-backend-59317430987.asia-south1.run.app/user-profile/${uid}`
  );
  if (!res.ok) return null;
  return await res.json();
};

async function updateUserPreferences(uid, preferences) {
  const res = await fetch(CLOUDRUN_UPDATE_PREFERENCES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, preferences }), // ← correct format
  });
  if (!res.ok) throw new Error("Failed to update user preferences");
  return await res.json();
}

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [error, setError] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.uid) {
        try {
          const profile = await getUser(user.uid);
          setUserData({ ...profile, uid: user.uid }); // <-- Ensure uid is always present!
          setPreferences(
            Array.isArray(profile.preferences) ? profile.preferences : []
          );
        } catch (err) {
          setError("Error fetching user profile");
          setUserData(null);
        }
      } else {
        // If no user, stop loading
        setUserData(null);
      }
      setProfileLoading(false); // <-- Make sure to set this after any branch!
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie =
        "userPreferences=" +
        encodeURIComponent(JSON.stringify(preferences)) +
        "; path=/";
    }
  }, [preferences]);

  // Only disable if pending update or not loaded
  const disableButtons = pendingUpdate || !userData;

  // Toggle one preference
  const handlePreferenceToggle = async (tag) => {
    if (disableButtons) return;
    setError("");
    setPendingUpdate(true);

    const previousPreferences = preferences;
    let newPreferences;
    if (preferences.includes(tag)) {
      newPreferences = preferences.filter((pref) => pref !== tag);
    } else {
      newPreferences = [...preferences, tag];
    }

    setPreferences(newPreferences); // Fast UI

    try {
      await updateUserPreferences(userData.uid, newPreferences);
    } catch (err) {
      setPreferences(previousPreferences); // Rollback only if backend fails
      setError("Could not update preferences. Please try again.");
    } finally {
      setPendingUpdate(false);
    }
  };

  const handleSelectAll = async () => {
    if (disableButtons) return;
    setError("");
    setPendingUpdate(true);

    const previousPreferences = preferences;
    const newPreferences = FILTER_TAGS;

    setPreferences(newPreferences);

    try {
      await updateUserPreferences(userData.uid, newPreferences);
    } catch (err) {
      setPreferences(previousPreferences);
      setError("Failed to update preferences. Please try again.");
    } finally {
      setPendingUpdate(false);
    }
  };

  const handleDeselectAll = async () => {
    if (disableButtons) return;
    setError("");
    setPendingUpdate(true);

    const previousPreferences = preferences;
    const newPreferences = [];

    setPreferences(newPreferences);

    try {
      await updateUserPreferences(userData.uid, newPreferences);
    } catch (err) {
      setPreferences(previousPreferences);
      setError("Failed to update preferences. Please try again.");
    } finally {
      setPendingUpdate(false);
    }
  };

  if (profileLoading)
    return (
      <div className="text-white p-10 flex justify-center items-center min-h-screen bg-black">
        <div className="z-10">Loading...</div>
      </div>
    );

  if (!userData)
    return (
      <div className="text-white p-10 flex justify-center items-center min-h-screen bg-black">
        <div className="z-10">Error loading profile. Please sign in again.</div>
      </div>
    );

  const isPreferenceSelected = (tag) => preferences.includes(tag);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navbar />
      <div className="pt-20 px-4 pb-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="bg-black backdrop-blur-xl border border-white shadow-2xl rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="relative inline-block mb-2">
                      <Avatar className="w-28 h-28 border-4 border-blue-400/60 shadow-xl">
                        <AvatarImage
                          src={userData.avatar || "/placeholder.svg"}
                          alt={userData.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-extrabold">
                          {userData.name
                            ? userData.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : ""}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-2xl font-bold text-white flex items-center justify-center tracking-wide">
                        {userData.name}
                        {userData.verified && (
                          <Shield className="w-5 h-5 text-blue-400 ml-2" />
                        )}
                      </h2>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        {userData.premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold shadow-md">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm">
                          Level{" "}
                          {Math.floor((userData.events_reported || 0) / 10) + 1}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 font-sans">
                    <div className="flex items-center space-x-3 text-base">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-200 font-medium">
                        {userData.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-base">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-200 font-medium">
                        Joined {userData.joinDate}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Preferences selection */}
              <Card className="bg-black border border-blue-600/20 rounded-2xl shadow-xl">
                <CardContent className="p-8">
                  <div>
                    <label className="block text-xl font-semibold text-gray-200 mb-4 tracking-wide">
                      Choose your interests
                    </label>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {FILTER_TAGS.map((tag) => {
                        const selected = isPreferenceSelected(tag);
                        return (
                          <Button
                            type="button"
                            key={tag}
                            onClick={() => handlePreferenceToggle(tag)}
                            disabled={disableButtons}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full border shadow-lg
                              ${
                                selected
                                  ? "bg-green-500 border-green-500 text-white font-bold scale-105"
                                  : "bg-white/5 border-white/20 text-gray-300 font-semibold hover:scale-105 hover:bg-blue-800/20 hover:text-white hover:shadow-lg"
                              }
                              ${
                                disableButtons
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                              transition-all duration-150 text-base`}
                            variant="outline"
                          >
                            {selected ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mb-4">
                      <Button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={disableButtons}
                        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-full shadow-md transition
                          ${
                            disableButtons
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                      >
                        {pendingUpdate ? "Updating..." : "Select All"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={disableButtons}
                        className={`bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded-full shadow-md transition
                          ${
                            disableButtons
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                      >
                        {pendingUpdate ? "Updating..." : "Deselect All"}
                      </Button>
                    </div>
                    {error && (
                      <div className="text-red-400 font-bold mb-4">{error}</div>
                    )}
                    <p className="text-gray-400 text-sm mt-4 font-sans">
                      Your preferences are instantly saved. Select/deselect any
                      category to customize your experience.
                      {preferences.length > 0 && (
                        <span className="block mt-2 text-blue-400">
                          Currently selected: {preferences.join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Events Reported",
                    value: userData.events_reported || 0,
                    icon: Target,
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    label: "Rewards Earned",
                    value: userData.reward_points || 0,
                    icon: Gift,
                    color: "from-green-500 to-green-600",
                  },
                  {
                    label: "Confidence Score",
                    value: `${userData.confidence_score || 0}%`,
                    icon: Award,
                    color: "from-pink-500 to-pink-600",
                  },
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card key={index} className="bg-black rounded-xl shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-12 h-12 rounded-lg bg-black ${stat.color} flex items-center justify-center shadow-lg`}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="text-3xl font-extrabold text-white mb-1 tracking-wide font-sans">
                          {stat.value}
                        </div>
                        <div className="text-base text-gray-400 font-semibold font-sans">
                          {stat.label}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
