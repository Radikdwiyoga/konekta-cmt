"use client";

import React, { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, X, Cloud } from "lucide-react";

interface SyncResult {
  status: string;
  authMode?: string;
  filesFound?: number;
  filesSynced?: number;
  message?: string;
  missingEnvVars?: string[];
  error?: string;
  details?: string;
}

export function DriveSyncButton({
  onSynced,
  compact = false,
}: {
  onSynced?: () => void;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeContent: true }),
      });
      const data: SyncResult = await res.json();
      setResult(data);
      setShowModal(true);
      if (data.status === "success" && onSynced) {
        onSynced();
      }
    } catch {
      setResult({
        status: "failed",
        error: "Tidak dapat menghubungi endpoint /api/sync-drive.",
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        id="sync-drive-btn"
        onClick={handleSync}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 ${
          compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs sm:text-sm"
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
        <span>{loading ? "Menyinkronkan..." : "Sync Google Drive"}</span>
      </button>

      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Google Drive API Sync
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {result.status === "success" && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold">Sinkronisasi Berhasil</p>
                    <p className="mt-0.5">
                      Ditemukan <strong>{result.filesFound}</strong> file dan berhasil
                      disinkronkan <strong>{result.filesSynced}</strong> dokumen ke database lokal
                      (mode: <code className="font-mono-tech">{result.authMode}</code>).
                    </p>
                  </div>
                </div>
              )}

              {result.status === "not_configured" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold">Kredensial Google Drive Belum Terkonfigurasi</p>
                      <p className="mt-1">{result.message}</p>
                    </div>
                  </div>

                  {result.missingEnvVars && result.missingEnvVars.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Environment Variables Belum Diisi ({result.authMode})
                      </p>
                      <ul className="mt-2 space-y-1 font-mono-tech text-xs text-slate-700">
                        {result.missingEnvVars.map((envVar) => (
                          <li key={envVar} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {envVar}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2.5 text-[11px] text-slate-500">
                        Endpoint <code className="font-mono-tech text-slate-700">/api/sync-drive</code>{" "}
                        sudah siap untuk mode <strong>Service Account</strong> maupun{" "}
                        <strong>OAuth2</strong>. Lihat file{" "}
                        <code className="font-mono-tech text-slate-700">.env.example</code>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {result.status === "failed" && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold">{result.error || "Sinkronisasi Gagal"}</p>
                    {result.details && (
                      <p className="mt-1 font-mono-tech text-[11px] text-rose-700">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
