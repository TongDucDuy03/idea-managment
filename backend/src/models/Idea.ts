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
  status: 'pending' | 'rejected' | 'noted' | 'approved'; // Quyết định phê duyệt (cũ)
  implementationStatus: 'Đề xuất mới' | 'Xem xét' | 'Phê duyệt' | 'Phản hồi phê duyệt' | 'Đang triển khai' | 'Lập báo cáo A3' | 'Phê duyệt khen thưởng' | 'Đã khen thưởng' | 'Không đạt'; // Trạng thái triển khai (mới)
  implementationDepartment?: string;
  note?: string;
  benefitValue?: number; // Giá trị làm lợi (VND)
  rewardAmount?: number; // Tiền thưởng (VND)
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
    enum: ['pending', 'rejected', 'noted', 'approved'], 
    default: 'pending' 
  },
  implementationStatus: { 
    type: String, 
    enum: ['Đề xuất mới', 'Xem xét', 'Phê duyệt', 'Phản hồi phê duyệt', 'Đang triển khai', 'Lập báo cáo A3', 'Phê duyệt khen thưởng', 'Đã khen thưởng', 'Không đạt'], 
    default: 'Đề xuất mới' 
  },
  implementationDepartment: { type: String, required: false },
  note: { type: String, required: false },
  benefitValue: { type: Number, required: false, default: 0 },
  rewardAmount: { type: Number, required: false, default: 0 }
});

export default mongoose.model<IIdea>('Idea', IdeaSchema); 