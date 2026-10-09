import { Comment } from '.';

export class Attachment {
  id: number;
  comment_id: number;
  filename: string;
  link: string;
  created_at: Date;
  comment: Comment;
}

