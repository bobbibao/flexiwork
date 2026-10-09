<template>
  <div>
    <b-table bordered head-variant="light" :items="employees" :fields="fields">
      <template v-slot:cell(january)>
        {{ "" }}
      </template>
      <template v-slot:cell(february)>
        {{ "" }}
      </template>
      <template v-slot:cell(march)>
        {{ "" }}
      </template>
      <template v-slot:cell(april)>
        {{ "" }}
      </template>
      <template v-slot:cell(may)>
        {{ "" }}
      </template>
      <template v-slot:cell(june)>
        {{ "" }}
      </template>
      <template v-slot:cell(july)>
        {{ "" }}
      </template>
      <template v-slot:cell(august)>
        {{ "" }}
      </template>
      <template v-slot:cell(september)>
        {{ "" }}
      </template>
      <template v-slot:cell(october)>
        {{ "" }}
      </template>
      <template v-slot:cell(november)>
        {{ "" }}
      </template>
      <template v-slot:cell(december)>
        {{ "" }}
      </template>
    </b-table>
  </div>
</template>

<script>
export default {
  props: {
    employees: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      fields: [
        {
          key: "name",
          label: this.$t("timeOverview.employee"),
          thStyle: { width: "20%" }
        },
        {
          key: "january",
          label: this.$t("months.jan")
        },
        {
          key: "february",
          label: this.$t("months.feb")
        },
        {
          key: "march",
          label: this.$t("months.mar")
        },
        {
          key: "april",
          label: this.$t("months.apr")
        },
        {
          key: "may",
          label: this.$t("months.may")
        },
        {
          key: "june",
          label: this.$t("months.jun")
        },
        {
          key: "july",
          label: this.$t("months.jul")
        },
        {
          key: "august",
          label: this.$t("months.aug")
        },
        {
          key: "september",
          label: this.$t("months.sep")
        },
        {
          key: "october",
          label: this.$t("months.oct")
        },
        {
          key: "november",
          label: this.$t("months.nov")
        },
        {
          key: "december",
          label: this.$t("months.dec")
        }
      ]
    };
  }
};
</script>
