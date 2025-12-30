import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalDate: { type: Date, required: true },
  newDate: { type: Date },
  originalDescription: { type: String, required: true },
  newDescription: { type: String },
  originalAmount: { type: Number, required: true },
  newAmount: { type: Number },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  refunded: { type: Boolean, default: false },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);

export const getTransactionsByAccountId = (accountId: string) => TransactionModel.find({ accountId }).populate('categoryId');
export const getTransactionsByUserId = (userId: string) => TransactionModel.find({ userId })
  .populate('categoryId')
  .populate({
    path: 'accountId',
    populate: { path: 'domainIds' }
  })
  .populate('domainId');
export const createTransaction = (values: Record<string, any>) => new TransactionModel(values).save();
export const updateTransactionById = (id: string, values: Record<string, any>) => TransactionModel.findByIdAndUpdate(id, values, { new: true })
  .populate('categoryId')
  .populate({
    path: 'accountId',
    populate: { path: 'domainIds' }
  })
  .populate('domainId');
export const deleteTransactionById = (id: string) => TransactionModel.findByIdAndDelete(id);
export const deleteTransactionsByAccountId = (accountId: string) => TransactionModel.deleteMany({ accountId });
