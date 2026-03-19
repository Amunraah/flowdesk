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

// YouTube-pipeline
const youtubeItems = [
  { href: "/",           label: "Dashboard",    icon: LayoutDashboard },
  { href: "/brainstorm", label: "Brainstorm",   icon: Lightbulb },
  { href: "/trends",     label: "Trends",       icon: TrendingUp },
  { href: "/script",     label: "Script",       icon: FileText },
  { href: "/voice",      label: "Voice",        icon: Mic },
];

// Dropshipping-pipeline
const dropshippingItems = [
  { href: "/dropshipping", label: "Studio",     icon: Package },
];

// Verktyg-sektion
const toolItems = [
  { href: "/prompts", label: "Prompt Library", icon: BookOpen },
];

function NavContent({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Zap size={13} className="text-white fill-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">Flowdesk</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-4">

        {/* YouTube-sektion */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            YouTube
          </p>
          <div className="space-y-0.5">
            {youtubeItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-indigo-400" : "text-zinc-500"} />
                  {label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dropshipping-sektion */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Dropshipping
          </p>
          <div className="space-y-0.5">
            {dropshippingItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-cyan-600/15 text-cyan-300"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-cyan-400" : "text-zinc-500"} />
                  {label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Verktyg-sektion */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Verktyg
          </p>
          <div className="space-y-0.5">
            {toolItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-600/15 text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-emerald-400" : "text-zinc-500"} />
                  {label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </Link>
              );
            })}
          </div>
        </div>

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
