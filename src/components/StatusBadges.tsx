import React from "react";

export function AssetStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Maintenance: "bg-amber-50 text-amber-800 ring-amber-600/25",
    Standby: "bg-sky-50 text-sky-700 ring-sky-600/20",
    Decommissioned: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  const dotStyles: Record<string, string> = {
    Active: "bg-emerald-500",
    Maintenance: "bg-amber-500",
    Standby: "bg-sky-500",
    Decommissioned: "bg-slate-400",
  };

  const cls = styles[status] || "bg-slate-100 text-slate-700 ring-slate-500/20";
  const dot = dotStyles[status] || "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export function DocumentCategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    "PM Report": "bg-blue-50 text-blue-700 ring-blue-700/15",
    Infrastruktur: "bg-indigo-50 text-indigo-700 ring-indigo-700/15",
    "Vendor/Logistik": "bg-amber-50 text-amber-800 ring-amber-700/20",
    Administrasi: "bg-slate-100 text-slate-700 ring-slate-600/15",
  };

  const cls = styles[category] || "bg-slate-100 text-slate-700 ring-slate-600/15";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}
    >
      {category}
    </span>
  );
}

export function LocationBadge({ location }: { location: string }) {
  const isRagunan = location === "GTI Ragunan";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
        isRagunan
          ? "bg-teal-50 text-teal-800 ring-teal-700/15"
          : "bg-cyan-50 text-cyan-800 ring-cyan-700/15"
      }`}
    >
      {location}
    </span>
  );
}
