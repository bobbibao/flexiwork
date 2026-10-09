<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.editAddress") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="row">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.category") }}
              </div>
              <b-form-select
                v-model="form.category"
                :options="categories"
                value-field="code"
                text-field="name"
              ></b-form-select>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.type") }}
              </div>
              <b-form-select v-model="form.type" :options="types" value-field="code" text-field="name"></b-form-select>
            </div>
          </div>

          <div v-if="form.type === 'company'" class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.company") }}
              </div>
              <b-form-group label-for="company-input">
                <b-form-input
                  id="company-input"
                  name="company-input"
                  v-model="form.company"
                  :state="validateState('company')"
                  aria-describedby="company-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="company-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>
          <div v-else class="row mt-4">
            <div class="col-md-4">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.title") }}
              </div>
              <b-form-select
                v-model="form.title"
                :options="titles"
                value-field="code"
                text-field="name"
              ></b-form-select>
            </div>
            <div class="col-md-4">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.firstName") }}
              </div>
              <b-form-group label-for="fname-input">
                <b-form-input
                  id="fname-input"
                  name="fname-input"
                  v-model="form.first_name"
                  :state="validateState('first_name')"
                  aria-describedby="fname-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="fname-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.lastName") }}
              </div>
              <b-form-group label-for="lname-input">
                <b-form-input
                  id="lname-input"
                  name="lname-input"
                  v-model="form.last_name"
                  :state="validateState('last_name')"
                  aria-describedby="lname-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="lname-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.address") }}
              </div>
              <b-form-input v-model="form.address"></b-form-input>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.otheradr") }}
              </div>
              <b-form-input v-model="form.other_address"></b-form-input>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.phone") }}
              </div>
              <b-form-input v-model="form.phone" @change="formatPhone"></b-form-input>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.postcode") }}
              </div>
              <b-form-group label-for="postcode-input">
                <b-form-input
                  id="postcode-input"
                  name="postcode-input"
                  v-model="form.postcode"
                  :state="validateState('postcode')"
                  aria-describedby="postcode-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="postcode-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.fax") }}
              </div>
              <b-form-input v-model="form.fax" @change="formatFax"></b-form-input>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.place") }}
              </div>
              <b-form-group label-for="place-input">
                <b-form-input
                  id="place-input"
                  name="place-input"
                  v-model="form.place"
                  :state="validateState('place')"
                  aria-describedby="place-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="place-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.mail") }}
              </div>
              <b-form-group label-for="mail-input">
                <b-form-input
                  id="mail-input"
                  name="mail-input"
                  v-model="form.email"
                  :state="validateMail"
                  aria-describedby="mail-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="mail-feedback">
                  {{ $t("msg.invalidMail") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.country") }}
              </div>
              <b-form-select
                v-model="form.country"
                :options="countries"
                value-field="code"
                text-field="name"
              ></b-form-select>
            </div>
            <div class="col-md-6">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.web") }}
              </div>
              <b-form-input v-model="form.web"></b-form-input>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("address.comment") }}
              </div>
              <b-form-input v-model="form.comment"></b-form-input>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6">
            <b-button variant="danger" class="del-btn mr-2" @click="remove_dialog = true">
              <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
              <span>{{ $t("button.delete") }}</span>
            </b-button>
            <b-button variant="primary" class="download-btn" @click="downloadCustomer">
              <i class="flaticon2-download p-0 mr-2"></i>
              <span>{{ $t("button.download") }}</span>
            </b-button>
            <b-button variant="primary" class="save-btn" style="float: right" type="submit" :disabled="saving">
              <b-spinner small v-if="saving"></b-spinner>
              <i v-else class="flaticon2-check-mark p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
            <div class="spacer"></div>

            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.contact") }}
            </div>
            <!-- Contact list -->
            <div v-for="(item, i) in contacts" :key="i" class="row mb-2">
              <div class="col-md-3">
                <div class="contact" @click="editContact(item.id)">
                  <div class="font-weight-bolder">{{ item.name }}, {{ item.given_name }}</div>
                </div>
              </div>
            </div>
            <!-- Action -->
            <b-button variant="primary" class="contact-btn" @click="(dialog = true), resetForm()">
              <i class="flaticon2-plus p-0"></i>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>

    <!-- Contact Dialog -->
    <b-modal v-model="dialog" hide-footer no-close-on-backdrop title="Contact">
      <b-form @submit.stop.prevent="onSubmitContact">
        <div class="row">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.title") }}
            </div>
            <b-form-select
              v-model="contact.title"
              :options="titles"
              value-field="code"
              text-field="name"
            ></b-form-select>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.title") }}
            </div>
            <b-form-input v-model="contact.title_input"></b-form-input>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.contactName") }}
            </div>
            <b-form-group label-for="contact-name-input">
              <b-form-input
                id="contact-name-input"
                name="contact-name-input"
                v-model="contact.name"
                :state="validateStateContact('name')"
                aria-describedby="contact-name-feedback"
              ></b-form-input>

              <b-form-invalid-feedback id="contact-name-feedback">
                {{ $t("msg.required") }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.givenName") }}
            </div>
            <b-form-group label-for="contact-gname-input">
              <b-form-input
                id="contact-gname-input"
                name="contact-gname-input"
                v-model="contact.given_name"
                :state="validateStateContact('given_name')"
                aria-describedby="contact-gname-feedback"
              ></b-form-input>

              <b-form-invalid-feedback id="contact-gname-feedback">
                {{ $t("msg.required") }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
        </div>

        <div class="row mt-n2">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.phone") }}
            </div>
            <b-form-input v-model="contact.phone" @change="formatContactPhone"></b-form-input>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.wmail") }}
            </div>
            <b-form-group label-for="ctmail-input">
              <b-form-input
                id="ctmail-input"
                name="ctmail-input"
                v-model="contact.email"
                :state="validateCtMail"
                aria-describedby="ctmail-feedback"
              ></b-form-input>

              <b-form-invalid-feedback id="ctmail-feedback">
                {{ $t("msg.invalidMail") }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.mobile") }}
            </div>
            <b-form-input v-model="contact.mobile" @change="formatMobile"></b-form-input>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.prmail") }}
            </div>
            <b-form-group label-for="prmail-input">
              <b-form-input
                id="prmail-input"
                name="prmail-input"
                v-model="contact.private_mail"
                :state="validatePrMail"
                aria-describedby="prmail-feedback"
              ></b-form-input>

              <b-form-invalid-feedback id="prmail-feedback">
                {{ $t("msg.invalidMail") }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("address.dob") }}
            </div>
            <b-input-group class="mb-2">
              <b-form-input
                v-model="contact.dob_formatted"
                type="text"
                autocomplete="off"
                placeholder="dd.mm.yyyy"
                @blur="formatDateInvert"
              ></b-form-input>
              <b-input-group-append>
                <b-form-datepicker
                  v-model="contact.dob"
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
              {{ $t("address.comment") }}({{ $t("address.internal") }})
            </div>
            <b-form-input v-model="contact.comment"></b-form-input>
          </div>
        </div>
        <!-- Modal Actions -->
        <div class="mt-4">
          <b-button variant="primary" class="save-btn mr-2" type="submit" :disabled="savingContact">
            <b-spinner small v-if="savingContact"></b-spinner>
            <i v-else class="flaticon2-check-mark p-0"></i>
          </b-button>
          <b-button v-show="edit === true" variant="primary" class="del-btn" @click="removeContact">
            <i class="flaticon2-rubbish-bin p-0"></i>
          </b-button>
          <b-button
            v-show="edit === true"
            variant="primary"
            class="download-btn"
            style="float: right"
            @click="downloadContact"
          >
            <i class="flaticon2-download p-0"></i>
          </b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delAdr") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove" :disabled="removing">
          <b-spinner small v-if="removing"></b-spinner>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Remove Contact Dialog -->
    <b-modal v-model="remove_contact_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delContact") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemoveContact" :disabled="removingContact">
          <b-spinner small v-if="removingContact"></b-spinner>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import i18nService from "@/core/services/i18n.service.js";
import moment from "moment";
import vCardsJS from "vcards-js";
import { mapGetters, mapState } from "vuex";
import {
  GET_CUSTOMER,
  UPDATE_CUSTOMER,
  DELETE_CUSTOMER,
  ADD_CONTACT,
  UPDATE_CONTACT,
  DELETE_CONTACT,
  SET_CUSTOMER_TOAST,
  SET_CUSTOMER_ID,
  SET_CUSTOMER_ERROR
} from "@/core/services/store/customer";
import { formatDate } from "@/common";

export default {
  name: "editAddress",
  mixins: [validationMixin],
  metaInfo: {
    title: "Edit Address",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Edit Address Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Edit Address | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Edit Address | Archapp"
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
      categories: [
        { name: this.$t("address.catAcquisition"), code: "acquisition" },
        { name: this.$t("address.catCustomer"), code: "customer" },
        { name: this.$t("address.catSupplier"), code: "supplier" }
      ],
      types: [
        { name: this.$t("address.typeCompany"), code: "company" },
        { name: this.$t("address.typePerson"), code: "person" }
      ],
      titles: [
        { name: this.$t("address.typeMr"), code: "mr" },
        { name: this.$t("address.typeMs"), code: "ms" },
        { name: this.$t("address.typeFamily"), code: "family" }
      ],
      form: {
        category: "",
        type: "",
        title: "",
        first_name: "",
        last_name: "",
        company: "",
        address: "",
        other_address: "",
        phone: "",
        email: "",
        fax: "",
        postcode: "",
        place: "",
        country: "",
        web: "",
        comment: ""
      },
      contact: {
        title: "mr",
        title_input: "",
        name: "",
        given_name: "",
        phone: "",
        email: "",
        mobile: "",
        private_mail: "",
        dob: "",
        dob_formatted: "",
        comment: ""
      },
      locale: "de",
      contacts: [],
      countries: [
        { name: this.$t("countries.AF"), code: "AF" },
        { name: this.$t("countries.AX"), code: "AX" },
        { name: this.$t("countries.AL"), code: "AL" },
        { name: this.$t("countries.DZ"), code: "DZ" },
        { name: this.$t("countries.AS"), code: "AS" },
        { name: this.$t("countries.AD"), code: "AD" },
        { name: this.$t("countries.AO"), code: "AO" },
        { name: this.$t("countries.AI"), code: "AI" },
        { name: this.$t("countries.AQ"), code: "AQ" },
        { name: this.$t("countries.AG"), code: "AG" },
        { name: this.$t("countries.AR"), code: "AR" },
        { name: this.$t("countries.AM"), code: "AM" },
        { name: this.$t("countries.AW"), code: "AW" },
        { name: this.$t("countries.AU"), code: "AU" },
        { name: this.$t("countries.AT"), code: "AT" },
        { name: this.$t("countries.AZ"), code: "AZ" },
        { name: this.$t("countries.BS"), code: "BS" },
        { name: this.$t("countries.BH"), code: "BH" },
        { name: this.$t("countries.BD"), code: "BD" },
        { name: this.$t("countries.BB"), code: "BB" },
        { name: this.$t("countries.BY"), code: "BY" },
        { name: this.$t("countries.BE"), code: "BE" },
        { name: this.$t("countries.BZ"), code: "BZ" },
        { name: this.$t("countries.BJ"), code: "BJ" },
        { name: this.$t("countries.BM"), code: "BM" },
        { name: this.$t("countries.BT"), code: "BT" },
        { name: this.$t("countries.BO"), code: "BO" },
        { name: this.$t("countries.BA"), code: "BA" },
        { name: this.$t("countries.BW"), code: "BW" },
        { name: this.$t("countries.BV"), code: "BV" },
        { name: this.$t("countries.BR"), code: "BR" },
        { name: this.$t("countries.IO"), code: "IO" },
        { name: this.$t("countries.BN"), code: "BN" },
        { name: this.$t("countries.BG"), code: "BG" },
        { name: this.$t("countries.BF"), code: "BF" },
        { name: this.$t("countries.BI"), code: "BI" },
        { name: this.$t("countries.KH"), code: "KH" },
        { name: this.$t("countries.CM"), code: "CM" },
        { name: this.$t("countries.CA"), code: "CA" },
        { name: this.$t("countries.CV"), code: "CV" },
        { name: this.$t("countries.KY"), code: "KY" },
        { name: this.$t("countries.CF"), code: "CF" },
        { name: this.$t("countries.TD"), code: "TD" },
        { name: this.$t("countries.CL"), code: "CL" },
        { name: this.$t("countries.CN"), code: "CN" },
        { name: this.$t("countries.CX"), code: "CX" },
        { name: this.$t("countries.CC"), code: "CC" },
        { name: this.$t("countries.CO"), code: "CO" },
        { name: this.$t("countries.KM"), code: "KM" },
        { name: this.$t("countries.CG"), code: "CG" },
        { name: this.$t("countries.CD"), code: "CD" },
        { name: this.$t("countries.CK"), code: "CK" },
        { name: this.$t("countries.CR"), code: "CR" },
        { name: this.$t("countries.CI"), code: "CI" },
        { name: this.$t("countries.HR"), code: "HR" },
        { name: this.$t("countries.CU"), code: "CU" },
        { name: this.$t("countries.CY"), code: "CY" },
        { name: this.$t("countries.CZ"), code: "CZ" },
        { name: this.$t("countries.DK"), code: "DK" },
        { name: this.$t("countries.DJ"), code: "DJ" },
        { name: this.$t("countries.DM"), code: "DM" },
        { name: this.$t("countries.DO"), code: "DO" },
        { name: this.$t("countries.EC"), code: "EC" },
        { name: this.$t("countries.EG"), code: "EG" },
        { name: this.$t("countries.SV"), code: "SV" },
        { name: this.$t("countries.GQ"), code: "GQ" },
        { name: this.$t("countries.ER"), code: "ER" },
        { name: this.$t("countries.EE"), code: "EE" },
        { name: this.$t("countries.ET"), code: "ET" },
        { name: this.$t("countries.FK"), code: "FK" },
        { name: this.$t("countries.FO"), code: "FO" },
        { name: this.$t("countries.FJ"), code: "FJ" },
        { name: this.$t("countries.FI"), code: "FI" },
        { name: this.$t("countries.FR"), code: "FR" },
        { name: this.$t("countries.GF"), code: "GF" },
        { name: this.$t("countries.PF"), code: "PF" },
        { name: this.$t("countries.TF"), code: "TF" },
        { name: this.$t("countries.GA"), code: "GA" },
        { name: this.$t("countries.GM"), code: "GM" },
        { name: this.$t("countries.GE"), code: "GE" },
        { name: this.$t("countries.DE"), code: "DE" },
        { name: this.$t("countries.GH"), code: "GH" },
        { name: this.$t("countries.GI"), code: "GI" },
        { name: this.$t("countries.GR"), code: "GR" },
        { name: this.$t("countries.GL"), code: "GL" },
        { name: this.$t("countries.GD"), code: "GD" },
        { name: this.$t("countries.GP"), code: "GP" },
        { name: this.$t("countries.GU"), code: "GU" },
        { name: this.$t("countries.GT"), code: "GT" },
        { name: this.$t("countries.GG"), code: "GG" },
        { name: this.$t("countries.GN"), code: "GN" },
        { name: this.$t("countries.GW"), code: "GW" },
        { name: this.$t("countries.GY"), code: "GY" },
        { name: this.$t("countries.HT"), code: "HT" },
        { name: this.$t("countries.HM"), code: "HM" },
        { name: this.$t("countries.VA"), code: "VA" },
        { name: this.$t("countries.HN"), code: "HN" },
        { name: this.$t("countries.HK"), code: "HK" },
        { name: this.$t("countries.HU"), code: "HU" },
        { name: this.$t("countries.IS"), code: "IS" },
        { name: this.$t("countries.IN"), code: "IN" },
        { name: this.$t("countries.ID"), code: "ID" },
        { name: this.$t("countries.IR"), code: "IR" },
        { name: this.$t("countries.IQ"), code: "IQ" },
        { name: this.$t("countries.IE"), code: "IE" },
        { name: this.$t("countries.IM"), code: "IM" },
        { name: this.$t("countries.IL"), code: "IL" },
        { name: this.$t("countries.IT"), code: "IT" },
        { name: this.$t("countries.JM"), code: "JM" },
        { name: this.$t("countries.JP"), code: "JP" },
        { name: this.$t("countries.JE"), code: "JE" },
        { name: this.$t("countries.JO"), code: "JO" },
        { name: this.$t("countries.KZ"), code: "KZ" },
        { name: this.$t("countries.KE"), code: "KE" },
        { name: this.$t("countries.KI"), code: "KI" },
        { name: this.$t("countries.KP"), code: "KP" },
        { name: this.$t("countries.KR"), code: "KR" },
        { name: this.$t("countries.KW"), code: "KW" },
        { name: this.$t("countries.KG"), code: "KG" },
        { name: this.$t("countries.LA"), code: "LA" },
        { name: this.$t("countries.LV"), code: "LV" },
        { name: this.$t("countries.LB"), code: "LB" },
        { name: this.$t("countries.LS"), code: "LS" },
        { name: this.$t("countries.LR"), code: "LR" },
        { name: this.$t("countries.LY"), code: "LY" },
        { name: this.$t("countries.LI"), code: "LI" },
        { name: this.$t("countries.LT"), code: "LT" },
        { name: this.$t("countries.LU"), code: "LU" },
        { name: this.$t("countries.MO"), code: "MO" },
        { name: this.$t("countries.MK"), code: "MK" },
        { name: this.$t("countries.MG"), code: "MG" },
        { name: this.$t("countries.MW"), code: "MW" },
        { name: this.$t("countries.MY"), code: "MY" },
        { name: this.$t("countries.MV"), code: "MV" },
        { name: this.$t("countries.ML"), code: "ML" },
        { name: this.$t("countries.MT"), code: "MT" },
        { name: this.$t("countries.MH"), code: "MH" },
        { name: this.$t("countries.MQ"), code: "MQ" },
        { name: this.$t("countries.MR"), code: "MR" },
        { name: this.$t("countries.MU"), code: "MU" },
        { name: this.$t("countries.YT"), code: "YT" },
        { name: this.$t("countries.MX"), code: "MX" },
        { name: this.$t("countries.FM"), code: "FM" },
        { name: this.$t("countries.MD"), code: "MD" },
        { name: this.$t("countries.MC"), code: "MC" },
        { name: this.$t("countries.MN"), code: "MN" },
        { name: this.$t("countries.MS"), code: "MS" },
        { name: this.$t("countries.MA"), code: "MA" },
        { name: this.$t("countries.MZ"), code: "MZ" },
        { name: this.$t("countries.MM"), code: "MM" },
        { name: this.$t("countries.NA"), code: "NA" },
        { name: this.$t("countries.NR"), code: "NR" },
        { name: this.$t("countries.NP"), code: "NP" },
        { name: this.$t("countries.NL"), code: "NL" },
        { name: this.$t("countries.AN"), code: "AN" },
        { name: this.$t("countries.NC"), code: "NC" },
        { name: this.$t("countries.NZ"), code: "NZ" },
        { name: this.$t("countries.NI"), code: "NI" },
        { name: this.$t("countries.NE"), code: "NE" },
        { name: this.$t("countries.NG"), code: "NG" },
        { name: this.$t("countries.NU"), code: "NU" },
        { name: this.$t("countries.NF"), code: "NF" },
        { name: this.$t("countries.MP"), code: "MP" },
        { name: this.$t("countries.NO"), code: "NO" },
        { name: this.$t("countries.OM"), code: "OM" },
        { name: this.$t("countries.PK"), code: "PK" },
        { name: this.$t("countries.PW"), code: "PW" },
        { name: this.$t("countries.PS"), code: "PS" },
        { name: this.$t("countries.PA"), code: "PA" },
        { name: this.$t("countries.PG"), code: "PG" },
        { name: this.$t("countries.PY"), code: "PY" },
        { name: this.$t("countries.PE"), code: "PE" },
        { name: this.$t("countries.PH"), code: "PH" },
        { name: this.$t("countries.PN"), code: "PN" },
        { name: this.$t("countries.PL"), code: "PL" },
        { name: this.$t("countries.PT"), code: "PT" },
        { name: this.$t("countries.PR"), code: "PR" },
        { name: this.$t("countries.QA"), code: "QA" },
        { name: this.$t("countries.RE"), code: "RE" },
        { name: this.$t("countries.RO"), code: "RO" },
        { name: this.$t("countries.RU"), code: "RU" },
        { name: this.$t("countries.RW"), code: "RW" },
        { name: this.$t("countries.SH"), code: "SH" },
        { name: this.$t("countries.KN"), code: "KN" },
        { name: this.$t("countries.LC"), code: "LC" },
        { name: this.$t("countries.PM"), code: "PM" },
        { name: this.$t("countries.VC"), code: "VC" },
        { name: this.$t("countries.WS"), code: "WS" },
        { name: this.$t("countries.SM"), code: "SM" },
        { name: this.$t("countries.ST"), code: "ST" },
        { name: this.$t("countries.SA"), code: "SA" },
        { name: this.$t("countries.SN"), code: "SN" },
        { name: this.$t("countries.CS"), code: "CS" },
        { name: this.$t("countries.SC"), code: "SC" },
        { name: this.$t("countries.SL"), code: "SL" },
        { name: this.$t("countries.SG"), code: "SG" },
        { name: this.$t("countries.SK"), code: "SK" },
        { name: this.$t("countries.SI"), code: "SI" },
        { name: this.$t("countries.SB"), code: "SB" },
        { name: this.$t("countries.SO"), code: "SO" },
        { name: this.$t("countries.ZA"), code: "ZA" },
        { name: this.$t("countries.GS"), code: "GS" },
        { name: this.$t("countries.ES"), code: "ES" },
        { name: this.$t("countries.LK"), code: "LK" },
        { name: this.$t("countries.SD"), code: "SD" },
        { name: this.$t("countries.SR"), code: "SR" },
        { name: this.$t("countries.SJ"), code: "SJ" },
        { name: this.$t("countries.SZ"), code: "SZ" },
        { name: this.$t("countries.SE"), code: "SE" },
        { name: this.$t("countries.CH"), code: "CH" },
        { name: this.$t("countries.SY"), code: "SY" },
        { name: this.$t("countries.TW"), code: "TW" },
        { name: this.$t("countries.TJ"), code: "TJ" },
        { name: this.$t("countries.TZ"), code: "TZ" },
        { name: this.$t("countries.TH"), code: "TH" },
        { name: this.$t("countries.TL"), code: "TL" },
        { name: this.$t("countries.TG"), code: "TG" },
        { name: this.$t("countries.TK"), code: "TK" },
        { name: this.$t("countries.TO"), code: "TO" },
        { name: this.$t("countries.TT"), code: "TT" },
        { name: this.$t("countries.TN"), code: "TN" },
        { name: this.$t("countries.TR"), code: "TR" },
        { name: this.$t("countries.TM"), code: "TM" },
        { name: this.$t("countries.TC"), code: "TC" },
        { name: this.$t("countries.TV"), code: "TV" },
        { name: this.$t("countries.UG"), code: "UG" },
        { name: this.$t("countries.UA"), code: "UA" },
        { name: this.$t("countries.AE"), code: "AE" },
        { name: this.$t("countries.GB"), code: "GB" },
        { name: this.$t("countries.US"), code: "US" },
        { name: this.$t("countries.UM"), code: "UM" },
        { name: this.$t("countries.UY"), code: "UY" },
        { name: this.$t("countries.UZ"), code: "UZ" },
        { name: this.$t("countries.VU"), code: "VU" },
        { name: this.$t("countries.VE"), code: "VE" },
        { name: this.$t("countries.VN"), code: "VN" },
        { name: this.$t("countries.VG"), code: "VG" },
        { name: this.$t("countries.VI"), code: "VI" },
        { name: this.$t("countries.WF"), code: "WF" },
        { name: this.$t("countries.EH"), code: "EH" },
        { name: this.$t("countries.YE"), code: "YE" },
        { name: this.$t("countries.ZM"), code: "ZM" },
        { name: this.$t("countries.ZW"), code: "ZW" }
      ],
      dialog: false,
      edit: false,
      remove_dialog: false,
      remove_contact_dialog: false,
      loading: true,
      contact_id: 0,
      removing: false,
      removingContact: false,
      saving: false,
      savingContact: false
    };
  },
  validations: {
    form: {
      company: {
        required
      },
      postcode: {
        required
      },
      place: {
        required
      },
      first_name: {
        required
      },
      last_name: {
        required
      }
    },
    contact: {
      name: {
        required
      },
      given_name: {
        required
      }
    }
  },
  computed: {
    ...mapGetters(["currentCustomer"]),
    ...mapState({
      error: state => state.customer.error,
      id: state => state.customer.id
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    validateMail() {
      if (this.form.mail) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.form.mail) ? null : false;
      } else {
        return null;
      }
    },
    validateCtMail() {
      if (this.contact.mail) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.contact.mail) ? null : false;
      } else {
        return null;
      }
    },
    validatePrMail() {
      if (this.contact.private_mail) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.contact.private_mail) ? null : false;
      } else {
        return null;
      }
    }
  },
  async mounted() {
    this.$store.commit(SET_CUSTOMER_ID, this.$route.params.address_id);
    await this.$store.dispatch(GET_CUSTOMER, { id: this.id });
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
      if (this.currentCustomer.type === "company") {
        this.form.company = this.currentCustomer.name;
      } else {
        this.form.title = this.currentCustomer.title;
        this.form.first_name = this.currentCustomer.first_name;
        this.form.last_name = this.currentCustomer.last_name;
      }
      this.form.category = this.currentCustomer.category;
      this.form.type = this.currentCustomer.type;
      this.form.address = this.currentCustomer.address;
      this.form.other_address = this.currentCustomer.other_address;
      this.form.phone = this.currentCustomer.phone;
      this.form.email = this.currentCustomer.email;
      this.form.fax = this.currentCustomer.fax;
      this.form.postcode = this.currentCustomer.postcode;
      this.form.place = this.currentCustomer.place;
      this.form.country = this.currentCustomer.country;
      this.form.web = this.currentCustomer.web;
      this.form.comment = this.currentCustomer.comment;
      this.contacts = this.currentCustomer.contacts;
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    validateStateContact(name) {
      const { $dirty, $error } = this.$v.contact[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      if (this.saving) return;
      if (this.form.type === "company") {
        this.$v.form.company.$touch();
        this.$v.form.place.$touch();
        this.$v.form.postcode.$touch();
      } else {
        this.$v.form.first_name.$touch();
        this.$v.form.last_name.$touch();
        this.$v.form.place.$touch();
        this.$v.form.postcode.$touch();
      }
      if (this.$v.form.$anyError) {
        this.scrollToError();
        return;
      }
      this.saving = true;
      try {
        if (this.form.type === "company") {
          await this.$store.dispatch(UPDATE_CUSTOMER, {
            id: this.id,
            data: {
              category: this.form.category,
              type: this.form.type,
              company: this.form.company,
              address: this.form.address,
              other_address: this.form.other_address,
              phone: this.form.phone,
              email: this.form.email,
              fax: this.form.fax,
              postcode: this.form.postcode,
              place: this.form.place,
              country: this.form.country,
              web: this.form.web,
              comment: this.form.comment
            }
          });
          if (this.error) {
            this.toastMsg("error", this.error);
            this.saving = false;
          } else {
            this.$store.commit(SET_CUSTOMER_TOAST, {
              type: "success",
              msg: this.$t("msg.updateSuccess")
            });
            await this.$router.push("/address");
            this.saving = false;
          }
        } else {
          await this.$store.dispatch(UPDATE_CUSTOMER, {
            id: this.id,
            data: {
              category: this.form.category,
              type: this.form.type,
              title: this.form.title,
              first_name: this.form.first_name,
              last_name: this.form.last_name,
              address: this.form.address,
              other_address: this.form.other_address,
              phone: this.form.phone,
              email: this.form.email,
              fax: this.form.fax,
              postcode: this.form.postcode,
              place: this.form.place,
              country: this.form.country,
              web: this.form.web,
              comment: this.form.comment
            }
          });
          if (this.error) {
            this.toastMsg("error", this.error);
            this.saving = false;
          } else {
            this.$store.commit(SET_CUSTOMER_TOAST, {
              type: "success",
              msg: this.$t("msg.updateSuccess")
            });
            await this.$router.push("/address");
            this.saving = false;
          }
        }
      } catch (error) {
        this.saving = false;
      }
    },
    async onSubmitContact() {
      if (this.savingContact) return;
      this.$v.contact.$touch();
      if (this.$v.contact.$anyError) {
        return;
      }
      this.savingContact = true;
      try {
        if (this.edit) {
          await this.$store.dispatch(UPDATE_CONTACT, {
            id: this.id,
            contact_id: this.contact_id,
            data: {
              title: this.contact.title,
              title_input: this.contact.title_input,
              name: this.contact.name,
              given_name: this.contact.given_name,
              phone: this.contact.phone,
              email: this.contact.email,
              mobile: this.contact.mobile,
              private_mail: this.contact.private_mail,
              dob: this.contact.dob,
              comment: this.contact.comment
            }
          });
          this.dialog = false;
          if (this.error) {
            this.toastMsg("error", this.error);
          } else {
            this.toastMsg("success", this.$t("msg.updateSuccess"));
          }
        } else {
          await this.$store.dispatch(ADD_CONTACT, {
            id: this.id,
            data: {
              title: this.contact.title,
              title_input: this.contact.title_input,
              name: this.contact.name,
              given_name: this.contact.given_name,
              phone: this.contact.phone,
              email: this.contact.email,
              mobile: this.contact.mobile,
              private_mail: this.contact.private_mail,
              dob: this.contact.dob,
              comment: this.contact.comment
            }
          });
          this.dialog = false;
          if (this.error) {
            this.toastMsg("error", this.error);
          } else {
            this.toastMsg("success", this.$t("msg.addSuccess"));
          }
        }
        await this.$store.dispatch(GET_CUSTOMER, { id: this.id });
        this.contacts = this.currentCustomer.contacts;
      } finally {
        this.savingContact = false;
      }
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    downloadCustomer() {
      const vCard = vCardsJS();
      let fileName = null;
      //set properties
      if (this.form.type === "company") {
        fileName = this.form.company.replace(/\s/g, "-") + ".vcf";
        vCard.firstName = this.form.company;
      } else {
        fileName = this.form.first_name + "-" + this.form.last_name + ".vcf";
        vCard.namePrefix = this.form.title.charAt(0).toUpperCase() + this.form.title.slice(1);
        vCard.firstName = this.form.first_name;
        vCard.lastName = this.form.last_name;
      }
      vCard.role = this.form.category;
      vCard.workPhone = this.form.phone;
      vCard.workFax = this.form.fax;
      vCard.email = this.form.email;
      vCard.workAddress.label = "Address";
      vCard.workAddress.street = this.form.address;
      vCard.workAddress.city = this.form.place;
      vCard.workAddress.postalCode = this.form.postcode;
      for (const place of this.countries) {
        if (this.form.country === place.code) {
          vCard.workAddress.countryRegion = place.name;
          break;
        }
      }
      vCard.url = this.form.web;
      vCard.note = this.form.comment;

      this.saveFile(vCard.getFormattedString(), fileName);
    },
    downloadContact() {
      const vCard = vCardsJS();
      let fileName = null;
      //set properties
      fileName = this.contact.name + "-" + this.contact.given_name + ".vcf";
      vCard.namePrefix = this.contact.title.charAt(0).toUpperCase() + this.contact.title.slice(1);
      vCard.firstName = this.contact.name;
      vCard.lastName = this.contact.given_name;
      vCard.cellPhone = this.contact.mobile;
      vCard.workPhone = this.contact.phone;
      vCard.email = this.contact.private_mail;
      vCard.workEmail = this.contact.email;
      if (this.contact.dob) {
        const arr = this.contact.split("-");
        vCard.birthday = new Date(arr[0], arr[1], arr[2]);
      }
      vCard.note = this.contact.comment;

      this.saveFile(vCard.getFormattedString(), fileName);
    },
    editContact(id) {
      this.resetForm();
      this.contact_id = id;
      this.edit = true;
      for (const item of this.currentCustomer.contacts) {
        if (id === item.id) {
          this.contact.title = item.title;
          this.contact.title_input = item.title_input;
          this.contact.name = item.name;
          this.contact.given_name = item.given_name;
          this.contact.phone = item.phone;
          this.contact.email = item.email;
          this.contact.mobile = item.mobile;
          this.contact.private_mail = item.private_mail;
          this.contact.dob = item.dob;
          this.contact.dob_formatted = formatDate(item.dob);
          this.contact.comment = item.comment;
          break;
        }
      }
      this.dialog = true;
    },
    remove() {
      this.remove_dialog = true;
    },
    async confirmRemove() {
      if (this.removing) return;
      this.removing = true;
      try {
        await this.$store.dispatch(DELETE_CUSTOMER, { id: this.id });
        if (this.error) {
          this.toastMsg("error", this.error);
          this.removing = false;
        } else {
          this.$store.commit(SET_CUSTOMER_TOAST, {
            type: "success",
            msg: this.$t("msg.delSuccess")
          });
          await this.$router.push("/address");
          this.removing = false;
        }
      } catch (error) {
        this.removing = false;
      }
    },
    removeContact() {
      this.remove_contact_dialog = true;
    },
    async confirmRemoveContact() {
      if (this.removingContact) return;
      this.removingContact = true;
      try {
        await this.$store.dispatch(DELETE_CONTACT, {
          id: this.id,
          contact_id: this.contact_id
        });
        this.remove_contact_dialog = false;
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.delSuccess"));
          await this.$store.dispatch(GET_CUSTOMER, { id: this.id });
          this.contacts = this.currentCustomer.contacts;
        }
      } finally {
        this.removingContact = false;
      }
    },
    back() {
      window.history.back();
    },
    formatDate() {
      if (this.contact.dob) {
        this.contact.dob_formatted = formatDate(this.contact.dob);
      }
    },
    formatDateInvert() {
      if (this.contact.dob_formatted) {
        const split = this.contact.dob_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.contact.dob = join;
      }
    },
    formatPhone() {
      if (this.form.phone && !this.form.phone.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.form.phone}`);
        this.form.phone = phoneNumber.formatInternational();
      }
    },
    formatContactPhone() {
      if (this.contact.phone && !this.contact.phone.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.contact.phone}`);
        this.contact.phone = phoneNumber.formatInternational();
      }
    },
    formatMobile() {
      if (this.contact.mobile && !this.contact.mobile.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.contact.mobile}`);
        this.contact.mobile = phoneNumber.formatInternational();
      }
    },
    formatFax() {
      if (this.form.fax && !this.form.fax.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.form.fax}`);
        this.form.fax = phoneNumber.formatInternational();
      }
    },
    saveFile(data, fileName) {
      const blob = new Blob([data], { type: "octet/stream" });
      const url = window.URL.createObjectURL(blob);
      const el = document.createElement("a");
      document.body.appendChild(el);
      el.style = "display:none";
      el.href = url;
      el.download = fileName;
      el.click();
      window.URL.revokeObjectURL(url);
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
      this.$store.commit(SET_CUSTOMER_ERROR, null);
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
  background-color: rgba(153, 153, 153, 0.3);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.contact {
  background-color: #f3f6f9;
  padding: 1rem;
  border-radius: 0.42rem;
}

.contact:hover {
  background-color: #e3e3e4;
}
</style>
