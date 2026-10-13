import { defineComponent, onMounted, ref } from "vue";
import { opsService } from "../../services";
import { errorText } from "@/features/sn-shell/i18n";
import { formatPhoneVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

/** Manual worker verification (until eKYC) and suspension. */
export default defineComponent({
  name: "SnOpsWorkersPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const items = ref<any[]>([]);
    const onlyUnverified = ref(false);
    const search = ref("");
    const error = ref("");
    const load = async () => {
      try {
        items.value = (await opsService.workers({ page_size: 100, ...(onlyUnverified.value && { verified: false }), ...(search.value && { search: search.value }) })).items;
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);
    const act = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await load();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    return {
      items, onlyUnverified, search, error, load, formatPhoneVn,
      verify: (id: number) => act(() => opsService.verify(id)),
      suspend: (id: number) => act(() => opsService.suspend(id)),
      unsuspend: (id: number) => act(() => opsService.unsuspend(id))
    };
  }
});
