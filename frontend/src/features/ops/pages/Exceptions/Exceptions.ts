import { defineComponent, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { opsService } from "../../services";
import { errorText } from "@/features/sn-shell/i18n";
import { formatDateTimeVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

const SEVERITY_VARIANT: Record<string, string> = { critical: "danger", high: "danger", medium: "warning", low: "info" };

/** Human exception queue (docs/ARCHITECTURE.md §13, item 6). */
export default defineComponent({
  name: "SnOpsExceptionsPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const data = ref<any>({ items: [], open_by_severity: {} });
    const filters = reactive({ status: "OPEN,ACKNOWLEDGED", severity: "" });
    const error = ref("");
    let poll: any;
    const load = async () => {
      try {
        data.value = await opsService.exceptions({ status: filters.status, ...(filters.severity && { severity: filters.severity }), page_size: 50 });
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(() => {
      load();
      poll = setInterval(load, 10000);
    });
    onBeforeUnmount(() => clearInterval(poll));
    return { data, filters, error, load, variant: (s: string) => SEVERITY_VARIANT[s] || "secondary", formatDateTimeVn };
  }
});
