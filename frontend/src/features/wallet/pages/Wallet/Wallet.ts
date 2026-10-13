import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { walletService, WalletDto, StatementItem, IntentDto } from "../../services";
import { useSessionStore } from "@/core/stores/session.store";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDateTimeVn, formatVnd } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

const PRESETS = [500000, 1000000, 5000000];

/** Wallet: balance, top-up (employer, fake gateway), payout (worker), statement (PLAN P11.3). */
export default defineComponent({
  name: "SnWalletPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const session = useSessionStore();
    const wallet = ref<WalletDto | null>(null);
    const items = ref<StatementItem[]>([]);
    const page = ref(1);
    const pages = ref(1);
    const amount = ref<number | null>(null);
    const pending = ref<IntentDto | null>(null);
    const error = ref("");
    const message = ref("");
    const busy = ref(false);
    let poll: any;

    const load = async () => {
      try {
        const [w, st] = await Promise.all([walletService.get(), walletService.statement(page.value)]);
        wallet.value = w;
        items.value = st.items;
        pages.value = Math.max(1, st.total_pages);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);
    onBeforeUnmount(() => clearInterval(poll));

    const watchIntent = (intent: IntentDto) => {
      pending.value = intent;
      clearInterval(poll);
      poll = setInterval(async () => {
        const i = await walletService.intent(intent.id).catch(() => null);
        if (!i) return;
        pending.value = i;
        if (["succeeded", "failed"].includes(i.status)) {
          clearInterval(poll);
          const ok = i.status === "succeeded";
          if (i.kind === "topup") message.value = ok ? t("sn.wallet.topUpDone") : "";
          else message.value = ok ? t("sn.wallet.payoutDone") : "";
          if (!ok) error.value = i.kind === "topup" ? t("sn.wallet.topUpFailed") : t("sn.wallet.payoutFailed");
          pending.value = null;
          await load();
        }
      }, 1500);
    };

    const submit = async (value?: number) => {
      const v = Number(value ?? amount.value);
      if (!v) return;
      busy.value = true;
      error.value = "";
      message.value = "";
      try {
        const intent = session.role === "employer" ? await walletService.topUp(v) : await walletService.payout(v);
        if (intent.status === "awaiting_approval") message.value = t("sn.wallet.payoutAwaiting");
        else watchIntent(intent);
        amount.value = null;
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    const changePage = async (p: number) => {
      page.value = p;
      await load();
    };

    return { session, wallet, items, page, pages, amount, pending, error, message, busy, presets: PRESETS, submit, changePage, formatVnd, formatDateTimeVn };
  }
});
