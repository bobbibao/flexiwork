import { defineComponent, onMounted, reactive, ref } from "vue";
import { employerProfileService } from "../../services";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatPhoneVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnEmployerProfilePage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const form = reactive({ legal_name: "", tax_code: "", business_type: "", address: "" });
    const info = ref<any>(null);
    const message = ref("");
    const error = ref("");
    const busy = ref(false);

    onMounted(async () => {
      try {
        info.value = await employerProfileService.getProfile();
        Object.assign(form, {
          legal_name: info.value.legal_name || "",
          tax_code: info.value.tax_code || "",
          business_type: info.value.business_type || "",
          address: info.value.address || ""
        });
      } catch (e) {
        error.value = errorText(e);
      }
    });

    const save = async () => {
      busy.value = true;
      error.value = "";
      message.value = "";
      try {
        info.value = { ...info.value, ...(await employerProfileService.updateProfile({ ...form })) };
        message.value = t("sn.profile.saved");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { form, info, message, error, busy, save, formatPhoneVn };
  }
});
