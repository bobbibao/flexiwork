<template>
  <div class="mt-8">
    <div class="row">
      <div class="col-md-12">
        <b-form-checkbox v-model="include_qr">
          {{ $t("settings.form.invoice.qr") }}
        </b-form-checkbox>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.invoice.duration") }}
        </div>
        <b-form-input v-model="payment_deadline"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.invoice.durationRe1") }}
        </div>
        <b-form-input v-model="reminder1_payment_deadline"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.invoice.durationRe2") }}
        </div>
        <b-form-input v-model="reminder2_payment_deadline"></b-form-input>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 mt-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.invoice.begin") }}
        </div>
        <div class="editor">
          <TextEditor v-model="begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.invoice.end") }}
        </div>
        <div class="editor">
          <TextEditor v-model="end_desc" />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          Teilrechnung Text Anfang
        </div>
        <div class="editor">
          <TextEditor v-model="partial_begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          Teilrechnung Text Ende
        </div>
        <div class="editor">
          <TextEditor v-model="partial_end_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder">
          {{ $t("settings.form.invoice.beginRe1") }}
        </div>
        <div class="mb-2">
          {{ $t("settings.form.invoice.hint") }}
        </div>
        <div class="editor">
          <TextEditor v-model="reminder1_begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder">
          {{ $t("settings.form.invoice.endRe1") }}
        </div>
        <div class="mb-2">
          {{ $t("settings.form.invoice.hint") }}
        </div>
        <div class="editor">
          <TextEditor v-model="reminder1_end_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder">
          {{ $t("settings.form.invoice.beginRe2") }}
        </div>
        <div class="mb-2">
          {{ $t("settings.form.invoice.hint") }}
        </div>
        <div class="editor">
          <TextEditor v-model="reminder2_begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder">
          {{ $t("settings.form.invoice.endRe2") }}
        </div>
        <div class="mb-2">
          {{ $t("settings.form.invoice.hint") }}
        </div>
        <div class="editor">
          <TextEditor v-model="reminder2_end_desc" />
        </div>
      </div>
    </div>

    <!--  Actions -->
    <div class="row">
      <div class="col-md-12 action">
        <b-button
          variant="primary"
          size="lg"
          class="update-btn"
          :disabled="isSaving"
          @click="update"
        >
          <span v-if="isSaving">
            <b-spinner small></b-spinner>
            {{ $t("button.saving") }}
          </span>
          <span v-else>{{ $t("button.update") }}</span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import TextEditor from "@/view/content/TextEditor.vue";
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  UPDATE_INVOICE_SETTING,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  components: {
    TextEditor
  },
  data() {
    return {
      payment_deadline: 0.0,
      reminder1_payment_deadline: 0.0,
      reminder2_payment_deadline: 0.0,
      begin_desc: "",
      end_desc: "",
      partial_begin_desc: "",
      partial_end_desc: "",
      reminder1_begin_desc: "",
      reminder1_end_desc: "",
      reminder2_begin_desc: "",
      reminder2_end_desc: "",
      include_qr: false,
      isSaving: false
    };
  },
  computed: {
    ...mapGetters(["currentSettings"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    this.initData();
  },
  methods: {
    initData() {
      this.payment_deadline = this.currentSettings.invoice.payment_deadline;
      this.reminder1_payment_deadline = this.currentSettings.invoice.reminder1_payment_deadline;
      this.reminder2_payment_deadline = this.currentSettings.invoice.reminder2_payment_deadline;
      this.begin_desc = this.currentSettings.invoice.begin_desc;
      this.end_desc = this.currentSettings.invoice.end_desc;
      this.partial_begin_desc = this.currentSettings.invoice.partial_begin_desc;
      this.partial_end_desc = this.currentSettings.invoice.partial_end_desc;
      this.reminder1_begin_desc = this.currentSettings.invoice.reminder1_begin_desc;
      this.reminder1_end_desc = this.currentSettings.invoice.reminder1_end_desc;
      this.reminder2_begin_desc = this.currentSettings.invoice.reminder2_begin_desc;
      this.reminder2_end_desc = this.currentSettings.invoice.reminder2_end_desc;
      this.include_qr = this.currentSettings.invoice.include_qr;
    },
    async update() {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(UPDATE_INVOICE_SETTING, {
          payment_deadline: this.payment_deadline,
          reminder1_payment_deadline: this.reminder1_payment_deadline,
          reminder2_payment_deadline: this.reminder2_payment_deadline,
          begin_desc: this.begin_desc,
          end_desc: this.end_desc,
          partial_begin_desc: this.partial_begin_desc,
          partial_end_desc: this.partial_end_desc,
          reminder1_begin_desc: this.reminder1_begin_desc,
          reminder1_end_desc: this.reminder1_end_desc,
          reminder2_begin_desc: this.reminder2_begin_desc,
          reminder2_end_desc: this.reminder2_end_desc,
          include_qr: this.include_qr
        });

        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.updateSuccess"));
        }
      } finally {
        this.isSaving = false;
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
.editor {
  height: 15rem;
}

.editor > div {
  height: 10rem;
}

.action {
  display: flex;
  justify-content: flex-end;
}
</style>
