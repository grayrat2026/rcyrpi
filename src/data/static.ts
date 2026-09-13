// ============================================================
// Static editorial content — activities, weekly schedule,
// 7 fundamental principles. Bilingual.
// ============================================================

import type { Activity } from "@/lib/types";

export const ACTIVITIES: Activity[] = [
  { id: "a1", icon: "Droplets", color: "red", title: { en: "Blood Donation", bn: "রক্তদান কর্মসূচি" }, desc: { en: "Voluntary blood donation camps & 24/7 donor pool for emergencies.", bn: "স্বেচ্ছাসেবী রক্তদান ক্যাম্প এবং ইমার্জেন্সির জন্য ২৪/৭ ডোনার পুল।" } },
  { id: "a2", icon: "BriefcaseMedical", color: "green", title: { en: "First Aid Training", bn: "প্রাথমিক চিকিৎসা প্রশিক্ষণ" }, desc: { en: "Certified first aid & CPR training for members and the community.", bn: "সদস্য ও কমিউনিটির জন্য সার্টিফায়েড প্রাথমিক চিকিৎসা ও সিপিআর প্রশিক্ষণ।" } },
  { id: "a3", icon: "LifeBuoy", color: "red", title: { en: "Disaster Response", bn: "দুর্যোগ মোকাবিলা" }, desc: { en: "Flood, storm & cold-wave relief — rescue support and relief distribution.", bn: "বন্যা, ঝড় ও শীতে ত্রাণ — উদ্ধার সহায়তা ও রিলিফ বিতরণ।" } },
  { id: "a4", icon: "Sparkles", color: "green", title: { en: "Hygiene Promotion", bn: "স্বাস্থ্যবিধি প্রচার" }, desc: { en: "Handwash campaigns, sanitation awareness in schools & communities.", bn: "হ্যান্ডওয়াশ ক্যাম্পেইন, স্কুল ও কমিউনিটিতে স্যানিটেশন সচেতনতা।" } },
  { id: "a5", icon: "HandHeart", color: "red", title: { en: "Community Service", bn: "কমিউনিটি সেবা" }, desc: { en: "Winter blanket drives, elderly home visits, gifts for hospitalized children.", bn: "শীতবস্ত্র বিতরণ, বয়স্ক আশ্রয়ণ পরিদর্শন, হাসপাতালের শিশুদের জন্য গিফট।" } },
  { id: "a6", icon: "Trophy", color: "green", title: { en: "Youth Leadership", bn: "যুব নেতৃত্ব উন্নয়ন" }, desc: { en: "Debates, workshops & exchange programs building tomorrow's humanitarian leaders.", bn: "বিতর্ক, কর্মশালা ও এক্সচেঞ্জ প্রোগ্রাম — আগামীর হিউম্যানিটেরিয়ান লিডার।" } },
  { id: "a7", icon: "Stethoscope", color: "red", title: { en: "Health Camps", bn: "স্বাস্থ্য ক্যাম্প" }, desc: { en: "Free health check-up camps with doctors for students & locals.", bn: "ছাত্রছাত্রী ও এলাকাবাসীর জন্য ডাক্তারদের ফ্রি হেলথ চেকআপ ক্যাম্প।" } },
  { id: "a8", icon: "TreePine", color: "green", title: { en: "Tree Plantation", bn: "বৃক্ষরোপণ" }, desc: { en: "Green campus drives & climate awareness for a safer tomorrow.", bn: "সবুজ ক্যাম্পাস অভিযান ও জলবায়ু সচেতনতা — নিরাপদ আগামীর জন্য।" } },
];

export interface ScheduleRow {
  day: { en: string; bn: string };
  time: string;
  activity: { en: string; bn: string };
  place: { en: string; bn: string };
  icon: string;
}

export const WEEKLY_SCHEDULE: ScheduleRow[] = [
  { day: { en: "Saturday", bn: "শনিবার" }, time: "4:00 PM", activity: { en: "Unit General Meeting", bn: "ইউনিট সাধারণ সভা" }, place: { en: "Unit Room", bn: "ইউনিট রুম" }, icon: "Users" },
  { day: { en: "Sunday", bn: "রবিবার" }, time: "4:30 PM", activity: { en: "First Aid Practice", bn: "প্রাথমিক চিকিৎসা অনুশীলন" }, place: { en: "Auditorium", bn: "অডিটোরিয়াম" }, icon: "BriefcaseMedical" },
  { day: { en: "Monday", bn: "সোমবার" }, time: "5:00 PM", activity: { en: "Blood Grouping Desk", bn: "ব্লাড গ্রুপিং ডেস্ক" }, place: { en: "Campus Gate", bn: "ক্যাম্পাস গেট" }, icon: "Droplets" },
  { day: { en: "Tuesday", bn: "মঙ্গলবার" }, time: "4:00 PM", activity: { en: "Disaster Drill", bn: "দুর্যোগ মহড়া" }, place: { en: "Open Field", bn: "খোলা মাঠ" }, icon: "Siren" },
  { day: { en: "Wednesday", bn: "বুধবার" }, time: "4:30 PM", activity: { en: "Community Visit", bn: "কমিউনিটি পরিদর্শন" }, place: { en: "Nearby Area", bn: "আশপাশের এলাকা" }, icon: "HandHeart" },
  { day: { en: "Thursday", bn: "বৃহস্পতিবার" }, time: "10:00 AM", activity: { en: "Training & Workshop", bn: "ট্রেনিং ও কর্মশালা" }, place: { en: "Seminar Hall", bn: "সেমিনার হল" }, icon: "BookOpen" },
];

export interface Principle {
  icon: string;
  title: { en: string; bn: string };
  desc: { en: string; bn: string };
}

export const PRINCIPLES: Principle[] = [
  { icon: "Heart", title: { en: "Humanity", bn: "মানবতা" }, desc: { en: "Preventing and easing human suffering wherever it is found.", bn: "যেখানেই মানুষের দুঃখ-কষ্ট, সেখানেই রক্ষা ও উপশমের চেষ্টা।" } },
  { icon: "Scale", title: { en: "Impartiality", bn: "নিরপেক্ষতা" }, desc: { en: "No discrimination — need comes first, nothing else.", bn: "কোনো বৈষম্য নয় — প্রয়োজনই প্রথম, অন্য কিছু নয়।" } },
  { icon: "EyeOff", title: { en: "Neutrality", bn: "স্বেচ্ছানিরপেক্ষতা" }, desc: { en: "Taking no sides in hostilities or political disputes.", bn: "কোনো বিরোধ বা রাজনৈতিক বিতর্কে পক্ষ নেওয়া নয়।" } },
  { icon: "Landmark", title: { en: "Independence", bn: "স্বাধীনতা" }, desc: { en: "Autonomy from any authority in humanitarian work.", bn: "মানবিক কাজে যেকোনো কর্তৃপক্ষ থেকে স্বাধীনতা।" } },
  { icon: "HandHeart", title: { en: "Voluntary Service", bn: "স্বেচ্ছাসেবী সেবা" }, desc: { en: "Relief is our motive — not gain of any kind.", bn: "সেবাই আমাদের উদ্দেশ্য — কোনো লাভ নয়।" } },
  { icon: "Users", title: { en: "Unity", bn: "ঐক্য" }, desc: { en: "One society per country — open to all, working as one.", bn: "দেশে একটিই সোসাইটি — সবার জন্য উন্মুক্ত, সবাই এক হয়ে।" } },
  { icon: "Globe2", title: { en: "Universality", bn: "সর্বজনীনতা" }, desc: { en: "A worldwide movement with equal status and duties.", bn: "সমান মর্যাদা ও দায়িত্বের এক বিশ্বব্যাপী আন্দোলন।" } },
];

export const EMERGENCY_HOTLINES = [
  { icon: "Siren", label: { en: "National Emergency", bn: "জাতীয় ইমার্জেন্সি" }, number: "999" },
  { icon: "Droplets", label: { en: "Blood Bank Rangpur", bn: "ব্লাড ব্যাংক রংপুর" }, number: "01700-000099" },
  { icon: "Ambulance", label: { en: "Ambulance", bn: "অ্যাম্বুলেন্স" }, number: "01700-000098" },
];
