import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".txt",
  ".md",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeLabel(ext: string): string {
  return ext.replace(".", "").toUpperCase() || "FILE";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "PM Report").trim();
    const location = String(formData.get("location") || "GTI Ragunan").trim();
    const summary = String(formData.get("summary") || "").trim();
    const author = String(formData.get("author") || "").trim() || "Tim Maintenance Computes";
    const tags = String(formData.get("tags") || "").trim() || null;
    const externalUrl = String(formData.get("externalUrl") || "").trim() || null;
    let contentExcerpt = String(formData.get("contentExcerpt") || "").trim() || null;

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Judul dokumen dan ringkasan wajib diisi." },
        { status: 400 }
      );
    }

    if (!file && !externalUrl) {
      return NextResponse.json(
        { error: "Upload minimal 1 file dokumen atau sertakan link eksternal." },
        { status: 400 }
      );
    }

    let storedFileName: string | null = null;
    let originalFileName: string | null = null;
    let mimeType: string | null = null;
    let fileSize: string | null = null;
    let fileType = String(formData.get("fileType") || "PDF").trim().toUpperCase();

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 25 MB." },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: `Format file "${ext || "tidak dikenal"}" tidak diizinkan. Format yang didukung: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, PNG, JPG.`,
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await mkdir(UPLOAD_DIR, { recursive: true });
      const safeBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);
      storedFileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeBase}${ext}`;

      await writeFile(path.join(UPLOAD_DIR, storedFileName), buffer);

      originalFileName = file.name;
      mimeType = file.type || "application/octet-stream";
      fileSize = formatBytes(file.size);
      fileType = getFileTypeLabel(ext);

      // Auto-extract text excerpt for plain text / csv / md / json files
      if (!contentExcerpt && [".txt", ".csv", ".md", ".json"].includes(ext)) {
        const text = buffer.toString("utf-8").trim();
        if (text) {
          contentExcerpt = text.slice(0, 1500);
        }
      }
    }

    const created = await prisma.document.create({
      data: {
        title,
        category,
        location,
        summary,
        contentExcerpt,
        fileType,
        fileSize,
        filePath: storedFileName,
        originalFileName,
        mimeType,
        externalUrl,
        author,
        tags,
        documentDate: new Date(),
      },
    });

    return NextResponse.json({ document: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/documents/upload]", error);
    return NextResponse.json(
      { error: "Gagal mengunggah dokumen ke penyimpanan lokal." },
      { status: 500 }
    );
  }
}
