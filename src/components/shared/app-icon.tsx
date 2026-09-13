"use client";

// ============================================================
// AppIcon — central lucide icon registry (NO emoji anywhere)
// Usage: <AppIcon name="Droplets" className="h-5 w-5" />
// Add new icons to BOTH maps below.
// ============================================================

import {
  Activity, AlertCircle, AlertTriangle, Ambulance, ArrowLeft, ArrowRight,
  BadgeCheck, Bell, Bike, BookOpen, BriefcaseMedical, Building2, Calendar,
  CalendarDays, CalendarOff, Car, Check, CheckCircle2, ChevronDown,
  ChevronUp, ClipboardList, Clock, CloudSnow, CreditCard, Droplet, Droplets,
  Eye, EyeOff, Flame, Gift, Globe2, GripVertical, HandHeart, Handshake,
  Heart, HeartHandshake, HeartPulse, Info, Landmark, LayoutDashboard,
  LifeBuoy, Link2, LogIn, LogOut, Mail, MapPin, Megaphone, Menu, MessageCircle, Mic,
  Moon, Music, Pencil, Phone, Pill, Plus, Radio, Scale, Search, Shield,
  ShieldCheck, Shirt, Siren, Sparkles, Stethoscope, Sunrise, Target,
  Trash2, TreePine, Trophy, User, UserRound, Users, Wallet, Waves, Wind, X, XCircle,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Activity, AlertCircle, AlertTriangle, Ambulance, ArrowLeft, ArrowRight,
  BadgeCheck, Bell, Bike, BookOpen, BriefcaseMedical, Building2, Calendar,
  CalendarDays, CalendarOff, Car, Check, CheckCircle2, ChevronDown,
  ChevronUp, ClipboardList, Clock, CloudSnow, CreditCard, Droplet, Droplets,
  Eye, EyeOff, Flame, Gift, Globe2, GripVertical, HandHeart, Handshake,
  Heart, HeartHandshake, HeartPulse, Info, Landmark, LayoutDashboard,
  LifeBuoy, Link2, LogIn, LogOut, Mail, MapPin, Megaphone, Menu, MessageCircle, Mic,
  Moon, Music, Pencil, Phone, Pill, Plus, Radio, Scale, Search, Shield,
  ShieldCheck, Shirt, Siren, Sparkles, Stethoscope, Sunrise, Target,
  Trash2, TreePine, Trophy, User, UserRound, Users, Wallet, Waves, Wind, X, XCircle,
};

/** curated choices for the admin icon picker */
export const ICON_CHOICES = [
  "Droplets", "Droplet", "HeartPulse", "BriefcaseMedical", "Stethoscope",
  "Ambulance", "Siren", "AlertTriangle", "Activity", "Waves", "Flame",
  "Wind", "CloudSnow", "Car", "Building2", "LifeBuoy", "Gift", "HandHeart",
  "HeartHandshake", "Users", "UserRound", "MessageCircle", "Music", "Megaphone", "CalendarDays",
  "CalendarOff", "ClipboardList", "Shirt", "Moon", "Pill", "Trophy",
  "BookOpen", "Bike", "TreePine", "Sparkles", "Bell", "Target", "Shield",
];

export function AppIcon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICON_MAP[name] ?? Heart;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
