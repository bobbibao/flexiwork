<template>
  <div>
    <div id="header">
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: left; width: 50%">
            <h6 style="font-weight: bold">
              {{
                lang === "de"
                  ? "Aufwand extern nach Aufträgen, Teilleistungen und Honorarkategorien"
                  : "External expenses according to orders, partial services and fee categories"
              }}
              {{ $t("report.listEffortExternal") }}
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
        <!-- Table Header -->
        <tr style="border-top: 1px solid black">
          <td style="width: 10%; padding-top: 5px">
            {{ lang === "de" ? "Auftrag" : "Order" }}
          </td>
          <td style="width: 25%; padding-top: 5px"></td>
          <td style="width: 5%; padding-top: 5px"></td>
          <td style="width: 10%; padding-top: 5px; border-right: 1px solid black">
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "Aufwand" : "Expense" }}
            </div>
          </td>
          <td style="width: 50%; padding-top: 5px"></td>
        </tr>

        <tr style="border-bottom: 1px solid black">
          <td style="width: 10%; padding-bottom: 5px">Nr.</td>
          <td style="width: 25%; padding-bottom: 5px">
            {{ lang === "de" ? "Bezeichnung" : "Designation" }}
          </td>
          <td style="width: 5%; padding-bottom: 5px"></td>
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
          <td style="width: 50%; padding-bottom: 5px"></td>
        </tr>

        <!-- Project Info -->
        <tr>
          <td style="width: 10%; padding-top: 5px">
            {{ pr_number }}
          </td>
          <td style="width: 25%; padding-top: 5px">
            {{ pr_name }}
          </td>
          <td style="width: 5%; padding-top: 5px"></td>
          <td style="width: 10%; padding-top: 5px; border-right: 1px solid black"></td>
          <td style="width: 50%; padding-top: 5px"></td>
        </tr>

        <!-- Fill Service -->
        <div v-for="(item, i) in sheet" :key="i" style="display: contents">
          <tr>
            <td style="width: 10%"></td>
            <td style="width: 25%; padding-left: 10px">
              <div
                style="
                  page-break-inside: avoid;
                  margin: 8px 0 8px 0;
                  font-weight: bold;
                "
              >
                {{ item.name }}
              </div>
            </td>
            <td style="width: 5%"></td>
            <td style="width: 10%; border-right: 1px solid black"></td>
            <td style="width: 50%"></td>
          </tr>

          <!-- Fill Staff -->
          <div v-for="(staff, j) in item.staffs" :key="j" style="display: contents">
            <tr>
              <td style="width: 10%"></td>
              <td style="width: 25%; padding-left: 20px; font-weight: bold">
                {{ staff.job }}
              </td>
              <td style="width: 5%"></td>
              <td style="width: 10%; border-right: 1px solid black"></td>
              <td style="width: 50%"></td>
            </tr>

            <!-- Fill Log -->
            <div v-for="(log, k) in staff.logs" :key="k" style="display: contents">
              <tr>
                <td style="width: 10%"></td>
                <td style="width: 25%; padding-left: 30px">
                  <div style="page-break-inside: avoid; margin: 2px 0 2px 8px">
                    {{ log.date }}
                  </div>
                </td>
                <td style="width: 5%"></td>
                <td
                  style="
                    width: 10%;
                    text-align: right;
                    padding-right: 5px;
                    border-right: 1px solid black;
                  "
                >
                  <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                    {{ log.hours.toFixed(2) }}
                  </div>
                </td>
                <td style="width: 50%; padding-left: 5px">
                  {{ log.task }}
                </td>
              </tr>
            </div>

            <!-- Staff Total Effort -->
            <tr>
              <td style="width: 10%"></td>
              <td style="width: 25%; padding-left: 20px">
                <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                  {{ "Total " + staff.job }}
                </div>
              </td>
              <td style="width: 5%"></td>
              <td
                style="
                  width: 10%;
                  text-align: right;
                  padding-right: 5px;
                  border-right: 1px solid black;
                "
              >
                <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                  {{ staff.total_hours.toFixed(2) }}
                </div>
              </td>
              <td style="width: 50%"></td>
            </tr>
          </div>

          <!-- Phase Total Effort -->
          <tr>
            <td style="width: 10%"></td>
            <td style="width: 25%; padding-left: 10px">
              <div
                style="
                  page-break-inside: avoid;
                  margin: 2px 0 2px 0;
                  font-weight: bold;
                "
              >
                Total {{ item.name }}
              </div>
            </td>
            <td style="width: 5%"></td>
            <td
              style="
                width: 10%;
                text-align: right;
                padding-right: 5px;
                border-right: 1px solid black;
              "
            >
              <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                {{ calculatePhaseHour(i) }}
              </div>
            </td>
            <td style="width: 50%"></td>
          </tr>
        </div>

        <!-- Project Total Effort -->
        <tr>
          <td style="border-top: 1px solid black" colspan="3">
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0px 0px 0px;
                font-weight: bold;
              "
            >
              {{ `Total ${pr_number} ${pr_name}` }}
            </div>
          </td>
          <td
            style="
              width: 10%;
              text-align: right;
              padding-right: 5px;
              border-top: 1px solid black;
              border-right: 1px solid black;
            "
          >
            <div
              style="
                page-break-inside: avoid;
                margin: 4px 0 2px 0;
                font-weight: bold;
              "
            >
              {{ pr_hours.toFixed(2) }}
            </div>
          </td>
          <td style="width: 50%; border-top: 1px solid black"></td>
        </tr>
      </table>
    </div>

    <!-- <div id="footer">
      <hr style="border-top: 1px solid #333; margin-top: 0px" />
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: right; width: 100%">
            <div><span class="pageNumber"></span>/<span class="totalPages"></span></div>
            <div>{{ today }}</div>
          </td>
        </tr>
      </table>
    </div> -->
  </div>
</template>

<script>
import moment from "moment";
import { mapGetters } from "vuex";
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";
import { GET_EFFORT_REPORT } from "@/core/services/store/report";
import { generateHTMLToPDF } from "@/common/generatePdfUtils";
import { formatDate } from "@/common";

export default {
  name: "exportListEffortInternal",
  data() {
    return {
      today: "",
      sheet: [],
      pr_number: "",
      pr_name: "",
      pr_hours: 0.0
    };
  },
  computed: {
    ...mapGetters(["currentCompany", "currentSettings", "currentEffortReport"]),
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
    await this.$store.dispatch(GET_EFFORT_REPORT, {
      id: this.$route.params.project_id,
      start: this.$route.query.start,
      end: this.$route.query.end,
      company_id: this.$route.query.company_id
    });
    this.today = moment().format("DD.MM.YYYY");
    this.initFont();
    this.initData();
    this.calculateTotalHour();

    // Generate PDF
    const props = {
      title: "singleProjectExternalWithoutRate",
      listName:
        this.lang === "de"
          ? "Aufwand extern nach Aufträgen, Teilleistungen und Honorarkategorien"
          : "External expenses according to orders, partial services and fee categories",
      company: this.currentCompany.name,
      companyAddress: this.currentSettings.master_data.address,
      date: this.today,
      orientation: "p",
      lang: this.lang
    };
    // Generate PDF
    const isDownload = this.$route.query.download === "true";
    if (isDownload) {
      const content = this.$refs.content;

      // this.$nextTick(() => {
      //   generateHTMLToPDF(content, 1150, [36, 0, 45, 0], props);
      // });
    }
  },
  methods: {
    formatDate,
    initData() {
      if (this.currentEffortReport.length > 0) {
        this.pr_number = this.currentEffortReport[0].number;
        this.pr_name = this.currentEffortReport[0].name;
        //group product
        let sv_group = [];
        for (const record of this.currentEffortReport) {
          if (record.product_name) {
            let item = {
              name: record.product_name,
              staffs: []
            };
            sv_group.push(item);
          }
        }
        //filter unique product
        let sv_unique = Array.from(new Set(sv_group.map(item => item.name))).map(name => {
          return sv_group.find(item => item.name === name);
        });
        //group staff
        for (const sv of sv_unique) {
          let st_group = [];
          for (const record of this.currentEffortReport) {
            if (record.product_name === sv.name) {
              if (record.staff_id) {
                let staff = {
                  id: record.staff_id,
                  name: record.staff_name ? record.staff_name : "",
                  job: record.job,
                  total_hours: 0.0,
                  logs: []
                };
                st_group.push(staff);
              }
            }
          }
          // filter unique staff
          let st_unique = Array.from(new Set(st_group.map(item => item.id))).map(id => {
            return st_group.find(item => item.id === id);
          });
          // fill log and handle job title
          let count = 1;
          let job = st_unique[0].job;
          for (const st of st_unique) {
            let time = 0.0;
            if (st.job === job) {
              st.job += " " + count;
              count++;
            } else {
              job = st.job;
              count = 1;
              st.job += " " + count;
            }
            for (const record of this.currentEffortReport) {
              if (st.id === record.staff_id && sv.name === record.product_name) {
                if (record.hours > 0 || record.comment) {
                  let log = {
                    date: formatDate(record.date),
                    hours: record.hours,
                    comment: record.comment,
                    task: record.task
                  };
                  time += parseFloat(log.hours);
                  st.logs.push(log);
                }
              }
            }
            st.total_hours = time;
            time = 0.0;
          }
          sv.staffs = st_unique;
          st_group = [];
        }
        this.sheet = sv_unique;
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
    calculateTotalHour() {
      let sum = 0.0;
      if (this.sheet.length > 0) {
        for (const product of this.sheet) {
          for (const staff of product.staffs) {
            sum += parseFloat(staff.total_hours);
          }
        }
      }
      this.pr_hours = sum;
    },
    calculatePhaseHour(index) {
      let sum = 0.0;
      if (this.sheet.length > 0) {
        for (let i = 0; i < this.sheet.length; i++) {
          if (index === i) {
            for (const staff of this.sheet[i].staffs) {
              sum += parseFloat(staff.total_hours);
            }
          }
        }
      }
      return sum.toFixed(2);
    }
  }
};
</script>

<style scoped>
.first-page {
  padding-left: 120px;
  padding-right: 60px;
  margin-bottom: -10px;
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
  margin-left: 120px;
  margin-right: 60px;
  margin-bottom: 10px;
  margin-top: 10px;
}

#footer {
  margin-left: 85px;
  margin-right: 40px;
  margin-top: 20px;
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
</style>
