import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  originalAmount: { type: Number, required: true },
  newAmount: { type: Number },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  refunded: { type: Boolean, default: false },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);

export const getTransactionsByAccountId = (accountId: string) => TransactionModel.find({ accountId }).populate('categoryId');
export const getTransactionsByUserId = (userId: string) => TransactionModel.find({ userId }).populate('categoryId').populate('accountId');
export const createTransaction = (values: Record<string, any>) => new TransactionModel(values).save();
export const updateTransactionById = (id: string, values: Record<string, any>) => TransactionModel.findByIdAndUpdate(id, values, { new: true });
export const deleteTransactionById = (id: string) => TransactionModel.findByIdAndDelete(id);
export const deleteTransactionsByAccountId = (accountId: string) => TransactionModel.deleteMany({ accountId });
