"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./layout";

interface AdminDesktopNavProps {
  navItems: NavItem[];
}

export function AdminDesktopNav({ navItems }: AdminDesktopNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand if current page matches a child
    const initial = new Set<string>();
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        initial.add(item.label);
      }
    });
    return initial;
  });

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
      {navItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.label);
        const isChildActive = item.children?.some(child => pathname.startsWith(child.href));
        const isActive = hasChildren ? false : pathname === item.href;
        const isParentHighlighted = hasChildren && isChildActive;

        if (hasChildren) {
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleExpand(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isParentHighlighted
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className={`w-5 h-5 shrink-0 ${isParentHighlighted ? "text-primary" : "text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="flex-1 text-left">{item.label}</span>
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isParentHighlighted ? "text-white/80" : "text-white/30"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Sub-items */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isExpanded ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-4 pl-4 border-l border-white/10 space-y-0.5">
                  {item.children!.map(child => {
                    const isChildItemActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isChildItemActive
                            ? "bg-primary/20 text-primary"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildItemActive ? "bg-primary" : "bg-white/20"}`} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
