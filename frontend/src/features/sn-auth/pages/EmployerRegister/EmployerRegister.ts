import { defineComponent, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/core/stores/session.store";
import { errorText } from "@/features/sn-shell/i18n";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnEmployerRegisterPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const session = useSessionStore();
    const router = useRouter();
    const form = reactive({ company_name: "", tax_code: "", contact_name: "", email: "", phone: "", address: "", password: "", accept_terms: false });
    const error = ref("");
    const busy = ref(false);

    const submit = async () => {
      error.value = "";
      busy.value = true;
      try {
        await session.registerEmployer({
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          accept_terms: form.accept_terms,
          ...(form.tax_code.trim() && { tax_code: form.tax_code.trim() }),
          ...(form.address.trim() && { address: form.address.trim() })
        });
        router.replace("/sn/employer/locations");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { form, error, busy, submit };
  }
});
