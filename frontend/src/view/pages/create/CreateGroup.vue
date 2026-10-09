<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.createGroup") }}</h3>
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
                {{ $t("product.gname") }}
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
              <b-form-textarea v-model="form.description" rows="6"></b-form-textarea>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.included") }}
              </div>
            </div>
            <div v-for="(item, i) in selected" :key="i" class="col-md-12 mb-2" style="display: flex">
              <div class="col-md-6 action-start">
                <b-button variant="primary" class="minus-btn mr-2" size="sm" @click="removeProduct(i)">
                  <i class="flaticon2-line p-0"></i>
                </b-button>
                <div class="subtitle-1 ml-2">
                  {{ item.name }}
                </div>
              </div>
              <div class="col-md-6 action-start">
                <b-form-input
                  :id="`product_amount_${i}`"
                  class="amount-input"
                  size="sm"
                  v-model="selected[i].amount"
                  @change="setProductAmount(i)"
                ></b-form-input>
                <div class="subtitle-1 ml-2">
                  {{ $t(item.unit.name) }}
                </div>
              </div>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("product.allServices") }}
              </div>
            </div>
            <div class="col-md-3">
              <b-form-select
                v-model="folder"
                :options="folders"
                text-field="name"
                value-field="name"
                @change="initData"
              ></b-form-select>
            </div>
            <div v-for="(item, i) in products" :key="i" class="col-md-12 mt-4 mb-2">
              <div class="col-md-6 action-start" v-show="item.display">
                <b-button variant="primary" class="plus-btn" size="sm" @click="addProduct(i)">
                  <i class="flaticon2-plus p-0"></i>
                </b-button>
                <div class="subtitle-1 ml-2">
                  {{ item.name }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 action">
            <b-button variant="primary" class="save-btn" type="submit" :disabled="loading">
              <i class="flaticon2-check-mark p-0 mr-2"></i>
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
import { required } from "vuelidate/lib/validators";
import { GET_PRODUCTS, ADD_GROUP, SET_PRODUCT_TOAST, SET_PRODUCT_ERROR } from "@/core/services/store/product";
import { GET_SETTINGS } from "@/core/services/store/settings";
import { mapGetters, mapState } from "vuex";

export default {
  name: "createGroup",
  mixins: [validationMixin],
  metaInfo: {
    title: "Create Product Group",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Create Product Group Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Create Product Group | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Create Product Group | Archapp"
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
        description: ""
      },
      products: [],
      selected: [],
      folders: [],
      folder: "",
      loading: true
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
    ...mapGetters(["currentProducts", "currentSettings"]),
    ...mapState({
      error: state => state.product.error
    })
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    this.folders = this.currentSettings.product?.folders;
    this.folder = this.folders[0]?.name;
    await this.initData();
    this.loading = !this.loading;
  },
  methods: {
    async initData() {
      this.products = [];
      await this.$store.dispatch(GET_PRODUCTS, { folder: this.folder });

      if (this.currentProducts) {
        for (const record of this.currentProducts) {
          const item = {
            id: record.id,
            name: record.name,
            description: record.description,
            unit: record.unit,
            vat_rate: record.vat_rate,
            price: record.price,
            amount: 1.0,
            display: true
          };
          this.products.push(item);
        }
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
      await this.$store.dispatch(ADD_GROUP, {
        name: this.form.name,
        description: this.form.description,
        products: this.selected
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_PRODUCT_TOAST, {
          type: "success",
          msg: this.$t("msg.addSuccess")
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
    back() {
      window.history.back();
    },
    addProduct(id) {
      for (let index = 0; index < this.products.length; index++) {
        const element = this.products[index];
        if (index === id) {
          this.selected.push(element);
          element.display = false;
        }
      }
    },
    removeProduct(id) {
      for (let i = 0; i < this.selected.length; i++) {
        const element = this.selected[i];
        if (i === id) {
          this.selected.splice(id, 1);
          for (let j = 0; j < this.products.length; j++) {
            const product = this.products[j];
            if (element.name === product.name) {
              product.display = true;
            }
          }
        }
      }
    },
    setProductAmount(id) {
      const item = document.getElementById(`product_amount_${id}`);
      for (let index = 0; index < this.selected.length; index++) {
        const element = this.selected[index];
        if (index === id) {
          element.amount = parseFloat(item.value);
        }
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

.action-start {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.amount-input {
  width: 20%;
  text-align: right;
}
</style>
