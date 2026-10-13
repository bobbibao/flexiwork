/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';

@Injectable()
export class RatingQueryService {
  constructor(private readonly uow: UnitOfWork) {}

  async received(rateeRole: 'worker' | 'employer', rateeId: number, limit = 50) {
    const items = await this.uow.select<any>(
      `SELECT r.shift_id, r.stars, r.tags, r.comment, r.created_at, s.title, s.start_at
       FROM ratings r LEFT JOIN shift_views s ON s.id = r.shift_id
       WHERE r.ratee_role = :rateeRole AND r.ratee_id = :rateeId ORDER BY r.created_at DESC LIMIT :limit`,
      { rateeRole, rateeId, limit },
    );
    const [summary] = await this.uow.select<any>(
      `SELECT ROUND(AVG(stars)::numeric, 2) AS avg, COUNT(*) AS count FROM ratings WHERE ratee_role = :rateeRole AND ratee_id = :rateeId`,
      { rateeRole, rateeId },
    );
    return { rating_avg: summary.avg === null ? null : Number(summary.avg), rating_count: Number(summary.count), items };
  }
}
