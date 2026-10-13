import { defineComponent, onMounted, ref } from "vue";
import { opsService } from "../../services";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDateTimeVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnOpsDlqPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const items = ref<any[]>([]);
    const error = ref("");
    const message = ref("");
    const load = async () => {
      try {
        items.value = await opsService.dlq();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);
    const replay = async (id: string) => {
      try {
        await opsService.replay(id);
        message.value = t("sn.ops.replayed");
        await load();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    return { items, error, message, replay, formatDateTimeVn };
  }
});
