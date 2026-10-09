<template>
  <div class="additional-cost">
    <ContentEditor
      :value="additionalDesc"
      @input="updateAdditionalDesc"
      :disabled="disabled"
      :display="false"
      v-if="showAdditionalDesc"
    />
    <div>{{ $t("offer.kilometers") }}</div>
    <div class="km-dropdown col-3 px-0">
      <b-form-select
        :value="selected_km_label"
        :options="defaultKmOptions"
        value-field="label"
        text-field="label"
        @change="setKm"
        :disabled="disabled"
      ></b-form-select>
    </div>
    <div class="choices" v-for="(additionalCost, i) in defaultAdditionalOptions" v-bind:key="i">
      <div class="choice-item">
        <input
          type="checkbox"
          :checked="additionalCost.is_active"
          @change="setAddCost(additionalCost)"
          :disabled="disabled"
        />
        <div class="desc-message">{{ additionalCost.label }}<br />{{ additionalCost.value }}%</div>
      </div>
    </div>
    <div class="choice-total d-flex flex-row gap-2">
      <span>Nebenkosten Prozent:</span>
      <span
        ><b>{{ calculatedTotalPerCent() || 0 }}%</b></span
      >
    </div>
    <div class="d-flex flex-row justify-content-center">
      <ButtonCustom
        :text="$t('button.additional')"
        size="md"
        @click="handleButtonClick"
        :disabled="disabled"
        customClass="additional-button"
      />
    </div>
  </div>
</template>

<script lang="ts">
import AdditionalCosts from "./AdditionalCosts";
export default AdditionalCosts;
</script>

<style lang="scss" scoped>
@import "./AdditionalCosts.scss";
</style>
