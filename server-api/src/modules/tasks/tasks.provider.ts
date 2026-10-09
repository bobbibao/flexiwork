import { Provider } from '@nestjs/common';
import Attachment from 'src/database/models/attachment.model';
import Comment from 'src/database/models/comment.model';
import Project from 'src/database/models/projects.model';
import TaskAssignee from 'src/database/models/task-assignee.model';
import Task from 'src/database/models/task.model';

export const tasksProvider: Provider[] = [
  {
    provide: 'TASK_REPOSITORY',
    useValue: Task,
  },

  {
    provide: 'TASK_ASSIGNEE_REPOSITORY',
    useValue: TaskAssignee,
  },
  {
    provide: 'COMMENT_REPOSITORY',
    useValue: Comment,
  },
  {
    provide: 'ATTACHMENT_REPOSITORY',
    useValue: Attachment,
  },
  {
    provide: 'PROJECT_REPOSITORY',
    useValue: Project,
  },
];
