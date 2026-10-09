<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-body p-0 position-relative overflow-hidden rounded-xl">
        <h3 class="font-weight-bolder py-8 px-6">
          {{ $t("title.revenue") }}
        </h3>
        <div v-if="loading" class="text-center text-danger my-2 mb-10">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <div v-else class="card-spacer mt-10">
          <div class="row m-0">
            <div class="col-md-1 p-0 legend-wrapper">
              <div class="legend font-weight-bold">
                {{ currency + " (" + $t("dashboard.thousands") + ")" }}
              </div>
            </div>
            <div class="col-md-11 p-0">
              <apexchart
                id="revenue-chart"
                type="area"
                height="365"
                :options="options"
                :series="series"
              ></apexchart>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { GET_DASHBOARD_REVENUE } from "@/core/services/store/dashboard";

export default {
  props: {
    currency: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      loading: true,
      options: {
        chart: {
          toolbar: {
            show: false
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: [
            this.$t("months.jan"),
            this.$t("months.feb"),
            this.$t("months.mar"),
            this.$t("months.apr"),
            this.$t("months.may"),
            this.$t("months.jun"),
            this.$t("months.jul"),
            this.$t("months.aug"),
            this.$t("months.sep"),
            this.$t("months.oct"),
            this.$t("months.nov"),
            this.$t("months.dec")
          ]
        }
      },
      series: []
    };
  },
  computed: {
    ...mapGetters(["currentRevenue"])
  },
  async mounted() {
    await this.$store.dispatch(GET_DASHBOARD_REVENUE);
    this.series = this.currentRevenue;
    this.loading = !this.loading;
  }
};
</script>

<style scoped>
#revenue-chart {
  width: 1100px;
}

.legend {
  writing-mode: vertical-rl;
  transform: scale(-1);
}

.legend-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media screen and (max-width: 1920px) {
  #revenue-chart {
    width: 900px;
  }
}

@media screen and (min-width: 1600px) and (max-width: 1900px) {
  #revenue-chart {
    width: 800px;
  }
}

@media screen and (min-width: 1440px) and (max-width: 1599px) {
  #revenue-chart {
    width: 600px;
  }
}

@media screen and (max-width: 1280px) {
  #revenue-chart {
    width: 500px;
  }
}
</style>
