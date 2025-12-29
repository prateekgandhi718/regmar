import { CategoryModel } from '../db/categoryModel';

const defaultCategories = [
  { name: 'Investment', emoji: '⚡', color: '#06b6d4' },
  { name: 'Income', emoji: '💵', color: '#10b981' },
  { name: 'Personal', emoji: '👤', color: '#3b82f6' },
  { name: 'Work', emoji: '💼', color: '#18181b' },
  { name: 'Business', emoji: '🏢', color: '#a855f7' },
  { name: 'Restaurants', emoji: '🍔', color: '#ef4444' },
  { name: 'Housing', emoji: '🏠', color: '#eab308' },
  { name: 'Electricity', emoji: '💡', color: '#6366f1' },
  { name: 'Transport & Fuel', emoji: '🚗', color: '#22c55e' },
  { name: 'Food & Grocery', emoji: '🥕', color: '#f97316' },
  { name: 'Medical', emoji: '➕', color: '#ec4899' },
  { name: 'Travel', emoji: '✈️', color: '#8b5cf6' },
  { name: 'Fitness', emoji: '🏋️', color: '#2563eb' },
  { name: 'Insurance', emoji: '🛡️', color: '#3b82f6' },
  { name: 'Entertainment', emoji: '🍿', color: '#ef4444' },
  { name: 'Internet & Telecom', emoji: '🌐', color: '#d6d3d1' },
  { name: 'Gift', emoji: '🎁', color: '#ef4444' },
  { name: 'Taxes', emoji: '🏦', color: '#2563eb' },
  { name: 'Utility', emoji: '💧', color: '#0ea5e9' },
  { name: 'Shopping', emoji: '🛒', color: '#84cc16' },
  { name: 'Card Repayment', emoji: '💳', color: '#18181b' },
  { name: 'ATM', emoji: '🏪', color: '#0d9488' },
  { name: 'Bank Charges', emoji: '🏛️', color: '#a16207' },
  { name: 'Reimbursement', emoji: '🚢', color: '#0284c7' },
  { name: 'Self Transfer', emoji: '🔄', color: '#f472b6' },
  { name: 'Loan', emoji: '💰', color: '#dc2626' },
  { name: 'Education', emoji: '🎓', color: '#18181b' }
];

export const seedCategories = async () => {
  try {
    for (const cat of defaultCategories) {
      await CategoryModel.findOneAndUpdate(
        { name: cat.name },
        { emoji: cat.emoji, color: cat.color },
        { upsert: true, new: true }
      );
    }
    console.log('Default categories synced successfully with emojis and colors');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};
