// src/components/ui/StatCard.tsx
"use client";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  trend,
  className,
}: StatCardProps) {
  const bgColor = iconColor.replace("text-", "bg-").replace("-400", "-400/10");
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 hover:border-gray-600 transition-all duration-200",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            bgColor,
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.value >= 0
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-red-400 bg-red-400/10",
            )}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
