import { defineComponent, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/core/stores/session.store";
import { errorText } from "@/features/sn-shell/i18n";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnWorkerRegisterPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const session = useSessionStore();
    const router = useRouter();
    const form = reactive({ full_name: "", phone: "", email: "", password: "", accept_terms: false, adult: false });
    const error = ref("");
    const busy = ref(false);

    const submit = async () => {
      error.value = "";
      busy.value = true;
      try {
        await session.registerWorker({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          password: form.password,
          accept_terms: form.accept_terms && form.adult,
          ...(form.email.trim() && { email: form.email.trim() })
        });
        router.replace("/sn/profile");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { form, error, busy, submit };
  }
});
