// ============================================================
// Built-in Template Library (28 templates)
// Server-side library — admin picks one to build notices,
// broadcasts, events, donations & gifts quickly.
// Swap with Supabase table `templates` later (same shape).
// ============================================================

import type { Tpl } from "@/lib/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const PATIENT_TYPES = [
  "প্রেগন্যান্সি / Pregnant",
  "হাত ভাঙা / Hand broken",
  "পা ভাঙা / Leg broken",
  "সার্জারি / Surgery",
  "শিশু / Child",
  "বয়স্ক / Elderly",
  "দুর্ঘটনা / Accident",
  "ক্যান্সার / Cancer",
];
const DISTRICTS_SHORT = [
  "রংপুর / Rangpur", "দিনাজপুর / Dinajpur", "কুড়িগ্রাম / Kurigram",
  "গাইবান্ধা / Gaibandha", "নীলফামারী / Nilphamari", "লালমনিরহাট / Lalmonirhat",
  "পঞ্চগড় / Panchagarh", "ঠাকুরগাঁও / Thakurgaon", "ঢাকা / Dhaka", "অন্যান্য / Other",
];

export const TEMPLATES: Tpl[] = [
  // ---------- BLOOD (4) ----------
  {
    id: "blood-urgent",
    group: "blood",
    icon: "Droplets",
    severity: "critical",
    title: { en: "Blood Needed — Urgent", bn: "রক্ত প্রয়োজন — আর্জেন্ট" },
    fields: [
      { key: "patient", label: { en: "Patient Name", bn: "রোগীর নাম" }, type: "text", required: true },
      { key: "blood_group", label: { en: "Blood Group", bn: "রক্তের গ্রুপ" }, type: "select", options: BLOOD_GROUPS, required: true },
      { key: "bags", label: { en: "Bags Needed", bn: "কয় ব্যাগ" }, type: "number", required: true },
      { key: "hospital", label: { en: "Hospital", bn: "হাসপাতাল" }, type: "text", required: true },
      { key: "phone", label: { en: "Contact Phone", bn: "ফোন" }, type: "tel", required: true },
      { key: "when", label: { en: "When", bn: "কখন" }, type: "text", placeholder: { en: "within 1-2 hr", bn: "১-২ ঘণ্টার মধ্যে" } },
    ],
    defaults: {
      title: { en: "BLOOD NEEDED URGENTLY", bn: "জরুরি ভিত্তিতে রক্ত প্রয়োজন" },
      body: { en: "A patient urgently needs blood. Please contact immediately if you are a donor.", bn: "একজন রোগীর জরুরি ভিত্তিতে রক্ত প্রয়োজন। ডোনার হলে দয়া করে এখনই যোগাযোগ করুন।" },
    },
  },
  {
    id: "blood-surgery",
    group: "blood",
    icon: "Stethoscope",
    severity: "high",
    title: { en: "Blood for Surgery", bn: "সার্জারির জন্য রক্ত" },
    fields: [
      { key: "patient", label: { en: "Patient Name", bn: "রোগীর নাম" }, type: "text", required: true },
      { key: "blood_group", label: { en: "Blood Group", bn: "রক্তের গ্রুপ" }, type: "select", options: BLOOD_GROUPS, required: true },
      { key: "bags", label: { en: "Bags Needed", bn: "কয় ব্যাগ" }, type: "number" },
      { key: "hospital", label: { en: "Hospital", bn: "হাসপাতাল" }, type: "text", required: true },
      { key: "surgery_date", label: { en: "Surgery Date", bn: "সার্জারির তারিখ" }, type: "date" },
      { key: "phone", label: { en: "Contact Phone", bn: "ফোন" }, type: "tel", required: true },
    ],
    defaults: {
      title: { en: "Blood needed for surgery", bn: "সার্জারির জন্য রক্ত প্রয়োজন" },
      body: { en: "Blood is needed for a scheduled surgery. Donors are requested to be present.", bn: "পরিকল্পিত সার্জারির জন্য রক্ত প্রয়োজন। ডোনারদের উপস্থিত থাকার অনুরোধ করা হলো।" },
    },
  },
  {
    id: "blood-thalassemia",
    group: "blood",
    icon: "HeartPulse",
    severity: "medium",
    title: { en: "Regular Blood — Thalassemia", bn: "নিয়মিত রক্ত — থ্যালাসেমিয়া" },
    fields: [
      { key: "patient", label: { en: "Patient Name", bn: "রোগীর নাম" }, type: "text", required: true },
      { key: "blood_group", label: { en: "Blood Group", bn: "রক্তের গ্রুপ" }, type: "select", options: BLOOD_GROUPS, required: true },
      { key: "cycle", label: { en: "Every (days)", bn: "প্রতি (দিন পর পর)" }, type: "number" },
      { key: "hospital", label: { en: "Hospital", bn: "হাসপাতাল" }, type: "text" },
      { key: "phone", label: { en: "Contact Phone", bn: "ফোন" }, type: "tel", required: true },
    ],
    defaults: {
      title: { en: "Regular blood support needed", bn: "নিয়মিত রক্ত সহায়তা প্রয়োজন" },
      body: { en: "A thalassemia warrior needs regular blood support. Join the donor pool.", bn: "একজন থ্যালাসেমিয়া যোদ্ধার নিয়মিত রক্ত সহায়তা প্রয়োজন। ডোনার পুলে যোগ দিন।" },
    },
  },
  {
    id: "blood-donor-call",
    group: "blood",
    icon: "Users",
    severity: "low",
    title: { en: "Donor Pool Registration", bn: "ডোনার পুল রেজিস্ট্রেশন" },
    fields: [
      { key: "blood_group", label: { en: "Your Blood Group", bn: "আপনার গ্রুপ" }, type: "select", options: BLOOD_GROUPS },
      { key: "last_donation", label: { en: "Last Donation (date)", bn: "শেষ রক্তদান (তারিখ)" }, type: "date" },
      { key: "phone", label: { en: "Phone", bn: "ফোন" }, type: "tel", required: true },
    ],
    defaults: {
      title: { en: "Join the voluntary donor pool", bn: "স্বেচ্ছাসেবী ডোনার পুলে যোগ দিন" },
      body: { en: "Register as a voluntary blood donor — one call can save a life.", bn: "স্বেচ্ছাসেবী রক্তদাতা হিসেবে রেজিস্টার করুন — একটি কল একটি জীবন বাঁচাতে পারে।" },
    },
  },

  // ---------- EMERGENCY (8) ----------
  {
    id: "em-earthquake",
    group: "emergency",
    icon: "Activity",
    severity: "critical",
    title: { en: "Earthquake Alert", bn: "ভূমিকম্প সতর্কতা" },
    fields: [
      { key: "magnitude", label: { en: "Magnitude", bn: "মাত্রা" }, type: "text" },
      { key: "epicenter", label: { en: "Epicenter", bn: "উপকেন্দ্র" }, type: "text" },
      { key: "safety_msg", label: { en: "Safety Message", bn: "নিরাপত্তা বার্তা" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "EARTHQUAKE DETECTED", bn: "ভূমিকম্প অনুভূত হয়েছে" },
      body: { en: "Stay away from buildings, keep calm, help elderly & children. Assembly point: institute open field.", bn: "ভবন থেকে দূরে থাকুন, শান্ত থাকুন, বয়স্ক ও শিশুদের সাহায্য করুন। সমাবেশ স্থান: ইনস্টিটিউটের খোলা মাঠ।" },
    },
  },
  {
    id: "em-flood",
    group: "emergency",
    icon: "Waves",
    severity: "critical",
    title: { en: "Flood Alert", bn: "বন্যা সতর্কতা" },
    fields: [
      { key: "area", label: { en: "Affected Area", bn: "এলাকা" }, type: "text", required: true },
      { key: "water_level", label: { en: "Water Level Trend", bn: "পানির অবস্থা" }, type: "select", options: ["উঠছে / Rising", "স্থির / Stable", "নামছে / Falling"] },
      { key: "relief_point", label: { en: "Relief Point", bn: "ত্রাণ কেন্দ্র" }, type: "text" },
    ],
    defaults: {
      title: { en: "FLOOD WARNING", bn: "বন্যার পূর্বাভাস" },
      body: { en: "Move to higher ground. Relief camp & first aid available at the shelter point.", bn: "উঁচু স্থানে চলে যান। শেল্টারে ত্রাণ ও প্রাথমিক চিকিৎসার ব্যবস্থা রয়েছে।" },
    },
  },
  {
    id: "em-fire",
    group: "emergency",
    icon: "Flame",
    severity: "critical",
    title: { en: "Fire Incident", bn: "অগ্নিকাণ্ড" },
    fields: [
      { key: "location", label: { en: "Location", bn: "স্থান" }, type: "text", required: true },
      { key: "spread", label: { en: "Situation", bn: "পরিস্থিতি" }, type: "select", options: ["নিয়ন্ত্রণে / Controlled", "ছড়াচ্ছে / Spreading", "নেভানো হয়েছে / Extinguished"] },
      { key: "help_needed", label: { en: "Help Needed", bn: "সাহায্য প্রয়োজন" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "FIRE EMERGENCY", bn: "অগ্নিকাণ্ড — জরুরি" },
      body: { en: "Volunteers assemble with first-aid kits. Call 102 for fire service.", bn: "স্বেচ্ছাসেবীরা প্রাথমিক চিকিৎসা কিট নিয়ে সমাবেশ করুন। ফায়ার সার্ভিসে ১০২ নম্বরে কল করুন।" },
    },
  },
  {
    id: "em-accident",
    group: "emergency",
    icon: "Car",
    severity: "high",
    title: { en: "Road Accident Response", bn: "সড়ক দুর্ঘটনা" },
    fields: [
      { key: "location", label: { en: "Location", bn: "স্থান" }, type: "text", required: true },
      { key: "injured", label: { en: "Injured Count", bn: "আহত সংখ্যা" }, type: "number" },
      { key: "blood_need", label: { en: "Blood Need (group)", bn: "রক্ত প্রয়োজন (গ্রুপ)" }, type: "text" },
    ],
    defaults: {
      title: { en: "Road accident — emergency response", bn: "সড়ক দুর্ঘটনা — ইমার্জেন্সি রেসপন্স" },
      body: { en: "Trained first-aiders urgently needed on spot. Ambulance info will be updated.", bn: "জায়গায় প্রশিক্ষিত প্রাথমিক চিকিৎসাকারী প্রয়োজন। অ্যাম্বুলেন্সের তথ্য আপডেট করা হবে।" },
    },
  },
  {
    id: "em-cyclone",
    group: "emergency",
    icon: "Wind",
    severity: "high",
    title: { en: "Cyclone / Storm Alert", bn: "ঘূর্ণিঝড় / ঝড় সতর্কতা" },
    fields: [
      { key: "signal", label: { en: "Danger Signal", bn: "বিপদ সংকেত" }, type: "number" },
      { key: "area", label: { en: "Area", bn: "এলাকা" }, type: "text" },
      { key: "shelter", label: { en: "Shelter Point", bn: "আশ্রয় কেন্দ্র" }, type: "text" },
    ],
    defaults: {
      title: { en: "Cyclone alert — take shelter", bn: "ঘূর্ণিঝড় সতর্কতা — আশ্রয় নিন" },
      body: { en: "Move to the nearest shelter with essentials. Volunteers will guide you.", bn: "প্রয়োজনীয় জিনিস নিয়ে কাছের আশ্রয়কেন্দ্রে যান। স্বেচ্ছাসেবীরা পথ দেখাবেন।" },
    },
  },
  {
    id: "em-coldwave",
    group: "emergency",
    icon: "CloudSnow",
    severity: "medium",
    title: { en: "Cold Wave Relief", bn: "শীতবস্ত্র বিতরণ" },
    fields: [
      { key: "area", label: { en: "Area", bn: "এলাকা" }, type: "text" },
      { key: "temp", label: { en: "Temperature", bn: "তাপমাত্রা" }, type: "text" },
      { key: "collection_point", label: { en: "Blanket Collection Point", bn: "কম্বল সংগ্রহ স্থান" }, type: "text" },
    ],
    defaults: {
      title: { en: "Cold wave — blanket drive", bn: "শৈত্যপ্রবাহ — কম্বল বিতরণ" },
      body: { en: "Old/new blankets being collected for the suffering. Donate at the unit room.", bn: "অসহায় মানুষের জন্য কম্বল সংগ্রহ চলছে। ইউনিট রুমে দিন হাতে ধরুন।" },
    },
  },
  {
    id: "em-building",
    group: "emergency",
    icon: "Building2",
    severity: "high",
    title: { en: "Building Collapse", bn: "ভবন ধস" },
    fields: [
      { key: "location", label: { en: "Location", bn: "স্থান" }, type: "text", required: true },
      { key: "trapped", label: { en: "People Trapped", bn: "আটকা মানুষ" }, type: "number" },
      { key: "contact", label: { en: "On-spot Contact", bn: "অন-স্পট যোগাযোগ" }, type: "tel" },
    ],
    defaults: {
      title: { en: "Building collapse — rescue op", bn: "ভবন ধস — উদ্ধার অভিযান" },
      body: { en: "Do not crowd the area. Trained rescuers & blood donors stand by.", bn: "জায়গায় ভিড় করবেন না। প্রশিক্ষিত উদ্ধারকর্মী ও রক্তদাতা প্রস্তুত।" },
    },
  },
  {
    id: "em-gasleak",
    group: "emergency",
    icon: "AlertTriangle",
    severity: "high",
    title: { en: "Gas Leak / Explosion Risk", bn: "গ্যাস লিক / বিস্ফোরণ ঝুঁকি" },
    fields: [
      { key: "location", label: { en: "Location", bn: "স্থান" }, type: "text", required: true },
      { key: "evacuation", label: { en: "Evacuation Radius", bn: "সরিয়ে নেওয়ার পরিসর" }, type: "text" },
    ],
    defaults: {
      title: { en: "Gas leak — evacuate area", bn: "গ্যাস লিক — এলাকা খালি করুন" },
      body: { en: "No flames, no switches. Evacuate calmly; volunteers guiding at gate.", bn: "কোনো আগুন বা সুইচ নয়। শান্তভাবে সরে যান; গেটে স্বেচ্ছাসেবীরা গাইড করছেন।" },
    },
  },

  // ---------- EVENT (6) ----------
  {
    id: "ev-blood-camp",
    group: "event",
    icon: "Droplet",
    severity: "low",
    title: { en: "Blood Donation Camp", bn: "রক্তদান কর্মসূচি" },
    fields: [
      { key: "date", label: { en: "Date", bn: "তারিখ" }, type: "date", required: true },
      { key: "time", label: { en: "Time", bn: "সময়" }, type: "time" },
      { key: "venue", label: { en: "Venue", bn: "স্থান" }, type: "text", required: true },
      { key: "partner", label: { en: "Partner (hospital/bank)", bn: "সহযোগী" }, type: "text" },
    ],
    defaults: {
      title: { en: "Blood Donation Camp", bn: "রক্তদান কর্মসূচি" },
      body: { en: "Give blood, save lives! Free health screening for every donor.", bn: "রক্ত দিন, জীবন বাঁচান! প্রত্যেক ডোনারের জন্য ফ্রি হেলথ স্ক্রিনিং।" },
    },
  },
  {
    id: "ev-firstaid",
    group: "event",
    icon: "BriefcaseMedical",
    severity: "low",
    title: { en: "First Aid Training", bn: "প্রাথমিক চিকিৎসা প্রশিক্ষণ" },
    fields: [
      { key: "date", label: { en: "Start Date", bn: "শুরুর তারিখ" }, type: "date", required: true },
      { key: "days", label: { en: "Duration (days)", bn: "কত দিন" }, type: "number" },
      { key: "venue", label: { en: "Venue", bn: "স্থান" }, type: "text" },
      { key: "fee", label: { en: "Fee (BDT)", bn: "ফি (টাকা)" }, type: "number" },
    ],
    defaults: {
      title: { en: "First Aid & Disaster Response Training", bn: "প্রাথমিক চিকিৎসা ও দুর্যোগ প্রশিক্ষণ" },
      body: { en: "Certified training by BDRCS trainers. Limited seats — register early!", bn: "বিডিআরসিএস প্রশিক্ষকদের সার্টিফিকেট কোর্স। সীমিত আসন — আগে রেজিস্টার করুন!" },
    },
  },
  {
    id: "ev-meeting",
    group: "event",
    icon: "CalendarDays",
    severity: "low",
    title: { en: "General Meeting", bn: "সাধারণ সভা" },
    fields: [
      { key: "date", label: { en: "Date", bn: "তারিখ" }, type: "date", required: true },
      { key: "time", label: { en: "Time", bn: "সময়" }, type: "time" },
      { key: "venue", label: { en: "Venue", bn: "স্থান" }, type: "text" },
      { key: "agenda", label: { en: "Agenda", bn: "আলোচ্যসূচি" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "Monthly General Meeting", bn: "মাসিক সাধারণ সভা" },
      body: { en: "All members requested to attend on time. Attendance is mandatory.", bn: "সকল সদস্যকে যথাসময়ে উপস্থিত থাকার অনুরোধ। উপস্থিতি বাধ্যতামূলক।" },
    },
  },
  {
    id: "ev-cleanliness",
    group: "event",
    icon: "Trash2",
    severity: "low",
    title: { en: "Cleanliness Program", bn: "পরিচ্ছন্নতা কর্মসূচি" },
    fields: [
      { key: "date", label: { en: "Date", bn: "তারিখ" }, type: "date", required: true },
      { key: "area", label: { en: "Area", bn: "এলাকা" }, type: "text" },
      { key: "tools", label: { en: "Bring Tools", bn: "যা আনবেন" }, type: "text" },
    ],
    defaults: {
      title: { en: "Community Cleanliness Drive", bn: "কমিউনিটি পরিচ্ছন্নতা অভিযান" },
      body: { en: "Clean area, clean mind! Gloves & bags provided by the unit.", bn: "পরিচ্ছন্ন এলাকা, পরিচ্ছন্ন মন! গ্লাভস ও ব্যাগ ইউনিট থেকে দেওয়া হবে।" },
    },
  },
  {
    id: "ev-rally",
    group: "event",
    icon: "Megaphone",
    severity: "low",
    title: { en: "Awareness Rally", bn: "সচেতনতা র‍্যালি" },
    fields: [
      { key: "date", label: { en: "Date", bn: "তারিখ" }, type: "date", required: true },
      { key: "start_point", label: { en: "Start Point", bn: "শুরুর স্থান" }, type: "text" },
      { key: "theme", label: { en: "Theme", bn: "থিম" }, type: "text" },
    ],
    defaults: {
      title: { en: "Awareness Rally", bn: "সচেতনতা র‍্যালি" },
      body: { en: "Rally with banners & placards. Dress code: unit T-shirt.", bn: "ব্যানার ও প্ল্যাকার্ড নিয়ে র‍্যালি। ড্রেস কোড: ইউনিট টি-শার্ট।" },
    },
  },
  {
    id: "ev-cultural",
    group: "event",
    icon: "Music",
    severity: "low",
    title: { en: "Cultural Event", bn: "সাংস্কৃতিক অনুষ্ঠান" },
    fields: [
      { key: "date", label: { en: "Date", bn: "তারিখ" }, type: "date", required: true },
      { key: "venue", label: { en: "Venue", bn: "স্থান" }, type: "text" },
      { key: "entry_fee", label: { en: "Entry Fee (BDT)", bn: "এন্ট্রি ফি (টাকা)" }, type: "number" },
    ],
    defaults: {
      title: { en: "Cultural Evening", bn: "সাংস্কৃতিক সন্ধ্যা" },
      body: { en: "Music, drama & prize-giving — the whole campus is invited!", bn: "সংগীত, নাটক ও পুরস্কার বিতরণ — পুরো ক্যাম্পাস আমন্ত্রিত!" },
    },
  },

  // ---------- DONATION (5) ----------
  {
    id: "don-general",
    group: "donation",
    icon: "HandHeart",
    severity: "low",
    title: { en: "General Donation", bn: "সাধারণ ডোনেশন" },
    fields: [
      { key: "target", label: { en: "Target (BDT)", bn: "টার্গেট (টাকা)" }, type: "number" },
      { key: "deadline", label: { en: "Deadline", bn: "শেষ তারিখ" }, type: "date" },
      { key: "account", label: { en: "Collection Account", bn: "সংগ্রহ একাউন্ট" }, type: "text" },
    ],
    defaults: {
      title: { en: "Support our mission", bn: "আমাদের মিশনে পাশে থাকুন" },
      body: { en: "Every taka goes to humanitarian service. Transparent accounts.", bn: "প্রতিটি টাকা যায় মানবিক সেবায়। হিসাব সম্পূর্ণ স্বচ্ছ।" },
    },
  },
  {
    id: "don-flood",
    group: "donation",
    icon: "LifeBuoy",
    severity: "high",
    title: { en: "Flood Relief Fund", bn: "বন্যা ত্রাণ ফান্ড" },
    fields: [
      { key: "area", label: { en: "Relief Area", bn: "ত্রাণ এলাকা" }, type: "text" },
      { key: "target", label: { en: "Target (BDT)", bn: "টার্গেট (টাকা)" }, type: "number" },
      { key: "deadline", label: { en: "Deadline", bn: "শেষ তারিখ" }, type: "date" },
      { key: "items", label: { en: "Needed Items", bn: "প্রয়োজনীয় জিনিস" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "Flood relief fund", bn: "বন্যার্তদের ত্রাণ ফান্ড" },
      body: { en: "Dry food, water purifier tablets & medicines needed. Cash accepted.", bn: "ড্রাই ফুড, ফিল্টার ট্যাবলেট ও ওষুধ প্রয়োজন। ক্যাশও গ্রহণযোগ্য।" },
    },
  },
  {
    id: "don-winter",
    group: "donation",
    icon: "Shirt",
    severity: "medium",
    title: { en: "Winter Clothing Drive", bn: "শীতবস্ত্র সংগ্রহ" },
    fields: [
      { key: "area", label: { en: "Distribution Area", bn: "বিতরণ এলাকা" }, type: "text" },
      { key: "target", label: { en: "Blankets Target", bn: "কম্বল টার্গেট" }, type: "number" },
      { key: "deadline", label: { en: "Deadline", bn: "শেষ তারিখ" }, type: "date" },
    ],
    defaults: {
      title: { en: "Share warmth this winter", bn: "এই শীতে উষ্ণতা ভাগ করুন" },
      body: { en: "One blanket = one warm night for a family. Donate new or used.", bn: "একটি কম্বল = একটি পরিবারের উষ্ণ রাত। নতুন বা পুরাতন — দিন।" },
    },
  },
  {
    id: "don-zakat",
    group: "donation",
    icon: "Moon",
    severity: "low",
    title: { en: "Zakat / Sadaqah Fund", bn: "যাকাত / সদকা ফান্ড" },
    fields: [
      { key: "use", label: { en: "Usage", bn: "ব্যবহার" }, type: "text" },
      { key: "deadline", label: { en: "Deadline", bn: "শেষ তারিখ" }, type: "date" },
    ],
    defaults: {
      title: { en: "Zakat for the needy", bn: "অসহায়ের জন্য যাকাত" },
      body: { en: "Your zakat reaches verified poor families through the unit.", bn: "আপনার যাকাত ইউনিটের মাধ্যমে যাচাইকৃত দরিদ্র পরিবারে পৌঁছায়।" },
    },
  },
  {
    id: "don-medical",
    group: "donation",
    icon: "Pill",
    severity: "high",
    title: { en: "Medical Support Fund", bn: "মেডিকেল সাপোর্ট ফান্ড" },
    fields: [
      { key: "patient", label: { en: "Patient Case", bn: "রোগীর কেস" }, type: "text", required: true },
      { key: "target", label: { en: "Target (BDT)", bn: "টার্গেট (টাকা)" }, type: "number" },
      { key: "docs", label: { en: "Documents / Proof", bn: "ডকুমেন্ট / প্রমাণ" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "Medical support needed", bn: "চিকিৎসা সহায়তা প্রয়োজন" },
      body: { en: "Verified medical case — your small help is someone's whole life.", bn: "যাচাইকৃত মেডিকেল কেস — আপনার ছোট সাহায্যই কারো পুরো জীবন।" },
    },
  },

  // ---------- GIFT (3) ----------
  {
    id: "gift-children",
    group: "gift",
    icon: "Gift",
    severity: "low",
    title: { en: "Gifts for Children's Hospital", bn: "শিশু হাসপাতালে গিফট" },
    fields: [
      { key: "date", label: { en: "Delivery Date", bn: "ডেলিভারির তারিখ" }, type: "date" },
      { key: "budget", label: { en: "Per Gift Budget (BDT)", bn: "প্রতি গিফট বাজেট (টাকা)" }, type: "number" },
      { key: "count", label: { en: "Number of Gifts", bn: "গিফট সংখ্যা" }, type: "number" },
    ],
    defaults: {
      title: { en: "Smiles for little fighters", bn: "ছোট্ট যোদ্ধাদের জন্য হাসি" },
      body: { en: "Toys & story books for hospitalized children — bring a smile.", bn: "হাসপাতালে ভর্তি শিশুদের জন্য খেলনা ও গল্পের বই — হাসি ফিরিয়ে আনুন।" },
    },
  },
  {
    id: "gift-elderly",
    group: "gift",
    icon: "HeartHandshake",
    severity: "low",
    title: { en: "Gifts for Elderly Home", bn: "বয়স্ক আশ্রয়ণে গিফট" },
    fields: [
      { key: "date", label: { en: "Visit Date", bn: "ভিজিটের তারিখ" }, type: "date" },
      { key: "items", label: { en: "Items", bn: "জিনিসপত্র" }, type: "textarea" },
    ],
    defaults: {
      title: { en: "Warmth for the abandoned", bn: "অবহেলিতদের জন্য ভালোবাসা" },
      body: { en: "Fruits, blankets & companionship for the elderly home residents.", bn: "বয়স্ক আশ্রয়ণের বাসিন্দাদের জন্য ফল, কম্বল ও সঙ্গ-সাথ।" },
    },
  },
  {
    id: "gift-prize",
    group: "gift",
    icon: "Trophy",
    severity: "low",
    title: { en: "Award / Prize Distribution", bn: "পুরস্কার বিতরণ" },
    fields: [
      { key: "event", label: { en: "For Event", bn: "কোন ইভেন্ট" }, type: "text" },
      { key: "budget", label: { en: "Total Budget (BDT)", bn: "মোট বাজেট (টাকা)" }, type: "number" },
    ],
    defaults: {
      title: { en: "Prize distribution ceremony", bn: "পুরস্কার বিতরণ অনুষ্ঠান" },
      body: { en: "Honoring our best volunteers & competition winners.", bn: "আমাদের সেরা স্বেচ্ছাসেবী ও প্রতিযোগিতার বিজয়ীদের সম্মাননা।" },
    },
  },

  // ---------- NOTICE (2) ----------
  {
    id: "nt-general",
    group: "notice",
    icon: "Bell",
    severity: "low",
    title: { en: "General Notice", bn: "সাধারণ নোটিশ" },
    fields: [
      { key: "subject", label: { en: "Subject", bn: "বিষয়" }, type: "text", required: true },
      { key: "details", label: { en: "Details", bn: "বিস্তারিত" }, type: "textarea", required: true },
    ],
    defaults: {
      title: { en: "Official notice", bn: "অফিসিয়াল নোটিশ" },
      body: { en: "This is an official notice from the unit board.", bn: "এটি ইউনিট বোর্ডের অফিসিয়াল নোটিশ।" },
    },
  },
  {
    id: "nt-holiday",
    group: "notice",
    icon: "CalendarOff",
    severity: "low",
    title: { en: "Holiday Notice", bn: "ছুটির নোটিশ" },
    fields: [
      { key: "date", label: { en: "Holiday Date", bn: "ছুটির তারিখ" }, type: "date" },
      { key: "reason", label: { en: "Reason", bn: "কারণ" }, type: "text" },
    ],
    defaults: {
      title: { en: "Unit holiday notice", bn: "ইউনিট ছুটির নোটিশ" },
      body: { en: "Regular activities resume from next working day.", bn: "পরবর্তী কর্মদিবস থেকে নিয়মিত কার্যক্রম চলবে।" },
    },
  },
];

export const TEMPLATES_BY_GROUP = {
  blood: TEMPLATES.filter((t) => t.group === "blood"),
  emergency: TEMPLATES.filter((t) => t.group === "emergency"),
  event: TEMPLATES.filter((t) => t.group === "event"),
  donation: TEMPLATES.filter((t) => t.group === "donation"),
  gift: TEMPLATES.filter((t) => t.group === "gift"),
  notice: TEMPLATES.filter((t) => t.group === "notice"),
};
