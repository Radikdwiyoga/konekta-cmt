"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Server,
  Menu,
  X,
  HardDrive,
  ShieldCheck,
  Building2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    description: "Ringkasan operasional",
    icon: LayoutDashboard,
  },
  {
    href: "/documents",
    label: "Document Hub",
    description: "PM, SOP & arsip Drive",
    icon: FileText,
  },
  {
    href: "/assets",
    label: "Asset & Host Directory",
    description: "Server, Storage & WWN",
    icon: Server,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-white">
              Konekta MCT Center
            </div>
            <div className="truncate text-[11px] font-medium text-slate-400">
              Maintenance Computes
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu navigasi"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Module Indicator */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Modul 1 • Smart Hub
        </p>
      </div>

      {/* Navigation */}
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate leading-tight">{item.label}</div>
                <div
                  className={`truncate text-[11px] leading-tight mt-0.5 ${
                    active ? "text-blue-100" : "text-slate-500 group-hover:text-slate-400"
                  }`}
                >
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Data Center Sites Footer */}
      <div className="border-t border-slate-800/80 p-3.5 space-y-2.5">
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Active Data Centers</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              GTI Ragunan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ODC Sentul
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            Internal Portal
          </span>
          <span className="font-mono-tech text-[10px]">v1.0 MVP</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:border-r lg:border-slate-800">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Mobile Top Navigation Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
              className="rounded-md border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
                <HardDrive className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Konekta MCT Center
              </span>
            </div>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            MCT Ops
          </span>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
