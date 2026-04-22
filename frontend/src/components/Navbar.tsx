"use client";

import React from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { MobileNavigationHeader } from "@/components/application/app-navigation/base-components/mobile-header";
import { MainSidebarContent } from "@/components/layout/MainSidebarContent";

export const Navbar = () => {
    const { user, authenticated, logout } = useAuth();

    return (
        <>
            {/* Desktop Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 hidden border-b border-slate-100 bg-white/80 backdrop-blur-xl lg:block">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex items-center gap-1.5">
                            <UntitledLogoMinimal className="h-8 w-auto" />
                            <span className="text-[#2563EB] font-bold text-xl tracking-tight">
                                Indian Digital Nomads
                            </span>
                        </Link>
                        
                        <div className="flex items-center gap-8">
                            <Button href="#how-it-works" color="link-gray" size="sm">How it works</Button>
                            <Button href="#how-it-works" color="link-gray" size="sm">Browse Gigs</Button>
                            <Button href="#how-it-works" color="link-gray" size="sm">Success Stories</Button>
                            {/* <a href="#how-it-works" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand-solid">
                                How it Works
                            </a>
                            <a href="#" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand-solid">
                                Browse Gigs
                            </a>
                            <a href="#" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand-solid">
                                Success Stories
                            </a> */}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {authenticated ? (
                            <>
                                <Button 
                                    href={user?.role === "FREELANCER" ? "/freelancer/profile" : "/dashboard"}
                                    color="secondary"
                                    size="sm"
                                >
                                    {user?.role === "FREELANCER" ? "My Profile" : "Dashboard"}
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
                </div>
            </nav>

            {/* Mobile Header */}
            <div className="lg:hidden">
                <MobileNavigationHeader>
                    {authenticated ? (
                        <MainSidebarContent />
                    ) : (
                        <div className="flex h-full flex-col bg-white">
                            <div className="p-6 flex items-center gap-1.5">
                                <UntitledLogoMinimal className="h-8 w-auto" />
                                <span className="text-[#2563EB] font-bold text-lg tracking-tight">
                                    Indian Digital Nomads
                                </span>
                            </div>
                            <div className="flex-1 px-4 space-y-2">
                                <a href="#how-it-works" className="block p-3 text-lg font-semibold text-slate-900">How it Works</a>
                                <a href="#" className="block p-3 text-lg font-semibold text-slate-900">Browse Gigs</a>
                                <a href="#" className="block p-3 text-lg font-semibold text-slate-900 text-brand-solid">Success Stories</a>
                            </div>
                            <div className="p-6 border-t border-slate-200 flex flex-col gap-3">
                                <Button href="/auth" color="tertiary" className="w-full">Log in</Button>
                                <Button href="/auth" color="secondary" className="w-full">Sign up</Button>
                            </div>
                        </div>
                    )}
                </MobileNavigationHeader>
            </div>
        </>
    );
};

export default Navbar;
