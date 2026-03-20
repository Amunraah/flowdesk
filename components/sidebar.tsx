"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  FileText,
  Mic,
  Menu,
  X,
  Zap,
  Package,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode } from "@/hooks/useMode";
import { ModeSwitcher } from "@/components/mode-switcher";

// YouTube-pipeline
const youtubeItems = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/brainstorm", label: "Brainstorm", icon: Lightbulb },
  { href: "/trends",     label: "Trends",     icon: TrendingUp },
  { href: "/script",     label: "Script",     icon: FileText },
  { href: "/voice",      label: "Voice",      icon: Mic },
];

// Dropshipping-pipeline
const dropshippingItems = [
  { href: "/dropshipping", label: "Studio", icon: Package },
];

// Verktyg-sektion (alltid synlig)
const toolItems = [
  { href: "/prompts", label: "Prompt Library", icon: BookOpen },
];


type NavItem = { href: string; label: string; icon: React.ElementType };

function NavSection({
  label,
  items,
  pathname,
  onClose,
  activeColor = "indigo",
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onClose?: () => void;
  activeColor?: "indigo" | "cyan" | "emerald" | "violet";
}) {
  const colors = {
    indigo:  { bg: "bg-indigo-600/15",  text: "text-indigo-300",  icon: "text-indigo-400",  dot: "bg-indigo-400" },
    cyan:    { bg: "bg-cyan-600/15",    text: "text-cyan-300",    icon: "text-cyan-400",    dot: "bg-cyan-400" },
    emerald: { bg: "bg-emerald-600/15", text: "text-emerald-300", icon: "text-emerald-400", dot: "bg-emerald-400" },
    violet:  { bg: "bg-violet-600/15",  text: "text-violet-300",  icon: "text-violet-400",  dot: "bg-violet-400" },
  };
  const c = colors[activeColor];

  return (
    <div>
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? `${c.bg} ${c.text}`
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
              )}
            >
              <Icon size={15} className={isActive ? c.icon : "text-zinc-500"} />
              {itemLabel}
              {isActive && <span className={`ml-auto h-1.5 w-1.5 rounded-full ${c.dot}`} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavContent({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  const { mode } = useMode();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Zap size={13} className="text-white fill-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">Flowdesk</span>
      </div>

      {/* Mode Switcher */}
      <div className="border-b border-zinc-800 shrink-0">
        <ModeSwitcher />
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-4">

        {mode === "youtube" && (
          <NavSection
            label="YouTube"
            items={youtubeItems}
            pathname={pathname}
            onClose={onClose}
            activeColor="indigo"
          />
        )}

        {mode === "dropship" && (
          <NavSection
            label="Dropshipping"
            items={dropshippingItems}
            pathname={pathname}
            onClose={onClose}
            activeColor="cyan"
          />
        )}

        {/* Verktyg — alltid synlig */}
        <NavSection
          label="Verktyg"
          items={toolItems}
          pathname={pathname}
          onClose={onClose}
          activeColor="emerald"
        />

      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Flowdesk v1.0 · llama3.1 · qwen3
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — fixed */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[220px] flex-col bg-zinc-950 border-r border-zinc-800 z-40">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
        aria-label="Open navigation"
      >
        <Menu size={15} />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar — slides in */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-[220px] flex flex-col bg-zinc-950 border-r border-zinc-800 z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 z-10"
          aria-label="Close navigation"
        >
          <X size={15} />
        </button>
        <NavContent pathname={pathname} onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
