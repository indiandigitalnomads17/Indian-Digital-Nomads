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
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

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

const SkillTreeDropdown = ({ skillTree, type }: { skillTree: SkillNode[]; type: "talents" | "jobs" }) => {
    const router = useRouter();
    const [activeCat, setActiveCat] = useState<SkillNode | null>(null);
    const [activeSub, setActiveSub] = useState<SkillNode | null>(null);
    const [activeLeaf, setActiveLeaf] = useState<SkillNode | null>(null);

    const handleMouseLeaveAll = () => {
        setActiveCat(null);
        setActiveSub(null);
        setActiveLeaf(null);
    };

    const handleSkillRouteSelection = (skillName: string) => {
        const routePath = type === "talents" ? "/talent" : "/jobs";
        router.push(`${routePath}?skill=${encodeURIComponent(skillName)}`);
        handleMouseLeaveAll();
    };

    if (!skillTree || skillTree.length === 0) return null;

    return (
        <div 
            onMouseLeave={handleMouseLeaveAll}
            className="absolute top-full left-0 pt-4 -mt-2 flex items-start pointer-events-none opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out z-[100]"
        >
            {/* Panel 1: Main Categories */}
            <div className="w-[260px] bg-white border border-slate-200 rounded-xl p-2 shadow-xl flex flex-col gap-0.5 pointer-events-auto max-h-[400px] overflow-y-auto">
                {skillTree.map((category) => (
                    <div 
                        key={category.id} 
                        onMouseEnter={() => { setActiveCat(category); setActiveSub(null); setActiveLeaf(null); }}
                        className="w-full"
                    >
                        <button
                            type="button"
                            onClick={() => handleSkillRouteSelection(category.name)}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${activeCat?.id === category.id ? 'bg-slate-100 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                            <span className="truncate mr-2">{category.name}</span>
                            {category.subSkills && category.subSkills.length > 0 && <ChevronRight className="size-3.5 text-slate-400 shrink-0" />}
                        </button>
                    </div>
                ))}
            </div>

            {/* Panel 2: Parent Skills */}
            {activeCat && activeCat.subSkills && activeCat.subSkills.length > 0 && (
                <div className="w-[260px] bg-white border border-slate-200 rounded-xl p-2 shadow-xl ml-1 flex flex-col gap-0.5 pointer-events-auto max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-left-2 duration-150">
                    {activeCat.subSkills.map((subSkill) => (
                        <div 
                            key={subSkill.id}
                            onMouseEnter={() => { setActiveSub(subSkill); setActiveLeaf(null); }}
                            className="w-full"
                        >
                            <button
                                type="button"
                                onClick={() => handleSkillRouteSelection(subSkill.name)}
                                className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${activeSub?.id === subSkill.id ? 'bg-slate-100 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="truncate mr-2">{subSkill.name}</span>
                                {subSkill.subSkills && subSkill.subSkills.length > 0 && <ChevronRight className="size-3.5 text-slate-400 shrink-0" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Panel 3: Sub-skills */}
            {activeSub && activeSub.subSkills && activeSub.subSkills.length > 0 && (
                <div className="w-[260px] bg-white border border-slate-200 rounded-xl p-2 shadow-xl ml-1 flex flex-col gap-0.5 pointer-events-auto max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-left-2 duration-150">
                    {activeSub.subSkills.map((leafSkill) => (
                        <div 
                            key={leafSkill.id}
                            onMouseEnter={() => setActiveLeaf(leafSkill)}
                            className="w-full"
                        >
                            <button
                                type="button"
                                onClick={() => handleSkillRouteSelection(leafSkill.name)}
                                className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${activeLeaf?.id === leafSkill.id ? 'bg-slate-100 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="truncate mr-2">{leafSkill.name}</span>
                                {leafSkill.subSkills && leafSkill.subSkills.length > 0 && <ChevronRight className="size-3.5 text-slate-400 shrink-0" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Panel 4: Atomic Specializations */}
            {activeLeaf && activeLeaf.subSkills && activeLeaf.subSkills.length > 0 && (
                <div className="w-[260px] bg-white border border-slate-200 rounded-xl p-2 shadow-xl ml-1 flex flex-col gap-0.5 pointer-events-auto max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-left-2 duration-150">
                    {activeLeaf.subSkills.map((atomicSkill) => (
                        <button
                            key={atomicSkill.id}
                            type="button"
                            onClick={() => handleSkillRouteSelection(atomicSkill.name)}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg text-left hover:bg-slate-50 hover:text-blue-600 transition-colors truncate"
                        >
                            {atomicSkill.name}
                        </button>
                    ))}
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

    const fetchSkillsTree = useCallback(() => {
        api.get("/api/v1/skills/tree")
            .then((res) => {
                if (res.data?.success) {
                    setSkillTree(res.data.data);
                }
            })
            .catch((err) => console.error("Failed to load skills tree matrix:", err));
    }, []);

    useEffect(() => {
        fetchSkillsTree();
    }, [fetchSkillsTree]);

    useEffect(() => {
        const handleNavigationRestore = () => {
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

    return (
        <>
            <MobileNavigationHeader logo={logo}>
                <aside className="flex h-full max-w-full flex-col justify-between overflow-auto bg-white pt-4">
                    <div className="flex flex-col gap-5 px-4">
                        {logo || <UntitledLogo className="h-6" />}
                    </div>
                    <NavList items={items} />
                </aside>
            </MobileNavigationHeader>

            <header className="max-lg:hidden w-full">
                <section className={cx("flex h-16 w-full items-center justify-center bg-transparent", !hideBorder && "border-b border-slate-100")}>
                    <div className={cx("flex w-full max-w-6xl mx-auto items-center pr-3 pl-4 md:px-8", centered && "gap-8")}>
                        <div className={cx("flex items-center", centered ? "flex-1" : "mr-4")}>
                            <a aria-label="Go to homepage" href="/" className="rounded-xs outline-focus-ring">
                                {logo || <UntitledLogo className="h-6" />}
                            </a>
                        </div>

                        <nav className="flex h-16 items-center">
                            <ul className="flex items-center gap-0.5 h-full">
                                {items.map((item) => {
                                    if (item.label === "Browse Talent") {
                                        return (
                                            /* FIXED: Reverted to passing labels inside children interpolation hooks */
                                            <li key={item.label} className="relative group h-full flex items-center">
                                                <NavButton current={isActive(item)} href={item.href}>
                                                    {item.label}
                                                </NavButton>
                                                <SkillTreeDropdown skillTree={skillTree} type="talents" />
                                            </li>
                                        );
                                    }
                                    if (item.label === "Browse Jobs") {
                                        return (
                                            <li key={item.label} className="relative group h-full flex items-center">
                                                <NavButton current={isActive(item)} href={item.href}>
                                                    {item.label}
                                                </NavButton>
                                                <SkillTreeDropdown skillTree={skillTree} type="jobs" />
                                            </li>
                                        );
                                    }
                                    return (
                                        <li key={item.label} className="h-full flex items-center">
                                            <NavButton current={isActive(item)} href={item.href}>
                                                {item.label}
                                            </NavButton>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className={cx("flex items-center gap-3", centered ? "flex-1 justify-end" : "ml-auto")}>
                            {actions}
                        </div>
                    </div>
                </section>
            </header>
        </>
    );
};