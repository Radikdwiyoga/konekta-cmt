import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const cluster = searchParams.get("cluster")?.trim() || "";

    const where: Record<string, unknown> = {};

    if (location && location !== "ALL") {
      where.location = location;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (cluster && cluster !== "ALL") {
      where.cluster = cluster;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { cluster: { contains: q, mode: "insensitive" } },
        { wwn: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { rackCoordinate: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { vendorModel: { contains: q, mode: "insensitive" } },
        { ipManagement: { contains: q, mode: "insensitive" } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: [{ location: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      assets,
      total: assets.length,
    });
  } catch (error) {
    console.error("[GET /api/assets]", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar aset server & storage." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      deviceType,
      cluster,
      wwn,
      location,
      rackCoordinate,
      serialNumber,
      status,
      vendorModel,
      ipManagement,
      notes,
    } = body;

    if (
      !name?.trim() ||
      !cluster?.trim() ||
      !wwn?.trim() ||
      !location?.trim() ||
      !rackCoordinate?.trim() ||
      !serialNumber?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Nama Perangkat, Cluster, WWN, Lokasi, Koordinat Rak, dan Serial Number wajib diisi.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.asset.findUnique({
      where: { serialNumber: serialNumber.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Serial Number "${serialNumber.trim()}" sudah terdaftar pada perangkat ${existing.name}.` },
        { status: 409 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        name: name.trim(),
        deviceType: deviceType?.trim() || "Server",
        cluster: cluster.trim(),
        wwn: wwn.trim(),
        location: location.trim(),
        rackCoordinate: rackCoordinate.trim(),
        serialNumber: serialNumber.trim(),
        status: status?.trim() || "Active",
        vendorModel: vendorModel?.trim() || null,
        ipManagement: ipManagement?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/assets]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan data aset." },
      { status: 500 }
    );
  }
}
