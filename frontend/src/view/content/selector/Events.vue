<template>
  <div>
    <draggable
      :item-key="(el) => currentEvents.indexOf(el)"
      :list="currentEvents"
      class="item-group"
      ghost-class="ghost"
      @start="dragging = true"
      @end="dragging = false"
      handle=".handle"
    >
      <template #item="{ element: item, index: i }">
        <div>
          <div class="row mb-2">
            <div class="col-md-5 term-name">
              <b-form-input
                :id="`name_${i}`"
                class="term-input"
                size="sm"
                v-model="currentEvents[i].label"
                :disabled="disabled"
                @change="setEventName(i)"
                @input="setEdited()"
              ></b-form-input>
            </div>
            <div class="col-md-5">
              <b-form-input
                :id="`value_${i}`"
                :value="currentEvents[i].value"
                size="sm"
                type="text"
                @blur="setEventValue(i)"
                @input="setEdited()"
                :disabled="disabled"
                style="text-align: right"
              ></b-form-input>
            </div>
            <div class="col-md-2">
              <i v-show="!disabled" class="flaticon2-sort handle"></i>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Actions -->
    <div class="col-md-10 px-1 action">
      <b-button v-show="!disabled" variant="primary" class="minus-btn mr-2" size="sm" @click="remove">
        <i class="flaticon2-line p-0"></i>
      </b-button>
      <b-button v-show="!disabled" variant="primary" class="plus-btn" size="sm" @click="add">
        <i class="flaticon2-plus p-0"></i>
      </b-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import draggable from "vuedraggable";
import { SET_EVENT, ADD_EVENT, REMOVE_EVENT, RESET_EVENTS, SET_EVENT_EDITED } from "@/core/services/store/offer";

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  components: {
    draggable
  },
  data() {
    return {
      dragging: true
    };
  },
  computed: {
    ...mapGetters(["currentEvents"])
  },
  destroyed() {
    this.$store.commit(RESET_EVENTS);
    this.$store.commit(SET_EVENT_EDITED, false);
  },
  methods: {
    add() {
      const item = { label: "", value: "" };
      this.$store.commit(ADD_EVENT, item);
      this.setEdited();
    },
    remove() {
      this.$store.commit(REMOVE_EVENT);
      this.setEdited();
    },
    setEventName(id) {
      const item = document.getElementById(`name_${id}`);
      this.$store.commit(SET_EVENT, { field: "label", value: item.value });
    },
    setEventValue(id) {
      const item = document.getElementById(`value_${id}`);
      this.$store.commit(SET_EVENT, {
        id: id,
        field: "value",
        value: item.value ? item.value : ""
      });
    },
    setEdited() {
      this.$store.commit(SET_EVENT_EDITED, true);
    }
  }
};
</script>

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
}

.term-name {
  display: flex;
  align-items: center;
}
</style>
