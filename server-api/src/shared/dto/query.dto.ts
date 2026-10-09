import { OmitType } from '@nestjs/swagger';

export class QueryDate {
  start: string;
  end: string;
}

export class QueryDateFilterUserId {
  start_date: string;
  end_date: string;
  user_id: number;
  filter: string;
  search: string;
}

export class QueryDateUserId extends OmitType(QueryDateFilterUserId, ['filter']) {}
