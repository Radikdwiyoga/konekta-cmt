import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DocumentHubClient } from "@/components/DocumentHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Document Hub — Konekta MCT Center",
  description:
    "Pencarian real-time dokumen PM Report, Infrastruktur, Vendor/Logistik, dan Administrasi Data Center GTI Ragunan & ODC Sentul.",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; selected?: string }>;
}) {
  const params = await searchParams;
  const documents = await prisma.document.findMany({
    orderBy: [{ documentDate: "desc" }, { updatedAt: "desc" }],
  });

  const serialized = documents.map((doc) => ({
    ...doc,
    documentDate: doc.documentDate.toISOString(),
    lastSyncedAt: doc.lastSyncedAt ? doc.lastSyncedAt.toISOString() : null,
  }));

  return (
    <DocumentHubClient
      initialDocuments={serialized}
      initialCategory={params.category || "ALL"}
      initialSelectedId={params.selected}
    />
  );
}
