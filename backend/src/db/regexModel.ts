import mongoose from 'mongoose';

const RegexSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  amountRegex: { type: String, required: true },
  descriptionRegex: { type: String, required: true },
  accountNumberRegex: { type: String },
  creditRegex: { type: String },
}, { timestamps: true });

export const RegexModel = mongoose.model('Regex', RegexSchema);

export const getRegexesByDomain = (userId: string, domain: string) => RegexModel.find({ userId, domain });
export const getRegexById = (id: string) => RegexModel.findById(id);
export const createRegex = (values: Record<string, any>) => new RegexModel(values).save();
export const updateRegexById = (id: string, values: Record<string, any>) => RegexModel.findByIdAndUpdate(id, values, { new: true });
export const updateRegexByDomain = (userId: string, domain: string, values: Record<string, any>) => RegexModel.findOneAndUpdate({ userId, domain }, values, { new: true, upsert: true });
export const deleteRegexById = (id: string) => RegexModel.findByIdAndDelete(id);
export const deleteRegexesByUserId = (userId: string) => RegexModel.deleteMany({ userId });
