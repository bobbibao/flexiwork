<template>
  <div>
    <div
      class="
        position-absolute
        top-0
        right-0
        text-right
        mt-5
        mb-15 mb-lg-0
        flex-column-auto
        justify-content-center
        py-5
        px-10
      "
    >
      <span class="topbar-item">
        <b-dropdown
          size="sm"
          variant="link"
          toggle-class="btn menu-link btn-dropdown btn-lg mr-1 text-decoration-none"
          no-caret
          right
          no-flip
          style="color: #6c7293"
        >
          <template v-slot:button-content>
            <!-- <img
              class="h-20px w-20px rounded-sm"
              :src="languageFlag || getLanguageFlag"
              alt=""
            /> -->
            <span class="font-weight-bolder text-uppercase">{{
              languageFlag || getLanguageFlag
            }}</span>
          </template>
          <b-dropdown-text tag="div" class="min-w-md-175px">
            <KTDropdownLanguage
              v-on:language-changed="onLanguageChanged"
            ></KTDropdownLanguage>
          </b-dropdown-text>
        </b-dropdown>
      </span>

      <span class="font-weight-bold font-size-3 text-dark-60">
        {{ $t("login.already") }}
      </span>
      <router-link
        class="font-weight-bold font-size-3 ml-2"
        :to="{ name: 'login' }"
      >
        {{ $t("button.login") }}!
      </router-link>
    </div>

    <div class="login-form login-signin" style="width: 40rem">
      <div class="text-center mb-10 mb-lg-20">
        <h3 class="font-size-h1">{{ $t("title.forgotPass") }}</h3>
        <p class="text-muted font-weight-semi-bold">
          {{ $t("forgotPass.remind") }}
        </p>
      </div>

      <b-form class="form" @submit.stop.prevent="onSubmit">
        <b-form-group id="email-input-group" label="" label-for="email-input">
          <b-form-input
            class="form-control h-auto"
            id="email-input"
            name="email-input"
            v-model="form.email"
            :state="validateState('email')"
            :placeholder="`${$t('forgotPass.mail')}`"
            aria-describedby="email-feedback"
          ></b-form-input>

          <b-form-invalid-feedback id="email-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <div class="form-group d-flex flex-wrap flex-center mt-10">
          <button
            type="button"
            class="
              btn btn-light-primary
              font-weight-bold
              px-9
              py-4
              my-3
              font-size-3
              mx-4
            "
            @click="$router.push('/login')"
          >
            {{ $t("button.back") }}
          </button>
          <button
            type="submit"
            :disabled="is_loading"
            ref="kt_reset_submit"
            class="btn btn-primary font-weight-bold px-9 py-4 my-3 font-size-3"
          >
            {{ $t("button.reset") }}
          </button>
        </div>
      </b-form>
    </div>

    <!-- Success Dialog -->
    <b-modal
      v-model="success_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.announce')}`"
      @close="resetForm"
    >
      <div>{{ $t("msg.resetSuccess") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button
          variant="primary"
          class="save-btn"
          @click="$router.push('/login')"
        >
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Company dialog -->
    <b-modal
      v-model="company_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.notice')}`"
      @close="resetForm"
    >
      <div>{{ $t("msg.multipleCompanies") }}</div>
      <div class="col-md-12 p-0 mt-4">
        <b-form-select
          id="company-select"
          name="company-select"
          v-model="form.company"
          :options="companies"
          value-field="id"
          text-field="name"
        ></b-form-select>
      </div>
      <div
        class="col-md-12 p-0 mt-4"
        style="display: flex; justify-content: flex-end"
      >
        <b-button
          ref="reset_company"
          variant="primary"
          class="reset-btn"
          :disabled="is_loading"
          @click="resetWithCompany"
        >
          {{ $t("button.reset") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { email, required } from "vuelidate/lib/validators";
import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import i18nService from "@/core/services/i18n.service.js";
import { mapState } from "vuex";
import {
  RESET_PASS,
  CLEAR_LOGIN,
  SET_ERROR
} from "@/core/services/store/auth.module";

export default {
  mixins: [validationMixin],
  name: "forgotPass",
  components: {
    KTDropdownLanguage
  },
  metaInfo: {
    title: "Reset Password",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Reset Password Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Reset Password | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Reset Password | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  data() {
    return {
      form: {
        email: "",
        company: ""
      },
      languageFlag: "",
      languages: i18nService.languages,
      success_dialog: false,
      company_dialog: false,
      is_loading: false,
    };
  },
  validations: {
    form: {
      email: {
        required,
        email
      }
    }
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    resetForm() {
      this.form = {
        email: "",
        company: ""
      };
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    onLanguageChanged() {
      this.languageFlag = this.languages.find(val => {
        return val.lang === i18nService.getActiveLanguage();
      }).lang;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      // clear existing errors
      this.$store.dispatch(CLEAR_LOGIN);
      // set spinner to submit button
      const submitButton = this.$refs["kt_reset_submit"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");
      await this.$store.dispatch(RESET_PASS, { email: this.form.email });
      submitButton.classList.remove(
        "spinner",
        "spinner-light",
        "spinner-right"
      );
      if (this.error) {
        //handle multiple companies
        if (this.companies) {
          this.form.company = this.companies[0].id;
          this.company_dialog = true;
        } else {
          this.toastMsg("error", this.error);
        }
      } else {
        this.success_dialog = true;
      }
      this.is_loading = false;
    },
    async resetWithCompany() {
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      // set spinner to submit button
      const submitButton = this.$refs["reset_company"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");

      await this.$store.dispatch(RESET_PASS, {
        email: this.form.email,
        company_id: this.form.company
      });

      submitButton.classList.remove(
        "spinner",
        "spinner-light",
        "spinner-right"
      );
      this.company_dialog = false;

      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.success_dialog = true;
      }
      this.is_loading = false;
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
      this.$store.commit(SET_ERROR, null);
    }
  },
  computed: {
    ...mapState({
      error: state => state.auth.error,
      companies: state => state.auth.companies
    }),
    getLanguageFlag() {
      return this.onLanguageChanged();
    }
  }
};
</script>

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
