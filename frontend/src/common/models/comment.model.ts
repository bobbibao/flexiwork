import { Attachment, User } from '.';

export class Comment {
  id: number;
  reply_to: number | null;
  task_id: number;
  owner_id: number;
  content: string;
  created_at: Date;
  updated_at: Date | null;
  attachments: Attachment[];
  user: User;
  replies?: Comment[];
}
