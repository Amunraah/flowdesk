"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Mic,
  Lightbulb,
  Activity,
  Bot,
  FileAudio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "script" | "trend" | "brainstorm" | "voice";
  description: string;
  timestamp: number;
}

const typeColors: Record<ActivityItem["type"], string> = {
  script:    "text-violet-400",
  trend:     "text-indigo-400",
  brainstorm:"text-emerald-400",
  voice:     "text-orange-400",
};

const typeIcons: Record<ActivityItem["type"], React.ElementType> = {
  script:    FileText,
  trend:     TrendingUp,
  brainstorm:Lightbulb,
  voice:     Mic,
};

export default function DashboardPage() {
  const [scriptCount, setScriptCount]   = useState<number>(0);
  const [audioCount, setAudioCount]     = useState<number>(0);
  const [trendsCount, setTrendsCount]   = useState<number>(0);
  const [activity, setActivity]         = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.json())
      .then((d) => setScriptCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    fetch("/api/audio")
      .then((r) => r.json())
      .then((d) => setAudioCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    const tc = localStorage.getItem("fd_trends_count");
    setTrendsCount(tc ? parseInt(tc, 10) : 0);

    const acts = localStorage.getItem("fd_activity");
    setActivity(acts ? (JSON.parse(acts) as ActivityItem[]) : []);
  }, []);

  const stats = [
    {
      label: "Scripts Saved",
      value: scriptCount,
      icon: FileText,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Trends Generated",
      value: trendsCount,
      icon: TrendingUp,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "MP3 Files",
      value: audioCount,
      icon: FileAudio,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Active Agents",
      value: 0,
      icon: Bot,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const quickActions = [
    {
      href: "/brainstorm",
      label: "Brainstorm Niches",
      icon: Lightbulb,
      desc: "Find profitable YouTube niches",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      bg: "hover:bg-emerald-500/5",
      iconColor: "text-emerald-400",
    },
    {
      href: "/trends",
      label: "Find Trends",
      icon: TrendingUp,
      desc: "Discover trending video ideas",
      border: "border-indigo-500/20 hover:border-indigo-500/40",
      bg: "hover:bg-indigo-500/5",
      iconColor: "text-indigo-400",
    },
    {
      href: "/script",
      label: "Write Script",
      icon: FileText,
      desc: "Generate AI video script",
      border: "border-violet-500/20 hover:border-violet-500/40",
      bg: "hover:bg-violet-500/5",
      iconColor: "text-violet-400",
    },
    {
      href: "/voice",
      label: "Generate Voice",
      icon: Mic,
      desc: "Convert script to MP3 audio",
      border: "border-orange-500/20 hover:border-orange-500/40",
      bg: "hover:bg-orange-500/5",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <main className="p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Your autonomous YouTube content pipeline
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg mb-3",
                bg
              )}
            >
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(
            ({ href, label, icon: Icon, desc, border, bg, iconColor }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-xl border bg-zinc-900 p-4 transition-colors",
                  border,
                  bg
                )}
              >
                <Icon size={18} className={cn("mb-2", iconColor)} />
                <p className="text-sm font-semibold text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-2">
              <Activity size={22} className="text-zinc-700" />
              <p className="text-sm text-zinc-600">
                No activity yet — start with Brainstorm!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {activity.slice(0, 10).map((item) => {
                const Icon = typeIcons[item.type] ?? Activity;
                const color = typeColors[item.type] ?? "text-zinc-400";
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Icon size={13} className={color} />
                    <p className="text-sm text-zinc-300 flex-1 truncate">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-zinc-600 shrink-0">
                      {new Date(item.timestamp).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
