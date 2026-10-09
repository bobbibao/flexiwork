<script>
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import { validationMixin } from "vuelidate";
import { required, sameAs, minLength } from "vuelidate/lib/validators";
import {
  LOGOUT,
  CHANGE_AVATAR,
  CHANGE_PASS,
  VERIFY_AUTH,
  GET_USER_HOLIDAYS,
  ADD_USER_HOLIDAY,
  DELETE_USER_HOLIDAY,
  SET_ERROR
} from "@/core/services/store/auth.module";
import { EXPORT_FLEXIBLE_REPORT } from "@/core/services/store/report";
import KTLayoutQuickUser from "@/assets/js/layout/extended/quick-user.js";
import KTOffcanvas from "@/assets/js/components/offcanvas.js";
import { mapGetters, mapState } from "vuex";
import { Avatar } from "@/components";
import { generatePdf, generateHTMLToPDF } from "@/common/generatePdfUtils";
import { generateExportFileName } from "@/common";
import { ReportExportCode } from "@/common/constants";
import { saveAs } from "file-saver";
import { formatDate } from "@/common";

export default {
  mixins: [validationMixin],
  name: "KTQuickUser",
  components: {
    Avatar
  },
  data() {
    return {
      form: {
        pass: "",
        newPass: "",
        repeatPass: ""
      },
      current_visible: "password",
      new_visible: "password",
      repeat_visible: "password",
      change_dialog: false,
      upload_dialog: false,
      holiday_dialog: false,
      report_dialog: false,
      confirm_delete_dialog: false,
      file: null,
      start: "",
      start_formatted: "",
      end: "",
      end_formatted: "",
      holidays: [],
      delete_holiday: "",
      start_report: "",
      end_report: "",
      start_report_formatted: "",
      end_report_formatted: "",
      locale: "de",
      is_loading: false
    };
  },
  validations: {
    form: {
      pass: {
        required,
        minLength: minLength(8)
      },
      newPass: {
        required,
        minLength: minLength(8)
      },
      repeatPass: {
        required,
        sameAsPassword: sameAs("newPass")
      }
    }
  },
  mounted() {
    // Init Quick User Panel
    KTLayoutQuickUser.init(this.$refs["kt_quick_user"]);
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
  },
  methods: {
    formatDate,
    async getHolidays() {
      await this.$store.dispatch(GET_USER_HOLIDAYS);
      if (this.error) {
        this.toastMsg("error", this.error);
      }
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    resetForm() {
      this.form = {
        pass: "",
        newPass: "",
        repeatPass: ""
      };
      this.current_visible = "password";
      this.new_visible = "password";
      this.repeat_visible = "password";
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    resetHolidays() {
      this.start = "";
      this.start_formatted = "";
      this.end = "";
      this.end_formatted = "";
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }

      if (this.is_loading) {
        return;
      }
      this.is_loading = true;

      await this.$store.dispatch(CHANGE_PASS, {
        data: {
          current_password: this.form.pass,
          password: this.form.newPass,
          confirm_password: this.form.repeatPass
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.change_dialog = false;
        this.toastMsg("success", this.$t("msg.changeSuccess"));
      }
      this.is_loading = false;
    },
    async onLogout() {
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      await this.$store.dispatch(LOGOUT).then(() => this.$router.push({ name: "login" }));
      this.is_loading = false;
    },
    closeOffcanvas() {
      new KTOffcanvas(KTLayoutQuickUser.getElement()).hide();
    },
    renderAvatar() {
      if (this.currentUser.email) {
        return this.currentUser.email.charAt(0);
      }
    },
    async updateAvatar() {
      await this.$store.dispatch(CHANGE_AVATAR, {
        id: this.currentUser.id,
        data: {
          file: this.file
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(VERIFY_AUTH);
        this.upload_dialog = false;
        this.resetForm();
      }
    },
    toggleReport() {
      this.start_report = moment()
        .startOf("year")
        .format("YYYY-MM-DD");
      this.end_report = moment()
        .endOf("year")
        .format("YYYY-MM-DD");
      this.start_report_formatted = moment()
        .startOf("year")
        .format("DD.MM.YYYY");
      this.end_report_formatted = moment()
        .endOf("year")
        .format("DD.MM.YYYY");
      this.report_dialog = !this.report_dialog;
    },
    resetReport() {
      this.start_report = moment()
        .startOf("year")
        .format("YYYY-MM-DD");
      this.end_report = moment()
        .endOf("year")
        .format("YYYY-MM-DD");
      this.start_report_formatted = moment()
        .startOf("year")
        .format("DD.MM.YYYY");
      this.end_report_formatted = moment()
        .endOf("year")
        .format("DD.MM.YYYY");
    },
    formatReportDate() {
      if (this.start_report) {
        this.start_report_formatted = formatDate(this.start_report);
      }
      if (this.end_report) {
        this.end_report_formatted = formatDate(this.end_report);
      }
    },
    async toggleHoliday() {
      await this.getHolidays();
      this.holiday_dialog = !this.holiday_dialog;
    },
    async addHoliday() {
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      await this.$store.dispatch(ADD_USER_HOLIDAY, {
        start_date: this.start,
        end_date: this.end
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.getHolidays();
        this.toastMsg("success", this.$t("msg.changeSuccess"));
        this.resetHolidays();
      }
      this.is_loading = false;
    },
    deleteHoliday(id) {
      this.delete_holiday = id;
      this.confirm_delete_dialog = !this.confirm_delete_dialog;
    },
    async confirmDeleteHoliday() {
      if (this.is_loading) {
        return;
      }
      this.is_loading = true;
      await this.$store.dispatch(DELETE_USER_HOLIDAY, {
        id: this.delete_holiday
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.getHolidays();
        this.confirm_delete_dialog = !this.confirm_delete_dialog;
        this.toastMsg("success", this.$t("msg.delSuccess"));
      }
      this.is_loading = false;
    },

    formatStartDate() {
      if (this.start) {
        this.start_formatted = formatDate(this.start);
        if (!this.end) {
          this.end = this.start;
          this.end_formatted = this.start_formatted;
        }
      }
    },
    formatEndDate() {
      if (this.end) {
        this.end_formatted = formatDate(this.end);
      }
    },
    setEndDate() {
      if (!this.end) {
        this.start = this.end;
        this.start_formatted = this.end_formatted;
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
      this.$store.commit(SET_ERROR, null);
    },
    toggleVisible(type) {
      if (type === "current") {
        if (this.current_visible === "password") {
          this.current_visible = "text";
        } else {
          this.current_visible = "password";
        }
      } else if (type === "new") {
        if (this.new_visible === "password") {
          this.new_visible = "text";
        } else {
          this.new_visible = "password";
        }
      } else {
        if (this.repeat_visible === "password") {
          this.repeat_visible = "text";
        } else {
          this.repeat_visible = "password";
        }
      }
    },
    async printHoliday() {
      // set spinner to button
      let button = this.$refs["kt_dl_holiday"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_FLEXIBLE_REPORT, {
          id: this.currentUser.id,
          start: this.start_report,
          end: this.end_report,
          lang: this.locale === "de" ? "de" : "en"
        });
        if (this.error) {
          throw new Error(this.error);
        }
        const from = formatDate(this.start_report);
        const to = formatDate(this.end_report);
        const contentWidth = 1150;
        const margins = [50, 0, 45, 0];

        const props = {
          title: "listEmployeeFlexible",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand nach Zusammenstellung Gleitzeit- und Feriensaldo"
              : "Expenses according to Flexible time and Holiday",
          subListName: from + " - " + to,
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              margin-left: 7%;
              margin-right: 7%;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.holiday_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EMPLOYEE_FLEX_AND_HOLIDAYS, {
          start_date: this.start_report,
          end_date: this.end_report,
          user: this.currentUser || {}
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },

    getIframeContent(url, pdfStyles) {
      return new Promise((resolve, reject) => {
        const fullUrl = new URL(url, window.location.origin);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        // Add load event listener
        iframe.onload = () => {
          try {
            setTimeout(() => {
              const exportElement = iframe.contentDocument.getElementById("export-report");
              if (!exportElement) {
                throw new Error("Element with id 'export-report' not found");
              }

              // Deep clone the element
              const clonedElement = exportElement.cloneNode(true);

              // Copy styles from iframe document
              const styles = iframe.contentDocument.getElementsByTagName("style");
              const styleSheet = document.createElement("style");
              for (let style of styles) {
                // Remove scoped attribute to allow styles to apply
                const css = style.innerHTML.replace(/\[data-v-\w+\]/g, "");
                styleSheet.appendChild(document.createTextNode(css));
              }
              clonedElement.appendChild(styleSheet);

              // Apply specific styles needed for PDF
              const pdfStyleSheet = document.createElement("style");
              pdfStyleSheet.appendChild(document.createTextNode(pdfStyles));
              clonedElement.appendChild(pdfStyleSheet);

              document.body.removeChild(iframe);
              resolve(clonedElement);
            }, 5000);
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        };

        iframe.onerror = error => {
          document.body.removeChild(iframe);
          reject(error);
        };

        iframe.src = fullUrl.toString();
      });
    },
    openPreviewHoliday() {
      window
        .open(
          `#/report/list-flexible-and-holiday/${this.currentUser.id}?start=${this.start_report}&end=${
            this.end_report
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    }
  },
  computed: {
    picture() {
      return process.env.BASE_URL + "media/users/300_21.jpg";
    },
    ...mapGetters(["currentUser", "currentUserHolidays", "currentSettings", "currentCompany"]),
    ...mapState({
      error: state => state.auth.error,
      holiday_pdf_code: state => state.report.holiday_pdf_code
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  }
};
</script>

<template>
  <div class="topbar-item">
    <div
      class="
        btn btn-icon
        w-auto
        btn-clean
        d-flex
        align-items-center
        btn-lg
        px-2
      "
      id="kt_quick_user_toggle"
    >
      <span
        class="
          text-muted
          font-weight-bold font-size-base
          d-none d-md-inline
          mr-1
        "
      >
        Hi,
      </span>
      <span
        class="
          text-dark-50
          font-weight-bolder font-size-base
          d-none d-md-inline
          mr-3
        "
      >
        {{ currentUser.email }}
      </span>
      <span class="symbol symbol-35 symbol-light-success">
        <Avatar v-if="currentUser.avatar_url" :filePath="currentUser.avatar_url" alt="Current user avatar" />
        <span v-else class="symbol-label font-size-h5 font-weight-bold text-uppercase">
          {{ renderAvatar() }}
        </span>
      </span>
    </div>

    <div id="kt_quick_user" ref="kt_quick_user" class="offcanvas offcanvas-right p-10">
      <!--begin::Header-->
      <div
        class="
          offcanvas-header
          d-flex
          align-items-center
          justify-content-between
          pb-5
        "
      >
        <h3 class="font-weight-bold m-0">
          {{ $t("title.profile") }}
        </h3>
        <a href="#" class="btn btn-xs btn-icon btn-light btn-hover-primary" id="kt_quick_user_close">
          <i class="ki ki-close icon-xs text-muted"></i>
        </a>
      </div>
      <!--end::Header-->

      <!--begin::Content-->
      <perfect-scrollbar class="offcanvas-content pr-5 mr-n5 scroll" style="max-height: 90vh; position: relative">
        <!--begin::Header-->
        <div class="d-flex align-items-center mt-5">
          <span class="symbol symbol-100 mr-5 symbol-light-success avatar" @click="upload_dialog = true">
            <Avatar v-if="currentUser.avatar_url" :filePath="currentUser.avatar_url" alt="Current user avatar" />
            <span v-else class="symbol-label font-size-h5 font-weight-bold text-uppercase">
              {{ renderAvatar() }}
            </span>
            <i class="flaticon-photo-camera edit-icon"></i>
          </span>
          <div class="d-flex flex-column">
            <a
              href="#"
              class="
                font-weight-bold font-size-h5
                text-dark-75 text-hover-primary
              "
            >
              {{ currentUser.email }}
            </a>
            <div class="text-muted text-capitalize mt-1">
              {{ currentUser.role }}
            </div>
          </div>
        </div>
        <div class="d-flex flex-column align-items-center mt-5">
          <button class="btn btn-light-primary btn-bold extend-btn" @click="change_dialog = true">
            {{ $t("button.changePass") }}
          </button>
          <button class="btn btn-light-primary btn-bold extend-btn mt-2" @click="toggleHoliday">
            {{ $t("button.holiday") }}
          </button>
          <button class="btn btn-light-primary btn-bold extend-btn mt-2" @click="toggleReport">
            {{ $t("button.timeReport") }}
          </button>
          <button class="btn btn-light-primary btn-bold extend-btn mt-2" @click="onLogout" :disabled="is_loading">
            {{ $t("button.logout") }}
          </button>
        </div>
        <!--end::Header-->
        <!-- <div class="separator separator-dashed mt-8 mb-5"></div>
        <div class="separator separator-dashed my-7"></div> -->
      </perfect-scrollbar>
      <!--end::Content-->
    </div>

    <!-- Upload Dialog -->
    <b-modal v-model="upload_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.changeAvatar')}`">
      <div class="col-md-12 p-0">
        <b-form-file
          v-model="file"
          :placeholder="`${$t('msg.selectFile')}`"
          :drop-placeholder="`${$t('msg.dropFile')}`"
          accept="image/jpeg, image/png"
        ></b-form-file>
      </div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="updateAvatar">
          {{ $t("button.upload") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Change Pass Dialog -->
    <b-modal
      v-model="change_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.changePass')}`"
      @close="resetForm"
    >
      <b-form class="form" @submit.stop.prevent="onSubmit">
        <b-form-group label-for="pass-input">
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              id="pass-input"
              name="pass-input"
              v-model="form.pass"
              :type="current_visible"
              :state="validateState('pass')"
              aria-describedby="pass-feedback"
              :placeholder="`${$t('dashboard.currentPass')}`"
            ></b-form-input>

            <b-input-group-append is-text @click="toggleVisible('current')">
              <i class="flaticon-eye" :class="current_visible === 'text' ? 'visible' : ''"></i>
            </b-input-group-append>

            <b-form-invalid-feedback id="pass-feedback">
              {{ $t("msg.required") }}
            </b-form-invalid-feedback>
          </b-input-group>
        </b-form-group>

        <b-form-group label-for="newpass-input">
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              id="newpass-input"
              name="newpass-input"
              v-model="form.newPass"
              :type="new_visible"
              :state="validateState('newPass')"
              aria-describedby="newpass-feedback"
              :placeholder="`${$t('dashboard.newPass')}`"
            ></b-form-input>

            <b-input-group-append is-text @click="toggleVisible('new')">
              <i class="flaticon-eye" :class="new_visible === 'text' ? 'visible' : ''"></i>
            </b-input-group-append>

            <b-form-invalid-feedback id="newpass-feedback">
              {{ $t("msg.required") }}
            </b-form-invalid-feedback>
          </b-input-group>
        </b-form-group>

        <b-form-group label-for="repeatpass-input">
          <b-input-group class="input-group-merge">
            <b-form-input
              class="form-control h-auto"
              id="repeatpass-input"
              name="repeatpass-input"
              v-model="form.repeatPass"
              :type="repeat_visible"
              :state="validateState('repeatPass')"
              aria-describedby="repeatpass-feedback"
              :placeholder="`${$t('dashboard.repeatPass')}`"
            ></b-form-input>

            <b-input-group-append is-text @click="toggleVisible('repeat')">
              <i class="flaticon-eye" :class="repeat_visible === 'text' ? 'visible' : ''"></i>
            </b-input-group-append>

            <b-form-invalid-feedback id="repeatpass-feedback">
              {{ $t("msg.required") }}
            </b-form-invalid-feedback>
          </b-input-group>
        </b-form-group>

        <!-- Action -->
        <div class="col-md-12 p-0 mt-4 action">
          <b-button variant="primary" class="save-btn" type="submit" :disabled="is_loading">
            {{ $t("button.confirm") }}
          </b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Holiday Dialog -->
    <b-modal
      v-model="holiday_dialog"
      hide-footer
      no-close-on-backdrop
      size="lg"
      :title="`${$t('title.myHoliday')}`"
      @close="resetHolidays"
    >
      <div class="col-md-12 p-0 mb-2" style="display: flex">
        <div class="col-md-4 font-weight-bold">
          {{ $t("timesheet.startDate") }}
        </div>
        <div class="col-md-4 font-weight-bold">
          {{ $t("timesheet.endDate") }}
        </div>
      </div>
      <!-- Add holiday -->
      <div class="col-md-12 p-0 mb-5" style="display: flex">
        <div class="col-md-4">
          <b-input-group>
            <b-form-input v-model="start_formatted" type="text" autocomplete="off" readonly></b-form-input>
            <b-input-group-append>
              <b-form-datepicker
                v-model="start"
                :locale="locale"
                :start-weekday="1"
                button-only
                right
                @context="formatStartDate"
              ></b-form-datepicker>
            </b-input-group-append>
          </b-input-group>
        </div>
        <div class="col-md-4">
          <b-input-group>
            <b-form-input v-model="end_formatted" type="text" autocomplete="off" readonly></b-form-input>
            <b-input-group-append>
              <b-form-datepicker
                v-model="end"
                :locale="locale"
                :start-weekday="1"
                button-only
                right
                @context="formatEndDate"
              ></b-form-datepicker>
            </b-input-group-append>
          </b-input-group>
        </div>
        <div class="col-md-4">
          <b-button variant="primary" class="submit-btn" @click="addHoliday" :disabled="is_loading">
            <i class="flaticon2-check-mark p-0"></i>
          </b-button>
        </div>
      </div>

      <!-- Holiday list -->
      <div v-for="(item, i) in currentUserHolidays" :key="i" class="col-md-12 p-0 mb-2" style="display: flex">
        <div class="col-md-4">
          <b-form-input :value="formatDate(item.start)" type="text" disabled></b-form-input>
        </div>
        <div class="col-md-4">
          <b-form-input :value="formatDate(item.end)" type="text" disabled></b-form-input>
        </div>
        <div class="col-md-4">
          <b-button variant="danger" class="submit-btn" @click="deleteHoliday(item.id)">
            <i class="flaticon2-rubbish-bin p-0"></i>
          </b-button>
        </div>
      </div>
    </b-modal>

    <!-- Report dialog -->
    <b-modal
      v-model="report_dialog"
      hide-footer
      no-close-on-backdrop
      size="lg"
      :title="`${$t('title.myTimeReport')}`"
      @close="resetReport"
    >
      <div class="row">
        <div class="col-md-4">
          <b-input-group>
            <b-form-input v-model="start_report_formatted" type="text" autocomplete="off" readonly></b-form-input>
            <b-input-group-append>
              <b-form-datepicker
                v-model="start_report"
                :locale="locale"
                :start-weekday="1"
                button-only
                right
                @context="formatReportDate"
              ></b-form-datepicker>
            </b-input-group-append>
          </b-input-group>
        </div>
        <div class="col-md-4">
          <b-input-group>
            <b-form-input v-model="end_report_formatted" type="text" autocomplete="off" readonly></b-form-input>
            <b-input-group-append>
              <b-form-datepicker
                v-model="end_report"
                :locale="locale"
                :start-weekday="1"
                button-only
                right
                @context="formatReportDate"
              ></b-form-datepicker>
            </b-input-group-append>
          </b-input-group>
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-md-12">
          <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_holiday" @click="printHoliday">
            <i class="flaticon2-printer p-0 mr-2"></i>
            <span>{{ $t("button.printpdf") }}</span>
          </b-button>
          <b-button variant="info" @click="openPreviewHoliday">
            <i class="flaticon-eye p-0 mr-2"></i>
            <span>{{ $t("button.preview") }}</span>
          </b-button>
        </div>
      </div>
    </b-modal>

    <!-- Confirm delete dialog -->
    <b-modal v-model="confirm_delete_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delHoliday") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmDeleteHoliday" :disabled="is_loading">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<style scoped>
#kt_quick_user {
  overflow: hidden;
}

.extend-btn {
  width: 100%;
}

.edit-icon {
  position: absolute;
  right: 0.5rem;
  bottom: 0;
}

.avatar:hover >>> .edit-icon,
.visible {
  color: #3699ff;
}

.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
