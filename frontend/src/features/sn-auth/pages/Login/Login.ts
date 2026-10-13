import { defineComponent, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSessionStore } from "@/core/stores/session.store";
import { SnApiError } from "@/api/sn-api";
import { errorText } from "@/features/sn-shell/i18n";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnLoginPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const session = useSessionStore();
    const router = useRouter();
    const route = useRoute();
    const form = reactive({ identifier: "", password: "" });
    const error = ref("");
    const busy = ref(false);
    const companies = ref<Array<{ id: number; name: string }>>([]);

    const submit = async (companyId?: number) => {
      error.value = "";
      busy.value = true;
      try {
        await session.login(form.identifier.trim(), form.password, companyId);
        const redirect = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/sn") ? route.query.redirect : session.home;
        router.replace(redirect);
      } catch (e) {
        if (e instanceof SnApiError && e.code === "MULTIPLE_ACCOUNTS") companies.value = e.body?.companies || [];
        else error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };

    return { form, error, busy, companies, submit };
  }
});
