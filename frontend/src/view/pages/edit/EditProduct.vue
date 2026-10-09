<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.editProduct") }}</h3>
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
                {{ $t("product.name") }}
              </div>
              <b-form-group label-for="name-input">
                <b-form-input
                  id="name-input"
                  name="name-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="name-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="name-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.desc") }}
              </div>
              <b-form-textarea
                v-model="form.description"
                rows="6"
              ></b-form-textarea>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.folder") }}
              </div>
              <b-form-select
                v-model="form.folder"
                :options="folders"
                text-field="name"
                value-field="name"
              ></b-form-select>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.price") }}
              </div>
              <b-form-group label-for="price-input">
                <b-form-input
                  id="price-input"
                  name="price-input"
                  v-model="form.price"
                  :state="validateState('price')"
                  aria-describedby="price-feedback"
                  @change="formatMoney"
                ></b-form-input>

                <b-form-invalid-feedback id="price-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.unit") }}
              </div>
              <b-form-select
                v-model="form.unit"
                :options="units"
                text-field="name"
                value-field="id"
              ></b-form-select>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.rate") }}
              </div>
              <b-form-select
                v-model="form.vat_rate"
                :options="vat"
                text-field="rate"
                value-field="id"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.task") }}
              </div>
            </div>
            <!-- Task List -->
            <div
              v-for="(item, i) in form.task_list"
              :key="i"
              class="col-md-12 p-0 mb-2"
              style="display: flex"
            >
              <div class="col-md-4">
                <b-form-input
                  :id="`task-${i}`"
                  class="task-input"
                  :value="item.name"
                  @change="setTask(i)"
                ></b-form-input>
              </div>
              <div class="col-md-4">
                <b-button
                  variant="primary"
                  class="minus-btn mr-2"
                  @click="removeTask(i)"
                >
                  <i class="flaticon2-line p-0"></i>
                </b-button>
                <b-button variant="primary" class="plus-btn" @click="addTask">
                  <i class="flaticon2-plus p-0"></i>
                </b-button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6">
            <b-button
              variant="danger"
              class="del-btn mr-2"
              @click="remove_dialog = true"
            >
              <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
              <span>{{ $t("button.delete") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="save-btn"
              type="submit"
              style="float: right"
              :disabled="loading"
            >
              <i class="flaticon2-check-mark p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal
      v-model="remove_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.confirm')}`"
    >
      <div>{{ $t("msg.delProduct") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="remove" :disabled="loading">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";
import currency from "currency.js";
import { mapGetters, mapState } from "vuex";
import {
  GET_UNITS,
  GET_VAT,
  GET_SETTINGS
} from "@/core/services/store/settings";
import {
  GET_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  SET_PRODUCT_TOAST,
  SET_PRODUCT_ID,
  SET_PRODUCT_ERROR
} from "@/core/services/store/product";

export default {
  name: "editProduct",
  mixins: [validationMixin],
  metaInfo: {
    title: "Edit Product",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Edit Product Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Edit Product | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Edit Product | Archapp"
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
        name: "",
        description: "",
        price: 0.0,
        price_origin: 0.0,
        unit: "",
        vat_rate: "",
        folder: "",
        task_list: []
      },
      units: [],
      vat: [],
      folders: [],
      remove_dialog: false,
      loading: true
    };
  },
  validations: {
    form: {
      name: {
        required
      },
      price: {
        required
      }
    }
  },
  computed: {
    ...mapGetters([
      "currentUnits",
      "currentVatRates",
      "currentProduct",
      "currentSettings"
    ]),
    ...mapState({
      error: state => state.product.error,
      id: state => state.product.product_id
    })
  },
  async mounted() {
    this.$store.commit(SET_PRODUCT_ID, this.$route.params.product_id);
    await this.$store.dispatch(GET_PRODUCT, { id: this.id });
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_UNITS);
    await this.$store.dispatch(GET_VAT);
    this.initData();
    this.loading = !this.loading;
  },
  methods: {
    initData() {
      for (const unit of this.currentUnits) {
        const item = {
          id: unit.id,
          name: unit.description.includes("unit.")
            ? this.$t(unit.description.toString())
            : unit.description,
          value: unit.description
        };
        this.units.push(item);
      }
      for (const vat of this.currentVatRates) {
        const item = {
          id: vat.id,
          rate: vat.rate
        };
        this.vat.push(item);
      }
      this.folders = this.currentSettings.product?.folders;

      this.form.name = this.currentProduct.name;
      this.form.description = this.currentProduct.description;
      this.form.price = currency(this.currentProduct.price, {
        separator: "'",
        pattern: `#`
      }).format();
      this.form.price_origin = this.currentProduct.price;
      this.form.unit = this.currentProduct.unit.id;
      this.form.vat_rate = this.currentProduct.vat_rate.id;
      this.form.folder = this.currentProduct.folder;
      if (this.currentProduct.task_list) {
        this.form.task_list = this.currentProduct.task_list;
      } else {
        this.addTask();
      }
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }
      if (this.loading) {
        return;
      }
      this.loading = true;

      let selected_unit = {};
      let selected_vat = {};
      for (const item of this.units) {
        if (this.form.unit === item.id) {
          selected_unit = item;
        }
      }
      for (const item of this.vat) {
        if (this.form.vat_rate === item.id) {
          selected_vat = item;
        }
      }

      await this.$store.dispatch(UPDATE_PRODUCT, {
        id: this.id,
        data: {
          name: this.form.name,
          description: this.form.description,
          price: parseFloat(this.form.price_origin),
          unit: selected_unit,
          vat_rate: selected_vat,
          task_list: this.form.task_list,
          folder: this.form.folder
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_PRODUCT_TOAST, {
          type: "success",
          msg: this.$t("msg.updateSuccess")
        });
        await this.$router.push("/product");
      }
      this.loading = false;
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async remove() {
      this.loading = true;
      await this.$store.dispatch(DELETE_PRODUCT, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_PRODUCT_TOAST, {
          type: "success",
          msg: this.$t("msg.delSuccess")
        });
        await this.$router.push("/product");
      }
      this.loading = false;
    },
    addTask() {
      const item = { name: "" };
      this.form.task_list.push(item);
    },
    removeTask(index) {
      if (this.form.task_list.length > 1) {
        this.form.task_list.splice(index, 1);
      }
    },
    setTask(i) {
      const el = document.getElementById(`task-${i}`);
      for (let index = 0; index < this.form.task_list.length; index++) {
        let element = this.form.task_list[index];
        if (i === index) {
          element.name = el.value;
        }
      }
    },
    back() {
      window.history.back();
    },
    formatMoney(e) {
      this.form.price = currency(e, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
      this.form.price_origin = e;
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
      this.$store.commit(SET_PRODUCT_ERROR, null);
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
