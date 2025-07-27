import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock } from "lucide-react";
import clsx from "clsx";

export default function ScratchCard({
  levelNum,
  isMilestone,
  isOpened,
  isUnlocked,
  onClaim,
}) {
  return (
    <Card
      className={clsx(
        "flex items-center justify-center w-12 h-12 md:w-14 md:h-14 font-bold text-lg transition-all duration-200 relative select-none",
        isMilestone
          ? "border-yellow-400 shadow-lg bg-yellow-100 text-black animate-pulse"
          : isOpened
          ? "border-pink-600 bg-pink-800 text-white"
          : isUnlocked
          ? "border-blue-400 bg-blue-950 text-blue-200 cursor-pointer hover:ring-4 hover:ring-blue-400/40 animate-pulse"
          : "border-gray-700 bg-gray-900 text-gray-600",
        "rounded-lg border-2 mb-2"
      )}
      onClick={() => isUnlocked && !isOpened && onClaim(levelNum)}
      tabIndex={isUnlocked && !isOpened ? 0 : -1}
      aria-disabled={!isUnlocked}
    >
      {isOpened ? (
        <CheckCircle className="w-6 h-6 text-green-400 animate-bounce" />
      ) : (
        levelNum
      )}
      {isMilestone && (
        <span className="absolute -top-2 -right-2">
          <Badge className="bg-yellow-400 text-black text-xs shadow">🎉</Badge>
        </span>
      )}
      {!isUnlocked && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock className="w-6 h-6 text-gray-600 opacity-70" />
        </span>
      )}
    </Card>
  );
}
