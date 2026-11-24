import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportAssetRow {
  name?: string;
  deviceType?: string;
  cluster?: string;
  wwn?: string;
  location?: string;
  rackCoordinate?: string;
  serialNumber?: string;
  status?: string;
  vendorModel?: string;
  ipManagement?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: ImportAssetRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data CSV yang diterima." },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = r.name?.trim();
      const cluster = r.cluster?.trim();
      const wwn = r.wwn?.trim();
      const location = r.location?.trim() || "GTI Ragunan";
      const rackCoordinate = r.rackCoordinate?.trim();
      const serialNumber = r.serialNumber?.trim();

      if (!name || !cluster || !wwn || !rackCoordinate || !serialNumber) {
        errors.push({
          row: i + 1,
          reason:
            "Field wajib (name, cluster, wwn, rackCoordinate, serialNumber) tidak lengkap.",
        });
        continue;
      }

      const existing = await prisma.asset.findUnique({
        where: { serialNumber },
      });

      const payload = {
        name,
        deviceType: r.deviceType?.trim() || "Server",
        cluster,
        wwn,
        location,
        rackCoordinate,
        serialNumber,
        status: r.status?.trim() || "Active",
        vendorModel: r.vendorModel?.trim() || null,
        ipManagement: r.ipManagement?.trim() || null,
        notes: r.notes?.trim() || null,
      };

      if (existing) {
        await prisma.asset.update({
          where: { serialNumber },
          data: payload,
        });
        updatedCount++;
      } else {
        await prisma.asset.create({ data: payload });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalReceived: rows.length,
      createdCount,
      updatedCount,
      failedCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("[POST /api/assets/import]", error);
    return NextResponse.json(
      { error: "Gagal memproses import CSV aset." },
      { status: 500 }
    );
  }
}
