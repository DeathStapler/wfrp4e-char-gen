"use client";

import type { Wealth } from "@/lib/rules/wealth";

interface WealthDisplayProps {
  wealth: Wealth;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { wrapper: "gap-2 text-xs", label: "text-[10px]", value: "text-xs font-semibold" },
  md: { wrapper: "gap-3 text-sm", label: "text-xs", value: "text-sm font-semibold" },
  lg: { wrapper: "gap-4 text-base", label: "text-xs", value: "text-base font-bold" },
};

export function WealthDisplay({ wealth, size = "md" }: WealthDisplayProps) {
  const cls = sizeClasses[size];

  return (
    <div className={`flex items-baseline ${cls.wrapper}`}>
      {/* Gold Crowns */}
      <span>
        <span className="text-yellow-400 font-mono">{wealth.gold}</span>
        <span className={`text-yellow-700 ml-0.5 ${cls.label}`}> GC</span>
      </span>

      <span className="text-gray-400">·</span>

      {/* Silver Shillings */}
      <span>
        <span className="text-gray-300 font-mono">{wealth.silver}</span>
        <span className={`text-gray-400 ml-0.5 ${cls.label}`}>/–</span>
      </span>

      <span className="text-gray-400">·</span>

      {/* Brass Pennies */}
      <span>
        <span className="text-amber-500 font-mono">{wealth.brass}</span>
        <span className={`text-amber-800 ml-0.5 ${cls.label}`}>d</span>
      </span>
    </div>
  );
}
