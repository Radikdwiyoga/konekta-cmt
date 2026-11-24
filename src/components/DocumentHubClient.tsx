"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  FileText,
  Calendar,
  User,
  Tag,
  MapPin,
  Upload,
  Download,
  X,
  HardDrive,
  Clock,
  Trash2,
  Paperclip,
  Eye,
} from "lucide-react";
import {
  DOCUMENT_CATEGORIES,
  DATA_CENTER_LOCATIONS,
  formatDateId,
  formatDateTimeId,
} from "@/lib/constants";
import { DocumentCategoryBadge, LocationBadge } from "./StatusBadges";
import { DriveSyncButton } from "./DriveSyncButton";

export interface DocumentItem {
  id: string;
  driveFileId: string | null;
  title: string;
  category: string;
  location: string;
  summary: string;
  contentExcerpt: string | null;
  fileType: string;
  fileSize: string | null;
  filePath: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  externalUrl: string | null;
  author: string | null;
  tags: string | null;
  documentDate: string;
  lastSyncedAt: string | null;
}

interface DocumentHubClientProps {
  initialDocuments: DocumentItem[];
  initialCategory?: string;
  initialSelectedId?: string;
}

export function DocumentHubClient({
  initialDocuments,
  initialCategory = "ALL",
  initialSelectedId,
}: DocumentHubClientProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialSelectedId || initialDocuments[0]?.id || null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formState, setFormState] = useState({
    title: "",
    category: "PM Report",
    location: "GTI Ragunan",
    fileType: "PDF",
    author: "",
    externalUrl: "",
    tags: "",
    summary: "",
    contentExcerpt: "",
  });

  const refreshDocuments = async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
    }
  };

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      if (selectedCategory !== "ALL" && doc.category !== selectedCategory) {
        return false;
      }
      if (selectedLocation !== "ALL" && doc.location !== selectedLocation) {
        return false;
      }
      if (!q) return true;
      const searchable = [
        doc.title,
        doc.summary,
        doc.contentExcerpt || "",
        doc.tags || "",
        doc.author || "",
        doc.category,
        doc.location,
        doc.fileType,
        doc.originalFileName || "",
        doc.driveFileId || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [documents, searchQuery, selectedCategory, selectedLocation]);

  useEffect(() => {
    if (filteredDocuments.length === 0) {
      setSelectedDocId(null);
      return;
    }
    if (!selectedDocId || !filteredDocuments.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(filteredDocuments[0].id);
    }
  }, [filteredDocuments, selectedDocId]);

  const selectedDoc = useMemo(
    () => filteredDocuments.find((d) => d.id === selectedDocId) || null,
    [filteredDocuments, selectedDocId]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file && !formState.title.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
      setFormState((prev) => ({ ...prev, title: cleanTitle }));
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const fd = new FormData();
      if (selectedFile) {
        fd.append("file", selectedFile);
      }
      fd.append("title", formState.title);
      fd.append("category", formState.category);
      fd.append("location", formState.location);
      fd.append("fileType", formState.fileType);
      fd.append("author", formState.author);
      fd.append("externalUrl", formState.externalUrl);
      fd.append("tags", formState.tags);
      fd.append("summary", formState.summary);
      fd.append("contentExcerpt", formState.contentExcerpt);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal mengunggah dokumen.");
        return;
      }

      await refreshDocuments();
      setSelectedDocId(data.document.id);
      setShowAddModal(false);
      setSelectedFile(null);
      setFormState({
        title: "",
        category: "PM Report",
        location: "GTI Ragunan",
        fileType: "PDF",
        author: "",
        externalUrl: "",
        tags: "",
        summary: "",
        contentExcerpt: "",
      });
    } catch {
      setFormError("Terjadi kesalahan jaringan saat mengunggah dokumen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Hapus dokumen ini (beserta file lokal jika ada) dari Document Hub?")) {
      return;
    }
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshDocuments();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Smart Document Hub
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Document Hub & Arsip Operasional
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload dokumen langsung ke penyimpanan aman (Supabase Storage / lokal) atau kelola arsip PM Report, Infrastruktur, Vendor, dan Administrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DriveSyncButton onSynced={refreshDocuments} />
          <button
            type="button"
            id="add-document-btn"
            onClick={() => {
              setFormError(null);
              setSelectedFile(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Dokumen</span>
          </button>
        </div>
      </div>

      {/* Filter & Real-time Search Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="document-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul dokumen, kata kunci isi, nama file, tag (mis. powerstore, wwn, rma), atau PIC..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">
              Lokasi:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLocation("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedLocation === "ALL"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Semua DC
            </button>
            {DATA_CENTER_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocation(loc)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  selectedLocation === loc
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                selectedCategory === "ALL"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua Kategori ({documents.length})
            </button>
            {DOCUMENT_CATEGORIES.map((cat) => {
              const count = documents.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    selectedCategory === cat
                      ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            Menampilkan <strong>{filteredDocuments.length}</strong> dari {documents.length} dokumen
          </span>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Document List */}
        <div className="lg:col-span-7 space-y-2.5">
          {filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                Tidak ada dokumen yang cocok dengan filter Anda
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Coba ubah kata kunci pencarian atau upload dokumen baru.
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const active = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    active
                      ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DocumentCategoryBadge category={doc.category} />
                        <LocationBadge location={doc.location} />
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono-tech text-[10px] font-semibold text-slate-600">
                          {doc.fileType}
                        </span>
                        {doc.filePath && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <Paperclip className="h-2.5 w-2.5" />
                            Local File
                          </span>
                        )}
                        {doc.fileSize && (
                          <span className="font-mono-tech text-[11px] text-slate-400">
                            {doc.fileSize}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-sm font-semibold text-slate-900 leading-snug">
                        {doc.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {doc.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDateId(doc.documentDate)}
                        </span>
                        {doc.author && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {doc.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sticky Preview Panel */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-6 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {!selectedDoc ? (
              <div className="p-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs text-slate-500">
                  Pilih dokumen di sisi kiri untuk melihat ringkasan dan membuka atau mengunduh file.
                </p>
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Preview Ringkasan Dokumen
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(selectedDoc.id)}
                      title="Hapus dokumen"
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold leading-snug text-slate-900">
                    {selectedDoc.title}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <DocumentCategoryBadge category={selectedDoc.category} />
                    <LocationBadge location={selectedDoc.location} />
                    <span className="rounded bg-white px-2 py-0.5 font-mono-tech text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                      {selectedDoc.fileType}
                      {selectedDoc.fileSize ? ` • ${selectedDoc.fileSize}` : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-5 py-3.5 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <User className="h-3 w-3" /> PIC / Author
                    </span>
                    <p className="mt-0.5 font-medium text-slate-800">
                      {selectedDoc.author || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3" /> Tanggal Dokumen
                    </span>
                    <p className="mt-0.5 font-medium text-slate-800">
                      {formatDateId(selectedDoc.documentDate)}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3" /> Lokasi Data Center
                    </span>
                    <p className="mt-0.5 font-medium text-slate-800">{selectedDoc.location}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" /> Sumber Penyimpanan
                    </span>
                    <p className="mt-0.5 font-medium text-slate-800">
                      {selectedDoc.filePath
                        ? "Upload Lokal (Aman)"
                        : selectedDoc.lastSyncedAt
                        ? formatDateTimeId(selectedDoc.lastSyncedAt)
                        : "Link Eksternal"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-4">
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ringkasan Eksekutif
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                      {selectedDoc.summary}
                    </p>
                  </div>

                  {selectedDoc.contentExcerpt && (
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Cuplikan Isi Dokumen
                      </h4>
                      <pre className="mt-1.5 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono-tech text-[11px] leading-relaxed text-slate-700">
                        {selectedDoc.contentExcerpt}
                      </pre>
                    </div>
                  )}

                  {selectedDoc.tags && (
                    <div>
                      <h4 className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <Tag className="h-3 w-3" /> Tags
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {selectedDoc.tags.split(",").map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag.trim())}
                            className="rounded bg-slate-100 px-2 py-0.5 font-mono-tech text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            #{tag.trim()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDoc.originalFileName && (
                    <div className="flex items-center justify-between rounded-md bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800 border border-emerald-200/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                        File Terlampir
                      </span>
                      <span className="font-mono-tech truncate max-w-[200px]">
                        {selectedDoc.originalFileName}
                      </span>
                    </div>
                  )}

                  {selectedDoc.driveFileId && (
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-500 border border-slate-200/70">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                        Drive File ID
                      </span>
                      <span className="font-mono-tech text-slate-700 truncate max-w-[190px]">
                        {selectedDoc.driveFileId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 space-y-2">
                  {selectedDoc.filePath && (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/api/documents/${selectedDoc.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Buka File</span>
                      </a>
                      <a
                        href={`/api/documents/${selectedDoc.id}/file?download=1`}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100"
                      >
                        <Download className="h-3.5 w-3.5 text-blue-600" />
                        <span>Unduh File</span>
                      </a>
                    </div>
                  )}

                  {selectedDoc.externalUrl && (
                    <a
                      id="open-external-doc-link"
                      href={selectedDoc.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-2xs transition ${
                        selectedDoc.filePath
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Buka Link Eksternal Dokumen</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Upload / Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Upload Dokumen ke Penyimpanan Lokal
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  File Dokumen (PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG/JPG — Maks 25 MB)
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center transition hover:border-blue-500 hover:bg-blue-50/20">
                  <Upload className="h-5 w-5 text-blue-600" />
                  {selectedFile ? (
                    <div className="mt-1.5">
                      <p className="text-xs font-semibold text-slate-900">{selectedFile.name}</p>
                      <p className="mt-0.5 font-mono-tech text-[11px] text-emerald-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Siap diunggah
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1.5">
                      <p className="text-xs font-medium text-slate-700">
                        Klik untuk memilih file dari komputer Anda
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        File disimpan aman di server lokal (SQLite + storage/uploads)
                      </p>
                    </div>
                  )}
                  <input
                    id="document-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.json,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Judul Dokumen *
                </label>
                <input
                  required
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Contoh: PM Report Q4 2026 — Compute Cluster GTI Ragunan"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Kategori *</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Lokasi DC *</label>
                  <select
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {DATA_CENTER_LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Link Eksternal (Opsional — isi jika juga ada link Drive/SharePoint)
                </label>
                <input
                  type="url"
                  value={formState.externalUrl}
                  onChange={(e) => setFormState({ ...formState, externalUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">PIC / Author</label>
                  <input
                    type="text"
                    value={formState.author}
                    onChange={(e) => setFormState({ ...formState, author: e.target.value })}
                    placeholder="Nama engineer"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Tags (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formState.tags}
                    onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                    placeholder="pm-report, storage, q4"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Ringkasan Dokumen *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formState.summary}
                  onChange={(e) => setFormState({ ...formState, summary: e.target.value })}
                  placeholder="Ringkasan poin-poin penting dokumen..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Cuplikan Isi / Catatan Teknis (Opsional — otomatis diekstrak untuk TXT/CSV/MD)
                </label>
                <textarea
                  rows={3}
                  value={formState.contentExcerpt}
                  onChange={(e) => setFormState({ ...formState, contentExcerpt: e.target.value })}
                  placeholder="Temuan teknis, daftar WWN, atau checklist utama..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono-tech text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Mengunggah..." : "Simpan & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
