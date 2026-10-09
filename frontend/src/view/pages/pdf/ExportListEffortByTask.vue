<template>
  <div>
    <div id="header">
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: left; width: 50%">
            <h6 style="font-weight: bold">
              {{
                lang === "de"
                  ? "Aufwand nach Aufgaben und Mitarbeiteraufgaben"
                  : "Expenses according to tasks and employees"
              }}
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

    <div class="first-page" ref="content" id="export-report">
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
          <td style="width: 10%; padding-top: 5px; border-right: 1px solid black">
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "Aufwand" : "Expense" }}
            </div>
          </td>
          <td style="width: 40%; padding-top: 5px"></td>
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
          <td
            style="
              width: 10%;
              padding-bottom: 5px;
              border-right: 1px solid black;
            "
          >
            <div style="text-align: right; padding-right: 5px">
              {{ lang === "de" ? "(Betrag)" : "(Amount)" }}
            </div>
          </td>
          <td style="width: 40%; padding-bottom: 5px"></td>
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
            <td style="width: 10%; border-right: 1px solid black"></td>
            <td style="width: 40%"></td>
          </tr>

          <!-- Fill Task -->
          <div v-for="(task, j) in item.tasks" :key="j" style="display: contents">
            <tr>
              <td style="width: 10%"></td>
              <td style="width: 25%; padding-left: 20px; font-weight: bold;">
                {{ task.name }}
              </td>
              <td style="width: 5%"></td>
              <td style="width: 10%; border-right: 1px solid black"></td>
              <td style="width: 10%; border-right: 1px solid black"></td>
              <td style="width: 40%"></td>
            </tr>

            <div v-for="(staff, k) in task.staffs" :key="k" style="display: contents">
              <tr>
                <td style="width: 10%"></td>
                <td style="width: 25%; padding-left: 30px">
                  <div style="page-break-inside: avoid; margin: 8px 0 8px 0; font-weight: bold;">
                    {{ staff.name }}
                  </div>
                </td>
                <td style="width: 5%">
                  <div style="text-align: right; padding-right: 5px">
                    {{ staff.rate.toFixed(2) }}
                  </div>
                </td>
                <td style="width: 10%; border-right: 1px solid black"></td>
                <td style="width: 10%; border-right: 1px solid black"></td>
                <td style="width: 40%"></td>
              </tr>

              <!-- Fill Log -->
              <div v-for="(log, l) in staff.logs" :key="l" style="display: contents">
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
                  <td
                    style="
                    width: 10%;
                    text-align: right;
                    padding-right: 5px;
                    border-right: 1px solid black;
                  "
                  >
                    <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                      {{ formatMoney(log.effort) }}
                    </div>
                  </td>
                  <td style="width: 40%; padding-left: 5px">
                    {{ log.comment }}
                  </td>
                </tr>
              </div>

              <!-- Staff Total Effort -->
              <tr>
                <td style="width: 10%"></td>
                <td style="width: 25%; padding-left: 30px">
                  <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                    {{ "Total " + staff.name }}
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
                <td
                  style="
                  width: 10%;
                  text-align: right;
                  padding-right: 5px;
                  border-right: 1px solid black;
                "
                >
                  <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                    {{ formatMoney(staff.total_effort) }}
                  </div>
                </td>
                <td style="width: 40%"></td>
              </tr>
            </div>

            <!-- Task Total Effort -->
            <tr>
              <td style="width: 10%"></td>
              <td style="width: 25%; padding-left: 20px">
                <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                  {{ "Total " + task.name }}
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
                  {{ task.total_hours.toFixed(2) }}
                </div>
              </td>
              <td
                style="
                  width: 10%;
                  text-align: right;
                  padding-right: 5px;
                  border-right: 1px solid black;
                "
              >
                <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                  {{ formatMoney(task.total_effort) }}
                </div>
              </td>
              <td style="width: 40%"></td>
            </tr>
          </div>

          <!-- Phase Total Effort -->
          <tr style="border-bottom: 1px solid black">
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
            <td
              style="
                  width: 10%;
                  text-align: right;
                  padding-right: 5px;
                  border-right: 1px solid black;
                "
            >
              <div style="page-break-inside: avoid; margin: 2px 0 2px 0">
                {{ calculatePhaseEffort(i) }}
              </div>
            </td>
            <td style="width: 40%"></td>
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
              {{ pr_hour.toFixed(2) }}
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
              {{ formatMoney(pr_effort) }}
            </div>
          </td>
          <td style="width: 40%; border-top: 1px solid black"></td>
        </tr>
      </table>
    </div>

    <div id="footer">
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
import { GET_EFFORT_REPORT } from "@/core/services/store/report";
import { generatePdf, generateHTMLToPDF } from "@/common/generatePdfUtils";
import { formatDate } from "@/common";

export default {
  name: "exportListPhaseEffort",
  data() {
    return {
      today: "",
      sheet: [],
      pr_number: "",
      pr_name: "",
      pr_hour: 0.0,
      pr_effort: 0.0
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
      company_id: this.$route.query.company_id,
      start: this.$route.query.start,
      end: this.$route.query.end
    });
    this.today = moment().format("DD.MM.YYYY");
    this.initFont();
    this.initData();
    this.calculateTotalEffort();
    this.calculateTotalHour();

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
      if (this.currentEffortReport.length > 0) {
        this.pr_number = this.currentEffortReport[0].number;
        this.pr_name = this.currentEffortReport[0].name;
        //group product
        let sv_group = [];
        for (const record of this.currentEffortReport) {
          if (record.product_name) {
            let item = {
              name: record.product_name,
              tasks: []
            };
            sv_group.push(item);
          }
        }
        //filter unique product
        let sv_unique = Array.from(new Set(sv_group.map(item => item.name))).map(name => {
          return sv_group.find(item => item.name === name);
        });
        //group task
        for (const sv of sv_unique) {
          let t_group = [];
          for (const record of this.currentEffortReport) {
            if (record.product_name === sv.name) {
              if (record.task) {
                let task = {
                  name: record.task,
                  total_hours: 0.0,
                  total_effort: 0.0,
                  staffs: []
                };
                t_group.push(task);
              }
            }
          }
          // filter unique task
          let t_unique = Array.from(new Set(t_group.map(item => item.name))).map(name => {
            return t_group.find(item => item.name === name);
          });
          //group staff
          for (const t of t_unique) {
            let st_group = [];
            for (const record of this.currentEffortReport) {
              if (record.task === t.name) {
                if (record.staff_id) {
                  let staff = {
                    id: record.staff_id,
                    name: record.staff_name ? record.staff_name : "",
                    job: record.job,
                    rate: record.rate,
                    total_hours: 0.0,
                    total_effort: 0.0,
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
            // fill log
            for (const st of st_unique) {
              let sum = 0.0;
              let time = 0.0;
              st.job += " " + st.id;
              for (const record of this.currentEffortReport) {
                if (st.id === record.staff_id && t.name === record.task && sv.name === record.product_name) {
                  if (record.hours > 0 || record.comment) {
                    let log = {
                      date: formatDate(record.date),
                      hours: record.hours,
                      effort: parseFloat(record.hours) * parseFloat(st.rate),
                      comment: record.comment
                    };
                    time += parseFloat(log.hours);
                    sum += parseFloat(log.effort);
                    st.logs.push(log);
                  }
                }
              }
              st.total_effort = sum;
              st.total_hours = time;
              t.total_hours += time;
              t.total_effort += sum;
              sum = 0.0;
              time = 0.0;
            }
            t.staffs = st_unique;
            st_group = [];
          }
          sv.tasks = t_unique;
          t_group = [];
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
    calculateTotalEffort() {
      let sum = 0.0;
      let total = 0.0;
      if (this.sheet.length > 0) {
        for (const product of this.sheet) {
          for (const task of product.tasks) {
            sum += parseFloat(task.total_effort);
          }
          total += sum;
          sum = 0.0;
        }
      }
      this.pr_effort = total;
    },
    calculateTotalHour() {
      let sum = 0.0;
      let total = 0.0;
      if (this.sheet.length > 0) {
        for (const product of this.sheet) {
          for (const task of product.tasks) {
            sum += parseFloat(task.total_hours);
          }
          total += sum;
          sum = 0.0;
        }
      }
      this.pr_hour = total;
    },
    calculatePhaseHour(index) {
      let sum = 0.0;
      if (this.sheet.length > 0) {
        for (let i = 0; i < this.sheet.length; i++) {
          if (index === i) {
            for (const task of this.sheet[i].tasks) {
              sum += parseFloat(task.total_hours);
            }
          }
        }
      }
      return sum.toFixed(2);
    },
    calculatePhaseEffort(index) {
      let sum = 0.0;
      if (this.sheet.length > 0) {
        for (let i = 0; i < this.sheet.length; i++) {
          if (index === i) {
            for (const task of this.sheet[i].tasks) {
              sum += parseFloat(task.total_effort);
            }
          }
        }
      }
      return this.formatMoney(sum);
    },

    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
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
