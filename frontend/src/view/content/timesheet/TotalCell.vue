<template>
  <div>
    {{ cellValue }}
  </div>
</template>

<script>
import { sumBy, get } from "lodash";

export default {
  name: "TotalCell",
  data: function() {
    return {
      cellValue: null
    };
  },
  beforeMount() {
    // this.params contains the cell & row information and is made available to this component at creation time
    // see ICellRendererParams below for more details
    this.cellValue = this.getValueToDisplay(this.params);
  },
  methods: {
    // gets called whenever the user gets the cell to refresh
    refresh(params) {
      // set value into cell again
      this.cellValue = this.getValueToDisplay(params);
    },

    getValueToDisplay(params) {
      if (params.data.type === "summary" && params.data.id === "flexible") {
        // hide for flex hours
        return null;
      }
      if (params.data.type === "sheet") {
        let total = 0;
        params.api.forEachNode(node => {
          if (
            node.data.type === "workitem" &&
            node.data.project_id === params.data.project_id
          ) {
            const values = Object.values(node.data).filter(
              v => typeof v === "object"
            );
            total += sumBy(values, v => get(v, "value", 0));
          }
        });

        return total.toFixed(2) + "h";
      }
      const values = Object.values(params.data).filter(
        v => typeof v === "object"
      );
      return sumBy(values, v => get(v, "value", 0)).toFixed(2) + "h";
    }
  }
};
</script>
