<template>
  <div>
    <!--begin::Content header-->
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
            <span class="font-weight-bolder text-uppercase">{{ languageFlag || getLanguageFlag }}</span>
          </template>
          <b-dropdown-text tag="div" class="min-w-md-175px">
            <KTDropdownLanguage v-on:language-changed="onLanguageChanged"></KTDropdownLanguage>
          </b-dropdown-text>
        </b-dropdown>
      </span>

      <span class="font-weight-bold font-size-3 text-dark-60">
        {{ $t("login.noAcc") }}
      </span>
      <router-link class="font-weight-bold font-size-3 ml-2" :to="{ name: 'register' }">
        {{ $t("button.register") }}!
      </router-link>
    </div>
    <!--end::Content header-->

    <!--begin::Signin-->
    <div class="login-form login-signin">
      <div class="text-center mb-10 mb-lg-20">
        <h3 class="font-size-h1">{{ $t("title.login") }}</h3>
        <p class="text-muted font-weight-semi-bold">
          {{ $t("login.guide") }}
        </p>
      </div>

      <!--begin::Form-->
      <b-form class="form" @submit.stop.prevent="onSubmit">
        <!-- <div role="alert" class="alert alert-info">
          <div class="alert-text">
            Use account <strong>test@archapp.ch</strong> and password
            <strong>ArchApp@123</strong> to continue.
          </div>
        </div> -->

        <!-- <div
          role="alert"
          v-bind:class="{ show: error }"
          class="alert fade alert-danger"
        >
          <div class="alert-text">
            {{ error }}
          </div>
        </div> -->

        <b-form-group id="email-input-group" label="" label-for="email-input">
          <b-form-input
            class="form-control h-auto"
            id="email-input"
            name="email-input"
            placeholder="Email"
            v-model="form.email"
            :state="validateState('email')"
            aria-describedby="email-feedback"
          ></b-form-input>

          <b-form-invalid-feedback id="email-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group id="password-input-group" label="" label-for="password-input">
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              :type="visible"
              id="password-input"
              name="password-input"
              placeholder="Passwort"
              v-model="form.password"
              :state="validateState('password')"
              aria-describedby="password-feedback"
            ></b-form-input>
            <b-input-group-append is-text @click="toggleVisible">
              <i class="flaticon-eye" :class="visible === 'text' ? 'visible' : ''"></i>
            </b-input-group-append>
          </b-input-group>

          <b-form-invalid-feedback id="password-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!--begin::Action-->
        <div
          class="
            form-group
            d-flex
            flex-wrap
            justify-content-between
            align-items-center
          "
        >
          <router-link class="font-weight-bold font-size-3 ml-2" :to="{ name: 'forgotPass' }">
            {{ $t("login.forgotPass") }}
          </router-link>
          <button v-if="is_loading" class="btn btn-secondary font-weight-bold px-9 py-4 my-3 font-size-3 spinner spinner-light spinner-right" type="button">
            {{ $t("button.login") }}
          </button>
          <button v-else ref="kt_login_signin_submit" class="btn btn-primary font-weight-bold px-9 py-4 my-3 font-size-3" type="submit">
            {{ $t("button.login") }}
          </button>
        </div>
        <!--end::Action-->
      </b-form>
      <!--end::Form-->
    </div>

    <!-- Company dialog -->
    <b-modal v-model="dialog" hide-footer no-close-on-backdrop :title="`${$t('title.notice')}`" @close="resetForm">
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
      <div class="col-md-12 p-0 mt-4" style="display: flex; justify-content: flex-end">
        <b-button ref="login_company" variant="primary" class="login-btn" :disabled="is_loading" @click="loginWithCompany">
          {{ $t("button.login") }}
        </b-button>
      </div>
    </b-modal>
    <!--end::Signin-->
  </div>
</template>

<style lang="scss" scoped>
.spinner.spinner-right {
  padding-right: 3.5rem !important;
}

.visible {
  color: #3699ff;
}

.login-form {
  width: 100%;
}

@media (min-width: 500px) {
  .login-form {
    width: 40rem;
  }
}
</style>

<script>
import { mapState } from "vuex";
import { LOGIN, CLEAR_LOGIN, SET_TOAST, SET_ERROR } from "@/core/services/store/auth.module";

import { validationMixin } from "vuelidate";
import { email, minLength, required } from "vuelidate/lib/validators";

import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import i18nService from "@/core/services/i18n.service.js";

export default {
  mixins: [validationMixin],
  name: "login",
  components: {
    KTDropdownLanguage
  },
  metaInfo: {
    title: "Login",
    meta: [
      { hid: "description", name: "description", content: "Login Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Login | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Login | Archapp"
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
      // Remove this dummy login info
      form: {
        email: "",
        password: "",
        company: ""
      },
      visible: "password",
      languageFlag: "",
      languages: i18nService.languages,
      dialog: false,
      is_loading: false,
    };
  },
  validations: {
    form: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(3)
      }
    }
  },
  async mounted() {
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_TOAST, null);
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
        password: "",
        company: ""
      };

      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }

      // Set loading state
      this.is_loading = true;

      // clear existing errors
      this.$store.dispatch(CLEAR_LOGIN);

      // set spinner to submit button
      const submitButton = this.$refs["kt_login_signin_submit"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");

      await this.$store.dispatch(LOGIN, {
        email: this.form.email,
        password: this.form.password
      });

      submitButton.classList.remove("spinner", "spinner-light", "spinner-right");

      if (this.error) {
        //handle multiple companies
        if (this.companies) {
          this.form.company = this.companies[0].id;
          this.dialog = true;
        } else {
          this.toastMsg("error", this.error);
        }
      } else {
        await this.$router.replace("/dashboard");
      }
      this.is_loading = false;
    },
    async loginWithCompany() {
      // set spinner to submit button
      const submitButton = this.$refs["login_company"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");

      // set loading state
      this.is_loading = true;

      await this.$store.dispatch(LOGIN, {
        email: this.form.email,
        password: this.form.password,
        company_id: this.form.company
      });

      if (this.error) {
        submitButton.classList.remove("spinner", "spinner-light", "spinner-right");
        this.dialog = false;
        this.toastMsg("error", this.error);
      } else {
        await this.$router.replace("/dashboard");
      }
      this.is_loading = false;
    },
    onLanguageChanged() {
      this.languageFlag = this.languages.find(val => {
        return val.lang === i18nService.getActiveLanguage();
      }).lang;
    },
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h("div", { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] }, [
        h("strong", { class: "mr-2" }, type === "error" ? "Error" : this.$t("title.notice"))
      ]);
      const vNodesMsg = h("h5", { class: ["mb-0"] }, [h("strong", msg)]);
      this.$bvToast.toast([vNodesMsg], {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        toaster: "b-toaster-top-center",
        autoHideDelay: 5000,
        solid: true
      });
      this.$store.commit(SET_ERROR, null);
    },
    toggleVisible() {
      if (this.visible === "password") {
        this.visible = "text";
      } else {
        this.visible = "password";
      }
    }
  },
  computed: {
    ...mapState({
      error: state => state.auth.error,
      toast: state => state.auth.toast,
      companies: state => state.auth.companies
    }),
    getLanguageFlag() {
      return this.onLanguageChanged();
    }
  }
};
</script>
