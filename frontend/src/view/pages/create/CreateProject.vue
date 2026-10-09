<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.createProject") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="subtitle-1 font-weight-bolder mb-2">
            {{ $t("project.customer") }}
          </div>
          <CustomerSelect />

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.project") }}
              </div>
              <b-form-group label-for="project-input">
                <b-form-input
                  id="project-input"
                  name="project-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="project-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="project-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.assignee") }}
              </div>
              <b-form-select
                v-model="form.assignee"
                :options="currentUsers"
                value-field="id"
                text-field="email"
              ></b-form-select>
            </div>
          </div>

          <div class="row">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.location") }}
              </div>
              <b-form-input v-model="form.location"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.date") }}
              </div>
              <b-input-group>
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
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.number") }}
              </div>
              <b-form-input v-model="form.number"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.completion") }}
              </div>
              <b-input-group>
                <b-form-input
                  v-model="form.end_on_formatted"
                  type="text"
                  autocomplete="off"
                  @blur="formatEndDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.end_on"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    @context="formatEndDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.hourRate") }}
              </div>
              <b-form-input v-model="form.rate_per_hour"></b-form-input>
            </div>
          </div>

          <div v-if="currentSettings.master_data.allow_to_use_other_currencies" class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("settings.form.master.currency") }}:</div>
              <b-form-select
                v-model="form.currency_val"
                :options="currentSettings.master_data.currencies"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">Anschrift</div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.address" />
            </div>
          </div>

          <div class="row">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                1. Rahmenbedingungen
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.begin_desc" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.pr_begin_break"
                @change="form.pr_begin_break = !form.pr_begin_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
            <div class="col-md-12 mt-2">
              <QuoteItems
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
                :currency="form.currency_val"
              />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.pr_quote_break"
                @change="form.pr_quote_break = !form.pr_quote_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
            <div class="col-md-12 mt-4">
              <AdditionalCosts
                :currency="form.currency_val"
                :active-generate="false"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                2. Ende des Textes
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.end_desc" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("project.internalDesc") }}:</div>
              <InternalDesc />
              <b-form-textarea v-model="form.internal_desc_custom" rows="3"></b-form-textarea>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <b-form-checkbox class="break-box" :checked="form.internal" @change="form.internal = !form.internal">{{
                $t("button.internal")
              }}</b-form-checkbox>
              <b-form-checkbox
                class="break-box"
                :checked="form.only_my_company"
                @change="form.only_my_company = !form.only_my_company"
                >{{ $t("button.myCompanyOnly") }}</b-form-checkbox
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 action">
            <b-button variant="primary" class="save-btn" type="submit" :disabled="submitting">
              <b-spinner small v-if="submitting" class="mr-2"></b-spinner>
              <i v-else class="flaticon2-check-mark p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import currency from "currency.js";
import { required } from "vuelidate/lib/validators";
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import TextEditor from "@/view/content/TextEditor.vue";
import CustomerSelect from "@/view/content/selector/CustomerDialog.vue";
import QuoteItems from "@/view/content/selector/QuoteItems.vue";
import AdditionalCosts from "@/view/content/selector/AdditionalCosts.vue";
import InternalDesc from "@/view/content/selector/InternalDesc.vue";
import { mapGetters, mapState } from "vuex";
import { RESET_ITEM } from "@/core/services/store/product";
import { RESET_CUSTOMER } from "@/core/services/store/customer";
import { GET_SETTINGS, GET_COMPANY, GET_USERS } from "@/core/services/store/settings";
import { ADD_PROJECT, SET_PROJECT_TOAST, SET_PROJECT_ERROR } from "@/core/services/store/project";
import { SET_KM, SET_KMOPTIONS, SET_ADDCOSTS, SET_ADDITIONAL_TOTAL } from "@/core/services/store/offer";
import { formatDate } from "@/common";

export default {
  name: "createProject",
  mixins: [validationMixin],
  metaInfo: {
    title: "Create Project",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Create Project Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Create Project | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Create Project | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  components: {
    TextEditor,
    CustomerSelect,
    QuoteItems,
    AdditionalCosts,
    InternalDesc
  },
  data() {
    return {
      form: {
        currency_val: "",
        name: "",
        assignee: "",
        location: "",
        date: "",
        date_formatted: "",
        end_on: "",
        end_on_formatted: "",
        number: "",
        address: "",
        begin_desc: "",
        end_desc: "",
        internal_desc_custom: "",
        rate_per_hour: 125.0,
        pr_begin_break: false,
        pr_quote_break: false,
        internal: false,
        only_my_company: false
      },
      locale: "de",
      loading: true,
      submitting: false
    };
  },
  validations: {
    form: {
      name: {
        required
      }
    }
  },
  computed: {
    ...mapGetters([
      "currentSettings",
      "currentCompany",
      "currentUsers",
      "selectedCustomer",
      "quoteItems",
      "discountPercent",
      "currentInternalChoices",
      "selectedKm",
      "selectedAddCost",
      "detailCost",
      "additionalPercent"
    ]),
    ...mapState({
      error: state => state.project.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_USERS);
    this.$store.commit(RESET_ITEM);
    this.$store.commit(RESET_CUSTOMER);
    this.form.date = moment().format("YYYY-MM-DD");
    this.form.date_formatted = moment().format("DD.MM.YYYY");
    this.form.end_on = moment().format("YYYY-MM-DD");
    this.form.end_on_formatted = moment().format("DD.MM.YYYY");
    this.initData();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.loading = !this.loading;
  },
  methods: {
    initData() {
      this.form.address = this.currentSettings.project.address;
      this.form.begin_desc = this.currentSettings.project.begin_desc;
      this.form.end_desc = this.currentSettings.project.end_desc;
      this.form.assignee = this.currentUsers[0].id;
      this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
      this.$store.commit(SET_KM, this.currentSettings.offer.km_dropdown_setting[0]);
      const add_cost = [];
      for (const record of this.currentSettings.offer.add_cost_setting) {
        const item = {
          label: record.label,
          value: record.value,
          is_active: false
        };
        add_cost.push(item);
      }
      this.$store.commit(SET_ADDCOSTS, add_cost);
      if (!this.currentSettings.master_data.allow_to_use_other_currencies) {
        this.form.currency_val = this.currentCompany.currency;
      } else {
        this.form.currency_val = this.currentSettings.master_data.currencies[0];
      }
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      if (this.submitting) return;
      this.submitting = true;

      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        this.scrollToError();
        this.submitting = false;
        return;
      }

      let selected_assignee = {};
      for (const user of this.currentUsers) {
        if (user.id === this.form.assignee) {
          selected_assignee = user;
          break;
        }
      }

      try {
        if (this.selectedCustomer.first_name || this.selectedCustomer.company) {
          await this.$store.dispatch(ADD_PROJECT, {
            name: this.form.name,
            location: this.form.location,
            date: this.form.date,
            end_on: this.form.end_on,
            assignee: selected_assignee,
            number: this.form.number,
            address: this.form.address,
            begin_desc: this.form.begin_desc,
            end_desc: this.form.end_desc,
            internal_desc: this.currentInternalChoices,
            internal_desc_custom: this.form.internal_desc_custom,
            customer: this.selectedCustomer,
            quote_items: this.quoteItems,
            discount_percent: this.discountPercent,
            pr_begin_break: this.form.pr_begin_break,
            pr_quote_break: this.form.pr_quote_break,
            is_internal: this.form.internal,
            only_my_company: this.form.only_my_company,
            currency: this.form.currency_val,
            km_dropdown: this.selectedKm,
            additional_cost: this.selectedAddCost,
            rate_per_hour: parseFloat(this.form.rate_per_hour)
          });

          if (this.error) {
            this.toastMsg("error", this.error);
            this.submitting = false;
          } else {
            this.$store.commit(SET_PROJECT_TOAST, {
              type: "success",
              msg: this.$t("msg.addSuccess")
            });
            this.$router.push("/project");
          }
        } else {
          this.toastMsg("error", this.$t("msg.noCustomer"));
          this.submitting = false;
        }
      } catch (error) {
        this.submitting = false;
        this.toastMsg("error", error.message);
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
    formatMoney(val, increment = 0) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: increment
      }).format();
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
    formatEndDate() {
      if (this.form.end_on) {
        this.form.end_on_formatted = moment(this.form.end_on).format("DD.MM.YYYY");
      }
    },
    formatEndDateInvert() {
      if (this.form.end_on_formatted) {
        const split = this.form.end_on_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.end_on = join;
      }
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
      this.$store.commit(SET_PROJECT_ERROR, null);
    },
    scrollToError() {
      var checkExist = setInterval(function() {
        const el = document.getElementsByClassName("is-invalid").item(0);
        if (el) {
          const headerOffset = 65;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          clearInterval(checkExist);
        }
      }, 100);
    },
    persistAdditionalCost() {
      this.$store.commit(SET_ADDITIONAL_TOTAL, parseFloat((this.detailCost.total_net * this.additionalPercent) / 100));
      const nkTotal = (this.detailCost.total_net * this.additionalPercent) / 100;
      for (let index = 0; index < this.quoteItems.length; index++) {
        const element = this.quoteItems[index];
        if (element.is_nk) {
          this.quoteItems[index].name = "Nebenkosten " + this.additionalPercent + "%";
          this.quoteItems[index].description =
            "der Total Honorarsumme von " +
            this.currentCompany.currency +
            " " +
            this.formatMoney(this.detailCost.total_net, 0.05);
          this.quoteItems[index].price = this.quoteItems[index].cost = Math.round(nkTotal / 0.05, 0) * 0.05;
          break;
        }
      }
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

.spacer {
  height: 1px;
  background-color: #999999;
  opacity: 30%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.editor {
  height: 25rem;
}

.editor > div {
  height: 20rem;
}
</style>
