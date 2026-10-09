import { VI_ANALYSIS } from './vi-analysis';

/** Worker candidates for matching. */
export const SN_WORKERS_INDEX = {
  alias: 'workers',
  version: 1,
  body: {
    settings: { number_of_shards: 1, ...VI_ANALYSIS },
    mappings: {
      properties: {
        worker_id: { type: 'long' },
        full_name: { type: 'text', analyzer: 'vi_folded' },
        skills: { type: 'keyword' },
        home: { type: 'geo_point' },
        radius_km: { type: 'integer' },
        reliability_score: { type: 'integer' },
        rating_avg: { type: 'float' },
        verified: { type: 'boolean' },
        suspended: { type: 'boolean' },
        dob: { type: 'date' },
        last_active_at: { type: 'date' },
      },
    },
  },
};
