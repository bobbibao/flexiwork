import { defineComponent, onMounted, ref } from "vue";
import { opsService } from "../../services";
import { errorText, t } from "@/features/sn-shell/i18n";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

/** Autonomy policies per decision point: manual / suggest / auto + kill switch (docs/ARCHITECTURE.md §13). */
export default defineComponent({
  name: "SnOpsPoliciesPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const policies = ref<any[]>([]);
    const error = ref("");
    const message = ref("");
    const load = async () => {
      try {
        policies.value = await opsService.policies();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);
    const update = async (p: any, patch: Record<string, unknown>) => {
      error.value = "";
      try {
        Object.assign(p, await opsService.updatePolicy(p.decision_point, patch));
        message.value = t("sn.profile.saved");
      } catch (e) {
        error.value = errorText(e);
        await load();
      }
    };
    return { policies, error, message, update };
  }
});
