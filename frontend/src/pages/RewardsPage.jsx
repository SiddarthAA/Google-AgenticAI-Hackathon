"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Target,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Gift,
  Star,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth } from "../services/firebase";

const rewardMessages = [
  null,
  "You won ₹10!",
  "Coffee Coupon ☕",
  "10% Cashback",
  "Movie Ticket 🎬",
  "Bonus Points",
  "Surprise Gift 🌟",
  "Pizza Coupon 🍕",
  "Special Day!",
  "Shopping Discount 🛒",
  "Grand Reward 🎉",
];

const STREAK_WINDOW = 7;
const TOTAL_REWARDS = 100;

export default function RewardsPage() {
  const [user, setUser] = useState(null);
  const [userLevel, setUserLevel] = useState(1);
  const [claimedRewards, setClaimedRewards] = useState([]); // [{levelNum, message, claimedAt}]
  const [dialog, setDialog] = useState({ open: false, levelNum: null });
  const [startIdx, setStartIdx] = useState(0);

  // Fetch user and user's rewards from backend
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile for signalsReported
        const ures = await fetch(
          `http://localhost:4000/api/user/${firebaseUser.uid}`
        );
        if (ures.ok) {
          const udata = await ures.json();
          setUserLevel(udata.signalsReported || 1);
        }
        // Fetch claimed rewards
        const rres = await fetch(
          `http://localhost:4000/api/reward/${firebaseUser.uid}`
        );
        if (rres.ok) {
          const rewards = await rres.json();
          setClaimedRewards(rewards);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Open dialog for reward
  const handleClaim = (levelNum) => {
    setDialog({ open: true, levelNum });
  };

  // Mark as claimed and update DB
  const handleOpenReward = async () => {
    if (!user || !dialog.levelNum) return;
    try {
      // Post to /api/reward
      const msg =
        rewardMessages[dialog.levelNum % rewardMessages.length] ||
        "🎁 Mystery Reward";
      const res = await fetch("http://localhost:4000/api/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          levelNum: dialog.levelNum,
          message: msg,
        }),
      });
      if (res.ok) {
        const reward = await res.json();
        setClaimedRewards((prev) => [...prev, reward]);
      }
    } catch (e) {}
    setDialog({ open: false, levelNum: null });
  };

  const handleDialogClose = () => setDialog({ open: false, levelNum: null });

  const canLeft = startIdx > 0;
  const canRight = startIdx + STREAK_WINDOW < TOTAL_REWARDS;

  // Calculate progress
  const progressPercentage = (userLevel / TOTAL_REWARDS) * 100;
  const claimedLevels = claimedRewards.map((r) => r.levelNum);

  // Opened Rewards grid
  const openedRewardCards = claimedRewards
    .sort((a, b) => a.levelNum - b.levelNum)
    .map((reward) => {
      const msg = reward.message || "🎁 Mystery Reward";
      const isMilestone = reward.levelNum % 10 === 0;
      return (
        <Card
          key={reward.levelNum}
          className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              {isMilestone ? (
                <Trophy className="w-6 h-6 text-yellow-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div className="font-semibold text-white text-sm mb-2">{msg}</div>
          </CardContent>
        </Card>
      );
    });

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-lg">
              Earn rewards for your daily engagement
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Your Progress
                  </h3>
                  <p className="text-gray-400">
                    Level {userLevel} of {TOTAL_REWARDS}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {claimedRewards.length}
                  </div>
                  <div className="text-sm text-gray-400">Rewards Claimed</div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Started</span>
                <span>{progressPercentage.toFixed(1)}% Complete</span>
              </div>
            </CardContent>
          </Card>

          {/* Streak Path */}
          <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  Daily Streak
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canLeft}
                    onClick={() => setStartIdx(startIdx - 1)}
                    className="text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canRight}
                    onClick={() => setStartIdx(startIdx + 1)}
                    className="text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center gap-3 overflow-hidden">
                {Array.from({ length: STREAK_WINDOW }).map((_, idx) => {
                  const num = startIdx + idx + 1;
                  if (num > TOTAL_REWARDS) return null;
                  const isOpened = claimedLevels.includes(num);
                  const isUnlocked = num <= userLevel;
                  const isMilestone = num % 10 === 0;
                  const isClaimable = isUnlocked && !isOpened;

                  return (
                    <div
                      key={num}
                      className={`relative group transition-transform duration-300 ${
                        isClaimable ? "hover:scale-110 hover:z-20" : ""
                      }`}
                    >
                      <Card
                        className={`
                          w-16 h-16 flex items-center justify-center font-bold text-lg transition-all duration-300 relative bg-opacity-70
                          ${
                            isMilestone
                              ? "border-2 border-yellow-400 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 shadow-lg shadow-yellow-400/25"
                              : isOpened
                              ? "border-2 border-green-400 bg-gradient-to-br from-green-400/20 to-emerald-400/20 shadow-lg shadow-green-400/25"
                              : isClaimable
                              ? "border-2 border-blue-400 bg-gradient-to-br from-blue-400/20 to-purple-400/20 shadow-lg shadow-blue-400/25 ring-2 ring-blue-400 ring-opacity-30"
                              : "border border-gray-600 bg-gray-800/50"
                          }
                        `}
                        onClick={() => isClaimable && handleClaim(num)}
                        tabIndex={isClaimable ? 0 : -1}
                        aria-disabled={!isUnlocked}
                      >
                        <CardContent className="p-0 flex items-center justify-center w-full h-full">
                          {isOpened ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : !isUnlocked ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                          ) : (
                            <span
                              className={
                                isMilestone ? "text-yellow-400" : "text-white"
                              }
                            >
                              {num}
                            </span>
                          )}
                        </CardContent>
                        {isMilestone && (
                          <div className="absolute -top-2 -right-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                              <Star className="w-3 h-3 text-black" />
                            </div>
                          </div>
                        )}
                        {isClaimable && (
                          <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-opacity-10 pointer-events-none animate-fadein" />
                        )}
                      </Card>
                      {/* Tooltip for claimable */}
                      {isClaimable && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Click to claim
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Claimed Rewards */}
          <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Your Rewards ({claimedRewards.length})
              </h3>
              {openedRewardCards.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openedRewardCards}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">
                    No rewards claimed yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Start your streak to earn amazing rewards!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reward Claim Dialog */}
      <Dialog open={dialog.open} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/20 text-center max-w-sm">
          <DialogHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-pulse">
                <Gift className="w-10 h-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-white">
              Congratulations! 🎉
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-lg">
              {dialog.levelNum &&
                (rewardMessages[dialog.levelNum % rewardMessages.length] ||
                  "A surprise just for you!")}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={handleOpenReward}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 text-lg shadow-lg shadow-blue-500/25"
          >
            Claim Reward
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
