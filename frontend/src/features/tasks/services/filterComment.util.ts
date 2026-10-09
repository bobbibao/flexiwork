import { Comment } from "@/common/models";

export async function loadCommentsAndReplies(comments: Comment[]): Promise<Comment[]> {
  const commentMap = new Map<number, Comment>();

  // Initialize each comment and populate the map
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // Group comments into root comments and organize replies
  const rootComments: Comment[] = [];

  comments.forEach(comment => {
    if (comment.reply_to) {
      // Add to parent's replies if it's a reply
      const parentComment = commentMap.get(comment.reply_to);
      if (parentComment) {
        parentComment.replies!.push(comment);
      }
    } else {
      // Add to root comments if it's a top-level comment
      rootComments.push(comment);
    }
  });

  // Sort the parent comments and their replies
  sortCommentsByDate(rootComments);

  return rootComments;
}

// Recursive function to sort comments by create_date
function sortCommentsByDate(comments: Comment[], sortDirection: "asc" | "desc" = "desc") {
  const sortOrder = sortDirection === "asc" ? 1 : -1;

  comments.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    return sortOrder * (dateA - dateB);
  });
  
  // Sort replies
  comments.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      sortCommentsByDate(comment.replies, "asc");
    }
  });
}
