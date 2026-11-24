import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "mct-documents";

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function buildSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeBase}${ext}`;
}

/**
 * Mengunggah file dokumen ke Supabase Storage (private bucket) jika terkonfigurasi,
 * atau fallback ke disk lokal saat development tanpa Supabase Storage.
 * Prefix `supabase:` digunakan untuk membedakan lokasi penyimpanan di kolom `filePath`.
 */
export async function uploadDocumentFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ filePath: string; provider: "supabase" | "local" }> {
  const safeFileName = buildSafeFileName(originalName);

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    const objectPath = `documents/${safeFileName}`;

    const { error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage upload gagal: ${error.message}`);
    }

    return {
      filePath: `supabase:${objectPath}`,
      provider: "supabase",
    };
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi di Environment Variables Vercel."
    );
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, safeFileName), buffer);

  return {
    filePath: safeFileName,
    provider: "local",
  };
}

/**
 * Menghasilkan Signed URL aman (berlaku 5 menit) untuk file di Supabase Storage,
 * atau membaca buffer dari disk lokal.
 */
export async function resolveDocumentFile(
  filePath: string,
  originalFileName: string | null,
  forceDownload: boolean
): Promise<
  | { type: "redirect"; url: string }
  | { type: "buffer"; buffer: Buffer; downloadName: string }
> {
  if (filePath.startsWith("supabase:")) {
    if (!isSupabaseStorageConfigured()) {
      throw new Error("Konfigurasi Supabase Storage tidak ditemukan.");
    }
    const objectPath = filePath.replace(/^supabase:/, "");
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .createSignedUrl(objectPath, 300, {
        download: forceDownload ? originalFileName || path.basename(objectPath) : false,
      });

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Gagal membuat signed URL file.");
    }

    return { type: "redirect", url: data.signedUrl };
  }

  const safeName = path.basename(filePath);
  const fullPath = path.join(LOCAL_UPLOAD_DIR, safeName);
  const buffer = await readFile(fullPath);

  return {
    type: "buffer",
    buffer,
    downloadName: (originalFileName || safeName).replace(/"/g, ""),
  };
}

/**
 * Menghapus file dari Supabase Storage atau disk lokal.
 */
export async function deleteDocumentFile(filePath: string | null): Promise<void> {
  if (!filePath) return;

  if (filePath.startsWith("supabase:")) {
    if (!isSupabaseStorageConfigured()) return;
    const objectPath = filePath.replace(/^supabase:/, "");
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(DEFAULT_BUCKET).remove([objectPath]);
    return;
  }

  const safeName = path.basename(filePath);
  await unlink(path.join(LOCAL_UPLOAD_DIR, safeName)).catch(() => {
    // Abaikan jika file sudah tidak ada
  });
}
