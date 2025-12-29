import { CategoryModel } from '../db/categoryModel';

const defaultCategories = [
  { name: 'Investment', emoji: '📈' },
  { name: 'Income', emoji: '💰' },
  { name: 'Personal', emoji: '👤' },
  { name: 'Work', emoji: '💼' },
  { name: 'Business', emoji: '🏢' },
  { name: 'Restaurants', emoji: '🍴' },
  { name: 'Housing', emoji: '🏠' },
  { name: 'Electricity', emoji: '⚡' },
  { name: 'Transport & Fuel', emoji: '⛽' },
  { name: 'Food & Grocery', emoji: '🛒' },
  { name: 'Medical', emoji: '🏥' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Fitness', emoji: '🏋️' },
  { name: 'Insurance', emoji: '🛡️' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Internet & Telecom', emoji: '🌐' },
  { name: 'Gifts', emoji: '🎁' },
  { name: 'Taxes', emoji: '📝' },
  { name: 'Utility', emoji: '🛠️' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Card Repayment', emoji: '💳' },
  { name: 'ATM', emoji: '🏧' },
  { name: 'Bank Charges', emoji: '🏦' },
  { name: 'Self Transfer', emoji: '🔄' },
  { name: 'Loan', emoji: '💸' },
  { name: 'Education', emoji: '🎓' }
];

export const seedCategories = async () => {
  try {
    const count = await CategoryModel.countDocuments();
    if (count === 0) {
      await CategoryModel.insertMany(defaultCategories);
      console.log('Default categories seeded successfully with emojis');
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};
