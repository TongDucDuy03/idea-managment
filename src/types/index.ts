export interface Idea {
  _id: string;
  fullName: string;
  department: string;
  idea: string;
  solution: string;
  benefit?: string;
  ideaCode: string;
  submissionDate: Date;
  status: 'pending' | 'rejected' | 'noted' | 'approved'; // Quyết định phê duyệt (cũ)
  implementationStatus: 'Đề xuất mới' | 'Xem xét' | 'Phê duyệt' | 'Phản hồi phê duyệt' | 'Đang triển khai' | 'Lập báo cáo A3' | 'Phê duyệt khen thưởng' | 'Đã khen thưởng' | 'Không đạt'; // Trạng thái triển khai (mới)
  implementationDepartment?: string;
  note?: string;
  benefitValue?: number; // Giá trị làm lợi (VND)
  rewardAmount?: number; // Tiền thưởng (VND)
}

export interface IdeaFormData {
  fullName: string;
  department: string;
  idea: string;
  solution: string;
  benefit?: string;
} 