import mongoose, { Document, Schema } from 'mongoose';

export interface IIdea extends Document {
  fullName?: string;
  department: string;
  phone: string;
  idea: string;
  solution: string;
  ideaCode: string;
  submissionDate: Date;
  isPaid: boolean;
}

const IdeaSchema: Schema = new Schema({
  fullName: { type: String, required: false },
  department: { type: String, required: true },
  phone: { type: String, required: true },
  idea: { type: String, required: true },
  solution: { type: String, required: true },
  ideaCode: { type: String, required: true, unique: true },
  submissionDate: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false }
});

export default mongoose.model<IIdea>('Idea', IdeaSchema); 