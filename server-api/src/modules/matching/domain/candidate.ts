/** A worker considered for a shift. Pure data (domain layer). */
export interface WorkerCandidate {
  workerId: number;
  skills: string[];
  verified: boolean;
  suspended: boolean;
  dob: string | null;
  radiusKm: number;
  distanceM: number;
  reliabilityScore: number;
  ratingAvg: number | null;
  workedWithEmployerBefore: boolean;
  hasOverlappingShift: boolean;
}

export interface ShiftForMatching {
  shiftId: string;
  companyId: number;
  skillCode: string;
  startAt: Date;
  endAt: Date;
  lat: number;
  lng: number;
  excludedWorkerIds: number[];
  dispatchMode: 'sequential' | 'broadcast';
}
