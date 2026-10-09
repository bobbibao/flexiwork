import { VI_ANALYSIS } from './vi-analysis';

/** Open shifts searchable by workers (only POSTED / MATCHED are kept). */
export const SN_SHIFTS_INDEX = {
  alias: 'shifts',
  version: 1,
  body: {
    settings: { number_of_shards: 1, ...VI_ANALYSIS },
    mappings: {
      properties: {
        shift_id: { type: 'keyword' },
        job_ref: { type: 'keyword' },
        company_id: { type: 'long' },
        company_name: { type: 'text', analyzer: 'vi_folded' },
        title: { type: 'text', analyzer: 'vi_folded', fields: { raw: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'vi_folded' },
        skill_code: { type: 'keyword' },
        location: { type: 'geo_point' },
        location_name: { type: 'text', analyzer: 'vi_folded' },
        address: { type: 'text', analyzer: 'vi_folded' },
        province: { type: 'keyword' },
        ward: { type: 'keyword' },
        start_at: { type: 'date' },
        end_at: { type: 'date' },
        hourly_vnd: { type: 'long' },
        estimated_gross_vnd: { type: 'long' },
        status: { type: 'keyword' },
        employer_rating: { type: 'float' },
      },
    },
  },
};
