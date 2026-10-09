<template>
  <div>
    <b-table
      bordered
      head-variant="light"
      :items="employees"
      :fields="emp_fields"
    >
      <template v-slot:cell(name)="row">
        {{ row.item.first_name + " " + row.item.last_name }}
      </template>
      <template v-slot:cell(hours_noted)="row">
        {{ row.item.hours_noted.toFixed(2) }}
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
          thStyle: { width: "50%" }
        },
        {
          key: "hours_noted",
          label: this.$t("timeOverview.notedHours"),
          thStyle: { width: "50%" }
        }
      ]
    };
  }
};
</script>
