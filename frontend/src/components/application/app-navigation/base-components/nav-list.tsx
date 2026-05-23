"use client";

import { useState } from "react";
import { cx } from "@/utils/cx";
import type { NavItemDividerType, NavItemType } from "../config";
import { NavItemBase } from "./nav-item";

interface NavListProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** Additional CSS classes to apply to the list. */
    className?: string;
    /** List of items to display. */
    items: (NavItemType | NavItemDividerType)[];
}

const RecursiveNavItem = ({ item, activeUrl, depth = 0 }: { item: any; activeUrl?: string; depth?: number }) => {
    const hasChildren = item.items && item.items.length > 0;

    if (hasChildren) {
        return (
            <details
                className="appearance-none py-0.25"
            >
                <NavItemBase href={item.href} badge={item.badge} icon={item.icon} type="collapsible">
                    {item.label}
                </NavItemBase>

                <dd className="pl-4 border-l border-slate-100 mt-1">
                    <ul>
                        {item.items.map((childItem: any) => (
                            <li key={childItem.label} className="py-0.25">
                                <RecursiveNavItem item={childItem} activeUrl={activeUrl} depth={depth + 1} />
                            </li>
                        ))}
                    </ul>
                </dd>
            </details>
        );
    }

    return (
        <NavItemBase
            type={depth > 0 ? "collapsible-child" : "link"}
            badge={item.badge}
            icon={item.icon}
            href={item.href}
            current={activeUrl === item.href}
        >
            {item.label}
        </NavItemBase>
    );
};

export const NavList = ({ activeUrl, items, className }: NavListProps) => {
    return (
        <ul className={cx("flex flex-col px-4 pt-5", className)}>
            {items.map((item, index) => {
                if ("divider" in item && item.divider) {
                    return (
                        <li key={index} className="w-full px-0.5 py-2">
                            <hr className="h-px w-full border-none bg-slate-200" />
                        </li>
                    );
                }

                return (
                    <li key={item.label || index} className="py-px">
                        <RecursiveNavItem item={item} activeUrl={activeUrl} />
                    </li>
                );
            })}
        </ul>
    );
};
