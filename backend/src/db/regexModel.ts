import mongoose from 'mongoose';

const RegexSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  amountRegex: { type: String, required: true },
  descriptionRegex: { type: String, required: true },
  dateRegex: { type: String },
  accountNumberRegex: { type: String },
  creditRegex: { type: String },
  dateFormat: { type: String },
}, { timestamps: true });

export const RegexModel = mongoose.model('Regex', RegexSchema);

export const getRegexesByDomain = (domain: string) => RegexModel.find({ domain });
export const getRegexById = (id: string) => RegexModel.findById(id);
export const createRegex = (values: Record<string, any>) => new RegexModel(values).save();
export const updateRegexById = (id: string, values: Record<string, any>) => RegexModel.findByIdAndUpdate(id, values, { new: true });
export const updateRegexByDomain = (domain: string, values: Record<string, any>) => RegexModel.findOneAndUpdate({ domain }, values, { new: true, upsert: true });
