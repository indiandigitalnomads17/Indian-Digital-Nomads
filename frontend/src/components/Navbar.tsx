"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";

export const Navbar = () => {
    const { user, authenticated, logout } = useAuth();

    const items = [
        { label: "How it works", href: "#how-it-works" },
        { label: "Browse Talent", href: "/talent" }, 
        { label: "Browse Jobs", href: "/jobs" },     
        { label: "Browse Businesses", href: "/businesses" },
        { label: "Success Stories", href: "#how-it-works" },
    ];

    const actions = (
        <div className="flex items-center gap-3">
            {authenticated ? (
                <>
                    <Button 
                        href={user?.role === "FREELANCER" ? "/freelancer/profile" : "/client/profile"}
                        color="secondary"
                        size="sm"
                    >
                        My Profile
                    </Button>
                    <Button 
                        onClick={logout}
                        color="tertiary-destructive"
                        size="sm"
                    >
                        Logout
                    </Button>
                </>
            ) : (
                <>
                    <Button href="/auth" color="tertiary" size="sm">
                        Log in
                    </Button>
                    <Button href="/auth" color="secondary" size="sm">
                        Sign up
                    </Button>
                </>
            )}
        </div>
    );

    const logo = (
        <div className="flex items-center gap-1.5">
            <UntitledLogoMinimal className="h-8 w-auto" />
            <span className="text-[#2563EB] font-bold text-xl tracking-tight">
                Indian Digital Nomads
            </span>
        </div>
    );

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
            <HeaderNavigationBase
                items={items}
                actions={actions}
                logo={logo}
                hideBorder
            />
        </div>
    );
};

export default Navbar;