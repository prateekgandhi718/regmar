import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatAmount = (amount: number) => {
  if (amount >= 1000) {
    return (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1) + "K";
  }
  return amount.toLocaleString('en-IN');
};
