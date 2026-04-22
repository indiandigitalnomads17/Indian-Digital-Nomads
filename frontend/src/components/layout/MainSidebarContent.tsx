"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
    Home01,
    Briefcase01,
    Plus,
    CreditCard01,
    User01,
    File02,
    MessageChatSquare,
    Coins01,
    HelpCircle,
    Settings01,
} from "@untitledui/icons";
import useAuth from "@/hooks/useAuth";
import { NavList } from "@/components/application/app-navigation/base-components/nav-list";
import { NavAccountCard } from "@/components/application/app-navigation/base-components/nav-account-card";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import type { NavItemType } from "@/components/application/app-navigation/config";

export const MainSidebarContent = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isClient = user?.role === "CLIENT";

    const clientItems: NavItemType[] = [
        { label: "Dashboard", href: "/dashboard", icon: Home01 },
        { label: "Active Gigs", href: "/dashboard/active", icon: Briefcase01 },
        { label: "Post a Gig", href: "/dashboard/post-gig", icon: Plus },
        { label: "Payments", href: "/dashboard/payments", icon: CreditCard01 },
    ];

    const freelancerItems: NavItemType[] = [
        { label: "Dashboard", href: "/freelancer", icon: Home01 },
        { label: "My Profile", href: "/freelancer/profile", icon: User01 },
        { label: "My Applications", href: "/freelancer/applications", icon: File02 },
        { label: "Messages", href: "/freelancer/messages", icon: MessageChatSquare },
        { label: "Earnings", href: "/freelancer/earnings", icon: Coins01 },
    ];

    const secondaryItems: NavItemType[] = [
        { label: "Help Center", href: "/help", icon: HelpCircle },
        { label: "Settings", href: "/settings", icon: Settings01 },
    ];

    const currentItems = isClient ? clientItems : freelancerItems;

    const navAccountItems = [
        {
            id: user?.id || "user",
            name: user?.fullName || "Guest User",
            email: user?.email || "guest@localgigs.com",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "GU")}&background=0D8ABC&color=fff`,
            status: "online" as const,
        },
    ];

    return (
        <div className="flex h-full flex-col bg-white h-screen border-r border-slate-200">
            <div className="p-6">
                <UntitledLogo className="h-8" />
            </div>

            <div className="flex-1 overflow-y-auto">
                <NavList activeUrl={pathname} items={currentItems} />
                
                <div className="mt-4 px-4">
                    <hr className="h-px w-full border-none bg-slate-200" />
                </div>

                <NavList activeUrl={pathname} items={secondaryItems} />
            </div>

            <div className="p-4 border-t border-slate-200 space-y-4">
                <NavAccountCard 
                    selectedAccountId={user?.id || "user"}
                    items={navAccountItems}
                    onLogout={logout}
                />
            </div>
        </div>
    );
};
