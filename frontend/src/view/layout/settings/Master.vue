<template>
  <div class="mt-8">
    <!-- Setting Fields -->
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.company") }}
        </div>
        <b-form-input v-model="company"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.address") }}
        </div>
        <b-form-input v-model="address"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.postcode") }}
        </div>
        <b-form-input v-model="postcode"></b-form-input>
      </div>
      <div class="col-md-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.place") }}
        </div>
        <b-form-input v-model="place"></b-form-input>
      </div>
      <div class="col-md-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.country") }}
        </div>
        <b-form-select
          v-model="country"
          :options="countries"
          value-field="code"
          text-field="name"
        ></b-form-select>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.phone") }}
        </div>
        <b-form-input v-model="phone" @change="formatPhone"></b-form-input>
      </div>
      <div class="col-md-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.fax") }}
        </div>
        <b-form-input v-model="fax" @change="formatFax"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.mail") }}
        </div>
        <b-form-input v-model="email"></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.web") }}
        </div>
        <b-form-input v-model="web"></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">Konto Nr.</div>
        <b-form-input v-model="konto"></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">MWST Number</div>
        <b-form-input v-model="mwst"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.currency") }}
        </div>
        <b-form-input v-model="currency" disabled></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.bank") }}
        </div>
        <b-form-input v-model="bank"></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.clearing") }}
        </div>
        <b-form-input v-model="clearing_num"></b-form-input>
      </div>
      <div class="col-md-3">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.iban") }}
        </div>
        <b-form-input v-model="iban"></b-form-input>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.revenue") }}
        </div>

        <div class="row">
          <div class="col-md-1 font-weight-bold">
            {{ $t("settings.form.master.year") }}
          </div>
          <div class="col-md-8 font-weight-bold">
            {{ $t("settings.form.master.data") }}
          </div>
        </div>

        <!-- Revenue setting -->
        <div class="row mt-2">
          <draggable
            :list="revenue"
            class="item-group"
            ghost-class="ghost"
            @start="dragging = true"
            @end="dragging = false"
            handle=".handle"
          >
            <div
              v-for="(item, i) in revenue"
              :key="i"
              class="col-md-12 p-0 mb-2"
              style="display: flex"
            >
              <div class="col-md-1">
                <b-form-input
                  v-model="item.year"
                  :id="`year_${i}`"
                  class="year-input"
                ></b-form-input>
              </div>
              <div class="col-md-9 month-group">
                <div v-for="j in 12" :key="j">
                  <b-form-input
                    v-model="item.value[j - 1]"
                    :id="`data_${i}_${j - 1}`"
                    :placeholder="mapMonth(j - 1)"
                    class="data-input"
                  ></b-form-input>
                </div>
              </div>
              <div class="col-md-2">
                <b-button
                  variant="primary"
                  class="minus-btn mr-2"
                  @click="removeRevenue(i)"
                >
                  <i class="flaticon2-line p-0"></i>
                </b-button>
                <b-button
                  variant="primary"
                  class="plus-btn mr-2"
                  @click="addRevenue(i)"
                >
                  <i class="flaticon2-plus p-0"></i>
                </b-button>
                <b-button variant="primary">
                  <i class="flaticon2-sort handle p-0"></i>
                </b-button>
              </div>
            </div>
          </draggable>
        </div>
      </div>
    </div>

    <!-- Multiple currencies setting -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.master.options") }}
        </div>
        <b-form-checkbox
          class="visible-box"
          :checked="allow_to_use_other_currencies === true"
          @change="setToggleCurrencies"
          >{{
            $t("settings.form.master.allow_to_use_other_currencies")
          }}</b-form-checkbox
        >
      </div>
      <div class="col-md-12" v-if="allow_to_use_other_currencies">
        <div v-for="(item, i) in ['CHF', 'USD', 'EUR']" :key="i">
          <div class="ml-6 mt-2 mb-2">
            <b-form-checkbox
              :id="`currencies_${i}`"
              size="md"
              :checked="currencies ? currencies.includes(item) : false"
              @change="setCurrencies(item)"
            >
              {{ item }}
            </b-form-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- Action -->
    <div class="row mt-4">
      <div class="col-md-12 action mt-4">
        <b-button
          variant="primary"
          size="lg"
          class="update-btn"
          @click="update"
          >{{ $t("button.update") }}</b-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import draggable from "vuedraggable";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  GET_COMPANY,
  UPDATE_MASTER_SETTING,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  components: {
    draggable
  },
  data() {
    return {
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
      months: [
        { name: this.$t("months.janFull"), code: 0 },
        { name: this.$t("months.febFull"), code: 1 },
        { name: this.$t("months.marFull"), code: 2 },
        { name: this.$t("months.aprFull"), code: 3 },
        { name: this.$t("months.mayFull"), code: 4 },
        { name: this.$t("months.junFull"), code: 5 },
        { name: this.$t("months.julFull"), code: 6 },
        { name: this.$t("months.augFull"), code: 7 },
        { name: this.$t("months.sepFull"), code: 8 },
        { name: this.$t("months.octFull"), code: 9 },
        { name: this.$t("months.novFull"), code: 10 },
        { name: this.$t("months.decFull"), code: 11 }
      ],
      revenue: [],
      currencies: [],
      company: "",
      address: "",
      postcode: "",
      place: "",
      country: "",
      phone: "",
      fax: "",
      email: "",
      web: "",
      konto: "",
      mwst: "",
      currency: "",
      bank: "",
      clearing_num: "",
      iban: "",
      allow_to_use_other_currencies: false,
      dragging: false
    };
  },
  computed: {
    ...mapGetters(["currentSettings", "currentCompany"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    this.$store.dispatch(GET_COMPANY);
    this.initData();
    this.setRevenue();
  },
  methods: {
    initData() {
      this.company = this.currentSettings.master_data.company;
      this.address = this.currentSettings.master_data.address;
      this.postcode = this.currentSettings.master_data.postcode;
      this.place = this.currentSettings.master_data.place;
      this.country = this.currentSettings.master_data.country;
      this.phone = this.currentSettings.master_data.phone;
      this.fax = this.currentSettings.master_data.fax;
      this.email = this.currentSettings.master_data.email;
      this.web = this.currentSettings.master_data.web;
      this.konto = this.currentSettings.master_data.konto;
      this.mwst = this.currentSettings.master_data.mwst;
      this.currency = this.currentCompany.currency;
      this.bank = this.currentSettings.master_data.bank;
      this.clearing_num = this.currentSettings.master_data.clearing_num;
      this.iban = this.currentSettings.master_data.iban;
      this.allow_to_use_other_currencies = this.currentSettings.master_data
        .allow_to_use_other_currencies
        ? this.currentSettings.master_data.allow_to_use_other_currencies
        : false;
      this.currencies = this.currentSettings.master_data.currencies;
    },
    setToggleCurrencies() {
      this.allow_to_use_other_currencies = !this.allow_to_use_other_currencies;
      if (!this.allow_to_use_other_currencies) {
        this.currencies = [];
      }
    },
    setCurrencies(item) {
      if (this.currencies.includes(item)) {
        this.currencies = _.without(this.currencies, item);
      } else {
        this.currencies.push(item);
      }
    },
    setRevenue() {
      let result = [];
      if (this.currentSettings.master_data.revenues) {
        let obj = this.currentSettings.master_data.revenues;
        if (_.isEmpty(obj)) {
          this.addRevenue();
        } else {
          for (const prop in obj) {
            let item = {
              year: prop,
              value: obj[prop]
            };
            result.push(item);
          }
          this.revenue = result;
        }
      } else {
        this.addRevenue();
      }
    },
    addRevenue(pos) {
      if (this.revenue.length < 5) {
        let item = {
          year: "",
          value: []
        };
        this.revenue.splice(pos + 1, 0, item);
      }
    },
    removeRevenue(id) {
      if (this.revenue.length > 1) {
        this.revenue.splice(id, 1);
      }
    },
    formatPhone() {
      if (this.phone && !this.phone.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.phone}`);
        this.phone = phoneNumber.formatInternational();
      }
    },
    formatFax() {
      if (this.fax && !this.fax.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.fax}`);
        this.fax = phoneNumber.formatInternational();
      }
    },
    update() {
      this.$store.dispatch(UPDATE_MASTER_SETTING, {
        company: this.company,
        address: this.address,
        postcode: this.postcode,
        place: this.place,
        country: this.country,
        phone: this.phone,
        fax: this.fax,
        email: this.email,
        web: this.web,
        konto: this.konto,
        mwst: this.mwst,
        currency: this.currency,
        bank: this.bank,
        clearing_num: this.clearing_num,
        iban: this.iban,
        revenues: this.mapRevenue(),
        allow_to_use_other_currencies: this.allow_to_use_other_currencies,
        currencies: this.currencies
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
      }
    },
    mapMonth(index) {
      for (const month of this.months) {
        if (index === month.code) {
          return month.name;
        }
      }
    },
    mapRevenue() {
      let obj = {};
      for (const item of this.revenue) {
        if (item.year) {
          obj[item.year] = item.value.map(Number);
        }
      }
      return obj;
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

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
}

.month-group {
  display: inline-flex;
}

.data-input {
  width: 60px;
  margin-right: 0.5rem;
}
</style>
