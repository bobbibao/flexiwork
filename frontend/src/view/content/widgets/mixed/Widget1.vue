<template>
  <!--begin::Mixed Widget 1-->
  <div class="card card-custom bg-gray-100 gutter-b">
    <!--begin::Body-->
    <div class="card-body p-0 position-relative overflow-hidden rounded-lg">
      <v-img src="/media/bg/bg-1.jpg" alt="bg">
        <h3 class="font-weight-bolder text-white py-8 welcome-text">
          {{ $t("dashboard.hello") }}, {{ currentUser.email }}
        </h3>
      </v-img>
      <!--begin::Stats-->
      <div class="card-spacer mt-n20">
        <!--begin::Row-->
        <div class="row m-0">
          <div class="col bg-light-success px-6 py-8 rounded-xl adr-block">
            <span class="svg-icon svg-icon-3x svg-icon-success d-block my-2">
              <inline-svg src="media/svg/icons/Communication/Add-user.svg" />
            </span>
            <router-link to="/address/create" v-slot="{ href, navigate }">
              <a
                :href="href"
                class="text-success font-weight-bold font-size-h6"
                @click="navigate"
              >
                {{ $t("title.createAddress") }}
              </a>
            </router-link>
          </div>
          <div class="col bg-light-warning px-6 py-8 rounded-xl offer-block">
            <span class="svg-icon svg-icon-3x svg-icon-warning d-block my-2">
              <inline-svg src="media/svg/icons/Files/Selected-file.svg" />
            </span>
            <router-link to="/offer/create" v-slot="{ href, navigate }">
              <a
                :href="href"
                class="text-warning font-weight-bold font-size-h6"
                @click="navigate"
              >
                {{ $t("title.createOffer") }}
              </a>
            </router-link>
          </div>
        </div>
        <!--end::Row-->
        <!--begin::Row-->
        <div class="row m-0">
          <div class="col bg-light-primary px-6 py-8 rounded-xl pr-block">
            <span class="svg-icon svg-icon-3x svg-icon-primary d-block my-2">
              <inline-svg src="media/svg/icons/Layout/Layout-grid.svg" />
            </span>
            <router-link to="/project/create" v-slot="{ href, navigate }">
              <a
                :href="href"
                class="text-primary font-weight-bold font-size-h6"
                @click="navigate"
              >
                {{ $t("title.createProject") }}
              </a>
            </router-link>
          </div>
          <div class="col bg-light-danger px-6 py-8 rounded-xl inv-block">
            <span class="svg-icon svg-icon-3x svg-icon-danger d-block my-2">
              <inline-svg src="media/svg/icons/Shopping/Chart-bar1.svg" />
            </span>
            <router-link to="/invoice/create" v-slot="{ href, navigate }">
              <a
                :href="href"
                class="text-danger font-weight-bold font-size-h6"
                @click="navigate"
              >
                {{ $t("title.createInvoice") }}
              </a>
            </router-link>
          </div>
        </div>
        <!--end::Row-->
      </div>
      <!--end::Stats-->
      <!--end::Body-->
    </div>
    <!--end::Mixed Widget 1-->
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "widget-1",
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["layoutConfig", "currentUser"])
  }
};
</script>

<style scoped>
.welcome-text {
  position: absolute;
  left: 2rem;
}

.adr-block {
  margin-right: 1.75rem;
  margin-bottom: 1.75rem;
}

.offer-block {
  margin-bottom: 1.75rem;
}

.pr-block {
  margin-right: 1.75rem;
}

@media screen and (max-width: 1280px) {
  .adr-block {
    margin-right: 0;
  }

  .pr-block {
    margin-right: 0;
    margin-bottom: 1.75rem;
  }
}
</style>
