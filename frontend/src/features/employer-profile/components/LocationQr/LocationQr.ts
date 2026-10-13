import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import QRCode from "qrcode";
import { employerProfileService } from "../../services";
import { errorText } from "@/features/sn-shell/i18n";

/** Rotating check-in QR for a work location (refreshes before the 30 s window ends). */
export default defineComponent({
  name: "LocationQr",
  compatConfig: { MODE: 3 },
  props: { locationId: { type: String, required: true } },
  setup(props) {
    const token = ref("");
    const image = ref("");
    const seconds = ref(0);
    const error = ref("");
    let expiresAt = 0;
    let tick: any;

    const refresh = async () => {
      try {
        const qr = await employerProfileService.qr(props.locationId);
        token.value = qr.token;
        expiresAt = new Date(qr.expires_at).getTime();
        image.value = await QRCode.toDataURL(qr.token, { width: 440, margin: 1 });
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(async () => {
      await refresh();
      tick = setInterval(async () => {
        seconds.value = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        if (seconds.value <= 1) await refresh();
      }, 1000);
    });
    onBeforeUnmount(() => clearInterval(tick));
    return { token, image, seconds, error };
  }
});
