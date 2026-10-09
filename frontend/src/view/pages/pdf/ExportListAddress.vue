<template>
  <div ref="content" id="export-report">
    <!-- <div id="header">
      <table style="width: 100%; table-layout: auto">
        <tr>
          <td style="text-align: left; width: 50%">
            <h4 style="font-weight: bold">
              {{ lang === "de" ? "Liste der Adressen" : "List of addresses" }}
            </h4>
          </td>
          <td style="text-align: right; width: 50%">
            <div>{{ currentCompany.name }}</div>
            <div v-if="currentSettings.master_data.address">
              {{ currentSettings.master_data.address }}
            </div>
          </td>
        </tr>
      </table>
    </div> -->

    <div class="first-page">
      <hr style="border-top: 1px solid #333; margin-top: 50px; margin-bottom: 5px" />
      <table style="width: 100%; justify-content: center">
        <tr>
          <td style="width: 20%">
            <div style="font-size: 14px">
              {{ lang === "de" ? "Firma" : "Name" }}
            </div>
          </td>
          <td style="width: 10%">
            <div style="font-size: 14px; margin-left: 5px">
              {{ lang === "de" ? "Kategorie" : "Category" }}
            </div>
          </td>
          <td style="width: 20%">
            <div style="font-size: 14px; margin-left: -10px;">
              {{ lang === "de" ? "Adresse" : "Address" }}
            </div>
          </td>
          <td style="width: 5%">
            <div style="font-size: 14px; margin-left: -60px;">
              {{ lang === "de" ? "Postleitzahl" : "Postal code" }}
            </div>
          </td>
          <td style="width: 15%">
            <div style="font-size: 14px; margin-left: -10px;">
              {{ lang === "de" ? "Ort" : "Location" }}
            </div>
          </td>
          <td style="width: 15%">
            <div style="font-size: 14px; margin-left:-70px ">Email</div>
          </td>
          <td style="width: 20%">
            <div style="font-size: 14px; margin-left: 23px">
              {{ lang === "de" ? "Tel" : "Phone" }}
            </div>
          </td>
        </tr>
      </table>

      <hr style="border-top: 1px solid #333; margin-top: 5px" />
      <table
        style="
          width: 100%;
          margin-top: 10px;
          justify-content: center;
          border-collapse: collapse;
          page-break-inside: auto;
        "
      >
        <div v-for="(item, i) in currentAddressReport" :key="i" style="display: contents">
          <tr>
            <td style="width: 25%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 0 4px 0;
                "
              >
                {{ item.company ? item.company : item.first_name + " " + item.last_name }}
              </div>
            </td>
            <td style="width: 10%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 4px 4px 26px;
                  margin-left: -5px;
                "
              >
                {{ mapCategory(item.category) }}
              </div>
            </td>
            <td style="width: 15%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 4px 4px 9px;
                "
              >
                {{ item.address }}
              </div>
            </td>
            <td style="width: 5%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 4px 4px 0;
                "
              >
                {{ item.postcode }}
              </div>
            </td>
            <td style="width: 10%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 4px 4px 40px;
                "
              >
                {{ item.place }}
              </div>
            </td>
            <td style="width: 5%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 0 4px 0;
                "
              >
                {{ item.email }}
              </div>
            </td>
            <td style="width: 30%">
              <div
                style="
                  font-size: 13px;
                  page-break-inside: avoid;
                  margin: 4px 4px 4px 4px;
                  margin-left: 10px;
                "
              >
                {{ item.phone }}
              </div>
            </td>
          </tr>
        </div>
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
import { GET_ADDRESS_REPORT } from "@/core/services/store/report";
import { generateHTMLToPDF } from "@/common/generatePdfUtils";
import { formatDate } from "@/common";

export default {
  name: "exportListAddress",
  data() {
    return {
      today: "",
      categories: [
        { name: this.$t("address.catAcquisition"), code: "acquisition" },
        { name: this.$t("address.catCustomer"), code: "customer" },
        { name: this.$t("address.catSupplier"), code: "supplier" }
      ]
    };
  },
  computed: {
    ...mapGetters(["currentCompany", "currentSettings", "currentAddressReport"]),
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
    await this.$store.dispatch(GET_ADDRESS_REPORT);
    this.today = moment().format("DD.MM.YYYY");
    this.initFont();

    const props = {
      title: "address",
      listName: this.lang === "de" ? "Liste der Adressen" : "List of addresses",
      company: this.currentCompany.name,
      companyAddress: this.currentSettings.master_data.address,
      date: this.today,
      orientation: "l"
    };
    // Generate PDF
    const isDownload = this.$route.query.download === "true";
    if (isDownload) {
      const content = this.$refs.content;

      this.$nextTick(() => {
        //console.log("test");
        // Generate to PDF
        //const blob = generateHTMLToPDF(content, 1150, [30, 0, 45, 0], props);
        //console.log("blob", blob);
      });
    }
  },
  methods: {
    formatDate,
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

    mapCategory(code) {
      for (const item of this.categories) {
        if (code === item.code) {
          return item.name;
        }
      }
    }
  }
};
</script>

<style scoped>
.first-page {
  padding-left: 85px;
  padding-right: 85px;
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
  margin-left: 85px;
  margin-right: 85px;
  margin-bottom: 10px;
  margin-top: -10px;
}

#footer {
  margin-left: 85px;
  margin-right: 85px;
  margin-top: 20px;
}
</style>

<style>
body {
  display: block;
  color: black;
  line-height: 1.1;
  background-color: #fff;
  font-size: 14px !important;
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
