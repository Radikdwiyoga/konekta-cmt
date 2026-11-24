import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AssetDirectoryClient } from "@/components/AssetDirectoryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Asset & Host Directory — Konekta MCT Center",
  description:
    "Direktori interaktif perangkat server, storage, cluster, WWN, koordinat rak, dan serial number tim Maintenance Computes.",
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const assets = await prisma.asset.findMany({
    orderBy: [{ location: "asc" }, { name: "asc" }],
  });

  const serialized = assets.map((asset) => ({
    ...asset,
    updatedAt: asset.updatedAt.toISOString(),
  }));

  return (
    <AssetDirectoryClient
      initialAssets={serialized}
      initialStatus={params.status || "ALL"}
    />
  );
}
