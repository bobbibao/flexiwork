import { defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { shiftPostingService, Quote } from "../../services";
import { employerProfileService } from "@/features/employer-profile/services";
import { WorkLocationDto } from "@/features/employer-profile/dtos";
import { workerProfileService } from "@/features/worker-profile/services";
import { SkillDto } from "@/features/worker-profile/dtos";
import { newIdempotencyKey } from "@/api/sn-api";
import { errorText } from "@/features/sn-shell/i18n";
import { formatVnd, fromVnLocalInput, minutesToHoursLabel, toVnLocalInput } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

const roundUp30 = (d: Date) => new Date(Math.ceil(d.getTime() / 1_800_000) * 1_800_000);

export default defineComponent({
  name: "SnShiftCreatePage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const router = useRouter();
    const locations = ref<WorkLocationDto[]>([]);
    const skills = ref<SkillDto[]>([]);
    const start = roundUp30(new Date(Date.now() + 2 * 3_600_000));
    const form = reactive({
      work_location_id: "",
      title: "",
      description: "",
      skill_code: "",
      start: toVnLocalInput(start),
      end: toVnLocalInput(new Date(start.getTime() + 4 * 3_600_000)),
      hourly_vnd: 40000,
      headcount: 1,
      dispatch_mode: ""
    });
    const quote = ref<Quote | null>(null);
    const error = ref("");
    const busy = ref(false);
    // one key per "post" action: a double click or a retry never creates the shift twice
    let idempotencyKey = newIdempotencyKey();
    let quoteTimer: any;

    onMounted(async () => {
      try {
        const [locs, sk] = await Promise.all([employerProfileService.listLocations(), workerProfileService.skills()]);
        locations.value = locs.filter(l => l.active);
        skills.value = sk;
        if (locations.value.length) form.work_location_id = locations.value[0].id;
        if (sk.length) form.skill_code = sk[0].code;
      } catch (e) {
        error.value = errorText(e);
      }
      refreshQuote();
    });

    const refreshQuote = () => {
      clearTimeout(quoteTimer);
      quoteTimer = setTimeout(async () => {
        try {
          if (!form.start || !form.end || !form.hourly_vnd) return;
          quote.value = await shiftPostingService.quote({ start_at: fromVnLocalInput(form.start), end_at: fromVnLocalInput(form.end), hourly_vnd: Number(form.hourly_vnd) });
        } catch {
          quote.value = null;
        }
      }, 300);
    };
    watch(() => [form.start, form.end, form.hourly_vnd], refreshQuote);
    watch(form, () => (idempotencyKey = newIdempotencyKey()), { deep: true });

    const submit = async () => {
      busy.value = true;
      error.value = "";
      try {
        const res = await shiftPostingService.create(
          {
            work_location_id: form.work_location_id,
            title: form.title.trim(),
            ...(form.description.trim() && { description: form.description.trim() }),
            skill_code: form.skill_code,
            start_at: fromVnLocalInput(form.start),
            end_at: fromVnLocalInput(form.end),
            hourly_vnd: Number(form.hourly_vnd),
            headcount: Number(form.headcount),
            ...(form.dispatch_mode && { dispatch_mode: form.dispatch_mode })
          },
          idempotencyKey
        );
        const first = res.shifts[0];
        router.push(res.shifts.length === 1 ? `/sn/employer/shifts/${first.id}` : "/sn/employer/shifts?tab=open");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };

    return { locations, skills, form, quote, error, busy, submit, formatVnd, minutesToHoursLabel };
  }
});
