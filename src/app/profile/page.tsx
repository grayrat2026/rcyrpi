import type { Metadata } from "next";
import { ProfilePage } from "@/components/pages/profile-page";

export const metadata: Metadata = { title: "My Profile" };

export default function ProfileRoute() {
  return <ProfilePage />;
}
