import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_DOCUMENTS = [
  {
    driveFileId: "drv-pm-gti-2026-q3-001",
    title: "PM Report Q3 2026 — Compute Cluster & PowerStore SAN GTI Ragunan",
    category: "PM Report",
    location: "GTI Ragunan",
    summary:
      "Laporan Preventive Maintenance triwulan III untuk 12 host Dell PowerEdge R760 dan 2 unit Dell PowerStore 5000T di DC GTI Ragunan. Seluruh firmware iDRAC & BIOS berada di baseline stabil, suhu inlet rata-rata 21.4°C, tidak ditemukan degraded disk.",
    contentExcerpt:
      "RINGKASAN EKSEKUTIF PM Q3 2026 (GTI RAGUNAN)\n- Scope: Cluster CL-PROD-CORE-01, CL-PROD-DB-02, Storage Array STR-GTI-PS5000-01/02\n- Hasil Health Check: 100% PSU redundant OK, 24/24 FC SFP+ 32Gb optik dalam ambang RX/TX normal (-2.1 dBm s.d. -3.4 dBm)\n- Temuan Minor: 1x baterai CMOS pada SRV-GTI-ESX04 direkomendasikan penggantian pada window maintenance berikutnya.",
    fileType: "PDF",
    fileSize: "4.8 MB",
    externalUrl: "https://drive.google.com/file/d/drv-pm-gti-2026-q3-001/view",
    author: "Rizky Pratama (MCT Lead)",
    tags: "pm-report,powerstore,dell-r760,gti-ragunan,q3-2026",
    documentDate: new Date("2026-10-18T09:00:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-pm-odc-2026-q3-002",
    title: "PM Report Q3 2026 — DR Compute & Brocade SAN Fabric ODC Sentul",
    category: "PM Report",
    location: "ODC Sentul",
    summary:
      "Evaluasi preventive maintenance perangkat DRC ODC Sentul meliputi HPE Synergy Frame, NetApp AFF A400, dan Brocade G720 SAN Switch. Replikasi Metro/Async berjalan dengan RPO < 5 menit.",
    contentExcerpt:
      "CHECKLIST PREVENTIVE MAINTENANCE ODC SENTUL\n- Brocade G720 Fabric A & B: FOS v9.2.1b, port error counter = 0 CRC error\n- NetApp AFF A400: Aggregate utilization 61.2%, SnapMirror lag rata-rata 180 detik\n- Rekomendasi: Perlu pembersihan filter udara rak R02-C08 pada jadwal bulan depan.",
    fileType: "PDF",
    fileSize: "3.6 MB",
    externalUrl: "https://drive.google.com/file/d/drv-pm-odc-2026-q3-002/view",
    author: "Dimas Nugroho",
    tags: "pm-report,brocade,netapp,odc-sentul,drc",
    documentDate: new Date("2026-10-22T10:15:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-inf-gti-2026-003",
    title: "SAN Zoning & WWN Mapping Topology — GTI Ragunan Core Fabric",
    category: "Infrastruktur",
    location: "GTI Ragunan",
    summary:
      "Dokumen matriks pemetaan WWN HBA dual-fabric (Fabric A & B), alias zoning Brocade, serta alokasi LUN Masking untuk seluruh host ESXi produksi dan cluster Oracle RAC di GTI Ragunan.",
    contentExcerpt:
      "MATRIKS ZONING SAN FABRIC A/B — GTI RAGUNAN\nZone: Z_ESX01_PS5000_FA | Initiator: 50:00:09:73:00:1a:2b:01 | Target: 50:00:09:73:ff:01:00:10\nZone: Z_ESX02_PS5000_FA | Initiator: 50:00:09:73:00:1a:2b:02 | Target: 50:00:09:73:ff:01:00:10\nStandar penamaan zona mengikuti konvensi: Z_<HOST>_<ARRAY>_<FABRIC>.",
    fileType: "XLSX",
    fileSize: "1.9 MB",
    externalUrl: "https://drive.google.com/file/d/drv-inf-gti-2026-003/view",
    author: "Andi Wijaya",
    tags: "san-zoning,wwn,brocade,topology,gti-ragunan",
    documentDate: new Date("2026-11-05T07:45:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-inf-odc-2026-004",
    title: "Rack Elevation & Power Budget Layout — ODC Sentul Hall B",
    category: "Infrastruktur",
    location: "ODC Sentul",
    summary:
      "Denah elevasi rak R02-C05 hingga R02-C10 di Hall B ODC Sentul, termasuk kapasitas beban PDU A/B (kW), jalur kabel fiber trunk OM4, dan ruang kosong (U-space) untuk ekspansi 2027.",
    contentExcerpt:
      "POWER & SPACE SUMMARY ODC SENTUL HALL B\n- Rack R02-C08: Terpakai 34U / 42U | Beban PDU-A: 4.2 kW, PDU-B: 4.1 kW (Total 8.3 kW / 12 kW)\n- Rack R02-C09: Terpakai 28U / 42U | Beban PDU-A: 3.6 kW, PDU-B: 3.5 kW\n- Tersedia slot ekspansi 8U di bagian atas untuk node backup Rubrik.",
    fileType: "PDF",
    fileSize: "6.2 MB",
    externalUrl: "https://drive.google.com/file/d/drv-inf-odc-2026-004/view",
    author: "Hendra Kusuma",
    tags: "rack-elevation,pdu,power-budget,odc-sentul",
    documentDate: new Date("2026-11-11T04:20:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-ven-gti-2026-005",
    title: "BAST & RMA Penggantian NVMe Drive 7.68TB — Dell Technologies",
    category: "Vendor/Logistik",
    location: "GTI Ragunan",
    summary:
      "Berita Acara Serah Terima (BAST) dan tiket RMA #SR-884120 untuk penggantian 2 unit NVMe SSD 7.68TB pada enclosure PowerStore 5000T GTI Ragunan dengan SLA 4-Hour Mission Critical.",
    contentExcerpt:
      "DETAIL LOGISTIK RMA DELL TECHNOLOGIES\n- Nomor Tiket: SR-884120 | Part Number: 0YJ4K2 (7.68TB NVMe RI)\n- Teknisi Vendor: Budi Santoso (Dell ProSupport Plus)\n- Status: Selesai terpasang & rebuild array selesai dalam 42 menit. Drive rusak telah diserahkan sesuai prosedur media retention.",
    fileType: "PDF",
    fileSize: "1.4 MB",
    externalUrl: "https://drive.google.com/file/d/drv-ven-gti-2026-005/view",
    author: "Siti Rahmawati",
    tags: "bast,rma,dell,nvme,sparepart,gti-ragunan",
    documentDate: new Date("2026-11-14T11:30:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-ven-odc-2026-006",
    title: "Kontrak Support & Daftar SLA Vendor Compute-Storage 2026-2027",
    category: "Vendor/Logistik",
    location: "ODC Sentul",
    summary:
      "Matriks kontrak pemeliharaan aktif (Dell, HPE, NetApp, Brocade), nomor eskalasi 24/7, tanggal kedaluwarsa garansi perangkat, serta prosedur pengajuan izin masuk vendor ke ODC Sentul.",
    contentExcerpt:
      "RINGKASAN KONTRAK SUPPORT AKTIF\n- Dell ProSupport Plus (GTI & ODC): Berlaku s.d. 31 Des 2027 (SLA 4-Hour Onsite)\n- HPE Pointnext Tech Care (ODC Sentul): Berlaku s.d. 30 Jun 2027\n- NetApp SupportEdge Advisor: Berlaku s.d. 15 Sep 2027",
    fileType: "GSHEET",
    fileSize: "840 KB",
    externalUrl: "https://drive.google.com/file/d/drv-ven-odc-2026-006/view",
    author: "Siti Rahmawati",
    tags: "sla,vendor,kontrak,garansi,eskalasi",
    documentDate: new Date("2026-09-28T06:00:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-adm-gti-2026-007",
    title: "SOP Change Request & Maintenance Window — Tim Maintenance Computes",
    category: "Administrasi",
    location: "GTI Ragunan",
    summary:
      "Prosedur operasional standar pengajuan CAB/Change Request, rollback plan firmware upgrade, dan koordinasi komunikasi dengan NOC & Application Owner sebelum eksekusi maintenance di GTI Ragunan.",
    contentExcerpt:
      "ALUR PERSETUJUAN CHANGE REQUEST (MCT)\n1. Submit tiket CR minimal H-3 sebelum Maintenance Window (Sabtu 22:00 - Minggu 04:00 WIB).\n2. Lampirkan pre-check snapshot, daftar WWN/Host terdampak, dan rencana rollback.\n3. Approval wajib dari MCT Lead dan Infrastructure Manager.",
    fileType: "GDOC",
    fileSize: "620 KB",
    externalUrl: "https://drive.google.com/file/d/drv-adm-gti-2026-007/view",
    author: "Rizky Pratama (MCT Lead)",
    tags: "sop,change-request,cab,maintenance-window",
    documentDate: new Date("2026-10-03T08:00:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
  {
    driveFileId: "drv-adm-odc-2026-008",
    title: "Form Izin Akses Data Center & Jadwal Piket On-Site ODC Sentul Q4",
    category: "Administrasi",
    location: "ODC Sentul",
    summary:
      "Daftar personel terotorisasi akses biometrik ruang server ODC Sentul beserta jadwal piket on-site engineer Maintenance Computes untuk periode Oktober–Desember 2026.",
    contentExcerpt:
      "JADWAL PIKET & OTORISASI AKSES ODC SENTUL Q4\n- Shift Onsite Mingguan: Dimas Nugroho / Hendra Kusuma / Fajar Ramadhan\n- Prosedur kunjungan vendor: Wajib melampirkan KTP, surat tugas, dan daftar serial number perangkat keluar/masuk minimal 24 jam sebelumnya.",
    fileType: "DOCX",
    fileSize: "510 KB",
    externalUrl: "https://drive.google.com/file/d/drv-adm-odc-2026-008/view",
    author: "Fajar Ramadhan",
    tags: "akses-dc,jadwal-piket,administrasi,odc-sentul",
    documentDate: new Date("2026-11-01T03:00:00Z"),
    lastSyncedAt: new Date("2026-11-20T02:30:00Z"),
  },
];

const SEED_ASSETS = [
  {
    name: "SRV-GTI-ESX01",
    deviceType: "Hypervisor",
    cluster: "CL-PROD-CORE-01",
    wwn: "50:00:09:73:00:1a:2b:01",
    location: "GTI Ragunan",
    rackCoordinate: "R04-C12 / U18-U19",
    serialNumber: "DL760-GTI-99401A",
    status: "Active",
    vendorModel: "Dell PowerEdge R760",
    ipManagement: "10.24.10.101",
    notes: "Primary VMware ESXi 8.0 U3 host — Core Banking & Middleware",
  },
  {
    name: "SRV-GTI-ESX02",
    deviceType: "Hypervisor",
    cluster: "CL-PROD-CORE-01",
    wwn: "50:00:09:73:00:1a:2b:02",
    location: "GTI Ragunan",
    rackCoordinate: "R04-C12 / U20-U21",
    serialNumber: "DL760-GTI-99402B",
    status: "Active",
    vendorModel: "Dell PowerEdge R760",
    ipManagement: "10.24.10.102",
    notes: "Primary VMware ESXi 8.0 U3 host — HA Pair ESX01",
  },
  {
    name: "SRV-GTI-ESX04",
    deviceType: "Hypervisor",
    cluster: "CL-PROD-CORE-01",
    wwn: "50:00:09:73:00:1a:2b:04",
    location: "GTI Ragunan",
    rackCoordinate: "R04-C12 / U24-U25",
    serialNumber: "DL760-GTI-99404D",
    status: "Maintenance",
    vendorModel: "Dell PowerEdge R760",
    ipManagement: "10.24.10.104",
    notes: "Jadwal penggantian baterai CMOS & update BIOS 2.3.4",
  },
  {
    name: "STR-GTI-PS5000-01",
    deviceType: "Storage",
    cluster: "SAN-PROD-TIER0",
    wwn: "50:00:09:73:ff:01:00:10",
    location: "GTI Ragunan",
    rackCoordinate: "R04-C14 / U10-U13",
    serialNumber: "PS5000T-GTI-77210",
    status: "Active",
    vendorModel: "Dell PowerStore 5000T",
    ipManagement: "10.24.12.20",
    notes: "All-NVMe Tier-0 Storage Array — 184 TB Raw, Dual Controller",
  },
  {
    name: "SW-GTI-SAN-FA01",
    deviceType: "SAN Switch",
    cluster: "SAN-FABRIC-A",
    wwn: "10:00:c4:f5:7c:89:a1:01",
    location: "GTI Ragunan",
    rackCoordinate: "R04-C14 / U40",
    serialNumber: "BRC-G720-GTI-3011",
    status: "Active",
    vendorModel: "Brocade G720 64-Port 32Gb FC",
    ipManagement: "10.24.12.11",
    notes: "Core SAN Fabric A Switch — FOS v9.2.1b",
  },
  {
    name: "SRV-ODC-SYN01",
    deviceType: "Server",
    cluster: "CL-DR-FINANCE",
    wwn: "50:01:43:80:42:bc:11:01",
    location: "ODC Sentul",
    rackCoordinate: "R02-C08 / U12-U21",
    serialNumber: "HPE-SYN12K-ODC-5510",
    status: "Active",
    vendorModel: "HPE Synergy 12000 Frame (8x 480 Gen11)",
    ipManagement: "10.38.10.51",
    notes: "DR Compute Frame — Replikasi aktif dari GTI Ragunan",
  },
  {
    name: "STR-ODC-NTAP-01",
    deviceType: "Storage",
    cluster: "SAN-DR-TIER1",
    wwn: "50:0a:09:80:89:4d:33:10",
    location: "ODC Sentul",
    rackCoordinate: "R02-C08 / U04-U07",
    serialNumber: "NTAP-A400-ODC-8812",
    status: "Active",
    vendorModel: "NetApp AFF A400",
    ipManagement: "10.38.12.30",
    notes: "Target SnapMirror Async DR — Utilisasi 61.2%",
  },
  {
    name: "BKP-ODC-RBK01",
    deviceType: "Backup Appliance",
    cluster: "CL-BACKUP-IMMUTABLE",
    wwn: "50:00:c5:00:d1:22:90:01",
    location: "ODC Sentul",
    rackCoordinate: "R02-C09 / U28-U29",
    serialNumber: "RBK-R6412S-ODC-4109",
    status: "Standby",
    vendorModel: "Rubrik r6412s Appliance",
    ipManagement: "10.38.14.15",
    notes: "Immutable off-site backup vault — retention 90 hari",
  },
  {
    name: "SRV-GTI-DB-OLD09",
    deviceType: "Server",
    cluster: "CL-LEGACY-DECOM",
    wwn: "50:00:09:73:00:09:11:09",
    location: "GTI Ragunan",
    rackCoordinate: "R05-C02 / U06-U07",
    serialNumber: "DL740-GTI-44109X",
    status: "Decommissioned",
    vendorModel: "Dell PowerEdge R740xd",
    ipManagement: "10.24.10.199",
    notes: "Menunggu jadwal unrack & penghapusan aset Q4",
  },
];

async function main() {
  console.log("Seeding Konekta MCT Center database...");

  for (const doc of SEED_DOCUMENTS) {
    await prisma.document.upsert({
      where: { driveFileId: doc.driveFileId },
      update: {},
      create: doc,
    });
  }

  for (const asset of SEED_ASSETS) {
    await prisma.asset.upsert({
      where: { serialNumber: asset.serialNumber },
      update: {},
      create: asset,
    });
  }

  const logCount = await prisma.syncLog.count();
  if (logCount === 0) {
    await prisma.syncLog.create({
      data: {
        source: "google_drive",
        folderId: "seed-initial-snapshot",
        authMode: "service_account",
        status: "success",
        filesFound: SEED_DOCUMENTS.length,
        filesSynced: SEED_DOCUMENTS.length,
        message: "Inisialisasi katalog dokumen awal (seed data enterprise MCT Center).",
      },
    });
  }

  console.log(
    `Seeding selesai: ${SEED_DOCUMENTS.length} dokumen & ${SEED_ASSETS.length} aset.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
