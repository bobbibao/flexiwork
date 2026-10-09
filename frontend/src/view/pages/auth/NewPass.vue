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
        {{ $t("login.noAcc") }}
      </span>
      <router-link
        class="font-weight-bold font-size-3 ml-2"
        :to="{ name: 'register' }"
      >
        {{ $t("button.register") }}!
      </router-link>
    </div>

    <div class="login-form login-signin" style="width: 40rem">
      <div class="text-center mb-10 mb-lg-20">
        <h3 class="font-size-h1">{{ $t("title.forgotPass") }}</h3>
        <p class="text-muted font-weight-semi-bold">
          {{ $t("verifyRegister.remind") }}
        </p>
      </div>

      <b-form class="form" @submit.stop.prevent="onSubmit">
        <b-form-group
          id="password-input-group"
          label=""
          label-for="password-input"
        >
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              id="password-input"
              name="password-input"
              v-model="form.password"
              :type="visible"
              :state="validateState('password')"
              :placeholder="`${$t('verifyRegister.password')}`"
              aria-describedby="password-feedback"
            ></b-form-input>

            <b-input-group-append is-text @click="toggleVisible('new')">
              <i
                class="flaticon-eye"
                :class="visible === 'text' ? 'visible' : ''"
              ></i>
            </b-input-group-append>

            <b-form-invalid-feedback id="password-feedback">
              {{ $t("msg.required") }}
            </b-form-invalid-feedback>
          </b-input-group>
        </b-form-group>

        <b-form-group id="repeat-input-group" label="" label-for="repeat-input">
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              id="repeat-input"
              name="repeat-input"
              v-model="form.repeat_password"
              :type="repeat_visible"
              :state="validateState('repeat_password')"
              :placeholder="`${$t('verifyRegister.repeatPassword')}`"
              aria-describedby="repeat-feedback"
            ></b-form-input>

            <b-input-group-append is-text @click="toggleVisible('repeat')">
              <i
                class="flaticon-eye"
                :class="repeat_visible === 'text' ? 'visible' : ''"
              ></i>
            </b-input-group-append>

            <b-form-invalid-feedback id="repeat-feedback">
              {{ $t("msg.required") }}
            </b-form-invalid-feedback>
          </b-input-group>
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
            ref="kt_reset_submit"
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
            {{ $t("button.confirm") }}
          </button>
        </div>
      </b-form>
    </div>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required, minLength, sameAs } from "vuelidate/lib/validators";
import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import i18nService from "@/core/services/i18n.service.js";
import { mapState } from "vuex";
import {
  NEW_PASS,
  CLEAR_LOGIN,
  SET_TOAST,
  SET_ERROR
} from "@/core/services/store/auth.module";

export default {
  mixins: [validationMixin],
  name: "newPass",
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
        password: "",
        repeat_password: ""
      },
      visible: "password",
      repeat_visible: "password",
      languageFlag: "",
      languages: i18nService.languages,
      is_loading: false,
    };
  },
  validations: {
    form: {
      password: {
        required,
        minLength: minLength(8)
      },
      repeat_password: {
        required,
        minLength: minLength(8),
        sameAsPassword: sameAs("password")
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
        password: "",
        repeat_password: ""
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
      await this.$store.dispatch(NEW_PASS, {
        code: this.$route.params.slug,
        data: {
          password: this.form.password,
          confirm_password: this.form.repeat_password
        }
      });
      submitButton.classList.remove(
        "spinner",
        "spinner-light",
        "spinner-right"
      );
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_TOAST, {
          type: "success",
          msg: this.$t("msg.activateSuccess")
        });
        await this.$router.push("/login");
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
    },
    toggleVisible(type) {
      if (type === "new") {
        if (this.visible === "password") {
          this.visible = "text";
        } else {
          this.visible = "password";
        }
      } else {
        if (this.repeat_visible === "password") {
          this.repeat_visible = "text";
        } else {
          this.repeat_visible = "password";
        }
      }
    }
  },
  computed: {
    ...mapState({
      error: state => state.auth.error
    }),
    getLanguageFlag() {
      return this.onLanguageChanged();
    }
  }
};
</script>

<style scoped>
.visible {
  color: #3699ff;
}
</style>
