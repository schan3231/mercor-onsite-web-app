"use client";

import { scoreColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const bg = scoreColor(score);
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  }[size];

  return (
    <div
      className={`${sizeClasses} ${bg} rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0`}
      title={`Score: ${score}/100`}
    >
      {score}
    </div>
  );
}
