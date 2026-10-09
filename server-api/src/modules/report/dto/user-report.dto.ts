import User from 'src/database/models/users.model';

export class UserReportOverallDto {
  id: number;
  email: string;
  address: string;
  dob: string;
  name: string;
  nickname: string;
  phone: string;
  place: string;
  postcode: string;
  start_work_date: string;
  end_work_date: string;
  job: string;
  first_name: string;
  last_name: string;
  rate: number;
}

export class UserReportDetailsDto {
  user: Partial<User>;
  expected_hours: string;
  prev_hours: string;
  actual_hours: string;
  current_hours: string;
  holidays_credit: string;
  holidays_prev: string;
  holidays_used: string;
  holidays_available: string;
}
