export const DOCUMENT_CATEGORIES = [
  "PM Report",
  "Infrastruktur",
  "Vendor/Logistik",
  "Administrasi",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DATA_CENTER_LOCATIONS = [
  "GTI Ragunan",
  "ODC Sentul",
] as const;

export type DataCenterLocation = (typeof DATA_CENTER_LOCATIONS)[number];

export const ASSET_STATUSES = [
  "Active",
  "Maintenance",
  "Standby",
  "Decommissioned",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_DEVICE_TYPES = [
  "Server",
  "Storage",
  "SAN Switch",
  "Hypervisor",
  "Backup Appliance",
] as const;

export type AssetDeviceType = (typeof ASSET_DEVICE_TYPES)[number];

export function formatDateId(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeId(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
