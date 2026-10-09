<template>
  <div>
    <div id="header">
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: left; width: 50%">
            <h6 style="font-weight: bold">
              {{ lang === "de" ? "Projektübersicht Rechnungen" : "Project overview invoices" }}
            </h6>
            <div></div>
          </td>
          <td style="text-align: right; width: 50%">
            <div>{{ currentCompany.name }}</div>
            <div v-if="currentSettings.master_data.address">
              {{ currentSettings.master_data.address }}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div class="first-page">
      <div style="margin-bottom: 10px">
        {{ (lang === "de" ? "Druckdatum: " : "Date ") + today }}
      </div>
      <div style="margin-bottom: 10px">
        {{ lang === "de" ? "Auftrag Nr.: " : "Number: " }}
        <span
          ><b>{{ prNumber }}</b></span
        >
      </div>
      <div style="margin-bottom: 20px">
        {{ lang === "de" ? "Auftrag: " : "Project: " }}
        <span
          ><b>{{ prName }}</b></span
        >
      </div>

      <table
        style="
            width: 100%;
            justify-content: center;
            border-collapse: collapse;
          "
      >
        <div v-for="(item, i) in sheet" :key="i" style="display: contents;">
          <tr colspan="5">
            <h4 style="font-weight: bold; white-space: nowrap;">
              {{ item.company }}
            </h4>
          </tr>
          <tr style="border-top: 1px solid black; border-bottom: 1px solid black;">
            <td style="width: 40%; padding-top: 5px">
              <h4 style="font-weight: bold">
                {{ lang === "de" ? "Honorarangebot" : "Fee Offer" }}
              </h4>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <h4 style="font-weight: bold">
                {{ formatMoney(item.total_project_net) }}
              </h4>
              <div>
                (exkl. MWST)
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <h4 style="font-weight: bold">
                {{ formatMoney(item.total_project_gross) }}
              </h4>
              <div>
                (inkl. MWST)
              </div>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <div style="height: 10px;"></div>

          <!-- Project cost -->
          <tr>
            <td style="width: 40%; padding-top: 15px"></td>
            <td style="width: 10%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Datum" : "Date" }}
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Rechnung" : "Invoice" }}
              </div>
              <div>
                (exkl. MWST)
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Rechnung" : "Invoice" }}
              </div>
              <div>
                (inkl. MWST)
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                Status
              </div>
            </td>
          </tr>

          <!-- List invoice -->
          <div v-for="(invoice, j) in item.invoices" :key="j" style="display: contents">
            <tr>
              <td style="width: 40%; padding-top: 5px">
                {{ invoice.name }}
              </td>
              <td style="width: 10%; text-align: right; padding-right: 5px">
                {{ formatDate(invoice.charged_on) }}
              </td>
              <td style="width: 20%; text-align: right; padding-right: 5px">
                {{ formatMoney(invoice.detail_cost.total_net + invoice.detail_cost.total_net_nk) }}
              </td>
              <td style="width: 20%; text-align: right; padding-right: 5px">
                {{ formatMoney(invoice.detail_cost.total_gross + invoice.detail_cost.total_gross_nk) }}
              </td>
              <td style="width: 10%; text-align: right; padding-right: 5px">
                <div style="font-weight: bold">
                  {{ mapStatus(invoice.status) }}
                </div>
              </td>
            </tr>
          </div>

          <!-- Invoice total -->
          <tr>
            <td style="width: 40%; padding-top: 5px; padding-bottom: 5px;">
              <div style="font-weight: bold; page-break-inside: avoid;">
                Total
              </div>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ formatMoney(item.total_invoice_net) }}
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ formatMoney(item.total_invoice_gross) }}
              </div>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <!-- Remaining -->
          <tr style="border-top: 1px solid black">
            <td style="width: 40%; padding-top: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Offener Honorarbetrag" : "Remaining" }}
              </div>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ formatMoney(item.total_project_net - item.total_invoice_net) }}
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ formatMoney(item.total_project_gross - item.total_invoice_gross) }}
              </div>
            </td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <div style="height: 5px"></div>

          <!-- Hour -->
          <tr>
            <td style="width: 40%; padding-top: 10px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Aufwand in h" : "Logged hours" }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px">
              {{ item.logged_hours }}
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px"></td>
            <td style="width: 20%; text-align: right; padding-right: 5px"></td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <tr>
            <td style="width: 40%; padding-top: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Ertrag pro h" : "Yield per hour" }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px"></td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ item.logged_hours > 0 ? formatMoney(item.total_invoice_net / item.logged_hours) : formatMoney(0) }}
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px"></td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <tr>
            <td style="width: 40%; padding-top: 5px">
              <div style="font-weight: bold">
                {{ lang === "de" ? "Restertrag pro h" : "Residual yield per hour" }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px">
              {{ item.rate }}
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px">
              <div style="font-weight: bold">
                {{ formatMoney((item.total_project_net - item.total_invoice_net) / item.rate) }}
              </div>
            </td>
            <td style="width: 20%; text-align: right; padding-right: 5px"></td>
            <td style="width: 10%; padding-top: 5px"></td>
          </tr>

          <div style="height: 30px"></div>
        </div>

        <tr style="border-top: 1px solid black;">
          <td style="width: 40%; padding-top: 5px">
            <div style="font-weight: bold; page-break-inside: avoid;">Total {{ prNumber + " " + prName }}</div>
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px">
            <div style="font-weight: bold">
              {{ lang === "de" ? "Projektstand" : "Project Status" }}
            </div>
          </td>
          <td style="width: 20%; text-align: right; padding-right: 5px">
            <div style="font-weight: bold">
              {{ formatMoney(projectStandNet()) }}
            </div>
          </td>
          <td style="width: 20%; text-align: right; padding-right: 5px">
            <div style="font-weight: bold">
              {{ formatMoney(projectStandGross()) }}
            </div>
          </td>
          <td style="width: 10%; padding-top: 5px"></td>
        </tr>

        <tr style="border-top: 1px solid black">
          <td style="width: 40%; padding-top: 5px">
            <div style="font-weight: bold">
              {{ lang === "de" ? "Aufwand in h" : "Logged hours" }}
            </div>
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px">
            {{ sheet.length > 0 ? sheet[0].logged_hours : 0 }}
          </td>
          <td style="width: 20%; text-align: right; padding-right: 5px">
            <div style="font-weight: bold">
              {{
                sheet.length > 0 && sheet[0].logged_hours > 0
                  ? formatMoney(remainingNet() / sheet[0].logged_hours)
                  : formatMoney(0)
              }}
            </div>
          </td>
          <td style="width: 20%; text-align: right; padding-right: 5px"></td>
          <td style="width: 10%; padding-top: 5px"></td>
        </tr>
      </table>
    </div>

    <div id="footer" class="mt-4">
      <hr style="border-top: 1px solid #333; margin-top: 0px" />
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: right; width: 100%">
            <div><span class="pageNumber"></span>/<span class="totalPages"></span></div>
            <div>{{ today }}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import currency from "currency.js";
import { mapGetters } from "vuex";
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";
import { GET_PROJECT_ALL_INVOICES } from "@/core/services/store/report";
import { generateHTMLToPDF } from "@/common/generatePdfUtils";
import { formatDate } from "@/common";

export default {
  name: "exportProjectAllInvoices",
  data() {
    return {
      today: "",
      sheet: [],
      statusOptions: [
        { value: "offset", en: "offset", de: "nicht verrechnet" },
        { value: "open", en: "open", de: "offen" },
        { value: "paid", en: "paid", de: "bezahlt" },
        { value: "cancelled", en: "paid", de: "bezahlt" },
        { value: "reminder1", en: "reminder 1", de: "1. Mahnung" },
        { value: "reminder2", en: "reminder 2", de: "2. Mahnung" },
        { value: "archive", en: "archive", de: "archiviert" }
      ]
    };
  },
  computed: {
    ...mapGetters(["currentCompany", "currentSettings", "currentProjectAllInvoices"]),
    lang() {
      if (this.$route.query.lang) {
        return this.$route.query.lang;
      } else {
        return "de";
      }
    },
    prNumber() {
      if (this.currentProjectAllInvoices.length > 0) {
        const number = this.currentProjectAllInvoices[0].number.custom_id
          ? this.currentProjectAllInvoices[0].number.custom_id
          : this.currentProjectAllInvoices[0].number.id;
        return number;
      } else {
        return null;
      }
    },
    prName() {
      if (this.currentProjectAllInvoices.length > 0) {
        return this.currentProjectAllInvoices[0].name;
      } else {
        return null;
      }
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_PROJECT_ALL_INVOICES, {
      id: this.$route.params.project_id,
      start: this.$route.query.start,
      end: this.$route.query.end
    });
    this.today = moment().format("DD.MM.YYYY");
    this.initFont();
    this.initData();

    // Generate PDF
    const isDownload = this.$route.query.download === "true";
    if (isDownload) {
      const content = this.$refs.content;

      this.$nextTick(() => {
        // Generate to PDF
        generateHTMLToPDF(content);
      });
    }
  },
  methods: {
    formatDate,
    initData() {
      if (this.currentProjectAllInvoices.length > 0) {
        let companies = [];
        for (const record of this.currentProjectAllInvoices) {
          let item = {
            company: record.company.name,
            logged_hours: record.logged_hours,
            rate: record.details.rate_per_hour,
            total_project_net: record.detail_cost.total_net + record.detail_cost.total_netnk,
            total_project_gross: record.detail_cost.total_gross + record.detail_cost.total_grossnk,
            total_invoice_net: 0,
            total_invoice_gross: 0,
            invoices: record.invoices.length > 0 ? record.invoices : []
          };

          let net_inv = 0;
          let gross_inv = 0;
          if (record.invoices.length > 0) {
            for (const invoice of record.invoices) {
              net_inv += invoice.detail_cost.total_net + invoice.detail_cost.total_net_nk;
              gross_inv += invoice.detail_cost.total_gross + invoice.detail_cost.total_gross_nk;
            }
          }
          item.total_invoice_net = net_inv;
          item.total_invoice_gross = gross_inv;
          net_inv = 0;
          gross_inv = 0;
          companies.push(item);
        }
        this.sheet = companies;
      } else {
        this.sheet = [];
      }
    },
    initFont() {
      let style = document.createElement("style");
      let font = this.currentSettings.pdf_layout.pdf_font;
      if (font === "arial") {
        style.appendChild(document.createTextNode("body { font-family: Arial,Helvetica Neue,Helvetica,sans-serif;}"));
      } else if (font === "open sans") {
        style.appendChild(document.createTextNode("body { font-family: 'Open Sans', sans-serif;}"));
      } else if (font === "courier new") {
        style.appendChild(
          document.createTextNode(
            "body { font-family: Courier New,Courier,Lucida Sans Typewriter,Lucida Typewriter,monospace;}"
          )
        );
      } else if (font === "georgia") {
        style.appendChild(document.createTextNode("body { font-family: Georgia,Times,Times New Roman,serif;}"));
      } else if (font === "verdana") {
        style.appendChild(document.createTextNode("body { font-family: Verdana,Geneva,sans-serif;}"));
      } else if (font === "klavika") {
        style.appendChild(document.createTextNode("body {font-family: 'Klavika';}"));
        style.appendChild(
          document.createTextNode(
            "@font-face {font-family: 'Klavika';src: url('/fonts/klavika-rg/Klavika-Regular.otf') format('truetype');font-weight: normal;font-style: normal;}"
          )
        );
        style.appendChild(
          document.createTextNode(
            "@font-face {font-family: 'Klavika';src: url('/fonts/klavika-rg/Klavika-Bold.otf') format('truetype');font-weight: bold;font-style: normal;}"
          )
        );
      }
      document.head.appendChild(style);
    },

    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    remainingNet() {
      if (this.sheet.length > 0) {
        let total = this.sheet[0].total_invoice_net;
        for (let i = 1; i < this.sheet.length; i++) {
          const element = this.sheet[i];
          total -= element.total_invoice_net;
        }
        return total;
      } else {
        return 0;
      }
    },
    remainingGross() {
      if (this.sheet.length > 0) {
        let total = this.sheet[0].total_invoice_gross;
        for (let i = 1; i < this.sheet.length; i++) {
          const element = this.sheet[i];
          total -= element.total_invoice_gross;
        }
        return total;
      } else {
        return 0;
      }
    },
    projectStandNet() {
      if (this.sheet.length == 0) return 0;
      return this.sheet[0].total_project_net - this.sheet[0].total_invoice_net;
    },
    projectStandGross() {
      if (this.sheet.length == 0) return 0;
      return this.sheet[0].total_project_gross - this.sheet[0].total_invoice_gross;
    },
    mapStatus(status) {
      const result = this.statusOptions.filter(item => item.value === status);
      if (result.length > 0) {
        if (this.lang === "de") {
          return result[0].de;
        } else {
          return result[0].en;
        }
      } else {
        return null;
      }
    }
  }
};
</script>

<style scoped>
.first-page {
  margin-left: 7%;
  margin-right: 7%;
}

.first-page #content {
  width: 100%;
}

.first-page #content #title {
  margin-bottom: 100px;
}

.first-page #content #info {
  text-align: left;
  margin-bottom: 100px;
}

.first-page #footer {
  margin-top: 400px;
}

.first-page #footer #footer-content {
  justify-content: center;
  width: 100%;
}

h1 {
  font-size: 45px;
  margin-bottom: 0px;
}

h3 {
  font-size: 23px;
  margin-top: 0px;
}

#header {
  margin-left: 7%;
  margin-right: 7%;
}

#footer {
  margin-left: 7%;
  margin-right: 7%;
}
</style>

<style>
body {
  display: block;
  color: black;
  line-height: 1.1;
  background-color: #fff;
  font-size: 11px !important;
}

p {
  margin-bottom: 0;
}

i {
  color: #000 !important;
}

hr {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
