import { google, drive_v3 } from "googleapis";
import type { DataCenterLocation, DocumentCategory } from "./constants";

export type GoogleAuthMode = "service_account" | "oauth2" | "unconfigured";

export interface DriveConfigStatus {
  configured: boolean;
  authMode: GoogleAuthMode;
  folderId: string | null;
  missingEnvVars: string[];
}

export interface SyncedDriveFile {
  driveFileId: string;
  title: string;
  category: DocumentCategory;
  location: DataCenterLocation;
  summary: string;
  contentExcerpt: string | null;
  fileType: string;
  fileSize: string | null;
  externalUrl: string;
  author: string | null;
  tags: string;
  documentDate: Date;
}

const DRIVE_READONLY_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

/**
 * Memeriksa kelengkapan environment variables untuk Google Drive API.
 * Mendukung Service Account maupun OAuth2.
 */
export function getDriveConfigStatus(overrideFolderId?: string | null): DriveConfigStatus {
  const rawMode = (process.env.GOOGLE_AUTH_MODE || "service_account").toLowerCase();
  const folderId = overrideFolderId?.trim() || process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
  const missingEnvVars: string[] = [];

  if (!folderId) {
    missingEnvVars.push("GOOGLE_DRIVE_FOLDER_ID");
  }

  if (rawMode === "oauth2") {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

    if (!clientId) missingEnvVars.push("GOOGLE_OAUTH_CLIENT_ID");
    if (!clientSecret) missingEnvVars.push("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!refreshToken) missingEnvVars.push("GOOGLE_OAUTH_REFRESH_TOKEN");

    return {
      configured: missingEnvVars.length === 0,
      authMode: "oauth2",
      folderId,
      missingEnvVars,
    };
  }

  // Default: Service Account
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();

  if (!keyFile) {
    if (!email) missingEnvVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!privateKey) missingEnvVars.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  }

  return {
    configured: missingEnvVars.length === 0,
    authMode: "service_account",
    folderId,
    missingEnvVars,
  };
}

/**
 * Inisialisasi Google Drive v3 client menggunakan Service Account atau OAuth2.
 */
export function createGoogleDriveClient(authMode: GoogleAuthMode): drive_v3.Drive {
  if (authMode === "oauth2") {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    return google.drive({ version: "v3", auth: oauth2Client });
  }

  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim();
  if (keyFile) {
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: DRIVE_READONLY_SCOPES,
    });
    return google.drive({ version: "v3", auth });
  }

  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const jwtClient = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: DRIVE_READONLY_SCOPES,
  });

  return google.drive({ version: "v3", auth: jwtClient });
}

function formatFileSize(bytesStr?: string | null): string | null {
  if (!bytesStr) return null;
  const bytes = Number(bytesStr);
  if (Number.isNaN(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function mapMimeToFileType(mimeType?: string | null): string {
  if (!mimeType) return "FILE";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType === "application/vnd.google-apps.document") return "GDOC";
  if (mimeType === "application/vnd.google-apps.spreadsheet") return "GSHEET";
  if (mimeType === "application/vnd.google-apps.presentation") return "GSLIDES";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "DOCX";
  if (mimeType.includes("spreadsheetml") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.includes("csv")) return "CSV";
  if (mimeType.includes("text/plain") || mimeType.includes("markdown")) return "TXT";
  return "FILE";
}

/**
 * Klasifikasi otomatis kategori & lokasi berdasarkan nama file dan deskripsi.
 */
export function inferCategoryAndLocation(
  title: string,
  description?: string | null
): { category: DocumentCategory; location: DataCenterLocation; tags: string } {
  const haystack = `${title} ${description || ""}`.toLowerCase();

  let category: DocumentCategory = "Infrastruktur";
  if (/(pm\b|preventive|maintenance|health\s*check|checklist|inspeksi)/.test(haystack)) {
    category = "PM Report";
  } else if (/(vendor|logistik|bast|delivery|rma|spare\s*part|garansi|po\b|pengiriman)/.test(haystack)) {
    category = "Vendor/Logistik";
  } else if (/(sop|kebijakan|surat|izin|akses|change\s*request|cr\b|admin|notulen|jadwal)/.test(haystack)) {
    category = "Administrasi";
  }

  let location: DataCenterLocation = "GTI Ragunan";
  if (/(sentul|odc)/.test(haystack)) {
    location = "ODC Sentul";
  } else if (/(ragunan|gti)/.test(haystack)) {
    location = "GTI Ragunan";
  }

  const tagSet = new Set<string>(["google-drive", location.toLowerCase().replace(/\s+/g, "-")]);
  if (haystack.includes("san") || haystack.includes("wwn") || haystack.includes("storage")) {
    tagSet.add("storage");
  }
  if (haystack.includes("esxi") || haystack.includes("vmware") || haystack.includes("cluster")) {
    tagSet.add("compute");
  }
  if (haystack.includes("pm") || haystack.includes("preventive")) {
    tagSet.add("preventive-maintenance");
  }
  if (haystack.includes("rma") || haystack.includes("vendor")) {
    tagSet.add("vendor");
  }

  return { category, location, tags: Array.from(tagSet).join(", ") };
}

/**
 * Membaca cuplikan isi teks dari file Google Drive (Google Docs, Sheets, TXT, CSV, MD).
 * Untuk file biner seperti PDF/DOCX, mengembalikan deskripsi metadata sebagai fallback.
 */
async function extractDriveFileContent(
  drive: drive_v3.Drive,
  file: drive_v3.Schema$File
): Promise<string | null> {
  if (!file.id || !file.mimeType) return null;

  try {
    if (file.mimeType === "application/vnd.google-apps.document") {
      const res = await drive.files.export(
        { fileId: file.id, mimeType: "text/plain" },
        { responseType: "text" }
      );
      const text = String(res.data || "").trim();
      return text ? text.slice(0, 1500) : null;
    }

    if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
      const res = await drive.files.export(
        { fileId: file.id, mimeType: "text/csv" },
        { responseType: "text" }
      );
      const text = String(res.data || "").trim();
      return text ? text.slice(0, 1500) : null;
    }

    if (
      file.mimeType.startsWith("text/") ||
      file.mimeType === "application/json" ||
      file.mimeType === "application/csv"
    ) {
      const res = await drive.files.get(
        { fileId: file.id, alt: "media", supportsAllDrives: true },
        { responseType: "text" }
      );
      const text = String(res.data || "").trim();
      return text ? text.slice(0, 1500) : null;
    }
  } catch (err) {
    console.warn(`[GoogleDrive] Gagal mengekstrak isi file ${file.id}:`, err);
  }

  return file.description?.trim() || null;
}

/**
 * Mengambil daftar file (metadata + cuplikan isi) dari folder Google Drive tertentu.
 */
export async function fetchDriveFolderDocuments(
  folderId: string,
  authMode: GoogleAuthMode,
  options?: { maxFiles?: number; includeContent?: boolean }
): Promise<SyncedDriveFile[]> {
  const drive = createGoogleDriveClient(authMode);
  const pageSize = Math.min(options?.maxFiles ?? 50, 100);
  const includeContent = options?.includeContent ?? true;

  const listResponse = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
    fields:
      "files(id, name, mimeType, size, modifiedTime, webViewLink, description, owners(displayName, emailAddress))",
    orderBy: "modifiedTime desc",
    pageSize,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = listResponse.data.files || [];
  const results: SyncedDriveFile[] = [];

  for (const file of files) {
    if (!file.id || !file.name) continue;

    const { category, location, tags } = inferCategoryAndLocation(
      file.name,
      file.description
    );
    const contentExcerpt = includeContent
      ? await extractDriveFileContent(drive, file)
      : file.description || null;

    const cleanSummary =
      file.description?.trim() ||
      (contentExcerpt
        ? contentExcerpt.replace(/\s+/g, " ").slice(0, 220) +
          (contentExcerpt.length > 220 ? "..." : "")
        : `Dokumen tersinkronisasi dari Google Drive (${mapMimeToFileType(file.mimeType)}) untuk operasional ${location}.`);

    const ownerName =
      file.owners?.[0]?.displayName || file.owners?.[0]?.emailAddress || "Google Drive Sync";

    results.push({
      driveFileId: file.id,
      title: file.name,
      category,
      location,
      summary: cleanSummary,
      contentExcerpt,
      fileType: mapMimeToFileType(file.mimeType),
      fileSize: formatFileSize(file.size),
      externalUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      author: ownerName,
      tags,
      documentDate: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
    });
  }

  return results;
}
