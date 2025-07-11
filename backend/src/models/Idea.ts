import mongoose, { Document, Schema } from 'mongoose';

export interface IIdea extends Document {
  fullName?: string;
  department: string;
  idea: string;
  // solution: string;
  ideaCode: string;
  submissionDate: Date;
  isPaid: boolean;
}

const IdeaSchema: Schema = new Schema({
  fullName: { type: String, required: false },
  department: { type: String, required: true },
  idea: { type: String, required: false },
  // solution: { type: String, required: false },
  ideaCode: { type: String, required: true, unique: true },
  submissionDate: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false }
});

export default mongoose.model<IIdea>('Idea', IdeaSchema); 