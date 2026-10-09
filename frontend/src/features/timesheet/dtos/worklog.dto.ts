export interface WorkLogDto {
  date: string;
  spent: number;
  spent_in_hour: number;
  comment?: string;
  work_item_id?: number;
}
