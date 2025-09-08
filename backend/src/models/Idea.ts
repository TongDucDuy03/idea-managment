import mongoose, { Document, Schema } from 'mongoose';

export interface IIdea extends Document {
  fullName?: string;
  department: string;
  idea: string;
  solution?: string;
  benefit?: string;
  ideaCode: string;
  submissionDate: Date;
  isPaid: boolean;
  status: 'pending' | 'rejected' | 'rewarded';
  implementationDirection?: 'Lưu ý tưởng' | 'Triển khai' | 'Làm báo cáo A3' | 'Xem xét' | '';
  implementationDepartment?: string;
  note?: string;
}

const IdeaSchema: Schema = new Schema({
  fullName: { type: String, required: false },
  department: { type: String, required: true },
  idea: { type: String, required: false },
  solution: { type: String, required: false },
  benefit: { type: String, required: false },
  ideaCode: { type: String, required: true, unique: true },
  submissionDate: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'rejected', 'rewarded'], 
    default: 'pending' 
  },
  implementationDirection: { 
    type: String, 
    enum: ['', 'Lưu ý tưởng', 'Triển khai', 'Làm báo cáo A3', 'Xem xét'],
    default: ''
  },
  implementationDepartment: { type: String, required: false },
  note: { type: String, required: false }
});

export default mongoose.model<IIdea>('Idea', IdeaSchema); 