export interface Idea {
  _id: string;
  fullName: string;
  department: string;
  phone: string;
  solution: string;
  ideaCode: string;
  submissionDate: Date;
  isPaid: boolean;
}

export interface IdeaFormData {
  fullName: string;
  department: string;
  phone: string;
  solution: string;
} 