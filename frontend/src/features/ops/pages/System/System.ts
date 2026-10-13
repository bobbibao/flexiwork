import { defineComponent, onMounted, ref } from "vue";
import { opsService } from "../../services";
import { errorText } from "@/features/sn-shell/i18n";
import { formatDateTimeVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnOpsSystemPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const health = ref<any>(null);
    const recon = ref<any>(null);
    const error = ref("");
    const busy = ref(false);
    const load = async () => {
      try {
        [health.value, recon.value] = await Promise.all([opsService.health(), opsService.latestReconciliation()]);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);
    const reconcile = async () => {
      busy.value = true;
      try {
        recon.value = await opsService.reconcile();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { health, recon, error, busy, reconcile, load, formatDateTimeVn };
  }
});
