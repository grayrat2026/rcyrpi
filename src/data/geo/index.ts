// ============================================================
// Bangladesh Geo — combined index & helpers
// 64 districts, ~495 upazilas, city-corporation thanas (real)
// ============================================================

import { DIVISIONS_A, type GeoDistrict } from "./districts-a";
import { DIVISIONS_B } from "./districts-b";

export type { GeoDistrict };

export const BD_DISTRICTS: GeoDistrict[] = [...DIVISIONS_A, ...DIVISIONS_B];

export const DIVISIONS = [
  { en: "Dhaka", bn: "ঢাকা" },
  { en: "Chattogram", bn: "চট্টগ্রাম" },
  { en: "Barishal", bn: "বরিশাল" },
  { en: "Khulna", bn: "খুলনা" },
  { en: "Rajshahi", bn: "রাজশাহী" },
  { en: "Rangpur", bn: "রংপুর" },
  { en: "Mymensingh", bn: "ময়মনসিংহ" },
  { en: "Sylhet", bn: "সিলেট" },
] as const;

export const RANGPUR_CENTER = { lat: 25.7439, lng: 89.2752, radiusKm: 700 };

export function findDistrict(en: string): GeoDistrict | undefined {
  return BD_DISTRICTS.find((d) => d.en === en);
}

/** upazila options for a district */
export function getUpazilas(districtEn: string): [string, string][] {
  return findDistrict(districtEn)?.up ?? [];
}

/** thana options = own upazila (thana ≈ upazila in BD) + city-corporation thanas */
export function getThanas(districtEn: string): [string, string][] {
  const d = findDistrict(districtEn);
  if (!d) return [];
  const own: [string, string][] = d.up.map(([en, bn]) =>
    bn.includes("সদর") ? [en, bn] : [en, `${bn} (থানা)`]
  );
  return [...(d.th ?? []), ...own];
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
