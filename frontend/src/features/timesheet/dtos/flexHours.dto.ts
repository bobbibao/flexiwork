export interface IQueryFlexHours {
  user_id?: number | string;
  start_date?: string;
  end_date?: string;
}
export interface FlexHours {
  date: Date;
  actual_hours: number;
  flex_hours: number;
}
export interface Holidays {
  date: Date;
  label: string;
}
export interface FlexHoursDto {
  count: number;
  error: boolean;
  holidays: Holidays[];
  payload: FlexHours[];
}
