import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";

    const where: Record<string, unknown> = {};

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (location && location !== "ALL") {
      where.location = location;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { contentExcerpt: { contains: q } },
        { tags: { contains: q } },
        { author: { contains: q } },
        { driveFileId: { contains: q } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: [{ documentDate: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar dokumen." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      location,
      summary,
      contentExcerpt,
      fileType,
      fileSize,
      externalUrl,
      author,
      tags,
      documentDate,
    } = body;

    if (!title?.trim() || !category?.trim() || !location?.trim() || !summary?.trim() || !externalUrl?.trim()) {
      return NextResponse.json(
        { error: "Judul, kategori, lokasi, ringkasan, dan link eksternal wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.document.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        location: location.trim(),
        summary: summary.trim(),
        contentExcerpt: contentExcerpt?.trim() || null,
        fileType: (fileType?.trim() || "PDF").toUpperCase(),
        fileSize: fileSize?.trim() || null,
        externalUrl: externalUrl.trim(),
        author: author?.trim() || "Tim Maintenance Computes",
        tags: tags?.trim() || null,
        documentDate: documentDate ? new Date(documentDate) : new Date(),
      },
    });

    return NextResponse.json({ document: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan dokumen baru." },
      { status: 500 }
    );
  }
}
