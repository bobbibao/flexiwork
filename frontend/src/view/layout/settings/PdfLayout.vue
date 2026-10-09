<template>
  <div class="mt-8">
    <!-- Upload Image -->
    <!-- <div class="row">
      <div class="col-md-12">
        <h5 class="font-weight-bolder">{{ $t("settings.form.pdf.logo") }}</h5>
      </div>
      <div class="col-md-12">
        <div v-if="display">
          <div class="col-md-12 action">
            <i
              class="flaticon2-cancel action-icon"
              @click="display = false"
            ></i>
          </div>
          <div class="logo-wrapper">
            <img
              id="logo"
              :src="`/${currentSettings.pdf_layout.logo}`"
              alt="logo"
              class="logo"
            />
          </div>
        </div>
        <div v-else class="upload-wrapper">
          <b-form-file
            v-model="file"
            :placeholder="`${$t('msg.selectFile')}`"
            :drop-placeholder="`${$t('msg.dropFile')}`"
            accept="image/jpeg, image/png"
          ></b-form-file>
          <b-button
            variant="primary"
            class="upload-btn ml-2"
            @click="updateLogo"
            >{{ $t("button.upload") }}</b-button
          >
        </div>
      </div>
    </div> -->

    <!-- Setting Fields -->
    <div class="row mt-6">
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.scale") }}(%)
        </div>
        <b-form-input
          v-model="currentSettings.pdf_layout.scaling"
        ></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.logoPos") }}
        </div>
        <b-form-select
          v-model="currentSettings.pdf_layout.logo_position"
          :options="position"
        ></b-form-select>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.adrPos") }}
        </div>
        <b-form-select
          v-model="currentSettings.pdf_layout.address_position"
          :options="position"
        ></b-form-select>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.font") }}
        </div>
        <b-form-select
          v-model="currentSettings.pdf_layout.pdf_font"
          :options="fonts"
        ></b-form-select>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.footerCustom") }}
        </div>
        <b-form-checkbox
          class="visible-box"
          :checked="currentSettings.pdf_layout.show_footer === true"
          @change="
            currentSettings.pdf_layout.show_footer = !currentSettings.pdf_layout
              .show_footer
          "
          >{{ $t("settings.form.pdf.showFooter") }}</b-form-checkbox
        >
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.headerCustom") }}
        </div>
        <b-form-checkbox
          class="visible-box"
          :checked="currentSettings.pdf_layout.show_header === true"
          @change="updateHeaderSetting"
          >{{ $t("settings.form.pdf.showHeader") }}</b-form-checkbox
        >
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.pdf.pgNum") }}
        </div>
        <b-form-checkbox
          class="visible-box"
          :checked="currentSettings.pdf_layout.show_page_numbers === true"
          :disabled="currentSettings.pdf_layout.show_header === false"
          @change="
            currentSettings.pdf_layout.show_page_numbers = !currentSettings
              .pdf_layout.show_page_numbers
          "
          >{{ $t("settings.form.pdf.showNum") }}</b-form-checkbox
        >
      </div>
    </div>

    <!-- Action -->
    <div class="row">
      <div class="col-md-12 action mt-4">
        <b-button
          variant="primary"
          size="lg"
          class="update-btn"
          @click="update"
          >{{ $t("button.update") }}</b-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  UPDATE_PDF_SETTING,
  UPDATE_LOGO,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  data() {
    return {
      position: ["left", "right"],
      fonts: [
        "klavika",
        "arial",
        "courier new",
        "georgia",
        "open sans",
        "verdana"
      ],
      file: null,
      display: false
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
    if (this.currentSettings.pdf_layout.logo) {
      this.display = true;
    }
  },
  methods: {
    update() {
      this.$store.dispatch(UPDATE_PDF_SETTING, this.currentSettings.pdf_layout);
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    async updateLogo() {
      if (this.file) {
        await this.$store.dispatch(UPDATE_LOGO, { file: this.file });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.uploadSuccess"));
          await this.$store.dispatch(GET_SETTINGS);
          this.display = true;
        }
      } else {
        this.toastMsg("error", this.$t("msg.noFile"));
      }
    },
    updateHeaderSetting() {
      this.currentSettings.pdf_layout.show_header = !this.currentSettings
        .pdf_layout.show_header;
      if (this.currentSettings.pdf_layout.show_header === true) {
        this.currentSettings.pdf_layout.show_page_numbers = true;
      } else {
        this.currentSettings.pdf_layout.show_page_numbers = false;
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
.upload-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.action {
  display: flex;
  justify-content: flex-end;
}

.action-icon:hover {
  color: #3699ff;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20rem;
}

.logo {
  height: 10rem;
}
</style>
