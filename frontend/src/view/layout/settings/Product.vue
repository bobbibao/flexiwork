<template>
  <div class="mt-8">
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.product.folder") }}
        </div>

        <div class="row">
          <div class="col-md-4 font-weight-bold">
            {{ $t("settings.form.product.name") }}
          </div>
        </div>

        <div class="row mt-2">
          <div
            v-for="(item, i) in folders"
            :key="i"
            class="col-md-12 p-0 mb-2"
            style="display: flex"
          >
            <div class="col-md-4">
              <b-form-input
                v-model="item.name"
                :id="`name_${i}`"
                class="name-input"
              ></b-form-input>
            </div>
            <div class="col-md-3">
              <b-button
                variant="primary"
                class="plus-btn"
                @click="addFolder(i)"
              >
                <i class="flaticon2-plus p-0"></i>
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action -->
    <div class="row">
      <div class="col-md-12 action mt-4">
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
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  UPDATE_PRODUCT_SETTING,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  data() {
    return {
      folders: [],
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
    if (this.currentSettings.product?.folders) {
      this.folders = this.currentSettings.product?.folders;
    } else {
      this.addFolder(0);
    }
  },
  methods: {
    addFolder(pos) {
      let item = {
        name: ""
      };
      this.folders.splice(pos + 1, 0, item);
    },
    async update() {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(UPDATE_PRODUCT_SETTING, {
          folders: this.folders
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
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
