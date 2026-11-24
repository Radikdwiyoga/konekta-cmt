import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document || !document.filePath) {
      return NextResponse.json(
        { error: "File lokal untuk dokumen ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Prevent path traversal by forcing basename only
    const safeName = path.basename(document.filePath);
    const fullPath = path.join(UPLOAD_DIR, safeName);
    const fileBuffer = await readFile(fullPath);

    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get("download") === "1";
    const downloadName = (document.originalFileName || safeName).replace(/"/g, "");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${downloadName}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[GET /api/documents/[id]/file]", error);
    return NextResponse.json(
      { error: "Gagal membaca file dari penyimpanan lokal." },
      { status: 404 }
    );
  }
}
