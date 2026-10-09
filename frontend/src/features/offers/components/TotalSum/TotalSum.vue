<script lang="ts">
import TotalSum from "./TotalSum";
export default TotalSum;
</script>

<template>
  <div class="total-sum">
    <div class="d-flex total-cards">
      <div class="card flex-fill">
        <div class="card-body">
          <WalletIcon />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.sumNet") }}</h5>
            <div class="total-value">
              {{ formatMoney(sumNet) }}
            </div>
          </div>
        </div>
      </div>
      <div class="card flex-fill">
        <div class="card-body">
          <WalletIcon />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.sumGross") }}</h5>
            <div class="total-value">
              {{ formatMoney(sumGross) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./TotalSum.scss";
</style>
