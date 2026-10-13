import { defineComponent, onMounted, reactive, ref } from "vue";
import { workerProfileService } from "../../services";
import { SkillDto, WorkerProfileDto } from "../../dtos";
import { errorText, t } from "@/features/sn-shell/i18n";
import { currentPosition } from "@/features/sn-shell/composables/geolocation";
import { formatPhoneVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnWorkerProfilePage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const profile = ref<WorkerProfileDto | null>(null);
    const skills = ref<SkillDto[]>([]);
    const form = reactive({
      full_name: "",
      dob: "",
      skill_codes: [] as string[],
      home_address: "",
      home_lat: "" as any,
      home_lng: "" as any,
      radius_km: 10,
      bank_name: "",
      account_number: "",
      account_holder: ""
    });
    const error = ref("");
    const message = ref("");
    const busy = ref(false);

    const fill = (p: WorkerProfileDto) => {
      profile.value = p;
      Object.assign(form, {
        full_name: p.full_name,
        dob: p.dob || "",
        skill_codes: [...(p.skill_codes || [])],
        home_address: p.home_address || "",
        home_lat: p.home_lat ?? "",
        home_lng: p.home_lng ?? "",
        radius_km: p.radius_km,
        bank_name: p.bank_account?.bank_name || "",
        account_number: p.bank_account?.account_number || "",
        account_holder: p.bank_account?.account_holder || ""
      });
    };

    onMounted(async () => {
      try {
        const [p, s] = await Promise.all([workerProfileService.get(), workerProfileService.skills()]);
        skills.value = s;
        fill(p);
      } catch (e) {
        error.value = errorText(e);
      }
    });

    const toggleSkill = (code: string) => {
      const i = form.skill_codes.indexOf(code);
      if (i >= 0) form.skill_codes.splice(i, 1);
      else form.skill_codes.push(code);
    };
    const useMyLocation = async () => {
      try {
        const p = await currentPosition();
        form.home_lat = +p.lat.toFixed(6);
        form.home_lng = +p.lng.toFixed(6);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    const save = async () => {
      busy.value = true;
      error.value = "";
      message.value = "";
      try {
        const hasLocation = form.home_lat !== "" && form.home_lng !== "";
        const hasBank = form.bank_name && form.account_number && form.account_holder;
        const updated = await workerProfileService.update({
          full_name: form.full_name.trim(),
          ...(form.dob && { dob: form.dob }),
          skill_codes: form.skill_codes,
          home_address: form.home_address,
          ...(hasLocation && { home_lat: Number(form.home_lat), home_lng: Number(form.home_lng) }),
          radius_km: Number(form.radius_km),
          ...(hasBank && { bank_account: { bank_name: form.bank_name, account_number: form.account_number, account_holder: form.account_holder } })
        } as any);
        fill({ ...profile.value!, ...updated });
        message.value = t("sn.profile.saved");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { profile, skills, form, error, message, busy, toggleSkill, useMyLocation, save, formatPhoneVn };
  }
});
