import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDocumentFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document || !document.filePath) {
      return NextResponse.json(
        { error: "File untuk dokumen ini tidak ditemukan." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get("download") === "1";

    const resolved = await resolveDocumentFile(
      document.filePath,
      document.originalFileName,
      forceDownload
    );

    if (resolved.type === "redirect") {
      return NextResponse.redirect(resolved.url, { status: 302 });
    }

    return new NextResponse(new Uint8Array(resolved.buffer), {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${resolved.downloadName}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[GET /api/documents/[id]/file]", error);
    return NextResponse.json(
      { error: "Gagal mengambil file dokumen." },
      { status: 404 }
    );
  }
}
