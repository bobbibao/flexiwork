<template>
  <div class="mt-8">
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.project.duration") }}
        </div>
        <b-form-input v-model="duration"></b-form-input>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 mt-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.project.address") }}
        </div>
        <div class="editor">
          <TextEditor v-model="address" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 mt-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.project.begin") }}
        </div>
        <div class="editor">
          <TextEditor v-model="begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.project.end") }}
        </div>
        <div class="editor">
          <TextEditor v-model="end_desc" />
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
  UPDATE_PROJECT_SETTING,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  components: {
    TextEditor
  },
  data() {
    return {
      duration: 0.0,
      begin_desc: "",
      end_desc: "",
      address: "",
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
      this.duration = this.currentSettings.project.duration;
      this.address = this.currentSettings.project.address;
      this.begin_desc = this.currentSettings.project.begin_desc;
      this.end_desc = this.currentSettings.project.end_desc;
    },
    async update() {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(UPDATE_PROJECT_SETTING, {
          duration: this.duration,
          address: this.address,
          begin_desc: this.begin_desc,
          end_desc: this.end_desc
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
