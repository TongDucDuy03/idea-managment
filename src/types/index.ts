export interface Idea {
  _id: string;
  fullName: string;
  department: string;
  idea: string;
  solution: string;
  benefit?: string;
  ideaCode: string;
  submissionDate: Date;
  status: 'pending' | 'rejected' | 'rewarded';
  implementationDirection?: 'Lưu ý tưởng' | 'Triển khai' | 'Làm báo cáo A3' | 'Xem xét' | '';
  implementationDepartment?: string;
  note?: string;
}

export interface IdeaFormData {
  fullName: string;
  department: string;
  idea: string;
  solution: string;
  benefit?: string;
} 