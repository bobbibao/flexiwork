<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.createExpense") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="row">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.recipient") }}
              </div>
              <b-form-group label-for="recipient-input">
                <b-form-input
                  id="recipient-input"
                  name="recipient-input"
                  v-model="form.recipient"
                  :state="validateState('recipient')"
                  aria-describedby="recipient-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="recipient-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.amount") }} in {{ currentCompany.currency }}
              </div>
              <b-form-input v-model="form.amount" @change="formatMoney"></b-form-input>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.date") }}
              </div>
              <b-input-group class="mb-2">
                <b-form-input
                  v-model="form.date_formatted"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  @blur="formatDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    @context="formatDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.paymentRef") }}
              </div>
              <b-form-group label-for="payment-ref-input">
                <b-form-input
                  id="payment-ref-input"
                  name="payment-ref-input"
                  v-model="form.payment_ref"
                  :state="validateState('payment_ref')"
                  aria-describedby="payment-ref-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="payment-ref-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.comment") }}
              </div>
              <b-form-textarea v-model="form.comment" rows="6"></b-form-textarea>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("expense.upload") }}
              </div>
              <b-form-file
                v-model="form.file"
                :placeholder="`${$t('msg.selectFile')}`"
                :drop-placeholder="`${$t('msg.dropFile')}`"
                accept="image/*,.pdf"
              ></b-form-file>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 action">
            <b-button variant="primary" class="save-btn" type="submit" :disabled="submitLoading">
              <b-spinner small v-if="submitLoading"></b-spinner>
              <template v-else>
                <i class="flaticon2-check-mark p-0 mr-2"></i>
                <span>{{ $t("button.save") }}</span>
              </template>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";
import moment from "moment";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";
import { mapGetters, mapState } from "vuex";
import { GET_COMPANY } from "@/core/services/store/settings";
import { ADD_EXPENSE, SET_EXPENSE_TOAST, SET_EXPENSE_ERROR } from "@/core/services/store/expense";
import { formatDate } from "@/common";

export default {
  name: "createExpense",
  mixins: [validationMixin],
  metaInfo: {
    title: "Create Expense",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Create Expense Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Create Expense | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Create Expense | Archapp"
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
        recipient: "",
        amount: 0.0,
        amount_origin: 0.0,
        date: "",
        date_formatted: "",
        payment_ref: "",
        comment: "",
        file: null
      },
      locale: "de",
      loading: true,
      submitLoading: false // Add this line
    };
  },
  validations: {
    form: {
      recipient: {
        required
      },
      payment_ref: {
        required
      }
    }
  },
  computed: {
    ...mapGetters(["currentCompany"]),
    ...mapState({
      error: state => state.expense.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    this.form.date = moment().format("YYYY-MM-DD");
    this.form.date_formatted = moment().format("DD.MM.YYYY");
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.loading = !this.loading;
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

      this.submitLoading = true;
      try {
        await this.$store.dispatch(ADD_EXPENSE, {
          recipient: this.form.recipient,
          payment_ref: this.form.payment_ref,
          date: this.form.date,
          amount: parseFloat(this.form.amount_origin),
          comment: this.form.comment,
          file: this.form.file
        });

        if (this.error) {
          this.toastMsg("error", this.error);
          this.submitLoading = false;
        } else {
          this.$store.commit(SET_EXPENSE_TOAST, {
            type: "success",
            msg: this.$t("msg.addSuccess")
          });
          await this.$router.push("/expense");
          this.submitLoading = false;
        }
      } catch (error) {
        this.submitLoading = false;
      }
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    back() {
      window.history.back();
    },
    formatDate() {
      if (this.form.date) {
        this.form.date_formatted = formatDate(this.form.date);
      }
    },
    formatDateInvert() {
      if (this.form.date_formatted) {
        const split = this.form.date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.date = join;
      }
    },
    formatMoney(e) {
      this.form.amount = currency(e, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
      this.form.amount_origin = e;
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
      this.$store.commit(SET_EXPENSE_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action-icon:hover {
  color: #3699ff;
}

.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
