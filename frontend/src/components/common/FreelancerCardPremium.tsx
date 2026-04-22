"use client";

import React from "react";
import { Star01, MarkerPin01, MessageChatSquare, Bookmark } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";

interface FreelancerCardProps {
    data: {
        name: string;
        role: string;
        match: string;
        rating: string;
        dist: string;
        img: string;
    };
}

export const FreelancerCardPremium = ({ data }: FreelancerCardProps) => {
    const { name, role, match, rating, dist, img } = data;

    return (
        <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <Avatar
                    src={img}
                    size="xl"
                    alt={name}
                    status="online"
                    border
                    className="mb-4"
                />
                <Badge color="brand" size="sm" type="pill-color" className="mt-1">
                    {match} Match
                </Badge>
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                <p className="text-sm font-medium text-slate-500">{role}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <Star01 className="size-4 text-warning-500 fill-warning-500" />
                    <span className="text-slate-900">{rating}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <MarkerPin01 className="size-4" />
                    <span>{dist}</span>
                </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <Button className="flex-1" color="primary" size="md" iconLeading={MessageChatSquare}>
                    Message
                </Button>
                
                <Tooltip title="Save for later">
                    <Button 
                        color="secondary" 
                        size="md" 
                        aria-label="Save freelancer"
                        iconLeading={Bookmark}
                    />
                </Tooltip>
            </div>
        </div>
    );
};
