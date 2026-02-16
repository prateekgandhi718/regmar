import mongoose from 'mongoose';

const NerEntitySchema = new mongoose.Schema({
  label: { type: String, required: true },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  text: { type: String, required: true },
});

const NerTrainingSchema = new mongoose.Schema({
  emailText: { type: String, required: true },
  entities: [NerEntitySchema],
}, { timestamps: true });

export const NerTrainingModel = mongoose.model('NerTraining', NerTrainingSchema);

export const createNerTraining = (values: Record<string, any>) => new NerTrainingModel(values).save();
export const appendNerTraining = (values: Record<string, any>) => new NerTrainingModel(values).save();
