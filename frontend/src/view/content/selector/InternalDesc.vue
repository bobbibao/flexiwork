<template>
  <div>
    <div class="row mt-4">
      <div class="col-md-4">
        <div v-for="(item, i) in currentInternalChoices" :key="i">
          <div v-if="i < 4" class="mb-2">
            <b-form-checkbox
              :id="`internal_choice_${i}`"
              size="md"
              :checked="item.is_active"
              :disabled="disabled"
              @change="setChoiceValue(item)"
            >
              {{ item.label }}
            </b-form-checkbox>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div v-for="(item, i) in currentInternalChoices" :key="i">
          <div v-if="i >= 4" class="mb-2">
            <b-form-checkbox
              :id="`internal_choice_${i}`"
              size="md"
              :checked="item.is_active"
              :disabled="disabled"
              @change="setChoiceValue(item)"
            >
              {{ item.label }}
            </b-form-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import {
  SET_INTERNAL_CHOICE,
  RESET_INTERNAL_CHOICES,
  SET_INTERNAL_EDITED
} from "@/core/services/store/offer";

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(["currentInternalChoices"])
  },
  destroyed() {
    this.$store.commit(RESET_INTERNAL_CHOICES);
    this.$store.commit(SET_INTERNAL_EDITED, false);
  },
  methods: {
    setChoiceValue(item) {
      this.$store.commit(SET_INTERNAL_CHOICE, {
        label: item.label,
        is_active: !item.is_active
      });
      this.$store.commit(SET_INTERNAL_EDITED, true);
    }
  }
};
</script>
