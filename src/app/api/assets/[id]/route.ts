import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Aset tidak ditemukan." }, { status: 404 });
    }

    const serialNumber = body.serialNumber?.trim() || existing.serialNumber;
    if (serialNumber !== existing.serialNumber) {
      const conflict = await prisma.asset.findUnique({ where: { serialNumber } });
      if (conflict) {
        return NextResponse.json(
          { error: `Serial Number "${serialNumber}" sudah digunakan oleh ${conflict.name}.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        deviceType: body.deviceType?.trim() ?? existing.deviceType,
        cluster: body.cluster?.trim() ?? existing.cluster,
        wwn: body.wwn?.trim() ?? existing.wwn,
        location: body.location?.trim() ?? existing.location,
        rackCoordinate: body.rackCoordinate?.trim() ?? existing.rackCoordinate,
        serialNumber,
        status: body.status?.trim() ?? existing.status,
        vendorModel:
          body.vendorModel !== undefined ? body.vendorModel?.trim() || null : existing.vendorModel,
        ipManagement:
          body.ipManagement !== undefined ? body.ipManagement?.trim() || null : existing.ipManagement,
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
      },
    });

    return NextResponse.json({ asset: updated });
  } catch (error) {
    console.error("[PATCH /api/assets/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui data aset." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("[DELETE /api/assets/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus data aset." }, { status: 500 });
  }
}
