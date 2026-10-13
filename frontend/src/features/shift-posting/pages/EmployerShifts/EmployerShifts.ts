import { defineComponent, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shiftPostingService } from "../../services";
import { EMPLOYER_TABS } from "../../constants";
import { SnShift } from "@/common/models/snShift.model";
import { errorText } from "@/features/sn-shell/i18n";
import { formatShiftRange, formatVnd } from "@/common/vnFormat";
import { skillNames } from "@/features/worker-profile/services";
import SnStatusBadge from "@/features/sn-shell/components/SnStatusBadge/SnStatusBadge.vue";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnEmployerShiftsPage",
  compatConfig: { MODE: 3 },
  components: { SnStatusBadge, SnAlert },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const tab = ref<string>((route.query.tab as string) || "open");
    const items = ref<SnShift[]>([]);
    const counts = ref<Record<string, number>>({});
    const skills = ref<Record<string, string>>({});
    const page = ref(1);
    const pages = ref(1);
    const loading = ref(false);
    const error = ref("");

    const load = async () => {
      loading.value = true;
      error.value = "";
      try {
        const [list, c] = await Promise.all([shiftPostingService.list(tab.value, page.value), shiftPostingService.counts()]);
        items.value = list.items;
        pages.value = Math.max(1, list.total_pages);
        counts.value = c;
      } catch (e) {
        error.value = errorText(e);
      } finally {
        loading.value = false;
      }
    };
    onMounted(async () => {
      skills.value = await skillNames().catch(() => ({}));
      await load();
    });
    watch(tab, () => {
      page.value = 1;
      router.replace({ query: { tab: tab.value } });
      load();
    });
    watch(page, load);

    return { tabs: EMPLOYER_TABS, tab, items, counts, skills, page, pages, loading, error, formatShiftRange, formatVnd, reload: load };
  }
});
