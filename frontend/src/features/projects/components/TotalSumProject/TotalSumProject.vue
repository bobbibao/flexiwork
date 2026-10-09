<script lang="ts">
import TotalSumProject from "./TotalSumProject";
export default TotalSumProject;
</script>

<template>
  <div class="total-sum-project">
    <div class="d-flex total-cards">
      <div class="card flex-fill">
        <div class="card-body">
          <CreditCard width="44" height="44" />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.sumActive") }}</h5>
            <div class="total-value">
              {{ total_active_projects }}
            </div>
          </div>
        </div>
      </div>
      <div class="card flex-fill">
        <div class="card-body">
          <CreditCard width="44" height="44" />
          <div class="card-info">
            <h5 class="card-title">{{ $t("project.totalAmount") }}</h5>
            <div class="total-value">
              {{ formatMoney(total_project_amount) }}
            </div>
          </div>
        </div>
      </div>
      <div class="card flex-fill">
        <div class="card-body">
          <CreditCard width="44" height="44" />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.totalRemainingAmount") }}</h5>
            <div class="total-value">
              {{ formatMoney(total_remaining_amount) }}
            </div>
          </div>
        </div>
      </div>
      <div class="card flex-fill">
        <div class="card-body">
          <CreditCard width="44" height="44" />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.totalOutstandingNetAmount") }}</h5>
            <div class="total-value">
              {{ formatMoney(total_open_net_amount) }}
            </div>
          </div>
        </div>
      </div>
      <div class="card flex-fill">
        <div class="card-body">
          <CreditCard width="44" height="44" />
          <div class="card-info">
            <h5 class="card-title">{{ $t("dashboard.totalOutstandingGrossAmount") }}</h5>
            <div class="total-value">
              {{ formatMoney(total_open_gross_amount) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./TotalSumProject.scss";
</style>
