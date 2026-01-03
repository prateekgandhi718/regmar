import mongoose from 'mongoose';

const ParserConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  
  // Transaction detection (keywords)
  transactionIndicators: {
    creditKeywords: [{ type: String }],
    debitKeywords: [{ type: String }],
    currencyMarkers: [{ type: String }],
  },

  // Extraction patterns (independent, OR-based)
  extractionPatterns: {
    amountRegexes: [{ type: String }],
    merchantRegexes: [{ type: String }],
  },
}, { timestamps: true });

export const ParserConfigModel = mongoose.model('ParserConfig', ParserConfigSchema);

export const getParserConfigByDomain = (userId: string, domain: string) =>
  ParserConfigModel.findOne({ userId, domain });

export const createParserConfig = (values: Record<string, any>) =>
  new ParserConfigModel(values).save();

export const updateParserConfigByDomain = (userId: string, domain: string, values: Record<string, any>) =>
  ParserConfigModel.findOneAndUpdate({ userId, domain }, values, { new: true, upsert: true });

export const deleteParserConfigByDomain = (userId: string, domain: string) =>
  ParserConfigModel.findOneAndDelete({ userId, domain });

