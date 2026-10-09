<template>
  <div class="mt-8">
    <!-- Generate token -->
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.sharing.generateToken") }}
        </div>
      </div>
      <div class="col-md-8">
        <b-form-input
          v-model="currentCompany.signature"
          disabled
        ></b-form-input>
      </div>
      <div class="col-md-4">
        <b-button variant="success" @click="generateToken">
          {{ $t("button.generate") }}
        </b-button>
      </div>
    </div>
    <!-- Add connection -->
    <div class="row mt-6">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.sharing.connections") }}
        </div>
      </div>
      <div class="col-md-6">
        <b-form-input v-model="add_token"></b-form-input>
      </div>
      <div class="col-md-4">
        <b-button variant="primary" @click="addConnection">
          {{ $t("button.add") }}
        </b-button>
      </div>
    </div>

    <div class="row mt-6" v-show="currentConnections.length > 0">
      <div class="col-md-12">
        <b-table
          bordered
          head-variant="light"
          :items="currentConnections"
          :fields="fields"
        >
          <template v-slot:cell(company)="row">
            {{ row.item.company.name }}
          </template>
          <template v-slot:cell(actions)="row">
            <i
              class="action-icon flaticon2-rubbish-bin mr-2"
              @click="removeConnection(row.item)"
            ></i>
          </template>
        </b-table>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal
      v-model="remove_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.confirm')}`"
    >
      <div>{{ $t("msg.delConnection") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import {
  GET_COMPANY,
  GET_CONNECTIONS,
  ADD_CONNECTION,
  DELETE_CONNECTION,
  GENERATE_SIGNATURE,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  data() {
    return {
      fields: [
        {
          key: "company",
          label: this.$t("settings.form.sharing.connection")
        },
        { key: "actions", label: this.$t("settings.form.sharing.actions") }
      ],
      add_token: "",
      remove_token: "",
      remove_dialog: false
    };
  },
  computed: {
    ...mapGetters(["currentConnections", "currentCompany"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  async mounted() {
    await this.$store.dispatch(GET_CONNECTIONS);
    await this.$store.dispatch(GET_COMPANY);
  },
  methods: {
    async generateToken() {
      await this.$store.dispatch(GENERATE_SIGNATURE);
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_COMPANY);
      }
    },
    async addConnection() {
      await this.$store.dispatch(ADD_CONNECTION, { signature: this.add_token });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_CONNECTIONS);
        this.toastMsg("success", this.$t("msg.addSuccess"));
      }
      this.add_token = "";
    },
    removeConnection(item) {
      this.remove_token = item.signature;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      await this.$store.dispatch(DELETE_CONNECTION, {
        signature: this.remove_token
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_CONNECTIONS);
        this.remove_dialog = false;
        this.toastMsg("success", this.$t("msg.delSuccess"));
      }
      this.remove_token = "";
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
