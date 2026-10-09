import { Comment, Task, TaskAssignee } from ".";
import { TimeSheetPeriods } from "./timesheetPeriods.model";

export class User {
  id: number;
  company_id: number | null;
  // company: Company;
  email: string | null;
  password: string | null;
  role: string | null;
  is_active: boolean | null;
  avatar_url: string | null;
  metadata: Object | null;
  max_work_hours_per_week: number | null;
  max_work_hours_per_day: number | null;
  missing_timesheet_days: boolean | null;
  address: string | null;
  dob: string | null;
  end_work_date: string | null;
  job: string | null;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  place: string | null;
  postcode: string | null;
  start_work_date: string | null;
  holidays: number | null;
  first_name: string | null;
  work_percent_per_week: string | number | null;
  last_name: string | null;
  timesheet_periods: TimeSheetPeriods[];
  holiday_periods: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
  comments: Comment[];
  taskAssignees: TaskAssignee[];
  tasks: Task[];
}
