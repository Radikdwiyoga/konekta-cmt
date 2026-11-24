import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchDriveFolderDocuments,
  getDriveConfigStatus,
} from "@/lib/google-drive";

/**
 * GET /api/sync-drive
 * Mengembalikan status kesiapan konfigurasi Google Drive API (Service Account / OAuth2)
 * serta riwayat log sinkronisasi terakhir.
 */
export async function GET() {
  try {
    const config = getDriveConfigStatus();
    const recentLogs = await prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      configured: config.configured,
      authMode: config.authMode,
      folderIdConfigured: Boolean(config.folderId),
      missingEnvVars: config.missingEnvVars,
      supportedAuthModes: ["service_account", "oauth2"],
      recentLogs,
    });
  } catch (error) {
    console.error("[GET /api/sync-drive]", error);
    return NextResponse.json(
      { error: "Gagal membaca status sinkronisasi Google Drive." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync-drive
 * Menarik metadata dan cuplikan isi file dari folder Google Drive yang ditentukan
 * menggunakan library `googleapis` (Service Account atau OAuth2) dan melakukan upsert
 * ke tabel SQLite `Document`.
 *
 * Body opsional (JSON):
 * - folderId?: string (override GOOGLE_DRIVE_FOLDER_ID)
 * - maxFiles?: number (default 50, maks 100)
 * - includeContent?: boolean (default true — ekstrak isi Docs/Sheets/TXT)
 * - dryRun?: boolean (default false — hanya preview tanpa menulis ke DB)
 */
export async function POST(request: NextRequest) {
  try {
    let body: {
      folderId?: string;
      maxFiles?: number;
      includeContent?: boolean;
      dryRun?: boolean;
    } = {};

    try {
      body = await request.json();
    } catch {
      // Body opsional
    }

    const config = getDriveConfigStatus(body.folderId);

    if (!config.configured || !config.folderId) {
      return NextResponse.json(
        {
          status: "not_configured",
          configured: false,
          authMode: config.authMode,
          missingEnvVars: config.missingEnvVars,
          message:
            "Kredensial Google Drive API belum lengkap. Lengkapi variabel di file .env (lihat .env.example) untuk mengaktifkan sinkronisasi langsung.",
          setupGuide: {
            serviceAccount: [
              "GOOGLE_AUTH_MODE=service_account",
              "GOOGLE_DRIVE_FOLDER_ID=<id_folder_drive>",
              "GOOGLE_SERVICE_ACCOUNT_EMAIL=<email_service_account>",
              "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private_key_pem>",
            ],
            oauth2: [
              "GOOGLE_AUTH_MODE=oauth2",
              "GOOGLE_DRIVE_FOLDER_ID=<id_folder_drive>",
              "GOOGLE_OAUTH_CLIENT_ID=<client_id>",
              "GOOGLE_OAUTH_CLIENT_SECRET=<client_secret>",
              "GOOGLE_OAUTH_REFRESH_TOKEN=<refresh_token>",
            ],
          },
        },
        { status: 200 }
      );
    }

    const driveFiles = await fetchDriveFolderDocuments(
      config.folderId,
      config.authMode,
      {
        maxFiles: body.maxFiles ?? 50,
        includeContent: body.includeContent ?? true,
      }
    );

    if (body.dryRun) {
      await prisma.syncLog.create({
        data: {
          source: "google_drive",
          folderId: config.folderId,
          authMode: config.authMode,
          status: "dry_run",
          filesFound: driveFiles.length,
          filesSynced: 0,
          message: `Dry run berhasil menemukan ${driveFiles.length} file di folder Drive.`,
        },
      });

      return NextResponse.json({
        status: "dry_run",
        authMode: config.authMode,
        filesFound: driveFiles.length,
        preview: driveFiles.slice(0, 10),
      });
    }

    let syncedCount = 0;
    const now = new Date();

    for (const file of driveFiles) {
      await prisma.document.upsert({
        where: { driveFileId: file.driveFileId },
        update: {
          title: file.title,
          category: file.category,
          location: file.location,
          summary: file.summary,
          contentExcerpt: file.contentExcerpt,
          fileType: file.fileType,
          fileSize: file.fileSize,
          externalUrl: file.externalUrl,
          author: file.author,
          tags: file.tags,
          documentDate: file.documentDate,
          lastSyncedAt: now,
        },
        create: {
          driveFileId: file.driveFileId,
          title: file.title,
          category: file.category,
          location: file.location,
          summary: file.summary,
          contentExcerpt: file.contentExcerpt,
          fileType: file.fileType,
          fileSize: file.fileSize,
          externalUrl: file.externalUrl,
          author: file.author,
          tags: file.tags,
          documentDate: file.documentDate,
          lastSyncedAt: now,
        },
      });
      syncedCount++;
    }

    const log = await prisma.syncLog.create({
      data: {
        source: "google_drive",
        folderId: config.folderId,
        authMode: config.authMode,
        status: "success",
        filesFound: driveFiles.length,
        filesSynced: syncedCount,
        message: `Berhasil menyinkronkan ${syncedCount} dokumen dari Google Drive.`,
      },
    });

    return NextResponse.json({
      status: "success",
      authMode: config.authMode,
      filesFound: driveFiles.length,
      filesSynced: syncedCount,
      syncedAt: now.toISOString(),
      log,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan saat menghubungi Google Drive API.";
    console.error("[POST /api/sync-drive]", error);

    await prisma.syncLog.create({
      data: {
        source: "google_drive",
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
        authMode: process.env.GOOGLE_AUTH_MODE || "service_account",
        status: "failed",
        filesFound: 0,
        filesSynced: 0,
        message: errorMessage.slice(0, 500),
      },
    });

    return NextResponse.json(
      {
        status: "failed",
        error: "Sinkronisasi Google Drive gagal.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
