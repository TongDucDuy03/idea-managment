export interface Idea {
  _id: string;
  fullName: string;
  department: string;
  idea: string;
  solution: string;
  ideaCode: string;
  submissionDate: Date;
  status: 'pending' | 'rejected' | 'rewarded';
}

export interface IdeaFormData {
  fullName: string;
  department: string;
  idea: string;
  solution: string;
} 