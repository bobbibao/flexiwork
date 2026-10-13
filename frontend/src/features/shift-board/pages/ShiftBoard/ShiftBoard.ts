import { defineComponent, onMounted, reactive, ref } from "vue";
import { shiftBoardService } from "../../services";
import { SnShift } from "@/common/models/snShift.model";
import { workerProfileService } from "@/features/worker-profile/services";
import { SkillDto } from "@/features/worker-profile/dtos";
import { currentPosition } from "@/features/sn-shell/composables/geolocation";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDistance, formatShiftRange, formatVnd } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

/** "Ca gần bạn": nearby open shifts (PLAN P11.5). Falls back to the home area in the profile. */
export default defineComponent({
  name: "SnShiftBoardPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const items = ref<SnShift[]>([]);
    const skills = ref<SkillDto[]>([]);
    const skillName = ref<Record<string, string>>({});
    const filters = reactive({ radius_km: 10, skill: "", q: "" });
    const position = ref<{ lat: number; lng: number } | null>(null);
    const source = ref<"gps" | "home" | "">("");
    const loading = ref(false);
    const error = ref("");
    const info = ref("");

    const locate = async () => {
      try {
        const p = await currentPosition(8000);
        position.value = { lat: p.lat, lng: p.lng };
        source.value = "gps";
        info.value = "";
      } catch (e) {
        const me = await workerProfileService.get().catch(() => null);
        if (me?.home_lat && me?.home_lng) {
          position.value = { lat: me.home_lat, lng: me.home_lng };
          source.value = "home";
          info.value = t("sn.shift.usingHome");
        } else {
          info.value = t("sn.shift.enableLocation");
        }
      }
    };

    const search = async () => {
      if (!position.value) return;
      loading.value = true;
      error.value = "";
      try {
        items.value = await shiftBoardService.nearby({ ...position.value, radius_km: Number(filters.radius_km), skill: filters.skill || undefined, q: filters.q.trim() || undefined });
      } catch (e) {
        error.value = errorText(e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      skills.value = await workerProfileService.skills().catch(() => []);
      skillName.value = Object.fromEntries(skills.value.map(s => [s.code, s.name_vi]));
      await locate();
      await search();
    });

    return { items, skills, skillName, filters, position, source, loading, error, info, search, locate, formatDistance, formatShiftRange, formatVnd };
  }
});
