'use client'

import {
  Banknote,
  Briefcase,
  Building2,
  Car,
  CircleDollarSign,
  CreditCard,
  Droplet,
  Dumbbell,
  Gift,
  GraduationCap,
  HandCoins,
  Hospital,
  Home,
  Landmark,
  Plane,
  Popcorn,
  Receipt,
  ReceiptIndianRupee,
  Repeat,
  ShoppingBasket,
  ShoppingCart,
  Shield,
  Stethoscope,
  TrendingUp,
  Tag,
  User,
  Utensils,
  Wifi,
  Lightbulb,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const pickIcon = (name?: string) => {
  const normalized = (name || '').toLowerCase()

  // Exact mapping for the category names you have in DB
  const exactMap: Record<string, any> = {
    income: CircleDollarSign,
    restaurants: Utensils,
    business: Building2,
    'card repayment': CreditCard,
    electricity: Lightbulb,
    gifts: Gift,
    gift: Gift,
    atm: Banknote,
    'transport & fuel': Car,
    taxes: ReceiptIndianRupee,
    'food & grocery': ShoppingBasket,
    fitness: Dumbbell,
    insurance: Shield,
    utility: Droplet,
    'self transfer': Repeat,
    work: Briefcase,
    loan: HandCoins,
    housing: Home,
    personal: User,
    investment: TrendingUp,
    travel: Plane,
    'bank charges': Receipt,
    'internet & telecom': Wifi,
    education: GraduationCap,
    medical: Stethoscope,
    entertainment: Popcorn,
    shopping: ShoppingCart,
    reimbursement: HandCoins,
  }

  if (exactMap[normalized]) return exactMap[normalized]

  // Small safety net for unexpected/renamed categories
  if (normalized.includes('restaurant')) return Utensils
  if (normalized.includes('food') || normalized.includes('grocery')) return ShoppingBasket
  if (normalized.includes('shop')) return ShoppingCart
  if (normalized.includes('travel') || normalized.includes('flight')) return Plane
  if (normalized.includes('fuel') || normalized.includes('transport')) return Car
  if (normalized.includes('tax')) return ReceiptIndianRupee
  if (normalized.includes('bank')) return Landmark
  if (normalized.includes('medical') || normalized.includes('health')) return Hospital
  if (normalized.includes('gift')) return Gift

  return Tag
}

export function CategoryIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  const Icon = pickIcon(name)
  return <Icon className={cn('h-4 w-4 text-primary', className)} strokeWidth={2.5} />
}
