import { snApi } from "@/api/sn-api";
import { SN_PROFILE } from "@/api/sn-endpoints";
import { SkillDto, WorkerProfileDto } from "../dtos";

let skillsCache: SkillDto[] | null = null;

export class WorkerProfileService {
  get() {
    return snApi.get<WorkerProfileDto>(SN_PROFILE.WORKER_ME);
  }
  update(data: Partial<WorkerProfileDto>) {
    return snApi.put<WorkerProfileDto>(SN_PROFILE.WORKER_ME, data);
  }
  async skills(): Promise<SkillDto[]> {
    if (!skillsCache) skillsCache = await snApi.get<SkillDto[]>(SN_PROFILE.SKILLS);
    return skillsCache;
  }
}

export const workerProfileService = new WorkerProfileService();

/** Skill code -> Vietnamese name, for any page that lists shifts. */
export async function skillNames(): Promise<Record<string, string>> {
  const list = await workerProfileService.skills();
  return Object.fromEntries(list.map(s => [s.code, s.name_vi]));
}
