<template>
  <div class="mt-8">
    <b-table
      bordered
      head-variant="light"
      :items="currentVatRates"
      :fields="fields"
    >
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
          class="default-box"
          size="lg"
          :checked="row.item.is_default === true"
          @change="setDefault(row.item)"
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
      :title="`${$t('settings.rate')}`"
      @close="resetForm"
    >
      <b-form @submit.stop.prevent="onSubmit">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.vat.percent") }}
        </div>
        <b-form-group label-for="rate-input">
          <b-form-input
            id="rate-input"
            name="rate-input"
            v-model="form.rate"
            :state="validateState('rate')"
            aria-describedby="rate-feedback"
          ></b-form-input>

          <b-form-invalid-feedback id="rate-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

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
  GET_VAT,
  ADD_VAT,
  UPDATE_VAT,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  mixins: [validationMixin],
  data() {
    return {
      fields: [
        {
          key: "rate",
          label: this.$t("settings.form.vat.rate"),
          sortable: false
        },
        { key: "is_visible", label: this.$t("settings.form.vat.visible") },
        { key: "is_default", label: this.$t("settings.form.vat.default") }
      ],
      form: {
        rate: 0.0
      },
      dialog: false,
      isSaving: false
    };
  },
  validations: {
    form: {
      rate: {
        required
      }
    }
  },
  computed: {
    ...mapGetters(["currentVatRates"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  mounted() {
    this.$store.dispatch(GET_VAT);
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }

      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(ADD_VAT, {
          rate: parseFloat(this.form.rate),
          is_visible: true,
          is_default: false
        });
        
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          await this.$store.dispatch(GET_VAT);
          this.toastMsg("success", this.$t("msg.addSuccess"));
          this.dialog = false;
        }
      } finally {
        this.isSaving = false;
      }
    },
    resetForm() {
      this.form = {
        rate: 0.0
      };
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async setVisible(item) {
      await this.$store.dispatch(UPDATE_VAT, {
        id: item.id,
        data: {
          rate: item.rate,
          is_visible: !item.is_visible,
          is_default: item.is_default
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_VAT);
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    async setDefault(item) {
      await this.$store.dispatch(UPDATE_VAT, {
        id: item.id,
        data: {
          rate: item.rate,
          is_visible: item.is_visible,
          is_default: !item.is_default
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_VAT);
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
