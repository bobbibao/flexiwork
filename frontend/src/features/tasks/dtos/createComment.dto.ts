export type CreateAttachment = {
  filename: string;
  link: string;
  comment_id: number;
};

export type CreateCommentDto = {
  reply_to: number | null;
  content: string;
  attachments: CreateAttachment[];
};
