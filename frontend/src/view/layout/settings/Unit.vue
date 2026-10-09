<template>
  <div class="mt-8">
    <b-table
      bordered
      head-variant="light"
      :items="currentUnits"
      :fields="fields"
    >
      <template v-slot:cell(description)="row">
        {{
          row.item.description.includes("unit.")
            ? `${$t(row.item.description.toString())}`
            : row.item.description
        }}
      </template>
      <template v-slot:cell(name)="row">
        {{
          row.item.name.includes("unit.")
            ? `${$t(row.item.name.toString())}`
            : row.item.name
        }}
      </template>
      <template v-slot:cell(is_visible)="row">
        <b-form-checkbox
          class="visible-box"
          size="lg"
          :checked="row.item.is_visible === true"
          @change="setVisible(row.item)"
        />
      </template>
      <template v-slot:cell(is_default)="row">
        <b-form-checkbox
          class="visible-box"
          size="lg"
          :checked="row.item.is_default === true"
          @change="setDefault(row.item)"
        />
      </template>
      <template v-slot:cell(time_recording_active)="row">
        <b-form-checkbox
          class="visible-box"
          size="lg"
          :checked="row.item.time_recording_active === true"
          @change="setTimeRecord(row.item)"
        />
      </template>
    </b-table>

    <!--  Actions -->
    <div class="row">
      <div class="col-md-12 action mt-4">
        <b-button
          variant="primary"
          size="lg"
          class="update-btn"
          @click="(dialog = true), resetForm()"
          >{{ $t("button.add") }}</b-button
        >
      </div>
    </div>

    <!-- Dialog -->
    <b-modal
      v-model="dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('settings.unit')}`"
      @close="resetForm"
    >
      <b-form @submit.stop.prevent="onSubmit">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.unit.desc") }}
        </div>
        <b-form-group label-for="desc-input">
          <b-form-input
            id="desc-input"
            name="desc-input"
            v-model="form.description"
            :state="validateState('description')"
            aria-describedby="desc-feedback"
          ></b-form-input>

          <b-form-invalid-feedback id="desc-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <div class="subtitle-1 font-weight-bolder mt-4 mb-2">
          {{ $t("settings.form.unit.unit") }}
        </div>
        <b-form-group label-for="unit-input">
          <b-form-input
            id="unit-input"
            name="unit-input"
            v-model="form.name"
            :state="validateState('name')"
            aria-describedby="unit-feedback"
          ></b-form-input>

          <b-form-invalid-feedback id="unit-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-checkbox
          v-model="form.time_recording_active"
          class="time-record mt-4"
          size="md"
          @change="form.time_recording_active = !form.time_recording_active"
          >{{ $t("settings.form.unit.timeRecordActive") }}</b-form-checkbox
        >
        <div class="mt-4">
          {{ $t("settings.form.unit.text1") }}
        </div>
        <div class="mt-4">
          {{ $t("settings.form.unit.text2") }}
        </div>
        <div class="action mt-4">
          <b-button variant="primary" class="save-btn" type="submit" :disabled="isSaving">
            <span v-if="isSaving">
              <b-spinner small></b-spinner>
              {{ $t("button.saving") }}
            </span>
            <span v-else>{{ $t("button.save") }}</span>
          </b-button>
        </div>
      </b-form>
    </b-modal>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";
import { mapGetters, mapState } from "vuex";
import {
  GET_UNITS,
  ADD_UNIT,
  UPDATE_UNIT,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  mixins: [validationMixin],
  data() {
    return {
      fields: [
        {
          key: "description",
          label: this.$t("settings.form.unit.desc"),
          sortable: false,
          thStyle: { width: "30%" }
        },
        {
          key: "name",
          label: this.$t("settings.form.unit.unit"),
          sortable: false,
          thStyle: { width: "25%" }
        },
        {
          key: "is_visible",
          label: this.$t("settings.form.unit.visible"),
          thStyle: { width: "15%" }
        },
        {
          key: "is_default",
          label: this.$t("settings.form.unit.default"),
          thStyle: { width: "15%" }
        },
        {
          key: "time_recording_active",
          label: this.$t("settings.form.unit.timeRecord"),
          thStyle: { width: "15%" }
        }
      ],
      form: {
        description: "",
        name: "",
        time_recording_active: false
      },
      dialog: false,
      isSaving: false
    };
  },
  computed: {
    ...mapGetters(["currentUnits"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  mounted() {
    this.$store.dispatch(GET_UNITS);
  },
  validations: {
    form: {
      description: {
        required
      },
      name: {
        required
      }
    }
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$invalid) {
        return;
      }

      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(ADD_UNIT, {
          name: this.form.name,
          description: this.form.description,
          is_visible: true,
          is_default: false,
          time_recording_active: this.form.time_recording_active
        });

        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          await this.$store.dispatch(GET_UNITS);
          this.dialog = false;
          this.toastMsg("success", this.$t("msg.updateSuccess"));
        }
      } finally {
        this.isSaving = false;
      }
    },
    resetForm() {
      this.form = {
        description: "",
        name: "",
        time_recording_active: false
      };
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async setVisible(item) {
      await this.$store.dispatch(UPDATE_UNIT, {
        id: item.id,
        data: {
          description: item.description,
          name: item.name,
          is_default: item.is_default,
          time_recording_active: item.time_recording_active,
          is_visible: !item.is_visible
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_UNITS);
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    async setDefault(item) {
      await this.$store.dispatch(UPDATE_UNIT, {
        id: item.id,
        data: {
          description: item.description,
          name: item.name,
          is_default: !item.is_default,
          time_recording_active: item.time_recording_active,
          is_visible: item.is_visible
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_UNITS);
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    async setTimeRecord(item) {
      await this.$store.dispatch(UPDATE_UNIT, {
        id: item.id,
        data: {
          description: item.description,
          name: item.name,
          is_default: item.is_default,
          is_visible: item.is_visible,
          time_recording_active: !item.time_recording_active
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_UNITS);
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h(
        "div",
        { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] },
        [
          h(
            "strong",
            { class: "mr-2" },
            type === "error" ? "Error" : this.$t("title.notice")
          )
        ]
      );
      const vNodesMsg = h("h5", { class: ["mb-0"] }, [h("strong", msg)]);
      this.$bvToast.toast([vNodesMsg], {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        toaster: "b-toaster-top-center",
        autoHideDelay: 5000,
        solid: true
      });
      this.$store.commit(SET_SETTING_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
