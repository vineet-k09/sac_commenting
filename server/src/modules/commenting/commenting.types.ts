export type CommentType = 'text' | 'checklist' | 'multiple_choice' | 'poll';

export type Comment = {
  id: string;
  user: string;
  comment: string;
  filter: string;
  timestamp?: string;
  type?: CommentType;
  options?: string[]; // for interactive elements
};