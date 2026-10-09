<template>
  <div>
    <div id="header">
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: left; width: 50%">
            <h6 style="font-weight: bold">
              {{ lang === "de" ? "Aufwand nach Mitarbeitern und Aufträgen" : "Employee expenses according to orders" }}
            </h6>
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

    <div ref="content" class="first-page" id="export-report">
      <div style="margin-bottom: 10px">
        {{ (lang === "de" ? "Datum: " : "Date ") + today }}
      </div>
      <div style="margin-bottom: 10px">
        {{
          (lang === "de" ? "Daten von: " : "Data from: ") +
            formatDate($route.query.start) +
            " - " +
            formatDate($route.query.end)
        }}
      </div>

      <table
        style="
          width: 100%;
          justify-content: center;
          border-collapse: collapse;
          page-break-inside: auto;
        "
      >
        <tr style="border-top: 1px solid black">
          <td style="width: 10%; padding-top: 5px">
            {{ renderShortName(user_info?.first_name, user_info?.last_name) }}
          </td>
          <td style="width: 90%; padding-top: 5px; font-weight: bold">
            {{ (user_info?.first_name ?? "") + " " + (user_info?.last_name ?? "") }}
          </td>
        </tr>
        <tr>
          <td style="width: 10%; padding-top: 5px"></td>
          <td style="width: 90%; padding-top: 5px">
            {{ user_info?.address ?? "" }}
          </td>
        </tr>
        <tr>
          <td style="width: 10%; padding-top: 5px; padding-bottom: 5px"></td>
          <td style="width: 90%; padding-top: 5px; padding-bottom: 5px">
            {{ (user_info?.postcode ?? "") + " " + (user_info?.place ?? "") }}
          </td>
        </tr>
      </table>

      <table
        style="
          width: 100%;
          justify-content: center;
          border-collapse: collapse;
          page-break-inside: auto;
        "
      >
        <tr style="border-top: 1px solid black">
          <td style="width: 10%; padding-top: 5px">
            {{ lang === "de" ? "Auftrag" : "Order" }}
          </td>
          <td style="width: 30%; padding-top: 5px"></td>
          <td style="width: 10%; padding-top: 5px; border-right: 1px solid black">
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "Aufwand" : "Expense" }}
            </div>
          </td>
          <td style="width: 10%; padding-top: 5px; border-right: 1px solid black">
            <div style="text-align: right; padding-right: 5px">in % zu</div>
          </td>
          <td style="width: 40%; padding-top: 5px"></td>
        </tr>

        <tr style="border-bottom: 1px solid black">
          <td style="width: 10%; padding-bottom: 5px">Nr.</td>
          <td style="width: 30%; padding-bottom: 5px">
            {{ lang === "de" ? "Bezeichnung" : "Designation" }}
          </td>
          <td
            style="
              width: 10%;
              padding-bottom: 5px;
              border-right: 1px solid black;
            "
          >
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "(Stunden)" : "(Hours)" }}
            </div>
          </td>
          <td
            style="
              width: 10%;
              padding-bottom: 5px;
              border-right: 1px solid black;
            "
          >
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "Stundentotal" : "Total Hours" }}
            </div>
          </td>
          <td style="width: 25%; padding-bottom: 5px"></td>
        </tr>

        <!-- Billable -->
        <tr>
          <td style="width: 10%; border-top: 1px solid black;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Auftragsbezogene Aufträge" : "Order-related orders" }}
            </div>
          </td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td style="width: 25%; padding-top: 5px; border-top: 1px solid black;"></td>
        </tr>

        <div v-for="(item, i) in sheet.billable" :key="'Billable-' + i" style="display: contents">
          <tr>
            <td style="width: 10%;"></td>
            <td style="width: 10%;">
              <div
                style="
                  page-break-inside: avoid;
                  margin: 4px 0 4px 0;
                "
              >
                {{ item.number + " " + item.name }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
              {{ item.effort.toFixed(2) }}
            </td>
            <td style="width: 10%; padding-top: 5px; border-right: 1px solid black"></td>
            <td style="width: 25%; padding-top: 5px"></td>
          </tr>
        </div>

        <tr>
          <td style="width: 10%;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Total Auftragsbezogene Aufträge" : "Total Order-related orders" }}
            </div>
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ calculateTotal(sheet.billable) }}
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ is_empty_sheet ? "100.00" : calculatePercent(sheet.billable) }}
          </td>
        </tr>

        <!-- Internal -->
        <tr>
          <td style="width: 10%; border-top: 1px solid black;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Nicht-auftragsbezogene Aufträge" : "Non-order-related orders" }}
            </div>
          </td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td style="width: 25%; padding-top: 5px; border-top: 1px solid black;"></td>
        </tr>

        <div v-for="(item, i) in sheet.internal" :key="'Internal-' + i" style="display: contents">
          <tr>
            <td style="width: 10%;"></td>
            <td style="width: 10%;">
              <div
                style="
                  page-break-inside: avoid;
                  margin: 4px 0 4px 0;
                "
              >
                {{ item.name }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
              {{ item.effort.toFixed(2) }}
            </td>
            <td style="width: 10%; padding-top: 5px; border-right: 1px solid black"></td>
            <td style="width: 25%; padding-top: 5px"></td>
          </tr>
        </div>

        <tr>
          <td style="width: 10%;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Total Nicht-auftragsbezogene Aufträge" : "Total Non-order-related orders" }}
            </div>
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ calculateTotal(sheet.internal) }}
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ calculatePercent(sheet.internal) }}
          </td>
        </tr>

        <!-- Holiday -->
        <tr>
          <td style="width: 10%; border-top: 1px solid black;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Absenzen" : "Absences" }}
            </div>
          </td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          ></td>
          <td style="width: 25%; padding-top: 5px; border-top: 1px solid black;"></td>
        </tr>

        <div v-for="(item, i) in sheet.holiday" :key="'Holiday-' + i" style="display: contents">
          <tr>
            <td style="width: 10%;"></td>
            <td style="width: 10%;">
              <div
                style="
                  page-break-inside: avoid;
                  margin: 4px 0 4px 0;
                "
              >
                {{ item.task }}
              </div>
            </td>
            <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
              {{ item.effort.toFixed(2) }}
            </td>
            <td style="width: 10%; padding-top: 5px; border-right: 1px solid black"></td>
            <td style="width: 25%; padding-top: 5px"></td>
          </tr>
        </div>

        <tr>
          <td style="width: 10%;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
              "
            >
              {{ lang === "de" ? "Total Absenzen" : "Total Absences" }}
            </div>
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ calculateTotal(sheet.holiday) }}
          </td>
          <td style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black">
            {{ calculatePercent(sheet.holiday) }}
          </td>
        </tr>

        <tr>
          <td style="width: 10%; border-top: 1px solid black;" colspan="2">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
                font-weight: bold;
              "
            >
              {{ lang === "de" ? "Total effektive Stunden" : "Total effective hours" }}
            </div>
          </td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          >
            {{ (e_effort ?? 0).toFixed(2) }}
          </td>
          <td
            style="width: 10%; text-align: right; padding-right: 5px; border-right: 1px solid black; border-top: 1px solid black;"
          >
            100.00
          </td>
          <td style="width: 25%; padding-top: 5px; border-top: 1px solid black;"></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import currency from "currency.js";
import { mapGetters, mapState } from "vuex";
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";
import { GET_USER_PROJECT_REPORT } from "@/core/services/store/report";
import { generateHTMLToPDF } from "@/common/generatePdfUtils";
import { formatDate } from "@/common";

export default {
  name: "exportListEffortInternal",
  data() {
    return {
      today: "",
      sheet: {
        billable: [],
        internal: [],
        holiday: []
      },
      e_effort: 0.0,
      is_empty_sheet: false
    };
  },
  computed: {
    ...mapGetters(["currentCompany", "currentSettings", "currentUserProjectReport"]),
    ...mapState({
      user_info: state => state.report.user_info
    }),
    lang() {
      if (this.$route.query.lang) {
        return this.$route.query.lang;
      } else {
        return "de";
      }
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_USER_PROJECT_REPORT, {
      id: this.$route.params.user_id,
      start: this.$route.query.start,
      end: this.$route.query.end
    });
    this.today = moment().format("DD.MM.YYYY");
    this.initFont();
    this.initData();
    this.isEmptySheet();
    this.calculateTotalEffort();

    const props = {
      title: "listEmployeeEffort",
      listName:
        this.lang === "de" ? "Aufwand nach Mitarbeitern und Aufträgen" : "Employee expenses according to orders",
      company: this.currentCompany.name,
      companyAddress: this.currentSettings.master_data.address,
      date: this.today,
      orientation: "p"
    };
    // Generate PDF
    const isDownload = this.$route.query.download === "true";
    if (isDownload) {
      const content = this.$refs.content;

      // this.$nextTick(() => {
      //   generateHTMLToPDF(content, 1150, [30, 0, 45, 0], props);
      // });
    }
  },
  methods: {
    formatDate,
    initData() {
      if (this.currentUserProjectReport) {
        let pr = {
          billable: [],
          internal: [],
          holiday: []
        };
        for (const record of this.currentUserProjectReport.billable) {
          pr.billable.push({
            number: record.number,
            name: record.name,
            id: record.product_id,
            effort: 0.0
          });
        }
        for (const record of this.currentUserProjectReport.internal) {
          pr.internal.push({
            number: record.number,
            name: record.name,
            task: record.task,
            id: record.product_id,
            effort: 0.0
          });
        }
        for (const record of this.currentUserProjectReport.holiday) {
          pr.holiday.push({
            number: record.number,
            name: record.name,
            task: record.task,
            id: record.product_id,
            effort: 0.0
          });
        }
        //filter unique product
        let unique_billable = Array.from(new Set(pr.billable.map(item => item.number))).map(number => {
          return pr.billable.find(item => item.number === number);
        });
        let unique_internal = Array.from(new Set(pr.internal.map(item => item.number))).map(number => {
          return pr.internal.find(item => item.number === number);
        });
        let unique_holiday = Array.from(new Set(pr.holiday.map(item => item.task))).map(task => {
          return pr.holiday.find(item => item.task === task);
        });
        //group task
        for (const item of unique_billable) {
          for (const record of this.currentUserProjectReport.billable) {
            if (item.number === record.number) {
              item.effort += parseFloat(record.hours);
            }
          }
        }
        for (const item of unique_internal) {
          for (const record of this.currentUserProjectReport.internal) {
            if (item.task === record.task) {
              item.effort += parseFloat(record.hours);
            }
          }
        }
        for (const item of unique_holiday) {
          for (const record of this.currentUserProjectReport.holiday) {
            if (item.task === record.task) {
              item.effort += parseFloat(record.hours);
            }
          }
        }
        this.sheet.billable = unique_billable;
        this.sheet.internal = unique_internal;
        this.sheet.holiday = unique_holiday;
      } else {
        this.sheet = {
          billable: [],
          internal: [],
          holiday: []
        };
      }
    },
    calculateTotal(section) {
      let sum = 0.0;
      for (const item of section) {
        sum += parseFloat(item.effort);
      }
      return sum.toFixed(2);
    },
    calculatePercent(section) {
      let sum = 0.0;
      for (const item of section) {
        sum += parseFloat(item.effort);
      }
      return this.e_effort.toFixed(2) == "0.00" ? "0.00" : ((sum / this.e_effort) * 100).toFixed(2);
    },
    isEmptySheet() {
      if (this.sheet.billable.length === 0 && this.sheet.internal.length === 0 && this.sheet.holiday.length === 0) {
        this.is_empty_sheet = true;
      }
    },
    calculateTotalEffort() {
      let sum = 0.0;
      for (const product of this.sheet.billable) {
        sum += parseFloat(product.effort);
      }
      for (const product of this.sheet.internal) {
        sum += parseFloat(product.effort);
      }
      for (const product of this.sheet.holiday) {
        sum += parseFloat(product.effort);
      }
      this.e_effort = sum;
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
    renderShortName(first_name, last_name) {
      return (first_name?.charAt(0).toLowerCase() || "") + (last_name?.charAt(0).toLowerCase() || "");
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
  margin-top: 10px;
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
  font-size: 16px !important;
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

table {
  table-layout: fixed;
}
</style>
