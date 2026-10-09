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
    <!--end::Content header-->

    <!--begin::Signup-->
    <div class="login-form login-signin mt-35" style="width: 50rem">
      <div class="text-center">
        <h3 class="font-size-h1">{{ $t("register.welcome") }}</h3>
      </div>
      <div class="mb-10 mb-lg-10">
        <p class="text-muted font-weight-semi-bold">
          {{ $t("register.desc") }}
        </p>
      </div>

      <!--begin::Form-->
      <b-form class="form" @submit.stop.prevent="onSubmit">
        <b-form-group
          id="company-input-group"
          label=""
          label-for="company-input"
        >
          <b-form-input
            class="form-control h-auto"
            id="company-input"
            name="company-input"
            v-model="form.company"
            :state="validateState('company')"
            aria-describedby="company-feedback"
            :placeholder="`${$t('register.company')}`"
          ></b-form-input>

          <b-form-invalid-feedback id="company-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group id="email-input-group" label="" label-for="email-input">
          <b-form-input
            class="form-control h-auto"
            id="email-input"
            name="email-input"
            v-model="form.email"
            :state="validateState('email')"
            aria-describedby="email-feedback"
            :placeholder="`${$t('register.mail')}`"
          ></b-form-input>

          <b-form-invalid-feedback id="email-feedback">
            {{ $t("msg.required") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-select
          v-model="form.currency"
          :options="currencies"
          class="form-control h-auto"
        ></b-form-select>

        <div class="mt-4 font-weight-bolder">{{ $t("register.vat") }}</div>
        <b-form-checkbox
          class="visible-box mt-2"
          :checked="form.vat_active === true"
          @change="form.vat_active = !form.vat_active"
          >{{ $t("register.vatDesc") }}</b-form-checkbox
        >

        <div class="mt-4 font-weight-bolder">{{ $t("register.template") }}</div>
        <b-form-checkbox
          class="visible-box mt-2"
          :checked="form.architecture_template === true"
          @change="form.architecture_template = !form.architecture_template"
          >{{ $t("register.templateDesc") }}</b-form-checkbox
        >

        <div class="mt-4 font-weight-bolder">{{ $t("register.term") }}</div>
        <b-form-group id="term-input-group">
          <b-form-checkbox
            id="term-checkbox"
            class="visible-box mt-2"
            :checked="form.accept_term === true"
            :state="validateState('accept_term')"
            aria-describedby="term-feedback"
            @change="form.accept_term = !form.accept_term"
            >{{ $t("register.termDesc") }}</b-form-checkbox
          >

          <b-form-invalid-feedback id="term-feedback">
            {{ $t("msg.agreeTerm") }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!--begin::Action-->
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
            @click="$router.push('login')"
          >
            {{ $t("button.back") }}
          </button>
          <button
            type="submit"
            ref="kt_login_signup_submit"
            :disabled="is_loading"
            class="
              btn btn-primary
              font-weight-bold
              px-9
              py-4
              my-3
              font-size-3
              mx-4
            "
          >
            {{ $t("button.register") }}
          </button>
        </div>
        <!--end::Action-->
      </b-form>
      <!--end::Form-->
    </div>
    <!--end::Signup-->
    <!-- Success Dialog -->
    <b-modal
      v-model="success_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.announce')}`"
      @close="resetForm"
    >
      <div>{{ $t("msg.registerSuccess") }}</div>
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
  </div>
</template>

<style lang="scss" scoped>
.spinner.spinner-right {
  padding-right: 3.5rem !important;
}
</style>

<script>
import { validationMixin } from "vuelidate";
import { email, required, sameAs } from "vuelidate/lib/validators";
import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import i18nService from "@/core/services/i18n.service.js";
import { mapState } from "vuex";
import {
  REGISTER,
  CLEAR_LOGIN,
  SET_ERROR
} from "@/core/services/store/auth.module";

export default {
  mixins: [validationMixin],
  name: "register",
  components: {
    KTDropdownLanguage
  },
  metaInfo: {
    title: "Register",
    meta: [
      { hid: "description", name: "description", content: "Register Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Register | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Register | Archapp"
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
        company: "",
        email: "",
        currency: "CHF",
        vat_active: true,
        architecture_template: false,
        accept_term: false
      },
      currencies: ["CHF", "EUR", "USD"],
      languageFlag: "",
      languages: i18nService.languages,
      success_dialog: false,
      is_loading: false,
    };
  },
  validations: {
    form: {
      company: {
        required
      },
      email: {
        required,
        email
      },
      accept_term: {
        sameAs: sameAs(() => true)
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
        company: "",
        email: "",
        currency: "CHF",
        vat_active: false,
        architecture_template: false,
        accept_term: false
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
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      // clear existing errors
      this.$store.dispatch(CLEAR_LOGIN);
      // set spinner to submit button
      const submitButton = this.$refs["kt_login_signup_submit"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");
      await this.$store.dispatch(REGISTER, {
        company: this.form.company,
        email: this.form.email,
        currency: this.form.currency,
        vat_active: this.form.vat_active,
        architecture_template: this.form.architecture_template,
        accept_term: this.form.accept_term,
        language: this.currentLanguage
      });
      submitButton.classList.remove(
        "spinner",
        "spinner-light",
        "spinner-right"
      );
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.success_dialog = true;
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
      error: state => state.auth.error
    }),
    getLanguageFlag() {
      return this.onLanguageChanged();
    },
    currentLanguage() {
      return i18nService.getActiveLanguage();
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
