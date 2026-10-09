<template>
  <div>
    <b-table
      bordered
      head-variant="light"
      :items="employees"
      :fields="emp_fields"
    >
      <template v-slot:cell(project_time)="row">
        {{ row.item.project_time.toFixed(2) }}
      </template>
      <template v-slot:cell(unbillable_time)="row">
        {{ row.item.unbillable_time.toFixed(2) }}
      </template>
      <template v-slot:cell(logged_hours)="row">
        {{ row.item.logged_hours.toFixed(2) }}
      </template>
      <template v-slot:cell(total_hours)="row">
        {{ row.item.total_hours.toFixed(2) }}
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
      emp_fields: [
        {
          key: "name",
          label: this.$t("timeOverview.employee"),
          thStyle: { width: "20%" }
        },
        {
          key: "logged_hours",
          label: this.$t("timeOverview.notedHours"),
          thStyle: { width: "20%" }
        },
        {
          key: "project_time",
          label: this.$t("timeOverview.projectTime"),
          thStyle: { width: "20%" }
        },
        {
          key: "unbillable_time",
          label: this.$t("timeOverview.unbillable"),
          thStyle: { width: "20%" }
        },
        {
          key: "total_hours",
          label: this.$t("timeOverview.totalHours"),
          thStyle: { width: "20%" }
        }
      ]
    };
  }
};
</script>
