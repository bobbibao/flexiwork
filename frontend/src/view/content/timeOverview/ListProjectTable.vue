<template>
  <div>
    <b-table
      id="table"
      hover
      bordered
      head-variant="light"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      :items="projects"
      :fields="project_fields"
    >
      <template v-slot:cell(name)="row">
        <div class="name-cell" @click="$emit('toggle', row)">
          {{ row.item.name }}
        </div>
      </template>
      <template v-slot:cell(total_hours)="row">
        <div class="text-center">
          {{ row.item.total_hours.toFixed(2) + "h" }}
        </div>
      </template>
      <template v-slot:cell(project_time)="row">
        <div class="text-center">
          {{ row.item.project_time.toFixed(2) + "h" }}
        </div>
      </template>
      <template v-slot:cell(status)="row">
        <b-progress
          height="20px"
          :max="100"
          :variant="renderVariant(row.item.total_hours, row.item.project_time)"
        >
          <b-progress-bar
            :value="
              renderProductiveTime(row.item.total_hours, row.item.project_time)
            "
            :label="
              `${renderPercent(row.item.total_hours, row.item.project_time)}%`
            "
          ></b-progress-bar>
        </b-progress>
      </template>

      <template v-slot:row-details="row">
        <div v-for="(item, i) in row.item.tasks" :key="i">
          <table
            style="
              width: 100%;
              justify-content: center;
              border-collapse: collapse;
              page-break-inside: auto;"
          >
            <tr>
              <td style="width:10%;"></td>
              <td style="width:30%;">
                <div class="font-weight-bold">{{ item.company_name }}</div>
                <div v-for="(record, j) in item.stats" :key="j" class="pl-5">
                  {{ record.name }}
                </div>
              </td>
              <td style="width:10%;">
                <div class="text-center">
                  {{ item.company_hours_project.toFixed(2) + "h" }}
                </div>
                <div
                  v-for="(record, j) in item.stats"
                  :key="j"
                  class="text-center"
                >
                  {{ record.hours_project.toFixed(2) + "h" }}
                </div>
              </td>
              <td style="width:10%;">
                <div class="text-center">
                  {{ item.company_hours_noted.toFixed(2) + "h" }}
                </div>
                <div
                  v-for="(record, j) in item.stats"
                  :key="j"
                  class="text-center"
                >
                  {{ record.hours_noted.toFixed(2) + "h" }}
                </div>
              </td>
              <td style="width:20%; vertical-align:middle">
                <!-- company progress -->
                <b-progress
                  height="18px"
                  :max="100"
                  :variant="renderVariant(item.company_hours_project, item.company_hours_noted)"
                  class="mb-2"
                >
                  <b-progress-bar
                    :value="
                      renderProductiveTime(
                        item.company_hours_project,
                        item.company_hours_noted
                      )
                    "
                    :label="
                      `${renderPercent(
                        item.company_hours_project,
                        item.company_hours_noted
                      )}%`
                    "
                  ></b-progress-bar>
                </b-progress>
                <!-- task progress -->
                <b-progress
                  v-for="(record, j) in item.stats"
                  :key="j"
                  height="15px"
                  :max="100"
                  :variant="
                    renderVariant(record.hours_project, record.hours_noted)
                  "
                  class="mb-1"
                >
                  <b-progress-bar
                    :value="
                      renderProductiveTime(
                        record.hours_project,
                        record.hours_noted
                      )
                    "
                    :label="
                      `${renderPercent(
                        record.hours_project,
                        record.hours_noted
                      )}%`
                    "
                  ></b-progress-bar>
                </b-progress>
              </td>
            </tr>
          </table>
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
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
      sortBy: "project_nbr",
      sortDesc: false,
      project_fields: [
        {
          key: "project_nbr",
          label: this.$t("timeOverview.number"),
          thStyle: { width: "10%" }
        },
        {
          key: "name",
          label: this.$t("timeOverview.project"),
          thStyle: { width: "30%" }
        },
        {
          key: "total_hours",
          label: this.$t("timeOverview.totalAvailable"),
          thStyle: { width: "10%" }
        },
        {
          key: "project_time",
          label: this.$t("timeOverview.notedHours"),
          thStyle: { width: "10%" }
        },
        {
          key: "status",
          label: this.$t("timeOverview.status"),
          thStyle: { width: "20%" }
        }
      ]
    };
  },
  methods: {
    renderProductiveTime(total, productive) {
      const all = parseFloat(total);
      const written = parseFloat(productive);
      if (written / all < 0 || all === 0) {
        return 0;
      } else {
        return (written / all) * 100;
      }
    },
    renderPercent(total, productive) {
      const all = parseFloat(total);
      const written = parseFloat(productive);
      if (written / all < 0 || all === 0) {
        return "0.00";
      } else {
        return ((written / all) * 100).toFixed(2);
      }
    },
    renderVariant(total, productive) {
      const all = parseFloat(total);
      const written = parseFloat(productive);
      if (written > all) {
        return "danger";
      } else {
        if (written / all >= 0.9) {
          return "warning";
        } else {
          return "success";
        }
      }
    }
  }
};
</script>

<style scoped>
.name-cell {
  cursor: pointer;
  text-decoration: underline;
}

.name-cell:hover {
  color: #3699ff;
}

#table >>> .b-table-details > td {
  padding: 0;
}
</style>
