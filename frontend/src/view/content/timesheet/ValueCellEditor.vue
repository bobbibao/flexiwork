<template>
  <input
    class="timesheet-number-input"
    type="number"
    v-model="value"
    ref="input"
    min="0"
    style="width: 100%"
    @dblclick="editComment"
    @wheel="$event.target.blur()"
  />
</template>

<script>
export default {
  name: "ValueCellEditor",
  data() {
    return {
      value: null,
      comment: null
    };
  },
  methods: {
    /* Component Editor Lifecycle methods */
    // the final value to send to the grid, on completion of editing
    getValue() {
      return {
        value: parseFloat(this.value) || null,
        comment: this.comment
      };
    },

    // Gets called once before editing starts, to give editor a chance to
    // cancel the editing before it even starts.
    isCancelBeforeStart() {
      return false;
    },

    editComment() {
      const res = window.prompt("Edit comment", this.comment || "");
      if (res !== null) {
        this.comment = res;
        this.params.stopEditing();
      }
    }
  },
  mounted() {
    this.value = this.params.value ? parseFloat(this.params.value.value) : null;
    if (!Number.isFinite(this.value)) {
      this.value = null;
    }
    this.comment = this.params.value ? this.params.value.comment : null;
    this.$nextTick(() => {
      this.$refs.input.focus();
      this.$refs.input.select();
    });
  }
};
</script>

<style lang="scss">
.timesheet-number-input {
  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  -moz-appearance: textfield;
}
</style>
