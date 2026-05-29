"use client";

import { type FC, type ReactNode, useState, useEffect, useCallback } from "react";
import { Bell01, ChevronRight, SearchLg, Settings01 } from "@untitledui/icons";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { DropdownAccountButton } from "@/components/base/dropdown/dropdown-account-button";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { cx } from "@/lib/utils/cx";
import { MobileNavigationHeader } from "./base-components/mobile-header";
import { NavAccountCard } from "./base-components/nav-account-card";
import { NavButton } from "./base-components/nav-button";
import { NavList } from "./base-components/nav-list";
import api from "@/lib/api";

import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/base/buttons/button";

interface SkillNode {
    id: string;
    name: string;
    tier: number;
    subSkills?: SkillNode[];
}

type NavItem = {
    label: string;
    href: string;
    current?: boolean;
    icon?: FC<{ className?: string }>;
    badge?: ReactNode;
    items?: NavItem[];
};

const isItemActive = (href: string, activeUrl?: string) => {
    if (!activeUrl || !href) return false;
    if (href === activeUrl) return true;
    if (href !== "/" && activeUrl.startsWith(href + "/")) return true;
    return false;
};

interface HeaderNavigationBaseProps {
    activeUrl?: string;
    items: NavItem[];
    subItems?: NavItem[];
    hideBorder?: boolean;
    logo?: ReactNode;
    actions?: ReactNode;
    centered?: boolean;
    secondaryType?: "buttons" | "tabs";
}

const DefaultActions = ({ activeUrl }: { activeUrl?: string }) => {
    return (
        <>
            <div className="flex gap-0.5">
                <NavButton current={activeUrl === "/search"} icon={SearchLg} label="Search" href="/search" tooltipPlacement="bottom" />
                <NavButton current={activeUrl === "/settings-01"} icon={Settings01} label="Settings" href="/settings-01" tooltipPlacement="bottom" />
                <div className="relative">
                    <NavButton
                        current={activeUrl === "/notifications-01"}
                        icon={Bell01}
                        label="Notifications"
                        href="/notifications-01"
                        tooltipPlacement="bottom"
                    />
                    <div className="absolute -top-0.25 -right-0.25 flex size-3.5 items-center justify-center rounded-full bg-fg-error-primary text-[10px] font-bold text-white">
                        2
                    </div>
                </div>
            </div>
            <DropdownAccountButton />
        </>
    );
};

const SkillTreeDropdown = ({ skillTree, type }: { skillTree: SkillNode[]; type: "talents" | "jobs" }) => {
    const [activeCat, setActiveCat] = useState<SkillNode | null>(null);
    const [activeSub, setActiveSub] = useState<SkillNode | null>(null);
    const [activeLeaf, setActiveLeaf] = useState<SkillNode | null>(null);

    const handleMouseLeaveAll = () => {
        setActiveCat(null);
        setActiveSub(null);
        setActiveLeaf(null);
    };

    // Resets dropdown state on browser back-navigation / history transitions
    useEffect(() => {
        const handleClear = () => handleMouseLeaveAll();
        
        window.addEventListener("pageshow", handleClear);
        window.addEventListener("popstate", handleClear);
        
        return () => {
            window.removeEventListener("pageshow", handleClear);
            window.removeEventListener("popstate", handleClear);
        };
    }, []);

    if (!skillTree || skillTree.length === 0) return null;

    const getBaseUrl = (itemType: "category" | "skill", id: string) => {
        return `/${type}?${itemType}=${id}`;
    };

    return (
        <div 
            onMouseLeave={handleMouseLeaveAll}
            className="absolute top-full left-0 mt-2 flex items-start pointer-events-none opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out z-[100]"
        >
            {/* Panel 1: Categories */}
            <div className="w-[540px] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-1">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
                    {skillTree.map((category) => (
                        <div 
                            key={category.id} 
                            onMouseEnter={() => {
                                setActiveCat(category);
                                setActiveSub(null);
                                setActiveLeaf(null);
                            }}
                            className="px-1"
                        >
                            <a
                                href={getBaseUrl("category", category.id)}
                                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-100 ${activeCat?.id === category.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span>{category.name}</span>
                                {category.subSkills && category.subSkills.length > 0 && (
                                    <ChevronRight className={`size-3.5 transition-colors ${activeCat?.id === category.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                )}
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel 2: Parent Skills */}
            {activeCat && activeCat.subSkills && activeCat.subSkills.length > 0 && (
                <div className="w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-2xl ml-2 flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto scrollbar-thin">
                        {activeCat.subSkills.map((subSkill) => (
                            <div 
                                key={subSkill.id}
                                onMouseEnter={() => {
                                    setActiveSub(subSkill);
                                    setActiveLeaf(null);
                                }}
                                className="px-1"
                            >
                                <a
                                    href={getBaseUrl("skill", subSkill.id)}
                                    className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-100 ${activeSub?.id === subSkill.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span>{subSkill.name}</span>
                                    {subSkill.subSkills && subSkill.subSkills.length > 0 && (
                                        <ChevronRight className={`size-3.5 transition-colors ${activeSub?.id === subSkill.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                    )}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Panel 3: Sub-skills */}
            {activeSub && activeSub.subSkills && activeSub.subSkills.length > 0 && (
                <div className="w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-2xl ml-2 flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto scrollbar-thin">
                        {activeSub.subSkills.map((leafSkill) => (
                            <div 
                                key={leafSkill.id}
                                onMouseEnter={() => {
                                    setActiveLeaf(leafSkill);
                                }}
                                className="px-1"
                            >
                                <a
                                    href={getBaseUrl("skill", leafSkill.id)}
                                    className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-100 ${activeLeaf?.id === leafSkill.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span>{leafSkill.name}</span>
                                    {leafSkill.subSkills && leafSkill.subSkills.length > 0 && (
                                        <ChevronRight className={`size-3.5 transition-colors ${activeLeaf?.id === leafSkill.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                    )}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Panel 4: Specific Leaf Nodes */}
            {activeLeaf && activeLeaf.subSkills && activeLeaf.subSkills.length > 0 && (
                <div className="w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-2xl ml-2 flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto scrollbar-thin">
                        {activeLeaf.subSkills.map((atomicSkill) => (
                            <div key={atomicSkill.id} className="px-1">
                                <a
                                    href={getBaseUrl("skill", atomicSkill.id)}
                                    className="block w-full px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-100"
                                >
                                    {atomicSkill.name}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const HeaderNavigationBase = ({
    activeUrl,
    items,
    subItems,
    hideBorder = false,
    logo,
    actions,
    centered = false,
    secondaryType = "buttons",
}: HeaderNavigationBaseProps) => {
    const { user, logout } = useAuth();
    const [skillTree, setSkillTree] = useState<SkillNode[]>([]);

    // 1. Wrapped fetch mechanism inside a useCallback so it can be called reliably
    const fetchSkillsTree = useCallback(() => {
        api.get("/api/v1/skills/tree")
            .then((res) => {
                if (res.data?.success) {
                    setSkillTree(res.data.data);
                }
            })
            .catch((err) => console.error("Failed to load skills tree matrix:", err));
    }, []);

    // Initial mount fetch
    useEffect(() => {
        fetchSkillsTree();
    }, [fetchSkillsTree]);

    // 2. Clear old state and re-fetch fresh data explicitly on history/navigation events
    useEffect(() => {
    // Typing the argument as a standard Event fixes the type mismatch completely
    const handleNavigationRestore = (event: Event) => {
        // Re-fetch if navigated via back/forward cache buttons
        setSkillTree([]); 
        fetchSkillsTree();
    };

    window.addEventListener("pageshow", handleNavigationRestore);
    window.addEventListener("popstate", handleNavigationRestore);

    return () => {
        window.removeEventListener("pageshow", handleNavigationRestore);
        window.removeEventListener("popstate", handleNavigationRestore);
    };
}, [fetchSkillsTree]);

    const isActive = (item: NavItem) => item.current ?? isItemActive(item.href, activeUrl);

    const activeParent = items.find((item) => isActive(item) || item.items?.some((sub) => isItemActive(sub.href, activeUrl)));
    const activeSubNavItems = subItems || activeParent?.items;

    const showSecondaryNav = activeSubNavItems && activeSubNavItems.length > 0;
    const hasCustomActions = actions !== undefined;

    const tabItems = showSecondaryNav
        ? activeSubNavItems.map((item) => ({
              id: item.label,
              children: item.label,
          }))
        : [];

    const activeTabKey = activeSubNavItems?.find((item) => isActive(item))?.label;

    return (
        <>
            <MobileNavigationHeader logo={logo}>
                <aside className="flex h-full max-w-full flex-col justify-between overflow-auto bg-white pt-4">
                    <div className="flex flex-col gap-5 px-4">
                        {logo || <UntitledLogo className="h-6" />}
                    </div>

                    <NavList items={items} />

                    <div className="mt-auto flex flex-col gap-3 p-4">
                        {user ? (
                            <NavAccountCard 
                                selectedAccountId={user.id || "user"}
                                items={[
                                    {
                                        id: user.id || "user",
                                        name: user.fullName || "Guest User",
                                        email: user.email || "guest@localgigs.com",
                                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "GU")}&background=0D8ABC&color=fff`,
                                        status: "online" as const,
                                    }
                                ]}
                                onLogout={logout}
                            />
                        ) : (
                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                                <Button href="/auth" color="tertiary" className="w-full justify-center">
                                    Log in
                                </Button>
                                <Button href="/auth" color="secondary" className="w-full justify-center">
                                    Sign up
                                </Button>
                            </div>
                        )}
                    </div>
                </aside>
            </MobileNavigationHeader>

            <header className="max-lg:hidden">
                <section
                    className={cx("flex h-16 w-full items-center justify-center bg-transparent", (!hideBorder || showSecondaryNav) && "border-b border-slate-100")}
                >
                    <div className={cx("flex w-full max-w-6xl mx-auto items-center pr-3 pl-4 md:px-8", centered && "gap-8")}>
                        <div className={cx("flex items-center", centered ? "flex-1" : "mr-4")}>
                            <a
                                aria-label="Go to homepage"
                                href="/"
                                className="rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                {logo || <UntitledLogo className="h-6" />}
                            </a>
                        </div>

                        <nav>
                            <ul className="flex items-center gap-0.5">
                                {items.map((item) => {
                                    if (item.label === "Browse Talent") {
                                        return (
                                            <li 
                                                key={item.label} 
                                                className="relative group"
                                                onMouseEnter={() => {
                                                    if (typeof window !== "undefined") {
                                                        window.dispatchEvent(new Event("popstate"));
                                                    }
                                                }}
                                            >
                                                <NavButton current={isActive(item)} href={item.href}>
                                                    {item.label}
                                                </NavButton>
                                                <SkillTreeDropdown skillTree={skillTree} type="talents" />
                                            </li>
                                        );
                                    }
                                    if (item.label === "Browse Jobs") {
                                        return (
                                            <li 
                                                key={item.label} 
                                                className="relative group"
                                                onMouseEnter={() => {
                                                    if (typeof window !== "undefined") {
                                                        window.dispatchEvent(new Event("popstate"));
                                                    }
                                                }}
                                            >
                                                <NavButton current={isActive(item)} href={item.href}>
                                                    {item.label}
                                                </NavButton>
                                                <SkillTreeDropdown skillTree={skillTree} type="jobs" />
                                            </li>
                                        );
                                    }
                                    return (
                                        <li key={item.label}>
                                            <NavButton current={isActive(item)} href={item.href}>
                                                {item.label}
                                            </NavButton>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className={cx("flex items-center gap-3", centered ? "flex-1 justify-end" : "ml-auto")}>
                            {hasCustomActions ? actions : <DefaultActions activeUrl={activeUrl} />}
                        </div>
                    </div>
                </section>

                {showSecondaryNav && (
                    <section className={cx("flex w-full items-center justify-center bg-white", !hideBorder && "border-b border-slate-100")}>
                        {secondaryType === "tabs" ? (
                            <div className="w-full max-w-6xl mx-auto px-8 pt-3">
                                <Tabs selectedKey={activeTabKey}>
                                    <TabList size="sm" type="underline" items={tabItems} className="-mb-px before:hidden" />
                                </Tabs>
                            </div>
                        ) : (
                            <div className={cx("flex h-16 w-full max-w-6xl mx-auto items-center gap-8 px-8", centered ? "justify-center" : "justify-between")}>
                                <nav>
                                    <ul className={cx("flex items-center gap-0.5", centered && "justify-center")}>
                                        {activeSubNavItems.map((item) => (
                                            <li key={item.label}>
                                                <NavButton href={item.href} current={isActive(item)}>
                                                    {item.label}
                                                </NavButton>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                {!centered && <Input shortcut aria-label="Search" placeholder="Search" icon={SearchLg} size="sm" className="max-w-70" />}
                            </div>
                        )}
                    </section>
                )}
            </header>
        </>
    );
};