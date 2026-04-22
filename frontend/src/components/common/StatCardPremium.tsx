"use client";

import React from "react";
import { TrendUp02, TrendDown02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

interface StatCardProps {
    label: string;
    value: string;
    suffix?: string;
    trend?: string;
    isTrendUp?: boolean;
    color?: "brand" | "error" | "success" | "gray";
}

export const StatCardPremium = ({
    label,
    value,
    suffix,
    trend,
    isTrendUp = true,
    color = "brand"
}: StatCardProps) => {
    const TrendIcon = isTrendUp ? TrendUp02 : TrendDown02;
    const trendColor = isTrendUp ? "success" : "error";

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                {trend && (
                    <Badge color={trendColor} size="sm" type="pill-color" className="gap-1">
                        <TrendIcon className="size-3" />
                        {trend}
                    </Badge>
                )}
            </div>
            
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</span>
                {suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
            </div>
        </div>
    );
};
