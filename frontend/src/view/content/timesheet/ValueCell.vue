<template>
  <div>
    {{ cellValue }}
    <div v-if="comment" class="comment-tag" />
  </div>
</template>

<script>
import { numberFormatter } from "./utils/formatters";

export default {
  name: "ValueCell",
  data: function() {
    return {
      cellValue: null,
      comment: null
    };
  },
  beforeMount() {
    // this.params contains the cell & row information and is made available to this component at creation time
    // see ICellRendererParams below for more details
    const { value, comment } = this.getValueToDisplay(this.params);
    this.cellValue = value;
    this.comment = comment;
  },
  methods: {
    // gets called whenever the user gets the cell to refresh
    refresh(params) {
      // set value into cell again
      const { value, comment } = this.getValueToDisplay(params);
      this.cellValue = value;
      this.comment = comment;
    },

    getValueToDisplay(params) {
      if (params.value) {
        let value = numberFormatter(params.value.value) || null;
        if (value && params.data.type === "summary") {
          value += "h";
        }
        return {
          value,
          comment: params.value.comment || null
        };
      }
      return {
        value: null,
        comment: null
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.comment-tag {
  position: absolute;
  background-color: #e53935;
  height: 15px;
  width: 15px;
  right: -7px;
  top: -7px;
  transform: rotate(45deg);
}
</style>
