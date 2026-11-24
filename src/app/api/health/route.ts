import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSupabaseStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [documents, assets] = await Promise.all([
      prisma.document.count(),
      prisma.asset.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      database: "connected (postgresql)",
      supabaseStorage: isSupabaseStorageConfigured() ? "configured" : "not_configured",
      counts: { documents, assets },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/health]", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 }
    );
  }
}
