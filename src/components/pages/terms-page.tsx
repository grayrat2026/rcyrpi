"use client";

// ============================================================
// Terms & Conditions — bilingual (BN/EN) beginner-friendly
// sections 1–8, card layout with red numbered badges
// ============================================================

import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { fadeUp, staggerParent } from "@/lib/motion";

interface Section {
  en: { title: string; body: string };
  bn: { title: string; body: string };
}

const SECTIONS: Section[] = [
  {
    en: {
      title: "Who we are",
      body: "We are the Youth Red Crescent Team (RCY) of Rangpur Govt. Polytechnic Institute — a youth unit of the Bangladesh Red Crescent Society (BDRCS). We are trained volunteers: we collect blood, respond to disasters and organize humanitarian events. By using this website you agree to the simple rules below.",
    },
    bn: {
      title: "আমরা কে?",
      body: "আমরা রংপুর সরকারি পলিটেকনিক ইনস্টিটিউটের যুব রেড ক্রিসেন্ট দল (সংক্ষেপে RCY) — বাংলাদেশ রেড ক্রিসেন্ট সোসাইটির (বিডিআরসিএস) একটি যুব ইউনিট। আমরা প্রশিক্ষিত স্বেচ্ছাসেবী: রক্ত সংগ্রহ করি, দুর্যোগে সাড়া দিই এবং মানবিক ইভেন্ট আয়োজন করি। এই ওয়েবসাইট ব্যবহার করলে আপনি নিচের সহজ নিয়মগুলো মানছেন।",
    },
  },
  {
    en: {
      title: "Membership rules",
      body: "Members must be respectful to everyone, keep their profile information true and up to date, and stay active in unit activities. Admins may suspend fraudulent or fake accounts. When an account is suspended, all of its posts (such as emergency requests) automatically disappear from the public website, and the account can no longer log in until it is reactivated.",
    },
    bn: {
      title: "সদস্যপদের নিয়ম",
      body: "সদস্যদের সবার প্রতি শ্রদ্ধাশীল থাকতে হবে, প্রোফাইলের তথ্য সঠিক ও হালনাগাদ রাখতে হবে এবং ইউনিটের কার্যক্রমে সক্রিয় থাকতে হবে। প্রতারণামূলক বা ভুয়া একাউন্ট অ্যাডমিন সাসপেন্ড করতে পারেন। কোনো একাউন্ট সাসপেন্ড হলে তার সব পোস্ট (যেমন ইমার্জেন্সি রিকোয়েস্ট) পাবলিক ওয়েবসাইট থেকে স্বয়ংক্রিয়ভাবে সরে যায়, এবং পুনরায় চালু না হওয়া পর্যন্ত সেই একাউন্টে লগইন করা যায় না।",
    },
  },
  {
    en: {
      title: "Emergency request usage",
      body: "The emergency request form is only for real, urgent needs — blood, accident, fire, flood, medical help or a missing person. Sending false or prank requests wastes volunteer time and can put lives in danger. False requests = account suspension. Please be honest; a real person is waiting for help.",
    },
    bn: {
      title: "ইমার্জেন্সি রিকোয়েস্ট ব্যবহার",
      body: "ইমার্জেন্সি রিকোয়েস্ট ফর্ম শুধু সত্যিকারের জরুরি প্রয়োজনে ব্যবহার করুন — রক্ত, দুর্ঘটনা, আগুন, বন্যা, চিকিৎসা সাহায্য বা নিখোঁজ ব্যক্তি। মিথ্যা বা মজা করে রিকোয়েস্ট পাঠালে স্বেচ্ছাসেবীদের সময় নষ্ট হয় এবং জীবন বিপদে পড়তে পারে। মিথ্যা রিকোয়েস্ট = একাউন্ট সাসপেনশন। সততার সাথে ব্যবহার করুন — কেউ একজন সত্যিই সাহায্যের অপেক্ষায় থাকে।",
    },
  },
  {
    en: {
      title: "Payments & refunds",
      body: "All payments are made online through our secure payment gateway. Every event or fund that has a fee gets a shareable Payment Link. After you pay, the record is verified automatically and appears in your payments list. Admins may also record offline payments, and each record shows which admin recorded it. Always keep your transaction ID as proof. Event fees are non-refundable unless the event is cancelled or postponed by the admin, and donations, once given, are non-refundable — they go straight to humanitarian activities.",
    },
    bn: {
      title: "পেমেন্ট ও রিফান্ড",
      body: "সব পেমেন্ট করা হয় আমাদের নিরাপদ পেমেন্ট গেটওয়ের মাধ্যমে, অনলাইনে। যে ইভেন্ট বা ফান্ডের ফি আছে, প্রতিটির জন্য একটি শেয়ারযোগ্য পেমেন্ট লিংক দেওয়া হয়। পেমেন্ট করার পর রেকর্ডটি স্বয়ংক্রিয়ভাবে যাচাই হয়ে আপনার পেমেন্ট লিস্টে দেখা যায়। অ্যাডমিন চাইলে অফলাইন পেমেন্টও রেকর্ড করতে পারেন, এবং রেকর্ডে দেখা যায় কোন অ্যাডমিন সেটি যোগ করেছেন। প্রমাণ হিসেবে সবসময় ট্রানজেকশন আইডি সংরক্ষণ করুন। অ্যাডমিন ইভেন্ট বাতিল বা স্থগিত না করলে ইভেন্ট ফি ফেরতযোগ্য নয়, আর ডোনেশন একবার দেওয়ার পর ফেরত দেওয়া হয় না — তা সরাসরি মানবিক কাজে ব্যয় হয়।",
    },
  },
  {
    en: {
      title: "Emergency popups",
      body: "When a critical emergency happens, the site shows an urgent popup alert on every visitor's screen. The cancel button stays locked for 3 seconds so alerts are not missed by accident. Please read the alert carefully — it may be a call for blood or rescue nearby.",
    },
    bn: {
      title: "ইমার্জেন্সি পপআপ",
      body: "গুরুতর ইমার্জেন্সি হলে সাইট প্রতিটি ভিজিটরের স্ক্রিনে জরুরি পপআপ সতর্কতা দেখায়। ভুলে মিস না হওয়ার জন্য ক্যান্সেল বাটন ৩ সেকেন্ড লক থাকে। সতর্কতাটি মনোযোগ দিয়ে পড়ুন — এটি আপনার কাছের কারো রক্ত বা উদ্ধারের ডাক হতে পারে।",
    },
  },
  {
    en: {
      title: "Data usage",
      body: "Your name, phone, blood group and address are used only for unit activities: emergency response, blood matching and event management. We never sell or share your personal data with any third party. For account security, use the “Forgot password” option on the login page to reset your password securely.",
    },
    bn: {
      title: "তথ্যের ব্যবহার",
      body: "আপনার নাম, ফোন, রক্তের গ্রুপ ও ঠিকানা শুধু ইউনিটের কাজে ব্যবহৃত হয়: ইমার্জেন্সি রেসপন্স, রক্ত ম্যাচিং ও ইভেন্ট ব্যবস্থাপনা। আমরা কখনো আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করি না। একাউন্টের নিরাপত্তার জন্য লগইন পেজের “ফরগট পাসওয়ার্ড” অপশন ব্যবহার করে নিরাপদে পাসওয়ার্ড রিসেট করুন।",
    },
  },
  {
    en: {
      title: "Content rights",
      body: "Notices, event details and materials on this site belong to the Youth Red Crescent Team (RCY) of Rangpur Govt. Polytechnic Institute. Please take permission before copying or reusing any content for other purposes.",
    },
    bn: {
      title: "কনটেন্টের অধিকার",
      body: "এই সাইটের নোটিশ, ইভেন্টের তথ্য ও ম্যাটেরিয়াল রংপুর সরকারি পলিটেকনিক ইনস্টিটিউটের যুব রেড ক্রিসেন্ট দলের (RCY) সম্পদ। অন্য কোনো কাজে কনটেন্ট কপি বা পুনঃব্যবহারের আগে অনুমতি নিন।",
    },
  },
  {
    en: {
      title: "Contact",
      body: "Questions about these terms? Visit our unit room at Rangpur Govt. Polytechnic Institute campus, Rangpur-5400, or email us at admin@example.org. We are always happy to explain anything.",
    },
    bn: {
      title: "যোগাযোগ",
      body: "এই শর্তাবলী নিয়ে প্রশ্ন আছে? আমাদের ইউনিট রুমে আসুন — রংপুর সরকারি পলিটেকনিক ইনস্টিটিউট, রংপুর-৫৪০০ — অথবা ইমেইল করুন admin@example.org ঠিকানায়। আমরা সবকিছু বুঝিয়ে বলতে সবসময় আনন্দিত।",
    },
  },
];

export function TermsPage() {
  const { t, lang } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red-soft ring-1 ring-black/5">
          <Scale className="h-6 w-6 text-brand-red" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-brand-red">{t("foot_terms")}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {lang === "bn"
            ? "সহজ ভাষায় আমাদের নিয়মকানুন — একবার পড়ে নিন"
            : "Our rules in simple language — please read once"}
        </p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full brand-gradient" />
      </motion.div>

      {/* sections */}
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="mt-8 grid gap-4"
      >
        {SECTIONS.map((s, i) => (
          <motion.section
            key={i}
            variants={fadeUp}
            aria-label={lang === "bn" ? s.bn.title : s.en.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span
                className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white shadow-sm"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold leading-snug sm:text-lg">
                  {lang === "bn" ? s.bn.title : s.en.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {lang === "bn" ? s.bn.body : s.en.body}
                </p>
              </div>
            </div>
          </motion.section>
        ))}
      </motion.div>

      {/* footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        {t("foot_tagline")}
      </motion.p>
    </div>
  );
}
