import React from "react";
import Link from "next/link";
import {
  FileText,
  Server,
  Wrench,
  Cloud,
  ArrowUpRight,
  Building2,
  FolderKanban,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_CATEGORIES,
  DATA_CENTER_LOCATIONS,
  formatDateId,
  formatDateTimeId,
} from "@/lib/constants";
import { getDriveConfigStatus } from "@/lib/google-drive";
import {
  AssetStatusBadge,
  DocumentCategoryBadge,
  LocationBadge,
} from "@/components/StatusBadges";
import { DriveSyncButton } from "@/components/DriveSyncButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [documents, assets, latestSync] = await Promise.all([
    prisma.document.findMany({
      orderBy: [{ documentDate: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.asset.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.syncLog.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const driveConfig = getDriveConfigStatus();

  const totalDocuments = documents.length;
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === "Active").length;
  const maintenanceAssets = assets.filter((a) => a.status === "Maintenance").length;
  const standbyAssets = assets.filter((a) => a.status === "Standby").length;
  const decomAssets = assets.filter((a) => a.status === "Decommissioned").length;
  const uniqueClusters = new Set(assets.map((a) => a.cluster)).size;

  const docsByCategory = DOCUMENT_CATEGORIES.map((category) => ({
    category,
    count: documents.filter((d) => d.category === category).length,
  }));

  const assetsByLocation = DATA_CENTER_LOCATIONS.map((location) => {
    const inLoc = assets.filter((a) => a.location === location);
    return {
      location,
      total: inLoc.length,
      active: inLoc.filter((a) => a.status === "Active").length,
      maintenance: inLoc.filter((a) => a.status === "Maintenance").length,
      docs: documents.filter((d) => d.location === location).length,
    };
  });

  const attentionAssets = assets.filter(
    (a) => a.status === "Maintenance" || a.status === "Standby"
  );
  const recentDocuments = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Modul 1 • Smart Document & Asset Hub
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard Operasional MCT
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan inventaris compute, storage, dan dokumentasi teknis tim Maintenance Computes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DriveSyncButton />
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
          >
            <Server className="h-3.5 w-3.5" />
            <span>Buka Asset Directory</span>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <section
        aria-label="Ringkasan metrik utama"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Dokumen Terindeks</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">
              {totalDocuments}
            </span>
            <span className="text-xs text-slate-500">di 4 kategori</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>GTI & ODC Repository</span>
            <Link
              href="/documents"
              className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:text-blue-700"
            >
              Jelajahi <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Perangkat Compute & Storage</span>
            <Server className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">
              {totalAssets}
            </span>
            <span className="text-xs text-slate-500">di {uniqueClusters} cluster</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span className="font-medium text-emerald-700">{activeAssets} Active</span>
            <Link
              href="/assets"
              className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:text-blue-700"
            >
              Kelola <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Perlu Perhatian / Maintenance</span>
            <Wrench className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">
              {maintenanceAssets}
            </span>
            <span className="text-xs text-slate-500">
              Maintenance • {standbyAssets} Standby
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span>Decommissioned: {decomAssets}</span>
            <Link
              href="/assets?status=Maintenance"
              className="inline-flex items-center gap-0.5 font-medium text-amber-700 hover:text-amber-800"
            >
              Lihat detail <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Google Drive Connector</span>
            <Cloud className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                driveConfig.configured
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  driveConfig.configured ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {driveConfig.configured ? "Terkonfigurasi" : "Siap Dihubungkan"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span className="truncate">
              {latestSync
                ? `Sync terakhir: ${formatDateTimeId(latestSync.createdAt)}`
                : "Belum pernah sync"}
            </span>
          </div>
        </div>
      </section>

      {/* Site & Category Distribution */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Data Center Breakdown */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Distribusi Infrastruktur per Data Center
              </h2>
            </div>
            <span className="text-xs text-slate-500">GTI Ragunan & ODC Sentul</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assetsByLocation.map((site) => {
              const activePct = site.total > 0 ? Math.round((site.active / site.total) * 100) : 0;
              return (
                <div
                  key={site.location}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <LocationBadge location={site.location} />
                    <span className="font-mono-tech text-xs text-slate-500">
                      {activePct}% Active
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-white p-2 border border-slate-200/80">
                      <div className="text-lg font-semibold tabular-nums text-slate-900">
                        {site.total}
                      </div>
                      <div className="text-[11px] text-slate-500">Perangkat</div>
                    </div>
                    <div className="rounded-md bg-white p-2 border border-slate-200/80">
                      <div className="text-lg font-semibold tabular-nums text-amber-700">
                        {site.maintenance}
                      </div>
                      <div className="text-[11px] text-slate-500">Maint.</div>
                    </div>
                    <div className="rounded-md bg-white p-2 border border-slate-200/80">
                      <div className="text-lg font-semibold tabular-nums text-blue-700">
                        {site.docs}
                      </div>
                      <div className="text-[11px] text-slate-500">Dokumen</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${activePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attention Assets Table */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Host dalam Status Maintenance / Standby
              </h3>
              <Link
                href="/assets"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat semua aset
              </Link>
            </div>

            {attentionAssets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                Seluruh host aktif dan beroperasi normal.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Perangkat</th>
                      <th className="px-3 py-2">Lokasi / Rak</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {attentionAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5">
                          <div className="font-mono-tech font-medium text-slate-900">
                            {asset.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{asset.cluster}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-slate-700">{asset.location}</div>
                          <div className="font-mono-tech text-[11px] text-slate-500">
                            {asset.rackCoordinate}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <AssetStatusBadge status={asset.status} />
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px] truncate text-slate-600">
                          {asset.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Document Categories & Recent Docs */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Kategori Document Hub
              </h2>
            </div>
            <Link
              href="/documents"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Buka Hub
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {docsByCategory.map((item) => (
              <Link
                key={item.category}
                href={`/documents?category=${encodeURIComponent(item.category)}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-blue-300 hover:bg-blue-50/30"
              >
                <span className="text-xs font-medium text-slate-700">{item.category}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono-tech text-xs font-semibold text-slate-900">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex-1">
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Dokumen Terbaru
            </h3>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between gap-3 p-3 hover:bg-slate-50/70"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/documents?selected=${doc.id}`}
                      className="block truncate text-xs font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {doc.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <DocumentCategoryBadge category={doc.category} />
                      <LocationBadge location={doc.location} />
                      <span className="font-mono-tech text-[11px] text-slate-400">
                        {formatDateId(doc.documentDate)}
                      </span>
                    </div>
                  </div>
                  {(doc.filePath || doc.externalUrl) && (
                    <a
                      href={doc.filePath ? `/api/documents/${doc.id}/file` : doc.externalUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={doc.filePath ? "Buka file lokal" : "Buka link eksternal"}
                      className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
