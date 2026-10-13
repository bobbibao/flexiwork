import { defineComponent, onMounted, ref, watch } from "vue";
import { myShiftsService } from "../../services";
import { SnShift } from "@/common/models/snShift.model";
import { errorText } from "@/features/sn-shell/i18n";
import { formatShiftRange, formatVnd } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";
import SnStatusBadge from "@/features/sn-shell/components/SnStatusBadge/SnStatusBadge.vue";

export default defineComponent({
  name: "SnMyShiftsPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnStatusBadge },
  setup() {
    const scope = ref("upcoming");
    const items = ref<SnShift[]>([]);
    const error = ref("");
    const loading = ref(false);
    const load = async () => {
      loading.value = true;
      try {
        items.value = (await myShiftsService.list(scope.value)).items;
      } catch (e) {
        error.value = errorText(e);
      } finally {
        loading.value = false;
      }
    };
    onMounted(load);
    watch(scope, load);
    return { scope, items, error, loading, scopes: ["upcoming", "active", "history"], formatShiftRange, formatVnd };
  }
});
