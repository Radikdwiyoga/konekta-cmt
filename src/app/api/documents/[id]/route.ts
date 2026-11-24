import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus dokumen." }, { status: 500 });
  }
}
