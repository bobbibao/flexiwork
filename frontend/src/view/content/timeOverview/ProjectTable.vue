<template>
  <div>
    <b-table
      bordered
      head-variant="light"
      :items="projects"
      :fields="project_fields"
    >
      <template v-slot:cell(total_sum)="row">
        {{ formatMoney(row.item.total_sum) }}
      </template>
      <template v-slot:cell(hours_project)="row">
        <div>
          {{ row.item.hours_project.toFixed(2) + "h" }}
        </div>
      </template>
      <template v-slot:cell(hours_noted)="row">
        <div>
          {{ row.item.hours_noted.toFixed(2) + "h" }}
        </div>
      </template>
      <template v-slot:cell(hours_available)="row">
        <div>
          {{ row.item.hours_available.toFixed(2) + "h" }}
        </div>
      </template>
      <template v-slot:cell(used)="row">
        <div>
          {{
            row.item.hours_available != 0
              ? (
                  (row.item.hours_noted / row.item.hours_available) *
                  100
                ).toFixed(2) + "%"
              : "0%"
          }}
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import currency from "currency.js";

export default {
  props: {
    projects: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      project_fields: [
        {
          key: "name",
          label: this.$t("timeOverview.position"),
          thStyle: { width: "20%" }
        },
        {
          key: "total_sum",
          label: this.$t("timeOverview.totalSum"),
          thStyle: { width: "15%" }
        },
        {
          key: "hours_project",
          label: this.$t("timeOverview.hourProject"),
          thStyle: { width: "15%" }
        },
        {
          key: "hours_available",
          label: this.$t("timeOverview.totalAvailable"),
          thStyle: { width: "15%" }
        },
        {
          key: "hours_noted",
          label: this.$t("timeOverview.notedHours"),
          thStyle: { width: "15%" }
        },
        {
          key: "used",
          label: this.$t("timeOverview.hourUsed"),
          thStyle: { width: "10%" }
        },
        {
          key: "rate",
          label: this.$t("timeOverview.rate"),
          thStyle: { width: "10%" }
        }
      ]
    };
  },
  methods: {
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
