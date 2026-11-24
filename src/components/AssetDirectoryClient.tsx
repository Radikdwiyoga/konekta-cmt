"use client";

import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Search,
  Plus,
  Upload,
  Download,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  Server,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ASSET_DEVICE_TYPES,
  ASSET_STATUSES,
  DATA_CENTER_LOCATIONS,
} from "@/lib/constants";
import { AssetStatusBadge, LocationBadge } from "./StatusBadges";

export interface AssetItem {
  id: string;
  name: string;
  deviceType: string;
  cluster: string;
  wwn: string;
  location: string;
  rackCoordinate: string;
  serialNumber: string;
  status: string;
  vendorModel: string | null;
  ipManagement: string | null;
  notes: string | null;
  updatedAt: string;
}

interface ParsedCsvRow {
  name: string;
  deviceType: string;
  cluster: string;
  wwn: string;
  location: string;
  rackCoordinate: string;
  serialNumber: string;
  status: string;
  vendorModel: string;
  ipManagement: string;
  notes: string;
}

const EMPTY_FORM = {
  name: "",
  deviceType: "Server",
  cluster: "",
  wwn: "",
  location: "GTI Ragunan",
  rackCoordinate: "",
  serialNumber: "",
  status: "Active",
  vendorModel: "",
  ipManagement: "",
  notes: "",
};

const CSV_TEMPLATE_CONTENT = [
  "name,deviceType,cluster,wwn,location,rackCoordinate,serialNumber,status,vendorModel,ipManagement,notes",
  "SRV-GTI-ESX05,Hypervisor,CL-PROD-CORE-01,50:00:09:73:00:1a:2b:05,GTI Ragunan,R04-C12 / U26-U27,DL760-GTI-99405E,Active,Dell PowerEdge R760,10.24.10.105,Host ESXi ekspansi Q4",
  "STR-ODC-PS5000-02,Storage,SAN-DR-TIER0,50:00:09:73:ff:02:00:20,ODC Sentul,R02-C09 / U10-U13,PS5000T-ODC-77302,Standby,Dell PowerStore 5000T,10.38.12.22,Target replikasi DR",
].join("\n");

export function AssetDirectoryClient({
  initialAssets,
  initialStatus = "ALL",
}: {
  initialAssets: AssetItem[];
  initialStatus?: string;
}) {
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "ALL");
  const [clusterFilter, setClusterFilter] = useState("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add / Edit Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    createdCount: number;
    updatedCount: number;
    failedCount: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  const refreshAssets = async () => {
    const res = await fetch("/api/assets");
    if (res.ok) {
      const data = await res.json();
      setAssets(data.assets || []);
    }
  };

  const uniqueClusters = useMemo(() => {
    return Array.from(new Set(assets.map((a) => a.cluster))).sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      if (locationFilter !== "ALL" && asset.location !== locationFilter) return false;
      if (statusFilter !== "ALL" && asset.status !== statusFilter) return false;
      if (clusterFilter !== "ALL" && asset.cluster !== clusterFilter) return false;
      if (!q) return true;

      const haystack = [
        asset.name,
        asset.deviceType,
        asset.cluster,
        asset.wwn,
        asset.location,
        asset.rackCoordinate,
        asset.serialNumber,
        asset.status,
        asset.vendorModel || "",
        asset.ipManagement || "",
        asset.notes || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [assets, searchQuery, locationFilter, statusFilter, clusterFilter]);

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Fallback ignored
    }
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (asset: AssetItem) => {
    setEditingAsset(asset);
    setFormState({
      name: asset.name,
      deviceType: asset.deviceType,
      cluster: asset.cluster,
      wwn: asset.wwn,
      location: asset.location,
      rackCoordinate: asset.rackCoordinate,
      serialNumber: asset.serialNumber,
      status: asset.status,
      vendorModel: asset.vendorModel || "",
      ipManagement: asset.ipManagement || "",
      notes: asset.notes || "",
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menyimpan data aset.");
        return;
      }

      await refreshAssets();
      setShowFormModal(false);
    } catch {
      setFormError("Terjadi kesalahan jaringan saat menyimpan aset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (asset: AssetItem) => {
    if (!window.confirm(`Hapus aset "${asset.name}" (${asset.serialNumber}) dari direktori?`)) {
      return;
    }
    const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshAssets();
    }
  };

  // CSV Parsing helper supporting Indonesian & English column headers
  const parseCsvInput = (rawText: string) => {
    setCsvText(rawText);
    setCsvResult(null);
    if (!rawText.trim()) {
      setParsedRows([]);
      return;
    }

    const parsed = Papa.parse<Record<string, string>>(rawText.trim(), {
      header: true,
      skipEmptyLines: true,
    });

    const normalized: ParsedCsvRow[] = (parsed.data || []).map((row) => {
      const getVal = (...keys: string[]) => {
        for (const key of keys) {
          const match = Object.keys(row).find(
            (k) => k.trim().toLowerCase() === key.toLowerCase()
          );
          if (match && row[match] !== undefined) {
            return String(row[match]).trim();
          }
        }
        return "";
      };

      return {
        name: getVal("name", "nama", "nama server", "nama server/perangkat", "hostname"),
        deviceType: getVal("devicetype", "device_type", "tipe", "type") || "Server",
        cluster: getVal("cluster"),
        wwn: getVal("wwn", "wwpn"),
        location: getVal("location", "lokasi", "dc", "data center") || "GTI Ragunan",
        rackCoordinate: getVal(
          "rackcoordinate",
          "rack_coordinate",
          "rack",
          "koordinat rak",
          "koordinat"
        ),
        serialNumber: getVal("serialnumber", "serial_number", "serial number", "sn"),
        status: getVal("status") || "Active",
        vendorModel: getVal("vendormodel", "vendor_model", "vendor", "model"),
        ipManagement: getVal("ipmanagement", "ip_management", "ip", "ip mgmt"),
        notes: getVal("notes", "catatan"),
      };
    });

    setParsedRows(normalized);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      parseCsvInput(text);
    };
    reader.readAsText(file);
  };

  const handleImportCsvSubmit = async () => {
    if (parsedRows.length === 0) return;
    setCsvImporting(true);
    try {
      const res = await fetch("/api/assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();
      if (res.ok) {
        setCsvResult({
          createdCount: data.createdCount || 0,
          updatedCount: data.updatedCount || 0,
          failedCount: data.failedCount || 0,
          errors: data.errors || [],
        });
        await refreshAssets();
      }
    } finally {
      setCsvImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-asset-konekta-mct.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = Papa.unparse(
      filteredAssets.map((a) => ({
        name: a.name,
        deviceType: a.deviceType,
        cluster: a.cluster,
        wwn: a.wwn,
        location: a.location,
        rackCoordinate: a.rackCoordinate,
        serialNumber: a.serialNumber,
        status: a.status,
        vendorModel: a.vendorModel || "",
        ipManagement: a.ipManagement || "",
        notes: a.notes || "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `konekta-mct-assets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Asset & Host Directory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Direktori Server, Storage & WWN
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inventaris terpusat host compute, storage array, SAN fabric, koordinat rak, dan serial number.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            id="open-import-csv-btn"
            onClick={() => {
              setCsvText("");
              setParsedRows([]);
              setCsvResult(null);
              setShowCsvModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            id="add-asset-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="asset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Server, Cluster, WWN, Koordinat Rak, Serial Number, IP..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:col-span-7">
            <select
              aria-label="Filter Lokasi Data Center"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Lokasi DC</option>
              {DATA_CENTER_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Status Aset"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Cluster"
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Cluster ({uniqueClusters.length})</option>
              {uniqueClusters.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3 tabular-nums">
            <span>
              Total ditampilkan: <strong className="text-slate-900">{filteredAssets.length}</strong>{" "}
              / {assets.length} perangkat
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">
              Active: {filteredAssets.filter((a) => a.status === "Active").length}
            </span>
            <span className="text-amber-700 font-medium">
              Maintenance: {filteredAssets.filter((a) => a.status === "Maintenance").length}
            </span>
          </div>
          {(searchQuery || locationFilter !== "ALL" || statusFilter !== "ALL" || clusterFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setLocationFilter("ALL");
                setStatusFilter("ALL");
                setClusterFilter("ALL");
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Dense Enterprise Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Server / Perangkat</th>
                <th className="px-4 py-3">Cluster</th>
                <th className="px-4 py-3">WWN</th>
                <th className="px-4 py-3">Lokasi / Koordinat Rak</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Server className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Tidak ada perangkat yang sesuai
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ubah kata kunci pencarian atau tambahkan perangkat baru / import CSV.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="group transition-colors hover:bg-blue-50/30"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech font-semibold text-slate-900">
                          {asset.name}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {asset.deviceType}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {asset.vendorModel || "-"}
                        {asset.ipManagement ? (
                          <span className="ml-2 font-mono-tech text-slate-400">
                            • {asset.ipManagement}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono-tech text-[11px] font-medium text-slate-700">
                        {asset.cluster}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono-tech text-[11px] text-slate-800">
                          {asset.wwn}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(asset.wwn, `wwn-${asset.id}`)}
                          title="Salin WWN"
                          className="rounded p-1 text-slate-400 opacity-70 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                        >
                          {copiedKey === `wwn-${asset.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <LocationBadge location={asset.location} />
                        <span className="font-mono-tech text-[11px] text-slate-600">
                          {asset.rackCoordinate}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono-tech text-[11px] text-slate-800">
                          {asset.serialNumber}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(asset.serialNumber, `sn-${asset.id}`)}
                          title="Salin Serial Number"
                          className="rounded p-1 text-slate-400 opacity-70 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                        >
                          {copiedKey === `sn-${asset.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <AssetStatusBadge status={asset.status} />
                    </td>

                    <td className="px-4 py-3 align-top text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(asset)}
                          title="Edit aset"
                          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset)}
                          title="Hapus aset"
                          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Asset Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  {editingAsset
                    ? `Edit Aset — ${editingAsset.name}`
                    : "Tambah Server / Perangkat Baru"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nama Server / Perangkat *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="SRV-GTI-ESX05"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Tipe Perangkat *
                  </label>
                  <select
                    value={formState.deviceType}
                    onChange={(e) => setFormState({ ...formState, deviceType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {ASSET_DEVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Cluster *</label>
                  <input
                    required
                    type="text"
                    value={formState.cluster}
                    onChange={(e) => setFormState({ ...formState, cluster: e.target.value })}
                    placeholder="CL-PROD-CORE-01"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">WWN *</label>
                  <input
                    required
                    type="text"
                    value={formState.wwn}
                    onChange={(e) => setFormState({ ...formState, wwn: e.target.value })}
                    placeholder="50:00:09:73:00:1a:2b:05"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Lokasi DC *</label>
                  <select
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {DATA_CENTER_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Koordinat Rak *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.rackCoordinate}
                    onChange={(e) =>
                      setFormState({ ...formState, rackCoordinate: e.target.value })
                    }
                    placeholder="R04-C12 / U22-U23"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Status *</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {ASSET_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Serial Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.serialNumber}
                    onChange={(e) =>
                      setFormState({ ...formState, serialNumber: e.target.value })
                    }
                    placeholder="DL760-GTI-99405E"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Vendor / Model
                  </label>
                  <input
                    type="text"
                    value={formState.vendorModel}
                    onChange={(e) =>
                      setFormState({ ...formState, vendorModel: e.target.value })
                    }
                    placeholder="Dell PowerEdge R760"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    IP Management (iDRAC/iLO)
                  </label>
                  <input
                    type="text"
                    value={formState.ipManagement}
                    onChange={(e) =>
                      setFormState({ ...formState, ipManagement: e.target.value })
                    }
                    placeholder="10.24.10.105"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Catatan Teknis</label>
                <textarea
                  rows={2}
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  placeholder="Informasi firmware, jadwal PM, atau keterangan tambahan..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingAsset
                    ? "Simpan Perubahan"
                    : "Tambah Perangkat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Import Data Aset via CSV (Bulk Upsert)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Format Kolom CSV yang Didukung
                  </p>
                  <p className="mt-0.5 font-mono-tech text-[11px] text-slate-500">
                    name, deviceType, cluster, wwn, location, rackCoordinate, serialNumber, status
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Serial Number yang sudah ada di database akan diperbarui otomatis (upsert).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-3.5 w-3.5 text-blue-600" />
                  Download Template CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/20">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span className="mt-1.5 text-xs font-medium text-slate-700">
                    Pilih file .CSV dari komputer
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    Atau tempel teks CSV di samping
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>

                <div>
                  <textarea
                    rows={5}
                    value={csvText}
                    onChange={(e) => parseCsvInput(e.target.value)}
                    placeholder="Tempel isi CSV di sini (termasuk baris header)..."
                    className="h-full w-full rounded-lg border border-slate-200 p-2.5 font-mono-tech text-[11px] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {parsedRows.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Preview Import ({parsedRows.length} baris terdeteksi)
                  </p>
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 font-semibold text-slate-500">
                        <tr>
                          <th className="px-2.5 py-1.5">Nama</th>
                          <th className="px-2.5 py-1.5">Cluster</th>
                          <th className="px-2.5 py-1.5">WWN</th>
                          <th className="px-2.5 py-1.5">Lokasi / Rak</th>
                          <th className="px-2.5 py-1.5">Serial Number</th>
                          <th className="px-2.5 py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono-tech">
                        {parsedRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-2.5 py-1.5 font-medium text-slate-900">
                              {row.name || <span className="text-rose-500">kosong</span>}
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-600">{row.cluster}</td>
                            <td className="px-2.5 py-1.5 text-slate-600">{row.wwn}</td>
                            <td className="px-2.5 py-1.5 text-slate-600">
                              {row.location} ({row.rackCoordinate})
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-600">{row.serialNumber}</td>
                            <td className="px-2.5 py-1.5 text-slate-600">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {csvResult && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Import CSV Selesai
                  </div>
                  <p className="mt-1">
                    Ditambahkan: <strong>{csvResult.createdCount}</strong> • Diperbarui:{" "}
                    <strong>{csvResult.updatedCount}</strong> • Gagal:{" "}
                    <strong>{csvResult.failedCount}</strong>
                  </p>
                  {csvResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-[11px] text-rose-700">
                      {csvResult.errors.slice(0, 5).map((err) => (
                        <li key={err.row}>
                          Baris {err.row}: {err.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || csvImporting}
                onClick={handleImportCsvSubmit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {csvImporting
                  ? "Mengimpor..."
                  : `Import ${parsedRows.length} Baris ke Database`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
