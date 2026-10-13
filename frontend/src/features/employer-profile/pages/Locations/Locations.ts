import { defineComponent, onMounted, reactive, ref } from "vue";
import { employerProfileService } from "../../services";
import { WorkLocationDto } from "../../dtos";
import { errorText, t } from "@/features/sn-shell/i18n";
import { currentPosition } from "@/features/sn-shell/composables/geolocation";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";
import SnModal from "@/features/sn-shell/components/SnModal/SnModal.vue";
import LocationQr from "../../components/LocationQr/LocationQr.vue";

const empty = () => ({ id: "", name: "", address: "", lat: "" as any, lng: "" as any, geofence_radius_m: 150, qr_required: false, active: true });

export default defineComponent({
  name: "SnLocationsPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnModal, LocationQr },
  setup() {
    const locations = ref<WorkLocationDto[]>([]);
    const form = reactive(empty());
    const editing = ref(false);
    const error = ref("");
    const message = ref("");
    const busy = ref(false);
    const qrFor = ref<WorkLocationDto | null>(null);

    const load = async () => {
      try {
        locations.value = await employerProfileService.listLocations();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);

    const startNew = () => {
      Object.assign(form, empty());
      editing.value = true;
    };
    const startEdit = (l: WorkLocationDto) => {
      Object.assign(form, { ...l, address: l.address || "" });
      editing.value = true;
    };
    const useMyLocation = async () => {
      try {
        const p = await currentPosition();
        form.lat = +p.lat.toFixed(6);
        form.lng = +p.lng.toFixed(6);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    const save = async () => {
      busy.value = true;
      error.value = "";
      message.value = "";
      const data = {
        name: form.name.trim(),
        address: form.address || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
        geofence_radius_m: Number(form.geofence_radius_m),
        qr_required: !!form.qr_required,
        active: !!form.active
      };
      try {
        if (form.id) await employerProfileService.updateLocation(form.id, data);
        else await employerProfileService.createLocation(data);
        editing.value = false;
        message.value = t("sn.profile.saved");
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { locations, form, editing, error, message, busy, qrFor, startNew, startEdit, useMyLocation, save };
  }
});
