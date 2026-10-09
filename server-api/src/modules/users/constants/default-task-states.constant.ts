import { TaskSetting } from 'src/database/models';

export const defaultTaskStates: TaskSetting = {
  statuses: [
    {
      id: 1,
      label: 'Not Started',
      color: '#667085',
    },
    {
      id: 2,
      label: 'In Progress',
      color: '#7A5AF8',
    },
    {
      id: 3,
      label: 'Done',
      color: '#12B76A',
    },
  ],
  priorities: [
    {
      id: 1,
      label: 'High',
      color: '#F04438',
    },
    {
      id: 2,
      label: 'Normal',
      color: '#F79009',
    },
    {
      id: 3,
      label: 'Low',
      color: '#2E90FA',
    },
  ],
};
