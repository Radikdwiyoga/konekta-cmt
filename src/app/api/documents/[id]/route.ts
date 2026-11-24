import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[GET /api/documents/[id]]", error);
    return NextResponse.json({ error: "Gagal mengambil detail dokumen." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const existing = await prisma.document.findUnique({ where: { id } });

    if (existing?.filePath) {
      const safeName = path.basename(existing.filePath);
      await unlink(path.join(UPLOAD_DIR, safeName)).catch(() => {
        // Ignore if already removed from disk
      });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus dokumen." }, { status: 500 });
  }
}
